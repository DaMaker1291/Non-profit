// One-shot: the paper grade band "Pass" is a word, not a grade symbol, so it
// must be translated. Anchored after each `pp.grade` line; aborts unless 15/15.
import fs from "node:fs";

const PASS = {
  en: "Pass", es: "Aprobado", fr: "Admis", pt: "Aprovado", ar: "ناجح",
  sw: "Ufaulu", hi: "उत्तीर्ण", id: "Lulus", tl: "Pasado", de: "Bestanden",
  ja: "合格", zh: "及格", fa: "قبولی", ur: "کامیاب", bn: "উত্তীর্ণ",
};

const src = fs.readFileSync("lib/i18n.ts", "utf8");
const lines = src.split("\n");
const declRe = /^(?:export )?const (\w+): Dict = \{$/;
const out = [];
let idx = -1;
let done = 0;
const order = [];
for (const line of lines) {
  const d = line.match(declRe);
  if (d) { idx++; order.push(d[1]); }
  out.push(line);
  if (idx < 0) continue;
  if (/^\s*"pp\.grade":/.test(line)) {
    const code = order[idx];
    if (!PASS[code]) throw new Error(`no pp.gradePass for ${code}`);
    out.push(`  "pp.gradePass": ${JSON.stringify(PASS[code])},`);
    done++;
  }
}
if (done !== 15) throw new Error(`pp.gradePass inserted ${done}/15`);
fs.writeFileSync("lib/i18n.ts", out.join("\n"));
console.log(`pp.gradePass ×${done}`);
