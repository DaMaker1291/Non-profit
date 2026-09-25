// One-shot: the home hero was the last surface rendering hardcoded English —
// the H1, the lead paragraph, the language-note under the picker and the
// "I'm a student" card. Add those keys to all 15 dictionaries, anchored after
// each `home.teacherCta` line. Aborts unless every dictionary is patched.
import fs from "node:fs";

// Shape: [before-em, emphasized-word, after] so the <em> survives translation.
const T = {
  en: {
    h1: "Learn", em: "anything", b: ", your way",
    lead: "Free, no sign-up. Adapts to your board, your language, and how you like to be taught.",
    langNote: "Pick your teaching language, answer language, and school language — everything adapts automatically.",
    studentCta: "I'm a student", studentSub: "Learn at your own pace",
  },
  es: {
    h1: "Aprende", em: "lo que sea", b: ", a tu manera",
    lead: "Gratis, sin registro. Se adapta a tu plan de estudios, tu idioma y a cómo prefieres que te expliquen.",
    langNote: "Elige tu idioma de enseñanza, de respuesta y el de tu escuela — todo se adapta automáticamente.",
    studentCta: "Soy estudiante", studentSub: "Aprende a tu ritmo",
  },
  fr: {
    h1: "Apprends", em: "tout", b: ", à ta façon",
    lead: "Gratuit, sans inscription. S'adapte à ton programme, ta langue et à la façon dont tu préfères qu'on t'explique.",
    langNote: "Choisis ta langue d'enseignement, de réponse et celle de ton école — tout s'adapte automatiquement.",
    studentCta: "Je suis élève", studentSub: "Apprends à ton rythme",
  },
  pt: {
    h1: "Aprenda", em: "qualquer coisa", b: ", do seu jeito",
    lead: "Grátis, sem cadastro. Adapta-se ao seu currículo, ao seu idioma e a como você prefere que expliquem.",
    langNote: "Escolha seu idioma de ensino, de resposta e o da escola — tudo se adapta automaticamente.",
    studentCta: "Sou estudante", studentSub: "Aprenda no seu ritmo",
  },
  ar: {
    h1: "تعلّم", em: "أي شيء", b: "، بطريقتك",
    lead: "مجاني، بلا تسجيل. يتكيّف مع منهجك، ولغتك، وطريقة الشرح التي تفضّلها.",
    langNote: "اختر لغة التدريس ولغة الإجابة ولغة مدرستك — كل شيء يتكيّف تلقائيًا.",
    studentCta: "أنا طالب", studentSub: "تعلّم بالوتيرة التي تناسبك",
  },
  sw: {
    h1: "Jifunze", em: "kitu chochote", b: ", kwa njia yako",
    lead: "Bure, bila kujiandikisha. Hulingana na mtaala wako, lugha yako na namna unapopenda kufundishwa.",
    langNote: "Chagua lugha ya kufundisha, lugha ya kujibu na lugha ya shule — kila kitu hulingana kiotomatiki.",
    studentCta: "Mimi ni mwanafunzi", studentSub: "Jifunze kwa kasi yako",
  },
  hi: {
    h1: "अपने तरीके से", em: "कुछ भी", b: " सीखें",
    lead: "मुफ़्त, बिना साइन-अप। आपके बोर्ड, आपकी भाषा और आपकी पसंद के शिक्षण तरीके के अनुसार ढल जाता है।",
    langNote: "अपनी शिक्षा की भाषा, उत्तर की भाषा और स्कूल की भाषा चुनें — सब कुछ अपने आप ढल जाता है।",
    studentCta: "मैं छात्र हूँ", studentSub: "अपनी गति से सीखें",
  },
  id: {
    h1: "Belajar", em: "apa saja", b: ", dengan caramu",
    lead: "Gratis, tanpa daftar. Menyesuaikan kurikulum, bahasamu, dan cara kamu ingin diajari.",
    langNote: "Pilih bahasa pengajaran, bahasa jawaban, dan bahasa sekolahmu — semuanya menyesuaikan otomatis.",
    studentCta: "Saya pelajar", studentSub: "Belajar sesuai kecepatanmu",
  },
  tl: {
    h1: "Matuto ng", em: "kahit ano", b: ", sa paraan mo",
    lead: "Libre, walang sign-up. Umaangkop sa kurikulum mo, wika mo, at kung paano mo gustong turuan ka.",
    langNote: "Piliin ang wika ng pagtuturo, wika ng sagot, at wika ng paaralan — awtomatikong umaangkop ang lahat.",
    studentCta: "Estudyante ako", studentSub: "Matuto sa sarili mong bilis",
  },
  de: {
    h1: "Lerne", em: "alles", b: ", auf deine Art",
    lead: "Kostenlos, ohne Anmeldung. Passt sich deinem Lehrplan, deiner Sprache und deiner bevorzugten Erklärweise an.",
    langNote: "Wähle Unterrichtssprache, Antwortsprache und Schulsprache — alles passt sich automatisch an.",
    studentCta: "Ich bin Schüler/in", studentSub: "Lerne in deinem Tempo",
  },
  ja: {
    h1: "自分のやり方で", em: "何でも", b: "学ぶ",
    lead: "無料、登録不要。あなたのカリキュラム、言語、そして説明の好みに合わせて適応します。",
    langNote: "教える言語、答える言語、学校の言語を選べます — すべて自動で適応します。",
    studentCta: "私は生徒です", studentSub: "自分のペースで学ぶ",
  },
  zh: {
    h1: "用自己的方式", em: "什么都能", b: "学",
    lead: "免费、无需注册。适应你的课程、语言和偏好的讲解方式。",
    langNote: "选择教学语言、作答语言和学校语言——一切自动适应。",
    studentCta: "我是学生", studentSub: "按自己的节奏学习",
  },
  fa: {
    h1: "با روش خودت", em: "هر چیزی", b: " را یاد بگیر",
    lead: "رایگان، بدون ثبت‌نام. با برنامه درسی، زبان و شیوه توضیحی که ترجیح می‌دهی هماهنگ می‌شود.",
    langNote: "زبان آموزش، زبان پاسخ و زبان مدرسه‌ات را انتخاب کن — همه‌چیز خودکار هماهنگ می‌شود.",
    studentCta: "من دانش‌آموزم", studentSub: "با سرعت خودت یاد بگیر",
  },
  ur: {
    h1: "اپنے انداز میں", em: "کچھ بھی", b: " سیکھیں",
    lead: "مفت، بغیر سائن اپ۔ آپ کے نصاب، زبان اور پسندیدہ اندازِ تدریس کے مطابق ڈھل جاتا ہے۔",
    langNote: "تدریس کی زبان، جواب کی زبان اور اسکول کی زبان چنیں — سب خودکار طور پر ڈھل جاتا ہے۔",
    studentCta: "میں طالب علم ہوں", studentSub: "اپنی رفتار سے سیکھیں",
  },
  bn: {
    h1: "নিজের মতো করে", em: "যেকোনো কিছু", b: " শিখুন",
    lead: "বিনামূল্যে, সাইন-আপ ছাড়াই। আপনার পাঠ্যক্রম, ভাষা ও পছন্দের শেখানোর ধরন অনুযায়ী নিজেকে বদলে নেয়।",
    langNote: "শেখানোর ভাষা, উত্তরের ভাষা ও স্কুলের ভাষা বেছে নিন — সবকিছু নিজে থেকেই বদলে যায়।",
    studentCta: "আমি শিক্ষার্থী", studentSub: "নিজের গতিতে শিখুন",
  },
};

const ANCHOR = '"home.teacherCta"';
const lines = fs.readFileSync("lib/i18n.ts", "utf8").split("\n");
const declRe = /^(?:export )?const (\w+): Dict = \{$/;
let cur = null;
const seen = new Set();
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(declRe);
  if (m) { cur = m[1]; continue; }
  if (lines[i] === "  };" || lines[i] === "};") { cur = null; continue; }
  if (!cur || !T[cur]) continue;
  if (!lines[i].includes(ANCHOR) || seen.has(cur)) continue;
  const v = T[cur];
  const ins = [
    `    "home.h1": ${JSON.stringify(v.h1)},`,
    `    "home.h1em": ${JSON.stringify(v.em)},`,
    `    "home.h1b": ${JSON.stringify(v.b)},`,
    `    "home.lead": ${JSON.stringify(v.lead)},`,
    `    "home.langNote": ${JSON.stringify(v.langNote)},`,
    `    "home.studentCta": ${JSON.stringify(v.studentCta)},`,
    `    "home.studentSub": ${JSON.stringify(v.studentSub)},`,
  ];
  lines.splice(i + 1, 0, ...ins);
  seen.add(cur);
  i += ins.length;
}
if (seen.size !== Object.keys(T).length) {
  console.error(`aborted: patched ${seen.size}/${Object.keys(T).length}`, [...seen]);
  process.exit(1);
}
fs.writeFileSync("lib/i18n.ts", lines.join("\n"));
console.log(`home hero keys added to ${seen.size} dictionaries (${seen.size * 7} keys)`);
