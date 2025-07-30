import express, { Express } from 'express';
import path from 'path';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import router from './routes/index.js';

dotenv.config();

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const app: Express = express();

app.disable('x-powered-by');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
      objectSrc: ["'none'"],
      frameSrc: [
        "'self'",
        'https://www.google.com',
        'https://www.gstatic.com',
        'https://www.cvitaepro.com',
        'https://www.careergistpro.com',
        'https://www.pydatapro.com',
        'https://www.leaseclaritypro.com',
      ],
      connectSrc: [
        "'self'",
        'https://www.google.com',
        'https://api.resend.com',
      ],
      // ✅ Safe clickjacking protection (allowing embedding by your own apps)
      frameAncestors: ["'self'", 'https://www.oneguyproductions.com'],
      // ✅ This upgrades mixed content to HTTPS without blocking
      upgradeInsecureRequests: [],
    },
    useDefaults: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

const clientBuildPath: string =
  process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../Client/dist')
    : path.join(__dirname, '../../Client/dist');

const indexHtmlPath: string = path.join(clientBuildPath, 'index.html');

console.log('📦 Serving frontend from:', clientBuildPath);

app.use(express.static(clientBuildPath));

app.use((req, res, next): void => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/uploads') ||
    req.path === '/favicon.ico'
  ) {
    return next();
  }
  res.sendFile(indexHtmlPath, (err: Error): void => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

export default app;
