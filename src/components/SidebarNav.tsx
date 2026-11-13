import React from 'react';
import { ActiveUser } from '../types';
import { StudentPortalTab } from './student/StudentPortal';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  BarChart3,
  FileQuestion,
  FileCheck,
  Video,
  BookOpen,
  Megaphone,
  GraduationCap,
  ShieldCheck,
  FileText,
  Sparkles,
  DollarSign,
  Target,
  Flame,
  Star,
  IdCard,
  Calendar,
  BarChart2,
  Compass,
  Clock,
  TrendingUp,
  QrCode,
  Fingerprint,
  FileSpreadsheet,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Lock,
  SendHorizontal,
} from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  accent?: 'blue' | 'emerald' | 'orange';
  badge?: string;
}

export interface SidebarNavGroup {
  title: string;
  items: SidebarNavItem[];
}

interface SidebarNavProps {
  currentUser: ActiveUser | null;
  activeTab: string;
  studentTab: StudentPortalTab;
  onSelectTab: (tab: string) => void;
  onSelectStudentTab: (tab: StudentPortalTab) => void;
  onOpenAuthModal: (role: 'tutor' | 'siswa' | 'admin') => void;
  onOpenScanner: () => void;
  onOpenSecurity: () => void;
  onOpenSheets: () => void;
  onLockScreen: () => void;
  onLogout: () => void;
  hasBiometric: boolean;
  hasSheetsUrl: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function SidebarNav({
  currentUser,
  activeTab,
  studentTab,
  onSelectTab,
  onSelectStudentTab,
  onOpenAuthModal,
  onOpenScanner,
  onOpenSecurity,
  onOpenSheets,
  onLockScreen,
  onLogout,
  hasBiometric,
  hasSheetsUrl,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarNavProps) {
  const getActiveStyle = (isActive: boolean, accent: 'blue' | 'emerald' | 'orange' = 'blue') => {
    if (!isActive) {
      return 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90';
    }
    if (accent === 'emerald') {
      return 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20';
    }
    if (accent === 'orange') {
      return 'bg-orange-500 text-white shadow-sm shadow-orange-500/20';
    }
    return 'bg-blue-600 text-white shadow-sm shadow-blue-600/20';
  };

  // Menu groups per role
  const tutorGroups: SidebarNavGroup[] = [
    {
      title: 'Akademik & KBM',
      items: [
        { id: 'dashboard', label: 'Dashboard Tutor', icon: <LayoutDashboard className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'input', label: 'Input Presensi & Nilai', icon: <PlusCircle className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'crud', label: 'Riwayat & CRUD Data', icon: <History className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'rekap', label: 'Rekapitulasi Kelas', icon: <BarChart3 className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'scan-gerbang', label: 'Scan Hadir & Pulang', icon: <QrCode className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'rapor-pekanan', label: 'Kirim Rapor Pekanan', icon: <SendHorizontal className="w-4 h-4 shrink-0" />, accent: 'emerald' },
      ],
    },
    {
      title: 'Pembelajaran Digital',
      items: [
        { id: 'cbt', label: 'Ujian CBT (KKM 85)', icon: <FileQuestion className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'tugas', label: 'Kelola Tugas & PR', icon: <FileCheck className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'virtual', label: 'Kelas Virtual & Forum', icon: <Video className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'maktabah', label: 'Digital Maktabah', icon: <BookOpen className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'pengumuman', label: 'Pengumuman Sekolah', icon: <Megaphone className="w-4 h-4 shrink-0" />, accent: 'orange' },
      ],
    },
  ];

  const studentGroups: SidebarNavGroup[] = [
    {
      title: 'Akademik & Evaluasi',
      items: [
        { id: 'radar', label: 'Potensi 360°', icon: <Target className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'grafik', label: 'Grafik Nilai (KKM 85)', icon: <BarChart2 className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'harian', label: 'Report Harian', icon: <Clock className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'hadir-pulang', label: 'Jam Hadir & Pulang', icon: <QrCode className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'pekanan', label: 'Rapor Pekanan Guru', icon: <SendHorizontal className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'bulanan', label: 'Rapor Bulanan', icon: <TrendingUp className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'jadwal', label: 'Jadwal KBM', icon: <Calendar className="w-4 h-4 shrink-0" />, accent: 'orange' },
      ],
    },
    {
      title: 'Kepesantrenan & Adab',
      items: [
        { id: 'mutabaah', label: "Mutaba'ah & Tahfidz", icon: <Flame className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'adab', label: 'Bintang Akhlak & Adab', icon: <Star className="w-4 h-4 shrink-0" />, accent: 'orange' },
        { id: 'ekskul', label: 'Ekstrakurikuler', icon: <Compass className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'kartu', label: 'Kartu Santri Smart ID', icon: <IdCard className="w-4 h-4 shrink-0" />, accent: 'blue' },
      ],
    },
    {
      title: 'E-Learning & Info',
      items: [
        { id: 'cbt', label: 'Ujian CBT (KKM 85)', icon: <FileQuestion className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'tugas', label: 'Tugas & PR', icon: <FileCheck className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'virtual', label: 'Kelas Virtual & Forum', icon: <Video className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'maktabah', label: 'Digital Maktabah', icon: <BookOpen className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'pengumuman', label: 'Pengumuman', icon: <Megaphone className="w-4 h-4 shrink-0" />, accent: 'orange' },
      ],
    },
  ];

  const adminGroups: SidebarNavGroup[] = [
    {
      title: 'Kendali & Pelaporan',
      items: [
        { id: 'monitoring', label: 'Monitoring Central', icon: <ShieldCheck className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'scan-gerbang', label: 'Scan Hadir & Pulang', icon: <QrCode className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'print', label: 'Cetak Rapor Bulanan', icon: <FileText className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'rapor-pekanan', label: 'Rapor Pekanan Ortu', icon: <SendHorizontal className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'insight', label: 'Auto AI Insight', icon: <Sparkles className="w-4 h-4 shrink-0" />, accent: 'orange' },
        { id: 'fee', label: 'Rekapitulasi Honor Tutor', icon: <DollarSign className="w-4 h-4 shrink-0" />, accent: 'emerald' },
      ],
    },
    {
      title: 'Manajemen LMS',
      items: [
        { id: 'tugas', label: 'Monitoring Tugas', icon: <FileCheck className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'cbt', label: 'Pusat Ujian CBT', icon: <FileQuestion className="w-4 h-4 shrink-0" />, accent: 'blue' },
        { id: 'virtual', label: 'Ruang Virtual', icon: <Video className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'maktabah', label: 'Digital Maktabah', icon: <BookOpen className="w-4 h-4 shrink-0" />, accent: 'emerald' },
        { id: 'pengumuman', label: 'Pengumuman', icon: <Megaphone className="w-4 h-4 shrink-0" />, accent: 'orange' },
      ],
    },
  ];

  const renderSidebarContent = (isMobileDrawer: boolean) => {
    const collapsed = !isMobileDrawer && isCollapsed;

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Sidebar Header / Role Context */}
        <div className={`p-3.5 border-b border-slate-200/80 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          {!collapsed && (
            <div className="min-w-0">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${
                      currentUser.role === 'tutor'
                        ? 'bg-blue-600'
                        : currentUser.role === 'siswa'
                          ? 'bg-emerald-600'
                          : 'bg-orange-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {currentUser.role === 'tutor'
                        ? 'PORTAL GURU'
                        : currentUser.role === 'siswa'
                          ? 'PORTAL SANTRI'
                          : 'PORTAL ADMIN'}
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {currentUser.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      NAVIGASI PORTAL
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Pilih Akses Masuk
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title={collapsed ? 'Perluas Sidebar Fitur' : 'Perkecil Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Scrollable Feature Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {!currentUser && (
            <div className="space-y-4">
              <div>
                {!collapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Portal Login Pengguna
                  </div>
                )}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuthModal('tutor');
                      onCloseMobile();
                    }}
                    title="Masuk Portal Guru / Tutor"
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-600 hover:text-white transition-all gap-2.5 cursor-pointer`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Portal Guru / Tutor</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuthModal('siswa');
                      onCloseMobile();
                    }}
                    title="Masuk Portal Santri & Walmur"
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-600 hover:text-white transition-all gap-2.5 cursor-pointer`}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Portal Santri & Walmur</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuthModal('admin');
                      onCloseMobile();
                    }}
                    title="Masuk Portal Administrator"
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold text-orange-700 bg-orange-50/80 hover:bg-orange-500 hover:text-white transition-all gap-2.5 cursor-pointer`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Portal Administrator</span>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentUser?.role === 'tutor' &&
            tutorGroups.map((group) => (
              <div key={group.title}>
                {!collapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        title={item.label}
                        className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold transition-all gap-2.5 cursor-pointer ${getActiveStyle(
                          isActive,
                          item.accent
                        )}`}
                      >
                        {item.icon}
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {currentUser?.role === 'siswa' &&
            studentGroups.map((group) => (
              <div key={group.title}>
                {!collapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = studentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectStudentTab(item.id as StudentPortalTab);
                          onCloseMobile();
                        }}
                        title={item.label}
                        className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold transition-all gap-2.5 cursor-pointer ${getActiveStyle(
                          isActive,
                          item.accent
                        )}`}
                      >
                        {item.icon}
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {currentUser?.role === 'admin' &&
            adminGroups.map((group) => (
              <div key={group.title}>
                {!collapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        title={item.label}
                        className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold transition-all gap-2.5 cursor-pointer ${getActiveStyle(
                          isActive,
                          item.accent
                        )}`}
                      >
                        {item.icon}
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Utility & System Tools Group (RBAC-Protected on the Left) */}
          {currentUser && (
            <div className="pt-2 border-t border-slate-200/80">
              {!collapsed && (
                <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Alat & Keamanan Sistem
                </div>
              )}
              <div className="space-y-1">
                {(currentUser.role === 'tutor' || currentUser.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenScanner();
                      onCloseMobile();
                    }}
                    title="Scanner Presensi QR & Barcode"
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all gap-2.5 cursor-pointer`}
                  >
                    <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                    {!collapsed && <span className="truncate">Scan Presensi QR</span>}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onOpenSecurity();
                    onCloseMobile();
                  }}
                  title="Pusat Keamanan, PIN & Biometrik WebAuthn"
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold transition-all gap-2.5 cursor-pointer ${
                    hasBiometric
                      ? 'text-blue-800 bg-blue-50/70 hover:bg-blue-100'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Fingerprint className={`w-4 h-4 shrink-0 ${hasBiometric ? 'text-blue-600' : 'text-slate-500'}`} />
                  {!collapsed && (
                    <span className="truncate">
                      {hasBiometric ? 'Keamanan & Biometrik' : 'Pusat Keamanan'}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLockScreen();
                    onCloseMobile();
                  }}
                  title="Kunci Layar Portal Sekarang"
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50/60 hover:bg-amber-100 transition-all gap-2.5 cursor-pointer`}
                >
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  {!collapsed && <span className="truncate">Kunci Layar</span>}
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSheets();
                      onCloseMobile();
                    }}
                    title="Pengaturan Google Sheets (Khusus Admin)"
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold transition-all gap-2.5 cursor-pointer ${
                      hasSheetsUrl
                        ? 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileSpreadsheet className={`w-4 h-4 shrink-0 ${hasSheetsUrl ? 'text-emerald-600' : 'text-slate-500'}`} />
                    {!collapsed && (
                      <span className="truncate">
                        {hasSheetsUrl ? 'Google Sheets (Aktif)' : 'Setup Google Sheets'}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Logout Footer */}
        {currentUser && (
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/70">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onCloseMobile();
              }}
              title="Keluar dari akun"
              className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all gap-2 cursor-pointer`}
            >
              <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
              {!collapsed && <span>Keluar Akun</span>}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside
        className={`print:hidden hidden md:flex flex-col shrink-0 border-r border-slate-200 bg-white sticky top-16 h-[calc(100vh-4rem)] transition-all duration-200 z-30 ${
          isCollapsed ? 'w-18' : 'w-64 lg:w-72'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Left Slide-Out Drawer */}
      {mobileOpen && (
        <div className="print:hidden md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl z-10 flex flex-col animate-fade-in">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
