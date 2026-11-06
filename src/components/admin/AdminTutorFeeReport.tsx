import React, { useState, useMemo } from 'react';
import { DatabaseState, MasterGuru } from '../../types';
import { SheetsService } from '../../services/sheetsService';
import { useToast } from '../Toast';
import {
  DollarSign,
  Calendar,
  Users,
  Printer,
  Edit3,
  Check,
  Search,
  Eye,
  X,
  FileSpreadsheet,
  Building,
} from 'lucide-react';

interface AdminTutorFeeReportProps {
  database: DatabaseState;
}

export function AdminTutorFeeReport({ database }: AdminTutorFeeReportProps) {
  const { showToast } = useToast();
  const [feeRate, setFeeRate] = useState<number>(SheetsService.getFeeRate());
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState<string>(String(feeRate));

  // Date Filters
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-11-30');
  const [selectedTutorDetail, setSelectedTutorDetail] = useState<{
    guru: string;
    id_tutor: string;
    sessions: { tanggal: string; id_kelas: string; mapel: string; totalSiswa: number }[];
    totalFee: number;
  } | null>(null);

  const handleSaveRate = () => {
    const num = Number(tempRate);
    if (isNaN(num) || num < 0) {
      showToast('Nilai Tidak Valid', 'Masukkan angka tarif yang benar.', 'error');
      return;
    }
    setFeeRate(num);
    SheetsService.setFeeRate(num);
    setIsEditingRate(false);
    showToast('Tarif Fee Diperbarui', `Tarif per sesi menjadi Rp ${num.toLocaleString('id-ID')}`, 'success');
  };

  // Kalkulasi sesi mengajar per tutor
  const tutorFeeData = useMemo(() => {
    return database.master_guru.map((tutor) => {
      // Cari kelas milik tutor ini
      const classesOfTutor = database.master_kelas.filter(
        (k) => k.guru.toLowerCase().trim() === tutor.guru.toLowerCase().trim()
      );
      const classIds = new Set(classesOfTutor.map((c) => c.id_kelas));

      // Ambil absensi yang cocok dengan id_tutor atau id_kelas milik guru ini
      const matchedAbsensi = database.log_absensi.filter((a) => {
        const matchTutorId = a.id_tutor === tutor.id_tutor;
        const matchClass = classIds.has(a.id_kelas);
        const inDateRange = (!startDate || a.tanggal >= startDate) && (!endDate || a.tanggal <= endDate);
        return (matchTutorId || matchClass) && inDateRange;
      });

      // Hitung sesi unik: perpaduan (tanggal + id_kelas)
      const sessionMap = new Map<string, { tanggal: string; id_kelas: string; mapel: string; totalSiswa: number }>();

      matchedAbsensi.forEach((a) => {
        const key = `${a.tanggal}_${a.id_kelas}`;
        if (!sessionMap.has(key)) {
          const kInfo = database.master_kelas.find((k) => k.id_kelas === a.id_kelas);
          sessionMap.set(key, {
            tanggal: a.tanggal,
            id_kelas: a.id_kelas,
            mapel: kInfo ? kInfo.mapel : 'Pelajaran',
            totalSiswa: 0,
          });
        }
        sessionMap.get(key)!.totalSiswa += 1;
      });

      const uniqueSessions = Array.from(sessionMap.values()).sort(
        (x, y) => new Date(y.tanggal).getTime() - new Date(x.tanggal).getTime()
      );

      const totalSesi = uniqueSessions.length;
      const totalFee = totalSesi * feeRate;

      return {
        id_tutor: tutor.id_tutor,
        guru: tutor.guru,
        classes: classesOfTutor,
        uniqueSessions,
        totalSesi,
        totalFee,
      };
    });
  }, [database.master_guru, database.master_kelas, database.log_absensi, startDate, endDate, feeRate]);

  // Total Disbursed
  const grandTotalFee = tutorFeeData.reduce((acc, curr) => acc + curr.totalFee, 0);
  const grandTotalSessions = tutorFeeData.reduce((acc, curr) => acc + curr.totalSesi, 0);

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Rekapitulasi Kehadiran & Honor Fee Tutor
            </h2>
            <p className="text-xs text-slate-500">
              AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK · Perhitungan otomatis total jam/pertemuan mengajar berdasarkan log absensi untuk pencairan honor pengajar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintSlip}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap Honor</span>
            </button>
          </div>
        </div>

        {/* Filter Controls & Config Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Tanggal Mulai */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Tanggal Sampai */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Tarif per Sesi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Tarif Honor / Sesi</label>
              {!isEditingRate && (
                <button
                  onClick={() => setIsEditingRate(true)}
                  className="text-[10px] text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
                >
                  <Edit3 className="w-3 h-3" /> Ubah Tarif
                </button>
              )}
            </div>
            {isEditingRate ? (
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-emerald-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  onClick={handleSaveRate}
                  className="px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-emerald-700"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center justify-between">
                <span>Rp {feeRate.toLocaleString('id-ID')} / pertemuan</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Sesi Terverifikasi</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{grandTotalSessions} Sesi</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Dalam rentang tanggal terpilih
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Estimasi Fee Honor</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            Rp {grandTotalFee.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            Total pencairan semua tutor
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Pengajar Terdata</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{tutorFeeData.length} Tutor</div>
          <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Terdaftar di master_guru
          </div>
        </div>
      </div>

      {/* Tutor Fee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900">Rincian Honor Pengajar</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">ID Tutor</th>
                <th className="px-4 py-3 font-semibold">Nama Pengajar</th>
                <th className="px-4 py-3 font-semibold">Kelas Diampu</th>
                <th className="px-4 py-3 font-semibold text-center">Total Sesi Hadir</th>
                <th className="px-4 py-3 font-semibold text-right">Tarif / Sesi</th>
                <th className="px-4 py-3 font-semibold text-right">Total Honor</th>
                <th className="px-4 py-3 font-semibold text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tutorFeeData.map((row) => (
                <tr key={row.id_tutor} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-500">{row.id_tutor}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{row.guru}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {row.classes.map((c) => (
                        <div key={c.id_kelas} className="text-[11px] text-slate-700">
                          {c.kelas} ({c.mapel})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-sm text-slate-900">
                    {row.totalSesi} Sesi
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    Rp {feeRate.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-sm text-emerald-700">
                    Rp {row.totalFee.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        setSelectedTutorDetail({
                          guru: row.guru,
                          id_tutor: row.id_tutor,
                          sessions: row.uniqueSessions,
                          totalFee: row.totalFee,
                        })
                      }
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Sesi Modal */}
      {selectedTutorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rincian Pertemuan: {selectedTutorDetail.guru}
                </h3>
                <p className="text-xs text-slate-500">{selectedTutorDetail.id_tutor}</p>
              </div>
              <button
                onClick={() => setSelectedTutorDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 text-xs">
              {selectedTutorDetail.sessions.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Belum ada sesi tercatat di rentang tanggal ini.</p>
              ) : (
                selectedTutorDetail.sessions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{s.tanggal}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.id_kelas} · {s.mapel}
                      </div>
                    </div>
                    <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                      {s.totalSiswa} Siswa Absen
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Total Honor:</span>
                <div className="text-sm font-bold font-mono text-emerald-700">
                  Rp {selectedTutorDetail.totalFee.toLocaleString('id-ID')}
                </div>
              </div>
              <button
                onClick={() => setSelectedTutorDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
