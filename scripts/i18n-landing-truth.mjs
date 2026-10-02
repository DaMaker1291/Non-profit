// One-shot i18n: make the STATIC landing page's claims true.
//
// WHY. The Next app's landing page was already repaired: `home.tagline` and
// `home.sub` say what the software does, in all fifteen dictionaries. The
// static build was not. It has its own key family, written earlier, and those
// keys were never revisited, so the page a visitor lands on today opens with
// four claims the project has since decided it cannot back up:
//
//   home.heroTitle  "Every student deserves a world-class tutor."
//        The exact sentence scripts/i18n-ui.mjs records as "deliberately NOT
//        reused — §landing forbids claims the software cannot back up." It is
//        still here, in the one dictionary nobody re-reads.
//   home.heroSub    "...in your language, on any phone, even offline."
//        "on any phone" is untested at the widths that matter and "even
//        offline" was a product-wide claim made for a build whose offline
//        story is real but narrow. The truthful part — your work stays on the
//        device — is kept below; the absolutes are not.
//   brand.tagline   "A world-class tutor for every student — free, forever."
//        "world-class" again, and a promise about the future of a free product
//        that no code can keep.
//   home.offline    "Server-graded practice"
//        This is the sharp one. The key is named `offline`, it sits in the
//        dictionary of the build that has NO SERVER, and it tells the learner
//        their work is server-graded when their own browser grades it and keeps
//        it. .github/workflows/pages.yml says so in as many words. A learner
//        reading this is being told, falsely, that a copy of their answers
//        exists somewhere they do not control. The replacement says where
//        grading actually happens.
//
// These keys already EXIST, so this script REPLACES values in place rather
// than inserting new ones. Same convention as the other one-shot scripts: each
// dictionary edited by name, completeness asserted before and after, refuse to
// write if any language is missing a value. Idempotent: a key already holding
// the new text is left alone, so re-running is safe.
//
// Run: node scripts/i18n-landing-truth.mjs

import fs from "node:fs";

const FILE = "lib/i18n.ts";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

/** Only the four claims above. Everything else on the page is left alone. */
const CLAIMS = ["home.heroTitle", "home.heroSub", "brand.tagline", "home.offline"];

const VALUES = {
  "home.heroTitle": {
    en: "Practice that adapts to what you actually know.",
    es: "Práctica que se adapta a lo que realmente sabes.",
    fr: "Des exercices qui s’adaptent à ce que vous savez vraiment.",
    pt: "Prática que se adapta ao que você realmente sabe.",
    ar: "تدريب يتكيّف مع ما تعرفه فعلاً.",
    sw: "Mazoizi yanayobadilika kwa kile unachojua hasa.",
    hi: "अभ्यास जो आपकी असली समझ के अनुसार बदलता है।",
    id: "Latihan yang menyesuaikan dengan apa yang benar-benar Anda kuasai.",
    tl: "Pagsasanay na umaangkop sa aktuwal mong alam.",
    de: "Übungen, die sich deinem wirklichen Wissen anpassen.",
    ja: "実際に分かっていることに合わせて変わる練習。",
    zh: "根据你真正掌握的内容调整的练习。",
    fa: "تمرینی که با آنچه واقعاً می‌دانید سازگار می‌شود.",
    ur: "مشق جو آپ کے اصلی علم کے مطابق بدلتا ہے۔",
    bn: "অনুশীলন যা আপনার প্রকৃত জ্ঞান অনুযায়ী মানিয়ে নেয়।",
  },
  "home.heroSub": {
    en: "OpenMind finds what you already know, practises what you do not, and remembers why you got it wrong. Your answers stay on this device, so it keeps working without a connection.",
    es: "OpenMind encuentra lo que ya sabes, practica lo que no, y recuerda por qué te equivocaste. Tus respuestas se quedan en este dispositivo, así que sigue funcionando sin conexión.",
    fr: "OpenMind repère ce que vous savez déjà, travaille ce que vous ne savez pas, et se souvient de vos erreurs. Vos réponses restent sur cet appareil : tout continue de fonctionner sans connexion.",
    pt: "O OpenMind encontra o que você já sabe, pratica o que não sabe e lembra por que você errou. As suas respostas ficam neste dispositivo, por isso continua a funcionar sem ligação.",
    ar: "يحدّد OpenMind ما تعرفه بالفعل، ويتدرّب على ما لا تعرفه، ويتذكّر سبب أخطائك. تبقى إجاباتك على هذا الجهاز، فيستمر بالعمل دون اتصال.",
    sw: "OpenMind hupata unayojua tayari, inafanya mazoizi kwa yale usiyoyajua, na hukumbuka sababu ulikosea. Majibu yako yanabaki kwenye kifaa hiki, hivyo inaendelea kufanya kazi bila mtandao.",
    hi: "OpenMind बताता है कि आपको क्या आता है, जो नहीं आता उसका अभ्यास कराता है, और याद रखता है कि आपने क्यों गलती की। आपके उत्तर इसी डिवाइस पर रहते हैं, इसलिए बिना इंटरनेट के भी चलता रहता है।",
    id: "OpenMind menemukan yang sudah Anda kuasai, melatih yang belum, dan mengingat mengapa Anda salah. Jawaban Anda tetap ada di perangkat ini, jadi tetap berjalan tanpa koneksi.",
    tl: "Kinukukula ng OpenMind ang alam mo na, nag drills sa hindi mo alam, at naaalala kung bakit ka nagkamali. Nasa device na ito ang iyong mga sagot, kaya gumagana pa rin kahit walang koneksyon.",
    de: "OpenMind findet, was du schon kannst, übt, was du nicht kannst, und merkt sich, warum du falsch lagst. Deine Antworten bleiben auf diesem Gerät – es läuft also auch ohne Verbindung weiter.",
    ja: "OpenMind は、すでにつかっていることを見つけ、わからないことを練習し、なぜ間違えたかを覚えていきます。解答はこの端末に残るため、接続がなくても使えます。",
    zh: "OpenMind 找出你已经掌握的内容，练习你还没掌握的部分，并记住你为什么答错。你的作答留在这台设备上，因此没有网络也能继续使用。",
    fa: "‏OpenMind آنچه را می‌یابد که می‌دانید، برای آنچه که نمی‌دانید تمرین می‌دهد، و به یاد می‌آورد چرا اشتباه کردید. پاسخ‌های شما روی همین دستگاه می‌ماند، بنابراین بدون اتصال هم کار می‌کند.",
    ur: "OpenMind بتا دیتا ہے کہ آپ کو کیا آتا ہے، جو نہیں آتا اس کا مشق کراتا ہے، اور یاد رکھتا ہے کہ آپ نے کیوں غلطی کی۔ آپ کے جوابات اسی ڈیوائس پر رہتے ہیں، اس لیے بغیر انٹرنیٹ کے بھی کام کرتا رہتا ہے۔",
    bn: "OpenMind আপনার যা জানা আছে তা খুঁজে বের করে, যা জানা নেই তার অনুশীলন করায়, এবং কেন ভুল করলেন তা মনে রাখে। আপনার উত্তর এই ডিভাইসেই থাকে, তাই ইন্টারনেট ছাড়াও চলতে থাকে।",
  },
  "brand.tagline": {
    en: "Free adaptive learning, on any device.",
    es: "Aprendizaje adaptativo y gratuito, en cualquier dispositivo.",
    fr: "Un apprentissage adaptatif et gratuit, sur n’importe quel appareil.",
    pt: "Aprendizagem adaptativa e gratuita, em qualquer dispositivo.",
    ar: "تعلّم تكيّفي مجاني، على أي جهاز.",
    sw: "Kujifunza kwa kuzoekana kwa bure, kwenye kifaa chochote.",
    hi: "मुफ़्त अनुकूली शिक्षा, किसी भी डिवाइस पर।",
    id: "Pembelajaran adaptif gratis, di perangkat apa pun.",
    tl: "Adaptive na pag-aaral, libre, sa kahit anong device.",
    de: "Kostenloses, anpassendes Lernen – auf jedem Gerät.",
    ja: "デバイスを選ばない無料の適応型学習。",
    zh: "免费的自适应学习，任何设备都能用。",
    fa: "یادگیری سازگار و رایگان، روی هر دستگاهی.",
    ur: "مفت اپنیٹ لیرننگ، کسی بھی ڈیوائس پر۔",
    bn: "বিনা খরচে অনুকূলী শেখা, যেকোনো ডিভাইসে।",
  },
  "home.offline": {
    en: "Graded on this device",
    es: "Corregido en este dispositivo",
    fr: "Corrigé sur cet appareil",
    pt: "Corrigido neste dispositivo",
    ar: "يُصحَّح على هذا الجهاز",
    sw: "Husahiliwa kwenye kifaa hiki",
    hi: "इसी डिवाइस पर जाँचा जाता है",
    id: "Dinilai di perangkat ini",
    tl: "Sinusuri sa device na ito",
    de: "Auf diesem Gerät ausgewertet",
    ja: "この端末で採点されます",
    zh: "在本设备上判分",
    fa: "تصحیح روی همین دستگاه",
    ur: "اسی ڈیوائس پر درجہ بندی ہوتی ہے",
    bn: "এই ডিভাইসেই যাচাই হয়",
  },
};

let src = fs.readFileSync(FILE, "utf8");

function dictSpan(code) {
  const head = new RegExp(`^(export )?const ${code}: Dict = \\{`, "m").exec(src);
  if (!head) throw new Error(`dictionary ${code} not found`);
  const end = src.indexOf("\n};", head.index);
  if (end < 0) throw new Error(`dictionary ${code} has no terminator`);
  return [head.index, end];
}

/** Every language must define every key, or a learner in that language silently
 *  falls back to English for the whole paragraph. Refuse before writing. */
const problems = [];
for (const code of LANGS) {
  for (const key of CLAIMS) {
    const v = VALUES[key][code];
    if (typeof v !== "string" || v.length === 0) problems.push(`${key}: no value for ${code}`);
  }
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

let replaced = 0;
let already = 0;
for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  let block = src.slice(from, to);
  for (const key of CLAIMS) {
    const re = new RegExp(`("${key.replace(".", "\\.")}"\\s*:\\s*)("(?:[^"\\\\]|\\\\.)*")`);
    const m = re.exec(block);
    if (!m) {
      problems.push(`${code}: ${key} not found`);
      continue;
    }
    if (m[2] === JSON.stringify(VALUES[key][code])) {
      already++;
      continue;
    }
    block = block.replace(re, `$1${JSON.stringify(VALUES[key][code])}`);
    replaced++;
  }
  src = src.slice(0, from) + block + src.slice(to);
}

if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

// Post-condition: no dictionary may still carry an old claim, and no claim may
// have been written into the wrong dictionary (the name-not-index trap).
for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  const block = src.slice(from, to);
  for (const key of CLAIMS) {
    if (!block.includes(`"${key}": ${JSON.stringify(VALUES[key][code])}`)) {
      problems.push(`${code}: ${key} did not take the new value`);
    }
  }
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

fs.writeFileSync(FILE, src);
console.log(
  `landing claims: ${replaced} value(s) replaced, ${already} already truthful, across ${LANGS.length} dictionaries`,
);
