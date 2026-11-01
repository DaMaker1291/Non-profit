# Assessment Quality Report

## 1. The bank, measured

| Property | Measurement | Method |
|---|---:|---|
| Concepts with a generator | 135 / 135 | `lib/questions.ts#ALL_GENS` via `generateQuestion` |
| Draws sampled in this audit | 5,400 | 40 seeds per concept |
| Response kinds in practice | **choice 2,700 / numeric 2,700** | exactly half of the seeds select the numeric layer |
| Choice items with four options | **2,700 / 2,700** | no three-option or five-option draws |
| Draws with duplicate option strings | **0** | dedupe + padding works |
| Concepts with a question figure (40-draw sample) | 4 / 135 | 64 / 5,400 draws (1.2%) |
| Independent answer re-derivation | **5 / 135 concepts (3.7%)** | `npm run verify:q`, 40,500 draws |
| Structural-only verification | **39,000 / 40,500 draws (96.3%)** | four distinct options, no float noise, explanation states its key, sane difficulty |
| Human-reviewed items | **0** | `audit/item-reviews.json` is empty |
| Option-bias line (35%) | **64 / 135 concepts above it** | README/`npm run gate:options`; 34 repaired/asserted |
| Worst option cues | `gravity-fields` 88.3%, `hormones` 82.5% (digit) | served-level measurement |

The 5,400 draws are a sample, not the whole bank: the generators are parameterised and can produce many more items. The important number is not "5,400 questions exist" but "only 3.7% of draws can be independently checked, and none by a human".

## 2. Question diversity

The normalised prompt template count (numbers replaced by `#`) exposes how much variety a learner actually meets:

- **1 template**: `addition`, `subtraction`, `multiplication`, `division`, `order-ops` — 40 draws, one shape, different numbers.
- **3–4 templates**: `rounding`, `algebraic-fractions`, `decimals`, `ratio`, `proportion`, `circle-theorems`, `pythagoras`, `tree-diagrams`, `mixture-problems`, `sets-venn`, and others.
- **Higher variety**: the deep/senior families and the numeric layer add branches, but 119 of 135 generators declare a single difficulty, so tier adaptation can only move 16 of them.

A learner who practises `addition` for twenty items is answering the same question with different digits. That is useful fluency practice; it is not a assessment of understanding, and it should not be presented as one.

## 3. Question quality: what is checked and what is not

`npm run verify:q` is unusually honest about its own limits:

- **5 concepts** have a matcher that re-derives the answer from the prompt; **0 wrong** in 1,500 draws.
- The other **39,000 draws** meet structural rules only: four value-distinct options, no float noise, a non-empty explanation that states its own key, a sane difficulty.
- **No concept has a human review.** `audit/item-reviews.json` is empty.

This means the bank can contain a question whose key is mathematically wrong in a way the structural checks cannot see. The suite itself says so. The audit found no wrong key in the sampled draws it inspected, but that is not the same as a verified bank.

### Distractors

- All 2,700 sampled choice draws have four options; duplicates are padded.
- The option-bias gate measures **eight** strategies (longest, shortest, length extremes, middle-length, most digits, largest value, first, last). It passes its committed floors, but **64/135 concepts remain above the 35% line**. On `gravity-fields`, the key is the only option containing a number, so "pick the one with digits" wins 88.3% of the time; `hormones` has the same defect at 82.5%.
- A learner who never reads the question can beat chance on those concepts. That is an assessment-validity defect, not a cosmetic one.

### Explanations

- The 15 authored maths plans have strong explanations because the plan's prose carries the reasoning.
- Generated item explanations are uneven: median 8–18 prose words for many science/computing concepts; 15 concepts have at least one draw under 6 words. Examples from `npm run explain:audit`:
  - `newton-laws`: *"F = ma = 4 × 2 = 8 N. Resultant force, not any single force."* (7 words)
  - `loops`: *"range(5) yields 5 values (0 to 4), so the body runs 5 times."* (9 words)
  - `motion-graphs`: *"Velocity–time: gradient = acceleration, AREA = distance."* (11 words)
- `npm run explain:audit` passes because its committed floors are low, not because the prose is rich. The standard the project states for itself (name the operation, substitute, say what it means, name the tempting wrong option) is met in the rewritten numeric layer, not across the bank.

## 4. Response formats

| Format | Available in practice? | Evidence |
|---|---|---|
| Multiple choice (4 options) | **Yes**, 50% of draws | 2,700/2,700 four-option |
| Numeric entry | **Yes**, 50% of draws | tolerance + display rounded |
| Multi-part constructed response with method marks | **Only 3 authored items**, in papers | `STRUCTURED_ITEMS`: line graph, plot line, lawn feed |
| Graph plotting | **Prototype only**, uncommitted | `components/graph-plot.tsx`; 3 items |
| Written explanation / essay | **No marked format**; teach-back is unscored by design | `lib/peer-review.ts` returns coverage only |
| Matching / ordering / tables | **No** | `ResponseKind = "choice" \| "numeric"` |
| Diagram labelling | **No** | — |

The marketing phrase "graph plotting" would be an overclaim: three items in two paper templates are a vertical slice, not a response type. The code itself says "no follow-through, no consistent-with-working marks yet".

## 5. Marking integrity

**Good:**

- `/api/question` returned only `id, conceptId, difficulty, prompt, choices` — no `answer`, no `explanation` (`serveView` strips them).
- `/api/worked-example` is a separate, profile-less door that intentionally returns the key; it takes no seed and writes nothing.
- Numeric items carry a tolerance and a display value, so a learner is not marked wrong for `3.14` against π.
- The structured items award a **method mark that survives a wrong answer**, and an answer mark that requires the unit where the question asks for a measurement.
- Per-option notes exist for `negatives` and `coordinates`, returned only with a wrong grade; a correct answer gets `choiceNote: null`.

**Limits:**

- Practice is all-or-nothing except for the three structured items.
- There is no follow-through/consistent-with-working marking.
- The adaptive engine's mastery decision is implemented and deterministic, but **not validated against real learners**. A learner who guesses correctly on four-option items can accumulate evidence; the Agresti–Coull interval widens the uncertainty but does not know the answer was a guess. The product records autonomy/hints, which helps, but no study has tested whether the threshold separates understanding from luck.

## 6. Adaptive recommendations

The engine suite (4,477 assertions) covers the decision path: diagnostic → practice → prove → transfer, repair selection, retention, momentum, and ledger replay. The audit did not find a path where a wrong answer is silently counted as mastery; the evidence model is explicit about measured vs unmeasured and uses an interval rather than a raw percentage.

What cannot be concluded:

- that the recommended next step is pedagogically right for a real learner;
- that mastery is not reachable by guessing;
- that a learner who forgets is detected before the next sitting;
- that the difficulty target matches a South Asian classroom's actual level.

Those require learner data, not more unit tests.

## 7. Verdict

**PARTIAL.** The assessment *machinery* is serious: server-side marking, key stripping, tolerance, method marks, evidence intervals, 4,477 assertions. The assessment *validity* is not established: 0 human-reviewed items, 96% structural-only checks, 64/135 concepts with a learnable option cue, and a practice surface that is almost entirely four-option/numeric. For a pilot, use the 15 authored maths concepts and treat their items as **teacher-reviewed draft items**, not as a validated instrument.
