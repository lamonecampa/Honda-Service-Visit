/**
 * ════════════════════════════════════════════
 *  HONDA SERVICE VISIT – UIBU
 *  Google Apps Script  |  Code.gs  (v2 - CORS Fix)
 * ════════════════════════════════════════════
 */

const SPREADSHEET_ID = '1vQHb7TJ8QG-KYtZty3fd7EgWaEIb3VQgqfoNHzzo1F4';
const SHEET_NAME     = 'Pendaftar';
const KUOTA_MAX      = 100;

const HEADERS = [
  'No', 'Antrian', 'Nama', 'Status', 'NIM/NIP',
  'Fakultas', 'Program Studi', 'No WhatsApp',
  'Plat Nomor', 'Jenis Motor', 'Tahun Motor', 'Sesi', 'Waktu Daftar',
];

const SESI_CONFIG = [
  { from: 1,  to: 20,  label: 'Sesi 1 – 08.00 WIB' },
  { from: 21, to: 40,  label: 'Sesi 2 – 09.00 WIB' },
  { from: 41, to: 60,  label: 'Sesi 3 – 10.00 WIB' },
  { from: 61, to: 80,  label: 'Sesi 4 – 11.00 WIB' },
  { from: 81, to: 100, label: 'Sesi 5 – 12.00 WIB' },
];

// ════════════════════════════════════════════
//  GET HANDLER — menerima data via URL parameter
//  (solusi CORS: kirim data lewat GET bukan POST)
// ════════════════════════════════════════════
function doGet(e) {
  const p = e.parameter;

  // Ping / health check
  if (!p.action) {
    return makeResponse({ status: 'ok', message: 'Honda Service Visit API aktif' });
  }

  // Cek jumlah pendaftar
  if (p.action === 'count') {
    const sheet = getSheet();
    const count = Math.max(0, sheet.getLastRow() - 1);
    return makeResponse({ status: 'ok', count: count, kuota: KUOTA_MAX });
  }

  // Daftar baru
  if (p.action === 'daftar') {
    const data = {
      nama:       p.nama       || '',
      status:     p.status     || '',
      nimNip:     p.nimNip     || '',
      fakultas:   p.fakultas   || '',
      prodi:      p.prodi      || '',
      noWa:       p.noWa       || '',
      platNomor:  p.platNomor  || '',
      jenisMotor: p.jenisMotor || '',
      tahunMotor: p.tahunMotor || '',
    };
    const result = saveRegistration(data);
    return makeResponse(result);
  }

  return makeResponse({ status: 'error', message: 'Action tidak dikenal' });
}

// ════════════════════════════════════════════
//  POST HANDLER (backup, tetap ada)
// ════════════════════════════════════════════
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    body.action = 'daftar';
    const result = saveRegistration(body);
    return makeResponse(result);
  } catch (err) {
    return makeResponse({ status: 'error', message: err.message });
  }
}

// ════════════════════════════════════════════
//  HELPER: buat response dengan CORS header
// ════════════════════════════════════════════
function makeResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════
//  CORE: SIMPAN DATA
// ════════════════════════════════════════════
function saveRegistration(data) {
  // Validasi field wajib
  if (!data.nama || !data.platNomor) {
    return { status: 'error', message: 'Data tidak lengkap.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sheet    = getSheet();
    const lastRow  = sheet.getLastRow();
    const rowCount = lastRow - 1;

    if (rowCount >= KUOTA_MAX) {
      return { status: 'error', message: 'Kuota pendaftaran sudah penuh (100 motor).' };
    }

    const queueNum = rowCount + 1;
    const queue    = 'A-' + String(queueNum).padStart(3, '0');
    const sesi     = getSesi(queueNum);
    const now      = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

    sheet.appendRow([
      queueNum, queue,
      data.nama, data.status, data.nimNip,
      data.fakultas, data.prodi, data.noWa,
      data.platNomor, data.jenisMotor, data.tahunMotor,
      sesi, timestamp,
    ]);

    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 1, 1, 2).setHorizontalAlignment('center');
    sheet.getRange(newRow, 2).setFontWeight('bold');

    return { status: 'ok', queue: queue, sesi: sesi, timestamp: timestamp };

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

function setupSheet(sheet) {
  sheet.appendRow(HEADERS);
  const r = sheet.getRange(1, 1, 1, HEADERS.length);
  r.setFontWeight('bold').setBackground('#CC0000').setFontColor('#FFFFFF').setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.getRange(1, 1, 1, HEADERS.length).createFilter();
}

function getSesi(num) {
  const found = SESI_CONFIG.find(s => num >= s.from && num <= s.to);
  return found ? found.label : 'Sesi Tambahan – 13.00 WIB';
}

// ════════════════════════════════════════════
//  TEST — jalankan manual di Apps Script
// ════════════════════════════════════════════
function testSimpan() {
  const result = saveRegistration({
    nama: 'SURYA PRATAMA', status: 'Mahasiswa', nimNip: '2023010001',
    fakultas: 'Fakultas Ilmu Komputer', prodi: 'Teknik Informatika',
    noWa: '+6281234567890', platNomor: 'E 1234 AB',
    jenisMotor: 'Honda Beat', tahunMotor: '2022',
  });
  Logger.log(JSON.stringify(result, null, 2));
}
