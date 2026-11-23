#!/usr/bin/env node
// ── SYNTHETIC SCHOOL-REALITY ACCEPTANCE GATE ───────────────────────────────
//
// Eight evidence-derived scenarios, seven school archetypes. This gate does NOT
// claim a school, teacher or learner was involved. It proves a narrower and
// checkable thing: every authored lesson has a complete delivery path in each
// declared condition — teacher guide, pupil worksheet, separate key, presenter
// routine and a print/offline fallback — and the language claims do not exceed
// what the product actually supports.
//
// The scenario file is the single source. A country label is never used as a
// classroom label: the scenario names the delivery condition, and the same
// condition can occur in any country.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const authored = require("../.verify/lessons/authored/index.js");
const print = require("../.verify/lesson-print.js");
const classroom = require("../.verify/classroom-session.js");
const guideModule = require("../.verify/teacher-guide.js");
const language = require("../.verify/language-profile.js");
const i18n = require("../.verify/i18n.js");
const offline = require("../.verify/offline-assessment.js");

const root = process.cwd();
const file = path.join(root, "docs/country-research/SCHOOL_SCENARIOS.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const lessons = authored.AUTHORED_LESSONS;

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) passed += 1;
  else { failed += 1; console.error(`  ✗ ${label}`); }
}

const ARCHETYPES = [
  "no-student-device",
  "large-public-class",
  "shared-device",
  "rural-offline",
  "multilingual",
  "low-cost-individual-device",
  "displaced-interrupted",
];
const scenarios = data.scenarios ?? [];
console.log(`▸ School-reality scenarios (${scenarios.length} synthetic, ${lessons.length} authored lessons)`);

ok(data.status === "SYNTHETIC_ONLY", "the scenario file is labelled synthetic, not validated");
ok(scenarios.length === 8, `eight scenarios are declared (${scenarios.length})`);
ok(new Set(scenarios.map((s) => s.id)).size === scenarios.length, "scenario ids are unique");
ok(new Set(scenarios.map((s) => s.country)).size === scenarios.length, "each scenario names a distinct country");

const contexts = new Map(classroom.CLASSROOM_CONTEXTS.map((c) => [c.id, c]));
const coveredArchetypes = new Set();
for (const scenario of scenarios) {
  for (const archetype of scenario.archetypes ?? []) coveredArchetypes.add(archetype);
}
for (const archetype of ARCHETYPES) {
  ok(coveredArchetypes.has(archetype), `the archetype ${archetype} has at least one scenario`);
}

let combinations = 0;
let offlineLessons = 0;
for (const scenario of scenarios) {
  const label = scenario.id;
  const context = contexts.get(scenario.context);
  ok(!!context, `${label}: the declared classroom condition exists (${scenario.context})`);
  for (const secondary of scenario.secondaryContexts ?? []) {
    ok(contexts.has(secondary), `${label}: the secondary condition exists (${secondary})`);
  }
  ok((scenario.archetypes ?? []).length > 0 && scenario.archetypes.every((a) => ARCHETYPES.includes(a)),
    `${label}: every named archetype is in the declared list`);
  ok(scenario.printRequired === true && scenario.offlineRequired === true,
    `${label}: print and offline delivery are required, not optional`);
  ok((scenario.evidenceFiles ?? []).every((name) => fs.existsSync(path.join(root, "docs/country-research", name))),
    `${label}: every evidence file exists`);
  ok(scenario.teachingTranslation !== "reviewed",
    `${label}: no reviewed teaching translation is claimed`);

  // Language is a teaching context, not a country inference. The gate checks
  // the five roles are carried, and that an unsupported target language is
  // reported as unsupported rather than silently labelled English.
  const p = {
    id: `scenario-${scenario.id}`,
    country: scenario.country,
    birthYear: null,
    language: scenario.interfaceLanguage,
    teachingLang: scenario.teachingLanguage,
    answerLang: scenario.answerLanguage,
    schoolLang: scenario.schoolLanguage,
    examLang: scenario.examLanguage,
    bilingualTerms: scenario.bilingualTerms === true,
    dataPreference: "low",
    goal: "",
    intent: "",
    subjects: [],
    createdAt: 0,
  };
  const lp = language.languageProfile(p);
  ok(lp.interface === scenario.interfaceLanguage && lp.teaching === scenario.teachingLanguage &&
     lp.answer === scenario.answerLanguage && lp.school === scenario.schoolLanguage && lp.exam === scenario.examLanguage,
    `${label}: all five language roles survive the profile`);
  ok(i18n.LANG_CODES.includes(scenario.interfaceLanguage),
    `${label}: the interface language is actually supported (${scenario.interfaceLanguage})`);
  if (!i18n.LANG_CODES.includes(scenario.targetTeachingLanguage)) {
    ok(scenario.languageSupport.includes("not-supported"),
      `${label}: an unsupported teaching language is declared unsupported (${scenario.targetTeachingLanguage})`);
  }
  if (scenario.examLanguage !== scenario.teachingLanguage) {
    ok(language.teachingDirective(p).includes("examination language"),
      `${label}: the teaching directive names the examination-language constraint`);
  }
  if (scenario.bilingualTerms) {
    ok(lp.bilingualTerms === true, `${label}: bilingual terminology is carried into the language profile`);
  }

  const failures = [];
  let scenarioOffline = 0;
  for (const lesson of lessons) {
    combinations += 1;
    const sheet = print.worksheetFor(lesson, lesson.conceptId);
    const key = print.answerKeyFor(lesson, lesson.conceptId);
    const guide = guideModule.teacherGuideFor(lesson, lesson.conceptId, scenario.context);
    const session = classroom.classroomSession(lesson, lesson.conceptId, scenario.context);

    if (guide.context.id !== scenario.context) failures.push(`${lesson.conceptId}: guide context`);
    if (session.context.id !== scenario.context) failures.push(`${lesson.conceptId}: presenter context`);
    if (!guide.sequence.length || !guide.boardWork.length || !guide.objectives.length) {
      failures.push(`${lesson.conceptId}: teacher guide missing sequence/board/objective`);
    }
    if (guide.groups.length !== 4 || guide.groups.some((g) => !g.task || !g.check)) {
      failures.push(`${lesson.conceptId}: teacher guide missing four temporary groups`);
    }
    if (guide.assessment.length !== lesson.assessment.length) failures.push(`${lesson.conceptId}: guide assessment count`);
    if (guide.assessment.some((a) => "answer" in a || "marking" in a)) {
      failures.push(`${lesson.conceptId}: guide carries an assessment answer or marking copy`);
    }
    if (sheet.assessment.length !== lesson.assessment.length) failures.push(`${lesson.conceptId}: worksheet assessment count`);
    const serialised = JSON.stringify(sheet);
    for (const forbidden of ["modelAnswer", "marking", "accepted", "correctOrder", "pairs", "expectedStdout", "targetId"]) {
      if (serialised.includes(`"${forbidden}"`)) failures.push(`${lesson.conceptId}: worksheet leaks ${forbidden}`);
    }
    if (key.assessment.length !== lesson.assessment.length || key.assessment.some((a) => !a.answer)) {
      failures.push(`${lesson.conceptId}: key is incomplete`);
    }
    if (!session.slides.some((s) => s.kind === "group")) failures.push(`${lesson.conceptId}: no group slide`);
    if (!session.evidenceNote.includes("No learner answers")) failures.push(`${lesson.conceptId}: evidence claim`);
    const offlineItems = offline.offlineAssessmentItems(lesson).length;
    if (offlineItems === 0) failures.push(`${lesson.conceptId}: no deterministic offline assessment`);
    else scenarioOffline += 1;
  }
  ok(failures.length === 0,
    `${label}: all ${lessons.length} lessons have a complete delivery path${failures.length ? ` — first: ${failures[0]}` : ""}`);
  ok(scenarioOffline === lessons.length,
    `${label}: every lesson has deterministic offline assessment (${scenarioOffline}/${lessons.length})`);
  offlineLessons += scenarioOffline;
}

// A scenario must not quietly become a country claim. These strings are the
// claims the directive explicitly forbids until real validation exists.
const serialised = JSON.stringify(data);
for (const forbidden of ["SCHOOL_VALIDATED", "\"reviewed\": true", "representative classroom"]) {
  ok(!serialised.includes(forbidden), `the scenario file does not claim ${forbidden}`);
}

console.log(`  ${combinations} lesson-scenario combinations; ${offlineLessons} deterministic offline lesson-scenario pairs`);
console.log(`\nschool reality: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
console.log("✓ every declared school condition has a complete print/no-device delivery path; language gaps are stated, not hidden.");
