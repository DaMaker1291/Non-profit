// One-shot: the offline pack's note was a hardcoded English string in the API
// route — the one artefact a school with no internet actually downloads.
// Anchored after each `off.resumes` line; aborts unless 15/15.
import fs from "node:fs";

const T = {
  en: "Everything OpenMind currently believes you need — works with no internet; grading resumes on reconnect.",
  es: "Todo lo que OpenMind cree que necesitas ahora — funciona sin internet; la corrección se reanuda al reconectar.",
  fr: "Tout ce qu'OpenMind estime nécessaire pour l'instant — fonctionne sans internet ; la correction reprend à la reconnexion.",
  pt: "Tudo o que a OpenMind considera necessário agora — funciona sem internet; a correção retoma ao reconectar.",
  ar: "كل ما يرى OpenMind أنك تحتاجه الآن — يعمل دون إنترنت، ويستأنف التصحيح عند الاتصال.",
  sw: "Kila kitu OpenMind anachokiona unahitaji sasa — hufanya kazi bila intaneti; kusahihisha hurejea unapounganishwa.",
  hi: "OpenMind अभी जो कुछ ज़रूरी समझता है वह सब — बिना इंटरनेट चलता है; जुड़ने पर जाँच फिर शुरू होती है।",
  id: "Semua yang OpenMind anggap kamu butuhkan saat ini — berjalan tanpa internet; penilaian lanjut saat tersambung.",
  tl: "Lahat ng sa tingin ng OpenMind ay kailangan mo ngayon — gumagana nang walang internet; muling magpapatuloy ang pagmamarka kapag nakakonekta.",
  de: "Alles, was OpenMind gerade für nötig hält — funktioniert ohne Internet; die Korrektur läuft beim Verbinden weiter.",
  ja: "OpenMindが今必要と判断したすべて — インターネットなしで動き、接続時に採点が再開します。",
  zh: "OpenMind 目前认为你需要的一切 — 无需网络即可使用；重新联网后继续批改。",
  fa: "هر چیزی که OpenMind اکنون لازم می‌داند — بدون اینترنت کار می‌کند؛ با اتصال، تصحیح ادامه می‌یابد.",
  ur: "وہ سب جو OpenMind ابھی ضروری سمجھتا ہے — انٹرنیٹ کے بغیر چلتا ہے؛ جڑنے پر جانچ دوبارہ شروع ہوتی ہے۔",
  bn: "OpenMind এখন যা প্রয়োজন মনে করছে সবই — ইন্টারনেট ছাড়াই চলে; সংযোগ ফিরলে মূল্যায়ন আবার শুরু হয়।",
};

const src = fs.readFileSync("lib/i18n.ts", "utf8");
const lines = src.split("\n");
const declRe = /^(?:export )?const (\w+): Dict = \{$/;
const out = [];
let idx = -1;
let done = 0;
const order = [];
for (const line of lines) {
  const d = line.match(declRe);
  if (d) { idx++; order.push(d[1]); }
  out.push(line);
  if (idx < 0) continue;
  if (/^\s*"off\.resumes":/.test(line)) {
    const code = order[idx];
    if (!T[code]) throw new Error(`no off.packNote for ${code}`);
    out.push(`  "off.packNote": ${JSON.stringify(T[code])},`);
    done++;
  }
}
if (done !== 15) throw new Error(`inserted into ${done}/15 dictionaries`);
fs.writeFileSync("lib/i18n.ts", out.join("\n"));
console.log(`off.packNote × ${done}`);
