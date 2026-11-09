import React, { useState, useEffect } from 'react';
import { ActiveUser, DatabaseState, MasterGuru, MasterSiswa } from '../types';
import { BiometricService } from '../services/biometricService';
import { SecurityService } from '../services/securityService';
import { useToast } from './Toast';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Fingerprint,
  Lock,
  Sparkles,
  ShieldAlert,
  Clock,
  Check,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  database: DatabaseState;
  onLogin: (user: ActiveUser) => void;
  currentUser: ActiveUser | null;
  initialRole?: 'tutor' | 'siswa' | 'admin';
}

export function AuthModal({ isOpen, database, onLogin, currentUser, onClose, initialRole = 'tutor' }: AuthModalProps) {
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'tutor' | 'siswa' | 'admin'>(initialRole);
  const [tutorName, setTutorName] = useState<string>(database.master_guru[0]?.guru || '');
  const [password, setPassword] = useState<string>('aw2901234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<string>(database.master_siswa[0]?.siswa || '');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole, isOpen]);

  // Lockout State
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Biometric State
  const [hasBiometricEnrolled, setHasBiometricEnrolled] = useState<boolean>(false);
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    // Check lockout status
    const status = SecurityService.isLockedOut();
    setIsLocked(status.locked);
    setLockoutTimer(status.remainingSeconds);

    // Check if biometric is enrolled for current selected tutor or admin
    checkBiometricStatus();
  }, [isOpen, selectedRole, tutorName]);

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

  const checkBiometricStatus = () => {
    if (selectedRole === 'tutor') {
      const enrolled = BiometricService.isUserEnrolled(tutorName, 'tutor');
      setHasBiometricEnrolled(enrolled);
    } else if (selectedRole === 'admin') {
      const enrolled = BiometricService.isUserEnrolled('Super Admin Akademik', 'admin');
      setHasBiometricEnrolled(enrolled);
    } else {
      setHasBiometricEnrolled(false);
    }
  };

  if (!isOpen) return null;

  // Biometric login trigger
  const handleBiometricLogin = async () => {
    setErrorMsg('');
    setIsVerifyingBiometric(true);

    const targetUser =
      selectedRole === 'tutor'
        ? { name: tutorName, role: 'tutor' }
        : { name: 'Super Admin Akademik', role: 'admin' };

    const res = await BiometricService.authenticateBiometric(targetUser);
    setIsVerifyingBiometric(false);

    if (res.success && res.user) {
      showToast('Biometrik Terverifikasi', res.message, 'success');

      // Create secure session
      await SecurityService.createSecureSession({
        name: res.user.name,
        role: res.user.role,
      });

      const matchedGuru = database.master_guru.find(
        (g) => g.guru.toLowerCase().trim() === res.user!.name.toLowerCase().trim()
      );

      const activeUser: ActiveUser = {
        role: res.user.role as any,
        name: res.user.name,
        id_tutor: matchedGuru ? matchedGuru.id_tutor : 'TUTOR-AUTH',
      };

      onLogin(activeUser);
    } else {
      setErrorMsg(res.message);
      showToast('Verifikasi Biometrik Gagal', res.message, 'error');
    }
  };

  const handleTutorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isLocked) {
      setErrorMsg(`Akun terkunci sementara. Harap tunggu ${lockoutTimer} detik.`);
      return;
    }

    if (!tutorName.trim()) {
      setErrorMsg('Silakan pilih atau masukkan Nama Guru.');
      return;
    }

    if (password !== 'aw2901234') {
      const lockStatus = SecurityService.recordFailedAttempt(tutorName, 'tutor');
      if (lockStatus.locked) {
        setIsLocked(true);
        setLockoutTimer(lockStatus.remainingSeconds);
        setErrorMsg(`Terlalu banyak percobaan gagal! Sistem terkunci selama ${lockStatus.remainingSeconds} detik untuk melindungi data.`);
      } else {
        setErrorMsg(`Password salah! Tersisa ${lockStatus.remainingAttempts} percobaan sebelum akun terkunci otomatis.`);
      }
      return;
    }

    // Success
    const matchedGuru = database.master_guru.find(
      (g) => g.guru.toLowerCase().trim() === tutorName.toLowerCase().trim()
    );

    const user: ActiveUser = {
      role: 'tutor',
      name: matchedGuru ? matchedGuru.guru : tutorName,
      id_tutor: matchedGuru ? matchedGuru.id_tutor : 'TUTOR-CUSTOM',
    };

    await SecurityService.createSecureSession(user);
    onLogin(user);
  };

  const handleSiswaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const matchedSiswa = database.master_siswa.find((s) => s.siswa === selectedStudent);
    if (!matchedSiswa) {
      setErrorMsg('Data siswa tidak ditemukan.');
      return;
    }

    const user: ActiveUser = {
      role: 'siswa',
      name: matchedSiswa.siswa,
      email: matchedSiswa.email_siswa,
    };

    await SecurityService.createSecureSession(user);
    onLogin(user);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user: ActiveUser = {
      role: 'admin',
      name: 'Super Admin Akademik',
    };
    await SecurityService.createSecureSession(user);
    onLogin(user);
  };

  // Deduplicate master_siswa to prevent duplicate options and React key collisions
  const uniqueStudents = React.useMemo(() => {
    const seen = new Set<string>();
    return database.master_siswa.filter((s) => {
      const normalized = (s.siswa || '').trim().toLowerCase();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [database.master_siswa]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header Branding */}
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white text-center relative flex flex-col items-center">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all text-xs font-bold"
              title="Tutup Modal"
            >
              ✕
            </button>
          )}
          <img
            src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
            alt="Logo AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK"
            className="w-14 h-14 object-contain rounded-full bg-white p-1 shadow-lg mb-2.5 border-2 border-white/60 shrink-0"
          />
          <h2 className="text-base font-extrabold tracking-tight text-white">
            AL-WILDAN ISLAMIC SCHOOL 29
          </h2>
          <p className="text-[11px] text-blue-200 font-medium mt-0.5">
            KOTA DEPOK · Portal Autentikasi Terenkripsi & LMS
          </p>

          {/* Secure Shield Indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] text-blue-100 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Enkripsi SHA-256 & WebAuthn Ready</span>
          </div>
        </div>

        {/* Role Selector Tabs (Blue, Green, Orange) */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/80 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('tutor');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
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
            onClick={() => {
              setSelectedRole('siswa');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
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
            onClick={() => {
              setSelectedRole('admin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
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
                <span>Terlalu banyak kesalahan kata sandi. Tunggu <strong>{lockoutTimer}s</strong>.</span>
              </div>
            </div>
          )}

          {errorMsg && !isLocked && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{isVerifyingBiometric ? 'Memindai Sensor Biometrik...' : 'Masuk Cepat dengan Sidik Jari / Face ID'}</span>
              </button>
              <div className="text-[10px] text-blue-700/80">
                Atau masukkan kata sandi di bawah ini
              </div>
            </div>
          )}

          {/* Form Tutor */}
          {selectedRole === 'tutor' && (
            <form onSubmit={handleTutorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Guru / Tutor
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
                  Nama terdaftar pada sheet <code className="font-mono text-slate-700">master_guru</code>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <span className="text-[11px] text-blue-600 font-medium">Default: aw2901234</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLocked}
                    placeholder="Masukkan kata sandi guru"
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Masuk sebagai Guru / Tutor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form Siswa/Walmur */}
          {selectedRole === 'siswa' && (
            <form onSubmit={handleSiswaLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih Nama Siswa
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {uniqueStudents.map((s, idx) => (
                    <option key={`auth_opt_${s.siswa}_${idx}`} value={s.siswa}>
                      {s.siswa} — {s.cabang}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Akses Read-Only terproteksi untuk memantau kehadiran, grafik nilai, dan ekstrakurikuler.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Buka Portal Siswa & Walmur</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form Admin */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-1">Akses Administrator Lembaga</p>
                Akses monitoring central, cetak rapor bulanan format resmi, audit log keamanan, analisis AI Insight Gemini, dan kalkulasi honor fee tutor.
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Masuk sebagai Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
