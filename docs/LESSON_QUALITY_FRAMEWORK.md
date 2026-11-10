# OpenMind Lesson Quality Framework

**Status:** draft framework for authoring, automated audit, subject review and
learner testing. It is not an efficacy claim.

## 1. The standard

A lesson is not a body of text. It is a sequence that should let a learner who
has forgotten the topic:

1. find out whether the prerequisite idea is secure;
2. build the concept from a concrete case;
3. watch a worked example in which every move has a reason;
4. attempt a faded version;
5. correct a named misconception;
6. demonstrate understanding on an unfamiliar item;
7. return to the idea after a delay and still retrieve it.

The existing `openmind.lesson/1.0` contract encodes eleven required parts:
objectives, prior knowledge, introduction, explanation, representations, worked
examples, misconceptions, guided practice, assessment, transfer and retrieval.
This framework judges the *quality* of those parts. It does not replace them.

## 2. Twenty-four dimensions

The columns “Auto” and “Human” say what can honestly be checked by code and what
requires a subject teacher or a learner. A structural check never becomes a
learning claim.

| # | Dimension | Excellence | Serious defect | How to measure | Auto | Human |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Curriculum accuracy | The objective and scope match the named qualification and level; no invented content. | A concept is placed at the wrong level or a required idea is absent. | Reconcile against the published programme of study/specification; cite the reference. | Partial: path and level consistency | Subject/curriculum lead |
| 2 | Subject accuracy | Every factual, mathematical and scientific claim is correct and consistent across representations. | A wrong answer key, unbalanced equation, false explanation or incorrect diagram. | Deterministic checks for arithmetic, units, equation balance, answer reachability; expert read. | Partial | Subject teacher |
| 3 | Prerequisite coverage | The lesson names the exact prerequisite ideas, probes them, and has a route when the probe fails. | It assumes a prerequisite the learner has not met and offers no way back. | Map to genome prerequisites; require diagnostic items with target concepts. | Yes for presence; no for adequacy | Subject teacher |
| 4 | Conceptual explanation | Explains *why*, gives the meaning of symbols, builds from concrete to abstract, and stays coherent. | A procedure with no rationale, a definition-only lesson, or a jump that a novice cannot bridge. | Explanation sections, paragraph lengths, reason-bearing sentences, expert read. | Partial | Subject teacher |
| 5 | Clarity and accessibility | Short sections, one task at a time, unambiguous language, no unexplained jargon. | A wall of text, split attention, missing labels, or instructions that cannot be followed. | Readability, paragraph/section size, labels, browser checks at 320/desktop, screen-reader order. | Partial | Accessibility reviewer |
| 6 | Terminology | Each term is introduced where it is needed, defined in plain language, and used consistently. | A term is named but never explained, or a term is used before its meaning is established. | Glossary coverage; first-use position; jargon scan. | Partial | Subject teacher |
| 7 | Worked-example quality | A complete example with reasons for each move; the answer is visible in the working; assumptions are named. | “Show the answer” with no reasoning, skipped steps, or an example that does not match the assessment. | Two or more moves, a why per move, answer-reaches-working check, subject rules. | Yes for structure; no for reasoning | Subject teacher |
| 8 | Explanation of reasoning | Says why a move is valid, not only what to write; connects the method to the concept. | “This is the rule” or an example that demonstrates a procedure without explaining it. | Reason-bearing sentences, expert read. | Partial | Subject teacher |
| 9 | Misconception correction | Names the belief, explains why it fails, gives the correct reasoning and a contrast pair; probes it later. | A label with no repair, or a correction that accidentally reinforces the error. | Misconception count/fields; contrast pair; later retrieval probe. | Yes for fields | Subject teacher |
| 10 | Visual/practical representation | A representation makes a specific relationship visible and is captioned; a practical is tied to a question and evidence. | Decorative images, an unlabelled diagram, or a “practical” with no interpretation. | Block kinds and captions; diagram arithmetic; experiment analysis. | Partial | Subject teacher |
| 11 | Guided practice | A faded item with a hint that moves one step, immediate feedback, and a reason to retry. | A hint that gives the answer, or practice with no feedback. | Hints, feedback fields, item quality. | Yes for structure | Subject teacher |
| 12 | Independent practice | A fresh item requiring the learner to choose the method, not just substitute numbers. | Practice only repeats the worked example or only recognises an answer. | Item variation and transfer distance. | Partial | Subject teacher |
| 13 | Assessment validity | The assessment measures the objective, includes reasoning, and cannot be passed by copying a cue. | A quiz that tests vocabulary or a single number while claiming conceptual understanding. | Constructed response, marking criteria, alternative-answer analysis. | Partial | Subject teacher |
| 14 | Feedback quality | Task/process-focused, names the likely error, requires an action, and does not merely give a grade. | “Wrong, try again” or praise with no information. | Feedback fields; retry path; error taxonomy. | Partial | Subject teacher |
| 15 | Transfer | A genuinely unfamiliar context requires selecting and applying the idea; the lesson explains why it transfers. | The same item with changed numbers, or an optional extension that nobody assesses. | Transfer prompt, why-it-transfers, marking criteria. | Yes for presence | Subject teacher |
| 16 | Retrieval | Low-stakes recall of the key idea, with feedback and a second attempt; cumulative, not only end-of-lesson. | A recap that shows the answers, or no retrieval at all. | Retrieval items, schedules, answer withholding. | Yes for presence | Subject teacher |
| 17 | Retention support | Revisits after meaningful delays; the schedule survives a new session; retention is measured. | “Spaced” practice all in one sitting; completion counted as retention. | Next-day/week/month items; delayed test records. | Partial | Learner testing |
| 18 | Differentiation | Alternate explanations or scaffolds for a learner whose evidence shows a gap; stretch for mastery. | One route for every learner, or a “struggling” route that repeats the same text. | Authored routes and route-selection logic. | Yes for presence | Subject teacher |
| 19 | Accessibility | Alternatives for screen reader, low vision, dyslexia, motor, colour vision and no-audio needs; semantic structure. | Colour-only meaning, missing captions, keyboard traps, horizontal scroll at 320. | Automated accessibility scan, browser walk, manual assistive-tech review. | Partial | Accessibility reviewer |
| 20 | Technical correctness | Notation renders as intended; equations, units, code and tables survive the renderer; no raw notation leaks. | Raw `^`, `*`, `sqrt(` or LaTeX in learner prose; a broken fraction; code formatted as maths. | Formatter gate, browser checks at target widths. | Yes | — |
| 21 | Originality | Original teaching; external ideas cited; no copied lesson text; no template with substituted nouns. | Plagiarised prose, or two lessons that share long runs. | 12-word shingle check against other lessons and the genome paragraph. | Yes | Subject teacher |
| 22 | Language quality | Accurate, natural, age-appropriate, unambiguous; translation status disclosed. | Machine translation presented as reviewed; a translated heading above English teaching. | Dictionary coverage; translation records; expert read. | Partial | Native-speaking teacher |
| 23 | Curriculum-specific relevance | The task is the kind of thinking the discipline actually requires. | A generic “read and answer” task for computing, or a vocabulary quiz for maths. | Subject framework rules (maths expression, physics units, chemistry balance, biology structure–function, computing code/trace/test). | Yes for framework | Subject teacher |
| 24 | Real learner usability | A learner can navigate, understand the task, recover from an error and know what to do next. | Hidden practice, a dead end after a wrong answer, or a page that only works on one screen size. | Browser journey at 320, phone, tablet and desktop; task completion observation. | Partial | Learner testing |

## 3. Verdict rules

A lesson is **not** given a single average score. A high average can hide a
factual error, and a polished page can teach nothing.

- **Critical failure** — any factual/answer-key error, an unbalanced equation, a
  missing prerequisite with no route, or an assessment that cannot measure the
  objective. The lesson fails regardless of other dimensions.
- **Not yet a lesson** — the content is metadata, a genome paragraph or an
  assembled lens with no diagnostic, reasoning, assessment or transfer.
- **Machine-checked** — it meets `openmind.lesson/1.0` and all deterministic
  checks. This is not a claim that it teaches well.
- **Subject-reviewed** — a named teacher has read the exact version and approved
  it. The review must be recorded with a date and scope; a script cannot create it.
- **Learner-tested** — real learners have been assessed on independent transfer
  and delayed retention, not completion or satisfaction.
- **Published** — subject review and learner testing are both present, plus
  curriculum approval.

The current repository is at **65 machine-checked, 70 outlines, 0 subject-
reviewed, 0 learner-tested** (10 November 2026). The generated catalogue and the
audit beside this document are the source of those numbers; this sentence is a
snapshot and `npm run readiness` is the live ledger.

## 4. What is automated, what is not

### Automated and trustworthy

- Presence and shape of the eleven contract parts.
- Two or more worked-example moves, each with a reason of at least six words.
- Answer-reaches-working checks for numeric answers.
- Equation balance for the supported chemistry notation.
- Physics answers carrying a unit where digits are present.
- Computing code, trace and test blocks; a code assessment.
- Biology structure–function and process blocks naming a cause/function.
- Maths expression block and a constructed-response assessment.
- Raw notation and placeholder scans.
- Originality shingles.
- Catalogue status versus declared status.
- The 135-concept coverage count and the outline queue.

### Requires a human

- Whether an explanation is scientifically or mathematically *right* in a
  context the checker does not model.
- Whether the difficulty is appropriate for the intended age and qualification.
- Whether a misconception is the one real learners actually hold.
- Whether a constructed response and its marking criteria are fair.
- Whether a translation is natural.
- Whether a learner can use the page with a screen reader or a motor impairment.
- Whether the lesson improves learning.

### Requires learners

- Independent post-lesson performance.
- Transfer to an unfamiliar problem.
- Delayed retention.
- Where learners actually get confused.
- Whether the lesson is usable without a teacher in the room.

## 5. How this framework is used

1. `node scripts/lesson-quality-audit.mjs` produces the per-concept audit and
   queue from the real plan table.
2. `npm run lesson:catalogue` reports which concepts meet the authored contract.
3. `npm run verify` runs the contract and subject-framework checks.
4. A subject teacher reviews the lesson and records a real review; the framework
   refuses an approval without a named reviewer, date, scope and version.
5. A learner test measures independent transfer and delayed retention. No
   completion metric is accepted as mastery.
6. Only then may the lesson claim the higher rung.

The framework is deliberately harder than “the page renders”. It is meant to be
uncomfortable: the honest answer today is that most OpenMind lessons are outlines,
and that no lesson has been subject-reviewed or learner-tested.
