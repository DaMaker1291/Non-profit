# Verification results

Working tree: `main` @ `d7d7505`, dirty before and after this pass (pre-existing graph/paper work preserved). No commit, push or deploy. Pilot/rights checks used `/tmp/openmind-pilot-browser`; the content audit, figure capture and final lesson walk used `/tmp/openmind-lesson-browser`. No real learner record was opened or written.

## Commands actually run on this tree

| Command | Result |
|---|---|
| `npx tsc --noEmit` | **pass** |
| `npm run build` | **pass**, 64 static pages, `/pilot` and `/pilot/[concept]` present. This build was run after the final lesson version, figure and question edits. |
| `npm run verify` | **4,478 passed, 0 failed**. The three planted Promise failures are deliberate controls and are removed from the total. The real-server Postgres half is **skipped with its reason** (`OPENMIND_TEST_DATABASE_URL` absent), not passed. |
| `npm run pilot:check` | **616 passed, 0 failed**. Includes the 25-record source registry, 12/12 rights-clear lessons, the synthetic-approval branch, the empty real registry, the old-version refusal, the AI-reviewer refusal, the English-only language gate, and the five-equation balancing-key regression. |
| `npm run verify:q` | **pass** — 135 generators × 300 draws, 0 problems; 5 prompt-derived, 130 structural-only, 0 human-reviewed. |
| `npm run content-check` | **PASS** — 135 concepts, 135 practisable, 8 named content gaps. |
| `npm run pilot:pack` | **pass** — 12-row inventory, 977-line review packet (962 generated blocks), and `SOURCE_AND_RIGHTS_REGISTRY.md` with 25 records; packet version `2026-11-01.3`. |
| `npm run pilot:review -- --file pilot-readiness/REVIEW_RECORD_TEMPLATE.json` | **refused**, with the missing name/role/date/notes named. Expected: the template is not a review. |
| `npm run pilot:review -- --file /tmp/openmind-review-valid.json` | **accepted** a complete synthetic record for `photosynthesis` and printed the approval it would justify. It did **not** write an approval; `PILOT_APPROVALS` remains empty. |
| `npm run verify:lesson` | **254 passed, 0 failed**. Includes every authored figure at 1280 and 320, the read-stage order, worked-example fade, per-option feedback, repair loop, numeric reset, Spanish/German/French coaching, and the captioned question-figure path. |
| `npm run deployment:check -- --self-test` | **pass** — 5 gate tests, 0 failed; the gate refuses zero approvals and missing technical evidence. |
| `npm run deployment:check -- --stage=pilot-preparation` | **pass** — Stage 1 only; “No learner path is open.” |
| `npm run deployment:check -- --stage=controlled-pilot` | **refused, as required** — names 0/12 educator approvals, 0/12 reviewed mappings, no partner/legal/safeguarding evidence, and missing durable-store, restore, permissions, offline, low-resource, accessibility and teacher-support evidence. |
| `npm run status:check` | **pass** after `npm run status`. |

## Browser checks (production mode)

A production `next start` server was run on `127.0.0.1:4173` with an explicit scratch store and `OPENMIND_ALLOW_EPHEMERAL_STORE=1`. `/api/ready` returned `ready:true`, `data: writable`, and `durability: ephemeral`; it did not expose an absolute filesystem path.

| Page | Viewport | Measured result |
|---|---|---|
| `/pilot/photosynthesis` | 1280×900 | `scrollWidth 1280`, `innerWidth 1280`, **overflow 0**; review state and curriculum provenance rendered. |
| `/pilot/photosynthesis` | 320×640 | `scrollWidth 320`, `innerWidth 320`, **overflow 0**. |
| `/pilot/electricity-circuits` | 320×640 | `scrollWidth 320`, **overflow 0**. |
| `/pilot/equations-stoich` | 320×640 | `scrollWidth 320`, **overflow 0**. |
| `/learn/biology/cells` (synthetic Class 10 profile) | 320×640 | `scrollWidth 320`, **overflow 0**; “Pilot candidate — not yet approved” banner appeared before the teaching. |
| `/learn/maths/addition` (same profile) | 320×640 | `scrollWidth 320`, **overflow 0**; “NOT AVAILABLE AS A LESSON” card, with the genome paragraph only inside “Read the background note (not a lesson)”. |
| `/pilot/photosynthesis` rights panel | 863×900 and 320×640 | `data-rights-status="clear"`; teaching/figures OpenMind-authored, external assets none, CBSE source link-only; overflow 0 at 320. |
| `/pilot` rights coverage | 320×640 | “Rights gate: 12/12 lessons clear; 0 blocked; 0 with external assets”; overflow 0. |

Screenshots saved:

- `pilot-readiness/evidence/pilot-photosynthesis-1280-final.png`
- `pilot-readiness/evidence/pilot-photosynthesis-320-final.png`
- `pilot-readiness/evidence/pilot-electricity-circuits-320-final.png`
- `pilot-readiness/evidence/pilot-equations-stoich-320-final.png`
- `pilot-readiness/evidence/learner-cells-320-final.png`
- `pilot-readiness/evidence/pilot-rights-1280.png`
- `pilot-readiness/evidence/pilot-dashboard-rights-320.png`
- `pilot-readiness/evidence/figure-*-1280.png` and `figure-*-320.png` (8 figures × 2 widths), with measurements in `figure-walk.json`

### Final lesson-figure walk

Run against the development server on `127.0.0.1:4173` with a scratch store. Sixteen captures (eight lesson figures at 1280×900 and 320×640): **0 sideways overflow, 0 measured label collisions, 0 aspect-ratio distortions**. The current–voltage graph now draws the solid line its caption describes; the run label no longer sits on the x-axis ticks. `npm run verify:lesson` also passed every figure at both widths.

The 320 screenshots still show empty space to the right of the captured page. That is the capture surface, not document overflow: the DOM measurement above is the width assertion. No claim is made that the screenshots are a complete visual review.

## Rights gate

`lib/source-registry.ts` records 25 sources: two OpenMind-authored records and 23 external/curriculum records. Only the two authored records are ingestible; the remaining 23 are link-only or blocked. A known Creative Commons basis without primary rights proof (OpenStax, PhET, MIT OCW) is **blocked for ingestion**, not merely warned about. The 12 pilot lessons are clear because they are authored and embed no external asset; the CBSE syllabus is cited link-only.

## Assignment gate

`assignableConcepts` now returns only lessons whose state is `approved-for-pilot`. With `PILOT_APPROVALS` empty, the teacher’s set-work picker is empty and `POST /api/assignments` refuses any unapproved concept. `curriculumConcepts` remains the broader course view used to report “not yet measured,” so the approval gate did not erase the teacher’s curriculum coverage.

## Not run / not passed

- `npm run e2e` was not run. Its assignment section predates the approved-only gate and would need an approval fixture; that fixture does not exist and must not be manufactured.
- `npm run production-check`, `npm run restore-drill`, `npm run storage-check`, `npm run verify:sync`, accessibility, low-end-device and throttled-network tests were not run on this tree.
- No complete offline learning journey was tested: no offline question, marking, reload and sync sequence. `LOW_RESOURCE_TEST_REPORT.md` states the limitation.
- No educator has reviewed any lesson. No learner has used this pilot. No partnership or learning-effectiveness claim exists.
