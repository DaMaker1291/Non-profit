// One-shot i18n: the individual learner view on `/teacher` (`tl.*`).
//
// WHY THESE STRINGS EXIST. The teacher's roster row answers "how is this child
// doing?" with one rate. The question a teacher actually acts on — "what can
// this student DEMONSTRATE, and what have we never asked them?" — needs the
// evidence behind the rate, and the words to be honest about it: a suspected
// misconception is a HYPOTHESIS drawn from recorded wrong answers rather than a
// diagnosis, guided practice measures the teaching rather than the learner,
// and a concept nobody has measured is named rather than scored. A teacher
// reading Urdu must not meet those sentences in English, so they are authored
// here in all fifteen dictionaries.
//
// Following the convention of the other one-shot scripts: insert beside a
// sibling key (`teach.noAssignments`), authored by hand, one block per
// dictionary, and REFUSE to run if the anchor does not appear exactly fifteen
// times — a silent partial edit across dictionaries is the failure this guard
// exists to prevent.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"teach.noAssignments"';

/** Dictionary order as they appear in lib/i18n.ts, with the fifteen keys. */
const TEXTS = [
  ["en", {
    "tl.open": "View evidence",
    "tl.close": "Close",
    "tl.profile": "Learning profile",
    "tl.picture": "What this student can demonstrate",
    "tl.independentOnly": "From independent work only — guided practice measures the teaching, not the learner.",
    "tl.hypotheses": "Possible misunderstandings",
    "tl.hypothesisNote": "A hypothesis from recorded wrong answers, not a diagnosis. Check it against the answers below, then decide.",
    "tl.hypothesisSupport": "{n} wrong answer(s) on {concept}",
    "tl.recent": "Recent recorded answers",
    "tl.offlineAnswer": "recorded offline",
    "tl.noWork": "This student has not answered anything yet.",
    "tl.notMeasuredHere": "Not yet measured in this course",
    "tl.nextStep": "Where to start",
    "tl.nextWeakest": "Weakest measured idea — open it to see what this student will be taught.",
    "tl.nextNone": "Nothing measured yet. The first idea from the course is below.",
  }],
  ["es", {
    "tl.open": "Ver evidencia",
    "tl.close": "Cerrar",
    "tl.profile": "Perfil de aprendizaje",
    "tl.picture": "Lo que este estudiante puede demostrar",
    "tl.independentOnly": "Solo del trabajo independiente: la práctica guiada mide la enseñanza, no al estudiante.",
    "tl.hypotheses": "Posibles malentendidos",
    "tl.hypothesisNote": "Una hipótesis a partir de respuestas incorrectas registradas, no un diagnóstico. Compruébala con las respuestas de abajo y luego decide.",
    "tl.hypothesisSupport": "{n} respuestas incorrectas en {concept}",
    "tl.recent": "Respuestas recientes registradas",
    "tl.offlineAnswer": "registrada sin conexión",
    "tl.noWork": "Este estudiante aún no ha respondido nada.",
    "tl.notMeasuredHere": "Aún sin medir en este curso",
    "tl.nextStep": "Por dónde empezar",
    "tl.nextWeakest": "La idea medida más débil: ábrela para ver qué se le enseñará a este estudiante.",
    "tl.nextNone": "Nada medido todavía. La primera idea del curso está abajo.",
  }],
  ["fr", {
    "tl.open": "Voir les preuves",
    "tl.close": "Fermer",
    "tl.profile": "Profil d'apprentissage",
    "tl.picture": "Ce que cet élève peut démontrer",
    "tl.independentOnly": "Uniquement le travail autonome : la pratique guidée mesure l'enseignement, pas l'élève.",
    "tl.hypotheses": "Malentendus possibles",
    "tl.hypothesisNote": "Une hypothèse issue des mauvaises réponses enregistrées, pas un diagnostic. Vérifiez-la avec les réponses ci-dessous, puis décidez.",
    "tl.hypothesisSupport": "{n} mauvaises réponses sur {concept}",
    "tl.recent": "Réponses récentes enregistrées",
    "tl.offlineAnswer": "enregistrée hors ligne",
    "tl.noWork": "Cet élève n'a encore rien répondu.",
    "tl.notMeasuredHere": "Pas encore mesuré dans ce cours",
    "tl.nextStep": "Par où commencer",
    "tl.nextWeakest": "L'idée mesurée la plus faible — ouvrez-la pour voir ce qui sera enseigné à cet élève.",
    "tl.nextNone": "Rien de mesuré pour l'instant. La première idée du cours est ci-dessous.",
  }],
  ["pt", {
    "tl.open": "Ver evidências",
    "tl.close": "Fechar",
    "tl.profile": "Perfil de aprendizagem",
    "tl.picture": "O que este aluno consegue demonstrar",
    "tl.independentOnly": "Apenas do trabalho independente — a prática guiada mede o ensino, não o aluno.",
    "tl.hypotheses": "Possíveis mal-entendidos",
    "tl.hypothesisNote": "Uma hipótese a partir de respostas erradas registadas, não um diagnóstico. Confirma-a com as respostas abaixo e depois decide.",
    "tl.hypothesisSupport": "{n} respostas erradas em {concept}",
    "tl.recent": "Respostas recentes registadas",
    "tl.offlineAnswer": "registada offline",
    "tl.noWork": "Este aluno ainda não respondeu a nada.",
    "tl.notMeasuredHere": "Ainda não medido neste curso",
    "tl.nextStep": "Por onde começar",
    "tl.nextWeakest": "A ideia medida mais fraca — abre-a para ver o que este aluno vai aprender.",
    "tl.nextNone": "Nada medido ainda. A primeira ideia do curso está abaixo.",
  }],
  ["ar", {
    "tl.open": "عرض الأدلة",
    "tl.close": "إغلاق",
    "tl.profile": "ملف التعلّم",
    "tl.picture": "ما يستطيع هذا الطالب إثباته",
    "tl.independentOnly": "من العمل المستقل فقط — التدريب الموجَّه يقيس التعليم لا الطالب.",
    "tl.hypotheses": "احتمالات فهم خاطئ",
    "tl.hypothesisNote": "فرضية مستخلصة من إجابات خاطئة مسجَّلة، وليست تشخيصًا. تحقّق منها مع الإجابات أدناه ثم قرّر.",
    "tl.hypothesisSupport": "{n} إجابات خاطئة في {concept}",
    "tl.recent": "أحدث الإجابات المسجَّلة",
    "tl.offlineAnswer": "سُجِّلت دون اتصال",
    "tl.noWork": "لم يُجب هذا الطالب عن أي سؤال بعد.",
    "tl.notMeasuredHere": "لم يُقَس بعد في هذا المقرر",
    "tl.nextStep": "من أين تبدأ",
    "tl.nextWeakest": "أضعف فكرة مقيسة — افتحها لترى ما سيُدرَّس لهذا الطالب.",
    "tl.nextNone": "لم يُقَس شيء بعد. أول فكرة من المقرر بالأسفل.",
  }],
  ["sw", {
    "tl.open": "Ona ushahidi",
    "tl.close": "Funga",
    "tl.profile": "Wasifu wa kujifunza",
    "tl.picture": "Anachoweza kuthibitisha mwanafunzi huyu",
    "tl.independentOnly": "Kutoka kazi ya kujitegemea pekee — mazoezi yanayoongozwa hupima ufundishaji, si mwanafunzi.",
    "tl.hypotheses": "Uwezekano wa kukosea",
    "tl.hypothesisNote": "Dhana inayotokana na majibu mabaya yaliyorekodiwa, si utambuzi. Ithibitishe kwa majibu yaliyo hapa chini, kisha amua.",
    "tl.hypothesisSupport": "{n} majibu mabaya kwenye {concept}",
    "tl.recent": "Majibu ya hivi karibuni yaliyorekodiwa",
    "tl.offlineAnswer": "yaliyorekodiwa nje ya mtandao",
    "tl.noWork": "Mwanafunzi huyu hajajibu chochote bado.",
    "tl.notMeasuredHere": "Haijapimwa bado katika kozi hii",
    "tl.nextStep": "Wapi pa kuanzia",
    "tl.nextWeakest": "Wazo dhaifu lililopimwa — lifungue kuona atakachofundishwa mwanafunzi huyu.",
    "tl.nextNone": "Hakuna kilichopimwa bado. Wazo la kwanza la kozi liko hapa chini.",
  }],
  ["hi", {
    "tl.open": "प्रमाण देखें",
    "tl.close": "बंद करें",
    "tl.profile": "सीखने की प्रोफ़ाइल",
    "tl.picture": "यह छात्र क्या सिद्ध कर सकता है",
    "tl.independentOnly": "केवल स्वतंत्र काम से — निर्देशित अभ्यास शिक्षण मापता है, छात्र को नहीं।",
    "tl.hypotheses": "संभावित भ्रांतियाँ",
    "tl.hypothesisNote": "दर्ज गलत उत्तरों से बनी परिकल्पना, निदान नहीं। नीचे दिए उत्तरों से इसे जाँचें, फिर निर्णय लें।",
    "tl.hypothesisSupport": "{concept} पर {n} गलत उत्तर",
    "tl.recent": "हाल के दर्ज उत्तर",
    "tl.offlineAnswer": "ऑफ़लाइन दर्ज",
    "tl.noWork": "इस छात्र ने अभी तक कुछ भी उत्तर नहीं दिया है।",
    "tl.notMeasuredHere": "इस पाठ्यक्रम में अभी मापा नहीं गया",
    "tl.nextStep": "कहाँ से शुरू करें",
    "tl.nextWeakest": "सबसे कमज़ोर मापी गई अवधारणा — इसे खोलकर देखें कि इस छात्र को क्या पढ़ाया जाएगा।",
    "tl.nextNone": "अभी कुछ मापा नहीं गया। पाठ्यक्रम की पहली अवधारणा नीचे है।",
  }],
  ["id", {
    "tl.open": "Lihat bukti",
    "tl.close": "Tutup",
    "tl.profile": "Profil belajar",
    "tl.picture": "Yang dapat ditunjukkan siswa ini",
    "tl.independentOnly": "Hanya dari kerja mandiri — latihan terpandu mengukur pengajaran, bukan siswa.",
    "tl.hypotheses": "Kemungkinan salah paham",
    "tl.hypothesisNote": "Hipotesis dari jawaban salah yang tercatat, bukan diagnosis. Periksa dengan jawaban di bawah, lalu putuskan.",
    "tl.hypothesisSupport": "{n} jawaban salah pada {concept}",
    "tl.recent": "Jawaban terbaru yang tercatat",
    "tl.offlineAnswer": "tercatat offline",
    "tl.noWork": "Siswa ini belum menjawab apa pun.",
    "tl.notMeasuredHere": "Belum diukur dalam kursus ini",
    "tl.nextStep": "Mulai dari mana",
    "tl.nextWeakest": "Ide terukur yang paling lemah — buka untuk melihat apa yang akan diajarkan kepada siswa ini.",
    "tl.nextNone": "Belum ada yang diukur. Ide pertama dari kursus ada di bawah.",
  }],
  ["tl", {
    "tl.open": "Tingnan ang ebidensiya",
    "tl.close": "Isara",
    "tl.profile": "Profile ng pag-aaral",
    "tl.picture": "Ang kayang patunayan ng mag-aaral na ito",
    "tl.independentOnly": "Mula sa malayang gawain lamang — ang ginagabayang pagsasanay ay sumusukat sa pagtuturo, hindi sa mag-aaral.",
    "tl.hypotheses": "Mga posibleng maling pagkaunawa",
    "tl.hypothesisNote": "Isang hinuha mula sa naitalang maling sagot, hindi diagnosis. Suriin ito sa mga sagot sa ibaba, saka magpasya.",
    "tl.hypothesisSupport": "{n} maling sagot sa {concept}",
    "tl.recent": "Mga kamakailang naitalang sagot",
    "tl.offlineAnswer": "naitala offline",
    "tl.noWork": "Wala pang sinagot ang mag-aaral na ito.",
    "tl.notMeasuredHere": "Hindi pa nasusukat sa kursong ito",
    "tl.nextStep": "Saan magsisimula",
    "tl.nextWeakest": "Pinakamahinang nasukat na ideya — buksan ito upang makita ang ituturo sa mag-aaral na ito.",
    "tl.nextNone": "Wala pang nasusukat. Nasa ibaba ang unang ideya mula sa kurso.",
  }],
  ["de", {
    "tl.open": "Belege ansehen",
    "tl.close": "Schließen",
    "tl.profile": "Lernprofil",
    "tl.picture": "Was diese Lernende nachweisen kann",
    "tl.independentOnly": "Nur aus selbstständiger Arbeit — geführtes Üben misst den Unterricht, nicht die Lernende.",
    "tl.hypotheses": "Mögliche Missverständnisse",
    "tl.hypothesisNote": "Eine Hypothese aus erfassten falschen Antworten, keine Diagnose. Prüfen Sie sie an den Antworten unten und entscheiden Sie dann.",
    "tl.hypothesisSupport": "{n} falsche Antworten zu {concept}",
    "tl.recent": "Zuletzt erfasste Antworten",
    "tl.offlineAnswer": "offline erfasst",
    "tl.noWork": "Diese Lernende hat noch nichts beantwortet.",
    "tl.notMeasuredHere": "In diesem Kurs noch nicht gemessen",
    "tl.nextStep": "Wo anfangen",
    "tl.nextWeakest": "Schwächste gemessene Idee — öffnen Sie sie, um zu sehen, was dieser Lernende gelehrt wird.",
    "tl.nextNone": "Noch nichts gemessen. Die erste Idee aus dem Kurs steht unten.",
  }],
  ["ja", {
    "tl.open": "根拠を見る",
    "tl.close": "閉じる",
    "tl.profile": "学習プロフィール",
    "tl.picture": "この学習者が示せること",
    "tl.independentOnly": "自立した学習のみ — ガイド付きの練習は指導を測るもので、学習者を測るものではありません。",
    "tl.hypotheses": "考えられる誤解",
    "tl.hypothesisNote": "記録された誤答から導いた仮説であり、診断ではありません。下の解答で確かめてから判断してください。",
    "tl.hypothesisSupport": "{concept} の誤答 {n} 件",
    "tl.recent": "最近の記録された解答",
    "tl.offlineAnswer": "オフラインで記録",
    "tl.noWork": "この学習者はまだ何も解答していません。",
    "tl.notMeasuredHere": "このコースでは未測定",
    "tl.nextStep": "どこから始めるか",
    "tl.nextWeakest": "最も弱い測定済みの概念 — 開くとこの学習者に何を教えるかが分かります。",
    "tl.nextNone": "まだ何も測定されていません。コースの最初の概念は下にあります。",
  }],
  ["zh", {
    "tl.open": "查看证据",
    "tl.close": "关闭",
    "tl.profile": "学习档案",
    "tl.picture": "该学生能证明什么",
    "tl.independentOnly": "仅来自独立完成的作业 —— 引导练习衡量的是教学，而不是学生。",
    "tl.hypotheses": "可能的误解",
    "tl.hypothesisNote": "这是从已记录的错题得出的假设，不是诊断。请用下方的答案核实后再决定。",
    "tl.hypothesisSupport": "{concept} 上有 {n} 个错误答案",
    "tl.recent": "最近记录的答题",
    "tl.offlineAnswer": "离线记录",
    "tl.noWork": "该学生还没有作答。",
    "tl.notMeasuredHere": "本课程尚未测量",
    "tl.nextStep": "从哪里开始",
    "tl.nextWeakest": "最薄弱的已测量概念——打开即可看到将教给该学生的内容。",
    "tl.nextNone": "尚未测量。课程中的第一个概念见下方。",
  }],
  ["fa", {
    "tl.open": "دیدن شواهد",
    "tl.close": "بستن",
    "tl.profile": "نمایهٔ یادگیری",
    "tl.picture": "آنچه این دانش‌آموز می‌تواند نشان دهد",
    "tl.independentOnly": "فقط از کار مستقل — تمرین هدایت‌شده آموزش را می‌سنجد، نه دانش‌آموز را.",
    "tl.hypotheses": "برداشت‌های نادرست احتمالی",
    "tl.hypothesisNote": "فرضیه‌ای از پاسخ‌های نادرست ثبت‌شده، نه تشخیص. آن را با پاسخ‌های زیر بسنجید و سپس تصمیم بگیرید.",
    "tl.hypothesisSupport": "{n} پاسخ نادرست در {concept}",
    "tl.recent": "پاسخ‌های اخیر ثبت‌شده",
    "tl.offlineAnswer": "ثبت‌شده در حالت آفلاین",
    "tl.noWork": "این دانش‌آموز هنوز به چیزی پاسخ نداده است.",
    "tl.notMeasuredHere": "در این دوره هنوز سنجیده نشده",
    "tl.nextStep": "از کجا شروع کنید",
    "tl.nextWeakest": "ضعیف‌ترین مفهوم سنجیده‌شده — بازش کنید تا ببینید به این دانش‌آموز چه آموزش داده می‌شود.",
    "tl.nextNone": "هنوز چیزی سنجیده نشده است. نخستین مفهوم دوره در پایین است.",
  }],
  ["ur", {
    "tl.open": "ثبوت دیکھیں",
    "tl.close": "بند کریں",
    "tl.profile": "سیکھنے کا پروفائل",
    "tl.picture": "یہ طالبِ علم کیا ثابت کر سکتا ہے",
    "tl.independentOnly": "صرف خودمختار کام سے — رہنمائی والی مشق تدریس کو ناپتی ہے، طالبِ علم کو نہیں۔",
    "tl.hypotheses": "ممکنہ غلط فہمیاں",
    "tl.hypothesisNote": "یہ ریکارڈ شدہ غلط جوابات سے بنائی گئی مفروضہ ہے، تشخیص نہیں۔ نیچے دیے جوابات سے جانچیں، پھر فیصلہ کریں۔",
    "tl.hypothesisSupport": "{concept} پر {n} غلط جوابات",
    "tl.recent": "حالیہ ریکارڈ شدہ جوابات",
    "tl.offlineAnswer": "آف لائن ریکارڈ شدہ",
    "tl.noWork": "اس طالبِ علم نے ابھی کچھ جواب نہیں دیا۔",
    "tl.notMeasuredHere": "اس کورس میں ابھی ناپا نہیں گیا",
    "tl.nextStep": "کہاں سے شروع کریں",
    "tl.nextWeakest": "سب سے کمزور ناپا گیا تصور — اسے کھولیں تاکہ دیکھیں اس طالبِ علم کو کیا پڑھایا جائے گا۔",
    "tl.nextNone": "ابھی کچھ ناپا نہیں گیا۔ کورس کا پہلا تصور نیچے ہے۔",
  }],
  ["bn", {
    "tl.open": "প্রমাণ দেখুন",
    "tl.close": "বন্ধ করুন",
    "tl.profile": "শেখার প্রোফাইল",
    "tl.picture": "এই শিক্ষার্থী কী প্রমাণ করতে পারে",
    "tl.independentOnly": "শুধু স্বাধীন কাজ থেকে — নির্দেশিত অনুশীলন শিক্ষণ মাপে, শিক্ষার্থীকে নয়।",
    "tl.hypotheses": "সম্ভাব্য ভুল ধারণা",
    "tl.hypothesisNote": "রেকর্ড করা ভুল উত্তরের ভিত্তিতে একটি অনুমান, রোগনির্ণয় নয়। নিচের উত্তর দিয়ে এটি যাচাই করে তারপর সিদ্ধান্ত নিন।",
    "tl.hypothesisSupport": "{concept}-এ {n}টি ভুল উত্তর",
    "tl.recent": "সাম্প্রতিক রেকর্ড করা উত্তর",
    "tl.offlineAnswer": "অফলাইনে রেকর্ড করা",
    "tl.noWork": "এই শিক্ষার্থী এখনো কিছু উত্তর দেয়নি।",
    "tl.notMeasuredHere": "এই কোর্সে এখনো মাপা হয়নি",
    "tl.nextStep": "কোথা থেকে শুরু করবেন",
    "tl.nextWeakest": "সবচেয়ে দুর্বল মাপা ধারণা — খুলে দেখুন এই শিক্ষার্থীকে কী শেখানো হবে।",
    "tl.nextNone": "এখনো কিছু মাপা হয়নি। কোর্সের প্রথম ধারণা নিচে।",
  }],
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"tl.open"')) {
  console.log("tl.open already present — nothing to do");
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
