# Coordinates — verification record

**Date:** 2026-11-09

**Scope:** the authored `coordinates` lesson, its points, tables and
substitutions, its rendering at four widths, and the server-marked assessment
path through the application.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** **43 authored, 92 outline, 43 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`**. The regenerated audit reports **9
critical gaps, 83 high-priority gaps and 43 lessons awaiting review**. The new
lesson is `machine_checked`; no teacher or learner has reviewed it.

## 1. Why this concept

`coordinates` was the first critical concept in the generated queue. The genome
declares `negatives` as its only prerequisite and makes it a prerequisite of
`straight-lines`, `transformations`, `vectors` and `functions`, so every later
graph topic reads a point whose order and signs this lesson fixes. Its genome
misconception is `axis-swap`, which is the spine of the lesson rather than an
aside.

The concept already had a pilot plan and a drawing: axes with `y = 2x + 1`
through (0, 1), (1, 3) and (2, 5). The authored lesson therefore does **not**
redraw it. It supplies what a picture cannot carry: why the pair is an address,
what a zero coordinate means, why substitution is the test of membership, and
which coordinate an equation fixes when its line is horizontal rather than
vertical.

The scope is matched to the published GCSE mathematics subject content for
algebra and graphs. The source record used for the curriculum claim is the
Department for Education's *GCSE mathematics: subject content and assessment
objectives*:
`https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives`.
No specification, textbook or commercial lesson text is reproduced. The prose,
examples, practice, assessment and the two-path park transfer are original to
OpenMind.

## 2. What the lesson contains

| Part | Content |
|---|---|
| Objectives | Three measurable objectives: plot and read a pair in all four quadrants and explain why order matters; use an equation as a rule and test a point by substitution; distinguish horizontal from vertical lines and read a crossing |
| Prerequisite checks | Two questions targeting `negatives`: `-3 + 5 = 2`, and `2 × (-3) + 1 = -5`, the second being the substitution the lesson actually performs |
| Explanation | Four sections, eight paragraphs: the pair as a journey; the equation as a membership rule; horizontal and vertical lines fixing one coordinate; a crossing as a pair satisfying both rules, including the limits of reading angles off a scaled picture |
| Representations | Three `maths.expression` blocks: a journey with signs; the table for `y = 2x + 1` and the rejection of (2, 4); `y = 3` and `x = -2` with their intersection |
| Worked examples | Plotting A(3, -2), B(-3, 2) and C(0, -4); a table for `y = 2x - 1` and the test of (3, 4); describing `y = 3` and `x = -2` and giving (-2, 3) |
| Misconceptions | Swapping the pair; (0, 3) placed on the x-axis; `y = 3` called vertical |
| Guided practice | Three items with hints and feedback: (-4, -3) in the third quadrant; a table for `y = 3x - 2` and the rejection of (2, 5); the lines `y = -1` and `x = 4` meeting at (4, -1) |
| Independent assessment | One constructed response on P(-2, 5), the swap, the axis correction and (4, 7) on `y = 2x - 1`; `a2` writes (3, -4); `a3` gives the crossing of `x = -2` with the x-axis as (-2, 0) |
| Transfer | Two paths `y = x + 3` and `y = 2x + 1` with checkpoints (-2, 1) and (2, 5): both lie on the first, only (2, 5) lies on both, and `x + 3 = 2x + 1` gives the crossing (2, 5) without drawing; the scale caveat is part of the answer |
| Retrieval | Three prompts at next-day, week-later and month-later spacing |
| Accessibility | Five authored alternatives: points described as journeys in words, readable text sizing, the horizontal move stated before the vertical, direction words instead of colour, and typed answers only |

The browser counts the rendered teaching as 17 prose paragraphs, three
representation blocks, a 387-word transfer and a 69-word retrieval section.

**The drawing is the plan's.** The authored lesson adds no figure of its own; the
page shows the plan's axes. The gate therefore checks the lesson's rule against
the points the drawing plots, so a lesson that taught `y = 2x + 1` beside a
drawing of a different line would fail rather than look consistent.

## 3. Independent coordinate verification

`scripts/coordinates-lesson-check.mjs` compiles the real lesson and evaluates
the points, tables and substitutions behind every pinned claim. It does not
compare a printed string with itself and it does not mark prose.

```bash
node scripts/coordinates-lesson-check.mjs
```

Result: **109 passed, 0 failed**. The assertions cover:

- quadrant placement: (3, -2) fourth, (-3, 2) and (-2, 5) second, (-4, -3)
  third, (0, -4) and (3, 0) on axes;
- the worked points are distinct and their directions match their signs;
- `y = 2x - 1` gives -3, -1, 1, 3 at x = -1, 0, 1, 2; the intercept is (0, -1);
  (3, 4) fails the rule and (3, 5) satisfies it, because the rule gives 5;
- the constant step of 2 in y for each step of 1 in x;
- every point on `y = 3` shares height 3 while its x varies, and every point on
  `x = -2` shares x while its height varies; (-2, 3) satisfies both, and the
  lines cross the axes at (-2, 0) and (0, 3);
- the plan's three points satisfy `y = 2x + 1`, and the lesson's representation
  uses the same rule;
- (2, 4) fails `y = 2x + 1` while (2, 5) passes;
- guided keys: (-4, -3) in the third quadrant; `y = 3x - 2` gives -2, 1, 4, so
  (2, 5) fails and (2, 4) passes; `y = -1` and `x = 4` meet at (4, -1);
- `a1`: P(-2, 5) is second-quadrant, (2, 5) is a different point, (0, 3) is on
  the y-axis, (3, 0) is on the x-axis, and `2(4) - 1 = 7` puts (4, 7) on the
  line;
- `a2 = (3, -4)` and `a3 = (-2, 0)`, with both accepted-answer lists containing
  their own model answers and both carrying marking criteria;
- the transfer: both checkpoints satisfy `y = x + 3`; (-2, 1) fails
  `y = 2x + 1` while (2, 5) passes; `x + 3 = 2x + 1` gives x = 2 and y = 5; the
  paths are 2, 1 and -1 apart at x = 0, 1 and 3, so the crossing is unique;
- retrieval: (-5, 2); `3(3) - 1 = 8` puts (3, 8) on the line; `y = -2` and
  `x = 4` meet at (4, -2).

The first run failed **one** assertion, and it was the harness rather than the
lesson: the assertion asked whether a three-point sample of the horizontal line
contained (-2, 3) instead of asking whether (-2, 3) satisfies `y = 3`. The
assertion was corrected; the lesson was not changed to satisfy it. Several
tautological lines that asserted constants rather than the lesson were removed
before the count was taken, so the total is not padded.

This is independent **coordinate arithmetic** checking, not independent review.
The gate shares an author with the lesson, so it proves the claims agree with
the stated points; it does not prove the teaching is the best account of the
idea, nor that a pupil learned it.

## 4. Browser and application evidence

### Full lesson walk

```bash
LESSON_WALK_SHOTS=0 OPENMIND_DATA_DIR=/tmp/openmind-coordinates-walk npm run verify:lesson
```

Result: **445 passed, 0 failed**. The walk measured all 21 planned lessons at
1280 and 320 px and all **21** authored lessons without a plan at 1280, 768, 375
and 320 px.

For `coordinates` specifically:

- the authored contract renders on the page;
- 3 objectives, 3 misconceptions and 3 guided items are visible;
- 17 prose paragraphs and 3 representation blocks render;
- the draft-status footer is present;
- the transfer is 387 words and the retrieval section 69 words;
- the page measures **320 vs 320**, **375 vs 375**, **768 vs 768** and
  **1280 vs 1280** — no sideways scroll at any measured width;
- its plan's axes drawing still passes the figure measurements it already had.

The walk does not type into the visible assessment input. The HTTP check below
proves the server can mark and persist the deterministic items; it does not
prove the rendered control submits them.

### Assessment path

`scripts/coordinates-live-check.mjs` used the application's real HTTP endpoints
with a fresh scratch learner at `/tmp/openmind-coordinates-walk`:

- `POST /api/profile` created the learner;
- `POST /api/progress` with `action: "lessonCheck"` marked `a2` with `(3, -4)`;
  the response was `correct: true`, carried the model answer and two marking
  criteria, and did not leak the accepted-answer list;
- `a3` with the reversed pair `(0, -2)` was marked `correct: false`, with the
  true crossing `(-2, 0)`;
- `a1`, the constructed response, was refused with `400 not gradable`;
- a wrong capability secret was refused with `401`;
- `profiles.json` stored `lessonCheck: { asked: 2, correct: 1 }`, so neither the
  ungradable item nor the refused secret inflated the count;
- the evidence ledger held exactly **two** events, both
  `questionId: lesson:coordinates:*`, `mode: independent`, `hints: 0`;
- the two events preserved the right and the wrong result separately, under two
  distinct question ids.

Result: **18 passed, 0 failed**. This is API-level evidence. It did not type
into the visible assessment form or observe a rendered verdict.

## 5. Checks actually run

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4630 passed, 0 failed** (three planted failing controls excluded) |
| `npm run verify:lessons` | exit 0; includes the new **109-assertion** coordinates gate |
| `node scripts/coordinates-lesson-check.mjs` | **109 passed, 0 failed** |
| `npm run build` | **exit 0, 69 static pages generated** |
| `npm run verify:lesson` | **445 passed, 0 failed** |
| `node scripts/coordinates-live-check.mjs` | **18 passed, 0 failed** |
| `node scripts/lesson-quality-audit.mjs` | **43 authored · 92 outline · 43 review · 9 critical · 83 high** |
| `node scripts/lesson-catalogue.mjs --write --report` | **43 authored · 92 outline · 43 `machine_checked`** |
| Disk headroom | **7.0 GB free** after the batch-24 cleanup, before the batch-25 build (WARN; the bar refuses below 5.0 GB and watches below 8.0 GB) |

`npm run verify:a11y` was **not** re-run in this batch. The most recent
structural run (batch 23) passed **61/0** with one gated surface not audited;
that result is not evidence about this lesson's assistive-technology behaviour.

## 6. Independent Problem-Solving Capability

The six stages are recorded as **opportunities present**, not pupil outcomes.

| Stage | Opportunity in the lesson | Evidence status |
|---|---|---|
| Understand | The explanation separates the address (order and signs) from the rule (which points belong) and from the direction question (which coordinate is fixed) | Machine-checked structure; no pupil explanation |
| Recognise | Guided items ask for a quadrant, a table from a rule, the rejection of a point, and the crossing of a horizontal and a vertical line | Machine-checked; no pupil response |
| Apply | `a2` and `a3` are marked through the server | Harnessed with a scratch learner; no human score |
| Explain | `a1` asks why the swapped pair is a different place, corrects the axis claim, and requires a substitution to decide membership | Criteria authored; prose deliberately unscored |
| Transfer | The two-path task tests two points against two rules, finds the shared point as the crossing, solves the pair without a drawing, and reasons about what unequal scales can and cannot show | Model answer checked; no pupil attempt |
| Retain | Next-day, week-later and month-later prompts | Scheduled only; no delayed evidence |

The limited claim: the lesson **provides** these opportunities and the
application can mark the deterministic ones. It does not demonstrate that a
pupil can use the knowledge without being told what to do.

## 7. What remains unproven

- **No teacher review.** `reviews` is empty. `machine_checked` is not
  `educator_reviewed`.
- **No learner trial.** `learnerTesting` is empty. The scratch learner is a
  harness, not a pupil, and completion is not learning.
- **No figure authored here.** The page shows the plan's axes, not a drawing
  this lesson owns; a second drawing for the negative-quadrant journey is not
  present.
- **Accessibility was not re-measured this batch.** Screen-reader
  announcements, keyboard-only completion, 200% reflow, contrast ratios and
  diagram alternatives remain unmeasured for this lesson.
- **The assessment check is API-level.** It did not use the visible assessment
  input or observe the rendered verdict.
- **No deferred-retention evidence.** The retrieval prompts are scheduled, not
  delivered or measured.
- **The wider comparison is unfinished.** The Cognito, Seneca, Dr Frost, Isaac
  and other-platform study remains a separate research workstream.
- **Coverage remains the main gap.** 92 concepts still have only an outline or
  plan; 9 are critical.

No claim of publication approval, teacher approval or learner success is made.
