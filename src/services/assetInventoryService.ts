import {
  AssetBorrowerRole,
  AssetCategory,
  AssetCondition,
  AssetLoanHistoryItem,
  AssetLoanStatus,
  SchoolAssetItem,
} from '../types';
import { SecurityService } from './securityService';
import { SheetsService } from './sheetsService';

const STORAGE_KEY_ASSETS = 'alwildan_asset_inventory_v1';

const SEED_ASSETS: SchoolAssetItem[] = [
  {
    id: 'AST-001',
    kode_inventaris: 'INV-AW3-CBT-001',
    nama_perangkat: 'Laptop Ujian CBT Lenovo ThinkPad E14 Gen 5',
    kategori: 'Laptop & Komputer',
    nomor_seri: 'SN-LNV-882104A',
    lokasi_kampus: 'Kampus Utama BSD City',
    ruangan: 'Lab Komputer CBT 1',
    kondisi: 'Baik',
    status_peminjaman: 'Tersedia',
    tanggal_perolehan: '2025-07-15',
    catatan: 'Unit utama workstation ujian CBT siswa SMA',
    riwayat_pinjam: [
      {
        id: 'LOAN-001',
        peminjam: 'Rian Pratama, S.Kom.',
        peran_peminjam: 'Guru / Staff',
        tanggal_pinjam: '2026-10-18',
        rencana_kembali: '2026-10-20',
        tanggal_kembali: '2026-10-20',
        keperluan: 'Simulasi Try Out UTBK Informatika',
        kondisi_kembali: 'Baik',
        dicatat_oleh: 'Super Admin Akademik',
      },
    ],
    synced_to_sheets: false,
    updated_at: '2026-11-01T08:00:00Z',
  },
  {
    id: 'AST-002',
    kode_inventaris: 'INV-AW3-PRJ-004',
    nama_perangkat: 'Proyektor Epson EB-X500 XGA 3600 Lumens',
    kategori: 'Proyektor & Audio',
    nomor_seri: 'SN-EPS-441920X',
    lokasi_kampus: 'Kampus Utama BSD City',
    ruangan: '10 SMA Unggulan A',
    kondisi: 'Baik',
    status_peminjaman: 'Dipinjam',
    peminjam_aktif: 'Budi Santoso, S.Pd.',
    peran_peminjam: 'Guru / Staff',
    tanggal_pinjam: '2026-11-10',
    rencana_kembali: '2026-11-17',
    keperluan_pinjam: 'Presentasi visual Fisika & Matematika Wajib pekanan',
    tanggal_perolehan: '2025-01-10',
    catatan: 'Dilengkapi kabel HDMI 5m dan remote control',
    riwayat_pinjam: [
      {
        id: 'LOAN-002',
        peminjam: 'Budi Santoso, S.Pd.',
        peran_peminjam: 'Guru / Staff',
        tanggal_pinjam: '2026-11-10',
        rencana_kembali: '2026-11-17',
        keperluan: 'Presentasi visual Fisika & Matematika Wajib pekanan',
        dicatat_oleh: 'Super Admin Akademik',
      },
    ],
    synced_to_sheets: false,
    updated_at: '2026-11-10T07:30:00Z',
  },
  {
    id: 'AST-003',
    kode_inventaris: 'INV-AW3-TAB-012',
    nama_perangkat: 'Apple iPad 10th Gen 64GB (Setoran Tahfidz & Murojaah)',
    kategori: 'Tablet & Smartboard',
    nomor_seri: 'SN-APL-903411K',
    lokasi_kampus: 'Kampus Tahfidz BSD City',
    ruangan: 'Aula Halaqah Tahfidz',
    kondisi: 'Baik',
    status_peminjaman: 'Dipinjam',
    peminjam_aktif: 'Dewi Lestari, S.Pd.',
    peran_peminjam: 'Guru / Staff',
    tanggal_pinjam: '2026-11-11',
    rencana_kembali: '2026-11-18',
    keperluan_pinjam: 'Penilaian Munaqasyah & rekaman Tasmi\' santri',
    tanggal_perolehan: '2025-08-05',
    catatan: 'Terpasang casing pelindung & aplikasi Mushaf digital',
    riwayat_pinjam: [
      {
        id: 'LOAN-003',
        peminjam: 'Dewi Lestari, S.Pd.',
        peran_peminjam: 'Guru / Staff',
        tanggal_pinjam: '2026-11-11',
        rencana_kembali: '2026-11-18',
        keperluan: 'Penilaian Munaqasyah & rekaman Tasmi\' santri',
        dicatat_oleh: 'Super Admin Akademik',
      },
    ],
    synced_to_sheets: false,
    updated_at: '2026-11-11T08:15:00Z',
  },
  {
    id: 'AST-004',
    kode_inventaris: 'INV-AW3-NET-002',
    nama_perangkat: 'MikroTik Cloud Core Router CCR2004 (Server CBT)',
    kategori: 'Perangkat Jaringan & CBT',
    nomor_seri: 'SN-MKT-771205R',
    lokasi_kampus: 'Kampus Sains BSD City',
    ruangan: 'Ruang Server & IT',
    kondisi: 'Perlu Perawatan',
    status_peminjaman: 'Dalam Perawatan',
    tanggal_perolehan: '2024-11-20',
    catatan: 'Kipas pendingin perlu pembersihan berkala & update firmware RouterOS',
    riwayat_pinjam: [],
    synced_to_sheets: false,
    updated_at: '2026-11-12T10:00:00Z',
  },
  {
    id: 'AST-005',
    kode_inventaris: 'INV-AW3-LAB-009',
    nama_perangkat: 'Mikroskop Binokuler Olympus CX23',
    kategori: 'Alat Lab Sains',
    nomor_seri: 'SN-OLY-552819B',
    lokasi_kampus: 'Kampus Tahfidz BSD City',
    ruangan: 'Laboratorium Biologi & Sains',
    kondisi: 'Baik',
    status_peminjaman: 'Tersedia',
    tanggal_perolehan: '2025-03-12',
    catatan: 'Lensa objektif lengkap 4x, 10x, 40x, 100x',
    riwayat_pinjam: [
      {
        id: 'LOAN-004',
        peminjam: 'Ahmad Fauzi, M.Pd.',
        peran_peminjam: 'Guru / Staff',
        tanggal_pinjam: '2026-10-25',
        rencana_kembali: '2026-10-25',
        tanggal_kembali: '2026-10-25',
        keperluan: 'Praktikum Jaringan Tumbuhan Kelas 11 SMA',
        kondisi_kembali: 'Baik',
        dicatat_oleh: 'Super Admin Akademik',
      },
    ],
    synced_to_sheets: false,
    updated_at: '2026-10-25T14:30:00Z',
  },
  {
    id: 'AST-006',
    kode_inventaris: 'INV-AW3-AUD-007',
    nama_perangkat: 'Set Mic Wireless Shure BLX288 Dual Channel',
    kategori: 'Proyektor & Audio',
    nomor_seri: 'SN-SHR-310944M',
    lokasi_kampus: 'Kampus Sains BSD City',
    ruangan: 'Ruang Auditorium & Rapat',
    kondisi: 'Rusak Ringan',
    status_peminjaman: 'Tersedia',
    tanggal_perolehan: '2024-09-01',
    catatan: 'Tutup baterai mic B agak longgar, suara tetap jernih',
    riwayat_pinjam: [],
    synced_to_sheets: false,
    updated_at: '2026-11-08T11:20:00Z',
  },
];

export class AssetInventoryService {
  static getAllAssets(): SchoolAssetItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(SEED_ASSETS));
        return SEED_ASSETS;
      }
      const parsed: SchoolAssetItem[] = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED_ASSETS;
    } catch {
      return SEED_ASSETS;
    }
  }

  private static saveAllAssets(list: SchoolAssetItem[]): void {
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(list));
  }

  static createAsset(input: {
    nama_perangkat: string;
    kategori: AssetCategory;
    nomor_seri: string;
    kode_inventaris?: string;
    lokasi_kampus: string;
    ruangan: string;
    kondisi: AssetCondition;
    tanggal_perolehan: string;
    catatan?: string;
  }): { success: boolean; message: string; asset?: SchoolAssetItem } {
    const cleanName = SecurityService.sanitizeText(input.nama_perangkat, 140);
    const cleanSerial = SecurityService.sanitizeText(input.nomor_seri, 80).toUpperCase();
    const cleanRoom = SecurityService.sanitizeText(input.ruangan, 80);

    if (!cleanName || !cleanSerial || !cleanRoom) {
      return {
        success: false,
        message: 'Nama perangkat, nomor seri (SN), dan ruangan wajib diisi.',
      };
    }

    const existing = this.getAllAssets();
    const duplicateSerial = existing.some(
      (a) => a.nomor_seri.toLowerCase().trim() === cleanSerial.toLowerCase()
    );
    if (duplicateSerial) {
      return {
        success: false,
        message: `Nomor seri "${cleanSerial}" sudah terdaftar pada inventaris sekolah.`,
      };
    }

    const nextNumber = String(existing.length + 1).padStart(3, '0');
    const cleanCode =
      SecurityService.sanitizeText(input.kode_inventaris || '', 50).toUpperCase() ||
      `INV-AW3-${Date.now().toString().slice(-4)}-${nextNumber}`;

    const newItem: SchoolAssetItem = {
      id: `AST-${Date.now().toString().slice(-5)}-${nextNumber}`,
      kode_inventaris: cleanCode,
      nama_perangkat: cleanName,
      kategori: input.kategori,
      nomor_seri: cleanSerial,
      lokasi_kampus: input.lokasi_kampus,
      ruangan: cleanRoom,
      kondisi: input.kondisi,
      status_peminjaman: input.kondisi === 'Rusak Berat' ? 'Dalam Perawatan' : 'Tersedia',
      tanggal_perolehan: input.tanggal_perolehan || new Date().toISOString().split('T')[0],
      catatan: input.catatan ? SecurityService.sanitizeText(input.catatan, 240) : undefined,
      riwayat_pinjam: [],
      synced_to_sheets: false,
      updated_at: new Date().toISOString(),
    };

    const updated = [newItem, ...existing];
    this.saveAllAssets(updated);
    return {
      success: true,
      message: `Perangkat "${newItem.nama_perangkat}" (${newItem.nomor_seri}) berhasil ditambahkan.`,
      asset: newItem,
    };
  }

  static updateAssetDetails(
    assetId: string,
    updates: {
      kondisi: AssetCondition;
      status_peminjaman: AssetLoanStatus;
      lokasi_kampus: string;
      ruangan: string;
      catatan?: string;
    }
  ): { success: boolean; message: string } {
    const existing = this.getAllAssets();
    const target = existing.find((a) => a.id === assetId);
    if (!target) {
      return { success: false, message: 'Aset tidak ditemukan.' };
    }

    const updatedItem: SchoolAssetItem = {
      ...target,
      kondisi: updates.kondisi,
      status_peminjaman:
        target.status_peminjaman === 'Dipinjam' ? 'Dipinjam' : updates.status_peminjaman,
      lokasi_kampus: updates.lokasi_kampus,
      ruangan: SecurityService.sanitizeText(updates.ruangan, 80) || target.ruangan,
      catatan: updates.catatan ? SecurityService.sanitizeText(updates.catatan, 240) : undefined,
      synced_to_sheets: false,
      updated_at: new Date().toISOString(),
    };

    this.saveAllAssets(existing.map((a) => (a.id === assetId ? updatedItem : a)));
    return {
      success: true,
      message: `Data & kondisi "${target.nama_perangkat}" diperbarui.`,
    };
  }

  static checkoutAsset(input: {
    assetId: string;
    peminjam: string;
    peran_peminjam: AssetBorrowerRole;
    tanggal_pinjam: string;
    rencana_kembali: string;
    keperluan: string;
    dicatat_oleh: string;
  }): { success: boolean; message: string } {
    const cleanBorrower = SecurityService.sanitizeText(input.peminjam, 100);
    const cleanPurpose = SecurityService.sanitizeText(input.keperluan, 200);
    if (!cleanBorrower || !cleanPurpose) {
      return {
        success: false,
        message: 'Nama peminjam dan keperluan peminjaman wajib diisi.',
      };
    }

    const existing = this.getAllAssets();
    const target = existing.find((a) => a.id === input.assetId);
    if (!target) return { success: false, message: 'Aset tidak ditemukan.' };
    if (target.status_peminjaman === 'Dipinjam') {
      return {
        success: false,
        message: `Perangkat sedang dipinjam oleh ${target.peminjam_aktif}.`,
      };
    }

    const loanEntry: AssetLoanHistoryItem = {
      id: `LOAN-${Date.now().toString().slice(-6)}`,
      peminjam: cleanBorrower,
      peran_peminjam: input.peran_peminjam,
      tanggal_pinjam: input.tanggal_pinjam || new Date().toISOString().split('T')[0],
      rencana_kembali: input.rencana_kembali || new Date().toISOString().split('T')[0],
      keperluan: cleanPurpose,
      dicatat_oleh: input.dicatat_oleh,
    };

    const updatedItem: SchoolAssetItem = {
      ...target,
      status_peminjaman: 'Dipinjam',
      peminjam_aktif: cleanBorrower,
      peran_peminjam: input.peran_peminjam,
      tanggal_pinjam: loanEntry.tanggal_pinjam,
      rencana_kembali: loanEntry.rencana_kembali,
      keperluan_pinjam: cleanPurpose,
      riwayat_pinjam: [loanEntry, ...target.riwayat_pinjam],
      synced_to_sheets: false,
      updated_at: new Date().toISOString(),
    };

    this.saveAllAssets(existing.map((a) => (a.id === input.assetId ? updatedItem : a)));
    return {
      success: true,
      message: `${target.nama_perangkat} dipinjamkan kepada ${cleanBorrower}.`,
    };
  }

  static returnAsset(input: {
    assetId: string;
    tanggal_kembali: string;
    kondisi_kembali: AssetCondition;
    catatan?: string;
  }): { success: boolean; message: string } {
    const existing = this.getAllAssets();
    const target = existing.find((a) => a.id === input.assetId);
    if (!target) return { success: false, message: 'Aset tidak ditemukan.' };

    const updatedHistory = target.riwayat_pinjam.map((h, idx) =>
      idx === 0 && !h.tanggal_kembali
        ? {
            ...h,
            tanggal_kembali: input.tanggal_kembali || new Date().toISOString().split('T')[0],
            kondisi_kembali: input.kondisi_kembali,
          }
        : h
    );

    const nextStatus: AssetLoanStatus =
      input.kondisi_kembali === 'Rusak Berat' ? 'Dalam Perawatan' : 'Tersedia';

    const updatedItem: SchoolAssetItem = {
      ...target,
      kondisi: input.kondisi_kembali,
      status_peminjaman: nextStatus,
      peminjam_aktif: undefined,
      peran_peminjam: undefined,
      tanggal_pinjam: undefined,
      rencana_kembali: undefined,
      keperluan_pinjam: undefined,
      catatan: input.catatan
        ? SecurityService.sanitizeText(input.catatan, 240)
        : target.catatan,
      riwayat_pinjam: updatedHistory,
      synced_to_sheets: false,
      updated_at: new Date().toISOString(),
    };

    this.saveAllAssets(existing.map((a) => (a.id === input.assetId ? updatedItem : a)));
    return {
      success: true,
      message: `Pengembalian "${target.nama_perangkat}" berhasil dicatat (Kondisi: ${input.kondisi_kembali}).`,
    };
  }

  static deleteAsset(assetId: string): { success: boolean; message: string } {
    const existing = this.getAllAssets();
    const target = existing.find((a) => a.id === assetId);
    if (!target) return { success: false, message: 'Aset tidak ditemukan.' };
    if (target.status_peminjaman === 'Dipinjam') {
      return {
        success: false,
        message: 'Kembalikan perangkat terlebih dahulu sebelum menghapus dari inventaris.',
      };
    }
    this.saveAllAssets(existing.filter((a) => a.id !== assetId));
    return {
      success: true,
      message: `Perangkat "${target.nama_perangkat}" (${target.nomor_seri}) dihapus.`,
    };
  }

  /**
   * Sinkronisasi Batch Inventaris Aset ke Sheet 'inventaris_aset' via Google Apps Script Proxy
   */
  static async syncAssetsToSheets(): Promise<{
    success: boolean;
    mode: 'cloud' | 'local';
    message: string;
  }> {
    const targetUrl = SheetsService.getScriptUrl();
    const assets = this.getAllAssets();

    if (!targetUrl) {
      return {
        success: false,
        mode: 'local',
        message:
          'URL Google Apps Script belum dikonfigurasi. Data inventaris aman tersimpan di cache lokal.',
      };
    }

    try {
      const resp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: SecurityService.getAuthHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          url: targetUrl,
          action: 'syncAssets',
          payload: {
            assets: assets.map((a) => ({
              id: a.id,
              kode_inventaris: a.kode_inventaris,
              nama_perangkat: a.nama_perangkat,
              kategori: a.kategori,
              nomor_seri: a.nomor_seri,
              lokasi_kampus: a.lokasi_kampus,
              ruangan: a.ruangan,
              kondisi: a.kondisi,
              status_peminjaman: a.status_peminjaman,
              peminjam_aktif: a.peminjam_aktif || '',
              peran_peminjam: a.peran_peminjam || '',
              tanggal_pinjam: a.tanggal_pinjam || '',
              rencana_kembali: a.rencana_kembali || '',
              keperluan_pinjam: a.keperluan_pinjam || '',
              tanggal_perolehan: a.tanggal_perolehan,
              catatan: a.catatan || '',
              updated_at: a.updated_at,
            })),
          },
        }),
      });

      const res = await resp.json();
      if (resp.ok && res.success) {
        const syncedList = assets.map((a) => ({ ...a, synced_to_sheets: true }));
        this.saveAllAssets(syncedList);
        return {
          success: true,
          mode: 'cloud',
          message: `${syncedList.length} aset inventaris berhasil disinkronkan ke sheet "inventaris_aset" di Google Sheets.`,
        };
      }
      return {
        success: false,
        mode: 'local',
        message: res.error || 'Apps Script belum memiliki handler syncAssets. Perbarui Code.gs dari Setup Google Sheets.',
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
   * Tarik data dari sheet 'inventaris_aset' Google Sheets jika tersedia
   */
  static async pullAssetsFromSheets(): Promise<{ success: boolean; message: string }> {
    const targetUrl = SheetsService.getScriptUrl();
    if (!targetUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script belum diatur. Silakan konfigurasi di Setup Google Sheets.',
      };
    }

    try {
      const resp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: SecurityService.getAuthHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          url: targetUrl,
          action: 'getAssets',
        }),
      });

      const res = await resp.json();
      if (!resp.ok || !res.success || !Array.isArray(res.assets)) {
        return {
          success: false,
          message: res.error || 'Sheet "inventaris_aset" kosong atau aksi getAssets belum tersedia di Apps Script.',
        };
      }

      if (res.assets.length === 0) {
        return {
          success: true,
          message: 'Sheet "inventaris_aset" masih kosong di Google Sheets. Gunakan "Sync ke Sheets" untuk mengunggah data.',
        };
      }

      const existingMap = new Map(this.getAllAssets().map((a) => [a.id, a]));
      const merged: SchoolAssetItem[] = res.assets.map((row: any) => {
        const prev = existingMap.get(String(row.id));
        return {
          id: String(row.id || `AST-${Date.now()}`),
          kode_inventaris: String(row.kode_inventaris || ''),
          nama_perangkat: String(row.nama_perangkat || 'Perangkat'),
          kategori: (row.kategori as AssetCategory) || 'Lainnya',
          nomor_seri: String(row.nomor_seri || ''),
          lokasi_kampus: String(row.lokasi_kampus || 'Kampus Utama BSD City'),
          ruangan: String(row.ruangan || '-'),
          kondisi: (row.kondisi as AssetCondition) || 'Baik',
          status_peminjaman: (row.status_peminjaman as AssetLoanStatus) || 'Tersedia',
          peminjam_aktif: row.peminjam_aktif ? String(row.peminjam_aktif) : undefined,
          peran_peminjam: row.peran_peminjam ? (row.peran_peminjam as AssetBorrowerRole) : undefined,
          tanggal_pinjam: row.tanggal_pinjam ? String(row.tanggal_pinjam) : undefined,
          rencana_kembali: row.rencana_kembali ? String(row.rencana_kembali) : undefined,
          keperluan_pinjam: row.keperluan_pinjam ? String(row.keperluan_pinjam) : undefined,
          tanggal_perolehan: String(row.tanggal_perolehan || new Date().toISOString().split('T')[0]),
          catatan: row.catatan ? String(row.catatan) : undefined,
          riwayat_pinjam: prev?.riwayat_pinjam || [],
          synced_to_sheets: true,
          updated_at: String(row.updated_at || new Date().toISOString()),
        };
      });

      this.saveAllAssets(merged);
      return {
        success: true,
        message: `${merged.length} data perangkat berhasil ditarik dari Google Sheets.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal menarik dari Google Sheets: ' + (err?.message || 'Network error'),
      };
    }
  }
}
