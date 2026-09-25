// One-shot i18n: the OFFLINE SYNC strings.
//
// Answers taken without a connection are held on the device and marked on
// reconnect, and the learner is told three things about that in their own
// language: how many are waiting, that they are being sent, and that one answer
// was saved rather than marked. A learner-visible string that exists in one
// language only would ship half-English in fourteen others, so they are
// authored everywhere at once, following the convention of the other one-shot
// scripts here: insert the keys beside their sibling (`offline.bar`), in each
// dictionary, with the translation written by hand rather than machine-filled.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"offline.bar"';

/** Language order as the dictionaries appear in lib/i18n.ts — en, es, fr, pt,
 *  ar, sw, hi, id, fil, de, ja, zh, fa, ur, bn. */
const TEXTS = [
  ["en", [
    "Offline answers waiting to sync: {n}",
    "Syncing your offline answers ({n})…",
    "{n} offline answers could not be accepted.",
    "Saved on this device. It will be marked when you reconnect.",
  ]],
  ["es", [
    "Respuestas sin conexión esperando para sincronizar: {n}",
    "Sincronizando tus respuestas sin conexión ({n})…",
    "No se pudieron aceptar {n} respuestas sin conexión.",
    "Guardada en este dispositivo. Se corregirá al reconectar.",
  ]],
  ["fr", [
    "Réponses hors ligne en attente de synchronisation : {n}",
    "Synchronisation de vos réponses hors ligne ({n})…",
    "{n} réponses hors ligne n'ont pas pu être acceptées.",
    "Enregistrée sur cet appareil. Elle sera corrigée à la reconnexion.",
  ]],
  ["pt", [
    "Respostas offline aguardando sincronização: {n}",
    "Sincronizando suas respostas offline ({n})…",
    "{n} respostas offline não puderam ser aceitas.",
    "Salva neste dispositivo. Será corrigida quando você reconectar.",
  ]],
  ["ar", [
    "إجابات غير متصلة في انتظار المزامنة: {n}",
    "جارٍ مزامنة إجاباتك غير المتصلة ({n})…",
    "لم يتم قبول {n} إجابات غير متصلة.",
    "حُفظت على هذا الجهاز. ستُصحَّح عند عودة الاتصال.",
  ]],
  ["sw", [
    "Majibu ya nje ya mtandao yanayosubiri kusawazishwa: {n}",
    "Inasawazisha majibu yako ya nje ya mtandao ({n})…",
    "Majibu {n} ya nje ya mtandao hayakukubaliwa.",
    "Yamehifadhiwa kwenye kifaa hiki. Yatahitimu unapounganishwa tena.",
  ]],
  ["hi", [
    "ऑफ़लाइन उत्तर सिंक होने की प्रतीक्षा में: {n}",
    "आपके ऑफ़लाइन उत्तर सिंक हो रहे हैं ({n})…",
    "{n} ऑफ़लाइन उत्तर स्वीकार नहीं किए जा सके।",
    "इस डिवाइस पर सहेजा गया। दोबारा जुड़ने पर जाँचा जाएगा।",
  ]],
  ["id", [
    "Jawaban luring menunggu sinkron: {n}",
    "Menyinkronkan jawaban luringmu ({n})…",
    "{n} jawaban luring tidak dapat diterima.",
    "Tersimpan di perangkat ini. Akan dinilai saat kamu tersambung kembali.",
  ]],
  ["fil", [
    "Mga sagot offline na naghihintay i-sync: {n}",
    "Sini-sync ang iyong mga sagot offline ({n})…",
    "Hindi natanggap ang {n} sagot offline.",
    "Nai-save sa device na ito. Mamasahin ito kapag nakakonekta ka ulit.",
  ]],
  ["de", [
    "Offline-Antworten warten auf Synchronisierung: {n}",
    "Deine Offline-Antworten werden synchronisiert ({n})…",
    "{n} Offline-Antworten konnten nicht angenommen werden.",
    "Auf diesem Gerät gespeichert. Wird bei der nächsten Verbindung korrigiert.",
  ]],
  ["ja", [
    "同期を待っているオフラインの解答: {n}",
    "オフラインの解答を同期しています（{n}）…",
    "{n}件のオフライン解答を受け付けられませんでした。",
    "この端末に保存しました。再接続時に採点します。",
  ]],
  ["zh", [
    "等待同步的离线作答：{n}",
    "正在同步你的离线作答（{n}）…",
    "有 {n} 条离线作答未能被接受。",
    "已保存在此设备上。重新连接后会批改。",
  ]],
  ["fa", [
    "پاسخ‌های آفلاین در انتظار همگام‌سازی: {n}",
    "در حال همگام‌سازی پاسخ‌های آفلاین شما ({n})…",
    "{n} پاسخ آفلاین پذیرفته نشد.",
    "روی این دستگاه ذخیره شد. با وصل شدن دوباره تصحیح می‌شود.",
  ]],
  ["ur", [
    "آف لائن جوابات مطابقت کے منتظر: {n}",
    "آپ کے آف لائن جوابات ہم آہنگ کیے جا رہے ہیں ({n})…",
    "{n} آف لائن جوابات قبول نہیں ہو سکے۔",
    "اس ڈیوائس پر محفوظ ہو گیا۔ دوبارہ جڑنے پر جانچا جائے گا۔",
  ]],
  ["bn", [
    "সিঙ্কের অপেক্ষায় থাকা অফলাইন উত্তর: {n}",
    "আপনার অফলাইন উত্তর সিঙ্ক করা হচ্ছে ({n})…",
    "{n}টি অফলাইন উত্তর গ্রহণ করা যায়নি।",
    "এই ডিভাইসে সংরক্ষিত হয়েছে। আবার যুক্ত হলে মূল্যায়ন করা হবে।",
  ]],
];

const KEYS = ["offline.pending", "offline.syncing", "offline.refused", "offline.answerSaved"];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"offline.answerSaved"')) {
  console.log("offline sync keys already present — nothing to do");
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
  const [lang, texts] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const added = texts.map((text, k) => {
    const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${indent}"${KEYS[k]}": "${escaped}",`;
  });
  lines.splice(anchors[i] + 1, 0, ...added);
  console.log(`${lang}: added ${added.length}`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
