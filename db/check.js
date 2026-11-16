/**
 * Diagnostik koneksi MySQL & kelengkapan skema.
 * Jalankan: npm run db:check
 */
import mysql from 'mysql2/promise';
import { config } from '../server/config.js';

const REQUIRED_TABLES = ['users', 'categories', 'technicians', 'services', 'orders', 'sessions'];
const REQUIRED_COLUMNS = {
  orders: ['customer_address'],
  technicians: ['slots_available', 'is_verified', 'is_featured'],
  users: ['password_hash', 'role', 'status'],
};

function line(ok, label, detail = '') {
  console.log(`${ok ? '[ OK ]' : '[FAIL]'} ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function main() {
  console.log('TekniKita — pemeriksaan konfigurasi database\n');
  console.log(`Host      : ${config.db.host}:${config.db.port}`);
  console.log(`User      : ${config.db.user}`);
  console.log(`Database  : ${config.db.database}`);
  console.log(`NODE_ENV  : ${config.env}\n`);

  let conn;
  try {
    conn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      connectTimeout: 8000,
    });
  } catch (error) {
    console.log('');
    line(false, 'Koneksi ke MySQL', error.code || error.message);
    console.log('\nKemungkinan penyebab:');
    console.log('  1. MySQL/MariaDB belum berjalan (XAMPP → Start MySQL, Laragon → Start All).');
    console.log('  2. DB_HOST / DB_PORT / DB_USER / DB_PASSWORD di berkas .env salah.');
    console.log('  3. User belum dibuat atau belum punya hak akses ke database.');
    console.log('\nContoh perbaikan (MySQL client / phpMyAdmin):');
    console.log(`  CREATE USER '${config.db.user}'@'localhost' IDENTIFIED BY 'kata-sandi-kuat';`);
    console.log(`  GRANT ALL PRIVILEGES ON ${config.db.database}.* TO '${config.db.user}'@'localhost';`);
    process.exitCode = 1;
    return;
  }

  const okConnect = line(true, 'Koneksi ke MySQL', (await conn.query('SELECT VERSION() AS v'))[0][0].v);

  const [dbs] = await conn.query('SHOW DATABASES LIKE ?', [config.db.database]);
  if (!dbs.length) {
    line(false, `Database "${config.db.database}"`, 'belum ada');
    console.log('\nJalankan: npm run db:init');
    await conn.end();
    process.exitCode = 1;
    return;
  }
  line(true, `Database "${config.db.database}"`);

  await conn.changeUser({ database: config.db.database });
  const [tables] = await conn.query(
    'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
    [config.db.database],
  );
  const existing = tables.map((row) => row.name);
  const missing = REQUIRED_TABLES.filter((table) => !existing.includes(table));

  if (!line(missing.length === 0, 'Tabel lengkap', missing.length ? `hilang: ${missing.join(', ')}` : REQUIRED_TABLES.join(', '))) {
    console.log('\nJalankan: npm run db:init');
  }

  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    if (!existing.includes(table)) continue;
    const [cols] = await conn.query(
      'SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [config.db.database, table],
    );
    const names = cols.map((row) => row.name);
    const absent = columns.filter((column) => !names.includes(column));
    line(absent.length === 0, `Kolom tabel ${table}`, absent.length ? `hilang: ${absent.join(', ')}` : 'lengkap');
  }

  if (!missing.length) {
    console.log('\nJumlah baris:');
    for (const table of ['users', 'categories', 'technicians', 'services', 'orders']) {
      const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      console.log(`  ${table.padEnd(12)} ${rows[0].total}`);
    }
    const [[admin]] = await conn.query("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active'");
    if (Number(admin.total) === 0) {
      console.log('\n[!] Tidak ada admin aktif. Jalankan: npm run db:seed');
    }
  }

  await conn.end();
  console.log('\nPemeriksaan selesai.');
  if (okConnect && !missing.length) console.log('Konfigurasi database terlihat siap. Jalankan: npm start');
}

main().catch((error) => {
  console.error('Pemeriksaan gagal:', error.message);
  process.exit(1);
});
