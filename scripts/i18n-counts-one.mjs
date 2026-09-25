// One-shot: the "why" line reads "1 attempts · 3 hints used". The engine has no
// plural machinery, so the singular needs its own key. Anchored after each
// `next.ev.hints` line; aborts unless 15/15.
import fs from "node:fs";

const T = {
  en: { attemptsOne: "attempt", hintsOne: "hint used" },
  es: { attemptsOne: "intento", hintsOne: "pista usada" },
  fr: { attemptsOne: "essai", hintsOne: "indice utilisé" },
  pt: { attemptsOne: "tentativa", hintsOne: "dica usada" },
  ar: { attemptsOne: "محاولة", hintsOne: "تلميح مستخدم" },
  sw: { attemptsOne: "jaribio", hintsOne: "kidokezo kilichotumika" },
  hi: { attemptsOne: "प्रयास", hintsOne: "संकेत लिया" },
  id: { attemptsOne: "percobaan", hintsOne: "petunjuk dipakai" },
  tl: { attemptsOne: "pagtatangka", hintsOne: "hint na ginamit" },
  de: { attemptsOne: "Versuch", hintsOne: "Hinweis genutzt" },
  ja: { attemptsOne: "回", hintsOne: "ヒント使用" },
  zh: { attemptsOne: "次", hintsOne: "用了提示" },
  fa: { attemptsOne: "تلاش", hintsOne: "راهنمای استفاده‌شده" },
  ur: { attemptsOne: "کوشش", hintsOne: "اشارہ استعمال" },
  bn: { attemptsOne: "প্রচেষ্টা", hintsOne: "সূত্র ব্যবহার" },
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
  if (/^\s*"next\.ev\.hints":/.test(line)) {
    const code = order[idx];
    const row = T[code];
    if (!row?.attemptsOne || !row?.hintsOne) throw new Error(`no singular labels for ${code}`);
    out.push(`  "next.ev.attemptsOne": ${JSON.stringify(row.attemptsOne)},`);
    out.push(`  "next.ev.hintsOne": ${JSON.stringify(row.hintsOne)},`);
    done++;
  }
}
if (done !== 15) throw new Error(`inserted into ${done}/15 dictionaries`);
fs.writeFileSync("lib/i18n.ts", out.join("\n"));
console.log(`2 singular labels × ${done} dictionaries = ${done * 2} strings`);
