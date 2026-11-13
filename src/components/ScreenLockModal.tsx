import React, { useState, useEffect } from 'react';
import { ActiveUser } from '../types';
import { SecurityService } from '../services/securityService';
import { BiometricService } from '../services/biometricService';
import { useToast } from './Toast';
import {
  Lock,
  Fingerprint,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Unlock,
} from 'lucide-react';

interface ScreenLockModalProps {
  isLockedScreen: boolean;
  currentUser: ActiveUser | null;
  lockReason: 'manual' | 'idle';
  onUnlock: () => void;
  onForceLogout: () => void;
}

export function ScreenLockModal({
  isLockedScreen,
  currentUser,
  lockReason,
  onUnlock,
  onForceLogout,
}: ScreenLockModalProps) {
  const { showToast } = useToast();
  const [credential, setCredential] = useState('');
  const [unlockMode, setUnlockMode] = useState<'password' | 'pin'>('password');
  const [showInput, setShowInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const hasPin = currentUser
    ? SecurityService.hasPersonalPin(currentUser.name, currentUser.role)
    : false;
  const hasBiometric = currentUser
    ? (currentUser.role === 'tutor' || currentUser.role === 'admin') &&
      BiometricService.isUserEnrolled(currentUser.name, currentUser.role)
    : false;

  useEffect(() => {
    if (isLockedScreen) {
      setCredential('');
      setErrorMsg('');
      setShowInput(false);
      setUnlockMode(hasPin ? 'pin' : 'password');
    }
  }, [isLockedScreen, hasPin]);

  if (!isLockedScreen || !currentUser) return null;

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const lockout = SecurityService.isLockedOut();
    if (lockout.locked) {
      setErrorMsg(`Terlalu banyak percobaan salah. Tunggu ${lockout.remainingSeconds} detik.`);
      return;
    }

    if (!credential) {
      setErrorMsg(
        unlockMode === 'pin'
          ? 'Masukkan PIN Keamanan 6-digit Anda.'
          : 'Masukkan password akses Anda.'
      );
      return;
    }

    setIsVerifying(true);
    try {
      if (unlockMode === 'pin' && hasPin) {
        const pinOk = await SecurityService.verifyPersonalPin(
          currentUser.name,
          currentUser.role,
          credential
        );
        if (!pinOk) {
          const lockStatus = SecurityService.recordFailedAttempt(currentUser.name, currentUser.role);
          setErrorMsg(
            lockStatus.locked
              ? `Terlalu banyak percobaan salah! Terkunci ${lockStatus.remainingSeconds} detik.`
              : `PIN salah! Tersisa ${lockStatus.remainingAttempts} percobaan.`
          );
          setIsVerifying(false);
          return;
        }
        SecurityService.resetFailedAttempts();
      } else {
        const res = await SecurityService.authenticateWithServer({
          userName: currentUser.name,
          role: currentUser.role,
          password: credential,
        });
        if (!res.success) {
          setErrorMsg(res.error || 'Password salah.');
          setIsVerifying(false);
          return;
        }
        if (res.token) {
          await SecurityService.createSecureSession(currentUser, res.token, res.expiresAt);
        }
      }

      SecurityService.touchActivity();
      SecurityService.logSecurityEvent({
        eventType: 'SCREEN_UNLOCKED',
        userName: currentUser.name,
        role: currentUser.role,
        details: `Layar dibuka kembali menggunakan ${unlockMode === 'pin' ? 'PIN 6-Digit' : 'Password Terenkripsi'}.`,
      });
      showToast('Layar Dibuka', `Selamat datang kembali, ${currentUser.name}.`, 'success');
      onUnlock();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setErrorMsg('');
    setIsVerifying(true);
    const res = await BiometricService.authenticateBiometric({
      name: currentUser.name,
      role: currentUser.role,
    });
    setIsVerifying(false);

    if (res.success && res.credentialId) {
      const serverSess = await SecurityService.issueBiometricServerSession({
        userName: currentUser.name,
        role: currentUser.role,
        credentialId: res.credentialId,
      });
      if (serverSess.token) {
        await SecurityService.createSecureSession(currentUser, serverSess.token, serverSess.expiresAt);
      }
      SecurityService.touchActivity();
      SecurityService.logSecurityEvent({
        eventType: 'SCREEN_UNLOCKED',
        userName: currentUser.name,
        role: currentUser.role,
        details: 'Layar dibuka kembali menggunakan Biometrik WebAuthn.',
      });
      showToast('Biometrik Terverifikasi', 'Layar portal berhasil dibuka kembali.', 'success');
      onUnlock();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center">
            <Lock className="w-7 h-7 text-blue-300" />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h3 className="text-lg font-extrabold">
            {lockReason === 'idle' ? 'Sesi Dikunci Otomatis (Idle)' : 'Layar Portal Terkunci'}
          </h3>
          <p className="text-xs text-slate-300">
            Akun aktif: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
          </p>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {hasBiometric && (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isVerifying}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Buka Cepat dengan Sidik Jari / Face ID</span>
            </button>
          )}

          {hasPin && (
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setUnlockMode('pin');
                  setCredential('');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  unlockMode === 'pin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                PIN 6-Digit
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnlockMode('password');
                  setCredential('');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  unlockMode === 'password' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Password Login
              </button>
            </div>
          )}

          <form onSubmit={handleUnlockSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {unlockMode === 'pin' ? 'Masukkan PIN Keamanan 6-Digit' : 'Masukkan Password Akses'}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showInput ? 'text' : 'password'}
                  inputMode={unlockMode === 'pin' ? 'numeric' : 'text'}
                  maxLength={unlockMode === 'pin' ? 6 : 64}
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder={unlockMode === 'pin' ? '••••••' : 'Masukkan password...'}
                  autoFocus
                  className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowInput((p) => !p)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{isVerifying ? 'Memverifikasi...' : 'Buka Kunci Layar'}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data sesi terlindungi</span>
            </span>
            <button
              type="button"
              onClick={onForceLogout}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar & Ganti Akun</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
