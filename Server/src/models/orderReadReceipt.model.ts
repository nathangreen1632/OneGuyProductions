import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export interface OrderReadReceiptAttributes {
  id: number;
  orderId: number;
  userId: number;
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type OrderReadReceiptCreationAttributes = Optional<
  OrderReadReceiptAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'lastReadAt'
>;

export class OrderReadReceiptModel
  extends Model<OrderReadReceiptAttributes, OrderReadReceiptCreationAttributes>
  implements OrderReadReceiptAttributes {
  declare id: number;
  declare orderId: number;
  declare userId: number;
  declare lastReadAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

OrderReadReceiptModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'orders', key: 'id' },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    lastReadAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'OrderReadReceipt', tableName: 'orderReadReceipts', timestamps: true }
);
