# Assessment validity — can a learner beat the options without reading the question?

A multiple-choice item leaks a signal through its OPTION SET whenever the correct
option is distinguishable from the distractors by a property that has nothing to
do with the subject: its length, the number of digits it contains, its magnitude,
or its position. A bank with such a cue does not measure learning — it measures
test-taking — and every claim this project makes about evidence inherits the
flaw. `npm run audit:options` measures it; `npm run gate:options` refuses to let
it come back.

**This document reports measurements, not learning.** The instrument models
guessing STRATEGIES over generated items. A reduction in a strategy's win rate is
evidence that an option set is less exploitable; it is not evidence that any
student learned more, and no such claim is made here.

## 1. The instrument

`npm run audit:options` draws the bank's own items from every generator on three
surfaces — the catalogue as authored, and the **production serve**
(`generateQuestionNear(id, seed, 0.75, 40)`, the call `app/api/progress/route.ts`
makes) at a 0.50 and a 0.75 target — and scores eight fixed, simple strategies
against the 25% chance line of a four-option item:

| strategy | what it means |
|---|---|
| longest / shortest text | pick the longest / shortest string on screen |
| never-middle | pick among the length extremes only |
| never-extreme | pick among the middle-length options only |
| most digits | pick the option containing the most digits |
| largest value | pick the option reading as the largest number (standard form understood) |
| first / last position | pick the option in the first / last slot |

The **best of the eight** is the honest exposure figure: a learner does not have
to know WHICH cue tells the truth, only that one does. Reporting `longest` alone
understates the fault, and — as §4 shows — repairing `longest` alone can simply
move the cue.

The instrument also reports the key's length RANK distribution, the split by
answer form (a numeric draw's printed options are its multiple-choice twin; its
cue is magnitude, not wording), and the split by generation path (a base family
declares difficulty < 0.5, a deep family ≥ 0.55).

## 2. What it found

Measured before any repair, on the surface a learner meets (`served@0.75`): the
key was the longest option in **60.7%** of items and the strategy "always pick the
longest" scored **37.3%** against a 25% chance line. Per concept it was total:
in the deep families of `gravity-fields`, `hormones`, `breathing-gas`,
`covalent-bonding` and others, the key was the unique longest option in **100% of
240 draws**. 44 of 135 concepts were worth more than 40% to the length heuristic.

The cause was an authoring convention, not a bug: the correct option was written
as the complete, explanatory statement ("the resultant force is NOT zero — it
points toward Earth, bending the path into a circle") while the distractors were
one-clause stubs ("gravity has stopped acting"). The conventions of a good
explanation had been applied to the answer key and not to its alternatives.

## 3. What was changed, and what it measured

The repair rule: **within one family, write the four options as parallel clauses
and give the key's LENGTH RANK its own value in each variant — one row where the
key is the longest, one second, one third, one shortest — moving any rationale
into the family's existing `explanation` string and stating each distractor as
fully as the key.** A fuller statement of a misconception is a better distractor;
that is the educational justification, and the metric moves as a consequence.

Content was rewritten in `lib/questions-deep.ts`, `lib/questions.ts`,
`lib/questions-physics.ts`, `lib/questions-computing.ts`,
`lib/questions-chemistry.ts`, `lib/questions-biology.ts`,
`lib/questions-mid-maths.ts`, `lib/questions-mid-chemistry.ts`,
`lib/numeric-items-core.ts` and `lib/numeric-items.ts`.

| surface | best-of-eight BEFORE | after (same seeds) | after (HELD-OUT seeds) |
|---|---:|---:|---:|
| catalogue | 27.1% | 25.1% | 25.7% |
| served@0.50 | 32.5% | 27.1% | 26.5% |
| served@0.75 | **37.3%** | **34.5%** | **34.5%** |

Held-out seeds matter: the first repairs were chosen by looking at items, so a
re-measurement on the same draws would prove something about those draws rather
than about the bank. `--prefix=` namespaces the seed string, and the held-out run
(`npm run audit:options --prefix=held-out:`) reproduces the in-sample result to
within 0.05 points — the movement is real, not seed-fitting.

Per subject (held-out, all surfaces, longest-text achievable): biology 56.9% →
48.9%, chemistry 35.6% → 31.1%, physics 32.3% → 24.5%, computing 32.2% → 26.8%,
other 33.7% → 28.1%, maths 25.3% → 23.8%.

**Position cues were never the problem** (first 25.7%, last 24.5% — the shuffle is
sound), and magnitude cues are small on the typed surface (0.2%). The remaining
fault is text length and digit presence.

## 4. The two lessons the second instrument forced

**(a) A family-level fix is not a concept-level fix.** `generateQuestionNear`
picks among every generator a concept owns, and at a 0.75 target it can land on
ONE ROW of ONE family almost every time (measured: 49 of 60 `gravity-fields`
draws were a single row). Spreading the key's rank across a family's rows
therefore does not spread it on the item actually served.

**(b) A length repair can replace one cue with another.** The same two concepts
were measured at family level as repaired (100% → 36.7% and 100% → 28.8%) and at
served level as still exploitable — but by a DIFFERENT strategy:

| concept | served@0.75 before | after | which strategy now wins |
|---|---:|---:|---|
| `ai-basics` | 100% | **36.7%** | shortest text (a real, large improvement) |
| `gravity-fields` | 90.7% | 88.3% | **digits 88.3%** — the key is the only option containing a number |
| `hormones` | 100% | 82.5% | **digits 82.5%** — the key is the only option quoting the set point |

The rewrite gave each distractor a multi-clause form and the key kept its numeral.
These two are recorded as backlog, not claimed as fixed. That is why the gate
scores all eight strategies separately: a combined figure would have reported a
repair that a learner can still exploit.

## 4b. The 2026-10 pass — the longest-key tier, and why 50% is a floor

A learner reported this in the plainest possible words: *"sometimes the longest
answer is always right"*. Measured on the served surface before the pass: **28 of
135 concepts had the key in the longest option at ≥90% of draws, 6 of them at
exactly 100%** (`bounds`, `enzymes`, `evolution`, `indices-intro`, `proof`,
`trig-rule`), and 19 concepts at ≥90% on text length alone. The complaint was
accurate, and the symptom is a certain win: read nothing, pick the longest
string, score 100%.

Twenty concepts were rewritten — every one above 89% on text length except
`indices-intro`, `trig-rule` and `fraction-ops`, whose tell is digit/magnitude and
which belong to the numeric workstream below. Mean best-of-eight for the twenty:
**96.0% → 46.2%**; longest-text above 60% across the bank: **28 concepts → 8**.

| concept | before | after | how |
|---|---:|---:|---|
| `bounds` | 100% | **25%** | every area printed to a stated 2 dp (`55.9475` beside `56.7` was the whole cue) |
| `proof` | 100% | **38%** | three scenes, three length ranks — longest, shortest, second-longest |
| `enzymes` | 100% | **38%** | parallel clauses + six candidates, three served per draw |
| `evolution` | 100% | **42%** | same, with a digit-heavy statement of a different misconception |
| `photosynthesis` · `respiration` · `digestion` · `diffusion` · `biodiversity` · `breathing-gas` · `covalent-bonding` · `metallic-bonding` · `rates-reaction` · `light-optics` · `circle-geometry-adv` · `cybersecurity` · `nervous-system` · `immune-health` · `em-induction` | 89–99% | **37–47%** | parallel clauses, one misconception stated more fully than the key |
| `cells` | 95% | 63% | at the floor (below) |

**(c) THE FLOOR OF A FOUR-OPTION ITEM IS 50%, AND IT IS ARITHMETIC.** With one
key and three distractors, some strategy always wins: if the key is neither
longest nor shortest, `middles` scores 1/2; if it is an extreme, `longest` or
`shortest` scores 100% and `extremes` 50%. **No single fixed option set can score
below 50%**, and the only way under it is variation *across the items a concept
serves* — which is what `proof`'s three scenes and `r.shuffle` over more
candidates than options provide. This is why `cells` sits at 63% and is recorded
as such instead of being claimed as fixed, and why the bank-wide `middles` floor
rose from 8.46% to 14.14% with this pass: a middle-length key is where a repaired
item lands, and it is the better of the two choices available.

Held-out seeds (`--prefix=held-out:opt-bias`) reproduced every figure inside 0.05
points, so the movement is a property of the option sets and not of the 60 draws
the wording was chosen against.

## 5. The gate

`npm run gate:options` (in CI as the `Option-length gate` step, and in
`npm run production-check`) measures every concept on the production serve,
scores the eight strategies, and:

- asserts absolutely that each concept whose repair HELD at the served level stays
  under its ceiling (`REPAIRED` — `ai-basics` ≤ 45% plus the twenty concepts of
  §4b, each at measured + 0.04);
- holds EVERY other concept at its recorded floor in
  `audit/option-bias-baseline.json`, so the frontier cannot widen unnoticed;
- holds the bank-wide figure for each of the eight strategies separately;
- prints the concepts still above the 35% reporting line, with the strategy that
  beats them, as a named backlog.

Moving the floor is a deliberate act (`--write-baseline`) and shows up as a git
diff. The pre-change measurement is preserved in `audit/option-bias.json`; the
post-change and held-out runs are `audit/option-bias-after.json` and
`audit/option-bias-heldout.json`.

The gate caught a real regression on its first run: a standard-form rewrite of
`newton-laws` collapsed two options into one at some draws (the engines sweep
failed with "only 3 options at seed 69"). Cause: `sci()` rendered both a
non-finite value and a genuine zero as `0.000 × 10⁰`, and a balanced-forces table
made the answer and every slip collapse onto zero. Fixed in `sci()` (a
non-finite input is now unmistakably not a value) and in the family's draws (a
sledge that genuinely accelerates). An exhaustive enumeration of the family's
parameter space — **972,405 draws** — now finds **0** that cannot fill four
distinct options, and 84 (0.009%) with a zero-valued distractor.

## 6. Quality of the rewritten items

- `npm run verify:q` — 135 generators × 300 draws, **0 problems, 135 clean**; the
  mathematics of every generated item is re-derived from its own prompt, and no
  concept lost variety. This is the check that the answer key still answers the
  question.
- `npm run verify` — the engines suite (2,867 assertions) asserts every family
  produces four distinct non-empty options, a difficulty inside the claimed band,
  and only misconception tags its own concept declares.
- `npm run gate:ceiling` — **246 assertions, 0 failures**, 80/80 advanced
  tier×subject rows still reach their declared level: the content ceiling did not
  move.
- `npm run content-check` — PASS, with the gap queue still exactly the eight known
  primary-arithmetic concepts.
- **Substantive review** of representative served items from the rewritten areas
  (newton-laws, statistics-data, pressure-fluids, growth-decay, cybersecurity,
  covalent-bonding, rates-reaction, hormones, ai-basics, what-is-code): each has
  exactly one defensible answer, distractors that are real misconceptions rather
  than filler, and an explanation that supports the key. One cosmetic trade-off is
  recorded: a fixed-width standard form renders `2.6` as `2.600 × 10⁰`, which is
  correct and uniform but unusual for a student to read.

## 7. What remains (the named backlog)

Measured by `npm run gate:options` on the served@0.75 surface (60 draws each, 40
attempts — the call `app/api/progress/route.ts` makes): **64 of 135 concepts are
still above the 35% reporting line**, and **21 are repaired and asserted
absolutely** at their served level. Bank-wide, the best of the eight strategies
is **25.23%** against a 25% chance line, so no single strategy beats chance
across the bank; what remains is per concept.

This section replaces an earlier figure of **82 of 135**. That number was true
when it was written and is kept here only as a record of direction: most of the
concepts it named as backlog — `cells`, `digestion`, `diffusion`, `biodiversity`,
`breathing-gas`, `covalent-bonding`, `metallic-bonding`, `cybersecurity`,
`light-optics`, `circle-geometry-adv`, `photosynthesis`, `rates-reaction`,
`nervous-system`, `respiration` — have since been repaired and are now asserted
absolutely, `cells` the worst of them at 63.3% against a 67% ceiling. A report
that still lists them as outstanding overstates the fault and misleads the next
author about where the work is.

The current queue, with the cue that beats each concept. The gate prints the worst
25; the count is what `audit/options-gate.json` stores (`offenders`), so the
per-concept rows below are the command's own output rather than a figure kept
anywhere by hand:

`indices-intro` 100.0% (magnitude) · `trig-rule` 100.0% (digits) ·
`volume` 98.3% (magnitude) · `functions-code` 95.0% (magnitude) ·
`iteration` 92.5% (digits) · `complexity` 92.1% (digits) ·
`fraction-ops` 91.7% (magnitude) · `thermal-physics` 91.7% (shortest) ·
`vectors` 91.7% (digits) · `sound-acoustics` 88.8% (digits) ·
`gravity-fields` 88.3% (digits) · `energy-changes` 86.7% (shortest) ·
`circulation` 85.8% (longest) · `acids-bases` 83.9% (shortest) ·
`analysis-tests` 83.8% (longest) · `hormones` 82.5% (digits) ·
`microscopy` 82.5% (middles) · `ionic-bonding` 81.3% (digits) ·
`astrophysics` 80.0% (longest) · `equations-stoich` 79.4% (shortest) ·
`energy-conservation` 78.3% (shortest) · `surds` 76.9% (shortest) ·
`periodic-table` 76.7% (longest) · `logic-maths` 73.3% (digits) ·
`data-charts` 71.7% (magnitude)

Two of those the gate records as **rewritten but not fixed**, and they are the
clearest illustration of the cue-substitution trap: `gravity-fields` reads 88.3%
on the digit strategy because its served field-strength key is the only option
containing a number, and `hormones` reads 82.5% the same way because its served
feedback-sequence key is the only option quoting the set point. The length repair
worked, and handed the cue to a different strategy — which is why §4 insists on
checking all eight.

Two distinct workstreams are visible in that list and should not be confused:

1. **Phrase items** (the original fault) — a per-family authoring job in
   `lib/questions-deep.ts` and `lib/questions.ts`.
2. **Numeric items** — a digit/magnitude cue. The distractors must live in the
   answer's own magnitude class, which for a numeric family means writing slips
   that are structurally like the key (a place-value slip, a decimal-place slip,
   the same value with the wrong unit) rather than looser misconceptions that
   print at a different width.

**The rule for the next change, learned the hard way:** measure at the SERVED
level (never at family level), check all eight strategies (never the one you were
fixing), and take the before/after on HELD-OUT seeds. A repair that satisfies only
the first of those three looks like progress and is not.
