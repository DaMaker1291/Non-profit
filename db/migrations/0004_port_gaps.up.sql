-- ─────────────────────────────────────────────────────────────────────────────
-- 0004_port_gaps — the three shapes the port needs and the first three
-- migrations did not model (docs/STORAGE_SPEC.md §5, its whole gap list).
--
-- This migration is where a DECISION becomes a constraint, so each table below
-- states which fork §5 named and how it was resolved. A gap list that turns into
-- code without recording the answer is a gap list that gets re-argued.
--
--   1. erasures      — §5.3: the LOG IS THE AUTHORITY IN BOTH BACKENDS.
--   2. ai_cache      — §5.2: a real table, and the cache stays disposable.
--   3. interventions — §5.1: teacher notes about a class belong in the schema.
--
-- Reversal: 0004_port_gaps.down.sql drops every object created here, children
-- before parents, and nothing here changes an existing row.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. The erasure log ──────────────────────────────────────────────────────
--
-- WHY THIS IS A LOG AND NOT SOFT-DELETE COLUMNS. `profiles.deleted_at` (and
-- `sessions.revoked_at`, `classes.archived_at`, `class_members.left_at`) record
-- that a row is no longer live — but a dump restored from BEFORE an erasure
-- restores that row as it was, with `deleted_at` NULL, and the learner is back.
-- The log does not have that hole: it is written inside the same transaction as
-- the delete, it is carried beside the archive, and a restore RE-APPLIES it —
-- which is the property `npm run restore-drill` already proves for the file
-- store and `docs/PRIVACY.md` §7 already promises.
--
-- APPEND-ONLY, like the ledger, and for the same reason: an erasure is an
-- INSTRUCTION. An instruction that can be edited is not one, and a log a
-- restore depends on must not be rewritable by whoever is being asked to
-- forget. DELETE is permitted — not for tidiness, but because the live store
-- deletes the learner it is about, and a log that outlives the deployment's own
-- archive is what `--erasure-source` carries.
--
-- `erased_at` is epoch milliseconds, the unit the application records
-- (`lib/server/erasures.ts#appendErasure`); `recorded_at` is the database's own
-- clock, for operators reading a recovery.

CREATE TABLE erasures (
  learner_id  text NOT NULL CHECK (learner_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  erased_at   bigint NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  -- The pair, not the learner alone: the log is a HISTORY, and erasing a
  -- re-created learner is a second instruction rather than an edit of the first.
  PRIMARY KEY (learner_id, erased_at)
);

COMMENT ON TABLE erasures IS
  'One row per erasure INSTRUCTION (learner id + when). A restore re-applies this '
  'log to a copy taken before the erase, which is what makes an erasure true across '
  'a backup rather than only in the live store. Append-only by trigger.';

CREATE INDEX erasures_learner_idx ON erasures (learner_id);

-- A generic guard, deliberately not a second copy of the ledger's: this one does
-- not name a table, so the next append-only table reuses it instead of inventing
-- a third mechanism.
CREATE FUNCTION append_only_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'append-only: % is refused on %. Append a correcting record instead.',
    TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER erasures_no_update
  BEFORE UPDATE ON erasures
  FOR EACH ROW EXECUTE FUNCTION append_only_reject_mutation();

CREATE TRIGGER erasures_no_truncate
  BEFORE TRUNCATE ON erasures
  FOR EACH STATEMENT EXECUTE FUNCTION append_only_reject_mutation();

-- ── 2. The AI result cache ──────────────────────────────────────────────────
--
-- §5.2 offered a choice: a table with a TTL, or declare the cache genuinely
-- disposable. Both, and the second is the one that matters — the first is an
-- implementation detail. A cache entry is a MODEL CALL the deployment already
-- paid for and can pay for again; losing every row of this table costs latency
-- and money and not one learner's record. That is why nothing here is read at
-- startup, why no backup has to carry it, and why `accessed_at` exists only to
-- let a sweep drop the coldest entries (the file store caps the same map).
--
-- `key` is the application's own cache key (a hash of the prompt shape and its
-- inputs) — opaque here on purpose: this table must not need to know how a
-- prompt is composed in order to hold the answer to one.

CREATE TABLE ai_cache (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  accessed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE ai_cache IS
  'Disposable by design: a lost entry costs a model call, never a learner record. '
  'Sweep by accessed_at when it grows; never restore it before the ledger.';

CREATE INDEX ai_cache_accessed_idx ON ai_cache (accessed_at DESC);

-- ── 3. The evidence-to-intervention record ──────────────────────────────────
--
-- §5.1: "they are teacher notes about a class; they belong in the schema". The
-- record is the smallest thing that connects a class finding → the teacher's
-- review → the assignment it set → the baseline instant → the outcome read
-- against it (lib/server/interventions.ts carries the contract), and it stores
-- NO progress numbers: completion, accuracy and independence are projections of
-- the members' own ledgers, and a counter here would be a second copy that
-- drifts from the record it claims to summarise.
--
-- The columns are the ones the flow QUERIES; everything else rides in `payload`
-- exactly as the application authored it, the same shape `rooms`, `papers`,
-- `personal_papers` and `packs` already use — so a field added to the record
-- does not require rewriting a stored one.
--
-- THE PARTIAL UNIQUE INDEX IS A RULE, NOT AN OPTIMISATION: the flow reuses the
-- OPEN record it finds for a (class, concept, kind) rather than stacking a
-- duplicate (`openRecord`), because two open records for one idea are two
-- baselines for one outcome and the teacher would be reading a number that
-- depends on which row was found first. Declined/resolved/superseded records are
-- closed, so a finding that persists can be reviewed again against a later
-- window — a fresh review, and a fresh record.

CREATE TABLE interventions (
  id          text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  class_id    text NOT NULL CHECK (class_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  concept_id  text NOT NULL,
  kind        text NOT NULL,
  status      text NOT NULL,
  owner_id    text NOT NULL,
  -- The intervention-definition version the record was proposed under, stamped
  -- rather than inferred: a flow that changes later leaves old records legible
  -- as what they were.
  version     smallint NOT NULL,
  created_at  bigint NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  payload     jsonb NOT NULL,

  CONSTRAINT interventions_kind_known CHECK (kind IN (
    'misconception',    -- a wrong rule the ledger recorded, shared by several
    'weak_rate',        -- observed difficulty: low unaided accuracy, no why
    'hint_dependent',   -- right with help every time — scaffolding demand
    'prereq_gap',       -- likely prerequisite lever, inferred from the genome
    'unmeasured'        -- not yet measured — an absence, never a failure
  )),
  CONSTRAINT interventions_status_known CHECK (status IN (
    'proposed',    -- awaiting the teacher's review
    'assigned',    -- the work was set; outcome still to be read
    'declined',    -- reviewed and deliberately not acted on — recorded
    'resolved',    -- outcome read, teacher chose the next step
    'superseded'   -- a newer proposal at the same compound key kept open
  ))
);

COMMENT ON TABLE interventions IS
  'The evidence→intervention record: class finding, teacher review, the assignment '
  'it set, the baseline instant, and the outcome read against it. Carries no '
  'progress numbers — those are projections of the members'' own ledgers.';

-- One OPEN record per (class, concept, kind); closed records accumulate.
CREATE UNIQUE INDEX interventions_open_key
  ON interventions (class_id, concept_id, kind)
  WHERE status IN ('proposed', 'assigned');

CREATE INDEX interventions_class_idx ON interventions (class_id, status);
CREATE INDEX interventions_owner_idx ON interventions (owner_id, created_at DESC);
