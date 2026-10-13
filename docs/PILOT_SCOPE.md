# A pilot scope — decided, not started

Status: **DECIDED by the owner, NOT STARTED.** The course, the tier and the
learner group are chosen (below); no reviewer has been recruited, nobody has been
enrolled, and no measurement has been taken. The review pack that decision
produces is generated, not written: [REVIEW_PACK.md](REVIEW_PACK.md).

## The owner's decisions (October 2026)

| Question | Decision |
|---|---|
| Which pathway | **UK GCSE Mathematics**, both tiers — the most reviewable route: a published specification and reviewers who are easy to find |
| Which reviewer | **To be recruited.** The pack exists so that the first teacher who says yes can start in one sitting, with no setup and no repository to read |
| Which learners | **One Year 10 class, mixed tier** — a mixed class is why the pack draws every item at BOTH tier targets |
| Sign-off | The project owner |
| The ceiling baseline's stale floors | **Left as they are.** A floor below reality still catches a regression, and the absolute checks on reached tiers are live |

What that decision changes for the reviewer: 11 concepts and 110 items, computed
from the prerequisite graph, every item at a seed they can reproduce. What it
does not change: nothing about the mapping has been reviewed, and this page still
proposes rather than measures.

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
| Course | **UK GCSE Mathematics, Foundation AND Higher** (19 national routes exist, and `npm run curriculum-gate` asserts the picker offers every one of them; this route has a full grade ladder and two tiers) | A single declared course drives all six layers, so the pilot measures one coherent thing. A mixed-tier class sits both tiers, so the pack draws items at both targets. |
| Concepts | **11**, chosen from the genome's own prerequisite graph rather than by taste — see below | Small enough for a teacher to read every item; large enough for a before/after. |
| Items | Every item a student meets in those concepts, **reviewed by a teacher before use** | Review is the layer that does not exist; this is how it comes into existence. |
| Duration | 3–4 weeks, two sessions a week | Long enough to include a delayed retention check. |
| Size | One class, one teacher | A pilot that finds problems is doing its job; a large one cannot be read. |

## The cluster, measured (not hand-picked)

Computed from `lib/genome.ts` plus `coverageOf({ spec: uk-gcse, level })` for both
tiers — the numbers are what the data says today, and the command that
reproduces them is `npm run pilot-pack` (it writes [REVIEW_PACK.md](REVIEW_PACK.md),
the pack a reviewer reads, and `npm run pilot-pack -- --check` fails in CI when
the pack stops describing the bank):

```
C · quadratics / surd strand      completing-square surds + every prerequisite they need
  concepts            11   (stages 0-3)
  in GCSE Higher       9   · NOT in it: order-ops, negatives (stage-0 arithmetic,
                            served as prerequisites rather than as course content)
  prompt-derived       2   (completing-square, surds) — already re-derived from the prompt
  misconception set   10/11 · WITHOUT: coordinates
  to review            9 concepts of items, and one missing misconception
```

Why this one: it contains two of the five concepts whose answers are already
independently verified, its prerequisites are all real edges in the graph (no
invented ordering), 9 of 11 sit inside the course a teacher would recognise, and
the review burden is 9 concepts rather than 135. A teacher can read every item a
student meets in this strand in one sitting.

The alternative — all five verified concepts and their prerequisites — is 16
concepts and 3 subjects' worth of context for one reviewer; the strand above is
the same evidence with a smaller surface.

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

## The review checklist a teacher uses

Per concept, at 12–20 draws covering every family the generator can serve:

1. **Is the key correct?** Work the item independently and compare with the key.
2. **Is exactly one option defensible?** Two options that are the same answer in
   different clothes is the defect class this bank has actually shipped once.
3. **Does each distractor probe a real misconception** rather than being filler —
   and is the named misconception the one that option would actually reveal?
4. **Does the explanation arrive at the key**, state why the key is right, and
   name what the wrong options represent?
5. **Is the difficulty honest for the year group** it will be served to?
6. **Is the reading level and vocabulary right** for that year, in the language
   taught (the curriculum's own terminology, not the genome's English)?
7. **Is the figure correct**, where there is one?

A concept is `humanReviewed` only when every item type in it has been read. The
records live in [audit/item-reviews.json](../audit/item-reviews.json) and
`npm run verify:q` copies them into `audit/verification-coverage.json`, so the
coverage figure has exactly one source. A claim without a reviewer and a date
**fails the audit** — verified by planting one: `review claim without a reviewer
or a date` and `review names a concept the bank does not generate`, exit 1.

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

## What the owner still has to decide

1. **Who the reviewer is.** The pack is ready; the person is not. The ask is one
   sitting: read every item below, answer the seven questions, record it against
   the concept with a name and a date.
2. **Whether the review workflow is built first** (my recommendation: yes — the
   record already works (`audit/item-reviews.json`, validated by `verify:q`), and
   a review that leaves no trace changes no published figure).
3. **Who signs off on consent** for the class, before any learner is enrolled.
