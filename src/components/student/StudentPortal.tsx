import React, { useState, useMemo } from 'react';
import { ActiveUser, DatabaseState, KehadiranStatus } from '../../types';
import {
  User,
  Calendar,
  CheckCircle2,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  Percent,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface StudentPortalProps {
  currentUser: ActiveUser;
  database: DatabaseState;
  onSelectOtherStudent?: (studentName: string) => void;
}

export function StudentPortal({ currentUser, database, onSelectOtherStudent }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<'harian' | 'bulanan'>('harian');
  const [selectedStudentName, setSelectedStudentName] = useState<string>(currentUser.name);

  // Cari detail siswa di master_siswa
  const studentInfo = useMemo(() => {
    return database.master_siswa.find((s) => s.siswa === selectedStudentName) || {
      siswa: selectedStudentName,
      cabang: 'Pusat',
      email_siswa: currentUser.email || 'siswa@sekolah.sch.id',
    };
  }, [database.master_siswa, selectedStudentName]);

  // Cari kelas-kelas yang diikuti siswa
  const enrolledClasses = useMemo(() => {
    return database.siswa_kelas.filter((sk) => sk.siswa === selectedStudentName);
  }, [database.siswa_kelas, selectedStudentName]);

  // Log Absensi siswa
  const studentAbsensi = useMemo(() => {
    return database.log_absensi
      .filter((la) => la.siswa === selectedStudentName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [database.log_absensi, selectedStudentName]);

  // Log Nilai siswa
  const studentNilai = useMemo(() => {
    return database.log_nilai
      .filter((ln) => ln.siswa === selectedStudentName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [database.log_nilai, selectedStudentName]);

  // Metrik Bulanan Kehadiran
  const attendanceStats = useMemo(() => {
    const total = studentAbsensi.length;
    const hadir = studentAbsensi.filter((a) => a.status_kehadiran === 'Hadir').length;
    const izin = studentAbsensi.filter((a) => a.status_kehadiran === 'Izin').length;
    const sakit = studentAbsensi.filter((a) => a.status_kehadiran === 'Sakit').length;
    const alfa = studentAbsensi.filter((a) => a.status_kehadiran === 'Alfa').length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, izin, sakit, alfa, rate };
  }, [studentAbsensi]);

  // Metrik Nilai
  const gradeStats = useMemo(() => {
    if (studentNilai.length === 0) return { avg: 0, highest: 0, lowest: 0, passCount: 0 };
    const numbers = studentNilai.map((n) => Number(n.nilai));
    const avg = Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) / 10;
    const highest = Math.max(...numbers);
    const lowest = Math.min(...numbers);
    const passCount = numbers.filter((n) => n >= 75).length;
    return { avg, highest, lowest, passCount };
  }, [studentNilai]);

  const getStatusBadge = (status: KehadiranStatus) => {
    switch (status) {
      case 'Hadir':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Hadir</span>;
      case 'Izin':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">Izin</span>;
      case 'Sakit':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Sakit</span>;
      case 'Alfa':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Alfa</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Profile & Switcher Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-sm">
              {studentInfo.siswa.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{studentInfo.siswa}</h2>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                  Portal Siswa & Walmur
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AL-WILDAN 29 KOTA DEPOK · {studentInfo.email_siswa} · {studentInfo.cabang}
              </p>
            </div>
          </div>

          {/* Switcher Siswa */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Ganti Siswa:</span>
            <select
              value={selectedStudentName}
              onChange={(e) => {
                setSelectedStudentName(e.target.value);
                if (onSelectOtherStudent) onSelectOtherStudent(e.target.value);
              }}
              className="text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {database.master_siswa.map((s) => (
                <option key={s.email_siswa + s.siswa} value={s.siswa}>
                  {s.siswa} ({s.cabang})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs: Report Harian vs Report Bulanan */}
        <div className="flex border-t border-slate-100 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('harian')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'harian'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Report Harian (Aktivitas Terbaru)
          </button>
          <button
            onClick={() => setActiveTab('bulanan')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'bulanan'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Report Bulanan & Rapor Nilai
          </button>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Tingkat Presensi</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{attendanceStats.rate}%</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {attendanceStats.hadir} Hadir dari {attendanceStats.total} Sesi
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Rata-rata Nilai</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {gradeStats.avg > 0 ? gradeStats.avg : '-'}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            KKM Standar: 75
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Ketuntasan Tugas</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {gradeStats.passCount} / {studentNilai.length}
          </div>
          <div className="text-[11px] text-purple-600 mt-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {studentNilai.length > 0
              ? Math.round((gradeStats.passCount / studentNilai.length) * 100)
              : 0}
            % Sesuai KKM
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Kelas Terdaftar</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{enrolledClasses.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Mata pelajaran aktif
          </div>
        </div>
      </div>

      {/* TAB 1: REPORT HARIAN */}
      {activeTab === 'harian' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Riwayat Presensi Terbaru */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Catatan Presensi Harian
              </h3>
              <span className="text-xs text-slate-400">{studentAbsensi.length} Catatan</span>
            </div>

            {studentAbsensi.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada catatan presensi.</p>
            ) : (
              <div className="space-y-2.5">
                {studentAbsensi.slice(0, 8).map((item) => (
                  <div
                    key={item.id_absensi}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-900">{item.tanggal}</div>
                      <div className="text-[11px] text-slate-500">{item.id_kelas}</div>
                    </div>
                    <div>{getStatusBadge(item.status_kehadiran)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Evaluasi & Nilai Terbaru */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Nilai & Feedback Guru Terbaru
              </h3>
              <span className="text-xs text-slate-400">{studentNilai.length} Penilaian</span>
            </div>

            {studentNilai.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada riwayat penilaian.</p>
            ) : (
              <div className="space-y-3">
                {studentNilai.slice(0, 6).map((item) => (
                  <div
                    key={item.id_nilai}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{item.jenis_penilaian}</div>
                        <div className="text-[11px] text-indigo-700 font-medium">
                          {item.mapel} · {item.tanggal}
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold text-base px-2.5 py-0.5 rounded-xl ${
                          item.nilai >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.nilai}
                      </span>
                    </div>

                    {item.catatan && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="italic leading-relaxed">"{item.catatan}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REPORT BULANAN */}
      {activeTab === 'bulanan' && (
        <div className="space-y-5">
          {/* Visual Rekap Kehadiran */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Rekapitulasi Kehadiran Akumulatif
            </h3>

            {/* Progress Bar Visual */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-semibold">
                <span>Persentase Kehadiran ({attendanceStats.rate}%)</span>
                <span>{attendanceStats.hadir} Hadir / {attendanceStats.total} Total Pertemuan</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${attendanceStats.rate}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                />
                <div
                  style={{
                    width: `${
                      attendanceStats.total > 0
                        ? (attendanceStats.izin / attendanceStats.total) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-sky-400 h-full"
                />
                <div
                  style={{
                    width: `${
                      attendanceStats.total > 0
                        ? (attendanceStats.sakit / attendanceStats.total) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-amber-400 h-full"
                />
                <div
                  style={{
                    width: `${
                      attendanceStats.total > 0
                        ? (attendanceStats.alfa / attendanceStats.total) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-rose-500 h-full"
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Hadir: {attendanceStats.hadir}
                </span>
                <span className="flex items-center gap-1.5 text-sky-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  Izin: {attendanceStats.izin}
                </span>
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Sakit: {attendanceStats.sakit}
                </span>
                <span className="flex items-center gap-1.5 text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Alfa: {attendanceStats.alfa}
                </span>
              </div>
            </div>
          </div>

          {/* Rapor Detail Nilai per Mata Pelajaran */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rapor Penilaian Mata Pelajaran</h3>
                <p className="text-xs text-slate-500">Evaluasi menyeluruh performa akademik siswa.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                    <th className="px-4 py-3 font-semibold">Tutor Pengampu</th>
                    <th className="px-4 py-3 font-semibold text-center">Jml Evaluasi</th>
                    <th className="px-4 py-3 font-semibold text-center">Rata-rata</th>
                    <th className="px-4 py-3 font-semibold text-center">Status KKM (75)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledClasses.map((item) => {
                    const classGrades = studentNilai.filter((n) => n.id_kelas === item.id_kelas);
                    const avg =
                      classGrades.length > 0
                        ? Math.round(
                            (classGrades.reduce((a, b) => a + Number(b.nilai), 0) /
                              classGrades.length) *
                              10
                          ) / 10
                        : 0;

                    return (
                      <tr key={item.id_kelas} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.mapel}</div>
                          <div className="text-[11px] text-slate-400">{item.kelas}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.guru}</td>
                        <td className="px-4 py-3 text-center font-mono">{classGrades.length} Sesi</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-sm">
                          {avg > 0 ? (
                            <span
                              className={
                                avg >= 75 ? 'text-emerald-700' : 'text-rose-700'
                              }
                            >
                              {avg}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {avg >= 75 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Tuntas
                            </span>
                          ) : avg > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Perlu Bimbingan
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Belum ada evaluasi</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
