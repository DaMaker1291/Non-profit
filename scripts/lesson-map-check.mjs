#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// EVERY LESSON HAS A LEARNING MAP, AND THE MAP IS HONEST.
//
// A map is not a subject diagram: it shows prerequisites, this idea and what
// comes next. This gate checks the two claims separately:
//   - every concept resolves a map with one centre, connected real neighbours
//     and geometry inside its own viewBox;
//   - every plan renders readable sections, and a plan that had no authored
//     sections loses none of its authored idea paragraphs when grouped.
//
// It also checks that both renderers actually call the shared module, because a
// module nobody renders is indistinguishable from a missing feature.
//
// Run: node scripts/lesson-map-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { CONCEPTS } = require("../.verify/genome.js");
const { planFor, sectionsFor } = require("../.verify/lesson-plans.js");
const { lessonMapFor, wrapLessonMapLabel, MAP_WIDTH } = require("../.verify/lesson-map.js");

const failures = [];
let connected = 0;
let nearbyContext = 0;
let sections = 0;

for (const concept of CONCEPTS) {
  const map = lessonMapFor(concept.id);
  if (!map) {
    failures.push(`${concept.id}: no learning map`);
    continue;
  }
  const thisNodes = map.nodes.filter((n) => n.role === "this");
  if (thisNodes.length !== 1 || thisNodes[0].id !== concept.id) {
    failures.push(`${concept.id}: map must have exactly one centre for this concept`);
  }
  const ids = new Set(map.nodes.map((n) => n.id));
  if (ids.size !== map.nodes.length) failures.push(`${concept.id}: duplicate node in map`);
  for (const node of map.nodes) {
    if (node.x < 0 || node.y < 0 || node.x + node.width > map.width || node.y + node.height > map.height) {
      failures.push(`${concept.id}: node ${node.id} leaves the map frame`);
    }
    const lines = wrapLessonMapLabel(node.id, 24);
    if (!lines.length || lines.length > 2 || lines.some((line) => line.length > 26)) {
      failures.push(`${concept.id}: label for ${node.id} does not fit two short lines`);
    }
  }
  // The canvas must be the CONTENT. A fixed 640px frame with a centre at 232
  // left a blank column on every map with only one side populated, and the SVG
  // stretched that blank column to the full card width. Assert the right edge
  // reaches the frame instead of leaving a column of nothing.
  const right = Math.max(...map.nodes.map((n) => n.x + n.width));
  if (map.width > MAP_WIDTH) failures.push(`${concept.id}: map is wider than the declared maximum`);
  if (right > map.width) failures.push(`${concept.id}: the rightmost node leaves the map frame`);
  if (map.width - right > 32) failures.push(`${concept.id}: map leaves ${map.width - right}px of empty column`);
  for (const edge of map.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) failures.push(`${concept.id}: edge names a node that is not drawn`);
    if (edge.from === edge.to) failures.push(`${concept.id}: map has a self-edge`);
    if (edge.x2 <= edge.x1) failures.push(`${concept.id}: map edge does not travel left to right`);
    if (edge.x2 - edge.x1 < 32) failures.push(`${concept.id}: map edge is too short to read as an arrow`);
  }
  const before = map.nodes.filter((n) => n.role === "before").length;
  const after = map.nodes.filter((n) => n.role === "after").length;
  const nearby = map.nodes.filter((n) => n.role === "nearby").length;
  if (map.edges.length !== before + after) {
    failures.push(`${concept.id}: map must have one edge per prerequisite/next node`);
  }
  if (!map.edges.length && !nearby) failures.push(`${concept.id}: map has neither a connection nor nearby context`);
  if (map.edges.length) connected += 1;
  if (nearby) nearbyContext += 1;

  const plan = planFor(concept.id);
  if (!plan) {
    failures.push(`${concept.id}: no plan for the map`);
    continue;
  }
  const planSections = sectionsFor(plan);
  if (planSections.length < 2) failures.push(`${concept.id}: lesson renders ${planSections.length} section(s), not a sequence`);
  for (const section of planSections) {
    if (!section.heading?.trim()) failures.push(`${concept.id}: a section has no heading`);
    if (!Array.isArray(section.body) || !section.body.length || section.body.some((p) => !p.trim())) {
      failures.push(`${concept.id}: a section has empty body text`);
    }
  }
  if (!plan.sections) {
    const grouped = planSections.flatMap((s) => s.body).join(" ");
    if (grouped !== plan.idea.join(" ")) failures.push(`${concept.id}: grouping sections changed the authored idea text`);
  }
  sections += 1;
}

const page = fs.readFileSync(path.join("app", "learn", "[subject]", "[concept]", "page.tsx"), "utf8");
if (!/<LessonMap conceptId=\{conceptId\} \/>/.test(page)) failures.push("the React lesson does not render LessonMap");
if (!/sectionsFor\(plan\)/.test(page)) failures.push("the React lesson does not use sectionsFor");

const twin = fs.readFileSync(path.join("docs", "app.js"), "utf8");
if (!/function lessonMapHtml\(conceptId\)/.test(twin)) failures.push("the offline twin has no lessonMapHtml");
if (!/lessonMapHtml\(conceptId\)/.test(twin)) failures.push("the offline twin never calls lessonMapHtml");
if (!/E\.lessonPlans\.sectionsFor\(plan\)/.test(twin)) failures.push("the offline twin does not use sectionsFor");

for (const cssPath of [path.join("app", "globals.css"), path.join("docs", "app.css")]) {
  const css = fs.readFileSync(cssPath, "utf8");
  if (!/\.lesson-map\b/.test(css)) failures.push(`${cssPath}: no .lesson-map styling`);
  if (!/\.lesson-map svg\b/.test(css)) failures.push(`${cssPath}: the map SVG has no sizing rule`);
}

if (failures.length) {
  console.error("Lesson map failures:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log(
  `✓ ${CONCEPTS.length} learning maps: every concept has a centre, real neighbouring concepts, left-to-right connections and labels inside the frame; ` +
    `${connected} maps show at least one connection, ${nearbyContext} show nearby subject context instead, and ${sections} plans render as readable sections without losing authored text.`,
);