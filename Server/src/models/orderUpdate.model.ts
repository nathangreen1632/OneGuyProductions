import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export interface OrderUpdateAttributes {
  id: number;
  orderId: number;

  authorUserId: number | null;
  body: string | null;
  source: 'web' | 'email' | 'system';          // VARCHAR(20) in DB
  eventType: 'comment' | 'status' | 'email';    // VARCHAR(20) in DB
  requiresCustomerResponse: boolean;
  editedAt: Date | null;

  // legacy columns still in table
  user?: string | null;
  message?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export type OrderUpdateCreationAttributes = Optional<
  OrderUpdateAttributes,
  'id' | 'authorUserId' | 'body' | 'editedAt' | 'user' | 'message' | 'createdAt' | 'updatedAt'
>;

export class OrderUpdateModel
  extends Model<OrderUpdateAttributes, OrderUpdateCreationAttributes>
  implements OrderUpdateAttributes {
  declare id: number;
  declare orderId: number;
  declare authorUserId: number | null;
  declare body: string | null;
  declare source: 'web' | 'email' | 'system';
  declare eventType: 'comment' | 'status' | 'email';
  declare requiresCustomerResponse: boolean;
  declare editedAt: Date | null;
  declare user?: string | null;
  declare message?: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  get displayBody(): string {
    return (this.getDataValue('body') ?? this.getDataValue('message') ?? '').trim();
  }
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
    body: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'web' },       // ✅ STRING(20)
    eventType: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'comment' },// ✅ STRING(20)
    requiresCustomerResponse: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    editedAt: { type: DataTypes.DATE, allowNull: true },

    // legacy
    user: { type: DataTypes.STRING, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },

    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'OrderUpdate',
    tableName: 'orderUpdates',
    timestamps: true,
    hooks: {
      beforeCreate(instance: OrderUpdateModel) {
        if (!instance.getDataValue('body') && instance.getDataValue('message')) {
          instance.setDataValue('body', instance.getDataValue('message')!);
        }
        if (!instance.getDataValue('source')) instance.setDataValue('source', 'web');
        if (!instance.getDataValue('eventType')) instance.setDataValue('eventType', 'comment');
      },
    },
  }
);
