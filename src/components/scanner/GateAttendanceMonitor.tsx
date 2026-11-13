import React, { useState, useMemo, useEffect } from 'react';
import {
  ActiveUser,
  DatabaseState,
  GateAttendanceLog,
  GateScheduleConfig,
  MasterSiswa,
} from '../../types';
import { GateAttendanceService } from '../../services/gateAttendanceService';
import { PdfExportService } from '../../services/pdfExportService';
import { useToast } from '../Toast';
import {
  QrCode,
  LogIn,
  LogOut as LogOutIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  FileText,
  Download,
  SlidersHorizontal,
  ShieldCheck,
  Building2,
  Zap,
  Save,
} from 'lucide-react';

interface GateAttendanceMonitorProps {
  currentUser: ActiveUser;
  database: DatabaseState;
  onOpenScannerModal: (mode: 'auto' | 'masuk' | 'pulang') => void;
  refreshSignal?: number;
  onDataSynced?: () => void;
}

export function GateAttendanceMonitor({
  currentUser,
  database,
  onOpenScannerModal,
  refreshSignal = 0,
  onDataSynced,
}: GateAttendanceMonitorProps) {
  const { showToast } = useToast();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCabang, setSelectedCabang] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'Belum Scan' | 'Tepat Waktu' | 'Terlambat' | 'Masih di Sekolah' | 'Sudah Pulang'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gateLogs, setGateLogs] = useState<GateAttendanceLog[]>(() =>
    GateAttendanceService.getAllLogs()
  );
  const [scheduleConfig, setScheduleConfig] = useState<GateScheduleConfig>(() =>
    GateAttendanceService.getScheduleConfig()
  );
  const [showScheduleEditor, setShowScheduleEditor] = useState<boolean>(false);

  // Sync whenever parent scanner modal updates data
  useEffect(() => {
    setGateLogs(GateAttendanceService.getAllLogs());
  }, [refreshSignal]);

  // Deduplicated student master list
  const uniqueStudents = useMemo(() => {
    const seen = new Set<string>();
    return database.master_siswa.filter((s) => {
      const key = `${s.siswa.toLowerCase().trim()}_${s.cabang.toLowerCase().trim()}`;
      if (!s.siswa.trim() || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [database.master_siswa]);

  const branches = useMemo(() => {
    const set = new Set<string>();
    uniqueStudents.forEach((s) => set.add(s.cabang));
    return Array.from(set);
  }, [uniqueStudents]);

  // Map logs for selected date by student name
  const dateLogsMap = useMemo(() => {
    const map = new Map<string, GateAttendanceLog>();
    gateLogs
      .filter((l) => l.tanggal === selectedDate)
      .forEach((l) => {
        map.set(l.siswa.toLowerCase().trim(), l);
      });
    return map;
  }, [gateLogs, selectedDate]);

  // Combined roster rows for selected date
  const rosterRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return uniqueStudents
      .map((s) => {
        const log = dateLogsMap.get(s.siswa.toLowerCase().trim());
        const cardCode = GateAttendanceService.getStudentCardCode(s.siswa);
        const enrolled = database.siswa_kelas.find((sk) => sk.siswa === s.siswa);
        return {
          student: s,
          cardCode,
          kelas: log?.kelas || enrolled?.kelas || 'Reguler',
          log,
        };
      })
      .filter((row) => {
        const matchCabang = selectedCabang === 'all' || row.student.cabang === selectedCabang;
        const matchSearch =
          !q ||
          row.student.siswa.toLowerCase().includes(q) ||
          row.cardCode.toLowerCase().includes(q) ||
          row.kelas.toLowerCase().includes(q) ||
          row.student.cabang.toLowerCase().includes(q);

        if (!matchCabang || !matchSearch) return false;

        if (statusFilter === 'all') return true;
        if (statusFilter === 'Belum Scan') return !row.log?.jam_masuk && !row.log?.jam_pulang;
        if (statusFilter === 'Tepat Waktu') return row.log?.status_masuk === 'Tepat Waktu';
        if (statusFilter === 'Terlambat') return row.log?.status_masuk === 'Terlambat';
        if (statusFilter === 'Masih di Sekolah')
          return Boolean(row.log?.jam_masuk) && !row.log?.jam_pulang;
        if (statusFilter === 'Sudah Pulang') return Boolean(row.log?.jam_pulang);
        return true;
      });
  }, [uniqueStudents, dateLogsMap, database.siswa_kelas, selectedCabang, searchQuery, statusFilter]);

  // Metrics for selected date (all branches or filtered branch)
  const metrics = useMemo(() => {
    const baseStudents =
      selectedCabang === 'all'
        ? uniqueStudents
        : uniqueStudents.filter((s) => s.cabang === selectedCabang);

    let hadir = 0;
    let tepatWaktu = 0;
    let terlambat = 0;
    let diSekolah = 0;
    let sudahPulang = 0;

    baseStudents.forEach((s) => {
      const l = dateLogsMap.get(s.siswa.toLowerCase().trim());
      if (l?.jam_masuk) {
        hadir++;
        if (l.status_masuk === 'Tepat Waktu') tepatWaktu++;
        if (l.status_masuk === 'Terlambat') terlambat++;
        if (!l.jam_pulang) diSekolah++;
      }
      if (l?.jam_pulang) sudahPulang++;
    });

    return {
      total: baseStudents.length,
      hadir,
      belumHadir: Math.max(0, baseStudents.length - hadir),
      tepatWaktu,
      terlambat,
      diSekolah,
      sudahPulang,
    };
  }, [uniqueStudents, selectedCabang, dateLogsMap]);

  const handleQuickScanRow = (siswa: MasterSiswa, mode: 'masuk' | 'pulang') => {
    const res = GateAttendanceService.recordScan({
      database,
      siswa,
      mode,
      scannerUser: currentUser,
      metode: 'Tap Cepat Petugas',
      lokasi:
        currentUser.role === 'admin'
          ? `Gerbang Utama ${siswa.cabang}`
          : `Ruang Piket Guru (${siswa.cabang})`,
    });
    setGateLogs(res.allLogs);
    if (onDataSynced) onDataSynced();
    const jam = mode === 'masuk' ? res.log.jam_masuk : res.log.jam_pulang;
    showToast(
      mode === 'masuk' ? 'Jam Hadir Tercatat!' : 'Jam Pulang Tercatat!',
      `${siswa.siswa} (${res.log.kode_kartu}) ${mode === 'masuk' ? 'masuk' : 'pulang'} pukul ${jam} · Terlihat di Portal Orang Tua.`,
      'success'
    );
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    GateAttendanceService.saveScheduleConfig(scheduleConfig);
    setShowScheduleEditor(false);
    showToast(
      'Aturan Jam Sekolah Disimpan',
      `Batas tepat waktu masuk: ${scheduleConfig.batasJamMasuk} · Jam pulang standar: ${scheduleConfig.jamPulangStandar}`,
      'success'
    );
  };

  const handleExportPdf = () => {
    const logsForDate = gateLogs.filter(
      (l) =>
        l.tanggal === selectedDate &&
        (selectedCabang === 'all' || l.cabang === selectedCabang)
    );
    if (logsForDate.length === 0) {
      showToast('Belum Ada Data', `Tidak ada catatan scan gerbang pada tanggal ${selectedDate}.`, 'warning');
      return;
    }
    PdfExportService.exportGateAttendancePdf({
      title: `REKAP SCAN JAM HADIR & PULANG SANTRI (${selectedDate})`,
      printedBy: `${currentUser.name} (${currentUser.role.toUpperCase()})`,
      filterLabel: `${selectedDate} · ${selectedCabang === 'all' ? 'Semua Kampus' : selectedCabang}`,
      logs: logsForDate,
    });
    showToast('PDF Berhasil Diunduh', `${logsForDate.length} data scan gerbang diekspor ke PDF resmi.`, 'success');
  };

  const handleExportCsv = () => {
    const headers = [
      'Tanggal',
      'ID Kartu',
      'Nama Santri',
      'Kelas',
      'Kampus',
      'Jam Hadir',
      'Status Masuk',
      'Jam Pulang',
      'Status Pulang',
      'Durasi',
      'Petugas Scan Masuk',
      'Petugas Scan Pulang',
    ];
    const rows = rosterRows.map((r) => [
      selectedDate,
      r.cardCode,
      `"${r.student.siswa}"`,
      `"${r.kelas}"`,
      `"${r.student.cabang}"`,
      r.log?.jam_masuk || '-',
      r.log?.status_masuk || 'Belum Hadir',
      r.log?.jam_pulang || '-',
      r.log?.status_pulang || 'Belum Hadir',
      GateAttendanceService.computeDuration(r.log?.jam_masuk, r.log?.jam_pulang),
      `"${r.log?.scan_oleh_masuk || '-'}"`,
      `"${r.log?.scan_oleh_pulang || '-'}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `Monitoring_Scan_Gerbang_${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('CSV Diunduh', `Data kehadiran gerbang tanggal ${selectedDate} berhasil diunduh.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                Terintegrasi Akun {currentUser.role === 'admin' ? 'Manajemen' : 'Guru'}, Scanner Gerbang & Portal Orang Tua
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Pusat Scan & Monitoring Jam Hadir / Pulang Santri
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl">
              Setiap pemindaian kartu Smart ID oleh guru atau manajemen langsung mencatat jam masuk, ketepatan waktu, jam pulang, dan tampil real-time di akun Orang Tua.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenScannerModal('auto')}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Terminal Scan Otomatis</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenScannerModal('masuk')}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Scan Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenScannerModal('pulang')}
              className="py-2.5 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Scan Pulang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Daily KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Total Santri</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> Terdaftar
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700">Sudah Hadir</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{metrics.hadir}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-bold">
            {metrics.total > 0 ? Math.round((metrics.hadir / metrics.total) * 100) : 0}% hadir
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700">Tepat Waktu</div>
          <div className="text-2xl font-black text-blue-800 mt-1">{metrics.tepatWaktu}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">≤ {scheduleConfig.batasJamMasuk} WIB</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700">Terlambat</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{metrics.terlambat}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">&gt; {scheduleConfig.batasJamMasuk} WIB</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-700">Di Sekolah</div>
          <div className="text-2xl font-black text-indigo-800 mt-1">{metrics.diSekolah}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">Belum scan pulang</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-orange-200 shadow-xs">
          <div className="text-[11px] font-semibold text-orange-700">Sudah Pulang</div>
          <div className="text-2xl font-black text-orange-700 mt-1">{metrics.sudahPulang}</div>
          <div className="text-[10px] text-orange-600 mt-0.5">Selesai KBM</div>
        </div>
      </div>

      {/* Filters, Schedule Settings & Export Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Tanggal Monitoring
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Kampus / Cabang
            </label>
            <select
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Kampus</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Filter Status Kehadiran
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Santri</option>
              <option value="Tepat Waktu">Tepat Waktu</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Masih di Sekolah">Masih di Sekolah</option>
              <option value="Sudah Pulang">Sudah Pulang</option>
              <option value="Belum Scan">Belum Scan Masuk</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Cari Santri / ID Kartu
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama atau AW29-..."
                className="w-full text-xs rounded-xl border border-slate-300 pl-8 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Aturan Sekolah: Masuk ≤ <strong>{scheduleConfig.batasJamMasuk}</strong> · Pulang ≥{' '}
              <strong>{scheduleConfig.jamPulangStandar}</strong>
            </span>
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowScheduleEditor((v) => !v)}
                className="py-1.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Atur Jam Masuk/Pulang</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh PDF Resmi</span>
            </button>
          </div>
        </div>

        {/* Admin Schedule Config Editor */}
        {showScheduleEditor && currentUser.role === 'admin' && (
          <form
            onSubmit={handleSaveSchedule}
            className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-bold text-orange-950 mb-1">
                Batas Jam Masuk Tepat Waktu
              </label>
              <input
                type="time"
                value={scheduleConfig.batasJamMasuk}
                onChange={(e) =>
                  setScheduleConfig({ ...scheduleConfig, batasJamMasuk: e.target.value })
                }
                className="w-full text-xs font-mono font-bold rounded-xl border border-orange-300 px-3 py-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-orange-950 mb-1">
                Jam Pulang Standar Sekolah
              </label>
              <input
                type="time"
                value={scheduleConfig.jamPulangStandar}
                onChange={(e) =>
                  setScheduleConfig({ ...scheduleConfig, jamPulangStandar: e.target.value })
                }
                className="w-full text-xs font-mono font-bold rounded-xl border border-orange-300 px-3 py-2 bg-white"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Aturan Jam</span>
            </button>
          </form>
        )}
      </div>

      {/* Live Student Check-In / Check-Out Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Daftar Status Kehadiran Gerbang & Kelas ({rosterRows.length} Santri)
            </h3>
            <p className="text-xs text-slate-500">
              Guru dan manajemen dapat memantau atau melakukan scan langsung dari setiap baris santri.
            </p>
          </div>
          <QrCode className="w-5 h-5 text-blue-600 shrink-0" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold">Santri & ID Kartu</th>
                <th className="px-4 py-3 font-bold">Kampus / Kelas</th>
                <th className="px-4 py-3 font-bold text-center">Jam Hadir</th>
                <th className="px-4 py-3 font-bold text-center">Jam Pulang</th>
                <th className="px-4 py-3 font-bold text-center">Durasi</th>
                <th className="px-4 py-3 font-bold">Petugas Scan</th>
                <th className="px-4 py-3 font-bold text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rosterRows.map((row, idx) => {
                const { student, cardCode, kelas, log } = row;
                const isToday = selectedDate === todayStr;

                return (
                  <tr key={`${student.siswa}_${cardCode}_${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{student.siswa}</div>
                      <div className="text-[10px] font-mono font-bold text-blue-700">{cardCode}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{kelas}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{student.cabang}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {log?.jam_masuk ? (
                        <div>
                          <div className="font-mono font-black text-emerald-700">
                            {log.jam_masuk.slice(0, 5)} WIB
                          </div>
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold mt-0.5 ${
                              log.status_masuk === 'Tepat Waktu'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.status_masuk === 'Tepat Waktu' ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <AlertTriangle className="w-2.5 h-2.5" />
                            )}
                            {log.status_masuk}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Belum Masuk</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {log?.jam_pulang ? (
                        <div>
                          <div className="font-mono font-black text-orange-600">
                            {log.jam_pulang.slice(0, 5)} WIB
                          </div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-0.5">
                            {log.status_pulang}
                          </span>
                        </div>
                      ) : log?.jam_masuk ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Di Sekolah
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                      {GateAttendanceService.computeDuration(log?.jam_masuk, log?.jam_pulang)}
                    </td>

                    <td className="px-4 py-3">
                      {log ? (
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-slate-700">
                            <span className="text-slate-400">In:</span>{' '}
                            <strong>{log.scan_oleh_masuk || '-'}</strong>
                          </div>
                          {log.scan_oleh_pulang && (
                            <div className="text-[11px] text-slate-700">
                              <span className="text-slate-400">Out:</span>{' '}
                              <strong>{log.scan_oleh_pulang}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {isToday ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickScanRow(student, 'masuk')}
                            className="py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[10px] font-bold transition-colors cursor-pointer"
                            title="Catat Jam Masuk sekarang"
                          >
                            + Masuk
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickScanRow(student, 'pulang')}
                            className="py-1.5 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-500 text-orange-700 hover:text-white border border-orange-200 text-[10px] font-bold transition-colors cursor-pointer"
                            title="Catat Jam Pulang sekarang"
                          >
                            + Pulang
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Arsip</span>
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
  );
}
