// One-shot i18n: the subjects step says why it will not let you continue.
//
// WHY. The subjects step disables `Next` while no subject is chosen, and said
// nothing about it — and its lead sentence claimed "Subjects: Mathematics" even
// after Mathematics had been unchecked, which is the one thing on the screen a
// confused learner would read for guidance. The course step one screen later
// already names what it is waiting for ("needs a course", per subject); this is
// the same rule applied where it was missing, so the disabled button has a
// reason printed above it.
//
// One key, fifteen dictionaries, authored by hand like every other string a
// learner reads. Same convention as the other one-shot scripts: assert
// completeness, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling this belongs beside in every dictionary. */
const ANCHOR = '"onb.subjectsNote"';
const KEY = "onb.needSubject";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUES = {
  en: "Choose at least one subject — your plan is built from these.",
  es: "Elige al menos una asignatura: tu plan se construye a partir de ellas.",
  fr: "Choisis au moins une matière — ton plan se construit à partir de celles-ci.",
  pt: "Escolhe pelo menos uma disciplina — o teu plano é construído a partir delas.",
  ar: "اختر مادة واحدة على الأقل — خطتك تُبنى من هذه المواد.",
  sw: "Chagua somo moja au zaidi — mpango wako unajengwa kutoka kwa haya.",
  hi: "कम से कम एक विषय चुनिए — आपकी योजना इन्हीं से बनती है।",
  id: "Pilih minimal satu mata pelajaran — rencanamu dibangun dari ini.",
  tl: "Pumili ng kahit isang asignatura — mula rito binubuo ang plano mo.",
  de: "Wähle mindestens ein Fach — daraus entsteht dein Plan.",
  ja: "少なくとも1つ科目を選んでください。あなたの計画はここから作られます。",
  zh: "至少选择一门科目——你的计划由此生成。",
  fa: "دست‌کم یک درس را انتخاب کنید — برنامهٔ شما از همین‌ها ساخته می‌شود.",
  ur: "کم از کم ایک مضمون منتخب کریں — آپ کا منصوبہ اسی سے بنتا ہے۔",
  bn: "অন্তত একটি বিষয় বেছে নিন — এগুলো থেকেই আপনার পরিকল্পনা তৈরি হয়।",
};

let src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEY}"`)) {
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
for (const code of LANGS) {
  if (typeof VALUES[code] !== "string" || !VALUES[code]) problems.push(`no value for ${code}`);
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
  block = block.slice(0, lineEnd) + `\n${indent}"${KEY}": ${JSON.stringify(VALUES[code])},` + block.slice(lineEnd);
  src = src.slice(0, from) + block + src.slice(to);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  if (!src.slice(from, to).includes(`"${KEY}"`)) problems.push(`${code}: no ${KEY}`);
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

fs.writeFileSync(FILE, src);
console.log(`authored ${KEY} in ${LANGS.length} dictionaries`);
