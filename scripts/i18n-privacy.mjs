// One-shot i18n: PRIVACY + ONBOARDING-GOAL strings (§3, §23).
//
// The account page gained a real privacy section (export + the right to
// erasure), and onboarding gained the student/teacher choice and the goals
// step. Every string either surface can show is authored in all 15
// dictionaries here, following the convention of the other one-shot scripts
// (i18n-assignments.mjs, i18n-accounts.mjs): insert beside the sibling anchor
// in each dictionary by hand, because a runtime English fallback would ship
// half-English interfaces in fourteen languages.
//
// Run: node scripts/i18n-privacy.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ACCT_ANCHOR = '"acct.lead"';   // last acct.* key in every dictionary
const ONB_ANCHOR = '"intent.life"';  // the onboarding intent block in every dictionary

const ACCT_KEYS = [
  "acct.privacyTitle", "acct.privacyNote", "acct.exportBtn",
  "acct.eraseReveal", "acct.eraseWarn", "acct.eraseWordLabel",
  "acct.eraseBtn", "acct.eraseCancel",
];
const ONB_KEYS = [
  "onb.roleStudent", "onb.roleTeacher", "onb.goalStep", "onb.goalLead",
  "onb.intentLabel", "onb.goalLabel", "onb.goalNote", "onb.goalSkip",
];

const TEXTS = [
  ["en", [
    "Your data",
    "Everything OpenMind has recorded about your learning belongs to you: download it, or erase it from this deployment entirely.",
    "Download my data",
    "Erase my learning record…",
    "This permanently deletes your profile, your evidence ledger and your class memberships on this deployment. It cannot be undone. Your account keeps its email and password, but the learning history is gone.",
    "Type ERASE to confirm",
    "Erase everything",
    "Keep my record",
    "I'm a student",
    "I'm a teacher",
    "Your goal",
    "What are you working towards? OpenMind shapes your daily plan around it.",
    "Main reason",
    "In your own words (optional)",
    "e.g. Pass GCSE Higher Maths in June",
    "You can change this any time. Without a goal, the plan simply follows your evidence.",
    "No particular goal",
  ]],
  ["es", [
    "Tus datos",
    "Todo lo que OpenMind ha registrado sobre tu aprendizaje es tuyo: descárgalo o bórralo por completo de este despliegue.",
    "Descargar mis datos",
    "Borrar mi historial de aprendizaje…",
    "Esto elimina permanentemente tu perfil, tu registro de evidencias y tu pertenencia a clases en este despliegue. No se puede deshacer. Tu cuenta conserva su correo y contraseña, pero el historial de aprendizaje desaparece.",
    "Escribe ERASE para confirmar",
    "Borrar todo",
    "Conservar mi historial",
    "Soy estudiante",
    "Soy profesor/a",
    "Tu objetivo",
    "¿Hacia qué trabajas? OpenMind adapta tu plan diario a ello.",
    "Motivo principal",
    "Con tus propias palabras (opcional)",
    "p. ej. Aprobar GCSE Higher Maths en junio",
    "Puedes cambiarlo cuando quieras. Sin objetivo, el plan simplemente sigue tu evidencia.",
    "Ningún objetivo en particular",
  ]],
  ["fr", [
    "Vos données",
    "Tout ce qu'OpenMind a enregistré sur votre apprentissage vous appartient : téléchargez-le, ou effacez-le entièrement de ce déploiement.",
    "Télécharger mes données",
    "Effacer mon historique d'apprentissage…",
    "Cette action supprime définitivement votre profil, votre registre de preuves et vos adhésions de classe sur ce déploiement. Elle est irréversible. Votre compte garde son e-mail et son mot de passe, mais l'historique d'apprentissage disparaît.",
    "Tapez ERASE pour confirmer",
    "Tout effacer",
    "Garder mon historique",
    "Je suis élève",
    "Je suis enseignant(e)",
    "Votre objectif",
    "Vers quoi travaillez-vous ? OpenMind adapte votre plan quotidien en conséquence.",
    "Raison principale",
    "Avec vos propres mots (facultatif)",
    "ex. Réussir GCSE Higher Maths en juin",
    "Modifiable à tout moment. Sans objectif, le plan suit simplement vos preuves.",
    "Aucun objectif particulier",
  ]],
  ["pt", [
    "Seus dados",
    "Tudo o que o OpenMind registrou sobre o seu aprendizado é seu: baixe-o ou apague-o por completo desta implantação.",
    "Baixar meus dados",
    "Apagar meu histórico de aprendizado…",
    "Isso apaga permanentemente o seu perfil, o seu registro de evidências e a sua participação em turmas nesta implantação. Não pode ser desfeito. A sua conta mantém o e-mail e a senha, mas o histórico de aprendizado desaparece.",
    "Digite ERASE para confirmar",
    "Apagar tudo",
    "Manter meu histórico",
    "Sou estudante",
    "Sou professor(a)",
    "Seu objetivo",
    "Para o que você está se preparando? O OpenMind molda o seu plano diário em volta disso.",
    "Motivo principal",
    "Com as suas próprias palavras (opcional)",
    "ex. Passar em GCSE Higher Maths em junho",
    "Você pode mudar isso quando quiser. Sem um objetivo, o plano simplesmente segue as suas evidências.",
    "Nenhum objetivo em particular",
  ]],
  ["ar", [
    "بياناتك",
    "كل ما سجّله OpenMind عن تعلّمك ملك لك: نزّله، أو امحُه تمامًا من هذا النشر.",
    "تنزيل بياناتي",
    "محو سجل تعلّمي…",
    "سيؤدي هذا إلى حذف ملفك الشخصي وسجل الأدلة وعضويتك في الصفوف من هذا النشر نهائيًا. لا يمكن التراجع عنه. يحتفظ حسابك بالبريد وكلمة المرور، لكن يزول سجل التعلم.",
    "اكتب ERASE للتأكيد",
    "محو كل شيء",
    "الاحتفاظ بسجلي",
    "أنا طالب",
    "أنا معلم",
    "هدفك",
    "إلى ماذا تعمل؟ يكيّف OpenMind خطتك اليومية حوله.",
    "السبب الرئيسي",
    "بكلماتك أنت (اختياري)",
    "مثال: النجاح في GCSE Higher Maths في يونيو",
    "يمكنك تغييره في أي وقت. بلا هدف، تتبع الخطة أدلتك ببساطة.",
    "لا هدف بعينه",
  ]],
  ["sw", [
    "Data zako",
    "Kila kitu OpenMind imerekodi kuhusu kujifunza kwako ni chako: pakakiti, au kifute kabisa kutoka kwenye mfumo huu.",
    "Pakua data zangu",
    "Futa rekodi yangu ya kujifunza…",
    "Hii hufuta kabisa wasifu wako, rekodi yako ya ushahidi na uanachama wako wa madarasa kwenye mfumo huu. Haiwezi kurejeshwa. Akaunti yako inabaki na barua pepe na nenosiri, lakini rekodi ya kujifunza inapotea.",
    "Andika ERASE kuthibitisha",
    "Futa yote",
    "Bakisha rekodi yangu",
    "Mimi ni mwanafunzi",
    "Mimi ni mwalimu",
    "Lengo lako",
    "Unafanya kazi kuelekea wapi? OpenMind hutengeneza mpango wako wa kila siku kuzunguka hilo.",
    "Sababu kuu",
    "Kwa maneno yako mwenyewe (hiari)",
    "mf. Kufaulu GCSE Higher Maths mwezi wa Juni",
    "Unaweza kubadilisha hii wakati wowote. Bila lengo, mpango unafuata ushahidi wako tu.",
    "Hakuna lengo maalum",
  ]],
  ["hi", [
    "आपका डेटा",
    "आपकी पढ़ाई से जुड़ा सब कुछ OpenMind ने आपके लिए दर्ज किया है: उसे डाउनलोड करें, या इस डिप्लॉयमेंट से पूरी तरह मिटा दें।",
    "मेरा डेटा डाउनलोड करें",
    "मेरा लर्निंग रिकॉर्ड मिटाएँ…",
    "इससे आपकी प्रोफ़ाइल, आपका साक्ष्य रिकॉर्ड और कक्षाओं में आपकी सदस्यता इस डिप्लॉयमेंट से स्थायी रूप से मिट जाएगी। यह पूर्ववत नहीं किया जा सकता। आपके खाते का ईमेल और पासवर्ड बना रहेगा, पर लर्निंग इतिहास चला जाएगा।",
    "पुष्टि के लिए ERASE लिखें",
    "सब मिटाएँ",
    "मेरा रिकॉर्ड रखें",
    "मैं छात्र हूँ",
    "मैं शिक्षक हूँ",
    "आपका लक्ष्य",
    "आप किस ओर काम कर रहे हैं? OpenMind आपकी दैनिक योजना उसी के इर्द-गिर्द बनाता है।",
    "मुख्य कारण",
    "अपने शब्दों में (वैकल्पिक)",
    "जैसे जून में GCSE Higher Maths पास करना",
    "आप इसे कभी भी बदल सकते हैं। बिना लक्ष्य के योजना बस आपके साक्ष्य का पालन करती है।",
    "कोई खास लक्ष्य नहीं",
  ]],
  ["id", [
    "Data Anda",
    "Semua yang OpenMind catat tentang belajarmu adalah milikmu: unduh, atau hapus seluruhnya dari penyebaran ini.",
    "Unduh data saya",
    "Hapus rekam belajar saya…",
    "Ini menghapus permanen profilmu, rekam buktimu, dan keanggotaan kelasmu dari penyebaran ini. Tidak bisa dibatalkan. Akunmu tetap menyimpan email dan kata sandi, tetapi riwayat belajarnya hilang.",
    "Ketik ERASE untuk konfirmasi",
    "Hapus semuanya",
    "Simpan rekam saya",
    "Saya pelajar",
    "Saya guru",
    "Tujuan Anda",
    "Kamu belajar menuju apa? OpenMind membentuk rencana harianmu di sekitarnya.",
    "Alasan utama",
    "Dengan kata-katamu sendiri (opsional)",
    "mis. Lulus GCSE Higher Maths bulan Juni",
    "Kamu bisa mengubahnya kapan saja. Tanpa tujuan, rencana cukup mengikuti buktimu.",
    "Tidak ada tujuan khusus",
  ]],
  ["fil", [
    "Ang data mo",
    "Lahat ng naitala ng OpenMind tungkol sa pag-aaral mo ay sa iyo: i-download ito, o burahin nang buo mula sa deployment na ito.",
    "I-download ang data ko",
    "Burahin ang rekord ko sa pag-aaral…",
    "Permanenteng buburahin nito ang profile mo, ang evidence ledger mo, at ang pagiging miyembro mo sa mga klase sa deployment na ito. Hindi na maibabalik. Mananatili sa account mo ang email at password, pero mawawala ang history ng pag-aaral.",
    "I-type ang ERASE para kumpirmahin",
    "Burahin lahat",
    "Panatilihin ang rekord ko",
    "Estudyante ako",
    "Guro ako",
    "Ang layunin mo",
    "Ano ang pinagtatrabahuhan mo? Iniaangkop ng OpenMind ang daily plan mo dito.",
    "Pangunahing dahilan",
    "Sa sarili mong salita (opsyonal)",
    "hal. Pumasa sa GCSE Higher Maths sa Hunyo",
    "Maaari mo itong palitan anumang oras. Kung walang layunin, susundan lang ng plano ang evidence mo.",
    "Walang partikular na layunin",
  ]],
  ["de", [
    "Deine Daten",
    "Alles, was OpenMind über dein Lernen erfasst hat, gehört dir: lade es herunter oder lösche es aus dieser Installation vollständig.",
    "Meine Daten herunterladen",
    "Meinen Lernverlauf löschen…",
    "Dies löscht dauerhaft dein Profil, deine Beleghistorie und deine Klassenmitgliedschaften aus dieser Installation. Das kann nicht rückgängig gemacht werden. Dein Konto behält E-Mail und Passwort, aber der Lernverlauf ist weg.",
    "Tippe ERASE zum Bestätigen",
    "Alles löschen",
    "Meinen Verlauf behalten",
    "Ich bin Schüler/in",
    "Ich bin Lehrkraft",
    "Dein Ziel",
    "Worauf arbeitest du hin? OpenMind richtet deinen Tagesplan danach aus.",
    "Hauptgrund",
    "In deinen eigenen Worten (optional)",
    "z. B. GCSE Higher Maths im Juni bestehen",
    "Jederzeit änderbar. Ohne Ziel folgt der Plan einfach deinen Belegen.",
    "Kein bestimmtes Ziel",
  ]],
  ["ja", [
    "あなたのデータ",
    "OpenMind が記録した学習データはすべてあなたのものです。ダウンロードするか、この環境から完全に消去できます。",
    "データをダウンロード",
    "学習記録を消去する…",
    "この操作で、この環境からあなたのプロフィール、証拠レジャー、クラスの所属が完全に削除されます。元に戻せません。アカウントのメールとパスワードは残りますが、学習履歴はなくなります。",
    "確認のため ERASE と入力",
    "すべて消去",
    "記録を残す",
    "学生です",
    "教師です",
    "あなたの目標",
    "何に向かって学習していますか？ OpenMind は毎日のプランをそれに合わせて組み立てます。",
    "主な目的",
    "自分の言葉で（任意）",
    "例：6月の GCSE Higher Maths に合格する",
    "いつでも変更できます。目標がなければ、プランは証拠に従うだけです。",
    "特に目標はない",
  ]],
  ["zh", [
    "你的数据",
    "OpenMind 记录的你的学习数据都归你所有：下载它，或从本部署中彻底删除。",
    "下载我的数据",
    "删除我的学习记录…",
    "这将从本部署中永久删除你的个人资料、证据记录和班级成员身份，无法撤销。账户会保留邮箱和密码，但学习历史会消失。",
    "输入 ERASE 以确认",
    "全部删除",
    "保留我的记录",
    "我是学生",
    "我是老师",
    "你的目标",
    "你在为什么而努力？OpenMind 会据此安排你的每日计划。",
    "主要目的",
    "用自己的话（可选）",
    "例如：六月通过 GCSE Higher Maths",
    "随时可以修改。没有目标时，计划会直接跟随你的证据。",
    "没有特定目标",
  ]],
  ["fa", [
    "دادههای شما",
    "هرچه OpenMind درباره یادگیری شما ثبت کرده مال شماست: آن را بگیرید، یا از این استقرار کامل پاکش کنید.",
    "دانلود دادههای من",
    "پاک کردن رکورد یادگیری من…",
    "این کار پروفایل، دفتر شواهد و عضویت کلاسی شما را برای همیشه از این استقرار حذف میکند. قابل بازگشت نیست. حساب شما ایمیل و گذرواژه را نگه میدارد، اما تاریخچه یادگیری از بین میرود.",
    "برای تأیید ERASE را بنویسید",
    "پاک کردن همه",
    "نگه داشتن رکورد من",
    "من دانشآموز هستم",
    "من معلم هستم",
    "هدفتان",
    "به سوی چه کار میکنید؟ OpenMind برنامه روزانهتان را بر همان اساس میچیند.",
    "دلیل اصلی",
    "با کلمات خودتان (اختیاری)",
    "مثلاً قبولی GCSE Higher Maths در ژوئن",
    "هر وقت بخواهید میتوانید عوضش کنید. بی هدف، برنامه فقط از شواهد شما پیروی میکند.",
    "هدف خاصی ندارم",
  ]],
  ["ur", [
    "آپ کا ڈیٹا",
    "آپ کی تعلیم کے بارے میں OpenMind نے جو کچھ درج کیا وہ آپ کا اپنا ہے: اسے ڈاؤن لوڈ کریں، یا اس تعینات نسخے سے مکمل مٹا دیں۔",
    "میرا ڈیٹا ڈاؤن لوڈ کریں",
    "میرا سیکھنے کا ریکارڈ مٹائیں…",
    "اس سے آپ کی پروفائل، آپ کا شواہد ریکارڈ اور کلاسوں میں آپ کی رکنیت اس تعینات نسخے سے ہمیشہ کے لیے حذف ہو جائے گی۔ یہ واپس نہیں ہو سکتا۔ آپ کے اکاؤنٹ کا ای میل اور پاس ورڈ رہے گا، مگر سیکھنے کی تاریخ چلی جائے گی۔",
    "تصدیق کے لیے ERASE لکھیں",
    "سب مٹا دیں",
    "میرا ریکارڈ رکھیں",
    "میں طالب علم ہوں",
    "میں استاد ہوں",
    "آپ کا ہدف",
    "آپ کس چیز کی طرف محنت کر رہے ہیں؟ OpenMind آپ کا روزانہ کا منصوبہ اسی کے گرد بناتا ہے۔",
    "بنیادی وجہ",
    "اپنے الفاظ میں (اختیاری)",
    "مثلاً جون میں GCSE Higher Maths پاس کرنا",
    "آپ کسی بھی وقت اسے بدل سکتے ہیں۔ بغیر ہدف کے منصوبہ بس آپ کے شواہد کی پیروی کرتا ہے۔",
    "کوئی خاص ہدف نہیں",
  ]],
  ["bn", [
    "তোমার ডেটা",
    "তোমার শেখা সম্পর্কে OpenMind যা রেকর্ড করেছে সবটাই তোমার: ডাউনলোড করো, বা এই ডেপ্লয়মেন্ট থেকে পুরোপুরি মুছে ফেলো।",
    "আমার ডেটা ডাউনলোড করো",
    "আমার শেখার রেকর্ড মুছে ফেলো…",
    "এতে এই ডেপ্লয়মেন্ট থেকে তোমার প্রোফাইল, প্রমাণের রেকর্ড আর শ্রেণির সদস্যপদ স্থায়ীভাবে মুছে যাবে। এটা ফেরানো যাবে না। অ্যাকাউন্টে ইমেইল আর পাসওয়ার্ড থাকবে, কিন্তু শেখার ইতিহাস চলে যাবে।",
    "নিশ্চিত হতে ERASE লেখো",
    "সব মুছে ফেলো",
    "আমার রেকর্ড রাখো",
    "আমি ছাত্র/ছাত্রী",
    "আমি শিক্ষক",
    "তোমার লক্ষ্য",
    "কোনদিকে এগোচ্ছ? OpenMind তোমার দৈনিক পরিকল্পনা তার চারপাশে সাজায়।",
    "মূল কারণ",
    "নিজের ভাষায় (ঐচ্ছিক)",
    "যেমন জুনে GCSE Higher Maths পাস করা",
    "যেকোনো সময় বদলাতে পারো। লক্ষ্য না থাকলে পরিকল্পনা শুধু তোমার প্রমাণ অনুসরণ করে।",
    "বিশেষ কোনো লক্ষ্য নেই",
  ]],
];

for (const [lang, texts] of TEXTS) {
  if (texts.length !== ACCT_KEYS.length + ONB_KEYS.length) {
    throw new Error(`${lang}: ${texts.length} texts for ${ACCT_KEYS.length + ONB_KEYS.length} keys — refusing to write a half dictionary`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"acct.privacyTitle"')) {
  console.log("privacy keys already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const count = (needle) => lines.reduce((n, l) => (l.includes(needle) ? n + 1 : n), 0);
if (count(ACCT_ANCHOR) !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ACCT_ANCHOR} anchors, found ${count(ACCT_ANCHOR)}`);
}
if (count(ONB_ANCHOR) !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ONB_ANCHOR} anchors, found ${count(ONB_ANCHOR)}`);
}

// Collect every insertion point first, then apply from the BOTTOM so earlier
// indices stay valid regardless of which anchor sits later in a block.
const acctAnchors = [];
const onbAnchors = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(ACCT_ANCHOR)) acctAnchors.push(i);
  if (lines[i].includes(ONB_ANCHOR)) onbAnchors.push(i);
}

const insertAt = (lineIdx, keys, texts) => {
  const indent = lines[lineIdx].match(/^\s*/)[0];
  const added = keys.map((key, k) => {
    const escaped = texts[k].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${indent}"${key}": "${escaped}",`;
  });
  lines.splice(lineIdx + 1, 0, ...added);
  console.log(`${keys[0].split(".")[0]} @ line ${lineIdx + 1}: added ${added.length}`);
};

for (let i = TEXTS.length - 1; i >= 0; i--) {
  const [lang, texts] = TEXTS[i];
  // Bottom-up per dictionary: acct.lead sits below intent.life inside each
  // block, so the acct insert (later line) must land before the onb insert
  // would shift it — handle per language, high line first.
  const jobs = [
    { line: acctAnchors[i], keys: ACCT_KEYS, texts: texts.slice(0, ACCT_KEYS.length) },
    { line: onbAnchors[i], keys: ONB_KEYS, texts: texts.slice(ACCT_KEYS.length) },
  ].sort((a, b) => b.line - a.line);
  for (const job of jobs) insertAt(job.line, job.keys, job.texts);
  console.log(`${lang}: ok`);
}

fs.writeFileSync(FILE, lines.join("\n"));
