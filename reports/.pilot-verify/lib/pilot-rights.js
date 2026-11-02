"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PILOT_FIGURE_SOURCE_ID = exports.PILOT_TEXT_SOURCE_ID = void 0;
exports.pilotRightsFor = pilotRightsFor;
exports.pilotRightsCoverage = pilotRightsCoverage;
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THE PILOT LESSON IS ALLOWED TO CONTAIN.
//
// A pilot lesson is not "clear" because its text sounds original. It is clear
// because the registry says its teaching and figures are OpenMind-authored, its
// curriculum references are link-only, and it embeds no external asset. This
// module is the question the teacher page asks before it says a lesson is
// rights-clear.
// ─────────────────────────────────────────────────────────────────────────────
const pilot_mappings_1 = require("./pilot-mappings");
const source_registry_1 = require("./source-registry");
exports.PILOT_TEXT_SOURCE_ID = "openmind-authored-pilot-12";
exports.PILOT_FIGURE_SOURCE_ID = "openmind-generated-figures";
function pilotRightsFor(conceptId) {
    const mapping = (0, pilot_mappings_1.pilotMappingFor)(conceptId);
    if (!mapping)
        return null;
    const teaching = (0, source_registry_1.sourceRecord)(exports.PILOT_TEXT_SOURCE_ID);
    const figures = (0, source_registry_1.sourceRecord)(exports.PILOT_FIGURE_SOURCE_ID);
    const curriculum = (0, source_registry_1.sourceRecord)(mapping.sourceId);
    const curriculumLink = curriculum
        ? (0, source_registry_1.decideUse)(curriculum, "link")
        : { status: "blocked", reasons: [`${mapping.sourceId}: no registry record`], obligations: [] };
    const externalAssets = [];
    const problems = [];
    if (!teaching || teaching.kind !== "authored")
        problems.push("teaching source is missing or not authored");
    if (!figures || figures.kind !== "authored")
        problems.push("figure source is missing or not authored");
    if (!curriculum)
        problems.push(`curriculum source ${mapping.sourceId} is missing from the registry`);
    if (curriculum && curriculumLink.status === "blocked")
        problems.push(...curriculumLink.reasons);
    if (teaching) {
        for (const action of ["display", "adapt", "translate", "offline"]) {
            const d = (0, source_registry_1.decideUse)(teaching, action);
            if (d.status === "blocked")
                problems.push(...d.reasons);
        }
    }
    if (externalAssets.length > 0)
        problems.push("external assets are not permitted in the pilot without a recorded licence");
    const obligations = [...curriculumLink.obligations];
    if (teaching)
        obligations.push(...(0, source_registry_1.decideUse)(teaching, "display").obligations);
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
function pilotRightsCoverage() {
    const rows = ["fractions", "decimals", "negatives", "order-ops", "algebra-expand", "linear-equations", "quadratics", "coordinates", "cells", "photosynthesis", "equations-stoich", "electricity-circuits"]
        .map((id) => pilotRightsFor(id))
        .filter((r) => r !== null);
    return {
        total: rows.length,
        clear: rows.filter((r) => r.status === "clear").length,
        blocked: rows.filter((r) => r.status === "blocked").length,
        withExternalAssets: rows.filter((r) => r.externalAssets.length > 0).length,
    };
}
