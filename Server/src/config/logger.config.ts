import fs from 'node:fs';
import path from 'node:path';
import { createLogger, transports, format, type Logger } from 'winston';

const logDir: string = path.resolve(process.cwd(), 'logs');
try { fs.mkdirSync(logDir, { recursive: true }); } catch { }

export const loggerConfig: Logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.simple()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logDir, 'server.log') }),
  ],
});
