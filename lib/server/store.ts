import { promises as fs } from "fs";
import path from "path";
// Ids are RANDOM, not clock-derived — see `newId` for why the shape changed.
import { createHash, randomUUID, randomBytes, randomInt, scryptSync } from "node:crypto";
// The profile's own shape and its wire-stripping rule are PURE, and the static
// build (no server at all) needs both — so they live in lib/learner-profile.ts
// and are re-exported here. A second copy would be a default that drifts.
import type { Account, AccountRole } from "../types";
// The lookup key is DERIVED from the account id, so the store and the printed
// grant cannot disagree about which account a teacher's code names.
import { resetKeyFor } from "../recovery-code";
import { newProfileState, publicProfileState } from "../learner-profile";
// The membership rule, in one place: the store is only the caller that makes a
// legacy roster's identities durable.
import { bindLegacyHandles, hasRow, removeMember } from "./class-membership";
// The erasure log. An erase records an INTENT here as well as removing the data,
// because a backup taken earlier still holds the learner and a restore would put
// them back — see lib/server/erasures.ts, and `npm run restore-drill`.
import {
  ERASURES_FILE,
  appendErasure,
  confirmErasure as confirmErasureInDir,
  readErasures,
  type ErasureRecord,
} from "./erasures";
// The storage port. Imported for its REAL effect as well as its types: resolving
// the configured backend at module load is what refuses a deployment that asked
// for a backend this build cannot serve.
import { resolveStoreKind, type LearnerContext, type StoreCounts } from "./storage";
// The repo's ONE event-ordering rule. The port promises `readEvents` is oldest
// first, and the transaction context must keep that promise on its own path —
// this is the same call `storage-file.ts` makes for the backend's own read.
import { orderEvents, type AppendResult, type EvidenceEvent } from "../evidence";
// The ONE owner of "may this deployment keep a learner's record": see
// `storeWriteBlock` below, which is the write path's half of it.
import { storeReadiness } from "../env";
export { newProfileState, publicProfileState };
import type { ClassRoster, ProfileState, StudentProfile, StudyPack, StudyRoom } from "../types";
import type { BuiltPaperAnswerKey } from "../papers";
import type { PersonalPaper } from "../personal-paper";

// Where all learning data lives. Overridable so a deployment can point at a
// mounted drive, a synced folder or a Docker volume — copy that one directory
// to back up or move an entire school's OpenMind.
export const DATA_DIR = process.env.OPENMIND_DATA_DIR
  ? path.resolve(process.env.OPENMIND_DATA_DIR)
  : path.join(process.cwd(), ".openmind-data");

// ── WHICH BACKEND, CHECKED AT THE DOOR EVERY ROUTE USES ─────────────────────
// Every learner-scoped route imports this module, so resolving the configured
// backend HERE is what makes a misconfiguration a refusal rather than a surprise.
// `OPENMIND_STORE=postgres` is specified in docs/STORAGE_SPEC.md and not built:
// serving the file store to an operator who asked for a database is the silent
// failure the port exists to prevent (single-process writes, records in the wrong
// place, a deployment that believes it is on Postgres). An unrecognised value is
// refused too — a typo is not a choice. The file store is the default and needs
// no configuration, which is this project's whole deployment story.
//
// `lib/server/storage.ts#storeKindReport` is the reporting half of the same fact,
// used by /api/ready and the environment report so the reason reaches an operator
// as a problem line rather than as a stack trace.
resolveStoreKind();

/** Per-file write locks: serialise read-modify-write cycles so concurrent
 *  requests (double-fired effects, parallel tabs) can never interleave and
 *  corrupt the JSON. Exported (with DATA_DIR) for the evidence ledger, which
 *  must share this table: a lock per module would let an evidence append and a
 *  profile write race on the same learner. */
export const locks = new Map<string, Promise<unknown>>();
export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(key, next.then(() => undefined, () => undefined));
  return next;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// ── MAY THIS DEPLOYMENT KEEP WHAT IT IS ABOUT TO WRITE? ─────────────────────
//
// The rule itself lives in lib/env.ts (`storeReadiness`), so the readiness route,
// the drill and the write path cannot disagree about it. Its second live drill
// was the one that forced it: a Render service with no disk answered ready:true
// and lost a canary learner to the next deploy, and the lesson is not "detect
// that host" — it is that NO statistic a process can take tells a disk the host
// keeps from a directory it rebuilds. So the deployment must DECLARE which it is,
// and until it does, learner-data writes are refused rather than accepted and
// quietly thrown away.
//
// The refusal is enforced HERE, at the primitive every learner-record write goes
// through, rather than in the routes: a route added tomorrow cannot forget a
// check it never had to write. Routes translate it (lib/server/write-refusal.ts)
// so a learner sees a sentence rather than a stack trace.

export class StoreWriteBlockedError extends Error {
  constructor(
    /** The code from lib/env.ts — `durability_unknown`, `data_dir_not_durable`, … */
    readonly code: string,
    /** Why, in a sentence an operator can act on. */
    readonly detail: string,
  ) {
    super(detail);
    this.name = "StoreWriteBlockedError";
  }
}

/**
 * WHY this write is happening — and the whole of the policy, in one type.
 *
 *   learner-record — a learner's record, history or work. REFUSED on a store the
 *                    deployment has not declared it can keep. This is the default,
 *                    because the safe direction for a forgotten argument is to
 *                    refuse.
 *   erasure        — removing a learner's data. NEVER refused: erasure is a
 *                    right, and a store that cannot keep data is exactly where
 *                    keeping it after being asked to delete it is worst.
 *   identity       — an account's own session bookkeeping (sign-out, the epoch
 *                    that revokes tokens, a password change). NEVER refused:
 *                    signing out must work on every deployment, and refusing it
 *                    would leave a learner signed in because the disk is wrong.
 */
export type WritePurpose = "learner-record" | "erasure" | "identity";

/** The refusal, or null when this deployment may write learner records. Resolved
 *  once per process: the environment does not change under a running server, and
 *  every write asking the same question again is how a write path gets slow. */
let writePolicy: { code: string; detail: string } | null | undefined;
export function storeWriteBlock(): { code: string; detail: string } | null {
  if (writePolicy === undefined) {
    const ready = storeReadiness(process.env);
    writePolicy = ready.writesPermitted
      ? null
      : { code: ready.blockedBy ?? "store_not_writable", detail: ready.reason };
  }
  return writePolicy;
}

/** For tests and for a process that must re-read a changed environment. */
export function resetStoreWritePolicy(): void {
  writePolicy = undefined;
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    // Missing or unreadable file — start from the fallback rather than crashing.
    return fallback;
  }
}

/**
 * READ IT, OR SAY YOU COULD NOT — the strict half of `readJson`.
 *
 * `readJson` answers its fallback for BOTH "there is no file" and "the file is
 * there and I could not read it", which is right for a record lookup (a learner
 * who is not stored and a learner whose store is corrupt both answer 404) and
 * wrong for a COUNT. This is F-1 of docs/STORAGE_SPEC.md §13: a hub told a school
 * `learners: 0` because reading `profiles.json` threw. An ABSENT file is still an
 * empty store (a school that has never enrolled anybody must not see an error),
 * but anything else — a permission error, a truncated file, a volume that did not
 * mount — is a failure to report as one.
 */
async function readJsonStrict<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === "ENOENT") return fallback;
    throw e;
  }
}

export async function writeJson(
  file: string,
  data: unknown,
  purpose: WritePurpose = "learner-record",
): Promise<void> {
  const text = JSON.stringify(data);
  const block = purpose === "learner-record" ? storeWriteBlock() : null;
  if (block) {
    // A WRITE THAT WOULD NOT CHANGE THE FILE IS NOT A WRITE. This matters on a
    // store we have refused: several read doors (`GET /api/progress`) read the
    // profile inside the file lock and write it straight back, and refusing their
    // no-op write would turn a read-only deployment into one that cannot be read.
    // It also spares a real deployment an unnecessary rewrite of a file it just
    // read. Compared on the serialised text, which is the exact bytes the write
    // would produce.
    try {
      if ((await fs.readFile(path.join(DATA_DIR, file), "utf8")) === text) return;
    } catch {
      // Unreadable or absent: the write is real, and the refusal stands.
    }
    throw new StoreWriteBlockedError(block.code, `${block.detail} (refused while writing ${file})`);
  }
  await ensureDir();
  // Unique temp name per write: two writers must never share one tmp file.
  const tmp = path.join(DATA_DIR, `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`);
  await fs.writeFile(tmp, text, "utf8");
  await fs.rename(tmp, path.join(DATA_DIR, file));
}

// ── Profiles ────────────────────────────────────────────────────────────────

// `newProfileState` and `publicProfileState` are re-exported above from
// lib/learner-profile.ts, where they live so the static build can share them.

export async function getProfile(id: string): Promise<ProfileState | null> {
  const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
  return all[id] ?? null;
}

export async function saveProfile(state: ProfileState): Promise<void> {
  await withLock("profiles.json", async () => {
    const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
    all[state.profile.id] = state;
    await writeJson("profiles.json", all);
  });
}

/**
 * Generate a new profile ID (RANDOM, not clock-derived). Used by sign-up to
 * create a fresh learner record alongside the new account.
 */
export function newProfileId(): string {
  return `prof_${randomUUID().replace(/-/g, "")}`;
}

/**
 * Ensure a profile has a capability secret. If the profile already has one,
 * return it; otherwise generate and store a new one. This is called during
 * sign-up and claim so the profile is always callable from a fresh session.
 */
export async function ensureProfileSecretFor(state: ProfileState): Promise<string> {
  if (state.secret) return Promise.resolve(state.secret);
  const secret = `sec_${randomUUID().replace(/-/g, "")}`;
  state.secret = secret;
  await saveProfile(state);
  return secret;
}

/**
 * Remove a learner's RECORD. Nothing else, deliberately.
 *
 * This used to write the erasure tombstone too, and that pairing is what made a
 * half-finished erase unresumable (F-2 of docs/STORAGE_SPEC.md §13): the record
 * could be gone while the ledger, the personal papers and the memberships were
 * still there, and the instruction that would have let a retry or a restore
 * finish the job was the LAST thing written. The record and the instruction are
 * now two calls, and the erasure is one workflow that makes them one unit
 * (`lib/server/erasure.ts`) — used by the live route and by a restore.
 */
export async function deleteProfile(id: string): Promise<boolean> {
  return withLock("profiles.json", async () => {
    const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
    if (!all[id]) return false;
    delete all[id];
    // "erasure": the right to be forgotten does not depend on the deployment
    // being able to keep records — see WritePurpose.
    await writeJson("profiles.json", all, "erasure");
    return true;
  });
}

/**
 * Record one learner's erasure intent: the line in `erasures.json` a RESTORE
 * re-applies, and the journal an interrupted erase resumes from.
 *
 * Under the store's own lock table, so two concurrent erases cannot lose each
 * other's entry, and named beside the lock so the file is the one
 * `lib/server/erasures.ts` reads from a restored copy. Idempotent — the
 * `appendErasure` rule — because the workflow writes it FIRST and a retry must
 * not move a timestamp a restore has already reported.
 */
export async function recordErasure(learnerId: string, at: number): Promise<boolean> {
  return withLock(ERASURES_FILE, () => appendErasure(DATA_DIR, learnerId, at));
}

/**
 * Mark one learner's erasure FINISHED, once the workflow has removed the effects
 * and verified the record's absence.
 *
 * The second half of the pair `recordErasure` starts: the instruction is written
 * before the effects so an interrupted erase can be resumed, and this is what
 * distinguishes a finished erase from an abandoned one — the difference the
 * workflow verifies before it reports success.
 */
export async function confirmErasure(learnerId: string, at: number): Promise<boolean> {
  return withLock(ERASURES_FILE, () => confirmErasureInDir(DATA_DIR, learnerId, at));
}

/** The erasure log this store holds. The live half of what a restore re-applies. */
export async function readErasureLog(): Promise<ErasureRecord[]> {
  return readErasures(DATA_DIR);
}

/**
 * One learner's PERSONAL PAPERS, by owner — removed, and how many went.
 */
export async function deletePersonalPapersFor(owner: string): Promise<number> {
  return withLock("personal-papers.json", async () => {
    const all = await readJson<Record<string, PersonalPaper>>("personal-papers.json", {});
    const kept = Object.entries(all).filter(([, p]) => (p as PersonalPaper)?.owner !== owner);
    if (kept.length === Object.keys(all).length) return 0;
    await writeJson("personal-papers.json", Object.fromEntries(kept), "erasure");
    return Object.keys(all).length - kept.length;
  });
}

/**
 * How many learners, rooms and classes this store holds.
 *
 * STRICT on purpose (see `readJsonStrict`): a count is a statement about a school,
 * and a failed read must not become `0`. The old hub door did exactly that — it
 * read `profiles.json` itself and answered `learners: 0` from its `catch` — which
 * is a false statement about the school wearing the costume of an empty one.
 */
export async function counts(): Promise<StoreCounts> {
  const [profiles, rooms, classes] = await Promise.all([
    readJsonStrict<Record<string, ProfileState>>("profiles.json", {}),
    readJsonStrict<StudyRoom[]>("rooms.json", []),
    readJsonStrict<ClassRoster[]>("classes.json", []),
  ]);
  return { learners: Object.keys(profiles).length, rooms: rooms.length, classes: classes.length };
}

/** Remove one learner's membership from every class roster, in place. Used by
 *  the account's own erase path (§23: leaving is part of erasure) and returns
 *  how many rosters changed. Handles recorded under the learner's id are
 *  dropped from the self-report maps too, so the teacher's table stops listing
 *  a member who has left. */
export async function removeMemberEverywhere(profileId: string): Promise<number> {
  return withLock("classes.json", async () => {
    const rosters = await readJson<ClassRoster[]>("classes.json", []);
    let changed = 0;
    // The row is named by IDENTITY, the way every other membership decision names
    // it: `membersById` maps handle -> learner, so looking the learner up in it by
    // their own id would find nothing and leave the erased learner's row (and its
    // binding) in the roster for good. The removal itself lives in
    // class-membership.ts#removeMember, because the erasure a RESTORE re-applies
    // to a restored copy has to remove identically.
    for (const cls of rosters) if (removeMember(cls, profileId)) changed++;
    if (changed > 0) await writeJson("classes.json", rosters, "erasure");
    return changed;
  });
}

/** Every profile state on disk, in one read. Used by the class door to derive
 *  a roster's LIVE mastery from each member's own ledger — one file, one read,
 *  rather than a store probe per student (a class of 45 would otherwise be 45
 *  reads per roster view). Callers see secrets and are expected not to ship
 *  them: the class door maps each state down to its projection immediately. */
export async function listProfileStates(): Promise<ProfileState[]> {
  const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
  return Object.values(all);
}

// ── THE LEARNER TRANSACTION ─────────────────────────────────────────────────
//
// One learner's record and every event that justifies it, as ONE unit, on one
// serialised path. docs/STORAGE_SPEC.md §14 decision 1 specifies it and this is
// the file backend's implementation.
//
// WHY THE LEDGER IS INJECTED RATHER THAN IMPORTED. The file ledger
// (`lib/server/evidence-file.ts`) has exactly ONE importer, `storage-file.ts`,
// and `npm run verify` fails if that stops being true — that rule is what keeps
// "the ledger" and "the JSONL file" from becoming the same import again, which is
// how a backend silently stops being swappable. So the backend REGISTERS its own
// ledger reader/writer here, once, at module load, and the context calls through
// it. (`withLearnerState` below never touches the ledger methods, so a caller that
// reaches the store without a backend loaded — a test, a drill — still works; the
// ledger methods are the only ones that need the registration, and they say so.)
export interface LedgerIO {
  /** This learner's events, in APPEND order — the context applies the ordering rule. */
  read(learnerId: string): EvidenceEvent[];
  append(learnerId: string, events: readonly EvidenceEvent[]): Promise<AppendResult>;
}

let ledgerIO: LedgerIO | null = null;

export function registerLedgerIO(io: LedgerIO): void {
  ledgerIO = io;
}

function ledgerFor(learnerId: string): LedgerIO {
  if (!ledgerIO) {
    throw new Error(
      "this transaction asked for " + learnerId + "'s ledger before a backend registered one " +
      "(lib/server/storage-file.ts calls registerLedgerIO at load) — a ledger operation outside a " +
      "loaded backend is a configuration bug, not a missing learner",
    );
  }
  return ledgerIO;
}

/**
 * THE LEARNER TRANSACTION (§14 decision 1) — and the ONE read-modify-write of
 * `profiles.json` in this codebase.
 *
 * The ordering it enforces is the architecture's, not this file's: the caller
 * WRITES THE EVENT, CONFIRMS THE APPEND, REPLAYS, and only then does the record's
 * write get committed — because the record's write is STAGED here and flushed
 * after `fn` returns. That inversion is the point: a `fn` that throws (an append
 * that failed, a validation that refused, a route that answered 503) leaves the
 * record exactly as it was, so a model that cannot be reconstructed from the
 * ledger is not a state the code can reach.
 *
 * WHAT `fn` CANNOT GET: a second writer. The whole body runs under
 * `profiles.json`'s lock, which is a promise chain for this key — so calling
 * `withLock("profiles.json", …)` from inside `fn` (which `withLearnerState`'s
 * mutator does not, and `commitAndProjectIn` does not: it opens no lock of its own)
 * would QUEUE BEHIND THIS ONE and hang. Nothing inside a transaction may take the
 * profile lock again; that is why the context exists rather than the caller doing
 * both steps.
 *
 * THE LOCK ORDER, unchanged and load-bearing: profiles.json → the learner's
 * ledger. Nothing anywhere takes them the other way round, and this function is
 * where that order is created.
 */
export async function withLearner<T>(
  id: string,
  fn: (ctx: LearnerContext) => T | Promise<T>,
): Promise<T> {
  return withLock("profiles.json", async () => {
    const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
    // The staged write. `null` = nothing to change; `removed` = the record is to
    // be deleted instead. Never both.
    let staged: ProfileState | null = null;
    let removed = false;
    const ctx: LearnerContext = {
      learnerId: id,
      kind: "file",
      getProfile: async () => all[id] ?? null,
      saveProfile: async (state) => {
        if (state.profile.id !== id) {
          throw new Error(`a transaction for ${id} cannot write ${state.profile.id}'s record`);
        }
        staged = state;
        removed = false;
      },
      deleteProfile: async () => {
        if (!all[id]) return false;
        removed = true;
        staged = null;
        return true;
      },
      readEvents: async () => orderEvents(ledgerFor(id).read(id)),
      appendEvents: (events) => ledgerFor(id).append(id, events),
    };
    // Throwing here commits NOTHING: no write has happened yet.
    const result = await fn(ctx);
    if (removed) {
      delete all[id];
      await writeJson("profiles.json", all, "erasure");
    } else if (staged) {
      all[id] = staged;
      await writeJson("profiles.json", all);
    }
    return result;
  });
}

/**
 * Atomic read-modify-write: the mutator runs while the file lock is held, so
 * concurrent handlers (double-fired effects, parallel tabs, racing answers)
 * can never lose each other's updates.
 *
 * A SPECIALISATION of `withLearner`, not a second implementation of it — so the
 * two cannot drift into disagreeing about what a serialised write means. `null`
 * means the learner does not exist, and the mutator is never run for one who does
 * not (creating is not a mutation of an existing learner: §3 Q2 of the spec).
 *
 * THE MUTATOR'S FIRST ARGUMENT IS THE CONTEXT, deliberately (§14 phase C). A
 * mutator taking only the record could append its evidence by resolving the PORT,
 * which on a database backend opens a second connection and deadlocks against the
 * advisory lock this transaction holds — correct on the file backend, and the one
 * failure a unit test on the file backend cannot see. Making the context the
 * first parameter means a mutator that needs the transaction has to name it.
 *
 * The state-only form (`updateProfile`) is gone for that reason: it was a
 * convenience that could only be used correctly by accident.
 */
export async function withLearnerState<T>(
  id: string,
  mutator: (ctx: LearnerContext, state: ProfileState) => T | Promise<T>,
): Promise<{ state: ProfileState; result: T } | null> {
  return withLearner(id, async (ctx) => {
    const state = await ctx.getProfile();
    if (!state) return null;
    const result = await mutator(ctx, state);
    await ctx.saveProfile(state);
    return { state, result };
  });
}

// ── Study packs ─────────────────────────────────────────────────────────────
export async function listPacks(conceptId: string): Promise<StudyPack[]> {
  const all = await readJson<Record<string, StudyPack[]>>("packs.json", {});
  return (all[conceptId] ?? []).sort(
    (a, b) => b.helpful - a.helpful || b.createdAt - a.createdAt,
  );
}

export async function savePack(pack: StudyPack): Promise<void> {
  await withLock("packs.json", async () => {
    const all = await readJson<Record<string, StudyPack[]>>("packs.json", {});
    const list = all[pack.conceptId] ?? [];
    const i = list.findIndex((p) => p.id === pack.id);
    if (i >= 0) list[i] = pack; else list.push(pack);
    all[pack.conceptId] = list.slice(-200);
    await writeJson("packs.json", all);
  });
}

/** All packs across concepts — used by fork/helpful to resolve a pack id. */
export async function readAllPacks(): Promise<StudyPack[]> {
  const all = await readJson<Record<string, StudyPack[]>>("packs.json", {});
  return Object.values(all).flat();
}

// ── Rooms ───────────────────────────────────────────────────────────────────
export async function listRooms(): Promise<StudyRoom[]> {
  const rooms = await readJson<StudyRoom[]>("rooms.json", []);
  return rooms.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
}

export async function saveRoom(room: StudyRoom): Promise<void> {
  await withLock("rooms.json", async () => {
    const rooms = await readJson<StudyRoom[]>("rooms.json", []);
    const i = rooms.findIndex((r) => r.id === room.id);
    if (i >= 0) rooms[i] = room; else rooms.push(room);
    await writeJson("rooms.json", rooms.slice(-500));
  });
}

export async function getRoom(id: string): Promise<StudyRoom | null> {
  const rooms = await readJson<StudyRoom[]>("rooms.json", []);
  return rooms.find((r) => r.id === id) ?? null;
}

/** Atomic read-modify-write on a single room (joins, messages, forks). */
export async function updateRoomById<T>(
  id: string,
  mutator: (room: StudyRoom) => T | Promise<T>,
): Promise<{ room: StudyRoom; result: T } | null> {
  return withLock("rooms.json", async () => {
    const rooms = await readJson<StudyRoom[]>("rooms.json", []);
    const room = rooms.find((r) => r.id === id);
    if (!room) return null;
    const result = await mutator(room);
    await writeJson("rooms.json", rooms.slice(-500));
    return { room, result };
  });
}

// ── Exam papers ─────────────────────────────────────────────────────────────
// A sitting's answer key lives on the server (exactly like a staged practice
// question): the paper handed to the browser has no answers in it, and marking
// reads the key back by the paper's own id. Papers are capped and pruned so a
// school laptop cannot fill the disk with abandoned mocks.

export async function saveStoredPaper(key: BuiltPaperAnswerKey): Promise<void> {
  await withLock("papers.json", async () => {
    const all = await readJson<Record<string, BuiltPaperAnswerKey>>("papers.json", {});
    all[key.id] = key;
    const entries = Object.entries(all).sort((a, b) => b[1].createdAt - a[1].createdAt);
    const trimmed = Object.fromEntries(entries.slice(0, 300));
    await writeJson("papers.json", trimmed);
  });
}

export async function getStoredPaper(id: string): Promise<BuiltPaperAnswerKey | null> {
  const all = await readJson<Record<string, BuiltPaperAnswerKey>>("papers.json", {});
  return all[id] ?? null;
}

// ── Personal papers ─────────────────────────────────────────────────────────
// A learner's OWN paper, brought to OpenMind as marks and concept tags only —
// no question text ever reaches this file, which is what makes storing it
// defensible at all (see lib/content-rights.ts and lib/personal-paper.ts).
// Reads are owner-scoped: a personal paper is private to the learner who made
// it, and the route checks the owner rather than trusting an id.

export async function savePersonalPaper(paper: PersonalPaper): Promise<void> {
  await withLock("personal-papers.json", async () => {
    const all = await readJson<Record<string, PersonalPaper>>("personal-papers.json", {});
    all[paper.id] = paper;
    // Capped and pruned like every other growing store: a school laptop must not
    // fill up with abandoned worksheets. Newest kept.
    const entries = Object.entries(all).sort((a, b) => b[1].createdAt - a[1].createdAt);
    await writeJson("personal-papers.json", Object.fromEntries(entries.slice(0, 2000)));
  });
}

/** Owner-scoped read: returns null when the paper is not THIS learner's. */
export async function getPersonalPaper(id: string, owner: string): Promise<PersonalPaper | null> {
  const all = await readJson<Record<string, PersonalPaper>>("personal-papers.json", {});
  const paper = all[id];
  return paper && paper.owner === owner ? paper : null;
}

export async function listPersonalPapers(owner: string): Promise<PersonalPaper[]> {
  const all = await readJson<Record<string, PersonalPaper>>("personal-papers.json", {});
  return Object.values(all)
    .filter((p) => p.owner === owner)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ── AI result cache ─────────────────────────────────────────────────────────
// Generated content is cached on disk so a school that pays for one AI call can
// serve that question to every learner offline afterwards — and so a paper is
// reproducible on a connection that has since dropped.

export async function cacheGet(key: string): Promise<unknown | null> {
  const all = await readJson<Record<string, unknown>>("ai-cache.json", {});
  return all[key] ?? null;
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  // The cache is disposable by design — a lost entry costs one model call, and
  // nothing a learner was promised rests on it — so a refusal to write here must
  // never fail the request that produced the value. Every other write in this
  // file lets the refusal through.
  try {
    await withLock("ai-cache.json", async () => {
      const all = await readJson<Record<string, unknown>>("ai-cache.json", {});
      all[key] = value;
      const entries = Object.entries(all).slice(-4000);
      await writeJson("ai-cache.json", Object.fromEntries(entries));
    });
  } catch (e) {
    if (e instanceof StoreWriteBlockedError) return;
    throw e;
  }
}

// ── Classes ─────────────────────────────────────────────────────────────────

/**
 * Does this roster still carry the shape written before member ids existed?
 *
 * Two shapes, and both are the same missing fact: a row with no identity
 * (written before member ids existed), and a member with no row (a learner whose
 * row the old join rebound onto somebody else).
 */
function needsIdentity(cls: ClassRoster): boolean {
  if (Object.keys(cls.students ?? {}).some((h) => !cls.membersById?.[h])) return true;
  return (cls.members ?? []).some((id) => !hasRow(cls, id));
}

/**
 * THE LEGACY-ROSTER REPAIR — EXPLICIT, IDEMPOTENT, AND NO LONGER A SIDE EFFECT
 * OF READING.
 *
 * A roster written before member ids existed holds `students: { handle: … }` and
 * nothing that says WHO those handles are. Reconciling it means matching names
 * ONCE and writing the identity down (lib/server/class-membership#bindLegacyHandles
 * — the alternative was matching a name on every read, which let a stranger into
 * a class).
 *
 * It used to run inside `listClasses`/`getClass`: every roster READ took
 * `profiles.json`, rewrote `classes.json`, and swallowed a write failure with
 * `.catch(() => {})`. Three things wrong with that, all of them F-3 of
 * docs/STORAGE_SPEC.md §13: a read mutated durable state, a read could never
 * report the write it was making, and a failure to repair was invisible — a
 * teacher's table silently missing rows, with no error anywhere. So it is now a
 * named operation with a named caller, it PROPAGATES its failure, and the two
 * read functions below are pure.
 *
 * Safe to call repeatedly: a bound handle is skipped, and an ambiguous one is
 * simply tried again (it binds the moment the name is unambiguous, which is the
 * only time a guess is not a guess).
 */
export async function reconcileClassIdentities(): Promise<{ classes: number; repaired: number }> {
  return withLock("classes.json", async () => {
    const all = await readJson<ClassRoster[]>("classes.json", []);
    if (!all.some(needsIdentity)) return { classes: all.length, repaired: 0 };
    const states = await listProfileStates();
    let repaired = 0;
    for (const cls of all) if (bindLegacyHandles(cls, states)) repaired++;
    if (repaired > 0) await writeJson("classes.json", all);
    return { classes: all.length, repaired };
  });
}

/** Every roster, exactly as stored. A READ: it writes nothing, repairs nothing
 *  and takes no lock — see `reconcileClassIdentities` for the repair, which is
 *  the caller's explicit step. */
export async function listClasses(): Promise<ClassRoster[]> {
  return readJson<ClassRoster[]>("classes.json", []);
}

export async function saveClass(cls: ClassRoster): Promise<void> {
  await withLock("classes.json", async () => {
    const all = await readJson<ClassRoster[]>("classes.json", []);
    const i = all.findIndex((c) => c.id === cls.id);
    if (i >= 0) all[i] = cls; else all.push(cls);
    await writeJson("classes.json", all);
  });
}

export async function getClass(id: string): Promise<ClassRoster | null> {
  const all = await listClasses();
  return all.find((c) => c.id === id) ?? null;
}

/** Atomic read-modify-write on a class located by join code. */
export async function updateClassByCode<T>(
  code: string,
  mutator: (cls: ClassRoster) => T | Promise<T>,
): Promise<{ cls: ClassRoster; result: T } | null> {
  return withLock("classes.json", async () => {
    const all = await readJson<ClassRoster[]>("classes.json", []);
    const cls = all.find((c) => c.joinCode === code.toUpperCase());
    if (!cls) return null;
    const result = await mutator(cls);
    await writeJson("classes.json", all);
    return { cls, result };
  });
}

/** Atomic read-modify-write on a class located by id. Used by the assignment
 *  door, which knows the class it is editing (the id is in the assignment it
 *  was handed) rather than its join code. Same lock as every other class write,
 *  so an assignment cannot interleave with a join. */
export async function updateClassById<T>(
  id: string,
  mutator: (cls: ClassRoster) => T | Promise<T>,
): Promise<{ cls: ClassRoster; result: T } | null> {
  return withLock("classes.json", async () => {
    const all = await readJson<ClassRoster[]>("classes.json", []);
    const cls = all.find((c) => c.id === id);
    if (!cls) return null;
    const result = await mutator(cls);
    await writeJson("classes.json", all);
    return { cls, result };
  });
}

/**
 * AN ID, RANDOMLY — 122 bits of it, from the platform's own generator.
 *
 * The old shape was `<base36 millis><6 random base36>` and it was F-4 of
 * docs/STORAGE_SPEC.md §13. Two ids minted in the same millisecond collided with
 * probability ~1 in 2·10⁹, which is fine for a file store and NOT an answer to
 * "how does a database keep this unique": a database's guarantee is a PRIMARY KEY,
 * the id has to be unique BEFORE the constraint is consulted or every insert
 * becomes a retry, and a collision there is a failed insert for a learner who did
 * nothing wrong. It also leaked the creation time off the id wherever an id is
 * visible (a URL, an export). `randomUUID` is the platform's CSPRNG, and the
 * dashes are dropped so the result stays one path-safe token for the ledger's
 * file names.
 */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}
/** Normalise an email: trim and lowercase. Used by account operations so the
 * same address typed differently is always the same key. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Generate a random scrypt salt (16 bytes = 128 bits). */
export function makeSalt(): string {
  return randomBytes(16).toString("hex");
}

/** scrypt(password, salt, 64) -> hex. Kept here so account operations in the
 * file store do not need to import from auth.ts and create a circular dependency.
 */
export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}


/** The alphabet a join code is drawn from: no I, L, O, 0 or 1, because a learner
 *  reads this off a whiteboard and types it on a phone keypad. 31 characters, so
 *  six of them is ~2^29.6 — enough that a collision is an accident rather than a
 *  routine event, and small enough to write down. */

// ── Accounts: the identity half of the store ────────────────────────────────
//
// THE ONE IMPLEMENTATION, and it lives here rather than in `lib/server/auth.ts`
// for a reason that is a bug this project had: `auth.ts` used to own
// `accounts.json` privately (its own reader, its own writer, its own lock), so the
// file had two writers whose only shared protection was that both of them
// happened to take the same lock. That is the same defect the store's `locks` map
// and `DATA_DIR` were centralised to remove, one layer up — and it meant an account
// could not be described by the storage port at all, which is what slice 4 needs.
//
// So this is the FILE backend's account implementation. `auth.ts` keeps what is
// genuinely authentication (hashing, the session token, the cookie) and asks the
// port for the rest; a Postgres backend implements these ten methods against the
// `users`/`sessions` tables (db/migrations/0006_learner_identity.up.sql) instead.
//
// TWO RULES THAT ARE EASY TO GET WRONG HERE:
//
//   · writes pass `"identity"`, so a password change, a sign-out and an account
//     rename work on a deployment whose store has refused LEARNER records. A
//     learner must be able to sign out precisely when the disk is wrong; refusing
//     that would leave them signed in. (The refusal exists for records that would
//     be silently lost, not for the account that names who is signed in.)
//   · every write is inside `withLock("accounts.json", …)`, and every decision
//     that depends on what is in the file ("is this email free?") is made INSIDE
//     that lock. Checking and then inserting across two calls is the shape F-4
//     names: the check protects nothing, and two concurrent sign-ups with the same
//     address can both pass it.
export async function getAccount(id: string): Promise<Account | null> {
  const all = await readJson<Record<string, Account>>("accounts.json", {});
  return all[id] ?? null;
}

export async function findAccountByEmail(email: string): Promise<Account | null> {
  const target = normaliseEmail(email);
  const all = await readJson<Record<string, Account>>("accounts.json", {});
  return Object.values(all).find((a) => a.email === target) ?? null;
}

/**
 * The account that already owns a learner profile, if any.
 *
 * "An account owns exactly one learner profile" is the invariant the auth module
 * is built on, and it only holds if a profile is handed to an account ONCE. Two
 * accounts pointing at one profile is not a merge of two learners — it is a
 * stranger inside someone else's record, and the newcomer's own enrolment then
 * rewrites the owner's course, year and name.
 *
 * This is the question every adoption path must ask before it binds anything. It
 * cannot be answered from the profile's secret: a device that holds a session
 * always holds that profile's secret, so "the secret matched" says nothing about
 * whether the profile is anonymous. Ownership is the fact.
 */
export async function accountOwningProfile(
  profileId: string,
  exceptAccountId?: string,
): Promise<Account | null> {
  if (!profileId) return null;
  const all = await readJson<Record<string, Account>>("accounts.json", {});
  return Object.values(all).find((a) => a.profileId === profileId && a.id !== exceptAccountId) ?? null;
}

export async function countAccounts(): Promise<number> {
  return Object.keys(await readJson<Record<string, Account>>("accounts.json", {})).length;
}

export async function createAccount(input: {
  email: string;
  password: string;
  name: string;
  role?: AccountRole;
  profileId: string;
}): Promise<Account> {
  return withLock("accounts.json", async () => {
    const all = await readJson<Record<string, Account>>("accounts.json", {});
    const email = normaliseEmail(input.email);
    if (Object.values(all).some((a) => a.email === email)) throw new Error("email_taken");
    const salt = makeSalt();
    const account: Account = {
      id: newId("acc"),
      email,
      name: input.name.trim().slice(0, 40) || email.split("@")[0],
      role: input.role ?? "student",
      salt,
      passHash: hashPassword(input.password, salt),
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      profileId: input.profileId,
      verified: false,
    };
    all[account.id] = account;
    await writeJson("accounts.json", all, "identity");
    return account;
  });
}

export async function setAccountProfile(accountId: string, profileId: string): Promise<Account | null> {
  return withLock("accounts.json", async () => {
    const all = await readJson<Record<string, Account>>("accounts.json", {});
    const a = all[accountId];
    if (!a) return null;
    a.profileId = profileId;
    a.lastSeenAt = Date.now();
    await writeJson("accounts.json", all, "identity");
    return a;
  });
}

export async function touchAccount(accountId: string): Promise<void> {
  await withLock("accounts.json", async () => {
    const all = await readJson<Record<string, Account>>("accounts.json", {});
    const a = all[accountId];
    if (!a) return;
    a.lastSeenAt = Date.now();
    await writeJson("accounts.json", all, "identity");
  });
}

export async function updateAccount(
  accountId: string,
  patch: { name?: string; role?: AccountRole },
): Promise<Account | null> {
  return withLock("accounts.json", async () => {
    const all = await readJson<Record<string, Account>>("accounts.json", {});
    const a = all[accountId];
    if (!a) return null;
    if (typeof patch.name === "string" && patch.name.trim()) a.name = patch.name.trim().slice(0, 40);
    if (patch.role) a.role = patch.role;
    await writeJson("accounts.json", all, "identity");
    return a;
  });
}

export async function setPassword(accountId: string, password: string): Promise<void> {
  await withLock("accounts.json", async () => {
    const all = await readJson<Record<string, Account>>("accounts.json", {});
    const a = all[accountId];
    if (!a) return;
    a.salt = makeSalt();
    a.passHash = hashPassword(password, a.salt);
    await writeJson("accounts.json", all, "identity");
  });
}

/**
 * Store (or clear) a learner's recovery code, as a hash plus salt.
 *
 * Clearing is expressed as `null` rather than a separate method because the two
 * halves of the workflow — "a learner has a code" and "a learner has none yet" —
 * are the same write with different content, and two methods would let a caller do
 * one and forget the other. The fields are deleted rather than blanked so an
 * account without a code is distinguishable from one with an empty string.
 */
export async function setRecoveryCode(
  accountId: string,
  code: { salt: string; hash: string } | null,
): Promise<Account | null> {
  return withLock("accounts.json", async () => {
    const all = await readJson<Record<string, Account>>("accounts.json", {});
    const a = all[accountId];
    if (!a) return null;
    if (code) {
      a.recoverySalt = code.salt;
      a.recoveryHash = code.hash;
    } else {
      delete a.recoverySalt;
      delete a.recoveryHash;
    }
    await writeJson("accounts.json", all, "identity");
    return a;
  });
}

/**
 * Store (or clear) a teacher-issued reset grant.
 *
 * The expiry is part of the SAME write as the hash, deliberately: an expiry written
 * afterwards is a window in which a grant exists with no end date, and a crash
 * between the two writes would leave a code that never stops working.
 */
export async function setResetGrant(
  accountId: string,
  grant: { salt: string; hash: string; expiresAt: number } | null,
): Promise<Account | null> {
  return withLock("accounts.json", async () => {
    const all = await readJson<Record<string, Account>>("accounts.json", {});
    const a = all[accountId];
    if (!a) return null;
    if (grant) {
      a.resetSalt = grant.salt;
      a.resetHash = grant.hash;
      a.resetExpiresAt = grant.expiresAt;
    } else {
      delete a.resetSalt;
      delete a.resetHash;
      delete a.resetExpiresAt;
    }
    await writeJson("accounts.json", all, "identity");
    return a;
  });
}

/**
 * The account a teacher-issued grant belongs to, from its LOOKUP KEY.
 *
 * The key is the first eight hex characters of the account id (see
 * `resetKeyFor` in lib/recovery-code.ts), so this is a prefix scan. That is
 * acceptable for the file store — a school's roll is thousands, not millions — and
 * it is why the key is public: it shortlists ONE account, and the secret half of
 * the code still has to verify against that account's hash. A database backend
 * answers this with an index; the port is what makes that a swap rather than a
 * rewrite.
 */
export async function findAccountByResetKey(key: string): Promise<Account | null> {
  const wanted = key.trim().toUpperCase();
  if (wanted.length !== 8) return null;
  const all = await readJson<Record<string, Account>>("accounts.json", {});
  return Object.values(all).find((a) => resetKeyFor(a.id) === wanted) ?? null;
}

export async function revokeSessions(accountId: string): Promise<void> {
  await withLock("accounts.json", async () => {
    const all = await readJson<Record<string, Account>>("accounts.json", {});
    const a = all[accountId];
    if (!a) return;
    a.sessionEpoch = (a.sessionEpoch ?? 0) + 1;
    await writeJson("accounts.json", all, "identity");
  });
}
const JOIN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function joinCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += JOIN_ALPHABET[Math.floor(Math.random() * JOIN_ALPHABET.length)];
  return s;
}

/**
 * CREATE A CLASS, WITH A JOIN CODE NOBODY ELSE HOLDS.
 *
 * F-4 again, and the shape is the whole point: the code is chosen and inserted
 * inside ONE lock, so "is this code free?" and "write it" cannot be separated by
 * another request — which is what a check-then-insert across two calls would do
 * (that is the exact pattern the storage rule forbids: never decide a value is
 * available and insert it later with nothing protecting the decision).
 *
 * The `build` callback receives the code so the caller cannot forget to use the
 * one that was checked.
 *
 * A DATABASE'S guarantee is stronger and lives in the schema, not here:
 * `classes_join_code_live_key` (db/migrations/0001_initial.up.sql) is a UNIQUE
 * index on `upper(join_code)` over live classes. This loop is where that index's
 * answer is honoured too — a unique violation is a collision, and the retry is
 * the same next attempt. What must never happen is a SECOND live class holding a
 * code a learner already has on a whiteboard, because a learner would then be
 * enrolled in the wrong room by a correct action.
 */
export async function createClass(build: (joinCode: string) => ClassRoster): Promise<ClassRoster> {
  return withLock("classes.json", async () => {
    const all = await readJson<ClassRoster[]>("classes.json", []);
    for (let attempt = 0; attempt < 32; attempt++) {
      const code = joinCode();
      if (all.some((c) => (c.joinCode ?? "").toUpperCase() === code)) continue;
      const cls = build(code);
      all.push(cls);
      await writeJson("classes.json", all);
      return cls;
    }
    throw new Error("no free join code after 32 attempts — the code space is exhausted, not unlucky");
  });
}

// ── CLASSROOM SESSIONS ──────────────────────────────────────────────────────
//
// A supervised classroom cannot hold 40 permanent bearer capabilities on three
// handsets. That is the whole finding of the shared-device audit: the roster
// keeps each learner's secret in cleartext, so anyone holding the phone holds
// every learner. A classroom handset needs the opposite property — a credential
// that (a) is not the learner's permanent secret, (b) the SERVER can end, and
// (c) dies on its own.
//
// So a kiosk learner authenticates with a PIN the teacher issued, and receives a
// session TOKEN instead of a capability. The token is what the existing
// `secret` plumbing carries, which is why no route had to learn a second
// transport: the difference is enforced where the decision is made
// (lib/server/capability.ts marks it `via: "kiosk"`), and every door that must
// refuse a classroom session asks that flag rather than re-parsing anything.
//
// WHAT IS STORED, AND WHY IT IS A HASH. The file holds sha256(token), never the
// token: a copy of `kiosk-sessions.json` (a backup, a support bundle, an
// operator reading a school's volume) must not be a set of live credentials.
// Lookup is by hash, so there is no comparison to make constant-time — the map
// either has the key or it does not.
export const KIOSK_SESSIONS_FILE = "kiosk-sessions.json";

export interface KioskSessionRecord {
  profileId: string;
  classId: string;
  createdAt: number;
  expiresAt: number;
}

/** sha256 of a session token. The token itself is 256 random bits and is shown
 *  once, to the device that just proved the PIN. */
function hashKioskToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** scrypt, like a password. A six-digit PIN has ~20 bits: `hashPassword` in this
 *  file is the right primitive, and the rate limiter is the other half of the
 *  answer (a PIN space that small is only safe when attempts are bounded). */
export function kioskPinHash(pin: string, salt: string): string {
  return scryptSync(pin.trim(), salt, 64).toString("hex");
}

/** Six digits, uniformly drawn — `randomInt` (not `Math.random`) because this is
 *  a credential. Written as a string so a leading zero is preserved: `012345` and
 *  `12345` are different PINs and a number would merge them. */
export function mintKioskPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** A token the device presents as its secret: 256 random bits, hex. */
export function mintKioskToken(): string {
  return randomBytes(32).toString("hex");
}

/** A profile's permanent capability, generated but NEVER disclosed — used by a
 *  teacher-provisioned classroom learner, whose only usable credential is the
 *  session its PIN is exchanged for. It is written because every learner record
 *  has one (a profile with an empty secret is a profile the first writer could
 *  claim), and it must not be mistaken for the classroom credential: nobody is
 *  ever shown this string. */
export function mintUnshownSecret(): string {
  return randomBytes(32).toString("hex");
}

export async function createKioskSession(
  profileId: string,
  classId: string,
  ttlMs: number,
): Promise<{ token: string; expiresAt: number }> {
  const token = mintKioskToken();
  const now = Date.now();
  const expiresAt = now + Math.max(60_000, Math.min(ttlMs, 12 * 60 * 60 * 1000));
  await withLock(KIOSK_SESSIONS_FILE, async () => {
    const all = await readJson<Record<string, KioskSessionRecord>>(KIOSK_SESSIONS_FILE, {});
    // Expired rows are dropped on every write: a file that only grows is a file
    // an operator has to reason about, and an expired row is not a credential.
    for (const [k, v] of Object.entries(all)) if (v.expiresAt <= now) delete all[k];
    all[hashKioskToken(token)] = { profileId, classId, createdAt: now, expiresAt };
    // `identity` purpose: a store that has refused learner records must still be
    // able to END a session, and creating one is pointless there anyway (the
    // learner it names could not be written). It is also never refused, which is
    // what keeps sign-out working on every deployment.
    await writeJson(KIOSK_SESSIONS_FILE, all, "identity");
  });
  return { token, expiresAt };
}

/** The live session this token names, or null. Expiry is checked HERE, on the
 *  server, because the client's clock is the attacker's to change. */
export async function resolveKioskSession(token: string): Promise<KioskSessionRecord | null> {
  if (typeof token !== "string" || token.length < 32) return null;
  const all = await readJson<Record<string, KioskSessionRecord>>(KIOSK_SESSIONS_FILE, {});
  const found = all[hashKioskToken(token)];
  if (!found) return null;
  if (found.expiresAt <= Date.now()) return null;
  return found;
}

/** Hand-back. Deleting the row is what makes the token dead SERVER-SIDE, so a
 *  copied token (a history entry, a synced profile, a run of the browser console)
 *  is worth nothing after the learner leaves — which clearing the phone alone
 *  could never achieve. */
export async function deleteKioskSession(token: string): Promise<void> {
  if (typeof token !== "string" || !token) return;
  await withLock(KIOSK_SESSIONS_FILE, async () => {
    const all = await readJson<Record<string, KioskSessionRecord>>(KIOSK_SESSIONS_FILE, {});
    const key = hashKioskToken(token);
    if (!all[key]) return;
    delete all[key];
    await writeJson(KIOSK_SESSIONS_FILE, all, "identity");
  });
}

/** Every session for a learner — an erasure, or a teacher re-issuing a PIN. */
export async function deleteKioskSessionsFor(profileId: string): Promise<void> {
  await withLock(KIOSK_SESSIONS_FILE, async () => {
    const all = await readJson<Record<string, KioskSessionRecord>>(KIOSK_SESSIONS_FILE, {});
    let changed = false;
    for (const [k, v] of Object.entries(all)) {
      if (v.profileId === profileId) { delete all[k]; changed = true; }
    }
    if (changed) await writeJson(KIOSK_SESSIONS_FILE, all, "identity");
  });
}
