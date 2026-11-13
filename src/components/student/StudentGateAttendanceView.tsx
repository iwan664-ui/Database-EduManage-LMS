import React, { useState, useMemo } from 'react';
import { GateAttendanceLog } from '../../types';
import { GateAttendanceService } from '../../services/gateAttendanceService';
import { PdfExportService } from '../../services/pdfExportService';
import { useToast } from '../Toast';
import {
  Clock,
  LogIn,
  LogOut as LogOutIcon,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Calendar,
  FileText,
  Copy,
  Check,
  MessageCircle,
  Timer,
  Building2,
  Sparkles,
} from 'lucide-react';

interface StudentGateAttendanceViewProps {
  studentName: string;
  cabang?: string;
}

export function StudentGateAttendanceView({ studentName, cabang }: StudentGateAttendanceViewProps) {
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState<'all' | 'Tepat Waktu' | 'Terlambat' | 'Belum Pulang'>('all');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const cardCode = useMemo(() => GateAttendanceService.getStudentCardCode(studentName), [studentName]);
  const scheduleConfig = useMemo(() => GateAttendanceService.getScheduleConfig(), []);

  const allStudentLogs = useMemo(() => {
    return GateAttendanceService.getAllLogs()
      .filter((l) => l.siswa.toLowerCase().trim() === studentName.toLowerCase().trim())
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [studentName]);

  const todayLog = useMemo(() => {
    return allStudentLogs.find((l) => l.tanggal === todayStr);
  }, [allStudentLogs, todayStr]);

  const filteredLogs = useMemo(() => {
    if (filterStatus === 'all') return allStudentLogs;
    if (filterStatus === 'Belum Pulang') {
      return allStudentLogs.filter((l) => l.status_pulang === 'Belum Pulang');
    }
    return allStudentLogs.filter((l) => l.status_masuk === filterStatus);
  }, [allStudentLogs, filterStatus]);

  // Aggregate personal stats
  const stats = useMemo(() => {
    const withIn = allStudentLogs.filter((l) => Boolean(l.jam_masuk));
    const onTime = allStudentLogs.filter((l) => l.status_masuk === 'Tepat Waktu').length;
    const late = allStudentLogs.filter((l) => l.status_masuk === 'Terlambat').length;
    const punctualRate = withIn.length > 0 ? Math.round((onTime / withIn.length) * 100) : 100;

    const avgMinutes = (times: string[]) => {
      if (times.length === 0) return '-';
      const totalMins = times.reduce((acc, t) => {
        const [h, m] = t.replace(/\./g, ':').split(':').map(Number);
        return acc + (h || 0) * 60 + (m || 0);
      }, 0);
      const avg = Math.round(totalMins / times.length);
      const hh = String(Math.floor(avg / 60)).padStart(2, '0');
      const mm = String(avg % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    const avgMasuk = avgMinutes(withIn.map((l) => l.jam_masuk!));
    const withOut = allStudentLogs.filter((l) => Boolean(l.jam_pulang));
    const avgPulang = avgMinutes(withOut.map((l) => l.jam_pulang!));

    return {
      totalDays: allStudentLogs.length,
      onTime,
      late,
      punctualRate,
      avgMasuk,
      avgPulang,
    };
  }, [allStudentLogs]);

  const buildShareText = (log?: GateAttendanceLog) => {
    const target = log || todayLog;
    if (!target) {
      return `*INFO KEHADIRAN GERBANG SANTRI — AL-WILDAN 29 DEPOK*\nAnanda *${studentName}* (${cardCode}) belum tercatat melakukan scan gerbang pada tanggal ${todayStr}.`;
    }
    return `*INFO KEHADIRAN HARIAN SANTRI — AL-WILDAN 29 DEPOK*
👤 Nama: *${target.siswa}* (${target.kode_kartu})
📅 Tanggal: ${target.tanggal}
🟢 Jam Hadir: *${target.jam_masuk || '-'} WIB* (${target.status_masuk || '-'})
🟠 Jam Pulang: *${target.jam_pulang ? `${target.jam_pulang} WIB` : 'Masih di Sekolah'}* (${target.status_pulang})
📍 Lokasi: ${target.lokasi_gerbang}
🛡️ Petugas Scan: ${target.scan_oleh_masuk || target.scan_oleh_pulang || 'Petugas Sekolah'}`;
  };

  const handleCopyToday = () => {
    navigator.clipboard.writeText(buildShareText());
    setCopiedSummary(true);
    showToast('Ringkasan Disalin', 'Info jam hadir dan pulang siap dibagikan ke grup keluarga.', 'success');
    setTimeout(() => setCopiedSummary(false), 2200);
  };

  const handleExportPdf = () => {
    if (allStudentLogs.length === 0) {
      showToast('Data Kosong', 'Belum ada catatan scan gerbang untuk diunduh.', 'warning');
      return;
    }
    PdfExportService.exportGateAttendancePdf({
      title: `RIWAYAT JAM HADIR & PULANG — ${studentName.toUpperCase()}`,
      printedBy: `Orang Tua / Santri (${studentName})`,
      filterLabel: `${studentName} (${cardCode})`,
      logs: allStudentLogs,
    });
    showToast('PDF Diunduh', 'Riwayat jam hadir & pulang ananda berhasil disimpan ke PDF.', 'success');
  };

  return (
    <div className="space-y-5">
      {/* 1. LIVE TODAY STATUS CARD FOR PARENTS */}
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pantauan Real-Time Orang Tua · Terhubung Scanner Guru & Manajemen</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight mt-2">
              Kehadiran Gerbang & Kelas Hari Ini ({todayStr})
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Ananda <strong className="text-white">{studentName}</strong> · ID Smart Card:{' '}
              <span className="font-mono font-bold text-orange-300">{cardCode}</span>
              {cabang ? ` · ${cabang}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyToday}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Tersalin!' : 'Salin Info Hari Ini'}</span>
            </button>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareText())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Bagikan WA</span>
            </a>
          </div>
        </div>

        {/* Arrival & Departure Split Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jam Hadir / Masuk */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <LogIn className="w-4 h-4" />
                Jam Hadir (Check-In)
              </span>
              {todayLog?.jam_masuk ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    todayLog.status_masuk === 'Tepat Waktu'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                      : 'bg-rose-500/25 text-rose-200 border border-rose-400/40'
                  }`}
                >
                  {todayLog.status_masuk}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/30 text-slate-200">
                  Belum Scan Masuk
                </span>
              )}
            </div>

            <div className="text-3xl font-black font-mono tracking-tight text-white">
              {todayLog?.jam_masuk ? `${todayLog.jam_masuk.slice(0, 5)} WIB` : '--:--'}
            </div>

            <div className="text-[11px] text-blue-100/90 space-y-1 pt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>
                  Di-scan oleh:{' '}
                  <strong className="text-white">
                    {todayLog?.scan_oleh_masuk || 'Menunggu scan kartu gerbang'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>
                  {todayLog?.lokasi_gerbang || `Batas masuk tepat waktu pukul ${scheduleConfig.batasJamMasuk} WIB`}
                </span>
              </div>
            </div>
          </div>

          {/* Jam Pulang / Keluar */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                <LogOutIcon className="w-4 h-4" />
                Jam Pulang (Check-Out)
              </span>
              {todayLog?.jam_pulang ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    todayLog.status_pulang === 'Sudah Pulang'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                      : 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                  }`}
                >
                  {todayLog.status_pulang}
                </span>
              ) : todayLog?.jam_masuk ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-100 border border-blue-400/40 animate-pulse">
                  Sedang di Sekolah
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/30 text-slate-200">
                  Menunggu Kehadiran
                </span>
              )}
            </div>

            <div className="text-3xl font-black font-mono tracking-tight text-white">
              {todayLog?.jam_pulang ? `${todayLog.jam_pulang.slice(0, 5)} WIB` : '--:--'}
            </div>

            <div className="text-[11px] text-blue-100/90 space-y-1 pt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-300 shrink-0" />
                <span>
                  Di-scan oleh:{' '}
                  <strong className="text-white">
                    {todayLog?.scan_oleh_pulang ||
                      (todayLog?.jam_masuk
                        ? 'Ananda masih mengikuti kegiatan belajar'
                        : 'Belum ada aktivitas pulang')}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>
                  Durasi di Sekolah:{' '}
                  <strong className="text-white">
                    {GateAttendanceService.computeDuration(todayLog?.jam_masuk, todayLog?.jam_pulang)}
                  </strong>{' '}
                  (Jadwal pulang ≥ {scheduleConfig.jamPulangStandar} WIB)
                </span>
              </div>
            </div>
          </div>
        </div>

        {todayLog?.catatan && (
          <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-blue-100">
            <strong className="text-white">Catatan Petugas / Guru:</strong> {todayLog.catatan}
          </div>
        )}
      </div>

      {/* 2. PERSONAL ATTENDANCE SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Ketepatan Hadir</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.punctualRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.onTime} Tepat Waktu · {stats.late} Terlambat
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Rata-rata Jam Hadir</div>
          <div className="text-2xl font-black font-mono text-blue-700 mt-1">
            {stats.avgMasuk !== '-' ? `${stats.avgMasuk}` : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Batas sekolah: {scheduleConfig.batasJamMasuk} WIB</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Rata-rata Jam Pulang</div>
          <div className="text-2xl font-black font-mono text-orange-600 mt-1">
            {stats.avgPulang !== '-' ? `${stats.avgPulang}` : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Jadwal standar: {scheduleConfig.jamPulangStandar} WIB</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Log Gerbang</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalDays} Hari</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Smart Card Terverifikasi
          </div>
        </div>
      </div>

      {/* 3. COMPLETE ARRIVAL & DEPARTURE HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Riwayat Lengkap Jam Masuk & Pulang Anak</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap pemindaian kartu oleh guru piket maupun manajemen langsung tercatat di sini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Status ({allStudentLogs.length})</option>
              <option value="Tepat Waktu">Tepat Waktu</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Belum Pulang">Belum Pulang</option>
            </select>

            <button
              type="button"
              onClick={handleExportPdf}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Belum ada riwayat scan gerbang pada kategori ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 font-bold text-center">Jam Hadir</th>
                  <th className="px-4 py-3 font-bold text-center">Status Masuk</th>
                  <th className="px-4 py-3 font-bold text-center">Jam Pulang</th>
                  <th className="px-4 py-3 font-bold text-center">Status Pulang</th>
                  <th className="px-4 py-3 font-bold text-center">Durasi</th>
                  <th className="px-4 py-3 font-bold">Petugas Scan & Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{log.tanggal}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(`${log.tanggal}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long' })}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-black text-emerald-700">
                      {log.jam_masuk ? `${log.jam_masuk.slice(0, 5)} WIB` : '-'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {log.status_masuk === 'Tepat Waktu' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Tepat Waktu
                        </span>
                      ) : log.status_masuk === 'Terlambat' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> Terlambat
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-black text-orange-600">
                      {log.jam_pulang ? `${log.jam_pulang.slice(0, 5)} WIB` : '-'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status_pulang === 'Sudah Pulang'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : log.status_pulang === 'Pulang Awal'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {log.status_pulang === 'Belum Pulang' ? 'Masih di Sekolah' : log.status_pulang}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                      {GateAttendanceService.computeDuration(log.jam_masuk, log.jam_pulang)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>{log.lokasi_gerbang}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Masuk: {log.scan_oleh_masuk || '-'}
                        {log.scan_oleh_pulang ? ` · Pulang: ${log.scan_oleh_pulang}` : ''}
                      </div>
                      {log.catatan && (
                        <div className="text-[10px] italic text-slate-400 mt-0.5">"{log.catatan}"</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
