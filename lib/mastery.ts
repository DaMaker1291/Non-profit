// ─────────────────────────────────────────────────────────────────────────────
// MASTERY, MADE HONEST (audit P0-D / §19–20).
//
// The EWMA answers "how often were the answers right". It cannot answer
// "can this learner use the idea independently" — a student can drill to 0.9
// accuracy entirely on guided, hinted questions and the old model called that
// mastery. The codebase already records the missing evidence — hint-free
// prove-it attempts, transfer attempts, misconception hits, micro-diagnostic
// verdicts — it just never used it. This module does, with one rule:
//
//   Accuracy you haven't proven independently is discounted, not displayed.
//
// Design properties (all deliberate):
//   · No prove attempts at all → integrated == accuracy exactly. The number
//     never rises above what was demonstrated, and never punishes silence.
//   · Hint-free proof unlocks the premium; a failed proof pulls the rate
//     below neutral (Laplace-smoothed so one attempt can't crash it).
//   · Transfer proof is the strongest single signal — "strong" status is now
//     unreachable without it.
//   · Recurring uncured misconceptions drag mastery down; a passed
//     micro-diagnostic (the cure) releases the drag.
// Deterministic, offline, pure — like every engine in this project.
// ─────────────────────────────────────────────────────────────────────────────

import type { ConceptProgress } from "./types";

/** A misconception counts as cured once its micro-diagnostic passed. */
const CURE_SCORE = 0.8;
/** Each recurring, uncured misconception drags this much (capped below). */
const DRAG_PER_MISCONCEPTION = 0.06;
const DRAG_CAP = 0.24;
/** Misconceptions only count against you from the second hit — one slip is noise. */
const DRAG_THRESHOLD = 2;

/** Fresh graded answers needed before practice evidence (not the diagnostic)
 *  becomes the dominant signal for a concept (audit P0-A). Six answers is
 *  roughly one short practice block — enough for the EWMA to respond, not so
 *  many that the supervised measurement lingers too long. */
export const DIAG_RELEASE_EVIDENCE = 6;

export interface MasteryParts {
  /** EWMA of graded answers — the raw accuracy signal. */
  accuracy: number;
  /** Hint-free prove-it success, Laplace-smoothed. Neutral = accuracy until proven. */
  independence: number;
  /** Unfamiliar-wording success, Laplace-smoothed. Neutral = accuracy until proven. */
  transfer: number;
  /** Total drag from recurring uncured misconceptions, [0, DRAG_CAP]. */
  drag: number;
  /** The integrated number everything downstream reads. */
  integrated: number;
}

function proofRate(asked: number | undefined, correct: number | undefined, neutral: number): number {
  if (!asked) return neutral; // no evidence: never reward, never punish
  // Laplace smoothing: (c+1)/(a+2) — a perfect record converges to 1, a
  // barren one to 0, and a single attempt can never hit either extreme.
  return Math.max(0, Math.min(1, ((correct ?? 0) + 1) / (asked + 2)));
}

/** Integrate every recorded signal for one concept into a defensible number.
 *  Pure — recomputable from the progress record at any time.
 *
 *  Claim-cap model (audit P0-D): the base is accuracy minus misconception
 *  drag; proofs then move the claim in the direction the evidence points —
 *  and unproven accuracy is capped, because "I drilled it" is not "I can
 *  use it":
 *    · no proof attempts at all   → ceiling 0.75 (competent, not strong)
 *    · independence proven        → ceiling 0.85
 *    · transfer proven            → ceiling 0.98 (the only road to strong)
 *  A failed proof pulls the claim DOWN to the proven rate — honest evidence
 *  cuts both ways. Laplace smoothing keeps one attempt from crashing it. */
export function integratedMastery(p: ConceptProgress): MasteryParts {
  const accuracy = Math.max(0, Math.min(1, p.accuracy ?? p.mastery));
  const independence = proofRate(p.independent?.asked, p.independent?.correct, accuracy);
  const transfer = proofRate(p.transfer?.asked, p.transfer?.correct, accuracy);

  let drag = 0;
  for (const [id, hits] of Object.entries(p.misconceptions)) {
    if (hits < DRAG_THRESHOLD) continue;
    const cured = p.microDiag?.[id];
    if (cured && cured.score !== null && cured.score >= CURE_SCORE) continue;
    drag += DRAG_PER_MISCONCEPTION;
  }
  drag = Math.min(DRAG_CAP, drag);

  // The claim is the minimum of what every evidence stream supports.
  //   · A CLEAN proof record (every hint-free attempt correct) unlocks the
  //     ceiling — proof exists and nothing contradicts it.
  //   · An IMPERFECT record caps the claim at its Laplace-smoothed rate —
  //     demonstrated failure is evidence too, and it cuts the claim down.
  //   · Unproven accuracy tops out at 0.75; only proven transfer reaches strong.
  const clean = (e: { asked: number; correct: number } | undefined) =>
    !!e && e.asked > 0 && e.correct === e.asked;
  let integrated = accuracy - drag;
  if (p.transfer?.asked) integrated = Math.min(integrated, clean(p.transfer) ? 0.98 : Math.min(0.98, transfer));
  if (p.independent?.asked) integrated = Math.min(integrated, clean(p.independent) ? 0.85 : Math.min(0.85, independence));
  if (!p.independent?.asked && !p.transfer?.asked) integrated = Math.min(integrated, 0.75);
  else if (!p.transfer?.asked) integrated = Math.min(integrated, 0.85);

  integrated = Math.max(0, Math.min(0.98, integrated));
  return { accuracy, independence, transfer, drag, integrated };
}

/** One-line explanation of what the number is made of — for the evidence UI. */
export function masteryExplain(parts: MasteryParts): string {
  const bits: string[] = [`accuracy ${Math.round(parts.accuracy * 100)}%`];
  if (parts.independence > parts.accuracy + 1e-9) bits.push("proved independently");
  if (parts.transfer > parts.accuracy + 1e-9) bits.push("transfer proved");
  if (parts.drag > 0) bits.push(`misconception drag −${Math.round(parts.drag * 100)}`);
  return bits.join(" · ");
}
