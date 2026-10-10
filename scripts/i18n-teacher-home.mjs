// One-shot i18n: the teacher's opening screen (`teach.today` and its five
// siblings).
//
// WHY THESE STRINGS EXIST. `/teacher` opened on a control panel: create a class,
// join a class, then every class's roster, misconceptions, week, set-work form
// and monitor, one after another. A teacher had to read the whole page to find
// the one thing that needed them. The action centre that now opens the page is a
// LABEL, not a dashboard of invented metrics: every row on it is an
// `AssignmentIntervention` the server derived from a member's own evidence
// ledger, so it needs its own words — and its own words in all fifteen
// dictionaries, because a teacher reading Urdu must not meet an English
// heading.
//
// Following the convention of the other one-shot scripts here: insert beside a
// sibling key (`teach.noAssignments`), authored by hand, one block per
// dictionary, and REFUSE to run if the anchor does not appear exactly fifteen
// times — a silent partial edit across dictionaries is the failure this guard
// exists to prevent.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"teach.noAssignments"';

/** Dictionary order as they appear in lib/i18n.ts, with the six keys. */
const TEXTS = [
  ["en", {
    "teach.today": "Today",
    "teach.needsYou": "Needs your attention",
    "teach.attentionLead": "Raised by students' own recorded work — open a class to read the evidence behind each.",
    "teach.nothingWaiting": "Nothing is waiting on you: every learner with work set is up to date.",
    "teach.startHere": "Start here — create your first class below.",
    "teach.totals": "Learners: {learners} · Recorded answers: {marked} · Work set: {assignments}",
  }],
  ["es", {
    "teach.today": "Hoy",
    "teach.needsYou": "Necesita tu atención",
    "teach.attentionLead": "Proviene del trabajo registrado de los propios estudiantes: abre una clase para ver la evidencia de cada caso.",
    "teach.nothingWaiting": "Nada te está esperando: todos los estudiantes con trabajo asignado están al día.",
    "teach.startHere": "Empieza aquí: crea tu primera clase abajo.",
    "teach.totals": "Estudiantes: {learners} · Respuestas registradas: {marked} · Trabajo asignado: {assignments}",
  }],
  ["fr", {
    "teach.today": "Aujourd'hui",
    "teach.needsYou": "Demande votre attention",
    "teach.attentionLead": "Issu du travail enregistré des élèves eux-mêmes — ouvrez une classe pour voir les preuves de chaque cas.",
    "teach.nothingWaiting": "Rien ne vous attend : tous les élèves ayant du travail assigné sont à jour.",
    "teach.startHere": "Commencez ici — créez votre première classe ci-dessous.",
    "teach.totals": "Élèves : {learners} · Réponses enregistrées : {marked} · Travail assigné : {assignments}",
  }],
  ["pt", {
    "teach.today": "Hoje",
    "teach.needsYou": "Precisa da tua atenção",
    "teach.attentionLead": "Vem do trabalho registado dos próprios alunos — abre uma turma para ver as evidências de cada caso.",
    "teach.nothingWaiting": "Nada está à tua espera: todos os alunos com trabalho atribuído estão em dia.",
    "teach.startHere": "Começa aqui — cria a tua primeira turma em baixo.",
    "teach.totals": "Alunos: {learners} · Respostas registadas: {marked} · Trabalho atribuído: {assignments}",
  }],
  ["ar", {
    "teach.today": "اليوم",
    "teach.needsYou": "يحتاج إلى انتباهك",
    "teach.attentionLead": "مستخلص من عمل الطلاب المسجَّل — افتح الصف لرؤية الدليل وراء كل حالة.",
    "teach.nothingWaiting": "لا شيء ينتظرك: كل طالب لديه عمل مُكلَّف به مُحدَّث.",
    "teach.startHere": "ابدأ من هنا — أنشئ صفك الأول بالأسفل.",
    "teach.totals": "الطلاب: {learners} · الإجابات المسجَّلة: {marked} · الأعمال المُكلَّفة: {assignments}",
  }],
  ["sw", {
    "teach.today": "Leo",
    "teach.needsYou": "Inahitaji uangalifu wako",
    "teach.attentionLead": "Inatokana na kazi iliyorekodiwa ya wanafunzi wenyewe — fungua darasa kuona ushahidi wa kila kesi.",
    "teach.nothingWaiting": "Hakuna kinachokusubiri: kila mwanafunzi aliyepewa kazi amemaliza.",
    "teach.startHere": "Anza hapa — tengeneza darasa lako la kwanza hapa chini.",
    "teach.totals": "Wanafunzi: {learners} · Majibu yaliyorekodiwa: {marked} · Kazi zilizopangwa: {assignments}",
  }],
  ["hi", {
    "teach.today": "आज",
    "teach.needsYou": "आपके ध्यान की ज़रूरत है",
    "teach.attentionLead": "यह छात्रों के अपने दर्ज किए काम से आया है — हर मामले के पीछे का प्रमाण देखने के लिए कक्षा खोलें।",
    "teach.nothingWaiting": "आपका इंतज़ार कुछ नहीं कर रहा: काम दिए गए हर छात्र का काम पूरा है।",
    "teach.startHere": "यहाँ से शुरू करें — नीचे अपनी पहली कक्षा बनाएँ।",
    "teach.totals": "छात्र: {learners} · दर्ज उत्तर: {marked} · दिया गया काम: {assignments}",
  }],
  ["id", {
    "teach.today": "Hari ini",
    "teach.needsYou": "Perlu perhatian Anda",
    "teach.attentionLead": "Berasal dari pekerjaan siswa yang tercatat — buka kelas untuk melihat bukti di baliknya.",
    "teach.nothingWaiting": "Tidak ada yang menunggu Anda: semua siswa dengan tugas sudah tuntas.",
    "teach.startHere": "Mulai di sini — buat kelas pertama Anda di bawah.",
    "teach.totals": "Siswa: {learners} · Jawaban tercatat: {marked} · Tugas diberikan: {assignments}",
  }],
  ["tl", {
    "teach.today": "Ngayon",
    "teach.needsYou": "Kailangan ng iyong pansin",
    "teach.attentionLead": "Galing sa naitalang gawain ng mga mag-aaral — buksan ang klase upang makita ang ebidensiya sa likod ng bawat isa.",
    "teach.nothingWaiting": "Wala kang hinihintay: lahat ng mag-aaral na may takdang gawain ay tapos na.",
    "teach.startHere": "Magsimula rito — gumawa ng iyong unang klase sa ibaba.",
    "teach.totals": "Mga mag-aaral: {learners} · Naitalang sagot: {marked} · Takdang gawain: {assignments}",
  }],
  ["de", {
    "teach.today": "Heute",
    "teach.needsYou": "Braucht Ihre Aufmerksamkeit",
    "teach.attentionLead": "Stammt aus der aufgezeichneten Arbeit der Lernenden — öffnen Sie eine Klasse, um die Belege zu sehen.",
    "teach.nothingWaiting": "Nichts wartet auf Sie: Alle Lernenden mit Aufgaben sind auf dem aktuellen Stand.",
    "teach.startHere": "Hier beginnen — legen Sie unten Ihre erste Klasse an.",
    "teach.totals": "Lernende: {learners} · Erfasste Antworten: {marked} · Aufgaben: {assignments}",
  }],
  ["ja", {
    "teach.today": "今日",
    "teach.needsYou": "対応が必要です",
    "teach.attentionLead": "学習者自身の記録から検出されました — 各項目の根拠を見るにはクラスを開いてください。",
    "teach.nothingWaiting": "対応待ちはありません。課題のある学習者は全員完了しています。",
    "teach.startHere": "ここから始めましょう — 下で最初のクラスを作成します。",
    "teach.totals": "学習者: {learners} · 記録された解答: {marked} · 課題: {assignments}",
  }],
  ["zh", {
    "teach.today": "今天",
    "teach.needsYou": "需要你关注",
    "teach.attentionLead": "来自学生自己的记录 — 打开班级查看每一条背后的证据。",
    "teach.nothingWaiting": "没有需要你处理的事项：已布置任务的学生都已完成。",
    "teach.startHere": "从这里开始 — 在下方创建你的第一个班级。",
    "teach.totals": "学生：{learners} · 已记录答题：{marked} · 已布置任务：{assignments}",
  }],
  ["fa", {
    "teach.today": "امروز",
    "teach.needsYou": "نیاز به توجه شما دارد",
    "teach.attentionLead": "از کار ثبت‌شدهٔ خود دانش‌آموزان به دست آمده — برای دیدن شواهد هر مورد یک کلاس را باز کنید.",
    "teach.nothingWaiting": "چیزی در انتظار شما نیست: هر دانش‌آموزی که کار گرفته، به‌روز است.",
    "teach.startHere": "از اینجا شروع کنید — نخستین کلاس خود را در پایین بسازید.",
    "teach.totals": "دانش‌آموزان: {learners} · پاسخ‌های ثبت‌شده: {marked} · کارهای تعیین‌شده: {assignments}",
  }],
  ["ur", {
    "teach.today": "آج",
    "teach.needsYou": "آپ کی توجہ درکار ہے",
    "teach.attentionLead": "یہ طلبہ کے اپنے ریکارڈ شدہ کام سے ہے — ہر کیس کے پیچھے ثبوت دیکھنے کے لیے کلاس کھولیں۔",
    "teach.nothingWaiting": "کوئی چیز آپ کا انتظار نہیں کر رہی: کام دیے گئے ہر طالبِ علم کا کام مکمل ہے۔",
    "teach.startHere": "یہاں سے شروع کریں — نیچے اپنی پہلی کلاس بنائیں۔",
    "teach.totals": "طلبہ: {learners} · ریکارڈ شدہ جوابات: {marked} · دیا گیا کام: {assignments}",
  }],
  ["bn", {
    "teach.today": "আজ",
    "teach.needsYou": "আপনার মনোযোগ দরকার",
    "teach.attentionLead": "শিক্ষার্থীদের নিজেদের রেকর্ড করা কাজ থেকে এসেছে — প্রতিটির পেছনের প্রমাণ দেখতে একটি ক্লাস খুলুন।",
    "teach.nothingWaiting": "কিছুই আপনার অপেক্ষায় নেই: কাজ দেওয়া প্রতিটি শিক্ষার্থী হালনাগাদ আছে।",
    "teach.startHere": "এখান থেকে শুরু করুন — নিচে আপনার প্রথম ক্লাস তৈরি করুন।",
    "teach.totals": "শিক্ষার্থী: {learners} · রেকর্ড করা উত্তর: {marked} · দেওয়া কাজ: {assignments}",
  }],
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"teach.today"')) {
  console.log("teach.today already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const anchors = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(ANCHOR)) anchors.push(i);
if (anchors.length !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ANCHOR} anchors, found ${anchors.length} — refusing to guess which dictionary is which`);
}

// Insert from the bottom so earlier indices stay valid.
for (let i = anchors.length - 1; i >= 0; i--) {
  const [lang, block] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const entries = Object.entries(block)
    .map(([k, v]) => `${indent}"${k}": "${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",`)
    .join("\n");
  lines.splice(anchors[i] + 1, 0, entries);
  console.log(`${lang}: +${Object.keys(block).length} keys`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
