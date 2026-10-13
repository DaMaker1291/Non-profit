# A pilot scope, proposed (needs an owner's decision)

Status: **PROPOSED — not started, not authorised.** Nobody has reviewed content,
no learner has been enrolled, and no measurement has been taken. This page exists
so that the first real evaluation is bounded, reviewable and honest about what it
can prove. Everything here is a decision for the project owner; nothing here has
been executed.

## Why a pilot rather than more verification

The automated side now has a measured boundary: 5 of 135 concepts have their
answer re-derived from the prompt, 130 are structurally checked only, and 0 have
been read by a qualified person
([VERIFICATION_COVERAGE.md](VERIFICATION_COVERAGE.md)). More checks would widen
what the software can see. They cannot answer whether a student learns, which is
the only question that decides whether any of it matters.

## Scope: one pathway, chosen for what it can be reviewed

| Decision | Proposed | Why |
|---|---|---|
| Subject | **Maths** | The concepts with independent verification (fractions, surds, completing-square, mixture-problems, circle-area-arc) are maths, so the reviewed set and the verified set overlap. |
| Course | **UK GCSE Higher** (18 national routes exist; this one has a full grade ladder and a tier) | A single declared course drives all six layers, so the pilot measures one coherent thing. |
| Concepts | **8–12**, drawn from the verified five plus their immediate prerequisites | Small enough for a teacher to read every item; large enough for a before/after. |
| Items | Every item a student meets in those concepts, **reviewed by a teacher before use** | Review is the layer that does not exist; this is how it comes into existence. |
| Duration | 3–4 weeks, two sessions a week | Long enough to include a delayed retention check. |
| Size | One class, one teacher | A pilot that finds problems is doing its job; a large one cannot be read. |

## The three measurements, and what each needs

1. **Initial competence** — the diagnostic already produces a per-concept
   baseline server-side before any teaching (`learnSession` baseline), so this
   needs no new instrument; it needs the sitting to be supervised.
2. **Transfer** — after the pilot, unfamiliar questions on the same concepts. The
   engine can serve transfer items (`generateQuestionAt` at a higher target) and
   records them as `mode: "independent"`, which is the evidence the learner model
   is otherwise starved of.
3. **Retention** — the same concepts after a delay. This is the one that cannot be
   faked by a session, and the reason the pilot runs weeks rather than hours.

Teacher feedback is a fourth measurement and it is qualitative on purpose:
whether the recommendations are useful, whether the explanations are trustworthy,
and where a student was confused by the product rather than by the mathematics.

## What exists to support it, and what does not

Exists: per-learner evidence ledgers (append-only, replayable), a reconciliation
that rebuilds the model from the ledger, class rosters that read the ledger
rather than a self-report, an aggregate impact report that excludes learners with
no baseline instead of counting them as unchanged, personal papers for boards
whose papers we may not host, and an offline pack for a class with no internet.

Does not exist: a **review workflow** (marking an item as teacher-reviewed, with
a name and a date, and having the ledger record it), a **consent and permission
flow**, and any **outcome instrument** beyond the product's own questions. Those
three are prerequisites, and they are small compared with what is already built.

## Privacy and honesty rails

- Learner data stays in the local store; the pilot adds no collection beyond what
  the product already keeps per learner.
- The impact report is aggregate by construction (`containsIndividualData:
  false`) and is the only thing that leaves the class.
- Reviewers see items and outcomes, not names.
- **A pilot that improves scores proves the pilot**, not the platform: no result
  from one class in one subject is reported as evidence that OpenMind works for
  every student, and the write-up must state the size, the duration and what was
  not measured.

## What the owner has to decide

1. Which country/board the pilot uses, and whether a teacher is available.
2. Whether the review workflow is built first (my recommendation: yes, it is
   cheap, and without it the review leaves no trace).
3. Who signs off on consent for the class.
