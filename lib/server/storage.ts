// ─────────────────────────────────────────────────────────────────────────────
// THE STORAGE PORT — one interface, and the one thing it must never do.
//
// Why this file exists: `lib/server/store.ts` is 381 lines with 33 export
// statements behind 20 route files, and `profiles.json` holds EVERY learner, so
// reading one profile parses them all and writing one rewrites them all under a
// single in-process lock. That lock is a promise chain, which means the store is
// safe for exactly one process — and every "the store is safe" measurement this
// project has is therefore a single-process measurement. docs/STORAGE_SPEC.md is
// the plan; this is its first slice: the SEAM, with behaviour unchanged.
//
// THE DESIGN RULE, and the reason `readJson`/`writeJson` are absent below: the
// interface is SEMANTIC, not file-shaped. A Postgres backend has no idea what
// `profiles.json` is. An interface that leaks the file layout produces a second
// backend that is a shim over the first, and then parity testing measures the
// shim. So the port names operations ("the profiles", "this learner's events"),
// and the file layout stays private to the backend that has one.
//
// WHAT IS DELIBERATELY NOT HERE YET: `withLearner` — the one method that opens a
// learner's durable unit, stages events and stages the projection. That is the
// method that CHANGES THE WRITE PATH, and slice 1's acceptance was "no behaviour
// change", so the answer path still runs exactly as it does today
// (`updateProfile` → `commitAndProject` → `appendEvidence`). **Slice 3 lands it**,
// with the read side already ported here. Claiming otherwise in a comment is how
// a spec becomes decoration.
//
// WHAT ELSE IS NOT HERE: accounts. `lib/server/auth.ts` owns `accounts.json`
// privately and already imports this store, so moving accounts onto the port
// needs the two modules' dependency untangled first — slice 3, named rather than
// forgotten. Until then `accounts.json` is the one data file outside the port.
// ─────────────────────────────────────────────────────────────────────────────
import type { ClassRoster, ProfileState, StudyPack, StudyRoom } from "../types";
// The event schema and the profile shape live in their own modules, not in
// lib/types.ts — the compiler caught this rather than a runtime `undefined`.
//
// TYPE-ONLY, and that is load-bearing rather than stylistic: `lib/server/evidence.ts`
// imports the store, which imports this module, so a VALUE import here would close
// a cycle. A type is erased, so the port still imports nothing at runtime — which is
// what lets `scripts/storage-conformance.mjs` load the port and CONSULT it before
// anything resolves a backend.
import type { AppendResult, EvidenceEvent } from "../evidence";
import type { BuiltPaperAnswerKey } from "../papers";
import type { PersonalPaper } from "../personal-paper";
// TYPE-ONLY for the same reason as the rest: the erasure log's SHAPE is owned by
// lib/server/erasures.ts — which is also the module a RESTORE reads a directory
// with — and a value import here would drag `node:fs` into the port, which is the
// one module `scripts/storage-conformance.mjs` loads before anything resolves a
// backend.
import type { ErasureRecord } from "./erasures";

/** Which backend this deployment runs. A closed set on purpose: an unknown value
 *  is refused rather than defaulted, because a typo must not silently decide
 *  where a school's learner records live. */
export type StoreKind = "file" | "postgres";

export const STORE_KINDS: readonly StoreKind[] = ["file", "postgres"];

/** The environment variable that selects the backend. */
export const STORE_ENV = "OPENMIND_STORE";

/** Thrown when the configuration names a backend this build cannot serve. */
export class StoreConfigError extends Error {
  constructor(
    readonly code: "unknown_store_kind" | "store_not_implemented",
    message: string,
  ) {
    super(message);
    this.name = "StoreConfigError";
  }
}

/**
 * ONE LEARNER'S DURABLE UNIT, AS A TRANSACTION-SCOPED CONTEXT.
 *
 * This is the shape `docs/STORAGE_SPEC.md` §14 decision 1 specifies, and the
 * hazard it removes is concrete rather than tidiness: the learner's profile write
 * and the evidence append that justifies it must be ONE unit. Today they are two
 * calls the route makes in sequence, and every claim this project makes about a
 * learner rests on the caller getting that sequence right under concurrency.
 *
 * WHY A CONTEXT OBJECT rather than a lock plus free functions. A database backend
 * cannot answer "append this event" on a connection it did not choose: the append
 * has to travel on the SAME connection that holds the learner's lock, or the two
 * operations block each other (one holds the advisory lock, the other waits for a
 * connection that can never be granted). Passing the context IN makes that
 * dependency visible at the call site and impossible to get wrong by accident —
 * `ctx.appendEvents(...)` cannot open a second connection, because there is no
 * other connection in scope. The alternative designs were both rejected:
 *
 *   · a module-global "current transaction" — the user's own words for it are
 *     "an undocumented global variable", and it silently leaks across awaits;
 *   · letting the backend guess ("am I inside a transaction?") — which is a
 *     question a file backend answers differently from a database, so the two
 *     backends would disagree about what a caller's code means.
 *
 * WHAT THE BACKEND OWES THE CALLER:
 *   · every read and write here happens inside one serialised unit for this
 *     learner, so no other request can observe a half-applied change;
 *   · a `fn` that THROWS leaves the learner's RECORD exactly as it was — the
 *     staged write is dropped, not committed;
 *   · an event append that already succeeded may STAND (an append-only ledger is
 *     not an edit, and replaying the same event id is a no-op — the idempotence
 *     the retry path depends on), so the contract is "the record does not move",
 *     never "the ledger rewinds". A database backend rolls both back because it
 *     can; a caller must be correct under the weaker of the two.
 */
export interface LearnerContext {
  /** The learner this transaction is about. */
  readonly learnerId: string;
  readonly kind: StoreKind;
  /** The record as of the start of the transaction — or `null`, because a
   *  transaction is also the shape a DELETION needs (a retried erase must be able
   *  to finish removing a learner whose record is already gone). */
  getProfile(): Promise<ProfileState | null>;
  /** Stage a write of this (possibly mutated) record. Committed with the
   *  transaction — never before it, and never if `fn` throws. */
  saveProfile(state: ProfileState): Promise<void>;
  /** Stage the removal of the record, inside the transaction. Returns whether
   *  there was one to remove. */
  deleteProfile(): Promise<boolean>;
  /** This learner's history, OLDEST FIRST — the same promise as
   *  `Storage.readEvents`, kept on the transaction's own connection. */
  readEvents(): Promise<EvidenceEvent[]>;
  /** Append events, idempotent by event id — the same promise as
   *  `Storage.appendEvents`, kept on the transaction's own connection. */
  appendEvents(events: readonly EvidenceEvent[]): Promise<AppendResult>;
}

/** How many of each, for a hub's at-a-glance counts. A separate method rather
 *  than "list them and take the length" because a database answers this with a
 *  `COUNT(*)`, and because the COUNT is the thing a surface must not invent: a
 *  store that cannot be read must report a failure, never zero (F-1 of
 *  docs/STORAGE_SPEC.md §13 — `learners: 0` reaching a school is a false
 *  statement about that school). */
export interface StoreCounts {
  learners: number;
  rooms: number;
  classes: number;
}

/**
 * The learner-scoped storage operations. Every method here is a fact about the
 * domain, not about a file — and every one of them is already implemented by the
 * file store, so this slice changes no behaviour.
 */
export interface Storage {
  readonly kind: StoreKind;

  // ── Profiles: the learner record and its projection ──────────────────────
  getProfile(id: string): Promise<ProfileState | null>;
  listProfiles(): Promise<ProfileState[]>;
  saveProfile(state: ProfileState): Promise<void>;
  /** THE LEARNER TRANSACTION. Read-modify-write of one learner's record and its
   *  projection, serialised against every other writer — which for the file
   *  backend is the in-process lock table and for a database is a transaction
   *  holding an advisory lock on the learner. It is the method every answer path
   *  already uses (`lib/server/store.ts#updateProfile`), so a backend that
   *  implements it is interchangeable on the write path; `null` means the learner
   *  does not exist, and the mutator is never run for one who does not. */
  updateProfile<T>(
    id: string,
    mutator: (state: ProfileState) => T | Promise<T>,
  ): Promise<{ state: ProfileState; result: T } | null>;
  /** THE LEARNER TRANSACTION (§14 decision 1). Read the record, append the events
   *  that justify the change, re-project, write the record — as one unit, on one
   *  connection, serialised against every other writer. Returns what `fn`
   *  returned, so a caller reads the result of its own work rather than
   *  re-fetching it. A `fn` that throws rolls the RECORD back; see
   *  `LearnerContext` for exactly what that promise does and does not cover. */
  withLearner<T>(learnerId: string, fn: (ctx: LearnerContext) => T | Promise<T>): Promise<T>;

  /** Remove a learner's RECORD — the profile, and nothing else.
   *
   *  Deliberately narrow, and that is F-2 of docs/STORAGE_SPEC.md §13: the erase
   *  is a SEQUENCE (ledger, papers, memberships, record, tombstone) and no single
   *  backend call owns it, because a sequence is what makes it resumable and what
   *  keeps the two callers — the live route and a restore — removing the same
   *  things in the same order (`lib/server/erasure.ts`). A method that also wrote
   *  the tombstone conflated "removing the record" with "recording the
   *  instruction", which is why the instruction used to be written after a
   *  half-finished removal could no longer be resumed. */
  deleteProfile(id: string): Promise<boolean>;
  /** Append the learner to the ERASURE LOG — the instruction a restore
   *  re-applies, and the journal an interrupted erase resumes from. Idempotent:
   *  a learner already in the log is left alone and `at` does not move. */
  recordErasure(learnerId: string, at: number): Promise<boolean>;
  /** Mark that instruction FINISHED, once the effects are removed and verified.
   *  The pair is the erase's two states, and one timestamp could not carry them. */
  confirmErasure(learnerId: string, at: number): Promise<boolean>;
  /** The erasure log: who asked to be forgotten, and when. */
  readErasures(): Promise<ErasureRecord[]>;
  /** Remove one learner's personal papers, by OWNER. Returns how many were
   *  removed. The live erase and the restore both call this, which is the whole
   *  of F-2: they used to disagree about a learner's own marked work. */
  deletePersonalPapersFor(owner: string): Promise<number>;
  /** Remove a learner from every class roster, in place. */
  removeMemberEverywhere(profileId: string): Promise<number>;
  /** How many learners, rooms and classes this store holds. */
  counts(): Promise<StoreCounts>;

  // ── The ledger: read AND write, and every method ASYNC ───────────────────
  //
  // WHY THESE ARE `Promise`-RETURNING and the file backend's own functions are
  // not. A file can be read between two lines of JavaScript; a database cannot —
  // there is no synchronous answer to "what is on this learner's ledger?" that a
  // Postgres backend could give without blocking the whole event loop. The port
  // is the CONTRACT every backend implements, so the contract is the asynchronous
  // one, and the file backend answers with an already-resolved promise (which
  // costs nothing: `await` on a settled value is one microtask).
  //
  // The alternative — leaving the port synchronous and letting the database
  // backend... not be one — is what put a `spawnSync`-shaped temptation in the
  // way of every implementer, and a store that blocks the event loop under a
  // classroom's answers is a different outage with the same cause.
  //
  // The LEDGER half has migrated (slice 3a): `lib/server/evidence.ts` is a facade
  // that delegates every one of these five to `activeStorage()`, and the file
  // implementation lives in `lib/server/evidence-file.ts` behind this backend —
  // so no route opens a ledger file itself, and the file ledger has exactly one
  // importer. The PROFILE half (`lib/server/store.ts`) has not: it is slice 3b,
  // together with `withLearner`, and until then `resolveStoreKind` keeps refusing
  // any non-file backend (see below), which is what stops a learner's record from
  // living in two places at once.
  /** A learner's history, OLDEST FIRST — the input to `replayModel`. Clock
   *  order, not append order: a device that was offline appends events that
   *  happened before ones already written, so a backend that returns the file
   *  in the order it was written breaks the promise its consumer depends on.
   *  `scripts/storage-conformance.mjs` holds every backend to this. */
  readEvents(learnerId: string): Promise<EvidenceEvent[]>;
  /** Append events, idempotent by event id: a re-sent event is reported as a
   *  duplicate and not written. This is the WRITE side of the ledger, and it is
   *  the strongest claim the product makes about a learner — so a backend that
   *  cannot record must THROW rather than report success (`commitAndProject`
   *  turns that into the route's `evidence_not_recorded` 503). */
  appendEvents(learnerId: string, events: readonly EvidenceEvent[]): Promise<AppendResult>;
  learnersWithEvents(): Promise<string[]>;
  hasEvent(learnerId: string, eventId: string): Promise<boolean>;
  deleteEvents(learnerId: string): Promise<boolean>;

  // ── Classes and membership ───────────────────────────────────────────────
  listClasses(): Promise<ClassRoster[]>;
  getClass(id: string): Promise<ClassRoster | null>;
  saveClass(cls: ClassRoster): Promise<void>;
  updateClassByCode<T>(
    code: string,
    fn: (cls: ClassRoster) => T | Promise<T>,
  ): Promise<{ cls: ClassRoster; result: T } | null>;
  updateClassById<T>(
    id: string,
    fn: (cls: ClassRoster) => T | Promise<T>,
  ): Promise<{ cls: ClassRoster; result: T } | null>;

  // ── Rooms ────────────────────────────────────────────────────────────────
  listRooms(): Promise<StudyRoom[]>;
  getRoom(id: string): Promise<StudyRoom | null>;
  saveRoom(room: StudyRoom): Promise<void>;
  updateRoomById<T>(
    id: string,
    fn: (room: StudyRoom) => T | Promise<T>,
  ): Promise<{ room: StudyRoom; result: T } | null>;

  // ── Community packs ──────────────────────────────────────────────────────
  listPacks(conceptId: string): Promise<StudyPack[]>;
  savePack(pack: StudyPack): Promise<void>;
  readAllPacks(): Promise<StudyPack[]>;

  // ── Papers. `getStoredPaper` holds the ANSWER KEY, server-side only. ─────
  saveStoredPaper(key: BuiltPaperAnswerKey): Promise<void>;
  getStoredPaper(id: string): Promise<BuiltPaperAnswerKey | null>;

  // ── Personal papers: owner-scoped, and never holding question text. ──────
  savePersonalPaper(paper: PersonalPaper): Promise<void>;
  getPersonalPaper(id: string, owner: string): Promise<PersonalPaper | null>;
  listPersonalPapers(owner: string): Promise<PersonalPaper[]>;

  // ── The AI result cache: disposable by design (a lost entry costs a call). ─
  cacheGet(key: string): Promise<unknown | null>;
  cacheSet(key: string, value: unknown): Promise<void>;
}

/**
 * THE METHODS OF THE PORT, as data.
 *
 * A typed object literal already proves completeness at compile time, and that is
 * the primary check — but a cast (`as unknown as Storage`) would defeat it
 * silently, and a backend that answers `undefined` for a method is exactly the
 * failure this whole exercise exists to prevent. So the list is exported and
 * `npm run verify` walks it against the backend object at runtime: a method that
 * exists in the type and not in the object fails there rather than in a
 * classroom.
 */
export const STORAGE_METHODS: readonly (keyof Storage)[] = [
  "getProfile",
  "listProfiles",
  "saveProfile",
  "updateProfile",
  "withLearner",
  "deleteProfile",
  "recordErasure",
  "confirmErasure",
  "readErasures",
  "deletePersonalPapersFor",
  "removeMemberEverywhere",
  "counts",
  "readEvents",
  "appendEvents",
  "learnersWithEvents",
  "hasEvent",
  "deleteEvents",
  "listClasses",
  "getClass",
  "saveClass",
  "updateClassByCode",
  "updateClassById",
  "listRooms",
  "getRoom",
  "saveRoom",
  "updateRoomById",
  "listPacks",
  "savePack",
  "readAllPacks",
  "saveStoredPaper",
  "getStoredPaper",
  "savePersonalPaper",
  "getPersonalPaper",
  "listPersonalPapers",
  "cacheGet",
  "cacheSet",
];

/**
 * Which backend the environment asks for.
 *
 * `undefined`, `""` and `"file"` all mean the file store — the deployment that
 * needs no configuration, which is this project's default and its mission.
 *
 * `"postgres"` THROWS, and that is the point of this function rather than a gap
 * in it. docs/STORAGE_SPEC.md specifies the Postgres backend and it is not built;
 * an operator who sets `OPENMIND_STORE=postgres` expecting a database must not
 * receive a file store, because the failure that produces is silent data in the
 * wrong place and a deployment that believes it is on Postgres. Refusing loudly
 * is the only honest answer until the backend exists.
 *
 * Anything else throws too, naming the accepted values, because a typo is not a
 * choice.
 */
export function resolveStoreKind(env: Record<string, string | undefined> = process.env): StoreKind {
  const raw = (env[STORE_ENV] ?? "").trim().toLowerCase();
  if (raw === "" || raw === "file") return "file";
  if (raw === "postgres") {
    throw new StoreConfigError(
      "store_not_implemented",
      `${STORE_ENV}=postgres is specified in docs/STORAGE_SPEC.md but NOT IMPLEMENTED in this build. ` +
        `Refusing to start rather than serve a file store under a Postgres configuration: the file store is ` +
        `single-process and would silently lose concurrent writes. Unset ${STORE_ENV} to run the file store.`,
    );
  }
  throw new StoreConfigError(
    "unknown_store_kind",
    `${STORE_ENV}="${raw}" is not a backend this build knows. Accepted values: ${STORE_KINDS.join(", ")} ` +
      `(or unset, which means the file store).`,
  );
}

/** The resolved kind, or the reason it could not be resolved. Used by the
 *  readiness route and the environment report, which must be able to SAY the
 *  problem instead of only throwing on it. */
export function storeKindReport(env: Record<string, string | undefined> = process.env): {
  kind: StoreKind | null;
  configured: string;
  problem: { code: StoreConfigError["code"]; detail: string } | null;
} {
  const configured = (env[STORE_ENV] ?? "").trim();
  try {
    return { kind: resolveStoreKind(env), configured, problem: null };
  } catch (e) {
    if (e instanceof StoreConfigError) {
      return { kind: null, configured, problem: { code: e.code, detail: e.message } };
    }
    throw e;
  }
}
