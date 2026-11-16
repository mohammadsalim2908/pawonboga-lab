import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config.js';
import { pool } from './db.js';
import { attachUser } from './middleware/auth.js';
import { asyncHandler, errorHandler } from './lib/http.js';
import authRouter from './routes/auth.js';
import catalogRouter from './routes/catalog.js';
import orderRouter from './routes/orders.js';
import technicianRouter from './routes/technician.js';
import adminRouter from './routes/admin.js';
import profileRouter from './routes/profile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'", 'https://*.style.dev', 'https://*.freebuff.com'],
      },
    },
    frameguard: false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
app.use(compression());
app.use(express.json({ limit: '200kb' }));

const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({
  ...config.db,
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: config.sessionMaxAgeMs,
});

app.use(
  session({
    name: 'teknikita.sid',
    secret: config.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProd,
      maxAge: config.sessionMaxAgeMs,
    },
  }),
);

// Proteksi CSRF ringan: permintaan pengubah data harus berasal dari origin yang sama.
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next();
  try {
    if (new URL(origin).host !== req.headers.host) {
      return res.status(403).json({ error: 'Permintaan lintas situs ditolak.' });
    }
  } catch {
    return res.status(403).json({ error: 'Origin permintaan tidak valid.' });
  }
  return next();
});

app.use(attachUser);

app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', orderRouter);
app.use('/api/technician', technicianRouter);
app.use('/api/admin', adminRouter);
app.use('/api/profile', profileRouter);

app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', env: config.env });
  }),
);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
});

app.use(
  express.static(publicDir, {
    extensions: ['html'],
    maxAge: config.isProd ? '1h' : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }),
);

app.get(['/login', '/register', '/dashboard'], (req, res) => {
  res.sendFile(path.join(publicDir, `${req.path.slice(1)}.html`));
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

app.use(errorHandler);

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`TekniKita berjalan di http://0.0.0.0:${config.port} (${config.env})`);
});

async function shutdown(signal) {
  console.log(`\n${signal} diterima, menutup server...`);
  server.close(async () => {
    await pool.end();
    await sessionStore.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
