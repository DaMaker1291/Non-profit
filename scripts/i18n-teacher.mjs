// ─────────────────────────────────────────────────────────────────────────────
// One-shot i18n seed: the teacher roster's live-view keys, in all 15 languages.
// Follows the repo convention (scripts/i18n-retention.mjs, i18n-offline.mjs):
// explicit keys per dictionary, no runtime English fallback for learner-visible
// states. Run: node scripts/i18n-teacher.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "fs";

const TRANSLATIONS = {
  "teach.prov": {
    en: "Measured from each student's own recorded work — refreshed as they learn.",
    es: "Medido a partir del trabajo registrado de cada estudiante — se actualiza mientras aprenden.",
    fr: "Mesuré à partir du travail enregistré de chaque élève — actualisé au fil de leur apprentissage.",
    pt: "Medido a partir do trabalho registado de cada aluno — atualizado enquanto aprendem.",
    ar: "مُقاس من العمل المسجّل لكل طالب — يتحدّث كلما تعلّموا.",
    sw: "Imepimwa kutoka kwa kazi iliyorekodiwa ya kila mwanafunzi — huendelea kubadilika wanapojifunza.",
    hi: "हर छात्र के दर्ज किए गए काम से मापा गया — जैसे-जैसे वे सीखते हैं, अपडेट होता है।",
    id: "Diukur dari pekerjaan tercatat setiap siswa — diperbarui saat mereka belajar.",
    tl: "Sinukat mula sa naitalang gawain ng bawat mag-aaral — nag-a-update habang natututo sila.",
    de: "Aus der aufgezeichneten Arbeit jedes Schülers gemessen — aktualisiert sich beim Lernen.",
    ja: "各生徒の記録された学習から測定 — 学習に合わせて更新されます。",
    zh: "根据每位学生已记录的作业测量 — 随学习进展自动更新。",
    bn: "প্রতিটি শিক্ষার্থীর নথিভুক্ত কাজ থেকে পরিমাপ করা — শেখার সাথে সাথে হালনাগাদ হয়।",
    fa: "بر اساس کار ثبت‌شدهٔ هر دانش‌آموز اندازه‌گیری شده — با یادگیری آن‌ها به‌روز می‌شود.",
    ur: "ہر طالب علم کے ریکارڈ شدہ کام سے ناپا گیا — جیسے جیسے وہ سیکھتے ہیں، اپ ڈیٹ ہوتا ہے۔",
  },
  "teach.noEvidence": {
    en: "No measured work yet — the plan below follows the curriculum until your students answer questions.",
    es: "Aún no hay trabajo medido — el plan de abajo sigue el plan de estudios hasta que tus estudiantes respondan preguntas.",
    fr: "Pas encore de travail mesuré — le plan ci-dessous suit le programme jusqu'à ce que vos élèves répondent à des questions.",
    pt: "Ainda não há trabalho medido — o plano abaixo segue o currículo até os seus alunos responderem a perguntas.",
    ar: "لا يوجد عمل مُقاس بعد — تتبع الخطة أدناه المنهج حتى يجيب طلابك على الأسئلة.",
    sw: "Hakuna kazi iliyopimwa bado — mpango hapa chini unafuata mtaala hadi wanafunzi wako wajibu maswali.",
    hi: "अभी कोई मापा गया काम नहीं — जब तक आपके छात्र प्रश्नों के उत्तर नहीं देते, नीचे की योजना पाठ्यक्रम का पालन करती है।",
    id: "Belum ada pekerjaan terukur — rencana di bawah mengikuti kurikulum sampai siswa Anda menjawab soal.",
    tl: "Wala pang nasukat na gawain — sumusunod sa kurikulum ang plano sa ibaba hanggang sumagot ang iyong mga mag-aaral.",
    de: "Noch keine gemessene Arbeit — der Plan unten folgt dem Lehrplan, bis Ihre Schüler Fragen beantworten.",
    ja: "まだ測定された学習はありません — 生徒が問題に答えるまで、以下の計画はカリキュラムに従います。",
    zh: "尚无已测量的学习记录 — 在学生答题之前，以下计划按课程大纲进行。",
    bn: "এখনও কোনো পরিমাপ করা কাজ নেই — আপনার শিক্ষার্থীরা প্রশ্নের উত্তর না দেওয়া পর্যন্ত নিচের পরিকল্পনা পাঠ্যক্রম অনুসরণ করে।",
    fa: "هنوز کار اندازه‌گیری‌شده‌ای وجود ندارد — تا وقتی دانش‌آموزان شما به سؤالات پاسخ ندهند، برنامهٔ زیر برنامهٔ درسی را دنبال می‌کند.",
    ur: "ابھی کوئی ناپا گیا کام نہیں — جب تک آپ کے طلبہ سوالات کے جواب نہیں دیتے، نیچے کا پلان نصاب کی پیروی کرتا ہے۔",
  },
  "teach.unmeasured": {
    en: "Not yet measured",
    es: "Aún sin medir",
    fr: "Pas encore mesuré",
    pt: "Ainda não medido",
    ar: "لم يُقَس بعد",
    sw: "Haijapimwa bado",
    hi: "अभी तक मापा नहीं गया",
    id: "Belum diukur",
    tl: "Hindi pa nasukat",
    de: "Noch nicht gemessen",
    ja: "まだ未測定",
    zh: "尚未测量",
    bn: "এখনও পরিমাপ করা হয়নি",
    fa: "هنوز اندازه‌گیری نشده",
    ur: "ابھی تک نہیں ناپا گیا",
  },
  "teach.measured": {
    en: "with measured work",
    es: "con trabajo medido",
    fr: "avec travail mesuré",
    pt: "com trabalho medido",
    ar: "لديهم عمل مُقاس",
    sw: "wana kazi iliyopimwa",
    hi: "जिनका काम मापा गया",
    id: "dengan pekerjaan terukur",
    tl: "may nasukat na gawain",
    de: "mit gemessener Arbeit",
    ja: "測定済みの学習あり",
    zh: "有已测量的学习记录",
    bn: "পরিমাপ করা কাজ সহ",
    fa: "با کار اندازه‌گیری‌شده",
    ur: "ناپے گئے کام کے ساتھ",
  },
  "teach.evidenceCol": {
    en: "Recorded answers",
    es: "Respuestas registradas",
    fr: "Réponses enregistrées",
    pt: "Respostas registadas",
    ar: "إجابات مسجّلة",
    sw: "Majibu yaliyorekodiwa",
    hi: "दर्ज उत्तर",
    id: "Jawaban tercatat",
    tl: "Naitalang sagot",
    de: "Aufgezeichnete Antworten",
    ja: "記録された回答",
    zh: "已记录的答案",
    bn: "নথিভুক্ত উত্তর",
    fa: "پاسخ‌های ثبت‌شده",
    ur: "ریکارڈ شدہ جوابات",
  },
  "teach.copy": {
    en: "Copy",
    es: "Copiar",
    fr: "Copier",
    pt: "Copiar",
    ar: "نسخ",
    sw: "Nakili",
    hi: "कॉपी",
    id: "Salin",
    tl: "Kopyahin",
    de: "Kopieren",
    ja: "コピー",
    zh: "复制",
    bn: "কপি",
    fa: "کپی",
    ur: "کاپی",
  },
  "teach.copied": {
    en: "Copied ✓",
    es: "Copiado ✓",
    fr: "Copié ✓",
    pt: "Copiado ✓",
    ar: "تم النسخ ✓",
    sw: "Imenakiliwa ✓",
    hi: "कॉपी हो गया ✓",
    id: "Tersalin ✓",
    tl: "Nakopya ✓",
    de: "Kopiert ✓",
    ja: "コピーしました ✓",
    zh: "已复制 ✓",
    bn: "কপি হয়েছে ✓",
    fa: "کپی شد ✓",
    ur: "کاپی ہو گیا ✓",
  },
};

const src = readFileSync("lib/i18n.ts", "utf8");
const lines = src.split("\n");

/** The line index where a dictionary block ends: the first line that closes
 *  the object — '};' or indented '  };' (the bn dictionary closes indented). */
function blockEnd(code) {
  const start = lines.findIndex((l) => l.match(new RegExp(`^(?:export )?const ${code}: Dict = \\{`)));
  if (start === -1) throw new Error(`dict ${code} not found`);
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === "};") return i;
  }
  throw new Error(`dict ${code} has no closing brace`);
}

const insertions = [];
for (const [key, vals] of Object.entries(TRANSLATIONS)) {
  for (const [code, text] of Object.entries(vals)) {
    const end = blockEnd(code);
    insertions.push({ end, line: `  "${key}": ${JSON.stringify(text)},` });
  }
}

// Insert from the bottom up so earlier indices stay valid.
insertions.sort((a, b) => b.end - a.end);
for (const ins of insertions) lines.splice(ins.end, 0, ins.line);

writeFileSync("lib/i18n.ts", lines.join("\n"));
console.log(`inserted ${insertions.length} lines (${Object.keys(TRANSLATIONS).length} keys × 15 dictionaries)`);
