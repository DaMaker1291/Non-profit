// One-shot i18n: the 53 `mc.<id>` names, in ENGLISH.
//
// The hole this closes is asymmetric and easy to miss: all fourteen non-English
// dictionaries carry a `mc.<id>` name for every belief in the catalogue, and
// the SOURCE language carries none. Everything that reads a belief through
// `mcName()` looks fine — it falls back to the catalogue's authored English —
// but the next-step engine composes its remediation sentence with a bare
// `t("mc." + id)` (lib/next-engine.ts), and a key no dictionary defines renders
// as its own name. So an English learner was shown:
//
//   You can do the steps, but "mc.sf-sig" keeps recurring — let's repair that slip.
//
// Adding the names here is the fix in the direction the repo's i18n rule points
// (every learner-visible string has a key in every dictionary). The values are
// the CATALOGUE'S OWN NAMES, read out of lib/misconceptions.ts rather than
// retyped, so English cannot drift from the catalogue that detects the belief.
//
// The engine was also hardened so this class of bug cannot reach a learner
// again: see `beliefName` in lib/next-engine.ts, which falls back to the
// catalogue instead of the raw key.
//
// Run: node scripts/i18n-misconception-names.mjs   (idempotent)
import fs from "node:fs";

const CATALOGUE = "lib/misconceptions.ts";
const FILE = "lib/i18n.ts";
const EN_HEAD = "const en: Dict = {";

const pairs = [];
const src = fs.readFileSync(CATALOGUE, "utf8");
for (const m of src.matchAll(/\{ id: "([^"]+)", name: "([^"]+)"/g)) {
  pairs.push([m[1], m[2]]);
}
if (pairs.length < 40) {
  throw new Error(`parsed only ${pairs.length} beliefs from ${CATALOGUE} — refusing to write a partial dictionary`);
}

const dict = fs.readFileSync(FILE, "utf8");
// "Is this key present" MUST be asked of one DICTIONARY, not of the file: the
// other fourteen already carry every `mc.*` key, so a whole-file search answers
// yes for English too and the script silently adds nothing (which is exactly
// what its first run did).
const blocks = dict.split(/^const ([A-Za-z]+): Dict = \{$/m);
const langs = [];
for (let i = 1; i < blocks.length; i += 2) langs.push([blocks[i], blocks[i + 1].split(/^\};$/m)[0]]);
const enBlock = langs.find(([code]) => code === "en");
if (!enBlock) throw new Error(`no \`const en: Dict = {\` block found in ${FILE}`);
if (pairs.every(([id]) => enBlock[1].includes(`"mc.${id}"`))) {
  console.log("mc.* names already in every dictionary — nothing to do");
  process.exit(0);
}

// The keys must be missing from ENGLISH ONLY. A locale that lacks one too needs
// a translation, which is a different job from this script — say so loudly
// rather than filling it with English.
const notEn = langs.filter(([code]) => code !== "en");
const alsoMissing = [];
for (const [code, body] of notEn) {
  for (const [id] of pairs) {
    if (!body.includes(`"mc.${id}"`)) alsoMissing.push(`${code}: mc.${id}`);
  }
}
if (alsoMissing.length) {
  throw new Error(
    `${alsoMissing.length} mc.* keys are missing from a NON-English dictionary, ` +
    `which needs real translations rather than this script:\n  ${alsoMissing.slice(0, 12).join("\n  ")}`,
  );
}

const lines = dict.split("\n");
const head = lines.findIndex((l) => l.trim() === EN_HEAD);
if (head < 0) throw new Error(`${EN_HEAD} not found in ${FILE}`);

const missing = pairs.filter(([id]) => !enBlock[1].includes(`"mc.${id}"`));
const added = missing.map(([id, name]) => `  "mc.${id}": ${JSON.stringify(name)},`);
lines.splice(head + 1, 0, ...added);
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`added ${missing.length} mc.* names to English (${pairs.length} beliefs in the catalogue)`);
