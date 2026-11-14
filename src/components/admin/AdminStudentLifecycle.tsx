import React, { useMemo, useState } from 'react';
import { ActiveUser, DatabaseState, StudentMutationRecord } from '../../types';
import { CurriculumService } from '../../services/curriculumService';
import { useToast } from '../Toast';
import {
  ArrowLeftRight,
  Check,
  History,
  LogIn,
  LogOut,
  Search,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  RotateCcw,
} from 'lucide-react';

interface AdminStudentLifecycleProps {
  database: DatabaseState;
  currentUser: ActiveUser;
  onDatabaseUpdated: () => void;
}

type LifecycleSubTab = 'aktif' | 'masuk' | 'riwayat';

const CAMPUSES = [
  'Kampus Utama BSD City',
  'Kampus Sains BSD City',
  'Kampus Tahfidz BSD City',
];

export function AdminStudentLifecycle({
  database,
  currentUser,
  onDatabaseUpdated,
}: AdminStudentLifecycleProps) {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<LifecycleSubTab>('aktif');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [mutationFilter, setMutationFilter] = useState<'all' | 'Masuk' | 'Keluar' | 'Pindah Kelas' | 'Aktif Kembali'>('all');
  const [mutationRefreshTick, setMutationRefreshTick] = useState<number>(0);

  // Form: Tambah Siswa Baru (Siswa Masuk)
  const [newSiswaName, setNewSiswaName] = useState<string>('');
  const [newSiswaEmail, setNewSiswaEmail] = useState<string>('');
  const [newSiswaCampus, setNewSiswaCampus] = useState<string>(CAMPUSES[0]);
  const [newSiswaDate, setNewSiswaDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newSiswaReason, setNewSiswaReason] = useState<string>('Penerimaan Santri Baru / Pindahan Masuk');
  const [newSiswaClasses, setNewSiswaClasses] = useState<string[]>([]);

  // Modal/Inline Panel: Kelola Kelas Siswa Aktif
  const [editingClassStudent, setEditingClassStudent] = useState<string | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classChangeReason, setClassChangeReason] = useState<string>('');

  // Modal/Inline Panel: Proses Siswa Keluar
  const [withdrawingStudent, setWithdrawingStudent] = useState<string | null>(null);
  const [withdrawDate, setWithdrawDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [withdrawReason, setWithdrawReason] = useState<string>('Pindah / Mutasi Sekolah');

  // Reactivate modal/inline state
  const [reactivatingRecord, setReactivatingRecord] = useState<StudentMutationRecord | null>(null);
  const [reactivateClasses, setReactivateClasses] = useState<string[]>([]);
  const [reactivateReason, setReactivateReason] = useState<string>('Santri mendaftar aktif kembali');

  const mutationLogs = useMemo(() => {
    void mutationRefreshTick;
    return CurriculumService.getMutationLogs();
  }, [mutationRefreshTick]);

  const activeStudents = useMemo(() => {
    return database.master_siswa
      .filter((s) => {
        if (campusFilter !== 'all' && s.cabang !== campusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            s.siswa.toLowerCase().includes(q) ||
            s.email_siswa.toLowerCase().includes(q) ||
            s.cabang.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.siswa.localeCompare(b.siswa));
  }, [database.master_siswa, campusFilter, searchQuery]);

  const activeStudentNameSet = useMemo(
    () => new Set(database.master_siswa.map((s) => s.siswa.toLowerCase().trim())),
    [database.master_siswa]
  );

  const filteredMutations = useMemo(() => {
    return mutationLogs.filter((m) => {
      if (mutationFilter !== 'all' && m.jenis !== mutationFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.siswa.toLowerCase().includes(q) ||
          m.alasan.toLowerCase().includes(q) ||
          m.cabang.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mutationLogs, mutationFilter, searchQuery]);

  const stats = useMemo(() => {
    const masukCount = mutationLogs.filter((m) => m.jenis === 'Masuk' || m.jenis === 'Aktif Kembali').length;
    const keluarCount = mutationLogs.filter((m) => m.jenis === 'Keluar').length;
    return {
      activeCount: database.master_siswa.length,
      masukCount,
      keluarCount,
      enrollmentsCount: database.siswa_kelas.length,
    };
  }, [database.master_siswa.length, database.siswa_kelas.length, mutationLogs]);

  const toggleClassInList = (list: string[], id: string, setter: (v: string[]) => void) => {
    if (list.includes(id)) setter(list.filter((c) => c !== id));
    else setter([...list, id]);
  };

  const handleAdmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const res = CurriculumService.admitStudent({
      siswa: newSiswaName,
      email_siswa: newSiswaEmail,
      cabang: newSiswaCampus,
      tanggal: newSiswaDate,
      alasan: newSiswaReason,
      kelasIds: newSiswaClasses,
      diproses_oleh: currentUser.name,
    });

    if (!res.success) {
      showToast('Gagal Tambah Siswa', res.message, 'error');
      return;
    }

    showToast('Siswa Masuk Tersimpan', res.message, 'success');
    setNewSiswaName('');
    setNewSiswaEmail('');
    setNewSiswaReason('Penerimaan Santri Baru / Pindahan Masuk');
    setNewSiswaClasses([]);
    setMutationRefreshTick((t) => t + 1);
    onDatabaseUpdated();
    setSubTab('aktif');
  };

  const openManageClasses = (siswaName: string) => {
    const currentIds = database.siswa_kelas
      .filter((sk) => sk.siswa === siswaName)
      .map((sk) => sk.id_kelas);
    setEditingClassStudent(siswaName);
    setSelectedClassIds(currentIds);
    setClassChangeReason('');
    setWithdrawingStudent(null);
  };

  const handleSaveStudentClasses = () => {
    if (!editingClassStudent) return;
    const res = CurriculumService.updateStudentClasses({
      siswa: editingClassStudent,
      kelasIds: selectedClassIds,
      diproses_oleh: currentUser.name,
      alasan: classChangeReason || 'Penyesuaian kelas oleh Kurikulum',
    });
    if (res.success) {
      showToast('Kelas Santri Diperbarui', res.message, 'success');
      setEditingClassStudent(null);
      setMutationRefreshTick((t) => t + 1);
      onDatabaseUpdated();
    } else {
      showToast('Gagal Memperbarui Kelas', res.message, 'error');
    }
  };

  const openWithdrawPanel = (siswaName: string) => {
    setWithdrawingStudent(siswaName);
    setWithdrawDate(new Date().toISOString().split('T')[0]);
    setWithdrawReason('Pindah / Mutasi Sekolah');
    setEditingClassStudent(null);
  };

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawingStudent) return;
    const res = CurriculumService.withdrawStudent({
      siswa: withdrawingStudent,
      tanggal: withdrawDate,
      alasan: withdrawReason,
      diproses_oleh: currentUser.name,
    });
    if (res.success) {
      showToast('Siswa Keluar Diproses', res.message, 'info');
      setWithdrawingStudent(null);
      setMutationRefreshTick((t) => t + 1);
      onDatabaseUpdated();
    } else {
      showToast('Gagal Memproses', res.message, 'error');
    }
  };

  const handleConfirmReactivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reactivatingRecord) return;
    const res = CurriculumService.reactivateStudent({
      mutationRecord: reactivatingRecord,
      kelasIds: reactivateClasses,
      alasan: reactivateReason,
      diproses_oleh: currentUser.name,
    });
    if (res.success) {
      showToast('Siswa Aktif Kembali', res.message, 'success');
      setReactivatingRecord(null);
      setReactivateClasses([]);
      setMutationRefreshTick((t) => t + 1);
      onDatabaseUpdated();
    } else {
      showToast('Gagal Re-aktivasi', res.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Kesiswaan & Kurikulum · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Siswa Masuk, Keluar & Penempatan Kelas
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Kelola pendaftaran siswa masuk baru, proses siswa keluar atau mutasi, pemindahan kelas santri, serta audit riwayat kesiswaan secara terpadu.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono tabular-nums text-xs shrink-0">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-sans font-semibold text-slate-500">Siswa Aktif</div>
            <div className="text-lg font-black text-slate-900">{stats.activeCount}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] font-sans font-semibold text-emerald-700">Log Masuk</div>
            <div className="text-lg font-black text-emerald-950">{stats.masukCount}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-[10px] font-sans font-semibold text-rose-700">Log Keluar</div>
            <div className="text-lg font-black text-rose-950">{stats.keluarCount}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-[10px] font-sans font-semibold text-blue-700">Total Kursi Kelas</div>
            <div className="text-lg font-black text-blue-950">{stats.enrollmentsCount}</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setSubTab('aktif')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              subTab === 'aktif' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Siswa Aktif & Kelas ({database.master_siswa.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('masuk')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              subTab === 'masuk' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Siswa Baru (Masuk)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('riwayat')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              subTab === 'riwayat' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Masuk & Keluar ({mutationLogs.length})</span>
          </button>
        </div>

        {subTab !== 'masuk' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama santri atau keterangan..."
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 w-60"
              />
            </div>

            {subTab === 'aktif' && (
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="all">Semua Kampus</option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* SUB-TAB 1: DAFTAR SISWA AKTIF & KELOLA KELAS / PROSES KELUAR */}
      {subTab === 'aktif' && (
        <div className="space-y-4">
          {/* Inline Drawer: Manage Student Classes */}
          {editingClassStudent && (
            <div className="bg-blue-50/70 border border-blue-300 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                    Atur Penempatan Kelas: {editingClassStudent}
                  </h3>
                  <p className="text-xs text-blue-800/80 mt-0.5">
                    Centang kelas yang diikuti santri ini. Perubahan langsung tersinkronisasi ke absensi guru dan jadwal santri.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingClassStudent(null)}
                  className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {database.master_kelas.map((cls) => {
                  const checked = selectedClassIds.includes(cls.id_kelas);
                  return (
                    <label
                      key={cls.id_kelas}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                        checked
                          ? 'bg-white border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-white/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleClassInList(selectedClassIds, cls.id_kelas, setSelectedClassIds)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 truncate">{cls.kelas}</div>
                        <div className="text-[11px] font-semibold text-blue-700 truncate">{cls.mapel}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {cls.guru} · {cls.hari} {cls.waktu}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-blue-200">
                <input
                  type="text"
                  value={classChangeReason}
                  onChange={(e) => setClassChangeReason(e.target.value)}
                  placeholder="Catatan perubahan kelas (opsional, misal: Pindah rombel A ke B)"
                  className="flex-1 px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingClassStudent(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStudentClasses}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Kelas ({selectedClassIds.length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inline Drawer: Withdraw / Siswa Keluar */}
          {withdrawingStudent && (
            <form
              onSubmit={handleConfirmWithdraw}
              className="bg-rose-50 border border-rose-300 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-rose-950 flex items-center gap-2">
                    <UserMinus className="w-4 h-4 text-rose-600" />
                    Proses Siswa Keluar / Mutasi: {withdrawingStudent}
                  </h3>
                  <p className="text-xs text-rose-800/90 mt-0.5">
                    Siswa akan dikeluarkan dari daftar aktif & kelas terjadwal, sementara data riwayat mutasi dan log nilai tetap tercatat rapi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawingStudent(null)}
                  className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-rose-900">Tanggal Efektif Keluar</label>
                  <input
                    type="date"
                    value={withdrawDate}
                    onChange={(e) => setWithdrawDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs font-mono"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-rose-900">Alasan / Keterangan Keluar</label>
                  <input
                    type="text"
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="Contoh: Mutasi orang tua ke luar kota / Lulus / Pindah sekolah"
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawingStudent(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Konfirmasi Siswa Keluar</span>
                </button>
              </div>
            </form>
          )}

          {/* Table of Active Students */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-12">No</th>
                    <th className="px-4 py-3 font-semibold">Nama Santri</th>
                    <th className="px-4 py-3 font-semibold">Kampus</th>
                    <th className="px-4 py-3 font-semibold">Kelas & Mapel Diikuti</th>
                    <th className="px-4 py-3 font-semibold text-right">Kelola Kesiswaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                        Tidak ditemukan data santri aktif yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    activeStudents.map((s, idx) => {
                      const classes = database.siswa_kelas.filter((sk) => sk.siswa === s.siswa);
                      return (
                        <tr key={s.siswa} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-900">{s.siswa}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{s.email_siswa}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{s.cabang}</td>
                          <td className="px-4 py-3">
                            {classes.length === 0 ? (
                              <span className="text-[11px] text-amber-700 font-semibold">
                                Belum ditempatkan di kelas
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                {classes.map((c) => (
                                  <div key={c.id_kelas} className="text-[11px] text-slate-700">
                                    <span className="font-bold text-slate-900">{c.kelas}</span>
                                    <span className="text-slate-400"> · </span>
                                    <span className="text-blue-700 font-semibold">{c.mapel}</span>
                                    <span className="text-slate-400"> ({c.guru})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openManageClasses(s.siswa)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span>Atur Kelas</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openWithdrawPanel(s.siswa)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Siswa Keluar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TAMBAH SISWA BARU (SISWA MASUK) */}
      {subTab === 'masuk' && (
        <form
          onSubmit={handleAdmitStudent}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Formulir Pendaftaran Siswa Baru / Siswa Masuk
              </h3>
              <p className="text-[11px] text-slate-500">
                Siswa baru langsung memperoleh akses login Portal Santri (password standar sistem) dan ditempatkan ke kelas pilihan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Lengkap Santri *</label>
              <input
                type="text"
                value={newSiswaName}
                onChange={(e) => setNewSiswaName(e.target.value)}
                placeholder="Contoh: Zaidan Al-Fatih"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Siswa / Wali Murid</label>
              <input
                type="email"
                value={newSiswaEmail}
                onChange={(e) => setNewSiswaEmail(e.target.value)}
                placeholder="Otomatis jika dikosongkan"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kampus / Cabang</label>
              <select
                value={newSiswaCampus}
                onChange={(e) => setNewSiswaCampus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tanggal Masuk</label>
              <input
                type="date"
                value={newSiswaDate}
                onChange={(e) => setNewSiswaDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Keterangan / Asal Sekolah</label>
              <input
                type="text"
                value={newSiswaReason}
                onChange={(e) => setNewSiswaReason(e.target.value)}
                placeholder="Contoh: Pindahan dari SMPIT Al-Hikmah Jakarta / Santri Baru Gelombang 2"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Penempatan Kelas & Jadwal Awal ({newSiswaClasses.length} dipilih)
              </label>
              <button
                type="button"
                onClick={() =>
                  setNewSiswaClasses(
                    newSiswaClasses.length === database.master_kelas.length
                      ? []
                      : database.master_kelas.map((k) => k.id_kelas)
                  )
                }
                className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
              >
                {newSiswaClasses.length === database.master_kelas.length ? 'Kosongkan Pilihan' : 'Pilih Semua Kelas'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {database.master_kelas.map((cls) => {
                const checked = newSiswaClasses.includes(cls.id_kelas);
                return (
                  <label
                    key={cls.id_kelas}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                      checked
                        ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleClassInList(newSiswaClasses, cls.id_kelas, setNewSiswaClasses)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 truncate">{cls.kelas}</div>
                      <div className="text-[11px] font-semibold text-emerald-700 truncate">{cls.mapel}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {cls.guru} · {cls.hari} {cls.waktu}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Simpan Siswa Baru & Daftarkan Kelas</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: RIWAYAT SISWA MASUK & KELUAR */}
      {subTab === 'riwayat' && (
        <div className="space-y-4">
          {reactivatingRecord && (
            <form
              onSubmit={handleConfirmReactivate}
              className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Aktifkan Kembali Santri: {reactivatingRecord.siswa}
                  </h3>
                  <p className="text-xs text-emerald-800/80 mt-0.5">
                    Pilih kelas untuk menempatkan kembali santri ke daftar aktif sekolah.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReactivatingRecord(null)}
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {database.master_kelas.map((cls) => {
                  const checked = reactivateClasses.includes(cls.id_kelas);
                  return (
                    <label
                      key={cls.id_kelas}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2 ${
                        checked ? 'bg-white border-emerald-500' : 'bg-white/70 border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleClassInList(reactivateClasses, cls.id_kelas, setReactivateClasses)
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{cls.kelas}</div>
                        <div className="text-[11px] text-emerald-700">{cls.mapel}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <input
                  type="text"
                  value={reactivateReason}
                  onChange={(e) => setReactivateReason(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs"
                  placeholder="Keterangan aktivasi kembali..."
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Aktifkan Kembali
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'Masuk', 'Keluar', 'Pindah Kelas', 'Aktif Kembali'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMutationFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                  mutationFilter === type
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {type === 'all' ? 'Semua Mutasi' : type}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Jenis Mutasi</th>
                    <th className="px-4 py-3 font-semibold">Nama Santri</th>
                    <th className="px-4 py-3 font-semibold">Kelas Terkait</th>
                    <th className="px-4 py-3 font-semibold">Alasan & Petugas</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Belum ada catatan mutasi siswa yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((log) => {
                      const isCurrentlyActive = activeStudentNameSet.has(log.siswa.toLowerCase().trim());
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                            {log.tanggal}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            <span
                              className={
                                log.jenis === 'Masuk' || log.jenis === 'Aktif Kembali'
                                  ? 'text-emerald-700'
                                  : log.jenis === 'Keluar'
                                    ? 'text-rose-700'
                                    : 'text-blue-700'
                              }
                            >
                              {log.jenis}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-900">{log.siswa}</div>
                            <div className="text-[11px] text-slate-500">{log.cabang}</div>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-600 max-w-xs">
                            {log.kelas_terkait.length > 0 ? log.kelas_terkait.join(', ') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-800">{log.alasan}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Diproses oleh {log.diproses_oleh}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {log.jenis === 'Keluar' && !isCurrentlyActive ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setReactivatingRecord(log);
                                  setReactivateClasses([]);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Masuk Kembali</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {isCurrentlyActive ? 'Aktif' : 'Selesai'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
