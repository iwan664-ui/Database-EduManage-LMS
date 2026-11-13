import React from 'react';
import { ActiveUser, DatabaseState, MasterKelas } from '../../types';
import { BookOpen, Users, Calendar, Clock, PlusCircle, BarChart3, History, ArrowRight, MapPin, ShieldCheck, Award, SendHorizontal, QrCode } from 'lucide-react';
import { TutorAttendanceChart } from './TutorAttendanceChart';

interface TutorDashboardProps {
  user: ActiveUser;
  database: DatabaseState;
  onSelectClassForInput: (kelasId: string) => void;
  onNavigateTab: (tab: 'input' | 'crud' | 'rekap' | 'rapor-pekanan' | 'scan-gerbang') => void;
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
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
            <span>AL-WILDAN 29 KOTA DEPOK</span>
            <span aria-hidden="true">·</span>
            <span>Portal Pendidik Terenkripsi</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> WebAuthn Protected
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Selamat Datang, {user.name}
          </h2>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Kelola kehadiran dan pengisian nilai siswa per kelas secara simultan. Terintegrasi langsung dengan database Google Sheets sekolah dengan perlindungan data tingkat tinggi dan standar kelulusan KKM 85.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-3">
            <button
              onClick={() => onNavigateTab('input')}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Presensi & Nilai</span>
            </button>
            <button
              onClick={() => onNavigateTab('rekap')}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Rekapitulasi Kelas</span>
            </button>
            <button
              onClick={() => onNavigateTab('scan-gerbang')}
              className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Hadir & Pulang</span>
            </button>
            <button
              onClick={() => onNavigateTab('rapor-pekanan')}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Kirim Rapor Pekanan Ortu</span>
            </button>
            <button
              onClick={() => onNavigateTab('crud')}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span>Riwayat Input</span>
            </button>
          </div>
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
