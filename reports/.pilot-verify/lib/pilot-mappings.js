"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CBSE_CLASS_IX_SCIENCE_CELLS = exports.CBSE_CLASS_X_SCIENCE = void 0;
exports.pilotMappings = pilotMappings;
exports.pilotMappingFor = pilotMappingFor;
exports.mappingCoverage = mappingCoverage;
// ─────────────────────────────────────────────────────────────────────────────
// THE PILOT'S CURRICULUM PROVENANCE.
//
// The existing CBSE Class X MATHEMATICS mapping lives in
// lib/curricula/mappings.ts. The science lessons in this pilot did not have one,
// so this file supplies it: four concepts, each under a named unit of the
// published CBSE Class X Science syllabus (086), with the source, the edition and
// an explicit "nobody has reviewed this yet" field.
//
// `verification: "portal"` is deliberate. The official PDF is on the CBSE site,
// but it could not be machine-read in this environment. The headings are the
// published syllabus headings; a subject teacher must still check each one
// against the file before the mapping is raised above provisional. Claiming
// "document" would be a false statement about what was read.
//
// `cells` is included as the one Class 9 prerequisite lesson. Its entry names
// the Class 9 chapter, and the scope says so rather than pretending it is a
// Class 10 topic.
// ─────────────────────────────────────────────────────────────────────────────
const mappings_1 = require("./curricula/mappings");
const source_registry_1 = require("./source-registry");
exports.CBSE_CLASS_X_SCIENCE = {
    title: "Science (Subject Code 086), Class X — syllabus",
    publisher: "Central Board of Secondary Education (India), Academic Unit",
    published: "2025-26 session",
    url: "https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf",
    verification: "portal",
    note: "The unit and chapter headings below follow the published Class X Science " +
        "syllabus. The PDF could not be read programmatically here, so a reviewer " +
        "must confirm each heading against the official file before this mapping is " +
        "raised above provisional. The `cells` entry cites the Class 9 chapter and is " +
        "labelled as a prerequisite, not as Class 10 content.",
};
exports.CBSE_CLASS_IX_SCIENCE_CELLS = {
    ...exports.CBSE_CLASS_X_SCIENCE,
    title: "Science (Subject Code 086), Class IX — syllabus",
    url: "https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf",
    note: "The `cells` lesson is a Class 9 prerequisite for the Class 10 life-processes " +
        "work. Its heading is the Class 9 chapter; the URL is the same official " +
        "Science syllabus page, and the reviewer must confirm the Class IX heading " +
        "against the file before sign-off.",
};
const SCIENCE_ENTRIES = [
    {
        conceptId: "cells",
        sourceId: "cbse-9-science-2025-26",
        subject: "biology",
        source: exports.CBSE_CLASS_IX_SCIENCE_CELLS,
        ref: "The Fundamental Unit of Life",
        statement: "Cells as the basic structural and functional unit of life; plant and animal cell structure; organelles and their functions; cell division is outside this lesson.",
        status: "provisional-unreviewed",
        reviewer: null,
        reviewedAt: null,
        note: "Class 9 prerequisite. The pilot's Class 10 life-processes lessons assume it.",
    },
    {
        conceptId: "photosynthesis",
        sourceId: "cbse-10-science-2025-26",
        subject: "biology",
        source: exports.CBSE_CLASS_X_SCIENCE,
        ref: "Life Processes — Nutrition",
        statement: "Photosynthesis: raw materials, site and basic steps; the balanced equation; limiting factors and the rate of photosynthesis.",
        status: "provisional-unreviewed",
        reviewer: null,
        reviewedAt: null,
    },
    {
        conceptId: "equations-stoich",
        sourceId: "cbse-10-science-2025-26",
        subject: "chemistry",
        source: exports.CBSE_CLASS_X_SCIENCE,
        ref: "Chemical Reactions and Equations",
        statement: "Balanced chemical equations, conservation of mass, state symbols, and the common reaction types named in the syllabus.",
        status: "provisional-unreviewed",
        reviewer: null,
        reviewedAt: null,
    },
    {
        conceptId: "electricity-circuits",
        sourceId: "cbse-10-science-2025-26",
        subject: "physics",
        source: exports.CBSE_CLASS_X_SCIENCE,
        ref: "Electricity",
        statement: "Electric current and potential difference, Ohm's law, resistance, series and parallel circuits, and the heating effect of current.",
        status: "provisional-unreviewed",
        reviewer: null,
        reviewedAt: null,
    },
];
/** The mathematics side reuses the existing, already-published CBSE mapping.
 *  It is not copied here: a second copy would be a second owner of the same
 *  citation. */
function mathsMapping(conceptId) {
    const m = mappings_1.CONCEPT_MAPPINGS.find((x) => x.specId === "in-cbse" && x.subject === "maths");
    const entry = m?.entries.find((e) => e.conceptId === conceptId);
    if (!m || !entry)
        return null;
    return {
        conceptId,
        sourceId: "cbse-10-maths-2025-26",
        subject: "maths",
        source: m.source,
        ref: entry.ref,
        statement: entry.statement,
        status: m.reviewer && m.reviewedAt ? "educator-reviewed" : "provisional-unreviewed",
        reviewer: m.reviewer,
        reviewedAt: m.reviewedAt,
        note: m.notes,
    };
}
/** All 12 pilot mappings, or a thrown error if one is missing. A missing
 *  mapping is a content bug, not an empty state: the caller is the gate or the
 *  teacher surface, and neither should render a lesson with no curriculum
 *  evidence as though it had some. */
function pilotMappings() {
    const rows = [];
    for (const id of [
        "fractions",
        "decimals",
        "negatives",
        "order-ops",
        "algebra-expand",
        "linear-equations",
        "quadratics",
        "coordinates",
        ...SCIENCE_ENTRIES.map((e) => e.conceptId),
    ]) {
        const row = SCIENCE_ENTRIES.find((e) => e.conceptId === id) ?? mathsMapping(id);
        if (!row)
            throw new Error(`pilot concept ${id} has no curriculum mapping`);
        if (!(0, source_registry_1.sourceRecord)(row.sourceId))
            throw new Error(`pilot concept ${id} cites unregistered source ${row.sourceId}`);
        rows.push(row);
    }
    return rows;
}
function pilotMappingFor(conceptId) {
    try {
        return pilotMappings().find((m) => m.conceptId === conceptId) ?? null;
    }
    catch {
        return null;
    }
}
/** The number a teacher can check without trusting a dashboard. */
function mappingCoverage() {
    const rows = pilotMappings();
    return {
        total: rows.length,
        mapped: rows.length,
        reviewed: rows.filter((r) => r.status === "educator-reviewed").length,
    };
}
