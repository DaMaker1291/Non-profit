// One-shot recon dump.
import fs from "node:fs";

// --- genome rows: [id, stage, title, blurb, ...] ---
const gsrc = fs.readFileSync("lib/genome.ts", "utf8");
const rowRe = /\[\s*"([a-z0-9-]+)",\s*\d+,\s*"([^"]*)",\s*"([^"]*)"/g;
let m, rows = [];
while ((m = rowRe.exec(gsrc))) rows.push([m[1], m[2], m[3]]);
console.log(`=== CONCEPTS ${rows.length} ===`);
for (const [id, t, b] of rows) console.log(`${id}|${t}|${b}`);

// --- misconceptions ---
const msrc = fs.readFileSync("lib/misconceptions.ts", "utf8");
console.log(`=== MISC-FIELDS (first entry) ===`);
const first = msrc.slice(msrc.indexOf("{"), msrc.indexOf("}") + 1);
console.log(first.slice(0, 900));

// --- per-dict key coverage ---
console.log("=== DICT COVERAGE ===");
const isrc = fs.readFileSync("lib/i18n.ts", "utf8");
const declRe = /^(?:export )?const (\w+): Dict = \{$/gm;
const decls = [];
let d;
while ((d = declRe.exec(isrc))) decls.push({ name: d[1], at: d.index });
decls.forEach((dic, i) => {
  const end = i + 1 < decls.length ? decls[i + 1].at : isrc.length;
  const block = isrc.slice(dic.at, end);
  const c = (p) => (block.match(new RegExp(`"${p}`, "g")) || []).length;
  console.log(`${dic.name}: soc=${c("soc.")} hint=${c("hint.")} mcp=${c("mcp.")} cn=${c("cn.")} mc=${c("mc.")} cb=${c("cb.")}`);
});
