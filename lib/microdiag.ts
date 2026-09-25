// ─────────────────────────────────────────────────────────────────────────────
// The micro-diagnostic engine — §4–5 of the product vision.
//
// "Not 'you got Q7 wrong.' It asks: WHY did you get Q7 wrong?"
//
// When a graded answer trips a misconception repeatedly, the system "flares":
// it pauses the original topic and probes the misconception directly with a
// purpose-built micro-check, then classifies the failure honestly:
//
//   conceptual   — missed the micro-check → the belief itself is wrong
//   procedural   — aced the micro-check, still failing in context → execution
//   unresolved   — left the check unanswered → we simply don't know yet
//
// The classifier never infers from a single data point, and it never pretends
// a hint-free read of a student's mind. Unreported ≠ resolved.
// ─────────────────────────────────────────────────────────────────────────────

import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { generateQuestion, serveView } from "./questions";
import type { QuestionView } from "./questions";
import type { ConceptProgress, MicroDiagState, ProfileState } from "./types";

export type { MicroDiagState };

/** How many hits within the recent window trigger a flare. */
export const FLARE_THRESHOLD = 2;
/** How many recent wrong answers the window looks at. */
export const RECENT_WINDOW = 3;

export type MicroDiagStatus = "conceptual" | "procedural" | "unresolved";

/** What an answer response carries when a misconception flares. */
export interface FlarePayload {
  misconceptionId: string;
  /** The concept the student was working on — where the flare state lives. */
  conceptId: string;
  name: string;
  pattern: string;
  coaching: string;
  check: MicroCheckView | null;
}

export interface MicroCheckView {
  question: QuestionView & { /** Dev-only test hook (never in production). */ answerIndex?: number };
  misconceptionId: string;
}

/** The 1–0 hits recorded across the most recent RECENT_WINDOW answers, in
 *  recency order (most recent last). Hits live on progress entries, so a
 *  concept with no entry has no signal — honest absence of data. */
export function recentHitPattern(p: ConceptProgress | undefined, mid: string): number[] {
  const recent = p?.recentHits?.[mid];
  return Array.isArray(recent) ? recent : [];
}

/** Should this misconception flare right now? Only real, recent, repeated
 *  evidence triggers an intervention — never a single mistake. */
export function shouldFlare(p: ConceptProgress | undefined, mid: string): boolean {
  const pat = recentHitPattern(p, mid);
  if (pat.length < FLARE_THRESHOLD) return false;
  const window = pat.slice(-RECENT_WINDOW);
  const hits = window.reduce((s, v) => s + v, 0);
  return hits >= FLARE_THRESHOLD && window[window.length - 1] === 1;
}

/** The misconception currently flaring for a concept, if any. Only flares
 *  whose micro-check hasn't been *passed* since the flare began — a passed
 *  check clears the flare, a skipped one leaves it standing. */
export function flaringMisconception(p: ConceptProgress | undefined): string | null {
  if (!p) return null;
  let best: { mid: string; score: number } | null = null;
  for (const mid of Object.keys(p.misconceptions)) {
    if (!shouldFlare(p, mid)) continue;
    const md = p.microDiag?.[mid];
    if (md && md.score !== null && md.score >= 1) continue; // resolved
    const s = p.misconceptions[mid];
    if (!best || s > best.score) best = { mid, score: s };
  }
  return best?.mid ?? null;
}

/** Classify a resolved micro-check. This is the honest core: a passed check
 *  with continuing contextual failure is procedural (execution), a failed
 *  check is conceptual (the belief itself), and an unresolved one stays
 *  unresolved — no guessing. */
export function classify(md: MicroDiagState): MicroDiagStatus {
  if (md.score === null) return "unresolved";
  return md.score >= 1 ? "procedural" : "conceptual";
}

/** The deterministic seed of the probe for a standing flare: same student,
 *  same flare → same check, even after more answers intervene. The seed is
 *  anchored to the flare's askedAt timestamp (persisted when the flare is
 *  built), falling back to the attempt count before any probe exists. */
export function generateProbeId(state: ProfileState, conceptId: string, misconceptionId: string): string {
  const p = state.progress[conceptId];
  const md = p?.microDiag?.[misconceptionId];
  return `md:${state.profile.id}:${misconceptionId}:${md ? md.askedAt : p?.attempts ?? 0}`;
}

/** Build the flare payload for an answer response: the named misconception,
 *  its coaching line, and — when a probe is due — a fresh micro-question on
 *  the misconception's home concept. `revealTestHook` (dev servers only, see
 *  the progress route) attaches the probe's answer index so the E2E suite can
 *  grade known outcomes; production never sets it. Returns null when nothing
 *  is due. */
export function buildFlare(
  state: ProfileState,
  conceptId: string,
  misconceptionId: string,
  revealTestHook = false,
  lang?: string,
): FlarePayload | null {
  const m = MISCONCEPTIONS_BY_ID[misconceptionId];
  const p = state.progress[conceptId];
  if (!m || !shouldFlare(p, misconceptionId)) return null;
  const store = (p.microDiag ??= {});
  const md = store[misconceptionId];
  // Already diagnosed (either verdict) → the probe has done its job; no re-probe.
  if (md && md.score !== null) return null;
  // First flare for this misconception: anchor the probe to now. Re-flares
  // while unanswered reuse the same askedAt → the same check, gradeable later.
  if (!md) store[misconceptionId] = { misconceptionId, askedAt: Date.now(), answeredAt: null, score: null };

  // Probe on the misconception's home concept — the same idea stripped of the
  // surrounding topic. Generators are seeded: the same student always sees a
  // deterministic, freshly-generated check.
  const home = m.concepts.find((cid) => cid !== conceptId) ?? conceptId;
  const q = generateQuestion(home, generateProbeId(state, conceptId, misconceptionId));
  const reveal = revealTestHook && process.env.NODE_ENV !== "production";
  return {
    misconceptionId: m.id,
    conceptId,
    name: m.name,
    pattern: m.pattern,
    coaching: m.coaching,
    check: q ? { question: reveal ? { ...serveView(q, lang), answerIndex: q.answer } : serveView(q, lang), misconceptionId: m.id } : null,
  };
}

/** Grade a submitted micro-check and persist the classification. Runs inside
 *  the store's profile lock via updateProfile. Returns the classification, or
 *  null when the submission doesn't correspond to a standing flare. */
export function gradeMicroCheck(
  state: ProfileState,
  conceptId: string,
  misconceptionId: string,
  questionId: string,
  choiceIndex: number,
): { status: MicroDiagStatus; correct: boolean; explanation: string; prompt: string; answerIndex: number } | null {
  const m = MISCONCEPTIONS_BY_ID[misconceptionId];
  const p = state.progress[conceptId];
  const md = p?.microDiag?.[misconceptionId];
  if (!m || !p || !md || md.score !== null) return null;

  // The submission must be the deterministic probe that was served for this
  // flare — anchored to the flare's askedAt, stable across later answers.
  const home = m.concepts.find((cid) => cid !== conceptId) ?? conceptId;
  const probe = generateQuestion(home, generateProbeId(state, conceptId, misconceptionId));
  if (!probe || probe.id !== questionId) return null;
  if (choiceIndex < 0 || choiceIndex >= probe.choices.length) return null;

  const correct = choiceIndex === probe.answer;
  const score = correct ? 1 : 0;
  const store = (p.microDiag ??= {});
  store[misconceptionId] = {
    misconceptionId,
    askedAt: md.askedAt,
    answeredAt: Date.now(),
    score,
  };
  return { status: classify(store[misconceptionId]), correct, explanation: probe.explanation, prompt: probe.prompt, answerIndex: probe.answer };
}

/** Append a hit/miss to the recency window for one misconception. */
export function pushRecentHit(p: ConceptProgress, mid: string, hit: boolean): void {
  p.recentHits ??= {};
  const arr = p.recentHits[mid] ?? [];
  arr.push(hit ? 1 : 0);
  if (arr.length > RECENT_WINDOW) arr.splice(0, arr.length - RECENT_WINDOW);
  p.recentHits[mid] = arr;
}
