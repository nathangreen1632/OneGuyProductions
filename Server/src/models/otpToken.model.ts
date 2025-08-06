import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export interface OtpTokenAttributes {
  id: number;
  email: string;
  otpHash: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OtpTokenCreationAttributes
  extends Optional<OtpTokenAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface OtpTokenInstance
  extends Model<OtpTokenAttributes, OtpTokenCreationAttributes>,
    OtpTokenAttributes {}

export const OtpToken = sequelize.define<OtpTokenInstance>(
  'otp_tokens',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otpHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'otp_tokens',
    modelName: 'OtpToken',
    timestamps: true,
  }
);
