# Multimedia inspection record

This is the operator's record of what was **actually opened**, for the five pilot
concepts. The machine-checked facts live in `lib/learning-research.ts` (one record
per source, with a depth the validator refuses to overstate); this document adds
the judgement fields a person needs before reusing anything — usefulness,
permission to reuse, permission to adapt, and what it was used for.

The rule this document exists to keep: **a description is not an inspection.**
Reading a search result, a summary or a transcript is recorded as such and never
promoted. `npm run research-check` enforces the ladder; this file must not claim
more than the register does.

## What was inspected, and how

| Resource | Creator / licence | Depth reached | What was actually done |
|---|---|---|---|
| Linear search lesson video | Oak National Academy / OGL v3.0 | `video-segment` | Played 04:40–06:45 of a 20:31 video in a browser with the British English caption track on; frames paused at 04:53 and 06:31 and viewed. |
| Linear search starter and exit quizzes | Oak National Academy / OGL v3.0 | `asset` | Both quizzes read in full from the lesson's own page data — 12 questions with their answer keys and authored feedback. Two exit-quiz questions answered in the live player ("Correct / Well done!"). |
| Checking and securing understanding of fractions (video) | Oak National Academy (Ms Coo) / OGL v3.0 | `video-frames-sampled` | Oak's `mux-player` did not initialise in this browser, so four frames were decoded from the lesson's own signed video stream — 02:30, 07:00, 11:40, 16:40 of 23:11 — and viewed. The video was not watched and its audio was not heard. |
| Year 7 Fractions (PowerPoint) | Dr J Frost / Dr Frost Learning | `slides-text` | The .pptx downloaded (1.3 MB), opened as a package and read slide by slide: 28 slides, 66 embedded media files. No slide was rendered and none of the 66 media files was inspected. |
| Fractions of Amounts, Year 3 (worksheet) | Mini Minds Hub / Jaques of London | `asset` | The 2-page PDF downloaded and read in full, both pages, including the answer key and the adult notes. |
| Circuit Construction Kit: DC | PhET, University of Colorado / CC BY-NC 4.0 | `interactive-tested` | Launched, entered the Intro screen, added a battery, a bulb and three wires through the sim's own controls, read the rendered frame. **No closed circuit was built.** |
| Electric current, KS3 lesson video | Oak National Academy / OGL v3.0 | `transcript` | The published caption track read in full — 229 captions, 3,751 words. The video was **not played** and its audio was not heard. The slide deck and worksheet download route returned an HTML page, so neither was examined. |
| Atoms and elements, KS3 lesson video | Oak National Academy / OGL v3.0 | `transcript` | The caption track read in full — 213 captions, 3,059 words. Dalton's indivisible sphere is the lesson's model; the words electron, proton, neutron and nucleus do not occur. Video not played; slides and worksheet not obtained. |
| Animal cell structures and their functions, KS3 lesson video | Oak National Academy / OGL v3.0 | `transcript` | The caption track read in full — 310 captions, 4,668 words: membrane/cytoplasm/nucleus/mitochondria functions, and a long 2D-versus-3D model evaluation. Video not played; slides and worksheet not obtained. |
| Oak KS3 starter and exit quizzes — electric current, atoms and elements, animal cells | Oak National Academy / OGL v3.0 | `asset` | 12 items per lesson (6 starter, 6 exit): every stem, option, marked key and feedback read from the page's structured data. Not a rendered quiz, and no learner answered them. |

Three depths are easy to confuse, so the register keeps them apart. `video-segment`
is a **timestamped stretch that was played**; `video-frames-sampled` is a set of
**decoded frames**, with the timestamps recorded and the audio stated as unheard;
`slides-text` is a deck's **text extracted**, with the visuals and embedded media
recorded as not rendered. `npm run research-check` refuses either of the weaker
rungs if the record does not carry that evidence.

## Per-source judgement

**Oak linear-search video — useful, reference only.**
Discovery: found through the unit page for "Searching and sorting algorithms".
Usefulness: high. It is the only resource inspected that shows an algorithm
*executing* — instruction list on screen, executing step emphasised, the item under
the cursor lifted clear of the row — and it deliberately never prints a comparison
count. Permission to reuse: not on this project's cleared list (OGL v3.0 permits
reuse with attribution, but OpenMind's content is CC BY-SA 4.0 and this project
has chosen a stricter cleared set). Permission to adapt: no — nothing is copied.
Intended application: the technique is re-implemented in `components/search-model.tsx`
in OpenMind's own wording and drawing. Limitations: three of twenty-one minutes
watched, audio unheard (muted, captions read), attached slides and worksheet not
opened.

**Oak linear-search quizzes — useful, reference only.**
Discovery: the same lesson. Usefulness: high, and unexpected — the exit quiz
assesses *worst case* by asking for a number of comparisons ("how many items would
need to be searched … to confirm if 'fig' is in the list"), which is the exact
skill our model now makes the learner perform. Permission: reference only.
Intended application: evidence that counting comparisons is an assessable
objective at KS4, and that best/worst case are taught as separate ideas before
any complexity language. Limitations: the live player shows "Well done!" for a
correct answer without printing the authored feedback, so the wrong-answer
feedback path was not observed; the matching question could not be completed
without pointer-drag.

**Oak fractions video — useful, reference only.**
Discovery: a search for an Oak fractions lesson with a video. Usefulness: high for
two ideas the project did not have (a redefined whole; the reverse task). Permission
to reuse: not cleared; permission to adapt: no. Intended application: the "which
whole?" trap is now authored in `lib/lesson-plans.ts#fractions`; the reverse task
is recorded as backlog rather than implemented. Limitations: four sampled frames,
audio unheard, player not operable, worksheet and slides attached to the lesson not
opened (the page reports a worksheet asset its pupil view never links).

**Dr Frost fractions deck — useful as structure, reference only.**
Discovery: a search for PowerPoint files on fractions. Usefulness: moderate. It is
a whole unit in one deck, with a worked-example → check → exercise rhythm and a
"Schoolboy Error" slide that names the tempting wrong answer. Permission to reuse:
its terms allow printing and classroom modification with attribution but forbid
commercial use and do not license redistribution — not a Creative Commons licence,
so nothing may be embedded or adapted into CC BY-SA. Intended application: a check
on the shape of our own lesson sequence, and independent corroboration that
"reverse fractions of amounts" belongs in the same unit as "fractions of amounts".
Limitations: text only; the 66 images and any animation were not rendered, and
several answers exist only as animation steps.

**Jaques fractions worksheet — useful as a printable model, reference only.**
Discovery: a search for a downloadable fractions worksheet. Usefulness: moderate
and narrow. It is one relation (a unit fraction of an amount is a division) in a
deliberate sequence — warm up, practise, stretch, one word problem — with answers
on a separate page. Permission: "free to print for home and classroom use"; no
right to adapt or redistribute. Intended application: a reality check on the
printable alternative in the fractions educator pack. Limitations: no number-line
or comparison items, so it cannot address the denominator misconception.

**PhET CCK: DC — useful as a design reference, reference only.**
Discovery: the circuit-misconception dossier. Usefulness: high for one thing only —
it makes the current convention an explicit choice (Electrons / Conventional) where
our model silently picked one. Permission: CC BY-NC 4.0, so not adaptable into a
CC BY-SA product. Intended application: the convention is now labelled on our
drawing and explained in a disclosure. Limitations: **no closed circuit was built** —
components could not be dragged into contact in this automation — so no current was
observed and nothing in our model has been checked against a PhET measurement.

## What was NOT inspected, and why

These are recorded as gaps, not as work done.

| Resource | State | Why |
|---|---|---|
| Oak worksheet PDFs and slide decks | **blocked** | The pupil lesson view links neither; the teacher download route answered 404 without a teacher account. Not guessed at, not described from memory. |
| Khan Academy fractions video | **blocked** | The embedded YouTube player returns configuration error 153 in this automation, and the watch page stops at a consent wall that was not accepted on the user's behalf. The transcript is already recorded at `transcript` depth and stays there. |
| Oak slides and worksheets for cells, atoms and electric current | **blocked** | The lesson pages were read, but the download route returned an HTML page rather than a PPTX/PDF in this pass. Recorded as not examined in each transcript record; not described from memory. |
| Any PowerPoint other than the Dr Frost deck | not attempted | One deck inspected is enough to establish the format's teaching structure; a second would not change a decision. |
| Practical demonstrations (lab video) | not attempted | None found that is openly licensed and shows a series circuit under measurement; PhET was the substitute and it did not reach a closed circuit either. |

## Honest totals

- Educational video segments actually viewed: **2** (Oak linear search 04:40–06:45;
  Oak fractions, four sampled frames).
- Lesson **transcripts** read in full: **3** (physics 3,751 words; chemistry
  3,059; biology 4,668). For all three, the video was not played and the audio
  was not heard — the register says `transcript`, not `video-segment`.
- Third-party interactives operated: **1**, partially (PhET CCK DC: components
  added, no closed circuit).
- Worksheets inspected: **1**.
- Slide decks inspected: **1**.
- Quiz/assessment assets read in full: **4** lesson sets — the linear-search lesson's
  starter and exit quizzes, plus 12 items each for electric current, atoms and
  elements, and animal cells. The last three were read as embedded data, not as a
  rendered quiz, and none was answered by a learner.
- Audio evaluated: **0**. Both videos were watched muted; the narration was read
  from captions or transcript, and no record claims otherwise.
- Educator reviews completed: **0**. Learner tests completed: **0**.

The broader research objective is **not** complete. Physics, chemistry and
biology now each have one lesson whose published transcript and 12 assessment
items were read in full, but **no frame of those videos was watched, no audio was
heard, and no worksheet or slide deck was examined**. A transcript is what was
said and a quiz is what was asked; neither is what was shown. The diagrams,
demonstrations and practical detail remain uninspected, and that is the next
pass's work.
