import React, { useState, useMemo } from 'react';
import { DatabaseState, KehadiranStatus, MasterKelas } from '../../types';
import { Filter, Users, Award, Percent, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface TutorRecapViewProps {
  database: DatabaseState;
  tutorName?: string;
}

export function TutorRecapView({ database, tutorName }: TutorRecapViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Unique Subjects
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    database.master_kelas.forEach((k) => set.add(k.mapel));
    return Array.from(set);
  }, [database.master_kelas]);

  // Filtered Classes
  const availableClasses = useMemo(() => {
    return database.master_kelas.filter((k) => {
      const matchSubject = selectedSubject === 'all' || k.mapel === selectedSubject;
      return matchSubject;
    });
  }, [database.master_kelas, selectedSubject]);

  // Compute student summary
  const studentRecap = useMemo(() => {
    // Kumpulkan daftar siswa yang relevan
    let relevantStudents = database.siswa_kelas;
    if (selectedClassId !== 'all') {
      relevantStudents = relevantStudents.filter((sk) => sk.id_kelas === selectedClassId);
    }
    if (selectedSubject !== 'all') {
      relevantStudents = relevantStudents.filter((sk) => sk.mapel === selectedSubject);
    }

    const studentMap = new Map<
      string,
      {
        siswa: string;
        cabang: string;
        kelas: string;
        mapel: string;
        hadir: number;
        izin: number;
        sakit: number;
        alfa: number;
        totalPresensi: number;
        grades: number[];
      }
    >();

    relevantStudents.forEach((sk) => {
      if (!studentMap.has(sk.siswa)) {
        studentMap.set(sk.siswa, {
          siswa: sk.siswa,
          cabang: sk.cabang,
          kelas: sk.kelas,
          mapel: sk.mapel,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alfa: 0,
          totalPresensi: 0,
          grades: [],
        });
      }
    });

    // Hitung absensi
    database.log_absensi.forEach((la) => {
      if (selectedClassId !== 'all' && la.id_kelas !== selectedClassId) return;
      if (studentMap.has(la.siswa)) {
        const item = studentMap.get(la.siswa)!;
        item.totalPresensi += 1;
        if (la.status_kehadiran === 'Hadir') item.hadir += 1;
        else if (la.status_kehadiran === 'Izin') item.izin += 1;
        else if (la.status_kehadiran === 'Sakit') item.sakit += 1;
        else if (la.status_kehadiran === 'Alfa') item.alfa += 1;
      }
    });

    // Hitung nilai
    database.log_nilai.forEach((ln) => {
      if (selectedClassId !== 'all' && ln.id_kelas !== selectedClassId) return;
      if (selectedSubject !== 'all' && ln.mapel !== selectedSubject) return;
      if (studentMap.has(ln.siswa)) {
        const item = studentMap.get(ln.siswa)!;
        item.grades.push(Number(ln.nilai));
      }
    });

    return Array.from(studentMap.values()).map((s) => {
      const avg =
        s.grades.length > 0
          ? Math.round((s.grades.reduce((a, b) => a + b, 0) / s.grades.length) * 10) / 10
          : 0;
      const presenceRate =
        s.totalPresensi > 0 ? Math.round((s.hadir / s.totalPresensi) * 100) : 0;
      return {
        ...s,
        avgGrade: avg,
        presenceRate,
      };
    });
  }, [database, selectedClassId, selectedSubject]);

  // Overall aggregates
  const totalStudents = studentRecap.length;
  const overallPresence =
    totalStudents > 0
      ? Math.round(studentRecap.reduce((acc, s) => acc + s.presenceRate, 0) / totalStudents)
      : 0;
  const gradedStudents = studentRecap.filter((s) => s.grades.length > 0);
  const overallAvgGrade =
    gradedStudents.length > 0
      ? Math.round((gradedStudents.reduce((acc, s) => acc + s.avgGrade, 0) / gradedStudents.length) * 10) / 10
      : 0;
  const tuntasCount = gradedStudents.filter((s) => s.avgGrade >= 85).length;

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Rekapitulasi Presensi & Nilai Siswa</h2>
          <p className="text-xs text-slate-500">
            Analisis akumulatif kehadiran siswa dan rata-rata pencapaian nilai per kelas dan mata pelajaran.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Filter Mata Pelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Filter Mata Pelajaran</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedClassId('all');
              }}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Mata Pelajaran ({allSubjects.length})</option>
              {allSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Filter Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Kelas ({availableClasses.length})</option>
              {availableClasses.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  {k.kelas} ({k.mapel})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Siswa Terfilter</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalStudents}</div>
          <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Siswa aktif
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Rata-rata Kehadiran</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{overallPresence}%</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" />
            Tingkat presensi
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Rata-rata Nilai</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{overallAvgGrade}</div>
          <div className="text-[11px] text-indigo-700 mt-1 flex items-center gap-1 font-bold">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            KKM Standar: 85
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Tuntas KKM (≥ 85)</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {tuntasCount} / {gradedStudents.length}
          </div>
          <div className="text-[11px] text-purple-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {gradedStudents.length > 0 ? Math.round((tuntasCount / gradedStudents.length) * 100) : 0}% ketuntasan
          </div>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {studentRecap.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Tidak ada siswa ditemukan untuk kriteria filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                  <th className="px-4 py-3 font-semibold">Kelas & Cabang</th>
                  <th className="px-4 py-3 font-semibold text-center">Hadir</th>
                  <th className="px-4 py-3 font-semibold text-center">Izin</th>
                  <th className="px-4 py-3 font-semibold text-center">Sakit</th>
                  <th className="px-4 py-3 font-semibold text-center">Alfa</th>
                  <th className="px-4 py-3 font-semibold text-center">% Presensi</th>
                  <th className="px-4 py-3 font-semibold text-center">Rata-rata Nilai</th>
                  <th className="px-4 py-3 font-semibold text-center">Status KKM (85)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentRecap.map((s) => (
                  <tr key={s.siswa} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{s.siswa}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{s.kelas}</div>
                      <div className="text-[11px] text-slate-400">{s.cabang}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-emerald-700">{s.hadir}</td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-sky-700">{s.izin}</td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-amber-700">{s.sakit}</td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-rose-700">{s.alfa}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-slate-800">{s.presenceRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg ${
                          s.avgGrade >= 85
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.avgGrade > 0
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {s.avgGrade > 0 ? s.avgGrade : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.avgGrade >= 85 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Tuntas
                        </span>
                      ) : s.avgGrade > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Remedial
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Belum ada nilai</span>
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
