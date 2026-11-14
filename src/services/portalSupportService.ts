import {
  StudentAchievementItem,
  StudentLeaveRequest,
  TeacherCounselingNote,
} from '../types';
import { SecurityService } from './securityService';

const STORAGE_KEY_LEAVE = 'alwildan_leave_requests_v1';
const STORAGE_KEY_COUNSELING = 'alwildan_counseling_notes_v1';
const STORAGE_KEY_ACHIEVEMENTS = 'alwildan_student_achievements_v1';

const SEED_LEAVE_REQUESTS: StudentLeaveRequest[] = [
  {
    id: 'IZN-001',
    siswa: 'Bella Safitri',
    cabang: 'Kampus Utama BSD City',
    tanggal_mulai: '2026-11-11',
    tanggal_selesai: '2026-11-11',
    jenis: 'Izin',
    alasan: 'Menghadiri agenda keluarga mendadak di luar kota (sudah konfirmasi wali kelas).',
    nama_wali: 'Bpk. Hendra Wijaya',
    kontak_wali: '0812-8899-4411',
    status: 'Disetujui',
    ditanggapi_oleh: 'Budi Santoso, S.Pd.',
    catatan_guru: 'Disetujui. Materi Eksponen & Logaritma dapat dipelajari melalui Digital Maktabah.',
    created_at: '2026-11-10T19:30:00Z',
  },
  {
    id: 'IZN-002',
    siswa: 'Dimas Aditya',
    cabang: 'Kampus Utama BSD City',
    tanggal_mulai: '2026-11-13',
    tanggal_selesai: '2026-11-13',
    jenis: 'Sakit',
    alasan: 'Demam ringan dan istirahat sesuai anjuran dokter klinik.',
    nama_wali: 'Ibu Ratna Sari',
    kontak_wali: '0813-7721-9004',
    status: 'Menunggu',
    created_at: '2026-11-12T20:15:00Z',
  },
];

const SEED_COUNSELING_NOTES: TeacherCounselingNote[] = [
  {
    id: 'KSL-001',
    siswa: 'Ahmad Rizky Pratama',
    guru: 'Budi Santoso, S.Pd.',
    tanggal: '2026-11-05',
    kategori: 'Apresiasi Prestasi',
    catatan: 'Konsisten melampaui KKM 85 pada Matematika Wajib & Fisika Intensif serta mutqin Juz 29.',
    tindak_lanjut: 'Direkomendasikan mengikuti pembinaan Olimpiade Sains & Musabaqah Hifdzil Qur\'an.',
  },
  {
    id: 'KSL-002',
    siswa: 'Dimas Aditya',
    guru: 'Budi Santoso, S.Pd.',
    tanggal: '2026-11-04',
    kategori: 'Akademik (KKM 85)',
    catatan: 'Nilai Matematika meningkat dari 72 ke 80, perlu penguatan 5 poin lagi untuk menembus KKM 85.',
    tindak_lanjut: 'Klinik belajar tambahan setiap Rabu pukul 15:00 WIB bersama tutor pendamping.',
  },
];

const SEED_ACHIEVEMENTS: StudentAchievementItem[] = [
  {
    id: 'PRS-001',
    siswa: 'Ahmad Rizky Pratama',
    judul: 'Juara 1 Musabaqah Hifdzil Qur\'an (MHQ) 3 Juz Antar Sekolah',
    kategori: "Tahfidz & Al-Qur'an",
    tingkat: 'Kota/Kabupaten',
    peringkat: 'Juara 1',
    tanggal: '2026-10-20',
    penyelenggara: 'LPTQ Tangerang Selatan',
    terverifikasi: true,
  },
  {
    id: 'PRS-002',
    siswa: 'Ahmad Rizky Pratama',
    judul: 'Finalis Kompetisi Robotika & Autonomous Line Follower',
    kategori: 'Sains & Akademik',
    tingkat: 'Provinsi',
    peringkat: 'Top 5 Finalis',
    tanggal: '2026-09-28',
    penyelenggara: 'STEM Banten Youth Expo',
    terverifikasi: true,
  },
  {
    id: 'PRS-003',
    siswa: 'Bella Safitri',
    judul: 'Best Speaker English Speech & Debate Championship',
    kategori: 'Sains & Akademik',
    tingkat: 'Kota/Kabupaten',
    peringkat: 'Best Speaker',
    tanggal: '2026-10-15',
    penyelenggara: 'Forum OSIS BSD City',
    terverifikasi: true,
  },
  {
    id: 'PRS-004',
    siswa: 'Putri Amelia',
    judul: 'Wisuda Tasmi\' 3 Juz Sekali Duduk Predikat Mumtaz',
    kategori: "Tahfidz & Al-Qur'an",
    tingkat: 'Sekolah',
    peringkat: 'Mumtaz (Nilai 99)',
    tanggal: '2026-11-05',
    penyelenggara: 'AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY',
    terverifikasi: true,
  },
];

export class PortalSupportService {
  static getLeaveRequests(): StudentLeaveRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEAVE);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_LEAVE, JSON.stringify(SEED_LEAVE_REQUESTS));
        return SEED_LEAVE_REQUESTS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED_LEAVE_REQUESTS;
    } catch {
      return SEED_LEAVE_REQUESTS;
    }
  }

  static submitLeaveRequest(input: {
    siswa: string;
    cabang: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    jenis: 'Izin' | 'Sakit';
    alasan: string;
    nama_wali: string;
    kontak_wali: string;
  }): { success: boolean; message: string; request?: StudentLeaveRequest } {
    const alasan = SecurityService.sanitizeText(input.alasan, 260);
    const nama_wali = SecurityService.sanitizeText(input.nama_wali, 80);
    const kontak_wali = SecurityService.sanitizeText(input.kontak_wali, 40);

    if (!alasan || alasan.length < 5) {
      return { success: false, message: 'Alasan izin/sakit wajib diisi minimal 5 karakter.' };
    }
    if (!nama_wali || !kontak_wali) {
      return { success: false, message: 'Nama & nomor kontak Orang Tua / Wali wajib diisi.' };
    }

    const req: StudentLeaveRequest = {
      id: `IZN-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      siswa: input.siswa,
      cabang: input.cabang,
      tanggal_mulai: input.tanggal_mulai,
      tanggal_selesai: input.tanggal_selesai || input.tanggal_mulai,
      jenis: input.jenis,
      alasan,
      nama_wali,
      kontak_wali,
      status: 'Menunggu',
      created_at: new Date().toISOString(),
    };

    const current = this.getLeaveRequests();
    localStorage.setItem(STORAGE_KEY_LEAVE, JSON.stringify([req, ...current]));
    return { success: true, message: `Pengajuan ${input.jenis} berhasil dikirim ke Guru & Sekolah.`, request: req };
  }

  static respondLeaveRequest(
    id: string,
    status: 'Disetujui' | 'Ditolak',
    ditanggapi_oleh: string,
    catatan_guru?: string
  ): { success: boolean; message: string } {
    const current = this.getLeaveRequests();
    const cleanNote = catatan_guru ? SecurityService.sanitizeText(catatan_guru, 220) : undefined;
    const updated = current.map((r) =>
      r.id === id
        ? {
            ...r,
            status,
            ditanggapi_oleh,
            catatan_guru: cleanNote || (status === 'Disetujui' ? 'Disetujui oleh pembimbing/sekolah.' : 'Perlu konfirmasi lanjutan.'),
          }
        : r
    );
    localStorage.setItem(STORAGE_KEY_LEAVE, JSON.stringify(updated));
    return { success: true, message: `Pengajuan izin telah ditandai "${status}".` };
  }

  static getCounselingNotes(): TeacherCounselingNote[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COUNSELING);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_COUNSELING, JSON.stringify(SEED_COUNSELING_NOTES));
        return SEED_COUNSELING_NOTES;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED_COUNSELING_NOTES;
    } catch {
      return SEED_COUNSELING_NOTES;
    }
  }

  static addCounselingNote(input: Omit<TeacherCounselingNote, 'id'>): TeacherCounselingNote {
    const note: TeacherCounselingNote = {
      ...input,
      id: `KSL-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      catatan: SecurityService.sanitizeText(input.catatan, 300),
      tindak_lanjut: SecurityService.sanitizeText(input.tindak_lanjut, 240),
    };
    const current = this.getCounselingNotes();
    localStorage.setItem(STORAGE_KEY_COUNSELING, JSON.stringify([note, ...current]));
    return note;
  }

  static getAchievements(): StudentAchievementItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(SEED_ACHIEVEMENTS));
        return SEED_ACHIEVEMENTS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED_ACHIEVEMENTS;
    } catch {
      return SEED_ACHIEVEMENTS;
    }
  }

  static addAchievement(
    input: Omit<StudentAchievementItem, 'id' | 'terverifikasi'>,
    autoVerify = false
  ): StudentAchievementItem {
    const item: StudentAchievementItem = {
      ...input,
      id: `PRS-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      judul: SecurityService.sanitizeText(input.judul, 140),
      peringkat: SecurityService.sanitizeText(input.peringkat, 60),
      penyelenggara: SecurityService.sanitizeText(input.penyelenggara, 100),
      terverifikasi: autoVerify,
    };
    const current = this.getAchievements();
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify([item, ...current]));
    return item;
  }

  static verifyAchievement(id: string): void {
    const current = this.getAchievements();
    const updated = current.map((a) => (a.id === id ? { ...a, terverifikasi: true } : a));
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(updated));
  }
}
