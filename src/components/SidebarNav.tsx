import React, { useEffect, useMemo, useState } from 'react';
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
  ChevronDown,
  LogOut,
  X,
  Lock,
  SendHorizontal,
  UserPlus,
  CalendarClock,
  HeartHandshake,
  Trophy,
  ClipboardCheck,
  Wallet,
  Laptop,
  Award,
  Search,
} from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface SidebarNavGroup {
  id: string;
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
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMenuSearch('');
    setCollapsedGroups({});
  }, [currentUser?.role]);

  const tutorGroups: SidebarNavGroup[] = useMemo(
    () => [
      {
        id: 'tutor-home',
        title: 'Beranda & Jadwal',
        items: [
          { id: 'dashboard', label: 'Dashboard Tutor', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
          { id: 'jadwal-guru', label: 'Jadwal & Kelas Saya', icon: <CalendarClock className="w-4 h-4 shrink-0" /> },
          { id: 'pengumuman', label: 'Pengumuman Sekolah', icon: <Megaphone className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'tutor-eval',
        title: 'Presensi & Penilaian',
        items: [
          { id: 'input', label: 'Input Presensi & Nilai', icon: <PlusCircle className="w-4 h-4 shrink-0" /> },
          { id: 'crud', label: 'Riwayat & CRUD Data', icon: <History className="w-4 h-4 shrink-0" /> },
          { id: 'rekap', label: 'Rekapitulasi Kelas', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
          { id: 'scan-gerbang', label: 'Scan Hadir & Pulang', icon: <QrCode className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'tutor-report',
        title: 'Rapor & Bimbingan',
        items: [
          { id: 'rapor-pekanan', label: 'Rapor Pekanan', icon: <SendHorizontal className="w-4 h-4 shrink-0" /> },
          { id: 'rapor-tengah-semester', label: 'Rapor Tengah Semester', icon: <ClipboardCheck className="w-4 h-4 shrink-0" /> },
          { id: 'rapor-semester', label: 'Rapor Semester', icon: <Award className="w-4 h-4 shrink-0" /> },
          { id: 'konseling-guru', label: 'Perizinan & Konseling', icon: <HeartHandshake className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'tutor-lms',
        title: 'Pembelajaran Digital',
        items: [
          { id: 'cbt', label: 'Ujian CBT (KKM 85)', icon: <FileQuestion className="w-4 h-4 shrink-0" /> },
          { id: 'tugas', label: 'Kelola Tugas & PR', icon: <FileCheck className="w-4 h-4 shrink-0" /> },
          { id: 'virtual', label: 'Kelas Virtual & Forum', icon: <Video className="w-4 h-4 shrink-0" /> },
          { id: 'maktabah', label: 'Digital Maktabah', icon: <BookOpen className="w-4 h-4 shrink-0" /> },
        ],
      },
    ],
    []
  );

  const studentGroups: SidebarNavGroup[] = useMemo(
    () => [
      {
        id: 'stu-overview',
        title: 'Ringkasan & Kehadiran',
        items: [
          { id: 'radar', label: 'Potensi 360°', icon: <Target className="w-4 h-4 shrink-0" /> },
          { id: 'harian', label: 'Report Harian', icon: <Clock className="w-4 h-4 shrink-0" /> },
          { id: 'hadir-pulang', label: 'Jam Hadir & Pulang', icon: <QrCode className="w-4 h-4 shrink-0" /> },
          { id: 'jadwal', label: 'Jadwal KBM', icon: <Calendar className="w-4 h-4 shrink-0" /> },
          { id: 'pengumuman', label: 'Pengumuman Sekolah', icon: <Megaphone className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'stu-grades',
        title: 'Nilai & Rapor',
        items: [
          { id: 'grafik', label: 'Grafik Nilai (KKM 85)', icon: <BarChart2 className="w-4 h-4 shrink-0" /> },
          { id: 'pekanan', label: 'Rapor Pekanan Guru', icon: <SendHorizontal className="w-4 h-4 shrink-0" /> },
          { id: 'bulanan', label: 'Rapor Bulanan', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
          { id: 'tengah-semester', label: 'Rapor Tengah Semester', icon: <ClipboardCheck className="w-4 h-4 shrink-0" /> },
          { id: 'semester', label: 'Rapor Semester', icon: <Award className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'stu-boarding',
        title: 'Kepesantrenan & Layanan',
        items: [
          { id: 'mutabaah', label: "Mutaba'ah & Tahfidz", icon: <Flame className="w-4 h-4 shrink-0" /> },
          { id: 'adab', label: 'Bintang Akhlak & Adab', icon: <Star className="w-4 h-4 shrink-0" /> },
          { id: 'prestasi-santri', label: 'Prestasi & Portofolio', icon: <Trophy className="w-4 h-4 shrink-0" /> },
          { id: 'ekskul', label: 'Ekstrakurikuler', icon: <Compass className="w-4 h-4 shrink-0" /> },
          { id: 'izin-santri', label: 'Izin & Sakit Online', icon: <ClipboardCheck className="w-4 h-4 shrink-0" /> },
          { id: 'keuangan-santri', label: 'Keuangan & Tagihan SPP', icon: <Wallet className="w-4 h-4 shrink-0" /> },
          { id: 'kartu', label: 'Kartu Santri Smart ID', icon: <IdCard className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'stu-lms',
        title: 'Pembelajaran Digital',
        items: [
          { id: 'cbt', label: 'Ujian CBT (KKM 85)', icon: <FileQuestion className="w-4 h-4 shrink-0" /> },
          { id: 'tugas', label: 'Tugas & PR', icon: <FileCheck className="w-4 h-4 shrink-0" /> },
          { id: 'virtual', label: 'Kelas Virtual & Forum', icon: <Video className="w-4 h-4 shrink-0" /> },
          { id: 'maktabah', label: 'Digital Maktabah', icon: <BookOpen className="w-4 h-4 shrink-0" /> },
        ],
      },
    ],
    []
  );

  const adminGroups: SidebarNavGroup[] = useMemo(
    () => [
      {
        id: 'adm-core',
        title: 'Kendali & Kesiswaan',
        items: [
          { id: 'monitoring', label: 'Monitoring Central', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> },
          { id: 'kurikulum-jadwal', label: 'Jadwal & Kelas Guru', icon: <CalendarClock className="w-4 h-4 shrink-0" /> },
          { id: 'kurikulum-siswa', label: 'Siswa Masuk & Keluar', icon: <UserPlus className="w-4 h-4 shrink-0" /> },
          { id: 'direktori-alumni', label: 'Direktori Alumni', icon: <GraduationCap className="w-4 h-4 shrink-0" /> },
          { id: 'konseling-admin', label: 'Izin & Konseling Santri', icon: <HeartHandshake className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'adm-reports',
        title: 'Presensi & Pelaporan',
        items: [
          { id: 'scan-gerbang', label: 'Scan Hadir & Pulang', icon: <QrCode className="w-4 h-4 shrink-0" /> },
          { id: 'print', label: 'Cetak Rapor Bulanan', icon: <FileText className="w-4 h-4 shrink-0" /> },
          { id: 'rapor-pekanan', label: 'Rapor Pekanan Ortu', icon: <SendHorizontal className="w-4 h-4 shrink-0" /> },
          { id: 'rapor-tengah-semester', label: 'Rapor Tengah Semester', icon: <ClipboardCheck className="w-4 h-4 shrink-0" /> },
          { id: 'rapor-semester', label: 'Rapor Semester', icon: <Award className="w-4 h-4 shrink-0" /> },
          { id: 'insight', label: 'Auto AI Insight', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'adm-finance',
        title: 'Keuangan & Sarpras',
        items: [
          { id: 'keuangan-divisi', label: 'Divisi Keuangan & SPP', icon: <Wallet className="w-4 h-4 shrink-0" /> },
          { id: 'fee', label: 'Rekapitulasi Honor Tutor', icon: <DollarSign className="w-4 h-4 shrink-0" /> },
          { id: 'inventaris-aset', label: 'Inventaris Aset', icon: <Laptop className="w-4 h-4 shrink-0" /> },
        ],
      },
      {
        id: 'adm-lms',
        title: 'Manajemen LMS',
        items: [
          { id: 'tugas', label: 'Monitoring Tugas', icon: <FileCheck className="w-4 h-4 shrink-0" /> },
          { id: 'cbt', label: 'Pusat Ujian CBT', icon: <FileQuestion className="w-4 h-4 shrink-0" /> },
          { id: 'virtual', label: 'Ruang Virtual', icon: <Video className="w-4 h-4 shrink-0" /> },
          { id: 'maktabah', label: 'Digital Maktabah', icon: <BookOpen className="w-4 h-4 shrink-0" /> },
          { id: 'pengumuman', label: 'Pengumuman Sekolah', icon: <Megaphone className="w-4 h-4 shrink-0" /> },
        ],
      },
    ],
    []
  );

  const activeGroups: SidebarNavGroup[] = useMemo(() => {
    if (currentUser?.role === 'tutor') return tutorGroups;
    if (currentUser?.role === 'siswa') return studentGroups;
    if (currentUser?.role === 'admin') return adminGroups;
    return [];
  }, [currentUser?.role, tutorGroups, studentGroups, adminGroups]);

  const roleMeta = useMemo(() => {
    if (currentUser?.role === 'tutor') {
      return {
        portalLabel: 'Portal Guru',
        accentDot: 'bg-blue-600',
        activeItemClass: 'bg-blue-700 text-white shadow-xs',
        activeIconClass: 'text-white',
      };
    }
    if (currentUser?.role === 'siswa') {
      return {
        portalLabel: 'Portal Santri & Wali',
        accentDot: 'bg-emerald-600',
        activeItemClass: 'bg-emerald-700 text-white shadow-xs',
        activeIconClass: 'text-white',
      };
    }
    return {
      portalLabel: 'Portal Administrator',
      accentDot: 'bg-slate-900',
      activeItemClass: 'bg-slate-900 text-white shadow-xs',
      activeIconClass: 'text-white',
    };
  }, [currentUser?.role]);

  const selectedId = currentUser?.role === 'siswa' ? studentTab : activeTab;

  const filteredGroups = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return activeGroups;
    return activeGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            group.title.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeGroups, menuSearch]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleSelectItem = (id: string) => {
    if (currentUser?.role === 'siswa') {
      onSelectStudentTab(id as StudentPortalTab);
    } else {
      onSelectTab(id);
    }
    onCloseMobile();
  };

  const renderSidebarContent = (isMobileDrawer: boolean) => {
    const collapsed = !isMobileDrawer && isCollapsed;
    const isSearching = Boolean(menuSearch.trim());

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Sidebar Header / Role Context */}
        <div
          className={`px-3.5 py-3 border-b border-slate-200 flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          } gap-2`}
        >
          {!collapsed && (
            <div className="min-w-0">
              {currentUser ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${roleMeta.accentDot}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500 leading-tight">
                      {roleMeta.portalLabel}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate leading-tight mt-0.5">
                      {currentUser.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 leading-tight">
                      Navigasi Portal
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-tight mt-0.5">
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
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title={collapsed ? 'Perluas Sidebar Menu' : 'Perkecil Sidebar Menu'}
              aria-label={collapsed ? 'Perluas Sidebar Menu' : 'Perkecil Sidebar Menu'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Quick Menu Search (shown when logged in and sidebar expanded) */}
        {currentUser && !collapsed && (
          <div className="px-3 pt-3 pb-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Cari menu..."
                aria-label="Cari menu navigasi"
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-300 transition-colors"
              />
              {menuSearch && (
                <button
                  type="button"
                  onClick={() => setMenuSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Bersihkan pencarian menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Feature Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3" aria-label="Menu utama">
          {!currentUser && (
            <div className="space-y-1.5">
              {!collapsed && (
                <div className="px-2 pb-1 text-[11px] font-semibold text-slate-500">
                  Portal Login Pengguna
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onOpenAuthModal('tutor');
                  onCloseMobile();
                }}
                title="Masuk Portal Guru / Tutor"
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-2' : 'px-2.5'
                } py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 transition-colors gap-2.5 cursor-pointer`}
              >
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                {!collapsed && <span className="truncate">Portal Guru / Tutor</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenAuthModal('siswa');
                  onCloseMobile();
                }}
                title="Masuk Portal Santri & Wali Murid"
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-2' : 'px-2.5'
                } py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70 transition-colors gap-2.5 cursor-pointer`}
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                {!collapsed && <span className="truncate">Portal Santri & Wali</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenAuthModal('admin');
                  onCloseMobile();
                }}
                title="Masuk Portal Administrator"
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-2' : 'px-2.5'
                } py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors gap-2.5 cursor-pointer`}
              >
                <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
                {!collapsed && <span className="truncate">Portal Administrator</span>}
              </button>
            </div>
          )}

          {currentUser && filteredGroups.length === 0 && !collapsed && (
            <div className="px-2.5 py-6 text-center text-xs text-slate-400">
              Menu &ldquo;{menuSearch}&rdquo; tidak ditemukan.
            </div>
          )}

          {currentUser &&
            filteredGroups.map((group, groupIdx) => {
              const hasActiveItem = group.items.some((item) => item.id === selectedId);
              const isGroupCollapsed =
                !isSearching && !collapsed && Boolean(collapsedGroups[group.id]) && !hasActiveItem;

              return (
                <div
                  key={group.id}
                  className={groupIdx > 0 ? 'pt-2.5 border-t border-slate-100' : ''}
                >
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="truncate">{group.title}</span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                        <span>{group.items.length}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            isGroupCollapsed ? '-rotate-90' : ''
                          }`}
                        />
                      </span>
                    </button>
                  )}

                  {!isGroupCollapsed && (
                    <div className={`space-y-0.5 ${!collapsed ? 'mt-1' : ''}`}>
                      {group.items.map((item) => {
                        const isActive = selectedId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectItem(item.id)}
                            title={item.label}
                            className={`w-full flex items-center ${
                              collapsed ? 'justify-center px-2' : 'px-2.5'
                            } py-2 rounded-lg text-xs font-medium transition-colors gap-2.5 cursor-pointer ${
                              isActive
                                ? `${roleMeta.activeItemClass} font-semibold`
                                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                            }`}
                          >
                            <span
                              className={isActive ? roleMeta.activeIconClass : 'text-slate-400'}
                            >
                              {item.icon}
                            </span>
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Utility & System Tools Group (RBAC-Protected) */}
          {currentUser && (
            <div className="pt-2.5 border-t border-slate-200">
              {!collapsed && (
                <div className="px-2 pb-1 text-[11px] font-semibold text-slate-500">
                  Utilitas & Keamanan
                </div>
              )}
              <div className="space-y-0.5">
                {(currentUser.role === 'tutor' || currentUser.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenScanner();
                      onCloseMobile();
                    }}
                    title="Scanner Presensi QR & Barcode"
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-2' : 'px-2.5'
                    } py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 transition-colors gap-2.5 cursor-pointer`}
                  >
                    <QrCode className="w-4 h-4 text-slate-500 shrink-0" />
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
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-2' : 'px-2.5'
                  } py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 transition-colors gap-2.5 cursor-pointer`}
                >
                  <Fingerprint
                    className={`w-4 h-4 shrink-0 ${
                      hasBiometric ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  />
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
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-2' : 'px-2.5'
                  } py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-800 transition-colors gap-2.5 cursor-pointer`}
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
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-2' : 'px-2.5'
                    } py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors gap-2.5 cursor-pointer`}
                  >
                    <FileSpreadsheet
                      className={`w-4 h-4 shrink-0 ${
                        hasSheetsUrl ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    />
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
        </nav>

        {/* Bottom Logout Footer */}
        {currentUser && (
          <div className="p-2.5 border-t border-slate-200 bg-slate-50/70">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onCloseMobile();
              }}
              title="Keluar dari akun"
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-2' : 'px-2.5'
              } py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors gap-2 cursor-pointer`}
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
        className={`print:hidden hidden md:flex flex-col shrink-0 border-r border-slate-200 bg-white sticky top-14 h-[calc(100vh-3.5rem)] transition-all duration-200 z-30 ${
          isCollapsed ? 'w-16' : 'w-64 lg:w-[272px]'
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
