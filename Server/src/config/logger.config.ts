import { createLogger, transports, format, Logger } from 'winston';

export const loggerConfig: Logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.simple()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log' }),
  ],
});
