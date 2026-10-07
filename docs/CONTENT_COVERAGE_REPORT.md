# OpenMind — Content Coverage Report

**GENERATED — do not edit by hand.** Every figure below is measured by
`scripts/content-audit.mjs` from the compiled engines and the production serve path
(`lib/operations.ts#servePractice`, the function `app/api/progress/route.ts` and the
published page both call — not `generateQuestionNear` directly, because the aim is the
decision). Regenerate with:

```
npm run verify          # compiles the .verify mirror this reads
npm run content-audit -- --json --report
```

**At:** 2026-10-07T20:59:58.997Z
**Search budget:** 40 draws per serve (production is `PRACTICE_DRAW_ATTEMPTS`)
**Serves per concept:** 5

Difficulty here is the item's own declared difficulty (0–1), never a label. `target` is what
the ladder will ask of a learner who has demonstrated mastery in that course; `ceiling` is the
hardest item the concept's generator can produce at any seed; `served` is what came back.

## The five links in the chain

A course can fall short at any of five places, and they need different fixes:

| Link | What it is | Where it is set |
|---|---|---|
| declared | the qualification's own demand | `lib/specifications.ts` |
| ladder tier | the most practice will ever aim at | `practiceTarget` — clamps `tier` at 0.7 |
| target | what a mastered learner in this course is asked for | `practiceTarget`, stretch rung |
| ceiling | the hardest item the concept's generator makes | `conceptDepth` (`lib/questions.ts`) |
| served | the difficulty actually returned | `servePractice` + `generateQuestionNear` |

## The three causes of a shortfall

| Cause | Test | Fix |
|---|---|---|
| **A** search | items in the target's band EXIST, and the production serve did not return one | a bigger search budget |
| **B** generator | the generator produces NOTHING in the target's band, at any seed | a deeper generator |
| **C** missing | no generator, or a CONSTANT one (a single item) | real content for the concept |

The test is the serve's OWN test — `difficultyBandFor`, which is what `generateQuestionNear`
prefers — so "can this concept express this rung?" is a question about bands, not about a
distance. A concept can have a high `conceptDepth` (one deep family) and still be a **B** for a
middle rung: measured, `scatter-correlation` produces 0.4 and then nothing until 0.78, so band 3
(0.50–0.61) is unreachable for it while its ceiling is 0.938.

More draws can only ever fix an A, and the audit measures that directly: the same run at
`--attempts=400` reports the A count for a 10× budget. If A does not fall, the shortfall was
never a search problem, and raising the budget would have been a change that fixed nothing.

## 1. Every course × subject (271 rows)

`decl` declared · `tier` the ladder's own tier after its clamp · `ladder` target (stretch rung) ·
`ceiling` mean concept ceiling · `served` mean served difficulty · `at tgt` concepts whose serve
reaches the target · `A/B/C` shortfall causes · `recall` share of served items in the recall band.

| course | level | subject | decl | tier | ladder | ceiling | served | at tgt | A/B/C | recall |
|---|---|---|---|---|---|---|---|---|---|---|
| uk-alevel | A2 | maths | 0.9 | 0.7 | 0.9 | 0.921 | 0.9 | 43/43 | 0/0/0 | 0% |
| uk-alevel | A2 | physics | 0.9 | 0.7 | 0.9 | 0.944 | 0.894 | 14/14 | 0/0/0 | 0% |
| uk-alevel | A2 | chemistry | 0.9 | 0.7 | 0.9 | 0.949 | 0.902 | 12/12 | 0/0/0 | 0% |
| uk-alevel | A2 | biology | 0.9 | 0.7 | 0.9 | 0.956 | 0.905 | 8/8 | 0/0/0 | 0% |
| uk-alevel | A2 | computing | 0.9 | 0.7 | 0.9 | 0.951 | 0.901 | 10/10 | 0/0/0 | 0% |
| int-ib | Diploma HL | maths | 0.9 | 0.7 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| int-ib | Diploma HL | physics | 0.9 | 0.7 | 0.9 | 0.922 | 0.885 | 18/18 | 0/0/0 | 0% |
| int-ib | Diploma HL | chemistry | 0.9 | 0.7 | 0.9 | 0.926 | 0.889 | 16/16 | 0/0/0 | 0% |
| int-ib | Diploma HL | biology | 0.9 | 0.7 | 0.9 | 0.931 | 0.891 | 16/16 | 0/0/0 | 0% |
| int-ib | Diploma HL | computing | 0.9 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| us-ap | AP | maths | 0.85 | 0.7 | 0.9 | 0.921 | 0.899 | 43/43 | 0/0/0 | 0% |
| us-ap | AP | physics | 0.85 | 0.7 | 0.9 | 0.944 | 0.897 | 14/14 | 0/0/0 | 0% |
| us-ap | AP | chemistry | 0.85 | 0.7 | 0.9 | 0.949 | 0.901 | 12/12 | 0/0/0 | 0% |
| us-ap | AP | biology | 0.85 | 0.7 | 0.9 | 0.956 | 0.905 | 8/8 | 0/0/0 | 0% |
| us-ap | AP | computing | 0.85 | 0.7 | 0.9 | 0.951 | 0.9 | 10/10 | 0/0/0 | 0% |
| in-cbse | Class 11–12 | maths | 0.85 | 0.7 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| in-cbse | Class 11–12 | physics | 0.85 | 0.7 | 0.9 | 0.922 | 0.882 | 18/18 | 0/0/0 | 0% |
| in-cbse | Class 11–12 | chemistry | 0.85 | 0.7 | 0.9 | 0.926 | 0.89 | 16/16 | 0/0/0 | 0% |
| in-cbse | Class 11–12 | biology | 0.85 | 0.7 | 0.9 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| in-cbse | Class 11–12 | computing | 0.85 | 0.7 | 0.9 | 0.951 | 0.899 | 18/18 | 0/0/0 | 0% |
| in-icse | ISC 11–12 | maths | 0.85 | 0.7 | 0.9 | 0.825 | 0.811 | 55/63 | 0/8/0 | 3% |
| in-icse | ISC 11–12 | physics | 0.85 | 0.7 | 0.9 | 0.922 | 0.883 | 18/18 | 0/0/0 | 0% |
| in-icse | ISC 11–12 | chemistry | 0.85 | 0.7 | 0.9 | 0.926 | 0.89 | 16/16 | 0/0/0 | 0% |
| in-icse | ISC 11–12 | biology | 0.85 | 0.7 | 0.9 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| in-icse | ISC 11–12 | computing | 0.85 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| any-independent | Advanced | maths | 0.8 | 0.7 | 0.9 | 0.831 | 0.817 | 59/67 | 0/8/0 | 3% |
| any-independent | Advanced | physics | 0.8 | 0.7 | 0.9 | 0.922 | 0.886 | 18/18 | 0/0/0 | 0% |
| any-independent | Advanced | chemistry | 0.8 | 0.7 | 0.9 | 0.926 | 0.889 | 16/16 | 0/0/0 | 0% |
| any-independent | Advanced | biology | 0.8 | 0.7 | 0.9 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| any-independent | Advanced | computing | 0.8 | 0.7 | 0.9 | 0.951 | 0.901 | 18/18 | 0/0/0 | 0% |
| bd-ssc | Class 11–12 (HSC) | maths | 0.78 | 0.7 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| bd-ssc | Class 11–12 (HSC) | physics | 0.78 | 0.7 | 0.9 | 0.922 | 0.876 | 18/18 | 0/0/0 | 0% |
| bd-ssc | Class 11–12 (HSC) | chemistry | 0.78 | 0.7 | 0.9 | 0.923 | 0.889 | 15/15 | 0/0/0 | 0% |
| bd-ssc | Class 11–12 (HSC) | biology | 0.78 | 0.7 | 0.9 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| bd-ssc | Class 11–12 (HSC) | computing | 0.78 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| uk-alevel | AS | maths | 0.75 | 0.7 | 0.9 | 0.919 | 0.899 | 39/39 | 0/0/0 | 0% |
| uk-alevel | AS | physics | 0.75 | 0.7 | 0.9 | 0.944 | 0.894 | 14/14 | 0/0/0 | 0% |
| uk-alevel | AS | chemistry | 0.75 | 0.7 | 0.9 | 0.949 | 0.902 | 12/12 | 0/0/0 | 0% |
| uk-alevel | AS | biology | 0.75 | 0.7 | 0.9 | 0.956 | 0.906 | 8/8 | 0/0/0 | 0% |
| uk-alevel | AS | computing | 0.75 | 0.7 | 0.9 | 0.951 | 0.9 | 10/10 | 0/0/0 | 0% |
| pk-matric | Class 11–12 (Inter) | maths | 0.75 | 0.7 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| pk-matric | Class 11–12 (Inter) | physics | 0.75 | 0.7 | 0.9 | 0.922 | 0.883 | 18/18 | 0/0/0 | 0% |
| pk-matric | Class 11–12 (Inter) | chemistry | 0.75 | 0.7 | 0.9 | 0.923 | 0.889 | 15/15 | 0/0/0 | 0% |
| pk-matric | Class 11–12 (Inter) | biology | 0.75 | 0.7 | 0.9 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| pk-matric | Class 11–12 (Inter) | computing | 0.75 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| int-ib | Diploma SL | maths | 0.7 | 0.7 | 0.9 | 0.825 | 0.813 | 55/63 | 0/8/0 | 3% |
| int-ib | Diploma SL | physics | 0.7 | 0.7 | 0.9 | 0.922 | 0.882 | 18/18 | 0/0/0 | 0% |
| int-ib | Diploma SL | chemistry | 0.7 | 0.7 | 0.9 | 0.926 | 0.89 | 16/16 | 0/0/0 | 0% |
| int-ib | Diploma SL | biology | 0.7 | 0.7 | 0.9 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| int-ib | Diploma SL | computing | 0.7 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| au-acara | Senior secondary | maths | 0.7 | 0.7 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| au-acara | Senior secondary | physics | 0.7 | 0.7 | 0.9 | 0.922 | 0.885 | 18/18 | 0/0/0 | 0% |
| au-acara | Senior secondary | chemistry | 0.7 | 0.7 | 0.9 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| au-acara | Senior secondary | biology | 0.7 | 0.7 | 0.9 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| au-acara | Senior secondary | computing | 0.7 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| ie-junior | Senior Cycle | maths | 0.7 | 0.7 | 0.9 | 0.825 | 0.811 | 55/63 | 0/8/0 | 3% |
| ie-junior | Senior Cycle | physics | 0.7 | 0.7 | 0.9 | 0.922 | 0.883 | 18/18 | 0/0/0 | 0% |
| ie-junior | Senior Cycle | chemistry | 0.7 | 0.7 | 0.9 | 0.923 | 0.889 | 15/15 | 0/0/0 | 0% |
| ie-junior | Senior Cycle | biology | 0.7 | 0.7 | 0.9 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| ie-junior | Senior Cycle | computing | 0.7 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| ke-kcse | Form 4 (KCSE) | maths | 0.7 | 0.7 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| ke-kcse | Form 4 (KCSE) | physics | 0.7 | 0.7 | 0.9 | 0.922 | 0.88 | 18/18 | 0/0/0 | 0% |
| ke-kcse | Form 4 (KCSE) | chemistry | 0.7 | 0.7 | 0.9 | 0.923 | 0.889 | 15/15 | 0/0/0 | 0% |
| ke-kcse | Form 4 (KCSE) | biology | 0.7 | 0.7 | 0.9 | 0.931 | 0.894 | 16/16 | 0/0/0 | 0% |
| ke-kcse | Form 4 (KCSE) | computing | 0.7 | 0.7 | 0.9 | 0.951 | 0.901 | 18/18 | 0/0/0 | 0% |
| ng-waec | SSS 1–3 (WAEC) | maths | 0.7 | 0.7 | 0.9 | 0.825 | 0.811 | 55/63 | 0/8/0 | 3% |
| ng-waec | SSS 1–3 (WAEC) | physics | 0.7 | 0.7 | 0.9 | 0.922 | 0.886 | 18/18 | 0/0/0 | 0% |
| ng-waec | SSS 1–3 (WAEC) | chemistry | 0.7 | 0.7 | 0.9 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| ng-waec | SSS 1–3 (WAEC) | biology | 0.7 | 0.7 | 0.9 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| ng-waec | SSS 1–3 (WAEC) | computing | 0.7 | 0.7 | 0.9 | 0.951 | 0.901 | 18/18 | 0/0/0 | 0% |
| br-enem | Médio (ENEM) | maths | 0.7 | 0.7 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| br-enem | Médio (ENEM) | physics | 0.7 | 0.7 | 0.9 | 0.922 | 0.879 | 18/18 | 0/0/0 | 0% |
| br-enem | Médio (ENEM) | chemistry | 0.7 | 0.7 | 0.9 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| br-enem | Médio (ENEM) | biology | 0.7 | 0.7 | 0.9 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| br-enem | Médio (ENEM) | computing | 0.7 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| mx-sep | Preparatoria | maths | 0.7 | 0.7 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| mx-sep | Preparatoria | physics | 0.7 | 0.7 | 0.9 | 0.922 | 0.885 | 18/18 | 0/0/0 | 0% |
| mx-sep | Preparatoria | chemistry | 0.7 | 0.7 | 0.9 | 0.923 | 0.889 | 15/15 | 0/0/0 | 0% |
| mx-sep | Preparatoria | biology | 0.7 | 0.7 | 0.9 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| mx-sep | Preparatoria | computing | 0.7 | 0.7 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| gh-wassce | SHS 1–3 (WASSCE) | maths | 0.68 | 0.68 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| gh-wassce | SHS 1–3 (WASSCE) | physics | 0.68 | 0.68 | 0.9 | 0.922 | 0.88 | 18/18 | 0/0/0 | 0% |
| gh-wassce | SHS 1–3 (WASSCE) | chemistry | 0.68 | 0.68 | 0.9 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| gh-wassce | SHS 1–3 (WASSCE) | biology | 0.68 | 0.68 | 0.9 | 0.931 | 0.891 | 16/16 | 0/0/0 | 0% |
| gh-wassce | SHS 1–3 (WASSCE) | computing | 0.68 | 0.68 | 0.9 | 0.951 | 0.901 | 18/18 | 0/0/0 | 0% |
| ph-deped | Senior High | maths | 0.68 | 0.68 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| ph-deped | Senior High | physics | 0.68 | 0.68 | 0.9 | 0.922 | 0.879 | 18/18 | 0/0/0 | 0% |
| ph-deped | Senior High | chemistry | 0.68 | 0.68 | 0.9 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| ph-deped | Senior High | biology | 0.68 | 0.68 | 0.9 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| ph-deped | Senior High | computing | 0.68 | 0.68 | 0.9 | 0.951 | 0.901 | 18/18 | 0/0/0 | 0% |
| id-merdeka | SMA 10–12 | maths | 0.68 | 0.68 | 0.9 | 0.825 | 0.812 | 55/63 | 0/8/0 | 3% |
| id-merdeka | SMA 10–12 | physics | 0.68 | 0.68 | 0.9 | 0.922 | 0.883 | 18/18 | 0/0/0 | 0% |
| id-merdeka | SMA 10–12 | chemistry | 0.68 | 0.68 | 0.9 | 0.923 | 0.889 | 15/15 | 0/0/0 | 0% |
| id-merdeka | SMA 10–12 | biology | 0.68 | 0.68 | 0.9 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| id-merdeka | SMA 10–12 | computing | 0.68 | 0.68 | 0.9 | 0.951 | 0.9 | 18/18 | 0/0/0 | 0% |
| uk-gcse | Higher tier | maths | 0.65 | 0.65 | 0.87 | 0.825 | 0.798 | 55/63 | 0/8/0 | 3% |
| uk-gcse | Higher tier | physics | 0.65 | 0.65 | 0.87 | 0.922 | 0.882 | 18/18 | 0/0/0 | 0% |
| uk-gcse | Higher tier | chemistry | 0.65 | 0.65 | 0.87 | 0.923 | 0.889 | 15/15 | 0/0/0 | 0% |
| uk-gcse | Higher tier | biology | 0.65 | 0.65 | 0.87 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| uk-gcse | Higher tier | computing | 0.65 | 0.65 | 0.87 | 0.951 | 0.889 | 18/18 | 0/0/0 | 0% |
| int-igcse | Extended | maths | 0.65 | 0.65 | 0.87 | 0.825 | 0.797 | 55/63 | 0/8/0 | 3% |
| int-igcse | Extended | physics | 0.65 | 0.65 | 0.87 | 0.922 | 0.883 | 18/18 | 0/0/0 | 0% |
| int-igcse | Extended | chemistry | 0.65 | 0.65 | 0.87 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| int-igcse | Extended | biology | 0.65 | 0.65 | 0.87 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| int-igcse | Extended | computing | 0.65 | 0.65 | 0.87 | 0.951 | 0.887 | 18/18 | 0/0/0 | 0% |
| us-core | Grades 9–12 | maths | 0.65 | 0.65 | 0.87 | 0.825 | 0.798 | 55/63 | 0/8/0 | 3% |
| us-core | Grades 9–12 | physics | 0.65 | 0.65 | 0.87 | 0.922 | 0.883 | 18/18 | 0/0/0 | 0% |
| us-core | Grades 9–12 | chemistry | 0.65 | 0.65 | 0.87 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| us-core | Grades 9–12 | biology | 0.65 | 0.65 | 0.87 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| us-core | Grades 9–12 | computing | 0.65 | 0.65 | 0.87 | 0.951 | 0.887 | 18/18 | 0/0/0 | 0% |
| ca-provincial | Grades 9–12 | maths | 0.65 | 0.65 | 0.87 | 0.825 | 0.798 | 55/63 | 0/8/0 | 3% |
| ca-provincial | Grades 9–12 | physics | 0.65 | 0.65 | 0.87 | 0.922 | 0.886 | 18/18 | 0/0/0 | 0% |
| ca-provincial | Grades 9–12 | chemistry | 0.65 | 0.65 | 0.87 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| ca-provincial | Grades 9–12 | biology | 0.65 | 0.65 | 0.87 | 0.931 | 0.891 | 16/16 | 0/0/0 | 0% |
| ca-provincial | Grades 9–12 | computing | 0.65 | 0.65 | 0.87 | 0.951 | 0.887 | 18/18 | 0/0/0 | 0% |
| za-nsc | Grades 10–12 | maths | 0.65 | 0.65 | 0.87 | 0.825 | 0.797 | 55/63 | 0/8/0 | 3% |
| za-nsc | Grades 10–12 | physics | 0.65 | 0.65 | 0.87 | 0.922 | 0.882 | 18/18 | 0/0/0 | 0% |
| za-nsc | Grades 10–12 | chemistry | 0.65 | 0.65 | 0.87 | 0.923 | 0.889 | 15/15 | 0/0/0 | 0% |
| za-nsc | Grades 10–12 | biology | 0.65 | 0.65 | 0.87 | 0.931 | 0.891 | 16/16 | 0/0/0 | 0% |
| za-nsc | Grades 10–12 | computing | 0.65 | 0.65 | 0.87 | 0.954 | 0.887 | 14/14 | 0/0/0 | 0% |
| tz-csee | Form 4 (CSEE) | maths | 0.65 | 0.65 | 0.87 | 0.825 | 0.797 | 55/63 | 0/8/0 | 3% |
| tz-csee | Form 4 (CSEE) | physics | 0.65 | 0.65 | 0.87 | 0.922 | 0.885 | 18/18 | 0/0/0 | 0% |
| tz-csee | Form 4 (CSEE) | chemistry | 0.65 | 0.65 | 0.87 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| tz-csee | Form 4 (CSEE) | biology | 0.65 | 0.65 | 0.87 | 0.931 | 0.893 | 16/16 | 0/0/0 | 0% |
| tz-csee | Form 4 (CSEE) | computing | 0.65 | 0.65 | 0.87 | 0.954 | 0.888 | 14/14 | 0/0/0 | 0% |
| ug-uce | S4 (UCE) | maths | 0.65 | 0.65 | 0.87 | 0.825 | 0.798 | 55/63 | 0/8/0 | 3% |
| ug-uce | S4 (UCE) | physics | 0.65 | 0.65 | 0.87 | 0.922 | 0.883 | 18/18 | 0/0/0 | 0% |
| ug-uce | S4 (UCE) | chemistry | 0.65 | 0.65 | 0.87 | 0.923 | 0.888 | 15/15 | 0/0/0 | 0% |
| ug-uce | S4 (UCE) | biology | 0.65 | 0.65 | 0.87 | 0.931 | 0.892 | 16/16 | 0/0/0 | 0% |
| ug-uce | S4 (UCE) | computing | 0.65 | 0.65 | 0.87 | 0.954 | 0.886 | 14/14 | 0/0/0 | 0% |
| us-sat | Digital SAT | maths | 0.6 | 0.6 | 0.82 | 0.807 | 0.771 | 45/53 | 0/8/0 | 4% |
| in-icse | Class 10 | maths | 0.6 | 0.6 | 0.82 | 0.825 | 0.788 | 55/63 | 0/8/0 | 3% |
| in-icse | Class 10 | physics | 0.6 | 0.6 | 0.82 | 0.922 | 0.865 | 18/18 | 0/0/0 | 0% |
| in-icse | Class 10 | chemistry | 0.6 | 0.6 | 0.82 | 0.926 | 0.878 | 16/16 | 0/0/0 | 0% |
| in-icse | Class 10 | biology | 0.6 | 0.6 | 0.82 | 0.931 | 0.885 | 16/16 | 0/0/0 | 0% |
| in-icse | Class 10 | computing | 0.6 | 0.6 | 0.82 | 0.951 | 0.887 | 18/18 | 0/0/0 | 0% |
| in-cbse | Class 10 | maths | 0.55 | 0.55 | 0.77 | 0.811 | 0.679 | 47/55 | 0/8/0 | 4% |
| in-cbse | Class 10 | physics | 0.55 | 0.55 | 0.77 | 0.922 | 0.741 | 18/18 | 0/0/0 | 0% |
| in-cbse | Class 10 | chemistry | 0.55 | 0.55 | 0.77 | 0.923 | 0.718 | 15/15 | 0/0/0 | 0% |
| in-cbse | Class 10 | biology | 0.55 | 0.55 | 0.77 | 0.931 | 0.74 | 16/16 | 0/0/0 | 0% |
| in-cbse | Class 10 | computing | 0.55 | 0.55 | 0.77 | 0.951 | 0.705 | 18/18 | 0/0/0 | 0% |
| pk-matric | Class 9–10 (Matric) | maths | 0.55 | 0.55 | 0.77 | 0.813 | 0.679 | 48/56 | 0/8/0 | 4% |
| pk-matric | Class 9–10 (Matric) | physics | 0.55 | 0.55 | 0.77 | 0.922 | 0.741 | 18/18 | 0/0/0 | 0% |
| pk-matric | Class 9–10 (Matric) | chemistry | 0.55 | 0.55 | 0.77 | 0.923 | 0.722 | 15/15 | 0/0/0 | 0% |
| pk-matric | Class 9–10 (Matric) | biology | 0.55 | 0.55 | 0.77 | 0.931 | 0.728 | 16/16 | 0/0/0 | 0% |
| pk-matric | Class 9–10 (Matric) | computing | 0.55 | 0.55 | 0.77 | 0.951 | 0.714 | 18/18 | 0/0/0 | 0% |
| bd-ssc | Class 9–10 (SSC) | maths | 0.55 | 0.55 | 0.77 | 0.813 | 0.678 | 48/56 | 0/8/0 | 4% |
| bd-ssc | Class 9–10 (SSC) | physics | 0.55 | 0.55 | 0.77 | 0.922 | 0.742 | 18/18 | 0/0/0 | 0% |
| bd-ssc | Class 9–10 (SSC) | chemistry | 0.55 | 0.55 | 0.77 | 0.923 | 0.735 | 15/15 | 0/0/0 | 0% |
| bd-ssc | Class 9–10 (SSC) | biology | 0.55 | 0.55 | 0.77 | 0.931 | 0.74 | 16/16 | 0/0/0 | 0% |
| bd-ssc | Class 9–10 (SSC) | computing | 0.55 | 0.55 | 0.77 | 0.951 | 0.719 | 18/18 | 0/0/0 | 0% |
| ke-kcse | Form 3 | maths | 0.55 | 0.55 | 0.77 | 0.813 | 0.677 | 48/56 | 0/8/0 | 4% |
| ke-kcse | Form 3 | physics | 0.55 | 0.55 | 0.77 | 0.922 | 0.736 | 18/18 | 0/0/0 | 0% |
| ke-kcse | Form 3 | chemistry | 0.55 | 0.55 | 0.77 | 0.923 | 0.738 | 15/15 | 0/0/0 | 0% |
| ke-kcse | Form 3 | biology | 0.55 | 0.55 | 0.77 | 0.931 | 0.736 | 16/16 | 0/0/0 | 0% |
| ke-kcse | Form 3 | computing | 0.55 | 0.55 | 0.77 | 0.951 | 0.71 | 18/18 | 0/0/0 | 0% |
| any-independent | Core | maths | 0.55 | 0.55 | 0.77 | 0.813 | 0.679 | 48/56 | 0/8/0 | 4% |
| any-independent | Core | physics | 0.55 | 0.55 | 0.77 | 0.922 | 0.734 | 18/18 | 0/0/0 | 0% |
| any-independent | Core | chemistry | 0.55 | 0.55 | 0.77 | 0.923 | 0.74 | 15/15 | 0/0/0 | 0% |
| any-independent | Core | biology | 0.55 | 0.55 | 0.77 | 0.931 | 0.731 | 16/16 | 0/0/0 | 0% |
| any-independent | Core | computing | 0.55 | 0.55 | 0.77 | 0.951 | 0.714 | 18/18 | 0/0/0 | 0% |
| au-acara | Years 7–10 | maths | 0.5 | 0.5 | 0.72 | 0.813 | 0.666 | 48/56 | 0/8/0 | 4% |
| au-acara | Years 7–10 | physics | 0.5 | 0.5 | 0.72 | 0.922 | 0.73 | 18/18 | 0/0/0 | 0% |
| au-acara | Years 7–10 | chemistry | 0.5 | 0.5 | 0.72 | 0.923 | 0.716 | 15/15 | 0/0/0 | 0% |
| au-acara | Years 7–10 | biology | 0.5 | 0.5 | 0.72 | 0.931 | 0.732 | 16/16 | 0/0/0 | 0% |
| au-acara | Years 7–10 | computing | 0.5 | 0.5 | 0.72 | 0.951 | 0.697 | 18/18 | 0/0/0 | 0% |
| uk-gcse | Foundation tier | maths | 0.45 | 0.45 | 0.67 | 0.811 | 0.636 | 47/55 | 0/8/0 | 4% |
| uk-gcse | Foundation tier | physics | 0.45 | 0.45 | 0.67 | 0.922 | 0.663 | 18/18 | 0/0/0 | 0% |
| uk-gcse | Foundation tier | chemistry | 0.45 | 0.45 | 0.67 | 0.923 | 0.656 | 15/15 | 0/0/0 | 0% |
| uk-gcse | Foundation tier | biology | 0.45 | 0.45 | 0.67 | 0.931 | 0.667 | 16/16 | 0/0/0 | 0% |
| uk-gcse | Foundation tier | computing | 0.45 | 0.45 | 0.67 | 0.951 | 0.662 | 18/18 | 0/0/0 | 0% |
| int-ib | MYP | maths | 0.45 | 0.45 | 0.67 | 0.776 | 0.623 | 34/42 | 0/8/0 | 5% |
| int-ib | MYP | physics | 0.45 | 0.45 | 0.67 | 0.924 | 0.661 | 14/14 | 0/0/0 | 0% |
| int-ib | MYP | chemistry | 0.45 | 0.45 | 0.67 | 0.911 | 0.665 | 11/11 | 0/0/0 | 0% |
| int-ib | MYP | biology | 0.45 | 0.45 | 0.67 | 0.924 | 0.656 | 13/13 | 0/0/0 | 0% |
| int-ib | MYP | computing | 0.45 | 0.45 | 0.67 | 0.954 | 0.671 | 14/14 | 0/0/0 | 0% |
| ie-junior | Junior Cycle | maths | 0.45 | 0.45 | 0.67 | 0.776 | 0.624 | 34/42 | 0/8/0 | 5% |
| ie-junior | Junior Cycle | physics | 0.45 | 0.45 | 0.67 | 0.924 | 0.667 | 14/14 | 0/0/0 | 0% |
| ie-junior | Junior Cycle | chemistry | 0.45 | 0.45 | 0.67 | 0.911 | 0.672 | 11/11 | 0/0/0 | 0% |
| ie-junior | Junior Cycle | biology | 0.45 | 0.45 | 0.67 | 0.924 | 0.664 | 13/13 | 0/0/0 | 0% |
| ie-junior | Junior Cycle | computing | 0.45 | 0.45 | 0.67 | 0.954 | 0.664 | 14/14 | 0/0/0 | 0% |
| in-icse | Class 8–9 | maths | 0.42 | 0.42 | 0.64 | 0.776 | 0.612 | 34/42 | 0/8/0 | 5% |
| in-icse | Class 8–9 | physics | 0.42 | 0.42 | 0.64 | 0.924 | 0.645 | 14/14 | 0/0/0 | 0% |
| in-icse | Class 8–9 | chemistry | 0.42 | 0.42 | 0.64 | 0.911 | 0.638 | 11/11 | 0/0/0 | 0% |
| in-icse | Class 8–9 | biology | 0.42 | 0.42 | 0.64 | 0.924 | 0.65 | 13/13 | 0/0/0 | 0% |
| in-icse | Class 8–9 | computing | 0.42 | 0.42 | 0.64 | 0.954 | 0.643 | 14/14 | 0/0/0 | 0% |
| ng-waec | JSS 1–3 (BECE) | maths | 0.42 | 0.42 | 0.64 | 0.776 | 0.611 | 34/42 | 0/8/0 | 5% |
| ng-waec | JSS 1–3 (BECE) | physics | 0.42 | 0.42 | 0.64 | 0.924 | 0.632 | 14/14 | 0/0/0 | 0% |
| ng-waec | JSS 1–3 (BECE) | chemistry | 0.42 | 0.42 | 0.64 | 0.911 | 0.641 | 11/11 | 0/0/0 | 0% |
| ng-waec | JSS 1–3 (BECE) | biology | 0.42 | 0.42 | 0.64 | 0.924 | 0.644 | 13/13 | 0/0/0 | 0% |
| ng-waec | JSS 1–3 (BECE) | computing | 0.42 | 0.42 | 0.64 | 0.954 | 0.645 | 14/14 | 0/0/0 | 0% |
| gh-wassce | JHS 1–3 (BECE) | maths | 0.42 | 0.42 | 0.64 | 0.776 | 0.613 | 34/42 | 0/8/0 | 5% |
| gh-wassce | JHS 1–3 (BECE) | physics | 0.42 | 0.42 | 0.64 | 0.924 | 0.632 | 14/14 | 0/0/0 | 0% |
| gh-wassce | JHS 1–3 (BECE) | chemistry | 0.42 | 0.42 | 0.64 | 0.911 | 0.646 | 11/11 | 0/0/0 | 0% |
| gh-wassce | JHS 1–3 (BECE) | biology | 0.42 | 0.42 | 0.64 | 0.924 | 0.653 | 13/13 | 0/0/0 | 0% |
| gh-wassce | JHS 1–3 (BECE) | computing | 0.42 | 0.42 | 0.64 | 0.954 | 0.635 | 14/14 | 0/0/0 | 0% |
| ph-deped | Junior High | maths | 0.42 | 0.42 | 0.64 | 0.776 | 0.611 | 34/42 | 0/8/0 | 5% |
| ph-deped | Junior High | physics | 0.42 | 0.42 | 0.64 | 0.924 | 0.623 | 14/14 | 0/0/0 | 0% |
| ph-deped | Junior High | chemistry | 0.42 | 0.42 | 0.64 | 0.911 | 0.657 | 11/11 | 0/0/0 | 0% |
| ph-deped | Junior High | biology | 0.42 | 0.42 | 0.64 | 0.924 | 0.652 | 13/13 | 0/0/0 | 0% |
| ph-deped | Junior High | computing | 0.42 | 0.42 | 0.64 | 0.954 | 0.645 | 14/14 | 0/0/0 | 0% |
| id-merdeka | SMP 7–9 | maths | 0.42 | 0.42 | 0.64 | 0.776 | 0.61 | 34/42 | 0/8/0 | 5% |
| id-merdeka | SMP 7–9 | physics | 0.42 | 0.42 | 0.64 | 0.924 | 0.643 | 14/14 | 0/0/0 | 0% |
| id-merdeka | SMP 7–9 | chemistry | 0.42 | 0.42 | 0.64 | 0.911 | 0.632 | 11/11 | 0/0/0 | 0% |
| id-merdeka | SMP 7–9 | biology | 0.42 | 0.42 | 0.64 | 0.924 | 0.655 | 13/13 | 0/0/0 | 0% |
| id-merdeka | SMP 7–9 | computing | 0.42 | 0.42 | 0.64 | 0.954 | 0.64 | 14/14 | 0/0/0 | 0% |
| br-enem | Fundamental II | maths | 0.42 | 0.42 | 0.64 | 0.776 | 0.613 | 34/42 | 0/8/0 | 5% |
| br-enem | Fundamental II | physics | 0.42 | 0.42 | 0.64 | 0.924 | 0.64 | 14/14 | 0/0/0 | 0% |
| br-enem | Fundamental II | chemistry | 0.42 | 0.42 | 0.64 | 0.911 | 0.645 | 11/11 | 0/0/0 | 0% |
| br-enem | Fundamental II | biology | 0.42 | 0.42 | 0.64 | 0.924 | 0.636 | 13/13 | 0/0/0 | 0% |
| br-enem | Fundamental II | computing | 0.42 | 0.42 | 0.64 | 0.954 | 0.65 | 14/14 | 0/0/0 | 0% |
| mx-sep | Secundaria | maths | 0.42 | 0.42 | 0.64 | 0.776 | 0.613 | 34/42 | 0/8/0 | 5% |
| mx-sep | Secundaria | physics | 0.42 | 0.42 | 0.64 | 0.924 | 0.642 | 14/14 | 0/0/0 | 0% |
| mx-sep | Secundaria | chemistry | 0.42 | 0.42 | 0.64 | 0.911 | 0.654 | 11/11 | 0/0/0 | 0% |
| mx-sep | Secundaria | biology | 0.42 | 0.42 | 0.64 | 0.924 | 0.649 | 13/13 | 0/0/0 | 0% |
| mx-sep | Secundaria | computing | 0.42 | 0.42 | 0.64 | 0.954 | 0.648 | 14/14 | 0/0/0 | 0% |
| int-igcse | Core | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.605 | 34/42 | 0/8/0 | 5% |
| int-igcse | Core | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.637 | 14/14 | 0/0/0 | 0% |
| int-igcse | Core | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.638 | 11/11 | 0/0/0 | 0% |
| int-igcse | Core | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.639 | 13/13 | 0/0/0 | 0% |
| int-igcse | Core | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.642 | 14/14 | 0/0/0 | 0% |
| us-core | Grades 6–8 | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.604 | 34/42 | 0/8/0 | 5% |
| us-core | Grades 6–8 | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.625 | 14/14 | 0/0/0 | 0% |
| us-core | Grades 6–8 | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.65 | 11/11 | 0/0/0 | 0% |
| us-core | Grades 6–8 | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.656 | 13/13 | 0/0/0 | 0% |
| us-core | Grades 6–8 | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.645 | 14/14 | 0/0/0 | 0% |
| ca-provincial | Grades 7–8 | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.608 | 34/42 | 0/8/0 | 5% |
| ca-provincial | Grades 7–8 | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.64 | 14/14 | 0/0/0 | 0% |
| ca-provincial | Grades 7–8 | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.65 | 11/11 | 0/0/0 | 0% |
| ca-provincial | Grades 7–8 | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.642 | 13/13 | 0/0/0 | 0% |
| ca-provincial | Grades 7–8 | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.649 | 14/14 | 0/0/0 | 0% |
| za-nsc | Grades 8–9 | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.602 | 34/42 | 0/8/0 | 5% |
| za-nsc | Grades 8–9 | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.638 | 14/14 | 0/0/0 | 0% |
| za-nsc | Grades 8–9 | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.642 | 11/11 | 0/0/0 | 0% |
| za-nsc | Grades 8–9 | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.645 | 13/13 | 0/0/0 | 0% |
| za-nsc | Grades 8–9 | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.644 | 14/14 | 0/0/0 | 0% |
| in-cbse | Class 8–9 | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.606 | 34/42 | 0/8/0 | 5% |
| in-cbse | Class 8–9 | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.626 | 14/14 | 0/0/0 | 0% |
| in-cbse | Class 8–9 | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.644 | 11/11 | 0/0/0 | 0% |
| in-cbse | Class 8–9 | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.645 | 13/13 | 0/0/0 | 0% |
| in-cbse | Class 8–9 | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.636 | 14/14 | 0/0/0 | 0% |
| bd-ssc | Class 6–8 (JSC) | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.604 | 34/42 | 0/8/0 | 5% |
| bd-ssc | Class 6–8 (JSC) | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.634 | 14/14 | 0/0/0 | 0% |
| bd-ssc | Class 6–8 (JSC) | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.648 | 11/11 | 0/0/0 | 0% |
| bd-ssc | Class 6–8 (JSC) | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.646 | 13/13 | 0/0/0 | 0% |
| bd-ssc | Class 6–8 (JSC) | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.641 | 14/14 | 0/0/0 | 0% |
| ke-kcse | Grade 7–9 | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.61 | 34/42 | 0/8/0 | 5% |
| ke-kcse | Grade 7–9 | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.643 | 14/14 | 0/0/0 | 0% |
| ke-kcse | Grade 7–9 | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.645 | 11/11 | 0/0/0 | 0% |
| ke-kcse | Grade 7–9 | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.648 | 13/13 | 0/0/0 | 0% |
| ke-kcse | Grade 7–9 | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.639 | 14/14 | 0/0/0 | 0% |
| tz-csee | Form 1–2 | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.607 | 34/42 | 0/8/0 | 5% |
| tz-csee | Form 1–2 | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.636 | 14/14 | 0/0/0 | 0% |
| tz-csee | Form 1–2 | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.649 | 11/11 | 0/0/0 | 0% |
| tz-csee | Form 1–2 | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.646 | 13/13 | 0/0/0 | 0% |
| tz-csee | Form 1–2 | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.64 | 14/14 | 0/0/0 | 0% |
| ug-uce | S1–S2 | maths | 0.4 | 0.4 | 0.62 | 0.776 | 0.603 | 34/42 | 0/8/0 | 5% |
| ug-uce | S1–S2 | physics | 0.4 | 0.4 | 0.62 | 0.924 | 0.639 | 14/14 | 0/0/0 | 0% |
| ug-uce | S1–S2 | chemistry | 0.4 | 0.4 | 0.62 | 0.911 | 0.647 | 11/11 | 0/0/0 | 0% |
| ug-uce | S1–S2 | biology | 0.4 | 0.4 | 0.62 | 0.924 | 0.642 | 13/13 | 0/0/0 | 0% |
| ug-uce | S1–S2 | computing | 0.4 | 0.4 | 0.62 | 0.954 | 0.643 | 14/14 | 0/0/0 | 0% |
| pk-matric | Class 6–8 | maths | 0.35 | 0.35 | 0.57 | 0.671 | 0.49 | 18/24 | 0/6/0 | 8% |
| pk-matric | Class 6–8 | physics | 0.35 | 0.35 | 0.57 | 0.846 | 0.494 | 4/4 | 0/0/0 | 0% |
| pk-matric | Class 6–8 | chemistry | 0.35 | 0.35 | 0.57 | 0.855 | 0.545 | 4/4 | 0/0/0 | 0% |
| pk-matric | Class 6–8 | biology | 0.35 | 0.35 | 0.57 | 0.906 | 0.524 | 8/8 | 0/0/0 | 0% |
| pk-matric | Class 6–8 | computing | 0.35 | 0.35 | 0.57 | 0.952 | 0.517 | 8/8 | 0/0/0 | 0% |
| any-independent | Foundations | maths | 0.35 | 0.35 | 0.57 | 0.671 | 0.492 | 18/24 | 0/6/0 | 8% |
| any-independent | Foundations | physics | 0.35 | 0.35 | 0.57 | 0.846 | 0.477 | 4/4 | 0/0/0 | 0% |
| any-independent | Foundations | chemistry | 0.35 | 0.35 | 0.57 | 0.855 | 0.545 | 4/4 | 0/0/0 | 0% |
| any-independent | Foundations | biology | 0.35 | 0.35 | 0.57 | 0.906 | 0.527 | 8/8 | 0/0/0 | 0% |
| any-independent | Foundations | computing | 0.35 | 0.35 | 0.57 | 0.952 | 0.508 | 8/8 | 0/0/0 | 0% |

**0** shortfalls are search, **412** are generator ceilings, **0** are
missing content.

## 2. The ladder's own tier cap

`practiceTarget` clamps `tier` to **0.7** before the stretch uplift, so no course can aim above
0.9 through practice however demanding its qualification is. **45** course×subject
rows declare more than the ladder will ask for:

| course | declared | ladder tier | shortfall by construction |
|---|---|---|---|
| uk-alevel · A2 (maths) | 0.9 | 0.7 | -0.2 |
| uk-alevel · A2 (physics) | 0.9 | 0.7 | -0.2 |
| uk-alevel · A2 (chemistry) | 0.9 | 0.7 | -0.2 |
| uk-alevel · A2 (biology) | 0.9 | 0.7 | -0.2 |
| uk-alevel · A2 (computing) | 0.9 | 0.7 | -0.2 |
| int-ib · Diploma HL (maths) | 0.9 | 0.7 | -0.2 |
| int-ib · Diploma HL (physics) | 0.9 | 0.7 | -0.2 |
| int-ib · Diploma HL (chemistry) | 0.9 | 0.7 | -0.2 |
| int-ib · Diploma HL (biology) | 0.9 | 0.7 | -0.2 |
| int-ib · Diploma HL (computing) | 0.9 | 0.7 | -0.2 |
| us-ap · AP (maths) | 0.85 | 0.7 | -0.15 |
| us-ap · AP (physics) | 0.85 | 0.7 | -0.15 |
| us-ap · AP (chemistry) | 0.85 | 0.7 | -0.15 |
| us-ap · AP (biology) | 0.85 | 0.7 | -0.15 |
| us-ap · AP (computing) | 0.85 | 0.7 | -0.15 |
| in-cbse · Class 11–12 (maths) | 0.85 | 0.7 | -0.15 |
| in-cbse · Class 11–12 (physics) | 0.85 | 0.7 | -0.15 |
| in-cbse · Class 11–12 (chemistry) | 0.85 | 0.7 | -0.15 |
| in-cbse · Class 11–12 (biology) | 0.85 | 0.7 | -0.15 |
| in-cbse · Class 11–12 (computing) | 0.85 | 0.7 | -0.15 |
| in-icse · ISC 11–12 (maths) | 0.85 | 0.7 | -0.15 |
| in-icse · ISC 11–12 (physics) | 0.85 | 0.7 | -0.15 |
| in-icse · ISC 11–12 (chemistry) | 0.85 | 0.7 | -0.15 |
| in-icse · ISC 11–12 (biology) | 0.85 | 0.7 | -0.15 |
| in-icse · ISC 11–12 (computing) | 0.85 | 0.7 | -0.15 |
| any-independent · Advanced (maths) | 0.8 | 0.7 | -0.1 |
| any-independent · Advanced (physics) | 0.8 | 0.7 | -0.1 |
| any-independent · Advanced (chemistry) | 0.8 | 0.7 | -0.1 |
| any-independent · Advanced (biology) | 0.8 | 0.7 | -0.1 |
| any-independent · Advanced (computing) | 0.8 | 0.7 | -0.1 |
| bd-ssc · Class 11–12 (HSC) (maths) | 0.78 | 0.7 | -0.08 |
| bd-ssc · Class 11–12 (HSC) (physics) | 0.78 | 0.7 | -0.08 |
| bd-ssc · Class 11–12 (HSC) (chemistry) | 0.78 | 0.7 | -0.08 |
| bd-ssc · Class 11–12 (HSC) (biology) | 0.78 | 0.7 | -0.08 |
| bd-ssc · Class 11–12 (HSC) (computing) | 0.78 | 0.7 | -0.08 |
| uk-alevel · AS (maths) | 0.75 | 0.7 | -0.05 |
| uk-alevel · AS (physics) | 0.75 | 0.7 | -0.05 |
| uk-alevel · AS (chemistry) | 0.75 | 0.7 | -0.05 |
| uk-alevel · AS (biology) | 0.75 | 0.7 | -0.05 |
| uk-alevel · AS (computing) | 0.75 | 0.7 | -0.05 |
| pk-matric · Class 11–12 (Inter) (maths) | 0.75 | 0.7 | -0.05 |
| pk-matric · Class 11–12 (Inter) (physics) | 0.75 | 0.7 | -0.05 |
| pk-matric · Class 11–12 (Inter) (chemistry) | 0.75 | 0.7 | -0.05 |
| pk-matric · Class 11–12 (Inter) (biology) | 0.75 | 0.7 | -0.05 |
| pk-matric · Class 11–12 (Inter) (computing) | 0.75 | 0.7 | -0.05 |

This is neither A nor B nor C: it is the serving policy, and raising the cap changes nothing
until the content behind it exists, because the serve already falls back to the nearest
available draw.

## 3. Coverage by course

Per course: what a learner can be asked, which demand rungs are reachable, and what is missing.

| course · subject | concepts | servable | demand reached | response types | missing content |
|---|---|---|---|---|---|
| uk-gcse · Foundation tier · maths | 55 | 55 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| uk-gcse · Foundation tier · physics | 18 | 18 | application, multi_step, data_interpretation | choice, numeric | none |
| uk-gcse · Foundation tier · chemistry | 15 | 15 | application, multi_step, data_interpretation | choice, numeric | none |
| uk-gcse · Foundation tier · biology | 16 | 16 | application, multi_step, data_interpretation | choice, numeric | none |
| uk-gcse · Foundation tier · computing | 18 | 18 | multi_step | choice, numeric | none |
| uk-gcse · Higher tier · maths | 63 | 63 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| uk-gcse · Higher tier · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| uk-gcse · Higher tier · chemistry | 15 | 15 | data_interpretation | choice | none |
| uk-gcse · Higher tier · biology | 16 | 16 | data_interpretation | choice | none |
| uk-gcse · Higher tier · computing | 18 | 18 | data_interpretation | choice | none |
| uk-alevel · AS · maths | 39 | 39 | data_interpretation | choice | none |
| uk-alevel · AS · physics | 14 | 14 | multi_step, data_interpretation | choice | none |
| uk-alevel · AS · chemistry | 12 | 12 | data_interpretation | choice | none |
| uk-alevel · AS · biology | 8 | 8 | data_interpretation | choice | none |
| uk-alevel · AS · computing | 10 | 10 | data_interpretation | choice | none |
| uk-alevel · A2 · maths | 43 | 43 | data_interpretation | choice | none |
| uk-alevel · A2 · physics | 14 | 14 | multi_step, data_interpretation | choice | none |
| uk-alevel · A2 · chemistry | 12 | 12 | data_interpretation | choice | none |
| uk-alevel · A2 · biology | 8 | 8 | data_interpretation | choice | none |
| uk-alevel · A2 · computing | 10 | 10 | data_interpretation | choice | none |
| int-igcse · Core · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| int-igcse · Core · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| int-igcse · Core · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| int-igcse · Core · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| int-igcse · Core · computing | 14 | 14 | multi_step | choice, numeric | none |
| int-igcse · Extended · maths | 63 | 63 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| int-igcse · Extended · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| int-igcse · Extended · chemistry | 15 | 15 | data_interpretation | choice | none |
| int-igcse · Extended · biology | 16 | 16 | data_interpretation | choice | none |
| int-igcse · Extended · computing | 18 | 18 | data_interpretation | choice | none |
| int-ib · MYP · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| int-ib · MYP · physics | 14 | 14 | multi_step, data_interpretation | choice, numeric | none |
| int-ib · MYP · chemistry | 11 | 11 | application, multi_step, data_interpretation | choice, numeric | none |
| int-ib · MYP · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| int-ib · MYP · computing | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| int-ib · Diploma SL · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| int-ib · Diploma SL · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| int-ib · Diploma SL · chemistry | 16 | 16 | data_interpretation | choice | none |
| int-ib · Diploma SL · biology | 16 | 16 | data_interpretation | choice | none |
| int-ib · Diploma SL · computing | 18 | 18 | data_interpretation | choice | none |
| int-ib · Diploma HL · maths | 63 | 63 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| int-ib · Diploma HL · physics | 18 | 18 | data_interpretation | choice | none |
| int-ib · Diploma HL · chemistry | 16 | 16 | data_interpretation | choice | none |
| int-ib · Diploma HL · biology | 16 | 16 | data_interpretation | choice | none |
| int-ib · Diploma HL · computing | 18 | 18 | data_interpretation | choice | none |
| us-core · Grades 6–8 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| us-core · Grades 6–8 · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| us-core · Grades 6–8 · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| us-core · Grades 6–8 · biology | 13 | 13 | multi_step, data_interpretation | choice, numeric | none |
| us-core · Grades 6–8 · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| us-core · Grades 9–12 · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| us-core · Grades 9–12 · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| us-core · Grades 9–12 · chemistry | 15 | 15 | data_interpretation | choice | none |
| us-core · Grades 9–12 · biology | 16 | 16 | data_interpretation | choice | none |
| us-core · Grades 9–12 · computing | 18 | 18 | data_interpretation | choice | none |
| us-sat · Digital SAT · maths | 53 | 53 | recall, application, data_interpretation | numeric, choice | none |
| us-ap · AP · maths | 43 | 43 | data_interpretation | choice | none |
| us-ap · AP · physics | 14 | 14 | multi_step, data_interpretation | choice | none |
| us-ap · AP · chemistry | 12 | 12 | data_interpretation | choice | none |
| us-ap · AP · biology | 8 | 8 | data_interpretation | choice | none |
| us-ap · AP · computing | 10 | 10 | data_interpretation | choice | none |
| ca-provincial · Grades 7–8 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| ca-provincial · Grades 7–8 · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| ca-provincial · Grades 7–8 · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| ca-provincial · Grades 7–8 · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| ca-provincial · Grades 7–8 · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| ca-provincial · Grades 9–12 · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| ca-provincial · Grades 9–12 · physics | 18 | 18 | data_interpretation | choice | none |
| ca-provincial · Grades 9–12 · chemistry | 15 | 15 | data_interpretation | choice | none |
| ca-provincial · Grades 9–12 · biology | 16 | 16 | data_interpretation | choice | none |
| ca-provincial · Grades 9–12 · computing | 18 | 18 | data_interpretation | choice | none |
| za-nsc · Grades 8–9 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| za-nsc · Grades 8–9 · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| za-nsc · Grades 8–9 · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| za-nsc · Grades 8–9 · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| za-nsc · Grades 8–9 · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| za-nsc · Grades 10–12 · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| za-nsc · Grades 10–12 · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| za-nsc · Grades 10–12 · chemistry | 15 | 15 | data_interpretation | choice | none |
| za-nsc · Grades 10–12 · biology | 16 | 16 | multi_step, data_interpretation | choice | none |
| za-nsc · Grades 10–12 · computing | 14 | 14 | data_interpretation | choice | none |
| au-acara · Years 7–10 · maths | 56 | 56 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| au-acara · Years 7–10 · physics | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| au-acara · Years 7–10 · chemistry | 15 | 15 | multi_step, data_interpretation | choice, numeric | none |
| au-acara · Years 7–10 · biology | 16 | 16 | multi_step, data_interpretation | choice | none |
| au-acara · Years 7–10 · computing | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| au-acara · Senior secondary · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| au-acara · Senior secondary · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| au-acara · Senior secondary · chemistry | 15 | 15 | data_interpretation | choice | none |
| au-acara · Senior secondary · biology | 16 | 16 | data_interpretation | choice | none |
| au-acara · Senior secondary · computing | 18 | 18 | data_interpretation | choice | none |
| ie-junior · Junior Cycle · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| ie-junior · Junior Cycle · physics | 14 | 14 | multi_step, data_interpretation | choice, numeric | none |
| ie-junior · Junior Cycle · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| ie-junior · Junior Cycle · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| ie-junior · Junior Cycle · computing | 14 | 14 | multi_step | choice, numeric | none |
| ie-junior · Senior Cycle · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| ie-junior · Senior Cycle · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| ie-junior · Senior Cycle · chemistry | 15 | 15 | data_interpretation | choice | none |
| ie-junior · Senior Cycle · biology | 16 | 16 | data_interpretation | choice | none |
| ie-junior · Senior Cycle · computing | 18 | 18 | data_interpretation | choice | none |
| in-cbse · Class 8–9 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| in-cbse · Class 8–9 · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| in-cbse · Class 8–9 · chemistry | 11 | 11 | application, multi_step, data_interpretation | choice, numeric | none |
| in-cbse · Class 8–9 · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| in-cbse · Class 8–9 · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| in-cbse · Class 10 · maths | 55 | 55 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| in-cbse · Class 10 · physics | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| in-cbse · Class 10 · chemistry | 15 | 15 | multi_step, data_interpretation | choice, numeric | none |
| in-cbse · Class 10 · biology | 16 | 16 | multi_step, data_interpretation | choice | none |
| in-cbse · Class 10 · computing | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| in-cbse · Class 11–12 · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| in-cbse · Class 11–12 · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| in-cbse · Class 11–12 · chemistry | 16 | 16 | data_interpretation | choice | none |
| in-cbse · Class 11–12 · biology | 16 | 16 | data_interpretation | choice | none |
| in-cbse · Class 11–12 · computing | 18 | 18 | data_interpretation | choice | none |
| in-icse · Class 8–9 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| in-icse · Class 8–9 · physics | 14 | 14 | multi_step, data_interpretation | choice, numeric | none |
| in-icse · Class 8–9 · chemistry | 11 | 11 | application, multi_step, data_interpretation | choice, numeric | none |
| in-icse · Class 8–9 · biology | 13 | 13 | multi_step, data_interpretation | choice, numeric | none |
| in-icse · Class 8–9 · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| in-icse · Class 10 · maths | 63 | 63 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| in-icse · Class 10 · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| in-icse · Class 10 · chemistry | 16 | 16 | data_interpretation | choice | none |
| in-icse · Class 10 · biology | 16 | 16 | data_interpretation | choice | none |
| in-icse · Class 10 · computing | 18 | 18 | data_interpretation | choice | none |
| in-icse · ISC 11–12 · maths | 63 | 63 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| in-icse · ISC 11–12 · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| in-icse · ISC 11–12 · chemistry | 16 | 16 | data_interpretation | choice | none |
| in-icse · ISC 11–12 · biology | 16 | 16 | data_interpretation | choice | none |
| in-icse · ISC 11–12 · computing | 18 | 18 | data_interpretation | choice | none |
| pk-matric · Class 6–8 · maths | 24 | 24 | recall, application, multi_step | numeric, choice | none |
| pk-matric · Class 6–8 · physics | 4 | 4 | application, multi_step | numeric, choice | none |
| pk-matric · Class 6–8 · chemistry | 4 | 4 | application, multi_step | choice, numeric | none |
| pk-matric · Class 6–8 · biology | 8 | 8 | application, multi_step | choice, numeric | none |
| pk-matric · Class 6–8 · computing | 8 | 8 | application, multi_step | choice, numeric | none |
| pk-matric · Class 9–10 (Matric) · maths | 56 | 56 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| pk-matric · Class 9–10 (Matric) · physics | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| pk-matric · Class 9–10 (Matric) · chemistry | 15 | 15 | multi_step, data_interpretation | choice, numeric | none |
| pk-matric · Class 9–10 (Matric) · biology | 16 | 16 | multi_step, data_interpretation | choice, numeric | none |
| pk-matric · Class 9–10 (Matric) · computing | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| pk-matric · Class 11–12 (Inter) · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| pk-matric · Class 11–12 (Inter) · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| pk-matric · Class 11–12 (Inter) · chemistry | 15 | 15 | data_interpretation | choice | none |
| pk-matric · Class 11–12 (Inter) · biology | 16 | 16 | data_interpretation | choice | none |
| pk-matric · Class 11–12 (Inter) · computing | 18 | 18 | data_interpretation | choice | none |
| bd-ssc · Class 6–8 (JSC) · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| bd-ssc · Class 6–8 (JSC) · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| bd-ssc · Class 6–8 (JSC) · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| bd-ssc · Class 6–8 (JSC) · biology | 13 | 13 | multi_step, data_interpretation | choice, numeric | none |
| bd-ssc · Class 6–8 (JSC) · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| bd-ssc · Class 9–10 (SSC) · maths | 56 | 56 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| bd-ssc · Class 9–10 (SSC) · physics | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| bd-ssc · Class 9–10 (SSC) · chemistry | 15 | 15 | multi_step, data_interpretation | choice, numeric | none |
| bd-ssc · Class 9–10 (SSC) · biology | 16 | 16 | multi_step, data_interpretation | choice, numeric | none |
| bd-ssc · Class 9–10 (SSC) · computing | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| bd-ssc · Class 11–12 (HSC) · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| bd-ssc · Class 11–12 (HSC) · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| bd-ssc · Class 11–12 (HSC) · chemistry | 15 | 15 | data_interpretation | choice | none |
| bd-ssc · Class 11–12 (HSC) · biology | 16 | 16 | data_interpretation | choice | none |
| bd-ssc · Class 11–12 (HSC) · computing | 18 | 18 | data_interpretation | choice | none |
| ke-kcse · Grade 7–9 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| ke-kcse · Grade 7–9 · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| ke-kcse · Grade 7–9 · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| ke-kcse · Grade 7–9 · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| ke-kcse · Grade 7–9 · computing | 14 | 14 | multi_step | choice, numeric | none |
| ke-kcse · Form 3 · maths | 56 | 56 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| ke-kcse · Form 3 · physics | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| ke-kcse · Form 3 · chemistry | 15 | 15 | multi_step, data_interpretation | choice, numeric | none |
| ke-kcse · Form 3 · biology | 16 | 16 | multi_step, data_interpretation | choice, numeric | none |
| ke-kcse · Form 3 · computing | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| ke-kcse · Form 4 (KCSE) · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| ke-kcse · Form 4 (KCSE) · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| ke-kcse · Form 4 (KCSE) · chemistry | 15 | 15 | data_interpretation | choice | none |
| ke-kcse · Form 4 (KCSE) · biology | 16 | 16 | data_interpretation | choice | none |
| ke-kcse · Form 4 (KCSE) · computing | 18 | 18 | data_interpretation | choice | none |
| tz-csee · Form 1–2 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| tz-csee · Form 1–2 · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| tz-csee · Form 1–2 · chemistry | 11 | 11 | application, multi_step, data_interpretation | choice, numeric | none |
| tz-csee · Form 1–2 · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| tz-csee · Form 1–2 · computing | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| tz-csee · Form 4 (CSEE) · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| tz-csee · Form 4 (CSEE) · physics | 18 | 18 | data_interpretation | choice | none |
| tz-csee · Form 4 (CSEE) · chemistry | 15 | 15 | data_interpretation | choice | none |
| tz-csee · Form 4 (CSEE) · biology | 16 | 16 | data_interpretation | choice | none |
| tz-csee · Form 4 (CSEE) · computing | 14 | 14 | data_interpretation | choice | none |
| ug-uce · S1–S2 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| ug-uce · S1–S2 · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| ug-uce · S1–S2 · chemistry | 11 | 11 | application, multi_step, data_interpretation | choice, numeric | none |
| ug-uce · S1–S2 · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| ug-uce · S1–S2 · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| ug-uce · S4 (UCE) · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| ug-uce · S4 (UCE) · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| ug-uce · S4 (UCE) · chemistry | 15 | 15 | data_interpretation | choice | none |
| ug-uce · S4 (UCE) · biology | 16 | 16 | data_interpretation | choice | none |
| ug-uce · S4 (UCE) · computing | 14 | 14 | data_interpretation | choice | none |
| ng-waec · JSS 1–3 (BECE) · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| ng-waec · JSS 1–3 (BECE) · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| ng-waec · JSS 1–3 (BECE) · chemistry | 11 | 11 | application, multi_step, data_interpretation | choice, numeric | none |
| ng-waec · JSS 1–3 (BECE) · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| ng-waec · JSS 1–3 (BECE) · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| ng-waec · SSS 1–3 (WAEC) · maths | 63 | 63 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| ng-waec · SSS 1–3 (WAEC) · physics | 18 | 18 | data_interpretation | choice | none |
| ng-waec · SSS 1–3 (WAEC) · chemistry | 15 | 15 | data_interpretation | choice | none |
| ng-waec · SSS 1–3 (WAEC) · biology | 16 | 16 | data_interpretation | choice | none |
| ng-waec · SSS 1–3 (WAEC) · computing | 18 | 18 | data_interpretation | choice | none |
| gh-wassce · JHS 1–3 (BECE) · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| gh-wassce · JHS 1–3 (BECE) · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| gh-wassce · JHS 1–3 (BECE) · chemistry | 11 | 11 | application, multi_step, data_interpretation | choice, numeric | none |
| gh-wassce · JHS 1–3 (BECE) · biology | 13 | 13 | multi_step, data_interpretation | choice, numeric | none |
| gh-wassce · JHS 1–3 (BECE) · computing | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| gh-wassce · SHS 1–3 (WASSCE) · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| gh-wassce · SHS 1–3 (WASSCE) · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| gh-wassce · SHS 1–3 (WASSCE) · chemistry | 15 | 15 | data_interpretation | choice | none |
| gh-wassce · SHS 1–3 (WASSCE) · biology | 16 | 16 | data_interpretation | choice | none |
| gh-wassce · SHS 1–3 (WASSCE) · computing | 18 | 18 | data_interpretation | choice | none |
| ph-deped · Junior High · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| ph-deped · Junior High · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| ph-deped · Junior High · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| ph-deped · Junior High · biology | 13 | 13 | multi_step, data_interpretation | choice, numeric | none |
| ph-deped · Junior High · computing | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| ph-deped · Senior High · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| ph-deped · Senior High · physics | 18 | 18 | application, multi_step, data_interpretation | choice, numeric | none |
| ph-deped · Senior High · chemistry | 15 | 15 | data_interpretation | choice | none |
| ph-deped · Senior High · biology | 16 | 16 | data_interpretation | choice | none |
| ph-deped · Senior High · computing | 18 | 18 | data_interpretation | choice | none |
| id-merdeka · SMP 7–9 · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| id-merdeka · SMP 7–9 · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| id-merdeka · SMP 7–9 · chemistry | 11 | 11 | application, multi_step, data_interpretation | choice, numeric | none |
| id-merdeka · SMP 7–9 · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| id-merdeka · SMP 7–9 · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| id-merdeka · SMA 10–12 · maths | 63 | 63 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| id-merdeka · SMA 10–12 · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| id-merdeka · SMA 10–12 · chemistry | 15 | 15 | data_interpretation | choice | none |
| id-merdeka · SMA 10–12 · biology | 16 | 16 | data_interpretation | choice | none |
| id-merdeka · SMA 10–12 · computing | 18 | 18 | data_interpretation | choice | none |
| br-enem · Fundamental II · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| br-enem · Fundamental II · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| br-enem · Fundamental II · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| br-enem · Fundamental II · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| br-enem · Fundamental II · computing | 14 | 14 | application, multi_step | choice, numeric | none |
| br-enem · Médio (ENEM) · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| br-enem · Médio (ENEM) · physics | 18 | 18 | multi_step, data_interpretation | choice | none |
| br-enem · Médio (ENEM) · chemistry | 15 | 15 | data_interpretation | choice | none |
| br-enem · Médio (ENEM) · biology | 16 | 16 | data_interpretation | choice | none |
| br-enem · Médio (ENEM) · computing | 18 | 18 | data_interpretation | choice | none |
| mx-sep · Secundaria · maths | 42 | 42 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| mx-sep · Secundaria · physics | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| mx-sep · Secundaria · chemistry | 11 | 11 | multi_step, data_interpretation | choice, numeric | none |
| mx-sep · Secundaria · biology | 13 | 13 | application, multi_step, data_interpretation | choice, numeric | none |
| mx-sep · Secundaria · computing | 14 | 14 | application, multi_step, data_interpretation | choice, numeric | none |
| mx-sep · Preparatoria · maths | 63 | 63 | recall, application, data_interpretation | numeric, choice | none |
| mx-sep · Preparatoria · physics | 18 | 18 | data_interpretation | choice | none |
| mx-sep · Preparatoria · chemistry | 15 | 15 | data_interpretation | choice | none |
| mx-sep · Preparatoria · biology | 16 | 16 | data_interpretation | choice | none |
| mx-sep · Preparatoria · computing | 18 | 18 | data_interpretation | choice | none |
| any-independent · Foundations · maths | 24 | 24 | recall, application, multi_step | numeric, choice | none |
| any-independent · Foundations · physics | 4 | 4 | application | choice, numeric | none |
| any-independent · Foundations · chemistry | 4 | 4 | application, multi_step | choice, numeric | none |
| any-independent · Foundations · biology | 8 | 8 | application, multi_step | choice, numeric | none |
| any-independent · Foundations · computing | 8 | 8 | application, multi_step | choice, numeric | none |
| any-independent · Core · maths | 56 | 56 | recall, application, multi_step, data_interpretation | numeric, choice | none |
| any-independent · Core · physics | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| any-independent · Core · chemistry | 15 | 15 | multi_step, data_interpretation | choice, numeric | none |
| any-independent · Core · biology | 16 | 16 | multi_step, data_interpretation | choice | none |
| any-independent · Core · computing | 18 | 18 | multi_step, data_interpretation | choice, numeric | none |
| any-independent · Advanced · maths | 67 | 67 | recall, application, data_interpretation | numeric, choice | none |
| any-independent · Advanced · physics | 18 | 18 | data_interpretation | choice | none |
| any-independent · Advanced · chemistry | 16 | 16 | data_interpretation | choice | none |
| any-independent · Advanced · biology | 16 | 16 | data_interpretation | choice | none |
| any-independent · Advanced · computing | 18 | 18 | data_interpretation | choice | none |

**`extended_response` is 0 everywhere and that is deliberate** (`lib/skills.ts#SKILLS_IN_BANK`):
no item in the bank declares a difficulty at its floor, so no course advertises it. The demand
mix a sitting declares is redistributed across the rungs that exist rather than saved for
a rung the instrument cannot produce — see `skillQuotaFor`.

## 4. The widest shortfalls, with their cause

| course | concept | target (band) | ceiling | best in band | served | cause |
|---|---|---|---|---|---|---|
| int-ib · sl · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| int-ib · sl · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| int-ib · hl · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| int-ib · hl · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| au-acara · senior · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| au-acara · senior · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| ie-junior · senior · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| ie-junior · senior · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| in-cbse · class11-12 · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| in-cbse · class11-12 · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| in-icse · isc · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| in-icse · isc · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| pk-matric · inter · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| pk-matric · inter · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| bd-ssc · hsc · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| bd-ssc · hsc · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| ke-kcse · form4 · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| ke-kcse · form4 · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| ng-waec · sss · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| ng-waec · sss · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| gh-wassce · shs · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| gh-wassce · shs · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| ph-deped · shs · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| ph-deped · shs · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| id-merdeka · sma · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| id-merdeka · sma · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| br-enem · medio · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| br-enem · medio · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| mx-sep · prepa · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| mx-sep · prepa · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| any-independent · advanced · maths | addition | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| any-independent · advanced · maths | subtraction | 0.9 (b5) | 0.3 | none | 0.3 | B generator |
| uk-gcse · higher · maths | addition | 0.87 (b5) | 0.3 | none | 0.3 | B generator |
| uk-gcse · higher · maths | subtraction | 0.87 (b5) | 0.3 | none | 0.3 | B generator |
| int-igcse · extended · maths | addition | 0.87 (b5) | 0.3 | none | 0.3 | B generator |
| int-igcse · extended · maths | subtraction | 0.87 (b5) | 0.3 | none | 0.3 | B generator |
| us-core · high · maths | addition | 0.87 (b5) | 0.3 | none | 0.3 | B generator |
| us-core · high · maths | subtraction | 0.87 (b5) | 0.3 | none | 0.3 | B generator |
| ca-provincial · senior · maths | addition | 0.87 (b5) | 0.3 | none | 0.3 | B generator |
| ca-provincial · senior · maths | subtraction | 0.87 (b5) | 0.3 | none | 0.3 | B generator |

## 5. Reproducing this

```
npm run content-audit              # the table
npm run content-audit -- --json    # + audit/content-coverage.json
npm run content-audit -- --report  # + this file
npm run content-gate               # the release gate over the same data
```

