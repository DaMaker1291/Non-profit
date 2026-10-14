-- ─────────────────────────────────────────────────────────────────────────────
-- 0004_port_gaps (reversal) — drop everything the up migration created, children
-- before parents, triggers before the function they use.
--
-- Nothing here changes an existing row, so this direction loses no learner data:
-- the erasure log is the one thing worth carrying out of the database before a
-- rollback (`npm run backup` on the file store; a `COPY erasures TO …` against a
-- Postgres deployment — docs/OPERATIONS.md §4), because a restore that loses the
-- log cannot know who asked to be forgotten.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS erasures_no_truncate ON erasures;
DROP TRIGGER IF EXISTS erasures_no_update ON erasures;
DROP INDEX IF EXISTS erasures_learner_idx;
DROP TABLE IF EXISTS erasures;

DROP FUNCTION IF EXISTS append_only_reject_mutation();

DROP INDEX IF EXISTS ai_cache_accessed_idx;
DROP TABLE IF EXISTS ai_cache;

DROP INDEX IF EXISTS interventions_owner_idx;
DROP INDEX IF EXISTS interventions_class_idx;
DROP INDEX IF EXISTS interventions_open_key;
DROP TABLE IF EXISTS interventions;
