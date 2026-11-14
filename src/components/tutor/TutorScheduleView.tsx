import React, { useMemo, useState } from 'react';
import { ActiveUser, DatabaseState } from '../../types';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TutorScheduleViewProps {
  user: ActiveUser;
  database: DatabaseState;
  onSelectClassForInput: (kelasId: string) => void;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function TutorScheduleView({
  user,
  database,
  onSelectClassForInput,
}: TutorScheduleViewProps) {
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [expandedRosterId, setExpandedRosterId] = useState<string | null>(null);

  const myClasses = useMemo(() => {
    const matched = database.master_kelas.filter(
      (k) => k.guru.toLowerCase().trim() === user.name.toLowerCase().trim()
    );
    return matched.length > 0 ? matched : database.master_kelas;
  }, [database.master_kelas, user.name]);

  const filteredClasses = useMemo(() => {
    if (selectedDay === 'all') return myClasses;
    return myClasses.filter((c) => c.hari.toLowerCase() === selectedDay.toLowerCase());
  }, [myClasses, selectedDay]);

  const uniqueStudentsCount = useMemo(() => {
    const set = new Set<string>();
    database.siswa_kelas
      .filter((sk) => myClasses.some((c) => c.id_kelas === sk.id_kelas))
      .forEach((sk) => set.add(sk.siswa));
    return set.size;
  }, [database.siswa_kelas, myClasses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Jadwal Resmi Bidang Kurikulum · {user.name}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Jadwal Mengajar & Daftar Kelas Diampu
          </h2>
          <p className="text-xs text-slate-500">
            Jadwal dan penempatan kelas disinkronkan langsung oleh Koordinator Kurikulum. Klik kelas untuk langsung mengisi presensi & nilai.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono tabular-nums text-xs shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-[10px] font-sans font-semibold text-blue-700">Kelas Diampu</div>
            <div className="text-lg font-black text-blue-950">{myClasses.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] font-sans font-semibold text-emerald-700">Santri Binaan</div>
            <div className="text-lg font-black text-emerald-950">{uniqueStudentsCount}</div>
          </div>
        </div>
      </div>

      {/* Day Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedDay('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
            selectedDay === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Hari ({myClasses.length})
        </button>
        {DAYS.map((day) => {
          const count = myClasses.filter((c) => c.hari.toLowerCase() === day.toLowerCase()).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                selectedDay === day
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {day} ({count})
            </button>
          );
        })}
      </div>

      {/* Class Schedule Cards */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Tidak ada jadwal mengajar pada hari {selectedDay}.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Jadwal baru akan muncul otomatis setelah ditambahkan oleh Koordinator Kurikulum.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.map((cls) => {
            const roster = database.siswa_kelas.filter((sk) => sk.id_kelas === cls.id_kelas);
            const isExpanded = expandedRosterId === cls.id_kelas;

            return (
              <div
                key={cls.id_kelas}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-blue-700">
                        {cls.id_kelas} · {cls.hari}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{cls.kelas}</h3>
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        {cls.mapel}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg tabular-nums shrink-0 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {cls.waktu}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {cls.cabang}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      {roster.length} Santri
                    </span>
                  </div>

                  {/* Expandable Student Roster */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedRosterId(isExpanded ? null : cls.id_kelas)}
                      className="text-[11px] font-bold text-slate-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{isExpanded ? 'Sembunyikan Daftar Santri' : `Lihat Daftar Santri (${roster.length})`}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-44 overflow-y-auto space-y-1.5">
                        {roster.length === 0 ? (
                          <p className="text-[11px] text-slate-400">Belum ada santri ditempatkan di kelas ini.</p>
                        ) : (
                          roster.map((s, idx) => (
                            <div key={s.siswa} className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-800">
                                {idx + 1}. {s.siswa}
                              </span>
                              <span className="font-mono text-slate-400">{s.email_siswa}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectClassForInput(cls.id_kelas)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Input Presensi & Nilai Kelas Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
