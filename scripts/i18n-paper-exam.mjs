// One-shot i18n: the exam sitting on /papers.
//
// WHY. A paper used to be one long scroll of every question, in order, with no
// way to see how far through you were, no way to mark a question to come back
// to, and no way to move around the paper. That is a worksheet, not an exam —
// and the whole point of sitting a full paper is that it FEELS like the exam
// room: a header that names the board and the tier, a question counter, the
// marks a question is worth, a grid you can jump through, a flag, and a Next
// button. Ten strings a learner reads; authored by hand in all fifteen
// dictionaries, same convention as every other one-shot script: assert
// completeness, refuse to write twice.
//
// `pp.questionOf` carries {n} and {m} and both placeholders are asserted in
// every language — a translation that drops one would print a bare number.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling these belong beside in every dictionary. */
const ANCHOR = '"pp.another"';

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const KEYS = {
  "pp.questionOf": {
    en: "Question {n} of {m}",
    es: "Pregunta {n} de {m}",
    fr: "Question {n} sur {m}",
    pt: "Pergunta {n} de {m}",
    ar: "السؤال {n} من {m}",
    sw: "Swali {n} kati ya {m}",
    hi: "प्रश्न {n}, {m} में से",
    id: "Soal {n} dari {m}",
    tl: "Tanong {n} ng {m}",
    de: "Aufgabe {n} von {m}",
    ja: "{m} 問中 {n} 問目",
    zh: "第 {n} 题，共 {m} 题",
    fa: "پرسش {n} از {m}",
    ur: "سوال {n} از {m}",
    bn: "প্রশ্ন {n}, {m}-এর মধ্যে",
  },
  "pp.flag": {
    en: "Flag",
    es: "Marcar",
    fr: "Marquer",
    pt: "Marcar",
    ar: "علّم",
    sw: "Weka alama",
    hi: "चिह्नित करें",
    id: "Tandai",
    tl: "Markahan",
    de: "Markieren",
    ja: "フラグ",
    zh: "标记",
    fa: "نشان‌گذاری",
    ur: "نشان لگائیں",
    bn: "চিহ্নিত করুন",
  },
  "pp.flagged": {
    en: "Flagged",
    es: "Marcada",
    fr: "Marquée",
    pt: "Marcada",
    ar: "معلَّم",
    sw: "Imewekwa alama",
    hi: "चिह्नित",
    id: "Ditandai",
    tl: "Namarkahan",
    de: "Markiert",
    ja: "フラグ付き",
    zh: "已标记",
    fa: "نشان‌گذاری‌شده",
    ur: "نشان لگا",
    bn: "চিহ্নিত",
  },
  "pp.prev": {
    en: "Previous",
    es: "Anterior",
    fr: "Précédent",
    pt: "Anterior",
    ar: "السابق",
    sw: "Iliyotangulia",
    hi: "पिछला",
    id: "Sebelumnya",
    tl: "Nakaraan",
    de: "Zurück",
    ja: "前へ",
    zh: "上一题",
    fa: "قبلی",
    ur: "پچھلا",
    bn: "আগের",
  },
  "pp.next": {
    en: "Next",
    es: "Siguiente",
    fr: "Suivant",
    pt: "Seguinte",
    ar: "التالي",
    sw: "Ifuatayo",
    hi: "अगला",
    id: "Berikutnya",
    tl: "Susunod",
    de: "Weiter",
    ja: "次へ",
    zh: "下一题",
    fa: "بعدی",
    ur: "اگلا",
    bn: "পরের",
  },
  "pp.grid": {
    en: "Jump to a question",
    es: "Ir a una pregunta",
    fr: "Aller à une question",
    pt: "Ir para uma questão",
    ar: "انتقل إلى سؤال",
    sw: "Rukia swali",
    hi: "किसी प्रश्न पर जाएँ",
    id: "Lompat ke soal",
    tl: "Pumunta sa isang tanong",
    de: "Zu einer Aufgabe springen",
    ja: "問題へ移動",
    zh: "跳到某题",
    fa: "رفتن به یک پرسش",
    ur: "کسی سوال پر جائیں",
    bn: "একটি প্রশ্নে যান",
  },
  "pp.correct": {
    en: "Correct",
    es: "Correcta",
    fr: "Correct",
    pt: "Correta",
    ar: "صحيح",
    sw: "Sahihi",
    hi: "सही",
    id: "Benar",
    tl: "Tama",
    de: "Richtig",
    ja: "正解",
    zh: "正确",
    fa: "درست",
    ur: "درست",
    bn: "সঠিক",
  },
  "pp.incorrect": {
    en: "Incorrect",
    es: "Incorrecta",
    fr: "Incorrect",
    pt: "Incorreta",
    ar: "خطأ",
    sw: "Si sahihi",
    hi: "गलत",
    id: "Salah",
    tl: "Mali",
    de: "Falsch",
    ja: "不正解",
    zh: "错误",
    fa: "نادرست",
    ur: "غلط",
    bn: "ভুল",
  },
  "pp.blank": {
    en: "Not attempted",
    es: "Sin responder",
    fr: "Non tentée",
    pt: "Não respondida",
    ar: "لم تُحل",
    sw: "Haijajibiwa",
    hi: "अनुत्तरित",
    id: "Tidak dijawab",
    tl: "Hindi sinagutan",
    de: "Nicht bearbeitet",
    ja: "未解答",
    zh: "未作答",
    fa: "بی‌پاسخ",
    ur: "جواب نہیں دیا",
    bn: "উত্তর দেওয়া হয়নি",
  },
  "pp.checkIdea": {
    en: "Check this idea",
    es: "Revisa esta idea",
    fr: "Revoir cette notion",
    pt: "Revise esta ideia",
    ar: "راجع هذه الفكرة",
    sw: "Angalia wazo hili",
    hi: "इस विचार की जाँच करें",
    id: "Periksa ide ini",
    tl: "Suriin ang ideyang ito",
    de: "Diese Idee prüfen",
    ja: "この考えを見直す",
    zh: "检查这个知识点",
    fa: "این ایده را بررسی کن",
    ur: "اس خیال کو دیکھیں",
    bn: "এই ধারণাটি দেখুন",
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
  if (key === "pp.questionOf") {
    for (const code of LANGS) {
      if (!byLang[code].includes("{n}") || !byLang[code].includes("{m}")) problems.push(`${key}: ${code} lost a placeholder`);
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
