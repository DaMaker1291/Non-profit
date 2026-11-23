# Teaching in the room you actually have

This is the record of the classroom model: what a teacher declares, what the
platform derives from it, and what it refuses to claim. It exists because the
product could previously describe a *lesson* but not a *classroom* — the delivery
mode was a query string a teacher re-picked on every page, so a 65-pupil room
with a blackboard and a 12-pupil room with a device each were the same class in
the record.

## Where it lives

| Concern | Owner |
|---|---|
| The declaration and the plan derived from it | `lib/classroom-context.ts` |
| The per-lesson run of show for each mode | `lib/classroom-session.ts` (`CLASSROOM_CONTEXTS`) |
| The teacher's setup flow and first lesson | `app/teacher/setup/page.tsx` |
| Storage on the class | `lib/types.ts#ClassRoster.classroom`, `app/api/classes/route.ts` |
| The run sheet a teacher prints | `lib/teacher-guide.ts`, `components/teacher-guide-sheet.tsx` |
| The lesson's own review rung | `lib/lesson-contract.ts` |

## Quick start, then detail

Four answers change the plan most, so they are asked first
(`QUICK_START_FIELDS`): **class size, what pupils have in front of them, whether
the internet works during a lesson, and which languages are in the room**. The
first language chosen is the language of instruction.

Everything else is optional and behind one disclosure, and **every field states
what answering it changes**. That list is not decoration: it is why a teacher can
reasonably stop after four answers instead of abandoning a twenty-field form.

A class is not "unconfigured" in a blocking sense. A teacher can teach from a
part-filled profile; the plan then says what it left out.

## What the declaration changes

`teachingPlan(profile)` is deterministic and derives only from declared values.

| Declaration | Consequence |
|---|---|
| `devices: "none"` or `"teacher-only"` | whole-class delivery, `no-student-devices`; no pupil account assumed |
| `devices: "shared"` | shared-device delivery; kiosk PIN evidence, never one pupil's mastery from a group answer |
| `devices: "one-per-pupil"` + internet | individual learning; every answer is that pupil's evidence |
| `devices: "one-per-pupil"` + no internet | **offline** delivery, printed evidence |
| `internet: "none"` | nothing in the lesson needs the network while it runs |
| `internet: "intermittent"` | offline answers sync when the connection returns; the lesson never waits on a page |
| `power: "none"` | no projector is assumed, even if one is listed |
| `materials` without `printer` | board-and-exercise-book route, teacher observation as evidence |
| `classSize >= 40` | `large-class` adaptation, groups of six, checks sampled rather than read in full |
| `languages.length > 1` | `multilingual` adaptation; discuss in any language, write the assessed term |
| board only, no texts / projector / lab | `limited-materials` adaptation |
| `mixedAge` | one prompt at different depths, not three unrelated tasks |
| `access: [...]` | each need becomes a delivery change in words a teacher can act on |
| `customCurriculum` | recorded as the teacher's own; never claimed as a national mapping |

Two rules make the derivation safe:

1. **A value outside a closed list is dropped, not coerced.** A teacher who
   reports connectivity as "sometimes" has not said whether it works, and
   storing `reliable` would be a fact nobody declared.
2. **A default is named.** If devices, connectivity, power, materials or class
   size were not declared, the field appears in `assumed` and the plan says the
   lesson does not rely on it. "Not declared" and "nothing available" produce
   different plans and stay distinguishable in the record.

## The setup flow

`/teacher/setup` is three steps, and it is reachable from the teacher console
(`Lessons →`, and a link on each class header showing the recorded room):

1. **Your classroom** — the four quick answers, the optional detail, and the
   derived plan shown live ("how this room runs a lesson").
2. **What will you teach** — this class's own course or subject, not the whole
   genome. Concepts with a written teaching plan are marked; the rest still have
   an authored lesson.
3. **Your run sheet** — the mode, the evidence route, the authored objective and
   up to three traps, the plan's own review rung, and the four doors: present,
   teacher guide, pupil worksheet, answer key.

The chosen lesson is stored on the class (`focusConceptId`, validated against the
genome and the class's subject), so leaving the page and returning on another
device resumes the lesson rather than an empty picker.

## What is asserted

`npm run verify` (`▸ A classroom decides how the lesson runs`) checks, among
others:

- an empty declaration invents nothing, and a class with no classroom recorded
  prints no classroom facts;
- the four quick-start fields are the four that change the plan;
- a junk value is dropped, and a class size is bounded rather than trusted;
- the 65-pupil, no-device, no-power, three-language room plans whole-class,
  offline, teacher-observed, grouped at six, with sampled checks and the access
  change in words;
- a device-each room is individual, account-backed, and assumes nothing once all
  fields are declared;
- shared devices with an intermittent connection records kiosk answers and syncs;
- a device each with no connection is offline with printed evidence;
- a projector in a room with no electricity is not a projector;
- every mode the planner can name exists in the presenter's own run of show;
- the declaration reaches the record (source pins on `lib/types.ts` and the class
  door), and the setup page renders the model rather than recomputing it.

`▸ Every authored lesson can be taught, and the guide keeps the answers out`
measures the teaching resource itself: **135 authored lessons**, each with
objectives, prior knowledge, explanation, worked examples, misconceptions,
guided practice, assessment, transfer and a summary; **135 of 135 have a written
teaching plan**; every one produces a teacher run sheet with a sequence, groups
and objectives; and the printable guide names **no assessment answer** — the
separate authenticated key is the only marking copy.

## What this does not claim

- **No curriculum is upgraded by this work.** Readiness lives in
  `lib/curricula/registry.ts` (`recordReview`, `mappingReview`) and the syllabus
  mappings in `lib/curricula/mappings.ts`. Naming a curriculum here records what
  a teacher follows; it does not research or review it.
- **No educator review, no classroom validation, no pilot.** The review rung a
  lesson declares is printed where the lesson is printed, because "authored" is
  not "checked by a teacher".
- **No mastery is inferred.** The plan says which evidence route the room can
  produce. A group answer, an empty answer and an unmeasured pupil remain three
  different things in the class view.
- **No teaching-effectiveness claim.** These are code and content checks. Whether
  a teacher can teach better with this is a question for real classrooms.
