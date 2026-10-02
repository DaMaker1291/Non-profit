// One-shot i18n: THE TUTOR'S THREE NEW MOVES (§tutor).
//
// The acceptance battery showed what the offline tutor did with eight
// different messages: every single one came back as the concept definition
// plus a Socratic question. A learner who asked for a hint got a question about
// their intuition; a learner who asked about the capital of France got the
// place-value lesson. Five sentences fix that, and each one is a sentence a
// learner reads, so all five go into all fifteen dictionaries:
//
//   soc.hintLead     where the four-level hint ladder is (a hint request is a
//                    request the page can already answer)
//   soc.hintQ        the question that follows it
//   soc.otherConcept names the OTHER concept a message named, and says it has
//                    its own page
//   soc.hereInstead  what we are anchored to while that one waits
//   soc.unclear      the offer made when a message touches nothing on screen
//
// Anchored beside `soc.restate`, which every dictionary already carries and
// which is the last of the family. Resolved by dictionary NAME, never by
// position (the dictionaries in lib/i18n.ts are not in `LANGS` order).
//
// Run: node scripts/i18n-socratic.mjs
// Idempotent PER KEY: present keys are skipped and the rest are still written.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"soc.restate"';
const KEYS = ["soc.hintLead", "soc.hintQ", "soc.otherConcept", "soc.hereInstead", "soc.unclear"];

const TEXT = {
  en: {
    "soc.hintLead": "There are four levels of hint under the question — take level 1 first, then the next only if you are still stuck.",
    "soc.hintQ": "Which step are you on when it stops making sense?",
    "soc.otherConcept": "That is a different idea — {other} has its own page, and I can help with it there.",
    "soc.hereInstead": "We are on {concept} here.",
    "soc.unclear": "I can only follow this question with you, so tell me which step of it you are on.",
  },
  es: {
    "soc.hintLead": "Hay cuatro niveles de pista debajo de la pregunta: empieza por el nivel 1 y pasa al siguiente solo si sigues atascado.",
    "soc.hintQ": "¿En qué paso deja de tener sentido para ti?",
    "soc.otherConcept": "Esa es otra idea: {other} tiene su propia página y allí sí puedo ayudarte.",
    "soc.hereInstead": "Aquí estamos con {concept}.",
    "soc.unclear": "Solo puedo seguir esta pregunta contigo, así que dime en qué paso vas.",
  },
  fr: {
    "soc.hintLead": "Il y a quatre niveaux d'indice sous la question : commence par le niveau 1, puis passe au suivant seulement si tu es encore bloqué.",
    "soc.hintQ": "À quelle étape cela cesse-t-il d'être clair ?",
    "soc.otherConcept": "C'est une autre idée : {other} a sa propre page, et je peux t'y aider.",
    "soc.hereInstead": "Ici, nous travaillons {concept}.",
    "soc.unclear": "Je ne peux suivre cette question qu'avec toi : dis-moi à quelle étape tu en es.",
  },
  pt: {
    "soc.hintLead": "Há quatro níveis de dica por baixo da pergunta: começa no nível 1 e passa ao seguinte só se ainda estiveres preso.",
    "soc.hintQ": "Em que passo é que deixa de fazer sentido?",
    "soc.otherConcept": "Essa é outra ideia: {other} tem página própria e posso ajudar-te lá.",
    "soc.hereInstead": "Aqui estamos em {concept}.",
    "soc.unclear": "Só consigo acompanhar esta pergunta contigo, por isso diz-me em que passo estás.",
  },
  ar: {
    "soc.hintLead": "هناك أربعة مستويات من التلميح أسفل السؤال: ابدأ بالمستوى الأول، ثم انتقل إلى التالي فقط إذا بقيت متعثراً.",
    "soc.hintQ": "في أي خطوة يتوقف المعنى عندك؟",
    "soc.otherConcept": "تلك فكرة أخرى — لـ{other} صفحتها الخاصة، وأستطيع مساعدتك هناك.",
    "soc.hereInstead": "نحن هنا مع {concept}.",
    "soc.unclear": "لا أستطيع متابعة هذا السؤال إلا معك، فأخبرني في أي خطوة أنت.",
  },
  sw: {
    "soc.hintLead": "Kuna ngazi nne za kidokezo chini ya swali — anza na ngazi ya 1, kisha ya pili ikiwa bado umekwama.",
    "soc.hintQ": "Uko hatua gani inapokosa maana?",
    "soc.otherConcept": "Hilo ni wazo lingine — {other} ina ukurasa wake, na naweza kukusaidia huko.",
    "soc.hereInstead": "Hapa tuko kwenye {concept}.",
    "soc.unclear": "Naweza kufuatilia swali hili pamoja nawe tu, kwa hiyo niambie uko hatua gani.",
  },
  hi: {
    "soc.hintLead": "प्रश्न के नीचे चार स्तर के संकेत हैं — पहले स्तर 1 लें, और अगला तभी जब आप अब भी अटके हों।",
    "soc.hintQ": "किस चरण पर समझ टूटती है?",
    "soc.otherConcept": "वह दूसरा विचार है — {other} का अपना पृष्ठ है, वहाँ मैं मदद कर सकता हूँ।",
    "soc.hereInstead": "यहाँ हम {concept} पर हैं।",
    "soc.unclear": "मैं इस प्रश्न में ही आपके साथ चल सकता हूँ, इसलिए बताइए आप किस चरण पर हैं।",
  },
  id: {
    "soc.hintLead": "Ada empat tingkat petunjuk di bawah soal — mulai dari tingkat 1, lalu lanjut hanya jika masih tersangkut.",
    "soc.hintQ": "Di langkah mana kamu merasa mulai tidak masuk akal?",
    "soc.otherConcept": "Itu ide lain — {other} punya halamannya sendiri, dan aku bisa membantu di sana.",
    "soc.hereInstead": "Di sini kita sedang di {concept}.",
    "soc.unclear": "Aku hanya bisa mengikuti soal ini bersamamu, jadi beri tahu aku kamu di langkah mana.",
  },
  tl: {
    "soc.hintLead": "May apat na antas ng hint sa ilalim ng tanong — simulan sa antas 1, tapos sa susunod kung natigil ka pa.",
    "soc.hintQ": "Sa aling hakbang nagiging malabo para sa iyo?",
    "soc.otherConcept": "Iba iyon — may sariling pahina ang {other}, at matutulungan kita doon.",
    "soc.hereInstead": "Narito tayo sa {concept}.",
    "soc.unclear": "Kasama lang kita sa tanong na ito, kaya sabihin mo kung saang hakbang ka na.",
  },
  ur: {
    "soc.hintLead": "سوال کے نیچے چار درجے کے اشارے ہیں — پہلے درجہ 1 لیں، اور اگلا تب ہی جب اب بھی اٹکے ہوں۔",
    "soc.hintQ": "کس قدم پر سمجھ ٹوٹتی ہے؟",
    "soc.otherConcept": "یہ ایک الگ خیال ہے — {other} کا اپنا صفحہ ہے، وہاں میں مدد کر سکتا ہوں۔",
    "soc.hereInstead": "یہاں ہم {concept} پر ہیں۔",
    "soc.unclear": "میں اس سوال میں ہی تمہارے ساتھ چل سکتا ہوں، اس لیے بتاؤ کہ کس قدم پر ہو۔",
  },
  fa: {
    "soc.hintLead": "چهار سطح راهنما زیر سؤال هست — نخست سطح ۱ را بگیر و فقط اگر هنوز گیر کردی به سطح بعد برو.",
    "soc.hintQ": "در کدام گام معنا از دست می‌رود؟",
    "soc.otherConcept": "آن ایده دیگری است — {other} صفحهٔ خودش را دارد و آنجا می‌توانم کمک کنم.",
    "soc.hereInstead": "اینجا روی {concept} هستیم.",
    "soc.unclear": "فقط می‌توانم این سؤال را با تو دنبال کنم، پس بگو در کدام گام هستی.",
  },
  de: {
    "soc.hintLead": "Unter der Aufgabe stehen vier Hinweisstufen — nimm zuerst Stufe 1 und die nächste nur, wenn du noch festhängst.",
    "soc.hintQ": "An welchem Schritt wird es unklar?",
    "soc.otherConcept": "Das ist eine andere Idee — {other} hat eine eigene Seite, dort kann ich helfen.",
    "soc.hereInstead": "Hier geht es um {concept}.",
    "soc.unclear": "Ich kann dieser Aufgabe nur mit dir folgen, sag mir also, an welchem Schritt du bist.",
  },
  ja: {
    "soc.hintLead": "問題の下に4段階のヒントがあります — まずレベル1から、まだ行き詰まっているときだけ次へ進みましょう。",
    "soc.hintQ": "どの段階で分からなくなりますか？",
    "soc.otherConcept": "それは別の考えです — {other} には専用のページがあり、そこで手伝えます。",
    "soc.hereInstead": "ここでは {concept} を扱っています。",
    "soc.unclear": "この問題は一緒にしか追えません。どの段階にいるか教えてください。",
  },
  zh: {
    "soc.hintLead": "题目下面有四个级别的提示——先用第 1 级，仍然卡住再用下一级。",
    "soc.hintQ": "你在哪一步开始不明白？",
    "soc.otherConcept": "那是另一个概念——{other} 有自己的页面，我可以在那里帮你。",
    "soc.hereInstead": "我们这里学的是 {concept}。",
    "soc.unclear": "我只能陪你跟完这道题，告诉我你在哪一步。",
  },
  bn: {
    "soc.hintLead": "প্রশ্নের নিচে চার স্তরের ইঙ্গিত আছে — আগে স্তর ১ নিন, আর পরের স্তর কেবল তখনই নিন যখন আপনি এখনও আটকে আছেন।",
    "soc.hintQ": "কোন ধাপে বিষয়টি অস্পষ্ট হয়ে যায়?",
    "soc.otherConcept": "এটি আলাদা ধারণা — {other} এর নিজের পাতা আছে, ওখানে আমি সাহায্য করতে পারি।",
    "soc.hereInstead": "এখানে আমরা {concept} নিয়ে কাজ করছি।",
    "soc.unclear": "আমি এই প্রশ্নেই আপনার সঙ্গে চলতে পারি, তাই বলুন আপনি কোন ধাপে আছেন।",
  },
};

const CODES = Object.keys(TEXT);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const [code, texts] of Object.entries(TEXT)) {
  const missing = KEYS.filter((k) => typeof texts[k] !== "string" || !texts[k]);
  if (missing.length) throw new Error(`${code}: no text for ${missing.join(", ")}`);
}

const src = fs.readFileSync(FILE, "utf8");
const TODO = KEYS.filter((k) => !src.includes(`"${k}"`));
if (TODO.length === 0) {
  console.log("socratic keys already present — nothing to do");
  process.exit(0);
}
console.log(`adding ${TODO.join(", ")} to ${CODES.length} dictionaries`);

const lines = src.split("\n");
const insertions = [];
for (const code of CODES) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no \`const ${code}: Dict = {\` in ${FILE}`);
  const end = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  const stop = end < 0 ? lines.length : end;
  const idx = lines.findIndex((l, i) => i > start && i < stop && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  insertions.push({
    at: idx + 1,
    lines: TODO.map((key) => {
      const escaped = TEXT[code][key].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `${indent}"${key}": "${escaped}",`;
    }),
  });
}
if (new Set(insertions.map((i) => i.at)).size !== insertions.length) {
  throw new Error("two languages resolved to the same anchor — refusing to write");
}
insertions.sort((a, b) => b.at - a.at);
for (const ins of insertions) lines.splice(ins.at, 0, ...ins.lines);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${CODES.length * TODO.length} strings (${TODO.length} keys × ${CODES.length} languages) to ${FILE}`);
