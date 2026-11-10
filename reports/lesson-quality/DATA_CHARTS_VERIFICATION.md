# Data charts — verification record

**Date:** 2026-11-09

**Scope:** the authored `data-charts` lesson, its shares, pie angles and scale
arithmetic, its rendering at four widths, and the server-marked assessment path
through the application.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** **44 authored, 91 outline, 44 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`**. The regenerated audit reports **8
critical gaps, 83 high-priority gaps and 44 lessons awaiting review**. The new
lesson is `machine_checked`; no teacher or learner has reviewed it.

## 1. Why this concept

`data-charts` was the first critical concept in the queue after `coordinates`.
The genome declares `averages` as its prerequisite and `scatter-correlation` as
its child, and its own description names the three choices this lesson teaches:
scales, truncation and grouping. A learner who reads a bar length as a count
without asking about the baseline will misread every chart in the science and
statistics courses that follow.

The concept had no pilot plan and no drawing, so there was no figure to inherit
and none was invented. The lesson teaches through tables, arithmetic and prose.

The scope is matched to the published GCSE mathematics subject content for
statistics and the National Curriculum's requirement to construct and
criticise representations. The source record used for the curriculum claim is
the Department for Education's *GCSE mathematics: subject content and assessment
objectives*:
`https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives`.
No specification, textbook or commercial lesson text is reproduced. The prose,
examples, practice, assessment and the two-school cycling transfer are original
to OpenMind.

## 2. What the lesson contains

| Part | Content |
|---|---|
| Objectives | Three measurable objectives: choose a chart from the data type and question; read a chart by total, scale and baseline and explain truncation; construct bar and pie charts from a table and state what they hide |
| Prerequisite checks | Two questions targeting `averages`: the mean of 4, 6, 8 and 10 is 7, and a total of 60 is rebuilt from a mean of 12 over five values |
| Explanation | Four sections, eight paragraphs: the question chooses the chart; the scale is part of the argument; a pie encodes shares not counts; read critically for total, scale and what is missing |
| Representations | Three `maths.expression` blocks: the sports table and its 0–12 bars; the 60-learner travel survey with 90°, 144°, 72° and 54°; the 32 → 36 rise drawn on a 0-based and a 30-based axis |
| Worked examples | Building a bar chart for 28 learners; calculating the four pie angles and checking they sum to 360°; criticising the truncated cycling chart against the true 12.5% rise |
| Misconceptions | A pie shows counts, so a bigger slice is always more items; any data can be joined with a line; a truncated bar axis is honest because its labels are true |
| Guided practice | Three items with hints and feedback: bar for unordered fruit; 90°, 180°, 90° for 40 learners; a 50-based axis that draws 52 and 58 as 2 and 8 |
| Independent assessment | One constructed response on 200 learners (angles 144°, 90°, 72°, 54°) asking what the pie hides and why bars start at zero; `a2` finds 25% of 80 is 20; `a3` finds the true difference 8 behind drawn heights of 16 and 8 |
| Transfer | Two schools with different totals: 40 of 400 (10%) against 30 of 250 (12%). The count headline and the share headline point at different schools, a pie cannot show 40 against 30, and 30 of 500 (6%) would reverse the share claim |
| Retrieval | Three prompts at next-day, week-later and month-later spacing |
| Accessibility | Five authored alternatives: every chart is also a table or list, readable text sizing, a three-question reading routine, category names instead of colour, and typed answers only |

The browser counts the rendered teaching as 17 prose paragraphs, three
representation blocks, a 360-word transfer and a 66-word retrieval section.

**No chart is drawn.** A lesson about charts currently contains no chart
rendering: the representations are tables, angle calculations and a written
comparison of two baselines. That is honest but it is a real limitation, and it
is the most conspicuous missing representation in the authored set.

## 3. Independent arithmetic verification

`scripts/data-charts-lesson-check.mjs` compiles the real lesson and evaluates
the totals, shares and angles behind every pinned claim. It does not compare a
printed string with itself and it does not mark prose.

```bash
node scripts/data-charts-lesson-check.mjs
```

Result: **108 passed, 0 failed**. The assertions cover:

- the sports table totals 28, the tallest bar is 12, the shortest 3, a four-to-one
  ratio on a zero baseline, and the worked example states its 0–12 scale;
- the travel survey totals 60; `15/60 × 360 = 90°`, `24/60 = 144°`,
  `12/60 = 72°`, `9/60 = 54°`; the angles sum to 360°; the bus is 40%, or 24
  learners, and is the largest sector;
- the true cycling rise is 4, which is 12.5% of 32; a baseline of 30 draws 6
  and 2, a three-times ratio, while a 0–40 axis draws 80% and 90%, the true
  1.125 ratio;
- guided keys: a bar chart for unordered fruit with the line rejected for
  inventing an order; 40 learners give 90°, 180° and 90°, summing to 360° with
  the bus as half; 52 against 58 is a difference of 6 (about 11.5%) drawn as 8
  and 2, a four-times picture;
- `a1`: 200 learners give 144°, 90°, 72° and 54°, summing to 360°, with shares
  of 40% and 15%; the model answer uses the total, the angles and the zero
  baseline;
- `a2 = 20` and `a3 = 8`, with both accepted-answer lists containing their own
  model answers and both carrying marking criteria;
- the transfer: 40/400 = 10%, 30/250 = 12%, 30 < 40, and 30/500 = 6% reverses
  the share claim;
- retrieval: a line for an ordered week; 90° is 25% and one quarter; a bar axis
  starts at zero because bar length encodes the value.

**The lesson framework rejected the first version of worked example 3**, with
`maths.answer-in-working: w3: the last move names none of the answer's
quantities`. The move was rewritten to name the 4, the 12.5%, the 2 and 6 and
the three-times ratio. The arithmetic gate had already passed that version; the
contract rule caught a different defect, which is why both gates exist.

This is independent **arithmetic** checking, not independent review. The gate
shares an author with the lesson, so it proves the claims agree with the stated
counts; it does not prove the teaching is the best account of the idea, nor that
a pupil reads charts critically.

## 4. Browser and application evidence

### Full lesson walk

```bash
LESSON_WALK_SHOTS=0 OPENMIND_DATA_DIR=/tmp/openmind-charts-walk npm run verify:lesson
```

Result: **452 passed, 0 failed**. The walk measured all 21 planned lessons at
1280 and 320 px and all **22** authored lessons without a plan at 1280, 768, 375
and 320 px.

For `data-charts` specifically:

- the authored contract renders on the page;
- 3 objectives, 3 misconceptions and 3 guided items are visible;
- 17 prose paragraphs and 3 representation blocks render;
- the draft-status footer is present;
- the transfer is 360 words and the retrieval section 66 words;
- the page measures **320 vs 320**, **375 vs 375**, **768 vs 768** and
  **1280 vs 1280** — no sideways scroll at any measured width.

The walk does not type into the visible assessment input. The HTTP check below
proves the server can mark and persist the deterministic items; it does not
prove the rendered control submits them.

### Assessment path

`scripts/data-charts-live-check.mjs` used the application's real HTTP endpoints
with a fresh scratch learner at `/tmp/openmind-charts-walk`:

- `POST /api/profile` created the learner;
- `POST /api/progress` with `action: "lessonCheck"` marked `a2` with `20`;
  the response was `correct: true` and carried the model answer and marking
  criteria, without leaking the accepted-answer list;
- `a3` with `16`, the difference between the drawn heights, was marked
  `correct: false`, with the true difference `8`;
- `a1`, the constructed response, was refused with `400 not gradable`;
- a wrong capability secret was refused with `401`;
- `profiles.json` stored `lessonCheck: { asked: 2, correct: 1 }`, so neither the
  ungradable item nor the refused secret inflated the count;
- the evidence ledger held exactly **two** events, both
  `questionId: lesson:data-charts:*`, `mode: independent`, `hints: 0`;
- the two events preserved the right and the wrong result separately, under two
  distinct question ids.

Result: **18 passed, 0 failed**. This is API-level evidence. It did not type
into the visible assessment form or observe a rendered verdict.

## 5. Checks actually run

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4630 passed, 0 failed** (three planted failing controls excluded) |
| `npm run verify:lessons` | exit 0; includes the new **108-assertion** data-charts gate |
| `node scripts/data-charts-lesson-check.mjs` | **108 passed, 0 failed** |
| `npm run build` | **exit 0, 69 static pages generated** |
| `npm run verify:lesson` | **452 passed, 0 failed** |
| `node scripts/data-charts-live-check.mjs` | **18 passed, 0 failed** |
| `node scripts/lesson-quality-audit.mjs` | **44 authored · 91 outline · 44 review · 8 critical · 83 high** |
| `node scripts/lesson-catalogue.mjs --write --report` | **44 authored · 91 outline · 44 `machine_checked`** |
| Disk headroom | **5.9 GB free** after the batch-26 build and cleanup (WARN; the bar refuses below 5.0 GB and watches below 8.0 GB) |

`npm run verify:a11y` was **not** re-run in this batch. The most recent
structural run (batch 23) passed **61/0** with one gated surface not audited;
that result is not evidence about this lesson's assistive-technology behaviour.

## 6. Independent Problem-Solving Capability

The six stages are recorded as **opportunities present**, not pupil outcomes.

| Stage | Opportunity in the lesson | Evidence status |
|---|---|---|
| Understand | The explanation treats a chart as an argument: the question chooses the type, the baseline is part of the claim, and a pie encodes shares | Machine-checked structure; no pupil explanation |
| Recognise | Guided items ask for a chart choice, a set of pie angles, and the difference behind a truncated axis | Machine-checked; no pupil response |
| Apply | `a2` and `a3` are marked through the server | Harnessed with a scratch learner; no human score |
| Explain | `a1` asks what the pie does not show and why bars start at zero, with four marking criteria | Criteria authored; prose deliberately unscored |
| Transfer | Two schools with different totals require counts, shares, a chart choice for each headline, and the total that would reverse the claim | Model answer checked; no pupil attempt |
| Retain | Next-day, week-later and month-later prompts | Scheduled only; no delayed evidence |

The limited claim: the lesson **provides** these opportunities and the
application can mark the deterministic ones. It does not demonstrate that a
pupil can use the knowledge without being told what to do.

## 7. What remains unproven

- **No teacher review.** `reviews` is empty. `machine_checked` is not
  `educator_reviewed`.
- **No learner trial.** `learnerTesting` is empty. The scratch learner is a
  harness, not a pupil, and completion is not learning.
- **No chart drawing.** The lesson teaches charts without rendering one; the
  tables and angles are carried in text.
- **Accessibility was not re-measured this batch.** Screen-reader
  announcements, keyboard-only completion, 200% reflow, contrast ratios and
  diagram alternatives remain unmeasured for this lesson.
- **The assessment check is API-level.** It did not use the visible assessment
  input or observe the rendered verdict.
- **No deferred-retention evidence.** The retrieval prompts are scheduled, not
  delivered or measured.
- **The wider comparison is unfinished.** The Cognito, Seneca, Dr Frost, Isaac
  and other-platform study remains a separate research workstream.
- **Coverage remains the main gap.** 91 concepts still have only an outline or
  plan; 8 are critical.

No claim of publication approval, teacher approval or learner success is made.
