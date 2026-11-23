# Classroom pilot protocol

This is a protocol for a **real** pilot. Nothing in this repository has been
tested with a real class. What exists is a simulation harness
(`npm run pilot:check`, 617 assertions) that proves the app's own arithmetic and
storage behave; it is not evidence about children, and no report may call it
that.

## What the pilot is for

One question, answerable in a few weeks with one class:

> When a teacher places pupils on a working rung and the app serves at that
> rung, does the work pupils receive match the work the teacher intended?

That is an implementation-fidelity question. It is deliberately not "does
OpenMind improve learning": that needs a comparison group, a longer period and
an ethics process this project does not have.

## Design

- **One class, one teacher, one subject, four to six weeks.** A single class is
  enough to detect whether the placement reaches the pupil; it is not enough to
  detect a learning effect, and the report must say so.
- **Two conditions inside the class, not two classes.** Half the pupils are
  placed by the teacher and served at their rung; the other half are placed but
  served at grade level. Assignment alternates by register order, decided before
  the first lesson. This avoids comparing two teachers or two intakes.
- **The teacher is blind to nothing.** They know which pupils are capped,
  because they must be able to override. The pupils are not told.
- **No pupil is denied material they need.** If the uncapped half is visibly
  struggling, the teacher may cap them; that switch is logged as a protocol
  deviation and those pupils leave the comparison.

## Measures

| Measure | Source | What it shows |
|---|---|---|
| Fidelity: share of served items at or below the pupil's rung | server log of `/api/next` and practice serves | whether the placement is actually enforced |
| Teacher judgement: "was this the right level?" (3-point, weekly) | one line per pupil per week | whether the rung was right, not only whether it was applied |
| Completion: items attempted and finished per session | app ledger | whether the work is doable in the time available |
| Offline continuity: sessions that started offline and synced | sync records | whether delivery survives the connectivity the class actually has |
| Paper continuity: sheets printed and returned | teacher count | whether the print route is usable in practice |
| Harm flags: items the teacher judged wrong or unfair | teacher note | content defects found in use |

Nothing here is a learning outcome, and the pilot must not report one. A
learning claim would need a validated instrument, a pre-registered comparison,
and consent from guardians — none of which this project has.

## Consent and data

- Guardian consent for any stored pupil work; a pupil who opts out uses the
  paper sheet and is still taught.
- No names in the pilot dataset. Pupil identifiers are the classroom handles the
  teacher already uses, held in the school's own data directory, never sent to
  the project.
- The pilot runs on a **separate data directory** (`OPENMIND_DATA_DIR`), never on
  a school's live data. The protocol must name the directory in the report.
- The teacher may withdraw the class and ask for deletion at any point; the
  record of the pilot is the report, not the pupil data.

## What counts as a result

- **Fidelity below 95%** is an engineering failure, not a finding about
  teaching, and is fixed before any educational interpretation.
- **Fidelity at or above 95% with teacher agreement below 70%** means the rungs
  are being applied and are wrong — a placement problem, not a delivery one.
- **Both high** licenses one sentence: "in this class, in this period, placement
  was delivered as intended and the teacher judged the level right." Nothing
  more.

## Report template

1. Class, subject, curriculum, weeks, number of pupils, devices available.
2. Data directory used and confirmation that no live learner data was touched.
3. Fidelity figure, with the number of serves it is computed from.
4. Teacher agreement figure, by week.
5. Deviations from the protocol, with reasons.
6. Content defects found, with item ids.
7. What this pilot cannot show.

---

_This protocol is a plan. It has not been run. `audit/external-reviews.json`
records zero reviews and zero pilots, and `npm run validation:status` will fail
any document that claims otherwise._
