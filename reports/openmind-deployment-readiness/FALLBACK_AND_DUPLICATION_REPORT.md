# Fallback and Duplication Report

## 1. The census

Measured by executing `lib/genome.ts` + `lib/lesson-plans.ts` (135 concepts), not by reading the documentation.

| Status | Count | Share | Subjects |
|---|---:|---:|---|
| **COMPLETE** — authored plan with objective, intuition, 4–6 idea paragraphs, traps, worked example, faded example, practice door | **15** | 11.1% | Maths only |
| **PARTIAL** | **0** | 0% | — |
| **FALLBACK** — learner receives the genome paragraph instead of a plan | **120** | 88.9% | Maths 52; Physics 18; Chemistry 16; Biology 16; Computing 18 |
| **MISSING** — no usable teaching text at all | **0** | 0% | — |
| **BROKEN** — content exists but does not render | **0 confirmed** | — | 120 fallback pages were not browser-walked, so "not confirmed broken" is not "verified working" |
| **UNVERIFIED** | **120** rendering | — | Shared components render, but the walk only covers the 15 plans |

The fallback paragraphs are concept-specific, not placeholder lorem. They are also **31–58 words**, median **46**. Examples:

- `place-value` (53 words): *"In the number 452, the digit 4 means 400, the 5 means 50 and the 2 means 2. Each step left multiplies a digit's value by ten…"*
- `photosynthesis` (58 words): *"6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ in chloroplasts. Limiting factors…"*
- `what-is-code` (61 words): *"Code is a set of unambiguous instructions…"*

That is enough to remind a learner who has already been taught. It is not enough to teach a learner who has never met the idea, which is the population OpenMind exists for.

## 2. What the learner actually receives when no plan exists

Resolved at `app/learn/[subject]/[concept]/page.tsx:826-841`:

```tsx
{plan ? (
  <>
    <p className="reading lesson-lead">{plan.idea[0]}</p>
    {plan.idea.slice(1).map(…)}
  </>
) : (
  <>
    <p className="reading lesson-lead">{head}</p>
    {rest && <p className="reading lesson-text">{rest}</p>}
  </>
)}
```

The fallback splits the genome paragraph at its first full stop into **two paragraphs**. Everything guarded by `plan &&` is then skipped:

- `plan.objective` — absent (`:760-763`)
- `plan.intuition` — absent (`:774-777`)
- the figure — absent
- the faded "we do" — absent (`{plan && <LessonWorkedExample … mode="guided">}`, `:912`). **The first worked example is not gated**: `<LessonWorkedExample conceptId={conceptId} />` at `:904` renders for every concept, so a fallback page does show one generated item behind "Show me how".
- the named traps — absent (`{plan && plan.traps.length > 0 && …}`, `:924`)
- the `usedFor` transfer note — absent
- the interactive model — absent (`:807`)

This is a **silent fallback by construction**, not an error state. The page looks complete: it has a heading, a paragraph, a Speak button, a practice door, misconceptions from the genome, and the tutor. A learner has no way to know the lesson they are reading was never authored. Nothing on screen says "this concept has no structured lesson".

That is the single most important finding in this audit.

## 3. Per-subject completeness

| Subject | Concepts | Authored plans | Fallback | Lesson figures | Interactive models | Questions sampled |
|---|---:|---:|---:|---:|---:|---:|
| Mathematics | 67 | 15 (22%) | 52 | 11 | 1 (`fractions`) | 2,680 |
| Physics | 18 | 0 | 18 | 0 | 0 | 720 |
| Chemistry | 16 | 0 | 16 | 0 | 0 | 640 |
| Biology | 16 | 0 | 16 | 0 | 0 | 640 |
| Computing | 18 | 0 | 18 | 0 | 0 | 720 |
| **Total** | **135** | **15** | **120** | **11** | **1** | **5,400** |

Every authored plan is in the reviewed pilot pathway (`audit/pilot-pack.json`, 15 concepts / 154 items), but "in the pilot pack" is not "educator-reviewed": every plan declares `review: "unreviewed"`, and the lesson page prints that to the learner.

## 4. Semantic duplication: measured, not asserted

Method: tokenise each lesson (objective, intuition, ideas, traps, `usedFor`), lower-case, strip punctuation, keep tokens longer than three characters, compute pairwise Jaccard similarity. This is a screening method; every pair above 0.20 was then read against the actual text.

**Authored plans (15):** 12 pairs above 0.20. Highest:

| Pair | Similarity | Judgement |
|---|---:|---|
| `fractions` / `fraction-ops` | 0.34 | **Legitimate.** Deliberately adjacent: one defines a fraction, the next operates on fractions. Shared vocabulary (`denominator`, `pieces`, `whole`) is the concept, not copied prose. |
| `quadratics` / `completing-square` | 0.30 | **Legitimate.** Completing the square is a method for a quadratic; the overlap is the object being taught. |
| `fractions` / `decimals` | 0.27 | **Legitimate.** The same quantity in two notations; both lessons explicitly reference the equivalence. |
| `indices-intro` / `algebra-expressions` | 0.24 | **Legitimate.** Shared algebraic vocabulary; different teaching objectives. |
| `algebra-expressions` / `algebra-expand` | 0.23 | **Legitimate.** Expansion is the next operation on an expression. |

**Fallback paragraphs (120):** 2 pairs above 0.20: `atoms-nucleus` / `atoms-elements` (0.24) and `proportion` / `proportional-graphs` (0.20). Both are genuinely adjacent concepts and the paragraphs differ in what they claim (structure vs. element identity; relationship vs. graph shape).

**Conclusion:** there is **no evidence of wholesale instructional duplication**. The problem is not that 120 lessons are copies of one another; it is that 120 lessons are one paragraph each. The shared page structure (heading, paragraph, Speak, practice) is legitimate shared pedagogy. The shared *absence* of teaching is the defect.

## 5. Duplication that would harm learning, if it existed

No pair met the harm threshold. Two weaker patterns are worth naming:

1. **Repeated example contexts across plans.** Chocolate bars and pizza appear in `fractions`, `fraction-ops` and `percentages`; bags and weights in `linear-equations`. This is deliberate concreteness, not duplication, but a South Asian localisation pass should replace or supplement them with locally familiar quantities (rice, water, bus fare, cricket overs) — see `SOUTH_ASIA_READINESS.md`.
2. **The fallback format is identical for all 120 concepts.** Every fallback page has the same two-paragraph shape. A learner moving from `cells` to `photosynthesis` to `atoms-elements` experiences the same rhythm with different facts. That is a template effect, not textual duplication; it still weakens the sense of a taught sequence.

## 6. What would count as "complete" after remediation

A concept should move out of FALLBACK only when the learner receives, at minimum:

- an action-first objective;
- a concrete intuition before terminology;
- 4–6 idea paragraphs that explain why, not only what;
- at least one worked example generated from the concept's own bank, solved in full;
- a faded second attempt;
- named traps with the reason each fails;
- a concept-specific figure when a picture materially helps (not decoration);
- practice and retrieval that follow the teaching.

The 15 plans already meet that bar. The other 120 need authors, not code.
