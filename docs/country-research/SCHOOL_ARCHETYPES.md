# School archetypes and synthetic acceptance scenarios

> **Status: SYNTHETIC_ONLY / INITIAL_RESEARCH.** These are evidence-derived
> design cases, not representative classrooms. No school, teacher, learner or
> education authority has been contacted. Passing the gate proves the delivery
> path exists; it does not prove a child learned, a teacher could prepare it in
> the available time, or the language is understandable.

## Why this file exists

A national average is not a school. The same country can contain a well-equipped
urban private school and a remote classroom with no electricity, and a learner's
home language can differ from the teaching and examination languages. Product
decisions therefore name the **delivery condition**, not the country:

- a teacher with one computer and no pupil devices;
- a large class with shared textbooks;
- one device per group, or a family-shared phone;
- no reliable electricity or internet;
- several languages in one room;
- interrupted schooling.

The condition is not a permanent label for a child or a school. A school can move
between conditions, and a scenario can occur in many countries.

## The seven archetypes

| Archetype | What the evidence describes | Country examples in the current profiles | What OpenMind must provide | What must not be assumed |
|---|---|---|---|---|
| **No-student-device classroom** | Teacher computer or printed plan; pupils use exercise books | Bangladesh state primary classes of 40–70; Malawi; Pakistan | Teacher guide, board plan, printable worksheet, separate key, presenter that records no learner answers | A device per pupil, a projector, permanent electricity |
| **Large public classroom** | One teacher, many pupils, limited feedback time, mixed levels | Malawi (66% of lower-primary schools above 90 pupils per permanent classroom; PTR 61); Nigeria (PTR 47); Tanzania | Shoulder-partner/group routine, sampled oral checks, class misconception summary, print | That every book can be marked during the lesson, or that a group answer is individual evidence |
| **Shared-device school** | One device per group or a small computer room; rotation | India (family-shared phone); Pakistan; Philippines | Identity switching, group roles, local progress, no false individual mastery, print fallback | One device per pupil, continuous connectivity |
| **Rural offline school** | Little or no internet; intermittent electricity; material distributed physically | Malawi; Nepal; remote districts in several profiles | Local content pack, offline authored assessment, print, later synchronisation, small package | A live server, cloud sync during the lesson, a school LAN that has been tested |
| **Multilingual school** | Home language differs from teaching language; examination language may differ again | Nigeria (North West/South East differences); Nepal (124 mother tongues); Tanzania (Kiswahili→English); Rwanda | Five language roles, bilingual terminology prompt, explicit examination term, honest statement when no reviewed translation exists | That a country has one language, or that an interface translation is a teaching translation |
| **Low-cost individual-device school** | Older Android phone or modest computer, limited storage, slow/prepaid data | India (only 26.9% of girls and 36.2% of boys in rural ASER reported owning a smartphone, despite ~90% household access) | Small pages, no video dependency, low-data print fallback, offline pack | Modern hardware, unlimited data, app-store access |
| **Displaced or interrupted-education learners** | Irregular attendance, interrupted schooling, different academic levels | Philippines (disaster continuity and ALS are first-order); conflict-affected profiles | Portable print pack, self-contained lesson, no permanent connectivity, re-entry without a permanent "weak" label | Continuous attendance, a stable school calendar, a conventional school record |

The archetypes are not exhaustive. They are the conditions that change the
delivery path most sharply in the current evidence.

## The eight synthetic scenarios

The machine-readable source is [`SCHOOL_SCENARIOS.json`](SCHOOL_SCENARIOS.json).
Each scenario declares one primary classroom condition, any secondary ones, the
five language roles, the device/connectivity/material assumptions, the evidence
files and the product path that must exist.

| Scenario | Country | Primary condition | Language position | Delivery stress |
|---|---|---|---|---|
| BD-primary-no-device | Bangladesh | No pupil devices | Bengali interface and teaching; **no reviewed Bengali lesson translation** | Print, board, exercise books; no projector or reliable power assumed |
| MW-large-shared-textbook | Malawi | Limited materials, plus large class | English teaching; **Chichewa is not a supported interface or lesson language** | 90+ pupils, shared textbook, no laboratory; safe substitute or planned measurement |
| NG-multilingual-large-class | Nigeria | Multilingual, plus large class | English teaching; state/home-language support not reviewed | Regional/state differences; no single Nigerian system; paper/group assessment |
| PK-provincial-shared-device | Pakistan | Shared device, plus no-device | Urdu interface/teaching (RTL); English examination; **no reviewed Urdu lesson translation** | Provincial systems and boards; intermittent connectivity; print fallback |
| NP-multilingual-remote | Nepal | Multilingual, plus rural offline | English teaching; **Nepali is not a supported interface or lesson language** | No device, no permanent connection; a national average is not a remote school |
| TZ-kiswahili-english | Tanzania | Multilingual, plus large class | Kiswahili interface/teaching; English examination; **no reviewed Kiswahili lesson translation** | Primary→secondary language transition; examination term must stay visible |
| PH-disaster-shared-device | Philippines | Displaced/interrupted, plus shared device | Filipino interface/teaching; English examination; **no reviewed Filipino lesson translation** | Disaster continuity; offline pack and print; current 2025 language policy, not the old mother-tongue rule |
| IN-family-smartphone | India | Shared device, plus low-cost individual device | Hindi teaching; English examination; **no reviewed Hindi lesson translation** | Family phone, no personal email required, state/board variation, print/offline |

## What the gate verifies

`npm run verify:school-reality` reads the scenario file and asserts:

1. eight unique scenarios cover all seven archetypes;
2. every declared classroom condition exists in `lib/classroom-session.ts`;
3. every evidence file exists;
4. every scenario requires print and offline delivery;
5. no reviewed teaching translation is claimed;
6. all five language roles survive `lib/language-profile.ts`;
7. an unsupported target language is declared unsupported, not silently mapped to English;
8. the examination-language constraint appears when teaching and examination languages differ;
9. for every scenario × every authored lesson, the worksheet, separate key, teacher guide and presenter are complete;
10. the worksheet leaks no key field and the teacher guide carries no assessment answer or marking copy;
11. every presenter run has a group slide and states that no learner answers are recorded;
12. each scenario has at least one deterministic offline assessment item per lesson.

Measured on this checkout: **110 assertions, 0 failed; 1,080 lesson-scenario
combinations; 1,080 with deterministic offline assessment.**

## What the gate does not prove

- That any teacher could prepare the guide in the time available.
- That a pupil understands the English or the interface language.
- That a shared phone is actually available, charged and private enough.
- That printing is affordable, legible or available.
- That the lesson examples are culturally or linguistically appropriate.
- That the curriculum sequence matches the country's syllabus.
- That a school would consent, or that a learner pilot would be safe.

Those require local teachers, subject specialists, language reviewers, school
leaders and a supervised pilot. Until then the status stays
**SYNTHETIC_ONLY / INITIAL_RESEARCH**, never `SCHOOL_VALIDATED`.

## Product consequences already implemented

- Five classroom conditions in the presenter, including no-device and
  limited-materials routines.
- A teacher guide generated from the same authored lesson, with board plan,
  prior checks, misconception notes, group routine, exit ticket and no
  assessment answers.
- Four **temporary** lesson groups (Foundational, Developing, Applying,
  Extending) built from the lesson's own hint, guided practice, independent
  assessment and transfer prompt. The guide says to place pupils by the prior
  check or exit ticket and move them afterwards, never by school year or a
  permanent label.
- A pupil worksheet and separate authenticated key.
- Offline authored assessment for deterministic formats; prose and code remain
  print/teacher-marked.
- Shared-device and kiosk identity paths with group answers explicitly excluded
  from individual mastery.

## Consequences still open

- Reviewed teaching translations for Bengali, Chichewa, Kiswahili, Kinyarwanda,
  Nepali, Urdu, Filipino, Hindi and Bahasa Indonesia.
- Province/state/board route records for India, Pakistan and Nigeria.
- A real school-level audit of electricity, connectivity, device condition,
  printing and class size.
- Teacher timing and workload testing, then a supervised learner pilot.
- Disability and sign-language provision, including Filipino Sign Language.
