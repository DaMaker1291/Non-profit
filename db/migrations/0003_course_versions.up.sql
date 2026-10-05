-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_course_versions — bind evidence to the content release it was created
-- under (deployment brief §17).
--
-- THE PROBLEM THIS SOLVES. "You cannot have a question bank changing underneath
-- active learners." The curriculum, the question generators and the evidence
-- schema are CODE in this repository, so editing one and deploying it silently
-- rewrites what a learner is taught and what their recorded history MEANS. The
-- repository already answers this at the source: `scripts/verify-content-release.mjs`
-- fingerprints the engines, and `audit/content-release.json` records the release
-- a human reviewed and published. What it cannot do is tell you, months later,
-- which release a particular learner's evidence was produced under — because the
-- record lives in the repository, and the learner does not.
--
-- So the release record becomes a ROW, and every event may point at one.
--
-- WHAT THE AUTHORITY STILL IS. The code, and the fingerprint of it. The catalogue
-- tables below are a MATERIALISED copy of what a release contained, stored so a
-- report can answer "what did `fractions` mean in release X" without checking out
-- an old commit. Nothing reads them to decide what to serve: a database row is
-- not allowed to become a second, silently-diverging definition of the course.
-- The digest column is what keeps that honest — a catalogue row that disagrees
-- with the release's fingerprint is a bug, and it is detectable.
--
-- `content_release` IS NULLABLE, DELIBERATELY. An event recorded before this
-- binding existed has no release to name, and inventing one would be a fabricated
-- fact about a learner's history. Null means "recorded before the binding was
-- introduced"; a non-null value means "recorded under exactly this release".
-- Those are different claims and the schema keeps them apart.
--
-- Reversal: the column goes first (it is the only thing that changes an existing
-- row, and dropping it is lossless), then the catalogue tables children-first.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── The release record ──────────────────────────────────────────────────────
-- `fingerprint` is the identity the repository already computes, so the row and
-- `audit/content-release.json` cannot disagree about which release is which.

CREATE TABLE content_releases (
  fingerprint        text PRIMARY KEY,
  curriculum_hash    text,
  question_bank_hash text,
  -- The evidence schema and projection versions the release was published
  -- against. A change to either is not a content edit — it is a change to what
  -- every stored event means, and it needs a migration, which is exactly why
  -- they travel with the release rather than beside it.
  evidence_schema_version smallint NOT NULL,
  projection_version      smallint NOT NULL,
  reviewed_at        timestamptz,
  published_at       timestamptz NOT NULL DEFAULT now(),
  -- The published record verbatim, so a release can be audited as it was written
  -- rather than as this schema happens to re-express it.
  record             jsonb NOT NULL
);

CREATE INDEX content_releases_published_idx ON content_releases (published_at DESC);

-- ── The catalogue, as of one release ────────────────────────────────────────

CREATE TABLE curriculum_configs (
  id                  text NOT NULL,
  content_release     text NOT NULL REFERENCES content_releases(fingerprint) ON DELETE CASCADE,
  country             text,
  board               text,
  level_id            text,
  payload             jsonb NOT NULL,
  PRIMARY KEY (id, content_release)
);

CREATE TABLE concepts (
  id              text NOT NULL,
  content_release text NOT NULL REFERENCES content_releases(fingerprint) ON DELETE CASCADE,
  subject         text NOT NULL,
  title           text NOT NULL,
  -- Where the course puts it, and what it is built on. Both are stored because
  -- both decide what a learner was offered, so both belong to the record of what
  -- they were taught under.
  stage           integer,
  prereqs         text[] NOT NULL DEFAULT '{}',
  -- Whether the release could serve a question for this concept at all — the fact
  -- that decides if "not measured" was a gap in the learner or in the bank.
  has_generator   boolean NOT NULL DEFAULT false,
  ceiling         double precision,
  payload         jsonb NOT NULL,
  PRIMARY KEY (id, content_release)
);

CREATE TABLE skills (
  id              text NOT NULL,
  content_release text NOT NULL REFERENCES content_releases(fingerprint) ON DELETE CASCADE,
  rank            integer NOT NULL,
  in_bank         boolean NOT NULL DEFAULT true,
  payload         jsonb NOT NULL,
  PRIMARY KEY (id, content_release)
);

CREATE TABLE misconceptions (
  id              text NOT NULL,
  content_release text NOT NULL REFERENCES content_releases(fingerprint) ON DELETE CASCADE,
  concept_id      text,
  payload         jsonb NOT NULL,
  PRIMARY KEY (id, content_release)
);

CREATE INDEX misconceptions_concept_idx ON misconceptions (concept_id, content_release);

-- ── Authored items and their revisions ──────────────────────────────────────
-- Generated items are produced from code and identified by `concept:seed`; these
-- tables are for the items that have a life of their own — an authored or
-- licensed item that is revised, retired, or has its difficulty re-reviewed.
-- `question_versions` is append-only in spirit: a revision is a new row, so a
-- learner's evidence names the exact revision that was served.

CREATE TABLE questions (
  id              text PRIMARY KEY,
  content_release text NOT NULL REFERENCES content_releases(fingerprint) ON DELETE CASCADE,
  concept_id      text NOT NULL,
  source          text NOT NULL DEFAULT 'openmind_authored',
  created_at      timestamptz NOT NULL DEFAULT now(),
  retired_at      timestamptz,
  CONSTRAINT questions_source_known CHECK (source IN ('openmind_authored', 'board', 'licensed'))
);

CREATE INDEX questions_concept_idx ON questions (concept_id) WHERE retired_at IS NULL;

CREATE TABLE question_versions (
  question_id  text NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  revision     integer NOT NULL,
  at           timestamptz NOT NULL DEFAULT now(),
  difficulty   double precision,
  -- The item as served, so "what did this question actually say" is answerable
  -- for an answer that was graded years ago.
  payload      jsonb NOT NULL,
  PRIMARY KEY (question_id, revision)
);

-- ── The binding itself ──────────────────────────────────────────────────────

ALTER TABLE evidence_events
  ADD COLUMN content_release text REFERENCES content_releases(fingerprint) ON DELETE RESTRICT;

-- Every replay of a learner's history reads events by release, and NULL (recorded
-- before the binding) has to be as cheap to find as a named release.
CREATE INDEX evidence_events_release_idx ON evidence_events (content_release, at DESC);

COMMENT ON COLUMN evidence_events.content_release IS
  'The content release this event was recorded under. NULL means it predates the '
  'binding — never a guess, and never backfilled with the release of the day.';
