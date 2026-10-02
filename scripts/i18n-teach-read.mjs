// One-shot i18n: THE CLASS LIST A TEACHER COULD NOT READ.
//
// §24 asks every important operation to have LOADING / SUCCESS / EMPTY / ERROR
// / RETRY, and to never turn a failed request into "no evidence". The teacher's
// two reads (the roster and the assignment monitor) did exactly that: a bad
// response returned silently, so an expired session or a 500 rendered as an
// empty class list and "No work set yet." — a failure dressed as good news on
// the one screen whose job is to say who needs help. They now report into the
// product's own error state (components/states.tsx, which already owns
// `common.error` and `common.retry`), and this is the one sentence that state
// needs: what could not be read, with the status code beside it.
//
// Located BY DICTIONARY NAME, one insertion per language, like every other
// one-shot i18n script here (a positional pairing once wrote Urdu into German —
// see scripts/i18n-feedback.mjs).
//
// Run: node scripts/i18n-teach-read.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"teach.studentsOne"';
const KEY = "teach.readFailed";

const TEXT = {
  en: "We could not read your classes just now.",
  es: "No hemos podido leer tus clases ahora mismo.",
  fr: "Nous n'avons pas pu lire vos classes pour le moment.",
  pt: "Não foi possível ler as suas turmas agora.",
  ar: "لم نتمكن من قراءة فصولك الآن.",
  sw: "Hatukuweza kusoma madarasa yako sasa hivi.",
  hi: "हम अभी आपकी कक्षाएँ पढ़ नहीं सके।",
  id: "Kami tidak dapat membaca kelas Anda saat ini.",
  tl: "Hindi namin mabasa ang iyong mga klase ngayon.",
  ur: "ہم ابھی آپ کی کلاسز نہیں پڑھ سکے۔",
  fa: "هیچ‌اکنون نتوانستیم کلاس‌های شما را بخوانیم.",
  de: "Wir konnten Ihre Klassen gerade nicht lesen.",
  ja: "いまクラスを読み込めませんでした。",
  zh: "暂时无法读取你的班级。",
  bn: "আমরা এইমাত্র আপনার ক্লাসগুলো পড়তে পারিনি।",
};

const CODES = Object.keys(TEXT);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const code of CODES) {
  if (typeof TEXT[code] !== "string" || !TEXT[code]) throw new Error(`${code}: missing ${KEY}`);
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEY}"`)) {
  console.log("teach.readFailed already present — nothing to do");
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
