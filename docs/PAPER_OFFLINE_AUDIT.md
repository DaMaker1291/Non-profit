# Paper and offline assessment audit

**Audit date:** 13 November 2026  
**Sources:** `audit/lesson-catalogue.json`, `audit/assessment-format-matrix.json`,
`lib/lessons/authored/`, `lib/lesson-print.ts`, `components/print-sheet.tsx`,
`app/api/offline-pack/route.ts`, `lib/offline-pack.ts`, `lib/offline-assessment.ts`,
`scripts/verify-print-browser.mjs`, `scripts/verify-offline-assessment-browser.mjs`,
`scripts/verify-offline-browser.mjs`, `scripts/verify-local-content.mjs`.

This document audits what the 135 authored lessons put on paper and what a
downloaded lesson can assess. It does **not** claim a printer, scanner or
physical classroom was used.

---

## 1. The authored bank

| Measure | Value |
|---|---:|
| Concepts in the catalogue | 135 |
| Authored lessons | 135 |
| Outlines remaining | 0 |
| Machine-checked | 135 |
| Educator-reviewed | 0 |
| Learner-tested | 0 |
| Assessment items | **451** |
| Maths / Physics / Chemistry / Biology / Computing | 67 / 18 / 16 / 16 / 18 |

Every authored lesson declares `declaredStatus: "draft"`. None has a
qualified-teacher review, so no lesson is reported as approved.

The assessment-format **appropriateness** matrix is separate from the item
count: 84 of 135 lessons carry every format recommended by their own content;
51 have at least one recommended-format gap. That is a review queue, not a
target. See `audit/assessment-format-matrix.md`.

---

## 2. Paper forms the print system represents

| Form | Authored items | Pupil sheet | Teacher key |
|---|---:|---|---|
| Short answer | 272 | Prompt, marks, ruled answer lines | Model answer, marking criteria |
| Constructed response | 148 | Prompt, marks, longer answer area | Model answer, marking criteria |
| Code tracing | 18 | Starter code, test names, trace table | Expected stdout per test, marking criteria |
| Structured / multi-part | **6** | Each part, marks, working lines, optional table/grid | Per-part answer, method, marks |
| Gap fill | 1 | Template with numbered gaps, word bank, labels | Accepted answers per gap |
| Matching | 2 | Two columns with an answer-letter column | Correct pairings |
| Ordering | 1 | Items with an order box | Correct order |
| Diagram recognition | 2 | Drawing, numbered targets, shuffled label bank | Label → target position |

451 items total. All eight authored assessment `kind` values have at least one
authored example. Keyed formats have a separate key; 148 constructed responses
and 18 short answers without a deterministic key are self-marked. Two of the
constructed-response items are explicit practical-planning tasks (`rates-reaction/a4`, `energy-changes/a4`), so
the paper route exercises planning prose as well as explanation prose.

### Structured-response sub-forms

The print model supports `number`, `short`, `algebra`, `table`, `graph`, `plot`
and `read-off` parts. The bank now contains:

| Response form | Authored parts |
|---|---:|
| number | 6 |
| graph | 2 |
| read-off | 3 |
| plot | **1** |
| table | **1** |

The two gaps named in the previous audit are closed with real content, not a
fixture:

- **`data-charts/a4`** prints a table of travel counts (`Walk 10`, `Bus 20`,
  `Car 10`) with three blank angle cells, plus a follow-up asking what the
  angles must total. The pupil sheet prints the table; the key holds the three
  angles and the 360° check.
- **`motion-graphs/a5`** asks the learner to plot the four points
  `(0, 4)`, `(2, 8)`, `(4, 12)`, `(6, 16)`, join them with a straight line and
  read the velocity at 5 s. The pupil sheet prints a blank grid; the key holds
  the plotted points and the follow-through reading.

`scatter-correlation/a7` remains the genuine graph + read-off item (two points
on `y = −3x + 40`, then a reading at `x = 4`). It was previously answered in
Chrome through the lesson page, with one ledger event carrying `3/3`.

### What paper cannot do

- Code can be traced or written on paper, but its tests cannot be executed.
- Diagram recognition is label matching, not freehand drawing assessment.
- A practical investigation can be planned on paper; carrying it out and
  observing it cannot.
- No item is marked automatically. Teacher-entered marks carry
  `provenance: "teacher"`, the lesson version, rubric, observation flag and
  teacher identity.

---

## 3. Print rendering evidence

`scripts/verify-print-browser.mjs` uses Chrome's real print-to-PDF path. It does
not claim physical printing. Latest run: **101 passed, 0 failed**, including the
authored practical-planning page (`chemistry/rates-reaction`) and a visual check
that its prompt and ruled work stay on one page.

| Document | Pages | PDF bytes |
|---|---:|---:|
| `/print/maths/fractions` | 8 | 232,407 |
| `/print/maths/quadratics` | 7 | 205,021 |
| `/print/maths/algebra-expressions` | 8 | 207,598 |
| `/print/maths/data-charts` (table) | 10 | 248,997 |
| `/print/physics/motion-graphs` (plot) | 10 | 237,508 |
| `/print/biology/photosynthesis` | 9 | 267,875 |
| `/print/chemistry/acids-bases` | 8 | 246,674 |
| `/print/chemistry/rates-reaction` (practical) | 11 | 243,995 |
| `/print/physics/electricity-circuits` | 10 | 254,440 |
| `/print/computing/what-is-code` | 9 | 247,829 |
| `/print/maths/scatter-correlation` | 15 | 329,121 |
| `/print/maths/all` | 539 | 5,616,850 |
| `/print/maths/fractions/key` (teacher) | 3 | 131,164 |
| `/print/maths/fractions/guide` (teacher, default) | 6 | 252,574 |
| `/print/maths/fractions/guide?context=large-class` (teacher) | 6 | 252,307 |

Checks: every document produced a PDF; the print layout did not overflow
sideways; answer spaces exist; no pupil sheet contained “Model answer” or
“Teacher answer”; the key route rendered a separate key with model answers.
A third route, `/print/[subject]/[concept]/guide`, is generated from the same
authored lesson and prints the teacher's run sheet without assessment model
answers. Chrome rendered both the default and large-class guides as 6-page A4
PDFs; the run-of-show and four-group tables had zero horizontal overflow, kept
their headings, and avoided row splits. The pages were inspected as images.

**Visual inspection.** The table and plot pages were rendered to PNG and read.
The table keeps its three category columns and both rows on one page. The plot
prompt, grid and read-off instructions stay together. The first inspection
found the plot prompt at the foot of one page and its grid at the top of the
next; `.print-item-head { break-after: avoid }` and
`.print-part { break-inside: avoid }` now keep them together, and the re-rendered
PDF was inspected again.

**Not checked:** physical printing, ink, paper size handling by a real printer,
photocopy legibility, double-sided pagination, colour-vision legibility on
paper, or scanning/marking a physical stack.

### International print — not claimed

The print routes currently produce **English** sheets. Two complete machine
translations exist (`place-value` in Spanish and French), but neither is
human-reviewed, and the print route has no language parameter.

Therefore:

- Bengali, Hindi, Arabic, Urdu, Persian, Spanish and French print editions are
  **not** claimed.
- RTL pagination, Arabic/Urdu/Persian shaping, Bengali/Hindi conjuncts,
  translated diagram labels, translated tables and translated teacher keys have
  **not** been rendered or reviewed.
- A machine translation is not a reviewed teaching text. Printing one as a
  school edition would overstate what exists.

This is an external content blocker: it needs a complete, human-reviewed
translation for each lesson and language before the print system can be tested
honestly. The interface already has 15 languages; interface translation is not
lesson translation.

---

## 4. Offline assessment

The offline pack contains:

- the authored lesson's objective, intuition, explanation blocks,
  misconceptions, traps and worked examples;
- **deterministic authored assessment items** that a device can mark with the
  same rule as the online path: gap-fill, matching, ordering, diagram
  labelling, structured graph/plot/read-off/table/number parts, and keyed
  short-answer items;
- three generated multiple-choice practice questions;
- rights, review state and language disclosure.

It excludes prose constructed-response and code items. A device cannot mark
extended prose without human judgement, and it cannot execute code without a
runner; pretending otherwise would be a second, weaker marking rule.

### Same rulebook, not a second one

`lib/offline-assessment.ts` calls the existing pure graders
(`gradeAuthoredAssessment`, `gradeStructuredAssessment`,
`gradeLessonInteraction`). Local marking therefore preserves partial credit,
alternate accepted answers, units, per-criterion feedback, diagram/matching/
ordering positions and structured method marks. The pack carries the keyed
items because it is learner-scoped and removed on hand-back; it is not a public
mirror or a teacher-key route.

`scripts/offline-assessment-check.mjs`: **551 passed, 0 failed**. It proves the
pack selection excludes prose and code, gap-fill/matching/short-answer/
structured items mark correctly, partial credit is preserved, and the event
created for sync carries the lesson/item id, score and device provenance.

### Offline behaviour tested

`scripts/verify-offline-assessment-browser.mjs`: **22 passed, 0 failed** on a
production build. It proves:

- a downloaded photosynthesis lesson carries the authored gap-fill (`a3`) and
  matching (`a4`) items;
- after a browser restart with the network off, both render and mark locally
  (5/5 each) and say they are local-only;
- answers persist in the scoped draft and queue once, not lost;
- after reconnect, exactly two scored events reach the ledger, each labelled
  `device`, and the learner record projects 10/10 marks plus mastery;
- prose and code are absent from the offline assessment.

`scripts/verify-offline-browser.mjs`: **45 passed, 0 failed** for the adjacent
shared-device contract: learner A's pack and unsynchronised queue survive a
restart and a hand-back; learner B cannot see A's pack, answers or queue; A
returns and the held answer produces exactly one event; replay is a duplicate.

**Not supported offline:** extended prose, code execution, teacher judgement,
or a claim that the downloaded pack is the whole assessment.

---

## 5. School-local distribution

Implemented as a read-only content mirror, not a distributed system:

- `npm run content:bundle` writes `dist/openmind-content/` with 135 lesson
  packs, an index, a README and a SHA-256 manifest (137 files).
- `npm run content:serve` serves that folder read-only over the LAN.
- It contains no accounts, learner records, evidence ledgers, teacher keys or
  database.
- It rejects writes (405), path traversal (404) and unknown files (404).
- A copied folder is **not** an authenticated package: the checksum detects
  damage, not provenance. The README says so.

`scripts/verify-local-content.mjs`: **30 passed, 0 failed**. It builds into a
scratch directory, verifies every byte count and SHA-256 from disk, checks that
no learner record/account/password/teacher-key file or field is present, starts
the server on loopback and exercises GET, HEAD, POST refusal, encoded traversal
and unknown-file handling.

**Not tested:** a real school LAN, a USB round-trip, two devices fetching at
once, an update while a lesson is in use, or a signed update channel. Versioned
replacement and checksums are present; teacher-controlled signed updates are
not.

---

## 6. Verdict

| Question | Answer |
|---|---|
| Can every authored lesson be printed? | Yes, with a separate key and a teacher run sheet. The key was PDF-inspected; the guide route was built, not PDF-inspected. |
| Are all eight authored paper forms represented? | Yes. |
| Are plot and table paper parts exercised by authored content? | **Yes — `motion-graphs/a5` and `data-charts/a4`, printed and inspected.** |
| Is the offline pack an assessment replacement? | No, but it now carries the deterministic authored formats a device can mark; prose and code remain on paper/teacher routes. |
| Is any paper mark automatic? | No. |
| Was anything physically printed? | No. |
| Is school-local distribution implemented? | A read-only, checksummed content mirror; not an authenticated server or learner-record store. |
| Is international/RTL print implemented? | No. Only unreviewed machine translations exist, and the print route is English. |
