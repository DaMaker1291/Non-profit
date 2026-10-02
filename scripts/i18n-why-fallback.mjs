// One-shot i18n: the "why now" line, made true for every kind that reaches it.
//
// WHY. `why` answers "why NOW?" and every action's is produced by one function.
// Its final fallback — `next.why.evidence` — said **"This is the weakest
// evidence in the model right now"**, and with an exam more than a month out
// (urgency "none", date set) that is the string EVERY kind falls through to. So
// a due review was described as the weakest evidence when it is the most
// OVERDUE, and a transfer target — the concept the learner has just proved
// unaided — was described as the weakest evidence in the model, about the one
// concept that is demonstrably not. The reason field beside it was already
// per-branch; only this line was shared, and a shared line cannot make a claim
// about the learner for kinds that did not earn it.
//
// The fix is two strings:
//   next.why.evidence  rewritten so it is TRUE for every kind that reaches it
//                      (no deadline is pressing; the evidence chose this)
//   next.why.due       NEW — the overdue review states its own timing fact
//
// Same convention as the other one-shot scripts (i18n-prove-branch.mjs,
// i18n-scaffolding-count.mjs): each dictionary edited by hand, completeness
// asserted, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling these belong beside in every dictionary. */
const ANCHOR = '"next.why.noExam"';

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const EVIDENCE = {
  en: "No deadline is pressing — this is what your evidence points to right now.",
  es: "No hay ningún plazo urgente: esto es a lo que apuntan tus evidencias ahora mismo.",
  fr: "Aucune échéance n'est proche — voici ce que disent tes résultats pour le moment.",
  pt: "Não há prazo a apertar — é isto que as tuas evidências indicam neste momento.",
  ar: "لا يوجد موعد نهائي ملحّ — هذا ما تشير إليه أدلتك الآن.",
  sw: "Hakuna tarehe ya mwisho inayokaza — hii ndiyo inayoonyeshwa na ushahidi wako sasa.",
  hi: "कोई समय-सीमा नहीं दबा रही — अभी आपके प्रमाण यही बता रहे हैं।",
  id: "Tidak ada tenggat yang mendesak — inilah yang ditunjukkan buktimu saat ini.",
  tl: "Walang nagmamadaling deadline — ito ang itinuturo ng ebidensiya mo ngayon.",
  de: "Keine Frist drängt — das ist, worauf deine Belege gerade zeigen.",
  ja: "迫っている締め切りはありません。今の根拠が示しているのはこれです。",
  zh: "没有临近的截止期限 — 这是你目前的证据所指向的。",
  fa: "هیچ مهلتی فشار نمی‌آورد — اکنون شواهدت همین را نشان می‌دهد.",
  ur: "کوئی آخری تاریخ دباؤ نہیں ڈال رہی — ابھی آپ کے شواہد یہی بتاتے ہیں۔",
  bn: "কোনো সময়সীমা চাপ দিচ্ছে না — এখন আপনার প্রমাণই এটিই দেখাচ্ছে।",
};

const DUE = {
  en: "This review is overdue — the gap is what makes recalling it worth doing today.",
  es: "Este repaso está atrasado: el tiempo transcurrido es lo que hace que recordarlo valga la pena hoy.",
  fr: "Cette révision est en retard — c'est l'écart qui rend son rappel utile aujourd'hui.",
  pt: "Esta revisão está atrasada — é o intervalo que torna a recordação útil hoje.",
  ar: "هذه المراجعة متأخرة — الفجوة الزمنية هي ما يجعل تذكّره مفيدًا اليوم.",
  sw: "Marudio haya yamechelewa — pengo la muda ndilo linalofanya kuyakumbuka kuwe na faida leo.",
  hi: "यह दोहराव बाकी है — बीता समय ही इसे आज याद करने लायक बनाता है।",
  id: "Ulangan ini sudah lewat — jedanya itulah yang membuat mengingatnya berguna hari ini.",
  tl: "Nalampasan na ang balik-aral na ito — ang agwat ang dahilan kaya sulit itong alalahanin ngayon.",
  de: "Diese Wiederholung ist überfällig — der Abstand macht sie heute lohnend.",
  ja: "この復習は予定を過ぎています。間隔があるからこそ、今思い出す価値があります。",
  zh: "这次复习已经逾期 — 正因为隔了这么久，今天回忆一次才有价值。",
  fa: "این مرور عقب افتاده است — همین فاصله است که یادآوری امروز را ارزشمند می‌کند.",
  ur: "یہ دہراؤ تاخیر سے ہے — یہی وقفہ اسے آج یاد کرنے کے قابل بناتا ہے۔",
  bn: "এই পুনরালোচনা সময় পার করেছে — এই বিরতিই আজ মনে করার মতো করে তোলে।",
};

const PLAN = [
  { key: "next.why.evidence", values: EVIDENCE },
  { key: "next.why.due", values: DUE, insert: true },
];

let src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${PLAN[1].key}"`)) {
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

  // Rewrite the existing fallback in place: same key, true value.
  const re = /"next\.why\.evidence": "[^"]*"/;
  if (!re.test(block)) {
    problems.push(`${code}: next.why.evidence missing`);
  } else {
    block = block.replace(re, `"next.why.evidence": ${JSON.stringify(EVIDENCE[code])}`);
  }

  // Insert the new key beside its sibling anchor.
  const anchor = block.indexOf(`${ANCHOR}:`);
  if (anchor < 0) {
    problems.push(`${code}: anchor ${ANCHOR} missing`);
  } else {
    const lineEnd = block.indexOf("\n", anchor);
    const indent = " ".repeat(anchor - block.lastIndexOf("\n", anchor) - 1);
    block = block.slice(0, lineEnd) + `\n${indent}"next.why.due": ${JSON.stringify(DUE[code])},` + block.slice(lineEnd);
  }

  src = src.slice(0, from) + block + src.slice(to);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  const block = src.slice(from, to);
  for (const p of PLAN) if (!block.includes(`"${p.key}"`)) problems.push(`${code}: no ${p.key}`);
  if (block.includes("weakest evidence")) problems.push(`${code}: the claim survived`);
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

fs.writeFileSync(FILE, src);
console.log(`rewrote next.why.evidence and added next.why.due in ${LANGS.length} dictionaries`);
