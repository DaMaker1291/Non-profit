# Computing batch verification — `lists-arrays`, `functions-code`, `dictionaries`

**Date:** 2026-11-08

**Scope:** three authored Computing lessons, their runnable Python assessments,
the learner-facing rendering of the code lab, and the catalogue/report updates.

**Publication status:** working tree only. No commit, push or deployment was
made.

**Catalogue status:** 38 authored, 97 outline, 38 `machine_checked`, 0
`educator_reviewed`, 0 `learner_tested`. The three new lessons are
`machine_checked`; they are not teacher-reviewed and no learner has used them.

## 1. What was built

| Concept | Teaching focus | Independent assessment |
|---|---|---|
| `lists-arrays` | Zero-based indexing, valid index range, `IndexError`, direct iteration vs `range(len(...))`, in-place methods and `None`, dynamic lists vs fixed-size arrays | Repair `count_above` so it returns a count; predict list output; explain an out-of-range index; read a traversal total; transfer to a growing temperature-reading list |
| `functions-code` | `def` vs call, parameters vs arguments, return vs print, local scope, nested calls and decomposition | Repair a function that prints instead of returning; predict a call's output; explain local scope; complete and evaluate a return; transfer to a decomposed cinema price |
| `dictionaries` | Key–value mapping vs positional indexing, updates, missing-key `KeyError`, `get(key, default)`, membership, frequency counting and structure choice | Repair a frequency counter with `get(word, 0) + 1`; predict lookups; explain bracket access vs `get`; choose a structure with a limitation; transfer to word frequency in a sentence |

Each lesson has 3 measurable objectives, 2 prerequisite checks, 4 explanation
sections, 4 subject-specific representations (code, trace, test, debug), 2
reasoned worked examples, 3 misconceptions with contrast pairs, 3 guided items,
4 assessment items, a transfer task and 3 spaced retrieval prompts. The prose and
representation counts measured by the browser are recorded below.

The three lessons are deliberately different. Lists teaches position and
boundaries; functions teaches a call contract and scope; dictionaries teaches
lookup by label and the meaning of an absent key. They are not one lesson with
three nouns substituted.

## 2. Curriculum and research basis

The scope was checked against the published GCSE computer science subject
content, not copied from a commercial course:

- Cambridge IGCSE Computer Science 0478, 2026–2028 syllabus:
  <https://www.cambridgeinternational.org/Images/697167-2026-2028-syllabus.pdf>
- Teach Computing, Lesson 29 “Arrays and lists”:
  <https://teachcomputing.org/curriculum/key-stage-4/programming-part-5-strings-and-lists/arrays-and-lists>
- Oak National Academy, “Records and dictionaries”:
  <https://www.thenational.academy/teachers/programmes/computing-secondary-ks4-gcse-aqa/units/programming-dictionaries-and-data-files/lessons/records-and-dictionaries>
- Oak National Academy, “List methods”:
  <https://www.thenational.academy/teachers/programmes/computing-secondary-ks4-gcse-ocr/units/programming-strings-and-lists/lessons/list-methods>
- Raspberry Pi Foundation, GCSE unit “Dictionaries and data files”:
  <https://www.raspberrypi.org/curriculum/archived/key-stage-4/programming-part-6-dictionaries-and-datafiles>
- Isaac Computer Science code sample for one-dimensional arrays:
  <https://github.com/isaaccomputerscience/isaac-code-samples/blob/main/data-structures/one-dimensional-arrays/python/array_loop.py>

**What these resources do well, and what was learned.** Teach Computing separates
the data-structure definition from the Python list operations and makes
`append`/`remove` a practical activity rather than a vocabulary list. Oak's
dictionary material treats a record as a set of named fields and supplies
diagnostic questions about indexing and list methods. The Raspberry Pi sequence
builds a dictionary unit around records and data files. The Isaac sample shows a
short executable loop with indexing, append, pop and length, which is useful
because the learner can observe the state rather than read a definition. OpenMind
uses those teaching moves but not their text or code: the examples, traces,
questions, answers and prose here are original.

**Scope boundary.** `lists-arrays` and `functions-code` align with the programming
content in the 0478 route. `dictionaries` is taught as a Python key–value data
structure and an extension of list work; this lesson does **not** claim that
dictionaries are a separately named 0478 statement. The wider comparison of
Cognito, Seneca, Dr Frost, Isaac's authenticated lesson platform and other
commercial courses remains a separate research workstream; it is not claimed as
complete here. Teach Computing's downloadable packages require an account and
were not downloaded; the public lesson pages were inspected. No copyrighted
material was reproduced.

## 3. Programming environment and isolation

`components/code-lab.tsx` reuses the existing sandboxed runner:

- the Python runtime is Pyodide 0.26.4 in `public/code-runner.html`;
- the iframe has `sandbox="allow-scripts"` and deliberately **no**
  `allow-same-origin`, so learner code has an opaque origin, no cookies, no
  local storage and no access to the application DOM;
- the parent owns the timeout and recreates the iframe if a program blocks;
- no learner code is sent to OpenMind's server;
- the runtime is loaded from a pinned CDN, so it is not offline and can be
  unavailable.

The live browser probe drove the real runtime, not a mock: **19 passed, 0
failed**. It checked the labelled editor, live status region, iframe sandbox
attribute, runtime readiness, real keyboard focus and typing, Reset, the starter
program's output, the repaired program's output, the practice-only disclosure,
and page width at 1280, 768, 375 and 320 px.

### Defects found by the live probe, and fixed

1. **`print(3); print(None)` was displayed as `3None`.** Pyodide's batched stdout
   callback delivers line chunks without the separating newline. The runner
   concatenated them, hiding the exact distinction a learner debugging a missing
   `return` needs to see. `public/code-runner.html` now appends a newline only
   when the chunk does not already end with one. Measured after the fix:
   `3\nNone`.
2. **The practice-only disclosure was hidden.** The sentence saying the checks
   are practice feedback lived inside a collapsed model-answer `<details>`.
   `components/code-lab.tsx` now states it beside the lab, and separately states
   that code stays in the sandboxed iframe. The probe asserts both sentences.
3. **A deterministic answer key rejected its own model answer.** `functions-code`
   item `a4` had a prose model answer ending in `24` while its accepted key was
   `24`; the full-suite consistency check correctly failed it. The model answer
   is now `24`, with the return expression in the marking criterion. This was an
   internal consistency defect, not a learner-content change.

## 4. Independent technical execution

Thirty Python cases were run independently with the host interpreter, checking
exact stdout or the expected exception:

- list starter `239`, repaired `311`, direct traversal `221`;
- append returning `None`, repair preserving the list;
- index access, negative index and length output;
- list prediction, append/update prediction and total `12`;
- list code starter `3` then `None`, repaired `3`;
- function starter `60.0` then `None`, repaired `60.0`;
- add-ten trace `23`, add-fee print/return `15`, nested add-two `7`;
- missing return `None`, reversed subtraction `6` and `-6`;
- greet outputs, local-scope `NameError`, decomposed ticket total `57`;
- dictionary starter raising `KeyError`;
- frequency repair `3`/`2`, trace `2`/`1`/`2`, update `5`/`10`;
- lookup/default outputs, missing-key explainer, word-frequency dictionary.

Result: **30/30**. This is an execution check, not a claim that a learner can
write the programs independently.

`npm run verify` also checks every deterministic lesson key against its own
model answer and against a nonsense answer. That check caught the `a4` mismatch.

## 5. Assessment validity

The code-lab checks compare exact stdout. They are **practice feedback, not a
recorded mark**, and the lab now says so on the screen. Passing a stdout check
does not establish that the learner understands why the program works: a learner
could hard-code the output or copy a model answer.

The recorded evidence path is different:

- each lesson has deterministic short-answer items with accepted answers; those
  are graded by the server and recorded for a signed-in learner;
- the code item is deliberately self-marked against criteria, because exact
  stdout cannot see the explanation;
- constructed responses are not scored by word matching. `lib/peer-review.ts`
  remains the standing evidence that vocabulary matching is not a mark;
- no item claims to measure independent problem-solving on its own.

Multiple choice is not the principal assessment. Each lesson's independent
section contains a code repair and three short/constructed responses; the
transfer task requires a written solution and justification.

## 6. Independent Problem-Solving Capability

This is the proposed six-stage metric, reported as **artefact present** or **not
measured with pupils**, not as a score.

| Stage | What the lesson contains | Evidence status |
|---|---|---|
| Understand | Explanation sections and misconception contrasts | Machine-checked structure; no pupil explanation |
| Recognise | Guided items and code/test representations | Machine-checked; no pupil response |
| Apply | A code repair, live stdout checks and short-answer items | Code lab passed by the harness, not a pupil |
| Explain | Marking criteria on code, short-answer and transfer items | Criteria authored; prose unmarked and untested |
| Transfer | An unfamiliar context: temperature readings, cinema pricing, word frequency | Model answer authored; no pupil attempt |
| Retain | Retrieval prompts at next-day, week-later and month-later | Scheduled only; no delayed evidence |

The important claim is therefore limited: the lessons **provide** the
opportunities, and the application executes what they contain. They do not yet
demonstrate that a pupil can use the knowledge without being told what to do.

## 7. Verification results

Run on the working tree with a scratch `OPENMIND_DATA_DIR` for browser checks;
the live `.openmind-data` store was not opened.

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4630 passed, 0 failed** (three planted failing controls excluded) |
| `npm run verify:lessons` | exit 0; 38 authored, 97 outline, 38 `machine_checked`, 0 unresolved lesson problems |
| `npm run build` | exit 0, 69 static pages generated |
| `node scripts/code-lab-check.mjs` | **19 passed, 0 failed** against real Pyodide |
| Independent Python cases | **30/30** |
| `npm run verify:lesson` | **410 passed, 0 failed**; all 16 unplanned authored lessons at 1280, 768, 375 and 320 px |
| `npm run verify:journey` | **72 passed, 0 failed**; a fresh guest completed all three lessons through the real application, with real Pyodide execution and 10 persisted evidence events |
| `npm run verify:a11y` | **73 passed, 0 failed** on five public routes plus `/access` controls; structural only |
| `npm run disk-headroom` | **8.2 GB free** at the final journey reading (OK, close to the 8.0 GB watch bar); earlier readings were **9.3 GB** and **7.4 GB** (WARN), so the volume moved during the batch |

The first two browser attempts failed before reaching a lesson because a stale
generated `.next-dev` cache served the onboarding `Loading…` shell while the
server answered 200. Deleting only that generated cache restored the page. The
failure and fix are recorded because the symptom looks like a product session
defect. No learner data or source was removed.

### Browser measurements for the three new lessons

All three rendered their authored contract, 3 objectives, 3 misconceptions, 3
guided items and 4 representation blocks. No page scrolled sideways at any of
the four widths.

| Concept | Prose paragraphs | Transfer words | Retrieval words | Widths |
|---|---:|---:|---:|---|
| `lists-arrays` | 18 | 218 | 53 | 320 / 375 / 768 / 1280, no overflow |
| `functions-code` | 18 | 189 | 51 | 320 / 375 / 768 / 1280, no overflow |
| `dictionaries` | 19 | 190 | 56 | 320 / 375 / 768 / 1280, no overflow |

### The complete learner journey

`scripts/computing-journey-check.mjs` is a separate live check from the
410-assertion rendering walk. It drives a fresh guest through onboarding, a
Computing-only GCSE course, all three authored lessons, the real Pyodide runner,
a wrong and a right answer on every server-marked item, and the next activity
Home offers. The final run passed **72 assertions, 0 failed**.

The scratch profile `prof_d761cdc33a274d2a8b3aca11c31b2834` recorded:

| Lesson | Server-marked items | Asked | Correct |
|---|---|---:|---:|
| `lists-arrays` | `a2`, `a4` | 4 | 2 |
| `functions-code` | `a2`, `a4` | 4 | 2 |
| `dictionaries` | `a2` | 2 | 1 |

The evidence ledger held **10 events**, all `mode: independent`, `hints: 0` and
`source: practice`: a wrong first attempt and a correct retry for each marked
item. Constructed responses (`a3`, and dictionaries' `a4`) produced no evidence.
The starter programs failed their authored checks honestly (`3\nNone` for lists
and `60.0\nNone` for functions; dictionaries raised `KeyError`), and the repaired
programs produced exactly `3`, `60.0` and `3\n2`.

Home did **not** show the recommendation card after the lessons. It showed the
baseline diagnostic gate — “Before we recommend work, we need to see what you
already know.” — because this journey never sat the baseline diagnostic. That is
the route guard's intended state. The harness follows the gate's `Next` link and
asserts it reaches `/diagnostic/computing` with a real heading, rather than
requiring `.next-cta` at this point. The decision engine was also checked
independently against the same profile and ledger: it returned `EXPLAIN
variables` followed by `PRACTISE lists-arrays`, so the recommendation card is
reachable once the gate is satisfied. The state order is worth watching: a
learner can open lessons directly, then be asked for the baseline diagnostic on
Home.

## 8. Accessibility

Automated checks that did pass:

- the code lab's iframe has a title, the editor has a programmatic label, the
  status regions are live, and keyboard focus and typing reach the editor;
- the 410-assertion browser walk found no horizontal overflow for the three new
  lessons at 320, 375, 768 and 1280 px;
- the structural audit found one document language and one h1 on every audited
  public route, named buttons/links, labelled controls, alt attributes, hidden or
  named SVGs, no positive tabindex, a working skip link, reduced-motion
  compliance and no 320-px overflow;
- the `/access` controls were measured at their computed sizes, line height,
  border weight and animation state, and were returned to default.

What remains unmeasured, and must not be claimed:

- screen-reader announcements and reading order for the code lab or the lessons;
- switch or eye-gaze input;
- 200% zoom/text reflow beyond the 320-px width proxy;
- colour-contrast ratios;
- captioning and any learner's actual experience.

No statement of WCAG conformance is made.

## 9. Catalogue and status

- Authored: **38**
- Outlines: **97**
- `machine_checked`: **38**
- `educator_reviewed`: **0**
- `learner_tested`: **0**
- Critical gaps: **14**
- High-priority gaps: **83**

The catalogue distinguishes these states. `machine_checked` means the contract
and deterministic checks pass; it does not mean a Computing teacher considers the
lesson excellent. The authored records use `ai-assisted-then-edited`, and their
`reviews` and `learnerTesting` arrays are empty. No approval was invented.

The generated audit and queue were refreshed after the lessons were wired:

- `reports/lesson-quality/audit.json`
- `reports/lesson-quality/audit.md`
- `reports/lesson-quality/queue.md`
- `audit/lesson-catalogue.json`
- `audit/lesson-catalogue.md`

## 10. Limitations

- **No human evidence.** There is no teacher review and no learner trial. The
  Independent Problem-Solving Capability stages are opportunities, not measured
  outcomes.
- **The journey is one browser, one learner, not a trial.** It establishes that
  the actual application can carry one fresh guest through the three lessons,
  mark both kinds of answer and persist the evidence. It does not establish that
  a pupil learned the material, and the post-lesson recommendation card itself
  was not rendered because the baseline diagnostic gate came first.
- **Exact stdout is narrow.** It checks one observable behaviour. It cannot
  distinguish a copied answer from a constructed one; that is why the code item
  is practice-only and the explanation criteria are separate.
- **The code runtime is online.** Pyodide is pinned to a CDN. If the CDN is
  unavailable the lab says so; it is not an offline runtime.
- **No deployment.** The production server was not restarted, and no site was
  published.
- **Disk headroom.** The volume moved during the batch: an earlier post-build
  reading was 7.4 GB (WARN), a later post-build reading was 9.3 GB, and the
  final journey reading was **8.2 GB (OK, close to the 8.0 GB watch bar)**. The
  project's guard refuses below 5.0 GB and warns below 8.0 GB; recheck before
  the next full build rather than assuming this reading holds.
- **Research scope.** The broader commercial-platform comparison remains
  outstanding; this batch does not claim it is complete.
- **One agent wrote and checked the lessons.** The Python interpreter, browser,
  lesson gate and build are independent executable checks, but they are not an
  independent subject-teacher review.

## 11. Reproduction

```bash
# Static and engine checks
npm run typecheck
npm run verify
npm run verify:lessons
npm run build

# Live code-lab probe (requires the dev server on 4173)
OPENMIND_DATA_DIR=/tmp/openmind-code-lab npm run dev
node scripts/code-lab-check.mjs

# Full browser walk (requires the dev server on 4173)
LESSON_WALK_SHOTS=0 OPENMIND_DATA_DIR=/tmp/openmind-lesson-walk npm run verify:lesson

# Full learner journey. The server and the suite MUST use the same scratch store.
OPENMIND_DATA_DIR=/tmp/openmind-journey npm run dev
# in a second terminal, while that server is ready:
OPENMIND_DATA_DIR=/tmp/openmind-journey npm run verify:journey

# Structural accessibility smoke test
OPENMIND_DATA_DIR=/tmp/openmind-a11y npm run dev
npm run verify:a11y
```
