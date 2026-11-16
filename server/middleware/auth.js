import { first } from '../db.js';
import { forbidden, unauthorized } from '../lib/http.js';

/** Muat ulang pengguna dari database agar perubahan peran/status langsung berlaku. */
export async function attachUser(req, _res, next) {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) return next();

    const user = await first(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, t.id AS technician_id
         FROM users u
         LEFT JOIN technicians t ON t.user_id = u.id
        WHERE u.id = ?`,
      [sessionUser.id],
    );

    if (!user || user.status !== 'active') {
      req.session.destroy(() => {});
      return next();
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  return next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    return next();
  };
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    technicianId: user.technician_id ?? null,
  };
}
