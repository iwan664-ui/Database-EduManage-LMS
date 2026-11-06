import React, { useState, useMemo } from 'react';
import { DatabaseState, KehadiranStatus, MasterKelas } from '../../types';
import { useToast } from '../Toast';
import { StudentReportModal } from '../student/StudentReportModal';
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  FileText,
  Sparkles,
  DollarSign,
  Settings,
  Filter,
  Search,
  Building,
  Download,
  ChevronDown,
  X,
  RotateCcw,
  Award,
} from 'lucide-react';

interface AdminMonitoringProps {
  database: DatabaseState;
  onNavigateTab: (tab: 'print' | 'insight' | 'fee' | 'settings') => void;
}

export function AdminMonitoring({ database, onNavigateTab }: AdminMonitoringProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('all');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedMapel, setSelectedMapel] = useState<string>('all');
  const [selectedGuru, setSelectedGuru] = useState<string>('all');
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | null>(null);

  // Class Lookup Map
  const classMap = useMemo(() => {
    const map = new Map<string, MasterKelas>();
    database.master_kelas.forEach((k) => map.set(k.id_kelas, k));
    return map;
  }, [database.master_kelas]);

  // List of all unique subjects (Mapel)
  const subjects = useMemo(() => {
    const set = new Set<string>();
    database.master_kelas.forEach((k) => set.add(k.mapel));
    return Array.from(set);
  }, [database.master_kelas]);

  // Cabang list
  const branches = useMemo(() => {
    const set = new Set<string>();
    database.master_siswa.forEach((s) => set.add(s.cabang));
    return Array.from(set);
  }, [database.master_siswa]);

  // Normalized search query
  const q = searchQuery.toLowerCase().trim();

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return database.master_siswa.filter((s) => {
      const matchCabang = selectedCabang === 'all' || s.cabang === selectedCabang;

      const matchSearch =
        !q ||
        s.siswa.toLowerCase().includes(q) ||
        s.email_siswa.toLowerCase().includes(q) ||
        s.cabang.toLowerCase().includes(q) ||
        database.siswa_kelas.some(
          (sk) =>
            sk.siswa === s.siswa &&
            (sk.mapel.toLowerCase().includes(q) ||
              sk.kelas.toLowerCase().includes(q) ||
              sk.guru.toLowerCase().includes(q))
        );

      const matchClass =
        selectedKelas === 'all' ||
        database.siswa_kelas.some((sk) => sk.siswa === s.siswa && sk.id_kelas === selectedKelas);

      const matchMapel =
        selectedMapel === 'all' ||
        database.siswa_kelas.some((sk) => sk.siswa === s.siswa && sk.mapel === selectedMapel);

      const matchGuru =
        selectedGuru === 'all' ||
        database.siswa_kelas.some((sk) => sk.siswa === s.siswa && sk.guru === selectedGuru);

      return matchCabang && matchSearch && matchClass && matchMapel && matchGuru;
    });
  }, [database.master_siswa, database.siswa_kelas, selectedCabang, selectedKelas, selectedMapel, selectedGuru, q]);

  // Filtered Absensi
  const filteredAbsensi = useMemo(() => {
    return database.log_absensi.filter((la) => {
      const kInfo = classMap.get(la.id_kelas);
      const matchKelas = selectedKelas === 'all' || la.id_kelas === selectedKelas;
      const matchCabang = selectedCabang === 'all' || kInfo?.cabang === selectedCabang;
      const matchMapel = selectedMapel === 'all' || kInfo?.mapel === selectedMapel;
      const matchGuru = selectedGuru === 'all' || kInfo?.guru === selectedGuru || la.id_tutor === selectedGuru;

      const matchSearch =
        !q ||
        la.siswa.toLowerCase().includes(q) ||
        la.id_kelas.toLowerCase().includes(q) ||
        (kInfo && kInfo.kelas.toLowerCase().includes(q)) ||
        (kInfo && kInfo.mapel.toLowerCase().includes(q)) ||
        (kInfo && kInfo.guru.toLowerCase().includes(q));

      return matchKelas && matchCabang && matchMapel && matchGuru && matchSearch;
    });
  }, [database.log_absensi, classMap, selectedKelas, selectedCabang, selectedMapel, selectedGuru, q]);

  // Hitung metrik
  const totalHadir = filteredAbsensi.filter((a) => a.status_kehadiran === 'Hadir').length;
  const presenceRate =
    filteredAbsensi.length > 0 ? Math.round((totalHadir / filteredAbsensi.length) * 100) : 0;

  // Filtered Nilai
  const filteredNilai = useMemo(() => {
    return database.log_nilai.filter((ln) => {
      const kInfo = classMap.get(ln.id_kelas);
      const matchKelas = selectedKelas === 'all' || ln.id_kelas === selectedKelas;
      const matchCabang = selectedCabang === 'all' || kInfo?.cabang === selectedCabang;
      const matchMapel = selectedMapel === 'all' || ln.mapel === selectedMapel;
      const matchGuru = selectedGuru === 'all' || kInfo?.guru === selectedGuru || ln.id_tutor === selectedGuru;

      const matchSearch =
        !q ||
        ln.siswa.toLowerCase().includes(q) ||
        ln.mapel.toLowerCase().includes(q) ||
        ln.jenis_penilaian.toLowerCase().includes(q) ||
        (ln.catatan && ln.catatan.toLowerCase().includes(q)) ||
        ln.id_kelas.toLowerCase().includes(q) ||
        (kInfo && kInfo.kelas.toLowerCase().includes(q)) ||
        (kInfo && kInfo.guru.toLowerCase().includes(q));

      return matchKelas && matchCabang && matchMapel && matchGuru && matchSearch;
    });
  }, [database.log_nilai, classMap, selectedKelas, selectedCabang, selectedMapel, selectedGuru, q]);

  const avgGrade = useMemo(() => {
    if (filteredNilai.length === 0) return 0;
    const sum = filteredNilai.reduce((acc, curr) => acc + Number(curr.nilai), 0);
    return Math.round((sum / filteredNilai.length) * 10) / 10;
  }, [filteredNilai]);

  const isAnyFilterActive =
    Boolean(q) ||
    selectedCabang !== 'all' ||
    selectedKelas !== 'all' ||
    selectedMapel !== 'all' ||
    selectedGuru !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCabang('all');
    setSelectedKelas('all');
    setSelectedMapel('all');
    setSelectedGuru('all');
  };

  const handleExportCsv = (type: 'absensi' | 'nilai' | 'siswa') => {
    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filterTag = `${selectedCabang !== 'all' ? selectedCabang.replace(/\s+/g, '') : 'SemuaCabang'}_${selectedKelas !== 'all' ? selectedKelas : 'SemuaKelas'}`;
    let filename = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (type === 'absensi') {
      if (filteredAbsensi.length === 0) {
        showToast('Data Kosong', 'Tidak ada data presensi untuk diekspor dengan filter ini.', 'error');
        return;
      }
      filename = `Monitoring_Presensi_${filterTag}_${dateStr}.csv`;
      headers = ['ID Absensi', 'Tanggal', 'ID Kelas', 'Nama Siswa', 'Status Kehadiran', 'ID Tutor', 'Waktu Input'];
      rows = filteredAbsensi.map((a) => [
        a.id_absensi,
        a.tanggal,
        a.id_kelas,
        a.siswa,
        a.status_kehadiran,
        a.id_tutor,
        a.timestamp,
      ]);
    } else if (type === 'nilai') {
      if (filteredNilai.length === 0) {
        showToast('Data Kosong', 'Tidak ada data nilai untuk diekspor dengan filter ini.', 'error');
        return;
      }
      filename = `Monitoring_Nilai_${filterTag}_${dateStr}.csv`;
      headers = ['ID Nilai', 'Tanggal', 'ID Kelas', 'Nama Siswa', 'Mata Pelajaran', 'Jenis Penilaian', 'Nilai', 'Catatan', 'ID Tutor', 'Waktu Input'];
      rows = filteredNilai.map((n) => [
        n.id_nilai,
        n.tanggal,
        n.id_kelas,
        n.siswa,
        n.mapel,
        n.jenis_penilaian,
        n.nilai,
        n.catatan || '',
        n.id_tutor,
        n.timestamp,
      ]);
    } else {
      if (filteredStudents.length === 0) {
        showToast('Data Kosong', 'Tidak ada data siswa untuk diekspor dengan filter ini.', 'error');
        return;
      }
      filename = `Monitoring_Siswa_${filterTag}_${dateStr}.csv`;
      headers = ['Nama Siswa', 'Cabang', 'Email Siswa'];
      rows = filteredStudents.map((s) => [s.siswa, s.cabang, s.email_siswa]);
    }

    const csvContent =
      '\uFEFF' +
      [
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Export CSV Berhasil!', `File ${filename} (${rows.length} baris) berhasil diunduh.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-slate-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              AL-WILDAN 29 KOTA DEPOK · Monitoring Central Administrator
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Dashboard Akademik & Operasional
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Pantau seluruh aktivitas pembelajaran, presensi, evaluasi nilai siswa di semua cabang, dan kelola honor pengajar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab('print')}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Cetak Laporan Bulanan
            </button>
            <button
              onClick={() => onNavigateTab('insight')}
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Auto AI Insight
            </button>
            <button
              onClick={() => onNavigateTab('fee')}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              Rekap Honor Tutor
            </button>
          </div>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Siswa</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{filteredStudents.length}</div>
          <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Terdaftar di bimbel
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Pengajar</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{database.master_guru.length}</div>
          <div className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            Tutor aktif
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Kelas Berjalan</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{database.master_kelas.length}</div>
          <div className="text-[11px] text-purple-600 mt-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Rombongan belajar
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Rata-rata Presensi</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{presenceRate}%</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Kehadiran global
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-xs text-slate-500 font-medium">Rata-rata Nilai Global</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{avgGrade}</div>
          <div className="text-[11px] text-indigo-700 mt-1 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            KKM Standar: 85
          </div>
        </div>
      </div>

      {/* Global Search and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Global Search Input Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Pencarian Global Siswa, Kelas & Mata Pelajaran</span>
            </label>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama siswa (contoh: Ahmad, Bella), mata pelajaran (contoh: Matematika, Kimia), atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                title="Hapus kata kunci pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kampus / Cabang</label>
            <select
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Kampus ({branches.length})</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rombel / Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Kelas ({database.master_kelas.length})</option>
              {database.master_kelas.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  {k.kelas}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Mapel ({subjects.length})</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guru Pengampu</label>
            <select
              value={selectedGuru}
              onChange={(e) => setSelectedGuru(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Guru ({database.master_guru.length})</option>
              {database.master_guru.map((g) => (
                <option key={g.id_tutor} value={g.guru}>
                  {g.guru}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count & Export to CSV */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="text-slate-600 flex items-center flex-wrap gap-2">
            <span>Ditemukan:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {filteredStudents.length} Siswa
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {filteredAbsensi.length} Log Presensi
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {filteredNilai.length} Log Nilai
            </span>
          </div>

          {/* Export to CSV Button with Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              title="Download data terfilter sebagai file CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export to CSV</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-30 animate-fade-in text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Pilih Format Data:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv('absensi');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Log Presensi</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">({filteredAbsensi.length} data)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv('nilai');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Log Nilai Siswa</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">({filteredNilai.length} data)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv('siswa');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Daftar Siswa Terfilter</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">({filteredStudents.length} siswa)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Matched Students Card when searching */}
      {Boolean(q) && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Daftar Siswa Cocok dengan Pencarian "{searchQuery}"</span>
            </h3>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
              {filteredStudents.length} Siswa
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              Tidak ada siswa yang cocok dengan kata kunci "{searchQuery}".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStudents.map((s) => {
                const sClasses = database.siswa_kelas.filter((sk) => sk.siswa === s.siswa);
                return (
                  <div
                    key={s.siswa + s.email_siswa}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all text-xs"
                  >
                    <div className="font-bold text-slate-900">{s.siswa}</div>
                    <div className="text-[11px] text-slate-500">{s.email_siswa}</div>
                    <div className="text-[11px] font-semibold text-blue-700 mt-1">{s.cabang}</div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-1">
                      {sClasses.map((c) => (
                        <span
                          key={c.id_kelas}
                          className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono"
                        >
                          {c.mapel}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedStudentForReport(s.siswa)}
                      className="mt-2.5 w-full py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
                    >
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>E-Rapor, Piagam & WA</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Realtime Live Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Feed Presensi Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Feed Presensi
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{filteredAbsensi.length} Data</span>
              <button
                type="button"
                onClick={() => handleExportCsv('absensi')}
                className="p-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                title="Export Presensi ke CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredAbsensi.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Tidak ada data presensi yang cocok dengan kata kunci atau filter ini.
              </div>
            ) : (
              filteredAbsensi.slice(0, 15).map((a) => (
                <div
                  key={a.id_absensi}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{a.siswa}</div>
                    <div className="text-[11px] text-slate-500">
                      {a.id_kelas} · {a.tanggal}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      a.status_kehadiran === 'Hadir'
                        ? 'bg-emerald-100 text-emerald-800'
                        : a.status_kehadiran === 'Izin'
                        ? 'bg-sky-100 text-sky-800'
                        : a.status_kehadiran === 'Sakit'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {a.status_kehadiran}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feed Penilaian Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Feed Penilaian
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{filteredNilai.length} Data</span>
              <button
                type="button"
                onClick={() => handleExportCsv('nilai')}
                className="p-1 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                title="Export Nilai ke CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredNilai.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Tidak ada data nilai yang cocok dengan kata kunci atau filter ini.
              </div>
            ) : (
              filteredNilai.slice(0, 15).map((n) => (
                <div
                  key={n.id_nilai}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{n.siswa}</div>
                    <div className="text-[11px] text-slate-500">
                      {n.mapel} · {n.jenis_penilaian} ({n.tanggal})
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs px-2.5 py-1 rounded-xl ${
                      n.nilai >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {n.nilai}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Student E-Rapor Digital, Piagam & WhatsApp Broadcaster Modal */}
      {selectedStudentForReport && (
        <StudentReportModal
          isOpen={Boolean(selectedStudentForReport)}
          onClose={() => setSelectedStudentForReport(null)}
          studentName={selectedStudentForReport}
          database={database}
          initialTab="rapor"
        />
      )}
    </div>
  );
}
