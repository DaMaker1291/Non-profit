# Examination coverage audit — 26 November 2026

> **Post-N2 update (27 November 2026).** Recurring decimals and negative fractions are now taught and assessed. Current measured state: 136 concepts; 35/35 objectives mapped; 18 complete teaching sequences; 17 partial; 0 missing; 5 assessment-complete (`N2-fractions`, `N2-negatives`, `N4-factors`, `N4-prime-factor`, `N10-recurring`); 19 AQA-style items; 0 educator-reviewed; 0 learner-tested; 0 tier-availability gaps; 8 demand gaps. The narrative and denominator table below retain their pre-N4 baseline where they describe history; the current measured state is this banner and the updated rows in §4, §5 and §9. N2-negatives, N4 and N10 are no longer absent, incomplete or terminating-only. A composed practice checkpoint (`/assessment/number`, 14 questions, 30 marks) now sits across the five completed objectives and reports marks by objective; it is not a full specification paper, has no educator review and cannot predict a grade.

**Status: all 16 Number references of AQA GCSE Mathematics 8300 are inventoried. 35 objectives. 18 have a complete authored teaching sequence. 5 (`N2-fractions`, `N2-negatives`, `N4-factors`, `N4-prime-factor`, `N10-recurring`) have all published requirements covered by original assessment items. 0 educator-reviewed. 0 learner-tested. 0 tier-availability gaps; 8 demand gaps remain. The live site does not contain the nine local interactive models.**

This is the first qualification-level audit under the examination-mastery strategy.
It deliberately does not claim that OpenMind teaches any examination. It measures
the distance between a concept catalogue and a specification, and it now covers one
entire content domain rather than a single topic.

Run the measurement with:

```bash
npm run exam:coverage
```

It writes `audit/exam-coverage.json` and reads the audit in
`audit/exam-specs/uk-gcse-maths-aqa-8300.json`. The data file cites the official AQA
pages and records the retrieval date; the report is deterministic.

---

## 1. Live deployment reconciliation

| Check | Result |
|---|---|
| Live deployment reported by `/api/health` | `15f6d6d69b710c2bf2a275f992c37da13649fb48` |
| Local `HEAD` | the same commit, `15f6d6d` |
| Local working tree | 142 paths when checked, before this audit's new files; includes the nine model components and the lesson work |
| Deployed JS searched | 19 chunks, ~7.17 MB |
| `data-model-shell` in deployed JS | **0** |
| `data-model-slot` in deployed JS | **0** |
| The seven model component names in deployed JS | **0 each** |
| `/api/authored-lessons` | 135 lessons, every one `review: "draft"` |
| `/api/lesson-review` | `reviews: []`, `tasks: []` |
| `/api/ready` | ready; file store `ephemeral`, `accepted-ephemeral`, writes permitted; AI `offline`; no problems |
| `/learn/maths` without a session | public shell says "Loading your learning…" — expected for a client-rendered guarded page; not evidence of a broken lesson |

**Conclusion.** The live site is the last commit, not the local working tree. The
nine interactive models (`fraction-line-model`, `fraction-ops-model`,
`number-line-model`, `circuit-model`, `atom-model`, `cell-model`, `search-model`,
and the components behind them) are **not deployed**. The deployment also has zero
human lesson reviews. No production account was created and no write was made
during this audit; only public pages and the public API were read.

The authenticated live learner journey was therefore not walked. The local isolated
demo (`npm run educator:demo`) is the only place the nine models have been verified,
and that verification is local and uncommitted.

---

## 2. The denominators, precisely

These numbers are not interchangeable. Each one has a different owner and a
different meaning.

| Number | What it counts | Owner |
|---:|---|---|
| **136** † | Concepts in the global knowledge genome | `lib/genome.ts` |
| **91** | Specification labels/course records in the catalogue | `SPECIFICATIONS` in `lib/specifications.ts` |
| **130** | Concepts in the `uk-gcse` course across five subjects | `coverageOf()` for `uk-gcse`, union of tiers |
| **63** | Maths concepts in the `uk-gcse` course | filtered from the 130 by subject |
| **56** | Maths concepts with a published concept-level mapping | `CONCEPT_MAPPINGS` for `uk-gcse` |
| **7** | Maths concepts in the course but not in that mapping | `number-bases`, `sim-equations-quad`, `trig-identity`, `polynomials`, `binomial`, `kinematics`, `circle-geometry-adv` |
| **97** | Reference statements published by AQA for GCSE Mathematics 8300 | AQA subject content |
| **16** | Number references inventoried in this audit | `audit/exam-specs/uk-gcse-maths-aqa-8300.json` |
| **35** | Independently assessable objectives into which those 16 references are decomposed | this audit; the decomposition is OpenMind's, not AQA's |
| **25** † | OpenMind concepts linked by those 35 objectives | computed from the audit |
| **16** † | Objectives with a complete authored teaching sequence | this audit; see §4 |
| **19** | Objectives with partial authored coverage | this audit; see §4 |
| **0** † | Objectives with no authored lesson | this audit; N4 is now taught |
| **3** † | Objectives with a complete AQA-style assessment (`N2-fractions`, 4 items/9 marks; N4 shares 7 items/11 marks) | this audit |
| **2** | Specifications with any published concept mapping | `uk-gcse` maths, `in-cbse` maths |
| **1** | Specifications with an objective-level audit | this audit |

The catalogue also collapses five separate AQA GCSE qualifications into one
`uk-gcse` record: GCSE Mathematics 8300, Biology 8461, Chemistry 8462, Physics
8463 and Computer Science 8525 have different papers, tiers and assessment
requirements. `subjectTiers` handles the fact that Computer Science is untiered,
but one record cannot carry five specifications' papers and objectives.

### What teaching actually exists

Measured from `lib/model-coverage.ts`, not from the number of lesson files:

| Scope | Concepts | Authored teaching sequences | Interactive models | Educator reviewed | Learner tested |
|---|---:|---:|---:|---:|---:|
| Global genome | 135 | **23** | **9** | **0** | **0** |
| `uk-gcse` course | 130 | **23** | **9** | **0** | **0** |
| — Maths | 63 | 17 | 5 | 0 | 0 |
| — Physics | 18 | 1 | 1 | 0 | 0 |
| — Chemistry | 15 | 3 | 1 | 0 | 0 |
| — Biology | 16 | 2 | 1 | 0 | 0 |
| — Computing | 18 | **0** | 1 | 0 | 0 |

Every concept has a lesson *file*; a lesson file is not a teaching sequence. The
nine models are locally browser-verified; none is live. Computing has eighteen
concepts in the UK GCSE course and zero authored teaching sequences. Physics has
eighteen concepts and one.

The existing `uk-gcse` maths mapping cites the **DfE's 2013 subject content**, not
the AQA 8300 specification. Its entries are broad concept statements under DfE
headings. The course's board field says AQA, but the existing mapping records DfE
headings, not AQA references (N1, A2, G17, and so on).

---

## 3. AQA GCSE Mathematics 8300: the specification

Source read on 2026-11-26:

- Specification: <https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification>
- Subject content: <https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/subject-content>
- Scheme of assessment: <https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/scheme-of-assessment>
- Version cited in the audit: **1.1, September 2026**, first teaching 2015, first exams June 2017.

### Papers

| Paper | Calculator | Duration | Marks | Weight |
|---|---|---|---:|---:|---:|
| Paper 1 | non-calculator | 90 min | 80 | 33⅓% |
| Paper 2 | calculator | 90 min | 80 | 33⅓% |
| Paper 3 | calculator | 90 min | 80 | 33⅓% |
| **Total** | | | **240** | **100%** |

All content can be assessed on any of the three papers. The qualification is
linear; all papers are taken in the same series. Foundation covers grades 1–5;
Higher covers grades 4–9.

### Assessment objectives

| AO | Foundation | Higher |
|---|---:|---:|
| AO1 Use and apply standard techniques | 50% | 40% |
| AO2 Reason, interpret and communicate mathematically | 25% | 30% |
| AO3 Solve problems within mathematics and in other contexts | 25% | 30% |

The per-paper ranges differ from the overall weighting (for example, Foundation AO1
is 40–60% on each paper but 50% overall). The audit stores both.

### Topic weightings

| Topic area | Foundation | Higher |
|---|---:|---:|
| Number | 25% | 15% |
| Algebra | 20% | 30% |
| Ratio, proportion and rates of change | 25% | 20% |
| Geometry and measures | 15% | 20% |
| Probability and statistics (combined) | 15% | 15% |

### The specification's size

AQA publishes **97 reference statements** across six domains:

| Domain | Prefix | References | Inventoried |
|---|---|---:|---:|
| Number | N | 16 | **16** |
| Algebra | A | 25 | 0 |
| Ratio, proportion and rates of change | R | 16 | 0 |
| Geometry and measures | G | 25 | 0 |
| Probability | P | 9 | 0 |
| Statistics | S | 6 | 0 |
| **Total** | | **97** | **16** |

A reference is not one objective. N2 alone contains four operations, proper and
improper fractions, mixed numbers, positive and negative values, place value and a
finance note. The 97 are the specification's published granularity; an objective
inventory has to decompose them further for teaching and assessment.

---

## 4. The Number domain audit

All 16 Number references are inventoried and decomposed into **35 objectives**.
The decomposition is OpenMind's, not AQA's sub-numbering.

### The seven-stage ladder

Each objective records these facts separately. The report prints the highest stage
reached, but never collapses the others into it.

| Stage | Meaning | Number reaching it |
|---|---|---:|
| **Mapped** | Linked to an OpenMind concept | 33 |
| **Content authored** | An explanation or lesson text exists, but does not cover the whole objective | 19 |
| **Teaching sequence complete** | An authored bundle covers the whole objective and has all eleven contract parts | **14** |
| **Assessment complete** | AQA-style items with marks, command words and a mark scheme cover every published requirement | **1** |
| **Educator reviewed** | A named specialist has signed the objective | **0** |
| **Learner tested** | Actual learners have used it | **0** |
| **Mastery demonstrated** | A learner has provided transfer evidence | **0** |

Two objectives are **unmapped and have no authored lesson** (`N4-factors`,
`N4-prime-factor`). The other 33 have an authored lesson bundle: **19 are partial**
and **14 cover the whole objective**. The 24 linked concepts are served by 23
authored lesson files, each containing all eleven contract parts; `financial-maths`
and `bounds` share one file.

`N2-fractions` is the first objective at **assessment complete**: `a1` assesses
addition, `a3` mixed-number subtraction, `a5` conversion and multiplication, and
`a4` division plus the contextual remainder. The four items total 9 marks and the
requirement marks sum to the same 9. The item is **not** educator-reviewed and no
learner has been tested, so the next stage is not claimed.

The old word "taught" is gone. A paragraph is not a teaching sequence, and a
teaching sequence is not an assessment.

### By reference

| Ref | Objectives | Mapped | Content complete | Sequence complete | Assessment complete | Main finding |
|---|---|---:|---:|---:|---:|---|
| N1 | 2 | 2 | 1 | 1 | 0 | Ordering covered by fractions/decimals/negatives; symbols only partial |
| N2 | 6 | 6 | 3 | 3 | 2 | `N2-fractions` has 4 items / 9 marks and `N2-negatives` has 3 items / 8 marks; decimals and finance remain partial |
| N3 | 2 | 2 | 0 | 0 | 0 | Inverse operations only inside equations; roots/reciprocals partial; `order-ops` now available at both tiers |
| N4 | 2 | **2** | **2** | **2** | **2** | **Complete: one `factors-primes` lesson and 7 items / 11 marks cover both objectives; 0 educator-reviewed, 0 learner-tested** |
| N5 | 2 | 2 | 1 | 1 | 0 | Product rule complete via tree diagrams; systematic listing partial |
| N6 | 2 | 2 | 0 | 0 | 0 | Powers and roots partial; estimation of powers partial |
| N7 | 2 | 2 | 2 | 2 | 0 | Integer and fractional indices complete |
| N8 | 3 | 3 | 1 | 1 | 0 | Surds complete; exact π and multi-step fraction calculations partial |
| N9 | 2 | 2 | 1 | 1 | 0 | Standard form complete; calculator display partial |
| N10 | 2 | 2 | 2 | 2 | 1 | **Complete: terminating and recurring decimals share one lesson; 5 items / 14 marks cover the recurring requirements** |
| N11 | 1 | 1 | 1 | 1 | 0 | Ratio complete |
| N12 | 2 | 2 | 1 | 1 | 0 | Percentage operator complete; fraction operator partial |
| N13 | 2 | 2 | 0 | 0 | 0 | Units and metric conversions remain partial |
| N14 | 1 | 1 | 1 | 1 | 0 | Estimation complete; available at both tiers; demand still capped |
| N15 | 2 | 2 | 1 | 1 | 0 | Rounding complete; error intervals partial; available at both tiers; demand capped |
| N16 | 2 | 2 | 1 | 1 | 0 | Bounds complete; limits partial but Foundation-accessible through rounding |
| **Total** | **35** | **35** | **18** | **18** | **5** | |

### The eighteen complete authored teaching sequences

- `N1-order-mixed` — fractions, decimals and negatives, each with ordering taught.
- `N2-fractions` and `N2-mixed` — `fraction-ops` now teaches improper fractions,
  mixed-number conversion and the four operations on both forms.
- `N2-negatives` — `negatives` teaches ordering, all four operations, signed
  fractions, common denominators and reciprocals, with an eight-mark assessment.
- `N5-product-rule` — the tree-diagram lesson multiplies along a path.
- `N7-roots-indices` and `N7-fractional-indices` — `indices-intro` covers roots and
  fractional indices.
- `N8-surds` — simplifying surds, adding like surds, rationalising denominators.
- `N9-standard-form` — conversion, calculation and magnitude comparison.
- `N10-terminating` and `N10-recurring` — the `decimals` and `fractions`
  lessons together; `decimals` now teaches recurring notation, the denominator
  test, both conversion directions and 0.999... = 1.
- `N11-ratio-fractions` — ratio notation, equivalence, sharing and units.
- `N12-percentage-operator` — percentage of an amount and the multiplier.
- `N14-estimate-check` — `rounding` covers estimation and checking.
- `N15-rounding` — decimal places and significant figures.
- `N16-bounds` — the `bounds` lesson covers error intervals and bound arithmetic.

All eighteen are now reachable at their required tiers after the Higher-tier and
N16 corrections. Availability is still separate from demand: several foundational
concepts remain capped below the Higher target even though a Higher learner can
now reach them (see the demand table below).

`N8-exact-fractions` remains partial even though `fraction-ops` is now complete:
that objective asks for exact multi-step calculations, and the lesson does not
carry an AQA-style multi-step assessment. The same logic leaves exact π, calculator
displays, units and error intervals partial.

Five complete teaching sequences now have a complete AQA-style assessment:
`N2-fractions` (4 items / 9 marks), `N2-negatives` (3 items / 8 marks), the two
N4 objectives (7 items / 11 marks) and `N10-recurring` (5 items / 14 marks).
Those 19 authoring items are not a qualification: no item is educator-reviewed,
no learner has been tested, and no full paper or grade calibration exists.

### The partial host lessons

- `N2-decimals` and `N2-finance` — the decimal and financial-mathematics host
  lessons do not yet carry the full objective or an AQA-style assessment.
- `N8-pi` — the area lesson does not teach exact multiples of π.
- `N9-calculator-display` — standard form is taught, but calculator display reading
  is not.
- `N12-fraction-operator`, `N13-units`, `N13-metric-conversions`,
  `N15-error-intervals` and `N16-limits` remain partial for the reasons in the table.

The largest remaining teaching gaps are **decimal and financial contexts**,
**exact π**, **calculator displays**, **units/metric conversions**, and **error
intervals/limits**. Factors and prime factorisation (N4), recurring decimals
(N10) and negative fractions (N2-negatives) have moved from gap to complete
teaching and assessment coverage.

### Tier availability is corrected — zero gaps

AQA classifies N1 and N2 as basic Foundation content and permits all content on
Higher papers. The `uk-gcse` Higher course now explicitly includes the eight
primary-arithmetic concepts instead of applying the generic advanced-tier
exclusion. The audit reports **0 tier gaps**, and `npm run exam:coverage` fails if
any objective's concept is outside a tier that examines it.

N16 is split as required: `N16-limits` is mapped to the Foundation-available
`rounding` lesson, while `N16-bounds` remains the Higher-only `bounds` objective.
Foundation therefore has a route to limits of accuracy without being given the
Higher bounds sequence.

### Availability is not demand: eight concepts still cap below the Higher target

The curriculum is now open, but the question bank is not yet Higher-demand for
these concepts. Measured by `conceptDepth` against the Higher target of 0.65:

| Concept | Deepest generated item | Higher target |
|---|---:|---:|
| `addition` | 0.30 | 0.65 |
| `subtraction` | 0.30 | 0.65 |
| `multiplication` | 0.35 | 0.65 |
| `division` | 0.35 | 0.65 |
| `place-value` | 0.35 | 0.65 |
| `order-ops` | 0.40 | 0.65 |
| `negatives` | 0.45 | 0.65 |
| `rounding` | 0.50 | 0.65 |

These are **demand gaps**, not availability gaps. A Higher learner can now reach
the concepts, but if the engine serves the concept directly it may still receive a
foundation-level item. The required correction is a Higher application layer that
uses these skills inside multi-step algebra, ratio, geometry and problem-solving
contexts — not raising the primary generators' ceilings and not hiding the
concepts again. The audit reports the eight ceilings so this remains visible.

---

## 5. What the current product can and cannot claim

**Can claim, with evidence:**

- 135 concepts in a global knowledge genome; 91 specification labels.
- 130 concepts in the `uk-gcse` course; 23 authored teaching sequences; 9
  interactive models, all browser-verified **locally**.
- One concept-level UK GCSE maths mapping with 56 entries, no named reviewer.
- All 16 AQA Number references inventoried; 35 objectives; 35 mapped; 18 complete
  authored teaching sequences; 17 partial; 0 with no lesson; 5 objectives with all
  published requirements assessed by 19 original items (5 in N10 recurring
  decimals, 7 in N4, 4 in N2-fractions and 3 in N2-negatives).
- 0 educator reviews, 0 learner trials, no full paper and no grade calibration.

**Cannot claim:**

- That any qualification is fully covered.
- That 135 concepts or 91 labels is examination coverage.
- That a learner is ready for 85%.
- That an AQA-standard, objective-tagged exam-style bank exists.
- That mock examinations, mark schemes or grade calibration exist.
- That the nine models are live.
- That any lesson has been independently reviewed or tested with learners.

### What "85% ready" would require

The current product has no instrument that can produce an 85% readiness claim. The
minimum credible chain is:

1. Every assessable objective of one qualification is inventoried from the
   official specification.
2. Each objective has a teaching experience that teaches it, not a parent concept.
3. Each objective has practice items tagged to it, including independent and
   delayed retrieval.
4. Each objective has at least one AQA-style item with marks, a command word and a
   mark scheme.
5. Timed, full-paper mocks use unseen questions and are marked against a rubric.
6. Readiness is computed from objective-level evidence across all domains, not one
   mastery percentage.
7. The readiness indicator is calibrated against real learner outcomes before it
   is described as a predicted grade.
8. A subject specialist reviews the mapping, the teaching and the marking.

None of steps 1–8 is complete for any qualification. Step 1 is complete for 16 of
97 references — the whole Number domain, and nothing else.

---

## 6. The measurement system this replaces the headline with

`npm run exam:coverage` reports, per qualification:

| Field | Meaning |
|---|---|
| `totalReferences` | The specification's own published reference statements |
| `inventory.referencesInventoried` | References actually decomposed into objectives |
| `inventory.objectives` | Assessable skills recorded, with a source reference |
| `ladder.mapped` | Objectives linked to at least one OpenMind concept |
| `ladder.contentComplete` / `contentPartial` / `contentMissing` | Whether an explanation exists, and whether it is complete |
| `ladder.sequenceComplete` | Objectives with a structured learning experience |
| `ladder.assessmentItems` | Objectives where at least one AQA-style item exists |
| `ladder.assessmentPartial` | Objectives where some published requirements are mapped to items, but not all |
| `ladder.assessmentComplete` | Objectives where every listed published requirement is mapped to an item with marks, command word and mark scheme |
| `ladder.educatorReviewed` | Objectives with a named specialist and date |
| `ladder.learnerTested` | Objectives used by actual learners |
| `ladder.masteryDemonstrated` | Objectives with transfer evidence from a learner |
| `assessment.examStyleItems` | Count of AQA-style items |
| `assessment.authoredStructured` | Authored constructed-response items without AQA marks |
| `assessment.requirements` | The published requirements, whether each is covered, and the item, question type, difficulty, tier and marks that cover it |
| `tierGaps` | Objectives whose concept the course excludes at a tier that examines it |
| `verdict` | `NOT EXAM-READY`, `INCOMPLETE`, or `COMPLETE WITHIN THE INVENTORIED REFERENCES` |

The gate refuses inconsistent data: a source without a retrieval date, a paper
weight that does not sum, an AO outside its range, an unknown concept, a complete
sequence without content, an assessment without marks/command word/mark scheme or
without a requirement map, a covered requirement without an item, a review without
a named reviewer and date, a learner-tested objective without evidence, a
prerequisite cycle, or a complete sequence claimed at a tier whose course excludes
its concept. `ladder.assessment` means only that items exist; it never means the
objective is assessed. It **does not** fail because coverage is incomplete;
the report makes the incompleteness visible instead.

A partial inventory is never extrapolated. The current AQA audit covers **16 of 97
references (16.5%)** and says so on every run.

---

## 7. What remains, in order

1. **Complete the remaining 81 references.** Algebra 25, Ratio 16, Geometry 25,
   Probability 9, Statistics 6. Do not start a second qualification until this one
   is complete.
2. **Build the Higher application layer for the eight foundational concepts.**
   Availability is fixed; demand is not. A Higher learner must meet addition,
   rounding or negatives inside multi-step algebra, ratio, geometry and
   problem-solving tasks, not as a standalone primary item. Do not raise the
   primary generators' ceilings to fake this.
3. **Build the missing teaching sequences.** Standard form, recurring decimals,
   ratio, rounding/error intervals, bounds, units/metric conversions, prime
   factors/HCF/LCM, and the partial Number objectives.
4. **Build the AQA-style item bank.** Every item needs an objective, paper, marks,
   command word, mark scheme and misconception. No copied AQA papers or mark
   schemes; original items only.
5. **Build timed mocks** from the bank, with unseen distributions and a results
   report that separates content gaps from technique and time management.
6. **Only then build readiness.** Objective-level evidence, delayed retention,
   independent performance, and calibration against real outcomes. No predicted
   grade before calibration.
7. **Add educator review.** The signed pack and feedback form are ready; zero
   teachers have been contacted. No mapping or item is "reviewed" until a named
   specialist signs it.
8. **Repeat for one other qualification** after AQA maths is complete. The 91
   labels are not 91 completed courses.

---

## 8. Open findings outside this audit

- `npm run curriculum-gate` currently exits 1 on **20 pre-existing Guatemala grade
  records** (`gt-national` physics, chemistry, biology and computing at five
  grades). This audit did not create or fix them; fixing them requires a source
  decision, not an invented grade.
- The live deployment is at the last commit and contains none of the nine local
  models. Committing, pushing or deploying is not authorised by this audit.
- The authenticated live learner journey was not walked; only public pages and
  public APIs were read. No production learner record was created or changed.
- The generated question bank was not re-audited item by item. The finding is that
  no item is tagged to an AQA objective, not that the bank contains no usable
  questions.
- The local research register and model evidence were not re-inspected in this
  pass; no new research claim is made.
- No AQA paper or mark scheme was copied. The audit cites the specification and
  paraphrases reference statements for mapping.

---

## 9. Final report against the twelve requested items

| # | Requested item | Current state |
|---:|---|---|
| 1 | Actual live deployment version | `15f6d6d`; local `HEAD` same; nine models uncommitted and absent from the live bundle |
| 2 | Curriculum coverage by qualification | 91 labels; 2 concept mappings; 1 objective audit (AQA maths); **16 of 97 references**; 0 qualifications complete |
| 3 | Exact specification objectives | AQA 8300: 97 published references; **all 16 Number references** inventoried into **35 objectives**; 81 references not inventoried |
| 4 | Missing learning objectives | 0 objectives with no concept or lesson; 17 partial; **0 tier-availability gaps**; 8 demand gaps; 81 references outside the inventory |
| 5 | Complete teaching coverage | **18 of 35** objectives have a complete authored sequence; 25 linked concepts; 24 lesson files with all 11 parts; 5 with a model |
| 6 | Examination question coverage | **19** AQA-style items across five assessment-complete objectives; `N2-negatives` contributes 3 items (8 marks), `N10-recurring` 5 items (14 marks, including two self-marked constructed responses); 0 educator-reviewed; 0 learner-tested |
| 7 | Mock examination readiness | 0 timed mocks; 0 full papers; 0 mark schemes; no grade calibration |
| 8 | Adaptive learning behaviour | Concept-level difficulty adaptation exists; objective-level adaptation and readiness do not |
| 9 | Performance and offline support | Existing offline/low-bandwidth work exists; not measured by this audit and not claimed here |
| 10 | Independent educator validation | 0 reviews; 0 contacted; all packs `NOT REVIEWED` |
| 11 | Real learner evaluation | 0 trials; 0 learner records used; no effectiveness claim |
| 12 | What is genuinely required for 85%+ | The eight-step chain in §5; step 1 is complete for the Number domain only; steps 2–8 are not complete for any qualification |

**Verdict.** OpenMind now has an honest, complete audit of one examination domain
and a seven-stage ladder that prevents a lesson file from being counted as
teaching. It still has no completed qualification: 81 AQA references are
uninventoried, only fourteen Number objectives have a complete authored teaching
sequence, one objective has a complete AQA-style assessment, and no teacher or
learner has validated anything. The live site is older than the local model work.

The next unit of progress is the remaining **81 AQA references**, then the missing
teaching sequences (`N4` first), the rest of the AQA-style assessment bank, and
educator review of the items that now exist. Not another concept, video or global
qualification.
