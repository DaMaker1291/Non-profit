// ─────────────────────────────────────────────────────────────────────────────
// WHAT AN ANSWER PROVED — one rule, one vocabulary, everywhere it is said.
//
// There are two different questions about a recorded answer, and this project
// has always answered them in different places:
//
//   the MARK   — was it right?            (the grading route)
//   the PROOF  — what does it establish?  (this module)
//
// The second question has exactly four answers, in a strict priority order, and
// every surface that names one asks THIS module rather than deriving its own:
// the sentence under the mark (§10), the result screen's headline (§7), My
// Evidence's per-concept row (§15) and the teacher's assignment monitor (§18).
// Two surfaces describing the same evidence differently is the failure this
// file exists to make impossible, and the priority order is the whole rule:
//
//   retained     delayed, unaided recall — the strongest claim the platform
//                makes, and the one a learner cannot earn by working harder in
//                the sitting where they learned the idea (§14);
//   transfer     applied in a re-framed context, unaided;
//   independent  right with no hints at all;
//   supported    right, but help was used — real progress, and never described
//                as proof of autonomy.
//
// HINTS ARE THE HINGE. `recordAnswer` (lib/progress.ts) refuses to credit
// independence or transfer to a hinted answer, so the sentence a learner reads
// must refuse it too: a hinted answer described as "unaided" is the one lie
// this vocabulary could tell, and the harness asserts against it from both
// directions. (The rule that used to live in the concept page checked the
// transfer MODE before the hint count — so a hinted transfer answer told the
// learner it was unaided while the model quietly declined to record it. One
// rule, in one file, is what stops the sentence and the ledger disagreeing.)
//
// Nothing here measures anything of its own: every input is a fact the SERVER
// attributed — the staged serve, the server's own hint ledger, the model before
// the answer moved it. This module only decides which word those facts earn.
//
// Pure and dependency-free on purpose: the compile mirror requires it, the
// assignment monitor (a server module) requires it, and a rule that has to be
// imported by three layers must not drag a graph behind it.
// ─────────────────────────────────────────────────────────────────────────────

/** A day, in ms: the shortest gap that makes a recall a RETRIEVAL rather than
 *  another rehearsal inside the same sitting. One definition, because the rule
 *  below is now asked from the live model, the ledger projection, the grade a
 *  learner is shown and the teacher's monitor. */
export const RETENTION_MIN_GAP_MS = 24 * 60 * 60 * 1000;

export type ProofVerdict = "retained" | "transfer" | "independent" | "supported";

/** Strongest first: the order IS the priority rule, written once so no caller
 *  has to remember it. */
export const PROOF_VERDICTS: readonly ProofVerdict[] = [
  "retained",
  "transfer",
  "independent",
  "supported",
];

/**
 * WAS THIS ANSWER A DELAYED, UNAIDED RECALL ATTEMPT? All three conditions are
 * required:
 *
 *   · the server recorded it as a retrieval (which happens because the
 *     scheduler in lib/retention said the concept was due — a client cannot
 *     claim it),
 *   · it needed no hints, so the recall was unaided,
 *   · the previous evidence on the concept is at least a day old.
 *
 * A second run through the same questions in the same sitting therefore buys
 * nothing. Note what this does NOT answer: whether the recall SUCCEEDED. A
 * FAILED retrieval passes all three conditions and is counted as retention
 * asked-but-not-correct, because forgetting is the measurement this dimension
 * exists for — the two facts the surfaces must not confuse are "was this
 * delayed recall" (here) and "did it hold" (this AND `correct`). Asking this
 * question alone and reporting it as the other told a learner who had just
 * failed a due review that their delayed recall was retained; the grading route
 * now names the two separately, and the ledger keeps counting the failure.
 */
export function isRetentionEvidence(input: {
  /** The evidence source the server attributed to the answer. */
  source: string | null | undefined;
  hints: number;
  /** Milliseconds since the previous evidence on this concept, or null when
   *  there is no prior evidence at all — "no prior evidence" is a different
   *  state from "prior evidence a moment ago", and only the latter can be a
   *  retrieval. */
  sinceLast: number | null;
}): boolean {
  return input.source === "retrieval" && input.hints === 0
    && input.sinceLast !== null && input.sinceLast >= RETENTION_MIN_GAP_MS;
}

/**
 * THE FOUR STATES A LEARNER'S RECORD CAN BE IN, as an exercise book would show
 * them — and the ONE rule that names them.
 *
 *   unmeasured  no delayed recall has ever been attempted: "learned, not yet
 *               re-checked". A correct answer MINUTES old is this state, not
 *               the next one: recency is not retention (lib/proof.ts#
 *               isRetentionEvidence explains what makes a recall delayed).
 *   retained    the most recent delayed recall, unaided, was right.
 *   forgotten   the most recent delayed recall, unaided, was wrong.
 *
 * The state is the LATEST outcome, not the ratio, and that is the whole point
 * of keeping `lastHeld` on the record: "held at day 3, lost by day 7" and "lost
 * at day 3, held by day 7" have identical counts (1/2) and opposite states, so
 * a rule reading only the counts would call a learner who can no longer recall
 * something "retained". The counts stay on the record and are shown beside the
 * state — they are the history, and the state is the present.
 *
 * A failed delayed recall therefore differs from a retained one immediately
 * (state, schedule interval and next task all move — measured on the acceptance
 * battery's fail branch) and from a never-measured one permanently (a measured
 * 0/1 is not an absence). Nothing here is inferred from absence: a record with
 * no delayed recall is `unmeasured`, never `forgotten`.
 */
export type RetentionState = "unmeasured" | "retained" | "forgotten";

/** The retention state of one concept, from the retention counter the ledger
 *  keeps for it. `lastHeld` is the LATEST delayed recall's outcome; it is null
 *  on a record that has none, and undefined on a projection built before the
 *  field existed — where the counts still say the weaker true thing, because
 *  anything right at all was a held recall. */
export function retentionState(
  r: { asked: number; correct: number; lastHeld?: boolean | null } | null | undefined,
): RetentionState {
  if (!r || r.asked === 0) return "unmeasured";
  if (r.lastHeld === true) return "retained";
  if (r.lastHeld === false) return "forgotten";
  return r.correct > 0 ? "retained" : "forgotten";
}

/** The label for that state, for the surfaces that name it beside the meter.
 *
 *  `unmeasured` borrows the product's existing words for an absence rather than
 *  getting a second set: "not yet measured" must read the same everywhere.
 *  The two measured states get one key each, in all fifteen dictionaries. */
export function retentionLabelKey(v: RetentionState): string {
  return v === "unmeasured" ? "teach.unmeasured" : `rst.${v}`;
}

/**
 * WHAT ONE ANSWER PROVED. Null for a wrong answer: a miss is evidence, and this
 * vocabulary describes achievement — the coaching under a wrong answer is where
 * a learner is told what went wrong, and inventing a verdict for it here would
 * be a second, quieter voice saying "supported" about a failure.
 */
export function proofVerdict(input: {
  correct: boolean;
  mode?: "guided" | "independent" | "transfer" | null;
  /** The evidence source the server attributed: "retrieval" and "transfer" are
   *  the named stages; "practice" is ordinary work. */
  source?: string | null;
  hints?: number;
  /** Set when the server's own stage recorded delayed recall THAT HELD —
   *  `isRetentionEvidence(...) && correct`, never the first half alone. The
   *  `!correct` guard below would refuse the verdict anyway; this field is
   *  documented so no caller passes the weaker fact and believes it is the
   *  stronger one. A caller that holds only counts (a projection, an assignment
   *  window) computes it with `isRetentionEvidence` plus the answer's mark —
   *  same rule, same three conditions. */
  retained?: boolean;
}): ProofVerdict | null {
  if (!input.correct) return null;
  const hints = input.hints ?? 0;
  if (input.retained) return "retained";
  // A re-framed application is the strongest ordinary proof there is — and only
  // when it was unaided. The hint count is checked first, not last.
  if (hints === 0 && (input.mode === "transfer" || input.source === "transfer")) return "transfer";
  if (hints === 0) return "independent";
  return "supported";
}

/**
 * WHAT A RECORD PROVED — the same priority order over counts instead of one
 * answer, which is what a table, a concept row or a session headline has.
 *
 * Null when nothing was right: "the answers happened" and "something was
 * proved" are different claims, and a monitor that labels a page of wrong
 * answers "supported" would be telling a teacher the class was helped when it
 * was merely marked.
 */
export function strongestProof(t: {
  /** Correct answers of any kind, hint-free or not. */
  correct: number;
  /** Correct AND hint-free. */
  independentCorrect: number;
  /** Correct, hint-free, and re-framed. */
  transferCorrect: number;
  /** Correct, hint-free, delayed. */
  retentionCorrect: number;
}): ProofVerdict | null {
  if (t.retentionCorrect > 0) return "retained";
  if (t.transferCorrect > 0) return "transfer";
  if (t.independentCorrect > 0) return "independent";
  if (t.correct > 0) return "supported";
  return null;
}

/**
 * THE VERDICT FOR ONE GRADED ANSWER, from the block the server attributed.
 *
 * `AnswerVerdict.demonstrated` is the wire shape — `mode`, `source`, `hints`,
 * `retained` — and it is deliberately LOOSE (`mode` arrives as a plain string),
 * because it crosses a JSON boundary the type system does not police. Narrowing
 * it belongs here, beside the rule that consumes it, for the same reason the
 * priority order does: three call sites each casting `mode` is how the same
 * answer comes to be described two different ways on two screens.
 *
 * Null when the grade carried no attribution at all (a replayed offline answer
 * has no fresh verdict to explain) — and null for a WRONG answer, because
 * `proofVerdict` refuses to name an achievement for a miss.
 */
export function verdictForGrade(
  demonstrated: { mode?: string | null; source?: string | null; hints?: number; retained?: boolean } | null | undefined,
  correct: boolean,
): ProofVerdict | null {
  if (!demonstrated) return null;
  const mode =
    demonstrated.mode === "guided" || demonstrated.mode === "independent" || demonstrated.mode === "transfer"
      ? demonstrated.mode
      : null;
  return proofVerdict({
    correct,
    mode,
    source: demonstrated.source ?? null,
    hints: demonstrated.hints ?? 0,
    retained: demonstrated.retained,
  });
}

/** The sentence a learner reads under the mark, in their own language (§10).
 *  One key per verdict, authored in all fifteen dictionaries. */
export function proofSentenceKey(v: ProofVerdict): string {
  return `fb.${v}`;
}

/** The SHORT name for the same verdict, for the places that name it rather
 *  than explain it: a concept row, a session headline, a teacher's column. The
 *  sentence is for the learner at the moment of marking; this is the label that
 *  lets a reader compare one line with another, and it is deliberately the same
 *  word in all four surfaces so "Independent" means one thing across the
 *  product. */
export function proofLabelKey(v: ProofVerdict): string {
  return `prf.${v}`;
}

/** The verdict a learner is TOLD at the moment of marking, derived from one
 *  grade. Kept beside the rule so a surface cannot reach for a key the
 *  vocabulary does not define. */
export function proofSentenceKeyFor(input: Parameters<typeof proofVerdict>[0]): string | null {
  const v = proofVerdict(input);
  return v ? proofSentenceKey(v) : null;
}
