// One-shot: the closed learning loop's strings — the session chrome, the
// before/after result table, and the reason the plan moved.
//
// Insertion is anchored to each block's LAST `};` before the next top-level
// declaration, never to the end of a line range: a range runs on to the next
// `const xx: Dict = {`, and for the final dictionary it runs past DICTS.
import fs from "node:fs";

const T = {
  "sess.eyebrow": {
    en: "Learning session", es: "Sesión de aprendizaje", fr: "Session d'apprentissage", pt: "Sessão de aprendizagem",
    ar: "جلسة تعلّم", sw: "Kipindi cha kujifunza", hi: "अधिगम सत्र", id: "Sesi belajar",
    tl: "Sesyon ng pag-aaral", de: "Lerneinheit", ja: "学習セッション", zh: "学习环节",
    fa: "جلسه یادگیری", ur: "سیکھنے کا سیشن", bn: "শেখার সেশন",
  },
  "sess.lead": {
    en: "Short session. At the end, OpenMind shows what changed and what to do next.",
    es: "Sesión corta. Al final, OpenMind muestra qué cambió y qué hacer después.",
    fr: "Session courte. À la fin, OpenMind montre ce qui a changé et quoi faire ensuite.",
    pt: "Sessão curta. No fim, o OpenMind mostra o que mudou e o que fazer depois.",
    ar: "جلسة قصيرة. في النهاية يعرض OpenMind ما تغيّر وما الخطوة التالية.",
    sw: "Kipindi kifupi. Mwishoni, OpenMind inaonyesha kilichobadilika na cha kufanya.",
    hi: "छोटा सत्र। अंत में OpenMind दिखाता है क्या बदला और आगे क्या करें।",
    id: "Sesi singkat. Di akhir, OpenMind menunjukkan apa yang berubah dan langkah berikutnya.",
    tl: "Maikling sesyon. Sa dulo, ipapakita ng OpenMind ang nagbago at ang susunod na gawin.",
    de: "Kurze Einheit. Am Ende zeigt OpenMind, was sich geändert hat und was als Nächstes dran ist.",
    ja: "短いセッションです。最後に何が変わり、次に何をするかを表示します。",
    zh: "短短一段。结束时，OpenMind 会显示有什么变化、接下来做什么。",
    fa: "جلسه کوتاه است. در پایان، OpenMind نشان می‌دهد چه تغییر کرد و گام بعدی چیست.",
    ur: "مختصر سیشن۔ آخر میں OpenMind دکھائے گا کیا بدلا اور آگے کیا کرنا ہے۔",
    bn: "সংক্ষিপ্ত সেশন। শেষে OpenMind দেখাবে কী বদলাল আর পরে কী করবেন।",
  },
  "sess.qOf": {
    en: "Question {n} of {m}", es: "Pregunta {n} de {m}", fr: "Question {n} sur {m}", pt: "Pergunta {n} de {m}",
    ar: "السؤال {n} من {m}", sw: "Swali {n} kati ya {m}", hi: "प्रश्न {n} / {m}", id: "Soal {n} dari {m}",
    tl: "Tanong {n} ng {m}", de: "Frage {n} von {m}", ja: "第{n}問／全{m}問", zh: "第 {n} 题，共 {m} 题",
    fa: "پرسش {n} از {m}", ur: "سوال {n} از {m}", bn: "প্রশ্ন {n} / {m}",
  },
  "sess.resume": {
    en: "Unfinished session: {n} of {m}", es: "Sesión sin terminar: {n} de {m}", fr: "Session inachevée : {n} sur {m}", pt: "Sessão inacabada: {n} de {m}",
    ar: "جلسة غير مكتملة: {n} من {m}", sw: "Kipindi hakijakamilika: {n} kati ya {m}", hi: "अधूरा सत्र: {n}/{m}", id: "Sesi belum selesai: {n} dari {m}",
    tl: "Hindi pa tapos: {n} ng {m}", de: "Unbeendete Einheit: {n} von {m}", ja: "未完了のセッション：{n}／{m}", zh: "未完成的环节：{n}/{m}",
    fa: "جلسه ناتمام: {n} از {m}", ur: "نامکمل سیشن: {n} از {m}", bn: "অসমাপ্ত সেশন: {n}/{m}",
  },
  "sess.noHints": {
    en: "{c} of {n} with no hints", es: "{c} de {n} sin pistas", fr: "{c} sur {n} sans indice", pt: "{c} de {n} sem dicas",
    ar: "{c} من {n} بدون تلميحات", sw: "{c} kati ya {n} bila vidokezo", hi: "{c}/{n} बिना संकेत", id: "{c} dari {n} tanpa petunjuk",
    tl: "{c} sa {n} na walang hint", de: "{c} von {n} ohne Hinweis", ja: "{n}問中{c}問をヒントなしで", zh: "{n} 题中 {c} 题无提示",
    fa: "{c} از {n} بدون راهنما", ur: "{n} میں سے {c} بغیر اشارے", bn: "{n} টির মধ্যে {c} টি সংকেত ছাড়া",
  },
  "sess.complete": {
    en: "Session complete", es: "Sesión completada", fr: "Session terminée", pt: "Sessão concluída",
    ar: "اكتملت الجلسة", sw: "Kipindi kimekamilika", hi: "सत्र पूरा", id: "Sesi selesai",
    tl: "Tapos na ang sesyon", de: "Einheit abgeschlossen", ja: "セッション完了", zh: "本环节完成",
    fa: "جلسه کامل شد", ur: "سیشن مکمل", bn: "সেশন সম্পন্ন",
  },
  "sess.before": {
    en: "Before", es: "Antes", fr: "Avant", pt: "Antes", ar: "قبل", sw: "Kabla", hi: "पहले", id: "Sebelum",
    tl: "Bago", de: "Vorher", ja: "前", zh: "之前", fa: "پیش", ur: "پہلے", bn: "আগে",
  },
  "sess.now": {
    en: "Now", es: "Ahora", fr: "Maintenant", pt: "Agora", ar: "الآن", sw: "Sasa", hi: "अब", id: "Sekarang",
    tl: "Ngayon", de: "Jetzt", ja: "現在", zh: "现在", fa: "اکنون", ur: "اب", bn: "এখন",
  },
  "sess.mastery": {
    en: "Mastery", es: "Dominio", fr: "Maîtrise", pt: "Domínio", ar: "التمكّن", sw: "Umilisi", hi: "निपुणता", id: "Penguasaan",
    tl: "Kahusayan", de: "Beherrschung", ja: "習熟度", zh: "掌握度", fa: "تسلط", ur: "مہارت", bn: "দক্ষতা",
  },
  "sess.independence": {
    en: "Independence", es: "Independencia", fr: "Autonomie", pt: "Independência", ar: "الاستقلالية", sw: "Kujitegemea", hi: "स्वतंत्रता", id: "Kemandirian",
    tl: "Kalayaan", de: "Selbstständigkeit", ja: "自力", zh: "独立完成", fa: "استقلال", ur: "خودمختاری", bn: "স্বাধীনতা",
  },
  "sess.needsAttention": {
    en: "Needs attention", es: "Necesita atención", fr: "À revoir", pt: "Precisa de atenção",
    ar: "يحتاج انتباهًا", sw: "Inahitaji makini", hi: "ध्यान चाहिए", id: "Perlu perhatian",
    tl: "Kailangan ng pansin", de: "Braucht Aufmerksamkeit", ja: "要確認", zh: "需要关注",
    fa: "نیاز به توجه", ur: "توجہ درکار", bn: "মনোযোগ দরকার",
  },
  "sess.nextAction": {
    en: "Next action", es: "Siguiente acción", fr: "Prochaine action", pt: "Próxima ação",
    ar: "الإجراء التالي", sw: "Hatua inayofuata", hi: "अगली क्रिया", id: "Tindakan berikutnya",
    tl: "Susunod na aksyon", de: "Nächste Aktion", ja: "次の行動", zh: "下一步动作",
    fa: "اقدام بعدی", ur: "اگلا اقدام", bn: "পরের কাজ",
  },
  "sess.whyNext": {
    en: "Why this is next", es: "Por qué esto es lo siguiente", fr: "Pourquoi c'est la suite", pt: "Por que isso vem agora",
    ar: "لماذا هذا هو التالي", sw: "Kwa nini hii inafuata", hi: "यह अगला क्यों है", id: "Kenapa ini berikutnya",
    tl: "Bakit ito ang susunod", de: "Warum das als Nächstes kommt", ja: "なぜ次にこれか", zh: "为什么接下来是这个",
    fa: "چرا این گام بعدی است", ur: "یہ اگلا کیوں ہے", bn: "কেন এটি পরের ধাপ",
  },
  "sess.changed": {
    en: "OpenMind moved your next step", es: "OpenMind cambió tu siguiente paso", fr: "OpenMind a changé votre prochaine étape", pt: "O OpenMind mudou seu próximo passo",
    ar: "غيّر OpenMind خطوتك التالية", sw: "OpenMind imebadilisha hatua yako", hi: "OpenMind ने आपका अगला कदम बदला", id: "OpenMind mengubah langkah berikutnya",
    tl: "Binago ng OpenMind ang susunod mong hakbang", de: "OpenMind hat deinen nächsten Schritt geändert", ja: "OpenMind が次のステップを変えました", zh: "OpenMind 改变了你的下一步",
    fa: "OpenMind گام بعدی شما را تغییر داد", ur: "OpenMind نے آپ کا اگلا قدم بدلا", bn: "OpenMind আপনার পরের ধাপ বদলেছে",
  },
  "sess.unchanged": {
    en: "Your plan is unchanged", es: "Tu plan no cambia", fr: "Votre plan reste inchangé", pt: "Seu plano não mudou",
    ar: "خطتك لم تتغير", sw: "Mpango wako haujabadilika", hi: "आपका प्लान नहीं बदला", id: "Rencanamu tidak berubah",
    tl: "Hindi nagbago ang plano mo", de: "Dein Plan bleibt gleich", ja: "計画は変わりません", zh: "你的计划未变",
    fa: "برنامه شما تغییر نکرد", ur: "آپ کا منصوبہ وہی ہے", bn: "আপনার পরিকল্পনা অপরিবর্তিত",
  },
  "sess.r.transfer": {
    en: "You proved this on unfamiliar wording, so the model can move you forward.",
    es: "Lo demostraste con un enunciado desconocido: el modelo puede avanzarte.",
    fr: "Vous l'avez prouvé sur un énoncé inédit : le modèle peut vous faire avancer.",
    pt: "Você provou com um enunciado desconhecido: o modelo pode avançar você.",
    ar: "أثبتّ ذلك بصياغة غير مألوفة، لذا يمكن للنموذج أن يقدّمك.",
    sw: "Uliithibitisha kwa maneno yasiyozoeleka, hivyo mfumo unaweza kukupeleka mbele.",
    hi: "आपने अनजान शब्दों में इसे सिद्ध किया, इसलिए मॉडल आपको आगे बढ़ा सकता है।",
    id: "Kamu membuktikannya dengan kalimat baru, jadi model bisa memajukanmu.",
    tl: "Pinatunayan mo ito sa bagong pananalita, kaya maaaring isulong ka ng modelo.",
    de: "Du hast es in unbekannter Formulierung bewiesen — das Modell kann dich vorrücken.",
    ja: "見慣れない表現で証明できたので、次の段階に進めます。",
    zh: "你在陌生的表述中证明了这一点，模型可以让你继续前进。",
    fa: "آن را با بیان ناآشنا اثبات کردید، پس مدل می‌تواند شما را جلو ببرد.",
    ur: "آپ نے اسے نئی عبارت میں ثابت کیا، اس لیے ماڈل آپ کو آگے بڑھا سکتا ہے۔",
    bn: "অপরিচিত ভাষায় এটি প্রমাণ করেছেন, তাই মডেল আপনাকে এগিয়ে নিতে পারে।",
  },
  "sess.r.misconception": {
    en: "The same slip recurred, so your plan switched to repairing it.",
    es: "El mismo error se repitió, así que tu plan pasó a repararlo.",
    fr: "La même erreur s'est répétée : votre plan passe à la réparer.",
    pt: "O mesmo erro se repetiu, então seu plano passou a corrigi-lo.",
    ar: "تكرّر الخطأ نفسه، لذلك تحوّلت خطتك إلى إصلاحه.",
    sw: "Kosa lile lile lilitokea tena, hivyo mpango wako umebadilika kurekebisha.",
    hi: "वही गलती दोबारा हुई, इसलिए प्लान उसे सुधारने पर चला गया।",
    id: "Kesalahan yang sama terulang, jadi rencanamu beralih memperbaikinya.",
    tl: "Naulit ang parehong pagkakamali, kaya naging pag-aayos ito ng plano mo.",
    de: "Derselbe Fehler kam wieder, deshalb steht jetzt das Beheben im Plan.",
    ja: "同じつまずきが再発したため、計画はその修正に切り替わりました。",
    zh: "同样的错误再次出现，所以计划转为修复它。",
    fa: "همان خطا دوباره رخ داد، پس برنامه به اصلاح آن تغییر کرد.",
    ur: "وہی غلطی دوبارہ ہوئی، اس لیے منصوبہ اسے درست کرنے پر آ گیا۔",
    bn: "একই ভুল আবার হয়েছে, তাই পরিকল্পনা তা সারানোর দিকে গেল।",
  },
  "sess.r.independence": {
    en: "You solved some of these without hints, so independence is rising.",
    es: "Resolviste algunas sin pistas: tu independencia está subiendo.",
    fr: "Vous en avez résolu sans indice : votre autonomie progresse.",
    pt: "Você resolveu algumas sem dicas: sua independência está subindo.",
    ar: "حللت بعضها بدون تلميحات، فاستقلاليتك ترتفع.",
    sw: "Ulitatua baadhi bila vidokezo, hivyo kujitegemea kwako kunaongezeka.",
    hi: "आपने कुछ बिना संकेत हल किए, इसलिए स्वतंत्रता बढ़ रही है।",
    id: "Kamu menyelesaikan sebagian tanpa petunjuk, jadi kemandirianmu naik.",
    tl: "Nasagot mo ang ilan nang walang hint, kaya tumataas ang kalayaan mo.",
    de: "Du hast einige ohne Hinweis gelöst — deine Selbstständigkeit steigt.",
    ja: "ヒントなしで解けたので、自力が伸びています。",
    zh: "有几题你没用提示就做对了，独立完成的能力在上升。",
    fa: "برخی را بدون راهنما حل کردید، پس استقلال شما بالا می‌رود.",
    ur: "آپ نے کچھ بغیر اشارے حل کیے، اس لیے خودمختاری بڑھ رہی ہے۔",
    bn: "কিছু সংকেত ছাড়াই সমাধান করেছেন, তাই স্বাধীনতা বাড়ছে।",
  },
  "sess.r.masteryUp": {
    en: "Your mastery on this concept rose.", es: "Tu dominio de este concepto subió.", fr: "Votre maîtrise de ce concept a augmenté.", pt: "Seu domínio deste conceito subiu.",
    ar: "ارتفع تمكّنك من هذا المفهوم.", sw: "Umilisi wako wa dhana hii umeongezeka.", hi: "इस अवधारणा में आपकी निपुणता बढ़ी।", id: "Penguasaanmu atas konsep ini naik.",
    tl: "Tumaas ang kahusayan mo sa konseptong ito.", de: "Deine Beherrschung dieses Konzepts ist gestiegen.", ja: "この概念の習熟度が上がりました。", zh: "你对这个概念掌握度提高了。",
    fa: "تسلط شما بر این مفهوم بالا رفت.", ur: "اس تصور میں آپ کی مہارت بڑھی۔", bn: "এই ধারণায় আপনার দক্ষতা বেড়েছে।",
  },
  "sess.r.masteryDown": {
    en: "Your answers showed less than the model assumed, so the estimate was pulled back.",
    es: "Tus respuestas mostraron menos de lo que el modelo suponía: la estimación bajó.",
    fr: "Vos réponses montrent moins que ce que le modèle supposait : l'estimation a été revue à la baisse.",
    pt: "Suas respostas mostraram menos do que o modelo supunha: a estimativa foi reduzida.",
    ar: "أظهرت إجاباتك أقل مما افترضه النموذج، لذا خُفِّض التقدير.",
    sw: "Majibu yako yalionyesha chini ya ilivyodhaniwa, hivyo makadirio yalipunguzwa.",
    hi: "आपके उत्तर अनुमान से कम रहे, इसलिए अनुमान नीचे किया गया।",
    id: "Jawabanmu menunjukkan lebih rendah dari perkiraan, jadi estimasinya diturunkan.",
    tl: "Mas mababa ang naging sagot kaysa inaasahan, kaya ibinaba ang tantiya.",
    de: "Deine Antworten zeigten weniger als angenommen — die Schätzung wurde gesenkt.",
    ja: "回答は想定より低かったため、推定値を下げました。",
    zh: "你的作答低于模型的假设，因此下调了估计值。",
    fa: "پاسخ‌های شما کمتر از برآورد مدل بود، پس برآورد پایین آورده شد.",
    ur: "آپ کے جوابات اندازے سے کم رہے، اس لیے تخمینہ نیچے کیا گیا۔",
    bn: "আপনার উত্তর অনুমানের চেয়ে কম হয়েছে, তাই অনুমান কমানো হলো।",
  },
  "sess.r.same": {
    en: "Evidence was recorded, but not enough to change the plan.",
    es: "Se registró evidencia, pero no basta para cambiar el plan.",
    fr: "Des preuves sont enregistrées, mais pas assez pour changer le plan.",
    pt: "A evidência foi registrada, mas não basta para mudar o plano.",
    ar: "سُجِّلت الأدلة، لكنها لا تكفي لتغيير الخطة.",
    sw: "Ushahidi umerekodiwa, lakini hautoshi kubadilisha mpango.",
    hi: "साक्ष्य दर्ज हुआ, पर प्लान बदलने के लिए पर्याप्त नहीं।",
    id: "Bukti tercatat, tapi belum cukup mengubah rencana.",
    tl: "Naitala ang ebidensya, pero kulang pa para baguhin ang plano.",
    de: "Belege wurden erfasst, reichen aber nicht, um den Plan zu ändern.",
    ja: "証拠は記録されましたが、計画を変えるほどではありません。",
    zh: "证据已记录，但还不足以改变计划。",
    fa: "شواهد ثبت شد، اما برای تغییر برنامه کافی نیست.",
    ur: "ثبوت درج ہوا، مگر منصوبہ بدلنے کے لیے کافی نہیں۔",
    bn: "প্রমাণ নথিভুক্ত হয়েছে, তবে পরিকল্পনা বদলানোর যথেষ্ট নয়।",
  },
  "sess.r.unchanged": {
    en: "Nothing was answered, so nothing changed.", es: "No se respondió nada, así que nada cambió.", fr: "Rien n'a été répondu, donc rien n'a changé.", pt: "Nada foi respondido, então nada mudou.",
    ar: "لم تُجب عن أي سؤال، فلم يتغير شيء.", sw: "Hakuna lililojibiwa, hivyo hakuna kilichobadilika.", hi: "कोई उत्तर नहीं दिया गया, इसलिए कुछ नहीं बदला।", id: "Tidak ada yang dijawab, jadi tidak ada yang berubah.",
    tl: "Walang sinagot, kaya walang nagbago.", de: "Nichts wurde beantwortet, also hat sich nichts geändert.", ja: "回答がなかったため、変化はありません。", zh: "没有作答，因此没有变化。",
    fa: "پاسخی داده نشد، پس چیزی تغییر نکرد.", ur: "کوئی جواب نہیں دیا گیا، اس لیے کچھ نہیں بدلا۔", bn: "কোনো উত্তর দেওয়া হয়নি, তাই কিছু বদলায়নি।",
  },
  "sess.continue": {
    en: "Continue to my next step", es: "Ir a mi siguiente paso", fr: "Passer à ma prochaine étape", pt: "Ir ao meu próximo passo",
    ar: "الانتقال إلى خطوتي التالية", sw: "Nenda kwa hatua yangu inayofuata", hi: "मेरे अगले कदम पर जाएँ", id: "Lanjut ke langkah berikutnya",
    tl: "Pumunta sa susunod kong hakbang", de: "Zu meinem nächsten Schritt", ja: "次のステップへ進む", zh: "前往我的下一步",
    fa: "رفتن به گام بعدی من", ur: "میرے اگلے قدم پر جائیں", bn: "আমার পরের ধাপে যান",
  },
  "sess.home": {
    en: "Back to Home", es: "Volver al inicio", fr: "Retour à l'accueil", pt: "Voltar ao início",
    ar: "العودة إلى الرئيسية", sw: "Rudi mwanzo", hi: "होम पर वापस", id: "Kembali ke Beranda",
    tl: "Bumalik sa Home", de: "Zurück zur Startseite", ja: "ホームに戻る", zh: "返回首页",
    fa: "بازگشت به خانه", ur: "ہوم پر واپس", bn: "হোমে ফিরুন",
  },
  "sess.finish": {
    en: "Finish session", es: "Terminar sesión", fr: "Terminer la session", pt: "Encerrar sessão",
    ar: "إنهاء الجلسة", sw: "Maliza kipindi", hi: "सत्र समाप्त करें", id: "Akhiri sesi",
    tl: "Tapusin ang sesyon", de: "Einheit beenden", ja: "セッションを終える", zh: "结束本环节",
    fa: "پایان جلسه", ur: "سیشن ختم کریں", bn: "সেশন শেষ করুন",
  },
  "sess.prove": {
    en: "Prove it on an unfamiliar question", es: "Demuéstralo con una pregunta desconocida", fr: "Prouvez-le sur une question inédite", pt: "Prove com uma questão desconhecida",
    ar: "أثبته بسؤال غير مألوف", sw: "Ithibitishe kwa swali jipya", hi: "अनजान प्रश्न पर सिद्ध करें", id: "Buktikan dengan soal baru",
    tl: "Patunayan sa bagong tanong", de: "Beweise es an einer unbekannten Aufgabe", ja: "見慣れない問題で証明する", zh: "用陌生题目证明一下",
    fa: "با پرسشی ناآشنا اثبات کنید", ur: "نئے سوال پر ثابت کریں", bn: "অপরিচিত প্রশ্নে প্রমাণ করুন",
  },
  "sess.nothing": {
    en: "No session to report. Finish one and OpenMind will show what changed.",
    es: "No hay sesión que informar. Termina una y OpenMind mostrará qué cambió.",
    fr: "Aucune session à présenter. Terminez-en une et OpenMind montrera ce qui a changé.",
    pt: "Nenhuma sessão para mostrar. Conclua uma e o OpenMind mostrará o que mudou.",
    ar: "لا توجد جلسة لعرضها. أكمل واحدة وسيعرض OpenMind ما تغيّر.",
    sw: "Hakuna kipindi cha kuonyesha. Maliza kimoja na OpenMind itaonyesha kilichobadilika.",
    hi: "दिखाने के लिए कोई सत्र नहीं। एक पूरा करें, OpenMind बदलाव दिखाएगा।",
    id: "Belum ada sesi. Selesaikan satu dan OpenMind akan menunjukkan perubahannya.",
    tl: "Walang sesyong maipapakita. Tapusin ang isa at ipapakita ng OpenMind ang nagbago.",
    de: "Keine Einheit vorhanden. Beende eine, dann zeigt OpenMind die Veränderung.",
    ja: "表示できるセッションがありません。1つ終えると変化を表示します。",
    zh: "暂无记录。完成一段后，OpenMind 会显示变化。",
    fa: "جلسه‌ای برای نمایش نیست. یکی را کامل کنید تا تغییرات را نشان دهیم.",
    ur: "دکھانے کے لیے کوئی سیشن نہیں۔ ایک مکمل کریں، OpenMind تبدیلی دکھائے گا۔",
    bn: "দেখানোর মতো সেশন নেই। একটি শেষ করুন, OpenMind পরিবর্তন দেখাবে।",
  },
  "sess.err": {
    en: "That session could not be recorded. Your answers are saved.",
    es: "No se pudo registrar esa sesión. Tus respuestas están guardadas.",
    fr: "Cette session n'a pas pu être enregistrée. Vos réponses sont sauvegardées.",
    pt: "Não foi possível registrar essa sessão. Suas respostas estão salvas.",
    ar: "لم نتمكن من تسجيل تلك الجلسة. إجاباتك محفوظة.",
    sw: "Kipindi hicho hakikuweza kurekodiwa. Majibu yako yamehifadhiwa.",
    hi: "वह सत्र दर्ज नहीं हो सका। आपके उत्तर सुरक्षित हैं।",
    id: "Sesi itu tidak bisa dicatat. Jawabanmu tetap tersimpan.",
    tl: "Hindi naitala ang sesyong iyon. Naka-save ang mga sagot mo.",
    de: "Diese Einheit konnte nicht erfasst werden. Deine Antworten sind gespeichert.",
    ja: "このセッションを記録できませんでした。回答は保存されています。",
    zh: "该环节记录失败。你的作答已保存。",
    fa: "آن جلسه ثبت نشد. پاسخ‌های شما ذخیره شده است.",
    ur: "وہ سیشن درج نہ ہو سکا۔ آپ کے جوابات محفوظ ہیں۔",
    bn: "সেই সেশন নথিভুক্ত হয়নি। আপনার উত্তর সংরক্ষিত আছে।",
  },
  "dash.since": {
    en: "Since your last session", es: "Desde tu última sesión", fr: "Depuis votre dernière session", pt: "Desde sua última sessão",
    ar: "منذ جلستك الأخيرة", sw: "Tangu kipindi chako cha mwisho", hi: "आपके पिछले सत्र से", id: "Sejak sesi terakhirmu",
    tl: "Mula noong huling sesyon mo", de: "Seit deiner letzten Einheit", ja: "前回のセッションから", zh: "自上次学习以来",
    fa: "از جلسه آخر شما", ur: "آپ کے پچھلے سیشن سے", bn: "আপনার শেষ সেশনের পর থেকে",
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
let incomplete = [];
for (let i = decls.length - 1; i >= 0; i--) {
  const { lang, start, end } = decls[i];
  const block = lines.slice(start, end);
  const blockText = block.join("\n");
  const missing = Object.entries(T).filter(([key]) => !blockText.includes(`"${key}":`));
  if (!missing.length) continue;
  for (const [key, byLang] of missing) if (!byLang[lang]) incomplete.push(`${key}/${lang}`);
  const close = closeBrace(block);
  if (close < 0) throw new Error(`no closing brace for ${lang}`);
  const inserted = missing.map(([key, byLang]) => `  "${key}": ${JSON.stringify(byLang[lang] ?? byLang.en)},`);
  block.splice(close, 0, ...inserted);
  added += inserted.length;
  lines.splice(start, end - start, ...block);
}

if (incomplete.length) throw new Error(`missing translations: ${incomplete.join(", ")}`);
fs.writeFileSync(file, lines.join("\n"), "utf8");
console.log(`i18n session: +${added} strings (${Object.keys(T).length} keys × ${LANGS.length} languages)`);
