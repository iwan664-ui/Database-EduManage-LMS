import React, { useMemo, useState } from 'react';
import {
  AcademicReportPeriodType,
  AcademicTermReportItem,
  DatabaseState,
} from '../../types';
import { TermReportService } from '../../services/termReportService';
import { PdfExportService } from '../../services/pdfExportService';
import { useToast } from '../Toast';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Inbox,
  UserCheck,
} from 'lucide-react';

interface StudentTermReportsViewProps {
  studentName: string;
  database: DatabaseState;
  reportType: AcademicReportPeriodType;
}

export function StudentTermReportsView({
  studentName,
  database,
  reportType,
}: StudentTermReportsViewProps) {
  const { showToast } = useToast();
  const [reports, setReports] = useState<AcademicTermReportItem[]>(() =>
    TermReportService.getAllReports()
  );

  const publishedReports = useMemo(() => {
    return reports
      .filter(
        (r) =>
          r.siswa.toLowerCase().trim() === studentName.toLowerCase().trim() &&
          r.jenis_rapor === reportType &&
          r.status_publikasi !== 'Draf'
      )
      .sort((a, b) =>
        (b.diterbitkan_pada || b.tanggal_rapor).localeCompare(
          a.diterbitkan_pada || a.tanggal_rapor
        )
      );
  }, [reports, studentName, reportType]);

  // Real-time fallback preview compiled from LMS data if no published term report exists yet
  const livePreviewReport = useMemo<AcademicTermReportItem>(() => {
    return TermReportService.buildStudentTermDraft({
      database,
      studentName,
      jenisRapor: reportType,
      semester: 'Ganjil',
      tahunAjaran: '2026/2027',
      waliKelas: 'Wali Kelas Akademik',
      tanggalRapor: new Date().toISOString().split('T')[0],
    });
  }, [database, studentName, reportType]);

  const handleMarkAsRead = (id: string) => {
    const updated = TermReportService.markAsRead(id);
    setReports(updated);
    showToast(
      'Konfirmasi Terkirim',
      `Status Rapor ${reportType} telah dikonfirmasi Sudah Dibaca oleh Orang Tua.`,
      'success'
    );
  };

  const unreadCount = publishedReports.filter(
    (r) => r.status_publikasi !== 'Dibaca Orang Tua'
  ).length;

  const isPts = reportType === 'Tengah Semester';

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isPts ? (
              <ClipboardCheck className="w-5 h-5 text-orange-500 shrink-0" />
            ) : (
              <Award className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <h3 className="text-base font-extrabold text-slate-900">
              {isPts
                ? 'Rapor Tengah Semester (PTS)'
                : 'Rapor Akhir Semester (PAS / PAT)'}
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs font-extrabold text-orange-600">
                · {unreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Laporan hasil belajar resmi{' '}
            {isPts ? 'Penilaian Tengah Semester (PTS)' : 'Akhir Semester (PAS/PAT)'} untuk Ananda{' '}
            <strong className="text-slate-800">{studentName}</strong> · Standar KKM 85.
          </p>
        </div>
      </div>

      {publishedReports.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Inbox className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Rapor {reportType} resmi belum diterbitkan oleh Wali Kelas untuk periode ini.
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Di bawah ini adalah pratinjau sementara (real-time) yang dihitung otomatis dari catatan presensi, nilai tugas, dan tahfidz Ananda.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => PdfExportService.exportTermReportPdf(livePreviewReport)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh Pratinjau PDF</span>
            </button>
          </div>

          <TermReportCardView report={livePreviewReport} isPreview />
        </div>
      ) : (
        <div className="space-y-5">
          {publishedReports.map((rep) => (
            <TermReportCardView
              key={rep.id}
              report={rep}
              onMarkAsRead={() => handleMarkAsRead(rep.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TermReportCardView({
  report,
  isPreview = false,
  onMarkAsRead,
}: {
  report: AcademicTermReportItem;
  isPreview?: boolean;
  onMarkAsRead?: () => void;
}) {
  const isRead = report.status_publikasi === 'Dibaca Orang Tua';
  const isPts = report.jenis_rapor === 'Tengah Semester';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
      {/* Top Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-extrabold text-slate-900">
              {report.jenis_rapor} · Semester {report.semester} {report.tahun_ajaran}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="font-mono text-slate-500 tabular-nums">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {report.tanggal_rapor}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span
              className={`font-bold ${
                isPreview
                  ? 'text-amber-700'
                  : isRead
                    ? 'text-emerald-700'
                    : 'text-orange-600'
              }`}
            >
              {isPreview
                ? 'Pratinjau Sementara'
                : isRead
                  ? 'Sudah Dibaca Ortu'
                  : 'Baru Diterbitkan'}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {report.kelas_utama} ({report.cabang}) · Wali Kelas:{' '}
              <strong className="text-slate-800">{report.wali_kelas}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isPreview && !isRead && onMarkAsRead && (
            <button
              type="button"
              onClick={onMarkAsRead}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tandai Sudah Dibaca Ortu</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => PdfExportService.exportTermReportPdf(report)}
            className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Unduh PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Rata-rata Umum</div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
            {report.rata_rata_umum}
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            Bobot {report.bobot_harian_persen}% / {report.bobot_ujian_persen}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Ketuntasan KKM 85</div>
          <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-0.5">
            {report.persen_ketuntasan}%
          </div>
          <div className="text-[11px] text-slate-500">
            {report.daftar_nilai.filter((d) => d.tuntas_kkm).length}/{report.daftar_nilai.length} mapel tuntas
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Kehadiran</div>
          <div className="text-2xl font-black text-blue-700 font-mono tabular-nums mt-0.5">
            {report.persen_kehadiran}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            S:{report.sakit} · I:{report.izin} · A:{report.alfa}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Adab &amp; Karakter</div>
          <div className="text-base font-black text-slate-900 mt-1">{report.adab_predikat}</div>
          <div className="text-[11px] text-slate-500 truncate" title={report.tahfidz_capaian}>
            Tahfidz terpantau
          </div>
        </div>
      </div>

      {/* Subject Grades Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
              <th className="px-3 py-3 font-semibold text-center">Harian</th>
              <th className="px-3 py-3 font-semibold text-center">
                {isPts ? 'Nilai PTS' : 'Nilai PAS'}
              </th>
              <th className="px-3 py-3 font-semibold text-center">Nilai Akhir</th>
              <th className="px-3 py-3 font-semibold text-center">Predikat</th>
              <th className="px-3 py-3 font-semibold text-center">KKM 85</th>
              <th className="px-4 py-3 font-semibold">Capaian Kompetensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.daftar_nilai.map((sub, idx) => (
              <tr key={`${sub.id_kelas}_${idx}`} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900">{sub.mapel}</div>
                  <div className="text-[11px] text-slate-500">{sub.guru}</div>
                </td>
                <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-700">
                  {sub.nilai_harian}
                </td>
                <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-700">
                  {sub.nilai_ujian}
                </td>
                <td
                  className={`px-3 py-3 text-center font-mono font-black tabular-nums ${
                    sub.tuntas_kkm ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {sub.nilai_akhir}
                </td>
                <td className="px-3 py-3 text-center font-mono font-extrabold text-slate-900">
                  {sub.predikat}
                </td>
                <td className="px-3 py-3 text-center font-bold">
                  <span className={sub.tuntas_kkm ? 'text-emerald-700' : 'text-rose-700'}>
                    {sub.tuntas_kkm ? 'Tuntas' : 'Remedial'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-[11px] leading-relaxed">
                  {sub.capaian_kompetensi}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Non-Academic & Homeroom Decision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tahfidz &amp; Ekstrakurikuler</span>
          </div>
          <div className="text-slate-700">
            <strong>Tahfidz:</strong> {report.tahfidz_capaian}
          </div>
          <div className="text-slate-700">
            <strong>Ekstrakurikuler:</strong> {report.ekskul_catatan}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Catatan Wali Kelas &amp; Keputusan</span>
          </div>
          <p className="text-slate-700 leading-relaxed">{report.catatan_wali_kelas}</p>
          <div className="font-bold text-emerald-800 pt-1">
            Keputusan: {report.keputusan_akademik}
          </div>
        </div>
      </div>
    </div>
  );
}
