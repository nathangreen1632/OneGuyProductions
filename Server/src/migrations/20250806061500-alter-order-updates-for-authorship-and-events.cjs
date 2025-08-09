'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const q = queryInterface.sequelize;

        const safeQuery = async (sql, label) => {
            try { await q.query(sql); } catch (err) { console.error(`${label} failed`, err); }
        };

        const hasColumn = async (table, col) => {
            try {
                const desc = await queryInterface.describeTable(table);
                return Object.hasOwn(desc, col);
            } catch (err) {
                console.error(`describeTable(${table}) failed`, err);
                return false;
            }
        };

        const addColIfMissing = async (table, col, spec) => {
            try {
                if (!(await hasColumn(table, col))) {
                    await queryInterface.addColumn(table, col, spec);
                }
            } catch (err) {
                console.error(`addColumn ${table}.${col} failed`, err);
            }
        };

        // 1) New columns (safe if already present)
        await addColIfMissing('orderUpdates', 'authorUserId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
        });
        await addColIfMissing('orderUpdates', 'body', { type: Sequelize.TEXT, allowNull: true });
        await addColIfMissing('orderUpdates', 'source', {
            type: Sequelize.STRING(20),
            allowNull: false,
            defaultValue: 'web', // 'web' | 'email' | 'system'
        });
        await addColIfMissing('orderUpdates', 'eventType', {
            type: Sequelize.STRING(20),
            allowNull: false,
            defaultValue: 'comment', // 'comment' | 'status' | 'email'
        });
        await addColIfMissing('orderUpdates', 'requiresCustomerResponse', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
        await addColIfMissing('orderUpdates', 'editedAt', { type: Sequelize.DATE, allowNull: true });

        // 2) Backfill body from legacy "message"
        await safeQuery(
            'UPDATE "orderUpdates" SET "body" = COALESCE("body","message") WHERE "body" IS NULL;',
            'backfill body'
        );

        // 3) Ensure FK (idempotent)
        await safeQuery(
            `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'orderUpdates_author_fk'
        ) THEN
          ALTER TABLE public."orderUpdates"
            ADD CONSTRAINT "orderUpdates_author_fk"
            FOREIGN KEY ("authorUserId") REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;
      END $$;
      `,
            'ensure FK orderUpdates_author_fk'
        );

        // 4) Immutable minute-bucket helper + partial unique index
        await safeQuery(
            `
      CREATE OR REPLACE FUNCTION public.minute_bucket_utc(ts timestamptz)
      RETURNS bigint
      LANGUAGE sql
      IMMUTABLE
      AS $func$
        SELECT floor(extract(epoch FROM (ts AT TIME ZONE 'UTC'))/60)::bigint;
      $func$;
      `,
            'create minute_bucket_utc'
        );

        await safeQuery('DROP INDEX IF EXISTS idx_orderUpdates_rate_limit;', 'drop idx_orderUpdates_rate_limit');

        await safeQuery(
            `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname='public' AND indexname='idx_orderUpdates_rate_limit'
        ) THEN
          EXECUTE $sql$
            CREATE UNIQUE INDEX idx_orderUpdates_rate_limit
            ON public."orderUpdates" ("orderId","authorUserId", public.minute_bucket_utc("createdAt"))
            WHERE "eventType" = 'comment' AND "authorUserId" IS NOT NULL;
          $sql$;
        END IF;
      END $$;
      `,
            'create idx_orderUpdates_rate_limit'
        );
    },

    async down(queryInterface /*, Sequelize */) {
        const q = queryInterface.sequelize;
        const safeQuery = async (sql, label) => {
            try { await q.query(sql); } catch (err) { console.error(`${label} failed`, err); }
        };

        await safeQuery('DROP INDEX IF EXISTS idx_orderUpdates_rate_limit;', 'drop idx_orderUpdates_rate_limit');
        await safeQuery('DROP FUNCTION IF EXISTS public.minute_bucket_utc(timestamptz);', 'drop minute_bucket_utc');

        const dropCol = async (col) => {
            try { await queryInterface.removeColumn('orderUpdates', col); }
            catch (err) { console.error(`removeColumn orderUpdates.${col} failed`, err); }
        };
        await dropCol('editedAt');
        await dropCol('requiresCustomerResponse');
        await dropCol('eventType');
        await dropCol('source');
        await dropCol('body');
        await dropCol('authorUserId');
    },
};
