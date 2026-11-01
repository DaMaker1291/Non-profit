# Pilot scope

**Status: CANDIDATE. Not a school partnership. Not an approved course. Not a claim of South Asia readiness.**

- **Audience:** CBSE Class 10 learners in an English-medium classroom, with a subject teacher present.
- **Curriculum:** CBSE Class X, 2025–26 session. Mathematics (041/241) and Science (086).
- **Level:** Class 10, with `cells` included explicitly as a Class 9 prerequisite.
- **Language:** English medium only. No Hindi, Bengali, Urdu, Nepali, Sinhala or Tamil teaching is claimed.
- **Size:** 12 lessons — 8 mathematics and 4 science. This is a review candidate, not the 135-concept genome.
- **Excluded:** ICSE, state boards, other countries, other languages, the 116 concepts without a complete lesson, full-syllabus coverage, and any learner-effectiveness claim.

Eight mathematics concepts are carried in the published CBSE Class X mapping: fractions, decimals, negatives, order of operations, expansion, linear equations, quadratics, coordinates. That is a mapping, not a claim of Class 10 depth: four are prerequisite foundations, `linear-equations` teaches one-variable equations while the mapping names two-variable systems, and `coordinates` teaches plotting/straight-line graphs while the mapping names distance, section and area formulas. `LESSON_VALIDATION_REPORT.md` records the gap; a teacher must decide whether the prerequisite content is what the class needs. The 4 science lessons are cells, photosynthesis, chemical equations and electric circuits.

**Approval:** `PILOT_APPROVALS` is empty. All 12 lessons are `needs-educator-review`. `approvedPilotPath()` is empty, so no learner path is open. A reviewer must sign the exact lesson version, scope and checklist before any lesson can be approved.

**Review workflow:** the reviewer returns a filled `REVIEW_RECORD_TEMPLATE.json`; `npm run pilot:review -- --file <record>.json` validates the person, role, date, scope, lesson version and checklist. It never writes an approval. The project owner must make the deliberate `PILOT_APPROVALS` change after a valid record is filed.

**Assignment:** a class may be set work only on a lesson that is `approved-for-pilot`. Since no lesson is approved, the set-work picker is empty today. The broader `curriculumConcepts` view remains available to report what the course contains and what has not been measured.

**Rights:** the 12 lessons and their figures are OpenMind-authored. Curriculum documents are cited link-only; no NCERT, CBSE, DIKSHA or other third-party teaching text is copied. `lib/source-registry.ts` blocks ingestion when the licence is unknown or primary proof is absent.

**Content audit:** `LESSON_VALIDATION_REPORT.md` records the lesson-by-lesson technical audit, the corrected chemistry key and figure defects, the curriculum-fit gaps, and the remaining uncertainties. It is not educator review.

**Deployment status:** `DEPLOYMENT_READINESS.md` and `npm run deployment:check` encode the five-stage path. Only Stage 1 (pilot preparation) passes; every school/learner stage is blocked until the named external and technical evidence exists.
