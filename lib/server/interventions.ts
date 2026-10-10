// ── THE EVIDENCE-TO-INTERVENTION RECORD (§8) ────────────────────────────────
//
// The loop: a class finding → the teacher's review → an approved (or edited /
// declined) proposal → the targeted assignment it set → the baseline the ledger
// held at approval → the follow-up evidence collected after it → the outcome
// the teacher reads → the next decision they record.
//
// This module holds the SMALLEST record that connects those stages
// (`InterventionRecord`, lib/types.ts) — class state beside the roster, not a
// parallel store, because an intervention belongs to a class the same way its
// assignments do.
//
// WHAT IS DELIBERATELY NOT STORED:
//   · any progress number. Completion, accuracy, independence and turn-out are
//     projections of the members' own ledgers (lib/server/needs.ts), the same
//     rule every other surface follows — a counter here would be a second copy
//     that drifts.
//   · the baseline as a COPY OF EVIDENCE. The baseline is WHERE EACH MEMBER'S
//     LEDGER WAS at approval: the outcome splits that same ledger at `baseAt`
//     (server clock), and the ledger is append-only, so the events before
//     `baseAt` ARE the frozen baseline and can never mutate. The finding's own
//     evidence ids ride on the record (`evIds`) so the review stays linkable to
//     the events that produced it.
//
// Status flow, every transition teacher-only and single-threaded through
// `withNeed`, so a double race cannot mint two records:
//   proposed → assigned → (read stays open until the teacher resolves it)
// plus "declined". A repeat proposal at the same (class, concept, kind) reuses
// the OPEN record it finds rather than stacking a duplicate — the teacher
// already started reviewing this, so the second request answers with the same
// record and `existing: true` (mission test 14). A declined/resolved record is
// not "open", so a finding that persists can be reviewed again against a later
// window, which is a fresh review and earns a fresh record.
import { readJson, writeJson, withLock } from "./store";
import type { FindingKind, InterventionRecord, InterventionStatus } from "../types";

const FILE = "interventions.json";
const CAP = 600;
export const INTERVENTION_VERSION = 1;

interface Store {
  records: InterventionRecord[];
  version: number;
}

export async function listInterventions(): Promise<Store> {
  const all = await readJson<Store>(FILE, { records: [], version: INTERVENTION_VERSION });
  return all.version === INTERVENTION_VERSION ? all : { records: all.records ?? [], version: INTERVENTION_VERSION };
}

export async function listForClass(clsId: string): Promise<InterventionRecord[]> {
  const all = await listInterventions();
  return all.records.filter((r) => r.clsId === clsId);
}

export async function getRecord(id: string): Promise<InterventionRecord | null> {
  const all = await listInterventions();
  return all.records.find((r) => r.id === id) ?? null;
}

export async function saveRecord(rec: InterventionRecord): Promise<void> {
  await withLock(FILE, async () => {
    const all = await listInterventions();
    const i = all.records.findIndex((r) => r.id === rec.id);
    if (i >= 0) all.records[i] = rec; else all.records.push(rec);
    all.records.sort((a, b) => a.createdAt - b.createdAt);
    await writeJson(FILE, { records: all.records.slice(-CAP), version: INTERVENTION_VERSION });
  });
}

/** One atomic read-modify-write over a record, keyed on id AND class — the
 *  matched record is handed to the mutator only when it belongs to the class
 *  the caller was authorised for, which is how the identifier is bound to the
 *  authorisation and not to a guessed id. Null when it does not exist there. */
export async function withNeed<T>(
  id: string,
  clsId: string,
  mutator: (r: InterventionRecord) => T | Promise<T>,
): Promise<T | null> {
  let out: T | null = null;
  await withLock(FILE, async () => {
    const all = await listInterventions();
    const idx = all.records.findIndex((r) => r.id === id && r.clsId === clsId);
    if (idx < 0) return;
    const result = await mutator(all.records[idx]);
    out = result;
    all.records.sort((a, b) => a.createdAt - b.createdAt);
    await writeJson(FILE, { records: all.records.slice(-CAP), version: INTERVENTION_VERSION });
  });
  return out;
}

/** The UNIQUE OPEN record (proposed or assigned) for a (class, concept, kind) —
 *  what `propose` is idempotent against: a repeat returns THIS record rather
 *  than minting a duplicate. A declined/resolved one does not block a
 *  better-informed repeat: the teacher looked, the finding persisted, and a
 *  new review against a later window is a fresh review. */
export async function findOpen(
  clsId: string,
  conceptId: string,
  kind: FindingKind,
): Promise<InterventionRecord | null> {
  const all = await listInterventions();
  return all.records
    .filter((r) =>
      r.clsId === clsId && r.conceptId === conceptId && r.kind === kind
      && (r.status === "proposed" || r.status === "assigned"))
    .sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;
}

/** Every record's status must be one of these; the type carries the union and
 *  this is the runtime edge for a module that stores it as data. */
export const INTERVENTION_STATUSES: readonly InterventionStatus[] =
  ["proposed", "assigned", "declined", "resolved", "superseded"];
