import React, { useMemo, useState } from 'react';
import { PaymentMethodType, StudentInvoiceItem } from '../../types';
import { FinanceService } from '../../services/financeService';
import { PdfExportService } from '../../services/pdfExportService';
import { useToast } from '../Toast';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Send,
  Wallet,
  X,
} from 'lucide-react';

interface StudentFinanceViewProps {
  studentName: string;
}

const PAYMENT_METHODS: PaymentMethodType[] = [
  'Transfer Bank BSI',
  'Virtual Account',
  'QRIS Sekolah',
  'Tunai Loket',
];

export function StudentFinanceView({ studentName }: StudentFinanceViewProps) {
  const { showToast } = useToast();
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Confirmation Drawer State
  const [confirmingInvoice, setConfirmingInvoice] = useState<StudentInvoiceItem | null>(null);
  const [metode, setMetode] = useState<PaymentMethodType>('Transfer Bank BSI');
  const [tanggalBayar, setTanggalBayar] = useState<string>(new Date().toISOString().split('T')[0]);
  const [nominalBayar, setNominalBayar] = useState<number>(0);
  const [referensi, setReferensi] = useState<string>('');
  const [pengirim, setPengirim] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  const myInvoices = useMemo<StudentInvoiceItem[]>(() => {
    void refreshTick;
    return FinanceService.getAllInvoices().filter(
      (inv) => inv.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
  }, [studentName, refreshTick]);

  const totals = useMemo(() => {
    let billed = 0;
    let paid = 0;
    myInvoices.forEach((inv) => {
      billed += FinanceService.computeNetAmount(inv);
      paid += inv.terbayar;
    });
    return {
      billed,
      paid,
      remaining: Math.max(0, billed - paid),
    };
  }, [myInvoices]);

  const openConfirmModal = (inv: StudentInvoiceItem) => {
    const rem = FinanceService.computeRemaining(inv);
    setConfirmingInvoice(inv);
    setNominalBayar(rem);
    setTanggalBayar(new Date().toISOString().split('T')[0]);
    setMetode('Transfer Bank BSI');
    setReferensi('');
    setPengirim('');
    setCatatan('');
  };

  const handleSubmitConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingInvoice) return;

    const res = FinanceService.submitParentConfirmation(confirmingInvoice.id, {
      metode,
      tanggal_bayar: tanggalBayar,
      nominal_bayar: nominalBayar,
      referensi,
      pengirim,
      catatan: catatan || undefined,
    });

    if (!res.success) {
      showToast('Gagal Mengirim Konfirmasi', res.message, 'error');
      return;
    }

    showToast('Konfirmasi Dikirim', res.message, 'success');
    setConfirmingInvoice(null);
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Divisi Keuangan &amp; Administrasi SPP · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>Tagihan Pendidikan &amp; Pembayaran SPP Santri</span>
          </h3>
          <p className="text-xs text-slate-500">
            Pantau rincian tagihan SPP, lakukan konfirmasi transfer agar segera diverifikasi Bendahara, dan unduh kwitansi PDF resmi.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 font-mono tabular-nums text-xs shrink-0">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-sans font-semibold text-slate-500">Total Tagihan</div>
            <div className="text-sm sm:text-base font-black text-slate-900">
              {FinanceService.formatRupiah(totals.billed)}
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] font-sans font-semibold text-emerald-700">Terbayar</div>
            <div className="text-sm sm:text-base font-black text-emerald-900">
              {FinanceService.formatRupiah(totals.paid)}
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-[10px] font-sans font-semibold text-rose-700">Sisa Tagihan</div>
            <div className="text-sm sm:text-base font-black text-rose-900">
              {FinanceService.formatRupiah(totals.remaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Form Drawer */}
      {confirmingInvoice && (
        <form
          onSubmit={handleSubmitConfirmation}
          className="bg-blue-50 border border-blue-300 rounded-2xl p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                Konfirmasi Pembayaran: {confirmingInvoice.judul} ({confirmingInvoice.id})
              </h4>
              <p className="text-xs text-blue-900/80 mt-0.5">
                Rekening Tujuan: Bank Syariah Indonesia (BSI) · 7123-4567-89 a.n. Yayasan AL-WILDAN 3 BSD CITY
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmingInvoice(null)}
              className="p-1.5 rounded-lg text-blue-800 hover:bg-blue-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-blue-900">Nama Pengirim / Wali *</label>
              <input
                type="text"
                value={pengirim}
                onChange={(e) => setPengirim(e.target.value)}
                placeholder="Nama pemilik rekening"
                className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-blue-900">Nominal Transfer (Rp) *</label>
              <input
                type="number"
                min={1000}
                value={nominalBayar}
                onChange={(e) => setNominalBayar(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white text-xs font-mono font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-blue-900">Metode</label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as PaymentMethodType)}
                className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white text-xs font-semibold"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-blue-900">Tanggal &amp; No. Referensi *</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={tanggalBayar}
                  onChange={(e) => setTanggalBayar(e.target.value)}
                  className="px-2 py-2 rounded-xl border border-blue-300 bg-white text-[11px] font-mono"
                  required
                />
                <input
                  type="text"
                  value={referensi}
                  onChange={(e) => setReferensi(e.target.value)}
                  placeholder="Ref/Struk"
                  className="px-2.5 py-2 rounded-xl border border-blue-300 bg-white text-xs font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan (misal: transfer pukul 10:15 WIB)"
              className="flex-1 px-3 py-2 rounded-xl border border-blue-300 bg-white text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Konfirmasi ke Bendahara</span>
            </button>
          </div>
        </form>
      )}

      {/* Invoice Cards */}
      {myInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-xs text-slate-500">
          Belum ada tagihan keuangan yang diterbitkan untuk {studentName}.
        </div>
      ) : (
        <div className="space-y-3.5">
          {myInvoices.map((inv) => {
            const net = FinanceService.computeNetAmount(inv);
            const rem = FinanceService.computeRemaining(inv);

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {inv.id} · {inv.kategori} · Jatuh Tempo {inv.jatuh_tempo}
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                      {inv.judul}
                    </h4>
                    <div className="text-xs text-slate-500">Periode: {inv.periode}</div>
                    {inv.catatan_keuangan && (
                      <div className="text-[11px] text-blue-700 mt-1">{inv.catatan_keuangan}</div>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 font-mono tabular-nums">
                    <span
                      className={`text-xs font-extrabold flex items-center gap-1 ${
                        inv.status === 'Lunas'
                          ? 'text-emerald-700'
                          : inv.status === 'Menunggu Verifikasi'
                            ? 'text-purple-700'
                            : inv.status === 'Jatuh Tempo'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                      }`}
                    >
                      {inv.status === 'Lunas' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {inv.status === 'Menunggu Verifikasi' && <Clock className="w-3.5 h-3.5" />}
                      {(inv.status === 'Jatuh Tempo' || inv.status === 'Belum Bayar') && (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{inv.status}</span>
                    </span>
                    <div className="text-base font-black text-slate-900">
                      {FinanceService.formatRupiah(net)}
                    </div>
                    {inv.potongan > 0 && (
                      <div className="text-[10px] text-emerald-700">
                        Potongan/Beasiswa: {FinanceService.formatRupiah(inv.potongan)}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-600">
                      Terbayar: <strong className="text-emerald-700">{FinanceService.formatRupiah(inv.terbayar)}</strong>{' '}
                      · Sisa: <strong className="text-rose-700">{FinanceService.formatRupiah(rem)}</strong>
                    </div>
                  </div>
                </div>

                {/* Payment History if any */}
                {inv.riwayat_bayar.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="text-[11px] font-bold text-slate-600">Riwayat Transaksi:</div>
                    {inv.riwayat_bayar.map((pay) => (
                      <div
                        key={pay.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-50 px-3 py-1.5 rounded-lg"
                      >
                        <span className="font-mono text-slate-600">
                          {pay.tanggal} · {pay.metode} ({pay.referensi})
                        </span>
                        <span className="font-mono font-bold text-emerald-700 tabular-nums">
                          +{FinanceService.formatRupiah(pay.jumlah)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  {inv.terbayar > 0 && (
                    <button
                      type="button"
                      onClick={() => PdfExportService.exportInvoiceReceiptPdf(inv, studentName)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Kwitansi PDF</span>
                    </button>
                  )}

                  {rem > 0 && inv.status !== 'Menunggu Verifikasi' && (
                    <button
                      type="button"
                      onClick={() => openConfirmModal(inv)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Konfirmasi Pembayaran</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
