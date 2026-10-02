// One-shot i18n: the ADVANCE and FOUNDATIONS strings, and the removal of three
// that the ladder made unreachable.
//
// WHY THESE EXIST. The decision engine was rebuilt around one learner-state
// ladder (lib/learner-model.ts#stageOf). Three strings the old engine could
// reach are now unreachable, because the states they named cannot occur:
//
//   next.reason.challenge  "Ready for new ground — one step beyond current
//                          ability." The CHALLENGE kind still exists and is now
//                          the ADVANCE action, but it no longer picks a target
//                          by vibes: it picks the next concept in the
//                          curriculum, which the advance sentence says out loud.
//   next.reason.deepen     "no re-worded version, so this is the hardest form of
//                          the same question." That was the terminal state for a
//                          concept with no second surface, and it repeated
//                          forever — the exact loop the ladder removes. A proved
//                          concept with no second surface is FINISHED, so the
//                          engine moves on instead of prescribing it again.
//   next.title.challenge   the action is the next topic, and it says so.
//
// And five are added: the advance title and its two sentences, plus the two
// evidence-line fragments the advance and the foundations action need.
//
// Same convention as the other one-shot scripts: locate each dictionary by name,
// insert beside a sibling anchor, assert all fifteen are complete, refuse to run
// twice — and here also refuse to remove anything that is not a whole line
// declaring exactly one of the dead keys, so a rename can never take a live
// string with it.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"next.reason.practisePost"';

const DEAD = ["next.title.challenge", "next.reason.challenge", "next.reason.deepen"];

const KEYS = {
  "next.title.advance": {
    en: "Next topic",
    es: "Siguiente tema",
    fr: "Notion suivante",
    pt: "Próximo tópico",
    ar: "الموضوع التالي",
    sw: "Mada inayofuata",
    hi: "अगला विषय",
    id: "Topik berikutnya",
    tl: "Susunod na paksa",
    ur: "اگلا موضوع",
    fa: "موضوع بعدی",
    de: "Nächstes Thema",
    ja: "次の単元",
    zh: "下一个主题",
    bn: "পরবর্তী বিষয়",
  },
  "next.reason.advance": {
    en: "You have demonstrated everything up to here — next is {next}.",
    es: "Has demostrado todo hasta aquí — lo siguiente es {next}.",
    fr: "Tu as démontré tout ce qui précède — la suite est {next}.",
    pt: "Demonstraste tudo até aqui — o próximo é {next}.",
    ar: "لقد أثبتت كل ما سبق — التالي هو {next}.",
    sw: "Umeonyesha kila kitu hadi hapa — kinachofuata ni {next}.",
    hi: "आपने यहाँ तक सब कुछ सिद्ध कर दिया है — अगला है {next}।",
    id: "Kamu sudah membuktikan semua sampai di sini — berikutnya adalah {next}.",
    tl: "Napatunayan mo na ang lahat hanggang dito — susunod ay {next}.",
    ur: "آپ نے یہاں تک سب کچھ ثابت کر دیا ہے — اگلا {next} ہے۔",
    fa: "همه‌چیز تا اینجا را اثبات کرده‌ای — مورد بعدی {next} است.",
    de: "Du hast alles bis hierher nachgewiesen — als Nächstes kommt {next}.",
    ja: "ここまではすべて実証できました — 次は {next} です。",
    zh: "到这里的内容你都已经证明了 — 接下来是{next}。",
    bn: "এখন পর্যন্ত সবকিছুই আপনি প্রমাণ করেছেন — পরবর্তী হলো {next}।",
  },
  "next.reason.prereqFirst": {
    en: "{next} is built on this, and it is not established yet — this comes first.",
    es: "{next} se apoya en esto, y aún no está afianzado — esto va primero.",
    fr: "{next} repose là-dessus, et ce n'est pas encore acquis — cela vient d'abord.",
    pt: "{next} baseia-se nisto, e ainda não está consolidado — isto vem primeiro.",
    ar: "{next} مبني على هذا، ولم يترسّخ بعد — هذا يأتي أولًا.",
    sw: "{next} imejengwa juu ya hili, na bado hakijaimarika — hili linakuja kwanza.",
    hi: "{next} इसी पर टिका है, और यह अभी पक्का नहीं हुआ — यह पहले आएगा।",
    id: "{next} dibangun di atas ini, dan ini belum mapan — ini yang harus didahulukan.",
    tl: "{next} ay nakabatay dito, at hindi pa ito matibay — ito muna ang unahin.",
    ur: "{next} اسی پر بنیاد رکھتا ہے، اور یہ ابھی پختہ نہیں ہوا — یہ پہلے آئے گا۔",
    fa: "{next} بر پایهٔ این بنا شده و هنوز تثبیت نشده است — اول این.",
    de: "{next} baut darauf auf, und das sitzt noch nicht — das kommt zuerst.",
    ja: "{next} はこれを土台にしていますが、まだ定着していません — まずこちらを。",
    zh: "{next}建立在这上面，而这一点还没打牢 — 先补这个。",
    bn: "{next} এর উপরেই দাঁড়িয়ে আছে, আর এটি এখনো পাকা নয় — আগে এটিই।",
  },
  "next.ev.prereqsMet": {
    en: "foundations met",
    es: "bases afianzadas",
    fr: "bases acquises",
    pt: "bases consolidadas",
    ar: "الأساسات مكتملة",
    sw: "misingi imekamilika",
    hi: "आधार पूरे",
    id: "dasar sudah dikuasai",
    tl: "matibay na ang pundasyon",
    ur: "بنیادیں مکمل",
    fa: "پایه‌ها تثبیت شده",
    de: "Grundlagen sitzen",
    ja: "土台は定着済み",
    zh: "基础已打牢",
    bn: "ভিত্তি তৈরি",
  },
  "next.ev.demonstrated": {
    en: "demonstrated",
    es: "demostrados",
    fr: "démontrés",
    pt: "demonstrados",
    ar: "مُثبَت",
    sw: "imethibitishwa",
    hi: "सिद्ध",
    id: "terbukti",
    tl: "napatunayan",
    ur: "ثابت شدہ",
    fa: "اثبات‌شده",
    de: "nachgewiesen",
    ja: "実証済み",
    zh: "已证明",
    bn: "প্রমাণিত",
  },
};

const CODES = Object.keys(KEYS["next.title.advance"]);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const key of Object.keys(KEYS)) {
  for (const code of CODES) {
    if (typeof KEYS[key][code] !== "string" || !KEYS[key][code]) throw new Error(`${key}/${code}: missing`);
  }
  for (const dead of DEAD) {
    if (key === dead) throw new Error(`${key} is both added and removed`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"next.title.advance"')) {
  console.log("advance strings already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. Located by
 *  `includes` rather than a regular expression, so the "which line opens the
 *  dictionary for `code`" question has no escaping to get wrong. */
function dictRange(code) {
  const plain = `const ${code}: Dict = `;
  const exported = `export const ${code}: Dict = `;
  const start = lines.findIndex((l) => l.includes(plain) || l.includes(exported));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && l.includes(": Dict = "));
  return [start, next < 0 ? lines.length : next];
}

const ranges = new Map();
for (const code of CODES) ranges.set(code, dictRange(code));
if (new Set([...ranges.values()].map(([s]) => s)).size !== 15) {
  throw new Error("two languages resolved to the same dictionary — refusing to write");
}

// ── Which lines to delete: a whole line, inside a dictionary, declaring exactly
// one dead key. Anything else (a mention in a comment, a key that merely starts
// with a dead name) is left alone.
const drop = new Set();
let removed = 0;
for (const [code, [start, end]] of ranges) {
  for (let i = start; i < end; i++) {
    const m = /^\s*"([^"]+)":\s/.exec(lines[i]);
    if (m && DEAD.includes(m[1])) {
      drop.add(i);
      removed++;
    }
  }
  if (!drop.size) throw new Error(`${code}: none of the dead keys were found in its dictionary`);
}

// ── Which lines to insert after: the anchor, inside each dictionary.
const insertAfter = new Map();
for (const code of CODES) {
  const [start, end] = ranges.get(code);
  const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  insertAfter.set(idx, code);
}
if (insertAfter.size !== 15) throw new Error(`only ${insertAfter.size} dictionaries have the anchor — refusing to write`);

const out = [];
for (let i = 0; i < lines.length; i++) {
  if (drop.has(i)) continue;
  out.push(lines[i]);
  const code = insertAfter.get(i);
  if (code) {
    const indent = lines[i].match(/^\s*/)[0];
    for (const [key, text] of Object.entries(KEYS)) {
      const escaped = text[code].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      out.push(`${indent}"${key}": "${escaped}",`);
    }
  }
}

fs.writeFileSync(FILE, out.join("\n"));
console.log(
  `removed ${removed} dead strings (${DEAD.join(", ")}) and wrote ` +
  `${Object.keys(KEYS).length} × ${CODES.length} languages to ${FILE}`,
);
