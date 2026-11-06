import React, { useState, useEffect } from 'react';
import { ActiveUser, BatchInputRow, DatabaseState, KehadiranStatus, LogAbsensi, LogNilai } from '../../types';
import { SheetsService } from '../../services/sheetsService';
import { useToast } from '../Toast';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Save,
  Users,
  Check,
  RotateCcw,
  BookOpen,
  Sparkles,
  Info,
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

  // Filter kelas untuk dropdown (utamakan kelas milik tutor ini jika ada)
  const tutorClasses = database.master_kelas.filter(
    (k) => k.guru.toLowerCase().trim() === user.name.toLowerCase().trim()
  );
  const availableClasses = tutorClasses.length > 0 ? tutorClasses : database.master_kelas;

  // Tanggal default hari ini (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [inputDate, setInputDate] = useState<string>(todayStr);
  const [globalAssessmentType, setGlobalAssessmentType] = useState<string>('Ulangan Harian');
  const [enableGrades, setEnableGrades] = useState<boolean>(true);
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
      nilai: '',
      jenis_penilaian: globalAssessmentType,
      catatan: '',
      includeNilai: true,
    }));

    setRows(initialRows);
  }, [selectedClassId, activeClass, database.siswa_kelas]);

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

  // Handler ubah jenis penilaian individual
  const handleJenisPenilaianChange = (index: number, jenis: string) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], jenis_penilaian: jenis };
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
      // Siapkan batch absensi
      const absensiBatch: Omit<LogAbsensi, 'timestamp'>[] = rows.map((r) => ({
        id_absensi: `ABS_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tanggal: inputDate,
        id_kelas: activeClass.id_kelas,
        siswa: r.siswa,
        status_kehadiran: r.status_kehadiran,
        id_tutor: user.id_tutor || 'TUTOR-001',
      }));

      // Siapkan batch nilai (hanya untuk siswa yang diisi nilainya jika mode nilai aktif)
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
    { label: 'Hadir', value: 'Hadir', color: 'hover:bg-emerald-50 text-emerald-700', activeColor: 'bg-emerald-600 text-white shadow-sm' },
    { label: 'Izin', value: 'Izin', color: 'hover:bg-sky-50 text-sky-700', activeColor: 'bg-sky-600 text-white shadow-sm' },
    { label: 'Sakit', value: 'Sakit', color: 'hover:bg-amber-50 text-amber-700', activeColor: 'bg-amber-600 text-white shadow-sm' },
    { label: 'Alfa', value: 'Alfa', color: 'hover:bg-rose-50 text-rose-700', activeColor: 'bg-rose-600 text-white shadow-sm' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Input Absensi & Nilai Siswa</h2>
            <p className="text-xs text-slate-500">
              Pengisian presensi dan nilai sekaligus per pertemuan dengan penyimpanan batch cepat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllHadir}
              className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Semua Hadir</span>
            </button>

            <button
              type="button"
              onClick={() => setEnableGrades(!enableGrades)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
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

          {/* Info Badge */}
          <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div>
              <div className="font-semibold text-slate-800">{activeClass?.mapel}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {activeClass?.hari}, {activeClass?.waktu} · {rows.length} Siswa
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Input List (Mobile-First responsive cards & desktop table) */}
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
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div
                key={row.siswa}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-all space-y-3"
              >
                {/* Header row: Nama Siswa & Segmented Presensi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 w-5">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{row.siswa}</h4>
                    </div>
                    <span className="text-[11px] text-slate-500 ml-7 block">{row.email_siswa}</span>
                  </div>

                  {/* Status Kehadiran Selector */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1 shrink-0 self-start sm:self-auto">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleStatusChange(idx, opt.value)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          row.status_kehadiran === opt.value
                            ? opt.activeColor
                            : `text-slate-600 ${opt.color}`
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nilai & Catatan Section (jika enableGrades aktif) */}
                {enableGrades && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Nilai Angka */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nilai (0 - 100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Contoh: 85"
                        value={row.nilai}
                        onChange={(e) => handleNilaiChange(idx, e.target.value)}
                        className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    {/* Kategori Penilaian Individual */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Kategori Penilaian
                      </label>
                      <select
                        value={row.jenis_penilaian}
                        onChange={(e) => handleJenisPenilaianChange(idx, e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Ulangan Harian">Ulangan Harian</option>
                        <option value="Kuis">Kuis</option>
                        <option value="Tugas / PR">Tugas / PR</option>
                        <option value="Praktikum">Praktikum</option>
                        <option value="Penilaian Tengah Semester (PTS)">PTS</option>
                        <option value="Penilaian Akhir Semester (PAS)">PAS</option>
                        <option value="Keaktifan Sesi">Keaktifan</option>
                      </select>
                    </div>

                    {/* Catatan / Feedback Tutor */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan / Feedback Guru (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Sangat aktif, tuntas latihan logaritma"
                        value={row.catatan}
                        onChange={(e) => handleCatatanChange(idx, e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Bottom Sticky Submit Bar */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 text-center sm:text-left">
                <span className="font-semibold text-slate-900">{rows.length} Siswa</span> akan dicatat pada tanggal{' '}
                <span className="font-semibold text-blue-700">{inputDate}</span>
                {enableGrades && (
                  <span className="block sm:inline sm:ml-2 text-slate-500">
                    ({rows.filter((r) => r.nilai !== '').length} dengan input nilai)
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan ke Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Presensi & Nilai Sekaligus</span>
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
