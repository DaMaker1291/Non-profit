// ─────────────────────────────────────────────────────────────────────────────
// The ledger on disk: one append-only JSONL file per learner.
//
// JSONL rather than one big array for three reasons that all matter here: an
// append is a single `appendFile` (so two concurrent answers cannot truncate
// each other's history the way a read-modify-write of one JSON array can), a
// corrupt line costs one event instead of the whole file, and the file can be
// read incrementally as a stream if a learner ever accumulates tens of
// thousands of events on a cheap phone connection.
//
// `dedupe` is not an optimisation. Events arrive from two directions — the live
// answer path and, later, a device syncing after being offline — and the same
// event will genuinely be re-sent. Accepting a duplicate would double-count an
// answer and silently inflate a learner's mastery, so idempotency is enforced
// against what is on disk, not against what the caller promises.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, StoreWriteBlockedError, storeWriteBlock, withLock } from "./store";
import type { EvidenceEvent } from "../evidence";

const DIR = path.join(DATA_DIR, "evidence");

/** Learner ids become FILE PATHS here, so they are checked, not sanitised —
 *  quietly rewriting an id could append one learner's evidence to another's
 *  file. Profiles are stored with server-generated ids that always match. */
function fileFor(learnerId: string): string {
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(learnerId)) throw new Error(`unsafe learner id: ${JSON.stringify(learnerId)}`);
  return path.join(DIR, `${learnerId}.jsonl`);
}

function ensureDir(): void {
  fs.mkdirSync(DIR, { recursive: true });
}

/** Ids already on disk, cached per process. Loaded once per learner: after that
 *  every append is O(1) plus the write. */
const seenIds = new Map<string, Set<string>>();

function idsOnDisk(learnerId: string): Set<string> {
  const cached = seenIds.get(learnerId);
  if (cached) return cached;
  const set = new Set<string>();
  const file = fileFor(learnerId);
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as { id?: unknown };
        if (typeof parsed.id === "string") set.add(parsed.id);
      } catch {
        // A malformed line is skipped, never repaired and never deleted: it may
        // be an event written by an older schema, and rewriting history is the
        // one thing this store must not do.
      }
    }
  }
  seenIds.set(learnerId, set);
  return set;
}

/**
 * Does this file end in the MIDDLE of a line?
 *
 * A process killed while appending leaves a partial JSON object with no final
 * newline, and that fragment changes what the NEXT append means: written
 * straight after it, the new event is spliced onto the wreckage, the reader
 * skips the whole line as malformed, and the learner's answer is lost while
 * `appendEvidence` reports it as accepted. The conformance suite's torn-ledger
 * case is what found this, and it is the exact failure a crash on a cheap phone
 * produces.
 *
 * One byte is read rather than the file, because this runs on EVERY append and
 * the answer is about the last byte alone. A missing or unreadable file is
 * "framed": there is nothing to join onto.
 */
function endsMidLine(file: string): boolean {
  let fd: number | null = null;
  try {
    const size = fs.statSync(file).size;
    if (size === 0) return false;
    fd = fs.openSync(file, "r");
    const last = Buffer.alloc(1);
    fs.readSync(fd, last, 0, 1, size - 1);
    return last[0] !== 0x0a;
  } catch {
    return false;
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
}

export interface AppendResult {
  accepted: string[];
  duplicates: string[];
}

/**
 * Append events. Idempotent by event id: a re-sent event is reported as a
 * duplicate and not written. Returns which ids were accepted so the caller can
 * tell a sync exactly what landed.
 */
export async function appendEvidence(learnerId: string, events: readonly EvidenceEvent[]): Promise<AppendResult> {
  const accepted: string[] = [];
  const duplicates: string[] = [];
  if (!events.length) return { accepted, duplicates };
  // The LEDGER is the strongest claim this product makes about a learner, so it
  // is refused first and hardest: a store the deployment cannot keep must not
  // accept one more event, because `commitAndProject` answers
  // `evidence_not_recorded` rather than moving the model on an event nobody will
  // find again. Checked BEFORE the file is touched, so the refusal costs nothing
  // and no empty ledger is created for a learner who cannot be recorded.
  const block = storeWriteBlock();
  if (block) throw new StoreWriteBlockedError(block.code, `${block.detail} (refused while appending evidence)`);
  const file = fileFor(learnerId); // validates before anything is created
  ensureDir();
  return withLock(file, async () => {
    const seen = idsOnDisk(learnerId);
    const lines: string[] = [];
    for (const e of events) {
      // An event about another learner must never reach this file, whatever the
      // caller says: the ledger is the authorisation boundary's last line.
      if (e.learnerId !== learnerId) throw new Error("refusing to write evidence for a different learner");
      if (seen.has(e.id)) { duplicates.push(e.id); continue; }
      seen.add(e.id);
      lines.push(JSON.stringify(e));
      accepted.push(e.id);
    }
    if (lines.length) {
      // One newline of FRAMING, never of content: it decides where the next
      // event begins, and the fragment's own bytes stay exactly where they are
      // (rewriting them would be editing history, which this store must never
      // do). Without it a crash silently costs every answer that follows it.
      const prefix = endsMidLine(file) ? "\n" : "";
      fs.appendFileSync(file, prefix + lines.join("\n") + "\n");
    }
    return { accepted, duplicates };
  });
}

/** Is this event already on the learner's ledger? The cheap half of append's
 *  idempotence, for callers that must decide BEFORE doing work (a replayed
 *  answer whose question is no longer staged must be recognised as already
 *  recorded rather than reported as a stale question). */
export function hasEvidence(learnerId: string, id: string): boolean {
  try {
    return idsOnDisk(learnerId).has(id);
  } catch {
    return false;
  }
}

/** Every event for a learner, oldest first. Malformed lines are skipped. */
export function readEvidence(learnerId: string): EvidenceEvent[] {
  const file = fileFor(learnerId);
  if (!fs.existsSync(file)) return [];
  const out: EvidenceEvent[] = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as EvidenceEvent);
    } catch {
      continue;
    }
  }
  return out;
}

/** Learners that have a ledger on disk. Used by the impact report, which walks
 *  ledgers rather than profiles so a deleted profile cannot resurrect as a
 *  population count. */
export function learnersWithEvidence(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => f.slice(0, -".jsonl".length))
    .filter((id) => /^[A-Za-z0-9_-]{3,64}$/.test(id));
}

/** Drop a learner's whole ledger. Only for test cleanup and account deletion —
 *  never called on a normal path, because evidence is not editable. */
export function deleteEvidence(learnerId: string): boolean {
  const file = fileFor(learnerId);
  seenIds.delete(learnerId);
  if (!fs.existsSync(file)) return false;
  fs.rmSync(file);
  return true;
}
