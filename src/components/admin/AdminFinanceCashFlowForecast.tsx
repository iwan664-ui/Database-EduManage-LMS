import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { DatabaseState, SchoolExpenseItem, StudentInvoiceItem } from '../../types';
import { FinanceService } from '../../services/financeService';
import { SheetsService } from '../../services/sheetsService';
import { useToast } from '../Toast';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface AdminFinanceCashFlowForecastProps {
  invoices: StudentInvoiceItem[];
  database: DatabaseState;
  expenses: SchoolExpenseItem[];
  onlyActiveStudents: boolean;
  filterYear: string;
  filterMonth: string;
  timeFilterLabel: string;
}

type ForecastScenario = 'konservatif' | 'moderat' | 'optimis';
type ForecastHorizon = 3 | 6;

interface CashFlowTimelinePoint {
  monthKey: string;
  monthLabel: string;
  fullMonth: string;
  kind: 'historis' | 'proyeksi';
  pendapatanAktual: number | null;
  pendapatanProyeksi: number | null;
  batasBawah: number | null;
  batasAtas: number | null;
  estimasiPengeluaran: number;
  kasBersih: number;
  basisSppAktif: number;
  pencairanPiutang: number;
}

interface ForecastTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: CashFlowTimelinePoint }>;
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

function addMonths(yearMonth: string, offset: number): string {
  const [yStr, mStr] = yearMonth.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10) - 1;
  const target = new Date(year, month + offset, 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthStrings(yearMonth: string): { short: string; full: string } {
  const [y, m] = yearMonth.split('-');
  const idx = parseInt(m, 10) - 1;
  return {
    short: `${MONTH_SHORT[idx] || m} '${(y || '').slice(2)}`,
    full: `${MONTH_FULL[idx] || m} ${y}`,
  };
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

function ForecastTooltip({ active, payload }: ForecastTooltipProps) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const p = payload[0].payload;
  const isProyeksi = p.kind === 'proyeksi';
  const mainIncome = isProyeksi ? p.pendapatanProyeksi || 0 : p.pendapatanAktual || 0;

  return (
    <div className="bg-slate-950/95 text-white rounded-xl p-3.5 shadow-xl border border-slate-800 text-xs min-w-[250px]">
      <div className="pb-2 mb-2 border-b border-slate-800 flex items-center justify-between gap-3">
        <span className="font-bold text-white">{p.fullMonth}</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isProyeksi ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'
          }`}
        >
          {isProyeksi ? 'Proyeksi' : 'Realisasi Sheets'}
        </span>
      </div>

      <div className="space-y-1.5 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-300">
            {isProyeksi ? 'Proyeksi Pendapatan' : 'Pendapatan Aktual'}
          </span>
          <span className={`font-bold ${isProyeksi ? 'text-sky-300' : 'text-emerald-300'}`}>
            {FinanceService.formatRupiah(mainIncome)}
          </span>
        </div>

        {isProyeksi && p.batasBawah !== null && p.batasAtas !== null && (
          <div className="pl-2.5 border-l border-slate-700 space-y-0.5 text-[11px] text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <span className="font-sans">Potensi SPP Siswa Aktif</span>
              <span>{FinanceService.formatRupiah(p.basisSppAktif)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-sans">Pencairan Piutang</span>
              <span>{FinanceService.formatRupiah(p.pencairanPiutang)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-slate-400">
              <span className="font-sans">Rentang Estimasi</span>
              <span>
                {formatCompactRp(p.batasBawah)} – {formatCompactRp(p.batasAtas)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-amber-300">
            {isProyeksi ? 'Estimasi Pengeluaran' : 'Pengeluaran Aktual'}
          </span>
          <span className="font-bold text-amber-300">
            {FinanceService.formatRupiah(p.estimasiPengeluaran)}
          </span>
        </div>

        <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between gap-4">
          <span className="font-sans font-bold text-slate-200">
            {p.kasBersih >= 0 ? 'Arus Kas Bersih (+)' : 'Defisit Kas (-)'}
          </span>
          <span className={`font-extrabold ${p.kasBersih >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {p.kasBersih >= 0 ? '+' : ''}
            {FinanceService.formatRupiah(p.kasBersih)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminFinanceCashFlowForecast({
  invoices,
  database,
  expenses,
  onlyActiveStudents,
  filterYear,
  filterMonth,
  timeFilterLabel,
}: AdminFinanceCashFlowForecastProps) {
  const { showToast } = useToast();
  const [scenario, setScenario] = useState<ForecastScenario>('moderat');
  const [horizon, setHorizon] = useState<ForecastHorizon>(3);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const hasSheetsConfigured = Boolean(SheetsService.getScriptUrl());

  const handleSyncSheets = async () => {
    if (!hasSheetsConfigured) {
      showToast(
        'Menggunakan Histori Lokal & Cache Sheets',
        'URL Google Apps Script belum diatur. Proyeksi tetap dihitung dari data histori siswa tersimpan.',
        'info'
      );
      return;
    }
    setIsSyncing(true);
    const res = await SheetsService.fetchFromSpreadsheet();
    setIsSyncing(false);
    if (res.success) {
      showToast(
        'Data Google Sheets Disinkronkan',
        `Proyeksi arus kas diperbarui berdasarkan ${res.data?.master_siswa.length || database.master_siswa.length} siswa aktif.`,
        'success'
      );
    } else {
      showToast('Sinkronisasi Tertunda', res.error || 'Menggunakan data cache lokal.', 'warning');
    }
  };

  // Compute historical baseline + forward forecast from real Google Sheets & payment history
  const forecastModel = useMemo(() => {
    const feeRate = SheetsService.getFeeRate();
    const activeStudentCount = database.master_siswa.length;

    // 1. Aggregate actual monthly income & expense history
    const monthBucket = new Map<
      string,
      { income: number; expense: number; sessions: Set<string> }
    >();

    const ensureBucket = (key: string) => {
      if (!monthBucket.has(key)) {
        monthBucket.set(key, { income: 0, expense: 0, sessions: new Set<string>() });
      }
      return monthBucket.get(key)!;
    };

    invoices.forEach((inv) => {
      inv.riwayat_bayar.forEach((pay) => {
        if (!pay.tanggal || pay.tanggal.length < 7) return;
        const key = pay.tanggal.slice(0, 7);
        ensureBucket(key).income += Number(pay.jumlah || 0);
      });
    });

    expenses.forEach((exp) => {
      if (!exp.tanggal || exp.tanggal.length < 7) return;
      const key = exp.tanggal.slice(0, 7);
      ensureBucket(key).expense += Number(exp.nominal || 0);
    });

    database.log_absensi.forEach((abs) => {
      if (!abs.tanggal || abs.tanggal.length < 7) return;
      const key = abs.tanggal.slice(0, 7);
      ensureBucket(key).sessions.add(`${abs.tanggal}_${abs.id_kelas}`);
    });

    const sortedHistoryKeys = Array.from(monthBucket.keys()).sort((a, b) => a.localeCompare(b));
    const nowMonthKey = new Date().toISOString().slice(0, 7);
    const isTimeFiltered = filterYear !== 'all' || filterMonth !== 'all';

    let anchorMonthKey: string;
    let selectedHistoryKeys: string[];

    if (filterYear !== 'all' && filterMonth !== 'all') {
      anchorMonthKey = `${filterYear}-${filterMonth}`;
      selectedHistoryKeys = sortedHistoryKeys.filter((k) => k <= anchorMonthKey).slice(-4);
    } else if (filterYear !== 'all') {
      const yearKeys = sortedHistoryKeys.filter((k) => k.startsWith(`${filterYear}-`));
      anchorMonthKey = yearKeys[yearKeys.length - 1] || `${filterYear}-12`;
      selectedHistoryKeys = yearKeys.slice(-4);
    } else if (filterMonth !== 'all') {
      const monthKeys = sortedHistoryKeys.filter((k) => k.slice(5, 7) === filterMonth);
      anchorMonthKey =
        monthKeys[monthKeys.length - 1] || `${nowMonthKey.slice(0, 4)}-${filterMonth}`;
      selectedHistoryKeys = monthKeys.slice(-4);
    } else {
      anchorMonthKey = sortedHistoryKeys[sortedHistoryKeys.length - 1] || nowMonthKey;
      selectedHistoryKeys = sortedHistoryKeys.slice(-4);
    }

    const historicalPoints: CashFlowTimelinePoint[] = selectedHistoryKeys.map((key) => {
      const b = monthBucket.get(key)!;
      const labels = formatMonthStrings(key);
      const totalExp = b.expense + b.sessions.size * feeRate;
      return {
        monthKey: key,
        monthLabel: labels.short,
        fullMonth: labels.full,
        kind: 'historis',
        pendapatanAktual: b.income,
        pendapatanProyeksi: null,
        batasBawah: null,
        batasAtas: null,
        estimasiPengeluaran: totalExp,
        kasBersih: b.income - totalExp,
        basisSppAktif: b.income,
        pencairanPiutang: 0,
      };
    });

    // 2. Compute historical collection metrics from filtered invoice records
    const scopedInvoices = !isTimeFiltered
      ? invoices
      : invoices.filter((inv) => {
          const ref = (inv.jatuh_tempo || inv.dibuat_pada || '').slice(0, 7);
          if (ref.length < 7) return false;
          if (filterYear !== 'all' && filterMonth !== 'all') {
            return ref <= anchorMonthKey;
          }
          const [y, m] = ref.split('-');
          if (filterYear !== 'all' && y !== filterYear) return false;
          if (filterMonth !== 'all' && m !== filterMonth) return false;
          return true;
        });

    const totalBilledNet = scopedInvoices.reduce(
      (s, inv) => s + FinanceService.computeNetAmount(inv),
      0
    );
    const totalCollected = scopedInvoices.reduce((s, inv) => {
      if (filterYear !== 'all' && filterMonth !== 'all') {
        const paidAsOfAnchor = inv.riwayat_bayar
          .filter((p) => p.tanggal && p.tanggal.slice(0, 7) <= anchorMonthKey)
          .reduce((sum, p) => sum + Number(p.jumlah || 0), 0);
        return s + paidAsOfAnchor;
      }
      return s + Number(inv.terbayar || 0);
    }, 0);
    const totalPendingReceivable = scopedInvoices.reduce((s, inv) => {
      if (filterYear !== 'all' && filterMonth !== 'all') {
        const net = FinanceService.computeNetAmount(inv);
        const paidAsOfAnchor = inv.riwayat_bayar
          .filter((p) => p.tanggal && p.tanggal.slice(0, 7) <= anchorMonthKey)
          .reduce((sum, p) => sum + Number(p.jumlah || 0), 0);
        return s + Math.max(0, net - paidAsOfAnchor);
      }
      return s + FinanceService.computeRemaining(inv);
    }, 0);

    const baseCollectionRate =
      totalBilledNet > 0 ? Math.min(0.98, Math.max(0.4, totalCollected / totalBilledNet)) : 0.75;

    // Average monthly SPP net per invoice
    const sppInvoices = scopedInvoices.filter((inv) => inv.kategori === 'SPP Bulanan');
    const avgSppFee =
      sppInvoices.length > 0
        ? Math.round(
            sppInvoices.reduce((s, inv) => s + FinanceService.computeNetAmount(inv), 0) /
              sppInvoices.length
          )
        : 1750000;

    // Historical average monthly income & expense
    const historyCount = Math.max(1, historicalPoints.length);
    const avgHistoricalIncome = Math.round(
      historicalPoints.reduce((s, p) => s + (p.pendapatanAktual || 0), 0) / historyCount
    );
    const avgHistoricalExpense = Math.round(
      historicalPoints.reduce((s, p) => s + p.estimasiPengeluaran, 0) / historyCount
    );

    // Compute MoM historical income growth slope (capped for stability)
    let momGrowthFactor = 0.02;
    if (historicalPoints.length >= 2) {
      const first = historicalPoints[0].pendapatanAktual || 0;
      const last = historicalPoints[historicalPoints.length - 1].pendapatanAktual || 0;
      if (first > 0) {
        const rawSlope = (last - first) / first / (historicalPoints.length - 1);
        momGrowthFactor = Math.max(-0.08, Math.min(0.12, rawSlope));
      }
    }

    // Scenario modifiers
    const scenarioConfig: Record<
      ForecastScenario,
      { label: string; rateOffset: number; recoveryRate: number; growthBias: number }
    > = {
      konservatif: {
        label: 'Konservatif',
        rateOffset: -0.12,
        recoveryRate: 0.35,
        growthBias: -0.02,
      },
      moderat: {
        label: 'Moderat (Realistis)',
        rateOffset: 0,
        recoveryRate: 0.6,
        growthBias: 0,
      },
      optimis: {
        label: 'Optimis',
        rateOffset: 0.1,
        recoveryRate: 0.85,
        growthBias: 0.03,
      },
    };

    const cfg = scenarioConfig[scenario];
    const effectiveCollectionRate = Math.min(0.98, Math.max(0.3, baseCollectionRate + cfg.rateOffset));

    // Blend historical run-rate with active Google Sheets student capacity
    // If many students haven't been billed yet, active capacity scales gradually with collection efficiency
    const potentialFullMonthlySpp = activeStudentCount * avgSppFee;
    const blendedBaseline =
      avgHistoricalIncome > 0
        ? Math.round(avgHistoricalIncome * 0.55 + potentialFullMonthlySpp * effectiveCollectionRate * 0.45)
        : Math.round(potentialFullMonthlySpp * effectiveCollectionRate);

    // Allocate pending receivables recovery across the first 2 forecast months
    const expectedRecoveryTotal = Math.round(totalPendingReceivable * cfg.recoveryRate);

    const forecastPoints: CashFlowTimelinePoint[] = Array.from({ length: horizon }).map((_, idx) => {
      const step = idx + 1;
      const mKey = addMonths(anchorMonthKey, step);
      const labels = formatMonthStrings(mKey);

      const stepGrowth = 1 + (momGrowthFactor + cfg.growthBias) * step;
      const basisSppAktif = Math.max(0, Math.round(blendedBaseline * stepGrowth));

      // Recover 65% of expected receivable recovery in Month +1, 35% in Month +2
      const pencairanPiutang =
        step === 1
          ? Math.round(expectedRecoveryTotal * 0.65)
          : step === 2
            ? Math.round(expectedRecoveryTotal * 0.35)
            : 0;

      const proyeksiMasuk = basisSppAktif + pencairanPiutang;
      const estimasiPengeluaran = Math.round(avgHistoricalExpense * (1 + 0.015 * step));
      const batasBawah = Math.round(proyeksiMasuk * 0.88);
      const batasAtas = Math.round(proyeksiMasuk * 1.12);

      return {
        monthKey: mKey,
        monthLabel: labels.short,
        fullMonth: labels.full,
        kind: 'proyeksi',
        pendapatanAktual: null,
        pendapatanProyeksi: proyeksiMasuk,
        batasBawah,
        batasAtas,
        estimasiPengeluaran,
        kasBersih: proyeksiMasuk - estimasiPengeluaran,
        basisSppAktif,
        pencairanPiutang,
      };
    });

    const timeline = [...historicalPoints, ...forecastPoints];
    const totalProjectedIncome = forecastPoints.reduce(
      (s, p) => s + (p.pendapatanProyeksi || 0),
      0
    );
    const totalProjectedExpense = forecastPoints.reduce(
      (s, p) => s + p.estimasiPengeluaran,
      0
    );
    const totalProjectedNet = totalProjectedIncome - totalProjectedExpense;

    return {
      timeline,
      forecastPoints,
      anchorLabel: formatMonthStrings(anchorMonthKey).full,
      lastHistoricalLabel: historicalPoints[historicalPoints.length - 1]?.monthLabel || '',
      baseCollectionPct: Math.round(baseCollectionRate * 100),
      effectiveCollectionPct: Math.round(effectiveCollectionRate * 100),
      avgSppFee,
      activeStudentCount,
      expectedRecoveryTotal,
      totalProjectedIncome,
      totalProjectedExpense,
      totalProjectedNet,
    };
  }, [
    invoices,
    database.master_siswa.length,
    database.log_absensi,
    expenses,
    scenario,
    horizon,
    filterYear,
    filterMonth,
  ]);

  return (
    <section
      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5"
      aria-label="Prediksi Arus Kas"
    >
      {/* Header & Interactive Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600 shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Prediksi Arus Kas (Cash Flow Forecast)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Proyeksi dari histori {onlyActiveStudents ? 'siswa aktif' : 'seluruh siswa'} · Basis:{' '}
            <span className="font-semibold text-slate-700">{timeFilterLabel}</span> (acuan{' '}
            <span className="font-semibold text-slate-700">{forecastModel.anchorLabel}</span>) · Kolektibilitas{' '}
            <span className="font-mono font-bold text-slate-700 tabular-nums">
              {forecastModel.baseCollectionPct}%
            </span>{' '}
            · Potensi {forecastModel.activeStudentCount} siswa Google Sheets (rata-rata SPP{' '}
            <span className="font-mono font-bold text-slate-700 tabular-nums">
              {FinanceService.formatRupiah(forecastModel.avgSppFee)}
            </span>
            /bln)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Scenario Selector */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            {(
              [
                { id: 'konservatif', label: 'Konservatif' },
                { id: 'moderat', label: 'Moderat' },
                { id: 'optimis', label: 'Optimis' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScenario(opt.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  scenario === opt.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Horizon Selector */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setHorizon(3)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                horizon === 3
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3 Bulan
            </button>
            <button
              type="button"
              onClick={() => setHorizon(6)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                horizon === 6
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Bulan
            </button>
          </div>

          <button
            type="button"
            onClick={handleSyncSheets}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Google Sheets'}</span>
          </button>
        </div>
      </div>

      {/* 3 Projection Summary Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">
            Proyeksi Pendapatan ({horizon} Bln Ke Depan)
          </div>
          <div className="text-lg sm:text-xl font-black text-sky-700 font-mono tabular-nums">
            {FinanceService.formatRupiah(forecastModel.totalProjectedIncome)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            Asumsi kolektibilitas {forecastModel.effectiveCollectionPct}% · Skenario{' '}
            <span className="capitalize font-sans font-semibold text-slate-700">{scenario}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">
            Estimasi Pencairan Piutang Berjalan
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 font-mono tabular-nums">
            {FinanceService.formatRupiah(forecastModel.expectedRecoveryTotal)}
          </div>
          <div className="text-[11px] text-slate-500">
            Proyeksi pelunasan tunggakan pada 2 bulan pertama
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">
            Proyeksi Arus Kas Bersih ({horizon} Bln)
          </div>
          <div
            className={`text-lg sm:text-xl font-black font-mono tabular-nums ${
              forecastModel.totalProjectedNet >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {forecastModel.totalProjectedNet >= 0 ? '+' : ''}
            {FinanceService.formatRupiah(forecastModel.totalProjectedNet)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            Setelah estimasi biaya {FinanceService.formatRupiah(forecastModel.totalProjectedExpense)}
          </div>
        </div>
      </div>

      {/* Main Forecast Recharts ComposedChart + Monthly Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Recharts ComposedChart */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/90 bg-slate-50/40 p-4">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={forecastModel.timeline}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="forecastBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatCompactRp}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                />
                <Tooltip content={<ForecastTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', fontWeight: 600 }} />

                {forecastModel.lastHistoricalLabel && (
                  <ReferenceLine
                    x={forecastModel.lastHistoricalLabel}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="batasAtas"
                  name="Batas Atas Proyeksi"
                  stroke="none"
                  fill="url(#forecastBandGrad)"
                  connectNulls={false}
                />
                <Bar
                  dataKey="pendapatanAktual"
                  name="Realisasi Masuk (Aktual)"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={34}
                />
                <Bar
                  dataKey="pendapatanProyeksi"
                  name="Proyeksi Pendapatan"
                  fill="#0284c7"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={34}
                />
                <Line
                  type="monotone"
                  dataKey="estimasiPengeluaran"
                  name="Pengeluaran / Estimasi"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 3, fill: '#ffffff', stroke: '#d97706', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Forecast Monthly Table */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                Rincian Proyeksi {horizon} Bulan Ke Depan
              </h4>
              <p className="text-[11px] text-slate-500">
                SPP Siswa Aktif + Pencairan Piutang
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {hasSheetsConfigured ? 'Sheets Synced' : 'Cache Lokal'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[296px] overflow-y-auto text-xs">
            {forecastModel.forecastPoints.map((pt) => {
              const projectedIncome = pt.pendapatanProyeksi || 0;
              return (
                <div key={pt.monthKey} className="px-4 py-2.5 hover:bg-slate-50/70 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{pt.fullMonth}</span>
                    <span className="font-mono font-extrabold text-sky-700 tabular-nums">
                      {FinanceService.formatRupiah(projectedIncome)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>
                      SPP: {formatCompactRp(pt.basisSppAktif)}
                      {pt.pencairanPiutang > 0 ? ` + Piutang: ${formatCompactRp(pt.pencairanPiutang)}` : ''}
                    </span>
                    <span className={pt.kasBersih >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                      Net: {pt.kasBersih >= 0 ? '+' : ''}
                      {formatCompactRp(pt.kasBersih)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
