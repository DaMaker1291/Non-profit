// One-shot: the diagnostic's demand-level breakdown.
//   skill.<id>       — the five demand levels a probe can measure
//   diag.skillsTitle / diag.skillsSub / diag.notMeasured / diag.bankNote
// Anchored after each `diag.done` line; aborts unless 15/15.
import fs from "node:fs";

const T = {
  en: {
    skillsTitle: "What you can do, by demand",
    skillsSub: "Not just which topics — what kind of thinking each one asked for.",
    notMeasured: "not measured",
    bankNote: "These probes are OpenMind-authored questions written to your qualification's difficulty bands — not reproduced board papers, and multiple-choice only, so extended written answers are not measured here.",
    recall: "Recall", application: "Application", multi_step: "Multi-step", data_interpretation: "Data & graphs", extended_response: "Extended written answer",
  },
  es: {
    skillsTitle: "Lo que puedes hacer, por exigencia",
    skillsSub: "No solo los temas: qué tipo de razonamiento pedía cada uno.",
    notMeasured: "sin medir",
    bankNote: "Estas preguntas las escribe OpenMind según las bandas de dificultad de tu titulación; no son exámenes oficiales reproducidos y son de elección múltiple, así que la respuesta escrita extensa no se mide aquí.",
    recall: "Memoria", application: "Aplicación", multi_step: "Varios pasos", data_interpretation: "Datos y gráficas", extended_response: "Respuesta escrita extensa",
  },
  fr: {
    skillsTitle: "Ce que tu sais faire, par exigence",
    skillsSub: "Pas seulement les thèmes : le type de raisonnement demandé.",
    notMeasured: "non évalué",
    bankNote: "Ces questions sont rédigées par OpenMind selon les niveaux de difficulté de ta certification — ce ne sont pas des sujets officiels reproduits, et elles sont à choix multiple : la réponse rédigée longue n'est pas évaluée ici.",
    recall: "Mémorisation", application: "Application", multi_step: "Plusieurs étapes", data_interpretation: "Données et graphiques", extended_response: "Réponse rédigée longue",
  },
  pt: {
    skillsTitle: "O que sabes fazer, por exigência",
    skillsSub: "Não só os temas: o tipo de raciocínio que cada um pedia.",
    notMeasured: "não avaliado",
    bankNote: "Estas questões são escritas pela OpenMind segundo as bandas de dificuldade da tua qualificação — não são provas oficiais reproduzidas e são de escolha múltipla, por isso a resposta escrita longa não é avaliada aqui.",
    recall: "Memória", application: "Aplicação", multi_step: "Vários passos", data_interpretation: "Dados e gráficos", extended_response: "Resposta escrita longa",
  },
  ar: {
    skillsTitle: "ما تستطيع فعله، حسب مستوى المطلب",
    skillsSub: "ليس المواضيع فقط: بل نوع التفكير الذي يطلبه كل سؤال.",
    notMeasured: "لم يُقس",
    bankNote: "هذه الأسئلة من تأليف OpenMind وفق نطاقات الصعوبة في شهادتك؛ وليست أوراق امتحان رسمية منسوخة، وهي اختيار من متعدد، لذا لا تُقاس هنا الإجابة المكتوبة المطوّلة.",
    recall: "الاسترجاع", application: "التطبيق", multi_step: "متعدد الخطوات", data_interpretation: "البيانات والرسوم", extended_response: "إجابة مكتوبة مطوّلة",
  },
  sw: {
    skillsTitle: "Unachoweza, kwa kiwango cha mahitaji",
    skillsSub: "Sio mada tu — ni aina gani ya kufikiri kila swali lililohitaji.",
    notMeasured: "hakupimwa",
    bankNote: "Maswali haya yameandikwa na OpenMind kulingana na viwango vya ugumu vya shahada yako — si mitihani rasmi iliyonakiliwa, na ni ya kuchagua moja, kwa hivyo jibu refu la maandishi halipimwi hapa.",
    recall: "Kukumbuka", application: "Kutumia", multi_step: "Hatua nyingi", data_interpretation: "Data na grafu", extended_response: "Jibu refu la maandishi",
  },
  hi: {
    skillsTitle: "आप क्या कर सकते हैं, कठिनाई के अनुसार",
    skillsSub: "सिर्फ़ विषय नहीं — हर प्रश्न किस तरह की सोच माँगता था।",
    notMeasured: "मापा नहीं गया",
    bankNote: "ये प्रश्न OpenMind ने आपकी योग्यता के कठिनाई-स्तरों के अनुसार लिखे हैं — ये किसी बोर्ड के पुनरुत्पादित पेपर नहीं हैं, और बहुविकल्पीय हैं, इसलिए विस्तृत लिखित उत्तर यहाँ नहीं मापा जाता।",
    recall: "स्मरण", application: "प्रयोग", multi_step: "बहु-चरणीय", data_interpretation: "आँकड़े व ग्राफ़", extended_response: "विस्तृत लिखित उत्तर",
  },
  id: {
    skillsTitle: "Apa yang bisa kamu lakukan, menurut tuntutan",
    skillsSub: "Bukan hanya topik — jenis berpikir yang diminta tiap soal.",
    notMeasured: "belum diukur",
    bankNote: "Soal-soal ini ditulis OpenMind sesuai rentang kesulitan kualifikasimu — bukan naskah ujian resmi yang disalin, dan berbentuk pilihan ganda, jadi jawaban tertulis panjang tidak diukur di sini.",
    recall: "Ingatan", application: "Penerapan", multi_step: "Banyak langkah", data_interpretation: "Data & grafik", extended_response: "Jawaban tertulis panjang",
  },
  tl: {
    skillsTitle: "Ang kaya mong gawin, ayon sa hinihingi",
    skillsSub: "Hindi lang mga paksa — kung anong uri ng pag-iisip ang hinihingi.",
    notMeasured: "hindi sinukat",
    bankNote: "Ang mga tanong na ito ay isinulat ng OpenMind ayon sa mga antas ng hirap ng iyong kwalipikasyon — hindi ito kinopyang opisyal na papel, at multiple-choice lamang, kaya hindi sinukat dito ang mahabang nakasulat na sagot.",
    recall: "Pag-alala", application: "Paglalapat", multi_step: "Maraming hakbang", data_interpretation: "Data at grap", extended_response: "Mahabang nakasulat na sagot",
  },
  de: {
    skillsTitle: "Was du kannst — nach Anforderung",
    skillsSub: "Nicht nur Themen: welche Art des Denkens jeweils verlangt wurde.",
    notMeasured: "nicht gemessen",
    bankNote: "Diese Aufgaben sind von OpenMind nach den Anforderungsbereichen deines Abschlusses geschrieben — keine reproduzierten Originalprüfungen, und nur Multiple-Choice, deshalb wird eine längere schriftliche Antwort hier nicht gemessen.",
    recall: "Wiedergeben", application: "Anwenden", multi_step: "Mehrschrittig", data_interpretation: "Daten und Diagramme", extended_response: "Längere schriftliche Antwort",
  },
  ja: {
    skillsTitle: "何ができるか（要求水準別）",
    skillsSub: "単元だけでなく、各問が求めた思考の種類です。",
    notMeasured: "未測定",
    bankNote: "これらの問題は、あなたの資格の難易度帯に合わせて OpenMind が作成したものです — 公式過去問の複製ではなく、すべて四択のため、長い記述解答はここでは測定していません。",
    recall: "想起", application: "活用", multi_step: "多段階", data_interpretation: "データとグラフ", extended_response: "長い記述解答",
  },
  zh: {
    skillsTitle: "你能做什么（按要求层次）",
    skillsSub: "不只是主题，而是每道题要求的思维类型。",
    notMeasured: "未测量",
    bankNote: "这些题目由 OpenMind 依照你所在资格的难度区间编写——不是官方试卷的复制，且全部为选择题，因此这里不测量长篇书面作答。",
    recall: "记忆", application: "应用", multi_step: "多步骤", data_interpretation: "数据与图表", extended_response: "长篇书面作答",
  },
  fa: {
    skillsTitle: "چه می‌توانی، بر پایه سطح تقاضا",
    skillsSub: "نه فقط موضوع‌ها — بلکه نوع تفکری که هر پرسش می‌خواست.",
    notMeasured: "سنجیده نشده",
    bankNote: "این پرسش‌ها را OpenMind بر پایه بازه‌های دشواری مدرک تو نوشته است — نه برگه‌های رسمی بازتولیدشده، و همه چندگزینه‌ای‌اند، پس پاسخ نوشتاری بلند اینجا سنجیده نمی‌شود.",
    recall: "یادآوری", application: "کاربرد", multi_step: "چندگامی", data_interpretation: "داده و نمودار", extended_response: "پاسخ نوشتاری بلند",
  },
  ur: {
    skillsTitle: "آپ کیا کر سکتے ہیں، مطالبے کے لحاظ سے",
    skillsSub: "صرف موضوعات نہیں — ہر سوال کس قسم کی سوچ مانگتا تھا۔",
    notMeasured: "نہیں ناپا گیا",
    bankNote: "یہ سوالات OpenMind نے آپ کی قابلیت کے دشواری درجوں کے مطابق لکھے ہیں — کسی بورڈ کے نقل شدہ پرچے نہیں، اور کثیر الانتخاب ہیں، اس لیے تفصیلی تحریری جواب یہاں نہیں ناپا جاتا۔",
    recall: "یاد", application: "اطلاق", multi_step: "متعدد مراحل", data_interpretation: "ڈیٹا و گراف", extended_response: "تفصیلی تحریری جواب",
  },
  bn: {
    skillsTitle: "আপনি কী করতে পারেন, দাবির স্তর অনুযায়ী",
    skillsSub: "শুধু বিষয় নয় — প্রতিটি প্রশ্ন কেমন চিন্তা চেয়েছিল।",
    notMeasured: "মাপা হয়নি",
    bankNote: "এই প্রশ্নগুলো আপনার যোগ্যতার কঠিনতার স্তর অনুযায়ী OpenMind লিখেছে — কোনো বোর্ডের পুনরুৎপাদিত প্রশ্নপত্র নয়, এবং সবই বহুনির্বাচনী, তাই বিস্তৃত লিখিত উত্তর এখানে মাপা হয় না।",
    recall: "স্মরণ", application: "প্রয়োগ", multi_step: "বহুধাপ", data_interpretation: "তথ্য ও গ্রাফ", extended_response: "বিস্তৃত লিখিত উত্তর",
  },
};

const KEYS = [
  ["skillsTitle", "diag.skillsTitle"], ["skillsSub", "diag.skillsSub"],
  ["notMeasured", "diag.notMeasured"], ["bankNote", "diag.bankNote"],
  ["recall", "skill.recall"], ["application", "skill.application"], ["multi_step", "skill.multi_step"],
  ["data_interpretation", "skill.data_interpretation"], ["extended_response", "skill.extended_response"],
];

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
  // NOT line-anchored: much of lib/i18n.ts packs several keys per line, and a
  // `/^\s*"diag\.done":/` anchor matches only the FOUR dictionaries that put
  // this key first on its line. Asking whether the line CONTAINS the key is the
  // only version that reaches all 15.
  if (line.includes('"diag.done":')) {
    const code = order[idx];
    const row = T[code];
    if (!row) throw new Error(`no demand-level translations for ${code}`);
    for (const [field, key] of KEYS) {
      if (!row[field]) throw new Error(`${code} is missing ${field}`);
      out.push(`  "${key}": ${JSON.stringify(row[field])},`);
    }
    done++;
  }
}
if (done !== 15) throw new Error(`inserted into ${done}/15 dictionaries`);
fs.writeFileSync("lib/i18n.ts", out.join("\n"));
console.log(`${KEYS.length} keys × ${done} dictionaries = ${KEYS.length * done} strings`);
