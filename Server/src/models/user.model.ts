import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'pending-admin' | 'admin'; // NEW
  emailVerified: boolean;                   // NEW
  adminCandidateAt: Date | null;             // NEW
  adminVerifiedAt: Date | null;              // NEW
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'emailVerified' | 'adminCandidateAt' | 'adminVerifiedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare role: 'user' | 'pending-admin' | 'admin';
  declare emailVerified: boolean;
  declare adminCandidateAt: Date | null;
  declare adminVerifiedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initUserModel(sequelize: Sequelize): void {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      adminCandidateAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      adminVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'users',
      modelName: 'User',
      timestamps: true,
    }
  );
}
