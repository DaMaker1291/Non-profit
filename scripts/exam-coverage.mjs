#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// EXAMINATION COVERAGE, MEASURED AGAINST A PUBLISHED SPECIFICATION.
//
// The number this file exists to stop being used as a proxy: 135 concepts. A
// concept catalogue is not a syllabus. An examination specification publishes
// its own reference statements, papers, marks, assessment objectives and tier
// rules, and a course is only covered when each assessable skill is mapped,
// taught, practised and assessed against that document.
//
// THE LADDER, NOT A BINARY. An objective is never "taught" because a lesson file
// exists. The audit records seven separate facts and reports the highest one
// reached:
//
//   mapped → content authored → teaching sequence complete → assessment complete
//   → educator reviewed → learner tested → mastery demonstrated
//
// A paragraph is content, not a sequence. A sequence is not an assessment. An
// authored constructed-response item is not an AQA-style item with marks and a
// command word. No objective is marked reviewed without a named reviewer and a
// date, and no objective is marked learner-tested or mastery-demonstrated without
// evidence that does not exist in this repository.
//
// DATA. Each audit lives in audit/exam-specs/<id>.json. A file is a claim about
// ONE qualification and ONE subject, tied to the official document's URL and
// retrieval date. `inventory.status: "partial"` is the honest state of the
// Number-domain audit; the report prints the scope and never extrapolates it to
// the whole specification.
//
// Run:  npm run exam:coverage
// Writes: audit/exam-coverage.json
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const S = require("../.verify/specifications.js");
const G = require("../.verify/genome.js");
const M = require("../.verify/curricula/mappings.js");
const C = require("../.verify/model-coverage.js");
const A = require("../.verify/lessons/authored/index.js");
const Q = require("../.verify/questions.js");

const DATA_DIR = "audit/exam-specs";
const REPORT_PATH = "audit/exam-coverage.json";
const SUBJECTS = ["maths", "physics", "chemistry", "biology", "computing"];
const CONTENT_STATES = ["complete", "partial", "missing"];
const LESSON_PARTS = [
  "objectives",
  "priorKnowledge",
  "introduction",
  "explanation",
  "representations",
  "workedExamples",
  "misconceptions",
  "guidedPractice",
  "assessment",
  "transfer",
  "retrieval",
];
const STAGES = [
  "unmapped",
  "mapped",
  "content-authored",
  "teaching-sequence-complete",
  "assessment-items",
  "assessment-partial",
  "assessment-complete",
  "educator-reviewed",
  "learner-tested",
  "mastery-demonstrated",
];
const problems = [];
const fail = (msg) => problems.push(msg);
const ok = (condition, msg) => { if (!condition) fail(msg); };
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const exists = (p) => fs.existsSync(p);
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

/** How much of an objective's published assessment requirements are covered.
 *
 *  `assessment` on the ladder means ITEMS EXIST, never that the objective is
 *  fully assessed. One structured item on one operation cannot stand for a
 *  whole objective. The extra states are deliberately separate:
 *
 *    none     — no AQA-style item exists
 *    items    — items exist, but none is mapped to a published requirement
 *    partial  — some requirements are mapped to items, some are not
 *    complete — every listed requirement has an item covering it
 */
function assessmentCoverageOf(objective) {
  const items = objective.assessment?.examStyleItems ?? 0;
  const requirements = objective.assessment?.requirements;
  if (!Array.isArray(requirements) || requirements.length === 0) return items > 0 ? "items" : "none";
  const covered = requirements.filter((r) => r.covered === true).length;
  if (covered === 0) return items > 0 ? "items" : "none";
  return covered === requirements.length ? "complete" : "partial";
}

function stageOf(objective) {
  const ladder = objective.ladder;
  if (ladder.masteryDemonstrated) return "mastery-demonstrated";
  if (ladder.learnerTested) return "learner-tested";
  if (ladder.educatorReviewed) return "educator-reviewed";
  const coverage = assessmentCoverageOf(objective);
  if (coverage === "complete") return "assessment-complete";
  if (coverage === "partial") return "assessment-partial";
  if (coverage === "items") return "assessment-items";
  if (ladder.sequence) return "teaching-sequence-complete";
  if (ladder.content === "complete" || ladder.content === "partial") return "content-authored";
  if (ladder.mapped) return "mapped";
  return "unmapped";
}

if (!fs.existsSync(DATA_DIR)) {
  console.error(`exam-coverage: ${DATA_DIR} does not exist`);
  process.exit(1);
}
const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).sort();
if (files.length === 0) {
  console.error(`exam-coverage: no specification audit in ${DATA_DIR}`);
  process.exit(1);
}

const audits = [];
for (const file of files) {
  const full = path.join(DATA_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (err) {
    fail(`${file}: not valid JSON — ${err.message}`);
    continue;
  }
  audits.push({ file, data });
}

// The product's own per-concept artefacts. A concept having a plan, a sequence,
// a model or browser evidence is a separate fact from an objective being taught.
const coverageRows = new Map(C.coverageRows().map((r) => [r.conceptId, r]));

const summaries = [];
for (const { file, data } of audits) {
  const where = `audit ${file}`;
  ok(isObj(data), `${where}: the audit must be an object`);
  if (!isObj(data)) continue;
  ok(data.schemaVersion === 2, `${where}: unknown schema version`);
  ok(nonEmpty(data.auditId), `${where}: missing auditId`);
  ok(nonEmpty(data.openMindSpecId), `${where}: missing openMindSpecId`);
  ok(SUBJECTS.includes(data.subject), `${where}: subject must be one of ${SUBJECTS.join(", ")}`);

  const spec = S.specById(data.openMindSpecId);
  ok(Boolean(spec), `${where}: openMindSpecId ${data.openMindSpecId} is not a specification`);
  if (!spec) continue;
  ok(Object.keys(spec.coverage).includes(data.subject), `${where}: ${data.openMindSpecId} does not cover ${data.subject}`);

  ok(isObj(data.qualification), `${where}: missing qualification`);
  if (isObj(data.qualification)) {
    ok(nonEmpty(data.qualification.board), `${where}: missing awarding body`);
    ok(nonEmpty(data.qualification.name), `${where}: missing qualification name`);
    ok(nonEmpty(data.qualification.code), `${where}: missing specification code`);
    ok(nonEmpty(data.qualification.specificationVersion), `${where}: missing specification version`);
    ok(Array.isArray(data.qualification.tiers) && data.qualification.tiers.length > 0, `${where}: no tiers`);
  }

  ok(isObj(data.source), `${where}: missing source`);
  if (isObj(data.source)) {
    ok(/^https:\/\//.test(data.source.url ?? ""), `${where}: source URL must be https`);
    ok(nonEmpty(data.source.publisher), `${where}: missing publisher`);
    ok(nonEmpty(data.source.title), `${where}: missing source title`);
    ok(/^\d{4}-\d{2}-\d{2}$/.test(data.source.retrieved ?? ""), `${where}: source needs a YYYY-MM-DD retrieval date`);
  }

  // ── Papers, marks and weightings ─────────────────────────────────────────
  ok(Array.isArray(data.papers) && data.papers.length > 0, `${where}: no papers`);
  if (Array.isArray(data.papers)) {
    const marks = data.papers.reduce((n, p) => n + (isNum(p.marks) ? p.marks : 0), 0);
    const weight = data.papers.reduce((n, p) => n + (isNum(p.weightPercent) ? p.weightPercent : 0), 0);
    ok(marks > 0, `${where}: papers have no marks`);
    ok(Math.abs(weight - 100) <= 0.05, `${where}: paper weights sum to ${weight}%, not 100%`);
    for (const p of data.papers) {
      ok(nonEmpty(p.id) && nonEmpty(p.name), `${where}: a paper is missing its id or name`);
      ok(isNum(p.durationMinutes) && p.durationMinutes > 0, `${where}/${p.id}: missing duration`);
      ok(isNum(p.marks) && p.marks > 0, `${where}/${p.id}: missing marks`);
      ok(["calculator", "non-calculator"].includes(p.calculator), `${where}/${p.id}: calculator rule must be declared`);
    }
  }

  // ── Assessment objectives ────────────────────────────────────────────────
  ok(isObj(data.assessmentObjectives), `${where}: no assessment objectives`);
  if (isObj(data.assessmentObjectives)) {
    for (const tier of data.qualification?.tiers ?? []) {
      const aos = data.assessmentObjectives[tier.id];
      ok(Array.isArray(aos) && aos.length > 0, `${where}/${tier.id}: no assessment objectives`);
      if (Array.isArray(aos)) {
        const sum = aos.reduce((n, ao) => n + (isNum(ao.weightPercent) ? ao.weightPercent : 0), 0);
        ok(Math.abs(sum - 100) <= 0.05, `${where}/${tier.id}: AO weights sum to ${sum}%, not 100%`);
        for (const ao of aos) {
          ok(nonEmpty(ao.id) && nonEmpty(ao.name), `${where}/${tier.id}: an AO is missing its id or name`);
          ok(Array.isArray(ao.range) && ao.range.length === 2, `${where}/${tier.id}/${ao.id}: missing component range`);
          if (Array.isArray(ao.range) && isNum(ao.weightPercent)) {
            ok(ao.range[0] <= ao.weightPercent && ao.weightPercent <= ao.range[1],
              `${where}/${tier.id}/${ao.id}: overall weight is outside its component range`);
          }
        }
      }
    }
  }

  // ── Topic weights ────────────────────────────────────────────────────────
  ok(isObj(data.topicWeightings), `${where}: no topic weightings`);
  if (isObj(data.topicWeightings)) {
    for (const tier of data.qualification?.tiers ?? []) {
      const weights = data.topicWeightings[tier.id];
      ok(isObj(weights), `${where}/${tier.id}: no topic weights`);
      if (isObj(weights)) {
        const sum = Object.values(weights).reduce((n, v) => n + (isNum(v) ? v : 0), 0);
        ok(Math.abs(sum - 100) <= 0.05, `${where}/${tier.id}: topic weights sum to ${sum}%, not 100%`);
      }
    }
  }

  // ── The specification's own reference statements ─────────────────────────
  const refToDomain = new Map();
  ok(Array.isArray(data.domains) && data.domains.length > 0, `${where}: no content domains`);
  if (Array.isArray(data.domains)) {
    for (const domain of data.domains) {
      ok(nonEmpty(domain.id) && nonEmpty(domain.name), `${where}: a domain is missing its id or name`);
      ok(nonEmpty(domain.referencePrefix), `${where}/${domain.id}: missing reference prefix`);
      ok(Number.isInteger(domain.references) && domain.references > 0, `${where}/${domain.id}: reference count must be a positive integer`);
      for (let i = 1; i <= domain.references; i++) {
        const ref = `${domain.referencePrefix}${i}`;
        ok(!refToDomain.has(ref), `${where}: duplicate reference ${ref}`);
        refToDomain.set(ref, domain.id);
      }
    }
  }
  const totalReferences = refToDomain.size;

  // ── The inventory ───────────────────────────────────────────────────────
  const inventory = data.inventory;
  ok(isObj(inventory), `${where}: no inventory`);
  ok(["partial", "complete"].includes(inventory?.status), `${where}: inventory.status must be partial or complete`);
  ok(Array.isArray(inventory?.references) && inventory.references.length > 0, `${where}: inventory names no references`);
  for (const ref of inventory?.references ?? []) {
    ok(refToDomain.has(ref), `${where}: inventory names reference ${ref}, which the specification does not publish`);
  }

  const levels = new Map(spec.levels.map((l) => [l.id, l]));
  const tierIds = (data.qualification?.tiers ?? []).map((t) => t.id);
  const coverageByTier = new Map();
  for (const tier of tierIds) {
    const level = levels.get(tier);
    ok(Boolean(level), `${where}: OpenMind course ${spec.id} has no level ${tier}`);
    if (level) coverageByTier.set(tier, new Set(S.coverageOf({ spec, level }).map((c) => c.id)));
  }

  const objectives = Array.isArray(data.objectives) ? data.objectives : [];
  ok(objectives.length > 0, `${where}: no objectives`);
  const objectiveIds = new Set();
  const seenRefs = new Set();
  const tierGaps = [];
  const conceptIds = new Set();
  const byId = new Map();

  for (const objective of objectives) {
    const at = `${where}/${objective.id ?? "?"}`;
    ok(nonEmpty(objective.id), `${where}: an objective has no id`);
    ok(!objectiveIds.has(objective.id), `${at}: duplicate objective id`);
    objectiveIds.add(objective.id);
    byId.set(objective.id, objective);
    ok(nonEmpty(objective.reference), `${at}: no specification reference`);
    ok(refToDomain.has(objective.reference), `${at}: reference ${objective.reference} is not in the specification`);
    ok(["direct", "split"].includes(objective.derivation), `${at}: derivation must be direct or split`);
    ok(nonEmpty(objective.statement), `${at}: no statement`);
    ok(["both", "foundation", "higher"].includes(objective.tier), `${at}: tier must be both, foundation or higher`);
    if (refToDomain.has(objective.reference)) seenRefs.add(objective.reference);

    ok(Array.isArray(objective.concepts), `${at}: concepts must be an array`);
    const concepts = Array.isArray(objective.concepts) ? objective.concepts : [];
    ok(new Set(concepts).size === concepts.length, `${at}: a concept is listed twice`);
    for (const id of concepts) {
      const concept = G.CONCEPTS_BY_ID[id];
      ok(Boolean(concept), `${at}: unknown concept ${id}`);
      if (!concept) continue;
      ok(concept.subject === data.subject, `${at}: ${id} is ${concept.subject}, not ${data.subject}`);
      ok(S.courseConceptIds(spec).has(id), `${at}: ${id} is not in ${spec.id}'s course`);
      conceptIds.add(id);
    }

    const wantedTiers = objective.tier === "both" ? tierIds : [objective.tier];
    const coverage = {};
    for (const tier of wantedTiers) {
      const set = coverageByTier.get(tier);
      if (!set) continue;
      const present = concepts.filter((id) => set.has(id));
      const absent = concepts.filter((id) => !set.has(id));
      coverage[tier] = { present, absent };
      if (absent.length > 0) {
        // CONTENT COVERAGE AND TIER AVAILABILITY ARE SEPARATE FACTS. A complete
        // authored sequence can exist while the course excludes one of its
        // concepts at a tier; that is a serving gap, not a reason to deny the
        // teaching exists. It is still a release failure: an objective the
        // specification examines at this tier must be reachable by a learner at
        // this tier.
        tierGaps.push({ objective: objective.id, tier, absent });
        fail(`${at}: ${absent.join(", ")} is outside ${tier} coverage, but the objective is required at ${tier}`);
      }
    }

    ok(Array.isArray(objective.prerequisites), `${at}: prerequisites must be an array`);
    for (const prereq of objective.prerequisites ?? []) {
      ok(prereq !== objective.id, `${at}: an objective cannot be its own prerequisite`);
      ok(byId.has(prereq) || objectiveIds.has(prereq), `${at}: prerequisite ${prereq} is not an earlier objective`);
    }

    ok(isObj(objective.ladder), `${at}: no ladder`);
    if (isObj(objective.ladder)) {
      const ladder = objective.ladder;
      ok(typeof ladder.mapped === "boolean", `${at}: ladder.mapped must be true or false`);
      ok(ladder.mapped === (concepts.length > 0), `${at}: ladder.mapped must equal whether a concept is linked`);
      ok(CONTENT_STATES.includes(ladder.content), `${at}: ladder.content must be complete, partial or missing`);
      for (const key of ["sequence", "assessment", "educatorReviewed", "learnerTested", "masteryDemonstrated"]) {
        ok(typeof ladder[key] === "boolean", `${at}: ladder.${key} must be true or false`);
      }
      ok(!ladder.sequence || ladder.content === "complete", `${at}: a complete sequence requires content: complete`);
      ok(!ladder.assessment || ladder.sequence, `${at}: assessment items require a teaching sequence`);
      ok(!ladder.educatorReviewed || ladder.assessment, `${at}: educator reviewed requires assessment complete`);
      ok(!ladder.learnerTested || ladder.educatorReviewed, `${at}: learner tested requires educator review`);
      ok(!ladder.masteryDemonstrated || ladder.learnerTested, `${at}: mastery demonstrated requires learner testing`);
      if (!ladder.mapped) {
        ok(ladder.content === "missing", `${at}: an unmapped objective cannot claim authored content`);
        ok(!ladder.sequence && !ladder.assessment, `${at}: an unmapped objective cannot claim a sequence or assessment items`);
      }
    }

    // A concept lesson is not an objective-complete sequence. The audit must
    // say which authored lessons were inspected, whether all eleven contract
    // parts are present, and whether the bundle covers the WHOLE objective.
    ok(isObj(objective.authoredLesson), `${at}: no authoredLesson record`);
    if (isObj(objective.authoredLesson)) {
      const authored = objective.authoredLesson;
      ok(["full", "partial", "none"].includes(authored.coverage), `${at}: authoredLesson.coverage must be full, partial or none`);
      ok(Array.isArray(authored.concepts), `${at}: authoredLesson.concepts must be an array`);
      ok(Array.isArray(authored.lessons), `${at}: authoredLesson.lessons must be an array`);
      ok(Array.isArray(authored.parts), `${at}: authoredLesson.parts must be an array`);
      ok(new Set(authored.concepts ?? []).size === (authored.concepts ?? []).length, `${at}: authoredLesson concepts repeat`);
      ok(JSON.stringify([...(authored.concepts ?? [])].sort()) === JSON.stringify([...concepts].sort()),
        `${at}: authoredLesson.concepts must equal the objective's concepts`);
      for (const lesson of authored.lessons ?? []) {
        ok(nonEmpty(lesson) && lesson.startsWith("lib/lessons/authored/") && exists(lesson), `${at}: authored lesson ${lesson} does not exist`);
      }
      if ((authored.lessons ?? []).length > 0) {
        const actualParts = new Set();
        for (const conceptId of authored.concepts ?? []) {
          const lesson = A.AUTHORED_BY_CONCEPT[conceptId];
          ok(Boolean(lesson), `${at}: no authored lesson object for concept ${conceptId}`);
          if (!lesson) continue;
          for (const part of LESSON_PARTS) {
            const value = lesson[part];
            const present = part === "priorKnowledge"
              ? isObj(value) && Array.isArray(value.check) && value.check.length > 0
              : part === "introduction"
                ? isObj(value) && nonEmpty(value.hook) && nonEmpty(value.why)
                : Array.isArray(value) && value.length > 0;
            if (present) actualParts.add(part);
          }
        }
        for (const part of LESSON_PARTS) {
          ok((authored.parts ?? []).includes(part), `${at}: the authored lesson bundle is missing declared part ${part}`);
          ok(actualParts.has(part), `${at}: the authored lesson object is missing actual part ${part}`);
        }
      }
      if (authored.coverage === "full") {
        ok((authored.lessons ?? []).length > 0, `${at}: full coverage needs at least one lesson`);
        ok(objective.ladder?.content === "complete", `${at}: full authored coverage requires content: complete`);
        ok(objective.ladder?.sequence === true, `${at}: full authored coverage requires sequence: true`);
        for (const lesson of authored.lessons ?? []) {
          ok((objective.evidence?.sequence ?? []).includes(lesson), `${at}: full coverage must name ${lesson} as sequence evidence`);
        }
      } else if (authored.coverage === "partial") {
        ok((authored.lessons ?? []).length > 0, `${at}: partial coverage needs at least one lesson`);
        ok(objective.ladder?.content === "partial", `${at}: partial authored coverage requires content: partial`);
        ok(objective.ladder?.sequence === false, `${at}: partial authored coverage cannot claim a complete sequence`);
      } else {
        ok((authored.lessons ?? []).length === 0, `${at}: no coverage cannot name lessons`);
        ok(objective.ladder?.content === "missing", `${at}: no authored coverage requires content: missing`);
        ok(objective.ladder?.sequence === false, `${at}: no authored coverage cannot claim a sequence`);
      }
    }

    ok(isObj(objective.evidence), `${at}: no evidence`);
    if (isObj(objective.evidence)) {
      for (const key of ["content", "sequence", "assessment"]) {
        ok(Array.isArray(objective.evidence[key]), `${at}: evidence.${key} must be an array`);
        for (const p of objective.evidence[key] ?? []) {
          ok(nonEmpty(p) && exists(p), `${at}: evidence ${key} → ${p} does not exist`);
        }
      }
      if (objective.ladder?.content !== "missing") {
        ok((objective.evidence.content ?? []).length > 0, `${at}: authored content needs evidence`);
      }
      if (objective.ladder?.sequence) {
        ok((objective.evidence.sequence ?? []).length > 0, `${at}: a complete sequence needs evidence`);
      }
      if (objective.ladder?.assessment) {
        ok((objective.evidence.assessment ?? []).length > 0, `${at}: a complete assessment needs evidence`);
      }
    }

    ok(isObj(objective.assessment), `${at}: no assessment record`);
    if (isObj(objective.assessment)) {
      const assessment = objective.assessment;
      ok(Number.isInteger(assessment.examStyleItems) && assessment.examStyleItems >= 0,
        `${at}: assessment.examStyleItems must be a non-negative integer`);
      ok(typeof assessment.authoredStructured === "boolean", `${at}: assessment.authoredStructured must be true or false`);
      ok((objective.ladder?.assessment ?? false) === (assessment.examStyleItems > 0),
        `${at}: ladder.assessment must mean exactly that at least one exam-style item exists`);
      if (assessment.examStyleItems > 0) {
        ok(Number.isInteger(assessment.marks) && assessment.marks > 0, `${at}: exam-style items need marks`);
        ok(nonEmpty(assessment.commandWord), `${at}: exam-style items need a command word`);
        ok(nonEmpty(assessment.markScheme), `${at}: exam-style items need a mark scheme`);
        // AN ITEM IS NOT COVERAGE. Every objective with an item must list the
        // published requirements it is meant to assess, so "one question" can
        // never be reported as "the objective is assessed".
        ok(Array.isArray(assessment.requirements) && assessment.requirements.length > 0,
          `${at}: exam-style items need a requirements map`);
        const requirementIds = new Set();
        let coveredMarks = 0;
        for (const requirement of assessment.requirements ?? []) {
          const rat = `${at} requirement ${requirement?.id ?? "(missing id)"}`;
          ok(nonEmpty(requirement?.id), `${rat}: missing id`);
          ok(!requirementIds.has(requirement?.id), `${rat}: duplicate id`);
          if (nonEmpty(requirement?.id)) requirementIds.add(requirement.id);
          ok(nonEmpty(requirement?.statement), `${rat}: missing statement`);
          ok(typeof requirement?.covered === "boolean", `${rat}: covered must be true or false`);
          ok(Array.isArray(requirement?.items), `${rat}: items must be an array`);
          ok(["foundation", "higher", "both"].includes(requirement?.tier), `${rat}: tier must be foundation, higher or both`);
          if (requirement?.covered) {
            ok((requirement.items ?? []).length > 0, `${rat}: a covered requirement needs an item`);
            for (const item of requirement.items ?? []) {
              const file = String(item).split("#")[0];
              ok(nonEmpty(item) && exists(file), `${rat}: item ${item} does not exist`);
            }
            ok(nonEmpty(requirement.questionType), `${rat}: a covered requirement needs a question type`);
            ok(requirement.difficulty !== null && requirement.difficulty !== undefined && requirement.difficulty !== "",
              `${rat}: a covered requirement needs a difficulty (a number, or "uncalibrated")`);
            ok(Number.isInteger(requirement.marks) && requirement.marks > 0, `${rat}: a covered requirement needs marks`);
            coveredMarks += requirement.marks ?? 0;
          } else {
            ok((requirement.items ?? []).length === 0, `${rat}: an uncovered requirement cannot name an item`);
            ok(requirement.difficulty === null, `${rat}: an uncovered requirement cannot claim a difficulty`);
            ok(requirement.marks === undefined, `${rat}: an uncovered requirement cannot claim marks`);
          }
        }
        if (assessment.requirements?.every((r) => r.covered)) {
          ok(coveredMarks === assessment.marks,
            `${at}: covered requirement marks (${coveredMarks}) must equal the item total (${assessment.marks})`);
        }
      }
      ok(["none", "items", "partial", "complete"].includes(assessmentCoverageOf(objective)),
        `${at}: assessment coverage is not a known state`);
      if (assessment.examStyleItems === 0) {
        ok(!(assessment.requirements ?? []).some((r) => r.covered),
          `${at}: a covered requirement exists without an exam-style item`);
      }
    }

    ok(isObj(objective.review), `${at}: no review record`);
    ok(["unreviewed", "reviewed"].includes(objective.review?.status), `${at}: review.status must be unreviewed or reviewed`);
    if (objective.ladder?.educatorReviewed) {
      ok(objective.review?.status === "reviewed", `${at}: educator reviewed requires review.status reviewed`);
      ok(nonEmpty(objective.review?.reviewer), `${at}: reviewed without a named reviewer`);
      ok(/^\d{4}-\d{2}-\d{2}$/.test(objective.review?.date ?? ""), `${at}: reviewed without a date`);
    } else {
      ok(objective.review?.status === "unreviewed", `${at}: unreviewed objective carries a review`);
      ok(objective.review?.reviewer === null && objective.review?.date === null, `${at}: unreviewed record carries a reviewer or date`);
    }

    ok(isObj(objective.learner), `${at}: no learner record`);
    ok(["not-tested", "tested"].includes(objective.learner?.status), `${at}: learner.status must be not-tested or tested`);
    if (objective.ladder?.learnerTested) {
      ok(objective.learner?.status === "tested", `${at}: learner tested requires learner.status tested`);
      ok(nonEmpty(objective.learner?.evidence), `${at}: learner tested requires evidence`);
    } else {
      ok(objective.learner?.status === "not-tested", `${at}: not-tested objective carries learner evidence`);
      ok(objective.learner?.evidence === null, `${at}: not-tested record carries learner evidence`);
    }

    ok(isObj(objective.mastery), `${at}: no mastery record`);
    ok(["not-demonstrated", "demonstrated"].includes(objective.mastery?.status), `${at}: mastery.status must be not-demonstrated or demonstrated`);
    if (objective.ladder?.masteryDemonstrated) {
      ok(objective.mastery?.status === "demonstrated", `${at}: mastery demonstrated requires mastery.status demonstrated`);
      ok(nonEmpty(objective.mastery?.evidence), `${at}: mastery demonstrated requires evidence`);
    } else {
      ok(objective.mastery?.status === "not-demonstrated", `${at}: not-demonstrated objective carries mastery evidence`);
      ok(objective.mastery?.evidence === null, `${at}: not-demonstrated record carries mastery evidence`);
    }
  }

  // Prerequisite cycles are a course-design defect, not a reporting detail.
  const state = new Map();
  const visit = (id, stack) => {
    const status = state.get(id) ?? 0;
    if (status === 1) {
      fail(`${where}: prerequisite cycle ${stack.concat(id).join(" → ")}`);
      return;
    }
    if (status === 2) return;
    state.set(id, 1);
    for (const prereq of byId.get(id)?.prerequisites ?? []) {
      if (byId.has(prereq)) visit(prereq, stack.concat(id));
    }
    state.set(id, 2);
  };
  for (const id of byId.keys()) visit(id, []);

  const counted = objectives;
  const count = (fn) => counted.filter(fn).length;
  const contentComplete = count((o) => o.ladder.content === "complete");
  const contentPartial = count((o) => o.ladder.content === "partial");
  const contentMissing = count((o) => o.ladder.content === "missing");
  const mapped = count((o) => o.ladder.mapped);
  const sequenceComplete = count((o) => o.ladder.sequence);
  const assessmentItems = count((o) => assessmentCoverageOf(o) !== "none");
  const assessmentPartial = count((o) => assessmentCoverageOf(o) === "partial");
  const assessmentComplete = count((o) => assessmentCoverageOf(o) === "complete");
  const educatorReviewed = count((o) => o.ladder.educatorReviewed);
  const learnerTested = count((o) => o.ladder.learnerTested);
  const masteryDemonstrated = count((o) => o.ladder.masteryDemonstrated);
  const authoredStructured = count((o) => o.assessment?.authoredStructured);
  const examStyleItems = counted.reduce((n, o) => n + (o.assessment?.examStyleItems ?? 0), 0);
  const fullAuthoredCoverage = count((o) => o.authoredLesson?.coverage === "full");
  const partialAuthoredCoverage = count((o) => o.authoredLesson?.coverage === "partial");
  const noAuthoredCoverage = count((o) => o.authoredLesson?.coverage === "none");
  const lessonConcepts = new Set(counted.flatMap((o) => o.authoredLesson?.concepts ?? []));
  const lessonsWithAllParts = new Set(
    counted.flatMap((o) => (o.authoredLesson?.parts?.length === LESSON_PARTS.length ? o.authoredLesson.lessons : [])),
  );
  // Availability is not demand. A primary-arithmetic concept is now reachable
  // at Higher, but its generator may still cap below the Higher target. Report
  // the ceiling rather than hiding it or calling an easy draw "Higher work".
  const higherLevel = levels.get("higher");
  const higherTarget = higherLevel?.difficulty ?? 0.65;
  const demandByConcept = new Map();
  for (const objective of counted) {
    if (objective.tier !== "both" && objective.tier !== "higher") continue;
    for (const conceptId of objective.concepts) {
      const depth = Q.conceptDepth(conceptId);
      if (depth < higherTarget - 1e-9) demandByConcept.set(conceptId, { depth, target: higherTarget });
    }
  }
  const demandGaps = [...demandByConcept.entries()]
    .sort((a, b) => a[1].depth - b[1].depth)
    .map(([conceptId, v]) => ({ conceptId, ceiling: v.depth, higherTarget: v.target }));

  const stageCounts = Object.fromEntries(STAGES.map((s) => [s, 0]));
  for (const objective of counted) stageCounts[stageOf(objective)] += 1;

  const artefacts = [...conceptIds].sort().map((id) => {
    const row = coverageRows.get(id);
    return {
      conceptId: id,
      lessonFile: row?.lessonFile ?? false,
      teachingSequence: row?.teachingSequence ?? false,
      modality: row?.modality ?? "none",
      interaction: row?.interaction ?? null,
      browserVerified: row?.browserVerified ?? false,
      educatorReviewed: row?.educatorReviewed ?? false,
      learnerTested: row?.learnerTested ?? false,
    };
  });

  const verdict =
    assessmentComplete === 0
      ? "NOT EXAM-READY — no objective's published assessment requirements are all covered"
      : educatorReviewed === 0
        ? "NOT REVIEWED — assessment exists but no educator has signed it"
        : learnerTested === 0
          ? "NOT LEARNER-TESTED — reviewed content but no learner evidence"
          : masteryDemonstrated === 0
            ? "NOT MASTERY-DEMONSTRATED — no learner evidence of transfer"
            : "COMPLETE WITHIN THE INVENTORIED REFERENCES";

  summaries.push({
    auditId: data.auditId,
    file,
    openMindSpecId: spec.id,
    subject: data.subject,
    qualification: data.qualification,
    source: data.source,
    papers: Array.isArray(data.papers) ? data.papers : [],
    totalMarks: (Array.isArray(data.papers) ? data.papers : []).reduce((n, p) => n + (isNum(p.marks) ? p.marks : 0), 0),
    domains: data.domains,
    totalReferences,
    inventory: {
      status: inventory?.status,
      scope: inventory?.scope,
      references: inventory?.references,
      objectives: objectives.length,
      referencesInventoried: seenRefs.size,
      referenceCoveragePercent: pct(seenRefs.size, totalReferences),
    },
    ladder: {
      mapped,
      contentComplete,
      contentPartial,
      contentMissing,
      sequenceComplete,
      assessmentItems,
      assessmentPartial,
      assessmentComplete,
      educatorReviewed,
      learnerTested,
      masteryDemonstrated,
      stages: stageCounts,
    },
    assessment: {
      examStyleItems,
      authoredStructured,
      coverage: {
        none: count((o) => assessmentCoverageOf(o) === "none"),
        items: count((o) => assessmentCoverageOf(o) === "items"),
        partial: assessmentPartial,
        complete: assessmentComplete,
      },
    },
    authoredCoverage: {
      full: fullAuthoredCoverage,
      partial: partialAuthoredCoverage,
      none: noAuthoredCoverage,
      concepts: lessonConcepts.size,
      lessonsWithAllParts: lessonsWithAllParts.size,
    },
    tierGaps,
    higherTarget,
    demandGaps,
    artefacts,
    verdict,
    objectives: counted.map((o) => ({
      id: o.id,
      reference: o.reference,
      tier: o.tier,
      stage: stageOf(o),
      assessmentCoverage: assessmentCoverageOf(o),
      assessmentRequirements: o.assessment?.requirements ?? [],
      content: o.ladder.content,
      sequence: o.ladder.sequence,
      assessment: o.ladder.assessment,
      concepts: o.concepts,
      gap: o.gap,
    })),
  });
}

// ── The catalogue view: 91 labels, 2 mappings, 1 objective audit ────────────
const mappingBySpec = new Map(M.CONCEPT_MAPPINGS.map((m) => [m.specId, m]));
const specs = S.SPECIFICATIONS.map((spec) => {
  const mapping = mappingBySpec.get(spec.id) ?? null;
  const audit = summaries.find((a) => a.openMindSpecId === spec.id) ?? null;
  const conceptCount = S.courseConceptIds(spec).size;
  return {
    id: spec.id,
    name: spec.name,
    country: spec.country,
    board: spec.board,
    subjects: Object.keys(spec.coverage),
    concepts: conceptCount,
    mappedSubject: mapping?.subject ?? null,
    mappingConcepts: mapping?.entries.length ?? 0,
    mappingReviewer: mapping?.reviewer ?? null,
    objectiveAudit: audit?.auditId ?? null,
  };
});

const catalogue = {
  specifications: S.SPECIFICATIONS.length,
  mappingsOnFile: M.CONCEPT_MAPPINGS.length,
  mappedSpecifications: new Set(M.CONCEPT_MAPPINGS.map((m) => m.specId)).size,
  reviewedMappings: M.CONCEPT_MAPPINGS.filter((m) => M.mappingIsReviewed(m)).length,
  objectiveAudits: summaries.length,
  specsWithObjectiveAudit: new Set(summaries.map((a) => a.openMindSpecId)).size,
  totalReferenceStatements: summaries.reduce((n, a) => n + a.totalReferences, 0),
  totalInventoriedReferences: summaries.reduce((n, a) => n + a.inventory.referencesInventoried, 0),
  totalObjectives: summaries.reduce((n, a) => n + a.inventory.objectives, 0),
  assessmentItemsObjectives: summaries.reduce((n, a) => n + a.ladder.assessmentItems, 0),
  assessmentPartialObjectives: summaries.reduce((n, a) => n + a.ladder.assessmentPartial, 0),
  assessmentCompleteObjectives: summaries.reduce((n, a) => n + a.ladder.assessmentComplete, 0),
  reviewedObjectives: summaries.reduce((n, a) => n + a.ladder.educatorReviewed, 0),
  learnerTestedObjectives: summaries.reduce((n, a) => n + a.ladder.learnerTested, 0),
  masteryDemonstratedObjectives: summaries.reduce((n, a) => n + a.ladder.masteryDemonstrated, 0),
  specs,
};

const report = {
  generatedBy: "scripts/exam-coverage.mjs",
  note: "A concept is not an objective. Coverage is reported only for the references an audit actually inventories; a partial inventory is never extrapolated to the whole specification. A lesson file is not a teaching sequence, a teaching sequence is not an assessment, and one assessment item is not complete assessment coverage. The assessment stage separates items existing, some published requirements covered, and all requirements covered.",
  catalogue,
  audits: summaries,
  problems,
};
fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");

// ── Printed report ─────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n);
console.log("");
console.log("▸ EXAM COVERAGE — specification, not genome");
console.log(`  ${pad("courses in catalogue", 32)} ${catalogue.specifications}`);
console.log(`  ${pad("concept mappings on file", 32)} ${catalogue.mappingsOnFile}`);
console.log(`  ${pad("specifications with a mapping", 32)} ${catalogue.mappedSpecifications}`);
console.log(`  ${pad("mappings with a named reviewer", 32)} ${catalogue.reviewedMappings}`);
console.log(`  ${pad("objective-level audits", 32)} ${catalogue.objectiveAudits}`);
console.log(`  ${pad("specifications audited", 32)} ${catalogue.specsWithObjectiveAudit}`);
console.log(`  ${pad("reference statements inventoried", 32)} ${catalogue.totalInventoriedReferences} / ${catalogue.totalReferenceStatements}`);
console.log(`  ${pad("objectives inventoried", 32)} ${catalogue.totalObjectives}`);
console.log(`  ${pad("objectives with assessment items", 32)} ${catalogue.assessmentItemsObjectives}`);
console.log(`  ${pad("objectives assessment-partial", 32)} ${catalogue.assessmentPartialObjectives}`);
console.log(`  ${pad("objectives assessment-complete", 32)} ${catalogue.assessmentCompleteObjectives}`);
console.log(`  ${pad("objectives educator-reviewed", 32)} ${catalogue.reviewedObjectives}`);
console.log(`  ${pad("objectives learner-tested", 32)} ${catalogue.learnerTestedObjectives}`);
console.log(`  ${pad("objectives mastery-demonstrated", 32)} ${catalogue.masteryDemonstratedObjectives}`);
for (const audit of summaries) {
  console.log("");
  console.log(`  ${audit.qualification.board} ${audit.qualification.name} ${audit.qualification.code} · ${audit.openMindSpecId}/${audit.subject}`);
  console.log(`    papers:       ${audit.papers.length} papers, ${audit.totalMarks} marks, ${audit.papers.map((p) => `${p.durationMinutes} min ${p.calculator}`).join("; ")}`);
  console.log(`    domains:      ${audit.domains.map((d) => `${d.name} ${d.references}`).join(", ")} = ${audit.totalReferences} references`);
  console.log(`    inventory:    ${audit.inventory.status} — ${audit.inventory.scope}`);
  console.log(`    references:   ${audit.inventory.referencesInventoried}/${audit.totalReferences} inventoried (${audit.inventory.referenceCoveragePercent}% of the published references)`);
  console.log(`    objectives:   ${audit.inventory.objectives}`);
  console.log(`    ladder:       mapped ${audit.ladder.mapped}; content complete ${audit.ladder.contentComplete}, partial ${audit.ladder.contentPartial}, missing ${audit.ladder.contentMissing}; sequence complete ${audit.ladder.sequenceComplete}; assessment items ${audit.ladder.assessmentItems}, partial ${audit.ladder.assessmentPartial}, complete ${audit.ladder.assessmentComplete}; reviewed ${audit.ladder.educatorReviewed}; learner-tested ${audit.ladder.learnerTested}; mastery ${audit.ladder.masteryDemonstrated}`);
  console.log(`    stages:       ${Object.entries(audit.ladder.stages).map(([s, n]) => `${s} ${n}`).join("; ")}`);
  console.log(`    assessment:   ${audit.assessment.examStyleItems} AQA-style items; ${audit.assessment.authoredStructured} authored structured; coverage none ${audit.assessment.coverage.none}, items ${audit.assessment.coverage.items}, partial ${audit.assessment.coverage.partial}, complete ${audit.assessment.coverage.complete}`);
  console.log(`    authored:     ${audit.authoredCoverage.full} full, ${audit.authoredCoverage.partial} partial, ${audit.authoredCoverage.none} none; ${audit.authoredCoverage.concepts} concepts; ${audit.authoredCoverage.lessonsWithAllParts} lessons with all 11 parts`);
  console.log(`    tier gaps:    ${audit.tierGaps.length}${audit.tierGaps.length ? ` — ${audit.tierGaps.map((g) => `${g.objective}@${g.tier} (${g.absent.join(", ")})`).join("; ")}` : ""}`);
  console.log(`    demand:       ${audit.demandGaps.length} concept(s) below the Higher target ${audit.higherTarget}${audit.demandGaps.length ? ` — ${audit.demandGaps.map((d) => `${d.conceptId} ${d.ceiling.toFixed(2)}`).join(", ")}` : ""}`);
  console.log(`    missing:      ${audit.objectives.filter((o) => o.content === "missing").map((o) => o.id).join(", ") || "(none)"}`);
  console.log(`    sequence:     ${audit.objectives.filter((o) => o.stage === "teaching-sequence-complete").map((o) => o.id).join(", ") || "(none)"}`);
  console.log(`    verdict:      ${audit.verdict}`);
  const withSequence = audit.artefacts.filter((a) => a.teachingSequence).length;
  const withModel = audit.artefacts.filter((a) => a.interaction).length;
  const browser = audit.artefacts.filter((a) => a.browserVerified).length;
  console.log(`    concepts:     ${audit.artefacts.length} linked; ${withSequence} with a sequence; ${withModel} with a model; ${browser} browser-verified`);
}
console.log("");
console.log(`Report → ${REPORT_PATH}`);

if (problems.length > 0) {
  console.log("");
  console.error(`✗ ${problems.length} exam-coverage data problem(s):`);
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}
console.log("✓ the audits are internally consistent; the assessment ladder separates items from requirement coverage, and no partial inventory or partial assessment is reported as complete.");
