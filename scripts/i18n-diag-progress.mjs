// One-shot i18n: the diagnostic's own progress line.
//
// WHY. The sitting showed a bare `01.` and nothing else, so a learner could not
// tell how far through they were or whether it would end — measured on the
// first-run page, where the only number on screen was the question counter. The
// length of a sitting is adaptive (a concept stops the moment its band rules
// decide, and a proved band is not re-proved on later concepts), so the honest
// answer is an ESTIMATE, and the counter has to say "about" to be truthful. Two
// keys: the counter itself, and a way to leave the sitting while keeping it
// (the server resumes the same sitting and the page already says so).
//
// One shot, fifteen dictionaries, authored by hand like every other string a
// learner reads. Same convention as the other one-shot scripts: assert
// completeness, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling these belong beside in every dictionary. */
const ANCHOR = '"diag.title"';

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const KEYS = {
  "diag.progress": {
    en: "Question {n} of about {m}",
    es: "Pregunta {n} de unas {m}",
    fr: "Question {n} sur environ {m}",
    pt: "Pergunta {n} de cerca de {m}",
    ar: "السؤال {n} من نحو {m}",
    sw: "Swali {n} kati ya takriban {m}",
    hi: "प्रश्न {n}, लगभग {m} में से",
    id: "Soal {n} dari sekitar {m}",
    tl: "Tanong {n} ng humigit-kumulang {m}",
    de: "Frage {n} von etwa {m}",
    ja: "{m} 問中 {n} 問目",
    zh: "第 {n} 题，共约 {m} 题",
    fa: "پرسش {n} از حدود {m}",
    ur: "سوال {n} از تقریباً {m}",
    bn: "প্রশ্ন {n}, প্রায় {m}-এর মধ্যে",
  },
  "diag.leave": {
    en: "Leave for now",
    es: "Salir por ahora",
    fr: "Quitter pour l'instant",
    pt: "Sair por agora",
    ar: "المغادرة الآن",
    sw: "Ondoka kwa sasa",
    hi: "अभी के लिए छोड़ें",
    id: "Keluar untuk sekarang",
    tl: "Umalis muna",
    de: "Für jetzt verlassen",
    ja: "いったんやめる",
    zh: "暂时离开",
    fa: "فعلاً ترک کنید",
    ur: "ابھی کے لیے چھوڑیں",
    bn: "এখনকার জন্য ছেড়ে দিন",
  },
};

let src = fs.readFileSync(FILE, "utf8");
const present = Object.keys(KEYS).filter((k) => src.includes(`"${k}"`));
if (present.length === Object.keys(KEYS).length) {
  console.log("already applied — nothing to do");
  process.exit(0);
}

function dictSpan(code) {
  const head = new RegExp(`^(export )?const ${code}: Dict = \\{`, "m").exec(src);
  if (!head) throw new Error(`dictionary ${code} not found`);
  const end = src.indexOf("\n};", head.index);
  if (end < 0) throw new Error(`dictionary ${code} has no terminator`);
  return [head.index, end];
}

const problems = [];
for (const [key, byLang] of Object.entries(KEYS)) {
  for (const code of LANGS) {
    if (typeof byLang[code] !== "string" || !byLang[code].trim()) problems.push(`${key}: no value for ${code}`);
  }
  if (key === "diag.progress") {
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
