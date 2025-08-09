'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const q = queryInterface.sequelize;

        // Helper: run raw SQL but never throw (keeps deploy resilient)
        const safeQuery = async (sql, label) => {
            try { await q.query(sql); } catch (err) { console.error(`${label} failed`, err); }
        };

        // Add column if missing
        try {
            const desc = await queryInterface.describeTable('orders');
            if (!Object.hasOwn(desc, 'assignedAdminId')) {
                await queryInterface.addColumn('orders', 'assignedAdminId', {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'SET NULL',
                });
            }
        } catch (err) {
            console.error('describe/addColumn orders.assignedAdminId failed', err);
        }

        // Add FK constraint only if it doesn’t exist
        await safeQuery(
            `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'orders_assigned_admin_fk'
        ) THEN
          ALTER TABLE public.orders
            ADD CONSTRAINT orders_assigned_admin_fk
            FOREIGN KEY ("assignedAdminId") REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;
      END $$;
      `,
            'ensure FK orders_assigned_admin_fk'
        );
    },

    async down(queryInterface /*, Sequelize */) {
        // Best‑effort rollback: drop column (constraint drops with it)
        try {
            await queryInterface.removeColumn('orders', 'assignedAdminId');
        } catch (err) {
            console.error('removeColumn orders.assignedAdminId failed', err);
        }
    },
};
