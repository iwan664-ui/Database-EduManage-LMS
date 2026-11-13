import React, { useState, useEffect, useMemo } from 'react';
import { ActiveUser } from '../types';
import { BiometricService, BiometricCredential } from '../services/biometricService';
import { SecurityService, SecurityAuditLog } from '../services/securityService';
import { useToast } from './Toast';
import {
  ShieldCheck,
  Fingerprint,
  Lock,
  Key,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  RefreshCw,
  Info,
  KeyRound,
  Download,
  ShieldAlert,
} from 'lucide-react';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ActiveUser | null;
  onLockScreen?: () => void;
}

export function SecuritySettingsModal({
  isOpen,
  onClose,
  currentUser,
  onLockScreen,
}: SecuritySettingsModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'biometric' | 'session' | 'audit'>('biometric');

  const [biometricSupported, setBiometricSupported] = useState<boolean>(false);
  const [hasPlatformAuthenticator, setHasPlatformAuthenticator] = useState<boolean>(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [storedCreds, setStoredCreds] = useState<BiometricCredential[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Security PIN & Idle Timeout state
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [pinNew, setPinNew] = useState<string>('');
  const [pinConfirm, setPinConfirm] = useState<string>('');
  const [idleTimeoutMin, setIdleTimeoutMin] = useState<number>(30);

  useEffect(() => {
    if (!isOpen) return;

    BiometricService.isAvailable().then((res) => {
      setBiometricSupported(res.supported);
      setHasPlatformAuthenticator(res.platformAuthenticator);
    });

    if (currentUser) {
      const enrolled = BiometricService.isUserEnrolled(currentUser.name, currentUser.role);
      setIsEnrolled(enrolled);
      setHasPin(SecurityService.hasPersonalPin(currentUser.name, currentUser.role));
    }

    setIdleTimeoutMin(SecurityService.getIdleTimeoutMinutes());
    setPinNew('');
    setPinConfirm('');
    setStoredCreds(BiometricService.getStoredCredentials());
    setAuditLogs(SecurityService.getAuditLogs());
  }, [isOpen, currentUser]);

  const securityPosture = useMemo(() => {
    if (!currentUser) {
      return { score: 0, level: 'Standar' as const, checks: [] };
    }
    return SecurityService.getSecurityPosture({
      userName: currentUser.name,
      role: currentUser.role,
      hasBiometric: isEnrolled,
    });
  }, [currentUser, isEnrolled, hasPin, idleTimeoutMin, auditLogs]);

  if (!isOpen || !currentUser) return null;

  const handleRegisterBiometric = async () => {
    setIsRegistering(true);
    const res = await BiometricService.registerBiometric({
      id: currentUser.id_tutor || currentUser.name,
      name: currentUser.name,
      role: currentUser.role,
    });
    setIsRegistering(false);

    if (res.success) {
      showToast('Biometrik Diaktifkan', res.message, 'success');
      setIsEnrolled(true);
      setStoredCreds(BiometricService.getStoredCredentials());
      setAuditLogs(SecurityService.getAuditLogs());
    } else {
      showToast('Gagal Mendaftarkan Biometrik', res.message, 'error');
    }
  };

  const handleRemoveBiometric = () => {
    BiometricService.removeBiometric(currentUser.name, currentUser.role);
    setIsEnrolled(false);
    setStoredCreds(BiometricService.getStoredCredentials());
    setAuditLogs(SecurityService.getAuditLogs());
    showToast('Biometrik Dihapus', 'Kredensial biometrik telah dihapus dari perangkat ini.', 'info');
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinNew)) {
      showToast('Format PIN Tidak Valid', 'PIN harus berupa tepat 6 digit angka.', 'error');
      return;
    }
    if (pinNew !== pinConfirm) {
      showToast('PIN Tidak Cocok', 'Konfirmasi PIN harus sama persis.', 'error');
      return;
    }
    const res = await SecurityService.setPersonalPin(currentUser.name, currentUser.role, pinNew);
    if (res.success) {
      setHasPin(true);
      setPinNew('');
      setPinConfirm('');
      setAuditLogs(SecurityService.getAuditLogs());
      showToast('PIN Lapis Kedua Aktif', res.message, 'success');
    } else {
      showToast('Gagal Menyimpan PIN', res.message, 'error');
    }
  };

  const handleRemovePin = () => {
    SecurityService.removePersonalPin(currentUser.name, currentUser.role);
    setHasPin(false);
    setAuditLogs(SecurityService.getAuditLogs());
    showToast('PIN Dinonaktifkan', 'PIN keamanan pribadi telah dihapus dari akun Anda.', 'info');
  };

  const handleIdleTimeoutChange = (minutes: number) => {
    SecurityService.setIdleTimeoutMinutes(minutes);
    setIdleTimeoutMin(minutes);
    showToast(
      'Pengaturan Auto-Lock Disimpan',
      minutes > 0
        ? `Layar akan terkunci otomatis setelah ${minutes} menit tidak aktif.`
        : 'Auto-lock otomatis dinonaktifkan.',
      'success'
    );
  };

  const handleClearAuditLogs = () => {
    const ok = SecurityService.clearAuditLogs(currentUser.role, currentUser.name);
    setAuditLogs(SecurityService.getAuditLogs());
    if (ok) {
      showToast('Audit Log Direset', 'Riwayat keamanan telah dibersihkan oleh Administrator.', 'info');
    } else {
      showToast('Akses Ditolak', 'Hanya Administrator yang berwenang mereset Audit Log.', 'error');
    }
  };

  const handleExportAuditCsv = () => {
    if (auditLogs.length === 0) return;
    const headers = ['ID Log', 'Waktu', 'Jenis Event', 'Pengguna', 'Role', 'Perangkat', 'Keterangan'];
    const rows = auditLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString('id-ID'),
      l.eventType,
      l.userName,
      l.role,
      l.ipOrDevice,
      l.details,
    ]);
    const csvContent =
      '\uFEFF' +
      [
        headers.map(SecurityService.escapeCsvCell).join(','),
        ...rows.map((r) => r.map(SecurityService.escapeCsvCell).join(',')),
      ].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Keamanan_AW3_BSD_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    SecurityService.logSecurityEvent({
      eventType: 'DATA_EXPORTED',
      userName: currentUser.name,
      role: currentUser.role,
      details: `Mengekspor ${auditLogs.length} baris Audit Log keamanan ke CSV.`,
    });
    setAuditLogs(SecurityService.getAuditLogs());
    showToast('Audit Log Diekspor', 'File CSV audit keamanan berhasil diunduh.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Pusat Keamanan & Autentikasi Berlapis
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AL-WILDAN 3 BSD CITY · Akun:{' '}
                <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Security Score Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                securityPosture.score >= 85
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : securityPosture.score >= 65
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              Proteksi: {securityPosture.level} ({securityPosture.score}/100)
            </span>
            <span className="text-[11px] text-slate-300 hidden sm:inline">
              HMAC-SHA256 + Anti-Tamper + SSRF Guard
            </span>
          </div>
          {onLockScreen && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockScreen();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/15 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Kunci Layar Sekarang</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-5 pt-3 gap-2 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('biometric')}
            className={`py-2 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'biometric'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            Biometrik (WebAuthn)
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`py-2 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'session'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            PIN, Auto-Lock & Enkripsi
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Audit Log ({auditLogs.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: BIOMETRIC WEBAUTHN */}
          {activeTab === 'biometric' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-blue-300">
                      Web Authentication API (FIDO2 / WebAuthn)
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isEnrolled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {isEnrolled ? 'Biometrik Aktif' : 'Belum Terdaftar'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Masuk Instan dengan Sidik Jari atau Face ID
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    Gunakan sensor biometrik bawaan laptop atau smartphone Anda (Touch ID, Face ID, Windows Hello, atau Android Biometric) untuk membuka layar atau login cepat tanpa mengetik kata sandi.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-blue-600" />
                      Status Kredensial Biometrik ({storedCreds.length} Perangkat Terdaftar)
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isEnrolled
                        ? `Akun ${currentUser.name} telah memiliki kredensial biometrik aktif di browser ini.`
                        : 'Daftarkan sidik jari atau pengenalan wajah untuk mengaktifkan login biometrik.'}
                    </p>
                  </div>

                  <div>
                    {isEnrolled ? (
                      <button
                        onClick={handleRemoveBiometric}
                        className="py-2 px-3.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus Kredensial</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleRegisterBiometric}
                        disabled={isRegistering}
                        className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {isRegistering ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menghubungi Sensor...</span>
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4" />
                            <span>Aktifkan Biometrik Sekarang</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>
                      Dukungan WebAuthn: <strong>{biometricSupported ? 'Mendukung' : 'Tidak Didukung'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>
                      Sensor Platform: <strong>{hasPlatformAuthenticator ? 'Terdeteksi' : 'Kompatibel'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  Privasi & Keamanan Terjamin
                </div>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  Data biometrik mentah tidak pernah dikirim ke server maupun disimpan di spreadsheet. WebAuthn bekerja menggunakan kriptografi kunci publik/privat di dalam hardware keamanan perangkat Anda.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PIN, AUTO-LOCK & SESSION SECURITY */}
          {activeTab === 'session' && (
            <div className="space-y-5">
              {/* Checklist Postur Keamanan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-extrabold text-slate-900">
                  Daftar Pertahanan Aktif (Defense-in-Depth)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {securityPosture.checks.map((c) => (
                    <div
                      key={c.label}
                      className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                        c.active
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            c.active ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        {c.label}
                      </span>
                      <span className="font-mono font-bold text-[10px]">
                        {c.active ? `+${c.points}` : '0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal 6-digit Security PIN (2nd Layer / 2FA) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      <span>PIN Keamanan Lapis Kedua (6-Digit Salted SHA-256)</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Jika diaktifkan, setiap login baru dan pembukaan kunci layar untuk akun ini akan meminta verifikasi PIN 6-digit tambahan.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      hasPin
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {hasPin ? 'PIN Aktif' : 'Belum Diatur'}
                  </span>
                </div>

                {hasPin ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Verifikasi 2-lapis aktif untuk akun {currentUser.name}.
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                    >
                      Nonaktifkan PIN
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSavePin} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinNew}
                      onChange={(e) => setPinNew(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="PIN Baru (6 angka)"
                      className="text-xs font-mono font-bold rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Ulangi PIN 6 angka"
                      className="text-xs font-mono font-bold rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Aktifkan PIN 2FA
                    </button>
                  </form>
                )}
              </div>

              {/* Idle Auto-Lock Timeout Setting */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Auto-Lock Layar Saat Idle (Tidak Aktif)</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-blue-700">
                    {idleTimeoutMin > 0 ? `${idleTimeoutMin} Menit` : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Melindungi data presensi dan nilai jika perangkat ditinggalkan tanpa dikunci.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[10, 15, 30, 60, 0].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => handleIdleTimeoutChange(min)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        idleTimeoutMin === min
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {min === 0 ? 'Nonaktif' : `${min} Menit`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Safeguards Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Key className="w-4 h-4 text-blue-600" />
                    Token Sesi HMAC-SHA256 & Anti-Tamper
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Sesi diverifikasi oleh server dengan cookie <strong>HttpOnly</strong>, tanda tangan HMAC-SHA256, serta segel integritas perangkat untuk memblokir manipulasi role.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Brute-Force Lockout, Anti-SSRF & CSV Guard
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Lockout bertingkat (60–300 detik) sisi server, filter SSRF domain Apps Script, sanitasi XSS, dan proteksi Excel CSV Formula Injection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    Riwayat Peristiwa Keamanan (Audit Trail)
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Mencatat login, lockout, PIN, kunci layar, percobaan akses ilegal, dan biometrik.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {auditLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportAuditCsv}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh CSV</span>
                    </button>
                  )}

                  {auditLogs.length > 0 && currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={handleClearAuditLogs}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Reset Log (Admin)</span>
                    </button>
                  )}
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  Belum ada log peristiwa keamanan tercatat.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Waktu</th>
                        <th className="px-3 py-2">Peristiwa</th>
                        <th className="px-3 py-2">Pengguna</th>
                        <th className="px-3 py-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                                log.eventType.includes('SUCCESS') ||
                                log.eventType.includes('REGISTERED') ||
                                log.eventType.includes('UNLOCKED')
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : log.eventType.includes('FAILED') ||
                                    log.eventType.includes('LOCKED') ||
                                    log.eventType.includes('TAMPER') ||
                                    log.eventType.includes('UNAUTHORIZED')
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {log.eventType}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">
                            {log.userName}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            AL-WILDAN 3 BSD CITY Security Shield v3.0
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

