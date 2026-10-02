// One-shot i18n: the "choose your course first" card names the missing field.
//
// WHY. The card told every learner "needs a course" and sent them to the course
// screen. A course has four parts, and the gate behind this card already reports
// WHICH are unset (`incompleteSubjects(...).missing` — country, year group,
// qualification, tier); only the caller dropped it. So a learner with GCSE Maths
// (Foundation) who never picked a year group was told they needed "a course",
// went to the course screen, changed nothing there (it had no year-group
// control), came back and read the same sentence — a loop with no exit. The card
// now prints the fields it is waiting for; this is the phrase that introduces
// them, with `{fields}` filled by the labels of the fields themselves
// (onb.country · onb.grade · onb.spec · onb.level), so no new vocabulary is
// invented for a year group or a tier in any language.
//
// One key, fifteen dictionaries, authored by hand like every other string a
// learner reads. Same convention as the other one-shot scripts: assert
// completeness, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling this belongs beside in every dictionary. */
const ANCHOR = '"next.courseFirstNote"';
const KEY = "next.courseMissing";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUES = {
  en: "needs: {fields}",
  es: "necesita: {fields}",
  fr: "il manque : {fields}",
  pt: "falta: {fields}",
  ar: "ينقص: {fields}",
  sw: "inahitaji: {fields}",
  hi: "इनकी ज़रूरत है: {fields}",
  id: "perlu: {fields}",
  tl: "kailangan: {fields}",
  de: "es fehlt: {fields}",
  ja: "不足: {fields}",
  zh: "还缺：{fields}",
  fa: "کم است: {fields}",
  ur: "درکار ہے: {fields}",
  bn: "দরকার: {fields}",
};

let src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEY}"`)) {
  console.log("already applied — nothing to do");
  process.exit(0);
}

function dictSpan(code) {
  const head = new RegExp(`^(export )?const ${code}: Dict = \\{`, "m").exec(src);
  if (!head) throw new Error(`dictionary ${code} not found`);
  const end = src.indexOf("\n};", head.index);
  if (end < 0) throw new Error(`dictionary ${code} has no terminator`);
  return [head.index, end];
}

const problems = [];
for (const code of LANGS) {
  if (typeof VALUES[code] !== "string" || !VALUES[code]) problems.push(`no value for ${code}`);
  if (!VALUES[code].includes("{fields}")) problems.push(`${code}: the placeholder is gone`);
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  let block = src.slice(from, to);
  const anchor = block.indexOf(`${ANCHOR}:`);
  if (anchor < 0) {
    problems.push(`${code}: anchor ${ANCHOR} missing`);
    continue;
  }
  const lineEnd = block.indexOf("\n", anchor);
  if (lineEnd < 0) {
    problems.push(`${code}: anchor line unterminated`);
    continue;
  }
  const indent = " ".repeat(anchor - block.lastIndexOf("\n", anchor) - 1);
  block = block.slice(0, lineEnd) + `\n${indent}"${KEY}": ${JSON.stringify(VALUES[code])},` + block.slice(lineEnd);
  src = src.slice(0, from) + block + src.slice(to);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  if (!src.slice(from, to).includes(`"${KEY}"`)) problems.push(`${code}: no ${KEY}`);
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

fs.writeFileSync(FILE, src);
console.log(`authored ${KEY} in ${LANGS.length} dictionaries`);
