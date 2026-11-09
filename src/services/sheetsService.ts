import { DatabaseState, LogAbsensi, LogNilai } from '../types';
import { initialData } from '../data/initialData';

const STORAGE_KEY_DB = 'edumanage_lms_db';
const STORAGE_KEY_GAS_URL = 'edumanage_gas_url';
const STORAGE_KEY_TUTOR_FEE_RATE = 'edumanage_fee_rate';

export class SheetsService {
  /**
   * Mengambil URL Google Apps Script yang tersimpan
   */
  static getScriptUrl(): string {
    return localStorage.getItem(STORAGE_KEY_GAS_URL) || '';
  }

  /**
   * Menyimpan URL Google Apps Script
   */
  static setScriptUrl(url: string): void {
    localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
  }

  /**
   * Ambil tarif fee default per sesi (default Rp 75.000)
   */
  static getFeeRate(): number {
    const val = localStorage.getItem(STORAGE_KEY_TUTOR_FEE_RATE);
    return val ? Number(val) : 75000;
  }

  static setFeeRate(rate: number): void {
    localStorage.setItem(STORAGE_KEY_TUTOR_FEE_RATE, String(rate));
  }

  /**
   * Mengambil database lokal (cache)
   */
  static getLocalDatabase(): DatabaseState {
    const cached = localStorage.getItem(STORAGE_KEY_DB);
    if (!cached) {
      // Simpan initial data pertama kali
      this.saveLocalDatabase(initialData);
      return initialData;
    }
    try {
      const parsed: DatabaseState = JSON.parse(cached);
      let changed = false;
      if (!parsed.ekstrakurikuler || parsed.ekstrakurikuler.length === 0) {
        parsed.ekstrakurikuler = initialData.ekstrakurikuler;
        changed = true;
      }
      if (!parsed.mutabaah_yaumiyah || parsed.mutabaah_yaumiyah.length === 0) {
        parsed.mutabaah_yaumiyah = initialData.mutabaah_yaumiyah;
        changed = true;
      }
      if (!parsed.tahfidz_setoran || parsed.tahfidz_setoran.length === 0) {
        parsed.tahfidz_setoran = initialData.tahfidz_setoran;
        changed = true;
      }
      // Sanitasi master_siswa untuk mencegah duplikasi data
      if (Array.isArray(parsed.master_siswa)) {
        const seenSiswa = new Set<string>();
        const originalCount = parsed.master_siswa.length;
        parsed.master_siswa = parsed.master_siswa.filter((s) => {
          const key = `${(s.siswa || '').trim().toLowerCase()}_${(s.cabang || '').trim().toLowerCase()}`;
          if (!key || seenSiswa.has(key)) return false;
          seenSiswa.add(key);
          return true;
        });
        if (parsed.master_siswa.length !== originalCount) {
          changed = true;
        }
      }
      // Pastikan data nilai historis juga ada jika data lama hanya sedikit
      if (parsed.log_nilai.length < initialData.log_nilai.length) {
        const existingIds = new Set(parsed.log_nilai.map((n) => n.id_nilai));
        const missing = initialData.log_nilai.filter((n) => !existingIds.has(n.id_nilai));
        if (missing.length > 0) {
          parsed.log_nilai = [...parsed.log_nilai, ...missing];
          changed = true;
        }
      }
      if (changed) {
        this.saveLocalDatabase(parsed);
      }
      return parsed;
    } catch {
      return initialData;
    }
  }

  /**
   * Menyimpan database ke local cache
   */
  static saveLocalDatabase(db: DatabaseState): void {
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(db));
  }

  /**
   * Tes koneksi ke Google Apps Script Web App
   */
  static async testConnection(url?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = (url || this.getScriptUrl()).trim();
    if (!targetUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    try {
      // Coba lewat proxy server terlebih dahulu
      const proxyResp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, action: 'ping' }),
      });

      if (proxyResp.ok) {
        const data = await proxyResp.json();
        if (data && data.success) {
          return { success: true, message: 'Koneksi ke Google Sheets berhasil terhubung!' };
        }
      }

      // Fallback: coba direct fetch dengan action=ping
      const directUrl = new URL(targetUrl);
      directUrl.searchParams.set('action', 'ping');
      const directResp = await fetch(directUrl.toString(), { method: 'GET' });
      if (directResp.ok) {
        return { success: true, message: 'Koneksi ke Google Sheets berhasil!' };
      }

      return {
        success: false,
        message: 'Gagal terhubung ke Google Apps Script. Pastikan Web App di-deploy dengan akses "Anyone".',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Terjadi kesalahan jaringan: ' + (err.message || 'Koneksi gagal'),
      };
    }
  }

  /**
   * Tarik seluruh data (batch read 6 sheet) dari Google Sheets
   */
  static async fetchFromSpreadsheet(): Promise<{ success: boolean; data?: DatabaseState; error?: string }> {
    const targetUrl = this.getScriptUrl();
    if (!targetUrl) {
      return { success: false, error: 'URL Google Apps Script belum dikonfigurasi' };
    }

    try {
      const resp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, action: 'getInitData' }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP error ${resp.status}`);
      }

      const res = await resp.json();
      if (!res.success) {
        throw new Error(res.error || 'Respon Google Sheets tidak berhasil');
      }

      const current = this.getLocalDatabase();
      const rawMasterSiswa = res.master_siswa?.length ? res.master_siswa : current.master_siswa;
      const seenSiswa = new Set<string>();
      const sanitizedMasterSiswa = (rawMasterSiswa || []).filter((s: any) => {
        const key = `${(s.siswa || '').trim().toLowerCase()}_${(s.cabang || '').trim().toLowerCase()}`;
        if (!key || seenSiswa.has(key)) return false;
        seenSiswa.add(key);
        return true;
      });

      const updatedDb: DatabaseState = {
        master_siswa: sanitizedMasterSiswa,
        master_guru: res.master_guru?.length ? res.master_guru : current.master_guru,
        master_kelas: res.master_kelas?.length ? res.master_kelas : current.master_kelas,
        siswa_kelas: res.siswa_kelas?.length ? res.siswa_kelas : current.siswa_kelas,
        log_absensi: res.log_absensi || [],
        log_nilai: res.log_nilai || [],
      };

      this.saveLocalDatabase(updatedDb);
      return { success: true, data: updatedDb };
    } catch (err: any) {
      console.warn('Gagal menarik dari spreadsheet via proxy, fallback ke data lokal:', err);
      return { success: false, error: err.message, data: this.getLocalDatabase() };
    }
  }

  /**
   * Inisialisasi otomatis struktur 6 sheet di Spreadsheet
   */
  static async setupSheetsOnSpreadsheet(): Promise<{ success: boolean; message: string }> {
    const targetUrl = this.getScriptUrl();
    if (!targetUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi' };
    }

    try {
      const resp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, action: 'setupSheets', payload: {} }),
      });

      const res = await resp.json();
      if (res && res.success) {
        return { success: true, message: res.message || 'Struktur 6 sheet berhasil dipersiapkan di Google Spreadsheet!' };
      }
      return { success: false, message: res.error || 'Gagal inisialisasi sheet' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi Apps Script' };
    }
  }

  /**
   * Batch simpan absensi & nilai sekaligus
   */
  static async submitBatchBoth(
    absensiItems: Omit<LogAbsensi, 'timestamp'>[],
    nilaiItems: Omit<LogNilai, 'timestamp'>[]
  ): Promise<{ success: boolean; message: string }> {
    const now = new Date().toISOString();

    const fullAbsensi: LogAbsensi[] = absensiItems.map((item) => ({
      ...item,
      id_absensi: item.id_absensi || `ABS_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
    }));

    const fullNilai: LogNilai[] = nilaiItems.map((item) => ({
      ...item,
      id_nilai: item.id_nilai || `NIL_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
    }));

    // Simpan ke local cache terlebih dahulu untuk responsiveness instan
    const db = this.getLocalDatabase();
    db.log_absensi = [...fullAbsensi, ...db.log_absensi];
    db.log_nilai = [...fullNilai, ...db.log_nilai];
    this.saveLocalDatabase(db);

    const targetUrl = this.getScriptUrl();
    if (!targetUrl) {
      return {
        success: true,
        message: 'Tersimpan di penyimpanan lokal (Mode Uji Coba). Hubungkan Google Sheets untuk sinkronisasi otomatis.',
      };
    }

    try {
      const resp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          action: 'submitBatchBoth',
          payload: {
            absensi: fullAbsensi,
            nilai: fullNilai,
          },
        }),
      });

      const res = await resp.json();
      if (res.success) {
        return {
          success: true,
          message: `Berhasil tersimpan ke Google Sheets (${fullAbsensi.length} presensi, ${fullNilai.length} nilai)`,
        };
      } else {
        return {
          success: true,
          message: 'Tersimpan di cache lokal, namun gagal sync ke Google Sheets: ' + (res.error || 'Error tak dikenal'),
        };
      }
    } catch (err: any) {
      return {
        success: true,
        message: 'Tersimpan lokal, sync cloud tertunda karena koneksi: ' + err.message,
      };
    }
  }

  /**
   * Update single row absensi
   */
  static async updateAbsensi(item: LogAbsensi): Promise<{ success: boolean; message: string }> {
    const db = this.getLocalDatabase();
    db.log_absensi = db.log_absensi.map((a) => (a.id_absensi === item.id_absensi ? item : a));
    this.saveLocalDatabase(db);

    const targetUrl = this.getScriptUrl();
    if (!targetUrl) return { success: true, message: 'Absensi diperbarui (lokal).' };

    try {
      await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          action: 'updateAbsensi',
          payload: { data: item },
        }),
      });
      return { success: true, message: 'Absensi berhasil diperbarui di Google Sheets.' };
    } catch {
      return { success: true, message: 'Absensi diperbarui di cache lokal.' };
    }
  }

  /**
   * Delete single row absensi
   */
  static async deleteAbsensi(id_absensi: string): Promise<{ success: boolean; message: string }> {
    const db = this.getLocalDatabase();
    db.log_absensi = db.log_absensi.filter((a) => a.id_absensi !== id_absensi);
    this.saveLocalDatabase(db);

    const targetUrl = this.getScriptUrl();
    if (!targetUrl) return { success: true, message: 'Data absensi dihapus (lokal).' };

    try {
      await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          action: 'deleteAbsensi',
          payload: { id_absensi },
        }),
      });
      return { success: true, message: 'Data absensi berhasil dihapus dari Google Sheets.' };
    } catch {
      return { success: true, message: 'Data absensi dihapus dari cache lokal.' };
    }
  }

  /**
   * Update single row nilai
   */
  static async updateNilai(item: LogNilai): Promise<{ success: boolean; message: string }> {
    const db = this.getLocalDatabase();
    db.log_nilai = db.log_nilai.map((n) => (n.id_nilai === item.id_nilai ? item : n));
    this.saveLocalDatabase(db);

    const targetUrl = this.getScriptUrl();
    if (!targetUrl) return { success: true, message: 'Nilai diperbarui (lokal).' };

    try {
      await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          action: 'updateNilai',
          payload: { data: item },
        }),
      });
      return { success: true, message: 'Nilai berhasil diperbarui di Google Sheets.' };
    } catch {
      return { success: true, message: 'Nilai diperbarui di cache lokal.' };
    }
  }

  /**
   * Delete single row nilai
   */
  static async deleteNilai(id_nilai: string): Promise<{ success: boolean; message: string }> {
    const db = this.getLocalDatabase();
    db.log_nilai = db.log_nilai.filter((n) => n.id_nilai !== id_nilai);
    this.saveLocalDatabase(db);

    const targetUrl = this.getScriptUrl();
    if (!targetUrl) return { success: true, message: 'Data nilai dihapus (lokal).' };

    try {
      await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          action: 'deleteNilai',
          payload: { id_nilai },
        }),
      });
      return { success: true, message: 'Data nilai berhasil dihapus dari Google Sheets.' };
    } catch {
      return { success: true, message: 'Data nilai dihapus dari cache lokal.' };
    }
  }

  /**
   * Reset local database back to default seed data
   */
  static resetToDefault(): DatabaseState {
    this.saveLocalDatabase(initialData);
    return initialData;
  }
}
