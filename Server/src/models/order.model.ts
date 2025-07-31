import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface OrderAttributes {
  id: number;
  name: string;
  email: string;
  businessName?: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id'> {}

export interface OrderInstance
  extends Model<OrderAttributes, OrderCreationAttributes>,
    OrderAttributes {}

export const OrderModel = sequelize.define<OrderInstance>(
  'orders',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    businessName: { type: DataTypes.STRING },
    projectType: { type: DataTypes.STRING, allowNull: false },
    budget: { type: DataTypes.STRING, allowNull: false },
    timeline: { type: DataTypes.STRING, allowNull: false},
    description: { type: DataTypes.TEXT, allowNull: false },
  }
);
