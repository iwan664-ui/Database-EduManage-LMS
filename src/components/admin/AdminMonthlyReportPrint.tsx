import React, { useState, useMemo } from 'react';
import { DatabaseState, MasterKelas } from '../../types';
import { Printer, Download, Filter, Calendar, BookOpen, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { PdfExportService } from '../../services/pdfExportService';

interface AdminMonthlyReportPrintProps {
  database: DatabaseState;
}

export function AdminMonthlyReportPrint({ database }: AdminMonthlyReportPrintProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    database.master_kelas[0]?.id_kelas || ''
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('Oktober');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Active Class Info
  const activeClass = useMemo(() => {
    return database.master_kelas.find((k) => k.id_kelas === selectedClassId) || database.master_kelas[0];
  }, [database.master_kelas, selectedClassId]);

  // Students in this class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return database.siswa_kelas.filter((sk) => sk.id_kelas === activeClass.id_kelas);
  }, [database.siswa_kelas, activeClass]);

  // Absensi & Nilai for this class
  const reportData = useMemo(() => {
    if (!activeClass) return [];

    return classStudents.map((st, idx) => {
      // Absensi
      const studentAbs = database.log_absensi.filter(
        (a) => a.id_kelas === activeClass.id_kelas && a.siswa === st.siswa
      );
      const hadir = studentAbs.filter((a) => a.status_kehadiran === 'Hadir').length;
      const izin = studentAbs.filter((a) => a.status_kehadiran === 'Izin').length;
      const sakit = studentAbs.filter((a) => a.status_kehadiran === 'Sakit').length;
      const alfa = studentAbs.filter((a) => a.status_kehadiran === 'Alfa').length;
      const totalSesi = studentAbs.length;
      const presenceRate = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 0;

      // Nilai
      const studentGrades = database.log_nilai.filter(
        (n) => n.id_kelas === activeClass.id_kelas && n.siswa === st.siswa
      );
      const numericGrades = studentGrades.map((g) => Number(g.nilai));
      const avg =
        numericGrades.length > 0
          ? Math.round((numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length) * 10) / 10
          : 0;

      // Ambil catatan terakhir
      const lastNote = studentGrades[studentGrades.length - 1]?.catatan || '';

      return {
        no: idx + 1,
        siswa: st.siswa,
        email: st.email_siswa,
        hadir,
        izin,
        sakit,
        alfa,
        totalSesi,
        presenceRate,
        grades: studentGrades,
        avg,
        status: avg >= 85 ? 'Tuntas' : avg > 0 ? 'Remedial' : 'Belum Ada Nilai',
        note: lastNote,
      };
    });
  }, [activeClass, classStudents, database.log_absensi, database.log_nilai]);

  const aggregates = useMemo(() => {
    if (reportData.length === 0) return { avgPresence: 0, avgGrade: 0, tuntasPercent: 0 };
    const avgPresence = Math.round(reportData.reduce((acc, r) => acc + r.presenceRate, 0) / reportData.length);
    const validGrades = reportData.filter((r) => r.avg > 0);
    const avgGrade = validGrades.length > 0 ? Math.round((validGrades.reduce((acc, r) => acc + r.avg, 0) / validGrades.length) * 10) / 10 : 0;
    const tuntasCount = validGrades.filter((r) => r.avg >= 85).length;
    const tuntasPercent = validGrades.length > 0 ? Math.round((tuntasCount / validGrades.length) * 100) : 0;
    return { avgPresence, avgGrade, tuntasPercent };
  }, [reportData]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!activeClass) return;
    const headers = [
      'No',
      'Nama Siswa',
      'Email',
      'Hadir',
      'Izin',
      'Sakit',
      'Alfa',
      'Persen Kehadiran',
      'Rata-rata Nilai',
      'Status KKM',
    ];
    const rows = reportData.map((r) => [
      r.no,
      `"${r.siswa}"`,
      r.email,
      r.hadir,
      r.izin,
      r.sakit,
      r.alfa,
      `${r.presenceRate}%`,
      r.avg,
      r.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Bulanan_${activeClass.id_kelas}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    if (!activeClass || reportData.length === 0) return;

    PdfExportService.exportMonthlyReportPdf({
      className: `${activeClass.kelas} (${activeClass.id_kelas})`,
      branchName: activeClass.cabang,
      subjectName: activeClass.mapel,
      teacherName: activeClass.guru,
      month: selectedMonth,
      year: selectedYear,
      rows: reportData,
      aggregates,
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Toolbar (Hidden during print) */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cetak Laporan Bulanan Siswa (Siap Cetak / PDF)</h2>
            <p className="text-xs text-slate-500">
              Format standar resmi untuk arsip akademik, laporan ke orang tua / yayasan, atau dicetak fisik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Unduh langsung sebagai file PDF formal menggunakan jsPDF"
            >
              <FileText className="w-4 h-4 text-emerald-100" />
              <span>Unduh PDF (jsPDF)</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Dialog Cetak</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Pilih Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {database.master_kelas.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  {k.kelas} - {k.mapel}
                </option>
              ))}
            </select>
          </div>

          {/* Bulan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Periode Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            />
          </div>
        </div>
      </div>

      {/* PAPER CONTAINER (Optimized for Screen & Print) */}
      <div className="bg-white rounded-2xl border border-slate-300 p-8 shadow-md print:border-none print:shadow-none print:p-0 print:m-0 max-w-5xl mx-auto text-slate-900 font-sans">
        {/* Official Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
              alt="Logo AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK"
              className="w-16 h-16 object-contain shrink-0"
            />
            <div>
              <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-slate-900">
                AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK
              </h1>
              <p className="text-xs text-slate-700 font-semibold">
                Pendidikan Berkualitas Berbasis Al-Qur'an, Karakter Islami & Kurikulum Internasional
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Grand Depok City, Kota Depok, Jawa Barat · Telp: (021) 7788-2929 · Email: akademik@alwildan29depok.sch.id
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono font-bold uppercase rounded">
              Laporan Resmi
            </span>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              No: {activeClass?.id_kelas}/AW29-DEPOK/{selectedMonth.toUpperCase()}/{selectedYear}
            </div>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center my-4">
          <h2 className="text-base font-bold uppercase underline tracking-wide">
            Laporan Rekapitulasi Presensi & Evaluasi Belajar Siswa
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Periode: <strong>{selectedMonth} {selectedYear}</strong>
          </p>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 print:bg-transparent p-4 rounded-xl border border-slate-200 print:border-slate-400 mb-6">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-semibold text-slate-600">Kelas:</span>
              <span className="font-bold text-slate-900">{activeClass?.kelas}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-600">Mata Pelajaran:</span>
              <span className="font-bold text-slate-900">{activeClass?.mapel}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-600">ID Kelas:</span>
              <span className="font-mono text-slate-800">{activeClass?.id_kelas}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-semibold text-slate-600">Tutor Pengampu:</span>
              <span className="font-bold text-slate-900">{activeClass?.guru}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-600">Jadwal Sesi:</span>
              <span className="text-slate-800">
                {activeClass?.hari}, {activeClass?.waktu}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-600">Lokasi / Cabang:</span>
              <span className="text-slate-800">{activeClass?.cabang}</span>
            </div>
          </div>
        </div>

        {/* Master Student Matrix Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 text-slate-800 border-b border-slate-300 text-center font-bold">
                <th className="p-2 border border-slate-300 w-8">No</th>
                <th className="p-2 border border-slate-300 text-left">Nama Siswa</th>
                <th className="p-2 border border-slate-300 w-12">H</th>
                <th className="p-2 border border-slate-300 w-12">I</th>
                <th className="p-2 border border-slate-300 w-12">S</th>
                <th className="p-2 border border-slate-300 w-12">A</th>
                <th className="p-2 border border-slate-300 w-16">% Hadir</th>
                <th className="p-2 border border-slate-300 w-20">Nilai Akhir</th>
                <th className="p-2 border border-slate-300 w-24">Status KKM</th>
                <th className="p-2 border border-slate-300 text-left">Catatan Perkembangan</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={`report_row_${row.siswa}_${idx}`} className="border-b border-slate-200 print:border-slate-300">
                  <td className="p-2 border border-slate-300 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-slate-300 font-bold">{row.siswa}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono">{row.hadir}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono">{row.izin}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono">{row.sakit}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono">{row.alfa}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-bold">
                    {row.presenceRate}%
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-bold text-sm">
                    {row.avg > 0 ? row.avg : '-'}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    <span
                      className={
                        row.status === 'Tuntas'
                          ? 'text-emerald-700 font-bold'
                          : row.status === 'Remedial'
                          ? 'text-rose-700 font-bold'
                          : 'text-slate-500'
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="p-2 border border-slate-300 text-[11px] text-slate-600 italic">
                    {row.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend & Kriteria Ketuntasan Minimal */}
        <div className="text-[11px] text-slate-600 mb-8 border border-slate-200 p-3 rounded-lg print:border-slate-400">
          <strong>Keterangan:</strong> KKM (Kriteria Ketuntasan Minimal) adalah <strong>85</strong>.
          Siswa berstatus <em>Remedial</em> disarankan mengikuti pendampingan klinik belajar tambahan.
          Presensi: <strong>H</strong> = Hadir, <strong>I</strong> = Izin, <strong>S</strong> = Sakit, <strong>A</strong> = Alfa.
        </div>

        {/* Signature Blocks */}
        <div className="grid grid-cols-2 text-center text-xs pt-4 border-t border-slate-200 print:border-slate-400">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-0.5">Kepala Bidang Akademik</p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">Dr. Hendra Wijaya, M.Pd.</p>
            <p className="text-[11px] text-slate-500 font-mono">NIP. 19820412 200501 1 004</p>
          </div>

          <div>
            <p className="text-slate-500">Jakarta, {selectedMonth} {selectedYear}</p>
            <p className="font-bold text-slate-900 mt-0.5">Tutor Pengampu Mata Pelajaran</p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">{activeClass?.guru}</p>
            <p className="text-[11px] text-slate-500 font-mono">ID Tutor: {database.master_guru.find(g => g.guru === activeClass?.guru)?.id_tutor || 'TUTOR-LMS'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
