// ============================================
// API — satu-satunya tempat komunikasi ke backend Google Apps Script
// ============================================
// Format permintaan : POST  {action, args:[...]}  — token sesi ada di args (argumen pertama)
// Format respons    : {success, data, message}
// WAJIB 'text/plain' : 'application/json' memicu CORS preflight yang ditolak Google Apps Script.
const API_TIMEOUT_MS = 90000; // ekspor Excel/PDF bisa lama

function configOk() { return typeof GAS_URL === 'string' && /^https:\/\/script\.google\.com\/.+\/exec$/.test(GAS_URL); }

async function api(action, args) {
  if (!configOk()) throw new Error('Alamat backend belum diisi. Edit js/config.js (GAS_URL).');
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, args: args || [] }),
      signal: ctl.signal
    });
    const txt = await res.text();
    try { return JSON.parse(txt); }
    catch (e) { throw new Error('Respons server tidak valid. Pastikan URL /exec benar dan deployment diset "Anyone".'); }
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Server terlalu lama merespons. Coba lagi.');
    if (e instanceof TypeError) throw new Error('Tidak dapat menghubungi server. Periksa koneksi internet dan URL backend.');
    throw e;
  } finally { clearTimeout(timer); }
}
