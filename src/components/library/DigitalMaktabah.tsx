import React, { useState, useRef } from 'react';
import { murottalList, haditsArbainList, eModulList } from '../../data/maktabahData';
import { MurottalItem, HaditsArbainItem, EModulItem } from '../../types';
import { useToast } from '../Toast';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  Search,
  FileText,
  Download,
  Share2,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Compass,
} from 'lucide-react';

export function DigitalMaktabah() {
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'murottal' | 'hadits' | 'modul'>('murottal');
  const [selectedSurah, setSelectedSurah] = useState<MurottalItem>(murottalList[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Search & Filters
  const [haditsSearch, setHaditsSearch] = useState<string>('');
  const [modulCategory, setModulCategory] = useState<string>('all');
  const [previewModul, setPreviewModul] = useState<EModulItem | null>(null);

  // Toggle Audio Play/Pause
  const togglePlaySurah = (surah: MurottalItem) => {
    if (selectedSurah.nomorSurah === surah.nomorSurah && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      setSelectedSurah(surah);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = surah.audioUrl;
        audioRef.current.play().catch(() => {
          showToast('Audio Streaming', 'Gagal memutar audio. Pastikan perangkat terkoneksi internet.', 'warning');
        });
      }
      showToast('Memutar Murottal', `Surah ${surah.namaSurah} (${surah.asmaArab}) - Qari: Misyari Rasyid Alafasy`, 'info');
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(prog);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
  };

  // Filtered Hadits
  const filteredHadits = haditsArbainList.filter((h) => {
    const q = haditsSearch.toLowerCase();
    return (
      h.judul.toLowerCase().includes(q) ||
      h.terjemahan.toLowerCase().includes(q) ||
      h.perawi.toLowerCase().includes(q)
    );
  });

  // Filtered Modul
  const filteredModul = eModulList.filter((m) => {
    if (modulCategory === 'all') return true;
    return m.kategori === modulCategory;
  });

  return (
    <div className="space-y-6">
      {/* Hidden Audio Element for Murottal Player */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Digital Maktabah & E-Learning Center AL-WILDAN 29</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Perpustakaan Digital, Murottal 30 Juz & Hadits
            </h2>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Pusat referensi pembelajaran terintegrasi: audio tilawah tartil Al-Qur'an, syarah Hadits Arbain An-Nawawi, dan modul akademik kurikulum Al-Wildan.
            </p>
          </div>

          {/* Quick Sub-Tab Selector */}
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 gap-1 shrink-0">
            <button
              onClick={() => setActiveSubTab('murottal')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'murottal'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Murottal Audio
            </button>
            <button
              onClick={() => setActiveSubTab('hadits')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'hadits'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Hadits Arbain
            </button>
            <button
              onClick={() => setActiveSubTab('modul')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'modul'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              E-Modul Silabus
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: MUROTTAL 30 JUZ */}
      {activeSubTab === 'murottal' && (
        <div className="space-y-6">
          {/* Active Audio Player Banner */}
          <div className="bg-white rounded-3xl border-2 border-emerald-300 shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-serif text-2xl shadow-md shrink-0">
                {selectedSurah.asmaArab}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Surah ke-{selectedSurah.nomorSurah} · {selectedSurah.tempatTurun}
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedSurah.namaSurah} ({selectedSurah.arti})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedSurah.jumlahAyat} Ayat · Qari: Syaikh Misyari Rasyid Alafasy
                </p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-center">
              <button
                onClick={() => togglePlaySurah(selectedSurah)}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>

              <div className="space-y-1 w-full md:w-48">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>{isPlaying ? 'Memutar Suara' : 'Siap Diputar'}</span>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Surah List Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {murottalList.map((surah) => {
              const isCurrent = selectedSurah.nomorSurah === surah.nomorSurah;

              return (
                <div
                  key={surah.nomorSurah}
                  className={`bg-white rounded-2xl p-4 border-2 transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                    isCurrent
                      ? 'border-emerald-600 shadow-md bg-emerald-50/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                  onClick={() => togglePlaySurah(surah)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {surah.nomorSurah}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {surah.namaSurah}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {surah.jumlahAyat} Ayat · {surah.arti}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg text-slate-700">{surah.asmaArab}</span>
                    <button
                      className={`p-2 rounded-xl transition-all ${
                        isCurrent && isPlaying
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                      }`}
                    >
                      {isCurrent && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HADITS ARBAIN AN-NAWAWI */}
      {activeSubTab === 'hadits' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={haditsSearch}
                onChange={(e) => setHaditsSearch(e.target.value)}
                placeholder="Cari tema, terjemahan, atau perawi..."
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredHadits.length} Hadits Pilihan
            </span>
          </div>

          {/* Hadits List */}
          <div className="space-y-6">
            {filteredHadits.map((hadits) => (
              <div
                key={hadits.nomor}
                className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-7 space-y-4"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-200">
                      HADITS KE-{hadits.nomor}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">{hadits.judul}</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    {hadits.perawi}
                  </span>
                </div>

                {/* Arabic Text */}
                <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-right">
                  <p className="font-serif text-lg sm:text-xl text-slate-900 leading-loose">
                    {hadits.teksArab}
                  </p>
                </div>

                {/* Indonesian Translation */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Terjemahan:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    "{hadits.terjemahan}"
                  </p>
                  <p className="text-[11px] text-slate-400 italic pt-1">
                    Sumber: {hadits.perawi}
                  </p>
                </div>

                {/* Key Lessons / Faedah */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Faedah & Pelajaran Hadits untuk Santri:</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {hadits.faedah.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: E-MODUL & SILABUS */}
      {activeSubTab === 'modul' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Semua Modul' },
              { id: 'Islamic & Tahfidz', label: 'Tahfidz & Tajwid' },
              { id: 'Cambridge Science', label: 'Cambridge Math & Science' },
              { id: 'Bahasa Arab & Inggris', label: 'Bahasa Arab & Inggris' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setModulCategory(cat.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modulCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModul.map((modul) => (
              <div
                key={modul.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500 hover:shadow-xl transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {modul.kategori}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {modul.halaman} Halaman
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {modul.judul}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {modul.deskripsi}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{modul.tingkat}</span>
                    <span className="font-medium text-slate-700">{modul.penulis}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setPreviewModul(modul)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Buka Lembar Modul</span>
                  </button>

                  <button
                    onClick={() => {
                      showToast('Mengunduh Modul', `File PDF ${modul.judul} siap diunduh.`, 'success');
                    }}
                    className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    title="Unduh Modul PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal for Modul */}
      {previewModul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  {previewModul.kategori}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {previewModul.judul}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModul(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs leading-relaxed text-slate-700 max-h-80 overflow-y-auto">
              <p className="font-bold text-slate-900 text-sm">
                Sinopsis & Silabus Modul:
              </p>
              <p>{previewModul.deskripsi}</p>
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 font-medium">
                <div>• Jenjang: <strong>{previewModul.tingkat}</strong></div>
                <div>• Penyusun: <strong>{previewModul.penulis}</strong></div>
                <div>• Jumlah Bab: <strong>{previewModul.halaman} Halaman Terstruktur</strong></div>
                <div>• Terintegrasi dengan: <strong>Standar Evaluasi KKM 85 Al-Wildan</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewModul(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  showToast('Modul Digital', 'Modul berhasil dimuat ke perangkat belajar santri.', 'success');
                  setPreviewModul(null);
                }}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Simpan Offline & Buka</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
