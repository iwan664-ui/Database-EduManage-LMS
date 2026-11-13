import React, { useState, useEffect } from 'react';
import { ActiveUser, DatabaseState } from './types';
import { SheetsService } from './services/sheetsService';
import { ToastProvider, useToast } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { SheetsSetupModal } from './components/SheetsSetupModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { ScreenLockModal } from './components/ScreenLockModal';
import { BiometricService } from './services/biometricService';
import { SecurityService } from './services/securityService';
import { SidebarNav } from './components/SidebarNav';

// Tutor Components
import { TutorDashboard } from './components/tutor/TutorDashboard';
import { TutorInputForm } from './components/tutor/TutorInputForm';
import { TutorHistoryCrud } from './components/tutor/TutorHistoryCrud';
import { TutorRecapView } from './components/tutor/TutorRecapView';
import { TutorWeeklyReportSender } from './components/tutor/TutorWeeklyReportSender';

// Student Component
import { StudentPortal, StudentPortalTab } from './components/student/StudentPortal';

// Admin Components
import { AdminMonitoring } from './components/admin/AdminMonitoring';
import { AdminMonthlyReportPrint } from './components/admin/AdminMonthlyReportPrint';
import { AdminAIInsight } from './components/admin/AdminAIInsight';
import { AdminTutorFeeReport } from './components/admin/AdminTutorFeeReport';

// New Advanced Modules
import { CbtExamEngine } from './components/cbt/CbtExamEngine';
import { DigitalMaktabah } from './components/library/DigitalMaktabah';
import { AttendanceScannerModal } from './components/scanner/AttendanceScannerModal';
import { GateAttendanceMonitor } from './components/scanner/GateAttendanceMonitor';
import { AssignmentHub } from './components/assignment/AssignmentHub';
import { VirtualClassroomHub } from './components/virtual/VirtualClassroomHub';
import { AnnouncementBulletinBoard } from './components/announcement/AnnouncementBulletinBoard';

import {
  GraduationCap,
  FileSpreadsheet,
  LogOut,
  Users,
  PlusCircle,
  History,
  BarChart3,
  ShieldCheck,
  FileText,
  Sparkles,
  DollarSign,
  LayoutDashboard,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Fingerprint,
  Lock,
  ShieldAlert,
  UserCheck,
  ArrowRight,
  BookOpen,
  Award,
  Building2,
  CreditCard,
  TrendingUp,
  Calendar,
  QrCode,
  Scan,
  FileQuestion,
  FileCheck,
  Video,
  Megaphone,
  Menu,
} from 'lucide-react';

function LMSApp() {
  const { showToast } = useToast();

  // Database State
  const [database, setDatabase] = useState<DatabaseState>(() => SheetsService.getLocalDatabase());

  // Active User State - default null to focus on explicit role gateway
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(() => {
    const saved = localStorage.getItem('edumanage_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Active Navigation Tab
  // For tutor: 'dashboard' | 'input' | 'crud' | 'rekap' | 'cbt' | 'maktabah'
  // For siswa: 'portal'
  // For admin: 'monitoring' | 'print' | 'insight' | 'fee' | 'cbt' | 'maktabah'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [studentTab, setStudentTab] = useState<StudentPortalTab>('radar');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Selected Class ID for Input form
  const [selectedClassId, setSelectedClassId] = useState<string>('KLS-10A-MAT');

  // Modals & Role selection
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<'tutor' | 'siswa' | 'admin'>('tutor');
  const [showSheetsModal, setShowSheetsModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'auto' | 'masuk' | 'pulang'>('auto');
  const [gateRefreshTick, setGateRefreshTick] = useState<number>(0);
  const [hasSheetsUrl, setHasSheetsUrl] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasBiometric, setHasBiometric] = useState<boolean>(false);
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<'manual' | 'idle'>('manual');

  const openScannerWithMode = (mode: 'auto' | 'masuk' | 'pulang' = 'auto') => {
    if (!currentUser || (currentUser.role !== 'tutor' && currentUser.role !== 'admin')) {
      SecurityService.logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_BLOCKED',
        userName: currentUser?.name || 'Guest',
        role: currentUser?.role || 'guest',
        details: 'Akses ke Scanner QR Gerbang diblokir karena peran tidak berwenang.',
      });
      showToast('Akses Ditolak', 'Hanya Guru atau Administrator yang dapat membuka Scanner QR.', 'error');
      return;
    }
    setScannerInitialMode(mode);
    setShowScannerModal(true);
  };

  const openSheetsSetupGuarded = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      SecurityService.logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_BLOCKED',
        userName: currentUser?.name || 'Guest',
        role: currentUser?.role || 'guest',
        details: 'Percobaan membuka Setup Google Sheets oleh akun non-Admin diblokir.',
      });
      showToast('Khusus Administrator', 'Pengaturan Google Sheets hanya dapat diakses oleh Admin.', 'error');
      return;
    }
    setShowSheetsModal(true);
  };

  const handleLockScreen = (reason: 'manual' | 'idle' = 'manual') => {
    if (!currentUser) return;
    setLockReason(reason);
    setIsScreenLocked(true);
    SecurityService.logSecurityEvent({
      eventType: 'SCREEN_LOCKED',
      userName: currentUser.name,
      role: currentUser.role,
      details:
        reason === 'idle'
          ? 'Layar portal dikunci otomatis karena batas waktu tidak aktif (idle) tercapai.'
          : 'Layar portal dikunci secara manual oleh pengguna.',
    });
  };

  const openPortalLogin = (role: 'tutor' | 'siswa' | 'admin') => {
    setAuthModalRole(role);
    setShowAuthModal(true);
  };

  // Check sheets URL & Biometric status
  useEffect(() => {
    setHasSheetsUrl(Boolean(SheetsService.getScriptUrl()));
    if (currentUser) {
      setHasBiometric(BiometricService.isUserEnrolled(currentUser.name, currentUser.role));
    }
  }, [currentUser]);

  // Anti-Tamper Session Integrity & Idle Auto-Lock Enforcement
  useEffect(() => {
    if (!currentUser) {
      setIsScreenLocked(false);
      return;
    }

    let isMounted = true;

    const enforceSecurityChecks = async (checkServer = false) => {
      const check = await SecurityService.verifySessionIntegrity({
        name: currentUser.name,
        role: currentUser.role,
      });

      if (!isMounted) return;

      if (!check.valid) {
        if (check.reason === 'idle') {
          handleLockScreen('idle');
          return;
        }
        localStorage.removeItem('edumanage_user');
        setCurrentUser(null);
        setShowAuthModal(true);
        showToast(
          check.reason === 'tampered' ? 'Peringatan Keamanan Sesi' : 'Sesi Berakhir',
          check.reason === 'tampered'
            ? 'Integritas sesi tidak valid atau dimodifikasi. Silakan login ulang secara aman.'
            : 'Sesi Anda telah berakhir. Silakan masuk kembali.',
          'warning'
        );
        return;
      }

      if (checkServer) {
        const serverOk = await SecurityService.verifyWithServer();
        if (!isMounted) return;
        if (!serverOk) {
          localStorage.removeItem('edumanage_user');
          SecurityService.clearSession();
          setCurrentUser(null);
          setShowAuthModal(true);
          showToast(
            'Verifikasi Server Diperlukan',
            'Sesi token Anda tidak aktif di server. Silakan login ulang.',
            'info'
          );
        }
      }
    };

    enforceSecurityChecks(true);

    // Throttled user activity tracker for idle auto-lock
    let lastTouch = Date.now();
    const onUserActivity = () => {
      const now = Date.now();
      if (now - lastTouch > 15000) {
        lastTouch = now;
        SecurityService.touchActivity();
      }
    };

    window.addEventListener('mousemove', onUserActivity, { passive: true });
    window.addEventListener('keydown', onUserActivity, { passive: true });
    window.addEventListener('mousedown', onUserActivity, { passive: true });
    window.addEventListener('touchstart', onUserActivity, { passive: true });

    // Cross-tab tampering / logout detection
    const onStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'edumanage_user' ||
        e.key === 'edumanage_secure_session'
      ) {
        enforceSecurityChecks(false);
      }
    };
    window.addEventListener('storage', onStorageChange);

    // Periodic integrity & idle check every 20 seconds
    const interval = window.setInterval(() => {
      enforceSecurityChecks(false);
    }, 20000);

    return () => {
      isMounted = false;
      window.removeEventListener('mousemove', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('mousedown', onUserActivity);
      window.removeEventListener('touchstart', onUserActivity);
      window.removeEventListener('storage', onStorageChange);
      window.clearInterval(interval);
    };
  }, [currentUser]);

  // Save current user to localStorage
  const handleLogin = (user: ActiveUser) => {
    setCurrentUser(user);
    setIsScreenLocked(false);
    localStorage.setItem('edumanage_user', JSON.stringify(user));
    setShowAuthModal(false);

    // Switch tab according to role
    if (user.role === 'tutor') {
      setActiveTab('dashboard');
    } else if (user.role === 'siswa') {
      setActiveTab('portal');
      setStudentTab('radar');
    } else if (user.role === 'admin') {
      setActiveTab('monitoring');
    }

    showToast(`Selamat Datang, ${user.name}!`, `Masuk sebagai ${user.role.toUpperCase()}`, 'success');
  };

  const handleLogout = async () => {
    await SecurityService.logoutFromServer();
    localStorage.removeItem('edumanage_user');
    setIsScreenLocked(false);
    setCurrentUser(null);
    setShowAuthModal(true);
    showToast('Sesi Berakhir', 'Anda telah keluar dengan aman. Token sesi telah dicabut.', 'info');
  };

  const reloadDatabase = () => {
    setDatabase(SheetsService.getLocalDatabase());
  };

  const handleQuickSync = async () => {
    setIsRefreshing(true);
    const res = await SheetsService.fetchFromSpreadsheet();
    setIsRefreshing(false);
    if (res.success && res.data) {
      setDatabase(res.data);
      showToast('Data Diperbarui', 'Sinkronisasi berhasil dengan Google Sheets.', 'success');
    } else {
      setDatabase(SheetsService.getLocalDatabase());
      showToast('Mode Cache Lokal', 'Menggunakan database tersimpan di perangkat.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Brand Accent Line (Blue, Orange, Green) */}
      <div className="h-1.5 bg-gradient-to-r from-blue-700 via-orange-500 to-emerald-500 w-full sticky top-0 z-50" />

      {/* Slim Top Header (Brand, User & Sync only — all features live in Left Sidebar) */}
      <header className="print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Drawer Trigger + Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              aria-label="Buka Menu Fitur"
              title="Buka Menu Fitur"
            >
              <Menu className="w-5 h-5" />
            </button>

            <img
              src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
              alt="Logo AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full bg-white p-0.5 shadow-sm border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-blue-950 tracking-tight leading-tight truncate">
                  AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  Google Sheets Sync
                </span>
                <span className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 shrink-0">
                  KKM 85
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                BSD City, Tangerang Selatan · Learning Management System (LMS)
              </p>
            </div>
          </div>

          {/* Right Header Identity & Quick Sync */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2">
                {currentUser.role === 'tutor' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100 text-blue-900 text-xs font-black border border-blue-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>PORTAL GURU</span>
                  </span>
                )}
                {currentUser.role === 'siswa' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>PORTAL SANTRI</span>
                  </span>
                )}
                {currentUser.role === 'admin' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-100 text-orange-900 text-xs font-black border border-orange-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span>PORTAL ADMIN</span>
                  </span>
                )}
              </div>
            )}

            {/* Quick Refresh Data */}
            <button
              onClick={handleQuickSync}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Sinkronkan data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* User Profile & Logout */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {currentUser.role === 'tutor' ? 'Tutor Pengampu' : currentUser.role === 'siswa' ? 'Santri' : 'Admin Lembaga'}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Keluar dari akun ini dan kembali ke pemilihan portal"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Masuk Portal</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* App Shell: Left Sidebar (All Features) + Main Content */}
      <div className="flex flex-1 w-full">
        <SidebarNav
          currentUser={currentUser}
          activeTab={activeTab}
          studentTab={studentTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onSelectStudentTab={(tab) => setStudentTab(tab)}
          onOpenAuthModal={(role) => openPortalLogin(role)}
          onOpenScanner={() => openScannerWithMode('auto')}
          onOpenSecurity={() => setShowSecurityModal(true)}
          onOpenSheets={openSheetsSetupGuarded}
          onLockScreen={() => handleLockScreen('manual')}
          onLogout={handleLogout}
          hasBiometric={hasBiometric}
          hasSheetsUrl={hasSheetsUrl}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Body */}
        <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Gateway Screen when not logged in - STRICT ROLE FOCUS */}
        {!currentUser && (
          <div className="space-y-8 animate-fade-in py-2 sm:py-6">
            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-bold text-slate-700">
                <img
                  src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
                  alt="Logo"
                  className="w-5 h-5 rounded-full object-contain"
                />
                <span>AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Sistem Manajemen Pembelajaran & Portal Terpadu (LMS)
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                Silakan pilih <strong className="text-slate-900">Portal Akses</strong> Anda. Setiap portal dirancang secara fokus, terisolasi, dan aman untuk menjamin kenyamanan belajar mengajar.
              </p>

              {/* Modern LMS Feature Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Standar KKM 85 Otomatis
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Halaqah Tahfidz & Smart ID
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  CBT Online & Tugas Terstruktur
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  Kelas Virtual & Digital Maktabah
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Enkripsi SHA-256 & WebAuthn
                </span>
              </div>
            </div>

            {/* 3 Focused Gateway Cards: Blue (Guru), Green (Siswa), Orange (Admin) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Card 1: PORTAL GURU (Royal Blue) */}
              <div className="bg-white rounded-3xl border-2 border-blue-200 hover:border-blue-600 shadow-md hover:shadow-2xl hover:shadow-blue-500/15 transition-all p-6 sm:p-7 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
                      <UserCheck className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      PORTAL GURU
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      Guru & Tutor KBM
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Ruang kerja pengajar untuk input nilai, presensi, jurnal mengajar, dan rekap pembelajaran.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Format 5 Kolom: <strong>NO, NAMA, KEHADIRAN, NILAI, MATERI</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Penilaian otomatis berpatokan <strong>Standar KKM 85</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Jurnal KBM harian & sinkronisasi Google Sheets</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Dukungan login biometrik Sidik Jari / Face ID</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => openPortalLogin('tutor')}
                    className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group-hover:gap-3 transition-all cursor-pointer"
                  >
                    <span>Masuk Portal Guru</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card 2: PORTAL SANTRI (Islamic Emerald Green) */}
              <div className="bg-white rounded-3xl border-2 border-emerald-200 hover:border-emerald-600 shadow-md hover:shadow-2xl hover:shadow-emerald-500/15 transition-all p-6 sm:p-7 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      PORTAL SANTRI
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Santri & Wali Murid
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Laporan komprehensif perkembangan ibadah harian, hafalan tahfidz, nilai, dan kartu santri.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Mutaba'ah Yaumiyah & Halaqah Tahfidz 30 Juz</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Kartu Santri Smart ID Digital</strong> (Flip 3D & QR)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Grafik nilai interaktif per bulan/semester</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Jadwal mingguan & kegiatan ekstrakurikuler</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => openPortalLogin('siswa')}
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 group-hover:gap-3 transition-all cursor-pointer"
                  >
                    <span>Buka Portal Santri</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card 3: PORTAL ADMINISTRATOR (Vibrant Orange) */}
              <div className="bg-white rounded-3xl border-2 border-orange-200 hover:border-orange-500 shadow-md hover:shadow-2xl hover:shadow-orange-500/15 transition-all p-6 sm:p-7 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                      PORTAL ADMIN
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                      Administrator & Pimpinan
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Pusat kendali lembaga, monitoring KBM terpadu, audit log, cetak dokumen, dan kalkulasi honor.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span><strong>Monitoring Central</strong> & filter pencarian global</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span><strong>Cetak Rapor Bulanan Resmi (PDF A4)</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span><strong>Auto AI Insight</strong> evaluasi pembelajaran Gemini</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span>Rekapitulasi honor tutor & audit keamanan SHA-256</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => openPortalLogin('admin')}
                    className="w-full py-3.5 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group-hover:gap-3 transition-all cursor-pointer"
                  >
                    <span>Masuk Portal Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Portal Login Bar (Password Protected) */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Akses Cepat Portal Login (Terproteksi Password):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openPortalLogin('tutor')}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-all cursor-pointer"
                >
                  Login Guru
                </button>
                <button
                  onClick={() => openPortalLogin('siswa')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-all cursor-pointer"
                >
                  Login Santri
                </button>
                <button
                  onClick={() => openPortalLogin('admin')}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold border border-orange-200 transition-all cursor-pointer"
                >
                  Login Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOCUSED ROLE 1: TUTOR / GURU */}
        {currentUser?.role === 'tutor' && (
          <>
            {activeTab === 'dashboard' && (
              <TutorDashboard
                user={currentUser}
                database={database}
                onSelectClassForInput={(id) => {
                  setSelectedClassId(id);
                  setActiveTab('input');
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'input' && (
              <TutorInputForm
                user={currentUser}
                database={database}
                selectedClassId={selectedClassId}
                onClassChange={(id) => setSelectedClassId(id)}
                onSaveSuccess={() => {
                  reloadDatabase();
                  setActiveTab('crud');
                }}
              />
            )}

            {activeTab === 'crud' && (
              <TutorHistoryCrud
                user={currentUser}
                database={database}
                onDataChanged={reloadDatabase}
              />
            )}

            {activeTab === 'rekap' && (
              <TutorRecapView database={database} tutorName={currentUser.name} />
            )}

            {activeTab === 'rapor-pekanan' && (
              <TutorWeeklyReportSender user={currentUser} database={database} />
            )}

            {activeTab === 'scan-gerbang' && (
              <GateAttendanceMonitor
                currentUser={currentUser}
                database={database}
                onOpenScannerModal={(mode) => openScannerWithMode(mode)}
                refreshSignal={gateRefreshTick}
                onDataSynced={reloadDatabase}
              />
            )}

            {activeTab === 'cbt' && (
              <CbtExamEngine
                isTutorView
                currentUser={currentUser}
                database={database}
                onSaveResultToDatabase={() => reloadDatabase()}
              />
            )}

            {activeTab === 'tugas' && (
              <AssignmentHub
                currentUser={currentUser}
                database={database}
                onGradeSubmitted={() => reloadDatabase()}
              />
            )}

            {activeTab === 'virtual' && (
              <VirtualClassroomHub currentUser={currentUser} />
            )}

            {activeTab === 'maktabah' && (
              <DigitalMaktabah />
            )}

            {activeTab === 'pengumuman' && (
              <AnnouncementBulletinBoard currentUser={currentUser} />
            )}
          </>
        )}

        {/* FOCUSED ROLE 2: SANTRI & WALI MURID */}
        {currentUser?.role === 'siswa' && (
          <StudentPortal
            currentUser={currentUser}
            database={database}
            controlledActiveTab={studentTab}
            onTabChange={setStudentTab}
            hideTopTabs={true}
          />
        )}

        {/* FOCUSED ROLE 3: ADMINISTRATOR */}
        {currentUser?.role === 'admin' && (
          <>
            {activeTab === 'monitoring' && (
              <AdminMonitoring
                database={database}
                onNavigateTab={(tab) => {
                  if (tab === 'settings') setShowSheetsModal(true);
                  else setActiveTab(tab);
                }}
              />
            )}

            {activeTab === 'print' && <AdminMonthlyReportPrint database={database} />}

            {activeTab === 'rapor-pekanan' && (
              <TutorWeeklyReportSender user={currentUser} database={database} />
            )}

            {activeTab === 'scan-gerbang' && (
              <GateAttendanceMonitor
                currentUser={currentUser}
                database={database}
                onOpenScannerModal={(mode) => openScannerWithMode(mode)}
                refreshSignal={gateRefreshTick}
                onDataSynced={reloadDatabase}
              />
            )}

            {activeTab === 'insight' && <AdminAIInsight database={database} />}

            {activeTab === 'fee' && <AdminTutorFeeReport database={database} />}

            {activeTab === 'tugas' && (
              <AssignmentHub
                currentUser={currentUser}
                database={database}
                onGradeSubmitted={() => reloadDatabase()}
              />
            )}

            {activeTab === 'cbt' && (
              <CbtExamEngine
                isTutorView
                currentUser={currentUser}
                database={database}
                onSaveResultToDatabase={() => reloadDatabase()}
              />
            )}

            {activeTab === 'virtual' && (
              <VirtualClassroomHub currentUser={currentUser} />
            )}

            {activeTab === 'maktabah' && (
              <DigitalMaktabah />
            )}

            {activeTab === 'pengumuman' && (
              <AnnouncementBulletinBoard currentUser={currentUser} />
            )}
          </>
        )}
      </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        database={database}
        onLogin={handleLogin}
        currentUser={currentUser}
        initialRole={authModalRole}
      />

      {/* Sheets Setup Modal */}
      <SheetsSetupModal
        isOpen={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
        onSyncComplete={() => {
          reloadDatabase();
          setHasSheetsUrl(Boolean(SheetsService.getScriptUrl()));
        }}
      />

      {/* Security & Biometric Settings Modal */}
      <SecuritySettingsModal
        isOpen={showSecurityModal}
        onClose={() => {
          setShowSecurityModal(false);
          if (currentUser) {
            setHasBiometric(BiometricService.isUserEnrolled(currentUser.name, currentUser.role));
          }
        }}
        currentUser={currentUser}
        onLockScreen={() => handleLockScreen('manual')}
      />

      {/* Screen Lock / Idle Timeout Shield Overlay */}
      <ScreenLockModal
        isLockedScreen={isScreenLocked}
        currentUser={currentUser}
        lockReason={lockReason}
        onUnlock={() => setIsScreenLocked(false)}
        onForceLogout={handleLogout}
      />

      {/* Attendance Barcode & QR Scanner Modal */}
      <AttendanceScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        database={database}
        currentUser={currentUser}
        initialMode={scannerInitialMode}
        onAttendanceLogged={() => reloadDatabase()}
        onGateScanComplete={() => {
          setGateRefreshTick((t) => t + 1);
          reloadDatabase();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <LMSApp />
    </ToastProvider>
  );
}
