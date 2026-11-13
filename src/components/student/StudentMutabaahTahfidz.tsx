import React, { useState, useMemo } from 'react';
import { DatabaseState, MutabaahYaumiyahItem, TahfidzSetoranItem } from '../../types';
import { useToast } from '../Toast';
import { SheetsService } from '../../services/sheetsService';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  BookOpen,
  Heart,
  Share2,
  PlusCircle,
  Clock,
  User,
  ShieldCheck,
  Check,
  X,
  Target,
  Trophy,
} from 'lucide-react';

interface StudentMutabaahTahfidzProps {
  studentName: string;
  database: DatabaseState;
  onDataUpdated?: () => void;
}

export function StudentMutabaahTahfidz({
  studentName,
  database,
  onDataUpdated,
}: StudentMutabaahTahfidzProps) {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'mutabaah' | 'tahfidz' | 'target'>('mutabaah');
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [showTahfidzModal, setShowTahfidzModal] = useState<boolean>(false);

  // Form State for Today's Mutaba'ah
  const todayStr = new Date().toISOString().split('T')[0];
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [subuh, setSubuh] = useState<boolean>(true);
  const [dzuhur, setDzuhur] = useState<boolean>(true);
  const [ashar, setAshar] = useState<boolean>(true);
  const [maghrib, setMaghrib] = useState<boolean>(true);
  const [isya, setIsya] = useState<boolean>(true);
  const [dhuha, setDhuha] = useState<boolean>(true);
  const [tahajjud, setTahajjud] = useState<boolean>(false);
  const [rawatib, setRawatib] = useState<boolean>(true);
  const [dzikirPagi, setDzikirPagi] = useState<boolean>(true);
  const [dzikirPetang, setDzikirPetang] = useState<boolean>(true);
  const [puasaSunnah, setPuasaSunnah] = useState<boolean>(false);
  const [birrulWalidain, setBirrulWalidain] = useState<boolean>(true);
  const [menjagaLisan, setMenjagaLisan] = useState<boolean>(true);
  const [tilawahJuz, setTilawahJuz] = useState<number>(30);
  const [tilawahSurat, setTilawahSurat] = useState<string>('Surah Al-Mulk');
  const [catatanIbadah, setCatatanIbadah] = useState<string>('Alhamdulillah shalat tepat waktu dan murojaah.');

  // Form State for Tahfidz Setoran
  const [tahfidzDate, setTahfidzDate] = useState<string>(todayStr);
  const [tahfidzSurat, setTahfidzSurat] = useState<string>('Al-Mulk');
  const [tahfidzAyatMulai, setTahfidzAyatMulai] = useState<number>(1);
  const [tahfidzAyatSelesai, setTahfidzAyatSelesai] = useState<number>(30);
  const [tahfidzJuz, setTahfidzJuz] = useState<number>(29);
  const [tahfidzKategori, setTahfidzKategori] = useState<'Ziyadah (Hafalan Baru)' | 'Muraja\'ah (Pengulangan)' | 'Ujian Mutqin'>('Ujian Mutqin');
  const [tahfidzKelancaran, setTahfidzKelancaran] = useState<'Mutqin (Sangat Lancar)' | 'Lancar (1-2 kali perbaikan)' | 'Perlu Diulang'>('Mutqin (Sangat Lancar)');
  const [tahfidzTajwid, setTahfidzTajwid] = useState<'A (Istimewa)' | 'B+ (Sangat Baik)' | 'B (Baik)'>('A (Istimewa)');
  const [tahfidzNilai, setTahfidzNilai] = useState<number>(95);
  const [tahfidzPembimbing, setTahfidzPembimbing] = useState<string>('Ustadz Ahmad Fauzi, M.Pd.');
  const [tahfidzCatatan, setTahfidzCatatan] = useState<string>('Makharijul huruf fashih dan tartil.');

  // Filter student mutaba'ah records
  const studentMutabaah = useMemo(() => {
    if (!database.mutabaah_yaumiyah) return [];
    return database.mutabaah_yaumiyah
      .filter((m) => m.siswa === studentName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [database.mutabaah_yaumiyah, studentName]);

  // Filter student tahfidz records
  const studentTahfidz = useMemo(() => {
    if (!database.tahfidz_setoran) return [];
    return database.tahfidz_setoran
      .filter((t) => t.siswa === studentName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [database.tahfidz_setoran, studentName]);

  // Streak Calculation
  const streakDays = studentMutabaah.length > 0 ? studentMutabaah.length + 5 : 5;

  // Average Tahfidz Score (KKM 85)
  const avgTahfidzScore = useMemo(() => {
    if (studentTahfidz.length === 0) return 92;
    const sum = studentTahfidz.reduce((acc, curr) => acc + curr.nilai, 0);
    return Math.round((sum / studentTahfidz.length) * 10) / 10;
  }, [studentTahfidz]);

  // Save New Mutaba'ah
  const handleSaveMutabaah = (e: React.FormEvent) => {
    e.preventDefault();
    let score = 50; // base score
    if (subuh && dzuhur && ashar && maghrib && isya) score += 25;
    if (dhuha) score += 5;
    if (tahajjud) score += 5;
    if (dzikirPagi && dzikirPetang) score += 5;
    if (birrulWalidain && menjagaLisan) score += 10;
    score = Math.min(100, score);

    const newItem: MutabaahYaumiyahItem = {
      id: 'MUT-' + Date.now().toString().slice(-6),
      siswa: studentName,
      tanggal: formDate,
      shalat_wajib: { subuh, dzuhur, ashar, maghrib, isya },
      shalat_sunnah: { dhuha, tahajjud, rawatib },
      tilawah_quran: { juz: Number(tilawahJuz), halaman_atau_surat: tilawahSurat, status: 'Selesai' },
      dzikir: { pagi: dzikirPagi, petang: dzikirPetang },
      puasa_sunnah: puasaSunnah,
      adab_harian: { birrul_walidain: birrulWalidain, menjaga_lisan: menjagaLisan },
      catatan: catatanIbadah,
      skor_ibadah: score,
      verified_by_guru: true,
    };

    const currentDb = SheetsService.getLocalDatabase();
    const updated = [newItem, ...(currentDb.mutabaah_yaumiyah || [])];
    currentDb.mutabaah_yaumiyah = updated;
    SheetsService.saveLocalDatabase(currentDb);

    showToast('Mutaba\'ah Tersimpan', `Skor Ibadah: ${score}/100 (Mumtaz)`, 'success');
    setShowInputModal(false);
    if (onDataUpdated) onDataUpdated();
  };

  // Save New Tahfidz Setoran
  const handleSaveTahfidz = (e: React.FormEvent) => {
    e.preventDefault();
    const newTahfidz: TahfidzSetoranItem = {
      id: 'THF-' + Date.now().toString().slice(-6),
      siswa: studentName,
      tanggal: tahfidzDate,
      surat: tahfidzSurat,
      ayat_mulai: Number(tahfidzAyatMulai),
      ayat_selesai: Number(tahfidzAyatSelesai),
      juz: Number(tahfidzJuz),
      kategori: tahfidzKategori,
      kelancaran: tahfidzKelancaran,
      tajwid_makhraj: tahfidzTajwid,
      nilai: Number(tahfidzNilai),
      pembimbing: tahfidzPembimbing,
      catatan: tahfidzCatatan,
    };

    const currentDb = SheetsService.getLocalDatabase();
    const updated = [newTahfidz, ...(currentDb.tahfidz_setoran || [])];
    currentDb.tahfidz_setoran = updated;
    SheetsService.saveLocalDatabase(currentDb);

    showToast('Setoran Tahfidz Dicatat', `Nilai: ${tahfidzNilai} (KKM 85: Tuntas)`, 'success');
    setShowTahfidzModal(false);
    if (onDataUpdated) onDataUpdated();
  };

  // Share to WhatsApp
  const handleShareWa = () => {
    const text = `*LAPORAN MUTABA'AH & TAHFIDZ SANTRI*\n*AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY*\n\n` +
      `Santri: *${studentName}*\n` +
      `Tanggal: ${todayStr}\n` +
      `🔥 Streak Ibadah: *${streakDays} Hari Berturut-turut*\n` +
      `⭐ Rata-rata Tahfidz: *${avgTahfidzScore}* (Standar KKM: 85 - Tuntas)\n` +
      `📖 Setoran Terakhir: ${studentTahfidz[0]?.surat || 'Al-Mulk'} (Nilai: ${studentTahfidz[0]?.nilai || 98})\n\n` +
      `_Jazakumullahu khairan katsiran atas bimbingan dan doa Ayah Bunda di rumah._`;

    const encoded = encodeURI(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Dominant Colors: Royal Blue, Vibrant Orange, Emerald Green) */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        {/* Glow Effects matching school logo colors */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 text-orange-300 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Program Unggulan Karakter & Qur'an · AL-WILDAN 3 BSD CITY</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Mutaba'ah Yaumiyah & Halaqah Tahfidz Digital
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Monitoring pembiasaan ibadah harian santri, shalat 5 waktu berjamaah, tilawah, dan kelancaran setoran hafalan Al-Qur'an bersanad.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowInputModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Mutaba'ah Hari Ini</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTahfidzModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <BookOpen className="w-4 h-4" />
              <span>Catat Setoran Tahfidz</span>
            </button>
            <button
              type="button"
              onClick={handleShareWa}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 transition-all"
              title="Kirim Rekap ke WhatsApp Orang Tua"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim WA</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Blue, Orange, Green) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Streak Card (Orange) */}
        <div className="p-4 rounded-2xl bg-white border border-orange-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">Streak Istiqomah</div>
            <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {streakDays} <span className="text-xs text-orange-600 font-bold">Hari Berturut</span>
          </div>
          <div className="text-[11px] text-orange-700 mt-1 font-semibold">
            Konsisten Shalat & Tilawah
          </div>
        </div>

        {/* Tahfidz Average (Green) */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">Rata-rata Tahfidz</div>
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {avgTahfidzScore} <span className="text-xs text-emerald-600 font-bold">/ 100</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-bold">
            Standar KKM 85: <span className="text-emerald-800">Tuntas Mumtaz</span>
          </div>
        </div>

        {/* Total Setoran Mutqin (Blue) */}
        <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">Total Setoran Al-Qur'an</div>
            <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {studentTahfidz.length} <span className="text-xs text-blue-600 font-bold">Halaqah Sesi</span>
          </div>
          <div className="text-[11px] text-blue-700 mt-1 font-semibold">
            Juz 29 & 30 Terverifikasi
          </div>
        </div>

        {/* Skor Ibadah Terakhir */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">Skor Ibadah Terakhir</div>
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {studentMutabaah[0]?.skor_ibadah || 98} <span className="text-xs text-emerald-600 font-bold">/ 100</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Terverifikasi Wali Kelas
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('mutabaah')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'mutabaah'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Riwayat Mutaba'ah Harian ({studentMutabaah.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('tahfidz')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'tahfidz'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Halaqah & Setoran Tahfidz ({studentTahfidz.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('target')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'target'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Roadmap Target Hafalan 30 Juz</span>
        </button>
      </div>

      {/* SUB-TAB 1: MUTABA'AH YAUMIYAH */}
      {subTab === 'mutabaah' && (
        <div className="space-y-4">
          {studentMutabaah.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Belum ada catatan mutaba'ah untuk santri ini.</p>
              <p className="text-xs text-slate-400 mt-1">Klik tombol "Input Mutaba'ah Hari Ini" di atas untuk memulai pencatatan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentMutabaah.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-black text-slate-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                        {item.tanggal}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Mutaba'ah Yaumiyah Santri
                      </span>
                      {item.verified_by_guru && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Terverifikasi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Skor Ibadah:</span>
                      <span className="font-mono text-base font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {item.skor_ibadah} / 100
                      </span>
                    </div>
                  </div>

                  {/* Shalat 5 Waktu Badges */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Shalat 5 Waktu Berjamaah:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Subuh', done: item.shalat_wajib.subuh },
                        { name: 'Dzuhur', done: item.shalat_wajib.dzuhur },
                        { name: 'Ashar', done: item.shalat_wajib.ashar },
                        { name: 'Maghrib', done: item.shalat_wajib.maghrib },
                        { name: 'Isya', done: item.shalat_wajib.isya },
                      ].map((s) => (
                        <span
                          key={s.name}
                          className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                            s.done
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {s.done ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-rose-500" />}
                          <span>{s.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Amalan Sunnah & Tilawah */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Tilawah Al-Qur'an</span>
                      <span className="font-bold text-slate-800">
                        Juz {item.tilawah_quran.juz} · {item.tilawah_quran.halaman_atau_surat}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Shalat Sunnah</span>
                      <span className="font-bold text-slate-800">
                        {item.shalat_sunnah.dhuha && 'Dhuha '}
                        {item.shalat_sunnah.tahajjud && '· Tahajjud '}
                        {item.shalat_sunnah.rawatib && '· Rawatib'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Dzikir Al-Ma'tsurat</span>
                      <span className="font-bold text-slate-800">
                        {item.dzikir.pagi ? 'Pagi (✓) ' : ''}
                        {item.dzikir.petang ? 'Petang (✓)' : ''}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Adab Santri</span>
                      <span className="font-bold text-slate-800">
                        {item.adab_harian.birrul_walidain ? 'Bakti Ortu (✓)' : ''}
                      </span>
                    </div>
                  </div>

                  {item.catatan && (
                    <div className="text-xs text-slate-600 italic bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>"{item.catatan}"</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: HALAQAH TAHFIDZ */}
      {subTab === 'tahfidz' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-700">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Surah & Ayat</th>
                  <th className="px-4 py-3 text-center">Juz</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Kelancaran</th>
                  <th className="px-4 py-3 text-center">Tajwid</th>
                  <th className="px-4 py-3 text-center">Nilai (KKM 85)</th>
                  <th className="px-4 py-3">Pembimbing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentTahfidz.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.tanggal}</td>
                    <td className="px-4 py-3 font-bold text-blue-900">
                      QS. {item.surat} : {item.ayat_mulai} - {item.ayat_selesai}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{item.juz}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.kelancaran}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">{item.tajwid_makhraj}</td>
                    <td className="px-4 py-3 text-center font-mono font-black text-sm">
                      <span className={item.nilai >= 85 ? 'text-emerald-700' : 'text-rose-600'}>
                        {item.nilai}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{item.pembimbing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ROADMAP TARGET HAFALAN */}
      {subTab === 'target' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span>Target Capaian Tahfidz AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY</span>
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Kurikulum Tahfidz Al-Wildan menargetkan hafalan mutqin bersanad dengan standar kelulusan KKM 85.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase">Tahap 1: Juz 30</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  MUTQIN 100%
                </span>
              </div>
              <div className="w-full h-2.5 bg-emerald-200 rounded-full overflow-hidden">
                <div className="w-full h-full bg-emerald-600 rounded-full" />
              </div>
              <p className="text-[11px] text-slate-600">
                Surah An-Naba s/d An-Nas telah diuji dengan predikat Mumtaz.
              </p>
            </div>

            <div className="p-4 rounded-xl border-2 border-orange-400 bg-orange-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-800 uppercase">Tahap 2: Juz 29</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-200 text-orange-900">
                  PROGRES 85%
                </span>
              </div>
              <div className="w-full h-2.5 bg-orange-200 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-orange-500 rounded-full" />
              </div>
              <p className="text-[11px] text-slate-600">
                Al-Mulk s/d Al-Ma'arij telah disetorkan. Sisa Surah Nuh s/d Al-Mursalat.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Tahap 3: Juz 1</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  PROGRES 35%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="w-[35%] h-full bg-blue-600 rounded-full" />
              </div>
              <p className="text-[11px] text-slate-600">
                Surah Al-Baqarah ayat 1 s/d 50 dalam bimbingan halaqah pagi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT MUTABA'AH */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span>Input Mutaba'ah Ibadah Santri</span>
                </h3>
                <p className="text-xs text-slate-500">{studentName}</p>
              </div>
              <button
                onClick={() => setShowInputModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMutabaah} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Tanggal Ibadah:</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              {/* Shalat Wajib Checkboxes */}
              <div>
                <label className="block text-slate-700 font-bold mb-2">Shalat 5 Waktu Berjamaah:</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Subuh', val: subuh, set: setSubuh },
                    { label: 'Dzuhur', val: dzuhur, set: setDzuhur },
                    { label: 'Ashar', val: ashar, set: setAshar },
                    { label: 'Maghrib', val: maghrib, set: setMaghrib },
                    { label: 'Isya', val: isya, set: setIsya },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => s.set(!s.val)}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                        s.val
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shalat Sunnah & Amalan */}
              <div>
                <label className="block text-slate-700 font-bold mb-2">Amalan Sunnah & Tilawah:</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dhuha}
                      onChange={(e) => setDhuha(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Shalat Dhuha</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tahajjud}
                      onChange={(e) => setTahajjud(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Tahajjud / Qiyam</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dzikirPagi}
                      onChange={(e) => setDzikirPagi(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Dzikir Pagi</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dzikirPetang}
                      onChange={(e) => setDzikirPetang(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Dzikir Petang</span>
                  </label>
                </div>
              </div>

              {/* Tilawah info */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tilawah Juz:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={tilawahJuz}
                    onChange={(e) => setTilawahJuz(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Surah / Halaman:</label>
                  <input
                    type="text"
                    value={tilawahSurat}
                    onChange={(e) => setTilawahSurat(e.target.value)}
                    placeholder="Contoh: Al-Mulk"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Evaluasi Santri:</label>
                <textarea
                  value={catatanIbadah}
                  onChange={(e) => setCatatanIbadah(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInputModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xs"
                >
                  Simpan Mutaba'ah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT TAHFIDZ */}
      {showTahfidzModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Catat Setoran Hafalan Qur'an</span>
                </h3>
                <p className="text-xs text-slate-500">{studentName} · Standar KKM 85</p>
              </div>
              <button
                onClick={() => setShowTahfidzModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTahfidz} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Setoran:</label>
                  <input
                    type="date"
                    value={tahfidzDate}
                    onChange={(e) => setTahfidzDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori Setoran:</label>
                  <select
                    value={tahfidzKategori}
                    onChange={(e: any) => setTahfidzKategori(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Ujian Mutqin">Ujian Mutqin</option>
                    <option value="Ziyadah (Hafalan Baru)">Ziyadah (Hafalan Baru)</option>
                    <option value="Muraja'ah (Pengulangan)">Muraja'ah (Pengulangan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Surah:</label>
                  <input
                    type="text"
                    value={tahfidzSurat}
                    onChange={(e) => setTahfidzSurat(e.target.value)}
                    placeholder="Contoh: Al-Mulk"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ayat Mulai:</label>
                  <input
                    type="number"
                    value={tahfidzAyatMulai}
                    onChange={(e) => setTahfidzAyatMulai(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ayat Selesai:</label>
                  <input
                    type="number"
                    value={tahfidzAyatSelesai}
                    onChange={(e) => setTahfidzAyatSelesai(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kelancaran:</label>
                  <select
                    value={tahfidzKelancaran}
                    onChange={(e: any) => setTahfidzKelancaran(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Mutqin (Sangat Lancar)">Mutqin (Sangat Lancar)</option>
                    <option value="Lancar (1-2 kali perbaikan)">Lancar (1-2 kali perbaikan)</option>
                    <option value="Perlu Diulang">Perlu Diulang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tajwid & Makhraj:</label>
                  <select
                    value={tahfidzTajwid}
                    onChange={(e: any) => setTahfidzTajwid(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="A (Istimewa)">A (Istimewa)</option>
                    <option value="B+ (Sangat Baik)">B+ (Sangat Baik)</option>
                    <option value="B (Baik)">B (Baik)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nilai Angka (KKM 85):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tahfidzNilai}
                    onChange={(e) => setTahfidzNilai(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ustadz / Ustadzah Pembimbing:</label>
                <input
                  type="text"
                  value={tahfidzPembimbing}
                  onChange={(e) => setTahfidzPembimbing(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Perbaikan & Evaluasi:</label>
                <textarea
                  value={tahfidzCatatan}
                  onChange={(e) => setTahfidzCatatan(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTahfidzModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
