// One-shot i18n, second pass: the disclosure the individual learner view owes
// its reader (`tl.recordOnly`).
//
// WHY IT EXISTS. A teacher asked to inspect "the student's actual answers"
// deserves to be told what the record actually holds: the concept, the
// outcome, how it was done and what it proved — never the item text and never
// the working. The learner's own evidence view is built on the same fact (the
// ledger stores no question text), and a teacher who is not told would
// reasonably assume the screen is merely incomplete.
//
// Same convention and same guard as its sibling: anchor on a key that must
// appear exactly fifteen times, author by hand, refuse to guess.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"tl.recent"';

const TEXTS = [
  ["en", "The record keeps the concept, the outcome and what it proved — never the question or the student's working."],
  ["es", "El registro guarda el concepto, el resultado y lo que demostró, nunca la pregunta ni el trabajo del estudiante."],
  ["fr", "L'enregistrement garde le concept, le résultat et ce qu'il a prouvé — jamais l'énoncé ni la copie de l'élève."],
  ["pt", "O registo guarda o conceito, o resultado e o que provou — nunca a pergunta nem o trabalho do aluno."],
  ["ar", "يحتفظ السجل بالمفهوم والنتيجة وما أثبتته — لا نصَّ السؤال ولا ورقة الطالب."],
  ["sw", "Rekodi huhifadhi dhana, matokeo na kile ilichothibitisha — si swali wala kazi ya mwanafunzi."],
  ["hi", "रिकॉर्ड में अवधारणा, परिणाम और जो सिद्ध हुआ वही रहता है — प्रश्न या छात्र का काम नहीं।"],
  ["id", "Catatan menyimpan konsep, hasil, dan apa yang dibuktikan — bukan soalnya atau pekerjaan siswa."],
  ["tl", "Itinatago ng rekord ang konsepto, resulta at ang napatunayan — hindi ang tanong o ang gawa ng mag-aaral."],
  ["de", "Der Datensatz hält Konzept, Ergebnis und was es belegt hat fest — nie die Aufgabe oder die Arbeit der Lernenden."],
  ["ja", "記録に残るのは概念・結果・何を証明したかだけで、問題文や学習者の解答そのものは残りません。"],
  ["zh", "记录保存的是概念、结果和它证明了什么——不包括题目或学生的作答。"],
  ["fa", "سابقه فقط مفهوم، نتیجه و آنچه اثبات شده را نگه می‌دارد — نه صورت سؤال و نه نوشتهٔ دانش‌آموز."],
  ["ur", "ریکارڈ میں تصور، نتیجہ اور جو ثابت ہوا وہی رہتا ہے — نہ سوال اور نہ طالبِ علم کا حل۔"],
  ["bn", "রেকর্ডে থাকে ধারণা, ফলাফল ও যা প্রমাণিত হয়েছে — প্রশ্ন বা শিক্ষার্থীর উত্তরপত্র নয়।"],
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"tl.recordOnly"')) {
  console.log("tl.recordOnly already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const anchors = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(ANCHOR)) anchors.push(i);
if (anchors.length !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ANCHOR} anchors, found ${anchors.length} — refusing to guess which dictionary is which`);
}

for (let i = anchors.length - 1; i >= 0; i--) {
  const [lang, text] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const value = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.splice(anchors[i] + 1, 0, `${indent}"tl.recordOnly": "${value}",`);
  console.log(`${lang}: +tl.recordOnly`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
