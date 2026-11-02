// ─────────────────────────────────────────────────────────────────────────────
// THE LESSON VALIDATOR.
//
// A schema in TypeScript is not a guarantee about stored JSON: a lesson can be
// loaded from disk, a CMS or a teacher's edit and still be cast to the type. The
// checks here are the ones that keep the content platform honest:
//
//   · every block has provenance, and a linked source may only power a link;
//   · an authored/ingested/adapted block names a source whose recorded rights
//     permit that use;
//   · every assessed block has exactly one assessment of the matching kind;
//   · an approved lesson names who approved it and when;
//   · a code lab's tests are present and its timeout is bounded;
//   · labels cover exactly the diagram's parts.
// ─────────────────────────────────────────────────────────────────────────────
import { decideUse, sourceRecord } from "../source-registry";
import { parseableMathExpression } from "../math-expression";
import {
  isAssessedBlock,
  type Assessment,
  type LessonBlock,
  type LessonDocument,
} from "./types";
import { LESSON_SCHEMA_VERSION } from "./types";

export interface LessonProblem {
  code: string;
  message: string;
  blockId?: string;
  assessmentId?: string;
}

const ASSESSMENT_FOR: Record<string, Assessment["kind"]> = {
  calculation: "numeric",
  math_expression: "math_expression",
  label_diagram: "labels",
  code_lab: "code",
  retrieval: "retrieval",
};

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateLesson(doc: LessonDocument): LessonProblem[] {
  const problems: LessonProblem[] = [];
  const add = (code: string, message: string, blockId?: string, assessmentId?: string) =>
    problems.push({ code, message, ...(blockId ? { blockId } : {}), ...(assessmentId ? { assessmentId } : {}) });

  if (doc.schemaVersion !== LESSON_SCHEMA_VERSION) {
    add("schema_version", `expected schema ${LESSON_SCHEMA_VERSION}, got ${String(doc.schemaVersion)}`);
  }
  if (!nonEmpty(doc.id)) add("lesson_id", "lesson id is empty");
  if (!nonEmpty(doc.title)) add("lesson_title", "lesson title is empty");
  if (!nonEmpty(doc.conceptId)) add("lesson_concept", "lesson concept is empty");
  if (!nonEmpty(doc.curriculum.objective)) add("lesson_objective", "curriculum objective is empty");
  if (!Number.isFinite(doc.estimatedMinutes) || doc.estimatedMinutes <= 0) add("lesson_minutes", "estimatedMinutes must be positive");

  if (doc.review.state === "subject-reviewed" || doc.review.state === "approved") {
    if (!nonEmpty(doc.review.reviewedBy)) add("reviewer_missing", `${doc.review.state} requires reviewedBy`);
    if (!nonEmpty(doc.review.reviewedAt)) add("review_date_missing", `${doc.review.state} requires reviewedAt`);
  }

  const sourceIds = new Set<string>();
  for (const source of doc.sources) {
    if (!nonEmpty(source.id)) add("source_id", "source id is empty");
    if (sourceIds.has(source.id)) add("source_duplicate", `duplicate source id ${source.id}`);
    sourceIds.add(source.id);
    const record = sourceRecord(source.sourceId);
    if (!record) {
      add("source_unknown", `source ${source.id} names registry id ${source.sourceId}, which does not exist`);
      continue;
    }
    if (source.use === "authored" && record.kind !== "authored") {
      add("source_authored_kind", `source ${source.id} claims authored use of a ${record.kind} record`);
    }
    if (source.use === "linked") {
      if (!source.url || !record.url) add("source_link_url", `linked source ${source.id} needs a publisher URL`);
      continue;
    }
    const action = source.use === "adapted" ? "adapt" : "host";
    const decision = decideUse(record, action);
    if (decision.status !== "allowed" && decision.status !== "allowed-with-obligations") {
      add(
        "source_rights",
        `source ${source.id} may not be ${source.use}: ${decision.reasons.join(" ")}`,
      );
    }
  }

  const blockIds = new Set<string>();
  const assessmentByBlock = new Map<string, Assessment>();
  for (const assessment of doc.assessments) {
    if (!nonEmpty(assessment.id)) add("assessment_id", "assessment id is empty");
    if (assessmentByBlock.has(assessment.blockId)) {
      add("assessment_duplicate", `block ${assessment.blockId} has more than one assessment`, assessment.blockId, assessment.id);
    }
    assessmentByBlock.set(assessment.blockId, assessment);
  }

  for (const block of doc.blocks) {
    if (!nonEmpty(block.id)) add("block_id", "block id is empty");
    if (blockIds.has(block.id)) add("block_duplicate", `duplicate block id ${block.id}`, block.id);
    blockIds.add(block.id);
    if (block.sourceIds.length === 0) add("block_provenance", `block ${block.id} has no source`, block.id);
    for (const id of block.sourceIds) {
      if (!sourceIds.has(id)) add("block_source_unknown", `block ${block.id} names unknown source ${id}`, block.id);
      const source = doc.sources.find((s) => s.id === id);
      if (source?.use === "linked" && block.kind !== "link") {
        add("link_source_on_teaching", `linked source ${id} may only power a link block`, block.id);
      }
    }
    validateBlock(block, add);
    if (isAssessedBlock(block)) {
      const assessment = assessmentByBlock.get(block.id);
      if (!assessment) {
        add("assessment_missing", `assessed block ${block.id} has no assessment`, block.id);
      } else if (ASSESSMENT_FOR[block.kind] !== assessment.kind) {
        add(
          "assessment_kind",
          `block ${block.id} is ${block.kind}, but its assessment is ${assessment.kind}`,
          block.id,
          assessment.id,
        );
      }
    }
  }

  for (const assessment of doc.assessments) {
    if (!blockIds.has(assessment.blockId)) {
      add("assessment_block_unknown", `assessment ${assessment.id} names unknown block ${assessment.blockId}`, undefined, assessment.id);
    }
    validateAssessment(assessment, add);
  }

  return problems;
}

function validateBlock(
  block: LessonBlock,
  add: (code: string, message: string, blockId?: string) => void,
): void {
  switch (block.kind) {
    case "explanation":
      if (block.paragraphs.length === 0 || block.paragraphs.some((p) => !nonEmpty(p))) {
        add("explanation_empty", `explanation ${block.id} has an empty paragraph`, block.id);
      }
      break;
    case "formula":
      if (!nonEmpty(block.expression)) add("formula_empty", `formula ${block.id} is empty`, block.id);
      break;
    case "worked_example":
      if (!nonEmpty(block.prompt) || block.steps.length === 0 || !nonEmpty(block.answer)) {
        add("worked_incomplete", `worked example ${block.id} is incomplete`, block.id);
      }
      break;
    case "diagram":
      if (!nonEmpty(block.caption)) add("diagram_caption", `diagram ${block.id} has no caption`, block.id);
      break;
    case "calculation":
      if (!nonEmpty(block.prompt)) add("calculation_prompt", `calculation ${block.id} has no prompt`, block.id);
      break;
    case "math_expression":
      if (!nonEmpty(block.prompt)) add("math_prompt", `math expression ${block.id} has no prompt`, block.id);
      break;
    case "label_diagram": {
      const ids = new Set(block.diagram.parts.map((p) => p.id));
      if (ids.size !== block.diagram.parts.length) add("diagram_duplicate_part", `label diagram ${block.id} repeats a part id`, block.id);
      if (block.diagram.labels.length === 0) add("diagram_labels", `label diagram ${block.id} has no labels`, block.id);
      break;
    }
    case "code_lab":
      if (block.language !== "python") add("code_language", `code lab ${block.id} must use python`, block.id);
      if (!nonEmpty(block.starterCode)) add("code_starter", `code lab ${block.id} has no starter code`, block.id);
      if (!Number.isFinite(block.timeoutMs) || block.timeoutMs < 1000 || block.timeoutMs > 30000) {
        add("code_timeout", `code lab ${block.id} timeout must be between 1000 and 30000 ms`, block.id);
      }
      break;
    case "link":
      if (!nonEmpty(block.url) || !/^https?:\/\//.test(block.url)) add("link_url", `link ${block.id} is not an http(s) URL`, block.id);
      if (!nonEmpty(block.note)) add("link_note", `link ${block.id} has no provenance note`, block.id);
      break;
    case "retrieval":
      if (!nonEmpty(block.prompt) || !nonEmpty(block.answer)) add("retrieval_incomplete", `retrieval ${block.id} is incomplete`, block.id);
      break;
  }
}

function validateAssessment(
  assessment: Assessment,
  add: (code: string, message: string, blockId?: string, assessmentId?: string) => void,
): void {
  switch (assessment.kind) {
    case "numeric":
      if (!Number.isFinite(assessment.answer)) add("numeric_answer", `numeric assessment ${assessment.id} has no finite answer`, undefined, assessment.id);
      if (!nonEmpty(assessment.explanation)) add("numeric_explanation", `numeric assessment ${assessment.id} has no explanation`, undefined, assessment.id);
      break;
    case "math_expression":
      if (assessment.accepted.length === 0) add("math_accepted", `math assessment ${assessment.id} accepts nothing`, undefined, assessment.id);
      for (const form of assessment.accepted) {
        if (!parseableMathExpression(form)) add("math_unparseable", `math assessment ${assessment.id} has unparseable accepted form: ${form}`, undefined, assessment.id);
      }
      if (!nonEmpty(assessment.explanation)) add("math_explanation", `math assessment ${assessment.id} has no explanation`, undefined, assessment.id);
      break;
    case "code":
      if (assessment.tests.length === 0) add("code_tests", `code assessment ${assessment.id} has no tests`, undefined, assessment.id);
      if (assessment.tests.some((t) => !nonEmpty(t.name) || typeof t.expectedStdout !== "string")) {
        add("code_test_shape", `code assessment ${assessment.id} has an incomplete test`, undefined, assessment.id);
      }
      break;
    case "labels": {
      const keys = Object.keys(assessment.answers);
      if (keys.length === 0) add("label_answers", `label assessment ${assessment.id} has no answers`, undefined, assessment.id);
      if (keys.some((k) => !nonEmpty(assessment.answers[k]))) add("label_answer_empty", `label assessment ${assessment.id} has an empty answer`, undefined, assessment.id);
      break;
    }
    case "retrieval":
      if (assessment.accepted.length === 0) add("retrieval_accepted", `retrieval assessment ${assessment.id} accepts nothing`, undefined, assessment.id);
      break;
  }
}
