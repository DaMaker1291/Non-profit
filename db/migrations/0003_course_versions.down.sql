-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_course_versions (down) — remove the content catalogue and the release
-- binding.
--
-- THE COLUMN FIRST, for two reasons. It is the only object here that touches an
-- existing row, and dropping it is the lossless half of the reversal: an event
-- loses its release pointer and keeps everything else, including its verbatim
-- `payload`. And the catalogue tables cannot go while a column still references
-- them (`ON DELETE RESTRICT` on the binding is there precisely so that a release
-- row cannot vanish out from under evidence that names it).
--
-- WHAT THIS LOSES. Which release a piece of evidence was produced under — the
-- §17 guarantee. It does NOT lose the evidence. Re-applying 0003 rebuilds the
-- tables, but the pointer is gone, and there is no honest way to reconstruct
-- which release a historical event belonged to: `audit/content-release.json` and
-- its git history say what the releases WERE, not which one a learner saw. So a
-- production down path needs the release recorded out of band before it runs,
-- and that is documented rather than implied (docs/DEPLOYMENT.md §4).
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS evidence_events_release_idx;

ALTER TABLE evidence_events DROP COLUMN IF EXISTS content_release;

DROP TABLE IF EXISTS question_versions;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS misconceptions;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS concepts;
DROP TABLE IF EXISTS curriculum_configs;
DROP TABLE IF EXISTS content_releases;
