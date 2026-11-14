import React, { useMemo, useState } from 'react';
import {
  StudentAchievementItem,
  StudentLeaveRequest,
  TeacherCounselingNote,
} from '../../types';
import { PortalSupportService } from '../../services/portalSupportService';
import { useToast } from '../Toast';
import {
  Award,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  FileCheck2,
  HeartHandshake,
  Plus,
  ShieldCheck,
  Trophy,
  XCircle,
} from 'lucide-react';

interface StudentSupportViewProps {
  studentName: string;
  cabang: string;
}

export function StudentLeaveRequestView({ studentName, cabang }: StudentSupportViewProps) {
  const { showToast } = useToast();
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const today = new Date().toISOString().split('T')[0];
  const [jenis, setJenis] = useState<'Izin' | 'Sakit'>('Izin');
  const [tanggalMulai, setTanggalMulai] = useState<string>(today);
  const [tanggalSelesai, setTanggalSelesai] = useState<string>(today);
  const [namaWali, setNamaWali] = useState<string>('');
  const [kontakWali, setKontakWali] = useState<string>('');
  const [alasan, setAlasan] = useState<string>('');

  const myRequests = useMemo<StudentLeaveRequest[]>(() => {
    void refreshTick;
    return PortalSupportService.getLeaveRequests().filter(
      (r) => r.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
  }, [studentName, refreshTick]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = PortalSupportService.submitLeaveRequest({
      siswa: studentName,
      cabang,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      jenis,
      alasan,
      nama_wali: namaWali,
      kontak_wali: kontakWali,
    });

    if (!res.success) {
      showToast('Gagal Mengirim Pengajuan', res.message, 'error');
      return;
    }

    setAlasan('');
    setRefreshTick((t) => t + 1);
    showToast('Pengajuan Terkirim', res.message, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Layanan Orang Tua & Santri · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            Pengajuan Izin & Surat Sakit Online
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kirim permohonan izin atau keterangan sakit secara resmi agar langsung diterima oleh Guru & Tata Usaha sekolah.
          </p>
        </div>

        <div className="font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 tabular-nums shrink-0">
          <span className="text-slate-500">Total Ajuan: </span>
          <strong className="text-slate-900">{myRequests.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ClipboardPlus className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-extrabold text-slate-900">Buat Pengajuan Baru</h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['Izin', 'Sakit'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setJenis(opt)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                  jenis === opt
                    ? opt === 'Izin'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {opt === 'Izin' ? 'Surat Izin' : 'Keterangan Sakit'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Tanggal Mulai</label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Tanggal Selesai</label>
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Nama Orang Tua / Wali *</label>
              <input
                type="text"
                value={namaWali}
                onChange={(e) => setNamaWali(e.target.value)}
                placeholder="Nama Ayah/Ibu/Wali"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">No. WhatsApp Wali *</label>
              <input
                type="text"
                value={kontakWali}
                onChange={(e) => setKontakWali(e.target.value)}
                placeholder="08xx-xxxx-xxxx"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Alasan / Keterangan Resmi *</label>
            <textarea
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Tuliskan alasan ketidakhadiran secara jelas..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Kirim Pengajuan ke Guru & Sekolah</span>
          </button>
        </form>

        {/* Status History */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900">Riwayat & Status Persetujuan</h4>
            <span className="text-[11px] font-mono text-slate-500">{studentName}</span>
          </div>

          {myRequests.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Belum ada pengajuan izin atau surat sakit untuk santri ini.
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-slate-900">
                      {req.jenis} ·{' '}
                      <span className="font-mono text-slate-600 tabular-nums">
                        {req.tanggal_mulai}
                        {req.tanggal_selesai !== req.tanggal_mulai ? ` s/d ${req.tanggal_selesai}` : ''}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        req.status === 'Disetujui'
                          ? 'text-emerald-700'
                          : req.status === 'Ditolak'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {req.status === 'Disetujui' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {req.status === 'Ditolak' && <XCircle className="w-3.5 h-3.5" />}
                      {req.status === 'Menunggu' && <Clock className="w-3.5 h-3.5" />}
                      <span>{req.status}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">{req.alasan}</p>
                  <div className="text-[11px] text-slate-500">
                    Diajukan oleh wali: <strong>{req.nama_wali}</strong> ({req.kontak_wali})
                  </div>

                  {req.catatan_guru && (
                    <div className="text-[11px] bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700">
                      <span className="font-bold text-blue-700">Catatan {req.ditanggapi_oleh}:</span>{' '}
                      {req.catatan_guru}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentAchievementPortfolioView({ studentName }: { studentName: string }) {
  const { showToast } = useToast();
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const [judul, setJudul] = useState<string>('');
  const [kategori, setKategori] = useState<StudentAchievementItem['kategori']>('Sains & Akademik');
  const [tingkat, setTingkat] = useState<StudentAchievementItem['tingkat']>('Sekolah');
  const [peringkat, setPeringkat] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [penyelenggara, setPenyelenggara] = useState<string>('');

  const achievements = useMemo<StudentAchievementItem[]>(() => {
    void refreshTick;
    return PortalSupportService.getAchievements().filter(
      (a) => a.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
  }, [studentName, refreshTick]);

  const counselingNotes = useMemo<TeacherCounselingNote[]>(() => {
    void refreshTick;
    return PortalSupportService.getCounselingNotes().filter(
      (c) => c.siswa.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
  }, [studentName, refreshTick]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !peringkat.trim()) {
      showToast('Data Belum Lengkap', 'Isi judul prestasi dan peringkat yang diraih.', 'warning');
      return;
    }

    PortalSupportService.addAchievement(
      {
        siswa: studentName,
        judul,
        kategori,
        tingkat,
        peringkat,
        tanggal,
        penyelenggara: penyelenggara || 'Lembaga Penyelenggara',
      },
      false
    );

    setJudul('');
    setPeringkat('');
    setPenyelenggara('');
    setRefreshTick((t) => t + 1);
    showToast(
      'Prestasi Diajukan',
      'Catatan prestasi telah disimpan dan menunggu pengesahan dari Guru/Admin.',
      'success'
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
            Portofolio & Rekam Pembinaan · AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            Prestasi Santri & Catatan Bimbingan Guru
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi penghargaan akademik, Tahfidz Al-Qur&apos;an, perlombaan, serta umpan balik pembinaan wali kelas.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs tabular-nums shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-amber-800 font-sans font-semibold">Terverifikasi: </span>
            <strong className="text-amber-950">{achievements.filter((a) => a.terverifikasi).length}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Submit New Achievement + Achievements List */}
        <div className="lg:col-span-7 space-y-5">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Trophy className="w-4 h-4 text-orange-500" />
              <h4 className="text-sm font-extrabold text-slate-900">Laporkan Prestasi Baru</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Nama Prestasi / Lomba *</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Juara 2 Olimpiade Matematika Tingkat Provinsi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as StudentAchievementItem['kategori'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="Tahfidz & Al-Qur'an">Tahfidz &amp; Al-Qur&apos;an</option>
                  <option value="Sains & Akademik">Sains &amp; Akademik</option>
                  <option value="Olahraga & Seni">Olahraga &amp; Seni</option>
                  <option value="Kepemimpinan & Adab">Kepemimpinan &amp; Adab</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Tingkat</label>
                <select
                  value={tingkat}
                  onChange={(e) => setTingkat(e.target.value as StudentAchievementItem['tingkat'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="Sekolah">Sekolah</option>
                  <option value="Kota/Kabupaten">Kota / Kabupaten</option>
                  <option value="Provinsi">Provinsi</option>
                  <option value="Nasional">Nasional</option>
                  <option value="Internasional">Internasional</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Peringkat / Predikat *</label>
                <input
                  type="text"
                  value={peringkat}
                  onChange={(e) => setPeringkat(e.target.value)}
                  placeholder="Juara 1 / Medali Emas / Mumtaz"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Tanggal Diraih</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Penyelenggara</label>
                <input
                  type="text"
                  value={penyelenggara}
                  onChange={(e) => setPenyelenggara(e.target.value)}
                  placeholder="Contoh: Kemendikbud / LPTQ Tangerang Selatan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan & Ajukan Verifikasi</span>
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award className="w-4 h-4 text-emerald-600" />
              Daftar Prestasi & Penghargaan ({achievements.length})
            </h4>

            {achievements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada catatan prestasi untuk {studentName}.
              </p>
            ) : (
              <div className="space-y-3">
                {achievements.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-extrabold text-slate-900">{item.judul}</div>
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                          item.terverifikasi ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {item.terverifikasi ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>{item.peringkat}</strong> · {item.kategori} · Tingkat {item.tingkat}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {item.penyelenggara} · {item.tanggal}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Teacher Counseling Notes */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <HeartHandshake className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-extrabold text-slate-900">
              Catatan Bimbingan & Apresiasi Guru
            </h4>
          </div>

          {counselingNotes.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Belum ada catatan konseling atau bimbingan khusus dari guru.
            </p>
          ) : (
            <div className="space-y-3">
              {counselingNotes.map((note) => (
                <div key={note.id} className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-800">{note.kategori}</span>
                    <span className="font-mono text-slate-500">{note.tanggal}</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">{note.catatan}</p>
                  <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-blue-200/60">
                    Tindak Lanjut: {note.tindak_lanjut} · Oleh {note.guru}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
