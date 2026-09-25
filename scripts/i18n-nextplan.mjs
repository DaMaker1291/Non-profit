// One-shot: the "how" and "why now" half of the next-step decision.
//   plan.<kind>  — the block labels a session is described with
//   next.how     — the label before the plan
//   next.whyNow  — the label before the deadline sentence
// Anchored after each `next.why` line; aborts unless 15/15.
import fs from "node:fs";

const T = {
  en: { how: "How:", whyNow: "Why now:", learn: "explanation", retrieve: "retrieval", practise: "practice", remediate: "targeted practice", transfer: "transfer", exam: "exam question", project: "project" },
  es: { how: "Cómo:", whyNow: "Por qué ahora:", learn: "explicación", retrieve: "repaso", practise: "práctica", remediate: "práctica dirigida", transfer: "transferencia", exam: "pregunta de examen", project: "proyecto" },
  fr: { how: "Comment :", whyNow: "Pourquoi maintenant :", learn: "explication", retrieve: "révision", practise: "entraînement", remediate: "entraînement ciblé", transfer: "transfert", exam: "question d'examen", project: "projet" },
  pt: { how: "Como:", whyNow: "Por que agora:", learn: "explicação", retrieve: "revisão", practise: "prática", remediate: "prática direcionada", transfer: "transferência", exam: "questão de prova", project: "projeto" },
  ar: { how: "كيف:", whyNow: "لماذا الآن:", learn: "شرح", retrieve: "استرجاع", practise: "تدريب", remediate: "تدريب موجَّه", transfer: "نقل المهارة", exam: "سؤال امتحان", project: "مشروع" },
  sw: { how: "Vipi:", whyNow: "Kwa nini sasa:", learn: "maelezo", retrieve: "ukumbusho", practise: "mazoezi", remediate: "mazoezi lengwa", transfer: "uhamishaji", exam: "swali la mtihani", project: "mradi" },
  hi: { how: "कैसे:", whyNow: "अभी क्यों:", learn: "व्याख्या", retrieve: "पुनःस्मरण", practise: "अभ्यास", remediate: "लक्षित अभ्यास", transfer: "स्थानांतरण", exam: "परीक्षा प्रश्न", project: "परियोजना" },
  id: { how: "Caranya:", whyNow: "Mengapa sekarang:", learn: "penjelasan", retrieve: "pengulangan", practise: "latihan", remediate: "latihan terarah", transfer: "transfer", exam: "soal ujian", project: "proyek" },
  tl: { how: "Paano:", whyNow: "Bakit ngayon:", learn: "paliwanag", retrieve: "pagbabalik-tanaw", practise: "pagsasanay", remediate: "nakatutok na pagsasanay", transfer: "transfer", exam: "tanong sa pagsusulit", project: "proyekto" },
  de: { how: "Wie:", whyNow: "Warum jetzt:", learn: "Erklärung", retrieve: "Abruf", practise: "Übung", remediate: "gezielte Übung", transfer: "Transfer", exam: "Prüfungsaufgabe", project: "Projekt" },
  ja: { how: "進め方：", whyNow: "なぜ今：", learn: "解説", retrieve: "復習", practise: "練習", remediate: "狙い撃ち練習", transfer: "転移", exam: "試験問題", project: "プロジェクト" },
  zh: { how: "怎么做：", whyNow: "为什么是现在：", learn: "讲解", retrieve: "复习", practise: "练习", remediate: "针对性练习", transfer: "迁移", exam: "考题", project: "项目" },
  fa: { how: "چگونه:", whyNow: "چرا اکنون:", learn: "توضیح", retrieve: "مرور", practise: "تمرین", remediate: "تمرین هدفمند", transfer: "انتقال", exam: "پرسش امتحان", project: "پروژه" },
  ur: { how: "کیسے:", whyNow: "ابھی کیوں:", learn: "وضاحت", retrieve: "دہرائی", practise: "مشق", remediate: "ہدفی مشق", transfer: "منتقلی", exam: "امتحانی سوال", project: "منصوبہ" },
  bn: { how: "কীভাবে:", whyNow: "এখনই কেন:", learn: "ব্যাখ্যা", retrieve: "পুনরালোচনা", practise: "অনুশীলন", remediate: "লক্ষ্যভিত্তিক অনুশীলন", transfer: "স্থানান্তর", exam: "পরীক্ষার প্রশ্ন", project: "প্রকল্প" },
};

const KEYS = ["how", "whyNow", "learn", "retrieve", "practise", "remediate", "transfer", "exam", "project"];
const NAME = { how: "next.how", whyNow: "next.whyNow", learn: "plan.learn", retrieve: "plan.retrieve", practise: "plan.practise", remediate: "plan.remediate", transfer: "plan.transfer", exam: "plan.exam", project: "plan.project" };

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
  if (/^\s*"next\.why":/.test(line)) {
    const code = order[idx];
    const row = T[code];
    if (!row) throw new Error(`no plan translations for ${code}`);
    for (const k of KEYS) {
      if (!row[k]) throw new Error(`${code} is missing ${k}`);
      out.push(`  "${NAME[k]}": ${JSON.stringify(row[k])},`);
    }
    done++;
  }
}
if (done !== 15) throw new Error(`inserted into ${done}/15 dictionaries`);
fs.writeFileSync("lib/i18n.ts", out.join("\n"));
console.log(`${KEYS.length} keys × ${done} dictionaries = ${KEYS.length * done} strings`);
