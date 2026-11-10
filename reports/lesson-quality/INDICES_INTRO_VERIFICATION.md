# Index laws — verification record

**Date:** 2026-11-09

**Scope:** the authored `indices-intro` lesson, the index arithmetic behind its
claims, its rendering at four widths beside its existing pilot plan, and the
server-marked assessment path through the application.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** **45 authored, 90 outline, 45 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`**. The regenerated audit reports **7
critical gaps, 83 high-priority gaps and 45 lessons awaiting review**. The new
lesson is `machine_checked`; no teacher or learner has reviewed it.

## 1. Why this concept

`indices-intro` was the first critical concept in the queue after
`data-charts`. The genome declares `order-ops` as its prerequisite and names
eight later concepts that read it: `standard-form`, `pythagoras`, `surds`,
`binomial`, `growth-decay`, `logs`, `calculus-diff` and `matrix`-adjacent
algebra. Its misconception tag is `neg-exp`, and the pilot plan already teaches
the same laws through written copies.

The concept already had a pilot plan and an optional video, so the authored
lesson was written to sit beside the plan rather than replace it. The plan
declares no drawing; none was invented. The lesson's representations are
written expansions and a descending table of powers.

The scope is matched to the published GCSE mathematics subject content for
number, which requires calculating with roots and with integer and fractional
indices. The source record is the Department for Education's *GCSE mathematics:
subject content and assessment objectives*:
`https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives`.
No specification, textbook or commercial lesson text is reproduced. The prose,
examples, practice, assessment and the rumour-spreading transfer are original
to OpenMind.

## 2. What the lesson contains

| Part | Content |
|---|---|
| Objectives | Three measurable objectives: an index as a count of copies; the multiplication, division and power laws with the same base; zero, negative and fractional indices derived rather than memorised |
| Prerequisite checks | Two questions targeting `order-ops`: 2 + 3 × 4 = 14, and (2 + 3) × 4 = 20 |
| Explanation | Four sections, eight paragraphs: an index counts copies; multiplying adds and dividing subtracts; zero and negative indices continue the pattern; fractional indices are roots, plus coefficient binding and the numerical check |
| Representations | Three `maths.expression` blocks: written copies for each law; descending powers of 2 from 32 to 1/4; fractional indices evaluated with the root before the power |
| Worked examples | 3a² × 4a³ = 12a⁵; (2x³)² × x⁴ = 4x¹⁰; 27²⁄³ = 9, each checked by substitution or by reversing the index |
| Misconceptions | Multiplying the indices instead of adding them; reading a negative index as a negative value; letting a power bind to the coefficient (2a³ against (2a)³) |
| Guided practice | 5⁴ × 5³ = 5⁷; 8x⁵ ÷ 2x² = 4x³; 2⁻³ = 1/8 and 16¹⁄² = 4 |
| Independent assessment | One constructed response deriving a⁰ and a⁻² from the division law; `a2` simplifies 4x² × 3x⁵ to 12x⁷; `a3` evaluates 27²⁄³ as 9 |
| Transfer | A rumour multiplying by 3 each hour: 3ⁿ new listeners, 81 in hour 4, 121 total, hour 5 the first above 100; why 3n and 3⁵ answer different questions |
| Retrieval | Three prompts at next-day, week-later and month-later spacing |
| Accessibility | Five authored alternatives: powers also written in words, reading-size text, one law per line, typed answers only, and no dependence on the optional video |

The browser counts the rendered teaching as 17 prose paragraphs, three
representation blocks, a 366-word transfer and a 48-word retrieval section.

**No drawing is used.** The plan declares none and the lesson adds none; the
lesson's visual work is the written expansion and the descending powers table.

## 3. Independent arithmetic verification

`scripts/indices-intro-lesson-check.mjs` compiles the real lesson and evaluates
every pinned number independently of the prose.

```bash
node scripts/indices-intro-lesson-check.mjs
```

Result: **110 passed, 0 failed**. The assertions cover:

- 3⁴ = 81, not 12; 2¹⁰ = 1024, not 20; ten folds of 0.1 mm give 102.4 mm;
- 2⁵ × 2³ = 2⁸ = 256, while 2⁵ + 2³ = 40; 2³ × 3² = 72 is not a single power,
  and 6⁵ = 7776;
- 3a² × 4a³ = 12a⁵ at a = 2 (384 either way); (2x³)² × x⁴ = 4x¹⁰ at x = 2
  (4096 either way); 8x⁵ ÷ 2x² = 4x³; 4x² × 3x⁵ = 12x⁷; 5⁴ × 5³ = 5⁷ = 78,125;
- 5³ ÷ 5³ = 1 so 5⁰ = 1; 2⁻¹ = 1/2, 2⁻² = 1/4, 2⁻³ = 1/8; 3⁻² = 1/9 and both
  values are positive, not negative;
- 25¹⁄² = 5, 16¹⁄² = 4, 8¹⁄³ = 2, 16¹⁄⁴ = 2, 16³⁄⁴ = 8, 27¹⁄³ = 3,
  27²⁄³ = 9, and 9³⁄² returns 27 as the consistency check;
- `2a³` at a = 2 is 16 while `(2a)³` is 64, so the bracket is not cosmetic;
- the rumour: 3⁰ = 1, 3¹ = 3, 3⁴ = 81, 3⁵ = 243, the running total
  1 + 3 + 9 + 27 + 81 = 121 = (3⁵ − 1)/2, and 3n = 12 at n = 4 while 3⁴ = 81.

## 4. Defects the gates found

1. **Learner-visible caret notation (content defect).** The lesson framework
   reported **28** instances of raw notation in prose and in worked-example
   moves: `27^(2/3)`, `a^(m/n)`, `a^(m+n)`, `x^(3×2)` and the rest. A learner
   would have read the author's keyboard shorthand instead of a typeset power.
   Every occurrence was rewritten as a Unicode superscript — `27²⁄³`,
   `aᵐ⁄ⁿ`, `aᵐ⁺ⁿ` — which is the same form the pilot plan uses. The arithmetic
   gate had already passed this version; the contract rule caught a different
   defect, which is why both exist.
2. **An undeclared accessibility need (type defect).** The first version used
   `need: "hearing"`; the contract's union accepts `no-audio`, and `tsc`
   refused the file. The alternative was kept and the need renamed, not the
   type loosened.
3. **A harness defect, not a content defect.** The gate compared
   `27 ** (2/3)` with `9` using exact equality; JavaScript returns
   `8.999999999999998`, so the gate failed on its own arithmetic. The
   comparison now uses the same tolerance as every other fractional power. This
   is recorded because a gate that fails for its own floating point is not
   evidence about the lesson.

## 5. Browser and application evidence

### Full lesson walk

```bash
LESSON_WALK_SHOTS=0 OPENMIND_DATA_DIR=/tmp/openmind-indices-walk npm run verify:lesson
```

Result: **459 passed, 0 failed**. The walk measured all 21 planned lessons at
1280 and 320 px and all **23** authored lessons whose contract it opens at
1280, 768, 375 and 320 px.

For `indices-intro` specifically:

- the authored contract renders beside the pilot plan;
- 3 objectives, 3 misconceptions and 3 guided items are visible;
- 17 prose paragraphs and 3 representation blocks render;
- the draft-status footer is present;
- the transfer is 366 words and the retrieval section 48 words;
- the page measures **320 vs 320**, **375 vs 375**, **768 vs 768** and
  **1280 vs 1280** — no sideways scroll at any measured width.

The walk does not type into the visible assessment input. The HTTP check below
proves the server can mark the deterministic items; it does not prove the
rendered control submits them.

### Assessment path

`scripts/indices-intro-live-check.mjs` used the application's real HTTP
endpoints with a fresh scratch learner at `/tmp/openmind-indices-walk`:

- `POST /api/profile` created the learner;
- `a2` with `12x^7` was marked `correct: true`, with the model answer 12x⁷ and
  marking criteria returned, and no accepted-answer list leaked;
- `a3` with `6`, the cube root without the square, was marked `correct: false`
  and the true value 9 was returned;
- `a1`, the constructed response, was refused with `400 not gradable`;
- a wrong capability secret was refused with `401`;
- `profiles.json` stored `lessonCheck: { asked: 2, correct: 1 }`, so neither
  the ungradable item nor the refused secret inflated the count;
- the evidence ledger held exactly **two** events, both
  `questionId: lesson:indices-intro:*`, `mode: independent`, `hints: 0`;
- the right and the wrong result were preserved separately under two distinct
  question ids.

Result: **18 passed, 0 failed**. This is API-level evidence. It did not type
into the visible assessment form or observe a rendered verdict.

## 6. Checks actually run

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4630 passed, 0 failed** (three planted failing controls excluded) |
| `npm run verify:lessons` | exit 0; includes the new **110-assertion** indices gate |
| `node scripts/indices-intro-lesson-check.mjs` | **110 passed, 0 failed** |
| `npm run build` | **exit 0, 69 static pages generated** |
| `npm run verify:lesson` | **459 passed, 0 failed** |
| `node scripts/indices-intro-live-check.mjs` | **18 passed, 0 failed** |
| `node scripts/lesson-quality-audit.mjs` | **45 authored · 90 outline · 45 review · 7 critical · 83 high** |
| `node scripts/lesson-catalogue.mjs --write --report` | **45 authored · 90 outline · 45 `machine_checked`** |
| Disk headroom | **5.8 GB free** after the batch-27 build and cleanup (WARN; the bar refuses below 5.0 GB and watches below 8.0 GB) |

`npm run verify:a11y` was **not** re-run in this batch. The most recent
structural run (batch 23) passed **61/0** with one gated surface not audited;
that result is not evidence about this lesson's assistive-technology behaviour.

## 7. Independent Problem-Solving Capability

The six stages are recorded as **opportunities present**, not pupil outcomes.

| Stage | Opportunity in the lesson | Evidence status |
|---|---|---|
| Understand | The explanation treats an index as a count of copies and derives each law by writing them out | Machine-checked structure; no pupil explanation |
| Recognise | Guided and assessment items require choosing the law and checking whether the bases match | Machine-checked; no pupil response |
| Apply | `a2` simplifies 4x² × 3x⁵ and `a3` evaluates 27²⁄³ through the server | Harnessed with a scratch learner; no human score |
| Explain | `a1` asks for a derivation of a⁰ and a⁻² from the division law, with four marking criteria | Criteria authored; prose deliberately unscored |
| Transfer | The rumour task builds 3ⁿ, separates the hourly count from the running total, finds the threshold hour and rejects two wrong models | Model answer checked; no pupil attempt |
| Retain | Next-day, week-later and month-later prompts | Scheduled only; no delayed evidence |

The limited claim: the lesson **provides** these opportunities and the
application can mark the deterministic ones. It does not demonstrate that a
pupil can use an index law without being told which one to use.

## 8. What remains unproven

- **No teacher review.** `reviews` is empty. `machine_checked` is not
  `educator_reviewed`.
- **No learner trial.** `learnerTesting` is empty. The scratch learner is a
  harness, not a pupil.
- **Accessibility was not re-measured this batch.** The lesson's Unicode
  superscript notation has not been tested with a screen reader, and whether
  `ᵐ⁄ⁿ` is announced acceptably is unknown. Keyboard-only completion, 200%
  reflow and contrast remain unmeasured for this lesson.
- **The assessment check is API-level.** It did not use the visible assessment
  input or observe the rendered verdict.
- **No drawing.** The plan declares none; a learner who needs a spatial
  representation of a power gets the written expansion and the descending
  table.
- **No deferred-retention evidence.** The retrieval prompts are scheduled, not
  delivered or measured.
- **The wider comparison is unfinished.** The Cognito, Seneca, Dr Frost, Isaac
  and other-platform study remains a separate research workstream.
- **Coverage remains the main gap.** 90 concepts still have only an outline or
  plan; 7 are critical.

No claim of publication approval, teacher approval or learner success is made.
