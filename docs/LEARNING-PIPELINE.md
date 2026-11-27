# The learning pipeline: research → lesson → interaction → review

This document is the standard the 135-concept expansion is measured against. It
exists because the coverage register can otherwise flatter the project: a lesson
file is not a teaching sequence, a teaching sequence is not an interactive
experience, and an interactive experience that has never been opened in a browser
is not a verified one.

## The nine measures

Every concept is counted on these separately (`lib/model-coverage.ts`,
`npm run coverage`). Do not add them up into one "completion" number.

| # | Measure | Source of truth |
|---|---|---|
| 1 | Concept exists | `lib/genome.ts` |
| 2 | Lesson file exists | `planFor(id) !== null` |
| 3 | Teaching sequence exists | `plan.sections` is authored (not synthesised by `sectionsFor`) |
| 4 | Research dossier | `lib/learning-research.ts` — `researched` only with ≥3 inspected sources |
| 5 | Modality delivered | the lesson's actual mode: interactive model, authored text, or none |
| 6 | Interaction built | `modelForConcept(id, plan.interactive)` |
| 7 | Browser verified | `lib/model-evidence.ts` — a dated record of what a person did |
| 8 | Educator reviewed | dossier `educatorReview: "reviewed"`, set only by a named teacher editing the file |
| 9 | Learner tested | **0**. No instrument exists in this build; no code path can raise it |

Measure 5 records what ships; it is **not** a claim that the mode was judged the
best fit for the concept. Judging fitness is step 6 of the pipeline below, and its
reasoning lives in the dossier's `designDecision`.

## The ten steps, per concept

1. **Curriculum investigation** — what the specification expects, in its own vocabulary.
2. **Subject-content research** — the accurate account, from a source that can be cited.
3. **Misconception identification** — a named wrong belief with a source, never "students find this hard".
4. **Teaching-method investigation** — what the evidence says works for *this* idea.
5. **Resource inspection** — at a recorded depth (below), with the licence recorded separately from the usefulness.
6. **Modality selection** — simulation, line, diagram, worked sequence, practical, discussion, or text. Write the reason down. Do not force a model into a concept that needs a sequence.
7. **Lesson design** — objective, prior knowledge, sequence, worked examples, traps, assessment.
8. **Interaction development** — the arithmetic in a pure module, the drawing in a component, and the model's assumptions stated beside it.
9. **Assessment design** — what would show the misconception is gone, not just that an answer was produced.
10. **Browser verification** — keyboard, mobile, readout, and the model's own claims, checked by a person and recorded in `lib/model-evidence.ts`.

## Inspection depth

`lib/learning-research.ts` records a depth for every source, and
`validateResearch` refuses a depth that is deeper than its inspection state.

| Depth | Means |
|---|---|
| `discovered` | located; no content read |
| `metadata` | title, creator, description, licence page |
| `abstract` | abstract or summary only |
| `section` | named sections, tables or answers read |
| `full-text` | the document read through |
| `asset` | slides, worksheet or diagrams examined |
| `transcript` | a published transcript read; the video **not** watched |
| `video-frames-sampled` | frames decoded and looked at; audio **not** heard |
| `video-segment` | a timestamped segment actually played |
| `video-watched` | the whole video played |
| `audio-evaluated` | the audio itself heard and judged |
| `slides-text` | slide text extracted; the deck **not** rendered |
| `slides-visual` | the slides rendered and seen |
| `slides-media` | images, animations or embedded video inspected |
| `slides-full` | the deck reviewed as text and visuals together |
| `interactive-tested` | the resource operated, not merely opened |

Four rungs are deliberately separate because four different things get called
"watching" or "reading the slides": a transcript, a set of decoded frames, a
timestamped stretch that was played, and the whole video. The same applies to a
deck: extracting its text is not seeing it. `validateResearch` refuses
`video-frames-sampled` without timestamps and a statement about the audio, and
refuses `slides-text` without a limitation saying the visuals were not rendered.

## Rules the gates enforce

- No model without a research dossier (`npm run verify`).
- No model reachable by a learner without a dated browser record (`npm run verify`).
- Every model states its assumptions, limitations, the misconceptions it addresses,
  and at least one it might introduce (`lib/model-assumptions.ts`).
- No dossier reaches `researched` on fewer than three inspected sources.
- No NC/ND source may be marked reusable; OpenMind's content is CC BY-SA 4.0.
- Educator review and learner testing stay `pending`/`0` until real people act.
- The source total is computed by `researchReconciliation()`, never added by hand.

## The model frame (every interaction, same four questions)

Every model is drawn inside `components/model-shell.tsx`, and the content it draws
is `lib/model-teaching.ts` — one record per **concept**, not per model, because the
number line teaches tens for place value, tenths for decimals and direction for
negatives.

1. **What you will be able to do** — action-first, never a topic name.
2. **Predict first, and it is a lock, not a caption** — the model stays shut until
   the learner commits: the slot is empty apart from one sentence saying why. An
   earlier version printed the question and left the controls live underneath, and
   what that produced was a drawing pressed before any belief existed. Changing the
   answer afterwards keeps the model open — revising a prediction is the point.
   A prediction is one of **two shapes**: a choice (three or more options, one
   right, at least one tempting wrong one) where the model refutes a named belief,
   or a **describe box** where the answer is a relationship the learner has to put
   into their own words. A describe prediction marks nothing — it commits on
   length alone, says so on the screen, and hands the teaching to the model —
   because the project already established why prose cannot be scored
   (`lib/peer-review.ts`). Two concepts use it (`atoms-elements`, `cells`); the
   other seven are choices. Beside either shape sits an **optional confidence
   question** (confident / not sure / guessing). It is used and not stored: it
   changes the sentence the learner reads when the model answers, which is a
   teaching move about calibration rather than a measurement.
3. **The interaction itself** — unchanged component, unchanged arithmetic.
4. **What it cannot show** — assumptions, limitations and "where the picture could
   mislead", from `lib/model-assumptions.ts`, in a disclosure rather than three
   screens of caveat under every drawing.

The teacher half of the same record (demonstration, questions to ask, guided
activity, no-device alternative, what to look for, where next) is printed in each
educator pack, so the pack and the screen cannot describe different versions.

## Current state (2026-11-25)

See `npm run coverage` for the live figures. At the time of writing: 135 concepts,
135 lesson files, **23 hand-authored teaching sequences** (the generated
supplemental fallback is not counted as one), 9 researched dossiers, 9
interactions, 9 browser-verified, **0 educator sign-offs, 0 learner tests**. The
queue is 126 concepts.

The register holds **44 sources**: 39 inspected, 4 identified, 1 blocked, and the
counts reconcile by depth (5 discovered, 3 metadata, 6 abstract, 13 section, 6
full text, 3 asset, 4 transcript, **1 video-frames-sampled, 1 video-segment, 1
slides-text, 1 interactive-tested**).

Both video rungs are in use, and they are not interchangeable:

- `video-segment` is the Oak National Academy linear-search lesson, played in a
  browser from 04:40 to 06:45 of twenty-one minutes, with the British English
  caption track on and frames paused at 04:53 and 06:31.
- `video-frames-sampled` is the Oak fractions lesson. Its player never
  initialised, so four frames were decoded from the lesson's own signed stream at
  02:30, 07:00, 11:40 and 16:40 of 23:11 and viewed. The video was **not** watched.
- `slides-text` is the Dr Frost Year 7 Fractions deck: 28 slides of text read from
  the package, with none of its 66 embedded media files rendered.

In all three the audio was **not** heard (where there was audio to hear), and each
record says so.
- `interactive-tested` is PhET's Circuit Construction Kit: DC. It was launched,
  taken into the Intro screen and driven through its own component controls: a
  battery, a bulb and three wires were added and the scene read from the frame.
  No closed circuit was built — the components could not be dragged into contact
  in this automation — so **no current was observed and nothing was checked against
  a measurement**. That limitation is written into the record, not left for a
  reader to infer.
- `asset` is now four sources: two earlier section-level documents, plus Dr Frost's
  Year 7 fractions PowerPoint (28 slides read from the .pptx itself) and a Year 3
  fractions-of-amounts worksheet (both pages of the PDF, answer key included).
  The judgement behind each — usefulness, permission to reuse, permission to adapt,
  intended application, limitations — is in `docs/MULTIMEDIA-INSPECTION.md`, and
  every technique that changed a lesson is answered against the six questions in
  `docs/MULTIMEDIA-TO-PEDAGOGY.md`.

The remaining four transcript records are still transcripts: Oak for electric
current, atoms and animal cells, and Khan for fractions. Reading what was said is
not watching it, and no record says otherwise.

Two of the nine modelled concepts (`atoms-elements`, `algorithms-search`) still
sit on the **supplemental** plan, whose objective is a sentence with the concept's
name in it. The model frame now states a real objective above the interaction, so
the learner is not left without one; the underlying plan is still a template, and
the educator pack says so.

## What the queue is for

The next concept is chosen by prerequisite weight and by whether an existing
representation can be honestly extended — not by whether an animation would look
impressive. Percentages, ratio, linear equations and inequalities are next because
each has a representation the current models can extend (a proportion bar, a double
number line, a balance, an interval on a line); sorting is next in computing because
the search model already counts comparisons.
