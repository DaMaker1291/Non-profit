# Learning design: what the best secondary sites do, and what OpenMind now does

**Method.** A design comparison of 24 student-facing secondary-learning sites,
using their own lesson pages, help centres and feature descriptions. This is not
an independent efficacy trial and it does not copy their content. The point is
to identify the learning moves that recur across strong products, then implement
the ones OpenMind can support honestly.

The comparison is deliberately about the **student experience**: video, visual
model, worked example, guided practice, exam-style questions, feedback,
retrieval and misconception repair.

## The comparison

**Key:** ● first-class · ◐ partial/paid/limited · – not a meaningful feature.
Columns: **V** video · **D** diagram/model · **W** worked example · **P**
practice · **E** exam-style questions · **F** feedback · **R** retrieval ·
**M** explicit misconception repair.

| Site | V | D | W | P | E | F | R | M | Distinctive move worth borrowing |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Khan Academy | ● | ◐ | ● | ● | ◐ | ● | ◐ | ◐ | Mastery ladder with hints and worked video |
| BBC Bitesize | ● | ● | ◐ | ● | ● | ● | ● | ◐ | Revision-sized pages linked to quizzes and past papers |
| Oak National Academy | ● | ● | ● | ● | ◐ | ● | ● | ◐ | Complete lesson: starter → video → checks → practice → exit |
| Corbettmaths | ● | ◐ | ● | ● | ● | ◐ | ● | – | One short video, one worksheet, daily mixed retrieval |
| Maths Genie | ● | ◐ | ● | ◐ | ● | ◐ | ◐ | – | Topic video followed by an exam-style booklet and full solutions |
| HegartyMaths (retired) | ● | ◐ | ● | ● | ● | ● | ◐ | ◐ | Short video + auto-marked quiz; now folded into Sparx |
| Sparx Maths | ● | ◐ | ● | ● | ● | ● | ● | ◐ | A support video for every question; second and third attempts |
| Dr Frost Maths | ● | ◐ | ● | ● | ● | ● | ● | ◐ | Unlimited generated questions with model solutions |
| Seneca | ◐ | ◐ | ◐ | ● | ● | ● | ● | ◐ | Adaptive sequencing and a wrong-answer mode |
| Save My Exams | ◐ | ● | ● | ● | ● | ● | ● | ◐ | Difficulty-graded exam questions and mark-scheme marking |
| Physics & Maths Tutor | ◐ | ● | ● | ◐ | ● | – | ● | ◐ | Topic questions, mark schemes, model answers and video solutions |
| Cognito | ● | ● | ● | ● | ● | ● | ● | ◐ | Short video + notes + quiz + flashcards per subtopic |
| Isaac Physics/Science | ◐ | ● | ◐ | ● | ● | ● | ● | ◐ | Hint ladder before the answer; practice vs challenge tiers |
| Desmos | – | ● | ◐ | ● | – | ● | – | ◐ | One dynamic graph or slider per relationship |
| GeoGebra | – | ● | ◐ | ● | – | ● | – | – | Exploration activity followed by practice |
| PhET | ◐ | ● | – | ● | – | ● | – | ◐ | Make the invisible visible; sliders and multiple representations |
| CK-12 | ● | ● | ● | ● | ◐ | ● | ● | ◐ | FlexBook + interactive PLIX + adaptive prerequisite practice |
| OpenStax | ◐ | ● | ● | ◐ | ◐ | – | ◐ | – | Peer-reviewed text, free PDF and worked solutions |
| TED-Ed | ● | ● | – | ◐ | – | ◐ | – | – | Animation + Think questions + Dig Deeper |
| FuseSchool | ● | ● | ◐ | – | – | – | – | – | Three-to-five-minute concept animations |
| Crash Course | ● | ● | – | ◐ | – | ◐ | ◐ | – | Narrative video series with flashcards/quizzes |
| Quizlet | – | ◐ | – | ● | ◐ | ● | ● | – | Flashcards → Learn/Test with spaced repetition |
| Quizizz | ◐ | ◐ | – | ● | ◐ | ● | ● | – | Live/homework modes with read-aloud accommodations |
| Kahoot | ◐ | ◐ | – | ● | – | ● | ● | – | Self-paced Learn mode with accessibility options |

The pattern is not "put a video on every page". The strongest complete lessons
combine **explanation → visual → worked example → guided attempt → independent
practice → feedback**, and the strongest exam products add **real questions,
mark schemes and model answers**. Misconception-specific repair is the clearest
gap across the field.

## What OpenMind implements

OpenMind already had the hard, honest parts: a concept plan for all 135 genome
concepts, a live worked example generated from the same bank as practice, a faded
"we do" example, independent practice with misconception feedback, a learning
map, and authored diagrams and exact-concept videos where they have been
verified. The problem was discoverability: a learner could read the page and
never realise the workthrough and practice were there, or leave without seeing a
second explanation.

Every concept page now carries a **study panel** above the teaching:

1. **Start here** — jump to the concept's explanation.
2. **Worked example** — jump to a real generated item, solved in full, with its
   working and the misconception it catches.
3. **Practice** — start real questions immediately.
4. **Another provider** — subject-aware routes to Khan Academy, BBC Bitesize,
   YouTube, and, where they are strong, Corbettmaths, Physics & Maths Tutor,
   GeoGebra and PhET.

The external routes are **searches on the provider's own site**, not embeds and
not claims that one particular video teaches the exact concept. That distinction
matters: OpenMind only labels an **exact-concept video** when the URL, title and
scope have been checked (the existing `lesson-media` gate). A search link is
honest about being a search. The card says it is external, opens in a new tab,
and makes no request until the learner taps it.

The panel uses existing translated strings for its labels. Brand names stay as
brand names. No teaching body was generated or copied from another site.

## The design rules this follows

- **Teach before testing.** The idea and a worked example come before independent
  practice.
- **A worked example is not an answer key.** It is a real item from the same
  generator, with the reasoning and the tempting wrong move named.
- **Practice must be real.** The link starts the concept's own generated
  questions, not a quiz written to match a video.
- **One strong visual beats five decorative ones.** Authored diagrams remain
  concept-specific; the learning map is used everywhere as a map of the
  prerequisites and what comes next, not as a fake science diagram.
- **Link out, do not embed.** Third-party players fail silently, create consent
  and privacy questions, and make the lesson depend on a network. The lesson
  remains complete without the external route.
- **No invented media.** If a verified exact-concept video or a diagram that makes
  the relationship visible does not exist, the page does not manufacture one.
- **Feedback names the slip.** The practice path already returns the
  misconception and the option-level note; the study panel never pretends that
  "try again" is feedback.
- **Do not reward clicks.** The external links are enrichment, not evidence. No
  mastery, streak or answer record changes because a learner opened one.

## What remains true and unfinished

- The external links are discovery routes, not a vetted curriculum. Their search
  results change; the URL shapes were resolved against the providers' search
  pages when the map was written, and they are not continuously checked for the
  quality of every result.
- Verified exact-concept video coverage is still limited; the lesson does not
  fill the gap with a subject overview.
- Authored subject-specific diagrams still do not cover every concept. The
  learning map covers every lesson, but it is a map of the path, not a drawing of
  the science.
- Translation coverage of the teaching body remains partial. The study panel's
  labels are translated; external provider pages are in their own languages.
- The next measurement should be delayed retention and transfer, not clicks on a
  video link.

## Sources

- Khan Academy — https://www.khanacademy.org/
- BBC Bitesize — https://www.bbc.co.uk/bitesize
- Oak National Academy — https://www.thenational.academy/
- Corbettmaths — https://corbettmaths.com/
- Maths Genie — https://mathsgenie.co.uk/
- Sparx Maths — https://sparxmaths.com/
- Dr Frost — https://www.drfrost.org/
- Seneca — https://senecalearning.com/
- Save My Exams — https://www.savemyexams.com/
- Physics & Maths Tutor — https://www.physicsandmathstutor.com/
- Cognito — https://www.cognitoedu.org/
- Isaac Physics — https://isaacscience.org/
- Desmos — https://www.desmos.com/
- GeoGebra — https://www.geogebra.org/
- PhET — https://phet.colorado.edu/
- CK-12 — https://www.ck12.org/
- OpenStax — https://openstax.org/
- TED-Ed — https://ed.ted.com/
- FuseSchool — https://www.fuseschool.org/
- Crash Course — https://thecrashcourse.com/
- Quizlet — https://quizlet.com/
- Quizizz — https://quizizz.com/
- Kahoot — https://kahoot.com/
- HegartyMaths / Sparx history — https://sparx-learning.com/our-story
- EEF cognitive science review — https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit
- IES/WWC organizing instruction — https://ies.ed.gov/ncee/wwc/PracticeGuide/1
- Dunlosky et al. — https://pubmed.ncbi.nlm.nih.gov/26173288
