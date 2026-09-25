// One-shot: add the honest teaching-note key (lq.teachNote) to all 15
// dictionaries, inserted right after each `lq.teaching` line.
import fs from "node:fs";

const NOTE = {
  en: "Concept names, blurbs and misconception names render natively; full lesson paragraphs and generated questions are English-authored.",
  es: "Los nombres de conceptos, las descripciones y los nombres de errores comunes se muestran en tu idioma; las lecciones completas y las preguntas generadas siguen en inglés.",
  fr: "Les noms de notions, les résumés et les noms d'erreurs courantes s'affichent dans votre langue ; les leçons complètes et les questions générées restent en anglais.",
  pt: "Nomes de conceitos, resumos e nomes de erros comuns aparecem no seu idioma; lições completas e perguntas geradas ainda estão em inglês.",
  ar: "أسماء المفاهيم والملخصات وأسماء الأخطاء الشائعة تظهر بلغتك؛ الدروس الكاملة والأسئلة المولَّدة ما زالت بالإنجليزية.",
  sw: "Majina ya dhana, maelezo mafupi na majina ya makosa ya kawaida huonyeshwa kwa lugha yako; somo kamili na maswali yaliyotengenezwa bado yako kwa Kiingereza.",
  hi: "अवधारणा-नाम, सार और गलतफहमी के नाम आपकी भाषा में; पूरे पाठ और बने हुए प्रश्न अभी अंग्रेज़ी में हैं।",
  id: "Nama konsep, ringkasan, dan nama miskonsepsi tampil dalam bahasa Anda; pelajaran lengkap dan soal yang dibuat otomatis masih berbahasa Inggris.",
  tl: "Ang mga pangalan ng konsepto, buod, at pangalan ng maling paniniwala ay nakasalin; ang mga buong aralin at gawing tanong ay Ingles pa rin.",
  ur: "تصورات کے نام، خلاصے اور غلط فہمیوں کے نام آپ کی زبان میں؛ مکمل اسباق اور خودکار سوالات ابھی انگریزی میں ہیں۔",
  fa: "نام مفهوم‌ها، خلاصه‌ها و نام بدفهمی‌ها به زبان شماست؛ درس‌های کامل و پرسش‌های خودکار هنوز انگلیسی‌اند.",
  de: "Konzeptnamen, Kurzfassungen und Namen typischer Fehler erscheinen auf Deutsch; vollständige Lektionen und erzeugte Aufgaben sind noch englisch.",
  ja: "概念名・要約・つまずきの名前は日本語で表示。本文レッスンと自動生成の問題はまだ英語です。",
  zh: "概念名、简介和易错点名称已本地化；完整课程与自动生成的题目仍为英文。",
  bn: "ধারণার নাম, সারাংশ ও ভুল ধারণার নাম বাংলায়; পূর্ণ পাঠ ও স্বয়ংক্রিয় প্রশ্ন এখনও ইংরেজিতে।",
};

const src = fs.readFileSync("lib/i18n.ts", "utf8");
const lines = src.split("\n");
// Track which dictionary each line belongs to via the declaration pattern.
const declRe = /^(?:export )?const (\w+): Dict = \{$/;
let current = null;
let inserted = 0;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(declRe);
  if (m) { current = m[1]; continue; }
  if (lines[i] === "};" ) { current = null; continue; }
  if (current && lines[i].includes('"lq.teaching"')) {
    const note = NOTE[current];
    if (!note) { console.error(`no note for ${current}`); process.exit(1); }
    const indent = lines[i].match(/^\s*/)[0];
    lines.splice(i + 1, 0, `${indent}"lq.teachNote": ${JSON.stringify(note)},`);
    inserted++;
    i++; // skip the line we just inserted
  }
}
if (inserted !== 15) { console.error(`expected 15 insertions, got ${inserted}`); process.exit(1); }
fs.writeFileSync("lib/i18n.ts", lines.join("\n"));
console.log(`lq.teachNote inserted into ${inserted} dictionaries`);
