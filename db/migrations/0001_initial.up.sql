-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_initial — OpenMind's durable schema (deployment brief §3).
--
-- WHAT THIS IS. The application's store today is a directory of JSON/JSONL files
-- under OPENMIND_DATA_DIR (lib/server/store.ts). That is the right shape for a
-- school laptop and the wrong one for a public multi-user service, for reasons
-- the deployment brief sets out: no transactions, no indexes, no point-in-time
-- recovery, and no shared state between instances. This migration is the target
-- shape. It does NOT, on its own, move the application — moving the store is the
-- separate, larger change, and pretending otherwise would be the inaccuracy the
-- brief warns about (see docs/DEPLOYMENT.md §5).
--
-- THREE RULES THE SCHEMA ITSELF ENFORCES, because a comment cannot:
--
--   1. IDS ARE THE APPLICATION'S OWN, and they are TEXT. They look like
--      `prof_m3k9x2a1b` (lib/server/store.ts#newId) and they are the identity a
--      learner's evidence is filed under, so rewriting one would silently
--      re-file somebody's history. Learner ids keep the EXACT rule the ledger
--      applies today before an id may become a file path
--      (lib/server/evidence.ts#fileFor): 3–64 characters of [A-Za-z0-9_-]. The
--      constraint is the same rule, in the place where every writer must obey it.
--
--   2. TIME IS IN EPOCH MILLISECONDS ON EVENTS (`at`, `device_at`), because that
--      is the unit the projection, the retention schedule and ordering already
--      use. Operational columns (created_at/updated_at) are timestamptz because
--      they are read by humans and by `pg_dump`/recovery, not by the model.
--
--   3. EVIDENCE IS APPEND-ONLY, and 0002 installs the guard that makes it so.
--      The learning architecture projects the learner model FROM this log rather
--      than treating it as a log OF the model, so an in-place edit would corrupt
--      the only authoritative record. `payload` keeps the event verbatim as the
--      application serialised it, so a projection change can be replayed against
--      history rather than assumed.
--
-- Reversal: 0001_initial.down.sql drops every object created here, children
-- before parents. See docs/DEPLOYMENT.md for the backup → migrate → rollout →
-- health-check sequence this is meant to run inside.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Identity ────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id         text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  handle     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Erasure is a real, learner-initiated act (lib/server/store.ts#deleteProfile),
  -- and the account row is kept so the deletion is itself accountable. The
  -- partial index below lets a handle be reused only after that.
  deleted_at timestamptz
);

-- Handles are how learners find each other at school, so two live accounts may
-- never share one. Case-insensitive, because "Amina_K" and "amina_k" are the
-- same person to a classmate.
CREATE UNIQUE INDEX users_handle_live_key ON users (lower(handle)) WHERE deleted_at IS NULL;

CREATE TABLE profiles (
  user_id          text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  country          text NOT NULL DEFAULT 'INT',
  language         text NOT NULL DEFAULT 'en',
  birth_year       integer,
  goal             text NOT NULL DEFAULT '',
  intent           text NOT NULL DEFAULT '',
  -- The subjects this learner is working on, in the app's own order.
  subjects         text[] NOT NULL DEFAULT '{}',
  -- The course in force. Evidence carries its own copy of this so a learner who
  -- changes specification keeps evidence that is still interpretable.
  specification_id text,
  level_id         text,
  -- CAPABILITY SECRET, STORED HASHED. Today the raw secret is compared for
  -- equality (lib/server/capability.ts); hashing keeps that comparison working
  -- while making a database leak much less useful than a profile leak is now.
  secret_hash      text NOT NULL,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_birth_year_sane CHECK (birth_year IS NULL OR birth_year BETWEEN 1900 AND 2100)
);

CREATE TABLE sessions (
  token_hash   text PRIMARY KEY,
  user_id      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  user_agent   text,
  revoked_at   timestamptz
);

CREATE INDEX sessions_user_live_idx ON sessions (user_id) WHERE revoked_at IS NULL;
-- Expired sessions are swept; the index is what makes the sweep cheap.
CREATE INDEX sessions_expiry_idx ON sessions (expires_at) WHERE revoked_at IS NULL;

-- ── THE EVIDENCE LEDGER ─────────────────────────────────────────────────────
-- Append-only. One row per event, exactly as the JSONL file holds one line per
-- event. `id` is PRIMARY KEY because it is the idempotency rule the ingestion
-- door already enforces against what is on disk (lib/server/evidence.ts):
-- re-sending an event — a device reconnecting, a response lost after the write —
-- must be a no-op, not a second answer. A unique key is that rule made total.
--
-- A DEDUPED RE-SEND IS STILL A FACT WORTH REPORTING (offline_sync), which is a
-- table about the protocol rather than about the learner.

CREATE TABLE evidence_events (
  id               text PRIMARY KEY,
  learner_id       text NOT NULL CHECK (learner_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  -- The server's clock, when the event reached the ledger. The projection reads
  -- THIS for retention, due dates and ordering.
  at               bigint NOT NULL,
  -- The device's own claim about when the learner answered, held as a claim and
  -- never read as evidence about time (lib/evidence.ts#deviceClaimAt).
  device_at        bigint,
  type             text NOT NULL,
  subject          text,
  concept_id       text,
  specification_id text,
  source           text NOT NULL,
  question_id      text,
  correct          boolean,
  -- −1 means "the learner typed their answer": a numeric item has no option to
  -- have chosen, and 0 is a real index, so it cannot double as the marker.
  chosen           integer,
  -- The canonical NUMBER the learner typed, not the text they entered, so a
  -- replay grades and records identically. Null on a choice item — an absent
  -- number is not a zero, and 0 is a real answer.
  given_value      double precision,
  mode             text,
  hints            integer,
  ms               integer,
  score_awarded    integer,
  score_max        integer,
  tags             text[] NOT NULL DEFAULT '{}',
  certainty        text,
  -- The event's own schema version, so a replay can refuse a shape it does not
  -- understand instead of guessing (EVIDENCE_SCHEMA_VERSION).
  schema_version   smallint NOT NULL,
  -- The event VERBATIM, as the application serialised it. The typed columns
  -- above are the ones we index and query; this is the record itself, so a
  -- projection change is replayed against history rather than assumed.
  payload          jsonb NOT NULL,

  CONSTRAINT evidence_events_type_known CHECK (type IN (
    'answer_submitted', 'hint_requested', 'diagnostic_completed', 'paper_completed', 'session_completed'
  )),
  CONSTRAINT evidence_events_source_known CHECK (source IN (
    'diagnostic', 'practice', 'retrieval', 'past_paper', 'transfer', 'project'
  )),
  CONSTRAINT evidence_events_mode_known CHECK (mode IS NULL OR mode IN ('guided', 'independent', 'transfer')),
  CONSTRAINT evidence_events_certainty_known CHECK (certainty IS NULL OR certainty IN ('sure', 'unsure')),
  -- A chosen index is −1 (typed) or a real option index.
  CONSTRAINT evidence_events_chosen_sane CHECK (chosen IS NULL OR chosen >= -1),
  CONSTRAINT evidence_events_hints_sane CHECK (hints IS NULL OR hints >= 0),
  CONSTRAINT evidence_events_ms_sane CHECK (ms IS NULL OR (ms >= 0 AND ms <= 3600000)),
  CONSTRAINT evidence_events_score_sane CHECK (
    (score_awarded IS NULL) = (score_max IS NULL)
    AND (score_awarded IS NULL OR (score_awarded >= 0 AND score_max >= score_awarded))
  )
);

-- ── THE LEARNER MODEL, AS A PROJECTION ──────────────────────────────────────
-- The model is derived FROM evidence_events, so it is stored as a projection
-- rather than as the source of truth: it can be deleted and rebuilt by replaying
-- the ledger (lib/replay.ts). `last_event_at` is what lets a rebuild know how far
-- it has caught up without scanning every event.

CREATE TABLE learner_projections (
  learner_id    text PRIMARY KEY CHECK (learner_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  model         jsonb NOT NULL,
  -- The projection code's own version: a replay refuses to compare models built
  -- by different rules, which is the difference between a rebuild and a guess.
  projection_version smallint NOT NULL,
  last_event_at bigint,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── The offline sync protocol, server side ──────────────────────────────────
-- Why this is a table and not a log line: dedupe is the claim that matters when a
-- device reconnects, and "how many events from this device were duplicates, and
-- when" is a question an operator or a teacher has to be able to answer.

CREATE TABLE offline_sync (
  learner_id   text NOT NULL CHECK (learner_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  event_id     text NOT NULL,
  device_id    text NOT NULL,
  -- Null when the batch was refused before any event could be attributed.
  sequence     bigint,
  -- What the server did with this event: appended, or recognised as a duplicate
  -- (and, when refused, why).
  outcome      text NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now(),
  schema_version smallint,
  PRIMARY KEY (learner_id, event_id, device_id),
  CONSTRAINT offline_sync_outcome_known CHECK (outcome IN ('appended', 'duplicate', 'refused'))
);

-- ── Cohorts: classes, membership, assignments ───────────────────────────────

CREATE TABLE classes (
  id          text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  owner_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  -- The join code a learner types. Unique among live classes so a code is never
  -- ambiguous on a whiteboard.
  join_code   text NOT NULL,
  subject     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE UNIQUE INDEX classes_join_code_live_key ON classes (upper(join_code)) WHERE archived_at IS NULL;
CREATE INDEX classes_owner_idx ON classes (owner_id) WHERE archived_at IS NULL;

CREATE TABLE class_members (
  class_id   text NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'student',
  joined_at  timestamptz NOT NULL DEFAULT now(),
  left_at    timestamptz,
  PRIMARY KEY (class_id, user_id),
  CONSTRAINT class_members_role_known CHECK (role IN ('student', 'teacher', 'assistant'))
);

CREATE INDEX class_members_user_idx ON class_members (user_id) WHERE left_at IS NULL;

CREATE TABLE assignments (
  id          text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  class_id    text NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  set_by      text NOT NULL REFERENCES users(id),
  title       text NOT NULL,
  -- What was set: concepts, a paper, a pack. Kept as the setter's own selection
  -- so the assignment means the same thing after the curriculum moves.
  target      jsonb NOT NULL,
  due_at      timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz
);

CREATE INDEX assignments_class_idx ON assignments (class_id, due_at) WHERE withdrawn_at IS NULL;

-- DERIVED, NOT COUNTED (the rule the teacher surface is built on): a result row
-- is the ledger's answer for one learner against one assignment, and it is
-- rebuildable, which is why nothing here is the only copy of a verdict.
CREATE TABLE assignment_results (
  assignment_id text NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id    text NOT NULL CHECK (learner_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  computed_at   timestamptz NOT NULL DEFAULT now(),
  asked         integer NOT NULL DEFAULT 0,
  correct       integer NOT NULL DEFAULT 0,
  detail        jsonb NOT NULL,
  PRIMARY KEY (assignment_id, learner_id),
  CONSTRAINT assignment_results_counts_sane CHECK (correct >= 0 AND asked >= 0 AND correct <= asked)
);

-- ── Durable learner artefacts ───────────────────────────────────────────────
-- Papers, personal papers, packs and study rooms are the things a learner or a
-- teacher made and expects to find again. Each keeps the fields we query as real
-- columns and the rest as the shape the application authored, so a schema change
-- here does not require rewriting every stored paper.

CREATE TABLE rooms (
  id         text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  owner_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at  timestamptz,
  payload    jsonb NOT NULL
);

CREATE INDEX rooms_owner_idx ON rooms (owner_id) WHERE closed_at IS NULL;

CREATE TABLE papers (
  id         text PRIMARY KEY,
  owner_id   text REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload    jsonb NOT NULL
);

CREATE TABLE personal_papers (
  id         text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  owner_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload    jsonb NOT NULL
);

CREATE INDEX personal_papers_owner_idx ON personal_papers (owner_id, created_at DESC);

CREATE TABLE packs (
  id         text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  learner_id text NOT NULL CHECK (learner_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Downloads are what a learner takes away on a cheap connection, so "which
  -- pack did this device hold, and when" is a question support has to answer.
  downloaded_at timestamptz,
  payload    jsonb NOT NULL
);

CREATE INDEX packs_learner_idx ON packs (learner_id, created_at DESC);

-- ── The AI gateway's own records (§19–20) ──────────────────────────────────
-- NEVER the child's whole conversation forever: a session row keeps what the
-- gateway decided and how it went; the audit row keeps the safety-relevant facts
-- with the minimum of content needed to review a decision.

CREATE TABLE ai_sessions (
  id           text PRIMARY KEY,
  learner_id   text CHECK (learner_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  provider     text,
  model        text,
  purpose      text NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  ended_at     timestamptz,
  -- 'offline' is a SUPPORTED outcome, not an error: with no key configured the
  -- deterministic tutor answers instead (§20).
  outcome      text NOT NULL,
  latency_ms   integer,
  CONSTRAINT ai_sessions_outcome_known CHECK (outcome IN ('ok', 'offline', 'timeout', 'refused', 'error'))
);

CREATE INDEX ai_sessions_recent_idx ON ai_sessions (started_at DESC);

CREATE TABLE ai_audit (
  id         text PRIMARY KEY,
  session_id text REFERENCES ai_sessions(id) ON DELETE SET NULL,
  learner_id text CHECK (learner_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  at         timestamptz NOT NULL DEFAULT now(),
  -- What the gateway decided: whether AI was allowed, which context it may send,
  -- and which policy clause was applied.
  decision   text NOT NULL,
  policy     text,
  detail     jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX ai_audit_recent_idx ON ai_audit (at DESC);
