// ─────────────────────────────────────────────────────────────────────────────
// THE SEAM BETWEEN AN ASSESSMENT BLUEPRINT AND THE REAL MARKER.
//
// This module is deliberately thin. It does not mark anything itself: it
// COMPILES a blueprint item into the existing `StructuredItem` contract, so the
// one deterministic marker (`gradeStructuredParts`) awards every machine mark.
// An assessment item that cannot be expressed in that contract is returned as a
// rubric for a human, not squeezed into a keyword score.
//
// FOUR OUTCOMES, never blurred:
//   · `numeric`        → method + answer marks, marked by the existing engine;
//   · `short-answer`   → one authored recall point per criterion, recall only;
//   · `table`          → one mark per blank cell, marked by the existing table branch;
//   · `extended-response` → rubric only, machineMarkable false, never scored.
//
// AND A GATE IN FRONT OF ALL FOUR. `servedAssessmentItem` refuses a blueprint
// unless FOUR independent clearances hold: pedagogical review, source rights,
// licensing and confidentiality. `approvedAssessmentItems()` is therefore
// empty in this repository. The Mathematics blueprint records clear rights and
// licensing because it is OpenMind-authored, but no teacher has reviewed it, so
// it is still refused — which is the point of keeping the statuses separate.
//
// THE JOURNEY FIXTURE IS NOT A BLUEPRINT APPROVAL. It exists so an end-to-end
// test can drive the real route, marker, ledger, mastery projection and
// next-step engine on a scratch store. It is enabled only outside production,
// only under an explicit environment flag, and only when OPENMIND_DATA_DIR is a
// temporary directory. Every response from it says `notTeacherApproval: true`.
// ─────────────────────────────────────────────────────────────────────────────

import {
  assessmentClearance,
  assessmentServingDecision,
  type AssessmentBlueprint,
  type AssessmentClearance,
  type AssessmentDemand,
  type AssessmentServingDecision,
  type OriginalAssessmentItem,
  type ReviewStatus,
} from "./assessment-intelligence";
import { parseNumericInput } from "./answer";
import { parsePolynomial } from "./algebra";
import {
  containsPhrase,
  gradeStructuredParts,
  parseGraphPoints,
  type ShortCriterionSpec,
  type StructuredGrade,
  type StructuredItem,
  type StructuredPart,
  type TableSpec,
} from "./structured-items";
import { DIET_DIGESTION_BLUEPRINT } from "./assessment-blueprints/diet-digestion";
import { PHYSICS_ENERGY_BLUEPRINT } from "./assessment-blueprints/physics-energy";
import { MATHS_TABLES_BLUEPRINT } from "./assessment-blueprints/maths-tables";

/** The blueprints this repository knows about. The third adds a TABLE response
 *  to prove the adapter reaches the existing table marker, not just a numeric
 *  and a prose one. All three remain unreviewed. */
export const ASSESSMENT_BLUEPRINTS: readonly AssessmentBlueprint[] = [
  DIET_DIGESTION_BLUEPRINT,
  PHYSICS_ENERGY_BLUEPRINT,
  MATHS_TABLES_BLUEPRINT,
];

/** Difficulty is a function of the demand the archetype declares, not a number
 *  chosen item by item. It is used only when the item is placed on a page; it
 *  does not affect marking. */
const DEMAND_DIFFICULTY: Readonly<Record<AssessmentDemand, number>> = {
  recall: 0.35,
  understand: 0.5,
  apply: 0.62,
  analyse: 0.72,
  evaluate: 0.82,
};

export interface RubricCriterion {
  readonly id: string;
  readonly marks: number;
  readonly credit: string;
  readonly acceptable?: readonly string[];
  readonly nonCredit?: string;
  readonly misconception?: {
    readonly id: string;
    readonly label: string;
    readonly whyWrong: string;
    readonly feedback: string;
  };
}

export interface CompiledAssessment {
  readonly blueprintId: string;
  readonly blueprintVersion: string;
  readonly itemId: string;
  readonly conceptId: string;
  readonly title: string;
  readonly reviewStatus: ReviewStatus;
  readonly responseKind: OriginalAssessmentItem["responseKind"];
  /** True only for a numeric, short-answer or table item. A prose item is always
   *  false, whatever its criteria say. */
  readonly machineMarkable: boolean;
  /** The existing engine's item, or null for prose. Never a second scheme. */
  readonly structured: StructuredItem | null;
  /** What a human marks, for every item. For a machine-marked item this is
   *  the same scheme in readable form, not a second answer key. */
  readonly rubric: readonly RubricCriterion[];
}

/** The learner-facing view of an item. It deliberately has no answer, accepted
 *  form, tolerance or explanation: those are keys, and a key sent before the
 *  answer is a key the learner can read. */
export interface PublicAssessmentPart {
  readonly id: string;
  readonly prompt: string;
  readonly marks: number;
  readonly unit?: string;
  readonly methodPrompt?: string;
  readonly methodMarks?: number;
  readonly response?: "number" | "graph" | "plot" | "readoff" | "algebra" | "table" | "short";
  readonly graph?: { readonly xMin: number; readonly xMax: number; readonly yMin: number; readonly yMax: number };
  readonly plot?: { readonly xMin: number; readonly xMax: number; readonly yMin: number; readonly yMax: number };
  readonly table?: {
    readonly columns: readonly string[];
    readonly rows: readonly {
      readonly label?: string;
      readonly cells: readonly { readonly given?: string; readonly editable?: boolean; readonly unit?: string }[];
    }[];
  };
}

export interface PublicAssessmentItem {
  readonly blueprintId: string;
  readonly blueprintVersion: string;
  readonly itemId: string;
  readonly conceptId: string;
  readonly title: string;
  readonly curriculumContext: string;
  readonly marks: number;
  readonly reviewStatus: ReviewStatus;
  readonly clearance: AssessmentClearance;
  readonly responseKind: OriginalAssessmentItem["responseKind"];
  readonly machineMarkable: boolean;
  readonly parts: readonly PublicAssessmentPart[];
  /** A prose item carries its rubric count, never its wording, before a
   *  response. The rubric is returned with the submitted response. */
  readonly rubricCount: number;
  /** Present only on the test fixture. A genuine blueprint never carries one. */
  readonly fixture?: {
    readonly id: string;
    readonly label: string;
    readonly notTeacherApproval: true;
  };
}

/** An authored signal that the response may reveal a misconception. ADVISORY:
 *  it explains a response and never moves a mark. A prose item has no other
 *  diagnosis because a machine cannot read reasoning. */
export interface AdvisoryMisconception {
  readonly id: string;
  readonly label: string;
  readonly whyWrong: string;
  readonly feedback: string;
  readonly advisory: true;
}

function rubricFor(bp: AssessmentBlueprint, item: OriginalAssessmentItem): RubricCriterion[] {
  return item.criteria.map((criterion) => {
    const profile = criterion.misconceptionId
      ? bp.misconceptions.find((belief) => belief.id === criterion.misconceptionId)
      : undefined;
    return {
      id: criterion.id,
      marks: criterion.marks,
      credit: criterion.credit,
      ...(criterion.acceptable ? { acceptable: criterion.acceptable } : {}),
      ...(criterion.nonCredit ? { nonCredit: criterion.nonCredit } : {}),
      ...(profile ? {
        misconception: {
          id: profile.id,
          label: profile.label,
          whyWrong: profile.whyWrong,
          feedback: profile.feedback,
        },
      } : {}),
    };
  });
}

function compileTable(item: OriginalAssessmentItem): StructuredPart {
  if (!item.table) throw new Error(`${item.id}: a table item has no table key`);
  const table: TableSpec = {
    columns: [...item.table.columns],
    rows: item.table.rows.map((row) => ({
      ...(row.label !== undefined ? { label: row.label } : {}),
      cells: row.cells.map((cell) => ({
        ...(cell.given !== undefined ? { given: cell.given } : {}),
        ...(cell.answer !== undefined ? { answer: cell.answer } : {}),
        ...(cell.accepted ? { accepted: [...cell.accepted] } : {}),
        ...(cell.unit ? { unit: cell.unit } : {}),
        ...(cell.tolerance ? { tolerance: cell.tolerance } : {}),
      })),
    })),
  };
  return {
    id: item.id,
    prompt: item.prompt,
    marks: item.marks,
    answer: 0,
    response: "table",
    table,
    explanation: item.modelAnswer,
  };
}

/** Compile one item into the existing contract. Throws on an item the validator
 *  would reject — a malformed scheme must fail loudly, not mark quietly. */
export function compileAssessmentItem(
  bp: AssessmentBlueprint,
  item: OriginalAssessmentItem,
): CompiledAssessment {
  const archetype = bp.archetypes.find((candidate) => candidate.id === item.archetypeId);
  const difficulty = archetype ? DEMAND_DIFFICULTY[archetype.demand] : 0.5;
  const rubric = rubricFor(bp, item);

  const base = {
    blueprintId: bp.id,
    blueprintVersion: bp.version,
    itemId: item.id,
    conceptId: item.conceptId,
    title: bp.title,
    reviewStatus: item.reviewStatus,
    responseKind: item.responseKind,
    rubric,
  };

  if (item.responseKind === "numeric") {
    const answer = item.criteria.find((criterion) => criterion.kind === "answer");
    const method = item.criteria.find((criterion) => criterion.kind === "method");
    if (!answer || !item.numeric) {
      throw new Error(`${bp.id}/${item.id}: a numeric item needs a numeric key and one answer criterion`);
    }
    const part: StructuredPart = {
      id: item.id,
      prompt: item.prompt,
      marks: item.marks,
      answer: item.numeric.answer,
      answerId: answer.id,
      ...(item.numeric.tolerance ? { tolerance: item.numeric.tolerance } : {}),
      ...(answer.acceptable ? { accepted: [...answer.acceptable] } : {}),
      ...(item.numeric.unit ? { unit: item.numeric.unit } : {}),
      ...(item.numeric.unitRequired ? { unitRequired: true } : {}),
      ...(method ? {
        method: {
          id: method.id,
          marks: method.marks,
          prompt: "Show the calculation you used",
          accept: [...(method.acceptable ?? [])],
          label: method.credit,
        },
      } : {}),
      explanation: item.modelAnswer,
    };
    return {
      ...base,
      machineMarkable: true,
      structured: {
        id: `assessment:${bp.id}:${item.id}`,
        conceptId: item.conceptId,
        title: `${bp.title} — ${item.id}`,
        intro: "",
        note: item.partialCreditRule,
        difficulty,
        parts: [part],
      },
    };
  }

  if (item.responseKind === "short-answer") {
    const short: ShortCriterionSpec[] = item.criteria.map((criterion) => {
      const profile = criterion.misconceptionId
        ? bp.misconceptions.find((belief) => belief.id === criterion.misconceptionId)
        : undefined;
      return {
        id: criterion.id,
        marks: criterion.marks,
        label: criterion.credit,
        accept: [...(criterion.acceptable ?? [])],
        ...(profile ? {
          misconceptionId: profile.id,
          misconceptionLabel: profile.label,
          signals: [...(criterion.signals ?? [])],
          feedback: profile.feedback,
        } : {}),
      };
    });
    return {
      ...base,
      machineMarkable: true,
      structured: {
        id: `assessment:${bp.id}:${item.id}`,
        conceptId: item.conceptId,
        title: `${bp.title} — ${item.id}`,
        intro: "",
        note: item.partialCreditRule,
        difficulty,
        parts: [{
          id: item.id,
          prompt: item.prompt,
          marks: item.marks,
          response: "short",
          short,
          explanation: item.modelAnswer,
        }],
      },
    };
  }

  if (item.responseKind === "table") {
    const part = compileTable(item);
    return {
      ...base,
      machineMarkable: true,
      structured: {
        id: `assessment:${bp.id}:${item.id}`,
        conceptId: item.conceptId,
        title: `${bp.title} — ${item.id}`,
        intro: "",
        note: item.partialCreditRule,
        difficulty,
        parts: [part],
      },
    };
  }

  return { ...base, machineMarkable: false, structured: null };
}

/** Compile the learner-facing shape from a compiled item. This is the only
 *  function that turns a key-bearing part into something a client may read. */
export function publicAssessmentItem(
  bp: AssessmentBlueprint,
  item: OriginalAssessmentItem,
  compiled: CompiledAssessment = compileAssessmentItem(bp, item),
): PublicAssessmentItem {
  const parts: PublicAssessmentPart[] = (compiled.structured?.parts ?? []).map((part) => ({
    id: part.id,
    prompt: part.prompt,
    marks: part.marks,
    ...(part.unit ? { unit: part.unit } : {}),
    ...(part.method ? { methodPrompt: part.method.prompt, methodMarks: part.method.marks } : {}),
    ...(part.response ? { response: part.response } : {}),
    ...(part.graph ? {
      graph: {
        xMin: part.graph.xMin, xMax: part.graph.xMax,
        yMin: part.graph.yMin, yMax: part.graph.yMax,
      },
    } : {}),
    ...(part.plot ? {
      plot: {
        xMin: part.plot.xMin, xMax: part.plot.xMax,
        yMin: part.plot.yMin, yMax: part.plot.yMax,
      },
    } : {}),
    ...(part.table ? {
      table: {
        columns: [...part.table.columns],
        rows: part.table.rows.map((row) => ({
          ...(row.label !== undefined ? { label: row.label } : {}),
          cells: row.cells.map((cell) => cell.answer !== undefined
            ? { editable: true, ...(cell.unit ? { unit: cell.unit } : {}) }
            : { given: cell.given ?? "", ...(cell.unit ? { unit: cell.unit } : {}) }),
        })),
      },
    } : {}),
  }));
  return {
    blueprintId: bp.id,
    blueprintVersion: bp.version,
    itemId: item.id,
    conceptId: item.conceptId,
    title: bp.title,
    curriculumContext: bp.curriculumContext,
    marks: item.marks,
    reviewStatus: item.reviewStatus,
    clearance: assessmentClearance(bp),
    responseKind: item.responseKind,
    machineMarkable: compiled.machineMarkable,
    parts,
    rubricCount: compiled.rubric.length,
  };
}

/** Misconceptions an authored response may reveal. The scan is a phrase check
 *  against the SIGNALS the author declared, and its result is advisory. It is
 *  not a mark, and it does not turn prose into a keyword score. */
export function advisoryMisconceptions(
  bp: AssessmentBlueprint,
  item: OriginalAssessmentItem,
  response: string,
): AdvisoryMisconception[] {
  if (!response.trim()) return [];
  const seen = new Set<string>();
  const hits: AdvisoryMisconception[] = [];
  for (const criterion of item.criteria) {
    if (!criterion.misconceptionId || seen.has(criterion.misconceptionId)) continue;
    if (!(criterion.signals ?? []).some((signal) => containsPhrase(response, signal))) continue;
    const profile = bp.misconceptions.find((belief) => belief.id === criterion.misconceptionId);
    if (!profile) continue;
    seen.add(profile.id);
    hits.push({
      id: profile.id,
      label: profile.label,
      whyWrong: profile.whyWrong,
      feedback: profile.feedback,
      advisory: true,
    });
  }
  return hits;
}

export type ResponseValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string; readonly partId?: string };

/** Refuse a submission the marker cannot read as a RESPONSE. A blank is empty;
 *  a number that is not a number is not a wrong mathematical belief. This is
 *  deliberately separate from marking, so unusable input never becomes a
 *  recorded attempt. */
export function validateAssessmentResponse(
  compiled: CompiledAssessment,
  responses: readonly string[],
  working: readonly string[] = [],
): ResponseValidation {
  if (!compiled.structured) return { ok: true };
  if (responses.length !== compiled.structured.parts.length) {
    return { ok: false, reason: "response_count" };
  }
  for (const [index, part] of compiled.structured.parts.entries()) {
    const given = typeof responses[index] === "string" ? responses[index] : "";
    const shown = typeof working[index] === "string" ? working[index] : "";
    if (part.response === "table") {
      if (!given.trim()) continue;
      let values: unknown;
      try { values = JSON.parse(given); } catch { return { ok: false, reason: "invalid_table", partId: part.id }; }
      if (!Array.isArray(values)) return { ok: false, reason: "invalid_table", partId: part.id };
      if (values.some((value) => typeof value !== "string")) {
        return { ok: false, reason: "invalid_table", partId: part.id };
      }
      continue;
    }
    if (part.response === "graph") {
      if (given.trim() && !parseGraphPoints(given)) return { ok: false, reason: "invalid_graph", partId: part.id };
      continue;
    }
    if (part.response === "plot") {
      if (!given.trim()) continue;
      try { JSON.parse(given); } catch { return { ok: false, reason: "invalid_plot", partId: part.id }; }
      continue;
    }
    if (part.response === "algebra") {
      if (given.trim() && !parsePolynomial(given, part.algebra?.variable ?? "x")) {
        return { ok: false, reason: "invalid_expression", partId: part.id };
      }
      continue;
    }
    if (part.response === "short") {
      continue;
    }
    if (part.response === "readoff") {
      if (given.trim() && !parseNumericInput(given)) return { ok: false, reason: "invalid_number", partId: part.id };
      continue;
    }
    if (given.trim() && parseNumericInput(given, part.unit) === null) {
      return { ok: false, reason: "invalid_number", partId: part.id };
    }
    if (shown.trim() && part.method && parseNumericInput(shown) === null && !part.method.accept.length) {
      return { ok: false, reason: "invalid_working", partId: part.id };
    }
  }
  if (!responses.some((response) => response.trim()) && !working.some((response) => response.trim())) {
    return { ok: false, reason: "empty_response" };
  }
  return { ok: true };
}

/** Mark one machine-markable item. The route uses this and nothing else. */
export function gradeCompiledAssessment(
  compiled: CompiledAssessment,
  responses: readonly string[],
  working: readonly string[] = [],
): StructuredGrade {
  if (!compiled.structured) throw new Error("a prose item has no machine grade");
  return gradeStructuredParts(compiled.structured.parts, [...responses], [...working]);
}

// ── The end-to-end journey fixture ─────────────────────────────────────────

export interface AssessmentJourneyFixture {
  readonly id: string;
  readonly label: string;
  readonly purpose: string;
  readonly notTeacherApproval: true;
  readonly blueprint: AssessmentBlueprint;
  readonly itemIds: readonly string[];
}

/** THE FIXTURE IS TEST DATA, NOT AN APPROVAL. It reuses three authored biology
 *  items so the drill exercises numeric, short-answer and prose paths through
 *  the real route. It is never included in `ASSESSMENT_BLUEPRINTS` and never
 *  appears in the audit as reviewed. */
export const ASSESSMENT_JOURNEY_FIXTURE: AssessmentJourneyFixture = {
  id: "openmind.assessment-journey-fixture/1.0",
  label: "TEST FIXTURE — not a teacher review",
  purpose:
    "Exercises blueprint compilation, serving, submission, marking, partial credit, evidence, mastery and next-step selection on a scratch store. It is not a validated assessment.",
  notTeacherApproval: true,
  blueprint: DIET_DIGESTION_BLUEPRINT,
  itemIds: ["dd-05", "dd-01", "dd-02"],
};

/** The table format is a SECOND fixture blueprint, not a second marker. It
 *  exists so the browser can prove the table UI and one-mark-per-cell path on
 *  the same explicit test door. It remains a fixture, never an approval. */
export const ASSESSMENT_TABLE_FIXTURE: AssessmentJourneyFixture = {
  id: "openmind.assessment-table-fixture/1.0",
  label: "TEST FIXTURE — not a teacher review",
  purpose:
    "Exercises the same compile, serve, submit, mark, evidence and next-step path for a table response, where each blank cell carries one mark. It is test data, not a validated assessment.",
  notTeacherApproval: true,
  blueprint: MATHS_TABLES_BLUEPRINT,
  itemIds: ["mt-01"],
};

export const ASSESSMENT_FIXTURES = [ASSESSMENT_JOURNEY_FIXTURE, ASSESSMENT_TABLE_FIXTURE] as const;

export type FixtureAssessment =
  | { readonly ok: true; readonly fixture: AssessmentJourneyFixture; readonly compiled: CompiledAssessment }
  | { readonly ok: false; readonly reason: string };

export function fixtureAssessmentItem(itemId: string): FixtureAssessment {
  for (const fixture of ASSESSMENT_FIXTURES) {
    if (!fixture.itemIds.includes(itemId)) continue;
    const item = fixture.blueprint.items.find((candidate) => candidate.id === itemId);
    if (!item) continue;
    return {
      ok: true,
      fixture,
      compiled: compileAssessmentItem(fixture.blueprint, item),
    };
  }
  return { ok: false, reason: "unknown_fixture_item" };
}

export function publicFixtureItem(itemId: string): PublicAssessmentItem | null {
  const fixture = fixtureAssessmentItem(itemId);
  if (!fixture.ok) return null;
  const item = fixture.fixture.blueprint.items.find((candidate) => candidate.id === itemId)!;
  const publicItem = publicAssessmentItem(fixture.fixture.blueprint, item, fixture.compiled);
  return {
    ...publicItem,
    fixture: {
      id: fixture.fixture.id,
      label: fixture.fixture.label,
      notTeacherApproval: true,
    },
  };
}

export type ServedAssessment =
  | { readonly ok: true; readonly decision: AssessmentServingDecision; readonly compiled: CompiledAssessment }
  | { readonly ok: false; readonly decision: AssessmentServingDecision; readonly itemId: string };

/** THE DOOR. A blueprint is refused here unless all four clearances hold, before
 *  an item is compiled, so a caller cannot accidentally serve one by asking for
 *  it. The refusal names the review status rather than pretending the item is
 *  missing. The fixture is a separate, explicit door above. */
export function servedAssessmentItem(bp: AssessmentBlueprint, itemId: string): ServedAssessment {
  const decision = assessmentServingDecision(bp);
  if (!decision.ok) return { ok: false, decision, itemId };
  const item = bp.items.find((candidate) => candidate.id === itemId);
  if (!item) {
    return {
      ok: false,
      decision: { ok: false, reviewStatus: bp.reviewStatus, reasons: [`no item ${itemId} in ${bp.id}`] },
      itemId,
    };
  }
  return { ok: true, decision, compiled: compileAssessmentItem(bp, item) };
}

/** The structured items a paper builder may place. Empty in this repository:
 *  no blueprint has all four clearances, whatever its marking scheme can do. */
export function approvedAssessmentItems(): StructuredItem[] {
  const items: StructuredItem[] = [];
  for (const bp of ASSESSMENT_BLUEPRINTS) {
    if (!assessmentServingDecision(bp).ok) continue;
    for (const item of bp.items) {
      const compiled = compileAssessmentItem(bp, item);
      if (compiled.structured) items.push(compiled.structured);
    }
  }
  return items;
}
