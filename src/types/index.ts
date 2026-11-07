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

export interface MutabaahYaumiyahItem {
  id: string;
  siswa: string;
  tanggal: string; // YYYY-MM-DD
  shalat_wajib: {
    subuh: boolean;
    dzuhur: boolean;
    ashar: boolean;
    maghrib: boolean;
    isya: boolean;
  };
  shalat_sunnah: {
    dhuha: boolean;
    tahajjud: boolean;
    rawatib: boolean;
  };
  tilawah_quran: {
    juz: number;
    halaman_atau_surat: string;
    status: 'Selesai' | 'Sebagian' | 'Belum';
  };
  dzikir: {
    pagi: boolean;
    petang: boolean;
  };
  puasa_sunnah: boolean;
  adab_harian: {
    birrul_walidain: boolean;
    menjaga_lisan: boolean;
  };
  catatan: string;
  skor_ibadah: number; // 0 - 100
  verified_by_guru: boolean;
}

export interface TahfidzSetoranItem {
  id: string;
  siswa: string;
  tanggal: string; // YYYY-MM-DD
  surat: string;
  ayat_mulai: number;
  ayat_selesai: number;
  juz: number;
  kategori: 'Ziyadah (Hafalan Baru)' | 'Muraja\'ah (Pengulangan)' | 'Ujian Mutqin';
  kelancaran: 'Mutqin (Sangat Lancar)' | 'Lancar (1-2 kali perbaikan)' | 'Perlu Diulang';
  tajwid_makhraj: 'A (Istimewa)' | 'B+ (Sangat Baik)' | 'B (Baik)';
  nilai: number; // e.g. 95 (KKM 85)
  pembimbing: string;
  catatan: string;
}

export interface DatabaseState {
  master_siswa: MasterSiswa[];
  master_guru: MasterGuru[];
  master_kelas: MasterKelas[];
  siswa_kelas: SiswaKelas[];
  log_absensi: LogAbsensi[];
  log_nilai: LogNilai[];
  ekstrakurikuler?: SiswaEkstrakurikuler[];
  mutabaah_yaumiyah?: MutabaahYaumiyahItem[];
  tahfidz_setoran?: TahfidzSetoranItem[];
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

// CBT (Computer-Based Test) Types
export interface CbtQuestion {
  id: number;
  pertanyaan: string;
  pilihan: string[];
  kunci: number; // Index 0-3
  pembahasan: string;
}

export interface CbtExamPackage {
  id: string;
  judul: string;
  mapel: string;
  kelas: string;
  kkm: number; // 85
  durasiMenit: number;
  totalSoal: number;
  instruksi: string;
  questions: CbtQuestion[];
}

export interface CbtExamResult {
  id: string;
  examId: string;
  judul: string;
  siswa: string;
  skor: number; // 0 - 100
  benar: number;
  salah: number;
  statusKkm: 'TUNTAS (MUMTAZ)' | 'REMEDIAL';
  tanggal: string;
  jawabanUser: Record<number, number>;
}

// Digital Maktabah & E-Learning Types
export interface HaditsArbainItem {
  nomor: number;
  judul: string;
  perawi: string;
  teksArab: string;
  terjemahan: string;
  faedah: string[];
}

export interface MurottalItem {
  nomorSurah: number;
  namaSurah: string;
  asmaArab: string;
  arti: string;
  jumlahAyat: number;
  tempatTurun: 'Makkiyah' | 'Madaniyah';
  audioUrl: string;
}

export interface EModulItem {
  id: string;
  judul: string;
  mapel: string;
  kategori: 'Islamic & Tahfidz' | 'Cambridge Science' | 'Matematika' | 'Bahasa Arab & Inggris';
  tingkat: string;
  halaman: number;
  penulis: string;
  deskripsi: string;
}

// Adab & Karakter Santri
export interface StudentAdabRecord {
  id: string;
  siswa: string;
  tanggal: string;
  kategori: 'Akhlak & Adab' | 'Kedisiplinan' | 'Ibadah Berjamaah' | 'Tahfidz & Bahasa';
  tipe: 'Poin Kebaikan (+)' | 'Catatan Disiplin (-)';
  poin: number;
  deskripsi: string;
  pencatat: string;
}
