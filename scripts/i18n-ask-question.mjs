// One-shot i18n: `soc.askQuestion`.
//
// A message with no words in it ("xx", "?", "z") cannot be answered
// Socratically — there is nothing to ask about — and replying with a lecture
// about a concept nobody mentioned is what made the tutor look canned. The
// tutor now says plainly what it needs instead. Learner-visible, so it exists in
// all fifteen dictionaries, inserted beside a sibling key by hand.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"soc.restate"';

const TEXTS = [
  ["en", "Tell me the question, or the step you are on, and I will ask you the right thing."],
  ["es", "Dime la pregunta, o el paso en el que estás, y te haré la pregunta adecuada."],
  ["fr", "Donne-moi la question, ou l'étape où tu bloques, et je te poserai la bonne question."],
  ["pt", "Diz-me a pergunta, ou o passo em que estás, e faço-te a pergunta certa."],
  ["ar", "أخبرني بالسؤال، أو بالخطوة التي وصلت إليها، وسأسألك السؤال المناسب."],
  ["sw", "Niambie swali, au hatua uliyofikia, nami nitakuuliza swali sahihi."],
  ["hi", "प्रश्न बताइए, या जिस चरण पर अटके हैं, और मैं सही प्रश्न पूछूँगा।"],
  ["id", "Sebutkan soalnya, atau langkah yang sedang kamu kerjakan, dan aku akan menanyakan hal yang tepat."],
  ["tl", "Sabihin mo ang tanong, o ang hakbang na ginagawa mo, at itatanong ko ang tamang bagay."],
  ["de", "Nenne mir die Aufgabe oder den Schritt, an dem du hängst, dann stelle ich dir die richtige Frage."],
  ["ja", "問題か、どこで止まっているかを教えてください。こちらから適切な問いを出します。"],
  ["zh", "把题目或你卡住的那一步告诉我，我会问你该问的问题。"],
  ["fa", "پرسش یا مرحله‌ای که در آن مانده‌ای را بگو تا پرسش درست را بپرسم."],
  ["ur", "سوال یا جس مرحلے پر رکے ہیں وہ بتائیں، میں صحیح سوال پوچھوں گا۔"],
  ["bn", "প্রশ্নটি বা তুমি যে ধাপে আটকে আছ সেটি বলো, আমি ঠিক প্রশ্নটি করব।"],
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"soc.askQuestion"')) {
  console.log("soc.askQuestion already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const anchors = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(ANCHOR)) anchors.push(i);
if (anchors.length !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ANCHOR} anchors, found ${anchors.length} — refusing to guess which dictionary is which`);
}

for (let i = anchors.length - 1; i >= 0; i--) {
  const [lang, text] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.splice(anchors[i] + 1, 0, `${indent}"soc.askQuestion": "${escaped}",`);
  console.log(`${lang}: added`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
