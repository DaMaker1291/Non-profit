// Find which cb.* blurb key each content dict is missing (expected 135 each).
import fs from "node:fs";
const isrc = fs.readFileSync("lib/i18n.ts", "utf8");
const gsrc = fs.readFileSync("lib/genome.ts", "utf8");
const ids = [...gsrc.matchAll(/\[\s*"([a-z0-9-]+)",\s*\d+,\s*"[^"]*",\s*"[^"]*"/g)].map((m) => m[1]);
const declRe = /^(?:export )?const (\w+): Dict = \{$/gm;
const decls = [];
let d;
while ((d = declRe.exec(isrc))) decls.push({ name: d[1], at: d.index });
decls.forEach((dic, i) => {
  if (!["es", "fr", "pt", "ar", "sw", "hi", "id"].includes(dic.name)) return;
  const end = i + 1 < decls.length ? decls[i + 1].at : isrc.length;
  const block = isrc.slice(dic.at, end);
  const missing = ids.filter((id) => !block.includes(`"cb.${id}"`));
  console.log(`${dic.name}: missing ${missing.length ? missing.join(",") : "none"}`);
});
