// One-shot i18n: A CLAIM IS NOT A REQUEST (§11).
//
// The tutor had two shapes for a learner's sentence — wanting the answer, and
// wanting a next step — so a learner who stated a METHOD ("I think you add the
// two numbers together") got one of those two replies, identical to the one
// given to a learner who said nothing about a method at all. The engine now
// reads the claim back and asks them to test it, which needs a lead and a
// question, in every dictionary.
//
// Two keys, all fifteen dictionaries, located BY DICTIONARY NAME. See
// scripts/i18n-feedback.mjs for the index-pairing trap that rule exists for.
//
// Run: node scripts/i18n-claim.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";

const GROUPS = [
  { anchor: '"soc.refuse"', keys: ["soc.claimLead", "soc.claimQ"] },
];

const TEXT = {
  en: {
    "soc.claimLead": "You have given me a method — let's test it rather than trust it",
    "soc.claimQ": "Which line of it would change if you put a small number in place of the letter — and would the answer still hold?",
  },
  es: {
    "soc.claimLead": "Me has dado un método: vamos a comprobarlo en lugar de fiarnos de él",
    "soc.claimQ": "¿Qué línea cambiaría si pusieras un número pequeño en lugar de la letra, y seguiría saliendo la respuesta?",
  },
  fr: {
    "soc.claimLead": "Tu me donnes une méthode — vérifions-la plutôt que de lui faire confiance",
    "soc.claimQ": "Quelle ligne changerait si tu remplaçais la lettre par un petit nombre — et le résultat tiendrait-il ?",
  },
  pt: {
    "soc.claimLead": "Deste-me um método — vamos testá-lo em vez de confiar nele",
    "soc.claimQ": "Que linha mudaria se pusesses um número pequeno no lugar da letra — e a resposta continuaria a valer?",
  },
  ar: {
    "soc.claimLead": "أعطيتني طريقة — لنختبرها بدل أن نثق بها",
    "soc.claimQ": "أي سطر منها سيتغير لو وضعت رقمًا صغيرًا بدل الحرف — وهل سيبقى الجواب صحيحًا؟",
  },
  sw: {
    "soc.claimLead": "Umenipa mbinu — tui jaribu badala ya kuiamini",
    "soc.claimQ": "Mstari upi utabadilika ukiweka nambari ndogo badala ya herufi — na jibu litabaki sahihi?",
  },
  hi: {
    "soc.claimLead": "आपने एक तरीका बताया है — भरोसा करने के बजाय उसे जाँचें",
    "soc.claimQ": "अक्षर की जगह कोई छोटी संख्या रखने पर कौन-सी पंक्ति बदलेगी — और क्या उत्तर तब भी सही रहेगा?",
  },
  id: {
    "soc.claimLead": "Kamu memberi cara pengerjaan — mari uji, bukan percaya begitu saja",
    "soc.claimQ": "Baris mana yang berubah jika hurufnya diganti angka kecil — dan apakah jawabannya tetap berlaku?",
  },
  tl: {
    "soc.claimLead": "Binigyan mo ako ng paraan — subukan natin ito sa halip na paniwalaan",
    "soc.claimQ": "Aling linya ang magbabago kung papalitan ng maliit na numero ang titik — at mananatili kaya ang sagot?",
  },
  ur: {
    "soc.claimLead": "آپ نے طریقہ بتایا ہے — بھروسے کے بجائے اسے آزمائیں",
    "soc.claimQ": "حرف کی جگہ چھوٹی عدد رکھنے پر کون سی سطر بدلے گی — اور کیا جواب پھر بھی درست رہے گا؟",
  },
  fa: {
    "soc.claimLead": "روشی به من دادی — بیا آن را بیازماییم، نه اینکه به آن اعتماد کنیم",
    "soc.claimQ": "اگر به‌جای حرف عدد کوچکی بگذاری کدام سطر عوض می‌شود — و آیا پاسخ همچنان درست می‌ماند؟",
  },
  de: {
    "soc.claimLead": "Du hast mir einen Weg gegeben — prüfen wir ihn, statt ihm zu vertrauen",
    "soc.claimQ": "Welche Zeile würde sich ändern, wenn du die Zahl statt des Buchstabens klein wählst — und bliebe das Ergebnis gültig?",
  },
  ja: {
    "soc.claimLead": "解き方を示してくれたね — 信じるのではなく、確かめてみよう",
    "soc.claimQ": "文字の代わりに小さな数を入れたら、どの行が変わる？　それでも答えは成り立つ？",
  },
  zh: {
    "soc.claimLead": "你给出了一个方法——我们先检验它，而不是直接相信它",
    "soc.claimQ": "把字母换成一个小数字后，哪一行会变？答案还成立吗？",
  },
  bn: {
    "soc.claimLead": "তুমি একটি পদ্ধতি দিয়েছ — বিশ্বাস না করে সেটি যাচাই করি",
    "soc.claimQ": "অক্ষরের জায়গায় ছোট সংখ্যা বসালে কোন লাইনটি বদলাবে — আর উত্তরটি কি তখনও ঠিক থাকবে?",
  },
};

const CODES = Object.keys(TEXT);
const ALL_KEYS = GROUPS.flatMap((g) => g.keys);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const code of CODES) {
  for (const k of ALL_KEYS) {
    if (typeof TEXT[code][k] !== "string" || !TEXT[code][k]) throw new Error(`${code}: missing ${k}`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"soc.claimLead"')) {
  console.log("claim keys already present — nothing to do");
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
for (const group of GROUPS) {
  for (const code of CODES) {
    const [start, end] = dictRange(code);
    const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(group.anchor));
    if (idx < 0) throw new Error(`${code}: no ${group.anchor} inside its own dictionary`);
    const indent = lines[idx].match(/^\s*/)[0];
    insertions.push({
      at: idx + 1,
      lines: group.keys.map((k) => `${indent}"${k}": "${TEXT[code][k].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",`),
    });
  }
}
const seen = new Set();
for (const ins of insertions) {
  if (seen.has(ins.at)) throw new Error(`two groups resolve to line ${ins.at} — refusing to write`);
  seen.add(ins.at);
}
insertions.sort((a, b) => b.at - a.at);
for (const ins of insertions) lines.splice(ins.at, 0, ...ins.lines);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${CODES.length * ALL_KEYS.length} strings (${ALL_KEYS.length} keys × ${CODES.length} languages) to ${FILE}`);
