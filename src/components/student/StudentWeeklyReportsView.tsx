import React, { useState, useMemo } from 'react';
import { WeeklyReportItem } from '../../types';
import { WeeklyReportService } from '../../services/weeklyReportService';
import { PdfExportService } from '../../services/pdfExportService';
import { useToast } from '../Toast';
import {
  FileText,
  CheckCircle2,
  Eye,
  Clock,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  UserCheck,
  Inbox,
} from 'lucide-react';

interface StudentWeeklyReportsViewProps {
  studentName: string;
}

export function StudentWeeklyReportsView({ studentName }: StudentWeeklyReportsViewProps) {
  const { showToast } = useToast();
  const [reports, setReports] = useState<WeeklyReportItem[]>(() =>
    WeeklyReportService.getAllReports()
  );

  const studentReports = useMemo(() => {
    return reports
      .filter((r) => r.siswa.toLowerCase().trim() === studentName.toLowerCase().trim())
      .sort((a, b) => new Date(b.dikirim_pada).getTime() - new Date(a.dikirim_pada).getTime());
  }, [reports, studentName]);

  const unreadCount = studentReports.filter((r) => r.status_kirim !== 'Dibaca Orang Tua').length;

  const handleMarkAsRead = (id: string) => {
    const updated = WeeklyReportService.markAsRead(id);
    setReports(updated);
    showToast(
      'Konfirmasi Terkirim',
      'Status rapor pekanan telah ditandai sebagai Sudah Dibaca oleh Orang Tua.',
      'success'
    );
  };

  return (
    <div className="space-y-5">
      {/* Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Kotak Masuk Rapor Pekanan Orang Tua
            </h3>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                {unreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan perkembangan belajar pekanan resmi yang dikirimkan oleh guru pengampu kepada orang tua/wali dari Ananda <strong>{studentName}</strong>.
          </p>
        </div>
      </div>

      {studentReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Inbox className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-600">
            Belum ada rapor pekanan yang dikirimkan oleh guru untuk Ananda {studentName}.
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Saat guru mengirimkan rapor pekanan melalui Portal Guru, laporan tersebut akan langsung muncul di sini untuk dibaca orang tua.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {studentReports.map((rep) => {
            const isRead = rep.status_kirim === 'Dibaca Orang Tua';

            return (
              <div
                key={rep.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
                  isRead ? 'border-slate-200' : 'border-emerald-400 ring-2 ring-emerald-500/15'
                }`}
              >
                {/* Top Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                        <Calendar className="w-3.5 h-3.5" />
                        {rep.periode_label}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {rep.kelas} · {rep.mapel}
                      </span>
                      {!isRead ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black">
                          Baru dari Guru
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <Eye className="w-3 h-3" /> Sudah Dibaca Ortu
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Pengirim: <strong className="text-slate-800">{rep.guru}</strong>
                      </span>
                      <span>·</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Dikirim {new Date(rep.dikirim_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(rep.id)}
                        className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Sudah Dibaca Ortu</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => PdfExportService.exportWeeklyReportPdf(rep)}
                      className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Unduh PDF</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">Kehadiran</div>
                    <div className="text-lg font-black text-emerald-900">{rep.persen_kehadiran}%</div>
                    <div className="text-[10px] text-emerald-700">
                      H:{rep.hadir} I:{rep.izin} S:{rep.sakit} A:{rep.alfa}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70">
                    <div className="text-[10px] font-bold uppercase text-blue-700">Rata-rata Nilai</div>
                    <div className="text-lg font-black text-blue-900">
                      {rep.rata_nilai > 0 ? rep.rata_nilai : '-'}
                    </div>
                    <div className="text-[10px] text-blue-700">{rep.status_kkm}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/70">
                    <div className="text-[10px] font-bold uppercase text-orange-700">Predikat</div>
                    <div className="text-xs font-black text-orange-950 mt-1">{rep.predikat}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-600">Tahfidz & Ibadah</div>
                    <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-2">
                      {rep.tahfidz_ringkasan}
                    </div>
                  </div>
                </div>

                {/* Catatan Guru & Rekomendasi Orang Tua */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-950">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Catatan Guru Pengampu</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{rep.catatan_guru}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Rekomendasi Sinergi Orang Tua di Rumah</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{rep.rekomendasi_ortu}</p>
                  </div>
                </div>

                {isRead && rep.dibaca_pada && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      Dikonfirmasi dibaca Orang Tua pada{' '}
                      {new Date(rep.dibaca_pada).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
