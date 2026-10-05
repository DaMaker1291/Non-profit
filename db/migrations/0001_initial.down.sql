-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_initial (down) — remove everything 0001_initial.up.sql created.
--
-- CHILDREN FIRST. Every table below references another (classes → users,
-- class_members → classes, assignment_results → assignments) or is referenced BY
-- one, so the order is the reverse of creation rather than alphabetical. Dropped
-- in any other order PostgreSQL either refuses (a live foreign key) or silently
-- cascades a table this migration does not own.
--
-- IF EXISTS on every statement so a half-applied 0001 can still be reversed: a
-- migration that failed midway is exactly when you need the down path to work,
-- and a down that aborts on the first missing object leaves the database in the
-- state the failure produced.
--
-- WHAT THIS DESTROYS. Every learner account, every profile, the whole evidence
-- ledger and every projection. There is no soft delete here and there is no
-- recovery inside this file — the recovery path is the backup that ran BEFORE
-- the migration (docs/DEPLOYMENT.md §4), and `scripts/migrate.mjs down` refuses
-- to run against a production-shaped environment for exactly that reason.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS ai_audit;
DROP TABLE IF EXISTS ai_sessions;
DROP TABLE IF EXISTS packs;
DROP TABLE IF EXISTS personal_papers;
DROP TABLE IF EXISTS papers;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS assignment_results;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS class_members;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS offline_sync;
DROP TABLE IF EXISTS learner_projections;
DROP TABLE IF EXISTS evidence_events;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;
