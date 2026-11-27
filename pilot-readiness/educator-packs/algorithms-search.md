# Educator review pack — algorithms-search

> **STATUS: NOT REVIEWED.** No subject teacher has read this concept. Nothing in this pack is an approval, and the lesson is not an approved course. Reviewer: ____________________  Role: ____________________  Date: ____________

**Subject:** computing · **Interaction:** `search-model` · **Browser evidence:** recorded 2026-11-25 · **Learner testing:** none

## The question this review answers

Not "is the interface pleasant". **Would you use this to teach the concept, and what would you change before using it with your pupils?** Correct the subject accuracy first; then the level, the wording, and the model's simplifications.

## 1. What the learner is meant to be able to do

Choose between checking one at a time and halving the list for a particular list and target, and justify the choice with the number of looks.

> **The lesson plan behind this concept is the generated supplemental fallback, not an authored sequence.** The objective and the prediction above come from the model's own teaching frame; the sequence in section 6 is composed from the concept note, so treat its order and wording as unreviewed structure rather than as an authored lesson.

**The prediction the learner must commit to before touching the model:** The list is sorted and has 14 items. The item you want is the FIRST one. Which finds it with fewer looks?

- Halving — it is always faster
- **One at a time — it is the first item** *(the answer the model shows)*
- They take the same number of looks

**What the reveal says once a choice is made:** One at a time: the first item is found in one look, while halving starts in the middle and needs three. Halving wins on the long search and loses on this one, so 'binary is better' is not a rule — it depends on the list and on what you are looking for.

**What the learner does with it afterwards:** Pick two targets, predict which algorithm wins each, then step both and compare with your prediction.

**Starting point the lesson assumes:** Looking for a word in a dictionary by reading every page is linear search. Opening to the middle and choosing a half is binary search — far fewer steps, but only because the book is already in order.

## 2. Research basis

| Source | Depth | Licence / reuse | What was inspected |
|---|---|---|---|
| Oak National Academy — Binary search — KS4 Computer Science (OCR) lesson (https://www.thenational.academy/teachers/programmes/computing-secondary-ks4-gcse-ocr/units/searching-and-sorting-algorithms/lessons/binary-search) | `metadata` | Oak National Academy terms (openly available, not CC); reference-only | The lesson overview: learning outcome, the four key learning points, keywords, the 'common misconception' block ('A binary search can be performed on any data') and the teacher tip to run a binary search on an unordered list to show why it fails. The downloadable slide deck itself was NOT opened. |
| Oak National Academy — Comparing searching algorithms — KS4 lesson (https://www.thenational.academy/teachers/programmes/computing-secondary-ks4-gcse-ocr/units/searching-and-sorting-algorithms/lessons/comparing-searching-algorithms) | `metadata` | Oak National Academy terms; reference-only | The lesson overview and its quiz items: the key points ('the algorithm you use depends on the data and context', 'coding a binary search is more complex'), and the three sample questions with answers, including 'linear search works on both sorted and unsorted lists'. |
| Carnegie Mellon University — Lecture 6: Binary Search (15-122 Principles of Imperative Computation) (https://www.cs.cmu.edu/~15122-archive/n17/lec/06-binsearch.pdf) | `asset` | Course material (institutional); reference-only | The algorithm statement and the cost argument in the notes' text: the sorted-array requirement, halving each iteration, and the c·log2 n bound with the n = 13 → 16 rounding example. |
| PALNI Pressbooks — Search — An Open Guide to Data Structures and Algorithms (https://pressbooks.palni.org/anopenguidetodatastructuresandalgorithms/chapter/search) | `section` | Open textbook (Pressbooks, CC); reference-only | The Linear Search and Binary Search sections: the O(n) worst case, the sorted-order precondition and the sentence that the requirement is 'not cost-free'. |
| CS Unplugged — CS Unplugged copyright and licence page (https://csunplugged.org/en/copyright/) | `discovered` | not established (page unavailable); reference-only | The licence page returned HTTP 404, so the terms could not be established. Unestablished terms are treated as non-reusable. |
| Mrs Holborow — Linear search (lesson video and transcript) (https://www.thenational.academy/pupils/programmes/computing-secondary-year-10-gcse-aqa/units/searching-and-sorting-algorithms/lessons/linear-search/video) | `video-segment` | Open Government Licence v3.0 (Oak National Academy); reference-only | The complete published transcript, followed by the segment 04:40–06:45 of the same 20:31 video actually played in a browser with the 'British English CC' subtitle track on, and paused for frame inspection at 04:53 and 06:31. In the 04:53 frame: a purple title bar reading 'Describe how linear search finds an item', a slide headed 'Each number is hidden under a cup. The cups are arranged in a random order. From the cups, the number to find (search item) is 126.', nine red cups labelled cup 1 to cup 9 in a row, a five-step instruction list underneath, and the presenter in a picture-in-picture inset. In the 06:31 frame: cup 4 lifted out of the row above a dashed box labelled 'current' and showing the value 9, with step 3 ('Compare the item at the current position to the search item') emphasised in the list while steps 1–2 are greyed. |

**Depths below a full read:** `oak-binary-search-ks4` (metadata), `oak-comparing-searching` (metadata), `csunplugged-licence` (discovered). Their claims are limited to what that depth supports.

## 3. Design decision

Count the looks, do not describe them. The learner steps linear and binary search on the same fourteen-item list and reads two counts; binary refuses to start on an unsorted list, so the precondition is experienced as a failure rather than quoted. The conclusion is deliberately 'it depends': a target near the front of a short list is found in one look by the 'worse' algorithm, and sorting first is work.


### Misconceptions the lesson is built to refute

- **binary-on-any-data** — Binary search can be run on any data. _(oak-binary-search-ks4)_
- **binary-always-better** — Binary search is always the better choice. _(oak-comparing-searching)_
- **linear-needs-order** — Linear search needs a sorted list. _(oak-comparing-searching)_
- **halving** — Each step of binary search halves the items still to check. _(cmu-15122-binsearch)_
- **sorting-is-free** — The sorted list costs nothing to have. _(pressbooks-open-guide-search)_

## 4. The model: assumptions and limits

**Intended level:** 14–16 (linear and binary search, algorithm comparison)

**Assumptions (scientific/mathematical):**

- The list is fourteen integers; linear search scans from the start.
- Binary search requires a sorted list and reports the window after each comparison.
- Cost is counted in comparisons only.
- Sorting is not modelled: the sorted list is given.

**What it cannot show:**

- No sorting algorithm is run, so the cost of producing the sorted list is stated but not shown.
- No duplicate values, no missing-value edge cases beyond the target absent.
- One list size, so the growth rate is counted rather than measured.
- No implementation or code trace is shown.

**Misconceptions it addresses:**

- Binary search works on any data.
- Binary search is always the better choice.
- Linear search needs sorted data.
- Each binary step halves the items still to check.

**Misconceptions it might accidentally introduce — please check these first:**

- That comparison count is the only cost that matters.
- That binary search is always implementable, when the data may not be sortable or randomly accessible.

## 5. What was checked in a browser

Viewport(s): 1280×900 desktop and 390×844 mobile

| Check | What was done | What the page showed |
|---|---|---|
| four-steps | Opened /learn/computing/algorithms-search and read the card's structure. | Four labelled blocks — choose a number, both algorithms on it, step through, start again — instead of fourteen target buttons wrapping above the drawing. |
| target-select | Changed the target from 55 to 3 with the select, then stepped to the end. | The run reset, and the finished line reads 'one at a time took 1 look, halving took 3. One at a time needed fewer looks here, because the target is near the front.' |
| live-not-final | Read the readout before stepping, then after one step. | At zero: 'Nothing has been checked yet. Step once to take the first look.' After one step: 'This run so far — one at a time: 1 of 9 looks; halving: 1 of 3 looks.' No completed comparison in either — the old card printed the totals before a single look was taken. |
| finished | Stepped to the end for target 55. | Live line reads 9 of 9 and 3 of 3; a separate finished block then says 'Finished: one at a time took 9 looks, halving took 3. Halving needed fewer looks for this target.' Step is disabled, Start again is enabled. |
| first-item | Searched for 3, the first item of the sorted list. | One at a time found it in 1 look, halving in 3, and the finished line says one at a time needed fewer — the count refutes 'binary is always better' on the screen itself. |
| prediction | Chose 'One at a time — it is the first item' above the model. | data-model-predicted went to correct and the reveal printed; the prediction sits above the controls, the slot starts locked with zero controls, and choosing an option is what opens it. Found by looking: the first version rendered the three options as solid primary buttons, which read as three actions rather than three choices. |
| labels | Measured the SVG's label type at 1280. | The label rule was scoped to the circuit model, so the search model's labels rendered at 17 px — larger than the 28 px cells beside them — and the last one ran out of the viewBox and was cut off mid-sentence. Scoped, shortened and re-checked. |
| unordered | Pressed 'Shuffle the list' and read the halving row before stepping. | 'halving: cannot start — the list is not in order'; no finished comparison; the live line still says nothing has been checked. The precondition is refused with its reason rather than reported as zero looks. |
| mobile | 390 px viewport, measured page, card and digits. | Page width 390 with no sideways scroll. The first measurement had the drawing at 298 px, which puts each digit at about 8 px; it now keeps its own width inside a scrolling wrapper (340 px, digits 11 px) and the page still does not scroll sideways. |
| instructions | Read both instruction lists before stepping, after one step, and after two. | Five instructions per algorithm with the executing one emphasised by weight and a left rule. Before any step the highlighted instruction is 'Start at the first item'; after two looks it is 'Compare the item at the current position', with the two set-up steps ticked. The note under each list names the item under the cursor ('Comparing item 3 (12) with the number you want'). |
| cursor | Counted the dashed 'current' boxes after two looks on target 55. | Two — one per row — around item 3 (12) for one-at-a-time and item 9 (55) for halving, which is the item the third look actually takes. The filled middle shows the item last compared, so 'the one I just checked' and 'the one I am about to check' are drawn differently. |
| count-is-theirs | Read the running line after two looks and the finished line after nine. | 'You have taken 2 looks: one at a time has compared 2 items; halving has compared 2 items. Neither total is printed until the run ends.' No 'of 9' anywhere before the end; the totals appear only in the finished block. |
| confidence | Chose 'I'm confident', then the correct prediction, and read the line under the verdict. | 'You were confident and the model agrees. That is the state to notice — and it is evidence because the model was used, not because you said so.' data-model-confidence=confident; nothing is sent anywhere. |
| mobile-instructions | 390 px viewport, measured the two instruction lists and every control in the card. | The lists stack into one 298 px column, 12.5 px type, the current row marked by weight and a 2 px accent rule rather than colour alone; page 390 with no sideways scroll; every button and the select at least 44 px high. |
| keys-contrast | Focused 'Take one look' and pressed a real Enter key; measured contrast of the highlighted instruction and the dashed cursor. | Enter advanced the run (data-search-taken=1) and the executing instruction moved to step 3, so the button works from the keyboard and not only from a script. Highlighted instruction text 11.5:1; dashed cursor stroke 6.31:1 against the surface; zero animations in the card, so a reduced-motion preference has nothing to suppress. |

**Not checked:**

- The shuffled list was checked before stepping only; it was not stepped to the end in the browser (the unsorted totals are asserted in the suite).
- A real screen reader was not driven through the four steps; aria-current="step" is in the DOM but was not heard.
- Only Chromium was used. Firefox and Safari were not tested.
- The instruction sequences were checked against the model's own state, not against a teacher's reading of the wording — that is what the educator review is for.

## 6. The teaching sequence

_This plan has no authored sections; the page groups its idea paragraphs. Treat the sequence as unreviewed structure._

Linear search checks each item — works on anything, slow on big data. Binary search halves the candidates each step — 1,000,000 items found in ~20 steps — but needs sorted data. The lesson: algorithm choice can beat any amount of hardware speed. Sorting first is often worth it.

This idea is the step before Sorting algorithms. Keep its definition and its check beside you when those topics use it.

For binary search, keep a low and high index, inspect the middle, and discard the half that cannot contain the target. Stop when the range is empty or the target is found.

Binary search requires sorted data; if the list is unsorted, the comparison tells you nothing about which half to discard. Count the steps: 1,000,000 items should take about 20 halvings.

## 7. Questions to ask and traps to expect

- **Runs binary search on an unsorted list because it is faster than linear search.** The halving step depends on order. In an unsorted list, the middle value does not tell you which side the target is on, so the search can discard the answer.
- **Tests one example and declares the program correct.** One input cannot exercise every branch. Test a normal case, a boundary case and an invalid case; a program that works for 3 may still fail at 0, at the last item, or on empty input.
- **Chooses a data structure or algorithm by habit rather than by cost.** The right structure changes how work grows: a list scan is O(n), a dictionary lookup is typically O(1), and a nested loop is O(n²). State the operation the program performs most often, then choose for that operation.

## 8. Teacher run-of-show

### Before anyone touches the model

1. Write the fourteen numbers on the board and find the first one by both methods in front of the class, counting the looks out loud.
1. Then shuffle the cards and try halving: the point is that it cannot start, not that it gives a wrong answer.

### Questions to ask while it runs

- What does halving need to be true about the list before it can start?
- When is checking one at a time the better choice?
- What work is missing from our count when we say halving took three looks?

### One guided activity

Pairs play the algorithm on paper with a row of cards, one learner turning cards and the other recording the number of looks; they then swap roles for a target near the end.

### With no device

A strip of 14 sorted numbers to cut into cards, a tally sheet for looks, and three targets to find by both methods.

### What to look for

A learner who answers 'halving, because it is faster' for the first item has the belief the model exists to refute. Ask for the count on this list, then on a target near the end.

### Where to go next

- Sorting algorithms and why order costs work.
- Big-O growth, once the counting is secure.

## 9. Teacher notes and printable alternative

- The same plan supplies the printed worksheet path (`lib/lesson-print.ts`), which carries no answers; the classroom run-of-show is derived from the same plan (`lib/classroom-session.ts`).
- Guided practice, independent assessment and the transfer item are rendered on the learner page from `lib/lesson-assessment.ts`; they are not duplicated in this pack, so there is one version of each question.
- The prose lesson and its practice do not depend on the interaction. If the model is unavailable, the lesson still teaches; the model is the refutation, not the content.
- **Not claimed:** that the interactive model has an offline equivalent. There is no printable substitute for manipulating the model, and this pack does not pretend otherwise.

## 10. Reviewer checklist

- [ ] Subject accuracy: every factual and mathematical statement is correct.
- [ ] Level: the wording and the arithmetic suit the stated age band.
- [ ] Assumptions: the simplifications are acceptable for this level, and stated plainly enough.
- [ ] Limitations: nothing the model cannot show is implied to be false.
- [ ] Misconceptions it might introduce: each one is either fixed or acceptable with a teacher's framing.
- [ ] Misconception coverage: the named beliefs are the ones you actually see in pupils.
- [ ] Questions: the traps are real wrong moves, not invented ones.
- [ ] Accessibility: the readout carries the meaning; keyboard and mobile use are adequate.

**Decision:** approve for this scope / request revisions / reject.

**Changes required before classroom use:**

1. 
2. 
3. 

