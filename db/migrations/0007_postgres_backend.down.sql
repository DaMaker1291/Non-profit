-- ─────────────────────────────────────────────────────────────────────────────
-- 0007_postgres_backend (reversal).
--
-- WHAT THIS REVERSES, AND THE TWO THINGS IT DELIBERATELY DOES NOT.
--
-- Reversed: the four new account columns' siblings (all eight), the reset-key
-- index, the erasure log's `kind`/`of_at`, and the three tables added for the
-- content-review and lesson-review ledgers.
--
-- NOT reversed, on purpose, and stated rather than silently skipped:
--
--   · `classes.payload` STAYS. Dropping it would destroy every stored class
--     roster — the down direction exists so a bad release can be rolled back, not
--     so it can delete a school's classes on the way.
--   · The `owner_id` foreign keys STAY DROPPED. Re-adding them would refuse the
--     first anonymous learner's paper and would restore a CASCADE that destroys a
--     learner's marked work behind the application's back — the defect 0007
--     removed. A rollback that reinstates it would make the rollback itself the
--     incident. `db:verify` asserts the constraint is absent, so a fork that
--     wants it back has to change the check deliberately too.
--
-- The account columns are safe to drop: they hold credentials, and a rollback
-- removes the feature that reads them (a recovery code that survives a rollback
-- has nothing left to read it).
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS lesson_improvement_tasks;
DROP TABLE IF EXISTS lesson_reviews;
DROP TABLE IF EXISTS content_reviews;

DROP INDEX IF EXISTS erasures_kind_idx;
ALTER TABLE erasures DROP CONSTRAINT IF EXISTS erasures_kind_known;
ALTER TABLE erasures DROP COLUMN IF EXISTS of_at;
ALTER TABLE erasures DROP COLUMN IF EXISTS kind;

DROP INDEX IF EXISTS users_reset_key_idx;
ALTER TABLE users
  DROP COLUMN IF EXISTS verify_expires_at,
  DROP COLUMN IF EXISTS verify_hash,
  DROP COLUMN IF EXISTS verify_salt,
  DROP COLUMN IF EXISTS reset_expires_at,
  DROP COLUMN IF EXISTS reset_hash,
  DROP COLUMN IF EXISTS reset_salt,
  DROP COLUMN IF EXISTS recovery_hash,
  DROP COLUMN IF EXISTS recovery_salt;
