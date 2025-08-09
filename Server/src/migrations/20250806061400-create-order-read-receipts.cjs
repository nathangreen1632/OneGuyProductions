'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.createTable('orderReadReceipts', {
                id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
                orderId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'orders', key: 'id' },
                    onDelete: 'CASCADE',
                },
                userId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE',
                },
                lastReadAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
                updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            });

            await queryInterface.addConstraint('orderReadReceipts', {
                fields: ['orderId', 'userId'],
                type: 'unique',
                name: 'orderReadReceipts_order_user_uniq',
            });
        } catch (err) {
            console.error('create-order-read-receipts failed', err);
        }
    },

    async down(queryInterface) {
        try {
            await queryInterface.dropTable('orderReadReceipts');
        } catch (err) {
            console.error('drop orderReadReceipts failed', err);
        }
    },
};
