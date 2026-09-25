// One-shot: two keys the paper surfaces need to stop reading wrong.
//   an.qsOne   — "1 question", not "1 questions"
//   pp.pickLead — the second use of pp.lead on /papers is a different sentence
// Anchored per dictionary so each value lands in the right language; aborts
// unless all 15 dictionaries took both.
import fs from "node:fs";

const QS_ONE = {
  en: "question", es: "pregunta", fr: "question", pt: "questão", ar: "سؤال",
  sw: "swali", hi: "प्रश्न", id: "soal", tl: "tanong", de: "Aufgabe",
  ja: "問", zh: "题", fa: "پرسش", ur: "سوال", bn: "প্রশ্ন",
};
const PICK_LEAD = {
  en: "Pick your subject, then sit the whole paper in one sitting.",
  es: "Elige tu materia y resuelve el examen entero de una vez.",
  fr: "Choisissez votre matière, puis faites le sujet entier d'un seul tenant.",
  pt: "Escolha a matéria e faça a prova inteira de uma vez.",
  ar: "اختر مادتك ثم أكمل الورقة كاملة في جلسة واحدة.",
  sw: "Chagua somo lako, kisha fanya mtihani wote kwa mkupuo mmoja.",
  hi: "अपना विषय चुनें, फिर पूरा पेपर एक ही बैठक में हल करें।",
  id: "Pilih mata pelajaranmu, lalu kerjakan seluruh kertas dalam satu sesi.",
  tl: "Piliin ang asignatura, tapos sagutan ang buong papel sa isang upuan.",
  de: "Wähle dein Fach und schreibe die ganze Klausur in einem Zug.",
  ja: "科目を選び、紙全体を一度に解きます。",
  zh: "选择科目，然后一次性完成整份试卷。",
  fa: "درس خود را انتخاب کنید، سپس کل برگه را در یک نشست پاسخ دهید.",
  ur: "اپنا مضمون منتخب کریں، پھر پورا پرچہ ایک ہی نشست میں حل کریں۔",
  bn: "বিষয় বাছুন, তারপর পুরো প্রশ্নপত্র এক বসায় শেষ করুন।",
};

const j = (s) => JSON.stringify(s);
const src = fs.readFileSync("lib/i18n.ts", "utf8");
const lines = src.split("\n");
const declRe = /^(?:export )?const (\w+): Dict = \{$/;
const out = [];
let idx = -1;
let qsDone = 0;
let pickDone = 0;
const seenOrder = [];

for (const line of lines) {
  const d = line.match(declRe);
  if (d) { idx++; seenOrder.push(d[1]); }
  out.push(line);
  if (idx < 0) continue;
  const code = seenOrder[idx];
  if (/^\s*"an\.qs":/.test(line)) {
    if (!QS_ONE[code]) throw new Error(`no an.qsOne for ${code}`);
    out.push(`  "an.qsOne": ${j(QS_ONE[code])},`);
    qsDone++;
  }
  if (/^\s*"pp\.pick":/.test(line)) {
    if (!PICK_LEAD[code]) throw new Error(`no pp.pickLead for ${code}`);
    out.push(`  "pp.pickLead": ${j(PICK_LEAD[code])},`);
    pickDone++;
  }
}

if (idx + 1 !== 15) throw new Error(`expected 15 dictionaries, found ${idx + 1}`);
if (qsDone !== 15) throw new Error(`an.qsOne inserted ${qsDone}/15`);
if (pickDone !== 15) throw new Error(`pp.pickLead inserted ${pickDone}/15`);

fs.writeFileSync("lib/i18n.ts", out.join("\n"));
console.log(`an.qsOne ×${qsDone}, pp.pickLead ×${pickDone} across ${idx + 1} dictionaries`);
