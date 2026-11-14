import {
  MasterSiswa,
  PaymentMethodType,
  SchoolExpenseCategory,
  SchoolExpenseItem,
  StudentBillingCategory,
  StudentInvoiceItem,
  StudentInvoiceStatus,
  StudentPaymentConfirmation,
  StudentPaymentHistoryItem,
} from '../types';
import { SecurityService } from './securityService';

const STORAGE_KEY_INVOICES = 'alwildan_finance_invoices_v1';
const STORAGE_KEY_EXPENSES = 'alwildan_finance_expenses_v1';

const SEED_INVOICES: StudentInvoiceItem[] = [
  {
    id: 'INV-202611-001',
    siswa: 'Ahmad Rizky Pratama',
    cabang: 'Kampus Utama BSD City',
    kategori: 'SPP Bulanan',
    periode: 'November 2026',
    judul: 'SPP Bulanan November 2026',
    nominal: 1750000,
    potongan: 150000, // Beasiswa Prestasi Tahfidz
    terbayar: 1600000,
    jatuh_tempo: '2026-11-10',
    status: 'Lunas',
    catatan_keuangan: 'Potongan Beasiswa Prestasi Tahfidz Juz 29 sebesar Rp 150.000',
    riwayat_bayar: [
      {
        id: 'PAY-001',
        tanggal: '2026-11-05',
        jumlah: 1600000,
        metode: 'Transfer Bank BSI',
        referensi: 'BSI-20261105-8821',
        dicatat_oleh: 'Divisi Keuangan / Bendahara',
      },
    ],
    dibuat_pada: '2026-11-01T07:30:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202611-002',
    siswa: 'Bella Safitri',
    cabang: 'Kampus Utama BSD City',
    kategori: 'SPP Bulanan',
    periode: 'November 2026',
    judul: 'SPP Bulanan November 2026',
    nominal: 1750000,
    potongan: 0,
    terbayar: 0,
    jatuh_tempo: '2026-11-15',
    status: 'Menunggu Verifikasi',
    catatan_keuangan: 'Menunggu pencocokan mutasi rekening BSI oleh Bendahara',
    bukti_konfirmasi: {
      metode: 'Transfer Bank BSI',
      tanggal_bayar: '2026-11-12',
      nominal_bayar: 1750000,
      referensi: 'BSI-TRF-994120',
      pengirim: 'Bpk. Hendra Wijaya (Wali Bella)',
      catatan: 'Sudah transfer via BSI Mobile pukul 14:15 WIB',
    },
    riwayat_bayar: [],
    dibuat_pada: '2026-11-01T07:30:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202611-003',
    siswa: 'Dimas Aditya',
    cabang: 'Kampus Utama BSD City',
    kategori: 'SPP Bulanan',
    periode: 'November 2026',
    judul: 'SPP Bulanan November 2026',
    nominal: 1750000,
    potongan: 0,
    terbayar: 1000000,
    jatuh_tempo: '2026-11-10',
    status: 'Sebagian',
    catatan_keuangan: 'Pembayaran tahap 1 diterima, sisa Rp 750.000 dijadwalkan pekan ke-3',
    riwayat_bayar: [
      {
        id: 'PAY-002',
        tanggal: '2026-11-06',
        jumlah: 1000000,
        metode: 'Virtual Account',
        referensi: 'VA-ALW3-7741',
        dicatat_oleh: 'Divisi Keuangan / Bendahara',
      },
    ],
    dibuat_pada: '2026-11-01T07:30:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202610-004',
    siswa: 'Farhan Maulana',
    cabang: 'Kampus Utama BSD City',
    kategori: 'SPP Bulanan',
    periode: 'Oktober 2026',
    judul: 'SPP Bulanan Oktober 2026',
    nominal: 1750000,
    potongan: 0,
    terbayar: 0,
    jatuh_tempo: '2026-10-10',
    status: 'Jatuh Tempo',
    catatan_keuangan: 'Melewati batas jatuh tempo Oktober 2026 — mohon pengingat ke wali murid',
    riwayat_bayar: [],
    dibuat_pada: '2026-10-01T07:30:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202611-005',
    siswa: 'Putri Amelia',
    cabang: 'Kampus Tahfidz BSD City',
    kategori: 'Munaqasyah Tahfidz',
    periode: 'November 2026',
    judul: 'Biaya Munaqasyah & Wisuda Tasmi\' 3 Juz',
    nominal: 450000,
    potongan: 0,
    terbayar: 450000,
    jatuh_tempo: '2026-11-08',
    status: 'Lunas',
    riwayat_bayar: [
      {
        id: 'PAY-003',
        tanggal: '2026-11-04',
        jumlah: 450000,
        metode: 'QRIS Sekolah',
        referensi: 'QRIS-ALW-4410',
        dicatat_oleh: 'Divisi Keuangan / Bendahara',
      },
    ],
    dibuat_pada: '2026-11-01T08:00:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202611-006',
    siswa: 'Muhammad Alif',
    cabang: 'Kampus Tahfidz BSD City',
    kategori: 'Buku & Modul',
    periode: 'Semester Ganjil 2026/2027',
    judul: 'Paket Kitab Tahfidz & Modul Pembelajaran Terpadu',
    nominal: 650000,
    potongan: 0,
    terbayar: 0,
    jatuh_tempo: '2026-11-20',
    status: 'Belum Bayar',
    riwayat_bayar: [],
    dibuat_pada: '2026-11-02T09:00:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202610-007',
    siswa: 'Gilang Ramadhan',
    cabang: 'Kampus Sains BSD City',
    kategori: 'SPP Bulanan',
    periode: 'Oktober 2026',
    judul: 'SPP Bulanan Oktober 2026',
    nominal: 1750000,
    potongan: 0,
    terbayar: 1750000,
    jatuh_tempo: '2026-10-10',
    status: 'Lunas',
    riwayat_bayar: [
      {
        id: 'PAY-004',
        tanggal: '2026-10-08',
        jumlah: 1750000,
        metode: 'Transfer Bank BSI',
        referensi: 'BSI-20261008-1120',
        dicatat_oleh: 'Divisi Keuangan / Bendahara',
      },
    ],
    dibuat_pada: '2026-10-01T07:30:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202610-008',
    siswa: 'Hana Clarissa',
    cabang: 'Kampus Sains BSD City',
    kategori: 'SPP Bulanan',
    periode: 'Oktober 2026',
    judul: 'SPP Bulanan Oktober 2026',
    nominal: 1750000,
    potongan: 100000,
    terbayar: 1650000,
    jatuh_tempo: '2026-10-10',
    status: 'Lunas',
    riwayat_bayar: [
      {
        id: 'PAY-005',
        tanggal: '2026-10-09',
        jumlah: 1650000,
        metode: 'Virtual Account',
        referensi: 'VA-ALW3-5521',
        dicatat_oleh: 'Divisi Keuangan / Bendahara',
      },
    ],
    dibuat_pada: '2026-10-01T07:30:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202609-009',
    siswa: 'Eka Nurul Fadilah',
    cabang: 'Kampus Utama BSD City',
    kategori: 'SPP Bulanan',
    periode: 'September 2026',
    judul: 'SPP Bulanan September 2026',
    nominal: 1750000,
    potongan: 0,
    terbayar: 1750000,
    jatuh_tempo: '2026-09-10',
    status: 'Lunas',
    riwayat_bayar: [
      {
        id: 'PAY-006',
        tanggal: '2026-09-07',
        jumlah: 1750000,
        metode: 'Transfer Bank BSI',
        referensi: 'BSI-20260907-3319',
        dicatat_oleh: 'Divisi Keuangan / Bendahara',
      },
    ],
    dibuat_pada: '2026-09-01T07:30:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'INV-202609-010',
    siswa: 'Nadya Putri',
    cabang: 'Kampus Tahfidz BSD City',
    kategori: 'SPP Bulanan',
    periode: 'September 2026',
    judul: 'SPP Bulanan September 2026',
    nominal: 1750000,
    potongan: 0,
    terbayar: 1750000,
    jatuh_tempo: '2026-09-10',
    status: 'Lunas',
    riwayat_bayar: [
      {
        id: 'PAY-007',
        tanggal: '2026-09-09',
        jumlah: 1750000,
        metode: 'QRIS Sekolah',
        referensi: 'QRIS-ALW-2091',
        dicatat_oleh: 'Divisi Keuangan / Bendahara',
      },
    ],
    dibuat_pada: '2026-09-01T07:30:00Z',
    dibuat_oleh: 'Divisi Keuangan / Bendahara',
  },
];

const SEED_EXPENSES: SchoolExpenseItem[] = [
  {
    id: 'EXP-202609-001',
    tanggal: '2026-09-25',
    kategori: 'Operasional & Utilitas',
    deskripsi: 'Listrik, Air, & Pemeliharaan Gedung Kampus BSD City',
    nominal: 1450000,
    dicatat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'EXP-202609-002',
    tanggal: '2026-09-28',
    kategori: 'Sarana & Prasarana',
    deskripsi: 'Pengadaan Modul Cetak & Alat Peraga Lab Sains',
    nominal: 950000,
    dicatat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'EXP-202610-001',
    tanggal: '2026-10-20',
    kategori: 'Operasional & Utilitas',
    deskripsi: 'Operasional Listrik, Internet Fiber LMS & Kebersihan',
    nominal: 1550000,
    dicatat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'EXP-202610-002',
    tanggal: '2026-10-26',
    kategori: 'Kegiatan Santri',
    deskripsi: 'Pembinaan Ekskul Memanah, Robotik & Konsumsi Santri',
    nominal: 820000,
    dicatat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'EXP-202611-001',
    tanggal: '2026-11-10',
    kategori: 'Operasional & Utilitas',
    deskripsi: 'Operasional Utilitas Gedung & Keamanan Kampus BSD',
    nominal: 1520000,
    dicatat_oleh: 'Divisi Keuangan / Bendahara',
  },
  {
    id: 'EXP-202611-002',
    tanggal: '2026-11-12',
    kategori: 'Kegiatan Santri',
    deskripsi: 'Penyelenggaraan Munaqasyah & Tasmi\' Al-Qur\'an',
    nominal: 680000,
    dicatat_oleh: 'Divisi Keuangan / Bendahara',
  },
];

export class FinanceService {
  static formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  static computeNetAmount(inv: StudentInvoiceItem): number {
    return Math.max(0, Number(inv.nominal || 0) - Number(inv.potongan || 0));
  }

  static computeRemaining(inv: StudentInvoiceItem): number {
    return Math.max(0, this.computeNetAmount(inv) - Number(inv.terbayar || 0));
  }

  private static computeStatus(
    inv: Pick<StudentInvoiceItem, 'nominal' | 'potongan' | 'terbayar' | 'jatuh_tempo' | 'bukti_konfirmasi'>,
    todayStr?: string
  ): StudentInvoiceStatus {
    const net = Math.max(0, Number(inv.nominal || 0) - Number(inv.potongan || 0));
    const paid = Number(inv.terbayar || 0);
    if (paid >= net && net > 0) return 'Lunas';
    if (net === 0 && paid >= 0) return 'Lunas';
    if (inv.bukti_konfirmasi) return 'Menunggu Verifikasi';
    if (paid > 0) return 'Sebagian';
    const refToday = todayStr || new Date().toISOString().split('T')[0];
    if (inv.jatuh_tempo && inv.jatuh_tempo < refToday) return 'Jatuh Tempo';
    return 'Belum Bayar';
  }

  static getAllInvoices(): StudentInvoiceItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
      const todayStr = new Date().toISOString().split('T')[0];
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(SEED_INVOICES));
        return SEED_INVOICES;
      }
      const parsed: StudentInvoiceItem[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return SEED_INVOICES;
      // Re-evaluate overdue status dynamically based on current date
      return parsed.map((inv) => ({
        ...inv,
        status: this.computeStatus(inv, todayStr),
      }));
    } catch {
      return SEED_INVOICES;
    }
  }

  private static saveAllInvoices(list: StudentInvoiceItem[]): void {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(list));
  }

  static createInvoice(input: {
    siswa: string;
    cabang: string;
    kategori: StudentBillingCategory;
    periode: string;
    judul: string;
    nominal: number;
    potongan?: number;
    jatuh_tempo: string;
    catatan_keuangan?: string;
    dibuat_oleh: string;
  }): { success: boolean; message: string; invoice?: StudentInvoiceItem } {
    const nominal = Math.max(0, Math.round(Number(input.nominal) || 0));
    const potongan = Math.max(0, Math.min(nominal, Math.round(Number(input.potongan) || 0)));
    if (!input.siswa || !input.judul.trim() || nominal <= 0) {
      return { success: false, message: 'Nama siswa, judul tagihan, dan nominal (> 0) wajib diisi.' };
    }

    const existing = this.getAllInvoices();
    const newItem: StudentInvoiceItem = {
      id: `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(existing.length + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
      siswa: input.siswa,
      cabang: input.cabang,
      kategori: input.kategori,
      periode: SecurityService.sanitizeText(input.periode, 60),
      judul: SecurityService.sanitizeText(input.judul, 120),
      nominal,
      potongan,
      terbayar: 0,
      jatuh_tempo: input.jatuh_tempo,
      status: 'Belum Bayar',
      catatan_keuangan: input.catatan_keuangan
        ? SecurityService.sanitizeText(input.catatan_keuangan, 220)
        : undefined,
      riwayat_bayar: [],
      dibuat_pada: new Date().toISOString(),
      dibuat_oleh: input.dibuat_oleh,
    };
    newItem.status = this.computeStatus(newItem);

    this.saveAllInvoices([newItem, ...existing]);
    return {
      success: true,
      message: `Tagihan "${newItem.judul}" untuk ${newItem.siswa} sebesar ${this.formatRupiah(
        nominal - potongan
      )} berhasil dibuat.`,
      invoice: newItem,
    };
  }

  /**
   * Generate Tagihan Massal hanya ke Siswa Aktif (mencegah duplikasi periode + kategori)
   */
  static generateMassInvoices(input: {
    targetStudents: MasterSiswa[];
    kategori: StudentBillingCategory;
    periode: string;
    judul: string;
    nominal: number;
    potongan?: number;
    jatuh_tempo: string;
    catatan_keuangan?: string;
    dibuat_oleh: string;
  }): { success: boolean; createdCount: number; skippedCount: number; message: string } {
    const nominal = Math.max(0, Math.round(Number(input.nominal) || 0));
    const potongan = Math.max(0, Math.min(nominal, Math.round(Number(input.potongan) || 0)));
    if (input.targetStudents.length === 0) {
      return { success: false, createdCount: 0, skippedCount: 0, message: 'Tidak ada siswa aktif pada target yang dipilih.' };
    }
    if (!input.judul.trim() || !input.periode.trim() || nominal <= 0) {
      return { success: false, createdCount: 0, skippedCount: 0, message: 'Judul, periode, dan nominal (> 0) wajib diisi.' };
    }

    const existing = this.getAllInvoices();
    const created: StudentInvoiceItem[] = [];
    let skippedCount = 0;

    input.targetStudents.forEach((student, idx) => {
      const alreadyBilled = existing.some(
        (inv) =>
          inv.siswa.toLowerCase().trim() === student.siswa.toLowerCase().trim() &&
          inv.kategori === input.kategori &&
          inv.periode.toLowerCase().trim() === input.periode.toLowerCase().trim()
      );
      if (alreadyBilled) {
        skippedCount += 1;
        return;
      }

      const item: StudentInvoiceItem = {
        id: `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Date.now().toString().slice(-4)}${String(idx + 1).padStart(2, '0')}`,
        siswa: student.siswa,
        cabang: student.cabang,
        kategori: input.kategori,
        periode: SecurityService.sanitizeText(input.periode, 60),
        judul: SecurityService.sanitizeText(input.judul, 120),
        nominal,
        potongan,
        terbayar: 0,
        jatuh_tempo: input.jatuh_tempo,
        status: 'Belum Bayar',
        catatan_keuangan: input.catatan_keuangan
          ? SecurityService.sanitizeText(input.catatan_keuangan, 220)
          : undefined,
        riwayat_bayar: [],
        dibuat_pada: new Date().toISOString(),
        dibuat_oleh: input.dibuat_oleh,
      };
      item.status = this.computeStatus(item);
      created.push(item);
    });

    if (created.length > 0) {
      this.saveAllInvoices([...created, ...existing]);
    }

    return {
      success: true,
      createdCount: created.length,
      skippedCount,
      message:
        created.length > 0
          ? `${created.length} tagihan siswa aktif berhasil diterbitkan${skippedCount > 0 ? ` (${skippedCount} siswa dilewati karena sudah tertagih pada periode ini)` : ''}.`
          : `Semua siswa target (${skippedCount}) sudah memiliki tagihan ${input.kategori} untuk periode ${input.periode}.`,
    };
  }

  /**
   * Catat Pembayaran (Pelunasan atau Cicilan) oleh Divisi Keuangan
   */
  static recordPayment(input: {
    invoiceId: string;
    jumlah: number;
    tanggal: string;
    metode: PaymentMethodType;
    referensi: string;
    dicatat_oleh: string;
    catatan?: string;
  }): { success: boolean; message: string; updated?: StudentInvoiceItem } {
    const amount = Math.round(Number(input.jumlah) || 0);
    if (amount <= 0) {
      return { success: false, message: 'Nominal pembayaran harus lebih dari Rp 0.' };
    }

    const list = this.getAllInvoices();
    const target = list.find((inv) => inv.id === input.invoiceId);
    if (!target) {
      return { success: false, message: 'Tagihan tidak ditemukan.' };
    }

    const remaining = this.computeRemaining(target);
    const effectivePaid = Math.min(amount, remaining > 0 ? remaining : amount);

    const paymentEntry: StudentPaymentHistoryItem = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      tanggal: input.tanggal || new Date().toISOString().split('T')[0],
      jumlah: effectivePaid,
      metode: input.metode,
      referensi:
        SecurityService.sanitizeText(input.referensi, 60) ||
        `REF-${Date.now().toString().slice(-6)}`,
      dicatat_oleh: input.dicatat_oleh,
    };

    const updatedItem: StudentInvoiceItem = {
      ...target,
      terbayar: target.terbayar + effectivePaid,
      bukti_konfirmasi: undefined, // cleared once verified/recorded
      catatan_keuangan: input.catatan
        ? SecurityService.sanitizeText(input.catatan, 220)
        : target.catatan_keuangan,
      riwayat_bayar: [...target.riwayat_bayar, paymentEntry],
    };
    updatedItem.status = this.computeStatus(updatedItem);

    this.saveAllInvoices(list.map((inv) => (inv.id === target.id ? updatedItem : inv)));

    return {
      success: true,
      message: `Pembayaran ${this.formatRupiah(effectivePaid)} untuk ${target.siswa} berhasil dicatat (Status: ${updatedItem.status}).`,
      updated: updatedItem,
    };
  }

  /**
   * Ajukan Konfirmasi Pembayaran oleh Santri / Wali Murid
   */
  static submitParentConfirmation(
    invoiceId: string,
    confirmation: StudentPaymentConfirmation
  ): { success: boolean; message: string } {
    if (!confirmation.referensi.trim() || !confirmation.pengirim.trim() || confirmation.nominal_bayar <= 0) {
      return {
        success: false,
        message: 'Nama pengirim, nominal transfer, dan nomor referensi bukti wajib diisi.',
      };
    }

    const list = this.getAllInvoices();
    const target = list.find((inv) => inv.id === invoiceId);
    if (!target) {
      return { success: false, message: 'Tagihan tidak ditemukan.' };
    }

    const updatedItem: StudentInvoiceItem = {
      ...target,
      bukti_konfirmasi: {
        ...confirmation,
        referensi: SecurityService.sanitizeText(confirmation.referensi, 60),
        pengirim: SecurityService.sanitizeText(confirmation.pengirim, 80),
        catatan: confirmation.catatan ? SecurityService.sanitizeText(confirmation.catatan, 200) : undefined,
      },
      status: 'Menunggu Verifikasi',
    };

    this.saveAllInvoices(list.map((inv) => (inv.id === invoiceId ? updatedItem : inv)));
    return {
      success: true,
      message: `Konfirmasi pembayaran sebesar ${this.formatRupiah(
        confirmation.nominal_bayar
      )} telah dikirim ke Divisi Keuangan.`,
    };
  }

  /**
   * Tolak Bukti Konfirmasi (kembalikan ke status sebelumnya agar wali murid bisa kirim ulang)
   */
  static rejectParentConfirmation(invoiceId: string, reason: string): { success: boolean; message: string } {
    const list = this.getAllInvoices();
    const target = list.find((inv) => inv.id === invoiceId);
    if (!target) return { success: false, message: 'Tagihan tidak ditemukan.' };

    const updatedItem: StudentInvoiceItem = {
      ...target,
      bukti_konfirmasi: undefined,
      catatan_keuangan: reason
        ? `Konfirmasi ditolak: ${SecurityService.sanitizeText(reason, 180)}`
        : 'Bukti transfer belum ditemukan di mutasi rekening sekolah.',
    };
    updatedItem.status = this.computeStatus(updatedItem);

    this.saveAllInvoices(list.map((inv) => (inv.id === invoiceId ? updatedItem : inv)));
    return { success: true, message: `Konfirmasi untuk ${target.siswa} dikembalikan.` };
  }

  static deleteInvoice(invoiceId: string): { success: boolean; message: string } {
    const list = this.getAllInvoices();
    const target = list.find((inv) => inv.id === invoiceId);
    if (!target) return { success: false, message: 'Tagihan tidak ditemukan.' };
    if (target.terbayar > 0) {
      return {
        success: false,
        message: 'Tagihan yang sudah memiliki pembayaran masuk tidak dapat dihapus demi audit keuangan.',
      };
    }
    this.saveAllInvoices(list.filter((inv) => inv.id !== invoiceId));
    return { success: true, message: `Tagihan ${target.id} (${target.siswa}) berhasil dihapus.` };
  }

  static buildWhatsAppBillingMessage(inv: StudentInvoiceItem): string {
    const net = this.computeNetAmount(inv);
    const remaining = this.computeRemaining(inv);
    return [
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,`,
      `Yth. Bapak/Ibu Wali Santri *${inv.siswa}*`,
      ``,
      `Berikut informasi tagihan pendidikan dari *Divisi Keuangan AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY*:`,
      `- No. Tagihan : ${inv.id}`,
      `- Keterangan  : ${inv.judul} (${inv.periode})`,
      `- Total Tagihan: ${this.formatRupiah(net)}`,
      `- Sudah Dibayar: ${this.formatRupiah(inv.terbayar)}`,
      `- *Sisa Tagihan : ${this.formatRupiah(remaining)}*`,
      `- Jatuh Tempo : ${inv.jatuh_tempo}`,
      `- Status      : ${inv.status}`,
      ``,
      `Pembayaran dapat dilakukan melalui Transfer Bank Syariah Indonesia (BSI) / Virtual Account / QRIS Sekolah, kemudian melakukan konfirmasi melalui Portal Santri.`,
      `Jazakumullahu khairan katsiran.`,
    ].join('\n');
  }

  static getAllExpenses(): SchoolExpenseItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(SEED_EXPENSES));
        return SEED_EXPENSES;
      }
      const parsed: SchoolExpenseItem[] = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED_EXPENSES;
    } catch {
      return SEED_EXPENSES;
    }
  }

  static addExpense(input: {
    tanggal: string;
    kategori: SchoolExpenseCategory;
    deskripsi: string;
    nominal: number;
    dicatat_oleh: string;
  }): { success: boolean; message: string; expense?: SchoolExpenseItem } {
    const nominal = Math.max(0, Math.round(Number(input.nominal) || 0));
    if (!input.deskripsi.trim() || nominal <= 0 || !input.tanggal) {
      return {
        success: false,
        message: 'Tanggal, deskripsi, dan nominal pengeluaran (> 0) wajib diisi.',
      };
    }

    const existing = this.getAllExpenses();
    const newItem: SchoolExpenseItem = {
      id: `EXP-${input.tanggal.slice(0, 7).replace('-', '')}-${Date.now().toString().slice(-4)}`,
      tanggal: input.tanggal,
      kategori: input.kategori,
      deskripsi: SecurityService.sanitizeText(input.deskripsi, 140),
      nominal,
      dicatat_oleh: input.dicatat_oleh,
    };

    const updated = [newItem, ...existing];
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(updated));
    return {
      success: true,
      message: `Pengeluaran "${newItem.deskripsi}" sebesar ${this.formatRupiah(nominal)} berhasil dicatat.`,
      expense: newItem,
    };
  }

  static deleteExpense(id: string): { success: boolean; message: string } {
    const existing = this.getAllExpenses();
    const target = existing.find((e) => e.id === id);
    if (!target) {
      return { success: false, message: 'Catatan pengeluaran tidak ditemukan.' };
    }
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(updated));
    return {
      success: true,
      message: `Pengeluaran "${target.deskripsi}" berhasil dihapus.`,
    };
  }
}

