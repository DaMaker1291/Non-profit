# Execution state

Checkpoint written at **2026-11-10T21:30:10.782Z** by `scripts/international-readiness.mjs`.

## Working tree

- Branch: `main`
- HEAD: `3c4a4604892341e2d91fc73f9a1b30afc452edfb`
- Changed/untracked paths: **72**
- Free disk: **2.24 GiB** (the suite's guard is independent; this is only a check-point observation)
- Browser coverage: **70/70 authored lessons** have a row in the walk contract (missing: none). The 65 outlines are not browser-applicable until they have an authored lesson.

## Completed in this batch

- Authored and registered `organic-intro` (chemistry, stage 3). The catalogue is now **70 authored / 65 outline**, with **70 machine-checked**, **0 critical** gaps and chemistry now at 15/16.
- `organic-intro` teaches carbon's four bonds, alkanes and alkenes, fractional distillation, cracking and combustion, and addition polymerisation. It has 4 objectives, 5 explanation sections (19 paragraphs), 4 representation blocks, 3 worked examples, 4 misconception repairs, 3 guided items, 3 assessments, a propene-container transfer, 3 retrieval prompts and 4 accessibility alternatives. The cracking equation conserves atoms and the polymer repeat unit preserves the monomer's connectivity.
- Integrated a third assessment blueprint without a second marker. The mathematics tables unit compiles into the existing `StructuredItem` path, with one mark per blank cell and one criterion attached to each cell. All three blueprints remain unreviewed and unservable. The audit is **3 blueprints / 17 items / 52 marks / 6 sources / 12 misconceptions / 0 reviewed / 0 servable / 0 issues**.
- The browser-contract denominator is one row per authored lesson: **70/70** have a contract row, and `npm run verify` fails if a future authored lesson has no row.
- The browser walk was completed: **857 passed, 0 failed**. `organic-intro` rendered at 1280, 768, 375 and 320 px, and its visible `a2` answer `propene, C3H6` was marked correct by the server. The same run confirms the other 69 authored lessons.
- The assessment gates are part of `npm run verify`: the marking gate passes **80/0** and the self-test refuses **14/14** planted defects, then accepts a genuine review record. The live scratch-store journey passes **40/0**, and a real-browser fixture journey passes **33/0** across numeric, table, short-answer and prose formats. The teacher pack remains **UNREVIEWED — NOT AN APPROVAL** with 0 reviews and 0 servable blueprints. No blueprint is served while it is unreviewed.

## Tests actually run

| Command | Result |
| --- | --- |
| `npm run lesson:catalogue` | exit 0; 135 concepts, **70 authored**, 65 outline, 70 machine_checked |
| `npm run typecheck` | exit 0 |
| `npm run verify` | **4631 passed, 0 failed**, then the assessment gates: **3 blueprints / 17 items / 52 marks / 6 sources / 12 misconceptions / 0 reviewed / 0 servable / 0 issues**, and **80 marking assertions / 0 failed** |
| `npm run verify:lessons` | exit 0; all lesson subject checks, including **209 chemistry assertions** and the new organic-intro checks |
| `npm run assessment:self-test` | **14/14 planted defects refused**, then a genuine review record accepted |
| `npm run assessment:marking` | **80 passed, 0 failed**: fully correct, partial credit, alternative wording, missing units, incorrect reasoning, misconception-specific responses, table cells, rubric-only prose, and refusal of every unreviewed blueprint |
| `npm run verify:lesson` | **857 passed, 0 failed**; all 70 authored lessons at four widths, and the organic-intro `a2` answer `propene, C3H6` marked by the server |
| `npm run assessment:journey` | **40 passed, 0 failed** against the scratch store: full and partial marking, alternative wording, missing units, invalid input, unscored prose, evidence, projection and next step |
| `npm run assessment:browser` | **33 passed, 0 failed** in Chrome against the labelled fixture: gate, numeric, table, short-answer, prose, partial credit, misconception, missing unit, invalid input, evidence, mastery and next step |
| `npm run assessment:teacher-pack` | exit 0; **UNREVIEWED — NOT AN APPROVAL**, 0 teacher reviews, 0 servable blueprints |

## Next task

No critical content gap remains. `organic-intro` is authored, browser-verified at 1280, 768, 375 and 320 px, and in the browser regression contract. The next high-priority chemistry concept is `rates-reaction`. All 70 authored lessons remain in the browser regression contract; the 65 outlines are not browser-applicable until authored. The production build and restart drill remain outstanding; check the shared volume's headroom before that run.

```bash
npm run readiness
npm run readiness:check
```

## Scratch-store state

The browser walk ran against the scratch `OPENMIND_DATA_DIR` under `/tmp`, never `.openmind-data`; the scratch store is disposable and is not a learner or teacher record.

## Limitations

- 0 genuine educator reviews and 0 learner-tested lessons; fixture records are not human evidence.
- The browser checks use fixture signed-in accounts; they are not a learner, teacher or assistive-technology session.
- 0 reviewed teaching languages; 2 machine translations are labelled unreviewed.
- 0 reviewed curriculum mappings; the matrix is a record of structure, not a support claim.
- Browser coverage is structural: all 70 authored pages paint and fit four widths, but this is not a teacher review, a learner trial or an assistive-technology session.
- 65 outline concepts still have no authored lesson; the queue, not a completion claim, is the record of that work.
- The biology blueprint's source permission is unknown and the physics source is a public specification; neither blueprint has a teacher review or a learner trial. They are design prototypes, not validated exams or a licence to republish the school's material.
- The production build, restart drill and assistive-technology session have not been re-run in this batch.
