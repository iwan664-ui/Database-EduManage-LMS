import {
  AcademicReportPeriodType,
  AcademicSemesterType,
  AcademicTermReportItem,
  AcademicTermSubjectScore,
  DatabaseState,
} from '../types';

const STORAGE_KEY_TERM_REPORTS = 'alwildan_academic_term_reports_v1';
const KKM_STANDARD = 85;

const SEED_TERM_REPORTS: AcademicTermReportItem[] = [
  {
    id: 'TR-PTS-2026G-001',
    jenis_rapor: 'Tengah Semester',
    semester: 'Ganjil',
    tahun_ajaran: '2026/2027',
    tanggal_rapor: '2026-10-16',
    siswa: 'Ahmad Rizky Pratama',
    kelas_utama: '10 SMA Unggulan A',
    cabang: 'Kampus Utama BSD City',
    wali_kelas: 'Budi Santoso, S.Pd.',
    bobot_harian_persen: 40,
    bobot_ujian_persen: 60,
    daftar_nilai: [
      {
        id_kelas: 'KLS-10A-MAT',
        mapel: 'Matematika Wajib',
        guru: 'Budi Santoso, S.Pd.',
        nilai_harian: 91,
        nilai_ujian: 94,
        nilai_akhir: 92.8,
        predikat: 'A',
        tuntas_kkm: true,
        capaian_kompetensi: 'Sangat menguasai konsep persamaan & fungsi kuadrat serta pemecahan masalah terapan.',
      },
      {
        id_kelas: 'KLS-10A-FIS',
        mapel: 'Fisika Terapan',
        guru: 'Dr. Hendra Wijaya, M.Pd.',
        nilai_harian: 88,
        nilai_ujian: 90,
        nilai_akhir: 89.2,
        predikat: 'B',
        tuntas_kkm: true,
        capaian_kompetensi: 'Mampu menganalisis kinematika gerak lurus dan menyelesaikan praktikum dengan akurat.',
      },
      {
        id_kelas: 'KLS-10A-TAH',
        mapel: 'Tahfidz & Adab Qurani',
        guru: 'Ustadz Farhan Hakim, Lc.',
        nilai_harian: 94,
        nilai_ujian: 95,
        nilai_akhir: 94.6,
        predikat: 'A',
        tuntas_kkm: true,
        capaian_kompetensi: 'Hafalan mutqin dengan kaidah tajwid dan makhraj huruf yang terjaga.',
      },
    ],
    rata_rata_umum: 92.2,
    persen_ketuntasan: 100,
    sakit: 0,
    izin: 0,
    alfa: 0,
    persen_kehadiran: 100,
    tahfidz_capaian: 'Juz 29 · Q.S. Al-Mulk – Al-Ma\'arij (Kelancaran Mutqin)',
    adab_predikat: 'Sangat Baik',
    ekskul_catatan: 'Klub Olimpiade Matematika (Aktif & Berprestasi)',
    catatan_wali_kelas:
      'Alhamdulillah, capaian Tengah Semester Ganjil Ananda Ahmad Rizky sangat konsisten dan melampaui standar KKM 85 di seluruh mata pelajaran. Kedisiplinan kehadiran 100% dan adab terhadap guru sangat membanggakan.',
    keputusan_akademik: 'Tuntas Memenuhi Standar KKM 85 (Lanjut Program Pengayaan Olimpiade)',
    status_publikasi: 'Dibaca Orang Tua',
    diterbitkan_pada: '2026-10-16T09:00:00.000Z',
    dibaca_pada: '2026-10-16T14:20:00.000Z',
  },
  {
    id: 'TR-SEM-2026G-001',
    jenis_rapor: 'Semester',
    semester: 'Ganjil',
    tahun_ajaran: '2026/2027',
    tanggal_rapor: '2026-12-18',
    siswa: 'Ahmad Rizky Pratama',
    kelas_utama: '10 SMA Unggulan A',
    cabang: 'Kampus Utama BSD City',
    wali_kelas: 'Budi Santoso, S.Pd.',
    bobot_harian_persen: 40,
    bobot_ujian_persen: 60,
    daftar_nilai: [
      {
        id_kelas: 'KLS-10A-MAT',
        mapel: 'Matematika Wajib',
        guru: 'Budi Santoso, S.Pd.',
        nilai_harian: 92,
        nilai_ujian: 95,
        nilai_akhir: 93.8,
        predikat: 'A',
        tuntas_kkm: true,
        capaian_kompetensi: 'Menunjukkan penguasaan paripurna seluruh KD Semester Ganjil dengan ketelitian tinggi.',
      },
      {
        id_kelas: 'KLS-10A-FIS',
        mapel: 'Fisika Terapan',
        guru: 'Dr. Hendra Wijaya, M.Pd.',
        nilai_harian: 89,
        nilai_ujian: 91,
        nilai_akhir: 90.2,
        predikat: 'B',
        tuntas_kkm: true,
        capaian_kompetensi: 'Menguasai dinamika partikel, hukum Newton, dan analisis grafik eksperimen.',
      },
      {
        id_kelas: 'KLS-10A-TAH',
        mapel: 'Tahfidz & Adab Qurani',
        guru: 'Ustadz Farhan Hakim, Lc.',
        nilai_harian: 95,
        nilai_ujian: 96,
        nilai_akhir: 95.6,
        predikat: 'A',
        tuntas_kkm: true,
        capaian_kompetensi: 'Lolos Tasmi\' Juz 29 sekali duduk dengan predikat Mumtaz.',
      },
    ],
    rata_rata_umum: 93.2,
    persen_ketuntasan: 100,
    sakit: 0,
    izin: 1,
    alfa: 0,
    persen_kehadiran: 98,
    tahfidz_capaian: 'Lulus Tasmi\' 1 Juz (Juz 29) & Memulai Hafalan Juz 28',
    adab_predikat: 'Sangat Baik',
    ekskul_catatan: 'Klub Olimpiade Sains & Memanah (Sangat Aktif · Predikat A)',
    catatan_wali_kelas:
      'Selamat kepada Ananda Ahmad Rizky Pratama atas ketuntasan penuh 100% di akhir Semester Ganjil 2026/2027. Pertahankan semangat menuntut ilmu, murajaah Al-Qur\'an, serta keteladanan akhlak.',
    keputusan_akademik: 'Tuntas & Melanjutkan ke Semester Genap Tahun Ajaran 2026/2027',
    status_publikasi: 'Diterbitkan ke Ortu',
    diterbitkan_pada: '2026-12-18T08:00:00.000Z',
  },
  {
    id: 'TR-PTS-2026G-002',
    jenis_rapor: 'Tengah Semester',
    semester: 'Ganjil',
    tahun_ajaran: '2026/2027',
    tanggal_rapor: '2026-10-16',
    siswa: 'Bella Safitri',
    kelas_utama: '10 SMA Unggulan A',
    cabang: 'Kampus Utama BSD City',
    wali_kelas: 'Budi Santoso, S.Pd.',
    bobot_harian_persen: 40,
    bobot_ujian_persen: 60,
    daftar_nilai: [
      {
        id_kelas: 'KLS-10A-MAT',
        mapel: 'Matematika Wajib',
        guru: 'Budi Santoso, S.Pd.',
        nilai_harian: 87,
        nilai_ujian: 89,
        nilai_akhir: 88.2,
        predikat: 'B',
        tuntas_kkm: true,
        capaian_kompetensi: 'Memahami konsep aljabar & persamaan kuadrat dengan baik melampaui KKM 85.',
      },
      {
        id_kelas: 'KLS-10A-TAH',
        mapel: 'Tahfidz & Adab Qurani',
        guru: 'Ustadz Farhan Hakim, Lc.',
        nilai_harian: 90,
        nilai_ujian: 91,
        nilai_akhir: 90.6,
        predikat: 'B',
        tuntas_kkm: true,
        capaian_kompetensi: 'Setoran tahfidz pekanan tertib dengan ketepatan mad dan ghunnah yang baik.',
      },
    ],
    rata_rata_umum: 89.4,
    persen_ketuntasan: 100,
    sakit: 1,
    izin: 0,
    alfa: 0,
    persen_kehadiran: 95,
    tahfidz_capaian: 'Juz 30 Tuntas & Juz 29 Q.S. Al-Mulk s.d. Al-Haqqah',
    adab_predikat: 'Sangat Baik',
    ekskul_catatan: 'Jurnalistik Islami & Seni Kaligrafi (Aktif · Predikat Baik)',
    catatan_wali_kelas:
      'Ananda Bella Safitri menunjukkan progres akademik yang stabil pada evaluasi Tengah Semester Ganjil. Terus tingkatkan kepercayaan diri saat diskusi kelas.',
    keputusan_akademik: 'Tuntas Memenuhi Standar KKM 85 pada Tengah Semester Ganjil',
    status_publikasi: 'Diterbitkan ke Ortu',
    diterbitkan_pada: '2026-10-16T09:15:00.000Z',
  },
];

export class TermReportService {
  static getAllReports(): AcademicTermReportItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TERM_REPORTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_TERM_REPORTS, JSON.stringify(SEED_TERM_REPORTS));
        return SEED_TERM_REPORTS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED_TERM_REPORTS;
    } catch {
      return SEED_TERM_REPORTS;
    }
  }

  static saveAllReports(reports: AcademicTermReportItem[]): void {
    localStorage.setItem(STORAGE_KEY_TERM_REPORTS, JSON.stringify(reports));
  }

  static computePredicate(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= 92) return 'A';
    if (score >= KKM_STANDARD) return 'B';
    if (score >= 75) return 'C';
    return 'D';
  }

  static recalculateReportAggregates(
    report: AcademicTermReportItem,
    bobotHarian?: number,
    bobotUjian?: number
  ): AcademicTermReportItem {
    const wHarian = bobotHarian ?? report.bobot_harian_persen;
    const wUjian = bobotUjian ?? report.bobot_ujian_persen;
    const totalWeight = wHarian + wUjian > 0 ? wHarian + wUjian : 100;

    const updatedScores: AcademicTermSubjectScore[] = report.daftar_nilai.map((item) => {
      const akhir =
        Math.round(
          ((Number(item.nilai_harian || 0) * wHarian + Number(item.nilai_ujian || 0) * wUjian) /
            totalWeight) *
            10
        ) / 10;
      return {
        ...item,
        nilai_akhir: akhir,
        predikat: this.computePredicate(akhir),
        tuntas_kkm: akhir >= KKM_STANDARD,
      };
    });

    const rataUmum =
      updatedScores.length > 0
        ? Math.round(
            (updatedScores.reduce((acc, s) => acc + s.nilai_akhir, 0) / updatedScores.length) * 10
          ) / 10
        : 0;

    const tuntasCount = updatedScores.filter((s) => s.tuntas_kkm).length;
    const persenKetuntasan =
      updatedScores.length > 0 ? Math.round((tuntasCount / updatedScores.length) * 100) : 0;

    return {
      ...report,
      bobot_harian_persen: wHarian,
      bobot_ujian_persen: wUjian,
      daftar_nilai: updatedScores,
      rata_rata_umum: rataUmum,
      persen_ketuntasan: persenKetuntasan,
    };
  }

  static saveReport(report: AcademicTermReportItem): AcademicTermReportItem[] {
    const existing = this.getAllReports();
    const idx = existing.findIndex(
      (r) =>
        r.siswa.toLowerCase().trim() === report.siswa.toLowerCase().trim() &&
        r.jenis_rapor === report.jenis_rapor &&
        r.semester === report.semester &&
        r.tahun_ajaran === report.tahun_ajaran
    );

    const normalized = this.recalculateReportAggregates(report);
    const updated =
      idx >= 0
        ? existing.map((item, i) => (i === idx ? normalized : item))
        : [normalized, ...existing];

    this.saveAllReports(updated);
    return updated;
  }

  static publishBatchReports(reports: AcademicTermReportItem[]): AcademicTermReportItem[] {
    let current = this.getAllReports();
    const nowIso = new Date().toISOString();
    for (const rep of reports) {
      const normalized = this.recalculateReportAggregates({
        ...rep,
        status_publikasi: 'Diterbitkan ke Ortu',
        diterbitkan_pada: rep.diterbitkan_pada || nowIso,
      });
      const idx = current.findIndex(
        (r) =>
          r.siswa.toLowerCase().trim() === normalized.siswa.toLowerCase().trim() &&
          r.jenis_rapor === normalized.jenis_rapor &&
          r.semester === normalized.semester &&
          r.tahun_ajaran === normalized.tahun_ajaran
      );
      if (idx >= 0) {
        current = current.map((item, i) => (i === idx ? normalized : item));
      } else {
        current = [normalized, ...current];
      }
    }
    this.saveAllReports(current);
    return current;
  }

  static markAsRead(reportId: string): AcademicTermReportItem[] {
    const current = this.getAllReports();
    const updated = current.map((r) =>
      r.id === reportId
        ? {
            ...r,
            status_publikasi: 'Dibaca Orang Tua' as const,
            dibaca_pada: r.dibaca_pada || new Date().toISOString(),
          }
        : r
    );
    this.saveAllReports(updated);
    return updated;
  }

  static deleteReport(reportId: string): AcademicTermReportItem[] {
    const updated = this.getAllReports().filter((r) => r.id !== reportId);
    this.saveAllReports(updated);
    return updated;
  }

  static buildStudentTermDraft(params: {
    database: DatabaseState;
    studentName: string;
    jenisRapor: AcademicReportPeriodType;
    semester: AcademicSemesterType;
    tahunAjaran: string;
    waliKelas: string;
    tanggalRapor: string;
    bobotHarian?: number;
    bobotUjian?: number;
  }): AcademicTermReportItem {
    const {
      database,
      studentName,
      jenisRapor,
      semester,
      tahunAjaran,
      waliKelas,
      tanggalRapor,
      bobotHarian = 40,
      bobotUjian = 60,
    } = params;

    const studentInfo = database.master_siswa.find(
      (s) => s.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
    const enrolled = database.siswa_kelas.filter(
      (sk) => sk.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );

    const subjectClasses =
      enrolled.length > 0
        ? enrolled.map((sk) => {
            const cls = database.master_kelas.find((k) => k.id_kelas === sk.id_kelas);
            return {
              id_kelas: sk.id_kelas,
              mapel: sk.mapel,
              kelas: sk.kelas,
              guru: cls?.guru || 'Guru Pengampu',
            };
          })
        : database.master_kelas.slice(0, 2).map((k) => ({
            id_kelas: k.id_kelas,
            mapel: k.mapel,
            kelas: k.kelas,
            guru: k.guru,
          }));

    const studentGrades = database.log_nilai.filter(
      (n) => n.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );

    const daftar_nilai: AcademicTermSubjectScore[] = subjectClasses.map((sub) => {
      const subLogs = studentGrades
        .filter((g) => g.id_kelas === sub.id_kelas || g.mapel === sub.mapel)
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      const nums = subLogs.map((g) => Number(g.nilai)).filter((n) => !isNaN(n));
      const avgHarian =
        nums.length > 0
          ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
          : 85;
      const latestExam = nums.length > 0 ? nums[0] : avgHarian;
      const nilaiAkhir =
        Math.round(((avgHarian * bobotHarian + latestExam * bobotUjian) / (bobotHarian + bobotUjian)) * 10) /
        10;
      const tuntas = nilaiAkhir >= KKM_STANDARD;

      return {
        id_kelas: sub.id_kelas,
        mapel: sub.mapel,
        guru: sub.guru,
        nilai_harian: avgHarian,
        nilai_ujian: latestExam,
        nilai_akhir: nilaiAkhir,
        predikat: this.computePredicate(nilaiAkhir),
        tuntas_kkm: tuntas,
        capaian_kompetensi:
          subLogs[0]?.catatan ||
          (tuntas
            ? `Menguasai kompetensi inti ${sub.mapel} dengan baik melampaui standar KKM ${KKM_STANDARD}.`
            : `Memerlukan penguatan dan latihan terarah pada materi pokok ${sub.mapel}.`),
      };
    });

    const studentAbs = database.log_absensi.filter(
      (a) => a.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
    const hadir = studentAbs.filter((a) => a.status_kehadiran === 'Hadir').length;
    const sakit = studentAbs.filter((a) => a.status_kehadiran === 'Sakit').length;
    const izin = studentAbs.filter((a) => a.status_kehadiran === 'Izin').length;
    const alfa = studentAbs.filter((a) => a.status_kehadiran === 'Alfa').length;
    const totalAbs = studentAbs.length;
    const persen_kehadiran = totalAbs > 0 ? Math.round((hadir / totalAbs) * 100) : 100;

    const tahfidzList = (database.tahfidz_setoran || [])
      .filter((t) => t.siswa.toLowerCase().trim() === studentName.toLowerCase().trim())
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    const tahfidz_capaian = tahfidzList[0]
      ? `Juz ${tahfidzList[0].juz} · Q.S. ${tahfidzList[0].surat} ayat ${tahfidzList[0].ayat_mulai}-${tahfidzList[0].ayat_selesai} (${tahfidzList[0].kelancaran})`
      : 'Mengikuti program Tahfidz Al-Qur\'an secara reguler';

    const mutabaah = (database.mutabaah_yaumiyah || []).filter(
      (m) => m.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
    const avgMutabaah =
      mutabaah.length > 0
        ? mutabaah.reduce((s, m) => s + Number(m.skor_ibadah || 0), 0) / mutabaah.length
        : 90;
    const adab_predikat: AcademicTermReportItem['adab_predikat'] =
      avgMutabaah >= 88 ? 'Sangat Baik' : avgMutabaah >= 75 ? 'Baik' : 'Cukup';

    const ekskulList = (database.ekstrakurikuler || []).filter(
      (e) => e.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
    const ekskul_catatan =
      ekskulList.length > 0
        ? ekskulList.map((e) => `${e.nama_ekskul} (${e.predikat})`).join(', ')
        : 'Pramuka & Pembinaan Karakter Islami (Aktif · Baik)';

    const rata_rata_umum =
      daftar_nilai.length > 0
        ? Math.round(
            (daftar_nilai.reduce((acc, d) => acc + d.nilai_akhir, 0) / daftar_nilai.length) * 10
          ) / 10
        : 0;
    const tuntasCount = daftar_nilai.filter((d) => d.tuntas_kkm).length;
    const persen_ketuntasan =
      daftar_nilai.length > 0 ? Math.round((tuntasCount / daftar_nilai.length) * 100) : 100;

    const allTuntas = persen_ketuntasan === 100;
    const keputusan_akademik =
      jenisRapor === 'Tengah Semester'
        ? allTuntas
          ? `Tuntas Memenuhi Standar KKM 85 pada Tengah Semester ${semester}`
          : `Dalam Pendampingan Pengayaan KKM 85 menjelang Ujian Akhir Semester ${semester}`
        : semester === 'Ganjil'
          ? allTuntas
            ? `Tuntas & Melanjutkan ke Semester Genap Tahun Ajaran ${tahunAjaran}`
            : `Melanjutkan dengan Program Matrikulasi KKM 85 di Semester Genap`
          : allTuntas
            ? `Naik Tingkat / Lulus Semester Genap Tahun Ajaran ${tahunAjaran}`
            : `Naik Tingkat dengan Catatan Perbaikan Kompetensi Dasar`;

    const catatan_wali_kelas =
      jenisRapor === 'Tengah Semester'
        ? `Pada evaluasi Tengah Semester ${semester} ${tahunAjaran}, Ananda ${studentName} mencatat rata-rata nilai ${rata_rata_umum} dengan tingkat ketuntasan ${persen_ketuntasan}% terhadap KKM 85 dan kehadiran ${persen_kehadiran}%.`
        : `Alhamdulillah, selama Semester ${semester} ${tahunAjaran}, Ananda ${studentName} meraih rata-rata nilai akhir ${rata_rata_umum} (${persen_ketuntasan}% mapel tuntas KKM 85). Adab & ibadah keseharian dinilai ${adab_predikat}.`;

    const prefix = jenisRapor === 'Tengah Semester' ? 'TR-PTS' : 'TR-SEM';

    return {
      id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      jenis_rapor: jenisRapor,
      semester,
      tahun_ajaran: tahunAjaran,
      tanggal_rapor: tanggalRapor,
      siswa: studentName,
      kelas_utama: subjectClasses[0]?.kelas || 'Kelas Reguler',
      cabang: studentInfo?.cabang || 'Kampus Utama BSD City',
      wali_kelas: waliKelas || subjectClasses[0]?.guru || 'Wali Kelas',
      bobot_harian_persen: bobotHarian,
      bobot_ujian_persen: bobotUjian,
      daftar_nilai,
      rata_rata_umum,
      persen_ketuntasan,
      sakit,
      izin,
      alfa,
      persen_kehadiran,
      tahfidz_capaian,
      adab_predikat,
      ekskul_catatan,
      catatan_wali_kelas,
      keputusan_akademik,
      status_publikasi: 'Draf',
    };
  }

  static formatWhatsAppMessage(report: AcademicTermReportItem): string {
    const title =
      report.jenis_rapor === 'Tengah Semester'
        ? 'RAPOR TENGAH SEMESTER (PTS)'
        : 'RAPOR AKHIR SEMESTER (PAS/PAT)';
    const lines = report.daftar_nilai
      .map(
        (d) =>
          `• ${d.mapel}: Akhir *${d.nilai_akhir}* (${d.predikat} · ${d.tuntas_kkm ? 'Tuntas' : 'Remedial'})`
      )
      .join('\n');

    return `*${title} — AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY*
_Semester ${report.semester} · Tahun Ajaran ${report.tahun_ajaran}_
--------------------------------------------
Yth. Bapak/Ibu Wali Santri dari:
👤 *${report.siswa}*
🏫 Kelas: ${report.kelas_utama} (${report.cabang})
👨‍🏫 Wali Kelas: ${report.wali_kelas}

📊 *REKAPITULASI NILAI (KKM 85):*
${lines}
• Rata-rata Umum: *${report.rata_rata_umum}* (Ketuntasan ${report.persen_ketuntasan}%)

📖 *TAHFIDZ, ADAB & KEHADIRAN:*
• Tahfidz: ${report.tahfidz_capaian}
• Adab & Karakter: *${report.adab_predikat}*
• Kehadiran: *${report.persen_kehadiran}%* (S:${report.sakit} I:${report.izin} A:${report.alfa})

💬 *CATATAN & KEPUTUSAN:*
_"${report.catatan_wali_kelas}"_
✅ *${report.keputusan_akademik}*

_Rapor PDF resmi dapat diunduh melalui Portal Santri & Wali Murid._`;
  }

  static buildWhatsAppUrl(report: AcademicTermReportItem): string {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(this.formatWhatsAppMessage(report))}`;
  }
}
