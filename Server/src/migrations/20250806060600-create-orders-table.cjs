'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('orders', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            businessName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            projectType: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            budget: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            timeline: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            customerId: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                field: 'customerId',
                references: {
                    model: 'users', // name of the target table
                    key: 'id',      // key in the target table
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            status: {
                type: Sequelize.ENUM(
                    'pending',
                    'in-progress',
                    'needs-feedback',
                    'complete',
                    'cancelled'
                ),
                allowNull: false,
                defaultValue: 'pending',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('orders');
    },
};
