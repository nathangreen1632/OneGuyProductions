import { sequelize } from '../config/db.config.js';

import { User, initUserModel } from './user.model.js';
import { OrderModel } from './order.model.js';
import { OrderUpdateModel } from './update.model.js';
import { OtpToken } from './otpToken.model.js'; // optional

initUserModel(sequelize);

User.hasMany(OrderModel, {
  foreignKey: 'customerId',
  as: 'orders',
});
OrderModel.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer',
});

OrderModel.hasMany(OrderUpdateModel, {
  foreignKey: 'orderId',
  as: 'updates',
});
OrderUpdateModel.belongsTo(OrderModel, {
  foreignKey: 'orderId',
});

export {
  sequelize,
  User,
  OrderModel as Order,
  OrderUpdateModel as OrderUpdate,
  OtpToken,
};
