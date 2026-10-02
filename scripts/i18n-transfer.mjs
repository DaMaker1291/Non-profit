// One-shot i18n: THE GENERIC SECOND SURFACE.
//
// The inverse surface used to understand one question shape — a one-unknown
// equation — and its prompt said so ("Which equation has the solution"). It now
// re-frames ANY concept whose questions have valued answers and readable stems:
// the learner is shown a value and four REAL questions, one of which produces
// it. So the key changes from an equation-specific frame to a generic one.
//
// One key in, one key out, per dictionary, located BY NAME:
//
//   - tr.inverseLead  → removed (nothing references it: the surface that used
//                       it is built by lib/transfer.ts, which now asks for
//                       tr.whichAnswer)
//   - tr.whichAnswer  → added beside it, in the same slot
//
// The prompt is composed as `${value} — ${lead}?` so the value reads first in
// every language and the frame stays a question fragment that each language can
// end its own way. See scripts/i18n-feedback.mjs for the index-pairing trap the
// by-name lookup exists to avoid.
//
// Run: node scripts/i18n-transfer.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"tr.inverseLead"';
const KEY = "tr.whichAnswer";

const TEXT = {
  en: "which of these questions gives this answer",
  es: "¿cuál de estas preguntas da este resultado",
  fr: "laquelle de ces questions donne ce résultat",
  pt: "qual destas perguntas dá este resultado",
  ar: "أي من هذه الأسئلة يعطي هذا الجواب",
  sw: "swali lipi kati ya haya linatoa jibu hili",
  hi: "इनमें से कौन-सा प्रश्न यह उत्तर देता है",
  id: "soal mana di antara ini yang menghasilkan jawaban ini",
  tl: "aling tanong sa mga ito ang nagbibigay ng sagot na ito",
  ur: "ان میں سے کون سا سوال یہ جواب دیتا ہے",
  fa: "کدام‌یک از این پرسش‌ها این پاسخ را می‌دهد",
  de: "welche dieser Aufgaben ergibt dieses Ergebnis",
  ja: "この答えになるのはどれ",
  zh: "哪一道题的答案是这个",
  bn: "এর মধ্যে কোন প্রশ্নটি এই উত্তর দেয়",
};

const CODES = Object.keys(TEXT);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const code of CODES) {
  if (typeof TEXT[code] !== "string" || !TEXT[code]) throw new Error(`${code}: missing text`);
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEY}"`)) {
  console.log(`${KEY} already present — nothing to do`);
  process.exit(0);
}
if (!src.includes(ANCHOR)) throw new Error(`no ${ANCHOR} to replace`);

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. */
function dictRange(code) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  return [start, next < 0 ? lines.length : next];
}

const ops = [];
for (const code of CODES) {
  const [start, end] = dictRange(code);
  const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  ops.push({ at: idx, line: null, label: code });
  ops.push({
    at: idx + 1,
    line: `${indent}"${KEY}": "${TEXT[code].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",`,
    label: code,
  });
}
// Bottom-up so each index stays valid: the insertion (idx+1) is spliced before
// the deletion (idx) of the line it sits after.
ops.sort((a, b) => b.at - a.at);
for (const op of ops) {
  if (op.line === null) lines.splice(op.at, 1);
  else lines.splice(op.at, 0, op.line);
}

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${CODES.length} strings ("${KEY}") and removed ${CODES.length} ("tr.inverseLead") in ${FILE}`);
