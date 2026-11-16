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
  // Kode referensi singkat agar pesan di browser bisa dicocokkan dengan log terminal.
  const ref = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.error(`[error ${ref}] ${req.method} ${req.originalUrl}\n`, err);
  return res.status(500).json({
    error: `Terjadi kesalahan pada server. Coba lagi nanti. (ref: ${ref})`,
    ref,
  });
}
