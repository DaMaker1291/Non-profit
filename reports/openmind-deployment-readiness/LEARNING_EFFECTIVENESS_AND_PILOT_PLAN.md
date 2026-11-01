# Learning Effectiveness and Pilot Plan

## 1. What exists today

**No learning-effectiveness evidence exists in this checkout.**

| Evidence type | Found? | Detail |
|---|---|---|
| Teacher evaluations | **No** | 0 teachers involved |
| Learner feedback | **No** | 0 learners in the audit store; `/api/impact` returned learners: 0 |
| Pilot reports | **No** | None in the repository |
| Pre/post assessments | **No** | No baseline or follow-up measurement |
| Delayed retention studies | **No** | None |
| Usability studies | **No** | None |
| Independent curriculum reviews | **No** | 0 reviewed mappings, 0 reviewed items, 0 reviewed plans |
| Human item review | **No** | `audit/item-reviews.json` empty |
| Educator lesson review | **No** | All 15 plans declare `review: "unreviewed"` |

The engine suite proves that the decision engine is **consistent** — the live model, a ledger replay and the server route produce the same action, and 4,477 assertions pass. That is implementation evidence (B), not learning evidence (E). It cannot tell us whether a child understands fractions better after using OpenMind.

The product's own copy is careful about this: `npm run benchmark` "measures what the decision engine actually decides … and, deliberately, does not measure learning." That honesty should be preserved in every pilot communication.

## 2. What can responsibly be claimed now

- **Can claim:** the 15 authored mathematics lessons implement a coherent teach-before-test sequence; the figures and 320-px layout were verified in a browser; the assessment machinery marks server-side and withholds keys; the platform builds and its engine suite passes.
- **Cannot claim:** that learners learn more, that the adaptive engine improves outcomes, that the questions are valid, that the curriculum is aligned, that the product works offline, or that it is ready for a South Asian school system.

## 3. The only defensible initial pilot

**Scope:** the 15 authored mathematics concepts in `audit/pilot-pack.json` (154 items), English medium, on connected devices, with a teacher in the room.

**Do not include:** physics, chemistry, biology, computing, the 52 fallback maths concepts, ICSE/state boards, Nepal or Sri Lanka (no local language), or any claim of full-curriculum coverage.

### 3.1 Design

A **controlled, supervised pilot** with a comparison group, not an uncontrolled pre/post celebration.

| Element | Design |
|---|---|
| Participants | 2 classes per participating school (one pilot, one comparison where feasible); ages appropriate to the course (e.g. CBSE Class 10 or SSC Class 9–10) |
| Assignment | Randomise classes, not individual children, to avoid contamination; if randomisation is not acceptable, use a matched comparison class and state the limitation |
| Duration | 6 weeks of use, plus a 4-week delayed retention test |
| Dosage | 2–3 sessions per week, 20–30 minutes, teacher-supervised; log actual usage, not intended usage |
| Baseline | An **independent** assessment written by the local teacher/researcher, not the OpenMind item bank; cover the same constructs with different items |
| Lessons | The 15 authored plans, in the intended order (fractions → fraction-ops → decimals → percentages → negatives → order-ops → algebra → graphs → quadratics/surds/completing-square) |
| Post-test | Same constructs as baseline, parallel form, independently marked |
| Delayed test | 4 weeks after the post-test, same constructs, to measure retention |
| Comparison | Business-as-usual teaching for the comparison class; no OpenMind access during the pilot |
| Feedback | Learner survey (usability, confidence, language), teacher interview, classroom observation |
| Misconception analysis | Use the ledger's misconception tags and repair outcomes; report which beliefs persisted, not just scores |
| Adverse outcomes | Report non-usage, dropout, device failure, connectivity loss, distress, and any content error found by a teacher |

### 3.2 Measures

- **Primary:** independent post-test score on the 15 concepts, adjusted for baseline (ANCOVA or a mixed model with class as a random effect).
- **Secondary:** delayed retention; transfer items (unfamiliar contexts); time on task; completion; hint use; misconception retirement; teacher-rated usability.
- **Process:** actual sessions per week, device type, connection quality, offline events, sync failures.
- **Equity:** report results by gender, device ownership, home language and prior attainment if the school can share them safely — without collecting unnecessary personal data.

### 3.3 Analysis and honesty

- Pre/post gains in the pilot class alone are **not causal**. Report them as descriptive.
- With a comparison group, report effect size and 95% CI, not only p-values. With two classes, the study is underpowered for small effects; say so.
- Pre-register the primary outcome and the analysis before the pilot starts.
- Report **all** outcomes, including null and negative ones. The product's own impact endpoint already states that learners who stop cannot be measured; the pilot report must say the same.
- Do not pool the 15 concepts into one "mastery" number without showing per-concept results; a strong fractions result can hide a failed quadratics lesson.

### 3.4 Ethics and safeguarding

- Parental/guardian consent and learner assent, in the local language.
- School agreement naming the data controller, retention period and deletion route.
- No personal data in the audit or in public reports; aggregate only, with small-cell suppression.
- A named safeguarding lead and an incident procedure.
- The teacher can stop the pilot at any time; no learner is required to use the device.
- Local language support for consent and feedback, even if the lessons are English medium.
- Review the pilot with a qualified educational researcher before claiming any effect.

## 4. What must be true before the first learner signs in

1. **Educator review of the 15 plans and 154 items.** A subject teacher signs each plan; the review state on screen changes from `unreviewed`.
2. **A durable, backed-up store.** `OPENMIND_DATA_DIR` set to persistent storage; a backup taken; a **restore drill** passed.
3. **A tested offline path.** Download pack → airplane mode → read → answer → reconnect → marked and synced. If it fails, the pilot is connectivity-dependent and must say so.
4. **A real device/network baseline.** Cold load on the school's actual phone and SIM; measured MB per lesson.
5. **Local consent and safeguarding agreements.** See `PRIVACY_SAFEGUARDING_AND_OPERATIONS.md`.
6. **A named teacher champion** who has taught the 15 concepts and can explain the sequence to learners.
7. **A stop rule:** if a content error, data loss, or safeguarding concern occurs, pause the pilot and report it.

## 5. Success criteria (proposed, to be agreed with the researcher)

- **Feasibility:** ≥70% of enrolled learners complete ≥8 of the 15 lessons; ≥80% of sessions load without a fatal error; no data loss.
- **Usability:** teacher rates the sequence usable without additional planning; learners can find the next step unaided.
- **Learning:** a pre-specified, educationally meaningful improvement on the independent post-test versus comparison, with a CI that excludes no effect; a retention signal at 4 weeks.
- **Equity:** no evidence that learners without a personal device or with lower prior attainment are systematically excluded.
- **Content:** no unresolved factual error found by the teacher.

A failure on feasibility or content accuracy stops expansion regardless of test scores.

## 6. What the pilot still cannot prove

Even a successful pilot of 15 concepts in two classes does not prove that OpenMind works across 135 concepts, five subjects, or five countries. It proves that **this pathway, with this teacher, on these devices**, is usable and associated with better measured performance. That is the correct claim, and it is enough for the next decision.

## 7. Timeline (proposed)

| Week | Work |
|---|---|
| −4 to −2 | Teacher review of 15 plans/items; mapping review for the chosen course; consent and safeguarding agreements; device/network baseline |
| −1 | Restore drill; offline journey test; teacher training; pre-register analysis |
| 0 | Baseline assessment; device setup |
| 1–6 | 2–3 sessions/week; weekly teacher check-in; log usage and incidents |
| 7 | Post-test; learner/teacher feedback |
| 11 | Delayed retention test |
| 12 | Analysis and public report, including null/negative findings |

## 8. Bottom line

OpenMind is **capable of supporting a meaningful pilot** of its 15 authored mathematics lessons. It has not yet earned the right to claim that it improves learning, and it must not enter a South Asian school as a full curriculum. The pilot's job is to find out whether the teaching works — and to be honest if it does not.
