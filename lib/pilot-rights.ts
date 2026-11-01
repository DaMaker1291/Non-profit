// ─────────────────────────────────────────────────────────────────────────────
// WHAT THE PILOT LESSON IS ALLOWED TO CONTAIN.
//
// A pilot lesson is not "clear" because its text sounds original. It is clear
// because the registry says its teaching and figures are OpenMind-authored, its
// curriculum references are link-only, and it embeds no external asset. This
// module is the question the teacher page asks before it says a lesson is
// rights-clear.
// ─────────────────────────────────────────────────────────────────────────────
import { pilotMappingFor } from "./pilot-mappings";
import {
  decideUse,
  sourceRecord,
  type SourceRecord,
  type UseDecision,
} from "./source-registry";

export const PILOT_TEXT_SOURCE_ID = "openmind-authored-pilot-12";
export const PILOT_FIGURE_SOURCE_ID = "openmind-generated-figures";

export interface PilotRights {
  readonly conceptId: string;
  readonly status: "clear" | "blocked";
  readonly teaching: SourceRecord | null;
  readonly figures: SourceRecord | null;
  readonly curriculum: SourceRecord | null;
  readonly curriculumLink: UseDecision;
  readonly externalAssets: readonly string[];
  readonly problems: readonly string[];
  readonly obligations: readonly string[];
}

export function pilotRightsFor(conceptId: string): PilotRights | null {
  const mapping = pilotMappingFor(conceptId);
  if (!mapping) return null;
  const teaching = sourceRecord(PILOT_TEXT_SOURCE_ID);
  const figures = sourceRecord(PILOT_FIGURE_SOURCE_ID);
  const curriculum = sourceRecord(mapping.sourceId);
  const curriculumLink = curriculum
    ? decideUse(curriculum, "link")
    : { status: "blocked" as const, reasons: [`${mapping.sourceId}: no registry record`], obligations: [] };
  const externalAssets: string[] = [];
  const problems: string[] = [];

  if (!teaching || teaching.kind !== "authored") problems.push("teaching source is missing or not authored");
  if (!figures || figures.kind !== "authored") problems.push("figure source is missing or not authored");
  if (!curriculum) problems.push(`curriculum source ${mapping.sourceId} is missing from the registry`);
  if (curriculum && curriculumLink.status === "blocked") problems.push(...curriculumLink.reasons);
  if (teaching) {
    for (const action of ["display", "adapt", "translate", "offline"] as const) {
      const d = decideUse(teaching, action);
      if (d.status === "blocked") problems.push(...d.reasons);
    }
  }
  if (externalAssets.length > 0) problems.push("external assets are not permitted in the pilot without a recorded licence");

  const obligations = [...curriculumLink.obligations];
  if (teaching) obligations.push(...decideUse(teaching, "display").obligations);
  return {
    conceptId,
    status: problems.length === 0 ? "clear" : "blocked",
    teaching,
    figures,
    curriculum,
    curriculumLink,
    externalAssets,
    problems,
    obligations,
  };
}

export function pilotRightsCoverage(): {
  total: number;
  clear: number;
  blocked: number;
  withExternalAssets: number;
} {
  const rows = ["fractions", "decimals", "negatives", "order-ops", "algebra-expand", "linear-equations", "quadratics", "coordinates", "cells", "photosynthesis", "equations-stoich", "electricity-circuits"]
    .map((id) => pilotRightsFor(id))
    .filter((r): r is PilotRights => r !== null);
  return {
    total: rows.length,
    clear: rows.filter((r) => r.status === "clear").length,
    blocked: rows.filter((r) => r.status === "blocked").length,
    withExternalAssets: rows.filter((r) => r.externalAssets.length > 0).length,
  };
}
