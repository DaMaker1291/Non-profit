// One-shot i18n: what the learner says about their OWN knowing.
//
// WHY. The sitting offered two ways forward — pick an answer, or "Skip concept" —
// and both threw away the one thing a diagnostic most needs: whether the learner
// thought they knew. A learner who arrives at the right answer by elimination
// and one who is certain of it produce the same tick, and those are different
// states to teach from.
//
// So the sitting now asks, BEFORE revealing the choices and before any verdict
// (committed early on purpose: a grade shown first contaminates the self-report):
//
//     How sure are you?
//     [ I think I know ]  [ I'm unsure ]  [ I don't know ]
//
// "I don't know" is not a third certainty value — it is a refusal to answer, and
// it runs the diagnostic's existing `skip` action. Its label changes here from
// "Skip concept" (what the machine does) to "I don't know" (what the learner
// means), because the button is read by a learner, not by the route.
//
// Five strings, authored by hand in all fifteen dictionaries. Same convention as
// every other one-shot script: assert completeness, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling these belong beside in every dictionary. */
const ANCHOR = '"diag.next"';

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const KEYS = {
  "diag.certaintyAsk": {
    en: "How sure are you?",
    es: "¿Qué tan seguro estás?",
    fr: "À quel point es-tu sûr ?",
    pt: "Quão seguro você está?",
    ar: "ما مدى تأكدك؟",
    sw: "Una uhakika kiasi gani?",
    hi: "आप कितने निश्चित हैं?",
    id: "Seberapa yakin kamu?",
    tl: "Gaano ka kasigurado?",
    de: "Wie sicher bist du?",
    ja: "どのくらい確かですか？",
    zh: "你有多少把握？",
    fa: "چقدر مطمئنی؟",
    ur: "آپ کتنے مطمئن ہیں؟",
    bn: "আপনি কতটা নিশ্চিত?",
  },
  "diag.sure": {
    en: "I think I know",
    es: "Creo que lo sé",
    fr: "Je pense savoir",
    pt: "Acho que sei",
    ar: "أظن أنني أعرف",
    sw: "Nadhani najua",
    hi: "मुझे लगता है मुझे आता है",
    id: "Sepertinya aku tahu",
    tl: "Sa tingin ko alam ko",
    de: "Ich glaube, ich weiß es",
    ja: "たぶん分かる",
    zh: "我大概会",
    fa: "فکر می‌کنم می‌دانم",
    ur: "مجھے لگتا ہے مجھے آتا ہے",
    bn: "মনে হয় আমি জানি",
  },
  "diag.unsure": {
    en: "I'm unsure",
    es: "No estoy seguro",
    fr: "Je ne suis pas sûr",
    pt: "Não tenho certeza",
    ar: "لست متأكدًا",
    sw: "Sina uhakika",
    hi: "मुझे संदेह है",
    id: "Aku tidak yakin",
    tl: "Hindi ako sigurado",
    de: "Ich bin unsicher",
    ja: "自信がない",
    zh: "我不太确定",
    fa: "مطمئن نیستم",
    ur: "مجھے یقین نہیں",
    bn: "আমি নিশ্চিত নই",
  },
  "diag.dontKnow": {
    en: "I don't know",
    es: "No lo sé",
    fr: "Je ne sais pas",
    pt: "Não sei",
    ar: "لا أعرف",
    sw: "Sijui",
    hi: "मुझे नहीं आता",
    id: "Aku tidak tahu",
    tl: "Hindi ko alam",
    de: "Ich weiß es nicht",
    ja: "分からない",
    zh: "我不会",
    fa: "نمی‌دانم",
    ur: "مجھے نہیں آتا",
    bn: "আমি জানি না",
  },
  "diag.certaintyNote": {
    en: "You were unsure on {u} of the {n} answers you got right — those are worth a second look.",
    es: "Dudaste en {u} de las {n} respuestas correctas: vale la pena revisarlas.",
    fr: "Tu n'étais pas sûr sur {u} des {n} bonnes réponses — celles-là méritent un second regard.",
    pt: "Ficaste na dúvida em {u} das {n} respostas certas — vale a pena revê-las.",
    ar: "لم تكن متأكدًا في {u} من {n} إجابة صحيحة — تستحق مراجعة.",
    sw: "Hukuwa na uhakika katika {u} kati ya {n} majibu sahihi — yanafaa kuangaliwa tena.",
    hi: "आप {n} सही उत्तरों में से {u} में अनिश्चित थे — इन्हें दोबारा देखना उपयोगी है।",
    id: "Kamu ragu pada {u} dari {n} jawaban benar — itu perlu ditinjau lagi.",
    tl: "Hindi ka sigurado sa {u} ng {n} tamang sagot — sulit na balikan ang mga ito.",
    de: "Bei {u} der {n} richtigen Antworten warst du unsicher — die lohnen einen zweiten Blick.",
    ja: "正解した {n} 問のうち {u} 問は自信がありませんでした。見直す価値があります。",
    zh: "你答对的 {n} 题中有 {u} 题不太确定 — 值得再看一遍。",
    fa: "از {n} پاسخ درست، در {u} مورد مطمئن نبودی — ارزش یک نگاه دوباره دارند.",
    ur: "{n} درست جوابوں میں سے {u} پر آپ کو یقین نہیں تھا — ان پر دوبارہ نظر ڈالنا مفید ہے۔",
    bn: "সঠিক {n}টির মধ্যে {u}টিতে আপনি নিশ্চিত ছিলেন না — এগুলো আবার দেখা দরকার।",
  },
};

let src = fs.readFileSync(FILE, "utf8");
const present = Object.keys(KEYS).filter((k) => src.includes(`"${k}"`));
if (present.length === Object.keys(KEYS).length) {
  console.log("already applied — nothing to do");
  process.exit(0);
}

/** The [start, end) span of one dictionary's object literal. Found by plain
 *  string search — a RegExp here needs so much escaping that it once refused to
 *  match its own dictionary. */
function dictSpan(code) {
  const needle = `const ${code}: Dict = {`;
  let at = -1;
  for (const prefix of ["\n", "\nexport "]) {
    const i = src.indexOf(`${prefix}${needle}`);
    if (i >= 0) { at = i + prefix.length; break; }
  }
  if (at < 0 && src.startsWith(needle)) at = 0;
  if (at < 0) throw new Error(`dictionary ${code} not found`);
  const end = src.indexOf("\n};", at);
  if (end < 0) throw new Error(`dictionary ${code} has no terminator`);
  return [at, end];
}

const problems = [];
for (const [key, byLang] of Object.entries(KEYS)) {
  for (const code of LANGS) {
    if (typeof byLang[code] !== "string" || !byLang[code].trim()) problems.push(`${key}: no value for ${code}`);
  }
  if (key === "diag.certaintyNote") {
    for (const code of LANGS) {
      if (!byLang[code].includes("{u}") || !byLang[code].includes("{n}")) problems.push(`${key}: ${code} lost a placeholder`);
    }
  }
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  let block = src.slice(from, to);
  const anchor = block.indexOf(`${ANCHOR}:`);
  if (anchor < 0) {
    problems.push(`${code}: anchor ${ANCHOR} missing`);
    continue;
  }
  const lineEnd = block.indexOf("\n", anchor);
  if (lineEnd < 0) {
    problems.push(`${code}: anchor line unterminated`);
    continue;
  }
  const indent = " ".repeat(anchor - block.lastIndexOf("\n", anchor) - 1);
  const lines = Object.keys(KEYS)
    .map((k) => `${indent}"${k}": ${JSON.stringify(KEYS[k][code])},`)
    .join("\n");
  block = block.slice(0, lineEnd) + "\n" + lines + block.slice(lineEnd);
  src = src.slice(0, from) + block + src.slice(to);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  for (const k of Object.keys(KEYS)) {
    if (!src.slice(from, to).includes(`"${k}"`)) problems.push(`${code}: no ${k}`);
  }
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

fs.writeFileSync(FILE, src);
console.log(`authored ${Object.keys(KEYS).join(" + ")} in ${LANGS.length} dictionaries`);
