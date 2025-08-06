// Server/src/server.ts

import './config/dotenv.config.js';
import app from './app.js';
import { sequelize } from './config/db.config.js';
import { loggerConfig } from './config/logger.config.js';
import './models/index.js';
import './models/order.model.js';
import './models/user.model.js';
import './models/update.model.js';
import './models/otpToken.model.js';

const PORT: number = parseInt(process.env.PORT ?? '3001', 10);

async function startServer(): Promise<void> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // Only for dev emergencies:
      await sequelize.sync({ alter: true });
      loggerConfig.info('✅ Skipping sync: models assumed to be up-to-date.');
    } else {
      // Use migrations in production
      loggerConfig.info('✅ Skipping sync: running in production.');
    }


    app.listen(PORT, () => {
      loggerConfig.info(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    loggerConfig.error('❌ Failed to sync database or start server:', error);
    process.exit(1);
  }
}

await startServer();
