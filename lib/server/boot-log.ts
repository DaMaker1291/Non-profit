// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS STORE HAS OBSERVED ABOUT ITSELF — the measurement half of storage
// readiness, kept strictly apart from the declaration half (lib/env.ts).
//
// WHY A DECLARATION IS NOT ENOUGH, in one deployment: a live Render service with
// no disk answered `ready:true`, `data:{ok:true,code:"writable"}` and no
// problems, and destroyed a canary learner on the next deploy. The operator had
// DECLARED `OPENMIND_DATA_DIR=/data`, and the declaration was about a PATH while
// the question is about a FILESYSTEM. `OPENMIND_DATA_DIR_DURABLE=1` narrows that
// further — it says a disk is attached — but it is still a claim, and this
// project's rule is that a claim a running process cannot check must be reported
// as a claim (`/api/ready`'s `store.persistence`) and proved elsewhere (`npm run
// verify:persistence`).
//
// This file is the only measurement available from inside the process, and it is
// deliberately WEAK and reported as such: every process that answers readiness
// writes its own identity into the store, and a process that later finds a
// record it did not write has seen the store outlive a process. If the store is
// replaced on every deploy, the file starts empty every time and the count stays
// 0 for ever — which is the honest answer, and the one a monitor should alarm on
// when the operator has declared durability.
//
// WHAT IT IS NOT: proof. A container restarted in place keeps its writable layer,
// so `boots > 1` is not on its own evidence of durability — it is evidence of
// survival across a process replacement, which is what a restart drill measures
// too. It is never read INSTEAD of the declaration, and a fresh store reporting
// 0 is a store that has not been through a release yet, not a broken one.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { deploymentId } from "../version";

/** The store's own record of the processes that have opened it. In the data
 *  directory, because that is the filesystem whose survival it is about. */
export const BOOT_FILE = "boots.json";

export interface BootRecord {
  /** How many process starts have opened this store. */
  boots: number;
  /** When the first one did — the store's own age, as far as it can tell. */
  firstSeenAt: number;
  /** How many of those found a record written by a DIFFERENT deployment. Every
   *  one of them is a release this store survived. */
  survivedDeployments: number;
  /** The deployment that opened it last. */
  deployment: string;
}

function fileFor(dir: string): string {
  return path.join(dir, BOOT_FILE);
}

/** The record, or null when this store has never been opened by a server. A
 *  file that cannot be read or parsed is null too: an unreadable measurement is
 *  reported as no measurement, never as a pass (the same rule
 *  scripts/disk-headroom.mjs applies to an unmeasurable volume). */
export function readBootLog(dir: string): BootRecord | null {
  try {
    const raw = JSON.parse(fs.readFileSync(fileFor(dir), "utf8")) as Partial<BootRecord>;
    if (typeof raw?.boots !== "number" || typeof raw?.firstSeenAt !== "number") return null;
    return {
      boots: raw.boots,
      firstSeenAt: raw.firstSeenAt,
      survivedDeployments: typeof raw.survivedDeployments === "number" ? raw.survivedDeployments : 0,
      deployment: typeof raw.deployment === "string" ? raw.deployment : "",
    };
  } catch {
    return null;
  }
}

/** Recorded once per process, because readiness is polled and a monitor polling
 *  every ten seconds is not ten million boots. */
let recordedIn: string | null = null;

/**
 * Note that this process opened the store, and return what the store has seen.
 *
 * BEST-EFFORT BY DESIGN, and it has to be: this is bookkeeping ABOUT the store,
 * so it must not be the thing that makes serving fail. A read-only filesystem, a
 * full disk or a refused deployment leaves the caller with the previous record
 * (or null) and no error — the answer to "has this store survived anything?" is
 * then "not measurable", which is exactly what the caller reports.
 */
export function recordBoot(
  dir: string,
  env: Record<string, string | undefined> = process.env,
  now = Date.now(),
): BootRecord | null {
  // Already recorded by THIS process: report what is on disk rather than
  // counting the same boot again, so a polled readiness route cannot inflate the
  // number it is reporting.
  if (recordedIn === dir) return readBootLog(dir);
  const deployment = deploymentId(env);
  const previous = readBootLog(dir);
  const record: BootRecord = previous
    ? {
      boots: previous.boots + 1,
      firstSeenAt: previous.firstSeenAt,
      // A DIFFERENT deployment found the store still there: that is a release
      // the store outlived, whether or not anything else says so.
      survivedDeployments: previous.survivedDeployments + (previous.deployment && previous.deployment !== deployment ? 1 : 0),
      deployment,
    }
    : { boots: 1, firstSeenAt: now, survivedDeployments: 0, deployment };
  try {
    fs.mkdirSync(dir, { recursive: true });
    // Written whole by temp-file rename, like every other file in the store, so
    // a process killed mid-write cannot leave a half-parsed record that reads as
    // "no measurement" for ever.
    const tmp = `${fileFor(dir)}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(record), "utf8");
    fs.renameSync(tmp, fileFor(dir));
    recordedIn = dir;
  } catch {
    /* not measurable — reported as no measurement by the caller */
  }
  return record;
}

/** For tests: forget which directory this process has already recorded. */
export function resetBootLog(): void {
  recordedIn = null;
}
