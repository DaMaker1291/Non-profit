# Year 11 diagnostic journeys

Generated: 2026-11-27T21:37:46.871Z

Engine-only and deterministic: each sitting uses the same seed and the same course resolution as the running app. No learner store is opened.

## Year 11 · GCSE Higher

- Declared course: `{"spec":"uk-gcse","specLevel":"higher"}`
- Resolved course: **GCSE** (`uk-gcse`) · tier **Higher tier** (`higher`) at demand **0.65**
- Year: **Year 11**
- Gate: served (uk-gcse / higher)

| # | Concept | Prompt | Difficulty | Band | Expected | Actual skill | Selection | Reason | In course | Purpose |
|---:|---|---|---:|---:|---:|---|---|---|---|---|
| 1 | quadratics | The graph of y = x² + 2x − 24 crosses the x-axis at two points. What are the x-coordinates of those points? | 0.59 | 3 | 0.60 | multi_step | blueprint_course_open | meets | yes | course_level |
| 2 | quadratics | The graph of y = x² − 3x + 2 crosses the x-axis at two points. What are the x-coordinates of those points? | 0.60 | 3 | 0.60 | multi_step | blueprint_climb | meets | yes | course_level |
| 3 | quadratics | The roots of x² − 8x + 16 = 0 are α and β.
Work out α + β + αβ. | 0.85 | 5 | 0.85 | data_interpretation | blueprint_climb | meets | yes | course_level |
| 4 | quadratics | The roots of x² − 9x + 18 = 0 are α and β.
Work out α + β + αβ. | 0.87 | 5 | 0.85 | data_interpretation | blueprint_climb | meets | yes | course_level |
| 5 | standard-form | Work out (8 × 10³) × (9 × 10⁶). Give your answer in standard form. | 0.62 | 4 | 0.60 | multi_step | blueprint_course_open | meets | yes | course_level |
| 6 | standard-form | Work out (7 × 10⁴) × (5 × 10⁵). Give your answer in standard form. | 0.61 | 4 | 0.60 | multi_step | blueprint_climb | meets | yes | course_level |
| 7 | standard-form | Without a calculator, work out (3.2 × 10⁴) ÷ (8 × 10⁻²).
Give your answer in standard form. | 0.88 | 5 | 0.85 | data_interpretation | blueprint_climb | meets | yes | course_level |
| 8 | standard-form | Without a calculator, work out (2.8 × 10³) ÷ (7 × 10⁻³).
Give your answer in standard form. | 0.87 | 5 | 0.85 | data_interpretation | blueprint_climb | meets | yes | course_level |
| 9 | fraction-ops | Work out 1/6 + 2/3 − 1/8. Give your answer as a fraction in its simplest form. | 0.59 | 3 | 0.60 | multi_step | blueprint_course_open | meets | yes | course_level |
| 10 | fraction-ops | Work out 2/5 + 1/4 − 2/3. Give your answer as a fraction in its simplest form. | 0.62 | 4 | 0.60 | multi_step | blueprint_climb | meets | yes | course_level |

## Year 11 · GCSE Foundation

- Declared course: `{"spec":"uk-gcse","specLevel":"foundation"}`
- Resolved course: **GCSE** (`uk-gcse`) · tier **Foundation tier** (`foundation`) at demand **0.45**
- Year: **Year 11**
- Gate: served (uk-gcse / foundation)

| # | Concept | Prompt | Difficulty | Band | Expected | Actual skill | Selection | Reason | In course | Purpose |
|---:|---|---|---:|---:|---:|---|---|---|---|---|
| 1 | quadratics | Solve x² − 11x + 30 = 0. Give the smaller root. | 0.50 | 3 | 0.40 | application | blueprint_course_open | meets | yes | course_level |
| 2 | quadratics | Solve x² − 10x + 24 = 0. Give the smaller root. | 0.50 | 3 | 0.40 | application | blueprint_climb | meets | yes | course_level |
| 3 | quadratics | The graph of y = x² + 8x + 15 crosses the x-axis at two points. What are the x-coordinates of those points? | 0.61 | 4 | 0.60 | multi_step | blueprint_climb | meets | yes | course_level |
| 4 | quadratics | The graph of y = x² − 4x − 5 crosses the x-axis at two points. What are the x-coordinates of those points? | 0.59 | 3 | 0.60 | multi_step | blueprint_climb | meets | yes | course_level |
| 5 | quadratics | The roots of x² − 7x + 10 = 0 are α and β.
Work out α + β + αβ. | 0.86 | 5 | 0.85 | data_interpretation | blueprint_climb | meets | yes | course_level |
| 6 | quadratics | The roots of x² − 14x + 49 = 0 are α and β.
Work out α + β + αβ. | 0.86 | 5 | 0.85 | data_interpretation | blueprint_climb | meets | yes | course_level |
| 7 | standard-form | Write 0.025 in standard form A × 10ⁿ. What is the value of n? | 0.35 | 2 | 0.40 | application | blueprint_course_open | meets | yes | course_level |
| 8 | standard-form | Write 0.000003 in standard form A × 10ⁿ. What is the value of n? | 0.35 | 2 | 0.40 | application | blueprint_climb | meets | yes | course_level |
| 9 | standard-form | Work out (8 × 10⁴) × (3 × 10²). Give your answer in standard form. | 0.61 | 4 | 0.60 | multi_step | blueprint_climb | meets | yes | course_level |
| 10 | standard-form | Work out (8 × 10²) × (2 × 10²). Give your answer in standard form. | 0.61 | 4 | 0.60 | multi_step | blueprint_climb | meets | yes | course_level |

## Year 11 · GCSE with no tier chosen

- Declared course: `{"spec":"uk-gcse"}`
- Resolved course: **GCSE** (`uk-gcse`)
- Year: **Year 11**
- Gate: **REFUSED** — missing specLevel. No question is served.

The learner-facing page redirects to `/curriculum?return=/diagnostic/maths`, keeps **GCSE** visible, asks for the tier, disables Save, and states `Still to choose: Level`. It never falls back to Foundation.

## Screenshots

- Journey A (Year 11 Higher): `audit/screenshots/journey-a-year11-higher-q1.png`
- Journey B (Year 11 Foundation): `audit/screenshots/journey-b-year11-foundation-q1.png`
- Journey C (Year 11, no tier): `audit/screenshots/journey-c-year11-no-tier-refused.png` and `...-detail.png`

## Reproduce

```bash
npm run audit:diagnostic
```
