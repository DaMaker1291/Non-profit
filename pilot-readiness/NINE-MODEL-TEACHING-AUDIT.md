# Nine-model teaching audit

**Date:** 2026-11-25
**Scope:** the nine interactive models that ship, one concept each (five maths, physics, chemistry, biology, computing).
**Reviewers:** none. This is an engineering and internal-consistency audit, not a subject review.

## What this audit can and cannot say

Three kinds of evidence are kept apart in every table below:

| mark | meaning |
|---|---|
| **A** | **Automated.** `npm run verify`, `npm run e2e` (895/0), `npm run verify:ui` (73/0), `npm run verify:lesson` (1,424/0): structure, exactly one correct prediction option, the reveal and apply step present, the page renders at four widths. |
| **B** | **Hand-written browser record** (`lib/model-evidence.ts`), dated, with a `notChecked` list. A person opened the model; the record says what they did and did not check. |
| **C** | **Independent subject review.** Zero for all nine. No teacher has signed a lesson; no learner has been assessed. |

A row marked **A** proves the *shape* of a teaching claim. It cannot prove the claim is true, well-pitched, or learnable. Where I re-derived the arithmetic or the definition myself, the row says so; that is a checking claim, not a teaching qualification.

## Summary

| concept | subject | model | objective | prediction | browser evidence | educator review |
|---|---|---|---|---|---|---|
| `place-value` | maths | number-line | value of a digit, one-place moves | choice (34 moves) | 2026-11-24, 6 checks, 2 not checked | **pending** |
| `negatives` | maths | number-line | compare below zero, direction of travel | choice (−5 vs −2) | 2026-11-24, 6 checks, 2 not checked | **pending** |
| `fractions` | maths | fraction-line | fraction as position; why 1/8 < 1/4 | choice (1/8 vs 1/4) | 2026-11-24, 8 checks, 4 not checked | **pending** |
| `fraction-ops` | maths | fraction-ops | common denominators; why bottoms are not added | choice (is 2/5 > 1/2?) | 2026-11-24, 7 checks, 3 not checked | **pending** |
| `decimals` | maths | number-line | place value orders decimals | choice (0.45 vs 0.5) | 2026-11-24, 6 checks, 2 not checked | **pending** |
| `electricity-circuits` | physics | circuit | predict I when cells/bulbs change; explain with V = IR | choice (current halves) | 2026-11-25, 13 checks, 4 not checked | **pending** |
| `atoms-elements` | chemistry | atom | element from particle counts; what n and e⁻ change | describe | 2026-11-25, 6 checks, 3 not checked | **pending** |
| `cells` | biology | cell | organelle function by failure; root hair has no chloroplasts | describe | 2026-11-25, 5 checks, 3 not checked | **pending** |
| `algorithms-search` | computing | search | choose linear vs binary by look count, not slogan | choice (first item) | 2026-11-25, 15 checks, 4 not checked | **pending** |

## The models

### 1. `place-value` — number-line model (maths)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | 340 = 34 tens; the 3 is worth 300, the 4 adds four. Re-derived and correct. | A + arithmetic |
| Learning objective | "Say what each digit in a number is worth, and show what moving one place does to its value." Action-first, assessable. | A |
| Prior knowledge | Counting in tens and reading a three-digit number. The same model also serves negatives and decimals, so the line's unit changes between concepts. | A |
| Misconception | More digits means a larger number; the digit's face value mistaken for its place value. | A |
| Prediction | "Ticks are tens, marker at 340: how many moves?" Options 34 / 340 / 3.4. The wrong options are the two ways to misread the unit, not noise. | A |
| Interaction | Move the marker along a line whose tick is ten; the sentence under the line states the value. | B |
| Feedback | Reveal names the count, the digit values, and why "340 moves" counts ones on a line that has none. | A |
| Transfer | Apply step: pick a number and say its value in tens before reading. Guided application, **not** a measured transfer item. | A |
| Assumptions | Line is in tens; numbers below 1000; distance and value coincide on the right of zero. | A |
| Accidental misconceptions | That a place-value number is always < 1000; that decimals have one place; that distance from zero equals value on both sides. | A |
| Accessibility | Keyboard operable controls; no screen reader was driven; Chromium only. | B |
| Low bandwidth | No `http(s)`, `<img>`, `src=` or `fetch(` in the model components (source check); layout measured at 320/375/768/1280. | A |
| Teacher usability | Demonstrate / ask / guided / printable / assessment / follow-up all authored; pack generated, **NOT REVIEWED**. | A |

### 2. `negatives` — number-line model (maths)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | −5 < −2 because it is further left. Correct, and the reveal separates "bigger digit" from "lower value". | A + arithmetic |
| Learning objective | "Compare two numbers below zero, and say which way the answer goes when you move along the line." | A |
| Prior knowledge | Ordering positive numbers; the idea that left means smaller. | A |
| Misconception | −5 > −2 "because 5 > 2"; the number furthest from zero is greatest. | A |
| Prediction | "Marker at −5: is −5 greater, less, or the same?" The options are the three beliefs a learner actually holds. | A |
| Interaction | Move the marker; both neighbours are printed so position, not digit size, settles the comparison. | B |
| Feedback | Reveal states the reversal on the left of zero and why the digits mislead. | A |
| Transfer | Apply: move twice more and say which way the number went. Guided, not measured. | A |
| Assumptions | Integer line; no fractions between ticks; the same model record as place-value/decimals. | A |
| Accidental misconceptions | Generalising "further from zero is greater" from the right-hand side. | A |
| Accessibility | As above: no screen reader, Chromium only. | B |
| Low bandwidth | No external assets. | A |
| Teacher usability | Full teacher block; assessment names the reasoning to listen for, not just the answer. | A |

### 3. `fractions` — fraction-line model (maths)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | 1/8 < 1/4 because eighths are smaller pieces of the same whole. Correct. | A + arithmetic |
| Learning objective | "Read a fraction as a position on a number line, and say why 1/8 is smaller than 1/4 although 8 is bigger." | A |
| Prior knowledge | A fraction as part of a whole; counting along a line. | A |
| Misconception | Bigger denominator means bigger fraction; fractions compared by bottoms. | A |
| Prediction | "Which is larger: 1/8 or 1/4?" — the exact pair that separates digit reasoning from magnitude. | A |
| Interaction | Change the cut; the marker moves; the position is the fact. | B |
| Feedback | Reveal puts 1/8 to the left of 1/4 and says the digits alone say the opposite. | A |
| Transfer | Apply: change the cut and predict the direction before pressing. | A |
| Assumptions | The whole is fixed and the line stops at 1. | A |
| Accidental misconceptions | Fractions are always < 1; every diagram is pre-partitioned; a fraction's size is independent of the whole. The model states all three. | A |
| Accessibility | 8 browser checks, 4 not checked (screen reader, other browsers among them). | B |
| Low bandwidth | No external assets; 320 px measured. | A |
| Teacher usability | Assessment tells the teacher to re-teach with the fold, not more shading. | A |

### 4. `fraction-ops` — fraction-ops model (maths)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | 1/2 + 1/3 ≠ 2/5 because 2/5 = 0.4 < 0.5, and adding positives cannot shrink. 3/6 + 2/6 = 5/6. Correct. | A + arithmetic |
| Learning objective | "Add two fractions with different bottoms by making the pieces the same size first, and say why the bottoms are never added." | A |
| Prior knowledge | Equivalent fractions; a fraction as a number. | A |
| Misconception | Adding tops and bottoms; the denominator as a quantity to add. | A |
| Prediction | "A learner writes 2/5 for 1/2 + 1/3. Is 2/5 bigger, smaller, or the same?" — asks for a refutation, not the right answer. | A |
| Interaction | Change one fraction; the common denominator is shown before the sum. | B |
| Feedback | Reveal uses the impossibility argument and then the sixths method. | A |
| Transfer | Apply: name the common denominator you expect before checking. | A |
| Assumptions | Two fractions, unlike denominators; area/piece model. | A |
| Accidental misconceptions | That the impossible-sum test always works — the model's own note records the equal-fractions case where the mediant equals both. That is unusually honest and must survive editing. | A |
| Accessibility | 7 checks, 3 not checked. | B |
| Low bandwidth | No external assets. | A |
| Teacher usability | Assessment distinguishes a remembered procedure from the reason. | A |

### 5. `decimals` — number-line model (maths)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | 0.5 > 0.45 because five tenths beats four tenths and five hundredths. Correct. | A + arithmetic |
| Learning objective | "Read a decimal by its place value, and place two decimals in order without being misled by the number of digits." | A |
| Prior knowledge | Tenths and hundredths; place value. | A |
| Misconception | More digits means larger; 0.45 > 0.5 because 45 > 5. | A |
| Prediction | "Which is larger: 0.45 or 0.5?" — the canonical string-length trap. | A |
| Interaction | Step the marker in tenths; the place names are printed. | B |
| Feedback | Reveal reads both numbers in tenths/hundredths and says why the digit count misleads. | A |
| Transfer | Apply: order three decimals in your head, then check. | A |
| Assumptions | One decimal place on the line's ticks; the model record is shared with place-value and negatives. **The limitation is real**: this model cannot show 0.45 as a tick, only as a position between ticks. | A |
| Accidental misconceptions | That decimals have only one decimal place — the sharpest risk in the nine, because the line's unit invites it. | A |
| Accessibility | 6 checks, 2 not checked. | B |
| Low bandwidth | No external assets. | A |
| Teacher usability | Assessment asks the learner to say the number in words, which is the check the model cannot automate. | A |

### 6. `electricity-circuits` — circuit model (physics)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | 1.5 V ÷ 6 Ω = 0.25 A; a second 6 Ω bulb in series = 12 Ω → 0.125 A (displayed 0.13, brightness 0.25×); a second cell in series = 3 V ÷ 6 Ω = 0.50 A, brightness 4×. Re-derived from `circuitReading` and correct **inside the stated idealisation**. The hand-written browser record said 0.25 A for two cells — false, and corrected in D6. | A + arithmetic |
| Learning objective | "Predict what adding a cell or a bulb does to the current, and explain it with V = IR rather than with 'more power'." | A |
| Prior knowledge | Series loop, cell, bulb, ammeter; the idea of resistance. | A |
| Misconception | Current is used up; a cell supplies fixed current; one wire lights a bulb; switch position changes brightness. | A |
| Prediction | "Add a second identical bulb in series: what happens to the current?" Correct: halves. The belief "the cell gives a fixed current" predicts "same", so the question discriminates. | A |
| Interaction | Add/remove cells and bulbs, open/close the switch; two ammeters and a brightness readout. | B (13 checks) |
| Feedback | Reveal separates fixed p.d. from fixed current and substitutes into I = V/R; the assessment names "more power" as a surviving wrong explanation. | A |
| Transfer | Apply: state the expected ammeter reading and why before adding. Guided, not measured. | A |
| Assumptions | Ideal 1.5 V cells, identical 6 Ω bulbs, series only, zero-resistance wires, brightness ∝ power. All stated. | A |
| Accidental misconceptions | Brightness ∝ (cells ÷ bulbs)² only for identical series bulbs; all circuits are series; 0.25 A is measured rather than idealised; arrows are conventional current. All stated. | A |
| Accessibility | 13 checks including keyboard operation and the live region; **no screen reader**, Chromium only, and the PhET cross-check was never completed because its components could not be dragged into contact in automation. | B |
| Low bandwidth | No external assets; drawing 306 px at 390 px viewport, no horizontal overflow. | A |
| Teacher usability | Full teacher block; the lesson's KS3 transcript (Oak, added this pass) stops short of the model's quantitative claim, and the audit records that the numbers are an extension. | A |

### 7. `atoms-elements` — atom model (chemistry)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | Adding a neutron to carbon-12 gives carbon-13 (same element, mass +1); adding a proton gives nitrogen. Correct. | A + definition check |
| Learning objective | "Decide which element an atom is from its particle counts, and say what a neutron or an electron changes instead." | A |
| Prior knowledge | **This is the sharpest dependency in the nine.** The model starts from protons/neutrons/electrons, while the KS3 lesson that introduces atoms (Oak, transcript read) uses Dalton's indivisible sphere and never says electron, proton, neutron or nucleus. Used before that replacement is taught, the model asks for two incompatible pictures at once. | A + transcript |
| Misconception | Neutrons change the element; an ion is a different element; atoms have equal protons and neutrons. | A |
| Prediction | Describe box: one atom gains a neutron, another a proton — the learner must separate mass change from identity change in their own words. A describe prediction is not marked; it commits on length and says so. That is the right shape here and a weaker measurement than a choice. | A |
| Interaction | Add/remove protons, neutrons, electrons; element name, mass number and charge update. | B |
| Feedback | Reveal names carbon-13 and nitrogen and states the rule in one sentence. | A |
| Transfer | Apply: change a count and name element, isotope and charge before checking. | A |
| Assumptions | Shell diagram is a model, not a picture; no decay shown; mass number ≠ relative atomic mass. | A |
| Accidental misconceptions | The shell diagram is what an atom looks like; all isotopes are stable; mass number equals relative atomic mass. All stated. | A |
| Accessibility | 6 checks, 3 not checked. | B |
| Low bandwidth | No external assets. | A |
| Teacher usability | The authored lesson (not the supplemental plan) is what the page serves; see defect D1. | A |

### 8. `cells` — cell model (biology)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | A root hair cell is a plant cell without chloroplasts: it cannot photosynthesise, but its mitochondria still release energy from glucose made elsewhere. Correct at KS3. | A + definition check |
| Learning objective | "Explain what each cell part does by what stops working without it, and say why a plant cell can lack chloroplasts." | A |
| Prior knowledge | A cell as the unit of life; the names of the organelles. | A |
| Misconception | Plant cell = animal cell plus wall and chloroplasts; only animals have mitochondria; ribosome is the powerhouse. | A |
| Prediction | Describe: "A root hair cell has no chloroplasts. What can it no longer do, and what can it still do?" — refutes the "plant cells always have chloroplasts" over-generalisation by case, not by assertion. | A |
| Interaction | Switch an organelle off; the failure sentence names what stops and what continues. | B |
| Feedback | Reveal keeps mitochondria working while photosynthesis stops; the assessment names the "animal plus extras" sentence to listen for. | A |
| Transfer | Apply: switch a part off and say what stops before reading. | A |
| Assumptions | One generic animal cell and one generic plant cell; not to scale. | A |
| Accidental misconceptions | Every plant cell has chloroplasts — the limitation says otherwise in words but **the picture cannot**, which the assumptions record states. That is the model's most important honest limit. | A |
| Accessibility | 5 checks, 3 not checked; the Oak transcript read this pass independently supports the 2D/3D limitation. | B + transcript |
| Low bandwidth | No external assets. | A |
| Teacher usability | Authored lesson exists; pack generated, NOT REVIEWED. | A |

### 9. `algorithms-search` — search model (computing)

| criterion | finding | basis |
|---|---|---|
| Subject accuracy | On 14 sorted items, the first item is found in 1 linear look; binary starts at the middle and needs 3. Correct. Binary refuses an unsorted list, so the precondition is experienced. | A + arithmetic |
| Learning objective | "Choose between checking one at a time and halving the list for a particular list and target, and justify the choice with the number of looks." | A |
| Prior knowledge | Ordered lists; what an algorithm is; counting steps. | A |
| Misconception | Binary is always better; binary works on any data; linear needs sorted data; each binary step halves what remains (true, but not the whole cost — sorting is work). | A |
| Prediction | "14 sorted items, target is FIRST: which finds it with fewer looks?" Correct: one at a time. A learner who says "halving, because it is faster" holds the exact belief the model exists to refute. | A |
| Interaction | Step both algorithms on the same list and compare look counts; binary refuses unsorted input. | B (15 checks) |
| Feedback | Reveal gives 1 versus 3 and concludes "it depends", not "binary wins". | A |
| Transfer | Apply: pick two targets, predict the winner for each, then step and compare. | A |
| Assumptions | Comparison count as the cost; random access; list can be sorted. | A |
| Accidental misconceptions | Comparison count is the only cost; binary is always implementable. Both stated. | A |
| Accessibility | 15 checks, 4 not checked. | B |
| Low bandwidth | No external assets. | A |
| Teacher usability | Authored lesson exists; the pack says NOT REVIEWED. | A |

## Defects and limits found by this audit

**D1 — the coverage register undercounts authored lessons.** `coverageRows()` reports `teachingSequence: false` for `atoms-elements` and `algorithms-search`, because it inspects the *plan* object and both plans are `provenance: "supplemental"`. But the lesson page prefers `authoredLessonFor(conceptId)`, and both concepts have a full authored lesson contract (`lib/lessons/authored/chemistry-atoms-elements.ts`, `computing-searching.ts`). The register is therefore conservative but misleading: a reader concludes two of the nine have no teaching sequence when they do. The measure should consult the authored-lesson registry, or the report should say which source it counts. Not changed in this pass — changing a published metric needs its own before/after, and the educator packs quote it.

**D2 — one evidence pass covers three concepts.** `place-value`, `negatives` and `decimals` share the `number-line-model` record: one browser pass, one assumptions record, one `notChecked` list. The pass exercised the line in tens; it did not separately drive the negative region and the decimal ticks in that dated record. The concepts' teaching entries are distinct and authored; the *evidence* is not per concept.

**D3 — "transfer" is an apply step, not a measurement.** Every model has an apply task, and the practice engine has staged transfer surfaces, but this audit found no per-concept transfer result for the nine. The claim "the learner can transfer it" is not supported by any data collected here.

**D4 — accessibility is not established.** The hand-written records say plainly that no screen reader was driven and only Chromium was used. `ACCESSIBILITY-VALIDATION.md` records the VoiceOver attempt blocked by macOS Automation permission and the Safari attempt blocked by the onboarding gate. Keyboard operation is recorded for the circuit model and is asserted structurally elsewhere; it is not a screen-reader pass.

**D5 — a browser record contradicted the model, and the generated pack repeated it.** The circuit evidence said "Added a second cell with one bulb. 0.25 A again (3 V ÷ 12 Ω), so 'more cells is always brighter' is not a rule." The model computes `cells × 1.5 V ÷ (bulbs × 6 Ω)`: two cells across one bulb is 0.50 A and 4× brightness. The note was wrong in value **and** in conclusion, and because the educator packs are generated from the evidence, the false counterexample was printed in `electricity-circuits.md`. Corrected in `lib/model-evidence.ts`; the replacement says it was re-derived from the code rather than re-observed in a browser, and the pack has been regenerated. This is the audit's strongest warning: a hand-written "what I saw" record is not automatically a measurement, and a generated pack will carry its error to a reviewer.

**D6 — subject accuracy is unreviewed.** The arithmetic and definitions above were re-derived by an engineer. That catches an inverted sign or a wrong sum; it cannot catch a misleading sequence, a badly chosen example, or a model that teaches a belief the exam board marks wrong. All nine packs remain `STATUS: NOT REVIEWED`, and `PILOT_APPROVALS` is empty.

## Verdict

The nine models are structurally complete teaching artefacts: each names an objective, commits a prediction before revealing, explains the result, offers an application step, states its assumptions and what it might teach wrongly, and ships teacher notes. That is a real and unusual standard, and the automated suites prove it holds for every concept.

It is **not** evidence that any of the nine teaches well. The gap is unchanged by this audit: zero subject reviews, zero learner results, no screen-reader pass, no Firefox/Safari pass, and a transfer claim that has not been measured. The next step is a teacher, not another model.
