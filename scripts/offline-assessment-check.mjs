#!/usr/bin/env node
// ── OFFLINE AUTHORED ASSESSMENT, MARKED BY THE SAME RULES ───────────────────
//
// The offline pack used to carry only generated multiple-choice practice. The
// authored assessment was absent, and the screen honestly said so. This gate
// proves the new scope:
//
//   · every authored lesson contributes exactly the deterministic items;
//   · prose and code are absent;
//   · gap-fill, matching, short-answer and structured parts mark with the same
//     pure functions /api/progress uses;
//   · partial credit is preserved, not collapsed to right/wrong;
//   · the queued event names the authored item and carries its score.
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const authored = require("../.verify/lessons/authored/index.js");
const offline = require("../.verify/offline-assessment.js");

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) passed += 1;
  else { failed += 1; console.error(`  ✗ ${label}`); }
}

const lessons = authored.AUTHORED_LESSONS;
const byId = (id) => lessons.find((lesson) => lesson.conceptId === id);

// ── SELECTION: THE PACK NEVER CLAIMS A FORMAT IT CANNOT MARK ────────────────
let selected = 0;
let proseExcluded = 0;
let codeExcluded = 0;
let unkeyedShortExcluded = 0;
for (const lesson of lessons) {
  const items = offline.offlineAssessmentItems(lesson);
  selected += items.length;
  for (const item of items) {
    ok(!item.kind.startsWith("constructed") && item.kind !== "code",
      `${lesson.conceptId}/${item.id}: a prose or code item was not put in the offline assessment`);
    ok(!!(item.gaps || item.matching || item.ordering || item.diagram || item.structured || item.check?.accepted?.length),
      `${lesson.conceptId}/${item.id}: every selected item has a deterministic key`);
  }
  proseExcluded += lesson.assessment.filter((item) => item.kind === "constructed-response").length;
  codeExcluded += lesson.assessment.filter((item) => item.kind === "code").length;
  unkeyedShortExcluded += lesson.assessment.filter((item) => item.kind === "short-answer" && !item.check?.accepted?.length).length;
}
ok(selected > 0, `authored lessons contribute deterministic offline items (${selected})`);
ok(proseExcluded > 0 && codeExcluded > 0 && unkeyedShortExcluded > 0,
  `prose, code and unkeyed short answers exist and are excluded (${proseExcluded}/${codeExcluded}/${unkeyedShortExcluded})`);

// ── GAP FILL: WHOLE-ANSWER COMPARISON AND PARTIAL CREDIT ────────────────────
const photosynthesis = byId("photosynthesis");
const gapItem = photosynthesis.assessment.find((item) => item.id === "a3");
const gapAnswers = gapItem.gaps.gaps.map((gap) => gap.accepted[0]);
const gapFull = offline.markOfflineAssessment(gapItem, gapAnswers);
ok(gapFull?.awarded === gapItem.marking.length && gapFull?.marks === gapItem.marking.length,
  `photosynthesis/a3 full gap fill earns ${gapItem.marking.length}/${gapItem.marking.length}`);
ok(gapFull?.correct === true, "photosynthesis/a3 full gap fill is correct");
const gapPartialAnswers = [...gapAnswers];
gapPartialAnswers[0] = "";
const gapPartial = offline.markOfflineAssessment(gapItem, gapPartialAnswers);
ok(gapPartial?.awarded === gapItem.marking.length - 1,
  `photosynthesis/a3 one blank keeps the other marks (${gapPartial?.awarded}/${gapPartial?.marks})`);
ok(gapPartial?.correct === false, "photosynthesis/a3 partial credit is not called full marks");
ok(gapPartial?.parts?.[0]?.criteria?.some((criterion) => !criterion.met && /Nothing was entered/i.test(criterion.why)),
  "photosynthesis/a3 names the blank criterion");

// ── MATCHING: EACH PAIR IS ITS OWN MARK ────────────────────────────────────
const matchItem = photosynthesis.assessment.find((item) => item.id === "a4");
const matchAnswers = matchItem.matching.left.map((left) => matchItem.matching.pairs[left.id]);
const matchFull = offline.markOfflineAssessment(matchItem, matchAnswers);
ok(matchFull?.awarded === matchItem.marking.length, `photosynthesis/a4 matching earns ${matchItem.marking.length}/${matchItem.marking.length}`);
const matchWrong = [...matchAnswers];
matchWrong[0] = matchItem.matching.right.find((right) => right.id !== matchAnswers[0])?.id ?? "";
const matchPartial = offline.markOfflineAssessment(matchItem, matchWrong);
ok(matchPartial?.awarded === matchItem.marking.length - 1,
  `photosynthesis/a4 a wrong pair loses one mark (${matchPartial?.awarded}/${matchPartial?.marks})`);

// ── SHORT ANSWER: THE AUTHORITATIVE KEY, NO PROSE SCORE ─────────────────────
const dataCharts = byId("data-charts");
const shortItem = dataCharts.assessment.find((item) => item.check?.accepted?.length);
const shortFull = offline.markOfflineAssessment(shortItem, [shortItem.check.accepted[0]]);
ok(shortFull?.correct === true && shortFull?.awarded === null && shortFull?.marks === null,
  "data-charts short answer is correct but carries no invented partial mark");
const shortWrong = offline.markOfflineAssessment(shortItem, ["\u0000 not an answer \u0000"]);
ok(shortWrong?.correct === false, "data-charts short answer refuses nonsense");

// ── STRUCTURED: THE SAME PART MARKER, INCLUDING A METHOD MARK ──────────────
const circuits = byId("electricity-circuits");
const structured = circuits.assessment.find((item) => item.structured);
const structuredAnswers = structured.structured.parts.map((part) => {
  if (part.response === "short") return (part.short ?? []).map((criterion) => criterion.accept[0] ?? "").join(" ");
  if (part.response === "algebra") return part.algebra?.accepted[0] ?? "";
  if (part.response === "graph" && part.graph) {
    const g = part.graph;
    return `${g.xMin},${g.m * g.xMin + g.c} ${g.xMax},${g.m * g.xMax + g.c}`;
  }
  if (part.response === "plot" && part.plot) {
    return JSON.stringify({ points: part.plot.points.map((point) => [point.x, point.y]), line: true });
  }
  if (part.response === "readoff" && part.readOff) {
    const source = structured.structured.parts.find((candidate) => candidate.id === part.readOff.from);
    return source?.graph ? String(source.graph.m * part.readOff.at + source.graph.c) : "";
  }
  if (part.response === "table" && part.table) {
    const cells = part.table.rows.flatMap((row) => row.cells.filter((cell) => cell.answer !== undefined));
    return JSON.stringify(cells.map((cell) => cell.accepted?.[0] ?? String(cell.answer)));
  }
  return part.accepted?.[0] ?? (part.answer === undefined ? "" : String(part.answer));
});
const working = structured.structured.parts.map((part) => part.method?.accept[0] ?? "");
const structuredFull = offline.markOfflineAssessment(structured, structuredAnswers, working);
ok(structuredFull?.awarded === structuredFull?.marks && (structuredFull?.marks ?? 0) > 0,
  `electricity-circuits/a3 structured assessment earns ${structuredFull?.awarded}/${structuredFull?.marks}`);
ok(structuredFull?.parts?.length === structured.structured.parts.length,
  "electricity-circuits/a3 keeps one result per authored part");

// ── THE EVENT: AUTHORED ITEM ID, PARTIAL SCORE, DEVICE PROVENANCE ──────────
const event = offline.offlineAssessmentEvent(
  "learner-offline",
  { conceptId: "photosynthesis", subject: "biology" },
  gapItem,
  gapPartial,
  1_700_000_000_000,
  "sub_offline_assessment",
);
ok(event.type === "answer_submitted" && event.provenance === "device", "the assessment event is device evidence");
ok(event.questionId === "lesson:photosynthesis:a3", `the event names the authored item (${event.questionId})`);
ok(event.score?.awarded === gapPartial.awarded && event.score?.max === gapPartial.marks,
  `the event carries the partial score (${event.score?.awarded}/${event.score?.max})`);
ok(event.chosen === -1, "the event says this was typed/structured, not a picked option");

console.log(`\noffline authored assessment: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
console.log("✓ deterministic authored formats are packaged and marked offline with the online rule; prose and code are excluded.");
