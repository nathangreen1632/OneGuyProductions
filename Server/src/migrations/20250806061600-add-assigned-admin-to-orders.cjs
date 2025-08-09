'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.addColumn('orders', 'assignedAdminId', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onDelete: 'SET NULL',
            });
        } catch (err) {
            console.error('add assignedAdminId failed', err);
        }
    },

    async down(queryInterface) {
        try {
            await queryInterface.removeColumn('orders', 'assignedAdminId');
        } catch (err) {
            console.error('remove assignedAdminId failed', err);
        }
    },
};
