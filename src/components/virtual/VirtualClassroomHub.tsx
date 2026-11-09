import React, { useState } from 'react';
import { initialVirtualSessions, initialForumDiscussions } from '../../data/virtualClassData';
import { VirtualSessionItem, ForumDiscussionItem, ForumReply, ActiveUser } from '../../types';
import { useToast } from '../Toast';
import {
  Video,
  Users,
  Clock,
  Calendar,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Sparkles,
  Send,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface VirtualClassroomHubProps {
  currentUser: ActiveUser;
}

export function VirtualClassroomHub({ currentUser }: VirtualClassroomHubProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sessions' | 'forum'>('sessions');
  const [sessions] = useState<VirtualSessionItem[]>(initialVirtualSessions);
  const [forumList, setForumList] = useState<ForumDiscussionItem[]>(initialForumDiscussions);

  // New Question Form State
  const [showAskModal, setShowAskModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newMapel, setNewMapel] = useState<string>('Tahfidz & Tajwid');
  const [newQuestion, setNewQuestion] = useState<string>('');

  // Active Discussion Expanded Reply Form
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(initialForumDiscussions[0]?.id || null);
  const [replyText, setReplyText] = useState<string>('');

  // Like question handler
  const handleLike = (forumId: string) => {
    setForumList((prev) =>
      prev.map((f) => (f.id === forumId ? { ...f, likes: f.likes + 1 } : f))
    );
    showToast('Apresiasi Terkirim', 'Anda menyukai pertanyaan diskusi ini.', 'info');
  };

  // Submit new forum question
  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuestion.trim()) {
      showToast('Form Belum Lengkap', 'Tuliskan judul dan pertanyaan Anda.', 'warning');
      return;
    }

    const newDisc: ForumDiscussionItem = {
      id: `FRM-${Date.now().toString().slice(-4)}`,
      penulis: currentUser.name,
      role: currentUser.role,
      mapel: newMapel,
      judul: newTitle,
      pertanyaan: newQuestion,
      tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
      likes: 1,
      isSolved: false,
      replies: [],
    };

    setForumList([newDisc, ...forumList]);
    setShowAskModal(false);
    setNewTitle('');
    setNewQuestion('');
    setExpandedDiscussionId(newDisc.id);
    showToast('Pertanyaan Dipublikasikan', 'Pertanyaan Anda berhasil diterbitkan di forum diskusi.', 'success');
  };

  // Submit reply to a discussion
  const handlePostReply = (forumId: string) => {
    if (!replyText.trim()) return;

    const newReply: ForumReply = {
      id: `REP-${Date.now().toString().slice(-4)}`,
      penulis: currentUser.name,
      role: currentUser.role,
      tanggal: new Date().toISOString().split('T')[0],
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isi: replyText,
      isGuruVerified: currentUser.role === 'tutor' || currentUser.role === 'admin',
    };

    setForumList((prev) =>
      prev.map((f) => (f.id === forumId ? { ...f, replies: [...f.replies, newReply] } : f))
    );

    setReplyText('');
    showToast('Tanggapan Terkirim', 'Jawaban Anda telah ditambahkan.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Virtual Classroom & Live Halaqah Ilmiah</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Ruang Kelas Virtual & Forum Tanya Jawab Asatidz
            </h2>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Tatap muka interaktif video conference terintegrasi, talaqqi online, serta forum diskusi keilmuan santri bersama dewan Asatidz AL-WILDAN 29 Depok.
            </p>
          </div>

          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Jadwal Kelas Virtual ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('forum')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'forum'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Forum Diskusi ({forumList.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-600" />
              <span>Agenda Kelas & Halaqah Virtual Aktif</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Platform: Google Meet & Zoom Berenkripsi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((sesi) => {
              const isLive = sesi.status === 'Sedang Berlangsung';

              return (
                <div
                  key={sesi.id}
                  className={`bg-white rounded-3xl border-2 p-6 flex flex-col justify-between space-y-4 transition-all shadow-md ${
                    isLive
                      ? 'border-emerald-500 shadow-emerald-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {sesi.mapel}
                      </span>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                          <span>LIVE SEKARANG</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          {sesi.status}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                      {sesi.judul}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sesi.deskripsi}
                    </p>

                    {/* Topics */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Fokus Pembahasan:
                      </span>
                      {sesi.topik_bahasan.map((topik, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-slate-700">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{topik}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 text-xs text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sesi.tanggal} ({sesi.waktu})</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Asatidz Pengampu: <strong>{sesi.guru}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <a
                      href={sesi.link_meet}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                        isLive
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>Masuk Ruang Kelas ({sesi.platform})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FORUM DISKUSI */}
      {activeTab === 'forum' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span>Forum Tanya Jawab & Diskusi Keilmuan</span>
            </h3>

            <button
              onClick={() => setShowAskModal(true)}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ajukan Pertanyaan Baru</span>
            </button>
          </div>

          {/* Discussion Threads */}
          <div className="space-y-5">
            {forumList.map((disc) => {
              const isExpanded = expandedDiscussionId === disc.id;

              return (
                <div
                  key={disc.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-7 space-y-4 hover:border-blue-400 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                        {disc.mapel}
                      </span>
                      {disc.isSolved && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Terjawab oleh Asatidz</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {disc.tanggal}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base font-extrabold text-slate-900">
                      {disc.judul}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {disc.pertanyaan}
                    </p>
                    <div className="text-xs text-slate-500 font-medium pt-1">
                      Ditanyakan oleh: <strong className="text-slate-800">{disc.penulis}</strong> ({disc.role.toUpperCase()})
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(disc.id)}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 hover:border-blue-400 text-slate-700 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                        <span>{disc.likes} Bermanfaat</span>
                      </button>

                      <button
                        onClick={() => setExpandedDiscussionId(isExpanded ? null : disc.id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>{disc.replies.length} Tanggapan</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Replies List */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">
                        Tanggapan & Penjelasan Asatidz:
                      </span>

                      {disc.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-4 rounded-2xl border space-y-1.5 text-xs ${
                            reply.isGuruVerified
                              ? 'bg-blue-50/70 border-blue-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900">{reply.penulis}</strong>
                              {reply.isGuruVerified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Asatidz Terverifikasi</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {reply.tanggal} {reply.waktu}
                            </span>
                          </div>

                          <p className="text-slate-700 leading-relaxed font-medium">
                            {reply.isi}
                          </p>
                        </div>
                      ))}

                      {/* Reply Input Box */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tuliskan jawaban atau tanggapan Anda..."
                          className="flex-1 text-xs font-medium rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePostReply(disc.id);
                          }}
                        />
                        <button
                          onClick={() => handlePostReply(disc.id)}
                          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ASK QUESTION MODAL */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Ajukan Pertanyaan ke Forum Diskusi
              </h3>
              <button
                onClick={() => setShowAskModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostQuestion} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mata Pelajaran
                </label>
                <select
                  value={newMapel}
                  onChange={(e) => setNewMapel(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Tahfidz & Tajwid">Tahfidz & Tajwid</option>
                  <option value="Matematika Wajib">Matematika Wajib</option>
                  <option value="Bahasa Inggris & TOEFL">Bahasa Inggris & TOEFL</option>
                  <option value="Fiqih & Adab">Fiqih & Adab</option>
                  <option value="Cambridge Science">Cambridge Science</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Judul Topik Diskusi
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Pertanyaan seputar mad badal..."
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Uraian Pertanyaan Lengkap
                </label>
                <textarea
                  rows={4}
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Tuliskan pertanyaan Anda dengan jelas dan santun..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Publikasikan Pertanyaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
