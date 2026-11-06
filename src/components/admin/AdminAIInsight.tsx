import React, { useState, useMemo } from 'react';
import { AIInsightResult, DatabaseState, MasterKelas } from '../../types';
import { useToast } from '../Toast';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  BookOpen,
  Calendar,
  Users,
  Award,
  RefreshCw,
} from 'lucide-react';

interface AdminAIInsightProps {
  database: DatabaseState;
}

export function AdminAIInsight({ database }: AdminAIInsightProps) {
  const { showToast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>(
    database.master_kelas[0]?.id_kelas || ''
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('Oktober');
  const [loading, setLoading] = useState<boolean>(false);
  const [insight, setInsight] = useState<AIInsightResult | null>(null);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const activeClass = useMemo(() => {
    return (
      database.master_kelas.find((k) => k.id_kelas === selectedClassId) ||
      database.master_kelas[0]
    );
  }, [database.master_kelas, selectedClassId]);

  // Students in active class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return database.siswa_kelas.filter((sk) => sk.id_kelas === activeClass.id_kelas);
  }, [database.siswa_kelas, activeClass]);

  // Aggregate Stats
  const { attendanceSummary, gradeSummary, studentsData } = useMemo(() => {
    if (!activeClass) {
      return { attendanceSummary: {}, gradeSummary: {}, studentsData: [] };
    }

    // Absensi
    const classAbs = database.log_absensi.filter((a) => a.id_kelas === activeClass.id_kelas);
    const hadir = classAbs.filter((a) => a.status_kehadiran === 'Hadir').length;
    const izin = classAbs.filter((a) => a.status_kehadiran === 'Izin').length;
    const sakit = classAbs.filter((a) => a.status_kehadiran === 'Sakit').length;
    const alfa = classAbs.filter((a) => a.status_kehadiran === 'Alfa').length;
    const hadirPercent = classAbs.length > 0 ? Math.round((hadir / classAbs.length) * 100) : 0;

    // Nilai
    const classGrades = database.log_nilai.filter((n) => n.id_kelas === activeClass.id_kelas);
    const nums = classGrades.map((g) => Number(g.nilai));
    const avg =
      nums.length > 0
        ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
        : 0;
    const highest = nums.length > 0 ? Math.max(...nums) : 0;
    const lowest = nums.length > 0 ? Math.min(...nums) : 0;
    const passCount = nums.filter((n) => n >= 75).length;
    const passRate = nums.length > 0 ? Math.round((passCount / nums.length) * 100) : 0;

    // Student overview
    const studentList = classStudents.map((s) => {
      const sGrades = classGrades.filter((g) => g.siswa === s.siswa).map((g) => Number(g.nilai));
      const sAvg =
        sGrades.length > 0
          ? Math.round((sGrades.reduce((a, b) => a + b, 0) / sGrades.length) * 10) / 10
          : 0;
      return {
        nama: s.siswa,
        rataRata: sAvg,
        daftarNilai: sGrades,
        status: sAvg >= 75 ? 'Tuntas' : 'Remedial',
      };
    });

    return {
      attendanceSummary: {
        total: classAbs.length,
        hadir,
        izin,
        sakit,
        alfa,
        hadirPercent,
      },
      gradeSummary: {
        average: avg,
        highest,
        lowest,
        passRate,
        totalEntries: classGrades.length,
      },
      studentsData: studentList,
    };
  }, [activeClass, classStudents, database.log_absensi, database.log_nilai]);

  // Request AI Insight
  const handleGenerateInsight = async () => {
    if (!activeClass) return;
    setLoading(true);

    try {
      const resp = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: activeClass.kelas,
          subject: activeClass.mapel,
          month: selectedMonth,
          year: 2026,
          attendanceSummary,
          gradeSummary,
          studentsData,
        }),
      });

      const data = await resp.json();
      setLoading(false);

      if (data.success && data.insight) {
        setInsight(data.insight);
        showToast('AI Insight Berhasil Dihasilkan!', 'Analisis tren dan saran pembelajaran siap ditinjau.', 'success');
      } else {
        showToast('Gagal Menghasilkan AI Insight', data.error || 'Periksa API Key Gemini.', 'error');
      }
    } catch (err: any) {
      setLoading(false);
      showToast('Terjadi Kesalahan', err.message || 'Gagal menghubungi server.', 'error');
    }
  };

  const copyInsightToClipboard = () => {
    if (!insight || !activeClass) return;
    const text = `📊 ANALISIS AKADEMIK & AI INSIGHT
AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK
Kelas: ${activeClass.kelas} - ${activeClass.mapel}
Periode: ${selectedMonth} 2026
Tutor: ${activeClass.guru}
Status Tren: ${insight.statusTrend}

📌 KESIMPULAN:
${insight.trendSummary}

✨ TEMUAN PENTING:
${insight.keyHighlights.map((k) => `• ${k}`).join('\n')}

🏆 SISWA BERPRESTASI:
${insight.topAchievers.map((t) => `• ${t}`).join('\n')}

⚠️ PERLU REMEDIAL / BIMBINGAN:
${insight.needsAttention.map((n) => `• ${n}`).join('\n')}

💡 REKOMENDASI TAKTIS:
${insight.actionableRecommendations.map((r) => `• ${r}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    showToast('Ringkasan Disalin ke Clipboard!', 'Siap dibagikan ke WhatsApp grup pengajar atau pimpinan.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-2xl p-5 md:p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              AL-WILDAN 29 KOTA DEPOK · Gemini Academic Analytics
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Auto AI Insight Evaluasi Nilai Bulanan
            </h2>
            <p className="text-xs md:text-sm text-purple-100 mt-1 max-w-xl leading-relaxed">
              Analisis cerdas otomatis berbasis data presensi dan nilai: diagnosis tren perkembangan (naik/turun/stagnan), deteksi dini siswa butuh remedial, dan saran perbaikan pembelajaran.
            </p>
          </div>

          <button
            onClick={handleGenerateInsight}
            disabled={loading}
            className="py-3 px-5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menganalisis Data Akademik...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analisis Kelas Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selectors & Raw Aggregates */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setInsight(null);
              }}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {database.master_kelas.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  {k.kelas} - {k.mapel} ({k.guru})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Periode</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setInsight(null);
              }}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m} 2026
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aggregate Preview Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-slate-500">Rata-rata Nilai</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {(gradeSummary as any).average || 0}
            </div>
            <div className="text-[11px] text-purple-700 mt-0.5">
              Tertinggi: {(gradeSummary as any).highest || 0} · Terendah: {(gradeSummary as any).lowest || 0}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-slate-500">Ketuntasan KKM</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {(gradeSummary as any).passRate || 0}%
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Standar KKM 75</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-slate-500">Tingkat Presensi</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {(attendanceSummary as any).hadirPercent || 0}%
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              {(attendanceSummary as any).hadir || 0} dari {(attendanceSummary as any).total || 0} catatan
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-slate-500">Total Siswa Terdata</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {classStudents.length} Siswa
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{activeClass?.cabang}</div>
          </div>
        </div>
      </div>

      {/* AI INSIGHT REPORT RESULT */}
      {insight ? (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-md p-6 space-y-6 animate-fade-in">
          {/* Header Status Trend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
                  insight.statusTrend === 'Naik' || insight.statusTrend === 'Optimal'
                    ? 'bg-emerald-100 text-emerald-700'
                    : insight.statusTrend === 'Turun'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {insight.statusTrend === 'Naik' ? (
                  <TrendingUp className="w-6 h-6" />
                ) : insight.statusTrend === 'Turun' ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <Minus className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Status Tren Belajar:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      insight.statusTrend === 'Naik' || insight.statusTrend === 'Optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : insight.statusTrend === 'Turun'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Tren {insight.statusTrend}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Evaluasi Kelas {activeClass?.kelas} ({activeClass?.mapel})
                </h3>
              </div>
            </div>

            <button
              onClick={copyInsightToClipboard}
              className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Ringkasan</span>
            </button>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-950 leading-relaxed">
            <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Kesimpulan Eksekutif:
            </h4>
            <p>{insight.trendSummary}</p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Findings */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Temuan Kunci Dinamika Belajar
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-1">
                {insight.keyHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Siswa Berprestasi */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                Siswa Berprestasi Unggul
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-950 pl-1">
                {insight.topAchievers.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">★</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Needs Attention / Remedial */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2.5">
            <h4 className="text-xs font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              Siswa Memerlukan Perhatian Khusus / Pendampingan Remedial
            </h4>
            <ul className="space-y-1.5 text-xs text-rose-950 pl-1">
              {insight.needsAttention.map((n, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-700" />
              Rekomendasi Praktis untuk Tutor & Manajemen
            </h4>
            <ul className="space-y-2 text-xs text-amber-950 pl-1">
              {insight.actionableRecommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">{i + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
          <Sparkles className="w-10 h-10 text-purple-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Belum Ada Analisis Dijalankan</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Klik tombol <strong>"Analisis Kelas Sekarang"</strong> di atas untuk memproses data presensi dan nilai kelas ini menggunakan Gemini AI.
          </p>
        </div>
      )}
    </div>
  );
}
