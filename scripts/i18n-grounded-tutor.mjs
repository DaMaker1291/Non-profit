// One-shot i18n: the grounded Socratic reply's three new sentences.
//
// lib/socratic.ts's offline fallback is now grounded in the moment — the
// question on screen, the practice engine's own serve reason, and the
// misconception patterns this learner's own answers triggered. Three new
// learner-visible strings carry that grounding, and none may exist in English
// only (the repo's i18n rule: every learner-visible state has an explicit key
// in every supported locale — no runtime English fallback).
//
// Same convention as scripts/i18n-tutor.mjs: hand-written translations,
// anchored on an existing key that appears exactly once per dictionary, insert
// beside the sibling soc.* keys. Run: node scripts/i18n-grounded-tutor.mjs
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"soc.stuckLead"';

/** Language order as the dictionaries appear in lib/i18n.ts — en, es, fr, pt,
 *  ar, sw, hi, id, fil, de, ja, zh, fa, ur, bn. */
const TEXTS = [
  ["en", "Look at the question on your screen", "OpenMind served this one to", "Your recorded answers here triggered"],
  ["es", "Mira la pregunta en tu pantalla", "OpenMind te dio esta porque", "Tus respuestas registradas activaron"],
  ["fr", "Regarde la question à l'écran", "OpenMind t'a proposé celle-ci pour", "Tes réponses enregistrées ont déclenché"],
  ["pt", "Olhe a pergunta na sua tela", "A OpenMind serviu esta porque", "Suas respostas registradas acionaram"],
  ["ar", "انظر إلى السؤال على شاشتك", "قدّم أوبن مايند هذا السؤال لأن", "أجابتك المسجّلة أظهرت"],
  ["sw", "Angalia swali kwenye skrini yako", "OpenMind ilikupa hili kwa sababu", "Majibu yako yaliyorekodiwa yameonyesha"],
  ["hi", "अपनी स्क्रीन पर दिए प्रश्न को देखें", "OpenMind ने यह प्रश्न दिया क्योंकि", "आपके दर्ज उत्तरों ने दिखाया"],
  ["id", "Lihat soal di layarmu", "OpenMind memberikan ini karena", "Jawaban tercatatmu memunculkan"],
  ["fil", "Tingnan ang tanong sa iyong screen", "Ibinigay ng OpenMind ito dahil", "Ipinakita ng mga naitala mong sagot"],
  ["de", "Blick auf die Aufgabe auf deinem Bildschirm", "OpenMind hat dir diese gestellt, weil", "Deine aufgezeichneten Antworten haben ausgelöst"],
  ["ja", "画面の問題を見てみましょう", "OpenMind がこの問題を出した理由は", "あなたの記録された解答から浮かび上がったのは"],
  ["zh", "看看屏幕上的这道题", "OpenMind 出这道题是因为", "你的答题记录触发了"],
  ["fa", "به سؤال روی صفحه‌ات نگاه کن", "اوپن‌مایند این سؤال را داد زیرا", "پاسخ‌های ثبت‌شده‌ات نشان داد"],
  ["ur", "اسکرین پر دیے گئے سوال کو دیکھیں", "OpenMind نے یہ سوال دیا کیونکہ", "آپ کے ریکارڈ شدہ جوابات نے ظاہر کیا"],
  ["bn", "আপনার স্ক্রিনের প্রশ্নটি দেখুন", "OpenMind এই প্রশ্নটি দিয়েছে কারণ", "আপনার রেকর্ড করা উত্তরগুলো দেখিয়েছে"],
];

const KEYS = ["soc.onScreen", "soc.serveWhy", "soc.ownSlips"];

const src = fs.readFileSync(FILE, "utf8");
if (KEYS.every((k) => src.includes(`"${k}"`))) {
  console.log("soc.onScreen / soc.serveWhy / soc.ownSlips already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const anchors = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(ANCHOR)) anchors.push(i);
if (anchors.length !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ANCHOR} anchors, found ${anchors.length} — refusing to guess which dictionary is which`);
}

// Insert from the BOTTOM so earlier indices stay valid.
for (let i = anchors.length - 1; i >= 0; i--) {
  const [lang, onScreen, serveWhy, ownSlips] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const block = [
    `${indent}"soc.onScreen": ${JSON.stringify(onScreen)},`,
    `${indent}"soc.serveWhy": ${JSON.stringify(serveWhy)},`,
    `${indent}"soc.ownSlips": ${JSON.stringify(ownSlips)},`,
  ];
  lines.splice(anchors[i], 0, ...block);
}

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`added ${KEYS.join(", ")} to ${TEXTS.length} dictionaries`);
