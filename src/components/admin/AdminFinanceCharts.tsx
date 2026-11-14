import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ActiveUser,
  DatabaseState,
  SchoolExpenseCategory,
  SchoolExpenseItem,
  StudentInvoiceItem,
  StudentInvoiceStatus,
} from '../../types';
import { FinanceService } from '../../services/financeService';
import { SheetsService } from '../../services/sheetsService';
import { useToast } from '../Toast';
import { BarChart3, PieChart as PieChartIcon, Plus, Trash2, X } from 'lucide-react';

interface AdminFinanceChartsProps {
  invoices: StudentInvoiceItem[];
  database: DatabaseState;
  expenses: SchoolExpenseItem[];
  currentUser: ActiveUser;
  onlyActiveStudents: boolean;
  filterYear: string;
  filterMonth: string;
  timeFilterLabel: string;
  onResetTimeFilter?: () => void;
  activeStatusFilter: 'all' | StudentInvoiceStatus;
  onSelectStatusFilter: (status: 'all' | StudentInvoiceStatus) => void;
  onExpenseChanged: () => void;
}

interface MonthlyCashflowPoint {
  monthKey: string;
  monthLabel: string;
  fullMonth: string;
  pendapatan: number;
  honorTutor: number;
  operasional: number;
  pengeluaran: number;
  selisih: number;
  transaksiCount: number;
}

interface StatusSliceItem {
  status: StudentInvoiceStatus;
  count: number;
  totalNet: number;
  color: string;
  percentage: number;
}

interface CashflowTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: MonthlyCashflowPoint }>;
}

interface StatusTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: StatusSliceItem }>;
  metricMode: 'count' | 'amount';
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_FULL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const EXPENSE_CATEGORIES: SchoolExpenseCategory[] = [
  'Operasional & Utilitas',
  'Honor Guru & Staff',
  'Sarana & Prasarana',
  'Kegiatan Santri',
  'Lainnya',
];

const STATUS_META: Array<{ status: StudentInvoiceStatus; color: string; textClass: string }> = [
  { status: 'Lunas', color: '#059669', textClass: 'text-emerald-700' },
  { status: 'Sebagian', color: '#2563eb', textClass: 'text-blue-700' },
  { status: 'Menunggu Verifikasi', color: '#7c3aed', textClass: 'text-purple-700' },
  { status: 'Belum Bayar', color: '#d97706', textClass: 'text-amber-700' },
  { status: 'Jatuh Tempo', color: '#e11d48', textClass: 'text-rose-700' },
];

function formatMonthStrings(yearMonth: string): { short: string; full: string } {
  const [year, month] = yearMonth.split('-');
  const idx = parseInt(month, 10) - 1;
  const shortYr = year ? year.slice(2) : '';
  return {
    short: `${MONTH_SHORT[idx] || month} '${shortYr}`,
    full: `${MONTH_FULL[idx] || month} ${year}`,
  };
}

function formatCompactRupiah(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000) {
    const jt = val / 1_000_000;
    return `Rp ${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')} Jt`;
  }
  if (abs >= 1_000) {
    return `Rp ${Math.round(val / 1_000)} Rb`;
  }
  return `Rp ${val}`;
}

function CashflowTooltip({ active, payload }: CashflowTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null;
  const point = payload[0].payload;
  const isSurplus = point.selisih >= 0;

  return (
    <div className="bg-slate-950/95 text-white rounded-xl p-3.5 shadow-xl border border-slate-800 text-xs min-w-[240px]">
      <div className="pb-2 mb-2 border-b border-slate-800 flex items-center justify-between gap-3">
        <span className="font-bold text-white">{point.fullMonth}</span>
        <span className="font-mono text-[11px] text-slate-400 tabular-nums">
          {point.transaksiCount} bayar
        </span>
      </div>

      <div className="space-y-1.5 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-emerald-300 font-semibold">Pendapatan Masuk</span>
          <span className="font-bold text-emerald-300">
            {FinanceService.formatRupiah(point.pendapatan)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-rose-300 font-semibold">Total Pengeluaran</span>
          <span className="font-bold text-rose-300">
            {FinanceService.formatRupiah(point.pengeluaran)}
          </span>
        </div>

        <div className="pl-2.5 border-l border-slate-700 space-y-0.5 text-[11px] text-slate-300">
          <div className="flex items-center justify-between gap-3">
            <span className="font-sans">Honor Sesi Tutor</span>
            <span>{FinanceService.formatRupiah(point.honorTutor)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-sans">Biaya Operasional</span>
            <span>{FinanceService.formatRupiah(point.operasional)}</span>
          </div>
        </div>

        <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between gap-4">
          <span className="font-sans font-bold text-slate-200">
            {isSurplus ? 'Surplus Kas' : 'Defisit Kas'}
          </span>
          <span className={`font-extrabold ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isSurplus ? '+' : ''}
            {FinanceService.formatRupiah(point.selisih)}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusPieTooltip({ active, payload, metricMode }: StatusTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null;
  const item = payload[0].payload;

  return (
    <div className="bg-slate-950/95 text-white rounded-xl p-3 shadow-xl border border-slate-800 text-xs min-w-[200px]">
      <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-slate-800">
        <span
          className="w-2.5 h-2.5 rounded-xs shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <span className="font-bold text-white">{item.status}</span>
      </div>
      <div className="space-y-1 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-3">
          <span className="font-sans text-slate-300">Jumlah Tagihan</span>
          <span className="font-bold text-white">{item.count} tagihan</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-sans text-slate-300">Total Nominal</span>
          <span className="font-bold text-white">{FinanceService.formatRupiah(item.totalNet)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-sans text-slate-300">
            Porsi ({metricMode === 'count' ? 'Jumlah' : 'Nominal'})
          </span>
          <span className="font-bold text-emerald-300">{item.percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function AdminFinanceCharts({
  invoices,
  database,
  expenses,
  currentUser,
  onlyActiveStudents,
  filterYear,
  filterMonth,
  timeFilterLabel,
  onResetTimeFilter,
  activeStatusFilter,
  onSelectStatusFilter,
  onExpenseChanged,
}: AdminFinanceChartsProps) {
  const { showToast } = useToast();
  const [monthRange, setMonthRange] = useState<'all' | '3' | '6'>('all');
  const [pieMetricMode, setPieMetricMode] = useState<'count' | 'amount'>('count');
  const [showExpensePanel, setShowExpensePanel] = useState<boolean>(false);
  const isTimeFiltered = filterYear !== 'all' || filterMonth !== 'all';

  // Add Expense Form state
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState<SchoolExpenseCategory>('Operasional & Utilitas');
  const [expDesc, setExpDesc] = useState<string>('');
  const [expAmount, setExpAmount] = useState<number>(500000);

  // Aggregate Monthly Pendapatan vs Pengeluaran
  const monthlyCashflow = useMemo<MonthlyCashflowPoint[]>(() => {
    const feeRate = SheetsService.getFeeRate();
    const bucket = new Map<
      string,
      {
        pendapatan: number;
        operasional: number;
        sessionKeys: Set<string>;
        transaksiCount: number;
      }
    >();

    const ensureBucket = (monthKey: string) => {
      if (!bucket.has(monthKey)) {
        bucket.set(monthKey, {
          pendapatan: 0,
          operasional: 0,
          sessionKeys: new Set<string>(),
          transaksiCount: 0,
        });
      }
      return bucket.get(monthKey)!;
    };

    // 1. Pendapatan masuk dari riwayat pembayaran tagihan
    invoices.forEach((inv) => {
      inv.riwayat_bayar.forEach((pay) => {
        if (!pay.tanggal || pay.tanggal.length < 7) return;
        const monthKey = pay.tanggal.slice(0, 7);
        const entry = ensureBucket(monthKey);
        entry.pendapatan += Number(pay.jumlah || 0);
        entry.transaksiCount += 1;
      });
    });

    // 2. Pengeluaran operasional sekolah
    expenses.forEach((exp) => {
      if (!exp.tanggal || exp.tanggal.length < 7) return;
      const monthKey = exp.tanggal.slice(0, 7);
      const entry = ensureBucket(monthKey);
      entry.operasional += Number(exp.nominal || 0);
    });

    // 3. Honor sesi tutor dari log_absensi (sesi unik per tanggal + id_kelas)
    database.log_absensi.forEach((abs) => {
      if (!abs.tanggal || abs.tanggal.length < 7) return;
      const monthKey = abs.tanggal.slice(0, 7);
      const entry = ensureBucket(monthKey);
      entry.sessionKeys.add(`${abs.tanggal}_${abs.id_kelas}`);
    });

    const sortedKeys = Array.from(bucket.keys())
      .filter((key) => {
        const [y, m] = key.split('-');
        if (filterYear !== 'all' && y !== filterYear) return false;
        if (filterMonth !== 'all' && m !== filterMonth) return false;
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
    const slicedKeys =
      filterMonth !== 'all'
        ? sortedKeys
        : monthRange === '3'
          ? sortedKeys.slice(-3)
          : monthRange === '6'
            ? sortedKeys.slice(-6)
            : sortedKeys;

    return slicedKeys.map((key) => {
      const data = bucket.get(key)!;
      const labels = formatMonthStrings(key);
      const honorTutor = data.sessionKeys.size * feeRate;
      const pengeluaran = data.operasional + honorTutor;
      return {
        monthKey: key,
        monthLabel: labels.short,
        fullMonth: labels.full,
        pendapatan: data.pendapatan,
        honorTutor,
        operasional: data.operasional,
        pengeluaran,
        selisih: data.pendapatan - pengeluaran,
        transaksiCount: data.transaksiCount,
      };
    });
  }, [invoices, expenses, database.log_absensi, monthRange, filterYear, filterMonth]);

  const cashflowTotals = useMemo(() => {
    return monthlyCashflow.reduce(
      (acc, cur) => ({
        pendapatan: acc.pendapatan + cur.pendapatan,
        pengeluaran: acc.pengeluaran + cur.pengeluaran,
        selisih: acc.selisih + cur.selisih,
      }),
      { pendapatan: 0, pengeluaran: 0, selisih: 0 }
    );
  }, [monthlyCashflow]);

  // Filter invoices for Pie Chart by selected Year / Month
  const pieFilteredInvoices = useMemo(() => {
    if (!isTimeFiltered) return invoices;
    return invoices.filter((inv) => {
      const ref = (inv.jatuh_tempo || inv.dibuat_pada || '').slice(0, 7);
      if (ref.length < 7) return false;
      const [y, m] = ref.split('-');
      if (filterYear !== 'all' && y !== filterYear) return false;
      if (filterMonth !== 'all' && m !== filterMonth) return false;
      return true;
    });
  }, [invoices, filterYear, filterMonth, isTimeFiltered]);

  // Aggregate Status Pembayaran Siswa for Pie Chart
  const statusBreakdown = useMemo<StatusSliceItem[]>(() => {
    const map = new Map<StudentInvoiceStatus, { count: number; totalNet: number }>();
    STATUS_META.forEach((m) => map.set(m.status, { count: 0, totalNet: 0 }));

    pieFilteredInvoices.forEach((inv) => {
      const current = map.get(inv.status) || { count: 0, totalNet: 0 };
      current.count += 1;
      current.totalNet += FinanceService.computeNetAmount(inv);
      map.set(inv.status, current);
    });

    const grandTotalCount = pieFilteredInvoices.length;
    const grandTotalAmount = pieFilteredInvoices.reduce(
      (s, inv) => s + FinanceService.computeNetAmount(inv),
      0
    );

    return STATUS_META.map((meta) => {
      const entry = map.get(meta.status)!;
      const pct =
        pieMetricMode === 'count'
          ? grandTotalCount > 0
            ? (entry.count / grandTotalCount) * 100
            : 0
          : grandTotalAmount > 0
            ? (entry.totalNet / grandTotalAmount) * 100
            : 0;

      return {
        status: meta.status,
        count: entry.count,
        totalNet: entry.totalNet,
        color: meta.color,
        percentage: pct,
      };
    });
  }, [pieFilteredInvoices, pieMetricMode]);

  const activePieSlices = useMemo(
    () =>
      statusBreakdown.filter((item) =>
        pieMetricMode === 'count' ? item.count > 0 : item.totalNet > 0
      ),
    [statusBreakdown, pieMetricMode]
  );

  const pieCenterValue = useMemo(() => {
    if (pieMetricMode === 'count') {
      return `${pieFilteredInvoices.length}`;
    }
    const total = pieFilteredInvoices.reduce(
      (sum, inv) => sum + FinanceService.computeNetAmount(inv),
      0
    );
    return formatCompactRupiah(total);
  }, [pieFilteredInvoices, pieMetricMode]);

  const sortedExpenses = useMemo(
    () =>
      [...expenses]
        .filter((exp) => {
          if (!isTimeFiltered) return true;
          if (!exp.tanggal || exp.tanggal.length < 7) return false;
          const [y, m] = exp.tanggal.slice(0, 7).split('-');
          if (filterYear !== 'all' && y !== filterYear) return false;
          if (filterMonth !== 'all' && m !== filterMonth) return false;
          return true;
        })
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [expenses, filterYear, filterMonth, isTimeFiltered]
  );

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const res = FinanceService.addExpense({
      tanggal: expDate,
      kategori: expCategory,
      deskripsi: expDesc,
      nominal: expAmount,
      dicatat_oleh: currentUser.name,
    });
    if (!res.success) {
      showToast('Gagal Mencatat Pengeluaran', res.message, 'error');
      return;
    }
    showToast('Pengeluaran Dicatat', res.message, 'success');
    setExpDesc('');
    onExpenseChanged();
  };

  const handleDeleteExpense = (id: string) => {
    const res = FinanceService.deleteExpense(id);
    if (res.success) {
      showToast('Pengeluaran Dihapus', res.message, 'info');
      onExpenseChanged();
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT (7 cols): Grafik Batang Pendapatan vs Pengeluaran Bulanan */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Grafik Pendapatan vs Pengeluaran Bulanan
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Pendapatan ({onlyActiveStudents ? 'Siswa Aktif' : 'Seluruh Tagihan'}) dibanding Honor Tutor &amp; Operasional ·{' '}
                <span className="font-semibold text-slate-700">{timeFilterLabel}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {filterMonth === 'all' && (
                <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setMonthRange('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      monthRange === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthRange('3')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      monthRange === '3' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3 Bln
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthRange('6')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      monthRange === '6' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    6 Bln
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowExpensePanel((v) => !v)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                  showExpensePanel
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pengeluaran</span>
              </button>
            </div>
          </div>

          {monthlyCashflow.length === 0 ? (
            <div className="h-[280px] rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center px-4 gap-2">
              <BarChart3 className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-700">
                {isTimeFiltered
                  ? `Belum ada transaksi kas pada ${timeFilterLabel}`
                  : 'Belum ada data transaksi bulanan'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                {isTimeFiltered
                  ? 'Pilih bulan/tahun lain atau reset filter waktu untuk melihat keseluruhan histori kas.'
                  : 'Catat pembayaran tagihan siswa atau tambahkan pengeluaran operasional untuk menampilkan perbandingan bulanan.'}
              </p>
              {isTimeFiltered && onResetTimeFilter && (
                <button
                  type="button"
                  onClick={onResetTimeFilter}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold cursor-pointer"
                >
                  Reset Filter Waktu
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-[285px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyCashflow}
                  margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCompactRupiah}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={68}
                  />
                  <Tooltip
                    content={<CashflowTooltip />}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="pendapatan"
                    name="Pendapatan Masuk"
                    fill="#059669"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar
                    dataKey="pengeluaran"
                    name="Pengeluaran Sekolah"
                    fill="#e11d48"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bottom Cashflow Totals Strip */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Total Pendapatan</div>
              <div className="text-sm sm:text-base font-black text-emerald-700 font-mono tabular-nums">
                {FinanceService.formatRupiah(cashflowTotals.pendapatan)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Total Pengeluaran</div>
              <div className="text-sm sm:text-base font-black text-rose-700 font-mono tabular-nums">
                {FinanceService.formatRupiah(cashflowTotals.pengeluaran)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-medium">
                {cashflowTotals.selisih >= 0 ? 'Surplus Bersih' : 'Defisit Bersih'}
              </div>
              <div
                className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                  cashflowTotals.selisih >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {cashflowTotals.selisih >= 0 ? '+' : ''}
                {FinanceService.formatRupiah(cashflowTotals.selisih)}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT (5 cols): Pie Chart Status Pembayaran Siswa */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Status Pembayaran Siswa
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                {timeFilterLabel} · Klik status di bawah untuk menyaring tabel tagihan
              </p>
            </div>

            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setPieMetricMode('count')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  pieMetricMode === 'count' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jumlah
              </button>
              <button
                type="button"
                onClick={() => setPieMetricMode('amount')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  pieMetricMode === 'amount' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nominal
              </button>
            </div>
          </div>

          {activePieSlices.length === 0 ? (
            <div className="h-[220px] rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center px-4 gap-2">
              <PieChartIcon className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-700">
                {isTimeFiltered
                  ? `Belum ada tagihan pada ${timeFilterLabel}`
                  : 'Belum ada tagihan siswa'}
              </p>
              {isTimeFiltered && onResetTimeFilter && (
                <button
                  type="button"
                  onClick={onResetTimeFilter}
                  className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold cursor-pointer"
                >
                  Reset Filter Waktu
                </button>
              )}
            </div>
          ) : (
            <div className="relative w-full h-[215px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePieSlices}
                    dataKey={pieMetricMode === 'count' ? 'count' : 'totalNet'}
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={86}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {activePieSlices.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={entry.color}
                        className="cursor-pointer outline-none"
                        onClick={() =>
                          onSelectStatusFilter(
                            activeStatusFilter === entry.status ? 'all' : entry.status
                          )
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<StatusPieTooltip metricMode={pieMetricMode} />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metric Readout */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-semibold text-slate-400">
                  {pieMetricMode === 'count' ? 'Total Tagihan' : 'Total Nilai'}
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono tabular-nums leading-tight">
                  {pieCenterValue}
                </span>
              </div>
            </div>
          )}

          {/* Tabular Interactive Breakdown Legend */}
          <div className="divide-y divide-slate-100 border-t border-slate-100 text-xs">
            {statusBreakdown.map((item) => {
              const isSelected = activeStatusFilter === item.status;
              return (
                <button
                  key={item.status}
                  type="button"
                  onClick={() =>
                    onSelectStatusFilter(isSelected ? 'all' : item.status)
                  }
                  className={`w-full py-2 px-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-800 truncate">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                    <span className="text-[11px] text-slate-500">
                      {item.count} ({item.percentage.toFixed(0)}%)
                    </span>
                    <span className="font-bold text-slate-900 min-w-[92px] text-right">
                      {FinanceService.formatRupiah(item.totalNet)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expandable Inline Expense Management Panel */}
      {showExpensePanel && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Buku Pengeluaran Operasional Sekolah
              </h4>
              <p className="text-xs text-slate-500">
                Setiap catatan pengeluaran di sini langsung terakumulasi ke Grafik Pendapatan vs Pengeluaran Bulanan di atas (ditambah perhitungan otomatis Honor Sesi Tutor).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExpensePanel(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              title="Tutup panel pengeluaran"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={handleAddExpense}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
          >
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Tanggal</label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                required
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Kategori</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as SchoolExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Deskripsi Pengeluaran *</label>
              <input
                type="text"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="Contoh: Pembelian alat kebersihan & utilitas..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Nominal (Rp) *</label>
              <input
                type="number"
                min={1000}
                step={5000}
                value={expAmount}
                onChange={(e) => setExpAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                Simpan
              </button>
            </div>
          </form>

          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Tanggal</th>
                  <th className="px-4 py-2.5 font-semibold">Kategori</th>
                  <th className="px-4 py-2.5 font-semibold">Deskripsi</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Nominal</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Belum ada catatan pengeluaran operasional.
                    </td>
                  </tr>
                ) : (
                  sortedExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {exp.tanggal}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                        {exp.kategori}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{exp.deskripsi}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700 tabular-nums whitespace-nowrap">
                        {FinanceService.formatRupiah(exp.nominal)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Hapus pengeluaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
