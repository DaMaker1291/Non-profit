// One-shot: the six "why now" sentences.
//
// These lived only in the next-engine's EN_NEXT fallback table, which is used
// when NO translator is passed. Every page passes one, so the card rendered the
// raw key `next.why.examNow` in English — a leak no key-parity audit catches,
// because the key existed (in the fallback table, not the dictionary).
//
// Anchored after each `next.whyNow` line; aborts unless 15/15. `{n}` and `{exam}`
// are filled with fill(); word order is the translator's business.
import fs from "node:fs";

const T = {
  en: {
    examNow: "Your {exam} paper is in {n} days — this is the highest-value work today.",
    examSoon: "{n} days to {exam} — enough time to close this properly.",
    dueToday: "Retrieval for this is due today.",
    noExam: "No exam date set — the order follows your evidence.",
    evidence: "This is the weakest evidence in the model right now.",
    rest: "Nothing is pressing: nothing is due and nothing is weak.",
  },
  es: {
    examNow: "Tu examen de {exam} es en {n} días: este es el trabajo más valioso hoy.",
    examSoon: "{n} días para {exam}: hay tiempo para cerrar esto bien.",
    dueToday: "El repaso de esto toca hoy.",
    noExam: "Sin fecha de examen: el orden lo marca tu evidencia.",
    evidence: "Ahora mismo esta es la evidencia más débil del modelo.",
    rest: "Nada aprieta: nada toca repasar y nada está débil.",
  },
  fr: {
    examNow: "Ton épreuve de {exam} est dans {n} jours — c'est le travail le plus utile aujourd'hui.",
    examSoon: "{n} jours avant {exam} — le temps de consolider proprement.",
    dueToday: "La révision de ce point est due aujourd'hui.",
    noExam: "Pas de date d'examen : ton dossier décide de l'ordre.",
    evidence: "C'est la preuve la plus faible du modèle en ce moment.",
    rest: "Rien ne presse : rien à réviser, rien de fragile.",
  },
  pt: {
    examNow: "A tua prova de {exam} é em {n} dias — este é o trabalho mais valioso hoje.",
    examSoon: "{n} dias para {exam} — tempo para consolidar isto bem.",
    dueToday: "A revisão disto está marcada para hoje.",
    noExam: "Sem data de exame: a ordem segue as tuas evidências.",
    evidence: "Neste momento é a evidência mais fraca do modelo.",
    rest: "Nada urge: nada a revisar e nada frágil.",
  },
  ar: {
    examNow: "ورقتك في {exam} بعد {n} يومًا — هذا أنفع عمل اليوم.",
    examSoon: "{n} يومًا حتى {exam} — وقت كافٍ لإتقانه.",
    dueToday: "موعد استرجاع هذا اليوم.",
    noExam: "لا تاريخ امتحان — الترتيب يتبع أدلتك.",
    evidence: "هذا أضعف دليل في النموذج الآن.",
    rest: "لا شيء ملحّ: لا مراجعة مستحقة ولا نقطة ضعيفة.",
  },
  sw: {
    examNow: "Mtihani wa {exam} umebaki siku {n} — hii ndiyo kazi yenye thamani zaidi leo.",
    examSoon: "Siku {n} hadi {exam} — muda wa kukamilisha hili vizuri.",
    dueToday: "Marudio ya hili yanatakiwa leo.",
    noExam: "Hakuna tarehe ya mtihani — mpangilio unafuata ushahidi wako.",
    evidence: "Huu ni ushahidi hafifu zaidi katika modeli sasa.",
    rest: "Hakuna kinachobana: hakuna cha kurudia na hakuna kilicho hafifu.",
  },
  hi: {
    examNow: "आपका {exam} पेपर {n} दिन में है — आज यही सबसे उपयोगी काम है।",
    examSoon: "{exam} तक {n} दिन — इसे ठीक से पूरा करने का समय है।",
    dueToday: "इसका पुनःस्मरण आज देय है।",
    noExam: "परीक्षा तिथि नहीं — क्रम आपके प्रमाण तय करते हैं।",
    evidence: "अभी मॉडल में यह सबसे कमज़ोर प्रमाण है।",
    rest: "कुछ ज़रूरी नहीं: न दोहराना बाकी, न कोई कमज़ोरी।",
  },
  id: {
    examNow: "Ujian {exam} tinggal {n} hari — ini pekerjaan paling berharga hari ini.",
    examSoon: "{n} hari lagi ke {exam} — cukup waktu untuk menuntaskannya.",
    dueToday: "Pengulangan ini jatuh tempo hari ini.",
    noExam: "Belum ada tanggal ujian — urutannya mengikuti buktimu.",
    evidence: "Ini bukti terlemah dalam model saat ini.",
    rest: "Tidak ada yang mendesak: tidak ada yang jatuh tempo dan tidak ada yang lemah.",
  },
  tl: {
    examNow: "{n} araw na lang bago ang {exam} — ito ang pinakamahalagang gawain ngayon.",
    examSoon: "{n} araw pa bago ang {exam} — sapat na panahon para tapusin ito nang maayos.",
    dueToday: "Due ngayon ang pagbabalik-tanaw dito.",
    noExam: "Walang petsa ng pagsusulit — ang ebidensiya mo ang nagtatakda ng ayos.",
    evidence: "Ito ang pinakamahinang ebidensiya sa modelo ngayon.",
    rest: "Walang nagmamadali: walang due at walang mahina.",
  },
  de: {
    examNow: "Deine {exam}-Klausur ist in {n} Tagen — heute ist das die wertvollste Arbeit.",
    examSoon: "{n} Tage bis {exam} — genug Zeit, das sauber abzuschließen.",
    dueToday: "Die Wiederholung dazu ist heute fällig.",
    noExam: "Kein Prüfungstermin — die Reihenfolge folgt deinen Belegen.",
    evidence: "Das ist derzeit der schwächste Beleg im Modell.",
    rest: "Nichts drängt: nichts fällig und nichts wackelig.",
  },
  ja: {
    examNow: "{exam}まであと{n}日 — 今日いちばん価値のある学習です。",
    examSoon: "{exam}まで{n}日 — きちんと仕上げる時間はあります。",
    dueToday: "この復習は今日が期限です。",
    noExam: "試験日が未設定 — 順番はあなたの証拠に従います。",
    evidence: "いまモデルの中で最も弱い証拠です。",
    rest: "急ぎはありません。復習も弱点もありません。",
  },
  zh: {
    examNow: "距离{exam}还有{n}天 — 这是今天最有价值的学习。",
    examSoon: "距离{exam}还有{n}天 — 有时间踏实地补完。",
    dueToday: "这一项的复习今天到期。",
    noExam: "未设置考试日期 — 顺序由你的证据决定。",
    evidence: "这是目前模型中最弱的证据。",
    rest: "没有紧迫事项：没有到期复习，也没有薄弱环节。",
  },
  fa: {
    examNow: "{exam} تا {n} روز دیگر است — امروز مهم‌ترین کار همین است.",
    examSoon: "{n} روز تا {exam} — وقت کافی برای جمع‌بندی درست.",
    dueToday: "مرور این مبحث امروز موعد دارد.",
    noExam: "تاریخ امتحان مشخص نیست — ترتیب از شواهد تو پیروی می‌کند.",
    evidence: "این ضعیف‌ترین شاهد مدل در حال حاضر است.",
    rest: "چیزی فوری نیست: نه مروری مانده و نه نقطه‌ضعفی.",
  },
  ur: {
    examNow: "{exam} میں {n} دن باقی ہیں — آج کا سب سے قیمتی کام یہی ہے۔",
    examSoon: "{exam} تک {n} دن — اسے ٹھیک سے مکمل کرنے کا وقت ہے۔",
    dueToday: "اس کی دہرائی آج مقرر ہے۔",
    noExam: "امتحان کی تاریخ نہیں — ترتیب آپ کے شواہد سے طے ہوتی ہے۔",
    evidence: "اس وقت ماڈل میں یہ سب سے کمزور ثبوت ہے۔",
    rest: "کوئی جلد نہیں: نہ دہرائی باقی، نہ کوئی کمزوری۔",
  },
  bn: {
    examNow: "{exam}-এর পরীক্ষা {n} দিন পর — আজকের সবচেয়ে মূল্যবান কাজ এটিই।",
    examSoon: "{exam} পর্যন্ত {n} দিন — ঠিকভাবে শেষ করার সময় আছে।",
    dueToday: "এর পুনরালোচনা আজই নির্ধারিত।",
    noExam: "পরীক্ষার তারিখ নেই — ক্রম আপনার প্রমাণ অনুযায়ী।",
    evidence: "এই মুহূর্তে মডেলে সবচেয়ে দুর্বল প্রমাণ এটি।",
    rest: "কিছু জরুরি নয়: পুনরালোচনা বাকি নেই, দুর্বলতাও নেই।",
  },
};

const KEYS = ["examNow", "examSoon", "dueToday", "noExam", "evidence", "rest"];
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
  if (/^\s*"next\.whyNow":/.test(line)) {
    const code = order[idx];
    const row = T[code];
    if (!row) throw new Error(`no why-now sentences for ${code}`);
    for (const k of KEYS) {
      if (!row[k]) throw new Error(`${code} is missing ${k}`);
      out.push(`  "next.why.${k}": ${JSON.stringify(row[k])},`);
    }
    done++;
  }
}
if (done !== 15) throw new Error(`inserted into ${done}/15 dictionaries`);
fs.writeFileSync("lib/i18n.ts", out.join("\n"));
console.log(`${KEYS.length} sentences × ${done} dictionaries = ${KEYS.length * done} strings`);
