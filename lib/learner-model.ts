// Learner model snapshot (§1): every interaction becomes structured evidence.
// Pure functions of ProfileState — the single source the Mind Map, Review
// Queue, Next Step and Offline Pack all read. No estimates, no simulation.
import { getConcept } from "./genome";
import { confidenceOf, dueReviews } from "./retention";
import type { ProfileState } from "./types";

export interface ConceptEvidence {
  conceptId: string;
  subject: string;
  title: string;
  mastery: number;
  confidence: number | null;
  attempts: number;
  hintsUsed: number;
  /** The slip still worth acting on, or null once the learner has repaired it. */
  topMisconception: string | null;
  /** Slips still being made. Zero after a repair — see REPAIR_STREAK. */
  misconceptionHits: number;
  /** The same slip over the whole history, never erased: the record a teacher
   *  and the mind map read. It is NOT what decides the recommendation. */
  lifetimeMisconception: { id: string; hits: number } | null;
  lastSeen: number;
  status: "strong" | "developing" | "learning" | "new" | "untouched";
  /** Hint-free prove-it record (independent) and unfamiliar-wording record. */
  independentAsked: number;
  independentCorrect: number;
  transferAsked: number;
  transferCorrect: number;
  /** Mean answer time in seconds, null until timed answers exist. */
  avgSeconds: number | null;
}

/**
 * How many answers in a row retire a recurring slip.
 *
 * The misconception ledger only ever counts UP (`recordAnswer` increments it
 * and never clears it), so a lifetime count can never stop being true. Using it
 * to decide the next step made REMEDIATE permanent: a learner could repair the
 * slip with six clean answers and the engine would still open with "Fix: …",
 * which is precisely the failure of adaptation this product claims to avoid.
 *
 * The evidence is therefore never deleted — `lifetimeMisconception` still holds
 * it for the teacher view — but it stops being *actionable* once the learner
 * has since answered this concept correctly three times in a row. A hint does
 * not clear the streak: the slip is about the answer given, not about help
 * received (independence is a separate measure).
 */
export const REPAIR_STREAK = 3;

/** The slip that is still current: null once repaired by REPAIR_STREAK answers. */
export function currentSlip(
  p: { misconceptions?: Record<string, number>; streak?: number } | undefined,
): { id: string; hits: number } | null {
  const entries = Object.entries(p?.misconceptions ?? {});
  if (entries.length === 0) return null;
  if ((p?.streak ?? 0) >= REPAIR_STREAK) return null;
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { id: entries[0][0], hits: entries[0][1] };
}

export function statusOf(mastery: number, attempts: number): ConceptEvidence["status"] {
  if (attempts === 0) return "untouched";
  if (mastery >= 0.9) return "strong";
  if (mastery >= 0.65) return "developing";
  if (mastery > 0) return "learning";
  return "new";
}

export function evidenceFor(state: ProfileState, conceptId: string): ConceptEvidence | null {
  const c = getConcept(conceptId);
  if (!c) return null;
  const p = state.progress[conceptId];
  const mastery = p?.mastery ?? 0;
  const attempts = p?.attempts ?? 0;
  const hintsUsed = p?.hints ? Object.values(p.hints).reduce((s, n) => s + n, 0) : 0;
  const current = currentSlip(p);
  const lifetime = p?.misconceptions
    ? Object.entries(p.misconceptions).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
    : undefined;
  return {
    conceptId, subject: c.subject, title: c.title, mastery,
    confidence: p ? confidenceOf(p) : null,
    attempts, hintsUsed,
    topMisconception: current?.id ?? null,
    misconceptionHits: current?.hits ?? 0,
    lifetimeMisconception: lifetime ? { id: lifetime[0], hits: lifetime[1] } : null,
    lastSeen: p?.lastSeen ?? 0,
    status: statusOf(mastery, attempts),
    independentAsked: p?.independent?.asked ?? 0,
    independentCorrect: p?.independent?.correct ?? 0,
    transferAsked: p?.transfer?.asked ?? 0,
    transferCorrect: p?.transfer?.correct ?? 0,
    avgSeconds: p?.answers ? (p.totalMs ?? 0) / p.answers / 1000 : null,
  };
}

export interface LearnerSnapshot {
  evidence: ConceptEvidence[];
  touched: number;
  strong: number;
  developing: number;
  learning: number;
  dueCount: number;
  topMisconceptions: Array<{ id: string; hits: number }>;
}

export function buildSnapshot(state: ProfileState): LearnerSnapshot {
  const evidence = Object.keys(state.progress)
    .map((cid) => evidenceFor(state, cid))
    .filter((e): e is ConceptEvidence => e !== null)
    .sort((a, b) => a.mastery - b.mastery);
  const ledger = new Map<string, number>();
  for (const p of Object.values(state.progress)) {
    for (const [mid, hits] of Object.entries(p.misconceptions ?? {})) {
      ledger.set(mid, (ledger.get(mid) ?? 0) + hits);
    }
  }
  return {
    evidence,
    touched: evidence.length,
    strong: evidence.filter((e) => e.status === "strong").length,
    developing: evidence.filter((e) => e.status === "developing").length,
    learning: evidence.filter((e) => e.status === "learning").length,
    dueCount: dueReviews(state).length,
    topMisconceptions: [...ledger.entries()]
      .map(([id, hits]) => ({ id, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 5),
  };
}
