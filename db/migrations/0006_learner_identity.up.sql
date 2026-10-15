-- ─────────────────────────────────────────────────────────────────────────────
-- 0006_learner_identity — a learner record that does NOT have to be an account,
-- and the account columns the schema never had.
--
-- FOUND BY WRITING THE POSTGRES BACKEND, not by re-reading it. 0001 declared
-- `profiles` with `user_id text PRIMARY KEY REFERENCES users(id) ON DELETE
-- CASCADE`, and every word of that is wrong for this product:
--
--   1. A PROFILE IS NOT AN ACCOUNT. The `/solve` and `/try` wedge is a learner
--      practising with no sign-up at all, and onboarding's guest path creates a
--      profile before anyone types an email. A backend written against 0001 would
--      have had to fabricate a `users` row for every anonymous child — an account
--      nobody created, for a person who never made one. So the profile gains its
--      OWN identity (`id`, primary key) and `user_id` becomes an OPTIONAL LINK.
--
--   2. CASCADE IS THE WRONG ERASE PATH. `users … ON DELETE CASCADE` means deleting
--      an identity row destroys the learner's record — silently, outside the app,
--      and with no tombstone. Erasure in this project is a deliberate, logged act
--      (lib/server/store.ts#deleteProfile, lib/server/erasures.ts, docs/PRIVACY.md
--      §7): the profile goes and a record of the INSTRUCTION remains, which is
--      what a restore re-applies. A foreign key that can destroy a learner behind
--      the app's back defeats that, so the link is `ON DELETE SET NULL`: losing an
--      account row orphans the record rather than deleting it, and the erase path
--      (which deletes the profile and appends the tombstone, in one transaction)
--      is the only thing that removes one.
--
--   3. ACCOUNTS NEED COLUMNS THE SCHEMA DID NOT HAVE. `users` is `(id, handle,
--      created_at, deleted_at)`. lib/server/auth.ts#Account is `(id, email, name,
--      role, passHash, salt, createdAt, lastSeenAt, profileId, verified,
--      sessionEpoch)` — email sign-in, a scrypt hash and its per-account salt, a
--      role, the epoch that makes signing out a SERVER decision, and the profile
--      the account owns. A backend with nowhere to put those cannot serve
--      `createAccount`, `findAccountByEmail` or `revokeSessions` at all.
--
--   4. HANDLE IS OPTIONAL IN THE PRODUCT. `handle` is `NOT NULL` here and
--      optional end-to-end in the application (onboarding no longer mints one, and
--      the teacher/rooms/packs APIs `??`-guard a missing one). NOT NULL made the
--      schema stricter than the product, which only ever surfaces as a write that
--      the app believes succeeded.
--
--   5. THE STORE'S OWN BOOT RECORD HAD NOWHERE TO LIVE. `lib/server/boot-log.ts`
--      measures whether the store outlived a process — the only durability
--      evidence available from inside a deployment, and the number `/api/ready`
--      reports as `persistence.boots`. It writes `boots.json` INTO THE DIRECTORY it
--      is measuring, which is right for a file store and impossible for a database:
--      a Postgres deployment has no such directory, so `store_boots` gives the
--      database backend the same measurement in the only place it is meaningful.
--
-- WHY `profiles.id` IS ALSO CHECKED AGAINST THE SAFE-ID PATTERN: `evidence_events
-- .learner_id` already is, and the two must agree about which ids exist. An id
-- that can key a ledger row but not a profile is a learner whose evidence has
-- nowhere to attach.
--
-- Precondition of the REVERSAL, stated because a down file that pretends to be
-- total is worse than none: reverting re-establishes `user_id` as the primary key,
-- so it can only run while every profile still names a live account row. It will
-- refuse — correctly — on a store that holds an anonymous learner. The rehearsal
-- in `npm run db:rehearse` runs it on an empty scratch database, which is the one
-- place that precondition is guaranteed.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. The learner record's own identity ────────────────────────────────────

ALTER TABLE profiles ADD COLUMN id text;

-- Existing rows are keyed by the account that created them, so the account id IS
-- their id today. Nothing else could be inferred, and inventing a fresh id would
-- break the link between a stored ledger (`learner_id`) and the profile it
-- belongs to.
UPDATE profiles SET id = user_id;

ALTER TABLE profiles ALTER COLUMN id SET NOT NULL;

ALTER TABLE profiles DROP CONSTRAINT profiles_pkey;

ALTER TABLE profiles ADD CONSTRAINT profiles_id_safe
  CHECK (id ~ '^[A-Za-z0-9_-]{3,64}$');

ALTER TABLE profiles ADD PRIMARY KEY (id);

-- The link becomes optional…
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- …and stops being able to destroy a learner. See (2) above: the erase path is
-- the app's, and a cascade here would be a second, unlogged one.
ALTER TABLE profiles DROP CONSTRAINT profiles_user_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ── 2. The account ─────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN email          text,
  ADD COLUMN name           text NOT NULL DEFAULT '',
  -- Nullable on purpose: `users` also models an identity that has no password at
  -- all (the handle-only rows 0001 created, and any future SSO row). An email
  -- account always has both, and the sign-in path refuses an account without them
  -- rather than treating an absent hash as a match.
  ADD COLUMN pass_hash      text,
  ADD COLUMN salt           text,
  -- LEAST PRIVILEGE BY DEFAULT. An unstated role is 'student', never 'teacher' or
  -- 'org': the default must not grant anything the learner did not choose.
  ADD COLUMN role           text NOT NULL DEFAULT 'student',
  -- Bumped on sign-out; every token records the epoch it was issued in, and a
  -- three-part (pre-epoch) token is read as epoch 0, which is why the default is 0.
  ADD COLUMN session_epoch  integer NOT NULL DEFAULT 0,
  -- The profile this account owns. NOT a foreign key, deliberately: erasing a
  -- learner's record KEEPS the account (privacy §23 is a deliberate two-step), so
  -- this column is allowed to name a profile that no longer exists. A constraint
  -- that tidied it away would be inventing a fact the application holds as a
  -- string, and nulling it would turn "your history was erased" into an error on
  -- the next read.
  ADD COLUMN profile_id     text NOT NULL DEFAULT '',
  -- False for every account: OpenMind ships no mail service, so an address cannot
  -- be proved. The column exists so the honest state has somewhere to live.
  ADD COLUMN verified       boolean NOT NULL DEFAULT false,
  ADD COLUMN last_seen_at   timestamptz,
  ADD COLUMN updated_at     timestamptz NOT NULL DEFAULT now();

ALTER TABLE users ALTER COLUMN handle DROP NOT NULL;

ALTER TABLE users ADD CONSTRAINT users_role_known
  CHECK (role IN ('student', 'teacher', 'org'));

-- Sign-in resolves an account by email, so one live account per address. Case-
-- insensitive, because an address is not case-sensitive to the person typing it,
-- and `email IS NOT NULL` because rows that predate accounts have no address and
-- many such rows may share "no address". Created AFTER the column it indexes,
-- which is the order PostgreSQL requires.
CREATE UNIQUE INDEX users_email_live_key
  ON users (lower(email)) WHERE deleted_at IS NULL AND email IS NOT NULL;

COMMENT ON COLUMN users.pass_hash IS
  'scrypt(password, salt) hex (lib/server/auth.ts#hashPassword). Never the password; '
  'never logged. NULL means this identity has no password sign-in.';
COMMENT ON COLUMN users.profile_id IS
  'The learner profile this account owns. Names a profile that is ALLOWED to be gone: '
  'erasure keeps the account and deletes the record, so there is no foreign key here.';

-- ── 3. The database's own record of the processes that have opened it ───────

CREATE TABLE store_boots (
  id           bigserial PRIMARY KEY,
  -- Which backend was serving. Only a `postgres` deployment writes here: a file
  -- store measures the DIRECTORY it lives in (`.openmind-data/boots.json`), which
  -- is the filesystem whose survival the measurement is about, and a row in a
  -- database could not answer that question.
  backend      text NOT NULL,
  -- Which release opened the store. TWO DIFFERENT DEPLOYMENTS MEANING TWO ROWS is
  -- the whole point: a store that has seen more than one is a store that outlived
  -- a release, which is the durability fact a declaration cannot prove.
  deployment   text NOT NULL DEFAULT '',
  release      text,
  booted_at    timestamptz NOT NULL DEFAULT now(),
  -- Epoch milliseconds, the unit the application records everywhere else
  -- (Date.now() in lib/server/boot-log.ts), so the two backends report the same
  -- shape to /api/ready without a conversion that could disagree.
  booted_at_ms bigint NOT NULL,

  CONSTRAINT store_boots_backend_known CHECK (backend IN ('postgres')),
  CONSTRAINT store_boots_deployment_named CHECK (deployment <> '')
);

COMMENT ON TABLE store_boots IS
  'One row per process start that opened this database. Read by /api/ready as '
  'persistence.boots: the only durability evidence measurable from inside a '
  'deployment. NOT proof — a container restarted in place keeps its writable layer, '
  'so this is evidence of survival across a process replacement, and the drill in '
  'npm run verify:persistence is what tests a redeploy.';

CREATE INDEX store_boots_recent_idx ON store_boots (booted_at DESC);
