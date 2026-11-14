import {
  AlumniAdmissionPath,
  AlumniCareerSector,
  AlumniContactStatus,
  AlumniRecord,
  AlumniUniversityCategory,
} from '../types';
import {
  inferUniversityCategory,
  resolveAlumniUniversityCategory,
} from '../components/admin/alumniGeoData';
import { SecurityService } from './securityService';
import { SheetsService } from './sheetsService';

const STORAGE_KEY_ALUMNI = 'alwildan_alumni_directory_v1';
const STORAGE_KEY_CAT5_MIGRATED = 'alwildan_alumni_cat5_seeded_v1';

const SEED_ALUMNI: AlumniRecord[] = [
  {
    id: 'ALM-001',
    nis_alumni: 'AW3-2019-004',
    nama: 'Muhammad Rayhan Al-Farisi',
    tahun_masuk: 2019,
    tahun_lulus: 2022,
    angkatan: 'Angkatan 1',
    kampus_asal: 'Kampus Utama BSD City',
    kelas_terakhir: '12 SMA Unggulan A',
    kampus_diterima: 'Institut Teknologi Sepuluh Nopember (ITS)',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Negeri',
    tahun_diterima: 2022,
    jurusan_diterima: 'Teknik Informatika',
    jalur_masuk_kampus: 'SNBT / UTBK',
    sektor_karier: 'Teknologi & IT',
    profesi_saat_ini: 'Software Engineer',
    instansi_atau_kampus: 'PT Bank Syariah Indonesia Tbk',
    kota_domisili: 'Tangerang Selatan',
    status_kontak: 'Aktif Terhubung',
    telepon_wa: '081288110044',
    email: 'rayhan.alfarisi@alumni.alwildan3bsd.sch.id',
    linkedin_url: 'https://www.linkedin.com/in/rayhan-alfarisi-dev',
    terakhir_dihubungi: '2026-10-28',
    bersedia_mentoring: true,
    catatan: 'Aktif mengisi sesi Career Day IT untuk santri kelas 12.',
    synced_to_sheets: false,
    updated_at: '2026-10-28T09:00:00Z',
  },
  {
    id: 'ALM-002',
    nis_alumni: 'AW3-2020-011',
    nama: 'Aisyah Humaira Zahra',
    tahun_masuk: 2020,
    tahun_lulus: 2023,
    angkatan: 'Angkatan 2',
    kampus_asal: 'Kampus Sains BSD City',
    kelas_terakhir: '12 SMA Sains B',
    kampus_diterima: 'Universitas Indonesia (UI)',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Negeri',
    tahun_diterima: 2023,
    jurusan_diterima: 'Pendidikan Dokter',
    jalur_masuk_kampus: 'SNBP',
    sektor_karier: 'Kesehatan & Kedokteran',
    profesi_saat_ini: 'Mahasiswa Kedokteran (Co-Ass)',
    instansi_atau_kampus: 'Universitas Indonesia',
    kota_domisili: 'Depok',
    status_kontak: 'Aktif Terhubung',
    telepon_wa: '081399220011',
    email: 'aisyah.zahra@alumni.alwildan3bsd.sch.id',
    linkedin_url: 'https://www.linkedin.com/in/aisyah-humaira-zahra',
    terakhir_dihubungi: '2026-11-02',
    bersedia_mentoring: true,
    catatan: 'Hafidz 15 Juz · Pembina alumni jalur SNBP Kedokteran.',
    synced_to_sheets: false,
    updated_at: '2026-11-02T14:20:00Z',
  },
  {
    id: 'ALM-003',
    nis_alumni: 'AW3-2020-023',
    nama: 'Zaidan Hakim Abdullah',
    tahun_masuk: 2020,
    tahun_lulus: 2023,
    angkatan: 'Angkatan 2',
    kampus_asal: 'Kampus Tahfidz BSD City',
    kelas_terakhir: '12 SMA Tahfidz A',
    kampus_diterima: 'Universitas Islam Madinah',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Timur Tengah',
    tahun_diterima: 2023,
    jurusan_diterima: 'Syariah Islamiyah',
    jalur_masuk_kampus: 'Beasiswa Internasional / Timur Tengah',
    sektor_karier: 'Pendidikan & Dakwah',
    profesi_saat_ini: 'Mahasiswa Syariah & Pengajar Tahfidz',
    instansi_atau_kampus: 'Universitas Islam Madinah',
    kota_domisili: 'Madinah / Tangerang',
    status_kontak: 'Aktif Terhubung',
    telepon_wa: '085277334410',
    email: 'zaidan.hakim@alumni.alwildan3bsd.sch.id',
    terakhir_dihubungi: '2026-10-15',
    bersedia_mentoring: true,
    catatan: 'Mutqin 30 Juz · Siap membimbing persiapan beasiswa Timur Tengah.',
    synced_to_sheets: false,
    updated_at: '2026-10-15T11:10:00Z',
  },
  {
    id: 'ALM-004',
    nis_alumni: 'AW3-2021-009',
    nama: 'Nadia Putri Salsabila',
    tahun_masuk: 2021,
    tahun_lulus: 2024,
    angkatan: 'Angkatan 3',
    kampus_asal: 'Kampus Utama BSD City',
    kelas_terakhir: '12 SMA IPS & Bisnis',
    kampus_diterima: 'Universitas Indonesia (UI)',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Negeri',
    tahun_diterima: 2024,
    jurusan_diterima: 'Ilmu Ekonomi Islam',
    jalur_masuk_kampus: 'Seleksi Mandiri',
    sektor_karier: 'Keuangan & Hukum',
    profesi_saat_ini: 'Junior Financial Analyst',
    instansi_atau_kampus: 'Otoritas Jasa Keuangan (OJK) / FEUI',
    kota_domisili: 'Jakarta Selatan',
    status_kontak: 'Perlu Verifikasi',
    telepon_wa: '081744559922',
    email: 'nadia.putri@alumni.alwildan3bsd.sch.id',
    linkedin_url: 'https://www.linkedin.com/in/nadia-putri-salsabila',
    terakhir_dihubungi: '2026-06-12',
    bersedia_mentoring: false,
    catatan: 'Konfirmasi perubahan nomor WhatsApp kantor terbaru.',
    synced_to_sheets: false,
    updated_at: '2026-09-20T08:45:00Z',
  },
  {
    id: 'ALM-005',
    nis_alumni: 'AW3-2021-018',
    nama: 'Farras Dhiyaulhaq',
    tahun_masuk: 2021,
    tahun_lulus: 2024,
    angkatan: 'Angkatan 3',
    kampus_asal: 'Kampus Sains BSD City',
    kelas_terakhir: '12 SMA Sains A',
    kampus_diterima: 'Institut Teknologi Bandung (ITB)',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Negeri',
    tahun_diterima: 2024,
    jurusan_diterima: 'Teknik Informatika (STEI-K)',
    jalur_masuk_kampus: 'SNBT / UTBK',
    sektor_karier: 'Mahasiswa / Studi Lanjut',
    profesi_saat_ini: 'Mahasiswa Teknik Informatika',
    instansi_atau_kampus: 'Institut Teknologi Bandung (ITB)',
    kota_domisili: 'Bandung',
    status_kontak: 'Menunggu Respon',
    telepon_wa: '082133448877',
    email: 'farras.dhiya@alumni.alwildan3bsd.sch.id',
    linkedin_url: 'https://www.linkedin.com/in/farras-dhiyaulhaq',
    terakhir_dihubungi: '2026-11-08',
    bersedia_mentoring: true,
    catatan: 'Sudah dikirimi undangan reuni & tracer study via WhatsApp.',
    synced_to_sheets: false,
    updated_at: '2026-11-08T15:00:00Z',
  },
  {
    id: 'ALM-006',
    nis_alumni: 'AW3-2022-015',
    nama: 'Salma Khairunnisa',
    tahun_masuk: 2022,
    tahun_lulus: 2025,
    angkatan: 'Angkatan 4',
    kampus_asal: 'Kampus Utama BSD City',
    kelas_terakhir: '12 SMA Unggulan B',
    kampus_diterima: 'Universitas Padjadjaran (Unpad)',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Negeri',
    tahun_diterima: 2025,
    jurusan_diterima: 'Bisnis Digital',
    jalur_masuk_kampus: 'Beasiswa Prestasi / Tahfidz',
    sektor_karier: 'Bisnis & Wirausaha',
    profesi_saat_ini: 'Founder EduCraft Muslimah',
    instansi_atau_kampus: 'CV Kreasi Edukasi Nusantara',
    kota_domisili: 'BSD City, Tangerang',
    status_kontak: 'Nomor Tidak Aktif',
    telepon_wa: '081900223344',
    email: 'salma.khairunnisa@alumni.alwildan3bsd.sch.id',
    terakhir_dihubungi: '2026-04-03',
    bersedia_mentoring: false,
    catatan: 'Nomor WA lama tidak aktif, hubungi kontak orang tua atau email.',
    synced_to_sheets: false,
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'ALM-007',
    nis_alumni: 'AW3-2022-027',
    nama: 'Rafka Pradipta Wijaya',
    tahun_masuk: 2022,
    tahun_lulus: 2025,
    angkatan: 'Angkatan 4',
    kampus_asal: 'Kampus Sains BSD City',
    kelas_terakhir: '12 SMA Sains A',
    kampus_diterima: 'Binus University (Alam Sutera)',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Swasta',
    tahun_diterima: 2025,
    jurusan_diterima: 'Computer Science',
    jalur_masuk_kampus: 'Beasiswa Prestasi / Tahfidz',
    sektor_karier: 'Mahasiswa / Studi Lanjut',
    profesi_saat_ini: 'Mahasiswa Computer Science',
    instansi_atau_kampus: 'Binus University Alam Sutera',
    kota_domisili: 'Tangerang Selatan',
    status_kontak: 'Aktif Terhubung',
    telepon_wa: '081299445511',
    email: 'rafka.wijaya@alumni.alwildan3bsd.sch.id',
    linkedin_url: 'https://www.linkedin.com/in/rafka-pradipta-wijaya',
    terakhir_dihubungi: '2026-11-05',
    bersedia_mentoring: true,
    catatan: 'Penerima Beasiswa Widia Binus · Aktif di komunitas AI kampus.',
    synced_to_sheets: false,
    updated_at: '2026-11-05T13:15:00Z',
  },
  {
    id: 'ALM-008',
    nis_alumni: 'AW3-2021-032',
    nama: 'Hana Azzahra Mutmainnah',
    tahun_masuk: 2021,
    tahun_lulus: 2024,
    angkatan: 'Angkatan 3',
    kampus_asal: 'Kampus Tahfidz BSD City',
    kelas_terakhir: '12 SMA Tahfidz B',
    kampus_diterima: 'International Islamic University Malaysia (IIUM)',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Malaysia',
    tahun_diterima: 2024,
    jurusan_diterima: 'Islamic Banking and Finance',
    jalur_masuk_kampus: 'Beasiswa Internasional / Timur Tengah',
    sektor_karier: 'Keuangan & Hukum',
    profesi_saat_ini: 'Mahasiswa Ekonomi Syariah & Asisten Riset',
    instansi_atau_kampus: 'IIUM Gombak, Kuala Lumpur',
    kota_domisili: 'Kuala Lumpur',
    status_kontak: 'Aktif Terhubung',
    telepon_wa: '081355667788',
    email: 'hana.azzahra@alumni.alwildan3bsd.sch.id',
    linkedin_url: 'https://www.linkedin.com/in/hana-azzahra-iium',
    terakhir_dihubungi: '2026-10-30',
    bersedia_mentoring: true,
    catatan: 'Koordinator PPI IIUM · Pendamping persiapan studi ke Malaysia.',
    synced_to_sheets: false,
    updated_at: '2026-10-30T16:40:00Z',
  },
  {
    id: 'ALM-009',
    nis_alumni: 'AW3-2022-041',
    nama: 'Kanzul Fikri Ramadhan',
    tahun_masuk: 2022,
    tahun_lulus: 2025,
    angkatan: 'Angkatan 4',
    kampus_asal: 'Kampus Sains BSD City',
    kelas_terakhir: '12 SMA Unggulan A',
    kampus_diterima: 'National University of Singapore (NUS)',
    kategori_perguruan_tinggi: 'Perguruan Tinggi Luar Negeri Lainnya',
    tahun_diterima: 2025,
    jurusan_diterima: 'Data Science and Analytics',
    jalur_masuk_kampus: 'Beasiswa Internasional / Timur Tengah',
    sektor_karier: 'Teknologi & IT',
    profesi_saat_ini: 'Mahasiswa Data Science & Part-time Analyst',
    instansi_atau_kampus: 'National University of Singapore',
    kota_domisili: 'Singapura',
    status_kontak: 'Aktif Terhubung',
    telepon_wa: '081188776655',
    email: 'kanzul.fikri@alumni.alwildan3bsd.sch.id',
    linkedin_url: 'https://www.linkedin.com/in/kanzul-fikri-nus',
    terakhir_dihubungi: '2026-11-09',
    bersedia_mentoring: true,
    catatan: 'Penerima Beasiswa ASEAN Undergraduate · Mentor persiapan kuliah luar negeri.',
    synced_to_sheets: false,
    updated_at: '2026-11-09T09:30:00Z',
  },
];

export class AlumniDirectoryService {
  static getAllAlumni(): AlumniRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ALUMNI);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ALUMNI, JSON.stringify(SEED_ALUMNI));
        localStorage.setItem(STORAGE_KEY_CAT5_MIGRATED, '1');
        return SEED_ALUMNI;
      }
      const parsed: AlumniRecord[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return SEED_ALUMNI;

      // Backfill university admission & LinkedIn fields for existing records saved earlier
      const seedById = new Map(SEED_ALUMNI.map((s) => [s.id, s]));
      let changed = false;
      const normalized = parsed.map((item) => {
        const seedMatch = seedById.get(item.id);
        const needsAdmissionBackfill =
          !item.kampus_diterima ||
          !item.kategori_perguruan_tinggi ||
          !item.tahun_diterima ||
          !item.jurusan_diterima ||
          !item.jalur_masuk_kampus;
        const needsLinkedinBackfill = !item.linkedin_url && Boolean(seedMatch?.linkedin_url);

        if (!needsAdmissionBackfill && !needsLinkedinBackfill) {
          return item;
        }
        changed = true;
        return {
          ...item,
          kampus_diterima:
            item.kampus_diterima ||
            seedMatch?.kampus_diterima ||
            item.instansi_atau_kampus ||
            'Belum Diisi',
          kategori_perguruan_tinggi:
            item.kategori_perguruan_tinggi ||
            seedMatch?.kategori_perguruan_tinggi ||
            resolveAlumniUniversityCategory(item),
          tahun_diterima:
            Number(item.tahun_diterima) ||
            seedMatch?.tahun_diterima ||
            Number(item.tahun_lulus) ||
            2023,
          jurusan_diterima:
            item.jurusan_diterima ||
            seedMatch?.jurusan_diterima ||
            item.profesi_saat_ini ||
            '-',
          jalur_masuk_kampus:
            item.jalur_masuk_kampus || seedMatch?.jalur_masuk_kampus || 'SNBT / UTBK',
          linkedin_url: item.linkedin_url || seedMatch?.linkedin_url,
        };
      });

      const cat5Seeded = localStorage.getItem(STORAGE_KEY_CAT5_MIGRATED) === '1';
      let result = normalized;
      if (!cat5Seeded) {
        const existingIds = new Set(normalized.map((a) => a.id));
        const newCatSamples = SEED_ALUMNI.filter(
          (s) =>
            ['ALM-007', 'ALM-008', 'ALM-009'].includes(s.id) &&
            !existingIds.has(s.id)
        );
        if (newCatSamples.length > 0) {
          result = [...normalized, ...newCatSamples];
          changed = true;
        }
        localStorage.setItem(STORAGE_KEY_CAT5_MIGRATED, '1');
      }

      if (changed) {
        this.saveAllAlumni(result);
      }
      return result;
    } catch {
      return SEED_ALUMNI;
    }
  }

  private static saveAllAlumni(list: AlumniRecord[]): void {
    localStorage.setItem(STORAGE_KEY_ALUMNI, JSON.stringify(list));
  }

  static createAlumni(input: {
    nis_alumni?: string;
    nama: string;
    tahun_masuk: number;
    tahun_lulus: number;
    angkatan?: string;
    kampus_asal: string;
    kelas_terakhir: string;
    kampus_diterima: string;
    kategori_perguruan_tinggi?: AlumniUniversityCategory;
    tahun_diterima: number;
    jurusan_diterima: string;
    jalur_masuk_kampus: AlumniAdmissionPath;
    sektor_karier: AlumniCareerSector;
    profesi_saat_ini: string;
    instansi_atau_kampus: string;
    kota_domisili: string;
    status_kontak: AlumniContactStatus;
    telepon_wa: string;
    email: string;
    linkedin_url?: string;
    bersedia_mentoring: boolean;
    catatan?: string;
  }): { success: boolean; message: string; alumni?: AlumniRecord } {
    const cleanName = SecurityService.sanitizeText(input.nama, 100);
    const cleanAcceptedCampus = SecurityService.sanitizeText(input.kampus_diterima, 120);
    const cleanMajor = SecurityService.sanitizeText(input.jurusan_diterima, 120);
    const cleanProfession = SecurityService.sanitizeText(input.profesi_saat_ini, 120);
    const cleanInst = SecurityService.sanitizeText(input.instansi_atau_kampus, 120);
    const cleanPhone = SecurityService.sanitizeText(input.telepon_wa, 32);
    const cleanEmail = SecurityService.sanitizeText(input.email, 100);
    const cleanLinkedin = SecurityService.sanitizeText(input.linkedin_url || '', 200);
    const masuk = Number(input.tahun_masuk);
    const lulus = Number(input.tahun_lulus);
    const diterimaTahun = Number(input.tahun_diterima) || lulus;

    if (!cleanName || !cleanAcceptedCampus || !cleanMajor || !cleanPhone) {
      return {
        success: false,
        message:
          'Nama lengkap, kampus diterima, jurusan, dan nomor WhatsApp alumni wajib diisi.',
      };
    }

    if (!Number.isFinite(masuk) || !Number.isFinite(lulus) || masuk < 2010 || lulus < masuk) {
      return {
        success: false,
        message: 'Tahun lulus harus sama atau lebih besar dari tahun masuk (minimal 2010).',
      };
    }

    const existing = this.getAllAlumni();
    const nextNum = String(existing.length + 1).padStart(3, '0');
    const generatedNis =
      SecurityService.sanitizeText(input.nis_alumni || '', 40).toUpperCase() ||
      `AW3-${masuk}-${nextNum}`;

    const duplicateNis = existing.some(
      (a) => a.nis_alumni.toLowerCase().trim() === generatedNis.toLowerCase()
    );
    if (duplicateNis) {
      return {
        success: false,
        message: `NIS Alumni "${generatedNis}" sudah terdaftar dalam direktori.`,
      };
    }

    const derivedAngkatan =
      SecurityService.sanitizeText(input.angkatan || '', 40) ||
      `Angkatan ${Math.max(1, lulus - 2021)}`;

    const cleanCity =
      SecurityService.sanitizeText(input.kota_domisili, 80) || 'Tangerang Selatan';
    const resolvedCategory =
      input.kategori_perguruan_tinggi ||
      inferUniversityCategory(cleanAcceptedCampus, input.jalur_masuk_kampus, cleanCity);

    const newRecord: AlumniRecord = {
      id: `ALM-${Date.now().toString().slice(-5)}-${nextNum}`,
      nis_alumni: generatedNis,
      nama: cleanName,
      tahun_masuk: masuk,
      tahun_lulus: lulus,
      angkatan: derivedAngkatan,
      kampus_asal: SecurityService.sanitizeText(input.kampus_asal, 80) || 'Kampus Utama BSD City',
      kelas_terakhir: SecurityService.sanitizeText(input.kelas_terakhir, 60) || '12 SMA',
      kampus_diterima: cleanAcceptedCampus,
      kategori_perguruan_tinggi: resolvedCategory,
      tahun_diterima: diterimaTahun,
      jurusan_diterima: cleanMajor,
      jalur_masuk_kampus: input.jalur_masuk_kampus,
      sektor_karier: input.sektor_karier,
      profesi_saat_ini: cleanProfession || `Mahasiswa ${cleanMajor}`,
      instansi_atau_kampus: cleanInst || cleanAcceptedCampus,
      kota_domisili: cleanCity,
      status_kontak: input.status_kontak,
      telepon_wa: cleanPhone,
      email: cleanEmail || '-',
      linkedin_url: cleanLinkedin || undefined,
      terakhir_dihubungi:
        input.status_kontak === 'Aktif Terhubung'
          ? new Date().toISOString().split('T')[0]
          : undefined,
      bersedia_mentoring: Boolean(input.bersedia_mentoring),
      catatan: input.catatan ? SecurityService.sanitizeText(input.catatan, 240) : undefined,
      synced_to_sheets: false,
      updated_at: new Date().toISOString(),
    };

    this.saveAllAlumni([newRecord, ...existing]);
    return {
      success: true,
      message: `Alumni "${newRecord.nama}" (${newRecord.kampus_diterima} · ${newRecord.jurusan_diterima}) berhasil ditambahkan.`,
      alumni: newRecord,
    };
  }

  static updateAlumni(
    id: string,
    updates: {
      tahun_masuk: number;
      tahun_lulus: number;
      angkatan: string;
      kampus_asal: string;
      kelas_terakhir: string;
      kampus_diterima: string;
      kategori_perguruan_tinggi?: AlumniUniversityCategory;
      tahun_diterima: number;
      jurusan_diterima: string;
      jalur_masuk_kampus: AlumniAdmissionPath;
      sektor_karier: AlumniCareerSector;
      profesi_saat_ini: string;
      instansi_atau_kampus: string;
      kota_domisili: string;
      status_kontak: AlumniContactStatus;
      telepon_wa: string;
      email: string;
      linkedin_url?: string;
      bersedia_mentoring: boolean;
      terakhir_dihubungi?: string;
      catatan?: string;
    }
  ): { success: boolean; message: string } {
    const existing = this.getAllAlumni();
    const target = existing.find((a) => a.id === id);
    if (!target) return { success: false, message: 'Data alumni tidak ditemukan.' };

    const masuk = Number(updates.tahun_masuk);
    const lulus = Number(updates.tahun_lulus);
    const diterimaTahun = Number(updates.tahun_diterima) || lulus;
    if (!Number.isFinite(masuk) || !Number.isFinite(lulus) || lulus < masuk) {
      return {
        success: false,
        message: 'Tahun lulus harus lebih besar atau sama dengan tahun masuk.',
      };
    }

    const cleanLinkedin = SecurityService.sanitizeText(updates.linkedin_url || '', 200);
    const cleanAcceptedCampus =
      SecurityService.sanitizeText(updates.kampus_diterima, 120) || target.kampus_diterima;
    const cleanCity =
      SecurityService.sanitizeText(updates.kota_domisili, 80) || target.kota_domisili;
    const resolvedCategory =
      updates.kategori_perguruan_tinggi ||
      inferUniversityCategory(cleanAcceptedCampus, updates.jalur_masuk_kampus, cleanCity);

    const updatedItem: AlumniRecord = {
      ...target,
      tahun_masuk: masuk,
      tahun_lulus: lulus,
      angkatan: SecurityService.sanitizeText(updates.angkatan, 40) || target.angkatan,
      kampus_asal: SecurityService.sanitizeText(updates.kampus_asal, 80) || target.kampus_asal,
      kelas_terakhir:
        SecurityService.sanitizeText(updates.kelas_terakhir, 60) || target.kelas_terakhir,
      kampus_diterima: cleanAcceptedCampus,
      kategori_perguruan_tinggi: resolvedCategory,
      tahun_diterima: diterimaTahun,
      jurusan_diterima:
        SecurityService.sanitizeText(updates.jurusan_diterima, 120) || target.jurusan_diterima,
      jalur_masuk_kampus: updates.jalur_masuk_kampus,
      sektor_karier: updates.sektor_karier,
      profesi_saat_ini:
        SecurityService.sanitizeText(updates.profesi_saat_ini, 120) || target.profesi_saat_ini,
      instansi_atau_kampus:
        SecurityService.sanitizeText(updates.instansi_atau_kampus, 120) || '-',
      kota_domisili: cleanCity,
      status_kontak: updates.status_kontak,
      telepon_wa: SecurityService.sanitizeText(updates.telepon_wa, 32) || target.telepon_wa,
      email: SecurityService.sanitizeText(updates.email, 100) || target.email,
      linkedin_url: cleanLinkedin || undefined,
      bersedia_mentoring: Boolean(updates.bersedia_mentoring),
      terakhir_dihubungi: updates.terakhir_dihubungi || target.terakhir_dihubungi,
      catatan: updates.catatan ? SecurityService.sanitizeText(updates.catatan, 240) : undefined,
      synced_to_sheets: false,
      updated_at: new Date().toISOString(),
    };

    this.saveAllAlumni(existing.map((a) => (a.id === id ? updatedItem : a)));
    return {
      success: true,
      message: `Data alumni "${target.nama}" berhasil diperbarui.`,
    };
  }

  static markContactVerified(id: string): { success: boolean; message: string } {
    const existing = this.getAllAlumni();
    const target = existing.find((a) => a.id === id);
    if (!target) return { success: false, message: 'Data alumni tidak ditemukan.' };

    const today = new Date().toISOString().split('T')[0];
    this.saveAllAlumni(
      existing.map((a) =>
        a.id === id
          ? {
              ...a,
              status_kontak: 'Aktif Terhubung',
              terakhir_dihubungi: today,
              synced_to_sheets: false,
              updated_at: new Date().toISOString(),
            }
          : a
      )
    );

    return {
      success: true,
      message: `Status kontak "${target.nama}" ditandai Aktif Terhubung (${today}).`,
    };
  }

  static deleteAlumni(id: string): { success: boolean; message: string } {
    const existing = this.getAllAlumni();
    const target = existing.find((a) => a.id === id);
    if (!target) return { success: false, message: 'Data alumni tidak ditemukan.' };

    this.saveAllAlumni(existing.filter((a) => a.id !== id));
    return {
      success: true,
      message: `Data alumni "${target.nama}" dihapus dari direktori.`,
    };
  }

  /**
   * Sinkronisasi Batch ke sheet 'direktori_alumni' di Google Sheets
   */
  static async syncAlumniToSheets(): Promise<{
    success: boolean;
    mode: 'cloud' | 'local';
    message: string;
  }> {
    const targetUrl = SheetsService.getScriptUrl();
    const alumni = this.getAllAlumni();

    if (!targetUrl) {
      return {
        success: false,
        mode: 'local',
        message:
          'URL Google Apps Script belum dikonfigurasi. Data alumni aman tersimpan di cache lokal.',
      };
    }

    try {
      const resp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: SecurityService.getAuthHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          url: targetUrl,
          action: 'syncAlumni',
          payload: {
            alumni: alumni.map((a) => ({
              id: a.id,
              nis_alumni: a.nis_alumni,
              nama: a.nama,
              tahun_masuk: a.tahun_masuk,
              tahun_lulus: a.tahun_lulus,
              angkatan: a.angkatan,
              kampus_asal: a.kampus_asal,
              kelas_terakhir: a.kelas_terakhir,
              kampus_diterima: a.kampus_diterima,
              kategori_perguruan_tinggi: resolveAlumniUniversityCategory(a),
              tahun_diterima: a.tahun_diterima,
              jurusan_diterima: a.jurusan_diterima,
              jalur_masuk_kampus: a.jalur_masuk_kampus,
              sektor_karier: a.sektor_karier,
              profesi_saat_ini: a.profesi_saat_ini,
              instansi_atau_kampus: a.instansi_atau_kampus,
              kota_domisili: a.kota_domisili,
              status_kontak: a.status_kontak,
              telepon_wa: a.telepon_wa,
              email: a.email,
              linkedin_url: a.linkedin_url || '',
              terakhir_dihubungi: a.terakhir_dihubungi || '',
              bersedia_mentoring: a.bersedia_mentoring ? 'Ya' : 'Tidak',
              catatan: a.catatan || '',
              updated_at: a.updated_at,
            })),
          },
        }),
      });

      const res = await resp.json();
      if (resp.ok && res.success) {
        const synced = alumni.map((a) => ({ ...a, synced_to_sheets: true }));
        this.saveAllAlumni(synced);
        return {
          success: true,
          mode: 'cloud',
          message: `${synced.length} data alumni berhasil disinkronkan ke sheet "direktori_alumni" di Google Sheets.`,
        };
      }

      return {
        success: false,
        mode: 'local',
        message:
          res.error ||
          'Apps Script belum memiliki handler syncAlumni. Perbarui Code.gs melalui Setup Google Sheets.',
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'local',
        message: 'Koneksi Google Sheets tertunda: ' + (err?.message || 'Network error'),
      };
    }
  }

  /**
   * Tarik data dari sheet 'direktori_alumni' di Google Sheets
   */
  static async pullAlumniFromSheets(): Promise<{ success: boolean; message: string }> {
    const targetUrl = SheetsService.getScriptUrl();
    if (!targetUrl) {
      return {
        success: false,
        message:
          'URL Google Apps Script belum diatur. Silakan konfigurasi di Setup Google Sheets.',
      };
    }

    try {
      const resp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: SecurityService.getAuthHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          url: targetUrl,
          action: 'getAlumni',
        }),
      });

      const res = await resp.json();
      if (!resp.ok || !res.success || !Array.isArray(res.alumni)) {
        return {
          success: false,
          message:
            res.error ||
            'Sheet "direktori_alumni" kosong atau aksi getAlumni belum tersedia di Apps Script.',
        };
      }

      if (res.alumni.length === 0) {
        return {
          success: true,
          message:
            'Sheet "direktori_alumni" masih kosong di Google Sheets. Gunakan "Sync ke Sheets" untuk mengunggah data.',
        };
      }

      const mapped: AlumniRecord[] = res.alumni.map((row: any, idx: number) => {
        const mentoringVal = String(row.bersedia_mentoring || '').toLowerCase();
        const tahunLulus = Number(row.tahun_lulus) || 2023;
        const kampusDiterima = String(row.kampus_diterima || row.instansi_atau_kampus || '-');
        const jalurMasuk = (row.jalur_masuk_kampus as AlumniAdmissionPath) || 'SNBT / UTBK';
        const kotaDomisili = String(row.kota_domisili || '-');
        return {
          id: String(row.id || `ALM-GS-${idx + 1}`),
          nis_alumni: String(row.nis_alumni || ''),
          nama: String(row.nama || 'Alumni'),
          tahun_masuk: Number(row.tahun_masuk) || 2020,
          tahun_lulus: tahunLulus,
          angkatan: String(row.angkatan || 'Angkatan'),
          kampus_asal: String(row.kampus_asal || 'Kampus Utama BSD City'),
          kelas_terakhir: String(row.kelas_terakhir || '12 SMA'),
          kampus_diterima: kampusDiterima,
          kategori_perguruan_tinggi:
            (row.kategori_perguruan_tinggi as AlumniUniversityCategory) ||
            inferUniversityCategory(kampusDiterima, jalurMasuk, kotaDomisili),
          tahun_diterima: Number(row.tahun_diterima) || tahunLulus,
          jurusan_diterima: String(row.jurusan_diterima || '-'),
          jalur_masuk_kampus: jalurMasuk,
          sektor_karier: (row.sektor_karier as AlumniCareerSector) || 'Lainnya',
          profesi_saat_ini: String(row.profesi_saat_ini || '-'),
          instansi_atau_kampus: String(row.instansi_atau_kampus || '-'),
          kota_domisili: kotaDomisili,
          status_kontak: (row.status_kontak as AlumniContactStatus) || 'Perlu Verifikasi',
          telepon_wa: String(row.telepon_wa || ''),
          email: String(row.email || ''),
          linkedin_url: row.linkedin_url ? String(row.linkedin_url).trim() : undefined,
          terakhir_dihubungi: row.terakhir_dihubungi ? String(row.terakhir_dihubungi) : undefined,
          bersedia_mentoring:
            mentoringVal === 'ya' || mentoringVal === 'true' || row.bersedia_mentoring === true,
          catatan: row.catatan ? String(row.catatan) : undefined,
          synced_to_sheets: true,
          updated_at: String(row.updated_at || new Date().toISOString()),
        };
      });

      this.saveAllAlumni(mapped);
      return {
        success: true,
        message: `${mapped.length} data alumni berhasil ditarik dari Google Sheets.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal menarik dari Google Sheets: ' + (err?.message || 'Network error'),
      };
    }
  }

  /**
   * Susun konten file CSV (UTF-8 BOM + proteksi formula injection) untuk data alumni
   */
  static buildCsvContent(items: AlumniRecord[]): string {
    const headers = [
      'ID',
      'NIS Alumni',
      'Nama Lengkap',
      'Tahun Masuk',
      'Tahun Lulus',
      'Angkatan',
      'Kampus Asal',
      'Kelas Terakhir',
      'Diterima di Kampus',
      'Kategori Perguruan Tinggi',
      'Tahun Diterima',
      'Jurusan / Program Studi',
      'Jalur Penerimaan Kampus',
      'Sektor Karier',
      'Profesi Saat Ini',
      'Instansi / Perusahaan',
      'Kota Domisili',
      'Status Kontak',
      'Nomor WhatsApp',
      'Email',
      'Profil LinkedIn',
      'Bersedia Mentoring',
      'Terakhir Dihubungi',
      'Catatan',
    ];

    const rows = items.map((a) => [
      a.id,
      a.nis_alumni,
      a.nama,
      a.tahun_masuk,
      a.tahun_lulus,
      a.angkatan,
      a.kampus_asal,
      a.kelas_terakhir,
      a.kampus_diterima,
      resolveAlumniUniversityCategory(a),
      a.tahun_diterima,
      a.jurusan_diterima,
      a.jalur_masuk_kampus,
      a.sektor_karier,
      a.profesi_saat_ini,
      a.instansi_atau_kampus,
      a.kota_domisili,
      a.status_kontak,
      a.telepon_wa,
      a.email,
      a.linkedin_url || '-',
      a.bersedia_mentoring ? 'Ya' : 'Tidak',
      a.terakhir_dihubungi || '-',
      a.catatan || '',
    ]);

    return (
      '\uFEFF' +
      [
        headers.map(SecurityService.escapeCsvCell).join(','),
        ...rows.map((r) => r.map(SecurityService.escapeCsvCell).join(',')),
      ].join('\r\n')
    );
  }

  /**
   * Unduh daftar alumni ke file CSV siap pakai di Excel / Google Sheets
   */
  static downloadCsv(
    items: AlumniRecord[],
    scopeTag: 'Terfilter' | 'Lengkap' = 'Terfilter'
  ): { success: boolean; filename: string; count: number } {
    if (!items || items.length === 0) {
      return { success: false, filename: '', count: 0 };
    }

    const csvContent = this.buildCsvContent(items);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Direktori_Alumni_AlWildan3_${scopeTag}_${dateStr}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename, count: items.length };
  }
}

