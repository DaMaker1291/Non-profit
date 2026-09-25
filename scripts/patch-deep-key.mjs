// One-shot: the prerequisite-chain depth unit shown on the genome map
// ("3 deep"), and the rooms page's hardcoded "Tutor" speaker label (which can
// reuse the existing tutor.title key). Only the depth word needs a new key.
import fs from "node:fs";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];
const K = {
  "map.deep": ["deep", "de profundidad", "de profondeur", "de profundidade", "عمقًا", "kina", "गहरा", "kedalaman", "kalaliman", "tief", "階層", "层", "عمق", "گہرائی", "গভীর"],
};

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
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v[col])},`);
  if (!lines.length) continue;
  out = out.slice(0, end) + "\n  // ── misc labels ──\n" + lines.join("\n") + out.slice(end);
  added += lines.length;
}
fs.writeFileSync("lib/i18n.ts", out);
console.log(`added ${added} keys`);
