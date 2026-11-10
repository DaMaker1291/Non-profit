# Angles and lines — verification record

**Date:** 2026-11-09

**Scope:** the authored `angles-lines` lesson, its geometry, its rendering at four
widths, and the server-marked assessment path through the application.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** **40 authored, 95 outline, 40 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`**. The generated audit reports **12
critical gaps, 83 high-priority gaps and 40 lessons awaiting review**. The new
lesson is `machine_checked`; no teacher or learner has reviewed it.

## 1. Why this concept

`angles-lines` was the first critical concept in the generated queue when this
batch began. It is also a declared prerequisite of `circle-theorems` and
`loci-constructions` in `lib/genome.ts`. Its genome entry declares no earlier
concept, so the lesson names the two foundations it actually uses — subtraction
and division — and probes both rather than assuming a course order.

The scope is cited against the published GCSE mathematics subject content and
the National Curriculum: angles at a point and on a straight line, vertically
opposite angles, alternate and corresponding angles on parallel lines, and the
interior angles of polygons. No specification, textbook, commercial lesson or
worksheet text is reproduced. The prose, examples, practice, assessment and
transfer task are original to OpenMind.

The two public teaching treatments consulted for sequence and common errors were
Oak National Academy's *Geometrical properties: polygons* unit and BBC Bitesize's
angle-facts material. Oak separates corresponding, alternate and co-interior
angles and treats the parallel-line reasoning explicitly; BBC groups the
straight-line, point and triangle facts. AQA's published GCSE subject content
also warns that colloquial terms such as "Z angles" are not acceptable. That
warning is the reason the lesson treats F and Z shapes as memory cues, not as
reasons, and makes the named relationship part of the assessment.

## 2. What the lesson contains

| Part | Content |
|---|---|
| Objectives | Three measurable objectives: use straight-line, point and vertically opposite facts; use alternate, corresponding and co-interior angles with a reason; derive and use polygon interior and exterior sums |
| Prerequisite checks | Two questions targeting `subtraction` (`180 − 68`) and `division` (`720 ÷ 6`), both probed rather than assumed |
| Explanation | Four sections, eight paragraphs: turn totals; parallel lines and the reason the pairs work; triangles and polygon derivation; writing the reason and checking feasibility |
| Representations | Three `maths.expression` blocks: a straight-line/point equation; alternate and co-interior pairs; the polygon formula and a regular pentagon |
| Worked examples | `52°`, `63°` and `x` on a straight line; a `68°` transversal with alternate and co-interior angles; a regular pentagon's interior and exterior angles — each with a reason for every move and a check |
| Misconceptions | A Z shape alone proves equality; co-interior angles are equal; `(n − 2) × 180°` is one angle rather than the total |
| Guided practice | Three items with hints and correct/incorrect feedback |
| Independent assessment | One constructed response asking for a parallel-line explanation and a critique of the Z cue; `a2` solves `3x + 15 + 2x + 35 = 180`; `a3` finds the sides of a regular polygon with exterior angle `24°` |
| Transfer | Three regular hexagons fit at a vertex; three regular pentagons do not; the learner must calculate both interior angles and compare whole-number multiples with `360°` |
| Retrieval | Three prompts at next-day, week-later and month-later spacing |
| Accessibility | Five authored alternatives: spoken descriptions of every diagram, low-vision layout, dyslexia-friendly calculation order, colour-independent naming, and no motor-only interaction |

The browser counts the rendered teaching as 17 prose paragraphs, three
representation blocks, a 234-word transfer and a 71-word retrieval section.

**Representation limitation.** This lesson has no pilot plan, so it has no
figure record and no drawing. The three representations are equations with
written descriptions of the angle positions. That is sufficient to teach the
facts and to keep every answer independent of visual estimation, but a future
diagram kind for angles would make the parallel-line relationship easier to
inspect. No such figure kind was invented here, and the lesson does not claim
one exists.

## 3. Independent geometry verification

`scripts/angles-lesson-check.mjs` compiles the real lesson and evaluates the
arithmetic behind every pinned claim. It does not compare a printed string with
itself.

```bash
node scripts/angles-lesson-check.mjs
```

Result: **67 passed, 0 failed**. The assertions cover:

- `52° + 63° + 65° = 180°` on a straight line;
- `60° + 95° + 105° + 100° = 360°` around a point;
- a `30°` angle's vertically opposite and neighbouring angles;
- `68° + 112° = 180°` for the co-interior pair;
- `81° + 47° + 52° = 180°` in a triangle;
- the polygon derivation for every `n` from 3 to 12, and the pentagon, hexagon
  and octagon totals;
- regular pentagon `108°` interior and `72°` exterior, with `108° + 72° = 180°`;
- regular hexagon `120°` and `60°`; regular octagon `135°` and `45°`;
- the sum of eight `45°` exterior turns and fifteen `24°` turns;
- `a2` at `x = 26`: `93° + 87° = 180°`;
- `a3`: `360° ÷ 24° = 15` and `15 × 24° = 360°`;
- the transfer's exact hexagon fit (`3 × 120° = 360°`), the pentagon gap
  (`3 × 108° = 324°`), the overlap (`4 × 108° = 432°`) and the non-divisibility
  of `360°` by `108°`;
- both deterministic keys accepting their own model answers;
- the contract shape, declared `draft` status, empty review and learner-testing
  arrays, two probes, and the three representations.

This is independent arithmetic and fact checking, not independent teacher
review. It proves the numbers agree with the stated geometry; it does not prove
the explanation is the best way to teach the idea.

## 4. Browser and application evidence

### Full lesson walk

```bash
LESSON_WALK_SHOTS=0 OPENMIND_DATA_DIR=/tmp/openmind-walk-angles npm run verify:lesson
```

Result: **424 passed, 0 failed**. The walk measured all 21 planned lessons at
1280 and 320 px and all **18** authored lessons without a plan at 1280, 768, 375
and 320 px.

For `angles-lines` specifically:

- the authored contract renders on the page;
- 3 objectives, 3 misconceptions and 3 guided items are visible;
- 17 prose paragraphs and 3 representation blocks render;
- the draft-status footer is present;
- the transfer is 234 words and the retrieval section 71 words;
- the page measures **320 vs 320**, **375 vs 375**, **768 vs 768** and
  **1280 vs 1280** — no sideways scroll at any measured width.

The walk does not complete the assessment through the visible input control; it
proves that the authored sections paint. The API check below proves that the
server can mark and persist the deterministic items.

### Assessment path

A separate live check used the application's real HTTP endpoints with a fresh
scratch learner at `/tmp/openmind-angles-live`:

- `POST /api/profile` created the learner;
- `POST /api/progress` with `action: "lessonCheck"` marked a wrong and a right
  answer for `a2` and `a3`;
- the marked responses returned the authored model answer and marking criteria;
- the constructed response `a1` was refused with `400 not gradable`, so no
  fabricated mark was recorded for prose;
- a wrong capability secret was refused with `401`;
- an unknown item was refused with `404 no such assessment`;
- `profiles.json` stored `lessonCheck: { asked: 4, correct: 2 }` for the
  learner;
- one evidence ledger held **four** events, all
  `questionId: lesson:angles-lines:*`, `mode: independent`, `hints: 0`,
  `source: practice` and `subject: maths`.

Result: **25 passed, 0 failed**. The first instrumentation attempt reported one
false failure because it asserted a POST profile response would not contain a
`progress` field; the route's public profile shape does contain it. The
assertion was corrected to check the returned handle and new-profile marker.
That was a harness claim, not a product defect.

### Accessibility and human limits

The structural access audit, run against a live server, initially reported
**72 of 73**. The one failure was not a page defect: the audit observed the boot
class on `<html>` before `AccessProvider` had loaded the stored preference, then
clicked Standard while React still held the default and therefore did nothing.
The audit now waits for the hydrated control state before clicking; its
assertion is unchanged. The rerun passed **73 of 73**.

The audit is structural only. It does **not** measure screen-reader
announcements, keyboard-only completion of this lesson, switch or eye-gaze
input, 200% text reflow, colour-contrast ratios, captioning, or mathematical
notation as read by assistive technology. No claim of WCAG conformance is made.

## 5. Checks actually run

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4630 passed, 0 failed** |
| `npm run verify:lessons` | exit 0; **40 authored · 95 outline · 40 `machine_checked` · 0 unresolved** |
| `node scripts/angles-lesson-check.mjs` | **67 passed, 0 failed** |
| `npm run build` | **exit 0, 69 static pages generated** |
| `npm run verify:lesson` | **424 passed, 0 failed** |
| Live assessment check | **25 passed, 0 failed** |
| `npm run verify:a11y` | **73 passed, 0 failed** after correcting the harness hydration wait; the first run was 72/1 for that harness race |
| `npm run disk-headroom` | **7.6 GB free** (WARN; the bar refuses below 5.0 GB and watches below 8.0 GB) |

## 6. Independent Problem-Solving Capability

The six stages are recorded as **opportunities present**, not pupil outcomes.

| Stage | Opportunity in the lesson | Evidence status |
|---|---|---|
| Understand | The eight-paragraph explanation derives the angle facts from turns and gives the translation reason for alternate angles | Machine-checked structure; no pupil explanation |
| Recognise | Guided items ask the learner to choose the correct relationship and name it | Machine-checked; no pupil response |
| Apply | `a2` and `a3` are marked through the server | Harnessed with a scratch learner; no human score |
| Explain | `a1` asks for reasoning and supplies marking criteria | Criteria authored; prose deliberately unscored |
| Transfer | The hexagon/pentagon tiling requires two polygon calculations, a comparison and a conclusion | Model answer checked; no pupil attempt |
| Retain | Next-day, week-later and month-later prompts | Scheduled only; no delayed evidence |

The limited claim: the lesson **provides** these opportunities and the
application can mark the deterministic ones. It does not demonstrate that a
pupil can use the knowledge without being told what to do.

## 7. What remains unproven

- **No teacher review.** `reviews` is empty. `machine_checked` is not
  `educator_reviewed`.
- **No learner trial.** `learnerTesting` is empty. The scratch learner is a
  harness, not a pupil, and completion is not learning.
- **No angle diagram.** The lesson teaches through written descriptions and
  equations; it does not yet draw the parallel-line or polygon configuration.
- **Accessibility is incomplete.** The browser walk measured layout and width,
  not screen-reader output, keyboard-only completion, switch input, 200% text
  reflow, contrast ratios, or notation read by assistive technology.
- **The assessment check is API-level.** It did not type into the visible
  assessment input or observe the rendered verdict.
- **No deferred-retention evidence.** The retrieval prompts are scheduled, not
  delivered or measured.
- **Research access remains partial.** The wider Cognito, Seneca, Dr Frost and
  Isaac comparison is a separate workstream and is not claimed complete here.
- **Coverage remains the main gap.** 95 concepts still have only an outline or
  plan; 12 are critical.

No claim of publication approval, teacher approval or learner success is made.
