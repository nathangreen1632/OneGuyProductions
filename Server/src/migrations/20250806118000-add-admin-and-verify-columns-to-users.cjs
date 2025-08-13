'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'role', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'user',
        });
        await queryInterface.addColumn('users', 'emailVerified', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
        await queryInterface.addColumn('users', 'adminCandidateAt', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'adminVerifiedAt', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'role');
        await queryInterface.removeColumn('users', 'emailVerified');
        await queryInterface.removeColumn('users', 'adminCandidateAt');
        await queryInterface.removeColumn('users', 'adminVerifiedAt');
    }
};
