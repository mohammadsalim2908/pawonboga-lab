import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../server/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reset = process.argv.includes('--reset');

async function main() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  const dbName = config.db.database;
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conn.changeUser({ database: dbName });

  if (reset) {
    console.log('Menghapus seluruh tabel (--reset)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['orders', 'services', 'technicians', 'categories', 'users', 'sessions']) {
      await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(schema);
  await conn.end();
  console.log(`Skema database "${dbName}" siap.`);
}

main().catch((error) => {
  console.error('Gagal menyiapkan database:', error.message);
  process.exit(1);
});
