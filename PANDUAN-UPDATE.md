# PANDUAN UPDATE v4 — Scan Barcode + Antarmuka Instan

Yang baru: **scan barcode** (Kasir & Stok) dan **antarmuka cepat** (menu terbuka seketika, transaksi tanpa menunggu).
Fungsi modul lain **tidak berubah**. Urutan wajib: **A (backend) dulu, baru B (frontend)**.

---
## A. Perbarui Backend (Apps Script)
1. Buka project Apps Script Anda → file **Kode** → ganti seluruh isi dengan `Kode.gs` yang baru.
2. **Deploy → Manage deployments → ✏️ → Version: New version → Deploy.** (URL `/exec` tetap sama.)
3. Tes: buka `URL_EXEC_ANDA?action=ping` → harus tampil `"versi":"3.1-api"`.

Tidak ada izin baru dan **tidak perlu** menjalankan `setupAppEnvironment()`. Kolom `Barcode` ditambahkan otomatis di sheet **Barang** saat Anda pertama kali menyimpan barang.

## B. Perbarui Frontend (GitHub)
1. Ekstrak `e-warungku-update-v4.zip` ke folder sementara (klik kanan → *Extract All…*).
2. Salin **semua isinya** (`index.html`, folder `css`, folder `js`) ke folder kerja Anda `C:\Users\USER\Downloads\e-warungku-frontend` → pilih **Replace the files in the destination**.
   > `js\config.js` **tidak ada** di paket ini, jadi alamat backend Anda aman.
3. Buka PowerShell di folder kerja itu, lalu:
```powershell
git add .
git commit -m "v4: scan barcode + antarmuka instan"
git push
```
4. Tunggu 1–2 menit, buka situs, tekan **Ctrl+Shift+R**.

---
## C. Cara Memakai Scan

### Scanner USB / Bluetooth (paling cepat)
- Pakai mode **keyboard (HID)** — bawaan hampir semua scanner. Bluetooth: pairing seperti keyboard.
- Pastikan scanner menambah **Enter** setelah membaca (bawaan). Tes: scan di Notepad → angka muncul lalu pindah baris.
- Tidak perlu klik apa pun: di halaman **Kasir/Stok**, cukup scan. Tekan **F2** untuk mengembalikan kursor ke kolom scan.

### Daftarkan barcode barang (sekali saja)
**Stok & Barang → Tambah / Edit Barang → kolom Barcode** → klik kolom itu lalu scan (atau tombol 📷). Simpan.
Barang tanpa barcode: kosongkan saja; di Kasir tetap bisa discan memakai **Kode barang** (mis. `EL001`) bila Anda mencetak label dengan kode itu.
Mendaftarkan sambil menerima barang baru: **scan barcode yang belum terdaftar → form Tambah Barang terbuka dengan barcode terisi** (admin).

### Kasir (barang keluar)
Scan barang → otomatis masuk struk (scan lagi = qty +1; nada **tit** = berhasil, nada rendah = gagal). **F8** = Selesaikan & cetak struk.
Setelah menekan bayar, layar langsung siap untuk pembeli berikutnya; penyimpanan berjalan di latar belakang (tampil chip ⏳). Bila server menolak, struk **dikembalikan otomatis** dan Anda diberi tahu.

### Stok (barang masuk)
Scan barang → terpilih di form Barang Masuk, **harga beli terisi dari modal terakhir**. Scan barang yang sama berulang = qty bertambah. Cek harga beli → **Catat & Tambah Stok**. Form dikosongkan, siap scan barang berikutnya.

### Kamera HP/laptop
Tombol **📷 Kamera** di kotak scan. Izinkan kamera saat diminta. Di Kasir kamera tetap menyala untuk scan berturut-turut; di Stok mati setelah satu scan. Butuh internet (pustaka pemindai dimuat saat pertama dipakai) dan cahaya cukup.

---
## D. Yang Berubah pada Kecepatan
| Sebelum | Sekarang |
|---|---|
| Tiap menu memuat data dari server | Data **semua menu** dimuat **1× di latar belakang** setelah login; menu terbuka seketika |
| Layar menunggu "Memuat…" | Tampil dari cache dulu, diperbarui diam-diam bila ada yang berubah |
| Bayar → tunggu server → layar kosong | Layar **langsung kosong & siap**; simpan di latar belakang |
| Muat ulang halaman → logout/loading | Muat ulang → langsung tampil (token divalidasi diam-diam) |
| Server membaca Sheets tiap permintaan | Hasil di-cache di server dan otomatis dibuang tiap ada penulisan |

Catatan jujur:
- **Beberapa detik pertama setelah login**, menu yang datanya belum sempat dimuat latar belakang menampilkan kerangka abu-abu sebentar.
- Bila Anda **mengedit Google Sheets langsung**, perubahan terlihat di aplikasi maksimal ±2 menit.
- Server Google tetap punya "start dingin" (permintaan pertama setelah lama diam bisa lebih lambat). Itu di luar kendali aplikasi.

## E. Troubleshooting
| Gejala | Solusi |
|---|---|
| Scan tidak masuk ke struk | Klik area kosong halaman atau tekan **F2**; pastikan scanner beri **Enter**; cek barcode sudah didaftarkan |
| Barcode terbaca tapi "tidak terdaftar" | Daftarkan di Edit Barang. Kode UPC/EAN beda angka 0 di depan sudah otomatis dianggap sama |
| "Barcode sudah dipakai: …" | Satu barcode hanya boleh untuk satu barang |
| Tombol kamera: "gagal dimuat" | Periksa internet; Ctrl+Shift+R |
| "Izin kamera ditolak" | Ikon 🔒 di address bar → izinkan Kamera → muat ulang |
| Tampilan lama setelah push | Ctrl+Shift+R |
| Menu pertama tampil kerangka lama | Backend belum "New version" (Bagian A) |
| Transaksi "GAGAL disimpan" | Baca pesannya (mis. stok tidak cukup); struk dikembalikan otomatis |

## F. Daftar Uji (5 menit)
- [ ] `?action=ping` → versi 3.1-api
- [ ] Login → pindah antar menu terasa instan
- [ ] Edit barang → scan barcode ke kolom Barcode → simpan
- [ ] Kasir: scan 3× → qty 3 → bayar → struk muncul, layar langsung siap
- [ ] Stok: scan barang 2× → qty 2 → Catat → stok bertambah
- [ ] Muat ulang halaman → langsung masuk (tidak diminta login)
