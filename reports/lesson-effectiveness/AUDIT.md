# Lesson effectiveness audit — 19 November 2026

An audit of every lesson the product ships and of the evidence that it teaches.
"Effectiveness" is separated here into three questions that are not the same:
does the material exist and is it complete (inventory), does the rendered
experience hold up (browser evidence), and does anything show that a learner
learned (outcome evidence). The third has no data behind it at all, and this
document says so rather than inferring it from the first two.

## What counts as a lesson

| Layer | Source | Count |
|---|---|---|
| Authored lesson (the /learn reading, print pack, teacher guide) | `lib/lessons/authored/*.ts` | **135** — one per concept |
| Structured plan (objective → intuition → idea → traps → door) | `lib/lesson-plans.ts` + `lesson-plans-supplemental.ts` | **135** — 23 authored, 112 supplemental |
| Practice bank (the questions a lesson opens into) | `lib/questions*.ts`, `lib/numeric-items*.ts` | 135/135 concepts have a generator |
| Misconception catalogue and repairs | `lib/misconceptions.ts`, `lib/repair.ts` | 55 beliefs, 15 repairs |

By subject: maths 67, physics 18, computing 18, chemistry 16, biology 16.

## How it was measured

* The authored lessons, the plans, the genome and the repair table were compiled
  to a temp mirror with the repo's `typescript` and measured as data, so every
  number below comes from the modules the app actually imports.
* Six content gates were run: `explain:audit`, `content-check`, `gate:ceiling`,
  `gate:options`, `pilot:check`, `verify:lessons`.
* `verify:lesson` (the browser walk) was run against a production standalone
  build on a **scratch data directory**, at 1280×900, 320×640, 375 and 768.
* No learner-outcome data was used, because none exists: see §5.

## 1. Inventory: what a lesson contains

Authored lessons are structurally complete. Every one of the 135 has:

| Field | Coverage |
|---|---|
| objectives (statement + evidence) | 135/135 |
| prior-knowledge diagnostic checks | 135/135 |
| introduction (hook + why) | 135/135 |
| explanation sections | 135/135, 3–7 sections (61 have 3, 52 have 4) |
| representations (figure/table/block) | 135/135, 3–6 |
| worked examples | 135/135, 2–5 (median 2) |
| misconception teaching | 135/135, 2–3 each |
| guided practice | 135/135, 3 (129 lessons) |
| assessment items | 135/135, 2–7 (median 3) |
| transfer challenge | 135/135 |
| spaced retrieval | 135/135 |
| summary | 135/135 |
| accessibility alternative | 135/135 |
| provenance + author record | 135/135 |
| **reviews** | **0/135** |
| **learner testing** | **0/135** |

Explanation prose runs 354–1,788 words (median 533, p25 392, p75 905), so no
lesson is a stub.

Plans are thinner and more mixed: 269–960 teaching words (median 317), 4–13 idea
paragraphs, at least 3 traps each. Only 23 of the 135 are authored; the other
112 are composed from the concept's genome note plus a subject "lens". Of those
112, **104 reuse genome-note sentences verbatim as their idea paragraphs**.

## 2. The gates

| Gate | Result |
|---|---|
| `explain:audit` | PASS — no concept below its committed prose floor |
| `content-check` | PASS — 135/135 practisable, 8 practice gaps (work items), `extended_response` reachable for 0 concepts |
| `gate:ceiling` | PASS 516 / FAIL 0 |
| `gate:options` | PASS 34 / FAIL 0 |
| `pilot:check` | PASS |
| `verify:lessons` | **FAIL 1** — `digestion: has four assessment items` |
| `verify:lesson` (browser) | **PASS — 1,424 assertions, 0 failed** (first run stopped on a CDP timeout; clean retry, see §4) |

The one red lesson gate is not a thin lesson. `digestion` has **five**
assessment items and `scripts/biology-lesson-check.mjs:84` asserts
`length === 4`. Meanwhile `cells`, `enzymes` and `diffusion` have three items
each and that check never looks at them. The rule is both over-strict and
applied to one lesson out of sixteen.

## 3. What the teaching actually says

### 3.1 112 of 135 "what you will be able to do" lines are malformed

`lib/lesson-plans-supplemental.ts:261` builds the objective as

```ts
objective: `${c.title.toLowerCase()} in a problem, and explain why it works: ${c.blurb}`
```

and `app/learn/[subject]/[concept]/page.tsx:1014` prints that string under the
`plan.can` ("What you will be able to do") heading for **every** concept. What a
learner reads:

* addition: "addition in a problem, and explain why it works: Combining quantities into a total."
* enzymes: "enzymes in a problem, and explain why it works: Biological catalysts: specific, temperature- and pH-sensitive."
* variables: "variables & types in a problem, and explain why it works: Named boxes holding values: numbers, strings, booleans."

This is a template artefact — lowercased title, an ungrammatical clause, and the
genome blurb pasted after a colon. It is the first sentence of the lesson for
83% of the catalogue, and no gate reads it.

### 3.2 The feedback after an answer is often not prose

`explain:audit` measures the marking explanation a learner receives. The gate
passes because the committed terse ceiling applies to the **maths serve** (under
30%) and every concept only has to stay above its own floor. The measured
reality:

| Subject | Terse explanations | Worst concept |
|---|---|---|
| maths | 134 / 1,608 (8%) | 4 words |
| physics | 290 / 432 (**67%**) | 1 word |
| chemistry | 296 / 384 (**77%**) | 3 words |
| biology | 309 / 384 (**80%**) | 2 words |
| computing | 332 / 432 (**77%**) | 5 words |

113 of 135 concepts have at least one terse explanation. Examples of what a
learner is told after answering: "Rearrange F = ma: m = F ÷ a = 55 ÷ 6 =
9.17 kg." (3 words of prose), "mass = moles × Mr = 1.5 × 58.5 = 87.75 g." (3),
"The condition x > 3 is true because 8 > 3, so the first branch runs and prints
1." (12). These state the arithmetic but not what it means, which is the thing a
stuck learner needed. The maths layer was rewritten to 25 prose words and the
other four subjects were not.

### 3.3 Beliefs are taught but not chased

* Authored lessons teach **390** misconceptions (2–3 per lesson). The genome
  declares **67** concept-level links to a catalogue of **55** beliefs. The
  lessons' misconceptions are local (`m1`, `m2`, `m3`) with no link to the
  catalogue, so the diagnostic, the coaching paragraph and the repair engine
  cannot see 335 of the 390 beliefs the lesson itself names.
* Repairs exist for **15 of the 55** catalogue beliefs (27%). Forty beliefs a
  concept explicitly declares have no repair item at all, so the lesson can name
  a slip and the practice cannot produce the contrast that corrects it.

Of the plans' 410 traps, 113 (28%) are subject-level habits rather than
concept-specific ones ("Quotes a numerical answer without its unit"), spread
across 79 concepts. The first trap is always concept-specific, so the strongest
slot is well used; the pad is not.

## 4. The rendered experience

`verify:lesson` enrols a learner on a scratch store and walks the real pages.
On this run it passed **1,415 assertions, 0 failures**, including:

* "all 135 authored lessons paint their teaching (135/135)";
* every lesson fits 320, 375 and 768 px with no sideways scroll — including the
  lessons that deliberately carry no drawing;
* the read stage's order (objective → intuition → figure → idea → worked →
  we-do → traps → door), the fade being shorter than the whole working, a
  per-option note and its repair painting, the lesson reopening on the slip;
* the interface switching to Spanish and German and the coaching paragraph
  following it.

The first run stopped at the physics marking section with
`CDP Runtime.evaluate did not answer within 20s` after `pressure-fluids`. A
second, identical run **completed: 1,424 passed, 0 failed**, so that stop was a
harness flake, not a hang in the page — the physics, chemistry, biology and
computing "submit through the visible assessment" phases do pass, and the walk is
green on a clean retry.

## 5. Is any of it effective? No evidence either way

Nothing here measures learning. Concretely:

* **0 of 135 lessons have a review record.** Every lesson declares
  `declaredStatus: "draft"` and the page says so: "status: draft · no subject
  teacher has reviewed this version".
* **0 of 135 lessons have a learner-testing record.** No pre/post data, no
  completion data, no item-level outcome tied to a lesson.
* Every plan is `review: "unreviewed"`, including the 23 authored ones.
* There is no control or comparison surface: the same learner cannot be taught
  the same concept two ways and measured.

So the honest statement is: the lessons are **complete and render correctly**,
and their **learning effect is unmeasured**. A product that prints "draft" on
every lesson is being truthful; a product that called this "effective" would not
be.

Translation compounds it: `place-value` is the only concept with an authored
lesson in Spanish or French (one each), `fractions` is the only concept with a
translated plan (French), and no translation is marked `human-reviewed`. A
learner in any of the other 13 languages reads English teaching, and the page
tells them so — but the teaching itself is English.

## 6. Ranked findings

1. **The lesson objective is a broken template sentence for 112 of 135 concepts**
   and it is on screen. Fix the generator (`lesson-plans-supplemental.ts:261`)
   or, better, write a real objective per concept; add a gate that rejects a
   `plan.can` line containing `" in a problem, and explain why it works: "`.
2. **Marking feedback in physics, chemistry, biology and computing is terse in
   67–80% of draws** (maths: 8%). The ceiling gate is scoped to maths, so this
   cannot fail a release. Extend the 25-prose-word standard, subject by subject.
3. **No lesson has been reviewed or learner-tested.** Zero of 135 on both. Until
   at least a sample has a review record and a pre/post measurement, "effective"
   is a structural claim only.
4. **Repairs cover 15 of 55 beliefs**, and lesson misconceptions (390) are
   unlinked to the catalogue (55) — the coaching loop can see a sixth of what
   the teaching names.
5. **`verify:lessons` is red on an over-strict assertion** (`digestion` has 5
   assessment items, the check demands exactly 4), and the same rule is not
   applied to the three biology lessons that have 3.
6. **Two thirds of plans are not authored**: 112 supplemental plans, 104 of which
   paste genome-note sentences as their teaching.
7. **Translation exists for one concept** in either direction, and none of it is
   human-reviewed.
8. **`extended_response` is reachable for no concept**, and eight primary
   arithmetic concepts have an acknowledged practice gap.

## 7. What would make this answerable

* A review record with a named subject teacher per lesson (the contract already
  has the field; nothing writes to it).
* A learner-testing record: a matched pre/post attempt on a concept, per lesson,
  even at n=5, would turn "draft" into evidence.
* A feedback-length gate per subject, not just for maths.
* A repair for every belief a concept declares, or a declaration that a belief
  is taught-only.
* One machine check that the lesson's own objective line is a sentence.

## 8. Limits of this audit

* No learner-outcome data exists, so effectiveness is judged on structure and
  rendering only.
* The browser walk needed two runs: the first stopped on a 20-second CDP
  evaluate timeout at `pressure-fluids`, the second completed 1,424/0. One
  green run is not a flake-free harness.
* Gates were run once, on this working tree, with a scratch store; the
  `content-check` gap list names its eight concepts only in its own report.
* One browser on one OS (Chrome, macOS) — fonts and rendering on iOS/Android
  were not exercised.
* Reading quality is sampled, not exhaustive: the fractions, enzymes, addition,
  variables and acids-bases lessons were read in full; the rest were measured.
