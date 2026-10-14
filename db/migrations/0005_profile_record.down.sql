-- ─────────────────────────────────────────────────────────────────────────────
-- 0005_profile_record — reversal.
--
-- The column is not derived from any other table and holds no copy the schema
-- keeps elsewhere, so dropping it is lossless in the schema's own terms. It is
-- the ONLY statement that needs reversing here, and the ledger row is removed by
-- the runner (`scripts/migrate.mjs#down`), so nothing is left claiming this
-- migration ran.
--
-- What a reversal DOES cost, stated rather than hidden: if this migration has
-- been applied to a database that is serving, the learners' declared records live
-- only in this column, so reverting drops them. That is why slice 5 of
-- docs/STORAGE_SPEC.md is the import/export/cutover/rollback drill — and why a
-- deployment reverses this file only against an archive, never in place on live
-- learner data.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles DROP COLUMN payload;
