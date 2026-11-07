#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE SUBJECT ATLAS GATE.
//
// Proves the universal routes are real:
//   - five graded subjects, each with a lesson door, and twenty-one external
//     routes, each with a verified-shape https course, source and summary;
//   - exactly five topics and a map with five non-overlapping, in-frame nodes;
//   - the subject name and every UI word exist in all fifteen dictionaries,
//     with no raw key and no English fallback;
//   - the renderer contains no iframe/embed and no country filter;
//   - the external course is marked not-graded on the page.
//
// What it does NOT prove: that an external course still has every video, or
// that OpenMind grades it. The page says "external — not graded" on every card,
// and link rot is a separate review.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const A = require("../.verify/subject-atlas.js");
const { LANGS, DICTS } = require("../.verify/i18n.js");

const failures = [];
const ok = (condition, message, detail = "") => {
  if (!condition) failures.push(detail ? `${message}: ${detail}` : message);
};

ok(A.ATLAS_TOTAL_COUNT === A.SUBJECT_ATLAS.length, "the atlas count is the atom length", `${A.ATLAS_TOTAL_COUNT} vs ${A.SUBJECT_ATLAS.length}`);
ok(A.ATLAS_GRADED_COUNT === 5, "five subjects are graded", String(A.ATLAS_GRADED_COUNT));
ok(A.ATLAS_EXTERNAL_COUNT === 21, "twenty-one external routes are offered", String(A.ATLAS_EXTERNAL_COUNT));
ok(A.ATLAS_TOTAL_COUNT === 26, "the atlas offers 26 subject routes", String(A.ATLAS_TOTAL_COUNT));

const ids = new Set();
const UI_KEYS = [
  "atlas.title",
  "atlas.lead",
  "atlas.graded",
  "atlas.route",
  "atlas.open",
  "atlas.notGraded",
  "atlas.map",
  "atlas.mapCaption",
  "atlas.englishNote",
];

for (const subject of A.SUBJECT_ATLAS) {
  ok(!ids.has(subject.id), `duplicate subject id ${subject.id}`);
  ids.add(subject.id);
  ok(subject.topics.length === 5, `${subject.id}: exactly five topics`, String(subject.topics.length));
  ok(subject.question.trim().length >= 30, `${subject.id}: the subject asks a real question`);
  ok(subject.labelKey === (subject.graded ? `subj.${subject.id}` : `atlas.${subject.id}`), `${subject.id}: label key names the subject`);
  if (subject.graded) {
    ok(Boolean(subject.href?.startsWith("/learn/")), `${subject.id}: graded subject has a lesson door`, subject.href ?? "none");
    ok(!subject.course, `${subject.id}: a graded subject does not also claim an external course`);
  } else {
    const c = subject.course;
    ok(Boolean(c), `${subject.id}: external route has a course`);
    if (c) {
      ok(c.url.startsWith("https://"), `${subject.id}: course URL is https`, c.url);
      ok(c.source.trim().length > 0, `${subject.id}: course source is named`);
      ok(c.summary.trim().length >= 60, `${subject.id}: course summary explains what is there`);
      ok(c.language === "en", `${subject.id}: course language is stated`, c.language);
      ok(["human", "auto", "none", "unknown"].includes(c.captions), `${subject.id}: caption status is honest`, c.captions);
      ok(c.format === "video-and-text" || c.format === "video-and-practice", `${subject.id}: course contains video`, c.format);
      ok(!/youtube\.com\/embed|player\.vimeo|<iframe/i.test(c.url), `${subject.id}: course is a link, not an embed`);
    }
  }

  const map = A.atlasMapLayout(subject);
  ok(map.nodes.length === 5, `${subject.id}: map draws five topic nodes`);
  ok(map.edges.length === 5, `${subject.id}: map draws five route lines`);
  const inside = (box) =>
    box.x >= 0 && box.y >= 0 &&
    box.x + box.width <= A.ATLAS_MAP_WIDTH &&
    box.y + box.height <= A.ATLAS_MAP_HEIGHT;
  ok(inside(map.centre), `${subject.id}: centre box is inside the map`);
  for (const node of map.nodes) {
    ok(inside(node), `${subject.id}: node ${node.index} is inside the map`);
    ok(node.lines.length >= 1 && node.lines.length <= 2, `${subject.id}: node ${node.index} has 1-2 lines`);
    for (const line of node.lines) ok(line.length <= 42, `${subject.id}: node ${node.index} line fits`, String(line.length));
  }
  for (let i = 1; i < map.nodes.length; i++) {
    const previous = map.nodes[i - 1];
    const current = map.nodes[i];
    ok(previous.y + previous.height < current.y, `${subject.id}: nodes ${i - 1}/${i} do not overlap`);
  }
  ok(map.centre.x + map.centre.width < map.nodes[0].x, `${subject.id}: centre and topic column do not overlap`);
}

const languages = LANGS.map((l) => l.code);
ok(languages.length === 15, "fifteen interface languages are covered", String(languages.length));
for (const lang of languages) {
  const dict = DICTS[lang];
  ok(Boolean(dict), `${lang}: dictionary exists`);
  if (!dict) continue;
  for (const key of UI_KEYS) {
    const value = dict[key]?.trim();
    ok(Boolean(value), `${lang}: missing ${key}`);
    if (value && value === key) failures.push(`${lang}: raw dictionary key ${key}`);
    if (lang !== "en" && value === DICTS.en[key]) failures.push(`${lang}: ${key} is still English`);
  }
  for (const subject of A.SUBJECT_ATLAS) {
    const value = dict[subject.labelKey]?.trim();
    ok(Boolean(value), `${lang}: missing ${subject.labelKey}`);
    if (value && value === subject.labelKey) failures.push(`${lang}: raw dictionary key ${subject.labelKey}`);
    if (lang !== "en" && value === DICTS.en[subject.labelKey]) failures.push(`${lang}: ${subject.labelKey} is still English`);
  }
}

const page = fs.readFileSync("app/subjects/page.tsx", "utf8");
ok(page.includes("SUBJECT_ATLAS"), "the page renders the atlas data");
ok(page.includes("SubjectAtlasMap"), "the page renders a map for every route");
ok(page.includes('rel="noopener noreferrer"'), "external course links are safely opened");
ok(!/<iframe|dangerouslySetInnerHTML|<embed|<object/i.test(page), "the page embeds no third-party content");
ok(!/from "@\/lib\/specifications"|from "@\/lib\/curricula|useProfile/.test(page), "the atlas does not filter by course or country");
ok((page.match(/atlas\.notGraded/g) ?? []).length >= 1, "the page labels external routes not graded");

const mapSource = fs.readFileSync("components/subject-atlas-map.tsx", "utf8");
ok(mapSource.includes('aria-hidden="true"'), "the SVG is hidden from assistive technology");
ok(mapSource.includes("<figcaption"), "the map has a visible accessible caption");
ok(!/<iframe|dangerouslySetInnerHTML|foreignObject/i.test(mapSource), "the map is native SVG, not embedded content");

const offline = fs.readFileSync("docs/app.js", "utf8");
ok(offline.includes("function viewAtlas"), "the offline twin has the atlas route");
ok(offline.includes("E.subjectAtlas"), "the offline twin reads the same atlas data");
ok(offline.includes('if (base === "/subjects")'), "the offline twin exposes /subjects");ok(offline.indexOf('if (base === "/subjects")') < offline.indexOf("if (!hasProfile)"),
  "the atlas route is public, before the profile guard",
);
const offlineCss = fs.readFileSync("docs/app.css", "utf8");
ok(/\.atlas-map-edge\s*{[^}]*stroke:\s*var\(--line\)/.test(offlineCss),
  "the offline map's route lines use a token the stylesheet defines");
ok(/\.atlas-map-node\s*{[^}]*stroke:\s*var\(--line\)/.test(offlineCss),
  "the offline map's topic boxes use the same defined edge token");

if (failures.length) {
  console.error(`\n✗ subject atlas: ${failures.length} failure(s)\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log(
  `✓ ${A.ATLAS_TOTAL_COUNT} subject routes: ${A.ATLAS_GRADED_COUNT} graded by OpenMind, ${A.ATLAS_EXTERNAL_COUNT} external open courses (all with video), five-topic maps inside the frame, and every subject name + 9 UI strings translated in ${languages.length} languages.`,
);
