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

  const matched = blockedPaths.some((path) => req.url.toLowerCase().includes(path));
  if (matched) {
    console.warn(`🛑 Blocked bot probe: ${req.method} ${req.url} from ${req.ip}`);
    res.status(404).send('Not Found');
    return;
  }

  next();
});

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
        'https://careergistpro.com',
        'https://www.pydatapro.com',
        'https://www.leaseclaritypro.com',
      ],
      connectSrc: [
        "'self'",
        'https://www.google.com',
        'https://api.resend.com',
        'https://www.oneguyproductions.com',
      ],
      frameAncestors: ["'self'", 'https://www.oneguyproductions.com'],
      upgradeInsecureRequests: [],
    },
    useDefaults: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

const clientBuildPath: string = path.resolve(__dirname, '../../Client/dist');
const indexHtmlPath: string = path.join(clientBuildPath, 'index.html');

import fs from 'fs';
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
    return next();
  }
  res.sendFile(indexHtmlPath, (err: Error): void => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

export default app;
