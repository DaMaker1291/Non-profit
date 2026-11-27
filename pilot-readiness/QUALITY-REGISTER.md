# OpenMind quality register

**Purpose.** One place for the defects that affect learning, not only the
defects that affect compilation. Structural validation, curriculum correctness,
content quality, educator review, learner testing and demonstrated impact are
kept as separate stages. A green test suite does not move an item past
“content quality”; only a named reviewer or learner evidence does.

**Last updated:** 2026-11-27
**Baseline inspected:** live `https://non-profit-bay.vercel.app/` home and
onboarding; local `/`, `/onboarding`, `/curriculum`, `/try/fractions`,
`/solve`; the isolated lesson walk over all 136 authored lessons.
**Not yet inspected:** the teacher classroom journey, screen-reader output, a
real learner or teacher session, and a low-end Android device. A signed-in
lesson session with a scratch learner is now checked end to end on `negatives`,
`decimals` and the earlier fraction/N4 pathways.

## Status key

| Stage | Meaning |
|---|---|
| Open | Defect confirmed, no fix yet |
| Fixed | Code changed and a focused check passes |
| Browser-verified | Fixed and observed in the affected browser journey |
| Educator-review | A subject specialist has reviewed it |
| Learner-tested | Real learners have used it and evidence is recorded |
| Demonstrated-impact | A measured learning gain is attributable to it |

A P0 is a false or blocked learning experience. P1 blocks a curriculum or
assessment promise. P2 is a reliability, accessibility or maintainability risk.

## Register

| ID | Severity | Subject / objective | Area / route | Finding and educational impact | Status | Evidence |
|---|---|---|---|---|---|---|
| Q-001 | P0 | All subjects — learner privacy on a shared device | Global offline bar; `/` signed-out | A fresh signed-out visitor was shown “Your offline answers are syncing (1)” while `openmind:learners` was empty. The queue held a real `addition` answer with a profile id. The bar exposed a previous learner's unsynced work on a shared device and promised a drain the signed-out shell does not run. | Browser-verified | Live home screenshot `audit/baseline-home-desktop.png`; localStorage dump showed `openmind:sync-queue` with `prof_…` and an empty learner list. Fix: `summaryVisibleTo(null, …)` reports an empty summary; local browser with an injected queue showed an empty status region (`audit/fixed-offline-signedout.png`). Regression: `verify-engines` asserts signed-out is empty and the owner still sees held answers. |
| Q-002 | P0 | Maths — fractions (N1/N2/N8) | `/try/[concept]` and `/solve` | A fraction question rendered four multiple-choice buttons. The client sent `choiceIndex`; the server contract for a `fraction` item requires a numerator and denominator, so it returned `400 {"error":"not a fraction"}`. The correct answer `19/15` was painted red ✗. A learner who picked the right value was told they were wrong, and every option was then disabled while the page said “Try it again.” | Browser-verified | Failure screenshot `audit/baseline-try-fractions-feedback.png`; intercepted request body/status confirmed `400 not a fraction`; fixed `audit/fixed-try-fractions-correct.png` shows `3/4 + 2/3 = 17/12` marked **✓ CORRECT** with the worked explanation. `/solve` received the same response-kind switch and source tripwires. |
| Q-003 | P0 | All subjects — assessment feedback | `/try/[concept]`, `/solve` | A failed submission left the chosen option in the red `bad` state even though `correct` was still `null` and `answerIndex` was `null`. The page drew a verdict the server had not given. | Fixed, source-verified | Response-class code now requires `correct !== null`; `verify-engines` asserts the neutral-before-verdict rule on both anonymous surfaces. The error path also releases `picked`, so “try again” is actually possible. |
| Q-004 | P1 | Maths — course opening | Higher-course opening; `lib/specifications.ts`, `lib/next-engine.ts`, `lib/subject-start.ts` | Making foundational arithmetic available at AQA Higher caused an unplaced Higher learner to be offered **place value** as “the first idea in your course.” Availability for remediation is correct; the opening recommendation must still be tier-appropriate. | Fixed | `startConceptFor()` separates “contained” from “where an unplaced learner starts.” `verify-engines` now 4840 assertions, 0 failed; Higher opens at fractions, Foundation at place value, A-level at standard form. |
| Q-005 | P1 | Maths — AQA Number assessment | AQA Number assessment | **5 of 35 objectives now have complete AQA-style assessment coverage.** `N2-fractions` has all five operation requirements in four items (9 marks): addition `a1`, subtraction `a3`, multiplication `a5`, division and contextual remainder `a4`. `N4-factors` and `N4-prime-factor` share seven items (11 marks): prime product and index form, a factor/multiple table, common factors, two HCF/LCM pairs, and a self-marked uniqueness explanation. `N10-recurring` adds five items (14 marks): recurring decimal to fraction, fraction to recurring decimal, the denominator test, the 0.999... equality, and a mixed recurring case; a3/a4/a7 are structured and a5/a6 are self-marked constructed responses. `N2-negatives` adds three items (8 marks): adding/subtracting negative fractions, dividing by a reciprocal with a negative sign, and ordering two negative fractions with a common denominator; a3/a4 are structured and a5 is a self-marked constructed response. None is examination-ready: 0 educator reviews, 0 learner tests, no full paper, no grade calibration. `N2` `a5` is a 2-mark structured conversion-and-multiplication item; a wrong product such as `7/12` keeps only the conversion mark. | Functionally complete, unreviewed | `npm run assessment:content`: 2,068 checks passed. `npm run exam:coverage`: `assessment-complete 5; assessment-partial 0; assessment-items 0`; `19 AQA-style items`; 18 complete sequences. Browser on the isolated scratch store: N2 `a5` answered `7/3` and `1 3/4`, server returned **2/2**; screenshot `audit/n2-fraction-multiplication-browser-2026-11-26.png`. N4 `a1`–`a6` answered correctly, server returned full marks for each structured item, and `a7` opened a model answer with two marking criteria; screenshot `audit/n4-factors-primes-assessment-2026-11-26.png`. N10 `a3` answered 27 and 3/11 (3/3), `a4` 0.41666... and 6 (2/2), and `a7` 37.5 and 5/12 (3/3), all recorded; `a5` and `a6` opened model answers with marking criteria; screenshot `audit/n10-recurring-assessment-2026-11-27.png`. Still `NOT REVIEWED`: no educator signature or learner trial. |
| Q-006 | P1 | Maths — AQA N4 | AQA Number teaching | **N4 is now one concept, `factors-primes`**, with an authored lesson covering factors, multiples, primes, prime factorisation, uniqueness, HCF and LCM; 4 prior-knowledge checks, 4 representations, 3 worked examples, 4 misconceptions, 4 guided-practice items, 7 assessment items (11 marks), spaced retrieval, a teacher plan and a repair for the factor/multiple direction belief. It is not educator-reviewed or learner-tested. | Fixed, structurally and browser-verified; unreviewed | `npm run verify`: **4,855 passed, 0 failed** (after excluding the 3 deliberately planted Promise failures). `assessment:content`: 2,068 checks; `exam:coverage`: N4-factors and N4-prime-factor both `assessment-complete`, 5 objectives complete, 19 AQA-style items, 18 sequences. Browser at `127.0.0.1:4180/learn/maths/factors-primes`: the page taught the factor tree, HCF/LCM by prime factors and the context decision; `a1` (`2 × 2 × 3 × 3`), `a2` (`2² × 3²`), `a3` table (`12`, `21`), `a4` (`1, 3`), `a5` (`3`, `36`) and `a6` (`12`, `72`) were marked correct and recorded as independent evidence. Screenshot `audit/n4-factors-primes-assessment-2026-11-26.png`. Still `NOT REVIEWED`: no educator signature or learner trial. |
| Q-007 | P1 | Maths — AQA Higher demand | AQA Higher demand | Eight foundational concepts are available at Higher but cap below the 0.65 target: addition 0.30, subtraction 0.30, multiplication 0.35, division 0.35, place-value 0.35, order-ops 0.40, negatives 0.45, rounding 0.50. Direct serves can therefore be below tier. | Open | `npm run exam:coverage` demand line; `lib/content-ceiling.ts`. |
| Q-008 | P2 | All subjects — release verification | CI / deployment | CI is strong on typecheck, engines, content, build, HTTP smoke, permissions and persistence. The post-deploy production check does **not** yet walk a real browser through a lesson at mobile/tablet/desktop, nor compare the deployed commit to the expected SHA through the rendered page. | Open | `.github/workflows/ci.yml`, `deploy-production.yml` inspected. Existing smoke/readiness/persistence are real; browser-level post-deploy assessment is not present. |
| Q-009 | P2 | All subjects — platform security | Dependency security | The dev server reports Next.js 16.4.3 is affected by a known vulnerability and 16.4.6 is available. Not upgraded in this pass because that is a dependency change requiring its own build and regression run. | Open | Dev-server startup banner. |
| Q-010 | P2 | All subjects — lesson verification | `scripts/lesson-walk.mjs` | The isolated walk passed every content assertion and then aborted at the first post-catalogue assessment with `CDP Runtime.evaluate did not answer within 20s` (379 s run). This is not a teaching failure in the 136 lessons measured, but a release check that cannot finish cannot certify the lessons it never reached. | Open | `/tmp/lesson-isolated-full.out`: all 135 authored lessons painted at 320/375/768; then timeout at “Ratio, proportion and sequences submit through the visible assessment”; summary `lesson exit 1`, live store unchanged, scratch store discarded. |
| Q-011 | P1 | All subjects — mixed-attainment classrooms | `npm run teacher-readiness` | The teacher-readiness audit reports `differentiation 0 of 136`. The lesson contract has no differentiation field; support routes exist in some plans, but a teacher cannot yet read a consistent support/challenge plan for every lesson. | Open | `npm run teacher-readiness`: all other fields 136/136; `differentiation 0 of 136`; `audit/teacher-readiness.md` states the contract reason. |
| Q-012 | P1 | Maths — foundational arithmetic (N1/N2/N3/N4 prerequisites) | Generated practice; `lib/questions.ts`, `lib/numeric-items-core.ts`, `lib/genome.ts`, `lib/misconceptions.ts`, `lib/repair.ts`, `app/api/progress/route.ts` | **Six foundational concepts now name six specific beliefs:** `place-value-face`, `add-carry-drop`, `sub-borrow-unrepaid`, `mul-as-add`, `div-as-subtract`, `frac-of-amount`. Each has a catalogue entry, genome declaration, authored repair, per-option attribution (where the family authors it), and translated names. A wrong answer only records a belief when the chosen option carries it; an unauthored near-miss records nothing. A typed number is matched to the authored wrong value it equals, so an arbitrary wrong number does not invent a cause. | Browser-verified | `assessment-quality`: six foundations `tagged` 40/40 except place-value 27/40 (ones-column face value is the correct answer there) and fractions 13/40 (unit-fraction draws are untagged); `per-option` addition 20, subtraction 20, multiplication 20, division 20, place-value 12, fractions 1. `verify-engines` asserts no belief sits on a key, every tag is catalogued and repaired, and the route records the chosen option rather than the item-level list. Browser on scratch store: tagged wrong `398 + 654 → 1042` names **Drops the carry** and opens the contrast-pair repair; untagged wrong `1093` shows only **NOT YET**, with no invented belief or repair; the micro-check (`673 + 448`, option `1111`) responds with the conceptual explanation. Screenshots: `audit/q012-belief-repair-browser.png` and `audit/q012-repair-browser.png`. |
| Q-013 | P1 | Maths — foundational feedback | `/learn` practice; `lib/questions.ts`, `lib/numeric-items-core.ts` | The five foundation families' wrong options were bare numbers with no explanation of the move that produced them. A pupil could be told only “not quite” plus the correct method. | Fixed, test-verified; partly browser-observed | `wrongNotes` exist for place-value, addition, subtraction, multiplication and division, and the note is returned only for the picked wrong option. `verify-engines` measures 40 spread seeds per family. The browser run above observed the belief-level repair and the silent unauthored-answer branch, but did not click every authored wrong-note option. |

| Q-014 | P1 | Maths — AQA N10 recurring decimals | AQA Higher teaching and assessment; `lib/lessons/authored/decimals.ts`, `lib/lesson-plans.ts` | **The decimals lesson was terminating-only: it taught place value and terminating decimals but never recurring notation, the denominator test, conversion to a fraction, or 0.999... = 1.** A Higher learner could be assessed on N10 without ever being taught it. | Fixed, structurally and browser-verified; unreviewed | `npm run verify`: 4,855 passed, 0 failed (3 planted Promise failures excluded). `assessment:content`: 2,068 checks. `exam:coverage`: N10-recurring now assessment-complete; 5 objectives complete; 19 AQA-style items; 18 complete sequences. Browser on scratch store at `127.0.0.1:4180/learn/maths/decimals`: the read stage taught recurring notation, the 2/5 denominator test, the subtraction conversion and 0.999... = 1; a3 answered 27 and 3/11 (3/3), a4 0.41666... and 6 (2/2), a7 37.5 and 5/12 (3/3), all recorded; a5 and a6 rendered model answers and marking criteria. Screenshots `audit/n10-recurring-teaching-2026-11-27.png` and `audit/n10-recurring-assessment-2026-11-27.png`. Still NOT REVIEWED: no educator signature or learner trial; no translated lesson. |
| Q-015 | P1 | Maths — AQA N2 negative fractions | AQA teaching and assessment; `lib/lessons/authored/negatives.ts`, `lib/lesson-plans.ts` | **The negatives lesson taught integers only: a learner could be assessed on N2 "including fractions" without ever meeting a negative fraction, a signed common denominator, or division by a negative reciprocal.** The lesson's own objective and the specification's wording disagreed. | Fixed, structurally and browser-verified; unreviewed | `npm run verify`: 4,855 passed, 0 failed (3 planted Promise failures excluded); `assessment:content` 2,068 checks. `exam:coverage`: N2-negatives now assessment-complete; 5 objectives complete; 19 AQA-style items; 18 complete sequences. Browser on scratch store at `127.0.0.1:4180/learn/maths/negatives`: the read stage taught negative fractions, ordering through twelfths, a signed common denominator and the reciprocal; a3 answered `-8` and `-5/12` (3/3), a4 answered `5/2` and `-15/8` (3/3), both recorded as independent evidence; a5 rendered its model answer and two criteria. Screenshot `audit/n2-negatives-assessment-2026-11-27.png`. Still NOT REVIEWED: no educator signature or learner trial; no translated lesson. |
| Q-016 | P1 | Maths — AQA Number assessment | `/assessment/number`; `lib/number-checkpoint.ts`, `components/number-checkpoint.tsx` | **Five objectives had complete lesson assessments but no single sitting.** A learner could meet each item under a heading that named its method; they had never had to choose the method across objectives, carry a context through several parts, or see which objective owned the lost marks. A total percentage without an objective breakdown would also hide a secure fractions score beside a weak recurring-decimals score. | Fixed, structurally and browser-verified; unreviewed | The checkpoint has its own 14 items (30 marks: `N2-fractions` 9, `N2-negatives` 6, `N4-prime-factor` 2, `N4-factors` 5, `N10-recurring` 8), and none of them is a lesson assessment item. The earlier version composed the lessons' own items; every one of those items exposes its model answer and marking criteria on the lesson page before the sitting, so the checkpoint measured reading rather than mathematics. The new bank lives only in `lib/number-checkpoint.ts`; `verify-engines` compares every checkpoint prompt with every authored lesson assessment prompt and requires zero matches, requires every item id to be checkpoint-namespaced (`c1`…), and requires the module to import no authored lesson. `numberCheckpointView()` still fails the build if an objective's authored mark total changes without the checkpoint being updated. The public view is walked by `verify-engines`: no `answer`, `accepted`, `modelAnswer`, `marking`, `explanation`, `check` or `structured` field reaches the browser, and the hidden key is exercised by grading a correct and a wrong mixed number plus a five-part contextual item (all five with the reciprocal shown; four of five when the method is omitted). The attempts no longer count as lesson evidence: `POST /api/progress` has a separate `checkpointCheck` action that records `source: "assessment"` and `questionId: "checkpoint:number-checkpoint-1:<item>"`, and that branch never writes `progress.<concept>.lessonCheck`; an authored lesson item sent through the checkpoint door is refused `404`. `npm run verify`: **4,877 passed, 0 failed**; `npm run typecheck`: exit 0. Live on an isolated scratch store: c1 correct, c2 wrong, c3 **5/5**; `fraction-ops` then held `{attempts: 3, correct: 2, lessonCheck: null}`; a real `lessonCheck` for lesson item `a1` then produced `{asked: 1, correct: 1}`, proving the two counters are independent; the ledger held four `checkpoint:` events and one `lesson:` event. A separate full-credit sitting on a fresh scratch learner returned **30/30** across all 14 items and left `lessonCheck` absent on `fraction-ops`, `negatives`, `factors-primes` and `decimals`; its 14 ledger events were all `source: "assessment"` under `checkpoint:number-checkpoint-1:*`. Browser on the same scratch store: `/assessment/number` rendered the 14 new questions (Q1 = `3/4 + 1/6`), Q1 submitted correctly gave **1/1** and the page showed **1/30** with 13 blanks scored 0, and the last ledger event was `source: "assessment"`, `questionId: "checkpoint:number-checkpoint-1:c1"`. The timer is a guide and does not auto-submit. Still NOT REVIEWED: no educator has checked the composition, item equivalence or mark allocation, no learner has sat it under supervision, and it covers five of 35 objectives — it is not a full paper or a grade prediction. |
| Q-017 | P1 | Maths — AQA N4 factors, multiples and primes | `/learn/maths/factors-primes`; `components/factor-model.tsx`, `lib/interactive-models.ts`, `lib/learning-research.ts` | **N4 had a complete prose lesson, but its four "representations" were notation blocks.** A learner could read a factor tree and still never build one, and the 24/36 HCF/LCM rule was asserted beside the tree rather than read from it. Added a `factor-model` to the existing prediction-gated model system: the learner splits 36 by any valid pair, the model refuses a pair that does not multiply to its parent, every composite branch must reach a prime leaf, and only then are 24 and 36 compared (shared primes at the lower power = HCF; every prime at its highest power = LCM; 864 is named as common but not lowest). | Fixed, structurally and browser-verified; unreviewed | `npm run typecheck` exit 0; `npm run verify`: **4,883 passed, 0 failed** (the three planted Promise failures are the harness self-test, excluded); `npm run build` exit 0. Three inspected sources now ground the dossier: Sutarto 2021 (124 grade-4 learners; LCM-as-product, factor/multiple confusion, factor tree divided by 6 rather than the smallest prime), Mahmud 2023 (74 grade-5 learners; a tree answered as 2 and 8, not carried to prime leaves), Mohyuddin & Khalil 2016 (248 class-5 learners; 1 treated as prime, LCM confused with HCF). Browser at 1440×900 and 390×844 on the isolated scratch store: choosing 72 opened the model; 36→4×9→2×2→3×3 gave `2 × 2 × 3 × 3 = 2² × 3²`; every 2/3 leaf was prime; the comparison read HCF 12 and LCM 72; at 390 the page was 390 wide with no sideways scroll, the tree wrapper 306/306, and every factor-pair button 306×44. Screenshot `audit/n4-factor-model-2026-11-27.png`. `audit/exam-coverage.json` now records 6 AQA concepts with a model and 6 browser-verified. Limitations: only the 4×9 route was clicked, pointer input only (no keyboard or screen-reader pass), one number pair, and no educator or learner has used it; the model does not cover three-number HCF/LCM or coprime/equal cases. |

## Lesson-quality evidence (structural, not effectiveness)

`npm run dashboard:lessons` reads all 136 authored lessons:

- 200,298 teaching words.
- 1,059 / 1,059 worked steps state why.
- 391 / 391 misconceptions have a correction and contrast.
- 280 gradable items, 172 constructed responses, 1 explicitly unscored reflection.
- 135 transfer tasks and 424 spaced-retrieval prompts.
- 503 accessibility needs with an authored alternative.
- **0 subject-teacher reviewed; 0 learner-tested.**

`npm run test:isolated -- --only lesson` measured every authored lesson at
320, 375 and 768 px. **135 / 135 rendered their teaching and did not scroll
sideways.** The pilot’s figure checks (bounds, label legibility, overlap,
caption, keyboard focus, simulation counts, marked answers) passed before the
catalog sweep. The run then hit the CDP timeout in Q-010, so the later
interactive-assessment sections were not verified.

`npm run teacher-readiness` reports 135/135 for objectives, prerequisites,
sequence, explanation, worked example, guided practice, misconceptions,
assessment, marking guidance, accessibility and follow-up. Differentiation is
0/135 for the contract reason above; “complete” in that report is structural
completeness, not evidence of teaching quality.

### The first AQA-style item

`fraction-ops`, assessment `a4`, **5 marks**, command word **Work out**:

> A baker has 3 3/4 kg of flour. Each full batch of cakes uses 2/3 kg.
> Work out how many full batches can be made, and how much flour is left over.

Parts: convert the mixed number (1), divide by 2/3 with working and give the
quotient as a mixed number (2: one method, one accuracy), state the number of
**complete** batches (1), and state the **remaining flour in kilograms** (1).
The remainder is `15/4 − 5 × 2/3 = 5/12 kg`; the fractional part of the
quotient, `5/8`, is a fraction of a batch, not a mass.

The content gate checks both valid methods and the specific error:

- `15/4`, `5 5/8`, `5`, `5/12` with working `15/4 × 3/2` → **5/5**.
- `15/4`, `45/8`, `5`, `5/12 kg` with working `45/12 ÷ 8/12` → **5/5**.
- `15/4`, `5 5/8`, `5`, `5/8` → **4/5**, with part (d) zero.
- The same answers with no working → **4/5** (the method mark is not inferred).

This is one item, not a paper. It has no educator review and no learner attempt.
The AQA audit records **2 of its 5 requirements covered** and **0 objectives
assessment-complete**.

## Diagnostic coverage of the question engine

`npm run assessment-quality` draws 40 items for each of the 20 pilot concepts
and now gates the soundness of every named belief:

| Concept | Tagged | Numeric | Per-option tags | Repair |
|---|---:|---:|---:|---|
| addition | 40/40 | 20/40 | 20 | `add-carry-drop` |
| subtraction | 40/40 | 20/40 | 20 | `sub-borrow-unrepaid` |
| multiplication | 40/40 | 20/40 | 20 | `mul-as-add` |
| division | 40/40 | 20/40 | 20 | `div-as-subtract` |
| fractions | 13/40 | 20/40 | 1 | `frac-of-amount` |
| place-value | 27/40 | 20/40 | 12 | `place-value-face` |

The gaps are now named rather than hidden. Place-value's ones-column face value
is the correct answer, so that draw cannot diagnose the belief and is untagged.
Fractions' unit-fraction draws are untagged because stopping after the division
is correct when the numerator is 1; only the `n > 1` draws and one multiple-
choice branch carry `frac-of-amount`. That is honest partial coverage, not full
branch coverage. Every named belief is catalogued for its concept, has an
authored repair, and appears only on a wrong option; a tagged item's explanation
must state its own answer.

The gate fails on a belief attached to the key, an uncatalogued or unrepaired
belief, an explanation that omits the answer, or foundation arithmetic and
distractors that do not agree with the prompt. It is wired into `npm run verify`.

### Translation status for the six beliefs

- **Names:** authored in all 15 dictionaries.
- **Coaching:** authored in `es`, `fr`, `pt` and `de`, so those languages have
the whole 21-belief repair set; the other eleven keep the honest empty-coaching
branch and show the translated name only.
- **Review:** none of the six new coaching paragraphs is educator-reviewed or
native-speaker reviewed. They are authored translations, not approved ones, and
must not be reported as such.

## What was actually verified

- `npm run typecheck` — exit 0 after the Q-012 route, numeric and translation
  changes.
- `npm run verify` — **exit 0**; engine suite **4851 passed, 0 failed**;
  assessment content **1913 checks passed**; lesson interactions 25, assessment
  marking 80, multilingual 2744, school reality 110, offline assessment 555,
  question gate 206, right-level 21, exam coverage 516/516 and options 34/34.
  The planted Promise failures at the top of the engine suite are deliberate
  self-tests and are excluded from the totals. The real-Postgres half is skipped
  without `OPENMIND_TEST_DATABASE_URL`, and is reported as skipped, not passed.
- `npm run assessment-quality` — exit 0; every named belief is on a wrong
  option, catalogued, repaired and explained; the six foundations' independent
  arithmetic and claimed distractors agree.
- `npm run build` — exit 0.
- `npm run exam:coverage` — exit 0; **5 objectives assessment-complete, 0
  assessment-partial, 19 AQA-style items**; 18 complete sequences; 8 demand gaps;
  verdict **NOT EXAM-READY**.
  No objective is claimed reviewed, learner-tested or mastered.
- Browser on the isolated scratch store at `127.0.0.1:4180`:
  - a tagged wrong numeric answer `398 + 654 → 1042` rendered **Drops the carry**
    and the full contrast-pair repair;
  - an arbitrary wrong answer `846 + 248 → 1093` rendered **NOT YET** with no
    named belief and no repair, so the product does not invent a cause;
  - the follow-up micro-check `673 + 448` option `1111` was marked wrong and
    produced the conceptual explanation;
  - the repair card carries the **Not yet checked by a subject teacher** label.
- The earlier corrected `a4` browser run remains evidence for the assessment:
  reciprocal 5/5, common-denominator 5/5, `5/8 kg` 4/5, 375 px with no sideways
  overflow.

## Remaining limitations

- No educator has reviewed these lessons, beliefs, repairs or items.
- No learner has used the fixed journey; the evidence is a developer browser
  session with scratch data.
- No mastery or examination-readiness claim is supported.
- The six new coaching paragraphs are authored translations, not
  native-speaker-reviewed ones. Eleven languages still show no coaching
  paragraph for any belief, by design rather than by silent English fallback.
- Fractions' per-option attribution is thin: one multiple-choice draw in 40
  spread seeds. The item-level tag is present on 13/40 draws; the unit-fraction
  branch is deliberately untagged. Place-value's ones-column draw is similarly
  untagged because its face value is the correct answer.
- The live deployment is not updated by this work. No commit, push or deploy was
  made.
- Q-010's lesson-walk CDP timeout and Q-011's differentiation 0/136 remain open.

## Next action

`N2-fractions`, `N2-negatives`, both N4 objectives and `N10-recurring` now have
**all their published requirements** covered by assessment items, and the N2 and
N10 items are browser-verified. That is coverage, not examination readiness: 19
items are not a paper, 0 educators have reviewed them and 0 learners have sat
them. The highest remaining Number teaching gap is **N8 exact π**, followed by
**N9 calculator displays**, **N13 units/metric conversions** and **N15/N16
error intervals/limits**. In parallel, the authored items and repairs need
subject-teacher review; no further learner-impact claim should be made until that
review and a learner try-out exist.
