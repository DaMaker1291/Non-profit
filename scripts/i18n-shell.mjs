// One-shot i18n: THE APP SHELL (§global shell, §accessibility).
//
// The shell added a real concept search to the top bar, a five-item phone bar
// with a "More" tab, and a skip link — because a sidebar plus a bottom bar is a
// lot of chrome to tab past before reaching the work. All three are
// learner-facing controls, so all three are keys in all fifteen dictionaries
// rather than English literals: a search box whose placeholder is English tells
// a Hindi learner the interface is not really theirs, and a bottom tab is the
// most-read label in the product.
//
// Three keys, anchored beside `nav.moreAria`, which every dictionary already
// carries and which belongs to the same family.
//
// Run: node scripts/i18n-shell.mjs
// Idempotent PER KEY: a key that is already present is skipped and the rest are
// still written, so extending this list later does not duplicate what is there.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"nav.moreAria"';
const KEYS = ["nav.search", "nav.more", "a11y.skip"];

// Keyed BY LANGUAGE CODE and then BY KEY, resolved by locating each dictionary
// by NAME — never by position. The dictionaries in lib/i18n.ts are not in
// `LANGS` order (the draft block de, ja, zh, fa, ur sits between `tl` and `bn`),
// so pairing text with dictionary by index silently writes Urdu into German and
// nothing crashes. Same trap, same avoidance as scripts/i18n-feedback.mjs.
const TEXT = {
  en: { "nav.search": "Search concepts", "nav.more": "More", "a11y.skip": "Skip to the work" },
  es: { "nav.search": "Buscar conceptos", "nav.more": "Más", "a11y.skip": "Ir al ejercicio" },
  fr: { "nav.search": "Rechercher un concept", "nav.more": "Plus", "a11y.skip": "Aller à l'exercice" },
  pt: { "nav.search": "Buscar conceitos", "nav.more": "Mais", "a11y.skip": "Ir ao exercício" },
  ar: { "nav.search": "ابحث عن المفاهيم", "nav.more": "المزيد", "a11y.skip": "انتقل إلى التمرين" },
  sw: { "nav.search": "Tafuta dhana", "nav.more": "Zaidi", "a11y.skip": "Nenda kwenye zoezi" },
  hi: { "nav.search": "अवधारणाएँ खोजें", "nav.more": "अधिक", "a11y.skip": "सीधे अभ्यास पर जाएँ" },
  id: { "nav.search": "Cari konsep", "nav.more": "Lainnya", "a11y.skip": "Langsung ke latihan" },
  tl: { "nav.search": "Maghanap ng konsepto", "nav.more": "Higit pa", "a11y.skip": "Dumiretso sa gawain" },
  ur: { "nav.search": "تصورات تلاش کریں", "nav.more": "مزید", "a11y.skip": "سیدھا مشق پر جائیں" },
  fa: { "nav.search": "جست‌وجوی مفاهیم", "nav.more": "بیشتر", "a11y.skip": "رفتن به تمرین" },
  de: { "nav.search": "Begriffe suchen", "nav.more": "Mehr", "a11y.skip": "Direkt zur Aufgabe" },
  ja: { "nav.search": "概念を検索", "nav.more": "その他", "a11y.skip": "演習へ進む" },
  zh: { "nav.search": "搜索概念", "nav.more": "更多", "a11y.skip": "跳到练习" },
  bn: { "nav.search": "ধারণা খুঁজুন", "nav.more": "আরও", "a11y.skip": "সরাসরি অনুশীলনে যান" },
};

const CODES = Object.keys(TEXT);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const [code, texts] of Object.entries(TEXT)) {
  const missing = KEYS.filter((k) => typeof texts[k] !== "string" || !texts[k]);
  if (missing.length) throw new Error(`${code}: no text for ${missing.join(", ")}`);
}

const src = fs.readFileSync(FILE, "utf8");
const TODO = KEYS.filter((k) => !src.includes(`"${k}"`));
if (TODO.length === 0) {
  console.log("shell keys already present — nothing to do");
  process.exit(0);
}
console.log(`adding ${TODO.join(", ")} to ${CODES.length} dictionaries`);

const lines = src.split("\n");
const insertions = [];
for (const code of CODES) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no \`const ${code}: Dict = {\` in ${FILE}`);
  const end = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  const stop = end < 0 ? lines.length : end;
  const idx = lines.findIndex((l, i) => i > start && i < stop && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  insertions.push({
    at: idx + 1,
    lines: TODO.map((key) => {
      const escaped = TEXT[code][key].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `${indent}"${key}": "${escaped}",`;
    }),
  });
}
if (new Set(insertions.map((i) => i.at)).size !== insertions.length) {
  throw new Error("two languages resolved to the same anchor — refusing to write");
}
// Bottom-up by LINE: discovery order says nothing about line order here.
insertions.sort((a, b) => b.at - a.at);
for (const ins of insertions) lines.splice(ins.at, 0, ...ins.lines);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${CODES.length * TODO.length} strings (${TODO.length} keys × ${CODES.length} languages) to ${FILE}`);
