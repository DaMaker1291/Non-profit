// One-shot i18n: the tutor's disclosure and "why this step" lines.
//
// Two new learner-visible strings, and neither may exist in English only:
//
//   tutor.whyThis      — why the tutor is talking about THIS concept: the
//                        decision's own reason, which the engine already
//                        localizes, wrapped in a sentence the learner reads.
//   tutor.fallbackNote — the honest label for a turn the offline tutor wrote
//                        because a model was configured and did not answer.
//                        It exists so `tutor.aiNote` is never shown beside a
//                        reply no model wrote.
//
// Same convention as the other one-shot scripts here: insert each key beside
// its siblings in every dictionary, translations written by hand, anchored on
// an existing key that appears exactly once per language so the script refuses
// to guess which dictionary is which.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"tutor.offlineNote"';

/** Language order as the dictionaries appear in lib/i18n.ts — en, es, fr, pt,
 *  ar, sw, hi, id, fil, de, ja, zh, fa, ur, bn. */
const TEXTS = [
  ["en", "OpenMind put {concept} in front of you because: {reason}", "The AI model did not answer, so OpenMind's own tutor replied."],
  ["es", "OpenMind te puso {concept} delante porque: {reason}", "El modelo de IA no respondió, así que respondió el tutor propio de OpenMind."],
  ["fr", "OpenMind vous a proposé {concept} parce que : {reason}", "Le modèle d'IA n'a pas répondu ; c'est le tuteur intégré d'OpenMind qui a répondu."],
  ["pt", "A OpenMind colocou {concept} à sua frente porque: {reason}", "O modelo de IA não respondeu, por isso respondeu o tutor da própria OpenMind."],
  ["ar", "وضع أوبن مايند {concept} أمامك لأن: {reason}", "لم يجب نموذج الذكاء الاصطناعي، فأجاب مدرّس أوبن مايند الخاص."],
  ["sw", "OpenMind iliweka {concept} mbele yako kwa sababu: {reason}", "Modeli ya AI haikujibu, kwa hivyo mwalimu wa OpenMind mwenyewe alijibu."],
  ["hi", "OpenMind ने {concept} आपके सामने रखा क्योंकि: {reason}", "AI मॉडल ने उत्तर नहीं दिया, इसलिए OpenMind के अपने ट्यूटर ने उत्तर दिया।"],
  ["id", "OpenMind menampilkan {concept} karena: {reason}", "Model AI tidak menjawab, jadi tutor milik OpenMind sendiri yang menjawab."],
  ["fil", "Inilagay ng OpenMind ang {concept} sa harap mo dahil: {reason}", "Hindi sumagot ang AI model, kaya ang sariling tutor ng OpenMind ang sumagot."],
  ["de", "OpenMind hat dir {concept} vorgelegt, weil: {reason}", "Das KI-Modell hat nicht geantwortet, deshalb hat OpenMinds eigener Tutor geantwortet."],
  ["ja", "OpenMind が {concept} を出した理由: {reason}", "AI モデルが応答しなかったため、OpenMind 自身のチューターが回答しました。"],
  ["zh", "OpenMind 安排 {concept} 给你，因为：{reason}", "AI 模型没有回应，因此由 OpenMind 自带的辅导老师回答。"],
  ["fa", "اوپن‌مایند {concept} را پیش روی شما گذاشت زیرا: {reason}", "مدل هوش مصنوعی پاسخ نداد، بنابراین آموزگار خودِ اوپن‌مایند پاسخ داد."],
  ["ur", "OpenMind نے {concept} آپ کے سامنے رکھا کیونکہ: {reason}", "AI ماڈل نے جواب نہیں دیا، اس لیے OpenMind کے اپنے ٹیوٹر نے جواب دیا۔"],
  ["bn", "OpenMind আপনার সামনে {concept} রেখেছে কারণ: {reason}", "AI মডেল উত্তর দেয়নি, তাই OpenMind-এর নিজস্ব শিক্ষক উত্তর দিয়েছে।"],
];

const KEYS = ["tutor.whyThis", "tutor.fallbackNote"];

const src = fs.readFileSync(FILE, "utf8");
if (KEYS.every((k) => src.includes(`"${k}"`))) {
  console.log("tutor.whyThis / tutor.fallbackNote already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const anchors = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(ANCHOR)) anchors.push(i);
if (anchors.length !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ANCHOR} anchors, found ${anchors.length} — refusing to guess which dictionary is which`);
}

// Insert from the BOTTOM so earlier indices stay valid.
for (let i = anchors.length - 1; i >= 0; i--) {
  const [lang, whyThis, fallbackNote] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const row = (key, text) =>
    `${indent}"${key}": "${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",`;
  lines.splice(anchors[i] + 1, 0, row("tutor.whyThis", whyThis), row("tutor.fallbackNote", fallbackNote));
  console.log(`${lang}: added both keys`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
