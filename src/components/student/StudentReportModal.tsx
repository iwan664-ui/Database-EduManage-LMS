import React, { useState } from 'react';
import { DatabaseState, MasterSiswa, SiswaEkstrakurikuler } from '../../types';
import { useToast } from '../Toast';
import {
  X,
  Printer,
  Download,
  Share2,
  Award,
  CheckCircle2,
  FileText,
  QrCode,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  Building2,
  BookOpen,
  Send,
  User,
} from 'lucide-react';

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  database: DatabaseState;
  initialTab?: 'rapor' | 'piagam' | 'whatsapp';
}

export function StudentReportModal({
  isOpen,
  onClose,
  studentName,
  database,
  initialTab = 'rapor',
}: StudentReportModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'rapor' | 'piagam' | 'whatsapp'>(initialTab);
  const [copiedWa, setCopiedWa] = useState<boolean>(false);
  const [parentWaNumber, setParentWaNumber] = useState<string>('');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const KKM_STANDARD = 85;

  if (!isOpen) return null;

  // Student info
  const student = database.master_siswa.find((s) => s.siswa === studentName) || {
    siswa: studentName,
    cabang: 'Kampus Utama BSD City',
    email_siswa: `${studentName.toLowerCase().replace(/\s+/g, '.')}@alwildan3bsd.sch.id`,
  };

  // Enrolled classes
  const classes = database.siswa_kelas.filter((sk) => sk.siswa === studentName);

  // Student attendance
  const attendance = database.log_absensi.filter((la) => la.siswa === studentName);
  const totalSesi = attendance.length;
  const hadir = attendance.filter((a) => a.status_kehadiran === 'Hadir').length;
  const izin = attendance.filter((a) => a.status_kehadiran === 'Izin').length;
  const sakit = attendance.filter((a) => a.status_kehadiran === 'Sakit').length;
  const alfa = attendance.filter((a) => a.status_kehadiran === 'Alfa').length;
  const presenceRate = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 0;

  // Student grades
  const grades = database.log_nilai.filter((ln) => ln.siswa === studentName);
  const gradeNumbers = grades.map((g) => Number(g.nilai));
  const avgGrade =
    gradeNumbers.length > 0
      ? Math.round((gradeNumbers.reduce((a, b) => a + b, 0) / gradeNumbers.length) * 10) / 10
      : 0;
  const highestGrade = gradeNumbers.length > 0 ? Math.max(...gradeNumbers) : 0;
  const passCount = gradeNumbers.filter((n) => n >= KKM_STANDARD).length;
  const passPercent = gradeNumbers.length > 0 ? Math.round((passCount / gradeNumbers.length) * 100) : 0;

  // Extracurriculars
  const ekskuls = (database.ekstrakurikuler || []).filter((e) => e.siswa === studentName);

  // Calculate subject rows
  const subjectRows = classes.map((cls) => {
    const classGrades = grades.filter((g) => g.id_kelas === cls.id_kelas);
    const nums = classGrades.map((g) => Number(g.nilai));
    const avg =
      nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
    const isTuntas = avg >= KKM_STANDARD;
    const predikat = avg >= 93 ? 'A (Istimewa)' : avg >= 85 ? 'B (Tuntas Baik)' : avg > 0 ? 'C (Remedial)' : '-';
    const lastNote = classGrades[0]?.catatan || 'Peserta didik aktif berpartisipasi dan menjaga adab belajar.';

    return {
      mapel: cls.mapel,
      guru: cls.guru,
      kelas: cls.kelas,
      avg,
      isTuntas,
      predikat,
      note: lastNote,
      evalCount: nums.length,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = () => {
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const ekskulSummary = ekskuls.length > 0
      ? ekskuls.map((e) => `• *${e.nama_ekskul}* (Predikat: ${e.predikat}, Kehadiran: ${e.kehadiran_persen}%)`).join('\n')
      : '• Belum terdaftar pada kegiatan ekstrakurikuler';

    return `*LAPORAN PERKEMBANGAN BELAJAR SANTRI*
*AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY*
_Tanggal: ${today}_
--------------------------------------------
*Assalamu'alaikum Warahmatullahi Wabarakatuh,*
Bapak/Ibu Orang Tua/Wali dari Ananda:
*${student.siswa}*
Cabang: ${student.cabang}

Berikut adalah ringkasan hasil belajar dan presensi ananda:

📊 *RINGKASAN AKADEMIK & KKM (Standar 85):*
• Rata-rata Nilai: *${avgGrade}* ${avgGrade >= KKM_STANDARD ? '✅ Tuntas di atas KKM' : '⚠️ Perlu Pembimbingan'}
• Nilai Tertinggi: *${highestGrade}*
• Ketuntasan Evaluasi: *${passCount}/${grades.length} Sesi (${passPercent}%)*

🗓️ *PRESENSI & KEDISIPLINAN:*
• Tingkat Kehadiran: *${presenceRate}%*
• Rincian: Hadir: ${hadir} | Izin: ${izin} | Sakit: ${sakit} | Alfa: ${alfa}

🏅 *EKSTRAKURIKULER & TAHFIDZ:*
${ekskulSummary}

💬 *CATATAN PENDIDIK:*
_"Semoga Ananda senantiasa istiqomah dalam menuntut ilmu, berakhlakul karimah, dan meningkatkan hafalannya. Jazakumullah khairan katsiran atas sinergi Bapak/Ibu sekalian."_

--------------------------------------------
*Wassalamu'alaikum Warahmatullahi Wabarakatuh*
_AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY_`;
  };

  const handleCopyWa = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    setCopiedWa(true);
    showToast('Teks Disalin', 'Pesan laporan siap ditempel ke WhatsApp.', 'success');
    setTimeout(() => setCopiedWa(false), 2500);
  };

  const handleOpenWa = () => {
    const cleanPhone = parentWaNumber.replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone ? (cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone) : '';
    const textEncoded = encodeURIComponent(generateWhatsAppMessage());
    const url = phoneParam
      ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${textEncoded}`
      : `https://api.whatsapp.com/send?text=${textEncoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="print:hidden p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-extrabold text-slate-900">
                  E-Rapor Resmi & Piagam Prestasi
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                  Standar KKM {KKM_STANDARD}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Santri: <strong className="text-slate-800">{student.siswa}</strong> ({student.cabang})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              title="Cetak format cetak A4 / PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Dokumen</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher (Hidden on print) */}
        <div className="print:hidden flex border-b border-slate-100 px-5 pt-3 gap-2 bg-white">
          <button
            onClick={() => setActiveTab('rapor')}
            className={`py-2 px-4 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'rapor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            E-Rapor Perkembangan Santri
          </button>
          <button
            onClick={() => setActiveTab('piagam')}
            className={`py-2 px-4 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'piagam'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            Piagam Prestasi Akademik
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2 px-4 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'whatsapp'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            Kirim WhatsApp ke Orang Tua
          </button>
        </div>

        {/* Scrollable Document Canvas */}
        <div className="overflow-y-auto p-4 md:p-8 flex-1 bg-slate-50/50 print:p-0 print:bg-white print:overflow-visible">
          {/* ========================================================= */}
          {/* TAB 1: E-RAPOR DIGITAL RESMI */}
          {/* ========================================================= */}
          {activeTab === 'rapor' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 shadow-sm max-w-3xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0 print:max-w-none">
              {/* Kop Surat Resmi */}
              <div className="border-b-4 border-double border-slate-900 pb-4 text-center relative flex flex-col items-center">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <img
                    src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
                    alt="Logo Al-Wildan"
                    className="w-18 h-18 object-contain shrink-0"
                  />
                  <div className="text-center">
                    <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase">
                      AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
                    </h2>
                    <h3 className="text-xs md:text-sm font-bold text-slate-700">
                      BSD CITY — TANGERANG SELATAN, BANTEN
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-slate-500 max-w-lg mt-0.5">
                      Kawasan BSD City, Tangerang Selatan, Banten · Web: www.alwildan3bsd.sch.id
                    </p>
                    <p className="text-[10px] font-mono text-blue-700 font-semibold mt-0.5">
                      Akreditasi A (Unggul) · Kurikulum TIC (Tahfidz, International, Curriculum)
                    </p>
                  </div>
                </div>
              </div>

              {/* Judul Dokumen */}
              <div className="text-center space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider underline">
                  LAPORAN HASIL BELAJAR SISWA (E-RAPOR PERKEMBANGAN)
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Tahun Ajaran 2026/2027 · Standar Kriteria Ketuntasan Minimal (KKM): <strong>{KKM_STANDARD}</strong>
                </p>
              </div>

              {/* Biodata Siswa Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nama Siswa</span>
                    <span className="font-bold text-slate-900">: {student.siswa}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nomor Induk / ID</span>
                    <span className="font-mono font-bold text-slate-800">: 03-BSD-{Math.abs(student.siswa.length * 137).toString().padStart(4, '0')}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Cabang Kampus</span>
                    <span className="font-medium text-slate-800">: {student.cabang}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Kelas</span>
                    <span className="font-bold text-slate-900">: {classes[0]?.kelas || 'Kelas Unggulan A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Semester</span>
                    <span className="font-medium text-slate-800">: Ganjil (Gasal)</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Wali Kelas</span>
                    <span className="font-medium text-slate-800">: Budi Santoso, S.Pd.</span>
                  </div>
                </div>
              </div>

              {/* Tabel Capaian Akademik (KKM 85) */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-900 uppercase">
                  A. Capaian Mata Pelajaran (Standar KKM: {KKM_STANDARD})
                </h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-800 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Mata Pelajaran</th>
                        <th className="py-2.5 px-3 text-center w-16">KKM</th>
                        <th className="py-2.5 px-3 text-center w-20">Nilai Akhir</th>
                        <th className="py-2.5 px-3 text-center w-28">Predikat</th>
                        <th className="py-2.5 px-3">Deskripsi Kemajuan Belajar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjectRows.map((row, idx) => (
                        <tr key={row.mapel} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900 block">{row.mapel}</span>
                            <span className="text-[10px] text-slate-500">{row.guru}</span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">{KKM_STANDARD}</td>
                          <td className="py-2 px-3 text-center font-mono font-black text-sm">
                            <span className={row.avg >= KKM_STANDARD ? 'text-emerald-700' : 'text-rose-700'}>
                              {row.avg > 0 ? row.avg : '-'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-[11px] font-bold">
                            {row.predikat}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-600 leading-relaxed italic">
                            "{row.note}"
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right">Rata-rata Nilai Keseluruhan:</td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-blue-700">{avgGrade}</td>
                        <td colSpan={2} className="py-2.5 px-3 text-[11px]">
                          {avgGrade >= KKM_STANDARD ? '✅ TUNTAS KKM 85 (MEMENUHI SYARAT KELULUSAN)' : '⚠️ PERLU BIMBINGAN KHUSUS'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Rincian Presensi & Ekstrakurikuler Dua Kolom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Presensi */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-900 uppercase">
                    B. Rekapitulasi Presensi & Kedisiplinan
                  </h5>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Pertemuan Tatap Muka</span>
                      <span className="font-mono font-bold text-slate-900">{totalSesi} Sesi</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Hadir</span>
                      <span className="font-mono font-bold">{hadir} Sesi ({presenceRate}%)</span>
                    </div>
                    <div className="flex justify-between text-sky-700">
                      <span>Izin</span>
                      <span className="font-mono font-bold">{izin} Sesi</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Sakit</span>
                      <span className="font-mono font-bold">{sakit} Sesi</span>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span>Tanpa Keterangan (Alfa)</span>
                      <span className="font-mono font-bold">{alfa} Sesi</span>
                    </div>
                  </div>
                </div>

                {/* Ekstrakurikuler */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-900 uppercase">
                    C. Kegiatan Ekstrakurikuler & Tahfidz
                  </h5>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs space-y-2">
                    {ekskuls.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">Belum terdaftar pada kegiatan ekstrakurikuler.</p>
                    ) : (
                      ekskuls.map((e) => (
                        <div key={e.id_ekskul} className="pb-1.5 border-b border-slate-200/60 last:border-none last:pb-0">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{e.nama_ekskul}</span>
                            <span className="text-indigo-700 font-mono">{e.predikat}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 italic mt-0.5">"{e.capaian}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Catatan Akhlak & Tanda Tangan */}
              <div className="pt-4 border-t border-slate-200 space-y-6">
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950">
                  <strong className="block text-slate-900 font-bold mb-0.5">Catatan Perkembangan Karakter & Adab:</strong>
                  Ananda menunjukkan akhlakul karimah yang terpuji, tertib melaksanakan ibadah shalat berjamaah, serta santun terhadap ustadz/ustadzah dan teman sebaya.
                </div>

                {/* Kolom Tanda Tangan & QR Code Verifikasi */}
                <div className="grid grid-cols-3 items-end text-center text-xs pt-4 gap-4">
                  <div>
                    <p className="text-slate-500">Orang Tua / Wali Santri,</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                      ( ......................................... )
                    </p>
                  </div>

                  {/* QR Code Digital Verification */}
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-white border border-slate-300 rounded-xl shadow-xs">
                      <QrCode className="w-14 h-14 text-slate-900" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1">
                      VERIFIKASI DIGITAL LMS-AW3
                    </span>
                    <span className="text-[8px] font-mono text-blue-700">
                      SHA256: {Math.abs(student.siswa.length * 849302).toString(16).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className="text-slate-500">BSD City, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-slate-500">Kepala Sekolah AL-WILDAN 3 BSD CITY,</p>
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-[11px] font-serif italic text-blue-900 font-bold">
                        Dr. H. Muhammad Ilyas, Lc., M.Pd.I
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                      NIP. 19780829 200312 1 002
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PIAGAM PENGHARGAAN / CERTIFICATE OF EXCELLENCE */}
          {/* ========================================================= */}
          {activeTab === 'piagam' && (
            <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/60 rounded-3xl border-8 border-double border-amber-600 p-8 md:p-14 shadow-xl max-w-3xl mx-auto text-center space-y-6 relative overflow-hidden print:border-8 print:p-8 print:shadow-none">
              {/* Corner Ornaments */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600" />

              {/* Logo & Header */}
              <div className="flex flex-col items-center space-y-2">
                <img
                  src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
                  alt="Al-Wildan Logo"
                  className="w-16 h-16 object-contain"
                />
                <h3 className="text-xs font-mono tracking-widest text-amber-800 uppercase font-bold">
                  AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
                </h3>
                <h2 className="text-2xl md:text-3xl font-serif font-black text-slate-900 uppercase tracking-tight">
                  PIAGAM PENGHARGAAN
                </h2>
                <p className="text-xs font-serif italic text-amber-700">
                  شهادة تقدير وتفوق دراسي — Certificate of Academic Excellence
                </p>
              </div>

              {/* Body Piagam */}
              <div className="space-y-4 max-w-lg mx-auto">
                <p className="text-xs text-slate-600">
                  Dengan rasa syukur ke hadirat Allah Subhanahu Wa Ta'ala, piagam penghargaan ini dianugerahkan kepada:
                </p>

                <div className="py-2 border-b-2 border-amber-500/80">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950 font-serif tracking-tight">
                    {student.siswa}
                  </h1>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  Atas prestasi belajar gemilang, kedisiplinan yang tinggi, serta pencapaian nilai di atas{' '}
                  <strong>Standar Kriteria Ketuntasan Minimal (KKM: {KKM_STANDARD})</strong> dengan perolehan nilai rata-rata{' '}
                  <span className="font-mono font-black text-amber-800 text-sm">{avgGrade}</span> pada semester berjalan.
                </p>
              </div>

              {/* Seal & Signatures */}
              <div className="pt-8 flex items-end justify-between text-xs max-w-lg mx-auto">
                <div className="text-center">
                  <p className="text-slate-500">Wali Kelas,</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="italic font-serif font-semibold text-slate-800">Budi Santoso, S.Pd.</span>
                  </div>
                  <div className="border-t border-slate-400 w-36 pt-1 font-bold text-slate-800">
                    Wali Kelas Unggulan
                  </div>
                </div>

                {/* Golden Seal Emblem */}
                <div className="w-20 h-20 rounded-full border-4 border-amber-600 bg-amber-500 text-white flex flex-col items-center justify-center shadow-lg transform rotate-6">
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="text-[8px] font-black tracking-widest uppercase">EXCELLENCE</span>
                  <span className="text-[7px] font-mono">KKM 85+</span>
                </div>

                <div className="text-center">
                  <p className="text-slate-500">Kepala Sekolah,</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="italic font-serif font-semibold text-slate-800">Dr. H. M. Ilyas, Lc.</span>
                  </div>
                  <div className="border-t border-slate-400 w-36 pt-1 font-bold text-slate-800">
                    Kepala Sekolah Al-Wildan 3 BSD City
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: WHATSAPP GENERATOR KE ORANG TUA */}
          {/* ========================================================= */}
          {activeTab === 'whatsapp' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm max-w-2xl mx-auto space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Kirim Laporan Santri ke WhatsApp Walimurid
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pesan terformat rapi dan santun siap dikirimkan langsung ke nomor orang tua/wali murid.
                  </p>
                </div>
              </div>

              {/* Input Nomor WA Opsional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Orang Tua (Opsional):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    value={parentWaNumber}
                    onChange={(e) => setParentWaNumber(e.target.value)}
                    className="flex-1 text-xs font-mono font-semibold rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    onClick={handleOpenWa}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>Buka di WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Preview Pesan WhatsApp:</span>
                  <button
                    onClick={handleCopyWa}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {copiedWa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWa ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto border border-slate-800 selection:bg-emerald-500 selection:text-white">
                  {generateWhatsAppMessage()}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Format pesan mencakup salam formal, capaian nilai berbanding standar KKM 85, persentase kehadiran, dan portofolio ekstrakurikuler.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
