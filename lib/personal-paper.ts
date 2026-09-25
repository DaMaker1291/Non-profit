// ─────────────────────────────────────────────────────────────────────────────
// "BRING YOUR OWN PAPER" — evidence from a paper OpenMind never receives.
//
// The problem this solves: a learner in Kenya, India, Brazil or the UK sits
// their own board's paper, and OpenMind cannot host it — the board's terms
// forbid reproduction, and no licence exists. Refusing to help would be absurd.
// So the learner brings the paper and OpenMind brings the WORKSPACE:
//
//     the learner keeps the paper and their answers
//     OpenMind keeps only what the learner types:
//       · which question number, how many marks it was worth,
//       · how many marks they actually got,
//       · which idea the question tested (their own attribution, from their
//         own specification).
//
// NOTHING ELSE. No question text, no PDF, no page image, no board content of
// any kind. `validatePersonalPaper` REJECTS a payload containing anything
// content-bearing rather than deleting it quietly, because the safest handling
// of a copyrighted document is never to receive it — see lib/content-rights.ts
// for why "the student uploaded it" is not a redistribution licence.
//
// What that buys, honestly:
//   · concept-level mark loss, recurring ideas, a weakest-idea drill target —
//     the SAME analysis an OpenMind paper produces, from the same pipeline
//     (`analyseMarked`), so the learner model cannot tell the two apart in
//     quality even though the evidence arrived a completely different way;
//   · NO misconception evidence, ever: a mark total says WHICH idea cost
//     marks, never WHY, and guessing the why would poison the diagnosis.
//   · an unanswered question (0 awarded) is lost marks but is NOT a wrong
//     answer — guessing and skipping are different failures here too.
//
// Every personal paper is private to its owner: stored under their id, read
// back only by them, never shared, never aggregated, never used to train
// anything (content-rights again — the flags are not decoration).
// ─────────────────────────────────────────────────────────────────────────────

import { getConcept } from "./genome";
import { analyseMarked, type MarkedPaper, type PaperAnalysis } from "./paper-analysis";
import { rightsFor } from "./content-rights";
import type { BoardId } from "./types";

/** Deliberately small. A workspace for marking your own paper, not a document
 *  management system. */
export const PERSONAL_PAPER_LIMITS = {
  maxQuestions: 80,
  minMarks: 1,
  maxMarksPerQuestion: 20,
  maxTitleLength: 120,
  maxLabelLength: 24,
} as const;

export interface PersonalPaperQuestion {
  /** The learner's own label for the question ("17", "3b") — an identifier. */
  number: string;
  /** The idea it tested, chosen from the learner's own specification. */
  conceptId: string;
  marks: number;
  awarded: number;
}

export interface PersonalPaper {
  id: string;
  /** Private to this learner. Enforced on read, not just on write. */
  owner: string;
  origin: "user_provided";
  title: string;
  board?: BoardId;
  specId?: string;
  year?: string;
  questions: PersonalPaperQuestion[];
  createdAt: number;
}

/** The only keys a personal paper may contain. Anything else — `prompt`,
 *  `text`, `image`, `pdf`, `html`, `url` — is refused rather than ignored, so a
 *  client cannot use this route to park board content in OpenMind's storage. */
const ALLOWED_QUESTION_KEYS = ["number", "conceptId", "marks", "awarded"];
const ALLOWED_PAPER_KEYS = ["title", "board", "specId", "year", "questions"];

export type PersonalPaperRejection =
  | { error: "content_not_accepted"; field: string }
  | { error: "empty" }
  | { error: "too_many_questions" }
  | { error: "bad_marks"; index: number }
  | { error: "bad_concept"; index: number }
  | { error: "bad_title" }
  | { error: "duplicate_question"; index: number };

export interface PersonalPaperInput {
  title?: unknown;
  board?: unknown;
  specId?: unknown;
  year?: unknown;
  questions?: unknown;
}

const asInt = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) ? n : null;
};

const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null;

/**
 * Validate without ever looking at content. Returns a rejection whose `field`
 * names the offending key, so the UI can tell the learner exactly what was
 * refused instead of "invalid input".
 */
export function validatePersonalPaper(
  input: PersonalPaperInput,
): { ok: true; paper: Omit<PersonalPaper, "id" | "owner" | "createdAt" | "origin"> } | { ok: false } & PersonalPaperRejection {
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_PAPER_KEYS.includes(key)) return { ok: false, error: "content_not_accepted", field: key };
  }
  const title = str(input?.title, PERSONAL_PAPER_LIMITS.maxTitleLength);
  if (!title) return { ok: false, error: "bad_title" };
  const rawQuestions = Array.isArray(input?.questions) ? input.questions : [];
  if (rawQuestions.length === 0) return { ok: false, error: "empty" };
  if (rawQuestions.length > PERSONAL_PAPER_LIMITS.maxQuestions) return { ok: false, error: "too_many_questions" };

  const questions: PersonalPaperQuestion[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < rawQuestions.length; i++) {
    const raw = rawQuestions[i] as Record<string, unknown>;
    if (!raw || typeof raw !== "object") return { ok: false, error: "bad_marks", index: i };
    for (const key of Object.keys(raw)) {
      if (!ALLOWED_QUESTION_KEYS.includes(key)) return { ok: false, error: "content_not_accepted", field: key };
    }
    const number = str(raw.number, PERSONAL_PAPER_LIMITS.maxLabelLength);
    const marks = asInt(raw.marks);
    const awarded = asInt(raw.awarded);
    if (!number) return { ok: false, error: "bad_marks", index: i };
    if (seen.has(number)) return { ok: false, error: "duplicate_question", index: i };
    seen.add(number);
    if (
      marks === null || awarded === null ||
      marks < PERSONAL_PAPER_LIMITS.minMarks || marks > PERSONAL_PAPER_LIMITS.maxMarksPerQuestion ||
      awarded < 0 || awarded > marks
    ) {
      return { ok: false, error: "bad_marks", index: i };
    }
    const conceptId = typeof raw.conceptId === "string" ? raw.conceptId : "";
    if (!getConcept(conceptId)) return { ok: false, error: "bad_concept", index: i };
    questions.push({ number, conceptId, marks, awarded });
  }

  const board = typeof input?.board === "string" && input.board ? (input.board as BoardId) : undefined;
  const specId = typeof input?.specId === "string" && input.specId ? input.specId : undefined;
  const year = typeof input?.year === "string" && input.year.length <= 12 ? input.year : undefined;
  return { ok: true, paper: { title, board, specId, year, questions } };
}

/** The marked-paper shape the shared analyser consumes. */
export function toMarkedPaper(p: PersonalPaper): MarkedPaper {
  const total = p.questions.reduce((s, q) => s + q.marks, 0);
  const raw = p.questions.reduce((s, q) => s + q.awarded, 0);
  return {
    paperId: p.id,
    raw,
    total,
    pct: total > 0 ? Math.round((raw / total) * 100) : 0,
    perQuestion: p.questions.map((q, i) => ({
      id: `${p.id}:q${i}`,
      conceptId: q.conceptId,
      marks: q.marks,
      awarded: q.awarded,
      // 0 marks awarded on a question that is worth marks is NOT evidence of a
      // wrong belief — it is an unanswered question, and `null` says exactly
      // that. Guessing and skipping are different failures.
      correct: q.awarded >= q.marks ? true : q.awarded === 0 ? null : false,
      // No tags. A mark total never says why.
    })),
  };
}

/** The same diagnosis an OpenMind paper produces, from a paper OpenMind has
 *  never seen. */
export function analysePersonalPaper(p: PersonalPaper): PaperAnalysis {
  return analyseMarked(toMarkedPaper(p));
}

/** What each question contributes to the learner model. */
export interface PersonalPaperEvidence {
  conceptId: string;
  questionId: string;
  /** Full marks secured. Partial credit is not a correct answer. */
  correct: boolean;
  marks: number;
  awarded: number;
  /** True when the learner left it out — recorded, but never as a wrong answer
   *  and never as a misconception. */
  unanswered: boolean;
}

export function personalPaperEvidence(p: PersonalPaper): PersonalPaperEvidence[] {
  return toMarkedPaper(p).perQuestion.map((q) => ({
    conceptId: q.conceptId,
    questionId: q.id,
    correct: q.correct === true,
    marks: q.marks,
    awarded: q.awarded,
    unanswered: q.awarded === 0,
  }));
}

/** Whether this record may be stored at all — asked rather than assumed, so the
 *  rights model is load-bearing rather than decorative. */
export function mayStorePersonalPaper(): boolean {
  return rightsFor("user_provided").canStore && rightsFor("user_provided").canProcess;
}
