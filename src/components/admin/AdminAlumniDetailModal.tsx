import React, { useEffect, useState } from 'react';
import { AlumniContactStatus, AlumniRecord } from '../../types';
import { resolveAlumniGeo, resolveAlumniUniversityCategory } from './alumniGeoData';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  School,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

interface AdminAlumniDetailModalProps {
  alumni: AlumniRecord | null;
  onClose: () => void;
  onEdit: (alumni: AlumniRecord) => void;
  onVerifyContact: (alumni: AlumniRecord) => void;
  buildWhatsAppHref: (phone: string, alumniName: string, yearGraduated: number) => string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function normalizeSafeLinkedinUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-') return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) return null;
  if (lower.startsWith('https://') || lower.startsWith('http://')) return trimmed;
  return `https://${trimmed}`;
}

function getContactBadgeStyle(status: AlumniContactStatus) {
  switch (status) {
    case 'Aktif Terhubung':
      return {
        textClass: 'text-emerald-700',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
      };
    case 'Perlu Verifikasi':
      return {
        textClass: 'text-amber-700',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
      };
    case 'Menunggu Respon':
      return {
        textClass: 'text-blue-700',
        icon: <Clock className="w-4 h-4 text-blue-600 shrink-0" />,
      };
    case 'Nomor Tidak Aktif':
      return {
        textClass: 'text-rose-700',
        icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0" />,
      };
  }
}

export function AdminAlumniDetailModal({
  alumni,
  onClose,
  onEdit,
  onVerifyContact,
  buildWhatsAppHref,
}: AdminAlumniDetailModalProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    if (!alumni) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alumni, onClose]);

  useEffect(() => {
    setCopiedPhone(false);
  }, [alumni?.id]);

  if (!alumni) return null;

  const geo = resolveAlumniGeo(alumni);
  const universityCategory = resolveAlumniUniversityCategory(alumni);
  const contactStyle = getContactBadgeStyle(alumni.status_kontak);
  const linkedinHref = normalizeSafeLinkedinUrl(alumni.linkedin_url);
  const studyDuration = Math.max(1, alumni.tahun_lulus - alumni.tahun_masuk);
  const updatedFormatted = alumni.updated_at
    ? new Date(alumni.updated_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(alumni.telepon_wa);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      // Clipboard API fallback ignored safely
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alumni-detail-modal-title"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {getInitials(alumni.nama)}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 tabular-nums">
                <span className="font-mono font-semibold text-slate-700">
                  {alumni.nis_alumni}
                </span>
                <span aria-hidden="true">·</span>
                <span>{alumni.angkatan}</span>
                <span aria-hidden="true">·</span>
                <span>Lulus {alumni.tahun_lulus}</span>
                {alumni.bersedia_mentoring && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-emerald-700">Mentor Aktif</span>
                  </>
                )}
              </div>
              <h3
                id="alumni-detail-modal-title"
                className="text-lg md:text-xl font-bold text-slate-900 truncate"
              >
                {alumni.nama}
              </h3>
              <p className="text-xs text-slate-600 truncate">
                {alumni.profesi_saat_ini} · {alumni.instansi_atau_kampus}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail alumni"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-xs">
          {/* Section 1: Riwayat Pendidikan Lengkap */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Riwayat Pendidikan Lengkap</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pendidikan Menengah */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <School className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Pendidikan Menengah (AL-WILDAN 3 BSD)</span>
                </div>

                <dl className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Kampus Asal</dt>
                    <dd className="font-semibold text-slate-900 text-right">
                      {alumni.kampus_asal}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Kelas Terakhir</dt>
                    <dd className="font-medium text-slate-800 text-right">
                      {alumni.kelas_terakhir}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Tahun Masuk – Lulus</dt>
                    <dd className="font-mono font-semibold text-slate-900 tabular-nums text-right">
                      {alumni.tahun_masuk} – {alumni.tahun_lulus} ({studyDuration} tahun)
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Angkatan</dt>
                    <dd className="font-medium text-slate-800 text-right">{alumni.angkatan}</dd>
                  </div>
                </dl>
              </div>

              {/* Pendidikan Tinggi / Studi Lanjut */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Pendidikan Tinggi & Penerimaan Kampus</span>
                </div>

                <dl className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Kampus Diterima</dt>
                    <dd className="font-bold text-slate-900 text-right">
                      {alumni.kampus_diterima}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Kategori PT</dt>
                    <dd className="font-semibold text-emerald-700 text-right">
                      {universityCategory}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Jurusan / Prodi</dt>
                    <dd className="font-semibold text-slate-800 text-right">
                      {alumni.jurusan_diterima}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Tahun Diterima</dt>
                    <dd className="font-mono font-semibold text-slate-900 tabular-nums text-right">
                      {alumni.tahun_diterima}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">Jalur Masuk</dt>
                    <dd className="font-semibold text-indigo-700 text-right">
                      {alumni.jalur_masuk_kampus}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* Section 2: Karier & Domisili */}
          <section className="pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Karier, Profesi & Lokasi Domisili</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 rounded-xl border border-slate-200 p-4">
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500">Profesi Saat Ini</div>
                <div className="font-semibold text-slate-900">{alumni.profesi_saat_ini}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500">Sektor Karier</div>
                <div className="font-medium text-slate-800">{alumni.sektor_karier}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Instansi / Kampus</span>
                </div>
                <div className="font-medium text-slate-800">{alumni.instansi_atau_kampus}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Kota & Wilayah</span>
                </div>
                <div className="font-medium text-slate-800">
                  {alumni.kota_domisili} ({geo.province})
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Detail Kontak & Tautan LinkedIn */}
          <section className="pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Detail Kontak & Jejaring Profesional</span>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 font-semibold ${contactStyle.textClass}`}
              >
                {contactStyle.icon}
                <span>{alumni.status_kontak}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* WhatsApp & Telepon */}
              <div className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="text-[11px] text-slate-500">Nomor WhatsApp</div>
                  <div className="font-mono font-semibold text-slate-900 tabular-nums">
                    {alumni.telepon_wa}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Kontak terakhir: {alumni.terakhir_dihubungi || 'Belum pernah dicatat'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    title="Salin nomor WhatsApp"
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {copiedPhone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={buildWhatsAppHref(alumni.telepon_wa, alumni.nama, alumni.tahun_lulus)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="text-[11px] text-slate-500">Alamat Email</div>
                  <div className="font-medium text-slate-900 truncate">
                    {alumni.email && alumni.email !== '-' ? alumni.email : 'Belum diisi'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mentoring:{' '}
                    <span className="font-medium text-slate-700">
                      {alumni.bersedia_mentoring
                        ? 'Bersedia membimbing santri'
                        : 'Belum terdaftar mentor'}
                    </span>
                  </div>
                </div>
                {alumni.email && alumni.email !== '-' && (
                  <a
                    href={`mailto:${alumni.email}`}
                    className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kirim Email</span>
                  </a>
                )}
              </div>
            </div>

            {/* Tautan Profil LinkedIn */}
            <div className="rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#0a66c2]/10 text-[#0a66c2] flex items-center justify-center shrink-0">
                  <Linkedin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Profil LinkedIn
                  </div>
                  {linkedinHref ? (
                    <div className="font-medium text-slate-900 truncate">
                      {linkedinHref.replace(/^https?:\/\/(www\.)?/i, '')}
                    </div>
                  ) : (
                    <div className="text-slate-500">
                      Tautan profil LinkedIn belum ditambahkan untuk alumni ini.
                    </div>
                  )}
                </div>
              </div>

              {linkedinHref ? (
                <a
                  href={linkedinHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3.5 rounded-xl bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <span>Buka Profil LinkedIn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit(alumni)}
                  className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tambahkan LinkedIn</span>
                </button>
              )}
            </div>
          </section>

          {/* Section 4: Catatan & Metadata */}
          {(alumni.catatan || alumni.updated_at) && (
            <section className="pt-5 border-t border-slate-100 space-y-2">
              {alumni.catatan && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Catatan Jejaring & Prestasi
                  </div>
                  <p className="text-slate-700 leading-relaxed">{alumni.catatan}</p>
                </div>
              )}
              <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 tabular-nums">
                <span>Diperbarui: {updatedFormatted}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {alumni.synced_to_sheets
                    ? 'Tersinkron ke Google Sheets'
                    : 'Tersimpan lokal (menunggu sync Sheets)'}
                </span>
              </div>
            </section>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:px-6 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {alumni.status_kontak !== 'Aktif Terhubung' && (
              <button
                type="button"
                onClick={() => onVerifyContact(alumni)}
                className="py-2 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                Tandai Kontak Aktif
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(alumni)}
              className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Profil</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
