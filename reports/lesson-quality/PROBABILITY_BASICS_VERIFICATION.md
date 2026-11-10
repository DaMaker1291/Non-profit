# Probability basics — verification record

**Date:** 2026-11-09

**Scope:** the authored `probability-basics` lesson, its sample spaces, Venn and
tree counts and repeated-trial arithmetic, its two static drawings, the
interactive two-set Venn and dependent-tree activities, the coin/die/
without-replacement simulation, its rendering at four widths, the visible
assessment and activity controls, and the server-marked assessment path.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** **49 authored, 86 outline, 49 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`**. The regenerated audit reports **6
critical gaps, 83 high-priority gaps and 46 lessons awaiting review**. The new
lesson is `machine_checked`; no teacher or learner has reviewed it.

## 1. Why this concept

`probability-basics` was the first critical concept in the queue after
`indices-intro`. The genome declares **no prerequisites** for it, and names
`tree-diagrams`, `sets-venn` and the later statistics concepts as its
dependants. The lesson therefore does not invent a prerequisite edge: it
declares none, and its two diagnostics probe the fraction and percentage skills
the lesson actually uses.

The concept had a supplemental plan and no authored lesson. It now has one, and
two drawn representations of the two arguments prose is weakest at carrying:
the Venn regions behind the addition rule, and the changing branches of a
without-replacement tree.

The scope is matched to the published GCSE mathematics subject content for
probability. The source record is the Department for Education's *GCSE
mathematics: subject content and assessment objectives*:
`https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives`.
No specification, textbook or commercial lesson text is reproduced. The prose,
examples, practice, assessment and the diagnostic-test transfer are original to
OpenMind.

## 2. What the lesson contains

| Part | Content |
|---|---|
| Objectives | Three measurable objectives: build a sample space and justify equal likelihood; use complement, mutually exclusive and general addition rules; distinguish exclusivity from independence and handle repeated trials |
| Prerequisite checks | Two diagnostics probing `fractions` (5 red of 8 counters is 5/8) and `percentages` (40% of 30 is 12), with no declared graph prerequisite |
| Explanation | Five sections, ten paragraphs: outcomes and sample spaces; theoretical probability and relative frequency; the complement and the two meanings of "one"; mutually exclusive against independent; the addition rule, Venn regions and the without-replacement tree |
| Representations | Five `maths.expression` blocks: the probability scale; the 36 two-dice outcomes; the four Venn regions of the 30-student group; the four tree paths for 3 red and 2 blue; at least one against exactly one six in four rolls |
| Drawn figures | A Venn with 12 football-only, 6 tennis-only, 6 both and 6 neither, and a tree whose first branches are 3/5 and 2/5 and whose conditional branches are 2/4, 2/4, 3/4 and 1/4, producing paths 6/20, 6/20, 6/20 and 2/20 |
| Interactive activities | A keyboard-first two-set Venn region table whose selections shade the SVG; a server-marked union selection and `P(neither)` value; a dependent-tree completion with the path totals hidden until marking; a die and a two-draw without-replacement simulation alongside the coin |
| Simulation | Deterministic coin, die and two-draw without-replacement models with cumulative 20, 200 and 2,000-trial controls and a reset. Each states what is simulated and shows observed against theoretical proportions |
| Worked examples | Total 7 or 12 on two dice; at least one head against exactly one in three tosses; the 30-student Venn union and neither; at least one red without replacement, compared with replacement; at least one six against exactly one in four rolls |
| Misconceptions | Seven: adding overlapping probabilities; confusing mutually exclusive with independent; confusing at least one with exactly one; treating relative frequency as guaranteed; applying the power formula without independence; assuming equal likelihood from the number of categories; forgetting that a sample space sums to 1 |
| Guided practice | 5/8 and 3/8; at least one head 3/4 and exactly one 1/2; 32/40 and 8/40 in a 40-student Venn; 1/15 and 14/15 for two draws from 4 red and 2 blue |
| Independent assessment | `a1`, a constructed response on dependent draws and the error in 1 − (4/7)², is explicitly **unscored** and excluded from mastery; `a2` = 3/8; `a3` = 0.2 for independent events; `a4` = 0.8 for mutually exclusive events; `a5` = 1/5 for neither sport |
| Transfer | A 90%-sensitive, 90%-specific test at 1% prevalence: 90 true positives, 990 false positives, 90/1,080 = 1/12 ≈ 8.3%, not 90%; at 10% prevalence the answer becomes 900/1,800 = 50% |
| Retrieval | Three prompts at next-day, week-later and month-later spacing |
| Accessibility | Five authored alternatives: every set also in words and counts, reading-size notation, one rule per line, Venn regions labelled rather than coloured, typed answers only. Both lesson SVGs are `aria-hidden`; their authored captions are the accessible description |

The browser counts the rendered teaching as 27 prose paragraphs, five
representation blocks, two drawn figures, a 406-word transfer and a 57-word
retrieval section. The interactive pass adds three learner-facing surfaces: the
Venn table and shaded diagram, the tree completion, and the experiment selector
with its theoretical column. They are measured through the visible controls,
not only through their modules.

**The two drawings are part of the lesson, not the question bank.** They use a
separate `LessonFigureSpec` so a lesson figure cannot leak into a served
question. The Venn geometry lives in `lib/lesson-figure.ts#vennLayout` and the
tree geometry in `treeLayout`; `components/lesson-figure.tsx` draws them and
renders the caption the author wrote. The gate checks the region counts, the
four complete paths, the conditional branch values and the captions, and the
browser walk counts the two circles and four paths on the rendered page.

**The simulation is a model.** `components/probability-simulation.tsx` calls
`simulateExperiment` from `lib/probability-simulation.ts`, which uses a
deterministic PRNG. It never claims to test a physical coin. The page says, for
the coin: "This is a simulation of a fair-coin model, not an observation of a
physical coin." The same panel can run a fair die or draw two counters without
replacement, and each experiment labels its own theoretical column. The gate
checks determinism, 2,000-toss exhaustiveness, a value near 1/2 over 2,000
tosses, the empty-run case, seed variation, six die faces, four bag paths and
the 6/20, 6/20, 6/20, 2/20 theoretical split. The browser walk presses the
200-trial control and the reset for the coin, then switches to the die and the
bag and accounts for every outcome.

## 2a. The reusable visualisation layer

The interactive work did not add a second diagram system. It extends the
existing `LessonFigureSpec` geometry and keeps the new mathematics in one pure
module:

- `lib/probability-activities.ts` owns the two- and three-set region algebra,
  the union and complement, rational comparison (`6/30`, `0.2` and `20%` are
  the same answer), the tree fields and the activity grader. The three-set
  representation is data- and marking-complete; the lesson page renders the
two-set diagram.
- `components/probability-venn-activity.tsx` uses `vennLayout` for the SVG and
  a checkbox table as the keyboard control. Selected regions are shaded with
  SVG masks; the table remains the accessible reading and the interaction.
- `components/probability-tree-activity.tsx` reuses `LessonFigure` and
  `treeLayout`, with `showPaths={false}` so the leaf totals the learner must
  calculate are not printed. The branch probabilities stay visible.
- `app/api/progress` gained a `probabilityActivity` action on the existing
  learner transaction: `checkPresentedSecret` proves the capability,
  `answerEvidence` names the activity, and `commitAndProjectIn` writes the
  ledger event. The expected answer is never sent by the browser.

This is deliberately **two-set visual, three-set model**. A three-set diagram
would need its own geometry and browser checks; claiming it because the
region algebra supports it would be the kind of implementation-by-union this
project has had to correct before.

## 3. Independent arithmetic verification

`scripts/probability-basics-lesson-check.mjs` builds the sample spaces by
enumeration rather than reading the lesson's answers.

```bash
node scripts/probability-basics-lesson-check.mjs
```

Result: **201 passed, 0 failed**. The assertions include:

- two dice: 36 distinct ordered outcomes; six ways to make 7 and one to make 12;
  P(7) = 1/6, P(12) = 1/36, P(7 or 12) = 7/36; 11 outcomes with at least one six
  and 25 without, summing to 1;
- three coins: eight lists, seven with a head, one TTT, three with exactly one
  head; 7/8 and 3/8; the two-coin values 3/4 and 1/2;
- the 30-student Venn: football only 12, tennis only 6, both 6, neither 6;
  union 24; 4/5, 3/5 and 1/5; the four regions total 30;
- the 3-red-2-blue tree: 20 ordered pairs, paths of 6, 6, 6 and 2; P(at least
  one red) = 9/10; with replacement 21/25, not 9/10; the 4-red-2-blue bag gives
  1/15 and 14/15;
- independence 0.4 × 0.5 = 0.2; exclusivity 0.3 + 0.5 = 0.8; heart and king
  independent at 1/52, heart and spade mutually exclusive at 0;
- four rolls: (5/6)⁴ = 625/1296, at least one six 671/1296 ≈ 0.5177, exactly one
  six 500/1296 ≈ 0.3858;
- the diagnostic test: 100 affected, 90 true positives, 990 false positives,
  1,080 positives, 90/1,080 = 1/12 ≈ 8.3%; at 10% prevalence, 900/1,800 = 50%;
- every keyed assessment accepts its model answer, including 3/8, 0.2, 0.8 and
  1/5;
- the Venn layout places every region inside its circle or outside both, the
  tree layout places every first-stage and leaf node inside the drawing, and the
  path probabilities sum to 20/20;
- the simulation is reproducible for a fixed seed, exhaustive for 2,000 tosses,
  near 1/2 at that size, zero for an empty run, and different for different
  seeds;
- the Venn activity's union is exactly the three regions inside either circle,
  its complement is `neither`, and `6/30`, `0.2` and `20%` compare equal while
  `1/0`, `-1/5` and prose are refused;
- a union missing the overlap is marked wrong with a reason; an unknown or
  duplicated region is malformed input, not a recorded misconception;
- the tree activity's four fields accept equivalent fraction/decimal forms, a
  partial tree is false with its three correct fields preserved, and an
  unparseable value is refused;
- the die run has six faces and 600 rolls, the bag run has four paths and 600
two-draw trials, and `combineExperiments` adds 20 + 200 to 220 rather than to
  400;
- `a1` carries `scored: false`, and no constructed response is silently graded.

## 4. Defects the checks found

1. **Three gate assertions used exact floating-point equality** on percentages:
   `9,900 × 0.1` is `990.0000000000001`, so the false-positive count, the total
   positives and the 10%-prevalence false positives failed. This was a harness
   defect, not a content defect; the comparisons now use the tolerance applied
   everywhere else.
2. **One caret notation (`(1 − p)^(n−1)`) was present in the first draft.** It
   was rewritten as `(1 − p)ⁿ⁻¹` before the lesson framework ran, using the
   sweep introduced after batch 27. No raw notation reached the framework in
   this batch.
3. **The first browser run's figure and simulation probes returned `null`.**
   The page was rendering the figures and the click had changed the simulation;
   the evaluated IIFEs in `scripts/lesson-walk.mjs` lacked a top-level `return`,
   so the harness received `null` from the evaluator. The probes were corrected
   and the rerun measured 2 circles, 4 tree paths, 200 tosses (105 heads + 95
   tails) and a reset to 0. This was a harness defect, not a product defect.
4. **The Venn accessibility assertion was case-sensitive.** It looked for
   `Football` and `Tennis`, while the authored caption says "football" and
   "tennis" in sentence case; the SVG labels are capitalised but are
   `aria-hidden`. The assertion now checks case-insensitively and the tree
   assertion checks a phrase from the caption itself. The product change was
   none; the check had been measuring the wrong casing.
5. **No arithmetic error was found.** The sample spaces were enumerated
   independently, and the transfer's counts were recomputed from the population
   rather than compared with the prose.

## 5. Browser and application evidence

### Full lesson walk

The dev server was started with a scratch store:

```bash
DATA=$(mktemp -d /tmp/openmind-prob-XXXXXX)
OPENMIND_DATA_DIR="$DATA" npm run dev
LESSON_WALK_SHOTS=0 npm run verify:lesson
```

The walk's client environment does not configure the server, so the store named
above is the one that matters. It created a scratch learner, not a pupil, and
the scratch store was removed after the run. The live `.openmind-data` store was
not opened.

Result: **524 passed, 0 failed**. The walk measured all 21 planned lessons at
1280 and 320 px and all **27** authored lessons whose contract it opens at
1280, 768, 375 and 320 px.

For `probability-basics`:

- the authored contract renders;
- 3 objectives, 7 misconceptions and 4 guided items are visible;
- 27 prose paragraphs and 5 representation blocks render;
- **two silent SVGs are drawn**: 2 circles and 4 tree paths, with the region
  counts and the path values visible as text;
- both drawings carry their authored teaching caption, and the captions reach
  the **browser accessibility tree** (the Venn caption mentions football, tennis
  and the union 24; the tree caption names the changed branch and the 2/20
  failing path);
- the **simulation starts at zero**, adds 200 tosses accounting for all of them
  (105 heads + 95 tails in this run), states that it is a model rather than a
  physical coin, and resets to zero;
- the **Venn table is keyboard-operable**: focus reached the Football-only
  checkbox, Space toggled it, selecting Football only/Tennis only/both produced
  a server-marked correct union with 24, and `20%` was accepted as `1/5`;
- the **dependent tree was completed and marked**: 6/20, 2/20, 9/10 and
  "Dependent" returned four correct fields; "nonsense" was refused visibly and
  was not painted as a correct answer;
- the **die and bag experiments** each ran 200 trials: six die faces summed to
  200, four bag paths summed to 200, and the theoretical 1/6, 10% and 30%
  columns were visible;
- the **interactive Venn fits 320 px** (286 vs 286);
- the visible **`a1` label says "Unscored reflection" and "does not count
  towards mastery"**.
- **the visible assessment control was answered**: `a2` was present and enabled,
  typed as `3/8`, pressed Check, and the page painted "Correct ... recorded on
  this concept as an independent answer";
- `a3` was typed as `0.2` through the same visible control and marked correct;
- `a4` was typed as `0.5` and marked wrong, showing the correct `0.8`;
- `a5` was typed as `20%` and marked correct with `1/5`; the wrong value `1/4`
  and the unparseable value `not a fraction` were both refused rather than
  painted correct;
- the draft-status footer is present;
- the transfer is 406 words and the retrieval section 57 words;
- the page fits **320 vs 320**, **375 vs 375**, **768 vs 768** and
  **1280 vs 1280**.

The walk now drives the static assessment form (`a2`–`a5`), the Venn table and
its probability value, the tree completion and its malformed-input path, and
all three simulation experiments. `a5` is no longer HTTP-only: its correct
alternative, wrong value and unparseable value were exercised through the
visible control. `a1` is visibly labelled unscored and is refused by the
server, so no mark is invented for it.

### Assessment path

`scripts/probability-basics-live-check.mjs` used the real HTTP endpoints with a
fresh scratch learner in the same server store:

- `a3` with `0.2` was marked correct, with the model answer and criteria;
- `a4` with `0.5` was marked wrong, and the true mutually exclusive sum `0.8`
  was returned;
- `a5` with `1/5` was marked correct;
- `a1`, the constructed response, was refused with `400 not gradable`; its
  `scored: false` contract is what makes that refusal structural;
- a correct union selection returned the 24 count; a union missing the overlap
  was false; `20%` was accepted as `1/5`; a completed dependent tree returned
  four correct fields; a partial tree was false with three correct fields;
- a malformed union and a malformed tree value were both refused with `400` and
  recorded no event;
- a wrong capability secret was refused with `401`;
- `profiles.json` stored `lessonCheck: { asked: 8, correct: 5 }` across the
  three original items and five structured attempts;
- the evidence ledger held exactly **three** lesson events and **five** activity
  events, all `mode: independent`, `hints: 0`, with three activity successes and
  two activity failures preserved separately.

Result: **32 passed, 0 failed**. This is API-level evidence for `a1`, `a3`,
`a4`, `a5`, the Venn activities and the tree activity; the visible form was
measured separately for `a2`–`a5` and the interactive controls.

### What the accessibility-tree check is, and is not

`Accessibility.getFullAXTree` in Chromium was enabled and the full tree was read
after the lesson rendered. It confirmed that the two figure captions are
exposed as text while the SVGs are `aria-hidden`, and that the captions are read
before the practice door. **This is not a screen-reader session.** No VoiceOver
or NVDA session was run, and the Unicode notation (`ⁿ`, `∪`, `∩`, `≈`, `²`,
`³`, `⁴`) has not been tested with a real screen reader. The lesson's authored
accessibility alternative says the sets and counts are repeated in words; that
claim is supported by the prose, but the pronunciation of the symbols
themselves remains unmeasured. This limitation is carried into section 9 rather
than being converted into an accessibility claim.

A separate structural audit (`npm run verify:a11y`) against the production
build passed **73/0** across the landing, curriculum, help, about, offline and
access surfaces, including one h1, labelled controls, named links, drawings
hidden or named, no positive tabindex, reduced-motion behaviour and 320-px
reflow. It is still not a screen-reader session; section 9 keeps that limit.

## 6. Checks actually run

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4630 passed, 0 failed** (three planted failing controls excluded) |
| `npm run verify:lessons` | exit 0; includes the **201-assertion** probability gate and the **23-assertion** ratio/proportion/sequences checks |
| `node scripts/probability-basics-lesson-check.mjs` | **201 passed, 0 failed** |
| `npm run build` | **exit 0, 69 static pages generated** |
| `npm run verify:lesson` | **524 passed, 0 failed**, including the visible `a2`–`a5` submissions, Venn/tree activities, three simulation experiments and the 320-px check |
| `node scripts/probability-basics-live-check.mjs` | **32 passed, 0 failed** |
| `node scripts/lesson-quality-audit.mjs` | **49 authored · 86 outline · 49 review · 6 critical · 83 high** |
| `node scripts/lesson-catalogue.mjs --write --report` | **49 authored · 86 outline · 49 `machine_checked`** |
| `node scripts/lesson-quality-dashboard.mjs` | **49 authored · 2 drawn figures · 363/363 why-steps · 1 unscored reflection · 0 educator-reviewed · 0 learner-tested** |
| `npm run verify:a11y` | **73 passed, 0 failed** against the production build; its own limits are recorded in section 9 |
| `npm run disk-headroom` | **6.7 GB free (WARN)**; above the 5.0 GB refusal bar, below the 8.0 GB watch threshold. The shared volume moved during the run |
| `git diff --check` | clean |

## 7. Independent Problem-Solving Capability

The six stages are recorded as **opportunities present**, not pupil outcomes.

| Stage | Opportunity in the lesson | Evidence status |
|---|---|---|
| Understand | Probability as a measure on a sample space; the equally-likely assumption stated before counting | Machine-checked structure; no pupil explanation |
| Recognise | Items require choosing between complement, exclusive addition, general addition and tree methods | Machine-checked; no pupil response |
| Apply | `a2`–`a5` and the Venn/tree activities marked and submitted through the visible form | Visible form, interactive controls and server marking; no human score |
| Explain | `a1` asks why two draws are dependent and why the power formula is wrong there, with five criteria | Criteria authored; the item is explicitly unscored and excluded from mastery |
| Transfer | The diagnostic test at 1% and 10% prevalence requires building a two-way count and separating P(positive given condition) from P(condition given positive) | Model answer checked; no pupil attempt |
| Retain | Next-day, week-later and month-later prompts | Scheduled only; no delayed evidence |

The limited claim: the lesson **provides** these opportunities and the
application can mark the deterministic ones, visibly and server-side. It does
not demonstrate that a pupil chooses the right rule without being told.

## 8. Quality dashboard

`npm run dashboard:lessons` writes
`reports/lesson-quality/dashboard.md` and `dashboard.json`. It compares every
authored lesson on the nine requested dimensions, using counts read from the
lessons rather than a synthetic score:

| Measure | Current evidence (all 49 authored lessons) |
|---|---:|
| Conceptual explanation | 70,021 teaching words; 172 representation blocks |
| Worked-example quality | 363 / 363 steps state a reason of at least eight words |
| Misconception coverage | 142 / 142 beliefs have a correction and a contrast |
| Independent assessment | 88 gradable items; 54 constructed responses, including **1 explicitly unscored reflection** |
| Transfer | 49 transfer tasks |
| Accessibility | 192 accessibility needs with an authored alternative |
| Retention | 136 spaced-retrieval prompts |
| Educator approval | 0 subject-teacher reviews |
| Learner evidence | 0 learner-testing records |

The first seven columns are structural and machine-readable; they are not a
quality score. The last two columns require a human being and are reported as
zero rather than converted into a percentage. The dashboard is a report, not a
learner-facing page and not a gate: it must be regenerated after a lesson
change, and a stale dashboard is a stale claim.

## 9. What remains unproven

- **No teacher review.** `reviews` is empty. `machine_checked` is not
  `educator_reviewed`.
- **No learner trial.** `learnerTesting` is empty. The scratch learner and the
  walk's guest learner are harnesses, not pupils.
- **No screen-reader session.** The browser accessibility tree was measured, but
  VoiceOver and NVDA were not run. The Unicode superscripts and set symbols in
  the notation have not been heard through a screen reader; keyboard-only
  completion, 200% reflow and contrast also remain unmeasured.
- **The visible form covers `a2`–`a5`.** `a5` was typed as `20%`, `1/4` and
  `not a fraction` through the rendered control; the first was marked correct
  and the other two were refused. `a1` is visibly labelled unscored and was
  exercised through HTTP to prove the server refuses to mark it; its prose was
  not submitted as a claim of mastery.
- **The visual Venn is two-set, although the model is three-set.** The region
  algebra, union/complement and marking support a three-set spec, but the page
  renders and measures only the two-set diagram. A three-set visual surface is
  not claimed.
- **No drawn question figure is claimed here.** The lesson drawings are separate
  from the question bank; a lesson figure cannot leak into a served question.
- **The simulation is a model, not an experiment.** It samples a fair coin, a
  fair die and a stated two-draw bag; it cannot establish whether a physical
  coin is fair, and no pupil used it.
- **No deferred-retention evidence.** The retrieval prompts are scheduled, not
  delivered or measured.
- **The wider comparison is unfinished.** The Cognito, Seneca, Dr Frost, Isaac
  and other-platform study remains a separate research workstream.
- **Coverage remains the main gap.** 86 concepts still have only an outline or
  plan; 6 are critical.
- **Disk headroom is 6.7 GB at the final check (WARN).** That is above the
  5.0 GB refusal bar and below the 8.0 GB watch threshold; the production build
  and the full walk still completed. The volume is shared with the rest of the
  machine and moved during the run. Restoring 8 GB would require deleting
  dependencies or data outside this task's scope, and this run did not do that.

No claim of publication approval, teacher approval or learner success is made.
