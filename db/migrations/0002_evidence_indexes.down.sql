-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_evidence_indexes (down) — remove the guards, the function and the indexes.
--
-- The triggers go FIRST. Dropping the function while a trigger still calls it is
-- refused by PostgreSQL, and dropping the table's indexes before its guards would
-- leave a window in which the ledger is editable. Order is not cosmetic here.
--
-- No data is touched by this file, in either direction: 0002 is indexes and a
-- rule, not a rewrite. If this down path ever needs to change a row, the change
-- belongs in its own data migration with its own recovery note, not hidden inside
-- something named "indexes".
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS evidence_events_no_truncate ON evidence_events;
DROP TRIGGER IF EXISTS evidence_events_no_update ON evidence_events;
DROP FUNCTION IF EXISTS evidence_events_reject_mutation();

DROP INDEX IF EXISTS evidence_events_replay_idx;
DROP INDEX IF EXISTS evidence_events_concept_idx;
DROP INDEX IF EXISTS evidence_events_answers_idx;
DROP INDEX IF EXISTS evidence_events_question_idx;
DROP INDEX IF EXISTS evidence_events_tags_idx;
DROP INDEX IF EXISTS evidence_events_recent_idx;
DROP INDEX IF EXISTS evidence_events_learner_idx;
DROP INDEX IF EXISTS learner_projections_stale_idx;
DROP INDEX IF EXISTS offline_sync_device_idx;
DROP INDEX IF EXISTS offline_sync_outcome_idx;
