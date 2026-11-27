# Nine-model independent review programme

**Status: 0 of 9 reviewed. 0 reviewers approached by this repository.**
Every pack is marked `STATUS: NOT REVIEWED`, and no automated check can change
that. This programme exists so the first real review is a single, recorded act —
not a redesign.

The evidence classes are those of `NINE-MODEL-TEACHING-AUDIT.md`: **A** automated,
**B** a dated browser record, **C** independent subject review. This programme is
the route from B to C. It does not upgrade anything by itself.

## The nine, and the one thing each reviewer must judge

| # | Concept | Subject | Model | The review's central question |
|---|---|---|---|---|
| 1 | `place-value` | Maths | number-line | Does the tens-line make place value clearer than column headings, and is the < 1000 cap honest at this level? |
| 2 | `negatives` | Maths | number-line | Does the line settle "−5 < −2" without teaching "further from zero is always greater"? |
| 3 | `fractions` | Maths | fraction-line | Does fixing the whole at 1 help, or does it plant "a fraction is always less than 1"? |
| 4 | `fraction-ops` | Maths | fraction-ops | Is the common-denominator repair (`denom-add`) mathematically and pedagogically sound? |
| 5 | `decimals` | Maths | number-line | Does the shared line make 0.45 < 0.5 visible, and does its one-place limitation mislead? |
| 6 | `electricity-circuits` | Physics | circuit | With ideal cells and constant bulb resistance, is the current/brightness story (0.25 A → 0.50 A, 4× brightness) defensible, and when should conventional current be named? |
| 7 | `atoms-elements` | Chemistry | atom | Do particle counts identify the element without implying the Dalton model is the whole story? |
| 8 | `cells` | Biology | cell | Does "organelle function by failure" teach structure, and does the root-hair example avoid the plant-cell misconception? |
| 9 | `algorithms-search` | Computing | search | Is choosing linear vs binary by comparison count honest, including binary search's sorted precondition? |

Each pack already carries the objective, assumptions, `couldIntroduce` list and
browser evidence. The reviewer's job is to challenge those, not to re-run the
suite.

## What a reviewer receives

- The pack `pilot-readiness/educator-packs/<concept>.md`.
- The practical `EDUCATOR-REVIEW-KIT.md` (introduction, demo route, 45-minute
  session, per-model questions, known limitations).
- `EDUCATOR-FEEDBACK-FORM.md` for the structured response.
- `EDUCATOR-DEMO.md` and the one-command scratch demo (`npm run educator:demo`):
  a throwaway learner account and the nine `/learn/<subject>/<concept>` routes.
  Never the live store.
- The ready-to-send subject messages in `EDUCATOR-OUTREACH-MESSAGES.md`.
- This programme and the five core questions below.

One sitting is 45–60 minutes per model. A reviewer may return "not yet"; that is
recorded as a completed review, not a failure.

## The five core questions

1. Would you use this to teach the concept?
2. Is anything scientifically or mathematically misleading?
3. Would children understand the interaction?
4. What would you change before using it?
5. Could you teach with it using the resources available in your school?

Then, per model:

- Mark every `couldIntroduce` item *acceptable at this level*, *should be fixed*
  or *not an issue*.
- Name any misconception the model **actually** plants that the pack does not list.
- State whether the transfer/apply step assesses the objective or only recalls it.

## How a response is recorded

A response is real only when a named person with the relevant subject role has
read the pack and answered. It is written to `EDUCATOR-RESPONSES.json` (currently
`"responses": []`) with this shape:

```json
{
  "id": "resp_<timestamp>",
  "concept": "electricity-circuits",
  "packVersion": "<version printed in the pack>",
  "reviewer": { "name": "...", "role": "...", "subject": "physics" },
  "date": "YYYY-MM-DD",
  "decision": "use | use-with-changes | not-yet",
  "answers": { "use": "...", "misleading": "...", "interaction": "...", "changes": "...", "schoolResources": "..." },
  "couldIntroduce": [{ "item": "...", "verdict": "acceptable | fix | not-an-issue" }],
  "corrections": [{ "location": "lib/model-evidence.ts#...", "claim": "...", "correction": "...", "status": "open | applied" }],
  "evidence": "path to the signed pack or message id"
}
```

Rules:

- **The pack status changes only with a response.** Editing the pack's prose is
  not a review; a passing test is not a review.
- **A correction is applied to the content and the pack together**, and the
  response records both. The circuit evidence correction (D5 in the audit) is the
  model for this: the claim was re-derived from the equations, labelled as
  re-derived, not as re-observed.
- **Reviewer personal data is minimal**: name, role, subject, date. No pupil
  names, no school data beyond "resources available in your school" in prose.
- **No learner testing** under this programme. That needs
  `LEARNER-TESTING-PROTOCOL.md`, which is a draft and not approved.

## Outreach by subject

The message is in `EDUCATOR-REVIEW-OUTREACH.md`; these are the subject-specific
asks to add to it:

**Maths (five packs, splittable between two reviewers).** "Please judge the
number-line representation first: does it make the value visible, and does the
fixed 0–1 line in `fractions` teach a false generalisation? For `fraction-ops`,
is the common-denominator repair the one you would use?"

**Physics (`electricity-circuits`).** "The model uses ideal cells and a constant
bulb resistance. With one cell the current is 0.25 A; with two it is 0.50 A and
the brightness is four times. Is that the story you would want a Year 9/10 pupil
to meet, and at what point should conventional current be named?"

**Chemistry (`atoms-elements`).** "The model identifies an element from particle
counts. Does it leave a pupil with the Dalton indivisible-sphere picture as the
whole truth, and is the prior knowledge it assumes (the word atom, the nucleus)
correct for your scheme?"

**Biology (`cells`).** "The model teaches organelle function by what fails when
the organelle is absent, and uses a root hair cell with no chloroplasts. Does
that avoid the 'all plant cells have chloroplasts' misconception, and is the 2D
diagram honest about a 3D cell?"

**Computing (`algorithms-search`).** "The model asks pupils to choose linear or
binary by comparison count. Does it make binary search's sorted precondition
visible, and is the cost model the one you assess?"

## First sessions (prepared, none booked)

These are slots, not bookings. A row becomes a session only when a named reviewer
agrees to a date; it becomes a review only when the form and signed pack return.

| Subject | Models | Reviewer | Date | Status |
|---|---|---|---|---|
| Mathematics | `place-value`, `negatives`, `fractions`, `fraction-ops`, `decimals` | — | — | not booked |
| Physics | `electricity-circuits` | — | — | not booked |
| Chemistry | `atoms-elements` | — | — | not booked |
| Biology | `cells` | — | — | not booked |
| Computing | `algorithms-search` | — | — | not booked |

The 45-minute running order and the demo route are in `EDUCATOR-REVIEW-KIT.md`.
The demo is started with `npm run educator:demo`; it prints the scratch sign-in
and the nine direct lesson URLs. `--check` verifies all nine in headless Chrome
without touching the live store. No row above is booked by running it.

## Current state

| Pack | Status | Reviewer | Date | Decision |
|---|---|---|---|---|
| `place-value` | NOT REVIEWED | — | — | — |
| `negatives` | NOT REVIEWED | — | — | — |
| `fractions` | NOT REVIEWED | — | — | — |
| `fraction-ops` | NOT REVIEWED | — | — | — |
| `decimals` | NOT REVIEWED | — | — | — |
| `electricity-circuits` | NOT REVIEWED | — | — | — |
| `atoms-elements` | NOT REVIEWED | — | — | — |
| `cells` | NOT REVIEWED | — | — | — |
| `algorithms-search` | NOT REVIEWED | — | — | — |

**0 of 9.** No review is booked, declined or implied by this table.
