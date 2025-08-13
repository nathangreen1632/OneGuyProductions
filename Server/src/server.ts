import app from './app.js';
import { sequelize } from './config/db.config.js';
import { loggerConfig } from './config/logger.config.js';
import './models/index.js';
import './models/order.model.js';
import './models/user.model.js';
import './models/orderUpdate.model.js';
import './models/otpToken.model.js';
import {EnvConfig} from "./config/env.config.js";

const PORT: number = parseInt(EnvConfig.PORT ?? '3001', 10);

const ENABLE_DB_SYNC: boolean = process.env.ENABLE_DB_SYNC === 'true';

async function startServer(): Promise<void> {
  try {
    if (ENABLE_DB_SYNC) {
      loggerConfig.warn('⚠️ DB sync ENABLED: Running sequelize.sync({ alter: true })…');
      await sequelize.sync({ alter: false });
      loggerConfig.info('✅ DB sync complete.');
    } else {
      loggerConfig.info('DB sync skipped. Using migrations / existing schema.');
    }

    app.listen(PORT, (): void => {
      loggerConfig.info(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    loggerConfig.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}


await startServer();
