# Storage layer — spec and test plan

**Status: IN PROGRESS.** Slices 0, 1 and 2 are implemented and committed (the
store's single lock table and data-directory resolver; the port with the file
backend behind it; the conformance suite, five failure cases and the
`storage-check` gate — the failure cases found and fixed a **silent data-loss
defect** in the ledger's append, §4). Everything
else below is still specified rather than built, and says so. Every acceptance
criterion names the command that proves it, so "implemented" is a claim a reviewer
can check instead of take on trust.

Owner decisions this follows: the storage layer is the first item chosen from the
"can be finished in software" list, because it is the one limit that invalidates
every other claim about the product — a school cannot adopt it to store real
learner data while the store is a single file rewritten per answer.

---

## 1 · What exists today, measured

**Every number in this table is derived by `npm run status`** (see the Storage
rows of `audit/status.json`), not typed here — the count of route files importing
the store changed from 19 to 20 the day slice 0 gave `app/api/hub-status` an
import, and a spec that owned its own copy of that number was wrong within the
hour. The first draft of this table was, in fact, wrong in four places.

| Thing | Where | Measured |
|---|---|---|
| The file store | `lib/server/store.ts` | 381 lines, **33 export statements** (27 async functions, 3 sync, `DATA_DIR` and `locks`, and one re-export) |
| Call sites | **20** files under `app/api/**` import from `@/lib/server/store` | `progress` alone calls `updateProfile` **8 times** |
| Data files | the store, the ledger, accounts, erasures, interventions | **10 JSON files**, plus `<data>/evidence/*.jsonl` (one ledger per learner) and `session-secret` |
| The lock primitive | `lib/server/store.ts:31` **and** `lib/server/auth.ts:80` | **two independent lock tables** |
| The data directory | `store.ts:22`, `auth.ts:20`, `app/api/hub-status/route.ts:6` | **three resolvers** of `OPENMIND_DATA_DIR` |
| The ledger | `lib/server/evidence.ts` | one JSONL per learner under `<data>/evidence/`, sharing the **same** lock table as the store, on purpose |
| The relational schema | `db/migrations/*.up.sql` | **23 tables**, paired up/down files, checksums, drift detection, and a CI job that rehearses up → verify → down → up |
| Backup / restore | `backup-store.mjs`, `restore-drill.mjs` | per-file sha256 + manifest + retention/expiry; the drill restores, **boots the artefact** and asserts `deepReconcile` per learner |
| Concurrency evidence | `scripts/race-probe.mjs` | 8 racing answers against one served question → exactly one accepted — **within one process** |

Two of those are already fixed by the first slice of this spec *(done)*: the lock
table and the data-directory resolver are each single-owner now (**1** and **1**,
both reported by `npm run status`), with a source assertion in `npm run verify`
that fails if a second copy reappears.

## 2 · The limit, stated plainly

1. **One process.** `withLock` is an in-memory promise chain. Two server
   processes over the same directory lose each other's writes, and `race-probe`
   cannot see it because it races one process. Every "the store is safe"
   measurement this project has is a single-process measurement.
2. **Whole-file rewrites.** `profiles.json` holds every learner. `getProfile`
   parses all of them; `updateProfile` rewrites all of them. An answer costs
   O(learners) work and O(learners) IO, and one learner's burst of answers
   serialises every other learner's writes on the same lock.
3. **No parity testing.** The schema is rehearsed, but no code path reads it.
   The database is a parallel artefact — a claim the deployment check states
   honestly (`DATABASE_URL is not set — the store is a directory of JSON/JSONL
   files`) and which is nevertheless a decade of distance from "runs on
   Postgres".

## 3 · The port

**Design rule: the interface is semantic, not file-shaped.** `readJson` /
`writeJson` must not appear in it. A Postgres backend has no idea what
`profiles.json` is, and an interface that leaks the file layout produces a second
backend that is a shim over the first.

**`readEvents` says "oldest first", and that is a CLOCK-order promise, not append
order.** The two are the same only until a device syncs work it did offline: then
the ledger receives events that happened BEFORE ones already written, and a
backend returning the file in the order it was written has broken the contract its
consumer (`replayModel`) depends on. The file backend now applies `orderEvents`
(the repository's one ordering rule) at the port edge. It reached that state
because the conformance suite asserted the promise rather than the layout — which
is the whole argument for one suite that every backend must pass.

```ts
// lib/server/storage.ts  (slices 1–3; this block is the target shape)
export type StoreKind = "file" | "postgres";

export interface Storage {
  readonly kind: StoreKind;
  /** Open a single learner's durable unit. See §4 for the ordering rule. */
  withLearner<T>(learnerId: string, fn: (tx: LearnerTx) => Promise<T>): Promise<T>;
  /** A learner's history, oldest first — the input to `replayModel`. */
  readEvents(learnerId: string): Promise<EvidenceEvent[]>;

  getProfile(id: string): Promise<ProfileState | null>;
  listProfiles(): Promise<ProfileState[]>;
  saveProfile(state: ProfileState): Promise<void>;
  /** Deletes the record AND records the intent to delete, in one unit. */
  eraseProfile(id: string): Promise<boolean>;

  listAccounts(): Promise<Account[]>;
  saveAccount(a: Account): Promise<void>;
  findAccountByEmail(email: string): Promise<Account | null>;

  listClasses(): Promise<ClassRoster[]>;
  saveClass(c: ClassRoster): Promise<void>;
  updateClass<T>(where: { id?: string; joinCode?: string }, fn: (c: ClassRoster) => T | Promise<T>): Promise<{ cls: ClassRoster; result: T } | null>;

  listRooms(): Promise<StudyRoom[]>;
  saveRoom(r: StudyRoom): Promise<void>;
  updateRoom<T>(id: string, fn: (r: StudyRoom) => T | Promise<T>): Promise<{ room: StudyRoom; result: T } | null>;

  listPacks(conceptId: string): Promise<StudyPack[]>;
  savePack(p: StudyPack): Promise<void>;

  saveStoredPaper(k: BuiltPaperAnswerKey): Promise<void>;
  getStoredPaper(id: string): Promise<BuiltPaperAnswerKey | null>;

  savePersonalPaper(p: PersonalPaper): Promise<void>;
  getPersonalPaper(id: string, owner: string): Promise<PersonalPaper | null>;
  listPersonalPapers(owner: string): Promise<PersonalPaper[]>;

  cacheGet(key: string): Promise<unknown | null>;
  cacheSet(key: string, value: unknown): Promise<void>;

  newId(prefix: string): string;
  joinCode(): string;
}

/** One learner, one lock, one durable unit. */
export interface LearnerTx {
  /** The profile as stored, read INSIDE the lock/transaction. */
  readonly state: ProfileState;
  /** Stage an event. Durable at commit, BEFORE the projection (§4). */
  append(event: EvidenceEvent): void;
  /** Stage the projected model. Durable at commit, AFTER the events. */
  save(state: ProfileState): void;
}
```

**Open questions the first implementation slice must settle** (each is a real
fork, and answering them in code is cheaper than arguing here):

- **Q1. Does `withLearner` own the projection write, or does the caller?** Today
  `app/api/progress` calls `updateProfile(id, state => commitAndProject(id, state, event))`
  and `commitAndProject` reaches *back into* `appendEvidence` — a route-level
  function that mutates inside another module's lock. The port should own this:
  `withLearner(id, tx => { tx.append(ev); tx.save(project(...)); })`.
- **Q2. What is the `ProfileState` for a learner with no profile row yet?** The
  file store returns `null` and the route answers 404; `newProfileState` is a
  different path. Keep that: creating is not a mutation of an existing learner.
- **Q3. Do the singleton collections (classes, rooms, packs) get their own
  transactions or the learner's?** Today they take their own lock, and a class
  write may consult profiles (`classesWithIdentity`). In Postgres this is one
  transaction over two tables; in the file backend it stays two locks taken in
  the documented order.

## 4 · Crash consistency and lock ordering

The project's rule is **WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND**, and it
is what makes a torn write recoverable: an event with no projection is
re-derivable by replay; a projection with no event is not — it is a mastery the
learner earned and the record of why has been lost.

- **File backend**: append the event (fsync'd rename), then write the projection.
  Not atomic across two files, so the ordering is the guarantee. This is
  unchanged from today.
- **Postgres backend**: one transaction containing the `evidence_events` insert
  and the `profiles`/`learner_projections` update. Atomicity is strictly stronger
  than the file backend, and **the port must not depend on either being atomic** —
  the ordering holds in both, so the same code is correct in both.
- **Locks**: file = in-process promise chain per key. Postgres =
  `pg_advisory_xact_lock(hashtext($learnerId))` for a learner and
  `SELECT … FOR UPDATE` for the singleton aggregates, taken inside the
  transaction so a crash releases them.
- **Lock order** is already documented and must survive the port:
  `profiles` → the learner's evidence file. Nothing may take them the other way
  round; the port enforces it by making the learner transaction the only way to
  hold both.
- **Two instances**: the file backend is single-process and must **say so**.
  Proposal: `OPENMIND_STORE=file` (default) refuses to start when a second
  process holds the directory — a lock file with `{pid, host, startedAt}`, checked
  at boot and released on exit; and `/api/ready` reports `store: "file",
  singleInstance: true` so an operator sees the constraint rather than inferring it.

### What the failure cases measured (slice 2)

`scripts/storage-conformance.mjs` runs five failure cases (F1–F5) beside the
happy-path walk, because the happy path is not what storage is for. They need no
database and no dev server, and they are the cheapest place in the repository to
find out whether "safe storage" is measured or merely intended. Two of them
changed the code:

- **F1 · a torn final line.** A process killed mid-append leaves a partial JSON
  object with no newline. Reading was already safe (a malformed line is skipped
  and never repaired), but the append after it was not: written straight onto the
  fragment it was spliced into the wreckage, the reader skipped the whole line,
  and the answer was **lost while `appendEvidence` reported it as accepted**.
  Worse, and this is the part the first commit message understated: **the file
  never regains a line boundary**, so EVERY answer after the crash is appended
  onto the same growing wreckage and lost the same way, each one reported
  accepted — the learner's ledger goes permanently dead, silently, and the model
  keeps rebuilding from a history that stopped growing. That is the failure a
  cheap phone produces (a process killed mid-write), and it is unrecoverable
  without the learner noticing answers vanishing.

  **Blast radius, audited rather than assumed:** `appendFileSync` appears exactly
  ONCE in the whole codebase (`lib/server/evidence.ts`) — every other store file
  is written whole via temp-file rename, which cannot tear — and the live store
  holds **0 evidence ledgers**, so no real record was ever exposed. The second
  half matters: had this checkout carried a class, every answer written after the
  first crash would have been unrecoverable and unnoticed. `lib/server/evidence.ts` now reads the file's last byte
  and writes one newline of **framing** when it ends mid-line, so the next event
  begins at a line boundary. The fragment's own bytes are never touched: this
  decides where a line starts, it does not edit history.
- **F2 · a write killed between the append and the projection** — the one window
  the ordering WRITE EVENT → REPLAY → RESPOND cannot close by itself, and so the
  case the ledger being the source of truth has to cover. Asserted in both
  directions: the interrupted learner's ledger **replays to the model the
  completed write produced** (`reconcileDeep` differences `[]`), and re-sending
  the same events reports all of them as duplicates and counts them once. The
  second half is true **only** because the route derives a stable event id from
  the device's submission token (`submissionEventId`); a caller minting a fresh id
  per attempt double-counts, which the suite measured before the fixture was
  corrected — and which is why the id derivation is now part of the assertion.
- **F3 · two processes over one directory** — the limit §2 states, measured.
  3 child processes appending **10 batches of 4 events each** = **120 events**
  appended concurrently to
  one learner's ledger: 120 present, 120 unique ids, **0 of 120 lines
  unparseable**, and the whole thing replays to one model. So `appendFileSync`'s
  `O_APPEND` is a real concurrency story for this backend at this size — measured,
  not assumed — while the in-process lock still guarantees nothing across
  processes. That is why §2 stands and why slice 4 is where it stops standing.
- **F4 · an append that cannot be written** throws, the model does **not** move,
  and no pre-ledger snapshot is taken: the invariant behind the route's
  `evidence_not_recorded` (503) with the staged question left in place.
- **F5 · an unsafe learner id** is refused rather than sanitised and creates no
  file — ids become file paths in this backend, and quietly rewriting one could
  append one learner's evidence to another's.

F1–F5 are **file-backend cases**: the port's own write path (`withLearner`) is
slice 3 and does not exist yet, so they drive `lib/server/evidence.ts` and
`lib/server/projection.ts` directly and report that as their skip reason whenever
a non-file backend is active. When slice 3 lands they move **onto the port** —
never into a second suite (§6).

## 5 · Mapping onto the schema that already exists

This is the good news the recon produced: 23 tables already model this domain,
so the port is a mapping rather than a design.

| Port operation | Existing table(s) |
|---|---|
| `withLearner`, `getProfile`, `listProfiles`, `saveProfile` | `profiles`, `learner_projections` |
| `readEvents`, `tx.append` | `evidence_events` (indexed for replay: `(learner_id, at)`, `(learner_id, concept_id, at)`, `question_id`, `tags` GIN) |
| accounts, sessions | `users`, `sessions` (with `revoked_at` and `expires_at` — the epoch revoke path maps to `revoked_at`) |
| classes, membership | `classes`, `class_members`, `assignments`, `assignment_results` |
| rooms | `rooms` |
| papers, personal papers, packs | `papers`, `personal_papers`, `packs` |
| AI sessions and audit | `ai_sessions`, `ai_audit` |
| content versioning | `content_releases` |
| offline replay | `offline_sync` |

**What the schema does NOT have, and the decision each one forces** — this is the
honest gap list, and it is short:

1. **`interventions.json` has no table.** Either add a migration, or declare
   interventions a file-only artefact and keep them out of the port. A
   recommendation: they are teacher notes about a class; they belong in the schema.
2. **`ai-cache.json` has no table.** `ai_sessions`/`ai_audit` are a session and
   audit model, not a key→value cache with a 4000-entry cap. Either a new
   `ai_cache` table with a TTL, or the cache becomes genuinely disposable
   ("a cache that is lost costs an API call, not a learner's record").
3. **`erasures.json` has no table, and this one is a real design difference.**
   The file store records erasure as an append-only **log** that a restore
   re-applies; the schema uses soft-delete columns (`deleted_at`, `revoked_at`,
   `archived_at`, `left_at`). These are not equivalent: the log survives a
   restore of a backup taken *before* the erase, the soft-delete does too — but
   only if the restore also restores the row's updated version, which a table
   dump from an older archive does not. **Decision required**: keep the erasure
   log as the authority in both backends (a `erasures` table appended inside the
   same transaction as the delete), or make restore-time re-application
   Postgres-only. Recommendation: keep the log — the drill already proves the
   property, and `docs/DATA_GOVERNANCE.md` sells it.
4. **Room messages have no table** (`rooms` only). If messages live inside the
   room row today, the port must decide whether they stay there (bounded) or get
   `room_messages`.
5. **`session-secret` is a file**, and is the one thing that must move to
   configuration/secret storage rather than a table: `lib/env.ts` already warns
   that a generated secret means "set it explicitly when running more than one".

## 6 · How parity is enforced (the part that usually rots)

A second backend that is tested with a second test suite is a second product.
So:

- `OPENMIND_STORE=file|postgres` selects the backend once, at module load.
- **One conformance suite**, `scripts/storage-conformance.mjs`, drives the port
  directly against every backend that is *configured*: it always runs the file
  backend; it runs the Postgres backend when `DATABASE_URL` is set, against a
  scratch schema it creates, migrates and drops (`scripts/migrate.mjs` already
  refuses to run against production without `--force`, so the scratch path is the
  existing `db:rehearse` machinery).
- **The whole server-module section of `npm run verify` runs twice** — once per
  backend — because `verify-engines.mjs` already compiles and requires the server
  modules (`lib/server/store.ts`, `evidence.ts`, `projection.ts`) against a temp
  `OPENMIND_DATA_DIR`. The Postgres run sets `OPENMIND_STORE=postgres` and a
  scratch `DATABASE_URL`. Same test file, two runs, and a **failure list** compare
  between them: the compare is the parity assertion, not the pass counts.
- **CI**: `ci.yml`'s existing `database` job already has a Postgres service. Add
  the conformance run and the second verify run there. The `gates` job stays
  file-only so the fast path does not need a database.

## 7 · Migration, cutover, rollback

1. **Import** — `scripts/storage-import.mjs --data <dir>` reads a file store and
   writes the equivalent rows: profiles, accounts, classes (+ members), rooms,
   packs, papers, personal papers, ai cache, erasures, and **every evidence
   ledger line in order**. Idempotent (a re-run must not duplicate an event), and
   it refuses to import into a non-empty schema without `--force`.
2. **Verify the import** — the acceptance is not "it ran": it is
   `restore-drill`-style — boot the artefact against the imported store and
   assert `deepReconcile.differences == []` and `unprojectable == null` for every
   learner that has a ledger. A learner whose model cannot be rebuilt from the
   imported events is an import bug, and it must fail loudly.
3. **Cutover** — flip `OPENMIND_STORE=postgres`. **No dual-write.** Two writers
   is the data-loss shape this project refuses everywhere else
   (`POST /api/auth/claim` refuses a 409 for exactly this reason); the honest
   version is import → verify → flip, with a documented window in which the file
   store is read-only.
4. **Rollback** — the file store is untouched by the import (it only reads), so
   rollback is flipping the variable back, plus exporting anything written since
   the cutover. That export is the one piece of real work in this section:
   `storage-export.mjs`, whose correctness is the inverse drill.
5. **What must NOT change**: the directory contract. `backup-store.mjs` and
   `restore-drill.mjs` treat `<data>/` as the unit of a deployment, and a school
   with no database must remain a supported, first-class deployment. Postgres is
   an *additional* backend, never a migration off the laptop.

## 8 · Measurement — what "under real conditions" means here

Targets, to be recorded in `audit/storage-report.json` by the gate (a target is
not a measurement; the numbers below are what the report must contain, not what
is claimed today):

| Measurement | How | Target |
|---|---|---|
| Answer-path latency, 1 learner × 10k events | `npm run bench:storage` — 200 sequential `POST /api/progress` answers at each of 100 / 1,000 / 10,000 recorded events | p95 ≤ 250 ms on both backends; the *ratio* (postgres ÷ file) recorded, not just each number |
| Loaded-store latency | same, 200 learners × 500 events in the store | file backend must stay within 3× of its empty-store p95 (it will not: whole-file rewrite is O(learners) — this number is the evidence for §2.2, so record it either way) |
| Concurrent writers, one process | `scripts/race-probe.mjs` | 11/11 on both backends |
| Concurrent writers, two processes | new: two servers on one Postgres, 8 racing answers across both | exactly one accepted, one recorded attempt |
| Restore of a 200-learner store | `restore-drill` against each backend | PASS, with the replay of every ledger |
| Size on disk | `du` of the store after the benchmark | recorded, no target — it informs the storage budget a profile may declare |

## 9 · Acceptance criteria (done means all of these)

1. `lib/server/storage.ts` defines the port; `lib/server/store.ts` becomes the
   file backend behind it, with **no route file importing `readJson`/`writeJson`**
   (a source assertion in `verify` fails on a second entry point).
2. The Postgres backend passes **the same** conformance suite and the same
   server-module section of `verify`, with a **failure-list compare** proving the
   two runs failed identically (both empty).
3. `scripts/race-probe.mjs` is green against both backends, and the two-process
   probe passes against Postgres.
4. `restore-drill` PASSes against a Postgres deployment, including
   `deepReconcile` per learner, and the erasure taken before the archive is still
   re-applied (the §5.3 decision, whichever way it is decided).
5. `npm run storage-check` exists, is wired into `production-check`, runs the
   conformance suite + the benchmarks, writes `audit/storage-conformance.json`
   (the committed record of the run, in the same shape as `audit/status.json` and
   `audit/options-gate.json`), and **skips with the reason stated** when no
   `DATABASE_URL` is present — never a pass it did not earn.
6. Multi-instance: the file backend refuses to start as a second instance, and
   `/api/ready` reports the store kind and the single-instance constraint.
7. A learner's whole history survives import → cutover → rollback:
   `deepReconcile.differences == []` at every stage, and the same mastery values
   before and after (not merely "a record exists").
8. Docs updated: `docs/DEPLOYMENT.md §5`, `docs/OPERATIONS.md` (backup of a
   Postgres deployment), `docs/DATA_GOVERNANCE.md` (§5.3's erasure decision), and
   `audit/status.json` gains the store kind as a reported fact.

## 10 · Risks, and the honest reason this could be the wrong first move

- **Scope**: 19 route files, 32 store functions and the ledger all move. The
  mitigation is that the port's surface is small and the conformance suite is
  written first — but this is a 2–3 week change, not a weekend.
- **The file backend gets harder to maintain, not easier** (an adapter in front
  of what is currently direct code). The payment is that multi-instance and the
  O(learners) rewrite both stop being permanent properties.
- **Postgres is not "real user data is safe"**: it fixes concurrency and scale
  and does nothing about consent, retention policy, or who operates the server.
  The list this came from is explicit that those are not software-completable.
- **The laptop deployment must not become second class.** If the port makes the
  offline, no-database deployment harder to explain or run, it has traded the
  mission for an architecture diagram.

## 11 · Effort (an estimate, not a measurement)

| Slice | Content | Estimate |
|---|---|---|
| 0 *(done)* | one lock table, one `DATA_DIR`, with a source assertion | — |
| 1 *(done)* | port + types + file backend behind it, no behaviour change, all gates green | — |
| 2 *(done)* | the conformance suite (`scripts/storage-conformance.mjs`), `npm run storage-check`, wired into `production-check` and CI | — |
| 3 | **the write path**: `withLearner` on the port (§3 Q1), the answer / diagnostic / paper / sync routes migrated through it, and accounts moved off `auth.ts`'s private file | 4–6 days |
| 4 | Postgres backend + advisory locks + the missing-table decisions (§5), and the *second* `verify` run with the failure-list compare | 4–6 days |
| 5 | import / export / cutover / rollback drills | 3–4 days |
| 6 | benchmarks, two-process probe, docs, `/api/ready` reporting | 2–3 days |

**A gap this table had, found while starting slice 2 and now closed**: no slice
delivered `withLearner`. §3 declares it and §3 Q1 argues the port should own the
projection write, but the table went straight from "port, no behaviour change" to
"conformance suite" — so the method the whole seam exists for had no owner, and
slice 1's own header comment called that missing slice "slice 2" while this table
called the conformance suite slice 2. Two documents, two answers, one of them
wrong: the write path is slice 3, and the numbering now agrees across this file,
`lib/server/storage.ts` and `docs/DEPLOYMENT.md`. The conformance suite went first
anyway, and deliberately: it is what holds the port still WHILE the write path
moves through it, and it found a real defect on its first run (the file backend
did not honour the clock-order contract the port promises — see §3).

Total ≈ 15–22 focused days. These are estimates from the inventory above (19 call
sites, 32 functions, 23 existing tables), not measured — the project's own rule
applies to them too, so they are labelled as such.
