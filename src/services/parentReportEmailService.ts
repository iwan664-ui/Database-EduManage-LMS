import { MonthlyReportEmailLog, WeeklyReportItem } from '../types';
import { SecurityService } from './securityService';
import { SheetsService } from './sheetsService';

const STORAGE_KEY_PARENT_CONTACTS = 'edumanage_parent_contacts_v1';
const STORAGE_KEY_MONTHLY_EMAIL_LOGS = 'edumanage_monthly_email_logs_v1';

export interface ParentContactRecord {
  wa: string;
  email: string;
}

export interface EmailReportItemPayload {
  siswa: string;
  to: string;
  subject: string;
  body: string;
  metaLabel?: string;
}

export interface MonthlyEmailInput {
  siswa: string;
  kelas: string;
  mapel: string;
  cabang: string;
  guru: string;
  bulan: string;
  tahun: number;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  presenceRate: number;
  avg: number;
  status: string;
  note?: string;
  subjectDetails?: { mapel: string; avg: number; status: string }[];
}

export const DEFAULT_GUARDIAN_EMAIL_MAP: Record<string, string> = {
  'Ahmad Rizky Pratama': 'wali.ahmad.rizky@gmail.com',
  'Bella Safitri': 'wali.bella.safitri@gmail.com',
  'Dimas Aditya': 'wali.dimas.aditya@gmail.com',
  'Eka Nurul Fadilah': 'wali.eka.fadilah@gmail.com',
  'Farhan Maulana': 'wali.farhan.m@gmail.com',
  'Gilang Ramadhan': 'wali.gilang.r@gmail.com',
  'Hana Clarissa': 'wali.hana.clarissa@gmail.com',
  'Indra Gunawan': 'wali.indra.g@gmail.com',
  'Jessica Aurelia': 'wali.jessica.a@gmail.com',
  'Kevin Sanjaya': 'wali.kevin.s@gmail.com',
  'Laras Wulandari': 'wali.laras.w@gmail.com',
  'Muhammad Alif': 'wali.m.alif@gmail.com',
  'Nadya Putri': 'wali.nadya.p@gmail.com',
  'Oki Setiawan': 'wali.oki.setiawan@gmail.com',
  'Putri Amelia': 'wali.putri.amelia@gmail.com',
};

export class ParentReportEmailService {
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  static getDefaultGuardianEmail(studentName: string, studentEmail?: string): string {
    const mapped = DEFAULT_GUARDIAN_EMAIL_MAP[studentName];
    if (mapped) return mapped;
    const cleanStudentEmail = (studentEmail || '').trim();
    if (cleanStudentEmail && cleanStudentEmail.includes('@')) {
      return cleanStudentEmail.startsWith('wali.') ? cleanStudentEmail : `wali.${cleanStudentEmail}`;
    }
    const slug = studentName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '.');
    return `wali.${slug || 'santri'}@gmail.com`;
  }

  static getParentContacts(): Record<string, ParentContactRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PARENT_CONTACTS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static getGuardianEmail(studentName: string, studentEmail?: string, explicitGuardianEmail?: string): string {
    const saved = this.getParentContacts()[studentName]?.email?.trim();
    if (saved) return saved;
    const explicit = explicitGuardianEmail?.trim();
    if (explicit) return explicit;
    return this.getDefaultGuardianEmail(studentName, studentEmail);
  }

  static saveGuardianEmail(studentName: string, email: string): void {
    const all = this.getParentContacts();
    const existing = all[studentName] || { wa: '', email: '' };
    all[studentName] = {
      ...existing,
      email: email.trim(),
    };
    localStorage.setItem(STORAGE_KEY_PARENT_CONTACTS, JSON.stringify(all));
  }

  static saveGuardianContact(studentName: string, contact: Partial<ParentContactRecord>): void {
    const all = this.getParentContacts();
    const existing = all[studentName] || { wa: '', email: '' };
    all[studentName] = {
      wa: contact.wa !== undefined ? contact.wa.trim() : existing.wa,
      email: contact.email !== undefined ? contact.email.trim() : existing.email,
    };
    localStorage.setItem(STORAGE_KEY_PARENT_CONTACTS, JSON.stringify(all));
  }

  static buildWeeklyEmailPayload(report: WeeklyReportItem): EmailReportItemPayload {
    const to = (report.email_ortu || this.getGuardianEmail(report.siswa)).trim();
    const subject = `[Rapor Pekanan] ${report.siswa} - ${report.periode_label} (AL-WILDAN 3 BSD CITY)`;
    const detailLines =
      report.detail_nilai.length > 0
        ? report.detail_nilai
            .map(
              (d) =>
                `- ${d.mapel}: ${d.rataRata !== null ? d.rataRata : '-'} (${d.statusKkm})`
            )
            .join('\n')
        : `- ${report.mapel}: ${report.rata_nilai > 0 ? report.rata_nilai : '-'}`;

    const body = `RAPOR PEKANAN SANTRI — AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
Periode: ${report.periode_label}
------------------------------------------------------------

Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu Orang Tua / Wali Santri dari Ananda:
Nama Santri   : ${report.siswa}
Kelas         : ${report.kelas} (${report.cabang})
Guru Pengampu : ${report.guru}
Email Wali    : ${to}

Berikut kami sampaikan laporan perkembangan belajar Ananda pekan ini:

1. PRESENSI & KEDISIPLINAN
- Persentase Kehadiran : ${report.persen_kehadiran}%
- Rincian Sesi         : Hadir ${report.hadir} | Izin ${report.izin} | Sakit ${report.sakit} | Alfa ${report.alfa}

2. CAPAIAN AKADEMIK (Standar KKM 85)
${detailLines}
- Rata-rata Nilai      : ${report.rata_nilai > 0 ? report.rata_nilai : '-'} (${report.status_kkm})
- Predikat Pekanan     : ${report.predikat}

3. TAHFIDZ & MUTABA'AH IBADAH
- Tahfidz              : ${report.tahfidz_ringkasan}${report.mutabaah_skor !== null ? `\n- Skor Mutaba'ah       : ${report.mutabaah_skor}/100` : ''}

4. CATATAN EVALUASI GURU
"${report.catatan_guru}"

5. REKOMENDASI SINERGI DI RUMAH
${report.rekomendasi_ortu}

------------------------------------------------------------
Wassalamu'alaikum Warahmatullahi Wabarakatuh,
AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY`;

    return {
      siswa: report.siswa,
      to,
      subject,
      body,
      metaLabel: `${report.kelas} · Rata Nilai ${report.rata_nilai > 0 ? report.rata_nilai : '-'} · Hadir ${report.persen_kehadiran}%`,
    };
  }

  static buildMonthlyEmailPayload(input: MonthlyEmailInput, emailWali: string): EmailReportItemPayload {
    const to = emailWali.trim();
    const subject = `[Rapor Bulanan] ${input.siswa} - ${input.bulan} ${input.tahun} (${input.kelas})`;
    const subjectSection =
      input.subjectDetails && input.subjectDetails.length > 0
        ? input.subjectDetails
            .map((s) => `- ${s.mapel}: ${s.avg > 0 ? s.avg : '-'} (${s.status})`)
            .join('\n')
        : `- ${input.mapel}: ${input.avg > 0 ? input.avg : '-'} (${input.status})`;

    const body = `RAPOR BULANAN SANTRI — AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
Periode: ${input.bulan} ${input.tahun}
------------------------------------------------------------

Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu Orang Tua / Wali Santri dari Ananda:
Nama Santri   : ${input.siswa}
Kelas / Mapel : ${input.kelas} (${input.mapel})
Cabang Kampus : ${input.cabang}
Wali / Tutor  : ${input.guru}
Email Wali    : ${to}

Dengan hormat, kami sampaikan rekapitulasi hasil belajar dan kehadiran bulanan Ananda untuk periode ${input.bulan} ${input.tahun}:

1. REKAPITULASI PRESENSI BULANAN
- Persentase Kehadiran : ${input.presenceRate}%
- Rincian Sesi         : Hadir ${input.hadir} | Izin ${input.izin} | Sakit ${input.sakit} | Alfa ${input.alfa}

2. CAPAIAN AKADEMIK (Standar KKM: 85)
${subjectSection}
- Rata-rata Nilai Akhir: ${input.avg > 0 ? input.avg : '-'}
- Status Ketuntasan    : ${input.status}

3. CATATAN PERKEMBANGAN & TINDAK LANJUT
${input.note ? `"${input.note}"` : 'Ananda mengikuti pembelajaran dengan tertib. Mohon terus mendampingi murajaah dan kebiasaan belajar Ananda di rumah.'}

------------------------------------------------------------
Wassalamu'alaikum Warahmatullahi Wabarakatuh,
Bagian Akademik & Kesiswaan
AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY`;

    return {
      siswa: input.siswa,
      to,
      subject,
      body,
      metaLabel: `${input.bulan} ${input.tahun} · Nilai ${input.avg > 0 ? input.avg : '-'} (${input.status}) · Hadir ${input.presenceRate}%`,
    };
  }

  static buildMailtoUrl(to: string, subject: string, body: string): string {
    return `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  static getMonthlyEmailLogs(): MonthlyReportEmailLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MONTHLY_EMAIL_LOGS);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static recordMonthlyEmailSent(
    entries: Omit<MonthlyReportEmailLog, 'id' | 'dikirim_pada'>[]
  ): MonthlyReportEmailLog[] {
    const existing = this.getMonthlyEmailLogs();
    const now = new Date().toISOString();
    let current = [...existing];

    for (const entry of entries) {
      const newRecord: MonthlyReportEmailLog = {
        ...entry,
        id: `ME-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        dikirim_pada: now,
      };
      const idx = current.findIndex(
        (l) =>
          l.siswa === entry.siswa &&
          l.id_kelas === entry.id_kelas &&
          l.bulan === entry.bulan &&
          l.tahun === entry.tahun
      );
      if (idx >= 0) {
        current[idx] = newRecord;
      } else {
        current = [newRecord, ...current];
      }
      if (entry.email_wali) {
        this.saveGuardianEmail(entry.siswa, entry.email_wali);
      }
    }

    localStorage.setItem(STORAGE_KEY_MONTHLY_EMAIL_LOGS, JSON.stringify(current));
    return current;
  }

  static hasAppsScriptConfigured(): boolean {
    return Boolean(SheetsService.getScriptUrl().trim());
  }

  static async sendEmailsViaAppsScript(items: EmailReportItemPayload[]): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    const scriptUrl = SheetsService.getScriptUrl().trim();
    if (!scriptUrl) {
      return {
        success: false,
        sentCount: 0,
        failedCount: items.length,
        message: 'URL Google Apps Script belum dikonfigurasi.',
      };
    }

    try {
      const resp = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: SecurityService.getAuthHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          url: scriptUrl,
          action: 'sendReportEmails',
          payload: {
            items: items.map((it) => ({
              siswa: it.siswa,
              to: it.to.trim(),
              subject: it.subject,
              body: it.body,
            })),
          },
        }),
      });

      const res = await resp.json();
      if (resp.ok && res?.success) {
        return {
          success: true,
          sentCount: Number(res.sentCount ?? items.length),
          failedCount: Number(res.failedCount ?? 0),
          message: res.message || `${items.length} email rapor berhasil dikirim via Google Apps Script.`,
        };
      }

      return {
        success: false,
        sentCount: Number(res?.sentCount ?? 0),
        failedCount: Number(res?.failedCount ?? items.length),
        message: res?.error || 'Google Apps Script gagal memproses pengiriman email.',
      };
    } catch (err: any) {
      return {
        success: false,
        sentCount: 0,
        failedCount: items.length,
        message: err?.message || 'Koneksi ke Google Apps Script gagal.',
      };
    }
  }
}
