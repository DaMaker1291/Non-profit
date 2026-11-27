-- ─────────────────────────────────────────────────────────────────────────────
-- 0008_evidence_source_assessment (reversal).
--
-- Restores the rule 0001 declared. IT REFUSES ON A STORE THAT HOLDS AN
-- `assessment` EVENT, and that is deliberate rather than a defect: narrowing this
-- constraint would invalidate a teacher's recorded mark, and a rollback that
-- silently discards evidence is worse than one that stops and says so.
--
-- To roll back anyway, the operator must first decide what happens to those
-- rows — they are evidence, so the answer is a forward fix, not a DELETE.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE evidence_events DROP CONSTRAINT IF EXISTS evidence_events_source_known;

ALTER TABLE evidence_events ADD CONSTRAINT evidence_events_source_known CHECK (source IN (
  'diagnostic',
  'practice',
  'retrieval',
  'past_paper',
  'transfer',
  'project'
));
