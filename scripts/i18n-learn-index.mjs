// One-shot i18n: the LEARN index needs a lead of its own.
//
// WHY. `/learn` had no page at all, so the first thing fixing it needs is the
// one sentence that tells a learner what the screen is for. Every existing
// candidate was a misquote: `learn.notStarted` is about a subject with no work
// yet (it stays the lead for exactly that case), `curr.sub` is about choosing a
// qualification, and `next.oneThing` is the Help page's opening line. Reusing
// one of them here would put a sentence on screen that says something the
// screen is not.
//
// One key, fifteen dictionaries, authored by hand like every other string a
// learner reads — same convention as the other one-shot scripts: assert
// completeness, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling this belongs beside in every dictionary — the string it takes
 *  over from when the learner already has work. */
const ANCHOR = '"learn.notStarted"';
const KEY = "learn.pickSubject";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUES = {
  en: "Pick a subject to keep working on.",
  es: "Elige una asignatura para seguir trabajando.",
  fr: "Choisissez une matière pour continuer à travailler.",
  pt: "Escolha uma disciplina para continuar a estudar.",
  ar: "اختر مادة لمواصلة العمل عليها.",
  sw: "Chagua somo la kuendelea kufanyia kazi.",
  hi: "काम जारी रखने के लिए एक विषय चुनें।",
  id: "Pilih mata pelajaran untuk terus dikerjakan.",
  tl: "Pumili ng asignatura para ipagpatuloy.",
  de: "Wähle ein Fach, an dem du weiterarbeiten möchtest.",
  ja: "続けて取り組む教科を選んでください。",
  zh: "选择一门科目继续学习。",
  fa: "یک درس را برای ادامه کار انتخاب کنید.",
  ur: "کام جاری رکھنے کے لیے ایک مضمون منتخب کریں۔",
  bn: "কাজ চালিয়ে যেতে একটি বিষয় বেছে নিন।",
};

let src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEY}"`)) {
  console.log("already applied — nothing to do");
  process.exit(0);
}

/** The span of one dictionary literal, found by plain string search: the
 *  declaration ends in an opening brace, and a brace that must be escaped
 *  differently in three layers of quoting is a bug waiting to happen. */
function dictSpan(code) {
  const at = src.indexOf(`const ${code}: Dict = {`);
  if (at < 0) throw new Error(`dictionary ${code} not found`);
  const end = src.indexOf("\n};", at);
  if (end < 0) throw new Error(`dictionary ${code} has no terminator`);
  return [at, end];
}

const problems = [];

for (const code of LANGS) {
  const v = VALUES[code];
  if (typeof v !== "string" || !v.trim()) problems.push(`no value for ${code}`);
  // A lead line carries no placeholders: one that renders "{fields}" to a
  // learner is worse than the sentence it replaced.
  else if (/\{[a-z]+[a-zA-Z0-9_]*\}/.test(v)) problems.push(`${code}: a placeholder in a lead`);
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

// One pass per language, re-slicing `src` each time so the offsets stay true.
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
