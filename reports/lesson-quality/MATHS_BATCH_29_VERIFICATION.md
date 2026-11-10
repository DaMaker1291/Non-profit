# Ratio, Proportion and Sequences — batch 29 verification

Date: 2026-11-09. Branch: `main`. No commit, push, deployment or live-store
change was made.

## Scope

Three authored mathematics lessons were added to the existing
`openmind.lesson/1.0` contract:

- `ratio` — part-to-part comparison, equivalent ratios, sharing a quantity, and
  different units.
- `proportion` — direct proportion with a constant quotient, inverse proportion
  with a constant product, and a table/graph representation. The genome declares
  `ratio` as its prerequisite.
- `sequences` — term-to-term and position-to-term rules, arithmetic and geometric
  sequences, and a quadratic contrast.

Each has three objectives, three misconceptions with corrections and contrast
pairs, a diagnostic, three guided items, three assessments including a
constructed response, a transfer task, three spaced-retrieval prompts and
accessibility alternatives. The lessons are authored content, not generated
from the genome paragraph.

## Catalogue and dashboard

`npm run lesson:catalogue` and `npm run dashboard:lessons` were regenerated
from the actual lesson objects:

| Measure | Result |
|---|---:|
| Authored lessons | **49** |
| Maths authored | **25** |
| Remaining outlines | **86** |
| Machine-checked | **49** |
| Educator-reviewed | **0** |
| Learner-tested | **0** |
| Teaching words | **70,021** |
| Representation blocks | **172** |
| Worked steps with a reason | **363 / 363** |
| Misconceptions with correction and contrast | **142 / 142** |
| Gradable assessment items | **88** |
| Constructed responses | **54** |
| Explicitly unscored reflections | **1** |
| Transfer tasks | **49** |
| Spaced-retrieval prompts | **136** |
| Accessibility alternatives | **192** |

The single unscored reflection remains `probability-basics` `a1`; these three
lessons do not add a graded claim to it.

## Independent arithmetic

`node scripts/maths-batch-lesson-check.mjs` recomputes each key rather than
reading the lesson's own answer:

- 18 : 24 = 3 : 4, with shares 3/7 and 4/7 of the whole.
- £84 in 5 : 2 is £60 and £24.
- 1.5 m : 50 cm is 150 : 50 = 3 : 1.
- The concrete transfer needs 187.5 kg of cement for 750 kg of sand and is
  37.5 kg short.
- £12.50 for 5 kg gives £2.50/kg and £20 for 8 kg.
- 6 workers × 8 days = 48 worker-days, so 4 workers take 12 days.
- The table has a constant quotient of 3.5.
- 5, 9, 13, 17 has difference 4 and nth term 4n + 1.
- 3, 6, 12, 24 has ratio 2 and continues 48, 96.
- 2, 7, 12, 17, 22 has nth term 5n − 3.
- 5n − 2 at n = 12 is 58.
- 80, 40, 20, 10 continues 5.
- 3n + 2 gives 62 at figure 20 and first exceeds 100 at figure 33.

Result: **23 passed, 0 failed**.

## Browser evidence

The full lesson walk was run against a scratch store; the live
`.openmind-data` store was not opened. It opened **27 authored lessons** at 1280,
768, 375 and 320 px. The new lesson pages each report three objectives, three
misconceptions, three guided items, at least two representation blocks, a
transfer, retrieval and the draft footer, and fit all four widths.

Visible assessment submissions:

| Lesson | Item | Typed | Result |
|---|---|---|---:|
| `ratio` | `a1` | `3:4` | correct |
| `proportion` | `a1` | `30` | correct |
| `sequences` | `a1` | `58` | correct |

The walk also submits `probability-basics` `a5` through the rendered control:
`20%` is accepted as `1/5`, while `1/4` and `not a fraction` are refused rather
than painted correct. `a1` remains visibly labelled as an unscored reflection.

Final browser result: **524 passed, 0 failed**.

### Reusable bar model

The ratio lesson's `r2` representation now carries a drawn `kind: "bar"` figure
in the existing `LessonFigure`/`LessonFigureSpec` system. The bar is split into
five equal units, three shaded and two plain, with the parts and whole labelled.

- **8/8** layout assertions pass: the 3 + 2 parts make 5, the first occupies 3/5
  of the width, the second 2/5, the widths fill the whole, and five units produce
  four internal cuts.
- The browser walk checks the rendered page: the bar is **394 px** wide and splits
  **236.3 : 157.5 px**, within 0.02 of 3/5 : 2/5, and the labels `3 parts`,
  `2 parts` and `5 equal parts` are on screen.
- The SVG remains `aria-hidden`; the authored figure caption is the accessible
  description. This is the first reusable visual-toolkit slice, not the whole
  six-tool programme.

### Live server and persistence

`node scripts/maths-batch-live-check.mjs` (also available as
`npm run verify:maths-batch-live`) ran against the same scratch server and
created its own learner. It submitted `3:4`, `30` and `58` for the three `a1`
items, then submitted a wrong `9:4` for ratio and a wrong capability secret:

- all three correct submissions returned `correct: true`, a model answer and
  marking criteria;
- the wrong ratio answer was marked wrong and retained as an attempt;
- the wrong secret was refused with `401`;
- `profiles.json` stored ratio at **asked 2 / correct 1**, and proportion and
  sequences at **asked 1 / correct 1**, each under its own concept;
- the evidence API and the on-disk
  `evidence/<learnerId>.jsonl` ledger each held **four** lesson events — three
  correct and one wrong — all `mode: independent`, `hints: 0`, with the three
  items named separately.

Result: **20 passed, 0 failed**. The live check would have failed if the
submission were only painted in the browser, if the wrong attempt were dropped,
if the three concepts shared one counter, or if the ledger were absent.

## Gates and build

| Check | Result |
|---|---:|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4,630 passed, 0 failed** |
| `npm run verify:lessons` | exit 0, including the **201** probability, **23** batch-29 and **8** bar-model assertions |
| `npm run verify:maths-batch-live` | **20 passed, 0 failed** against a scratch store; per-concept counters and the ledger were read back |
| `npm run lesson:catalogue` | exit 0, wrote `audit/lesson-catalogue.json` and `.md` |
| `npm run dashboard:lessons` | exit 0, wrote `reports/lesson-quality/dashboard.json` and `.md` |
| `npm run verify:bar-model` | **8 passed, 0 failed**; the 3:2 bar is 3/5 and 2/5 by width, with five units and four internal cuts |
| `npm run build` | exit 0 |
| `npm run disk-headroom` | 6.7 GB at the final check; WARN, above the 5.0 GB refusal bar |

## Three-set Venn scope

A search of the supported specification registry found no requirement for a
three-set Venn visual. The probability model still supports three-set region
algebra and marking, but the learner-facing diagram remains two-set. This is a
documented scope boundary, not a claim that the three-set visual is complete.

## What is not claimed

- No screen-reader session (VoiceOver/NVDA) was run. The browser accessibility
  tree and keyboard operation were measured; that is not a screen-reader test.
- No teacher review and no learner trial. Both records remain empty.
- No deferred-retention evidence; the retrieval prompts are scheduled, not
  delivered.
- No console or network-error sweep was added for the new pages in this batch.
- The shared volume moved during the session; disk headroom remains tight.

The lessons are `machine_checked`; they are not `educator_reviewed`,
`learner_tested` or `published`.
