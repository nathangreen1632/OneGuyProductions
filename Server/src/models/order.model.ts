import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

// Step 1: Define the shape of a saved order
export interface OrderAttributes {
  id: number;
  name: string;
  email: string;
  businessName?: string;
  projectType: string;
  budget: string;
  timeline?: string;
  description: string;
}

// Step 2: Define the shape of a new order (no `id` yet)
export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id'> {}

// Step 3: Extend the Sequelize model type with both interfaces
export interface OrderInstance
  extends Model<OrderAttributes, OrderCreationAttributes>,
    OrderAttributes {}

// Step 4: Define the model and include the missing `id` field
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
    timeline: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT, allowNull: false },
  }
);
