// One-shot i18n: the PER-SUBJECT COURSE strings.
//
// A learner sits one qualification per subject, so enrolment and /curriculum ask
// for a course per subject and the next-step card refuses to plan work from a
// course nobody chose. Three sentences carry that, and each is authored in all
// 15 dictionaries here, following the convention of the other one-shot scripts
// (i18n-adaptive.mjs, i18n-assignments.mjs, i18n-room-focus.mjs): insert the
// keys beside their sibling in every dictionary. A runtime English fallback
// would ship half-English in fourteen languages, which is why there is not one.
//
// Run: node scripts/i18n-courses.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"asg.title"';

/** Language order as the dictionaries appear in lib/i18n.ts — en, es, fr, pt,
 *  ar, sw, hi, id, fil, de, ja, zh, fa, ur, bn. */
const TEXTS = [
  ["en", [
    "needs a course",
    "Choose your course first",
    "OpenMind will not plan work from a qualification you have not chosen.",
  ]],
  ["es", [
    "necesita un curso",
    "Elige primero tu curso",
    "OpenMind no planificará trabajo con una titulación que no hayas elegido.",
  ]],
  ["fr", [
    "a besoin d'un cursus",
    "Choisis d'abord ton cursus",
    "OpenMind ne planifiera pas de travail à partir d'un cursus que tu n'as pas choisi.",
  ]],
  ["pt", [
    "precisa de um curso",
    "Escolhe primeiro o teu curso",
    "O OpenMind não vai planear trabalho a partir de um curso que não escolheste.",
  ]],
  ["ar", [
    "بحاجة إلى مقرر",
    "اختر مقررك أولًا",
    "لن يخطّط OpenMind لعمل مبني على مؤهل لم تختره.",
  ]],
  ["sw", [
    "inahitaji kozi",
    "Chagua kozi yako kwanza",
    "OpenMind haitapanga kazi kwa kutumia kwalifikasheni usiyoichagua.",
  ]],
  ["hi", [
    "कोर्स चाहिए",
    "पहले अपना कोर्स चुनें",
    "OpenMind ऐसी योग्यता से काम की योजना नहीं बनाएगा जिसे तुमने चुना ही नहीं।",
  ]],
  ["id", [
    "butuh kursus",
    "Pilih kursusmu dulu",
    "OpenMind tidak akan merencanakan pekerjaan dari kualifikasi yang belum kamu pilih.",
  ]],
  ["fil", [
    "kailangan ng kurso",
    "Piliin muna ang kurso mo",
    "Hindi magpaplano ang OpenMind ng gawain mula sa kwalipikasyong hindi mo pinili.",
  ]],
  ["de", [
    "braucht einen Kurs",
    "Wähle zuerst deinen Kurs",
    "OpenMind plant keine Arbeit auf Grundlage eines Abschlusses, den du nicht gewählt hast.",
  ]],
  ["ja", [
    "コースが必要です",
    "先にコースを選んでください",
    "選んでいない資格にもとづいて OpenMind が学習を組み立てることはありません。",
  ]],
  ["zh", [
    "需要选择课程",
    "请先选择你的课程",
    "OpenMind 不会根据你尚未选择的资格来安排学习内容。",
  ]],
  ["fa", [
    "به دوره نیاز دارد",
    "نخست دورهٔ خود را برگزین",
    "OpenMind بر پایهٔ مدرکی که برنگزیدهای کار برنامهریزی نمیکند.",
  ]],
  ["ur", [
    "کورس درکار ہے",
    "پہلے اپنا کورس منتخب کریں",
    "OpenMind ایسی قابلیت سے کام کی منصوبہ بندی نہیں کرے گا جو آپ نے منتخب نہ کی ہو۔",
  ]],
  ["bn", [
    "কোর্স দরকার",
    "আগে তোমার কোর্স বেছে নাও",
    "তুমি যে যোগ্যতা বেছে নাওনি, তার ভিত্তিতে OpenMind কাজের পরিকল্পনা করবে না।",
  ]],
];

const KEYS = ["onb.courseNeed", "next.courseFirst", "next.courseFirstNote"];

for (const [lang, texts] of TEXTS) {
  if (texts.length !== KEYS.length) {
    throw new Error(`${lang}: ${texts.length} texts for ${KEYS.length} keys — refusing to write a half dictionary`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"next.courseFirst"')) {
  console.log("course keys already present — nothing to do");
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
  const [lang, texts] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const added = texts.map((text, k) => {
    const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${indent}"${KEYS[k]}": "${escaped}",`;
  });
  lines.splice(anchors[i] + 1, 0, ...added);
  console.log(`${lang}: added ${added.length}`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
