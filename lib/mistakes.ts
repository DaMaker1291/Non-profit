// ─────────────────────────────────────────────────────────────────────────────
// MY MISTAKES, AS A FOLD OVER THE RECORD — and the rule that decides what counts.
//
// The page promised "every recurring slip OpenMind has recorded about you" and
// then filtered on `misconceptions` having a positive count. Only some items
// carry a belief tag: every numeric item has none, and most multiple-choice
// families are built to test a CONCEPT rather than to discriminate one belief.
// So a learner could answer twenty questions wrong and be told, in fifteen
// languages, "No mistakes recorded yet. Practise something, and this page fills
// itself in." — a page that never fills in, for exactly the learners who need
// it. Reproduced against a real profile: two wrong answers on `fractions`,
// `misconceptions: {}`, page empty.
//
// The rule now has two KINDS of row, and the page says which it is showing:
//
//   · NAMED — a belief the item was built to catch, and the answer missed. The
//     count is real (`ConceptProgress.misconceptions`), so it can recur.
//   · COUNTED — wrong answers with no belief behind them. `attempts - correct`
//     is the record's own arithmetic; nothing is inferred about WHY, and the row
//     says so rather than inventing a cause.
//
// Both are actionable (the concept is named and the practice door works), and
// neither is a claim about what the learner believes beyond what the record
// holds. A concept with no misses at all is still absent: this page is not a
// progress table.
// ─────────────────────────────────────────────────────────────────────────────

import type { ConceptProgress } from "./types";

export interface MistakeRow {
  conceptId: string;
  subject: string;
  /** The named belief, or null when the items met carried no belief tag. */
  misconceptionId: string | null;
  /** Hits on the named belief (0 when unnamed). */
  hits: number;
  /** All hits on named beliefs for this concept. */
  totalHits: number;
  /** Wrong answers on this concept, named or not: `attempts - correct`. */
  wrong: number;
  mastery: number;
  attempts: number;
  lastSeen: number;
  /** Further named beliefs on the same concept beyond the leading one. */
  others: number;
}

/** What the page needs to know about a concept; kept structural so this module
 *  does not import the genome (and cannot drag it into a client bundle). */
export interface ConceptRef {
  subject: string;
}

/**
 * The rows, in the order the page shows them.
 *
 * A NAMED BELIEF LEADS A COUNT, because it is the one that can be repaired: the
 * page links each row to a practice door, and "you added the denominators" is a
 * better thing to act on than "4 of 7 answers were wrong here". Within each
 * kind, the biggest and most recent first.
 *
 * `lookup` returning null means the id is not in this build's genome (an old
 * record, a removed concept) — skipped rather than rendered as a dead row.
 */
export function mistakeRows(
  progress: Record<string, ConceptProgress> | null | undefined,
  lookup: (conceptId: string) => ConceptRef | null,
): MistakeRow[] {
  const out: MistakeRow[] = [];
  for (const [conceptId, p] of Object.entries(progress ?? {})) {
    const c = lookup(conceptId);
    if (!c) continue;
    const named = Object.entries(p.misconceptions ?? {})
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1]);
    const wrong = Math.max(0, (p.attempts ?? 0) - (p.correct ?? 0));
    if (named.length === 0 && wrong === 0) continue;
    out.push({
      conceptId,
      subject: c.subject,
      misconceptionId: named.length ? named[0][0] : null,
      hits: named.length ? named[0][1] : 0,
      totalHits: named.reduce((s, [, n]) => s + n, 0),
      wrong,
      mastery: p.mastery,
      attempts: p.attempts,
      lastSeen: p.lastSeen ?? 0,
      others: Math.max(0, named.length - 1),
    });
  }
  return out.sort((a, b) => {
    const named = Number(b.misconceptionId !== null) - Number(a.misconceptionId !== null);
    return named || b.totalHits - a.totalHits || b.wrong - a.wrong || b.lastSeen - a.lastSeen;
  });
}
