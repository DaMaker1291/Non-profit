// One-shot i18n: ONE STUDENT IS NOT "1 STUDENTS".
//
// The teacher's class header and class card read `{n} {t("teach.students")}`,
// so the commonest class in the product — a teacher who has just created one and
// had one child join — read "1 students" on their own dashboard. There is no
// plural machinery in lib/i18n.ts; the established answer (see
// components/own-paper.tsx, and the 15-language `an.qsOne` / `own.savedOne` /
// `next.ev.attemptsOne` / `next.ev.hintsOne` keys) is a sibling key for the
// singular, selected at the call site.
//
// Japanese, Chinese and Bengali are deliberately IDENTICAL to the plural: none
// of the three marks plurals on a noun, so "1 名学生" / "1 名の生徒" /
// "১ শিক্ষার্থী" are already correct and inventing a distinction there would be
// the error.
//
// Located BY DICTIONARY NAME, one insertion per language — a positional pairing
// once wrote Urdu into German (see scripts/i18n-feedback.mjs).
//
// Run: node scripts/i18n-teacher-one.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"teach.students"';
const KEY = "teach.studentsOne";

const TEXT = {
  en: "student",
  es: "estudiante",
  fr: "élève",
  pt: "aluno",
  ar: "طالب",
  sw: "mwanafunzi",
  hi: "छात्र",
  id: "siswa",
  tl: "mag-aaral",
  ur: "طالب علم",
  fa: "دانش‌آموز",
  de: "Schüler",
  ja: "名の生徒",
  zh: "名学生",
  bn: "শিক্ষার্থী",
};

const CODES = Object.keys(TEXT);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const code of CODES) {
  if (typeof TEXT[code] !== "string" || !TEXT[code]) throw new Error(`${code}: missing ${KEY}`);
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEY}"`)) {
  console.log("teach.studentsOne already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. */
function dictRange(code) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  return [start, next < 0 ? lines.length : next];
}

const insertions = [];
for (const code of CODES) {
  const [start, end] = dictRange(code);
  const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  insertions.push({ at: idx + 1, line: `${indent}"${KEY}": "${TEXT[code].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",` });
}
const seen = new Set();
for (const ins of insertions) {
  if (seen.has(ins.at)) throw new Error(`two insertions resolve to line ${ins.at} — refusing to write`);
  seen.add(ins.at);
}
insertions.sort((a, b) => b.at - a.at);
for (const ins of insertions) lines.splice(ins.at, 0, ins.line);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${CODES.length} strings (${KEY} × ${CODES.length} languages) to ${FILE}`);
