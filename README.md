# 🏍️ Honda Service Visit – UIBU

Microsite pendaftaran event **Honda Service Visit** Universitas Islam Bunga Bangsa Cirebon.

**Stack:** HTML5 · Bootstrap 5 · JavaScript · Google Apps Script · Google Spreadsheet  
**Hosting:** GitHub Pages (gratis)  
**Database:** Google Spreadsheet (gratis)

---

## 📁 Struktur Project

```
Honda-Service-Visit/
├── index.html              ← Landing Page
├── register.html           ← Form Pendaftaran
├── success.html            ← Tiket & Nomor Antrean
├── assets/
│   ├── css/style.css
│   ├── js/app.js
│   └── img/poster.jpg      ← (opsional, tambahkan sendiri)
├── GoogleAppsScript/
│   └── Code.gs             ← Backend GAS
└── README.md
```

---

## 🚀 Cara Deploy

### 1. Google Spreadsheet

1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet baru
2. Namai spreadsheet: **Honda Service Visit UIBU**
3. Salin **ID Spreadsheet** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SALIN_INI]/edit
   ```

---

### 2. Google Apps Script

1. Buka [script.google.com](https://script.google.com) → **New Project**
2. Hapus kode default, tempel isi `GoogleAppsScript/Code.gs`
3. Ganti nilai:
   ```javascript
   const SPREADSHEET_ID = 'ID_SPREADSHEET_KAMU';
   ```
4. **Deploy sebagai Web App:**
   - Klik **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**
5. Salin URL Web App yang diberikan

---

### 3. Update app.js

Buka `assets/js/app.js`, ubah bagian CONFIG:

```javascript
const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/PASTE_URL_WEB_APP_DISINI/exec',
  DEADLINE: '2025-07-11T23:59:00',      // Kapan pendaftaran ditutup
  QR_BASE_URL: 'https://USERNAME.github.io/Honda-Service-Visit/success.html',
  // ...
};
```

---

### 4. GitHub Pages

1. Upload seluruh folder project ke **GitHub Repository**
2. Pergi ke **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Akses di: `https://username.github.io/Honda-Service-Visit/`

---

## ✅ Fitur

| Fitur | Status |
|-------|--------|
| Landing page dengan countdown | ✅ |
| Form pendaftaran | ✅ |
| Nomor antrean otomatis (A-001, A-002, ...) | ✅ |
| Sistem sesi (per 20 peserta per jam) | ✅ |
| QR Code di tiket | ✅ |
| Unduh tiket sebagai gambar | ✅ |
| Share tiket via WhatsApp/native share | ✅ |
| Simpan otomatis ke Google Spreadsheet | ✅ |
| Proteksi concurrent (tidak double nomor) | ✅ |
| Proteksi kuota penuh | ✅ |
| Desain responsif mobile & desktop | ✅ |
| Dashboard admin via Spreadsheet | ✅ |
| Gratis 100% | ✅ |

---

## 📊 Dashboard Admin

Cukup buka Google Spreadsheet. Kolom otomatis:

| No | Antrian | Nama | Status | NIM/NIP | Fakultas | Prodi | WA | Plat | Motor | Tahun | Sesi | Waktu |
|----|---------|------|--------|---------|----------|-------|-----|------|-------|-------|------|-------|
| 1 | **A-001** | Surya | Mahasiswa | 2023010001 | Fak. Ilmu Komputer | Teknik Informatika | +628xxx | E 1234 AB | Honda Beat | 2022 | Sesi 1 – 08.00 WIB | 10/07/2025 14:32:01 |

---

## 🔧 Kustomisasi

### Ganti tanggal event
Edit di `index.html`:
```html
<span class="meta-value">Sabtu, 12 Juli 2025</span>
```

### Ganti kuota
Di `Code.gs`:
```javascript
const KUOTA_MAX = 100;
```

### Tambah/kurangi sesi
Di `Code.gs` dan `assets/js/app.js`, edit array `SESI_CONFIG` / `CONFIG.SESI`.

### Tambahkan poster
Simpan gambar di `assets/img/poster.jpg`, lalu tambahkan di `index.html`:
```html
<img src="assets/img/poster.jpg" alt="Poster Honda Service Visit" class="img-fluid rounded">
```

---

## 💡 Tips Produksi

- **Test dulu** dengan jalankan fungsi `testSimpan()` di Apps Script sebelum go-live
- **Batasi akses** Spreadsheet agar hanya panitia yang bisa melihat (jangan public)
- **Backup** Spreadsheet setelah event selesai
- Untuk event dengan peserta > 500, pertimbangkan tambah `KUOTA_MAX` dan perbanyak sesi

---

*Dibuat untuk Honda Service Visit UIBU 2025 · Gratis, tanpa server, tanpa database berbayar.*
