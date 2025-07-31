import dotenv from 'dotenv';
dotenv.config();
import { Sequelize } from 'sequelize';



if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not defined in the environment variables.');
  process.exit(1);
}

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});
