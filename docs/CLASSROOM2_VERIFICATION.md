# OpenMind Classroom 2.0 — End-to-End Verification

**Status: the five capabilities are implemented and locally verified against isolated stores.**

Run date: 2026-11-03. No commit, push or deployment was made. No production learner store was written to. No real educator approval was created; the only approvals used were the existing test-only fixture (`OPENMIND_TEST_CONTENT_APPROVALS=1`), in an isolated development process, and `PILOT_APPROVALS` remains empty.

## 1. What changed

| Capability | Starting point | Delivered |
| --- | --- | --- |
| Teacher sign-in | The console existed, but the teacher landing links lost `/teacher` as the return target. | The form, session, refresh and return path are exercised with real input; the teacher links now preserve `/teacher`. |
| Cross-device sync | Same-account access existed at the API level; no two-browser proof. | Two independent Chrome profiles read and write the same server-authoritative record; the live room is also proved from a third device. |
| Assignments | Publication gate existed; delivery and monitoring lacked browser evidence. | Targeted, partial, scheduled, closed/republished and replayed work is covered by API and browser suites. |
| Live classroom | Not implemented. | Persisted, versioned `ClassroomSession`; owner-only controls; membership-checked joins; idempotent submissions; SSE snapshots; pause/resume/end. |
| Offline learning | Not implemented. | Authored-lesson packs, learner-scoped drafts and queue, service worker, explicit local-only/syncing/synced states, and idempotent `/api/evidence` replay. |

## 2. Implementation map

### Authentication and identity

- `app/api/auth/login/route.ts`, `app/api/auth/signup/route.ts`, `lib/server/auth.ts` — real account sessions and capability secrets.
- `app/onboarding/page.tsx` — the actual teacher/pupil form and redirect.
- `app/teacher/page.tsx` — teacher landing links preserve `/teacher` as the return target.
- `lib/server/authority.ts`, `lib/server/class-membership.ts` — teacher authority is account-based; membership is identity-based.

### Cross-device learner state

- `lib/server/transaction.ts` — one learner transaction per write.
- `lib/server/evidence.ts`, `lib/server/projection.ts` — append-only evidence and deterministic projection.
- `lib/api/client.ts` — the single client operation seam used by the new pages; it also keeps credentials out of URLs where the operation does not require them.

### Assignments

- `app/api/assignments/route.ts` — create/publish/close, targeted work, deadlines, release time and the review gate.
- `lib/server/assignment-view.ts` — derives completion and accuracy from each learner’s ledger, never from a stored counter.
- `app/teacher/page.tsx` — teacher Work tab and monitor.

### Live classroom

- `lib/types.ts` — `ClassroomSession`, participants, submissions and the public view type.
- `lib/server/classroom.ts` — persisted room store and atomic session transitions.
- `lib/server/classroom-access.ts` — teacher owner/member authorization.
- `app/api/classroom/route.ts` — start/join/publish/submit/pause/resume/end state machine.
- `app/api/classroom/stream/route.ts` — SSE snapshots of persisted versions.
- `components/live-classroom.tsx`, `app/classroom/page.tsx` — teacher controls and pupil surface.
- `lib/server/store.ts` — store-owned classroom JSON accessors (routes do not name store files).

### Offline learning

- `app/api/offline-pack/route.ts`, `lib/offline-pack.ts` — approved authored lesson pack and local marking keys.
- `app/offline/study/page.tsx` — download, local answer, honest status and replay.
- `lib/sync-queue.ts` — learner-scoped queue with idempotent submission ids.
- `public/sw.js` — production service worker.
- `lib/client.tsx`, `components/offline-bar.tsx` — session handover/clearing and status display.

## 3. Verification results

All commands were run in this checkout against isolated scratch stores. `npm run verify` is the source of truth for its suite; its total moves with content changes, so the failure list, not the total, is the meaningful result.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **0 errors** |
| `npm run build` | **success** (production build, including standalone output) |
| `npm run verify` | **4555 passed, 0 failed** |
| `npm run verify:classroom2` | **33 passed, 0 failed** |
| `npm run verify:auth-boundaries` | **19 passed, 0 failed** |
| `npm run verify:auth-sync` | **36 passed, 0 failed** |
| `npm run verify:ui:teacher` | **27 passed, 0 failed** |
| `npm run verify:assignment-browser` | **29 passed, 0 failed** |
| `npm run verify:assignment-lifecycle` | **33 passed, 0 failed** |
| `npm run verify:live-browser` at 390×844 | **26 passed, 0 failed** |
| `npm run verify:offline-browser` | **25 passed, 0 failed** |
| `npm run verify:classroom-restart` | **46 passed, 0 failed** |
| `npm run verify:permissions` | **87 passed, 0 failed** |

The feature/security suites above report **361 checks** in total (some checks deliberately overlap).

## 4. Browser evidence

### Teacher and pupil authentication

- A signed-out Chrome opens `/onboarding?mode=signin`, types the email and password into the real fields, and clicks the real **Sign in** button.
- The walk asserts that a `POST /api/auth/login` request was sent and that the signed-in teacher step appeared; no cookie or session was injected.
- The teacher console is reached at `/teacher`, refreshed, and the same account remains signed in.
- Pupils sign in and complete enrolment in separate browser processes.
- The auth-boundary suite covers empty fields, unknown accounts, wrong passwords, returned return paths, expiry/recovery, sign-out, pupil denial, and cross-teacher/cross-class refusals.

### Cross-device state

- `verify-auth-sync` uses two independent Chrome processes with separate profiles, cookies, local storage and session storage.
- Device A answers; Device B signs in independently and reads the same server record; Device B answers and Device A sees the result.
- The live walk signs the same pupil into a third browser and shows the submission made in the first browser.
- The persisted record, not the browser cache, is the source of truth: the suite reads the server ledger and membership records.
- The assignment lifecycle suite sends two answers for the same learner concurrently; both are accepted, both receive distinct ledger ids, and neither overwrites the other.

### Assignments

- Unapproved work (`quadratics`) is refused before any assignment is stored.
- The isolated test-approved lessons (`fractions`, `negatives`) can be published; this does not modify `PILOT_APPROVALS`.
- A targeted two-concept task reaches only the named pupil; the other pupil does not receive it.
- After one of two concepts, the work is **partial**, not complete; the outstanding concept is named in both the pupil view and teacher monitor.
- A retry records a second answer; replaying the same submission id is a duplicate and adds no evidence.
- A past deadline is refused; a scheduled task is hidden before release and appears after it.
- Closing work withdraws it from the pupil; republishing the same record restores it.
- The teacher can open the learner’s evidence drawer and read the actual recent responses with their server-decided verdicts.
- The browser walk additionally proves delivery of one task to two pupils, A completing it, B remaining outstanding, and the teacher’s monitor deriving different states from the two ledgers.

### Live classroom

- The teacher signs in through the form, opens the class, starts a room and publishes a reviewed `fractions` activity.
- Two independent pupil browsers join before publication; both receive the activity without navigation or manual refresh.
- Pupils answer through the rendered options; the teacher sees participation and submitted counts without reloading.
- Pause and end reach both pupil screens through the SSE stream.
- A refresh of the teacher page leaves the room and results intact.
- A third browser signs in as the same pupil and sees that pupil’s recorded submission.
- The API suite covers late join, duplicate submission id, a different second answer refused as `already_submitted`, paused/ended submission refusals, non-member join refusal, second-teacher control refusal, and owner resume/end.
- The mobile pass runs the same journey at an actual 390 px viewport and asserts that the teacher’s live room and published activity do not scroll sideways.

### Offline learning

- The pupil signs in normally, downloads an authored Fractions pack, and the production service worker controls the page.
- Network is disabled; Chrome is closed and reopened with the same profile. The cached lesson opens, the answer is stored locally, and the UI says **Working offline** and **local only**, not synced.
- Network returns; the queued answer drains through `/api/evidence`, the UI says **Synced** only after the server answers, and the server ledger holds exactly one event.
- Replaying the same submission is a duplicate and adds no second event.
- Sign-out removes that learner’s packs, draft and queue.
- This is deliberately a selected authored activity, not a claim that the whole product is offline-capable.

## 5. Persistence and restart

`verify-classroom-restart` starts its own dev server with a scratch store and a disposable `NEXT_DIST_DIR`, creates one teacher, three pupils, a class, a test-approved two-concept assignment and a live fractions activity, then:

1. reads the actual files on disk;
2. stops the server process;
3. starts a genuinely different process on the same data directory;
4. signs all four accounts in again;
5. re-reads the class, assignment monitor, live session and ledgers.

Observed before and after the restart:

- `classes.json` still contains the assignment and join code.
- `classroom-sessions.json` still contains the session, activity and pupil submission.
- `accounts.json` still contains all four accounts.
- `evidence/<learnerId>.jsonl` still has exactly one accepted event for the submitting pupil.
- The teacher’s monitor is unchanged, including the complete/outstanding distinction.
- The live room keeps its id, version, prompt and participant counts.
- The same submission replay after restart is a duplicate; the ledger still has one event.
- The owner can still end the restarted room; a pupil’s later submission is refused with `session_ended`.

The drill snapshots and restores `tsconfig.json` and `next-env.d.ts`, so a passing run leaves the generated-file tree as it found it.

## 6. Security and failure behaviour observed

| Case | Observed result |
| --- | --- |
| Empty, unknown or wrong credentials | Refused; no session established. |
| Student opens `/teacher` or tries a teacher-only action | Refused by the server, not merely hidden in the UI. |
| Teacher tries another teacher’s class/assignment | Refused. |
| Pupil outside a live class tries to join | `403 not a member`. |
| A second teacher tries to control the room | `403 not_session_owner` / not the teacher. |
| Submissions after pause/end | `409 submissions_paused` / `409 session_ended`. |
| Different second answer to one live activity | `409 already_submitted`; first answer is not overwritten. |
| Same submission id replayed | Duplicate; exactly one ledger event. |
| Two concurrent answers for one learner | Both accepted with distinct event ids; no lost write. |
| Unapproved lesson assigned | `400` naming the review state; no assignment record created. |
| Past deadline | `400 due date must be in the future`. |
| Offline queue while disconnected | Local-only status; no false “Synced”. |
| Sign-out on a shared device | Local packs, drafts and queue cleared for that learner. |
| Expired session | Recovery is required; no silent privileged continuation. |

## 7. Reproduce locally

```bash
npm ci
npm run typecheck
npm run verify
npm run build
```

Development server with the test-only approval fixture (scratch store):

```bash
OPENMIND_DATA_DIR=/tmp/openmind-classroom-dev \
OPENMIND_TEST_CONTENT_APPROVALS=1 \
OPENMIND_ALLOW_EPHEMERAL_STORE=1 \
npm run dev
```

Production service worker server for the offline walk (scratch store, no test approvals):

```bash
OPENMIND_DATA_DIR=/tmp/openmind-classroom-prod \
OPENMIND_ALLOW_EPHEMERAL_STORE=1 \
OPENMIND_TEST_CONTENT_APPROVALS=0 \
npx next start -p 4174
```

Then, in another terminal:

```bash
npm run verify:classroom2
npm run verify:auth-boundaries
npm run verify:auth-sync
npm run verify:ui:teacher
npm run verify:assignment-lifecycle
npm run verify:assignment-browser
npm run verify:live-browser
OPENMIND_VIEWPORT_WIDTH=390 OPENMIND_VIEWPORT_HEIGHT=844 npm run verify:live-browser
OFFLINE_BASE=http://127.0.0.1:4174 npm run verify:offline-browser
npm run verify:classroom-restart   # starts its own server on 4177
npm run verify:permissions
```

The browser commands use `CHROME_BIN` or Chrome’s standard macOS path. `verify:classroom-restart` does not need either server to be running.

## 8. CI

`.github/workflows/classroom2.yml` runs on pull requests, pushes to `main`, and manual dispatch. It:

- typechecks and runs the engine gate;
- builds the production artefact;
- starts a development server with the test-only approval fixture and a separate production server with approvals explicitly off;
- runs the API, auth, assignment, teacher, live, mobile, restart and offline suites;
- uploads both server logs as evidence, including on failure.

The workflow is validated as YAML but **has not been executed by GitHub from this checkout**. No commit or push was made, so this is a reproducible job definition, not a claim of a green remote run.

## 9. Deliberate limitations and blocked acceptance

1. **Real educator approval is still required for a real class.** `PILOT_APPROVALS` remains empty. The approved test lessons exist only in the isolated dev fixture; they do not represent a real teacher’s review. A real publication still needs the genuine approval workflow.
2. **Offline support is selected authored content.** The verified pack is the Fractions lesson. This does not prove that every lesson, simulation, tutor call or paper works offline.
3. **The restart is a local process restart on the same file-backed store**, not a host redeploy or a persistent managed database. The local production server was deliberately started with `OPENMIND_ALLOW_EPHEMERAL_STORE=1` because it used a scratch directory; that is not a durability claim for a deployed host.
4. **Two independent Chrome processes, not two physical devices.** They have separate profiles, cookies, localStorage and sessionStorage, but run on one machine. The mobile pass uses CDP device metrics at 390×844, not a physical phone.
5. **Staging acceptance was not run.** No isolated staging URL, independent staging accounts and persistent test database/volume were supplied. It must not be simulated against production. A staging run should use a separate deployment with a persistent store, independent teacher/pupil accounts, and either a genuinely approved pilot lesson or the test-only fixture enabled only on that isolated instance; then run the same suites with `OPENMIND_BASE` / `LIVE_BASE` / `ASSIGNMENT_BASE` / `UI_WALK_BASE` / `OFFLINE_BASE`, and perform `verify:persistence --write`, restart the deployment, then `--verify`.
6. **`npm run production-check` was not run.** A production build and the two running servers were exercised, but the full deployment checklist (two builds plus static bundle) was outside this run. It remains an explicit environment/verification gap.
7. **Test data was isolated and removed.** All fixture emails use `@example.test`; no real `.openmind-data` file was written. The scratch servers were stopped and their temporary stores removed after this report was produced.

## 10. Release checklist

| Item | Status |
| --- | --- |
| Teacher sign-in | Verified in browser and auth suites |
| Pupil sign-in / enrolment | Verified in browser suites |
| Cross-device sync | Verified with independent browser processes |
| Assignment publication | Unapproved refusal and test-approved publication verified |
| Assignment completion | Complete, partial and outstanding states verified |
| Live classroom | Teacher control and pupil SSE updates verified |
| Live recovery | Late join, duplicate, pause/end, refresh and restart verified |
| Offline work | Network-disabled browser with close/reopen verified |
| Offline synchronisation | One accepted event, duplicate replay, sign-out clearing verified |
| Restart recovery | Accounts, class, assignment, live room and evidence verified |
| Security | Auth boundaries and permission suites pass |
| Mobile | 390 px live journey with no horizontal overflow verified |

The one item that cannot be marked from this environment is **separate staging acceptance with a persistent hosted database**; the workflow and procedure are present, but no staging credentials or host were available.