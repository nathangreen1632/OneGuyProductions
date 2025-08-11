'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // use one transaction so we can't end up half-migrated
        await queryInterface.sequelize.transaction(async (t) => {
            const q = queryInterface.sequelize;

            // 1) Archive the legacy values so we never lose data
            await q.query(`
        CREATE TABLE IF NOT EXISTS "orderUpdates_legacy" (
          "id" INTEGER PRIMARY KEY,
          "user" TEXT,
          "message" TEXT,
          "archivedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `, { transaction: t });

            // Copy rows that have any legacy data
            await q.query(`
        INSERT INTO "orderUpdates_legacy" ("id","user","message")
        SELECT ou."id", ou."user", ou."message"
        FROM "orderUpdates" ou
        WHERE ou."user" IS NOT NULL OR ou."message" IS NOT NULL
        ON CONFLICT ("id") DO NOTHING;
      `, { transaction: t });

            // 2) Make sure body is populated everywhere (defensive)
            await q.query(`
        UPDATE "orderUpdates"
           SET "body" = COALESCE("body","message")
         WHERE "body" IS NULL;
      `, { transaction: t });

            // 3) Enforce NOT NULL on body now that it's backfilled
            await queryInterface.changeColumn('orderUpdates', 'body', {
                type: Sequelize.TEXT,
                allowNull: false,
            }, { transaction: t });

            // 4) Drop legacy columns
            await queryInterface.removeColumn('orderUpdates', 'user', { transaction: t });
            await queryInterface.removeColumn('orderUpdates', 'message', { transaction: t });

            // Optional: if you want to keep the archive around permanently, do nothing.
            // If you prefer to keep it only during this release, you could drop it in a later migration.
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (t) => {
            const q = queryInterface.sequelize;

            // 1) Re-add legacy columns (nullable first to backfill safely)
            await queryInterface.addColumn('orderUpdates', 'user', {
                type: Sequelize.STRING,
                allowNull: true,
            }, { transaction: t });

            await queryInterface.addColumn('orderUpdates', 'message', {
                type: Sequelize.TEXT,
                allowNull: true,
            }, { transaction: t });

            // 2) If archive exists, backfill from it
            await q.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema='public' AND table_name='orderUpdates_legacy'
          ) THEN
            UPDATE "orderUpdates" ou
               SET "user" = ol."user",
                   "message" = ol."message"
              FROM "orderUpdates_legacy" ol
             WHERE ol."id" = ou."id";
          END IF;
        END
        $$;
      `, { transaction: t });

            // 3) Restore original NOT NULL constraints
            await queryInterface.changeColumn('orderUpdates', 'user', {
                type: Sequelize.STRING,
                allowNull: false,
            }, { transaction: t });

            await queryInterface.changeColumn('orderUpdates', 'message', {
                type: Sequelize.TEXT,
                allowNull: false,
            }, { transaction: t });

            // 4) Body can be nullable again (to match original pre-cleanup state)
            await queryInterface.changeColumn('orderUpdates', 'body', {
                type: Sequelize.TEXT,
                allowNull: true,
            }, { transaction: t });

            // Leave the archive table as-is (it’s harmless). If you want to clean it, uncomment:
            // await q.query('DROP TABLE IF EXISTS "orderUpdates_legacy";', { transaction: t });
        });
    }
};
