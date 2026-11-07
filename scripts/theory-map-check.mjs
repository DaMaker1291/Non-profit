#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE THEORY-MAP GATE.
//
// The full-subject map can only be honest if it is derived from the genome:
// every concept in the subject appears exactly once, every line is an actual
// `prereqs` edge inside that subject, and every child sits to the right of its
// prerequisite. This also checks that the React page and the offline twin use
// the shared pure layout, and that its title/caption exist in all 15 languages.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const genome = require("../.verify/genome.js");
const theory = require("../.verify/theory-map.js");
const { lessonMapFor, wrapLessonMapLabel } = require("../.verify/lesson-map.js");
const { LANGS, DICTS } = require("../.verify/i18n.js");

const failures = [];
const ok = (condition, message, detail = "") => {
  if (!condition) failures.push(detail ? `${message}: ${detail}` : message);
};
const subjects = ["maths", "physics", "chemistry", "biology", "computing"];

for (const subject of subjects) {
  const expected = genome.bySubject(subject);
  const map = theory.theoryMapFor(subject);
  ok(Boolean(map), `${subject}: theory map exists`);
  if (!map) continue;
  ok(map.nodes.length === expected.length, `${subject}: every concept is on the map`, `${map.nodes.length}/${expected.length}`);
  const ids = new Set(map.nodes.map((n) => n.id));
  ok(ids.size === map.nodes.length, `${subject}: no concept is drawn twice`);
  for (const concept of expected) ok(ids.has(concept.id), `${subject}: ${concept.id} is missing`);
  for (const node of map.nodes) {
    ok(node.x >= 0 && node.y >= 0, `${subject}: ${node.id} starts inside the frame`);
    ok(node.x + node.width <= map.width && node.y + node.height <= map.height, `${subject}: ${node.id} ends inside the frame`);
    const lines = wrapLessonMapLabel(DICTS.en[`concept.${node.id}`] ?? genome.getConcept(node.id)?.title ?? node.id);
    ok(lines.length >= 1 && lines.length <= 2, `${subject}: ${node.id} label fits two lines`, String(lines.length));
    ok(lines.every((line) => line.length <= 26), `${subject}: ${node.id} label stays short`);
  }
  for (const concept of expected) {
    const child = map.nodes.find((n) => n.id === concept.id);
    if (!child) continue;
    for (const parentId of concept.prereqs) {
      const parent = map.nodes.find((n) => n.id === parentId);
      if (!parent) continue;
      const edge = map.edges.find((e) => e.from === parentId && e.to === concept.id);
      ok(Boolean(edge), `${subject}: ${parentId} → ${concept.id} has a line`);
      ok(parent.depth < child.depth, `${subject}: ${parentId} is left of ${concept.id}`);
      if (edge) ok(edge.x1 < edge.x2, `${subject}: ${parentId} → ${concept.id} travels right`);
    }
  }
  const expectedEdges = expected.reduce(
    (n, c) => n + c.prereqs.filter((p) => genome.getConcept(p)?.subject === subject).length,
    0,
  );
  ok(map.edges.length === expectedEdges, `${subject}: one line per same-subject prerequisite`, `${map.edges.length}/${expectedEdges}`);

  // The lesson map is a different claim and still covers every concept.
  ok(Boolean(lessonMapFor(expected[0].id)), `${subject}: local lesson maps still exist`);
}

const page = fs.readFileSync("app/learn/[subject]/page.tsx", "utf8");
ok(page.includes("SubjectTheoryMap"), "the React subject page renders the theory map");
ok(page.includes("<SubjectTheoryMap subject={subject} />"), "the React theory map receives the subject");
const twin = fs.readFileSync("docs/app.js", "utf8");
ok(/function theoryMapHtml\(subject\)/.test(twin), "the offline twin has a theory-map renderer");
ok(/theoryMapHtml\(subject\)/.test(twin), "the offline twin calls its theory-map renderer");
ok(/E\.theoryMap\.theoryMapFor\(subject\)/.test(twin), "the offline twin reads the shared theory layout");
ok(/theory-map-scroll" dir="ltr"/.test(twin), "the offline map opens at its roots in RTL too");
ok(/dir="ltr"/.test(fs.readFileSync("components/subject-theory-map.tsx", "utf8")), "the React map opens at its roots in RTL too");
for (const cssPath of ["app/globals.css", "docs/app.css"]) {
  const css = fs.readFileSync(cssPath, "utf8");
  ok(/\.theory-map\b/.test(css), `${cssPath}: theory map styling exists`);
  ok(/\.theory-map-scroll\b/.test(css), `${cssPath}: the theory map scrolls instead of widening the page`);
}

for (const lang of LANGS.map((l) => l.code)) {
  const dict = DICTS[lang];
  for (const key of ["theory.title", "theory.caption"]) {
    const value = dict?.[key]?.trim();
    ok(Boolean(value), `${lang}: missing ${key}`);
    if (value && value === key) failures.push(`${lang}: raw dictionary key ${key}`);
    if (lang !== "en" && value === DICTS.en[key]) failures.push(`${lang}: ${key} is still English`);
  }
  const caption = dict?.["theory.caption"] ?? "";
  ok(caption.includes("{n}") && caption.includes("{subject}"), `${lang}: theory caption keeps both placeholders`);
}

if (failures.length) {
  console.error(`\n✗ theory map: ${failures.length} failure(s)\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

const total = subjects.reduce((n, subject) => n + (theory.theoryMapFor(subject)?.nodes.length ?? 0), 0);
console.log(
  `✓ ${subjects.length} theory maps cover all ${total} concepts; every line is a same-subject prerequisite, every child is to the right of its parent, and the title/caption exist in ${LANGS.length} languages.`,
);

// Keep the label helper type checked even when a subject has no concepts.
void wrapLessonMapLabel;
void genome;
