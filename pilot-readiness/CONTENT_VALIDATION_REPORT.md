# Content validation

## What changed
- Added 4 complete science lessons: `cells`, `photosynthesis`, `equations-stoich`, `electricity-circuits`. Each has an objective, intuition, 5–6 idea paragraphs, a glossary, two fully worked examples, three named traps, a recap and a curriculum mapping.
- Added `lib/pilot.ts`: explicit DRAFT / NEEDS_EDUCATOR_REVIEW / APPROVED_FOR_PILOT / UNAVAILABLE_FOR_PILOT states; approval is version-, scope- and language-specific; no review is generated.
- The learner page now refuses to render a fallback paragraph as a lesson. It shows an explicit “not available as a lesson” card and keeps the genome paragraph behind “background note (not a lesson)”.
- The teacher assignment picker no longer offers concepts with no complete lesson, and now excludes complete-but-unreviewed lessons too. With zero approvals the picker is empty; the broader course view still reports unmeasured concepts.
- Added `REVIEW_RECORD_TEMPLATE.json` and `scripts/pilot-review.mjs`: a reviewer supplies name, role, date, scope, version and checklist. The validator refuses a tool signing as the reviewer, a future date, an incomplete checklist, a required-revision approval, and an old lesson version. It does not write an approval.

## Verified
- `npm run pilot:check`: **616 passed, 0 failed**. Drives the real resolver, approval validator, mapping table, source registry, rights decisions and question bank, including a five-equation balancing-key regression.
- 12 pilot lessons, 8 maths + 4 science; 12 structurally complete; 0 approved; 0 reviewers.
- Every pilot lesson has a generator; 96 sampled draws were inspected, and one wrong key was found and corrected (`4 and 3` → `4 and 2` for `4Fe + 3O₂ → 2Fe₂O₃`). Every served view still withholds the key.
- The final `npm run verify:lesson` run passed **254 assertions, 0 failures**; all eight lesson figures passed at 1280 and 320.
- All 12 lessons are rights-clear: teaching and figures are OpenMind-authored, external assets are none, and curriculum sources are link-only. The registry has 25 records; only 2 are ingestible.
- Maximum teaching-text similarity between pilot lessons: below the 0.35 threshold asserted by the gate.
- Science lessons have ≥2 authored worked examples, ≥4 glossary terms, ≥3 traps and ≥3 recap points.

## Content audit findings

- The agent’s technical audit is recorded lesson by lesson in `LESSON_VALIDATION_REPORT.md`. It corrected a wrong chemical-equation key, added the missing current–voltage line, moved a colliding graph label, showed the four equal pie slices, added an origin-only grid to the “which axis?” practice branch, and tightened two overstatements.
- The audit is **AI-assisted, not independent human review**. No educator has checked the items or plans.
- `linear-equations` teaches one-variable equations while the CBSE mapping names two-variable linear equations; `coordinates` teaches plotting/straight-line graphs while the mapping names distance, section and area formulas. Both must not be approved as full Class 10 coverage without a teacher decision or revision.

## Unresolved
- **No educator has reviewed any lesson.** All 12 are `needs-educator-review`.
- No independent human subject check of the four new science lessons or the eight mathematics lessons has happened.
- The existing 15 mathematics plans were not systematically rewritten; the audit changed the pilot content only, and 8 of the 15 are in the pilot.
- 116 concepts still have no complete lesson. They are no longer presented as lessons, but they are still a coverage gap.
