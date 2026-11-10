# Algebraic expressions — verification record

**Date:** 2026-11-09

**Scope:** the authored `algebra-expressions` lesson, its arithmetic, its rendering
at four widths, and the server-marked assessment path through the application.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** **39 authored, 96 outline, 39 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`**. The audit reports **13 critical gaps,
83 high-priority gaps and 39 lessons awaiting review**. The new lesson is
`machine_checked`; no teacher or learner has reviewed it.

## 1. Why this concept

`algebra-expressions` was the first critical concept in the generated queue when
this batch began. It is also a declared prerequisite of `algebra-expand`,
`linear-equations`, `functions` and `proof` in `lib/genome.ts`, so teaching it
before those concepts follows the prerequisite graph rather than queue order
alone.

The lesson declares `order-ops` as its only prerequisite. Its two diagnostics
both target `order-ops`, because a learner who evaluates `3 + 4 × 2` left to
right will read an algebraic expression with the same wrong convention and cannot
expand a bracket reliably.

The scope is cited against the published GCSE mathematics subject content for
algebra: notation, collecting like terms, expanding brackets and substitution.
No specification, textbook or commercial lesson text is reproduced. The prose,
examples, practice, assessment and transfer task are original to OpenMind.

## 2. What the lesson contains

| Part | Content |
|---|---|
| Objectives | Three measurable objectives: read a coefficient; collect like terms and explain unlike terms; expand a bracket and check by substitution |
| Prerequisite checks | Two questions targeting `order-ops`: `3 + 4 × 2` and `(3 + 4) × 2` |
| Explanation | Four sections, eight paragraphs: a letter as a named quantity; like terms; expanding a whole bracket; substitution as the check |
| Representations | `3x + 4` as boxes and counters; a three-by-`(x + 4)` area model; collecting `7x + 4 − 3x + 9` by family |
| Worked examples | `7x + 4 − 3x + 9 = 4x + 13`; `3(2x − 5) + 4x = 10x − 15`, each with a reason for every move and a substitution |
| Misconceptions | `3x + 2y = 5xy`; `3(x + 4) = 3x + 4`; `x × x = 2x`, each with a counterexample and a correction |
| Guided practice | Three items with hints and correct/incorrect feedback |
| Independent assessment | One constructed response (`a1`), plus deterministic short answers `a2 = 5x + 7` and `a3 = 8x − 12` |
| Transfer | A rectangle of width `x` and length `2x + 5`: form and simplify the perimeter, then evaluate at `x = 8` |
| Retrieval | Three prompts at next-day, week-later and month-later spacing |
| Accessibility | Four authored alternatives: screen-reader wording, low-vision layout, dyslexia-friendly separation of families, and no motor-only interaction |

The browser counts the rendered teaching as 17 prose paragraphs, three
representation blocks, a 212-word transfer and a 41-word retrieval section.

## 3. Independent arithmetic verification

`scripts/algebra-lesson-check.mjs` compiles the real lesson and evaluates its
claims with `mathjs`; it does not compare a printed string with itself.

```bash
node scripts/algebra-lesson-check.mjs
```

Result: **46 passed, 0 failed**. The assertions cover:

- `7x + 4 − 3x + 9 = 4x + 13` at `x = 2` and `x = −3`;
- `3(2x − 5) + 4x = 10x − 15` at `x = 2` and `x = 0`;
- `5x + 8 − 2x + 3 = 3x + 11` at `x = 4`;
- `2(3x + 4) = 6x + 8` at `x = 1`;
- `4x − 3 = −11` at `x = −2`;
- `8x + 5 − 3x + 2 = 5x + 7` at `x = 4`;
- `4(2x − 3) = 8x − 12` at `x = 3`;
- `4x + 3x − 2 = 7x − 2` at `x = 2`;
- `5(x − 2) = 5x − 10` at `x = 3`;
- the unlike-term counterexamples: `3x + 2y = 10` versus `5xy = 20` at
  `x = y = 2`; `x² = 9` versus `2x = 6` at `x = 3`; `3x + 2x² = 14` versus
  `5x² = 20` at `x = 2`;
- the transfer perimeter `2x + 2(2x + 5) = 6x + 10`, `P(8) = 58`, and the same
  `58` from the actual dimensions `2(8 + 21)`;
- both deterministic keys accept their own model answers;
- the contract shape, declared `draft` status, empty review arrays and the
  prerequisite pointing only at `order-ops`.

This is independent arithmetic, not independent subject-teacher review. It
proves the printed values agree with the algebra; it does not prove the
explanation is the best way to teach the idea.

## 4. Browser and application evidence

### Full lesson walk

```bash
LESSON_WALK_SHOTS=0 OPENMIND_DATA_DIR=/tmp/openmind-walk-algebra2 npm run verify:lesson
```

Result: **417 passed, 0 failed**. The walk measured all 21 planned lessons at
1280 and 320 px and all **17** authored lessons without a plan at 1280, 768, 375
and 320 px.

For `algebra-expressions` specifically:

- the authored contract renders on the page;
- 3 objectives, 3 misconceptions and 3 guided items are visible;
- 17 prose paragraphs and 3 representation blocks render;
- the draft-status footer is present;
- the rectangle figure is 520 × 302 px, its labels are 18 px, its caption names
  the `3(x + 4)` area model, and the SVG is `aria-hidden`;
- the drawing and its labels fit at 320 px, and the page measures 320 vs 320,
  375 vs 375, 768 vs 768 and 1280 vs 1280 (no sideways scroll).

The first walk attempt failed before the wizard because a stale generated
`.next-dev` served the onboarding loading shell while the server answered 200.
Deleting only that generated cache and restarting with a fresh scratch store
fixed it; no product code was changed for the cache. The successful run used
`/tmp/openmind-walk-algebra2` and did not open the live `.openmind-data` store.

### Assessment path

A separate live check used the application's real HTTP endpoints with a fresh
scratch learner at `/tmp/openmind-algebra-check`:

- `POST /api/profile` created the learner;
- `POST /api/progress` with `action: "lessonCheck"` marked a wrong and a right
  answer for `a2` and `a3`;
- the marked responses returned the authored model answer and marking criteria;
- the constructed response `a1` was refused with `400 not gradable`, so no
  fabricated mark was recorded for prose;
- `GET /api/evidence` returned **four** events, all
  `questionId: lesson:algebra-expressions:*`, `mode: independent`, `hints: 0`
  and `source: practice`;
- `profiles.json` stored `lessonCheck: { asked: 4, correct: 2 }` for the
  learner.

Result: **16 passed, 0 failed**. The first instrumentation attempt reported one
false failure because it expected ASCII `-` while the authored model answer uses
the Unicode minus `−`; the comparison is now Unicode-normalised. The product
marked both forms correctly. This check drives the API, not the visible input
control; the browser walk separately proves the page renders.

The full browser walk is not a completion trial. It proves that a learner can
open the lesson and that the authored sections paint; the API check proves the
assessment can mark and persist. Neither is evidence that a pupil learned the
concept.

## 5. Checks actually run

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 after the lesson was wired |
| `npm run verify` | **4630 passed, 0 failed** |
| `npm run verify:lessons` | exit 0; **39 authored · 96 outline · 39 `machine_checked` · 0 unresolved** |
| `node scripts/algebra-lesson-check.mjs` | **46 passed, 0 failed** |
| `npm run build` | **exit 0, 69 static pages generated** |
| `npm run verify:lesson` | **417 passed, 0 failed** |
| Live assessment check | **16 passed, 0 failed** |
| `npm run disk-headroom` | **7.6 GB free before the build** (WARN; bar refuses below 5.0 GB) and **7.9 GB free after it**; the build passed |

`npm run verify:a11y` was **73/0** on the previous batch's public-route and
`/access` audit. It was not rerun for this lesson and is structural only; it is
not a WCAG conformance claim.

## 6. Independent Problem-Solving Capability

The six stages are recorded as **opportunities present**, not pupil outcomes.

| Stage | Opportunity in the lesson | Evidence status |
|---|---|---|
| Understand | The eight-paragraph explanation and the coefficient/area model | Machine-checked structure; no pupil explanation |
| Recognise | Guided items and the three misconception contrasts | Machine-checked; no pupil response |
| Apply | `a2` and `a3` are marked through the server | Harnessed with a scratch learner; no human score |
| Explain | `a1` asks for reasoning and supplies marking criteria | Criteria authored; prose is deliberately unscored |
| Transfer | The rectangle perimeter requires forming, simplifying and evaluating | Model answer checked; no pupil attempt |
| Retain | Next-day, week-later and month-later prompts | Scheduled only; no delayed evidence |

The important claim is limited: the lesson **provides** these opportunities and
the application can mark the deterministic ones. It does not demonstrate that a
pupil can use the knowledge without being told what to do.

## 7. What remains unproven

- **No teacher review.** `reviews` is empty. `machine_checked` is not
  `educator_reviewed`.
- **No learner trial.** `learnerTesting` is empty. The scratch learner is a
  harness, not a pupil, and completion is not learning.
- **Accessibility is incomplete.** The browser walk measured layout and label
  geometry, not screen-reader announcements, keyboard-only completion, switch or
  eye-gaze input, 200% text reflow, colour-contrast ratios, or mathematical
  notation as read by assistive technology.
- **The assessment check is API-level.** It did not type into the visible
  assessment input or observe the rendered verdict; that remains a browser
  interaction check.
- **No deferred-retention evidence.** The retrieval prompts are scheduled, not
  delivered or measured.
- **Research access remains partial.** The wider Cognito, Seneca, Dr Frost and
  Isaac comparison is a separate workstream and is not claimed complete here.
- **Coverage remains the main gap.** 96 concepts still have only an outline or
  plan; 13 are critical.

No claim of publication approval, teacher approval or learner success is made.
