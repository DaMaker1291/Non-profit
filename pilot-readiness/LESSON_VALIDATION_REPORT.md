# Pilot lesson validation report

**Status: AI-assisted technical and content audit. This is not educator review, not approval, and not learner evidence.**

- Scope: the 12 pilot lessons in `lib/lesson-plans.ts`, the exact generated items in `lib/questions.ts` / `lib/numeric-items-core.ts`, and the rendered `/pilot/[concept]` pages.
- Lesson version: **2026-11-01.3**.
- Date: 2026-11-01.
- Curriculum edition: CBSE Curriculum 2025–26; Mathematics (041/241), Science (086); English medium.
- Mapping status: **provisional-unreviewed** for every lesson. No local educator has confirmed any mapping.
- Browser evidence: `pilot-readiness/evidence/figure-walk.json`, the 16 `figure-*-1280.png` / `figure-*-320.png` captures, and `npm run verify:lesson`.

## Final gate results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **pass** |
| `npm run pilot:check` | **616 passed, 0 failed** |
| `npm run verify:q` | **pass** — 135 generators × 300 draws, 0 problems; 5 prompt-derived, 130 structural-only, 0 human-reviewed |
| `npm run content-check` | **PASS** — 135 concepts, 8 named content gaps |
| `npm run build` | **pass** — 64 static pages |
| `npm run verify` | **4,478 passed, 0 failed**; Postgres half skipped for missing `OPENMIND_TEST_DATABASE_URL` |
| `npm run verify:lesson` | **254 passed, 0 failed** |
| `node scripts/figure-walk.mjs` | **16 captures** — 8 lesson figures × 1280/320; 0 overflow, 0 measured label collisions, 0 aspect-ratio distortions |

## How the audit was done

1. Read all 12 complete plans: objective, intuition, idea paragraphs, terms, worked examples, traps, recap, used-for, prerequisites, figure spec and curriculum mapping.
2. Recalculated the eight sampled generated items per lesson from the printed values, and read the generator branch that produced them. This is 96 sampled items, not every possible draw.
3. Re-ran the pilot gate, which drives 8 draws per lesson and the real resolver/approval/rights code.
4. Ran `npm run verify:q`, which draws 135 generators × 300 and checks four-option shape, duplicate options, float noise, explanations and selected semantic matchers. **Only 5 of 135 concepts have an independent prompt-derived matcher**, so this is a strong structural check, not a proof that every item is mathematically correct.
5. Rendered every pilot figure in Chrome at 1280×900 and 320×640, captured the figure itself, and measured label collisions, clipping, aspect-ratio distortion and sideways scroll.
6. Ran `npm run verify:lesson`, the real browser walk, over the pilot and the other authored plans.

## Corrections made

| Lesson | Defect | Correction |
|---|---|---|
| `equations-stoich` | `Balance: __ Fe + O₂ → __ Fe₂O₃` marked **`4 and 3`**. The product coefficient is **2** (`4Fe + 3O₂ → 2Fe₂O₃`), so the key was wrong and the correct option did not exist. | Key is `4 and 2`; `4 and 3` is now a distractor. A regression draws all five authored balancing equations and checks each marked option. |
| `equations-stoich` | “Combination (two reactants form one product)” is narrower than the chemistry. | “Two or more reactants form one product”. |
| `quadratics` | “Never divide by a variable” is too absolute: dividing is valid when the variable is known non-zero. | “Do not divide by a variable unless you have first checked that it cannot be zero.” |
| `photosynthesis` | “Stomata in the lower surface” reads as universal; stomatal distribution varies by species. | “Stomata — usually on the lower surface”. |
| `fractions` | The figure shaded 270° but did not cut the circle, so “three of its four equal slices” was asserted rather than shown. | Added `slices: 4`; the four equal sectors are now drawn. |
| `electricity-circuits` | The caption claimed a straight current–voltage line, but the renderer drew only the dashed rise/run triangle. | Added the line from `(0, 0)` to `(4, 8)`; it is now drawn from the same points as the triangle. |
| `electricity-circuits` | The `run 4` label sat on the x-axis tick labels; measured overlap with tick `2`. | Run label moved above the horizontal leg; measured overlap is now 0. |
| `coordinates` | The “which axis?” practice branch carried no figure, and the browser walk could serve only that branch; a captioned-figure test therefore found no figure in 6 serves. | Added an origin-only coordinate grid to that branch. The asked-for point is still only in the prompt, so the diagram does not mark the answer. |

The lesson version was bumped from `2026-11-01.1` to **`2026-11-01.3`** because lesson, figure and question content changed. `PILOT_APPROVALS` remains empty.

## Curriculum fit — the important limitation

The source mapping is not the same claim as “this lesson teaches that objective”. The following is the agent’s fit assessment, not an educator’s:

| Lesson | CBSE mapping actually says | Fit |
|---|---|---|
| fractions | Number Systems: rational-number representation and operations | **Prerequisite**, not Class 10 depth. The lesson is fraction foundations. |
| decimals | Number Systems: terminating and recurring decimal representation | **Prerequisite/partial.** The lesson teaches decimal place value and operations, not recurring-decimal representation. |
| negatives | Number Systems: integers and their operations | **Prerequisite**, not Class 10 depth. |
| order-ops | Number Systems: conventions for operations on real numbers | **Prerequisite**, not a Class 10 chapter in its own right. |
| algebra-expand | Algebra: expansion and factorisation, including identities | **Aligned in substance**, provisional. |
| linear-equations | Algebra: **linear equations in two variables**, algebraic and graphical | **Mismatch.** The lesson teaches one-variable equations; it does not teach a pair of equations or their graphs. |
| quadratics | Algebra: quadratic equations by factorisation and formula | **Aligned in substance**, provisional. |
| coordinates | Coordinate Geometry: **distance formula, section formula, area from coordinates** | **Partial/mismatch.** The lesson teaches plotting and straight-line graphs; midpoint and distance-from-origin appear in practice, but the read stage does not teach the section/distance formulas or area. |
| cells | Class 9: The Fundamental Unit of Life | **Class 9 prerequisite**, explicitly labelled; not Class 10 content. |
| photosynthesis | Life Processes — Nutrition | **Aligned in substance**, provisional. |
| equations-stoich | Chemical Reactions and Equations | **Aligned in substance**, provisional. |
| electricity-circuits | Electricity | **Aligned in substance**, provisional. |

**Consequence:** the pack should be described as a **bounded teaching sequence containing foundations, two provisional Class 10 maths mappings and four science lessons**, not as full CBSE Class 10 coverage. In particular, `linear-equations` and `coordinates` must not be approved as Class 10 Algebra/Coordinate Geometry without either revising the lesson or recording an explicit teacher decision that the prerequisite content is what the class needs.

The science mappings are `verification: "portal"`: the CBSE PDF could not be machine-read in this environment. A reviewer must check each heading against the official file. No reviewer has done so.

## Lesson-by-lesson record

### 1. Fractions (`fractions`)

- **Objective:** read a fraction as a number, compare fractions, and explain why 1/8 < 1/4.
- **Mapping:** `cbse-10-maths-2025-26`, Number Systems, provisional.
- **Initial defects:** no wrong key in the eight sampled items. The pie did not show the four equal slices the caption named.
- **Corrections:** added four equal sectors to the pie.
- **Evidence:** 3/9 of 18 = 6; 1/4 of 16 = 4; 24 pens → 8 red, 4 blue, 12 neither; 72 pens at 4/6 red → 48 red, 12 blue, 12 neither. All recounted independently.
- **Remaining uncertainty:** the lesson is a foundation, not Class 10 rational-number depth; the denominator-as-size language is pedagogically deliberate and needs a teacher’s judgement.
- **Browser:** 1280 and 320, figure 552×552 desktop, 258 px wide phone; no overlap, overflow 0. `verify:lesson` passed.
- **External review:** none. **Readiness:** technically presentable as a foundation lesson; not Class 10 coverage.

### 2. Decimals (`decimals`)

- **Objective:** read decimals, order them, add and multiply without losing the point.
- **Mapping:** Number Systems, provisional.
- **Initial defects:** none found in the sampled items.
- **Evidence:** 2 m + 46 cm + 15 mm = 2.475 m; 1.8 × 7.6 = 13.68; 1.5 + 3.5 + 8.8 = 13.8; 6.7 + 8.9 + 3.2 = 18.8. All correct.
- **Remaining uncertainty:** the lesson does not teach recurring decimals or the full rational-number representation named in the mapping. It is a prerequisite/partial fit.
- **Browser:** no drawing; `verify:lesson` measured 320 px without overflow.
- **External review:** none. **Readiness:** review candidate as a foundation lesson.

### 3. Negative numbers (`negatives`)

- **Objective:** compare and calculate with numbers below zero.
- **Mapping:** Number Systems, provisional.
- **Initial defects:** none found.
- **Evidence:** (−2)(−2) = 4; 8 − (−6) = 14; 3 − (−3) = 6; 9 − (−8) = 17; 12 − 16 = −4; −3 + 4 = 1. All correct.
- **Remaining uncertainty:** Class 10 mapping lists integer operations, but this is foundation-level number-line work.
- **Browser:** number line 1280/320; 19 labels; no collision; overflow 0. `verify:lesson` passed.
- **External review:** none. **Readiness:** review candidate as a foundation lesson.

### 4. Order of operations (`order-ops`)

- **Objective:** evaluate expressions using the conventional order.
- **Mapping:** Number Systems, provisional.
- **Initial defects:** none found.
- **Evidence:** 5 + 7 × 3 = 26; 4 + 5 × 5 = 29; 7 + 6 × 5 = 37; 6 + 5 × 4 = 26; 8 + 6 × 3 = 26; 2 + 2 × 4 = 10; 2 + 7 × 7 = 51; 4 + 6 × 8 = 52. All correct.
- **Remaining uncertainty:** this is a convention/prerequisite topic, not a Class 10 chapter.
- **Browser:** no drawing; 320 px no overflow. `verify:lesson` passed.
- **External review:** none. **Readiness:** review candidate as a foundation lesson.

### 5. Expanding & factorising (`algebra-expand`)

- **Objective:** expand two brackets, account for all four terms, and factorise a simple quadratic.
- **Mapping:** Algebra, provisional.
- **Initial defects:** none found in the sampled items or the area model.
- **Evidence:** `(x − 3)(x + 5)` constant −15; `x² + 8x + 12` ÷ `(x + 2)` = `x + 6`; `(4x − 2)(x² − 25)` = `4x³ − 2x² − 100x + 50`; `(2x − 1)(x + 4)(x − 5)` = `2x³ − 3x² − 39x + 20`; `(x − 6)(x + 2)` constant −12. All correct.
- **Figure:** four cells `x²`, `2x`, `3x`, `6`; the 6 is visibly 3× the height and 2× the width of the `x²` cell. Correct area model.
- **Remaining uncertainty:** “including identities” in the mapping is covered only by the difference of two squares; a teacher should decide whether the depth is sufficient.
- **Browser:** 1280/320; no overlap; overflow 0. `verify:lesson` passed.
- **External review:** none. **Readiness:** review candidate.

### 6. Linear equations (`linear-equations`)

- **Objective as written:** solve one- and two-step equations, including unknowns on both sides.
- **Mapping:** Algebra: **linear equations in two variables**, algebraic and graphical.
- **Initial defects:** no wrong key in the eight sampled items. The balance figure correctly shows 3 bags + 5 weights against 20 weights.
- **Evidence:** 6x − 9 = 15 → x = 4; 5x + 5 = 3x + 15 → x = 5; 3(x − 5) = 2x − 6 → x = 9; 3(x + 3) = 33 → x = 8; 5(x − 6) = 3x − 12 → x = 9; 4x + 4 = 24 → x = 5; phone bills give fixed charges £16 and £20. All correct.
- **Remaining uncertainty:** **mapping mismatch**. The lesson does not teach a pair of linear equations in two variables or its graph, which is what the CBSE Class 10 entry states. Do not approve it as Class 10 Algebra without a teacher’s explicit decision or a lesson revision.
- **Browser:** balance 1280/320; labels `3x + 5` and `20`; no collision; overflow 0. `verify:lesson` passed.
- **External review:** none. **Readiness:** technically sound as a prerequisite; **not ready to approve against the current mapping**.

### 7. Quadratic equations (`quadratics`)

- **Objective:** solve by factorising and know when to use the formula.
- **Mapping:** Algebra, provisional.
- **Initial defects:** the trap said “never divide by a variable”, which is false when the variable is known non-zero.
- **Correction:** now says not to divide unless non-zero has been checked.
- **Evidence:** roots 3 and 7; k = ±8 for one root; roots 2 and 5; smaller root 5; repeated root 1; for x² − 6x + 9, α + β + αβ = 15; roots 1 and 3. All correct. The figure’s crossings at 2 and 3 and turning line at 2.5 match `x² − 5x + 6`.
- **Remaining uncertainty:** the formula/discriminant text is correct but the question bank samples mostly factorisable quadratics; no claim of full coverage.
- **Browser:** 1280/320; no collisions; overflow 0. `verify:lesson` passed.
- **External review:** none. **Readiness:** review candidate.

### 8. Coordinates & graphs (`coordinates`)

- **Objective as written:** plot and read points, and read an equation as the shape it draws.
- **Mapping:** Coordinate Geometry: **distance formula, section formula, area of a triangle from coordinates**.
- **Initial defects:** no wrong key in the sampled items. The plotted line is correct: `y = 2x + 1` through (0, 1), (1, 3), (2, 5).
- **Evidence:** midpoint x of (−4, −3), (5, 8) = 0.5; (16, 2), (20, 10) → (18, 6); (4, 1) pair; (−5, 2) from origin √29; midpoint of (7, −3), (−8, −2) x = −0.5; (6, 6), (10, 12) → (8, 9). All correct.
- **Correction:** added an origin-only coordinate grid to the “which axis?” branch, after the browser walk exposed that the branch had no figure. The point `(6, 0)` is not plotted, so the figure does not give away the axis.
- **Remaining uncertainty:** **partial/mismatch**. The read stage teaches plotting and straight-line graphs, not the distance/section formulas or area from coordinates. The practice includes midpoint and distance-from-origin, but that is not a full treatment of the mapped objective.
- **Browser:** 1280/320; no collisions; overflow 0. `verify:lesson` passed.
- **External review:** none. **Readiness:** technically sound as a plotting/straight-line lesson; **not ready to approve as full Class 10 Coordinate Geometry**.

### 9. Cells (`cells`)

- **Objective:** name animal/plant cell parts and connect structure to function.
- **Mapping:** CBSE Class 9, The Fundamental Unit of Life; explicitly a prerequisite.
- **Initial defects:** none found in the sampled items or the prose.
- **Evidence:** 20 μm at ×1000 = 20,000 μm; 10 μm at ×1000 = 10,000 μm; 10 μm at ×100 = 1,000 μm; surface-area-to-volume ratios: 2/2=1, 6/3=2, 16/4=4, 36/6=6; second table 16/2=8, 3/3=1, 16/4=4, 54/6=9. All correct.
- **Remaining uncertainty:** it is Class 9 content; the pack labels it as a prerequisite. A teacher must decide whether to include it in a Class 10 sequence.
- **Browser:** no drawing; `verify:lesson` measured 320 px without overflow.
- **External review:** none. **Readiness:** review candidate as a prerequisite.

### 10. Photosynthesis (`photosynthesis`)

- **Objective:** balanced equation, limiting factors, rate-versus-light graph.
- **Mapping:** Life Processes — Nutrition, provisional.
- **Initial defects:** the stomata sentence overgeneralised their position.
- **Correction:** “usually on the lower surface”.
- **Evidence:** x = 6 in the balanced equation; 5 CO₂ → 0 glucose; 3 CO₂ → 0 glucose; mean increase between 10 and 30 = (15 − 5)/(30 − 10) = 0.5; plateau explanation selects a different limiting factor. All correct. The graph rises then plateaus at 6.
- **Remaining uncertainty:** “usually” still varies by species; the graph is illustrative, not a measured dataset. The PDF mapping is provisional.
- **Browser:** 1280/320; no collisions; overflow 0. `verify:lesson` passed.
- **External review:** none. **Readiness:** review candidate.

### 11. Chemical equations (`equations-stoich`)

- **Objective:** balance equations, use state symbols, conserve atoms.
- **Mapping:** Chemical Reactions and Equations, provisional.
- **Initial defects:** **wrong answer key** on the iron oxide balancing item; “combination” was too narrow.
- **Corrections:** key `4 and 2`; `4 and 3` is now a distractor; “two or more reactants”. Regression checks all five authored balancing equations.
- **Evidence:** 40 g CH₄ = 2.5 mol → 110 g CO₂; 2H₂ + O₂ has two oxygen atoms on the left; CH₄ + 2O₂ → CO₂ + 2H₂O; 4Fe + 3O₂ → 2Fe₂O₃; 2Al + 6HCl → 2AlCl₃ + 3H₂. All correct after the fix.
- **Remaining uncertainty:** the read stage names reaction types but does not teach ionic equations in detail; the mapping is provisional.
- **Browser:** no drawing; `verify:lesson` measured 320 px without overflow.
- **External review:** none. **Readiness:** review candidate.

### 12. Circuits (`electricity-circuits`)

- **Objective:** use V = IR and series/parallel rules.
- **Mapping:** Electricity, provisional.
- **Initial defects:** the figure’s caption claimed a line that was not drawn; the run label collided with a tick.
- **Corrections:** added the `(0,0)–(4,8)` line; moved the run label above the leg. Browser overlap is now 0.
- **Evidence:** 2 Ω ∥ 3 Ω at 6 V → 5 A; 4 Ω + 7 Ω = 11 Ω; 6 V / 3 A = 2 Ω; 5 Ω ∥ 14 Ω = 3.68 Ω; 6 Ω + 2 Ω at 24 V → 3 A; 4 A × 7 Ω = 28 V; 2 Ω ∥ 6 Ω at 24 V → 16 A; 2 A × 5 Ω = 10 V. All correct.
- **Remaining uncertainty:** the graph has tick values but no printed axis titles or units in the drawing; the caption names “current–voltage” and gives V and A. A teacher may want axis labels before classroom use.
- **Browser:** 1280/320; no collisions; overflow 0. `verify:lesson` passed.
- **External review:** none. **Readiness:** review candidate.

## What is still not established

- **Accuracy is not educator-confirmed.** The agent checked the sampled items and the written content; a qualified mathematics and science teacher has not.
- **All random draws were not checked.** The structural harness covers 135 × 300 draws, but only 5 concepts have prompt-derived semantic matchers. The 96 sampled pilot items are a sample, not exhaustive proof.
- **Curriculum fit is not established.** The four number lessons are foundations; `linear-equations` and `coordinates` do not match their Class 10 mapping statements as written.
- **Local-language fit is not established.** The pilot is English-only; no translation or local terminology review exists.
- **Learning effectiveness is not established.** No learner has used the pack; no pre/post, retention or classroom evidence exists.
- **Axis titles.** The axes figures label numeric ticks and caption the quantity, but the drawings do not print `x`/`y` or unit titles. This is a documented presentation uncertainty, most visible on the photosynthesis and electricity graphs.

## Current categories

- **A. Implemented:** the 12 lessons, generated questions, figures, review packet and curriculum/rights mappings.
- **B. Automatically validated:** typecheck, pilot gate, question audit, content check and build (exact final counts in `VERIFICATION_RESULTS.md`).
- **C. Browser verified:** all eight pilot figures at 1280 and 320 with no label collisions or sideways overflow; `verify:lesson` over the authored plan set.
- **D. Externally educator-reviewed:** **none.**
- **E. Validated with real learners:** **none.**

**Conclusion:** this is a technically checked review candidate with one corrected wrong key, three corrected diagram defects (the missing current–voltage line and colliding label, the uncut fraction pie, and the figureless axis question), two clarified overstatements and a mapped-but-not-yet-aligned curriculum. It is not ready for a learner pilot or an approval claim.
