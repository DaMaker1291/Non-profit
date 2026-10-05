// One-shot i18n: the accessible name of the learner's context strip.
//
// WHY. The whole strip is DATA — a country name, a qualification, a board, a
// year group, a subject and its tier — joined with "·". Nothing in it needs
// translating, which is exactly why it needs one translated label: read aloud,
// it is a run of bare nouns with no relation between them ("United Kingdom ·
// GCSE · AQA · Year 11 · Mathematics Higher tier" tells a screen-reader user
// nothing about what those words ARE).
//
// One key, authored by hand in all fifteen dictionaries, same convention as
// every other one-shot script: assert completeness, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling this belongs beside in every dictionary. */
const ANCHOR = '"footer.brand"';

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUE = {
  en: "Your country, course, board, year and subject",
  es: "Tu país, curso, junta, año y asignatura",
  fr: "Votre pays, programme, examen, année et matière",
  pt: "Seu país, curso, banca, ano e disciplina",
  ar: "بلدك ومنهجك ومجلسك وسنتك ومادتك",
  sw: "Nchi yako, mtaala, bodi, mwaka na somo lako",
  hi: "आपका देश, पाठ्यक्रम, बोर्ड, वर्ष और विषय",
  id: "Negara, kurikulum, board, tahun, dan mapelmu",
  tl: "Iyong bansa, kurikulum, board, taon at asignatura",
  de: "Dein Land, Lehrplan, Prüfungsausschuss, Jahrgang und Fach",
  ja: "あなたの国・課程・試験機関・学年・科目",
  zh: "你的国家、课程、考试体系、年级和科目",
  fa: "کشور، برنامه، هیئت آزمون، پایه و درس تو",
  ur: "آپ کا ملک، نصاب، بورڈ، سال اور مضمون",
  bn: "আপনার দেশ, পাঠ্যক্রম, বোর্ড, বছর ও বিষয়",
};

const KEY = "ctx.aria";

let src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEY}"`)) {
  console.log("already applied — nothing to do");
  process.exit(0);
}

/** The [start, end) span of one dictionary's object literal. Found by plain
 *  string search — a RegExp here needs so much escaping that it once refused to
 *  match its own dictionary. */
function dictSpan(code) {
  const needle = `const ${code}: Dict = {`;
  let at = -1;
  for (const prefix of ["\n", "\nexport "]) {
    const i = src.indexOf(`${prefix}${needle}`);
    if (i >= 0) { at = i + prefix.length; break; }
  }
  if (at < 0 && src.startsWith(needle)) at = 0;
  if (at < 0) throw new Error(`dictionary ${code} not found`);
  const end = src.indexOf("\n};", at);
  if (end < 0) throw new Error(`dictionary ${code} has no terminator`);
  return [at, end];
}

const problems = [];
for (const code of LANGS) {
  if (typeof VALUE[code] !== "string" || !VALUE[code].trim()) problems.push(`${KEY}: no value for ${code}`);
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
  const line = `${indent}"${KEY}": ${JSON.stringify(VALUE[code])},`;
  block = block.slice(0, lineEnd) + "\n" + line + block.slice(lineEnd);
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
