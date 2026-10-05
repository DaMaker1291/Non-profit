// One-shot i18n: the tier select's own placeholder.
//
// WHY. The course step seeded the tier from `pick.levels[0]` whenever the year
// group named no tier — and `levels[0]` is Foundation for the GCSE, so a learner
// who chose "GCSE" (and nothing else) was quietly enrolled at the easier tier,
// served at its difficulty and taught at its depth. That is the "the questions
// are too easy" complaint with a cause. Silence is not a choice: the step now
// leaves a real tier choice empty, names it as the field it is waiting for, and
// keeps `Next` closed until the learner answers it. An empty select needs an
// option to say so in the learner's own language.
//
// One key, fifteen dictionaries, authored by hand like every other string a
// learner reads. Same convention as the other one-shot scripts: assert
// completeness, refuse to write twice.
//
// The tier labels themselves (`lvl.foundation` …) already exist; this is the
// verb "choose one", and it is inserted beside `onb.level`, the field's own
// label, so the pair reads as one control.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling this belongs beside in every dictionary. */
const ANCHOR = '"onb.level"';
const KEY = "onb.pickLevel";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUES = {
  en: "Choose a tier",
  es: "Elige un nivel",
  fr: "Choisis un niveau",
  pt: "Escolhe um nível",
  ar: "اختر المستوى",
  sw: "Chagua ngazi",
  hi: "स्तर चुनें",
  id: "Pilih tingkat",
  tl: "Pumili ng antas",
  de: "Stufe wählen",
  ja: "レベルを選択",
  zh: "选择层次",
  fa: "یک سطح انتخاب کنید",
  ur: "سطح منتخب کریں",
  bn: "স্তর বাছুন",
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
  if (typeof VALUES[code] !== "string" || !VALUES[code].trim()) problems.push(`no value for ${code}`);
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
