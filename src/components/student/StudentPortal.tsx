import React, { useState, useMemo } from 'react';
import { ActiveUser, DatabaseState, KehadiranStatus, SiswaEkstrakurikuler } from '../../types';
import { StudentReportModal } from './StudentReportModal';
import { StudentMutabaahTahfidz } from './StudentMutabaahTahfidz';
import { StudentSmartCard } from './StudentSmartCard';
import { StudentScheduleView } from './StudentScheduleView';
import { CbtExamEngine } from '../cbt/CbtExamEngine';
import { DigitalMaktabah } from '../library/DigitalMaktabah';
import { StudentAdabCharacterView } from '../adab/StudentAdabCharacterView';
import { AssignmentHub } from '../assignment/AssignmentHub';
import { VirtualClassroomHub } from '../virtual/VirtualClassroomHub';
import { AnnouncementBulletinBoard } from '../announcement/AnnouncementBulletinBoard';
import { StudentWeeklyReportsView } from './StudentWeeklyReportsView';
import { StudentGateAttendanceView } from './StudentGateAttendanceView';
import { StudentProgressRadarChart } from './StudentProgressRadarChart';
import { GateAttendanceService } from '../../services/gateAttendanceService';
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
  Printer,
  Share2,
  HeartHandshake,
  Download,
  ExternalLink,
  IdCard,
  FileQuestion,
  Star,
  Video,
  Megaphone,
  FileCheck,
} from 'lucide-react';

export type StudentPortalTab =
  | 'radar'
  | 'mutabaah'
  | 'cbt'
  | 'tugas'
  | 'virtual'
  | 'maktabah'
  | 'adab'
  | 'kartu'
  | 'jadwal'
  | 'pengumuman'
  | 'grafik'
  | 'ekskul'
  | 'harian'
  | 'hadir-pulang'
  | 'pekanan'
  | 'bulanan';

interface StudentPortalProps {
  currentUser: ActiveUser;
  database: DatabaseState;
  onSelectOtherStudent?: (studentName: string) => void;
  controlledActiveTab?: StudentPortalTab;
  onTabChange?: (tab: StudentPortalTab) => void;
  hideTopTabs?: boolean;
}

export function StudentPortal({
  currentUser,
  database,
  onSelectOtherStudent,
  controlledActiveTab,
  onTabChange,
  hideTopTabs = false,
}: StudentPortalProps) {
  const [internalTab, setInternalTab] = useState<StudentPortalTab>('radar');
  const activeTab = controlledActiveTab ?? internalTab;
  const setActiveTab = (tab: StudentPortalTab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [selectedStudentName, setSelectedStudentName] = useState<string>(currentUser.name);

  React.useEffect(() => {
    setSelectedStudentName(currentUser.name);
  }, [currentUser.name]);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportModalTab, setReportModalTab] = useState<'rapor' | 'piagam' | 'whatsapp'>('rapor');

  // Timeframe untuk Grafik Nilai: 'bulan' | 'semester' | 'tahun'
  const [chartTimeframe, setChartTimeframe] = useState<'bulan' | 'semester' | 'tahun'>('bulan');
  const [chartSubjectFilter, setChartSubjectFilter] = useState<string>('all');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);
  const [hoveredRadarAxis, setHoveredRadarAxis] = useState<number | null>(null);

  // Standar KKM Baru: 85
  const KKM_STANDARD = 85;

  // Cari detail siswa di master_siswa
  const studentInfo = useMemo(() => {
    return database.master_siswa.find((s) => s.siswa === selectedStudentName) || {
      siswa: selectedStudentName,
      cabang: 'Kampus Utama BSD City',
      email_siswa: currentUser.email || 'siswa@alwildan3bsd.sch.id',
    };
  }, [database.master_siswa, selectedStudentName]);

  // Unique students to prevent duplicate options and React key collision
  const uniqueStudents = useMemo(() => {
    const seen = new Set<string>();
    return database.master_siswa.filter((s) => {
      const normalized = (s.siswa || '').trim().toLowerCase();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [database.master_siswa]);

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

  // Log Setoran Tahfidz siswa
  const studentTahfidz = useMemo(() => {
    return (database.tahfidz_setoran || [])
      .filter((t) => t.siswa === selectedStudentName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [database.tahfidz_setoran, selectedStudentName]);

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

  // Status Scan Gerbang Hari Ini (Jam Hadir & Pulang untuk Orang Tua)
  const todayGateLog = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return GateAttendanceService.getAllLogs().find(
      (l) => l.tanggal === todayStr && l.siswa.toLowerCase().trim() === selectedStudentName.toLowerCase().trim()
    );
  }, [selectedStudentName]);

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

  // 6 Dimensi Analisis Potensi 360° Santri Al-Wildan
  const radarData = useMemo(() => {
    // 1. Akademik: rata-rata nilai (KKM 85 standard)
    const akademikScore = gradeStats.avg > 0 ? Math.min(100, Math.round(gradeStats.avg)) : 86;

    // 2. Presensi & Disiplin
    const presensiScore = attendanceStats.total > 0 ? attendanceStats.rate : 94;

    // 3. Tahfidz & Al-Qur'an
    const tahfidzItems = studentNilai.filter(
      (n) =>
        n.mapel.toLowerCase().includes('tahfidz') ||
        n.mapel.toLowerCase().includes('quran') ||
        n.mapel.toLowerCase().includes('pai') ||
        n.mapel.toLowerCase().includes('agama')
    );
    const tahfidzScore =
      studentTahfidz.length > 0
        ? Math.round(studentTahfidz.reduce((a, b) => a + Number(b.nilai), 0) / studentTahfidz.length)
        : tahfidzItems.length > 0
          ? Math.round(tahfidzItems.reduce((a, b) => a + Number(b.nilai), 0) / tahfidzItems.length)
          : 90;

    // 4. Ekstrakurikuler & Bakat
    const ekskulScore =
      studentEkskul.length > 0
        ? Math.min(
            100,
            Math.round(studentEkskul.reduce((a, b) => a + b.kehadiran_persen, 0) / studentEkskul.length)
          )
        : 88;

    // 5. Keaktifan Belajar
    const keaktifanScore =
      studentNilai.length > 0
        ? Math.min(100, Math.round(82 + gradeStats.passRate * 0.18))
        : 89;

    // 6. Adab & Karakter Islami
    const adabScore =
      attendanceStats.alfa === 0
        ? 95
        : Math.max(75, 95 - attendanceStats.alfa * 5);

    const axes = [
      {
        key: 'akademik',
        label: 'Akademik (KKM 85)',
        short: 'Akademik',
        score: akademikScore,
        kkm: KKM_STANDARD,
        subtext: `${gradeStats.passCount}/${studentNilai.length} Tuntas`,
      },
      {
        key: 'presensi',
        label: 'Presensi & Disiplin',
        short: 'Disiplin',
        score: presensiScore,
        kkm: 85,
        subtext: `${attendanceStats.hadir}/${attendanceStats.total} Kehadiran`,
      },
      {
        key: 'tahfidz',
        label: "Tahfidz & Al-Qur'an",
        short: 'Tahfidz',
        score: tahfidzScore,
        kkm: 85,
        subtext: 'Mutqin & Tartil',
      },
      {
        key: 'ekskul',
        label: 'Bakat & Ekskul',
        short: 'Ekskul',
        score: ekskulScore,
        kkm: 80,
        subtext: `${studentEkskul.length} Ekskul Diikuti`,
      },
      {
        key: 'keaktifan',
        label: 'Keaktifan Belajar',
        short: 'Keaktifan',
        score: keaktifanScore,
        kkm: 85,
        subtext: 'Partisipasi Kelas',
      },
      {
        key: 'adab',
        label: 'Adab & Karakter',
        short: 'Adab Islami',
        score: adabScore,
        kkm: 85,
        subtext: 'Akhlaqul Karimah',
      },
    ];

    const compositeScore =
      Math.round((axes.reduce((sum, a) => sum + a.score, 0) / axes.length) * 10) / 10;

    let predikat = 'MUMTAZ (Istimewa)';
    let predikatBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (compositeScore < 85) {
      predikat = 'JAYYID (Cukup / Perlu Bimbingan)';
      predikatBadge = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (compositeScore < 90) {
      predikat = 'JAYYID JIDDAN (Sangat Baik)';
      predikatBadge = 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }

    return { axes, compositeScore, predikat, predikatBadge };
  }, [gradeStats, attendanceStats, studentNilai, studentTahfidz, studentEkskul, KKM_STANDARD]);

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 border-2 border-orange-400 text-white flex items-center justify-center font-black text-xl shadow-md">
              {studentInfo.siswa.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{studentInfo.siswa}</h2>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Siswa & Orang Tua
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  KKM 85
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY · {studentInfo.email_siswa} · {studentInfo.cabang}
              </p>
            </div>
          </div>

          {/* Quick Prestige Actions & Switcher Siswa */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setReportModalTab('rapor');
                setShowReportModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow flex items-center gap-1.5 transition-all"
            >
              <Award className="w-3.5 h-3.5 text-orange-300" />
              <span>E-Rapor & Piagam</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReportModalTab('whatsapp');
                setShowReportModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow flex items-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Kirim WhatsApp</span>
            </button>

            <div className="flex items-center gap-1.5 pl-1">
              <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Siswa:</span>
              <select
                value={selectedStudentName}
                onChange={(e) => {
                  setSelectedStudentName(e.target.value);
                  if (onSelectOtherStudent) onSelectOtherStudent(e.target.value);
                }}
                className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              >
                {uniqueStudents.map((s, idx) => (
                  <option key={`stu_portal_${s.siswa}_${idx}`} value={s.siswa}>
                    {s.siswa} ({s.cabang})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Hidden when controlled by Left Sidebar) */}
        {!hideTopTabs && (
          <div className="flex flex-wrap border-t border-slate-100 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-orange-400" />
            Potensi 360°
          </button>

          <button
            onClick={() => setActiveTab('mutabaah')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'mutabaah'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            Mutaba'ah & Tahfidz
          </button>

          <button
            onClick={() => setActiveTab('cbt')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'cbt'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5 text-orange-400" />
            Ujian CBT (KKM 85)
          </button>

          <button
            onClick={() => setActiveTab('tugas')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'tugas'
                ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-700/30'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-orange-400" />
            Tugas & PR
          </button>

          <button
            onClick={() => setActiveTab('virtual')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'virtual'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-emerald-600" />
            Kelas Virtual & Forum
          </button>

          <button
            onClick={() => setActiveTab('maktabah')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'maktabah'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            Digital Maktabah
          </button>

          <button
            onClick={() => setActiveTab('adab')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'adab'
                ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-500/30'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            Bintang Akhlak & Adab
          </button>

          <button
            onClick={() => setActiveTab('pengumuman')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'pengumuman'
                ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-500/30'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-orange-500" />
            Pengumuman
          </button>

          <button
            onClick={() => setActiveTab('kartu')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'kartu'
                ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-700/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <IdCard className="w-3.5 h-3.5 text-blue-500" />
            Kartu Santri Smart ID
          </button>

          <button
            onClick={() => setActiveTab('jadwal')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              activeTab === 'jadwal'
                ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-500/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            Jadwal KBM
          </button>

          <button
            onClick={() => setActiveTab('grafik')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activeTab === 'grafik'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
            Grafik Nilai (KKM 85)
          </button>

          <button
            onClick={() => setActiveTab('ekskul')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activeTab === 'ekskul'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-500" />
            Ekstrakurikuler ({studentEkskul.length})
          </button>

          <button
            onClick={() => setActiveTab('harian')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activeTab === 'harian'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Report Harian
          </button>

          <button
            onClick={() => setActiveTab('bulanan')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activeTab === 'bulanan'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Rapor Bulanan
          </button>
          </div>
        )}
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

      {/* Live Gate Attendance Strip (Orang Tua melihat Jam Masuk & Jam Pulang Hari Ini secara langsung) */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-orange-50 rounded-2xl border border-emerald-200/80 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-[11px] shadow-2xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Status Gerbang Hari Ini</span>
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Jam Hadir:</span>
            <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg">
              {todayGateLog?.jam_masuk ? `${todayGateLog.jam_masuk.slice(0, 5)} WIB` : 'Belum Scan'}
            </span>
            {todayGateLog?.status_masuk && (
              <span className="text-[10px] font-bold text-slate-600">({todayGateLog.status_masuk})</span>
            )}
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Jam Pulang:</span>
            <span className="font-mono font-black text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-lg">
              {todayGateLog?.jam_pulang
                ? `${todayGateLog.jam_pulang.slice(0, 5)} WIB`
                : todayGateLog?.jam_masuk
                  ? 'Masih di Sekolah'
                  : 'Menunggu'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('hadir-pulang')}
          className="py-1.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all shrink-0"
        >
          <span>Lihat Riwayat Hadir & Pulang</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB: JAM HADIR & JAM PULANG ANAK (SCAN GERBANG & KELAS)        */}
      {/* ============================================================== */}
      {activeTab === 'hadir-pulang' && (
        <StudentGateAttendanceView studentName={selectedStudentName} cabang={studentInfo.cabang} />
      )}

      {/* ============================================================== */}
      {/* TAB: RAPOR PEKANAN DARI GURU UNTUK ORANG TUA                  */}
      {/* ============================================================== */}
      {activeTab === 'pekanan' && (
        <StudentWeeklyReportsView studentName={selectedStudentName} />
      )}

      {/* ============================================================== */}
      {/* TAB: ANALISIS POTENSI 360° SANTRI (INTERACTIVE RADAR CHART)    */}
      {/* ============================================================== */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Header Banner Analisis Potensi */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Al-Wildan Holistic Assessment Framework · Standar KKM {KKM_STANDARD}
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Analisis Radar 360° Potensi & Karakter Santri
                </h3>
                <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                  Evaluasi terpadu memadukan capaian kurikulum nasional & internasional (TIC), ketuntasan KKM 85, hafalan Tahfidz Al-Qur'an, keaktifan ekstrakurikuler, dan akhlaqul karimah.
                </p>
              </div>

              {/* Prestige Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setReportModalTab('rapor');
                    setShowReportModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-indigo-900 hover:bg-indigo-50 shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Buka E-Rapor Digital</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportModalTab('piagam');
                    setShowReportModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>Piagam Prestasi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grafik Radar Recharts: Kemajuan Hafalan Tahfidz & Nilai Akademik dari Waktu ke Waktu vs KKM 85 */}
          <StudentProgressRadarChart
            studentName={selectedStudentName}
            academicGrades={studentNilai}
            tahfidzSetoran={studentTahfidz}
            kkmStandard={KKM_STANDARD}
          />

          {/* Radar & Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Spider / Radar Canvas (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Radar 6 Dimensi Potensi
                  </h4>
                  <p className="text-[11px] text-slate-500">Sentuh atau arahkan kursor ke tiap sumbu untuk detail</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                  Scale 0-100
                </span>
              </div>

              {/* Interactive SVG Radar */}
              <div className="relative flex items-center justify-center py-2">
                <svg
                  viewBox="0 0 340 340"
                  className="w-full max-w-[320px] aspect-square overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="radarAreaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                    </linearGradient>
                    <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/* Concentric Web Rings (20%, 40%, 60%, 80%, 100%) */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((factor, idx) => {
                    const ringPoints = [0, 1, 2, 3, 4, 5]
                      .map((i) => {
                        const angle = -Math.PI / 2 + (i * (Math.PI * 2)) / 6;
                        const x = 170 + 115 * factor * Math.cos(angle);
                        const y = 170 + 115 * factor * Math.sin(angle);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');
                    return (
                      <polygon
                        key={factor}
                        points={ringPoints}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={idx === 4 ? '1.5' : '1'}
                        strokeDasharray={idx < 4 ? '3 3' : 'none'}
                      />
                    );
                  })}

                  {/* KKM 85 Benchmark Polygon Ring */}
                  {(() => {
                    const kkmPoints = [0, 1, 2, 3, 4, 5]
                      .map((i) => {
                        const angle = -Math.PI / 2 + (i * (Math.PI * 2)) / 6;
                        const x = 170 + 115 * (KKM_STANDARD / 100) * Math.cos(angle);
                        const y = 170 + 115 * (KKM_STANDARD / 100) * Math.sin(angle);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');
                    return (
                      <polygon
                        points={kkmPoints}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.8"
                      />
                    );
                  })()}

                  {/* 6 Radial Spoke Lines */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const angle = -Math.PI / 2 + (i * (Math.PI * 2)) / 6;
                    const x = 170 + 115 * Math.cos(angle);
                    const y = 170 + 115 * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1="170"
                        y1="170"
                        x2={x.toFixed(1)}
                        y2={y.toFixed(1)}
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Data Filled Polygon */}
                  {(() => {
                    const dataPoints = radarData.axes
                      .map((axis, i) => {
                        const factor = Math.max(0.1, Math.min(1.0, axis.score / 100));
                        const angle = -Math.PI / 2 + (i * (Math.PI * 2)) / 6;
                        const x = 170 + 115 * factor * Math.cos(angle);
                        const y = 170 + 115 * factor * Math.sin(angle);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');

                    return (
                      <polygon
                        points={dataPoints}
                        fill="url(#radarAreaGrad)"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        filter="url(#radarGlow)"
                      />
                    );
                  })()}

                  {/* Vertex Points and Text Badges */}
                  {radarData.axes.map((axis, i) => {
                    const factor = Math.max(0.1, Math.min(1.0, axis.score / 100));
                    const angle = -Math.PI / 2 + (i * (Math.PI * 2)) / 6;
                    const x = 170 + 115 * factor * Math.cos(angle);
                    const y = 170 + 115 * factor * Math.sin(angle);
                    const isHovered = hoveredRadarAxis === i;

                    // Label position
                    const labelX = 170 + (115 + 26) * Math.cos(angle);
                    const labelY = 170 + (115 + 26) * Math.sin(angle);

                    return (
                      <g
                        key={axis.key}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredRadarAxis(i)}
                        onMouseLeave={() => setHoveredRadarAxis(null)}
                      >
                        {/* Interactive Circle at point */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 7 : 4.5}
                          fill="#ffffff"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          className="transition-all duration-200"
                        />
                        {/* Outer pulsing ring if hovered */}
                        {isHovered && (
                          <circle
                            cx={x}
                            cy={y}
                            r="11"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="1.5"
                            opacity="0.6"
                          />
                        )}

                        {/* Text Label on Radar Outer Perimeter */}
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className={`text-[11px] font-bold tracking-tight select-none transition-colors ${
                            isHovered ? 'fill-indigo-700 font-extrabold' : 'fill-slate-700'
                          }`}
                        >
                          {axis.short} ({axis.score})
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend & Guide */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span>Capaian Santri</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-rose-600">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-rose-500" />
                  <span>Standar KKM ({KKM_STANDARD})</span>
                </div>
                <div className="text-[11px] text-slate-400">Target Mutlak: ≥ 85</div>
              </div>
            </div>

            {/* Composite Score & 6 Dimension Breakdown (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Composite Index Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Indeks Komposit Mutu Santri
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                        {radarData.compositeScore}
                      </span>
                      <span className="text-sm font-bold text-slate-400 font-mono">/ 100</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${radarData.predikatBadge}`}>
                        {radarData.predikat}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReportModalTab('whatsapp');
                        setShowReportModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bagikan ke Orang Tua</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar of Composite vs KKM 85 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Progres Ketuntasan Karakter Terpadu</span>
                    <span className="text-indigo-700 font-mono font-bold">
                      {radarData.compositeScore >= KKM_STANDARD ? 'Melampaui KKM 85 (+ ' + (radarData.compositeScore - KKM_STANDARD).toFixed(1) + ' Poin)' : 'Di Bawah KKM 85'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      style={{ width: `${Math.min(100, radarData.compositeScore)}%` }}
                      className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                    />
                    <div
                      style={{ left: `${KKM_STANDARD}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                      title="Batas KKM 85"
                    />
                  </div>
                </div>
              </div>

              {/* 6 Dimensions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {radarData.axes.map((axis, i) => {
                  const isHovered = hoveredRadarAxis === i;
                  const isPass = axis.score >= axis.kkm;

                  return (
                    <div
                      key={axis.key}
                      onMouseEnter={() => setHoveredRadarAxis(i)}
                      onMouseLeave={() => setHoveredRadarAxis(null)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isHovered
                          ? 'bg-indigo-50/70 border-indigo-300 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{axis.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{axis.subtext}</div>
                        </div>
                        <div className="text-right">
                          <span className={`text-base font-black font-mono ${isPass ? 'text-indigo-700' : 'text-rose-600'}`}>
                            {axis.score}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">Target: {axis.kkm}</span>
                        </div>
                      </div>

                      {/* Small Bar */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div
                          style={{ width: `${axis.score}%` }}
                          className={`h-full rounded-full transition-all ${
                            isPass ? 'bg-indigo-600' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insights & Recommendations */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pedagogical & Character Insight:</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Santri menunjukkan performa istimewa terutama pada pilar{' '}
                  <strong className="text-slate-800">
                    {radarData.axes.slice().sort((a, b) => b.score - a.score)[0]?.label}
                  </strong>{' '}
                  dan{' '}
                  <strong className="text-slate-800">
                    {radarData.axes.slice().sort((a, b) => b.score - a.score)[1]?.label}
                  </strong>
                  . Sinergi antara kurikulum akademik KKM 85 dan pembiasaan adab harian AL-WILDAN 3 BSD CITY telah tercermin dalam kedisiplinan belajar santri.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: MUTABA'AH YAUMIYAH & TAHFIDZ DIGITAL                      */}
      {/* ============================================================== */}
      {activeTab === 'mutabaah' && (
        <StudentMutabaahTahfidz
          studentName={selectedStudentName}
          database={database}
          onDataUpdated={() => {
            if (onSelectOtherStudent) onSelectOtherStudent(selectedStudentName);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* TAB: UJIAN & CBT ONLINE (STANDAR KKM 85)                       */}
      {/* ============================================================== */}
      {activeTab === 'cbt' && (
        <CbtExamEngine
          currentUser={currentUser}
          database={database}
          onSaveResultToDatabase={(newNilai) => {
            database.log_nilai.unshift(newNilai);
            if (onSelectOtherStudent) onSelectOtherStudent(selectedStudentName);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* TAB: TUGAS & PENGERJAAN PR DIGITAL                             */}
      {/* ============================================================== */}
      {activeTab === 'tugas' && (
        <AssignmentHub
          currentUser={currentUser}
          database={database}
          onGradeSubmitted={() => {
            if (onSelectOtherStudent) onSelectOtherStudent(selectedStudentName);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* TAB: KELAS VIRTUAL & FORUM TANYA JAWAB ASATIDZ                 */}
      {/* ============================================================== */}
      {activeTab === 'virtual' && (
        <VirtualClassroomHub currentUser={currentUser} />
      )}

      {/* ============================================================== */}
      {/* TAB: DIGITAL MAKTABAH & E-LEARNING (MUROTTAL & HADITS)         */}
      {/* ============================================================== */}
      {activeTab === 'maktabah' && (
        <DigitalMaktabah />
      )}

      {/* ============================================================== */}
      {/* TAB: PAPAN PENGUMUMAN RESMI SEKOLAH                            */}
      {/* ============================================================== */}
      {activeTab === 'pengumuman' && (
        <AnnouncementBulletinBoard currentUser={currentUser} />
      )}

      {/* ============================================================== */}
      {/* TAB: BINTANG AKHLAK & ADAB SANTRI                              */}
      {/* ============================================================== */}
      {activeTab === 'adab' && (
        <StudentAdabCharacterView
          currentUser={currentUser}
          studentName={selectedStudentName}
        />
      )}

      {/* ============================================================== */}
      {/* TAB: KARTU TANDA SANTRI SMART ID                               */}
      {/* ============================================================== */}
      {activeTab === 'kartu' && (
        <StudentSmartCard
          student={studentInfo}
          enrolledClassesCount={enrolledClasses.length}
          kkmAvg={gradeStats.avg > 0 ? gradeStats.avg : 88.5}
        />
      )}

      {/* ============================================================== */}
      {/* TAB: JADWAL PELAJARAN & AGENDA KBM INTERAKTIF                  */}
      {/* ============================================================== */}
      {activeTab === 'jadwal' && (
        <StudentScheduleView
          studentName={selectedStudentName}
          database={database}
        />
      )}

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
                  Informasi kegiatan bakat, minat, olahraga sunnah, kepemimpinan, dan tahfidz siswa di AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY.
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
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-slate-900">{item.tanggal}</div>
                      <div className="text-[11px] text-slate-500">{item.id_kelas}</div>
                      {item.materi_diajarkan && (
                        <div className="text-[11px] text-blue-700 font-semibold mt-0.5 truncate">
                          Materi: {item.materi_diajarkan}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">{getStatusBadge(item.status_kehadiran)}</div>
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
                        {item.materi_diajarkan && (
                          <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                            Materi: {item.materi_diajarkan}
                          </div>
                        )}
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

      {/* Official E-Rapor Digital, Piagam Prestasi & WhatsApp Broadcaster Modal */}
      <StudentReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        studentName={selectedStudentName}
        database={database}
        initialTab={reportModalTab}
      />
    </div>
  );
}
