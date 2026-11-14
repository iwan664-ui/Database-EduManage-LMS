import React, { useMemo, useState } from 'react';
import {
  ActiveUser,
  DatabaseState,
  StudentAchievementItem,
  StudentLeaveRequest,
  TeacherCounselingNote,
} from '../../types';
import { PortalSupportService } from '../../services/portalSupportService';
import { SheetsService } from '../../services/sheetsService';
import { useToast } from '../Toast';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  MessageSquarePlus,
  Phone,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

interface TutorCounselingLeaveHubProps {
  user: ActiveUser;
  database: DatabaseState;
  onDatabaseUpdated?: () => void;
}

export function TutorCounselingLeaveHub({
  user,
  database,
  onDatabaseUpdated,
}: TutorCounselingLeaveHubProps) {
  const { showToast } = useToast();
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [leaveFilter, setLeaveFilter] = useState<'Menunggu' | 'all'>('Menunggu');
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});

  // Counseling note form
  const [selectedStudent, setSelectedStudent] = useState<string>(database.master_siswa[0]?.siswa || '');
  const [noteDate, setNoteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noteCategory, setNoteCategory] = useState<TeacherCounselingNote['kategori']>('Akademik (KKM 85)');
  const [noteText, setNoteText] = useState<string>('');
  const [followUpText, setFollowUpText] = useState<string>('');

  const leaveRequests = useMemo<StudentLeaveRequest[]>(() => {
    void refreshTick;
    return PortalSupportService.getLeaveRequests();
  }, [refreshTick]);

  const counselingNotes = useMemo<TeacherCounselingNote[]>(() => {
    void refreshTick;
    return PortalSupportService.getCounselingNotes();
  }, [refreshTick]);

  const pendingAchievements = useMemo<StudentAchievementItem[]>(() => {
    void refreshTick;
    return PortalSupportService.getAchievements().filter((a) => !a.terverifikasi);
  }, [refreshTick]);

  const filteredLeaves = useMemo(() => {
    if (leaveFilter === 'all') return leaveRequests;
    return leaveRequests.filter((r) => r.status === 'Menunggu');
  }, [leaveRequests, leaveFilter]);

  // Auto-detect students with avg score < 85 or Alfa > 0
  const priorityStudents = useMemo(() => {
    return database.master_siswa
      .map((s) => {
        const grades = database.log_nilai.filter((n) => n.siswa === s.siswa);
        const avg =
          grades.length > 0
            ? Math.round((grades.reduce((acc, g) => acc + Number(g.nilai), 0) / grades.length) * 10) / 10
            : null;
        const alfaCount = database.log_absensi.filter(
          (a) => a.siswa === s.siswa && a.status_kehadiran === 'Alfa'
        ).length;
        return { siswa: s.siswa, cabang: s.cabang, avg, alfaCount };
      })
      .filter((item) => (item.avg !== null && item.avg < 85) || item.alfaCount > 0);
  }, [database.master_siswa, database.log_nilai, database.log_absensi]);

  const handleRespondLeave = async (req: StudentLeaveRequest, decision: 'Disetujui' | 'Ditolak') => {
    const note = responseNotes[req.id] || '';
    const res = PortalSupportService.respondLeaveRequest(req.id, decision, user.name, note);

    // Jika disetujui, sinkronkan ke log_absensi kelas terkait pada tanggal_mulai
    if (decision === 'Disetujui') {
      const studentClasses = database.siswa_kelas.filter((sk) => sk.siswa === req.siswa);
      if (studentClasses.length > 0) {
        const targetClass = studentClasses[0];
        await SheetsService.submitBatchBoth(
          [
            {
              id_absensi: `ABS-IZN-${Date.now()}`,
              tanggal: req.tanggal_mulai,
              id_kelas: targetClass.id_kelas,
              siswa: req.siswa,
              status_kehadiran: req.jenis,
              materi_diajarkan: `Pengajuan ${req.jenis} Disetujui (${req.alasan.slice(0, 60)})`,
              id_tutor: user.id_tutor || 'TUTOR-SYS',
            },
          ],
          []
        );
        if (onDatabaseUpdated) onDatabaseUpdated();
      }
    }

    setRefreshTick((t) => t + 1);
    showToast(
      decision === 'Disetujui' ? 'Izin Disetujui & Tercatat' : 'Pengajuan Ditolak',
      res.message,
      decision === 'Disetujui' ? 'success' : 'info'
    );
  };

  const handleSaveCounseling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !noteText.trim()) {
      showToast('Data Belum Lengkap', 'Pilih santri dan isi catatan pembinaan.', 'warning');
      return;
    }

    PortalSupportService.addCounselingNote({
      siswa: selectedStudent,
      guru: user.name,
      tanggal: noteDate,
      kategori: noteCategory,
      catatan: noteText,
      tindak_lanjut: followUpText || 'Monitoring berkala bersama orang tua.',
    });

    setNoteText('');
    setFollowUpText('');
    setRefreshTick((t) => t + 1);
    showToast('Catatan Konseling Disimpan', `Pembinaan untuk ${selectedStudent} telah dicatat.`, 'success');
  };

  const handleVerifyAchievement = (item: StudentAchievementItem) => {
    PortalSupportService.verifyAchievement(item.id);
    setRefreshTick((t) => t + 1);
    showToast('Prestasi Diverifikasi', `"${item.judul}" telah disahkan ke portofolio ${item.siswa}.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Layanan Pembinaan & Perizinan · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Perizinan Santri, Konseling KKM 85 & Verifikasi Prestasi
          </h2>
          <p className="text-xs text-slate-500">
            Tindak lanjuti surat izin/sakit dari wali murid, pantau santri yang memerlukan pendampingan KKM 85, serta catat bimbingan karakter.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono tabular-nums text-xs shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-[10px] font-sans font-semibold text-amber-800">Izin Menunggu</div>
            <div className="text-lg font-black text-amber-950">
              {leaveRequests.filter((r) => r.status === 'Menunggu').length}
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-[10px] font-sans font-semibold text-rose-800">Perlu Pendampingan</div>
            <div className="text-lg font-black text-rose-950">{priorityStudents.length}</div>
          </div>
        </div>
      </div>

      {/* Priority KKM 85 / Attendance Alert Strip */}
      {priorityStudents.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Santri Prioritas Bimbingan (Nilai Rata-rata &lt; KKM 85 atau Terdapat Alfa)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {priorityStudents.map((p) => (
              <button
                key={p.siswa}
                type="button"
                onClick={() => setSelectedStudent(p.siswa)}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:border-blue-500 text-xs text-left cursor-pointer transition-colors"
              >
                <span className="font-bold text-slate-900">{p.siswa}</span>
                <span className="text-slate-400"> · </span>
                <span className="font-mono text-rose-700 font-bold">
                  {p.avg !== null ? `Rata-rata ${p.avg}` : 'Belum ada nilai'}
                </span>
                {p.alfaCount > 0 && (
                  <span className="text-amber-800 font-semibold"> · {p.alfaCount} Alfa</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Leave Requests & Pending Achievements (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Pengajuan Izin & Sakit Online Walmur
                </h3>
              </div>

              <div className="inline-flex bg-slate-100 p-1 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLeaveFilter('Menunggu')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    leaveFilter === 'Menunggu' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Menunggu ({leaveRequests.filter((r) => r.status === 'Menunggu').length})
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveFilter('all')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    leaveFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Semua ({leaveRequests.length})
                </button>
              </div>
            </div>

            {filteredLeaves.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada pengajuan izin yang sedang menunggu persetujuan.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeaves.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          {req.siswa}{' '}
                          <span className="font-mono text-[11px] font-bold text-blue-700">
                            · {req.jenis}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {req.tanggal_mulai}
                          {req.tanggal_selesai !== req.tanggal_mulai ? ` s/d ${req.tanggal_selesai}` : ''}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          req.status === 'Disetujui'
                            ? 'text-emerald-700'
                            : req.status === 'Ditolak'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/70">
                      {req.alasan}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      <span>
                        Wali: <strong className="text-slate-700">{req.nama_wali}</strong> ({req.kontak_wali})
                      </span>
                    </div>

                    {req.status === 'Menunggu' ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={responseNotes[req.id] || ''}
                          onChange={(e) =>
                            setResponseNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          placeholder="Catatan guru untuk santri/orang tua (opsional)..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespondLeave(req, 'Ditolak')}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondLeave(req, 'Disetujui')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui & Catat Presensi</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      req.catatan_guru && (
                        <div className="text-[11px] text-slate-600 border-t border-slate-200/80 pt-2">
                          Respon {req.ditanggapi_oleh}: <span className="italic">{req.catatan_guru}</span>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Achievement Verification */}
          {pendingAchievements.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Award className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Verifikasi Ajuan Prestasi Santri ({pendingAchievements.length})
                </h3>
              </div>
              <div className="space-y-2.5">
                {pendingAchievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="p-3 rounded-xl bg-orange-50/60 border border-orange-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate">{ach.judul}</div>
                      <div className="text-[11px] text-slate-600">
                        {ach.siswa} · {ach.peringkat} ({ach.tingkat})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVerifyAchievement(ach)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sahkan</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Counseling Form & Log (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          <form
            onSubmit={handleSaveCounseling}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Catat Bimbingan / Konseling Santri
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Nama Santri</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  {database.master_siswa.map((s) => (
                    <option key={s.siswa} value={s.siswa}>
                      {s.siswa}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Tanggal</label>
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Kategori Pembinaan</label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value as TeacherCounselingNote['kategori'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
              >
                <option value="Akademik (KKM 85)">Akademik (KKM 85)</option>
                <option value="Kehadiran">Kehadiran & Kedisiplinan</option>
                <option value="Adab & Karakter">Adab & Karakter Islami</option>
                <option value="Apresiasi Prestasi">Apresiasi Prestasi</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Catatan Observasi Guru *</label>
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Tuliskan perkembangan belajar, kendala, atau apresiasi santri..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Rencana Tindak Lanjut</label>
              <input
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Contoh: Klinik belajar remedial KKM 85 / Komunikasi wali murid"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Simpan Catatan Pembinaan
              </button>
            </div>
          </form>

          {/* Counseling History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <HeartHandshake className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Riwayat Pembinaan & Konseling ({counselingNotes.length})
              </h3>
            </div>
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto">
              {counselingNotes.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">{c.siswa}</span>
                    <span className="text-[10px] font-mono text-slate-500">{c.tanggal}</span>
                  </div>
                  <div className="text-[11px] font-bold text-blue-700">{c.kategori}</div>
                  <p className="text-xs text-slate-700">{c.catatan}</p>
                  <div className="text-[11px] text-emerald-700 font-medium pt-1">
                    Tindak Lanjut: {c.tindak_lanjut} · Oleh {c.guru}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
