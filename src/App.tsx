import React, { useState, useEffect } from 'react';
import { ActiveUser, DatabaseState } from './types';
import { SheetsService } from './services/sheetsService';
import { ToastProvider, useToast } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { SheetsSetupModal } from './components/SheetsSetupModal';

// Tutor Components
import { TutorDashboard } from './components/tutor/TutorDashboard';
import { TutorInputForm } from './components/tutor/TutorInputForm';
import { TutorHistoryCrud } from './components/tutor/TutorHistoryCrud';
import { TutorRecapView } from './components/tutor/TutorRecapView';

// Student Component
import { StudentPortal } from './components/student/StudentPortal';

// Admin Components
import { AdminMonitoring } from './components/admin/AdminMonitoring';
import { AdminMonthlyReportPrint } from './components/admin/AdminMonthlyReportPrint';
import { AdminAIInsight } from './components/admin/AdminAIInsight';
import { AdminTutorFeeReport } from './components/admin/AdminTutorFeeReport';

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
} from 'lucide-react';

function LMSApp() {
  const { showToast } = useToast();

  // Database State
  const [database, setDatabase] = useState<DatabaseState>(() => SheetsService.getLocalDatabase());

  // Active User State
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(() => {
    const saved = localStorage.getItem('edumanage_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default: Budi Santoso (Tutor)
    return {
      role: 'tutor',
      name: 'Budi Santoso, S.Pd.',
      id_tutor: 'TUTOR-001',
    };
  });

  // Active Navigation Tab
  // For tutor: 'dashboard' | 'input' | 'crud' | 'rekap'
  // For siswa: 'portal'
  // For admin: 'monitoring' | 'print' | 'insight' | 'fee'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Selected Class ID for Input form
  const [selectedClassId, setSelectedClassId] = useState<string>('KLS-10A-MAT');

  // Modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSheetsModal, setShowSheetsModal] = useState<boolean>(false);
  const [hasSheetsUrl, setHasSheetsUrl] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Check sheets URL
  useEffect(() => {
    setHasSheetsUrl(Boolean(SheetsService.getScriptUrl()));
  }, []);

  // Save current user to localStorage
  const handleLogin = (user: ActiveUser) => {
    setCurrentUser(user);
    localStorage.setItem('edumanage_user', JSON.stringify(user));
    setShowAuthModal(false);

    // Switch tab according to role
    if (user.role === 'tutor') {
      setActiveTab('dashboard');
    } else if (user.role === 'siswa') {
      setActiveTab('portal');
    } else if (user.role === 'admin') {
      setActiveTab('monitoring');
    }

    showToast(`Selamat Datang, ${user.name}!`, `Masuk sebagai ${user.role.toUpperCase()}`, 'success');
  };

  const handleLogout = () => {
    setShowAuthModal(true);
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-20 md:pb-8 text-slate-800">
      {/* Top Navbar */}
      <header className="print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
              alt="Logo AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK"
              className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow-sm border border-slate-200 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  AL-WILDAN ISLAMIC SCHOOL 29
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  Google Sheets Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Kota Depok · Learning Management System (LMS)
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Google Sheets Status Pill */}
            <button
              onClick={() => setShowSheetsModal(true)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                hasSheetsUrl
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Pengaturan Google Sheets"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${hasSheetsUrl ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="hidden md:inline">
                {hasSheetsUrl ? 'Sheets Terhubung' : 'Setup Google Sheets'}
              </span>
            </button>

            {/* Quick Refresh Data */}
            <button
              onClick={handleQuickSync}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Sinkronkan data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* User Profile & Role Switcher */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="max-w-[120px] truncate">{currentUser.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/20">
                    {currentUser.role}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Role Navigation Bar */}
        <div className="hidden md:block bg-slate-50 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5">
            {currentUser?.role === 'tutor' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard Tutor
                </button>
                <button
                  onClick={() => setActiveTab('input')}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'input'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Input Presensi & Nilai
                </button>
                <button
                  onClick={() => setActiveTab('crud')}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'crud'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Riwayat & CRUD Data
                </button>
                <button
                  onClick={() => setActiveTab('rekap')}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'rekap'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Rekapitulasi Kelas & Mapel
                </button>
              </>
            )}

            {currentUser?.role === 'siswa' && (
              <button
                onClick={() => setActiveTab('portal')}
                className="py-2 px-3.5 rounded-lg text-xs font-bold bg-white text-indigo-700 shadow-sm flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Portal Laporan Siswa & Walmur
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'monitoring'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Monitoring Central
                </button>
                <button
                  onClick={() => setActiveTab('print')}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'print'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Cetak Rapor Bulanan (PDF)
                </button>
                <button
                  onClick={() => setActiveTab('insight')}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'insight'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Auto AI Insight
                </button>
                <button
                  onClick={() => setActiveTab('fee')}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'fee'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Rekapitulasi Honor Tutor
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
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
          </>
        )}

        {currentUser?.role === 'siswa' && (
          <StudentPortal currentUser={currentUser} database={database} />
        )}

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

            {activeTab === 'insight' && <AdminAIInsight database={database} />}

            {activeTab === 'fee' && <AdminTutorFeeReport database={database} />}
          </>
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar (Visible only on mobile) */}
      <nav className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {currentUser?.role === 'tutor' && (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-all ${
                activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Beranda</span>
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-all ${
                activeTab === 'input' ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <PlusCircle className="w-5 h-5 mb-0.5" />
              <span>Input</span>
            </button>
            <button
              onClick={() => setActiveTab('crud')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-all ${
                activeTab === 'crud' ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <History className="w-5 h-5 mb-0.5" />
              <span>Riwayat</span>
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-all ${
                activeTab === 'rekap' ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span>Rekap</span>
            </button>
            <button
              onClick={() => setShowSheetsModal(true)}
              className="flex flex-col items-center py-1 px-2 text-[10px] font-semibold text-slate-500 hover:text-emerald-600 transition-all"
            >
              <FileSpreadsheet className="w-5 h-5 mb-0.5 text-emerald-600" />
              <span>Sheets</span>
            </button>
          </>
        )}

        {currentUser?.role === 'siswa' && (
          <>
            <button
              onClick={() => setActiveTab('portal')}
              className="flex flex-col items-center py-1 px-3 text-[10px] font-semibold text-indigo-600"
            >
              <GraduationCap className="w-5 h-5 mb-0.5" />
              <span>Laporan Saya</span>
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex flex-col items-center py-1 px-3 text-[10px] font-semibold text-slate-500"
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Ganti Siswa</span>
            </button>
            <button
              onClick={() => setShowSheetsModal(true)}
              className="flex flex-col items-center py-1 px-3 text-[10px] font-semibold text-slate-500"
            >
              <FileSpreadsheet className="w-5 h-5 mb-0.5" />
              <span>Koneksi</span>
            </button>
          </>
        )}

        {currentUser?.role === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-all ${
                activeTab === 'monitoring' ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <ShieldCheck className="w-5 h-5 mb-0.5" />
              <span>Monitoring</span>
            </button>
            <button
              onClick={() => setActiveTab('print')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-all ${
                activeTab === 'print' ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={() => setActiveTab('insight')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-all ${
                activeTab === 'insight' ? 'text-purple-600' : 'text-slate-500'
              }`}
            >
              <Sparkles className="w-5 h-5 mb-0.5 text-purple-600" />
              <span>AI Insight</span>
            </button>
            <button
              onClick={() => setActiveTab('fee')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-all ${
                activeTab === 'fee' ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              <DollarSign className="w-5 h-5 mb-0.5 text-emerald-600" />
              <span>Honor</span>
            </button>
            <button
              onClick={() => setShowSheetsModal(true)}
              className="flex flex-col items-center py-1 px-2 text-[10px] font-semibold text-slate-500"
            >
              <FileSpreadsheet className="w-5 h-5 mb-0.5" />
              <span>Sheets</span>
            </button>
          </>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        database={database}
        onLogin={handleLogin}
        currentUser={currentUser}
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
