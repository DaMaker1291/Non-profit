import { getConcept } from "./genome";
import { integratedMastery } from "./mastery";
import type { ProfileState } from "./types";
import type { ProgressEvent } from "./progress-types";

/** Exponentially-weighted accuracy update. alpha rises with streak length.
 *  Accuracy is the raw signal; `mastery` is its evidence-integrated form. */
export function updateMastery(prev: number, correct: boolean, streak: number): number {
  const alpha = Math.min(0.45, 0.3 + 0.02 * streak);
  return prev + alpha * ((correct ? 1 : 0) - prev);
}

export interface ProgressRecord {
  correct: boolean;
  explanation: string;
  streak: number;
  mastery: number;
}

export function emptyProgress() {
  return { attempts: 0, correct: 0, streak: 0, mastery: 0.2, accuracy: 0.2, lastSeen: 0, misconceptions: {} };
}

const DAY = 24 * 60 * 60 * 1000;

export function recordAnswer(
  state: ProfileState,
  conceptId: string,
  questionId: string,
  chosen: number,
  correct: boolean,
  explanation: string,
  tags: string[],
  meta?: {
    ms?: number;
    hints?: number;
    mode?: "guided" | "independent" | "transfer";
    /** The evidence source this answer was recorded under, when it is not
     *  ordinary practice. Only "retrieval" changes what the answer proves — see
     *  the retention block below. */
    source?: "retrieval";
    lang?: string;
  },
  /** The answer's clock, in ms. Callers that also mint a ledger event for the
   *  same answer MUST pass the event's stamp here — one answer, one time. The
   *  model's timestamps and the ledger's must agree or replay parity is
   *  impossible by construction, not merely broken. */
  at?: number,
): ProgressRecord {
  const p = state.progress[conceptId] ?? emptyProgress();
  // Both read BEFORE this answer moves them: how much evidence preceded it, and
  // when that evidence was recorded — the gap is what makes a retrieval a
  // retrieval rather than another rehearsal.
  const hadPriorEvidence = p.attempts > 0;
  const priorSeen = p.lastSeen;
  p.attempts += 1;
  p.streak = correct ? p.streak + 1 : 0;
  if (correct) p.correct += 1;
  p.lastSeen = at ?? Date.now();
  if (!correct) for (const t of tags) p.misconceptions[t] = (p.misconceptions[t] ?? 0) + 1;
  // Independence vs transfer evidence: only hint-free answers count as proof.
  const hints = meta?.hints ?? 0;
  const mode = meta?.mode ?? "guided";
  if (mode === "transfer") {
    p.transfer ??= { asked: 0, correct: 0 };
    p.transfer.asked += 1;
    if (correct && hints === 0) p.transfer.correct += 1;
  } else if (mode === "independent") {
    p.independent ??= { asked: 0, correct: 0 };
    p.independent.asked += 1;
    if (correct && hints === 0) p.independent.correct += 1;
  }
  // ── Retention evidence: recall that was actually delayed ─────────────────
  // A dimension of its own, and deliberately not "good work, yesterday": the
  // answer counts only when (i) the server recorded it as a retrieval, which
  // happens because the scheduler had this concept due, (ii) it needed no
  // hints, and (iii) the previous evidence on the concept is at least a day
  // old. A second run through the same questions in the same sitting therefore
  // cannot buy a retention credit, and a FAILED retrieval counts as asked-but-
  // not-correct — forgetting is the measurement this dimension exists for.
  const sinceLast = hadPriorEvidence ? (at ?? Date.now()) - priorSeen : 0;
  if (meta?.source === "retrieval" && hints === 0 && hadPriorEvidence && sinceLast >= DAY) {
    p.retention ??= { asked: 0, correct: 0 };
    p.retention.asked += 1;
    if (correct) p.retention.correct += 1;
  }
  if (typeof meta?.ms === "number" && meta.ms >= 0 && meta.ms <= 3600000) {
    p.totalMs = (p.totalMs ?? 0) + meta.ms;
    p.answers = (p.answers ?? 0) + 1;
  }
  // Two numbers: accuracy (EWMA of what was answered) and mastery (what the
  // evidence supports — see lib/mastery.ts). Computed LAST so this answer's
  // own evidence — its misconception tags and proof outcome — is part of the
  // claim it produces.
  p.accuracy = updateMastery(p.accuracy ?? p.mastery, correct, p.streak);
  p.mastery = integratedMastery(p).integrated;
  state.progress[conceptId] = p;
  if (p.mastery >= 0.9) state.masteries[conceptId] = p.lastSeen;
  // fire-and-forget event log (used for streaks / analytics)
  const ev: ProgressEvent = { conceptId, questionId, chosen, correct, at: p.lastSeen };
  if (typeof meta?.ms === "number") ev.ms = meta.ms;
  ev.hints = hints;
  ev.mode = mode;
  if (meta?.lang) ev.lang = meta.lang;
  (state as unknown as { events?: ProgressEvent[] }).events ??= [];
  (state as unknown as { events: ProgressEvent[] }).events!.push(ev);
  const evs = (state as unknown as { events: ProgressEvent[] }).events!;
  if (evs.length > 500) evs.splice(0, evs.length - 500);
  return { correct, explanation, streak: p.streak, mastery: p.mastery };
}

/** Mastery map for path building. */
export function masteryMap(state: ProfileState, subject: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, p] of Object.entries(state.progress)) {
    if (getConcept(id)?.subject === subject) out[id] = p.mastery;
  }
  return out;
}

/** Aggregate misconception hits for a subject. */
export function misconceptionHits(state: ProfileState, subject: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, p] of Object.entries(state.progress)) {
    if (getConcept(id)?.subject !== subject) continue;
    for (const [mid, n] of Object.entries(p.misconceptions)) out[mid] = (out[mid] ?? 0) + n;
  }
  return out;
}
