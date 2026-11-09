import React, { useState } from 'react';
import { initialTugasList, initialPengumpulanList } from '../../data/assignmentData';
import { TugasItem, PengumpulanTugas, ActiveUser, DatabaseState, LogNilai } from '../../types';
import { useToast } from '../Toast';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Award,
  Upload,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  User,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface AssignmentHubProps {
  currentUser: ActiveUser;
  database: DatabaseState;
  onGradeSubmitted?: (newNilai: LogNilai) => void;
}

export function AssignmentHub({ currentUser, database, onGradeSubmitted }: AssignmentHubProps) {
  const { showToast } = useToast();

  const [tugasList, setTugasList] = useState<TugasItem[]>(initialTugasList);
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanTugas[]>(initialPengumpulanList);
  const [activeFilter, setActiveFilter] = useState<'semua' | 'aktif' | 'selesai'>('semua');

  // Submit Homework Modal (for student)
  const [submittingTugas, setSubmittingTugas] = useState<TugasItem | null>(null);
  const [jawabanTeks, setJawabanTeks] = useState<string>('');
  const [linkLampiran, setLinkLampiran] = useState<string>('');

  // Create Assignment Modal (for tutor)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newJudul, setNewJudul] = useState<string>('');
  const [newMapel, setNewMapel] = useState<string>('Matematika Wajib');
  const [newKelas, setNewKelas] = useState<string>('10 SMA Unggulan A');
  const [newTenggat, setNewTenggat] = useState<string>('2026-11-20');
  const [newWaktu, setNewWaktu] = useState<string>('23:59');
  const [newInstruksi, setNewInstruksi] = useState<string>('');
  const [newBobot, setNewBobot] = useState<number>(20);

  // Grade Submission Modal (for tutor)
  const [gradingItem, setGradingItem] = useState<{
    tugas: TugasItem;
    pengumpulan: PengumpulanTugas;
  } | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(85);
  const [catatanInput, setCatatanInput] = useState<string>('Sangat baik, memenuhi standar KKM 85.');

  const isTutorOrAdmin = currentUser.role === 'tutor' || currentUser.role === 'admin';
  const currentStudentName = currentUser.role === 'siswa' ? currentUser.name : database.master_siswa[0]?.siswa || 'Ahmad Rizky Pratama';

  // Handle student submit assignment
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTugas) return;
    if (!jawabanTeks.trim()) {
      showToast('Form Belum Lengkap', 'Tuliskan jawaban atau keterangan pengerjaan tugas.', 'warning');
      return;
    }

    const newKumpul: PengumpulanTugas = {
      id: `KMP-${Date.now().toString().slice(-4)}`,
      id_tugas: submittingTugas.id,
      siswa: currentStudentName,
      tanggal_kumpul: new Date().toISOString().replace('T', ' ').substring(0, 16),
      teks_jawaban: jawabanTeks,
      link_lampiran: linkLampiran.trim() || undefined,
      status: 'Menunggu Dinilai',
    };

    setPengumpulanList([newKumpul, ...pengumpulanList]);
    setSubmittingTugas(null);
    setJawabanTeks('');
    setLinkLampiran('');
    showToast('Tugas Terkirim!', `Tugas ${submittingTugas.judul} berhasil dikumpulkan untuk diperiksa Asatidz.`, 'success');
  };

  // Handle teacher create new assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul.trim() || !newInstruksi.trim()) {
      showToast('Form Belum Lengkap', 'Lengkapi judul dan instruksi tugas.', 'warning');
      return;
    }

    const newTgs: TugasItem = {
      id: `TGS-${Date.now().toString().slice(-4)}`,
      judul: newJudul,
      mapel: newMapel,
      guru: currentUser.name,
      kelas: newKelas,
      tenggat: newTenggat,
      waktu_tenggat: newWaktu,
      instruksi: newInstruksi,
      bobot: Number(newBobot),
      kkm: 85,
    };

    setTugasList([newTgs, ...tugasList]);
    setShowCreateModal(false);
    setNewJudul('');
    setNewInstruksi('');
    showToast('Tugas Diterbitkan', `Tugas "${newTgs.judul}" berhasil dipublikasikan ke kelas.`, 'success');
  };

  // Handle teacher grade submission
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingItem) return;

    const updatedSubmissions = pengumpulanList.map((p) => {
      if (p.id === gradingItem.pengumpulan.id) {
        return {
          ...p,
          status: 'Sudah Dinilai' as const,
          nilai: Number(gradeInput),
          catatan_guru: catatanInput,
          dinilai_oleh: currentUser.name,
        };
      }
      return p;
    });

    setPengumpulanList(updatedSubmissions);

    // Save score to database log_nilai
    const newNilai: LogNilai = {
      id_nilai: `NIL-TGS-${Date.now().toString().slice(-4)}`,
      tanggal: new Date().toISOString().split('T')[0],
      id_kelas: 'KLS-10A-MAT',
      siswa: gradingItem.pengumpulan.siswa,
      mapel: gradingItem.tugas.mapel,
      jenis_penilaian: 'Tugas Terstruktur',
      nilai: Number(gradeInput),
      catatan: `Nilai Tugas: ${gradingItem.tugas.judul} - ${catatanInput}`,
      id_tutor: currentUser.id_tutor || 'TUTOR-001',
      timestamp: new Date().toISOString(),
    };

    if (onGradeSubmitted) {
      onGradeSubmitted(newNilai);
    } else {
      database.log_nilai.unshift(newNilai);
    }

    setGradingItem(null);
    showToast('Penilaian Berhasil', `Nilai ${gradeInput} disimpan ke buku nilai santri.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Digital Assignment & Homework Hub · Standar KKM 85</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pusat Tugas, Portofolio & Pengumpulan Digital
            </h2>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              Pengumpulan tugas terstruktur dengan verifikasi otomatis KKM 85, umpan balik kualitatif Asatidz, dan integrasi langsung ke buku nilai rapor LMS.
            </p>
          </div>

          {isTutorOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Tugas Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1.5 gap-1 shadow-xs">
          <button
            onClick={() => setActiveFilter('semua')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'semua'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Tugas ({tugasList.length})
          </button>
          <button
            onClick={() => setActiveFilter('aktif')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'aktif'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tugas Aktif
          </button>
          <button
            onClick={() => setActiveFilter('selesai')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'selesai'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sudah Dinilai
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Standar Ketuntasan Minimal: <strong>KKM 85</strong>
        </span>
      </div>

      {/* Assignment Cards List */}
      <div className="space-y-4">
        {tugasList.map((tugas) => {
          // Find student's submission for this assignment
          const studentSubmission = pengumpulanList.find(
            (p) => p.id_tugas === tugas.id && (isTutorOrAdmin ? true : p.siswa === currentStudentName)
          );

          // All submissions for this assignment (for tutor view)
          const allSubmissionsForTugas = pengumpulanList.filter((p) => p.id_tugas === tugas.id);

          return (
            <div
              key={tugas.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-7 space-y-4 hover:border-blue-400 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                      {tugas.mapel}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Kelas: {tugas.kelas}
                    </span>
                    <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      KKM {tugas.kkm}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {tugas.judul}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Tenggat: {tugas.tenggat} {tugas.waktu_tenggat}</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {tugas.instruksi}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Pengampu: <strong>{tugas.guru}</strong></span>
                  <span className="mx-1.5">·</span>
                  <span>Bobot Nilai: <strong>{tugas.bobot}%</strong></span>
                </div>

                {/* Status Indicator & Action */}
                {!isTutorOrAdmin ? (
                  // Student View Actions
                  <div>
                    {studentSubmission ? (
                      <div className="flex items-center gap-2">
                        {studentSubmission.status === 'Sudah Dinilai' ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black border ${
                                (studentSubmission.nilai || 0) >= 85
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              Nilai: {studentSubmission.nilai} ({(studentSubmission.nilai || 0) >= 85 ? 'Tuntas KKM 85' : 'Remedial'})
                            </span>
                            <span className="text-[11px] text-slate-500 italic">
                              "{studentSubmission.catatan_guru}"
                            </span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Sudah Dikumpulkan (Menunggu Asatidz)</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setSubmittingTugas(tugas)}
                        className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Kumpulkan Tugas</span>
                      </button>
                    )}
                  </div>
                ) : (
                  // Tutor View Actions
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {allSubmissionsForTugas.length} Pengumpulan Santri
                    </span>

                    {allSubmissionsForTugas.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {allSubmissionsForTugas.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setGradingItem({ tugas, pengumpulan: sub })}
                            className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                              sub.status === 'Sudah Dinilai'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-orange-50 text-orange-800 border-orange-200'
                            }`}
                          >
                            <span>{sub.siswa.split(' ')[0]}</span>
                            <span>{sub.status === 'Sudah Dinilai' ? `(${sub.nilai})` : 'Periksa'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: SUBMIT HOMEWORK (SANTRI) */}
      {submittingTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                  Pengumpulan Tugas Santri
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {submittingTugas.judul}
                </h3>
              </div>
              <button
                onClick={() => setSubmittingTugas(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jawaban / Catatan Pengerjaan Tugas:
                </label>
                <textarea
                  rows={4}
                  required
                  value={jawabanTeks}
                  onChange={(e) => setJawabanTeks(e.target.value)}
                  placeholder="Tuliskan uraian jawaban, rangkuman, atau keterangan pengerjaan di sini..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Link Lampiran File / Dokumen (Opsional Google Drive / PDF):
                </label>
                <input
                  type="url"
                  value={linkLampiran}
                  onChange={(e) => setLinkLampiran(e.target.value)}
                  placeholder="https://drive.google.com/... atau link dokumen tugas"
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2 font-medium">
                <Award className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Target nilai tugas berpatokan standar KKM 85 AL-WILDAN 29 Depok.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingTugas(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Jawaban Tugas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GRADE SUBMISSION (TUTOR) */}
      {gradingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                  Penilaian Tugas Santri
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {gradingItem.pengumpulan.siswa} — {gradingItem.tugas.judul}
                </h3>
              </div>
              <button
                onClick={() => setGradingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Student submission preview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">
                Jawaban Santri ({gradingItem.pengumpulan.tanggal_kumpul}):
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {gradingItem.pengumpulan.teks_jawaban}
              </p>
              {gradingItem.pengumpulan.link_lampiran && (
                <div className="pt-1">
                  <a
                    href={gradingItem.pengumpulan.link_lampiran}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tautan Lampiran Santri</span>
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nilai Angka (0 - 100):
                  </label>
                  <span className="text-xs font-bold text-orange-600">
                    Standar KKM: 85
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  className="w-full text-base font-black text-slate-900 rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Umpan Balik Guru / Asatidz:
                </label>
                <textarea
                  rows={3}
                  required
                  value={catatanInput}
                  onChange={(e) => setCatatanInput(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingItem(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Nilai & Sinkronkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE ASSIGNMENT (TUTOR) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Buat Penugasan Terstruktur Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  required
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  placeholder="Contoh: Latihan Soal Bab 4 Matriks..."
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    required
                    value={newMapel}
                    onChange={(e) => setNewMapel(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kelas Sasaran
                  </label>
                  <input
                    type="text"
                    required
                    value={newKelas}
                    onChange={(e) => setNewKelas(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tenggat Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={newTenggat}
                    onChange={(e) => setNewTenggat(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jam Tenggat (WIB)
                  </label>
                  <input
                    type="time"
                    required
                    value={newWaktu}
                    onChange={(e) => setNewWaktu(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instruksi & Rubrik Pengerjaan:
                </label>
                <textarea
                  rows={3}
                  required
                  value={newInstruksi}
                  onChange={(e) => setNewInstruksi(e.target.value)}
                  placeholder="Tuliskan petunjuk pengerjaan dan syarat kelulusan KKM 85..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Terbitkan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
