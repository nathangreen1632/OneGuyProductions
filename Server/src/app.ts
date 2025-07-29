import express, {Express} from 'express';
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


  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
      objectSrc: ["'none'"],
      frameSrc: ['https://www.google.com', 'https://www.gstatic.com'],
      connectSrc: [
        "'self'",
        'https://www.google.com',
        'https://api.resend.com', // Include if using Resend
      ],
      frameAncestors: ["'none'"], // ✅ Clickjacking protection
      upgradeInsecureRequests: [], // ✅ Mixed-content protection
    },
  });


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

const clientBuildPath: string = path.resolve(__dirname, '../../Client/dist');
const indexHtmlPath: string = path.join(clientBuildPath, 'index.html');

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
