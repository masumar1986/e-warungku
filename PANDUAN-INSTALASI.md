# PANDUAN INSTALASI — E-Warungku (Backend GAS + Frontend GitHub Pages)

```
Browser pelanggan/staf ──► GitHub Pages  (index.html + css/ + js/)   ← frontend statis
                               │  fetch() POST text/plain {action,args}
                               ▼
                     Google Apps Script /exec  (Kode.gs = REST API JSON)
                               ▼
                     Google Sheets · Drive · Gmail   ← data Anda, TIDAK berubah
```

Data (Spreadsheet, foto, logo, pengguna) **tetap sama** — yang berubah hanya cara aplikasi ditampilkan.

---

## BAGIAN A — Perbarui Backend (Google Apps Script)

Kerjakan di project Apps Script yang **sudah Anda pakai sekarang** (jangan buat project baru, agar data lama tetap terhubung).

1. Buka https://script.google.com → project E-Warungku.
2. Klik file **Kode** → hapus semua isinya → tempel seluruh isi `Kode.gs` yang baru.
3. **Hapus 3 file HTML**: `Index`, `Stylesheet`, `JavaScript` (arahkan kursor ke nama file → ⋮ → *Remove*). Halaman kini dilayani GitHub, bukan Apps Script.
4. *(Disarankan)* ⚙️ **Project Settings** → centang **Show "appsscript.json" manifest file in editor** → kembali ke Editor → buka `appsscript.json` → ganti isinya dengan `appsscript.json` yang baru.
5. **Jangan** jalankan `setupAppEnvironment()` — Spreadsheet & folder Drive Anda sudah ada. (Hanya untuk instalasi baru dari nol.)
6. **Deploy → Manage deployments → ✏️ (edit)** pada deployment yang ada:
   - Version: **New version**
   - Execute as: **Me**
   - Who has access: **Anyone**  ← wajib, tanpa ini frontend di GitHub kena error CORS
   - Klik **Deploy**. URL `/exec` **tetap sama**. (Kalau belum pernah deploy: *New deployment → Web app*, lalu salin URL `/exec`.)
7. **Tes backend:** buka di browser `URL_EXEC_ANDA?action=ping` — harus tampil:
   ```
   {"success":true,"data":{"app":"E-Warungku","versi":"3.0-api",...},"message":"OK"}
   ```
   Kalau yang muncul halaman login Google → akses belum **Anyone** (ulangi langkah 6).

> ⚠️ Embed Blogger/iframe lama yang menunjuk ke URL `/exec` tidak akan menampilkan aplikasi lagi (kini isinya JSON). Ganti dengan alamat GitHub Pages nanti.

---

## BAGIAN B — Siapkan Frontend

1. Ekstrak `e-warungku-frontend.zip` dengan **klik kanan → Extract All…** (Windows) atau klik dua kali (Mac). Hasilnya sebuah folder **`e-warungku-frontend`**.
2. Buka folder itu. Anda **harus langsung melihat** `index.html`, folder `css`, dan folder `js` — bukan folder lain di dalamnya.
3. Buka `js/config.js` dengan Notepad. Ganti `PASTE_URL_EXEC_DI_SINI` dengan URL `/exec` dari langkah A6. Simpan.
   ```js
   const GAS_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. *(Opsional)* Tes lokal: klik dua kali `index.html` → login `admin` / `admin123`.

---

## BAGIAN C — Pasang di GitHub Pages (lewat terminal)

> **Folder kerja untuk `git init` adalah `e-warungku-frontend`** — folder yang berisi `index.html` langsung. Bukan folder Downloads, bukan folder di atasnya.

**C1. Pasang Git** — Windows: https://git-scm.com/download/win (pengaturan default), lalu buka **PowerShell**. Mac: ketik `git --version` di Terminal. Cek:
```bash
git --version
```

**C2. Akun GitHub** — daftar di https://github.com. Username Anda menjadi bagian alamat situs (`username.github.io`).

**C3. Identitas Git (sekali saja)**
```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

**C4. Buat repository** — github.com → **+** → **New repository** → nama: `e-warungku` → **Public** → **JANGAN** centang README/.gitignore/license → **Create repository**.

**C5. Masuk ke folder & VERIFIKASI** (langkah paling sering salah)
```powershell
cd "C:\Users\NAMA\Downloads\e-warungku-frontend"
dir
```
`dir` harus menampilkan **`index.html`**, `css`, `js`. Kalau yang tampil `e-warungku-frontend` lagi / `backend` — Anda terlalu tinggi, `cd` masuk satu level. **Jangan lanjut sebelum `index.html` terlihat.**

**C6. Kirim ke GitHub** (satu per satu; tanda sukses di akhir)
```bash
git init
git add .
git commit -m "Upload pertama"
```
```bash
git branch -M main
git remote add origin https://github.com/USERNAME/e-warungku.git
git push -u origin main
```
Diminta *Username* → username GitHub. *Password* → **Personal Access Token** (bukan password akun). Saat menempel token **layar tampak kosong — itu normal**. Sukses bila muncul `* [new branch] main -> main`.

*Membuat token:* https://github.com/settings/tokens → **Generate new token (classic)** → centang **repo** → Generate → salin `ghp_...` (hanya tampil sekali).

**C7. Aktifkan Pages** — repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch **main** · **/ (root)** → **Save** → centang **Enforce HTTPS**. Tunggu 1–2 menit: situs live di `https://USERNAME.github.io/e-warungku/`.

**C8. Tes** — buka alamat itu, tekan **Ctrl+Shift+R**, login.

**C9. Update di kemudian hari**
```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```

---

## BAGIAN D — Daftar Uji

- [ ] Halaman login tampil lengkap (warna, logo) — bukan teks polos
- [ ] Login `admin` → Dashboard terisi; refresh halaman → **tetap masuk**
- [ ] Katalog menampilkan foto barang; kasir menyimpan transaksi (cek Sheets)
- [ ] Cetak invoice, Unduh PDF, Export Excel (file terunduh)
- [ ] Pesanan pelanggan → lonceng admin berbunyi badge; resi `EW…` muncul
- [ ] **Ganti sandi demo** (admin123 / kasir123 / pelanggan123) di menu Pengaturan

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| Banner kuning "Alamat backend belum diisi" | `GAS_URL` masih placeholder | Edit `js/config.js`, push ulang |
| "Respons server tidak valid… Anyone" | Akses deployment bukan **Anyone**, atau URL bukan `/exec` | A6 ulang; pastikan URL berakhiran `/exec` |
| "Tidak dapat menghubungi server" | Internet putus / CORS | Cek `?action=ping` di browser; pastikan **Anyone** |
| Perubahan kode backend tak berefek | Lupa buat **New version** | Manage deployments → ✏️ → New version → Deploy |
| 404 di GitHub Pages | `index.html` tidak di root repo | Buka repo di GitHub: `index.html` harus terlihat di daftar teratas. Kalau yang terlihat folder lain → ulangi dari C5 di folder yang benar, lalu `git push -u origin main --force` |
| Halaman tanpa styling, 404 css/js | File rata di root (upload via web) | Selalu push dari terminal (C6) agar folder `css/` `js/` terjaga |
| `Password authentication is not supported` | Memakai password akun | Pakai Personal Access Token |
| Situs masih versi lama | Cache | Ctrl+Shift+R / jendela Incognito |
| Foto/logo tak tampil | Drive memblokir berbagi publik (Workspace) | Logo tetap muncul di invoice; foto butuh berbagi "siapa saja dengan link" |
| "Terlalu banyak percobaan gagal" | 5× salah sandi → dikunci 10 menit | Tunggu 10 menit |
| `LF will be replaced by CRLF` | Peringatan format baris | Abaikan |

## Catatan keamanan

- Frontend publik **tidak memuat rahasia** — hanya alamat API.
- Token login disimpan di `sessionStorage` (hilang saat tab ditutup) dan berlaku 6 jam di server.
- Backend hanya melayani daftar fungsi yang diizinkan (`apiTable()` di `Kode.gs`); fungsi internal tidak bisa dipanggil dari internet.
- Hak akses (admin/karyawan/pelanggan) selalu dicek **di server**, bukan hanya di tampilan.
