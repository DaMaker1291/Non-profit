// ─────────────────────────────────────────────────────────────────────────────
// EXAM PAPERS. "Use past papers from their major board exams" is the single
// most requested thing in this project, so here is what can be built honestly:
//
//   * every paper is assembled from the REAL specification layer
//     (lib/specifications.ts coverage for the student's qualification + tier),
//   * the paper's structure — papers, sections, mark values, time allowed,
//     calculator rules, grade boundaries — follows the awarding body's
//     published shape for that qualification,
//   * the questions are OpenMind's own exam-style questions written to that
//     specification, at that tier's difficulty.
//
// It is NOT a reproduction of copyrighted past-paper text, and the UI says so
// in the learner's language rather than implying otherwise.
//
// Marking is exact for the engine's questions (a question's key is known) and
// grade estimates use published-boundary *percentages* — always labelled an
// estimate, because real boundaries move every series.
// ─────────────────────────────────────────────────────────────────────────────

import { bySubject, getConcept } from "./genome";
import { subjectLabel } from "./subjects";
import { coverageOf, specById, type ActiveSpec } from "./specifications";
import { generateQuestion, generateQuestionNear, hasGenerator, hashSeed, serveView, type QuestionView } from "./questions";
import type { BoardId, Question, SubjectId } from "./types";

export interface PaperSectionSpec {
  /** Data, not translation: the awarding body's own section label. */
  name: string;
  count: number;
  marksEach: number;
  /** Difficulty target handed to generateQuestionNear for this section. */
  difficulty: number;
}

export interface GradeBoundary {
  grade: string;
  /** Percentage of the paper's total marks. Published boundaries move every
   *  series — this is the ballpark the qualification is known for. */
  pct: number;
}

export interface PaperTemplate {
  id: string;
  name: string;
  subject: SubjectId;
  minutes: number;
  marks: number;
  calculator: boolean;
  sections: PaperSectionSpec[];
  boundaries: GradeBoundary[];
  /** Specification ids this paper belongs to (validated against the real
   *  specification layer — a paper cannot name a qualification that does not
   *  exist). */
  specs: string[];
}

/** Section totals must add up to the declared paper total, or the paper lies
 *  about its own length. Checked here at module load, loudly. */
function paper(
  t: Omit<PaperTemplate, "marks"> & { marks?: number },
): PaperTemplate {
  const total = t.sections.reduce((s, x) => s + x.count * x.marksEach, 0);
  if (t.marks !== undefined && t.marks !== total) {
    throw new Error(`paper ${t.id}: declared ${t.marks} marks but sections total ${total}`);
  }
  return { ...t, marks: total };
}

const GCSE_BOUNDARIES: GradeBoundary[] = [
  { grade: "9", pct: 0.80 }, { grade: "8", pct: 0.70 }, { grade: "7", pct: 0.62 },
  { grade: "6", pct: 0.53 }, { grade: "5", pct: 0.44 }, { grade: "4", pct: 0.34 },
];

export const PAPERS: PaperTemplate[] = [
  paper({
    id: "aqa-gcse-maths-p1", name: "GCSE Mathematics — Paper 1 (non-calculator)",
    subject: "maths", minutes: 90, calculator: false, specs: ["uk-gcse"], boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 2, difficulty: 0.4 },
      { name: "Section B", count: 12, marksEach: 4, difficulty: 0.55 },
      { name: "Section C", count: 2, marksEach: 6, difficulty: 0.72 },
    ],
  }),
  paper({
    id: "edexcel-gcse-maths-p1", name: "GCSE Mathematics — Paper 1 (non-calculator)",
    subject: "maths", minutes: 90, calculator: false, specs: ["uk-gcse"], boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 12, marksEach: 2, difficulty: 0.4 },
      { name: "Section B", count: 11, marksEach: 4, difficulty: 0.55 },
      { name: "Section C", count: 2, marksEach: 6, difficulty: 0.72 },
    ],
  }),
  paper({
    id: "aqa-alevel-maths-p1", name: "A-Level Mathematics — Paper 1 (Pure)",
    subject: "maths", minutes: 120, calculator: true, specs: ["uk-alevel"],
    boundaries: [{ grade: "A*", pct: 0.80 }, { grade: "A", pct: 0.70 }, { grade: "B", pct: 0.60 }, { grade: "C", pct: 0.50 }],
    sections: [
      { name: "Section A", count: 10, marksEach: 4, difficulty: 0.78 },
      { name: "Section B", count: 6, marksEach: 10, difficulty: 0.9 },
    ],
  }),
  paper({
    id: "cambridge-igcse-maths-extended", name: "Cambridge IGCSE Mathematics (Extended)",
    subject: "maths", minutes: 90, calculator: true, specs: ["int-igcse"],
    boundaries: [{ grade: "A*", pct: 0.85 }, { grade: "A", pct: 0.72 }, { grade: "B", pct: 0.60 }, { grade: "C", pct: 0.48 }, { grade: "D", pct: 0.38 }],
    sections: [
      { name: "Section A", count: 14, marksEach: 4, difficulty: 0.6 },
      { name: "Section B", count: 2, marksEach: 7, difficulty: 0.78 },
    ],
  }),
  paper({
    id: "ib-maths-sl-p1", name: "IB Mathematics — Paper 1 (no calculator)",
    subject: "maths", minutes: 90, calculator: false, specs: ["int-ib"],
    boundaries: [{ grade: "7", pct: 0.82 }, { grade: "6", pct: 0.70 }, { grade: "5", pct: 0.58 }, { grade: "4", pct: 0.46 }],
    sections: [
      { name: "Section A", count: 12, marksEach: 5, difficulty: 0.7 },
      { name: "Section B", count: 5, marksEach: 6, difficulty: 0.82 },
    ],
  }),
  paper({
    id: "cbse-class10-maths-standard", name: "CBSE Class 10 Mathematics (Standard)",
    subject: "maths", minutes: 180, calculator: false, specs: ["in-cbse"],
    boundaries: [{ grade: "A1", pct: 0.9 }, { grade: "A2", pct: 0.8 }, { grade: "B1", pct: 0.7 }, { grade: "B2", pct: 0.6 }, { grade: "Pass", pct: 0.33 }],
    sections: [
      { name: "Section A", count: 20, marksEach: 1, difficulty: 0.35 },
      { name: "Section B", count: 5, marksEach: 2, difficulty: 0.45 },
      { name: "Section C", count: 6, marksEach: 3, difficulty: 0.55 },
      { name: "Section D", count: 4, marksEach: 5, difficulty: 0.65 },
      { name: "Section E", count: 3, marksEach: 4, difficulty: 0.7 },
    ],
  }),
  paper({
    id: "cbse-class12-physics", name: "CBSE Class 12 Physics",
    subject: "physics", minutes: 180, calculator: true, specs: ["in-cbse"],
    boundaries: [{ grade: "A1", pct: 0.9 }, { grade: "A2", pct: 0.8 }, { grade: "B1", pct: 0.7 }, { grade: "B2", pct: 0.6 }, { grade: "Pass", pct: 0.33 }],
    sections: [
      { name: "Section A", count: 16, marksEach: 1, difficulty: 0.45 },
      { name: "Section B", count: 5, marksEach: 2, difficulty: 0.55 },
      { name: "Section C", count: 7, marksEach: 3, difficulty: 0.65 },
      { name: "Section D", count: 3, marksEach: 5, difficulty: 0.75 },
    ],
  }),
  paper({
    id: "digital-sat-math", name: "Digital SAT — Math module",
    subject: "maths", minutes: 35, calculator: true, specs: ["us-sat"],
    boundaries: [{ grade: "800", pct: 0.96 }, { grade: "700", pct: 0.85 }, { grade: "600", pct: 0.72 }, { grade: "500", pct: 0.58 }],
    sections: [{ name: "Module", count: 22, marksEach: 1, difficulty: 0.62 }],
  }),
  paper({
    id: "kcse-maths-p1", name: "KCSE Mathematics — Paper 1",
    subject: "maths", minutes: 150, calculator: false, specs: ["ke-kcse"],
    boundaries: [{ grade: "A", pct: 0.8 }, { grade: "B", pct: 0.65 }, { grade: "C", pct: 0.5 }, { grade: "D", pct: 0.35 }],
    sections: [
      { name: "Section I", count: 16, marksEach: 2, difficulty: 0.45 },
      { name: "Section II", count: 5, marksEach: 10, difficulty: 0.7 },
    ],
  }),
  paper({
    id: "caps-maths-p1", name: "NSC Mathematics — Paper 1 (CAPS)",
    subject: "maths", minutes: 180, calculator: true, specs: ["za-nsc"],
    boundaries: [{ grade: "7", pct: 0.8 }, { grade: "6", pct: 0.7 }, { grade: "5", pct: 0.6 }, { grade: "4", pct: 0.5 }, { grade: "3", pct: 0.4 }],
    sections: [
      { name: "Section A", count: 10, marksEach: 5, difficulty: 0.5 },
      { name: "Section B", count: 5, marksEach: 20, difficulty: 0.72 },
    ],
  }),
  paper({
    id: "aqa-gcse-physics", name: "GCSE Physics — Paper 1",
    subject: "physics", minutes: 75, calculator: true, specs: ["uk-gcse"],
    boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 3, difficulty: 0.45 },
      { name: "Section B", count: 5, marksEach: 6, difficulty: 0.62 },
    ],
  }),
  paper({
    id: "aqa-gcse-chemistry", name: "GCSE Chemistry — Paper 1",
    subject: "chemistry", minutes: 75, calculator: true, specs: ["uk-gcse"],
    boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 3, difficulty: 0.45 },
      { name: "Section B", count: 5, marksEach: 6, difficulty: 0.62 },
    ],
  }),
  paper({
    id: "aqa-gcse-biology", name: "GCSE Biology — Paper 1",
    subject: "biology", minutes: 75, calculator: false, specs: ["uk-gcse"],
    boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 2, difficulty: 0.42 },
      { name: "Section B", count: 6, marksEach: 5, difficulty: 0.6 },
    ],
  }),
];

/** Papers available for a qualification (by spec id), optionally one subject. */
export function papersForSpec(specId: string, subject?: SubjectId): PaperTemplate[] {
  return PAPERS.filter((p) => p.specs.includes(specId) && (!subject || p.subject === subject));
}

/**
 * A paper for a qualification that has no authored blueprint. Built from the
 * REAL difficulty band and coverage of that qualification's tier, and labelled
 * as what it is: an exam-style paper to the specification, not a board mock.
 */
export function genericPaper(active: ActiveSpec, subject: SubjectId, lang?: string): PaperTemplate {
  const d = active.level.difficulty;
  const count = subject === "maths" ? 20 : 14;
  return paper({
    id: `spec-${active.spec.id}-${active.level.id}-${subject}`,
    // The name is the translated subject, and nothing else: the qualification
    // and tier are already the heading, so spelling out the raw subject id
    // here is how "— maths paper" used to leak English into a translated UI.
    name: subjectLabel(subject, lang),
    subject,
    minutes: Math.max(30, Math.round(count * 3.5)),
    calculator: true,
    specs: [active.spec.id],
    boundaries: [
      { grade: "A", pct: d + 0.15 },
      { grade: "B", pct: d + 0.02 },
      { grade: "C", pct: Math.max(0.3, d - 0.12) },
      { grade: "Pass", pct: Math.max(0.2, d - 0.28) },
    ],
    sections: [
      { name: "Short answers", count: Math.round(count * 0.6), marksEach: 2, difficulty: Math.max(0.2, d - 0.15) },
      { name: "Longer questions", count: count - Math.round(count * 0.6), marksEach: 5, difficulty: d },
    ],
  });
}

/** The paper a student should be offered first: an authored board paper when
 *  their qualification has one, otherwise the specification-built paper. */
export function defaultPaperFor(active: ActiveSpec, subject: SubjectId, lang?: string): PaperTemplate {
  const authored = papersForSpec(active.spec.id, subject)[0];
  return authored ?? genericPaper(active, subject, lang);
}

// ── Assembly ────────────────────────────────────────────────────────────────

export interface PaperQuestion {
  /** Stable id inside the paper, e.g. "q7". */
  id: string;
  conceptId: string;
  /** Reproducible draw key: the same paper seed rebuilds the same question. */
  seed: string;
  marks: number;
  difficulty: number;
  view: QuestionView;
}

export interface PaperSection {
  name: string;
  marksEach: number;
  questions: PaperQuestion[];
}

export interface BuiltPaper {
  id: string;
  templateId: string;
  name: string;
  /** The qualification's own name (proper noun). */
  qualification: string;
  level: string;
  subject: SubjectId;
  board: BoardId;
  minutes: number;
  marks: number;
  calculator: boolean;
  boundaries: GradeBoundary[];
  sections: PaperSection[];
  questionCount: number;
}

export interface BuiltPaperAnswerKey {
  id: string;
  spec: string;
  templateId: string;
  name: string;
  level: string;
  subject: SubjectId;
  minutes: number;
  calculator: boolean;
  /** Carried on the key itself so marking needs nothing else — no global
   *  registry to get out of step with the paper that was actually sat. */
  boundaries: GradeBoundary[];
  createdAt: number;
  questions: Array<{
    id: string;
    conceptId: string;
    seed: string;
    /** Index into the served choices. */
    answer: number;
    marks: number;
    difficulty: number;
    explanation: string;
    tags: string[];
    prompt: string;
  }>;
}

/** Concepts in this qualification that have a generator to draw from. */
export function paperConcepts(active: ActiveSpec, subject: SubjectId): string[] {
  const inSpec = coverageOf(active).filter((c) => c.subject === subject).map((c) => c.id);
  const usable = inSpec.filter((id) => hasGenerator(id));
  if (usable.length) return usable;
  // No in-specification generator for this subject: fall back to the whole
  // subject rather than serving an empty paper.
  return bySubject(subject).map((c) => c.id).filter((id) => hasGenerator(id));
}

function pick(candidates: string[], seed: string, salt: number): string | null {
  if (!candidates.length) return null;
  return candidates[(hashSeed(seed) + salt) % candidates.length] ?? null;
}

/**
 * Draw one question for a slot, trying a handful of concepts before giving up.
 * `generateQuestionNear` (not `…At`) is deliberate: a section declares a tier
 * target, and "at or above" would hand a Foundation-tier slot the hardest draw
 * the generator can make.
 */
function drawFor(
  candidates: string[],
  seed: string,
  target: number,
): { conceptId: string; seed: string; question: Question } | null {
  for (let attempt = 0; attempt < 8; attempt++) {
    const conceptId = pick(candidates, `${seed}:${attempt}`, attempt);
    if (!conceptId) return null;
    const qSeed = `${seed}:${conceptId}:${attempt}`;
    const q = generateQuestionNear(conceptId, qSeed, target) ?? generateQuestion(conceptId, qSeed);
    if (q) return { conceptId, seed: qSeed, question: q };
  }
  return null;
}

export interface BuildPaperOptions {
  active: ActiveSpec;
  subject: SubjectId;
  /** Same seed ⇒ same paper, so a sitting can be resumed and marked later. */
  seed: string;
  lang?: string;
  template?: PaperTemplate;
  /** Questions supplied by a better source (the AI layer). Keyed by slot id. */
  replacements?: Record<string, { conceptId: string; question: Question }>;
}

export function buildPaper(opts: BuildPaperOptions): { paper: BuiltPaper; key: BuiltPaperAnswerKey } {
  const template = opts.template ?? defaultPaperFor(opts.active, opts.subject, opts.lang);
  const candidates = paperConcepts(opts.active, opts.subject);
  const id = `pap_${hashSeed(`${template.id}:${opts.seed}`).toString(36)}${hashSeed(opts.seed).toString(36)}`;
  const sections: PaperSection[] = [];
  const key: BuiltPaperAnswerKey["questions"] = [];
  let n = 0;

  for (const section of template.sections) {
    const questions: PaperQuestion[] = [];
    for (let i = 0; i < section.count; i++) {
      const qid = `q${++n}`;
      const slotSeed = `${template.id}:${opts.seed}:${qid}`;
      const replacement = opts.replacements?.[qid];
      const drawn = replacement
        ? { conceptId: replacement.conceptId, seed: slotSeed, question: replacement.question }
        : drawFor(candidates, slotSeed, section.difficulty);
      if (!drawn) continue;
      const { question } = drawn;
      questions.push({
        id: qid,
        conceptId: drawn.conceptId,
        seed: drawn.seed,
        marks: section.marksEach,
        difficulty: question.difficulty,
        view: serveView(question, opts.lang, opts.active.spec.board),
      });
      key.push({
        id: qid,
        conceptId: drawn.conceptId,
        seed: drawn.seed,
        answer: question.answer,
        marks: section.marksEach,
        difficulty: question.difficulty,
        explanation: question.explanation,
        tags: question.misconceptionTags,
        prompt: question.prompt,
      });
    }
    sections.push({ name: section.name, marksEach: section.marksEach, questions });
  }

  const marks = key.reduce((s, q) => s + q.marks, 0);
  const paper: BuiltPaper = {
    id,
    templateId: template.id,
    name: template.name,
    qualification: opts.active.spec.name,
    level: opts.active.level.name || opts.active.level.id,
    subject: opts.subject,
    board: opts.active.spec.board,
    minutes: template.minutes,
    marks,
    calculator: template.calculator,
    boundaries: template.boundaries,
    sections,
    questionCount: key.length,
  };
  return {
    paper,
    key: {
      id,
      spec: opts.active.spec.id,
      templateId: template.id,
      name: template.name,
      level: opts.active.level.id,
      subject: opts.subject,
      minutes: template.minutes,
      calculator: template.calculator,
      boundaries: template.boundaries,
      createdAt: Date.now(),
      questions: key,
    },
  };
}

// ── Marking ─────────────────────────────────────────────────────────────────

export interface PaperResult {
  paperId: string;
  raw: number;
  total: number;
  pct: number;
  /** Highest declared boundary the percentage reaches (null below all of them). */
  grade: string | null;
  perQuestion: Array<{
    id: string;
    conceptId: string;
    marks: number;
    awarded: number;
    correct: boolean | null;
    chosen: number | null;
    answer: number;
    explanation: string;
  }>;
}

/** Mark a sitting. `answers` maps question id → chosen choice index; a missing
 *  answer is unanswered, never a free mark. */
export function markPaper(
  key: BuiltPaperAnswerKey,
  answers: Record<string, number>,
): PaperResult {
  let raw = 0;
  const perQuestion = key.questions.map((q) => {
    const chosen = typeof answers[q.id] === "number" ? answers[q.id] : null;
    const correct = chosen === null ? null : chosen === q.answer;
    const awarded = correct === true ? q.marks : 0;
    raw += awarded;
    return {
      id: q.id, conceptId: q.conceptId, marks: q.marks, awarded,
      correct, chosen, answer: q.answer, explanation: q.explanation,
    };
  });
  const total = key.questions.reduce((s, q) => s + q.marks, 0);
  const pct = total > 0 ? raw / total : 0;
  const reached = [...key.boundaries].filter((b) => pct >= b.pct).sort((a, b) => b.pct - a.pct)[0];
  return { paperId: key.id, raw, total, pct, grade: reached?.grade ?? null, perQuestion };
}

/** Concept coverage actually sampled by a paper — the honest "what it tests"
 *  list shown next to the mark scheme. */
export function paperConceptsTested(key: BuiltPaperAnswerKey): Array<{ id: string; title: string; subject: string }> {
  const seen = new Set<string>();
  const out: Array<{ id: string; title: string; subject: string }> = [];
  for (const q of key.questions) {
    if (seen.has(q.conceptId)) continue;
    seen.add(q.conceptId);
    const c = getConcept(q.conceptId);
    if (c) out.push({ id: c.id, title: c.title, subject: c.subject });
  }
  return out;
}

export function paperById(id: string): PaperTemplate | null {
  return PAPERS.find((p) => p.id === id) ?? null;
}

export function specNameFor(id: string): string {
  return specById(id)?.name ?? id;
}
