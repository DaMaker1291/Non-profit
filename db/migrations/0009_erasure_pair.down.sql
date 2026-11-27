-- ─────────────────────────────────────────────────────────────────────────────
-- 0009_erasure_pair (reversal).
--
-- Restores `PRIMARY KEY (learner_id, erased_at)`. IT REFUSES ON A STORE THAT
-- HOLDS AN INSTRUCTION AND A COMPLETION AT THE SAME INSTANT — which is the
-- ordinary case, because the workflow finishes in one millisecond.
--
-- Nothing is deleted to make it fit: both rows are the erasure log, a restore is
-- what re-applies it, and a rollback that silently dropped one would make the
-- log disagree with the act it records. The operator's choice is to roll forward
-- or to resolve those pairs deliberately.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE erasures DROP CONSTRAINT IF EXISTS erasures_pkey;

ALTER TABLE erasures ADD CONSTRAINT erasures_pkey PRIMARY KEY (learner_id, erased_at);
