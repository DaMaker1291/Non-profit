// One-shot i18n: WHAT THE ANSWER PROVED (§10, §14).
//
// The marked question used to end at "Correct"/"Not yet" plus an explanation.
// The server had always known more than that — it attributes the answer's mode
// (guided / independent / transfer), its hint count and whether it was delayed
// recall — but never said so, so a learner could not see that they had just
// produced independence, transfer or retention evidence. The feedback block now
// adds ONE sentence saying which of those it was.
//
// Four keys, all fifteen dictionaries, authored here rather than left to a
// runtime English fallback: a verdict line rendered in the wrong language is
// the most-read text in the product (§21). Anchored beside the `learn.wrong`
// verdict in each dictionary, which is the sentence it follows on screen.
//
// Run: node scripts/i18n-feedback.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"learn.wrong"';

const KEYS = ["fb.independent", "fb.supported", "fb.transfer", "fb.retained"];

// ONE BLOCK PER LANGUAGE, KEYED BY ITS CODE.
//
// Deliberately NOT a positional list. The dictionaries in lib/i18n.ts are not in
// `LANGS` order — after `tl` the file carries the DRAFT block (de, ja, zh, fa,
// ur) and only then `bn` — so pairing text with dictionary by index silently
// writes Urdu into German and Chinese into Urdu, and nothing crashes: the app
// simply teaches in the wrong language. The block below is therefore resolved by
// LOCATING each `const <code>: Dict = {` and taking the first `learn.wrong`
// after it, and the counts are asserted before anything is written.
const TEXTS = [
  ["en", [
    "Independent — no hints, and you got it right. That is proof.",
    "You got there with support. Try the next one unaided.",
    "Applied in a new context, unaided. That is transfer evidence.",
    "Recalled after a delay, with no hints. That is retention evidence.",
  ]],
  ["es", [
    "Independiente: lo resolviste sin pistas. Eso es prueba.",
    "Llegaste con apoyo. Intenta la siguiente sin ayuda.",
    "Aplicado en un contexto nuevo, sin ayuda. Eso es evidencia de transferencia.",
    "Recordado tras un tiempo, sin pistas. Eso es evidencia de retención.",
  ]],
  ["fr", [
    "En autonomie : tu l'as résolu sans indice. C'est une preuve.",
    "Tu y es arrivé avec de l'aide. Essaie la suivante sans indice.",
    "Appliqué dans un nouveau contexte, sans aide. C'est une preuve de transfert.",
    "Rappelé après un délai, sans indice. C'est une preuve de mémorisation.",
  ]],
  ["pt", [
    "Independente — você resolveu sem dicas. Isso é prova.",
    "Você chegou lá com apoio. Tente a próxima sem ajuda.",
    "Aplicado num contexto novo, sem ajuda. Isso é evidência de transferência.",
    "Lembrado depois de um tempo, sem dicas. Isso é evidência de retenção.",
  ]],
  ["ar", [
    "مستقل — حللتها دون تلميحات. هذا دليل.",
    "وصلت إليها بمساعدة. جرّب التالية دون مساعدة.",
    "طبّقتها في سياق جديد دون مساعدة. هذا دليل على النقل.",
    "تذكّرتها بعد فترة دون تلميحات. هذا دليل على الحفظ.",
  ]],
  ["sw", [
    "Bila msaada — uliisuluhisha bila vidokezo. Hii ni ithibati.",
    "Uliifikia kwa msaada. Jaribu ifuatayo bila msaada.",
    "Uliitumia katika muktadha mpya bila msaada. Hii ni ithibati ya uhamishaji.",
    "Uliikumbuka baada ya muda bila vidokezo. Hii ni ithibati ya kuhifadhi.",
  ]],
  ["hi", [
    "स्वतंत्र — बिना किसी संकेत के हल किया। यह प्रमाण है।",
    "सहायता से पहुँचे। अगली बार बिना मदद आज़माएँ।",
    "नए संदर्भ में बिना मदद लागू किया। यह स्थानांतरण का प्रमाण है।",
    "कुछ समय बाद बिना संकेत याद आया। यह स्मृति का प्रमाण है।",
  ]],
  ["id", [
    "Mandiri — kamu menyelesaikannya tanpa petunjuk. Ini bukti.",
    "Kamu berhasil dengan bantuan. Coba soal berikutnya tanpa bantuan.",
    "Diterapkan pada konteks baru tanpa bantuan. Ini bukti transfer.",
    "Diingat kembali setelah jeda tanpa petunjuk. Ini bukti retensi.",
  ]],
  ["tl", [
    "Mag-isa — nasagot mo nang walang pahiwatig. Ito ay patunay.",
    "Naabot mo ito nang may tulong. Subukan ang susunod nang walang tulong.",
    "Nailapat sa bagong konteksto nang walang tulong. Ito ay patunay ng paglilipat.",
    "Naalala pagkatapos ng pagitan nang walang pahiwatig. Ito ay patunay ng pagpapanatili.",
  ]],
  ["ur", [
    "خودمختار — بغیر اشاروں حل کیا۔ یہ ثبوت ہے۔",
    "مدد سے پہنچے۔ اگلی بار بغیر مدد آزمائیں۔",
    "نئے سیاق میں بغیر مدد لاگو کیا۔ یہ منتقلی کا ثبوت ہے۔",
    "وقفے کے بعد بغیر اشاروں یاد آیا۔ یہ یادداشت کا ثبوت ہے۔",
  ]],
  ["fa", [
    "مستقل — بدون راهنما حلش کردی. این یک سند است.",
    "با کمک به آن رسیدی. بعدی را بدون کمک امتحان کن.",
    "در بافت تازه و بدون کمک به کار بردی. این سند انتقال است.",
    "پس از فاصله و بدون کمک به یاد آوردی. این سند حافظه است.",
  ]],
  ["de", [
    "Selbstständig — ohne Hinweise gelöst. Das ist ein Beleg.",
    "Mit Unterstützung geschafft. Versuch die nächste ohne Hilfe.",
    "In neuem Zusammenhang ohne Hilfe angewendet. Das ist Transfer-Beleg.",
    "Nach einer Pause ohne Hinweise erinnert. Das ist Beleg für Behalten.",
  ]],
  ["ja", [
    "自力で — ヒントなしで解けました。これは証明です。",
    "助けを借りて到達しました。次はヒントなしで試しましょう。",
    "新しい文脈でヒントなしに応用しました。これは転移の証拠です。",
    "間を置いてヒントなしで思い出しました。これは保持の証拠です。",
  ]],
  ["zh", [
    "独立完成 — 没有使用提示。这就是证明。",
    "在帮助下完成了。下一题试试不用提示。",
    "在新情境中独立应用。这就是迁移证据。",
    "隔了一段时间后在没有提示的情况下回忆起来。这就是保持证据。",
  ]],
  ["bn", [
    "স্বাধীন — কোনো ইঙ্গিত ছাড়াই সমাধান করেছ। এটাই প্রমাণ।",
    "সহায়তা নিয়ে পৌঁছেছ। পরেরটি ইঙ্গিত ছাড়াই চেষ্টা করো।",
    "নতুন প্রসঙ্গে ইঙ্গিত ছাড়াই প্রয়োগ করেছ। এটাই স্থানান্তরের প্রমাণ।",
    "বিরতির পরে ইঙ্গিত ছাড়াই মনে পড়েছে। এটাই স্মৃতিধারণের প্রমাণ।",
  ]],
];

for (const [lang, texts] of TEXTS) {
  if (texts.length !== KEYS.length) {
    throw new Error(`${lang}: ${texts.length} texts for ${KEYS.length} keys — refusing to write a half dictionary`);
  }
}
const seenCodes = new Set();
for (const [lang] of TEXTS) {
  if (seenCodes.has(lang)) throw new Error(`${lang}: two blocks for one language`);
  seenCodes.add(lang);
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"fb.independent"')) {
  console.log("feedback keys already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");

// Find each language's dictionary by NAME, then the verdict line inside it.
// Positional pairing is wrong here (see the note on TEXTS), and a wrong pair is
// invisible: it produces valid TypeScript and a translateable-looking app.
function anchorFor(code) {
  // `bn` is the one dictionary the file exports, so the opener is matched with
  // or without its `export `.
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no \`const ${code}: Dict = {\` in ${FILE}`);
  const idx = lines.findIndex((l, i) => i > start && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} after its dictionary opens`);
  // Guard the pairing: the next dictionary must not have started in between, or
  // the anchor found belongs to somebody else.
  const nextStart = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  if (nextStart >= 0 && idx > nextStart) throw new Error(`${code}: ${ANCHOR} found past the end of its dictionary`);
  return idx;
}
const anchors = TEXTS.map(([lang]) => anchorFor(lang));
if (new Set(anchors).size !== anchors.length) {
  throw new Error("two languages resolved to the same anchor — refusing to write");
}

// Bottom-up, so earlier indices stay valid as later lines are inserted.
for (let i = TEXTS.length - 1; i >= 0; i--) {
  const [lang, texts] = TEXTS[i];
  const idx = anchors[i];
  const indent = lines[idx].match(/^\s*/)[0];
  const added = KEYS.map((key, k) => {
    const escaped = texts[k].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${indent}"${key}": "${escaped}",`;
  });
  lines.splice(idx + 1, 0, ...added);
  console.log(`${lang} @ line ${idx + 1}: added ${added.length}`);
}

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`\nwrote ${TEXTS.length * KEYS.length} strings to ${FILE}`);
