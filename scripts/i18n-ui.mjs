// One-shot i18n: THE LANDING PAGE and HELP (UI spec: landing, global shell).
//
// Five keys, and each is a sentence a visitor reads before they have decided
// anything about this product:
//
//   home.tagline  one line saying what OpenMind is
//   home.sub      one line saying what it actually does
//   home.start    the primary action's label
//   home.secStudents  the first section heading ("Students")
//   nav.help      the sidebar's help link
//
// They are keys in all fifteen dictionaries rather than English literals: a
// landing page whose headline is translated and whose pitch is not tells a
// Hindi visitor the product is really for someone else. The old headline
// ("Every student deserves a world-class tutor") is deliberately NOT reused —
// §landing forbids claims the software cannot back up.
//
// Anchored beside `nav.moreAria`, which every dictionary already carries and
// which belongs to the same family. Resolved by dictionary NAME, never by
// position: the dictionaries in lib/i18n.ts are not in `LANGS` order (the draft
// block de, ja, zh, fa, ur, bn sits after tl), so pairing text with dictionary
// by index silently writes Urdu into German and nothing crashes.
//
// Run: node scripts/i18n-ui.mjs
// Idempotent PER KEY: a key already present is skipped and the rest are still
// written, so extending this list later does not duplicate what is there.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"nav.moreAria"';
const KEYS = ["nav.help", "nav.mainAria", "home.tagline", "home.sub", "home.start", "home.secStudents"];

const TEXT = {
  en: {
    "nav.help": "Help",
    "nav.mainAria": "Main menu",
    "home.tagline": "Free adaptive learning for every student.",
    "home.sub": "OpenMind learns what you know, finds what you need next, and gives you the right practice.",
    "home.start": "Start learning",
    "home.secStudents": "Students",
  },
  es: {
    "nav.help": "Ayuda",
    "nav.mainAria": "Menú principal",
    "home.tagline": "Aprendizaje adaptativo y gratuito para cada estudiante.",
    "home.sub": "OpenMind aprende lo que sabes, encuentra lo que necesitas después y te da la práctica adecuada.",
    "home.start": "Empezar a aprender",
    "home.secStudents": "Estudiantes",
  },
  fr: {
    "nav.help": "Aide",
    "nav.mainAria": "Menu principal",
    "home.tagline": "Un apprentissage adaptatif et gratuit pour chaque élève.",
    "home.sub": "OpenMind apprend ce que vous savez, trouve ce dont vous avez besoin ensuite et vous donne le bon exercice.",
    "home.start": "Commencer à apprendre",
    "home.secStudents": "Élèves",
  },
  pt: {
    "nav.help": "Ajuda",
    "nav.mainAria": "Menu principal",
    "home.tagline": "Aprendizagem adaptativa e gratuita para cada estudante.",
    "home.sub": "O OpenMind aprende o que sabes, descobre o que precisas a seguir e dá-te a prática certa.",
    "home.start": "Começar a aprender",
    "home.secStudents": "Estudantes",
  },
  ar: {
    "nav.help": "مساعدة",
    "nav.mainAria": "القائمة الرئيسية",
    "home.tagline": "تعلّم تكيّفي مجاني لكل طالب.",
    "home.sub": "يتعلّم OpenMind ما تعرفه، ويحدّد ما تحتاجه بعد ذلك، ويمنحك التدريب المناسب.",
    "home.start": "ابدأ التعلّم",
    "home.secStudents": "الطلاب",
  },
  sw: {
    "nav.help": "Msaada",
    "nav.mainAria": "Menyu kuu",
    "home.tagline": "Kujifunza kunakobadilika bila malipo kwa kila mwanafunzi.",
    "home.sub": "OpenMind hujifunza unachojua, hutafuta unachohitaji kifuatacho, na hukupa mazoezi yanayofaa.",
    "home.start": "Anza kujifunza",
    "home.secStudents": "Wanafunzi",
  },
  hi: {
    "nav.help": "सहायता",
    "nav.mainAria": "मुख्य मेनू",
    "home.tagline": "हर विद्यार्थी के लिए मुफ़्त अनुकूली शिक्षा।",
    "home.sub": "OpenMind जानता है आप क्या जानते हैं, तय करता है कि आगे क्या चाहिए और सही अभ्यास देता है।",
    "home.start": "सीखना शुरू करें",
    "home.secStudents": "विद्यार्थी",
  },
  id: {
    "nav.help": "Bantuan",
    "nav.mainAria": "Menu utama",
    "home.tagline": "Pembelajaran adaptif gratis untuk setiap siswa.",
    "home.sub": "OpenMind mempelajari apa yang kamu kuasai, menemukan apa yang kamu butuhkan berikutnya, dan memberi latihan yang tepat.",
    "home.start": "Mulai belajar",
    "home.secStudents": "Siswa",
  },
  tl: {
    "nav.help": "Tulong",
    "nav.mainAria": "Pangunahing menu",
    "home.tagline": "Libreng adaptive na pag-aaral para sa bawat mag-aaral.",
    "home.sub": "Natututuhan ng OpenMind ang alam mo, hinahanap ang susunod na kailangan mo, at ibinibigay ang tamang pagsasanay.",
    "home.start": "Simulan ang pag-aaral",
    "home.secStudents": "Mga mag-aaral",
  },
  ur: {
    "nav.help": "مدد",
    "nav.mainAria": "مرکزی فہرست",
    "home.tagline": "ہر طالبِ علم کے لیے مفت موافقی تعلیم۔",
    "home.sub": "OpenMind جانتا ہے آپ کیا جانتے ہیں، آگے کیا درکار ہے یہ طے کرتا ہے، اور صحیح مشق دیتا ہے۔",
    "home.start": "سیکھنا شروع کریں",
    "home.secStudents": "طلبہ",
  },
  fa: {
    "nav.help": "راهنما",
    "nav.mainAria": "منوی اصلی",
    "home.tagline": "یادگیری تطبیقی و رایگان برای هر دانش‌آموز.",
    "home.sub": "OpenMind می‌داند چه می‌دانید، نیاز بعدی شما را پیدا می‌کند و تمرین درست را در اختیارتان می‌گذارد.",
    "home.start": "شروع یادگیری",
    "home.secStudents": "دانش‌آموزان",
  },
  de: {
    "nav.help": "Hilfe",
    "nav.mainAria": "Hauptmenü",
    "home.tagline": "Kostenloses adaptives Lernen für alle Schülerinnen und Schüler.",
    "home.sub": "OpenMind erkennt, was du weißt, findet, was du als Nächstes brauchst, und gibt dir die richtige Übung.",
    "home.start": "Jetzt lernen",
    "home.secStudents": "Schülerinnen und Schüler",
  },
  ja: {
    "nav.help": "ヘルプ",
    "nav.mainAria": "メインメニュー",
    "home.tagline": "すべての生徒のための無料アダプティブ学習。",
    "home.sub": "OpenMind はあなたが何を知っているかを学び、次に必要なものを見つけ、適切な演習を出します。",
    "home.start": "学習を始める",
    "home.secStudents": "生徒",
  },
  zh: {
    "nav.help": "帮助",
    "nav.mainAria": "主菜单",
    "home.tagline": "为每一位学生提供的免费自适应学习。",
    "home.sub": "OpenMind 了解你会什么，找出你下一步需要什么，并给出合适的练习。",
    "home.start": "开始学习",
    "home.secStudents": "学生",
  },
  bn: {
    "nav.help": "সহায়তা",
    "nav.mainAria": "প্রধান মেনু",
    "home.tagline": "প্রতিটি শিক্ষার্থীর জন্য বিনামূল্যে অভিযোজিত শেখা।",
    "home.sub": "OpenMind জানে আপনি কী জানেন, এরপর কী দরকার তা খুঁজে বের করে, এবং সঠিক অনুশীলন দেয়।",
    "home.start": "শেখা শুরু করুন",
    "home.secStudents": "শিক্ষার্থীরা",
  },
};

const CODES = Object.keys(TEXT);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const [code, texts] of Object.entries(TEXT)) {
  const missing = KEYS.filter((k) => typeof texts[k] !== "string" || !texts[k]);
  if (missing.length) throw new Error(`${code}: no text for ${missing.join(", ")}`);
}

const src = fs.readFileSync(FILE, "utf8");
const TODO = KEYS.filter((k) => !src.includes(`"${k}"`));
if (TODO.length === 0) {
  console.log("ui keys already present — nothing to do");
  process.exit(0);
}
console.log(`adding ${TODO.join(", ")} to ${CODES.length} dictionaries`);

const lines = src.split("\n");
const insertions = [];
for (const code of CODES) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no \`const ${code}: Dict = {\` in ${FILE}`);
  const end = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  const stop = end < 0 ? lines.length : end;
  const idx = lines.findIndex((l, i) => i > start && i < stop && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  insertions.push({
    at: idx + 1,
    lines: TODO.map((key) => {
      const escaped = TEXT[code][key].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `${indent}"${key}": "${escaped}",`;
    }),
  });
}
if (new Set(insertions.map((i) => i.at)).size !== insertions.length) {
  throw new Error("two languages resolved to the same anchor — refusing to write");
}
insertions.sort((a, b) => b.at - a.at);
for (const ins of insertions) lines.splice(ins.at, 0, ...ins.lines);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${CODES.length * TODO.length} strings (${TODO.length} keys × ${CODES.length} languages) to ${FILE}`);
