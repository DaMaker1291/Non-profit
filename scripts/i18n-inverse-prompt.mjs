// One-shot i18n: the inverse prompt says what it is asking, and the sheet says
// what it really is.
//
// Two learner-facing sentences were reported as unclear, and both are
// SENTENCES rather than labels — a fragment cannot be fixed by a CSS change:
//
//   1. `tr.whichAnswer` was authored as a lowercase fragment ("which of these
//      questions gives this answer") and composed as `${value} — ${lead}?`, so
//      the question a learner read was "3 — which of these questions gives this
//      answer?". It is now a complete sentence carrying the value as `{v}`.
//      A second key, `tr.whichSolution`, is the same question when the four
//      options are equations: "Which equation has {var} = {v} as its solution?"
//      `lib/transfer.ts#inverseFromDraws` chooses between them from what is
//      actually on screen (see `equationFrame`), so both must exist everywhere.
//
//   2. `work.note` said "Stays on this page — we never read it." The field is
//      React state: it never leaves the tab, is never persisted and is never
//      marked. "We never read it" is true but reads as a defensive promise,
//      while the thing a learner needs is what the paper IS. Rewritten to say
//      exactly where it lives and what is not done with it.
//
// Plus the tutor panel's new starter chip (`ask.hint`) and its clearer sibling
// (`ask.explainQ`). Both are requests the offline tutor already knows how to
// answer — see lib/socratic.ts#isHint / #isExplain, whose keyword lists were
// extended for these phrasings in the same change.
//
// BY NAME, per dictionary, like scripts/i18n-transfer.mjs: the dictionaries are
// 15 parallel objects in one file, so a positional edit would write one
// language's text into another's slot. Each row is looked up inside its own
// dictionary's line range, and the script asserts afterwards that no dictionary
// received another's text.
//
// Run: node scripts/i18n-inverse-prompt.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";

const REWRITE = {
  "tr.whichAnswer": {
    en: "Which of these questions has {v} as its answer?",
    es: "¿Cuál de estas preguntas tiene {v} como resultado?",
    fr: "Laquelle de ces questions a {v} pour résultat ?",
    pt: "Qual destas perguntas tem {v} como resultado?",
    ar: "أي من هذه الأسئلة ناتجه {v}؟",
    sw: "Ni swali lipi kati ya haya lenye jibu {v}?",
    hi: "इनमें से किस प्रश्न का उत्तर {v} है?",
    id: "Soal mana di antara ini yang jawabannya {v}?",
    tl: "Aling tanong sa mga ito ang may sagot na {v}?",
    ur: "ان میں سے کس سوال کا جواب {v} ہے؟",
    fa: "کدام‌یک از این پرسش‌ها پاسخش {v} است؟",
    de: "Welche dieser Aufgaben hat {v} als Ergebnis?",
    ja: "この答え（{v}）になるのはどの問題？",
    zh: "哪一道题的答案是 {v}？",
    bn: "এর মধ্যে কোন প্রশ্নটির উত্তর {v}?",
  },
  "work.note": {
    en: "Private scratch paper — kept in this tab, never sent, saved or marked.",
    es: "Papel de borrador privado: solo en esta pestaña, nunca se envía, se guarda ni se corrige.",
    fr: "Brouillon privé — uniquement dans cet onglet, jamais envoyé, enregistré ni corrigé.",
    pt: "Rascunho privado — só nesta aba, nunca é enviado, guardado nem corrigido.",
    ar: "ورقة مسودة خاصة — في هذه النافذة فقط، لا تُرسَل ولا تُحفظ ولا تُصحَّح.",
    sw: "Karatasi ya kazi ya faragha — kwenye kichupo hiki tu, haitumwi, haihifadhiwi wala haihutubiwi.",
    hi: "निजी रफ़ काग़ज़ — केवल इस टैब में, कभी भेजा, सहेजा या जाँचा नहीं जाता।",
    id: "Kertas coretan pribadi — hanya di tab ini, tidak pernah dikirim, disimpan, atau dinilai.",
    tl: "Pribadong scratch paper — sa tab na ito lang, hindi ipinapadala, iniimbak, o minamarkahan.",
    ur: "نجی مسودہ — صرف اسی ٹیب میں، کبھی بھیجا، محفوظ یا جانچا نہیں جاتا۔",
    fa: "کاغذ چرک‌نویس خصوصی — فقط در همین زبانه؛ نه ارسال می‌شود، نه ذخیره، نه تصحیح.",
    de: "Privates Schmierpapier — nur in diesem Tab, wird nie gesendet, gespeichert oder bewertet.",
    ja: "自分用の下書き用紙 — このタブ内だけ。送信・保存・採点はされません。",
    zh: "私人草稿纸 — 只在这个标签页里，不会发送、保存或批改。",
    bn: "ব্যক্তিগত খসড়া কাগজ — শুধু এই ট্যাবে, কখনও পাঠানো, সংরক্ষণ বা মূল্যায়ন করা হয় না।",
  },
};

/** New keys, inserted directly AFTER the named anchor in each dictionary. */
const INSERT = [
  {
    key: "tr.whichSolution",
    after: '"tr.whichAnswer"',
    text: {
      en: "Which equation has {var} = {v} as its solution?",
      es: "¿Qué ecuación tiene {var} = {v} como solución?",
      fr: "Quelle équation a pour solution {var} = {v} ?",
      pt: "Qual equação tem {var} = {v} como solução?",
      ar: "أي معادلة حلُّها {var} = {v}؟",
      sw: "Ni mlinganyo upi wenye suluhisho {var} = {v}?",
      hi: "किस समीकरण का हल {var} = {v} है?",
      id: "Persamaan mana yang penyelesaiannya {var} = {v}?",
      tl: "Aling equation ang may solusyong {var} = {v}?",
      ur: "کس مساوات کا حل {var} = {v} ہے؟",
      fa: "کدام معادله جوابش {var} = {v} است؟",
      de: "Welche Gleichung hat die Lösung {var} = {v}?",
      ja: "{var} = {v} が解になる方程式はどれ？",
      zh: "哪个方程的解是 {var} = {v}？",
      bn: "কোন সমীকরণের সমাধান {var} = {v}?",
    },
  },
  {
    key: "ask.hint",
    after: '"ask.whatTesting"',
    text: {
      en: "Give me a hint",
      es: "Dame una pista",
      fr: "Donne-moi un indice",
      pt: "Dá-me uma pista",
      ar: "أعطني تلميحًا",
      sw: "Nipe kidokezo",
      hi: "मुझे संकेत दो",
      id: "Beri aku petunjuk",
      tl: "Bigyan mo ako ng hint",
      ur: "مجھے اشارہ دو",
      fa: "یک راهنما بده",
      de: "Gib mir einen Hinweis",
      ja: "ヒントをください",
      zh: "给我一个提示",
      bn: "আমাকে একটি ইঙ্গিত দাও",
    },
  },
  {
    key: "ask.explainQ",
    after: '"ask.hint"',
    text: {
      en: "Explain what this question is asking",
      es: "Explícame qué pide esta pregunta",
      fr: "Explique ce que cette question demande",
      pt: "Explica o que esta pergunta pede",
      ar: "اشرح لي ما الذي يطلبه هذا السؤال",
      sw: "Eleza swali hili linauliza nini",
      hi: "समझाओ यह प्रश्न क्या पूछ रहा है",
      id: "Jelaskan apa yang diminta soal ini",
      tl: "Ipaliwanag ang hinihingi ng tanong na ito",
      ur: "سمجھاؤ یہ سوال کیا پوچھ رہا ہے",
      fa: "توضیح بده این پرسش چه می‌خواهد",
      de: "Erkläre, was diese Aufgabe verlangt",
      ja: "この問題が何を聞いているか説明して",
      zh: "解释一下这道题在问什么",
      bn: "বুঝিয়ে দাও এই প্রশ্নটি কী চাইছে",
    },
  },
];

const CODES = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "ur", "fa", "de", "ja", "zh", "bn"];
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const code of CODES) {
  for (const [key, texts] of Object.entries(REWRITE)) {
    if (!texts[code]) throw new Error(`${key}: no text for ${code}`);
  }
  for (const ins of INSERT) {
    if (!ins.text[code]) throw new Error(`${ins.key}: no text for ${code}`);
  }
}

const src = fs.readFileSync(FILE, "utf8");

// ── THE THIRD CHIP'S CAPITAL, which is a presentational fix with a data cause.
// `ask.workThrough` was authored lowercase because it used to be the SECOND of
// two chips, where a lowercase fragment under a heading read as a note. The panel
// now offers three actions as peer sentences ("Give me a hint" / "Explain what
// this question is asking" / …), and the third one read as an unfinished thought
// beside them. Only the first character changes, and only in the languages whose
// script has case at all — Arabic, Hindi, Urdu, Persian, Japanese, Chinese and
// Bengali are left untouched because capitalising them is not a thing.
const CASED = new Set(["en", "es", "fr", "pt", "sw", "id", "tl", "de"]);

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. */
function dictRange(code) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  return [start, next < 0 ? lines.length : next];
}

const quote = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// The two content phases are guarded by their own marker so this script can be
// re-run after a later phase was added (which is how the chip's capital arrived
// after the sentences did); the capital phase is idempotent on its own.
const done = src.includes('"tr.whichSolution"');

for (const code of CODES) {
  const [start, end] = dictRange(code);
  // REWRITES: locate the key inside ITS OWN dictionary and replace the line.
  for (const [key, texts] of done ? [] : Object.entries(REWRITE)) {
    const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(`"${key}":`));
    if (idx < 0) throw new Error(`${code}: no "${key}" inside its own dictionary`);
    const indent = lines[idx].match(/^\s*/)[0];
    lines[idx] = `${indent}"${key}": "${quote(texts[code])}",`;
  }
  // THE CHIP'S CAPITAL
  if (CASED.has(code)) {
    const [s1, e1] = dictRange(code);
    const idx = lines.findIndex((l, i) => i > s1 && i < e1 && l.includes('"ask.workThrough":'));
    if (idx < 0) throw new Error(`${code}: no "ask.workThrough" inside its own dictionary`);
    lines[idx] = lines[idx].replace(/("ask\.workThrough":\s*")([a-zà-ÿ])/, (_m, head, ch) => head + ch.toUpperCase());
  }
  // INSERTS: bottom-up is unnecessary here because each anchor is re-found on
  // the CURRENT array, so an already-inserted line simply moves later entries.
  for (const ins of done ? [] : INSERT) {
    const [s2, e2] = dictRange(code);
    const idx = lines.findIndex((l, i) => i > s2 && i < e2 && l.includes(ins.after));
    if (idx < 0) throw new Error(`${code}: no ${ins.after} to insert ${ins.key} after`);
    const indent = lines[idx].match(/^\s*/)[0];
    lines.splice(idx + 1, 0, `${indent}"${ins.key}": "${quote(ins.text[code])}",`);
  }
}

fs.writeFileSync(FILE, lines.join("\n"));

// ── THE POST-CONDITION, which is the whole point of doing this by script ──
// Every dictionary must now carry every key, and each must carry its OWN text:
// a row that equals English where the language is written in another script is
// the smell of a mis-slot. Two languages legitimately loan a word (Indonesian
// and Filipino "hint"), and those are listed rather than allowed silently.
const after = fs.readFileSync(FILE, "utf8").split("\n");
const SHARED_OK = new Set(["ask.hint|id", "ask.hint|tl"]);
const keys = [...Object.keys(REWRITE), ...INSERT.map((i) => i.key)];
const valueOf = (line) => line.replace(/^[^"]*"[^"]+":\s*/, "").replace(/,\s*$/, "");
for (const code of done ? [] : CODES) {
  const [s2, e2] = dictRange(code);
  for (const key of keys) {
    const line = after.slice(s2, e2).find((l) => l.includes(`"${key}":`));
    if (!line) throw new Error(`${code}: "${key}" missing after the edit`);
    if (code === "en" || SHARED_OK.has(`${key}|${code}`)) continue;
    // The English sentence this row replaced, compared on its own — a row that
    // still matches it is a mis-slot rather than a translation.
    const english = REWRITE[key]?.en ?? INSERT.find((i) => i.key === key)?.text.en;
    if (valueOf(line) === `"${quote(english)}"`) {
      throw new Error(`${code}: "${key}" still carries the English sentence`);
    }
  }
}

console.log(
  done
    ? `sentences already present — capitalised the third starter chip in ${CASED.size} dictionaries (${FILE})`
    : `rewrote ${Object.keys(REWRITE).length} keys, added ${INSERT.length} keys and capitalised the third chip in all ${CODES.length} dictionaries (${FILE})`,
);
