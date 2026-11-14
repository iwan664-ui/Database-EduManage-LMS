import React, { useEffect, useMemo, useState } from 'react';
import {
  AcademicReportPeriodType,
  AcademicSemesterType,
  AcademicTermReportItem,
  AcademicTermSubjectScore,
  ActiveUser,
  DatabaseState,
} from '../../types';
import { TermReportService } from '../../services/termReportService';
import { PdfExportService } from '../../services/pdfExportService';
import { TutorWeeklyReportSender } from '../tutor/TutorWeeklyReportSender';
import { useToast } from '../Toast';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  SendHorizontal,
  Trash2,
  Users,
} from 'lucide-react';

export type AcademicReportHubTab = 'pekanan' | 'tengah-semester' | 'semester';

interface AcademicTermReportCenterProps {
  user: ActiveUser;
  database: DatabaseState;
  initialTab?: AcademicReportHubTab;
}

export function AcademicTermReportCenter({
  user,
  database,
  initialTab = 'tengah-semester',
}: AcademicTermReportCenterProps) {
  const { showToast } = useToast();
  const [hubTab, setHubTab] = useState<AcademicReportHubTab>(initialTab);

  useEffect(() => {
    setHubTab(initialTab);
  }, [initialTab]);

  // Term configuration for PTS & Semester
  const jenisRapor: AcademicReportPeriodType =
    hubTab === 'tengah-semester' ? 'Tengah Semester' : 'Semester';
  const [semester, setSemester] = useState<AcademicSemesterType>('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState<string>('2026/2027');
  const [tanggalRapor, setTanggalRapor] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [bobotHarian, setBobotHarian] = useState<number>(40);
  const [bobotUjian, setBobotUjian] = useState<number>(60);

  // Filters & sub-view
  const [subView, setSubView] = useState<'compose' | 'archive'>('compose');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [selectedStudentName, setSelectedStudentName] = useState<string>(
    database.master_siswa[0]?.siswa || ''
  );

  // Persisted term reports
  const [allTermReports, setAllTermReports] = useState<AcademicTermReportItem[]>(() =>
    TermReportService.getAllReports()
  );

  const campuses = useMemo(() => {
    const s = new Set<string>();
    database.master_siswa.forEach((m) => s.add(m.cabang));
    return Array.from(s);
  }, [database.master_siswa]);

  const filteredStudents = useMemo(() => {
    return database.master_siswa.filter((st) => {
      if (campusFilter !== 'all' && st.cabang !== campusFilter) return false;
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase();
        return st.siswa.toLowerCase().includes(q) || st.cabang.toLowerCase().includes(q);
      }
      return true;
    });
  }, [database.master_siswa, campusFilter, searchStudent]);

  useEffect(() => {
    if (
      filteredStudents.length > 0 &&
      !filteredStudents.some((s) => s.siswa === selectedStudentName)
    ) {
      setSelectedStudentName(filteredStudents[0].siswa);
    }
  }, [filteredStudents, selectedStudentName]);

  // Active editable draft
  const [draft, setDraft] = useState<AcademicTermReportItem | null>(null);

  // Extra subject add state
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectTeacher, setNewSubjectTeacher] = useState<string>(user.name);

  useEffect(() => {
    if (hubTab === 'pekanan') return;
    if (!selectedStudentName) {
      setDraft(null);
      return;
    }

    const existing = allTermReports.find(
      (r) =>
        r.siswa.toLowerCase().trim() === selectedStudentName.toLowerCase().trim() &&
        r.jenis_rapor === jenisRapor &&
        r.semester === semester &&
        r.tahun_ajaran === tahunAjaran
    );

    if (existing) {
      setDraft(existing);
    } else {
      setDraft(
        TermReportService.buildStudentTermDraft({
          database,
          studentName: selectedStudentName,
          jenisRapor,
          semester,
          tahunAjaran,
          waliKelas: user.name,
          tanggalRapor,
          bobotHarian,
          bobotUjian,
        })
      );
    }
  }, [
    hubTab,
    jenisRapor,
    semester,
    tahunAjaran,
    tanggalRapor,
    bobotHarian,
    bobotUjian,
    selectedStudentName,
    database,
    user.name,
    allTermReports,
  ]);

  const handleRebuildAuto = () => {
    if (!selectedStudentName) return;
    const fresh = TermReportService.buildStudentTermDraft({
      database,
      studentName: selectedStudentName,
      jenisRapor,
      semester,
      tahunAjaran,
      waliKelas: user.name,
      tanggalRapor,
      bobotHarian,
      bobotUjian,
    });
    setDraft(fresh);
    showToast(
      'Rapor Disusun Ulang',
      `Nilai formatif, presensi, tahfidz, dan adab ${selectedStudentName} diperbarui dari log LMS.`,
      'info'
    );
  };

  const handleUpdateSubjectScore = (
    idx: number,
    patch: Partial<AcademicTermSubjectScore>
  ) => {
    if (!draft) return;
    const updatedList = draft.daftar_nilai.map((item, i) =>
      i === idx ? { ...item, ...patch } : item
    );
    const recalculated = TermReportService.recalculateReportAggregates(
      { ...draft, daftar_nilai: updatedList },
      bobotHarian,
      bobotUjian
    );
    setDraft(recalculated);
  };

  const handleAddSubjectRow = () => {
    if (!draft || !newSubjectName.trim()) {
      showToast('Nama Mapel Kosong', 'Masukkan nama mata pelajaran terlebih dahulu.', 'warning');
      return;
    }
    const newRow: AcademicTermSubjectScore = {
      id_kelas: `CUSTOM-${Date.now().toString().slice(-4)}`,
      mapel: newSubjectName.trim(),
      guru: newSubjectTeacher.trim() || user.name,
      nilai_harian: 85,
      nilai_ujian: 85,
      nilai_akhir: 85,
      predikat: 'B',
      tuntas_kkm: true,
      capaian_kompetensi: `Menguasai kompetensi inti ${newSubjectName.trim()} sesuai standar KKM 85.`,
    };
    const recalculated = TermReportService.recalculateReportAggregates(
      { ...draft, daftar_nilai: [...draft.daftar_nilai, newRow] },
      bobotHarian,
      bobotUjian
    );
    setDraft(recalculated);
    setNewSubjectName('');
  };

  const handleRemoveSubjectRow = (idx: number) => {
    if (!draft) return;
    const next = draft.daftar_nilai.filter((_, i) => i !== idx);
    setDraft(
      TermReportService.recalculateReportAggregates(
        { ...draft, daftar_nilai: next },
        bobotHarian,
        bobotUjian
      )
    );
  };

  const handleSaveOrPublish = (publishToParents: boolean) => {
    if (!draft) return;
    const payload: AcademicTermReportItem = {
      ...draft,
      tanggal_rapor: tanggalRapor,
      bobot_harian_persen: bobotHarian,
      bobot_ujian_persen: bobotUjian,
      status_publikasi: publishToParents ? 'Diterbitkan ke Ortu' : 'Draf',
      diterbitkan_pada: publishToParents
        ? draft.diterbitkan_pada || new Date().toISOString()
        : draft.diterbitkan_pada,
    };
    const updated = TermReportService.saveReport(payload);
    setAllTermReports(updated);
    setDraft(
      updated.find(
        (r) =>
          r.siswa.toLowerCase().trim() === payload.siswa.toLowerCase().trim() &&
          r.jenis_rapor === payload.jenis_rapor &&
          r.semester === payload.semester &&
          r.tahun_ajaran === payload.tahun_ajaran
      ) || payload
    );

    showToast(
      publishToParents ? 'Rapor Diterbitkan ke Ortu' : 'Draf Rapor Disimpan',
      publishToParents
        ? `Rapor ${jenisRapor} ${draft.siswa} telah diterbitkan ke Portal Santri & Wali Murid.`
        : `Draf Rapor ${jenisRapor} ${draft.siswa} berhasil disimpan.`,
      'success'
    );
  };

  const handlePublishBatch = () => {
    if (filteredStudents.length === 0) return;
    const batch = filteredStudents.map((st) =>
      TermReportService.buildStudentTermDraft({
        database,
        studentName: st.siswa,
        jenisRapor,
        semester,
        tahunAjaran,
        waliKelas: user.name,
        tanggalRapor,
        bobotHarian,
        bobotUjian,
      })
    );
    const updated = TermReportService.publishBatchReports(batch);
    setAllTermReports(updated);
    showToast(
      'Penerbitan Massal Berhasil',
      `${batch.length} Rapor ${jenisRapor} (Semester ${semester} ${tahunAjaran}) diterbitkan ke Portal Orang Tua.`,
      'success'
    );
  };

  const handleExportPdf = () => {
    if (!draft) return;
    const recalculated = TermReportService.recalculateReportAggregates(
      { ...draft, tanggal_rapor: tanggalRapor },
      bobotHarian,
      bobotUjian
    );
    PdfExportService.exportTermReportPdf(recalculated);
    showToast(
      'PDF Rapor Diunduh',
      `Rapor ${jenisRapor} ${draft.siswa} (${semester} ${tahunAjaran}) berhasil diunduh.`,
      'success'
    );
  };

  const handleDeleteArchiveReport = (id: string) => {
    const next = TermReportService.deleteReport(id);
    setAllTermReports(next);
    showToast('Rapor Dihapus', 'Arsip rapor telah dihapus.', 'info');
  };

  const archiveReports = useMemo(
    () =>
      allTermReports
        .filter((r) => r.jenis_rapor === jenisRapor)
        .sort((a, b) =>
          (b.diterbitkan_pada || b.tanggal_rapor).localeCompare(
            a.diterbitkan_pada || a.tanggal_rapor
          )
        ),
    [allTermReports, jenisRapor]
  );

  const termStats = useMemo(() => {
    const publishedCount = filteredStudents.filter((st) =>
      allTermReports.some(
        (r) =>
          r.siswa.toLowerCase().trim() === st.siswa.toLowerCase().trim() &&
          r.jenis_rapor === jenisRapor &&
          r.semester === semester &&
          r.tahun_ajaran === tahunAjaran &&
          r.status_publikasi !== 'Draf'
      )
    ).length;

    const readCount = filteredStudents.filter((st) =>
      allTermReports.some(
        (r) =>
          r.siswa.toLowerCase().trim() === st.siswa.toLowerCase().trim() &&
          r.jenis_rapor === jenisRapor &&
          r.semester === semester &&
          r.tahun_ajaran === tahunAjaran &&
          r.status_publikasi === 'Dibaca Orang Tua'
      )
    ).length;

    return {
      totalStudents: filteredStudents.length,
      publishedCount,
      readCount,
    };
  }, [filteredStudents, allTermReports, jenisRapor, semester, tahunAjaran]);

  return (
    <div className="space-y-6">
      {/* Unified Academic Report Type Navigation Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Sistem Evaluasi Akademik · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Pusat Rapor Pekanan, Tengah Semester &amp; Semester</span>
          </h2>
          <p className="text-xs text-slate-500">
            Susun, evaluasi standar KKM 85, terbitkan ke Portal Orang Tua, dan cetak PDF resmi untuk seluruh jenjang laporan akademik.
          </p>
        </div>

        <div className="inline-flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setHubTab('pekanan')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              hubTab === 'pekanan'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>Rapor Pekanan</span>
          </button>
          <button
            type="button"
            onClick={() => setHubTab('tengah-semester')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              hubTab === 'tengah-semester'
                ? 'bg-orange-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Rapor Tengah Semester (PTS)</span>
          </button>
          <button
            type="button"
            onClick={() => setHubTab('semester')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              hubTab === 'semester'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rapor Semester (PAS/PAT)</span>
          </button>
        </div>
      </div>

      {/* MODE 1: RAPOR PEKANAN */}
      {hubTab === 'pekanan' && (
        <TutorWeeklyReportSender user={user} database={database} />
      )}

      {/* MODE 2 & 3: RAPOR TENGAH SEMESTER & RAPOR SEMESTER */}
      {hubTab !== 'pekanan' && (
        <>
          {/* Term Configuration & Batch Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {jenisRapor === 'Tengah Semester'
                    ? 'Pengelolaan Rapor Tengah Semester (PTS)'
                    : 'Pengelolaan Rapor Akhir Semester (PAS / PAT)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Bobot otomatis menggabungkan nilai harian LMS ({bobotHarian}%) dan nilai ujian{' '}
                  {jenisRapor === 'Tengah Semester' ? 'PTS' : 'PAS/PAT'} ({bobotUjian}%) terhadap standar KKM 85.
                </p>
              </div>

              <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 shrink-0 self-start">
                <button
                  type="button"
                  onClick={() => setSubView('compose')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                    subView === 'compose'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Susun &amp; Nilai Rapor
                </button>
                <button
                  type="button"
                  onClick={() => setSubView('archive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                    subView === 'archive'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Arsip Terbit ({archiveReports.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as AcademicSemesterType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun Ajaran</label>
                <select
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold"
                >
                  <option value="2026/2027">2026/2027</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Kampus</label>
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                >
                  <option value="all">Semua Kampus</option>
                  {campuses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Rapor</label>
                <input
                  type="date"
                  value={tanggalRapor}
                  onChange={(e) => setTanggalRapor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Bobot Harian / Ujian (%)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bobotHarian}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setBobotHarian(v);
                      setBobotUjian(100 - v);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-center"
                    title="Bobot Nilai Harian (%)"
                  />
                  <span className="text-xs font-bold text-slate-400">/</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bobotUjian}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setBobotUjian(v);
                      setBobotHarian(100 - v);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-center"
                    title="Bobot Nilai PTS/PAS (%)"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handlePublishBatch}
                  disabled={filteredStudents.length === 0}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Terbitkan Semua ({filteredStudents.length})</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
                <span>
                  Periode: <strong className="font-sans text-slate-900">{jenisRapor} · {semester} {tahunAjaran}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-bold">
                  Terbit: {termStats.publishedCount}/{termStats.totalStudents} santri
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-700 font-bold">
                  Dibaca Ortu: {termStats.readCount}
                </span>
              </div>
            </div>
          </div>

          {/* SUB-VIEW 1: COMPOSE & EDIT */}
          {subView === 'compose' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Student Selector */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[780px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Daftar Santri ({filteredStudents.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">Klik untuk kelola nilai</span>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      placeholder="Cari nama santri..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Tidak ada santri yang cocok.
                    </div>
                  ) : (
                    filteredStudents.map((st) => {
                      const existing = allTermReports.find(
                        (r) =>
                          r.siswa.toLowerCase().trim() === st.siswa.toLowerCase().trim() &&
                          r.jenis_rapor === jenisRapor &&
                          r.semester === semester &&
                          r.tahun_ajaran === tahunAjaran
                      );
                      const isSelected = selectedStudentName === st.siswa;

                      return (
                        <button
                          key={st.siswa}
                          type="button"
                          onClick={() => setSelectedStudentName(st.siswa)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50 text-blue-950' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                              {st.siswa}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{st.cabang}</div>
                          </div>
                          <div className="text-[11px] font-bold shrink-0">
                            {existing?.status_publikasi === 'Dibaca Orang Tua' ? (
                              <span className="text-blue-700 flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> Dibaca
                              </span>
                            ) : existing?.status_publikasi === 'Diterbitkan ke Ortu' ? (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Terbit
                              </span>
                            ) : (
                              <span className="text-slate-400">Draf</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Term Report Editor */}
              <div className="lg:col-span-8">
                {!draft ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Pilih santri di panel sebelah kiri untuk menyusun Rapor {jenisRapor}.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Student Report Header */}
                    <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-bold text-slate-700">{draft.jenis_rapor}</span>
                          <span aria-hidden="true">·</span>
                          <span>Semester {draft.semester} {draft.tahun_ajaran}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-bold ${
                              draft.status_publikasi === 'Dibaca Orang Tua'
                                ? 'text-blue-700'
                                : draft.status_publikasi === 'Diterbitkan ke Ortu'
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                            }`}
                          >
                            {draft.status_publikasi}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {draft.siswa}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {draft.kelas_utama} · {draft.cabang} · Wali Kelas: {draft.wali_kelas}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRebuildAuto}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer self-start shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Susun Ulang Otomatis</span>
                      </button>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* 4 Quick Academic Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[11px] font-semibold text-slate-500">Rata-rata Akhir</div>
                          <div className="text-xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
                            {draft.rata_rata_umum}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[11px] font-semibold text-slate-500">Ketuntasan KKM 85</div>
                          <div
                            className={`text-xl font-black font-mono tabular-nums mt-0.5 ${
                              draft.persen_ketuntasan === 100 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {draft.persen_ketuntasan}%
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[11px] font-semibold text-slate-500">Kehadiran</div>
                          <div className="text-xl font-black text-emerald-700 font-mono tabular-nums mt-0.5">
                            {draft.persen_kehadiran}%
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[11px] font-semibold text-slate-500">Predikat Adab</div>
                          <div className="text-sm font-extrabold text-slate-900 mt-1">
                            {draft.adab_predikat}
                          </div>
                        </div>
                      </div>

                      {/* Subject Scores Editable Matrix */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                            Daftar Nilai Mata Pelajaran ({draft.daftar_nilai.length} Mapel)
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                            Formula: {bobotHarian}% Harian + {bobotUjian}% {jenisRapor === 'Tengah Semester' ? 'PTS' : 'PAS'}
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="px-3 py-2.5 font-semibold">Mata Pelajaran</th>
                                <th className="px-2.5 py-2.5 font-semibold text-center w-20">Harian</th>
                                <th className="px-2.5 py-2.5 font-semibold text-center w-20">
                                  {jenisRapor === 'Tengah Semester' ? 'PTS' : 'PAS/PAT'}
                                </th>
                                <th className="px-2.5 py-2.5 font-semibold text-center w-20">Akhir</th>
                                <th className="px-2.5 py-2.5 font-semibold text-center w-16">Pred</th>
                                <th className="px-3 py-2.5 font-semibold">Deskripsi Capaian Kompetensi</th>
                                <th className="px-2 py-2.5 w-8" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {draft.daftar_nilai.map((sub, idx) => (
                                <tr key={`${sub.id_kelas}_${idx}`} className="hover:bg-slate-50/70">
                                  <td className="px-3 py-2.5">
                                    <div className="font-bold text-slate-900">{sub.mapel}</div>
                                    <div className="text-[10px] text-slate-500">{sub.guru}</div>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={sub.nilai_harian}
                                      onChange={(e) =>
                                        handleUpdateSubjectScore(idx, {
                                          nilai_harian: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                        })
                                      }
                                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white text-center font-mono font-bold tabular-nums"
                                    />
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={sub.nilai_ujian}
                                      onChange={(e) =>
                                        handleUpdateSubjectScore(idx, {
                                          nilai_ujian: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                        })
                                      }
                                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white text-center font-mono font-bold tabular-nums"
                                    />
                                  </td>
                                  <td
                                    className={`px-2 py-2 text-center font-mono font-black tabular-nums ${
                                      sub.tuntas_kkm ? 'text-emerald-700' : 'text-rose-700'
                                    }`}
                                  >
                                    {sub.nilai_akhir}
                                  </td>
                                  <td className="px-2 py-2 text-center font-mono font-extrabold text-slate-800">
                                    {sub.predikat}
                                  </td>
                                  <td className="px-2.5 py-2">
                                    <input
                                      type="text"
                                      value={sub.capaian_kompetensi}
                                      onChange={(e) =>
                                        handleUpdateSubjectScore(idx, {
                                          capaian_kompetensi: e.target.value,
                                        })
                                      }
                                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700"
                                    />
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubjectRow(idx)}
                                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                      title="Hapus baris mapel"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Quick add extra subject */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            placeholder="Tambah mata pelajaran (misal: Bahasa Arab)"
                            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                          />
                          <input
                            type="text"
                            value={newSubjectTeacher}
                            onChange={(e) => setNewSubjectTeacher(e.target.value)}
                            placeholder="Guru Pengampu"
                            className="w-44 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddSubjectRow}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Mapel</span>
                          </button>
                        </div>
                      </div>

                      {/* Non-Academic, Attendance & Decision Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Capaian Tahfidz Al-Qur&apos;an
                          </label>
                          <input
                            type="text"
                            value={draft.tahfidz_capaian}
                            onChange={(e) => setDraft({ ...draft, tahfidz_capaian: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Ekstrakurikuler &amp; Prestasi
                          </label>
                          <input
                            type="text"
                            value={draft.ekskul_catatan}
                            onChange={(e) => setDraft({ ...draft, ekskul_catatan: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Predikat Adab &amp; Kepribadian
                          </label>
                          <select
                            value={draft.adab_predikat}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                adab_predikat: e.target.value as AcademicTermReportItem['adab_predikat'],
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                          >
                            <option value="Sangat Baik">Sangat Baik</option>
                            <option value="Baik">Baik</option>
                            <option value="Cukup">Cukup</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Sakit</label>
                            <input
                              type="number"
                              min={0}
                              value={draft.sakit}
                              onChange={(e) =>
                                setDraft({ ...draft, sakit: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Izin</label>
                            <input
                              type="number"
                              min={0}
                              value={draft.izin}
                              onChange={(e) =>
                                setDraft({ ...draft, izin: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Alfa</label>
                            <input
                              type="number"
                              min={0}
                              value={draft.alfa}
                              onChange={(e) =>
                                setDraft({ ...draft, alfa: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Catatan Wali Kelas / Pembina Akademik
                          </label>
                          <textarea
                            rows={2}
                            value={draft.catatan_wali_kelas}
                            onChange={(e) =>
                              setDraft({ ...draft, catatan_wali_kelas: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Keputusan &amp; Rekomendasi Akademik
                          </label>
                          <input
                            type="text"
                            value={draft.keputusan_akademik}
                            onChange={(e) =>
                              setDraft({ ...draft, keputusan_akademik: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSaveOrPublish(false)}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Draf</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveOrPublish(true)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Terbitkan ke Portal Ortu</span>
                        </button>

                        <a
                          href={TermReportService.buildWhatsAppUrl(draft)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Kirim Ringkasan WA</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleExportPdf}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Unduh PDF Resmi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: ARCHIVE */}
          {subView === 'archive' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Arsip Rapor {jenisRapor} Terdata
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh rapor {jenisRapor.toLowerCase()} yang telah disimpan atau diterbitkan ke Portal Orang Tua.
                </p>
              </div>

              {archiveReports.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Belum ada arsip Rapor {jenisRapor} tersimpan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Santri &amp; Kelas</th>
                        <th className="px-4 py-3 font-semibold">Periode Akademik</th>
                        <th className="px-4 py-3 font-semibold text-center">Rata-rata</th>
                        <th className="px-4 py-3 font-semibold text-center">Tuntas KKM 85</th>
                        <th className="px-4 py-3 font-semibold">Status Publikasi</th>
                        <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {archiveReports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{rep.siswa}</div>
                            <div className="text-[11px] text-slate-500">
                              {rep.kelas_utama} · {rep.cabang}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">
                              {rep.jenis_rapor} · {rep.semester} {rep.tahun_ajaran}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {rep.tanggal_rapor}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-black text-slate-900 tabular-nums">
                            {rep.rata_rata_umum}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700 tabular-nums">
                            {rep.persen_ketuntasan}%
                          </td>
                          <td className="px-4 py-3 font-bold">
                            <span
                              className={
                                rep.status_publikasi === 'Dibaca Orang Tua'
                                  ? 'text-blue-700'
                                  : rep.status_publikasi === 'Diterbitkan ke Ortu'
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                              }
                            >
                              {rep.status_publikasi}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentName(rep.siswa);
                                  setSemester(rep.semester);
                                  setTahunAjaran(rep.tahun_ajaran);
                                  setSubView('compose');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                              >
                                Sunting
                              </button>
                              <button
                                type="button"
                                onClick={() => PdfExportService.exportTermReportPdf(rep)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                                title="Unduh PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteArchiveReport(rep.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
