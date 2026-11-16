# TekniKita — Aplikasi Production

Direktori & pemesanan jasa teknisi elektronik rumah tangga (HP, laptop, kulkas, mesin cuci, TV, AC).
Prototipe satu-halaman (localStorage) dikembangkan menjadi aplikasi **production** dengan
**backend Node.js + Express**, **basis data MySQL**, autentikasi sesi, dan **3 peran pengguna**.

## Fitur per peran

### Admin
- Ringkasan direktori: jumlah pengguna, teknisi terverifikasi, total slot hari ini, pesanan, pendapatan penyelesaian.
- **Kelola pengguna**: cari/filter, tambah akun (admin/teknisi/pelanggan), edit, ubah peran, aktif/nonaktifkan, hapus.
- **Moderasi teknisi**: verifikasi mitra, jadikan unggulan/reguler, atur slot harian.
- **Kelola kategori keahlian** (CRUD, kategori yang masih dipakai tidak bisa dihapus).
- Melihat seluruh pesanan beserta status.
- Proteksi: admin tidak bisa menghapus/menonaktifkan dirinya sendiri atau menghabiskan admin aktif terakhir.

### Teknisi (seller/mitra)
- **Profil bengkel**: nama usaha, kategori keahlian, deskripsi, alamat, area, WhatsApp, tarif mulai, biaya panggil, slot harian.
- **Layanan & tarif**: CRUD layanan (harga, estimasi menit, aktif/nonaktif).
- **Pesanan masuk**: terima, mulai kerjakan, selesaikan, atau tolak pesanan; chat pelanggan via WhatsApp.
- Ringkasan performa: jumlah pesanan per status, pendapatan dari pesanan selesai, layanan aktif.
- Akun teknisi baru berstatus **menunggu verifikasi** dan baru tampil di katalog setelah disetujui admin.

### Pelanggan (customer)
- Katalog teknisi terverifikasi: pencarian real-time (nama/area/kerusakan/layanan), filter kategori, sorting.
- Detail teknisi: layanan, tarif, biaya panggil, slot hari ini.
- **Pesan via WhatsApp**: pilih mode *panggil ke rumah* / *datang ke bengkel*, layanan, jadwal, alamat, keluhan.
  Sistem menghitung estimasi, menyimpan pesanan dengan kode unik, mengurangi slot, lalu menyiapkan teks WhatsApp
  yang bisa disalin atau langsung dibuka (`wa.me`).
- Riwayat pesanan, pembatalan pesanan (slot dikembalikan), perubahan data akun & kata sandi.

## Stack
| Bagian | Teknologi |
| --- | --- |
| Runtime | Node.js ≥ 20 (ES Modules) |
| Web | Express 4, express-session + session store MySQL |
| Database | MySQL 8+ / 9.x (`mysql2`), InnoDB, foreign key, transaksi |
| Keamanan | bcryptjs (cost 12), helmet + CSP, rate limit, validasi Zod, proteksi origin, cookie HttpOnly/SameSite |
| Frontend | HTML5 + CSS3 + JavaScript vanilla (tanpa framework, tanpa CDN) |

## Struktur
```
db/
  schema.sql        skema tabel (users, categories, technicians, services, orders, sessions)
  init.js           membuat database + tabel
  seed.js           data dummy (8 teknisi, 29 layanan, 3 pelanggan, 6 pesanan)
server/
  index.js          entrypoint Express (session, keamanan, static, error handler)
  config.js         konfigurasi dari environment
  db.js             pool MySQL + helper query/transaksi
  lib/              helper HTTP, validasi field
  middleware/       attachUser, requireAuth, requireRole
  routes/           auth, catalog, orders, technician, admin, profile
public/
  index.html        katalog publik + modal pemesanan WhatsApp
  login.html, register.html (pelanggan/teknisi)
  dashboard.html    panel sesuai peran
  assets/css, assets/js, assets/img
```

## Menjalankan

1. **Siapkan MySQL** dan buat user aplikasi:
   ```sql
   CREATE DATABASE teknikita CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'teknikita'@'localhost' IDENTIFIED BY 'kata-sandi-kuat';
   GRANT ALL PRIVILEGES ON teknikita.* TO 'teknikita'@'localhost';
   ```
2. **Konfigurasi**:
   ```bash
   cp .env.example .env   # isi DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, SESSION_SECRET
   ```
   `SESSION_SECRET` wajib acak & ≥ 32 karakter saat `NODE_ENV=production`
   (contoh: `openssl rand -hex 32`).
3. **Instal & isi data**:
   ```bash
   npm install
   npm run db:init       # buat database + tabel
   npm run db:seed       # data dummy
   ```
   `npm run db:reset` menjalankan ulang `db:init --reset` (menghapus tabel) — jalankan `db:seed` setelahnya.
4. **Jalankan**:
   ```bash
   npm start             # http://localhost:3000
   npm run dev           # mode watch
   ```

## Akun demo (dari `npm run db:seed`)

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin | `admin@teknikita.id` | `Admin#2026` |
| Teknisi | `teknisi1@teknikita.id` … `teknisi8@teknikita.id` | `Teknisi#2026` |
| Pelanggan | `pelanggan1@teknikita.id` … `pelanggan3@teknikita.id` | `Pelanggan#2026` |

Nomor WhatsApp dummy memakai format internasional `6281200000001`–`6281200000008` sesuai spesifikasi.

## API utama
| Method | Endpoint | Akses |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | publik |
| GET | `/api/auth/me` | sesi |
| GET | `/api/catalog?q=&category=&sort=`, `/api/catalog/categories`, `/api/catalog/summary`, `/api/catalog/:id` | publik |
| POST | `/api/orders` | pelanggan |
| GET | `/api/orders/mine`, PATCH `/api/orders/:id/cancel` | pelanggan |
| GET/PUT | `/api/technician/profile`, PATCH `/api/technician/availability` | teknisi |
| GET/POST/PUT/DELETE | `/api/technician/services[/:id]` | teknisi |
| GET/PATCH | `/api/technician/orders[/:id]`, GET `/api/technician/overview` | teknisi |
| GET/POST/PATCH/DELETE | `/api/admin/users[/:id]` | admin |
| GET/PATCH | `/api/admin/technicians`, `/api/admin/technicians/:id` | admin |
| GET/POST/PATCH/DELETE | `/api/admin/categories[/:id]` | admin |
| GET | `/api/admin/stats`, `/api/admin/orders` | admin |
| PUT | `/api/profile`, `/api/profile/password` | semua peran |

## Aturan bisnis penting
- Teknisi hanya tampil di katalog jika `is_verified = 1` **dan** akun berstatus `active`.
- Pesanan hanya bisa dibuat jika slot > 0; slot dikurangi dalam transaksi `SELECT … FOR UPDATE`
  dan dikembalikan saat pesanan dibatalkan.
- `orders` menyimpan snapshot nama/telepon teknisi dan pelanggan sehingga riwayat tetap utuh
  meskipun akun dihapus (`ON DELETE SET NULL`).
- Estimasi = harga layanan (atau tarif mulai bila layanan umum) + biaya panggil (hanya mode `home`).
- Transisi status pesanan dibatasi: `pending → confirmed/in_progress/cancelled`,
  `confirmed → in_progress/cancelled`, `in_progress → completed/cancelled`.

## Keamanan
- Kata sandi di-hash bcrypt (cost 12); tidak ada kredensial di kode atau localStorage.
- Sesi disimpan di MySQL (`sessions`), cookie `HttpOnly`, `SameSite=Lax`, `Secure` di production, rotasi ID saat login.
- Semua query memakai prepared statement (`?`) sehingga aman dari SQL injection.
- Validasi server-side (Zod) untuk seluruh input, termasuk pembatasan angka non-negatif.
- Rate limit login (10/15 menit) dan pembuatan pesanan (30/jam) per IP.
- CSP membatasi script/style/gambar ke origin sendiri; permintaan pengubah data lintas origin ditolak.
- Admin dapat menonaktifkan akun; sesi pengguna nonaktif otomatis berhenti pada permintaan berikutnya.

## Troubleshooting

Selalu jalankan pemeriksaan database lebih dulu:

```bash
npm run db:check
```

Perintah ini memeriksa koneksi, keberadaan database, kelengkapan tabel/kolom, jumlah baris, dan admin aktif.

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| `{"error":"Terjadi kesalahan pada server… (ref: ABC123)"}` | Error tak terduga di server | Lihat terminal `npm start`, cari baris `[error ABC123]` — di situ tertulis pesan MySQL asli. |
| Login selalu gagal / halaman kosong | MySQL mati atau kredensial `.env` salah | `npm run db:check`; di XAMPP/Laragon/ServBay pastikan MySQL sudah Start. |
| `ECONNREFUSED` | Port salah atau MySQL belum jalan | Cocokkan `DB_PORT` (bawaan MySQL 3306, MariaDB XAMPP 3306). |
| `Access denied for user …` | User MySQL belum dibuat / password beda | Buat user di phpMyAdmin → **User accounts** → *Add user account* (host `localhost`), beri hak pada database `teknikita`, lalu samakan `DB_USER`/`DB_PASSWORD`. |
| `Table 'teknikita.users' doesn't exist` | Skema belum diimpor | `npm run db:init` atau impor `db/schema.sql` lewat phpMyAdmin, lalu `npm run db:seed`. |
| Port 3000 dipakai aplikasi lain | — | Ubah `PORT` di `.env`, atau hentikan proses lain. |

Catatan phpMyAdmin/ServBay: mengimpor berkas `.sql` hanya membuat **database + tabel**; akun MySQL
(`DB_USER`) tetap harus dibuat terpisah. Cara cepat untuk latihan lokal: set `DB_USER=root` dan
`DB_PASSWORD=<password root MySQL Anda>` di `.env`.

## Catatan deployment
- Jalankan di belakang HTTPS/reverse proxy dan set `NODE_ENV=production`, `SESSION_SECRET` acak.
- Gunakan user MySQL dengan hak minimum (`SELECT, INSERT, UPDATE, DELETE` pada database aplikasi).
- Backup rutin tabel `users`, `technicians`, `services`, `orders`; `sessions` boleh dibersihkan berkala.
- Proyek ini tidak memakai layanan berbayar; integrasi WhatsApp memakai tautan `wa.me` resmi.
