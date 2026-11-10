# Lesson transformation — implementation and verification record

This file records what was actually changed in the repository, what was measured,
and what remains unproven. It is deliberately not a claim that OpenMind now
teaches every subject well: 56 of 135 concepts have an authored lesson meeting
`openmind.lesson/1.0`, and none has been reviewed by a teacher or tested with
learners.

The research reports this work rests on:

- `docs/research/UK_SECONDARY_BENCHMARK.md` — platforms inspected, what was
  observed, access limits.
- `docs/research/LEARNING_SCIENCE.md` — retrieval, spacing, worked examples,
  cognitive load, feedback, transfer, misconception teaching, subject pedagogy.
- `docs/LESSON_QUALITY_FRAMEWORK.md` — the 24 dimensions and the review ladder.

The concept-by-concept audit and queue are generated:

- `reports/lesson-quality/audit.json`
- `reports/lesson-quality/audit.md`
- `reports/lesson-quality/queue.md`

## 1. What changed

### Authored lessons: 16 → 56

Eleven lessons were added across batches 1–12, each written to its own subject
framework rather than a shared template:

| Concept | Subject | Why this concept | What the lesson does differently |
|---|---|---|---|
| `quadratics` | Mathematics | Every previous authored maths lesson was primary arithmetic; this is the first secondary algebra lesson | Teaches the zero-product structure before the factorising routine; area model; discriminant read against the graph; modelled problem with a rejected root |
| `cells` | Biology | The plan was a labelled diagram list | Structure→function reasoning for every organelle; surface-area-to-volume argument; red blood cell and root hair as trades, not trivia |
| `forces-basics` | Physics | Definitions of force with no free-body reasoning | Free-body diagrams, resultant force, balanced forces mean constant velocity; units treated as part of the answer; worked examples rearrange before substituting |
| `periodic-table` | Chemistry | Taught as a wall chart to memorise | Position derived from electron configuration; group trends derived from distance and shielding; formulae derived from electron transfer; balanced equations |
| `algorithms-search` | Computing | Search taught as a definition with no trace | Runnable Python, a step-by-step trace with bounds, five edge-case tests, and a real off-by-one debug |
| `enzymes` | Biology | The plan defined enzymes but did not explain a rate graph | Active-site shape as the mechanism; collisions vs denaturation on the two sides of the temperature peak; saturation and limiting factors; a fever transfer task |
| `atoms-elements` | Chemistry | Atomic structure was a diagram to label | Proton count as identity; isotopes from neutron count; relative atomic mass derived as a weighted mean (3:1 chlorine, 35.5); balanced equation and particle model |
| `variables` | Computing | Types listed without a trace | Right-to-left assignment; type-dependent operators; a line-by-line trace; a real `input()` type bug and repair; a code assessment |
| `diffusion` | Biology | Transport was named, not explained | Random motion as the mechanism; net movement from high to low concentration; osmosis as diffusion of water through a membrane; plasmolysis and active transport as the two cases the simple rule misses |
| `electron-shells` | Chemistry | Configuration was a sequence to copy | Shell filling derived from the periodic table's structure; group number as outer electrons; ion charge as the shortest route to a full shell; formula of an ionic compound built from charges; a particle-model explanation |
| `loops` | Computing | Iteration taught without a trace or a boundary test | A counted loop and a while loop written in Python; a line-by-line trace; the accumulator pattern; an off-by-one boundary tested at both ends; a debugging exercise and a code assessment |

All eleven are in `lib/lessons/authored/index.ts` and in the compile list in
`scripts/compile-engines.mjs`, so `npm run verify` judges the real files against
the real gate.

### Batch 13: three critical concepts

| Concept | Subject | Why this concept | What the lesson does differently |
|---|---|---|---|
| `respiration` | Biology | The outline listed the word equation and the organelle; it did not separate respiration from breathing or explain why the yield differs | Breathing is treated as ventilation, respiration as the mitochondrial release of energy; aerobic and anaerobic yields are derived rather than stated; cristae are explained as surface-area amplification; oxygen debt, yeast fermentation and plant dark respiration are the transfer cases |
| `conditionals` | Computing | Selection was a definition with no trace and no boundary test | `if`/`elif`/`else` is traced line by line; Boolean conditions are evaluated before branching; boundary tests are chosen at the equality; the independent-`if` bug and `=` versus `==` are diagnosed; the assessment requires a written program, not a definition |
| `linear-equations` | Mathematics | The plan gave an inverse-operation routine but not a model for why it preserves equality | The balance model is used before the rule; inverse operations are applied in reverse order; unknowns on both sides, brackets and negative coefficients are worked with a substitution check; a phone-tariff transfer task requires forming the equation before solving it |

All three are in `lib/lessons/authored/index.ts` and in the compile list in
`scripts/compile-engines.mjs`. The Computing framework permits only
`short-answer` and `code` assessments; its `a3` was corrected from an invalid
`constructed-response` to `short-answer` rather than weakening the framework.

### Batch 14: gas exchange

| Concept | Subject | Why this concept | What the lesson does differently |
|---|---|---|---|
| `breathing-gas` | Biology | The outline named the lungs and alveoli but did not separate ventilation, gas exchange and cellular respiration, or explain why the alveolus is a surface rather than a bag | Ventilation is derived from the diaphragm/intercostal volume change and the resulting pressure difference; the alveolus is taught as a diffusion surface with area, a thin moist barrier and a capillary network; minute ventilation is calculated at rest and during exercise; emphysema is the transfer case; the three misconceptions are breathing = respiration, exhaled air has no oxygen, and the lungs pump oxygen into blood |

`breathing-gas` is in `lib/lessons/authored/index.ts`, the compile list in
`scripts/compile-engines.mjs`, and the project's browser walk. Its assessment
includes a constructed response, a labelled structure question, a direction-of-
diffusion key and a minute-ventilation calculation; the marking criteria were
audited by the catalogue before it was counted as `machine_checked`.

### Batch 15: digestion

| Concept | Subject | Why this concept | What the lesson does differently |
|---|---|---|---|
| `digestion` | Biology | The outline compressed digestion into an organ list, treated bile as if it were an enzyme, and did not explain why the small intestine is folded | Mechanical breakdown is taught as surface-area preparation, chemical digestion as hydrolysis, bile as an emulsifier and neutraliser rather than an enzyme, and the villus as a transport surface with capillaries and a lacteal. A 1 mm cube split into 1,000 cubes makes the area change numerical (6 mm² → 60 mm²); a blocked bile duct is the second worked example; coeliac disease is the transfer case |

The lesson has four misconceptions (bile digests fat; the stomach absorbs most
nutrients; villi just catch food; digestion is the same as absorption), 19 prose
paragraphs and four representation blocks. The catalogue's originality gate
caught a 12-word overlap with `enzymes` in the pH paragraph; the sentence was
rewritten rather than narrowing the check.

### Batch 16: microscopy

`microscopy` now separates magnification from resolution, teaches the equation
in all three forms, converts mm/µm/nm, and chooses a light or electron
microscope from the specimen and the structure being sought. It uses a 30 µm
cell enlarged to 60 mm (×2,000) and a 24 mm image at ×1,200 (20 µm), plus a
living-biopsy versus ribosome-defect transfer task. It has 17 prose paragraphs
and four representation blocks. It is wired into the authored index, the compile
closure and the browser walk.

### Batch 17: compounds-mixtures

`compounds-mixtures` now makes the particle model decide the classification:
elements contain one type of atom, compounds contain chemically bonded elements
in a fixed ratio, and mixtures contain substances that are not chemically bonded
and can vary in proportion. It distinguishes molecular compounds from giant
ionic lattices rather than claiming every compound is a molecule, explains why
compounds have new properties while mixture components keep theirs, and teaches
filtration, evaporation/crystallisation, distillation and chromatography as
consequences of particle size, boiling point and solubility. Purity is tested
with melting range and chromatography, including the limits of both kinds of
evidence. Two balanced equations are represented (`2H₂ + O₂ → 2H₂O` and
`CaCO₃ → CaO + CO₂`), and the transfer task asks the learner to evaluate the
false claim that a solid which decomposes on heating must be a mixture. It has
19 prose paragraphs, four representation blocks and four misconceptions. It is
wired into the authored index, the compile closure and the browser walk.

### `energy-changes` reordered to calculation-first

`lib/lesson-plans.ts#ENERGY_SECTIONS` previously opened with “Enthalpy is the
energy ledger”. It now opens with “Start here: calculate the energy change for a
reaction”, performs the H₂ + Cl₂ bond-energy calculation (679 − 864 = −185
kJ/mol) with real numbers and a four-move method, and only then defines ΔH.
`scripts/chemistry-lesson-check.mjs` gained six assertions pinning that order,
the numbers, and the calorimetry equation (the gate now reports 61 assertions).

### A learner-facing rendering defect, found by inspection

`components/authored-lesson.tsx` rendered objectives, prior knowledge,
representations, misconceptions, guided practice, assessment, transfer,
retrieval and the honest review footer — but **not** `introduction` and **not**
`workedExamples`. The page also rendered `plan.intuition` above the authored
lesson, so a learner met the plan's hook instead of the authored one.

The consequence was severe: the authored lessons' worked examples, the part of
the contract that requires a reason for every move, never reached the screen.

Fixed in `app/learn/[subject]/[concept]/page.tsx`:

- the “start here” card now uses `authoredLesson.introduction.hook` and `.why`
  when an authored lesson exists, and falls back to `plan.intuition` otherwise;
- a worked-examples card now renders each authored example's prompt, every move,
  the `why` for that move, and the answer.

### Preserved earlier work

The calculation-first `moles-calcs` rewrite, the pre-question lesson link on
`/try/[concept]`, and the chemistry comparison document remain in the working
tree and were not reverted.

### Batch 33: biodiversity

`biodiversity` (biology, stage 3) was authored on `openmind.lesson/1.0` and
registered in `lib/lessons/authored`. It teaches the three levels of diversity,
richness versus evenness, quadrat sampling and density, and matching a
conservation measure to the pressure it addresses. It has two reasoned worked
examples, three misconception repairs, two guided items, four assessment items,
a transfer task and spaced retrieval. The catalogue moved from **52/83** to
**53 authored / 82 outline**, with **53 `machine_checked`** and **0 critical**
gaps.

The targeted browser run used a fresh scratch store and measured 1280 and 320 px:
**21 passed, 0 failed**. All ten authored sections rendered; the numeric item
`a2` was server-marked **Correct** at **72 daisies per square metre** and
recorded as independent evidence; and the page did not scroll sideways at either
width. It remains `draft`: no teacher has reviewed it and no learner has tested
it.

### Batch 34: circulation

`circulation` (biology, stage 2) was authored and registered. It teaches double
circulation, the pressure reason for vessel structure, the cardiac cycle and its
valves, cardiac output as stroke volume × heart rate, and coronary artery disease
as a failure of the heart's own blood supply rather than an empty chamber. It
has two worked examples, three misconception repairs, three guided items, four
assessment items (including a server-marked cardiac-output item), a ventricular-
septal-defect transfer, three retrieval prompts and accessible alternatives. It
moved the catalogue from **53/82** to **54 authored / 81 outline**, with **54
machine-checked**, **0 critical** and **81 high** gaps.

The first authoring run failed four checks and was corrected rather than
accepted: two biology structure blocks named anatomy without a causal function,
the cardiac-cycle block named a sequence without a cause, and one sentence
shared a 12-word run with `breathing-gas`. Adding the function/cause sentences
and rewording the haemoglobin sentence moved the lesson to `machine_checked`.
The permanent browser walk now covers both biology lessons added since the queue
was regenerated; the run passed **540/0**, including **29/29** authored lessons,
four viewport widths, and `circulation-a2` answered visibly as `6` and marked
**Correct**, with the model answer `6 litres per minute`. It remains `draft`; no
teacher or learner has reviewed it.

### Batch 35: ecosystems

`ecosystems` (biology, stage 2) was authored and registered. It teaches the
levels of organisation, the difference between energy flow and matter cycling,
the ten-per-cent transfer of energy along feeding links, the carbon, water and
nitrogen cycles, and the role of decomposers and interdependence. It has two
worked examples with reasons, three misconception repairs, three guided items,
four assessment items (including a server-marked two-step energy-transfer item),
a dam transfer, four retrieval prompts and accessible alternatives. The
catalogue moved from **54/81** to **55 authored / 80 outline**, with **55
machine-checked**, **0 critical** and **80 high** gaps.

The first full-suite run failed one deterministic-key check: `ecosystems/a3`
rejected its own model answer because the accepted list held only the short
`Rhizobium` form. The key now includes the full answer; the problem was in the
key, not in the gate. `npm run verify` then passed **4630/0**, and the permanent
browser walk passed **549/0**, including **30/30** authored lessons at four
widths and `ecosystems-a2` answered visibly as `400`, marked **Correct**, with
the model answer `400 kilojoules per square metre per year`. It remains `draft`;
no teacher or learner has reviewed it.

### Batch 36: evolution

`evolution` (biology, stage 3) was authored and registered. It teaches the
difference between inherited variation and acquired change, natural selection
and allele-frequency change, the evolution of antibiotic resistance, speciation
through isolation and reproductive separation, and the multiple lines of
evidence for common ancestry. It has 20 prose paragraphs, four representation
blocks, two reasoned worked examples, four misconception repairs, three guided
items, four assessment items (including a server-marked allele-frequency item),
a pesticide-resistance transfer, four retrieval prompts and accessible
alternatives. The catalogue moved from **55/80** to **56 authored / 79 outline**,
with **56 machine-checked**, **0 critical** and **79 high** gaps.

The first lesson gate found one real defect: the speciation process block named
the sequence without the causal link the biology framework requires. Adding why
the barrier prevents gene flow and drives divergence fixed it rather than
weakening the check. `npm run verify` passed **4630/0**, and the permanent
browser walk passed **558/0**, including **31/31** authored lessons at four
widths and `evolution-a2` answered visibly as `0.1`, marked **Correct**, with
the key `0.1`. It remains `draft`; no teacher or learner has reviewed it.

## 2. Verification actually run

| Check | Result |
|---|---|
| `node scripts/lesson-catalogue.mjs` | exit 0 · 135 concepts · **56 authored** · 79 outline · 56 `machine_checked` · 0 unresolved lesson problems |
| `node scripts/lesson-quality-audit.mjs` | exit 0 · **0 critical**, 79 high, 56 review |
| `node scripts/lesson-quality-dashboard.mjs` | exit 0 · **56 authored** · **3 drawn figures** · **410/410** why-steps · **1 explicitly unscored reflection** · 0 educator-reviewed · 0 learner-tested |
| `npm run verify` | **4630 passed, 0 failed** (three deliberately planted failing controls are excluded from the total) |
| `npm run verify:lessons` | exit 0 · all lesson checks, including **61 chemistry**, **89 biology**, **46 algebra**, **67 angles**, **76 area/perimeter**, **107 averages**, **109 coordinates**, **108 data-charts**, **110 indices-intro**, **201 probability**, **23 ratio/proportion/sequences** and **8 bar-model** assertions |
| `npm run verify:maths-batch-live` | **20 passed, 0 failed** against a scratch store; ratio, proportion and sequences each retained their own lessonCheck counters, and the evidence API and on-disk ledger each held the four submitted events |
| `npm run verify:bar-model` | **8 passed, 0 failed**; the reusable 3:2 bar is 3/5 and 2/5 by width, with five units and four internal cuts |
| `npm run validation:pack` | Writes `audit/validation/TEACHER_REVIEW_PACK.md` (five version- and hash-pinned lessons plus blank review forms), `audit/validation/LEARNER_PILOT_PROTOCOL.md` (not conducted) and `reports/lesson-quality/EDUCATIONAL_VALIDATION.md` (56 authored, 56 machine-checked, **0 educator-reviewed, 0 learner-tested**) |
| `npm run validation:check` | **28 passed, 0 failed** against a temporary `OPENMIND_DATA_DIR`: current approval accepted, stale version/hash rejected, blank form distinguished from stale, blocking finding refused, AI review and AI submission refused, findings persisted as tasks, a completed task did not approve a later version, and a later version required its own review. The fixture is labelled and deleted; it is not human evidence |
| `npm run validation:http` | **22 passed, 0 failed** against a scratch-store dev server: teacher and learner signup, 401 without a session, 403 for a learner, blank form 422, stale version and stale hash 409, AI-sourced approval 422, an approval with a blocking finding 422, current review accepted, reviewer identity server-derived, task created and completed, both records surviving a round trip, and task completion not converting the review into an approval. The accounts are scratch fixtures, not teachers or learners |
| `npm run validation:browser` | **38 passed, 0 failed** for the submit phase and **18 passed, 0 failed** after the restart, against the scratch-store dev server: real teacher sign-in through `/onboarding?role=teacher&mode=signin`, the teacher console's new `/lesson-review` link, the real `/lesson-review/ratio` form, the actual `POST /api/lesson-review` (200), no reviewer/account/source field in the request body, the scratch `lesson-validation.json` holding the version- and hash-pinned record and open task with the authenticated account id, and the page/API/ledger still holding that same record after the server was stopped and restarted. The record is explicitly labelled a fixture, not a teacher's judgement or human evidence |
| `npm run typecheck` | exit 0 |
| `npm run build` | **exit 0, 70 pages generated**, including `/lesson-review` and `/lesson-review/[conceptId]` |
| `npm run verify:a11y` | **96 passed, 0 failed** against the running app, covering the public routes, `/access`, 200% browser zoom/reflow at 640 CSS px, computed contrast on visible text, focus visibility, rendered maths, a diagram's accessible name/controls, a calculation form's label and polite live error, keyboard submission of that activity (typed `4`, Tab to a visibly focused Check, Enter, observed `✓ correct`), and phone navigation operated by tap at 390 × 844. This is a structural smoke test, not a screen-reader session or conformance claim; see the limitations and `ASSISTIVE_TECHNOLOGY.md` |
| `df -h .` | **4.0 GB free before the production build, 3.9 GB after it** (100% used). This is below the suite's 5.0 GB refusal bar, so the full suite was not re-run after the build; the build itself completed. The shared volume is not this project's alone |
| Browser, 1280 × 900, 768 × 1024, 375 × 667 and 320 × 640 | `npm run verify:lesson` — **558 passed, 0 failed**. All 21 planned lessons were measured at 1280 and 320, plus all 31 authored lessons whose contract the walk opens at all four widths. The batch-36 run added `evolution`; it rendered 20 prose paragraphs and 4 representation blocks, with a 278-word transfer and a 64-word retrieval section, fit 320, 375, 768 and 1280 px, and its visible `a2` accepted `0.1` and painted **Correct** from the server. The batch-35 run added `ecosystems`; it rendered 18 prose paragraphs and 4 representation blocks, with a 370-word transfer and a 62-word retrieval section, fit 320, 375, 768 and 1280 px, and its visible `a2` accepted `400` and painted **Correct** plus `400 kilojoules per square metre per year` from the server. The batch-34 run added `biodiversity` and `circulation`; `circulation` rendered 18 prose paragraphs and 4 representation blocks, fit 320, 375, 768 and 1280 px, and its visible `a2` control accepted `6` and painted **Correct** plus `6 litres per minute` from the server. `probability-basics` renders 27 prose paragraphs, 5 representation blocks and **2 drawn figures** (a Venn and a tree), with a 406-word transfer and a 57-word retrieval section; its coin simulation added 200 tosses (105 heads + 95 tails) and reset; the interactive Venn checkbox was keyboard-toggled, the union and 20% value were marked, the dependent tree returned four correct fields, malformed input was refused, and the die and bag runs each accounted for 200 trials; its visible form accepted 3/8, 0.2, a wrong 0.5 that showed the correct 0.8, and a5 as 20% with 1/5 while refusing 1/4 and unparseable text; its captions reached the accessibility tree (not a screen-reader session); and it fits 320, 375, 768 and 1280 px. `indices-intro` renders 17 prose paragraphs and 3 representation blocks, with a 366-word transfer and a 48-word retrieval section, and fits 320, 375, 768 and 1280 px. `data-charts` renders 17 prose paragraphs and 3 representation blocks, with a 360-word transfer and a 66-word retrieval section, and fits 320, 375, 768 and 1280 px. `coordinates` renders 17 prose paragraphs and 3 representation blocks, with a 387-word transfer and a 69-word retrieval section, and fits 320, 375, 768 and 1280 px. `averages` renders 17 prose paragraphs and 3 representation blocks, with a 390-word transfer and a 75-word retrieval section, and fits 320, 375, 768 and 1280 px. `area-perimeter` renders 17 prose paragraphs and 3 representation blocks, with a 273-word transfer and 79-word retrieval section, and fits 320, 375, 768 and 1280 px. `lists-arrays`, `functions-code` and `dictionaries` each render 3 objectives, 3 misconceptions, 3 guided items and 4 representation blocks; their prose/transfer/retrieval counts are 18/218/53, 18/189/51 and 19/190/56. `algebra-expressions` renders 17 prose paragraphs and 3 representation blocks, with a 212-word transfer and 41-word retrieval section. `angles-lines` renders 17 prose paragraphs and 3 representation blocks, with a 234-word transfer and 71-word retrieval section |

Batch 13 added three more lessons. The catalogue, typecheck and full `verify`
were re-run after wiring them: **30 authored · 105 outline · 30
`machine_checked` at that checkpoint · 4630 passed, 0 failed**. The first browser attempt found a
real-looking stall: `/learn/biology/respiration` stayed on “Checking your
session — this takes a moment.” after 45 seconds, while `/api/auth/me` and
`/api/profile` answered 200. The cause was a stale generated `.next-dev` cache,
not a product-code loop: the onboarding route was stuck on its own `Loading…`
fallback as well, and deleting only `.next-dev` and restarting the dev server
restored hydration immediately. The project's own browser walk then passed
**338/0** over the 21 planned lessons and 8 unplanned authored lessons;
`respiration` and `conditionals` rendered at 1280 and 320 px, and
`linear-equations` passed its figure and width checks.

Batch 14 added `breathing-gas`. After wiring it, the catalogue reported **31
authored · 104 outline · 31 `machine_checked`**, `npm run verify` reported
**4630 passed, 0 failed**, and the audit reported **21 critical · 83 high · 31
review**. The browser walk passed **343/0**, with all 9 authored lessons without
a plan rendering at both widths; `breathing-gas` reported 3 objectives, 3
misconceptions, 3 guided items, 17 prose paragraphs, 4 representation blocks, a
224-word transfer and a 64-word retrieval section, and measured **320 vs 320**
at the phone width.

Batch 15 added `digestion`. After wiring it, the catalogue reported **32
authored · 103 outline · 32 `machine_checked`**, `npm run verify` reported
**4630 passed, 0 failed**, and the audit reported **20 critical · 83 high · 32
review**. The browser walk passed **348/0**, with all 10 authored lessons without
a plan rendering at both widths; `digestion` reported 3 objectives, 4
misconceptions, 3 guided items, 19 prose paragraphs, 4 representation blocks, a
254-word transfer and a 65-word retrieval section, and measured **320 vs 320**
at the phone width.

Batch 16 added `microscopy`. The catalogue reported **33 authored · 102 outline ·
33 `machine_checked`**, `npm run verify` stayed at **4630 passed, 0 failed**, and
the audit reported **19 critical · 83 high · 33 review**. The browser walk passed
**353/0**; `microscopy` rendered 3 objectives, 3 misconceptions, 3 guided items,
17 prose paragraphs, 4 representation blocks, a 287-word transfer and a 52-word
retrieval section, and measured **320 vs 320** at phone width.

Batch 17 added `compounds-mixtures`. The catalogue reported **34 authored ·
101 outline · 34 `machine_checked`**, `npm run verify` stayed at **4630 passed,
0 failed**, and the audit reported **18 critical · 83 high · 34 review**. The
browser walk passed **358/0**; `compounds-mixtures` rendered 3 objectives, 4
misconceptions, 3 guided items, 19 prose paragraphs, 4 representation blocks, a
220-word transfer and a 67-word retrieval section, and measured **320 vs 320**
at phone width.

Batch 18 did not add a lesson: it verified the two named in the review brief.
The audit found two scientific defects in `digestion`, both now fixed. Amylase
had been credited with producing glucose as well as maltose; maltase is the
enzyme that performs the second step. The peristalsis paragraph had the
longitudinal muscle relaxing ahead of the bolus; the checked account is that the
circular muscle ahead relaxes while the longitudinal muscle contracts and
shortens the segment. The coeliac transfer now names the immune reaction to
gluten and the duodenal/jejunal site of iron absorption. `microscopy` required no
scientific correction: its resolution claims and four calculations survived
independent checking. A new `scripts/biology-lesson-check.mjs` gates the 89
checked claims and calculations, and `scripts/lesson-walk.mjs` now measures the
375-px phone and 768-px tablet as well. The production build and the full
browser walk both pass; this is still not teacher review or learner evidence.

See `reports/lesson-quality/DIGESTION_MICROSCOPY_VERIFICATION.md` for the
13-criterion checklist, source links, corrections and limitations.

Batch 19 added `binary-data`, the first critical concept after the digestion and
microscopy checkpoint. The initial contract run correctly rejected `what-is-code`
as a prerequisite because the genome declares only `number-bases`; the diagnostic
was retargeted rather than the check being weakened. The finished lesson has 3
objectives, 2 diagnostic checks, 2 reasoned worked examples, 3 misconceptions, 3
guided items, a code assessment plus 3 short answers, a transfer task and 3
retrieval prompts. The catalogue moved to **35 authored · 100 outline · 35
`machine_checked`**, and the audit to **17 critical · 83 high · 35 review**. The
full browser walk passed **389/0**, including `binary-data` at 320, 375, 768 and
1280 px. At that checkpoint the clean accessibility rerun passed 61/0 but left one gated
surface unmeasured; the earlier post-walk run's single `/access` failure did not
reproduce, so it is recorded as flaky rather than claimed as a pass.

See `reports/lesson-quality/BINARY_DATA_VERIFICATION.md` for the sources,
arithmetic checks and limitations.

Batch 20 added `lists-arrays`, `functions-code` and `dictionaries`, each with a
runnable Python assessment. The lessons teach zero-based indexing and list
methods, argument binding/return values/local scope, and key-value lookup with
`get` and frequency counting respectively. All three are wired into the authored
index, the compile closure and the browser walk. The catalogue moved to **38
authored · 97 outline · 38 `machine_checked`**, and the audit to **14 critical ·
83 high · 38 review**. `npm run verify` stayed at **4630 passed, 0 failed**, the
production build passed, and the browser walk passed **410/0**, including all
sixteen unplanned authored lessons at 1280, 768, 375 and 320 px.

The new `scripts/code-lab-check.mjs` drove the real sandboxed Pyodide runtime in
Chrome and passed **19/0**: keyboard focus and typing, Reset, the starter's
`3`/`None` output, the repaired `count_above` program passing with `3`, the
practice-only disclosure, the iframe sandbox (no `allow-same-origin`), and all
four widths. During that run the probe found two learner-facing defects, both
fixed: Pyodide's batched stdout was concatenated without newlines (`3None`), and
the practice-feedback disclosure was hidden inside a collapsed model-answer
panel. A third internal defect, a deterministic `a4` model answer that its own
key rejected, was corrected before the full suite passed.

The separate `npm run verify:journey` check then drove a fresh guest through the
application, not just the generated pages. It passed **72/0**. The learner
enrolled in GCSE Computing Foundation (Year 10), completed all three lessons,
watched the starter programs fail and the repairs pass in the real Pyodide
runner, submitted a wrong and a right answer to every server-marked item, and
finished with Home. The scratch profile
`prof_d761cdc33a274d2a8b3aca11c31b2834` recorded 10 evidence events, all
`mode: independent`, `hints: 0`, `source: practice`: two attempts on each of
lists' and functions' `a2`/`a4`, and two on dictionaries' `a2`. Constructed
responses were not scored or turned into evidence. Home's next activity was the
baseline diagnostic gate, correctly followed to `/diagnostic/computing`; the
engine's recommendation (`EXPLAIN variables`, then `PRACTISE lists-arrays`) was
checked separately, because a learner who has not sat the baseline diagnostic
must see that gate first.

Independent execution checked **30 Python cases** against the real interpreter,
including the boundary/IndexError examples, missing returns, scope failures,
dictionary KeyError and frequency counts. The lesson gate, the browser walk and
the code-lab walk are independent executable checks. They are not independent
review by another author or teacher, and no learner used these lessons.

See `reports/lesson-quality/COMPUTING_BATCH_VERIFICATION.md` for the source list,
assessment analysis, the code-lab findings and the remaining limits.

Batch 21 added `algebra-expressions`, the critical concept at the front of the
queue when the batch began and a declared prerequisite of `algebra-expand`,
`linear-equations`, `functions` and `proof`. The lesson makes the coefficient a
count of an unknown, collects by letter family, expands with an area model, and
uses substitution as the check. It has 3 objectives, 2 `order-ops` diagnostics,
8 explanation paragraphs in 4 sections, 3 representations, 2 worked examples,
3 misconceptions, 3 guided items, 3 assessments (one constructed response and
two server-marked short answers), a rectangle-perimeter transfer and 3 spaced
retrieval prompts. The catalogue moved to **39 authored · 96 outline · 39
`machine_checked`**, and the audit to **13 critical · 83 high · 39 review**.
`npm run verify` stayed at **4630 passed, 0 failed**; `npm run verify:lessons`
included the new **46-assertion** algebra gate; the production build passed with
69 pages; and the browser walk passed **417/0**, including all 17 authored
lessons without a plan at 1280, 768, 375 and 320 px. A separate real HTTP check
created a scratch learner, marked a wrong and a right answer for each
server-marked item, refused a constructed response a fabricated mark, and found
four independent evidence events and a stored 4-attempt/2-correct record.

See `reports/lesson-quality/ALGEBRA_EXPRESSIONS_VERIFICATION.md` for the
sources, arithmetic and limits.

Batch 22 added `angles-lines`, the next critical concept after algebra and a
declared prerequisite of `circle-theorems` and `loci-constructions`. The lesson
treats every angle fact as a consequence of a half-turn or a full turn, makes
the parallel-line reason explicit, and treats the F/Z shape as a memory cue
rather than a proof. It has 3 objectives, 2 diagnostics for the two foundations
it uses (`subtraction` and `division`), 8 explanation paragraphs in 4 sections,
3 equation representations, 3 worked examples, 3 misconceptions (a Z proves
equality; co-interior angles are equal; the polygon formula gives one angle),
3 guided items, 3 assessments (one constructed response and two server-marked
short answers), a hexagon-and-pentagon tiling transfer, and 3 spaced retrieval
prompts. The catalogue moved to **40 authored · 95 outline · 40
`machine_checked`**, and the audit to **12 critical · 83 high · 40 review**.
`npm run verify` stayed at **4630 passed, 0 failed**; `npm run verify:lessons`
included the new **67-assertion** angles gate; the production build passed with
69 pages; and the browser walk passed **424/0**, including all 18 authored
lessons without a plan at 1280, 768, 375 and 320 px. A separate real HTTP check
created a scratch learner, marked a wrong and a right answer for each
server-marked item, refused a constructed response a fabricated mark, refused a
wrong capability secret and an unknown item, and found four independent
evidence events and a stored 4-attempt/2-correct record.

The successful browser runs used the walk's own onboarding enrolment against a
dev server whose `OPENMIND_DATA_DIR` was `/tmp/openmind-walk-b13`,
`/tmp/openmind-walk-digestion`, `/tmp/openmind-walk-microscopy`,
`/tmp/openmind-walk-compounds`, `/tmp/openmind-walk-bio`,
`/tmp/openmind-walk-binary`, `/tmp/openmind-walk-algebra2` and
`/tmp/openmind-walk-angles` for the later batches; the algebra assessment check
used `/tmp/openmind-algebra-check`, and the angles assessment check used
`/tmp/openmind-angles-live`. None opened the live `.openmind-data`; each scratch
store was removed after its run.

Batch 23 added `area-perimeter`, the first critical concept in the queue and a
declared prerequisite of `volume`, `circle-area-arc` and `pythagoras`. The
lesson separates the boundary length from the surface, derives the triangle,
parallelogram and trapezium formulas from a rectangle, and treats the square
unit as the square of the length factor. It has 3 objectives, 2 diagnostics for
`multiplication` and `decimals`, 8 explanation paragraphs in 4 sections, 3
representation blocks, 3 worked examples, 3 misconceptions (adding sides finds
area; `1 m² = 100 cm²`; the triangle formula has no half), 3 guided items, 3
assessments (one constructed response and two server-marked short answers), a
path-around-a-lawn transfer, and 3 spaced retrieval prompts. The catalogue moved
to **41 authored · 94 outline · 41 `machine_checked`**, and the audit to **11
critical · 83 high · 41 review**. `npm run verify` stayed at **4630 passed, 0
failed**; `npm run verify:lessons` included the new **76-assertion** area gate;
the production build passed with 69 pages; and the browser walk passed
**431/0**, including all 19 authored lessons without a plan at 1280, 768, 375 and
320 px. `area-perimeter` renders 3 objectives, 3 misconceptions, 3 guided items,
17 prose paragraphs and 3 representation blocks, with a 273-word transfer and a
79-word retrieval section. A separate real HTTP check created a scratch learner,
marked a right and a wrong short answer, refused the constructed response a
fabricated mark, refused a wrong capability secret, and found exactly two
independent evidence events and a stored 2-attempt/1-correct record.

Batch 24 added `averages`, the next critical concept after area and perimeter.
The genome gives it no prerequisite and makes it a prerequisite of
`data-charts` and `statistics-data`, so the lesson names and probes the two
foundations the mean actually uses, `addition` and `division`. It keeps four
questions separate — the total shared out, the middle after ordering, the most
frequent value, and the spread — and makes the choice of summary part of the
answer: the opening pay packets have mean £400 and median £250, and the transfer
two classes of 12 and 18 whose unweighted average (69.5) is wrong and whose
combined mean is **71**. It has 3 objectives, 2 diagnostics, 8 explanation
paragraphs in 4 sections, 3 `maths.expression` representations, 3 worked
examples, 3 misconceptions (the mean is the middle; the median can be read
unsorted; the mean is always the fairest summary), 3 guided items, 3
assessments (one constructed response and two server-marked short answers), a
390-word transfer and 3 spaced retrieval prompts. The catalogue moved to **42
authored · 93 outline · 42 `machine_checked`**, and the audit to **10 critical ·
83 high · 42 review**. `npm run verify` stayed at **4630 passed, 0 failed**;
`npm run verify:lessons` included the new **107-assertion** averages gate; the
production build passed with 69 pages; and the browser walk passed **438/0**,
including all 20 authored lessons without a plan at 1280, 768, 375 and 320 px.
`averages` renders 3 objectives, 3 misconceptions, 3 guided items, 17 prose
paragraphs and 3 representation blocks, with a 390-word transfer and a 75-word
retrieval section. A separate real HTTP check created a scratch learner, marked
2.1 right and 56 wrong (true value 17), refused the constructed response a
fabricated mark, refused a wrong capability secret, and found exactly two
independent evidence events and a stored 2-attempt/1-correct record that the
refusals did not inflate.

Batch 25 added `coordinates`, the first critical concept left in the queue and
the prerequisite of `straight-lines`, `transformations`, `vectors` and
`functions`. The plan already drew `y = 2x + 1`, so the authored lesson adds the
reasoning a drawing cannot carry: the pair is an address (along, then up), a
zero coordinate names an axis, an equation is a membership rule tested by
substitution, and the coordinate an equation fixes decides whether its line is
horizontal. It has 3 objectives, 2 `negatives` diagnostics, 8 explanation
paragraphs in 4 sections, 3 representations, 3 worked examples, 3
misconceptions (swap the pair; (0, 3) on the x-axis; `y = 3` is vertical), 3
guided items, 3 assessments (one constructed response and two marked pairs), a
two-path park transfer and 3 spaced retrieval prompts. The catalogue moved to
**43 authored · 92 outline · 43 `machine_checked`**, and the audit to **9
critical · 83 high · 43 review**. `npm run verify` stayed at **4630 passed, 0
failed**; `npm run verify:lessons` included the new **109-assertion** coordinate
gate; the production build passed with 69 pages; and the browser walk passed
**445/0**, including all 21 authored lessons without a plan at 1280, 768, 375
and 320 px. `coordinates` renders 3 objectives, 3 misconceptions, 3 guided
items, 17 prose paragraphs and 3 representation blocks, with a 387-word
transfer and a 69-word retrieval section. A separate real HTTP check created a
scratch learner, marked `(3, -4)` right and the reversed pair `(0, -2)` wrong
(true crossing `(-2, 0)`), refused the constructed response a fabricated mark,
refused a wrong capability secret, and found exactly two independent evidence
events and a stored 2-attempt/1-correct record that the refusals did not
inflate. The gate's first run failed one assertion that tested a three-point
sample rather than the equations; the assertion was corrected, not the lesson.

Batch 26 added `data-charts`, the next critical concept after coordinates and
the prerequisite of `scatter-correlation`. The genome's own description names
scales, truncation and grouping as the honesty problem, so the lesson makes a
chart an argument: the question chooses the type, the baseline is part of the
claim, and a pie encodes shares rather than counts. It opens with a true chart
whose bars are 32 and 36 on a 30-based axis — a 12.5% rise drawn as a tripling —
and returns to it in the worked example. It has 3 objectives, 2 `averages`
diagnostics, 8 explanation paragraphs in 4 sections, 3 representations, 3 worked
examples, 3 misconceptions (a pie shows counts; join any data with a line; a
truncated axis is fine because the labels are true), 3 guided items, 3
assessments (one constructed response and two marked numbers), a two-school
count-versus-share transfer and 3 spaced retrieval prompts. The catalogue moved
to **44 authored · 91 outline · 44 `machine_checked`**, and the audit to **8
critical · 83 high · 44 review**. `npm run verify` stayed at **4630 passed, 0
failed**; `npm run verify:lessons` included the new **108-assertion** data-charts
gate; the production build passed with 69 pages; and the browser walk passed
**452/0**, including all 22 authored lessons without a plan at 1280, 768, 375
and 320 px. `data-charts` renders 3 objectives, 3 misconceptions, 3 guided
items, 17 prose paragraphs and 3 representation blocks, with a 360-word
transfer and a 66-word retrieval section. The lesson framework rejected the
first version of worked example 3 because its last move named none of the
answer's quantities; the move was rewritten to name the 4, the 12.5%, the 2 and
6 and the three-times ratio. A separate real HTTP check created a scratch
learner, marked 20 right and 16 wrong (true difference 8), refused the
constructed response a fabricated mark, refused a wrong capability secret, and
found exactly two independent evidence events and a stored 2-attempt/1-correct
record that the refusals did not inflate.

Batch 27 added `indices-intro`, the last stage-1 critical concept in the queue
and the prerequisite of standard form, Pythagoras, surds, binomial expansion,
growth and decay, logarithms and differentiation. The lesson treats an index as
a count of copies rather than a multiplier: 3⁴ is 81, not 12, and 2¹⁰ is 1024,
not 20. Every law is derived by writing the copies out, the same-base condition
is stated each time, and zero, negative and fractional indices are shown as the
same pattern continuing rather than three exceptions. It has 3 objectives, 2
`order-ops` diagnostics, 8 explanation paragraphs in 4 sections, 3
representations, 3 worked examples each checked by substitution or by reversing
the index, 3 misconceptions (multiplying the indices, reading a negative index
as a negative value, and letting a power bind to the coefficient), 3 guided
items, 3 assessments (a derivation of a⁰ and a⁻², 4x² × 3x⁵ = 12x⁷, and
27²⁄³ = 9), a rumour-spreading transfer that separates the hourly count from
the running total, and 3 spaced retrieval prompts. The catalogue moved to **45
authored · 90 outline · 45 `machine_checked`**, and the audit to **7 critical ·
83 high · 45 review**. `npm run verify` stayed at **4630 passed, 0 failed**;
`npm run verify:lessons` included the new **110-assertion** indices gate; the
production build passed with 69 pages; and the browser walk passed **459/0**,
with `indices-intro` rendering 3 objectives, 3 misconceptions, 3 guided items,
17 prose paragraphs and 3 representation blocks at 320, 375, 768 and 1280 px.
Two defects were found by the checks rather than by a reader: the lesson
framework reported **28** instances of raw caret notation in learner-visible
prose and moves, all rewritten as Unicode superscripts, and `tsc` refused an
accessibility need the contract does not declare (`hearing`), which was renamed
to `no-audio` rather than loosening the union. A separate real HTTP check
created a scratch learner, marked 12x^7 right and 6 wrong (true value 9),
refused the constructed response a fabricated mark, refused a wrong capability
secret, and found exactly two independent evidence events and a stored
2-attempt/1-correct record that the refusals did not inflate.

Batch 28 added `probability-basics`, the first critical concept after indices and
the prerequisite of tree diagrams, sets and the statistics that follow. The
lesson treats probability as a measure on a sample space rather than a formula
to match, and keeps three questions in front: what are the outcomes and are they
equally likely, do the events overlap, and are the trials independent. It has 3
objectives, 2 diagnostics probing fractions and percentages without inventing a
graph edge (the genome declares no prerequisite), 10 explanation paragraphs in
5 sections, 5 representations, 5 worked examples, 7 misconceptions (including
mutually exclusive against independent, at least one against exactly one, the
power formula without replacement, and the sum-to-one check), 4 guided items, 5
assessments (a constructed response on dependent draws, 3/8, 0.2, 0.8 and 1/5),
a diagnostic-test transfer where the base rate turns 90% sensitivity into 1/12,
and 3 spaced retrieval prompts. The catalogue moved to **49 authored · 86
outline · 46 `machine_checked`**, and the audit to **6 critical · 83 high · 46
review**. `npm run verify` stayed at **4630 passed, 0 failed**; `npm run
verify:lessons` included the new **161-assertion** probability gate; the
production build passed with 69 pages; and the browser walk passed **480/0**.
The lesson now draws a Venn and a tree from `lib/lesson-figure.ts` and runs a
deterministic fair-coin simulation: the walk measured 2 circles, 4 tree paths,
the region counts, both captions in the accessibility tree, 200 tosses (105
heads + 95 tails in this run) and a reset to 0. It typed into the visible
assessment form for `a2` (3/8), `a3` (0.2) and `a4` (0.5, shown the correct 0.8)
and waited for each rendered verdict; `a5` and `a1` were exercised through HTTP. A separate HTTP
check marked 0.2 right, 0.5 wrong (true 0.8) and 1/5 right, refused the
constructed response a fabricated mark, refused a wrong capability secret, and
found exactly three independent evidence events and a stored 3-attempt/2-correct
record. The gate's three failures were its own exact floating-point comparisons
(9,900 × 0.1 = 990.0000000000001), fixed with tolerance; the one caret in the
first draft was rewritten as a superscript before the framework ran.

The batch-23 browser walk used `/tmp/openmind-area-walk`; the assessment check
used `/tmp/openmind-area-live`; the accessibility rerun used
`/tmp/openmind-area-a11y2`; the batch-24 walk and assessment check used
`/tmp/openmind-averages-walk` and `/tmp/openmind-averages-live`; the batch-25
walk and assessment check used `/tmp/openmind-coordinates-walk`; the batch-26
walk and assessment check used `/tmp/openmind-charts-walk`; the batch-27walk and assessment check used `/tmp/openmind-indices-walk`; the final batch-28
walk and assessment check used a scratch server store at `/tmp/openmind-debug`.
None opened the live `.openmind-data`, and each scratch store was removed after
its run.

## 3. Honest limitations

- **Coverage.** 79 concepts still have only a plan/outline, not an authored
  lesson. The queue lists them by priority; none is `critical`.
- **No human evidence.** Every authored lesson is `draft`/`machine_checked`.
  Zero are `educator_reviewed`; zero are `learner_tested`. No teacher or learner
  was available, so no claim about learning outcomes is made. The live journey
  is one fresh guest on one machine, not a trial: it proves the application can
  carry a learner through the lessons and store the evidence, not that the
  learner learned. Its post-lesson Home state was the baseline diagnostic gate,
  so the recommendation card itself was not rendered in that run.
- **Viewport coverage.** The project's walk measured all 21 planned lessons at
1280 × 900 and 320 × 640, and all 31 authored lessons whose contract it opens at 1280 × 900,
768 × 1024, 375 × 667 and 320 × 640; no lesson scrolled sideways at any measured
width. `angles-lines` and `area-perimeter` have no authored figure: their
representations are written equations and descriptions, not drawn diagrams.
`data-charts` has no drawn chart either, which is the most conspicuous missing
representation in the set: a lesson about charts currently teaches them in prose
and angle arithmetic. `indices-intro` also has no drawing, because its plan
declares none; its representations are written expansions and a descending
table of powers. `probability-basics` now draws a Venn and a tree: its two SVGs
are `aria-hidden`, and their authored captions are the accessible description.
The browser walk reads those captions from the accessibility tree; it is not a
screen-reader session, and the Unicode superscripts in the notation remain
untested with VoiceOver or NVDA. The
a11y audit passed 96/0, but it is structural only. The first run at this checkpoint reported a stale access-size
click because it reused coordinates collected while scrolling; the audit now
click-tests the Standard button before dispatching. That is a harness
correction, not a product change. It measures keyboard submission of the public
calculation activity, phone navigation by tap, 200% browser zoom/reflow and
computed contrast; screen-reader announcements, keyboard-only completion of a
whole learner lesson, error announcements in the signed-in teacher form, and
switch or eye-gaze input remain unmeasured.
The reachability of Pyodide's CDN is a real availability dependency; the code lab
is disclosed as unavailable rather than claimed to run offline.
- **Dev-cache failure mode.** A stale `.next-dev` after repeated hard restarts
served the onboarding `Loading…` fallback and left `/learn` on its boot screen.
Deleting only the generated `.next-dev` cache fixed it; no product code was
changed for the cache itself. If the symptom recurs, clear that cache before
mistaking it for a session or lesson defect.
- **Production server.** `npm run build` succeeded in batch 23, but the running
  server on port 3000 was not restarted, so it still serves the previous build.
  The new lesson was verified on the dev server at 4173; nothing was deployed.
- **Research access.** Oak lesson slides/worksheets/videos, authenticated
  Dr Frost/Sparx/MathsWatch screens and school-gated services (GCSEPod,
  Educake) could not be inspected; the benchmark records this rather than
  inferring their behaviour.
- **Automated audit ≠ trial.** The audit establishes that a lesson has the parts
  an independent learner needs. It cannot establish that a pupil learned from it.

## 4. Next queue

1. Subject-teacher review of `digestion` and `microscopy` against the new
   verification report, starting with the age-appropriateness of the coeliac
   transfer and the electron-microscope resolution figures.
2. Subject-teacher review of `binary-data`, especially whether its Python style,
   eight-bit range and hexadecimal notation suit the chosen GCSE route.
3. Subject-teacher review of the batch-13 to batch-18 lessons, starting with
   `compounds-mixtures` (fixed-ratio bonding, ionic lattices and the
   decomposition-versus-mixture distinction are the most damaging errors if
   wrong), then `respiration`, `breathing-gas`, `linear-equations` and
   `conditionals`.
4. Authored lessons for the next critical concepts in prerequisite order,
   starting with `proportion`, `ratio` and `sequences`.
5. Subject-teacher review of `area-perimeter`, especially the choice to teach
trapezia at this stage and the path-around-a-lawn transfer; then the same review
of `averages`, especially teaching combined means through totals rather than the
weighted-mean formula and the pay-packet framing.
6. A drawn rectangle/L-shape/trapezium representation for `area-perimeter`, an
   angle diagram for `angles-lines`, and a dot-plot or bar representation for
   `averages`; all three lessons are correct without one, but the pictures would
   make the quantities easier to inspect.
7. Screen-reader, whole-lesson keyboard-only, switch-input and signed-in-form
announcement testing of the authored lessons, starting with the probability
notation (`ⁿ`, `∪`, `∩`) where the accessibility-tree check is not a substitute
for VoiceOver or NVDA.
8. Restart the local production server so the served app matches the verified
   build, and recheck disk headroom before the next full build (the batch-23
   build started at 6.5 GB; the 8.0 GB watch bar is already crossed).

## 5. Validation integration check (9–10 November 2026)

The authenticated review path was re-run end to end in a fresh scratch store,
`/tmp/openmind-validation-browser-run-c`, against the dev server. A teacher-role
fixture signed in through the real form, reached `/lesson-review` from the
teacher console, and submitted a `ratio` v1.0.0 review through the real
`POST /api/lesson-review` (200). The browser sent no reviewer, account id or
source field; the stored reviewer is the authenticated account. The review and
its open task survived a stop and restart of the server against the same
directory.

| Check | Result |
|---|---|
| `npm run validation:browser` (submit) | **38 passed, 0 failed** |
| `npm run validation:browser -- --phase=after-restart` | **18 passed, 0 failed**; same review `lr_186fe635bc444f77921a21dd0cee7210`, finding and task |
| `npm run validation:check` | **28 passed, 0 failed** |
| `npm run validation:http` | **22 passed, 0 failed** |
| `npm run verify:a11y` | **96 passed, 0 failed** (structural/browser-measured, not manual AT) |
| `npm run build` | exit 0, **70 pages**, including both lesson-review routes |

The teacher and learner are explicitly labelled fixtures; the review is not a
teacher's judgement and no learner result is claimed, so the catalogue remains
at 0 educator-reviewed and 0 learner-tested. Manual VoiceOver/NVDA testing was
not performed. Full evidence, the negative-case results and the limitations are
in `reports/lesson-quality/VALIDATION_INTEGRATION_REPORT.md`.
