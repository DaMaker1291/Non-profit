// ─────────────────────────────────────────────────────────────────────────────
// AN ERASURE IS AN INSTRUCTION, NOT JUST A DELETION.
//
// `docs/PRIVACY.md` §7 promises a learner-initiated erase takes the profile, the
// evidence ledger and every class membership — and it does. §7 also admits the
// hole underneath it, in one sentence: "deletion in the live store is not
// deletion in an old backup". Both are true, and the second one is the whole
// reason this module exists:
//
//   · a backup taken BEFORE an erasure still holds that learner;
//   · restoring it — the thing a backup is FOR — puts them back, in a store that
//     then answers questions about somebody who asked to be forgotten;
//   · and no amount of expiry fixes the interval in which that is possible.
//
// So the erase records an INTENT while it removes the data (`erasures.json`:
// learner id + when), and a restore RE-APPLIES that intent to whatever store it
// just materialised. The log is tiny and append-only — one line per instruction,
// plus one line when the erase is CONFIRMED, because the SQL twin of this file is
// append-only BY TRIGGER and a completion is therefore a second record rather than
// an edit of the first — so it
// is the one file worth carrying beside the archives — that is why
// `npm run restore-drill` takes `--erasure-source`.
//
// Three properties this module is built to keep:
//
//   1. It never touches DATA_DIR itself. Every function takes the directory it
//      operates on, because its most important caller is a RESTORED COPY that is
//      not the live store — and a module that could only erase the live store
//      would be useless exactly when it matters.
//   2. It reuses the membership rule (`removeMember`) rather than reimplementing
//      it, so an erased learner cannot survive in a roster on one path and not
//      the other.
//   3. Applying is IDEMPOTENT and TOTAL, and that is now one workflow shared with
//      the live path (`lib/server/erasure.ts`): an entry naming a learner who is
//      already gone is a no-op, and one naming a learner who is present removes
//      the profile, the ledger, their personal papers and their class membership.
//      Partial erasure is what makes "we deleted it" false.
//
// What it does NOT do: delete the learner's ACCOUNT (an erase keeps the email and
// password — a deliberate two-step, see the route), edit an archive in place
// (archives are immutable; that is what expiry is for), or invent an erasure.
// Only `recordErasure` writes, and only after the profile is really gone.
// ─────────────────────────────────────────────────────────────────────────────
import { promises as fs } from "fs";
import path from "path";
import { removeMember } from "./class-membership";
// THE WORKFLOW. This module owns the LOG — reading it, appending to it, and
// tolerating the shapes an operator may have had to hand-edit during a recovery —
// and the erasure itself belongs to `lib/server/erasure.ts`, which is also what the
// live route calls. Importing it in this direction (log → workflow) is the only
// direction that works: the workflow must not know what a restored directory is.
import { SAFE_LEARNER_ID as SAFE_ID, eraseLearner, type ErasureTarget } from "./erasure";
import type { ClassRoster } from "../types";
import type { PersonalPaper } from "../personal-paper";

/** The one file name. Exported so the store and the drills name the same file. */
export const ERASURES_FILE = "erasures.json";
/** Where a learner's ledger lives, relative to a store directory. */
const EVIDENCE_DIR = "evidence";

/**
 * WHAT A LINE IN THE LOG IS.
 *
 *   recorded  — the INSTRUCTION: "this learner asked to be forgotten".
 *   completed — the CONFIRMATION: "the effects are gone", appended AFTER it.
 *
 * TWO RECORDS AND NOT ONE MUTABLE ONE, and the schema is what decided it.
 * `docs/STORAGE_SPEC.md` §14.2 first expressed the finish as a `completedAt`
 * field rewritten onto the instruction, which made the log's second write an
 * UPDATE — and the Postgres twin of this file is append-only BY TRIGGER
 * (`db/migrations/0004_port_gaps.up.sql`), with `npm run db:verify` asserting
 * "an erasure cannot be UPDATED (the log is append-only too)". The schema's own
 * guard even prescribes the fix: "Append a correcting record instead." So a
 * completion is a SECOND LINE, the log stays append-only in BOTH backends, and
 * "did this erase finish?" is a fold over records rather than a field —
 * `erasureStateFor`/`incompleteErasures` below are that fold, and one owner of it.
 */
export type ErasureEntry = "recorded" | "completed";

export interface ErasureRecord {
  /** Which record this is — see `ErasureEntry`. Absent on a line written before
   *  completions existed, which `rawEntries` reads as an instruction. */
  entry?: ErasureEntry;
  /** The learner id that was erased. An id, never a handle: handles are reusable. */
  learnerId: string;
  /** When THIS record was written (server clock): the moment the learner asked,
   *  for an instruction — which is what a restore reports having re-applied — or
   *  the moment the erase finished, for a completion. */
  at: number;
  /** For a completion: the `at` of the instruction it finishes. A learner can be
   *  erased, re-created and erased again, and each instruction gets its own
   *  confirmation — the same pairing the SQL log's primary key makes explicit. */
  of?: number;
}

export interface ErasureLog {
  version: 1;
  entries: ErasureRecord[];
}

export interface ApplyOutcome {
  /** Entries applied (the size of the log, not of its effect). */
  named: number;
  profiles: number;
  ledgers: number;
  personalPapers: number;
  rosters: number;
}

// A learner id we are willing to use as a path segment lives in the workflow
// (SAFE_LEARNER_ID, imported above): this log unlinks files named by ids that may
// have travelled through a backup, and a `../` in one must never reach the
// filesystem — the same rule must hold for the live erase and for a restore, so
// there is one definition and it belongs to the code that unlinks.

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback; // absent or unreadable — the same rule the store uses
  }
}

/** The erasure log of a store directory. Empty when the store has never erased
 *  anyone, which is NOT the same as "no erasure can have happened": a store that
 *  predates this file has a log of nothing and an unknown history. */
export async function readErasures(dir: string): Promise<ErasureRecord[]> {
  return (await rawEntries(path.join(dir, ERASURES_FILE))).filter((e) => SAFE_ID.test(e.learnerId));
}

/**
 * Record one erasure INSTRUCTION.
 *
 * Idempotent by identity AND moment: re-applying the same (learner, `at`) pair
 * — which is exactly what a retry and a re-applied restore log do — writes
 * nothing, so a crash cannot grow the file or move the moment it names. A learner
 * erased a SECOND time after being re-created carries a new `at`, and gets a
 * second instruction: the log is a HISTORY, which is the same rule the SQL log's
 * primary key `(learner_id, erased_at)` states.
 *
 * The caller supplies the directory and the clock rather than this function
 * reading either: the store writes its own DATA_DIR under its own lock (one lock
 * table, see `lib/server/store.ts`), and a test writes a temp directory.
 */
export async function appendErasure(dir: string, learnerId: string, at: number): Promise<boolean> {
  if (!SAFE_ID.test(learnerId)) return false;
  const file = path.join(dir, ERASURES_FILE);
  const entries = await rawEntries(file);
  if (entries.some((e) => e.entry !== "completed" && e.learnerId === learnerId && e.at === at)) return false;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    file,
    JSON.stringify({ version: 1, entries: [...entries, { entry: "recorded", learnerId, at }] }, null, 2),
    "utf8",
  );
  return true;
}

/**
 * The log's entries, as records — including the shapes an operator may have had
 * to hand-edit during a recovery.
 *
 * Tolerates a bare array (the log is a file somebody may have to fix by hand),
 * and reads a LEGACY line — `{ learnerId, at, completedAt }`, written before a
 * completion became its own record — as BOTH records it was standing for: the
 * instruction at `at`, and a completion at `completedAt` for it. That is what
 * keeps a store written by the previous version readable by this one, which for
 * an erasure log is not a nicety: the alternative is a restore that resurrects
 * somebody whose erase it could not parse.
 */
async function rawEntries(file: string): Promise<ErasureRecord[]> {
  const existing = await readJson<ErasureLog | ErasureRecord[]>(file, { version: 1, entries: [] });
  const stored = Array.isArray(existing) ? existing : (existing.entries ?? []);
  const out: ErasureRecord[] = [];
  for (const e of stored) {
    if (!e || typeof e.learnerId !== "string") continue;
    const at = typeof e.at === "number" ? e.at : 0;
    if (e.entry === "completed") {
      out.push({ entry: "completed", learnerId: e.learnerId, at, of: typeof e.of === "number" ? e.of : at });
      continue;
    }
    out.push({ entry: "recorded", learnerId: e.learnerId, at });
    const legacyCompleted = (e as { completedAt?: unknown }).completedAt;
    if (typeof legacyCompleted === "number") {
      out.push({ entry: "completed", learnerId: e.learnerId, at: legacyCompleted, of: at });
    }
  }
  return out;
}

/**
 * Mark a learner's erase FINISHED — the step that runs only after the effects
 * have been removed and the record's absence verified.
 *
 * APPENDS a completion record; it never rewrites the instruction, because the log
 * is append-only in both backends (see `ErasureEntry`). Idempotent: an erase that
 * already has its confirmation for the latest instruction is left alone, so a
 * retry or a re-applied log cannot move the moment the erase finished. False
 * means there was nothing to confirm — no instruction at all, or one already
 * completed, either of which the caller should not treat as an error.
 */
export async function confirmErasure(dir: string, learnerId: string, at: number): Promise<boolean> {
  if (!SAFE_ID.test(learnerId)) return false;
  const file = path.join(dir, ERASURES_FILE);
  const entries = await rawEntries(file);
  const state = erasureStateFor(entries, learnerId);
  if (state.recordedAt === null || state.completedAt !== null) return false;
  await fs.writeFile(
    file,
    JSON.stringify(
      { version: 1, entries: [...entries, { entry: "completed", learnerId, at, of: state.recordedAt }] },
      null,
      2,
    ),
    "utf8",
  );
  return true;
}

/** The INSTRUCTIONS in a log, in the order they were written. */
export function instructionsOf(entries: readonly ErasureRecord[]): ErasureRecord[] {
  return entries.filter((e) => e.entry !== "completed");
}

/**
 * What this log says about ONE learner: when they asked, when it finished (null
 * if it has not), and whether the latest instruction is unfinished.
 *
 * The LATEST instruction is the one that answers it, deliberately. A learner whose
 * first erase was interrupted and whose retry completed has one abandoned
 * instruction and one finished one, and what an operator needs to know about them
 * is the retry's answer, not the first attempt's. Reading per-instruction instead
 * would report every retried erase as permanently abandoned.
 */
export function erasureStateFor(
  entries: readonly ErasureRecord[],
  learnerId: string,
): { recordedAt: number | null; completedAt: number | null; incomplete: boolean } {
  const mine = instructionsOf(entries).filter((e) => e.learnerId === learnerId);
  if (mine.length === 0) return { recordedAt: null, completedAt: null, incomplete: false };
  const latest = mine.reduce((a, b) => (b.at > a.at ? b : a));
  const done = entries.find(
    (e) => e.entry === "completed" && e.learnerId === learnerId && (e.of ?? -1) === latest.at,
  );
  return { recordedAt: latest.at, completedAt: done ? done.at : null, incomplete: !done };
}

/** The erases this log records that have NOT been confirmed finished — the
 *  learners whose LATEST instruction is unanswered. What an operator (or a
 *  drill) needs in order to see an erase that was abandoned. */
export function incompleteErasures(entries: readonly ErasureRecord[]): ErasureRecord[] {
  return instructionsOf(entries).filter((e) => {
    const state = erasureStateFor(entries, e.learnerId);
    return state.incomplete && state.recordedAt === e.at;
  });
}

/**
 * A DIRECTORY AS AN ERASURE TARGET.
 *
 * This is the restore half: point it at a freshly restored directory and the
 * learners the log names are removed from that copy — profile, ledger, personal
 * papers and class membership — so an archive taken before the erase cannot
 * resurrect them.
 *
 * It reads and writes files by ABSOLUTE PATH under `dir`, never through the store,
 * because its most important caller is a restored copy that is not the live store
 * (`npm run restore-drill`). Nothing here may name `DATA_DIR` for any reason.
 */
export function dirErasureTarget(dir: string): ErasureTarget {
  const profilesFile = path.join(dir, "profiles.json");
  const papersFile = path.join(dir, "personal-papers.json");
  const classesFile = path.join(dir, "classes.json");
  return {
    label: `the store at ${dir}`,
    hasRecord: async (id) => {
      const profiles = await readJson<Record<string, unknown> | null>(profilesFile, null);
      return Boolean(profiles && id in profiles);
    },
    removeRecord: async (id) => {
      const profiles = await readJson<Record<string, unknown> | null>(profilesFile, null);
      if (!profiles || !(id in profiles)) return false;
      delete profiles[id];
      await fs.writeFile(profilesFile, JSON.stringify(profiles), "utf8");
      return true;
    },
    removeLedger: async (id) => {
      try {
        await fs.unlink(path.join(dir, EVIDENCE_DIR, `${id}.jsonl`));
        return true;
      } catch {
        return false; // no ledger for this learner — nothing to remove
      }
    },
    removePersonalPapers: async (id) => {
      const papers = await readJson<Record<string, PersonalPaper> | null>(papersFile, null);
      if (!papers) return 0;
      const kept = Object.entries(papers).filter(([, p]) => (p as PersonalPaper)?.owner !== id);
      if (kept.length === Object.keys(papers).length) return 0;
      await fs.writeFile(papersFile, JSON.stringify(Object.fromEntries(kept)), "utf8");
      return Object.keys(papers).length - kept.length;
    },
    removeMemberships: async (id) => {
      const rosters = await readJson<ClassRoster[] | null>(classesFile, null);
      if (!rosters) return 0;
      let changed = 0;
      // Through the ONE membership rule, so a learner erased here leaves a roster
      // exactly as they would on the live path.
      for (const cls of rosters) if (removeMember(cls, id)) changed++;
      if (changed > 0) await fs.writeFile(classesFile, JSON.stringify(rosters), "utf8");
      return changed;
    },
    recordIntent: (id, at) => appendErasure(dir, id, at),
    completeIntent: (id, at) => confirmErasure(dir, id, at),
  };
}

/**
 * RE-APPLY an erasure log to the store at `dir`.
 *
 * The restore half of `docs/PRIVACY.md` §7, and now a thin loop over the SAME
 * workflow the live route runs: idempotent, safe on a store where the learners are
 * already gone, and no longer a second implementation of "what an erase removes"
 * (which is how the two paths came to disagree about personal papers).
 */
export async function applyErasures(dir: string, entries: readonly ErasureRecord[]): Promise<ApplyOutcome> {
  const ids = [...new Set(entries.map((e) => e.learnerId).filter((id) => SAFE_ID.test(id)))];
  const outcome: ApplyOutcome = { named: entries.length, profiles: 0, ledgers: 0, personalPapers: 0, rosters: 0 };
  if (ids.length === 0) return outcome;
  const target = dirErasureTarget(dir);
  for (const id of ids) {
    // The timestamp rides through so a restored copy reports WHEN the learner
    // asked, rather than the moment the copy was restored.
    const at = entries.find((e) => e.learnerId === id)?.at ?? Date.now();
    const done = await eraseLearner(target, id, at);
    if (done.record) outcome.profiles++;
    if (done.ledger) outcome.ledgers++;
    outcome.personalPapers += done.personalPapers;
    outcome.rosters += done.memberships;
  }
  return outcome;
}

/** Is this learner named by the log? The question a restore must answer before it
 *  serves anybody: "this id is in the archive — was it erased afterwards?" */
export function isErased(entries: readonly ErasureRecord[], learnerId: string): boolean {
  return entries.some((e) => e.learnerId === learnerId);
}
