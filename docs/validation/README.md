# External educational validation — the package and its rules

This folder exists because OpenMind's central claim is educational, and no
amount of engineering can substantiate it. Nothing here has been reviewed by a
teacher. `audit/external-reviews.json` holds an empty `reviews` array, and
`npm run validation:status` prints five tiers, four of which are zero.

## What is in the package

| File | What it is for |
|---|---|
| `REVIEW_PACK.md` | One curriculum, one coherent sequence: source, objectives, mappings, materials, items, keys, misconceptions, uncertainties. This is what a reviewer reads. |
| `REVIEW_FORM.md` | The form the reviewer fills in. Every question is answerable as "no" and every "no" is a finding, not a failure of the review. |
| `PILOT_PROTOCOL.md` | The classroom pilot: what is measured, by whom, with what consent, and what it cannot show. |
| `../audit/external-reviews.json` | The registry of reviewers and their feedback. Empty until a real person completes a review. |
| `../audit/teacher-readiness.md` | The derived matrix of what each of the 135 lessons actually contains. |

## The rules this folder is written under

1. **A review is counted only when a qualified person completed it.** A record
   needs a name, a role, an organisation, a date and a scope. `validation:status`
   fails if a count exceeds the number of records, so an inflated claim breaks
   the build rather than the trust.
2. **Structural validity is not educational validity.** `verify:q` proves that
   40,500 generated items parse, have one correct answer and four distractors.
   It proves nothing about whether the mathematics is worth teaching.
3. **Prompt-derived is not reviewed.** Five concepts have answers computed from
   the prompt at check time; 130 are checked structurally only. Neither tier is
   a human judgement.
4. **Generated teaching sequences are labelled generated.** 112 of the 135 plans
   are composed from the genome paragraph; 23 are hand-authored. A reviewer
   should be told which one they are reading.
5. **No claim of impact.** Nothing here measures learning. The pilot protocol
   below is designed to make a future impact study possible, not to stand in for
   one.

## What a reviewer is being asked to judge

Not whether the code is good, and not whether the app is pleasant. Three
questions, in this order:

1. Is the mathematics (or science) **correct**, including every distractor and
   every stated misconception?
2. Is the **sequence** teachable in the time and conditions the class actually
   has — one shared phone or a handful of devices, a large class, no printer?
3. Is the **marking guidance** something a teacher could apply without having
   written the item?

A "no" to any of these is the useful outcome. The pack is small on purpose: one
curriculum, one sequence, so a review can be completed in an evening.
