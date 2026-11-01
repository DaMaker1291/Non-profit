# Low-Resource Readiness

## 1. What was measured, and on what

- Production build (`next build`, exit 0), served by `next start` on port 4173 on the audit machine.
- Chrome layout measurements at **1280×900** and **320×640** for the 15 authored lessons (`scripts/lesson-walk.mjs`, CDP).
- First-load JavaScript for `/learn/maths/fractions`, parsed from the served HTML and gzip-compressed locally.
- Service worker and offline-pack source inspection.
- **Not measured:** a real low-end Android device, 2G/3G throttling, memory pressure, battery, screen reader, touch-only input, shared-device concurrency.

## 2. Payload

| Asset | Raw | Gzip |
|---|---:|---:|
| All 15 scripts referenced by the lesson route | **3,212,647 B (3.21 MB)** | **1,034,600 B (1.03 MB)** |
| Largest single chunk | 1,716 KB | **563 KB** |
| Second chunk | 628 KB | 212 KB |
| HTML shell | 20.5 KB | — |
| Total `.next/static` | 3.7 MB | — |
| Published static twin (`docs/`) | 8.6 MB | `openmind.html` 3.9 MB, `app.js` 111 KB |

The lesson route is not a light page. On a nominal 2G connection (≈250 kbps effective), 1.03 MB of compressed JavaScript is roughly **35 seconds** of transfer before rendering, before TLS/connection overhead and before any API call. On a congested 3G link it is several seconds. This is a measurement of bytes, not a claim about a specific school's link, but it is the right order of magnitude for the target context.

Why it is heavy: the lesson page imports the question engines (`lib/questions.ts`, `questions-deep.ts`, `questions-senior.ts`, `numeric-items-core.ts`) into the client bundle. The figures are inline SVG (good — no image downloads), and fonts are local (good), but the question bank is the payload.

**The lesson route loads the question-bank chunks in its first-load payload.** A learner who only wants to read a lesson still downloads the generators for practice.

## 3. Device and layout

- **320 px:** all 15 authored lessons were measured at 320×640; none scrolls sideways (320 vs 320), figures fit (e.g. 258 px inside 320), labels stay at 12–13 px and do not collide. This is a genuine strength and was verified in a browser, not inferred.
- **Touch:** the fraction model uses native range inputs, which are touch-operable; no drag-only canvas. The rest of the lesson is text and buttons.
- **Shared devices:** a kiosk mode and device roster exist (`app/kiosk`, `components/device-learners.tsx`, `lib/device-roster.ts`), with per-learner capability secrets. Not tested in this audit.
- **Memory:** not measured. A 3.2 MB raw JS route on a 1 GB Android device is a risk, not a proven failure.
- **Older browsers:** Next.js 16 targets modern browsers; no legacy build or polyfill strategy was verified.

## 4. Network and offline: the critical distinction

`public/sw.js` is **network-first with cache fallback**:

- caches visited pages and their assets;
- **never caches `/api/*`** — by design, because "a cached answer would be a lie";
- falls back to cached `/offline` and `/` when the network fails;
- returns a plain 503 message if nothing is cached.

`app/api/my-pack/route.ts` exports a personal pack containing:

- the learner's plan/next actions;
- **touched** concepts' title, blurb and the genome `lesson` paragraph;
- mastery, prerequisites, weak areas, decision provenance.

It does **not** contain:

- the authored plan's objective, intuition, idea paragraphs, traps, figure or worked example;
- any question, answer key or explanation;
- a way to mark an answer offline (answers are queued and synced later; grading is server-side).

Therefore:

| Learner need | Offline behaviour |
|---|---|
| Re-read a page already visited | **Works** (service worker cache) |
| Read the downloaded plan snapshot | **Works** (`/offline`) |
| Read the full authored lesson offline | **Only if the page was visited and cached**; the pack itself carries only the genome paragraph |
| Receive a new practice question | **Fails** — `/api/question` is not cached |
| Get an answer marked | **Fails** — grading is server-side; the answer is queued |
| Continue a diagnostic | **Fails** — API-only |
| See progress sync later | **Works** where the sync queue is supported |

The product's own copy says "runs fully offline" and "offline printable pack". The pack is a plan and a set of paragraphs; it is not a self-contained lesson-and-assessment experience. For a school where "the internet disappears", that distinction is the whole pilot.

## 5. Persistence and recovery

- The store is a directory of JSON files (`.openmind-data`), overridable with `OPENMIND_DATA_DIR`.
- A deployment must **declare** durable storage; otherwise learner writes are refused (`store_not_durable`) unless `OPENMIND_ALLOW_EPHEMERAL_STORE=1` explicitly accepts ephemeral storage. This is the right design: a directory existing is not a store that survives a redeploy.
- The audit ran with an accepted-ephemeral scratch store; `/api/health` reported `durability: "ephemeral"`, `writesPermitted: true` only because the acceptance flag was set.
- `npm run backup` / `backup:verify` / `restore-drill` exist. **Only source inspection was performed; no backup was taken or restored in this audit.** A backup that has never been restored is a hope, not a recovery plan.
- Single-instance file store: the readiness output reports `singleInstance: true`. Horizontal scaling would need a shared store; not tested.

## 6. Accessibility

- Lesson figures: caption is the accessible text, SVG `aria-hidden`. Good pattern.
- Fraction model: `aria-label` and `aria-live` text; native inputs.
- Skip link, landmarks, visible focus styles exist in the shell.
- **Not tested:** screen reader (NVDA/VoiceOver/TalkBack), contrast ratios, 200% text resize, keyboard-only completion of a full lesson, colour-blind safety of the red/green feedback.
- No captions/transcripts for audio beyond the device's own speech synthesis; `SpeakButton` depends on installed voices, and `hasVoiceFor` hides the control if none exists.

## 7. What a low-resource pilot must measure before expansion

1. **Cold load on the actual device and SIM**: time to first lesson text, total bytes, failures. Use a real low-end Android phone, not a desktop emulation.
2. **Offline journey**: download pack → airplane mode → open lesson → answer a question → reconnect → confirm the queued answer is marked and the ledger is correct.
3. **Shared-device handover**: two learners on one handset, no data bleed, kiosk exit works.
4. **Memory/thermal**: 30-minute session on a 1–2 GB device.
5. **Screen reader**: one full lesson + one question, TalkBack.
6. **Data budget**: MB per lesson and per practice session, compared with the school's actual data plan.

## 8. Verdict

**PARTIAL.** The layout work is real: 320-px lessons do not break, figures fit, and the offline shell never shows a bare network error. But the first-load JavaScript is **1.03 MB gzip**, the question bank is not split out of the lesson route, and **offline cannot deliver new questions or marking**. On the devices and connections the product targets, those are not edge cases; they are the normal condition. Until measured on a real low-end phone and a real school connection, low-resource readiness is **not established**.
