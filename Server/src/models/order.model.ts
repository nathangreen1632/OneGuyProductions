import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export interface OrderAttributes {
  id: number;
  name: string;
  email: string;
  businessName?: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
  customerId: number | null;
  assignedAdminId?: number | null;
  status?: 'pending' | 'in-progress' | 'needs-feedback' | 'complete' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;

  items: Array<{ description: string; quantity: number; unitPriceCents: number }>;
  taxRate: number | string;
  discountCents: number;
  shippingCents: number;
}

export interface OrderCreationAttributes
  extends Optional<
    OrderAttributes,
    | 'id'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'items'
    | 'taxRate'
    | 'discountCents'
    | 'shippingCents'
  > {}

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
    timeline: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    customerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'customerId',
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'in-progress',
        'needs-feedback',
        'complete',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    assignedAdminId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },

    items: {
      type: DataTypes.JSONB as unknown as typeof DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    taxRate: {
      type: DataTypes.DECIMAL(6, 4),
      allowNull: false,
      defaultValue: 0,
    },
    discountCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    shippingCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
  }
);
