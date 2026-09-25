// ─────────────────────────────────────────────────────────────────────────────
// One-shot i18n seed: the account page's "join a class" keys, all 15 languages.
// Same convention as i18n-teacher.mjs. Run: node scripts/i18n-account-class.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "fs";

const TRANSLATIONS = {
  "acct.class": {
    en: "Join a class",
    es: "Unirse a una clase",
    fr: "Rejoindre une classe",
    pt: "Entrar numa turma",
    ar: "الانضمام إلى صف",
    sw: "Jiunge na darasa",
    hi: "कक्षा में शामिल हों",
    id: "Gabung kelas",
    tl: "Sumali sa klase",
    de: "Einer Klasse beitreten",
    ja: "クラスに参加",
    zh: "加入班级",
    bn: "একটি শ্রেণিতে যোগ দিন",
    fa: "به یک کلاس بپیوندید",
    ur: "کلاس میں شامل ہوں",
  },
  "acct.classNote": {
    en: "Enter the code your teacher gave you. Your measured work (answers, accuracy, misconceptions) then appears on their roster — identified by your handle, never your private key.",
    es: "Introduce el código que te dio tu profesor. Tu trabajo medido (respuestas, precisión, concepciones erróneas) aparecerá en su lista — identificado por tu alias, nunca por tu clave privada.",
    fr: "Saisissez le code que votre professeur vous a donné. Votre travail mesuré (réponses, précision, idées fausses) apparaîtra sur sa liste — identifié par votre pseudo, jamais par votre clé privée.",
    pt: "Introduza o código que o seu professor lhe deu. O seu trabalho medido (respostas, precisão, conceções erradas) aparecerá na sua lista — identificado pelo seu pseudónimo, nunca pela sua chave privada.",
    ar: "أدخل الرمز الذي أعطك إياه معلمك. سيظهر عملك المُقاس (الإجابات، الدقة، المفاهيم الخاطئة) في قائمته — معرّفاً باسمك المستعار، وليس بمفتاحك الخاص أبداً.",
    sw: "Weka msimbo walokupa mwalimu wako. Kazi yako iliyopimwa (majibu, usahihi, dhana zisizo sahihi) itaonekana kwenye orodha yao — kwa jina lako la utambulisho, si kwa funguo yako ya faragha.",
    hi: "अपने शिक्षक द्वारा दिया गया कोड दर्ज करें। आपका मापा गया काम (उत्तर, सटीकता, गलत धारणाएँ) उनकी सूची में दिखेगा — आपके हैंडल से पहचाना गया, कभी भी आपकी निजी कुंजी से नही।",
    id: "Masukkan kode yang diberikan guru Anda. Pekerjaan terukur Anda (jawaban, akurasi, miskonsepsi) akan muncul di daftar mereka — diidentifikasi dengan nama panggilan Anda, bukan kunci pribadi Anda.",
    tl: "Ilagay ang code na ibinigay ng iyong guro. Ang iyong nasukat na gawain (mga sagot, kawastuhan, maling pagkaunawa) ay lalabas sa kanilang listahan — kinikilala sa iyong handle, hindi kailanman sa iyong pribadong susi.",
    de: "Geben Sie den Code ein, den Ihre Lehrkraft Ihnen gegeben hat. Ihre gemessene Arbeit (Antworten, Genauigkeit, Missverständnisse) erscheint auf deren Liste — identifiziert über Ihren Namen, niemals über Ihren privaten Schlüssel.",
    ja: "先生から渡されたコードを入力してください。あなたの測定された学習（回答・正確さ・つまずき）が先生の名簿に表示されます — ハンドル名で識別され、秘密の鍵が共有されることはありません。",
    zh: "输入老师给你的代码。你的学习测量结果（答案、准确率、易错点）会显示在他们的名册上 — 仅以你的昵称标识，绝不会泄露你的私人密钥。",
    bn: "আপনার শিক্ষক প্রদত্ত কোডটি লিখুন। আপনার পরিমাপ করা কাজ (উত্তর, নির্ভুলতা, ভুল ধারণা) তাঁর তালিকায় দেখা যাবে — আপনার হ্যান্ডেল দিয়ে চিহ্নিত, কখনও আপনার ব্যক্তিগত কী দিয়ে নয়।",
    fa: "کدی را که معلمتان به شما داده وارد کنید. کار اندازه‌گیری‌شدهٔ شما (پاسخ‌ها، دقت، برداشت‌های نادرست) در فهرست او ظاهر می‌شود — با نام کاربری شما شناسایی می‌شود، نه کلید خصوصی‌تان.",
    ur: "اپنے استاد کا دیا ہوا کوڈ درج کریں۔ آپ کا ناپا گیا کام (جوابات، درستگی، غلط فہمیاں) ان کی فہرست میں نظر آئے گا — آپ کے ہینڈل سے شناخت، کبھی بھی آپ کی نجی کی سے نہیں۔",
  },
  "acct.joined": {
    en: "Joined — your teacher can now see your measured work.",
    es: "Te uniste — tu profesor ya puede ver tu trabajo medido.",
    fr: "Vous avez rejoint la classe — votre professeur peut maintenant voir votre travail mesuré.",
    pt: "Entrou — o seu professor já pode ver o seu trabalho medido.",
    ar: "لقد انضممت — يستطيع معلمك الآن رؤية عملك المُقاس.",
    sw: "Umejiunga — mwalimu wako sasa anaweza kuona kazi yako iliyopimwa.",
    hi: "शामिल हो गए — आपका शिक्षक अब आपका मापा गया काम देख सकता है।",
    id: "Berhasil bergabung — guru Anda kini dapat melihat pekerjaan terukur Anda.",
    tl: "Sumali ka na — makikita na ng iyong guro ang iyong nasukat na gawain.",
    de: "Beigetreten — Ihre Lehrkraft kann jetzt Ihre gemessene Arbeit sehen.",
    ja: "参加しました — 先生があなたの測定された学習を見られるようになりました。",
    zh: "已加入 — 你的老师现在可以看到你的学习测量结果。",
    bn: "যোগ দিয়েছেন — আপনার শিক্ষক এখন আপনার পরিমাপ করা কাজ দেখতে পাবেন।",
    fa: "ملحق شدید — معلم شما اکنون می‌تواند کار اندازه‌گیری‌شدهٔ شما را ببیند.",
    ur: "شامل ہو گئے — آپ کا استاد اب آپ کا ناپا گیا کام دیکھ سکتا ہے۔",
  },
};

const src = readFileSync("lib/i18n.ts", "utf8");
const lines = src.split("\n");

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
insertions.sort((a, b) => b.end - a.end);
for (const ins of insertions) lines.splice(ins.end, 0, ins.line);

writeFileSync("lib/i18n.ts", lines.join("\n"));
console.log(`inserted ${insertions.length} lines (${Object.keys(TRANSLATIONS).length} keys × 15 dictionaries)`);
