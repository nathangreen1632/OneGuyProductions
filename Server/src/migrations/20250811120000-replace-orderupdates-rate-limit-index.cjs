'use strict';

/**
 * Replaces the unique index enforcing one update per (orderId, authorUserId, minute)
 * with a version that buckets by SECOND instead.
 *
 * Old:  UNIQUE (orderId, authorUserId, minute_bucket_utc("createdAt"))
 * New:  UNIQUE (orderId, authorUserId, date_trunc('second', "createdAt" AT TIME ZONE 'UTC'))
 *
 * Notes:
 * - Keeps protection but much less aggressive than per-minute.
 * - Down migration restores the original minute-level index.
 */

module.exports = {
    /** @param {import('sequelize').QueryInterface} queryInterface */
    up: async (queryInterface /*, Sequelize */) => {
        // Drop the old minute-based index if it exists
        await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'idx_orderupdates_rate_limit'
        ) THEN
          DROP INDEX public.idx_orderupdates_rate_limit;
        END IF;
      END$$;
    `);

        // Create the new second-based unique index
        await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX idx_orderupdates_rate_limit_sec
        ON "orderUpdates" (
          "orderId",
          "authorUserId",
          (date_trunc('second', "createdAt" AT TIME ZONE 'UTC'))
        );
    `);
    },

    /** @param {import('sequelize').QueryInterface} queryInterface */
    down: async (queryInterface /*, Sequelize */) => {
        // Drop the second-based index if it exists
        await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'idx_orderupdates_rate_limit_sec'
        ) THEN
          DROP INDEX public.idx_orderupdates_rate_limit_sec;
        END IF;
      END$$;
    `);

        // Recreate the original minute-based unique index
        // Assumes function minute_bucket_utc(timestamptz) still exists in DB.
        await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX idx_orderupdates_rate_limit
        ON "orderUpdates" (
          "orderId",
          "authorUserId",
          (minute_bucket_utc("createdAt"))
        );
    `);
    }
};
