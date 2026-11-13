import React, { useState } from 'react';
import { initialAdabRecords } from '../../data/adabData';
import { StudentAdabRecord, ActiveUser } from '../../types';
import { useToast } from '../Toast';
import {
  Award,
  Star,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  MessageSquare,
} from 'lucide-react';

interface StudentAdabCharacterViewProps {
  currentUser: ActiveUser;
  studentName: string;
}

export function StudentAdabCharacterView({
  currentUser,
  studentName,
}: StudentAdabCharacterViewProps) {
  const { showToast } = useToast();
  const [adabLogs, setAdabLogs] = useState<StudentAdabRecord[]>(initialAdabRecords);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [newKategori, setNewKategori] = useState<StudentAdabRecord['kategori']>('Akhlak & Adab');
  const [newTipe, setNewTipe] = useState<'Poin Kebaikan (+)' | 'Catatan Disiplin (-)'>('Poin Kebaikan (+)');
  const [newPoin, setNewPoin] = useState<number>(10);
  const [newDeskripsi, setNewDeskripsi] = useState<string>('');

  // Filter logs for this student (or fallback to student)
  const studentLogs = adabLogs.filter(
    (l) => l.siswa.toLowerCase() === studentName.toLowerCase()
  );

  // Calculate Total Points
  const totalPoin = studentLogs.reduce((acc, curr) => acc + curr.poin, 80); // baseline 80
  const positivePoints = studentLogs.filter((l) => l.poin > 0).reduce((acc, curr) => acc + curr.poin, 0);
  const negativePoints = studentLogs.filter((l) => l.poin < 0).reduce((acc, curr) => acc + Math.abs(curr.poin), 0);

  // Determine Akhlak Rank
  const getRank = (score: number) => {
    if (score >= 90) return { title: 'Mumtaz Syar\'i (Bintang Utama)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (score >= 80) return { title: 'Jayyid Jiddan (Sangat Baik)', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    if (score >= 70) return { title: 'Jayyid (Cukup Baik)', color: 'text-amber-700 bg-amber-50 border-amber-300' };
    return { title: 'Perlu Bimbingan Khusus', color: 'text-rose-700 bg-rose-50 border-rose-300' };
  };

  const rank = getRank(totalPoin);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeskripsi.trim()) {
      showToast('Form Belum Lengkap', 'Tuliskan deskripsi tindakan adab/disiplin.', 'warning');
      return;
    }

    const calculatedPoin = newTipe === 'Catatan Disiplin (-)' ? -Math.abs(Number(newPoin)) : Math.abs(Number(newPoin));

    const newRecord: StudentAdabRecord = {
      id: `ADB-${Date.now().toString().slice(-4)}`,
      siswa: studentName,
      tanggal: new Date().toISOString().split('T')[0],
      kategori: newKategori,
      tipe: newTipe,
      poin: calculatedPoin,
      deskripsi: newDeskripsi,
      pencatat: currentUser.name,
    };

    setAdabLogs([newRecord, ...adabLogs]);
    setShowAddModal(false);
    setNewDeskripsi('');
    showToast('Pencatatan Karakter Berhasil', `Poin adab ${studentName} diperbarui.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Overview Score Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-emerald-200">
            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Pusat Karakter & Adab Santri AL-WILDAN 3 BSD CITY</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Portofolio Bintang Akhlak & Disiplin
          </h2>
          <p className="text-xs text-emerald-100 max-w-lg leading-relaxed">
            Pencatatan rekam jejak integritas, sopan santun, kebersihan adab majelis halaqah, serta kedisiplinan santri sehari-hari.
          </p>
        </div>

        {/* Score Dial */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-28 h-28 rounded-full bg-emerald-500/20 border-4 border-amber-400 flex flex-col items-center justify-center shadow-lg backdrop-blur-md">
            <span className="text-3xl font-black text-amber-300">{totalPoin}</span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-100">
              POIN AKHLAK
            </span>
          </div>
          <span className="mt-2 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
            {rank.title}
          </span>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Poin Kebaikan Terkumpul</span>
            <span className="text-xl font-black text-emerald-700">+{positivePoints} Pts</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Tingkat Kedisiplinan</span>
            <span className="text-xl font-black text-slate-800">
              {negativePoints === 0 ? '100% Bersih' : `-${negativePoints} Pts Evaluasi`}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Predikat Karakter</span>
            <span className="text-xs font-black text-blue-800 block">{rank.title}</span>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-600" />
          <span>Riwayat Catatan Adab & Prestasi</span>
        </h3>

        {/* Tutors and Admins can add records */}
        {(currentUser.role === 'tutor' || currentUser.role === 'admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Catatan Adab</span>
          </button>
        )}
      </div>

      {/* Log Feed */}
      <div className="space-y-3">
        {studentLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            Belum ada catatan adab khusus untuk santri ini.
          </div>
        ) : (
          studentLogs.map((log) => {
            const isPositive = log.poin >= 0;

            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-400 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
                      isPositive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isPositive ? `+${log.poin}` : log.poin}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {log.kategori}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.tanggal}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {log.tipe}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {log.deskripsi}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Dicatat oleh: <strong>{log.pencatat}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <span
                    className={`font-mono text-sm font-black px-3 py-1 rounded-xl ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isPositive ? `+${log.poin} Poin` : `${log.poin} Poin`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal for Tutor/Admin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Pencatatan Adab Santri: {studentName}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kategori
                </label>
                <select
                  value={newKategori}
                  onChange={(e) => setNewKategori(e.target.value as any)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Akhlak & Adab">Akhlak & Adab</option>
                  <option value="Ibadah Berjamaah">Ibadah Berjamaah</option>
                  <option value="Tahfidz & Bahasa">Tahfidz & Bahasa</option>
                  <option value="Kedisiplinan">Kedisiplinan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tipe Catatan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTipe('Poin Kebaikan (+)');
                      setNewPoin(10);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newTipe === 'Poin Kebaikan (+)'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Kebaikan (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTipe('Catatan Disiplin (-)');
                      setNewPoin(5);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newTipe === 'Catatan Disiplin (-)'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Disiplin (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jumlah Poin
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newPoin}
                  onChange={(e) => setNewPoin(Number(e.target.value))}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Keterangan Tindakan / Prestasi
                </label>
                <textarea
                  rows={3}
                  value={newDeskripsi}
                  onChange={(e) => setNewDeskripsi(e.target.value)}
                  placeholder="Contoh: Mengumandangkan adzan Dzuhur, membantu Asatidz merapikan kitab..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
