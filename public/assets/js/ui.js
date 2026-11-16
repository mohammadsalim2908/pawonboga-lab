/* Helper UI bersama: penyimpanan localStorage (mode statis/Vercel), format, ikon, modal, toast. */

const ICONS = {
  wrench: '<path d="M14.5 6.5a3.5 3.5 0 1 0 3 3l-8 8a2.1 2.1 0 1 1-3-3l8-8Z"/><path d="M17 3l4 4"/>',
  smartphone:
    '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18.5h2"/>',
  laptop:
    '<rect x="4" y="4" width="16" height="11" rx="1.8"/><path d="M2 19h20"/>',
  fridge:
    '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M6 10h12"/><path d="M9 5.5v2M9 13v2.5"/>',
  tv:
    '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M9 21h6M12 18v3"/>',
  wind:
    '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  star: '<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  whatsapp:
    '<path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.6 10.4c0 3 2 5 5 5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
  arrow: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users:
    '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16.4 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.2 14.6a6.2 6.2 0 0 1 4 5.4"/>',
  box: '<path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  logout: '<path d="M15 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9"/><path d="M18 12H9"/><path d="m15 8 4 4-4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L18 10l-4-4L4 16v4Z"/><path d="m14 6 4 4"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="m6 7 1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9Z"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  money:
    '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  spark:
    '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  phone:
    '<path d="M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2Z"/>',
  chart: '<path d="M4 20v-6M9 20V8M14 20v-9M19 20V5"/><path d="M2 20h20"/>',
  store:
    '<path d="M3 9l2-5h14l2 5"/><path d="M4 9h16v11H4z"/><path d="M9 20v-6h6v6"/>',
  alert: '<path d="M12 4l9 16H3L12 4Z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  external: '<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  refresh:
    '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  clipboard:
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h6M9 18h3"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  chartPie: '<path d="M12 3a9 9 0 1 0 9 9h-9V3Z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};

export function icon(name, extraClass = '') {
  const path = ICONS[name] || ICONS.wrench;
  return `<svg class="${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export const CATEGORY_ICONS = ['smartphone', 'laptop', 'fridge', 'tv', 'wind'];

export function categoryIcon(name) {
  const key = String(name || '').toLowerCase();
  if (key.includes('hp') || key.includes('gadget')) return 'smartphone';
  if (key.includes('laptop') || key.includes('pc') || key.includes('komputer')) return 'laptop';
  if (key.includes('kulkas') || key.includes('cuci')) return 'fridge';
  if (key.includes('tv') || key.includes('audio')) return 'tv';
  if (key.includes('ac') || key.includes('pendingin')) return 'wind';
  return 'wrench';
}

export const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Jakarta',
  });
}

/* --------------------- Penyimpanan Data Lokal (localStorage) ------------- */
const DB_KEY = 'teknikita_local_db_v1';
const SESSION_KEY = 'teknikita_session_user_id_v1';

function createSeedData() {
  return {
    categories: [
      { id: 1, name: 'HP & Gadget', description: 'Servis ponsel, tablet, dan perangkat wearable', icon: 'smartphone', sort_order: 1, is_private: 0, owner_user_id: null },
      { id: 2, name: 'Laptop & PC', description: 'Perbaikan laptop, komputer, dan printer', icon: 'laptop', sort_order: 2, is_private: 0, owner_user_id: null },
      { id: 3, name: 'Kulkas & Mesin Cuci', description: 'Pendingin rumah tangga dan mesin cuci', icon: 'fridge', sort_order: 3, is_private: 0, owner_user_id: null },
      { id: 4, name: 'TV & Audio', description: 'Televisi, sound system, dan perangkat audio', icon: 'tv', sort_order: 4, is_private: 0, owner_user_id: null },
      { id: 5, name: 'AC & Pendingin', description: 'Servis, cuci, dan pasang AC', icon: 'wind', sort_order: 5, is_private: 0, owner_user_id: null },
    ],
    users: [
      { id: 1, name: 'Admin TekniKita', email: 'admin@teknikita.id', phone: '6281100000001', password: 'Admin#2026', role: 'admin', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 2, name: 'Rizky Pratama', email: 'teknisi1@teknikita.id', phone: '6281200000001', password: 'Teknisi#2026', role: 'technician', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 3, name: 'Bagus Wicaksono', email: 'teknisi2@teknikita.id', phone: '6281200000002', password: 'Teknisi#2026', role: 'technician', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 4, name: 'Siti Aminah', email: 'teknisi3@teknikita.id', phone: '6281200000003', password: 'Teknisi#2026', role: 'technician', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 5, name: 'Hendra Gunawan', email: 'teknisi4@teknikita.id', phone: '6281200000004', password: 'Teknisi#2026', role: 'technician', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 6, name: 'Andi Saputra', email: 'teknisi5@teknikita.id', phone: '6281200000005', password: 'Teknisi#2026', role: 'technician', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 7, name: 'Dewi Lestari', email: 'teknisi6@teknikita.id', phone: '6281200000006', password: 'Teknisi#2026', role: 'technician', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 8, name: 'Fajar Nugroho', email: 'teknisi7@teknikita.id', phone: '6281200000007', password: 'Teknisi#2026', role: 'technician', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 9, name: 'Rina Kartika', email: 'teknisi8@teknikita.id', phone: '6281200000008', password: 'Teknisi#2026', role: 'technician', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 10, name: 'Budi Santoso', email: 'pelanggan1@teknikita.id', phone: '6281300000001', password: 'Pelanggan#2026', role: 'customer', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 11, name: 'Maya Anggraini', email: 'pelanggan2@teknikita.id', phone: '6281300000002', password: 'Pelanggan#2026', role: 'customer', status: 'active', created_at: '2026-11-16T06:01:52Z' },
      { id: 12, name: 'Keluarga Wijaya', email: 'pelanggan3@teknikita.id', phone: '6281300000003', password: 'Pelanggan#2026', role: 'customer', status: 'active', created_at: '2026-11-16T06:01:52Z' },
    ],
    technicians: [
      { id: 1, user_id: 2, category_id: 1, business_name: 'Rizky Cell & Gadget Repair', description: 'Spesialis ganti LCD, baterai kembung, konektor cas, dan perbaikan HP mati total semua merek. Garansi servis 30 hari.', address: 'Jl. Ahmad Yani No. 14, Banyuwangi Kota', area: 'Banyuwangi Kota', maps_url: '', whatsapp_number: '6281200000001', tariff_start: 50000, call_fee: 20000, slots_available: 4, is_featured: 1, is_verified: 1, rating: 4.9 },
      { id: 2, user_id: 3, category_id: 2, business_name: 'Laptop Care Banyuwangi', description: 'Servis motherboard, upgrade SSD/RAM, ganti keyboard, install ulang sistem operasi, dan pembersihan thermal laptop.', address: 'Ruko Kertosari Blok C2, Banyuwangi', area: 'Kertosari', maps_url: '', whatsapp_number: '6281200000002', tariff_start: 75000, call_fee: 25000, slots_available: 3, is_featured: 1, is_verified: 1, rating: 4.8 },
      { id: 3, user_id: 4, category_id: 3, business_name: 'Dingin Sejuk Kulkas & Mesin Cuci', description: 'Menangani kulkas tidak dingin, bocor freon, mesin cuci tidak berputar, dan modul error pada semua merek.', address: 'Jl. Basuki Rahmat No. 88, Banyuwangi', area: 'Banyuwangi Kota', maps_url: '', whatsapp_number: '6281200000003', tariff_start: 90000, call_fee: 30000, slots_available: 2, is_featured: 0, is_verified: 1, rating: 4.7 },
      { id: 4, user_id: 5, category_id: 4, business_name: 'Audio Vision TV Service', description: 'TV LED mati total, layar bergaris, suara hilang, serta servis sound system dan amplifier rumahan.', address: 'Jl. Sutomo No. 21, Genteng', area: 'Genteng', maps_url: '', whatsapp_number: '6281200000004', tariff_start: 80000, call_fee: 25000, slots_available: 5, is_featured: 1, is_verified: 1, rating: 4.8 },
      { id: 5, user_id: 6, category_id: 5, business_name: 'AC Pro Banyuwangi', description: 'Cuci AC, isi freon, bongkar pasang, dan perbaikan AC tidak dingin untuk semua merek. Melayani panggilan ke rumah.', address: 'Jl. Letkol Istiqlah No. 45, Banyuwangi', area: 'Banyuwangi Kota', maps_url: '', whatsapp_number: '6281200000005', tariff_start: 100000, call_fee: 35000, slots_available: 3, is_featured: 1, is_verified: 1, rating: 4.9 },
      { id: 6, user_id: 7, category_id: 1, business_name: 'Gadget Medika', description: 'Perbaikan software, flash ulang, ganti touchscreen, dan recovery data ponsel. Slot hari ini sedang penuh.', address: 'Jl. Gajah Mada No. 7, Rogojampi', area: 'Rogojampi', maps_url: '', whatsapp_number: '6281200000006', tariff_start: 60000, call_fee: 15000, slots_available: 0, is_featured: 0, is_verified: 1, rating: 4.6 },
      { id: 7, user_id: 8, category_id: 2, business_name: 'Komputer Mandiri', description: 'Rakit PC, servis printer, instalasi jaringan kantor, dan perawatan komputer untuk rumah maupun usaha.', address: 'Jl. Diponegoro No. 102, Banyuwangi', area: 'Banyuwangi Kota', maps_url: '', whatsapp_number: '6281200000007', tariff_start: 65000, call_fee: 20000, slots_available: 6, is_featured: 0, is_verified: 1, rating: 4.5 },
      { id: 8, user_id: 9, category_id: 3, business_name: 'Prima Elektronik', description: 'Servis kulkas dua pintu, freezer tidak beku, mesin cuci bocor, serta perawatan elektronik rumah tangga lainnya.', address: 'Jl. Raya Muncar No. 33, Muncar', area: 'Muncar', maps_url: '', whatsapp_number: '6281200000008', tariff_start: 70000, call_fee: 20000, slots_available: 1, is_featured: 0, is_verified: 1, rating: 4.4 },
    ],
    services: [
      { id: 1, technician_id: 1, name: 'Ganti LCD / Touchscreen', description: 'LCD original quality dengan garansi pemasangan.', price_type: 'fixed', includes_parts: 1, price: 350000, estimated_minutes: 90, is_active: 1 },
      { id: 2, technician_id: 1, name: 'Ganti Baterai HP', description: 'Baterai baru bergaransi 3 bulan.', price_type: 'fixed', includes_parts: 1, price: 150000, estimated_minutes: 45, is_active: 1 },
      { id: 3, technician_id: 1, name: 'Perbaikan HP Mati Total', description: 'Analisa jalur power dan IC charging.', price_type: 'starting', includes_parts: 0, price: 200000, estimated_minutes: 180, is_active: 1 },
      { id: 4, technician_id: 1, name: 'Ganti Konektor Cas', description: 'Penyolderan ulang konektor charging.', price_type: 'fixed', includes_parts: 1, price: 90000, estimated_minutes: 60, is_active: 1 },
      { id: 5, technician_id: 2, name: 'Install Ulang + Driver', description: 'Windows/Linux, termasuk backup data ringan.', price_type: 'fixed', includes_parts: 0, price: 125000, estimated_minutes: 120, is_active: 1 },
      { id: 6, technician_id: 2, name: 'Pembersihan Thermal & Ganti Pasta', description: 'Laptop kembali senyap dan tidak panas.', price_type: 'fixed', includes_parts: 1, price: 150000, estimated_minutes: 90, is_active: 1 },
      { id: 7, technician_id: 2, name: 'Upgrade SSD / RAM', description: 'Biaya jasa, belum termasuk part.', price_type: 'fixed', includes_parts: 0, price: 100000, estimated_minutes: 60, is_active: 1 },
      { id: 8, technician_id: 2, name: 'Perbaikan Motherboard', description: 'Analisa jalur power dan reballing chipset.', price_type: 'starting', includes_parts: 0, price: 450000, estimated_minutes: 240, is_active: 1 },
      { id: 9, technician_id: 3, name: 'Servis Kulkas Tidak Dingin', description: 'Cek kompresor, freon, dan thermostat.', price_type: 'starting', includes_parts: 0, price: 180000, estimated_minutes: 150, is_active: 1 },
      { id: 10, technician_id: 3, name: 'Isi Freon Kulkas', description: 'Freon R134a/R600a termasuk vakum.', price_type: 'fixed', includes_parts: 1, price: 250000, estimated_minutes: 120, is_active: 1 },
      { id: 11, technician_id: 3, name: 'Servis Mesin Cuci Tidak Berputar', description: 'Cek dinamo, v-belt, dan kapasitor.', price_type: 'starting', includes_parts: 0, price: 160000, estimated_minutes: 120, is_active: 1 },
      { id: 12, technician_id: 3, name: 'Ganti Modul Mesin Cuci', description: 'Modul universal bergaransi 1 bulan.', price_type: 'fixed', includes_parts: 1, price: 300000, estimated_minutes: 90, is_active: 1 },
      { id: 13, technician_id: 4, name: 'Servis TV LED Mati Total', description: 'Cek power supply dan backlight.', price_type: 'starting', includes_parts: 0, price: 250000, estimated_minutes: 180, is_active: 1 },
      { id: 14, technician_id: 4, name: 'Ganti LED Backlight TV', description: 'Penggantian strip LED bergaransi.', price_type: 'fixed', includes_parts: 1, price: 300000, estimated_minutes: 240, is_active: 1 },
      { id: 15, technician_id: 4, name: 'Perbaikan Suara Hilang', description: 'Cek IC audio dan speaker internal.', price_type: 'fixed', includes_parts: 0, price: 175000, estimated_minutes: 120, is_active: 1 },
      { id: 16, technician_id: 4, name: 'Servis Sound System', description: 'Pembersihan potensiometer dan jalur audio.', price_type: 'starting', includes_parts: 0, price: 150000, estimated_minutes: 120, is_active: 1 },
      { id: 17, technician_id: 5, name: 'Cuci AC Split 1 Unit', description: 'Cuci indoor dan outdoor tanpa bongkar.', price_type: 'fixed', includes_parts: 0, price: 75000, estimated_minutes: 60, is_active: 1 },
      { id: 18, technician_id: 5, name: 'Isi Freon AC', description: 'Freon R32/R410a per unit.', price_type: 'fixed', includes_parts: 1, price: 275000, estimated_minutes: 90, is_active: 1 },
      { id: 19, technician_id: 5, name: 'Bongkar Pasang AC', description: 'Termasuk instalasi pipa standar 3 meter.', price_type: 'fixed', includes_parts: 1, price: 400000, estimated_minutes: 240, is_active: 1 },
      { id: 20, technician_id: 5, name: 'Perbaikan AC Tidak Dingin', description: 'Analisa kebocoran dan kapasitor.', price_type: 'starting', includes_parts: 0, price: 150000, estimated_minutes: 120, is_active: 1 },
      { id: 21, technician_id: 6, name: 'Flash / Install Ulang Android', description: 'Termasuk pembersihan bloatware.', price_type: 'fixed', includes_parts: 0, price: 120000, estimated_minutes: 90, is_active: 1 },
      { id: 22, technician_id: 6, name: 'Ganti Touchscreen', description: 'Biaya jasa dan part kualitas OEM.', price_type: 'fixed', includes_parts: 1, price: 400000, estimated_minutes: 120, is_active: 1 },
      { id: 23, technician_id: 6, name: 'Recovery Data HP', description: 'Pemulihan foto dan kontak dari HP mati.', price_type: 'quote', includes_parts: 0, price: 250000, estimated_minutes: 180, is_active: 1 },
      { id: 24, technician_id: 7, name: 'Rakit PC + Instalasi', description: 'Jasa rakit dan setup BIOS/driver.', price_type: 'fixed', includes_parts: 0, price: 300000, estimated_minutes: 240, is_active: 1 },
      { id: 25, technician_id: 7, name: 'Servis Printer Macet', description: 'Bersihkan roller dan cek cartridge.', price_type: 'fixed', includes_parts: 0, price: 120000, estimated_minutes: 90, is_active: 1 },
      { id: 26, technician_id: 7, name: 'Instalasi Jaringan Kantor', description: 'Hingga 8 titik kabel dan konfigurasi router.', price_type: 'starting', includes_parts: 0, price: 500000, estimated_minutes: 300, is_active: 1 },
      { id: 27, technician_id: 8, name: 'Servis Kulkas Dua Pintu', description: 'Analisa kebocoran dan termostat.', price_type: 'starting', includes_parts: 0, price: 200000, estimated_minutes: 180, is_active: 1 },
      { id: 28, technician_id: 8, name: 'Servis Mesin Cuci Bocor', description: 'Ganti seal dan selang drainase.', price_type: 'fixed', includes_parts: 1, price: 140000, estimated_minutes: 90, is_active: 1 },
      { id: 29, technician_id: 8, name: 'Servis Freezer Tidak Beku', description: 'Cek freon dan defrost system.', price_type: 'starting', includes_parts: 0, price: 190000, estimated_minutes: 150, is_active: 1 },
    ],
    orders: [
      { id: 1, code: 'TK-DEMO01', customer_id: 10, technician_id: 1, service_id: 1, customer_name: 'Budi Santoso', customer_phone: '6281300000001', technician_name: 'Rizky Cell & Gadget Repair', technician_phone: '6281200000001', service_name: 'Ganti LCD / Touchscreen', price_type: 'fixed', service_mode: 'home', complaint: 'Layar HP pecah setelah terjatuh.', customer_address: 'Jl. Ikan Tongkol No. 8, Banyuwangi', estimated_total: 370000, status: 'completed', scheduled_date: '2026-11-11', created_at: '2026-11-10T23:01:52Z' },
      { id: 2, code: 'TK-DEMO02', customer_id: 11, technician_id: 5, service_id: 17, customer_name: 'Maya Anggraini', customer_phone: '6281300000002', technician_name: 'AC Pro Banyuwangi', technician_phone: '6281200000005', service_name: 'Cuci AC Split 1 Unit', price_type: 'fixed', service_mode: 'home', complaint: 'AC kamar tidak dingin dan berisik.', customer_address: 'Perumahan Griya Asri Blok B4, Banyuwangi', estimated_total: 110000, status: 'confirmed', scheduled_date: '2026-11-17', created_at: '2026-11-14T23:01:52Z' },
      { id: 3, code: 'TK-DEMO03', customer_id: 12, technician_id: 2, service_id: 6, customer_name: 'Keluarga Wijaya', customer_phone: '6281300000003', technician_name: 'Laptop Care Banyuwangi', technician_phone: '6281200000002', service_name: 'Pembersihan Thermal & Ganti Pasta', price_type: 'fixed', service_mode: 'workshop', complaint: 'Laptop panas dan kipas berisik.', customer_address: '', estimated_total: 150000, status: 'in_progress', scheduled_date: null, created_at: '2026-11-15T23:01:52Z' },
      { id: 4, code: 'TK-DEMO04', customer_id: 10, technician_id: 4, service_id: 15, customer_name: 'Budi Santoso', customer_phone: '6281300000001', technician_name: 'Audio Vision TV Service', technician_phone: '6281200000004', service_name: 'Perbaikan Suara Hilang', price_type: 'fixed', service_mode: 'workshop', complaint: 'TV LED suara hilang, gambar normal.', customer_address: '', estimated_total: 175000, status: 'pending', scheduled_date: null, created_at: '2026-11-15T23:01:52Z' },
      { id: 5, code: 'TK-DEMO05', customer_id: 11, technician_id: 3, service_id: 9, customer_name: 'Maya Anggraini', customer_phone: '6281300000002', technician_name: 'Dingin Sejuk Kulkas & Mesin Cuci', technician_phone: '6281200000003', service_name: 'Servis Kulkas Tidak Dingin', price_type: 'starting', service_mode: 'home', complaint: 'Kulkas kurang dingin sejak seminggu.', customer_address: 'Jl. Kartini No. 45, Banyuwangi', estimated_total: 210000, status: 'cancelled', scheduled_date: null, created_at: '2026-11-12T23:01:52Z' },
      { id: 6, code: 'TK-DEMO06', customer_id: 12, technician_id: 7, service_id: 25, customer_name: 'Keluarga Wijaya', customer_phone: '6281300000003', technician_name: 'Komputer Mandiri', technician_phone: '6281200000007', service_name: 'Servis Printer Macet', price_type: 'fixed', service_mode: 'home', complaint: 'Printer kantor macet terus.', customer_address: 'Toko Sumber Rejeki, Jl. Diponegoro 12', estimated_total: 140000, status: 'pending', scheduled_date: '2026-11-17', created_at: '2026-11-15T23:01:52Z' },
    ],
  };
}

function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const seed = createSeedData();
      localStorage.setItem(DB_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return createSeedData();
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function nextId(list) {
  return list.length ? Math.max(...list.map((item) => Number(item.id) || 0)) + 1 : 1;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getSessionAuth(db) {
  const uid = Number(localStorage.getItem(SESSION_KEY) || 0);
  if (!uid) return null;
  const user = db.users.find((u) => u.id === uid && u.status === 'active');
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  const { password, ...safeUser } = user;
  const tech = user.role === 'technician' ? db.technicians.find((t) => t.user_id === user.id) : null;
  const technician = tech
    ? { ...tech, isVerified: Boolean(tech.is_verified), isFeatured: Boolean(tech.is_featured) }
    : null;
  return { user: safeUser, technician };
}

function requireAuth(db, role = null) {
  const auth = getSessionAuth(db);
  if (!auth) throw httpError(401, 'Sesi berakhir. Silakan masuk kembali.');
  if (role && auth.user.role !== role) throw httpError(403, 'Akses tidak diizinkan.');
  return auth;
}

function enrichTechnician(db, tech) {
  const cat = db.categories.find((c) => c.id === tech.category_id);
  const owner = db.users.find((u) => u.id === tech.user_id);
  const serviceCount = db.services.filter((s) => s.technician_id === tech.id && s.is_active).length;
  return {
    ...tech,
    category_name: cat ? cat.name : 'Umum',
    owner_name: owner ? owner.name : 'Mitra Teknisi',
    email: owner ? owner.email : '',
    service_count: serviceCount,
  };
}

export async function api(path, { method = 'GET', body } = {}) {
  const db = getDB();
  const [pathname, queryString = ''] = path.split('?');
  const params = new URLSearchParams(queryString);
  const m = method.toUpperCase();

  /* ----------------------------- Auth ------------------------------------ */
  if (pathname === '/auth/me' && m === 'GET') {
    const auth = getSessionAuth(db);
    if (!auth) throw httpError(401, 'Belum masuk.');
    return auth;
  }

  if (pathname === '/auth/login' && m === 'POST') {
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const user = db.users.find((u) => u.email.toLowerCase() === email && u.password === password);
    if (!user) throw httpError(401, 'Email atau kata sandi salah.');
    if (user.status !== 'active') throw httpError(403, 'Akun Anda dinonaktifkan oleh admin.');
    localStorage.setItem(SESSION_KEY, String(user.id));
    return getSessionAuth(db);
  }

  if (pathname === '/auth/register' && m === 'POST') {
    const email = String(body?.email || '').trim().toLowerCase();
    const name = String(body?.name || '').trim();
    const phone = String(body?.phone || '').trim();
    const password = String(body?.password || '');
    const role = body?.role === 'technician' ? 'technician' : 'customer';

    if (!name || !email || !phone || password.length < 8) {
      throw httpError(400, 'Lengkapi nama, email, nomor HP, dan kata sandi minimal 8 karakter.');
    }
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw httpError(409, 'Email sudah terdaftar.');
    }

    const newUser = {
      id: nextId(db.users),
      name,
      email,
      phone,
      password,
      role,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);

    if (role === 'technician') {
      db.technicians.push({
        id: nextId(db.technicians),
        user_id: newUser.id,
        category_id: Number(body.categoryId || 1),
        business_name: String(body.businessName || '').trim(),
        description: String(body.description || 'Melayani servis elektronik profesional.').trim(),
        address: String(body.address || '').trim(),
        area: String(body.area || '').trim(),
        maps_url: '',
        whatsapp_number: String(body.whatsappNumber || phone).replace(/\D/g, ''),
        tariff_start: Number(body.tariffStart || 50000),
        call_fee: Number(body.callFee || 20000),
        slots_available: 3,
        is_featured: 0,
        is_verified: 0,
        rating: 5.0,
      });
    }

    saveDB(db);
    localStorage.setItem(SESSION_KEY, String(newUser.id));
    return getSessionAuth(db);
  }

  if (pathname === '/auth/logout' && m === 'POST') {
    localStorage.removeItem(SESSION_KEY);
    return { ok: true };
  }

  /* ---------------------------- Catalog ---------------------------------- */
  if (pathname === '/catalog/summary' && m === 'GET') {
    const verified = db.technicians.filter((t) => t.is_verified);
    return {
      totalTechnicians: verified.length,
      totalSlots: verified.reduce((sum, t) => sum + Number(t.slots_available || 0), 0),
      totalCategories: db.categories.filter((c) => !c.is_private).length,
    };
  }

  if (pathname === '/catalog/categories' && m === 'GET') {
    const categories = db.categories
      .filter((c) => !c.is_private)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((c) => ({
        ...c,
        technician_count: db.technicians.filter((t) => t.is_verified && t.category_id === c.id).length,
      }));
    return { categories };
  }

  if (pathname === '/catalog' && m === 'GET') {
    const q = (params.get('q') || '').trim().toLowerCase();
    const category = params.get('category') || 'all';
    const sort = params.get('sort') || 'recommended';

    let list = db.technicians
      .filter((t) => t.is_verified)
      .map((t) => enrichTechnician(db, t));

    if (category !== 'all') {
      list = list.filter((t) => String(t.category_id) === String(category));
    }

    if (q) {
      list = list.filter((t) => {
        const techServices = db.services
          .filter((s) => s.technician_id === t.id && s.is_active)
          .map((s) => `${s.name} ${s.description}`)
          .join(' ');
        const haystack = `${t.business_name} ${t.description} ${t.area} ${t.address} ${t.category_name} ${t.owner_name} ${techServices}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    if (sort === 'tariff_asc' || sort === 'price_asc') {
      list.sort((a, b) => a.tariff_start - b.tariff_start);
    } else if (sort === 'tariff_desc' || sort === 'price_desc') {
      list.sort((a, b) => b.tariff_start - a.tariff_start);
    } else if (sort === 'slots_desc' || sort === 'slots') {
      list.sort((a, b) => b.slots_available - a.slots_available);
    } else {
      list.sort((a, b) => (b.is_featured - a.is_featured) || (b.rating - a.rating) || (b.slots_available - a.slots_available));
    }

    return { technicians: list };
  }

  const catalogDetailMatch = pathname.match(/^\/catalog\/(\d+)$/);
  if (catalogDetailMatch && m === 'GET') {
    const techId = Number(catalogDetailMatch[1]);
    const tech = db.technicians.find((t) => t.id === techId);
    if (!tech) throw httpError(404, 'Teknisi tidak ditemukan.');
    const services = db.services.filter((s) => s.technician_id === techId && s.is_active);
    return { technician: enrichTechnician(db, tech), services };
  }

  /* ----------------------------- Orders ---------------------------------- */
  if (pathname === '/orders' && m === 'POST') {
    const { user } = requireAuth(db, 'customer');
    const tech = db.technicians.find((t) => t.id === Number(body?.technicianId));
    if (!tech) throw httpError(404, 'Teknisi tidak ditemukan.');
    if (tech.slots_available <= 0) throw httpError(400, 'Slot teknisi hari ini sudah penuh.');

    const mode = body?.mode === 'workshop' ? 'workshop' : 'home';
    const address = String(body?.address || '').trim();
    if (mode === 'home' && !address) {
      throw httpError(400, 'Alamat wajib diisi untuk layanan panggil ke rumah.');
    }

    const service = body?.serviceId
      ? db.services.find((s) => s.id === Number(body.serviceId) && s.technician_id === tech.id)
      : null;

    const priceType = service ? service.price_type : 'starting';
    const base = service ? Number(service.price) : Number(tech.tariff_start);
    const fee = mode === 'home' ? Number(tech.call_fee) : 0;
    const estimatedTotal = priceType === 'quote' ? 0 : base + fee;

    tech.slots_available = Math.max(0, Number(tech.slots_available) - 1);

    const code = `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const order = {
      id: nextId(db.orders),
      code,
      customer_id: user.id,
      technician_id: tech.id,
      service_id: service ? service.id : null,
      customer_name: user.name,
      customer_phone: user.phone,
      technician_name: tech.business_name,
      technician_phone: tech.whatsapp_number,
      service_name: service ? service.name : 'Servis umum',
      price_type: priceType,
      service_mode: mode,
      complaint: String(body?.complaint || '').trim(),
      customer_address: address,
      estimated_total: estimatedTotal,
      status: 'pending',
      scheduled_date: body?.scheduledDate || null,
      created_at: new Date().toISOString(),
    };

    db.orders.unshift(order);
    saveDB(db);

    const message = decodeURIComponent(buildWhatsAppLink(order).split('?text=')[1] || '');
    return {
      order,
      whatsapp: {
        message,
        url: buildWhatsAppLink(order),
      },
    };
  }

  if (pathname === '/orders/mine' && m === 'GET') {
    const { user } = requireAuth(db, 'customer');
    const orders = db.orders
      .filter((o) => o.customer_id === user.id)
      .map((o) => {
        const tech = db.technicians.find((t) => t.id === o.technician_id);
        const cat = tech ? db.categories.find((c) => c.id === tech.category_id) : null;
        return { ...o, category_name: cat ? cat.name : 'Teknisi' };
      });
    return { orders };
  }

  const cancelOrderMatch = pathname.match(/^\/orders\/(\d+)\/cancel$/);
  if (cancelOrderMatch && m === 'PATCH') {
    const { user } = requireAuth(db, 'customer');
    const order = db.orders.find((o) => o.id === Number(cancelOrderMatch[1]) && o.customer_id === user.id);
    if (!order) throw httpError(404, 'Pesanan tidak ditemukan.');
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw httpError(400, 'Pesanan tidak dapat dibatalkan.');
    }
    order.status = 'cancelled';
    const tech = db.technicians.find((t) => t.id === order.technician_id);
    if (tech) tech.slots_available = Number(tech.slots_available || 0) + 1;
    saveDB(db);
    return { ok: true };
  }

  /* ---------------------------- Profile ---------------------------------- */
  if (pathname === '/profile' && m === 'PUT') {
    const { user } = requireAuth(db);
    const target = db.users.find((u) => u.id === user.id);
    const name = String(body?.name || '').trim();
    const phone = String(body?.phone || '').trim();
    if (!name || !phone) throw httpError(400, 'Nama dan nomor telepon wajib diisi.');
    target.name = name;
    target.phone = phone;
    saveDB(db);
    const { password, ...safeUser } = target;
    return { user: safeUser };
  }

  if (pathname === '/profile/password' && m === 'PUT') {
    const { user } = requireAuth(db);
    const target = db.users.find((u) => u.id === user.id);
    if (target.password !== body?.currentPassword) {
      throw httpError(400, 'Kata sandi saat ini tidak sesuai.');
    }
    if (String(body?.newPassword || '').length < 8) {
      throw httpError(400, 'Kata sandi baru minimal 8 karakter.');
    }
    target.password = body.newPassword;
    saveDB(db);
    return { ok: true };
  }

  /* ------------------------- Technician Panel ---------------------------- */
  if (pathname === '/technician/overview' && m === 'GET') {
    const { technician } = requireAuth(db, 'technician');
    if (!technician) throw httpError(404, 'Profil teknisi belum dibuat.');
    const myOrders = db.orders.filter((o) => o.technician_id === technician.id);
    const myServices = db.services.filter((s) => s.technician_id === technician.id);
    return {
      isVerified: Boolean(technician.is_verified),
      isFeatured: Boolean(technician.is_featured),
      slotsAvailable: technician.slots_available,
      stats: {
        totalOrders: myOrders.length,
        pending: myOrders.filter((o) => o.status === 'pending').length,
        confirmed: myOrders.filter((o) => o.status === 'confirmed').length,
        inProgress: myOrders.filter((o) => o.status === 'in_progress').length,
        completed: myOrders.filter((o) => o.status === 'completed').length,
        cancelled: myOrders.filter((o) => o.status === 'cancelled').length,
        revenue: myOrders.filter((o) => o.status === 'completed').reduce((s, o) => s + Number(o.estimated_total || 0), 0),
      },
      services: {
        active: myServices.filter((s) => s.is_active).length,
        total: myServices.length,
      },
    };
  }

  if (pathname === '/technician/profile' && m === 'GET') {
    const { technician } = requireAuth(db, 'technician');
    return { profile: technician ? enrichTechnician(db, technician) : null };
  }

  if (pathname === '/technician/profile' && m === 'PUT') {
    const { technician } = requireAuth(db, 'technician');
    const target = db.technicians.find((t) => t.id === technician.id);
    Object.assign(target, {
      business_name: String(body.businessName || '').trim(),
      category_id: Number(body.categoryId || target.category_id),
      description: String(body.description || '').trim(),
      address: String(body.address || '').trim(),
      maps_url: String(body.mapsUrl || '').trim(),
      area: String(body.area || '').trim(),
      whatsapp_number: String(body.whatsappNumber || '').replace(/\D/g, ''),
      tariff_start: Number(body.tariffStart || 0),
      call_fee: Number(body.callFee || 0),
      slots_available: Number(body.slotsAvailable || 0),
    });
    saveDB(db);
    return { profile: enrichTechnician(db, target) };
  }

  if (pathname === '/technician/availability' && m === 'PATCH') {
    const { technician } = requireAuth(db, 'technician');
    const target = db.technicians.find((t) => t.id === technician.id);
    target.slots_available = Math.max(0, Number(body?.slotsAvailable || 0));
    saveDB(db);
    return { ok: true };
  }

  if (pathname === '/technician/categories' && m === 'GET') {
    const { user } = requireAuth(db, 'technician');
    const categories = db.categories
      .filter((c) => !c.is_private || c.owner_user_id === user.id)
      .map((c) => ({ ...c, is_own: c.owner_user_id === user.id }));
    return { categories };
  }

  if (pathname === '/technician/categories' && m === 'POST') {
    const { user } = requireAuth(db, 'technician');
    const name = String(body?.name || '').trim();
    if (!name) throw httpError(400, 'Nama kategori wajib diisi.');
    const category = {
      id: nextId(db.categories),
      name,
      description: '',
      icon: body?.icon || 'wrench',
      sort_order: 99,
      is_private: 1,
      owner_user_id: user.id,
    };
    db.categories.push(category);
    saveDB(db);
    return { category };
  }

  if (pathname === '/technician/services' && m === 'GET') {
    const { technician } = requireAuth(db, 'technician');
    return { services: db.services.filter((s) => s.technician_id === technician.id) };
  }

  if (pathname === '/technician/services' && m === 'POST') {
    const { technician } = requireAuth(db, 'technician');
    const name = String(body?.name || '').trim();
    if (!name) throw httpError(400, 'Nama layanan wajib diisi.');
    const service = {
      id: nextId(db.services),
      technician_id: technician.id,
      name,
      description: String(body?.description || '').trim(),
      price_type: body?.priceType || 'fixed',
      includes_parts: body?.includesParts ? 1 : 0,
      price: Number(body?.price || 0),
      estimated_minutes: Number(body?.estimatedMinutes || 60),
      is_active: body?.isActive ? 1 : 0,
    };
    db.services.push(service);
    saveDB(db);
    return { service };
  }

  const techServiceMatch = pathname.match(/^\/technician\/services\/(\d+)$/);
  if (techServiceMatch && m === 'PUT') {
    const { technician } = requireAuth(db, 'technician');
    const service = db.services.find((s) => s.id === Number(techServiceMatch[1]) && s.technician_id === technician.id);
    if (!service) throw httpError(404, 'Layanan tidak ditemukan.');
    Object.assign(service, {
      name: String(body?.name || service.name).trim(),
      description: String(body?.description ?? service.description).trim(),
      price_type: body?.priceType || service.price_type,
      includes_parts: body?.includesParts ? 1 : 0,
      price: Number(body?.price ?? service.price),
      estimated_minutes: Number(body?.estimatedMinutes ?? service.estimated_minutes),
      is_active: body?.isActive ? 1 : 0,
    });
    saveDB(db);
    return { service };
  }

  if (techServiceMatch && m === 'DELETE') {
    const { technician } = requireAuth(db, 'technician');
    db.services = db.services.filter((s) => !(s.id === Number(techServiceMatch[1]) && s.technician_id === technician.id));
    saveDB(db);
    return { ok: true };
  }

  if (pathname === '/technician/orders' && m === 'GET') {
    const { technician } = requireAuth(db, 'technician');
    const status = params.get('status') || '';
    let orders = db.orders.filter((o) => o.technician_id === technician.id);
    if (status) orders = orders.filter((o) => o.status === status);
    return { orders };
  }

  const techOrderMatch = pathname.match(/^\/technician\/orders\/(\d+)$/);
  if (techOrderMatch && m === 'PATCH') {
    const { technician } = requireAuth(db, 'technician');
    const order = db.orders.find((o) => o.id === Number(techOrderMatch[1]) && o.technician_id === technician.id);
    if (!order) throw httpError(404, 'Pesanan tidak ditemukan.');
    const prev = order.status;
    order.status = body.status;
    if (body.status === 'cancelled' && prev !== 'cancelled') {
      const targetTech = db.technicians.find((t) => t.id === technician.id);
      if (targetTech) targetTech.slots_available = Number(targetTech.slots_available || 0) + 1;
    }
    saveDB(db);
    return { ok: true };
  }

  /* ---------------------------- Admin Panel ------------------------------ */
  if (pathname === '/admin/stats' && m === 'GET') {
    requireAuth(db, 'admin');
    const verified = db.technicians.filter((t) => t.is_verified);
    return {
      users: {
        total: db.users.length,
        customers: db.users.filter((u) => u.role === 'customer').length,
        technicians: db.users.filter((u) => u.role === 'technician').length,
        admins: db.users.filter((u) => u.role === 'admin').length,
        suspended: db.users.filter((u) => u.status === 'suspended').length,
      },
      directory: {
        verifiedTechnicians: verified.length,
        pendingTechnicians: db.technicians.filter((t) => !t.is_verified).length,
        totalSlots: verified.reduce((s, t) => s + Number(t.slots_available || 0), 0),
        orders: db.orders.length,
        pendingOrders: db.orders.filter((o) => o.status === 'pending').length,
        revenue: db.orders.filter((o) => o.status === 'completed').reduce((s, o) => s + Number(o.estimated_total || 0), 0),
        categories: db.categories.filter((c) => !c.is_private).length,
      },
      recentOrders: db.orders.slice(0, 6),
    };
  }

  if (pathname === '/admin/users' && m === 'GET') {
    requireAuth(db, 'admin');
    const q = (params.get('q') || '').toLowerCase();
    const role = params.get('role') || '';
    const status = params.get('status') || '';

    const users = db.users
      .map((u) => {
        const { password, ...safe } = u;
        const tech = db.technicians.find((t) => t.user_id === u.id);
        const cat = tech ? db.categories.find((c) => c.id === tech.category_id) : null;
        return {
          ...safe,
          business_name: tech?.business_name || '',
          category_id: tech?.category_id || null,
          category_name: cat?.name || '',
          is_verified: tech?.is_verified || 0,
          tariff_start: tech?.tariff_start ?? 50000,
        };
      })
      .filter((u) => {
        if (role && u.role !== role) return false;
        if (status && u.status !== status) return false;
        if (q && !`${u.name} ${u.email} ${u.business_name}`.toLowerCase().includes(q)) return false;
        return true;
      });
    return { users };
  }

  if (pathname === '/admin/users' && m === 'POST') {
    requireAuth(db, 'admin');
    const email = String(body?.email || '').trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw httpError(409, 'Email sudah terdaftar.');
    }
    const newUser = {
      id: nextId(db.users),
      name: String(body?.name || '').trim(),
      email,
      phone: String(body?.phone || '').trim(),
      password: String(body?.password || 'TekniKita#2026'),
      role: body?.role || 'customer',
      status: body?.status || 'active',
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    if (newUser.role === 'technician') {
      db.technicians.push({
        id: nextId(db.technicians),
        user_id: newUser.id,
        category_id: Number(body.categoryId || 1),
        business_name: String(body.businessName || newUser.name).trim(),
        description: String(body.description || 'Layanan servis elektronik.').trim(),
        address: String(body.address || 'Banyuwangi').trim(),
        area: String(body.area || 'Banyuwangi Kota').trim(),
        maps_url: '',
        whatsapp_number: String(body.whatsappNumber || newUser.phone).replace(/\D/g, ''),
        tariff_start: Number(body.tariffStart || 50000),
        call_fee: Number(body.callFee || 20000),
        slots_available: 3,
        is_featured: 0,
        is_verified: 1,
        rating: 5.0,
      });
    }
    saveDB(db);
    return { ok: true };
  }

  const adminUserMatch = pathname.match(/^\/admin\/users\/(\d+)$/);
  if (adminUserMatch && m === 'PATCH') {
    requireAuth(db, 'admin');
    const target = db.users.find((u) => u.id === Number(adminUserMatch[1]));
    if (!target) throw httpError(404, 'Pengguna tidak ditemukan.');
    if (body.name !== undefined) target.name = body.name;
    if (body.email !== undefined) target.email = body.email;
    if (body.phone !== undefined) target.phone = body.phone;
    if (body.role !== undefined) target.role = body.role;
    if (body.status !== undefined) target.status = body.status;
    if (body.password) target.password = body.password;
    saveDB(db);
    return { ok: true };
  }

  if (adminUserMatch && m === 'DELETE') {
    const { user } = requireAuth(db, 'admin');
    const targetId = Number(adminUserMatch[1]);
    if (targetId === user.id) throw httpError(400, 'Tidak dapat menghapus akun sendiri.');
    db.users = db.users.filter((u) => u.id !== targetId);
    db.technicians = db.technicians.filter((t) => t.user_id !== targetId);
    saveDB(db);
    return { ok: true };
  }

  if (pathname === '/admin/technicians' && m === 'GET') {
    requireAuth(db, 'admin');
    const q = (params.get('q') || '').toLowerCase();
    const technicians = db.technicians
      .map((t) => enrichTechnician(db, t))
      .filter((t) => !q || `${t.business_name} ${t.area} ${t.email} ${t.owner_name}`.toLowerCase().includes(q));
    return { technicians };
  }

  const adminTechMatch = pathname.match(/^\/admin\/technicians\/(\d+)$/);
  if (adminTechMatch && m === 'PATCH') {
    requireAuth(db, 'admin');
    const tech = db.technicians.find((t) => t.id === Number(adminTechMatch[1]));
    if (!tech) throw httpError(404, 'Teknisi tidak ditemukan.');
    if (body.isVerified !== undefined) tech.is_verified = body.isVerified ? 1 : 0;
    if (body.isFeatured !== undefined) tech.is_featured = body.isFeatured ? 1 : 0;
    if (body.slotsAvailable !== undefined) tech.slots_available = Math.max(0, Number(body.slotsAvailable));
    saveDB(db);
    return { ok: true };
  }

  if (pathname === '/admin/categories' && m === 'GET') {
    requireAuth(db, 'admin');
    const categories = db.categories.map((c) => {
      const owner = c.owner_user_id ? db.users.find((u) => u.id === c.owner_user_id) : null;
      return {
        ...c,
        technician_count: db.technicians.filter((t) => t.category_id === c.id).length,
        owner_name: owner?.name || '',
      };
    });
    return { categories };
  }

  if (pathname === '/admin/categories' && m === 'POST') {
    requireAuth(db, 'admin');
    const name = String(body?.name || '').trim();
    if (!name) throw httpError(400, 'Nama kategori wajib diisi.');
    db.categories.push({
      id: nextId(db.categories),
      name,
      description: String(body?.description || '').trim(),
      icon: body?.icon || 'wrench',
      sort_order: Number(body?.sortOrder || 0),
      is_private: 0,
      owner_user_id: null,
    });
    saveDB(db);
    return { ok: true };
  }

  const adminCatMatch = pathname.match(/^\/admin\/categories\/(\d+)$/);
  if (adminCatMatch && m === 'PATCH') {
    requireAuth(db, 'admin');
    const cat = db.categories.find((c) => c.id === Number(adminCatMatch[1]));
    if (!cat) throw httpError(404, 'Kategori tidak ditemukan.');
    Object.assign(cat, {
      name: String(body?.name || cat.name).trim(),
      description: String(body?.description ?? cat.description).trim(),
      icon: body?.icon || cat.icon,
      sort_order: Number(body?.sortOrder ?? cat.sort_order),
    });
    saveDB(db);
    return { ok: true };
  }

  if (adminCatMatch && m === 'DELETE') {
    requireAuth(db, 'admin');
    const catId = Number(adminCatMatch[1]);
    if (db.technicians.some((t) => t.category_id === catId)) {
      throw httpError(400, 'Kategori masih dipakai oleh teknisi.');
    }
    db.categories = db.categories.filter((c) => c.id !== catId);
    saveDB(db);
    return { ok: true };
  }

  if (pathname === '/admin/orders' && m === 'GET') {
    requireAuth(db, 'admin');
    const status = params.get('status') || '';
    let orders = [...db.orders];
    if (status) orders = orders.filter((o) => o.status === status);
    return { orders };
  }

  throw httpError(404, `Endpoint ${pathname} tidak ditemukan.`);
}

export function toast(message, type = 'success') {
  let root = document.getElementById('toastRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toastRoot';
    root.className = 'toast-root';
    document.body.append(root);
  }
  const item = document.createElement('div');
  item.className = `toast ${type}`;
  const iconName = type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check';
  item.innerHTML = `${icon(iconName)}<span>${escapeHtml(message)}</span>`;
  root.append(item);
  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(6px)';
    item.style.transition = 'all .2s ease';
    setTimeout(() => item.remove(), 220);
  }, 4200);
}

export function openModal({ title, subtitle = '', body = '', footer = '', size = '' }) {
  let root = document.getElementById('modalRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modalRoot';
    document.body.append(root);
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <button type="button" class="icon-btn" data-modal-close aria-label="Tutup">${icon('x')}</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot">${footer}</div>
    </div>`;

  const dialog = backdrop.querySelector('.modal');
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKeydown);
    backdrop.remove();
    if (root && !root.children.length) root.remove();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close();
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', close);
  });
  document.addEventListener('keydown', onKeydown);
  root.append(backdrop);

  requestAnimationFrame(() => {
    const focusable = backdrop.querySelector('input:not([type="hidden"]), select, textarea, button');
    focusable?.focus({ preventScroll: true });
  });

  return {
    dialog,
    body: backdrop.querySelector('.modal-body'),
    footer: backdrop.querySelector('.modal-foot'),
    close,
  };
}

export function confirmDialog({ title, message, confirmLabel = 'Hapus', danger = true }) {
  return new Promise((resolve) => {
    const modal = openModal({
      title,
      body: `<p style="font-size:.88rem;color:#475569">${escapeHtml(message)}</p>`,
      footer: `
        <button type="button" class="btn btn-outline" data-cancel>Batal</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${escapeHtml(confirmLabel)}</button>`,
    });

    const finish = (value) => {
      modal.close();
      resolve(value);
    };
    modal.footer.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
    modal.footer.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
    modal.dialog.closest('.modal-backdrop').addEventListener('click', (event) => {
      if (event.target.classList.contains('modal-backdrop')) resolve(false);
    });
  });
}

export const STATUS_LABELS = {
  pending: { label: 'Menunggu konfirmasi', className: 'badge-blue' },
  confirmed: { label: 'Dikonfirmasi', className: 'badge' },
  in_progress: { label: 'Sedang dikerjakan', className: 'badge-featured' },
  completed: { label: 'Selesai', className: 'badge-green' },
  cancelled: { label: 'Dibatalkan', className: 'badge-red' },
};

export function statusBadge(status) {
  const info = STATUS_LABELS[status] || { label: status, className: 'badge-gray' };
  return `<span class="badge ${info.className}">${escapeHtml(info.label)}</span>`;
}

export function roleBadge(role) {
  const map = {
    admin: { label: 'Admin', className: 'badge-blue' },
    technician: { label: 'Teknisi', className: 'badge' },
    customer: { label: 'Pelanggan', className: 'badge-green' },
  };
  const info = map[role] || { label: role, className: 'badge-gray' };
  return `<span class="badge ${info.className}">${escapeHtml(info.label)}</span>`;
}

export function emptyState(text, iconName = 'box') {
  return `<div class="empty">${icon(iconName)}<p>${escapeHtml(text)}</p></div>`;
}

export function loadingState(text = 'Memuat data…') {
  return `<div class="loading-block"><span class="spinner"></span>${escapeHtml(text)}</div>`;
}

export const PRICE_TYPE_LABEL = {
  fixed: 'Harga tetap',
  starting: 'Mulai dari',
  quote: 'Sesuai diagnosa',
};

/** Label harga sebuah layanan (mendukung harga tetap / mulai dari / sesuai diagnosa). */
export function servicePriceText(service) {
  if (!service) return '—';
  if (service.price_type === 'quote') return 'Sesuai diagnosa';
  if (service.price_type === 'starting') return `Mulai ${rupiah(service.price)}`;
  return rupiah(service.price);
}

/** Label total pesanan berdasarkan snapshot price_type. */
export function orderPriceText(order) {
  if (!order) return '—';
  if (order.price_type === 'quote') return 'Sesuai diagnosa';
  if (order.price_type === 'starting') return `Mulai ${rupiah(order.estimated_total)}`;
  return rupiah(order.estimated_total);
}

export function buildWhatsAppLink(order) {
  const modeLabel = order.service_mode === 'home' ? 'Panggil ke Rumah' : 'Datang ke Lokasi Teknisi';
  const lines = [
    '*Pesanan TekniKita*',
    `Kode: ${order.code}`,
    '',
    `Halo ${order.technician_name}, saya ${order.customer_name} ingin memesan jasa servis melalui TekniKita.`,
    '',
    `Layanan: ${order.service_name || 'Servis umum'}`,
    `Mode: ${modeLabel}`,
    order.scheduled_date ? `Jadwal: ${String(order.scheduled_date).slice(0, 10)}` : null,
    order.customer_address ? `Alamat: ${order.customer_address}` : null,
    order.complaint ? `Keluhan: ${order.complaint}` : null,
    `Perkiraan biaya: ${
      order.price_type === 'quote'
        ? 'menyesuaikan hasil diagnosa teknisi'
        : order.price_type === 'starting'
          ? `mulai dari ${rupiah(order.estimated_total)}`
          : rupiah(order.estimated_total)
    }`,
    '',
    'Mohon konfirmasi ketersediaan dan jadwalnya. Terima kasih.',
  ].filter((line) => line !== null);
  return `https://wa.me/${String(order.technician_phone).replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}
