import bcrypt from 'bcryptjs';
import { pool, query } from '../server/db.js';
import { config } from '../server/config.js';

const PASSWORDS = {
  admin: 'Admin#2026',
  technician: 'Teknisi#2026',
  customer: 'Pelanggan#2026',
};

const categories = [
  { name: 'HP & Gadget', description: 'Servis ponsel, tablet, dan perangkat wearable', icon: 'smartphone', sort: 1 },
  { name: 'Laptop & PC', description: 'Perbaikan laptop, komputer, dan printer', icon: 'laptop', sort: 2 },
  { name: 'Kulkas & Mesin Cuci', description: 'Pendingin rumah tangga dan mesin cuci', icon: 'fridge', sort: 3 },
  { name: 'TV & Audio', description: 'Televisi, sound system, dan perangkat audio', icon: 'tv', sort: 4 },
  { name: 'AC & Pendingin', description: 'Servis, cuci, dan pasang AC', icon: 'wind', sort: 5 },
];

const technicians = [
  {
    owner: 'Rizky Pratama',
    email: 'teknisi1@teknikita.id',
    phone: '6281200000001',
    business: 'Rizky Cell & Gadget Repair',
    category: 'HP & Gadget',
    tariff: 50000,
    callFee: 20000,
    slots: 4,
    address: 'Jl. Ahmad Yani No. 14, Banyuwangi Kota',
    area: 'Banyuwangi Kota',
    featured: true,
    rating: 4.9,
    description:
      'Spesialis ganti LCD, baterai kembung, konektor cas, dan perbaikan HP mati total semua merek. Garansi servis 30 hari.',
    services: [
      { name: 'Ganti LCD / Touchscreen', price: 350000, minutes: 90, description: 'LCD original quality dengan garansi pemasangan.' },
      { name: 'Ganti Baterai HP', price: 150000, minutes: 45, description: 'Baterai baru bergaransi 3 bulan.' },
      { name: 'Perbaikan HP Mati Total', price: 200000, minutes: 180, description: 'Analisa jalur power dan IC charging.' },
      { name: 'Ganti Konektor Cas', price: 90000, minutes: 60, description: 'Penyolderan ulang konektor charging.' },
    ],
  },
  {
    owner: 'Bagus Wicaksono',
    email: 'teknisi2@teknikita.id',
    phone: '6281200000002',
    business: 'Laptop Care Banyuwangi',
    category: 'Laptop & PC',
    tariff: 75000,
    callFee: 25000,
    slots: 3,
    address: 'Ruko Kertosari Blok C2, Banyuwangi',
    area: 'Kertosari',
    featured: true,
    rating: 4.8,
    description:
      'Servis motherboard, upgrade SSD/RAM, ganti keyboard, install ulang sistem operasi, dan pembersihan thermal laptop.',
    services: [
      { name: 'Install Ulang + Driver', price: 125000, minutes: 120, description: 'Windows/Linux, termasuk backup data ringan.' },
      { name: 'Pembersihan Thermal & Ganti Pasta', price: 150000, minutes: 90, description: 'Laptop kembali senyap dan tidak panas.' },
      { name: 'Upgrade SSD / RAM', price: 100000, minutes: 60, description: 'Biaya jasa, belum termasuk part.' },
      { name: 'Perbaikan Motherboard', price: 450000, minutes: 240, description: 'Analisa jalur power dan reballing chipset.' },
    ],
  },
  {
    owner: 'Siti Aminah',
    email: 'teknisi3@teknikita.id',
    phone: '6281200000003',
    business: 'Dingin Sejuk Kulkas & Mesin Cuci',
    category: 'Kulkas & Mesin Cuci',
    tariff: 90000,
    callFee: 30000,
    slots: 2,
    address: 'Jl. Basuki Rahmat No. 88, Banyuwangi',
    area: 'Banyuwangi Kota',
    featured: false,
    rating: 4.7,
    description:
      'Menangani kulkas tidak dingin, bocor freon, mesin cuci tidak berputar, dan modul error pada semua merek.',
    services: [
      { name: 'Servis Kulkas Tidak Dingin', price: 180000, minutes: 150, description: 'Cek kompresor, freon, dan thermostat.' },
      { name: 'Isi Freon Kulkas', price: 250000, minutes: 120, description: 'Freon R134a/R600a termasuk vakum.' },
      { name: 'Servis Mesin Cuci Tidak Berputar', price: 160000, minutes: 120, description: 'Cek dinamo, v-belt, dan kapasitor.' },
      { name: 'Ganti Modul Mesin Cuci', price: 300000, minutes: 90, description: 'Modul universal bergaransi 1 bulan.' },
    ],
  },
  {
    owner: 'Hendra Gunawan',
    email: 'teknisi4@teknikita.id',
    phone: '6281200000004',
    business: 'Audio Vision TV Service',
    category: 'TV & Audio',
    tariff: 80000,
    callFee: 25000,
    slots: 5,
    address: 'Jl. Sutomo No. 21, Genteng',
    area: 'Genteng',
    featured: true,
    rating: 4.8,
    description:
      'TV LED mati total, layar bergaris, suara hilang, serta servis sound system dan amplifier rumahan.',
    services: [
      { name: 'Servis TV LED Mati Total', price: 250000, minutes: 180, description: 'Cek power supply dan backlight.' },
      { name: 'Ganti LED Backlight TV', price: 300000, minutes: 240, description: 'Penggantian strip LED bergaransi.' },
      { name: 'Perbaikan Suara Hilang', price: 175000, minutes: 120, description: 'Cek IC audio dan speaker internal.' },
      { name: 'Servis Sound System', price: 150000, minutes: 120, description: 'Pembersihan potensiometer dan jalur audio.' },
    ],
  },
  {
    owner: 'Andi Saputra',
    email: 'teknisi5@teknikita.id',
    phone: '6281200000005',
    business: 'AC Pro Banyuwangi',
    category: 'AC & Pendingin',
    tariff: 100000,
    callFee: 35000,
    slots: 3,
    address: 'Jl. Letkol Istiqlah No. 45, Banyuwangi',
    area: 'Banyuwangi Kota',
    featured: true,
    rating: 4.9,
    description:
      'Cuci AC, isi freon, bongkar pasang, dan perbaikan AC tidak dingin untuk semua merek. Melayani panggilan ke rumah.',
    services: [
      { name: 'Cuci AC Split 1 Unit', price: 75000, minutes: 60, description: 'Cuci indoor dan outdoor tanpa bongkar.' },
      { name: 'Isi Freon AC', price: 275000, minutes: 90, description: 'Freon R32/R410a per unit.' },
      { name: 'Bongkar Pasang AC', price: 400000, minutes: 240, description: 'Termasuk instalasi pipa standar 3 meter.' },
      { name: 'Perbaikan AC Tidak Dingin', price: 150000, minutes: 120, description: 'Analisa kebocoran dan kapasitor.' },
    ],
  },
  {
    owner: 'Dewi Lestari',
    email: 'teknisi6@teknikita.id',
    phone: '6281200000006',
    business: 'Gadget Medika',
    category: 'HP & Gadget',
    tariff: 60000,
    callFee: 15000,
    slots: 0,
    address: 'Jl. Gajah Mada No. 7, Rogojampi',
    area: 'Rogojampi',
    featured: false,
    rating: 4.6,
    description:
      'Perbaikan software, flash ulang, ganti touchscreen, dan recovery data ponsel. Slot hari ini sedang penuh.',
    services: [
      { name: 'Flash / Install Ulang Android', price: 120000, minutes: 90, description: 'Termasuk pembersihan bloatware.' },
      { name: 'Ganti Touchscreen', price: 400000, minutes: 120, description: 'Biaya jasa dan part kualitas OEM.' },
      { name: 'Recovery Data HP', price: 250000, minutes: 180, description: 'Pemulihan foto dan kontak dari HP mati.' },
    ],
  },
  {
    owner: 'Fajar Nugroho',
    email: 'teknisi7@teknikita.id',
    phone: '6281200000007',
    business: 'Komputer Mandiri',
    category: 'Laptop & PC',
    tariff: 65000,
    callFee: 20000,
    slots: 6,
    address: 'Jl. Diponegoro No. 102, Banyuwangi',
    area: 'Banyuwangi Kota',
    featured: false,
    rating: 4.5,
    description:
      'Rakit PC, servis printer, instalasi jaringan kantor, dan perawatan komputer untuk rumah maupun usaha.',
    services: [
      { name: 'Rakit PC + Instalasi', price: 300000, minutes: 240, description: 'Jasa rakit dan setup BIOS/driver.' },
      { name: 'Servis Printer Macet', price: 120000, minutes: 90, description: 'Bersihkan roller dan cek cartridge.' },
      { name: 'Instalasi Jaringan Kantor', price: 500000, minutes: 300, description: 'Hingga 8 titik kabel dan konfigurasi router.' },
    ],
  },
  {
    owner: 'Rina Kartika',
    email: 'teknisi8@teknikita.id',
    phone: '6281200000008',
    business: 'Prima Elektronik',
    category: 'Kulkas & Mesin Cuci',
    tariff: 70000,
    callFee: 20000,
    slots: 1,
    address: 'Jl. Raya Muncar No. 33, Muncar',
    area: 'Muncar',
    featured: false,
    rating: 4.4,
    description:
      'Servis kulkas dua pintu, freezer tidak beku, mesin cuci bocor, serta perawatan elektronik rumah tangga lainnya.',
    services: [
      { name: 'Servis Kulkas Dua Pintu', price: 200000, minutes: 180, description: 'Analisa kebocoran dan termostat.' },
      { name: 'Servis Mesin Cuci Bocor', price: 140000, minutes: 90, description: 'Ganti seal dan selang drainase.' },
      { name: 'Servis Freezer Tidak Beku', price: 190000, minutes: 150, description: 'Cek freon dan defrost system.' },
    ],
  },
];

const customers = [
  { name: 'Budi Santoso', email: 'pelanggan1@teknikita.id', phone: '6281300000001' },
  { name: 'Maya Anggraini', email: 'pelanggan2@teknikita.id', phone: '6281300000002' },
  { name: 'Keluarga Wijaya', email: 'pelanggan3@teknikita.id', phone: '6281300000003' },
];

const orders = [
  { customer: 0, technician: 0, service: 0, mode: 'home', status: 'completed', complaint: 'Layar HP pecah setelah terjatuh.', address: 'Jl. Ikan Tongkol No. 8, Banyuwangi', daysAgo: 5, date: true },
  { customer: 1, technician: 4, service: 0, mode: 'home', status: 'confirmed', complaint: 'AC kamar tidak dingin dan berisik.', address: 'Perumahan Griya Asri Blok B4, Banyuwangi', daysAgo: 1, date: true },
  { customer: 2, technician: 1, service: 1, mode: 'workshop', status: 'in_progress', complaint: 'Laptop panas dan kipas berisik.', address: '', daysAgo: 0, date: false },
  { customer: 0, technician: 3, service: 2, mode: 'workshop', status: 'pending', complaint: 'TV LED suara hilang, gambar normal.', address: '', daysAgo: 0, date: false },
  { customer: 1, technician: 2, service: 0, mode: 'home', status: 'cancelled', complaint: 'Kulkas kurang dingin sejak seminggu.', address: 'Jl. Kartini No. 45, Banyuwangi', daysAgo: 3, date: false },
  { customer: 2, technician: 6, service: 1, mode: 'home', status: 'pending', complaint: 'Printer kantor macet terus.', address: 'Toko Sumber Rejeki, Jl. Diponegoro 12', daysAgo: 0, date: true },
];

function rupiahRounded(value) {
  return value;
}

function isoDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const adminHash = await bcrypt.hash(PASSWORDS.admin, 12);
  const techHash = await bcrypt.hash(PASSWORDS.technician, 12);
  const customerHash = await bcrypt.hash(PASSWORDS.customer, 12);

  console.log('Menghapus data lama...');
  // Satu koneksi khusus: FOREIGN_KEY_CHECKS bersifat per-sesi, bukan global.
  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['orders', 'services', 'technicians', 'categories', 'users', 'sessions']) {
      await conn.query(`TRUNCATE TABLE \`${table}\``);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    conn.release();
  }

  const categoryIds = new Map();
  for (const category of categories) {
    const result = await query(
      'INSERT INTO categories (name, description, icon, sort_order) VALUES (?, ?, ?, ?)',
      [category.name, category.description, category.icon, category.sort],
    );
    categoryIds.set(category.name, result.insertId);
  }

  const adminResult = await query(
    'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    ['Admin TekniKita', 'admin@teknikita.id', '6281100000001', adminHash, 'admin'],
  );
  console.log(`Admin dibuat (id ${adminResult.insertId}).`);

  const technicianIds = [];
  for (const tech of technicians) {
    const userResult = await query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [tech.owner, tech.email, tech.phone, techHash, 'technician'],
    );
    const techResult = await query(
      `INSERT INTO technicians
         (user_id, category_id, business_name, description, address, area, whatsapp_number,
          tariff_start, call_fee, slots_available, is_featured, is_verified, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        userResult.insertId,
        categoryIds.get(tech.category),
        tech.business,
        tech.description,
        tech.address,
        tech.area,
        tech.phone,
        tech.tariff,
        tech.callFee,
        tech.slots,
        tech.featured ? 1 : 0,
        tech.rating,
      ],
    );
    technicianIds.push({ id: techResult.insertId, business: tech.business, phone: tech.phone });

    for (const service of tech.services) {
      await query(
        'INSERT INTO services (technician_id, name, description, price, estimated_minutes) VALUES (?, ?, ?, ?, ?)',
        [techResult.insertId, service.name, service.description, rupiahRounded(service.price), service.minutes],
      );
    }
  }

  const customerIds = [];
  for (const customer of customers) {
    const result = await query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [customer.name, customer.email, customer.phone, customerHash, 'customer'],
    );
    customerIds.push({ id: result.insertId, ...customer });
  }

  let counter = 1;
  for (const order of orders) {
    const technician = technicianIds[order.technician];
    const customer = customerIds[order.customer];
    const service = technicians[order.technician].services[order.service];
    const callFee = order.mode === 'home' ? technicians[order.technician].callFee : 0;
    const total = service.price + callFee;
    const code = `TK-DEMO${String(counter++).padStart(2, '0')}`;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - order.daysAgo);

    await query(
      `INSERT INTO orders
         (code, customer_id, technician_id, customer_name, customer_phone, technician_name,
          technician_phone, service_name, service_mode, complaint, customer_address,
          estimated_total, status, scheduled_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        customer.id,
        technician.id,
        customer.name,
        customer.phone,
        technician.business,
        technician.phone,
        service.name,
        order.mode,
        order.complaint,
        order.address,
        total,
        order.status,
        order.date ? isoDate(order.daysAgo === 5 ? -5 : 1) : null,
        createdAt.toISOString().slice(0, 19).replace('T', ' '),
      ],
    );
  }

  const summary = await query(
    `SELECT
       (SELECT COUNT(*) FROM users) AS users,
       (SELECT COUNT(*) FROM categories) AS categories,
       (SELECT COUNT(*) FROM technicians) AS technicians,
       (SELECT COUNT(*) FROM services) AS services,
       (SELECT COUNT(*) FROM orders) AS orders`,
  );

  console.log('Data dummy berhasil ditambahkan:', summary[0]);
  console.log(`\nAkun demo (${config.db.database}):`);
  console.log(`  Admin     : admin@teknikita.id / ${PASSWORDS.admin}`);
  console.log(`  Teknisi   : teknisi1@teknikita.id / ${PASSWORDS.technician}`);
  console.log(`  Pelanggan : pelanggan1@teknikita.id / ${PASSWORDS.customer}`);

  await pool.end();
}

main().catch(async (error) => {
  console.error('Gagal mengisi data dummy:', error);
  await pool.end().catch(() => {});
  process.exit(1);
});
