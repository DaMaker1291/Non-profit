-- ─────────────────────────────────────────────────────────────────────────────
-- 0005_profile_record — the `profiles` table could not hold a real profile.
--
-- docs/STORAGE_SPEC.md §5 maps the port onto the schema in a table whose first
-- row reads: "`withLearner`, `getProfile`, `listProfiles`, `saveProfile` →
-- `profiles`, `learner_projections`". The second half is right. The FIRST half is
-- not, and this migration is the correction — found by writing the Postgres
-- backend against the schema rather than by re-reading the mapping table.
--
-- TWO GAPS, each of which would have lost a fact about a learner SILENTLY (a
-- backend written to those columns compiles, round-trips, and returns a profile
-- with everything outside them dropped):
--
--   1. THE DECLARED RECORD. `lib/types.ts#StudentProfile` carries the learner's
--      own statements about themselves: `handle`, `exam`, `examDate`,
--      `timePerDay`, `board`, `grade`, `examples`, `termsMode`, `explainLen`,
--      `resources[]`, four language fields (`language`, `teachingLang`,
--      `answerLang`, `schoolLang`) and `subjectCourses` — ONE COURSE PER
--      SUBJECT, because a learner does not sit one qualification (GCSE Maths
--      Foundation alongside A-Level Physics is ordinary, and a single flat course
--      pitches one subject at the wrong depth). The table models NINE of those
--      facts (`country`, `language`, `birth_year`, `goal`, `intent`, `subjects[]`,
--      `specification_id`, `level_id`, `secret_hash`) and has no column for the
--      rest. A profile saved through the port would have come back as a
--      DIFFERENT learner: their exam date gone, their per-subject courses
--      collapsed to one, their teaching language lost.
--
--   2. THE CAPABILITY SECRET, which is not just a credential. `secret_hash` is
--      the right way to hold a password and the wrong way to hold THIS: sign-in
--      hands the profile's secret BACK to an authenticated session, which is the
--      documented bridge that makes an existing learner work on a brand-new
--      device (`Account.profileId` + the returned secret; a session without it
--      cannot call `/api/progress`). A hash is one-way by design, so a deployment
--      storing only `secret_hash` cannot perform that hand-back at all. The raw
--      secret therefore round-trips in `payload`, exactly as it does today, and
--      `secret_hash` is written from the SAME object in the SAME statement so the
--      two can never disagree about which secret is current. (Storing the raw
--      capability secret is the EXISTING design, not a new decision this
--      migration makes: it is what a profile holds today, and changing it — to a
--      rotating token, say — is a separate security change, not a storage move.)
--
-- THE SHAPE, and it is the repo's own: the columns the application QUERIES stay
-- real columns, and the rest rides as the record the application authored —
-- identical to `rooms`, `papers`, `personal_papers` and `packs`, each of which
-- says so in its own comment ("keeps the fields we query as real columns and the
-- rest as the shape the application authored, so a schema change here does not
-- require rewriting every stored paper"). A backend writes the typed columns and
-- `payload` from ONE object in one statement.
--
-- . `profiles.payload` holds the record half: the `StudentProfile` verbatim plus
--   the capability secret (`{ profile, secret }`).
-- . `learner_projections.model` holds the model half — `progress`, `masteries`,
--   `diagnostics`, `observed`, `seenQuestions`, `projectionBase`, `lastSession` —
--   because those ARE derived from evidence and are rebuildable by replay.
--   Putting them in `payload` as well would be a second copy of the learner
--   model, and the first thing to drift.
--
-- Reversal: the column goes, and it is the only thing that changes an existing
-- row. No data is migrated by this file: the store it describes is not yet
-- serving (docs/STORAGE_SPEC.md slice 3).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN payload jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.payload IS
  'The learner''s OWN record, as the application authored it: the StudentProfile '
  'verbatim (handle, exam, examDate, timePerDay, board, the language fields, '
  'subjectCourses) plus the capability secret. The typed columns beside it are the '
  'facts the database QUERIES; this is the record itself, so adding a field to a '
  'profile does not require rewriting a stored one. The model half of a learner '
  '(progress, masteries, diagnostics, seen items) does NOT live here — it belongs '
  'to learner_projections.model, which is rebuildable by replaying the ledger.';
