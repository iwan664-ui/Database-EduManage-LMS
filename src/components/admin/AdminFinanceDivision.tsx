import React, { useMemo, useState } from 'react';
import {
  ActiveUser,
  DatabaseState,
  PaymentMethodType,
  StudentBillingCategory,
  StudentInvoiceItem,
  StudentInvoiceStatus,
} from '../../types';
import { FinanceService } from '../../services/financeService';
import { PdfExportService } from '../../services/pdfExportService';
import { SecurityService } from '../../services/securityService';
import { AdminFinanceCharts } from './AdminFinanceCharts';
import { AdminFinanceExecutiveSummary } from './AdminFinanceExecutiveSummary';
import { AdminFinanceCashFlowForecast } from './AdminFinanceCashFlowForecast';
import { useToast } from '../Toast';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';

interface AdminFinanceDivisionProps {
  database: DatabaseState;
  currentUser: ActiveUser;
}

type FinanceSubTab = 'daftar' | 'terbitkan' | 'verifikasi' | 'rekap-siswa';

const BILLING_CATEGORIES: StudentBillingCategory[] = [
  'SPP Bulanan',
  'Uang Pangkal / Pengembangan',
  'Buku & Modul',
  'Kegiatan & Ekskul',
  'Munaqasyah Tahfidz',
  'Lainnya',
];

const PAYMENT_METHODS: PaymentMethodType[] = [
  'Transfer Bank BSI',
  'Virtual Account',
  'QRIS Sekolah',
  'Tunai Loket',
];

const MONTH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export function AdminFinanceDivision({ database, currentUser }: AdminFinanceDivisionProps) {
  const { showToast } = useToast();
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [subTab, setSubTab] = useState<FinanceSubTab>('daftar');

  // Time & Data Filters
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [onlyActiveStudents, setOnlyActiveStudents] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StudentInvoiceStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | StudentBillingCategory>('all');

  // Inline payment recording drawer
  const [payingInvoice, setPayingInvoice] = useState<StudentInvoiceItem | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<PaymentMethodType>('Transfer Bank BSI');
  const [payRef, setPayRef] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');

  // Mass Billing Form
  const [massTargetMode, setMassTargetMode] = useState<'all' | 'cabang' | 'kelas'>('all');
  const [massCabang, setMassCabang] = useState<string>('Kampus Utama BSD City');
  const [massKelasId, setMassKelasId] = useState<string>(database.master_kelas[0]?.id_kelas || '');
  const [massCategory, setMassCategory] = useState<StudentBillingCategory>('SPP Bulanan');
  const [massPeriod, setMassPeriod] = useState<string>('Desember 2026');
  const [massTitle, setMassTitle] = useState<string>('SPP Bulanan Desember 2026');
  const [massNominal, setMassNominal] = useState<number>(1750000);
  const [massDiscount, setMassDiscount] = useState<number>(0);
  const [massDueDate, setMassDueDate] = useState<string>('2026-12-10');
  const [massNote, setMassNote] = useState<string>('');

  // Individual Billing Form
  const [singleStudent, setSingleStudent] = useState<string>(database.master_siswa[0]?.siswa || '');
  const [singleCategory, setSingleCategory] = useState<StudentBillingCategory>('Kegiatan & Ekskul');
  const [singlePeriod, setSinglePeriod] = useState<string>('November 2026');
  const [singleTitle, setSingleTitle] = useState<string>('');
  const [singleNominal, setSingleNominal] = useState<number>(500000);
  const [singleDiscount, setSingleDiscount] = useState<number>(0);
  const [singleDueDate, setSingleDueDate] = useState<string>('2026-11-25');
  const [singleNote, setSingleNote] = useState<string>('');

  // Verification rejection reason
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const activeStudentNames = useMemo(
    () => new Set(database.master_siswa.map((s) => s.siswa.toLowerCase().trim())),
    [database.master_siswa]
  );

  const campuses = useMemo(() => {
    const set = new Set<string>();
    database.master_siswa.forEach((s) => set.add(s.cabang));
    return Array.from(set);
  }, [database.master_siswa]);

  const allInvoices = useMemo(() => {
    void refreshTick;
    return FinanceService.getAllInvoices();
  }, [refreshTick]);

  const allExpenses = useMemo(() => {
    void refreshTick;
    return FinanceService.getAllExpenses();
  }, [refreshTick]);

  // Invoices filtered by active status
  const activeOnlyInvoices = useMemo(
    () => allInvoices.filter((inv) => activeStudentNames.has(inv.siswa.toLowerCase().trim())),
    [allInvoices, activeStudentNames]
  );

  // Available years discovered across invoices, payments, expenses, and attendance logs
  const availableYears = useMemo(() => {
    const years = new Set<string>([String(new Date().getFullYear())]);
    allInvoices.forEach((inv) => {
      if (inv.jatuh_tempo && inv.jatuh_tempo.length >= 4) years.add(inv.jatuh_tempo.slice(0, 4));
      if (inv.dibuat_pada && inv.dibuat_pada.length >= 4) years.add(inv.dibuat_pada.slice(0, 4));
      inv.riwayat_bayar.forEach((p) => {
        if (p.tanggal && p.tanggal.length >= 4) years.add(p.tanggal.slice(0, 4));
      });
    });
    allExpenses.forEach((exp) => {
      if (exp.tanggal && exp.tanggal.length >= 4) years.add(exp.tanggal.slice(0, 4));
    });
    database.log_absensi.forEach((abs) => {
      if (abs.tanggal && abs.tanggal.length >= 4) years.add(abs.tanggal.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allInvoices, allExpenses, database.log_absensi]);

  const isTimeFiltered = filterYear !== 'all' || filterMonth !== 'all';

  const timeFilterLabel = useMemo(() => {
    const monthName =
      filterMonth !== 'all'
        ? MONTH_OPTIONS.find((m) => m.value === filterMonth)?.label || filterMonth
        : null;
    if (monthName && filterYear !== 'all') return `${monthName} ${filterYear}`;
    if (filterYear !== 'all') return `Tahun ${filterYear}`;
    if (monthName) return `Bulan ${monthName} (Semua Tahun)`;
    return 'Semua Periode';
  }, [filterYear, filterMonth]);

  const handleResetTimeFilter = () => {
    setFilterYear('all');
    setFilterMonth('all');
  };

  const baseScopeInvoices = onlyActiveStudents ? activeOnlyInvoices : allInvoices;

  const timeFilteredScopeInvoices = useMemo(() => {
    if (!isTimeFiltered) return baseScopeInvoices;
    return baseScopeInvoices.filter((inv) => {
      const ref = (inv.jatuh_tempo || inv.dibuat_pada || '').slice(0, 7);
      if (ref.length < 7) return false;
      const [y, m] = ref.split('-');
      if (filterYear !== 'all' && y !== filterYear) return false;
      if (filterMonth !== 'all' && m !== filterMonth) return false;
      return true;
    });
  }, [baseScopeInvoices, filterYear, filterMonth, isTimeFiltered]);

  const filteredInvoices = useMemo(() => {
    return timeFilteredScopeInvoices.filter((inv) => {
      if (campusFilter !== 'all' && inv.cabang !== campusFilter) return false;
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && inv.kategori !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inv.siswa.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          inv.judul.toLowerCase().includes(q) ||
          inv.periode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    timeFilteredScopeInvoices,
    campusFilter,
    statusFilter,
    categoryFilter,
    searchQuery,
  ]);

  const verificationQueue = useMemo(
    () => allInvoices.filter((inv) => inv.status === 'Menunggu Verifikasi'),
    [allInvoices]
  );

  // KPIs focused on Active Scope & Time Filter
  const kpis = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    const unpaidStudentSet = new Set<string>();

    timeFilteredScopeInvoices.forEach((inv) => {
      const net = FinanceService.computeNetAmount(inv);
      const rem = FinanceService.computeRemaining(inv);
      totalBilled += net;
      totalCollected += inv.terbayar;
      if (rem > 0) unpaidStudentSet.add(inv.siswa);
      if (inv.status === 'Jatuh Tempo') overdueCount += 1;
    });

    const totalRemaining = Math.max(0, totalBilled - totalCollected);
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

    return {
      totalBilled,
      totalCollected,
      totalRemaining,
      collectionRate,
      unpaidStudentsCount: unpaidStudentSet.size,
      overdueCount,
      verificationCount: verificationQueue.length,
    };
  }, [timeFilteredScopeInvoices, verificationQueue.length]);

  // Mass Target Preview
  const massTargetStudents = useMemo(() => {
    if (massTargetMode === 'all') return database.master_siswa;
    if (massTargetMode === 'cabang') {
      return database.master_siswa.filter((s) => s.cabang === massCabang);
    }
    const enrolledNames = new Set(
      database.siswa_kelas
        .filter((sk) => sk.id_kelas === massKelasId)
        .map((sk) => sk.siswa.toLowerCase().trim())
    );
    return database.master_siswa.filter((s) => enrolledNames.has(s.siswa.toLowerCase().trim()));
  }, [database.master_siswa, database.siswa_kelas, massTargetMode, massCabang, massKelasId]);

  // Per-Active-Student Ledger
  const studentLedgers = useMemo(() => {
    return database.master_siswa
      .filter((s) => {
        if (campusFilter !== 'all' && s.cabang !== campusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return s.siswa.toLowerCase().includes(q) || s.cabang.toLowerCase().includes(q);
        }
        return true;
      })
      .map((s) => {
        const studentInvoices = activeOnlyInvoices.filter(
          (inv) => inv.siswa.toLowerCase().trim() === s.siswa.toLowerCase().trim()
        );
        const totalTagihan = studentInvoices.reduce(
          (acc, inv) => acc + FinanceService.computeNetAmount(inv),
          0
        );
        const totalTerbayar = studentInvoices.reduce((acc, inv) => acc + inv.terbayar, 0);
        const sisaTunggakan = Math.max(0, totalTagihan - totalTerbayar);
        const unpaidInvoices = studentInvoices.filter(
          (inv) => FinanceService.computeRemaining(inv) > 0
        );
        return {
          student: s,
          invoiceCount: studentInvoices.length,
          totalTagihan,
          totalTerbayar,
          sisaTunggakan,
          unpaidCount: unpaidInvoices.length,
          firstUnpaidInvoice: unpaidInvoices[0] || null,
        };
      })
      .sort((a, b) => b.sisaTunggakan - a.sisaTunggakan);
  }, [database.master_siswa, activeOnlyInvoices, campusFilter, searchQuery]);

  const openPaymentDrawer = (inv: StudentInvoiceItem) => {
    const rem = FinanceService.computeRemaining(inv);
    setPayingInvoice(inv);
    setPayAmount(rem);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod(inv.bukti_konfirmasi?.metode || 'Transfer Bank BSI');
    setPayRef(inv.bukti_konfirmasi?.referensi || '');
    setPayNote('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    const res = FinanceService.recordPayment({
      invoiceId: payingInvoice.id,
      jumlah: payAmount,
      tanggal: payDate,
      metode: payMethod,
      referensi: payRef,
      dicatat_oleh: currentUser.name,
      catatan: payNote || undefined,
    });
    if (!res.success) {
      showToast('Gagal Mencatat Pembayaran', res.message, 'error');
      return;
    }
    showToast('Pembayaran Tercatat', res.message, 'success');
    setPayingInvoice(null);
    setRefreshTick((t) => t + 1);
  };

  const handleApproveConfirmation = (inv: StudentInvoiceItem) => {
    if (!inv.bukti_konfirmasi) return;
    const res = FinanceService.recordPayment({
      invoiceId: inv.id,
      jumlah: inv.bukti_konfirmasi.nominal_bayar,
      tanggal: inv.bukti_konfirmasi.tanggal_bayar,
      metode: inv.bukti_konfirmasi.metode,
      referensi: inv.bukti_konfirmasi.referensi,
      dicatat_oleh: currentUser.name,
      catatan: `Terverifikasi dari konfirmasi ${inv.bukti_konfirmasi.pengirim}`,
    });
    if (res.success) {
      showToast('Transfer Diverifikasi & Lunas', res.message, 'success');
      setRefreshTick((t) => t + 1);
    }
  };

  const handleRejectConfirmation = (inv: StudentInvoiceItem) => {
    const reason = rejectReasons[inv.id] || '';
    const res = FinanceService.rejectParentConfirmation(inv.id, reason);
    showToast('Konfirmasi Dikembalikan', res.message, 'info');
    setRefreshTick((t) => t + 1);
  };

  const handleGenerateMass = (e: React.FormEvent) => {
    e.preventDefault();
    const res = FinanceService.generateMassInvoices({
      targetStudents: massTargetStudents,
      kategori: massCategory,
      periode: massPeriod,
      judul: massTitle,
      nominal: massNominal,
      potongan: massDiscount,
      jatuh_tempo: massDueDate,
      catatan_keuangan: massNote || undefined,
      dibuat_oleh: currentUser.name,
    });
    if (!res.success) {
      showToast('Gagal Menerbitkan Tagihan', res.message, 'error');
      return;
    }
    showToast('Penagihan Massal Diproses', res.message, res.createdCount > 0 ? 'success' : 'info');
    setRefreshTick((t) => t + 1);
    if (res.createdCount > 0) setSubTab('daftar');
  };

  const handleCreateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const targetObj = database.master_siswa.find((s) => s.siswa === singleStudent);
    if (!targetObj) {
      showToast('Siswa Tidak Ditemukan', 'Pilih siswa aktif dari daftar.', 'error');
      return;
    }
    const res = FinanceService.createInvoice({
      siswa: targetObj.siswa,
      cabang: targetObj.cabang,
      kategori: singleCategory,
      periode: singlePeriod,
      judul: singleTitle || `${singleCategory} ${singlePeriod}`,
      nominal: singleNominal,
      potongan: singleDiscount,
      jatuh_tempo: singleDueDate,
      catatan_keuangan: singleNote || undefined,
      dibuat_oleh: currentUser.name,
    });
    if (!res.success) {
      showToast('Gagal Membuat Tagihan', res.message, 'error');
      return;
    }
    showToast('Tagihan Satuan Diterbitkan', res.message, 'success');
    setSingleTitle('');
    setSingleNote('');
    setRefreshTick((t) => t + 1);
    setSubTab('daftar');
  };

  const handleCopyBillingWa = async (inv: StudentInvoiceItem) => {
    const msg = FinanceService.buildWhatsAppBillingMessage(inv);
    try {
      await navigator.clipboard.writeText(msg);
      showToast('Pesan Tagihan Disalin', `Template penagihan WhatsApp untuk ${inv.siswa} siap dikirim.`, 'success');
    } catch {
      showToast('Salin Manual', 'Browser membatasi clipboard otomatis.', 'info');
    }
  };

  const handleDeleteInvoice = (inv: StudentInvoiceItem) => {
    const res = FinanceService.deleteInvoice(inv.id);
    if (res.success) {
      showToast('Tagihan Dihapus', res.message, 'info');
      setRefreshTick((t) => t + 1);
    } else {
      showToast('Tidak Dapat Dihapus', res.message, 'warning');
    }
  };

  const handleExportFinanceCsv = () => {
    const headers = [
      'ID Tagihan',
      'Nama Santri',
      'Status Santri',
      'Kampus',
      'Kategori',
      'Periode',
      'Judul',
      'Nominal',
      'Potongan',
      'Tagihan Bersih',
      'Terbayar',
      'Sisa Tunggakan',
      'Jatuh Tempo',
      'Status Tagihan',
    ];
    const rows = filteredInvoices.map((inv) => {
      const net = FinanceService.computeNetAmount(inv);
      const rem = FinanceService.computeRemaining(inv);
      const isActive = activeStudentNames.has(inv.siswa.toLowerCase().trim());
      return [
        inv.id,
        inv.siswa,
        isActive ? 'Aktif' : 'Non-Aktif/Keluar',
        inv.cabang,
        inv.kategori,
        inv.periode,
        inv.judul,
        inv.nominal,
        inv.potongan,
        net,
        inv.terbayar,
        rem,
        inv.jatuh_tempo,
        inv.status,
      ].map((cell) => SecurityService.escapeCsvCell(cell));
    });

    const csv = '\uFEFF' + [headers.map((h) => SecurityService.escapeCsvCell(h)).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Divisi_Keuangan_Tagihan_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Export CSV Berhasil', `${filteredInvoices.length} baris tagihan diekspor.`, 'success');
  };

  const getStatusTextStyle = (status: StudentInvoiceStatus) => {
    switch (status) {
      case 'Lunas':
        return 'text-emerald-700 font-bold';
      case 'Sebagian':
        return 'text-blue-700 font-bold';
      case 'Menunggu Verifikasi':
        return 'text-purple-700 font-bold';
      case 'Jatuh Tempo':
        return 'text-rose-700 font-extrabold';
      default:
        return 'text-amber-700 font-bold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Divisi Keuangan &amp; Bendahara · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>Kontrol Keuangan &amp; Penagihan Siswa Aktif</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Terhubung langsung dengan data siswa aktif sekolah ({database.master_siswa.length} santri aktif). Kelola SPP bulanan, penagihan massal, cicilan, verifikasi transfer wali murid, dan cetak kwitansi PDF resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => PdfExportService.exportFinanceSummaryPdf(filteredInvoices, currentUser.name)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Laporan Keuangan PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportFinanceCsv}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Time-Based Visualization & Data Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">
              Filter Periode Grafik &amp; Laporan Keuangan
            </div>
            <div className="text-[11px] text-slate-500">
              Menampilkan:{' '}
              <span className="font-bold text-slate-800">{timeFilterLabel}</span>
              {' · '}
              {onlyActiveStudents ? 'Siswa Aktif Saja' : 'Semua Riwayat Tagihan'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="finance-filter-month" className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
              Bulan:
            </label>
            <select
              id="finance-filter-month"
              aria-label="Filter Bulan"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="all">Semua Bulan</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="finance-filter-year" className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
              Tahun:
            </label>
            <select
              id="finance-filter-year"
              aria-label="Filter Tahun"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap shrink-0">
            <input
              type="checkbox"
              checked={onlyActiveStudents}
              onChange={(e) => setOnlyActiveStudents(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span>Siswa Aktif</span>
          </label>

          {isTimeFiltered && (
            <button
              type="button"
              onClick={handleResetTimeFilter}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Periode</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Eksekutif Keuangan (Recharts Metric Cards) */}
      <AdminFinanceExecutiveSummary
        invoices={baseScopeInvoices}
        onlyActiveStudents={onlyActiveStudents}
        activeStudentCount={database.master_siswa.length}
        filterYear={filterYear}
        filterMonth={filterMonth}
      />

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">
            Total Tagihan {onlyActiveStudents ? 'Siswa Aktif' : 'Sekolah'}
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            {FinanceService.formatRupiah(kpis.totalBilled)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            {timeFilteredScopeInvoices.length} tagihan · {timeFilterLabel}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Penerimaan Masuk (Terbayar)</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tabular-nums">
            {FinanceService.formatRupiah(kpis.totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold font-mono tabular-nums">
            Kolektibilitas {kpis.collectionRate}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Sisa Piutang / Tunggakan</div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono tabular-nums">
            {FinanceService.formatRupiah(kpis.totalRemaining)}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold font-mono tabular-nums">
            {kpis.unpaidStudentsCount} santri belum lunas · {kpis.overdueCount} jatuh tempo
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Antrian Verifikasi Transfer</div>
          <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono tabular-nums">
            {kpis.verificationCount} Konfirmasi
          </div>
          <button
            type="button"
            onClick={() => setSubTab('verifikasi')}
            className="text-[11px] text-purple-700 font-bold hover:underline cursor-pointer"
          >
            {kpis.verificationCount > 0 ? 'Buka Antrian Verifikasi →' : 'Semua bukti sudah dicek'}
          </button>
        </div>
      </div>

      {/* Recharts Visualizations: Monthly Income vs Expense BarChart & Student Payment Status PieChart */}
      <AdminFinanceCharts
        invoices={baseScopeInvoices}
        database={database}
        expenses={allExpenses}
        currentUser={currentUser}
        onlyActiveStudents={onlyActiveStudents}
        filterYear={filterYear}
        filterMonth={filterMonth}
        timeFilterLabel={timeFilterLabel}
        onResetTimeFilter={handleResetTimeFilter}
        activeStatusFilter={statusFilter}
        onSelectStatusFilter={(status) => {
          setStatusFilter(status);
          setSubTab('daftar');
        }}
        onExpenseChanged={() => setRefreshTick((t) => t + 1)}
      />

      {/* Prediksi Arus Kas (Cash Flow Forecast) */}
      <AdminFinanceCashFlowForecast
        invoices={baseScopeInvoices}
        database={database}
        expenses={allExpenses}
        onlyActiveStudents={onlyActiveStudents}
        filterYear={filterYear}
        filterMonth={filterMonth}
        timeFilterLabel={timeFilterLabel}
      />

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap bg-white p-1 rounded-xl border border-slate-200 shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setSubTab('daftar')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              subTab === 'daftar' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Kontrol Tagihan ({filteredInvoices.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('terbitkan')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              subTab === 'terbitkan' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat &amp; Generate Tagihan</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('verifikasi')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              subTab === 'verifikasi' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verifikasi Transfer ({kpis.verificationCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('rekap-siswa')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              subTab === 'rekap-siswa' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Buku Besar Santri Aktif ({database.master_siswa.length})</span>
          </button>
        </div>
      </div>

      {/* INLINE PAYMENT RECORDING DRAWER */}
      {payingInvoice && (
        <form
          onSubmit={handleRecordPayment}
          className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                Catat Pembayaran / Cicilan: {payingInvoice.siswa} ({payingInvoice.id})
              </h3>
              <p className="text-xs text-emerald-900/80 mt-0.5">
                {payingInvoice.judul} · Sisa tagihan:{' '}
                <strong className="font-mono">
                  {FinanceService.formatRupiah(FinanceService.computeRemaining(payingInvoice))}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPayingInvoice(null)}
              className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-900">Nominal Masuk (Rp)</label>
              <input
                type="number"
                min={1000}
                max={FinanceService.computeRemaining(payingInvoice) || undefined}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-900">Tanggal Bayar</label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-900">Metode Pembayaran</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethodType)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-semibold"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-900">No. Referensi / Bukti</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="BSI-xxxx / KW-xxxx"
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="Catatan bendahara (opsional, misal: Lunas tahap 2)"
              className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Pembayaran</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUB-TAB 1: KONTROL TAGIHAN SISWA AKTIF */}
      {subTab === 'daftar' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari santri, no. tagihan, periode..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
              >
                <option value="all">Semua Kampus</option>
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as 'all' | StudentBillingCategory)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
              >
                <option value="all">Semua Kategori</option>
                {BILLING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | StudentInvoiceStatus)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
              >
                <option value="all">Semua Status</option>
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Jatuh Tempo">Jatuh Tempo</option>
                <option value="Sebagian">Sebagian</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                <option value="Lunas">Lunas</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyActiveStudents}
                onChange={(e) => setOnlyActiveStudents(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              <span>Fokus Siswa Aktif Saja</span>
            </label>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tagihan &amp; Santri</th>
                  <th className="px-4 py-3 font-semibold">Kategori &amp; Periode</th>
                  <th className="px-4 py-3 font-semibold text-right">Tagihan Bersih</th>
                  <th className="px-4 py-3 font-semibold text-right">Terbayar</th>
                  <th className="px-4 py-3 font-semibold text-right">Sisa</th>
                  <th className="px-4 py-3 font-semibold">Jatuh Tempo</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi Penagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      Tidak ada data tagihan yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const net = FinanceService.computeNetAmount(inv);
                    const rem = FinanceService.computeRemaining(inv);
                    const isActive = activeStudentNames.has(inv.siswa.toLowerCase().trim());

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-slate-900">
                            {inv.siswa}{' '}
                            {!isActive && (
                              <span className="text-[10px] font-mono text-rose-600">
                                (Eks-Siswa)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {inv.id} · {inv.cabang}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{inv.judul}</div>
                          <div className="text-[11px] text-slate-500">
                            {inv.kategori} · {inv.periode}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {FinanceService.formatRupiah(net)}
                          {inv.potongan > 0 && (
                            <div className="text-[10px] text-emerald-700 font-normal">
                              Diskon {FinanceService.formatRupiah(inv.potongan)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {FinanceService.formatRupiah(inv.terbayar)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-rose-700 tabular-nums">
                          {FinanceService.formatRupiah(rem)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {inv.jatuh_tempo}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${getStatusTextStyle(inv.status)}`}>
                          {inv.status}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {rem > 0 && (
                              <button
                                type="button"
                                onClick={() => openPaymentDrawer(inv)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                                title="Catat Pembayaran / Pelunasan"
                              >
                                Bayar
                              </button>
                            )}
                            {rem > 0 && (
                              <button
                                type="button"
                                onClick={() => handleCopyBillingWa(inv)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                                title="Salin Pesan Tagihan WhatsApp"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {inv.terbayar > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  PdfExportService.exportInvoiceReceiptPdf(inv, currentUser.name)
                                }
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                title="Cetak Kwitansi PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {inv.terbayar === 0 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Hapus Tagihan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TERBITKAN TAGIHAN MASSAL & SATUAN */}
      {subTab === 'terbitkan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Mass Generate to Active Students */}
          <form
            onSubmit={handleGenerateMass}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Generate Tagihan Massal ke Siswa Aktif
                </h3>
                <p className="text-[11px] text-slate-500">
                  Otomatis menerbitkan SPP/tagihan ke siswa aktif tanpa duplikasi periode yang sama.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Target Siswa Aktif</label>
                <select
                  value={massTargetMode}
                  onChange={(e) => setMassTargetMode(e.target.value as 'all' | 'cabang' | 'kelas')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="all">Semua Siswa Aktif ({database.master_siswa.length} santri)</option>
                  <option value="cabang">Berdasarkan Kampus / Cabang</option>
                  <option value="kelas">Berdasarkan Kelas / Rombel</option>
                </select>
              </div>

              {massTargetMode === 'cabang' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Pilih Kampus</label>
                  <select
                    value={massCabang}
                    onChange={(e) => setMassCabang(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                  >
                    {campuses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {massTargetMode === 'kelas' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Pilih Kelas</label>
                  <select
                    value={massKelasId}
                    onChange={(e) => setMassKelasId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                  >
                    {database.master_kelas.map((k) => (
                      <option key={k.id_kelas} value={k.id_kelas}>
                        {k.kelas} — {k.mapel}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Kategori Biaya</label>
                <select
                  value={massCategory}
                  onChange={(e) => setMassCategory(e.target.value as StudentBillingCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  {BILLING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Periode Tagihan *</label>
                <input
                  type="text"
                  value={massPeriod}
                  onChange={(e) => setMassPeriod(e.target.value)}
                  placeholder="Contoh: Desember 2026"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Judul / Keterangan Tagihan *</label>
                <input
                  type="text"
                  value={massTitle}
                  onChange={(e) => setMassTitle(e.target.value)}
                  placeholder="Contoh: SPP Bulanan Desember 2026"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nominal Tagihan (Rp) *</label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={massNominal}
                  onChange={(e) => setMassNominal(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Potongan / Subsidi (Rp)</label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={massDiscount}
                  onChange={(e) => setMassDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Batas Jatuh Tempo</label>
                <input
                  type="date"
                  value={massDueDate}
                  onChange={(e) => setMassDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Catatan Tambahan</label>
                <input
                  type="text"
                  value={massNote}
                  onChange={(e) => setMassNote(e.target.value)}
                  placeholder="Opsional..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Target penerbitan:{' '}
                <strong className="text-slate-900 font-mono">{massTargetStudents.length} santri aktif</strong>
              </span>
              <span className="font-mono font-extrabold text-emerald-700">
                Netto / Santri: {FinanceService.formatRupiah(Math.max(0, massNominal - massDiscount))}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Terbitkan Tagihan Massal ({massTargetStudents.length} Santri Aktif)</span>
            </button>
          </form>

          {/* Individual Invoice Form */}
          <form
            onSubmit={handleCreateSingle}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 h-fit"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Buat Tagihan Satuan</h3>
                <p className="text-[11px] text-slate-500">
                  Khusus penagihan personal, uang pangkal, atau keringanan khusus.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Pilih Siswa Aktif</label>
                <select
                  value={singleStudent}
                  onChange={(e) => setSingleStudent(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  {database.master_siswa.map((s) => (
                    <option key={s.siswa} value={s.siswa}>
                      {s.siswa} ({s.cabang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kategori</label>
                  <select
                    value={singleCategory}
                    onChange={(e) => setSingleCategory(e.target.value as StudentBillingCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                  >
                    {BILLING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Periode</label>
                  <input
                    type="text"
                    value={singlePeriod}
                    onChange={(e) => setSinglePeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Judul Tagihan *</label>
                <input
                  type="text"
                  value={singleTitle}
                  onChange={(e) => setSingleTitle(e.target.value)}
                  placeholder="Contoh: Biaya Study Tour / Uang Pangkal Tahap 2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nominal (Rp)</label>
                  <input
                    type="number"
                    min={1000}
                    value={singleNominal}
                    onChange={(e) => setSingleNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Potongan / Beasiswa</label>
                  <input
                    type="number"
                    min={0}
                    value={singleDiscount}
                    onChange={(e) => setSingleDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Jatuh Tempo</label>
                <input
                  type="date"
                  value={singleDueDate}
                  onChange={(e) => setSingleDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Catatan Keuangan</label>
                <input
                  type="text"
                  value={singleNote}
                  onChange={(e) => setSingleNote(e.target.value)}
                  placeholder="Keterangan beasiswa atau cicilan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Terbitkan Tagihan Satuan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: VERIFIKASI KONFIRMASI TRANSFER WALI MURID */}
      {subTab === 'verifikasi' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">
              Antrian Verifikasi Konfirmasi Pembayaran Wali Murid
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cocokkan nomor referensi mutasi bank dari Portal Santri lalu sahkan untuk memperbarui status tagihan secara otomatis.
            </p>
          </div>

          {verificationQueue.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-9 h-9 text-emerald-300 mx-auto mb-2" />
              Tidak ada konfirmasi transfer yang menunggu verifikasi saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {verificationQueue.map((inv) => {
                const bukti = inv.bukti_konfirmasi;
                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {inv.siswa} · <span className="font-mono text-purple-800">{inv.id}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {inv.judul} ({inv.periode}) · Sisa Tagihan:{' '}
                          <strong className="font-mono">
                            {FinanceService.formatRupiah(FinanceService.computeRemaining(inv))}
                          </strong>
                        </div>
                      </div>

                      {bukti && (
                        <div className="text-right font-mono">
                          <div className="text-xs text-slate-500">Nominal Konfirmasi</div>
                          <div className="text-base font-black text-emerald-700 tabular-nums">
                            {FinanceService.formatRupiah(bukti.nominal_bayar)}
                          </div>
                        </div>
                      )}
                    </div>

                    {bukti && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-purple-100 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400">Pengirim</div>
                          <div className="font-bold text-slate-800">{bukti.pengirim}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Metode &amp; Tanggal</div>
                          <div className="font-semibold text-slate-800">
                            {bukti.metode} · {bukti.tanggal_bayar}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">No. Referensi</div>
                          <div className="font-mono font-bold text-blue-700">{bukti.referensi}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Catatan Pengirim</div>
                          <div className="text-slate-600">{bukti.catatan || '—'}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <input
                        type="text"
                        value={rejectReasons[inv.id] || ''}
                        onChange={(e) =>
                          setRejectReasons((prev) => ({ ...prev, [inv.id]: e.target.value }))
                        }
                        placeholder="Alasan penolakan (jika bukti belum ditemukan di mutasi)..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRejectConfirmation(inv)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak Bukti</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveConfirmation(inv)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verifikasi &amp; Catat Lunas</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: BUKU BESAR PER SISWA AKTIF */}
      {subTab === 'rekap-siswa' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Buku Besar Keuangan per Siswa Aktif
              </h3>
              <p className="text-xs text-slate-500">
                Memantau kewajiban &amp; tunggakan seluruh santri yang berstatus aktif di sekolah.
              </p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari santri aktif..."
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">No</th>
                  <th className="px-4 py-3 font-semibold">Nama Santri Aktif</th>
                  <th className="px-4 py-3 font-semibold text-center">Jml Tagihan</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Tagihan</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Terbayar</th>
                  <th className="px-4 py-3 font-semibold text-right">Sisa Tunggakan</th>
                  <th className="px-4 py-3 font-semibold">Status Keuangan</th>
                  <th className="px-4 py-3 font-semibold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentLedgers.map((row, idx) => (
                  <tr key={row.student.siswa} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-900">{row.student.siswa}</div>
                      <div className="text-[11px] text-slate-500">{row.student.cabang}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold tabular-nums">
                      {row.invoiceCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {FinanceService.formatRupiah(row.totalTagihan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {FinanceService.formatRupiah(row.totalTerbayar)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-rose-700 tabular-nums">
                      {FinanceService.formatRupiah(row.sisaTunggakan)}
                    </td>
                    <td className="px-4 py-3">
                      {row.invoiceCount === 0 ? (
                        <span className="text-slate-400 font-medium">Belum ada tagihan</span>
                      ) : row.sisaTunggakan === 0 ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lunas Semua
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {row.unpaidCount} Tagihan Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {row.firstUnpaidInvoice && (
                          <button
                            type="button"
                            onClick={() => handleCopyBillingWa(row.firstUnpaidInvoice!)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold cursor-pointer"
                          >
                            Salin Tagih WA
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSingleStudent(row.student.siswa);
                            setSubTab('terbitkan');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold cursor-pointer"
                        >
                          + Tagih
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
