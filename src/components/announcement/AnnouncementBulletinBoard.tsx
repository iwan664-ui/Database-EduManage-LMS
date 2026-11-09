import React, { useState } from 'react';
import { initialAnnouncements } from '../../data/announcementData';
import { PengumumanItem, ActiveUser } from '../../types';
import { useToast } from '../Toast';
import {
  Bell,
  Pin,
  Calendar,
  Search,
  Filter,
  PlusCircle,
  Megaphone,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AnnouncementBulletinBoardProps {
  currentUser: ActiveUser;
}

export function AnnouncementBulletinBoard({ currentUser }: AnnouncementBulletinBoardProps) {
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<PengumumanItem[]>(initialAnnouncements);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Announcement Modal (Admin / Tutor)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newJudul, setNewJudul] = useState<string>('');
  const [newIsi, setNewIsi] = useState<string>('');
  const [newKategori, setNewKategori] = useState<PengumumanItem['kategori']>('Penting');
  const [newTarget, setNewTarget] = useState<PengumumanItem['target']>('Semua');
  const [newPinned, setNewPinned] = useState<boolean>(false);

  const isTutorOrAdmin = currentUser.role === 'tutor' || currentUser.role === 'admin';

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul.trim() || !newIsi.trim()) {
      showToast('Form Belum Lengkap', 'Lengkapi judul dan isi pengumuman.', 'warning');
      return;
    }

    const newItem: PengumumanItem = {
      id: `ANN-${Date.now().toString().slice(-4)}`,
      judul: newJudul,
      isi: newIsi,
      kategori: newKategori,
      tanggal: new Date().toISOString().split('T')[0],
      target: newTarget,
      penerbit: currentUser.name,
      isPinned: newPinned,
    };

    setAnnouncements([newItem, ...announcements]);
    setShowCreateModal(false);
    setNewJudul('');
    setNewIsi('');
    showToast('Pengumuman Diterbitkan', `Pengumuman "${newItem.judul}" telah disiarkan ke seluruh portal.`, 'success');
  };

  const filtered = announcements.filter((a) => {
    const matchCat = selectedCategory === 'all' || a.kategori === selectedCategory;
    const matchQ =
      a.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.isi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.penerbit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-orange-950 via-amber-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-xs font-bold text-orange-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Official Bulletin & Notification Broadcast System</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Papan Pengumuman & Agenda Lembaga Resmi
            </h2>
            <p className="text-xs text-orange-100 max-w-2xl leading-relaxed">
              Pusat siaran informasi akademik, jadwal tasmi' tahfidz akbar, pengumuman standar KKM 85, dan agenda kalender AL-WILDAN 29 Depok.
            </p>
          </div>

          {isTutorOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Pengumuman</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengumuman, agenda, atau penerbit..."
            className="w-full text-xs font-semibold rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Penting', 'Tahfidz', 'Akademik', 'Parenting'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-3xl border-2 p-6 sm:p-7 space-y-4 transition-all shadow-md ${
              item.isPinned
                ? 'border-orange-300 shadow-orange-500/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {item.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-900 text-[11px] font-black border border-orange-300">
                    <Pin className="w-3 h-3 text-orange-600 fill-orange-600" />
                    <span>DISEMATKAN</span>
                  </span>
                )}
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                    item.kategori === 'Penting'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : item.kategori === 'Tahfidz'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : item.kategori === 'Akademik'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                >
                  {item.kategori}
                </span>

                <span className="text-xs font-bold text-slate-500">
                  Target: <strong>{item.target}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{item.tanggal}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {item.judul}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {item.isi}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Diterbitkan oleh: <strong className="text-slate-800">{item.penerbit}</strong></span>
              </div>

              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Resmi AL-WILDAN 29
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Terbitkan Siaran Pengumuman Resmi
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  required
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  placeholder="Contoh: Jadwal Libur & Tasmi' Akbar..."
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={newKategori}
                    onChange={(e) => setNewKategori(e.target.value as any)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Penting">Penting</option>
                    <option value="Tahfidz">Tahfidz</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Parenting">Parenting</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Target Audiens
                  </label>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value as any)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Semua">Semua Warga Sekolah</option>
                    <option value="Santri & Walmur">Santri & Wali Murid</option>
                    <option value="Guru & Tutor">Khusus Guru & Tutor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Isi Surat / Redaksi Pengumuman Lengkap:
                </label>
                <textarea
                  rows={4}
                  required
                  value={newIsi}
                  onChange={(e) => setNewIsi(e.target.value)}
                  placeholder="Tuliskan isi pengumuman lengkap secara jelas dan formal..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="pinNotice" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Sematkan di baris paling atas (Pinned)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Siarkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
