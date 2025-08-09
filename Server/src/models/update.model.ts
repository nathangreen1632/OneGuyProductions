import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export interface OrderUpdateAttributes {
  id: number;
  orderId: number;
  user: string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderUpdateCreationAttributes
  extends Optional<OrderUpdateAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface OrderUpdateInstance
  extends Model<OrderUpdateAttributes, OrderUpdateCreationAttributes>,
    OrderUpdateAttributes {}

export const OrderUpdateModel = sequelize.define<OrderUpdateInstance>(
  'orderUpdates',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    modelName: 'OrderUpdate',
    tableName: 'orderUpdates',
    timestamps: true,
  }
);