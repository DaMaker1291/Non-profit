// Low-resource delivery gate.
//
// It asserts the claims that make the no-device and shared-device modes real:
// every authored lesson can be printed, its worksheet carries no assessment key,
// a separate teacher key exists, the presenter can run the lesson, and a paper
// mark entered as unobserved group work cannot enter an individual mastery
// projection.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();

const require = createRequire(import.meta.url);
const authored = require("../.verify/lessons/authored/index.js");
const print = require("../.verify/lesson-print.js");
const classroom = require("../.verify/classroom-session.js");
const guideModule = require("../.verify/teacher-guide.js");
const evidence = require("../.verify/evidence.js");
const replay = require("../.verify/replay.js");
const lessonAssessment = require("../.verify/lesson-assessment.js");

let pass = 0;
let fail = 0;
function ok(cond, message) {
  if (cond) pass++;
  else { fail++; console.error("  ✗ FAIL:", message); }
}

const lessons = authored.AUTHORED_LESSONS;
console.log(`▸ Low-resource delivery (${lessons.length} authored lessons)`);
ok(lessons.length >= 135, `all authored lessons are present (${lessons.length})`);

let worksheets = 0;
let keys = 0;
let slides = 0;
const assessmentKinds = new Map();
const structuredForms = new Map();
for (const lesson of lessons) {
  for (const item of lesson.assessment) {
    assessmentKinds.set(item.kind, (assessmentKinds.get(item.kind) ?? 0) + 1);
    for (const part of item.structured?.parts ?? []) {
      const form = part.graph ? "graph" : part.plot ? "plot" : part.readOff ? "read-off" : part.table ? "table" : part.response ?? "number";
      structuredForms.set(form, (structuredForms.get(form) ?? 0) + 1);
    }
  }
}
for (const kind of ["short-answer", "constructed-response", "structured", "code", "gap-fill", "matching", "ordering", "diagram"]) {
  ok((assessmentKinds.get(kind) ?? 0) > 0, `the authored bank exercises the ${kind} paper form (${assessmentKinds.get(kind) ?? 0})`);
}
console.log(`  assessment kinds: ${[...assessmentKinds.entries()].map(([k, n]) => `${k}=${n}`).join(", ")}`);
console.log(`  structured forms: ${[...structuredForms.entries()].map(([k, n]) => `${k}=${n}`).join(", ") || "none"}`);
for (const form of ["graph", "read-off"]) {
  ok((structuredForms.get(form) ?? 0) > 0, `the authored bank exercises the ${form} structured form (${structuredForms.get(form) ?? 0})`);
}
// A graph item and its follow-through read-off are marked by the same engine the
// browser calls; this proves the key actually awards the line and the reading.
const graphLesson = lessons.find((l) => l.conceptId === "scatter-correlation");
const graphItem = graphLesson?.assessment.find((a) => a.id === "a7");
const graphGrade = graphItem
  ? lessonAssessment.gradeStructuredAssessment(graphItem, ["0,40 10,10", "28"])
  : null;
ok(graphGrade?.awarded === 3 && graphGrade?.marks === 3,
  `the authored graph + read-off item marks a correct line and reading 3/3 (${JSON.stringify(graphGrade && { awarded: graphGrade.awarded, marks: graphGrade.marks })})`);
for (const lesson of lessons) {
  const sheet = print.worksheetFor(lesson, lesson.conceptId);
  const key = print.answerKeyFor(lesson, lesson.conceptId);
  worksheets++;
  keys++;
  ok(sheet.conceptId === lesson.conceptId, `${lesson.conceptId}: worksheet keeps the lesson id`);
  ok(sheet.assessment.length === lesson.assessment.length, `${lesson.conceptId}: every assessment item is on the worksheet`);
  ok(sheet.objectives.length > 0 && sheet.explanation.length > 0 && sheet.workedExamples.length > 0,
    `${lesson.conceptId}: worksheet carries objectives, explanation and worked examples`);
  ok(key.assessment.length === lesson.assessment.length, `${lesson.conceptId}: key covers every assessment item`);
  ok(key.assessment.every((a) => typeof a.answer === "string" && a.answer.length > 0),
    `${lesson.conceptId}: every keyed item has a model answer`);

  // THE WORKSHEET MUST NOT CARRY THE KEY. Check the serialised pupil value for
  // the names of every key-bearing field, rather than trusting the renderer.
  const serialised = JSON.stringify(sheet);
  for (const forbidden of ["modelAnswer", "marking", "accepted", "correctOrder", "pairs", "expectedStdout", "targetId"]) {
    ok(!serialised.includes(`"${forbidden}"`), `${lesson.conceptId}: worksheet contains no ${forbidden} field`);
  }

  // THE TEACHER GUIDE IS A RUN SHEET, NOT A SECOND KEY. It must carry the
  // sequence and the teaching notes, and no assessment model answer.
  const guide = guideModule.teacherGuideFor(lesson, lesson.conceptId);
  ok(guide.objectives.length > 0 && guide.sequence.length >= 6 && guide.preparation.length >= 2 && guide.boardWork.length >= 2,
    `${lesson.conceptId}: teacher guide has objectives, preparation, board work and a run of show`);
  ok(guide.groups.length === 4 && guide.groups.every((g) => g.task && g.check) && guide.groupNote.includes("temporary"),
    `${lesson.conceptId}: teacher guide has four temporary groups with authored tasks`);
  ok(guide.assessment.length === lesson.assessment.length && guide.assessmentTotal > 0,
    `${lesson.conceptId}: teacher guide lists every assessment item with its marks`);
  ok(guide.assessment.every((a) => !("answer" in a) && !("marking" in a)) && !JSON.stringify(guide).includes("modelAnswer"),
    `${lesson.conceptId}: teacher guide carries no assessment model answer or marking copy`);
  ok(guide.context.id === "shared-devices" && guide.evidenceNote.includes("No learner answers"),
    `${lesson.conceptId}: guide defaults to a declared classroom condition and claims no learner record`);

  const session = classroom.classroomSession(lesson, lesson.conceptId);
  slides += session.slides.length;
  ok(session.slides.length >= 5, `${lesson.conceptId}: presenter has a real run of slides (${session.slides.length})`);
  ok(session.slides.some((s) => s.kind === "group"), `${lesson.conceptId}: presenter has a group task`);
  ok(session.evidenceNote.includes("No learner answers"), `${lesson.conceptId}: presenter states that it records no learner answers`);
}

// ── Classroom conditions are delivery modes, not labels ────────────────────
// The first presenter assumed one device per group on EVERY run. That is false
// for the no-device classroom this product is meant to serve. The modes below
// must change the group routine and the prompts, while keeping the evidence
// claim unchanged: no mode turns a group answer into individual mastery.
const conditionLesson = lessons[0];
const largeClassGuide = guideModule.teacherGuideFor(conditionLesson, conditionLesson.conceptId, "large-class");
ok(largeClassGuide.context.id === "large-class" && largeClassGuide.sequence.some((s) => s.detail.includes("shoulder partners")),
  "teacher guide follows the selected large-class routine");
const invalidGuide = guideModule.teacherGuideFor(conditionLesson, conditionLesson.conceptId, "not-a-mode");
ok(invalidGuide.context.id === "shared-devices", "an unknown classroom condition falls back to shared devices, not a silent new mode");

const noDevices = classroom.classroomSession(conditionLesson, conditionLesson.conceptId, "no-student-devices");
const noDeviceGroup = noDevices.slides.find((s) => s.kind === "group");
ok(noDevices.context.id === "no-student-devices", "no-device mode is selected explicitly");
ok(noDeviceGroup && !/one device per group|device operator|one shared device/i.test(noDeviceGroup.paragraphs.join(" ")),
  "no-device mode does not tell the class to use one device per group");
ok(noDevices.groupRoutine.some((step) => /exercise book/i.test(step)),
  "no-device mode routes the group task through exercise books");
ok(noDevices.evidenceNote.includes("No learner answers"), "no-device mode still records no learner answers");

const largeClass = classroom.classroomSession(conditionLesson, conditionLesson.conceptId, "large-class");
ok(largeClass.slides.find((s) => s.kind === "group")?.groupPrompt?.includes("shoulder partner"),
  "large-class mode gives a routine that does not require one device per pupil");

const multilingual = classroom.classroomSession(conditionLesson, conditionLesson.conceptId, "multilingual");
ok(multilingual.slides.find((s) => s.kind === "group")?.groupPrompt?.includes("language you understand best"),
  "multilingual mode separates explanation language from the examination term");

const limited = classroom.classroomSession(conditionLesson, conditionLesson.conceptId, "limited-materials");
ok(limited.slides.find((s) => s.kind === "group")?.groupPrompt?.includes("apparatus is missing"),
  "limited-materials mode does not assume the textbook or apparatus exists");

const invalid = classroom.classroomSession(conditionLesson, conditionLesson.conceptId, "not-a-mode");
ok(invalid.context.id === "shared-devices", "an unknown context falls back to the existing shared-device mode");
ok(worksheets === lessons.length, `all ${lessons.length} lessons produce a pupil worksheet`);
ok(keys === lessons.length, `all ${lessons.length} lessons produce a teacher key`);
ok(slides > lessons.length * 5, `presenter material exists for every lesson (${slides} slides)`);

// ── Paper evidence is teacher-entered, and group work is excluded ───────────
const lesson = lessons[0];
const observed = evidence.teacherAnswerEvidence({
  learnerId: "paper-learner",
  at: 1_000,
  subject: lesson.subject,
  conceptId: lesson.conceptId,
  specificationId: null,
  questionId: lesson.assessment[0].id,
  awarded: 2,
  max: 4,
  assessmentVersion: lesson.version,
  rubric: "1 mark method, 1 mark answer",
  teacherAccountId: "acct-teacher",
  teacherName: "Teacher",
  observed: true,
  evidenceQuality: "high",
});
const group = evidence.teacherAnswerEvidence({
  learnerId: "group-learner",
  at: 1_000,
  subject: lesson.subject,
  conceptId: lesson.conceptId,
  specificationId: null,
  questionId: lesson.assessment[0].id,
  awarded: 4,
  max: 4,
  assessmentVersion: lesson.version,
  rubric: "group discussion outcome",
  teacherAccountId: "acct-teacher",
  teacherName: "Teacher",
  observed: false,
  evidenceQuality: "low",
  groupId: "Group 3",
});

ok(evidence.isTeacherReported(observed), "a paper mark reports teacher provenance");
ok(!evidence.isDeviceReported(observed), "a teacher-entered mark is not presented as a device claim");
ok(observed.teacherEntry?.observed === true && observed.teacherEntry?.assessmentVersion === lesson.version,
  "an observed paper mark carries observation and lesson version");
ok(observed.teacherEntry?.rubric === "1 mark method, 1 mark answer", "a paper mark carries the rubric");
ok(observed.teacherEntry?.teacherAccountId === "acct-teacher", "a paper mark carries the teacher identity");
ok(group.teacherEntry?.groupId === "Group 3" && group.teacherEntry?.observed === false,
  "an unobserved group mark carries the group and observation status");

const observedProjection = evidence.projectLearner([observed]);
const groupProjection = evidence.projectLearner([group]);
ok(observedProjection.totals.answers === 1, "observed individual paper evidence enters the learner projection");
ok(groupProjection.totals.answers === 0, "unobserved group paper evidence is excluded from the learner projection");
ok(observedProjection.byConcept[lesson.conceptId]?.measured.asked === 1, "observed paper evidence is counted as measured");
ok((groupProjection.byConcept[lesson.conceptId]?.measured.asked ?? 0) === 0, "group evidence is not counted as measured individual mastery");
ok(evidence.impactSnapshot([group]).current.measured === null,
  "the impact snapshot does not count an unobserved group mark as an individual measurement");
ok(evidence.impactSnapshot([observed]).unmeasured.some((u) => /marked on paper/.test(u)),
  "the impact snapshot discloses that a paper mark was teacher-entered");
ok(replay.replayModel([group], "group-learner").progress[lesson.conceptId] === undefined,
  "a replay also refuses to turn group evidence into individual progress");
ok(replay.replayModel([observed], "paper-learner").progress[lesson.conceptId]?.attempts === 1,
  "a replay reconstructs observed paper evidence");

// The paper key is generated from the same version, never a stale duplicate.
const key = print.answerKeyFor(lesson, lesson.conceptId);
ok(key.version === lesson.version, "the teacher key carries the authored lesson version");

// ── The shared-device cache boundary ──────────────────────────────────────
// A browser profile is not a person. If the service worker cached the key or
// presenter, the next pupil on the machine could open last teacher's answers
// offline. The cache policy is a source rule, so assert the rule itself.
const sw = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8");
ok(sw.includes("/key(?:\\/|$)/") && sw.includes("/^\\/teach"),
  "the service worker excludes answer-bearing key and presenter routes from its cache");
ok(sw.includes("function mayStore") && sw.includes('control.includes("no-store")') && sw.includes('control.includes("private")'),
  "the service worker refuses to cache a response marked private or no-store");

// ── The hand-over rule at source level ─────────────────────────────────────
// A queued answer is unsynchronised evidence. Sign-out may remove packs and
// drafts, but it must not call the queue-drop helper; the browser journey in
// scripts/verify-offline-browser.mjs proves the same rule with two learners.
const client = fs.readFileSync(path.join(process.cwd(), "lib", "client.tsx"), "utf8");
ok(!/clearQueueFor\(/.test(client), "sign-out does not delete a learner's unsynchronised queue");
ok(/markSignedOut\(\)/.test(client) && /isSignedOut\(\)/.test(client),
  "an offline sign-out records a hand-back that the session probe honours");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
