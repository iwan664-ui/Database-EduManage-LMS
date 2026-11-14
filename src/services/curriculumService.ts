import {
  DatabaseState,
  MasterGuru,
  MasterKelas,
  MasterSiswa,
  SiswaKelas,
  StudentMutationRecord,
} from '../types';
import { SheetsService } from './sheetsService';
import { SecurityService } from './securityService';

const STORAGE_KEY_MUTATIONS = 'alwildan_student_mutations_v1';

const SEED_MUTATIONS: StudentMutationRecord[] = [
  {
    id: 'MUT-SIS-001',
    siswa: 'Ahmad Rizky Pratama',
    email_siswa: 'ahmad.rizky@gmail.com',
    cabang: 'Kampus Utama BSD City',
    jenis: 'Masuk',
    tanggal: '2026-07-14',
    kelas_terkait: ['10 SMA Unggulan A', '11 SMA Saintek A'],
    alasan: 'Penerimaan Santri Baru Tahun Ajaran 2026/2027 (Jalur Prestasi Tahfidz)',
    diproses_oleh: 'Koordinator Kurikulum',
    timestamp: '2026-07-14T08:00:00Z',
  },
  {
    id: 'MUT-SIS-002',
    siswa: 'Bella Safitri',
    email_siswa: 'bella.safitri@gmail.com',
    cabang: 'Kampus Utama BSD City',
    jenis: 'Masuk',
    tanggal: '2026-07-15',
    kelas_terkait: ['10 SMA Unggulan A', '11 SMA Saintek A'],
    alasan: 'Penerimaan Santri Baru Tahun Ajaran 2026/2027',
    diproses_oleh: 'Koordinator Kurikulum',
    timestamp: '2026-07-15T09:15:00Z',
  },
];

export class CurriculumService {
  static getMutationLogs(): StudentMutationRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MUTATIONS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_MUTATIONS, JSON.stringify(SEED_MUTATIONS));
        return SEED_MUTATIONS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED_MUTATIONS;
    } catch {
      return SEED_MUTATIONS;
    }
  }

  private static saveMutationLogs(logs: StudentMutationRecord[]): void {
    localStorage.setItem(STORAGE_KEY_MUTATIONS, JSON.stringify(logs));
  }

  private static appendMutation(record: Omit<StudentMutationRecord, 'id' | 'timestamp'>): StudentMutationRecord {
    const logs = this.getMutationLogs();
    const entry: StudentMutationRecord = {
      ...record,
      id: `MUT-SIS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
    this.saveMutationLogs([entry, ...logs]);
    return entry;
  }

  /**
   * Tambah Guru Baru ke master_guru
   */
  static addGuru(guruName: string): { success: boolean; message: string; guru?: MasterGuru } {
    const cleanName = SecurityService.sanitizeText(guruName, 80);
    if (!cleanName || cleanName.length < 3) {
      return { success: false, message: 'Nama guru minimal 3 karakter.' };
    }

    const db = SheetsService.getLocalDatabase();
    const exists = db.master_guru.some(
      (g) => g.guru.toLowerCase().trim() === cleanName.toLowerCase().trim()
    );
    if (exists) {
      return { success: false, message: `Guru "${cleanName}" sudah terdaftar di sistem.` };
    }

    const nextNumber = db.master_guru.length + 1;
    const newGuru: MasterGuru = {
      id_tutor: `TUTOR-${String(nextNumber).padStart(3, '0')}`,
      guru: cleanName,
    };

    const updatedDb: DatabaseState = {
      ...db,
      master_guru: [...db.master_guru, newGuru],
    };
    SheetsService.saveLocalDatabase(updatedDb);
    return { success: true, message: `Guru "${cleanName}" berhasil ditambahkan.`, guru: newGuru };
  }

  /**
   * Simpan atau Perbarui Jadwal & Kelas Guru (Sinkron otomatis ke master_kelas & siswa_kelas)
   */
  static saveTeacherSchedule(
    input: {
      originalIdKelas?: string;
      id_kelas: string;
      guru: string;
      kelas: string;
      mapel: string;
      cabang: string;
      hari: string;
      waktu: string;
    }
  ): { success: boolean; message: string; schedule?: MasterKelas } {
    const id_kelas = SecurityService.sanitizeText(input.id_kelas, 32).toUpperCase().replace(/\s+/g, '-');
    const guru = SecurityService.sanitizeText(input.guru, 80);
    const kelas = SecurityService.sanitizeText(input.kelas, 80);
    const mapel = SecurityService.sanitizeText(input.mapel, 80);
    const cabang = SecurityService.sanitizeText(input.cabang, 80) || 'Kampus Utama BSD City';
    const hari = SecurityService.sanitizeText(input.hari, 24);
    const waktu = SecurityService.sanitizeText(input.waktu, 40);

    if (!id_kelas || !guru || !kelas || !mapel || !hari || !waktu) {
      return { success: false, message: 'Lengkapi ID Kelas, Guru, Nama Kelas, Mata Pelajaran, Hari, dan Waktu.' };
    }

    const db = SheetsService.getLocalDatabase();
    const scheduleItem: MasterKelas = {
      id_kelas,
      guru,
      kelas,
      mapel,
      cabang,
      hari,
      waktu,
    };

    if (input.originalIdKelas) {
      // Edit mode
      const conflictId =
        input.originalIdKelas !== id_kelas &&
        db.master_kelas.some((k) => k.id_kelas.toUpperCase() === id_kelas);
      if (conflictId) {
        return { success: false, message: `Kode ID Kelas "${id_kelas}" sudah digunakan oleh kelas lain.` };
      }

      const updatedMasterKelas = db.master_kelas.map((k) =>
        k.id_kelas === input.originalIdKelas ? scheduleItem : k
      );
      const updatedSiswaKelas = db.siswa_kelas.map((sk) =>
        sk.id_kelas === input.originalIdKelas
          ? {
              ...sk,
              id_kelas,
              guru,
              kelas,
              mapel,
              cabang,
              hari,
              waktu,
            }
          : sk
      );

      SheetsService.saveLocalDatabase({
        ...db,
        master_kelas: updatedMasterKelas,
        siswa_kelas: updatedSiswaKelas,
      });

      return {
        success: true,
        message: `Jadwal & kelas "${kelas}" (${guru}) berhasil diperbarui dan disinkronkan ke seluruh portal.`,
        schedule: scheduleItem,
      };
    }

    // Create mode
    const duplicate = db.master_kelas.some((k) => k.id_kelas.toUpperCase() === id_kelas);
    if (duplicate) {
      return { success: false, message: `ID Kelas "${id_kelas}" sudah ada. Gunakan kode kelas berbeda.` };
    }

    SheetsService.saveLocalDatabase({
      ...db,
      master_kelas: [...db.master_kelas, scheduleItem],
    });

    return {
      success: true,
      message: `Jadwal baru "${mapel}" (${kelas}) untuk ${guru} berhasil ditambahkan.`,
      schedule: scheduleItem,
    };
  }

  /**
   * Hapus Jadwal & Kelas Guru
   */
  static deleteTeacherSchedule(id_kelas: string): { success: boolean; message: string } {
    const db = SheetsService.getLocalDatabase();
    const target = db.master_kelas.find((k) => k.id_kelas === id_kelas);
    if (!target) {
      return { success: false, message: 'Jadwal kelas tidak ditemukan.' };
    }

    const updatedDb: DatabaseState = {
      ...db,
      master_kelas: db.master_kelas.filter((k) => k.id_kelas !== id_kelas),
      siswa_kelas: db.siswa_kelas.filter((sk) => sk.id_kelas !== id_kelas),
    };
    SheetsService.saveLocalDatabase(updatedDb);
    return {
      success: true,
      message: `Jadwal "${target.mapel} · ${target.kelas}" berhasil dihapus.`,
    };
  }

  /**
   * Tambah Siswa Baru (Siswa Masuk) + Penempatan Kelas Awal
   */
  static admitStudent(payload: {
    siswa: string;
    email_siswa: string;
    cabang: string;
    tanggal: string;
    alasan: string;
    kelasIds: string[];
    diproses_oleh: string;
  }): { success: boolean; message: string } {
    const siswa = SecurityService.sanitizeText(payload.siswa, 80);
    const email_siswa =
      SecurityService.sanitizeText(payload.email_siswa, 100) ||
      `${siswa.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@alwildan3bsd.sch.id`;
    const cabang = SecurityService.sanitizeText(payload.cabang, 80) || 'Kampus Utama BSD City';
    const alasan = SecurityService.sanitizeText(payload.alasan, 200) || 'Siswa baru masuk';
    const tanggal = payload.tanggal || new Date().toISOString().split('T')[0];

    if (!siswa || siswa.length < 3) {
      return { success: false, message: 'Nama lengkap siswa minimal 3 karakter.' };
    }

    const db = SheetsService.getLocalDatabase();
    const alreadyExists = db.master_siswa.some(
      (s) => s.siswa.toLowerCase().trim() === siswa.toLowerCase().trim()
    );
    if (alreadyExists) {
      return { success: false, message: `Siswa "${siswa}" sudah terdaftar aktif di sekolah.` };
    }

    const newStudent: MasterSiswa = {
      siswa,
      email_siswa,
      cabang,
    };

    const selectedClasses = db.master_kelas.filter((k) => payload.kelasIds.includes(k.id_kelas));
    const newEnrollments: SiswaKelas[] = selectedClasses.map((k) => ({
      id_kelas: k.id_kelas,
      siswa,
      email_siswa,
      kelas: k.kelas,
      mapel: k.mapel,
      hari: k.hari,
      waktu: k.waktu,
      guru: k.guru,
      cabang: k.cabang,
    }));

    SheetsService.saveLocalDatabase({
      ...db,
      master_siswa: [...db.master_siswa, newStudent],
      siswa_kelas: [...db.siswa_kelas, ...newEnrollments],
    });

    this.appendMutation({
      siswa,
      email_siswa,
      cabang,
      jenis: 'Masuk',
      tanggal,
      kelas_terkait: selectedClasses.map((c) => `${c.kelas} (${c.mapel})`),
      alasan,
      diproses_oleh: payload.diproses_oleh,
    });

    return {
      success: true,
      message: `Siswa masuk "${siswa}" berhasil didaftarkan ke ${selectedClasses.length} kelas.`,
    };
  }

  /**
   * Proses Siswa Keluar / Mutasi / Lulus
   */
  static withdrawStudent(payload: {
    siswa: string;
    tanggal: string;
    alasan: string;
    diproses_oleh: string;
  }): { success: boolean; message: string } {
    const db = SheetsService.getLocalDatabase();
    const student = db.master_siswa.find(
      (s) => s.siswa.toLowerCase().trim() === payload.siswa.toLowerCase().trim()
    );
    if (!student) {
      return { success: false, message: 'Siswa tidak ditemukan dalam daftar siswa aktif.' };
    }

    const prevClasses = db.siswa_kelas
      .filter((sk) => sk.siswa === student.siswa)
      .map((c) => `${c.kelas} (${c.mapel})`);

    const updatedDb: DatabaseState = {
      ...db,
      master_siswa: db.master_siswa.filter((s) => s.siswa !== student.siswa),
      siswa_kelas: db.siswa_kelas.filter((sk) => sk.siswa !== student.siswa),
    };
    SheetsService.saveLocalDatabase(updatedDb);

    this.appendMutation({
      siswa: student.siswa,
      email_siswa: student.email_siswa,
      cabang: student.cabang,
      jenis: 'Keluar',
      tanggal: payload.tanggal || new Date().toISOString().split('T')[0],
      kelas_terkait: prevClasses,
      alasan: SecurityService.sanitizeText(payload.alasan, 220) || 'Mutasi / Pindah Sekolah',
      diproses_oleh: payload.diproses_oleh,
    });

    return {
      success: true,
      message: `"${student.siswa}" telah diproses keluar & dicatat dalam riwayat mutasi kesiswaan.`,
    };
  }

  /**
   * Aktifkan Kembali Siswa yang Pernah Keluar (Siswa Masuk Kembali)
   */
  static reactivateStudent(payload: {
    mutationRecord: StudentMutationRecord;
    kelasIds: string[];
    alasan: string;
    diproses_oleh: string;
  }): { success: boolean; message: string } {
    const db = SheetsService.getLocalDatabase();
    const { mutationRecord } = payload;

    const alreadyActive = db.master_siswa.some(
      (s) => s.siswa.toLowerCase().trim() === mutationRecord.siswa.toLowerCase().trim()
    );
    if (alreadyActive) {
      return { success: false, message: `Siswa "${mutationRecord.siswa}" sudah berstatus aktif.` };
    }

    const restoredStudent: MasterSiswa = {
      siswa: mutationRecord.siswa,
      email_siswa: mutationRecord.email_siswa,
      cabang: mutationRecord.cabang,
    };

    const selectedClasses = db.master_kelas.filter((k) => payload.kelasIds.includes(k.id_kelas));
    const newEnrollments: SiswaKelas[] = selectedClasses.map((k) => ({
      id_kelas: k.id_kelas,
      siswa: mutationRecord.siswa,
      email_siswa: mutationRecord.email_siswa,
      kelas: k.kelas,
      mapel: k.mapel,
      hari: k.hari,
      waktu: k.waktu,
      guru: k.guru,
      cabang: k.cabang,
    }));

    SheetsService.saveLocalDatabase({
      ...db,
      master_siswa: [...db.master_siswa, restoredStudent],
      siswa_kelas: [...db.siswa_kelas, ...newEnrollments],
    });

    this.appendMutation({
      siswa: mutationRecord.siswa,
      email_siswa: mutationRecord.email_siswa,
      cabang: mutationRecord.cabang,
      jenis: 'Aktif Kembali',
      tanggal: new Date().toISOString().split('T')[0],
      kelas_terkait: selectedClasses.map((c) => `${c.kelas} (${c.mapel})`),
      alasan: SecurityService.sanitizeText(payload.alasan, 200) || 'Siswa aktif kembali',
      diproses_oleh: payload.diproses_oleh,
    });

    return {
      success: true,
      message: `"${mutationRecord.siswa}" diaktifkan kembali dan ditempatkan di ${selectedClasses.length} kelas.`,
    };
  }

  /**
   * Perbarui Penempatan Kelas Siswa Aktif (Pindah / Tambah / Keluarkan dari Kelas)
   */
  static updateStudentClasses(payload: {
    siswa: string;
    kelasIds: string[];
    diproses_oleh: string;
    alasan?: string;
  }): { success: boolean; message: string } {
    const db = SheetsService.getLocalDatabase();
    const student = db.master_siswa.find((s) => s.siswa === payload.siswa);
    if (!student) {
      return { success: false, message: 'Siswa tidak ditemukan.' };
    }

    const selectedClasses = db.master_kelas.filter((k) => payload.kelasIds.includes(k.id_kelas));
    const updatedEnrollments: SiswaKelas[] = selectedClasses.map((k) => ({
      id_kelas: k.id_kelas,
      siswa: student.siswa,
      email_siswa: student.email_siswa,
      kelas: k.kelas,
      mapel: k.mapel,
      hari: k.hari,
      waktu: k.waktu,
      guru: k.guru,
      cabang: k.cabang,
    }));

    const otherEnrollments = db.siswa_kelas.filter((sk) => sk.siswa !== student.siswa);

    SheetsService.saveLocalDatabase({
      ...db,
      siswa_kelas: [...otherEnrollments, ...updatedEnrollments],
    });

    this.appendMutation({
      siswa: student.siswa,
      email_siswa: student.email_siswa,
      cabang: student.cabang,
      jenis: 'Pindah Kelas',
      tanggal: new Date().toISOString().split('T')[0],
      kelas_terkait: selectedClasses.map((c) => `${c.kelas} (${c.mapel})`),
      alasan: SecurityService.sanitizeText(payload.alasan || 'Penyesuaian penempatan kelas oleh Kurikulum', 200),
      diproses_oleh: payload.diproses_oleh,
    });

    return {
      success: true,
      message: `Penempatan kelas untuk "${student.siswa}" diperbarui (${selectedClasses.length} kelas aktif).`,
    };
  }
}
