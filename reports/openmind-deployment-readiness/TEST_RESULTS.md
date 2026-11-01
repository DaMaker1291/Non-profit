# Test Results

## Environment

- Repository: `/Users/shaurjeshbasu/Downloads/NON PROFIT`
- Branch: `main`; commit `d7d7505ab5463971a2aed5f60f5a0f5ec9237666`
- Working tree: **dirty** — 10 modified, 12 untracked entries, including uncommitted graph-plotting / structured-assessment work.
- Next.js 16.4.3, React 19.3.1.
- Audit store: `reports/.audit-tmp/store`, `OPENMIND_ALLOW_EPHEMERAL_STORE=1`, never the user's `.openmind-data`.
- Production build served with `npm run start` on port 4173.

## Commands actually run

| # | Command | Exit | Result |
|---:|---|---:|---|
| 1 | `git rev-parse HEAD` / `git status --porcelain` | 0 | `d7d7505…`; dirty tree recorded |
| 2 | `npm run typecheck` | **0** | `tsc --noEmit` clean |
| 3 | `npm run build` | **0** | Next production build completed; 27 routes emitted |
| 4 | `npm run verify` | **0** | **4,477 passed, 0 failed** |
| 5 | `npm run content-check` | **0** | 135 concepts, 135 practisable, **8 content gaps** (reported as work items) |
| 6 | `npm run verify:q` | **0** | 40,500 draws; **5/135 concepts (3.7%)** prompt-derived, 1,500 draws, **0 wrong**; **39,000 structural-only**; **0 human-reviewed** |
| 7 | `npm run gate:ceiling` | **0** | **PASS 516 / FAIL 0**; 215/215 advanced tier×subject rows reached |
| 8 | `npm run gate:options` | **0** | **PASS 34 / FAIL 0**; 64/135 concepts remain above the 35% line; `gravity-fields` 88.3%, `hormones` 82.5% |
| 9 | `npm run explain:audit` | **0** | No concept below its committed floor; examples of 7–17 word explanations remain |
| 10 | `npm run status:check` | **1** | **`audit/status.json` stale; README status table stale** |
| 11 | `npm run curriculum-gate` | **0** | 91 specs; 18 pathways with no source; **0 reviewed mappings**; 2 mappings on file; 77 concepts mapped; 1 mapping document-verified |
| 12 | `npm run pilot-pack -- --check` | **0** | Review pack current: **15 concepts, 154 items** |
| 13 | `npm run verify:render` | **1** | **"gate crashed — fetch failed"; 0 passed, 1 failed.** It starts its own server on a random port; the crash was not diagnosed further |
| 14 | `npm run verify:lesson` | **did not complete** | Chrome/CDP walk passed many assertions through the lesson order and 320-px figure checks, then **stalled at "The worked example shows the method, and the fade withholds it"** for >3 minutes at 0% CPU. No final pass/fail count. Process killed. |
| 15 | `curl` privacy probes | 0 | Cross-profile GET **401**, cross-profile POST **401**, no-secret GET **401**; `/api/question` fields only `id, conceptId, difficulty, prompt, choices` |
| 16 | `curl /api/health`, `/api/ready` | 0 | 200; `/api/ready` exposes absolute `dir` path and store modes |
| 17 | payload measurement | 0 | Learn route: **3,212,647 B raw / 1,034,600 B gzip** across 15 scripts; largest chunk 1,716 KB raw / **563 KB gzip** |

## What was NOT run, and why

| Check | Status | Reason |
|---|---|---|
| `npm run e2e` | **Not run** | Time/scope; it creates many learners and ledgers. Would be the next command to run on a scratch store. |
| `npm run production-check` | **Not run** | Two Next builds plus static bundle; AGENTS.md states its footprint is unmeasured on this checkout. |
| `npm run restore-drill` | **Not run** | Requires a backup and a booted restore; no backup was taken in this audit. |
| `npm run backup:verify` | **Not run** | No backup archive existed. |
| `npm run verify:permissions` | **Not run** | Teacher/class boundary testing remains unproven. |
| `npm run verify:ui` | **Not run** | The lesson walk was the browser priority; it did not complete. |
| Low-end Android / 2G throttle | **Not run** | No device lab available. |
| Screen reader / contrast audit | **Not run** | No assistive-technology session. |
| Full browser walk of the 120 fallback pages | **Not run** | `verify:lesson` covers only the 15 authored plans. The `addition` fallback page was inspected manually in Chrome and rendered. |

## Browser evidence

- The authored `fractions` lesson rendered real content in Chrome: objective, intuition, pie figure, fraction model, six idea paragraphs, worked example, faded example, three traps, misconception card, `Now your turn`, and the on-screen line **"Not yet checked by a subject teacher."**
- The fallback `addition` lesson rendered: heading, blurb, two-paragraph genome explanation, **a generated worked example behind "Show me how"**, and `Now your turn`. It had no objective, intuition, figure, faded second example or authored traps, and it did **not** say it was a fallback.
- Screenshots: `evidence/lesson-negative…`, `evidence/lesson-linear-equations-320.png`, `evidence/lesson-worked-1280.png`; the original set is in `screenshots/lesson-walk/`.
- **Correction made during the audit:** an early draft claimed fallback pages had no worked example. The rendered `addition` page and `app/learn/[subject]/[concept]/page.tsx:904` show that `<LessonWorkedExample>` is **not** plan-gated; only the faded second example at `:912` is. The reports and CSV were corrected.

## Test-environment notes (not product defects)

- A first browser attempt ran against `next dev` while audit logs were being written inside the project. Turbopack rebuilt on those writes, reloading the tab and destroying the CDP execution context. The audit isolated this by stopping the dev server, moving logs to `/tmp`, and serving the production build. The repeated reloads were **caused by the audit harness**, not by the product.
- `npm run start` printed: `"next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.` It still served. This is a deployment-path documentation issue.
- The audit did not modify application source, lesson content, schemas, curriculum mappings or production configuration. Only `reports/` and the isolated scratch store were written.

## Bottom line for technical readiness

The build and the engine suite are strong. The release checks that depend on a real browser, a restored backup, teacher permissions and a low-end device are **not yet proven**. A green `npm run verify` is necessary and not sufficient; this audit's own `status:check` failure is the smallest example of why.
