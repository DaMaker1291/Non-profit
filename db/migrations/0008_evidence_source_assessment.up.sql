-- ─────────────────────────────────────────────────────────────────────────────
-- 0008_evidence_source_assessment — the ledger's `source` column could not hold
-- a source the application records.
--
-- FOUND BY RUNNING THE APPLICATION AGAINST A REAL DATABASE, not by reading the
-- schema. 0001 declared:
--
--   CONSTRAINT evidence_events_source_known CHECK (source IN (
--     'diagnostic', 'practice', 'retrieval', 'past_paper', 'transfer', 'project'
--   ))
--
-- and `lib/evidence.ts#EvidenceSource` has SEVEN values. The one missing is
-- `assessment`: a blueprint item marked against an authored scheme — a teacher's
-- mark of a learner's paper, minted by `teacherAnswerEvidence` with
-- `provenance: "teacher"`. It MEASURES like a past paper without pretending the
-- item came from one.
--
-- Why this is a migration rather than a note: a CHECK constraint that disagrees
-- with the application does not surface as "assessment is unsupported". It
-- surfaces as a successful route that throws on insert, so a teacher's mark of a
-- pupil's paper is a 500 — and the evidence that justifies the resulting model
-- change is the one thing this product is not allowed to lose. Every other
-- mismatch of this kind was caught while writing the backend against the schema
-- (see 0005, 0006, 0007); this one could only be caught by writing a teacher
-- mark through the real database, because the file backend never consults a
-- constraint at all.
--
-- The list is now the union of `EvidenceSource`: kept as an explicit set (not
-- derived) because a constraint is the place a NEW source has to be added
-- deliberately, and a silent widening would let a typo become a stored fact.
--
-- Reversal: 0008_evidence_source_assessment.down.sql restores the narrower rule.
-- It WILL refuse if any row already records an `assessment` event, and that
-- refusal is correct: a rollback must not silently invalidate a teacher's mark.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE evidence_events DROP CONSTRAINT IF EXISTS evidence_events_source_known;

ALTER TABLE evidence_events ADD CONSTRAINT evidence_events_source_known CHECK (source IN (
  'diagnostic',
  'practice',
  'retrieval',
  'past_paper',
  -- A blueprint item marked against an authored scheme: an OpenMind assessment,
  -- not a past paper. Written by teacherAnswerEvidence (provenance "teacher").
  'assessment',
  'transfer',
  'project'
));

COMMENT ON CONSTRAINT evidence_events_source_known ON evidence_events IS
  'The union of lib/evidence.ts#EvidenceSource. A source added to the application must be added here '
  'in the same change, or the route that records it answers 500 on insert instead of storing evidence.';
