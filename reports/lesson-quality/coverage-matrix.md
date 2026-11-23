# Authored lesson coverage matrix

Generated 2026-11-13T23:13:32.471Z.

All 135 authored openmind.lesson/1.0 lessons. Implemented means a code path exists; integrated means at least one authored lesson uses it; server-marked means /api/progress grades and records it; browser-verified means a real browser exercised the visible control. These are separate claims.

## Headline

- Authored lessons: **135**. Assessment items: **451**.
- Server-marked assessment items: **267 / 451** (59.2%).
- Lessons with at least one server-marked assessment or activity: **135 / 135**.
- Lessons with no server-marked assessment: **0**.
- Short-answer items with a deterministic key: **255**; without a key: **18** in **12** lessons.
- Constructed responses: **148**; structured items: **6**; code labs: **18**; gap fill: **1**; matching: **2**; ordering: **1**; diagram items: **2**.
- Authored block figures: **5** blocks across **4** lessons. Interactive fraction model: **1** lesson; probability models: **2** lessons.
- All 135 lesson pages were painted by the last recorded browser walk (1424 passed, 0 failed at 2026-11-13T00:01:33.117Z).
- All three retrieval intervals exist in **135 / 135** lessons; **0** use only next-day and/or week-later.
- Subject-teacher reviewed: **0**; learner-tested: **0**. No review or learner claim is inferred here.

## Format coverage

| Format | Implemented | Integrated (authored) | Server-marked | Browser-verified |
| --- | --- | --- | --- | --- |
| Short answer — deterministic key | yes | 132 lessons · 255 items | 132 lessons · 255 items | Yes — visible submissions in 21 lessons (scripts/lesson-walk.mjs) |
| Short answer — no key (self-marked) | yes | 12 lessons · 18 items | — | Render only — the authored-contract loop paints the item; no submission is made (scripts/lesson-walk.mjs) |
| Constructed response — self-marked against criteria | yes | 117 lessons · 148 items | — | Render only — the authored-contract loop paints the item; the one unscored reflection is labelled (scripts/lesson-walk.mjs) |
| Structured response — numeric parts | yes | 4 lessons · 6 items · 13 parts | 4 lessons · 6 items | Yes — scatter: 2/4 then 4/4; electricity: three method + three answer marks reach 6/6 in the browser (scripts/maths-batch-live-check.mjs + scripts/lesson-formats-browser-check.mjs) |
| Structured response — short criteria | yes | — | — | No — no authored item |
| Structured response — algebra | yes | — | — | No — no authored item |
| Structured response — graph, plot, read-off, table | elsewhere | — | — | No — implemented in the assessment app, refused by lib/lesson-verify.ts for authored lessons |
| Code lab — browser-run tests | yes | 18 lessons · 18 items | — | Yes — every authored code lab loads and runs; lists-arrays also drives edit, reset and a repaired pass (scripts/code-lab-check.mjs) |
| Diagram recognition and labelling | yes | 2 lessons · 2 items | 2 lessons · 2 items | Yes — fraction-bar and circuit drawings labelled through native selects; partial credit checked (scripts/lesson-formats-browser-check.mjs) |
| Gap fill — one independently marked blank per gap | yes | 1 lessons · 1 item | 1 lessons · 1 item | Yes — the photosynthesis summary is completed with accepted variants and a wrong keyword-bearing gap is refused (scripts/lesson-formats-browser-check.mjs) |
| Matching — terms to meanings | yes | 2 lessons · 2 items | 2 lessons · 2 items | Yes — photosynthesis and what-is-code pairs are submitted with select controls; partial credit checked (scripts/lesson-formats-browser-check.mjs) |
| Ordering — sequence and process | yes | 1 lessons · 1 item | 1 lessons · 1 item | Yes — the what-is-code algorithm is reordered with Up/Down buttons and marked by position (scripts/lesson-formats-browser-check.mjs) |
| Probability — Venn region selection | yes | 1 lessons · 1 item | 1 lessons · 1 item | Yes — union selection, keyboard toggle and 20% = 1/5 input are submitted visibly (scripts/lesson-walk.mjs) |
| Probability — completed tree | yes | 2 lessons · 2 items | 2 lessons · 2 items | Yes — probability-basics and tree-diagrams completed visibly, invalid input refused (scripts/lesson-walk.mjs) |
| Probability — simulation | yes | 1 lessons · 1 item | — | Yes — coin, die and bag runs, reset, and exhaustive outcome counts (scripts/lesson-walk.mjs) |

**Implemented** means the contract and a code path exist. **Integrated** means an authored lesson uses it. **Server-marked** means a submission reaches `/api/progress` and is recorded. **Browser-verified** means a browser exercised the visible control; `Render only` means the page painted but no submission was made.

Gap fill, matching, ordering and diagram labelling use the same pure marker and route as the structured items. A diagram is not counted because a picture rendered: the count requires authored labels, a target for each label, a server-marked submission and a browser-driven journey.

## Teaching-method coverage

| Method | Implemented | Lessons with it | Browser evidence | Server-marked |
| --- | --- | ---: | --- | --- |
| Explicit objective | yes | 135 / 135 | all authored pages render the objective card | n/a — teaching method, not a submission |
| Narrative hook and rationale | yes | 135 / 135 | all authored pages render the introduction | n/a — teaching method, not a submission |
| Prerequisite activation check | yes | 135 / 135 | all authored pages render the check disclosure | n/a — teaching method, not a submission |
| Written explanation | yes | 135 / 135 | all authored pages render the explanation sections | n/a — teaching method, not a submission |
| Subject-specific representation block | yes | 135 / 135 | all authored pages render at least one representation | n/a — teaching method, not a submission |
| Worked example with reasons | yes | 135 / 135 | all authored pages render the authored worked examples | n/a — teaching method, not a submission |
| Faded worked example (we do) | yes | 135 / 135 | lesson-walk presses “Show the first step” on the 21 figured pilot lessons | n/a — teaching method, not a submission |
| Misconception + correction + contrast | yes | 135 / 135 | all authored pages render the misconception section | n/a — teaching method, not a submission |
| Guided practice with hints | yes | 135 / 135 | all authored pages render at least one guided item and its hint | n/a — teaching method, not a submission |
| Independent assessment | yes | 135 / 135 | all authored pages render the assessment block | n/a — teaching method, not a submission |
| Transfer challenge | yes | 135 / 135 | all authored pages render the transfer section | n/a — teaching method, not a submission |
| Spaced retrieval | yes | 135 / 135 | all authored pages render the retrieval section | n/a — teaching method, not a submission |
| Retrieval at next-day, week-later and month-later | yes | 135 / 135 | the retrieval stamp is rendered; the interval content is a module check | n/a — teaching method, not a submission |
| Lesson summary | yes | 135 / 135 | all authored pages render the summary | n/a — teaching method, not a submission |
| Accessibility alternatives | yes | 135 / 135 | the alternatives are populated; no screen-reader session was run | n/a — teaching method, not a submission |
| Authored block figure | yes | 4 / 135 | lesson-walk measures the ratio bar, probability Venn/tree and scatter figures | n/a — teaching method, not a submission |
| Interactive fraction model | yes | 1 / 135 | not browser-verified: the component has no interaction test in the walk | n/a — teaching method, not a submission |
| Interactive probability model | yes | 2 / 135 | lesson-walk operates the Venn, tree and simulation controls | n/a — teaching method, not a submission |

The 14 core teaching methods are present in all 135 lessons; `retrieval-all-intervals` and the three optional extras (drawn figure, fraction model, probability model) vary. Their presence is not a quality score: the lesson gate checks structure and the review records remain empty.

## Per-lesson matrix

Format codes: `S` keyed short answer, `s` unkeyed short answer, `C` constructed response, `X` structured, `K` code lab, `D` diagram, `V` Venn, `T` tree, `M` simulation.

Server codes use the same letters for formats the server marks. Browser codes add `page` (the lesson page was painted) and the format codes a browser actually submitted.

| Concept | Subject | Plan | Methods | Formats | Server | Browser |
| --- | --- | --- | ---: | --- | --- | --- |
| biodiversity | biology | supplemental | 15/18 | SC | S | page |
| breathing-gas | biology | supplemental | 15/18 | SC | S | page |
| cells | biology | pilot | 15/18 | SC | S | page |
| circulation | biology | supplemental | 15/18 | SC | S | page S |
| diffusion | biology | supplemental | 15/18 | SC | S | page |
| digestion | biology | supplemental | 15/18 | SC | S | page |
| ecosystems | biology | supplemental | 15/18 | SC | S | page S |
| enzymes | biology | supplemental | 15/18 | SC | S | page |
| evolution | biology | supplemental | 15/18 | SC | S | page S |
| genetics | biology | supplemental | 15/18 | SC | S | page S |
| hormones | biology | supplemental | 15/18 | SC | S | page S |
| immune-health | biology | supplemental | 15/18 | SC | S | page S |
| microscopy | biology | supplemental | 15/18 | SC | S | page |
| nervous-system | biology | supplemental | 15/18 | SC | S | page S |
| photosynthesis | biology | pilot | 15/18 | sCFH | FH | page F H |
| respiration | biology | supplemental | 15/18 | SC | S | page |
| acids-bases | chemistry | supplemental | 15/18 | SC | S | page S |
| analysis-tests | chemistry | supplemental | 15/18 | SC | S | page S |
| atoms-elements | chemistry | supplemental | 15/18 | SC | S | page |
| compounds-mixtures | chemistry | supplemental | 15/18 | SC | S | page |
| covalent-bonding | chemistry | supplemental | 15/18 | SC | S | page S |
| electrolysis | chemistry | supplemental | 15/18 | SC | S | page S |
| electron-shells | chemistry | supplemental | 15/18 | SC | S | page |
| energy-changes | chemistry | authored | 15/18 | SC | S | page |
| equations-stoich | chemistry | pilot | 15/18 | SC | S | page |
| equilibria | chemistry | supplemental | 15/18 | SC | S | page S |
| ionic-bonding | chemistry | supplemental | 15/18 | SC | S | page S |
| metallic-bonding | chemistry | supplemental | 15/18 | SC | S | page S |
| moles-calcs | chemistry | authored | 15/18 | SC | S | page S |
| organic-intro | chemistry | supplemental | 15/18 | SC | S | page S |
| periodic-table | chemistry | supplemental | 15/18 | SC | S | page |
| rates-reaction | chemistry | supplemental | 15/18 | SC | S | page S |
| ai-basics | computing | supplemental | 15/18 | SK | S | page K |
| algorithms-search | computing | supplemental | 15/18 | SsK | S | page K |
| algorithms-sort | computing | supplemental | 15/18 | SK | S | page K |
| binary-data | computing | supplemental | 15/18 | SsK | S | page K |
| complexity | computing | supplemental | 15/18 | SK | S | page K |
| conditionals | computing | supplemental | 15/18 | SsK | S | page K |
| cybersecurity | computing | supplemental | 15/18 | SK | S | page K |
| databases-sql | computing | supplemental | 15/18 | SK | S | page K |
| dictionaries | computing | supplemental | 15/18 | SsK | S | page K |
| functions-code | computing | supplemental | 15/18 | SsK | S | page K |
| lists-arrays | computing | supplemental | 15/18 | SsK | S | page K |
| loops | computing | supplemental | 15/18 | SsK | S | page K |
| networks | computing | supplemental | 15/18 | SK | S | page K |
| recursion | computing | supplemental | 15/18 | SK | S | page K |
| statistics-data | computing | supplemental | 15/18 | SsK | S | page K |
| variables | computing | supplemental | 15/18 | SsK | S | page K |
| web-stack | computing | supplemental | 15/18 | SK | S | page K |
| what-is-code | computing | supplemental | 15/18 | sKHO | HO | page K H O |
| addition | maths | supplemental | 15/18 | SC | S | page |
| algebra-expand | maths | pilot | 15/18 | SC | S | page |
| algebra-expressions | maths | pilot | 15/18 | SC | S | page |
| algebraic-fractions | maths | supplemental | 15/18 | SC | S | page |
| angles-lines | maths | supplemental | 15/18 | SC | S | page |
| area-perimeter | maths | supplemental | 15/18 | SC | S | page |
| averages | maths | supplemental | 15/18 | SC | S | page |
| bearings | maths | supplemental | 15/18 | SC | S | page |
| binomial | maths | supplemental | 15/18 | SC | S | page |
| bounds | maths | supplemental | 15/18 | SC | S | page |
| calculus-diff | maths | supplemental | 15/18 | SC | S | page |
| calculus-int | maths | supplemental | 15/18 | SC | S | page |
| circle-area-arc | maths | supplemental | 15/18 | SC | S | page |
| circle-geometry-adv | maths | supplemental | 15/18 | SC | S | page |
| circle-theorems | maths | supplemental | 15/18 | SC | S | page |
| completing-square | maths | pilot | 15/18 | SC | S | page S |
| coordinates | maths | pilot | 15/18 | SC | S | page |
| data-charts | maths | supplemental | 15/18 | SCX | SX | page |
| decimals | maths | pilot | 15/18 | SC | S | page |
| division | maths | supplemental | 15/18 | SC | S | page |
| financial-maths | maths | supplemental | 15/18 | SC | S | page |
| fraction-ops | maths | pilot | 15/18 | SC | S | page |
| fractions | maths | pilot | 16/18 | SCD | SD | page D |
| functions | maths | supplemental | 15/18 | SC | S | page |
| growth-decay | maths | supplemental | 15/18 | SC | S | page |
| indices-intro | maths | pilot | 15/18 | SC | S | page |
| inequalities | maths | supplemental | 15/18 | SC | S | page |
| iteration | maths | supplemental | 15/18 | SC | S | page |
| kinematics | maths | supplemental | 15/18 | SC | S | page |
| linear-equations | maths | pilot | 15/18 | SC | S | page |
| loci-constructions | maths | supplemental | 15/18 | SC | S | page |
| logic-maths | maths | supplemental | 15/18 | SC | S | page |
| logs | maths | supplemental | 15/18 | SC | S | page |
| matrices-intro | maths | supplemental | 15/18 | SC | S | page |
| mixture-problems | maths | supplemental | 15/18 | SC | S | page |
| multiplication | maths | pilot | 15/18 | SC | S | page |
| negatives | maths | pilot | 15/18 | SC | S | page |
| number-bases | maths | supplemental | 15/18 | SC | S | page |
| order-ops | maths | pilot | 15/18 | SC | S | page |
| percentages | maths | pilot | 15/18 | SC | S | page |
| place-value | maths | pilot | 15/18 | SC | S | page |
| polynomials | maths | supplemental | 15/18 | SC | S | page |
| probability-basics | maths | supplemental | 17/18 | SCVTM | SVT | page S V T M |
| proof | maths | supplemental | 15/18 | SC | S | page |
| proportion | maths | supplemental | 15/18 | SC | S | page S |
| proportional-graphs | maths | supplemental | 15/18 | SC | S | page |
| pythagoras | maths | supplemental | 15/18 | SC | S | page |
| quadratic-graphs | maths | supplemental | 15/18 | SC | S | page |
| quadratics | maths | pilot | 15/18 | SC | S | page |
| ratio | maths | supplemental | 16/18 | SC | S | page S |
| rounding | maths | supplemental | 15/18 | SC | S | page |
| scatter-correlation | maths | supplemental | 16/18 | SCX | SX | page X |
| sequences | maths | supplemental | 15/18 | SC | S | page S |
| sets-venn | maths | supplemental | 15/18 | SC | S | page |
| sim-equations-quad | maths | supplemental | 15/18 | SC | S | page |
| simultaneous | maths | supplemental | 15/18 | SC | S | page |
| standard-form | maths | supplemental | 15/18 | SC | S | page |
| straight-lines | maths | pilot | 15/18 | SC | S | page |
| subtraction | maths | supplemental | 15/18 | SC | S | page |
| surds | maths | pilot | 15/18 | SC | S | page |
| transformations | maths | supplemental | 15/18 | SC | S | page |
| tree-diagrams | maths | supplemental | 17/18 | SCT | ST | page T |
| trig-identity | maths | supplemental | 15/18 | SC | S | page |
| trig-ratios | maths | supplemental | 15/18 | SC | S | page |
| trig-rule | maths | supplemental | 15/18 | SC | S | page |
| vectors | maths | supplemental | 15/18 | SC | S | page |
| volume | maths | supplemental | 15/18 | SC | S | page |
| astrophysics | physics | supplemental | 15/18 | SC | S | page |
| atoms-nucleus | physics | supplemental | 15/18 | SC | S | page |
| electricity-circuits | physics | pilot | 15/18 | sCXD | XD | page X D |
| em-induction | physics | supplemental | 15/18 | SC | S | page |
| energy-conservation | physics | supplemental | 15/18 | SC | S | page |
| forces-basics | physics | supplemental | 15/18 | SC | S | page |
| gravity-fields | physics | supplemental | 15/18 | SC | S | page |
| light-optics | physics | supplemental | 15/18 | SC | S | page |
| magnetism | physics | supplemental | 15/18 | SC | S | page |
| momentum | physics | supplemental | 15/18 | SC | S | page |
| motion-graphs | physics | supplemental | 15/18 | SCX | SX | page |
| newton-laws | physics | supplemental | 15/18 | SC | S | page |
| pressure-fluids | physics | supplemental | 15/18 | SC | S | page |
| radioactivity | physics | supplemental | 15/18 | SC | S | page |
| sound-acoustics | physics | supplemental | 15/18 | SC | S | page |
| thermal-physics | physics | supplemental | 15/18 | SC | S | page |
| waves-basics | physics | supplemental | 15/18 | SC | S | page |
| work-power | physics | supplemental | 15/18 | SC | S | page |

`Methods` counts the 18 rows above. The 14 core teaching methods are present in every lesson; `retrieval-all-intervals` and the figure, fraction-model and probability extras vary.

## Gaps this audit makes visible

- **Every lesson has at least one server-marked assessment.**
- **18 short-answer items in 12 lessons have no deterministic key.** They render as short-answer but cannot be marked by the server; they are self-marked.
- **148 constructed responses remain self-marked.** One is explicitly unscored; none is server-marked.
- **Structured coverage is 6 item(s).** Authored structured items use numeric method/answer parts. Table, graph, plot and read-off parts remain available to the assessment app but are refused by the authored-lesson renderer, so no lesson claims them.
- **Code labs are not server-marked.** 18 code items exist and all 18 are browser-exercised; the tests run in the browser and are practice feedback, not evidence.
- **Diagram assessment is integrated in 2 lessons.** The renderer supports numbered SVG targets and native-select labels; free-placed hotspots remain future work.
- **Gap fill, matching and ordering are integrated but narrow.** 1 gap-fill, 2 matching and 1 ordering items exercise the formats; broader rollout remains.
- **The interactive fraction model is not browser-verified.** It is integrated in one lesson, but the walk has no interaction assertion for it.
- **Retrieval spacing is complete.** All 135 lessons carry next-day, week-later and month-later prompts.
- **No subject-teacher review or learner-testing record exists.** This matrix reports structural coverage, not teaching effectiveness.

## What this matrix does not claim

A present method is not a good method. A server-marked item is not a valid item. A browser-verified control is not evidence that a learner learned from it. The only human-evidence columns remain zero, and this report does not fill them.

