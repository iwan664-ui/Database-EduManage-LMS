import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlumniRecord } from '../../types';
import { BarChart3, LineChart as LineChartIcon, TrendingUp } from 'lucide-react';

interface AdminAlumniGraduationTrendChartProps {
  alumni: AlumniRecord[];
  allAlumniCount: number;
  gradYearFrom: string;
  gradYearTo: string;
  onSelectGradYearFilter: (year: string) => void;
}

interface YearlyTrendPoint {
  tahunLulus: string;
  totalLulusan: number;
  ptnAtauBeasiswa: number;
  mentorAktif: number;
  yoyDelta: number | null;
  topCampuses: string[];
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: YearlyTrendPoint }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  const deltaText =
    item.yoyDelta === null
      ? 'Tahun awal pencatatan'
      : item.yoyDelta > 0
        ? `+${item.yoyDelta} dibanding tahun sebelumnya`
        : item.yoyDelta < 0
          ? `${item.yoyDelta} dibanding tahun sebelumnya`
          : 'Sama dengan tahun sebelumnya';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs max-w-[260px] space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-slate-900 tabular-nums">
          Angkatan Lulus {item.tahunLulus}
        </span>
        <span className="font-mono font-bold text-blue-700 tabular-nums">
          {item.totalLulusan} Lulusan
        </span>
      </div>

      <div className="space-y-1 text-[11px] tabular-nums pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600">PTN / Jalur Beasiswa:</span>
          <span className="font-mono font-semibold text-emerald-700">
            {item.ptnAtauBeasiswa} Alumni
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600">Mentor Aktif:</span>
          <span className="font-mono font-semibold text-slate-800">
            {item.mentorAktif} Alumni
          </span>
        </div>
        <div className="text-[11px] text-slate-500 pt-0.5">{deltaText}</div>
      </div>

      {item.topCampuses.length > 0 && (
        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 leading-snug">
          Kampus tujuan: {item.topCampuses.join(', ')}
        </div>
      )}
    </div>
  );
}

export function AdminAlumniGraduationTrendChart({
  alumni,
  allAlumniCount,
  gradYearFrom,
  gradYearTo,
  onSelectGradYearFilter,
}: AdminAlumniGraduationTrendChartProps) {
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');

  const trendData = useMemo<YearlyTrendPoint[]>(() => {
    const grouped = new Map<number, AlumniRecord[]>();
    alumni.forEach((a) => {
      const year = Number(a.tahun_lulus) || 2023;
      const list = grouped.get(year) || [];
      list.push(a);
      grouped.set(year, list);
    });

    const sortedYears = Array.from(grouped.keys()).sort((a, b) => a - b);
    return sortedYears.map((year, idx) => {
      const items = grouped.get(year) || [];
      const prevItems = idx > 0 ? grouped.get(sortedYears[idx - 1]) || [] : null;
      const ptnAtauBeasiswa = items.filter(
        (i) =>
          i.jalur_masuk_kampus === 'SNBP' ||
          i.jalur_masuk_kampus === 'SNBT / UTBK' ||
          i.jalur_masuk_kampus.startsWith('Beasiswa')
      ).length;
      const mentorAktif = items.filter((i) => i.bersedia_mentoring).length;
      const topCampuses = Array.from(
        new Set(items.map((i) => i.kampus_diterima.trim()).filter(Boolean))
      ).slice(0, 2);

      return {
        tahunLulus: String(year),
        totalLulusan: items.length,
        ptnAtauBeasiswa,
        mentorAktif,
        yoyDelta: prevItems !== null ? items.length - prevItems.length : null,
        topCampuses,
      };
    });
  }, [alumni]);

  const summary = useMemo(() => {
    if (trendData.length === 0) {
      return { avgPerYear: 0, peakLabel: '-', latestDeltaLabel: '-' };
    }
    const sum = trendData.reduce((acc, d) => acc + d.totalLulusan, 0);
    const avgPerYear = Math.round((sum / trendData.length) * 10) / 10;
    const peak = trendData.reduce(
      (best, cur) => (cur.totalLulusan >= best.totalLulusan ? cur : best),
      trendData[0]
    );
    const latest = trendData[trendData.length - 1];
    const latestDeltaLabel =
      latest.yoyDelta === null
        ? `${latest.totalLulusan} (${latest.tahunLulus})`
        : `${latest.yoyDelta >= 0 ? '+' : ''}${latest.yoyDelta} (${latest.tahunLulus})`;

    return {
      avgPerYear,
      peakLabel: `${peak.tahunLulus} (${peak.totalLulusan} alumni)`,
      latestDeltaLabel,
    };
  }, [trendData]);

  const isFilteredView = alumni.length !== allAlumniCount;
  const hasGradYearRangeFilter = gradYearFrom !== 'all' || gradYearTo !== 'all';
  const isSingleGradYearActive =
    gradYearFrom !== 'all' && gradYearFrom === gradYearTo ? gradYearFrom : null;

  const isYearWithinRange = (yearStr: string) => {
    const yr = Number(yearStr);
    if (gradYearFrom !== 'all' && yr < Number(gradYearFrom)) return false;
    if (gradYearTo !== 'all' && yr > Number(gradYearTo)) return false;
    return true;
  };

  const handleChartClick = (state: any) => {
    const clickedYear = state?.activeLabel;
    if (!clickedYear) return;
    const next = isSingleGradYearActive === String(clickedYear) ? 'all' : String(clickedYear);
    onSelectGradYearFilter(next);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      {/* Header + Chart Type Switcher (Line vs Bar) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Analisis Tren Historis Kelulusan</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{trendData.length} Tahun Angkatan</span>
            {isFilteredView && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-medium text-slate-700">
                  {alumni.length} Terfilter
                </span>
              </>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Tren Jumlah Lulusan per Tahun
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setChartMode('line')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === 'line'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Grafik Garis</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Grafik Batang</span>
            </button>
          </div>

          {hasGradYearRangeFilter && (
            <button
              type="button"
              onClick={() => onSelectGradYearFilter('all')}
              className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reset Tahun
            </button>
          )}
        </div>
      </div>

      {/* Compact Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Rata-rata / Tahun</span>
          <span className="font-mono font-bold text-slate-900 tabular-nums">
            {summary.avgPerYear} alumni
          </span>
        </div>
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Puncak Kelulusan</span>
          <span className="font-mono font-bold text-slate-900 tabular-nums">
            {summary.peakLabel}
          </span>
        </div>
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Perubahan Terakhir</span>
          <span className="font-mono font-bold text-blue-700 tabular-nums">
            {summary.latestDeltaLabel}
          </span>
        </div>
      </div>

      {trendData.length === 0 ? (
        <div className="h-[250px] flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-1">
          <TrendingUp className="w-8 h-8 text-slate-300" />
          <p>Tidak ada data kelulusan per tahun untuk divisualisasikan pada filter saat ini.</p>
        </div>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'line' ? (
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 16, left: -16, bottom: 4 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="tahunLulus"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TrendTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="totalLulusan"
                  name="Total Lulusan"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4.5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6.5, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                  className="cursor-pointer"
                />
                <Line
                  type="monotone"
                  dataKey="ptnAtauBeasiswa"
                  name="PTN / Beasiswa"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                  className="cursor-pointer"
                />
                <Line
                  type="monotone"
                  dataKey="mentorAktif"
                  name="Mentor Aktif"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 3.5, fill: '#d97706', stroke: '#ffffff', strokeWidth: 1.5 }}
                  className="cursor-pointer"
                />
              </LineChart>
            ) : (
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 16, left: -16, bottom: 4 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="tahunLulus"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TrendTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="totalLulusan"
                  name="Total Lulusan"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  className="cursor-pointer"
                >
                  {trendData.map((entry) => (
                    <Cell
                      key={`trend-total-${entry.tahunLulus}`}
                      fill="#2563eb"
                      opacity={
                        hasGradYearRangeFilter && !isYearWithinRange(entry.tahunLulus) ? 0.35 : 1
                      }
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="ptnAtauBeasiswa"
                  name="PTN / Beasiswa"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  className="cursor-pointer"
                >
                  {trendData.map((entry) => (
                    <Cell
                      key={`trend-ptn-${entry.tahunLulus}`}
                      fill="#059669"
                      opacity={
                        hasGradYearRangeFilter && !isYearWithinRange(entry.tahunLulus) ? 0.35 : 1
                      }
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="mentorAktif"
                  name="Mentor Aktif"
                  fill="#d97706"
                  radius={[6, 6, 0, 0]}
                  className="cursor-pointer"
                >
                  {trendData.map((entry) => (
                    <Cell
                      key={`trend-mentor-${entry.tahunLulus}`}
                      fill="#d97706"
                      opacity={
                        hasGradYearRangeFilter && !isYearWithinRange(entry.tahunLulus) ? 0.35 : 1
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
