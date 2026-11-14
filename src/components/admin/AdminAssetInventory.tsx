import React, { useMemo, useState } from 'react';
import {
  ActiveUser,
  AssetBorrowerRole,
  AssetCategory,
  AssetCondition,
  AssetLoanStatus,
  DatabaseState,
  SchoolAssetItem,
} from '../../types';
import { AssetInventoryService } from '../../services/assetInventoryService';
import { SheetsService } from '../../services/sheetsService';
import { SecurityService } from '../../services/securityService';
import { useToast } from '../Toast';
import {
  ArrowLeftRight,
  CheckCircle2,
  CloudUpload,
  Download,
  FileSpreadsheet,
  History,
  Laptop,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';

interface AdminAssetInventoryProps {
  database: DatabaseState;
  currentUser: ActiveUser;
  onOpenSheetsSetup: () => void;
}

const ASSET_CATEGORIES: AssetCategory[] = [
  'Laptop & Komputer',
  'Proyektor & Audio',
  'Tablet & Smartboard',
  'Perangkat Jaringan & CBT',
  'Alat Lab Sains',
  'Lainnya',
];

const ASSET_CONDITIONS: AssetCondition[] = [
  'Baik',
  'Perlu Perawatan',
  'Rusak Ringan',
  'Rusak Berat',
];

const LOAN_STATUSES: AssetLoanStatus[] = ['Tersedia', 'Dipinjam', 'Dalam Perawatan'];

export function AdminAssetInventory({
  database,
  currentUser,
  onOpenSheetsSetup,
}: AdminAssetInventoryProps) {
  const { showToast } = useToast();
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AssetCategory>('all');
  const [conditionFilter, setConditionFilter] = useState<'all' | AssetCondition>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AssetLoanStatus>('all');

  // Interactive Drawers
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [lendingAsset, setLendingAsset] = useState<SchoolAssetItem | null>(null);
  const [returningAsset, setReturningAsset] = useState<SchoolAssetItem | null>(null);
  const [editingAsset, setEditingAsset] = useState<SchoolAssetItem | null>(null);
  const [historyAsset, setHistoryAsset] = useState<SchoolAssetItem | null>(null);

  // Add Asset Form
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<AssetCategory>('Laptop & Komputer');
  const [newSerial, setNewSerial] = useState<string>('');
  const [newCode, setNewCode] = useState<string>('');
  const [newCampus, setNewCampus] = useState<string>('Kampus Utama BSD City');
  const [newRoom, setNewRoom] = useState<string>('');
  const [newCondition, setNewCondition] = useState<AssetCondition>('Baik');
  const [newAcquiredDate, setNewAcquiredDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newNote, setNewNote] = useState<string>('');

  // Loan (Checkout) Form
  const [borrowerRole, setBorrowerRole] = useState<AssetBorrowerRole>('Guru / Staff');
  const [borrowerName, setBorrowerName] = useState<string>(database.master_guru[0]?.guru || '');
  const [loanDate, setLoanDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [returnDueDate, setReturnDueDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [loanPurpose, setLoanPurpose] = useState<string>('');

  // Return Form
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [returnCondition, setReturnCondition] = useState<AssetCondition>('Baik');
  const [returnNote, setReturnNote] = useState<string>('');

  // Edit Condition & Location Form
  const [editCondition, setEditCondition] = useState<AssetCondition>('Baik');
  const [editStatus, setEditStatus] = useState<AssetLoanStatus>('Tersedia');
  const [editCampus, setEditCampus] = useState<string>('Kampus Utama BSD City');
  const [editRoom, setEditRoom] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

  const hasSheetsUrl = Boolean(SheetsService.getScriptUrl());

  const allAssets = useMemo(() => {
    void refreshTick;
    return AssetInventoryService.getAllAssets();
  }, [refreshTick]);

  const campuses = useMemo(() => {
    const set = new Set<string>([
      'Kampus Utama BSD City',
      'Kampus Sains BSD City',
      'Kampus Tahfidz BSD City',
    ]);
    database.master_siswa.forEach((s) => s.cabang && set.add(s.cabang));
    allAssets.forEach((a) => a.lokasi_kampus && set.add(a.lokasi_kampus));
    return Array.from(set);
  }, [database.master_siswa, allAssets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allAssets.filter((a) => {
      if (campusFilter !== 'all' && a.lokasi_kampus !== campusFilter) return false;
      if (categoryFilter !== 'all' && a.kategori !== categoryFilter) return false;
      if (conditionFilter !== 'all' && a.kondisi !== conditionFilter) return false;
      if (statusFilter !== 'all' && a.status_peminjaman !== statusFilter) return false;
      if (q) {
        return (
          a.nama_perangkat.toLowerCase().includes(q) ||
          a.nomor_seri.toLowerCase().includes(q) ||
          a.kode_inventaris.toLowerCase().includes(q) ||
          a.ruangan.toLowerCase().includes(q) ||
          (a.peminjam_aktif && a.peminjam_aktif.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allAssets, campusFilter, categoryFilter, conditionFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = allAssets.length;
    const available = allAssets.filter((a) => a.status_peminjaman === 'Tersedia').length;
    const borrowed = allAssets.filter((a) => a.status_peminjaman === 'Dipinjam').length;
    const maintenanceOrDamaged = allAssets.filter(
      (a) => a.kondisi !== 'Baik' || a.status_peminjaman === 'Dalam Perawatan'
    ).length;
    const syncedCount = allAssets.filter((a) => a.synced_to_sheets).length;
    return { total, available, borrowed, maintenanceOrDamaged, syncedCount };
  }, [allAssets]);

  const triggerBackgroundSheetsSync = async () => {
    if (!SheetsService.getScriptUrl()) return;
    await AssetInventoryService.syncAssetsToSheets();
    setRefreshTick((t) => t + 1);
  };

  const handleManualSyncToSheets = async () => {
    setIsSyncing(true);
    const res = await AssetInventoryService.syncAssetsToSheets();
    setIsSyncing(false);
    setRefreshTick((t) => t + 1);
    if (res.success) {
      showToast('Sinkronisasi Google Sheets Berhasil', res.message, 'success');
    } else {
      showToast(
        res.mode === 'local' ? 'Sheets Belum Terhubung / Perlu Update Script' : 'Gagal Sync',
        res.message,
        'info'
      );
    }
  };

  const handlePullFromSheets = async () => {
    setIsPulling(true);
    const res = await AssetInventoryService.pullAssetsFromSheets();
    setIsPulling(false);
    setRefreshTick((t) => t + 1);
    if (res.success) {
      showToast('Data Inventaris Ditarik', res.message, 'success');
    } else {
      showToast('Informasi Google Sheets', res.message, 'info');
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = AssetInventoryService.createAsset({
      nama_perangkat: newName,
      kategori: newCategory,
      nomor_seri: newSerial,
      kode_inventaris: newCode || undefined,
      lokasi_kampus: newCampus,
      ruangan: newRoom,
      kondisi: newCondition,
      tanggal_perolehan: newAcquiredDate,
      catatan: newNote || undefined,
    });
    if (!res.success) {
      showToast('Gagal Menambah Perangkat', res.message, 'error');
      return;
    }
    showToast('Perangkat Terdaftar', res.message, 'success');
    setNewName('');
    setNewSerial('');
    setNewCode('');
    setNewRoom('');
    setNewNote('');
    setShowAddForm(false);
    setRefreshTick((t) => t + 1);
    await triggerBackgroundSheetsSync();
  };

  const openLendDrawer = (asset: SchoolAssetItem) => {
    setLendingAsset(asset);
    setReturningAsset(null);
    setEditingAsset(null);
    setHistoryAsset(null);
    setBorrowerRole('Guru / Staff');
    setBorrowerName(database.master_guru[0]?.guru || '');
    setLoanDate(new Date().toISOString().split('T')[0]);
    setReturnDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setLoanPurpose('');
  };

  const handleBorrowerRoleChange = (role: AssetBorrowerRole) => {
    setBorrowerRole(role);
    if (role === 'Guru / Staff') {
      setBorrowerName(database.master_guru[0]?.guru || '');
    } else if (role === 'Santri') {
      setBorrowerName(database.master_siswa[0]?.siswa || '');
    } else {
      const k = database.master_kelas[0];
      setBorrowerName(k ? `${k.kelas} (${k.mapel})` : '');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lendingAsset) return;
    const res = AssetInventoryService.checkoutAsset({
      assetId: lendingAsset.id,
      peminjam: borrowerName,
      peran_peminjam: borrowerRole,
      tanggal_pinjam: loanDate,
      rencana_kembali: returnDueDate,
      keperluan: loanPurpose,
      dicatat_oleh: currentUser.name,
    });
    if (!res.success) {
      showToast('Gagal Meminjamkan', res.message, 'error');
      return;
    }
    showToast('Peminjaman Dicatat', res.message, 'success');
    setLendingAsset(null);
    setRefreshTick((t) => t + 1);
    await triggerBackgroundSheetsSync();
  };

  const openReturnDrawer = (asset: SchoolAssetItem) => {
    setReturningAsset(asset);
    setLendingAsset(null);
    setEditingAsset(null);
    setHistoryAsset(null);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnCondition(asset.kondisi);
    setReturnNote('');
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningAsset) return;
    const res = AssetInventoryService.returnAsset({
      assetId: returningAsset.id,
      tanggal_kembali: returnDate,
      kondisi_kembali: returnCondition,
      catatan: returnNote || undefined,
    });
    if (!res.success) {
      showToast('Gagal Mencatat Pengembalian', res.message, 'error');
      return;
    }
    showToast('Perangkat Dikembalikan', res.message, 'success');
    setReturningAsset(null);
    setRefreshTick((t) => t + 1);
    await triggerBackgroundSheetsSync();
  };

  const openEditDrawer = (asset: SchoolAssetItem) => {
    setEditingAsset(asset);
    setLendingAsset(null);
    setReturningAsset(null);
    setHistoryAsset(null);
    setEditCondition(asset.kondisi);
    setEditStatus(asset.status_peminjaman);
    setEditCampus(asset.lokasi_kampus);
    setEditRoom(asset.ruangan);
    setEditNote(asset.catatan || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    const res = AssetInventoryService.updateAssetDetails(editingAsset.id, {
      kondisi: editCondition,
      status_peminjaman: editStatus,
      lokasi_kampus: editCampus,
      ruangan: editRoom,
      catatan: editNote || undefined,
    });
    if (!res.success) {
      showToast('Gagal Memperbarui', res.message, 'error');
      return;
    }
    showToast('Data Perangkat Diperbarui', res.message, 'success');
    setEditingAsset(null);
    setRefreshTick((t) => t + 1);
    await triggerBackgroundSheetsSync();
  };

  const handleDeleteAsset = async (asset: SchoolAssetItem) => {
    const res = AssetInventoryService.deleteAsset(asset.id);
    if (!res.success) {
      showToast('Tidak Dapat Dihapus', res.message, 'warning');
      return;
    }
    showToast('Perangkat Dihapus', res.message, 'info');
    setRefreshTick((t) => t + 1);
    await triggerBackgroundSheetsSync();
  };

  const handleExportCsv = () => {
    const headers = [
      'ID Aset',
      'Kode Inventaris',
      'Nama Perangkat',
      'Kategori',
      'Nomor Seri (SN)',
      'Lokasi Kampus',
      'Ruangan',
      'Kondisi',
      'Status Peminjaman',
      'Peminjam Aktif',
      'Tgl Pinjam',
      'Rencana Kembali',
      'Tgl Perolehan',
      'Catatan',
    ];
    const rows = filteredAssets.map((a) =>
      [
        a.id,
        a.kode_inventaris,
        a.nama_perangkat,
        a.kategori,
        a.nomor_seri,
        a.lokasi_kampus,
        a.ruangan,
        a.kondisi,
        a.status_peminjaman,
        a.peminjam_aktif || '',
        a.tanggal_pinjam || '',
        a.rencana_kembali || '',
        a.tanggal_perolehan,
        a.catatan || '',
      ].map((c) => SecurityService.escapeCsvCell(c))
    );

    const csv =
      '\uFEFF' +
      [headers.map((h) => SecurityService.escapeCsvCell(h)).join(','), ...rows.map((r) => r.join(','))].join(
        '\r\n'
      );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventaris_Aset_AlWildan3BSD_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Export CSV Berhasil', `${filteredAssets.length} aset diekspor.`, 'success');
  };

  const getConditionTextClass = (condition: AssetCondition) => {
    switch (condition) {
      case 'Baik':
        return 'text-emerald-700 font-bold';
      case 'Perlu Perawatan':
        return 'text-amber-700 font-bold';
      case 'Rusak Ringan':
        return 'text-orange-700 font-bold';
      case 'Rusak Berat':
        return 'text-rose-700 font-extrabold';
    }
  };

  const getLoanStatusTextClass = (status: AssetLoanStatus) => {
    switch (status) {
      case 'Tersedia':
        return 'text-emerald-700 font-bold';
      case 'Dipinjam':
        return 'text-blue-700 font-bold';
      case 'Dalam Perawatan':
        return 'text-amber-700 font-bold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Sarana &amp; Prasarana · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Laptop className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Manajemen Inventaris Aset &amp; Perangkat Sekolah</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Pencatatan nomor seri (SN), pemantauan kondisi perangkat, riwayat peminjaman guru/santri, serta sinkronisasi dua arah dengan sheet{' '}
            <span className="font-mono font-semibold text-slate-700">inventaris_aset</span> di Google Sheets · Status:{' '}
            <span className={hasSheetsUrl ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {hasSheetsUrl
                ? `Google Sheets Terhubung (${stats.syncedCount}/${stats.total} tersinkron)`
                : 'Mode Cache Lokal (Sheets Belum Diatur)'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePullFromSheets}
            disabled={isPulling}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isPulling ? 'animate-spin' : ''}`} />
            <span>Tarik dari Sheets</span>
          </button>

          <button
            type="button"
            onClick={handleManualSyncToSheets}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sync ke Google Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSheetsSetup}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Buka Pengaturan & Kode Apps Script Google Sheets"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Setup Sheets</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Total Perangkat Terdaftar</div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {stats.total} Unit
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            Tersebar di {campuses.length} kampus
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Tersedia Siap Pakai</div>
          <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
            {stats.available} Unit
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            Siap dipinjam untuk KBM / CBT
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Sedang Dipinjam</div>
          <div className="text-2xl font-black text-blue-700 font-mono tabular-nums">
            {stats.borrowed} Unit
          </div>
          <div className="text-[11px] text-blue-700 font-semibold">
            Aktif digunakan guru / unit kelas
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Perlu Perawatan / Rusak</div>
          <div className="text-2xl font-black text-amber-700 font-mono tabular-nums">
            {stats.maintenanceOrDamaged} Unit
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            Dalam pengecekan tim sarana &amp; IT
          </div>
        </div>
      </div>

      {/* INLINE FORM: TAMBAH PERANGKAT BARU */}
      {showAddForm && (
        <form
          onSubmit={handleCreateAsset}
          className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Registrasi Perangkat / Aset Sekolah Baru
              </h3>
              <p className="text-xs text-slate-500">
                Nomor seri (SN) divalidasi unik untuk pelacakan peminjaman dan audit Google Sheets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Perangkat *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Laptop ASUS VivoBook / Proyektor BenQ"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nomor Seri (SN) *</label>
              <input
                type="text"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                placeholder="SN-XXXX-0001"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kode Inventaris (Opsional)</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Otomatis jika kosong"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kategori Perangkat</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
              >
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Lokasi Kampus</label>
              <select
                value={newCampus}
                onChange={(e) => setNewCampus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
              >
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Ruangan / Penempatan *</label>
              <input
                type="text"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="Contoh: Lab Komputer 1"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kondisi Awal</label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as AssetCondition)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
              >
                {ASSET_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tanggal Perolehan</label>
              <input
                type="date"
                value={newAcquiredDate}
                onChange={(e) => setNewAcquiredDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-700">Catatan Kelengkapan / Spesifikasi</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Contoh: Dilengkapi tas, charger original, dan stiker aset sekolah"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Simpan ke Inventaris
            </button>
          </div>
        </form>
      )}

      {/* INLINE DRAWER: PINJAMKAN PERANGKAT (CHECKOUT) */}
      {lendingAsset && (
        <form
          onSubmit={handleCheckoutSubmit}
          className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Pinjamkan Perangkat: {lendingAsset.nama_perangkat}
              </h3>
              <p className="text-xs text-slate-600 font-mono">
                SN: {lendingAsset.nomor_seri} · {lendingAsset.kode_inventaris}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLendingAsset(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kategori Peminjam</label>
              <select
                value={borrowerRole}
                onChange={(e) => handleBorrowerRoleChange(e.target.value as AssetBorrowerRole)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-semibold"
              >
                <option value="Guru / Staff">Guru / Staff</option>
                <option value="Santri">Santri</option>
                <option value="Unit Kelas">Unit Kelas</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Peminjam *</label>
              {borrowerRole === 'Guru / Staff' ? (
                <select
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-semibold"
                >
                  {database.master_guru.map((g) => (
                    <option key={g.id_tutor} value={g.guru}>
                      {g.guru}
                    </option>
                  ))}
                </select>
              ) : borrowerRole === 'Santri' ? (
                <select
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-semibold"
                >
                  {database.master_siswa.map((s) => (
                    <option key={s.siswa} value={s.siswa}>
                      {s.siswa} ({s.cabang})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-semibold"
                >
                  {database.master_kelas.map((k) => {
                    const label = `${k.kelas} (${k.mapel})`;
                    return (
                      <option key={k.id_kelas} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tanggal Pinjam</label>
              <input
                type="date"
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Rencana Kembali</label>
              <input
                type="date"
                value={returnDueDate}
                onChange={(e) => setReturnDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={loanPurpose}
              onChange={(e) => setLoanPurpose(e.target.value)}
              placeholder="Keperluan peminjaman (contoh: Ujian CBT Pekan Ini / Praktikum Lab)..."
              className="flex-1 px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs"
              required
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLendingAsset(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Konfirmasi Peminjaman
              </button>
            </div>
          </div>
        </form>
      )}

      {/* INLINE DRAWER: PENGEMBALIAN PERANGKAT */}
      {returningAsset && (
        <form
          onSubmit={handleReturnSubmit}
          className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Pengembalian Perangkat: {returningAsset.nama_perangkat}
              </h3>
              <p className="text-xs text-slate-600">
                Peminjam saat ini: <strong>{returningAsset.peminjam_aktif}</strong> · SN:{' '}
                <span className="font-mono">{returningAsset.nomor_seri}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReturningAsset(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tanggal Kembali</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kondisi Saat Kembali</label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value as AssetCondition)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-semibold"
              >
                {ASSET_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Catatan Pemeriksaan</label>
              <input
                type="text"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="Lengkap / perlu perawatan..."
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReturningAsset(null)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sahkan Pengembalian</span>
            </button>
          </div>
        </form>
      )}

      {/* INLINE DRAWER: UBAH KONDISI & LOKASI */}
      {editingAsset && (
        <form
          onSubmit={handleEditSubmit}
          className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Perbarui Kondisi &amp; Lokasi: {editingAsset.nama_perangkat}
              </h3>
              <p className="text-xs text-slate-600 font-mono">
                SN: {editingAsset.nomor_seri} · {editingAsset.kode_inventaris}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingAsset(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kondisi Perangkat</label>
              <select
                value={editCondition}
                onChange={(e) => setEditCondition(e.target.value as AssetCondition)}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold"
              >
                {ASSET_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Status Ketersediaan</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AssetLoanStatus)}
                disabled={editingAsset.status_peminjaman === 'Dipinjam'}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold disabled:bg-slate-100"
              >
                {LOAN_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Lokasi Kampus</label>
              <select
                value={editCampus}
                onChange={(e) => setEditCampus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold"
              >
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Ruangan</label>
              <input
                type="text"
                value={editRoom}
                onChange={(e) => setEditRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Catatan kondisi / perbaikan..."
              className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* INLINE DRAWER: RIWAYAT PEMINJAMAN PERANGKAT */}
      {historyAsset && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Riwayat Peminjaman: {historyAsset.nama_perangkat}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                SN: {historyAsset.nomor_seri} · {historyAsset.riwayat_pinjam.length} catatan transaksi
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryAsset(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {historyAsset.riwayat_pinjam.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Perangkat ini belum pernah memiliki riwayat peminjaman.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 text-xs">
              {historyAsset.riwayat_pinjam.map((h) => (
                <div
                  key={h.id}
                  className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {h.peminjam}{' '}
                      <span className="font-normal text-slate-500">· {h.peran_peminjam}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">{h.keperluan}</div>
                  </div>
                  <div className="text-right font-mono tabular-nums text-[11px]">
                    <div className="text-slate-700">
                      Pinjam: {h.tanggal_pinjam} · Target: {h.rencana_kembali}
                    </div>
                    <div className={h.tanggal_kembali ? 'text-emerald-700 font-bold' : 'text-blue-700 font-bold'}>
                      {h.tanggal_kembali
                        ? `Dikembalikan ${h.tanggal_kembali} (${h.kondisi_kembali || 'Baik'})`
                        : 'Masih Dipinjam'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MAIN ASSET TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari perangkat, nomor seri (SN), ruangan..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
            >
              <option value="all">Semua Kampus</option>
              {campuses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | AssetCategory)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
            >
              <option value="all">Semua Kategori</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value as 'all' | AssetCondition)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
            >
              <option value="all">Semua Kondisi</option>
              {ASSET_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AssetLoanStatus)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
            >
              <option value="all">Semua Status</option>
              {LOAN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Perangkat</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Perangkat &amp; Kategori</th>
                <th className="px-4 py-3 font-semibold">Nomor Seri (SN)</th>
                <th className="px-4 py-3 font-semibold">Lokasi &amp; Ruangan</th>
                <th className="px-4 py-3 font-semibold">Kondisi</th>
                <th className="px-4 py-3 font-semibold">Status &amp; Peminjam</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada perangkat inventaris yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-900">{asset.nama_perangkat}</div>
                      <div className="text-[11px] text-slate-500">
                        {asset.kategori} · Perolehan <span className="font-mono">{asset.tanggal_perolehan}</span>
                      </div>
                      {asset.catatan && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {asset.catatan}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-900 tabular-nums">{asset.nomor_seri}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {asset.kode_inventaris}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{asset.ruangan}</div>
                      <div className="text-[11px] text-slate-500">{asset.lokasi_kampus}</div>
                    </td>

                    <td className={`px-4 py-3 whitespace-nowrap ${getConditionTextClass(asset.kondisi)}`}>
                      {asset.kondisi}
                    </td>

                    <td className="px-4 py-3">
                      <div className={getLoanStatusTextClass(asset.status_peminjaman)}>
                        {asset.status_peminjaman}
                      </div>
                      {asset.status_peminjaman === 'Dipinjam' && asset.peminjam_aktif && (
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          <span className="font-semibold text-slate-800">{asset.peminjam_aktif}</span>
                          {asset.rencana_kembali && (
                            <span className="font-mono text-slate-500"> · s/d {asset.rencana_kembali}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {asset.status_peminjaman === 'Tersedia' && (
                          <button
                            type="button"
                            onClick={() => openLendDrawer(asset)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Pinjamkan perangkat"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Pinjam</span>
                          </button>
                        )}
                        {asset.status_peminjaman === 'Dipinjam' && (
                          <button
                            type="button"
                            onClick={() => openReturnDrawer(asset)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Catat pengembalian"
                          >
                            <Download className="w-3 h-3" />
                            <span>Kembali</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditDrawer(asset)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Ubah kondisi & lokasi"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryAsset(asset)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Riwayat peminjaman"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        {asset.status_peminjaman !== 'Dipinjam' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Hapus perangkat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
