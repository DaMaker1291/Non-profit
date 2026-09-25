// One-shot: the state-machine strings (where the learner is in the lifecycle).
// Insertion is anchored to the block's LAST `};`, never to the end of its line
// range — the range runs on to the next `const xx: Dict = {`, and for the final
// dictionary it runs past DICTS.
import fs from "node:fs";

const T = {
  "state.moving": {
    en: "Taking you to the right step", es: "Te llevamos al paso correcto", fr: "Nous vous emmenons à la bonne étape", pt: "Levando você ao passo certo",
    ar: "نأخذك إلى الخطوة الصحيحة", sw: "Tunakupeleka kwenye hatua sahihi", hi: "आपको सही चरण पर ले जा रहे हैं", id: "Mengarahkan ke langkah yang tepat",
    tl: "Dinadala ka sa tamang hakbang", de: "Wir bringen dich zum richtigen Schritt", ja: "適切なステップへ移動します", zh: "正在带你进入正确的步骤",
    fa: "شما را به گام درست می‌بریم", ur: "آپ کو صحیح مرحلے پر لے جا رہے ہیں", bn: "সঠিক ধাপে নিয়ে যাচ্ছি",
  },
  "state.resume": {
    en: "Continue where you left off", es: "Continúa donde lo dejaste", fr: "Reprenez où vous en étiez", pt: "Continue de onde parou",
    ar: "تابع من حيث توقفت", sw: "Endelea ulipoishia", hi: "जहाँ छोड़ा था वहीं से जारी रखें", id: "Lanjutkan dari yang tadi",
    tl: "Ituloy kung saan ka tumigil", de: "Mach dort weiter, wo du warst", ja: "続きから再開", zh: "从上次的地方继续",
    fa: "از همان‌جا ادامه دهید", ur: "جہاں چھوڑا تھا وہیں سے جاری رکھیں", bn: "যেখানে ছেড়েছিলেন সেখান থেকে চালিয়ে যান",
  },
  "state.newLearner": {
    en: "New here? Tell us where you study and we will build your plan.", es: "¿Nuevo? Dinos dónde estudias y crearemos tu plan.", fr: "Nouveau ? Dites-nous où vous étudiez et nous créerons votre plan.", pt: "Novo por aqui? Diga onde estuda e montamos seu plano.",
    ar: "جديد هنا؟ أخبرنا أين تدرس لنبني خطتك.", sw: "Mgeni? Tuambie unaposoma ili tujenge mpango wako.", hi: "नए हैं? बताइए कहाँ पढ़ते हैं, हम आपका प्लान बनाएँगे।", id: "Baru di sini? Beri tahu di mana kamu belajar, kami susun rencanamu.",
    tl: "Bago ka ba? Sabihin kung saan ka nag-aaral at gagawin namin ang plano mo.", de: "Neu hier? Sag uns, wo du lernst, und wir bauen deinen Plan.", ja: "はじめてですか？学んでいる場所を教えれば計画を作ります。", zh: "第一次来？告诉我们你在哪上学，我们来制定计划。",
    fa: "تازه‌وارد شده‌اید؟ بگویید کجا درس می‌خوانید تا برنامه بسازیم.", ur: "نئے ہیں؟ بتائیں کہاں پڑھتے ہیں، ہم منصوبہ بنائیں گے۔", bn: "নতুন এসেছেন? বলুন কোথায় পড়েন, আমরা পরিকল্পনা বানাব।",
  },
  "state.noProfile": {
    en: "You are signed in. Choose your country, course and subjects to begin.", es: "Has iniciado sesión. Elige tu país, curso y asignaturas para empezar.", fr: "Vous êtes connecté. Choisissez pays, parcours et matières pour commencer.", pt: "Você entrou. Escolha país, curso e matérias para começar.",
    ar: "لقد سجلت الدخول. اختر بلدك ومقررك وموادك للبدء.", sw: "Umeingia. Chagua nchi, kozi na masomo yako ili kuanza.", hi: "आप साइन इन हैं। शुरू करने के लिए देश, कोर्स और विषय चुनें।", id: "Kamu sudah masuk. Pilih negara, kursus dan mata pelajaranmu.",
    tl: "Naka-sign in ka na. Piliin ang bansa, kurso at mga asignatura.", de: "Du bist angemeldet. Wähle Land, Kurs und Fächer.", ja: "ログイン済みです。国・コース・科目を選んで始めましょう。", zh: "你已登录。请选择国家、课程和科目。",
    fa: "وارد شده‌اید. کشور، دوره و درس‌ها را انتخاب کنید.", ur: "آپ سائن ان ہیں۔ ملک، کورس اور مضامین چنیں۔", bn: "আপনি সাইন ইন করা আছেন। দেশ, কোর্স ও বিষয় বাছুন।",
  },
  "state.needsOnboarding": {
    en: "Your course and subjects are not set yet — that is what makes practice match your exam.", es: "Tu curso y asignaturas aún no están definidos: de eso depende que la práctica coincida con tu examen.", fr: "Votre parcours et vos matières ne sont pas encore définis — c'est ce qui aligne l'entraînement sur votre examen.", pt: "Seu curso e matérias ainda não estão definidos — é isso que faz a prática bater com a sua prova.",
    ar: "لم تحدد مقررك وموادك بعد — وبها تتوافق التدريبات مع امتحانك.", sw: "Kozi na masomo yako bado hayajawekwa — ndiyo yanayofanya mazoezi yalingane na mtihani wako.", hi: "आपका कोर्स और विषय तय नहीं हैं — इन्हीं से अभ्यास आपकी परीक्षा से मेल खाता है।", id: "Kursus dan mata pelajaranmu belum ditetapkan — itu yang membuat latihan sesuai ujianmu.",
    tl: "Hindi pa nakatakda ang kurso at asignatura mo — iyon ang dahilan kung bakit tugma ang practice sa exam mo.", de: "Kurs und Fächer fehlen noch — sie sorgen dafür, dass Übungen zu deiner Prüfung passen.", ja: "コースと科目が未設定です。設定すると演習が受験内容に合います。", zh: "你的课程和科目还没设置——这正是练习能否贴合考试的关键。",
    fa: "دوره و درس‌های شما ثبت نشده — همین باعث می‌شود تمرین با آزمون شما بخواند.", ur: "آپ کا کورس اور مضامین طے نہیں — اسی سے مشق امتحان کے مطابق ہوتی ہے۔", bn: "আপনার কোর্স ও বিষয় এখনো ঠিক হয়নি — এটাই অনুশীলনকে পরীক্ষার সঙ্গে মেলায়।",
  },
  "state.needsDiagnostic": {
    en: "Before we recommend work, we need to see what you already know. It is short, and it is not a test.", es: "Antes de recomendar trabajo, necesitamos ver qué ya sabes. Es corto y no es un examen.", fr: "Avant de recommander du travail, nous devons voir ce que vous savez déjà. C'est court, et ce n'est pas un examen.", pt: "Antes de recomendar trabalho, precisamos ver o que você já sabe. É curto e não é uma prova.",
    ar: "قبل أن نرشّح لك عملًا، علينا أن نرى ما تعرفه أصلًا. الأمر قصير وليس امتحانًا.", sw: "Kabla ya kupendekeza kazi, tunahitaji kuona unachokijua. Ni kifupi, na si mtihani.", hi: "काम सुझाने से पहले हमें देखना है कि आप क्या जानते हैं। यह छोटा है और परीक्षा नहीं है।", id: "Sebelum menyarankan pekerjaan, kami perlu tahu apa yang sudah kamu kuasai. Singkat, dan bukan ujian.",
    tl: "Bago magrekomenda ng gawain, kailangan naming makita ang alam mo na. Maikli ito, at hindi ito exam.", de: "Bevor wir Aufgaben empfehlen, müssen wir sehen, was du schon kannst. Kurz — und kein Test.", ja: "次にやることを勧める前に、すでに分かっていることを見せてください。短時間で、テストではありません。", zh: "在推荐任务之前，我们需要看看你已经会什么。很短，不是考试。",
    fa: "پیش از پیشنهاد کار، باید ببینیم چه می‌دانید. کوتاه است و آزمون نیست.", ur: "کام تجویز کرنے سے پہلے ہمیں دیکھنا ہے کہ آپ کیا جانتے ہیں۔ مختصر ہے، امتحان نہیں۔", bn: "কাজের সুপারিশ করার আগে দেখতে হবে আপনি কী জানেন। সংক্ষিপ্ত, এবং এটি পরীক্ষা নয়।",
  },
  "state.ready": {
    en: "You are set up. Home shows your next step.", es: "Todo listo. Inicio muestra tu siguiente paso.", fr: "Tout est prêt. L'accueil affiche votre prochaine étape.", pt: "Tudo pronto. O início mostra seu próximo passo.",
    ar: "كل شيء جاهز. الرئيسية تُظهر خطوتك التالية.", sw: "Uko tayari. Mwanzo unaonyesha hatua yako inayofuata.", hi: "सब तैयार है। होम आपका अगला कदम दिखाता है।", id: "Sudah siap. Beranda menampilkan langkah berikutnya.",
    tl: "Ayos na. Ipinapakita ng Home ang susunod na hakbang.", de: "Alles bereit. Die Startseite zeigt deinen nächsten Schritt.", ja: "準備完了。ホームに次のステップが出ます。", zh: "已准备好。首页显示你的下一步。",
    fa: "آماده‌اید. خانه گام بعدی را نشان می‌دهد.", ur: "سب تیار ہے۔ ہوم اگلا قدم دکھاتا ہے۔", bn: "সব প্রস্তুত। হোম পরের ধাপ দেখায়।",
  },
  "state.signInSub": {
    en: "Your saved work is on your account", es: "Tu trabajo guardado está en tu cuenta", fr: "Votre travail enregistré est sur votre compte", pt: "Seu trabalho salvo está na sua conta",
    ar: "عملك المحفوظ في حسابك", sw: "Kazi yako iliyohifadhiwa iko kwenye akaunti yako", hi: "आपका सहेजा काम आपके खाते में है", id: "Pekerjaan tersimpanmu ada di akunmu",
    tl: "Nasa account mo ang naka-save na gawain", de: "Deine gespeicherte Arbeit liegt in deinem Konto", ja: "保存した学習はアカウントにあります", zh: "你保存的学习记录在账户里",
    fa: "کار ذخیره‌شده شما در حسابتان است", ur: "آپ کا محفوظ کام آپ کے اکاؤنٹ میں ہے", bn: "আপনার সংরক্ষিত কাজ অ্যাকাউন্টে আছে",
  },
};

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];
const file = "lib/i18n.ts";
const lines = fs.readFileSync(file, "utf8").split("\n");
const declRe = /^(?:export )?const (\w+): Dict = \{$/;

const decls = [];
lines.forEach((l, i) => {
  const m = l.match(declRe);
  if (m) decls.push({ lang: m[1], start: i });
});
decls.forEach((d, i) => (d.end = i + 1 < decls.length ? decls[i + 1].start : lines.length));
if (decls.length !== LANGS.length) throw new Error(`expected ${LANGS.length} dictionaries, found ${decls.length}`);

// A dictionary's body ends at the LAST `};` before the next TOP-LEVEL
// declaration. Using "the last `};` in the line range" is wrong for the final
// dictionary: its range runs on through LANGS and DICTS, so the anchor lands
// inside the DICTS registry and the keys become stray properties of it.
function closeBrace(block) {
  const nextTopLevel = block.findIndex((l, idx) => idx > 0 && /^(export )?(const|function|interface|type) \w/.test(l) && !/: Dict = \{$/.test(l));
  const limit = nextTopLevel < 0 ? block.length : nextTopLevel;
  let close = -1;
  for (let j = limit - 1; j >= 0; j--) {
    if (/^\s*};$/.test(block[j])) { close = j; break; }
  }
  return close;
}

let added = 0;
for (let i = decls.length - 1; i >= 0; i--) {
  const { lang, start, end } = decls[i];
  const block = lines.slice(start, end);
  const blockText = block.join("\n");
  const missing = Object.entries(T).filter(([key]) => !blockText.includes(`"${key}":`));
  if (!missing.length) continue;
  const close = closeBrace(block);
  if (close < 0) throw new Error(`no closing brace for ${lang}`);
  const inserted = missing.map(([key, byLang]) => `  "${key}": ${JSON.stringify(byLang[lang] ?? byLang.en)},`);
  block.splice(close, 0, ...inserted);
  added += inserted.length;
  lines.splice(start, end - start, ...block);
}

fs.writeFileSync(file, lines.join("\n"), "utf8");
console.log(`i18n state: +${added} strings (${Object.keys(T).length} keys × ${LANGS.length} languages)`);
