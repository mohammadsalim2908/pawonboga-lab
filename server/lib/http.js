import fs from 'node:fs';
import path from 'node:path';

/** Kesalahan HTTP yang aman ditampilkan ke klien. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const unauthorized = (message = 'Silakan masuk terlebih dahulu.') => new HttpError(401, message);
export const forbidden = (message = 'Anda tidak memiliki akses ke fitur ini.') => new HttpError(403, message);
export const notFound = (message = 'Data tidak ditemukan.') => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);

/** Pesan bantuan untuk kegagalan MySQL yang paling sering terjadi saat setup lokal. */
const DB_HINTS = {
  ECONNREFUSED: 'Tidak dapat terhubung ke MySQL. Pastikan server MySQL sudah menyala dan DB_HOST/DB_PORT di .env benar.',
  ETIMEDOUT: 'Koneksi ke MySQL timeout. Periksa DB_HOST/DB_PORT dan firewall.',
  ENOTFOUND: 'Alamat MySQL tidak ditemukan. Periksa DB_HOST di .env.',
  PROTOCOL_CONNECTION_LOST: 'Koneksi MySQL terputus. Jalankan ulang server MySQL lalu coba lagi.',
  ER_ACCESS_DENIED_ERROR:
    'MySQL menolak login. Periksa DB_USER/DB_PASSWORD di .env, atau buat user tersebut di phpMyAdmin → User accounts dan beri hak pada database teknikita.',
  ER_DBACCESS_DENIED_ERROR:
    'User MySQL tidak punya hak ke database ini. Beri hak di phpMyAdmin → User accounts → Database privileges.',
  ER_BAD_DB_ERROR: 'Database belum ada. Jalankan: npm run db:init (atau buat database teknikita di phpMyAdmin).',
  ER_NO_SUCH_TABLE: 'Tabel belum tersedia. Jalankan: npm run db:init lalu npm run db:seed.',
  ER_NOT_SUPPORTED_AUTH_MODE:
    'Metode autentikasi MySQL tidak didukung. Ubah user MySQL ke mysql_native_password atau perbarui paket mysql2.',
  ER_TABLEACCESS_DENIED_ERROR: 'User MySQL tidak punya hak baca/tulis pada tabel. Berikan GRANT SELECT, INSERT, UPDATE, DELETE.',
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/** Ubah error dari zod menjadi pesan validasi yang ramah. */
export function parseBody(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw badRequest(details[0]?.message ?? 'Data yang dikirim tidak valid.', details);
  }
  return result.data;
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('ID tidak valid.');
  return id;
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Data dengan nilai unik tersebut sudah ada.' });
  }
  if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'Data masih dipakai oleh data lain sehingga tidak dapat dihapus.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Format JSON tidak valid.' });
  }
  // Kode referensi singkat agar pesan di browser bisa dicocokkan dengan log terminal/berkas.
  const ref = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = new Date().toISOString();
  const detail = `[error ${ref}] ${stamp} ${req.method} ${req.originalUrl}\n${err?.stack || err}\n\n`;
  console.error(detail.trimEnd());

  try {
    const dir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'error.log'), detail);
  } catch {
    /* logging ke berkas bersifat opsional */
  }

  // Kode penyebab yang aman ditampilkan (mis. ER_ACCESS_DENIED_ERROR) agar mudah didiagnosis.
  const code = typeof err?.code === 'string' ? err.code : undefined;
  const hint = code ? DB_HINTS[code] : undefined;
  return res.status(500).json({
    error: `${hint || 'Terjadi kesalahan pada server. Coba lagi nanti.'} (ref: ${ref}${code ? `, kode: ${code}` : ''})`,
    ref,
    code,
    hint,
  });
}
