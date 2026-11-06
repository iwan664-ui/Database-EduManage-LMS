import React, { useState, useEffect } from 'react';
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
  Smartphone,
  Eye,
  RefreshCw,
  Info,
} from 'lucide-react';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ActiveUser | null;
}

export function SecuritySettingsModal({ isOpen, onClose, currentUser }: SecuritySettingsModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'biometric' | 'session' | 'audit'>('biometric');

  const [biometricSupported, setBiometricSupported] = useState<boolean>(false);
  const [hasPlatformAuthenticator, setHasPlatformAuthenticator] = useState<boolean>(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [storedCreds, setStoredCreds] = useState<BiometricCredential[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    // Check device biometric support
    BiometricService.isAvailable().then((res) => {
      setBiometricSupported(res.supported);
      setHasPlatformAuthenticator(res.platformAuthenticator);
    });

    if (currentUser) {
      const enrolled = BiometricService.isUserEnrolled(currentUser.name, currentUser.role);
      setIsEnrolled(enrolled);
    }

    setStoredCreds(BiometricService.getStoredCredentials());
    setAuditLogs(SecurityService.getAuditLogs());
  }, [isOpen, currentUser]);

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

  const handleClearAuditLogs = () => {
    SecurityService.clearAuditLogs();
    setAuditLogs([]);
    showToast('Audit Log Dibersihkan', 'Riwayat keamanan telah direset.', 'info');
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
                Pusat Keamanan & Autentikasi Biometrik
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AL-WILDAN 29 · Akun: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-5 pt-3 gap-2 bg-white">
          <button
            onClick={() => setActiveTab('biometric')}
            className={`py-2 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'biometric'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            Autentikasi Biometrik (WebAuthn)
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`py-2 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'session'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            Enkripsi & Sesi
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
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
              {/* Feature Showcase Banner */}
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
                    Gunakan sensor biometrik bawaan laptop atau smartphone Anda (Touch ID, Face ID, Windows Hello, atau Android Biometric) untuk login cepat tanpa mengetik kata sandi. Kunci privat tersimpan aman di Secure Enclave perangkat.
                  </p>
                </div>
              </div>

              {/* Status & Actions Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-blue-600" />
                      Status Kredensial Biometrik
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
                        className="py-2 px-3.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus Kredensial</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleRegisterBiometric}
                        disabled={isRegistering}
                        className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
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

                {/* Device Capability Badge */}
                <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Dukungan WebAuthn: <strong>{biometricSupported ? 'Mendukung' : 'Tidak Didukung'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Sensor Platform: <strong>{hasPlatformAuthenticator ? 'Terdeteksi' : 'Kompatibel'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Informational Guidelines */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  Privasi & Keamanan Terjamin
                </div>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  Data biometrik mentah (gambar sidik jari atau pemindaian wajah) tidak pernah dikirim ke server maupun disimpan di spreadsheet. WebAuthn bekerja secara kriptografi asimetris publik/privat di dalam hardware keamanan perangkat Anda.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ENCRYPT & SESSION */}
          {activeTab === 'session' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Key className="w-4 h-4 text-blue-600" />
                    Kriptografi & Hashing
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Setiap sesi dan verifikasi kata sandi dienkripsi menggunakan standar militer <strong>SHA-256 Web Crypto</strong> untuk mencegah penyadapan kredensial.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Batas Waktu Sesi (Timeout)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sesi aktif otomatis kadaluarsa setelah <strong>8 Jam</strong> tidak aktif guna mengamankan data nilai dan presensi jika perangkat ditinggalkan.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Perlindungan Brute-Force
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistem otomatis mengunci akun selama <strong>60 detik</strong> jika terdeteksi 5 kali kegagalan memasukkan kata sandi berturut-turut.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Sanitasi XSS & Anti-Injeksi
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Seluruh input teks guru, nilai, dan catatan siswa melalui filter pembersih payload berbahaya sebelum dikirim ke Google Sheets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    Riwayat Peristiwa Keamanan (Audit Trail)
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Mencatat seluruh percobaan autentikasi, lockout, dan perubahan biometrik.
                  </p>
                </div>

                {auditLogs.length > 0 && (
                  <button
                    onClick={handleClearAuditLogs}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Bersihkan Log
                  </button>
                )}
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
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                log.eventType.includes('SUCCESS') || log.eventType.includes('REGISTERED')
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : log.eventType.includes('FAILED') || log.eventType.includes('LOCKED')
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
          <span className="text-[11px] text-slate-500">
            AL-WILDAN 29 Depok Security Shield v2.4
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
