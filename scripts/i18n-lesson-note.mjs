// One-shot i18n: THE THIRD LANGUAGE STATE OF A LESSON.
//
// The lesson page and the offline twin print which of three true things applies
// to the reader: the vocabulary is theirs and the teaching is English
// (`lq.teachNote`), nothing but the interface is translated (`lq.teachNoteAll`),
// or — new — THIS LESSON is in their language while the generated practice and
// its explanations are still English (`lq.teachNoteLesson`).
//
// The third one is deliberately narrower than "the app is translated": the
// question bank's prompts, options and explanations are authored English and are
// not part of this pass (lib/lesson-plans-intl.ts says why). Telling a learner
// the whole product is in their language would be the overclaim this file
// exists to prevent — the exact failure the note was added for.
//
// Located BY DICTIONARY NAME, never by position: lib/i18n.ts's dictionaries are
// not in `LANGS` order, so pairing text with dictionary by index writes Urdu
// into German and no test notices.
//
// Run: node scripts/i18n-lesson-note.mjs
// Idempotent: a key already present is skipped.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "ur", "fa", "de", "ja", "zh", "bn"];

const KEY = "lq.teachNoteLesson";

const TEXT = {
  en: "This lesson is in your language; the practice questions and their explanations are still in English.",
  es: "Esta lección está en tu idioma; las preguntas de práctica y sus explicaciones siguen en inglés.",
  fr: "Cette leçon est dans votre langue ; les questions d'entraînement et leurs explications restent en anglais.",
  pt: "Esta lição está no seu idioma; as perguntas de prática e as suas explicações continuam em inglês.",
  ar: "هذا الدرس بلغتك؛ أما أسئلة التدريب وشروحها فما زالت بالإنجليزية.",
  sw: "Somo hili liko katika lugha yako; maswali ya mazoezi na maelezo yake bado ni kwa Kiingereza.",
  hi: "यह पाठ आपकी भाषा में है; अभ्यास के प्रश्न और उनके स्पष्टीकरण अभी भी अंग्रेज़ी में हैं।",
  id: "Pelajaran ini dalam bahasa Anda; soal latihan dan penjelasannya masih dalam bahasa Inggris.",
  tl: "Ang araling ito ay nasa iyong wika; ang mga tanong sa pagsasanay at ang mga paliwanag nito ay nasa Ingles pa rin.",
  ur: "یہ سبق آپ کی زبان میں ہے؛ مشق کے سوالات اور اُن کی وضاحتیں اب بھی انگریزی میں ہیں۔",
  fa: "این درس به زبان شماست؛ پرسش‌های تمرین و توضیح‌هایشان هنوز به انگلیسی است.",
  de: "Diese Lektion ist in Ihrer Sprache; die Übungsfragen und ihre Erklärungen sind weiterhin auf Englisch.",
  ja: "このレッスンはあなたの言語で書かれています。練習問題とその解説は今も英語です。",
  zh: "本课以你的语言讲授；练习题及其解析仍为英语。",
  bn: "এই পাঠ আপনার ভাষায়; অনুশীলনের প্রশ্ন ও তার ব্যাখ্যা এখনও ইংরেজিতে।",
};

const lines = fs.readFileSync(FILE, "utf8").split("\n");

/** [head, close] line indexes of one dictionary, found by its own name. */
function dictSpan(code) {
  const head = lines.findIndex((l) => l.includes(`const ${code}: Dict = {`));
  if (head < 0) throw new Error(`${code}: dictionary not found`);
  for (let i = head + 1; i < lines.length; i += 1) if (/^\s*\};?\s*$/.test(lines[i])) return [head, i];
  throw new Error(`${code}: its dictionary never closes`);
}

const escape = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const inserts = [];
let wrote = 0;
let skipped = 0;
for (const code of LANGS) {
  const [start, end] = dictSpan(code);
  const body = lines.slice(start, end).join("\n");
  if (body.includes(`"${KEY}":`)) { skipped += 1; continue; }
  inserts.push({ at: end, block: `  "${KEY}": "${escape(TEXT[code])}",` });
  wrote += 1;
}
for (const { at, block } of inserts.sort((a, b) => b.at - a.at)) lines.splice(at, 0, block);
fs.writeFileSync(FILE, lines.join("\n"));

// POST-CONDITION: every dictionary has the key, and each carries ITS OWN text.
const after = fs.readFileSync(FILE, "utf8").split("\n");
function bodyOf(code) {
  const head = after.findIndex((l) => l.includes(`const ${code}: Dict = {`));
  for (let i = head + 1; i < after.length; i += 1) if (/^\s*\};?\s*$/.test(after[i])) return after.slice(head, i).join("\n");
  throw new Error(`${code}: its dictionary never closes`);
}
for (const code of LANGS) {
  const body = bodyOf(code);
  if (!body.includes(`"${KEY}":`)) throw new Error(`${code}: still missing ${KEY}`);
  if (!body.includes(`"${KEY}": "${escape(TEXT[code])}"`)) {
    throw new Error(`${code}: carries another dictionary's text for ${KEY}`);
  }
}
// And it must not be the English sentence left in place: that is the claim the
// key exists to make truthfully, and a copy-paste of `en` into fifteen
// dictionaries is how a translation pass looks finished while it is not.
const english = escape(TEXT.en);
const copied = LANGS.filter((code) => code !== "en" && escape(TEXT[code]) === english);
if (copied.length) throw new Error(`left as English in: ${copied.join(", ")}`);

console.log(`lesson note: ${wrote} written, ${skipped} already present, ${LANGS.length} dictionaries verified`);
