import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { GateAttendanceLog, LogAbsensi, LogNilai, WeeklyReportItem } from '../types';

export interface RecapRowData {
  siswa: string;
  kelas: string;
  cabang: string;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  presenceRate: number;
  avgGrade: number | null;
  statusKkm: 'Tuntas' | 'Remedial' | 'Belum Dinilai';
}

export interface RecapSummaryStats {
  totalStudents: number;
  overallPresence: number;
  overallAvgGrade: number;
  kkmThreshold: number;
  tuntasCount: number;
  remedialCount: number;
}

/**
 * Service untuk men-generate dokumen PDF formal dan rapi
 * Menggunakan jsPDF dan jspdf-autotable
 * Dilengkapi kop resmi AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK
 */
export class PdfExportService {
  /**
   * Helper untuk menggambar Kop Surat Resmi Sekolah
   */
  private static drawLetterhead(doc: jsPDF, title: string, subtitle?: string): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top decorative bar (Al-Wildan Islamic School colors: Navy Blue & Emerald Green & Orange)
    doc.setFillColor(30, 64, 175); // Royal Blue
    doc.rect(0, 0, pageWidth, 4, 'F');
    doc.setFillColor(16, 185, 129); // Emerald Green
    doc.rect(0, 4, pageWidth * 0.65, 2, 'F');
    doc.setFillColor(249, 115, 22); // Vibrant Orange
    doc.rect(pageWidth * 0.65, 4, pageWidth * 0.35, 2, 'F');

    // Logo text / Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK', pageWidth / 2, 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text(
      'Sistem Manajemen Pembelajaran & Administrasi Akademik Terpadu (LMS)',
      pageWidth / 2,
      19,
      { align: 'center' }
    );
    doc.text(
      'Kampus GDC Depok · Cinere Depok · Sawangan Depok | Standar Ketuntasan Minimal (KKM): 85',
      pageWidth / 2,
      23,
      { align: 'center' }
    );

    // Divider line
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.6);
    doc.line(14, 26, pageWidth - 14, 26);
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.3);
    doc.line(14, 27, pageWidth - 14, 27);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(title.toUpperCase(), pageWidth / 2, 34, { align: 'center' });

    let currentY = 38;
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
    }

    return currentY;
  }

  /**
   * Helper untuk menambahkan metadata pencetakan (Filter, Tanggal, Pengunduh)
   */
  private static drawMetadataBox(
    doc: jsPDF,
    startY: number,
    meta: { label: string; value: string }[]
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const boxWidth = pageWidth - 28;

    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.roundedRect(14, startY, boxWidth, 14, 2, 2, 'FD');

    doc.setFontSize(7.5);
    const colWidth = boxWidth / meta.length;

    meta.forEach((item, idx) => {
      const colX = 17 + idx * colWidth;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(item.label.toUpperCase(), colX, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const textVal = doc.splitTextToSize(item.value, colWidth - 4);
      doc.text(textVal[0] || '-', colX, startY + 10);
    });

    return startY + 17;
  }

  /**
   * Helper untuk menambahkan Tanda Tangan dan Footer di halaman terakhir
   */
  private static drawFooterSignatures(
    doc: jsPDF,
    signerRole: string,
    signerName: string
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 180;

    // Cek jika halaman tidak muat untuk tanda tangan (butuh ~40mm)
    let signY = finalY + 12;
    if (signY + 38 > pageHeight) {
      doc.addPage();
      signY = 25;
    }

    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Kolom Tanda Tangan Kiri: Mengetahui Koordinator Akademik
    const leftX = 25;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Mengetahui,', leftX, signY);
    doc.text('Kepala Kurikulum & Akademik', leftX, signY + 4.5);
    doc.text('AL-WILDAN 29 KOTA DEPOK', leftX, signY + 9);

    doc.setDrawColor(148, 163, 184);
    doc.line(leftX, signY + 28, leftX + 45, signY + 28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Ust. Ahmad Fauzi, M.Pd.', leftX, signY + 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('NIP. 29.AKD.2021.004', leftX, signY + 36);

    // Kolom Tanda Tangan Kanan: Guru / Admin Pembuat Dokumen
    const rightX = pageWidth - 70;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Depok, ${todayDate}`, rightX, signY);
    doc.text(signerRole, rightX, signY + 4.5);
    doc.text('Petugas Pelapor', rightX, signY + 9);

    doc.setDrawColor(148, 163, 184);
    doc.line(rightX, signY + 28, rightX + 45, signY + 28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(signerName || 'Guru Pembimbing', rightX, signY + 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('ID/Kode: AW29-TTR-AUTH', rightX, signY + 36);

    // Page numbers on all pages
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen Resmi LMS AL-WILDAN 29 Depok · Halaman ${i} dari ${totalPages} · Dicetak otomatis oleh sistem`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }
  }

  // ==========================================
  // 1. EXPORT REKAPAN NILAI & PRESENSI KELAS
  // ==========================================
  static exportTutorRecapPdf(params: {
    tutorName: string;
    className: string;
    subjectName: string;
    rows: RecapRowData[];
    summary: RecapSummaryStats;
  }): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { tutorName, className, subjectName, rows, summary } = params;

    const startY = this.drawLetterhead(
      doc,
      'REKAPITULASI PEMBELAJARAN, PRESENSI & PENCAPAIAN KKM SISWA',
      `Tahun Ajaran 2026/2027 · Semester Ganjil`
    );

    const metaY = this.drawMetadataBox(doc, startY, [
      { label: 'Guru / Tutor', value: tutorName || 'Seluruh Guru' },
      { label: 'Mata Pelajaran', value: subjectName === 'all' ? 'Semua Mata Pelajaran' : subjectName },
      { label: 'Kelas / Kelompok', value: className === 'all' ? 'Semua Kelas' : className },
      {
        label: 'Standar KKM / Ketuntasan',
        value: `KKM Minimal: ${summary.kkmThreshold} (${summary.tuntasCount} Tuntas / ${summary.remedialCount} Remedial)`,
      },
      {
        label: 'Waktu Cetak',
        value: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      },
    ]);

    // Format Table Data
    const tableBody = rows.map((r, idx) => {
      const avgStr = r.avgGrade !== null ? r.avgGrade.toFixed(1) : '-';
      return [
        String(idx + 1),
        r.siswa,
        r.kelas,
        r.cabang,
        String(r.hadir),
        String(r.izin),
        String(r.sakit),
        String(r.alfa),
        `${r.presenceRate}%`,
        avgStr,
        r.statusKkm,
      ];
    });

    autoTable(doc, {
      startY: metaY + 2,
      head: [
        [
          'No',
          'Nama Santri / Siswa',
          'Kelas',
          'Cabang',
          'H',
          'I',
          'S',
          'A',
          '% Hadir',
          'Rata Nilai',
          'Status KKM (85)',
        ],
      ],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175], // Navy Blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { halign: 'center', cellWidth: 10 },
        5: { halign: 'center', cellWidth: 10 },
        6: { halign: 'center', cellWidth: 10 },
        7: { halign: 'center', cellWidth: 10 },
        8: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
        9: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        10: { halign: 'center', fontStyle: 'bold', cellWidth: 28 },
      },
      didParseCell: (data) => {
        // Highlight Status KKM column
        if (data.section === 'body' && data.column.index === 10) {
          const val = data.cell.raw;
          if (val === 'Tuntas') {
            data.cell.styles.textColor = [16, 120, 80]; // Green
            data.cell.styles.fillColor = [236, 253, 245];
          } else if (val === 'Remedial') {
            data.cell.styles.textColor = [225, 29, 72]; // Rose/Red
            data.cell.styles.fillColor = [255, 241, 242];
          }
        }
      },
    });

    this.drawFooterSignatures(doc, 'Guru Pengampu / Wali Kelas', tutorName || 'Guru Akademik');

    const cleanFilename = `Rekap_Nilai_Presensi_${className.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
    doc.save(cleanFilename);
  }

  // ==========================================
  // 2. EXPORT LOG / RIWAYAT PRESENSI RESMI
  // ==========================================
  static exportAttendanceHistoryPdf(params: {
    userName: string;
    filterClass: string;
    filterDate?: string;
    logs: LogAbsensi[];
  }): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { userName, filterClass, filterDate, logs } = params;

    const startY = this.drawLetterhead(
      doc,
      'LEMBAR RIWAYAT & REKAPITULASI PRESENSI SANTRI',
      'Dokumen Verifikasi Kehadiran KBM Berstandar Sekolah Islam Al-Wildan'
    );

    const hadirCount = logs.filter((l) => l.status_kehadiran === 'Hadir').length;
    const izinCount = logs.filter((l) => l.status_kehadiran === 'Izin').length;
    const sakitCount = logs.filter((l) => l.status_kehadiran === 'Sakit').length;
    const alfaCount = logs.filter((l) => l.status_kehadiran === 'Alfa').length;
    const presenceRate = logs.length > 0 ? Math.round((hadirCount / logs.length) * 100) : 0;

    const metaY = this.drawMetadataBox(doc, startY, [
      { label: 'Dicetak Oleh', value: userName || 'Admin / Tutor' },
      { label: 'Filter Kelas', value: filterClass === 'all' ? 'Semua Kelas' : filterClass },
      { label: 'Total Entri', value: `${logs.length} Catatan Presensi` },
      {
        label: 'Statistik Singkat',
        value: `H:${hadirCount} | I:${izinCount} | S:${sakitCount} | A:${alfaCount} (${presenceRate}%)`,
      },
    ]);

    const tableBody = logs.map((log, idx) => [
      String(idx + 1),
      log.tanggal,
      log.siswa,
      log.id_kelas,
      log.status_kehadiran,
      log.id_tutor,
      log.timestamp ? new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    ]);

    autoTable(doc, {
      startY: metaY + 2,
      head: [['No', 'Tanggal', 'Nama Santri / Siswa', 'ID Kelas', 'Status', 'Tutor / Guru', 'Jam Input']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // Emerald Green for Attendance
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 24 },
        2: { fontStyle: 'bold', cellWidth: 55 },
        3: { halign: 'center', cellWidth: 28 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
        5: { cellWidth: 30 },
        6: { halign: 'center', cellWidth: 15 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = data.cell.raw;
          if (val === 'Hadir') {
            data.cell.styles.textColor = [16, 120, 80];
            data.cell.styles.fillColor = [236, 253, 245];
          } else if (val === 'Alfa') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fillColor = [255, 241, 242];
          } else if (val === 'Izin') {
            data.cell.styles.textColor = [2, 132, 199];
            data.cell.styles.fillColor = [240, 249, 255];
          } else if (val === 'Sakit') {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fillColor = [254, 252, 232];
          }
        }
      },
    });

    this.drawFooterSignatures(doc, 'Pemeriksa Presensi', userName || 'Tutor Akademik');

    const cleanFilename = `Riwayat_Absensi_${filterClass.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
    doc.save(cleanFilename);
  }

  // ==========================================
  // 3. EXPORT LOG / RIWAYAT NILAI AKADEMIK
  // ==========================================
  static exportGradeHistoryPdf(params: {
    userName: string;
    filterClass: string;
    filterSubject?: string;
    logs: LogNilai[];
  }): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { userName, filterClass, filterSubject, logs } = params;

    const startY = this.drawLetterhead(
      doc,
      'REKAPITULASI DOKUMEN NILAI ASESMEN & UJIAN SISWA',
      'Standar Penilaian Berkelanjutan Berbasis KKM 85 · Al-Wildan Islamic School 29'
    );

    const validGrades = logs.map((l) => Number(l.nilai)).filter((n) => !isNaN(n));
    const avgGrade = validGrades.length > 0 ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(1) : '0';
    const tuntasCount = validGrades.filter((n) => n >= 85).length;
    const remedialCount = validGrades.filter((n) => n < 85).length;

    const metaY = this.drawMetadataBox(doc, startY, [
      { label: 'Dicetak Oleh', value: userName || 'Admin / Tutor' },
      { label: 'Filter Kelas', value: filterClass === 'all' ? 'Semua Kelas' : filterClass },
      { label: 'Mata Pelajaran', value: filterSubject || 'Semua Mata Pelajaran' },
      {
        label: 'Statistik Nilai (KKM 85)',
        value: `Rata-rata: ${avgGrade} | ${tuntasCount} Tuntas | ${remedialCount} Remedial`,
      },
      {
        label: 'Total Catatan',
        value: `${logs.length} Nilai Terdata`,
      },
    ]);

    const tableBody = logs.map((log, idx) => {
      const num = Number(log.nilai);
      const isTuntas = !isNaN(num) && num >= 85;
      const statusKkm = isNaN(num) ? '-' : isTuntas ? 'Tuntas (>=85)' : 'Remedial (<85)';

      return [
        String(idx + 1),
        log.tanggal,
        log.siswa,
        log.id_kelas,
        log.mapel,
        log.jenis_penilaian,
        String(log.nilai),
        statusKkm,
        log.catatan || '-',
        log.id_tutor,
      ];
    });

    autoTable(doc, {
      startY: metaY + 2,
      head: [
        [
          'No',
          'Tanggal',
          'Nama Santri / Siswa',
          'ID Kelas',
          'Mata Pelajaran',
          'Jenis Asesmen',
          'Nilai',
          'Status KKM (85)',
          'Catatan Evaluasi',
          'Tutor',
        ],
      ],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22], // Vibrant Orange for Grades
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 20 },
        2: { fontStyle: 'bold', cellWidth: 50 },
        3: { halign: 'center', cellWidth: 24 },
        4: { cellWidth: 32 },
        5: { halign: 'center', cellWidth: 26 },
        6: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 28 },
        8: { cellWidth: 42 },
        9: { cellWidth: 22 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          const val = String(data.cell.raw);
          if (val.includes('Tuntas')) {
            data.cell.styles.textColor = [16, 120, 80];
            data.cell.styles.fillColor = [236, 253, 245];
          } else if (val.includes('Remedial')) {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fillColor = [255, 241, 242];
          }
        }
      },
    });

    this.drawFooterSignatures(doc, 'Pemeriksa Evaluasi Nilai', userName || 'Tutor Akademik');

    const cleanFilename = `Rekap_Nilai_Formal_${filterClass.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
    doc.save(cleanFilename);
  }

  // ==========================================
  // 4. EXPORT LAPORAN BULANAN TERPADU RESMI
  // ==========================================
  static exportMonthlyReportPdf(params: {
    className: string;
    branchName: string;
    subjectName: string;
    teacherName: string;
    month: string;
    year: number;
    rows: {
      no: number;
      siswa: string;
      hadir: number;
      izin: number;
      sakit: number;
      alfa: number;
      presenceRate: number;
      avg: number;
      status: string;
    }[];
    aggregates: {
      avgPresence: number;
      avgGrade: number;
      tuntasPercent: number;
    };
  }): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { className, branchName, subjectName, teacherName, month, year, rows, aggregates } = params;

    const startY = this.drawLetterhead(
      doc,
      'LAPORAN BULANAN HASIL PEMBELAJARAN & EVALUASI SANTRI',
      `Periode: ${month} ${year} · Standar KKM Sekolah 85`
    );

    const metaY = this.drawMetadataBox(doc, startY, [
      { label: 'Kelas / Rombel', value: className },
      { label: 'Cabang / Kampus', value: branchName },
      { label: 'Mata Pelajaran', value: subjectName },
      { label: 'Guru Pengampu', value: teacherName },
      {
        label: 'Ringkasan Kelas',
        value: `Rata Presensi: ${aggregates.avgPresence}% | Rata Nilai: ${aggregates.avgGrade} | Ketuntasan: ${aggregates.tuntasPercent}%`,
      },
    ]);

    const tableBody = rows.map((r) => [
      String(r.no),
      r.siswa,
      String(r.hadir),
      String(r.izin),
      String(r.sakit),
      String(r.alfa),
      `${r.presenceRate}%`,
      r.avg > 0 ? String(r.avg) : '-',
      r.status,
    ]);

    autoTable(doc, {
      startY: metaY + 2,
      head: [
        ['No', 'Nama Siswa', 'Hadir', 'Izin', 'Sakit', 'Alfa', '% Kehadiran', 'Rata-rata Nilai', 'Status KKM (85)'],
      ],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175], // Royal Blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 70 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 15 },
        6: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 30 },
        8: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          const val = String(data.cell.raw);
          if (val === 'TUNTAS') {
            data.cell.styles.textColor = [16, 120, 80];
            data.cell.styles.fillColor = [236, 253, 245];
          } else if (val === 'REMEDIAL') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fillColor = [255, 241, 242];
          }
        }
      },
    });

    this.drawFooterSignatures(doc, 'Guru Pengampu / Wali Kelas', teacherName || 'Guru Akademik');

    const cleanFilename = `Laporan_Bulanan_${className.replace(/\s+/g, '_')}_${month}_${year}.pdf`;
    doc.save(cleanFilename);
  }

  // ==========================================
  // 5. EXPORT RAPOR PEKANAN SANTRI KE ORANG TUA
  // ==========================================
  static exportWeeklyReportPdf(report: WeeklyReportItem): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const startY = this.drawLetterhead(
      doc,
      'RAPOR PEKANAN PERKEMBANGAN BELAJAR SANTRI',
      `Periode Evaluasi: ${report.periode_label} (${report.tanggal_mulai} s.d. ${report.tanggal_selesai})`
    );

    const metaY = this.drawMetadataBox(doc, startY, [
      { label: 'Nama Santri', value: report.siswa },
      { label: 'Kelas / Kampus', value: `${report.kelas} · ${report.cabang}` },
      { label: 'Guru Pengampu', value: report.guru },
      { label: 'Predikat Pekanan', value: report.predikat },
    ]);

    // Ringkasan Presensi & Nilai Pekanan
    autoTable(doc, {
      startY: metaY + 2,
      head: [['Ringkasan Presensi Pekanan', 'Kehadiran (%)', 'Rata-rata Nilai', 'Status KKM (85)', 'Mutaba\'ah Ibadah']],
      body: [
        [
          `Hadir: ${report.hadir} | Izin: ${report.izin} | Sakit: ${report.sakit} | Alfa: ${report.alfa}`,
          `${report.persen_kehadiran}%`,
          report.rata_nilai > 0 ? String(report.rata_nilai) : '-',
          report.status_kkm,
          report.mutabaah_skor !== null ? `${report.mutabaah_skor} / 100` : 'Terpantau',
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        halign: 'center',
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { cellWidth: 64 },
        3: { fontStyle: 'bold' },
      },
    });

    const afterSummaryY = ((doc as any).lastAutoTable?.finalY || metaY + 20) + 6;

    // Tabel Rincian Mata Pelajaran
    const subjectRows =
      report.detail_nilai.length > 0
        ? report.detail_nilai.map((d, idx) => [
            String(idx + 1),
            d.mapel,
            d.nilaiTerbaru !== null ? String(d.nilaiTerbaru) : '-',
            d.rataRata !== null ? String(d.rataRata) : '-',
            d.statusKkm,
            d.catatan || '-',
          ])
        : [[
            '1',
            report.mapel,
            report.rata_nilai > 0 ? String(report.rata_nilai) : '-',
            report.rata_nilai > 0 ? String(report.rata_nilai) : '-',
            report.status_kkm,
            'Pembelajaran pekanan berjalan tertib.',
          ]];

    autoTable(doc, {
      startY: afterSummaryY,
      head: [['No', 'Mata Pelajaran', 'Nilai Terbaru', 'Rata-rata', 'Status KKM', 'Catatan Capaian']],
      body: subjectRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 42 },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        5: { cellWidth: 62 },
      },
    });

    const afterTableY = ((doc as any).lastAutoTable?.finalY || afterSummaryY + 25) + 6;

    // Kotak Tahfidz, Catatan Guru, dan Rekomendasi Orang Tua
    autoTable(doc, {
      startY: afterTableY,
      head: [['Aspek Pembinaan Pekanan', 'Uraian Evaluasi & Rekomendasi untuk Orang Tua / Wali']],
      body: [
        ['Tahfidz & Tilawah Al-Qur\'an', report.tahfidz_ringkasan],
        ['Catatan Guru Pengampu', report.catatan_guru],
        ['Rekomendasi Pendampingan di Rumah', report.rekomendasi_ortu],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [30, 41, 59],
        valign: 'top',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 52, fillColor: [255, 247, 237] },
        1: { cellWidth: pageWidth - 28 - 52 },
      },
    });

    this.drawFooterSignatures(doc, 'Guru Pengampu / Wali Kelas', report.guru || 'Guru Akademik');

    const safeName = report.siswa.replace(/[^a-zA-Z0-9]+/g, '_');
    doc.save(`Rapor_Pekanan_${safeName}_${report.tanggal_selesai}.pdf`);
  }

  // ==========================================
  // 6. EXPORT LOG JAM HADIR & PULANG SANTRI (GERBANG & KELAS)
  // ==========================================
  static exportGateAttendancePdf(params: {
    title?: string;
    printedBy: string;
    filterLabel: string;
    logs: GateAttendanceLog[];
  }): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { title, printedBy, filterLabel, logs } = params;

    const startY = this.drawLetterhead(
      doc,
      title || 'LAPORAN RIWAYAT JAM HADIR & JAM PULANG SANTRI',
      'Sistem Scan Smart Card ID Terintegrasi Gerbang Sekolah, Guru & Manajemen'
    );

    const onTimeCount = logs.filter((l) => l.status_masuk === 'Tepat Waktu').length;
    const lateCount = logs.filter((l) => l.status_masuk === 'Terlambat').length;
    const outCount = logs.filter((l) => Boolean(l.jam_pulang)).length;

    const metaY = this.drawMetadataBox(doc, startY, [
      { label: 'Dicetak Oleh', value: printedBy },
      { label: 'Filter / Subjek', value: filterLabel },
      { label: 'Total Catatan', value: `${logs.length} Hari / Sesi Scan` },
      { label: 'Ringkasan', value: `Tepat Waktu: ${onTimeCount} | Terlambat: ${lateCount} | Sudah Pulang: ${outCount}` },
    ]);

    const parseDur = (inTime?: string, outTime?: string) => {
      if (!inTime || !outTime) return '-';
      const toSec = (t: string) => {
        const p = t.replace(/\./g, ':').split(':').map(Number);
        return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
      };
      const d = toSec(outTime) - toSec(inTime);
      if (d <= 0) return '-';
      return `${Math.floor(d / 3600)}j ${Math.floor((d % 3600) / 60)}m`;
    };

    const body = logs.map((l, idx) => [
      String(idx + 1),
      l.tanggal,
      l.siswa,
      l.kode_kartu,
      l.jam_masuk || '-',
      l.status_masuk || '-',
      l.jam_pulang || '-',
      l.status_pulang,
      parseDur(l.jam_masuk, l.jam_pulang),
      l.scan_oleh_masuk || l.scan_oleh_pulang || '-',
      l.lokasi_gerbang || '-',
    ]);

    autoTable(doc, {
      startY: metaY + 2,
      head: [
        [
          'No',
          'Tanggal',
          'Nama Santri',
          'ID Kartu',
          'Jam Hadir',
          'Status Masuk',
          'Jam Pulang',
          'Status Pulang',
          'Durasi',
          'Petugas Scan',
          'Lokasi Scan',
        ],
      ],
      body,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { halign: 'center', cellWidth: 21 },
        2: { fontStyle: 'bold', cellWidth: 42 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 24 },
        6: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        7: { halign: 'center', cellWidth: 24 },
        8: { halign: 'center', cellWidth: 16 },
        9: { cellWidth: 34 },
        10: { cellWidth: 37 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = String(data.cell.raw);
          if (val === 'Tepat Waktu') {
            data.cell.styles.textColor = [16, 120, 80];
            data.cell.styles.fillColor = [236, 253, 245];
          } else if (val === 'Terlambat') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fillColor = [255, 241, 242];
          }
        }
      },
    });

    this.drawFooterSignatures(doc, 'Penanggung Jawab Presensi Sekolah', printedBy);
    doc.save(`Laporan_Hadir_Pulang_Santri_${Date.now().toString().slice(-4)}.pdf`);
  }
}
