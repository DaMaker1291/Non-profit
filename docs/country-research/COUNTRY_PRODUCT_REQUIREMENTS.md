# Country product requirements

> Derived from the 13 `INITIAL_RESEARCH` profiles, not from a generic feature
> list. Each requirement names the problem it solves and whether the current
> working tree already implements it. "Implemented" does not mean "validated with
> teachers or learners"; that distinction is kept throughout.

## Design rule

**OpenMind adapts to the school; the school does not have to become a wealthy,
high-connectivity school to use OpenMind.**

A requirement is only useful if it works when:

- the teacher has one computer or no computer;
- pupils have no device, one shared device per group, or a family-shared phone;
- the textbook is shared or absent;
- the class is large and mixed-level;
- the language of explanation differs from the language of the examination;
- electricity and connectivity are intermittent;
- the learner is behind the nominal grade.

## Priority 0 — already present and must not regress

| Requirement | Why the research demands it | Current state | Evidence |
|---|---|---|---|
| Teacher-led presentation with no pupil accounts | Bangladesh, Malawi, Nigeria and Pakistan all have large classes with no device per pupil | `app/teach/[subject]/[concept]` and `components/classroom-presenter.tsx` | `verify:low-resource`; production e2e |
| Printable pupil worksheet, teacher guide and separate key | Malawi's >3:1 textbook ratio and shared materials; Pakistan's low-cost schooling | `/print/[subject]/[concept]`, `/guide` and `/key` | 101 print assertions; 539-page all-Maths set; 135 teacher guides with four temporary groups asserted |
| School-reality acceptance scenarios | National averages hide rural/urban, language, income and school-type differences | `docs/country-research/SCHOOL_SCENARIOS.json`; `scripts/school-reality-check.mjs` | 8 scenarios × 135 lessons, 110 assertions, 0 failed |
| Offline authored assessment pack | No permanent connectivity cannot mean no assessment | `scripts/offline-assessment-check.mjs`; offline paper path | 551 offline authored assertions; 22 offline browser assertions |
| Shared-device/kiosk path | India's family-shared phone and Malawi's small computer rooms | `lib/kiosk-session.ts`, `/classroom`, shared-device verification | `verify:shared-device`; 22 offline browser assertions |
| Separate teaching/answer/school/exam language | Rwanda, Tanzania, Nepal, Ghana, Nigeria and the Philippines all show a language transition or mismatch | `lib/language-profile.ts` | Engine assertions; **but only one translated lesson plan exists (`fr`/`fractions`)** |
| Place by demonstrated level, not school year | Foundational learning gaps in every low-income profile | Diagnostic and prerequisite graph | Engine assertions; not yet school-validated |
| Teacher grouping from evidence | Zambia's Catch-Up model; large mixed-ability classes | `lib/teacher-plan.ts` | Engine assertions; no live class data required for the curriculum-order fallback |

## Priority 1 — implemented in this pass

| Requirement | Why | What changed | Verification |
|---|---|---|---|
| No-device classroom mode | The presenter previously said “one device per group” on every run, which is false for a no-device classroom | `ClassroomContextId = no-student-devices`; group routine uses exercise books; evidence note unchanged | `verify:low-resource` additions; typecheck |
| Large-class mode | Bangladesh, Malawi, Nigeria and Pakistan have classes where individual feedback is impossible | Shoulder partners, response cards, sampled oral answers; no assumption of a device per pupil | `verify:low-resource` additions |
| Multilingual mode | Rwanda, Tanzania, Nepal, Ghana and Nigeria cannot be served by a single-language explanation | Prompts separate the strongest language from the examination term; no claim of reviewed translation | `verify:low-resource` additions |
| Limited-materials mode | Malawi, Bangladesh, Nigeria and Pakistan cannot assume a textbook, laboratory or projector | Board/exercise-book routine; honest apparatus substitution | `verify:low-resource` additions |
| Visible classroom-condition selector | A teacher should not have to read documentation to know which mode applies | Presenter header select and context strip | typecheck; not visually inspected in a browser this pass |

The four modes are delivery modes, not country labels. A rural Malawian school
and an overcrowded Nigerian school may choose the same mode; a well-resourced
Bangladeshi school may choose shared devices.

## Priority 2 — research and content work, not yet implemented

| Requirement | Why | What is missing | Risk if skipped |
|---|---|---|---|
| Reconcile Kenya's route with the CBC | The registry's Form 1–4/KCSE route may not match the current CBC phase structure | Current Kenyan curriculum and assessment review | A Kenyan learner is placed on a stale route |
| Province/state/board routes | India, Pakistan, Nigeria and the Philippines are not single systems | Separate route records, not one national alias | One region's curriculum is imposed on another |
| Reviewed Bengali, Chichewa, Kiswahili, Kinyarwanda, Nepali, Urdu, Filipino and Bahasa teaching content | Interface dictionaries are not teaching translations; only one French plan is translated | Bilingual subject-specialist authoring and review | The app says it teaches in a language it does not |
| Country-specific curriculum mapping | A route record is not a syllabus mapping | Official syllabi and subject-specialist review | False coverage claims |
| Localised examples and units | Currency, agriculture, climate, transport, apparatus differ | Review of all 135 lessons against each profile | Examples confuse or exclude learners |
| Disability and sign-language provision | Philippines recognizes FSL; all profiles have disability gaps | Accessibility audit and real provision | Disabled learners are excluded |

## Priority 3 — evidence and validation

| Requirement | Why | Current state |
|---|---|---|
| Baseline and delayed post-test | A correct click after teaching is not retention | Existing evidence model supports measurement; no learner pilot |
| Parallel forms | Reusing the same item after teaching is not independent evidence | Engine supports item variants; no pilot forms |
| Teacher review of clarity, workload and curriculum fit | Research cannot replace local knowledge | 0 reviewed, 0 learner-tested, 0 approved |
| School-level validation | A national profile is not a classroom | 0 schools contacted; no consent or safeguarding approval |

## What must not be built

- **70 bespoke lesson systems.** Build shared context, language and print
  mechanisms; apply them to the 135 lessons.
- **Machine-translated lessons presented as localisation.** A partial or
  unreviewed translation is worse than an honest English lesson.
- **A country dashboard that ranks systems by a national average.** The figures
  are not comparable and do not describe a school.
- **A permanent “weak group” label.** Groups are temporary instructional
  groupings, not judgments about a child.
- **A requirement for a personal account, personal device or home printing.**
  Those are hidden costs that exclude the learners the product claims to serve.

## Acceptance checks for the next implementation slice

1. A teacher can choose no-device, shared-device, large-class, multilingual and
   limited-materials modes from the teacher-led page.
2. Changing mode changes the group routine, prompts and assumptions, but never
   turns a group answer into individual mastery evidence.
3. Every profile has all 22 required sections and one of the agreed statuses.
4. No profile above `INITIAL_RESEARCH` exists without a source and a named
   reviewer.
5. The country index and state are regenerated from the working tree, not
   hand-maintained.
6. Every synthetic school scenario has a complete delivery path across all 135
   lessons, and an unsupported language is reported as unsupported.
