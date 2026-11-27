# Learner-testing protocol — DRAFT, not approved, not started

> **STATUS: DRAFT. No learner has been tested. No ethics approval exists. This
> document is a proposal for a school or organisation to amend and approve before
> anything in it happens.** Nothing in this repository can record a learner test, and
> `npm run coverage` reports `learnerTested: 0` for that reason.

The purpose of a first test is narrow: **does the interactive model do the job the
research says it should** — make a belief refutable, in the learner's own hands,
without introducing a new one. It is not a trial of OpenMind, not a measurement of
attainment, and not a comparison with another product.

## What is being tested

One model at a time, with its frame: objective, prediction, interaction, limits.

| Pilot | Concept | Model |
|---|---|---|
| Maths | fractions | `fraction-line-model` |
| Maths | fraction-ops | `fraction-ops-model` |
| Science | electricity-circuits | `circuit-model` |
| Science | atoms-elements | `atom-model` |
| Science | cells | `cell-model` |
| Computing | algorithms-search | `search-model` |

## Who takes part

- **Six to ten learners per model**, in two groups of three to five, so a session can
  be run and observed at the same time.
- Age band matched to the model's stated level (`lib/model-assumptions.ts`).
- **Under-16s: written guardian consent, plus the learner's own assent** on the day.
  A learner may stop at any point, and stopping is not recorded as a failure.
- The teacher who normally teaches the class is present. **Nobody from the project
  observes a child alone.**

## What happens in a session (25 minutes)

1. **2 min** — the teacher states the objective from the model frame and nothing else.
2. **3 min** — every learner writes their prediction on paper, before touching a
   device. This is the measurement: a prediction is the belief, written down where it
   cannot be revised after the fact.
3. **8 min** — learners use the model in pairs. The observer writes only what is
   said and done, in shorthand, no names on the sheet.
4. **5 min** — the teacher asks the "what do you look for" question from the educator
   pack and collects two answers.
5. **5 min** — learners answer one transfer item on paper, unseen before.
6. **2 min** — the teacher asks: *"What did the model make you think that you did not
   think before?"* — and writes the answer down verbatim.

## What is recorded (data minimisation)

Recorded, per learner, with a code and no name:

- the written prediction before use (verbatim);
- whether the transfer item was answered correctly, and the reasoning given;
- one sentence the learner volunteered, verbatim, if they offered one;
- the teacher's judgement: would you use this tomorrow; what would you change.

**Not recorded:** names, email addresses, school identifiers, attainment data, any
account, any device identifier, any audio or video of a child, any biometric data.
The session runs on a device with `OPENMIND_DATA_DIR` pointing at a scratch
directory, and the scratch directory is deleted at the end of the session. Nothing
is written to a learner record in any deployment.

## What would count as evidence — and what would not

Counts as evidence:

- the prediction changes between the two groups, or within a group after teaching;
- a learner rejects the wrong answer **with a reason**, in their own words;
- a teacher says they would use it, and names one change they need first.

Does **not** count:

- learners saying they liked it;
- a correct answer with no reasoning (it may be the button pattern);
- one session with six learners generalising to a class, a school or a curriculum;
- anything observed by the project rather than by the teacher.

If the result is bad, the dossier records it. **A model that fails the test is
withdrawn from the lesson**, not re-described.

## Before the first session

- [ ] The school or organisation has its own ethics/consent process and has approved
      this protocol, amended as they require.
- [ ] Guardian consent forms collected; learner assent forms ready.
- [ ] The educator pack for the model has been reviewed by a subject teacher
      (currently **none has been** — `pilot-readiness/educator-packs/` says so on
      every pack).
- [ ] Scratch data directory prepared and its deletion tested.
- [ ] Paper materials printed from the pack's "with no device" section, so the
      session can run without a screen.
- [ ] A named person is responsible for storing and destroying the paper record, and
      a date is set for destruction.

## After the session

The papers are transcribed into the concept's dossier in
`lib/learning-research.ts` as an observation, or kept separately if the school
prefers. Either way: the coverage register's `learnerTested` field is changed by a
person editing code, not by a form, and the educator packs are regenerated so no
pack describes a version that was never tested.
