// One-shot i18n: the sentence a spaced review shows when nothing has been
// proved yet.
//
// WHY THIS STRING EXISTS. `next.reason.retrieve` says "You proved this before —
// a quick retrieval now makes it stick." The RETRIEVE branch fired for every
// concept whose review interval had elapsed and said that to all of them —
// including a learner who had NEVER answered the concept without help. The
// model holds the distinction (lib/learner-model.ts#provedUnaided), and the same
// decision list already says "Prove it: do one unaided before moving on" about
// the same concept, so the card was contradicting the engine beside it: a claim
// about the LEARNER drawn from a fact about the SCHEDULE.
//
// The branch now picks its sentence from the evidence, and this is the half the
// dictionaries were missing.
//
// Same convention as the other one-shot scripts (i18n-prove-branch.mjs,
// i18n-scaffolding-count.mjs): insert beside a sibling anchor in every
// dictionary by hand, then assert completeness and refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling it belongs beside, and a key `verify` already requires every
 *  language to carry — so its presence in all fifteen is a maintained fact. */
const ANCHOR = '"next.reason.retrieve"';
const KEY = "next.reason.retrieveUnproved";

const VALUES = {
  en: "This is due for review and has not been done unaided yet — recalling it now is what tells us where it really stands.",
  es: "Toca repasarlo y aún no lo has hecho sin ayuda: recordarlo ahora es lo que nos dice en qué punto estás de verdad.",
  fr: "C'est à revoir, et tu ne l'as pas encore fait sans aide — s'en souvenir maintenant est ce qui nous dit où tu en es vraiment.",
  pt: "Está na hora de revisar e ainda não o fizeste sem ajuda — recordá-lo agora é o que nos diz onde estás de verdade.",
  ar: "حان وقت المراجعة ولم تُنجزه بعد دون مساعدة — استرجاعه الآن هو ما يخبرنا أين تقف حقًا.",
  sw: "Ni wakati wa kurudia na bado hujafanya bila msaada — kuikumbuka sasa ndiko kunatuambia ulipo kweli.",
  hi: "यह दोहराने का समय है और अभी तक बिना मदद के किया नहीं गया — अब याद करना ही बताता है कि तुम असल में कहाँ हो।",
  id: "Sudah waktunya diulang dan belum pernah dikerjakan tanpa bantuan — mengingatnya sekarang yang menunjukkan posisimu sebenarnya.",
  tl: "Panahon na para balikan ito at hindi pa ito nagagawa nang walang tulong — ang maalala ito ngayon ang nagsasabi kung nasaan ka talaga.",
  de: "Es ist zur Wiederholung fällig und wurde noch nie ohne Hilfe gemacht — es jetzt abzurufen zeigt, wo du wirklich stehst.",
  ja: "そろそろ復習の時期ですが、まだ自力では解いていません。今思い出せることが、本当の定着を教えてくれます。",
  zh: "这一项到了复习时间，但还没有独立完成过 — 现在回忆一次，才能看出真正掌握到什么程度。",
  fa: "وقت مرورش رسیده و هنوز بدون کمک انجامش نداده‌ای — یادآوری همین حالا نشان می‌دهد واقعاً کجا ایستاده‌ای.",
  ur: "یہ دہرانے کا وقت ہے اور ابھی تک مدد کے بغیر کیا نہیں گیا — اب یاد کرنا ہی بتاتا ہے کہ تم واقعی کہاں ہو۔",
  bn: "এটি দোহরানোর সময় হয়েছে আর এখনো সহায়তা ছাড়া করা হয়নি — এখন মনে করা আমাদের বলে দেয় আপনি সত্যিই কোথায় আছেন।",
};

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

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
  const block = src.slice(from, to);
  const anchor = block.indexOf(`${ANCHOR}:`);
  if (anchor < 0) {
    problems.push(`${code}: anchor ${ANCHOR} missing`);
    continue;
  }
  // Beside the anchor, on its own line, indented as the dictionary indents.
  const lineEnd = block.indexOf("\n", anchor);
  const indent = " ".repeat(block.lastIndexOf("\n", anchor) + 1 === anchor ? 0 : anchor - block.lastIndexOf("\n", anchor) - 1);
  const line = `\n${indent}"${KEY}": ${JSON.stringify(VALUES[code])},`;
  src = src.slice(0, from + lineEnd) + line + src.slice(from + lineEnd);
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
console.log(`added ${KEY} to ${LANGS.length} dictionaries`);
