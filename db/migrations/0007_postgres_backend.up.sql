-- ─────────────────────────────────────────────────────────────────────────────
-- 0007_postgres_backend — the last gaps between the schema and the port.
--
-- WHY THIS EXISTS. `lib/server/storage-postgres.ts` implements every method of
-- the storage port. Writing it against 0001–0006 found four places where the
-- schema could not hold what the application already stores, and each one would
-- have surfaced only as a write the app believed had succeeded:
--
--   1. AN ACCOUNT'S RECOVERY SECRETS HAD NOWHERE TO LIVE. `Account` carries a
--      recovery code hash + salt, a teacher-issued reset grant (hash + salt +
--      expiry) and a pending email-verification token. 0006 gave `users` the
--      password columns and stopped there, so those three would have had to be
--      dropped — which would silently disable account recovery on the one
--      deployment that most needs it (a learner who lost the printed code).
--
--   2. `owner_id` WAS A FOREIGN KEY TO `users`, BUT OWNERS ARE PROFILES.
--      `papers.owner_id`, `personal_papers.owner_id`, `rooms.owner_id` and
--      `classes.owner_id` all hold a LEARNER PROFILE id in this product — the
--      `/solve` wedge creates a profile with no account at all (0006's objection,
--      one layer down). A foreign key to `users` would refuse the first anonymous
--      learner's paper, its `ON DELETE CASCADE` would destroy a learner's marked
--      work behind the app's back, and `classes.owner_id NOT NULL` would refuse a
--      class created by a capability rather than an account. The columns stay
--      (the queries need them); the constraints go.
--
--   3. THE ERASURE LOG NEEDED ITS SECOND RECORD TYPE. `lib/server/erasures.ts`
--      writes an INSTRUCTION and, once the effects are gone, a CONFIRMATION —
--      two lines, because the SQL twin of that log is append-only by trigger and
--      a completion is therefore a second row rather than an edit (0004 says so
--      in its own comment). 0004 created the table with no way to tell the two
--      apart, so `readErasures` would have reported every completion as a brand
--      new erasure. `kind` and `of_at` are that distinction.
--
--   4. TWO PORT RECORDS HAD NO TABLE AT ALL: the content-review ledger
--      (`listContentReviews` / `appendContentReview`) and the authored-lesson
--      educator reviews with the improvement queue derived from them
--      (`listLessonReviews` / `appendLessonReview` / `listLessonImprovementTasks`
--      / `updateLessonImprovementTask`). Both are append-only records tied to a
--      content fingerprint, which is exactly why they must be stored rather than
--      recomputed: a review is a HUMAN act, and the fingerprint is what proves
--      which version of the material was reviewed.
--
-- Everything here is additive or a constraint relaxation; no existing column is
-- narrowed, so this migration cannot reject a row a running deployment holds.
-- Reversal: 0007_postgres_backend.down.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. An account's recovery secrets ────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN recovery_salt     text,
  ADD COLUMN recovery_hash     text,
  ADD COLUMN reset_salt        text,
  ADD COLUMN reset_hash        text,
  -- Epoch milliseconds, like every other *At the application stores, so the
  -- backend reports the value `Account.resetExpiresAt` holds rather than a
  -- conversion that could disagree by a timezone.
  ADD COLUMN reset_expires_at  bigint,
  ADD COLUMN verify_salt       text,
  ADD COLUMN verify_hash       text,
  ADD COLUMN verify_expires_at bigint;

COMMENT ON COLUMN users.recovery_hash IS
  'scrypt(recovery code, recovery_salt). Never the code itself: a recovery code is a '
  'bearer credential, so storing it in the clear would make every backup a way to take '
  'an account over.';
COMMENT ON COLUMN users.reset_expires_at IS
  'Epoch ms after which the teacher-issued reset grant is inert. The expiry rides with '
  'the hash because a grant that exists without an end date never stops working.';

-- A grant is looked up by its PUBLIC key, which `lib/recovery-code.ts#resetKeyFor`
-- derives from the account id (the first N hex symbols of it). The expression
-- below is that same derivation, so the lookup does not need a second copy of the
-- account id to be stored anywhere.
CREATE INDEX users_reset_key_idx ON users (
  upper(substr(regexp_replace(id, '^acc_', ''), 1, 8))
) WHERE reset_hash IS NOT NULL;

-- ── 2. Owners are profiles, not accounts ────────────────────────────────────

ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_owner_id_fkey;
ALTER TABLE classes ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE classes ADD COLUMN payload jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_owner_id_fkey;

ALTER TABLE papers DROP CONSTRAINT IF EXISTS papers_owner_id_fkey;

ALTER TABLE personal_papers DROP CONSTRAINT IF EXISTS personal_papers_owner_id_fkey;

COMMENT ON COLUMN classes.payload IS
  'The ClassRoster exactly as the application authored it. The typed columns are what '
  'the queries need (join code, name, owner); the roster itself — membership, '
  'self-reported mastery, teacher settings — is the record, and a field added to it '
  'must not require rewriting a stored class.';

-- ── 3. The erasure log's two record types ───────────────────────────────────

ALTER TABLE erasures
  ADD COLUMN kind  text NOT NULL DEFAULT 'recorded',
  -- For a completion: the `erased_at` of the instruction it finishes. A learner
  -- can be erased, re-created and erased again, and each instruction gets its own
  -- confirmation — the pairing the primary key already allows.
  ADD COLUMN of_at bigint;

ALTER TABLE erasures ADD CONSTRAINT erasures_kind_known
  CHECK (kind IN ('recorded', 'completed'));

CREATE INDEX erasures_kind_idx ON erasures (learner_id, kind);

COMMENT ON COLUMN erasures.kind IS
  'recorded = the instruction ("this learner asked to be forgotten"); completed = the '
  'confirmation that the effects are gone. Two rows, never an UPDATE: this table is '
  'append-only by trigger, and a completion was always a second record.';

-- ── 4. The two record families the port names and the schema lacked ────────

-- A review of authored content, bound to the FINGERPRINT of the material that was
-- read. The fingerprint is not a nicety: without it, a review of an earlier
-- version silently becomes a review of the current one.
CREATE TABLE content_reviews (
  id           text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  fingerprint  text NOT NULL,
  account_id   text NOT NULL,
  reviewer_name text NOT NULL DEFAULT '',
  reviewer_role text NOT NULL DEFAULT '',
  created_at_ms bigint NOT NULL,
  payload      jsonb NOT NULL
);

CREATE INDEX content_reviews_fingerprint_idx ON content_reviews (fingerprint, created_at_ms DESC);

COMMENT ON TABLE content_reviews IS
  'Append-only human reviews of authored content (lib/content-platform/types.ts). The '
  'fingerprint names the material reviewed, so a review of an older version cannot be '
  'read as approval of the current one.';

-- An educator's review of an authored lesson, and the improvement tasks its
-- findings became. They are written in ONE transaction by `appendLessonReview`,
-- because a review whose findings never became tasks is a record a school cannot
-- act on.
CREATE TABLE lesson_reviews (
  id            text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  subject       text NOT NULL,
  curriculum_ref text NOT NULL DEFAULT '',
  level         text NOT NULL DEFAULT '',
  account_id    text NOT NULL,
  reviewed_at   text NOT NULL,
  created_at_ms bigint NOT NULL,
  payload       jsonb NOT NULL
);

CREATE INDEX lesson_reviews_recent_idx ON lesson_reviews (created_at_ms DESC);

CREATE TABLE lesson_improvement_tasks (
  id            text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  review_id     text NOT NULL,
  lesson_id     text NOT NULL,
  content_hash  text NOT NULL,
  finding_id    text NOT NULL,
  severity      text NOT NULL,
  blocking      boolean NOT NULL DEFAULT false,
  status        text NOT NULL,
  created_at_ms bigint NOT NULL,
  updated_at_ms bigint NOT NULL,
  payload       jsonb NOT NULL,
  -- The allowed set is lib/validation/types.ts#ImprovementStatus EXACTLY:
  -- "in-progress" and "done", hyphenated as the application spells them. A
  -- constraint that disagreed would refuse a real task the moment a teacher
  -- closed one, and the failure would arrive in production rather than here.
  CONSTRAINT lesson_improvement_tasks_status_known
    CHECK (status IN ('open', 'in-progress', 'done'))
);

CREATE INDEX lesson_improvement_tasks_review_idx ON lesson_improvement_tasks (review_id);
CREATE INDEX lesson_improvement_tasks_open_idx ON lesson_improvement_tasks (status, severity);

COMMENT ON TABLE lesson_improvement_tasks IS
  'The queue a lesson review produces. `status` and `severity` are columns because the '
  'teacher surface filters on them; everything else rides in payload, like rooms and '
  'papers, so a field added to a task does not rewrite a stored one.';
