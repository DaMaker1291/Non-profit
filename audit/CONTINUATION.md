# OPENMIND — continuation record

Written 2026-11-04, at the end of a session that authored `negatives`. Every number
below was measured in this session; nothing here is an estimate. Resume from
**§4 Queue** without repeating the work in §2.

## 1. What is true now (measured)

| Measure | Value | How measured |
| --- | --- | --- |
| Concepts in the genome | 135 | `npm run lesson:catalogue` |
| Authored lessons (pass `openmind.lesson/1.0`) | **16** | catalogue, `auditLesson` = 0 problems each |
| Machine-verified | 16 | derived from the gate, not declared |
| Educator-reviewed | **0** | no human review record exists |
| Learner-tested | **0** | no learner-testing record exists |
| Published | **0** | — |
| Outline only (genome paragraph + plan) | 119 | catalogue |
| Metadata only | 0 | catalogue |
| Plan records | 135 = 19 authored plans + 116 supplemental | catalogue reconciliation line |

Authored by subject: maths 12, physics 1, chemistry 1, biology 1, computing 1.

Checks in the last green run: `npx tsc --noEmit` 0 · `npm run verify` 4592 passed,
0 failed · `npm run verify:lesson` (real Chrome) 288 passed, 0 failed · catalogue
exit 0.

## 2. What was authored and verified this session

Batch 4 (`decimals`, `addition`, `subtraction`, `rounding`, `multiplication`,
`division`) and batch 5 (`negatives`), each with objectives and evidence, a
placed prior-knowledge diagnostic, three explanation sections, three
representations, two worked examples, two misconceptions with contrast pairs,
three guided items with hints, a keyed short-answer plus a constructed response,
a transfer task, spaced retrieval, accessibility notes and provenance.

Browser-verified: all six batch-4 lessons paint their authored sections at
1280 and 320 (`scripts/lesson-walk.mjs`, section 8), and `negatives` is measured
inside the planned-lesson loop because it has a pilot plan (figure, labels,
legibility, overlap, both widths).

Batch 6 added `order-ops` (445 teaching words, 1,589 learner-visible, 0 gate
problems) — the convention `algebra-expressions` and `indices-intro` both declare
as a prerequisite.

Batch 7 added `fraction-ops` (472 teaching words, 1,760 learner-visible, 0 gate
problems), teaching the common denominator that the `denom-add` repair assumes,
and reading multiplication as "of" and division as "how many fit".

Batch 8 added `percentages` (469 teaching words, 1,767 learner-visible, 0 gate
problems) — the thinnest served explanation in the bank until now. It teaches a
percent as a part size fixed at one hundred, then builds all change on the
multiplier, which is what makes reverse percentages divide and explains why a 20%
rise then a 20% fall leaves 0.96 of the start.

Teaching prose across the authored set: 371–458 words per lesson; learner-visible
1,589–1,716. No lesson is padded toward a word target.

## 3. Known defects, stated plainly

1. **`decimals` does not declare `place-value`** as a prerequisite, though its
   teaching needs it. Each lesson names the prior idea and probes it instead. A
   genome edit moves routing and several content gates, so it was not made.
2. **A plan carries no assessment.** The 122 outline concepts have teaching prose
   but no guided practice, no markable items, no transfer and no retrieval — so a
   pupil can read them and cannot be marked on them. This is the structural gap,
   not a word count.
3. **Five of the six batch-4 lessons have no figure**, by decision per concept.
   Their read stage is prose-only.
4. **The four starting situations are not yet branched.** Authored lessons carry a
   prior-knowledge diagnostic and the worked example can raise its own depth, but
   no surface routes a beginner, a forgetful pupil, a partial learner and an
   advanced learner down genuinely different teaching.
5. **The graph is thinner than the teaching.** `fraction-ops` declares only
   `fractions`, so a lesson may not list `multiplication` as prior knowledge even
   though multiplying the counts is exactly what the lesson asks for — the gate
   refused it and was right to. The concept is taught inside the lesson instead.
   The same shape will recur wherever a concept needs a sibling that the genome
   does not declare, and the fix belongs in the graph, not in the lesson.
6. **No board beyond the existing registry has been mapped**, no lesson exists in
   any language other than English (only `place-value` has es/fr translations),
   and no learner testing has happened. None of these may be reported as done.

## 4. Queue — next, in dependency order

Maths first, because the graph is densest there and the prerequisites are real.

| Next | Why it is next |
| --- | --- |
| `negatives` | Authored as batch 5. |
| `order-ops` | Authored as batch 6. Declared prerequisite of `algebra-expressions` and `indices-intro`. |

A correction to this queue as first written: it listed `fractions` as needing an
authored lesson, which was wrong — `fractions` has had one since batch 1. Checked
against `AUTHORED_BY_CONCEPT`, not from memory.
| `fraction-ops` | Authored as batch 7 — teaches the common denominator the `denom-add` repair assumes. |
| `percentages` | Authored as batch 8. |
| `algebra-expressions` | Gate to all algebra; currently plan-only. |
| `indices-intro` | Gate to standard form, surds, growth and decay, calculus. |
| `ratio`, `proportion` | Thin supplemental plans (325, 343 words); prerequisite chain into `mixture-problems`, `trig-ratios`. |
| `standard-form` | 348-word plan, depends on `indices-intro` and `place-value`. |
| `simultaneous`, `inequalities` | Stage 2, plan-only, both prerequisites of later algebra. |

Then: the four science singletons already planned (`cells`, `photosynthesis`,
`equations-stoich`, `electricity-circuits`) need authored lessons to match, and
computing needs a lesson with real code execution rather than questions about code.

## 4b. The four starting situations — measured, not assumed

`node scripts/learner-routes.mjs` builds four records for one concept and asks the
REAL serve (`lib/operations.ts#practiceAim` + `servePractice`, the one owner shared
by the route and the static build) what each is given. Last run: **13 passed, 0
failed**, on `percentages` and `fraction-ops`.

| Situation | reason | aim | what is served |
| --- | --- | --- | --- |
| beginner, no evidence | `fresh` | 0.45 | band item |
| forgotten, fluent 40 days ago | `steady`, `due=true` | 0.45 | band item, staged as **retrieval** |
| partial, one belief hit 3× | `repair` | 0.33 | 0.38 item; on `fraction-ops` it is `1/3 + 1/4` with `slip=true` |
| advanced, 10/10 and transfer | `stretch` | 0.67 | 0.63 item |

What this proves: the route follows the RECORD, a stuck learner is served below a
beginner, a strong learner above, and a forgotten topic is treated as recall rather
than as new teaching.

What it does NOT prove, and must not be claimed:

1. It measures the serve, not the page. That the read stage then shows a DIFFERENT
   explanation to each of these learners is untested — the engine picks the item, and
   the explanation is still one lesson per concept.
2. The retention item is the same depth as the beginner's BY DESIGN (“I remembered
   it” must not mean “I got an easier question”), so the difference there is in how
   the answer counts, not in what is asked. With a pinned seed the two prompts are
   literally identical.
3. A repair on `percentages` returned `slip=false`: the bank has no item tagged with
   that belief for that concept, and the serve says so instead of claiming a check it
   did not make. Fixing that is content work on the bank, not on the serve.

Two fixture traps this cost, both recorded in the script: `dueReviews` compares
`lastSeen` as a NUMBER of milliseconds and needs a `mastery` bucket (an ISO string
silently never comes due), and a misconception belongs to a concept (`denom-add` is
on `fraction-ops`, not `percentages`).

## 4c. The same question, swept across all 16 authored lessons

§4b measured two concepts. `npm run verify:routes` now sweeps every authored lesson
(**7 passed, 0 failed**) and reports the two things it cannot fail without first
understanding them.

Measured: all 16 serve all four situations, all 16 route a stuck learner to
`repair`, all 16 aim an advanced learner above a beginner, all 16 stage a forgotten
topic as `steady+due+retrieval`, and minimum 3 distinct aims per lesson.

| What | Count | Meaning |
| --- | --- | --- |
| Ceiling-clamped stretch | **8/16** — place-value, addition, subtraction, rounding, multiplication, division, negatives, order-ops | The aim is 0.67; the item is 0.30–0.50 because `conceptDepth` clamps it. Documented limit, not a broken route — and not fixable by letting the serve exceed the ceiling. |
| No genome belief | **7/16** — photosynthesis, what-is-code, place-value, addition, subtraction, multiplication, division | The lesson has authored misconceptions (`m1`…) but the concept declares none in `lib/genome.ts`, so no item can be tagged and no diagnosis is possible. These lessons teach a misconception the engine cannot see. |
| Repair misses a tagged item | **9/16** — photosynthesis, what-is-code, place-value, addition, subtraction, multiplication, division | The repair reason fires but `slipCheck` is false. All seven are the lessons whose concept declares no belief at all, so no item can carry one — a single content job, not seven serve defects. |

The first two lists overlap on seven concepts for one reason: a belief that is not
declared cannot tag an item. So the remaining queue is **one content job, not
sixteen**: declare the beliefs the lessons already teach in `lib/genome.ts`, write
`mc.<id>` in all 15 dictionaries, tag the items, and author the repair — the five
coupled edits AGENTS.md names.

### `percentages` was a SERVE defect, and it was fixed here

It had a belief (`pct-base`) and a repair, and still reported `slip=false`. Drawn by
seed, not inferred: at the band aim 0.45 its `pct-base` family is tagged **40/40**,
the items sit at difficulty **0.40**, and a repair aims at **0.33** — where tagging is
8/40, and every extra draw at 0.23/0.13 is further away (5/40, 3/40). `drawPractice`
widened only DOWNWARDS, which is right for `fractions` (tag below the aim) and
useless here (tag above it). The ladder in `lib/operations.ts` now widens both ways —
descent first, so the measured `fractions` behaviour is unchanged, then ascent — and
the re-run reaches the tagged item, repair 8/16 → **9/16**. `npx tsc --noEmit` 0 and
`npm run verify` 4592/0 after the change.

The lesson generalises: a slip-chasing search that only looks one way is a search
that happens to work for whichever half of the bank the author measured.

Re-running this after a bank change is the check; it is deliberately not inside
`npm run verify` (it reads the compiled mirror), and it is listed with the resume
commands in §5.

## 4d. The read stage now opens differently for a pupil who has forgotten

Until this batch the four situations diverged only in the SERVE. Every learner then
read the same lesson in the same order, which left the mandate's most important case
half-solved: a pupil who had forgotten the topic read everything and only met the
check at the end.

`app/learn/[subject]/[concept]/page.tsx` now renders a **recall card above the
teaching** when `isRetentionDue(state, conceptId)` — the same scheduler function the
serve path calls to stamp an answer `retrieval`, so the card and the ledger cannot
disagree about whether the idea has faded. It shows the review item the authored
lesson already carries, asks for the answer from memory, and reveals it on request.
It is not marked and writes nothing, which is why it may sit above the teaching.

No new dictionary keys: `skill.recall` ("Recall"), `plan.finishIt` ("Finish it in
your head first, then check.") and `plan.rest` ("Show the rest") are already
translated in all 15 dictionaries, so no language falls back to English to say it.

Checks: `npx tsc --noEmit` 0, `npm run verify` 4592/0, `npm run verify:routes`
**10/0** (three new assertions: the page asks the scheduler; the card is gated and
comes before `learn.idea`; only pre-translated strings are used).

**And the card does render — proven in the running app, which is stronger than the
source assertions.** Scratch store (`OPENMIND_DATA_DIR=/tmp/om-recall-store`), one
learner with `percentages` at `attempts 6, correct 5, mastery 0.92, lastSeen 40 days
ago`, opened at `/learn/maths/percentages` in the browser with its id and capability
secret in localStorage. Measuring the DOM, not eyeballing it:

| Measured | Result |
| --- | --- |
| the card exists | `Show the rest` button present; card text `RECALL · Finish it in your head first, then check. · Write 45% as a decimal and as a fraction in its simplest form. · Show the rest` |
| it uses the lesson's own review item | the prompt is `retrieval[0]` of `percentages` |
| it sits before the teaching | card top **1501**, the idea card's lead **1034 → card is after the objective, before the idea** |
| no redirect | URL stayed `/learn/maths/percentages` |
| no console errors | only React DevTools + HMR messages |

Two corrections to what was assumed: the card renders **after** the objective ("By
 the end you can", y=1034), not before it — which is the right order, since a learner
needs to know what the sitting is for before being asked to recall it; and it was
reached only after the profile carried `onboardedAt` and a complete course, because
`/learn` is gated on `courseIsReady`. A hand-written `spec`/`grade` did not satisfy
that gate until the real `/curriculum` save ran.

NOT proven: a SCREENSHOT of the card. `preview_screenshot` captured the page top
(the scroll did not take effect) and `fullPage` refused while the window was
minimised, so the visual evidence is the DOM read above, not an image. The saved
PNGs did not show the card and were deleted rather than kept as misleading
evidence. Nor does this cover any learner other than a seeded one.

Still true after this batch: the card appears only for the 16 authored lessons (they
are the only ones with `retrieval` items), and it shows the same review prompt the
schedule would have served later — it does not yet pick a *different explanation* of
the idea. Explanation selection by evidence remains the largest P0 gap.

## 5. How to resume

```bash
npm run lesson:catalogue          # the authoritative count, never a plan count
npx tsc --noEmit
npm run verify                    # 4592 expected; compare the FAILURE list
npm run dev &                     # 4173; the browser walk needs it
npm run verify:lesson             # 288 expected
node scripts/learner-routes.mjs    # four starting situations against the real serve
node scripts/cleanup-e2e-store.mjs  # removes walk learners, keeps the real profile
```

Adding a lesson is four coupled edits: the file in `lib/lessons/authored/`, an
import and array entry in `lib/lessons/authored/index.ts`, the file added to the
explicit tsc list in `scripts/compile-engines.mjs`, and — for a concept with no
pilot plan — a row in `AUTHORED_NO_PLAN` in `scripts/lesson-walk.mjs` so a browser
actually opens it.

## §4e — A different explanation, chosen from the learner's own evidence (measured)

The largest remaining P0 gap was that a beginner, a pupil who had forgotten the
topic and a pupil with a partial grasp all read the SAME explanation of the idea.
Only the item and the opening differed. This section records the change, the
defect the live app found in it, and what was measured.

**What was built.** `lib/lesson-plans.ts#LessonPlan.routes` holds a second route
through the same idea, authored per concept; `ideaRouteFor(plan, evidence)`
chooses it. Thresholds: fewer than three answers is no evidence (default);
struggling is accuracy below 0.5 with mastery below 0.8; advanced needs mastery
≥ 0.8 AND three answers. A route that has not been authored falls back to the
default, so the selector can only ever return teaching somebody wrote — no
generated "simpler version", which is the padding the mandate forbids.

**Authored so far: two routes, deliberately.** `fractions` struggling (4
paragraphs: a bar of chocolate before any notation, the denominator read as a
size, the comparison rule proved by drawing, the common-denominator shortcut
last) and `negatives` advanced (3 paragraphs: numbers as positions and
operations as transformations, why two reflections cancel, distance/midpoint and
where the inequality flip comes from). Both REPLACE the base paragraphs; the
suite asserts neither repeats a base paragraph and that the struggling route is
SHORTER than the base — a route that adds is a route that pads.

**The defect the browser found, which no source assertion could.** The first
implementation only changed the `plan` branch of the idea card, and `fractions`
has an AUTHORED lesson, which renders first. So the struggling route existed,
was selected, and could never appear: the exact "a card nothing can reach is a
card nobody sees" failure this project has recorded twice before. The fix is
precedence: a non-default route now renders ahead of the authored lesson, which
keeps the stages around it (diagnosis, guided practice, assessment). `npm run
verify` asserts that ordering.

**A gate that had to be repaired honestly.** `the fractions plan declares the
interactive model it needs` was
`/conceptId: "fractions"[\s\S]{0,4000}?interactive: "fraction-model"/` — a
character window that failed the moment the plan gained a route, although the
field was still declared. It now reads the served plan
(`planFor("fractions").interactive === "fraction-model"`), which is strictly
stronger and cannot be broken by authoring more teaching. (The first attempt at
that fix crashed the suite with `plans is not defined` — the handle belongs to a
later scope; it now requires the compiled module locally. Recorded because a
gate that crashes reports "0 assertions", not a failure.)

**Measured live, not inferred.** Scratch store, one profile with `fractions` at
`attempts 4, correct 1, mastery 0.20`, opened at `/learn/maths/fractions`:

| Read from the DOM | Result |
| --- | --- |
| idea card lead | `Start with one bar of chocolate and no symbols at all…` |
| authored default heading | **absent** (`Fractions count pieces of a declared size`) |
| path | `/learn/maths/fractions`, no redirect |
| console | only React DevTools/HMR and a `No available adapters` warning |

**Limits, stated.** Two concepts have a route, out of 135 — the count is not a
claim of coverage. The seeded record had to be completed through the real
`/curriculum` save; a hand-written profile was refused at the door (it rendered
`/onboarding`), which is the same gate that caught the recall-card attempt. No
learner testing exists: the thresholds are defensible, not validated on pupils.

Checks: `npx tsc --noEmit` 0 · `npm run verify` **4602 passed, 0 failed** ·
`npm run verify:routes` **10 passed, 0 failed**.

## §4f — The access audit: who cannot use OpenMind today (measured, not claimed)

The new mandate's P0 was "identify who cannot currently use the application".
That is now a real check rather than a document: `scripts/a11y-audit.mjs`, wired
as `npm run verify:a11y`, drives the running app through the shared Chrome
harness (`scripts/browser.mjs`) and can fail.

**Result on this checkout: `51 passed, 0 failed, 1 surface NOT audited.`**

Per public surface it measures, from the rendered DOM: a document language;
exactly one `h1`; a `main` landmark; an accessible NAME on every button and
link; a label on every form control; an `alt` attribute on every image; every
`<svg>` either `aria-hidden` or named; no positive `tabindex`; a skip link whose
target exists; nothing still animating under `prefers-reduced-motion: reduce`;
no sideways scroll at 320 px. Then, on the landing page, the skip link's three
duties: first in tab order, on screen when focused, moves the page to `#main`.

| Surface | Outcome |
| --- | --- |
| `/` landing | 12/12 + keyboard 3/3 |
| `/help` | 12/12 |
| `/about` | 12/12 |
| `/offline` | 12/12 |
| `/curriculum` | **NOT audited** — signed out it renders the onboarding shell with no `h1`, by design |

**What this does NOT measure, and is not claimed:** screen-reader announcements,
switch/eye-gaze input, 200 % text reflow, colour-contrast ratios, captions or
transcripts, cognitive load, or any learner's actual experience. WCAG 2.2 AA
conformance is not asserted anywhere. A green run means the mechanical
exclusions visible to a script are absent.

**A real access finding falls out of the gate itself.** The course chooser — the
screen where a school decides whether the product fits its qualification — is
unreachable without a learner record. That is defensible product behaviour and a
genuine barrier for the audience the new mandate names (a teacher or head
evaluating OpenMind cannot see the chooser). It is recorded here, not "fixed" by
loosening the gate.

**Three harness lessons, each of which looked like a product defect first.**
(a) `page.waitFor` returns at its timeout instead of throwing, so four pages
were measured while still compiling and reported as having no `h1`, no `main`
and no skip link. A gate that cannot distinguish "not loaded" from "not
accessible" is worse than no gate — it supplies confident wrong answers.
(b) A client redirect can be served by a full reload, so one read caught a blank
frame; `readStable()` now requires two identical consecutive reads before
anything is asserted.
(c) Headless Chrome would not move `document.activeElement` on a dispatched Tab,
even with focus emulation and a background click, so the original keyboard
assertions measured the harness. They are now structural facts that imply the
same behaviour — skip link first in DOM order (there is no positive `tabindex`,
asserted), visible when focused, and activating it moves to `#main` — and the
report says plainly which claim is inferred rather than pressed.

**Not yet covered, and next:** the SIGNED-IN lesson surface, which is the page
that matters most and the one this audit cannot reach without a learner; contrast
ratios; 200 % text; captions; learner-controlled presentation (text size, reduced
motion, spacing) which is the first *capability* the new mandate asks for, as
opposed to a check.

## §4g — Presentation preferences: proved in the browser, and one real defect fixed

The access panel has carried largeText / highContrast / reduceMotion since the
first build, and no check had ever measured that choosing one changes the page.
`npm run verify:a11y` now toggles all three on `/access`, measures computed
styles, and turns them off again:

| Claim | Measured |
| --- | --- |
| stored preference reaches the document | `<html class="access-large access-contrast access-calm">` |
| larger text enlarges text | root font-size **16px → 19px** |
| high contrast thickens ink | card border **1px → 2px** |
| calm screen stops motion | **44 → 0** elements animating |
| it can be turned off | root size back to **16px**, classes gone |

**The defect the check found: the preferences were applied after first paint.**
`AccessProvider` applies the classes in a `useEffect`, so a learner who chose
larger text got ordinary text first and watched it grow on every navigation — the
exact flash the theme already solved with its inline boot script. `THEME_BOOT`
now applies the stored access classes (and `access-voice-first`) in the same
pre-paint script, so the preference is true from the first frame. This was not
visible in any source read: the classes were correct, the storage was correct,
and the only thing wrong was *when*.

**Audit totals on this checkout: `56 passed, 0 failed, 1 surface NOT audited`
(`/curriculum`, gated signed out).**

**What the harness had to learn, again, all three looking like product defects.**
(a) A preference applied in an effect arrives after the server HTML, so a 700 ms
sleep read an unhydrated document and reported three working preferences as
broken — it now waits for the class itself.
(b) The skip link is `top: -100px` until focused, so once scrolled away a real
click cannot land on it; the activation check was impossible by construction and
is now "the target is a working scroll landmark", with the href and target
asserted separately. The report says what was pressed and what was inferred.
(c) `element.click()` is not a click. This project's own harness has written that
down about React controls; it is true of anchors here too.

**Genuine gaps this leaves open, named rather than papered over.** Large text is
BINARY (16 px or 19 px) — there is no step between, and no smaller/larger range.
There is no line-spacing, letter-spacing or word-spacing control, which is the
measure dyslexia guidance asks for most often. Nothing measures colour-contrast
RATIOS, 200 % text reflow, captions/transcripts for the read-aloud text, or a
screen reader's reading of a lesson. And no learner with a disability has used it.

Next capability, in the mandate's order: text-size steps and reading-spacing as
real preferences (15 translations each, so it is a content job as well as a code
one), then the signed-in lesson surface, then contrast measurement.

## §4h — Preferences that are steps, not a switch, and spacing that is a setting

The audit's first green run left two named gaps: larger text was BINARY (16 px or
19 px), and there was no reading-spacing control at all — the accommodation
dyslexia guidance asks for most often, because a bigger font does not separate
letters. Both are now real preferences, chosen by the learner and never inferred.

| Preference | Values | Measured |
| --- | --- | --- |
| text size | standard / large / largest | **16 px → 19 px → 22 px** |
| reading spacing | roomy on/off | line-height **1.60 × → 1.90 ×**, plus letter and word spacing |
| a preference saved before the steps existed | `largeText` only | **19 px**, no silent shrink |
| back to default | cleared | **16 px**, classes gone |

The three steps are asserted **individually**, including the middle one: a check
that only tested the top step and the default would pass for a two-state switch
with a renamed large setting. The legacy shape is written deliberately and
measured, because "we handled the old format" is a code path until it is run.

Five new UI strings (`access.textSize`, `access.sizeStandard`, `access.sizeLarge`,
`access.sizeLargest`, `access.roomy`) are authored in **all fifteen
dictionaries** — asserted by `npm run verify`, which fails when an `en` key is
absent anywhere. The controls are a labelled `role="group"` of `aria-pressed`
buttons rather than a slider, so a screen reader hears "Large, pressed 1 of 3".
The boot script applies the steps and the spacing before the first paint, for the
same reason as §4g: a preference that arrives after hydration is a flash.

**What is still not measured, and must not be implied by the word "accessible":**
colour-contrast ratios, 200 % text reflow on a lesson page, captions/transcripts
for the read-aloud text, a screen reader's actual reading of a diagram, and any
learner with a disability using it. The spacing rules cover teaching prose, not
tables or answer fields — deliberately, because roomy numerals break column
alignment — and that scope is a design decision no test can validate.

Next: the same audit on a signed-in lesson (the surface that matters most), then
contrast measurement, then a co-design session with disabled learners before any
claim about accessibility is made in public.

**The control was pressed, not just stored.** Every other check writes
`localStorage` and reloads — which proves persistence and the boot script, and
would still pass with a dead `onClick`. The audit now finds the size group
(`role="group"`), requires exactly three buttons with exactly one
`aria-pressed`, presses the standard choice with a real mouse event, and reads
the page back at **16 px**. A button that changes nothing fails the run. The
first version of this check asserted "the third button is pressed" — and failed
on a working page, because the preceding checks had left it on the middle step:
an assertion that encoded the script's history rather than the control.

## §4i — A catch-up path from the learner's evidence, not their year group

The mandate's P0 asks for foundational catch-up: find missing prerequisites and
rebuild them without restarting a year. The repository already had the pieces —
`Concept.prereqs` (168 declared edges), `ancestorsOf`, `prerequisiteMet`,
`unmetPrerequisites` — and none of them produced a PATH for one learner.
`unmetPrerequisites` reads ONE level, which is right for "why is this card
blocked" and wrong for a learner rebuilding after interrupted schooling; and the
only transitive consumer was the teacher's class-level `prereq_gap` finding.

`lib/foundations.ts#catchUpPath(state)` now derives, from recorded evidence only:

| Property | Why it matters | Asserted |
| --- | --- | --- |
| transitive ancestry | rebuilding stops one level short otherwise | path is non-empty for an empty learner and covers the target's ancestry |
| foundations first | a dependent idea before its foundation is a reading list, not a route | `depth` is non-decreasing along the path |
| unmeasured ≠ weak | telling a learner they scored 0 on an idea nobody asked is the thing this product must not do | every empty-record step is `unmeasured` at 0%, and an answered-below-bar one is `weak` |
| established drops out | a repaired foundation must stop appearing | setting the first step to 0.9 removes it |
| capped, total reported | five steps is a start, not the whole gap | `limit` caps `steps` while `total` stays 8+ |
| deterministic | two renders cannot disagree about the order | two derivations serialise identically |

It is rendered on the learner's own `/progress` record, above the gains section:
each step links to its lesson, says "not yet measured" or "needs rebuilding" with
its mastery, and the overflow is counted rather than hidden. Five strings
(`catch.*`) are authored in **all fifteen dictionaries**.

**The first assertion failed and the assertion was wrong**: it demanded more than
two prerequisites from `circle-theorems`, which declares exactly one. It now
measures the cap over a whole subject's ancestry. Recorded because it is the same
class of error as the audit's "third button" — a test encoding an assumption
about the fixture rather than the behaviour.

**Not measured:** the section has not been viewed in a browser with a seeded
learner (it renders nothing for a learner with no open foundations, by design),
and no learner has used the path. The next step is to drive it live, then to let
the path ORDER the practice serve rather than merely list the steps.

## §4j — The catch-up path now starts before the first answer

§4i derived the path from concepts the learner had already answered, which meant
the people it exists for — an adult returning to education, a pupil resuming
after months away — got an EMPTY path at exactly the moment they needed one: they
were enrolled, and they had no record yet.

`catchUpPath(state, { subjects })` now takes the learner's DECLARED subjects as a
target source (each subject's concepts from `bySubject`, then their ancestry),
with the precedence: explicit course targets → declared subjects → touched
concepts. `/progress` passes `state.profile.subjects`, so an enrolled learner
with nothing answered sees what their course rests on, every step labelled "not
yet measured" rather than 0%. Two assertions were added: the enrolled-empty
learner gets a path, and a caller naming the course's concepts is not overridden
by the subject list.

Checks: `npx tsc --noEmit` 0; `npm run verify` **4614 passed, 0 failed** (the 3
planted failures are intentional).

### Two assumptions in the brief that the tree contradicts

- **Shared devices are not a gap.** `lib/device-roster.ts` (ordered roster, cap 8),
  `rememberOnDevice`/`switchToDeviceLearner`/`forgetDeviceLearner`, kiosk PIN →
  90-minute session, and a server-side `sessionEpoch` bump on `/api/auth/logout`
  mean sign-out ends the session rather than clearing a cookie. What remains is
  CONCURRENT use of one handset and a measured hand-over walk — not the feature.
- **Accessible diagrams are described, not drawn blind.** `figureCaption`
  composes the caption from the same spec as the SVG, `figureCaptionText` fills it
  in 15 dictionaries, and a kind with no template is a suite failure. The SVG is
  `aria-hidden` on that basis. A caption can state that a balance holds 3x + 5 and
  20; it cannot show which pan is heavier. Whether that is sufficient is a
  question only a screen-reader user can answer.

**Not measured:** the `/progress` section has still not been viewed in a browser
with a seeded learner; the path links to lessons but does not yet order the
practice serve; no learner or teacher has used any of it.

## §4k — Two foundational lessons written to the pilot standard (18 authored, not 135)

The request was "make all lessons real". The repository's own rule forbids the
only way that could be done in one pass — generating prose to fill 119 slots is
exactly the superficial output the mandate rejects — so this pass authored TWO
complete plans to the standard the suite enforces, and changed nothing about the
counting rule. Authored lessons now **21**; `review: "unreviewed"` on both; no
subject teacher has read them.

`place-value` and `multiplication` were chosen because `lib/foundations.ts` sends
a learner with an unestablished prerequisite to exactly these, and because both
were previously supplemental: a genome paragraph plus a lens, which reminds and
does not teach. Each new plan carries an action-first objective, intuition before
terminology, 5–6 idea paragraphs in landing order, 3–4 traps that say WHY the
wrong move fails, a glossary, a three-line recap, `usedFor`, and an explicit
figure decision (null, with the reason written beside it in `scripts/lesson-walk.mjs`).

What the gates did, in order:

1. `npm run verify` **failed** with `every pilot-authored plan is in a named
   review pack (outside: place-value, multiplication)` — the pack is the set of
   concepts a subject teacher is asked to read, and a lesson outside it is
   unreviewable by construction. Both were added to `ANCHORS` in
   `scripts/pilot-pack.mjs` with the reason recorded there.
2. Regenerated: **17 concepts, 161 items**, `pilot-pack --check` current.
3. `npx tsc --noEmit` 0; `npm run verify` **4614 passed, 0 failed**.
4. `npm run verify:lesson` was NOT run (needs the dev server and Chrome); the two
   lessons are therefore measured as a static walk row, not as a rendered page.

**A gap the regeneration surfaced, and did not paper over:** the pack now reports
`missing 2 concept(s) with no named misconception to probe` — these two. The
concepts have no entry in `lib/misconceptions.ts`, so the pack cannot probe a
belief for them and a wrong answer cannot be repaired by name. Adding one is the
five-coupled-edit job AGENTS.md describes (catalogue, 15 dictionaries, genome
array, item tags, repair); it is the honest next step for this pair, not a
checkbox. Until then the traps teach, and the item-level feedback stays generic.

### The defect this pass found, which matters more than the two lessons

`LESSON_PLANS` merged as `{ ...PILOT_LESSON_PLANS, ...SUPPLEMENTAL_LESSON_PLANS }`.
The supplemental module builds a plan for every concept that has a lens, and it
was spread LAST — so an authored plan whose concept also has a lens was silently
replaced by the generated one. Measured: the registry reported `place-value` and
`multiplication` as `provenance: "supplemental"`, `idea.length: 4`, while the
authored plans in the source had 6 and 5 paragraphs. Nothing threw; `planFor`
answered and the page rendered. Every future authored lesson for a lensed concept
would have shipped as generated prose while its author believed it was live.

The merge is now `{ ...SUPPLEMENTAL_LESSON_PLANS, ...PILOT_LESSON_PLANS }` —
authored always wins, generated content is the fallback, which is what the module
header already claimed. Re-measured after the fix: **135 total, 21 authored, 114
supplemental**, `pilotPlanIds()` 21, pack 17 concepts / 161 items and current,
`tsc` 0, `npm run verify` **4614 passed, 0 failed**.

This is the second time in this programme that the interesting failure was in how
content was WIRED rather than in the content itself (the first was a plan filed
under a concept that answered null). A lesson nobody can reach is indistinguishable
from a lesson nobody wrote.
