// One-shot i18n: the three strings the PROVE branch needs.
//
// WHY THESE STRINGS EXIST. The decision engine gained a branch (lib/next-engine.ts)
// for a learner who is accurate but has never once done the work unaided — the
// state the brief names outright ("correct with heavy support → independent
// proof"). The branch has to say three things, and none of them can be borrowed:
//
//   next.title.prove        the action's name — it is PRACTISE, not the stretch
//                           the accuracy alone implied
//   next.reason.proveNoHelp what the learner is being asked to do, and why now —
//                           the sentence read before deciding whether to trust it
//   next.ev.needsNoHelp     the evidence line's missing fact: the record holds
//                           answers, and none of them was unaided
//
// Same convention as the other one-shot scripts (i18n-offline-sync.mjs,
// i18n-teach-course.mjs): insert beside a sibling anchor by hand in each
// dictionary, because the dictionaries are literal TS objects, then assert
// every language is complete and refuse to write twice.
//
// `next.reason.practisePost` is the anchor because it is the sibling these
// belong beside AND because `verify` already requires every language to carry
// every `next.reason.*` key — so its presence in all fifteen dictionaries is a
// fact the suite maintains, not an assumption this script makes.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"next.reason.practisePost"';

const KEYS = {
  "next.title.prove": {
    en: "Prove it",
    es: "Demuéstralo",
    fr: "Prouve-le",
    pt: "Prova-o",
    ar: "أثبته",
    sw: "Ithibitishe",
    hi: "इसे सिद्ध करो",
    id: "Buktikan",
    tl: "Patunayan mo",
    ur: "اسے ثابت کریں",
    fa: "اثباتش کن",
    de: "Beweise es",
    ja: "自力で解く",
    zh: "独立完成",
    bn: "এটি প্রমাণ করুন",
  },
  "next.reason.proveNoHelp": {
    en: "You have got these right, but every one needed help — do one unaided before moving on.",
    es: "Las has acertado, pero en todas necesitaste ayuda — haz una sin ayuda antes de seguir.",
    fr: "Tu les as réussies, mais tu as eu besoin d'aide à chaque fois — fais-en une seul avant de continuer.",
    pt: "Acertaste estas, mas precisaste de ajuda em todas — faz uma sozinho antes de avançar.",
    ar: "أجبت عنها جميعًا بشكل صحيح، لكنك احتجت إلى المساعدة في كل مرة — أجب عن واحدة بمفردك قبل المتابعة.",
    sw: "Umezipata sawa, lakini kila moja ilihitaji msaada — fanya moja bila msaada kabla ya kuendelea.",
    hi: "आपने ये सही किए, पर हर एक में मदद चाहिए थी — आगे बढ़ने से पहले एक बिना मदद के करें।",
    id: "Kamu menjawab semuanya benar, tetapi setiap soal perlu bantuan — kerjakan satu tanpa bantuan sebelum lanjut.",
    tl: "Nakuha mo lahat, pero lahat kailangan ng tulong — gawin ang isa nang walang tulong bago magpatuloy.",
    ur: "آپ نے یہ سب درست کیے، مگر ہر ایک میں مدد درکار تھی — آگے بڑھنے سے پہلے ایک بغیر مدد کے کیجیے۔",
    fa: "همه را درست پاسخ دادی، اما در هر کدام به کمک نیاز داشتی — پیش از ادامه یکی را بدون کمک انجام بده.",
    de: "Du hast sie richtig gelöst, aber bei jeder brauchtest du Hilfe — löse eine ohne Hilfe, bevor du weitermachst.",
    ja: "すべて正解ですが、毎回ヒントが必要でした — 次に進む前に、ヒントなしで1問解きましょう。",
    zh: "这些都答对了，但每一题都需要提示 — 先独立完成一题再继续。",
    bn: "সবগুলোই সঠিক, কিন্তু প্রতিটিতে সহায়তা লেগেছে — এগিয়ে যাওয়ার আগে একটি সহায়তা ছাড়া করুন।",
  },
  "next.ev.needsNoHelp": {
    en: "nothing done unaided yet",
    es: "aún nada hecho sin ayuda",
    fr: "rien fait sans aide pour l'instant",
    pt: "nada feito sem ajuda ainda",
    ar: "لم تُنجز أي شيء بمفردك بعد",
    sw: "hakuna lililofanywa bila msaada bado",
    hi: "अभी तक बिना मदद कुछ नहीं किया",
    id: "belum ada yang dikerjakan tanpa bantuan",
    tl: "wala pa ring nagawa nang walang tulong",
    ur: "ابھی تک بغیر مدد کچھ نہیں کیا",
    fa: "هنوز هیچ کاری بدون کمک انجام نشده",
    de: "bisher nichts ohne Hilfe geschafft",
    ja: "まだ自力で解けたものはありません",
    zh: "尚未独立完成任何一题",
    bn: "এখনো সহায়তা ছাড়া কিছু করা হয়নি",
  },
};

const CODES = Object.keys(KEYS["next.title.prove"]);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const key of Object.keys(KEYS)) {
  for (const code of CODES) {
    if (typeof KEYS[key][code] !== "string" || !KEYS[key][code]) throw new Error(`${key}/${code}: missing`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"next.title.prove"')) {
  console.log("prove-branch strings already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const DICT_LINE = (code) => [`const ${code}: Dict = `, `export const ${code}: Dict = `];

/** The line range of ONE language's dictionary, found by NAME. Located by
 *  `includes` rather than a regular expression, so "a line that opens the
 *  dictionary for `code`" has no escaping to get wrong. */
function dictRange(code) {
  const [plain, exported] = DICT_LINE(code);
  const start = lines.findIndex((l) => l.includes(plain) || l.includes(exported));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && l.includes(": Dict = "));
  return [start, next < 0 ? lines.length : next];
}

const blocks = [];
for (const code of CODES) {
  const [start, end] = dictRange(code);
  const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  const block = Object.entries(KEYS).map(([key, text]) => {
    const escaped = text[code].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${indent}"${key}": "${escaped}",`;
  });
  blocks.push({ at: idx + 1, lines: block, code, start });
}
const seen = new Set();
for (const b of blocks) {
  if (seen.has(b.at)) throw new Error(`two dictionaries insert at line ${b.at} — refusing to write`);
  seen.add(b.at);
}
// Locating fifteen dictionaries is not the same as locating fifteen DIFFERENT
// ones. A locator sloppy enough to resolve two codes to one block would write
// that language twice and leave another in English while every count still read
// fifteen — the exact shape of a "translated everywhere" claim that is false.
// Requiring fifteen distinct OPENING lines is what makes the write safe.
if (new Set(blocks.map((b) => b.start)).size !== 15) {
  throw new Error("two languages resolved to the same dictionary — refusing to write");
}

blocks.sort((a, b) => b.at - a.at);
for (const b of blocks) lines.splice(b.at, 0, ...b.lines);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${Object.keys(KEYS).length} strings × ${CODES.length} languages (${Object.keys(KEYS).join(", ")}) to ${FILE}`);
