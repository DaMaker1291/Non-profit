// One-shot: strings for the Home-refactor — the "what should I do now?" card,
// its one-CTA header, the neutral greeting for anonymous learners, and the
// queue the plan summary renders from. Authored in all 15 languages here; the
// call sites are switched to t() in the same change.
import fs from "node:fs";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const K = {
  "nav.moreAria": [
    "More pages",
    "Más páginas",
    "Autres pages",
    "Mais páginas",
    "صفحات أخرى",
    "Kurasa nyingine",
    "अन्य पेज",
    "Halaman lain",
    "Iba pang pahina",
    "Weitere Seiten",
    "その他のページ",
    "更多页面",
    "صفحات دیگر",
    "مزید صفحات",
    "আরও পৃষ্ঠা",
  ],
  "next.howTitle": [
    "How this session works",
    "Cómo funciona esta sesión",
    "Comment se déroule cette session",
    "Como esta sessão funciona",
    "كيف تسير هذه الجلسة",
    "Jinsi kipindi hiki kinavyofanya kazi",
    "यह सेशन कैसे चलेगा",
    "Cara kerja sesi ini",
    "Paano takbuhin ang sesyon na ito",
    "So läuft diese Einheit",
    "このセッションの流れ",
    "本次练习的流程",
    "این جلسه چطور پیش می‌رود",
    "یہ سیشن کیسے چلے گا",
    "এই সেশনটি কীভাবে চলবে",
  ],
  "next.oneThing": [
    "One thing at a time — finish this before starting another.",
    "Una cosa a la vez: termina esto antes de empezar otra.",
    "Une chose à la fois — termine celle-ci avant d'en commencer une autre.",
    "Uma coisa de cada vez — termine esta antes de começar outra.",
    "شيء واحد في كل مرة — أنهِ هذا قبل البدء بآخر.",
    "Kitu kimoja kwa wakati — maliza hiki kwanza kabla ya kuanza kingine.",
    "एक समय पर एक काम — दूसरा शुरू करने से पहले यह पूरा करें।",
    "Satu hal dalam satu waktu — selesaikan ini sebelum mulai yang lain.",
    "Isang bagay sa isang pagkakataon — tapusin muna ito bago magsimula ng iba.",
    "Nur eine Sache auf einmal — beende das, bevor du etwas anderes beginnst.",
    "一度にひとつ — 別のことを始める前にこれを終えましょう。",
    "一次只做一件事 — 完成后再开始下一件。",
    "هر بار یک کار — قبل از شروع کار دیگر این را تمام کن.",
    "ایک وقت میں ایک کام — دوسرا شروع کرنے سے پہلے یہ مکمل کریں۔",
    "একবারে একটি কাজ — অন্যটি শুরু করার আগে এটি শেষ করুন।",
  ],
  "next.ctaStart": [
    "Start this session",
    "Empezar esta sesión",
    "Commencer cette session",
    "Iniciar esta sessão",
    "ابدأ هذه الجلسة",
    "Anza kipindi hiki",
    "यह सेशन शुरू करें",
    "Mulai sesi ini",
    "Simulan ang sesyon na ito",
    "Diese Einheit starten",
    "このセッションを開始",
    "开始本次练习",
    "این جلسه را شروع کن",
    "یہ سیشن شروع کریں",
    "এই সেশন শুরু করুন",
  ],
  "dash.welcome": [
    "Welcome back",
    "Bienvenido de nuevo",
    "Bon retour",
    "Bem-vindo de volta",
    "مرحبًا بعودتك",
    "Karibu tena",
    "वापसी पर स्वागत है",
    "Selamat datang kembali",
    "Maligayang pagbabalik",
    "Willkommen zurück",
    "おかえりなさい",
    "欢迎回来",
    "خوش آمدید",
    "خوش آمدید",
    "স্বাগতম",
  ],
  "dash.planSummary": [
    "Your plan",
    "Tu plan",
    "Ton plan",
    "Seu plano",
    "خطتك",
    "Mpango wako",
    "आपकी योजना",
    "Rencana Anda",
    "Ang plano mo",
    "Dein Plan",
    "あなたの計画",
    "你的计划",
    "برنامه شما",
    "آپ کا منصوبہ",
    "আপনার পরিকল্পনা",
  ],
  "dash.planHow": [
    "How OpenMind will get you there",
    "Cómo te llevará OpenMind hasta ahí",
    "Comment OpenMind vous y conduira",
    "Como o OpenMind vai levar você até lá",
    "كيف يوصلك OpenMind إلى هناك",
    "Jinsi OpenMindatakufikisha hapo",
    "OpenMind कैसे आपको वहाँ पहुँचाएगा",
    "Bagaimana OpenMind membawamu ke sana",
    "Kung paano ka dadalhin ng OpenMind doon",
    "Wie OpenMind dich dorthin bringt",
    "OpenMindがあなたをそこへ導く方法",
    "OpenMind 如何带你到达那里",
    "OpenMind چطور شما را به آنجا می‌رساند",
    "OpenMind آپ کو وہاں کیسے پہنچائے گا",
    "OpenMind কীভাবে আপনাকে সেখানে পৌঁছাবে",
  ],
};

const declRe = /^(?:export )?const (\w+): Dict = \{$/gm;
let out = fs.readFileSync("lib/i18n.ts", "utf8");
let added = 0;
for (const lang of LANGS) {
  declRe.lastIndex = 0;
  const decls = []; let d;
  while ((d = declRe.exec(out))) decls.push({ name: d[1], start: d.index });
  const idx = decls.findIndex((x) => x.name === lang);
  if (idx < 0) { console.error(`no dictionary for ${lang}`); process.exit(1); }
  const start = decls[idx].start;
  const rel = out.slice(start).match(/\n[ \t]*\};/);
  if (!rel) { console.error(`${lang}: closing brace not found`); process.exit(1); }
  const end = start + rel.index;
  const have = new Set([...out.slice(start, end).matchAll(/"([a-zA-Z0-9._-]+)":/g)].map((m) => m[1]));
  const col = LANGS.indexOf(lang);
  const lines = Object.entries(K)
    .filter(([k]) => !have.has(k))
    .map(([k, v]) => `  "${k}": ${JSON.stringify(v[col])},`);
  if (lines.length === 0) continue;
  out = out.slice(0, end) + "\n" + lines.join("\n") + out.slice(end);
  added += lines.length;
}
fs.writeFileSync("lib/i18n.ts", out);
console.log(`added ${added} strings (${Object.keys(K).length} keys × ${LANGS.length} languages)`);
