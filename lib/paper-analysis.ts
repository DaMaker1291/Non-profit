// ─────────────────────────────────────────────────────────────────────────────
// A PAPER IS NOT A SCORE. IT IS DIAGNOSTIC EVIDENCE.
//
// Marking tells a learner 62/100. That number cannot be acted on. What can:
// which IDEAS cost marks, whether the same idea came up more than once, and
// what to do next. This module turns a marked paper into that, deterministically
// and offline, from evidence the paper already carries:
//
//   · every question knows its concept (the paper is assembled from the
//     specification's own coverage, not from generic text),
//   · the answer key carries the misconception tags each question targets,
//   · the marker knows which questions were wrong, skipped, and how many marks
//     each was worth.
//
// Deliberate honesty:
//   · No invented topic taxonomy. The genome's specification layer defines
//     stage windows and concept coverage, not board topic names, so the
//     breakdown is by CONCEPT — the finest true grouping available — and the
//     rollup names the ideas that recurred rather than pretending to be a
//     board's "Cell biology" heading.
//   · An unanswered question is lost marks but it is NOT a wrong answer, and it
//     never tags a misconception. Guessing and skipping are different failures.
//   · Nothing here estimates ability: it reports what this paper measured.
// ─────────────────────────────────────────────────────────────────────────────

import { getConcept } from "./genome";
import type { BuiltPaperAnswerKey, PaperResult } from "./papers";

export interface ConceptTally {
  conceptId: string;
  subject: string;
  /** Questions that tested this idea. */
  questions: number;
  marksAvailable: number;
  marksAwarded: number;
  /** marksAvailable - marksAwarded. */
  marksLost: number;
  correct: number;
  /** Answered wrong — distinct from unanswered, which is not a belief. */
  wrong: number;
  unanswered: number;
  /** Misconception tags carried by the questions that lost marks, ranked. */
  tags: Array<{ id: string; hits: number }>;
}

export interface PaperAnalysis {
  paperId: string;
  raw: number;
  total: number;
  pct: number;
  lostMarks: number;
  unansweredCount: number;
  /** Every idea the paper tested, hardest-hit first. */
  byConcept: ConceptTally[];
  /** Ideas that lost marks on more than one question — a pattern, not a slip. */
  recurring: ConceptTally[];
  /** The one idea worth working on next (recurring first, then most marks lost). */
  weakest: ConceptTally | null;
  /** Share of the lost marks that sat on recurring ideas, 0–1. */
  concentration: number;
  /** Every question that lost marks, in paper order — the review list. */
  missed: Array<{ id: string; conceptId: string; marks: number; awarded: number; correct: boolean | null }>;
}

/** One marked question, from ANY source.
 *
 *  The pipeline below does not care whether the marks came from an OpenMind
 *  paper, a licensed board paper, or a learner marking their own paper at the
 *  kitchen table — the evidence a learner generates should be interpreted the
 *  same way whatever produced it. `tags` stays optional for exactly that
 *  reason: a personal paper knows WHICH questions lost marks but never WHY, so
 *  it can contribute concept evidence and no misconception evidence at all. */
export interface MarkedQuestion {
  id: string;
  conceptId: string;
  marks: number;
  awarded: number;
  /** true = full marks, false = answered and lost marks, null = not answered. */
  correct: boolean | null;
  tags?: string[];
}

export interface MarkedPaper {
  paperId: string;
  raw: number;
  total: number;
  pct: number;
  perQuestion: MarkedQuestion[];
}

/** Turn a marked paper into the diagnosis a learner can act on. */
export function analyseMarked(input: MarkedPaper): PaperAnalysis {
  const byConcept = new Map<string, ConceptTally>();
  const missed: PaperAnalysis["missed"] = [];
  let unansweredCount = 0;

  for (const q of input.perQuestion) {
    const concept = getConcept(q.conceptId);
    const tally = byConcept.get(q.conceptId) ?? {
      conceptId: q.conceptId,
      subject: concept?.subject ?? "maths",
      questions: 0,
      marksAvailable: 0,
      marksAwarded: 0,
      marksLost: 0,
      correct: 0,
      wrong: 0,
      unanswered: 0,
      tags: [],
    };
    tally.questions += 1;
    tally.marksAvailable += q.marks;
    tally.marksAwarded += q.awarded;
    tally.marksLost += q.marks - q.awarded;
    if (q.correct === true) tally.correct += 1;
    else if (q.correct === null) { tally.unanswered += 1; unansweredCount += 1; }
    else tally.wrong += 1;

    // Tags are attributed only to questions that actually cost marks, and only
    // for answers the learner gave: a skipped question proves nothing about
    // what they believe.
    if (q.correct === false) {
      for (const tag of q.tags ?? []) {
        const existing = tally.tags.find((t) => t.id === tag);
        if (existing) existing.hits += 1;
        else tally.tags.push({ id: tag, hits: 1 });
      }
    }
    if (q.awarded < q.marks) {
      missed.push({ id: q.id, conceptId: q.conceptId, marks: q.marks, awarded: q.awarded, correct: q.correct });
    }
    byConcept.set(q.conceptId, tally);
  }

  const ranked = [...byConcept.values()].sort(
    (a, b) => b.marksLost - a.marksLost || b.questions - a.questions || a.conceptId.localeCompare(b.conceptId),
  );
  for (const t of ranked) t.tags.sort((a, b) => b.hits - a.hits || a.id.localeCompare(b.id));

  const recurring = ranked.filter((t) => t.marksLost > 0 && t.questions > 1);
  const lostMarks = input.total - input.raw;
  const lostOnRecurring = recurring.reduce((s, t) => s + t.marksLost, 0);

  return {
    paperId: input.paperId,
    raw: input.raw,
    total: input.total,
    pct: input.pct,
    lostMarks,
    unansweredCount,
    byConcept: ranked,
    recurring,
    weakest: recurring[0] ?? ranked.find((t) => t.marksLost > 0) ?? null,
    concentration: lostMarks > 0 ? Math.min(1, lostOnRecurring / lostMarks) : 0,
    missed,
  };
}

/** The answer-key path: an OpenMind paper, whose key carries the misconception
 *  tags each question targets. Thin wrapper over `analyseMarked` so both
 *  sources share ONE interpretation of what a lost mark means. */
export function analysePaper(key: BuiltPaperAnswerKey, result: PaperResult): PaperAnalysis {
  const tagsById = new Map(key.questions.map((k) => [k.id, k.tags] as const));
  return analyseMarked({
    paperId: result.paperId,
    raw: result.raw,
    total: result.total,
    pct: result.pct,
    perQuestion: result.perQuestion.map((q) => ({
      id: q.id,
      conceptId: q.conceptId,
      marks: q.marks,
      awarded: q.awarded,
      correct: q.correct,
      tags: tagsById.get(q.id) ?? [],
    })),
  });
}
