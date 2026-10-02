// One-shot i18n: the tutor's explain and worked-example moves.
//
// WHY. "Explain it to me" and "show me a worked example" were not recognised as
// requests at all, so both fell through to the unclear/off-topic reply — and so
// did "The capital of France is Paris.". Three different inputs, ONE reply,
// measured by the product benchmark (8/10 distinct replies). A learner asking
// to be taught was told to say which step they were on.
//
// The two moves the product already owns: the idea said once (the concept line
// the engine carries anyway), and the engine's OWN generated worked example —
// the same material `/api/ai` hands over when no model is configured, on a
// different question from the one on screen. `soc.exampleNone` is the honest
// branch for a concept with no generator.
//
// Same convention as the other one-shot scripts (i18n-why-lead.mjs,
// i18n-claim.mjs): each dictionary edited by hand, completeness asserted,
// refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling these belong beside in every dictionary. */
const ANCHOR = '"soc.hintLead"';

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const PLAN = [
  ["soc.explainLead", {
    en: "Here is the idea, once — then we use it",
    es: "Esta es la idea, una vez — y luego la usamos",
    fr: "Voici l'idée, une fois — ensuite on l'utilise",
    pt: "É esta a ideia, uma vez — depois usamo-la",
    ar: "هذه هي الفكرة مرة واحدة — ثم نستخدمها",
    sw: "Hili ndilo wazo, mara moja — kisha tunalitumia",
    hi: "यही विचार है, एक बार — फिर हम इसे इस्तेमाल करेंगे",
    id: "Ini idenya, sekali — lalu kita pakai",
    tl: "Ito ang ideya, minsan — pagkatapos, gagamitin natin",
    de: "Hier ist die Idee, einmal — dann nutzen wir sie",
    ja: "考え方はこれです。一度だけ — 次に使います",
    zh: "这就是这个思路，先说一遍 — 然后我们用它",
    fa: "این ایده است، یک بار — بعد از آن به کارش می‌بریم",
    ur: "یہ ہے خیال، ایک بار — پھر ہم اسے استعمال کریں گے",
    bn: "এই হলো ধারণাটি, একবার — তারপর আমরা এটি ব্যবহার করি",
  }],
  ["soc.explainQ", {
    en: "Say it back in your own words, then we'll do one step together.",
    es: "Dilo con tus propias palabras y después haremos un paso juntos.",
    fr: "Redis-la avec tes propres mots, puis on fera un pas ensemble.",
    pt: "Diz com as tuas palavras, depois fazemos um passo juntos.",
    ar: "أعدها بكلماتك، ثم نخطو خطوة معًا.",
    sw: "Liseme kwa maneno yako, kisha tutafanya hatua moja pamoja.",
    hi: "इसे अपने शब्दों में कहें, फिर हम मिलकर एक कदम करेंगे।",
    id: "Ucapkan dengan kata-katamu, lalu kita lakukan satu langkah bersama.",
    tl: "Sabihin mo ito sa sarili mong salita, tapos isang hakbang tayong gagawa.",
    de: "Sag es in eigenen Worten, dann machen wir einen Schritt zusammen.",
    ja: "自分の言葉で言い直してから、一緒に一歩やりましょう。",
    zh: "用你自己的话复述一遍，然后我们一起做一步。",
    fa: "با کلمات خودت بگو، بعد یک قدم را با هم می‌رویم.",
    ur: "اسے اپنے الفاظ میں دہراؤ، پھر ہم مل کر ایک قدم کریں گے۔",
    bn: "নিজের ভাষায় বলো, তারপর আমরা একসঙ্গে একটি ধাপ করি।",
  }],
  ["soc.exampleLead", {
    en: "Here is a worked example of this idea — a different question from the one on your screen",
    es: "Aquí tienes un ejemplo resuelto de esta idea — una pregunta distinta de la que tienes en pantalla",
    fr: "Voici un exemple résolu de cette idée — une question différente de celle à l'écran",
    pt: "Aqui está um exemplo resolvido desta ideia — uma pergunta diferente da que está no ecrã",
    ar: "إليك مثالًا محلولًا لهذه الفكرة — سؤال مختلف عن الذي أمامك",
    sw: "Hapa kuna mfano uliofanyiwa wa wazo hili — swali tofauti na lile lililo kwenye skrini yako",
    hi: "यह इस विचार का हल किया हुआ उदाहरण है — आपकी स्क्रीन वाले प्रश्न से अलग",
    id: "Berikut contoh yang sudah dikerjakan untuk ide ini — soal yang berbeda dari yang di layarmu",
    tl: "Narito ang isang nasagutang halimbawa ng ideyang ito — ibang tanong mula sa nasa screen mo",
    de: "Hier ist ein durchgerechnetes Beispiel dieser Idee — eine andere Aufgabe als die auf deinem Bildschirm",
    ja: "この考え方の解答例です — 画面の問題とは別の問題です",
    zh: "这是这个思路的一个已解示例 — 与你屏幕上的题不同",
    fa: "این یک مثال حل‌شده از این ایده است — پرسشی متفاوت از آنچه روی صفحه داری",
    ur: "یہ اس خیال کی حل شدہ مثال ہے — آپ کی سکرین والے سوال سے مختلف",
    bn: "এই ধারণার একটি সমাধান করা উদাহরণ — তোমার স্ক্রিনের প্রশ্ন থেকে আলাদা",
  }],
  ["soc.exampleQ", {
    en: "Which step would you try first on your own question?",
    es: "¿Qué paso intentarías primero en tu propia pregunta?",
    fr: "Quelle étape essaierais-tu d'abord sur ta propre question ?",
    pt: "Que passo tentarias primeiro na tua própria pergunta?",
    ar: "أي خطوة ستجربها أولًا في سؤالك؟",
    sw: "Ni hatua ipi ungejaribu kwanza kwenye swali lako?",
    hi: "अपने प्रश्न में आप पहले कौन-सा कदम आज़माएँगे?",
    id: "Langkah mana yang akan kamu coba dulu pada soalnya?",
    tl: "Aling hakbang ang una mong susubukan sa sarili mong tanong?",
    de: "Welchen Schritt würdest du bei deiner Aufgabe zuerst versuchen?",
    ja: "自分の問題では、どの手順から試しますか？",
    zh: "在你自己的题上，你会先试哪一步？",
    fa: "روی پرسش خودت اول کدام گام را امتحان می‌کنی؟",
    ur: "اپنے سوال میں آپ پہلے کون سا قدم آزمائیں گے؟",
    bn: "নিজের প্রশ্নে তুমি কোন ধাপটি আগে চেষ্টা করবে?",
  }],
  ["soc.exampleNone", {
    en: "This concept has no generated example — the lesson above walks one through.",
    es: "Este concepto no tiene un ejemplo generado — la lección de arriba explica uno.",
    fr: "Ce concept n'a pas d'exemple généré — la leçon ci-dessus en déroule un.",
    pt: "Este conceito não tem exemplo gerado — a lição acima resolve um.",
    ar: "هذا المفهوم ليس له مثال مولّد — الدرس أعلى الصفحة يشرح مثالًا.",
    sw: "Wazo hili halina mfano uliozalishwa — somo la juu linafanya mfano mmoja.",
    hi: "इस अवधारणा का कोई बना हुआ उदाहरण नहीं है — ऊपर का पाठ एक उदाहरण समझाता है।",
    id: "Konsep ini tidak punya contoh yang dihasilkan — pelajaran di atas menjelaskan satu.",
    tl: "Walang nalikhang halimbawa ang konseptong ito — may isang hinakbang ang aralin sa itaas.",
    de: "Für dieses Konzept gibt es kein erzeugtes Beispiel — die Lektion oben rechnet eines vor.",
    ja: "この概念には生成された例がありません — 上のレッスンが一例を示しています。",
    zh: "这个概念没有生成的示例 — 上面的课文讲解了一个。",
    fa: "این مفهوم مثال تولیدشده ندارد — درس بالای صفحه یکی را حل می‌کند.",
    ur: "اس تصور کی کوئی بنی ہوئی مثال نہیں — اوپر کا سبق ایک مثال سمجھاتا ہے۔",
    bn: "এই ধারণার কোনো তৈরি উদাহরণ নেই — উপরের পাঠে একটি উদাহরণ আছে।",
  }],
];

let src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${PLAN[0][0]}"`)) {
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
    const insert = PLAN.map(([key, values]) => `${indent}"${key}": ${JSON.stringify(values[code])},`).join("\n");
    block = block.slice(0, lineEnd) + `\n${insert}` + block.slice(lineEnd);
  }
  src = src.slice(0, from) + block + src.slice(to);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  const block = src.slice(from, to);
  for (const [key] of PLAN) if (!block.includes(`"${key}"`)) problems.push(`${code}: no ${key}`);
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

fs.writeFileSync(FILE, src);
console.log(`added ${PLAN.length} tutor keys in ${LANGS.length} dictionaries`);
