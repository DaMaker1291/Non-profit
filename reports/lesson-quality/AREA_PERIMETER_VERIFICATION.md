# Area and perimeter — verification record

**Date:** 2026-11-09

**Scope:** the authored `area-perimeter` lesson, its arithmetic and units, its
rendering at four widths, and the server-marked assessment path through the
application.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** **41 authored, 94 outline, 41 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`**. The regenerated audit reports **11
critical gaps, 83 high-priority gaps and 41 lessons awaiting review**. The new
lesson is `machine_checked`; no teacher or learner has reviewed it.

## 1. Why this concept

`area-perimeter` was the first critical concept in the generated queue when this
batch began. It is a declared prerequisite of `volume`, `circle-area-arc` and
`pythagoras` in `lib/genome.ts`, and the genome gives it no earlier concept. The
lesson therefore names the two foundations it actually uses, `multiplication`
and `decimals`, and probes both rather than assuming a course order.

The scope is matched to the published GCSE mathematics subject content and the
National Curriculum: perimeter and area of rectangles, triangles,
parallelograms and trapezia; compound shapes; and units of area. The source
record used for the curriculum claim is the Department for Education's
*GCSE mathematics: subject content and assessment objectives*:
`https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives`.
No specification, textbook, commercial lesson or worksheet text is reproduced.
The prose, examples, practice, assessment and the path-around-a-lawn transfer
are original to OpenMind.

## 2. What the lesson contains

| Part | Content |
|---|---|
| Objectives | Three measurable objectives: distinguish perimeter from area and calculate both for a rectangle; derive and use triangle, parallelogram and trapezium formulas; find area and perimeter of compound shapes and convert square units |
| Prerequisite checks | Two questions targeting `multiplication` (`6 × 7`) and `decimals` (`2.5 × 4`), both probed rather than assumed |
| Explanation | Four sections, eight paragraphs: boundary versus surface; the three derived formulas; split, complete and subtract for compound shapes; square units and the square of the scale factor |
| Representations | Three mathematics blocks: a 7.5 m by 4 m rectangle as 30 m² and 23 m; the triangle/parallelogram/trapezium formulas with numbers; an L-shape whose corner removal leaves 54 m² but 32 m |
| Worked examples | A 7.5 m by 4 m lawn; a 12 cm by 9 cm triangle, the equal-base parallelogram and a 6/10/5 trapezium; a 10 m by 6 m yard with a 3 m by 2 m store in one corner — each move gives its reason |
| Misconceptions | Adding sides finds area; 1 m² = 100 cm²; a triangle's area is base × height without the half |
| Guided practice | Three items with hints and correct/incorrect feedback: a 9 × 4 rectangle, a 14 × 6 triangle, and an 8 × 5 rectangle with a 2 × 3 corner removed |
| Independent assessment | One constructed response on 2 m by 50 cm and the L-shape method; `a2` finds the area of 2.4 m by 1.5 m; `a3` finds the area of a trapezium with parallel sides 5 cm and 9 cm and height 4 cm |
| Transfer | A 1 m path around a 7.5 m by 4 m lawn: find the path area and the outside perimeter, and explain why the lawn's perimeter × 1 m misses the four corner regions |
| Retrieval | Three prompts at next-day, week-later and month-later spacing |
| Accessibility | Five authored alternatives: spoken descriptions of every shape, low-vision layout, a consistent calculation order, colour-independent naming, and no motor-only interaction |

The browser counts the rendered teaching as 17 prose paragraphs, three
representation blocks, a 273-word transfer and a 79-word retrieval section.

**Representation limitation.** The lesson has no geometric drawing. The three
blocks are written equations and descriptions, not a rendered rectangle, L-shape
or trapezium. That keeps every answer independent of visual estimation, but a
learner cannot inspect the corner-removal claim as a picture. No new figure kind
was invented here, and the lesson does not claim one exists.

## 3. Independent arithmetic and unit verification

`scripts/area-perimeter-lesson-check.mjs` compiles the real lesson and evaluates
the arithmetic behind every pinned claim. It does not compare a printed string
with itself and it does not mark prose.

```bash
node scripts/area-perimeter-lesson-check.mjs
```

Result: **76 passed, 0 failed**. The assertions cover:

- `7.5 × 4 = 30 m²` and `2(7.5 + 4) = 23 m`, with the two quantities kept
  distinct;
- `½ × 12 × 9 = 54 cm²`, `12 × 9 = 108 cm²`, and the parallelogram being twice
  the triangle;
- `½(6 + 10) × 5 = 40 cm²`, the average parallel width of 8 cm, and the
  equivalent `8 × 5` rectangle;
- `10 × 6 − 3 × 2 = 54 m²` and the unchanged perimeter of `32 m`, checked both
  from the outer dimensions and by walking the boundary;
- two independent splits of the L-shape both giving `54 m²`;
- `1 m = 100 cm`, `1 m² = 10,000 cm²`, `2 × 0.5 = 1 m²`,
  `200 × 50 = 10,000 cm²`, and the perimeter `5 m = 500 cm`;
- the three guided keys: `36 cm² / 26 cm`, `42 m²`, and `34 m² / 26 m`;
- `a2 = 3.6 m²` and `a3 = 28 cm²`, with both accepted-answer lists containing
  their own model answers;
- the path: outer `9.5 m by 6 m = 57 m²`, inner `30 m²`, path `27 m²`, outside
  perimeter `31 m`, and the explicit failure of `23 × 1` to reach `27`;
- retrieval: `56 cm²`, `0.6 m² / 3.8 m`, and `41 m² / 28 m`.

This is independent arithmetic and unit checking, not independent teacher
review. It proves the numbers agree with the stated geometry; it does not prove
the explanation is the best way to teach the idea, nor that a pupil learned it.

## 4. Browser and application evidence

### Full lesson walk

```bash
LESSON_WALK_SHOTS=0 OPENMIND_DATA_DIR=/tmp/openmind-area-walk npm run verify:lesson
```

Result: **431 passed, 0 failed**. The walk measured all 21 planned lessons at
1280 and 320 px and all **19** authored lessons without a plan at 1280, 768, 375
and 320 px.

For `area-perimeter` specifically:

- the authored contract renders on the page;
- 3 objectives, 3 misconceptions and 3 guided items are visible;
- 17 prose paragraphs and 3 representation blocks render;
- the draft-status footer is present;
- the transfer is 273 words and the retrieval section 79 words;
- the page measures **320 vs 320**, **375 vs 375**, **768 vs 768** and
  **1280 vs 1280** — no sideways scroll at any measured width.

The walk does not type into the visible assessment input. The HTTP check below
proves the server can mark and persist the deterministic items; it does not
prove the rendered control submits them.

### Assessment path

A separate live check used the application's real HTTP endpoints with a fresh
scratch learner at `/tmp/openmind-area-live`:

- `POST /api/profile` created the learner;
- `POST /api/progress` with `action: "lessonCheck"` marked `a2` with `3.6 m²`;
  the response was `correct: true` and carried the model answer and its marking
  criteria;
- `a3` with `56` was marked `correct: false`, with the true area `28 cm²`;
- `a1`, the constructed response, was refused with `400 not gradable`; the
  server did not turn prose into a mark;
- a wrong capability secret was refused with `401`;
- `GET /api/progress` and `profiles.json` both stored
  `lessonCheck: { asked: 2, correct: 1 }`;
- the evidence ledger held exactly **two** events, both
  `questionId: lesson:area-perimeter:*`, `mode: independent`, `hints: 0`;
- the two events preserved the right and the wrong result separately.

Result: **13 passed, 0 failed**. This is API-level evidence. It did not type into
the visible assessment form or observe a rendered verdict.

### Accessibility

`npm run verify:a11y` passed **61/0**, with one gated surface (`/curriculum`,
which renders no heading for a signed-out visitor) explicitly **not audited**.
The audit is structural only.

The first run in this batch reported **59 passed, 2 failed** on the `/access`
size control. A focused browser probe showed the three-button group was present
and correctly pressed; the audit had read the group while the route was still
reloading after its own `location.reload()`, and its selector took the first
`[role=group]` with any button rather than the size group. The audit now selects
the three-button group by its accessible label or exactly three buttons and
waits for hydration; the assertion itself was not weakened. This was a harness
correction, not a product change.

The audit does **not** measure screen-reader announcements, keyboard-only
completion of this lesson, switch or eye-gaze input, 200% text reflow, colour
contrast ratios, captioning, or mathematical notation as read by assistive
technology. No claim of WCAG conformance is made.

## 5. Checks actually run

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4630 passed, 0 failed** (three planted failing controls excluded) |
| `npm run verify:lessons` | exit 0; includes the new **76-assertion** area/perimeter gate |
| `node scripts/area-perimeter-lesson-check.mjs` | **76 passed, 0 failed** |
| `npm run build` | **exit 0, 69 static pages generated** |
| `npm run verify:lesson` | **431 passed, 0 failed** |
| Live assessment check | **13 passed, 0 failed** |
| `npm run verify:a11y` | **61 passed, 0 failed, 1 gated surface not audited**; structural only |
| `node scripts/lesson-quality-audit.mjs` | **41 authored · 94 outline · 41 review · 11 critical · 83 high** |
| `node scripts/lesson-catalogue.mjs --write --report` | **41 authored · 94 outline · 41 `machine_checked`** |
| Disk headroom | **6.5 GB free** immediately before the build (WARN; the bar refuses below 5.0 GB and watches below 8.0 GB) |

## 6. Independent Problem-Solving Capability

The six stages are recorded as **opportunities present**, not pupil outcomes.

| Stage | Opportunity in the lesson | Evidence status |
|---|---|---|
| Understand | The eight-paragraph explanation starts from the boundary/surface distinction and derives each formula from a rectangle | Machine-checked structure; no pupil explanation |
| Recognise | Guided items ask the learner to choose area or perimeter, use the half, and subtract a corner | Machine-checked; no pupil response |
| Apply | `a2` and `a3` are marked through the server | Harnessed with a scratch learner; no human score |
| Explain | `a1` asks for the unit conversion and the compound-shape method, and supplies marking criteria | Criteria authored; prose deliberately unscored |
| Transfer | The path around the lawn requires enlarging both dimensions, subtracting the inner region, explaining the corners and giving a separate perimeter | Model answer checked; no pupil attempt |
| Retain | Next-day, week-later and month-later prompts | Scheduled only; no delayed evidence |

The limited claim: the lesson **provides** these opportunities and the
application can mark the deterministic ones. It does not demonstrate that a
pupil can use the knowledge without being told what to do.

## 7. What remains unproven

- **No teacher review.** `reviews` is empty. `machine_checked` is not
  `educator_reviewed`.
- **No learner trial.** `learnerTesting` is empty. The scratch learner is a
  harness, not a pupil, and completion is not learning.
- **No geometric drawing.** The lesson describes the rectangle, L-shape and
  trapezium in text and equations; it does not draw them.
- **Accessibility is incomplete.** The audit is structural; the human and
  assistive-technology checks in §4 are unmeasured.
- **The assessment check is API-level.** It did not use the visible assessment
  input or observe the rendered verdict.
- **No deferred-retention evidence.** The retrieval prompts are scheduled, not
  delivered or measured.
- **The wider comparison is unfinished.** The Cognito, Seneca, Dr Frost, Isaac
  and other-platform study remains a separate research workstream.
- **Coverage remains the main gap.** 94 concepts still have only an outline or
  plan; 11 are critical.

No claim of publication approval, teacher approval or learner success is made.
