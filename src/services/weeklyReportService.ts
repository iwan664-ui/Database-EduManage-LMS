import {
  DatabaseState,
  WeeklyReportChannel,
  WeeklyReportItem,
  WeeklyReportSubjectDetail,
} from '../types';

const STORAGE_KEY_WEEKLY_REPORTS = 'edumanage_weekly_reports_v1';
const STORAGE_KEY_PARENT_CONTACTS = 'edumanage_parent_contacts_v1';

export interface ParentContactInfo {
  wa: string;
  email: string;
}

const DEFAULT_SEED_REPORTS: WeeklyReportItem[] = [
  {
    id: 'WR-SEED-001',
    siswa: 'Ahmad Rizky Pratama',
    id_kelas: 'KLS-10A-MAT',
    kelas: '10 SMA Unggulan A',
    mapel: 'Matematika Wajib',
    cabang: 'Kampus Utama BSD City',
    guru: 'Budi Santoso, S.Pd.',
    periode_label: 'Pekan 1 · 02 - 08 Nov 2026',
    tanggal_mulai: '2026-11-02',
    tanggal_selesai: '2026-11-08',
    hadir: 5,
    izin: 0,
    sakit: 0,
    alfa: 0,
    persen_kehadiran: 100,
    rata_nilai: 92.5,
    status_kkm: 'Tuntas (≥ 85)',
    predikat: 'Mumtaz (Sangat Baik)',
    tahfidz_ringkasan: 'Ziyadah & Murajaah berjalan lancar (Nilai KKM Tuntas)',
    mutabaah_skor: 94,
    detail_nilai: [
      {
        mapel: 'Matematika Wajib',
        nilaiTerbaru: 93,
        rataRata: 92.5,
        statusKkm: 'Tuntas',
        catatan: 'Sangat cepat memahami materi fungsi kuadrat dan aktif bertanya.',
      },
    ],
    catatan_guru:
      'Alhamdulillah, Ananda Ahmad Rizky Pratama menunjukkan kedisiplinan kehadiran 100% dan capaian akademik sangat memuaskan (rata-rata 92.5, melampaui KKM 85). Adab di dalam halaqah maupun kelas sangat santun.',
    rekomendasi_ortu:
      'Mohon ayah/bunda terus mendampingi murajaah hafalan dan memberikan apresiasi atas konsistensi belajar Ananda pekan ini.',
    kontak_wa_ortu: '081288990011',
    email_ortu: 'ahmad.rizky@gmail.com',
    channels: ['Portal Walmur', 'WhatsApp'],
    status_kirim: 'Dibaca Orang Tua',
    dikirim_pada: '2026-11-08T15:30:00.000Z',
    dibaca_pada: '2026-11-08T18:10:00.000Z',
  },
  {
    id: 'WR-SEED-002',
    siswa: 'Bella Safitri',
    id_kelas: 'KLS-10A-MAT',
    kelas: '10 SMA Unggulan A',
    mapel: 'Matematika Wajib',
    cabang: 'Kampus Utama BSD City',
    guru: 'Budi Santoso, S.Pd.',
    periode_label: 'Pekan 1 · 02 - 08 Nov 2026',
    tanggal_mulai: '2026-11-02',
    tanggal_selesai: '2026-11-08',
    hadir: 4,
    izin: 1,
    sakit: 0,
    alfa: 0,
    persen_kehadiran: 80,
    rata_nilai: 88.0,
    status_kkm: 'Tuntas (≥ 85)',
    predikat: 'Jayyid Jiddan (Baik)',
    tahfidz_ringkasan: 'Setoran hafalan terpantau tertib sesuai target mingguan',
    mutabaah_skor: 89,
    detail_nilai: [
      {
        mapel: 'Matematika Wajib',
        nilaiTerbaru: 88,
        rataRata: 88,
        statusKkm: 'Tuntas',
        catatan: 'Ketelitian mengerjakan latihan soal meningkat baik.',
      },
    ],
    catatan_guru:
      'Ananda Bella Safitri mengikuti KBM dengan baik serta tuntas di atas KKM 85 (rata-rata 88.0). Terdapat 1 kali izin yang telah terkonfirmasi.',
    rekomendasi_ortu:
      'Mohon bantu mengingatkan Ananda untuk mengulas kembali latihan soal pekan ini agar semakin siap menghadapi evaluasi tengah semester.',
    kontak_wa_ortu: '081344556677',
    email_ortu: 'bella.safitri@gmail.com',
    channels: ['Portal Walmur', 'PDF'],
    status_kirim: 'Terkirim',
    dikirim_pada: '2026-11-08T16:00:00.000Z',
  },
];

export class WeeklyReportService {
  static getAllReports(): WeeklyReportItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_REPORTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_WEEKLY_REPORTS, JSON.stringify(DEFAULT_SEED_REPORTS));
        return DEFAULT_SEED_REPORTS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULT_SEED_REPORTS;
    } catch {
      return DEFAULT_SEED_REPORTS;
    }
  }

  static saveAllReports(reports: WeeklyReportItem[]): void {
    localStorage.setItem(STORAGE_KEY_WEEKLY_REPORTS, JSON.stringify(reports));
  }

  static sendReport(report: WeeklyReportItem): WeeklyReportItem[] {
    const existing = this.getAllReports();
    // Jika laporan untuk siswa, kelas, dan tanggal periode yang sama sudah ada, perbarui saja
    const idx = existing.findIndex(
      (r) =>
        r.siswa === report.siswa &&
        r.id_kelas === report.id_kelas &&
        r.tanggal_mulai === report.tanggal_mulai &&
        r.tanggal_selesai === report.tanggal_selesai
    );

    let updated: WeeklyReportItem[];
    if (idx >= 0) {
      updated = existing.map((item, i) => (i === idx ? report : item));
    } else {
      updated = [report, ...existing];
    }
    this.saveAllReports(updated);

    if (report.kontak_wa_ortu || report.email_ortu) {
      this.saveParentContact(report.siswa, {
        wa: report.kontak_wa_ortu || '',
        email: report.email_ortu || '',
      });
    }
    return updated;
  }

  static sendBatchReports(reports: WeeklyReportItem[]): WeeklyReportItem[] {
    let current = this.getAllReports();
    for (const rep of reports) {
      const idx = current.findIndex(
        (r) =>
          r.siswa === rep.siswa &&
          r.id_kelas === rep.id_kelas &&
          r.tanggal_mulai === rep.tanggal_mulai &&
          r.tanggal_selesai === rep.tanggal_selesai
      );
      if (idx >= 0) {
        current = current.map((item, i) => (i === idx ? rep : item));
      } else {
        current = [rep, ...current];
      }
    }
    this.saveAllReports(current);
    return current;
  }

  static markAsRead(reportId: string): WeeklyReportItem[] {
    const current = this.getAllReports();
    const updated = current.map((r) =>
      r.id === reportId
        ? {
            ...r,
            status_kirim: 'Dibaca Orang Tua' as const,
            dibaca_pada: r.dibaca_pada || new Date().toISOString(),
          }
        : r
    );
    this.saveAllReports(updated);
    return updated;
  }

  static deleteReport(reportId: string): WeeklyReportItem[] {
    const updated = this.getAllReports().filter((r) => r.id !== reportId);
    this.saveAllReports(updated);
    return updated;
  }

  static getParentContacts(): Record<string, ParentContactInfo> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PARENT_CONTACTS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static saveParentContact(studentName: string, contact: ParentContactInfo): void {
    const all = this.getParentContacts();
    all[studentName] = contact;
    localStorage.setItem(STORAGE_KEY_PARENT_CONTACTS, JSON.stringify(all));
  }

  /**
   * Format label rentang pekan ke bahasa Indonesia yang rapi
   */
  static formatPeriodLabel(startDate: string, endDate: string): string {
    try {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      const weekOfMonth = Math.ceil(start.getDate() / 7);
      const sStr = start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const eStr = end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      return `Pekan ${weekOfMonth} · ${sStr} - ${eStr}`;
    } catch {
      return `${startDate} s/d ${endDate}`;
    }
  }

  /**
   * Menyusun draf Rapor Pekanan otomatis dari data LMS (Presensi, Nilai, Tahfidz, Mutaba'ah)
   */
  static buildStudentWeeklyDraft(params: {
    database: DatabaseState;
    studentName: string;
    classId: string;
    tutorName: string;
    startDate: string;
    endDate: string;
  }): WeeklyReportItem {
    const { database, studentName, classId, tutorName, startDate, endDate } = params;
    const KKM = 85;

    const masterClass = database.master_kelas.find((k) => k.id_kelas === classId);
    const masterStudent = database.master_siswa.find((s) => s.siswa === studentName);
    const savedContact = this.getParentContacts()[studentName];

    // Filter presensi dalam rentang pekan (jika kosong pada pekan itu, fallback ke riwayat kelas santri agar guru tetap dapat angka acuan)
    const allClassAbs = database.log_absensi.filter(
      (a) => a.siswa === studentName && (classId === 'all' || a.id_kelas === classId)
    );
    const periodAbs = allClassAbs.filter((a) => a.tanggal >= startDate && a.tanggal <= endDate);
    const absSource = periodAbs.length > 0 ? periodAbs : allClassAbs;

    const hadir = absSource.filter((a) => a.status_kehadiran === 'Hadir').length;
    const izin = absSource.filter((a) => a.status_kehadiran === 'Izin').length;
    const sakit = absSource.filter((a) => a.status_kehadiran === 'Sakit').length;
    const alfa = absSource.filter((a) => a.status_kehadiran === 'Alfa').length;
    const totalAbs = absSource.length;
    const persen_kehadiran = totalAbs > 0 ? Math.round((hadir / totalAbs) * 100) : 100;

    // Filter nilai dalam rentang pekan (fallback ke nilai terakhir siswa di kelas tsb)
    const allClassGrades = database.log_nilai
      .filter((n) => n.siswa === studentName && (classId === 'all' || n.id_kelas === classId))
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    const periodGrades = allClassGrades.filter((n) => n.tanggal >= startDate && n.tanggal <= endDate);
    const gradeSource = periodGrades.length > 0 ? periodGrades : allClassGrades;

    const nums = gradeSource.map((g) => Number(g.nilai)).filter((n) => !isNaN(n));
    const rata_nilai =
      nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;

    const status_kkm: WeeklyReportItem['status_kkm'] =
      nums.length === 0
        ? 'Belum Ada Nilai'
        : rata_nilai >= KKM
          ? 'Tuntas (≥ 85)'
          : 'Perlu Pendampingan (< 85)';

    const predikat: WeeklyReportItem['predikat'] =
      rata_nilai >= 90 && persen_kehadiran >= 85
        ? 'Mumtaz (Sangat Baik)'
        : rata_nilai >= KKM || (nums.length === 0 && persen_kehadiran >= 85)
          ? 'Jayyid Jiddan (Baik)'
          : 'Perlu Pembinaan';

    // Detail per mata pelajaran
    const enrolledClasses = database.siswa_kelas.filter(
      (sk) => sk.siswa === studentName && (classId === 'all' || sk.id_kelas === classId)
    );
    const detail_nilai: WeeklyReportSubjectDetail[] = enrolledClasses.map((cls) => {
      const subGrades = gradeSource.filter((g) => g.id_kelas === cls.id_kelas || g.mapel === cls.mapel);
      const subNums = subGrades.map((g) => Number(g.nilai)).filter((n) => !isNaN(n));
      const avg =
        subNums.length > 0 ? Math.round((subNums.reduce((a, b) => a + b, 0) / subNums.length) * 10) / 10 : null;
      return {
        mapel: cls.mapel,
        nilaiTerbaru: subNums.length > 0 ? subNums[0] : null,
        rataRata: avg,
        statusKkm: avg === null ? 'Belum Dinilai' : avg >= KKM ? 'Tuntas' : 'Remedial',
        catatan: subGrades[0]?.catatan || 'Mengikuti pembelajaran pekanan dengan tertib.',
      };
    });

    // Tahfidz & Mutaba'ah
    const tahfidzList = (database.tahfidz_setoran || [])
      .filter((t) => t.siswa === studentName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    const latestTahfidz = tahfidzList[0];
    const tahfidz_ringkasan = latestTahfidz
      ? `${latestTahfidz.surat} ayat ${latestTahfidz.ayat_mulai}-${latestTahfidz.ayat_selesai} (Juz ${latestTahfidz.juz} · ${latestTahfidz.kelancaran})`
      : 'Mengikuti halaqah tahfidz & pembiasaan tilawah harian di kelas';

    const mutabaahList = (database.mutabaah_yaumiyah || []).filter((m) => m.siswa === studentName);
    const mutabaah_skor =
      mutabaahList.length > 0
        ? Math.round(mutabaahList.reduce((acc, m) => acc + Number(m.skor_ibadah || 0), 0) / mutabaahList.length)
        : null;

    // Susun Catatan Guru & Rekomendasi Orang Tua Otomatis
    const catatanGradePart =
      nums.length > 0
        ? rata_nilai >= KKM
          ? `capaian rata-rata nilai pekanan sebesar ${rata_nilai} (Tuntas melampaui KKM 85)`
          : `capaian rata-rata nilai pekanan sebesar ${rata_nilai} (masih di bawah KKM 85 sehingga memerlukan penguatan materi)`
        : 'keaktifan mengikuti pembelajaran kelas pekan ini berjalan baik';

    const catatanAbsPart =
      alfa > 0
        ? `Kehadiran tercatat ${persen_kehadiran}% dengan ${alfa} kali ketidakhadiran tanpa keterangan.`
        : `Kedisiplinan kehadiran sangat baik sebesar ${persen_kehadiran}% (${hadir} Hadir, ${izin} Izin, ${sakit} Sakit).`;

    const catatan_guru = `Alhamdulillah, selama periode ini Ananda ${studentName} menunjukkan ${catatanGradePart}. ${catatanAbsPart} Perkembangan tahfidz: ${tahfidz_ringkasan}.`;

    const rekomendasi_ortu =
      rata_nilai > 0 && rata_nilai < KKM
        ? 'Mohon Ayah/Bunda mendampingi Ananda mengulang latihan soal di rumah 20-30 menit setiap malam dan berkoordinasi dengan guru untuk sesi pengayaan.'
        : 'Mohon Ayah/Bunda terus memberikan apresiasi positif, menjaga konsistensi shalat 5 waktu, serta memantau murajaah hafalan Ananda di rumah.';

    return {
      id: `WR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      siswa: studentName,
      id_kelas: masterClass?.id_kelas || classId,
      kelas: masterClass?.kelas || enrolledClasses[0]?.kelas || 'Kelas Reguler',
      mapel: masterClass?.mapel || enrolledClasses[0]?.mapel || 'Pembelajaran Terpadu',
      cabang: masterStudent?.cabang || masterClass?.cabang || 'Kampus Utama BSD City',
      guru: tutorName || masterClass?.guru || 'Guru Pengampu',
      periode_label: this.formatPeriodLabel(startDate, endDate),
      tanggal_mulai: startDate,
      tanggal_selesai: endDate,
      hadir,
      izin,
      sakit,
      alfa,
      persen_kehadiran,
      rata_nilai,
      status_kkm,
      predikat,
      tahfidz_ringkasan,
      mutabaah_skor,
      detail_nilai,
      catatan_guru,
      rekomendasi_ortu,
      kontak_wa_ortu: savedContact?.wa || '',
      email_ortu: savedContact?.email || masterStudent?.email_siswa || '',
      channels: ['Portal Walmur'],
      status_kirim: 'Terkirim',
      dikirim_pada: new Date().toISOString(),
    };
  }

  /**
   * Format pesan WhatsApp Rapor Pekanan untuk dikirim kepada Orang Tua
   */
  static formatWhatsAppMessage(report: WeeklyReportItem): string {
    const detailLines =
      report.detail_nilai.length > 0
        ? report.detail_nilai
            .map(
              (d) =>
                `• ${d.mapel}: *${d.rataRata !== null ? d.rataRata : '-'}* (${d.statusKkm})`
            )
            .join('\n')
        : `• ${report.mapel}: *${report.rata_nilai > 0 ? report.rata_nilai : '-'}*`;

    return `*RAPOR PEKANAN SANTRI — AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY*
_${report.periode_label}_
--------------------------------------------
*Assalamu'alaikum Warahmatullahi Wabarakatuh,*
Yth. Bapak/Ibu Orang Tua/Wali dari Ananda:
👤 *${report.siswa}*
🏫 Kelas: ${report.kelas} (${report.cabang})
👨‍🏫 Guru Pengampu: ${report.guru}

Berikut kami sampaikan laporan perkembangan belajar Ananda pekan ini:

🗓️ *1. PRESENSI & KEDISIPLINAN:*
• Kehadiran: *${report.persen_kehadiran}%* (Hadir: ${report.hadir} | Izin: ${report.izin} | Sakit: ${report.sakit} | Alfa: ${report.alfa})

📊 *2. CAPAIAN AKADEMIK (Standar KKM 85):*
${detailLines}
• Rata-rata Nilai: *${report.rata_nilai > 0 ? report.rata_nilai : '-'}* (${report.status_kkm})
• Predikat Pekanan: *${report.predikat}*

📖 *3. TAHFIDZ & MUTABA'AH IBADAH:*
• Tahfidz: ${report.tahfidz_ringkasan}${report.mutabaah_skor !== null ? `\n• Skor Mutaba'ah Harian: *${report.mutabaah_skor}/100*` : ''}

💬 *4. CATATAN GURU:*
_"${report.catatan_guru}"_

🏡 *5. REKOMENDASI SINERGI DI RUMAH:*
${report.rekomendasi_ortu}

--------------------------------------------
*Wassalamu'alaikum Warahmatullahi Wabarakatuh*
_Laporan lengkap juga dapat diakses Orang Tua melalui Portal Santri & Walmur LMS AL-WILDAN 3 BSD CITY._`;
  }

  static buildWhatsAppUrl(report: WeeklyReportItem): string {
    const cleanPhone = (report.kontak_wa_ortu || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone
      ? cleanPhone.startsWith('0')
        ? `62${cleanPhone.slice(1)}`
        : cleanPhone
      : '';
    const textEncoded = encodeURIComponent(this.formatWhatsAppMessage(report));
    return phoneParam
      ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${textEncoded}`
      : `https://api.whatsapp.com/send?text=${textEncoded}`;
  }

  static buildMailtoUrl(report: WeeklyReportItem): string {
    const subject = `[Rapor Pekanan] ${report.siswa} - ${report.periode_label} (AL-WILDAN 3 BSD CITY)`;
    const body = this.formatWhatsAppMessage(report).replace(/\*/g, '').replace(/_/g, '');
    const to = (report.email_ortu || '').trim();
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
