# Lesson Quality Report

## 1. Method and evidence limits

Every concept was resolved through the real `planFor()` path and 40 question draws per concept were generated. The 15 authored plans were inspected field by field; the `fractions` and `fraction-ops` plans were read line by line. The 120 fallback paragraphs were sampled and inventoried; the examples quoted here were read in full. Rendering evidence comes from `scripts/lesson-walk.mjs` driving Chrome over CDP against the production build, plus the saved screenshots in `evidence/`. **The walk completed the 1280/320 layout measurements for all 15 plans, then stalled at the worked-example fade step and did not produce a final pass count.** The order assertions it did reach passed; the fade assertions did not complete.

**What this report can establish:** implementation and content indicators (A/B/C).  
**What it cannot establish:** that children learn more (E), or that a subject specialist endorses the sequence (D). No educator has reviewed any plan; no learner has used one in a measured study.

## 2. The authored plans: genuinely good teaching

The 15 plans are 299–666 words, with 4–6 idea paragraphs, 3–4 traps, and 11 figures. Their structure is consistent but not formulaic: the intuition differs by concept, and the traps are written as the wrong move a learner actually makes, followed by why it fails.

### Worked example of quality: `fractions`

- **Objective is an action, not a topic:** *"Read a fraction as a number, compare two of them, and say why 1/8 is smaller than 1/4 when 8 is bigger."*
- **Intuition precedes terminology:** two identical chocolate bars, one cut into four and one into eight. The learner feels the paradox before the word "denominator" appears.
- **The core misconception is named and explained:** the bottom number is a **size**, not a quantity. The lesson says this is "the single most common wrong answer in the whole of fractions" and explains why it is a reasonable mistake, not carelessness.
- **Traps are specific:** `1/8 > 1/4 because 8 > 4`; comparing tops when bottoms differ; `3/4 + 1/4 = 4/8`. Each is followed by the reason the move fails, not just a correction.
- **A second, arithmetic-free method is taught:** compare each fraction with `1/2`. That is genuine mathematical flexibility, not a single procedure.
- **The figure is the claim:** a pie with three of four slices shaded, caption: *"Three quarters of one whole: the circle is the 1, and the shaded part is three of its four equal slices."*
- **Interactive model:** two sliders (pieces the whole is cut into, pieces shaded), numerator clamped to the denominator, live text `3/4 — 3 of 4 equal pieces`.

### Other strong plans

- **`fraction-ops`** teaches the *reason* for a common denominator (you cannot add counts of different-sized pieces) and gives a size check that catches `2/3 + 5/6 = 7/9` without arithmetic: the answer is smaller than one addend.
- **`linear-equations`** uses a balance beam for `3x + 5 = 20`, then explicitly forbids "move it across and change the sign" as a rule that hides the operation. It ends with substitution back into the original equation as the check.
- **`quadratics`** draws `y = x² − 5x + 6` with roots at 2 and 3 and the axis of symmetry at 2.5; the figure and the algebra are one claim.
- **`surds`** draws a square of area 50 tiled into 25 squares of area 2, making `√50 = 5√2` visible rather than procedural.

### Honest weaknesses in the authored plans

1. **All 15 are unreviewed.** The screen says so; this report does not upgrade that.
2. **All 15 are mathematics, mostly UK-flavoured contexts.** Chocolate, pizza and "bags and weights" travel reasonably, but there is no South Asian context and no local currency or measurement example.
3. **English only, except one plan.** `fractions` has a complete French translation; the other 14 have none. A learner who chooses Bengali or Urdu reads a translated heading over English teaching; the page discloses this (`lq.teachNote`), which is honest but not instruction.
4. **Transfer is mostly unavailable.** The lesson page's own comment states that 133 of 135 concepts cannot yet be re-framed for transfer. The final stage of the promised path is therefore deeper practice on the same form for most concepts, not application in a new context.
5. **The worked example is generated live from the same bank as practice.** That guarantees it cannot drift from what is served, but it also means the example may be a numeric or multiple-choice item rather than a fully narrated human solution; the explanation is the item's explanation, typically 8–25 words in the weaker families.

## 3. The fallback lessons: accurate summaries, not teaching

All 120 fallback pages have a concept-specific paragraph of 31–58 words. They are generally accurate and compact. They do not contain:

- an objective;
- an intuition or analogy;
- a faded second attempt (the first worked example **does** render for every concept, generated live behind "Show me how");
- named traps;
- a concept-specific figure;
- a transfer note;
- any indication that the lesson is a fallback.

### Example: `place-value` (fallback, 53 words)

> *"In the number 452, the digit 4 means 400, the 5 means 50 and the 2 means 2. Each step left multiplies a digit's value by ten, and each step right divides it by ten. This single idea is why we can write enormous numbers compactly, and it is the foundation of decimal numbers, estimation and standard form later on."*

This is a good *definition*. A 9-year-old who has never met place value cannot learn it from this alone: there is no worked comparison, no error to avoid, no image of a place-value grid, no guided first step. The practice item that follows may be answerable by pattern, which is exactly the "correct answer without understanding" the product says it wants to avoid.

### Example of a factual defect: `periodic-table` (fallback)

> *"Group 1 metals react fiercely with water; group 7 halogens grab electrons; **group 8 noble gases** react with almost nothing."*

The noble gases are **Group 18** under IUPAC numbering, or **Group 0** in the older UK convention. "Group 8" is the transition-metal column containing iron, ruthenium and osmium. A learner who remembers this sentence will answer a GCSE question incorrectly. This is a P1 content-accuracy defect, not a typo: it is a category error in the one sentence the fallback provides.

### Example: `photosynthesis` (fallback, 58 words)

> *"6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ in chloroplasts. Limiting factors: light intensity, CO₂ concentration, temperature — the graph plateaus as each saturates. Glucose fuels growth, respiration, and storage as starch. Every food chain starts here: plants bank sunlight as chemical energy."*

Accurate, dense, and unusable as a first lesson. It names "limiting factors" and "plateaus" without showing a graph; it names chloroplasts without a cell diagram; it states the equation without explaining why light and water are inputs. The question bank can ask about limiting factors, but the page has not taught them.

## 4. Pedagogical dimensions (A–G)

| Dimension | Authored 15 | Fallback 120 | Evidence |
|---|---|---|---|
| **A. Conceptual accuracy** | Strong in the sampled plans; no mathematical error found in the 15. | Mostly accurate; one clear factual error (`periodic-table`, Group 8). Several simplifications are unqualified (e.g. "300 million alveoli", "blockage is the world's leading cause of death"). | Source read; no subject-specialist review |
| **B. Explanation quality** | Explains *why* (common denominator, balance, inverse operations), connects to prerequisites, distinguishes similar concepts. | Defines and summarises; rarely explains why; assumes the reader already knows the vocabulary. | Full read |
| **C. Worked examples** | One live solved item + one faded item per plan; step reasoning is the item explanation. | One generated item behind "Show me how" (line `:904`); no faded second attempt, no authored narration. | Page source; rendered `addition` page |
| **D. Pedagogical progression** | Objective → intuition → figure → idea → worked → faded → traps → practice, verified in that order by the browser walk. | Two paragraphs → practice. No guided stage. | Chrome walk; page source |
| **E. Misconception handling** | 3–4 named traps per plan, each with why it fails; per-option notes for `negatives` and `coordinates`; repair cards for targeted beliefs. | Genome misconception list (where declared) + item-level explanation; 70/135 concepts declare no misconception at all. | `lib/genome.ts`, `lib/misconceptions.ts` |
| **F. Cognitive accessibility** | 299–666 words, 4–6 paragraphs, short sentences, concrete first. At 320 px: no sideways scroll, labels ≥12 px. | 31–58 words — arguably *too* short for the concept, and no visual support. | Layout measurements |
| **G. Learning transfer** | `usedFor` names where the idea is reused; transfer serve exists for a small minority. | No transfer note; practice may vary numbers, not surface. | Page source; `lib/transfer.ts` comment |

## 5. Subject-level judgement

| Subject | Teaching verdict | Why |
|---|---|---|
| **Mathematics** | **PARTIAL — a real pilot pathway, not a curriculum** | 15/67 concepts have strong lessons; 52 do not. The 15 form a coherent fractions→decimals→percentages→algebra→graphs pathway, but a learner who branches to `ratio`, `probability` or `geometry` falls back immediately. |
| **Physics** | **FAIL as teaching** | 0/18 plans. No circuit, force, wave or motion diagram. A learner gets a dense paragraph and a generated question. |
| **Chemistry** | **FAIL as teaching** | 0/16 plans. No atomic structure, bonding or equation-balancing visual. One factual error in the fallback. |
| **Biology** | **FAIL as teaching** | 0/16 plans. No cell, organ or ecosystem diagram; photosynthesis and respiration are paragraphs. |
| **Computing** | **FAIL as teaching** | 0/18 plans. Code concepts are explained in prose with no executable trace, no worked program, no debugging example. |

## 6. What "good" would require

The 15 plans are the template. To make a subject teachable, every concept in its pilot pathway needs the same seven components, a concept-specific figure where a picture carries the idea, and a subject specialist's signature. The current pilot pack (15 concepts / 154 items) is the correct unit of review: finish and review that pathway before adding another subject, rather than spreading 120 paragraphs thinner.
