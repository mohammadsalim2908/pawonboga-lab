# SPEC.md — TekniKita (Direktori & Pemesanan Jasa Teknisi Elektronik)

## 1. Tujuan Aplikasi
**TekniKita** adalah aplikasi web direktori dan pemesanan layanan teknisi perbaikan perangkat elektronik rumah tangga (HP, laptop, kulkas, televisi, mesin cuci, dan AC) yang dirancang untuk membantu keluarga menemukan teknisi terpercaya dengan cepat. Aplikasi ini menyediakan transparansi estimasi tarif servis, biaya panggilan ke rumah, ketersediaan slot harian, lokasi bengkel, serta integrasi pesan otomatis ke WhatsApp.

Dokumen ini disusun sebagai acuan pengembangan *Minimum Viable Product* (MVP) untuk latihan *vibe coding* 1 hari tanpa ketergantungan pada *backend* maupun layanan berbayar.

---

## 2. Pengguna (Target Users)
Aplikasi dijalankan pada **satu perangkat** tanpa mekanisme autentikasi/login palsu, dengan dua mode peran pengguna yang dapat diakses melalui navigasi utama:
1. **Calon Pelanggan (Keluarga):** Mencari teknisi berdasarkan kategori perangkat atau jenis kerusakan, membandingkan tarif dan slot tersedia, lalu menghubungi teknisi via WhatsApp untuk memesan layanan *panggil ke rumah* atau *datang ke lokasi bengkel*.
2. **Pengelola / Admin Direktori:** Mengelola daftar mitra teknisi (menambah, mengubah, menghapus data, mengatur status unggulan, dan memperbarui ketersediaan slot harian) melalui tampilan dashboard demo.

---

## 3. Daftar Fitur MVP
### A. Halaman Katalog Teknisi (Tampilan Pelanggan)
1. **Daftar 8 Profil Layanan Teknisi Contoh:** Mencakup spesialisasi *HP & Gadget*, *Laptop & PC*, *Kulkas & Mesin Cuci*, *TV & Audio*, dan *AC & Pendingin* lengkap dengan ilustrasi/avatar SVG lokal.
2. **Informasi Kartu Teknisi:** Menampilkan nama teknisi/bengkel, kategori keahlian, lencana *Unggulan*, area/patokan lokasi bengkel, deskripsi kerusakan yang ditangani, **Tarif Servis Mulai (Rp)**, **Biaya Panggil ke Rumah (Rp)**, dan **Slot Tersedia Hari Ini**.
3. **Pencarian Real-Time:** Menyaring teknisi berdasarkan kata kunci nama bengkel, area lokasi, atau jenis kerusakan (misalnya: *"layar pecah"*, *"tidak dingin"*, *"mati total"*).
4. **Filter Kategori Keahlian:** Menyaring daftar teknisi berdasarkan kategori perangkat atau menampilkan semua kategori.
5. **Pengurutan (*Sorting*):** Mengurutkan daftar berdasarkan *Rekomendasi (Unggulan)*, *Tarif Servis Termurah*, *Tarif Servis Tertinggi*, dan *Slot Tersedia Terbanyak*.
6. **Pemesanan via WhatsApp Terstruktur:**
   - Membuka dialog konfirmasi sebelum mengarahkan ke WhatsApp (`wa.me`).
   - Pelanggan dapat memilih mode layanan: **Panggil ke Rumah** (otomatis menghitung estimasi `tarifMulai + biayaPanggil`) atau **Datang ke Lokasi Teknisi** (tanpa biaya panggil).
   - Pelanggan dapat mengisi detail keluhan perangkat secara opsional, melihat pratinjau pesan otomatis, menyalin teks pesan, atau langsung membuka tautan WhatsApp.
   - Jika `slotTersedia === 0`, status tampil sebagai **Slot Penuh** dan tombol pemesanan dinonaktifkan.

### B. Dashboard Demo Pengelola (CRUD & Ringkasan)
1. **Ringkasan Statistik Direktori:**
   - **Total Teknisi:** Jumlah keseluruhan mitra teknisi aktif.
   - **Total Slot Tersedia Hari Ini:** Akumulasi seluruh `slotTersedia` dari semua teknisi.
   - **Jumlah Kategori:** Total kategori keahlian yang tersedia.
2. **Operasi CRUD Teknisi:**
   - **Create:** Menambah data teknisi baru dengan validasi input (tarif dan slot tidak boleh bernilai negatif).
   - **Read:** Menampilkan daftar seluruh teknisi dalam tabel/daftar pengelolaan.
   - **Update:** Mengedit seluruh detail profil teknisi maupun mengubah status *Unggulan* dan jumlah slot secara cepat.
   - **Delete:** Menghapus profil teknisi dari daftar dengan konfirmasi.
3. **Persistensi & Reset Data:**
   - Seluruh perubahan disimpan secara otomatis ke `localStorage` dengan kunci `teknikita:technicians:v1`.
   - Tersedia tombol **Reset Data Demo** untuk mengembalikan data ke 8 profil contoh awal.

---

## 4. Data Model
Setiap entitas layanan teknisi direpresentasikan dalam objek JavaScript dengan struktur berikut:

```json
{
  "id": "tek-01",
  "nama": "Rizky Cell & Gadget Repair",
  "kategori": "HP & Gadget",
  "tarifMulai": 50000,
  "biayaPanggil": 20000,
  "slotTersedia": 4,
  "lokasi": "Jl. Ahmad Yani No. 14, Banyuwangi Kota",
  "deskripsi": "Spesialis ganti LCD, baterai kembung, konektor cas, dan perbaikan HP mati total semua merek.",
  "imageUrl": "data:image/svg+xml;utf8,...",
  "unggulan": true
}
```

### Aturan Validasi Atribut
| Properti | Tipe Data | Aturan / Keterangan |
| :--- | :--- | :--- |
| `id` | `string` | Pengenal unik setiap profil teknisi (contoh: `"tek-01"` atau timestamp). |
| `nama` | `string` | Wajib diisi, minimal 3 karakter. |
| `kategori` | `string` | Salah satu dari: `"HP & Gadget"`, `"Laptop & PC"`, `"Kulkas & Mesin Cuci"`, `"TV & Audio"`, `"AC & Pendingin"`. |
| `tarifMulai` | `number` | Angka Rupiah `>= 0` (estimasi biaya jasa dasar). |
| `biayaPanggil` | `number` | Angka Rupiah `>= 0` (tambahan biaya transportasi jika teknisi datang ke rumah). |
| `slotTersedia` | `integer` | Bilangan bulat `>= 0` (kuota layanan tersedia pada hari berjalan). |
| `lokasi` | `string` | Wajib diisi, informasi area atau patokan alamat bengkel. |
| `deskripsi` | `string` | Wajib diisi, penjelasan singkat jenis kerusakan yang ditangani. |
| `imageUrl` | `string` | Data URI SVG lokal bawaan berdasarkan kategori (menghindari tautan eksternal rusak). |
| `unggulan` | `boolean` | `true` jika ditampilkan sebagai teknisi rekomendasi utama, `false` jika reguler. |

---

## 5. Nonfunctional Requirements
1. **Tech Stack:** Vite + JavaScript Vanilla (HTML5, CSS3, ES6+) tanpa *framework backend* dan tanpa layar login palsu.
2. **Keamanan & Privasi:**
   - Tidak menyimpan API key atau kredensial rahasia apa pun di dalam kode maupun `localStorage`.
   - Seluruh data contoh bersifat nonpribadi; tautan WhatsApp menggunakan nomor simulasi baku (`6281200000000`).
   - Tidak menggunakan aset gambar eksternal berhak cipta; seluruh ikon dan ilustrasi menggunakan SVG lokal buatan sendiri.
3. **Antarmuka & Responsivitas:** Tampilan bersih, kontras terbaca jelas pada layar ponsel (*mobile*) maupun laptop (*desktop*), serta menggunakan format mata uang Rupiah (`Rp 50.000`).
4. **Kinerja:** Waktu muat instan (< 1 detik) karena seluruh data awal dan aset berada secara lokal.

---

## 6. Risiko & Mitigasi
| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Data `localStorage` rusak atau terhapus pengguna | Aplikasi gagal merender daftar teknisi | Membungkus `JSON.parse` dengan `try-catch` dan otomatis memuat ulang 8 data bawaan jika data kosong/korup, serta menyediakan tombol *Reset Data Demo*. |
| Perangkat pengujian tidak terinstal aplikasi WhatsApp | Tautan `https://wa.me/...` tidak membuka aplikasi chat | Menyediakan modal pratinjau pesan lengkap dengan tombol **Salin Teks Pesan** di samping tombol **Buka WhatsApp**. |
| Input angka negatif atau kosong pada form admin | Perhitungan estimasi tarif atau total slot menjadi `NaN`/negatif | Melakukan sanitasi `Math.max(0, parseInt(val) || 0)` sebelum menyimpan data ke state dan `localStorage`. |

---

## 7. Out-of-Scope (Di Luar Cakupan MVP)
- Sistem autentikasi akun pengguna/mitra (login/register) dan manajemen peran berbasis server.
- Basis data *cloud* / REST API *backend* (seluruh data hanya tersimpan lokal di browser perangkat).
- Integrasi pembayaran digital (*payment gateway*) maupun pelacakan lokasi GPS secara *real-time*.
- Sistem ulasan/rating dinamis antar-pengguna.

---

## 8. Acceptance Criteria (Pemeriksaan Manual)
1. **Inisialisasi Katalog:** Saat aplikasi pertama kali dibuka, tampil tepat **8 profil teknisi contoh** lengkap dengan ilustrasi lokal, tarif mulai, biaya panggil, lokasi, dan slot tersedia.
2. **Pencarian & Filter:** Mengetik kata kunci kerusakan (misal *"kulkas"* atau *"LCD"*) dan memilih filter kategori langsung menyaring daftar kartu teknisi secara akurat.
3. **Sorting:** Memilih urutan *Tarif Termurah* mengurutkan kartu dari `tarifMulai` terkecil ke terbesar; memilih *Rekomendasi* menempatkan teknisi `unggulan: true` di posisi teratas.
4. **Alur Pesan WhatsApp:** Mengklik tombol **Pesan via WhatsApp** membuka modal pilihan layanan (*Panggil ke Rumah* vs *Datang ke Bengkel*), memperbarui estimasi total biaya secara otomatis, dan menghasilkan URL `https://wa.me/6281200000000?text=...` yang valid.
5. **CRUD Dashboard & Ringkasan:** Menambah, mengedit, atau menghapus teknisi di tab Dashboard langsung memperbarui angka ringkasan (*Total Teknisi*, *Total Slot*, *Jumlah Kategori*) dan daftar di Katalog.
6. **Persistensi `localStorage`:** Setelah melakukan perubahan data di Dashboard lalu me-*refresh* halaman browser (`F5`), data perubahan tetap tersimpan.
7. **Slot Penuh:** Jika `slotTersedia` diubah menjadi `0`, kartu teknisi di katalog menampilkan status **Slot Penuh** dan tombol pemesanan tidak dapat diklik.

---

## 9. Implementation Plan per Iterasi
- **Iterasi 1 — Perencanaan & Fondasi Data:** Menyusun `SPEC.md`, struktur folder proyek Vite + Vanilla JS, serta dataset awal 8 teknisi dengan generator ilustrasi SVG lokal.
- **Iterasi 2 — Katalog Pelanggan & Integrasi WhatsApp:** Membangun tampilan daftar kartu teknisi, fitur pencarian, filter kategori, pengurutan (*sorting*), serta modal pemesanan WhatsApp otomatis.
- **Iterasi 3 — Dashboard Admin CRUD & Persistensi:** Membangun ringkasan statistik, formulir tambah/edit teknisi, aksi hapus, sinkronisasi `localStorage`, dan fitur *Reset Data Demo*.
- **Iterasi 4 — Pengujian Manual & Penyempurnaan UX:** Memverifikasi seluruh poin *Acceptance Criteria*, responsivitas layar seluler, dan kejelasan pesan umpan balik (*toast notification*).