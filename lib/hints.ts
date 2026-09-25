// ─────────────────────────────────────────────────────────────────────────────
// The "I'm stuck" ladder. A student never gets the answer for free — they
// choose how much scaffolding they want, and each request is recorded.
//
// Hints are returned as i18n keys + optional curriculum text. The generic
// nudge/strategy lines are fully translated; anything drawn from the question
// itself (the explanation) stays curriculum content, like the questions are.
// ─────────────────────────────────────────────────────────────────────────────

export interface HintLevel {
  level: 1 | 2 | 3 | 4;
  /** i18n key of the button label. */
  labelKey: string;
  /** i18n key of the aria description. */
  descKey: string;
}

export const HINT_LEVELS: HintLevel[] = [
  { level: 1, labelKey: "hint.tiny", descKey: "hint.tinyDesc" },
  { level: 2, labelKey: "hint.strong", descKey: "hint.strongDesc" },
  { level: 3, labelKey: "hint.firstStep", descKey: "hint.firstStepDesc" },
  { level: 4, labelKey: "hint.walkthrough", descKey: "hint.walkthroughDesc" },
];

export interface Hint {
  /** i18n key of the generic ladder text, if this level has one. */
  key?: string;
  /** Curriculum text drawn from the question's own explanation (English). */
  text?: string;
}

/** Build the hint for a question at a given ladder level from the question's
 *  own explanation and misconception tags. Deterministic, no external calls:
 *  the ladder must work offline. */
export function buildHint(q: { prompt: string; explanation: string }, level: number): Hint {
  if (level <= 1) {
    // Tiny hint: point at the goal, never the method.
    return { key: "hint.body.tiny" };
  }
  if (level <= 2) {
    // Strong hint: the first methodological move.
    return { key: "hint.body.strong" };
  }
  if (level <= 3) {
    // First step: the opening move, spelled out — plus the translated strategy line.
    const first = q.explanation.split(".")[0];
    return { key: "hint.body.strong", text: first ? `${first}.` : undefined };
  }
  // Level 4: full walkthrough = the explanation itself (curriculum content).
  return { text: q.explanation };
}
