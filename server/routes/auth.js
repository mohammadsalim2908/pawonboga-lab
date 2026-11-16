import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { first, transaction } from '../db.js';
import { asyncHandler, conflict, parseBody, unauthorized, badRequest } from '../lib/http.js';
import { emailField, passwordField, nameField, phoneField, whatsappField, moneyField } from '../lib/fields.js';
import { publicUser, requireAuth } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan masuk. Silakan coba lagi dalam 15 menit.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.' },
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

const registerSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
  role: z.enum(['customer', 'technician']).default('customer'),
  businessName: z.string().trim().max(140).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  address: z.string().trim().max(255).optional(),
  area: z.string().trim().max(120).optional(),
  whatsappNumber: whatsappField.optional(),
  tariffStart: moneyField.optional(),
  callFee: moneyField.optional(),
  description: z.string().trim().max(2000).optional(),
});

function regenerate(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

router.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req, res) => {
    const data = parseBody(registerSchema, req.body);

    const existing = await first('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existing) throw conflict('Email tersebut sudah terdaftar. Silakan masuk.');

    let technician = null;
    if (data.role === 'technician') {
      if (!data.businessName || !data.categoryId || !data.address || !data.area || !data.whatsappNumber) {
        throw badRequest('Nama bengkel, kategori, alamat, area, dan nomor WhatsApp wajib diisi untuk akun teknisi.');
      }
      const category = await first('SELECT id FROM categories WHERE id = ?', [data.categoryId]);
      if (!category) throw badRequest('Kategori keahlian tidak ditemukan.');
      technician = data;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = await transaction(async (conn) => {
      const [result] = await conn.execute(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [data.name, data.email, digits(data.phone), passwordHash, data.role],
      );
      const newUserId = result.insertId;

      if (technician) {
        await conn.execute(
          `INSERT INTO technicians
             (user_id, category_id, business_name, description, address, area, whatsapp_number,
              tariff_start, call_fee, slots_available, is_verified, is_featured)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
          [
            newUserId,
            technician.categoryId,
            technician.businessName,
            technician.description || 'Teknisi baru di TekniKita.',
            technician.address,
            technician.area,
            digits(technician.whatsappNumber),
            technician.tariffStart ?? 0,
            technician.callFee ?? 0,
          ],
        );
      }
      return newUserId;
    });

    await regenerate(req);
    req.session.user = { id: userId };
    await saveSession(req);

    const user = await first(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, t.id AS technician_id
         FROM users u LEFT JOIN technicians t ON t.user_id = u.id WHERE u.id = ?`,
      [userId],
    );
    return res.status(201).json({ user: publicUser(user) });
  }),
);

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const data = parseBody(loginSchema, req.body);
    const user = await first('SELECT * FROM users WHERE email = ?', [data.email]);
    const valid = user ? await bcrypt.compare(data.password, user.password_hash) : false;

    if (!user || !valid) throw unauthorized('Email atau kata sandi salah.');
    if (user.status !== 'active') {
      throw unauthorized('Akun Anda dinonaktifkan. Hubungi admin TekniKita.');
    }

    await regenerate(req);
    req.session.user = { id: user.id };
    await saveSession(req);

    const technician = await first('SELECT id FROM technicians WHERE user_id = ?', [user.id]);
    return res.json({
      user: publicUser({ ...user, technician_id: technician?.id ?? null }),
    });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await new Promise((resolve) => req.session.destroy(resolve));
    res.clearCookie('teknikita.sid');
    res.json({ ok: true });
  }),
);

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const technician = req.user.role === 'technician'
    ? await first('SELECT id, is_verified, is_featured FROM technicians WHERE user_id = ?', [req.user.id])
    : null;
  res.json({
    user: publicUser(req.user),
    technician: technician ? { id: technician.id, isVerified: Boolean(technician.is_verified), isFeatured: Boolean(technician.is_featured) } : null,
  });
}));

export default router;
