import { z } from 'zod';

/** Field validasi bersama antar-route. */
export const emailField = z
  .string({ required_error: 'Email wajib diisi.' })
  .trim()
  .toLowerCase()
  .email('Format email tidak valid.')
  .max(160, 'Email terlalu panjang.');

export const passwordField = z
  .string({ required_error: 'Kata sandi wajib diisi.' })
  .min(8, 'Kata sandi minimal 8 karakter.')
  .max(72, 'Kata sandi maksimal 72 karakter.');

export const nameField = z
  .string({ required_error: 'Nama wajib diisi.' })
  .trim()
  .min(3, 'Nama minimal 3 karakter.')
  .max(120, 'Nama terlalu panjang.');

export const phoneField = z
  .string({ required_error: 'Nomor telepon wajib diisi.' })
  .trim()
  .min(8, 'Nomor telepon minimal 8 digit.')
  .max(20, 'Nomor telepon terlalu panjang.')
  .regex(/^[0-9+\-\s()]+$/, 'Nomor telepon hanya boleh berisi angka dan tanda +, -, spasi, atau kurung.');

export const whatsappField = z
  .string({ required_error: 'Nomor WhatsApp wajib diisi.' })
  .trim()
  .regex(/^[1-9][0-9]{7,14}$/, 'Nomor WhatsApp harus format internasional tanpa tanda +, contoh 6281200000000.');

export const moneyField = z.coerce
  .number({ invalid_type_error: 'Nilai harus berupa angka.' })
  .int('Nilai harus bilangan bulat.')
  .min(0, 'Nilai tidak boleh negatif.')
  .max(500_000_000, 'Nilai terlalu besar.');

export const slotField = z.coerce
  .number({ invalid_type_error: 'Slot harus berupa angka.' })
  .int('Slot harus bilangan bulat.')
  .min(0, 'Slot tidak boleh negatif.')
  .max(50, 'Slot maksimal 50 per hari.');

export const textField = (label, min = 1, max = 255) =>
  z
    .string({ required_error: `${label} wajib diisi.` })
    .trim()
    .min(min, min <= 1 ? `${label} wajib diisi.` : `${label} minimal ${min} karakter.`)
    .max(max, `${label} terlalu panjang.`);

export const optionalText = (max = 255) => z.string().trim().max(max, 'Teks terlalu panjang.').optional().default('');
