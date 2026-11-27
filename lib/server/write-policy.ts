// ─────────────────────────────────────────────────────────────────────────────
// MAY THIS DEPLOYMENT KEEP WHAT IT IS ABOUT TO WRITE? — the policy, on its own.
//
// The rule itself lives in lib/env.ts (`storeReadiness`), so the readiness route,
// the drills and every write path cannot disagree about it. Its second live drill
// is what forced it: a Render service with no disk answered ready:true and lost a
// canary learner to the next deploy, and the lesson is not "detect that host" — it
// is that NO statistic a process can take tells a disk the host keeps from a
// directory it rebuilds. So the deployment must DECLARE which it is, and until it
// does, learner-data writes are refused rather than accepted and quietly thrown
// away.
//
// WHY THIS MODULE EXISTS NOW. It used to live in `store.ts`, which was right while
// there was one backend. A Postgres backend must enforce the SAME refusal — a
// database is durable, but "durable" is still a claim the deployment has to have
// made, and a second backend that skipped the check would be a way to write
// learner records on a deployment that had not declared it can keep them. Importing
// it from the file store would make the database backend depend on the store it
// replaces, so the policy moved here and `store.ts` re-exports it.
// ─────────────────────────────────────────────────────────────────────────────
import { storeReadiness } from "../env";

/** Thrown when a write would be kept by a store this deployment has not declared
 *  durable. `write-refusal.ts` recognises it by NAME (never `instanceof`), so a
 *  module loaded twice still produces the learner-facing 503 rather than a 500. */
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
 *                    deployment has not declared it can keep. The default, because
 *                    the safe direction for a forgotten argument is to refuse.
 *   erasure        — removing a learner's data. NEVER refused: erasure is a right,
 *                    and a store that cannot keep data is exactly where keeping it
 *                    after being asked to delete it is worst.
 *   identity       — an account's own session bookkeeping (sign-out, the epoch that
 *                    revokes tokens, a password change). NEVER refused: signing out
 *                    must work on every deployment.
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

/** Throw for a write the deployment has not declared durable — the one call every
 *  backend makes before it persists a learner's record. `purpose` decides, and an
 *  erasure or identity write is never refused. */
export function assertWritable(purpose: WritePurpose, what: string): void {
  if (purpose !== "learner-record") return;
  const block = storeWriteBlock();
  if (!block) return;
  throw new StoreWriteBlockedError(block.code, `${block.detail} (refused while writing ${what})`);
}
