import React, { useMemo, useState } from 'react';
import {
  ActiveUser,
  AlumniAdmissionPath,
  AlumniCareerSector,
  AlumniContactStatus,
  AlumniRecord,
  AlumniUniversityCategory,
  DatabaseState,
} from '../../types';
import { AlumniDirectoryService } from '../../services/alumniDirectoryService';
import { SheetsService } from '../../services/sheetsService';
import { SecurityService } from '../../services/securityService';
import { AdminAlumniCharts } from './AdminAlumniCharts';
import { AdminAlumniGeoMap } from './AdminAlumniGeoMap';
import { AdminAlumniCampusMap } from './AdminAlumniCampusMap';
import { AdminAlumniUniversityCategoryMap } from './AdminAlumniUniversityCategoryMap';
import { AdminAlumniDetailModal } from './AdminAlumniDetailModal';
import {
  UNIVERSITY_CATEGORIES,
  inferUniversityCategory,
  resolveAlumniGeo,
  resolveAlumniUniversityCategory,
} from './alumniGeoData';
import { useToast } from '../Toast';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  CloudUpload,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  LayoutGrid,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Table as TableIcon,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

interface AdminAlumniDirectoryProps {
  database: DatabaseState;
  currentUser: ActiveUser;
  onOpenSheetsSetup: () => void;
}

const CAREER_SECTORS: AlumniCareerSector[] = [
  'Mahasiswa / Studi Lanjut',
  'Teknologi & IT',
  'Kesehatan & Kedokteran',
  'Pendidikan & Dakwah',
  'Bisnis & Wirausaha',
  'Keuangan & Hukum',
  'Lainnya',
];

const ADMISSION_PATHS: AlumniAdmissionPath[] = [
  'SNBP',
  'SNBT / UTBK',
  'Seleksi Mandiri',
  'Beasiswa Internasional / Timur Tengah',
  'Kedinasan / Ikatan Dinas',
  'Beasiswa Prestasi / Tahfidz',
  'Lainnya',
];

const CONTACT_STATUSES: AlumniContactStatus[] = [
  'Aktif Terhubung',
  'Perlu Verifikasi',
  'Menunggu Respon',
  'Nomor Tidak Aktif',
];

function getContactStatusPresentation(status: AlumniContactStatus) {
  switch (status) {
    case 'Aktif Terhubung':
      return {
        textClass: 'text-emerald-700',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      };
    case 'Perlu Verifikasi':
      return {
        textClass: 'text-amber-700',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      };
    case 'Menunggu Respon':
      return {
        textClass: 'text-blue-700',
        icon: <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
      };
    case 'Nomor Tidak Aktif':
      return {
        textClass: 'text-rose-700',
        icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      };
  }
}

function buildWhatsAppHref(phone: string, alumniName: string, yearGraduated: number) {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  const msg = encodeURIComponent(
    `Assalamu'alaikum warahmatullahi wabarakatuh ${alumniName} (Alumni Lulus ${yearGraduated} AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY). Kami dari bagian Jejaring Alumni ingin menyapa dan memperbarui data profil alumni Anda.`
  );
  return `https://wa.me/${normalized}?text=${msg}`;
}

export function AdminAlumniDirectory({
  database,
  currentUser,
  onOpenSheetsSetup,
}: AdminAlumniDirectoryProps) {
  const { showToast } = useToast();
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [showCsvMenu, setShowCsvMenu] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entryYearFilter, setEntryYearFilter] = useState<string>('all');
  const [gradYearFrom, setGradYearFrom] = useState<string>('all');
  const [gradYearTo, setGradYearTo] = useState<string>('all');
  const [admissionPathFilter, setAdmissionPathFilter] = useState<'all' | AlumniAdmissionPath>('all');
  const [selectedProfessions, setSelectedProfessions] = useState<AlumniCareerSector[]>([]);
  const [contactFilter, setContactFilter] = useState<'all' | AlumniContactStatus>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [uniCategoryFilter, setUniCategoryFilter] = useState<'all' | AlumniUniversityCategory>(
    'all'
  );
  const [mentorOnly, setMentorOnly] = useState<boolean>(false);

  // Form / Edit / Detail drawers & modals
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingAlumni, setEditingAlumni] = useState<AlumniRecord | null>(null);
  const [selectedAlumniId, setSelectedAlumniId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Add form state
  const currentYear = new Date().getFullYear();
  const [newNis, setNewNis] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newEntryYear, setNewEntryYear] = useState<number>(currentYear - 3);
  const [newGradYear, setNewGradYear] = useState<number>(currentYear);
  const [newAngkatan, setNewAngkatan] = useState<string>('');
  const [newCampus, setNewCampus] = useState<string>('Kampus Utama BSD City');
  const [newLastClass, setNewLastClass] = useState<string>('12 SMA Unggulan A');
  const [newAcceptedCampus, setNewAcceptedCampus] = useState<string>('');
  const [newUniCategory, setNewUniCategory] = useState<AlumniUniversityCategory>(
    'Perguruan Tinggi Negeri'
  );
  const [newAcceptedYear, setNewAcceptedYear] = useState<number>(currentYear);
  const [newAcceptedMajor, setNewAcceptedMajor] = useState<string>('');
  const [newAdmissionPath, setNewAdmissionPath] = useState<AlumniAdmissionPath>('SNBT / UTBK');
  const [newSector, setNewSector] = useState<AlumniCareerSector>('Mahasiswa / Studi Lanjut');
  const [newProfession, setNewProfession] = useState<string>('');
  const [newInstitution, setNewInstitution] = useState<string>('');
  const [newCity, setNewCity] = useState<string>('Tangerang Selatan');
  const [newContactStatus, setNewContactStatus] = useState<AlumniContactStatus>('Aktif Terhubung');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newLinkedin, setNewLinkedin] = useState<string>('');
  const [newMentoring, setNewMentoring] = useState<boolean>(true);
  const [newNote, setNewNote] = useState<string>('');

  // Edit form state
  const [editEntryYear, setEditEntryYear] = useState<number>(2020);
  const [editGradYear, setEditGradYear] = useState<number>(2023);
  const [editAngkatan, setEditAngkatan] = useState<string>('');
  const [editCampus, setEditCampus] = useState<string>('Kampus Utama BSD City');
  const [editLastClass, setEditLastClass] = useState<string>('');
  const [editAcceptedCampus, setEditAcceptedCampus] = useState<string>('');
  const [editUniCategory, setEditUniCategory] = useState<AlumniUniversityCategory>(
    'Perguruan Tinggi Negeri'
  );
  const [editAcceptedYear, setEditAcceptedYear] = useState<number>(2023);
  const [editAcceptedMajor, setEditAcceptedMajor] = useState<string>('');
  const [editAdmissionPath, setEditAdmissionPath] = useState<AlumniAdmissionPath>('SNBT / UTBK');
  const [editSector, setEditSector] = useState<AlumniCareerSector>('Teknologi & IT');
  const [editProfession, setEditProfession] = useState<string>('');
  const [editInstitution, setEditInstitution] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [editContactStatus, setEditContactStatus] =
    useState<AlumniContactStatus>('Aktif Terhubung');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editLinkedin, setEditLinkedin] = useState<string>('');
  const [editMentoring, setEditMentoring] = useState<boolean>(true);
  const [editLastContacted, setEditLastContacted] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

  const hasSheetsUrl = Boolean(SheetsService.getScriptUrl());

  const allAlumni = useMemo(() => {
    void refreshTick;
    return AlumniDirectoryService.getAllAlumni();
  }, [refreshTick]);

  const selectedAlumni = useMemo(
    () => (selectedAlumniId ? allAlumni.find((a) => a.id === selectedAlumniId) || null : null),
    [allAlumni, selectedAlumniId]
  );

  const campuses = useMemo(() => {
    const set = new Set<string>([
      'Kampus Utama BSD City',
      'Kampus Sains BSD City',
      'Kampus Tahfidz BSD City',
    ]);
    database.master_siswa.forEach((s) => s.cabang && set.add(s.cabang));
    allAlumni.forEach((a) => a.kampus_asal && set.add(a.kampus_asal));
    return Array.from(set);
  }, [database.master_siswa, allAlumni]);

  const entryYears = useMemo(() => {
    const set = new Set<number>();
    allAlumni.forEach((a) => set.add(a.tahun_masuk));
    return Array.from(set).sort((a, b) => b - a);
  }, [allAlumni]);

  const gradYears = useMemo(() => {
    const set = new Set<number>();
    allAlumni.forEach((a) => set.add(a.tahun_lulus));
    return Array.from(set).sort((a, b) => a - b);
  }, [allAlumni]);

  const professionCounts = useMemo(() => {
    const counts = new Map<AlumniCareerSector, number>();
    CAREER_SECTORS.forEach((sec) => counts.set(sec, 0));
    allAlumni.forEach((a) => {
      counts.set(a.sektor_karier, (counts.get(a.sektor_karier) || 0) + 1);
    });
    return counts;
  }, [allAlumni]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    allAlumni.forEach((a) => set.add(resolveAlumniGeo(a).province));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allAlumni]);

  const acceptedCampuses = useMemo(() => {
    const set = new Set<string>();
    allAlumni.forEach((a) => {
      if (a.kampus_diterima && a.kampus_diterima.trim()) {
        set.add(a.kampus_diterima.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allAlumni]);

  const toggleProfessionCategory = (sector: AlumniCareerSector | 'all') => {
    if (sector === 'all') {
      setSelectedProfessions([]);
      return;
    }
    setSelectedProfessions((prev) =>
      prev.includes(sector) ? prev.filter((item) => item !== sector) : [...prev, sector]
    );
  };

  const handleGradYearFromChange = (val: string) => {
    setGradYearFrom(val);
    if (val !== 'all' && gradYearTo !== 'all' && Number(val) > Number(gradYearTo)) {
      setGradYearTo(val);
    }
  };

  const handleGradYearToChange = (val: string) => {
    setGradYearTo(val);
    if (val !== 'all' && gradYearFrom !== 'all' && Number(val) < Number(gradYearFrom)) {
      setGradYearFrom(val);
    }
  };

  const handleChartGradYearSelect = (year: string) => {
    if (year === 'all') {
      setGradYearFrom('all');
      setGradYearTo('all');
      return;
    }
    setGradYearFrom(year);
    setGradYearTo(year);
  };

  const applyGradYearPreset = (preset: 'all' | 'latest' | 'last3') => {
    if (preset === 'all' || gradYears.length === 0) {
      setGradYearFrom('all');
      setGradYearTo('all');
      return;
    }
    const maxYear = gradYears[gradYears.length - 1];
    if (preset === 'latest') {
      setGradYearFrom(String(maxYear));
      setGradYearTo(String(maxYear));
      return;
    }
    const minTarget = maxYear - 2;
    const minAvailable = gradYears[0];
    setGradYearFrom(String(Math.max(minTarget, minAvailable)));
    setGradYearTo(String(maxYear));
  };

  const alumniBeforeRegionFilter = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fromY = gradYearFrom !== 'all' ? Number(gradYearFrom) : null;
    const toY = gradYearTo !== 'all' ? Number(gradYearTo) : null;

    return allAlumni.filter((a) => {
      if (entryYearFilter !== 'all' && String(a.tahun_masuk) !== entryYearFilter) return false;
      if (fromY !== null && a.tahun_lulus < fromY) return false;
      if (toY !== null && a.tahun_lulus > toY) return false;
      if (admissionPathFilter !== 'all' && a.jalur_masuk_kampus !== admissionPathFilter) return false;
      if (
        selectedProfessions.length > 0 &&
        !selectedProfessions.includes(a.sektor_karier)
      ) {
        return false;
      }
      if (contactFilter !== 'all' && a.status_kontak !== contactFilter) return false;
      if (mentorOnly && !a.bersedia_mentoring) return false;
      if (q) {
        return (
          a.nama.toLowerCase().includes(q) ||
          a.nis_alumni.toLowerCase().includes(q) ||
          a.kampus_diterima.toLowerCase().includes(q) ||
          resolveAlumniUniversityCategory(a).toLowerCase().includes(q) ||
          a.jurusan_diterima.toLowerCase().includes(q) ||
          a.jalur_masuk_kampus.toLowerCase().includes(q) ||
          String(a.tahun_diterima).includes(q) ||
          a.profesi_saat_ini.toLowerCase().includes(q) ||
          a.instansi_atau_kampus.toLowerCase().includes(q) ||
          a.kota_domisili.toLowerCase().includes(q) ||
          a.angkatan.toLowerCase().includes(q) ||
          a.telepon_wa.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    allAlumni,
    entryYearFilter,
    gradYearFrom,
    gradYearTo,
    admissionPathFilter,
    selectedProfessions,
    contactFilter,
    mentorOnly,
    searchQuery,
  ]);

  const alumniForRegionMap = useMemo(() => {
    return alumniBeforeRegionFilter.filter((a) => {
      if (campusFilter !== 'all' && a.kampus_diterima.trim() !== campusFilter) {
        return false;
      }
      if (
        uniCategoryFilter !== 'all' &&
        resolveAlumniUniversityCategory(a) !== uniCategoryFilter
      ) {
        return false;
      }
      return true;
    });
  }, [alumniBeforeRegionFilter, campusFilter, uniCategoryFilter]);

  const alumniForCampusMap = useMemo(() => {
    return alumniBeforeRegionFilter.filter((a) => {
      if (regionFilter !== 'all' && resolveAlumniGeo(a).province !== regionFilter) {
        return false;
      }
      if (
        uniCategoryFilter !== 'all' &&
        resolveAlumniUniversityCategory(a) !== uniCategoryFilter
      ) {
        return false;
      }
      return true;
    });
  }, [alumniBeforeRegionFilter, regionFilter, uniCategoryFilter]);

  const alumniForUniCategoryMap = useMemo(() => {
    return alumniBeforeRegionFilter.filter((a) => {
      if (regionFilter !== 'all' && resolveAlumniGeo(a).province !== regionFilter) {
        return false;
      }
      if (campusFilter !== 'all' && a.kampus_diterima.trim() !== campusFilter) {
        return false;
      }
      return true;
    });
  }, [alumniBeforeRegionFilter, regionFilter, campusFilter]);

  const filteredAlumni = useMemo(() => {
    return alumniBeforeRegionFilter.filter((a) => {
      if (regionFilter !== 'all' && resolveAlumniGeo(a).province !== regionFilter) {
        return false;
      }
      if (campusFilter !== 'all' && a.kampus_diterima.trim() !== campusFilter) {
        return false;
      }
      if (
        uniCategoryFilter !== 'all' &&
        resolveAlumniUniversityCategory(a) !== uniCategoryFilter
      ) {
        return false;
      }
      return true;
    });
  }, [alumniBeforeRegionFilter, regionFilter, campusFilter, uniCategoryFilter]);

  const isAnyFilterActive =
    Boolean(searchQuery.trim()) ||
    entryYearFilter !== 'all' ||
    gradYearFrom !== 'all' ||
    gradYearTo !== 'all' ||
    admissionPathFilter !== 'all' ||
    selectedProfessions.length > 0 ||
    contactFilter !== 'all' ||
    regionFilter !== 'all' ||
    campusFilter !== 'all' ||
    uniCategoryFilter !== 'all' ||
    mentorOnly;

  const resetFilters = () => {
    setSearchQuery('');
    setEntryYearFilter('all');
    setGradYearFrom('all');
    setGradYearTo('all');
    setAdmissionPathFilter('all');
    setSelectedProfessions([]);
    setContactFilter('all');
    setRegionFilter('all');
    setCampusFilter('all');
    setUniCategoryFilter('all');
    setMentorOnly(false);
  };

  const stats = useMemo(() => {
    const total = allAlumni.length;
    const activeContacts = allAlumni.filter((a) => a.status_kontak === 'Aktif Terhubung').length;
    const activeRate = total > 0 ? Math.round((activeContacts / total) * 100) : 0;
    const mentorCount = allAlumni.filter((a) => a.bersedia_mentoring).length;
    const syncedCount = allAlumni.filter((a) => a.synced_to_sheets).length;
    const uniqueUniversities = new Set(
      allAlumni.map((a) => a.kampus_diterima.trim()).filter(Boolean)
    ).size;
    const ptnAndScholarshipCount = allAlumni.filter(
      (a) =>
        a.jalur_masuk_kampus === 'SNBP' ||
        a.jalur_masuk_kampus === 'SNBT / UTBK' ||
        a.jalur_masuk_kampus.startsWith('Beasiswa')
    ).length;
    return {
      total,
      activeContacts,
      activeRate,
      mentorCount,
      syncedCount,
      uniqueUniversities,
      ptnAndScholarshipCount,
    };
  }, [allAlumni]);

  const triggerBackgroundSync = async () => {
    if (!SheetsService.getScriptUrl()) return;
    await AlumniDirectoryService.syncAlumniToSheets();
    setRefreshTick((t) => t + 1);
  };

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    const res = await AlumniDirectoryService.syncAlumniToSheets();
    setIsSyncing(false);
    setRefreshTick((t) => t + 1);
    if (res.success) {
      showToast('Sinkronisasi Alumni Berhasil', res.message, 'success');
    } else {
      showToast(
        res.mode === 'local' ? 'Google Sheets Belum Tersinkron' : 'Gagal Sinkronisasi',
        res.message,
        'info'
      );
    }
  };

  const handlePullFromSheets = async () => {
    setIsPulling(true);
    const res = await AlumniDirectoryService.pullAlumniFromSheets();
    setIsPulling(false);
    setRefreshTick((t) => t + 1);
    if (res.success) {
      showToast('Data Alumni Ditarik', res.message, 'success');
    } else {
      showToast('Informasi Google Sheets', res.message, 'info');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = AlumniDirectoryService.createAlumni({
      nis_alumni: newNis || undefined,
      nama: newName,
      tahun_masuk: newEntryYear,
      tahun_lulus: newGradYear,
      angkatan: newAngkatan || undefined,
      kampus_asal: newCampus,
      kelas_terakhir: newLastClass,
      kampus_diterima: newAcceptedCampus,
      kategori_perguruan_tinggi: newUniCategory,
      tahun_diterima: newAcceptedYear,
      jurusan_diterima: newAcceptedMajor,
      jalur_masuk_kampus: newAdmissionPath,
      sektor_karier: newSector,
      profesi_saat_ini: newProfession,
      instansi_atau_kampus: newInstitution,
      kota_domisili: newCity,
      status_kontak: newContactStatus,
      telepon_wa: newPhone,
      email: newEmail,
      linkedin_url: newLinkedin || undefined,
      bersedia_mentoring: newMentoring,
      catatan: newNote || undefined,
    });

    if (!res.success) {
      showToast('Validasi Gagal', res.message, 'error');
      return;
    }

    showToast('Alumni Ditambahkan', res.message, 'success');
    setNewNis('');
    setNewName('');
    setNewAngkatan('');
    setNewAcceptedCampus('');
    setNewUniCategory('Perguruan Tinggi Negeri');
    setNewAcceptedMajor('');
    setNewProfession('');
    setNewInstitution('');
    setNewPhone('');
    setNewEmail('');
    setNewLinkedin('');
    setNewNote('');
    setShowAddForm(false);
    setRefreshTick((t) => t + 1);
    await triggerBackgroundSync();
  };

  const openEditDrawer = (item: AlumniRecord) => {
    setSelectedAlumniId(null);
    setEditingAlumni(item);
    setShowAddForm(false);
    setEditEntryYear(item.tahun_masuk);
    setEditGradYear(item.tahun_lulus);
    setEditAngkatan(item.angkatan);
    setEditCampus(item.kampus_asal);
    setEditLastClass(item.kelas_terakhir);
    setEditAcceptedCampus(item.kampus_diterima);
    setEditUniCategory(resolveAlumniUniversityCategory(item));
    setEditAcceptedYear(item.tahun_diterima);
    setEditAcceptedMajor(item.jurusan_diterima);
    setEditAdmissionPath(item.jalur_masuk_kampus);
    setEditSector(item.sektor_karier);
    setEditProfession(item.profesi_saat_ini);
    setEditInstitution(item.instansi_atau_kampus);
    setEditCity(item.kota_domisili);
    setEditContactStatus(item.status_kontak);
    setEditPhone(item.telepon_wa);
    setEditEmail(item.email);
    setEditLinkedin(item.linkedin_url || '');
    setEditMentoring(item.bersedia_mentoring);
    setEditLastContacted(item.terakhir_dihubungi || '');
    setEditNote(item.catatan || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlumni) return;
    const res = AlumniDirectoryService.updateAlumni(editingAlumni.id, {
      tahun_masuk: editEntryYear,
      tahun_lulus: editGradYear,
      angkatan: editAngkatan,
      kampus_asal: editCampus,
      kelas_terakhir: editLastClass,
      kampus_diterima: editAcceptedCampus,
      kategori_perguruan_tinggi: editUniCategory,
      tahun_diterima: editAcceptedYear,
      jurusan_diterima: editAcceptedMajor,
      jalur_masuk_kampus: editAdmissionPath,
      sektor_karier: editSector,
      profesi_saat_ini: editProfession,
      instansi_atau_kampus: editInstitution,
      kota_domisili: editCity,
      status_kontak: editContactStatus,
      telepon_wa: editPhone,
      email: editEmail,
      linkedin_url: editLinkedin || undefined,
      bersedia_mentoring: editMentoring,
      terakhir_dihubungi: editLastContacted || undefined,
      catatan: editNote || undefined,
    });

    if (!res.success) {
      showToast('Gagal Memperbarui', res.message, 'error');
      return;
    }

    showToast('Profil Alumni Diperbarui', res.message, 'success');
    setEditingAlumni(null);
    setRefreshTick((t) => t + 1);
    await triggerBackgroundSync();
  };

  const handleVerifyContact = async (item: AlumniRecord) => {
    const res = AlumniDirectoryService.markContactVerified(item.id);
    if (res.success) {
      showToast('Kontak Terverifikasi', res.message, 'success');
      setRefreshTick((t) => t + 1);
      await triggerBackgroundSync();
    }
  };

  const handleDelete = async (item: AlumniRecord) => {
    const res = AlumniDirectoryService.deleteAlumni(item.id);
    if (res.success) {
      showToast('Alumni Dihapus', res.message, 'success');
      setRefreshTick((t) => t + 1);
      await triggerBackgroundSync();
    }
  };

  const handleExportCsv = (scope: 'filtered' | 'all' = 'filtered') => {
    const targetList = scope === 'all' ? allAlumni : filteredAlumni;
    const scopeTag = scope === 'all' ? 'Lengkap' : 'Terfilter';

    if (targetList.length === 0) {
      showToast('Data Kosong', 'Tidak ada data alumni yang cocok untuk diekspor ke CSV.', 'warning');
      setShowCsvMenu(false);
      return;
    }

    const res = AlumniDirectoryService.downloadCsv(targetList, scopeTag);
    setShowCsvMenu(false);

    if (!res.success) {
      showToast('Gagal Ekspor', 'Data tidak tersedia untuk diekspor.', 'error');
      return;
    }

    SecurityService.logSecurityEvent({
      eventType: 'DATA_EXPORTED',
      userName: currentUser.name,
      role: currentUser.role,
      details: `Ekspor ke CSV Direktori Alumni (${res.count} profil · ${scopeTag}: ${res.filename}).`,
    });

    showToast(
      'Ekspor ke CSV Berhasil',
      `${res.count} data alumni berhasil diunduh ke ${res.filename}.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-emerald-700">AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY</span>
            <span aria-hidden="true">·</span>
            <span>Jejaring & Pelacakan Alumni</span>
            <span aria-hidden="true">·</span>
            <span>
              {hasSheetsUrl ? 'Google Sheets Terhubung' : 'Penyimpanan Lokal (Siap Sync Sheets)'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Direktori Alumni & Tracer Study
          </h2>
          <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
            Kelola rekam jejak tahun masuk, kelulusan, kampus tujuan, tahun diterima, jurusan, jalur penerimaan, profesi terkini, dan status kontak alumni di sheet <span className="font-mono text-slate-800">direktori_alumni</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!hasSheetsUrl && (
            <button
              type="button"
              onClick={onOpenSheetsSetup}
              className="py-2 px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Hubungkan Google Sheets</span>
            </button>
          )}
          <button
            type="button"
            onClick={handlePullFromSheets}
            disabled={isPulling}
            className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
            <span>Tarik dari Sheets</span>
          </button>
          <button
            type="button"
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Menyinkron...' : 'Sync ke Sheets'}</span>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCsvMenu((prev) => !prev)}
              className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor ke CSV</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showCsvMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-lg py-1.5 z-30 text-xs">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                  Pilih Cakupan Tabel CSV
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv('filtered')}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-slate-900">Data Sesuai Filter</span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {filteredAlumni.length} baris
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCsv('all')}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors border-t border-slate-100 cursor-pointer"
                >
                  <span className="font-semibold text-slate-900">Seluruh Direktori Alumni</span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {allAlumni.length} baris
                  </span>
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setEditingAlumni(null);
            }}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Alumni</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
          <div className="text-xs font-medium text-slate-500">Total Alumni Terdata</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5 tabular-nums">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{stats.mentorCount} siap jadi mentor santri</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
          <div className="text-xs font-medium text-slate-500">Sebaran Kampus Diterima</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {stats.uniqueUniversities} Kampus
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5 tabular-nums">
            <span>{stats.ptnAndScholarshipCount} jalur SNBP/SNBT/Beasiswa</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
          <div className="text-xs font-medium text-slate-500">Kontak Aktif Terhubung</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {stats.activeContacts} / {stats.total}
          </div>
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 tabular-nums">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{stats.activeRate}% keterjangkauan jejaring</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
          <div className="text-xs font-medium text-slate-500">Status Sinkronisasi Sheets</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {stats.syncedCount} / {stats.total}
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Sheet direktori_alumni</span>
          </div>
        </div>
      </div>

      {/* Visualisasi Recharts: Pie Distribusi Profesi & Batang Tahun Kelulusan */}
      <AdminAlumniCharts
        alumni={filteredAlumni}
        allAlumniCount={allAlumni.length}
        activeSectorFilters={selectedProfessions}
        gradYearFrom={gradYearFrom}
        gradYearTo={gradYearTo}
        onToggleSectorFilter={toggleProfessionCategory}
        onSelectGradYearFilter={handleChartGradYearSelect}
      />

      {/* Visualisasi Peta Geografis D3: Sebaran Kota / Provinsi Alumni */}
      <AdminAlumniGeoMap
        alumni={alumniForRegionMap}
        allAlumniCount={allAlumni.length}
        activeRegionFilter={regionFilter}
        onSelectRegionFilter={(prov) => setRegionFilter(prov)}
      />

      {/* Visualisasi Peta Geografis D3: Sebaran Berdasarkan Nama Kampus */}
      <AdminAlumniCampusMap
        alumni={alumniForCampusMap}
        allAlumniCount={allAlumni.length}
        activeCampusFilter={campusFilter}
        onSelectCampusFilter={(campusName) => setCampusFilter(campusName)}
      />

      {/* Visualisasi Peta Geografis D3: Sebaran 5 Kategori Perguruan Tinggi */}
      <AdminAlumniUniversityCategoryMap
        alumni={alumniForUniCategoryMap}
        allAlumniCount={allAlumni.length}
        activeCategoryFilter={uniCategoryFilter}
        onSelectCategoryFilter={(cat) => setUniCategoryFilter(cat)}
      />

      {/* Form Tambah Alumni */}
      {showAddForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrasi Alumni Baru</h3>
              <p className="text-xs text-slate-500">
                Catat tahun masuk & lulus, perguruan tinggi diterima, jurusan, jalur penerimaan, profesi, dan kontak aktif.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Alumni *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="cth. Muhammad Rayhan"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIS / Kode Alumni (Opsional)
              </label>
              <input
                type="text"
                value={newNis}
                onChange={(e) => setNewNis(e.target.value)}
                placeholder="Otomatis jika kosong"
                className="w-full text-xs font-mono rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Masuk *
              </label>
              <input
                type="number"
                required
                min={2010}
                max={2040}
                value={newEntryYear}
                onChange={(e) => setNewEntryYear(Number(e.target.value))}
                className="w-full text-xs tabular-nums rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Lulus *
              </label>
              <input
                type="number"
                required
                min={2010}
                max={2045}
                value={newGradYear}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setNewGradYear(val);
                  setNewAcceptedYear(val);
                }}
                className="w-full text-xs tabular-nums rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diterima di Kampus Mana *
              </label>
              <input
                type="text"
                required
                value={newAcceptedCampus}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewAcceptedCampus(val);
                  setNewUniCategory(inferUniversityCategory(val, newAdmissionPath, newCity));
                }}
                placeholder="cth. Universitas Indonesia (UI)"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Perguruan Tinggi *
              </label>
              <select
                value={newUniCategory}
                onChange={(e) => setNewUniCategory(e.target.value as AlumniUniversityCategory)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {UNIVERSITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Diterima *
              </label>
              <input
                type="number"
                required
                min={2010}
                max={2045}
                value={newAcceptedYear}
                onChange={(e) => setNewAcceptedYear(Number(e.target.value))}
                className="w-full text-xs tabular-nums rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jurusan / Program Studi *
              </label>
              <input
                type="text"
                required
                value={newAcceptedMajor}
                onChange={(e) => setNewAcceptedMajor(e.target.value)}
                placeholder="cth. Pendidikan Dokter / Teknik Elektro"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jalur Penerimaan *
              </label>
              <select
                value={newAdmissionPath}
                onChange={(e) => setNewAdmissionPath(e.target.value as AlumniAdmissionPath)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {ADMISSION_PATHS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Angkatan</label>
              <input
                type="text"
                value={newAngkatan}
                onChange={(e) => setNewAngkatan(e.target.value)}
                placeholder="cth. Angkatan 5"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kampus Asal</label>
              <select
                value={newCampus}
                onChange={(e) => setNewCampus(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas Terakhir
              </label>
              <input
                type="text"
                value={newLastClass}
                onChange={(e) => setNewLastClass(e.target.value)}
                placeholder="cth. 12 SMA Unggulan A"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sektor Karier / Studi
              </label>
              <select
                value={newSector}
                onChange={(e) => setNewSector(e.target.value as AlumniCareerSector)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {CAREER_SECTORS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profesi Saat Ini
              </label>
              <input
                type="text"
                value={newProfession}
                onChange={(e) => setNewProfession(e.target.value)}
                placeholder="cth. Mahasiswa / Software Engineer"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instansi / Perusahaan
              </label>
              <input
                type="text"
                value={newInstitution}
                onChange={(e) => setNewInstitution(e.target.value)}
                placeholder="Opsional (jika sudah bekerja)"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kota Domisili
              </label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="cth. Tangerang Selatan"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Kontak
              </label>
              <select
                value={newContactStatus}
                onChange={(e) => setNewContactStatus(e.target.value as AlumniContactStatus)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {CONTACT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp *
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full text-xs font-mono rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="alumni@domain.com"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tautan Profil LinkedIn (Opsional)
              </label>
              <input
                type="url"
                value={newLinkedin}
                onChange={(e) => setNewLinkedin(e.target.value)}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Jejaring / Prestasi Alumni
              </label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="cth. Lolos SNBP pilihan pertama"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newMentoring}
                onChange={(e) => setNewMentoring(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              <span>Bersedia tergabung dalam jaringan mentor adik kelas</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Simpan Alumni
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Form Edit Profil Alumni */}
      {editingAlumni && (
        <form
          onSubmit={handleEditSubmit}
          className="bg-white rounded-2xl border border-blue-200 p-5 md:p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Perbarui Profil Alumni: {editingAlumni.nama}
              </h3>
              <p className="text-xs text-slate-500">
                NIS {editingAlumni.nis_alumni} · Perbarui riwayat kelulusan, kampus diterima, jurusan, jalur masuk, profesi, atau status kontak.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingAlumni(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Masuk</label>
              <input
                type="number"
                required
                value={editEntryYear}
                onChange={(e) => setEditEntryYear(Number(e.target.value))}
                className="w-full text-xs tabular-nums rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Lulus</label>
              <input
                type="number"
                required
                value={editGradYear}
                onChange={(e) => setEditGradYear(Number(e.target.value))}
                className="w-full text-xs tabular-nums rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Angkatan</label>
              <input
                type="text"
                value={editAngkatan}
                onChange={(e) => setEditAngkatan(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas Terakhir
              </label>
              <input
                type="text"
                value={editLastClass}
                onChange={(e) => setEditLastClass(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diterima di Kampus *
              </label>
              <input
                type="text"
                required
                value={editAcceptedCampus}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditAcceptedCampus(val);
                  setEditUniCategory(inferUniversityCategory(val, editAdmissionPath, editCity));
                }}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Perguruan Tinggi *
              </label>
              <select
                value={editUniCategory}
                onChange={(e) => setEditUniCategory(e.target.value as AlumniUniversityCategory)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
              >
                {UNIVERSITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Diterima *
              </label>
              <input
                type="number"
                required
                value={editAcceptedYear}
                onChange={(e) => setEditAcceptedYear(Number(e.target.value))}
                className="w-full text-xs tabular-nums rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jurusan / Program Studi *
              </label>
              <input
                type="text"
                required
                value={editAcceptedMajor}
                onChange={(e) => setEditAcceptedMajor(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jalur Penerimaan *
              </label>
              <select
                value={editAdmissionPath}
                onChange={(e) => setEditAdmissionPath(e.target.value as AlumniAdmissionPath)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
              >
                {ADMISSION_PATHS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kampus Asal</label>
              <select
                value={editCampus}
                onChange={(e) => setEditCampus(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
              >
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sektor Karier
              </label>
              <select
                value={editSector}
                onChange={(e) => setEditSector(e.target.value as AlumniCareerSector)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
              >
                {CAREER_SECTORS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profesi Saat Ini
              </label>
              <input
                type="text"
                required
                value={editProfession}
                onChange={(e) => setEditProfession(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instansi / Perusahaan
              </label>
              <input
                type="text"
                value={editInstitution}
                onChange={(e) => setEditInstitution(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kota Domisili
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Kontak
              </label>
              <select
                value={editContactStatus}
                onChange={(e) => setEditContactStatus(e.target.value as AlumniContactStatus)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
              >
                {CONTACT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp
              </label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full text-xs font-mono rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Terakhir Dihubungi
              </label>
              <input
                type="date"
                value={editLastContacted}
                onChange={(e) => setEditLastContacted(e.target.value)}
                className="w-full text-xs tabular-nums rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tautan Profil LinkedIn
              </label>
              <input
                type="url"
                value={editLinkedin}
                onChange={(e) => setEditLinkedin(e.target.value)}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={editMentoring}
                onChange={(e) => setEditMentoring(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Bersedia menjadi mentor jaringan alumni</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingAlumni(null)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama alumni, kampus diterima (UI/ITB/ITS), jurusan, jalur masuk, profesi, atau kota..."
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 pl-10 pr-9 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={mentorOnly}
              onChange={(e) => setMentorOnly(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600"
            />
            <span>Khusus Mentor Aktif</span>
          </label>
        </div>

        {/* Filter Real-Time: Rentang Tahun Lulus & Kategori Profesi */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-100">
          {/* Rentang Tahun Kelulusan */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-semibold text-slate-700">
                Rentang Tahun Lulus
              </label>
              <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => applyGradYearPreset('all')}
                  className={`py-0.5 px-2 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    gradYearFrom === 'all' && gradYearTo === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => applyGradYearPreset('latest')}
                  className={`py-0.5 px-2 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    gradYears.length > 0 &&
                    gradYearFrom === String(gradYears[gradYears.length - 1]) &&
                    gradYearTo === String(gradYears[gradYears.length - 1])
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Terbaru
                </button>
                <button
                  type="button"
                  onClick={() => applyGradYearPreset('last3')}
                  className={`py-0.5 px-2 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    gradYears.length > 0 &&
                    gradYearFrom ===
                      String(Math.max(gradYears[gradYears.length - 1] - 2, gradYears[0])) &&
                    gradYearTo === String(gradYears[gradYears.length - 1])
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3 Tahun Terakhir
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Tahun lulus dari"
                value={gradYearFrom}
                onChange={(e) => handleGradYearFromChange(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white tabular-nums"
              >
                <option value="all">Dari: Awal</option>
                {gradYears.map((y) => (
                  <option key={`from-${y}`} value={String(y)}>
                    Dari {y}
                  </option>
                ))}
              </select>

              <span className="text-xs text-slate-400 shrink-0">—</span>

              <select
                aria-label="Tahun lulus sampai"
                value={gradYearTo}
                onChange={(e) => handleGradYearToChange(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white tabular-nums"
              >
                <option value="all">Sampai: Akhir</option>
                {gradYears.map((y) => (
                  <option key={`to-${y}`} value={String(y)}>
                    Sampai {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kategori Profesi (Multi-Pilih Real-Time) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-700">
                Kategori Profesi & Karier{' '}
                <span className="font-normal text-slate-500">
                  {selectedProfessions.length === 0
                    ? '(Semua aktif)'
                    : `(${selectedProfessions.length} dipilih)`}
                </span>
              </span>
              {selectedProfessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleProfessionCategory('all')}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleProfessionCategory('all')}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  selectedProfessions.length === 0
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Semua ({allAlumni.length})
              </button>
              {CAREER_SECTORS.map((sec) => {
                const active = selectedProfessions.includes(sec);
                const count = professionCounts.get(sec) || 0;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleProfessionCategory(sec)}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      active
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sec} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter Atribut Lainnya */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tahun Masuk
            </label>
            <select
              value={entryYearFilter}
              onChange={(e) => setEntryYearFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white tabular-nums"
            >
              <option value="all">Semua Tahun Masuk</option>
              {entryYears.map((y) => (
                <option key={y} value={String(y)}>
                  Masuk {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Kategori Perguruan Tinggi
            </label>
            <select
              value={uniCategoryFilter}
              onChange={(e) =>
                setUniCategoryFilter(e.target.value as 'all' | AlumniUniversityCategory)
              }
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white"
            >
              <option value="all">Semua Kategori PT</option>
              {UNIVERSITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Nama Kampus Diterima
            </label>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white"
            >
              <option value="all">Semua Kampus</option>
              {acceptedCampuses.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Jalur Penerimaan Kampus
            </label>
            <select
              value={admissionPathFilter}
              onChange={(e) =>
                setAdmissionPathFilter(e.target.value as 'all' | AlumniAdmissionPath)
              }
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white"
            >
              <option value="all">Semua Jalur Masuk</option>
              {ADMISSION_PATHS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Provinsi / Wilayah
            </label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white"
            >
              <option value="all">Semua Wilayah</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status Kontak
            </label>
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value as 'all' | AlumniContactStatus)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white"
            >
              <option value="all">Semua Status Kontak</option>
              {CONTACT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="tabular-nums">
            Menampilkan <strong className="text-slate-900">{filteredAlumni.length}</strong> dari{' '}
            <strong className="text-slate-900">{allAlumni.length}</strong> alumni terdaftar · Klik
            kartu atau baris untuk detail lengkap
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`py-1 px-2.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`py-1 px-2.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabel</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleExportCsv('filtered')}
              className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor ke CSV ({filteredAlumni.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alumni Directory Cards / Table */}
      {filteredAlumni.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-12 px-4 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Tidak Ada Data Alumni yang Cocok
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tambahkan profil alumni baru atau atur ulang filter pencarian untuk menampilkan direktori alumni sekolah.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Tambah Alumni Pertama
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAlumni.map((item) => {
            const statusStyle = getContactStatusPresentation(item.status_kontak);
            const hasLinkedin = Boolean(
              item.linkedin_url && item.linkedin_url.trim() && item.linkedin_url.trim() !== '-'
            );
            return (
              <article
                key={item.id}
                onClick={() => setSelectedAlumniId(item.id)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-colors p-5 flex flex-col justify-between gap-4 cursor-pointer text-left"
              >
                <div className="space-y-3">
                  {/* Card Top Meta & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 tabular-nums">
                        <span className="font-mono text-slate-600">{item.nis_alumni}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {item.tahun_masuk}–{item.tahun_lulus}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.angkatan}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlumniId(item.id);
                          }}
                          className="text-left hover:text-emerald-700 transition-colors focus:outline-none focus-visible:underline cursor-pointer truncate max-w-full"
                        >
                          {item.nama}
                        </button>
                      </h4>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 ${statusStyle.textClass}`}
                    >
                      {statusStyle.icon}
                      <span>{item.status_kontak}</span>
                    </div>
                  </div>

                  {/* Education & Career Summary */}
                  <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-xs">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.kampus_diterima}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium truncate">
                      {resolveAlumniUniversityCategory(item)}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate tabular-nums">
                      {item.jurusan_diterima} ·{' '}
                      <span className="font-semibold text-indigo-700">
                        {item.jalur_masuk_kampus}
                      </span>{' '}
                      ({item.tahun_diterima})
                    </div>
                    <div className="text-[11px] text-slate-700 truncate pt-0.5">
                      <span className="font-medium">{item.profesi_saat_ini}</span> ·{' '}
                      <span className="text-slate-500">{item.instansi_atau_kampus}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Location, LinkedIn indicator & Quick Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
                  <div className="min-w-0 flex items-center gap-2 text-slate-500 truncate">
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.kota_domisili}</span>
                    </span>
                    {hasLinkedin && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0a66c2] shrink-0">
                          <Linkedin className="w-3 h-3" />
                          <span>LinkedIn</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    className="inline-flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAlumniId(item.id)}
                      title="Lihat Detail Alumni"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={buildWhatsAppHref(item.telepon_wa, item.nama, item.tahun_lulus)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Sapa via WhatsApp"
                      className="p-1.5 rounded-lg border border-slate-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openEditDrawer(item)}
                      title="Edit Profil Alumni"
                      className="p-1.5 rounded-lg border border-slate-200 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Hapus Data Alumni"
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Alumni & Masuk / Lulus</th>
                  <th className="py-3 px-4">Diterima di Kampus, Jurusan & Jalur</th>
                  <th className="py-3 px-4">Profesi & Instansi Saat Ini</th>
                  <th className="py-3 px-4">Kontak & Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAlumni.map((item) => {
                  const statusStyle = getContactStatusPresentation(item.status_kontak);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedAlumniId(item.id)}
                      className="hover:bg-slate-50/80 transition-colors align-top cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.nama}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-1.5 tabular-nums">
                          <span className="font-mono text-slate-700">{item.nis_alumni}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-800">
                            {item.tahun_masuk}–{item.tahun_lulus}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.angkatan}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.kampus_asal} · {item.kelas_terakhir}
                          {item.bersedia_mentoring && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-emerald-700 font-semibold">Mentor Aktif</span>
                            </>
                          )}
                        </div>
                        {item.catatan && (
                          <p className="text-[11px] text-slate-500 mt-1 max-w-xs line-clamp-2">
                            {item.catatan}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.kampus_diterima}</div>
                        <div className="text-[11px] font-medium text-emerald-700 mt-0.5">
                          {resolveAlumniUniversityCategory(item)}
                        </div>
                        <div className="text-[11px] text-slate-700 mt-0.5">
                          Jurusan: <span className="font-medium">{item.jurusan_diterima}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5 tabular-nums">
                          <span className="font-semibold text-indigo-700">
                            {item.jalur_masuk_kampus}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Diterima Tahun {item.tahun_diterima}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.profesi_saat_ini}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {item.instansi_atau_kampus}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.sektor_karier} · {item.kota_domisili}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          className={`inline-flex items-center gap-1.5 font-semibold ${statusStyle.textClass}`}
                        >
                          {statusStyle.icon}
                          <span>{item.status_kontak}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-700 mt-1 tabular-nums">
                          {item.telepon_wa}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {item.email}
                        </div>
                        {item.linkedin_url && item.linkedin_url !== '-' && (
                          <div className="text-[11px] font-medium text-[#0a66c2] mt-0.5 inline-flex items-center gap-1">
                            <Linkedin className="w-3 h-3" />
                            <span>Profil LinkedIn tersedia</span>
                          </div>
                        )}
                      </td>

                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedAlumniId(item.id)}
                            title="Lihat Detail Alumni"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={buildWhatsAppHref(
                              item.telepon_wa,
                              item.nama,
                              item.tahun_lulus
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Sapa via WhatsApp"
                            className="p-1.5 rounded-lg border border-slate-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          {item.email && item.email !== '-' && (
                            <a
                              href={`mailto:${item.email}`}
                              title="Kirim Email"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.status_kontak !== 'Aktif Terhubung' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyContact(item)}
                              title="Tandai Kontak Aktif Terhubung"
                              className="py-1 px-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Verifikasi
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditDrawer(item)}
                            title="Edit Profil Alumni"
                            className="p-1.5 rounded-lg border border-slate-200 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Hapus Data Alumni"
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail Alumni */}
      <AdminAlumniDetailModal
        alumni={selectedAlumni}
        onClose={() => setSelectedAlumniId(null)}
        onEdit={openEditDrawer}
        onVerifyContact={handleVerifyContact}
        buildWhatsAppHref={buildWhatsAppHref}
      />
    </div>
  );
}
