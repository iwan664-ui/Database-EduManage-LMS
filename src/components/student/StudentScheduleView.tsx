import React, { useState } from 'react';
import { DatabaseState, SiswaKelas } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface StudentScheduleViewProps {
  studentName: string;
  database: DatabaseState;
}

export function StudentScheduleView({ studentName, database }: StudentScheduleViewProps) {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Current day in Indonesian
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const currentDayName = days[dayIndex === 0 ? 0 : dayIndex - 1] || 'Senin';

  const [selectedDay, setSelectedDay] = useState<string>(currentDayName);

  // Filter classes for this student
  const studentClasses = database.siswa_kelas.filter((sk) => sk.siswa === studentName);

  // Group by day
  const classesForDay = studentClasses.filter((sk) => sk.hari.toLowerCase() === selectedDay.toLowerCase());

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900">
              Jadwal Pelajaran & Halaqah KBM Terpadu
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Agenda Kegiatan Belajar Mengajar (KBM) santri AL-WILDAN 29 KOTA DEPOK.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hari Ini: {currentDayName}</span>
        </div>
      </div>

      {/* Day Selector Tabs (Styled with Al-Wildan colors: Blue, Orange, Green) */}
      <div className="flex flex-wrap items-center gap-2">
        {days.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = currentDayName === day;
          const count = studentClasses.filter((sk) => sk.hari.toLowerCase() === day.toLowerCase()).length;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{day}</span>
              {isToday && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
                }`}>
                  Kini
                </span>
              )}
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Class Schedule Cards for Selected Day */}
      <div className="space-y-4">
        {classesForDay.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-600">Tidak ada jadwal KBM formal di hari {selectedDay}.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Waktu dapat digunakan untuk muraja'ah mandiri dan kegiatan kepesantrenan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classesForDay.map((item, idx) => (
              <div
                key={item.id_kelas + idx}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                {/* Accent top border strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-orange-500 to-emerald-500" />

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      {item.id_kelas}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 mt-1.5 leading-snug">
                      {item.mapel}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">{item.kelas}</p>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1 font-mono shrink-0">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    {item.waktu}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.guru}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span className="truncate max-w-[150px]">{item.cabang}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Kriteria Kelulusan Minimal:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    KKM 85
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
