import React, { useState, useMemo, useEffect } from 'react';
import { ActiveUser, DatabaseState, WeeklyReportChannel, WeeklyReportItem } from '../../types';
import { WeeklyReportService } from '../../services/weeklyReportService';
import { EmailReportItemPayload, ParentReportEmailService } from '../../services/parentReportEmailService';
import { PdfExportService } from '../../services/pdfExportService';
import { EmailDispatchModal } from '../shared/EmailDispatchModal';
import { useToast } from '../Toast';
import {
  Send,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Award,
  AlertCircle,
  Search,
  SendHorizontal,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface TutorWeeklyReportSenderProps {
  user: ActiveUser;
  database: DatabaseState;
}

function getDefaultWeekDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0],
  };
}

export function TutorWeeklyReportSender({ user, database }: TutorWeeklyReportSenderProps) {
  const { showToast } = useToast();
  const defaultWeek = useMemo(() => getDefaultWeekDates(), []);

  // Classes taught by this tutor (fallback to all classes for flexibility)
  const tutorClasses = useMemo(() => {
    const own = database.master_kelas.filter(
      (k) => k.guru.toLowerCase().trim() === user.name.toLowerCase().trim()
    );
    return own.length > 0 ? own : database.master_kelas;
  }, [database.master_kelas, user.name]);

  const [selectedClassId, setSelectedClassId] = useState<string>(tutorClasses[0]?.id_kelas || '');
  const [startDate, setStartDate] = useState<string>(defaultWeek.start);
  const [endDate, setEndDate] = useState<string>(defaultWeek.end);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [activeSubView, setActiveSubView] = useState<'compose' | 'history'>('compose');

  // Persisted sent weekly reports
  const [sentReports, setSentReports] = useState<WeeklyReportItem[]>(() =>
    WeeklyReportService.getAllReports()
  );

  // Students in selected class
  const classStudents = useMemo(() => {
    const enrolled = database.siswa_kelas.filter((sk) => sk.id_kelas === selectedClassId);
    const seen = new Set<string>();
    const unique = enrolled.filter((s) => {
      const key = s.siswa.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (!searchStudent.trim()) return unique;
    const q = searchStudent.toLowerCase();
    return unique.filter((s) => s.siswa.toLowerCase().includes(q));
  }, [database.siswa_kelas, selectedClassId, searchStudent]);

  const [selectedStudentName, setSelectedStudentName] = useState<string>('');

  // Keep selected student synced with class selection
  useEffect(() => {
    if (classStudents.length > 0 && !classStudents.some((s) => s.siswa === selectedStudentName)) {
      setSelectedStudentName(classStudents[0].siswa);
    }
  }, [classStudents, selectedStudentName]);

  // Editable draft for the selected student
  const [draft, setDraft] = useState<WeeklyReportItem | null>(null);
  const [copiedWa, setCopiedWa] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [showBatchEmailModal, setShowBatchEmailModal] = useState<boolean>(false);
  const [emailModalItems, setEmailModalItems] = useState<EmailReportItemPayload[]>([]);
  const [contactTick, setContactTick] = useState<number>(0);

  // Rebuild draft whenever student/class/date changes
  useEffect(() => {
    if (!selectedStudentName || !selectedClassId) {
      setDraft(null);
      return;
    }

    // Check if already sent for exact same period/student/class so tutor can edit existing
    const existingSent = sentReports.find(
      (r) =>
        r.siswa === selectedStudentName &&
        r.id_kelas === selectedClassId &&
        r.tanggal_mulai === startDate &&
        r.tanggal_selesai === endDate
    );

    if (existingSent) {
      setDraft(existingSent);
    } else {
      const generated = WeeklyReportService.buildStudentWeeklyDraft({
        database,
        studentName: selectedStudentName,
        classId: selectedClassId,
        tutorName: user.name,
        startDate,
        endDate,
      });
      setDraft(generated);
    }
  }, [database, selectedStudentName, selectedClassId, startDate, endDate, user.name, sentReports]);

  const handleRegenerateAutoDraft = () => {
    if (!selectedStudentName || !selectedClassId) return;
    const fresh = WeeklyReportService.buildStudentWeeklyDraft({
      database,
      studentName: selectedStudentName,
      classId: selectedClassId,
      tutorName: user.name,
      startDate,
      endDate,
    });
    setDraft(fresh);
    showToast('Draf Diperbarui', 'Ringkasan otomatis disusun ulang dari data presensi, nilai, dan tahfidz terbaru.', 'info');
  };

  const applyPresetWeek = (offsetWeeks: number) => {
    const base = getDefaultWeekDates();
    const s = new Date(`${base.start}T00:00:00`);
    const e = new Date(`${base.end}T00:00:00`);
    s.setDate(s.getDate() + offsetWeeks * 7);
    e.setDate(e.getDate() + offsetWeeks * 7);
    setStartDate(s.toISOString().split('T')[0]);
    setEndDate(e.toISOString().split('T')[0]);
  };

  const handleSendSingle = (channel: WeeklyReportChannel, overrideEmail?: string) => {
    if (!draft) return;
    const targetEmail = (overrideEmail ?? draft.email_ortu ?? '').trim();
    if (channel === 'Email' && !ParentReportEmailService.isValidEmail(targetEmail)) {
      showToast('Email Wali Belum Valid', `Mohon isi alamat email wali santri yang valid untuk ${draft.siswa}.`, 'warning');
      return;
    }

    const channels = Array.from(new Set<WeeklyReportChannel>([...draft.channels, 'Portal Walmur', channel]));
    const nowIso = new Date().toISOString();
    const updatedItem: WeeklyReportItem = {
      ...draft,
      email_ortu: targetEmail,
      email_tujuan: channel === 'Email' ? targetEmail : draft.email_tujuan,
      email_dikirim_pada: channel === 'Email' ? nowIso : draft.email_dikirim_pada,
      periode_label: WeeklyReportService.formatPeriodLabel(startDate, endDate),
      tanggal_mulai: startDate,
      tanggal_selesai: endDate,
      channels,
      dikirim_pada: nowIso,
    };
    const updatedList = WeeklyReportService.sendReport(updatedItem);
    setSentReports(updatedList);
    setDraft(updatedItem);
    setContactTick((t) => t + 1);

    if (channel === 'PDF') {
      PdfExportService.exportWeeklyReportPdf(updatedItem);
      showToast('PDF Diunduh & Tercatat', `Rapor pekanan ${updatedItem.siswa} tersimpan dan PDF berhasil diunduh.`, 'success');
    } else if (channel === 'Portal Walmur') {
      showToast('Rapor Pekanan Terkirim', `Rapor pekanan untuk orang tua ${updatedItem.siswa} telah dikirim ke Portal Wali Murid.`, 'success');
    } else if (channel === 'Email') {
      showToast('Email Rapor Tercatat', `Rapor pekanan ${updatedItem.siswa} dikirim ke email wali ${targetEmail}.`, 'success');
    } else {
      showToast(`Dikirim via ${channel}`, `Rapor pekanan ${updatedItem.siswa} tercatat terkirim melalui ${channel}.`, 'success');
    }
  };

  const handleOpenBatchEmailModal = () => {
    if (classStudents.length === 0 || !selectedClassId) return;
    const payloads: EmailReportItemPayload[] = classStudents.map((st) => {
      const existing = sentReports.find(
        (r) =>
          r.siswa === st.siswa &&
          r.id_kelas === selectedClassId &&
          r.tanggal_mulai === startDate &&
          r.tanggal_selesai === endDate
      );
      const sourceReport =
        existing ||
        WeeklyReportService.buildStudentWeeklyDraft({
          database,
          studentName: st.siswa,
          classId: selectedClassId,
          tutorName: user.name,
          startDate,
          endDate,
        });
      return ParentReportEmailService.buildWeeklyEmailPayload(sourceReport);
    });
    setEmailModalItems(payloads);
    setShowBatchEmailModal(true);
  };

  const handleRecordedWeeklyEmails = (sentItems: EmailReportItemPayload[]) => {
    if (!selectedClassId || sentItems.length === 0) return;
    const nowIso = new Date().toISOString();
    const updatedBatch: WeeklyReportItem[] = sentItems.map((it) => {
      const existing = sentReports.find(
        (r) =>
          r.siswa === it.siswa &&
          r.id_kelas === selectedClassId &&
          r.tanggal_mulai === startDate &&
          r.tanggal_selesai === endDate
      );
      const base =
        existing ||
        WeeklyReportService.buildStudentWeeklyDraft({
          database,
          studentName: it.siswa,
          classId: selectedClassId,
          tutorName: user.name,
          startDate,
          endDate,
        });
      return {
        ...base,
        email_ortu: it.to.trim(),
        email_tujuan: it.to.trim(),
        email_dikirim_pada: nowIso,
        channels: Array.from(new Set<WeeklyReportChannel>([...base.channels, 'Portal Walmur', 'Email'])),
        dikirim_pada: nowIso,
      };
    });
    const updatedList = WeeklyReportService.sendBatchReports(updatedBatch);
    setSentReports(updatedList);
    setContactTick((t) => t + 1);
  };

  const handleSendAllClass = () => {
    if (classStudents.length === 0 || !selectedClassId) return;
    const batch: WeeklyReportItem[] = classStudents.map((st) => {
      const item = WeeklyReportService.buildStudentWeeklyDraft({
        database,
        studentName: st.siswa,
        classId: selectedClassId,
        tutorName: user.name,
        startDate,
        endDate,
      });
      return {
        ...item,
        channels: ['Portal Walmur'],
        status_kirim: 'Terkirim',
        dikirim_pada: new Date().toISOString(),
      };
    });
    const updatedList = WeeklyReportService.sendBatchReports(batch);
    setSentReports(updatedList);
    showToast(
      'Kirim Massal Berhasil',
      `${batch.length} rapor pekanan telah dikirimkan serentak ke Portal Orang Tua / Wali Murid.`,
      'success'
    );
  };

  const handleCopyWhatsApp = () => {
    if (!draft) return;
    const text = WeeklyReportService.formatWhatsAppMessage(draft);
    navigator.clipboard.writeText(text);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2500);
    handleSendSingle('WhatsApp');
  };

  const handleCopyEmailBody = () => {
    if (!draft) return;
    const payload = ParentReportEmailService.buildWeeklyEmailPayload(draft);
    navigator.clipboard.writeText(`Kepada: ${payload.to}\nSubjek: ${payload.subject}\n\n${payload.body}`);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
    if (ParentReportEmailService.isValidEmail(payload.to)) {
      handleSendSingle('Email', payload.to);
    } else {
      showToast('Format Email Disalin', 'Isi email rapor telah disalin. Lengkapi email wali terlebih dahulu.', 'info');
    }
  };

  const handleDeleteHistory = (id: string) => {
    const updated = WeeklyReportService.deleteReport(id);
    setSentReports(updated);
    showToast('Riwayat Dihapus', 'Catatan pengiriman rapor pekanan telah dihapus.', 'info');
  };

  // Stats for selected period & class
  const periodStats = useMemo(() => {
    const sentForClass = classStudents.filter((st) =>
      sentReports.some(
        (r) =>
          r.siswa === st.siswa &&
          r.id_kelas === selectedClassId &&
          r.tanggal_mulai === startDate &&
          r.tanggal_selesai === endDate
      )
    ).length;
    const readCount = sentReports.filter(
      (r) =>
        r.id_kelas === selectedClassId &&
        r.tanggal_mulai === startDate &&
        r.tanggal_selesai === endDate &&
        r.status_kirim === 'Dibaca Orang Tua'
    ).length;

    return {
      totalStudents: classStudents.length,
      sentCount: sentForClass,
      readCount,
    };
  }, [classStudents, sentReports, selectedClassId, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-emerald-900 rounded-3xl p-6 text-white shadow-lg border border-blue-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-300">
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>Komunikasi Resmi Guru ↔ Orang Tua / Wali Murid</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Pengiriman Rapor Pekanan ke Orang Tua
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl">
              Susun laporan perkembangan pekanan santri secara otomatis dari presensi, nilai KKM 85, setoran tahfidz, dan mutaba&apos;ah ibadah, lalu kirim langsung ke Portal Walmur, WhatsApp, Email, atau PDF resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubView('compose')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubView === 'compose'
                  ? 'bg-white text-blue-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Susun & Kirim Rapor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubView === 'history'
                  ? 'bg-white text-blue-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Riwayat Terkirim ({sentReports.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Kelas & Periode Pekanan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Kelas / Mata Pelajaran
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {tutorClasses.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  {k.kelas} · {k.mapel}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tanggal Mulai Pekan
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs font-mono font-semibold rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tanggal Akhir Pekan
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs font-mono font-semibold rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => applyPresetWeek(0)}
              className="flex-1 py-2.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold cursor-pointer transition-colors"
            >
              Pekan Ini
            </button>
            <button
              type="button"
              onClick={() => applyPresetWeek(-1)}
              className="flex-1 py-2.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-bold cursor-pointer transition-colors"
            >
              Pekan Lalu
            </button>
          </div>
        </div>

        {/* Period Status Bar + Batch Send */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {WeeklyReportService.formatPeriodLabel(startDate, endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Terkirim: {periodStats.sentCount}/{periodStats.totalStudents} Santri
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Dibaca Orang Tua: {periodStats.readCount}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenBatchEmailModal}
              disabled={classStudents.length === 0}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Kirim Email ke Wali Masing-Masing ({classStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={handleSendAllClass}
              disabled={classStudents.length === 0}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kirim ke Portal Ortu ({classStudents.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT VIEW 1: COMPOSE & SEND */}
      {activeSubView === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Panel: Student Selector List */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden max-h-[760px]">
            <div className="p-4 border-b border-slate-100 space-y-2.5 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Daftar Santri ({classStudents.length})
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Klik untuk sunting</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="Cari nama santri..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {classStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tidak ada santri ditemukan di kelas ini.
                </div>
              ) : (
                classStudents.map((st, idx) => {
                  void contactTick;
                  const sentItem = sentReports.find(
                    (r) =>
                      r.siswa === st.siswa &&
                      r.id_kelas === selectedClassId &&
                      r.tanggal_mulai === startDate &&
                      r.tanggal_selesai === endDate
                  );
                  const guardianEmail = ParentReportEmailService.getGuardianEmail(st.siswa, st.email_siswa);
                  const isSelected = selectedStudentName === st.siswa;
                  const hasSentEmail = sentItem?.channels.includes('Email');

                  return (
                    <button
                      key={`${st.id_kelas}_${st.siswa}_${idx}`}
                      type="button"
                      onClick={() => setSelectedStudentName(st.siswa)}
                      className={`w-full text-left p-3.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 ring-1 ring-inset ring-blue-300'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                          {st.siswa}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                          Wali: {guardianEmail}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {sentItem ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              sentItem.status_kirim === 'Dibaca Orang Tua'
                                ? 'text-blue-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {sentItem.status_kirim === 'Dibaca Orang Tua' ? (
                              <>
                                <Eye className="w-3 h-3" /> Dibaca
                              </>
                            ) : hasSentEmail ? (
                              <>
                                <Mail className="w-3 h-3" /> Email Terkirim
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Terkirim
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Draf</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Weekly Report Editor & Multi-Channel Sender */}
          <div className="lg:col-span-8 space-y-4">
            {!draft ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Pilih santri di sebelah kiri untuk menyusun rapor pekanan.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Report Top Card */}
                <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{draft.siswa}</h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          draft.status_kkm.includes('Tuntas')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : draft.status_kkm.includes('Pendampingan')
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {draft.status_kkm}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {draft.kelas} · {draft.mapel} · {draft.periode_label}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateAutoDraft}
                    className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Susun Ulang Otomatis</span>
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Auto-aggregated Weekly Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                      <div className="text-[10px] font-bold uppercase text-emerald-700">Presensi Pekanan</div>
                      <div className="text-xl font-black text-emerald-900 mt-0.5">{draft.persen_kehadiran}%</div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">
                        H:{draft.hadir} · I:{draft.izin} · S:{draft.sakit} · A:{draft.alfa}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
                      <div className="text-[10px] font-bold uppercase text-blue-700">Rata Nilai (KKM 85)</div>
                      <div className="text-xl font-black text-blue-900 mt-0.5">
                        {draft.rata_nilai > 0 ? draft.rata_nilai : '-'}
                      </div>
                      <div className="text-[10px] text-blue-700 mt-0.5">
                        {draft.detail_nilai.length} mapel terdata
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80">
                      <div className="text-[10px] font-bold uppercase text-orange-700">Predikat Pekanan</div>
                      <div className="text-xs font-black text-orange-950 mt-1 leading-snug">
                        {draft.predikat}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-600">Mutaba&apos;ah Ibadah</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">
                        {draft.mutabaah_skor !== null ? `${draft.mutabaah_skor}/100` : 'Aktif'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={draft.tahfidz_ringkasan}>
                        Tahfidz terpantau
                      </div>
                    </div>
                  </div>

                  {/* Tahfidz Summary & Predicate Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ringkasan Tahfidz & Tilawah Pekanan
                      </label>
                      <input
                        type="text"
                        value={draft.tahfidz_ringkasan}
                        onChange={(e) => setDraft({ ...draft, tahfidz_ringkasan: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Predikat Perkembangan Pekanan
                      </label>
                      <select
                        value={draft.predikat}
                        onChange={(e) =>
                          setDraft({ ...draft, predikat: e.target.value as WeeklyReportItem['predikat'] })
                        }
                        className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Mumtaz (Sangat Baik)">Mumtaz (Sangat Baik)</option>
                        <option value="Jayyid Jiddan (Baik)">Jayyid Jiddan (Baik)</option>
                        <option value="Perlu Pembinaan">Perlu Pembinaan</option>
                      </select>
                    </div>
                  </div>

                  {/* Editable Evaluation Notes & Parent Recommendation */}
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        <span>Catatan Evaluasi Guru (Akademik, Kehadiran & Adab)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={draft.catatan_guru}
                        onChange={(e) => setDraft({ ...draft, catatan_guru: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Rekomendasi Pendampingan Orang Tua di Rumah</span>
                      </label>
                      <textarea
                        rows={2}
                        value={draft.rekomendasi_ortu}
                        onChange={(e) => setDraft({ ...draft, rekomendasi_ortu: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Parent Contacts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        No. WhatsApp Orang Tua / Wali
                      </label>
                      <input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={draft.kontak_wa_ortu || ''}
                        onChange={(e) => setDraft({ ...draft, kontak_wa_ortu: e.target.value })}
                        className="w-full text-xs font-mono rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Orang Tua / Wali Santri
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="email"
                          placeholder="wali.santri@email.com"
                          value={draft.email_ortu || ''}
                          onChange={(e) => setDraft({ ...draft, email_ortu: e.target.value })}
                          className="flex-1 text-xs font-mono rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const emailVal = (draft.email_ortu || '').trim();
                            if (!ParentReportEmailService.isValidEmail(emailVal)) {
                              showToast('Email Tidak Valid', 'Masukkan format email wali santri yang benar.', 'warning');
                              return;
                            }
                            ParentReportEmailService.saveGuardianContact(draft.siswa, {
                              wa: draft.kontak_wa_ortu || '',
                              email: emailVal,
                            });
                            setContactTick((t) => t + 1);
                            showToast('Email Wali Tersimpan', `Email wali ${draft.siswa} diperbarui menjadi ${emailVal}.`, 'success');
                          }}
                          className="py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Channel Action Bar */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Pilih Kanal Pengiriman ke Orang Tua:
                      </span>
                      {draft.email_tujuan && (
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Terakhir dikirim ke email: <span className="font-mono">{draft.email_tujuan}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <a
                        href={WeeklyReportService.buildMailtoUrl(draft)}
                        onClick={(e) => {
                          if (!ParentReportEmailService.isValidEmail(draft.email_ortu || '')) {
                            e.preventDefault();
                            showToast('Email Wali Kosong/Tidak Valid', 'Mohon isi email wali santri terlebih dahulu.', 'warning');
                            return;
                          }
                          handleSendSingle('Email');
                        }}
                        className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Kirim ke Email Wali ({draft.email_ortu || '-'})</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyEmailBody}
                        className="py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedEmail ? 'Email Disalin!' : 'Salin Isi Email'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendSingle('Portal Walmur')}
                        className="py-2.5 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Portal Orang Tua</span>
                      </button>

                      <a
                        href={WeeklyReportService.buildWhatsAppUrl(draft)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleSendSingle('WhatsApp')}
                        className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyWhatsApp}
                        className="py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedWa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWa ? 'Tersalin!' : 'Salin WA'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendSingle('PDF')}
                        className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Unduh PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT VIEW 2: SENT HISTORY & READ RECEIPTS */}
      {activeSubView === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Riwayat Pengiriman & Status Baca Orang Tua
              </h3>
              <p className="text-xs text-slate-500">
                Pantau rapor pekanan yang sudah dikirim dan konfirmasi keterbacaan oleh wali murid.
              </p>
            </div>
          </div>

          {sentReports.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada rapor pekanan yang dikirimkan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold">Santri & Kelas</th>
                    <th className="px-4 py-3 font-bold">Periode Pekan</th>
                    <th className="px-4 py-3 font-bold text-center">Kehadiran</th>
                    <th className="px-4 py-3 font-bold text-center">Rata Nilai</th>
                    <th className="px-4 py-3 font-bold">Kanal Kirim</th>
                    <th className="px-4 py-3 font-bold text-center">Status Ortu</th>
                    <th className="px-4 py-3 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sentReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{rep.siswa}</div>
                        <div className="text-[11px] text-slate-500">
                          {rep.kelas} · {rep.guru}
                        </div>
                        {(rep.email_tujuan || rep.email_ortu) && (
                          <div className="text-[10px] font-mono text-blue-700 mt-0.5">
                            Email Wali: {rep.email_tujuan || rep.email_ortu}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{rep.periode_label}</div>
                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                          Dikirim: {new Date(rep.dikirim_pada).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700 tabular-nums">
                        {rep.persen_kehadiran}%
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold tabular-nums">
                        <span className={rep.rata_nilai >= 85 ? 'text-blue-700' : 'text-rose-600'}>
                          {rep.rata_nilai > 0 ? rep.rata_nilai : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-slate-700 font-medium">
                          {rep.channels.join(' · ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rep.status_kirim === 'Dibaca Orang Tua' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            <Eye className="w-3 h-3" /> Dibaca Ortu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Terkirim
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => PdfExportService.exportWeeklyReportPdf(rep)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Unduh PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(rep.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Hapus Riwayat"
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

      <EmailDispatchModal
        isOpen={showBatchEmailModal}
        onClose={() => setShowBatchEmailModal(false)}
        title="Kirim Rapor Pekanan ke Email Wali Santri"
        subtitle={`Periode ${WeeklyReportService.formatPeriodLabel(startDate, endDate)} — setiap santri dikirimkan ke alamat email wali masing-masing.`}
        items={emailModalItems}
        onEmailRecorded={(sentItems) => handleRecordedWeeklyEmails(sentItems)}
      />
    </div>
  );
}
