import 'dotenv/config';

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const isProd = env === 'production';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Variabel lingkungan ${name} wajib diisi. Lihat .env.example.`);
  }
  return value;
}

const sessionSecret = required('SESSION_SECRET', isProd ? undefined : 'dev-secret-teknikita-jangan-dipakai-di-production');

if (isProd && (sessionSecret.length < 32 || sessionSecret.includes('ganti-dengan'))) {
  throw new Error('SESSION_SECRET production harus berupa nilai acak minimal 32 karakter.');
}

export const config = {
  env,
  isProd,
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknikita',
  },
  sessionSecret,
  sessionMaxAgeMs: 1000 * 60 * 60 * 8,
};
