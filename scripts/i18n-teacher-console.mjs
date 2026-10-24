// One-shot i18n: the teaching console's four new labels.
//
// The console now opens on a LIST of classes and opens one class at a time with
// its jobs behind tabs, so it needs two kinds of word it did not have: a name
// for the list ("Your classes") and three short tab labels. The tab labels are
// SHORT on purpose — "Class roster" and "Assigned work" already exist as
// headings, and a tab bar built from them wraps into two rows on a phone — and
// they are new keys rather than truncations of those headings, because a
// truncated heading is a different sentence in most of these languages.
//
// Located BY DICTIONARY NAME, one insertion per language — a positional pairing
// once wrote Urdu into German (see scripts/i18n-feedback.mjs):
// scripts/i18n-teacher-one.mjs established that rule and this follows it.
//
// Run: node scripts/i18n-teacher-console.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"teach.title"';
const KEYS = ["teach.classes", "teach.tabStudents", "teach.tabWork", "teach.tabWeek"];

/** [classes, students, work, this week] per language. */
const TEXT = {
  en: ["Your classes", "Students", "Work", "This week"],
  es: ["Tus clases", "Estudiantes", "Trabajo", "Esta semana"],
  fr: ["Vos classes", "Élèves", "Travail", "Cette semaine"],
  pt: ["As suas turmas", "Alunos", "Trabalho", "Esta semana"],
  ar: ["صفوفك", "الطلاب", "العمل", "هذا الأسبوع"],
  sw: ["Madarasa yako", "Wanafunzi", "Kazi", "Wiki hii"],
  hi: ["आपकी कक्षाएँ", "छात्र", "कार्य", "इस सप्ताह"],
  id: ["Kelas Anda", "Siswa", "Tugas", "Minggu ini"],
  tl: ["Iyong mga klase", "Mga mag-aaral", "Gawain", "Ngayong linggo"],
  de: ["Deine Klassen", "Schüler", "Aufgaben", "Diese Woche"],
  ja: ["あなたのクラス", "生徒", "課題", "今週"],
  zh: ["你的班级", "学生", "作业", "本周"],
  fa: ["کلاس‌های شما", "دانش‌آموزان", "کار", "این هفته"],
  ur: ["آپ کی کلاسیں", "طلبہ", "کام", "اس ہفتے"],
  bn: ["আপনার ক্লাস", "শিক্ষার্থী", "কাজ", "এই সপ্তাহে"],
};

const CODES = Object.keys(TEXT);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const code of CODES) {
  if (!Array.isArray(TEXT[code]) || TEXT[code].length !== KEYS.length) throw new Error(`${code}: expected ${KEYS.length} strings`);
  for (const s of TEXT[code]) if (typeof s !== "string" || !s) throw new Error(`${code}: an empty string`);
}

const src = fs.readFileSync(FILE, "utf8");
if (KEYS.every((k) => src.includes(`"${k}"`))) {
  console.log("the console labels are already present — nothing to do");
  process.exit(0);
}
const half = KEYS.filter((k) => src.includes(`"${k}"`));
if (half.length) throw new Error(`a partial insertion exists (${half.join(", ")}) — refusing to guess which languages are missing`);

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. */
function dictRange(code) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  return [start, next < 0 ? lines.length : next];
}

const escape = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const insertions = [];
for (const code of CODES) {
  const [start, end] = dictRange(code);
  const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  KEYS.forEach((key, k) => {
    insertions.push({ at: idx + 1 + k, line: `${indent}"${key}": "${escape(TEXT[code][k])}",` });
  });
}
const seen = new Set();
for (const ins of insertions) {
  if (seen.has(ins.at)) throw new Error(`two insertions resolve to line ${ins.at} — refusing to write`);
  seen.add(ins.at);
}
insertions.sort((a, b) => b.at - a.at);
for (const ins of insertions) lines.splice(ins.at, 0, ins.line);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${KEYS.length * CODES.length} strings (${KEYS.join(", ")} × ${CODES.length} languages) to ${FILE}`);
