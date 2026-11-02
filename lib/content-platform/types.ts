// ─────────────────────────────────────────────────────────────────────────────
// CONTENT PLATFORM 1.0 — THE LESSON CONTRACT.
//
// A lesson is not a page of paragraphs plus a question array. It is a
// VERSIONED DOCUMENT whose teaching, learner response, answer key, marking
// rubric and provenance are separate fields. That separation is what lets the
// same document be rendered by the app, reviewed by a teacher, exported, and
// checked without a renderer deciding what an answer means.
//
// THE RULE THIS FILE PROTECTS: a block describes what a learner SEES or DOES.
// An assessment describes how that response is judged. The answer is never a
// property of the visible block, so a served lesson cannot leak its key by
// rendering the block, and a marker cannot disagree with the teaching because
// both point at the same block id.
//
// The document is deliberately JSON-serialisable. A lesson that only exists as
// React state cannot be versioned, reviewed, stored or diffed.
// ─────────────────────────────────────────────────────────────────────────────
import type { FigureSpec, SubjectId } from "../types";

export const LESSON_SCHEMA_VERSION = 1 as const;

/** The rungs a lesson can occupy. `draft` is not a failure; it is the honest
 *  starting state of every machine-authored or newly authored lesson. */
export type LessonReviewState =
  | "draft"
  | "machine-checked"
  | "subject-reviewed"
  | "approved";

/** How a source is used by this document. A linked source contributes a link,
 *  never copied expression. */
export type SourceUse = "authored" | "ingested" | "adapted" | "linked";

export interface LessonSource {
  /** Stable id inside this document; block.sourceIds point here. */
  id: string;
  /** The id in lib/source-registry.ts. Unknown ids fail validation. */
  sourceId: string;
  use: SourceUse;
  title: string;
  url?: string;
  licence?: string;
  attribution?: string;
}

export interface LessonReview {
  state: LessonReviewState;
  /** Required when state is subject-reviewed or approved. */
  reviewedBy?: string;
  /** ISO date. Required with reviewedBy. */
  reviewedAt?: string;
  note?: string;
}

/** The four things a subject teacher is asked to attest before a lesson may
 *  leave draft. They are deliberately separate: a correct explanation can still
 *  have a broken key, a mismatched objective or a rights problem. */
export const REVIEW_CRITERIA = [
  {
    id: "accuracy",
    label: "Subject accuracy",
    help: "The explanation, examples and answers are correct for this level.",
  },
  {
    id: "curriculum",
    label: "Curriculum alignment",
    help: "The objective, syllabus edition and depth match the course named here.",
  },
  {
    id: "assessment",
    label: "Assessment validity",
    help: "Every response is marked for what the question claims to test.",
  },
  {
    id: "rights",
    label: "Rights and accessibility",
    help: "Sources, permissions, labels and interactions are acceptable to publish.",
  },
] as const;

export type ReviewCriterionId = (typeof REVIEW_CRITERIA)[number]["id"];

export type ReviewDecision = "changes-requested" | "approved";

/** What a teacher submits. The reviewer identity is NOT here: the route derives
 *  it from the signed-in account, so a browser cannot name somebody else. */
export interface ReviewSubmission {
  documentId: string;
  decision: ReviewDecision;
  criteria: Record<ReviewCriterionId, boolean>;
  notes: string;
}

/** An append-only review record. The fingerprint binds the decision to the
 *  exact lesson content that was read: editing the lesson invalidates it. */
export interface ContentReviewRecord extends ReviewSubmission {
  id: string;
  fingerprint: string;
  reviewer: {
    accountId: string;
    name: string;
    role: string;
  };
  createdAt: number;
}

export interface CurriculumRef {
  specId: string;
  levelId: string | null;
  /** The learning objective in OpenMind's own words. This is not a quotation
   *  from a syllabus unless the source is separately cited. */
  objective: string;
  /** The syllabus edition this mapping was made against, when known. */
  syllabusEdition?: string;
}

interface BlockBase {
  id: string;
  sourceIds: string[];
}

export interface ExplanationBlock extends BlockBase {
  kind: "explanation";
  title?: string;
  paragraphs: string[];
}

export interface FormulaBlock extends BlockBase {
  kind: "formula";
  /** The expression a learner should read, in the bank's ASCII notation. */
  expression: string;
  note?: string;
}

export interface WorkedExampleBlock extends BlockBase {
  kind: "worked_example";
  prompt: string;
  steps: string[];
  answer: string;
}

export interface DiagramBlock extends BlockBase {
  kind: "diagram";
  figure: FigureSpec;
  caption: string;
}

export interface CalculationBlock extends BlockBase {
  kind: "calculation";
  prompt: string;
  unit?: string;
  hint?: string;
}

export interface MathExpressionBlock extends BlockBase {
  kind: "math_expression";
  prompt: string;
  variable?: string;
  hint?: string;
}

export interface LabelDiagramPart {
  id: string;
  /** A schematic shape the renderer can draw. No third-party image is implied. */
  shape: "membrane" | "cytoplasm" | "nucleus" | "mitochondrion" | "chloroplast" | "vacuole" | "wall";
  /** Position of the callout, in percent of the drawing box. */
  x: number;
  y: number;
}

export interface LabelDiagramBlock extends BlockBase {
  kind: "label_diagram";
  prompt: string;
  diagram: {
    /** A simple authored schematic, not a copied diagram. */
    kind: "cell";
    parts: LabelDiagramPart[];
    labels: string[];
  };
}

export interface CodeLabBlock extends BlockBase {
  kind: "code_lab";
  prompt: string;
  language: "python";
  starterCode: string;
  /** A parent-enforced ceiling. The runner is in a sandboxed browser iframe;
   *  exceeding this removes the iframe rather than trusting the code to stop. */
  timeoutMs: number;
}

export interface LinkBlock extends BlockBase {
  kind: "link";
  title: string;
  url: string;
  note: string;
}

export interface RetrievalBlock extends BlockBase {
  kind: "retrieval";
  prompt: string;
  answer: string;
  explanation: string;
}

export type LessonBlock =
  | ExplanationBlock
  | FormulaBlock
  | WorkedExampleBlock
  | DiagramBlock
  | CalculationBlock
  | MathExpressionBlock
  | LabelDiagramBlock
  | CodeLabBlock
  | LinkBlock
  | RetrievalBlock;

export interface NumericTolerance {
  abs?: number;
  rel?: number;
}

export interface NumericAssessment {
  id: string;
  blockId: string;
  kind: "numeric";
  answer: number;
  tolerance?: NumericTolerance;
  unit?: string;
  explanation: string;
}

export interface MathExpressionAssessment {
  id: string;
  blockId: string;
  kind: "math_expression";
  /** Forms that are mathematically equivalent are accepted; string equality is
   *  never the rule. */
  accepted: string[];
  variable?: string;
  explanation: string;
}

export interface CodeTest {
  name: string;
  expectedStdout: string;
}

export interface CodeAssessment {
  id: string;
  blockId: string;
  kind: "code";
  tests: CodeTest[];
  explanation: string;
}

export interface LabelAssessment {
  id: string;
  blockId: string;
  kind: "labels";
  /** part id → the label that part actually carries. */
  answers: Record<string, string>;
  explanation: string;
}

export interface RetrievalAssessment {
  id: string;
  blockId: string;
  kind: "retrieval";
  accepted: string[];
  explanation: string;
}

export type Assessment =
  | NumericAssessment
  | MathExpressionAssessment
  | CodeAssessment
  | LabelAssessment
  | RetrievalAssessment;

export interface LessonDocument {
  schemaVersion: typeof LESSON_SCHEMA_VERSION;
  id: string;
  conceptId: string;
  subject: SubjectId;
  title: string;
  language: string;
  estimatedMinutes: number;
  curriculum: CurriculumRef;
  review: LessonReview;
  sources: LessonSource[];
  blocks: LessonBlock[];
  assessments: Assessment[];
}

/** A block that requires an answer. The renderer uses this instead of a
 *  hand-written switch that could forget a new response kind. */
export const ASSESSED_BLOCK_KINDS = [
  "calculation",
  "math_expression",
  "label_diagram",
  "code_lab",
  "retrieval",
] as const;

export type AssessedBlockKind = (typeof ASSESSED_BLOCK_KINDS)[number];

export function isAssessedBlock(block: LessonBlock): boolean {
  return (ASSESSED_BLOCK_KINDS as readonly string[]).includes(block.kind);
}
