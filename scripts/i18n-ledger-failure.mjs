// One-shot: the LEDGER-FAILURE strings (§Sprint 2.1).
//
// A ledger fetch has three outcomes, not two: still loading, ready, and FAILED.
// The failure state used to be indistinguishable from "still loading", so a
// dropped connection left a learner looking at a spinner forever — and the page
// that shows evidence said nothing about why it was empty. These two strings are
// what the evidence surfaces (the Mind pages, /progress) say instead.
//
// Authored in all 15 languages here, matching the project's rule that every
// learner-visible state has an explicit translation rather than a runtime
// English fallback. The call sites are switched to t() in the same change.
import fs from "node:fs";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const K = {
  "evv.ledgerFailed": [
    "We couldn't read your learning record just now. Nothing has been lost.",
    "No pudimos leer tu registro de aprendizaje ahora mismo. No se ha perdido nada.",
    "Nous n'avons pas pu lire ton dossier d'apprentissage à l'instant. Rien n'est perdu.",
    "Não conseguimos ler o seu registo de aprendizagem agora. Nada se perdeu.",
    "لم نتمكن من قراءة سجل تعلمك الآن. لم يُفقد شيء.",
    "Hatuwezi kusoma rekodi yako ya kujifunza kwa sasa. Hakuna kilichopotea.",
    "अभी आपका अधिगम रिकॉर्ड पढ़ा नहीं जा सका। कुछ खोया नहीं है।",
    "Kami tidak bisa membaca catatan belajarmu saat ini. Tidak ada yang hilang.",
    "Hindi namin mabasa ang talaan ng iyong pag-aaral ngayon. Wala namang nawala.",
    "Wir konnten deinen Lernverlauf gerade nicht lesen. Nichts ist verloren.",
    "いま学習の記録を読み込めませんでした。失われたものはありません。",
    "刚才无法读取你的学习记录。没有丢失任何内容。",
    "همین حالا نتوانستیم سابقهٔ یادگیری‌ات را بخوانیم. چیزی از دست نرفته است.",
    "ابھی آپ کا سیکھنے کا ریکارڈ پڑھا نہیں جا سکا۔ کچھ ضائع نہیں ہوا۔",
    "এই মুহূর্তে তোমার শেখার রেকর্ড পড়া গেল না। কিছুই হারায়নি।",
  ],
  "evv.ledgerRetry": [
    "Try again",
    "Intentar de nuevo",
    "Réessayer",
    "Tentar de novo",
    "أعد المحاولة",
    "Jaribu tena",
    "फिर कोशिश करें",
    "Coba lagi",
    "Subukan muli",
    "Erneut versuchen",
    "もう一度試す",
    "重试",
    "دوباره تلاش کن",
    "دوبارہ کوشش کریں",
    "আবার চেষ্টা করো",
  ],
};

for (const [k, v] of Object.entries(K)) {
  if (v.length !== LANGS.length) throw new Error(`${k}: ${v.length} values for ${LANGS.length} languages`);
}

const declRe = /^(?:export )?const (\w+): Dict = \{$/gm;
let out = fs.readFileSync("lib/i18n.ts", "utf8");
let added = 0;
for (const lang of LANGS) {
  declRe.lastIndex = 0;
  const decls = []; let d;
  while ((d = declRe.exec(out))) decls.push({ name: d[1], start: d.index });
  const idx = decls.findIndex((x) => x.name === lang);
  if (idx < 0) { console.error(`no dictionary for ${lang}`); process.exit(1); }
  const start = decls[idx].start;
  const rel = out.slice(start).match(/\n[ \t]*\};/);
  if (!rel) { console.error(`${lang}: closing brace not found`); process.exit(1); }
  const end = start + rel.index;
  const have = new Set([...out.slice(start, end).matchAll(/"([a-zA-Z0-9._-]+)":/g)].map((m) => m[1]));
  const col = LANGS.indexOf(lang);
  const lines = Object.entries(K)
    .filter(([k]) => !have.has(k))
    .map(([k, v]) => `  "${k}": ${JSON.stringify(v[col])},`);
  if (lines.length === 0) continue;
  out = out.slice(0, end) + "\n" + lines.join("\n") + out.slice(end);
  added += lines.length;
}
fs.writeFileSync("lib/i18n.ts", out);
console.log(`added ${added} strings (${Object.keys(K).length} keys × ${LANGS.length} languages)`);
