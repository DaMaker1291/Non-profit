-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_evidence_indexes — make the ledger readable, and make "append-only" true
-- rather than aspirational.
--
-- THE INDEXES ARE SHAPED BY THE QUESTIONS THE PRODUCT ACTUALLY ASKS.
--
--   (learner_id, at)              replay a learner's history in order — what
--                                 every projection, retention check and report
--                                 does, and the hot path of the whole system
--   (learner_id, concept_id, at)  "what has this learner done on THIS idea" —
--                                 the per-concept rows the diagnostics and the
--                                 teacher view are built from
--   (learner_id, type) partial    due reviews and retention read answer events
--                                 only; hint and session rows are noise to them
--   (question_id)                 support: "why did this answer disappear" is a
--                                 question about ONE item's history
--   tags (GIN)                    misconception analysis groups by tag
--   (at DESC)                     operations: volume, and the fault window when
--                                 something broke at 14:20
--
-- THE GUARD. Append-only is a property of the learning architecture, not a
-- stylistic preference: the learner model is projected FROM this log, so an
-- in-place edit changes the past that produced the present. A rule that lives
-- only in the application is a rule that the next writer — a migration, a
-- support script, a future service — can break without noticing, so it is
-- enforced here.
--
--   · UPDATE is refused outright. There is no legitimate one: correcting an
--     event means appending a correcting event, which is what keeps the ledger
--     auditable.
--   · TRUNCATE is refused for the same reason, and it is a separate trigger
--     because TRUNCATE does not fire row-level triggers — the guard that only
--     covers UPDATE would leave the loudest way to destroy the ledger open.
--   · DELETE is DELIBERATELY ALLOWED, and this is the one that would be wrong to
--     "tighten". A learner's right to erasure is implemented by removing their
--     record (lib/server/store.ts#deleteProfile), and a blanket ban would turn a
--     legal obligation into a database error. Erasure is a deliberate, audited,
--     learner-initiated act; an edit is not. The distinction is the whole rule,
--     and it is why this comment is longer than the trigger.
--
-- Reversal: 0002_evidence_indexes.down.sql drops the triggers, the function and
-- every index. Nothing here changes a row, so the down path loses no data — and
-- it must stay that way: an index "migration" that rewrites rows is a data
-- migration wearing a misleading name.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX evidence_events_replay_idx ON evidence_events (learner_id, at);
CREATE INDEX evidence_events_concept_idx ON evidence_events (learner_id, concept_id, at);
CREATE INDEX evidence_events_answers_idx
  ON evidence_events (learner_id, at) WHERE type = 'answer_submitted';
CREATE INDEX evidence_events_question_idx ON evidence_events (question_id) WHERE question_id IS NOT NULL;
CREATE INDEX evidence_events_tags_idx ON evidence_events USING gin (tags);
CREATE INDEX evidence_events_recent_idx ON evidence_events (at DESC);
-- The erasure path deletes by learner; without this it is a sequential scan of
-- the largest table in the database.
CREATE INDEX evidence_events_learner_idx ON evidence_events (learner_id);

-- Projections are rebuilt from the ledger, so "which learners are behind" is a
-- query about last_event_at, not about updated_at.
CREATE INDEX learner_projections_stale_idx ON learner_projections (last_event_at);

-- Sync health: an operator asks "how many duplicates came from this device".
CREATE INDEX offline_sync_device_idx ON offline_sync (device_id, received_at DESC);
CREATE INDEX offline_sync_outcome_idx ON offline_sync (outcome, received_at DESC);

COMMENT ON TABLE evidence_events IS
  'Append-only. UPDATE and TRUNCATE are refused by trigger; DELETE is permitted '
  'only for a learner''s erasure request. Correcting an event means appending '
  'a correcting event.';

CREATE FUNCTION evidence_events_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'evidence_events is append-only: % is refused. Append a correcting event instead; '
    'DELETE is permitted only for erasure (see 0002_evidence_indexes).', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER evidence_events_no_update
  BEFORE UPDATE ON evidence_events
  FOR EACH ROW EXECUTE FUNCTION evidence_events_reject_mutation();

CREATE TRIGGER evidence_events_no_truncate
  BEFORE TRUNCATE ON evidence_events
  FOR EACH STATEMENT EXECUTE FUNCTION evidence_events_reject_mutation();
