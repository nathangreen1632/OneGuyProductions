import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const OrderModel = sequelize.define('orders', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  businessName: { type: DataTypes.STRING },
  projectType: { type: DataTypes.STRING, allowNull: false },
  budget: { type: DataTypes.STRING, allowNull: false },
  timeline: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT, allowNull: false },
});
