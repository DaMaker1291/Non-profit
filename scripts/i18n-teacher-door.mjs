// One-shot i18n: THE TEACHER'S OWN DOOR, AND THE GUEST'S ONE-STEP UPGRADE.
//
// Six strings, all fifteen dictionaries, authored here rather than left to a
// fallback. Follows the convention of the other one-shot scripts in this
// directory (scripts/i18n-room-focus.mjs is the compact one): insert beside a
// sibling key that already exists in every dictionary, authored BY HAND, one
// block per dictionary, and REFUSE to run if the anchor count is not the
// language count.
//
// The dictionaries in lib/i18n.ts are NOT in `LANGS` order — the `fa`/`ur`
// pair is swapped relative to the language list — so `TEXTS` below is in the
// FILE's order (en, es, fr, pt, ar, sw, hi, id, tl, de, ja, zh, fa, ur, bn),
// located by their own anchor lines rather than by index. Positional pairing is
// how an earlier one-shot wrote Urdu into German (see scripts/i18n-feedback.mjs,
// where that was caught).
//
// Run: node scripts/i18n-teacher-door.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const TEACH_ANCHOR = '"teach.proved"';
const ACCT_ANCHOR = '"acct.classNote"';

/** [language, file order] — one row per dictionary, in the file's order. */
const TEXTS = [
  {
    lang: "en",
    teachTitle: "Start with a teacher account",
    teachBody: "A teacher account holds your classes, not your learning. You are not put through a learner's setup or a baseline diagnostic — create a class, share its join code, and see what the class has actually done.",
    teachCreate: "Create a teacher account",
    teachStudent: "Here to learn instead?",
    guestLead: "Your work is saved on this device and held by OpenMind. Add an account and it comes with you — the same progress, the same record, and you can sign in on any device.",
    attach: "Add an account",
  },
  {
    lang: "es",
    teachTitle: "Empieza con una cuenta de docente",
    teachBody: "Una cuenta de docente contiene tus clases, no tu aprendizaje. No pasas por la configuración del alumnado ni por un diagnóstico inicial: crea una clase, comparte su código y mira lo que la clase ha hecho de verdad.",
    teachCreate: "Crear una cuenta de docente",
    teachStudent: "¿Vienes a aprender?",
    guestLead: "Tu trabajo está guardado en este dispositivo y lo conserva OpenMind. Añade una cuenta y se va contigo: el mismo progreso, el mismo historial, y podrás entrar desde cualquier dispositivo.",
    attach: "Añadir una cuenta",
  },
  {
    lang: "fr",
    teachTitle: "Commencez par un compte enseignant",
    teachBody: "Un compte enseignant contient vos classes, pas votre propre apprentissage. Vous ne passez ni par la configuration d'un élève ni par un diagnostic initial : créez une classe, partagez son code et voyez ce que la classe a réellement fait.",
    teachCreate: "Créer un compte enseignant",
    teachStudent: "Vous venez plutôt pour apprendre ?",
    guestLead: "Votre travail est enregistré sur cet appareil et conservé par OpenMind. Ajoutez un compte et il vous suit : la même progression, le même historique, et vous pourrez vous connecter depuis n'importe quel appareil.",
    attach: "Ajouter un compte",
  },
  {
    lang: "pt",
    teachTitle: "Comece com uma conta de professor",
    teachBody: "Uma conta de professor guarda as suas turmas, não a sua aprendizagem. Não passa pela configuração de um aluno nem por um diagnóstico inicial: crie uma turma, partilhe o código e veja o que a turma fez de facto.",
    teachCreate: "Criar uma conta de professor",
    teachStudent: "Veio antes para aprender?",
    guestLead: "O seu trabalho está guardado neste aparelho e fica com o OpenMind. Adicione uma conta e ele vai consigo — o mesmo progresso, o mesmo registo, e pode entrar em qualquer aparelho.",
    attach: "Adicionar uma conta",
  },
  {
    lang: "ar",
    teachTitle: "ابدأ بحساب معلّم",
    teachBody: "حساب المعلّم يحمل صفوفك، لا تعلّمك. لن تمرّ بإعداد المتعلّم ولا بتشخيص أوّلي — أنشئ صفًّا، وشارك رمز الانضمام، وانظر ما أنجزه الصف فعليًّا.",
    teachCreate: "أنشئ حساب معلّم",
    teachStudent: "هل جئت للتعلّم بدلًا من ذلك؟",
    guestLead: "عملك محفوظ على هذا الجهاز ويحتفظ به OpenMind. أضف حسابًا لينتقل معك — التقدّم نفسه، والسجل نفسه، ويمكنك تسجيل الدخول من أي جهاز.",
    attach: "أضف حسابًا",
  },
  {
    lang: "sw",
    teachTitle: "Anza na akaunti ya mwalimu",
    teachBody: "Akaunti ya mwalimu hubeba madarasa yako, si masomo yako. Hupitii usanidi wa mwanafunzi wala uchunguzi wa awali — tengeneza darasa, shiriki msimbo wake, na uone kile darasa limefanya.",
    teachCreate: "Fungua akaunti ya mwalimu",
    teachStudent: "Umekuja kujifunza badala yake?",
    guestLead: "Kazi yako imehifadhiwa kwenye kifaa hiki na OpenMind anaitunza. Ongeza akaunti ikufuate — maendeleo yale yale, kumbukumbu ile ile, na unaweza kuingia kwenye kifaa chochote.",
    attach: "Ongeza akaunti",
  },
  {
    lang: "hi",
    teachTitle: "शिक्षक खाते से शुरू करें",
    teachBody: "शिक्षक खाते में आपकी कक्षाएँ रहती हैं, आपकी पढ़ाई नहीं। आपको शिक्षार्थी की सेटअप प्रक्रिया या आरंभिक निदान से नहीं गुज़रना पड़ेगा — कक्षा बनाएँ, उसका जॉइन कोड साझा करें, और देखें कि कक्षा ने वास्तव में क्या किया।",
    teachCreate: "शिक्षक खाता बनाएँ",
    teachStudent: "क्या आप सीखने के लिए आए हैं?",
    guestLead: "आपका काम इस डिवाइस पर सहेजा गया है और OpenMind इसे रखता है। खाता जोड़िए और यह आपके साथ चला जाएगा — वही प्रगति, वही रिकॉर्ड, और आप किसी भी डिवाइस से साइन इन कर सकेंगे।",
    attach: "खाता जोड़ें",
  },
  {
    lang: "id",
    teachTitle: "Mulai dengan akun guru",
    teachBody: "Akun guru menyimpan kelas Anda, bukan pembelajaran Anda. Anda tidak melewati penyiapan pelajar atau diagnosis awal — buat kelas, bagikan kodenya, dan lihat apa yang benar-benar dikerjakan kelas.",
    teachCreate: "Buat akun guru",
    teachStudent: "Ingin belajar sebagai gantinya?",
    guestLead: "Pekerjaanmu tersimpan di perangkat ini dan disimpan oleh OpenMind. Tambahkan akun dan semuanya ikut berpindah — kemajuan yang sama, catatan yang sama, dan kamu bisa masuk dari perangkat mana pun.",
    attach: "Tambahkan akun",
  },
  {
    lang: "tl",
    teachTitle: "Magsimula sa account ng guro",
    teachBody: "Ang account ng guro ay may hawak ng iyong mga klase, hindi ng iyong pag-aaral. Hindi ka dadaan sa setup ng mag-aaral o paunang diagnostic — gumawa ng klase, ibahagi ang code nito, at tingnan ang tunay na nagawa ng klase.",
    teachCreate: "Gumawa ng account ng guro",
    teachStudent: "Narito ka ba para mag-aral?",
    guestLead: "Naka-save ang gawain mo sa device na ito at iniingatan ito ng OpenMind. Magdagdag ng account at sasama ito sa iyo — parehong progreso, parehong rekord, at makakapasok ka sa anumang device.",
    attach: "Magdagdag ng account",
  },
  {
    lang: "de",
    teachTitle: "Beginne mit einem Lehrkonto",
    teachBody: "Ein Lehrkonto enthält Ihre Klassen, nicht Ihr eigenes Lernen. Sie durchlaufen weder die Einrichtung für Lernende noch eine Eingangsdiagnose — legen Sie eine Klasse an, teilen Sie ihren Beitrittscode und sehen Sie, was die Klasse tatsächlich geleistet hat.",
    teachCreate: "Lehrkonto erstellen",
    teachStudent: "Möchtest du stattdessen lernen?",
    guestLead: "Deine Arbeit ist auf diesem Gerät gespeichert und wird von OpenMind geführt. Füge ein Konto hinzu und sie kommt mit — derselbe Fortschritt, dieselbe Aufzeichnung, und du kannst dich auf jedem Gerät anmelden.",
    attach: "Konto hinzufügen",
  },
  {
    lang: "ja",
    teachTitle: "教師アカウントから始める",
    teachBody: "教師アカウントには授業が入ります。ご自身の学習は入りません。学習者向けの設定や初回診断は不要です。クラスを作成し、参加コードを共有して、クラスが実際に何をしたかを見てください。",
    teachCreate: "教師アカウントを作成",
    teachStudent: "むしろ学習したいですか？",
    guestLead: "あなたの学習はこの端末に保存され、OpenMind が保管しています。アカウントを追加すればそのまま引き継げます。進み具合も記録も同じで、どの端末からでもサインインできます。",
    attach: "アカウントを追加",
  },
  {
    lang: "zh",
    teachTitle: "从教师账户开始",
    teachBody: "教师账户保存的是你的班级，而不是你的学习。你不会经过学生设置或基础诊断——创建班级、分享加入码，查看班级实际完成了什么。",
    teachCreate: "创建教师账户",
    teachStudent: "更想学习吗？",
    guestLead: "你的学习记录保存在这台设备上，并由 OpenMind 保管。添加账户后它会随你而去——同样的进度、同样的记录，而且你可以在任何设备上登录。",
    attach: "添加账户",
  },
  {
    lang: "fa",
    teachTitle: "با حساب معلم شروع کنید",
    teachBody: "حساب معلم کلاس‌های شما را نگه می‌دارد، نه یادگیری شما را. از راه‌اندازی مخصوص دانش‌آموز یا سنجش اولیه نمی‌گذرید — یک کلاس بسازید، کد عضویت آن را به اشتراک بگذارید و ببینید کلاس واقعاً چه کرده است.",
    teachCreate: "ساخت حساب معلم",
    teachStudent: "به‌جای آن آمده‌اید یاد بگیرید؟",
    guestLead: "کار شما روی همین دستگاه ذخیره شده و OpenMind آن را نگه می‌دارد. یک حساب اضافه کنید تا با شما بیاید — همان پیشرفت، همان سابقه، و می‌توانید از هر دستگاهی وارد شوید.",
    attach: "افزودن حساب",
  },
  {
    lang: "ur",
    teachTitle: "استاد اکاؤنٹ سے شروع کریں",
    teachBody: "استاد اکاؤنٹ آپ کی کلاسوں کا ہوتا ہے، آپ کی پڑھائی کا نہیں۔ آپ کو سیکھنے والے کی ترتیب یا ابتدائی جانچ سے نہیں گزارا جائے گا — کلاس بنائیں، اس کا شمولیتی کوڈ شیئر کریں، اور دیکھیں کہ کلاس نے واقعی کیا کیا۔",
    teachCreate: "استاد اکاؤنٹ بنائیں",
    teachStudent: "کیا آپ سیکھنے آئے ہیں؟",
    guestLead: "آپ کا کام اسی آلے پر محفوظ ہے اور OpenMind اسے سنبھالے ہوئے ہے۔ اکاؤنٹ شامل کریں تو یہ آپ کے ساتھ چلا جائے گا — وہی پیش رفت، وہی ریکارڈ، اور آپ کسی بھی آلے سے سائن اِن کر سکیں گے۔",
    attach: "اکاؤنٹ شامل کریں",
  },
  {
    lang: "bn",
    teachTitle: "শিক্ষক অ্যাকাউন্ট দিয়ে শুরু করুন",
    teachBody: "শিক্ষক অ্যাকাউন্টে থাকে আপনার ক্লাস, আপনার শেখা নয়। শিক্ষার্থীর সেটআপ বা প্রাথমিক নির্ণয়ের মধ্য দিয়ে যেতে হবে না — একটি ক্লাস খুলুন, তার জয়েন কোড শেয়ার করুন, আর দেখুন ক্লাসটি সত্যিই কী করেছে।",
    teachCreate: "শিক্ষক অ্যাকাউন্ট খুলুন",
    teachStudent: "বরং শিখতে এসেছেন?",
    guestLead: "আপনার কাজ এই ডিভাইসে সংরক্ষিত আছে এবং OpenMind তা রেখে দেয়। অ্যাকাউন্ট যোগ করুন, তা আপনার সঙ্গে যাবে — একই অগ্রগতি, একই রেকর্ড, আর আপনি যেকোনো ডিভাইস থেকে সাইন ইন করতে পারবেন।",
    attach: "অ্যাকাউন্ট যোগ করুন",
  },
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"teach.entryTitle"')) {
  console.log("teacher-door strings already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const teachLines = [];
const acctLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(TEACH_ANCHOR)) teachLines.push(i);
  if (lines[i].includes(ACCT_ANCHOR)) acctLines.push(i);
}
if (teachLines.length !== TEXTS.length || acctLines.length !== TEXTS.length) {
  throw new Error(
    `expected ${TEXTS.length} of each anchor, found teach=${teachLines.length} acct=${acctLines.length} — refusing to guess which dictionary is which`,
  );
}

const escape = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
/** `[lineIndex, text]` pairs, inserted bottom-up so earlier indices stay valid. */
const inserts = [];
for (let i = 0; i < TEXTS.length; i++) {
  const row = TEXTS[i];
  const indent = lines[teachLines[i]].match(/^\s*/)[0];
  inserts.push(
    [teachLines[i] + 1, `${indent}"teach.entryTitle": "${escape(row.teachTitle)}",`],
    [teachLines[i] + 1, `${indent}"teach.entryBody": "${escape(row.teachBody)}",`],
    [teachLines[i] + 1, `${indent}"teach.entryCreate": "${escape(row.teachCreate)}",`],
    [teachLines[i] + 1, `${indent}"teach.entryStudent": "${escape(row.teachStudent)}",`],
    [acctLines[i] + 1, `${indent}"acct.guestLead": "${escape(row.guestLead)}",`],
    [acctLines[i] + 1, `${indent}"acct.attach": "${escape(row.attach)}",`],
  );
  console.log(`${row.lang}: ${4 + 2} strings`);
}
// Same anchor line, four keys: reverse insertion order puts them back in the
// order they are written above, because each splice lands at the same index.
inserts.sort((a, b) => b[0] - a[0]);
for (const [at, text] of inserts) lines.splice(at, 0, text);

const out = lines.join("\n");
fs.writeFileSync(FILE, out);
console.log(`\ndone — ${Object.keys(TEXTS[0]).length - 1} keys × ${TEXTS.length} dictionaries written to ${FILE}`);
