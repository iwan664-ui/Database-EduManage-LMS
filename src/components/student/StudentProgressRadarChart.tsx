import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { BookOpen, Calendar, GraduationCap, Radar as RadarIcon, Target, TrendingUp } from 'lucide-react';
import { LogNilai, TahfidzSetoranItem } from '../../types';

interface StudentProgressRadarChartProps {
  studentName: string;
  academicGrades: LogNilai[];
  tahfidzSetoran: TahfidzSetoranItem[];
  kkmStandard?: number;
}

type TimelineGranularity = 'bulan' | 'sesi';

interface TimelineRadarPoint {
  key: string;
  label: string;
  fullPeriod: string;
  tahfidz: number | null;
  akademik: number | null;
  kkm: number;
  tahfidzItems: TahfidzSetoranItem[];
  akademikItems: LogNilai[];
}

interface CustomTooltipPayloadItem {
  payload?: TimelineRadarPoint;
}

interface RadarTimelineTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  kkm: number;
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

function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${parts[2]} ${MONTH_SHORT[monthIdx] || parts[1]}`;
}

function formatFullDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${parts[2]} ${MONTH_FULL[monthIdx] || parts[1]} ${parts[0]}`;
}

function formatMonthAxisLabel(yearMonth: string): { short: string; full: string } {
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const shortYear = yearStr ? yearStr.slice(2) : '';
  return {
    short: `${MONTH_SHORT[monthIdx] || monthStr} '${shortYear}`,
    full: `${MONTH_FULL[monthIdx] || monthStr} ${yearStr}`,
  };
}

function roundOneDecimal(val: number): number {
  return Math.round(val * 10) / 10;
}

function formatDelta(score: number | null, kkm: number): string {
  if (score === null) return 'Belum ada data';
  const diff = roundOneDecimal(score - kkm);
  if (diff >= 0) return `+${diff.toFixed(1)} di atas KKM`;
  return `${diff.toFixed(1)} di bawah KKM`;
}

function RadarTimelineTooltip({ active, payload, kkm }: RadarTimelineTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-slate-950/95 text-white rounded-xl p-3.5 shadow-xl border border-slate-800 text-xs min-w-[245px] max-w-[300px] backdrop-blur-md">
      <div className="pb-2 mb-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
        <span className="font-bold text-white">{point.fullPeriod}</span>
        <span className="font-mono text-[11px] text-rose-300 tabular-nums">Target KKM {kkm}</span>
      </div>

      <div className="space-y-2.5">
        {/* Tahfidz Section */}
        <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-lg p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-emerald-300 font-semibold">Hafalan Tahfidz</span>
            <span className="font-mono font-bold text-sm text-white tabular-nums">
              {point.tahfidz !== null ? point.tahfidz.toFixed(1) : '—'}
            </span>
          </div>
          <div className="text-[11px] text-emerald-200/80 mt-0.5 tabular-nums">
            {formatDelta(point.tahfidz, kkm)}
          </div>
          {point.tahfidzItems.length > 0 && (
            <ul className="mt-1.5 pt-1.5 border-t border-emerald-800/50 space-y-1 text-[11px] text-slate-200">
              {point.tahfidzItems.slice(0, 2).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    QS. {item.surat} ({item.ayat_mulai}-{item.ayat_selesai})
                  </span>
                  <span className="font-mono text-emerald-300 shrink-0 tabular-nums">{item.nilai}</span>
                </li>
              ))}
              {point.tahfidzItems.length > 2 && (
                <li className="text-[10px] text-emerald-300/80">
                  +{point.tahfidzItems.length - 2} setoran lainnya
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Akademik Section */}
        <div className="bg-blue-950/50 border border-blue-800/60 rounded-lg p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-blue-300 font-semibold">Nilai Akademik</span>
            <span className="font-mono font-bold text-sm text-white tabular-nums">
              {point.akademik !== null ? point.akademik.toFixed(1) : '—'}
            </span>
          </div>
          <div className="text-[11px] text-blue-200/80 mt-0.5 tabular-nums">
            {formatDelta(point.akademik, kkm)}
          </div>
          {point.akademikItems.length > 0 && (
            <ul className="mt-1.5 pt-1.5 border-t border-blue-800/50 space-y-1 text-[11px] text-slate-200">
              {point.akademikItems.slice(0, 2).map((item) => (
                <li key={item.id_nilai} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {item.mapel} · {item.jenis_penilaian}
                  </span>
                  <span className="font-mono text-blue-300 shrink-0 tabular-nums">{item.nilai}</span>
                </li>
              ))}
              {point.akademikItems.length > 2 && (
                <li className="text-[10px] text-blue-300/80">
                  +{point.akademikItems.length - 2} penilaian lainnya
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentProgressRadarChart({
  studentName,
  academicGrades,
  tahfidzSetoran,
  kkmStandard = 85,
}: StudentProgressRadarChartProps) {
  const [granularity, setGranularity] = useState<TimelineGranularity>('bulan');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [visibleSeries, setVisibleSeries] = useState<{
    tahfidz: boolean;
    akademik: boolean;
    kkm: boolean;
  }>({
    tahfidz: true,
    akademik: true,
    kkm: true,
  });

  const availableSubjects = useMemo(() => {
    const mapels = new Set<string>();
    academicGrades.forEach((g) => {
      if (g.mapel) mapels.add(g.mapel);
    });
    return Array.from(mapels).sort();
  }, [academicGrades]);

  const filteredAcademic = useMemo(() => {
    const base =
      subjectFilter === 'all'
        ? academicGrades
        : academicGrades.filter((g) => g.mapel === subjectFilter);
    return [...base].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [academicGrades, subjectFilter]);

  const sortedTahfidz = useMemo(() => {
    return [...tahfidzSetoran].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [tahfidzSetoran]);

  const radarSeries = useMemo<TimelineRadarPoint[]>(() => {
    const bucketMap = new Map<
      string,
      {
        label: string;
        fullPeriod: string;
        tahfidzItems: TahfidzSetoranItem[];
        akademikItems: LogNilai[];
      }
    >();

    if (granularity === 'bulan') {
      sortedTahfidz.forEach((item) => {
        const key = item.tanggal.slice(0, 7); // YYYY-MM
        if (!bucketMap.has(key)) {
          const formatted = formatMonthAxisLabel(key);
          bucketMap.set(key, {
            label: formatted.short,
            fullPeriod: formatted.full,
            tahfidzItems: [],
            akademikItems: [],
          });
        }
        bucketMap.get(key)!.tahfidzItems.push(item);
      });

      filteredAcademic.forEach((item) => {
        const key = item.tanggal.slice(0, 7); // YYYY-MM
        if (!bucketMap.has(key)) {
          const formatted = formatMonthAxisLabel(key);
          bucketMap.set(key, {
            label: formatted.short,
            fullPeriod: formatted.full,
            tahfidzItems: [],
            akademikItems: [],
          });
        }
        bucketMap.get(key)!.akademikItems.push(item);
      });
    } else {
      sortedTahfidz.forEach((item) => {
        const key = item.tanggal;
        if (!bucketMap.has(key)) {
          bucketMap.set(key, {
            label: formatShortDate(key),
            fullPeriod: formatFullDate(key),
            tahfidzItems: [],
            akademikItems: [],
          });
        }
        bucketMap.get(key)!.tahfidzItems.push(item);
      });

      filteredAcademic.forEach((item) => {
        const key = item.tanggal;
        if (!bucketMap.has(key)) {
          bucketMap.set(key, {
            label: formatShortDate(key),
            fullPeriod: formatFullDate(key),
            tahfidzItems: [],
            akademikItems: [],
          });
        }
        bucketMap.get(key)!.akademikItems.push(item);
      });
    }

    const sortedKeys = Array.from(bucketMap.keys()).sort((a, b) => a.localeCompare(b));
    const slicedKeys = granularity === 'sesi' ? sortedKeys.slice(-8) : sortedKeys.slice(-12);

    return slicedKeys.map((key) => {
      const bucket = bucketMap.get(key)!;
      const tahfidzAvg =
        bucket.tahfidzItems.length > 0
          ? roundOneDecimal(
              bucket.tahfidzItems.reduce((sum, item) => sum + Number(item.nilai), 0) /
                bucket.tahfidzItems.length
            )
          : null;
      const akademikAvg =
        bucket.akademikItems.length > 0
          ? roundOneDecimal(
              bucket.akademikItems.reduce((sum, item) => sum + Number(item.nilai), 0) /
                bucket.akademikItems.length
            )
          : null;

      return {
        key,
        label: bucket.label,
        fullPeriod: bucket.fullPeriod,
        tahfidz: tahfidzAvg,
        akademik: akademikAvg,
        kkm: kkmStandard,
        tahfidzItems: bucket.tahfidzItems,
        akademikItems: bucket.akademikItems,
      };
    });
  }, [granularity, sortedTahfidz, filteredAcademic, kkmStandard]);

  const summaryStats = useMemo(() => {
    const tahfidzScores = sortedTahfidz.map((t) => Number(t.nilai));
    const academicScores = filteredAcademic.map((g) => Number(g.nilai));

    const avgTahfidz =
      tahfidzScores.length > 0
        ? roundOneDecimal(tahfidzScores.reduce((a, b) => a + b, 0) / tahfidzScores.length)
        : null;
    const avgAcademic =
      academicScores.length > 0
        ? roundOneDecimal(academicScores.reduce((a, b) => a + b, 0) / academicScores.length)
        : null;

    const validTahfidzPoints = radarSeries.filter((p) => p.tahfidz !== null);
    const validAcademicPoints = radarSeries.filter((p) => p.akademik !== null);

    const tahfidzTrend =
      validTahfidzPoints.length >= 2
        ? roundOneDecimal(
            (validTahfidzPoints[validTahfidzPoints.length - 1].tahfidz || 0) -
              (validTahfidzPoints[0].tahfidz || 0)
          )
        : null;

    const academicTrend =
      validAcademicPoints.length >= 2
        ? roundOneDecimal(
            (validAcademicPoints[validAcademicPoints.length - 1].akademik || 0) -
              (validAcademicPoints[0].akademik || 0)
          )
        : null;

    const passTahfidzCount = tahfidzScores.filter((s) => s >= kkmStandard).length;
    const passAcademicCount = academicScores.filter((s) => s >= kkmStandard).length;

    return {
      avgTahfidz,
      avgAcademic,
      tahfidzTrend,
      academicTrend,
      passTahfidzCount,
      passAcademicCount,
      totalTahfidz: tahfidzScores.length,
      totalAcademic: academicScores.length,
    };
  }, [sortedTahfidz, filteredAcademic, radarSeries, kkmStandard]);

  const toggleSeries = (key: 'tahfidz' | 'akademik' | 'kkm') => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.tahfidz && !next.akademik && !next.kkm) {
        return prev;
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <RadarIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Radar Perkembangan Tahfidz & Akademik (Target KKM {kkmStandard})
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            {studentName} · Evaluasi kronologis hafalan Al-Qur&apos;an dan capaian akademik terhadap garis standar KKM {kkmStandard}
          </p>
        </div>

        {/* Filter & Granularity Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="radar-subject-filter" className="text-[11px] font-semibold text-slate-500">
              Mapel:
            </label>
            <select
              id="radar-subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Mapel ({academicGrades.length})</option>
              {availableSubjects.map((mapel) => (
                <option key={mapel} value={mapel}>
                  {mapel}
                </option>
              ))}
            </select>
          </div>

          {/* Time Granularity Toggle */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setGranularity('bulan')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                granularity === 'bulan'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Per Bulan</span>
            </button>
            <button
              type="button"
              onClick={() => setGranularity('sesi')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                granularity === 'sesi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Per Tanggal Evaluasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip (Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Rata-rata Tahfidz
            </span>
            <span className="font-mono tabular-nums">{summaryStats.totalTahfidz} setoran</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {summaryStats.avgTahfidz !== null ? summaryStats.avgTahfidz.toFixed(1) : '—'}
            </span>
            <span
              className={`text-[11px] font-bold ${
                summaryStats.avgTahfidz === null
                  ? 'text-slate-400'
                  : summaryStats.avgTahfidz >= kkmStandard
                    ? 'text-emerald-700'
                    : 'text-amber-700'
              }`}
            >
              {summaryStats.avgTahfidz === null
                ? 'Belum ada setoran'
                : summaryStats.avgTahfidz >= kkmStandard
                  ? `Tuntas KKM (+${(summaryStats.avgTahfidz - kkmStandard).toFixed(1)})`
                  : `Perlu Penguatan (${(summaryStats.avgTahfidz - kkmStandard).toFixed(1)})`}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              Rata-rata Akademik
            </span>
            <span className="font-mono tabular-nums">{summaryStats.totalAcademic} nilai</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {summaryStats.avgAcademic !== null ? summaryStats.avgAcademic.toFixed(1) : '—'}
            </span>
            <span
              className={`text-[11px] font-bold ${
                summaryStats.avgAcademic === null
                  ? 'text-slate-400'
                  : summaryStats.avgAcademic >= kkmStandard
                    ? 'text-blue-700'
                    : 'text-amber-700'
              }`}
            >
              {summaryStats.avgAcademic === null
                ? 'Belum ada nilai'
                : summaryStats.avgAcademic >= kkmStandard
                  ? `Tuntas KKM (+${(summaryStats.avgAcademic - kkmStandard).toFixed(1)})`
                  : `Remedial (${(summaryStats.avgAcademic - kkmStandard).toFixed(1)})`}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Progres Waktu ke Waktu</span>
            <span className="text-[10px] text-slate-400">Awal vs Akhir</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div>
              <div className="text-[10px] text-slate-500">Tahfidz</div>
              <div
                className={`text-sm font-extrabold font-mono tabular-nums ${
                  summaryStats.tahfidzTrend === null
                    ? 'text-slate-400'
                    : summaryStats.tahfidzTrend >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                }`}
              >
                {summaryStats.tahfidzTrend !== null
                  ? `${summaryStats.tahfidzTrend >= 0 ? '+' : ''}${summaryStats.tahfidzTrend.toFixed(1)} poin`
                  : '—'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500">Akademik</div>
              <div
                className={`text-sm font-extrabold font-mono tabular-nums ${
                  summaryStats.academicTrend === null
                    ? 'text-slate-400'
                    : summaryStats.academicTrend >= 0
                      ? 'text-blue-700'
                      : 'text-rose-600'
                }`}
              >
                {summaryStats.academicTrend !== null
                  ? `${summaryStats.academicTrend >= 0 ? '+' : ''}${summaryStats.academicTrend.toFixed(1)} poin`
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-600" />
              Ketuntasan KKM {kkmStandard}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
            <div>
              <div className="text-[10px] text-slate-500">Setoran Tuntas</div>
              <div className="font-extrabold text-slate-900 font-mono tabular-nums">
                {summaryStats.passTahfidzCount} / {summaryStats.totalTahfidz}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500">Evaluasi Tuntas</div>
              <div className="font-extrabold text-slate-900 font-mono tabular-nums">
                {summaryStats.passAcademicCount} / {summaryStats.totalAcademic}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Recharts Radar + Chronological Table */}
      {radarSeries.length === 0 ? (
        <div className="h-[300px] rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center px-4">
          <RadarIcon className="w-9 h-9 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">
            Belum ada riwayat nilai Tahfidz maupun Akademik untuk {studentName}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Setelah guru atau pembimbing menginput setoran Tahfidz atau nilai akademik, grafik radar perkembangan terhadap target KKM {kkmStandard} akan muncul otomatis di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Recharts Radar Chart */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 space-y-3">
            {/* Interactive Series Visibility Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                Lapisan Grafik ({radarSeries.length} titik waktu)
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleSeries('tahfidz')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    visibleSeries.tahfidz
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-xs ${
                      visibleSeries.tahfidz ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  />
                  <span>Tahfidz</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSeries('akademik')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    visibleSeries.akademik
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-xs ${
                      visibleSeries.akademik ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  />
                  <span>Akademik</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSeries('kkm')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    visibleSeries.kkm
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3 border-b-2 border-dashed ${
                      visibleSeries.kkm ? 'border-rose-600' : 'border-slate-300'
                    }`}
                  />
                  <span>Target KKM {kkmStandard}</span>
                </button>
              </div>
            </div>

            {radarSeries.length < 3 && (
              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Terdapat {radarSeries.length} titik periode pada mode ini. Grafik poligon radar idealnya memerlukan minimal 3 titik waktu — Anda dapat beralih ke{' '}
                <button
                  type="button"
                  onClick={() => setGranularity(granularity === 'bulan' ? 'sesi' : 'bulan')}
                  className="font-bold underline cursor-pointer"
                >
                  mode {granularity === 'bulan' ? 'Per Tanggal Evaluasi' : 'Per Bulan'}
                </button>{' '}
                untuk melihat rincian tambahan jika tersedia.
              </div>
            )}

            <div className="w-full h-[350px] sm:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="74%" data={radarSeries}>
                  <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tickCount={6}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                  />

                  {visibleSeries.kkm && (
                    <Radar
                      name={`Target KKM (${kkmStandard})`}
                      dataKey="kkm"
                      stroke="#e11d48"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      fill="#f43f5e"
                      fillOpacity={0.04}
                      dot={false}
                    />
                  )}

                  {visibleSeries.akademik && (
                    <Radar
                      name="Nilai Akademik"
                      dataKey="akademik"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      connectNulls={true}
                      dot={{ r: 3.5, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
                      activeDot={{ r: 5.5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  {visibleSeries.tahfidz && (
                    <Radar
                      name="Kemajuan Tahfidz"
                      dataKey="tahfidz"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fill="#10b981"
                      fillOpacity={0.26}
                      connectNulls={true}
                      dot={{ r: 3.5, fill: '#ffffff', stroke: '#059669', strokeWidth: 2 }}
                      activeDot={{ r: 5.5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  <Tooltip content={<RadarTimelineTooltip kkm={kkmStandard} />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px', fontWeight: 600 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Chronological Table Breakdown */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  Log Kronologis vs Target KKM {kkmStandard}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Rincian nilai Tahfidz & Akademik per titik waktu
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {radarSeries.length} periode
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[388px] overflow-y-auto">
              {radarSeries
                .slice()
                .reverse()
                .map((point) => {
                  const tahfidzOk = point.tahfidz !== null && point.tahfidz >= kkmStandard;
                  const academicOk = point.akademik !== null && point.akademik >= kkmStandard;

                  return (
                    <div key={point.key} className="px-4 py-3 hover:bg-slate-50/80 transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{point.fullPeriod}</span>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          KKM {point.kkm}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Tahfidz */}
                        <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/70 px-2.5 py-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-emerald-800">Tahfidz</span>
                            <span className="font-mono font-extrabold text-emerald-950 tabular-nums">
                              {point.tahfidz !== null ? point.tahfidz.toFixed(1) : '—'}
                            </span>
                          </div>
                          <div className="text-[10px] mt-0.5 font-medium text-emerald-700 truncate">
                            {point.tahfidz === null
                              ? 'Tidak ada setoran'
                              : tahfidzOk
                                ? `Tuntas · QS. ${point.tahfidzItems[0]?.surat}`
                                : `Perlu Muraja'ah · QS. ${point.tahfidzItems[0]?.surat}`}
                          </div>
                        </div>

                        {/* Akademik */}
                        <div className="rounded-lg bg-blue-50/70 border border-blue-200/70 px-2.5 py-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-blue-800">Akademik</span>
                            <span className="font-mono font-extrabold text-blue-950 tabular-nums">
                              {point.akademik !== null ? point.akademik.toFixed(1) : '—'}
                            </span>
                          </div>
                          <div className="text-[10px] mt-0.5 font-medium text-blue-700 truncate">
                            {point.akademik === null
                              ? 'Tidak ada evaluasi'
                              : academicOk
                                ? `Tuntas · ${point.akademikItems[0]?.mapel}`
                                : `Remedial · ${point.akademikItems[0]?.mapel}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
