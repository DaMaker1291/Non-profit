#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE WORLD MATRIX — every lesson, every interface language, every country.
//
// What this proves:
//   - all 135 lessons resolve in all 15 interface languages;
//   - the lesson scaffolding (section headings, map captions, video scope) has
//     its own translated string in every language, not an English fallback;
//   - every lesson still has a learning map, a video card and at least two
//     sections in every language;
//   - every one of the 251 country choices resolves to at least one offered
//     course, and no offered course is an empty shell;
//   - the national-route and endpoint counts are reported, not inferred.
//
// What it does NOT prove: that the lesson BODY is translated. The body is
// authored English and the page says so; only a complete `PLAN_TRANSLATIONS`
// entry changes that, and this gate reports that coverage separately.
//
// Run: node scripts/lesson-world-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { LANGS, DICTS, translator, fill } = require("../.verify/i18n.js");
const { LESSON_STRINGS, VIDEO_META_STRINGS } = require("../.verify/i18n-lessons.js");
const { CONCEPTS } = require("../.verify/genome.js");
const { planFor, sectionsFor, teachingLanguages } = require("../.verify/lesson-plans.js");
const { ctitle, cblurb } = require("../.verify/content-i18n.js");
const { lessonMapFor } = require("../.verify/lesson-map.js");
const { videoFor, videoScopeKey } = require("../.verify/lesson-media.js");
const world = require("../.verify/world-countries.js");
const COUNTRIES = world.WORLD_COUNTRIES ?? world.COUNTRIES;
const R = require("../.verify/curricula/registry.js");
const S = require("../.verify/specifications.js");

const failures = [];
const lessonKeys = Object.keys(LESSON_STRINGS.en);
const captionKeys = Object.keys(VIDEO_META_STRINGS.en);
const languages = LANGS.map((l) => l.code);
const subjects = ["maths", "physics", "chemistry", "biology", "computing"];

for (const lang of languages) {
  const own = LESSON_STRINGS[lang];
  if (!own) {
    failures.push(`${lang}: no lesson structural dictionary`);
    continue;
  }
  for (const key of lessonKeys) {
    if (!own[key]?.trim()) failures.push(`${lang}: missing ${key}`);
    if (translator(lang)(key) === key) failures.push(`${lang}: raw dictionary key ${key}`);
    if (lang !== "en" && own[key] === LESSON_STRINGS.en[key]) failures.push(`${lang}: ${key} is still English`);
  }
  for (const key of captionKeys) {
    if (!DICTS[lang]?.[key]?.trim()) failures.push(`${lang}: missing ${key}`);
    if (translator(lang)(key) === key) failures.push(`${lang}: raw dictionary key ${key}`);
    if (lang !== "en" && DICTS[lang]?.[key] === VIDEO_META_STRINGS.en[key]) failures.push(`${lang}: ${key} is still English`);
  }
}

let lessonLanguagePairs = 0;
for (const lang of languages) {
  const t = translator(lang);
  for (const concept of CONCEPTS) {
    const plan = planFor(concept.id);
    if (!plan) {
      failures.push(`${lang}/${concept.id}: no lesson plan`);
      continue;
    }
    const title = ctitle(lang, concept.id);
    if (!title.trim() || title === `cn.${concept.id}`) failures.push(`${lang}/${concept.id}: no concept title`);
    if (!cblurb(lang, concept.id).trim()) failures.push(`${lang}/${concept.id}: no concept blurb`);
    if (!lessonMapFor(concept.id)) failures.push(`${lang}/${concept.id}: no learning map`);
    const video = videoFor(plan);
    if (!video) failures.push(`${lang}/${concept.id}: no video card`);
    else if (t(videoScopeKey(video)) === videoScopeKey(video)) failures.push(`${lang}/${concept.id}: raw video scope key`);
    const sections = sectionsFor(plan);
    if (sections.length < 2) failures.push(`${lang}/${concept.id}: fewer than two sections`);
    for (const section of sections) {
      const heading = section.headingKey ? t(section.headingKey) : section.heading;
      if (!heading.trim() || heading === section.headingKey) failures.push(`${lang}/${concept.id}: blank or raw section heading`);
      for (const body of section.body) {
        if (!body.trim() || body.includes("[object Object]") || body.includes("{{{")) {
          failures.push(`${lang}/${concept.id}: malformed section body`);
        }
      }
    }
    const open = fill(t("lesson.videoOpen"), { source: video?.source ?? "Khan Academy" });
    if (open.includes("{source}") || !open.trim()) failures.push(`${lang}/${concept.id}: video-open sentence did not fill`);
    lessonLanguagePairs += 1;
  }
}

// ── Countries and offered courses ────────────────────────────────────────────
// A country is never silently given another country's curriculum. Every picker
// choice must resolve to at least one course (its own, or an explicitly offered
// international/independent route). A course with no concepts or no level is a
// shell, not a course.
let offeredCourseCount = 0;
let universalCourseCountries = 0;
for (const { code } of COUNTRIES) {
  const specs = S.specsFor(code);
  if (!specs.length) failures.push(`${code}: the picker offers no course`);
  if (!R.pathwayChoices(code).length) failures.push(`${code}: no pathway choice or fallback`);
  offeredCourseCount += specs.length;
  if (S.specsFor(code, "int-independent").some((spec) => spec.id === "any-independent")) {
    universalCourseCountries += 1;
  } else {
    failures.push(`${code}: the universal independent course is not offered`);
  }
}
const universal = S.SPECIFICATIONS.filter((spec) => S.courseConceptIds(spec).size === CONCEPTS.length);
if (!universal.length) failures.push("no specification covers all 135 concepts");
for (const spec of S.SPECIFICATIONS) {
  if (!spec.levels?.length) failures.push(`${spec.id}: a course with no level`);
  if (!S.courseConceptIds(spec).size) failures.push(`${spec.id}: a course with no concepts`);
  if (!subjects.some((subject) => S.coversSubject(spec, subject))) {
    failures.push(`${spec.id}: a course that covers no subject`);
  }
}

// ── The renderers must use the translated scaffolding ───────────────────────
const page = fs.readFileSync(path.join("app", "learn", "[subject]", "[concept]", "page.tsx"), "utf8");
const twin = fs.readFileSync(path.join("docs", "app.js"), "utf8");
for (const [where, source] of [["React lesson", page], ["offline twin", twin]]) {
  if (!source.includes("headingKey")) failures.push(`${where}: section headings are not translated`);
  if (!source.includes("videoScopeKey")) failures.push(`${where}: video scope is not translated`);
  if (!source.includes("lesson.videoCaptionsUnknown")) failures.push(`${where}: video caption status is not translated`);
  if (!source.includes("lesson.videoOpen")) failures.push(`${where}: video-open note is not translated`);
}
const mapComponent = fs.readFileSync(path.join("components", "lesson-map.tsx"), "utf8");
if (!mapComponent.includes("lesson.mapAfter")) failures.push("the React learning map caption is not translated");
if (!twin.includes("lesson.mapAfter")) failures.push("the offline learning map caption is not translated");

const translatedTeaching = CONCEPTS.reduce((n, c) => n + teachingLanguages(c.id).length, 0);
const nationalRoutes = R.nationalRouteCodes().length;

if (failures.length) {
  console.error("World lesson matrix failures:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log(
  `✓ ${lessonLanguagePairs} lesson-language pairs: ${CONCEPTS.length} lessons × ${languages.length} interface languages, ` +
    `each with a map, video card, at least two translated section headings and no raw key. ` +
    `All ${COUNTRIES.length} country choices resolve to ${offeredCourseCount} offered course slots across ` +
    `${S.SPECIFICATIONS.length} specifications (${nationalRoutes} researched national routes); ` +
    `${universalCourseCountries}/${COUNTRIES.length} offer the universal course covering all ${CONCEPTS.length} concepts; ` +
    `complete translated teaching bodies: ${translatedTeaching} lesson-language pairs.`,
);