import {
  ActiveUser,
  DatabaseState,
  GateAttendanceLog,
  GateScheduleConfig,
  LogAbsensi,
  MasterSiswa,
  UserRole,
} from '../types';
import { SheetsService } from './sheetsService';

const STORAGE_KEY_GATE_LOGS = 'edumanage_gate_attendance_v1';
const STORAGE_KEY_GATE_CONFIG = 'edumanage_gate_config_v1';

const DEFAULT_CONFIG: GateScheduleConfig = {
  batasJamMasuk: '07:15',
  jamPulangStandar: '15:00',
  lokasiDefault: 'Gerbang Utama Kampus 1 GDC Depok',
};

function getDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export class GateAttendanceService {
  /**
   * Menghasilkan Kode Kartu Smart ID yang identik dengan StudentSmartCard
   */
  static getStudentCardCode(studentName: string): string {
    const nisn =
      '00' +
      Math.abs(
        studentName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 10000000)
      )
        .toString()
        .slice(0, 8);
    return `AW29-${nisn.slice(-4)}`;
  }

  static getScheduleConfig(): GateScheduleConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GATE_CONFIG);
      if (!raw) return DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  static saveScheduleConfig(config: GateScheduleConfig): void {
    localStorage.setItem(STORAGE_KEY_GATE_CONFIG, JSON.stringify(config));
  }

  private static createSeedLogs(): GateAttendanceLog[] {
    const today = getDateOffset(0);
    const yesterday = getDateOffset(-1);
    const twoDaysAgo = getDateOffset(-2);
    const nowIso = new Date().toISOString();

    const makeSeed = (
      id: string,
      tanggal: string,
      siswa: string,
      cabang: string,
      kelas: string,
      jam_masuk: string | undefined,
      jam_pulang: string | undefined,
      status_masuk: GateAttendanceLog['status_masuk'],
      status_pulang: GateAttendanceLog['status_pulang'],
      scanMasuk: string,
      peranMasuk: UserRole,
      scanPulang?: string,
      peranPulang?: UserRole,
      catatan?: string
    ): GateAttendanceLog => ({
      id,
      tanggal,
      siswa,
      cabang,
      kelas,
      kode_kartu: this.getStudentCardCode(siswa),
      jam_masuk,
      jam_pulang,
      status_masuk,
      status_pulang,
      scan_oleh_masuk: scanMasuk,
      peran_scanner_masuk: peranMasuk,
      scan_oleh_pulang: scanPulang,
      peran_scanner_pulang: peranPulang,
      metode_scan: 'QR / Barcode Kartu',
      lokasi_gerbang: `Gerbang Utama ${cabang}`,
      catatan,
      updated_at: nowIso,
    });

    return [
      // Hari ini (Live status di sekolah vs sudah pulang)
      makeSeed(
        'GATE-SEED-01',
        today,
        'Ahmad Rizky Pratama',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '06:51:12',
        undefined,
        'Tepat Waktu',
        'Belum Pulang',
        'Budi Santoso, S.Pd.',
        'tutor',
        undefined,
        undefined,
        'Tiba lebih awal dan langsung mengikuti murojaah pagi.'
      ),
      makeSeed(
        'GATE-SEED-02',
        today,
        'Bella Safitri',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '07:04:38',
        undefined,
        'Tepat Waktu',
        'Belum Pulang',
        'Administrator Sekolah',
        'admin',
        undefined,
        undefined,
        'Scan gerbang masuk pagi terverifikasi.'
      ),
      makeSeed(
        'GATE-SEED-03',
        today,
        'Dimas Aditya',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '07:22:05',
        undefined,
        'Terlambat',
        'Belum Pulang',
        'Budi Santoso, S.Pd.',
        'tutor',
        undefined,
        undefined,
        'Terlambat 7 menit karena kondisi lalu lintas.'
      ),
      makeSeed(
        'GATE-SEED-04',
        today,
        'Eka Nurul Fadilah',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '06:58:44',
        '15:18:20',
        'Tepat Waktu',
        'Sudah Pulang',
        'Administrator Sekolah',
        'admin',
        'Budi Santoso, S.Pd.',
        'tutor',
        'Dijemput orang tua tepat waktu.'
      ),

      // Kemarin
      makeSeed(
        'GATE-SEED-05',
        yesterday,
        'Ahmad Rizky Pratama',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '06:48:19',
        '15:32:10',
        'Tepat Waktu',
        'Sudah Pulang',
        'Budi Santoso, S.Pd.',
        'tutor',
        'Administrator Sekolah',
        'admin',
        'Hadir penuh termasuk pembinaan tahfidz sore.'
      ),
      makeSeed(
        'GATE-SEED-06',
        yesterday,
        'Bella Safitri',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '07:09:50',
        '15:15:42',
        'Tepat Waktu',
        'Sudah Pulang',
        'Administrator Sekolah',
        'admin',
        'Budi Santoso, S.Pd.',
        'tutor'
      ),
      makeSeed(
        'GATE-SEED-07',
        yesterday,
        'Dimas Aditya',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '07:12:30',
        '14:25:00',
        'Tepat Waktu',
        'Pulang Awal',
        'Budi Santoso, S.Pd.',
        'tutor',
        'Administrator Sekolah',
        'admin',
        'Izin pulang awal atas permintaan wali murid.'
      ),

      // 2 Hari Lalu
      makeSeed(
        'GATE-SEED-08',
        twoDaysAgo,
        'Ahmad Rizky Pratama',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '06:55:04',
        '15:28:55',
        'Tepat Waktu',
        'Sudah Pulang',
        'Administrator Sekolah',
        'admin',
        'Budi Santoso, S.Pd.',
        'tutor'
      ),
      makeSeed(
        'GATE-SEED-09',
        twoDaysAgo,
        'Bella Safitri',
        'Kampus 1 GDC Depok',
        '10 SMA Unggulan A',
        '07:19:15',
        '15:20:11',
        'Terlambat',
        'Sudah Pulang',
        'Budi Santoso, S.Pd.',
        'tutor',
        'Administrator Sekolah',
        'admin',
        'Terlambat 4 menit.'
      ),
    ];
  }

  static getAllLogs(): GateAttendanceLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GATE_LOGS);
      if (!raw) {
        const seed = this.createSeedLogs();
        localStorage.setItem(STORAGE_KEY_GATE_LOGS, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : this.createSeedLogs();
    } catch {
      return this.createSeedLogs();
    }
  }

  static saveAllLogs(logs: GateAttendanceLog[]): void {
    localStorage.setItem(STORAGE_KEY_GATE_LOGS, JSON.stringify(logs));
  }

  /**
   * Cari siswa berdasarkan kode kartu Smart ID (AW29-XXXX) atau nama siswa
   */
  static findStudentByCodeOrName(database: DatabaseState, query: string): MasterSiswa | undefined {
    const clean = query.trim().toLowerCase();
    if (!clean) return undefined;

    return database.master_siswa.find((s) => {
      const cardCode = this.getStudentCardCode(s.siswa).toLowerCase();
      return (
        cardCode === clean ||
        cardCode.replace('aw29-', '') === clean ||
        s.siswa.toLowerCase() === clean ||
        s.siswa.toLowerCase().includes(clean)
      );
    });
  }

  static formatTimeNow(): string {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\./g, ':');
  }

  /**
   * Hitung durasi berada di sekolah dalam format "8j 15m"
   */
  static computeDuration(jamMasuk?: string, jamPulang?: string): string {
    if (!jamMasuk || !jamPulang) return '-';
    const parseSec = (t: string) => {
      const parts = t.replace(/\./g, ':').split(':').map(Number);
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    };
    const diff = parseSec(jamPulang) - parseSec(jamMasuk);
    if (diff <= 0) return '-';
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    return `${hours}j ${mins}m`;
  }

  /**
   * Catat scan Jam Masuk atau Jam Pulang, terintegrasi dengan akun Guru/Manajemen dan database absensi LMS
   */
  static recordScan(params: {
    database: DatabaseState;
    siswa: MasterSiswa;
    mode: 'auto' | 'masuk' | 'pulang';
    scannerUser?: ActiveUser | null;
    metode?: GateAttendanceLog['metode_scan'];
    lokasi?: string;
    catatan?: string;
    customTime?: string;
  }): {
    log: GateAttendanceLog;
    actionType: 'masuk' | 'pulang';
    allLogs: GateAttendanceLog[];
  } {
    const {
      database,
      siswa,
      mode,
      scannerUser,
      metode = 'QR / Barcode Kartu',
      lokasi,
      catatan,
      customTime,
    } = params;

    const today = getDateOffset(0);
    const config = this.getScheduleConfig();
    const timeStr = customTime || this.formatTimeNow();
    const hhmm = timeStr.slice(0, 5);

    const scannerName = scannerUser?.name || 'Petugas Piket Sekolah';
    const scannerRole: UserRole = scannerUser?.role || 'tutor';

    const enrolled = database.siswa_kelas.find((sk) => sk.siswa === siswa.siswa);
    const existingLogs = this.getAllLogs();
    const existingIdx = existingLogs.findIndex(
      (l) => l.tanggal === today && l.siswa.toLowerCase().trim() === siswa.siswa.toLowerCase().trim()
    );
    const existing = existingIdx >= 0 ? existingLogs[existingIdx] : undefined;

    // Determine whether this scan is Check-In ('masuk') or Check-Out ('pulang')
    let actionType: 'masuk' | 'pulang';
    if (mode === 'auto') {
      actionType = existing && existing.jam_masuk && !existing.jam_pulang ? 'pulang' : 'masuk';
      // If both masuk & pulang already exist today, update pulang
      if (existing && existing.jam_masuk && existing.jam_pulang) {
        actionType = 'pulang';
      }
    } else {
      actionType = mode;
    }

    const isLate = hhmm > config.batasJamMasuk;
    const isEarlyLeave = hhmm < config.jamPulangStandar;
    const nowIso = new Date().toISOString();

    let updatedLog: GateAttendanceLog;

    if (existing) {
      if (actionType === 'masuk') {
        updatedLog = {
          ...existing,
          jam_masuk: timeStr,
          status_masuk: isLate ? 'Terlambat' : 'Tepat Waktu',
          scan_oleh_masuk: scannerName,
          peran_scanner_masuk: scannerRole,
          metode_scan: metode,
          lokasi_gerbang: lokasi || existing.lokasi_gerbang || config.lokasiDefault,
          catatan: catatan || existing.catatan,
          updated_at: nowIso,
        };
      } else {
        updatedLog = {
          ...existing,
          jam_pulang: timeStr,
          status_pulang: isEarlyLeave ? 'Pulang Awal' : 'Sudah Pulang',
          scan_oleh_pulang: scannerName,
          peran_scanner_pulang: scannerRole,
          metode_scan: metode,
          lokasi_gerbang: lokasi || existing.lokasi_gerbang || config.lokasiDefault,
          catatan: catatan || existing.catatan,
          updated_at: nowIso,
        };
      }
    } else {
      if (actionType === 'masuk') {
        updatedLog = {
          id: `GATE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          tanggal: today,
          siswa: siswa.siswa,
          cabang: siswa.cabang,
          kelas: enrolled?.kelas || 'Reguler',
          kode_kartu: this.getStudentCardCode(siswa.siswa),
          jam_masuk: timeStr,
          status_masuk: isLate ? 'Terlambat' : 'Tepat Waktu',
          status_pulang: 'Belum Pulang',
          scan_oleh_masuk: scannerName,
          peran_scanner_masuk: scannerRole,
          metode_scan: metode,
          lokasi_gerbang: lokasi || `Gerbang ${siswa.cabang}`,
          catatan,
          updated_at: nowIso,
        };
      } else {
        updatedLog = {
          id: `GATE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          tanggal: today,
          siswa: siswa.siswa,
          cabang: siswa.cabang,
          kelas: enrolled?.kelas || 'Reguler',
          kode_kartu: this.getStudentCardCode(siswa.siswa),
          jam_pulang: timeStr,
          status_pulang: isEarlyLeave ? 'Pulang Awal' : 'Sudah Pulang',
          scan_oleh_pulang: scannerName,
          peran_scanner_pulang: scannerRole,
          metode_scan: metode,
          lokasi_gerbang: lokasi || `Gerbang ${siswa.cabang}`,
          catatan,
          updated_at: nowIso,
        };
      }
    }

    const updatedAll =
      existingIdx >= 0
        ? existingLogs.map((l, idx) => (idx === existingIdx ? updatedLog : l))
        : [updatedLog, ...existingLogs];

    this.saveAllLogs(updatedAll);

    // Sinkronkan juga ke LogAbsensi database LMS saat scan masuk (agar dashboard guru & admin selalu sinkron)
    if (actionType === 'masuk') {
      const db = SheetsService.getLocalDatabase();
      const targetClassId = enrolled?.id_kelas || database.master_kelas[0]?.id_kelas || 'KLS-10A-MAT';
      const alreadyLoggedToday = db.log_absensi.some(
        (a) => a.tanggal === today && a.siswa === siswa.siswa && a.id_kelas === targetClassId
      );
      if (!alreadyLoggedToday) {
        const newAbsensi: LogAbsensi = {
          id_absensi: `ABS-GATE-${Date.now().toString().slice(-6)}`,
          tanggal: today,
          id_kelas: targetClassId,
          siswa: siswa.siswa,
          status_kehadiran: 'Hadir',
          id_tutor: scannerUser?.id_tutor || scannerName,
          timestamp: nowIso,
        };
        db.log_absensi = [newAbsensi, ...db.log_absensi];
        SheetsService.saveLocalDatabase(db);
      }
    }

    return {
      log: updatedLog,
      actionType,
      allLogs: updatedAll,
    };
  }
}
