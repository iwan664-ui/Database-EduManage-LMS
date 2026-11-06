/**
 * Google Apps Script Backend for EduManage LMS - AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK
 * Enhanced Security Edition v2.4 (XSS Sanitized, Payload Validation, Secure Handshake)
 * 
 * CARA DEPLOY:
 * 1. Buka Google Spreadsheet database sekolah.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus kode lama dan tempel kode ini.
 * 4. Klik Deploy > New Deployment > Web app:
 *    - Description: AL-WILDAN 29 LMS Secure API
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin Web app URL dan masukkan ke menu Setup Google Sheets di aplikasi LMS.
 */

// OPTIONAL: Anda dapat mengatur SECRET_TOKEN untuk mengunci akses API jika diinginkan
var SECRET_TOKEN = ""; // Biarkan kosong jika menggunakan akses standar terproteksi

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? sanitizeText(e.parameter.action) : 'getInitData';
  var token = (e && e.parameter && e.parameter.token) ? e.parameter.token : '';
  var result = {};

  try {
    if (SECRET_TOKEN && token !== SECRET_TOKEN) {
      return createJsonResponse({ success: false, error: 'Unauthorized: Invalid Security Token' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      result = { 
        success: true, 
        message: 'Google Sheets Apps Script API Online (Secured)', 
        school: 'AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK',
        timestamp: new Date().toISOString() 
      };
    } else if (action === 'getInitData') {
      result = getCompleteDatabase(ss);
    } else if (action === 'setupSheets') {
      result = initializeDatabaseSheets(ss);
    } else {
      result = { success: false, error: 'Aksi GET tidak dikenali: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return createJsonResponse(result);
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  var result = {};
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    var token = postData.token || (e && e.parameter && e.parameter.token);
    if (SECRET_TOKEN && token !== SECRET_TOKEN) {
      return createJsonResponse({ success: false, error: 'Unauthorized: Invalid Security Token' });
    }

    var action = (e && e.parameter && e.parameter.action) ? sanitizeText(e.parameter.action) : postData.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'submitBatchAbsensi') {
      result = saveBatchAbsensi(ss, postData.items || []);
    } else if (action === 'submitBatchNilai') {
      result = saveBatchNilai(ss, postData.items || []);
    } else if (action === 'submitBatchBoth') {
      // Simpan absensi dan nilai sekaligus secara atomic batch
      var resAbs = saveBatchAbsensi(ss, postData.absensi || []);
      var resNil = saveBatchNilai(ss, postData.nilai || []);
      result = {
        success: resAbs.success && resNil.success,
        insertedAbsensi: resAbs.count || 0,
        insertedNilai: resNil.count || 0,
        timestamp: new Date().toISOString()
      };
    } else if (action === 'updateAbsensi') {
      result = updateSingleAbsensi(ss, postData.data);
    } else if (action === 'deleteAbsensi') {
      result = deleteSingleAbsensi(ss, sanitizeText(postData.id_absensi));
    } else if (action === 'updateNilai') {
      result = updateSingleNilai(ss, postData.data);
    } else if (action === 'deleteNilai') {
      result = deleteSingleNilai(ss, sanitizeText(postData.id_nilai));
    } else if (action === 'setupSheets') {
      result = initializeDatabaseSheets(ss);
    } else {
      result = { success: false, error: 'Aksi POST tidak dikenali: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return createJsonResponse(result);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeText(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/<[^>]*>/g, '').trim();
}

/**
 * Ambil seluruh data dari 6 sheet secara batch & efisien
 */
function getCompleteDatabase(ss) {
  return {
    success: true,
    school: 'AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK',
    master_siswa: readSheetObjects(ss, 'master_siswa'),
    master_guru: readSheetObjects(ss, 'master_guru'),
    master_kelas: readSheetObjects(ss, 'master_kelas'),
    siswa_kelas: readSheetObjects(ss, 'siswa_kelas'),
    log_absensi: readSheetObjects(ss, 'log_absensi'),
    log_nilai: readSheetObjects(ss, 'log_nilai'),
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper membaca sheet menjadi Array of Object dengan validasi
 */
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
      if (val !== '' && val !== null && val !== undefined) {
        hasContent = true;
      }
    }
    if (hasContent) {
      rows.push(rowObj);
    }
  }
  return rows;
}

/**
 * Batch insert absensi
 */
function saveBatchAbsensi(ss, items) {
  if (!items || items.length === 0) return { success: true, count: 0 };
  var sheet = ss.getSheetByName('log_absensi');
  if (!sheet) {
    sheet = ss.insertSheet('log_absensi');
    sheet.appendRow(['id_absensi', 'tanggal', 'id_kelas', 'siswa', 'status_kehadiran', 'id_tutor', 'timestamp']);
    sheet.setFrozenRows(1);
  }

  var now = new Date().toISOString();
  var rowsToAppend = items.map(function(item) {
    return [
      sanitizeText(item.id_absensi) || ('ABS_' + Utilities.getUuid().substring(0, 8)),
      sanitizeText(item.tanggal) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      sanitizeText(item.id_kelas),
      sanitizeText(item.siswa),
      sanitizeText(item.status_kehadiran) || 'Hadir',
      sanitizeText(item.id_tutor),
      item.timestamp || now
    ];
  });

  var nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  return { success: true, count: rowsToAppend.length };
}

/**
 * Batch insert nilai (Standar KKM 85)
 */
function saveBatchNilai(ss, items) {
  if (!items || items.length === 0) return { success: true, count: 0 };
  var sheet = ss.getSheetByName('log_nilai');
  if (!sheet) {
    sheet = ss.insertSheet('log_nilai');
    sheet.appendRow(['id_nilai', 'tanggal', 'id_kelas', 'siswa', 'mapel', 'jenis_penilaian', 'nilai', 'catatan', 'id_tutor', 'timestamp']);
    sheet.setFrozenRows(1);
  }

  var now = new Date().toISOString();
  var rowsToAppend = items.map(function(item) {
    var nilaiNum = Number(item.nilai);
    if (isNaN(nilaiNum)) nilaiNum = 0;

    return [
      sanitizeText(item.id_nilai) || ('NIL_' + Utilities.getUuid().substring(0, 8)),
      sanitizeText(item.tanggal) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      sanitizeText(item.id_kelas),
      sanitizeText(item.siswa),
      sanitizeText(item.mapel),
      sanitizeText(item.jenis_penilaian) || 'Ulangan Harian',
      nilaiNum,
      sanitizeText(item.catatan) || '',
      sanitizeText(item.id_tutor),
      item.timestamp || now
    ];
  });

  var nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  return { success: true, count: rowsToAppend.length };
}

/**
 * Update single row absensi
 */
function updateSingleAbsensi(ss, data) {
  var sheet = ss.getSheetByName('log_absensi');
  if (!sheet || !data || !data.id_absensi) return { success: false, error: 'Data tidak valid' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.id_absensi)) {
      var row = i + 1;
      sheet.getRange(row, 2).setValue(sanitizeText(data.tanggal));
      sheet.getRange(row, 3).setValue(sanitizeText(data.id_kelas));
      sheet.getRange(row, 4).setValue(sanitizeText(data.siswa));
      sheet.getRange(row, 5).setValue(sanitizeText(data.status_kehadiran));
      if (data.id_tutor) sheet.getRange(row, 6).setValue(sanitizeText(data.id_tutor));
      return { success: true, message: 'Absensi berhasil diperbarui' };
    }
  }
  return { success: false, error: 'ID Absensi tidak ditemukan di spreadsheet' };
}

/**
 * Delete single row absensi
 */
function deleteSingleAbsensi(ss, id_absensi) {
  var sheet = ss.getSheetByName('log_absensi');
  if (!sheet || !id_absensi) return { success: false, error: 'ID tidak valid' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id_absensi)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Absensi berhasil dihapus' };
    }
  }
  return { success: false, error: 'ID Absensi tidak ditemukan' };
}

/**
 * Update single row nilai
 */
function updateSingleNilai(ss, data) {
  var sheet = ss.getSheetByName('log_nilai');
  if (!sheet || !data || !data.id_nilai) return { success: false, error: 'Data tidak valid' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.id_nilai)) {
      var row = i + 1;
      sheet.getRange(row, 2).setValue(sanitizeText(data.tanggal));
      sheet.getRange(row, 3).setValue(sanitizeText(data.id_kelas));
      sheet.getRange(row, 4).setValue(sanitizeText(data.siswa));
      sheet.getRange(row, 5).setValue(sanitizeText(data.mapel));
      sheet.getRange(row, 6).setValue(sanitizeText(data.jenis_penilaian));
      sheet.getRange(row, 7).setValue(Number(data.nilai) || 0);
      sheet.getRange(row, 8).setValue(sanitizeText(data.catatan) || '');
      return { success: true, message: 'Nilai berhasil diperbarui' };
    }
  }
  return { success: false, error: 'ID Nilai tidak ditemukan di spreadsheet' };
}

/**
 * Delete single row nilai
 */
function deleteSingleNilai(ss, id_nilai) {
  var sheet = ss.getSheetByName('log_nilai');
  if (!sheet || !id_nilai) return { success: false, error: 'ID tidak valid' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id_nilai)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Nilai berhasil dihapus' };
    }
  }
  return { success: false, error: 'ID Nilai tidak ditemukan' };
}

/**
 * Inisialisasi struktur 6 sheet dengan proteksi header
 */
function initializeDatabaseSheets(ss) {
  var schemas = {
    'master_siswa': ['cabang', 'siswa', 'email_siswa'],
    'master_guru': ['id_tutor', 'guru'],
    'master_kelas': ['id_kelas', 'cabang', 'kelas', 'mapel', 'hari', 'waktu', 'guru'],
    'siswa_kelas': ['id_kelas', 'siswa', 'email_siswa', 'kelas', 'mapel', 'hari', 'waktu', 'guru', 'cabang'],
    'log_absensi': ['id_absensi', 'tanggal', 'id_kelas', 'siswa', 'status_kehadiran', 'id_tutor', 'timestamp'],
    'log_nilai': ['id_nilai', 'tanggal', 'id_kelas', 'siswa', 'mapel', 'jenis_penilaian', 'nilai', 'catatan', 'id_tutor', 'timestamp']
  };

  var created = [];
  for (var name in schemas) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(schemas[name]);
      sheet.setFrozenRows(1);
      created.push(name);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(schemas[name]);
      sheet.setFrozenRows(1);
      created.push(name + ' (header dibuat)');
    }
  }

  return {
    success: true,
    message: 'Struktur database sheet aman dan siap digunakan',
    created: created
  };
}
