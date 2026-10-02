// One-shot i18n: rename the two hint-count keys to the fact they now state.
//
// WHY THESE KEYS CHANGE NAMES. `next.ev.hints` / `next.ev.hintsOne` were the
// engine's evidence-line fragment for HOW the work was done, and the number they
// rendered came from `ConceptProgress.hints` — the per-level tally the hint
// endpoint writes and the fold does NOT reproduce (lib/replay.ts's
// LEDGER_ABSENT_FIELDS). So for any learner whose answers arrived from a device
// after working offline, the card that answers "why am I seeing this?" announced
// `0 hints used` however much help had actually been taken. The engine now reads
// `ConceptProgress.hinted` — the count of ANSWERS that took help — which the fold
// owns, and the key has to say that instead of saying "hints".
//
// A rename rather than a silent value-swap: a key called `next.ev.hints` carrying
// the string "9 needed help" is a lie to the next maintainer, and these two keys
// have exactly one consumer (lib/next-engine.ts's `attemptText`), so the rename
// is free.
//
// Same convention as the other one-shot scripts (i18n-prove-branch.mjs,
// i18n-offline-sync.mjs): replace inside each dictionary literal by hand, then
// assert every language is complete and refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";

/** Dictionary order in the file — NOT the order of `LANGS`, which lists `ur`
 *  before `fa` while the file declares `fa` first. Located by each dictionary's
 *  own header rather than by offset, so insertion order cannot matter. */
const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

/** The fact: answers that took at least one hint. Same telegraphic register as
 *  the sentence's neighbours ("10 attempts · 9 needed help · mastery 23%"). */
const HELPED = {
  en: ["needed help", "needed help"],
  es: ["necesitaron ayuda", "necesitó ayuda"],
  fr: ["ont eu besoin d'aide", "a eu besoin d'aide"],
  pt: ["precisaram de ajuda", "precisou de ajuda"],
  ar: ["احتاجت مساعدة", "احتاج مساعدة"],
  sw: ["zilihitaji msaada", "lilihitaji msaada"],
  hi: ["मदद चाहिए थी", "मदद चाहिए थी"],
  id: ["butuh bantuan", "butuh bantuan"],
  tl: ["kailangan ng tulong", "kailangan ng tulong"],
  de: ["brauchten Hilfe", "brauchte Hilfe"],
  ja: ["ヒントが必要", "ヒントが必要"],
  zh: ["需要提示", "需要提示"],
  fa: ["کمک لازم داشت", "کمک لازم داشت"],
  ur: ["مدد درکار تھی", "مدد درکار تھی"],
  bn: ["সহায়তা দরকার ছিল", "সহায়তা দরকার ছিল"],
};

/** The concept page's own label for the same fact (`ev.hints`, one consumer:
 *  app/learn/[subject]/[concept]/page.tsx, which rendered `evidence.hintsUsed`).
 *  Same defect, same fix, same vocabulary — so it is renamed in the same pass
 *  rather than left saying "Hints used" about a count of answers. */
const EV = {
  en: "With help", es: "Con ayuda", fr: "Avec aide", pt: "Com ajuda",
  ar: "بمساعدة", sw: "Kwa msaada", hi: "मदद के साथ", id: "Pakai bantuan",
  tl: "May tulong", de: "Mit Hilfe", ja: "ヒントあり", zh: "用了提示",
  fa: "با راهنما", ur: "اشارے کے ساتھ", bn: "ইঙ্গিতসহ",
};

const SECTIONS = [
  { old: '"next.ev.hints"', next: '"next.ev.helped"', value: (c) => HELPED[c][0] },
  { old: '"next.ev.hintsOne"', next: '"next.ev.helpedOne"', value: (c) => HELPED[c][1] },
  { old: '"ev.hints"', next: '"ev.helped"', value: (c) => EV[c] },
];

let src = fs.readFileSync(FILE, "utf8");

if (SECTIONS.every((s) => src.includes(s.next))) {
  console.log("already applied — nothing to do");
  process.exit(0);
}

/** The span of one dictionary literal: from `export const <code>: Dict = {` to
 *  the line that closes it at column 0. */
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
  const block = src.slice(from, to);
  const swap = (text, oldKey, newKey, value) => {
    const re = new RegExp(`${oldKey.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}: "[^"]*"`);
    // Idempotent per section: a section already applied by an earlier run is a
    // no-op, so adding a section later cannot re-write the ones already done.
    if (text.includes(newKey)) return text;
    if (!re.test(text)) throw new Error(`${code}: ${oldKey} missing`);
    return text.replace(re, `${newKey}: "${value}"`);
  };
  let next = block;
  for (const s of SECTIONS) next = swap(next, s.old, s.next, s.value(code));
  src = src.slice(0, from) + next + src.slice(to);
}

// Every dictionary must carry every new key, and no old key may survive.
for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  const block = src.slice(from, to);
  for (const s of SECTIONS) if (!block.includes(s.next)) problems.push(`${code}: no ${s.next}`);
}
for (const s of SECTIONS) if (src.includes(s.old)) problems.push(`${s.old} survived in i18n.ts`);
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

fs.writeFileSync(FILE, src);
console.log(`renamed ${SECTIONS.map((s) => `${s.old} → ${s.next}`).join(", ")} in ${LANGS.length} dictionaries`);
