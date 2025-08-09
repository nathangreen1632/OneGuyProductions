import { sequelize } from '../config/db.config.js';
import { User, initUserModel } from './user.model.js';
import { OrderModel as Order } from './order.model.js';
import { OrderUpdateModel as OrderUpdate } from './orderUpdate.model.js';
import { OrderReadReceiptModel as OrderReadReceipt } from './orderReadReceipt.model.js';
import { OtpToken } from './otpToken.model.js';

initUserModel(sequelize);

// customers ↔ orders
User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

// admins ↔ assigned orders
User.hasMany(Order, { foreignKey: 'assignedAdminId', as: 'assignedOrders' });
Order.belongsTo(User, { foreignKey: 'assignedAdminId', as: 'assignedAdmin' });

// orders ↔ updates
Order.hasMany(OrderUpdate, { foreignKey: 'orderId', as: 'updates' });
OrderUpdate.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// author ↔ updates
User.hasMany(OrderUpdate, { foreignKey: 'authorUserId', as: 'authoredUpdates' });
OrderUpdate.belongsTo(User, { foreignKey: 'authorUserId', as: 'author' });

// orders ↔ read receipts
Order.hasMany(OrderReadReceipt, { foreignKey: 'orderId', as: 'readReceipts' });
OrderReadReceipt.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// user ↔ read receipts
User.hasMany(OrderReadReceipt, { foreignKey: 'userId', as: 'orderReadReceipts' });
OrderReadReceipt.belongsTo(User, { foreignKey: 'userId', as: 'reader' });

export { sequelize, User, Order, OrderUpdate, OrderReadReceipt, OtpToken };
