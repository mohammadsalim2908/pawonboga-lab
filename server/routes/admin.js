import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, first } from '../db.js';
import { asyncHandler, badRequest, forbidden, notFound, parseBody, parseId } from '../lib/http.js';
import { requireRole, publicUser } from '../middleware/auth.js';
import {
  emailField,
  passwordField,
  nameField,
  phoneField,
  whatsappField,
  moneyField,
  slotField,
  textField,
} from '../lib/fields.js';

const router = Router();
router.use(requireRole('admin'));

const createUserSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
  role: z.enum(['admin', 'technician', 'customer']),
  businessName: z.string().trim().max(140).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  address: z.string().trim().max(255).optional(),
  area: z.string().trim().max(120).optional(),
  whatsappNumber: whatsappField.optional(),
  tariffStart: moneyField.optional(),
  callFee: moneyField.optional(),
  description: z.string().trim().max(2000).optional(),
  slotsAvailable: slotField.optional(),
});

const updateUserSchema = z.object({
  name: nameField.optional(),
  email: emailField.optional(),
  phone: phoneField.optional(),
  role: z.enum(['admin', 'technician', 'customer']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  password: passwordField.optional(),
  businessName: z.string().trim().max(140).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  address: z.string().trim().max(255).optional(),
  area: z.string().trim().max(120).optional(),
  whatsappNumber: whatsappField.optional(),
  tariffStart: moneyField.optional(),
  callFee: moneyField.optional(),
  description: z.string().trim().max(2000).optional(),
});

const moderationSchema = z.object({
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  slotsAvailable: slotField.optional(),
});

const categorySchema = z.object({
  name: textField('Nama kategori', 3, 80),
  description: z.string().trim().max(255).optional().default(''),
  icon: z.string().trim().max(40).optional().default('wrench'),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

async function countActiveAdmins() {
  const row = await first("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active'");
  return Number(row.total);
}

async function ensureTechnicianProfile(userId, data) {
  if (!data.businessName || !data.categoryId) {
    throw badRequest('Nama bengkel dan kategori wajib diisi saat membuat/mengubah akun menjadi teknisi.');
  }
  const category = await first('SELECT id FROM categories WHERE id = ?', [data.categoryId]);
  if (!category) throw badRequest('Kategori tidak ditemukan.');
  await query(
    `INSERT INTO technicians
       (user_id, category_id, business_name, description, address, area, whatsapp_number,
        tariff_start, call_fee, slots_available, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       category_id = VALUES(category_id), business_name = VALUES(business_name),
       description = VALUES(description), address = VALUES(address), area = VALUES(area)`,
    [
      userId,
      data.categoryId,
      data.businessName,
      data.description || 'Teknisi mitra TekniKita.',
      data.address || '-',
      data.area || '-',
      data.whatsappNumber || '6281200000000',
      data.tariffStart ?? 0,
      data.callFee ?? 0,
      data.slotsAvailable ?? 0,
    ],
  );
}

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const users = await first(
      `SELECT
         COUNT(*) AS total,
         SUM(role = 'admin') AS admins,
         SUM(role = 'technician') AS technicians,
         SUM(role = 'customer') AS customers,
         SUM(status = 'suspended') AS suspended
       FROM users`,
    );
    const directory = await first(
      `SELECT
         (SELECT COUNT(*) FROM technicians WHERE is_verified = 1) AS verified_technicians,
         (SELECT COUNT(*) FROM technicians WHERE is_verified = 0) AS pending_technicians,
         (SELECT COALESCE(SUM(slots_available), 0) FROM technicians WHERE is_verified = 1) AS total_slots,
         (SELECT COUNT(*) FROM categories) AS categories,
         (SELECT COUNT(*) FROM orders) AS orders,
         (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
         (SELECT COALESCE(SUM(estimated_total), 0) FROM orders WHERE status = 'completed') AS revenue`,
    );
    const recentOrders = await query(
      `SELECT id, code, customer_name, technician_name, status, estimated_total, created_at
         FROM orders ORDER BY created_at DESC, id DESC LIMIT 6`,
    );

    res.json({
      users: {
        total: Number(users.total),
        admins: Number(users.admins || 0),
        technicians: Number(users.technicians || 0),
        customers: Number(users.customers || 0),
        suspended: Number(users.suspended || 0),
      },
      directory: {
        verifiedTechnicians: Number(directory.verified_technicians || 0),
        pendingTechnicians: Number(directory.pending_technicians || 0),
        totalSlots: Number(directory.total_slots || 0),
        categories: Number(directory.categories || 0),
        orders: Number(directory.orders || 0),
        pendingOrders: Number(directory.pending_orders || 0),
        revenue: Number(directory.revenue || 0),
      },
      recentOrders: recentOrders.map((o) => ({ ...o, estimated_total: Number(o.estimated_total) })),
    });
  }),
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const role = ['admin', 'technician', 'customer'].includes(req.query.role) ? req.query.role : null;
    const status = ['active', 'suspended'].includes(req.query.status) ? req.query.status : null;

    const params = [];
    const where = ['1 = 1'];
    if (q) {
      where.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR t.business_name LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (role) {
      where.push('u.role = ?');
      params.push(role);
    }
    if (status) {
      where.push('u.status = ?');
      params.push(status);
    }

    const rows = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
              t.id AS technician_id, t.business_name, t.is_verified, t.is_featured,
              t.category_id, c.name AS category_name, t.slots_available
         FROM users u
         LEFT JOIN technicians t ON t.user_id = u.id
         LEFT JOIN categories c ON c.id = t.category_id
        WHERE ${where.join(' AND ')}
        ORDER BY u.role ASC, u.created_at DESC
        LIMIT 300`,
      params,
    );

    res.json({
      users: rows.map((row) => ({
        ...row,
        is_verified: row.is_verified === null ? null : Boolean(row.is_verified),
        is_featured: row.is_featured === null ? null : Boolean(row.is_featured),
      })),
    });
  }),
);

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const data = parseBody(createUserSchema, req.body);
    const existing = await first('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existing) throw badRequest('Email sudah digunakan oleh akun lain.');

    const hash = await bcrypt.hash(data.password, 12);
    const result = await query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.email, data.phone, hash, data.role],
    );

    if (data.role === 'technician') {
      try {
        await ensureTechnicianProfile(result.insertId, data);
      } catch (error) {
        await query('DELETE FROM users WHERE id = ?', [result.insertId]);
        throw error;
      }
    }

    const created = await first('SELECT id, name, email, phone, role, status FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({ user: publicUser(created) });
  }),
);

router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = parseBody(updateUserSchema, req.body);
    const target = await first('SELECT * FROM users WHERE id = ?', [id]);
    if (!target) throw notFound('Pengguna tidak ditemukan.');

    if (id === req.user.id && (data.role && data.role !== 'admin')) {
      throw forbidden('Anda tidak dapat mengubah peran akun Anda sendiri.');
    }
    if (id === req.user.id && data.status === 'suspended') {
      throw forbidden('Anda tidak dapat menonaktifkan akun Anda sendiri.');
    }
    if (target.role === 'admin' && data.role && data.role !== 'admin') {
      const admins = await countActiveAdmins();
      if (admins <= 1) throw forbidden('Minimal harus ada satu admin aktif.');
    }
    if (target.role === 'admin' && data.status === 'suspended') {
      const admins = await countActiveAdmins();
      if (admins <= 1) throw forbidden('Minimal harus ada satu admin aktif.');
    }
    if (data.email && data.email !== target.email) {
      const existing = await first('SELECT id FROM users WHERE email = ? AND id != ?', [data.email, id]);
      if (existing) throw badRequest('Email sudah digunakan oleh akun lain.');
    }

    const fields = [];
    const params = [];
    for (const [column, value] of [
      ['name', data.name],
      ['email', data.email],
      ['phone', data.phone],
      ['role', data.role],
      ['status', data.status],
    ]) {
      if (value !== undefined) {
        fields.push(`${column} = ?`);
        params.push(value);
      }
    }
    if (data.password) {
      fields.push('password_hash = ?');
      params.push(await bcrypt.hash(data.password, 12));
    }
    if (fields.length) {
      params.push(id);
      await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    if (data.role === 'technician' || target.role === 'technician') {
      const wantsProfile = data.businessName || data.categoryId;
      if (data.role === 'technician' && !target.role.startsWith('technician')) {
        await ensureTechnicianProfile(id, data);
      } else if (wantsProfile) {
        await ensureTechnicianProfile(id, { ...data, businessName: data.businessName, categoryId: data.categoryId });
      }
    }

    const updated = await first('SELECT id, name, email, phone, role, status FROM users WHERE id = ?', [id]);
    res.json({ user: publicUser(updated) });
  }),
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === req.user.id) throw forbidden('Anda tidak dapat menghapus akun Anda sendiri.');
    const target = await first('SELECT * FROM users WHERE id = ?', [id]);
    if (!target) throw notFound('Pengguna tidak ditemukan.');
    if (target.role === 'admin') {
      const admins = await countActiveAdmins();
      if (admins <= 1) throw forbidden('Minimal harus ada satu admin aktif.');
    }
    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ ok: true });
  }),
);

router.get(
  '/technicians',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const params = [];
    let sql = `SELECT t.*, c.name AS category_name, u.name AS owner_name, u.email, u.status AS user_status
                 FROM technicians t
                 JOIN categories c ON c.id = t.category_id
                 JOIN users u ON u.id = t.user_id`;
    if (q) {
      sql += ' WHERE (t.business_name LIKE ? OR t.area LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    sql += ' ORDER BY t.is_verified ASC, t.is_featured DESC, t.business_name ASC LIMIT 200';
    const rows = await query(sql, params);
    res.json({
      technicians: rows.map((row) => ({
        ...row,
        is_verified: Boolean(row.is_verified),
        is_featured: Boolean(row.is_featured),
        tariff_start: Number(row.tariff_start),
        call_fee: Number(row.call_fee),
        slots_available: Number(row.slots_available),
      })),
    });
  }),
);

router.patch(
  '/technicians/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = parseBody(moderationSchema, req.body);
    const technician = await first('SELECT id FROM technicians WHERE id = ?', [id]);
    if (!technician) throw notFound('Teknisi tidak ditemukan.');

    const fields = [];
    const params = [];
    if (data.isVerified !== undefined) {
      fields.push('is_verified = ?');
      params.push(data.isVerified ? 1 : 0);
    }
    if (data.isFeatured !== undefined) {
      fields.push('is_featured = ?');
      params.push(data.isFeatured ? 1 : 0);
    }
    if (data.slotsAvailable !== undefined) {
      fields.push('slots_available = ?');
      params.push(data.slotsAvailable);
    }
    if (!fields.length) throw badRequest('Tidak ada perubahan yang dikirim.');
    params.push(id);
    await query(`UPDATE technicians SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ ok: true });
  }),
);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const status = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(req.query.status)
      ? req.query.status
      : null;
    const params = [];
    let sql = 'SELECT * FROM orders';
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC, id DESC LIMIT 200';
    const rows = await query(sql, params);
    res.json({ orders: rows.map((row) => ({ ...row, estimated_total: Number(row.estimated_total) })) });
  }),
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM technicians t WHERE t.category_id = c.id) AS technician_count
         FROM categories c ORDER BY c.sort_order ASC, c.name ASC`,
    );
    res.json({ categories: rows.map((row) => ({ ...row, technician_count: Number(row.technician_count) })) });
  }),
);

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const data = parseBody(categorySchema, req.body);
    const result = await query(
      'INSERT INTO categories (name, description, icon, sort_order) VALUES (?, ?, ?, ?)',
      [data.name, data.description, data.icon, data.sortOrder],
    );
    res.status(201).json({ id: result.insertId });
  }),
);

router.patch(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = parseBody(categorySchema, req.body);
    const existing = await first('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) throw notFound('Kategori tidak ditemukan.');
    await query('UPDATE categories SET name = ?, description = ?, icon = ?, sort_order = ? WHERE id = ?', [
      data.name,
      data.description,
      data.icon,
      data.sortOrder,
      id,
    ]);
    res.json({ ok: true });
  }),
);

router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const used = await first('SELECT COUNT(*) AS total FROM technicians WHERE category_id = ?', [id]);
    if (Number(used.total) > 0) {
      throw badRequest(`Kategori masih digunakan oleh ${used.total} teknisi. Pindahkan teknisi tersebut terlebih dahulu.`);
    }
    await query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ ok: true });
  }),
);

export default router;
