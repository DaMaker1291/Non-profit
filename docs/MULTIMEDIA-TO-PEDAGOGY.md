# From inspected resource to changed lesson

Every technique below came from a resource this project actually opened (see
`docs/MULTIMEDIA-INSPECTION.md` and `lib/learning-research.ts`). For each one the
same six questions are answered, because "this looked good in a video" is not a
reason to change a lesson.

1. What does it help the learner understand?
2. Which misconception does it address?
3. Could OpenMind implement it more effectively?
4. Does the implementation work offline?
5. Does it suit a teacher-led classroom?
6. How will understanding be assessed afterwards?

A technique with no honest answer to (6) is not implemented; a technique that
needed artwork or a licence we do not have is recorded as backlog instead.

## T1 · Keep the instruction sequence on screen, with the executing step marked

**From** the Oak linear-search video (04:40–06:45): five instruction lines stay
visible for the whole demonstration and the executing one is emphasised in place.

1. It turns "linear search" from a definition into a state machine a learner can
   follow: you always know which rule is running and which comes next.
2. It addresses the belief that an algorithm is a paragraph to memorise. A learner
   who has read the list can say *where* a search is, not just what it is.
3. Yes: our model runs two algorithms on one list, so both sequences can sit beside
   the drawing and the highlighted step can be derived from the same progress that
   moves the cells — the picture and the list cannot disagree.
4. Yes. No network, no assets: two ordered lists of five strings and one index.
5. Yes. The list is what a teacher points at while asking "which step are we on?".
6. A learner is asked, before stepping, which instruction will run next
   (`searchGuidance` exposes the current step); the trickiest assessment is
   afterwards, in the practice serve, where the item asks about comparison counts.

**Implemented** in `lib/pilot-models.ts#searchGuidance` and
`components/search-model.tsx` (`data-search-instructions`, `aria-current="step"`).
The wording is OpenMind's own; nothing is reproduced from the video.

## T2 · Separate the item under the cursor from the items not yet touched

**From** the same segment: the cup being examined is lifted out of the row, and a
dashed "current" box marks its position.

1. It makes "the item being compared" a visible object, which is what a comparison
   is *about*.
2. It addresses off-by-one and "it checks them all at once" reasoning: at any moment
   exactly one item is being examined.
3. Yes: the dashed box is drawn from `searchGuidance`'s focus, and the position is
   printed as "item 3 of 14" — position, never cost.
4. Yes.
5. Yes — it is the thing to point at when a learner says the search has "found" an
   item it has only looked at.
6. The binary row distinguishes the middle it *last* checked (solid fill) from the
   middle it is *about to* check (dashed), which is the distinction a learner must
   hold to trace a search by hand.

**Implemented** in `components/search-model.tsx` (`.sm-current` dashed rect, one per
row). A real defect was found by measuring: the first cut reused one window index
for both facts, so the dashed cursor sat in a region the picture had not yet
narrowed to.

## T3 · Let the learner count; withhold the totals until the run ends

**From** the same segment, and it is the strongest design lesson there: **no
comparison count is ever displayed**. The learner counts the cups, and the cost is
named afterwards.

1. It makes cost something the learner *performs* rather than reads.
2. It addresses "binary search is faster" as a slogan: the number is only
   meaningful if the learner produced it.
3. Yes, and more sharply than the video can: the running line now says how many
   looks have been taken and how many items each algorithm has compared, and states
   that neither total is printed until the run ends. The finished block then gives
   both totals and says which won and why.
4. Yes.
5. Yes: the class can be asked to predict the total before the last step.
6. The finished sentence is the assessment ("one at a time took 9 looks, halving
   took 3 … one at a time needed fewer"), and the practice serve asks for counts.

**Implemented** in `lib/pilot-models.ts#searchProgress` (the live sentence no longer
contains "of 9 looks") and asserted in `npm run verify`.

## T4 · Redefine the whole in front of the learner

**From** the Oak fractions video (07:00): "Which is larger, 1/5 or 3/5?" answered
with 1/5 of a long bar beside 3/5 of a short one, closing with "paying attention to
what is defined as the whole is important".

1. It teaches that a fraction is a share *of a particular whole*, so fraction size
   is not absolute.
2. It addresses the over-generalisation our denominator work creates: after
   "bigger bottom, smaller piece", a learner can believe the size of 3/5 is fixed.
3. Partly. Our fraction line fixes the whole at exactly 1, so the model **cannot**
   show it; pretending otherwise would be a picture that lies. The trap is taught in
   prose in the authored lesson, and the gap is written into the model's
   `couldIntroduce` list so a reviewer sees it.
4. Yes (prose).
5. Yes — two strips of paper of different lengths is the whole demonstration.
6. A learner is asked which is larger, 3/5 of a short bar or 1/5 of a long one, and
   must name both wholes before answering.

**Implemented** as the fourth trap in `lib/lesson-plans.ts#fractions` (with the
French translation kept complete) and as a limitation in `lib/model-assumptions.ts`.
**Backlog:** a "change the whole" control on the fraction line.

## T5 · Run the fraction task backwards

**From** the Oak fractions video (11:40, a "Check" slide: given d = 1 whole, find
the lengths of 1/2, 1/3 and 5/6) and independently from the Dr Frost deck, which
ends its fractions unit on "Reverse Fractions of Amounts".

1. Going position → fraction is a procedure; going whole + fraction → length is the
   understanding. The return trip is where "a fraction is a number" is tested.
2. It addresses a learner who can place 3/4 on a line but cannot answer "3/4 of
   what is 12?".
3. Not yet in the model — the line has one fixed whole. Recorded as backlog, with
   the agreement of two independent UK resources as the reason it is worth building.
4. Would be, as pure arithmetic plus the existing line.
5. Yes.
6. A generated item asking for the whole given the part, which the numeric layer
   could serve today — that is the next step, not a claim about this build.

**Not implemented.** Recorded so the next pass does not have to rediscover it.

## T6 · Name the tempting wrong answer, not just the right one

**From** the Dr Frost deck ("Schoolboy Error: thinking the answer is …", showing the
wrong result of multiplying across mixed numbers).

1. It tells a learner who made the mistake that the mistake is anticipated, and
   exactly what it was.
2. It targets the specific slip rather than the concept in general.
3. OpenMind already does this better: a per-option note is returned with the grade
   for the option the learner actually picked (`wrongNotes` → `choiceNote`), which
   needs no animation and survives a paper print.
4. Yes — the note is a string in the item.
5. Yes, and on paper.
6. The note itself is the feedback; the assessment is whether the same slip recurs
   in the repair serve.

**No new code.** Confirmed as an existing strength rather than re-implemented.

## T7 · Make the printable do the interaction's job, not the same page

**From** the Jaques "Fractions of Amounts" worksheet: three named sections, one
word problem, answers on a separate page with notes for the adult.

1. It gives a class without devices the same relation (divide by the denominator)
   in a sequence that gets harder.
2. It addresses unit-fraction-of-an-amount, not comparison — its limit.
3. Our packs' printable alternative is checked against what a real sheet asks: a
   sequence with a named challenge and an answer key kept off the learner's page.
4. Yes, by definition.
5. Yes — it is the classroom artefact.
6. The teacher's answer key plus the model's `assessment` note in the pack.

**Implemented** as a review of the packs' printable field (regenerated), not as
copied items.

## T8 · Name the current convention on the drawing

**From** PhET's CCK: DC, whose display panel makes the learner choose
Electrons or Conventional.

1. It removes an ambiguity the learner otherwise resolves wrongly: which way is the
   arrow, and why do adults say electrons go the other way?
2. It addresses "the arrows are electrons" and its cousin "current has a sign that
   belongs to the charge".
3. Yes: the direction is derived from the terminal the cell is drawn with
   (`topWireCurrentDirection()`), the plates carry ＋ and −, and a disclosure
   separates the two descriptions and says they are not two different currents.
4. Yes — text and two triangles.
5. Yes: the ＋/− plates are what a teacher points at.
6. The misconception is not in the item bank (it is a notation convention, not a
   belief about circuits), so it is assessed by the teacher questions in the pack,
   not by a marked item. That limit is stated rather than papered over.

**Implemented** in `lib/interactive-models.ts#CURRENT_CONVENTION`,
`lib/model-assumptions.ts` and `components/circuit-model.tsx`, with the per-bulb
p.d. added so the arithmetic can be checked by Kirchhoff's loop rule.

## T9 · Put the section structure on the screen

**From** both Oak lessons: persistent section headers ("Using fractions to describe
diagrams", "Check", "Fractions as numbers on the number line"; "Describe how
linear search finds an item").

1. It tells a learner where they are in the lesson without a progress bar.
2. It reduces the "I am lost" failure that reads as "I cannot do this".
3. Partly: OpenMind's read stage is already ordered and each model card is numbered
   in steps. No new furniture was added for this.
4. Yes.
5. Yes.
6. Not separately assessed; the order itself is asserted by `npm run verify:lesson`.

**No new implementation beyond the numbered steps already in the search card.**

---

# The multimedia quality standard (Phase 5)

Not every lesson needs every stage; the standard is that each stage that appears
is *appropriate*, and that no stage is missing for a reason nobody wrote down.

| Stage | Where it lives | Status for the nine modelled concepts |
|---|---|---|
| Learning objective | `lib/model-teaching.ts` (action-first, per concept) | All nine. |
| Prediction or prior-knowledge check | the gate in `components/model-shell.tsx` — choice, or a describe box that marks nothing | Seven choice; two describe (`atoms-elements`, `cells`). |
| Exploration | the interaction itself, opened only after the prediction | All nine. |
| Explanation | authored lesson idea paragraphs; the model's reveal says why | All nine (two still on the supplemental plan: `atoms-elements`, `algorithms-search`). |
| Guided practice | the worked example and the faded "we do" in the lesson | All nine. |
| Independent application | the practice door at the end of the lesson | All nine. |
| Transfer | repair serves and the spaced queue | Served by the engine, not by the lesson page. |
| Retrieval | the next-step card and the review queue | Not asserted on the lesson page; stated here rather than claimed. |

Two rules the standard adds, both now true in the code:

- **A prediction may be revised without penalty.** Once the model is open it stays
  open; changing the answer does not re-shut it. Asserted in the DOM
  (`data-model-slot` stays `open`) and observed live.
- **Explanations are not walls.** The model's own explanation is one reveal
  paragraph plus a disclosure; the lesson's idea is 4–6 short paragraphs with its
  own typographic rhythm. A review that finds either of these too long is a real
  finding and should be recorded as one.
