# Storage layer — spec and test plan

**Status: IN PROGRESS.** Slices 0–3 are implemented (the store's single lock
table and data-directory resolver; the port with the file backend behind it; the
conformance suite, five failure cases and the `storage-check` gate — the failure
cases found and fixed a **silent data-loss defect** in the ledger's append, §4;
the ledger behind a facade (3a); and 3b — `withLearner`/`withLearnerState` on the
port with the state-only mutator deleted, and ACCOUNTS moved off
`lib/server/auth.ts`'s private `accounts.json` onto ten port operations). Slice 4,
the Postgres backend, is specified rather than built, and says so. Every acceptance
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
| The file store | `lib/server/store.ts` | 381 lines, **33 export statements** (27 async functions, 3 sync, `DATA_DIR` and `locks`, and one re-export) — see §14.1 for the shape after phase C, which replaced `updateProfile` with `withLearnerState` |
| Call sites | **20** files under `app/api/**` import from `@/lib/server/store` | `progress` alone called `updateProfile` **8 times**; after phase C no route names it at all |
| Data files | the store, the ledger, accounts, erasures, interventions | **10 JSON files**, plus `<data>/evidence/*.jsonl` (one ledger per learner) and `session-secret` |
| The lock primitive | `lib/server/store.ts:31` **and** `lib/server/auth.ts:80` | **two independent lock tables** |
| The data directory | `store.ts:22`, `auth.ts:20`, `app/api/hub-status/route.ts:6` | **three resolvers** of `OPENMIND_DATA_DIR` |
| The ledger | **facade** `lib/server/evidence.ts` · **file backend** `lib/server/evidence-file.ts` | one JSONL per learner under `<data>/evidence/`, sharing the **same** lock table as the store, on purpose. Since slice 3a the facade holds no storage: it asks the port for the configured backend, and the file ledger has exactly **one** importer (`storage-file.ts`) — both asserted in `npm run verify` |
| The relational schema | `db/migrations/*.up.sql` | **26 tables** (23 + the three `0004` added; `schema_migrations` is the runner's own ledger), paired up/down files, checksums, drift detection, and a CI job that rehearses up → verify → down → up |
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
  /** Deletes the record AND records the intent to delete, in one unit.
   *  SUPERSEDED by §14.2, which split it three ways — `deleteProfile` (the record
   *  alone), `recordErasure` and `confirmErasure` (the log) — because an erasure is
   *  a RESUMABLE WORKFLOW rather than one call, and one call could not express the
   *  order that makes it resumable. */
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
  ONCE in the whole codebase (`lib/server/evidence-file.ts`; the module was named
  `evidence.ts` when this was measured, and slice 3a split the facade out of it) —
  every other store file
  is written whole via temp-file rename, which cannot tear — and the live store
  holds **0 evidence ledgers**, so no real record was ever exposed. The second
  half matters: had this checkout carried a class, every answer written after the
  first crash would have been unrecoverable and unnoticed. `lib/server/evidence-file.ts` now reads the file's last byte
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

F1–F5 are **file-backend cases**, and the honest reason is narrower than it was:
they do not merely “not use the port” — the ledger's read and write now DO go
through it (slice 3a) — they **observe the ledger FILE** (parsing every line to
see a torn write, reading a ledger written by three processes), which a non-file
backend cannot answer in the same currency. F4/F5 are the backend-neutral half
(the refusal properties) and move onto the port when `withLearner` lands. The
whole group reports its skip reason whenever a non-file backend is active, and
never gets a second suite (§6).

## 5 · Mapping onto the schema that already exists

This is the good news the recon produced: 23 tables already modelled most of this
domain, so the port is a mapping rather than a design. One of them — `profiles` —
could not in fact carry the record it was mapped to, and closing that plus the gap
list below took three more tables and one column, in `0004_port_gaps` and
`0005_profile_record` (each item, with the decision it forced, is recorded there).
The count is 26 now, and it is MEASURED against a migrated database rather than
added up from the files: `information_schema.tables` in `public`.

| Port operation | Existing table(s) |
|---|---|
| `withLearner`, `getProfile`, `listProfiles`, `saveProfile` | `profiles` — **via the `payload` column, and this row was WRONG until 0005**: see gap 6 — and `learner_projections` |
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
6. **`profiles` could not hold a real profile, and this gap was found by
   writing the backend rather than by reading this table.** The mapping row above
   said "`getProfile`/`saveProfile` → `profiles`", and that is false as the table
   stood: it models NINE of the learner's declared facts (`country`, `language`,
   `birth_year`, `goal`, `intent`, `subjects[]`, `specification_id`, `level_id`,
   `secret_hash`) while `StudentProfile` (lib/types.ts) carries thirty-odd
   (`handle`, `exam`, `examDate`, `timePerDay`, `board`, `grade`, `examples`,
   `termsMode`, `explainLen`, `resources[]`, four language fields, and
   `subjectCourses` — **one course per subject**, because a learner does not sit
   one qualification and a single flat course pitches one subject at the wrong
   depth). A backend written against those columns compiles, round-trips, and
   returns a DIFFERENT learner: the exam date gone, the per-subject courses
   collapsed to one, the teaching language lost. `saveProfile` would have
   silently dropped facts about a child while every assertion in this suite
   passed. **Resolved by 0005**: `profiles.payload jsonb` holds the record the
   application authored — the same shape `rooms`, `papers`, `personal_papers` and
   `packs` already use — and the typed columns stay the facts the database
   QUERIES. The model half of a learner (`progress`, `masteries`, `diagnostics`,
   `seenQuestions`) belongs to `learner_projections.model`, which is rebuildable
   by replay; it must NOT be duplicated into `payload`.

   **The same gap hid a second fact worth naming: `secret_hash` cannot serve the
   feature it sits beside.** Sign-in hands the profile's capability secret BACK to
   an authenticated session — the documented bridge that makes an existing learner
   work on a new device, and a session without it cannot call `/api/progress`. A
   hash is one-way by design, so a database holding only `secret_hash` cannot
   perform that hand-back at all. The raw secret therefore round-trips in
   `payload` and `secret_hash` is written from the same object in the same
   statement. Storing the raw capability secret is the EXISTING design, not a new
   decision: replacing it with a rotating token is a separate security change, not
   a storage move.

**Closed so far, and how**: gaps 1–3 by `0004_port_gaps` (the three tables, each
carrying the decision §5.3 asked for as a constraint rather than a comment), gap 6
by `0005_profile_record`. Gap 4 is a decision the backend slice makes when it
reaches rooms; gap 5 is configuration, not storage. `npm run db:verify` executes
the claims these files make — including the round-trip of the learner's own record
AND the columns-only write that loses it — so 0004's and 0005's reason for
existing is asserted rather than described.

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
  modules (`lib/server/store.ts`, `evidence.ts`, `evidence-file.ts`,
  `projection.ts`) against a temp
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
| 3a *(done)* | **the ledger on the port**: the read/write side asynchronous, the file ledger split out from the facade, every route and every `.mjs` harness awaiting it, the split asserted at the source | — |
| 3b | **the write path**: `withLearner` on the port (§3 Q1), profiles migrated onto it, and accounts moved off `auth.ts`'s private file | 3–4 days |
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

## 12 · Where slice 4 stands — landed, measured, and the order of what remains

Written because "Postgres is coming" is not a state anybody can act on. Each
sentence below is something a command in this repository now proves.

**LANDED (a slice-4 preamble: the schema it needs and the connection it needs).**

- `lib/server/pg.ts` — the single owner of the connection: one pool per process
  (injectable env, so a test drives a scratch database without touching
  `process.env`), transactions with **transaction-scoped advisory locks** (the
  cross-process half of what `withLock` does in memory, and a lock a crashed
  process cannot leave held), and `databaseHealth`, which is memoised so a polled
  `/api/ready` cannot turn a free-tier database into a load test and **never
  throws**: an unreachable database is the answer, not an error.
- `db/migrations/0006_learner_identity` — the facts about this product that the
  original schema REFUSED: a learner record with no account row (the `/solve` and
  `/try` wedge), an account link that is `ON DELETE SET NULL` rather than a
  `CASCADE` that could destroy a record outside the logged erasure path, the
  columns an account actually has (email, scrypt hash + salt, role,
  `session_epoch`, owned profile, `verified`), and `store_boots` — because a
  database deployment has no data directory for `boots.json` to measure the
  survival of.
- `@types/pg`, so the connection layer is typed rather than `any`.

**LANDED (slice 3a — the ledger is on the port, and the door the app uses holds
no storage).** This was §12's remaining item 1, minus `withLearner`.

- `lib/server/evidence-file.ts` is the file backend's ledger: the JSONL
  implementation, moved rather than rewritten (the framing rule, the id dedupe,
  the lock table it shares with the store, and the unsafe-id refusal all moved
  with it). `lib/server/evidence.ts` is now the **facade** — five functions, each
  a delegation to `activeStorage()`.
- **The split is the change, not a tidy-up.** Before it, “the ledger” and “the
  JSONL file” were the same import, so a second backend could not exist without
  rewriting every call site — and a call site reaching for the cheap synchronous
  function would read a file the configured backend never wrote. `npm run verify`
  now fails on either half: the facade must contain **no file plumbing** (no
  `node:fs`, no `*FileSync`, no bare `fs.`), it must reach the ledger through the
  port, and the file ledger must have **exactly one importer** (`storage-file.ts`).
  Both were watched firing on a mutated copy before being trusted.
- **Every consumer awaits**, including the two places no compiler reaches:
  `scripts/verify-engines.mjs` and `scripts/static-smoke.mjs` are `.mjs`, and both
  carry an `ok()` that REFUSES a thenable (slice 2 added the first; the same guard
  went into the second *before* any call site consumed the async port). ~30 ledger
  reads in `verify-engines.mjs` were converted, including the helpers
  (`ledgerOf` / `projectionOf` / `rowsOf` / `rowOf`) whose callers would otherwise
  have compared against a Promise.
- **The HALF-await §12 warned about** (`ok(name, Promise.resolve([]).length === 0)`) is
  the guard's third planted shape. `Array.prototype.every`/`.map` callbacks cannot
  await, so ledger reads inside predicates were deliberately lifted OUT of them —
  `[...ids].every((x) => !ledgerOf(id).some(...))` becomes a set read once, above.

**MEASURED on the landed slice:** `npm run verify` **3037 passed, 0 failed** with
`OPENMIND_TEST_DATABASE_URL` set (so the database half RAN rather than skipped; the
three `✗` lines in that output are the harness's own planted Promise cases, which
are removed from the totals). `npm run storage-check` **85 cases, 0 failed, 1
skipped**, `CONFORMANCE-FAILURES:` empty. `npm run verify:static` **95 passed, 0
failed**. `npx tsc --noEmit` clean. And the end-to-end suite over real HTTP against
a scratch store: **858 passed, 0 failed**, with `.openmind-data` never opened
(`find .openmind-data -newermt <run start>` returned nothing) — covering every
door that reads or writes a ledger: `/api/progress`, `/api/session`,
`/api/diagnostic`, `/api/evidence` + `/api/evidence-summary`, `/api/my-data`,
`/api/impact`, `/api/assignments`, `/api/needs`, `/api/classes`, `/api/profile`,
`/api/pack-export`.

**MEASURED (slice 4's preamble).** `npm run verify` runs 3037 assertions with
`OPENMIND_TEST_DATABASE_URL` set and 3027 without, 0 failed either way: the ten
difference IS the database half, which prints that it is SKIPPING (with the reason
and the command to run it) rather than passing. CI's `production-check` job sets
the variable so the database half always runs there. The assertions that matter:
a deployment configured for Postgres with **no connection string is REFUSED**, not
handed the file store; an unreachable database is reported as unreachable *and*
`databaseHealth` says nothing about its schema, so it can never be confused with a
reachable-but-unmigrated one; a real statement round-trips; **two writers on one
learner serialise** while two writers on different learners do not; a rolled-back
transaction releases its lock; and a malformed statement is NOT reported as an
outage. `npm run db:rehearse` applies, verifies, reverses all six migrations and
re-applies them against a real server, and `npm run db:verify` now asserts 0006's
four claims beside the ledger's own.

**TWO DEFECTS THAT SUITE FOUND IN ITS OWN FIRST RUN**, recorded because both were
invisible without a real server and both were the class of failure this project
treats as unacceptable:

1. `connect()` sat OUTSIDE the try in `withLockedTransaction`/`pgQuery`, so an
   unreachable database escaped as a raw driver rejection — a route would have
   answered 500 ("your answer was wrong") where the truth is "come back in a
   minute".
2. `databaseHealth` named `schema_migrations` directly, so a reachable database
   whose migrations had not run threw "relation does not exist" and was reported
   **unreachable** — sending an operator to debug DNS, a firewall and TLS while the
   real answer was "run the migrations".

**REMAINING, in order, because each is a prerequisite of the next.**

1. **LANDED (slice 3b, the write path).** `withLearner` and its record-shaped
   specialisation `withLearnerState` are on the port, and the file backend answers
   them with the store's own read-modify-write rather than a second
   implementation; `updateProfile` — the mutator that could only take the record —
   was DELETED, because a mutator that cannot see the transaction appends its
   evidence by resolving the port and deadlocks against the lock it holds on a
   database backend. The conformance suite drives the transaction through the port.
2. **LANDED (slice 3b, identity).** Accounts are on the port: ten semantic
   operations (`getAccount`, `findAccountByEmail`, `accountOwningProfile`,
   `countAccounts`, `createAccount`, `setAccountProfile`, `touchAccount`,
   `updateAccount`, `setPassword`, `revokeSessions`), implemented by the file
   backend and by nothing else. `lib/server/auth.ts` no longer reads or writes
   `accounts.json` — it holds authentication (hashing, the signed session, the
   cookie, the epoch check) and asks `activeStorage()` for the identity facts, the
   same facade shape as `lib/server/evidence.ts`. Two writers for one file, and two
   declarations of `Account`/`AccountRole` (one of which the client could not see),
   are gone with it; the conformance suite holds a second backend to the semantics,
   including that a duplicate address is refused INSIDE the write and that sign-out
   is an epoch bump. Account writes pass the `"identity"` write purpose, so a
   learner can always sign out on a deployment whose store has refused records.
3. **The routes' own store calls (the rest of the profile stage).** `saveProfile`
   still has callers under `app/` (signup's create path, `profile`'s legacy
   capability bind and field patch) and `getProfile` is read by six doors, all
   through `lib/server/store.ts` rather than through the port. Until those move,
   `OPENMIND_STORE=postgres` must stay **REFUSED**, and that is not a precaution:
   on a second backend those doors would read a store the configured backend never
   wrote — precisely the split this whole line exists to prevent.
4. **`lib/server/storage-postgres.ts`**: profiles (payload + typed columns +
   `learner_projections`), `evidence_events` (idempotent append, clock-ordered
   read), classes/members, rooms, packs, papers, personal papers, ai_cache,
   erasures, interventions, store_boots. A backend must be added to
   `scripts/storage-conformance.mjs` — never given a second suite (§6).
5. **`resolveStoreKind` accepts `postgres`** — only with a configured database,
   and only once 1–3 make it true; `/api/ready` reports the kind, reachability,
   the schema version and the boot record.
6. **The conformance PG half** against a scratch schema, and the second `verify`
   run with the §6 failure-list compare. This is the parity evidence, and it is
   what turns "a second backend exists" into "a second backend is interchangeable".
7. **`scripts/storage-import.mjs`** and the §7 drills (import → verify → flip →
   rollback), after which `.env.example`'s "NOT SERVABLE YET" note comes out.
8. **Docs**: re-check §5's mapping table against the backend AS WRITTEN (0006 is
   what that check produced when it was done for the schema), re-measure §9's
   acceptance list, and update `docs/OPERATIONS.md` (backing up a database
   deployment) and `docs/DATA_GOVERNANCE.md` (§5.3's erasure decision, now that
   `erasures` has a table and 0006 fixed the paths that remove a learner).

**WHAT AN OPERATOR SHOULD KNOW TODAY:** none of this makes a database deployment
serve learner data yet, and the one place that is stated for them rather than for
us is `docs/DEPLOYMENT.md` §5.1 — including the free path that DOES keep data today
(a host with a real disk), because the honest answer to "can I run this free" is
not "wait for slice 4".

## 13 · Slice 3b inventory: the store's operations, classified (the inventory 3b was built from)

Written BEFORE any adapter, because the adapter is not a translation of file
operations into SQL. Two of the four findings below are defects in the code as it
stands, and they were found by enumerating rather than by reading for them.

### 13.1 · Every export of `lib/server/store.ts`, and what it is

33 export statements: **25 data operations**, 2 pure id helpers, and the
infrastructure the file store is built from.

> **Updated by §14 (Phase B).** The store now has **47** export statements and 771
> lines: `withLearner` (the transaction), `createClass` (collision-safe join code),
> `reconcileClassIdentities` (the explicit legacy repair), `counts`,
> `deletePersonalPapersFor`, `recordErasure`/`confirmErasure`/`readErasureLog`, plus
> the `LedgerIO` registration. `deleteProfile` was NARROWED to the record alone.
> One fewer route imports the store (20 → 19) because `hub-status` now asks the
> PORT for its counts — a number this document's own status report measures, so a
> stale table here is visible rather than silently wrong.

| | Operations |
|---|---|
| Profiles | `getProfile` `listProfileStates` `saveProfile` `updateProfile` `deleteProfile` `removeMemberEverywhere` |
| Classes | `listClasses` `getClass` `saveClass` `updateClassByCode` `updateClassById` |
| Rooms | `listRooms` `getRoom` `saveRoom` `updateRoomById` |
| Community packs | `listPacks` `savePack` `readAllPacks` |
| Papers | `saveStoredPaper` `getStoredPaper` (the ANSWER KEY — marking depends on it) |
| Personal papers | `savePersonalPaper` `getPersonalPaper` `listPersonalPapers` (owner-scoped) |
| AI cache | `cacheGet` `cacheSet` |
| Ids | `newId` `joinCode` (pure; already port methods in §3) |
| File infrastructure | `DATA_DIR` `locks` `withLock` `readJson` `writeJson` `StoreWriteBlockedError` `WritePurpose` `storeWriteBlock` `resetStoreWritePolicy` — these are the FILE backend's internals, and the port's design rule already says none of them may appear in the interface |
| Re-exports | `newProfileState` `publicProfileState` (pure, from `lib/learner-profile.ts`, shared with the static build) |

**Consumers, measured by import statement rather than by name-match: 20 files under
`app/api/**` import the store, plus 8 lib modules** (`write-refusal`, `class-view`,
`interventions`, `capability`, `decision`, `storage-file`, `evidence-file`, `auth`),
plus the harnesses (`storage-conformance`, `verify-engines`, and the drills). 24
`updateProfile` call sites; `progress` alone accounts for 8.

### 13.2 · The data, classified (this is the decision the adapter must honour)

| File | Class | Why | Table (0001–0006) |
|---|---|---|---|
| `profiles.json` | **durable — required** | the learner's record: declared course, progress, masteries, transient sitting state. Losing it loses the learner | `profiles` (payload + typed columns) + `learner_projections` |
| `evidence/<id>.jsonl` | **durable — required** | the ledger; already on the port (slice 3a) | `evidence_events` |
| `classes.json` | **durable — required** | rosters, membership, assignments, self-reports | `classes`, `class_members`, `assignments`, `assignment_results` |
| `papers.json` | **durable — required** | the answer KEY, server-side only. A lost key makes a sitting unmarkable, and the paper has already been handed to the learner | `papers` + the key columns |
| `personal-papers.json` | **durable — required** | owner-scoped learner work (marks per question, no question text) | `personal_papers` |
| `rooms.json` | **durable — required** | shared study rooms and their messages | `rooms` |
| `interventions.json` | **durable — required** | the teacher's review records, and the window an outcome is measured over | `interventions` |
| `erasures.json` | **durable — required, and must outlive the archive** | the erase INSTRUCTION a restore re-applies (`lib/server/erasures.ts`) | `erasures` |
| `accounts.json` + `session-secret` | **durable — required (identity)** | `lib/server/auth.ts`, private. Losing the secret signs everyone out; losing an account loses the email/password link | `users`, `sessions` |
| `ai-cache.json` | **regenerable cache — deliberately ephemeral is acceptable** | the code already says so: a lost entry costs one model call, and `cacheSet` swallows even the write REFUSAL rather than failing the request that produced the value | `ai_cache` |
| `boots.json` | **regenerable measurement — meaningless on a database** | it measures whether a FILESYSTEM outlived a process. 0006 gives it `store_boots`, which is a different measurement (a release opened this database) | `store_boots` |
| `practice` / `learnSession` / `servedPractice` / `retrievalStage` | **transient, inside the profile record** | per-sitting staged state. Not evidence — but it must round-trip mid-sitting or the next answer is refused as "stale or unknown question", so it is part of the profile's unit, not a cache | (payload) |

**THE RULE THIS PRODUCES, which is the acceptance criterion the adapter is judged
by:** in a deployment selecting `postgres`, every **durable — required** row above
must be served by the database, and a durable file still being read or written
outside the port must make the deployment **REFUSE TO START** rather than run split.
Exactly one row (`ai-cache.json`) is permitted to stay file-backed, and only
because losing it costs a model call — so if it stays, `/api/ready` must say so
rather than let an operator infer it.

### 13.3 · Transaction boundaries (where "one operation" must become one unit)

| Unit | Today | What it must become |
|---|---|---|
| **A learner's answer** | `updateProfile(id, state => commitAndProject(...))` — the in-process lock is held across the ledger append and the replay | `withLearner`: one transaction holding a per-learner advisory lock, containing the ledger append AND the projection write. **The hard part, and the only real design question in 3b:** the mutator is arbitrary JS that awaits ledger I/O, so the ledger's own write must be able to JOIN the caller's transaction. Either the transaction context is ambient (AsyncLocalStorage) or `LearnerTx` is passed explicitly (§3 Q1 already raises this) — but a backend that opens a SECOND connection inside the mutator deadlocks against its own advisory lock, which is a failure this project would meet in production and not in a unit test |
| **A class edit** | `updateClassByCode` / `updateClassById`: read-modify-write under the `classes.json` lock | one transaction, row-locked on the class |
| **A room edit** | `updateRoomById`: same shape | one transaction, row-locked on the room |
| **An erasure** | see F-2 below — three calls from the route, and a fourth write inside `deleteProfile` | one unit: the port's own `eraseProfile` contract, which the interface ALREADY declares and the file backend does not yet keep |
| **A paper's key** | `saveStoredPaper`, then marked in a later request | durable before the paper is handed out; no multi-statement unit needed |
| **The AI cache** | best-effort, `catch`ed | stays best-effort, and must never fail the request |

### 13.4 · FOUR FINDINGS this inventory produced (all four closed — see §14.3)

**F-1 · A route reaches past the store into the data directory, and the existing
source assertion does not catch it.** `app/api/hub-status/route.ts` does
`fs.readFile(path.join(DATA_DIR, "profiles.json"))` and counts keys, for
`profiles.json`, `rooms.json` and `classes.json`, to publish `learners`, `rooms`
and `classes` to a school's LAN. The assertion in `verify-engines.mjs` forbids
`app/**` from importing `readJson`/`writeJson` — and this route bypasses it by
calling `fs.readFile` directly. On a database deployment there is no
data directory, `countFile`'s `catch` returns **0**, and the hub would report
**`learners: 0` for a school that has learners** — a false statement about the
school, answered with HTTP 200. This must move behind the port (a count, or the
existing `list*` methods) or fail closed, and the assertion must be widened to
catch a direct `fs` read of the data directory rather than only the two helpers.

There are exactly **two other `DATA_DIR` consumers under `app/`**, and they are a
different category — both in `/api/ready`: a write-read-delete probe proving the
directory is really writable, and `recordBoot(DATA_DIR, …)`, the survival
measurement `boots.json` holds. Neither reads a stored record, so neither can
report a false fact about a learner; but on a database deployment both are
measuring the wrong thing, and the schema already answers them (`databaseHealth`
for the probe, `store_boots` for the boot record — see §13.2). A complete
inventory is the point of this section, so they are named here rather than
rediscovered later.

**F-2 · `eraseProfile` does not do what the port says it does, the erase is not
one unit, and personal papers are removed by NEITHER live path.** The interface
documents `eraseProfile` as: "the record, its ledger, its papers, and the RECORD OF
THE INTENT". The file backend maps it to `deleteProfile`, which removes the record
and appends the tombstone and **nothing else**. `DELETE /api/profile` therefore
reaches the rest through two further, separate calls — `deleteEvidence(id)` then
`removeMemberEverywhere(id)` — so a process killed between them leaves a learner
whose record is gone and whose **ledger and class rows are not**: a partial
erasure, the one kind there is no excuse for, and exactly the state `erasures.ts`
calls "what makes 'we deleted it' false". It is repairable (`applyErasures` is
idempotent and total) but nothing runs it against the live store.

**And the two erase paths disagree about personal papers.** `applyErasures` — the
RESTORE path — removes the profile, the ledger, the class membership **and the
learner's personal papers**, and reports `personalPapers` as part of its outcome.
The live route removes the first three and leaves the papers on disk, and there is
no store function that could remove them (`savePersonalPaper`/`getPersonalPaper`/
`listPersonalPapers` exist; no delete does). `AGENTS.md`'s defence — that a paper
keyed to a deleted owner "resolves to nothing", which is true for READ access
because reads are owner-scoped — is about reachability, not about the record
surviving in the store. One of the two paths is wrong about a learner's own marked
work, and the privacy page's sentence ("the erase takes the whole record with it")
is the one that has to be true.

Phase B must make the port's own contract true — one `eraseProfile` that removes
the record, the ledger, the personal papers and the memberships as ONE unit, in one
transaction — and add the conformance case that holds it: erase a learner with a
ledger, a personal paper and a class membership, then assert all four are gone,
from every backend, and that a FAILED erase leaves no tombstone (which the suite
already checks for the file backend alone).

**F-3 · A READ performs a WRITE in another domain.** `listClasses`/`getClass` call
`classesWithIdentity()`, which reads `classes.json`, reads **every profile**
(`listProfileStates`) to bind legacy handles, and writes the result back
best-effort (`.catch(() => {})`). On a database this is a read that mutates the
profiles domain inside whatever transaction happens to be open, and it fails
silently by design. The reconciliation is idempotent and retried on the next read,
so the honest options are: do it ONCE at import/cutover, or keep it lazy but make
it explicit rather than a swallowed side effect. Deciding this is part of 3b — an
adapter that copies the function as written would inherit a write-on-read.

**F-4 · `newId`/`joinCode` are already port methods and have NO database answer as
written.** They are in-memory random generators, so ids differ per process and a
`joinCode` collision is only avoided by the alphabet being large. On a database
they belong to the row (a generated key, a unique constraint on the code), which
is why they sit on the port beside the data operations rather than staying a free
function. Not urgent, and named so it is a decision rather than an oversight.

### 13.5 · What Phase A establishes, and what it does not

**Establishes:** the operation set (25), its consumers (20 routes + 8 lib modules +
the harnesses), the classification of all twelve data files, the four operations
that need a real transaction, and four defects — one of which (`F-2`) is a
promise the port makes that the code does not keep, and one (`F-1`) that would
publish a false number to a school.

**Does NOT establish:** the PostgreSQL schema mapping for rooms/papers/personal
papers/interventions/erasures (0001–0006 were written for a domain model and §5's
table has to be re-checked against the adapter AS WRITTEN — the same check that
found `0005` necessary), whether the async conversion of the 25 operations breaks
any `.mjs` harness, or the import/cutover plan. Those are Phase B and slice 5.

## 14 · The two decisions, and what Phase B landed

Recorded before the adapter, because both change what gets built — and both were
asked for by name in the review that followed §13.

### 14.1 · Decision 1: a transaction-scoped storage context

**The decision.** A learner's record write and the evidence that justifies it are
ONE unit, and the operations that must join it receive a **transaction-scoped
context** rather than resolving the storage port for themselves.

The hazard this removes, measured in §13.3: the mutator is arbitrary JS that awaits
ledger I/O, so a backend that opens a SECOND connection for the ledger inside the
mutator deadlocks against the advisory lock the transaction itself holds. That is a
production failure, not a unit-test one.

**The contract** (`lib/server/storage.ts#LearnerContext`, `Storage.withLearner`):

```text
withLearner(learnerId, ctx => …)
    → getProfile() / saveProfile(state) / deleteProfile()
    → readEvents() / appendEvents(events)      ← on the transaction's own connection
```

Three properties, and the third is the one a caller must be able to rely on:

1. every read and write in the context happens inside one serialised unit for that
   learner;
2. a function that THROWS leaves the RECORD exactly as it was — the write is staged
   and flushed after the callback returns (`lib/server/store.ts#withLearner`);
3. an event append that already succeeded may STAND. An append-only ledger is not an
   edit, and replaying the same event id is a no-op — so the promise is "the record
   does not move", never "the ledger rewinds". A database backend can roll both
   back; a caller must be correct under the weaker of the two.

`withLearnerState(id, (ctx, state) => …)` is the record-shaped SPECIALISATION of
`withLearner` — open the record, refuse when there is none, run the mutator, stage the
record back — and the context is the mutator's FIRST argument, so a mutator that
needs the transaction has to name it. The state-only `updateProfile` that phase B
kept for its 24 call sites **no longer exists** (phase C, §14.5): with the routes
migrated, a mutator that cannot see the context had no remaining caller, and the
shape it allowed — resolve the port for the ledger write while holding the
learner's lock — is the deadlock §14.1 exists to prevent. It is now
unrepresentable rather than unimported.

And `commitAndProjectIn(ctx, state, events)` in `lib/server/projection.ts` is the
write path for a caller already inside a transaction: the same four steps (WRITE
EVENT → CONFIRM APPEND → REPLAY → RESPOND), sharing ONE implementation with
`commitAndProject` so they cannot disagree about, say, which mark the replay folds
from. An event the fold deliberately IGNORES (the hint action log, a diagnostic
sitting's per-answer detail) is appended with `ctx.appendEvents` instead: it needs
the transaction's connection and has nothing to re-project.

**Acceptance, driven.** `npm run verify` runs four concurrent transactions on one
learner and requires every event to land AND the record to account for each one (no
lost update); a transaction that throws after its append must leave the record
byte-identical while the event stands; a retried event id must be reported as a
duplicate and counted once; and the record the transaction committed must be exactly
what replaying its ledger produces. `npm run storage-check` drives the same contract
against every backend this build can serve.

### 14.2 · Decision 2: one authoritative erasure workflow

**The decision.** Live deletion and recovery-driven erasure are the SAME workflow,
removing the same things in the same order — and the learner's personal papers go on
both paths.

`lib/server/erasure.ts` is the workflow, `lib/server/erasures.ts` owns the log, and
`portErasureTarget(storage)` / `dirErasureTarget(dir)` are the two targets. The order
is the contract:

```text
RECORD THE INSTRUCTION → REMOVE THE EFFECTS → VERIFY → MARK FINISHED
```

- **The instruction is written FIRST**, which is a change from the shipped order. It is
  the JOURNAL, not a receipt: its meaning is "this learner asked to be forgotten", and
  an act does not become false because its effects were interrupted. The reverse order
  loses the only durable trace of the request — which is exactly the residue the old
  code left (record gone, ledger and papers still there, nothing anywhere saying a
  deletion was asked for), and that residue is UNRESUMABLE.
- **The record goes LAST of the four effects**, so an interruption leaves a learner the
  route can still find and who can ask again.
- **Verification happens before the finish is marked**: a record still present after the
  effects is a THROWN error, never an `ok`.
- **A completion is a SECOND RECORD, not a field on the first** (`entry: "recorded"`
  then `entry: "completed"`, paired by `of`). The first version of this decision wrote
  the finish as a mutable `completedAt` on the instruction, and the audit that followed
  found it contradicts the schema: `db/migrations/0004_port_gaps.up.sql` guards the
  erasures log with `append_only_reject_mutation`, `npm run db:verify` asserts "an
  erasure cannot be UPDATED (the log is append-only too)", and that schema's own
  comment prescribes the fix — "Append a correcting record instead." So the log stays
  append-only in BOTH backends, and "did this erase finish?" is a fold over records
  (`erasureStateFor`, one owner of it) rather than a field. `incompleteErasures()`
  names the learners whose LATEST instruction is unanswered — the latest, so a retried
  erase is not reported as permanently abandoned, and a re-erased learner is not
  answered by their first attempt. A restore re-applies both states identically: an
  erase that was ASKED FOR must be completed either way. `readErasures` also reads a
  LEGACY line (`{learnerId, at, completedAt}`) as both records it stood for, because
  the alternative for an erasure log is a restore that resurrects somebody whose erase
  it could not parse.

**Acceptance, driven.** `npm run storage-check` erases a learner holding a record, a
ledger and a personal paper, and requires all three gone, the instruction recorded with
both timestamps, and nothing left incomplete; then it kills the erase at the ledger step
and requires the failure to propagate, the record to survive, the log to show exactly
that one abandoned erase, and the re-run to complete it. `npm run verify` adds the
live-path half (all four artefacts, including a class membership), the resumed-erase
case, and a source assertion that the erase route cannot drift back to three calls.

### 14.3 · The four findings, closed

| | Was | Is |
|---|---|---|
| **F-1** | `hub-status` read the data directory itself and answered `learners: 0` from its `catch` — a false statement about a school, with HTTP 200 | the counts come from the port (`Storage.counts`), and a store that cannot be read is a 503 `store_unavailable`. The source guard is no longer "did you import `readJson`" but "does a route NAME a store file", so a direct `fs.readFile` cannot slip through it (comments are stripped first, so documenting the defect is not itself a violation) |
| **F-2** | three calls from the route; personal papers removed by the restore path only; the instruction written last | §14.2 |
| **F-3** | `listClasses`/`getClass` bound legacy handles — a WRITE — and swallowed the failure | both reads are pure (asserted: reading every roster leaves `classes.json` byte-identical); `reconcileClassIdentities()` is explicit, idempotent and PROPAGATES its failure; the class door calls it by name, and `npm run data:repair-classes` runs it as a migration |
| **F-4** | `newId` was clock-derived; `joinCode` had no constraint behind it | `newId` is 122 random bits (`crypto.randomUUID`), and `createClass` chooses the code AND inserts it inside ONE lock, retrying — which is also where the schema's `classes_join_code_live_key` unique index (0001) is honoured. The DB constraint, not the check, is the protection |

### 14.4 · What this does NOT do, stated rather than implied

- **`OPENMIND_STORE=postgres` is still REFUSED at startup.** What landed is the
  contract, the erasure, the write path and identity. The remaining reason is
  narrower than it was and easy to lose: a few ROUTES still read and write a
  learner's record through `lib/server/store.ts`'s own functions instead of through
  the port (`saveProfile` in signup's create path and in `app/api/profile`, and
  `getProfile` behind six doors). On a second backend those would read a store the
  configured backend never wrote — one learner's record in two places, the split
  this refusal exists to prevent. Accounts are no longer part of that list:
  `lib/server/auth.ts` holds no storage, and `accounts.json` is reached only by the
  file backend behind the port.
- **Phase C HAS happened, and this is what it moved.** Every route that reads or
  writes a learner's record now opens a transaction through
  `lib/server/transaction.ts` — the port-facing door, so a deployment configured for
  another backend is answered by it — and every evidence operation belonging to that
  unit goes through the context: `commitAndProjectIn(ctx, …)` for a graded event,
  `ctx.appendEvents(…)` for the two the fold ignores, `ctx.readEvents()` for the
  session route's baseline ledger reads (which used to resolve the port INSIDE the
  lock — the exact second-connection hazard). Twelve call sites across six routes:
  `progress` (8), `diagnostic` (2), `evidence`, `my-paper`, `paper`, `session` (2).
  The state-only `updateProfile` was deleted rather than left as a convenience, and
  five claims are asserted in `npm run verify`: no file under `app/` names
  `updateProfile`, `appendEvidence` or the port-resolved `commitAndProject`; every
  route that opens a transaction imports it from the transaction door; each of the six
  routes still opens one; and — at the BOUNDARY, with the port replaced by a backend
  that REFUSES the ledger methods — a whole transaction (read the record, read the
  ledger, append, re-project, stage) still succeeds while a mutator that resolves the
  port for its own write hits the refusal. `npm run storage-check` drives the same
  contract through the port, so a second backend inherits the cases rather than a
  promise.
- **What phase C did NOT move, measured rather than described, because it is the
  NEXT stage and not an oversight.** (Since 3b, accounts are out of this list: the
  ten identity operations are on the port and `auth.ts` writes no file.) One learner's RECORD is still read and written
  through `lib/server/store.ts`'s own functions wherever a route is not inside a
  transaction: `saveProfile` has **five** callers under `app/` —
  `app/api/auth/signup` (the create path, twice) and `app/api/profile` (the legacy
  capability-secret binding inside `authorize`, which a **GET** can trigger; the
  create path; and the field-patch write) — and `getProfile` is read by six doors
  (`profile`, `evidence`, `evidence-summary`, `my-data`, `packs`, `auth/claim`) plus
  `my-paper`'s dynamic import. Phase C moved the WRITE UNITS (the evidence-bearing
  transactions); leaving the profile door itself on the file backend is exactly why
  `OPENMIND_STORE=postgres` still refuses, and moving it is the profile stage of the
  plan, not a leftover. Accounts are NOT on this list any more: since 3b the ten
  identity operations are on the port and `lib/server/auth.ts` holds no storage at
  all, so `accounts.json` has exactly one writer — the file backend — which is the
  defect (two writers, two lock tables, two `OPENMIND_DATA_DIR` resolvers) the
  account stage existed to remove. `lib/server/interventions.ts` remains the one
  named lib exception to "a route does not name a store file", `app/api/ready`
  writes its own
  `.ready-…` probe into the data directory and names no record (an argument the F-1
  guard already makes, and it is why the guard is absolute rather than an allow-list),
  and `ai-cache.json` is the one declared file-backed exemption.
- **Atomicity across a file-backed boundary is not claimed.** The file backend stages
  the record and cannot unlink-and-rewrite atomically; the workflow's guarantee is
  RESUMABILITY, and a comment claiming more would be the kind of promise §14.2 exists
  to avoid.
- **`ai-cache.json` remains the single declared exception** (§13.2), and it must not
  quietly stop being the only one: a second file-backed durable record is what the
  refuse-to-start rule is for.

### 14.5 · F-5, found BY phase C: a model BEHIND its ledger was frozen as pre-ledger
history

Phase C's own test — a transaction whose append succeeded and whose staged record
write did not — produced a state no earlier case had built: the ledger contains an
answer the model has never folded. That is not a hypothetical: the ordering
(WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND) means the append lands first and
`writeJson` runs after, so a full disk, a refused store or a killed process leaves
exactly it. §14.1 states the resulting promise as *"the record does not move"*, never
*"the ledger rewinds"* — and the projection is what is supposed to make the standing
event count.

It did not. `ensureProjectionBase` decided "is this learner's model un-ledgered
history?" by asking whether the ledger's replay DIFFERED from the model, which is
true in BOTH directions. A model that was behind therefore got a pre-ledger snapshot
whose `ledgerMark` was the whole ledger, and the fold then skipped the very answer
that was on it. Measured on the compiled engines, by disabling the fix and re-running
the same scenario:

| | with the fix | with the directional test disabled |
|---|---|---|
| the next transaction | folds the stranded answer (`attempts` 3) | leaves it out (`attempts` 2) |
| `projectionBase` | absent | **stamped** |
| `unprojectableShare` | `null` | `{ concepts: 1, attempts: 1, at: 3000 }` |

The last row is the worse half: the learner is told, on their own evidence screen,
that an answer they DID record predates the ledger — a false disclosure about their
record, produced by the code that exists to disclose honestly. The answer itself was
not lost (the ledger is append-only and it is there), but it was permanently absent
from the model that teaches them.

**The fix is a direction, not a different threshold.** `ensureProjectionBase` now
stamps the snapshot only when the model holds recorded work the ledger cannot count —
and measures that on the MONOTONE fields alone (`attempts`, `correct`,
`independent.`, `transfer.`, `retention.`, `ms`, `answers`, `misconception.`). The
derived ones are excluded deliberately: `accuracy` (2 of 2 is 100%), `streak`,
`mastery` and `lastSeen` can all sit ABOVE the full model's value on a partial
ledger, so a "greater than" test on them would conclude that a learner with real
pre-ledger history holds nothing the ledger cannot count — and the snapshot that
preserves their work would never be taken. When the divergence runs the other way
the ledger is the more complete account and the projection is simply allowed to
repair the model.

Both directions are asserted as a PAIR in `npm run verify` and again in
`npm run storage-check`, because a rule that stamps a snapshot for either direction
is as wrong as one that stamps it for neither: the same measurement is run on a
learner who worked before the ledger existed (snapshot taken, 3 pre-ledger answers
kept) and on a learner whose record is one answer behind (no snapshot, work folded,
no disclosure).
