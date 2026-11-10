# Assessment intelligence

OpenMind already had a question bank and a structured marking engine. This layer
is the bridge between **assessment design** and that engine: a provenance-tracked
blueprint that records what an assessment rewards, without importing the
school's questions. It compiles into the existing `StructuredItem` marker; it
does not introduce a second marking engine.

Three blueprints now exercise the contract against deliberately different
assessment styles:

| Blueprint | Subject / level | Source basis | Items | Marks | Misconceptions |
| --- | --- | --- | ---: | ---: | ---: |
| Diet and digestion | Biology, Year 9 | Teacher-provided pack and image mark schemes; permission unknown | 7 | 23 | 7 |
| Energy transfer and efficiency | Physics, GCSE | Public AQA 8463 specification | 7 | 20 | 4 |
| Tables and data | Mathematics, lower secondary | OpenMind-authored | 3 | 9 | 1 |

The biology blueprint is marked largely by explanation; the physics blueprint is
built around equations, units, practical measurement and context evaluation. The
mathematics blueprint tests a third response format: a table in which every
blank cell is worth one mark and every mark is independently attributable. It
adds no second marker; it compiles into the same structured marking path.

All three remain design prototypes, not validated examinations. None has been
reviewed by a subject teacher or attempted by a learner.

## The rule that matters

> A school's questions and mark schemes are evidence about **how to design and
> mark**, not material to copy.

The biology source files were used for command words and question archetypes,
the number of independent marking points a part was worth, the difference
between a labelled structure and a linked explanation, the mix of practical,
data, recall, comparison and extended items, and the wrong ideas a mark scheme
is trying to separate.

They were **not** used for copying a prompt, table, diagram, option or
mark-scheme sentence; claiming the school's marking is an awarding-body
standard; claiming permission to republish; or claiming teacher or learner
validation.

The physics source is a public specification. It was used to place the unit and
read its assessment style. No specification sentence, examination question or
mark scheme is stored or reproduced. `sourceTextReproduced: 0` is a record of
what this layer did, not proof that every item is original in the copyright
sense; that still needs human and legal review.

## Source policy in the record

`lib/assessment-blueprints/diet-digestion.ts` records four sources, each with a
SHA-256 fingerprint and:

```ts
permission: "unknown"
allowedUse: "pattern-extraction-only"
reproduction: "none"
containsSourceText: false
studentDataObserved: false
```

`lib/assessment-blueprints/physics-energy.ts` records one public specification
with `permission: "public"`, the same pattern-extraction-only use and the same
no-reproduction flags.

The checker refuses an unknown-permission source marked for licensed
reproduction, any stored source text, any observed student data, any item that
claims source-text reproduction, a mark total that disagrees with its criteria,
a named misconception the item does not diagnose, a claim of teacher review
without a valid record, and any attempt to serve an unreviewed blueprint.
Permission is never assumed.

The blueprints contain labels and hashes, not the source files or a path to a
student record.

## From blueprint to a served item

`lib/assessment-serving.ts#compileAssessmentItem` compiles one blueprint item
into the existing `StructuredItem` shape. `gradeStructuredParts` in
`lib/structured-items.ts` remains the only deterministic marker.

| Blueprint response kind | What is marked | What is returned |
| --- | --- | --- |
| `numeric` | A method mark and an answer mark, with a numeric key and an optional unit requirement | Per-criterion marks, the marked value and tolerance, and the item's named misconception |
| `short-answer` | Recall criteria, ≤ 2 marks, against authored acceptable forms | Per-criterion marks; an acceptable alternative earns its mark; a missing required unit loses the answer mark |
| `extended-response` | The authored rubric, criterion by criterion | Rubric text and advisory misconception flags only; **no machine score** |

The short-answer path uses `StructuredPart.answerId` to keep the blueprint
criterion's id traceable to the answer it marks. `containsPhrase` accepts the
authored forms without turning marking into a substring search: a criterion
earns its mark when one of its accepted forms is present as an answer, and the
alternatives are recorded in the blueprint, not inferred by the marker.

Prose items are deliberately rubric-only. `advisoryMisconceptions` can tell a
teacher which misconception an answer resembles, but an advisory flag never
awards a mark and never becomes a learner score. A machine score for free prose
would be a claim this layer cannot support.

## The review gate

An unreviewed blueprint must not silently become an approved assessment.

`reviewStatus` is a rung, not a boolean:

- `unreviewed` — designed, checked for internal consistency, not approved;
- `teacher-reviewed` — a named subject teacher has reviewed the exact blueprint
  version for a stated scope on a real, non-future date.

A review record must carry the reviewer's name, role, date, scope and the
blueprint version it covers. A record for an older version does not approve a
newer one. No script writes a review; `reviews: []` is the honest default.

`servedAssessmentItem` refuses every unreviewed blueprint.
`approvedAssessmentItems()` is intentionally empty: the approved set is derived
from genuine review records, and there are none. The audit reports both facts
separately — **0 reviewed items** and **0 servable items** — so a future pass
cannot confuse “the compiler works” with “a teacher approved this”.

## What the marking tests prove

`npm run assessment:marking` runs **61 assertions** across both blueprints. It
covers:

- a fully correct numeric answer earning method and answer marks;
- a partially correct answer keeping the method mark while losing the answer
  mark;
- an alternative accepted wording earning the same mark as the model wording;
- a missing unit losing only the answer mark where the criterion requires it;
- incorrect reasoning losing the criterion it fails, not the whole item;
- a misconception-specific response receiving the named misconception and no
  unearned marks;
- a prose response returning its rubric and advisory flags with no machine
  score;
- a short-answer item accepting its own model answer and its added alternatives;
- every unreviewed blueprint being refused by the serving gate;
- the approved set remaining empty while no genuine review exists.

`npm run assessment:self-test` plants **11 defects** and requires every one to be
refused, then checks that a genuine review record is accepted. The defects cover
provenance, mark arithmetic, undiagnosed misconceptions, source-text claims,
review-record validity and serving an unreviewed blueprint.

These tests prove the marking follows criteria. They do **not** prove the
criteria agree with an examiner or a teacher.

## Commands

```bash
npm run assessment:check       # validate both blueprints
npm run assessment:audit       # write audit/assessment-intelligence.{json,md}
npm run assessment:self-test   # plant 14 defects and require refusal
npm run assessment:marking     # 80 marking and serving assertions
```

`npm run verify` chains the blueprint check and the marking check after the
engine suite, so a provenance, marking or serving inconsistency fails the full
gate. The checks do not read the school archive; the archive is not a repository
dependency.

Generated review surface:

- `audit/assessment-intelligence.md`
- `audit/assessment-intelligence.json`

Current audit: **3 blueprints, 17 items, 52 marks, 6 sources, 12 misconceptions,
0 reviewed, 0 servable, 0 issues**.

## What this does not do

- It does not import the school's question bank.
- It does not serve any unreviewed item; the approved set is empty.
- It does not machine-mark free prose.
- It does not replace subject-teacher review.
- It does not establish permission to republish the biology source material.
- It does not prove the biology items are at the right difficulty or that a
  learner can use them without help.
- It does not map the Year 9 unit onto GCSE, A-level or another country's
  specification.
- It does not prove the OCR of the image-based mark schemes is exact.
- It does not validate the physics items against a physics teacher or an
  awarding body.

The next step is a genuine subject-teacher review of one exact blueprint version,
then a curriculum mapping for the qualification it is meant to serve. Only after
that should any item be served through the existing question, browser and marking
gates.

## Adding another blueprint

1. Establish the source's provenance and permission first. If permission is
   unclear, use pattern extraction only and record `permission: "unknown"`.
2. Hash each selected source and record it; do not add the source text.
3. Remove or redact student names, candidate numbers, marks linked to a person
   and private teacher comments.
4. Extract archetypes and marking conventions in your own words.
5. Write new items. Do not paraphrase a source question so closely that it
   remains the same question.
6. Give each item a response kind, independent marking points, acceptable
   alternatives, non-credit examples and a partial-credit rule.
7. Name the misconceptions the items can diagnose; do not tag a misconception
   the concept disowns.
8. Leave `reviews: []` and `reviewStatus: "unreviewed"` until a named teacher
   reviews the exact version.
9. Run `npm run assessment:self-test`, `npm run assessment:check` and
   `npm run assessment:marking`.
