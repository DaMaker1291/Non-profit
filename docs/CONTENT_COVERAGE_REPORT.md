# OpenMind — Content Coverage Report

**Method.** Every number here is produced by drawing each generator's catalogue
(400 draws) and reading the declared difficulty of every item, then intersecting
that with `coverageOf(spec, level)` — the same function the Learn screen and the
decision engine use. Reproduce with `npm run content-check` plus the probes
recorded in `docs/GLOBAL_STANDARD_AUDIT.md` §4.

**Date:** 2026-10-03.

> **Update — 2026-10-06.** The demand and depth figures below are a snapshot from
> before the per-SUBJECT depth layers existed
> (`lib/questions-{computing,chemistry,physics,biology}.ts`) and are now stale.
> Re-measured today by `npm run content-check`: **135/135** concepts have a
> generator · **application 133 · multi_step 127 · data_interpretation 127 ·
> extended_response 0** (was 80 at `data_interpretation`), and the **content-gap
> queue is 8**, every one of them a primary-arithmetic concept deliberately kept
> shallow (`place-value`, `addition`, `subtraction`, `multiplication`, `division`,
> `negatives`, `rounding`, `order-ops` — the `DATA_DEEP_PRIMARY` set, whose
> low ceilings the engine suite's fixtures depend on). `npm run gate:ceiling`
> reports **REACHED 80/80** advanced tier×subject rows, PASS 246 FAIL 0. Treat
> `npm run content-check` as the source of truth and re-measure §1–§3 before
> quoting any item count, difficulty reach or catalogue size from this report.

---

## 1. The bank

| Measure | Value |
|---|---|
| Concepts with a generator | **135 / 135** |
| Total distinct items | **14,813** |
| Mean distinct items per concept | **~110** |
| Concepts exposing 51+ items | **72** |
| Concepts exposing 21–50 | **18** |
| Concepts exposing 11–20 | **25** |
| Concepts exposing 6–10 | **20** |
| Concepts exposing ≤5 | **0** |
| Smallest catalogue | **8** (`rates-reaction`, `equilibria`, `photosynthesis`, `web-stack`) |

Subjects: maths 67, physics 18, chemistry 16, biology 16, computing 18.

**Deepened this pass** (the three shallowest): `loops` 4 → 55, `functions-code`
7 → 38, `digestion` 6 → 9, by adding distinct angles rather than seed jitter.

---

## 2. Demand dimensions

From `content-check` — how many concepts can serve each rung of the demand
ladder:

| Dimension | Concepts that can serve it |
|---|---|
| recall | 135 / 135 |
| application | 123 / 135 |
| multi_step | 111 / 135 |
| data_interpretation | 80 / 135 |
| **extended_response** | **0 / 135** |

`extended_response` is declared by the ladder and **unreachable for every
concept**. `content-check` reports this honestly as an instrument limit rather
than a fact about any learner. Closing it is the assessment-type work in
`docs/GLOBAL_STANDARD_AUDIT.md` §4.3.

---

## 3. Difficulty reach — the §7 finding

Drawing 200 seeds per concept and taking the range of declared difficulties:

- **50 of 135** concepts can reach difficulty **≥ 0.8**.
- **22 of 135** concepts **cap below 0.5** — they can never serve a hard item.

Intersecting with the tiers that declare a hard target (level difficulty > 0.7):

| Measure | Value |
|---|---|
| High-tier concept-slots (target > 0.7) | **1,045** |
| Of those, max reachable difficulty below target − 0.15 | **275 (26%)** |

**Reading:** for about a quarter of high-tier concept-slots, the generator's own
range cannot reach the level the tier declares. The serve is honest about it —
`generateQuestionNear` returns the best draw and the item's TRUE difficulty
rides along, so the surface never claims work the item is not — but a strong
learner practising one of those 22 concepts will be served work below their
tier. This is the concrete form of the mission's §7 concern, and it is
**measured, not assumed**.

---

## 4. Curriculum coverage

25 specifications across ~25 countries. Every level resolves to a stage-window
of the same 135-concept bank:

| Spec / level | Concepts | Spec / level | Concepts |
|---|---|---|---|
| uk-gcse/foundation | 122 | int-ib/hl | 131 |
| uk-gcse/higher | 130 | us-ap/ap | 87 |
| uk-alevel/as | 83 | in-cbse/class11-12 | 131 |
| uk-alevel/a2 | 87 | pk-matric/class6-8 | 48 |
| int-igcse/core | 94 | any-independent/advanced | 135 |
| int-igcse/extended | 130 | any-independent/foundations | 48 |

**This is the honest limit of "supported":** a curriculum map and a difficulty
window exist, but the concepts, objectives and provenance are **shared across
countries**, not distinct per board. There is no CASE-shaped standards model in
the tree. Per the brief's §5 test, these courses are **partially supported** —
the picker should say "not currently verified by OpenMind" for windows with no
distinct map. See `docs/GLOBAL_STANDARD_AUDIT.md` §4.2.

---

## 5. Assessment coverage

Assessment is **MCQ-only**. `Question` (`lib/types.ts:73`) is
`{ prompt, choices[4], answer, explanation, misconceptionTags }`; grading is
`choiceIndex === q.answer`. Of the brief's §6 response types — numeric entry,
algebraic entry, short answer, structured response, graphs, tables, code,
proof, multi-step calculation, data analysis, extended explanation,
experimental reasoning — only multiple choice is implemented. This is the
single largest assessment gap.

---

## 6. What a course must show before it may be called "supported"

Per the brief's §5, a course is SUPPORTED only when all of these hold. Current
status for the flagship (uk-gcse/higher):

| Requirement | Status |
|---|---|
| Curriculum map exists | ✅ (stage-window) |
| Content coverage exists | ✅ 130 concepts, 130/135 practisable |
| Appropriate difficulty exists | ⚠️ partial — §3 |
| Assessment types exist | ❌ MCQ only |
| Content reviewed | ❌ no review pipeline |
| Diagnostic can measure it | ✅ |
| Learner model can represent it | ✅ |
| Recommendation engine can act on it | ✅ (proven, §45) |

**Conclusion:** no course currently clears all eight. The gap is content depth,
assessment types and review — not the engine, which is measured and working.
