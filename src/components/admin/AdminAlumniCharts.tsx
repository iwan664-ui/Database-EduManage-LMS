import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlumniCareerSector, AlumniRecord } from '../../types';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface AdminAlumniChartsProps {
  alumni: AlumniRecord[];
  allAlumniCount: number;
  activeSectorFilters: AlumniCareerSector[];
  gradYearFrom: string;
  gradYearTo: string;
  onToggleSectorFilter: (sector: AlumniCareerSector | 'all') => void;
  onSelectGradYearFilter: (year: string) => void;
}

interface SectorSliceItem {
  sector: AlumniCareerSector;
  shortLabel: string;
  count: number;
  percentage: number;
  percentageLabel: string;
  color: string;
  sampleProfessions: string[];
}

interface GradYearBarItem {
  tahunLulus: string;
  total: number;
  mentorAktif: number;
  jejaringUmum: number;
  kontakAktif: number;
  topCampuses: string[];
}

const SECTOR_COLOR_MAP: Record<AlumniCareerSector, { color: string; shortLabel: string }> = {
  'Mahasiswa / Studi Lanjut': { color: '#2563eb', shortLabel: 'Studi Lanjut' },
  'Teknologi & IT': { color: '#059669', shortLabel: 'Teknologi & IT' },
  'Kesehatan & Kedokteran': { color: '#e11d48', shortLabel: 'Kesehatan & Medis' },
  'Pendidikan & Dakwah': { color: '#7c3aed', shortLabel: 'Pendidikan & Dakwah' },
  'Bisnis & Wirausaha': { color: '#d97706', shortLabel: 'Bisnis & Wirausaha' },
  'Keuangan & Hukum': { color: '#0891b2', shortLabel: 'Keuangan & Hukum' },
  Lainnya: { color: '#64748b', shortLabel: 'Lainnya' },
};

const RADIAN = Math.PI / 180;

interface PieSliceLabelProps {
  cx?: number | string;
  cy?: number | string;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

function renderPieSliceLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieSliceLabelProps) {
  if (percent < 0.08) return null;
  const numCx = Number(cx);
  const numCy = Number(cy);
  const radius = innerRadius + (outerRadius - innerRadius) * (innerRadius > 0 ? 0.55 : 0.64);
  const x = numCx + radius * Math.cos(-midAngle * RADIAN);
  const y = numCy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      style={{ pointerEvents: 'none' }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function ProfessionPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: SectorSliceItem }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs max-w-[240px] space-y-1.5">
      <div className="font-bold text-slate-900 flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <span>{item.sector}</span>
      </div>
      <div className="font-mono font-semibold text-slate-800 tabular-nums">
        {item.count} Alumni ({item.percentageLabel})
      </div>
      {item.sampleProfessions.length > 0 && (
        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 leading-snug">
          Contoh profesi: {item.sampleProfessions.join(', ')}
        </div>
      )}
    </div>
  );
}

function GraduationBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: GradYearBarItem }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs max-w-[240px] space-y-1.5">
      <div className="font-bold text-slate-900 tabular-nums">
        Kelulusan Tahun {item.tahunLulus}
      </div>
      <div className="space-y-0.5 text-[11px] tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Total Alumni:</span>
          <span className="font-mono font-bold text-slate-900">{item.total}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Mentor Aktif:</span>
          <span className="font-mono font-semibold text-emerald-700">{item.mentorAktif}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Kontak Terhubung:</span>
          <span className="font-mono font-semibold text-blue-700">{item.kontakAktif}</span>
        </div>
      </div>
      {item.topCampuses.length > 0 && (
        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 leading-snug">
          Kampus: {item.topCampuses.join(', ')}
        </div>
      )}
    </div>
  );
}

export function AdminAlumniCharts({
  alumni,
  allAlumniCount,
  activeSectorFilters,
  gradYearFrom,
  gradYearTo,
  onToggleSectorFilter,
  onSelectGradYearFilter,
}: AdminAlumniChartsProps) {
  const [pieVariant, setPieVariant] = useState<'pie' | 'donut'>('pie');

  const sectorDistribution = useMemo<SectorSliceItem[]>(() => {
    const grouped = new Map<AlumniCareerSector, AlumniRecord[]>();
    alumni.forEach((a) => {
      const list = grouped.get(a.sektor_karier) || [];
      list.push(a);
      grouped.set(a.sektor_karier, list);
    });

    const total = alumni.length;
    return Array.from(grouped.entries())
      .map(([sector, items]) => {
        const meta = SECTOR_COLOR_MAP[sector] || SECTOR_COLOR_MAP.Lainnya;
        const professions = Array.from(
          new Set(items.map((i) => i.profesi_saat_ini.trim()).filter(Boolean))
        ).slice(0, 3);
        const rawPct = total > 0 ? Math.round((items.length / total) * 1000) / 10 : 0;
        const percentageLabel = `${Number.isInteger(rawPct) ? rawPct : rawPct.toFixed(1)}%`;

        return {
          sector,
          shortLabel: meta.shortLabel,
          count: items.length,
          percentage: rawPct,
          percentageLabel,
          color: meta.color,
          sampleProfessions: professions,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [alumni]);

  const topSector = sectorDistribution[0] || null;

  const graduationYearStats = useMemo<GradYearBarItem[]>(() => {
    const grouped = new Map<number, AlumniRecord[]>();
    alumni.forEach((a) => {
      const year = Number(a.tahun_lulus) || 2023;
      const list = grouped.get(year) || [];
      list.push(a);
      grouped.set(year, list);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, items]) => {
        const mentorAktif = items.filter((i) => i.bersedia_mentoring).length;
        const jejaringUmum = Math.max(0, items.length - mentorAktif);
        const kontakAktif = items.filter((i) => i.status_kontak === 'Aktif Terhubung').length;
        const topCampuses = Array.from(
          new Set(items.map((i) => i.kampus_diterima.trim()).filter(Boolean))
        ).slice(0, 2);

        return {
          tahunLulus: String(year),
          total: items.length,
          mentorAktif,
          jejaringUmum,
          kontakAktif,
          topCampuses,
        };
      });
  }, [alumni]);

  const isFilteredView = alumni.length !== allAlumniCount;
  const hasSectorFilter = activeSectorFilters.length > 0;
  const hasGradYearRangeFilter = gradYearFrom !== 'all' || gradYearTo !== 'all';
  const isSingleGradYearActive =
    gradYearFrom !== 'all' && gradYearFrom === gradYearTo ? gradYearFrom : null;

  const isYearWithinRange = (yearStr: string) => {
    const yr = Number(yearStr);
    if (gradYearFrom !== 'all' && yr < Number(gradYearFrom)) return false;
    if (gradYearTo !== 'all' && yr > Number(gradYearTo)) return false;
    return true;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Diagram Lingkaran (Pie Chart) Proporsi Kategori Profesi Alumni */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
              <PieChartIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Proporsi Kategori Profesi</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {alumni.length} dari {allAlumniCount} Alumni Ditampilkan
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Diagram Lingkaran Kategori Profesi Alumni
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setPieVariant('pie')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  pieVariant === 'pie'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pie
              </button>
              <button
                type="button"
                onClick={() => setPieVariant('donut')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  pieVariant === 'donut'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Donut
              </button>
            </div>

            {hasSectorFilter && (
              <button
                type="button"
                onClick={() => onToggleSectorFilter('all')}
                className="py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reset Sektor
              </button>
            )}
          </div>
        </div>

        {/* Proportion Summary Strip */}
        {topSector && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: topSector.color }}
              />
              <span className="text-slate-500">Proporsi terbesar:</span>
              <span className="font-semibold text-slate-900 truncate">{topSector.sector}</span>
            </div>
            <div className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
              {topSector.count} alumni ({topSector.percentageLabel})
            </div>
          </div>
        )}

        {sectorDistribution.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-1">
            <PieChartIcon className="w-8 h-8 text-slate-300" />
            <p>Tidak ada data profesi alumni untuk ditampilkan pada filter saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-6 h-[240px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorDistribution}
                    dataKey="count"
                    nameKey="sector"
                    cx="50%"
                    cy="50%"
                    innerRadius={pieVariant === 'donut' ? 52 : 0}
                    outerRadius={92}
                    paddingAngle={pieVariant === 'donut' ? 2 : 1}
                    labelLine={false}
                    label={renderPieSliceLabel}
                    onClick={(_data, index) => {
                      const entry = sectorDistribution[index];
                      if (!entry) return;
                      onToggleSectorFilter(entry.sector);
                    }}
                    className="cursor-pointer outline-none"
                  >
                    {sectorDistribution.map((entry) => {
                      const dimmed =
                        hasSectorFilter && !activeSectorFilters.includes(entry.sector);
                      return (
                        <Cell
                          key={entry.sector}
                          fill={entry.color}
                          opacity={dimmed ? 0.35 : 1}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<ProfessionPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {pieVariant === 'donut' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    {alumni.length}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isFilteredView ? 'Ditampilkan' : 'Alumni'}
                  </span>
                </div>
              )}
            </div>

            <div className="sm:col-span-6 space-y-1.5">
              {sectorDistribution.map((item) => {
                const isSelected = activeSectorFilters.includes(item.sector);
                return (
                  <button
                    key={item.sector}
                    type="button"
                    onClick={() => onToggleSectorFilter(item.sector)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate font-medium">{item.shortLabel}</span>
                      </span>
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          isSelected ? 'text-slate-200' : 'text-slate-600'
                        }`}
                      >
                        {item.count} ({item.percentageLabel})
                      </span>
                    </div>
                    <div
                      className={`h-1 w-full rounded-full overflow-hidden ${
                        isSelected ? 'bg-slate-700' : 'bg-slate-100'
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(4, item.percentage))}%`,
                          backgroundColor: isSelected ? '#ffffff' : item.color,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Chart 2: Bar Chart Jumlah Alumni per Tahun Kelulusan */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Sebaran Kohort Angkatan</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{graduationYearStats.length} Tahun Lulus</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Grafik Batang Alumni Berdasarkan Tahun Kelulusan
            </h3>
          </div>

          {hasGradYearRangeFilter && (
            <button
              type="button"
              onClick={() => onSelectGradYearFilter('all')}
              className="py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reset Tahun
            </button>
          )}
        </div>

        {graduationYearStats.length === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-1">
            <BarChart3 className="w-8 h-8 text-slate-300" />
            <p>Tidak ada data tahun kelulusan alumni untuk ditampilkan pada filter saat ini.</p>
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={graduationYearStats}
                margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
                onClick={(state: any) => {
                  const clickedYear = state?.activeLabel;
                  if (clickedYear) {
                    const next =
                      isSingleGradYearActive === String(clickedYear)
                        ? 'all'
                        : String(clickedYear);
                    onSelectGradYearFilter(next);
                  }
                }}
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
                <Tooltip content={<GraduationBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="mentorAktif"
                  name="Mentor Aktif"
                  stackId="alumni"
                  fill="#059669"
                  radius={[0, 0, 0, 0]}
                  className="cursor-pointer"
                >
                  {graduationYearStats.map((entry) => (
                    <Cell
                      key={`mentor-${entry.tahunLulus}`}
                      fill="#059669"
                      opacity={
                        hasGradYearRangeFilter && !isYearWithinRange(entry.tahunLulus)
                          ? 0.35
                          : 1
                      }
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="jejaringUmum"
                  name="Alumni Jejaring"
                  stackId="alumni"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  className="cursor-pointer"
                >
                  {graduationYearStats.map((entry) => (
                    <Cell
                      key={`umum-${entry.tahunLulus}`}
                      fill="#3b82f6"
                      opacity={
                        hasGradYearRangeFilter && !isYearWithinRange(entry.tahunLulus)
                          ? 0.35
                          : 1
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
