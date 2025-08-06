import { sequelize } from '../config/db.config.js';

import { User, initUserModel } from './user.model.js';
import { OrderModel } from './order.model.js';
import { OrderUpdateModel } from './update.model.js';
import { OtpToken } from './otpToken.model.js'; // optional

// 🧱 Initialize all models
initUserModel(sequelize);

// 🔗 Setup associations

// User → Order (1:M)
User.hasMany(OrderModel, {
  foreignKey: 'customerId',
  as: 'orders',
});
OrderModel.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer',
});

// Order → OrderUpdate (1:M)
OrderModel.hasMany(OrderUpdateModel, {
  foreignKey: 'orderId',
  as: 'updates',
});
OrderUpdateModel.belongsTo(OrderModel, {
  foreignKey: 'orderId',
});

// ✅ Export models with aliases that match your usage
export {
  sequelize,
  User,
  OrderModel as Order,
  OrderUpdateModel as OrderUpdate,
  OtpToken,
};
