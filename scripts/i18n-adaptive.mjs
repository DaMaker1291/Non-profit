// One-shot i18n: the ADAPTIVE DIFFICULTY strings.
//
// The practice serve now reads the learner's own record and says WHY this
// question: a fresh concept starts at the course tier, a run of correct answers
// moves the rung up, a struggling learner is eased down AND offered support, and
// the item's own level is shown as a band (never the internal difficulty score).
// A learner-visible string that exists in one language only would ship
// half-English in fourteen others, so they are authored everywhere at once —
// following the convention of the other one-shot scripts here: insert the keys
// beside their sibling (`learn.hint`), in each dictionary, by hand rather than
// machine-filled.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"learn.hint"';

/** Language order as the dictionaries appear in lib/i18n.ts — en, es, fr, pt,
 *  ar, sw, hi, id, fil, de, ja, zh, fa, ur, bn. */
const TEXTS = [
  ["en", [
    "Why this question",
    "Level {n} of 5",
    "Your course level — nothing has been measured on this idea yet.",
    "Your course level, chosen from how you have done so far.",
    "You have the last few right, so this one goes further.",
    "The last answers slipped, so this one steadies the idea first.",
    "A hint is one tap away if you want it.",
    "Practice available to level {n} of 5",
  ]],
  ["es", [
    "Por qué esta pregunta",
    "Nivel {n} de 5",
    "Tu nivel del curso: aún no se ha medido nada de esta idea.",
    "Tu nivel del curso, según lo que has hecho hasta ahora.",
    "Has acertado las últimas, así que esta va más allá.",
    "Las últimas fallaron, así que esta afianza la idea primero.",
    "Tienes una pista a un toque si la quieres.",
    "Práctica disponible hasta el nivel {n} de 5",
  ]],
  ["fr", [
    "Pourquoi cette question",
    "Niveau {n} sur 5",
    "Ton niveau de cours : rien n'a encore été mesuré sur cette notion.",
    "Ton niveau de cours, d'après ce que tu as fait jusqu'ici.",
    "Tu as réussi les dernières : celle-ci va plus loin.",
    "Les dernières ont échoué, donc celle-ci consolide d'abord l'idée.",
    "Une aide est à un clic si tu en veux une.",
    "Entraînement disponible jusqu'au niveau {n} sur 5",
  ]],
  ["pt", [
    "Por que esta pergunta",
    "Nível {n} de 5",
    "O seu nível do curso: ainda não há medição sobre esta ideia.",
    "O seu nível do curso, a partir do que já fez até agora.",
    "Acertou as últimas, por isso esta vai mais longe.",
    "As últimas falharam, por isso esta firma a ideia primeiro.",
    "Há uma dica a um toque, se quiser.",
    "Prática disponível até ao nível {n} de 5",
  ]],
  ["ar", [
    "لماذا هذا السؤال",
    "المستوى {n} من 5",
    "مستوى مقررك الدراسي: لم يُقس شيء بعد في هذه الفكرة.",
    "مستوى مقررك الدراسي، بحسب ما أنجزته حتى الآن.",
    "أجبت بشكل صحيح عن الأسئلة الأخيرة، لذا هذا السؤال أعمق.",
    "تعثّرت الإجابات الأخيرة، لذا يثبّت هذا السؤال الفكرة أولًا.",
    "التلميح على بعد نقرة إن أردت.",
    "التدريب متاح حتى المستوى {n} من 5",
  ]],
  ["sw", [
    "Kwa nini swali hili",
    "Ngazi ya {n} kati ya 5",
    "Ngazi ya kozi yako — hakuna kilichopimwa kuhusu wazo hili bado.",
    "Ngazi ya kozi yako, kulingana na ulivyofanya hadi sasa.",
    "Umezijibu za mwisho kwa usahihi, hivyo hili linaenda mbali zaidi.",
    "Majibu ya mwisho yalikosea, hivyo hili lathibitisha wazo kwanza.",
    "Kidokezo kipo kwa mguso mmoja ukitaka.",
    "Mazoezi yanapatikana hadi ngazi ya {n} kati ya 5",
  ]],
  ["hi", [
    "यह प्रश्न क्यों",
    "स्तर {n} / 5",
    "आपके पाठ्यक्रम का स्तर — इस विचार पर अभी कुछ नहीं मापा गया है।",
    "आपके पाठ्यक्रम का स्तर, जो अब तक के प्रदर्शन से तय हुआ है।",
    "पिछले उत्तर सही रहे, इसलिए यह प्रश्न आगे तक जाता है।",
    "पिछले उत्तर चूके, इसलिए यह पहले विचार को मज़बूत करता है।",
    "चाहें तो एक संकेत बस एक टैप दूर है।",
    "अभ्यास स्तर {n} / 5 तक उपलब्ध है",
  ]],
  ["id", [
    "Mengapa soal ini",
    "Tingkat {n} dari 5",
    "Tingkat kursusmu — belum ada yang diukur pada ide ini.",
    "Tingkat kursusmu, dipilih dari hasil kerjamu sejauh ini.",
    "Beberapa soal terakhir benar, jadi soal ini lebih jauh.",
    "Jawaban terakhir meleset, jadi soal ini menguatkan idenya dahulu.",
    "Ada petunjuk satu ketuk jika kamu mau.",
    "Latihan tersedia sampai tingkat {n} dari 5",
  ]],
  ["fil", [
    "Bakit ganitong tanong",
    "Antas {n} ng 5",
    "Antas ng iyong kurso — wala pang nasusukat sa ideyang ito.",
    "Antas ng iyong kurso, batay sa nagawa mo hanggang ngayon.",
    "Tama ang huling mga sagot, kaya mas malayo ang tanong na ito.",
    "Naligaw ang huling mga sagot, kaya pinapatibay muna ng isang ito ang ideya.",
    "Isang tap lang ang hint kung gusto mo.",
    "May pagsasanay hanggang antas {n} ng 5",
  ]],
  ["de", [
    "Warum diese Aufgabe",
    "Stufe {n} von 5",
    "Dein Kursniveau — zu dieser Idee wurde noch nichts gemessen.",
    "Dein Kursniveau, gewählt nach dem, was du bisher geschafft hast.",
    "Die letzten Aufgaben saßen, deshalb geht diese weiter.",
    "Die letzten Antworten gingen daneben, deshalb festigt diese zuerst die Idee.",
    "Ein Hinweis ist einen Tipp entfernt, wenn du magst.",
    "Übung verfügbar bis Stufe {n} von 5",
  ]],
  ["ja", [
    "この問題の理由",
    "レベル {n} / 5",
    "コースのレベルです。この考え方はまだ測っていません。",
    "これまでの結果から決まったコースのレベルです。",
    "直近は正解が続いたので、この問題はもう一歩先です。",
    "直近でつまずいたので、この問題はまず考え方を固めます。",
    "必要ならヒントはワンタップの先にあります。",
    "レベル {n} / 5 まで練習できます",
  ]],
  ["zh", [
    "为什么是这道题",
    "第 {n} 级 / 共 5 级",
    "你的课程级别 —— 这个概念还没有被测量过。",
    "你的课程级别，由你目前的表现决定。",
    "最近几题都答对了，所以这道更进一步。",
    "最近几题出错，所以这道先把这个概念打牢。",
    "需要的话，提示只需轻点一下。",
    "练习可用至第 {n} 级 / 共 5 级",
  ]],
  ["fa", [
    "چرا این پرسش",
    "سطح {n} از ۵",
    "سطح دورهٔ تو — هنوز چیزی از این مفهوم سنجیده نشده است.",
    "سطح دورهٔ تو، بر پایهٔ آنچه تا اینجا انجام داده‌ای.",
    "چند پاسخ آخر درست بود، پس این پرسش جلوتر می‌رود.",
    "پاسخ‌های آخر نادرست بود، پس این یکی نخست مفهوم را تثبیت می‌کند.",
    "اگر بخواهی، راهنما یک لمس فاصله دارد.",
    "تمرین تا سطح {n} از ۵ در دسترس است",
  ]],
  ["ur", [
    "یہ سوال کیوں",
    "سطح {n} از 5",
    "آپ کے کورس کا سطح — اس خیال پر ابھی کچھ نہیں ناپا گیا۔",
    "آپ کے کورس کا سطح، جو اب تک کی کارکردگی سے طے ہوا۔",
    "گزشتہ جوابات درست رہے، اس لیے یہ سوال آگے جاتا ہے۔",
    "گزشتہ جوابات چوک گئے، اس لیے یہ پہلے خیال کو مضبوط کرتا ہے۔",
    "چاہیں تو اشارہ ایک ٹیپ کی دوری پر ہے۔",
    "مشق سطح {n} از 5 تک دستیاب ہے",
  ]],
  ["bn", [
    "এই প্রশ্নটি কেন",
    "স্তর {n} / ৫",
    "তোমার কোর্সের স্তর — এই ধারণাটি এখনো মাপা হয়নি।",
    "তোমার কোর্সের স্তর, এতদিনের ফলাফল অনুযায়ী।",
    "শেষ কয়েকটি সঠিক হয়েছে, তাই এটি আরও এগিয়ে যায়।",
    "শেষ উত্তরগুলো ভুল হয়েছে, তাই এটি আগে ধারণাটি পাকা করে।",
    "চাইলে একটি সূত্র এক ট্যাপ দূরেই আছে।",
    "অভ্যাস স্তর {n} / ৫ পর্যন্ত পাওয়া যায়",
  ]],
];

const KEYS = [
  "target.why", "target.level", "target.fresh", "target.steady",
  "target.stretch", "target.repair", "target.scaffold", "home.practice",
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"target.scaffold"')) {
  console.log("adaptive-difficulty keys already present — nothing to do");
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
