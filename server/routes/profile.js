import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { first, query } from '../db.js';
import { asyncHandler, badRequest, parseBody } from '../lib/http.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
import { nameField, phoneField, passwordField } from '../lib/fields.js';

const router = Router();
router.use(requireAuth);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseBody(z.object({ name: nameField, phone: phoneField }), req.body);
    await query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [data.name, data.phone, req.user.id]);
    const user = await first(
      'SELECT id, name, email, phone, role, status FROM users WHERE id = ?',
      [req.user.id],
    );
    res.json({ user: publicUser(user) });
  }),
);

router.put(
  '/password',
  asyncHandler(async (req, res) => {
    const data = parseBody(
      z.object({
        currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi.'),
        newPassword: passwordField,
      }),
      req.body,
    );
    const user = await first('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const matches = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!matches) throw badRequest('Kata sandi saat ini salah.');
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [
      await bcrypt.hash(data.newPassword, 12),
      req.user.id,
    ]);
    res.json({ ok: true });
  }),
);

export default router;
