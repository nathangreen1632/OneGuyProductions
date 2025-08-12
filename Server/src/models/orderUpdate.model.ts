import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export interface OrderUpdateAttributes {
  id: number;
  orderId: number;

  authorUserId: number | null;
  body: string; // now non-null in the DB + model
  source: 'web' | 'email' | 'system';
  eventType: 'comment' | 'status' | 'email';
  requiresCustomerResponse: boolean;
  editedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type OrderUpdateCreationAttributes = Optional<
  OrderUpdateAttributes,
  'id' | 'authorUserId' | 'editedAt' | 'createdAt' | 'updatedAt'
>;

export class OrderUpdateModel
  extends Model<OrderUpdateAttributes, OrderUpdateCreationAttributes>
  implements OrderUpdateAttributes {
  declare id: number;
  declare orderId: number;
  declare authorUserId: number | null;
  declare body: string;
  declare source: 'web' | 'email' | 'system';
  declare eventType: 'comment' | 'status' | 'email';
  declare requiresCustomerResponse: boolean;
  declare editedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

OrderUpdateModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'orders', key: 'id' },
      onDelete: 'CASCADE',
    },
    authorUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    body: { type: DataTypes.TEXT, allowNull: false }, // ⬅ aligned with migration
    source: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'web' },
    eventType: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'comment' },
    requiresCustomerResponse: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    editedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'OrderUpdate',
    tableName: 'orderUpdates',
    timestamps: true,
  }
);
