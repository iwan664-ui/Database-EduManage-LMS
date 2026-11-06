import React from 'react';
import { ActiveUser, DatabaseState, MasterKelas } from '../../types';
import { BookOpen, Users, Calendar, Clock, PlusCircle, BarChart3, History, ArrowRight, MapPin } from 'lucide-react';

interface TutorDashboardProps {
  user: ActiveUser;
  database: DatabaseState;
  onSelectClassForInput: (kelasId: string) => void;
  onNavigateTab: (tab: 'input' | 'crud' | 'rekap') => void;
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

  // Jika nama guru di master_kelas sedikit beda atau tutor kustom, fallback ke semua kelas jika kosong
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
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-5 md:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AL-WILDAN 29 KOTA DEPOK · Portal Guru & Pengajar
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Selamat Datang, {user.name}
          </h2>
          <p className="text-xs md:text-sm text-blue-100 mt-1 leading-relaxed">
            Kelola kehadiran dan penilaian siswa kelas Anda dengan cepat dan terintegrasi otomatis ke Google Sheets.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-5">
            <button
              onClick={() => onNavigateTab('input')}
              className="py-2.5 px-4 rounded-xl bg-white text-blue-800 text-xs font-bold shadow hover:bg-blue-50 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              Input Presensi & Nilai
            </button>
            <button
              onClick={() => onNavigateTab('rekap')}
              className="py-2.5 px-4 rounded-xl bg-blue-600/60 hover:bg-blue-600/80 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              Rekapitulasi Kelas
            </button>
            <button
              onClick={() => onNavigateTab('crud')}
              className="py-2.5 px-4 rounded-xl bg-blue-600/60 hover:bg-blue-600/80 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              Kelola Riwayat Input
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Kelas Diampu</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{displayClasses.length}</div>
          <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Aktif semester ini
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Siswa</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalSiswaTutor}</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Terdaftar di kelas Anda
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Log Presensi</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalInputAbsensi}</div>
          <div className="text-[11px] text-purple-600 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Total catatan kehadiran
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Log Nilai</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalInputNilai}</div>
          <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Tugas & evaluasi tersimpan
          </div>
        </div>
      </div>

      {/* Daftar Kelas yang Diampu */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Daftar Kelas yang Diampu</h3>
            <p className="text-xs text-slate-500">Pilih kelas untuk mulai mencatat absensi dan memberikan penilaian.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {displayClasses.length} Kelas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayClasses.map((kelas) => {
            const countSiswa = database.siswa_kelas.filter((s) => s.id_kelas === kelas.id_kelas).length;
            return (
              <div
                key={kelas.id_kelas}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {kelas.id_kelas}
                    </span>
                    <span className="text-[11px] text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {kelas.cabang}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {kelas.kelas}
                  </h4>
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">{kelas.mapel}</p>

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
                    className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
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
