// One-shot i18n: THE STATE A LEARNER'S RECORD IS ACTUALLY IN.
//
// Retention used to be a rate and a band: a learner who had just failed a due
// review read "Retention · Developing · 0/1" — honest, but a word that cannot
// tell them apart from someone partway there. The state is now named by one
// rule (lib/proof.ts#retentionState), which reads the LATEST delayed recall's
// outcome rather than the ratio, because "held at day 3, lost by day 7" and
// "lost at day 3, held by day 7" have identical counts and opposite states.
//
// Two keys, all fifteen dictionaries, located BY DICTIONARY NAME — a positional
// pairing once wrote Urdu into German (see scripts/i18n-feedback.mjs). The third
// state, `unmeasured`, deliberately reuses the product's existing words for an
// absence (`teach.unmeasured`) so "not yet measured" reads the same everywhere.
//
// Run: node scripts/i18n-recall-state.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"prf.retained"';
const KEYS = ["rst.retained", "rst.forgotten"];

const TEXT = {
  en: { "rst.retained": "Retained", "rst.forgotten": "Forgotten" },
  es: { "rst.retained": "Retenido", "rst.forgotten": "Olvidado" },
  fr: { "rst.retained": "Retenu", "rst.forgotten": "Oublié" },
  pt: { "rst.retained": "Retido", "rst.forgotten": "Esquecido" },
  ar: { "rst.retained": "محتفظ به", "rst.forgotten": "منسٍي" },
  sw: { "rst.retained": "Imehifadhiwa", "rst.forgotten": "Imesahaulika" },
  hi: { "rst.retained": "स्मृति में सुरक्षित", "rst.forgotten": "भूल गए" },
  id: { "rst.retained": "Masih diingat", "rst.forgotten": "Terlupakan" },
  tl: { "rst.retained": "Natatandaan pa", "rst.forgotten": "Nakalimutan" },
  ur: { "rst.retained": "یاد باقی", "rst.forgotten": "بھول گئے" },
  fa: { "rst.retained": "به یاد مانده", "rst.forgotten": "فراموش شده" },
  de: { "rst.retained": "Behalten", "rst.forgotten": "Vergessen" },
  ja: { "rst.retained": "保持されている", "rst.forgotten": "忘れている" },
  zh: { "rst.retained": "仍记得", "rst.forgotten": "已遗忘" },
  bn: { "rst.retained": "মনে আছে", "rst.forgotten": "ভুলে গেছেন" },
};

const CODES = Object.keys(TEXT);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const code of CODES) {
  for (const k of KEYS) {
    if (typeof TEXT[code][k] !== "string" || !TEXT[code][k]) throw new Error(`${code}: missing ${k}`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEYS[0]}"`)) {
  console.log("recall-state keys already present — nothing to do");
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
  insertions.push({
    at: idx + 1,
    lines: KEYS.map((k) => `${indent}"${k}": "${TEXT[code][k].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",`),
  });
}
const seen = new Set();
for (const ins of insertions) {
  if (seen.has(ins.at)) throw new Error(`two insertions resolve to line ${ins.at} — refusing to write`);
  seen.add(ins.at);
}
insertions.sort((a, b) => b.at - a.at);
for (const ins of insertions) lines.splice(ins.at, 0, ...ins.lines);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${CODES.length * KEYS.length} strings (${KEYS.length} keys × ${CODES.length} languages) to ${FILE}`);
