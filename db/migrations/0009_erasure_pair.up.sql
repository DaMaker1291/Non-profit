-- ─────────────────────────────────────────────────────────────────────────────
-- 0009_erasure_pair — the log could not hold an instruction and its completion
-- that share a millisecond.
--
-- FOUND BY RUNNING THE CONFORMANCE SUITE AGAINST THE DATABASE. `erasures` was
-- declared with `PRIMARY KEY (learner_id, erased_at)` (0004), and 0007 added
-- `kind`/`of_at` so a completion is a SECOND ROW rather than an UPDATE. The
-- comment there says "the pairing the primary key already allows" — and that is
-- true only when the two records land in different milliseconds.
--
-- They frequently do not. The erase workflow writes the instruction, performs
-- four removals and then confirms; on a local database that is one millisecond,
-- and the file log records it happily because an append has no key. Against the
-- SQL twin the completion collided with its own instruction, `ON CONFLICT DO
-- NOTHING` swallowed it, and `confirmErasure` reported `false` for an erase that
-- had in fact finished — so `erasureStateFor` read the learner as
-- `incomplete: true` for ever, which is exactly the state an operator is
-- supposed to be able to trust.
--
-- The key gains `kind`, which is what the two records ARE. A learner erased,
-- re-created and erased again still gets a fresh pair (different `erased_at`),
-- and a duplicate confirmation of the same instant is still refused by the key.
-- The append-only trigger is untouched: this changes which pairs are legal, not
-- whether a row may be edited.
--
-- Reversal: 0012… not applicable — see 0009_erasure_pair.down.sql, which
-- restores the narrower key and WILL refuse on a store that holds a same-instant
-- pair. That refusal is correct: collapsing the key would mean deleting one of
-- the two records, and both are the log.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE erasures DROP CONSTRAINT IF EXISTS erasures_pkey;

ALTER TABLE erasures ADD CONSTRAINT erasures_pkey PRIMARY KEY (learner_id, erased_at, kind);

COMMENT ON CONSTRAINT erasures_pkey ON erasures IS
  'One row per (learner, instant, entry kind). `kind` is part of the key because a '
  'completion may be written in the SAME millisecond as its instruction, and the two '
  'are different records about the same act.';
