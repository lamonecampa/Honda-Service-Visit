/* ─────────────────────────────────────────────
   HONDA SERVICE VISIT – app.js
   ───────────────────────────────────────────── */

// ══════════════════════════════════════════════
// CONFIG – ubah sesuai deployment kamu
// ══════════════════════════════════════════════
const CONFIG = {
  // Setelah deploy Google Apps Script, tempel URL Web App di sini:
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwQKrUx8XlnZYHEy0zuuZbXUxv-TwuzO-nk4im1drTm4kdZpsgbRj9gyVhHbL4JnAE/exec',
//https://script.google.com/macros/s/AKfycbwQKrUx8XlnZYHEy0zuuZbXUxv-TwuzO-nk4im1drTm4kdZpsgbRj9gyVhHbL4JnAE/exec
   
  // Tanggal penutupan pendaftaran (format: YYYY-MM-DDTHH:MM:SS)
  DEADLINE: '2026-06-29T23:59:00',

  // Tanggal event (untuk tampilan saja)
  EVENT_DATE: 'Senin, 29 Juni 2026',

  // URL base untuk QR Code (misalnya GitHub Pages kamu)
  QR_BASE_URL: 'https://lamonecampa.github.io/Honda-Service-Visit/index.html',
//https://lamonecampa.github.io/Honda-Service-Visit/index.html
  // Jadwal sesi berdasarkan range nomor
  SESI: [
    { from: 1,  to: 20,  label: 'Sesi 1', time: '08.00 WIB', range: 'A001–A020' },
    { from: 21, to: 40,  label: 'Sesi 2', time: '09.00 WIB', range: 'A021–A040' },
    { from: 41, to: 60,  label: 'Sesi 3', time: '10.00 WIB', range: 'A041–A060' },
    { from: 61, to: 80,  label: 'Sesi 4', time: '11.00 WIB', range: 'A061–A080' },
    { from: 81, to: 100, label: 'Sesi 5', time: '12.00 WIB', range: 'A081–A100' },
  ],
};

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
function pad(n) { return String(n).padStart(2, '0'); }

function getSesi(num) {
  const n = parseInt(num, 10);
  return CONFIG.SESI.find(s => n >= s.from && n <= s.to)
    || { label: 'Sesi Tambahan', time: '13.00 WIB', range: `A${pad(n)}` };
}

function parseQueueNum(str) {
  // "A-023" → 23
  return parseInt(str.replace(/\D/g, ''), 10);
}

// ══════════════════════════════════════════════
// COUNTDOWN
// ══════════════════════════════════════════════
function startCountdown() {
  const deadline = new Date(CONFIG.DEADLINE).getTime();

  function tick() {
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) {
      ['cd-h','cd-m','cd-s','cd-hm','cd-mm','cd-sm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    // Desktop
    if (document.getElementById('cd-h'))  document.getElementById('cd-h').textContent  = pad(h);
    if (document.getElementById('cd-m'))  document.getElementById('cd-m').textContent  = pad(m);
    if (document.getElementById('cd-s'))  document.getElementById('cd-s').textContent  = pad(s);
    // Mobile
    if (document.getElementById('cd-hm')) document.getElementById('cd-hm').textContent = pad(h);
    if (document.getElementById('cd-mm')) document.getElementById('cd-mm').textContent = pad(m);
    if (document.getElementById('cd-sm')) document.getElementById('cd-sm').textContent = pad(s);

    setTimeout(tick, 1000);
  }
  tick();
}

// ══════════════════════════════════════════════
// POPULATE TAHUN MOTOR
// ══════════════════════════════════════════════
function populateTahun() {
  const sel = document.getElementById('tahunMotor');
  if (!sel) return;
  const year = new Date().getFullYear();
  for (let y = year; y >= 2005; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  }
}

// ══════════════════════════════════════════════
// REGISTRATION FORM
// ══════════════════════════════════════════════
function initRegForm() {
  const form = document.getElementById('regForm');
  if (!form) return;

  populateTahun();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate status radio manually
    const status = form.querySelector('input[name="status"]:checked');
    const statusError = document.getElementById('statusError');
    if (!status) {
      statusError.textContent = 'Pilih status terlebih dahulu.';
      statusError.style.display = 'block';
      form.classList.add('was-validated');
      return;
    } else {
      statusError.style.display = 'none';
    }

    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    // Build payload
    const data = {
      nama:       form.nama.value.trim(),
      status:     status.value,
      nimNip:     form.nimNip.value.trim(),
      fakultas:   form.fakultas.value,
      prodi:      form.prodi.value.trim(),
      noWa:       '+62' + form.noWa.value.trim().replace(/^0/, ''),
      platNomor:  form.platNomor.value.trim().toUpperCase(),
      jenisMotor: form.jenisMotor.value,
      tahunMotor: form.tahunMotor.value,
    };

    // UI: loading
    document.getElementById('btnText').classList.add('d-none');
    document.getElementById('btnLoading').classList.remove('d-none');
    form.querySelector('#submitBtn').disabled = true;

    try {
      const resp = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // avoid CORS preflight
        body: JSON.stringify(data),
      });

      const result = await resp.json();

      if (result.status === 'ok') {
        // Simpan ke sessionStorage untuk halaman success
        sessionStorage.setItem('ticketData', JSON.stringify({
          ...data,
          queue: result.queue,
          timestamp: result.timestamp,
        }));
        window.location.href = 'success.html';
      } else {
        throw new Error(result.message || 'Gagal menyimpan data.');
      }
    } catch (err) {
      // Reset button
      document.getElementById('btnText').classList.remove('d-none');
      document.getElementById('btnLoading').classList.add('d-none');
      form.querySelector('#submitBtn').disabled = false;

      Swal.fire({
        icon: 'error',
        title: 'Pendaftaran Gagal',
        text: err.message.includes('Failed to fetch')
          ? 'Tidak dapat terhubung ke server. Periksa koneksi internet kamu.'
          : err.message,
        confirmButtonColor: '#CC0000',
      });
    }
  });
}

// ══════════════════════════════════════════════
// SUCCESS PAGE
// ══════════════════════════════════════════════
function initSuccessPage() {
  if (!document.getElementById('queueDisplay')) return;

  // Ambil data dari sessionStorage
  let ticket = null;
  try {
    ticket = JSON.parse(sessionStorage.getItem('ticketData'));
  } catch (_) {}

  // Fallback: ambil dari URL params (jika dibagikan via link)
  if (!ticket) {
    const p = new URLSearchParams(window.location.search);
    if (p.get('q')) {
      ticket = {
        queue:      p.get('q'),
        nama:       p.get('n')  || '—',
        status:     p.get('s')  || '—',
        nimNip:     p.get('id') || '—',
        noWa:       p.get('wa') || '—',
        jenisMotor: p.get('m')  || '—',
        platNomor:  p.get('pl') || '—',
      };
    }
  }

  if (!ticket) {
    // Tidak ada data, redirect
    window.location.href = 'register.html';
    return;
  }

  // Isi display
  document.getElementById('queueDisplay').textContent = ticket.queue;
  document.getElementById('tikNama').textContent   = ticket.nama;
  document.getElementById('tikStatus').textContent = ticket.status;
  document.getElementById('tikNim').textContent    = ticket.nimNip;
  document.getElementById('tikWa').textContent     = ticket.noWa;
  document.getElementById('tikMotor').textContent  = `${ticket.jenisMotor} (${ticket.tahunMotor || ''})`;
  document.getElementById('tikPlat').textContent   = ticket.platNomor;

  // Sesi info
  const num  = parseQueueNum(ticket.queue);
  const sesi = getSesi(num);
  document.getElementById('queueSesi').textContent     = `${sesi.label} · Hadir Pukul ${sesi.time}`;
  document.getElementById('sesiInfoTitle').textContent = `${sesi.label} – Hadir Pukul ${sesi.time}`;
  document.getElementById('sesiInfoDesc').textContent  =
    `Nomor antrean ${sesi.range} harap hadir pukul ${sesi.time}`;

  // QR Code
  const qrUrl = `${CONFIG.QR_BASE_URL}?q=${encodeURIComponent(ticket.queue)}`
    + `&n=${encodeURIComponent(ticket.nama)}`
    + `&s=${encodeURIComponent(ticket.status)}`
    + `&id=${encodeURIComponent(ticket.nimNip)}`
    + `&wa=${encodeURIComponent(ticket.noWa)}`
    + `&m=${encodeURIComponent(ticket.jenisMotor)}`
    + `&pl=${encodeURIComponent(ticket.platNomor)}`;

  if (typeof QRCode !== 'undefined') {
    new QRCode(document.getElementById('qrcode'), {
      text: qrUrl,
      width: 100,
      height: 100,
      colorDark: '#1A1A1A',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  // Confetti
  launchConfetti();
}

// ══════════════════════════════════════════════
// CONFETTI
// ══════════════════════════════════════════════
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#CC0000','#FFD700','#FFFFFF','#1A1A1A','#ff6666'];
  const pieces = Array.from({ length: 120 }, () => ({
    x:   Math.random() * canvas.width,
    y:   -20,
    r:   Math.random() * 6 + 3,
    d:   Math.random() * 80 + 20,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 5,
    tiltSpeed: Math.random() * 0.1 + 0.05,
    speed: Math.random() * 3 + 1,
    angle: 0,
  }));

  let frame = 0;
  const MAX_FRAMES = 200;

  function draw() {
    if (frame > MAX_FRAMES) {
      canvas.style.display = 'none';
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();

      p.y     += p.speed;
      p.tilt  += p.tiltSpeed;
      p.angle += .01;
      p.x     += Math.sin(p.angle);
      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    });

    frame++;
    requestAnimationFrame(draw);
  }

  draw();
}

// ══════════════════════════════════════════════
// DOWNLOAD TICKET
// ══════════════════════════════════════════════
async function downloadTicket() {
  const el = document.getElementById('ticketEl');
  if (!el || typeof html2canvas === 'undefined') return;

  try {
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#FFFFFF',
    });

    const link = document.createElement('a');
    link.download = `Tiket-Honda-Service-Visit-${document.getElementById('queueDisplay').textContent}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    alert('Gagal mengunduh tiket. Silakan screenshot manual.');
  }
}

// ══════════════════════════════════════════════
// SHARE TICKET
// ══════════════════════════════════════════════
function shareTicket() {
  const queue = document.getElementById('queueDisplay')?.textContent || '';
  const text  = `Saya sudah daftar Honda Service Visit UIBU!\nNomor Antrean: ${queue}\nDaftarkan motormu juga di: ${window.location.origin}/Honda-Service-Visit/`;

  if (navigator.share) {
    navigator.share({ title: 'Honda Service Visit UIBU', text });
  } else {
    navigator.clipboard.writeText(text).then(() =>
      alert('Teks tiket berhasil disalin ke clipboard!')
    );
  }
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  initRegForm();
  initSuccessPage();
});
