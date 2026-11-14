import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { StudentInvoiceItem } from '../../types';
import { FinanceService } from '../../services/financeService';
import { ArrowDownRight, ArrowUpRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface AdminFinanceExecutiveSummaryProps {
  invoices: StudentInvoiceItem[];
  onlyActiveStudents: boolean;
  activeStudentCount: number;
  filterYear?: string;
  filterMonth?: string;
}

interface MonthlyReceivablePoint {
  monthKey: string;
  monthLabel: string;
  fullMonth: string;
  piutang: number;
  tertagih: number;
}

interface WeeklyInflowPoint {
  label: string;
  fullLabel: string;
  nominal: number;
  count: number;
}

interface MonthlyArrearsPoint {
  monthKey: string;
  monthLabel: string;
  fullMonth: string;
  tunggakan: number;
  isCurrent: boolean;
  isPrevious: boolean;
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

function formatMonthLabel(yearMonth: string): { short: string; full: string } {
  const [y, m] = yearMonth.split('-');
  const idx = parseInt(m, 10) - 1;
  const shortYear = y ? y.slice(2) : '';
  return {
    short: `${MONTH_SHORT[idx] || m} '${shortYear}`,
    full: `${MONTH_FULL[idx] || m} ${y}`,
  };
}

function getPreviousMonthKey(yearMonth: string): string {
  const [yStr, mStr] = yearMonth.split('-');
  let year = parseInt(yStr, 10);
  let month = parseInt(mStr, 10) - 1;
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatCompactRp(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const jt = value / 1_000_000;
    return `Rp ${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')} Jt`;
  }
  if (abs >= 1_000) {
    return `Rp ${Math.round(value / 1_000)} Rb`;
  }
  return `Rp ${value}`;
}

function ReceivableTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: MonthlyReceivablePoint }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-slate-950/95 text-white rounded-lg px-3 py-2 text-[11px] shadow-lg border border-slate-800 font-mono tabular-nums">
      <div className="font-sans font-bold text-slate-200 mb-1">{p.fullMonth}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-rose-300">Sisa Piutang:</span>
        <span className="font-bold text-rose-300">{FinanceService.formatRupiah(p.piutang)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-slate-400">Total Tagihan:</span>
        <span className="text-slate-200">{FinanceService.formatRupiah(p.tertagih)}</span>
      </div>
    </div>
  );
}

function InflowTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: WeeklyInflowPoint }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-slate-950/95 text-white rounded-lg px-3 py-2 text-[11px] shadow-lg border border-slate-800 font-mono tabular-nums">
      <div className="font-sans font-bold text-slate-200 mb-1">{p.fullLabel}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-emerald-300">Masuk:</span>
        <span className="font-bold text-emerald-300">{FinanceService.formatRupiah(p.nominal)}</span>
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5">{p.count} transaksi terbayar</div>
    </div>
  );
}

function ArrearsTrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: MonthlyArrearsPoint }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-slate-950/95 text-white rounded-lg px-3 py-2 text-[11px] shadow-lg border border-slate-800 font-mono tabular-nums">
      <div className="font-sans font-bold text-slate-200 mb-1">
        {p.fullMonth}
        {p.isCurrent ? ' (Bulan Ini)' : p.isPrevious ? ' (Bulan Lalu)' : ''}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-amber-300">Saldo Tunggakan:</span>
        <span className="font-bold text-amber-300">{FinanceService.formatRupiah(p.tunggakan)}</span>
      </div>
    </div>
  );
}

export function AdminFinanceExecutiveSummary({
  invoices,
  onlyActiveStudents,
  activeStudentCount,
  filterYear = 'all',
  filterMonth = 'all',
}: AdminFinanceExecutiveSummaryProps) {
  const isTimeFiltered = filterYear !== 'all' || filterMonth !== 'all';

  // Discover available months across payment history, due dates, and creation dates
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const nowMonth = new Date().toISOString().slice(0, 7);
    if (!isTimeFiltered) set.add(nowMonth);
    invoices.forEach((inv) => {
      if (inv.jatuh_tempo && inv.jatuh_tempo.length >= 7) set.add(inv.jatuh_tempo.slice(0, 7));
      if (inv.dibuat_pada && inv.dibuat_pada.length >= 7) set.add(inv.dibuat_pada.slice(0, 7));
      inv.riwayat_bayar.forEach((p) => {
        if (p.tanggal && p.tanggal.length >= 7) set.add(p.tanggal.slice(0, 7));
      });
    });
    const list = Array.from(set).filter((ym) => {
      const [y, m] = ym.split('-');
      if (filterYear !== 'all' && y !== filterYear) return false;
      if (filterMonth !== 'all' && m !== filterMonth) return false;
      return true;
    });
    if (filterYear !== 'all' && filterMonth !== 'all') {
      const exact = `${filterYear}-${filterMonth}`;
      if (!list.includes(exact)) list.push(exact);
    } else if (list.length === 0) {
      if (filterYear !== 'all') list.push(`${filterYear}-12`);
      else list.push(nowMonth);
    }
    return list.sort((a, b) => b.localeCompare(a)); // newest first
  }, [invoices, filterYear, filterMonth, isTimeFiltered]);

  // Default to current calendar month if it has activity, otherwise newest month with data
  const defaultMonth = useMemo(() => {
    if (filterYear !== 'all' && filterMonth !== 'all') {
      return `${filterYear}-${filterMonth}`;
    }
    const nowMonth = new Date().toISOString().slice(0, 7);
    if (!isTimeFiltered) {
      const hasActivityInNow = invoices.some(
        (inv) =>
          inv.jatuh_tempo?.startsWith(nowMonth) ||
          inv.riwayat_bayar.some((p) => p.tanggal.startsWith(nowMonth))
      );
      if (hasActivityInNow) return nowMonth;
    }
    return availableMonths[0] || nowMonth;
  }, [invoices, availableMonths, filterYear, filterMonth, isTimeFiltered]);

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  const effectiveMonth =
    filterYear !== 'all' && filterMonth !== 'all'
      ? `${filterYear}-${filterMonth}`
      : availableMonths.includes(selectedMonth)
        ? selectedMonth
        : defaultMonth;
  const previousMonth = getPreviousMonthKey(effectiveMonth);

  // Scoped invoices for Card 1 (Piutang Siswa) respecting active Year/Month filter
  const scopedReceivableInvoices = useMemo(() => {
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

  // 1. Total Piutang Siswa + Monthly Receivable Breakdown for Recharts AreaChart
  const receivableData = useMemo(() => {
    let totalPiutang = 0;
    let unpaidInvoiceCount = 0;
    let overdueCount = 0;
    const unpaidStudents = new Set<string>();
    const byMonth = new Map<string, { piutang: number; tertagih: number }>();

    scopedReceivableInvoices.forEach((inv) => {
      const net = FinanceService.computeNetAmount(inv);
      const rem = FinanceService.computeRemaining(inv);
      const monthKey = (inv.jatuh_tempo || inv.dibuat_pada || effectiveMonth).slice(0, 7);

      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, { piutang: 0, tertagih: 0 });
      }
      const bucket = byMonth.get(monthKey)!;
      bucket.tertagih += net;
      bucket.piutang += rem;

      if (rem > 0) {
        totalPiutang += rem;
        unpaidInvoiceCount += 1;
        unpaidStudents.add(inv.siswa);
      }
      if (inv.status === 'Jatuh Tempo') {
        overdueCount += 1;
      }
    });

    const chartPoints: MonthlyReceivablePoint[] = Array.from(byMonth.keys())
      .sort((a, b) => a.localeCompare(b))
      .slice(-6)
      .map((key) => {
        const labels = formatMonthLabel(key);
        const val = byMonth.get(key)!;
        return {
          monthKey: key,
          monthLabel: labels.short,
          fullMonth: labels.full,
          piutang: val.piutang,
          tertagih: val.tertagih,
        };
      });

    return {
      totalPiutang,
      unpaidInvoiceCount,
      overdueCount,
      unpaidStudentsCount: unpaidStudents.size,
      chartPoints,
    };
  }, [scopedReceivableInvoices, effectiveMonth]);

  // 2. Total Pembayaran Masuk Bulan Ini + Weekly Breakdown Recharts BarChart
  const monthlyInflowData = useMemo(() => {
    let currentMonthTotal = 0;
    let currentMonthTxCount = 0;
    let previousMonthTotal = 0;

    const weeklyBuckets: WeeklyInflowPoint[] = [
      { label: 'Pkn 1', fullLabel: `Pekan 1 (Tgl 1–7) · ${formatMonthLabel(effectiveMonth).full}`, nominal: 0, count: 0 },
      { label: 'Pkn 2', fullLabel: `Pekan 2 (Tgl 8–14) · ${formatMonthLabel(effectiveMonth).full}`, nominal: 0, count: 0 },
      { label: 'Pkn 3', fullLabel: `Pekan 3 (Tgl 15–21) · ${formatMonthLabel(effectiveMonth).full}`, nominal: 0, count: 0 },
      { label: 'Pkn 4+', fullLabel: `Pekan 4 (Tgl 22–31) · ${formatMonthLabel(effectiveMonth).full}`, nominal: 0, count: 0 },
    ];

    invoices.forEach((inv) => {
      inv.riwayat_bayar.forEach((pay) => {
        if (!pay.tanggal || pay.tanggal.length < 7) return;
        const mKey = pay.tanggal.slice(0, 7);
        const amt = Number(pay.jumlah || 0);

        if (mKey === effectiveMonth) {
          currentMonthTotal += amt;
          currentMonthTxCount += 1;
          const day = parseInt(pay.tanggal.slice(8, 10), 10) || 1;
          const weekIdx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
          weeklyBuckets[weekIdx].nominal += amt;
          weeklyBuckets[weekIdx].count += 1;
        } else if (mKey === previousMonth) {
          previousMonthTotal += amt;
        }
      });
    });

    const delta = currentMonthTotal - previousMonthTotal;
    const pctChange =
      previousMonthTotal > 0 ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100) : null;

    return {
      currentMonthTotal,
      currentMonthTxCount,
      previousMonthTotal,
      delta,
      pctChange,
      weeklyBuckets,
    };
  }, [invoices, effectiveMonth, previousMonth]);

  // 3. Tren Tunggakan Dibandingkan Bulan Lalu (Cumulative Unpaid Snapshot at End of Month)
  const arrearsTrendData = useMemo(() => {
    const prev2Month = getPreviousMonthKey(previousMonth);
    const prev3Month = getPreviousMonthKey(prev2Month);
    const timelineKeys = [prev3Month, prev2Month, previousMonth, effectiveMonth];

    const computeTunggakanAtEndOfMonth = (targetMonthKey: string): number => {
      let total = 0;
      invoices.forEach((inv) => {
        // Invoice applies if billed/due up to targetMonthKey
        const invOriginMonth = (inv.jatuh_tempo || inv.dibuat_pada || '').slice(0, 7);
        const createdMonth = (inv.dibuat_pada || inv.jatuh_tempo || '').slice(0, 7);
        const effectiveIssueMonth = createdMonth && createdMonth < invOriginMonth ? createdMonth : invOriginMonth;
        if (!effectiveIssueMonth || effectiveIssueMonth > targetMonthKey) return;

        const net = FinanceService.computeNetAmount(inv);
        const paidUpToMonth = inv.riwayat_bayar
          .filter((p) => p.tanggal && p.tanggal.slice(0, 7) <= targetMonthKey)
          .reduce((sum, p) => sum + Number(p.jumlah || 0), 0);

        total += Math.max(0, net - paidUpToMonth);
      });
      return total;
    };

    const points: MonthlyArrearsPoint[] = timelineKeys.map((key) => {
      const labels = formatMonthLabel(key);
      return {
        monthKey: key,
        monthLabel: labels.short,
        fullMonth: labels.full,
        tunggakan: computeTunggakanAtEndOfMonth(key),
        isCurrent: key === effectiveMonth,
        isPrevious: key === previousMonth,
      };
    });

    const currentArrears = points[points.length - 1]?.tunggakan ?? 0;
    const previousArrears = points[points.length - 2]?.tunggakan ?? 0;
    const delta = currentArrears - previousArrears;
    const pctChange =
      previousArrears > 0 ? Math.round(((currentArrears - previousArrears) / previousArrears) * 100) : null;

    return {
      currentArrears,
      previousArrears,
      delta,
      pctChange,
      points,
    };
  }, [invoices, effectiveMonth, previousMonth]);

  const effectiveMonthInfo = formatMonthLabel(effectiveMonth);
  const previousMonthInfo = formatMonthLabel(previousMonth);

  return (
    <section className="space-y-3.5" aria-label="Ringkasan Eksekutif Keuangan">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            Ringkasan Eksekutif Keuangan
          </h3>
          <p className="text-xs text-slate-500">
            Ikhtisar piutang, realisasi penerimaan kas bulan berjalan, dan perbandingan tren tunggakan terhadap bulan lalu ·{' '}
            {onlyActiveStudents ? `${activeStudentCount} santri aktif` : 'Semua data tagihan'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="exec-month-select" className="text-[11px] font-semibold text-slate-500">
            Bulan Acuan:
          </label>
          <select
            id="exec-month-select"
            value={effectiveMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m).full}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Executive Metric Cards with Recharts Sparklines / Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* CARD 1: Total Piutang Siswa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600">Total Piutang Siswa</span>
              <span className="text-[11px] font-mono font-semibold text-rose-700 tabular-nums">
                {receivableData.overdueCount} jatuh tempo
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums tracking-tight">
              {FinanceService.formatRupiah(receivableData.totalPiutang)}
            </div>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums">
              {receivableData.unpaidStudentsCount} siswa belum lunas · {receivableData.unpaidInvoiceCount} tagihan berjalan
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-semibold text-slate-400 mb-1.5">
              Sebaran Piutang per Bulan Jatuh Tempo
            </div>
            {receivableData.chartPoints.length === 0 ? (
              <div className="h-[110px] rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400">
                Belum ada data piutang
              </div>
            ) : (
              <div className="w-full h-[110px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={receivableData.chartPoints}
                    margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="piutangAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip content={<ReceivableTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="piutang"
                      stroke="#e11d48"
                      strokeWidth={2}
                      fill="url(#piutangAreaGrad)"
                      dot={{ r: 3, fill: '#ffffff', stroke: '#e11d48', strokeWidth: 2 }}
                      activeDot={{ r: 4.5, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Total Pembayaran Masuk Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600">
                Pembayaran Masuk · {effectiveMonthInfo.full}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-bold tabular-nums ${
                  monthlyInflowData.delta >= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {monthlyInflowData.delta > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : monthlyInflowData.delta < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {monthlyInflowData.pctChange !== null
                  ? `${monthlyInflowData.delta >= 0 ? '+' : ''}${monthlyInflowData.pctChange}%`
                  : monthlyInflowData.currentMonthTotal > 0
                    ? 'Baru'
                    : '0%'}
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums tracking-tight">
              {FinanceService.formatRupiah(monthlyInflowData.currentMonthTotal)}
            </div>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums">
              {monthlyInflowData.currentMonthTxCount} pembayaran masuk · Bulan lalu ({previousMonthInfo.short}):{' '}
              {FinanceService.formatRupiah(monthlyInflowData.previousMonthTotal)}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-semibold text-slate-400 mb-1.5">
              Penerimaan Kas per Pekan ({effectiveMonthInfo.short})
            </div>
            <div className="w-full h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyInflowData.weeklyBuckets}
                  margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    content={<InflowTooltip />}
                    cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                  />
                  <Bar dataKey="nominal" radius={[5, 5, 0, 0]} maxBarSize={32}>
                    {monthlyInflowData.weeklyBuckets.map((entry, idx) => (
                      <Cell
                        key={entry.label}
                        fill={entry.nominal > 0 ? '#059669' : '#e2e8f0'}
                        fillOpacity={entry.nominal > 0 ? 0.85 + idx * 0.03 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CARD 3: Tren Tunggakan Dibandingkan Bulan Lalu */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600">
                Tren Tunggakan vs Bulan Lalu
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold font-mono tabular-nums ${
                  arrearsTrendData.delta > 0
                    ? 'text-rose-700'
                    : arrearsTrendData.delta < 0
                      ? 'text-emerald-700'
                      : 'text-slate-600'
                }`}
              >
                {arrearsTrendData.delta > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : arrearsTrendData.delta < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {arrearsTrendData.delta > 0
                  ? 'Naik'
                  : arrearsTrendData.delta < 0
                    ? 'Turun'
                    : 'Stabil'}
                {arrearsTrendData.pctChange !== null
                  ? ` (${arrearsTrendData.delta > 0 ? '+' : ''}${arrearsTrendData.pctChange}%)`
                  : ''}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`text-2xl font-black font-mono tabular-nums tracking-tight ${
                  arrearsTrendData.delta > 0
                    ? 'text-rose-700'
                    : arrearsTrendData.delta < 0
                      ? 'text-emerald-700'
                      : 'text-slate-900'
                }`}
              >
                {arrearsTrendData.delta > 0 ? '+' : arrearsTrendData.delta < 0 ? '-' : ''}
                {FinanceService.formatRupiah(Math.abs(arrearsTrendData.delta))}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-mono tabular-nums">
              {effectiveMonthInfo.short}: {FinanceService.formatRupiah(arrearsTrendData.currentArrears)} vs{' '}
              {previousMonthInfo.short}: {FinanceService.formatRupiah(arrearsTrendData.previousArrears)}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1.5">
              <span>Grafik Pergerakan Tunggakan 4 Bulan Terakhir</span>
              <span className="font-mono tabular-nums text-slate-500">
                {formatCompactRp(arrearsTrendData.currentArrears)}
              </span>
            </div>
            <div className="w-full h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={arrearsTrendData.points}
                  margin={{ top: 8, right: 10, left: 6, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip content={<ArrearsTrendTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="tunggakan"
                    stroke={arrearsTrendData.delta > 0 ? '#d97706' : '#059669'}
                    strokeWidth={2.5}
                    dot={{
                      r: 3.5,
                      fill: '#ffffff',
                      stroke: arrearsTrendData.delta > 0 ? '#d97706' : '#059669',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 5,
                      fill: arrearsTrendData.delta > 0 ? '#e11d48' : '#059669',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
