export type KehadiranStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';

export type UserRole = 'tutor' | 'siswa' | 'admin';

export interface MasterSiswa {
  cabang: string;
  siswa: string;
  email_siswa: string;
}

export interface MasterGuru {
  id_tutor: string;
  guru: string;
}

export interface MasterKelas {
  id_kelas: string;
  cabang: string;
  kelas: string;
  mapel: string;
  hari: string;
  waktu: string;
  guru: string;
}

export interface SiswaKelas {
  id_kelas: string;
  siswa: string;
  email_siswa: string;
  kelas: string;
  mapel: string;
  hari: string;
  waktu: string;
  guru: string;
  cabang: string;
}

export interface LogAbsensi {
  id_absensi: string;
  tanggal: string; // YYYY-MM-DD
  id_kelas: string;
  siswa: string;
  status_kehadiran: KehadiranStatus;
  id_tutor: string;
  timestamp: string;
}

export interface LogNilai {
  id_nilai: string;
  tanggal: string; // YYYY-MM-DD
  id_kelas: string;
  siswa: string;
  mapel: string;
  jenis_penilaian: string;
  nilai: number;
  catatan: string;
  id_tutor: string;
  timestamp: string;
}

export interface SiswaEkstrakurikuler {
  id_ekskul: string;
  siswa: string;
  nama_ekskul: string;
  kategori: 'Keagamaan & Tahfidz' | 'Sains & Robotika' | 'Olahraga Sunnah' | 'Bahasa & Seni' | 'Kepemimpinan';
  pembina: string;
  jadwal: string;
  lokasi: string;
  kehadiran_persen: number;
  predikat: 'A (Istimewa)' | 'B (Sangat Baik)' | 'C (Baik)';
  capaian: string;
  status: 'Aktif' | 'Selesai';
}

export interface DatabaseState {
  master_siswa: MasterSiswa[];
  master_guru: MasterGuru[];
  master_kelas: MasterKelas[];
  siswa_kelas: SiswaKelas[];
  log_absensi: LogAbsensi[];
  log_nilai: LogNilai[];
  ekstrakurikuler?: SiswaEkstrakurikuler[];
}

export interface ActiveUser {
  role: UserRole;
  id?: string;
  name: string;
  email?: string;
  id_tutor?: string;
}

export interface BatchInputRow {
  siswa: string;
  email_siswa: string;
  status_kehadiran: KehadiranStatus;
  nilai: number | '';
  jenis_penilaian: string;
  catatan: string;
  includeNilai: boolean;
}

export interface AIInsightResult {
  statusTrend: 'Naik' | 'Turun' | 'Stagnan' | 'Optimal';
  trendSummary: string;
  keyHighlights: string[];
  topAchievers: string[];
  needsAttention: string[];
  actionableRecommendations: string[];
}
