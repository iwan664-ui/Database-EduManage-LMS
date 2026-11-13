import React, { useState } from 'react';
import { DatabaseState, LogAbsensi, KehadiranStatus, MasterSiswa } from '../../types';
import { useToast } from '../Toast';
import {
  QrCode,
  Scan,
  Camera,
  CheckCircle2,
  X,
  UserCheck,
  Calendar,
  Sparkles,
  Search,
  Check,
  Volume2,
} from 'lucide-react';

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: DatabaseState;
  onAttendanceLogged?: (log: LogAbsensi) => void;
}

export function AttendanceScannerModal({
  isOpen,
  onClose,
  database,
  onAttendanceLogged,
}: AttendanceScannerModalProps) {
  const { showToast } = useToast();

  const [scanMode, setScanMode] = useState<'laser' | 'camera'>('laser');
  const [selectedStatus, setSelectedStatus] = useState<KehadiranStatus>('Hadir');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [lastScanned, setLastScanned] = useState<{
    siswa: MasterSiswa;
    time: string;
    status: KehadiranStatus;
  } | null>(null);

  const filteredStudents = React.useMemo(() => {
    const seen = new Set<string>();
    const query = searchStudent.toLowerCase().trim();
    return database.master_siswa.filter((s) => {
      const match =
        !query ||
        s.siswa.toLowerCase().includes(query) ||
        s.cabang.toLowerCase().includes(query);
      if (!match) return false;
      const key = `${s.siswa.toLowerCase().trim()}_${s.cabang.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [database.master_siswa, searchStudent]);

  if (!isOpen) return null;

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz beep
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext not available or blocked
    }
  };

  const handleSimulateScan = (siswa: MasterSiswa) => {
    playBeep();

    const todayStr = new Date().toISOString().split('T')[0];
    const newLog: LogAbsensi = {
      id_absensi: `ABS-SCAN-${Date.now().toString().slice(-5)}`,
      tanggal: todayStr,
      id_kelas: 'KLS-10A-MAT',
      siswa: siswa.siswa,
      status_kehadiran: selectedStatus,
      id_tutor: 'TUTOR-SCAN-GURU',
      timestamp: new Date().toISOString(),
    };

    if (onAttendanceLogged) {
      onAttendanceLogged(newLog);
    } else {
      database.log_absensi.unshift(newLog);
    }

    setLastScanned({
      siswa,
      time: new Date().toLocaleTimeString('id-ID'),
      status: selectedStatus,
    });

    showToast(
      'Scan Kartu Berhasil!',
      `${siswa.siswa} dicatat: ${selectedStatus.toUpperCase()}`,
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/80 border border-white/20 flex items-center justify-center text-white shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider">
                AL-WILDAN ISLAMIC SCHOOL 29
              </span>
              <h3 className="text-base font-extrabold text-white">
                Scanner Presensi Barcode & QR Digital
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Pilih Status Presensi yang Akan Dicatat:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Hadir', 'Izin', 'Sakit', 'Alfa'] as KehadiranStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedStatus === st
                      ? st === 'Hadir'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : st === 'Izin'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : st === 'Sakit'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Scanner Viewfinder Simulation */}
          <div className="bg-slate-950 rounded-2xl p-6 text-center text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] border border-slate-800">
            {/* Red Laser Bar Animation */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
            
            <div className="w-24 h-24 border-2 border-dashed border-emerald-400/60 rounded-2xl flex items-center justify-center mb-3">
              <Scan className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>

            <p className="text-xs font-mono text-emerald-400 font-bold">
              KAMERA & SENSOR BARCODE SIAP
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Arahkan QR Code atau Barcode pada Smart Card ID Santri
            </p>
          </div>

          {/* Last Scanned Result Pill */}
          {lastScanned && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block text-xs font-bold text-slate-900">
                    {lastScanned.siswa.siswa}
                  </strong>
                  <span className="text-[11px] text-slate-600">
                    Status: <strong className="text-emerald-700">{lastScanned.status}</strong> · Pukul {lastScanned.time}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800">
                TERVERIFIKASI
              </span>
            </div>
          )}

          {/* Quick Tap / Direct Search Student Barcode Emulator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Simulasi Tap Kartu Santri Cepat:</span>
              </label>
              <span className="text-[11px] text-slate-500">Klik santri untuk scan instan</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Cari nama santri atau kelas..."
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {filteredStudents.slice(0, 6).map((s, idx) => (
                <div
                  key={`scanner_item_${s.siswa}_${s.email_siswa || ''}_${idx}`}
                  onClick={() => handleSimulateScan(s)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between gap-3 cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                      {s.siswa.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{s.siswa}</span>
                      <span className="text-[10px] text-slate-500">{s.cabang}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Scan Kartu
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Tutup Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
