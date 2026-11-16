import { Router } from 'express';
import { query, first } from '../db.js';
import { asyncHandler, notFound, parseId } from '../lib/http.js';

const router = Router();

const SORTS = {
  recommended: 't.is_featured DESC, t.rating DESC, t.slots_available DESC, t.business_name ASC',
  cheapest: 't.tariff_start ASC, t.business_name ASC',
  expensive: 't.tariff_start DESC, t.business_name ASC',
  slots: 't.slots_available DESC, t.business_name ASC',
};

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    // scope=global → hanya kategori umum (dipakai form pendaftaran teknisi).
    // default → kategori yang dipakai teknisi terverifikasi (termasuk kategori pribadi).
    const globalOnly = req.query.scope === 'global';
    const rows = await query(
      `SELECT c.id, c.name, c.description, c.icon, c.sort_order, c.owner_user_id,
              (SELECT COUNT(*) FROM technicians t JOIN users u ON u.id = t.user_id
                WHERE t.category_id = c.id AND t.is_verified = 1 AND u.status = 'active') AS technician_count
         FROM categories c
        WHERE ${globalOnly ? 'c.owner_user_id IS NULL' : `
              c.owner_user_id IS NULL
              OR EXISTS (SELECT 1 FROM technicians t JOIN users u ON u.id = t.user_id
                          WHERE t.category_id = c.id AND t.is_verified = 1 AND u.status = 'active')`}
        ORDER BY c.sort_order ASC, c.name ASC`,
    );
    res.json({
      categories: rows.map((row) => ({
        ...row,
        technician_count: Number(row.technician_count),
        is_private: row.owner_user_id !== null,
      })),
    });
  }),
);

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const stats = await first(
      `SELECT
         (SELECT COUNT(*) FROM technicians t JOIN users u ON u.id = t.user_id
           WHERE t.is_verified = 1 AND u.status = 'active') AS total_technicians,
         (SELECT COALESCE(SUM(t.slots_available), 0) FROM technicians t JOIN users u ON u.id = t.user_id
           WHERE t.is_verified = 1 AND u.status = 'active') AS total_slots,
         (SELECT COUNT(*) FROM categories) AS total_categories,
         (SELECT COUNT(*) FROM orders) AS total_orders`,
    );
    res.json({
      totalTechnicians: Number(stats.total_technicians),
      totalSlots: Number(stats.total_slots),
      totalCategories: Number(stats.total_categories),
      totalOrders: Number(stats.total_orders),
    });
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const sortKey = SORTS[req.query.sort] ? req.query.sort : 'recommended';

    const params = [];
    const where = ["t.is_verified = 1", "u.status = 'active'"];

    if (q) {
      const like = `%${q}%`;
      where.push(`(
        t.business_name LIKE ? OR t.area LIKE ? OR t.address LIKE ? OR t.description LIKE ?
        OR c.name LIKE ? OR u.name LIKE ?
        OR EXISTS (SELECT 1 FROM services s WHERE s.technician_id = t.id AND s.is_active = 1 AND s.name LIKE ?)
      )`);
      params.push(like, like, like, like, like, like, like);
    }

    if (category && category !== 'all') {
      if (/^\d+$/.test(category)) {
        where.push('t.category_id = ?');
        params.push(Number(category));
      } else {
        where.push('c.name = ?');
        params.push(category);
      }
    }

    const rows = await query(
      `SELECT t.id, t.business_name, t.description, t.address, t.area, t.whatsapp_number,
              t.tariff_start, t.call_fee, t.slots_available, t.is_featured, t.is_verified, t.rating,
              t.category_id, c.name AS category_name, u.name AS owner_name,
              (SELECT COUNT(*) FROM services s WHERE s.technician_id = t.id AND s.is_active = 1) AS service_count
         FROM technicians t
         JOIN categories c ON c.id = t.category_id
         JOIN users u ON u.id = t.user_id
        WHERE ${where.join(' AND ')}
        ORDER BY ${SORTS[sortKey]}
        LIMIT 60`,
      params,
    );

    res.json({
      technicians: rows.map((row) => ({
        ...row,
        tariff_start: Number(row.tariff_start),
        call_fee: Number(row.call_fee),
        slots_available: Number(row.slots_available),
        is_featured: Boolean(row.is_featured),
        is_verified: Boolean(row.is_verified),
        rating: Number(row.rating),
        service_count: Number(row.service_count),
      })),
      sort: sortKey,
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const technician = await first(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, u.name AS owner_name, u.email AS owner_email
         FROM technicians t
         JOIN categories c ON c.id = t.category_id
         JOIN users u ON u.id = t.user_id
        WHERE t.id = ? AND t.is_verified = 1 AND u.status = 'active'`,
      [id],
    );
    if (!technician) throw notFound('Teknisi tidak ditemukan atau belum terverifikasi.');

    const services = await query(
      `SELECT id, name, description, price_type, includes_parts, price, estimated_minutes
         FROM services WHERE technician_id = ? AND is_active = 1
        ORDER BY (price_type = 'quote') ASC, price ASC, name ASC`,
      [id],
    );

    res.json({
      technician: {
        ...technician,
        tariff_start: Number(technician.tariff_start),
        call_fee: Number(technician.call_fee),
        slots_available: Number(technician.slots_available),
        is_featured: Boolean(technician.is_featured),
        is_verified: Boolean(technician.is_verified),
        rating: Number(technician.rating),
        password_hash: undefined,
      },
      services: services.map((s) => ({
        ...s,
        price: Number(s.price),
        includes_parts: Boolean(s.includes_parts),
      })),
    });
  }),
);

export default router;
