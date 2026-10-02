// One-shot i18n: the diagnostic REPORT needs a heading of its own.
//
// WHY. `diag.done` — "Finish diagnostic" — does two jobs. On the last question
// it is the button that ends the sitting, which is right. On the report it is
// the <h1>, which is wrong: the learner has already finished, and the screen
// that should say what it measured instead titles itself with the instruction
// they just followed. Found by walking the first run: after 12 questions the
// report opened under the heading "Finish diagnostic".
//
// So the report gets a heading that names the screen, and the button keeps the
// one that names the action. One key, fifteen dictionaries, authored by hand
// like every other string a learner reads — same convention as the other
// one-shot scripts: assert completeness, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling this belongs beside in every dictionary — the string it stops
 *  the report from borrowing. */
const ANCHOR = '"diag.done"';
const KEY = "diag.report";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUES = {
  en: "Your diagnostic results",
  es: "Los resultados de tu diagnóstico",
  fr: "Les résultats de votre diagnostic",
  pt: "Os resultados do seu diagnóstico",
  ar: "نتائج تشخيصك",
  sw: "Matokeo ya uchunguzi wako",
  hi: "आपके निदान के परिणाम",
  id: "Hasil diagnostikmu",
  tl: "Mga resulta ng iyong diagnostic",
  de: "Die Ergebnisse deiner Diagnose",
  ja: "診断の結果",
  zh: "你的诊断结果",
  fa: "نتایج تشخیص شما",
  ur: "آپ کی تشخیص کے نتائج",
  bn: "আপনার ডায়াগনস্টিকের ফলাফল",
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
  // A heading carries no placeholders: a title that renders "{fields}" to a
  // learner is worse than the label it replaced.
  else if (/\{[a-z]+\}/.test(v)) problems.push(`${code}: a placeholder in a heading`);
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
