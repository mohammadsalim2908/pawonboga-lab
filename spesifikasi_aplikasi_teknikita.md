# Spesifikasi Aplikasi TekniKita

**Direktori & pemesanan jasa teknisi elektronik rumah tangga** — HP, laptop, kulkas, mesin cuci, TV, dan AC.

---

## 1. Apa itu TekniKita?

TekniKita membantu keluarga menemukan teknisi elektronik yang bisa dipercaya tanpa harus tanya-tanya di grup chat. Pelanggan bisa melihat tarif, biaya panggil, sisa slot hari ini, dan lokasi teknisi sebelum menghubungi. Setelah memilih, pesanan tercatat dengan kode unik dan ringkasannya langsung siap dikirim ke WhatsApp teknisi.

Aplikasi ini bukan sekadar katalog. Ada tiga pihak yang benar-benar bekerja di dalamnya: **admin** yang mengelola pengguna dan memverifikasi mitra, **teknisi** yang mengatur profil serta daftar layanannya sendiri, dan **pelanggan** yang mencari lalu memesan. Semua data tersimpan di basis data MySQL, bukan lagi di browser.

## 2. Gambaran sistem

Aplikasi berjalan sebagai satu server web:

- **Backend:** Node.js + Express. Menangani login, API, validasi, dan seluruh aturan bisnis.
- **Database:** MySQL. Menyimpan pengguna, kategori, teknisi, layanan, pesanan, dan sesi login.
- **Frontend:** HTML + CSS + JavaScript vanilla. Tanpa framework dan tanpa CDN, jadi ringan dan cepat dibuka.
- **Autentikasi:** sesi login disimpan di tabel `sessions`; browser hanya memegang cookie `HttpOnly`.

Alurnya sederhana: browser memanggil API (`/api/...`), server memeriksa sesi dan peran, menjalankan query ke MySQL, lalu mengembalikan JSON. Semua halaman ada di origin yang sama, sehingga tidak ada masalah CORS.

```
Pelanggan ─┐
Teknisi  ──┼─→ Browser → API Express (sesi + peran) → MySQL
Admin    ─┘                      │
                                 └→ tautan WhatsApp (wa.me)
```

## 3. Peran dan hak akses

| Peran | Yang bisa dilakukan |
|---|---|
| **Admin** | Melihat ringkasan direktori; menambah, mengedit, mengubah peran, menonaktifkan, dan menghapus pengguna; memverifikasi teknisi, menjadikan unggulan, mengatur slot; mengelola kategori umum; memantau semua pesanan. |
| **Teknisi** | Mengatur profil teknisi/usaha (termasuk kategori pribadi dan tautan Google Maps); mengelola layanan beserta tarifnya; menerima, mengerjakan, menyelesaikan, atau menolak pesanan; melihat ringkasan performa. |
| **Pelanggan** | Mencari dan memfilter teknisi; melihat detail layanan; membuat pesanan panggil ke rumah atau datang ke lokasi; memantau dan membatalkan pesanannya; mengubah data akun. |

Halaman katalog bisa dibuka tanpa login. Membuat pesanan wajib masuk sebagai pelanggan. Dashboard menyesuaikan menu dengan peran yang sedang login.

## 4. Alur utama

1. **Cari** — pelanggan membuka katalog, mencari kata kunci (nama, area, jenis kerusakan, atau nama layanan), memilih kategori, dan mengurutkan berdasarkan rekomendasi, tarif, atau slot.
2. **Pilih** — detail teknisi menampilkan deskripsi keahlian, daftar layanan dengan tipe harganya, alamat, tautan Google Maps, serta sisa slot hari ini.
3. **Pesan** — pelanggan memilih layanan, mode layanan, jadwal, alamat, dan menuliskan keluhan. Sistem menghitung perkiraan biaya, menyimpan pesanan dengan kode unik, dan mengurangi slot teknisi satu.
4. **WhatsApp** — pesan otomatis berisi kode pesanan, layanan, mode, jadwal, alamat, keluhan, dan perkiraan biaya. Pelanggan bisa menyalin teks atau langsung membuka `wa.me`. Nomor WhatsApp memakai format internasional.
5. **Kelola** — teknisi memperbarui status pesanan. Pelanggan melihat perubahan status dan bisa membatalkan pesanan selama belum dikerjakan; slot otomatis dikembalikan.

## 5. Tipe harga layanan

Satu teknisi bisa punya banyak layanan, dan tiap layanan punya tipe harganya sendiri:

| Tipe | Tampilan ke pelanggan | Cocok untuk |
|---|---|---|
| **Harga tetap** | `Rp 350.000` | Servis dengan biaya pasti, mis. ganti LCD. |
| **Mulai dari** | `Mulai Rp 200.000` | Perbaikan yang biayanya bergantung hasil pengecekan. |
| **Sesuai diagnosa** | `Sesuai diagnosa` | Kerusakan yang belum diketahui; harga ditentukan setelah pemeriksaan. |

Setiap layanan juga ditandai **jasa saja** atau **termasuk komponen/spare part**. Harga layanan bersifat opsional: teknisi tetap punya *tarif servis mulai* di profil sebagai patokan umum dan untuk pengurutan katalog.

Perkiraan pesanan dihitung: harga layanan (atau tarif mulai bila pelanggan memilih servis umum) + biaya panggil bila mode *panggil ke rumah*. Untuk layanan bertipe "sesuai diagnosa", sistem tidak memaksakan angka — pesanan mencatat total 0 dan pesan WhatsApp menyebut bahwa biaya menunggu diagnosa. Tipe harga disimpan sebagai snapshot di pesanan agar riwayat tidak berubah saat tarif diperbarui.

## 6. Aturan bisnis

- Teknisi hanya muncul di katalog jika **sudah diverifikasi admin** dan akunnya aktif. Teknisi baru mendaftar dengan status menunggu verifikasi.
- Teknisi dengan slot 0 tampil sebagai **Slot penuh** dan tombol pemesanan dinonaktifkan.
- Slot dikurangi saat pesanan dibuat dan dikembalikan saat pesanan dibatalkan. Pengurangan dilakukan dalam transaksi database agar tidak bentrok.
- Status pesanan: `pending → confirmed / in_progress / cancelled`, `confirmed → in_progress / cancelled`, `in_progress → completed / cancelled`. Perpindahan lain ditolak.
- Kategori umum dikelola admin dan dipakai saat pendaftaran. Teknisi dapat membuat **kategori pribadi**; kategori itu hanya muncul dan bisa dipakai oleh akun pembuatnya, tidak terlihat oleh teknisi lain. Di katalog, kategori tetap muncul sebagai filter jika ada teknisi terverifikasi yang memakainya.
- Tautan Google Maps bersifat opsional. Server hanya menerima tautan dari domain Google Maps (mis. `maps.app.goo.gl` atau `maps.google.com`).
- Admin tidak bisa menghapus atau menonaktifkan akunnya sendiri, dan sistem selalu menyisakan minimal satu admin aktif.
- Pesanan menyimpan salinan nama/telepon pelanggan dan teknisi, sehingga riwayat tetap utuh meskipun akun dihapus.

## 7. Struktur data

| Tabel | Isi penting |
|---|---|
| `users` | Nama, email unik, telepon, hash kata sandi, peran (`admin`/`technician`/`customer`), status (`active`/`suspended`). |
| `categories` | Nama, deskripsi, ikon, urutan, dan `owner_user_id` (kosong = kategori umum, terisi = kategori pribadi teknisi). |
| `technicians` | Profil usaha: nama, kategori, deskripsi, alamat, `maps_url`, area, WhatsApp, tarif mulai, biaya panggil, slot, unggulan, terverifikasi, rating. |
| `services` | Layanan per teknisi: nama, deskripsi, `price_type` (`fixed`/`starting`/`quote`), `includes_parts`, harga, estimasi menit, status aktif. |
| `orders` | Kode unik, pelanggan, teknisi, layanan, snapshot nama/telepon, tipe harga, mode layanan, keluhan, alamat, total perkiraan, status, jadwal. |
| `sessions` | Sesi login (disimpan server, bukan di browser). |

## 8. Keamanan dan kualitas

- Kata sandi di-hash dengan bcrypt (cost 12). Tidak ada kredensial yang disimpan di kode atau browser.
- Semua query memakai prepared statement, dan semua input divalidasi ulang di server (Zod) — termasuk larangan angka negatif, format WhatsApp, dan tautan Maps.
- Cookie sesi `HttpOnly` + `SameSite=Lax` (+ `Secure` saat production), ID sesi diganti setiap login. Akun yang dinonaktifkan langsung kehilangan akses pada permintaan berikutnya.
- Rate limit untuk login (10 percobaan / 15 menit) dan pembuatan pesanan (30 / jam).
- Header keamanan (helmet + CSP), permintaan pengubah data dari origin lain ditolak, dan pesan error 500 menyertakan kode referensi agar mudah ditelusuri.
- Antarmuka responsif untuk ponsel dan laptop, memakai format Rupiah, dan tetap terbaca tanpa aset eksternal.

## 9. Menjalankan aplikasi

```bash
cp .env.example .env     # isi kredensial MySQL + SESSION_SECRET
npm install
npm run db:init && npm run db:seed
npm start                # http://localhost:3000
npm run db:check         # diagnosa koneksi & kelengkapan tabel
```

Untuk database yang sudah berisi data, jalankan migrasi `db/migrations/001_pricing_maps_private_categories.sql` sekali lewat phpMyAdmin (atau `mysql` CLI), bukan `db:init --reset`.

**Akun demo:** admin `admin@teknikita.id` / `Admin#2026` · teknisi `teknisi1@teknikita.id` / `Teknisi#2026` · pelanggan `pelanggan1@teknikita.id` / `Pelanggan#2026`.

## 10. Batasan saat ini

Di luar cakupan versi ini: pembayaran digital, pelacakan lokasi real-time, chat internal (komunikasi lewat WhatsApp), ulasan/rating yang dibuat pengguna (rating masih data contoh), notifikasi email/push, serta multi-bahasa.

## 11. Perkembangan dari versi MVP

Versi awal adalah satu halaman dengan data di `localStorage`, tanpa login dan tanpa database. Versi sekarang: backend Express dengan MySQL, autentikasi sesi dan tiga peran nyata, CRUD pengguna oleh admin, profil serta layanan yang dikelola teknisi, kategori pribadi, tautan Google Maps, dan tiga tipe harga per layanan. Tampilan, istilah ("bengkel" → "teknisi"), serta alur pesanan ikut disesuaikan, termasuk perhitungan estimasi dan teks pesan WhatsApp.
