# Diagnostic pipeline audit

Generated: 2026-11-27T21:37:46.871Z

This is an engine-only, reproducible audit. It opens no learner store and changes no production data.

## Verdict

- Profiles measured: **9** — served **7**, refused **2**.
- Simulated baseline sittings: **840**; questions traced: **7,840**.
- Questions outside the learner's resolved course: **0**.
- Questions below the rung the ladder asked for: **0** (0%).
- Questions below the course's OPENING demand: **0** (0%).
- Questions below the course's declared maximum demand: **1235** (15.8%).

A question below the declared maximum is not automatically a defect: the ladder opens at the deepest rung at or below the course's declaration. The reason column records which case applies.

## Profiles

| Profile | Course | Tier | Year in course | Gate | Sessions | Questions | First question meets opening | Below declared | Limitation |
|---|---|---|---|---|---:|---:|---:|---:|---|
| Year 5 · primary mathematics (GB) | — | — (display fallback Foundations · 0.35) | **no** | refused: grade, spec | — | — | — | — | no course |
| Year 5 proxy · generic foundations (international) | Independent · skills pathway (any-independent) | Foundations · 0.35 | yes | served | 120 | 1120 | 120/120 (100%) | 438 |  |
| Year 7 · lower secondary (GB) | GCSE (uk-gcse) | Foundation tier · 0.45 | **no** | served | 120 | 1120 | 120/120 (100%) | 0 |  |
| Year 9 · GCSE preparation (GB) | GCSE (uk-gcse) | Foundation tier · 0.45 | **no** | served | 120 | 1120 | 120/120 (100%) | 0 |  |
| Year 11 · GCSE Higher | GCSE (uk-gcse) | Higher tier · 0.65 | yes | served | 120 | 1120 | 120/120 (100%) | 0 |  |
| Year 11 · GCSE Foundation | GCSE (uk-gcse) | Foundation tier · 0.45 | yes | served | 120 | 1120 | 120/120 (100%) | 0 |  |
| Year 11 · GCSE with no tier chosen | GCSE (uk-gcse) | — (display fallback Foundation tier · 0.45) | yes | refused: specLevel | — | — | — | — | no course |
| Year 12 · A-level | A-Level (uk-alevel) | AS · 0.75 | yes | served | 120 | 1120 | 120/120 (100%) | 797 |  |
| International · Cambridge IGCSE Extended | Cambridge IGCSE (int-igcse) | Extended · 0.65 | yes | served | 120 | 1120 | 120/120 (100%) | 0 |  |

## Refusals and coverage limitations

- **Year 5 · primary mathematics (GB)** — grade, spec. The national route has no Year 5 entry and the qualification registry has no primary specification. The gate must refuse rather than serve GCSE.
- **Year 11 · GCSE with no tier chosen** — specLevel. The exact silent-Foundation case. The course gate must name specLevel and serve nothing.

## Served-demand detail

### Year 5 proxy · generic foundations (international)

- Course: **Independent · skills pathway** · tier **Foundations** · declared demand **application** · opening rung **0.15 recall**.
- Sampling: 120 sittings × 10 questions, across correct / wrong / alternate answer patterns.
- Served demand met: **1120/1120** (100%). Below the rung: **0**.
- Below the course's opening demand: **0**. Below the declared maximum: **438**.
- Reasons: meets 682 · course opening rung 438.

| Concept | Samples | Min | Median | Max | Raw reach at declared | Cache rate | Bands |
|---|---:|---:|---:|---:|---:|---:|---|
| fraction-ops | 96 | 0.35 | 0.55 | 0.81 | 100.0% | 100.0% | 1:0 2:6 3:59 4:27 5:4 |
| linear-equations | 96 | 0.30 | 0.55 | 0.83 | 91.7% | 84.4% | 1:0 2:35 3:29 4:24 5:8 |
| place-value | 96 | 0.10 | 0.35 | 0.35 | 50.0% | 50.0% | 1:48 2:48 3:0 4:0 5:0 |
| fractions | 96 | 0.15 | 0.40 | 0.81 | 93.8% | 90.6% | 1:6 2:51 3:11 4:24 5:4 |

### Year 7 · lower secondary (GB)

- Course: **GCSE** · tier **Foundation tier** · declared demand **application** · opening rung **0.40 application**.
- **Year 7 is outside this qualification's declared years** (GCSE declares Foundation tier). No pre-GCSE/primary course exists for this route, so the audit records the mismatch rather than pretending the year selected a different curriculum.
- Sampling: 120 sittings × 10 questions, across correct / wrong / alternate answer patterns.
- Served demand met: **1120/1120** (100%). Below the rung: **0**.
- Below the course's opening demand: **0**. Below the declared maximum: **0**.
- Reasons: meets 1120.

| Concept | Samples | Min | Median | Max | Raw reach at declared | Cache rate | Bands |
|---|---:|---:|---:|---:|---:|---:|---|
| quadratics | 96 | 0.50 | 0.64 | 0.93 | 100.0% | 100.0% | 1:0 2:0 3:36 4:40 5:20 |
| standard-form | 96 | 0.30 | 0.50 | 0.93 | 50.0% | 43.8% | 1:0 2:48 3:12 4:12 5:24 |
| fraction-ops | 96 | 0.35 | 0.55 | 0.81 | 93.8% | 87.5% | 1:0 2:6 3:59 4:27 5:4 |
| negatives | 96 | 0.20 | 0.35 | 0.45 | 36.5% | 32.8% | 1:29 2:32 3:35 4:0 5:0 |

### Year 9 · GCSE preparation (GB)

- Course: **GCSE** · tier **Foundation tier** · declared demand **application** · opening rung **0.40 application**.
- **Year 9 is outside this qualification's declared years** (GCSE declares Foundation tier). No pre-GCSE/primary course exists for this route, so the audit records the mismatch rather than pretending the year selected a different curriculum.
- Sampling: 120 sittings × 10 questions, across correct / wrong / alternate answer patterns.
- Served demand met: **1120/1120** (100%). Below the rung: **0**.
- Below the course's opening demand: **0**. Below the declared maximum: **0**.
- Reasons: meets 1120.

| Concept | Samples | Min | Median | Max | Raw reach at declared | Cache rate | Bands |
|---|---:|---:|---:|---:|---:|---:|---|
| quadratics | 96 | 0.50 | 0.64 | 0.93 | 100.0% | 100.0% | 1:0 2:0 3:36 4:40 5:20 |
| standard-form | 96 | 0.30 | 0.50 | 0.93 | 50.0% | 43.8% | 1:0 2:48 3:12 4:12 5:24 |
| fraction-ops | 96 | 0.35 | 0.55 | 0.81 | 93.8% | 87.5% | 1:0 2:6 3:59 4:27 5:4 |
| negatives | 96 | 0.20 | 0.35 | 0.45 | 36.5% | 32.8% | 1:29 2:32 3:35 4:0 5:0 |

### Year 11 · GCSE Higher

- Course: **GCSE** · tier **Higher tier** · declared demand **multi_step** · opening rung **0.60 multi_step**.
- Sampling: 120 sittings × 10 questions, across correct / wrong / alternate answer patterns.
- Served demand met: **1120/1120** (100%). Below the rung: **0**.
- Below the course's opening demand: **0**. Below the declared maximum: **0**.
- Reasons: meets 1120.

| Concept | Samples | Min | Median | Max | Raw reach at declared | Cache rate | Bands |
|---|---:|---:|---:|---:|---:|---:|---|
| quadratics | 96 | 0.50 | 0.64 | 0.93 | 46.9% | 51.6% | 1:0 2:0 3:36 4:40 5:20 |
| standard-form | 96 | 0.30 | 0.50 | 0.93 | 28.1% | 28.1% | 1:0 2:48 3:12 4:12 5:24 |
| fraction-ops | 96 | 0.35 | 0.55 | 0.81 | 26.0% | 26.6% | 1:0 2:6 3:59 4:27 5:4 |
| fractions | 96 | 0.15 | 0.40 | 0.81 | 22.9% | 23.4% | 1:6 2:51 3:11 4:24 5:4 |

### Year 11 · GCSE Foundation

- Course: **GCSE** · tier **Foundation tier** · declared demand **application** · opening rung **0.40 application**.
- Sampling: 120 sittings × 10 questions, across correct / wrong / alternate answer patterns.
- Served demand met: **1120/1120** (100%). Below the rung: **0**.
- Below the course's opening demand: **0**. Below the declared maximum: **0**.
- Reasons: meets 1120.

| Concept | Samples | Min | Median | Max | Raw reach at declared | Cache rate | Bands |
|---|---:|---:|---:|---:|---:|---:|---|
| quadratics | 96 | 0.50 | 0.64 | 0.93 | 100.0% | 100.0% | 1:0 2:0 3:36 4:40 5:20 |
| standard-form | 96 | 0.30 | 0.50 | 0.93 | 50.0% | 43.8% | 1:0 2:48 3:12 4:12 5:24 |
| fraction-ops | 96 | 0.35 | 0.55 | 0.81 | 93.8% | 87.5% | 1:0 2:6 3:59 4:27 5:4 |
| negatives | 96 | 0.20 | 0.35 | 0.45 | 36.5% | 32.8% | 1:29 2:32 3:35 4:0 5:0 |

### Year 12 · A-level

- Course: **A-Level** · tier **AS** · declared demand **data_interpretation** · opening rung **0.60 multi_step**.
- Sampling: 120 sittings × 10 questions, across correct / wrong / alternate answer patterns.
- Served demand met: **1120/1120** (100%). Below the rung: **0**.
- Below the course's opening demand: **0**. Below the declared maximum: **797**.
- Reasons: course opening rung 797 · meets 323.

| Concept | Samples | Min | Median | Max | Raw reach at declared | Cache rate | Bands |
|---|---:|---:|---:|---:|---:|---:|---|
| trig-identity | 96 | 0.45 | 0.45 | 0.92 | 26.0% | 29.7% | 1:0 2:0 3:61 4:12 5:23 |
| quadratics | 96 | 0.50 | 0.64 | 0.93 | 20.8% | 28.1% | 1:0 2:0 3:36 4:40 5:20 |
| standard-form | 96 | 0.30 | 0.50 | 0.93 | 25.0% | 28.1% | 1:0 2:48 3:12 4:12 5:24 |
| algebra-expand | 96 | 0.45 | 0.60 | 0.92 | 24.0% | 25.0% | 1:0 2:0 3:42 4:34 5:20 |

### International · Cambridge IGCSE Extended

- Course: **Cambridge IGCSE** · tier **Extended** · declared demand **multi_step** · opening rung **0.60 multi_step**.
- Sampling: 120 sittings × 10 questions, across correct / wrong / alternate answer patterns.
- Served demand met: **1120/1120** (100%). Below the rung: **0**.
- Below the course's opening demand: **0**. Below the declared maximum: **0**.
- Reasons: meets 1120.

| Concept | Samples | Min | Median | Max | Raw reach at declared | Cache rate | Bands |
|---|---:|---:|---:|---:|---:|---:|---|
| quadratics | 96 | 0.50 | 0.64 | 0.93 | 46.9% | 51.6% | 1:0 2:0 3:36 4:40 5:20 |
| standard-form | 96 | 0.30 | 0.50 | 0.93 | 28.1% | 28.1% | 1:0 2:48 3:12 4:12 5:24 |
| fraction-ops | 96 | 0.35 | 0.55 | 0.81 | 26.0% | 26.6% | 1:0 2:6 3:59 4:27 5:4 |
| fractions | 96 | 0.15 | 0.40 | 0.81 | 22.9% | 23.4% | 1:6 2:51 3:11 4:24 5:4 |

## Reproduce

```bash
npm run audit:diagnostic
```

The full ten-question trace is in `audit/diagnostic-pipeline-rows.jsonl` (7,840 rows).
