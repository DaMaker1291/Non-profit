# Educator review kit

**Status: 0 of 9 reviewed. No reviewer has been contacted by this repository.**
This kit is what a subject teacher receives. It wraps the nine packs in
`educator-packs/`; it does not replace them, and it changes no status. The
demo access — the one command, the scratch account and the nine direct routes —
is in `EDUCATOR-DEMO.md`.

## A short introduction to OpenMind

OpenMind is a secondary-school learning prototype: 135 concepts across maths,
physics, chemistry, biology and computing, each with an authored lesson, a short
prediction, a worked example and practice. Nine concepts have an interactive
model (a number line, a fraction line, a circuit, an atom, a cell, a search
visualisation). The lessons are written, not generated at review time; the
practice items are generated from a bank and checked structurally.

What is **not** true yet, and should be said at the start:

- No teacher has approved any lesson. Every pack says **NOT REVIEWED**.
- No learner has been tested. There is no learning-effectiveness claim.
- The models are simplifications with declared assumptions; the pack lists them.
- The research register records what was actually inspected, at what depth.
  Transcripts and quizzes are labelled as such; no video was watched for the
  three science lessons, and no worksheet or slide deck was obtained.

The reviewer's job is to challenge the subject accuracy and classroom fit first,
and the interface second. A "not yet" is a useful result.

## What the reviewer needs

- The pack for the concept (`educator-packs/<concept>.md`).
- A **scratch demo learner account** on a throwaway store, started by
  `npm run educator:demo` — the owner provides the printed email and password.
  No real learner record is opened. `EDUCATOR-DEMO.md` has the full procedure.
- `EDUCATOR-FEEDBACK-FORM.md`.
- 45–60 minutes and a modern browser.

## The nine models

| Concept | Subject | Interaction | Objective (abridged) |
|---|---|---|---|
| `place-value` | Maths | number line | say what each digit is worth and what one-place moves do |
| `negatives` | Maths | number line | compare below zero and say which way travel goes |
| `fractions` | Maths | fraction line | read a fraction as position and explain 1/8 < 1/4 |
| `fraction-ops` | Maths | fraction operations | find a common denominator and say why bottoms are not added |
| `decimals` | Maths | number line | order decimals by place value, not by length |
| `electricity-circuits` | Physics | circuit | predict current when cells/bulbs change and explain with V = IR |
| `atoms-elements` | Chemistry | atom | identify an element from particle counts and say what n and e⁻ change |
| `cells` | Biology | cell | explain organelle function by what fails, and why a root hair has no chloroplasts |
| `algorithms-search` | Computing | search | choose linear or binary by comparison count, not slogan |

## The demo

The owner starts an isolated instance from the repository:

```bash
npm run educator:demo
```

The runner prints the sign-in details and the nine lesson URLs. The subject is
part of the route: `/learn/<subject>/<concept>`, not `/lesson/<concept>`.
Sign in first at `/onboarding?mode=signin` with the printed scratch email and
password, then open the lesson. The scratch store is in the operating system's
temp directory, and the live learner store is fingerprinted before and after.

The reviewer should:

1. Read the lesson's objective, intuition and idea.
2. Commit the prediction **before** touching the model; the controls stay locked
   until they do.
3. Change one control, read the result, and try the "show me how" step.
4. Try one wrong answer deliberately and read the feedback.
5. Note what a pupil would misunderstand, not just what is wrong.

If the reviewer is remote, the owner can share the screen; do not expose the
development server to the public internet. The demo account is a **learner**
account, deliberately. It can use the lesson and write evidence to the scratch
store, but it cannot submit the in-app review form, because that form records a
signed-in teacher's identity. The canonical review is the signed pack and this
programme's feedback form, not a demo click.

## The in-app review contract

`/lesson-review/<concept>` is public and prints the six criteria, the current
version and content hash, and whether a human review is on record. A reviewer
may read it to see exactly what an approval would have to answer. The form on
that page accepts only a signed-in teacher account; the demo learner account is
not one, so it cannot create a record that looks like an approval.

## A 45-minute session

| Minutes | Activity |
|---:|---|
| 0–5 | Introductions; what OpenMind is and is not; consent to record the review |
| 5–15 | Reviewer reads the lesson and pack objective/assumptions |
| 15–30 | Reviewer uses the model: prediction, one change, one wrong answer |
| 30–40 | Discussion: subject accuracy, level, interaction, classroom fit |
| 40–45 | Complete the feedback form; agree what happens next |

Remote sessions use the same structure; the owner shares the screen only if the
reviewer cannot open the demo.

## Specific questions per model

Use the two or three that apply; the form has all five core questions.

- **`place-value`:** Does the tens line beat column headings? Is the < 1000 cap
  honest for your pupils?
- **`negatives`:** Does the line settle −5 < −2 without teaching "further from
  zero is always greater"?
- **`fractions`:** Does fixing the whole at 1 help, or plant "a fraction is
  always less than 1"?
- **`fraction-ops`:** Is the common-denominator repair the one you would use?
- **`decimals`:** Does the shared line make 0.45 < 0.5 visible, and does its
  one-place limitation mislead?
- **`electricity-circuits`:** With ideal cells and constant bulb resistance, is
  0.25 A → 0.50 A and 4× brightness the story you want? When should conventional
  current be named?
- **`atoms-elements`:** Does particle counting leave Dalton's sphere as the whole
  truth? Is the assumed prior knowledge right for your scheme?
- **`cells`:** Does "organelle function by failure" teach structure? Is the 2D
  diagram honest about a 3D cell? Does the root hair avoid "all plant cells have
  chloroplasts"?
- **`algorithms-search`:** Is comparison count the right cost model? Does binary
  search's sorted precondition stay visible?

## Known limitations to state, not hide

- No screen-reader pass has been completed; Chromium only; Firefox/Safari lesson
  passes are zero. The feedback form asks the reviewer to record keyboard, zoom
  and optional screen-reader observations, but those are observations, not an
  accessibility certification.
- The circuit model's corrected two-cell reading was **re-derived**, not
  re-observed in a browser; the pack says so.
- The science lessons' research is transcript- and quiz-depth; the videos were
  not watched and the slides/worksheets were not obtained.
- The models are series-only / generic-2D / integer-line simplifications; each
  pack lists what it cannot show.
- No learner testing, no efficacy claim, no approved course.

## Returning the review

The reviewer returns the completed `EDUCATOR-FEEDBACK-FORM.md` and the signed
pack. The owner records it in `EDUCATOR-RESPONSES.json`; only then does a pack's
status change. A correction is applied to the lesson content and the pack
together, and the response records both. **Nothing is marked reviewed on the
strength of a demo, a test suite or an internal read.**
