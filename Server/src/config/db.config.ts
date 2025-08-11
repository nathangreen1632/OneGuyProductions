import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import {EnvConfig} from "./env.config.js";

function createSequelizeInstance(): Sequelize {
  const dbUrl: string | undefined = EnvConfig.DATABASE_URL;

  if (!dbUrl) {
    console.warn('⚠️ DATABASE_URL not defined. Falling back to in-memory SQLite.');
    return new Sequelize('sqlite::memory:');
  }

  try {
    return new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });
  } catch (err) {
    console.error('❌ Failed to connect with DATABASE_URL. Using in-memory fallback.');
    console.error(err);
    return new Sequelize('sqlite::memory:');
  }
}

export const sequelize: Sequelize = createSequelizeInstance();
