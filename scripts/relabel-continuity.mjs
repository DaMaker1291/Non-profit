// One-shot relabel (§plain-language): the ♿ panel's toggle for the
// struggling-learner mode still said "Continuity mode" — developer jargon a
// learner cannot act on. Same key, plain values, all 15 dictionaries.
import fs from "node:fs";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const V = [
  "🆘 Easier questions when it's hard",
  "🆘 Preguntas más fáciles cuando cuesta",
  "🆘 Questions plus faciles quand c'est difficile",
  "🆘 Perguntas mais fáceis quando estiver difícil",
  "🆘 أسئلة أسهل عندما تكون صعبة",
  "🆘 Maswali rahisi zaidi yanapokuwa magumu",
  "🆘 आसान सवाल जब मुश्किल हो",
  "🆘 Pertanyaan lebih mudah saat sulit",
  "🆘 Mas madaling tanong kapag mahirap",
  "🆘 Leichtere Fragen, wenn es schwer ist",
  "🆘 つらいときはやさしい問題",
  "🆘 吃力时用更简单的题",
  "🆘 وقتی سخت است، سؤال آسان‌تر",
  "🆘 مشکل لگے تو آسان سوال",
  "🆘 কঠিন হলে সহজ প্রশ্ন",
];

let out = fs.readFileSync("lib/i18n.ts", "utf8");
const re = /("acc\.continuity":\s*")((?:[^"\\]|\\.)*)(")/g;
let i = 0;
out = out.replace(re, (_m, pre, _v, post) => {
  const v = V[i];
  i += 1;
  if (v === undefined) throw new Error("more acc.continuity occurrences than languages");
  return pre + v + post;
});
if (i !== LANGS.length) throw new Error(`expected ${LANGS.length} occurrences, found ${i}`);
fs.writeFileSync("lib/i18n.ts", out);
console.log(`relabeled acc.continuity in ${i} languages`);
