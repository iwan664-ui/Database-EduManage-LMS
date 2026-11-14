import React, { useState, useEffect, useMemo } from 'react';
import { ActiveUser, DatabaseState } from '../types';
import { BiometricService } from '../services/biometricService';
import { SecurityService } from '../services/securityService';
import { useToast } from './Toast';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Fingerprint,
  Lock,
  ShieldAlert,
  Search,
  User,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  database: DatabaseState;
  onLogin: (user: ActiveUser) => void;
  currentUser: ActiveUser | null;
  initialRole?: 'tutor' | 'siswa' | 'admin';
}

const ADMIN_PRESETS = ['Super Admin Akademik', 'Kepala Sekolah', 'Koordinator Kurikulum', 'Divisi Keuangan / Bendahara'];

export function AuthModal({ isOpen, database, onLogin, onClose, initialRole = 'tutor' }: AuthModalProps) {
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'tutor' | 'siswa' | 'admin'>(initialRole);
  const [tutorName, setTutorName] = useState<string>(database.master_guru[0]?.guru || '');
  const [selectedStudent, setSelectedStudent] = useState<string>(database.master_siswa[0]?.siswa || '');
  const [studentQuery, setStudentQuery] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('Super Admin Akademik');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lockout State
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Biometric State
  const [hasBiometricEnrolled, setHasBiometricEnrolled] = useState<boolean>(false);
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState<boolean>(false);

  // 2FA Secondary PIN Challenge State
  const [pendingPinUser, setPendingPinUser] = useState<{
    user: ActiveUser;
    serverToken?: string;
    serverExpiresAt?: number;
  } | null>(null);
  const [pinInput, setPinInput] = useState<string>('');

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setShowPassword(false);
      setPendingPinUser(null);
      setPinInput('');
    }
  }, [initialRole, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const status = SecurityService.isLockedOut();
    setIsLocked(status.locked);
    setLockoutTimer(status.remainingSeconds);

    if (selectedRole === 'tutor') {
      setHasBiometricEnrolled(BiometricService.isUserEnrolled(tutorName, 'tutor'));
    } else if (selectedRole === 'admin') {
      setHasBiometricEnrolled(
        BiometricService.isUserEnrolled(adminName.trim() || 'Super Admin Akademik', 'admin')
      );
    } else {
      setHasBiometricEnrolled(false);
    }
  }, [isOpen, selectedRole, tutorName, adminName]);

  // Interval timer for lockout countdown
  useEffect(() => {
    if (lockoutTimer <= 0) {
      setIsLocked(false);
      return;
    }
    const timer = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  // Deduplicate master_siswa to prevent duplicate options and React key collisions
  const uniqueStudents = useMemo(() => {
    const seen = new Set<string>();
    return database.master_siswa.filter((s) => {
      const normalized = (s.siswa || '').trim().toLowerCase();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [database.master_siswa]);

  // Filtered students for quick selection
  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return uniqueStudents;
    return uniqueStudents.filter(
      (s) => s.siswa.toLowerCase().includes(q) || s.cabang.toLowerCase().includes(q)
    );
  }, [uniqueStudents, studentQuery]);

  // Keep selectedStudent valid when filter changes
  useEffect(() => {
    if (filteredStudents.length > 0 && !filteredStudents.some((s) => s.siswa === selectedStudent)) {
      setSelectedStudent(filteredStudents[0].siswa);
    }
  }, [filteredStudents, selectedStudent]);

  if (!isOpen) return null;

  const authenticateCredentials = async (
    userName: string,
    role: 'tutor' | 'siswa' | 'admin'
  ): Promise<{ ok: boolean; token?: string; expiresAt?: number }> => {
    if (isLocked) {
      setErrorMsg(`Akun terkunci sementara. Harap tunggu ${lockoutTimer} detik.`);
      return { ok: false };
    }

    if (!password) {
      setErrorMsg('Silakan masukkan password terlebih dahulu.');
      return { ok: false };
    }

    const res = await SecurityService.authenticateWithServer({
      userName,
      role,
      password,
    });

    if (!res.success) {
      if (res.locked && res.remainingSeconds) {
        setIsLocked(true);
        setLockoutTimer(res.remainingSeconds);
      }
      setErrorMsg(res.error || 'Password salah!');
      return { ok: false };
    }

    return { ok: true, token: res.token, expiresAt: res.expiresAt };
  };

  const completeLoginOrRequirePin = async (
    user: ActiveUser,
    serverToken?: string,
    serverExpiresAt?: number
  ) => {
    if (SecurityService.hasPersonalPin(user.name, user.role)) {
      setPendingPinUser({ user, serverToken, serverExpiresAt });
      setPinInput('');
      setErrorMsg('');
      return;
    }

    await SecurityService.createSecureSession(user, serverToken, serverExpiresAt);
    onLogin(user);
  };

  const handlePinChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPinUser) return;
    setErrorMsg('');

    if (isLocked) {
      setErrorMsg(`Akun terkunci sementara. Harap tunggu ${lockoutTimer} detik.`);
      return;
    }

    if (!/^\d{6}$/.test(pinInput)) {
      setErrorMsg('Masukkan PIN Keamanan 6 digit angka.');
      return;
    }

    setIsSubmitting(true);
    const validPin = await SecurityService.verifyPersonalPin(
      pendingPinUser.user.name,
      pendingPinUser.user.role,
      pinInput
    );

    if (!validPin) {
      const lockStatus = SecurityService.recordFailedAttempt(
        pendingPinUser.user.name,
        pendingPinUser.user.role
      );
      if (lockStatus.locked) {
        setIsLocked(true);
        setLockoutTimer(lockStatus.remainingSeconds);
        setErrorMsg(
          `Terlalu banyak percobaan PIN salah! Terkunci selama ${lockStatus.remainingSeconds} detik.`
        );
      } else {
        setErrorMsg(`PIN Keamanan salah! Tersisa ${lockStatus.remainingAttempts} percobaan.`);
      }
      setIsSubmitting(false);
      return;
    }

    await SecurityService.createSecureSession(
      pendingPinUser.user,
      pendingPinUser.serverToken,
      pendingPinUser.serverExpiresAt
    );
    setIsSubmitting(false);
    onLogin(pendingPinUser.user);
  };

  // Biometric login trigger (Tutors & Admins)
  const handleBiometricLogin = async () => {
    setErrorMsg('');
    setIsVerifyingBiometric(true);

    const targetName =
      selectedRole === 'tutor' ? tutorName : adminName.trim() || 'Super Admin Akademik';

    const targetUser = { name: targetName, role: selectedRole };

    const res = await BiometricService.authenticateBiometric(targetUser);
    setIsVerifyingBiometric(false);

    if (res.success && res.user) {
      showToast('Biometrik Terverifikasi', res.message, 'success');

      const serverSess = await SecurityService.issueBiometricServerSession({
        userName: res.user.name,
        role: res.user.role,
        credentialId: res.credentialId || 'webauthn-verified',
      });

      const matchedGuru = database.master_guru.find(
        (g) => g.guru.toLowerCase().trim() === res.user!.name.toLowerCase().trim()
      );

      const activeUser: ActiveUser = {
        role: res.user.role as ActiveUser['role'],
        name: res.user.name,
        id_tutor:
          selectedRole === 'tutor'
            ? matchedGuru
              ? matchedGuru.id_tutor
              : 'TUTOR-AUTH'
            : undefined,
      };

      await SecurityService.createSecureSession(activeUser, serverSess.token, serverSess.expiresAt);
      onLogin(activeUser);
    } else {
      setErrorMsg(res.message);
      showToast('Verifikasi Biometrik Gagal', res.message, 'error');
    }
  };

  const handleTutorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanTutorName = SecurityService.sanitizeText(tutorName, 80);
    if (!cleanTutorName) {
      setErrorMsg('Silakan pilih atau masukkan Nama Guru.');
      return;
    }

    setIsSubmitting(true);
    const auth = await authenticateCredentials(cleanTutorName, 'tutor');
    if (!auth.ok) {
      setIsSubmitting(false);
      return;
    }

    const matchedGuru = database.master_guru.find(
      (g) => g.guru.toLowerCase().trim() === cleanTutorName.toLowerCase()
    );

    const user: ActiveUser = {
      role: 'tutor',
      name: matchedGuru ? matchedGuru.guru : cleanTutorName,
      id_tutor: matchedGuru ? matchedGuru.id_tutor : 'TUTOR-CUSTOM',
    };

    await completeLoginOrRequirePin(user, auth.token, auth.expiresAt);
    setIsSubmitting(false);
  };

  const handleSiswaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const matchedSiswa = uniqueStudents.find((s) => s.siswa === selectedStudent);
    if (!matchedSiswa) {
      setErrorMsg('Silakan pilih Nama Siswa yang terdaftar.');
      return;
    }

    setIsSubmitting(true);
    const auth = await authenticateCredentials(matchedSiswa.siswa, 'siswa');
    if (!auth.ok) {
      setIsSubmitting(false);
      return;
    }

    const user: ActiveUser = {
      role: 'siswa',
      name: matchedSiswa.siswa,
      email: matchedSiswa.email_siswa,
    };

    await completeLoginOrRequirePin(user, auth.token, auth.expiresAt);
    setIsSubmitting(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanAdminName = SecurityService.sanitizeText(adminName, 80);
    if (!cleanAdminName || cleanAdminName.length < 2) {
      setErrorMsg('Silakan masukkan Nama Admin yang valid (minimal 2 karakter).');
      return;
    }

    setIsSubmitting(true);
    const auth = await authenticateCredentials(cleanAdminName, 'admin');
    if (!auth.ok) {
      setIsSubmitting(false);
      return;
    }

    const user: ActiveUser = {
      role: 'admin',
      name: cleanAdminName,
    };

    await completeLoginOrRequirePin(user, auth.token, auth.expiresAt);
    setIsSubmitting(false);
  };

  const handleRoleSwitch = (role: 'tutor' | 'siswa' | 'admin') => {
    setSelectedRole(role);
    setErrorMsg('');
    setPassword('');
    setShowPassword(false);
    setPendingPinUser(null);
    setPinInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden flex flex-col max-h-[95vh] overflow-y-auto">
        {/* Header Branding */}
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white text-center relative flex flex-col items-center">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all text-xs font-bold cursor-pointer"
              title="Tutup Modal"
            >
              ✕
            </button>
          )}
          <img
            src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
            alt="Logo AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY"
            className="w-14 h-14 object-contain rounded-full bg-white p-1 shadow-lg mb-2.5 border-2 border-white/60 shrink-0"
          />
          <h2 className="text-base font-extrabold tracking-tight text-white">
            AL-WILDAN ISLAMIC SCHOOL 3
          </h2>
          <p className="text-[11px] text-blue-200 font-medium mt-0.5">
            BSD CITY · Portal Autentikasi Terenkripsi & LMS
          </p>

          {/* Secure Shield Indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] text-blue-100 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>HMAC-SHA256 & WebAuthn Shield v3.0</span>
          </div>
        </div>

        {/* Role Selector Tabs (Blue, Green, Orange) */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/80 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => handleRoleSwitch('tutor')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'tutor'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700'
                : 'text-slate-600 hover:text-slate-900 bg-white/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Portal Guru
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('siswa')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'siswa'
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                : 'text-slate-600 hover:text-slate-900 bg-white/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Portal Santri
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-orange-500 text-white shadow-sm ring-1 ring-orange-600'
                : 'text-slate-600 hover:text-slate-900 bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Portal Admin
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Lockout Warning */}
          {isLocked && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong className="block font-bold">Akses Dikunci Sementara!</strong>
                <span>
                  Terlalu banyak kesalahan kata sandi. Tunggu <strong>{lockoutTimer}s</strong>.
                </span>
              </div>
            </div>
          )}

          {errorMsg && !isLocked && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 2FA Secondary Security PIN Challenge */}
          {pendingPinUser ? (
            <form onSubmit={handlePinChallengeSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Verifikasi Lapis Kedua (PIN 6-Digit)</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Akun <strong>{pendingPinUser.user.name}</strong> mengaktifkan PIN Keamanan tambahan.
                  Masukkan 6 digit PIN Anda untuk melanjutkan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  PIN Keamanan Pribadi (6 Digit)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] text-sm font-mono font-bold rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingPinUser(null);
                    setPinInput('');
                    setErrorMsg('');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isLocked || isSubmitting}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Memverifikasi...' : 'Verifikasi PIN & Masuk'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Biometric Quick Login Action (Tutors & Admins) */}
              {(selectedRole === 'tutor' || selectedRole === 'admin') && hasBiometricEnrolled && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-2.5 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-900 text-xs font-bold">
                    <Fingerprint className="w-4 h-4 text-blue-600" />
                    <span>Biometrik Terdaftar di Perangkat Ini</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={isVerifyingBiometric || isLocked}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>
                      {isVerifyingBiometric
                        ? 'Memindai Sensor Biometrik...'
                        : 'Masuk Cepat dengan Sidik Jari / Face ID'}
                    </span>
                  </button>
                  <div className="text-[10px] text-blue-700/80">Atau masukkan kata sandi di bawah ini</div>
                </div>
              )}

              {/* Form Tutor / Guru */}
              {selectedRole === 'tutor' && (
            <form onSubmit={handleTutorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  User (Nama Guru / Tutor)
                </label>
                <select
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {database.master_guru.map((g) => (
                    <option key={g.id_tutor} value={g.guru}>
                      {g.guru} ({g.id_tutor})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pilih nama pendidik yang terdaftar pada data guru sekolah.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password Akses
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLocked}
                    autoComplete="current-password"
                    placeholder="Masukkan password guru..."
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk sebagai Guru / Tutor'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form Siswa / Santri & Walmur */}
          {selectedRole === 'siswa' && (
            <form onSubmit={handleSiswaLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  User (Nama Santri / Siswa)
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Cari nama siswa..."
                    className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {filteredStudents.length === 0 ? (
                    <option value="">Tidak ada siswa cocok</option>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <option key={`auth_opt_${s.siswa}_${idx}`} value={s.siswa}>
                        {s.siswa} — {s.cabang}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-500">
                  Akses Read-Only terproteksi untuk memantau kehadiran, nilai, & tahfidz.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password Akses
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLocked}
                    autoComplete="current-password"
                    placeholder="Masukkan password santri..."
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked || isSubmitting || filteredStudents.length === 0}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Memverifikasi...' : 'Buka Portal Santri & Walmur'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form Admin */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  User (Nama Administrator)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    disabled={isLocked}
                    placeholder="Masukkan nama lengkap admin..."
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ADMIN_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdminName(preset)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        adminName === preset
                          ? 'bg-orange-50 border-orange-300 text-orange-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password Akses
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLocked}
                    autoComplete="current-password"
                    placeholder="Masukkan password admin..."
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk sebagai Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
