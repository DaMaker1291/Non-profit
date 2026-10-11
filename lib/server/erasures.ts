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
// just materialised. The log is tiny, append-only and one line per learner, so it
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
//   3. Applying is IDEMPOTENT and TOTAL: an entry naming a learner who is already
//      gone is a no-op, and one naming a learner who is present removes the
//      profile, the ledger, their personal papers and their class membership.
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
import type { ClassRoster } from "../types";
import type { PersonalPaper } from "../personal-paper";

/** The one file name. Exported so the store and the drills name the same file. */
export const ERASURES_FILE = "erasures.json";
/** Where a learner's ledger lives, relative to a store directory. */
const EVIDENCE_DIR = "evidence";

export interface ErasureRecord {
  /** The learner id that was erased. An id, never a handle: handles are reusable. */
  learnerId: string;
  /** When the erase happened (server clock), so a restore can report what it re-applied. */
  at: number;
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

/** A learner id we are willing to use as a path segment. The same shape the
 *  ledger enforces (`lib/ledger.ts#assertSafeLearnerId`), repeated here because
 *  this module unlinks files named by ids read from a log that may have travelled
 *  through a backup: a `../` in there must never reach the filesystem. */
const SAFE_ID = /^[A-Za-z0-9_-]{3,64}$/;

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
  const log = await readJson<ErasureLog | ErasureRecord[]>(path.join(dir, ERASURES_FILE), {
    version: 1,
    entries: [],
  });
  // Tolerate a bare array: the log is a file an operator may have to hand-edit
  // during a recovery, and refusing to read the obvious shape would be a trap.
  const entries = Array.isArray(log) ? log : (log.entries ?? []);
  return entries.filter(
    (e): e is ErasureRecord => !!e && typeof e.learnerId === "string" && SAFE_ID.test(e.learnerId),
  );
}

/**
 * Record one erasure. Idempotent: a learner already in the log is left alone
 * (re-erasing, or a retry after a crash, must not grow the file or move `at`).
 * Returns whether a new entry was written.
 *
 * The caller supplies the directory and the clock rather than this function
 * reading either: the store writes its own DATA_DIR under its own lock (one lock
 * table, see `lib/server/store.ts`), and a test writes a temp directory.
 */
export async function appendErasure(dir: string, learnerId: string, at: number): Promise<boolean> {
  if (!SAFE_ID.test(learnerId)) return false;
  const file = path.join(dir, ERASURES_FILE);
  const existing = await readJson<ErasureLog>(file, { version: 1, entries: [] });
  const entries = Array.isArray(existing) ? existing : (existing.entries ?? []);
  if (entries.some((e) => e?.learnerId === learnerId)) return false;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify({ version: 1, entries: [...entries, { learnerId, at }] }, null, 2), "utf8");
  return true;
}

/**
 * RE-APPLY an erasure log to the store at `dir`.
 *
 * This is the restore half: point it at a freshly restored directory and the
 * learners the log names are removed from that copy — profile, ledger, personal
 * papers and class membership — so an archive taken before the erase cannot
 * resurrect them. Idempotent, and safe on a store where they are already gone.
 */
export async function applyErasures(dir: string, entries: readonly ErasureRecord[]): Promise<ApplyOutcome> {
  const ids = [...new Set(entries.map((e) => e.learnerId).filter((id) => SAFE_ID.test(id)))];
  const outcome: ApplyOutcome = { named: entries.length, profiles: 0, ledgers: 0, personalPapers: 0, rosters: 0 };
  if (ids.length === 0) return outcome;
  const erased = new Set(ids);

  // 1. Profiles — the record the rest of a store is keyed by.
  const profilesFile = path.join(dir, "profiles.json");
  const profiles = await readJson<Record<string, unknown> | null>(profilesFile, null);
  if (profiles) {
    let changed = 0;
    for (const id of ids) if (id in profiles) { delete profiles[id]; changed++; }
    if (changed > 0) {
      await fs.writeFile(profilesFile, JSON.stringify(profiles), "utf8");
      outcome.profiles = changed;
    }
  }

  // 2. Evidence ledgers — a file per learner, removed by name.
  for (const id of ids) {
    const file = path.join(dir, EVIDENCE_DIR, `${id}.jsonl`);
    try {
      await fs.unlink(file);
      outcome.ledgers++;
    } catch {
      /* no ledger for this learner — nothing to remove */
    }
  }

  // 3. Personal papers — owner-scoped, so the erase is a filter on `owner`.
  const papersFile = path.join(dir, "personal-papers.json");
  const papers = await readJson<Record<string, PersonalPaper> | null>(papersFile, null);
  if (papers) {
    const kept = Object.entries(papers).filter(([, p]) => !erased.has((p as PersonalPaper)?.owner ?? ""));
    if (kept.length !== Object.keys(papers).length) {
      await fs.writeFile(papersFile, JSON.stringify(Object.fromEntries(kept)), "utf8");
      outcome.personalPapers = Object.keys(papers).length - kept.length;
    }
  }

  // 4. Class membership — through the ONE membership rule, so a learner erased
  //    here leaves the roster exactly as they would live.
  const classesFile = path.join(dir, "classes.json");
  const rosters = await readJson<ClassRoster[] | null>(classesFile, null);
  if (rosters) {
    let changed = 0;
    for (const cls of rosters) for (const id of ids) if (removeMember(cls, id)) changed++;
    if (changed > 0) {
      await fs.writeFile(classesFile, JSON.stringify(rosters), "utf8");
      outcome.rosters = changed;
    }
  }

  return outcome;
}

/** Is this learner named by the log? The question a restore must answer before it
 *  serves anybody: "this id is in the archive — was it erased afterwards?" */
export function isErased(entries: readonly ErasureRecord[], learnerId: string): boolean {
  return entries.some((e) => e.learnerId === learnerId);
}
