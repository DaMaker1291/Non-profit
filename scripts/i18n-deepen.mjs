// One-shot i18n: DEEPER WORK WHERE TRANSFER IS IMPOSSIBLE.
//
// The re-framers (lib/transfer.ts) understand one question shape. For every
// other concept the product used to promise transfer and deliver a harder draw
// of the same form — the label said "the same idea, unfamiliar wording" for a
// question that never left its own wording. Two things now say what actually
// happened:
//
//   learn.deepenStage  — the exercise header, beside learn.transferStage
//   next.reason.deepen — the engine's own "why this?" line, beside the
//                        transfer reason the decision reads from
//   sess.deepProve     — the button that starts this stage, beside the
//                        "prove it on an unfamiliar question" it replaces for
//                        concepts that have no unfamiliar version
//
// Two keys, all fifteen dictionaries, located BY DICTIONARY NAME. The
// dictionaries in lib/i18n.ts are not in `LANGS` order (the draft block de, ja,
// zh, fa, ur sits between tl and bn), so a positional pairing silently writes
// Urdu into German. See scripts/i18n-feedback.mjs, where that was caught.
//
// Run: node scripts/i18n-deepen.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";

const GROUPS = [
  { anchor: '"learn.transferStage"', keys: ["learn.deepenStage"] },
  { anchor: '"next.reason.transfer"', keys: ["next.reason.deepen"] },
  { anchor: '"sess.prove"', keys: ["sess.deepProve"] },
];

const TEXT = {
  en: {
    "sess.deepProve": "Prove it on the hardest version",
    "learn.deepenStage": "Deeper — the hardest form of this idea",
    "next.reason.deepen": "You are secure here — and this idea has no re-worded version, so this is the hardest form of the same question.",
  },
  es: {
    "sess.deepProve": "Demuéstralo en la versión más difícil",
    "learn.deepenStage": "Más profundo: la forma más difícil de esta idea",
    "next.reason.deepen": "Aquí ya eres sólido, y esta idea no tiene versión reformulada: esta es la forma más difícil de la misma pregunta.",
  },
  fr: {
    "sess.deepProve": "Prouve-le sur la version la plus difficile",
    "learn.deepenStage": "Approfondissement : la forme la plus difficile de cette idée",
    "next.reason.deepen": "Tu es solide ici, et cette idée n'a pas de version reformulée : c'est la forme la plus difficile de la même question.",
  },
  pt: {
    "sess.deepProve": "Prova-o na versão mais difícil",
    "learn.deepenStage": "Aprofundar: a forma mais difícil desta ideia",
    "next.reason.deepen": "Estás sólido aqui, e esta ideia não tem versão reformulada: esta é a forma mais difícil da mesma pergunta.",
  },
  ar: {
    "sess.deepProve": "أثبته في أصعب صيغة",
    "learn.deepenStage": "تعميق — أصعب صيغة لهذه الفكرة",
    "next.reason.deepen": "أنت متمكن هنا، وهذه الفكرة ليس لها صيغة معاد صياغتها، فهذه أصعب صيغة للسؤال نفسه.",
  },
  sw: {
    "sess.deepProve": "Ithibitishe kwa muundo mgumu zaidi",
    "learn.deepenStage": "Kina — muundo mgumu zaidi wa dhana hii",
    "next.reason.deepen": "Umethibitika hapa, na dhana hii haina muundo ulioandikwa upya — huu ni muundo mgumu zaidi wa swali lilelile.",
  },
  hi: {
    "sess.deepProve": "इसे सबसे कठिन रूप में सिद्ध करें",
    "learn.deepenStage": "गहराई — इस विचार का सबसे कठिन रूप",
    "next.reason.deepen": "यहाँ आप पक्के हैं, और इस विचार का बदला हुआ रूप नहीं है — यह उसी प्रश्न का सबसे कठिन रूप है।",
  },
  id: {
    "sess.deepProve": "Buktikan pada versi tersulit",
    "learn.deepenStage": "Lebih dalam — bentuk tersulit dari gagasan ini",
    "next.reason.deepen": "Kamu sudah mantap di sini, dan gagasan ini tidak punya versi kalimat lain — ini bentuk tersulit dari soal yang sama.",
  },
  tl: {
    "sess.deepProve": "Patunayan sa pinakamahirap na anyo",
    "learn.deepenStage": "Mas malalim — pinakamahirap na anyo ng ideyang ito",
    "next.reason.deepen": "Matatag ka na rito, at walang ibang pananalita ang ideyang ito — ito ang pinakamahirap na anyo ng parehong tanong.",
  },
  ur: {
    "sess.deepProve": "اسے مشکل ترین صورت میں ثابت کریں",
    "learn.deepenStage": "مزید گہرائی — اس تصور کی مشکل ترین صورت",
    "next.reason.deepen": "آپ یہاں پختہ ہیں، اور اس تصور کی کوئی بدلی ہوئی صورت نہیں — یہ اسی سوال کی مشکل ترین صورت ہے۔",
  },
  fa: {
    "sess.deepProve": "آن را در سخت‌ترین شکل اثبات کن",
    "learn.deepenStage": "عمیق‌تر — سخت‌ترین شکل این مفهوم",
    "next.reason.deepen": "اینجا مسلط هستی، و این مفهوم نسخهٔ بازنویسی‌شده ندارد — این سخت‌ترین شکل همان پرسش است.",
  },
  de: {
    "sess.deepProve": "Beweise es in der schwierigsten Form",
    "learn.deepenStage": "Vertiefung — die schwierigste Form dieser Idee",
    "next.reason.deepen": "Hier bist du sicher, und diese Idee hat keine umformulierte Fassung — das ist die schwierigste Form derselben Aufgabe.",
  },
  ja: {
    "sess.deepProve": "最も難しい形で証明する",
    "learn.deepenStage": "深化 — この考えの最も難しい形",
    "next.reason.deepen": "ここは確実です。この考えには言い換えた形がないため、同じ問題の最も難しい形を出します。",
  },
  zh: {
    "sess.deepProve": "在最难的形式上证明",
    "learn.deepenStage": "加深 — 这一概念最难的形式",
    "next.reason.deepen": "这里你已经稳固，而这个概念没有改写版本，所以这是同一道题最难的形式。",
  },
  bn: {
    "sess.deepProve": "সবচেয়ে কঠিন রূপে এটি প্রমাণ করুন",
    "learn.deepenStage": "গভীরতর — এই ধারণার সবচেয়ে কঠিন রূপ",
    "next.reason.deepen": "এখানে আপনি দৃঢ়, আর এই ধারণার কোনো পুনর্লিখিত রূপ নেই — এটি একই প্রশ্নের সবচেয়ে কঠিন রূপ।",
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
if (src.includes('"sess.deepProve"')) {
  console.log("deeper-stage keys already present — nothing to do");
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
