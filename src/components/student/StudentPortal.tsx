import React, { useState, useMemo } from 'react';
import { ActiveUser, DatabaseState, KehadiranStatus, SiswaEkstrakurikuler } from '../../types';
import {
  User,
  Calendar,
  CheckCircle2,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  Percent,
  Search,
  MessageSquare,
  Sparkles,
  BarChart2,
  Target,
  ChevronRight,
  Compass,
  Trophy,
  Activity,
  Layers,
  Flame,
  Check,
} from 'lucide-react';

interface StudentPortalProps {
  currentUser: ActiveUser;
  database: DatabaseState;
  onSelectOtherStudent?: (studentName: string) => void;
}

export function StudentPortal({ currentUser, database, onSelectOtherStudent }: StudentPortalProps) {
  // Tabs: 'harian' | 'bulanan' | 'grafik' | 'ekskul'
  const [activeTab, setActiveTab] = useState<'harian' | 'bulanan' | 'grafik' | 'ekskul'>('grafik');
  const [selectedStudentName, setSelectedStudentName] = useState<string>(currentUser.name);

  // Timeframe untuk Grafik Nilai: 'bulan' | 'semester' | 'tahun'
  const [chartTimeframe, setChartTimeframe] = useState<'bulan' | 'semester' | 'tahun'>('bulan');
  const [chartSubjectFilter, setChartSubjectFilter] = useState<string>('all');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

  // Standar KKM Baru: 85
  const KKM_STANDARD = 85;

  // Cari detail siswa di master_siswa
  const studentInfo = useMemo(() => {
    return database.master_siswa.find((s) => s.siswa === selectedStudentName) || {
      siswa: selectedStudentName,
      cabang: 'Kampus GDC Depok',
      email_siswa: currentUser.email || 'siswa@alwildan29.sch.id',
    };
  }, [database.master_siswa, selectedStudentName]);

  // Cari kelas-kelas yang diikuti siswa
  const enrolledClasses = useMemo(() => {
    return database.siswa_kelas.filter((sk) => sk.siswa === selectedStudentName);
  }, [database.siswa_kelas, selectedStudentName]);

  // Log Absensi siswa
  const studentAbsensi = useMemo(() => {
    return database.log_absensi
      .filter((la) => la.siswa === selectedStudentName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [database.log_absensi, selectedStudentName]);

  // Log Nilai siswa
  const studentNilai = useMemo(() => {
    return database.log_nilai
      .filter((ln) => ln.siswa === selectedStudentName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [database.log_nilai, selectedStudentName]);

  // Ekstrakurikuler yang diikuti siswa
  const studentEkskul = useMemo(() => {
    if (!database.ekstrakurikuler) return [];
    return database.ekstrakurikuler.filter((e) => e.siswa === selectedStudentName);
  }, [database.ekstrakurikuler, selectedStudentName]);

  // Metrik Bulanan Kehadiran
  const attendanceStats = useMemo(() => {
    const total = studentAbsensi.length;
    const hadir = studentAbsensi.filter((a) => a.status_kehadiran === 'Hadir').length;
    const izin = studentAbsensi.filter((a) => a.status_kehadiran === 'Izin').length;
    const sakit = studentAbsensi.filter((a) => a.status_kehadiran === 'Sakit').length;
    const alfa = studentAbsensi.filter((a) => a.status_kehadiran === 'Alfa').length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, izin, sakit, alfa, rate };
  }, [studentAbsensi]);

  // Metrik Nilai (KKM 85)
  const gradeStats = useMemo(() => {
    if (studentNilai.length === 0) return { avg: 0, highest: 0, lowest: 0, passCount: 0, passRate: 0 };
    const numbers = studentNilai.map((n) => Number(n.nilai));
    const avg = Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) / 10;
    const highest = Math.max(...numbers);
    const lowest = Math.min(...numbers);
    const passCount = numbers.filter((n) => n >= KKM_STANDARD).length;
    const passRate = Math.round((passCount / numbers.length) * 100);
    return { avg, highest, lowest, passCount, passRate };
  }, [studentNilai, KKM_STANDARD]);

  // Daftar mapel unik untuk filter grafik
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    studentNilai.forEach((n) => subs.add(n.mapel));
    return Array.from(subs);
  }, [studentNilai]);

  // Data terfilter untuk grafik
  const chartFilteredGrades = useMemo(() => {
    let list = studentNilai;
    if (chartSubjectFilter !== 'all') {
      list = list.filter((n) => n.mapel === chartSubjectFilter);
    }
    // Urutkan ascending berdasarkan tanggal untuk grafik tren kronologis
    return [...list].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [studentNilai, chartSubjectFilter]);

  // Agregasi Data Grafik: Per Bulan
  const monthlyChartData = useMemo(() => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    const grouped: { [key: string]: { label: string; scores: number[]; items: typeof studentNilai } } = {};

    chartFilteredGrades.forEach((item) => {
      const d = new Date(item.tanggal);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${monthNames[monthIdx]} ${year}`;

      if (!grouped[key]) {
        grouped[key] = { label, scores: [], items: [] };
      }
      grouped[key].scores.push(Number(item.nilai));
      grouped[key].items.push(item);
    });

    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map((key) => {
      const g = grouped[key];
      const avg = Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 10) / 10;
      const max = Math.max(...g.scores);
      const min = Math.min(...g.scores);
      const pass = g.scores.filter((s) => s >= KKM_STANDARD).length;
      return {
        key,
        periodLabel: g.label,
        avg,
        max,
        min,
        count: g.scores.length,
        passCount: pass,
        items: g.items,
      };
    });
  }, [chartFilteredGrades, KKM_STANDARD]);

  // Agregasi Data Grafik: Per Semester
  const semesterChartData = useMemo(() => {
    const grouped: { [key: string]: { label: string; scores: number[]; items: typeof studentNilai } } = {};

    chartFilteredGrades.forEach((item) => {
      const d = new Date(item.tanggal);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-12
      // Semester 1: Juli - Desember, Semester 2: Januari - Juni
      const sem = month >= 7 ? `Ganjil ${year}/${year + 1}` : `Genap ${year - 1}/${year}`;
      const semKey = month >= 7 ? `${year}-S1` : `${year}-S2`;

      if (!grouped[semKey]) {
        grouped[semKey] = { label: `Semester ${sem}`, scores: [], items: [] };
      }
      grouped[semKey].scores.push(Number(item.nilai));
      grouped[semKey].items.push(item);
    });

    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map((key) => {
      const g = grouped[key];
      const avg = Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 10) / 10;
      const max = Math.max(...g.scores);
      const min = Math.min(...g.scores);
      const pass = g.scores.filter((s) => s >= KKM_STANDARD).length;
      return {
        key,
        periodLabel: g.label,
        avg,
        max,
        min,
        count: g.scores.length,
        passCount: pass,
        items: g.items,
      };
    });
  }, [chartFilteredGrades, KKM_STANDARD]);

  // Agregasi Data Grafik: Per Tahun
  const yearlyChartData = useMemo(() => {
    const grouped: { [key: string]: { label: string; scores: number[]; items: typeof studentNilai } } = {};

    chartFilteredGrades.forEach((item) => {
      const d = new Date(item.tanggal);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const academicYear = month >= 7 ? `TP ${year}/${year + 1}` : `TP ${year - 1}/${year}`;
      const key = month >= 7 ? `${year}` : `${year - 1}`;

      if (!grouped[key]) {
        grouped[key] = { label: `Tahun Ajaran ${academicYear}`, scores: [], items: [] };
      }
      grouped[key].scores.push(Number(item.nilai));
      grouped[key].items.push(item);
    });

    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map((key) => {
      const g = grouped[key];
      const avg = Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 10) / 10;
      const max = Math.max(...g.scores);
      const min = Math.min(...g.scores);
      const pass = g.scores.filter((s) => s >= KKM_STANDARD).length;
      return {
        key,
        periodLabel: g.label,
        avg,
        max,
        min,
        count: g.scores.length,
        passCount: pass,
        items: g.items,
      };
    });
  }, [chartFilteredGrades, KKM_STANDARD]);

  // Pilihan data grafik aktif sesuai timeframe
  const activeChartDataset = useMemo(() => {
    if (chartTimeframe === 'bulan') return monthlyChartData;
    if (chartTimeframe === 'semester') return semesterChartData;
    return yearlyChartData;
  }, [chartTimeframe, monthlyChartData, semesterChartData, yearlyChartData]);

  const getStatusBadge = (status: KehadiranStatus) => {
    switch (status) {
      case 'Hadir':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Hadir</span>;
      case 'Izin':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">Izin</span>;
      case 'Sakit':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Sakit</span>;
      case 'Alfa':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Alfa</span>;
    }
  };

  const getEkskulCategoryBadge = (kategori: string) => {
    switch (kategori) {
      case 'Keagamaan & Tahfidz':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Keagamaan</span>;
      case 'Sains & Robotika':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">STEM & Robotik</span>;
      case 'Olahraga Sunnah':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Olahraga Sunnah</span>;
      case 'Bahasa & Seni':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Bahasa & Seni</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">Kepemimpinan</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Profile & Switcher Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-indigo-600 border border-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md">
              {studentInfo.siswa.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{studentInfo.siswa}</h2>
                <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Siswa & Orang Tua
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK · {studentInfo.email_siswa} · {studentInfo.cabang}
              </p>
            </div>
          </div>

          {/* Switcher Siswa */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Pilih Siswa:</span>
            <select
              value={selectedStudentName}
              onChange={(e) => {
                setSelectedStudentName(e.target.value);
                if (onSelectOtherStudent) onSelectOtherStudent(e.target.value);
              }}
              className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
            >
              {database.master_siswa.map((s) => (
                <option key={s.email_siswa + s.siswa} value={s.siswa}>
                  {s.siswa} ({s.cabang})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-t border-slate-100 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('grafik')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activeTab === 'grafik'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Grafik Nilai (Bulan / Semester / Tahun)
          </button>

          <button
            onClick={() => setActiveTab('ekskul')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activeTab === 'ekskul'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Ekstrakurikuler Siswa ({studentEkskul.length})
          </button>

          <button
            onClick={() => setActiveTab('harian')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activeTab === 'harian'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Report Harian & Catatan Guru
          </button>

          <button
            onClick={() => setActiveTab('bulanan')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activeTab === 'bulanan'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Rapor Bulanan
          </button>
        </div>
      </div>

      {/* Quick Status Cards (Updated KKM: 85) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tingkat Presensi</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{attendanceStats.rate}%</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {attendanceStats.hadir} Hadir dari {attendanceStats.total} Sesi
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Rata-rata Nilai</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {gradeStats.avg > 0 ? gradeStats.avg : '-'}
          </div>
          <div className="text-[11px] text-indigo-700 mt-1 flex items-center gap-1 font-bold">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            Standar KKM: {KKM_STANDARD}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Ketuntasan KKM (≥ 85)</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {gradeStats.passCount} / {studentNilai.length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            {gradeStats.passRate}% Sesuai Standar KKM 85
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Ekstrakurikuler Diikuti</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{studentEkskul.length}</div>
          <div className="text-[11px] text-purple-700 mt-1 flex items-center gap-1 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-purple-600" />
            Kegiatan Aktif & Berprestasi
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB: GRAFIK NILAI SISWA (PER BULAN / PER SEMESTER / PER TAHUN) */}
      {/* ============================================================== */}
      {activeTab === 'grafik' && (
        <div className="space-y-5">
          {/* Controls Bar: Timeframe & Mapel Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                Grafik & Tren Perkembangan Nilai Siswa
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi dinamika capaian belajar berbanding batas Kriteria Ketuntasan Minimal (KKM: {KKM_STANDARD}).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Switcher Timeframe */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setChartTimeframe('bulan')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    chartTimeframe === 'bulan'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Bulan
                </button>
                <button
                  type="button"
                  onClick={() => setChartTimeframe('semester')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    chartTimeframe === 'semester'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Semester
                </button>
                <button
                  type="button"
                  onClick={() => setChartTimeframe('tahun')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    chartTimeframe === 'tahun'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Tahun
                </button>
              </div>

              {/* Filter Mata Pelajaran */}
              <select
                value={chartSubjectFilter}
                onChange={(e) => setChartSubjectFilter(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="all">Semua Mata Pelajaran</option>
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive SVG Bar & Trend Chart Canvas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-indigo-600" />
                  Rata-rata Nilai Siswa
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  Tuntas (≥ 85)
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                  <span className="w-3 h-3 rounded-md bg-rose-400" />
                  Remedial (&lt; 85)
                </div>
              </div>

              {/* Garis KKM Legend */}
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-rose-600" />
                Garis Standar KKM: {KKM_STANDARD}
              </div>
            </div>

            {activeChartDataset.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <BarChart2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Belum ada data nilai untuk periode atau mata pelajaran ini.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* SVG Chart Container */}
                <div className="relative w-full overflow-x-auto pb-2">
                  <div className="min-w-[540px] h-64 relative flex items-end justify-between gap-4 px-6 pt-6 border-b border-l border-slate-200">
                    {/* Horizontal Grid lines & KKM 85 Line */}
                    {/* Line 100 */}
                    <div className="absolute left-0 right-0 top-6 border-t border-slate-100 flex items-center justify-between pointer-events-none">
                      <span className="text-[10px] text-slate-400 pl-1 font-mono">100</span>
                    </div>

                    {/* Line KKM 85 */}
                    <div
                      style={{ top: `${(1 - KKM_STANDARD / 100) * 85 + 6}%` }}
                      className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500 z-10 flex items-center justify-end pointer-events-none pr-2"
                    >
                      <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300 shadow-xs">
                        Batas KKM: {KKM_STANDARD}
                      </span>
                    </div>

                    {/* Line 50 */}
                    <div
                      style={{ top: `${(1 - 50 / 100) * 85 + 6}%` }}
                      className="absolute left-0 right-0 border-t border-slate-100 flex items-center justify-between pointer-events-none"
                    >
                      <span className="text-[10px] text-slate-400 pl-1 font-mono">50</span>
                    </div>

                    {/* Chart Bars */}
                    {activeChartDataset.map((item, idx) => {
                      const isPass = item.avg >= KKM_STANDARD;
                      const heightPercent = Math.max(10, Math.min(100, item.avg));
                      const isHovered = hoveredDataPoint?.key === item.key;

                      return (
                        <div
                          key={item.key}
                          className="flex-1 flex flex-col items-center h-full justify-end group relative z-20 cursor-pointer"
                          onMouseEnter={() => setHoveredDataPoint(item)}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                        >
                          {/* Value tooltip above bar */}
                          <div
                            className={`mb-1 transition-transform font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg shadow-sm ${
                              isPass
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            } ${isHovered ? 'scale-110 ring-2 ring-indigo-400' : ''}`}
                          >
                            {item.avg}
                          </div>

                          {/* Bar */}
                          <div className="w-full max-w-[64px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-xl transition-all duration-500 ${
                                isPass
                                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-700 hover:to-emerald-500'
                                  : 'bg-gradient-to-t from-rose-500 to-amber-400 hover:from-rose-600 hover:to-amber-500'
                              } ${isHovered ? 'ring-2 ring-indigo-500' : ''}`}
                            />
                          </div>

                          {/* Period Label at bottom */}
                          <div className="mt-2 text-center">
                            <span className="text-[11px] font-bold text-slate-700 block truncate max-w-[90px]">
                              {item.periodLabel}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {item.count} Penilaian
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details of Selected or Hovered Data Point */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        {hoveredDataPoint
                          ? `Detail Periode: ${hoveredDataPoint.periodLabel}`
                          : `Ringkasan Periode Terakhir: ${activeChartDataset[activeChartDataset.length - 1]?.periodLabel}`}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Arahkan kursor atau sentuh diagram batang untuk melihat detail evaluasi per periode.
                      </p>
                    </div>

                    {/* Stats pills */}
                    {(() => {
                      const cur = hoveredDataPoint || activeChartDataset[activeChartDataset.length - 1];
                      if (!cur) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                            Tertinggi: <span className="text-emerald-700 font-mono">{cur.max}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                            Terendah: <span className="text-rose-700 font-mono">{cur.min}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                            Tuntas KKM: <span className="text-indigo-700 font-mono">{cur.passCount}/{cur.count}</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Riwayat Penilaian pada Timeframe ini */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-700">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Mata Pelajaran</th>
                        <th className="px-4 py-3">Jenis Penilaian</th>
                        <th className="px-4 py-3 text-center">Nilai Angka</th>
                        <th className="px-4 py-3 text-center">Status KKM (85)</th>
                        <th className="px-4 py-3">Catatan Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {chartFilteredGrades.slice(-8).reverse().map((item) => (
                        <tr key={item.id_nilai} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.tanggal}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.mapel}</td>
                          <td className="px-4 py-3 text-slate-600">{item.jenis_penilaian}</td>
                          <td className="px-4 py-3 text-center font-mono font-black text-sm">
                            <span className={item.nilai >= KKM_STANDARD ? 'text-emerald-700' : 'text-rose-700'}>
                              {item.nilai}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.nilai >= KKM_STANDARD ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tuntas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3 text-rose-600" /> Remedial
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 italic text-slate-500">
                            {item.catatan || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: EKSTRAKURIKULER SISWA & ORANG TUA */}
      {/* ============================================================== */}
      {activeTab === 'ekskul' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  Daftar Ekstrakurikuler yang Diikuti
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informasi kegiatan bakat, minat, olahraga sunnah, kepemimpinan, dan tahfidz siswa di AL-WILDAN 29.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-purple-600" />
                  {studentEkskul.length} Ekskul Aktif
                </span>
              </div>
            </div>

            {studentEkskul.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Compass className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Siswa belum terdaftar pada kegiatan ekstrakurikuler.</p>
                <p className="text-xs text-slate-400 mt-1">Silakan hubungi koordinator kesiswaan sekolah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {studentEkskul.map((ekskul) => (
                  <div
                    key={ekskul.id_ekskul}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header Card Ekskul */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{ekskul.nama_ekskul}</h4>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {getEkskulCategoryBadge(ekskul.kategori)}
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {ekskul.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 block">
                          Predikat: {ekskul.predikat}
                        </span>
                      </div>
                    </div>

                    {/* Info Jadwal & Pembina */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Pembina / Pelatih</span>
                        <span className="font-bold text-slate-800">{ekskul.pembina}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Jadwal Latihan</span>
                        <span className="font-semibold text-slate-700">{ekskul.jadwal}</span>
                      </div>
                      <div className="sm:col-span-2 mt-1 pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400 block text-[10px] font-medium">Lokasi Kegiatan</span>
                        <span className="font-semibold text-slate-700">{ekskul.lokasi}</span>
                      </div>
                    </div>

                    {/* Progress Kehadiran Ekskul */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Kehadiran Latihan: {ekskul.kehadiran_persen}%</span>
                        <span className="text-emerald-600 font-mono">Disiplin & Aktif</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${ekskul.kehadiran_persen}%` }}
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Capaian Prestasi & Portofolio */}
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                      <div className="font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                        <Trophy className="w-3.5 h-3.5 text-indigo-600" />
                        Capaian & Evaluasi Pembina:
                      </div>
                      <p className="text-slate-700 leading-relaxed italic text-[11px]">
                        "{ekskul.capaian}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: REPORT HARIAN */}
      {/* ============================================================== */}
      {activeTab === 'harian' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Riwayat Presensi Terbaru */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Catatan Presensi Harian
              </h3>
              <span className="text-xs text-slate-400">{studentAbsensi.length} Catatan</span>
            </div>

            {studentAbsensi.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada catatan presensi.</p>
            ) : (
              <div className="space-y-2.5">
                {studentAbsensi.slice(0, 8).map((item) => (
                  <div
                    key={item.id_absensi}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-900">{item.tanggal}</div>
                      <div className="text-[11px] text-slate-500">{item.id_kelas}</div>
                    </div>
                    <div>{getStatusBadge(item.status_kehadiran)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Evaluasi & Nilai Terbaru (KKM 85) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Nilai & Feedback Guru Terbaru (KKM: {KKM_STANDARD})
              </h3>
              <span className="text-xs text-slate-400">{studentNilai.length} Penilaian</span>
            </div>

            {studentNilai.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada riwayat penilaian.</p>
            ) : (
              <div className="space-y-3">
                {studentNilai.slice(0, 6).map((item) => (
                  <div
                    key={item.id_nilai}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{item.jenis_penilaian}</div>
                        <div className="text-[11px] text-indigo-700 font-medium">
                          {item.mapel} · {item.tanggal}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-base px-2.5 py-0.5 rounded-xl ${
                            item.nilai >= KKM_STANDARD
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.nilai}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            item.nilai >= KKM_STANDARD
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.nilai >= KKM_STANDARD ? 'Tuntas' : 'Remedial'}
                        </span>
                      </div>
                    </div>

                    {item.catatan && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="italic leading-relaxed">"{item.catatan}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: REPORT BULANAN */}
      {/* ============================================================== */}
      {activeTab === 'bulanan' && (
        <div className="space-y-5">
          {/* Visual Rekap Kehadiran */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Rekapitulasi Kehadiran Akumulatif
            </h3>

            {/* Progress Bar Visual */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-semibold">
                <span>Persentase Kehadiran ({attendanceStats.rate}%)</span>
                <span>{attendanceStats.hadir} Hadir / {attendanceStats.total} Total Pertemuan</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${attendanceStats.rate}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                />
                <div
                  style={{
                    width: `${
                      attendanceStats.total > 0
                        ? (attendanceStats.izin / attendanceStats.total) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-sky-400 h-full"
                />
                <div
                  style={{
                    width: `${
                      attendanceStats.total > 0
                        ? (attendanceStats.sakit / attendanceStats.total) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-amber-400 h-full"
                />
                <div
                  style={{
                    width: `${
                      attendanceStats.total > 0
                        ? (attendanceStats.alfa / attendanceStats.total) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-rose-500 h-full"
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Hadir: {attendanceStats.hadir}
                </span>
                <span className="flex items-center gap-1.5 text-sky-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  Izin: {attendanceStats.izin}
                </span>
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Sakit: {attendanceStats.sakit}
                </span>
                <span className="flex items-center gap-1.5 text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Alfa: {attendanceStats.alfa}
                </span>
              </div>
            </div>
          </div>

          {/* Rapor Detail Nilai per Mata Pelajaran (KKM: 85) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rapor Penilaian Mata Pelajaran</h3>
                <p className="text-xs text-slate-500">Evaluasi performa akademik dengan Standar Kelulusan KKM: {KKM_STANDARD}.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                    <th className="px-4 py-3 font-semibold">Tutor Pengampu</th>
                    <th className="px-4 py-3 font-semibold text-center">Jml Evaluasi</th>
                    <th className="px-4 py-3 font-semibold text-center">Rata-rata</th>
                    <th className="px-4 py-3 font-semibold text-center">Status KKM ({KKM_STANDARD})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledClasses.map((item) => {
                    const classGrades = studentNilai.filter((n) => n.id_kelas === item.id_kelas);
                    const avg =
                      classGrades.length > 0
                        ? Math.round(
                            (classGrades.reduce((a, b) => a + Number(b.nilai), 0) /
                              classGrades.length) *
                              10
                          ) / 10
                        : 0;

                    return (
                      <tr key={item.id_kelas} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.mapel}</div>
                          <div className="text-[11px] text-slate-400">{item.kelas}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.guru}</td>
                        <td className="px-4 py-3 text-center font-mono">{classGrades.length} Sesi</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-sm">
                          {avg > 0 ? (
                            <span
                              className={
                                avg >= KKM_STANDARD ? 'text-emerald-700' : 'text-rose-700'
                              }
                            >
                              {avg}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {avg >= KKM_STANDARD ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Tuntas (≥ {KKM_STANDARD})
                            </span>
                          ) : avg > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Perlu Remedial (&lt; {KKM_STANDARD})
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Belum ada evaluasi</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
