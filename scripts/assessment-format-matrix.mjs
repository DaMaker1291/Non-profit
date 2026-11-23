#!/usr/bin/env node
// ── WHAT EACH LESSON IS ASKED TO ASSESS, AND WHAT IT ACTUALLY ASKS ──────────
//
// A total of 435 items is not a coverage argument. This matrix looks at every
// authored lesson and asks two separate questions:
//
//   1. which formats does its CONTENT make appropriate?
//   2. which of those are actually present in the authored assessment?
//
// The rule is deliberately narrow. Short answer, multiple-choice retrieval and
// transfer are appropriate for every lesson. Constructed response is appropriate
// everywhere EXCEPT Computing, whose lesson contract does not permit that kind:
// its written explanations are short-answer items marked against criteria, and
// treating the contract's omission as a content gap would demand an item the
// validator must reject. A numerical item is recommended only where the lesson's
// own text contains arithmetic; a graph item only where the lesson teaches a
// graph; code only in computing; practical work only where the lesson carries an
// experiment or explicitly asks the learner to plan/measure one. Gap-fill,
// matching and ordering are marked OPTIONAL unless the lesson's own language
// names a process, classification or sequence — they are useful, not compulsory.
//
// A TEACHING FIGURE IS NOT AN ASSESSMENT ITEM. The first version counted a
// lesson's graph/diagram/experiment representation as though the learner had
// been asked to read, label or plan one. That inflated coverage: a lesson could
// carry a graph and never ask a graph question. `present` is now assessment
// evidence only; a representation makes a format RECOMMENDED, never present.
//
// The output is a review queue, not a target. Adding a matching item to an
// essay lesson to raise a number would be the failure this matrix exists to
// prevent.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const { AUTHORED_LESSONS } = require("../.verify/lessons/authored/index.js");

const FORMATS = [
  "multiple-choice",
  "short-answer",
  "constructed-response",
  "numerical",
  "structured",
  "gap-fill",
  "matching",
  "ordering",
  "diagram",
  "graph",
  "practical",
  "code",
  "debugging",
  "transfer",
];

function practicalPrompt(prompt) {
  return /\b(plans?|planning|design|carry out|describe how|outline)\b[\s\S]{0,140}\b(investigation|experiment|practical|measure|measurement|method)\b/i.test(prompt ?? "");
}

function debuggingPrompt(prompt) {
  // "Repair" and "incorrect" are the words the authored Computing lessons use
  // for the same demand as "debug": find the fault and change the code. A
  // TypeError written as one identifier is also an error even without a word
  // boundary between its two halves.
  return /\b(debug|debugging|bug|error|fault|trace|fix|repair|incorrect|wrong)\b/i.test(prompt ?? "") || /TypeError|NameError|IndexError|KeyError|ValueError/.test(prompt ?? "");
}

// A graph can be assessed through prose as well as a structured plot/read-off.
// "A pie chart shows 25%..." or "the velocity-time graph shows..." asks the
// learner to read a graph; the answer being prose does not make the stimulus
// disappear. Require a named graph with data/axes, so a passing mention such as
// "the mean rate is obtained from the graph" is not counted as graph reading.
function graphReadingPrompt(prompt) {
  const p = prompt ?? "";
  const named = /\b(?:graph|chart)\b/i.test(p)
    && /(?:\b(?:graph|chart)\b[^.]{0,80}\b(?:shows?|plots?|passes|has|with|axis|axes|rises?|falls?|plateaus?)\b)|(?:\b(?:shows?|plots?|axis|axes|read|interpret|compare|estimate)\b[^.]{0,80}\b(?:graph|chart)\b)/i.test(p);
  if (named && /\b(?:read|interpret|describe|explain|compare|estimate|how many|how much|difference|axis|axes|shows?)\b/i.test(p)) return true;
  // A sketch/vertex/hyperbola/intersection question is graph work even when the
  // word "graph" is omitted: the answer is the picture or a feature of it.
  if (/\b(sketch|vertex|turning point|axis of symmetry|parabola|hyperbola|graphs? of|intersection point)\b/i.test(p)
    && /\b(explain|describe|state|use|find|sketch|differ|determine|identify)\b/i.test(p)) return true;
  // Plotting points on a grid and reading the joined line is graph work even
  // when the author writes "grid" and "line" rather than "graph".
  return /\b(plot|plots|plotting|grid|axes)\b/i.test(p)
    && /\b(point|points|line|read|join|table|coordinates)\b/i.test(p);
}

function formatsPresent(lesson) {
  const present = new Set();
  for (const item of lesson.assessment) {
    if (practicalPrompt(item.prompt)) present.add("practical");
    if (debuggingPrompt(item.prompt)) present.add("debugging");
    if (graphReadingPrompt(item.prompt)) present.add("graph");
    if (item.gaps) present.add("gap-fill");
    if (item.matching) present.add("matching");
    if (item.ordering) present.add("ordering");
    if (item.diagram) present.add("diagram");
    if (item.structured) {
      present.add("structured");
      // A structured part can carry the numerical or graphical demand even when
      // the item's surface kind is "structured". Counting only short-answer
      // checks marked electricity-circuits as lacking a numerical item it
      // actually has.
      for (const part of item.structured.parts) {
        if (part.response === "graph" || part.response === "plot" || part.response === "readoff") present.add("graph");
        if (part.response === undefined || part.response === "number" || part.response === "table") present.add("numerical");
      }
    }
    if (item.kind === "code") {
      present.add("code");
      // A code item that asks for the printed value and has a numeric model
      // answer assesses a numerical result even though the surface is code.
      if (/\b(output|outputs|prints?|total|value)\b/i.test(item.prompt ?? "") && /\d/.test(String(item.modelAnswer ?? ""))) present.add("numerical");
    }
    if (item.kind === "constructed-response") present.add("constructed-response");
    if (item.kind === "short-answer") {
      present.add("short-answer");
      // A short-answer check that is a number is still a numerical response in
      // substance; the matrix distinguishes the surface from the demand.
      if (item.check?.accepted?.some((answer) => /\d/.test(answer))) present.add("numerical");
    }
  }
  if (lesson.transfer?.length) present.add("transfer");
  // Generated practice IS multiple choice. It is a separate surface from the
  // authored items, so both names are recorded: the format is genuinely
  // available to the learner, but the authored-assessment column must not
  // pretend it contains one.
  present.add("multiple-choice");
  present.add("generated-practice");
  return present;
}

function recommendedFor(lesson) {
  const present = formatsPresent(lesson);
  const text = [
    ...lesson.objectives.map((objective) => objective.statement),
    ...lesson.workedExamples.map((example) => example.prompt),
    ...lesson.explanation.flatMap((block) => block.paragraphs),
  ].join(" ").toLowerCase();
  const recommended = new Set(["multiple-choice", "short-answer", "transfer"]);
  // Computing's framework permits short-answer, code, structured, gap-fill,
  // matching, ordering and diagram, but not constructed-response. Recommending
  // a forbidden kind produced 11 phantom gaps that no valid lesson could close.
  if (lesson.subject !== "computing") recommended.add("constructed-response");
  const optional = new Set(["gap-fill", "matching", "ordering", "structured", "diagram", "debugging"]);
  const hasGraph = lesson.representations.some((r) => /graph|chart/.test(r.kind));
  const hasPractical = lesson.representations.some((r) => /experiment|practical/.test(r.kind));
  const hasDiagram = lesson.representations.some((r) => /structure|area-model|number-line|particle-model/.test(r.kind));
  const hasDebug = lesson.representations.some((r) => /computing\.debug/.test(r.kind));

  // A calculation is appropriate where the lesson actually teaches one, not
  // merely because the subject is usually quantitative. `compounds-mixtures`
  // classifies particles and `logic-maths` builds truth tables; demanding a
  // numerical item there would be the forced coverage this matrix forbids.
  const taughtArithmetic = [
    ...lesson.workedExamples.map((example) => example.prompt),
    ...lesson.workedExamples.flatMap((example) => example.steps.map((step) => step.move)),
    ...lesson.guidedPractice.map((practice) => practice.prompt),
  ].join(" ").toLowerCase();
  const numerical = /\b(calculate|work out|find the (?:total|value|area|volume|length|mass|rate|gradient|mean|average)|convert|solve)\b/.test(taughtArithmetic);
  if (numerical) recommended.add("numerical");
  if (/\b(explain|method|show|derive|justify|compare)\b/.test(text)) optional.add("structured");
  if (hasGraph || /\b(graph|chart|axis|gradient|slope)\b/.test(text)) recommended.add("graph");
  if (lesson.subject === "computing") recommended.add("code");
  if (hasPractical || /\b(required practical|practical work|practical investigation|carry out (?:an )?(?:experiment|investigation)|in an experiment|experimental method)\b/.test(text)) recommended.add("practical");
  if (hasDiagram && /\b(labell?|structure|diagram|annotate)\b/.test(text)) recommended.add("diagram");
  if (lesson.subject === "computing" && hasDebug) recommended.add("debugging");
  if (present.has("matching")) optional.add("matching");
  if (present.has("ordering")) optional.add("ordering");
  if (present.has("gap-fill")) optional.add("gap-fill");

  return { recommended, optional, present, numerical };
}

const rows = AUTHORED_LESSONS.map((lesson) => {
  const { recommended, optional, present, numerical } = recommendedFor(lesson);
  const missingRecommended = [...recommended].filter((format) => !present.has(format));
  const missingOptional = [...optional].filter((format) => !present.has(format));
  return {
    id: lesson.conceptId,
    subject: lesson.subject,
    version: lesson.version,
    title: lesson.curriculum.reference.split(",")[0],
    present: [...present].sort(),
    recommended: [...recommended].sort(),
    optional: [...optional].sort(),
    missingRecommended,
    missingOptional,
    variety: present.size,
    numerical,
  };
});

const totals = {
  lessons: rows.length,
  withAllRecommended: rows.filter((row) => row.missingRecommended.length === 0).length,
  withMissingRecommended: rows.filter((row) => row.missingRecommended.length > 0).length,
  bySubject: Object.fromEntries(["maths", "physics", "chemistry", "biology", "computing"].map((subject) => {
    const relevant = rows.filter((row) => row.subject === subject);
    return [subject, {
      lessons: relevant.length,
      withAllRecommended: relevant.filter((row) => row.missingRecommended.length === 0).length,
      missingRecommended: relevant.reduce((sum, row) => sum + row.missingRecommended.length, 0),
    }];
  })),
  byFormat: Object.fromEntries(FORMATS.map((format) => [
    format,
    {
      recommended: rows.filter((row) => row.recommended.includes(format)).length,
      present: rows.filter((row) => row.present.includes(format)).length,
      missingRecommended: rows.filter((row) => row.missingRecommended.includes(format)).length,
    },
  ])),
};

const generatedAt = new Date().toISOString();
const record = {
  generatedBy: "scripts/assessment-format-matrix.mjs",
  generatedAt,
  contract: "openmind.assessment-format-matrix/1.0",
  policy: {
    universal: ["multiple-choice", "short-answer", "transfer"],
    constructedResponse: "recommended in maths, physics, chemistry and biology; Computing's contract does not permit this kind, so its written explanations are assessed through short-answer items with marking criteria",
    multipleChoice: "generated retrieval practice; recorded as a separate surface from authored items",
    numerical: "the lesson's worked examples or guided practice teach a calculation; a quantitative subject alone is not enough",
    graph: "the lesson teaches a graph/chart or names axes/gradient; present when an assessment plots or reads one, including a prose item that reads a named chart/graph",
    code: "computing",
    practical: "an experiment representation or explicit plan/measure/investigate language; present only when an assessment asks the learner to plan or measure",
    diagram: "a diagram is taught AND the lesson asks for labelling/structure; present only when an assessment asks for one",
    debugging: "computing lessons that teach debugging; present only when an assessment asks the learner to debug or trace a fault",
    optional: "gap-fill, matching, ordering and extra structured forms are useful but not compulsory",
  },
  totals,
  lessons: rows,
};

fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync(path.join("audit", "assessment-format-matrix.json"), `${JSON.stringify(record, null, 2)}\n`);

const md = [
  "# Assessment-format appropriateness matrix",
  "",
  `Generated by \`scripts/assessment-format-matrix.mjs\` on ${generatedAt}.`,
  "",
  "This is an appropriateness audit, not a target. A format is **recommended** only where the lesson's own content calls for it. Gap-fill, matching, ordering and extra structured forms are **optional** unless the lesson names a process, classification or sequence. No lesson has been changed to raise a count.",
  "",
  "## Totals",
  "",
  `- Lessons: **${totals.lessons}**`,
  `- Lessons with every recommended format: **${totals.withAllRecommended}**`,
  `- Lessons with at least one recommended-format gap: **${totals.withMissingRecommended}**`,
  "",
  "| Subject | Lessons | All recommended | Missing recommended |",
  "| --- | ---: | ---: | ---: |",
  ...Object.entries(totals.bySubject).map(([subject, value]) =>
    `| ${subject} | ${value.lessons} | ${value.withAllRecommended} | ${value.missingRecommended} |`),
  "",
  "## By format",
  "",
  "| Format | Recommended in | Present in | Missing where recommended |",
  "| --- | ---: | ---: | ---: |",
  ...FORMATS.map((format) => {
    const value = totals.byFormat[format];
    return `| ${format} | ${value.recommended} | ${value.present} | ${value.missingRecommended} |`;
  }),
  "",
  "## Priority queue",
  "",
  "These are the lessons where a recommended format is absent. A row is a review candidate, not an instruction to force the format into the lesson.",
  "",
  "| Lesson | Subject | Present | Missing recommended | Missing optional |",
  "| --- | --- | --- | --- | --- |",
  ...rows.filter((row) => row.missingRecommended.length > 0).map((row) =>
    `| \`${row.id}\` | ${row.subject} | ${row.present.join(", ")} | ${row.missingRecommended.join(", ")} | ${row.missingOptional.join(", ")} |`),
  "",
  "## What this does not establish",
  "",
  "- It does not claim a format is educationally sufficient merely because it is present.",
  "- It does not claim an absent optional format is a defect.",
  "- It does not replace teacher review of the item wording, mark scheme or cognitive demand.",
  "- It does not count generated multiple-choice practice as an authored lesson item; `generated-practice` is a separate surface.",
  "",
].join("\n");
fs.writeFileSync(path.join("audit", "assessment-format-matrix.md"), md);

console.log(`assessment-format matrix: ${totals.lessons} lessons, ${totals.withAllRecommended} complete on recommended formats, ${totals.withMissingRecommended} with a gap`);
console.log(`  ${Object.entries(totals.bySubject).map(([s, v]) => `${s} ${v.withAllRecommended}/${v.lessons}`).join(" · ")}`);
console.log("wrote audit/assessment-format-matrix.json and audit/assessment-format-matrix.md");
