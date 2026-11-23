#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// AUTHORED-LESSON COVERAGE MATRIX.
//
// The useful question is not "how many lessons exist?" but "which teaching
// methods and question formats does each lesson actually contain, and how far
// does each one travel?" A format can be:
//
//   IMPLEMENTED   the contract, renderer and (where applicable) marker exist;
//   INTEGRATED    at least one authored lesson contains it;
//   SERVER-MARKED a submission reaches /api/progress and is recorded as evidence;
//   BROWSER-VERIFIED a real browser exercised the visible control and the
//                    result was asserted.
//
// Those are different facts. A code lab can be browser-marked and not
// server-marked; a constructed response can render and never be machine-marked;
// the `diagram` union member can exist without a renderer or an authored item.
//
// This script reads every authored lesson and the plan records. It does NOT
// invent a quality score, and it does not turn "rendered" into "verified" or
// "self-marked" into "server-marked".
//
// Run: npm run matrix:lessons
// Writes: reports/lesson-quality/coverage-matrix.json
//         reports/lesson-quality/coverage-matrix.md
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const authored = require("../.verify/lessons/authored/index.js");
const plans = require("../.verify/lesson-plans.js");
const lessons = authored.AUTHORED_LESSONS;
if (lessons.length === 0) {
  console.error("coverage matrix: no authored lessons found");
  process.exit(1);
}
const lessonCount = lessons.length;

const browserRecord = (() => {
  try {
    return JSON.parse(fs.readFileSync("audit/lesson-browser.json", "utf8"));
  } catch {
    return null;
  }
})();
const formatsBrowserRecord = (() => {
  try {
    return JSON.parse(fs.readFileSync("audit/lesson-formats-browser.json", "utf8"));
  } catch {
    return null;
  }
})();
const codeBrowserRecord = (() => {
  try {
    return JSON.parse(fs.readFileSync("audit/code-lab-browser.json", "utf8"));
  } catch {
    return null;
  }
})();

// Evidence is deliberately named here rather than inferred from a green
// number. A browser submission list is a fact about the walk that ran it.
const BROWSER_SHORT = new Set([
  "probability-basics",
  "ratio",
  "proportion",
  "sequences",
  "circulation",
  "ecosystems",
  "evolution",
  "genetics",
  "hormones",
  "immune-health",
  "nervous-system",
  "acids-bases",
  "analysis-tests",
  "covalent-bonding",
  "electrolysis",
  "ionic-bonding",
  "metallic-bonding",
  "moles-calcs",
  "organic-intro",
  "rates-reaction",
  "equilibria",
  // Batch 53 — completing-square submits a2 through the visible form. The
  // browser walk also measures its planned marked-corner figure, but the
  // short-answer submission is what this set records.
  "completing-square",
]);
const BROWSER_CODE = new Set([
  "ai-basics", "algorithms-search", "algorithms-sort", "binary-data",
  "complexity", "conditionals", "cybersecurity", "databases-sql",
  "dictionaries", "functions-code", "lists-arrays", "loops", "networks",
  "recursion", "statistics-data", "variables", "web-stack", "what-is-code",
]);
const BROWSER_STRUCTURED = new Set(["scatter-correlation", "electricity-circuits"]);
const BROWSER_GAP = new Set(["photosynthesis"]);
const BROWSER_MATCHING = new Set(["photosynthesis", "what-is-code"]);
const BROWSER_ORDERING = new Set(["what-is-code"]);
const BROWSER_DIAGRAM = new Set(["fractions", "electricity-circuits"]);
const PROBABILITY = new Set(["probability-basics", "tree-diagrams"]);
const SIMULATION = new Set(["probability-basics"]);

const METHOD_DEFS = [
  {
    id: "objective",
    label: "Explicit objective",
    test: (l) => l.objectives.length > 0,
    browser: "all authored pages render the objective card",
  },
  {
    id: "introduction",
    label: "Narrative hook and rationale",
    test: (l) => Boolean(l.introduction.hook && l.introduction.why),
    browser: "all authored pages render the introduction",
  },
  {
    id: "prior-check",
    label: "Prerequisite activation check",
    test: (l) => l.priorKnowledge.check.length > 0,
    browser: "all authored pages render the check disclosure",
  },
  {
    id: "explanation",
    label: "Written explanation",
    test: (l) => l.explanation.length > 0,
    browser: "all authored pages render the explanation sections",
  },
  {
    id: "representation",
    label: "Subject-specific representation block",
    test: (l) => l.representations.length > 0,
    browser: "all authored pages render at least one representation",
  },
  {
    id: "worked-example",
    label: "Worked example with reasons",
    test: (l) => l.workedExamples.length > 0,
    browser: "all authored pages render the authored worked examples",
  },
  {
    id: "faded-worked-example",
    label: "Faded worked example (we do)",
    test: (_l, plan) => Boolean(plan),
    browser: "lesson-walk presses “Show the first step” on the 21 figured pilot lessons",
  },
  {
    id: "misconception-contrast",
    label: "Misconception + correction + contrast",
    test: (l) => l.misconceptions.some((m) => m.correction && m.contrast?.wrong && m.contrast?.right),
    browser: "all authored pages render the misconception section",
  },
  {
    id: "guided-practice",
    label: "Guided practice with hints",
    test: (l) => l.guidedPractice.length > 0,
    browser: "all authored pages render at least one guided item and its hint",
  },
  {
    id: "independent-assessment",
    label: "Independent assessment",
    test: (l) => l.assessment.length > 0,
    browser: "all authored pages render the assessment block",
  },
  {
    id: "transfer",
    label: "Transfer challenge",
    test: (l) => l.transfer.length > 0,
    browser: "all authored pages render the transfer section",
  },
  {
    id: "spaced-retrieval",
    label: "Spaced retrieval",
    test: (l) => l.retrieval.length > 0,
    browser: "all authored pages render the retrieval section",
  },
  {
    id: "retrieval-all-intervals",
    label: "Retrieval at next-day, week-later and month-later",
    test: (l) => new Set(l.retrieval.map((r) => r.when)).size === 3,
    browser: "the retrieval stamp is rendered; the interval content is a module check",
  },
  {
    id: "summary",
    label: "Lesson summary",
    test: (l) => l.summary.length > 0,
    browser: "all authored pages render the summary",
  },
  {
    id: "accessibility",
    label: "Accessibility alternatives",
    test: (l) => l.accessibility.length > 0,
    browser: "the alternatives are populated; no screen-reader session was run",
  },
  {
    id: "drawn-figure",
    label: "Authored block figure",
    test: (l) => l.representations.some((b) => b.figure),
    browser: "lesson-walk measures the ratio bar, probability Venn/tree and scatter figures",
  },
  {
    id: "interactive-model",
    label: "Interactive fraction model",
    test: (_l, plan) => plan?.interactive === "fraction-model",
    browser: "not browser-verified: the component has no interaction test in the walk",
  },
  {
    id: "interactive-probability",
    label: "Interactive probability model",
    test: (l) => PROBABILITY.has(l.conceptId),
    browser: "lesson-walk operates the Venn, tree and simulation controls",
  },
];

function lessonRow(lesson) {
  const plan = plans.planFor(lesson.conceptId, "en") ?? null;
  const shortKeyedItems = lesson.assessment.filter(
    (a) => a.kind === "short-answer" && a.check?.accepted?.length,
  ).length;
  const shortUnkeyedItems = lesson.assessment.filter(
    (a) => a.kind === "short-answer" && !a.check?.accepted?.length,
  ).length;
  const constructedItems = lesson.assessment.filter((a) => a.kind === "constructed-response").length;
  const structuredItems = lesson.assessment.filter((a) => Boolean(a.structured)).length;
  const structuredParts = lesson.assessment.flatMap((a) => a.structured?.parts ?? []).length;
  const codeItems = lesson.assessment.filter((a) => a.kind === "code").length;
  const diagramItems = lesson.assessment.filter((a) => a.kind === "diagram").length;
  const gapFillItems = lesson.assessment.filter((a) => Boolean(a.gaps)).length;
  const matchingItems = lesson.assessment.filter((a) => Boolean(a.matching)).length;
  const orderingItems = lesson.assessment.filter((a) => Boolean(a.ordering)).length;
  const figures = lesson.representations.filter((b) => b.figure).length;
  const hasProb = PROBABILITY.has(lesson.conceptId);
  const hasSim = SIMULATION.has(lesson.conceptId);

  const methods = Object.fromEntries(METHOD_DEFS.map((def) => [def.id, def.test(lesson, plan)]));
  const formats = {
    shortKeyed: shortKeyedItems > 0,
    shortUnkeyed: shortUnkeyedItems > 0,
    constructed: constructedItems > 0,
    structured: structuredItems > 0,
    code: codeItems > 0,
    diagram: diagramItems > 0,
    gapFill: gapFillItems > 0,
    matching: matchingItems > 0,
    ordering: orderingItems > 0,
    venn: lesson.conceptId === "probability-basics",
    tree: hasProb,
    simulation: hasSim,
  };
  const formatCodes = [
    formats.shortKeyed ? "S" : null,
    formats.shortUnkeyed ? "s" : null,
    formats.constructed ? "C" : null,
    formats.structured ? "X" : null,
    formats.code ? "K" : null,
    formats.diagram ? "D" : null,
    formats.gapFill ? "F" : null,
    formats.matching ? "H" : null,
    formats.ordering ? "O" : null,
    formats.venn ? "V" : null,
    formats.tree ? "T" : null,
    formats.simulation ? "M" : null,
  ].filter(Boolean);

  const serverCodes = [
    formats.shortKeyed ? "S" : null,
    formats.structured ? "X" : null,
    formats.venn ? "V" : null,
    formats.tree ? "T" : null,
    formats.gapFill ? "F" : null,
    formats.matching ? "H" : null,
    formats.ordering ? "O" : null,
    formats.diagram ? "D" : null,
  ].filter(Boolean);

  const browserCodes = ["page"];
  if (BROWSER_SHORT.has(lesson.conceptId)) browserCodes.push("S");
  if (BROWSER_STRUCTURED.has(lesson.conceptId)) browserCodes.push("X");
  if (BROWSER_CODE.has(lesson.conceptId)) browserCodes.push("K");
  if (BROWSER_GAP.has(lesson.conceptId)) browserCodes.push("F");
  if (BROWSER_MATCHING.has(lesson.conceptId)) browserCodes.push("H");
  if (BROWSER_ORDERING.has(lesson.conceptId)) browserCodes.push("O");
  if (BROWSER_DIAGRAM.has(lesson.conceptId)) browserCodes.push("D");
  if (lesson.conceptId === "probability-basics") browserCodes.push("V", "T", "M");
  if (lesson.conceptId === "tree-diagrams") browserCodes.push("T");

  return {
    conceptId: lesson.conceptId,
    subject: lesson.subject,
    status: lesson.declaredStatus,
    planProvenance: plan?.provenance ?? "pilot",
    planReview: plan?.review ?? null,
    methods,
    methodCount: Object.values(methods).filter(Boolean).length,
    formats,
    formatCodes,
    figureBlocks: figures,
    assessmentItems: lesson.assessment.length,
    itemCounts: {
      shortKeyed: shortKeyedItems,
      shortUnkeyed: shortUnkeyedItems,
      constructed: constructedItems,
      structured: structuredItems,
      structuredParts,
      code: codeItems,
      diagram: diagramItems,
      gapFill: gapFillItems,
      matching: matchingItems,
      ordering: orderingItems,
      venn: formats.venn ? 1 : 0,
      tree: formats.tree ? 1 : 0,
      simulation: hasSim ? 1 : 0,
    },
    serverCodes,
    serverMarked: serverCodes.length > 0,
    browserCodes,
  };
}

const rows = lessons.map(lessonRow).sort((a, b) =>
  a.subject.localeCompare(b.subject) || a.conceptId.localeCompare(b.conceptId),
);

const lessonsWith = (predicate) => rows.filter(predicate).length;
const itemsFor = (key) => rows.reduce((n, row) => n + row.itemCounts[key], 0);
const totalAssessmentItems = rows.reduce((n, row) => n + row.assessmentItems, 0);
const keyedShortItems = itemsFor("shortKeyed");
const unkeyedShortItems = itemsFor("shortUnkeyed");
const constructedItems = itemsFor("constructed");
const structuredItems = itemsFor("structured");
const codeItems = itemsFor("code");
const diagramItems = itemsFor("diagram");
const gapFillItems = itemsFor("gapFill");
const matchingItems = itemsFor("matching");
const orderingItems = itemsFor("ordering");
const serverMarkedItems = keyedShortItems + structuredItems + gapFillItems + matchingItems + orderingItems + diagramItems;
const serverMarkedLessons = lessonsWith((row) => row.serverMarked);
const noServerLessons = rows.filter((row) => !row.serverMarked).map((row) => row.conceptId);
const unkeyedLessons = rows.filter((row) => row.formats.shortUnkeyed).map((row) => row.conceptId);
const allIntervals = lessonsWith((row) => row.methods["retrieval-all-intervals"]);
const figureLessons = lessonsWith((row) => row.methods["drawn-figure"]);
const figureBlocks = rows.reduce((n, row) => n + row.figureBlocks, 0);
const serverShare = totalAssessmentItems
  ? `${serverMarkedItems}/${totalAssessmentItems} (${((serverMarkedItems / totalAssessmentItems) * 100).toFixed(1)}%)`
  : "0/0";

const formatRows = [
  {
    id: "short-keyed",
    label: "Short answer — deterministic key",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.shortKeyed), items: keyedShortItems },
    serverMarked: { lessons: lessonsWith((r) => r.formats.shortKeyed), items: keyedShortItems },
    browserVerified: {
      status: "yes",
      lessons: BROWSER_SHORT.size,
      detail: "visible submissions in 21 lessons",
      evidence: "scripts/lesson-walk.mjs",
    },
  },
  {
    id: "short-unkeyed",
    label: "Short answer — no key (self-marked)",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.shortUnkeyed), items: unkeyedShortItems },
    serverMarked: { lessons: 0, items: 0 },
    browserVerified: {
      status: "render-only",
      lessons: lessonsWith((r) => r.formats.shortUnkeyed),
      detail: "the authored-contract loop paints the item; no submission is made",
      evidence: "scripts/lesson-walk.mjs",
    },
  },
  {
    id: "constructed",
    label: "Constructed response — self-marked against criteria",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.constructed), items: constructedItems },
    serverMarked: { lessons: 0, items: 0 },
    browserVerified: {
      status: "render-only",
      lessons: lessonsWith((r) => r.formats.constructed),
      detail: "the authored-contract loop paints the item; the one unscored reflection is labelled",
      evidence: "scripts/lesson-walk.mjs",
    },
  },
  {
    id: "structured-number",
    label: "Structured response — numeric parts",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.structured), items: structuredItems, parts: itemsFor("structuredParts") },
    serverMarked: { lessons: lessonsWith((r) => r.formats.structured), items: structuredItems },
    browserVerified: {
      status: "yes",
      lessons: BROWSER_STRUCTURED.size,
      detail: "scatter: 2/4 then 4/4; electricity: three method + three answer marks reach 6/6 in the browser",
      evidence: "scripts/maths-batch-live-check.mjs + scripts/lesson-formats-browser-check.mjs",
    },
  },
  {
    id: "structured-short",
    label: "Structured response — short criteria",
    implemented: "yes",
    integrated: { lessons: 0, items: 0 },
    serverMarked: { lessons: 0, items: 0 },
    browserVerified: { status: "no", lessons: 0, detail: "no authored item", evidence: "lib/structured-items.ts" },
  },
  {
    id: "structured-algebra",
    label: "Structured response — algebra",
    implemented: "yes",
    integrated: { lessons: 0, items: 0 },
    serverMarked: { lessons: 0, items: 0 },
    browserVerified: { status: "no", lessons: 0, detail: "no authored item", evidence: "lib/structured-items.ts" },
  },
  {
    id: "structured-other",
    label: "Structured response — graph, plot, read-off, table",
    implemented: "elsewhere",
    integrated: { lessons: 0, items: 0 },
    serverMarked: { lessons: 0, items: 0 },
    browserVerified: {
      status: "no",
      lessons: 0,
      detail: "implemented in the assessment app, refused by lib/lesson-verify.ts for authored lessons",
      evidence: "lib/structured-items.ts + app/assessment",
    },
  },
  {
    id: "code",
    label: "Code lab — browser-run tests",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.code), items: codeItems },
    serverMarked: { lessons: 0, items: 0 },
    browserVerified: {
      status: "yes",
      lessons: BROWSER_CODE.size,
      detail: "every authored code lab loads and runs; lists-arrays also drives edit, reset and a repaired pass",
      evidence: "scripts/code-lab-check.mjs",
    },
  },
  {
    id: "diagram",
    label: "Diagram recognition and labelling",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.diagram), items: diagramItems },
    serverMarked: { lessons: lessonsWith((r) => r.formats.diagram), items: diagramItems },
    browserVerified: {
      status: "yes",
      lessons: BROWSER_DIAGRAM.size,
      detail: "fraction-bar and circuit drawings labelled through native selects; partial credit checked",
      evidence: "scripts/lesson-formats-browser-check.mjs",
    },
  },
  {
    id: "gap-fill",
    label: "Gap fill — one independently marked blank per gap",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.gapFill), items: gapFillItems },
    serverMarked: { lessons: lessonsWith((r) => r.formats.gapFill), items: gapFillItems },
    browserVerified: {
      status: "yes",
      lessons: BROWSER_GAP.size,
      detail: "the photosynthesis summary is completed with accepted variants and a wrong keyword-bearing gap is refused",
      evidence: "scripts/lesson-formats-browser-check.mjs",
    },
  },
  {
    id: "matching",
    label: "Matching — terms to meanings",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.matching), items: matchingItems },
    serverMarked: { lessons: lessonsWith((r) => r.formats.matching), items: matchingItems },
    browserVerified: {
      status: "yes",
      lessons: BROWSER_MATCHING.size,
      detail: "photosynthesis and what-is-code pairs are submitted with select controls; partial credit checked",
      evidence: "scripts/lesson-formats-browser-check.mjs",
    },
  },
  {
    id: "ordering",
    label: "Ordering — sequence and process",
    implemented: "yes",
    integrated: { lessons: lessonsWith((r) => r.formats.ordering), items: orderingItems },
    serverMarked: { lessons: lessonsWith((r) => r.formats.ordering), items: orderingItems },
    browserVerified: {
      status: "yes",
      lessons: BROWSER_ORDERING.size,
      detail: "the what-is-code algorithm is reordered with Up/Down buttons and marked by position",
      evidence: "scripts/lesson-formats-browser-check.mjs",
    },
  },
  {
    id: "venn",
    label: "Probability — Venn region selection",
    implemented: "yes",
    integrated: { lessons: 1, items: 1 },
    serverMarked: { lessons: 1, items: 1 },
    browserVerified: {
      status: "yes",
      lessons: 1,
      detail: "union selection, keyboard toggle and 20% = 1/5 input are submitted visibly",
      evidence: "scripts/lesson-walk.mjs",
    },
  },
  {
    id: "tree",
    label: "Probability — completed tree",
    implemented: "yes",
    integrated: { lessons: 2, items: 2 },
    serverMarked: { lessons: 2, items: 2 },
    browserVerified: {
      status: "yes",
      lessons: 2,
      detail: "probability-basics and tree-diagrams completed visibly, invalid input refused",
      evidence: "scripts/lesson-walk.mjs",
    },
  },
  {
    id: "simulation",
    label: "Probability — simulation",
    implemented: "yes",
    integrated: { lessons: 1, items: 1 },
    serverMarked: { lessons: 0, items: 0 },
    browserVerified: {
      status: "yes",
      lessons: 1,
      detail: "coin, die and bag runs, reset, and exhaustive outcome counts",
      evidence: "scripts/lesson-walk.mjs",
    },
  },
];

const methodRows = METHOD_DEFS.map((def) => {
  const present = rows.filter((row) => row.methods[def.id]).length;
  return {
    id: def.id,
    label: def.label,
    implemented: "yes",
    integratedLessons: present,
    browserVerified: def.browser,
  };
});

const gaps = {
  noServerMarkedAssessment: noServerLessons,
  unkeyedShortAnswerLessons: unkeyedLessons,
  unkeyedShortAnswerItems: unkeyedShortItems,
  constructedResponseItems: constructedItems,
  constructedResponseLessons: lessonsWith((row) => row.formats.constructed),
  structuredItems,
  structuredLessons: lessonsWith((row) => row.formats.structured),
  codeItems,
  gapFillItems,
  matchingItems,
  orderingItems,
  codeBrowserVerifiedLessons: [...BROWSER_CODE],
  diagramItems,
  figureLessons,
  figureBlocks,
  interactiveFractionLessons: lessonsWith((row) => row.methods["interactive-model"]),
  interactiveProbabilityLessons: lessonsWith((row) => row.methods["interactive-probability"]),
  allThreeRetrievalIntervals: allIntervals,
  lessonsMissingAnInterval: lessonCount - allIntervals,
  educatorReviewed: lessons.filter((lesson) => lesson.reviews.length > 0).length,
  learnerTested: lessons.filter((lesson) => lesson.learnerTesting.length > 0).length,
};

// The report is a measurement, so its own arithmetic is checked before it is
// written. A matrix that says 160 server-marked items while its format rows add
// to something else is worse than no matrix.
const consistency = [];
if (rows.length !== lessonCount) consistency.push(`expected ${lessonCount} lesson rows, got ${rows.length}`);
if (serverMarkedItems !== keyedShortItems + structuredItems + gapFillItems + matchingItems + orderingItems + diagramItems) {
  consistency.push("server-marked item total does not equal the sum of its server-marked formats");
}
if (serverMarkedLessons > lessonCount) consistency.push("more server-marked lessons than authored lessons");
if (rows.some((row) => row.methodCount < 14)) {
  consistency.push("a lesson row is missing one of the 14 core teaching methods");
}
for (const id of [
  ...BROWSER_SHORT,
  ...BROWSER_CODE,
  ...BROWSER_STRUCTURED,
  ...BROWSER_GAP,
  ...BROWSER_MATCHING,
  ...BROWSER_ORDERING,
  ...BROWSER_DIAGRAM,
  ...PROBABILITY,
]) {
  if (!lessons.some((lesson) => lesson.conceptId === id)) consistency.push(`browser evidence names unknown lesson ${id}`);
}
if (browserRecord && (browserRecord.authoredLessons !== lessonCount
  || browserRecord.authoredCatalogue !== lessonCount
  || browserRecord.failed !== 0
  || browserRecord.allAuthoredPainted !== true)) {
  consistency.push(`audit/lesson-browser.json is not a clean ${lessonCount}-lesson run (pages ${browserRecord.authoredLessons}, catalogue ${browserRecord.authoredCatalogue}, failed ${browserRecord.failed})`);
}
if (!formatsBrowserRecord || formatsBrowserRecord.failed !== 0) {
  consistency.push("audit/lesson-formats-browser.json is missing or not a clean interaction run");
}
if (!codeBrowserRecord || codeBrowserRecord.lessons?.length !== BROWSER_CODE.size
  || codeBrowserRecord.lessons.some((row) => row.loaded !== true || row.ran !== true)) {
  consistency.push("audit/code-lab-browser.json is missing a loaded/ran row for an authored code lesson");
}
if (consistency.length) {
  console.error("coverage matrix: inconsistent measurement");
  for (const problem of consistency) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

const report = {
  generatedAt: new Date().toISOString(),
  scope:
    `All ${lessonCount} authored openmind.lesson/1.0 lessons. Implemented means a code path exists; integrated means at least one authored lesson uses it; server-marked means /api/progress grades and records it; browser-verified means a real browser exercised the visible control. These are separate claims.`,
  browserRun: browserRecord,
  formatsBrowserRun: formatsBrowserRecord,
  codeBrowserRun: codeBrowserRecord,
  summary: {
    authoredLessons: lessonCount,
    assessmentItems: totalAssessmentItems,
    serverMarkedItems,
    serverMarkedShare: serverShare,
    serverMarkedLessons,
    lessonsWithoutServerMarkedAssessment: noServerLessons.length,
    keyedShortItems,
    unkeyedShortItems,
    constructedItems,
    structuredItems,
    codeItems,
    gapFillItems,
    matchingItems,
    orderingItems,
    diagramItems,
    figureLessons,
    figureBlocks,
    browserPageRendered: browserRecord?.allAuthoredPainted ? lessonCount : 0,
  },
  formats: formatRows,
  teachingMethods: methodRows,
  lessons: rows,
  gaps,
};

const outDir = path.join("reports", "lesson-quality");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "coverage-matrix.json"), `${JSON.stringify(report, null, 2)}\n`);

const md = [];
md.push("# Authored lesson coverage matrix");
md.push("");
md.push(`Generated ${report.generatedAt}.`);
md.push("");
md.push(report.scope);
md.push("");
md.push("## Headline");
md.push("");
md.push(`- Authored lessons: **${lessonCount}**. Assessment items: **${totalAssessmentItems}**.`);
md.push(`- Server-marked assessment items: **${serverMarkedItems} / ${totalAssessmentItems}** (${((serverMarkedItems / totalAssessmentItems) * 100).toFixed(1)}%).`);
md.push(`- Lessons with at least one server-marked assessment or activity: **${serverMarkedLessons} / ${lessonCount}**.`);
md.push(noServerLessons.length === 0
  ? "- Lessons with no server-marked assessment: **0**."
  : `- Lessons with no server-marked assessment: **${noServerLessons.length}** — ${noServerLessons.join(", ")}.`);
md.push(`- Short-answer items with a deterministic key: **${keyedShortItems}**; without a key: **${unkeyedShortItems}** in **${unkeyedLessons.length}** lessons.`);
md.push(`- Constructed responses: **${constructedItems}**; structured items: **${structuredItems}**; code labs: **${codeItems}**; gap fill: **${gapFillItems}**; matching: **${matchingItems}**; ordering: **${orderingItems}**; diagram items: **${diagramItems}**.`);
md.push(`- Authored block figures: **${figureBlocks}** blocks across **${figureLessons}** lessons. Interactive fraction model: **1** lesson; probability models: **${gaps.interactiveProbabilityLessons}** lessons.`);
md.push(`- All ${lessonCount} lesson pages were painted by the last recorded browser walk${browserRecord ? ` (${browserRecord.passed} passed, ${browserRecord.failed} failed at ${browserRecord.at})` : " (no audit/lesson-browser.json record)"}.`);
md.push(`- All three retrieval intervals exist in **${allIntervals} / ${lessonCount}** lessons; **${lessonCount - allIntervals}** use only next-day and/or week-later.`);
md.push(`- Subject-teacher reviewed: **0**; learner-tested: **0**. No review or learner claim is inferred here.`);
md.push("");
md.push("## Format coverage");
md.push("");
md.push("| Format | Implemented | Integrated (authored) | Server-marked | Browser-verified |");
md.push("| --- | --- | --- | --- | --- |");
for (const row of formatRows) {
  const integrated = row.integrated.lessons || row.integrated.items
    ? `${row.integrated.lessons} lessons · ${row.integrated.items} item${row.integrated.items === 1 ? "" : "s"}${row.integrated.parts ? ` · ${row.integrated.parts} parts` : ""}`
    : "—";
  const server = row.serverMarked.lessons || row.serverMarked.items
    ? `${row.serverMarked.lessons} lessons · ${row.serverMarked.items} item${row.serverMarked.items === 1 ? "" : "s"}`
    : "—";
  const browser = row.browserVerified.status === "no"
    ? `No — ${row.browserVerified.detail}`
    : `${row.browserVerified.status === "yes" ? "Yes" : "Render only"} — ${row.browserVerified.detail} (${row.browserVerified.evidence})`;
  md.push(`| ${row.label} | ${row.implemented} | ${integrated} | ${server} | ${browser} |`);
}
md.push("");
md.push("**Implemented** means the contract and a code path exist. **Integrated** means an authored lesson uses it. **Server-marked** means a submission reaches `/api/progress` and is recorded. **Browser-verified** means a browser exercised the visible control; `Render only` means the page painted but no submission was made.");
md.push("");
md.push("Gap fill, matching, ordering and diagram labelling use the same pure marker and route as the structured items. A diagram is not counted because a picture rendered: the count requires authored labels, a target for each label, a server-marked submission and a browser-driven journey.");
md.push("");
md.push("## Teaching-method coverage");
md.push("");
md.push("| Method | Implemented | Lessons with it | Browser evidence | Server-marked |");
md.push("| --- | --- | ---: | --- | --- |");
for (const row of methodRows) {
  md.push(`| ${row.label} | ${row.implemented} | ${row.integratedLessons} / ${lessonCount} | ${row.browserVerified} | n/a — teaching method, not a submission |`);
}
md.push("");
md.push(`The 14 core teaching methods are present in all ${lessonCount} lessons; \`retrieval-all-intervals\` and the three optional extras (drawn figure, fraction model, probability model) vary. Their presence is not a quality score: the lesson gate checks structure and the review records remain empty.`);
md.push("");
md.push("## Per-lesson matrix");
md.push("");
md.push("Format codes: `S` keyed short answer, `s` unkeyed short answer, `C` constructed response, `X` structured, `K` code lab, `D` diagram, `V` Venn, `T` tree, `M` simulation.");
md.push("");
md.push("Server codes use the same letters for formats the server marks. Browser codes add `page` (the lesson page was painted) and the format codes a browser actually submitted.");
md.push("");
md.push("| Concept | Subject | Plan | Methods | Formats | Server | Browser |");
md.push("| --- | --- | --- | ---: | --- | --- | --- |");
for (const row of rows) {
  const plan = row.planProvenance === "supplemental"
    ? "supplemental"
    : row.planProvenance === "authored"
      ? "authored"
      : "pilot";
  md.push(
    `| ${row.conceptId} | ${row.subject} | ${plan} | ${row.methodCount}/18 | ${row.formatCodes.join("") || "—"} | ${row.serverCodes.join("") || "—"} | ${row.browserCodes.join(" ")} |`,
  );
}
md.push("");
md.push("`Methods` counts the 18 rows above. The 14 core teaching methods are present in every lesson; `retrieval-all-intervals` and the figure, fraction-model and probability extras vary.");
md.push("");
md.push("## Gaps this audit makes visible");
md.push("");
md.push(noServerLessons.length === 0
  ? "- **Every lesson has at least one server-marked assessment.**"
  : `- **${noServerLessons.length} lessons have no server-marked assessment at all:** ${noServerLessons.join(", ")}. Their assessment is self-marked or browser-only.`);
md.push(`- **${unkeyedShortItems} short-answer items in ${unkeyedLessons.length} lessons have no deterministic key.** They render as short-answer but cannot be marked by the server; they are self-marked.`);
md.push(`- **${constructedItems} constructed responses remain self-marked.** One is explicitly unscored; none is server-marked.`);
md.push(`- **Structured coverage is ${structuredItems} item(s).** Authored structured items use numeric method/answer parts. Table, graph, plot and read-off parts remain available to the assessment app but are refused by the authored-lesson renderer, so no lesson claims them.`);
md.push(`- **Code labs are not server-marked.** ${codeItems} code items exist and ${BROWSER_CODE.size === codeItems ? `all ${codeItems}` : `${BROWSER_CODE.size}`} are browser-exercised; the tests run in the browser and are practice feedback, not evidence.`);
md.push(`- **Diagram assessment is integrated in ${lessonsWith((r) => r.formats.diagram)} lessons.** The renderer supports numbered SVG targets and native-select labels; free-placed hotspots remain future work.`);
md.push(`- **Gap fill, matching and ordering are integrated but narrow.** ${gapFillItems} gap-fill, ${matchingItems} matching and ${orderingItems} ordering items exercise the formats; broader rollout remains.`);
md.push(`- **The interactive fraction model is not browser-verified.** It is integrated in one lesson, but the walk has no interaction assertion for it.`);
md.push(allIntervals === lessonCount
  ? `- **Retrieval spacing is complete.** All ${lessonCount} lessons carry next-day, week-later and month-later prompts.`
  : `- **Retrieval spacing is not uniform.** ${lessonCount - allIntervals} lessons lack one of the three intervals.`);
md.push(`- **No subject-teacher review or learner-testing record exists.** This matrix reports structural coverage, not teaching effectiveness.`);
md.push("");
md.push("## What this matrix does not claim");
md.push("");
md.push("A present method is not a good method. A server-marked item is not a valid item. A browser-verified control is not evidence that a learner learned from it. The only human-evidence columns remain zero, and this report does not fill them.");
md.push("");
fs.writeFileSync(path.join(outDir, "coverage-matrix.md"), `${md.join("\n")}\n`);

console.log("Authored lesson coverage matrix");
console.log(`  lessons: ${lessonCount}`);
console.log(`  assessment items: ${totalAssessmentItems}`);
console.log(`  server-marked: ${serverMarkedItems}/${totalAssessmentItems} items across ${serverMarkedLessons} lessons`);
console.log(`  no server-marked assessment: ${noServerLessons.length} (${noServerLessons.join(", ")})`);
console.log(`  unkeyed short-answer: ${unkeyedShortItems} items in ${unkeyedLessons.length} lessons`);
console.log(`  constructed: ${constructedItems}; structured: ${structuredItems}; code: ${codeItems}; diagram: ${diagramItems}`);
console.log(`  wrote reports/lesson-quality/coverage-matrix.json and coverage-matrix.md`);
