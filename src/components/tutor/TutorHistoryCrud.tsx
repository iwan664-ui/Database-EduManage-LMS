import React, { useState } from 'react';
import { ActiveUser, DatabaseState, KehadiranStatus, LogAbsensi, LogNilai } from '../../types';
import { SheetsService } from '../../services/sheetsService';
import { useToast } from '../Toast';
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  Filter,
  X,
  Save,
  AlertTriangle,
  History,
  BookOpen,
  Download,
} from 'lucide-react';

interface TutorHistoryCrudProps {
  user: ActiveUser;
  database: DatabaseState;
  onDataChanged: () => void;
}

export function TutorHistoryCrud({ user, database, onDataChanged }: TutorHistoryCrudProps) {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'absensi' | 'nilai'>('absensi');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Edit State
  const [editingAbsensi, setEditingAbsensi] = useState<LogAbsensi | null>(null);
  const [editingNilai, setEditingNilai] = useState<LogNilai | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<{ type: 'absensi' | 'nilai'; id: string } | null>(null);

  // Classes list
  const tutorClasses = database.master_kelas.filter(
    (k) => k.guru.toLowerCase().trim() === user.name.toLowerCase().trim()
  );
  const displayClasses = tutorClasses.length > 0 ? tutorClasses : database.master_kelas;

  // Filter Absensi
  const filteredAbsensi = database.log_absensi.filter((item) => {
    const matchesClass =
      selectedClassFilter === 'all' ? true : item.id_kelas === selectedClassFilter;
    const matchesSearch =
      item.siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id_absensi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Filter Nilai
  const filteredNilai = database.log_nilai.filter((item) => {
    const matchesClass =
      selectedClassFilter === 'all' ? true : item.id_kelas === selectedClassFilter;
    const matchesSearch =
      item.siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenis_penilaian.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Handle Edit Absensi Save
  const handleSaveEditAbsensi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAbsensi) return;

    setIsProcessing(true);
    const res = await SheetsService.updateAbsensi(editingAbsensi);
    setIsProcessing(false);

    if (res.success) {
      showToast('Presensi Diperbarui', res.message, 'success');
      setEditingAbsensi(null);
      onDataChanged();
    } else {
      showToast('Gagal Memperbarui', res.message, 'error');
    }
  };

  // Handle Edit Nilai Save
  const handleSaveEditNilai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNilai) return;

    setIsProcessing(true);
    const res = await SheetsService.updateNilai(editingNilai);
    setIsProcessing(false);

    if (res.success) {
      showToast('Nilai Diperbarui', res.message, 'success');
      setEditingNilai(null);
      onDataChanged();
    } else {
      showToast('Gagal Memperbarui', res.message, 'error');
    }
  };

  // Handle Delete Confirm
  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setIsProcessing(true);
    if (deletingId.type === 'absensi') {
      const res = await SheetsService.deleteAbsensi(deletingId.id);
      setIsProcessing(false);
      if (res.success) {
        showToast('Presensi Dihapus', res.message, 'success');
        setDeletingId(null);
        onDataChanged();
      } else {
        showToast('Gagal Menghapus', res.message, 'error');
      }
    } else {
      const res = await SheetsService.deleteNilai(deletingId.id);
      setIsProcessing(false);
      if (res.success) {
        showToast('Data Nilai Dihapus', res.message, 'success');
        setDeletingId(null);
        onDataChanged();
      } else {
        showToast('Gagal Menghapus', res.message, 'error');
      }
    }
  };

  const handleExportCsv = () => {
    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const dateStr = new Date().toISOString().split('T')[0];
    let filename = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeSubTab === 'absensi') {
      if (filteredAbsensi.length === 0) {
        showToast('Data Kosong', 'Tidak ada data absensi untuk diekspor.', 'error');
        return;
      }
      filename = `Riwayat_Absensi_${selectedClassFilter !== 'all' ? selectedClassFilter : 'SemuaKelas'}_${dateStr}.csv`;
      headers = ['ID Absensi', 'Tanggal', 'ID Kelas', 'Nama Siswa', 'Status Kehadiran', 'ID Tutor', 'Waktu Input'];
      rows = filteredAbsensi.map((item) => [
        item.id_absensi,
        item.tanggal,
        item.id_kelas,
        item.siswa,
        item.status_kehadiran,
        item.id_tutor,
        item.timestamp,
      ]);
    } else {
      if (filteredNilai.length === 0) {
        showToast('Data Kosong', 'Tidak ada data nilai untuk diekspor.', 'error');
        return;
      }
      filename = `Riwayat_Nilai_${selectedClassFilter !== 'all' ? selectedClassFilter : 'SemuaKelas'}_${dateStr}.csv`;
      headers = ['ID Nilai', 'Tanggal', 'ID Kelas', 'Nama Siswa', 'Mata Pelajaran', 'Jenis Penilaian', 'Nilai', 'Catatan', 'ID Tutor', 'Waktu Input'];
      rows = filteredNilai.map((item) => [
        item.id_nilai,
        item.tanggal,
        item.id_kelas,
        item.siswa,
        item.mapel,
        item.jenis_penilaian,
        item.nilai,
        item.catatan || '',
        item.id_tutor,
        item.timestamp,
      ]);
    }

    const csvContent =
      '\uFEFF' +
      [
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Export Berhasil!', `File ${filename} (${rows.length} baris) berhasil diunduh.`, 'success');
  };

  const getStatusBadge = (status: KehadiranStatus) => {
    switch (status) {
      case 'Hadir':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Hadir</span>;
      case 'Izin':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800">Izin</span>;
      case 'Sakit':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Sakit</span>;
      case 'Alfa':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">Alfa</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Manajemen & Riwayat Data Input</h2>
            <p className="text-xs text-slate-500">
              Lihat, ubah (edit), atau hapus (delete) catatan presensi dan penilaian siswa.
            </p>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('absensi')}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'absensi'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Log Absensi ({filteredAbsensi.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('nilai')}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'nilai'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Log Nilai ({filteredNilai.length})</span>
            </button>
          </div>
        </div>

        {/* Filters & Export Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama siswa atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2 md:w-64">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Kelas ({displayClasses.length})</option>
              {displayClasses.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  {k.kelas} - {k.mapel}
                </option>
              ))}
            </select>
          </div>

          {/* Export to CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="py-2 px-3.5 rounded-xl border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
            title="Download data terfilter sebagai file CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV ({activeSubTab === 'absensi' ? filteredAbsensi.length : filteredNilai.length})</span>
          </button>
        </div>
      </div>

      {/* Content Table / Cards */}
      {activeSubTab === 'absensi' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {filteredAbsensi.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Tidak ada catatan presensi yang sesuai filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Kelas</th>
                    <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAbsensi.map((item) => (
                    <tr key={item.id_absensi} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{item.tanggal}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{item.id_kelas}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.siswa}</td>
                      <td className="px-4 py-3">{getStatusBadge(item.status_kehadiran)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingAbsensi(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Presensi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId({ type: 'absensi', id: item.id_absensi })}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Presensi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'nilai' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {filteredNilai.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Tidak ada data nilai yang sesuai filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Siswa & Kelas</th>
                    <th className="px-4 py-3 font-semibold">Kategori Penilaian</th>
                    <th className="px-4 py-3 font-semibold">Nilai</th>
                    <th className="px-4 py-3 font-semibold">Catatan</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNilai.map((item) => (
                    <tr key={item.id_nilai} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{item.tanggal}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.siswa}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.id_kelas}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.jenis_penilaian}
                        <span className="block text-[11px] text-blue-600">{item.mapel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg ${
                            item.nilai >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {item.nilai}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-500">
                        {item.catatan || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingNilai(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Nilai"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId({ type: 'nilai', id: item.id_nilai })}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Nilai"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Absensi Modal */}
      {editingAbsensi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Ubah Catatan Presensi</h3>
              <button onClick={() => setEditingAbsensi(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAbsensi} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Siswa</label>
                <input
                  type="text"
                  disabled
                  value={editingAbsensi.siswa}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-100 text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={editingAbsensi.tanggal}
                  onChange={(e) => setEditingAbsensi({ ...editingAbsensi, tanggal: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Kehadiran</label>
                <select
                  value={editingAbsensi.status_kehadiran}
                  onChange={(e) =>
                    setEditingAbsensi({
                      ...editingAbsensi,
                      status_kehadiran: e.target.value as KehadiranStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alfa">Alfa</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAbsensi(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Nilai Modal */}
      {editingNilai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Ubah Data Nilai Siswa</h3>
              <button onClick={() => setEditingNilai(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditNilai} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Siswa</label>
                <input
                  type="text"
                  disabled
                  value={editingNilai.siswa}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-100 text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editingNilai.tanggal}
                    onChange={(e) => setEditingNilai({ ...editingNilai, tanggal: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nilai (0 - 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingNilai.nilai}
                    onChange={(e) =>
                      setEditingNilai({ ...editingNilai, nilai: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Penilaian</label>
                <input
                  type="text"
                  value={editingNilai.jenis_penilaian}
                  onChange={(e) =>
                    setEditingNilai({ ...editingNilai, jenis_penilaian: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Feedback</label>
                <textarea
                  rows={2}
                  value={editingNilai.catatan}
                  onChange={(e) => setEditingNilai({ ...editingNilai, catatan: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingNilai(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Data</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan {deletingId.type} ini? Perubahan akan disinkronkan ke Google Sheets.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow"
              >
                {isProcessing ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
