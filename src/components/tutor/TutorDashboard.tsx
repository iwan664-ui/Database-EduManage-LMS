import React from 'react';
import { ActiveUser, DatabaseState, MasterKelas } from '../../types';
import { BookOpen, Users, Calendar, Clock, PlusCircle, BarChart3, History, ArrowRight, MapPin, ShieldCheck, Award, SendHorizontal, QrCode } from 'lucide-react';
import { TutorAttendanceChart } from './TutorAttendanceChart';

interface TutorDashboardProps {
  user: ActiveUser;
  database: DatabaseState;
  onSelectClassForInput: (kelasId: string) => void;
  onNavigateTab: (
    tab: 'input' | 'crud' | 'rekap' | 'rapor-pekanan' | 'scan-gerbang' | 'jadwal-guru' | 'konseling-guru'
  ) => void;
}

export function TutorDashboard({
  user,
  database,
  onSelectClassForInput,
  onNavigateTab,
}: TutorDashboardProps) {
  // Filter kelas yang diampu oleh tutor ini
  const tutorClasses = database.master_kelas.filter(
    (k) => k.guru.toLowerCase().trim() === user.name.toLowerCase().trim()
  );

  // Fallback ke semua kelas jika kosong
  const displayClasses = tutorClasses.length > 0 ? tutorClasses : database.master_kelas;

  // Hitung statistik
  const totalSiswaTutor = database.siswa_kelas.filter((sk) =>
    displayClasses.some((k) => k.id_kelas === sk.id_kelas)
  ).length;

  const totalInputAbsensi = database.log_absensi.filter(
    (la) => la.id_tutor === user.id_tutor || displayClasses.some((k) => k.id_kelas === la.id_kelas)
  ).length;

  const totalInputNilai = database.log_nilai.filter(
    (ln) => ln.id_tutor === user.id_tutor || displayClasses.some((k) => k.id_kelas === ln.id_kelas)
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 md:p-7 text-white border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
              <span>AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY</span>
              <span aria-hidden="true">·</span>
              <span>Portal Pendidik Terenkripsi</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> WebAuthn Protected
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Selamat Datang, {user.name}
            </h2>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Kelola presensi, nilai siswa standar KKM 85, jadwal mengajar, serta pelaporan pekanan wali murid secara terpadu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('input')}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Presensi &amp; Nilai</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('jadwal-guru')}
              className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Jadwal &amp; Kelas Saya</span>
            </button>
          </div>
        </div>
      </div>

      {/* Structured Quick Actions for Teachers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-700">Akses Cepat Menu Guru</h3>
          <span className="text-[11px] text-slate-500">Jalan pintas aktivitas mengajar harian</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            {
              tab: 'input' as const,
              title: 'Input Nilai & Absen',
              desc: 'Catat sesi KBM hari ini',
              icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
            },
            {
              tab: 'jadwal-guru' as const,
              title: 'Jadwal Mengajar',
              desc: 'Daftar kelas aktif',
              icon: <Calendar className="w-4 h-4 text-slate-700" />,
            },
            {
              tab: 'rekap' as const,
              title: 'Rekapitulasi Kelas',
              desc: 'Capaian nilai KKM 85',
              icon: <BarChart3 className="w-4 h-4 text-slate-700" />,
            },
            {
              tab: 'scan-gerbang' as const,
              title: 'Scan Hadir/Pulang',
              desc: 'Presensi gerbang QR',
              icon: <QrCode className="w-4 h-4 text-slate-700" />,
            },
            {
              tab: 'rapor-pekanan' as const,
              title: 'Rapor Pekanan',
              desc: 'Kirim ringkasan ke Ortu',
              icon: <SendHorizontal className="w-4 h-4 text-emerald-600" />,
            },
            {
              tab: 'konseling-guru' as const,
              title: 'Izin & Konseling',
              desc: 'Tindak lanjut santri',
              icon: <Award className="w-4 h-4 text-slate-700" />,
            },
          ].map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onNavigateTab(item.tab)}
              className="group text-left p-3 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-slate-300 transition-colors flex items-start gap-2.5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Kelas Aktif Diampu</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{displayClasses.length}</div>
          <div className="text-[11px] text-blue-700 mt-1 flex items-center gap-1 font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            Jadwal mengajar aktif
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Siswa Binaan</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalSiswaTutor}</div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
            <Users className="w-3.5 h-3.5" />
            Siswa terdaftar di kelas Anda
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Log Presensi Terinput</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalInputAbsensi}</div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Catatan kehadiran tersimpan
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Log Nilai Siswa</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalInputNilai}</div>
          <div className="text-[11px] text-orange-700 mt-1 flex items-center gap-1 font-semibold">
            <Award className="w-3.5 h-3.5 text-orange-500" />
            Standar KKM 85
          </div>
        </div>
      </div>

      {/* Visualisasi Tren Persentase Kehadiran (Recharts) */}
      <TutorAttendanceChart
        classes={displayClasses}
        logs={database.log_absensi}
        onSelectClass={(kelasId) => {
          onSelectClassForInput(kelasId);
          onNavigateTab('input');
        }}
      />

      {/* Daftar Kelas yang Diampu */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Daftar Kelas yang Diampu</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih kelas untuk langsung membuka formulir presensi dan input nilai standar KKM 85.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            {displayClasses.length} Kelas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayClasses.map((kelas) => {
            const countSiswa = database.siswa_kelas.filter((s) => s.id_kelas === kelas.id_kelas).length;
            return (
              <div
                key={kelas.id_kelas}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {kelas.id_kelas}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {kelas.cabang}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {kelas.kelas}
                  </h4>
                  <p className="text-xs font-bold text-blue-600 mt-0.5">{kelas.mapel}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{kelas.hari}</span>
                      <span className="text-slate-300">·</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{kelas.waktu}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{countSiswa} Siswa terdaftar</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onSelectClassForInput(kelas.id_kelas);
                      onNavigateTab('input');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Input Absensi & Nilai</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
