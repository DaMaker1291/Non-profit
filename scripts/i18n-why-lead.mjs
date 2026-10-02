// One-shot i18n: the why-branch reads the learner's own question back.
//
// WHY. The offline Socratic engine's `why` branch varied only by a five-way
// opener chosen from a hash of the message, so two different why-questions could
// get byte-identical replies — and did, in the superiority test:
//
//   "Why do I subtract 7?"  ≡  "What does the 7 represent?"
//
// The claim branch already reads the learner's own words back
// ("You have given me a method — …: I got x = 13."); the one branch where the
// message's CONTENT is the question did not. `soc.whyLead` is the read-back
// lead, placed first, with the learner's own words after the colon exactly as
// `soc.claimLead` is used. Same convention as the other one-shot scripts
// (i18n-claim.mjs, i18n-why-fallback.mjs): each dictionary edited by hand,
// completeness asserted, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling this belongs beside in every dictionary. */
const ANCHOR = '"soc.claimLead"';
const KEY = "soc.whyLead";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUES = {
  en: "You asked",
  es: "Preguntaste",
  fr: "Tu as demandé",
  pt: "Perguntaste",
  ar: "سألت",
  sw: "Uliuliza",
  hi: "आपने पूछा",
  id: "Kamu bertanya",
  tl: "Itinanong mo",
  de: "Du hast gefragt",
  ja: "あなたの質問",
  zh: "你问的是",
  fa: "پرسیدی",
  ur: "آپ نے پوچھا",
  bn: "তুমি জিজ্ঞেস করেছ",
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
  const [from, to] = dictSpan(code);
  let block = src.slice(from, to);
  const anchor = block.indexOf(`${ANCHOR}:`);
  if (anchor < 0) {
    problems.push(`${code}: anchor ${ANCHOR} missing`);
  } else {
    const lineEnd = block.indexOf("\n", anchor);
    const indent = " ".repeat(anchor - block.lastIndexOf("\n", anchor) - 1);
    block = block.slice(0, lineEnd) + `\n${indent}"${KEY}": ${JSON.stringify(VALUES[code])},` + block.slice(lineEnd);
  }
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
console.log(`added ${KEY} in ${LANGS.length} dictionaries`);
