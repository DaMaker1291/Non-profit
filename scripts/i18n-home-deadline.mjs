// One-shot i18n: the HOME DEADLINE strings.
//
// The learner's own exam date was collected at enrolment and shown nowhere. The
// countdown that surfaces it needs three sentences — one for a real countdown,
// one for the last day, and one for a date that has already passed (which is a
// state with a fix, not something to hide). All three are authored in all 15
// dictionaries here, following the convention of the other one-shot scripts
// (i18n-adaptive.mjs, i18n-courses.mjs, i18n-assignments.mjs). A runtime English
// fallback would ship half-English in fourteen languages, which is why there is
// not one.
//
// Run: node scripts/i18n-home-deadline.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"prog.recent"';

/** Language order as the dictionaries appear in lib/i18n.ts — en, es, fr, pt,
 *  ar, sw, hi, id, fil, de, ja, zh, fa, ur, bn. */
const TEXTS = [
  ["en", [
    "{days} days until your exam",
    "Your exam is today or tomorrow",
    "Your exam date has passed — update it in settings",
  ]],
  ["es", [
    "{days} días para tu examen",
    "Tu examen es hoy o mañana",
    "La fecha de tu examen ya pasó — actualízala en los ajustes",
  ]],
  ["fr", [
    "{days} jours avant ton examen",
    "Ton examen est aujourd'hui ou demain",
    "La date de ton examen est passée — mets-la à jour dans les réglages",
  ]],
  ["pt", [
    "{days} dias até ao teu exame",
    "O teu exame é hoje ou amanhã",
    "A data do teu exame já passou — atualiza-a nas definições",
  ]],
  ["ar", [
    "بقي {days} يومًا على اختبارك",
    "اختبارك اليوم أو غدًا",
    "انقضى موعد اختبارك — حدّثه من الإعدادات",
  ]],
  ["sw", [
    "Siku {days} hadi mtihani wako",
    "Mtihani wako ni leo au kesho",
    "Tarehe ya mtihani wako imepita — isahihishe kwenye mipangilio",
  ]],
  ["hi", [
    "तुम्हारी परीक्षा में {days} दिन बाकी",
    "तुम्हारी परीक्षा आज या कल है",
    "तुम्हारी परीक्षा की तारीख निकल गई — इसे सेटिंग्स में बदलो",
  ]],
  ["id", [
    "{days} hari menuju ujianmu",
    "Ujianmu hari ini atau besok",
    "Tanggal ujianmu sudah lewat — perbarui di pengaturan",
  ]],
  ["fil", [
    "{days} araw bago ang pagsusulit mo",
    "Ang pagsusulit mo ay ngayon o bukas",
    "Lumipas na ang petsa ng pagsusulit mo — baguhin ito sa mga setting",
  ]],
  ["de", [
    "{days} Tage bis zu deiner Prüfung",
    "Deine Prüfung ist heute oder morgen",
    "Dein Prüfungstermin ist vorbei — ändere ihn in den Einstellungen",
  ]],
  ["ja", [
    "試験まであと {days} 日",
    "試験は今日か明日です",
    "試験日を過ぎています — 設定で更新してください",
  ]],
  ["zh", [
    "距离考试还有 {days} 天",
    "你的考试在今天或明天",
    "考试日期已过 — 请在设置中更新",
  ]],
  ["fa", [
    "{days} روز تا آزمون تو",
    "آزمون تو امروز یا فردا است",
    "تاریخ آزمون تو گذشته است — آن را در تنظیمات بهروز کن",
  ]],
  ["ur", [
    "آپ کے امتحان میں {days} دن باقی",
    "آپ کا امتحان آج یا کل ہے",
    "آپ کے امتحان کی تاریخ گزر گئی — اسے سیٹنگز میں بدلیں",
  ]],
  ["bn", [
    "পরীক্ষার {days} দিন বাকি",
    "তোমার পরীক্ষা আজ বা কাল",
    "পরীক্ষার তারিখ পেরিয়ে গেছে — সেটিংসে ঠিক করো",
  ]],
];

const KEYS = ["home.examCountdown", "home.examNear", "home.examPast"];

for (const [lang, texts] of TEXTS) {
  if (texts.length !== KEYS.length) {
    throw new Error(`${lang}: ${texts.length} texts for ${KEYS.length} keys — refusing to write a half dictionary`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"home.examCountdown"')) {
  console.log("deadline keys already present — nothing to do");
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
