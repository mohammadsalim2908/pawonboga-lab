import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query, first, transaction } from '../db.js';
import { asyncHandler, badRequest, conflict, notFound, parseBody, parseId } from '../lib/http.js';
import { requireRole } from '../middleware/auth.js';
import { textField, optionalText } from '../lib/fields.js';

const router = Router();

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak pesanan dibuat. Coba lagi nanti.' },
});

const createSchema = z.object({
  technicianId: z.coerce.number().int().positive('Teknisi tidak valid.'),
  serviceId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  mode: z.enum(['home', 'workshop'], { errorMap: () => ({ message: 'Mode layanan tidak valid.' }) }),
  complaint: z.string().trim().max(1000, 'Keluhan maksimal 1000 karakter.').optional().default(''),
  address: z.string().trim().max(255, 'Alamat maksimal 255 karakter.').optional().default(''),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

const cancelSchema = z.object({ action: z.literal('cancel') });

export function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

export function buildWhatsAppUrl(order, mode) {
  const modeLabel = mode === 'home' ? 'Panggil ke Rumah' : 'Datang ke Bengkel';
  const lines = [
    '*Pesanan TekniKita*',
    `Kode: ${order.code}`,
    '',
    `Halo ${order.technician_name}, saya ${order.customer_name} ingin memesan jasa servis melalui TekniKita.`,
    '',
    `Layanan: ${order.service_name || 'Servis umum'}`,
    `Mode: ${modeLabel}`,
    order.scheduled_date ? `Jadwal: ${order.scheduled_date}` : null,
    order.customer_address ? `Alamat: ${order.customer_address}` : null,
    order.complaint ? `Keluhan: ${order.complaint}` : null,
    `Estimasi biaya: ${formatRupiah(order.estimated_total)}`,
    '',
    'Mohon konfirmasi ketersediaan dan jadwalnya. Terima kasih.',
  ].filter((line) => line !== null);

  const message = lines.join('\n');
  return {
    message,
    url: `https://wa.me/${String(order.technician_phone).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
  };
}

function generateCode() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const random = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `TK-${stamp}${random}`;
}

router.post(
  '/',
  requireRole('customer'),
  orderLimiter,
  asyncHandler(async (req, res) => {
    const data = parseBody(createSchema, req.body);

    if (data.mode === 'home' && data.address.trim().length < 5) {
      throw badRequest('Alamat / patokan wajib diisi untuk layanan panggil ke rumah.');
    }

    const order = await transaction(async (conn) => {
      const [techRows] = await conn.execute(
        `SELECT t.*, c.name AS category_name
           FROM technicians t JOIN categories c ON c.id = t.category_id
          WHERE t.id = ? AND t.is_verified = 1 FOR UPDATE`,
        [data.technicianId],
      );
      const technician = techRows[0];
      if (!technician) throw notFound('Teknisi tidak ditemukan atau belum terverifikasi.');
      if (Number(technician.slots_available) <= 0) throw conflict('Slot teknisi ini sudah penuh untuk hari ini.');

      let service = null;
      if (data.serviceId) {
        const [serviceRows] = await conn.execute(
          'SELECT * FROM services WHERE id = ? AND technician_id = ? AND is_active = 1',
          [data.serviceId, technician.id],
        );
        service = serviceRows[0];
        if (!service) throw badRequest('Layanan yang dipilih tidak tersedia pada teknisi ini.');
      }

      const basePrice = service ? Number(service.price) : Number(technician.tariff_start);
      const callFee = data.mode === 'home' ? Number(technician.call_fee) : 0;
      const estimatedTotal = basePrice + callFee;
      const code = generateCode();

      const [insert] = await conn.execute(
        `INSERT INTO orders
           (code, customer_id, technician_id, service_id, customer_name, customer_phone,
            technician_name, technician_phone, service_name, service_mode, complaint,
            customer_address, estimated_total, scheduled_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          req.user.id,
          technician.id,
          service?.id ?? null,
          req.user.name,
          req.user.phone,
          technician.business_name,
          technician.whatsapp_number,
          service?.name ?? `${technician.category_name} — servis umum`,
          data.mode,
          data.complaint,
          data.address,
          estimatedTotal,
          data.scheduledDate ?? null,
        ],
      );

      await conn.execute('UPDATE technicians SET slots_available = slots_available - 1 WHERE id = ?', [technician.id]);

      const [rows] = await conn.execute('SELECT * FROM orders WHERE id = ?', [insert.insertId]);
      return rows[0];
    });

    const whatsapp = buildWhatsAppUrl(order, data.mode);
    res.status(201).json({
      order: {
        ...order,
        estimated_total: Number(order.estimated_total),
      },
      whatsapp,
    });
  }),
);

router.get(
  '/mine',
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT o.*, c.name AS category_name, t.is_verified AS technician_verified
         FROM orders o
         LEFT JOIN technicians t ON t.id = o.technician_id
         LEFT JOIN categories c ON c.id = t.category_id
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT 100`,
      [req.user.id],
    );
    res.json({ orders: rows.map((row) => ({ ...row, estimated_total: Number(row.estimated_total) })) });
  }),
);

router.patch(
  '/:id/cancel',
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    parseBody(cancelSchema, req.body);
    const id = parseId(req.params.id);

    await transaction(async (conn) => {
      const [rows] = await conn.execute(
        'SELECT * FROM orders WHERE id = ? AND customer_id = ? FOR UPDATE',
        [id, req.user.id],
      );
      const order = rows[0];
      if (!order) throw notFound('Pesanan tidak ditemukan.');
      if (!['pending', 'confirmed'].includes(order.status)) {
        throw conflict('Pesanan pada status ini tidak dapat dibatalkan. Hubungi teknisi langsung.');
      }
      await conn.execute('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', id]);
      if (order.technician_id) {
        await conn.execute(
          'UPDATE technicians SET slots_available = LEAST(slots_available + 1, 50) WHERE id = ?',
          [order.technician_id],
        );
      }
    });

    res.json({ ok: true });
  }),
);

export default router;
