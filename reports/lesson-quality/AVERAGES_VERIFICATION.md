# Averages — verification record

**Date:** 2026-11-09

**Scope:** the authored `averages` lesson, its statistics, its rendering at four
widths, and the server-marked assessment path through the application.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** **42 authored, 93 outline, 42 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`**. The regenerated audit reports **10
critical gaps, 83 high-priority gaps and 42 lessons awaiting review**. The new
lesson is `machine_checked`; no teacher or learner has reviewed it.

## 1. Why this concept

`averages` is the next critical concept in the generated queue after
`area-perimeter`. The genome gives it **no declared prerequisite** and makes it
a prerequisite of `data-charts` and `statistics-data`, so a learner who cannot
separate the mean from the median will meet the same confusion in every later
statistics topic.

The lesson therefore names the two foundations the mean actually uses —
`addition` (rebuilding the total) and `division` (sharing it out) — and probes
both rather than assuming a course order. The genome's own misconception for the
concept, `outlier-mean`, is the spine of the lesson rather than an aside.

The scope is matched to the published GCSE mathematics subject content and the
National Curriculum for statistics: mean, median, mode and range; frequency
tables; and describing, interpreting and comparing distributions. The source
record used for the curriculum claim is the Department for Education's
*GCSE mathematics: subject content and assessment objectives*:
`https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives`.
No specification, textbook, commercial lesson or worksheet text is reproduced.
The prose, examples, practice, assessment and the two-class transfer are original
to OpenMind.

## 2. What the lesson contains

| Part | Content |
|---|---|
| Objectives | Three measurable objectives: calculate and interpret all four summaries including a frequency table; choose an average for a context and justify it; solve reverse-mean and combined-mean problems |
| Prerequisite checks | Two questions targeting `addition` (`48 + 36 + 27 = 111`) and `division` (`111 ÷ 3 = 37`), both probed rather than assumed |
| Explanation | Four sections, eight paragraphs: the mean as a total shared out; median as position, mode as frequency, range as spread; frequency tables and combined groups use totals; choosing a summary is part of the answer |
| Representations | Three `maths.expression` blocks: one data set answered four ways; a frequency table rebuilt into a total; two unequal classes combined through their totals |
| Worked examples | Five cafe takings (12, 15, 15, 18, 40); a frequency table with values 1–4; two classes of 12 and 18 with means 65 and 80 — every move gives its reason |
| Misconceptions | The mean is the middle value; the median can be read from the unsorted list; the mean is always the fairest summary |
| Guided practice | Three items with hints and correct/incorrect feedback: `6, 9, 9, 12, 14`; a frequency table with frequencies 4, 3, 3; a missing value from a mean of 14 over six values |
| Independent assessment | One constructed response on sales `120, 140, 140, 160, 940` and the choice of summary; `a2` finds the mean of a frequency table (**2.1**); `a3` finds a missing value (**17**) |
| Transfer | Two evening classes of 12 and 18 with means 62 and 77: the tutor's unweighted 69.5 is wrong, the combined mean is **71**; adding a score of 100 to Class A moves its mean to **≈64.9** but moves the median much less |
| Retrieval | Three prompts at next-day, week-later and month-later spacing |
| Accessibility | Five authored alternatives: ordered values written in the prompt, readable text sizing, an explicit calculation order, colour-independent naming, and no motor-only interaction |

The browser counts the rendered teaching as 17 prose paragraphs, three
representation blocks, a 390-word transfer and a 75-word retrieval section.

**Representation limitation.** The lesson has no drawing. The three blocks are
written equations and descriptions, not a plotted dot-plot or bar chart. That
keeps every answer independent of visual estimation, but a learner cannot
inspect the outlier's effect on a picture. No new figure kind was invented here,
and the lesson does not claim one exists.

## 3. Independent arithmetic verification

`scripts/averages-lesson-check.mjs` compiles the real lesson and evaluates the
statistics behind every pinned claim. It does not compare a printed string with
itself and it does not mark prose.

```bash
node scripts/averages-lesson-check.mjs
```

Result: **107 passed, 0 failed** on the first run. The assertions cover:

- the opening pay packets: total £2,000, mean £400, median £250, four of the
  five below the mean, range £900;
- `12 + 15 + 15 + 18 + 40 = 100`, mean 20, median 15, mode 15, range 28, and
  the mean sitting above four of the five values;
- `4, 7, 7, 9, 13` giving 8 / 7 / 7 / 9, and the same set with 130 in place of
  13 moving the mean to 31.4 and the range to 126 while the median stays 7;
- an even-sized set using the mean of the two middle values (5 and 7 → 6);
- `9, 2, 8, 4, 7` sorting to a median of 7, not the unsorted middle 8;
- the frequency table `0,1,2,3` with frequencies `2,5,2,1` rebuilding a total of
  12 over 10 values, mean 1.2, median 1, mode 1, range 3;
- the worked table `1,2,3,4` with frequencies `3,4,2,1` rebuilding 21, mean 2.1,
  median 2, mode 2, range 3;
- the three guided keys: 10 / 9 / 9 / 8, 0.9 / 1 / 0, and 17 from `6 × 14 − 67`;
- `a1`: total 1,500, mean 300, median 140, mode 140, range 820, four of five at
  most £160;
- `a2 = 2.1` and `a3 = 17`, with both accepted-answer lists containing their own
  model answers and both carrying marking criteria;
- the worked combined mean `(600 + 1,500) ÷ 30 = 70` against the unweighted
  trap 67.5;
- the transfer: `744` and `1,386`, combined **71**, the tutor's 69.5, and
  `(744 + 100) ÷ 13 ≈ 64.9`;
- retrieval: `5 × 9 − 31 = 14`, median 6 / range 7 / no mode, and the frequency
  table `1,2,3` with frequencies `5,3,2` giving mean 1.7 and median 1.5.

This is independent **arithmetic** checking, not independent review. The gate
shares an author with the lesson, so it proves the claims agree with the stated
data; it does not prove the teaching is the best account of the idea, nor that a
pupil learned it.

## 4. Browser and application evidence

### Full lesson walk

```bash
LESSON_WALK_SHOTS=0 OPENMIND_DATA_DIR=/tmp/openmind-averages-walk npm run verify:lesson
```

Result: **438 passed, 0 failed**. The walk measured all 21 planned lessons at
1280 and 320 px and all **20** authored lessons without a plan at 1280, 768, 375
and 320 px.

For `averages` specifically:

- the authored contract renders on the page;
- 3 objectives, 3 misconceptions and 3 guided items are visible;
- 17 prose paragraphs and 3 representation blocks render;
- the draft-status footer is present;
- the transfer is 390 words and the retrieval section 75 words;
- the page measures **320 vs 320**, **375 vs 375**, **768 vs 768** and
  **1280 vs 1280** — no sideways scroll at any measured width.

The walk does not type into the visible assessment input. The HTTP check below
proves the server can mark and persist the deterministic items; it does not
prove the rendered control submits them.

### Assessment path

`scripts/averages-live-check.mjs` used the application's real HTTP endpoints
with a fresh scratch learner at `/tmp/openmind-averages-live`:

- `POST /api/profile` created the learner;
- `POST /api/progress` with `action: "lessonCheck"` marked `a2` with `2.1`;
  the response was `correct: true`, carried the model answer and three marking
  criteria, and did not leak the accepted-answer list;
- `a3` with `56` was marked `correct: false`, with the true value `17`;
- `a1`, the constructed response, was refused with `400 not gradable`; the
  server did not turn prose into a mark;
- a wrong capability secret was refused with `401`;
- `profiles.json` stored `lessonCheck: { asked: 2, correct: 1 }`, so neither the
  ungradable item nor the refused secret inflated the count;
- the evidence ledger held exactly **two** events, both
  `questionId: lesson:averages:*`, `mode: independent`, `hints: 0`;
- the two events preserved the right and the wrong result separately, under two
  distinct question ids.

Result: **18 passed, 0 failed**. This is API-level evidence. It did not type
into the visible assessment form or observe a rendered verdict.

## 5. Checks actually run

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4630 passed, 0 failed** (three planted failing controls excluded) |
| `npm run verify:lessons` | exit 0; includes the new **107-assertion** averages gate |
| `node scripts/averages-lesson-check.mjs` | **107 passed, 0 failed** |
| `npm run build` | **exit 0, 69 static pages generated** |
| `npm run verify:lesson` | **438 passed, 0 failed** |
| `node scripts/averages-live-check.mjs` | **18 passed, 0 failed** |
| `node scripts/lesson-quality-audit.mjs` | **42 authored · 93 outline · 42 review · 10 critical · 83 high** |
| `node scripts/lesson-catalogue.mjs --write --report` | **42 authored · 93 outline · 42 `machine_checked`** |
| Disk headroom | **7.8 GB free** immediately before the build (WARN; the bar refuses below 5.0 GB and watches below 8.0 GB) |

`npm run verify:a11y` was **not** re-run in this batch. The most recent
structural run (batch 23) passed **61/0** with one gated surface not audited;
that result is not evidence about this lesson's assistive-technology behaviour.

## 6. Independent Problem-Solving Capability

The six stages are recorded as **opportunities present**, not pupil outcomes.

| Stage | Opportunity in the lesson | Evidence status |
|---|---|---|
| Understand | The explanation separates four questions: total shared out, middle after ordering, most frequent, and spread | Machine-checked structure; no pupil explanation |
| Recognise | Guided items ask the learner to find all four summaries, read a frequency table, and rebuild a total | Machine-checked; no pupil response |
| Apply | `a2` and `a3` are marked through the server | Harnessed with a scratch learner; no human score |
| Explain | `a1` asks which average represents a typical day and why, when the mode is the only sensible average, and why the range is not one, with marking criteria | Criteria authored; prose deliberately unscored |
| Transfer | The two-class task requires converting means back to totals, resisting the unweighted average, and reasoning about a new outlier without being given individual scores | Model answer checked; no pupil attempt |
| Retain | Next-day, week-later and month-later prompts | Scheduled only; no delayed evidence |

The limited claim: the lesson **provides** these opportunities and the
application can mark the deterministic ones. It does not demonstrate that a
pupil can use the knowledge without being told what to do.

## 7. What remains unproven

- **No teacher review.** `reviews` is empty. `machine_checked` is not
  `educator_reviewed`.
- **No learner trial.** `learnerTesting` is empty. The scratch learner is a
  harness, not a pupil, and completion is not learning.
- **No drawn representation.** The lesson describes the outlier's effect in
  numbers and prose; it does not plot it.
- **Accessibility was not re-measured this batch.** Screen-reader
  announcements, keyboard-only completion, 200% reflow, contrast ratios and
  diagram alternatives remain unmeasured for this lesson; the batch-23
  structural audit was not repeated.
- **The assessment check is API-level.** It did not use the visible assessment
  input or observe the rendered verdict.
- **No deferred-retention evidence.** The retrieval prompts are scheduled, not
  delivered or measured.
- **The wider comparison is unfinished.** The Cognito, Seneca, Dr Frost, Isaac
  and other-platform study remains a separate research workstream.
- **Coverage remains the main gap.** 93 concepts still have only an outline or
  plan; 10 are critical.

No claim of publication approval, teacher approval or learner success is made.
