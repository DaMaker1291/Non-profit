# OpenMind final quality register

**Register date:** 13 November 2026  
**Scope:** post-curriculum integration, assessment, offline/paper delivery,
low-resource performance, production release and human-validation readiness.

This is the authoritative summary of what is implemented, what has been
verified by a machine or a browser, and what still requires a person. It does
not replace the detailed evidence in `audit/subsystem-evidence.json`,
`docs/LOW_RESOURCE_ACCEPTANCE.md`, `docs/PAPER_OFFLINE_AUDIT.md` and the
generated reports.

**States used**

| State | Meaning |
|---|---|
| IMPLEMENTED | Route or code exists. |
| INTEGRATED | Called by the product, not only a library. |
| AUTOMATED_VERIFIED | A non-browser suite exercises it. |
| BROWSER_VERIFIED | A real Chrome session completed the journey. |
| HUMAN_REVIEW_REQUIRED | A teacher or learner must judge it. |
| EXTERNALLY_BLOCKED | Needs a printer, hardware, network, translation or people this environment does not have. |
| APPROVED | A qualified person recorded approval. **None exists.** |
| RELEASE_READY | The software release gate is green. **Not educational approval.** |

---

## 1. Overall result

**Software release:** `PRODUCTION CHECK: PASS` (34 recorded checks, 0 failed; database configuration is a stated skip).  
**Educational release:** **not approved** — 0 educator-reviewed lessons and
0 learner-tested lessons.  
**Physical print:** not performed.  
**Real school LAN / carrier / low-cost hardware:** not tested.

The software is technically ready for genuine school and learner validation.
It is not a claim that the teaching has been validated.

---

## 2. Requirement register

| # | Requirement | Highest state | Evidence | Remaining |
|---|---|---|---|---|
| 1 | Final curriculum reconciliation | **AUTOMATED_VERIFIED** | 135 concepts, 135 authored, 0 outlines; 67 maths / 18 physics / 16 chemistry / 16 biology / 18 computing; prerequisites resolved; reports agree | Content revisions after the recorded 135-lesson browser walk were exercised through the gates and representative browser journeys, not one-by-one; teacher review absent |
| 2 | Lesson quality | **AUTOMATED_VERIFIED** + **HUMAN_REVIEW_REQUIRED** | Every authored lesson meets the lesson contract; catalogue reports 135 machine-checked | 0 educator-reviewed, 0 learner-tested |
| 3 | Assessment-format appropriateness | **INTEGRATED / AUTOMATED_VERIFIED** | `audit/assessment-format-matrix.md`: 84/135 carry every recommended assessed format; 51 have a review-queue gap; optional formats are not compulsory. The audit counts assessment evidence, respects each subject's permitted kinds, and recommends a calculation only where one is taught | Content review of 51 lessons; graph (30) and diagram (19) are the largest gaps |
| 4 | Assessment items and marking | **BROWSER_VERIFIED** | 451 items; eight authored kinds; structured number/graph/read-off/plot/table; 4,631 engine assertions; 101 print assertions; 22 offline browser assertions; practical planning at `rates-reaction/a4` and `energy-changes/a4`; seven genuine debugging items in Computing; **267/451 server-marked**, with 148 constructed responses and 18 unkeyed short answers self-marked, and 18 code labs run only in the browser | Human validation of item wording, demand and mark schemes; code-lab results are practice feedback, not evidence |
| 4a | Adaptive learning | **AUTOMATED_VERIFIED (synthetic cohort, not learner-validated)** | `npm run reliability`: held-out mastery Brier **0.276** vs the learner's own-rate baseline **0.311**; the 0.65 threshold separates **65.3%** of answers it called established from **49.1%** of those it called not-yet (n=327). `npm run benchmark`: 43 learners, the plan names a documented weak concept **76.7%** of the time and **40.5%** of documented weak concepts. The benchmark reports **1** named adversarial capability gap and **4/8** Section G hint-reliance cells not held | The engine's decisions are measured on a seeded synthetic cohort, not learners. The benchmark reports one named adversarial capability gap and four of eight hint-reliance cells not held. Following the recommendation has **not** been shown to improve learning |
| 5 | End-to-end learner journey | **BROWSER_VERIFIED** | `verify:ui` 73/0; print, offline and graph journeys; UI walk covers enrolment, course, diagnostic, lesson, practice and paper | Every individual lesson/item not clicked; representative journeys only |
| 6 | Partial credit, alternatives, units, criteria | **AUTOMATED_VERIFIED** | Gap-fill, matching, ordering, diagram, structured method/answer, graph/plot/read-off/table; units; criterion traceability; prose rubric-only | None beyond human review |
| 7 | Reviewed/unreviewed separation | **AUTOMATED_VERIFIED** | Nothing unreviewed is served as reviewed; 0 reviewed items; assessment blueprints 0 servable | Human review must populate the reviewed record |
| 8 | Offline assessment | **BROWSER_VERIFIED** | 551 pure assertions; 22 browser assertions: authored gap-fill 5/5 + matching 5/5 after restart, local-only, queued once, two ledger events, 10/10 projected marks, mastery | Prose and code remain paper/teacher routes |
| 9 | Offline persistence / switching / sync | **BROWSER_VERIFIED** | 45 shared-device assertions: hand-back, queue retained, learner B cannot read A, restart, one event, duplicate refused | Real managed school PC and OS-level inspection |
| 10 | International print | **EXTERNALLY_BLOCKED / HUMAN_REVIEW_REQUIRED** | English print only; two complete machine translations (`place-value` es/fr), both unreviewed; no print language parameter | Reviewed translations for Bengali, Hindi, Arabic, Urdu, Persian, Spanish, French; RTL/shaping/pagination content |
| 11 | Paper assessment completeness | **BROWSER_VERIFIED** (PDF) / **EXTERNALLY_BLOCKED** (physical) | 101/0; all eight kinds; authored table (`data-charts/a4`), plot (`motion-graphs/a5`) and practical planning (`rates-reaction/a4`); 539-page set; separate key; table/plot/practical pages and both teacher guides visually inspected | Physical print/scan, photocopy, duplex, paper colour vision, RTL editions |
| 12 | Low-resource performance | **AUTOMATED_VERIFIED** (measured, not real carrier) | Worksheet 54.1 KiB / 16,947 ms at 50 kbps + 300 ms; lesson 16.1 KiB / 549 ms at 500 kbps; no video; budgets 250 KiB / 20 s | Real 2G/3G carrier, packet loss, proxy, low storage, low-cost hardware |
| 13 | School-local distribution | **INTEGRATED / AUTOMATED_VERIFIED** | 135 lessons, 137 files, SHA-256 verified from disk; 30/0 HTTP checks; read-only; no accounts/records/keys | Real LAN/USB; signed packages, teacher rollout, update merge |
| 14 | Production and release | **RELEASE_READY** | `PRODUCTION CHECK: PASS`: typecheck, 4,631 engine assertions, 2,744 low-resource assertions, 110 school-reality assertions, country-profile check, storage, q coverage, content release, local content, curriculum, paper shapes, option gate, content platform, structured marking, pilot pack, status, build, standalone start, assets, render, smoke, permissions, sync, AI status, dev start, e2e 892/0, UI 73/0, print 101/0, offline 22/0, bandwidth, generated-file restore | Database migration path is configured only with `DATABASE_URL`; deployment-specific secrets/origin/durability remain operator decisions |
| 15 | Educational validation | **HUMAN_REVIEW_REQUIRED** | Five-subject review pack (`docs/SUBJECT_REVIEW_PACK.md`); supervised pilot protocol (`docs/PILOT_PROTOCOL.md`) | Qualified teacher reviews and a supervised learner pilot; no data collected informally |
| 16 | Country reality research | **INITIAL_RESEARCH / AUTOMATED_VERIFIED INDEX** | 70 route profiles; 13 countries with sourced initial research; 57 explicitly `NOT_RESEARCHED`; every profile has 22 required sections; 8 synthetic school scenarios cover 7 archetypes across 1,080 lesson-scenario paths; `scripts/country-research.mjs --check` and `scripts/school-reality-check.mjs` in `npm run verify` | 57 routes unresearched; 0 `CURRICULUM_MAPPED`; 0 `HUMAN_REVIEWED`; 0 `SCHOOL_VALIDATED`; reviewed translations and school partners absent; scenarios are synthetic |

---

## 3. Curriculum coverage

| Subject | Concepts | Authored | Outlines |
|---|---:|---:|---:|
| Maths | 67 | 67 | 0 |
| Physics | 18 | 18 | 0 |
| Chemistry | 16 | 16 | 0 |
| Biology | 16 | 16 | 0 |
| Computing | 18 | 18 | 0 |
| **Total** | **135** | **135** | **0** |

All lessons are registered in the authored catalogue, all declared
prerequisites resolve, and the generated catalogue, quality dashboard,
international-readiness report and autonomous checkpoint agree on the total.
The total was not changed to create a new target.

---

## 3a. Country reality research

**INITIAL_RESEARCH, not curriculum approval.** The registry's 70 national
routes now have one profile each in `docs/country-research/`. Thirteen countries
have a sourced first profile: Bangladesh, India, Kenya, Malawi, Nepal, Nigeria,
Tanzania, Ghana, Zambia, Rwanda, Pakistan, the Philippines and Indonesia. The
other 57 are explicitly `NOT_RESEARCHED` and contain only the registry's
structural record. No route is marked `CURRICULUM_MAPPED`, `HUMAN_REVIEWED` or
`SCHOOL_VALIDATED`.

The profiles separate national structure from subject-syllabus evidence, record
the year, method and limitations of each statistic, and keep national averages
away from claims about every school. The index and state are regenerated by
`npm run country:research`; `npm run country:check` is part of `npm run verify`.

The first product consequence is implemented in the existing teacher-led mode:
the presenter can now run as **no pupil devices**, **shared devices**, **large
class**, **multilingual** or **limited materials**. Each mode changes the group
routine, prompts and assumptions, and none turns a group answer into individual
mastery. `verify:low-resource` exercises all five and still asserts that no
learner answers are recorded. Every authored lesson also has a printable teacher
guide with a board plan and an answer-free assessment list, generated from the
same lesson as the worksheet and key.

The second consequence is the synthetic school-reality gate. Eight scenarios
(Bangladesh, Malawi, Nigeria, Pakistan, Nepal, Tanzania, the Philippines and
India) map evidence to seven archetypes and one declared classroom condition.
`npm run verify:school-reality` asserts 1,080 lesson-scenario combinations have a
teacher guide, worksheet, separate key, presenter routine and deterministic
offline assessment. It also reports unsupported languages as unsupported:
Chichewa, Nepali and Kinyarwanda have neither an interface nor a reviewed lesson
translation, and the product does not silently label them English.

**Not done:** 57 routes are unresearched; no curriculum mapping has a subject
specialist's review; the only translated lesson plan is one French pair; no
teacher or learner has reviewed the country materials; no school has been
contacted.

---

## 4. Assessment coverage

| Measure | Value |
|---|---:|
| Assessment items | 451 |
| Short answer | 273 |
| Constructed response | 148 |
| Code | 18 |
| Structured multi-part | 6 |
| Gap fill | 1 |
| Matching | 2 |
| Ordering | 1 |
| Diagram | 2 |
| Server-marked items | **267 / 451 (59.2%)** |
| Short answers with a deterministic key | 255 |
| Short answers without a key (self-marked) | 18 |
| Code labs (browser-run, not server-marked) | 18 |
| Structured number parts | 6 |
| Structured graph parts | 2 |
| Structured read-off parts | 3 |
| Structured plot parts | 1 |
| Structured table parts | 1 |

### Appropriateness, not a target

The matrix applies the lesson's own content, not a wish for uniform variety:

- 84/135 lessons have every format recommended by their content.
- 51/135 have at least one recommended gap. Formats overlap, so the gap counts
  below sum to more than 51.
- The remainder is **30 graph**, **19 diagram** and **12 practical**. Every
  recommended short-answer, constructed-response, numerical, code, debugging and
  transfer requirement is represented.
- By subject: maths 45/67 complete, physics 12/18, chemistry 8/16, biology 2/16,
  computing 17/18.
- Gap-fill, matching, ordering and extra structured forms are optional unless
  the lesson names a process, classification or sequence.

**The audit was corrected twice.** It first counted a lesson's teaching graph,
diagram or experiment representation as though the learner had been assessed on
one, and treated any occurrence of “practical” as a practical-investigation
demand. `present` is now assessment evidence only. The complete count therefore
fell from 86 to 54; that was the honest assessment baseline. A second pass then
removed three over-recommendations: Computing's contract does not permit
`constructed-response` at all, so 18 phantom gaps disappeared; a numerical item
is now recommended only where a calculation is actually taught, not for every
maths/science lesson; and a prose item that reads a named chart is counted as
graph evidence. Sixteen authored items (seven debugging, one graph-reading
short answer, one numerical, seven graph) and those corrections moved 54 to 84.
The movement is
reported, not hidden. Multiple-choice remains the generated retrieval surface,
counted separately from authored items.

This is a **review queue**. No item was forced into a lesson to raise a count.
The full queue, with the formats present and missing, is
`audit/assessment-format-matrix.md`.

### Content added in this pass

- `fractions/a4`: a short numerical check (`1/2 + 1/4`) for a lesson that
  taught the operation but previously asked only for prose.
- `motion-graphs/a4`: a graph + follow-through read-off item.
- `motion-graphs/a5`: a plotted-series + read-off item on a printed grid.
- `data-charts/a4`: a table of pie-chart angles plus the 360° check.
- `rates-reaction/a4`: a practical-planning response — gas collection, controlled
  variables, mean rate from a graph, and the concentration/collision explanation.
- `energy-changes/a4`: a calorimetry-planning response — measurements, q = mcΔT,
  ΔH per mole, sign and heat-loss improvement.
- `photosynthesis/a5`: a rate-versus-light-intensity short answer that reads the
  plateau and names the limiting factor.
- `digestion/a5`: a surface-area calculation on a 3 mm cube cut into 27 cubes.
- Four graph-interpretation responses: `quadratics/a4` (intercepts and axis of
  symmetry), `completing-square/a4` (turning point and minimum), `straight-lines/a4`
  (gradient, intercepts and meaning) and `simultaneous/a4` (intersection of two
  lines).
- Three further graph responses: `coordinates/a4` (table, plot, read-off and
  point membership), `rates-reaction/a5` (initial and mean rate from a graph) and
  `statistics-data/a4` (truncated-axis chart). `enzymes/a1` now names the
  rate–temperature graph and reads its peak and fall rather than adding a
  duplicate item.
- Seven Computing debugging responses: `algorithms-search/a4`,
  `variables/a4`, `loops/a4`, `conditionals/a4`, `binary-data/a5`,
  `functions-code/a5` and `dictionaries/a5`. Each uses that lesson's own debug
  block and asks for the fault, its effect and the repair.

These close the previous "plot/table implemented but unused" gap with real
authored content, not a fixture.

---

## 4a. Adaptive learning

**AUTOMATED_VERIFIED on a seeded synthetic cohort — not learner-validated.**
Two independent instruments run against the real projection, model and decision
doors rather than reimplementing them:

- `npm run reliability` (held-out prediction): the mastery model's Brier score is
  **0.276**, against **0.311** for the learner's own rate on the same concept;
  the model beats the trivial baseline. The 0.65 mastery threshold separates
  **65.3%** correct answers among those it called established from **49.1%**
  among those it called not-yet (n = 327 held-out answers). Because that
  threshold gates `prerequisiteMet`, `stageOf` and every decision branch, its
  separation is a precondition for the rest of the engine being meaningful.
- `npm run benchmark` (43 learners, adversarial scenarios and a 90-learner
  cohort): the plan names a concept the learner's own record documents as weak
  in **76.7%** of cases, its top action is one in **25.6%**, and it covers
  **40.5%** of the documented weak concepts. The conventional
  specification-order rule scores **0.0%** on that same question by
  construction, which is why the comparison is reported as a structural fact,
  not a merit score.

**What the instruments report against the product.** One named adversarial
expectation is not held, and **4 of 8** hint-reliance cells in the benchmark's
Section G are not held: a learner who needed help on every answer can be given
the same action and sentence as one who needed none. The benchmark names these
as capability gaps rather than suppressing them.

**What is not measured.** Neither instrument shows that following the
recommendation improves learning. That needs real learners, a baseline and a
delayed test. The benchmark's own text says so; the register does not promote a
synthetic result into a learning gain.

## 5. Marking and feedback

**AUTOMATED_VERIFIED.** The same pure graders are used online and offline:

- gap-fill, matching, ordering and diagram marks are per criterion/position;
- structured parts carry method and answer marks separately;
- a method mark survives a wrong answer, and a required unit is part of the
  answer;
- graph marks compare the line's gradient/intercept, not the chosen endpoints;
- plot marks compare the required points and joining line;
- read-off marks follow the learner's own line;
- table marks are independent per cell;
- short-answer accepts authored alternatives and reports the matched key;
- prose is rubric-only and is never automatically scored;
- unreviewed assessment is not served as reviewed.

Evidence events carry the lesson/item id, score and device provenance, and
project into the learner record and mastery where justified.

---

## 6. Offline assessment

**BROWSER_VERIFIED.** The downloaded pack carries authored deterministic items:
gap-fill, matching, ordering, diagram labelling, structured
graph/plot/read-off/table/number and keyed short answer. It excludes extended
prose and code because a device cannot mark them honestly without human
judgement or a runner.

Proven after a browser restart with the network off: both authored items render,
mark locally with criteria, persist in the learner-scoped draft, queue once, and
sync exactly once. The ledger receives two device-provenance events; the learner
record projects 10/10 marks and mastery. Duplicate replay is refused.

The adjacent shared-device walk proves the queue survives a hand-back without
being visible to the next learner, and that learner A's held work is not drained
or lost while B uses the device.

**Limitation:** prose and code remain paper/teacher routes. The pack is not the
whole assessment and does not claim to be.

---

## 7. Paper and print

**BROWSER_VERIFIED (Chrome print-to-PDF), NOT PHYSICALLY PRINTED.**

- All eight authored assessment kinds render on a pupil sheet with answer
  spaces.
- Structured number, graph, read-off, plot and table parts render.
- The `data-charts` table keeps its categories, counts and blank angle row.
- The `motion-graphs` plot page keeps the prompt, grid and read-off instruction
  together after a page-break fix found by visual inspection.
- The teacher key is a separate authenticated route and carries model answers;
  no pupil sheet contains “Model answer” or “Teacher answer”.
- The teacher guide is a third authenticated route. The default and large-class
  variants both rendered as 6-page A4 PDFs; the run-of-show and four-group
  tables had zero horizontal overflow, repeated their headings and did not split
  a row across pages. Both PDFs were converted to images and read.
- A third authenticated route, `/print/[subject]/[concept]/guide`, prints the
  teacher's run sheet from the same authored lesson: objectives, preparation, a
  40-minute sequence, prior-knowledge answers, explanation, worked example,
  misconceptions, guided practice, an answer-free assessment list, exit ticket
  and follow-up. It follows the selected classroom condition's group routine and
  states that no learner answers are recorded. It also carries four **temporary**
  groups — Foundational, Developing, Applying, Extending — whose tasks come from
  that lesson's own hint, guided practice, independent assessment and transfer
  prompt. The guide tells the teacher to place pupils by the prior check or exit
  ticket and move them afterwards, never by school year or a permanent label.
- The whole-Maths batch is 539 pages; each file was >8 KB and had no sideways
  overflow.

**Not checked:** physical printer, scanner, ink, photocopy legibility, duplex,
paper colour vision, or marking a real stack.

---

## 8. International print

**EXTERNALLY_BLOCKED / HUMAN_REVIEW_REQUIRED.**

Only English print exists. Two complete machine translations exist
(`place-value` in Spanish and French); neither is human-reviewed, and the print
route has no language parameter. No Bengali, Hindi, Arabic, Urdu, Persian,
Spanish or French paper edition has been rendered or reviewed.

RTL pagination, Arabic/Urdu/Persian shaping, Bengali/Hindi conjuncts, translated
diagram labels, tables, answer spaces and teacher keys remain unverified.
Interface translation (15 languages) is not lesson translation.

No language support is claimed.

---

## 9. Low-resource performance

Measured with Chrome network emulation and the HTTP cache disabled:

| Route | Condition | Transfer | Time to readable |
|---|---|---:|---:|
| Pupil worksheet `/print/maths/fractions` | 50 kbps, 300 ms | **54.1 KiB** | **16,947 ms** |
| Print index `/print` | 50 kbps, 300 ms | 0.3 KiB | 1,672 ms |
| Interactive lesson `/learn/maths/fractions` | 500 kbps, 150 ms | **16.1 KiB** | **549 ms** |
| Home `/` | 500 kbps, 150 ms | 36.4 KiB | 250 ms |

The worksheet is stable at 54.1 KiB, inside the 250 KiB / 20 s budgets with
about 3 s of headroom. The lesson is 16.1 KiB / 549 ms in this measurement. It uses no video, no live AI and no continuous cloud access after load.

No smaller design was adopted: the six resources are the app shell and print
page; removing the print control would not remove the framework chunks, and
stripping teaching would make the sheet incomplete. The measured saving did not
justify that trade.

**Not tested:** real carrier, packet loss, school proxy, low storage, memory/CPU,
battery/thermal, or teacher-uploaded images.

---

## 10. School-local distribution

**INTEGRATED + AUTOMATED_VERIFIED; NOT A REAL LAN TEST.**

`npm run content:bundle` exports 135 lesson packs, an index, README and SHA-256
manifest (137 files). `npm run content:serve` serves it read-only on the LAN.
The mirror contains no accounts, learner records, evidence, teacher keys or
database. Writes are 405, traversal 404, unknown files 404, cache `no-store`.

`verify:local-content` builds into a scratch directory, verifies every byte
count and SHA-256 from disk, checks for forbidden records/fields, and exercises
the HTTP contract: **30 passed, 0 failed**.

**Not implemented / not tested:** signed or authenticated update packages,
teacher-controlled rollout, automatic client update or learner-work merge; a
real school LAN, USB round-trip or simultaneous devices. The README states that
a checksum detects damage, not provenance.

---

## 11. Production release

`OPENMIND_CHECK_UI=1 npm run production-check` — **PASS**, 34 recorded checks, 0 failed:

| Step | Result |
|---|---|
| Typecheck | pass |
| Engine/content graph (`verify`) | 4,631 passed, 0 failed |
| Low-resource delivery | 2,744 passed, 0 failed |
| Synthetic school reality | 110 passed, 0 failed; 1,080 lesson-scenario paths |
| Storage conformance | pass; the Postgres backend is a stated skip (not configured), not a failure |
| Disk headroom | 11.1 GB free (bar 5 GB) |
| Environment validation | well-formed |
| Question coverage | pass — every generated question is answerable |
| Content release | pass — the served content matches the published version |
| School-local mirror | 30/0 |
| Curriculum integrity | pass |
| Paper shapes | pass |
| Option-length gate | pass |
| Content platform | 72/0 |
| Structured-response audit | 230 marking checks, 0 failures; 11 coverage warnings |
| Pilot review pack | current |
| Published numbers | current |
| Production build | pass |
| Production server | starts on scratch store |
| Static assets / render / smoke | pass |
| Authorization matrix | 87/0 |
| Offline sync | 32/0 |
| Development server + e2e | 892/0 |
| Accessibility/UI walk | 73/0 |
| Print browser walk | 101/0; default and large-class teacher guides included |
| Offline assessment browser walk | 22/0 |
| Measured bandwidth | pass |
| Generated-file restore | pass |

**Not provided by this check:** a Postgres backend (skipped by configuration,
not failed), physical hardware, real carrier, school LAN, translated print,
teacher approval or learner outcomes.

---

## 12. Human validation

**HUMAN_REVIEW_REQUIRED.** Nothing here is approved.

- `docs/SUBJECT_REVIEW_PACK.md` contains five representative lessons — one
  each in maths, physics, chemistry, biology and computing — with objectives,
  explanation, worked example, misconceptions, assessment, model answers,
  marking criteria, transfer and curriculum mapping.
- `docs/TEACHER_REVIEW_FORM.md` records one lesson, one version, with evidence,
  required changes, conflict-of-interest and approval conditions. It contains
  no learner data and does not make a form into an approval.
- `docs/PILOT_PROTOCOL.md` contains the supervised learner-pilot design:
  pre/post independent paper, class-level allocation, blinded marking,
  attendance, dropout, device-sharing reality, consent, withdrawal and the
  stopping rule. Its new secondary-measure table specifies independent
  understanding, near and far transfer, delayed retrieval at 2 and 6 weeks,
  misconception resolution, usability, accessibility and device reality.
- No teacher approval or learner result is fabricated.
- No identifiable pupil data was collected informally.
- The five-lesson pack is representative, not a claim that the other 130 are
  reviewed.

---

## 13. Remaining defects and honest limits

1. **Assessment variety:** 51 lessons have at least one recommended-format gap;
   30 lack a graph item, 19 a diagram item and 12 a practical item. This is
   content review work, not a hidden software failure.
2. **International print:** only unreviewed machine translations exist; no
   RTL/non-Latin or translated paper edition is implemented or tested.
3. **Physical print:** none was performed; page counts and PDFs are not a
   printer test.
4. **Human validation:** 0 educator reviews, 0 learner tests, 0 approved
   lessons.
5. **Hardware/network:** no real low-cost Android, 2G/3G carrier, school LAN,
   USB round-trip or assistive-technology session.
6. **Local updates:** checksummed versioned mirror, but no signature,
   teacher-controlled rollout or merge of learner work.
7. **Deployment:** the file store is single-instance; production needs an
   explicit durable `OPENMIND_DATA_DIR`, session secret and public origin. The
   Postgres path was not exercised because no backend is configured.
8. **Coverage vs. validity:** 130 of 135 question concepts have structural
   checks only; 5 have prompt-derived answer verification. This is a
   measurement limit, not a claim that all items are valid.
9. **Option bias:** 64 of 135 concepts remained above the 35% reporting line on
   the last recorded eight-strategy audit; 21 are repaired and asserted. This
   is a content backlog, measured per family across eight strategies.
10. **Print internationalisation:** even a future translation needs RTL and
    script-shaping tests before a paper edition can be claimed.

---

## 14. Verdict

| Question | Answer |
|---|---|
| Is the curriculum complete as authored? | Yes — 135/135, 0 outlines. |
| Is every lesson teacher-approved? | **No — 0.** |
| Is every supported assessment format represented? | Yes, all eight authored kinds; structured table/plot now used. |
| Is every lesson's assessment variety appropriate? | **Not yet — 84/135 complete after correcting the audit, 51 in a review queue.** |
| Does offline marking use the online rule? | Yes — same pure graders, 551 + 22 assertions. |
| Can a learner answer offline, restart, reconnect and sync once? | Yes — browser-verified, including a second learner. |
| Can every lesson be printed with a separate key and a teacher run sheet? | Yes — worksheets, keys and 135 teacher guides are generated from the authored lesson; Chrome PDF verified, physical print unverified. |
| Is international/RTL print ready? | **No — blocked on reviewed translations.** |
| Is the software release gate green? | **Yes — `PRODUCTION CHECK: PASS`.** |
| Is it educationally approved or learner-validated? | **No — human review and a supervised pilot are required.** |
