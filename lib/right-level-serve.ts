// ─────────────────────────────────────────────────────────────────────────────
// THE RUNG, APPLIED TO WHAT IS ACTUALLY SERVED.
//
// The audit's Phase 4 finding was exact: the teacher's placement lived in
// `localStorage`, so it never reached the ledger, `/api/next`, assignments or
// practice. A level that only informs a human changes nothing for the child.
//
// This module is the pure decision that closes it, and it is deliberately
// narrow: it does not choose a lesson, and it does not replace what a teacher
// set. It answers one question — "the system is about to serve this concept;
// is that at or below the rung this pupil was placed on?" — and, when it is
// above, substitutes the rung's own concept.
//
// THE CEILING IS PER RUNG, NOT PER CONCEPT. A rung names the working level, not
// a syllabus: a pupil at rung 2 can meet any stage-0 concept, not only
// `addition`. So the rule compares the concept's STAGE (the genome's own depth
// order) against the rung's ceiling, and only intervenes above it:
//
//   rung 0–2 → stage 0 only      rung 3 → stages 0–1
//   rung 4   → stages 0–2        rung 5 → stages 0–3
//
// WHY A SUBSTITUTION AND NOT A BLOCK. A blocked recommendation is a dead end on
// a screen; a substituted one is the right lesson. The caller is told what
// happened (`changed`, `reason`, `from`) so a surface can say "you are working
// at rung 2, so this opens at place value" instead of silently changing the
// subject of the lesson.
//
// WHAT IT CANNOT DO: serve rung 0. Nothing in the genome is pitched below place
// value, so rung 0 is mapped to place value AND reported as `below-content`, so
// no surface can render it as a match.
// ─────────────────────────────────────────────────────────────────────────────
import { getConcept } from "./genome";
import { rungOf, type RungLevel } from "./right-level";

/** The highest genome stage a pupil at this rung should be served. */
export const RUNG_STAGE_CEILING: Record<RungLevel, number> = {
  0: 0,
  1: 0,
  2: 0,
  3: 1,
  4: 2,
  5: 3,
};

export const RUNG_LEVELS: readonly RungLevel[] = [0, 1, 2, 3, 4, 5];

export function isRung(value: unknown): value is RungLevel {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;
}

/** The concept a rung opens at. Rung 0 has no concept of its own, so it opens
 *  at the lowest one the product has — and says so through `belowContent`. */
export function rungConceptId(rung: RungLevel): string {
  return rungOf(rung).conceptIds[0] ?? "place-value";
}

export interface ServedAdjustment {
  /** What should be served instead (or the same id, unchanged). */
  conceptId: string;
  changed: boolean;
  reason: "no-level" | "unknown-concept" | "within-rung" | "above-rung";
  /** The concept the caller asked for, so a surface can explain the change. */
  from: string;
  /** True when the rung itself has no content, which is a fact about the app. */
  belowContent: boolean;
}

export function servedForRung(conceptId: string, rung: RungLevel | null | undefined): ServedAdjustment {
  if (rung === null || rung === undefined) {
    return { conceptId, changed: false, reason: "no-level", from: conceptId, belowContent: false };
  }
  const concept = getConcept(conceptId);
  if (!concept) {
    return { conceptId, changed: false, reason: "unknown-concept", from: conceptId, belowContent: false };
  }
  const ceiling = RUNG_STAGE_CEILING[rung];
  const target = rungConceptId(rung);
  const belowContent = rungOf(rung).conceptIds.length === 0;
  if (concept.stage <= ceiling) {
    return { conceptId, changed: false, reason: "within-rung", from: conceptId, belowContent };
  }
  return { conceptId: target, changed: true, reason: "above-rung", from: conceptId, belowContent };
}

/** Apply the rule to a list of recommendations. Anything without a concept (a
 *  paper reminder, a review task) passes through untouched. */
export function adjustActions<T extends { conceptId?: string | null }>(
  actions: readonly T[],
  rung: RungLevel | null | undefined,
): T[] {
  if (rung === null || rung === undefined) return [...actions];
  return actions.map((action) => {
    // `null` is how a recommendation with no concept is spelled in the decision
    // engine; it is not "concept named null", and it passes through untouched.
    if (!action.conceptId) return action;
    const served = servedForRung(action.conceptId, rung);
    return served.changed ? ({ ...action, conceptId: served.conceptId } as T) : action;
  });
}

/**
 * Validate a teacher's placement payload before it is stored.
 *
 * Rules, each one a defect avoided: a handle that is not in the class is DROPPED
 * (a teacher renaming a pupil must not leave a level attached to nobody); a
 * value outside 0–5 is DROPPED rather than clamped (clamping a typo invents a
 * placement); and an empty result returns `undefined` so the class records "not
 * placed" rather than "placed at nothing".
 */
export function normalizeClassLevels(
  raw: unknown,
  handles: readonly string[],
): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const allowed = new Set(handles);
  const out: Record<string, number> = {};
  for (const [handle, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowed.has(handle)) continue;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 5) continue;
    out[handle] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** The rung stored for one member of a class, or null when the class holds no
 *  placement for them — which is not rung 0. */
export function rungForHandle(
  levels: Record<string, number> | undefined,
  handle: string | undefined,
): RungLevel | null {
  if (!levels || !handle) return null;
  const value = levels[handle];
  return isRung(value) ? value : null;
}
