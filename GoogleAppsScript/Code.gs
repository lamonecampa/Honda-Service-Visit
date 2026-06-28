/**
 * ════════════════════════════════════════════
 *  HONDA SERVICE VISIT – UIBU
 *  Google Apps Script  |  Code.gs
 *
 *  CARA DEPLOY:
 *  1. Buka script.google.com → New Project
 *  2. Tempel seluruh kode ini
 *  3. Klik Deploy → New Deployment
 *     → Pilih "Web App"
 *     → Execute as: Me
 *     → Who has access: Anyone
 *  4. Salin URL deployment → tempel ke CONFIG.GAS_URL di app.js
 * ════════════════════════════════════════════
 */

// ─── KONFIGURASI ───────────────────────────
const SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_KAMU';
// ID ada di URL: https://docs.google.com/spreadsheets/d/[ID_DI_SINI]/edit

const SHEET_NAME     = 'Pendaftar';   // nama tab sheet
const KUOTA_MAX      = 100;           // batas maksimum peserta

// ─── KOLOM HEADER ──────────────────────────
const HEADERS = [
  'No',
  'Antrian',
  'Nama',
  'Status',
  'NIM/NIP',
  'Fakultas',
  'Program Studi',
  'No WhatsApp',
  'Plat Nomor',
  'Jenis Motor',
  'Tahun Motor',
  'Sesi',
  'Waktu Daftar',
];

// ─── SESI CONFIG ───────────────────────────
const SESI_CONFIG = [
  { from: 1,  to: 20,  label: 'Sesi 1 – 08.00 WIB' },
  { from: 21, to: 40,  label: 'Sesi 2 – 09.00 WIB' },
  { from: 41, to: 60,  label: 'Sesi 3 – 10.00 WIB' },
  { from: 61, to: 80,  label: 'Sesi 4 – 11.00 WIB' },
  { from: 81, to: 100, label: 'Sesi 5 – 12.00 WIB' },
];

// ════════════════════════════════════════════
//  POST HANDLER  — dipanggil saat peserta submit form
// ════════════════════════════════════════════
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = JSON.parse(e.postData.contents);
    const result = saveRegistration(body);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ════════════════════════════════════════════
//  GET HANDLER  — bisa dipakai untuk cek status
// ════════════════════════════════════════════
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'count') {
    const sheet = getSheet();
    const count = Math.max(0, sheet.getLastRow() - 1); // minus header
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', count, kuota: KUOTA_MAX }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Honda Service Visit API' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════
//  CORE: SIMPAN DATA
// ════════════════════════════════════════════
function saveRegistration(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // tunggu max 10 detik (handle concurrent submissions)

  try {
    const sheet = getSheet();

    // Hitung nomor urut berikutnya
    const lastRow  = sheet.getLastRow();
    const rowCount = lastRow - 1; // minus baris header

    // Cek kuota
    if (rowCount >= KUOTA_MAX) {
      return { status: 'error', message: 'Kuota pendaftaran sudah penuh (100 motor).' };
    }

    // Nomor antrean: A-001, A-002, ...
    const queueNum = rowCount + 1;
    const queue    = 'A-' + String(queueNum).padStart(3, '0');

    // Tentukan sesi
    const sesi = getSesi(queueNum);

    // Timestamp
    const now       = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

    // Tulis ke sheet
    sheet.appendRow([
      queueNum,           // No
      queue,              // Antrian
      data.nama,          // Nama
      data.status,        // Status
      data.nimNip,        // NIM/NIP
      data.fakultas,      // Fakultas
      data.prodi,         // Program Studi
      data.noWa,          // No WhatsApp
      data.platNomor,     // Plat Nomor
      data.jenisMotor,    // Jenis Motor
      data.tahunMotor,    // Tahun Motor
      sesi,               // Sesi
      timestamp,          // Waktu Daftar
    ]);

    // Auto-format kolom nomor antrean (bold + center)
    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 2).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(newRow, 1).setHorizontalAlignment('center');

    return {
      status:    'ok',
      queue:     queue,
      sesi:      sesi,
      timestamp: timestamp,
      message:   'Pendaftaran berhasil.',
    };

  } finally {
    lock.releaseLock();
  }
}

// ════════════════════════════════════════════
//  HELPER: get or create sheet
// ════════════════════════════════════════════
function getSheet() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupSheet(sheet);
  } else if (sheet.getLastRow() === 0) {
    setupSheet(sheet);
  }

  return sheet;
}

// ════════════════════════════════════════════
//  SETUP: buat header + freeze + style
// ════════════════════════════════════════════
function setupSheet(sheet) {
  // Tulis header
  sheet.appendRow(HEADERS);

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange
    .setFontWeight('bold')
    .setBackground('#CC0000')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  // Freeze header row
  sheet.setFrozenRows(1);

  // Lebar kolom otomatis
  sheet.autoResizeColumns(1, HEADERS.length);

  // Tambah filter
  sheet.getRange(1, 1, 1, HEADERS.length).createFilter();

  Logger.log('Sheet berhasil dibuat: ' + sheet.getName());
}

// ════════════════════════════════════════════
//  HELPER: tentukan sesi dari nomor urut
// ════════════════════════════════════════════
function getSesi(num) {
  const found = SESI_CONFIG.find(s => num >= s.from && num <= s.to);
  return found ? found.label : 'Sesi Tambahan – 13.00 WIB';
}

// ════════════════════════════════════════════
//  UTILITY: jalankan manual untuk test
//  (buka Apps Script → pilih fungsi → klik Run)
// ════════════════════════════════════════════
function testSimpan() {
  const dummy = {
    nama:       'SURYA PRATAMA',
    status:     'Mahasiswa',
    nimNip:     '2023010001',
    fakultas:   'Fakultas Ilmu Komputer',
    prodi:      'Teknik Informatika',
    noWa:       '+6281234567890',
    platNomor:  'E 1234 AB',
    jenisMotor: 'Honda Beat',
    tahunMotor: '2022',
  };

  const result = saveRegistration(dummy);
  Logger.log(JSON.stringify(result, null, 2));
}

function resetSheet() {
  // HATI-HATI: ini akan menghapus semua data!
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet) {
    sheet.clear();
    setupSheet(sheet);
    Logger.log('Sheet berhasil direset.');
  }
}
