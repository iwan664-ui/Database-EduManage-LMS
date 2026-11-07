import React, { useState, useEffect } from 'react';
import { cbtExamPackages } from '../../data/cbtData';
import { CbtExamPackage, CbtQuestion, ActiveUser, DatabaseState, LogNilai } from '../../types';
import { useToast } from '../Toast';
import {
  FileQuestion,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Sparkles,
  BarChart3,
  Send,
  Flag,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface CbtExamEngineProps {
  currentUser: ActiveUser;
  database: DatabaseState;
  onSaveResultToDatabase?: (newNilai: LogNilai) => void;
  isTutorView?: boolean;
}

export function CbtExamEngine({
  currentUser,
  database,
  onSaveResultToDatabase,
  isTutorView = false,
}: CbtExamEngineProps) {
  const { showToast } = useToast();

  const [selectedExam, setSelectedExam] = useState<CbtExamPackage>(cbtExamPackages[0]);
  const [examStatus, setExamStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // seconds
  const [examResult, setExamResult] = useState<{
    score: number;
    correctCount: number;
    total: number;
    isPass: boolean;
  } | null>(null);

  const [isSavedToLms, setIsSavedToLms] = useState<boolean>(false);

  // Timer countdown when exam is running
  useEffect(() => {
    if (examStatus !== 'running') return;

    if (timeLeft <= 0) {
      handleFinishExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examStatus, timeLeft]);

  // Start Exam
  const handleStartExam = (pkg: CbtExamPackage) => {
    setSelectedExam(pkg);
    setAnswers({});
    setFlagged({});
    setCurrentQuestionIndex(0);
    setTimeLeft(pkg.durasiMenit * 60);
    setExamResult(null);
    setIsSavedToLms(false);
    setExamStatus('running');
    showToast('Ujian Dimulai', `Paket: ${pkg.judul}. Waktu: ${pkg.durasiMenit} menit. Target KKM 85.`, 'info');
  };

  // Select Option
  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // Toggle Flag (Ragu-ragu)
  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Submit Exam
  const handleFinishExam = () => {
    let correct = 0;
    selectedExam.questions.forEach((q) => {
      if (answers[q.id] === q.kunci) {
        correct++;
      }
    });

    const total = selectedExam.questions.length;
    const score = Math.round((correct / total) * 100);
    const isPass = score >= selectedExam.kkm; // 85

    setExamResult({
      score,
      correctCount: correct,
      total,
      isPass,
    });
    setExamStatus('finished');

    if (isPass) {
      showToast('Mumtaz! Nilai Tuntas KKM', `Skor: ${score} (Standar KKM ${selectedExam.kkm})`, 'success');
    } else {
      showToast('Perlu Penguatan (Remedial)', `Skor: ${score}. Standar KKM adalah ${selectedExam.kkm}.`, 'warning');
    }
  };

  // Save score to LMS log_nilai
  const handleSaveToLms = () => {
    if (!examResult) return;

    const newNilai: LogNilai = {
      id_nilai: `NIL-CBT-${Date.now().toString().slice(-5)}`,
      tanggal: new Date().toISOString().split('T')[0],
      id_kelas: 'KLS-CBT-ONLINE',
      siswa: currentUser.role === 'siswa' ? currentUser.name : database.master_siswa[0]?.siswa || 'Santri Al-Wildan',
      mapel: selectedExam.mapel,
      jenis_penilaian: 'Ujian CBT Online',
      nilai: examResult.score,
      catatan: `Hasil CBT Online ${selectedExam.judul} - ${examResult.isPass ? 'TUNTAS KKM 85' : 'REMEDIAL'} (${examResult.correctCount}/${examResult.total} benar)`,
      id_tutor: 'TUTOR-CBT-SYS',
      timestamp: new Date().toISOString(),
    };

    if (onSaveResultToDatabase) {
      onSaveResultToDatabase(newNilai);
    } else {
      database.log_nilai.unshift(newNilai);
    }

    setIsSavedToLms(true);
    showToast('Tersimpan di LMS', `Nilai ${examResult.score} telah masuk ke buku nilai siswa.`, 'success');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = selectedExam.questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Computer-Based Test (CBT) Digital · Standar KKM 85</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pusat Evaluasi & Ujian CBT Interaktif
            </h2>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              Sistem ujian terstandarisasi dengan penilaian otomatis real-time, timer countdown, serta pembahasan komprehensif berpatokan KKM 85 AL-WILDAN 29 Depok.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono font-bold text-emerald-300">
              Target KKM: 85
            </span>
          </div>
        </div>
      </div>

      {/* STATE 1: IDLE - SELECT PACKAGE */}
      {examStatus === 'idle' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Pilihan Paket Ujian Tersedia</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {cbtExamPackages.length} Paket Ujian Siap Dikerjakan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cbtExamPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all p-5 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {pkg.mapel}
                    </span>
                    <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      KKM {pkg.kkm}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {pkg.judul}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pkg.instruksi}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <FileQuestion className="w-4 h-4 text-slate-400" />
                      <span>{pkg.totalSoal} Butir Soal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{pkg.durasiMenit} Menit</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5">
                  <button
                    onClick={() => handleStartExam(pkg)}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Mulai Ujian Sekarang</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATE 2: RUNNING - LIVE CBT TEST RUNNER */}
      {examStatus === 'running' && currentQ && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Panel */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            {/* Exam Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  {selectedExam.judul}
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Soal Nomor {currentQuestionIndex + 1} dari {selectedExam.questions.length}
                </h3>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 font-mono font-bold text-sm">
                <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
                <span>Sisa Waktu: {formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                {currentQ.pertanyaan}
              </p>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.pilihan.map((opt, optIdx) => {
                  const isSelected = answers[currentQ.id] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm font-medium text-slate-800 pt-0.5 leading-relaxed">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  flagged[currentQ.id]
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${flagged[currentQ.id] ? 'text-amber-600 fill-amber-600' : ''}`} />
                <span>{flagged[currentQ.id] ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu'}</span>
              </button>

              {currentQuestionIndex < selectedExam.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(selectedExam.questions.length - 1, prev + 1))}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinishExam}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Selesai & Kumpulkan</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Question Palette */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4 h-fit">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Navigasi Butir Soal
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {selectedExam.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flagged[q.id];

                let btnClass = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isAnswered) btnClass = 'bg-blue-600 text-white border-blue-600';
                if (isFlagged) btnClass = 'bg-amber-400 text-amber-950 border-amber-500';
                if (isCurrent) btnClass += ' ring-2 ring-offset-2 ring-blue-500 font-black';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span>Sudah Dijawab ({Object.keys(answers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-400" />
                <span>Ragu-ragu ({Object.values(flagged).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300" />
                <span>Belum Dijawab ({selectedExam.questions.length - Object.keys(answers).length})</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleFinishExam}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kumpulkan Ujian</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: FINISHED - RESULTS & PEMBAHASAN */}
      {examStatus === 'finished' && examResult && (
        <div className="space-y-6">
          {/* Result Score Card */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${
              examResult.isPass
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-300'
                : 'bg-gradient-to-br from-orange-50 via-amber-50 to-white border-orange-300'
            }`}
          >
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white border shadow-xs">
                {examResult.isPass ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-800">TUNTAS KKM 85 (MUMTAZ)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-800">REMEDIAL (PERLU PENGUATAN KKM 85)</span>
                  </>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {selectedExam.judul}
              </h3>

              <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                {examResult.isPass
                  ? `Alhamdulillah! Santri berhasil melampaui standar kelulusan KKM 85 dengan menjawab ${examResult.correctCount} dari ${examResult.total} soal dengan tepat.`
                  : `Santri memperoleh nilai ${examResult.score}. Standar KKM AL-WILDAN 29 adalah ${selectedExam.kkm}. Harap pelajari kembali pembahasan di bawah.`}
              </p>
            </div>

            {/* Big Score Dial */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 shadow-lg ${
                  examResult.isPass
                    ? 'bg-emerald-600 text-white border-emerald-300'
                    : 'bg-orange-500 text-white border-orange-300'
                }`}
              >
                <span className="text-3xl font-black">{examResult.score}</span>
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">
                  SKOR AKHIR
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 mt-2">
                KKM: {selectedExam.kkm} · Benar: {examResult.correctCount}/{examResult.total}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setExamStatus('idle')}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Pilih Paket Ujian Lain</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToLms}
                disabled={isSavedToLms}
                className={`py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  isSavedToLms
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSavedToLms ? 'Sudah Tersimpan di Rapor LMS' : 'Simpan Nilai ke Rapor Akademik'}</span>
              </button>
            </div>
          </div>

          {/* Detailed Question Review & Discussion (Pembahasan) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>Pembahasan Lengkap & Kunci Jawaban</span>
            </h4>

            <div className="space-y-4">
              {selectedExam.questions.map((q, idx) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.kunci;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border-2 space-y-3 ${
                      isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-white border text-slate-800">
                        Nomor {idx + 1}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? 'Jawaban Benar' : 'Jawaban Salah'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {q.pertanyaan}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Jawaban Anda:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {userAnswer !== undefined
                            ? `${String.fromCharCode(65 + userAnswer)}. ${q.pilihan[userAnswer]}`
                            : 'Tidak Dijawab'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">
                          Kunci Jawaban Benar:
                        </span>
                        <span className="font-bold text-emerald-800">
                          {String.fromCharCode(65 + q.kunci)}. {q.pilihan[q.kunci]}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block mb-1">Pembahasan:</strong>
                      <span>{q.pembahasan}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
