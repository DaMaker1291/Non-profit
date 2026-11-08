# Lesson transformation — implementation and verification record

This file records what was actually changed in the repository, what was measured,
and what remains unproven. It is deliberately not a claim that OpenMind now
teaches every subject well: 33 of 135 concepts have an authored lesson meeting
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

### Authored lessons: 16 → 33

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

## 2. Verification actually run

| Check | Result |
|---|---|
| `node scripts/lesson-catalogue.mjs` | exit 0 · 135 concepts · **35 authored** · 100 outline · 35 `machine_checked` · 0 unresolved lesson problems |
| `node scripts/lesson-quality-audit.mjs` | exit 0 · **17 critical**, 83 high, 35 review |
| `npm run verify` | **4630 passed, 0 failed** (three deliberately planted failing controls are excluded from the total) |
| `npm run verify:lessons` | exit 0 · all lesson checks, including **61 chemistry** and **89 biology assertions** |
| `npm run typecheck` | exit 0 |
| `npm run build` | **exit 0 in batch 19** |
| `npm run verify:a11y` | **61 passed, 0 failed** on a clean scratch run, with one gated surface not audited. A preceding post-walk run had one `/access` control failure that did not reproduce; this is a smoke test, not stable accessibility evidence |
| `npm run disk-headroom` | 11.2 GB free (bar: refuse below 5.0 GB) |
| Browser, 1280 × 900, 768 × 1024, 375 × 667 and 320 × 640 | `npm run verify:lesson` — **389 passed, 0 failed**. All 21 planned lessons were measured at 1280 and 320, plus all 13 authored lessons without a plan at all four widths. `binary-data` renders 3 objectives, 3 misconceptions, 3 guided items, 18 prose paragraphs and 4 representation blocks, with a 230-word transfer and 64-word retrieval section. It measures **320/375/768/1280 with no sideways scroll** |

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
1280 px. The clean accessibility rerun passed 61/0 but left one gated surface
unmeasured; the earlier post-walk run's single `/access` failure did not
reproduce, so it is recorded as flaky rather than claimed as a pass.

See `reports/lesson-quality/BINARY_DATA_VERIFICATION.md` for the sources,
arithmetic checks and limitations.

The successful browser runs used the walk's own onboarding enrolment against a
dev server whose `OPENMIND_DATA_DIR` was `/tmp/openmind-walk-b13`,
`/tmp/openmind-walk-digestion`, `/tmp/openmind-walk-microscopy`,
`/tmp/openmind-walk-compounds`, `/tmp/openmind-walk-bio` and
`/tmp/openmind-walk-binary` for the later batches. None opened the live
`.openmind-data`; each scratch store was removed after its run.

## 3. Honest limitations

- **Coverage.** 100 concepts still have only a plan/outline, not an authored
  lesson. The queue lists them by priority; 17 are `critical`.
- **No human evidence.** Every authored lesson is `draft`/`machine_checked`.
  Zero are `educator_reviewed`; zero are `learner_tested`. No teacher or learner
  was available, so no claim about learning outcomes is made.
- **Viewport coverage.** The project's walk measured all 21 planned lessons at
1280 × 900 and 320 × 640, and all 13 unplanned authored lessons at 1280 × 900,
768 × 1024, 375 × 667 and 320 × 640; no lesson scrolled sideways at any measured
width. The a11y audit measured structural landmarks, control names, skip-link
focus and 320-px overflow, but one surface was gated and the `/access` control
check was intermittent. Screen-reader announcements, switch/eye-gaze input,
200% text reflow and colour-contrast ratios remain unmeasured.
- **Dev-cache failure mode.** A stale `.next-dev` after repeated hard restarts
served the onboarding `Loading…` fallback and left `/learn` on its boot screen.
Deleting only the generated `.next-dev` cache fixed it; no product code was
changed for the cache itself. If the symptom recurs, clear that cache before
mistaking it for a session or lesson defect.
- **Production server.** `npm run build` succeeded in batch 19, but the running
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
4. Authored lessons for the next critical concepts the queue ranks highest,
   starting with `dictionaries`, `functions-code` and `lists-arrays`.
5. Screen-reader, switch-input and 200% text-reflow testing of the authored
   lessons; the structural a11y audit is not a substitute.
6. Restart the local production server so the served app matches the verified
   build.
