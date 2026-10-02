// One-shot i18n: the two strings a MANUAL-SYNC deployment needs.
//
// WHY THESE STRINGS EXIST AT ALL. `offline.syncing` tells a learner their work
// is being sent. On a site whose deployment profile says `syncFrequency:
// "manual"` (lib/deployment.ts — a metered connection, or a school that chose
// to spend data only when the teacher says so) nothing is being sent, and
// showing "Syncing…" there would be the app claiming to do something it is
// deliberately not doing. These two said instead.
//
// Same convention as the other one-shot scripts (i18n-teach-course.mjs,
// i18n-proof.mjs): insert beside a sibling anchor by hand in each dictionary,
// because the dictionaries are literal TS objects, then assert every language
// is complete and refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"offline.pending"';

const KEYS = {
  "offline.waiting": {
    en: "Waiting to sync: {n}. This site sends when you ask it to.",
    es: "Esperando para sincronizar: {n}. Este sitio envía cuando se lo pides.",
    fr: "En attente de synchronisation : {n}. Ce site envoie quand vous le demandez.",
    pt: "Aguardando sincronização: {n}. Este site envia quando você pede.",
    ar: "في انتظار المزامنة: {n}. هذا الموقع يرسل عندما تطلب ذلك.",
    sw: "Inasubiri kusawazishwa: {n}. Tovuti hii hutuma unapoomba.",
    hi: "सिंक होने की प्रतीक्षा: {n}। यह साइट आपके कहने पर भेजती है।",
    id: "Menunggu sinkronisasi: {n}. Situs ini mengirim saat Anda minta.",
    tl: "Naghihintay i-sync: {n}. Nagpapadala ang site na ito kapag hiniling mo.",
    ur: "مطابقت کا انتظار: {n}۔ یہ سائٹ آپ کے کہنے پر بھیجتی ہے۔",
    fa: "در انتظار همگام‌سازی: {n}. این سایت وقتی شما بخواهید می‌فرستد.",
    de: "Warte auf Synchronisierung: {n}. Diese Seite sendet, wenn du es verlangst.",
    ja: "同期待ち: {n}。このサイトは頼まれたときに送信します。",
    zh: "等待同步：{n}。本站点在你要求时才发送。",
    bn: "সিঙ্কের অপেক্ষায়: {n}। এই সাইট আপনি বললে পাঠায়।",
  },
  "offline.syncNow": {
    en: "Send now",
    es: "Enviar ahora",
    fr: "Envoyer maintenant",
    pt: "Enviar agora",
    ar: "أرسل الآن",
    sw: "Tuma sasa",
    hi: "अभी भेजें",
    id: "Kirim sekarang",
    tl: "Ipadala ngayon",
    ur: "ابھی بھیجیں",
    fa: "اکنون بفرست",
    de: "Jetzt senden",
    ja: "今すぐ送信",
    zh: "立即发送",
    bn: "এখনই পাঠান",
  },
};

const CODES = Object.keys(KEYS["offline.waiting"]);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const key of Object.keys(KEYS)) {
  for (const code of CODES) {
    if (typeof KEYS[key][code] !== "string" || !KEYS[key][code]) throw new Error(`${key}/${code}: missing`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"offline.syncNow"')) {
  console.log("offline sync strings already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. */
function dictRange(code) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  return [start, next < 0 ? lines.length : next];
}

const blocks = [];
for (const code of CODES) {
  const [start, end] = dictRange(code);
  const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  const block = Object.entries(KEYS).map(([key, text]) => {
    const escaped = text[code].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${indent}"${key}": "${escaped}",`;
  });
  blocks.push({ at: idx + 1, lines: block });
}
const seen = new Set();
for (const b of blocks) {
  if (seen.has(b.at)) throw new Error(`two dictionaries insert at line ${b.at} — refusing to write`);
  seen.add(b.at);
}
blocks.sort((a, b) => b.at - a.at);
for (const b of blocks) lines.splice(b.at, 0, ...b.lines);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${Object.keys(KEYS).length} strings × ${CODES.length} languages (${Object.keys(KEYS).join(", ")}) to ${FILE}`);
