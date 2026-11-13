import React, { useState } from 'react';
import { MasterSiswa } from '../../types';
import {
  IdCard,
  QrCode,
  Printer,
  Download,
  Sparkles,
  RotateCw,
  Building,
  GraduationCap,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { useToast } from '../Toast';

interface StudentSmartCardProps {
  student: MasterSiswa;
  enrolledClassesCount: number;
  kkmAvg: number;
}

export function StudentSmartCard({ student, enrolledClassesCount, kkmAvg }: StudentSmartCardProps) {
  const { showToast } = useToast();
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Generate deterministic NISN from student name
  const nisn = '00' + Math.abs(student.siswa.split('').reduce((acc, c) => acc + c.charCodeAt(0), 10000000)).toString().slice(0, 8);
  const studentId = 'AW3-' + nisn.slice(-4);
  const academicYear = '2026/2027';

  const handlePrint = () => {
    window.print();
    showToast('Cetak Kartu Santri', 'Jendela cetak kartu pelajar siap.', 'info');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <IdCard className="w-5 h-5" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900">
              Kartu Tanda Santri & Pelajar Digital (Smart ID)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kartu identitas resmi AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY berstandar NFC & QR Code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Balik Kartu ({isFlipped ? 'Tampak Depan' : 'Tampak Belakang'})</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kartu</span>
          </button>
        </div>
      </div>

      {/* Card Preview Container */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
        {/* The Smart Card (Front or Back) */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="cursor-pointer group relative w-full max-w-[420px] aspect-[1.586/1] rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] overflow-hidden border border-slate-300 select-none"
        >
          {!isFlipped ? (
            /* ================= FRONT SIDE ================= */
            <div className="w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white p-5 flex flex-col justify-between relative overflow-hidden">
              {/* Background Geometric Motifs (Al-Wildan Tri-Color: Blue, Orange, Green) */}
              <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />
              <div className="absolute right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
              <div className="absolute left-0 bottom-0 top-0 w-2 bg-gradient-to-b from-orange-500 via-emerald-400 to-blue-500" />

              {/* Card Header */}
              <div className="flex items-center justify-between gap-3 relative z-10 pl-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
                    alt="Logo Al-Wildan"
                    className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow-sm border border-orange-400 shrink-0"
                  />
                  <div>
                    <div className="text-[11px] font-black tracking-wider text-orange-400 uppercase leading-none">
                      AL-WILDAN ISLAMIC SCHOOL 3
                    </div>
                    <div className="text-[10px] text-emerald-300 font-semibold tracking-wide">
                      BSD CITY · TANGERANG SELATAN
                    </div>
                    <div className="text-[8px] text-blue-200 tracking-tight">
                      International Islamic Education
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20 text-white">
                    TP {academicYear}
                  </span>
                </div>
              </div>

              {/* Card Middle: Student Profile */}
              <div className="flex items-center gap-4 my-auto relative z-10 pl-2">
                {/* Photo Avatar with Tri-color border */}
                <div className="relative shrink-0">
                  <div className="w-18 h-22 rounded-xl bg-gradient-to-b from-orange-400 to-emerald-500 p-0.5 shadow-md">
                    <div className="w-full h-full rounded-[10px] bg-slate-900 flex flex-col items-center justify-center text-white overflow-hidden">
                      <GraduationCap className="w-8 h-8 text-orange-400 mb-1" />
                      <span className="text-[9px] font-black uppercase text-emerald-300">SANTRI</span>
                    </div>
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Identity Text */}
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white tracking-tight leading-tight uppercase">
                    {student.siswa}
                  </h4>
                  <div className="text-[11px] font-mono text-orange-300 font-bold">
                    NISN: {nisn}
                  </div>
                  <div className="text-[10px] text-blue-100 flex items-center gap-1 font-medium">
                    <Building className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{student.cabang}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      Aktif ({enrolledClassesCount} Kelas)
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-300 border border-orange-400/30">
                      Rata: {kkmAvg} (KKM 85)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Barcode & Security Chip */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-blue-200 pl-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-white tracking-widest">
                    ||| | |||| | ||| |||| |
                  </span>
                  <span className="text-[9px] text-emerald-300 font-mono font-bold">{studentId}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-orange-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>KARTU RESMI SANTRI</span>
                </div>
              </div>
            </div>
          ) : (
            /* ================= BACK SIDE ================= */
            <div className="w-full h-full bg-white text-slate-800 p-5 flex flex-col justify-between border-2 border-blue-600 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-orange-500 to-emerald-600" />

              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                    Ketentuan & Tata Tertib Santri
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-500">AL-WILDAN 3 BSD CITY</span>
                </div>

                <ol className="text-[9px] text-slate-600 space-y-1 list-decimal list-inside leading-tight font-medium">
                  <li>Kartu ini adalah identitas resmi santri AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY.</li>
                  <li>Wajib dibawa saat KBM, halaqah Tahfidz, dan kegiatan asrama/kampus.</li>
                  <li>Wajib menjaga akhlaqul karimah, adab thalabul ilmi, dan shalat 5 waktu.</li>
                  <li>Jika menemukan kartu ini, mohon kembalikan ke Bagian Kesiswaan Al-Wildan 3 BSD City.</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold text-slate-900">Kampus Utama BSD City</div>
                  <div className="text-[8px] text-slate-500">BSD City, Tangerang Selatan, Banten</div>
                  <div className="text-[8px] text-blue-600 font-bold mt-0.5">www.alwildan3bsd.sch.id</div>
                </div>

                {/* QR Code Verification */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded-lg p-1 flex items-center justify-center">
                    <QrCode className="w-9 h-9 text-slate-900" />
                  </div>
                  <span className="text-[7px] text-slate-400 font-mono mt-0.5">SCAN VERIFIKASI</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Metadata & Explanations */}
        <div className="space-y-4 max-w-sm text-xs">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Smart Digital Student Card</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Kartu ini terhubung langsung dengan sistem absensi digital dan verifikasi e-rapor. Klik pada kartu untuk melihat tampak depan dan belakang.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Nomor Induk Santri</span>
              <span className="font-bold font-mono text-slate-800">{studentId}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Standar Kelulusan KKM</span>
              <span className="font-bold font-mono text-emerald-700">85 (Tuntas)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
