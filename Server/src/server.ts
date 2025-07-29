import './config/dotenv.js';
import app from './app.js';
import { sequelize } from './config/db.js';
import { logger } from './config/logger.js';

const PORT: string | 3001 = process.env.PORT ?? 3001;

sequelize.sync().then((): void => {
  logger.info('Database synced');
  app.listen(PORT, () => logger.info(`Server running at http://localhost:${PORT}`));
});
