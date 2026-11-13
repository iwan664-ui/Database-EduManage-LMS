import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, Calendar, CheckCircle2, Layers, TrendingUp, Users } from 'lucide-react';
import { LogAbsensi, MasterKelas } from '../../types';

interface TutorAttendanceChartProps {
  classes: MasterKelas[];
  logs: LogAbsensi[];
  onSelectClass?: (kelasId: string) => void;
}

type ChartMode = 'per-kelas' | 'tren-sesi' | 'komposisi';

interface ClassAttendancePoint {
  id_kelas: string;
  shortName: string;
  kelas: string;
  mapel: string;
  cabang: string;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
  persenHadir: number;
  persenIzin: number;
  persenSakit: number;
  persenAlfa: number;
  sessionCount: number;
}

interface SessionTrendPoint {
  tanggal: string;
  labelTanggal: string;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
  persenHadir: number;
  kelasLabel: string;
}

interface CustomTooltipPayloadItem<T> {
  payload?: T;
  name?: string;
  value?: number;
  color?: string;
}

interface CustomTooltipProps<T> {
  active?: boolean;
  payload?: CustomTooltipPayloadItem<T>[];
  label?: string;
}

const formatShortDate = (isoDate: string): string => {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${parts[2]} ${months[monthIdx] || parts[1]}`;
};

const getBarColorByRate = (rate: number, hasData: boolean): string => {
  if (!hasData) return '#cbd5e1'; // slate-300
  if (rate >= 85) return '#10b981'; // Islamic Emerald Green
  if (rate >= 70) return '#2563eb'; // Royal Blue
  return '#f97316'; // Vibrant Orange
};

function ClassTooltip({ active, payload }: CustomTooltipProps<ClassAttendancePoint>) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-slate-950/95 text-white rounded-2xl p-3.5 shadow-xl border border-slate-800 text-xs min-w-[215px] backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
        <div>
          <p className="font-bold text-white leading-tight">{d.kelas}</p>
          <p className="text-[11px] text-blue-300 font-medium">{d.mapel}</p>
        </div>
        <span className="text-[10px] font-mono bg-white/10 text-slate-200 px-2 py-0.5 rounded-md">
          {d.id_kelas}
        </span>
      </div>

      {d.total === 0 ? (
        <p className="text-[11px] text-slate-400 italic">Belum ada catatan presensi terinput.</p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Persentase Kehadiran</span>
            <span
              className={`font-extrabold text-sm ${
                d.persenHadir >= 85
                  ? 'text-emerald-400'
                  : d.persenHadir >= 70
                    ? 'text-blue-400'
                    : 'text-orange-400'
              }`}
            >
              {d.persenHadir}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
            <div className="flex items-center justify-between bg-emerald-500/15 px-2 py-1 rounded-lg">
              <span className="text-emerald-300">Hadir</span>
              <span className="font-bold text-white">{d.hadir}</span>
            </div>
            <div className="flex items-center justify-between bg-blue-500/15 px-2 py-1 rounded-lg">
              <span className="text-blue-300">Izin</span>
              <span className="font-bold text-white">{d.izin}</span>
            </div>
            <div className="flex items-center justify-between bg-orange-500/15 px-2 py-1 rounded-lg">
              <span className="text-orange-300">Sakit</span>
              <span className="font-bold text-white">{d.sakit}</span>
            </div>
            <div className="flex items-center justify-between bg-rose-500/15 px-2 py-1 rounded-lg">
              <span className="text-rose-300">Alfa</span>
              <span className="font-bold text-white">{d.alfa}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            Total {d.total} entri dari {d.sessionCount} tanggal pertemuan
          </p>
        </div>
      )}
    </div>
  );
}

function SessionTooltip({ active, payload }: CustomTooltipProps<SessionTrendPoint>) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-slate-950/95 text-white rounded-2xl p-3.5 shadow-xl border border-slate-800 text-xs min-w-[205px] backdrop-blur-md">
      <div className="pb-2 mb-2 border-b border-slate-800">
        <p className="font-bold text-white">{d.tanggal}</p>
        <p className="text-[11px] text-blue-300">{d.kelasLabel}</p>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-300">Tingkat Kehadiran</span>
        <span
          className={`font-extrabold text-sm ${
            d.persenHadir >= 85
              ? 'text-emerald-400'
              : d.persenHadir >= 70
                ? 'text-blue-400'
                : 'text-orange-400'
          }`}
        >
          {d.persenHadir}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="flex items-center justify-between bg-emerald-500/15 px-2 py-1 rounded-lg">
          <span className="text-emerald-300">Hadir</span>
          <span className="font-bold text-white">{d.hadir}</span>
        </div>
        <div className="flex items-center justify-between bg-blue-500/15 px-2 py-1 rounded-lg">
          <span className="text-blue-300">Izin</span>
          <span className="font-bold text-white">{d.izin}</span>
        </div>
        <div className="flex items-center justify-between bg-orange-500/15 px-2 py-1 rounded-lg">
          <span className="text-orange-300">Sakit</span>
          <span className="font-bold text-white">{d.sakit}</span>
        </div>
        <div className="flex items-center justify-between bg-rose-500/15 px-2 py-1 rounded-lg">
          <span className="text-rose-300">Alfa</span>
          <span className="font-bold text-white">{d.alfa}</span>
        </div>
      </div>
    </div>
  );
}

export function TutorAttendanceChart({ classes, logs, onSelectClass }: TutorAttendanceChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('per-kelas');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Aggregasi data kehadiran per kelas yang diampu
  const classAttendanceData = useMemo<ClassAttendancePoint[]>(() => {
    return classes.map((cls) => {
      const classLogs = logs.filter((l) => l.id_kelas === cls.id_kelas);
      const hadir = classLogs.filter((l) => l.status_kehadiran === 'Hadir').length;
      const izin = classLogs.filter((l) => l.status_kehadiran === 'Izin').length;
      const sakit = classLogs.filter((l) => l.status_kehadiran === 'Sakit').length;
      const alfa = classLogs.filter((l) => l.status_kehadiran === 'Alfa').length;
      const total = classLogs.length;

      const uniqueDates = new Set(classLogs.map((l) => l.tanggal)).size;

      const persenHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;
      const persenIzin = total > 0 ? Math.round((izin / total) * 100) : 0;
      const persenSakit = total > 0 ? Math.round((sakit / total) * 100) : 0;
      const persenAlfa = total > 0 ? Math.max(0, 100 - persenHadir - persenIzin - persenSakit) : 0;

      const shortLabel = cls.mapel.length > 16 ? `${cls.mapel.slice(0, 14)}…` : cls.mapel;

      return {
        id_kelas: cls.id_kelas,
        shortName: `${shortLabel}`,
        kelas: cls.kelas,
        mapel: cls.mapel,
        cabang: cls.cabang,
        hadir,
        izin,
        sakit,
        alfa,
        total,
        persenHadir,
        persenIzin,
        persenSakit,
        persenAlfa,
        sessionCount: uniqueDates,
      };
    });
  }, [classes, logs]);

  // Aggregasi tren kehadiran kronologis per tanggal sesi
  const sessionTrendData = useMemo<SessionTrendPoint[]>(() => {
    const classIds = new Set(classes.map((c) => c.id_kelas));
    const filteredLogs = logs.filter((l) => {
      if (!classIds.has(l.id_kelas)) return false;
      if (selectedClassFilter !== 'all' && l.id_kelas !== selectedClassFilter) return false;
      return true;
    });

    const dateMap = new Map<
      string,
      { hadir: number; izin: number; sakit: number; alfa: number; kelasSet: Set<string> }
    >();

    filteredLogs.forEach((log) => {
      if (!dateMap.has(log.tanggal)) {
        dateMap.set(log.tanggal, { hadir: 0, izin: 0, sakit: 0, alfa: 0, kelasSet: new Set() });
      }
      const entry = dateMap.get(log.tanggal)!;
      entry.kelasSet.add(log.id_kelas);
      if (log.status_kehadiran === 'Hadir') entry.hadir += 1;
      else if (log.status_kehadiran === 'Izin') entry.izin += 1;
      else if (log.status_kehadiran === 'Sakit') entry.sakit += 1;
      else if (log.status_kehadiran === 'Alfa') entry.alfa += 1;
    });

    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => a.localeCompare(b));

    return sortedDates.map((tanggal) => {
      const e = dateMap.get(tanggal)!;
      const total = e.hadir + e.izin + e.sakit + e.alfa;
      const persenHadir = total > 0 ? Math.round((e.hadir / total) * 100) : 0;
      const matchedClasses = Array.from(e.kelasSet)
        .map((id) => classes.find((c) => c.id_kelas === id)?.mapel || id)
        .join(', ');

      return {
        tanggal,
        labelTanggal: formatShortDate(tanggal),
        hadir: e.hadir,
        izin: e.izin,
        sakit: e.sakit,
        alfa: e.alfa,
        total,
        persenHadir,
        kelasLabel: matchedClasses,
      };
    });
  }, [classes, logs, selectedClassFilter]);

  // Statistik ringkas header grafik
  const summaryStats = useMemo(() => {
    const classesWithLogs = classAttendanceData.filter((c) => c.total > 0);
    const totalEntri = classAttendanceData.reduce((acc, c) => acc + c.total, 0);
    const totalHadir = classAttendanceData.reduce((acc, c) => acc + c.hadir, 0);
    const overallRate = totalEntri > 0 ? Math.round((totalHadir / totalEntri) * 100) : 0;
    const bestClass =
      classesWithLogs.length > 0
        ? [...classesWithLogs].sort((a, b) => b.persenHadir - a.persenHadir)[0]
        : null;

    return {
      overallRate,
      totalEntri,
      activeLoggedClasses: classesWithLogs.length,
      bestClass,
    };
  }, [classAttendanceData]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Visualisasi Tren Persentase Kehadiran Siswa
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Grafik batang interaktif persentase kehadiran santri di setiap kelas binaan (Target Ideal: ≥ 85%).
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setChartMode('per-kelas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartMode === 'per-kelas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Per Kelas</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('tren-sesi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartMode === 'tren-sesi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tren Tanggal</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('komposisi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartMode === 'komposisi'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Status Kehadiran</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini KPI Strip & Class Filter (for Tren Tanggal mode) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Rata-rata Kehadiran:</span>
            <span className="font-extrabold text-slate-900">{summaryStats.overallRate}%</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-600">Total Catatan:</span>
            <span className="font-bold text-slate-900">{summaryStats.totalEntri} entri</span>
          </div>
          {summaryStats.bestClass && (
            <>
              <span className="text-slate-300 hidden md:inline">|</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-600">Tertinggi:</span>
                <span className="font-bold text-emerald-700">
                  {summaryStats.bestClass.mapel} ({summaryStats.bestClass.persenHadir}%)
                </span>
              </div>
            </>
          )}
        </div>

        {chartMode === 'tren-sesi' && (
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              aria-label="Filter kelas pada tren kehadiran"
              className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Kelas ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id_kelas} value={c.id_kelas}>
                  {c.kelas} — {c.mapel}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Chart Viewport */}
      {classes.length === 0 ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
          <BarChart3 className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-semibold text-slate-600">Belum ada kelas terdaftar untuk tutor ini.</p>
        </div>
      ) : chartMode === 'tren-sesi' && sessionTrendData.length === 0 ? (
        <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs px-4 text-center">
          <Calendar className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-bold text-slate-700">Belum ada log presensi untuk kelas yang dipilih</p>
          <p className="text-slate-500 mt-1">
            Silakan input presensi terlebih dahulu agar grafik tren per tanggal dapat ditampilkan.
          </p>
          {selectedClassFilter !== 'all' && onSelectClass && (
            <button
              type="button"
              onClick={() => onSelectClass(selectedClassFilter)}
              className="mt-3 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
            >
              Input Presensi Kelas Ini
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-[300px]">
          {chartMode === 'per-kelas' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classAttendanceData}
                margin={{ top: 16, right: 16, left: -12, bottom: 8 }}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ClassTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <ReferenceLine
                  y={85}
                  stroke="#f97316"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: 'Target 85%',
                    position: 'insideTopRight',
                    fill: '#ea580c',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar
                  dataKey="persenHadir"
                  name="Persentase Hadir (%)"
                  radius={[10, 10, 0, 0]}
                  maxBarSize={56}
                >
                  {classAttendanceData.map((entry) => (
                    <Cell
                      key={entry.id_kelas}
                      fill={getBarColorByRate(entry.persenHadir, entry.total > 0)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'tren-sesi' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sessionTrendData}
                margin={{ top: 16, right: 16, left: -12, bottom: 8 }}
                barCategoryGap="24%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="labelTanggal"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<SessionTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <ReferenceLine
                  y={85}
                  stroke="#f97316"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: 'Target 85%',
                    position: 'insideTopRight',
                    fill: '#ea580c',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar
                  dataKey="persenHadir"
                  name="Persentase Hadir (%)"
                  radius={[10, 10, 0, 0]}
                  maxBarSize={52}
                >
                  {sessionTrendData.map((entry) => (
                    <Cell
                      key={entry.tanggal}
                      fill={getBarColorByRate(entry.persenHadir, entry.total > 0)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'komposisi' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classAttendanceData}
                margin={{ top: 16, right: 16, left: -12, bottom: 8 }}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ClassTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconType="circle"
                />
                <Bar dataKey="persenHadir" name="Hadir (%)" stackId="status" fill="#10b981" maxBarSize={54} />
                <Bar dataKey="persenIzin" name="Izin (%)" stackId="status" fill="#2563eb" maxBarSize={54} />
                <Bar dataKey="persenSakit" name="Sakit (%)" stackId="status" fill="#f97316" maxBarSize={54} />
                <Bar
                  dataKey="persenAlfa"
                  name="Alfa (%)"
                  stackId="status"
                  fill="#ef4444"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={54}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Legend Penjelasan Warna */}
      {chartMode !== 'komposisi' && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>≥ 85% (Sangat Baik / Target Tercapai)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
              <span>70% – 84% (Cukup Baik)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
              <span>&lt; 70% (Perlu Perhatian)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
              <span>Belum ada data</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Arahkan kursor ke batang grafik untuk rincian H/I/S/A
          </span>
        </div>
      )}
    </div>
  );
}
