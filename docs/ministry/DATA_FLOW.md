# Data flows — what moves, where it stops, and what leaves the device

**Status: DRAFT, describing the committed code.** Every flow names the route, the
module and the file it lands in, so an operator can trace a record without
reading the repository. Where a flow crosses the device boundary it is marked
**LEAVES DEVICE**; where it does not, the data stays inside `OPENMIND_DATA_DIR`
(`lib/server/store.ts`).

The single-sentence version: **a learner's record never leaves the deployment's
store except when an operator exports it, and the only outbound service is an AI
provider the deployment chooses to enable.**

---

## 1. The map

```
                         ┌──────────────────────────────────────────┐
                         │              DEVICE (browser)            │
                         │                                          │
                         │  localStorage:                           │
                         │    openmind:profileId                    │
                         │    openmind:profileSecret                │
                         │    openmind:sync-queue   (≤200 answers)  │
                         │    openmind:sync-refused (≤20)           │
                         │    openmind:lang, :access, :teaching …   │
                         │  Cache API: visited pages (never /api/*) │
                         └───────────────┬──────────────────────────┘
                                         │  HTTPS (cookie or ?secret=)
                                         ▼
        ┌────────────────────────────────────────────────────────────────┐
        │  NEXT SERVER — the only process that can read the store        │
        │                                                                │
        │  auth  ──► accounts.json         (email, scrypt hashes)        │
        │  profile / progress / diagnostic ──► profiles.json             │
        │  grading ──► evidence/<learnerId>.jsonl  (append-only)         │
        │  classes / assignments ──► classes.json                        │
        │  personal papers ──► personal-papers.json                      │
        │  staged papers ──► papers.json                                 │
        │  packs / rooms ──► packs.json, rooms.json                      │
        │  interventions ──► interventions.json                          │
        │  erasure ──► erasures.json  (+ removal from the files above)   │
        │  AI cache ──► ai-cache.json                                    │
        │  sessions ──► session-secret                                   │
        └───────┬──────────────────────────────┬─────────────────────────┘
                │                              │
                │ operator only                │ only if an AI key is set
                ▼                              ▼
   ┌────────────────────────┐      ┌──────────────────────────────────┐
   │ backup archive         │      │ AI provider endpoint             │
   │ + erasures.json        │      │ (Gemini / OpenAI / Groq /        │
   │ (restore re-applies    │      │  OpenRouter / custom)            │
   │  the erasure log)      │      │ **LEAVES DEVICE + DEPLOYMENT**   │
   └────────────────────────┘      └──────────────────────────────────┘
```

---

## 2. Enrolment — creating a learner

`app/onboarding/page.tsx` collects country, language, subjects, course, year and
an optional handle, then calls `POST /api/profile` (`app/api/profile/route.ts`).

| Step | Code | Stored | Notes |
|---|---|---|---|
| Build the profile | `lib/learner-profile.ts#newProfileState` | `profiles.json` | a capability secret is minted with it (`ProfileState.secret`) |
| Validate the course | `lib/specifications.ts#courseForSubject` | — | a tier is never inferred from a grade unless the qualification has one tier |
| Write | `lib/server/store.ts#saveProfile` | `profiles.json` | under the profile lock |
| Account path | `POST /api/auth/signup` (`app/api/auth/signup/route.ts`) | `accounts.json` + `profiles.json` | mints the recovery code |
| Device | `lib/api/identity.ts` | localStorage: profile id, secret | **stays on device** |

Leaves the device: nothing beyond the enrolment answers themselves. No email is
required for a teacher-created or guest profile.

---

## 3. Sign-in and sessions

| Step | Code | Stored | Notes |
|---|---|---|---|
| Verify password | `lib/server/auth.ts#passwordMatches` | reads `accounts.json` | scrypt, per-account salt, constant-time compare |
| Mint cookie | `lib/server/auth.ts#createSessionToken` | — | payload `accountId.epoch.expiry.hmac`; 60 days (`SESSION_DAYS`) |
| Sign out | `POST /api/auth/logout` | `accounts.json` | bumps `sessionEpoch`; every outstanding token dies |
| Recovery | `POST /api/auth/recover` | `accounts.json` | password replaced, sessions revoked, code rotated |
| Teacher grant | `POST /api/auth/reset-grant` | `accounts.json` | 15 minutes, single use, issued only by `isTeacherOf` |

Leaves the device: the email and password, over HTTPS. The cookie is
`HttpOnly`, `SameSite=Lax`, and `Secure` when served over HTTPS.

---

## 4. A practice answer — the core loop

| Step | Route | Code | Writes |
|---|---|---|---|
| Serve | `POST /api/progress {action:"serve"}` | `lib/questions.ts#generateQuestionNear` (40 draws) | `profiles.json` (the staged question for this concept; item exposure lives in `seenQuestions`, written by the diagnostic) |
| Mark | `POST /api/progress {action:"answer"}` | `app/api/progress/route.ts` | `evidence/<id>.jsonl` (one `answer_submitted` event) |
| Project | inside the same transaction | `lib/server/projection.ts#projectFromLedger` | derives the model; `profiles.json` |
| Read | `GET /api/evidence`, `GET /api/evidence-summary` | `lib/server/projection.ts` | — |

The event carries the concept, question id, correctness, chosen index or typed
value, hint count, mode, marks, milliseconds, misconception tags, the learner's
certainty statement and — for work that arrived from a device — the device's own
claimed time (`deviceAt`). It never carries question text, and the server's clock
stamps `at`.

Leaves the device: the answer and its metadata, once, to the deployment's own
server. Nothing is forwarded onward.

---

## 5. Offline answers and the sync queue

| Step | Code | Where |
|---|---|---|
| Answer while offline | `lib/sync-queue.ts#postAnswer` | `localStorage: openmind:sync-queue` — the exact body the online path would send, plus a client `submissionId` and `deviceAt` |
| Cap | `MAX_HELD = 200` | a full queue **refuses** the new answer visibly; it never evicts an older one |
| Flush | `flushQueue` (`components/offline-bar.tsx`) | `POST /api/progress`, one at a time, in the device's own order |
| Deduplicate | `lib/evidence.ts#submissionEventId` | the event id is **derived from the submission token**, so a replay is a no-op rather than a second answer |
| Disclose | `lib/evidence.ts#isDeviceReported` | the learner's own pages mark the answer as recorded offline |

Leaves the device: the queued answers, when connectivity returns. Until then they
are unencrypted in browser storage on that device — a fact the deployment's
device policy must cover.

---

## 6. Diagnostic sitting

`POST /api/diagnostic` (`app/api/diagnostic/route.ts`) serves a tiered probe,
stores the sitting on the profile, and writes `diagnostic_completed` to the
ledger. Servable items are recorded in `ProfileState.seenQuestions`, so a
measuring pool cannot re-serve one (the same item cannot mean "you remembered"
where it meant "you improved"). The estimate of sitting length is computed
server-side and never mutates the sitting.

Leaves the device: the answers, as in §4.

---

## 7. Teacher reading a class

| Step | Route | Code | Reads |
|---|---|---|---|
| Class list | `GET /api/classes` | `lib/server/store.ts#listClasses` | `classes.json` |
| Monitor | `GET /api/classes?id=…` | `lib/server/class-view.ts#resolveMembers` + `deriveLive` | `classes.json` (identity) and each member's ledger, aggregated |
| Set work | `POST /api/assignments` (`app/api/assignments/route.ts`) | `lib/server/interventions.ts` | `interventions.json` — one record per learner per set task |
| Edit the class | `POST /api/classes {action:"update"}` | `lib/server/store.ts#updateClassById` / `#updateClassByCode` | `classes.json` — the roster and its name, never a learner's evidence |

A teacher receives aggregates derived from ledgers — completion, accuracy,
weakness, misconception counts — and never the event stream, never an account
email. The rule is one function (`isTeacherOf`,
`lib/server/class-membership.ts#isTeacherOf`), and it is asserted over HTTP in
`npm run verify:permissions`.

Leaves the device: the teacher's request to the deployment's own server.

---

## 8. The AI tutor — the one flow that leaves the deployment

| Step | Code | Detail |
|---|---|---|
| Grounding | `lib/server/tutor.ts#tutorGroundingFor` | concept, the decision and its reason, cited evidence **ids**, measured counts, misconception names, course/board/tier, language |
| Packet | `lib/tutor-context.ts#tutorGroundingPacket` | the learned text the provider receives; **no name, handle or email** |
| Send | `lib/llm.ts` | to `endpointFor(provider)` — Gemini, OpenAI, Groq, OpenRouter, or `OPENMIND_AI_BASE_URL` |
| Fallback | `lib/llm.ts#llmTutorReply` → offline engine | four failure modes: `no_key`, `provider_error`, `timeout`, `malformed` |
| Disclose | `lib/tutor-context.ts#disclosureKey` | the learner is told which system answered, in all 15 languages |

Leaves the device **and the deployment**: the learner's own typed message, the
concept, and the counts above. A deployment that enables no AI key sends nothing;
`GET /api/ai` reports the state. The learner's free text is the part that can
carry identifying detail, which is why the school must tell learners not to type
names and why the DPIA treats AI as a per-deployment decision.

---

## 9. Export — the only way a record leaves as a file

| Export | Route | Contents | Audience |
|---|---|---|---|
| QTI 2.2 | `GET /api/export/qti?concept=…&limit=…` | authored items, no learner data, explanation deliberately excluded | public |
| CASE 1.1 | `GET /api/export/case?spec=…` | the course's concepts and prerequisites | public |
| OneRoster 1.2 | `GET /api/export/oneroster?class=…` | roster: handles, roles, enrolments; **email column empty on every row** | the class's teacher only (`isTeacherOf`) |
| Learner's own data | `GET /api/my-data` | profile, ledger, sittings, personal papers | the learner, capability-gated |

Leaves the deployment: only when the operator hands the file to someone. The
roster is marked `private, no-store` so a shared cache cannot re-serve it to a
different teacher.

---

## 10. Erasure

`DELETE /api/profile?id=…&confirm=ERASE` (`app/api/profile/route.ts`) calls
`lib/server/erasure.ts#eraseLearner`, in one order, for one reason:

```
1. record the instruction   → erasures.json        (the journal a restore reads)
2. remove the ledger        → evidence/<id>.jsonl
3. remove personal papers   → personal-papers.json
4. remove class membership  → classes.json
5. remove the record        → profiles.json
6. verify the record is gone, then mark it finished → erasures.json
```

If a step fails the erase is not reported as done: the instruction is on disk, so
a retry completes it. The account itself is **kept** (email and password), which
is a deliberate two-step — the record is gone, the sign-in is not.

Leaves the deployment: nothing. The one exception is an archive taken before the
erase; see §11.

---

## 11. Backup and restore

| Step | Tool | Detail |
|---|---|---|
| Backup | `npm run backup` | copies the store directory; `--max-age-days 90` destroys older archives |
| Carry the log | operator | `erasures.json` travels beside the archive — a recovery on hardware with no live store has nothing else to re-apply |
| Restore | `npm run restore-drill` | materialises the archive into a scratch directory, re-applies the erasure log (step 3b), then boots the copy and checks it over HTTP |
| Undo | — | archives are immutable; an erased learner is re-erased at restore time, never edited out of an archive |

Leaves the deployment: the archive, wherever the operator stores it. That location
is the deployment's decision and belongs in the DPIA.

---

## 12. The offline shell

`public/sw.js` caches visited pages and their assets; **it never caches `/api/*`**
— grading and diagnostics are live-only, so a cached answer cannot become a lie.
When nothing is cached and the network is gone, a navigation falls back to the
cached `/offline` plan. The cache lives on the device and is not encrypted; it
holds rendered pages, not another learner's data, because the store is the only
place learner records live.

---

## 13. Summary table — what leaves the device

| Flow | Destination | Leaves? |
|---|---|---|
| Enrolment, sign-in, recovery | deployment's own server | yes, to the deployment only |
| Practice answer, diagnostic | deployment's own server (or the device's queue) | yes, to the deployment only |
| Offline queue | localStorage, until flushed | stays on device |
| Teacher class read | deployment's own server | yes, to the deployment only |
| AI tutor | external provider, if a key is configured | **yes, outside the deployment** |
| Exports | the operator's chosen recipient | **yes, by operator action** |
| Backup archive | the operator's chosen storage | **yes, by operator action** |
| Erasure | deployment's own store | no |

---

## 14. What this document does not establish

It does not establish where `OPENMIND_DATA_DIR` physically sits, whether the host
encrypts it, which AI provider (if any) a deployment enabled, or what an operator
does with an archive. Those are deployment decisions, and the DPIA
(`docs/ministry/DPIA.md` §7) is where they must be recorded.
