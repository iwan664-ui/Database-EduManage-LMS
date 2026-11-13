import React, { useState, useEffect } from 'react';
import { ActiveUser, BatchInputRow, DatabaseState, KehadiranStatus, LogAbsensi, LogNilai } from '../../types';
import { SheetsService } from '../../services/sheetsService';
import { useToast } from '../Toast';
import {
  CheckCircle2,
  Save,
  Users,
  Check,
  RotateCcw,
  BookOpen,
  Sparkles,
  Award,
  AlertCircle,
  MessageSquare,
  CopyCheck,
  BookText,
} from 'lucide-react';

interface TutorInputFormProps {
  user: ActiveUser;
  database: DatabaseState;
  selectedClassId: string;
  onClassChange: (id: string) => void;
  onSaveSuccess: () => void;
}

export function TutorInputForm({
  user,
  database,
  selectedClassId,
  onClassChange,
  onSaveSuccess,
}: TutorInputFormProps) {
  const { showToast } = useToast();

  // Standar KKM Baru: 85
  const KKM_STANDARD = 85;

  // Filter kelas untuk dropdown (utamakan kelas milik tutor ini jika ada)
  const tutorClasses = database.master_kelas.filter(
    (k) => k.guru.toLowerCase().trim() === user.name.toLowerCase().trim()
  );
  const availableClasses = tutorClasses.length > 0 ? tutorClasses : database.master_kelas;

  // Tanggal default hari ini (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [inputDate, setInputDate] = useState<string>(todayStr);
  const [globalAssessmentType, setGlobalAssessmentType] = useState<string>('Ulangan Harian');
  const [globalMateri, setGlobalMateri] = useState<string>('');
  const [autoSyncMateri, setAutoSyncMateri] = useState<boolean>(true);
  const [enableGrades, setEnableGrades] = useState<boolean>(true);
  const [showNotesField, setShowNotesField] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form row state per siswa
  const [rows, setRows] = useState<BatchInputRow[]>([]);

  // Cari detail kelas aktif
  const activeClass = database.master_kelas.find((k) => k.id_kelas === selectedClassId) || availableClasses[0];

  // Saat kelas berubah, tarik siswa dari siswa_kelas
  useEffect(() => {
    if (!activeClass) return;

    const students = database.siswa_kelas.filter((sk) => sk.id_kelas === activeClass.id_kelas);

    // Siapkan default row state
    const initialRows: BatchInputRow[] = students.map((s) => ({
      siswa: s.siswa,
      email_siswa: s.email_siswa,
      status_kehadiran: 'Hadir',
      materi_diajarkan: globalMateri,
      nilai: '',
      jenis_penilaian: globalAssessmentType,
      catatan: '',
      includeNilai: true,
    }));

    setRows(initialRows);
  }, [selectedClassId, activeClass, database.siswa_kelas]);

  // Handler isi Materi Utama (1 kali isi -> semua siswa mengikuti sama persis)
  const handleGlobalMateriChange = (value: string) => {
    setGlobalMateri(value);
    if (autoSyncMateri) {
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          materi_diajarkan: value,
        }))
      );
    }
  };

  // Tombol paksa samakan materi ke semua siswa dari materi global atau baris pertama
  const handleSyncMateriToAll = (sourceText?: string) => {
    const targetMateri = sourceText !== undefined ? sourceText : globalMateri || rows[0]?.materi_diajarkan || '';
    setGlobalMateri(targetMateri);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        materi_diajarkan: targetMateri,
      }))
    );
    showToast(
      'Materi Disamakan ke Semua Siswa',
      targetMateri
        ? `"${targetMateri}" telah diterapkan seragam ke seluruh ${rows.length} siswa.`
        : 'Kolom materi semua siswa telah disinkronkan.',
      'success'
    );
  };

  // Handler ubah materi di baris tabel
  const handleRowMateriChange = (index: number, value: string) => {
    // Jika guru mengisi baris pertama (index === 0) dan mode autoSyncMateri aktif,
    // maka seluruh baris di bawahnya otomatis di-generate sama mengikuti baris pertama!
    if (index === 0 && autoSyncMateri) {
      setGlobalMateri(value);
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          materi_diajarkan: value,
        }))
      );
      return;
    }

    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], materi_diajarkan: value };
      return copy;
    });
  };

  // Handler update kehadiran per siswa
  const handleStatusChange = (index: number, status: KehadiranStatus) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status_kehadiran: status };
      return copy;
    });
  };

  // Handler ubah nilai
  const handleNilaiChange = (index: number, val: string) => {
    const num = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], nilai: num };
      return copy;
    });
  };

  // Handler ubah catatan
  const handleCatatanChange = (index: number, text: string) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], catatan: text };
      return copy;
    });
  };

  // Tandai semua hadir
  const handleMarkAllHadir = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        status_kehadiran: 'Hadir',
      }))
    );
    showToast('Semua Siswa Ditandai Hadir', undefined, 'info');
  };

  // Otomatis isi nilai KKM (85) untuk semua siswa yang belum diisi nilainya
  const handleAutofillKKM = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        nilai: r.nilai === '' ? KKM_STANDARD : r.nilai,
      }))
    );
    showToast('Nilai KKM (85) Diterapkan', 'Nilai default KKM 85 telah diisi otomatis.', 'success');
  };

  // Sinkronkan jenis penilaian global ke semua siswa
  const handleApplyGlobalAssessmentType = (type: string) => {
    setGlobalAssessmentType(type);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        jenis_penilaian: type,
      }))
    );
  };

  // Statistik nilai saat ini
  const filledGrades = rows.filter((r) => r.nilai !== '');
  const tuntasCount = filledGrades.filter((r) => Number(r.nilai) >= KKM_STANDARD).length;
  const remedialCount = filledGrades.filter((r) => Number(r.nilai) < KKM_STANDARD).length;

  // Simpan data batch ke database & Google Sheets
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass) {
      showToast('Pilih Kelas', 'Pilih kelas terlebih dahulu.', 'error');
      return;
    }

    if (rows.length === 0) {
      showToast('Data Kosong', 'Tidak ada siswa di kelas ini.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Siapkan batch absensi (beserta materi yang diajarkan)
      const absensiBatch: Omit<LogAbsensi, 'timestamp'>[] = rows.map((r) => ({
        id_absensi: `ABS_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tanggal: inputDate,
        id_kelas: activeClass.id_kelas,
        siswa: r.siswa,
        status_kehadiran: r.status_kehadiran,
        materi_diajarkan: (r.materi_diajarkan || globalMateri || '').trim() || undefined,
        id_tutor: user.id_tutor || 'TUTOR-001',
      }));

      // Siapkan batch nilai (beserta materi yang diajarkan)
      const nilaiBatch: Omit<LogNilai, 'timestamp'>[] = [];
      if (enableGrades) {
        rows.forEach((r) => {
          if (r.nilai !== '') {
            nilaiBatch.push({
              id_nilai: `NIL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              tanggal: inputDate,
              id_kelas: activeClass.id_kelas,
              siswa: r.siswa,
              mapel: activeClass.mapel,
              jenis_penilaian: r.jenis_penilaian || globalAssessmentType,
              nilai: Number(r.nilai),
              materi_diajarkan: (r.materi_diajarkan || globalMateri || '').trim() || undefined,
              catatan: r.catatan || '',
              id_tutor: user.id_tutor || 'TUTOR-001',
            });
          }
        });
      }

      const res = await SheetsService.submitBatchBoth(absensiBatch, nilaiBatch);
      setIsSubmitting(false);

      if (res.success) {
        showToast('Berhasil Menyimpan Data', res.message, 'success');
        onSaveSuccess();
      } else {
        showToast('Gagal Menyimpan', res.message, 'error');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      showToast('Terjadi Kesalahan', err.message || 'Gagal menyimpan data.', 'error');
    }
  };

  const statusOptions: { label: string; value: KehadiranStatus; color: string; activeColor: string }[] = [
    { label: 'Hadir', value: 'Hadir', color: 'hover:bg-emerald-50 text-emerald-700', activeColor: 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600' },
    { label: 'Izin', value: 'Izin', color: 'hover:bg-sky-50 text-sky-700', activeColor: 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-600' },
    { label: 'Sakit', value: 'Sakit', color: 'hover:bg-amber-50 text-amber-700', activeColor: 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-600' },
    { label: 'Alfa', value: 'Alfa', color: 'hover:bg-rose-50 text-rose-700', activeColor: 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">Input Absensi, Materi & Nilai Guru</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                KKM: {KKM_STANDARD}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Format Kolom: <strong className="text-slate-800">NO, NAMA SISWA, KEHADIRAN, NILAI, MATERI YANG DIAJARKAN</strong>. Isi materi 1 kali dan seluruh siswa otomatis mengikuti sama.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllHadir}
              className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Tandai semua kehadiran sebagai Hadir"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Semua Hadir</span>
            </button>

            {enableGrades && (
              <button
                type="button"
                onClick={handleAutofillKKM}
                className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Isi otomatis nilai yang masih kosong dengan KKM 85"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Isi Otomatis KKM (85)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowNotesField(!showNotesField)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                showNotesField
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showNotesField ? 'Tutup Catatan' : 'Tambah Catatan'}</span>
            </button>

            <button
              type="button"
              onClick={() => setEnableGrades(!enableGrades)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                enableGrades
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{enableGrades ? 'Input Nilai Aktif' : 'Hanya Absensi'}</span>
            </button>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pilih Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kelas</label>
            <select
              value={activeClass?.id_kelas || ''}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {availableClasses.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  {k.kelas} ({k.mapel})
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Tanggal Sesi</label>
              {inputDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setInputDate(todayStr)}
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Hari ini
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Jenis Penilaian Global */}
          {enableGrades && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Evaluasi / Nilai
              </label>
              <select
                value={globalAssessmentType}
                onChange={(e) => handleApplyGlobalAssessmentType(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Ulangan Harian">Ulangan Harian</option>
                <option value="Kuis">Kuis Interaktif</option>
                <option value="Tugas / PR">Tugas / PR</option>
                <option value="Praktikum">Praktikum / Eksperimen</option>
                <option value="Penilaian Tengah Semester (PTS)">Penilaian Tengah Semester (PTS)</option>
                <option value="Penilaian Akhir Semester (PAS)">Penilaian Akhir Semester (PAS)</option>
                <option value="Keaktifan Sesi">Keaktifan Diskusi</option>
              </select>
            </div>
          )}

          {/* Info Badge & KKM Status Monitor */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{activeClass?.mapel}</span>
              <span className="font-mono text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                KKM {KKM_STANDARD}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {activeClass?.hari}, {activeClass?.waktu} · {rows.length} Siswa
            </div>
            {enableGrades && filledGrades.length > 0 && (
              <div className="mt-1 pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                <span className="text-emerald-700 font-semibold">Tuntas: {tuntasCount}</span>
                <span className="text-rose-700 font-semibold">Remedial: {remedialCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Auto-Generated Materi yang Diajarkan Master Bar */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
              <BookText className="w-4 h-4 text-blue-600" />
              <span>Materi yang Diajarkan Hari Ini (Isi 1 Kali → Semua Siswa Otomatis Sama)</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoSyncMateri((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  autoSyncMateri
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {autoSyncMateri ? 'Auto-Samakan: AKTIF' : 'Auto-Samakan: NONAKTIF'}
              </button>
              <button
                type="button"
                onClick={() => handleSyncMateriToAll()}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CopyCheck className="w-3 h-3" />
                <span>Samakan Semua Baris</span>
              </button>
            </div>
          </div>

          <input
            type="text"
            value={globalMateri}
            onChange={(e) => handleGlobalMateriChange(e.target.value)}
            placeholder="Contoh: Bab 3 - Persamaan Kuadrat & Penerapan Soal Cerita (cukup isi 1 kali di sini atau di baris siswa #01)"
            className="w-full text-xs font-semibold rounded-xl border border-blue-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Roster Input Form: FORMAT KOLOM: NO, NAMA SISWA, KEHADIRAN, NILAI, MATERI YANG DIAJARKAN */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">Belum ada siswa terdaftar di kelas ini</p>
            <p className="text-xs text-slate-400 mt-1">
              Periksa data pada sheet <code className="font-mono">siswa_kelas</code>.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header Table Columns Notice */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Siswa Kelas {activeClass?.kelas}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  ({rows.length} Siswa Terdaftar)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ≥ 85 : Tuntas KKM
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  &lt; 85 : Remedial
                </span>
              </div>
            </div>

            {/* Desktop & Tablet Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100/90 text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-center w-14 shrink-0 border-r border-slate-200/60">
                      NO
                    </th>
                    <th className="py-3.5 px-4 font-bold min-w-[200px]">
                      NAMA SISWA
                    </th>
                    <th className="py-3.5 px-4 font-bold min-w-[260px]">
                      KEHADIRAN
                    </th>
                    <th className="py-3.5 px-4 font-bold min-w-[210px]">
                      NILAI <span className="font-extrabold text-blue-700">(KKM: {KKM_STANDARD})</span>
                    </th>
                    <th className="py-3.5 px-4 font-bold min-w-[240px]">
                      MATERI YANG DIAJARKAN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, idx) => {
                    const numVal = row.nilai === '' ? null : Number(row.nilai);
                    const isTuntas = numVal !== null && numVal >= KKM_STANDARD;
                    const isRemedial = numVal !== null && numVal < KKM_STANDARD;

                    return (
                      <React.Fragment key={`tutor_row_${row.siswa}_${idx}`}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          {/* KOLOM 1: NO */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500 border-r border-slate-100 bg-slate-50/30">
                            {String(idx + 1).padStart(2, '0')}
                          </td>

                          {/* KOLOM 2: NAMA SISWA */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-sm text-slate-900 leading-snug">
                              {row.siswa}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              {row.email_siswa}
                            </div>
                          </td>

                          {/* KOLOM 3: KEHADIRAN */}
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                              {statusOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => handleStatusChange(idx, opt.value)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    row.status_kehadiran === opt.value
                                      ? opt.activeColor
                                      : `text-slate-600 ${opt.color}`
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>

                          {/* KOLOM 4: NILAI (DENGAN KKM 85) */}
                          <td className="py-3.5 px-4">
                            {enableGrades ? (
                              <div className="flex items-center gap-2.5">
                                <div className="relative w-28">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="KKM: 85"
                                    value={row.nilai}
                                    onChange={(e) => handleNilaiChange(idx, e.target.value)}
                                    className={`w-full text-xs font-bold rounded-xl border px-3 py-2 text-center transition-all focus:outline-none focus:ring-2 ${
                                      isTuntas
                                        ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900 focus:ring-emerald-500'
                                        : isRemedial
                                        ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                                        : 'border-slate-300 bg-slate-50 focus:bg-white focus:ring-blue-600 text-slate-900'
                                    }`}
                                  />
                                </div>

                                {/* Status KKM Badge */}
                                <div className="shrink-0">
                                  {isTuntas && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-200">
                                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                      Tuntas
                                    </span>
                                  )}
                                  {isRemedial && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-1 rounded-lg border border-rose-200">
                                      <AlertCircle className="w-3 h-3 text-rose-600" />
                                      Remedial
                                    </span>
                                  )}
                                  {numVal === null && (
                                    <button
                                      type="button"
                                      onClick={() => handleNilaiChange(idx, String(KKM_STANDARD))}
                                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
                                      title="Isi KKM 85 untuk siswa ini"
                                    >
                                      + KKM (85)
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Hanya Absensi</span>
                            )}
                          </td>

                          {/* KOLOM 5: MATERI YANG DIAJARKAN (Auto-synced from 1st fill) */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={row.materi_diajarkan}
                                onChange={(e) => handleRowMateriChange(idx, e.target.value)}
                                placeholder={
                                  idx === 0
                                    ? 'Isi materi di sini (otomatis samakan semua)...'
                                    : 'Otomatis mengikuti materi yang sama...'
                                }
                                className={`w-full text-xs rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors ${
                                  idx === 0 && autoSyncMateri
                                    ? 'border-blue-300 bg-blue-50/60 font-semibold text-slate-900'
                                    : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-800'
                                }`}
                              />
                              {idx === 0 && autoSyncMateri && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700">
                                  <CopyCheck className="w-3 h-3" />
                                  Isi di baris #01 otomatis menyamakan baris lainnya
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Notes & Detail Row if Enabled */}
                        {showNotesField && enableGrades && (
                          <tr className="bg-slate-50/40">
                            <td className="border-r border-slate-100"></td>
                            <td colSpan={4} className="px-4 py-2">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                                  Catatan Tutor untuk {row.siswa}:
                                </span>
                                <input
                                  type="text"
                                  placeholder="Contoh: Sangat aktif, tuntas latihan logaritma diatas KKM"
                                  value={row.catatan}
                                  onChange={(e) => handleCatatanChange(idx, e.target.value)}
                                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary & Quick Submit Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 text-center sm:text-left">
                <span className="font-bold text-slate-900">{rows.length} Siswa</span> siap dicatat pada tanggal{' '}
                <span className="font-bold text-blue-700">{inputDate}</span>.
                {enableGrades && (
                  <span className="block sm:inline sm:ml-2 text-slate-500">
                    ({filledGrades.length} terisi nilai · {tuntasCount} Tuntas KKM 85)
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan ke Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
