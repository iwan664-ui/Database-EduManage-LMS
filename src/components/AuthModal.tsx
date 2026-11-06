import React, { useState } from 'react';
import { ActiveUser, DatabaseState, MasterGuru, MasterSiswa } from '../types';
import { GraduationCap, ShieldCheck, UserCheck, KeyRound, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  database: DatabaseState;
  onLogin: (user: ActiveUser) => void;
  currentUser: ActiveUser | null;
}

export function AuthModal({ isOpen, database, onLogin, currentUser }: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<'tutor' | 'siswa' | 'admin'>('tutor');
  const [tutorName, setTutorName] = useState<string>(database.master_guru[0]?.guru || '');
  const [password, setPassword] = useState<string>('aw2901234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<string>(database.master_siswa[0]?.siswa || '');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleTutorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tutorName.trim()) {
      setErrorMsg('Silakan pilih atau masukkan Nama Guru.');
      return;
    }

    if (password !== 'aw2901234') {
      setErrorMsg('Password salah! Password default adalah aw2901234');
      return;
    }

    const matchedGuru = database.master_guru.find(
      (g) => g.guru.toLowerCase().trim() === tutorName.toLowerCase().trim()
    );

    const user: ActiveUser = {
      role: 'tutor',
      name: matchedGuru ? matchedGuru.guru : tutorName,
      id_tutor: matchedGuru ? matchedGuru.id_tutor : 'TUTOR-CUSTOM',
    };

    onLogin(user);
  };

  const handleSiswaLogin = (e: React.FormEvent) => {
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

    onLogin(user);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user: ActiveUser = {
      role: 'admin',
      name: 'Super Admin Akademik',
    };
    onLogin(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white text-center relative flex flex-col items-center">
          <img
            src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
            alt="Logo AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK"
            className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-lg mb-2.5 border-2 border-white/60"
          />
          <h2 className="text-lg font-extrabold tracking-tight">AL-WILDAN ISLAMIC SCHOOL 29</h2>
          <p className="text-xs text-blue-100 font-medium mt-0.5">KOTA DEPOK · Sistem Informasi & LMS</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('tutor');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'tutor'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Tutor / Guru
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('siswa');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'siswa'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Siswa / Walmur
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'admin'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
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
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {database.master_guru.map((g) => (
                    <option key={g.id_tutor} value={g.guru}>
                      {g.guru} ({g.id_tutor})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nama diambil dari sheet <code className="font-mono text-slate-700">master_guru</code>
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
                    placeholder="Masukkan password"
                    className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Masuk sebagai Tutor</span>
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
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {database.master_siswa.map((s) => (
                    <option key={s.email_siswa + s.siswa} value={s.siswa}>
                      {s.siswa} — {s.cabang}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Akses Read-Only untuk memantau kehadiran harian dan rapor nilai.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Buka Portal Siswa / Walmur</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form Admin */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 mb-1">Akses Administrator Lembaga</p>
                Akses penuh monitoring seluruh kelas, cetak laporan bulanan resmi, analisis AI Insight performa nilai, serta rekapitulasi honor jam mengajar tutor.
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
