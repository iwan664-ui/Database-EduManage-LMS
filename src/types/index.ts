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
  materi_diajarkan?: string;
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
  materi_diajarkan?: string;
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
  materi_diajarkan: string;
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

// Assignment & Homework Hub (Tugas & Pengumpulan)
export interface TugasItem {
  id: string;
  judul: string;
  mapel: string;
  guru: string;
  kelas: string;
  tenggat: string; // YYYY-MM-DD
  waktu_tenggat: string; // HH:mm
  instruksi: string;
  bobot: number;
  kkm: number; // 85
  lampiran?: string;
}

export interface PengumpulanTugas {
  id: string;
  id_tugas: string;
  siswa: string;
  tanggal_kumpul: string;
  teks_jawaban: string;
  link_lampiran?: string;
  status: 'Menunggu Dinilai' | 'Sudah Dinilai';
  nilai?: number;
  catatan_guru?: string;
  dinilai_oleh?: string;
}

// Virtual Classroom & Live Halaqah
export interface VirtualSessionItem {
  id: string;
  judul: string;
  mapel: string;
  guru: string;
  tanggal: string;
  waktu: string;
  platform: 'Google Meet' | 'Zoom' | 'Live Streaming Halaqah';
  link_meet: string;
  status: 'Sedang Berlangsung' | 'Akan Datang' | 'Selesai';
  deskripsi: string;
  topik_bahasan: string[];
}

// Forum Q&A & Halaqah Ilmiah
export interface ForumReply {
  id: string;
  penulis: string;
  role: 'tutor' | 'siswa' | 'admin';
  tanggal: string;
  waktu: string;
  isi: string;
  isGuruVerified?: boolean;
}

export interface ForumDiscussionItem {
  id: string;
  penulis: string;
  role: 'tutor' | 'siswa' | 'admin';
  mapel: string;
  judul: string;
  pertanyaan: string;
  tanggal: string;
  likes: number;
  isSolved: boolean;
  replies: ForumReply[];
}

// Pengumuman & Bulletin Sekolah
export interface PengumumanItem {
  id: string;
  judul: string;
  isi: string;
  kategori: 'Penting' | 'Akademik' | 'Tahfidz' | 'Kegiatan' | 'Parenting';
  tanggal: string;
  target: 'Semua' | 'Santri & Walmur' | 'Guru & Tutor';
  penerbit: string;
  isPinned: boolean;
}

// Rapor Pekanan Guru ke Orang Tua
export type WeeklyReportChannel = 'Portal Walmur' | 'WhatsApp' | 'Email' | 'PDF';

export interface WeeklyReportSubjectDetail {
  mapel: string;
  nilaiTerbaru: number | null;
  rataRata: number | null;
  statusKkm: 'Tuntas' | 'Remedial' | 'Belum Dinilai';
  catatan: string;
}

export interface WeeklyReportItem {
  id: string;
  siswa: string;
  id_kelas: string;
  kelas: string;
  mapel: string;
  cabang: string;
  guru: string;
  periode_label: string; // e.g., "Pekan 2 · 02 - 08 Nov 2026"
  tanggal_mulai: string; // YYYY-MM-DD
  tanggal_selesai: string; // YYYY-MM-DD
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  persen_kehadiran: number;
  rata_nilai: number;
  status_kkm: 'Tuntas (≥ 85)' | 'Perlu Pendampingan (< 85)' | 'Belum Ada Nilai';
  predikat: 'Mumtaz (Sangat Baik)' | 'Jayyid Jiddan (Baik)' | 'Perlu Pembinaan';
  tahfidz_ringkasan: string;
  mutabaah_skor: number | null;
  detail_nilai: WeeklyReportSubjectDetail[];
  catatan_guru: string;
  rekomendasi_ortu: string;
  kontak_wa_ortu?: string;
  email_ortu?: string;
  channels: WeeklyReportChannel[];
  status_kirim: 'Terkirim' | 'Dibaca Orang Tua';
  dikirim_pada: string; // ISO string
  dibaca_pada?: string; // ISO string
}

// Presensi Gerbang & Kelas Real-Time (Jam Masuk & Jam Pulang)
export type GateScanInStatus = 'Tepat Waktu' | 'Terlambat' | 'Izin' | 'Sakit';
export type GateScanOutStatus = 'Sudah Pulang' | 'Pulang Awal' | 'Belum Pulang';

export interface GateAttendanceLog {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswa: string;
  cabang: string;
  kelas?: string;
  kode_kartu: string; // e.g. AW3-1234
  jam_masuk?: string; // HH:mm:ss
  jam_pulang?: string; // HH:mm:ss
  status_masuk?: GateScanInStatus;
  status_pulang: GateScanOutStatus;
  scan_oleh_masuk?: string;
  peran_scanner_masuk?: UserRole;
  scan_oleh_pulang?: string;
  peran_scanner_pulang?: UserRole;
  metode_scan: 'QR / Barcode Kartu' | 'Kamera Scanner' | 'Tap Cepat Petugas';
  lokasi_gerbang: string;
  catatan?: string;
  updated_at: string;
}

export interface GateScheduleConfig {
  batasJamMasuk: string; // HH:mm, e.g. "07:15"
  jamPulangStandar: string; // HH:mm, e.g. "15:00"
  lokasiDefault: string;
}

// Kurikulum & Kesiswaan: Riwayat Siswa Masuk / Keluar / Pindah Kelas
export type StudentMutationType = 'Masuk' | 'Keluar' | 'Pindah Kelas' | 'Aktif Kembali';

export interface StudentMutationRecord {
  id: string;
  siswa: string;
  email_siswa: string;
  cabang: string;
  jenis: StudentMutationType;
  tanggal: string; // YYYY-MM-DD
  kelas_terkait: string[];
  alasan: string;
  diproses_oleh: string;
  timestamp: string;
}

// Pengajuan Izin / Sakit Online dari Santri & Wali Murid
export interface StudentLeaveRequest {
  id: string;
  siswa: string;
  cabang: string;
  tanggal_mulai: string; // YYYY-MM-DD
  tanggal_selesai: string; // YYYY-MM-DD
  jenis: 'Izin' | 'Sakit';
  alasan: string;
  nama_wali: string;
  kontak_wali: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  ditanggapi_oleh?: string;
  catatan_guru?: string;
  created_at: string;
}

// Catatan Konseling & Pembinaan Guru / Wali Kelas
export interface TeacherCounselingNote {
  id: string;
  siswa: string;
  guru: string;
  tanggal: string; // YYYY-MM-DD
  kategori: 'Akademik (KKM 85)' | 'Kehadiran' | 'Adab & Karakter' | 'Apresiasi Prestasi';
  catatan: string;
  tindak_lanjut: string;
}

// Portofolio Prestasi & Penghargaan Santri
export interface StudentAchievementItem {
  id: string;
  siswa: string;
  judul: string;
  kategori: "Tahfidz & Al-Qur'an" | 'Sains & Akademik' | 'Olahraga & Seni' | 'Kepemimpinan & Adab';
  tingkat: 'Sekolah' | 'Kota/Kabupaten' | 'Provinsi' | 'Nasional' | 'Internasional';
  peringkat: string;
  tanggal: string; // YYYY-MM-DD
  penyelenggara: string;
  terverifikasi: boolean;
}

// Divisi Keuangan & Penagihan Siswa Aktif
export type StudentBillingCategory =
  | 'SPP Bulanan'
  | 'Uang Pangkal / Pengembangan'
  | 'Buku & Modul'
  | 'Kegiatan & Ekskul'
  | 'Munaqasyah Tahfidz'
  | 'Lainnya';

export type StudentInvoiceStatus =
  | 'Belum Bayar'
  | 'Sebagian'
  | 'Menunggu Verifikasi'
  | 'Lunas'
  | 'Jatuh Tempo';

export type PaymentMethodType =
  | 'Transfer Bank BSI'
  | 'Virtual Account'
  | 'QRIS Sekolah'
  | 'Tunai Loket';

export interface StudentPaymentHistoryItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
  metode: PaymentMethodType;
  referensi: string;
  dicatat_oleh: string;
}

export interface StudentPaymentConfirmation {
  metode: PaymentMethodType;
  tanggal_bayar: string;
  nominal_bayar: number;
  referensi: string;
  pengirim: string;
  catatan?: string;
}

export interface StudentInvoiceItem {
  id: string;
  siswa: string;
  cabang: string;
  kategori: StudentBillingCategory;
  periode: string; // e.g. "November 2026"
  judul: string;
  nominal: number;
  potongan: number;
  terbayar: number;
  jatuh_tempo: string; // YYYY-MM-DD
  status: StudentInvoiceStatus;
  catatan_keuangan?: string;
  bukti_konfirmasi?: StudentPaymentConfirmation;
  riwayat_bayar: StudentPaymentHistoryItem[];
  dibuat_pada: string;
  dibuat_oleh: string;
}

export type SchoolExpenseCategory =
  | 'Honor Guru & Staff'
  | 'Operasional & Utilitas'
  | 'Sarana & Prasarana'
  | 'Kegiatan Santri'
  | 'Lainnya';

export interface SchoolExpenseItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kategori: SchoolExpenseCategory;
  deskripsi: string;
  nominal: number;
  dicatat_oleh: string;
}

// Manajemen Inventaris Aset & Peminjaman Perangkat Sekolah
export type AssetCategory =
  | 'Laptop & Komputer'
  | 'Proyektor & Audio'
  | 'Tablet & Smartboard'
  | 'Perangkat Jaringan & CBT'
  | 'Alat Lab Sains'
  | 'Lainnya';

export type AssetCondition = 'Baik' | 'Perlu Perawatan' | 'Rusak Ringan' | 'Rusak Berat';

export type AssetLoanStatus = 'Tersedia' | 'Dipinjam' | 'Dalam Perawatan';

export type AssetBorrowerRole = 'Guru / Staff' | 'Santri' | 'Unit Kelas';

export interface AssetLoanHistoryItem {
  id: string;
  peminjam: string;
  peran_peminjam: AssetBorrowerRole;
  tanggal_pinjam: string;
  rencana_kembali: string;
  tanggal_kembali?: string;
  keperluan: string;
  kondisi_kembali?: AssetCondition;
  dicatat_oleh: string;
}

export interface SchoolAssetItem {
  id: string;
  kode_inventaris: string;
  nama_perangkat: string;
  kategori: AssetCategory;
  nomor_seri: string;
  lokasi_kampus: string;
  ruangan: string;
  kondisi: AssetCondition;
  status_peminjaman: AssetLoanStatus;
  peminjam_aktif?: string;
  peran_peminjam?: AssetBorrowerRole;
  tanggal_pinjam?: string;
  rencana_kembali?: string;
  keperluan_pinjam?: string;
  tanggal_perolehan: string;
  catatan?: string;
  riwayat_pinjam: AssetLoanHistoryItem[];
  synced_to_sheets?: boolean;
  updated_at: string;
}

// Rapor Tengah Semester (PTS) & Rapor Semester (PAS/PAT)
export type AcademicReportPeriodType = 'Tengah Semester' | 'Semester';
export type AcademicSemesterType = 'Ganjil' | 'Genap';

export interface AcademicTermSubjectScore {
  id_kelas: string;
  mapel: string;
  guru: string;
  nilai_harian: number;
  nilai_ujian: number;
  nilai_akhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  tuntas_kkm: boolean;
  capaian_kompetensi: string;
}

export interface AcademicTermReportItem {
  id: string;
  jenis_rapor: AcademicReportPeriodType;
  semester: AcademicSemesterType;
  tahun_ajaran: string;
  tanggal_rapor: string;
  siswa: string;
  kelas_utama: string;
  cabang: string;
  wali_kelas: string;
  bobot_harian_persen: number;
  bobot_ujian_persen: number;
  daftar_nilai: AcademicTermSubjectScore[];
  rata_rata_umum: number;
  persen_ketuntasan: number;
  sakit: number;
  izin: number;
  alfa: number;
  persen_kehadiran: number;
  tahfidz_capaian: string;
  adab_predikat: 'Sangat Baik' | 'Baik' | 'Cukup';
  ekskul_catatan: string;
  catatan_wali_kelas: string;
  keputusan_akademik: string;
  status_publikasi: 'Draf' | 'Diterbitkan ke Ortu' | 'Dibaca Orang Tua';
  diterbitkan_pada?: string;
  dibaca_pada?: string;
}

// Ringkasan Statistik Pembelajaran (Admin Dashboard Gemini AI Summary)
export type LearningStatsSummaryStatus = 'Optimal' | 'Perlu Pantauan' | 'Kritis';

export interface LearningStatsSummaryCard {
  title: string;
  metricHighlight: string;
  status: LearningStatsSummaryStatus;
  summary: string;
}

export interface LearningStatsSummaryResult {
  headline: string;
  executiveSummary: string;
  attendanceCard: LearningStatsSummaryCard;
  gradeCard: LearningStatsSummaryCard;
  correlationCard: {
    title: string;
    summary: string;
    actionItems: string[];
  };
  keyFindings: string[];
  generatedAt?: string;
}

// Direktori Alumni & Jejaring Sekolah (Terintegrasi Google Sheets)
export type AlumniContactStatus =
  | 'Aktif Terhubung'
  | 'Perlu Verifikasi'
  | 'Menunggu Respon'
  | 'Nomor Tidak Aktif';

export type AlumniCareerSector =
  | 'Mahasiswa / Studi Lanjut'
  | 'Teknologi & IT'
  | 'Kesehatan & Kedokteran'
  | 'Pendidikan & Dakwah'
  | 'Bisnis & Wirausaha'
  | 'Keuangan & Hukum'
  | 'Lainnya';

export type AlumniAdmissionPath =
  | 'SNBP'
  | 'SNBT / UTBK'
  | 'Seleksi Mandiri'
  | 'Beasiswa Internasional / Timur Tengah'
  | 'Kedinasan / Ikatan Dinas'
  | 'Beasiswa Prestasi / Tahfidz'
  | 'Lainnya';

export type AlumniUniversityCategory =
  | 'Perguruan Tinggi Negeri'
  | 'Perguruan Tinggi Swasta'
  | 'Perguruan Tinggi Malaysia'
  | 'Perguruan Tinggi Timur Tengah'
  | 'Perguruan Tinggi Luar Negeri Lainnya';

export interface AlumniRecord {
  id: string;
  nis_alumni: string;
  nama: string;
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
  terakhir_dihubungi?: string;
  bersedia_mentoring: boolean;
  catatan?: string;
  synced_to_sheets?: boolean;
  updated_at: string;
}



