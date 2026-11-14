import React, { useMemo, useState } from 'react';
import { ActiveUser, DatabaseState, MasterKelas } from '../../types';
import { CurriculumService } from '../../services/curriculumService';
import { useToast } from '../Toast';
import {
  Calendar,
  Clock,
  Edit3,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  AlertTriangle,
  BookOpen,
  MapPin,
  Check,
  X,
} from 'lucide-react';

interface AdminCurriculumScheduleProps {
  database: DatabaseState;
  currentUser: ActiveUser;
  onDatabaseUpdated: () => void;
}

const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const CAMPUSES = [
  'Kampus Utama BSD City',
  'Kampus Sains BSD City',
  'Kampus Tahfidz BSD City',
];

function parseMinutes(timeStr: string): [number, number] | null {
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  const start = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const end = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
  return [start, end];
}

export function AdminCurriculumSchedule({
  database,
  onDatabaseUpdated,
}: AdminCurriculumScheduleProps) {
  const { showToast } = useToast();

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedGuru, setSelectedGuru] = useState<string>(database.master_guru[0]?.guru || '');
  const [kelasInput, setKelasInput] = useState<string>('');
  const [mapelInput, setMapelInput] = useState<string>('');
  const [idKelasInput, setIdKelasInput] = useState<string>('');
  const [cabangInput, setCabangInput] = useState<string>(CAMPUSES[0]);
  const [hariInput, setHariInput] = useState<string>('Senin');
  const [waktuInput, setWaktuInput] = useState<string>('07:30 - 09:00');

  // Add new Guru inline modal/bar
  const [showNewGuruForm, setShowNewGuruForm] = useState<boolean>(false);
  const [newGuruName, setNewGuruName] = useState<string>('');

  // View & Filter state
  const [viewMode, setViewMode] = useState<'per-guru' | 'matriks'>('per-guru');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterGuru, setFilterGuru] = useState<string>('all');

  const existingClassNames = useMemo(() => {
    const set = new Set<string>();
    database.master_kelas.forEach((k) => set.add(k.kelas));
    return Array.from(set).sort();
  }, [database.master_kelas]);

  const existingSubjects = useMemo(() => {
    const set = new Set<string>();
    database.master_kelas.forEach((k) => set.add(k.mapel));
    return Array.from(set).sort();
  }, [database.master_kelas]);

  // Conflict detection for the form currently being filled
  const conflictSchedule = useMemo(() => {
    if (!selectedGuru || !hariInput || !waktuInput) return null;
    const currentRange = parseMinutes(waktuInput);
    return database.master_kelas.find((k) => {
      if (editingId && k.id_kelas === editingId) return false;
      if (k.guru.toLowerCase().trim() !== selectedGuru.toLowerCase().trim()) return false;
      if (k.hari.toLowerCase().trim() !== hariInput.toLowerCase().trim()) return false;
      const otherRange = parseMinutes(k.waktu);
      if (currentRange && otherRange) {
        return currentRange[0] < otherRange[1] && otherRange[0] < currentRange[1];
      }
      return k.waktu.trim() === waktuInput.trim();
    });
  }, [database.master_kelas, editingId, selectedGuru, hariInput, waktuInput]);

  // Auto-generate ID kelas helper when creating new
  const generateSuggestedId = (kelasStr: string, mapelStr: string) => {
    const kPart = (kelasStr || 'KLS')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 4);
    const mPart = (mapelStr || 'MAP')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 3);
    const suffix = String((database.master_kelas.length % 90) + 10);
    return `KLS-${kPart}-${mPart}${suffix}`;
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedGuru(database.master_guru[0]?.guru || '');
    setKelasInput('');
    setMapelInput('');
    setIdKelasInput('');
    setCabangInput(CAMPUSES[0]);
    setHariInput('Senin');
    setWaktuInput('07:30 - 09:00');
  };

  const startEdit = (item: MasterKelas) => {
    setEditingId(item.id_kelas);
    setSelectedGuru(item.guru);
    setKelasInput(item.kelas);
    setMapelInput(item.mapel);
    setIdKelasInput(item.id_kelas);
    setCabangInput(item.cabang);
    setHariInput(item.hari);
    setWaktuInput(item.waktu);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = idKelasInput.trim() || generateSuggestedId(kelasInput, mapelInput);
    const res = CurriculumService.saveTeacherSchedule({
      originalIdKelas: editingId || undefined,
      id_kelas: finalId,
      guru: selectedGuru,
      kelas: kelasInput,
      mapel: mapelInput,
      cabang: cabangInput,
      hari: hariInput,
      waktu: waktuInput,
    });

    if (!res.success) {
      showToast('Gagal Menyimpan Jadwal', res.message, 'error');
      return;
    }

    showToast('Kurikulum Diperbarui', res.message, 'success');
    onDatabaseUpdated();
    resetForm();
  };

  const handleDeleteSchedule = (item: MasterKelas) => {
    const res = CurriculumService.deleteTeacherSchedule(item.id_kelas);
    if (res.success) {
      showToast('Jadwal Dihapus', res.message, 'info');
      if (editingId === item.id_kelas) resetForm();
      onDatabaseUpdated();
    } else {
      showToast('Gagal Menghapus', res.message, 'error');
    }
  };

  const handleAddNewGuru = (e: React.FormEvent) => {
    e.preventDefault();
    const res = CurriculumService.addGuru(newGuruName);
    if (!res.success) {
      showToast('Gagal Tambah Guru', res.message, 'error');
      return;
    }
    showToast('Guru Ditambahkan', res.message, 'success');
    if (res.guru) {
      setSelectedGuru(res.guru.guru);
    }
    setNewGuruName('');
    setShowNewGuruForm(false);
    onDatabaseUpdated();
  };

  const filteredClasses = useMemo(() => {
    return database.master_kelas.filter((k) => {
      if (filterGuru !== 'all' && k.guru !== filterGuru) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          k.guru.toLowerCase().includes(q) ||
          k.kelas.toLowerCase().includes(q) ||
          k.mapel.toLowerCase().includes(q) ||
          k.id_kelas.toLowerCase().includes(q) ||
          k.hari.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [database.master_kelas, filterGuru, searchQuery]);

  // Group by Guru for "Daftar per Guru"
  const groupedByGuru = useMemo(() => {
    const map = new Map<string, MasterKelas[]>();
    database.master_guru.forEach((g) => {
      if (filterGuru === 'all' || filterGuru === g.guru) {
        map.set(g.guru, []);
      }
    });
    filteredClasses.forEach((cls) => {
      if (!map.has(cls.guru)) {
        map.set(cls.guru, []);
      }
      map.get(cls.guru)!.push(cls);
    });
    return Array.from(map.entries()).filter(([guruName, items]) => {
      if (!searchQuery.trim()) return true;
      return items.length > 0 || guruName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [database.master_guru, filteredClasses, filterGuru, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
            Bidang Kurikulum · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Jadwal Mengajar & Penetapan Kelas Guru
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Atur jadwal pelajaran setiap guru, tuliskan kelas yang diampu, dan sinkronkan otomatis ke Portal Guru maupun Jadwal KBM Santri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-sans font-semibold text-slate-500">Total Guru</div>
            <div className="text-lg font-black text-slate-900">{database.master_guru.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-[10px] font-sans font-semibold text-blue-700">Slot Jadwal & Kelas</div>
            <div className="text-lg font-black text-blue-950">{database.master_kelas.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] font-sans font-semibold text-emerald-700">Total Penempatan</div>
            <div className="text-lg font-black text-emerald-950">{database.siswa_kelas.length}</div>
          </div>
        </div>
      </div>

      {/* Form Input / Edit Jadwal & Kelas Guru */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              {editingId ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingId ? `Edit Jadwal & Kelas (${editingId})` : 'Input Jadwal & Kelas Baru untuk Guru'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih guru, tuliskan nama kelas yang diampu, mata pelajaran, hari, dan jam mengajar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowNewGuruForm((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>{showNewGuruForm ? 'Tutup Form Guru Baru' : 'Tambah Guru Baru'}</span>
          </button>
        </div>

        {/* Inline Add Guru Bar */}
        {showNewGuruForm && (
          <form
            onSubmit={handleAddNewGuru}
            className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
          >
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-blue-900">Nama Lengkap Guru & Gelar</label>
              <input
                type="text"
                value={newGuruName}
                onChange={(e) => setNewGuruName(e.target.value)}
                placeholder="Contoh: Ustadz Hasan Al-Banna, Lc., M.Ag."
                className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Guru</span>
            </button>
          </form>
        )}

        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pilih Guru */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">1. Guru Pengampu</label>
              <select
                value={selectedGuru}
                onChange={(e) => setSelectedGuru(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                {database.master_guru.map((g) => (
                  <option key={g.id_tutor} value={g.guru}>
                    {g.guru} ({g.id_tutor})
                  </option>
                ))}
              </select>
            </div>

            {/* Tuliskan Kelas Guru */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">2. Kelas yang Diampu Guru</label>
              <input
                type="text"
                list="existing-kelas-list"
                value={kelasInput}
                onChange={(e) => setKelasInput(e.target.value)}
                placeholder="Tulis kelas, misal: 10 SMA Unggulan A"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <datalist id="existing-kelas-list">
                {existingClassNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Mata Pelajaran */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">3. Mata Pelajaran / Halaqah</label>
              <input
                type="text"
                list="existing-mapel-list"
                value={mapelInput}
                onChange={(e) => setMapelInput(e.target.value)}
                placeholder="Contoh: Tahfidz Al-Qur'an / Matematika"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <datalist id="existing-mapel-list">
                {existingSubjects.map((subj) => (
                  <option key={subj} value={subj} />
                ))}
              </datalist>
            </div>

            {/* Hari */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">4. Hari Mengajar</label>
              <select
                value={hariInput}
                onChange={(e) => setHariInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Waktu Mengajar */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">5. Jam / Waktu Mengajar</label>
              <input
                type="text"
                value={waktuInput}
                onChange={(e) => setWaktuInput(e.target.value)}
                placeholder="Contoh: 07:30 - 09:00"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {/* Kampus / Cabang & ID Kelas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">6. Kampus</label>
                <select
                  value={cabangInput}
                  onChange={(e) => setCabangInput(e.target.value)}
                  className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {CAMPUSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Kode Kelas</label>
                <input
                  type="text"
                  value={idKelasInput}
                  onChange={(e) => setIdKelasInput(e.target.value)}
                  placeholder="Otomatis"
                  className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {conflictSchedule && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Peringatan Bentrok Jadwal:</span> {selectedGuru} sudah memiliki kelas{' '}
                <strong>{conflictSchedule.kelas}</strong> ({conflictSchedule.mapel}) pada hari{' '}
                <strong>{conflictSchedule.hari}</strong> pukul{' '}
                <span className="font-mono font-bold">{conflictSchedule.waktu}</span>. Anda tetap dapat menyesuaikan jam mengajar agar tidak berbenturan.
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal Edit</span>
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Simpan Perubahan Jadwal & Kelas' : 'Simpan Jadwal & Kelas Guru'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter & View Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama guru, kelas, mapel, atau hari..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              value={filterGuru}
              onChange={(e) => setFilterGuru(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Guru ({database.master_guru.length})</option>
              {database.master_guru.map((g) => (
                <option key={g.id_tutor} value={g.guru}>
                  {g.guru}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start">
            <button
              type="button"
              onClick={() => setViewMode('per-guru')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                viewMode === 'per-guru' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar per Guru
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matriks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                viewMode === 'matriks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriks Mingguan
            </button>
          </div>
        </div>

        {/* View 1: Daftar per Guru */}
        {viewMode === 'per-guru' && (
          <div className="space-y-4">
            {groupedByGuru.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Tidak ada jadwal guru yang cocok dengan pencarian.
              </div>
            ) : (
              groupedByGuru.map(([guruName, schedules]) => {
                const tutorObj = database.master_guru.find((g) => g.guru === guruName);
                return (
                  <div
                    key={guruName}
                    className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                  >
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {guruName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">{guruName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {tutorObj?.id_tutor || 'TUTOR'} · {schedules.length} jadwal kelas
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setSelectedGuru(guruName);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Kelas Guru Ini</span>
                      </button>
                    </div>

                    {schedules.length === 0 ? (
                      <div className="px-4 py-5 text-xs text-slate-400 italic">
                        Belum ada jadwal & kelas yang ditetapkan untuk guru ini.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold">Kode</th>
                              <th className="px-4 py-2.5 font-semibold">Kelas Diampu</th>
                              <th className="px-4 py-2.5 font-semibold">Mata Pelajaran</th>
                              <th className="px-4 py-2.5 font-semibold">Hari & Jam</th>
                              <th className="px-4 py-2.5 font-semibold">Kampus</th>
                              <th className="px-4 py-2.5 font-semibold text-center">Santri</th>
                              <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {schedules.map((item) => {
                              const studentCount = database.siswa_kelas.filter(
                                (sk) => sk.id_kelas === item.id_kelas
                              ).length;

                              return (
                                <tr key={item.id_kelas} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                                    {item.id_kelas}
                                  </td>
                                  <td className="px-4 py-2.5 font-bold text-slate-900">{item.kelas}</td>
                                  <td className="px-4 py-2.5 text-blue-700 font-semibold">{item.mapel}</td>
                                  <td className="px-4 py-2.5 font-mono text-slate-700 tabular-nums">
                                    {item.hari} · {item.waktu}
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-500">{item.cabang}</td>
                                  <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-800 tabular-nums">
                                    {studentCount}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => startEdit(item)}
                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 cursor-pointer"
                                        title="Edit Jadwal & Kelas"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSchedule(item)}
                                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
                                        title="Hapus Jadwal"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* View 2: Matriks Mingguan Senin - Sabtu */}
        {viewMode === 'matriks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const dayClasses = filteredClasses
                .filter((k) => k.hari.toLowerCase() === day.toLowerCase())
                .sort((a, b) => a.waktu.localeCompare(b.waktu));

              return (
                <div key={day} className="rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {day}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {dayClasses.length} kelas
                    </span>
                  </div>

                  <div className="p-3 space-y-2.5">
                    {dayClasses.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-4 text-center">
                        Belum ada jadwal pada hari {day}.
                      </p>
                    ) : (
                      dayClasses.map((cls) => (
                        <div
                          key={cls.id_kelas}
                          className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-bold text-blue-700 tabular-nums flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {cls.waktu}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEdit(cls)}
                              className="text-[11px] font-bold text-slate-500 hover:text-blue-700 cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="text-xs font-extrabold text-slate-900">{cls.kelas}</div>
                          <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 shrink-0" />
                            <span>{cls.mapel}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 shrink-0 text-slate-400" />
                            <span>{cls.guru}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {cls.cabang}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Users className="w-3 h-3" />
                              {database.siswa_kelas.filter((sk) => sk.id_kelas === cls.id_kelas).length}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
