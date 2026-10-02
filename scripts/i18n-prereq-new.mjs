// One-shot i18n: the UNMEASURED half of the foundations sentence.
//
// WHY IT EXISTS. The FOUNDATIONS branch serves a prerequisite the learner has
// not established, and "not established" is two different facts that the old
// wording collapsed into one:
//
//   - the prerequisite has been measured and is weak   → "it is not established
//                                                        yet" is a true claim
//                                                        about the learner;
//   - nothing has ever been asked about it             → "you have not covered
//                                                        it yet" is the only
//                                                        honest sentence there
//                                                        is.
//
// Same defect, same rule as the teacher surface: absence of evidence must never
// be spoken about as failure — and here it was being spoken about that way in
// fifteen languages simultaneously, from a single template.
//
// Same convention as the other one-shot scripts (i18n-advance.mjs,
// i18n-prove-branch.mjs): locate each dictionary by name, insert beside a sibling
// anchor, assert all fifteen are complete, and refuse to run twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"next.reason.prereqFirst"';
const KEY = "next.reason.prereqNew";

const TEXTS = {
  en: "{next} is built on this, and you have not covered it yet — this comes first.",
  es: "{next} se apoya en esto, y aún no lo has visto — esto va primero.",
  fr: "{next} repose là-dessus, et tu ne l'as pas encore vu — cela vient d'abord.",
  pt: "{next} baseia-se nisto, e ainda não o estudaste — isto vem primeiro.",
  ar: "{next} مبني على هذا، ولم تتناوله بعد — هذا يأتي أولًا.",
  sw: "{next} imejengwa juu ya hili, na bado hukulijifunza — hili linakuja kwanza.",
  hi: "{next} इसी पर टिका है, और यह आपने अभी पढ़ा नहीं — यह पहले आएगा।",
  id: "{next} dibangun di atas ini, dan ini belum kamu pelajari — ini yang harus didahulukan.",
  tl: "{next} ay nakabatay dito, at hindi mo pa ito napag-aralan — ito muna ang unahin.",
  ur: "{next} اسی پر بنیاد رکھتا ہے، اور یہ آپ نے ابھی پڑھا نہیں — یہ پہلے آئے گا۔",
  fa: "{next} بر پایهٔ این بنا شده و هنوز آن را نخوانده‌ای — اول این.",
  de: "{next} baut darauf auf, und das hast du noch nicht behandelt — das kommt zuerst.",
  ja: "{next} はこれを土台にしていますが、まだ学習していません — まずこちらを。",
  zh: "{next}建立在这上面，而你还没学过这一点 — 先补这个。",
  bn: "{next} এর উপরেই দাঁড়িয়ে আছে, আর এটি আপনি এখনো পড়েননি — আগে এটিই।",
};

const CODES = Object.keys(TEXTS);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const code of CODES) {
  if (typeof TEXTS[code] !== "string" || !TEXTS[code]) throw new Error(`${code}: missing`);
  if (!TEXTS[code].includes("{next}")) throw new Error(`${code}: dropped the {next} slot`);
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${KEY}"`)) {
  console.log(`${KEY} already present — nothing to do`);
  process.exit(0);
}

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. */
function dictRange(code) {
  const plain = `const ${code}: Dict = `;
  const exported = `export const ${code}: Dict = `;
  const start = lines.findIndex((l) => l.includes(plain) || l.includes(exported));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && l.includes(": Dict = "));
  return [start, next < 0 ? lines.length : next];
}

const insertAfter = new Map();
for (const code of CODES) {
  const [start, end] = dictRange(code);
  // Found by `includes`, not a regular expression: "which line opens this
  // dictionary" then has no escaping to get wrong.
  const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  insertAfter.set(idx, code);
}
if (insertAfter.size !== 15) throw new Error(`only ${insertAfter.size} dictionaries have the anchor — refusing to write`);

const out = [];
for (let i = 0; i < lines.length; i++) {
  out.push(lines[i]);
  const code = insertAfter.get(i);
  if (code) {
    const indent = lines[i].match(/^\s*/)[0];
    const escaped = TEXTS[code].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    out.push(`${indent}"${KEY}": "${escaped}",`);
  }
}

fs.writeFileSync(FILE, out.join("\n"));
console.log(`wrote ${KEY} × ${CODES.length} languages to ${FILE}`);
