# Pilot protocol — does OpenMind teach, and at what cost?

This is the design for the only question a non-profit in this space should be
asked first: **does a learner learn more with OpenMind than without it, on a
measure the school already trusts?** Everything else — reach, retention,
funding — is downstream of that answer, and a product that cannot answer it is
a demonstration no matter how many checks pass.

It is written to be run in **one district, one term, one reviewed course**, at a
scale a small team can actually supervise. It is deliberately not a
randomised-controlled-trial protocol for a national deployment: the first study
should be cheap, honest and repeatable, and its job is to tell you whether a
larger one is worth commissioning.

---

## 1. The claim being tested

> Learners who use OpenMind for one course, for one term, score higher on an
> **independent past paper** of their own qualification than comparable learners
> who did not, and the difference is larger than what their school would have
> achieved with its usual materials.

Three things are load-bearing in that sentence:

- **independent past paper** — the outcome is not an OpenMind test. Using our
  own questions would measure our item bank, not learning.
- **their own qualification** — a GCSE paper for a GCSE cohort, a WASSCE paper
  for a WASSCE cohort. The measured outcome has to matter to the learner.
- **comparable learners** — the comparison group is not "nobody"; it is the
  teaching that would otherwise happen.

## 2. Design

**Pre-test / post-test, two groups, one term.**

| Element | Specification |
|---|---|
| Population | Learners in the final year of the qualification, in schools that already teach the course |
| Unit of randomisation | **Class**, not learner (learners in a class share a teacher; randomising individuals inside a class leaks treatment) |
| Arms | **(A)** usual teaching + OpenMind for the course · **(B)** usual teaching only |
| Duration | One term (10–12 weeks), with at least 15 recorded sessions in arm A |
| Pre-measure | A past paper from an earlier session, sat in the first fortnight, marked blind |
| Post-measure | A **different** past paper, sat in the final fortnight, marked blind to arm |
| Primary outcome | Post-test percentage of the paper's marks, adjusted for pre-test score |
| Secondary | Items correct in the course's concepts only; session count; dropout; device-sharing reality |

**Blinding.** Markers do not see the arm, the school's name or the learner's
name — papers are anonymised codes. The study lead holds the key until marks are
final. This is the cheapest protection against the most common failure in small
education trials: a marker who knows which papers are "ours".

**No exclusion by attendance.** Analyse by the arm a class was assigned to,
whatever its learners did. A per-protocol analysis ("only learners who did 15
sessions") answers a different and much easier question.

## 3. Sample size

Work backwards from the smallest effect worth telling a ministry about, not from
the number of learners you have.

- The design is a **cluster** design, so individuals inside a class are not
  independent observations. The number that matters is the number of **classes**.
- Assume an intra-class correlation of **0.15** (typical for achievement in
  low-resource settings; if it turns out higher, the study is underpowered and
  must say so).
- For a **0.25 standard-deviation** effect — roughly 3–5 marks on an 80-mark
  paper — a two-arm cluster design with 25 learners per class needs about
  **26 classes per arm**. At 40 learners per class it needs about **18**.

If 36–52 classes are impossible, do not shrink the target quietly: run the study
as a **pilot with a stated aim of measuring feasibility and variance**, report
the standard deviations you observe, and use them to size the real study. A
pilot that reports its own imprecision is useful; one that reports a
"significant" result from 8 classes is not.

## 4. What counts as the result

Pre-register these before recruitment, and publish them with the data:

1. **Primary:** the adjusted difference in post-test percentage between arms,
   with a 95% confidence interval. Report the interval, not only the p-value.
2. **The honest null.** If the interval includes zero, the result is *no
   detectable difference*, and that is the finding. It is publishable and it is
   more useful than a subgroup that happened to move.
3. **Dose:** the relationship between recorded sessions and post-test score
   *within* arm A. This is not causal and must not be reported as if it were —
   but a flat line there is a serious signal that the product is not the active
   ingredient.
4. **What we could not measure:** teacher quality, home study, device access,
   and how many learners actually kept a record. Say so in the report's own
   section, not in a footnote.

## 5. Threats, and what is done about each

| Threat | Response |
|---|---|
| **Teacher effect** — the enthusiast teacher drives the gain | Randomise classes, not teachers; report the teacher count per arm; do not let one teacher span both arms |
| **Contamination** — control learners use the app at home | Record which arm used which device; ask about it in the post-test questionnaire; report it |
| **Novelty** — the first fortnight is exciting | Length (a term) is the main defence; a third measurement after the novelty period, if affordable |
| **Teaching to the test** | The post-test paper is not in the app's bank, and the bank carries no official items; check the paper's session year against what the app serves |
| **Device sharing** — three handsets, forty learners | Report learners-per-device; use the product's own multi-learner device support; treat it as a finding, never as an excuse |
| **Data loss** — the store is ephemeral | The deployment must pass the restart drill before the first learner is enrolled. A study that loses its evidence proves nothing |
| **Consent and safeguarding** | See §7; no learner is enrolled without it |

## 6. Cost, measured on the same deployment

Alongside the learning result, publish the arithmetic that makes the answer
usable:

- **hosting cost per learner-year** = the monthly instance cost ÷ the number of
  active learners it actually served in the pilot (not a capacity estimate);
- **device assumption** = the phone the pilot really used, and whether it was
  shared;
- **content cost per reviewed lesson** = the authoring and review hours it took,
  so the cost of closing the remaining lessons is a number rather than a wish;
- **marginal cost of one more learner** — the figure that decides whether this
  can scale, and the one a ministry will ask for.

## 7. Ethics, consent and data

- **Consent** from the learner's responsible adult, and assent from the learner,
  in a language they read. The product's own ephemeral-store label is about
  hosting, not consent; both are needed.
- **Data minimisation**: the study needs marks and attendance, not home
  addresses. Records belong to the learner and can be erased through the
  product's erasure door; the study's analysis file is de-identified before it
  leaves the school.
- **Withdrawal** is possible at any time and removes the learner's record from
  the analysis file, not merely from the report.
- **A named responsible adult** at each school, and one ethics approval at the
  institution running the study. If a ministry requires its own, that comes
  first.

## 8. What would make this "revolutionary" rather than "promising"

One sentence, and it is the target the roadmap should be read against:

> **A learner with no textbook, no subject teacher and a $60 Android phone
> completes one reviewed course in the language they are taught in, sits their
> own board's paper, gains measurably on an independent past paper, and their
> record survives a restart and belongs to them — at a marginal cost near zero.**

Every clause of that sentence is measurable, and each one currently has a known
gap:

| Clause | Where it stands | What closes it |
|---|---|---|
| no textbook, no subject teacher | lesson plans teach a sequence; 15 of 135 concepts authored | author + subject-review the course that the pilot uses |
| **in the language they are taught in** | the mechanism exists (`lib/lesson-plans-intl.ts`); **one** lesson is translated (French, `fractions`) | bilingual maths teachers, per course, recorded in the same field |
| their own board's paper | 19 of 72 countries on a published shape, 53 of 67 blueprints cited | the boards of the pilot district, researched and cited |
| gains measurably | no study yet | this protocol |
| record survives a restart | the deployment refuses to pretend; the live demo is labelled ephemeral | a host with a real disk, then the restart drill |
| belongs to them | export and erasure exist | consent and retention practice in the pilot |
| marginal cost near zero | not yet measured | §6 |

## 9. Decision rule

Before recruitment, write down what result would stop the project. Suggested:
if the adjusted effect is below **0.10 standard deviations** with an interval
that excludes 0.25, the honest conclusion is that this version of the product,
as deployed in that district, is not the intervention — and the next term goes
into teaching quality and content review rather than into more users.

Write the stopping rule down because it is the one part of a pilot that nobody
wants to write after seeing the data.
