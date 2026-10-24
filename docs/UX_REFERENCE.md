# What the UK classroom products do, and what OpenMind should take from them

A survey of the platforms a UK secondary learner or teacher actually meets, and a
gap list against this product's own screens. It exists because "make it easier to
use" is not a specification: every claim below is either a page read or marked as
inference, and every gap names the file that would have to change.

## 1. Method, and what this is not

- **Not a crawl of every page of every site.** Most of these products put their
  real navigation behind a school login, so the pages that can be read are marketing
  pages and help centres. Where a help centre documents a flow (Educake, Sparx,
  Quizlet, Anki, Formative, Socrative, Wayground, Google Classroom, Teams, Oak) the
  flow is reported as documented. Where it does not (MathsWatch, ClassCharts,
  HegartyMaths, Kahoot!'s reports) this document says **not verified** rather than
  inventing a screen.
- **Tap counts are only quoted where a source supports one.** A "3 taps to the first
  question" claim derived from counting menu items is an inference, and is labelled.
- **Two products are legacy or historical.** HegartyMaths has been merged into Sparx
  Maths; Tassomai's dashboard description is from 2018. Both are marked.
- **The point is the pattern, not the product.** A pattern earns a place here only
  if it changes a decision in this repository (see §4).

## 2. The four clusters

| Cluster | Products surveyed | What they are actually good at |
|---|---|---|
| **Homework & practice** | Sparx Maths / Science, Educake, Dr Frost, Hegarty (legacy), MathsWatch, Tassomai, Seneca | the task loop: assigned work up front, retry with support, completion visible to the teacher |
| **Class management** | Satchel One, ClassCharts, Google Classroom, Teams for Education | assignment scope (class / group / individual) and due dates, gradebooks |
| **Revision & content** | Save My Exams, BBC Bitesize, GCSEPod, Cognito, Corbettmaths, Physics & Maths Tutor, Oak, MME, Maths Genie | curriculum taxonomy, exam-board mapping, question + mark-scheme pairing |
| **Response & formative** | Kahoot!, Quizizz/Wayground, Nearpod, Socrative, Formative, Blooket | a teacher dashboard read in ten seconds, and drill-down to one question or one learner |

## 3. The patterns worth having, with the evidence

### 3.1 Assigned work is the first thing a learner meets — not the last

Educake's own help page: teacher-set quizzes appear on login, in orange, each
labelled with subject, quiz name, assigning teacher and due date; **one tap** starts
one, and when there are many the page shows those due next and a "view all" for the
rest (<https://help.educake.co.uk/how-do-i-find-my-homework>). Satchel One's student
help describes the same shape as a "To-do list and calendar"
(<https://help.satchelone.com/en/articles/4335001-common-questions-for-students>).
Teams and Classroom both add navigation before work: class → Assignments → card
(<https://support.microsoft.com/en-us/education/assignments/turn-in-an-assignment-in-microsoft-teams>).

The EEF's feedback guidance is the reason this matters beyond layout: useful
feedback gives "specific information on how to improve" and pupils need an
**opportunity to act on it** (<https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback>).
A due date somebody else set is the most actionable thing on a learner's screen.

### 3.2 Separate "what I owe" from "what I should practise"

Educake keeps teacher-assigned work prominent and puts self-directed revision in a
separate progress breakdown and "revision wizard"
(<https://help.educake.co.uk/updates-to-the-student-view-of-educake>). Collapsing the
two produces the worst of both: a recommendation that looks like an obligation, or
homework that looks optional.

### 3.3 A retry-and-help loop inside the question

Sparx Maths gives tailored worked examples, hints for near-misses and further
attempts; Sparx Science's "I don't know" path teaches and then retests
(<https://support.sparxmaths.com/en/articles/345064-helping-your-students-to-make-the-most-of-sparx-maths>).
Save My Exams documents attempt → reveal the mark scheme or model answer → self-mark
(<https://www.savemyexams.com/learning-hub/sme-articles/how-to-use-exam-questions/>).

### 3.4 Two groupings of one question bank

Cognito serves the same content by topic **and** by past paper, with a by-year view
as an alternative (<https://cognito.org/courses/gcse/biology-triple/aqa/higher/past-papers/by-topic>);
Physics & Maths Tutor groups by paper, topic and grade
(<https://www.physicsandmathstutor.com/maths-revision/gcse-questions-edexcel/>).
One taxonomy is not enough because "revise this topic" and "practise this paper" are
different tasks.

### 3.5 The taxonomy is visible on the page, not hidden in a filter

Save My Exams splits revision notes by **exam board and Foundation/Higher tier**
(<https://www.savemyexams.com/gcse/maths/revision-notes/>); Cognito puts
level → board → tier in the page itself
(<https://cognito.org/courses/gcse/biology-triple/aqa/higher/notes>). A learner should
not have to remember which tier they chose.

### 3.6 Sequence, not only catalogue

Oak numbers a unit within its sequence ("2 of 13") and offers Previous / Next / View
all (<https://www.thenational.academy/teachers/programmes/biology-secondary-ks4-higher-aqa/units/dna-and-the-genome/lessons>).
Corbettmaths is the opposite end — a flat named-topic index
(<https://corbettmaths.com/contents/>). Both are needed: one for direction, one for a
learner who already knows what they came for.

### 3.7 Teacher dashboards: one signal first, then drill down

ONS data-visualisation guidance says to "put the most important insights at the top
or in the most prominent position", and warns that dashboards make users do the work
of interpreting data
(<https://service-manual.ons.gov.uk/data-visualisation/guidance/dashboards>).
Socrative's live results lead with participant count, completion and class average;
its reports name the most and least correctly answered question
(<https://help.socrative.com/en/articles/2155302-reports>). Nearpod opens an activity
report to see commonly missed answers and misconceptions
(<https://nearpod.com/blog/teacher-reports/>). Formative's totals grid makes question
and learner drill-down one click each, with a side panel that steps between them
(<https://help.formative.com/en/articles/6198532-view-and-score-responses>).

The EEF's Check. Adapt. framing is the vocabulary a teacher actually needs:
"many misunderstand, so pause and fix" / "some are unsure, so adapt support" / "most
understand, so extend"
(<https://educationendowmentfoundation.org.uk/news/checking-for-understanding-that-leads-to-action-adaptive-teaching>).

### 3.8 Mastery per topic, with exposure distinguished from accuracy

Tassomai's (2018) dashboard described dot size as exposure and colour as accuracy,
with a definition of "mastered" (three correct in a row)
(<https://www.tassomai.com/blog/the-new-teacher-dashboard>). Seneca reports per-topic
and per-assignment gradebooks
(<https://help.senecalearning.com/en/articles/17348467-what-reports-are-there-on-seneca-for-teachers>).
The lesson for this product: **a count of what has been measured must never be
rendered as a rate**, which is already the rule in the evidence layer.

### 3.9 Colour is never the only channel

Formative and Socrative both pair colour with symbols or status words; Formative's
accessibility page documents keyboard use, screen readers, text-to-speech and
contrast (<https://help.formative.com/en/articles/9858792-accessibility-on-formative>);
Wayground's statement documents read-aloud, text size, spacing and a dyslexia font
(<https://help.wayground.com/support/solutions/articles/158000404015-wayground-accessibility-and-inclusion-statement-including-vpat->).
No reviewed product documents an offline assessment mode — which is where this
product's service worker is ahead, not behind.

### 3.10 Mobile parity is a documented failure of the competitors

Satchel's own help says its app "may show fewer tasks than the website"
(<https://help.satchelone.com/en/articles/4335001-common-questions-for-students>) and
Quizlet's flashcard help says progress does not sync across devices on the described
flow (<https://help.quizlet.com/hc/en-us/articles/360030988091-Studying-with-Flashcards>).
Educake redesigned its student view explicitly for phones and to cut clutter
(<https://help.educake.co.uk/updates-to-the-student-view-of-educake>).

### 3.11 Gamification is feedback, not measurement

Sparx uses XP and rewards; Tassomai separates usage from mastery. A streak is
evidence of attendance, and this product's whole claim is that it reports what was
**proved**. Nothing in the survey argues for adding streaks.

### 3.12 Access is stated before effort is invested

Save My Exams states that one exam question is free and the bank needs a
subscription; GCSEPod states full access comes with a subscribing school. This
product's equivalent statement is the ephemeral-store disclosure on the account
step, which follows the same rule: say it before the learner invests.

## 4. Gap analysis against this product

| Pattern | OpenMind today | Verdict |
|---|---|---|
| Assigned work first | `components/learner-home.tsx` rendered the decision, the day, the counts, the goal and the answers **before** `AssignmentsPanel` — so homework due tomorrow was the last thing on the page | **fixed here** (see §5) |
| Obligation ≠ recommendation | the assignment panel is a separate, labelled section with its own due date; the decision engine (`lib/decision.ts`) does not know about assignments | **kept**, now ordered correctly |
| One primary action | `NextStep` is the only primary button; the assignment panel's control is a ghost button | already held; `verify` asserts it |
| Attempt → reveal → next | `app/learn/[subject]/[concept]/page.tsx` serves one question, marks it, and explains before continuing | already held |
| Mark scheme / worked answer | the marking explanation is rendered through `lib/math-text.ts`, and hints exist | already held |
| Two groupings of the bank | `/learn` (subject → concept), `/papers` (by paper), `/curriculum` (by course) | already held |
| Visible level / board / tier | the course line on Home, `/learn` row and `/curriculum` | already held |
| Sequence, not only catalogue | `/learn/[subject]` lists concepts; the goal line names step 1 and 2 | partially — no "2 of 13" position in a subject |
| Teacher: one signal, then drill | `TeacherHome` lists `needs you` rows with reasons; class → tabs → student evidence | already held (rebuilt this cycle) |
| Teacher: most-missed **question** | class-level misconceptions are aggregated; per-question rates are not surfaced | gap — the bank has no per-item persistence by design (only concept outcomes are stored), so this is a deliberate limit, not a missing query |
| Measured ≠ mastered | `unmeasured` / `—` is used everywhere a rate would be invented | already held |
| Colour never alone | chips carry words; `Dims` has text labels | already held |
| Offline | service worker + offline pack | ahead of the market |

## 5. What changed as a result of this survey

1. **`components/learner-home.tsx` — assigned work is now the first section after the
   greeting.** The `AssignmentsPanel` moved from the foot of the page to the top, so
   teacher-set work with a deadline is read before the engine's recommendation. It
   renders nothing when no work was set, so a learner with no homework sees the Home
   they saw before, with no empty box and no new heading. The decision card remains
   the page's only primary action, and remains directly beneath it — Educake's
   pattern, and the EEF's "feedback must be actionable", without turning the page
   into two competing dashboards.
2. **`npm run verify` pins the order**, because the ordering *is* the design decision:
   an assertion fails if `AssignmentsPanel` is ever rendered after `NextStep` on Home.

## 6. Backlog, in the order the evidence supports

1. **Position within a course.** "2 of 13" (Oak) for the concept a learner is on, in
   `/learn/[subject]`. Cheap: the ordering already exists in the genome.
2. **Per-question insight for teachers**, if item-level evidence is ever stored. The
   current limit is principled — the ledger keeps the concept, the outcome and what it
   proved, never the item — so this is a product decision before it is a dashboard
   decision.
3. **A "needs attention" list that names why**, on the learner side as well: the
   teacher's console does this; the learner sees the reason only in the decision card.
4. **Optional read-aloud and text-size controls** (Wayground documents both). The
   `Dims`/`chip` vocabulary is already text-first, so this is additive.
5. **Do not** add streaks, XP or class leaderboards. No reviewed product ties them to
   demonstrated learning, and this product's claim is the opposite.

## 7. Sources

Educake help centre · Sparx Maths / Science support · Seneca reports help · Satchel
One student help · Google Classroom assignment help · Microsoft Teams assignments ·
Save My Exams exam-question guide · BBC Bitesize GCSE quizzes · GCSEPod student page ·
Cognito course and past-paper pages · Corbettmaths index and 5-a-day · Physics & Maths
Tutor question pages · Oak National Academy unit page and pupil results help · Quizlet
and Anki manuals · Formative, Socrative, Wayground, Nearpod, Blooket help centres ·
ONS Service Manual (dashboards) · EEF (feedback; Check. Adapt.). Full URLs are inline
in §3.
