# OpenMind — Independent Educational Quality & Deployment Readiness Audit

**Audit date:** 31 October 2026  
**Audited tree:** `main` @ `d7d7505ab5463971a2aed5f60f5a0f5ec9237666`, working tree **dirty** (10 modified, 12 untracked entries, including an uncommitted graph-plotting/structured-assessment feature).  
**Environment:** Next.js 16.4.3, React 19.3.1, local production build on port 4173, isolated scratch store (`reports/.audit-tmp/store`, `OPENMIND_ALLOW_EPHEMERAL_STORE=1`). No learner data was read or written.

## Verdict

**NOT READY FOR LEARNERS.**

The engineering is real and unusually well tested. The teaching is not yet a curriculum.

OpenMind registers **135 concepts across five subjects**. **Fifteen** of them — all in mathematics — have a genuinely authored, multi-stage lesson. The other **120** receive a **31–58 word genome paragraph** (median 46 words) with no objective, intuition, figure, faded example or authored traps. They do get a generated worked example behind “Show me how”, and a misconception card where the genome declares one — but not a lesson. Every concept in physics (18), chemistry (16), biology (16) and computing (18) is in that fallback group. No lesson, question item or curriculum mapping has been reviewed by an educator; no learner has been measured.

A teacher who typed `openmind.example/learn/biology/photosynthesis` tomorrow would get a correct four-sentence summary followed immediately by practice. That is a revision aid, not a lesson.

| Dimension | Status | Basis |
|---|---|---|
| A. Technical readiness | **PARTIAL** | Build, typecheck and 4,477 engine assertions pass; `status:check` fails; `verify:lesson` stalled; `verify:render` crashed; no E2E run on this tree |
| B. Educational content readiness | **FAIL** | 120/135 concepts fallback; 68/68 science/computing concepts fallback; 0 educator reviews |
| C. Assessment readiness | **PARTIAL** | 135 generators, 5,400 sampled draws, 4-option/numeric only in practice; 0 human-reviewed items; 64/135 concepts above the option-bias line |
| D. Learner experience readiness | **PARTIAL** | All 15 authored maths lessons pass the 320-px and figure-layout assertions reached by the walk; the walk stalled at the fade step; 120 fallback pages have never been browser-walked |
| E. Low-resource readiness | **PARTIAL** | 320-px layout verified for 15 lessons; largest route chunk 1.72 MB raw / **563 KB gzip**; offline mode cannot fetch new questions or mark answers |
| F. Child safety and privacy | **PARTIAL** | Cross-profile access returns 401; `/api/question` strips keys; `/api/ready` publicly exposes the server's absolute data-directory path; local safeguarding/consent review outstanding |
| G. South Asia country readiness | **FAIL** | Eight specifications exist for BD/IN/PK/NP/LK, but no teaching content in Bengali, Hindi, Urdu, Nepali, Sinhala or Tamil; one South Asian mapping (CBSE maths) and it is unreviewed |
| H. Demonstrated learning effectiveness | **NOT EVIDENCED** | Zero teachers, zero learners, zero pilot data, zero reviewed items or mappings |

## The four questions

**1. Are the lessons genuinely complete, distinct and authored?**  
For 15 mathematics concepts, yes — and the authored plans are unusually complete for a free product: 299–666 words, 4–6 idea paragraphs, 3–4 named traps with the reason each fails, a live worked example, a faded second example, and a figure for 11 of the 15. They are explicitly labelled `unreviewed` on screen. For the other 120 concepts, no: the learner gets a concept-specific paragraph, not a lesson. Semantic duplication is **not** the problem — the highest measured overlap between any two plans is 0.34 (fractions / fraction-ops, which are deliberately adjacent), and between fallback paragraphs 0.24.

**2. Are diagrams and interactive models educationally useful?**  
Where they exist, largely yes. The 11 lesson figures are tied to a specific misconception (a pie cut into sixths for `2/3 = 4/6`, a balance for `3x + 5 = 20`, a square tiling for `√50 = 5√2`), and the Chrome walk measured them inside the viewport, legible (smallest label 12–13 px) and non-overlapping at 1280 and 320 px. But coverage is thin: **11/135 concepts have a lesson figure, all in maths; zero science diagrams**. In the 40-draw-per-concept sample, only **four concepts** generated a question figure (`coordinates`, `pythagoras`, `data-charts`, `scatter-correlation`). There is **one** interactive lesson model (`fractions`) — a two-slider fraction bar that correctly keeps the numerator ≤ denominator and updates "3 of 4 equal pieces" live. It has no automated interaction test.

**3. Is there a coherent experience across subjects?**  
Mathematics has a coherent pilot pathway of 15 lessons. Physics, chemistry, biology and computing have a concept map, a question generator and a paragraph. That is a coherent *index*, not a coherent *course*. The curriculum registry is broad (91 specifications, 70 national routes, 71 countries), but only two specifications have a concept-by-concept syllabus mapping on file, and **none has a reviewer**.

**4. Could it be piloted in a low-resource South Asian school?**  
Not as a general OpenMind deployment. A **narrow, supervised, English-medium pilot of the 15 authored mathematics lessons** — on connected devices, with a local teacher reviewing the content first and a durable data directory configured — is defensible. A pilot that promises the full curriculum, local-language teaching, offline practice or curriculum alignment would not be honest. The structural readiness for South Asia exists (Bangladesh SSC/HSC, Indian CBSE/ICSE, Pakistan Matric, Nepal SEE/NEB, Sri Lanka O/A Level), but the teaching, localisation, mapping review and teacher involvement do not.

## Strongest evidence in the product's favour

- **4,477 engine assertions pass**, including the closed loop from diagnostic → practice → prove → transfer, ledger replay, mastery, retention and the repair serve.
- **The lesson plans teach before they test**, in a measured order: objective → intuition → figure → idea → worked example → faded example → traps → practice door. The Chrome walk verified this order on the authored lesson it reached, measured the 320-px layout and aria-hidden SVG with a spoken caption across all 15 authored lessons, and saw the on-screen `unreviewed` disclosure; all 15 plans carry that state in data.
- **The content leans honest.** It prints that teaching is English when a learner chose another language, refuses half-translated plans, labels unreviewed lessons, reports 0 official past-paper items, and reports unknown/insufficient evidence rather than inventing a mastery score.
- **Security fundamentals are sound.** A profile id alone is not a credential: cross-profile GET and POST both returned 401; `/api/question` returned only `id, conceptId, difficulty, prompt, choices` — no answer, no explanation.
- **The build is clean** (`next build` exit 0), and the production server answers health/readiness correctly on a scratch store.

## Most serious gaps

1. **P0 — 89% of concepts do not teach.** `lib/genome.ts` supplies a paragraph; `app/learn/[subject]/[concept]/page.tsx:826-841` renders it as two paragraphs when `planFor()` returns null. The generated worked example at `:904` still renders, which is exactly why the page can look complete to a learner and to a reviewer. All 68 science/computing concepts are in this state.
2. **P0 — South Asian deployment is structurally mapped but educationally unbuilt.** `lib/content-i18n.ts` states plainly that all 15 dictionaries carry titles/blurbs and **none carries a sentence of the teaching**. `lib/lesson-plans-intl.ts` contains **one** translated plan (`fractions` → French). There are **zero** teaching translations in Bengali, Hindi, Urdu, Nepali, Sinhala or Tamil.
3. **P0 — offline is a reading pack, not a learning mode.** `public/sw.js` never caches `/api/*`; `app/api/my-pack/route.ts` exports only touched lesson paragraphs, the plan and weak areas. Offline, a learner can re-read and queue answers, but cannot receive a new question or a mark.
4. **P1 — nobody qualified has read the content.** 0/15 plans reviewed, 0/135 item sets reviewed (`audit/item-reviews.json` empty), 0/77 mapped concepts reviewed, 0/135 concepts validated with learners.
5. **P1 — assessment validity is only partly measured.** `npm run verify:q` can independently re-derive the answer for **5/135 concepts (3.7%)**; the other **39,000/40,500 draws are structural checks only**. `npm run gate:options` passes its committed floors, but **64/135 concepts remain above the 35% option-bias line**, with `gravity-fields` at **88.3%** and `hormones` at **82.5%** on a digit cue.
6. **P1 — explanations are still terse outside the rewritten layer.** Median explanation length is 8–18 prose words for many science/computing concepts; `explain:audit` passes because the committed floors are low, not because the prose is rich.
7. **P1 — the published status is stale.** `npm run status:check` exits 1: `audit/status.json` and README's status table are out of date. A deployment candidate that cannot reconcile its own claims is a release risk.
8. **P1 — `/api/ready` leaks operational detail.** An unauthenticated GET returned the absolute data-directory path, store configuration and durability codes. No learner data, but unnecessary disclosure on a public endpoint.

## Final classification

**1 — NOT READY FOR LEARNERS.**

The only defensible next step is a **controlled, supervised pilot of the 15 authored mathematics lessons**, under the conditions in `LEARNING_EFFECTIVENESS_AND_PILOT_PLAN.md` and `PRIORITISED_REMEDIATION_ROADMAP.md`: educator review first, durable storage declared, English-medium consent understood, connected devices, and no claim that the pilot represents the full 135-concept curriculum.

A multi-country South Asian deployment must not be approved on the current evidence. The registry says the right countries exist; the content does not yet teach them.

## Evidence levels used in this report

- **A — implemented in source**
- **B — tested automatically**
- **C — verified in the actual application (browser/DOM/HTTP)**
- **D — validated by an educator**
- **E — validated with real learners**

Most findings here are A/B/C. **D is empty. E is empty.** That is the central fact of this audit, and no amount of passing tests changes it.
