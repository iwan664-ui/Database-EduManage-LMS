import React, { useEffect, useState } from 'react';
import {
  EmailReportItemPayload,
  ParentReportEmailService,
} from '../../services/parentReportEmailService';
import { useToast } from '../Toast';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Mail,
  Send,
  X,
} from 'lucide-react';

interface EmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  items: EmailReportItemPayload[];
  onEmailRecorded: (
    sentItems: EmailReportItemPayload[],
    method: 'Aplikasi Email (Mailto)' | 'Google Apps Script' | 'Salin Konten'
  ) => void;
}

export function EmailDispatchModal({
  isOpen,
  onClose,
  title,
  subtitle,
  items,
  onEmailRecorded,
}: EmailDispatchModalProps) {
  const { showToast } = useToast();
  const [editableItems, setEditableItems] = useState<EmailReportItemPayload[]>(items);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [sentStudents, setSentStudents] = useState<Record<string, boolean>>({});
  const [copiedStudent, setCopiedStudent] = useState<string | null>(null);
  const [isSendingAppsScript, setIsSendingAppsScript] = useState<boolean>(false);
  const [confirmAppsScript, setConfirmAppsScript] = useState<boolean>(false);

  const hasAppsScript = ParentReportEmailService.hasAppsScriptConfigured();

  useEffect(() => {
    if (isOpen) {
      setEditableItems(items);
      setEditingStudent(null);
      setSentStudents({});
      setConfirmAppsScript(false);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const validItems = editableItems.filter((it) => ParentReportEmailService.isValidEmail(it.to));
  const invalidCount = editableItems.length - validItems.length;
  const sentCount = Object.values(sentStudents).filter(Boolean).length;

  const handleUpdateEmail = (siswa: string, newEmail: string) => {
    setEditableItems((prev) =>
      prev.map((it) => {
        if (it.siswa !== siswa) return it;
        const updatedBody = it.body.replace(
          /Email Wali\s*:\s*[^\n]*/,
          `Email Wali    : ${newEmail.trim()}`
        );
        return { ...it, to: newEmail, body: updatedBody };
      })
    );
  };

  const handleSaveEmailEdit = (siswa: string, email: string) => {
    ParentReportEmailService.saveGuardianEmail(siswa, email);
    setEditingStudent(null);
    showToast('Email Wali Diperbarui', `Email wali ${siswa} disimpan ke ${email.trim()}.`, 'success');
  };

  const handleOpenMailClient = (item: EmailReportItemPayload) => {
    if (!ParentReportEmailService.isValidEmail(item.to)) {
      showToast('Email Tidak Valid', `Mohon lengkapi alamat email wali untuk ${item.siswa}.`, 'warning');
      return;
    }
    ParentReportEmailService.saveGuardianEmail(item.siswa, item.to);
    setSentStudents((prev) => ({ ...prev, [item.siswa]: true }));
    onEmailRecorded([item], 'Aplikasi Email (Mailto)');
    const mailtoUrl = ParentReportEmailService.buildMailtoUrl(item.to, item.subject, item.body);
    window.location.href = mailtoUrl;
  };

  const handleCopyEmail = (item: EmailReportItemPayload) => {
    const formatted = `Kepada: ${item.to}\nSubjek: ${item.subject}\n\n${item.body}`;
    navigator.clipboard.writeText(formatted);
    setCopiedStudent(item.siswa);
    setTimeout(() => setCopiedStudent(null), 2000);
    setSentStudents((prev) => ({ ...prev, [item.siswa]: true }));
    onEmailRecorded([item], 'Salin Konten');
    showToast('Email Disalin', `Format email rapor ${item.siswa} untuk ${item.to} berhasil disalin.`, 'success');
  };

  const handleSendAllViaAppsScript = async () => {
    if (validItems.length === 0) {
      showToast('Tidak Ada Email Valid', 'Pastikan alamat email wali santri sudah terisi dengan benar.', 'warning');
      return;
    }
    setIsSendingAppsScript(true);
    try {
      const result = await ParentReportEmailService.sendEmailsViaAppsScript(validItems);
      if (result.success) {
        const nextSent: Record<string, boolean> = {};
        validItems.forEach((it) => {
          nextSent[it.siswa] = true;
        });
        setSentStudents(nextSent);
        onEmailRecorded(validItems, 'Google Apps Script');
        showToast('Pengiriman Massal Berhasil', result.message, 'success');
        setConfirmAppsScript(false);
      } else {
        showToast('Gagal Kirim via Apps Script', result.message, 'error');
      }
    } finally {
      setIsSendingAppsScript(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary & Action Strip */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 tabular-nums">
            <span>
              Total Santri: <strong className="text-slate-900">{editableItems.length}</strong>
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>
              Email Valid: <strong className="text-emerald-700">{validItems.length}</strong>
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>
              Diproses: <strong className="text-blue-700">{sentCount}</strong>
            </span>
            {invalidCount > 0 && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-rose-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {invalidCount} email belum valid
                </span>
              </>
            )}
          </div>

          {hasAppsScript ? (
            !confirmAppsScript ? (
              <button
                type="button"
                onClick={() => setConfirmAppsScript(true)}
                disabled={validItems.length === 0 || isSendingAppsScript}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Otomatis Semua ({validItems.length} Email)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmAppsScript(false)}
                  disabled={isSendingAppsScript}
                  className="py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendAllViaAppsScript}
                  disabled={isSendingAppsScript}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSendingAppsScript ? 'Mengirim...' : `Konfirmasi Kirim ${validItems.length} Email`}</span>
                </button>
              </div>
            )
          ) : (
            <span className="text-[11px] text-slate-500">
              Gunakan tombol <strong>Kirim Email</strong> per santri atau salin isi email untuk masing-masing wali.
            </span>
          )}
        </div>

        {/* Recipient List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {editableItems.map((item, idx) => {
            const isValid = ParentReportEmailService.isValidEmail(item.to);
            const isEditing = editingStudent === item.siswa;
            const isSent = Boolean(sentStudents[item.siswa]);
            const isCopied = copiedStudent === item.siswa;

            return (
              <div
                key={`${item.siswa}_${idx}`}
                className={`px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                  isSent ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums w-5">
                      {idx + 1}.
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.siswa}</span>
                    {isSent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tercatat Terkirim
                      </span>
                    )}
                  </div>

                  {item.metaLabel && (
                    <div className="text-[11px] text-slate-500 pl-7">{item.metaLabel}</div>
                  )}

                  <div className="pl-7 flex flex-wrap items-center gap-2 pt-0.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 w-full max-w-md">
                        <input
                          type="email"
                          value={item.to}
                          onChange={(e) => handleUpdateEmail(item.siswa, e.target.value)}
                          placeholder="wali.santri@email.com"
                          className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-blue-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEmailEdit(item.siswa, item.to)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    ) : (
                      <>
                        <span
                          className={`text-xs font-mono ${
                            isValid ? 'text-slate-700' : 'text-rose-600 font-semibold'
                          }`}
                        >
                          {item.to || 'Email wali belum diisi'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingStudent(item.siswa)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Ubah Email Wali</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-7 md:pl-0">
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(item)}
                    className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin' : 'Salin Isi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenMailClient(item)}
                    disabled={!isValid}
                    className="py-1.5 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Kirim Email</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            Setiap email dikirim ke alamat email wali masing-masing dengan format rapor resmi sekolah.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold self-end sm:self-auto cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
