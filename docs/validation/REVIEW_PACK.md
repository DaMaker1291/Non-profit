# Review pack — one curriculum, one sequence

Prepared 23 November 2026. **No part of this pack has been reviewed by a
teacher.** `audit/external-reviews.json` is empty; `npm run validation:status`
shows four of five tiers at zero. This document is the material a reviewer
would need, not a record that anyone has read it.

## 1. The curriculum

| Field | Value | Where it is in the code |
|---|---|---|
| Country | United Kingdom (`GB`) | `lib/specifications.ts` |
| Board | AQA | `SPECIFICATIONS` entry `uk-gcse` |
| Qualification | GCSE | same |
| Subject | Mathematics | `coverage.maths = [0, 4]` |
| Tiers | Foundation (stages 0–3), Higher (stages 0–4) | `levels[]` on the same entry |

**What the mapping actually is.** OpenMind stores a *stage range and an
exclusion list* per tier, not AQA's objective codes. For `uk-gcse` mathematics
that is stages 0–4, with Foundation excluding eleven stage-3/4 concepts
(`completing-square`, `polynomials`, `binomial`, `logs`, `sim-equations-quad`,
`surds`, `circle-theorems`, `trig-rule`, `functions`, `algebraic-fractions`,
`bounds`). This means:

- We can say a concept is inside the tier's range and not excluded.
- We **cannot** quote the specification objective it serves. That is a real gap,
  and section 7 asks the reviewer to supply the objective code.

## 2. The sequence

Concept: **algebraic expansion** (`algebra-expand`), stage 2, mathematics. It
sits inside the Foundation and Higher ranges and is not excluded from either.
Teaching sequence provenance: **hand-authored** (the plan carries no
`supplemental` provenance, unlike the 112 generated plans).

Objectives, as authored:

1. Expand a single bracket by multiplying every term inside it, and explain why
   the term outside cannot be applied only to the first term.
2. Expand a pair of brackets by forming all four products, collect the cross
   terms, and show where the middle coefficient comes from.
3. Factorise a quadratic with a leading coefficient of 1 by finding two numbers
   that satisfy both the product and the sum conditions.
4. Recognise and use the difference of two squares, including a coefficient on
   the squared term.

Each objective carries a stated success criterion in `objectives[].evidence`, so
a reviewer can reject an objective whose evidence does not follow from it.

## 3. Concept mappings

| Authored objective | OpenMind concept | Stage | Inside the tier range? |
|---|---|---|---|
| 1. Expand a single bracket | `algebra-expand` | 2 | yes (Foundation 0–3, Higher 0–4) |
| 2. Expand a pair of brackets | `algebra-expand` | 2 | yes |
| 3. Factorise a monic quadratic | `algebra-expand` | 2 | yes |
| 4. Difference of two squares | `algebra-expand` | 2 | yes by range |

There is **one concept for four objectives**: the app's unit is the concept, so
factorising and the difference of two squares have no separate genome entry and
cannot be placed in a different tier from expansion. That is a structural fact a
reviewer must know, not a detail: it means a curriculum that teaches expanding
before factorising, or only in Higher, is not representable in the coverage map.

The exclusion list is a coverage shortcut, not a curriculum judgement, so
section 7 asks the reviewer whether the difference-of-two-squares objective
belongs in Foundation at all.

## 4. Teacher materials

| Material | Route | What it is |
|---|---|---|
| Right-level placement | `/teacher/right-level` | Oral check, six rungs, class list, per-pupil rung saved to the class |
| Paper placement sheet | `/print/right-level` | Pupil sheet, no answers |
| Paper placement key | `/print/right-level/key` | Teacher-gated marking copy |
| Lesson | `/lesson/algebra-expand` | Teacher-facing sequence, worked examples, misconceptions, guided practice |
| Class setup | `/teacher` | Class, curriculum, lesson focus, print pack |
| Assessment | `/api/next` + class practice | Six items per session, drawn from the concept's family |

All routes work offline after first load (service worker) and print without
JavaScript-dependent layout.

## 5. Pupil activities and assessment

- **Guided practice**: three items per objective with the first worked in full.
- **Independent practice**: six generated items, four options each, one correct.
- **Paper**: `/print/right-level` prints a six-item sheet for the class's rung;
  the key is a separate, teacher-gated route.

Item generation for this concept is deterministic per seed. A printed sheet and
its key are produced from the same seed, so the marking copy matches the sheet
item for item. Items are *not* reviewed: `verify:q` proves only that each item
has one correct answer and four distinct distractors.

## 6. Misconceptions

The lesson names three. The first, in full:

> **Belief.** (x + 3)(x + 2) expands to x² + 6 because the only product that
> matters is the two numbers.
>
> **Why it fails.** The two brackets contain four products, not one. Besides
> x·x and 3·2 there are the cross products x·2 and 3·x, which add to 5x.
> Dropping them changes the value: at x = 10 the brackets give 13 × 12 = 156,
> while x² + 6 gives 106. The missing 50 is exactly the two cross pieces.
>
> **Correction.** Write all four products before collecting anything.

The other two concern sign errors in the cross terms and treating
difference-of-two-squares as "no middle term because nothing is there". Each has
a `belief`, a `whyItFails` and a `correction`; none has been checked by a
teacher, and the second is the kind of claim a reviewer should test against what
their pupils actually do.

## 7. Content uncertainties — what the reviewer should settle

1. **Objective codes.** The pack cannot cite AQA's specification codes. Please
   supply the code(s) this sequence serves, or say that it serves none.
2. **Tier placement.** Is `difference-of-two-squares` (stage 3) Foundation
   material in your centre? The app currently allows it there.
3. **Sequence length.** Four objectives is one lesson at 60 minutes by the
   app's estimate; is that realistic in your setting?
4. **Language.** The lesson is authored in English; eight translations exist for
   the concept title and summary, and none has been reviewed by a native
   speaker. If you teach in another language, please say which text is wrong.
5. **Right-level placement in a large class.** The oral check is designed for
   five minutes with a whole class. Does it survive 60 pupils?
6. **Option cues.** An automated audit flags 63 of 135 concepts where the
   correct option can be identified from surface features (digit count, option
   length, position) more often than chance allows. The audit does not single
   out this concept, but that is not a clean bill: the reviewer should say if
   any item here is answerable without doing the mathematics. This is the defect
   class most likely to make a correct-looking mark meaningless.
7. **Marking.** The marking guidance is written, not teacher-tested. Could you
   mark thirty scripts from it without re-deriving answers?

## 8. What is deliberately absent

- No claim that this sequence improves learning.
- No claim that the curriculum mapping is complete or endorsed.
- No educator review, no classroom trial, no translated-material review.
- No AI-generated expansion of this pack: the four objectives and the three
  misconceptions are the authored ones, quoted rather than paraphrased.

Send the completed form (`REVIEW_FORM.md`) back; the record goes into
`audit/external-reviews.json` with your role, date and scope, and nothing is
counted as reviewed before then.
