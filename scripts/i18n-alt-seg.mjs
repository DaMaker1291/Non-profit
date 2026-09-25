// One-shot: the NEW belief's name (`mc.alt-seg`).
//
// `alt-seg` was added to the misconception catalogue — the alternate segment
// theorem misapplied — but a catalogue entry is only half a learner-facing
// fact: the name a learner reads comes from `mc.<id>` in their own dictionary
// (English falls back to the catalogue's own name, which is why only the other
// 14 locales need the key). Without it, `npm run verify`'s "names every
// misconception" contract fails in every non-English language, and a learner
// meeting this belief would read a raw `mc.alt-seg` key.
//
// Same rule as every other one-shot here: every learner-visible string has an
// explicit translation in all 15 languages, never a runtime English fallback.
import fs from "node:fs";

// Non-English locales, in the dictionary order of lib/i18n.ts (English reads
// the catalogue directly — see `mcName` in lib/content-i18n).
const LANGS = ["es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const K = {
  "mc.alt-seg": [
    "Aplica mal el teorema del segmento alterno",
    "Applique mal le théorème du segment alterné",
    "Aplica mal o teorema do segmento alterno",
    "يسيء تطبيق نظرية القطعة البديلة",
    "Kutumia vibaya nadharia ya sehemu mbadala",
    "एकांतर वृत्तखंड प्रमेय का गलत प्रयोग",
    "Salah menerapkan teorema segmen bergantian",
    "Maling paggamit ng alternate segment theorem",
    "Wendet den Sehnentangentenwinkelsatz falsch an",
    "接弦定理の誤用",
    "误用弦切角定理",
    "قضیهٔ زاویهٔ مماس و وتر را اشتباه به کار می‌برد",
    "متبادل قطعہ نظریہ کا غلط استعمال",
    "বিকল্প বৃত্তাংশ উপপাদ্যের ভুল প্রয়োগ",
  ],
};

for (const [k, v] of Object.entries(K)) {
  if (v.length !== LANGS.length) throw new Error(`${k}: ${v.length} values for ${LANGS.length} languages`);
}

const declRe = /^(?:export )?const (\w+): Dict = \{$/gm;
let out = fs.readFileSync("lib/i18n.ts", "utf8");
let added = 0;
for (const lang of LANGS) {
  declRe.lastIndex = 0;
  const decls = []; let d;
  while ((d = declRe.exec(out))) decls.push({ name: d[1], start: d.index });
  const idx = decls.findIndex((x) => x.name === lang);
  if (idx < 0) { console.error(`no dictionary for ${lang}`); process.exit(1); }
  const start = decls[idx].start;
  const rel = out.slice(start).match(/\n[ \t]*\};/);
  if (!rel) { console.error(`${lang}: closing brace not found`); process.exit(1); }
  const end = start + rel.index;
  const have = new Set([...out.slice(start, end).matchAll(/"([a-zA-Z0-9._-]+)":/g)].map((m) => m[1]));
  const col = LANGS.indexOf(lang);
  const lines = Object.entries(K)
    .filter(([k]) => !have.has(k))
    .map(([k, v]) => `  "${k}": ${JSON.stringify(v[col])},`);
  if (lines.length === 0) continue;
  out = out.slice(0, end) + "\n" + lines.join("\n") + out.slice(end);
  added += lines.length;
}
fs.writeFileSync("lib/i18n.ts", out);
console.log(`added ${added} strings (${Object.keys(K).length} keys × ${LANGS.length} languages)`);
