import React, { useMemo, useState } from 'react';
import { MasterKelas, SiswaKelas } from '../../types';
import {
  AlertTriangle,
  ArrowLeftRight,
  Clock,
  Edit3,
  GripVertical,
  Plus,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';

interface ScheduleDragDropBoardProps {
  classes: MasterKelas[];
  allClasses: MasterKelas[];
  enrollments: SiswaKelas[];
  daysOfWeek: string[];
  onMoveSchedule: (idKelas: string, newHari: string, newWaktu: string) => void;
  onSwapSchedule: (idKelasA: string, idKelasB: string) => void;
  onEditClass: (item: MasterKelas) => void;
  onPrefillSlot: (hari: string, waktu: string) => void;
}

const DEFAULT_TIME_SLOTS = [
  '07:30 - 09:00',
  '09:15 - 10:45',
  '11:00 - 12:30',
  '13:30 - 15:00',
  '15:30 - 17:00',
  '16:00 - 17:30',
  '17:45 - 19:15',
];

function parseSlotRange(timeStr: string): [number, number] | null {
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  return [
    parseInt(match[1], 10) * 60 + parseInt(match[2], 10),
    parseInt(match[3], 10) * 60 + parseInt(match[4], 10),
  ];
}

function normalizeTime(timeStr: string): string {
  return timeStr.replace(/\s+/g, ' ').replace(/\s*-\s*/, ' - ').trim();
}

function timesOverlap(slotA: string, slotB: string): boolean {
  const normA = normalizeTime(slotA);
  const normB = normalizeTime(slotB);
  if (normA === normB) return true;
  const rA = parseSlotRange(normA);
  const rB = parseSlotRange(normB);
  if (rA && rB) {
    return rA[0] < rB[1] && rB[0] < rA[1];
  }
  return false;
}

interface PendingConflictMove {
  dragged: MasterKelas;
  targetDay: string;
  targetSlot: string;
  teacherConflict?: MasterKelas;
  classGroupConflict?: MasterKelas;
}

interface MoveHistoryEntry {
  idKelas: string;
  label: string;
  prevHari: string;
  prevWaktu: string;
}

export function ScheduleDragDropBoard({
  classes,
  allClasses,
  enrollments,
  daysOfWeek,
  onMoveSchedule,
  onSwapSchedule,
  onEditClass,
  onPrefillSlot,
}: ScheduleDragDropBoardProps) {
  const [customSlots, setCustomSlots] = useState<string[]>([]);
  const [newSlotInput, setNewSlotInput] = useState<string>('');
  const [showAddSlot, setShowAddSlot] = useState<boolean>(false);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ day: string; slot: string } | null>(null);
  const [pendingConflict, setPendingConflict] = useState<PendingConflictMove | null>(null);
  const [undoStack, setUndoStack] = useState<MoveHistoryEntry[]>([]);
  const [quickMoveTarget, setQuickMoveTarget] = useState<MasterKelas | null>(null);

  const timeSlots = useMemo(() => {
    const slotSet = new Set<string>(DEFAULT_TIME_SLOTS);
    allClasses.forEach((k) => {
      if (k.waktu?.trim()) slotSet.add(normalizeTime(k.waktu));
    });
    customSlots.forEach((s) => {
      if (s.trim()) slotSet.add(normalizeTime(s));
    });
    return Array.from(slotSet).sort((a, b) => {
      const rA = parseSlotRange(a);
      const rB = parseSlotRange(b);
      if (rA && rB) return rA[0] - rB[0];
      return a.localeCompare(b);
    });
  }, [allClasses, customSlots]);

  const draggedClass = useMemo(
    () => allClasses.find((k) => k.id_kelas === draggedId) || null,
    [allClasses, draggedId]
  );

  const findConflictsForPlacement = (
    item: MasterKelas,
    targetDay: string,
    targetSlot: string
  ): { teacherConflict?: MasterKelas; classGroupConflict?: MasterKelas } => {
    const sameDayOthers = allClasses.filter(
      (k) =>
        k.id_kelas !== item.id_kelas &&
        k.hari.toLowerCase().trim() === targetDay.toLowerCase().trim() &&
        timesOverlap(k.waktu, targetSlot)
    );

    const teacherConflict = sameDayOthers.find(
      (k) => k.guru.toLowerCase().trim() === item.guru.toLowerCase().trim()
    );
    const classGroupConflict = sameDayOthers.find(
      (k) => k.kelas.toLowerCase().trim() === item.kelas.toLowerCase().trim()
    );

    return { teacherConflict, classGroupConflict };
  };

  const commitMove = (item: MasterKelas, targetDay: string, targetSlot: string) => {
    setUndoStack((prev) => [
      {
        idKelas: item.id_kelas,
        label: `${item.mapel} (${item.kelas})`,
        prevHari: item.hari,
        prevWaktu: item.waktu,
      },
      ...prev.slice(0, 14),
    ]);
    onMoveSchedule(item.id_kelas, targetDay, targetSlot);
  };

  const handleDropOnCell = (targetDay: string, targetSlot: string) => {
    setHoverCell(null);
    if (!draggedClass) return;

    const isSameCell =
      draggedClass.hari.toLowerCase().trim() === targetDay.toLowerCase().trim() &&
      normalizeTime(draggedClass.waktu) === normalizeTime(targetSlot);

    setDraggedId(null);
    if (isSameCell) return;

    const conflicts = findConflictsForPlacement(draggedClass, targetDay, targetSlot);
    if (conflicts.teacherConflict || conflicts.classGroupConflict) {
      setPendingConflict({
        dragged: draggedClass,
        targetDay,
        targetSlot,
        teacherConflict: conflicts.teacherConflict,
        classGroupConflict: conflicts.classGroupConflict,
      });
      return;
    }

    commitMove(draggedClass, targetDay, targetSlot);
  };

  const handleUndoLast = () => {
    const latest = undoStack[0];
    if (!latest) return;
    setUndoStack((prev) => prev.slice(1));
    onMoveSchedule(latest.idKelas, latest.prevHari, latest.prevWaktu);
  };

  const handleAddCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeTime(newSlotInput);
    if (!parseSlotRange(cleaned)) return;
    setCustomSlots((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]));
    setNewSlotInput('');
    setShowAddSlot(false);
  };

  // Detect any existing conflicts across currently rendered classes
  const existingConflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < allClasses.length; i++) {
      for (let j = i + 1; j < allClasses.length; j++) {
        const a = allClasses[i];
        const b = allClasses[j];
        if (a.hari.toLowerCase().trim() !== b.hari.toLowerCase().trim()) continue;
        if (!timesOverlap(a.waktu, b.waktu)) continue;
        const sameGuru = a.guru.toLowerCase().trim() === b.guru.toLowerCase().trim();
        const sameKelas = a.kelas.toLowerCase().trim() === b.kelas.toLowerCase().trim();
        if (sameGuru || sameKelas) {
          ids.add(a.id_kelas);
          ids.add(b.id_kelas);
        }
      }
    }
    return ids;
  }, [allClasses]);

  const unslottedClasses = useMemo(() => {
    const daySet = new Set(daysOfWeek.map((d) => d.toLowerCase()));
    return classes.filter((k) => !daySet.has(k.hari.toLowerCase().trim()));
  }, [classes, daysOfWeek]);

  return (
    <div className="space-y-4">
      {/* Toolbar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">
            Seret kartu kelas ke slot hari & jam yang diinginkan.
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span>Klik slot kosong untuk menambah kelas baru pada jam tersebut.</span>
          {existingConflictIds.size > 0 && (
            <>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {existingConflictIds.size} kelas terdeteksi bentrok jam
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {undoStack.length > 0 && (
            <button
              type="button"
              onClick={handleUndoLast}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Urungkan Pindah ({undoStack.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddSlot((s) => !s)}
            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Slot Waktu</span>
          </button>
        </div>
      </div>

      {/* Add Custom Time Slot Form */}
      {showAddSlot && (
        <form
          onSubmit={handleAddCustomSlot}
          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex-1 max-w-xs space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Slot Waktu Baru (Format HH:MM - HH:MM)
            </label>
            <input
              type="text"
              value={newSlotInput}
              onChange={(e) => setNewSlotInput(e.target.value)}
              placeholder="Contoh: 19:30 - 21:00"
              pattern="\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Tambahkan Baris Slot
            </button>
            <button
              type="button"
              onClick={() => setShowAddSlot(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Conflict Confirmation Banner when dropping onto occupied guru/kelas slot */}
      {pendingConflict && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-extrabold">
                Konfirmasi Bentrok Jadwal di {pendingConflict.targetDay}, {pendingConflict.targetSlot}
              </div>
              <div className="text-amber-900">
                Memindahkan <strong>{pendingConflict.dragged.mapel} ({pendingConflict.dragged.kelas})</strong> akan bentrok dengan{' '}
                {pendingConflict.teacherConflict ? (
                  <>
                    jadwal guru <strong>{pendingConflict.teacherConflict.guru}</strong> di kelas{' '}
                    <strong>{pendingConflict.teacherConflict.kelas}</strong> ({pendingConflict.teacherConflict.mapel})
                  </>
                ) : (
                  <>
                    kelas <strong>{pendingConflict.classGroupConflict?.kelas}</strong> pada mapel{' '}
                    <strong>{pendingConflict.classGroupConflict?.mapel}</strong>
                  </>
                )}
                .
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(pendingConflict.teacherConflict || pendingConflict.classGroupConflict) && (
              <button
                type="button"
                onClick={() => {
                  const swapWith =
                    pendingConflict.teacherConflict || pendingConflict.classGroupConflict!;
                  onSwapSchedule(pendingConflict.dragged.id_kelas, swapWith.id_kelas);
                  setPendingConflict(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Tukar Posisi Slot</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                commitMove(
                  pendingConflict.dragged,
                  pendingConflict.targetDay,
                  pendingConflict.targetSlot
                );
                setPendingConflict(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Tetap Pindahkan
            </button>
            <button
              type="button"
              onClick={() => setPendingConflict(null)}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Touch / Keyboard Quick Move Panel */}
      {quickMoveTarget && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-blue-950">
            Pilih slot tujuan pada tabel di bawah atau pilih langsung untuk memindahkan{' '}
            <strong>
              {quickMoveTarget.mapel} · {quickMoveTarget.kelas}
            </strong>{' '}
            ({quickMoveTarget.hari}, {quickMoveTarget.waktu}).
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Pilih hari tujuan"
              defaultValue={quickMoveTarget.hari}
              id="quick-move-day"
              className="px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white text-xs font-semibold"
            >
              {daysOfWeek.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              aria-label="Pilih jam tujuan"
              defaultValue={normalizeTime(quickMoveTarget.waktu)}
              id="quick-move-slot"
              className="px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white text-xs font-mono font-semibold"
            >
              {timeSlots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const dayEl = document.getElementById('quick-move-day') as HTMLSelectElement | null;
                const slotEl = document.getElementById('quick-move-slot') as HTMLSelectElement | null;
                const d = dayEl?.value || quickMoveTarget.hari;
                const s = slotEl?.value || quickMoveTarget.waktu;
                const conflicts = findConflictsForPlacement(quickMoveTarget, d, s);
                if (conflicts.teacherConflict || conflicts.classGroupConflict) {
                  setPendingConflict({
                    dragged: quickMoveTarget,
                    targetDay: d,
                    targetSlot: s,
                    ...conflicts,
                  });
                } else {
                  commitMove(quickMoveTarget, d, s);
                }
                setQuickMoveTarget(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              Pindahkan
            </button>
            <button
              type="button"
              onClick={() => setQuickMoveTarget(null)}
              className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100 cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Unslotted Classes Tray (if any day outside Senin-Sabtu) */}
      {unslottedClasses.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-700">
            Kelas di Luar Slot Hari Standar ({unslottedClasses.length}) — seret ke tabel jadwal:
          </div>
          <div className="flex flex-wrap gap-2">
            {unslottedClasses.map((cls) => (
              <div
                key={cls.id_kelas}
                draggable
                onDragStart={(e) => {
                  setDraggedId(cls.id_kelas);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', cls.id_kelas);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setHoverCell(null);
                }}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs cursor-grab active:cursor-grabbing flex items-center gap-2"
              >
                <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900">{cls.mapel}</span>
                <span className="text-slate-500">{cls.kelas}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Schedule Matrix Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full min-w-[980px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 font-extrabold text-slate-700 w-36 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">
                Slot Waktu
              </th>
              {daysOfWeek.map((day) => {
                const count = classes.filter(
                  (c) => c.hari.toLowerCase().trim() === day.toLowerCase()
                ).length;
                return (
                  <th key={day} className="p-3 font-extrabold text-slate-900 border-r last:border-r-0 border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span>{day}</span>
                      <span className="text-[11px] font-mono font-normal text-slate-500 tabular-nums">
                        {count}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {timeSlots.map((slot) => (
              <tr key={slot} className="align-top">
                <td className="p-3 font-mono font-bold text-slate-700 tabular-nums bg-slate-50/70 border-r border-slate-200 sticky left-0 z-10 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{slot}</span>
                  </div>
                </td>

                {daysOfWeek.map((day) => {
                  const cellClasses = classes.filter(
                    (k) =>
                      k.hari.toLowerCase().trim() === day.toLowerCase() &&
                      normalizeTime(k.waktu) === normalizeTime(slot)
                  );

                  const isHovered = hoverCell?.day === day && hoverCell?.slot === slot;
                  const hoverConflicts =
                    isHovered && draggedClass
                      ? findConflictsForPlacement(draggedClass, day, slot)
                      : null;
                  const hasHoverConflict = Boolean(
                    hoverConflicts?.teacherConflict || hoverConflicts?.classGroupConflict
                  );

                  return (
                    <td
                      key={`${day}_${slot}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (hoverCell?.day !== day || hoverCell?.slot !== slot) {
                          setHoverCell({ day, slot });
                        }
                      }}
                      onDragLeave={() => {
                        if (hoverCell?.day === day && hoverCell?.slot === slot) {
                          setHoverCell(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnCell(day, slot);
                      }}
                      className={`p-2 border-r last:border-r-0 border-slate-200 min-w-[165px] h-28 transition-colors ${
                        isHovered
                          ? hasHoverConflict
                            ? 'bg-amber-50/90 ring-2 ring-inset ring-amber-400'
                            : 'bg-blue-50/90 ring-2 ring-inset ring-blue-500'
                          : 'bg-white hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="space-y-2 h-full flex flex-col">
                        {cellClasses.map((cls) => {
                          const isDraggingThis = draggedId === cls.id_kelas;
                          const studentCount = enrollments.filter(
                            (sk) => sk.id_kelas === cls.id_kelas
                          ).length;
                          const isConflicted = existingConflictIds.has(cls.id_kelas);

                          return (
                            <div
                              key={cls.id_kelas}
                              draggable
                              onDragStart={(e) => {
                                setDraggedId(cls.id_kelas);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', cls.id_kelas);
                              }}
                              onDragEnd={() => {
                                setDraggedId(null);
                                setHoverCell(null);
                              }}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-grab active:cursor-grabbing select-none ${
                                isDraggingThis
                                  ? 'opacity-45 scale-[0.98] border-blue-400 bg-blue-50'
                                  : isConflicted
                                    ? 'border-amber-300 bg-amber-50/70 hover:border-amber-400'
                                    : 'border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-bold text-slate-900 truncate">
                                    {cls.mapel}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickMoveTarget(cls);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                    title="Pindahkan slot via menu"
                                  >
                                    <ArrowLeftRight className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditClass(cls);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                    title="Edit detail kelas"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="pl-4.5 mt-1 space-y-0.5">
                                <div className="text-[11px] font-semibold text-blue-700 truncate">
                                  {cls.kelas}
                                </div>
                                <div className="text-[11px] text-slate-600 truncate">
                                  {cls.guru}
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-slate-400">
                                  <span className="truncate">{cls.cabang.replace(' BSD City', '')}</span>
                                  <span className="font-mono tabular-nums inline-flex items-center gap-0.5 text-slate-600 shrink-0">
                                    <Users className="w-3 h-3" />
                                    {studentCount}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {isHovered && draggedClass && (
                          <div
                            className={`mt-auto px-2 py-1.5 rounded-md border border-dashed text-[10px] font-bold text-center ${
                              hasHoverConflict
                                ? 'border-amber-400 text-amber-800 bg-amber-100/60'
                                : 'border-blue-400 text-blue-700 bg-blue-100/50'
                            }`}
                          >
                            {hasHoverConflict
                              ? 'Bentrok Guru/Kelas — Lepas untuk Opsi'
                              : `Lepas ke ${day} · ${slot}`}
                          </div>
                        )}

                        {!isHovered && cellClasses.length === 0 && (
                          <button
                            type="button"
                            onClick={() => onPrefillSlot(day, slot)}
                            className="w-full h-full min-h-[72px] rounded-lg border border-dashed border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 text-[11px] text-slate-400 hover:text-blue-700 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                            title={`Tambah jadwal pada ${day} pukul ${slot}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Slot Kosong</span>
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
