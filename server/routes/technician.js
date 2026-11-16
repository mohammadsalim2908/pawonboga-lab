import { Router } from 'express';
import { z } from 'zod';
import { query, first } from '../db.js';
import { asyncHandler, badRequest, conflict, notFound, parseBody, parseId } from '../lib/http.js';
import { requireRole } from '../middleware/auth.js';
import { textField, whatsappField, moneyField, slotField, optionalText, mapsUrlField } from '../lib/fields.js';

const router = Router();
router.use(requireRole('technician'));

async function myTechnician(userId) {
  const technician = await first('SELECT * FROM technicians WHERE user_id = ?', [userId]);
  if (!technician) {
    throw conflict('Profil teknisi belum tersedia. Hubungi admin untuk melengkapi profil Anda.');
  }
  return technician;
}

const profileSchema = z.object({
  businessName: textField('Nama teknisi / usaha', 3, 140),
  categoryId: z.coerce.number().int().positive('Kategori wajib dipilih.'),
  description: textField('Deskripsi keahlian', 10, 2000),
  address: textField('Alamat teknisi', 5, 255),
  mapsUrl: mapsUrlField,
  area: textField('Area layanan', 3, 120),
  whatsappNumber: whatsappField,
  tariffStart: moneyField,
  callFee: moneyField,
  slotsAvailable: slotField,
});

const serviceSchema = z
  .object({
    name: textField('Nama layanan', 3, 140),
    description: optionalText(255),
    priceType: z.enum(['fixed', 'starting', 'quote'], {
      errorMap: () => ({ message: 'Tipe harga tidak valid.' }),
    }).default('fixed'),
    includesParts: z.boolean().optional().default(false),
    price: moneyField,
    estimatedMinutes: z.coerce.number().int().min(10, 'Estimasi minimal 10 menit.').max(2880, 'Estimasi maksimal 2 hari.'),
    isActive: z.boolean().optional().default(true),
  })
  .transform((data) => ({
    ...data,
    // Layanan bertipe "sesuai diagnosa" tidak menyimpan angka harga.
    price: data.priceType === 'quote' ? 0 : data.price,
  }));

const categorySchema = z.object({
  name: textField('Nama kategori', 3, 80),
  description: z.string().trim().max(255).optional().default(''),
  icon: z.string().trim().max(40).optional().default('wrench'),
});

const statusTransitions = {
  pending: ['confirmed', 'cancelled', 'in_progress'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const profile = await first(
      `SELECT t.*, c.name AS category_name,
              (SELECT COUNT(*) FROM services s WHERE s.technician_id = t.id AND s.is_active = 1) AS active_services
         FROM technicians t JOIN categories c ON c.id = t.category_id
        WHERE t.user_id = ?`,
      [req.user.id],
    );
    res.json({ profile: profile ? { ...profile, active_services: Number(profile.active_services) } : null });
  }),
);

router.put(
  '/profile',
  asyncHandler(async (req, res) => {
    const data = parseBody(profileSchema, req.body);
    const technician = await myTechnician(req.user.id);

    const category = await first('SELECT id, owner_user_id FROM categories WHERE id = ?', [data.categoryId]);
    if (!category) throw badRequest('Kategori keahlian tidak ditemukan.');
    if (category.owner_user_id && category.owner_user_id !== req.user.id) {
      throw badRequest('Kategori tersebut milik teknisi lain. Buat kategori sendiri terlebih dahulu.');
    }

    await query(
      `UPDATE technicians
          SET business_name = ?, category_id = ?, description = ?, address = ?, maps_url = ?,
              area = ?, whatsapp_number = ?, tariff_start = ?, call_fee = ?, slots_available = ?
        WHERE id = ?`,
      [
        data.businessName,
        data.categoryId,
        data.description,
        data.address,
        data.mapsUrl,
        data.area,
        data.whatsappNumber,
        data.tariffStart,
        data.callFee,
        data.slotsAvailable,
        technician.id,
      ],
    );

    const updated = await first('SELECT * FROM technicians WHERE id = ?', [technician.id]);
    res.json({ profile: updated });
  }),
);

router.patch(
  '/availability',
  asyncHandler(async (req, res) => {
    const data = parseBody(z.object({ slotsAvailable: slotField }), req.body);
    const technician = await myTechnician(req.user.id);
    await query('UPDATE technicians SET slots_available = ? WHERE id = ?', [data.slotsAvailable, technician.id]);
    res.json({ slotsAvailable: data.slotsAvailable });
  }),
);

/* ------------------------------ Kategori --------------------------------- */
// Teknisi melihat kategori umum + kategori pribadinya sendiri.
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT c.id, c.name, c.description, c.icon, c.owner_user_id,
              (c.owner_user_id = ?) AS is_own
         FROM categories c
        WHERE c.owner_user_id IS NULL OR c.owner_user_id = ?
        ORDER BY c.owner_user_id IS NOT NULL, c.sort_order ASC, c.name ASC`,
      [req.user.id, req.user.id],
    );
    res.json({
      categories: rows.map((row) => ({ ...row, is_own: Boolean(Number(row.is_own)) })),
    });
  }),
);

// Teknisi membuat kategori pribadi: hanya terlihat oleh akunnya sendiri.
router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const data = parseBody(categorySchema, req.body);

    const duplicate = await first(
      `SELECT id FROM categories
        WHERE name = ? AND (owner_user_id = ? OR owner_user_id IS NULL)`,
      [data.name, req.user.id],
    );
    if (duplicate) throw conflict('Kategori dengan nama tersebut sudah tersedia di daftar Anda.');

    const result = await query(
      'INSERT INTO categories (name, description, icon, owner_user_id, sort_order) VALUES (?, ?, ?, ?, 99)',
      [data.name, data.description || 'Kategori pribadi teknisi', data.icon, req.user.id],
    );

    res.status(201).json({
      category: { id: result.insertId, name: data.name, description: data.description, icon: data.icon, is_own: true },
    });
  }),
);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const technician = await myTechnician(req.user.id);
    const stats = await first(
      `SELECT
         COUNT(*) AS total_orders,
         SUM(status = 'pending') AS pending,
         SUM(status = 'confirmed') AS confirmed,
         SUM(status = 'in_progress') AS in_progress,
         SUM(status = 'completed') AS completed,
         SUM(status = 'cancelled') AS cancelled,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN estimated_total ELSE 0 END), 0) AS revenue
       FROM orders WHERE technician_id = ?`,
      [technician.id],
    );
    const services = await first(
      'SELECT COUNT(*) AS total, SUM(is_active = 1) AS active FROM services WHERE technician_id = ?',
      [technician.id],
    );

    res.json({
      stats: {
        totalOrders: Number(stats.total_orders || 0),
        pending: Number(stats.pending || 0),
        confirmed: Number(stats.confirmed || 0),
        inProgress: Number(stats.in_progress || 0),
        completed: Number(stats.completed || 0),
        cancelled: Number(stats.cancelled || 0),
        revenue: Number(stats.revenue || 0),
      },
      services: { total: Number(services.total || 0), active: Number(services.active || 0) },
      slotsAvailable: Number(technician.slots_available),
      isVerified: Boolean(technician.is_verified),
      isFeatured: Boolean(technician.is_featured),
    });
  }),
);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const technician = await myTechnician(req.user.id);
    const status = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(req.query.status)
      ? req.query.status
      : null;
    const params = [technician.id];
    let sql = `SELECT o.*, u.email AS customer_email, u.phone AS customer_account_phone
                 FROM orders o LEFT JOIN users u ON u.id = o.customer_id
                WHERE o.technician_id = ?`;
    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY o.created_at DESC, o.id DESC LIMIT 200';
    const rows = await query(sql, params);
    res.json({ orders: rows.map((row) => ({ ...row, estimated_total: Number(row.estimated_total) })) });
  }),
);

router.patch(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const data = parseBody(z.object({ status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']) }), req.body);
    const id = parseId(req.params.id);
    const technician = await myTechnician(req.user.id);

    const order = await first('SELECT * FROM orders WHERE id = ? AND technician_id = ?', [id, technician.id]);
    if (!order) throw notFound('Pesanan tidak ditemukan.');
    if (!statusTransitions[order.status].includes(data.status)) {
      throw badRequest(`Status tidak dapat diubah dari "${order.status}" ke "${data.status}".`);
    }

    await query('UPDATE orders SET status = ? WHERE id = ?', [data.status, id]);
    if (data.status === 'cancelled') {
      await query('UPDATE technicians SET slots_available = LEAST(slots_available + 1, 50) WHERE id = ?', [technician.id]);
    }
    res.json({ ok: true, status: data.status });
  }),
);

router.get(
  '/services',
  asyncHandler(async (req, res) => {
    const technician = await myTechnician(req.user.id);
    const rows = await query(
      'SELECT * FROM services WHERE technician_id = ? ORDER BY is_active DESC, price ASC, id ASC',
      [technician.id],
    );
    res.json({
      services: rows.map((row) => ({
        ...row,
        price: Number(row.price),
        is_active: Boolean(row.is_active),
        includes_parts: Boolean(row.includes_parts),
      })),
    });
  }),
);

router.post(
  '/services',
  asyncHandler(async (req, res) => {
    const data = parseBody(serviceSchema, req.body);
    const technician = await myTechnician(req.user.id);
    const result = await query(
      `INSERT INTO services
         (technician_id, name, description, price_type, includes_parts, price, estimated_minutes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        technician.id,
        data.name,
        data.description,
        data.priceType,
        data.includesParts ? 1 : 0,
        data.price,
        data.estimatedMinutes,
        data.isActive ? 1 : 0,
      ],
    );
    res.status(201).json({ id: result.insertId });
  }),
);

router.put(
  '/services/:id',
  asyncHandler(async (req, res) => {
    const data = parseBody(serviceSchema, req.body);
    const id = parseId(req.params.id);
    const technician = await myTechnician(req.user.id);
    const existing = await first('SELECT id FROM services WHERE id = ? AND technician_id = ?', [id, technician.id]);
    if (!existing) throw notFound('Layanan tidak ditemukan.');

    await query(
      `UPDATE services
          SET name = ?, description = ?, price_type = ?, includes_parts = ?, price = ?,
              estimated_minutes = ?, is_active = ?
        WHERE id = ? AND technician_id = ?`,
      [
        data.name,
        data.description,
        data.priceType,
        data.includesParts ? 1 : 0,
        data.price,
        data.estimatedMinutes,
        data.isActive ? 1 : 0,
        id,
        technician.id,
      ],
    );
    res.json({ ok: true });
  }),
);

router.delete(
  '/services/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const technician = await myTechnician(req.user.id);
    const existing = await first('SELECT id FROM services WHERE id = ? AND technician_id = ?', [id, technician.id]);
    if (!existing) throw notFound('Layanan tidak ditemukan.');
    await query('DELETE FROM services WHERE id = ? AND technician_id = ?', [id, technician.id]);
    res.json({ ok: true });
  }),
);

export default router;
