import express, { Express } from 'express';
import path from 'path';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import router from './routes/index.js';
import cookieParser from 'cookie-parser';
import fs from 'fs';

dotenv.config();

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const app: Express = express();
const isProd = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────
// Basic hardening + bot probe blocker
// ─────────────────────────────────────────────────────────────
app.disable('x-powered-by');

app.use((req, res, next): void => {
  const blockedPaths: string[] = [
    '/wp-includes/',
    '/xmlrpc.php',
    '/wp/',
    '/blog/',
    '/wordpress/',
    '/cms/',
    '/site/',
    '/sito/',
    '/shop/',
    '/wp1/',
    '/wp2/',
    '/media/',
    '/news/',
    '/2018/',
    '/2019/',
    '/2020/',
    '/test/',
    '/wlwmanifest.xml',
  ];

  if (blockedPaths.some((p) => req.url.toLowerCase().includes(p))) {
    console.warn(`🛑 Blocked bot probe: ${req.method} ${req.url} from ${req.ip}`);
    res.status(404).send('Not Found');
    return;
  }

  next();
});

// ─────────────────────────────────────────────────────────────
// Helmet (prod-strict, dev-permissive for Vite/HMR + reCAPTCHA)
// ─────────────────────────────────────────────────────────────
const googleHosts = [
  'https://www.google.com',
  'https://www.gstatic.com',
  'https://recaptcha.google.com',
  'https://www.recaptcha.net',
];
const viteDev = ['http://localhost:5173', 'ws://localhost:5173', 'ws://localhost:5174'];

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "object-src": ["'none'"],
        "frame-ancestors": [
          "'self'",
          'https://www.oneguyproductions.com',
        ],
        "script-src": [
          "'self'",
          ...(isProd ? [] : ["'unsafe-eval'"]), // allow eval only in dev for Vite
          ...googleHosts,
        ],
        "script-src-elem": [
          "'self'",
          ...googleHosts,
        ],
        "worker-src": ["'self'", "blob:", ...googleHosts],
        "connect-src": [
          "'self'",
          ...googleHosts,
          'https://api.resend.com',
          'https://www.oneguyproductions.com',
          ...(isProd ? [] : viteDev),
        ],
        "frame-src": [
          "'self'",
          ...googleHosts,
          'https://www.cvitaepro.com',
          'https://www.careergistpro.com',
          'https://careergistpro.com',
          'https://www.pydatapro.com',
          'https://www.leaseclaritypro.com',
        ],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://www.gravatar.com",
          "https://secure.gravatar.com",
          ...googleHosts,
        ],
        "style-src": ["'self'", "'unsafe-inline'"],
        "font-src": ["'self'", "data:"],
        ...(isProd ? { "upgrade-insecure-requests": [] } : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: isProd
      ? { maxAge: 15552000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ─────────────────────────────────────────────────────────────
// Parsers & cookies
// ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────
// API routes
// ─────────────────────────────────────────────────────────────
app.use('/api', router);

// ─────────────────────────────────────────────────────────────
// Static SPA + fallback
// ─────────────────────────────────────────────────────────────
const clientBuildPath: string = path.resolve(__dirname, '../../Client/dist');
const indexHtmlPath: string = path.join(clientBuildPath, 'index.html');

if (!fs.existsSync(clientBuildPath)) {
  console.error('❌ Client build path not found:', clientBuildPath);
}

app.use(express.static(clientBuildPath));

app.use((req, res, next): void => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/uploads') ||
    req.path === '/favicon.ico'
  ) {
    next();
    return;
  }

  res.sendFile(indexHtmlPath, (err: Error): void => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

export default app;
