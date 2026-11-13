import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ActiveUser, DatabaseState, GateAttendanceLog, LogAbsensi, MasterSiswa } from '../../types';
import { GateAttendanceService } from '../../services/gateAttendanceService';
import { useToast } from '../Toast';
import {
  QrCode,
  Scan,
  Camera,
  CheckCircle2,
  UserCheck,
  Search,
  LogIn,
  LogOut as LogOutIcon,
  Zap,
  MapPin,
  Clock,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: DatabaseState;
  currentUser?: ActiveUser | null;
  initialMode?: 'auto' | 'masuk' | 'pulang';
  onAttendanceLogged?: (log: LogAbsensi) => void;
  onGateScanComplete?: (gateLog: GateAttendanceLog) => void;
}

export function AttendanceScannerModal({
  isOpen,
  onClose,
  database,
  currentUser,
  initialMode = 'auto',
  onAttendanceLogged,
  onGateScanComplete,
}: AttendanceScannerModalProps) {
  const { showToast } = useToast();

  // Strictly declare all hooks above early returns
  const [scanMode, setScanMode] = useState<'auto' | 'masuk' | 'pulang'>(initialMode);
  const [inputMethod, setInputMethod] = useState<'barcode' | 'camera'>('barcode');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [lokasiGerbang, setLokasiGerbang] = useState<string>('Gerbang Utama Sekolah');
  const [catatanScan, setCatatanScan] = useState<string>('');
  const [gateLogs, setGateLogs] = useState<GateAttendanceLog[]>(() =>
    GateAttendanceService.getAllLogs()
  );
  const [lastScanned, setLastScanned] = useState<{
    log: GateAttendanceLog;
    actionType: 'masuk' | 'pulang';
  } | null>(null);
  const [cameraError, setCameraError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const scheduleConfig = useMemo(() => GateAttendanceService.getScheduleConfig(), []);

  useEffect(() => {
    if (isOpen) {
      setScanMode(initialMode);
      setGateLogs(GateAttendanceService.getAllLogs());
      setCameraError('');
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, initialMode]);

  // Manage live camera stream when 'camera' tab is active
  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: number | null = null;

    const startCamera = async () => {
      if (!isOpen || inputMethod !== 'camera') return;
      try {
        setCameraError('');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Optional native BarcodeDetector API if supported
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        if (BarcodeDetectorClass && videoRef.current) {
          const detector = new BarcodeDetectorClass({ formats: ['qr_code', 'code_128', 'ean_13'] });
          intervalId = window.setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes && codes.length > 0 && codes[0].rawValue) {
                const match = GateAttendanceService.findStudentByCodeOrName(
                  database,
                  codes[0].rawValue
                );
                if (match) {
                  executeScan(match, 'Kamera Scanner');
                }
              }
            } catch {
              // ignore frame detection errors
            }
          }, 1200);
        }
      } catch {
        setCameraError(
          'Kamera tidak tersedia atau izin kamera belum diberikan. Gunakan input Barcode USB atau Tap Cepat di bawah.'
        );
      }
    };

    startCamera();

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, inputMethod]);

  const filteredStudents = useMemo(() => {
    const seen = new Set<string>();
    const query = searchStudent.toLowerCase().trim();
    return database.master_siswa.filter((s) => {
      const code = GateAttendanceService.getStudentCardCode(s.siswa).toLowerCase();
      const match =
        !query ||
        s.siswa.toLowerCase().includes(query) ||
        s.cabang.toLowerCase().includes(query) ||
        code.includes(query);
      if (!match) return false;
      const key = `${s.siswa.toLowerCase().trim()}_${s.cabang.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [database.master_siswa, searchStudent]);

  const todayLogsMap = useMemo(() => {
    const map = new Map<string, GateAttendanceLog>();
    gateLogs
      .filter((l) => l.tanggal === todayStr)
      .forEach((l) => {
        map.set(l.siswa.toLowerCase().trim(), l);
      });
    return map;
  }, [gateLogs, todayStr]);

  if (!isOpen) return null;

  const playBeep = (freq = 880) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable
    }
  };

  const executeScan = (
    siswa: MasterSiswa,
    metode: GateAttendanceLog['metode_scan'] = 'Tap Cepat Petugas'
  ) => {
    const result = GateAttendanceService.recordScan({
      database,
      siswa,
      mode: scanMode,
      scannerUser: currentUser,
      metode,
      lokasi: lokasiGerbang,
      catatan: catatanScan.trim() || undefined,
    });

    playBeep(result.actionType === 'masuk' ? 920 : 680);
    setGateLogs(result.allLogs);
    setLastScanned({ log: result.log, actionType: result.actionType });
    setCatatanScan('');

    if (onGateScanComplete) {
      onGateScanComplete(result.log);
    }

    if (result.actionType === 'masuk' && onAttendanceLogged) {
      onAttendanceLogged({
        id_absensi: `ABS-GATE-${Date.now().toString().slice(-5)}`,
        tanggal: todayStr,
        id_kelas: database.siswa_kelas.find((sk) => sk.siswa === siswa.siswa)?.id_kelas || 'KLS-10A-MAT',
        siswa: siswa.siswa,
        status_kehadiran: 'Hadir',
        id_tutor: currentUser?.id_tutor || currentUser?.name || 'PETUGAS-SCAN',
        timestamp: new Date().toISOString(),
      });
    }

    const timeShown = result.actionType === 'masuk' ? result.log.jam_masuk : result.log.jam_pulang;
    const statusLabel =
      result.actionType === 'masuk'
        ? `JAM HADIR ${timeShown} (${result.log.status_masuk})`
        : `JAM PULANG ${timeShown} (${result.log.status_pulang})`;

    showToast(
      result.actionType === 'masuk' ? 'Scan Masuk Berhasil!' : 'Scan Pulang Berhasil!',
      `${siswa.siswa} · ${statusLabel} · Disinkronkan ke Portal Orang Tua`,
      'success'
    );
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const match = GateAttendanceService.findStudentByCodeOrName(database, barcodeInput);
    if (!match) {
      playBeep(300);
      showToast(
        'Kartu Tidak Dikenali',
        `Kode atau nama "${barcodeInput}" tidak ditemukan pada master data santri.`,
        'warning'
      );
      return;
    }
    executeScan(match, 'QR / Barcode Kartu');
    setBarcodeInput('');
  };

  const scannerIdentity = currentUser
    ? `${currentUser.name} (${currentUser.role === 'admin' ? 'Manajemen' : currentUser.role === 'tutor' ? 'Guru' : 'User'})`
    : 'Petugas Gerbang Sekolah';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[94vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-emerald-900 p-5 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                  TERINTEGRASI GURU, MANAJEMEN & ORANG TUA
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white truncate">
                Terminal Scan Jam Hadir & Jam Pulang Santri
              </h3>
              <p className="text-[11px] text-blue-200 flex items-center gap-1 truncate mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Petugas Aktif: {scannerIdentity}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* 1. Scan Mode Selector (Auto / Masuk / Pulang) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Mode Pencatatan Scan Gerbang / Kelas:
              </label>
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                Masuk ≤ {scheduleConfig.batasJamMasuk} · Pulang ≥ {scheduleConfig.jamPulangStandar}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScanMode('auto')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'auto'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Otomatis (In/Out)</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('masuk')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'masuk'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Scan Masuk</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('pulang')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'pulang'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <LogOutIcon className="w-3.5 h-3.5" />
                <span>Scan Pulang</span>
              </button>
            </div>
          </div>

          {/* 2. Lokasi & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-600" />
                Lokasi Terminal Scan
              </label>
              <select
                value={lokasiGerbang}
                onChange={(e) => setLokasiGerbang(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Gerbang Utama Sekolah">Gerbang Utama Sekolah</option>
                <option value="Pos Piket Guru & Kedisiplinan">Pos Piket Guru & Kedisiplinan</option>
                <option value="Ruang Kelas KBM">Ruang Kelas KBM</option>
                <option value="Gerbang Kepulangan Santri">Gerbang Kepulangan Santri</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                Catatan Opsional (terlihat di Portal Ortu)
              </label>
              <input
                type="text"
                value={catatanScan}
                onChange={(e) => setCatatanScan(e.target.value)}
                placeholder="Misal: Dijemput ayah / Piket pagi..."
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* 3. Scanner Method Switcher: Barcode/ID Input vs Camera */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setInputMethod('barcode')}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  inputMethod === 'barcode'
                    ? 'bg-white text-blue-700 border-b-2 border-b-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Scan Barcode USB / Input ID Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('camera')}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  inputMethod === 'camera'
                    ? 'bg-white text-emerald-700 border-b-2 border-b-emerald-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kamera QR Langsung</span>
              </button>
            </div>

            {inputMethod === 'barcode' ? (
              <form onSubmit={handleBarcodeSubmit} className="p-4 bg-slate-950 text-white space-y-3">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono font-bold">
                  <span className="flex items-center gap-1.5">
                    <Scan className="w-4 h-4 animate-pulse" />
                    SENSOR BARCODE & QR SIAP PINDAI
                  </span>
                  <span className="text-slate-400">Contoh ID: AW3-xxxx</span>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Arahkan scanner barcode kartu santri atau ketik kode AW3-..."
                    className="flex-1 text-xs font-mono font-bold rounded-xl border border-slate-700 bg-slate-900 text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Catat Scan
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-950 text-white text-center relative min-h-[160px] flex flex-col items-center justify-center">
                {cameraError ? (
                  <p className="text-xs text-amber-300 max-w-md">{cameraError}</p>
                ) : (
                  <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-900">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Last Scanned Result Banner */}
          {lastScanned && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
                lastScanned.actionType === 'masuk'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-orange-50 border-orange-200 text-orange-950'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 ${
                    lastScanned.actionType === 'masuk' ? 'text-emerald-600' : 'text-orange-600'
                  }`}
                />
                <div className="min-w-0">
                  <strong className="block text-xs font-extrabold truncate">
                    {lastScanned.log.siswa} ({lastScanned.log.kode_kartu})
                  </strong>
                  <span className="text-[11px] block">
                    {lastScanned.actionType === 'masuk' ? (
                      <>
                        Hadir pukul <strong>{lastScanned.log.jam_masuk}</strong> ·{' '}
                        <span className="font-bold">{lastScanned.log.status_masuk}</span>
                      </>
                    ) : (
                      <>
                        Pulang pukul <strong>{lastScanned.log.jam_pulang}</strong> ·{' '}
                        <span className="font-bold">{lastScanned.log.status_pulang}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 shrink-0">
                TERKIRIM KE ORTU
              </span>
            </div>
          )}

          {/* 5. Quick Tap List with Live Today In/Out Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Tap Cepat Kartu Santri (Status Hari Ini):</span>
              </label>
              <span className="text-[11px] text-slate-500">Klik santri untuk scan masuk/pulang</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Cari nama santri, kampus, atau kode AW3-..."
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {filteredStudents.map((s, idx) => {
                const cardCode = GateAttendanceService.getStudentCardCode(s.siswa);
                const todayLog = todayLogsMap.get(s.siswa.toLowerCase().trim());

                return (
                  <div
                    key={`scanner_item_${s.siswa}_${idx}`}
                    onClick={() => executeScan(s, 'Tap Cepat Petugas')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between gap-3 cursor-pointer transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                        {s.siswa.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{s.siswa}</span>
                          <span className="text-[10px] font-mono text-slate-400">{cardCode}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1.5">
                          <span>{s.cabang}</span>
                          {todayLog?.jam_masuk && (
                            <span className="text-emerald-700 font-bold">
                              · Masuk {todayLog.jam_masuk.slice(0, 5)}
                            </span>
                          )}
                          {todayLog?.jam_pulang && (
                            <span className="text-orange-700 font-bold">
                              · Pulang {todayLog.jam_pulang.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                        todayLog?.jam_masuk && !todayLog?.jam_pulang
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : todayLog?.jam_pulang
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {scanMode === 'masuk'
                        ? 'Catat Masuk'
                        : scanMode === 'pulang'
                          ? 'Catat Pulang'
                          : todayLog?.jam_masuk && !todayLog?.jam_pulang
                            ? 'Scan Pulang'
                            : todayLog?.jam_pulang
                              ? 'Update Pulang'
                              : 'Scan Masuk'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Total scan hari ini: <strong>{todayLogsMap.size}</strong> santri
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
