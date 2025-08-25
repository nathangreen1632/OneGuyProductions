'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'items', {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
        });

        await queryInterface.addColumn('orders', 'taxRate', {
            type: Sequelize.DECIMAL(6, 4),
            allowNull: false,
            defaultValue: 0,
        });

        await queryInterface.addColumn('orders', 'discountCents', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        await queryInterface.addColumn('orders', 'shippingCents', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });
    },

    async down(queryInterface, Sequelize ) {
        await queryInterface.removeColumn('orders', 'items');
        await queryInterface.removeColumn('orders', 'taxRate');
        await queryInterface.removeColumn('orders', 'discountCents');
        await queryInterface.removeColumn('orders', 'shippingCents');
    },
};
