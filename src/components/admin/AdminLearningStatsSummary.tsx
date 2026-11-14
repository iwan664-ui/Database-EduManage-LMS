import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LearningStatsSummaryResult,
  LearningStatsSummaryStatus,
  LogAbsensi,
  LogNilai,
  MasterKelas,
  MasterSiswa,
} from '../../types';
import { SecurityService } from '../../services/securityService';
import { useToast } from '../Toast';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Copy,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface AdminLearningStatsSummaryProps {
  filteredStudents: MasterSiswa[];
  filteredAbsensi: LogAbsensi[];
  filteredNilai: LogNilai[];
  classMap: Map<string, MasterKelas>;
  scopeLabel: string;
  isAnyFilterActive: boolean;
  onResetFilters: () => void;
}

const KKM_TARGET = 85;

function getStatusTextStyle(status: LearningStatsSummaryStatus) {
  if (status === 'Optimal') {
    return {
      textColor: 'text-emerald-700',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    };
  }
  if (status === 'Kritis') {
    return {
      textColor: 'text-rose-700',
      icon: <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />,
    };
  }
  return {
    textColor: 'text-amber-700',
    icon: <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />,
  };
}

export function AdminLearningStatsSummary({
  filteredStudents,
  filteredAbsensi,
  filteredNilai,
  classMap,
  scopeLabel,
  isAnyFilterActive,
  onResetFilters,
}: AdminLearningStatsSummaryProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<LearningStatsSummaryResult | null>(null);

  // Cache summaries keyed by dataset signature to avoid redundant Gemini requests
  const summaryCacheRef = useRef<Map<string, LearningStatsSummaryResult>>(new Map());
  const lastFetchedSigRef = useRef<string>('');

  // Aggregate real filtered metrics for Gemini analysis
  const analyticsPayload = useMemo(() => {
    const totalRecords = filteredAbsensi.length;
    const hadir = filteredAbsensi.filter((a) => a.status_kehadiran === 'Hadir').length;
    const izin = filteredAbsensi.filter((a) => a.status_kehadiran === 'Izin').length;
    const sakit = filteredAbsensi.filter((a) => a.status_kehadiran === 'Sakit').length;
    const alfa = filteredAbsensi.filter((a) => a.status_kehadiran === 'Alfa').length;
    const attendanceRate = totalRecords > 0 ? Math.round((hadir / totalRecords) * 100) : 0;

    const totalEntries = filteredNilai.length;
    const scores = filteredNilai.map((n) => Number(n.nilai) || 0);
    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((acc, v) => acc + v, 0) / scores.length) * 10) / 10
        : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passCount = scores.filter((s) => s >= KKM_TARGET).length;
    const passRate = scores.length > 0 ? Math.round((passCount / scores.length) * 100) : 0;

    // Breakdown per subject
    const subjectMap = new Map<string, number[]>();
    filteredNilai.forEach((n) => {
      const list = subjectMap.get(n.mapel) || [];
      list.push(Number(n.nilai) || 0);
      subjectMap.set(n.mapel, list);
    });
    const subjectBreakdown = Array.from(subjectMap.entries())
      .map(([mapel, vals]) => ({
        mapel,
        entries: vals.length,
        average: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
        passRate: Math.round((vals.filter((v) => v >= KKM_TARGET).length / vals.length) * 100),
      }))
      .sort((a, b) => b.entries - a.entries)
      .slice(0, 10);

    // Breakdown per class
    const classStatsMap = new Map<
      string,
      { label: string; hadir: number; absTotal: number; scores: number[] }
    >();
    filteredAbsensi.forEach((a) => {
      const info = classMap.get(a.id_kelas);
      const label = info ? `${info.kelas} (${info.mapel})` : a.id_kelas;
      const cur = classStatsMap.get(a.id_kelas) || { label, hadir: 0, absTotal: 0, scores: [] };
      cur.absTotal += 1;
      if (a.status_kehadiran === 'Hadir') cur.hadir += 1;
      classStatsMap.set(a.id_kelas, cur);
    });
    filteredNilai.forEach((n) => {
      const info = classMap.get(n.id_kelas);
      const label = info ? `${info.kelas} (${info.mapel})` : n.id_kelas;
      const cur = classStatsMap.get(n.id_kelas) || { label, hadir: 0, absTotal: 0, scores: [] };
      cur.scores.push(Number(n.nilai) || 0);
      classStatsMap.set(n.id_kelas, cur);
    });
    const classBreakdown = Array.from(classStatsMap.values())
      .map((item) => ({
        kelas: item.label,
        attendanceRate: item.absTotal > 0 ? Math.round((item.hadir / item.absTotal) * 100) : 0,
        averageScore:
          item.scores.length > 0
            ? Math.round((item.scores.reduce((a, b) => a + b, 0) / item.scores.length) * 10) / 10
            : 0,
      }))
      .slice(0, 10);

    // Student-level summary (at-risk & top achievers)
    const studentStatsMap = new Map<
      string,
      { hadir: number; absTotal: number; alfa: number; scores: number[] }
    >();
    filteredAbsensi.forEach((a) => {
      const cur = studentStatsMap.get(a.siswa) || { hadir: 0, absTotal: 0, alfa: 0, scores: [] };
      cur.absTotal += 1;
      if (a.status_kehadiran === 'Hadir') cur.hadir += 1;
      if (a.status_kehadiran === 'Alfa') cur.alfa += 1;
      studentStatsMap.set(a.siswa, cur);
    });
    filteredNilai.forEach((n) => {
      const cur = studentStatsMap.get(n.siswa) || { hadir: 0, absTotal: 0, alfa: 0, scores: [] };
      cur.scores.push(Number(n.nilai) || 0);
      studentStatsMap.set(n.siswa, cur);
    });

    const studentRows = Array.from(studentStatsMap.entries()).map(([nama, st]) => ({
      nama,
      avgScore:
        st.scores.length > 0
          ? Math.round((st.scores.reduce((a, b) => a + b, 0) / st.scores.length) * 10) / 10
          : 0,
      hasScores: st.scores.length > 0,
      alfaCount: st.alfa,
      attendanceRate: st.absTotal > 0 ? Math.round((st.hadir / st.absTotal) * 100) : 100,
    }));

    const atRiskStudents = studentRows
      .filter((s) => (s.hasScores && s.avgScore < KKM_TARGET) || s.alfaCount > 0)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 8)
      .map(({ nama, avgScore, alfaCount, attendanceRate: ar }) => ({
        nama,
        avgScore,
        alfaCount,
        attendanceRate: ar,
      }));

    const topStudents = studentRows
      .filter((s) => s.hasScores && s.avgScore >= KKM_TARGET)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 6)
      .map(({ nama, avgScore, attendanceRate: ar }) => ({
        nama,
        avgScore,
        attendanceRate: ar,
      }));

    return {
      scopeLabel,
      totalStudents: filteredStudents.length,
      attendanceMetrics: {
        totalRecords,
        hadir,
        izin,
        sakit,
        alfa,
        attendanceRate,
      },
      gradeMetrics: {
        totalEntries,
        averageScore,
        highestScore,
        lowestScore,
        passCount,
        passRate,
        kkm: KKM_TARGET,
      },
      subjectBreakdown,
      classBreakdown,
      atRiskStudents,
      topStudents,
    };
  }, [filteredStudents.length, filteredAbsensi, filteredNilai, classMap, scopeLabel]);

  const hasData =
    analyticsPayload.attendanceMetrics.totalRecords > 0 ||
    analyticsPayload.gradeMetrics.totalEntries > 0;

  // Deterministic signature for caching & automatic refresh
  const dataSignature = useMemo(() => {
    const { scopeLabel: sl, totalStudents, attendanceMetrics: am, gradeMetrics: gm } = analyticsPayload;
    return `${sl}|${totalStudents}|${am.totalRecords}:${am.hadir}:${am.izin}:${am.sakit}:${am.alfa}|${gm.totalEntries}:${gm.averageScore}:${gm.passCount}`;
  }, [analyticsPayload]);

  const fetchSummary = useCallback(
    async (forceRefresh = false) => {
      if (!hasData) {
        setSummaryData(null);
        setErrorMsg(null);
        return;
      }

      if (!forceRefresh) {
        const cached = summaryCacheRef.current.get(dataSignature);
        if (cached) {
          setSummaryData(cached);
          setErrorMsg(null);
          lastFetchedSigRef.current = dataSignature;
          return;
        }
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const resp = await fetch('/api/learning-stats-summary', {
          method: 'POST',
          headers: SecurityService.getAuthHeaders(),
          credentials: 'same-origin',
          body: JSON.stringify(analyticsPayload),
        });

        const data = await resp.json();
        setLoading(false);

        if (!resp.ok || !data?.success || !data?.summary) {
          const message =
            data?.error || 'Gagal memuat ringkasan statistik pembelajaran dari Gemini AI.';
          setErrorMsg(message);
          return;
        }

        summaryCacheRef.current.set(dataSignature, data.summary);
        lastFetchedSigRef.current = dataSignature;
        setSummaryData(data.summary);
      } catch (err: any) {
        setLoading(false);
        setErrorMsg(err?.message || 'Koneksi ke layanan analisis AI terputus.');
      }
    },
    [analyticsPayload, dataSignature, hasData]
  );

  // Trigger automatically on mount and whenever filtered dataset changes (debounced 400ms)
  useEffect(() => {
    if (!hasData) {
      setSummaryData(null);
      setErrorMsg(null);
      return;
    }

    const cached = summaryCacheRef.current.get(dataSignature);
    if (cached) {
      setSummaryData(cached);
      setErrorMsg(null);
      lastFetchedSigRef.current = dataSignature;
      return;
    }

    if (lastFetchedSigRef.current === dataSignature) return;

    const timer = setTimeout(() => {
      fetchSummary(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [dataSignature, fetchSummary, hasData]);

  const handleCopySummary = () => {
    if (!summaryData) return;
    const text = [
      'RINGKASAN STATISTIK PEMBELAJARAN · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY',
      `Cakupan: ${scopeLabel}`,
      '',
      summaryData.headline,
      summaryData.executiveSummary,
      '',
      `1. ${summaryData.attendanceCard.title} (${summaryData.attendanceCard.metricHighlight} · ${summaryData.attendanceCard.status})`,
      summaryData.attendanceCard.summary,
      '',
      `2. ${summaryData.gradeCard.title} (${summaryData.gradeCard.metricHighlight} · ${summaryData.gradeCard.status})`,
      summaryData.gradeCard.summary,
      '',
      `3. ${summaryData.correlationCard.title}`,
      summaryData.correlationCard.summary,
      ...summaryData.correlationCard.actionItems.map((a, i) => `   ${i + 1}. ${a}`),
      '',
      'Temuan Kunci:',
      ...summaryData.keyFindings.map((f) => `- ${f}`),
    ].join('\n');

    navigator.clipboard.writeText(text);
    showToast(
      'Ringkasan Disalin',
      'Ringkasan statistik pembelajaran siap dibagikan ke pimpinan atau grup wali kelas.',
      'success'
    );
  };

  const formattedTimestamp = useMemo(() => {
    if (!summaryData?.generatedAt) return null;
    try {
      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(summaryData.generatedAt));
    } catch {
      return null;
    }
  }, [summaryData?.generatedAt]);

  return (
    <section
      aria-label="Ringkasan Statistik Pembelajaran"
      className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-5"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-indigo-700">Analisis Otomatis Gemini AI</span>
            <span aria-hidden="true">·</span>
            <span>{scopeLabel}</span>
            {formattedTimestamp && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Diperbarui {formattedTimestamp} WIB</span>
              </>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Ringkasan Statistik Pembelajaran
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {summaryData && (
            <button
              type="button"
              onClick={handleCopySummary}
              className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Salin Teks</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchSummary(true)}
            disabled={loading || !hasData}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menganalisis...' : 'Perbarui Analisis'}</span>
          </button>
        </div>
      </div>

      {/* State 1: Empty State (No Matching Records) */}
      {!hasData && (
        <div className="py-8 px-4 text-center space-y-3 bg-slate-50/70 rounded-xl border border-slate-200">
          <BarChart3 className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900">
              Belum Ada Data Kehadiran & Nilai untuk Dianalisis
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ringkasan otomatis membutuhkan minimal satu catatan presensi atau nilai siswa sesuai filter aktif saat ini.
            </p>
          </div>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      )}

      {/* State 2: Loading / Skeleton State */}
      {hasData && loading && !summaryData && (
        <div className="space-y-4 animate-pulse" aria-busy="true">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-200 rounded" />
            <div className="h-3 w-5/6 bg-slate-200 rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="h-3.5 w-1/2 bg-slate-200 rounded" />
                <div className="h-5 w-2/3 bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-200 rounded" />
                <div className="h-3 w-4/5 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State 3: Error State */}
      {hasData && errorMsg && !loading && (
        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-rose-900">
                Analisis Statistik AI Tidak Dapat Dimuat
              </div>
              <p className="text-xs text-rose-800">{errorMsg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchSummary(true)}
            className="py-2 px-3.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-xs font-semibold text-rose-800 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Analisis Ulang
          </button>
        </div>
      )}

      {/* State 4: Populated Summary Text Cards */}
      {hasData && summaryData && (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-65' : 'opacity-100'}`}>
          {/* Executive Overview Text Card */}
          <div className="p-4 md:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Kesimpulan Eksekutif Pembelajaran</span>
            </div>
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {summaryData.headline}
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {summaryData.executiveSummary}
            </p>
          </div>

          {/* 3 Automated Analysis Text Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Analisis Kehadiran */}
            {(() => {
              const st = getStatusTextStyle(summaryData.attendanceCard.status);
              return (
                <article className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-500">
                        {summaryData.attendanceCard.title}
                      </span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${st.textColor}`}>
                        {st.icon}
                        <span>{summaryData.attendanceCard.status}</span>
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-900 tabular-nums">
                      {summaryData.attendanceCard.metricHighlight}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {summaryData.attendanceCard.summary}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2 tabular-nums">
                    <span>Hadir: {analyticsPayload.attendanceMetrics.hadir}</span>
                    <span aria-hidden="true">·</span>
                    <span>Izin/Sakit: {analyticsPayload.attendanceMetrics.izin + analyticsPayload.attendanceMetrics.sakit}</span>
                    <span aria-hidden="true">·</span>
                    <span>Alfa: {analyticsPayload.attendanceMetrics.alfa}</span>
                  </div>
                </article>
              );
            })()}

            {/* Card 2: Analisis Capaian Nilai & KKM 85 */}
            {(() => {
              const st = getStatusTextStyle(summaryData.gradeCard.status);
              return (
                <article className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-500">
                        {summaryData.gradeCard.title}
                      </span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${st.textColor}`}>
                        {st.icon}
                        <span>{summaryData.gradeCard.status}</span>
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-900 tabular-nums">
                      {summaryData.gradeCard.metricHighlight}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {summaryData.gradeCard.summary}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2 tabular-nums">
                    <span>Tertinggi: {analyticsPayload.gradeMetrics.highestScore}</span>
                    <span aria-hidden="true">·</span>
                    <span>Terendah: {analyticsPayload.gradeMetrics.lowestScore}</span>
                    <span aria-hidden="true">·</span>
                    <span>KKM 85</span>
                  </div>
                </article>
              );
            })()}

            {/* Card 3: Korelasi & Prioritas Tindak Lanjut */}
            <article className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">
                  {summaryData.correlationCard.title}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {summaryData.correlationCard.summary}
                </p>
                {summaryData.correlationCard.actionItems.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {summaryData.correlationCard.actionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-700 flex items-start gap-2 leading-snug"
                      >
                        <span className="font-mono text-[11px] font-bold text-indigo-600 tabular-nums shrink-0">
                          {idx + 1}.
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2 tabular-nums">
                <span>{analyticsPayload.totalStudents} Siswa Tercakup</span>
                <span aria-hidden="true">·</span>
                <span>{analyticsPayload.atRiskStudents.length} Perlu Pendampingan</span>
              </div>
            </article>
          </div>

          {/* Key Data Findings Strip */}
          {summaryData.keyFindings.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Temuan Statistik Utama
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {summaryData.keyFindings.map((finding, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-600 leading-relaxed flex items-start gap-2"
                  >
                    <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
