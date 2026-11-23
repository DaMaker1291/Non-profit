# Low-resource and release acceptance matrix

**Status date:** 13 November 2026  
**Scope:** OpenMind's five delivery modes, printable lessons, paper assessment,
offline assessment, shared devices, teacher-key security, school-local
distribution and measured low-bandwidth limits.

This is an acceptance register, not a claim that a school has used the product.
It uses the states the final register uses:

- **IMPLEMENTED** — the route or code exists.
- **INTEGRATED** — it is called by the product, not left as a library.
- **AUTOMATED_VERIFIED** — a non-browser suite exercises it.
- **BROWSER_VERIFIED** — a real Chrome session completed the journey.
- **HUMAN_REVIEW_REQUIRED** — a teacher or learner must judge it.
- **EXTERNALLY_BLOCKED** — needs a printer, hardware, network or translated
  content that this environment does not have.
- **APPROVED** — a qualified person recorded approval. **None exists.**
- **RELEASE_READY** — the software gate is green; this is not educational
  approval.

No teacher review and no learner testing have been recorded.

---

## 1. Curriculum reconciliation

| Measure | Actual |
|---|---:|
| Concepts in `audit/lesson-catalogue.json` | 135 |
| Authored lessons | 135 |
| Outlines remaining | 0 |
| Machine-checked | 135 |
| Maths / Physics / Chemistry / Biology / Computing | 67 / 18 / 16 / 16 / 18 |
| Assessment items | **451** |
| Browser coverage recorded before this content pass | 135 |
| Educator-reviewed | 0 |
| Learner-tested | 0 |

The content revisions since the recorded 135-lesson browser walk have passed
the automated lesson gates and the representative browser journeys. They were
not each re-walked individually, so they are not counted as individually
re-browser-verified here.

“Authored and machine-checked” is not “educator-approved”.

---

## 2. Commands and results

| Check | Result | What it proves |
|---|---|---|
| `npm run typecheck` | pass | TypeScript |
| `npm run build` | pass | all print, presenter, paper, offline and local-content routes compile |
| `npm run verify` | **4,631 passed, 0 failed** | engine, lesson, interaction, multilingual, low-resource and offline authored assessment |
| `npm run verify:low-resource` | **2,744 passed, 0 failed** | 135 worksheets, keys and teacher guides with four temporary groups, presenter, all eight authored paper kinds, graph/plot/table/read-off forms, key separation, cache policy |
| `npm run verify:offline-assessment` | **551 passed, 0 failed** | deterministic authored offline selection and the online marking rule |
| `OPENMIND_BASE=… npm run verify:offline-assessment-browser` | **22 passed, 0 failed** | offline restart, local gap-fill/matching marking, persistence, one sync, provenance, mastery projection |
| `npm run verify:shared-device` | **45 passed, 0 failed** | two learners, one browser profile, offline hand-back, queue retention, no cross-access |
| `npm run verify:print` | **101 passed, 0 failed** | Chrome print-to-PDF for five subjects, authored table, plot and practical-planning pages, 539-page subject set, separate key, default and large-class teacher guides with run-of-show and group tables |
| `npm run verify:bandwidth` | pass | 54.1 KiB worksheet / 16,947 ms at 50 kbps + 300 ms; 16.1 KiB lesson / 549 ms at 500 kbps + 150 ms |
| `npm run verify:local-content` | **30 passed, 0 failed** | 135-lesson mirror, SHA-256 from disk, no accounts/keys, read-only HTTP, traversal refusal |
| `npm run verify:graph-lesson` | **12 passed, 0 failed** (prior run) | signed-in pupil answered `scatter-correlation/a7`, 3/3, one ledger event |
| `npm run verify:kiosk` | **105 passed, 0 failed** (prior run) | kiosk identity, PIN, rate limits, revocation, authority matrix |
| `npm run review:subject-pack` | **5 lessons across 5 subjects** | teacher review pack: explanations, worked examples, assessment, keys, misconceptions, mapping |
| `node scripts/assessment-format-matrix.mjs` | 135 lessons | 84 carry every recommended assessed format; 51 have a review-queue gap |

The kiosk and graph runs used isolated scratch stores. No live learner store
was mutated by this pass.

---

## 3. Curriculum and lesson quality

**AUTOMATED_VERIFIED.** 135/135 authored, zero outlines, all prerequisites
resolved, all five subjects present.

**HUMAN_REVIEW_REQUIRED.** 0 educator-reviewed, 0 learner-tested. The
representative review pack is `docs/SUBJECT_REVIEW_PACK.md`; the supervised
learner design is `docs/PILOT_PROTOCOL.md`.

**Not claimed:** that a machine-checked lesson is a good lesson. The review pack
exists so a qualified teacher can decide.

---

## 4. Assessment-format coverage

`audit/assessment-format-matrix.{json,md}` applies a narrow rule:

- multiple-choice retrieval, short answer and transfer are recommended for
  every lesson, and constructed response everywhere except Computing, whose
  contract does not permit that kind;
- numerical only where the lesson's worked examples or guided practice teach a
  calculation, not merely because the subject is quantitative;
- graph only where the lesson teaches a graph or names axes, and present when an
  assessment plots or reads one — including a prose item reading a named chart;
- code only in computing;
- practical only where an experiment is represented or the lesson explicitly
  asks the learner to plan or measure one;
- diagram only where a diagram is taught and labelling/structure is asked for,
  and only counted as present when an assessment asks for one;
- gap-fill, matching, ordering and extra structured forms are optional unless
  the lesson names a process, classification or sequence.

Result: **84/135 lessons have every recommended assessed format; 51 have at
least one recommended-format gap.** The audit no longer counts a teaching
figure as an assessment item. It also no longer demands a Computing
constructed-response item the contract forbids, or a numerical item from a
qualitative lesson. Nine authored items and those corrections moved the
complete count from 54 to 84. The priority queue is in the matrix; it is a
content-review queue, not a target, and no item was added merely to raise a
count.

Content additions in this pass were justified by their own lessons:

- `fractions` gained a short numerical check (`1/2 + 1/4`) because the lesson
  taught the operation but only asked for prose explanations.
- `motion-graphs` gained graph and plot/read-off items because its objective is
  reading a motion graph; it previously had only prose and a calculation.
- `data-charts` gained a table part because its objective is completing a table
  of pie angles, not only explaining one.
- `rates-reaction` and `energy-changes` gained practical-planning responses
  because both lessons already teach measurement and controlled variables; the
  items ask the learner to plan the measurement, not merely recall a fact.

The matrix still reports 30 lessons whose taught graph has no graph assessment,
19 with a taught diagram and no diagram item, and 12 with no practical item.
Those are genuine review gaps, not something this pass papered over.

---

## 5. End-to-end marking

**AUTOMATED_VERIFIED.** The shared graders preserve:

- per-criterion partial credit for gap-fill, matching, ordering and diagrams;
- alternative accepted answers and number/unit handling;
- structured method marks that survive a wrong answer;
- graph, plot, read-off and table parts;
- prose as rubric-only, never machine-marked;
- reviewed/unreviewed separation (nothing unreviewed is served);
- answer-to-criterion traceability in the mark result and evidence event.

`npm run verify` reports 4,631 assertions with 0 failures; the assessment
sub-suites include marking, blueprint, interaction and offline checks.

**HUMAN_REVIEW_REQUIRED:** whether an item is educationally valid, and whether
a mark scheme is applicable by a different teacher. Automated checks cannot
supply that judgement.

---

## 6. Offline assessment

**INTEGRATED + BROWSER_VERIFIED.** The pack now carries authored deterministic
formats: gap-fill, matching, ordering, diagram labelling, structured
graph/plot/read-off/table/number and keyed short answer. It excludes prose
constructed response and code because a device cannot mark them honestly
without human judgement or a runner.

Local marking calls the same pure graders as the online path. The offline pack
carries the keyed items because it is learner-scoped and cleared on hand-back;
it is not a public mirror or a teacher-key route.

Proven in Chrome (`22/0`): download, offline restart, local 5/5 gap-fill and
5/5 matching, criterion feedback, persistence, one queued event each, reconnect,
exactly two ledger events, device provenance, 10/10 projected marks and
mastery. The adjacent shared-device walk (`45/0`) proves the queue belongs to
the learner and survives hand-back without crossing to the next learner.

**Not supported:** extended prose, code execution, teacher judgement. The
printed worksheet remains the written route.

---

## 7. Paper assessment

**BROWSER_VERIFIED (print-to-PDF), NOT PHYSICALLY PRINTED.** All eight authored
forms render with a separate key. The bank now exercises every structured
response form:

| Form | Authored part |
|---|---|
| number | 6 |
| graph | 2 |
| read-off | 3 |
| plot | `motion-graphs/a5` |
| table | `data-charts/a4` |

The table and plot pages were rendered to PNG and visually inspected. The first
inspection found a plot prompt split from its grid by a page break; the CSS was
corrected and the re-rendered PDF inspected. Pupil sheets contain no model
answer or teacher-key text; the key is a separate authenticated route.

**Not tested:** physical printer, scanner, photocopy legibility, duplex,
colour-vision legibility on paper, or marking a real stack.

---

## 8. International print

**EXTERNALLY_BLOCKED / HUMAN_REVIEW_REQUIRED.**

- Only English print is produced.
- Two complete machine translations exist (`place-value` in Spanish and
  French); neither is human-reviewed.
- The print route has no language parameter.
- No Bengali, Hindi, Arabic, Urdu, Persian, Spanish or French paper edition has
  been rendered.
- RTL pagination, Arabic/Urdu/Persian shaping, Bengali/Hindi conjuncts,
  translated labels/tables and translated keys are unverified.

Interface translation is not lesson translation. No language support is
claimed.

---

## 9. Low-bandwidth performance

Measured with Chrome network emulation and the HTTP cache disabled
(`reports/low-bandwidth.json`):

| Route | Condition | Transfer when readable | Transfer when loaded | Time to readable |
|---|---|---:|---:|---:|
| Pupil worksheet `/print/maths/fractions` | 50 kbps, 300 ms | 56.1 KiB | did not settle inside 60 s | **16,892 ms** |
| Print index `/print` | 50 kbps, 300 ms | 0.3 KiB | 17.0 KiB | 2,300 ms |
| Interactive lesson `/learn/maths/fractions` | 500 kbps, 150 ms | 13.3 KiB | 13.3 KiB | **417 ms** |
| Home `/` | 500 kbps, 150 ms | 42.7 KiB | 42.7 KiB | **251 ms** |

**The browser's byte figures in this table are not a reliable measure of what a page
downloads, and the script now says so.** It used to snapshot `transferSize` the moment
`<main>` was on screen, so the numbers were a half-loaded page: the same route reported 5
resources on one run and 41 on the next, and `/print` reported 0.3 KiB. It now waits for
`readyState === "complete"` (bounded at 60 s) and prints both figures, labelled, which makes
the gap visible instead of hiding it. The trustworthy measurement is the one in the next
subsection.

The worksheet is 54.1 KiB in this measurement; it
remains within the 250 KiB and 20 s budgets with about 3 s of wall-clock
headroom. The page is text and inline SVG, needs no
video, live AI or continuous cloud access once loaded.

No smaller design was adopted: the six resources are the app shell and print
page; removing the print button would not remove the framework chunks, and
stripping the lesson body would compromise the worksheet. The measured saving
was not worth an incomplete sheet.

**Not tested:** real 2G/3G carrier, packet loss, school proxy, low storage,
memory/CPU on a low-cost Android, battery/thermal behaviour, or teacher-uploaded
images.

### What the first download is made of (production build)

Reproducible method: `npm run build`, `npm start`, then for each route read the HTML
generated by the server, take the exact `/_next/static/**.{js,css}` URLs it references, and
sum their `Content-Length` when fetched with `Accept-Encoding: gzip, br`. Same build, same
command, before and after each change — so the two columns are comparable.

| Route | Before | After | Largest single chunk |
|---|---:|---:|---|
| `/` (landing) | 1,012 KiB · 14 chunks | **802 KiB · 13 chunks** | 553 KiB |
| `/onboarding` | 806 KiB · 13 | 807 KiB · 13 | 553 KiB |
| `/curriculum` | 808 KiB · 13 | 808 KiB · 13 | 553 KiB |
| `/dashboard` | 1,026 KiB · 15 | 1,027 KiB · 15 | 553 KiB |
| `/learn/maths/fractions` | 2,092 KiB · 20 | 2,093 KiB · 20 | 780 KiB |

Two findings, one fixed and one open.

1. **Fixed — the landing page paid for the question bank.** `app/page.tsx` imported
   `@/lib/questions` (and `@/lib/question-bank`) to measure three figures it displays —
   concepts, subjects, courses — and that put a ~1.8 MB source module into the landing
   page's first download: **1,012 → 802 KiB compressed**, one whole chunk gone. The route is
   a server component now (`app/page.tsx`), it measures the numbers at render time, and the
   client half (`components/landing.tsx`) renders what it is given and imports neither the
   bank nor the genome. A source pin in `scripts/verify-engines.mjs` keeps both halves in
   that shape.
2. **Open — the authored-lesson corpus is in the shell.** A 553 KiB chunk (~1.79 MB source)
   of lesson prose is on *every* route, including sign-up. It is reached from the layout:
   `components/nav.tsx` → `lib/specifications.ts` → … → `lib/starter.ts` → `lib/hints.ts` →
   `lib/lesson-plans.ts` → `lib/lessons/authored/*`. `lib/hints.ts` and `lib/lesson-plans.ts`
   expose synchronous APIs, so removing it is an async-loading change across the practice
   route, not a flag: it needs its own pass, and the first useful learning experience
   (`/diagnostic` → practice) legitimately needs most of it. The nav's own contribution was
   removed (its search index is fetched when the box opens, and the bar shows no results box
   rather than an empty "nothing matched" while the index is in flight).

---

## 10. School-local distribution

**INTEGRATED + AUTOMATED_VERIFIED, NOT A REAL LAN TEST.**

- `npm run content:bundle` exports 135 lessons, an index, README and SHA-256
  manifest (137 files).
- `npm run content:serve` serves the folder read-only over the LAN.
- No accounts, learner records, evidence, teacher keys or database.
- Writes: 405; traversal: 404; unknown: 404; cache: `no-store`.
- `verify:local-content` rebuilds in a scratch directory and verifies every
  hash from disk, then exercises the HTTP contract.

**Not implemented:** signed/authenticated update packages, teacher-controlled
rollout, automatic client update or merge of learner work. “Versioned content
package” is a version string and checksums, not a signature. The README states
this limit.

**EXTERNALLY_BLOCKED:** real school LAN, USB round-trip, simultaneous devices
and update-while-in-use.

---

## 11. Five delivery modes

### Mode A — teacher-led, no student devices
IMPLEMENTED + BROWSER_VERIFIED print/presenter. `/teach` presents; `/print`
produces the pupil sheet; `/print/.../key` is separate; `/teacher/paper`
records teacher-entered marks. The presenter writes no learner evidence.

### Mode B — one device per group
IMPLEMENTED. Group task, roles, group paper marks (`observed: false`,
`groupId`), excluded from individual projection/replay/impact.

**HUMAN_REVIEW_REQUIRED:** a real group has not used it.

### Mode C — shared school computers
BROWSER_VERIFIED for two learners (`45/0`), kiosk identity tested separately
(`105/0`). **EXTERNALLY_BLOCKED:** a real managed school PC and OS-level
inspection by the next user.

### Mode D — individual low-cost devices
IMPLEMENTED + BROWSER_VERIFIED text-first lesson, inline SVG, no required
video, offline pack and print alternative. **EXTERNALLY_BLOCKED:** real
low-cost hardware, memory, battery, thermal and old-browser support.

### Mode E — connected individual learning
IMPLEMENTED. Full adaptive lesson, assessment, evidence ledger and decision
engine. Modes A–D do not depend on it; print/presenter/paper do not call an AI
API.

---

## 12. Acceptance scenarios

| # | Scenario | State | Remaining |
|---|---|---|---|
| A | Teacher computer with internet | BROWSER_VERIFIED print/key/presenter/paper | real classroom journey; teacher review |
| B | Teacher computer without internet | IMPLEMENTED saved PDFs/key, paper marking | hosted presenter/key offline; local unit download UI |
| C | One computer for a whole classroom | IMPLEMENTED + presenter opened | real projector/classroom |
| D | Shared computers, multiple students | BROWSER_VERIFIED 45/0 + kiosk 105/0 | real managed PC; OS inspection |
| E | One low-cost device per group | IMPLEMENTED | a real group |
| F | Individual low-cost device, slow internet | MEASURED 54.1 KiB / 17.0 s at 2G | real carrier, hardware, storage |
| G | Individual device, no internet after package | BROWSER_VERIFIED 22/0 authored assessment + 45/0 hand-back | real device; prose/code remain paper |
| H | Printed lesson and paper assessment | BROWSER_VERIFIED 101/0, table + plot + practical page and both teacher guides inspected | physical print/scan; teacher review; RTL print |

---

## 13. Paper evidence contract

Every teacher-entered mark carries:

```text
provenance: "teacher"
assessmentVersion: the printed lesson version (must match the authored lesson)
rubric: the criteria the teacher used
teacherAccountId / teacherName
enteredAt
observed: true | false
evidenceQuality: "high" | "medium" | "low"
groupId: required when observed is false
```

Rules enforced in code:

1. A mismatched `assessmentVersion` is refused with `409`.
2. A learner must be a member of the named class.
3. A question id must belong to the named lesson.
4. An unobserved entry requires a group id.
5. Unobserved entries are kept in the ledger but skipped by
   `projectLearner`, `replayModel` and individual impact counts.
6. Citation surfaces label the evidence as teacher-entered and say whether it
   was observed.

No paper was automatically marked.

---

## 14. Honest limits

OpenMind can give a school with no student devices and no internet:

- teacher plans and explanations;
- diagrams and worked examples;
- printable worksheets with answer spaces;
- a separate teacher key and marking guidance;
- paper assessment recorded later as teacher-entered evidence;
- a PDF set that needs no network in class.

It cannot give that school individual adaptive digital learning, automatic
marking of free response, or a classroom observation it did not have.

A school with one suitable computer can use the presenter and print surfaces.
The local content mirror is a read-only, checksummed folder a laptop can serve
on its own network; it is not an account server, not a learner-record store and
not an authenticated package.

No claim is made about physical printing, hardware that was not measured,
school networks that were not used, translated print that does not exist, or
learning outcomes without teacher review and learner testing.
