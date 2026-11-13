import React, { useState, useEffect } from 'react';
import { SheetsService } from '../services/sheetsService';
import { useToast } from './Toast';
import {
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  Code2,
  HelpCircle,
  Sparkles,
  Link2,
} from 'lucide-react';

interface SheetsSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export function SheetsSetupModal({ isOpen, onClose, onSyncComplete }: SheetsSetupModalProps) {
  const { showToast } = useToast();
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'code'>('config');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setUrl(SheetsService.getScriptUrl());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    SheetsService.setScriptUrl(url);
    showToast('URL Google Apps Script Berhasil Disimpan', 'Konfigurasi tersimpan di browser Anda.', 'success');
  };

  const handleTest = async () => {
    if (!url.trim()) {
      showToast('URL Kosong', 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.', 'error');
      return;
    }
    setTesting(true);
    handleSaveUrl();
    const res = await SheetsService.testConnection(url);
    setTesting(false);
    if (res.success) {
      showToast('Koneksi Berhasil!', res.message, 'success');
    } else {
      showToast('Koneksi Gagal', res.message, 'error');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    handleSaveUrl();
    const res = await SheetsService.fetchFromSpreadsheet();
    setSyncing(false);
    if (res.success) {
      showToast('Sinkronisasi Selesai', 'Data terbaru berhasil ditarik dari Google Sheets.', 'success');
      if (onSyncComplete) onSyncComplete();
    } else {
      showToast('Sinkronisasi Terhambat', res.error || 'Menggunakan data lokal.', 'error');
    }
  };

  const handleInitSheets = async () => {
    if (!url.trim()) {
      showToast('URL Belum Diisi', 'Masukkan URL Web App Apps Script terlebih dahulu.', 'error');
      return;
    }
    setInitializing(true);
    handleSaveUrl();
    const res = await SheetsService.setupSheetsOnSpreadsheet();
    setInitializing(false);
    if (res.success) {
      showToast('Struktur Sheet Siap', res.message, 'success');
      handleSync();
    } else {
      showToast('Gagal Inisialisasi Sheet', res.message, 'error');
    }
  };

  const appsScriptCode = `/**
 * Google Apps Script Backend for EduManage LMS
 * Deploy sebagai Web App: Execute as Me, Who has access: Anyone
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getInitData';
  var result = {};
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (action === 'ping') {
      result = { success: true, message: 'Google Sheets Apps Script API Online', timestamp: new Date().toISOString() };
    } else if (action === 'getInitData') {
      result = getCompleteDatabase(ss);
    } else if (action === 'setupSheets') {
      result = initializeDatabaseSheets(ss);
    } else {
      result = { success: false, error: 'Aksi tidak dikenal: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = {};
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : postData.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'submitBatchBoth') {
      var resAbs = saveBatchAbsensi(ss, postData.absensi || []);
      var resNil = saveBatchNilai(ss, postData.nilai || []);
      result = { success: true, countAbs: resAbs.count, countNil: resNil.count };
    } else if (action === 'updateAbsensi') {
      result = updateSingleAbsensi(ss, postData.data);
    } else if (action === 'deleteAbsensi') {
      result = deleteSingleAbsensi(ss, postData.id_absensi);
    } else if (action === 'updateNilai') {
      result = updateSingleNilai(ss, postData.data);
    } else if (action === 'deleteNilai') {
      result = deleteSingleNilai(ss, postData.id_nilai);
    } else if (action === 'setupSheets') {
      result = initializeDatabaseSheets(ss);
    } else {
      result = { success: false, error: 'Aksi POST tidak dikenal: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function getCompleteDatabase(ss) {
  return {
    success: true,
    master_siswa: readSheetObjects(ss, 'master_siswa'),
    master_guru: readSheetObjects(ss, 'master_guru'),
    master_kelas: readSheetObjects(ss, 'master_kelas'),
    siswa_kelas: readSheetObjects(ss, 'siswa_kelas'),
    log_absensi: readSheetObjects(ss, 'log_absensi'),
    log_nilai: readSheetObjects(ss, 'log_nilai')
  };
}

function readSheetObjects(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];
  for (var r = 1; r < data.length; r++) {
    var rowObj = {};
    var hasContent = false;
    for (var c = 0; c < headers.length; c++) {
      var val = data[r][c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      rowObj[headers[c]] = val;
      if (val !== '' && val !== null && val !== undefined) hasContent = true;
    }
    if (hasContent) rows.push(rowObj);
  }
  return rows;
}

function saveBatchAbsensi(ss, items) {
  if (!items || items.length === 0) return { count: 0 };
  var sheet = ss.getSheetByName('log_absensi') || ss.insertSheet('log_absensi');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id_absensi', 'tanggal', 'id_kelas', 'siswa', 'status_kehadiran', 'id_tutor', 'timestamp']);
  }
  var now = new Date().toISOString();
  var rows = items.map(function(i) {
    return [i.id_absensi, i.tanggal, i.id_kelas, i.siswa, i.status_kehadiran, i.id_tutor, i.timestamp || now];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return { count: rows.length };
}

function saveBatchNilai(ss, items) {
  if (!items || items.length === 0) return { count: 0 };
  var sheet = ss.getSheetByName('log_nilai') || ss.insertSheet('log_nilai');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id_nilai', 'tanggal', 'id_kelas', 'siswa', 'mapel', 'jenis_penilaian', 'nilai', 'catatan', 'id_tutor', 'timestamp']);
  }
  var now = new Date().toISOString();
  var rows = items.map(function(i) {
    return [i.id_nilai, i.tanggal, i.id_kelas, i.siswa, i.mapel, i.jenis_penilaian, Number(i.nilai) || 0, i.catatan || '', i.id_tutor, i.timestamp || now];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return { count: rows.length };
}

function updateSingleAbsensi(ss, data) {
  var sheet = ss.getSheetByName('log_absensi');
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan' };
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(data.id_absensi)) {
      var r = i + 1;
      sheet.getRange(r, 2).setValue(data.tanggal);
      sheet.getRange(r, 3).setValue(data.id_kelas);
      sheet.getRange(r, 4).setValue(data.siswa);
      sheet.getRange(r, 5).setValue(data.status_kehadiran);
      if (data.id_tutor) sheet.getRange(r, 6).setValue(data.id_tutor);
      return { success: true };
    }
  }
  return { success: false, error: 'ID Absensi tidak ada' };
}

function deleteSingleAbsensi(ss, id) {
  var sheet = ss.getSheetByName('log_absensi');
  if (!sheet) return { success: false };
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function updateSingleNilai(ss, data) {
  var sheet = ss.getSheetByName('log_nilai');
  if (!sheet) return { success: false };
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(data.id_nilai)) {
      var r = i + 1;
      sheet.getRange(r, 2).setValue(data.tanggal);
      sheet.getRange(r, 3).setValue(data.id_kelas);
      sheet.getRange(r, 4).setValue(data.siswa);
      sheet.getRange(r, 5).setValue(data.mapel);
      sheet.getRange(r, 6).setValue(data.jenis_penilaian);
      sheet.getRange(r, 7).setValue(Number(data.nilai));
      sheet.getRange(r, 8).setValue(data.catatan || '');
      return { success: true };
    }
  }
  return { success: false };
}

function deleteSingleNilai(ss, id) {
  var sheet = ss.getSheetByName('log_nilai');
  if (!sheet) return { success: false };
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function initializeDatabaseSheets(ss) {
  var schemas = {
    'master_siswa': ['cabang', 'siswa', 'email_siswa'],
    'master_guru': ['id_tutor', 'guru'],
    'master_kelas': ['id_kelas', 'cabang', 'kelas', 'mapel', 'hari', 'waktu', 'guru'],
    'siswa_kelas': ['id_kelas', 'siswa', 'email_siswa', 'kelas', 'mapel', 'hari', 'waktu', 'guru', 'cabang'],
    'log_absensi': ['id_absensi', 'tanggal', 'id_kelas', 'siswa', 'status_kehadiran', 'id_tutor', 'timestamp'],
    'log_nilai': ['id_nilai', 'tanggal', 'id_kelas', 'siswa', 'mapel', 'jenis_penilaian', 'nilai', 'catatan', 'id_tutor', 'timestamp']
  };
  for (var name in schemas) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(schemas[name]);
      sheet.setFrozenRows(1);
    }
  }
  return { success: true, message: '6 Sheet berhasil diinisialisasi!' };
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    showToast('Kode Disalin ke Clipboard!', 'Tempelkan ke Apps Script editor spreadsheet Anda.', 'success');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/AL-WILDAN_ISLAMIC_SCHOOL__1__98f2aca5.png"
              alt="Logo AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY"
              className="w-10 h-10 object-contain rounded-full bg-white p-0.5 border border-slate-200 shrink-0"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">Integrasi Google Sheets</h3>
              <p className="text-xs text-slate-500">AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY · Apps Script Web App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Koneksi & Pengaturan
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Panduan Menghubungkan
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Kode Apps Script (Code.gs)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {activeTab === 'config' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" /> Database 6 Sheet Otomatis
                </span>
                Aplikasi ini membaca dan menulis secara efisien (Batch) ke 6 sheet:
                <code className="ml-1 font-mono text-[11px] bg-emerald-100/60 px-1 py-0.5 rounded">master_siswa</code>,{' '}
                <code className="font-mono text-[11px] bg-emerald-100/60 px-1 py-0.5 rounded">master_guru</code>,{' '}
                <code className="font-mono text-[11px] bg-emerald-100/60 px-1 py-0.5 rounded">master_kelas</code>,{' '}
                <code className="font-mono text-[11px] bg-emerald-100/60 px-1 py-0.5 rounded">siswa_kelas</code>,{' '}
                <code className="font-mono text-[11px] bg-emerald-100/60 px-1 py-0.5 rounded">log_absensi</code>,{' '}
                <code className="font-mono text-[11px] bg-emerald-100/60 px-1 py-0.5 rounded">log_nilai</code>.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  URL Web App Google Apps Script
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 text-xs font-mono rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0"
                  >
                    Simpan
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Didapatkan dari menu Deploy &gt; New deployment &gt; Web app pada Apps Script.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-emerald-600' : ''}`} />
                  {testing ? 'Menguji...' : 'Tes Koneksi'}
                </button>

                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Menyinkronkan...' : 'Tarik Data Sheet'}
                </button>

                <button
                  onClick={handleInitSheets}
                  disabled={initializing}
                  className="py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {initializing ? 'Memproses...' : 'Buat 6 Sheet Otomatis'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 leading-relaxed">
                  💡 <strong>Mode Demo / Offline:</strong> Tanpa mengisi URL pun, aplikasi sudah memiliki database lokal
                  lengkap (mock data bimbel/sekolah) yang siap digunakan untuk absensi, input nilai, edit/hapus, print laporan,
                  dan AI insight!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              <h4 className="text-sm font-bold text-slate-900">
                Cara Menghubungkan Google Sheets ke Aplikasi EduManage LMS:
              </h4>

              <ol className="space-y-3.5 list-decimal list-inside pl-1 text-slate-700">
                <li className="pl-1">
                  <strong className="text-slate-900">Buka Google Spreadsheet:</strong> Buat spreadsheet kosong baru di Google Drive Anda (misal beri judul <em>"Database EduManage LMS"</em>).
                </li>
                <li className="pl-1">
                  <strong className="text-slate-900">Buka Menu Apps Script:</strong> Pada menu atas spreadsheet, klik{' '}
                  <span className="font-semibold text-slate-900">Ekstensi (Extensions)</span> &gt;{' '}
                  <span className="font-semibold text-slate-900">Apps Script</span>.
                </li>
                <li className="pl-1">
                  <strong className="text-slate-900">Tempelkan Kode:</strong> Buka tab <strong>"Kode Apps Script"</strong> di modal ini, klik tombol <strong>Salin Kode</strong>, lalu hapus semua teks di editor Apps Script dan tempelkan kodenya. Simpan dengan menekan ikon Disket / Ctrl+S.
                </li>
                <li className="pl-1">
                  <strong className="text-slate-900">Deploy sebagai Web App:</strong>
                  <ul className="list-disc list-inside mt-1.5 pl-4 space-y-1 text-slate-600">
                    <li>Klik tombol biru <strong>Deploy</strong> di pojok kanan atas &gt; <strong>New deployment</strong>.</li>
                    <li>Pilih tipe (ikon gear): <strong>Web app</strong>.</li>
                    <li>
                      Isi Deskripsi: <em>EduManage API v1</em>
                    </li>
                    <li>
                      <strong>Execute as:</strong> Pilih <em>Me (email Anda)</em>.
                    </li>
                    <li>
                      <strong>Who has access:</strong> Wajib pilih <span className="font-bold text-emerald-700">Anyone (Siapa saja)</span> agar aplikasi web dapat membaca & menulis data.
                    </li>
                    <li>Klik <strong>Deploy</strong>, lalu berikan izin otorisasi akun Google Anda.</li>
                  </ul>
                </li>
                <li className="pl-1">
                  <strong className="text-slate-900">Salin URL Web App:</strong> Copy <em>Web App URL</em> (akhiran <code className="font-mono bg-slate-100 px-1">.../exec</code>), lalu tempelkan di tab <strong>Koneksi & Pengaturan</strong> aplikasi ini.
                </li>
                <li className="pl-1">
                  <strong className="text-slate-900">Inisialisasi Otomatis:</strong> Klik tombol <strong>"Buat 6 Sheet Otomatis"</strong>. Spreadsheet Anda akan otomatis memiliki 6 sheet: <code className="font-mono">master_siswa</code>, <code className="font-mono">master_guru</code>, <code className="font-mono">master_kelas</code>, <code className="font-mono">siswa_kelas</code>, <code className="font-mono">log_absensi</code>, <code className="font-mono">log_nilai</code> lengkap dengan header kolom yang sesuai!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">File: Code.gs</span>
                <button
                  onClick={copyToClipboard}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    copiedCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Tersalin!' : 'Salin Seluruh Kode'}
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-300 bg-slate-950 p-4 overflow-x-auto max-h-[350px]">
                <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre leading-relaxed">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
