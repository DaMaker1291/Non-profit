# Prioritised Remediation Roadmap

Every finding includes severity, area, evidence, the exact source, what must change, and how completion will be tested. This is a plan, not a development session: no product code was changed in the audit.

## P0 — must be resolved before any learner deployment

### P0-01 — 120 of 135 concepts have no authored lesson

- **Area:** Educational content
- **Affected:** 120 concepts; **all 68** in physics, chemistry, biology and computing; 52 in maths
- **What is wrong:** `planFor(id)` returns null; the page renders the genome paragraph split into two paragraphs (`app/learn/[subject]/[concept]/page.tsx:826-841`). No objective, intuition, figure, faded example or authored traps. A generated worked example still renders at `:904`, which makes the page look complete.
- **Why it matters:** a learner who has never met the concept is asked to practise it after reading 31–58 words. That is the product's core promise unmet.
- **Evidence:** `LESSON_AUDIT.csv` (120 FALLBACK rows); `inventory.json`; rendered `addition` page; `FALLBACK_AND_DUPLICATION_REPORT.md`.
- **Change:** author plans for the next pathway before exposing those concepts; until then, label a fallback page as a summary and route the learner to an authored prerequisite. Do not present a fallback as a lesson.
- **Completion test:** every concept in a pilot pathway has a plan with objective/intuition/≥4 ideas/≥3 traps/worked+faded example; `planFor` coverage equals the pathway's concept set; `verify:lesson` walks every one.
- **Blocks:** any pilot beyond the 15 authored maths concepts.

### P0-02 — South Asian deployment has no teaching in the local language and no reviewed curriculum mapping

- **Area:** International readiness
- **Affected:** Bangladesh, India (except one unreviewed CBSE maths mapping), Pakistan, Nepal, Sri Lanka
- **What is wrong:** all 15 dictionaries carry titles/blurbs, **none carries a sentence of teaching** (`lib/content-i18n.ts`). One plan is translated (French). Zero Bengali/Hindi/Urdu/Nepali/Sinhala/Tamil teaching. Only 2 mappings exist (UK GCSE maths, IN CBSE maths), both `reviewer: null`; 18 pathways have no source. Nepal/Sri Lanka have no local language shipped at all.
- **Why it matters:** a learner in Dhaka reads a Bengali menu over English teaching; a Nepali or Sri Lankan learner cannot use the interface in the national language. A ministry cannot audit an unreviewed mapping.
- **Evidence:** `SOUTH_ASIA_READINESS.md`; `lib/lesson-plans-intl.ts`; `lib/curricula/mappings.ts:204-239`; `curriculum-gate` output.
- **Change:** pick one country/course (CBSE Class 10 maths or BD SSC maths); complete a concept mapping with a named reviewer; translate the 15 plans and their coaching into the language of instruction; add local examples. Do not claim country support before all three.
- **Completion test:** reviewer non-null on the chosen mapping; a full plan translation accepted by `planFor(id, lang)` with no English fallback; a local teacher signs the lessons; `curriculum-gate` still passes.
- **Blocks:** country-specific deployment.

### P0-03 — Offline mode cannot deliver new questions or marking

- **Area:** Low-resource readiness
- **Affected:** all learners on intermittent connections
- **What is wrong:** `public/sw.js` never caches `/api/*`; `app/api/my-pack/route.ts` exports only touched genome paragraphs, the plan and weak areas. Offline, a learner can re-read cached pages and queue answers, but cannot receive a new question or a mark.
- **Why it matters:** the stated deployment context is schools where the internet disappears. A pack that cannot assess is a reading handout, not a learning mode.
- **Evidence:** `LOW_RESOURCE_READINESS.md`; `public/sw.js`; `app/api/my-pack/route.ts`; `components/download-pack.tsx`.
- **Change:** either (a) include a bounded set of pre-generated items with keys and a local marking path in the pack, with sync reconciliation, or (b) stop claiming offline learning and state "offline reading + queued answers" on every surface.
- **Completion test:** download pack → airplane mode → open lesson → answer a question → receive a mark → reconnect → ledger reconciles once, no duplicate. Measured on a real device.
- **Blocks:** offline/low-connectivity pilot.

## P1 — major teaching, assessment or accessibility defects

### P1-01 — No educator has reviewed any lesson, item or mapping

- **Area:** Content governance
- **Evidence:** 15/15 plans `unreviewed`; `audit/item-reviews.json` empty; `mappingsWithReviewer: 0`; 0 learner validation.
- **Change:** create a signed review record per plan/item/mapping; display the reviewer and date on screen; refuse to call a pathway "pilot-ready" without it.
- **Completion test:** a reviewer name and date on every pilot plan/item/mapping; the lesson page reads `subject-reviewed`; the suite asserts the state.

### P1-02 — Assessment validity is only partly measured

- **Area:** Assessment
- **Evidence:** 5/135 concepts prompt-derived; 39,000/40,500 structural-only; 64/135 above the 35% option-bias line; `gravity-fields` 88.3%, `hormones` 82.5%.
- **Change:** add prompt-derived matchers for the remaining shapes; repair the worst option cues (digit/length); human-review the pilot items; report per-concept validity.
- **Completion test:** `verify:q` prompt-derived coverage rises; `gate:options` has no concept above the line; item reviews non-empty.

### P1-03 — Explanations are terse outside the rewritten layer

- **Area:** Teaching quality
- **Evidence:** median 8–18 prose words for many science/computing concepts; 15 concepts have draws under 6 words; examples in `ASSESSMENT_QUALITY_REPORT.md`.
- **Change:** rewrite the lowest concepts to the stated standard (operation in words → substitute → meaning → tempting wrong option); raise the committed floors only after the rewrite.
- **Completion test:** `explain:audit` with no concept below 25 words in the pilot pathway; spot-read by a teacher.

### P1-04 — Diagram and interaction coverage

- **Area:** Visual learning
- **Evidence:** 11/135 lesson figures (all maths); 0 science; 4 concepts with question figures; 1 interactive model; right-triangle unused.
- **Change:** add concept-specific figures for the pilot science pathway (circuit, forces, cell, bonding) and question figures where the item needs one; test the fraction model's sliders.
- **Completion test:** every pilot concept that materially needs a visual has one; Chrome walk measures it at 320/1280; interaction test changes denominator and asserts bar/text/aria.

### P1-05 — Curriculum mapping coverage

- **Area:** Curriculum
- **Evidence:** 2 mappings, 77 concepts, 0 reviewers, 18 pathways no source; South Asia only CBSE maths.
- **Change:** map one South Asian course fully and review it; add source URLs to the pathways claimed as researched.
- **Completion test:** `curriculum-gate` reports the chosen course with reviewer non-null and source on file; `status:check` consistent.

### P1-06 — Factual error in chemistry fallback

- **Area:** Content accuracy
- **Evidence:** `lib/genome.ts#periodic-table`: "group 8 noble gases" — noble gases are Group 18 (IUPAC) or Group 0 (UK convention).
- **Change:** correct the sentence; audit the other 119 fallback paragraphs for the same class of error with a subject teacher.
- **Completion test:** a content-accuracy sweep of all fallback paragraphs; no unresolved factual error.

### P1-07 — Published status is stale

- **Area:** Release hygiene
- **Evidence:** `npm run status:check` exits 1: `audit/status.json` and README status table stale.
- **Change:** regenerate the status report; reconcile README claims with measured numbers; add `status:check` to CI.
- **Completion test:** `npm run status:check` exit 0; the deployment candidate's claims match the tree.

### P1-08 — Browser verification is incomplete

- **Area:** Learner experience
- **Evidence:** `verify:lesson` stalled at the fade step; 120 fallback pages not walked; `verify:render` crashed.
- **Change:** fix the walk's hang; add a fallback-page walk; make `verify:render` start/serve reliably; publish the final assertion count.
- **Completion test:** `verify:lesson` completes with a pass count; a fallback smoke test visits every subject; `verify:render` exit 0.

### P1-09 — `/api/ready` exposes the data-directory path

- **Area:** Security
- **Evidence:** unauthenticated 200 with `dir: "/Users/…/store"`.
- **Change:** remove `dir`; keep stable codes and durability; gate detail behind loopback/admin.
- **Completion test:** `/api/ready` returns no filesystem path; an unauth caller gets only status/codes.

### P1-10 — Low-resource readiness is unmeasured

- **Area:** Low-resource
- **Evidence:** 1.03 MB gzip first-load JS; largest chunk 563 KB gzip; no device/network test.
- **Change:** split the question bank from the lesson route; measure on a real low-end phone and SIM; publish MB/session.
- **Completion test:** lesson text renders before the question bundle; measured cold load and data per lesson within the pilot's budget.

### P1-11 — Uncommitted assessment work is outside the deployment candidate

- **Area:** Release
- **Evidence:** graph-plot/structured items/papers changes are uncommitted; HEAD does not contain them.
- **Change:** decide whether they are in the pilot; commit and test, or exclude and document.
- **Completion test:** a tagged deployment candidate whose tree matches the audit; no untracked feature in the artefact.

## P2 — important quality and operations

| ID | Finding | Change | Completion test |
|---|---|---|---|
| P2-01 | `npm run start` warns it is incompatible with `output: standalone` | Document/use `node .next/standalone/server.js` or `start-openmind.sh` | Start command matches the build; smoke test passes |
| P2-02 | `verify:render` crashed with `fetch failed` | Diagnose its server startup; make it deterministic | Exit 0 with a pass count |
| P2-03 | Backup/restore unproven | Take a backup, verify it, run `restore-drill` | Restored store reconstructs a learner |
| P2-04 | Accessibility unverified | TalkBack/NVDA walkthrough; contrast; 200% text | One lesson + one question completed with a screen reader |
| P2-05 | Untracked nested `NON PROFIT/` directory | Remove/ignore before packaging | Clean status; artefact contains no stray tree |
| P2-06 | No teacher/class permission test run | Run `verify:permissions`; test two teachers/two classes | A teacher cannot read another class |

## P3 — enhancements

| ID | Finding | Change |
|---|---|---|
| P3-01 | `right-triangle` renderer is unused | Use it in a trig lesson or remove the branch |
| P3-02 | Transfer available for very few concepts | Add re-framing for the pilot pathway |
| P3-03 | Transfer note (`usedFor`) is absent on fallback pages | Add it once plans exist |
| P3-04 | Local contexts are UK-flavoured | Localise examples during translation |

## Milestones

### M0 — Stop the claims (days)
Fix `status:check`, `/api/ready`, the `next start` documentation, and any surface that presents fallback content as a lesson. **Exit:** `status:check` 0; readiness endpoint clean; the product labels fallback pages honestly.

### M1 — Make the 15-lesson pilot defensible (2–4 weeks)
Educator review of 15 plans and 154 items; fix P1-06; complete the lesson walk; add the fraction-model interaction test. **Exit:** reviewed plans; `verify:lesson` completes; no unresolved factual error.

### M2 — Localise one South Asian course (6–10 weeks)
Choose CBSE Class 10 maths or BD SSC maths. Complete and review the mapping; translate the 15 plans and coaching into the language of instruction; add local examples. **Exit:** reviewer non-null; `planFor(id, lang)` returns the full translated plan; a local teacher signs it.

### M3 — Make offline honest (4–6 weeks)
Either deliver a marked offline item set or change the claim. **Exit:** airplane-mode journey marked and reconciled, or no offline-learning claim remains.

### M4 — Expand the authored curriculum (ongoing)
Author science lessons and figures, starting with the concepts the pilot's next term needs. Do not add a subject to the menu before its first pathway is authored.

### M5 — Assessment validity (parallel)
Prompt-derived matchers, option-cue repairs, human item review. **Exit:** no pilot item above the bias line; every pilot item reviewed.

### M6 — Supervised pilot (6 weeks + 4-week retention)
Run the design in `LEARNING_EFFECTIVENESS_AND_PILOT_PLAN.md`. **Exit:** a public report with all outcomes, including null and negative.

## The shortest credible route

1. Do not add features.
2. Review and localise the 15 lessons that already teach.
3. Make the offline claim true or remove it.
4. Then measure learning with real children and a comparison group.

Everything else — more concepts, more subjects, more countries — multiplies the fallback problem. The 15 authored plans are the asset. Build the pilot around them, not around the 135-concept map.
