# Screenshots

One PNG of every page in the app, captured with a real browser driving the real
dev server (Chromium via the repo's own CDP harness, `scripts/browser.mjs`).

| File | Page |
|---|---|
| `01-landing.png` | `/` — a first-time visitor, no learner on the device |
| `02-about.png` | `/about` |
| `03-help.png` | `/help` |
| `04-access.png` | `/access` — language, terms, explanation length, board |
| `05-account.png` | `/account` |
| `06-curriculum.png` | `/curriculum` — the course and tier the learner actually sits |
| `07-diagnostic-maths.png` | `/diagnostic/maths` — baseline diagnostic, first question |
| `08-dashboard.png` | `/dashboard` — next step, evidence, recent answers |
| `09-learn.png` | `/learn` — every subject |
| `10-learn-maths.png` | `/learn/maths` |
| `11-learn-physics.png` | `/learn/physics` |
| `12-learn-chemistry.png` | `/learn/chemistry` |
| `13-learn-biology.png` | `/learn/biology` |
| `14-learn-computing.png` | `/learn/computing` |
| `15-learn-concept.png` | `/learn/maths/quadratics` |
| `16-mind.png` | `/mind` — the knowledge map |
| `17-mind-concept.png` | `/mind/quadratics` |
| `18-progress.png` | `/progress` — evidence, misconceptions, mastery per concept |
| `19-mistakes.png` | `/mistakes` |
| `20-papers.png` | `/papers` — exam papers |
| `21-projects.png` | `/projects` |
| `22-rooms.png` | `/rooms` — study rooms |
| `23-solve.png` | `/solve` — the anonymous "stuck on a question" wedge |
| `24-try.png` | `/try/quadratics` |
| `25-tutor.png` | `/tutor/quadratics` |
| `26-genome.png` | `/genome` — the knowledge graph |
| `27-kiosk.png` | `/kiosk` — a shared handset asking for a class code and PIN |
| `28-offline.png` | `/offline` |
| `29-hub.png` | `/hub` — the local-Wi-Fi hub counts |
| `30-onboarding.png` | `/onboarding` — step 1 of 3, as a new learner sees it |
| `31-teacher.png` | `/teacher` — a teacher account holding one class |
| `32-hub.png` | `/hub` — the same hub as the teacher sees it, with their class |

## How these were taken

- Viewport 1440 × 900, capture 1×, full page up to 6000 px tall.
- A page counts as **settled** only when `<main>` holds real content, no
  `.skeleton` is on screen and **no bare `Loading…` line survives anywhere
  inside `<main>`** — tested per line, not against the whole page. Before that
  test the rule required the ENTIRE page to read `Loading…`, so a heading that
  had rendered over a panel that had not passed as settled: three committed
  frames were photographs of pages mid-load (`/solve` without its stylesheet,
  `/try` and the concept page showing `Loading…`). The comparison of successive
  polls is digit-insensitive, because the concept page's session clock ticks and
  its text would otherwise never repeat.
- Every route is visited once and thrown away before the pass that saves frames,
  so the first-request compile (measured: `/try` takes ~4.5 s cold because it
  compiles `/api/profile` and `/api/progress`) is never on the capture's clock.
- The learner behind most of them is a seeded **GCSE Higher, Year 10** profile
  studying all five subjects, who sat the mathematics baseline diagnostic and a
  dozen practice questions — so `/dashboard`, `/progress` and `/mistakes` show
  evidence rather than empty states.
- `/teacher` and `32-hub` are a separate **teacher account** with one class
  created through the API; the rest are that learner's own pages.
- Everything ran against a throwaway `OPENMIND_DATA_DIR` in `/tmp`. No real
  learner record was read or written to produce these.
