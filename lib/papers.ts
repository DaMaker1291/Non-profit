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
import { fill, translator } from "./i18n";
import { subjectLabel } from "./subjects";
import { coverageOf, specById, type ActiveSpec } from "./specifications";
import { generateQuestion, generateQuestionNear, hasGenerator, hashSeed, serveView, type QuestionView } from "./questions";
// The one model of "what does this learner need" (lib/learner-model), asked by
// the record-built paper. Read, never re-derived: a second notion of "weak"
// here is a paper that disagrees with the next-step card about the same learner.
import { buildSnapshot, conceptDone, stuckOn, type ConceptEvidence } from "./learner-model";
import { canTransfer } from "./transfer";
import type { BoardId, ProfileState, Question, SubjectId } from "./types";

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

/**
 * WHAT A PAPER'S SHAPE IS, AND WHO SAYS SO.
 *
 * This field exists because the answer used to differ by country in a way the
 * product never admitted. Seven countries had a blueprint authored from their
 * board's own papers; the other 65 got one set of three shapes built to their
 * qualification's difficulty band, and BOTH were shown to a learner under the
 * same sentence ("written to your board's specification and format"). For the
 * 65 that sentence was false: there is no board format in the app for them, and
 * nothing said so.
 *
 *   published — the awarding body publishes this structure: how many papers a
 *               candidate sits, what they are called, how long each is, and
 *               whether a calculator is allowed. `shapeSource` names where it
 *               was read. Where the body also publishes its item counts, the
 *               counts below are its own (`itemCounts: "published"`); where it
 *               publishes papers and hours but not counts, they are OpenMind's
 *               pacing to that time (`itemCounts: "paced"`).
 *   modelled  — OpenMind built the shape to the qualification's own band. No
 *               board structure is claimed, so none can be believed.
 *
 * TWO THINGS A DECLARED PAPER STILL DOES NOT COPY, both of them said on the
 * paper rather than hidden here. (a) EVERY QUESTION IS MULTIPLE CHOICE, because
 * that is the only format this product marks; where the real paper is written,
 * the section NAMES carry the real structure and the items do not. (b) THE
 * CALCULATOR FLAG IS OPENMIND'S SITTING POLICY, not the awarding body's rule:
 * an objective or computer-based paper is sat here without one and a written
 * paper with one, and no body's rule is asserted. Where an awarding body's own
 * rule has been read it is used instead.
 */
export type PaperBasis = "published" | "modelled";

export interface PaperTemplate {
  id: string;
  name: string;
  subject: SubjectId;
  minutes: number;
  marks: number;
  calculator: boolean;
  sections: PaperSectionSpec[];
  boundaries: GradeBoundary[];
  /** Defaults to "published" for an authored blueprint, and the two runtime
   *  builders (genericPapers, needsPaper) set "modelled" explicitly. */
  basis?: PaperBasis;
  /** The URL the published structure was read from. Absent where the shape is
   *  OpenMind's own, and on the blueprints that predate this field — a citation
   *  backlog `npm run paper-audit` counts and names, rather than a claim the
   *  picker makes on their behalf.
   *
   *  NOT `source`. `source` on a paper is its CONTENT ORIGIN (lib/content-rights.ts:
   *  openmind_authored / licensed_official / …), which is what the licence model
   *  and the rights gate read — an earlier cut of this work put a URL in `source`
   *  and tripped "no bundled paper claims an official origin without a licence on
   *  file", which is exactly the check that exists to catch it. Two different
   *  questions (whose QUESTIONS are these vs. whose STRUCTURE is this) get two
   *  fields. */
  shapeSource?: string;
  /** See PaperBasis. Absent means the paper makes no claim about item counts. */
  itemCounts?: "published" | "paced";
  /** ONE LINE OF CAVEAT, where the shape needs it — DATA, not translation, like
   *  `sections[].name`: it states something about another country's examination
   *  and is part of the citation, so it is written in the language it was read
   *  in and shown as written. Used for the cases a single `shapeSource` cannot
   *  an awarding body that publishes its papers and hours but not its item
   *  counts, or an exam that does not have a maths-only sitting at all. */
  shapeNote?: string;
  /** Specification ids this paper belongs to (validated against the real
   *  specification layer — a paper cannot name a qualification that does not
   *  exist). */
  specs: string[];
  /** The awarding body whose paper this is, when it is one board's paper rather
   *  than a qualification's. AQA and Edexcel both publish a "GCSE Mathematics —
   *  Paper 1 (non-calculator)"; without this field the picker listed that name
   *  twice and a learner had no way to know which was theirs. */
  board?: BoardId;
  /** The tiers/levels of the qualification that actually SIT this paper.
   *  Absent means every level of the specification.
   *
   *  This exists because a paper is not one paper across a board's tiers. A
   *  Cambridge IGCSE Core candidate sits Papers 1 and 3 (80 marks, 1h30) and an
   *  Extended candidate Papers 2 and 4 (100 marks, 2h): offering the Extended
   *  paper to a Core candidate is the wrong paper, not an easier or harder
   *  version of the right one, and it was what the catalogue did. The same is
   *  true of IB SL (80 marks) against HL (110), CBSE Class 10 against Class 12,
   *  and an A-level paper against AS.
   *
   *  A level a paper does not name is NOT left without a paper: the modelled
   *  practice sets are drawn at that level's own band, so the learner is offered
   *  a labelled practice set instead of somebody else's examination. */
  levels?: string[];
}

/** Section totals must add up to the declared paper total, or the paper lies
 *  about its own length. Checked here at module load, loudly.
 *
 *  `boundaries` may be OMITTED, and that is a statement rather than an
 *  oversight: a board that sets its cut scores per session and publishes them
 *  afterwards has no table this catalogue can print, and a fixed A/B/C table
 *  would be OpenMind's number wearing the board's name. The result screen shows
 *  the mark and no grade for such a paper (Guatemala's Graduandos was the first;
 *  most of the second wave are the same). */
function paper(
  t: Omit<PaperTemplate, "marks" | "boundaries"> & { marks?: number; boundaries?: GradeBoundary[] },
): PaperTemplate {
  const total = t.sections.reduce((s, x) => s + x.count * x.marksEach, 0);
  if (t.marks !== undefined && t.marks !== total) {
    throw new Error(`paper ${t.id}: declared ${t.marks} marks but sections total ${total}`);
  }
  return { ...t, boundaries: t.boundaries ?? [], basis: t.basis ?? "published", marks: total };
}

const GCSE_BOUNDARIES: GradeBoundary[] = [
  { grade: "9", pct: 0.80 }, { grade: "8", pct: 0.70 }, { grade: "7", pct: 0.62 },
  { grade: "6", pct: 0.53 }, { grade: "5", pct: 0.44 }, { grade: "4", pct: 0.34 },
];
const ALEVEL_BOUNDARIES: GradeBoundary[] = [
  { grade: "A*", pct: 0.80 }, { grade: "A", pct: 0.70 }, { grade: "B", pct: 0.60 }, { grade: "C", pct: 0.50 },
];
const SAT_BOUNDARIES: GradeBoundary[] = [
  { grade: "800", pct: 0.96 }, { grade: "700", pct: 0.85 }, { grade: "600", pct: 0.72 }, { grade: "500", pct: 0.58 },
];
const KCSE_BOUNDARIES: GradeBoundary[] = [
  { grade: "A", pct: 0.8 }, { grade: "B", pct: 0.65 }, { grade: "C", pct: 0.5 }, { grade: "D", pct: 0.35 },
];
const NSC_BOUNDARIES: GradeBoundary[] = [
  { grade: "7", pct: 0.8 }, { grade: "6", pct: 0.7 }, { grade: "5", pct: 0.6 }, { grade: "4", pct: 0.5 }, { grade: "3", pct: 0.4 },
];

/** The bands a specification-BUILT paper is estimated against. An awarding
 *  body's own table is data (above); a built paper has no published one, so it
 *  is measured against the tier's own difficulty — and the grade it reports is
 *  labelled an estimate wherever it is shown. */
function builtBoundaries(d: number): GradeBoundary[] {
  return [
    { grade: "A", pct: d + 0.15 },
    { grade: "B", pct: d + 0.02 },
    { grade: "C", pct: Math.max(0.3, d - 0.12) },
    { grade: "Pass", pct: Math.max(0.2, d - 0.28) },
  ];
}

export const PAPERS: PaperTemplate[] = [
  paper({
    id: "aqa-gcse-maths-p1", name: "GCSE Mathematics — Paper 1 (non-calculator)",
    board: "aqa", subject: "maths", minutes: 90, calculator: false, specs: ["uk-gcse"], boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 2, difficulty: 0.4 },
      { name: "Section B", count: 12, marksEach: 4, difficulty: 0.55 },
      { name: "Section C", count: 2, marksEach: 6, difficulty: 0.72 },
    ],
  }),
  paper({
    id: "edexcel-gcse-maths-p1", name: "GCSE Mathematics — Paper 1 (non-calculator)",
    board: "edexcel", subject: "maths", minutes: 90, calculator: false, specs: ["uk-gcse"], boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 12, marksEach: 2, difficulty: 0.4 },
      { name: "Section B", count: 11, marksEach: 4, difficulty: 0.55 },
      { name: "Section C", count: 2, marksEach: 6, difficulty: 0.72 },
    ],
  }),
  // ── AQA A-LEVEL MATHEMATICS — THE THREE A-LEVEL PAPERS ────────────────────
  // `levels: ["a2"]`, because these are the A-LEVEL papers (100 marks, 2h each)
  // and AS is a different sitting: a two-paper qualification at 80 marks a paper.
  // Without the gate an AS candidate was offered three A-level papers, which is
  // the same class of error as offering an Extended paper to a Core candidate.
  // An AS candidate is now handed the modelled sets drawn at the AS band, which
  // say they are practice sets rather than somebody else's examination.
  paper({
    id: "aqa-alevel-maths-p1", name: "A-Level Mathematics — Paper 1 (Pure)",
    board: "aqa", subject: "maths", minutes: 120, calculator: true, specs: ["uk-alevel"], levels: ["a2"],
    boundaries: ALEVEL_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 4, difficulty: 0.78 },
      { name: "Section B", count: 6, marksEach: 10, difficulty: 0.9 },
    ],
  }),
  // ── CAMBRIDGE IGCSE MATHEMATICS (0580) — FOUR PAPERS, TWO TIERS ────────────
  // The board sets TWO papers at ONE tier: Paper 1 (Core, 1h30, 80 marks, no
  // calculator) and Paper 3 (Core, 1h30, 80 marks, calculator) for the Core
  // candidate; Paper 2 (Extended, 2h, 100 marks, no calculator) and Paper 4
  // (Extended, 2h, 100 marks, calculator) for the Extended candidate. Grade
  // eligibility differs with the tier as well — Core is C–G, Extended A*–E — so
  // the boundary table is per tier rather than one table for "IGCSE maths".
  //
  // The catalogue held ONE blueprint here, and it was Extended at 70 marks, so a
  // Core candidate was shown a paper from the tier above theirs whose mark total
  // matched no Cambridge document at all. A paper a candidate cannot sit is not a
  // harder practice paper; it is the wrong paper.
  //
  // The MARKS, TIMES, TIER and CALCULATOR RULE are Cambridge's. The per-section
  // item counts are OpenMind's pacing to those marks (`itemCounts: "paced"`) —
  // the board publishes how long a paper is and what it is worth, not how many
  // parts it is split into, so no item count is claimed on its behalf.
  paper({
    id: "cambridge-igcse-maths-core-p1", name: "Cambridge IGCSE Mathematics — Paper 1 (Core)",
    subject: "maths", minutes: 90, calculator: false, specs: ["int-igcse"], levels: ["core"],
    itemCounts: "paced",
    shapeSource: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-mathematics-0580/",
    boundaries: [{ grade: "C", pct: 0.70 }, { grade: "D", pct: 0.55 }, { grade: "E", pct: 0.45 }, { grade: "F", pct: 0.34 }, { grade: "G", pct: 0.24 }],
    sections: [
      { name: "Section A", count: 10, marksEach: 2, difficulty: 0.3 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.42 },
      { name: "Section C", count: 2, marksEach: 10, difficulty: 0.52 },
    ],
  }),
  paper({
    id: "cambridge-igcse-maths-core-p3", name: "Cambridge IGCSE Mathematics — Paper 3 (Core)",
    subject: "maths", minutes: 90, calculator: true, specs: ["int-igcse"], levels: ["core"],
    itemCounts: "paced",
    shapeSource: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-mathematics-0580/",
    boundaries: [{ grade: "C", pct: 0.70 }, { grade: "D", pct: 0.55 }, { grade: "E", pct: 0.45 }, { grade: "F", pct: 0.34 }, { grade: "G", pct: 0.24 }],
    sections: [
      { name: "Section A", count: 10, marksEach: 2, difficulty: 0.32 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.44 },
      { name: "Section C", count: 2, marksEach: 10, difficulty: 0.54 },
    ],
  }),
  paper({
    id: "cambridge-igcse-maths-extended-p2", name: "Cambridge IGCSE Mathematics — Paper 2 (Extended)",
    subject: "maths", minutes: 120, calculator: false, specs: ["int-igcse"], levels: ["extended"],
    itemCounts: "paced",
    shapeSource: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-mathematics-0580/",
    boundaries: [{ grade: "A*", pct: 0.85 }, { grade: "A", pct: 0.72 }, { grade: "B", pct: 0.60 }, { grade: "C", pct: 0.48 }, { grade: "D", pct: 0.38 }, { grade: "E", pct: 0.30 }],
    sections: [
      { name: "Section A", count: 10, marksEach: 3, difficulty: 0.55 },
      { name: "Section B", count: 8, marksEach: 5, difficulty: 0.68 },
      { name: "Section C", count: 3, marksEach: 10, difficulty: 0.8 },
    ],
  }),
  paper({
    id: "cambridge-igcse-maths-extended-p4", name: "Cambridge IGCSE Mathematics — Paper 4 (Extended)",
    subject: "maths", minutes: 120, calculator: true, specs: ["int-igcse"], levels: ["extended"],
    itemCounts: "paced",
    shapeSource: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-mathematics-0580/",
    boundaries: [{ grade: "A*", pct: 0.85 }, { grade: "A", pct: 0.72 }, { grade: "B", pct: 0.60 }, { grade: "C", pct: 0.48 }, { grade: "D", pct: 0.38 }, { grade: "E", pct: 0.30 }],
    sections: [
      { name: "Section A", count: 10, marksEach: 3, difficulty: 0.58 },
      { name: "Section B", count: 8, marksEach: 5, difficulty: 0.7 },
      { name: "Section C", count: 3, marksEach: 10, difficulty: 0.82 },
    ],
  }),
  // ── IB DIPLOMA MATHEMATICS: ANALYSIS AND APPROACHES — THE WHOLE SET ─────────
  // SL sits TWO papers (1h30, 80 marks each: Paper 1 without a calculator, Paper
  // 2 with one); HL sits THREE (Papers 1 and 2 at 2h and 110 marks, Paper 3 at
  // 1h15 and 55 marks, both allowed a calculator). The catalogue held SL Paper 1
  // alone, and at 90 marks — a total the IB does not set for it — so an SL
  // candidate's library had no Paper 2 and an HL candidate's had no paper of
  // their own at all.
  //
  // The IB also publishes the change taking effect with first assessment in 2029
  // (SL 75 marks a paper, HL 100/100/50, HL Paper 3 shortened to 1h). Those are
  // NOT used here: a candidate sitting the current course is assessed on the
  // current totals, and a mock has to be the paper they are actually sitting.
  //
  // Marks, times and calculator rules are the IB's; the item counts are
  // OpenMind's pacing to those marks.
  paper({
    id: "ib-maths-sl-p1", name: "IB Mathematics AA — Paper 1 (SL, no calculator)",
    subject: "maths", minutes: 90, calculator: false, specs: ["int-ib"], levels: ["sl"],
    itemCounts: "paced",
    shapeSource: "https://ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-analysis-and-approaches-en.pdf",
    boundaries: [{ grade: "7", pct: 0.82 }, { grade: "6", pct: 0.70 }, { grade: "5", pct: 0.58 }, { grade: "4", pct: 0.46 }],
    sections: [
      { name: "Section A", count: 8, marksEach: 5, difficulty: 0.66 },
      { name: "Section B", count: 4, marksEach: 10, difficulty: 0.8 },
    ],
  }),
  paper({
    id: "ib-maths-sl-p2", name: "IB Mathematics AA — Paper 2 (SL, calculator)",
    subject: "maths", minutes: 90, calculator: true, specs: ["int-ib"], levels: ["sl"],
    itemCounts: "paced",
    shapeSource: "https://ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-analysis-and-approaches-en.pdf",
    boundaries: [{ grade: "7", pct: 0.82 }, { grade: "6", pct: 0.70 }, { grade: "5", pct: 0.58 }, { grade: "4", pct: 0.46 }],
    sections: [
      { name: "Section A", count: 8, marksEach: 5, difficulty: 0.68 },
      { name: "Section B", count: 4, marksEach: 10, difficulty: 0.82 },
    ],
  }),
  paper({
    id: "ib-maths-hl-p1", name: "IB Mathematics AA — Paper 1 (HL, no calculator)",
    subject: "maths", minutes: 120, calculator: false, specs: ["int-ib"], levels: ["hl"],
    itemCounts: "paced",
    shapeSource: "https://ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-analysis-and-approaches-en.pdf",
    boundaries: [{ grade: "7", pct: 0.80 }, { grade: "6", pct: 0.68 }, { grade: "5", pct: 0.56 }, { grade: "4", pct: 0.44 }],
    sections: [
      { name: "Section A", count: 10, marksEach: 5, difficulty: 0.78 },
      { name: "Section B", count: 5, marksEach: 12, difficulty: 0.9 },
    ],
  }),
  paper({
    id: "ib-maths-hl-p2", name: "IB Mathematics AA — Paper 2 (HL, calculator)",
    subject: "maths", minutes: 120, calculator: true, specs: ["int-ib"], levels: ["hl"],
    itemCounts: "paced",
    shapeSource: "https://ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-analysis-and-approaches-en.pdf",
    boundaries: [{ grade: "7", pct: 0.80 }, { grade: "6", pct: 0.68 }, { grade: "5", pct: 0.56 }, { grade: "4", pct: 0.44 }],
    sections: [
      { name: "Section A", count: 10, marksEach: 5, difficulty: 0.8 },
      { name: "Section B", count: 5, marksEach: 12, difficulty: 0.91 },
    ],
  }),
  // HL Paper 3 is the investigation paper: two or three long questions, 55 marks
  // in 1h15, so it is shaped as the two long questions and a shorter one rather
  // than as bands of equal marks like Papers 1 and 2.
  paper({
    id: "ib-maths-hl-p3", name: "IB Mathematics AA — Paper 3 (HL, calculator)",
    subject: "maths", minutes: 75, calculator: true, specs: ["int-ib"], levels: ["hl"],
    itemCounts: "paced",
    shapeSource: "https://ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-analysis-and-approaches-en.pdf",
    boundaries: [{ grade: "7", pct: 0.78 }, { grade: "6", pct: 0.66 }, { grade: "5", pct: 0.54 }, { grade: "4", pct: 0.42 }],
    sections: [
      { name: "Section A", count: 2, marksEach: 20, difficulty: 0.9 },
      { name: "Section B", count: 1, marksEach: 15, difficulty: 0.95 },
    ],
  }),
  paper({
    id: "cbse-class10-maths-standard", name: "CBSE Class 10 Mathematics (Standard)",
    subject: "maths", minutes: 180, calculator: false, specs: ["in-cbse"], levels: ["class10"],
    // THE COUNTS ARE CBSE'S OWN, section by section, and they land exactly on the
    // paper's published 80 marks: Section A 20 one-mark items (18 multiple choice
    // and 2 assertion-reason), B 5 two-mark, C 6 three-mark, D 4 five-mark, E 3
    // case-study — 38 questions in 180 minutes.
    itemCounts: "published",
    shapeSource: "https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf",
    boundaries: [{ grade: "A1", pct: 0.9 }, { grade: "A2", pct: 0.8 }, { grade: "B1", pct: 0.7 }, { grade: "B2", pct: 0.6 }, { grade: "Pass", pct: 0.33 }],
    sections: [
      { name: "Section A", count: 20, marksEach: 1, difficulty: 0.35 },
      { name: "Section B", count: 5, marksEach: 2, difficulty: 0.45 },
      { name: "Section C", count: 6, marksEach: 3, difficulty: 0.55 },
      { name: "Section D", count: 4, marksEach: 5, difficulty: 0.65 },
      { name: "Section E", count: 3, marksEach: 4, difficulty: 0.7 },
    ],
  }),
  // ── CBSE CLASS 12 MATHEMATICS (041) ────────────────────────────────────────
  // The other half of the same board's sequence, and it had no blueprint at all:
  // a Class 11–12 candidate's own mathematics paper — and its Class 10 sibling
  // above, which they had outgrown — were both offered to them. CBSE publishes
  // the construction of both: five sections A–E, 38 questions, 80 marks, three
  // hours, no calculator. Section A is 18 multiple choice and 2 assertion-reason
  // items; Section E is case-study questions.
  paper({
    id: "cbse-class12-maths", name: "CBSE Class 12 Mathematics (041)",
    subject: "maths", minutes: 180, calculator: false, specs: ["in-cbse"], levels: ["class11-12"],
    itemCounts: "published",
    shapeSource: "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2025_26/Maths-SQP.pdf",
    boundaries: [{ grade: "A1", pct: 0.9 }, { grade: "A2", pct: 0.8 }, { grade: "B1", pct: 0.7 }, { grade: "B2", pct: 0.6 }, { grade: "Pass", pct: 0.33 }],
    sections: [
      { name: "Section A", count: 20, marksEach: 1, difficulty: 0.5 },
      { name: "Section B", count: 5, marksEach: 2, difficulty: 0.62 },
      { name: "Section C", count: 6, marksEach: 3, difficulty: 0.72 },
      { name: "Section D", count: 4, marksEach: 5, difficulty: 0.82 },
      { name: "Section E", count: 3, marksEach: 4, difficulty: 0.78 },
    ],
  }),
  paper({
    id: "cbse-class12-physics", name: "CBSE Class 12 Physics",
    subject: "physics", minutes: 180, calculator: false, specs: ["in-cbse"], levels: ["class11-12"],
    // CBSE's own construction, read from the 2025–26 sample paper: 33 compulsory
    // questions in five sections (16 × 1, 5 × 2, 7 × 3, 2 × 4, 3 × 5) for 70
    // marks in three hours, no calculator. It was 62 marks over four sections and
    // said `calculator: true`, which is not this board's paper.
    itemCounts: "published",
    shapeSource: "https://cbseacademic.nic.in/web_material/SQP/ClassXII_2025_26/Physics-SQP.pdf",
    boundaries: [{ grade: "A1", pct: 0.9 }, { grade: "A2", pct: 0.8 }, { grade: "B1", pct: 0.7 }, { grade: "B2", pct: 0.6 }, { grade: "Pass", pct: 0.33 }],
    sections: [
      { name: "Section A", count: 16, marksEach: 1, difficulty: 0.5 },
      { name: "Section B", count: 5, marksEach: 2, difficulty: 0.62 },
      { name: "Section C", count: 7, marksEach: 3, difficulty: 0.72 },
      { name: "Section D", count: 2, marksEach: 4, difficulty: 0.8 },
      { name: "Section E", count: 3, marksEach: 5, difficulty: 0.85 },
    ],
  }),
  paper({
    id: "digital-sat-math", name: "Digital SAT — Math module",
    subject: "maths", minutes: 35, calculator: true, specs: ["us-sat"],
    boundaries: SAT_BOUNDARIES,
    sections: [{ name: "Module", count: 22, marksEach: 1, difficulty: 0.62 }],
  }),
  paper({
    id: "digital-sat-math-2", name: "Digital SAT — Math module 2 (harder)",
    subject: "maths", minutes: 35, calculator: true, specs: ["us-sat"], boundaries: SAT_BOUNDARIES,
    sections: [{ name: "Module", count: 22, marksEach: 1, difficulty: 0.7 }],
  }),
  // ── GUATEMALA · Evaluaci\u00f3n Graduandos ──────────────────────────────────
  // The graduation assessment is TWO computer-based tests — Lectura and
  // Matem\u00e1tica — of multiple-choice items, not a suite of subject papers. This is
  // the Matem\u00e1tica one, in the form the ministry administers it: one run of
  // single-mark multiple-choice items on a clock, no written section.
  //
  // THE COUNTS ARE DIGEDUCA'S OWN, from the guides it published for the 2024
  // sitting (Matemática 45 items in 90 minutes; Lectura 45-50 in 60) — not from
  // a complete past form, because DIGEDUCA publishes study guides and example
  // items rather than historic papers. So the SHAPE is the ministry's and the
  // questions are OpenMind's, which is what `basis: "published"` says.
  //
  // NO GRADE BOUNDARIES ON PURPOSE. DIGEDUCA reports achievement in the two
  // areas; it does not publish cut scores for grades, and inventing an A/B/C
  // table would be a claim about another country's examination that nothing
  // supports. The result screen shows the mark and no grade rather than a
  // fabricated one (markPaper returns null, and the boundaries block is not
  // rendered when there is nothing to render).
  paper({
    id: "gt-graduandos-matematica", name: "Evaluación Graduandos — Matemática",
    board: "guatemalan", subject: "maths", minutes: 90, calculator: false,
    specs: ["gt-diversificado"], boundaries: [],
    itemCounts: "published",
    shapeSource: "https://edu.mineduc.gob.gt/DIGEDUCA/documents/2024/Contenido-Matematica-GRAD-2024.pdf",
    shapeNote: "DIGEDUCA administers Graduandos as two computer-based tests, Lectura and Matemática; this is the Matemática one (45 multiple-choice items, 90 minutes). It reports achievement in four levels rather than grades, so no grade is shown here.",
    sections: [{ name: "Multiple choice", count: 45, marksEach: 1, difficulty: 0.56 }],
  }),
  // ── VIETNAM · tot nghiep THPT ────────────────────────────────────────────
  // ONE mathematics test, 90 minutes, and the ministry publishes its own item
  // structure: 12 four-option multiple-choice questions, four true/false groups
  // of four statements each, and six short-answer questions written on the answer
  // sheet. The ministry counts 22 question GROUPS and 34 prompts, because each
  // true/false group carries four statements; this paper is 34 items for the same
  // reason. It also states that the construction of a given sitting may be
  // adjusted, so the counts are cited rather than asserted as fixed.
  paper({
    id: "vn-thpt-mathematics", name: "Tốt nghiệp THPT — Mathematics",
    subject: "maths", minutes: 90, calculator: false, specs: ["vn-thpt"], boundaries: [],
    itemCounts: "published",
    shapeSource: "https://vqa.moet.gov.vn/vi/news/thong-bao/cau-truc-dinh-dang-de-thi-tot-nghiep-thpt-tu-nam-2025-74.html",
    shapeNote: "Vietnam's Ministry of Education and Training publishes this structure — 12 multiple choice, 4 true/false groups of 4 statements, 6 short answer, 34 prompts in 90 minutes — and states that a given sitting's construction may be adjusted.",
    sections: [
      { name: "Part I · multiple choice", count: 12, marksEach: 2, difficulty: 0.5 },
      { name: "Part II · true/false groups", count: 16, marksEach: 1, difficulty: 0.66 },
      { name: "Part III · short answer", count: 6, marksEach: 3, difficulty: 0.76 },
    ],
  }),
  // ── TANZANIA · CSEE ─────────────────────────────────────────────────────
  // ONE paper of three hours, not two: NECTA sets Basic Mathematics as a single
  // sitting in two sections, and its own performance analysis describes 14
  // questions — 10 in Section A and 4 in Section B. The CSEE timetable places it
  // at 8:00-11:00. Section B questions carry more of the paper's marks, which is
  // why the two sections are weighted differently here.
  paper({
    id: "csee-basic-mathematics", name: "CSEE Basic Mathematics",
    subject: "maths", minutes: 180, calculator: true, specs: ["tz-csee"], boundaries: [],
    itemCounts: "published",
    shapeSource: "https://www.necta.go.tz/pages/csee",
    shapeNote: "NECTA sets one three-hour Basic Mathematics paper in two sections (10 questions in Section A, 4 in Section B).",
    sections: [
      { name: "Section A", count: 10, marksEach: 5, difficulty: 0.5 },
      { name: "Section B", count: 4, marksEach: 10, difficulty: 0.72 },
    ],
  }),
  // ── NIGERIA · SSCE ─────────────────────────────────────────────────────
  // TWO components, which both Nigerian examining bodies set: an objective paper
  // and a written one. The TIMES are NECO's, read from its own published
  // timetable — objective 1 hour 45, essay 2 hours 30 — because that is the
  // document that could be read in full; WAEC's own timetable gives the same two
  // components at 1 hour 30 and 2 hours 30. Neither body's document states item
  // counts, so `itemCounts: "paced"` and the question counts below are OpenMind's
  // pace to the stated time, not a claim about the Nigerian paper.
  paper({
    id: "ssce-mathematics-objective", name: "SSCE Mathematics — Paper 1 (objective)",
    subject: "maths", minutes: 105, calculator: false, specs: ["ng-waec"], boundaries: [],
    itemCounts: "paced",
    shapeSource: "https://neco.gov.ng/2025%20SSCE%20INTERNAL%20TIMETABLE.pdf",
    shapeNote: "Nigerian SSCE mathematics is two papers: an objective paper and a written one. The times here are NECO's own (1 hour 45 and 2 hours 30); WAEC sets the same two components at 1 hour 30 and 2 hours 30. Neither publishes an item count, so the number of questions is OpenMind's pace to the stated time.",
    sections: [{ name: "Objective", count: 40, marksEach: 1, difficulty: 0.45 }],
  }),
  paper({
    id: "ssce-mathematics-essay", name: "SSCE Mathematics — Paper 2 (essay)",
    subject: "maths", minutes: 150, calculator: true, specs: ["ng-waec"], boundaries: [],
    itemCounts: "paced",
    shapeSource: "https://neco.gov.ng/2025%20SSCE%20INTERNAL%20TIMETABLE.pdf",
    sections: [
      { name: "Section A · answer all", count: 8, marksEach: 5, difficulty: 0.5 },
      { name: "Section B · longer answers", count: 6, marksEach: 10, difficulty: 0.72 },
    ],
  }),
  // ── UGANDA · UCE ────────────────────────────────────────────────────────
  // TWO papers, Mathematics 456/1 and 456/2, each two and a half hours in UNEB's
  // own transitional timetable — and no objective component appears in it, so
  // both are written papers here. UNEB's published paper format was not readable,
  // so the item counts are paced, not claimed.
  paper({
    id: "uce-mathematics-1", name: "UCE Mathematics — Paper 1 (456/1)",
    subject: "maths", minutes: 150, calculator: true, specs: ["ug-uce"], boundaries: [],
    itemCounts: "paced",
    shapeSource: "https://ereg.uneb.ac.ug/files/uce_transitional_timetable_2024.pdf",
    shapeNote: "UNEB sets two UCE Mathematics papers (456/1 and 456/2), each two and a half hours, with no objective component. The number of questions here is OpenMind's pace to that time.",
    sections: [
      { name: "Section A · short questions", count: 12, marksEach: 4, difficulty: 0.48 },
      { name: "Section B · longer questions", count: 5, marksEach: 10, difficulty: 0.7 },
    ],
  }),
  paper({
    id: "uce-mathematics-2", name: "UCE Mathematics — Paper 2 (456/2)",
    subject: "maths", minutes: 150, calculator: true, specs: ["ug-uce"], boundaries: [],
    itemCounts: "paced",
    shapeSource: "https://ereg.uneb.ac.ug/files/uce_transitional_timetable_2024.pdf",
    sections: [
      { name: "Section A · short questions", count: 12, marksEach: 4, difficulty: 0.55 },
      { name: "Section B · longer questions", count: 5, marksEach: 10, difficulty: 0.78 },
    ],
  }),
  // ── BRAZIL · ENEM ───────────────────────────────────────────────────────
  // ENEM HAS NO MATHEMATICS PAPER. It is one exam in two days of areas, and the
  // second day carries 90 objective questions in 300 minutes — 45 of them
  // "Matemática e suas Tecnologias" and 45 natural sciences. So the ITEM COUNT is
  // the ministry's (45, published in its own booklet) while the TIME here is that
  // count's share of the day (150 of 300 minutes for 45 of 90 items), because
  // there is no maths-only sitting to copy a time from and dividing the day is
  // the only honest way to give a learner a clock. Both facts are stated on the
  // paper rather than left in this comment.
  paper({
    id: "enem-matematica", name: "ENEM — Matemática e suas Tecnologias",
    subject: "maths", minutes: 150, calculator: false, specs: ["br-enem"], boundaries: [],
    itemCounts: "published",
    shapeSource: "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_PV_impresso_D2_CD5.pdf",
    shapeNote: "ENEM is one exam in two days; the second day has 90 objective questions in 300 minutes, 45 of them mathematics. This is the mathematics half, so the item count is INEP's and the time is that half of the day.",
    sections: [{ name: "Objective", count: 45, marksEach: 1, difficulty: 0.62 }],
  }),
  paper({
    id: "kcse-maths-p1", name: "KCSE Mathematics — Paper 1",
    subject: "maths", minutes: 150, calculator: false, specs: ["ke-kcse"],
    boundaries: KCSE_BOUNDARIES,
    // KNEC's own regulations state the two papers and their times; its PDF could
    // not be read in full, so the item counts are NOT claimed and the citation is
    // named as the structure's source rather than as proof of its counts.
    shapeSource: "https://knec.ac.ke/wp-content/uploads/2026/01/KCSE_Regulations_2024.pdf",
    sections: [
      { name: "Section I", count: 16, marksEach: 2, difficulty: 0.45 },
      { name: "Section II", count: 5, marksEach: 10, difficulty: 0.7 },
    ],
  }),
  paper({
    id: "kcse-maths-p2", name: "KCSE Mathematics — Paper 2",
    subject: "maths", minutes: 150, calculator: false, specs: ["ke-kcse"], boundaries: KCSE_BOUNDARIES,
    sections: [
      { name: "Section I", count: 16, marksEach: 2, difficulty: 0.5 },
      { name: "Section II", count: 5, marksEach: 10, difficulty: 0.78 },
    ],
  }),
  paper({
    id: "caps-maths-p1", name: "NSC Mathematics — Paper 1 (CAPS)",
    subject: "maths", minutes: 180, calculator: true, specs: ["za-nsc"],
    boundaries: NSC_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 5, difficulty: 0.5 },
      { name: "Section B", count: 5, marksEach: 20, difficulty: 0.72 },
    ],
  }),
  paper({
    id: "caps-maths-p2", name: "NSC Mathematics — Paper 2 (CAPS)",
    subject: "maths", minutes: 180, calculator: true, specs: ["za-nsc"], boundaries: NSC_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 5, difficulty: 0.55 },
      { name: "Section B", count: 5, marksEach: 20, difficulty: 0.78 },
    ],
  }),
  paper({
    // AQA'S separate sciences are TWO papers of 1h45 and 100 marks each, with a
    // scientific calculator required. Paper 1 was 60 marks in 75 minutes — the
    // shape of a Trilogy paper, not the separate science a candidate "GCSE
    // Physics" actually sits — while Paper 2 below was already the right size.
    // Both are now the published paper, and both cite where that was read.
    id: "aqa-gcse-physics", name: "GCSE Physics — Paper 1",
    board: "aqa", subject: "physics", minutes: 105, calculator: true, specs: ["uk-gcse"],
    itemCounts: "paced",
    shapeSource: "https://www.aqa.org.uk/subjects/physics/gcse/physics-8463/specification/specification-at-a-glance",
    boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 20, marksEach: 2, difficulty: 0.42 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.58 },
      { name: "Section C", count: 4, marksEach: 5, difficulty: 0.7 },
    ],
  }),
  paper({
    id: "aqa-gcse-chemistry", name: "GCSE Chemistry — Paper 1",
    board: "aqa", subject: "chemistry", minutes: 105, calculator: true, specs: ["uk-gcse"],
    itemCounts: "paced",
    shapeSource: "https://www.aqa.org.uk/subjects/chemistry/gcse/chemistry-8462/specification/specification-at-a-glance",
    boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 20, marksEach: 2, difficulty: 0.44 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.6 },
      { name: "Section C", count: 4, marksEach: 5, difficulty: 0.72 },
    ],
  }),
  paper({
    id: "aqa-gcse-biology", name: "GCSE Biology — Paper 1",
    board: "aqa", subject: "biology", minutes: 105, calculator: true, specs: ["uk-gcse"],
    itemCounts: "paced",
    shapeSource: "https://www.aqa.org.uk/subjects/biology/gcse/biology-8461/specification/specification-at-a-glance",
    boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 20, marksEach: 2, difficulty: 0.42 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.58 },
      { name: "Section C", count: 4, marksEach: 5, difficulty: 0.7 },
    ],
  }),

  // ── THE PAPERS AFTER PAPER 1 ────────────────────────────────────────────────
  // A board's maths GCSE is THREE papers and a separate science is TWO, so a
  // candidate who could only sit Paper 1 was practising a third or a half of
  // their exam — and the two halves are not interchangeable: Paper 1 forbids a
  // calculator and Paper 2 requires one, and Paper 2 is where the multi-step
  // work and the required practicals live. These are the shapes the awarding
  // bodies PUBLISH (marks, time, calculator rule, section weighting, tier);
  // every question in them is still OpenMind's own, written to the
  // specification — see the note at the top of this file.
  paper({
    id: "aqa-gcse-maths-p2", name: "GCSE Mathematics — Paper 2 (calculator)",
    board: "aqa", subject: "maths", minutes: 90, calculator: true, specs: ["uk-gcse"], boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 2, difficulty: 0.42 },
      { name: "Section B", count: 12, marksEach: 4, difficulty: 0.58 },
      { name: "Section C", count: 2, marksEach: 6, difficulty: 0.74 },
    ],
  }),
  paper({
    id: "aqa-gcse-maths-p3", name: "GCSE Mathematics — Paper 3 (calculator)",
    board: "aqa", subject: "maths", minutes: 90, calculator: true, specs: ["uk-gcse"], boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 12, marksEach: 2, difficulty: 0.45 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.6 },
      { name: "Section C", count: 2, marksEach: 8, difficulty: 0.76 },
    ],
  }),
  paper({
    id: "edexcel-gcse-maths-p2", name: "GCSE Mathematics — Paper 2 (calculator)",
    board: "edexcel", subject: "maths", minutes: 90, calculator: true, specs: ["uk-gcse"], boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 12, marksEach: 2, difficulty: 0.42 },
      { name: "Section B", count: 11, marksEach: 4, difficulty: 0.58 },
      { name: "Section C", count: 2, marksEach: 6, difficulty: 0.74 },
    ],
  }),
  paper({
    id: "edexcel-gcse-maths-p3", name: "GCSE Mathematics — Paper 3 (calculator)",
    board: "edexcel", subject: "maths", minutes: 90, calculator: true, specs: ["uk-gcse"], boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 12, marksEach: 2, difficulty: 0.46 },
      { name: "Section B", count: 12, marksEach: 4, difficulty: 0.62 },
      { name: "Section C", count: 1, marksEach: 8, difficulty: 0.78 },
    ],
  }),
  paper({
    id: "aqa-gcse-physics-p2", name: "GCSE Physics — Paper 2",
    board: "aqa", subject: "physics", minutes: 105, calculator: true, specs: ["uk-gcse"],
    itemCounts: "paced",
    shapeSource: "https://www.aqa.org.uk/subjects/physics/gcse/physics-8463/specification/specification-at-a-glance", boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 20, marksEach: 2, difficulty: 0.5 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.65 },
      { name: "Section C", count: 4, marksEach: 5, difficulty: 0.78 },
    ],
  }),
  paper({
    id: "aqa-gcse-chemistry-p2", name: "GCSE Chemistry — Paper 2",
    board: "aqa", subject: "chemistry", minutes: 105, calculator: true, specs: ["uk-gcse"],
    itemCounts: "paced",
    shapeSource: "https://www.aqa.org.uk/subjects/chemistry/gcse/chemistry-8462/specification/specification-at-a-glance", boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 20, marksEach: 2, difficulty: 0.48 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.63 },
      { name: "Section C", count: 4, marksEach: 5, difficulty: 0.76 },
    ],
  }),
  paper({
    id: "aqa-gcse-biology-p2", name: "GCSE Biology — Paper 2",
    board: "aqa", subject: "biology", minutes: 105, calculator: true, specs: ["uk-gcse"],
    itemCounts: "paced",
    shapeSource: "https://www.aqa.org.uk/subjects/biology/gcse/biology-8461/specification/specification-at-a-glance", boundaries: GCSE_BOUNDARIES,
    sections: [
      { name: "Section A", count: 20, marksEach: 2, difficulty: 0.45 },
      { name: "Section B", count: 10, marksEach: 4, difficulty: 0.62 },
      { name: "Section C", count: 4, marksEach: 5, difficulty: 0.74 },
    ],
  }),
  paper({
    id: "aqa-alevel-maths-p2", name: "A-Level Mathematics — Paper 2",
    board: "aqa", subject: "maths", minutes: 120, calculator: true, specs: ["uk-alevel"], levels: ["a2"], boundaries: ALEVEL_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 4, difficulty: 0.8 },
      { name: "Section B", count: 5, marksEach: 12, difficulty: 0.9 },
    ],
  }),
  paper({
    id: "aqa-alevel-maths-p3", name: "A-Level Mathematics — Paper 3",
    board: "aqa", subject: "maths", minutes: 120, calculator: true, specs: ["uk-alevel"], levels: ["a2"], boundaries: ALEVEL_BOUNDARIES,
    sections: [
      { name: "Section A", count: 8, marksEach: 5, difficulty: 0.82 },
      { name: "Section B", count: 4, marksEach: 15, difficulty: 0.92 },
    ],
  }),
  // ── PEARSON EDEXCEL A-LEVEL MATHEMATICS (9MA0) ────────────────────────────
  // The other board's A-level, and it has a DIFFERENT shape from AQA's: three
  // papers of exactly 100 marks and two hours each — Pure Mathematics 1, Pure
  // Mathematics 2, and Statistics and Mechanics — with a calculator allowed on
  // all three. An Edexcel candidate had no paper of their own; they were shown
  // AQA's three and the modelled sets.
  //
  // Papers 1 and 2 are pure and Paper 3 is the applied paper, so the names say
  // which is which rather than leaving a learner to discover it at question 12.
  paper({
    id: "edexcel-alevel-maths-p1", name: "A-Level Mathematics — Paper 1 (Pure Mathematics 1)",
    board: "edexcel", subject: "maths", minutes: 120, calculator: true, specs: ["uk-alevel"], levels: ["a2"],
    itemCounts: "paced",
    shapeSource: "https://qualifications.pearson.com/en/qualifications/edexcel-a-levels/mathematics-2017.html",
    boundaries: ALEVEL_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 6, difficulty: 0.8 },
      { name: "Section B", count: 2, marksEach: 20, difficulty: 0.9 },
    ],
  }),
  paper({
    id: "edexcel-alevel-maths-p2", name: "A-Level Mathematics — Paper 2 (Pure Mathematics 2)",
    board: "edexcel", subject: "maths", minutes: 120, calculator: true, specs: ["uk-alevel"], levels: ["a2"],
    itemCounts: "paced",
    shapeSource: "https://qualifications.pearson.com/en/qualifications/edexcel-a-levels/mathematics-2017.html",
    boundaries: ALEVEL_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 6, difficulty: 0.82 },
      { name: "Section B", count: 2, marksEach: 20, difficulty: 0.92 },
    ],
  }),
  paper({
    id: "edexcel-alevel-maths-p3", name: "A-Level Mathematics — Paper 3 (Statistics and Mechanics)",
    board: "edexcel", subject: "maths", minutes: 120, calculator: true, specs: ["uk-alevel"], levels: ["a2"],
    itemCounts: "paced",
    shapeSource: "https://qualifications.pearson.com/en/qualifications/edexcel-a-levels/mathematics-2017.html",
    boundaries: ALEVEL_BOUNDARIES,
    sections: [
      { name: "Section A", count: 10, marksEach: 6, difficulty: 0.78 },
      { name: "Section B", count: 2, marksEach: 20, difficulty: 0.88 },
    ],
  }),

  // ══════════════════════════════════════════════════════════════════════════
  // THE SECOND WAVE — the curricula that had NO board paper at all.
  //
  // Twelve of these shared one defect: the qualification is a real national
  // examination with a published shape, and the catalogue handed every one of
  // them OpenMind's own twelve practice sets and nothing else. They are added
  // together so the reason they were missing stays visible: it was never that a
  // shape did not exist, only that nobody had read it.
  //
  // WHAT IS CLAIMED AND WHAT IS NOT, the same rule as everywhere above: the
  // PAPER COUNT, the DURATION, the MARK TOTAL and the CALCULATOR RULE come from
  // the awarding body. Where the body publishes how many questions a paper holds
  // (WASSCE's 50 objectives, Malawi's 20, Sri Lanka's 25+5) the item count is its
  // own (`itemCounts: "published"`); where it publishes marks but not a count,
  // the sections are OpenMind's pacing (`itemCounts: "paced"`). The section
  // NAMES are the paper's real structure, because the section is the part a
  // candidate can recognise.
  //
  // NO GRADE TABLE ON ANY OF THEM, deliberately: these boards set grade
  // boundaries per session and publish them afterwards, so a fixed A/B/C table
  // would be a number OpenMind invented and attributed to somebody else. The
  // result screen shows the mark and no grade rather than a fabricated one —
  // exactly the Guatemala precedent above.
  //
  // Cameroon's francophone papers are marked OUT OF 20 and weighted by a
  // coefficient in the candidate's total. Both of those are the paper's own
  // facts, so the mark total is 20 here and the coefficient is named in the
  // paper's name — a learner revising for the Bac does not need a 20-mark
  // exercise turned into a 100-mark fiction.

  // ── GHANA · WASSCE Core Mathematics ────────
  // Two compulsory papers: 50 objective items in 1h30 for 50 marks, and an essay
  // paper of 13 questions of which 10 are answered, 2h30 for 100 marks. A
  // non-programmable calculator is allowed on both.
  paper({
    id: "wassce-core-maths-p1", name: "WASSCE Core Mathematics — Paper 1 (objective)",
    subject: "maths", minutes: 90, calculator: true, specs: ["gh-wassce"], levels: ["shs"],
    itemCounts: "published",
    shapeSource: "https://waecgh.org/home/wassce-school/",
    shapeNote: "WAEC's mathematics syllabus sets Core Mathematics as two papers: Paper 1 (50 objective items, 1½ hours, 50 marks) and Paper 2 (13 essay questions, 10 answered, 2½ hours, 100 marks).",
    sections: [{ name: "Objective", count: 50, marksEach: 1, difficulty: 0.45 }],
  }),
  paper({
    id: "wassce-core-maths-p2", name: "WASSCE Core Mathematics — Paper 2 (essay)",
    subject: "maths", minutes: 150, calculator: true, specs: ["gh-wassce"], levels: ["shs"],
    itemCounts: "paced",
    shapeSource: "https://waecgh.org/home/wassce-school/",
    sections: [
      { name: "Section A", count: 5, marksEach: 8, difficulty: 0.5 },
      { name: "Section B", count: 5, marksEach: 12, difficulty: 0.66 },
    ],
  }),

  // ── CAMEROON · GCE Ordinary and Advanced Level ────────
  // 570: Paper 1 is 50 compulsory multiple-choice items in 1h30 (50 marks) and
  // Paper 2 is 2h30 over structural and essay questions (40 + 60 = 100 marks).
  // 770: THREE papers — Paper 1 (50 items, 1h30, 50 marks, NO calculator), Paper 2
  // Pure Mathematics and Paper 3 Statistics and Probability (2h30 and 100 marks
  // each). The A-level's three papers are why it is one qualification and not
  // two: they are weighted 20/40/40 in the final grade.
  paper({
    id: "gce-o-level-maths-p1", name: "GCE Ordinary Level Mathematics (570) — Paper 1",
    subject: "maths", minutes: 90, calculator: true, specs: ["cm-gce-o"], levels: ["form5"],
    itemCounts: "published",
    shapeSource: "https://camgceb.org/examinations/tve-advanced-level/",
    shapeNote: "Cameroon GCE Board syllabus 570: Paper 1 is 50 compulsory multiple-choice items in 1½ hours (50 marks); Paper 2 is 2½ hours over structural (40 marks) and essay (60 marks) questions.",
    sections: [{ name: "Multiple choice", count: 50, marksEach: 1, difficulty: 0.45 }],
  }),
  paper({
    id: "gce-o-level-maths-p2", name: "GCE Ordinary Level Mathematics (570) — Paper 2",
    subject: "maths", minutes: 150, calculator: true, specs: ["cm-gce-o"], levels: ["form5"],
    itemCounts: "paced",
    shapeSource: "https://camgceb.org/examinations/tve-advanced-level/",
    sections: [
      { name: "Section A · structured", count: 8, marksEach: 5, difficulty: 0.5 },
      { name: "Section B · essay", count: 6, marksEach: 10, difficulty: 0.66 },
    ],
  }),
  paper({
    id: "gce-a-level-maths-p1", name: "GCE Advanced Level Mathematics (770) — Paper 1",
    subject: "maths", minutes: 90, calculator: false, specs: ["cm-gce-a"], levels: ["upper6"],
    itemCounts: "published",
    shapeSource: "https://camgceb.org/examinations/tve-advanced-level/",
    shapeNote: "Cameroon GCE Board syllabus 770 (Pure Mathematics with Statistics): Paper 1 is 50 compulsory multiple-choice items in 1½ hours (50 marks) with no calculator; Papers 2 and 3 are 2½ hours and 100 marks each. The three papers are weighted 20/40/40.",
    sections: [{ name: "Multiple choice", count: 50, marksEach: 1, difficulty: 0.72 }],
  }),
  paper({
    id: "gce-a-level-maths-p2", name: "GCE Advanced Level Mathematics (770) — Paper 2 (Pure)",
    subject: "maths", minutes: 150, calculator: true, specs: ["cm-gce-a"], levels: ["upper6"],
    itemCounts: "paced",
    shapeSource: "https://camgceb.org/examinations/tve-advanced-level/",
    sections: [
      { name: "Section A", count: 6, marksEach: 10, difficulty: 0.8 },
      { name: "Section B", count: 4, marksEach: 10, difficulty: 0.9 },
    ],
  }),
  paper({
    id: "gce-a-level-maths-p3", name: "GCE Advanced Level Mathematics (770) — Paper 3 (Statistics)",
    subject: "maths", minutes: 150, calculator: true, specs: ["cm-gce-a"], levels: ["upper6"],
    itemCounts: "paced",
    shapeSource: "https://camgceb.org/examinations/tve-advanced-level/",
    sections: [
      { name: "Section A", count: 5, marksEach: 10, difficulty: 0.78 },
      { name: "Section B", count: 5, marksEach: 10, difficulty: 0.88 },
    ],
  }),

  // ── CAMEROON · the francophone sequence, marked out of 20 ────────
  // BEPC is ONE paper of 2 hours (coefficient 4); Probatoire and Baccalauréat
  // are ONE paper of 3 and 4 hours, weighted by a coefficient that differs with
  // the series (Bac C 7, Bac D 5, Bac E 6). One mathematics paper is the fact
  // that surprises an anglophone reader, and it is the ministry's: these are
  // single long problem papers, not a paper plus an objective component.
  paper({
    id: "bepc-mathematiques", name: "BEPC — Mathématiques (coefficient 4)",
    subject: "maths", minutes: 120, calculator: true, specs: ["cm-bepc"], levels: ["bepc"],
    itemCounts: "paced",
    shapeSource: "https://www.minesec.gov.cm/",
    shapeNote: "MINESEC's BEPC examination definition sets mathematics as one paper of 2 hours, marked out of 20 and weighted at coefficient 4.",
    boundaries: [],
    sections: [
      { name: "Exercice 1", count: 2, marksEach: 5, difficulty: 0.42 },
      { name: "Exercice 2", count: 2, marksEach: 5, difficulty: 0.58 },
    ],
  }),
  paper({
    id: "probatoire-mathematiques", name: "Probatoire — Mathématiques",
    subject: "maths", minutes: 180, calculator: true, specs: ["cm-probatoire"], levels: ["premiere"],
    itemCounts: "paced",
    shapeSource: "https://www.minesec.gov.cm/",
    shapeNote: "MINESEC sets mathematics at the Probatoire as one paper of 3 hours, marked out of 20 and weighted by series (coefficient 6 in C, 5 in E, 4 in D).",
    boundaries: [],
    sections: [
      { name: "Exercice 1", count: 2, marksEach: 5, difficulty: 0.68 },
      { name: "Exercice 2", count: 2, marksEach: 5, difficulty: 0.78 },
    ],
  }),
  paper({
    id: "bac-mathematiques", name: "Baccalauréat — Mathématiques",
    subject: "maths", minutes: 240, calculator: true, specs: ["cm-bac"], levels: ["terminale"],
    itemCounts: "paced",
    shapeSource: "https://www.minesec.gov.cm/",
    shapeNote: "MINESEC sets mathematics at the Baccalauréat as one paper of 4 hours, marked out of 20 and weighted by series (coefficient 7 in C, 6 in E, 5 in D). Series C and E sit a shared paper.",
    boundaries: [],
    sections: [
      { name: "Exercice 1", count: 2, marksEach: 5, difficulty: 0.72 },
      { name: "Exercice 2", count: 2, marksEach: 5, difficulty: 0.85 },
    ],
  }),

  // ── ZAMBIA · ECZ School Certificate ────────
  // Two papers: Paper 1 of 2 hours without a calculator and Paper 2 of 2h30 with
  // one, 100 marks each. The split is the point — the paper that forbids a
  // calculator is a different paper, not an easier sitting of the other.
  paper({
    id: "ecz-school-cert-maths-p1", name: "School Certificate Mathematics — Paper 1 (no calculator)",
    subject: "maths", minutes: 120, calculator: false, specs: ["zm-school-certificate"], levels: ["grade-12"],
    itemCounts: "paced",
    shapeSource: "https://www.exams-council.org.zm/wp-content/uploads/2025/03/2025-SCHOOL-CERTIFICATE-TIME-TABLE_Final.pdf",
    shapeNote: "ECZ's School Certificate timetable sets Mathematics as two papers: Paper 1 of 2 hours (no calculator) and Paper 2 of 2½ hours (calculator). Each is worth 100 marks.",
    sections: [
      { name: "Section A", count: 10, marksEach: 4, difficulty: 0.45 },
      { name: "Section B", count: 10, marksEach: 6, difficulty: 0.62 },
    ],
  }),
  paper({
    id: "ecz-school-cert-maths-p2", name: "School Certificate Mathematics — Paper 2 (calculator)",
    subject: "maths", minutes: 150, calculator: true, specs: ["zm-school-certificate"], levels: ["grade-12"],
    itemCounts: "paced",
    shapeSource: "https://www.exams-council.org.zm/wp-content/uploads/2025/03/2025-SCHOOL-CERTIFICATE-TIME-TABLE_Final.pdf",
    sections: [
      { name: "Section A", count: 10, marksEach: 4, difficulty: 0.5 },
      { name: "Section B", count: 6, marksEach: 10, difficulty: 0.68 },
    ],
  }),

  // ── ZIMBABWE · ZIMSEC O and A Level ────────
  // 4008 is the NON-CALCULATOR O Level: two papers of 2h30 and 100 marks each,
  // and candidates use mathematical tables rather than a machine. 4028 is the
  // calculator version and is a different syllabus, so it is not mixed in here.
  // 6042 Pure Mathematics is two papers of 3 hours and 120 marks.
  paper({
    id: "zimsec-o-level-maths-p1", name: "ZIMSEC O Level Mathematics (4008) — Paper 1",
    subject: "maths", minutes: 150, calculator: false, specs: ["zw-o-level"], levels: ["form-4"],
    itemCounts: "paced",
    shapeSource: "https://www5.zimsec.co.zw/examinations-administration/",
    shapeNote: "ZIMSEC's 4008 syllabus is the non-calculator O Level Mathematics: two papers of 2½ hours, 100 marks each, sat with mathematical tables.",
    sections: [
      { name: "Section A", count: 10, marksEach: 4, difficulty: 0.5 },
      { name: "Section B", count: 6, marksEach: 10, difficulty: 0.66 },
    ],
  }),
  paper({
    id: "zimsec-o-level-maths-p2", name: "ZIMSEC O Level Mathematics (4008) — Paper 2",
    subject: "maths", minutes: 150, calculator: false, specs: ["zw-o-level"], levels: ["form-4"],
    itemCounts: "paced",
    shapeSource: "https://www5.zimsec.co.zw/examinations-administration/",
    sections: [
      { name: "Section A", count: 10, marksEach: 4, difficulty: 0.54 },
      { name: "Section B", count: 6, marksEach: 10, difficulty: 0.7 },
    ],
  }),
  paper({
    id: "zimsec-a-level-pure-maths-p1", name: "ZIMSEC A Level Pure Mathematics (6042) — Paper 1",
    subject: "maths", minutes: 180, calculator: true, specs: ["zw-a-level"], levels: ["upper-sixth"],
    itemCounts: "paced",
    shapeSource: "https://www5.zimsec.co.zw/examinations-administration/",
    shapeNote: "ZIMSEC Pure Mathematics 6042 is two papers of 3 hours and 120 marks, sat with a non-programmable scientific calculator.",
    sections: [
      { name: "Section A", count: 6, marksEach: 12, difficulty: 0.78 },
      { name: "Section B", count: 4, marksEach: 12, difficulty: 0.9 },
    ],
  }),
  paper({
    id: "zimsec-a-level-pure-maths-p2", name: "ZIMSEC A Level Pure Mathematics (6042) — Paper 2",
    subject: "maths", minutes: 180, calculator: true, specs: ["zw-a-level"], levels: ["upper-sixth"],
    itemCounts: "paced",
    shapeSource: "https://www5.zimsec.co.zw/examinations-administration/",
    sections: [
      { name: "Section A", count: 6, marksEach: 12, difficulty: 0.8 },
      { name: "Section B", count: 4, marksEach: 12, difficulty: 0.92 },
    ],
  }),

  // ── MALAWI · MSCE ────────
  // Paper I is 20 compulsory questions in 2 hours for 100 marks; Paper II offers
  // 12 questions in 2h30 for 100 marks, of which all six in Section A (60 marks)
  // are compulsory and four of six in Section B (40 marks) are chosen. The
  // paper's own instructions are where those counts were read.
  paper({
    id: "msce-maths-p1", name: "MSCE Mathematics (M131/I) — Paper I",
    subject: "maths", minutes: 120, calculator: true, specs: ["mw-msce"], levels: ["form-4"],
    itemCounts: "published",
    shapeSource: "https://www.maneb.mw/",
    shapeNote: "MANEB's MSCE Mathematics (M131) is two papers: Paper I, 20 questions in 2 hours for 100 marks, and Paper II, 2½ hours for 100 marks with 60 marks compulsory and 40 chosen. Scientific calculators are allowed on both.",
    sections: [{ name: "Questions", count: 20, marksEach: 5, difficulty: 0.52 }],
  }),
  paper({
    id: "msce-maths-p2", name: "MSCE Mathematics (M131/II) — Paper II",
    subject: "maths", minutes: 150, calculator: true, specs: ["mw-msce"], levels: ["form-4"],
    itemCounts: "paced",
    shapeSource: "https://www.maneb.mw/",
    sections: [
      { name: "Section A · compulsory", count: 6, marksEach: 10, difficulty: 0.55 },
      { name: "Section B · choose four", count: 4, marksEach: 10, difficulty: 0.7 },
    ],
  }),

  // ── IRELAND · Leaving Certificate ────────
  // TWO papers at Higher and Ordinary level, 2½ hours and 300 marks each (600 for
  // the subject); Foundation level sits one paper. Both levels are `senior` in
  // the specification, and a single paper is what Foundation sits, so the papers
  // are named for the level they belong to rather than pretending to be one
  // shape. A calculator is allowed on both papers.
  //
  // The JUNIOR CYCLE is deliberately NOT declared: Curriculum Online confirms it
  // is one common-level written examination, but its mark total could not be
  // confirmed from a document that could be read, and a mark total nobody could
  // check is the thing this catalogue must not print. A Junior Cycle learner is
  // handed the modelled practice sets at their band until that is read.
  paper({
    id: "leaving-cert-maths-p1", name: "Leaving Certificate Mathematics — Paper 1",
    subject: "maths", minutes: 150, calculator: true, specs: ["ie-junior"], levels: ["senior"],
    itemCounts: "paced",
    shapeSource: "https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/mathematics/",
    shapeNote: "Curriculum Online: Higher and Ordinary level each have two examination papers; Foundation level has one. Marks and durations follow the examination papers.",
    sections: [
      { name: "Section A · short questions", count: 8, marksEach: 25, difficulty: 0.55 },
      { name: "Section B · long questions", count: 2, marksEach: 50, difficulty: 0.72 },
    ],
  }),
  paper({
    id: "leaving-cert-maths-p2", name: "Leaving Certificate Mathematics — Paper 2",
    subject: "maths", minutes: 150, calculator: true, specs: ["ie-junior"], levels: ["senior"],
    itemCounts: "paced",
    shapeSource: "https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/mathematics/",
    sections: [
      { name: "Section A · short questions", count: 8, marksEach: 25, difficulty: 0.58 },
      { name: "Section B · long questions", count: 2, marksEach: 50, difficulty: 0.76 },
    ],
  }),

  // ── INDIA · ISC (CISCE) ────────
  // ISC Mathematics (860) is TWO papers: Theory, 3 hours for 80 marks, and
  // Project Work for 20. Only the theory paper is modelled — a project marked by
  // a teacher is not something this product can sit — so the row says 80 and the
  // caveat says where the other 20 went.
  paper({
    id: "isc-mathematics", name: "ISC Mathematics (860) — Theory",
    subject: "maths", minutes: 180, calculator: true, specs: ["in-icse"], levels: ["isc"],
    itemCounts: "paced",
    shapeSource: "https://www.cisce.org/",
    shapeNote: "CISCE's ISC Mathematics (860) is a 3-hour theory paper of 80 marks plus 20 marks of project work. Only the theory paper is modelled. A Casio fx-82MS or equivalent is permitted; a calculator with information-retrieval features is not.",
    sections: [
      { name: "Section A", count: 12, marksEach: 4, difficulty: 0.72 },
      { name: "Section B", count: 4, marksEach: 8, difficulty: 0.86 },
    ],
  }),

  // ── SRI LANKA · GCE Ordinary Level ────────
  // Two papers: Paper I, 2 hours and 100 marks, is 25 short questions and 5
  // structured questions; Paper II, 3 hours and 100 marks, sets 12 questions of
  // which 10 are answered. No calculator.
  paper({
    id: "sl-ol-maths-p1", name: "GCE O Level Mathematics — Paper I",
    subject: "maths", minutes: 120, calculator: false, specs: ["lk-o-level"], levels: ["grade-11"],
    itemCounts: "published",
    shapeSource: "https://www.doenets.lk/",
    shapeNote: "Sri Lanka's Department of Examinations sets O Level Mathematics as two papers of 100 marks: Paper I (2 hours; Part A 25 short questions, Part B 5 structured questions) and Paper II (3 hours; 12 questions, 10 answered).",
    sections: [
      { name: "Part A · short", count: 25, marksEach: 2, difficulty: 0.42 },
      { name: "Part B · structured", count: 5, marksEach: 10, difficulty: 0.6 },
    ],
  }),
  paper({
    id: "sl-ol-maths-p2", name: "GCE O Level Mathematics — Paper II",
    subject: "maths", minutes: 180, calculator: false, specs: ["lk-o-level"], levels: ["grade-11"],
    itemCounts: "published",
    shapeSource: "https://www.doenets.lk/",
    sections: [
      { name: "Part A", count: 5, marksEach: 8, difficulty: 0.5 },
      { name: "Part B", count: 5, marksEach: 12, difficulty: 0.68 },
    ],
  }),
];

/** Papers available for a qualification (by spec id), optionally one subject.
 *
 *  This is the CATALOGUE's view — every paper the qualification has, across all
 *  its tiers — which is what the coverage audit counts. What a LEARNER may sit
 *  is a narrower question, and `paperAllowedFor` is the one that answers it. */
export function papersForSpec(specId: string, subject?: SubjectId): PaperTemplate[] {
  return PAPERS.filter((p) => p.specs.includes(specId) && (!subject || p.subject === subject));
}

/** May THIS learner sit this paper?
 *
 *  One owner for the rule, because it is asked in two places that must agree:
 *  the picker (what is offered) and the sitting (what can be started from a
 *  stale link). A paper belongs to a qualification and, where the board sets
 *  different papers per tier, to a tier within it. */
export function paperAllowedFor(t: PaperTemplate, active: ActiveSpec): boolean {
  return t.specs.includes(active.spec.id) && (!t.levels || t.levels.includes(active.level.id));
}

/**
 * Papers for a qualification that has no authored board blueprint. A SET, not
 * one paper: a learner revising for an exam needs more than a single mock, and
 * three was the smallest number that gives them a first pass, a harder pass and
 * a full-length sitting. Every paper is built from the REAL difficulty band and
 * coverage of that qualification's tier, and labelled as what it is: an
 * exam-style paper to the specification, not a board mock.
 *
 * The three differ in SHAPE, not only in seed — a paper that merely drew
 * different questions from the same sections would not be a different paper:
 *
 *   Paper 1  short answers — recall and one-step work, the first pass
 *   Paper 2  extended response — fewer, longer questions at a higher target
 *   Paper 3  full mock — the mixed length and breadth of a real sitting
 */
/** The size of a real SITTING at this band, not the size of a practice set.
 *
 *  A board paper is a fixed shape: a GCSE paper is a paper of 60–80 marks in
 *  1h15–1h30, an advanced paper 100 in 2h. The modelled set used to size itself
 *  by QUESTION COUNT (`count * 3` minutes), which produced 52 marks in 60 min,
 *  90 in 70 and 64 in 80 — three papers whose lengths bore no resemblance to
 *  each other, let alone to an exam. A learner asked for papers "in the format
 *  of the actual board exams", and length and time ARE that format: they decide
 *  whether a mock is a sitting or a worksheet.
 *
 *  These are OpenMind's own shapes, said as `modelled` on every row: they are
 *  not claimed to be any board's published structure, and where a board's
 *  blueprint IS on file it is used instead of this. */
function examSize(difficulty: number): { marks: number; minutes: number } {
  if (difficulty <= 0.5) return { marks: 60, minutes: 75 };
  if (difficulty <= 0.75) return { marks: 80, minutes: 90 };
  return { marks: 100, minutes: 120 };
}

/** One section's plan: a share of the paper's marks at one mark value, rounded
 *  to a whole number of questions so the paper's total is exact. */
interface SectionPlan { name: string; share: number; marksEach: number; difficulty: number }

export function genericPapers(active: ActiveSpec, subject: SubjectId, lang?: string): PaperTemplate[] {
  const d = active.level.difficulty;
  // The NAME is UI, not data: the translated subject plus the paper's number,
  // both of which the learner's language already has. Spelling out the raw
  // subject id here is how "— maths paper" used to leak English into a
  // translated page, and a hard-coded "Paper 2" would leak it again.
  const label = subjectLabel(subject, lang);
  const t = translator(lang ?? "en");
  const named = (n: number) => `${label} · ${fill(t("pp.paper"), { n })}`;
  const base = `spec-${active.spec.id}-${active.level.id}-${subject}`;
  const boundaries: GradeBoundary[] = builtBoundaries(d);
  const size = examSize(d);
  const common = {
    subject, calculator: true, specs: [active.spec.id], boundaries,
    // THE SET EVERY COUNTRY WITHOUT A BLUEPRINT RECEIVES. It is OpenMind's own
    // shape at the qualification's band, so it says so on every row that shows
    // it — the one thing it must never do is pass for the learner's exam.
    basis: "modelled" as const,
  };
  /** A paper of the band's own size, built from a section plan. Section names
   *  are the ones a real paper prints (Section A/B/C, in increasing demand), not
   *  the old "Short answers / Working", which named OpenMind's item kinds rather
   *  than the shape of the paper. */
  const sized = (n: number, set: string, plan: SectionPlan[]): PaperTemplate => {
    const sections = plan.map((s) => {
      const marks = Math.max(s.marksEach * 2, Math.round((size.marks * s.share) / s.marksEach) * s.marksEach);
      return { name: s.name, count: marks / s.marksEach, marksEach: s.marksEach, difficulty: s.difficulty };
    });
    const total = sections.reduce((sum, s) => sum + s.count * s.marksEach, 0);
    return paper({
      ...common,
      // THE SET IS PART OF THE ID, so "start Paper 2, Set B" reaches THAT
      // template rather than whichever one happened to be found first. Two sets
      // share a shape and differ only in the draw, which is exactly what a
      // different sitting of the same paper is.
      id: `${base}-p${n}-set-${set.toLowerCase()}`,
      name: `${named(n)} · ${fill(t("pp.set"), { s: set })}`,
      // Time follows the marks at the band's own pace, so the clock and the
      // paper agree even when a rounded section puts the total a mark or two
      // either side of the target.
      minutes: Math.round((total * size.minutes) / size.marks),
      sections,
    });
  };
  const easier = Math.max(0.2, d - 0.18);
  /**
   * THREE SHAPES, EACH IN THREE SETS.
   *
   * The shapes are the three a candidate needs — a short-answer first pass, an
   * extended-response paper, and a full mixed mock — and each is offered as
   * three SETS. A set is a different draw of the same shape, which is what a
   * second sitting of a paper is: same length, same sections, different items.
   * One paper per shape was the thin version of a revision library, and the report
   * from a real learner was blunt: "make the exam papers have soo many papers".
   *
   * They are named Paper 1/2/3 and Set A/B/C/D, not "Mock 1..12": a learner
   * revising wants to know WHICH sitting they are doing, and a numbered list of
   * nine mocks names nothing. Every one says `modelled` on its row, so none of
   * them can pass for the awarding body's own paper.
   */
  // FOUR SITTINGS PER SHAPE, not three. A learner revising needs more than one
  // pass at each paper, and a board's own archive is the same paper many times
  // over: same sections, same clock, different questions. A set is exactly that
  // — a different draw of the same shape (`sized` derives the id from the set,
  // and the seed comes from the sitting) — so the fourth sitting adds practice
  // without claiming a paper the board does not set. Three shapes × four sets is
  // twelve sittings per subject, above the board's own papers where the board
  // has them.
  const SETS = ["A", "B", "C", "D"] as const;
  const shapes: Array<{ n: number; plan: SectionPlan[] }> = [
    // PAPER 1 — the first pass: short answers throughout, the whole paper at the
    // easier end of the band, which is what a board's Paper 1 usually is.
    { n: 1, plan: [{ name: "Section A", share: 1, marksEach: 2, difficulty: easier }] },
    // PAPER 2 — extended response: fewer, longer questions, mostly 4-mark work.
    { n: 2, plan: [
      { name: "Section A", share: 0.55, marksEach: 2, difficulty: easier },
      { name: "Section B", share: 0.45, marksEach: 4, difficulty: d },
    ] },
    // PAPER 3 — the full mock: the graded mix a candidate actually sits, with
    // the hard questions at the end where a board puts them.
    { n: 3, plan: [
      { name: "Section A", share: 0.45, marksEach: 2, difficulty: easier },
      { name: "Section B", share: 0.35, marksEach: 4, difficulty: d },
      { name: "Section C", share: 0.2, marksEach: 6, difficulty: Math.min(1, d + 0.1) },
    ] },
  ];
  // Ordered BY PAPER, then by set: Paper 1 A/B/C, then Paper 2 — because that is
  // how a learner works through a revision library, and grouping by set would
  // put three different papers under "Set A".
  return shapes.flatMap((s) => SETS.map((set) => sized(s.n, set, s.plan)));
}

/** Every paper a learner can sit for ONE subject: the board's own blueprints
 *  where that subject has them, and OpenMind's exam-shaped set otherwise.
 *
 *  WHY NOT BOTH. A subject with a published blueprint (GCSE maths, physics,
 *  chemistry, biology) was ALSO offered the three modelled papers, so a
 *  maths-only learner's page held ten maths rows — six board papers (two boards
 *  publish the same three) and three modelled duplicates of the same sitting. A
 *  picker that lists the same exam five ways is not a choice. Where the board's
 *  shape exists it IS the board format, so it is what the learner sees; the
 *  modelled set exists for the subjects the board does not publish here. */
export function papersForSubject(active: ActiveSpec, subject: SubjectId, lang?: string): PaperTemplate[] {
  // ── ONLY THE PAPERS THIS TIER SITS ─────────────────────────────────────
  // The catalogue's papers for the qualification, narrowed to the learner's own
  // tier. Filtering here rather than in the picker is what keeps the picker and
  // the sitting in step: a paper the list does not show is also one the route
  // refuses to build from a stale link (`paperAllowedFor`).
  const authored = papersForSpec(active.spec.id, subject).filter((p) => paperAllowedFor(p, active));
  const modelled = genericPapers(active, subject, lang);
  // BOTH, IN THIS ORDER — and this REVERSES an earlier rule on purpose.
  //
  // The rule was "the board's set suppresses the modelled set", because a
  // maths-only learner's page showed the same sitting five ways. The rule was
  // right about duplicates and wrong about coverage: the catalogue holds ONE
  // Cambridge IGCSE maths blueprint and it is the EXTENDED paper, so a learner
  // whose course is Core was offered a paper pitched at the tier above theirs
  // and nothing else — measured on a real Core IGCSE profile, the whole library
  // was two rows, one of them the wrong tier. A learner cannot be told "sit the
  // Extended paper" by a product that knows their tier.
  //
  // The modelled sets are drawn at THEIR tier, carry `modelled` on every row and
  // are named as practice sets, so they cannot be mistaken for the board's
  // paper — and the board's paper still leads, because it is the one that is
  // really sat. What made the old rows read as duplicates was two papers with
  // the SAME name; these carry their own (Paper 1 · Set A, …).
  return [...authored, ...modelled];
}

/** The first of the set, for callers that need exactly one paper: the default
 *  offer, and the name/language contract the engine tests assert. */
export function genericPaper(active: ActiveSpec, subject: SubjectId, lang?: string): PaperTemplate {
  return genericPapers(active, subject, lang)[0];
}

/** The paper a student should be offered first: the first paper of their
 *  subject's set — the board's own where one is on file, else the modelled
 *  first paper. One door, so the picker and a direct request cannot disagree. */
export function defaultPaperFor(active: ActiveSpec, subject: SubjectId, lang?: string): PaperTemplate {
  return papersForSubject(active, subject, lang)[0] ?? genericPaper(active, subject, lang);
}

// ── A PAPER BUILT FROM THE LEARNER'S OWN RECORD ─────────────────────────────
//
// EVERY OTHER PAPER IS THE SAME FOR EVERY LEARNER. `paperConcepts` hands the
// assembly the qualification's whole coverage and the draw takes a uniform pick
// from it, so one learner who has failed linear equations six times and one who
// has never met them are asked the same NUMBER of questions about them. The
// difficulty is the course's and the shape is the awarder's, but the CONTENT is
// nobody's in particular.
//
// This is the paper that is theirs. Its candidates come from the learner model
// the rest of the product already decides with (lib/learner-model — mastery, the
// raw correct/attempts counts, the live slip), restricted to concepts their OWN
// qualification teaches — and they are the WHOLE candidate set. No question here
// is drawn from ground the record has not spoken about: the moment most of the
// questions come from elsewhere, the paper is the ordinary one wearing a
// different name. Its length is therefore the size of the work it is about, and
// the row's promise — every question from the ideas this record calls weakest —
// is true of every paper it builds.
//
// MEASURED, because the first version of this was wrong in a way that read as
// correct: it topped a thin set back up to eight with in-course concepts the
// record had never met. Against a learner who had sat ONLY the baseline
// diagnostic, the finished paper was 8 questions of which 1–4 came from their own
// record — computing 1 of 8, maths 4 of 8 — while its row said "built from your
// record" and its panel said every question came from their weakest ideas. That
// is the ordinary paper under a personal name, which is worse than no paper.
//
// THE RANKING IS THE ENGINE'S OWN FIRST TIER. `stuckOn` — measured, below the
// established bar, and with at least one answer wrong — is the predicate
// `decideNext` puts first, so the paper and the next-step card cannot disagree
// about which idea is in trouble. Below it, weakest mastery first, and among
// equals the LEAST RECENTLY SEEN, because that is the one most likely to have
// gone. The draw from the set is a uniform pick (`pick` indexes the list by a
// hash), so this ORDER is not prominence: it decides which ideas a CAP-length
// paper keeps, and nothing else.
//
// WHAT IT DELIBERATELY IS NOT: a diagnostic. A concept nobody has asked about
// has no evidence of need, so it is not in the paper at all — which is why a
// learner who has answered nothing is offered nothing.

/** How long a record-built paper may be. The floor is one question in EACH
 *  section — a section with nothing in it is not a section, which is what makes
 *  the floor 2 rather than 1 — and the ceiling is the most a learner will finish
 *  in one go. */
export const NEEDS_PAPER_SLOTS = { min: 2, max: 24 } as const;

export interface NeedsReading {
  /** In-course concepts whose work is NOT FINISHED for this learner, neediest
   *  first. `conceptDone` is the engine's own answer to "is there anything left
   *  here?" — so a concept they established but never proved unaided is in, and
   *  one they have proved and transferred is out. Empty when every concept they
   *  have met is finished: an honest state, and the one in which no paper is
   *  offered. */
  weak: string[];
  /** What the paper draws from: the neediest `NEEDS_PAPER_SLOTS.max` of `weak`,
   *  and nothing else — never topped up from the rest of the course. Shorter
   *  than `slots` when the record holds less than a floor's worth of unfinished
   *  work, which the paper then asks about more than once rather than filling
   *  the sitting with ground nobody has evidence about. */
  candidates: string[];
  /** How many questions the paper should have: the size of the work it is about,
   *  held between the floor and the ceiling. */
  slots: number;
}

/**
 * What THIS learner's record says the paper should be about.
 *
 * Pure — the state in, the reading out — so the suite can pin the ranking on a
 * synthetic record instead of trusting a live one.
 */
export function needsReading(
  state: ProfileState,
  active: ActiveSpec,
  subject: SubjectId,
): NeedsReading {
  const course = paperConcepts(active, subject);
  if (course.length === 0) return { weak: [], candidates: [], slots: NEEDS_PAPER_SLOTS.min };
  // COURSE MEMBERSHIP IS THE FILTER, and it is not cosmetic: a learner who
  // changed qualification carries evidence on concepts their NEW course does not
  // contain, and a paper that asked about those would be examining them on work
  // they are no longer being taught.
  const inCourse = new Set(course);
  const seen = buildSnapshot(state).evidence.filter((e) => inCourse.has(e.conceptId));
  const need = (a: ConceptEvidence, b: ConceptEvidence) =>
    Number(stuckOn(b)) - Number(stuckOn(a)) || a.mastery - b.mastery || a.lastSeen - b.lastSeen;
  const weak = seen
    .filter((e) => !conceptDone(e, canTransfer))
    .sort(need)
    .map((e) => e.conceptId);
  const slots = Math.min(NEEDS_PAPER_SLOTS.max, Math.max(NEEDS_PAPER_SLOTS.min, weak.length));
  // THE PAPER IS THE WEAK SET, CAPPED — never topped up. A record with more than
  // the ceiling's worth keeps the ranking's own first `max`; one with less than a
  // floor's worth gets a paper over what little is known, which is short, true,
  // and grows as they work.
  const candidates = weak.slice(0, NEEDS_PAPER_SLOTS.max);
  return { weak, candidates, slots };
}

/** The record-built paper's id, derived exactly as every other built paper's is
 *  — exposed so a caller can RECOGNISE it without building the template (the
 *  template's length, unlike its id, depends on the record). */
export function needsPaperId(active: ActiveSpec, subject: SubjectId): string {
  return `spec-${active.spec.id}-${active.level.id}-${subject}-needs`;
}

/**
 * The record-built paper's SHAPE: the full mock's sections, as long as the work
 * it is about.
 *
 * The name is UI, exactly as `genericPapers`' is — the translated subject and a
 * translated phrase — so a translated page never shows an English paper name.
 * (The ID carries no language, or a learner switching language would be sent to
 * a paper that does not exist.)
 */
export function needsPaper(
  active: ActiveSpec,
  subject: SubjectId,
  lang?: string,
  slots: number = NEEDS_PAPER_SLOTS.max,
): PaperTemplate {
  const d = active.level.difficulty;
  const count = Math.min(NEEDS_PAPER_SLOTS.max, Math.max(NEEDS_PAPER_SLOTS.min, Math.round(slots)));
  const label = subjectLabel(subject, lang);
  const t = translator(lang ?? "en");
  const shortCount = Math.round(count * 0.6);
  return paper({
    id: needsPaperId(active, subject),
    name: `${label} · ${t("pp.needs")}`,
    subject,
    calculator: true,
    specs: [active.spec.id],
    basis: "modelled",
    itemCounts: "paced",
    // Scaled to the sitting, because this paper can be SHORT — the house floor of
    // 30 minutes is for a mock of a mock's length, and printing 20 minutes over
    // two questions would be one more claim the paper cannot keep.
    minutes: Math.max(7, Math.round(count * 3.5)),
    boundaries: builtBoundaries(d),
    sections: [
      { name: "Short answers", count: shortCount, marksEach: 2, difficulty: Math.max(0.2, d - 0.15) },
      { name: "Longer questions", count: count - shortCount, marksEach: 5, difficulty: Math.min(1, d + 0.05) },
    ],
  });
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
  /** Carried onto the BUILT paper, not read back from the template later: a
   *  paper a learner has sat must be able to say what it was even if the
   *  library is edited afterwards. */
  basis: PaperBasis;
  shapeSource: string | null;
  /** The template's own caveat, carried the same way and for the same reason. */
  shapeNote: string | null;
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
  /** Same reason as BuiltPaper: the stored key remembers what the sitting was. */
  basis: PaperBasis;
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
  /** Draw from THESE concepts instead of the qualification's whole coverage.
   *  Used by the record-built paper, whose list is the learner's own weak
   *  ground; an empty list means the coverage, so a caller cannot disable the
   *  paper's subject by passing nothing. */
  concepts?: string[];
}

export function buildPaper(opts: BuildPaperOptions): { paper: BuiltPaper; key: BuiltPaperAnswerKey } {
  const template = opts.template ?? defaultPaperFor(opts.active, opts.subject, opts.lang);
  const candidates = opts.concepts?.length ? opts.concepts : paperConcepts(opts.active, opts.subject);
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
    basis: template.basis ?? "published",
    shapeSource: template.shapeSource ?? null,
    shapeNote: template.shapeNote ?? null,
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
      basis: template.basis ?? "published",
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
    /** The misconceptions this question probes, from the answer key. Shown
     *  beside a wrong answer so the exam-evidence screen can name the IDEA to
     *  check — the one thing the score cannot say. */
    tags: string[];
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
      tags: q.tags,
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
