// One-shot: the "a paper is diagnostic evidence" strings — paper analysis,
// the My Mistakes page, and the per-concept evidence panel.
//
// Insertion is anchored to each dictionary block's LAST `};` before the next
// top-level declaration (see scripts/i18n-session.mjs for why the naive anchor
// breaks on the final dictionary).
import fs from "node:fs";

const T = {
  "an.eyebrow": {
    en: "Paper analysis", es: "Análisis del examen", fr: "Analyse de l'épreuve", pt: "Análise da prova",
    ar: "تحليل الورقة", sw: "Uchambuzi wa karatasi", hi: "प्रश्नपत्र विश्लेषण", id: "Analisis ujian",
    tl: "Pagsusuri ng papel", de: "Klausuranalyse", ja: "答案分析", zh: "试卷分析",
    fa: "تحلیل آزمون", ur: "پرچے کا تجزیہ", bn: "প্রশ্নপত্র বিশ্লেষণ",
  },
  "an.lost": {
    en: "Marks lost by idea", es: "Puntos perdidos por idea", fr: "Points perdus par notion", pt: "Pontos perdidos por ideia",
    ar: "الدرجات المفقودة حسب الفكرة", sw: "Alama zilizopotea kwa dhana", hi: "विचार के अनुसार खोए अंक", id: "Poin hilang per ide",
    tl: "Puntos na nawala bawat ideya", de: "Verlorene Punkte nach Idee", ja: "考え方別の失点", zh: "按知识点失分",
    fa: "نمرات ازدست‌رفته به تفکیک ایده", ur: "خیال کے حساب سے ضائع نشانات", bn: "ধারণা অনুযায়ী হারানো নম্বর",
  },
  "an.qs": {
    en: "questions", es: "preguntas", fr: "questions", pt: "questões", ar: "أسئلة", sw: "maswali", hi: "प्रश्न", id: "soal",
    tl: "tanong", de: "Fragen", ja: "問", zh: "题", fa: "پرسش", ur: "سوالات", bn: "প্রশ্ন",
  },
  "an.lostMarks": {
    en: "lost", es: "perdidos", fr: "perdus", pt: "perdidos", ar: "مفقودة", sw: "zilizopotea", hi: "खोए", id: "hilang",
    tl: "nawala", de: "verloren", ja: "失点", zh: "失分", fa: "ازدست‌رفته", ur: "ضائع", bn: "হারানো",
  },
  "an.unanswered": {
    en: "unanswered", es: "sin responder", fr: "sans réponse", pt: "sem resposta", ar: "بدون إجابة", sw: "bila kujibiwa",
    hi: "अनुत्तरित", id: "tanpa jawaban", tl: "hindi sinagot", de: "unbeantwortet", ja: "未解答", zh: "未作答",
    fa: "بی‌پاسخ", ur: "بغیر جواب", bn: "উত্তরহীন",
  },
  "an.recurring": {
    en: "Same idea, several questions", es: "La misma idea en varias preguntas", fr: "La même notion dans plusieurs questions", pt: "A mesma ideia em várias questões",
    ar: "الفكرة نفسها في عدة أسئلة", sw: "Dhana moja katika maswali kadhaa", hi: "एक ही विचार, कई प्रश्न", id: "Ide yang sama di beberapa soal",
    tl: "Parehong ideya sa ilang tanong", de: "Dieselbe Idee in mehreren Fragen", ja: "同じ考え方が複数の問題に", zh: "同一知识点出现在多题中",
    fa: "یک ایده در چند پرسش", ur: "ایک ہی خیال، کئی سوالات", bn: "একই ধারণা, একাধিক প্রশ্ন",
  },
  "an.recurringLine": {
    en: "You lost {m} marks across {n} questions testing {t}.",
    es: "Perdiste {m} puntos en {n} preguntas sobre {t}.",
    fr: "Vous avez perdu {m} points sur {n} questions portant sur {t}.",
    pt: "Você perdeu {m} pontos em {n} questões sobre {t}.",
    ar: "فقدت {m} درجة في {n} سؤالًا عن {t}.",
    sw: "Ulipoteza alama {m} katika maswali {n} kuhusu {t}.",
    hi: "{t} पर {n} प्रश्नों में {m} अंक खोए।",
    id: "Kamu kehilangan {m} poin pada {n} soal tentang {t}.",
    tl: "Nawalan ka ng {m} puntos sa {n} tanong tungkol sa {t}.",
    de: "Du hast {m} Punkte in {n} Fragen zu {t} verloren.",
    ja: "{t}の問題{n}問で{m}点を失いました。",
    zh: "在 {t} 的 {n} 题中失了 {m} 分。",
    fa: "در {n} پرسش مربوط به {t}، {m} نمره از دست دادید.",
    ur: "{t} کے {n} سوالات میں {m} نشانات ضائع ہوئے۔",
    bn: "{t} নিয়ে {n} টি প্রশ্নে {m} নম্বর হারিয়েছেন।",
  },
  "an.concentration": {
    en: "{m} of your {total} lost marks sat on ideas that came up more than once.",
    es: "{m} de tus {total} puntos perdidos estaban en ideas repetidas.",
    fr: "{m} de vos {total} points perdus portaient sur des notions répétées.",
    pt: "{m} dos seus {total} pontos perdidos estavam em ideias repetidas.",
    ar: "{m} من أصل {total} درجة مفقودة كانت في أفكار تكررت.",
    sw: "Alama {m} kati ya {total} zilizopotea zilikuwa kwenye dhana zilizojirudia.",
    hi: "खोए {total} में से {m} अंक दोहराए गए विचारों पर थे।",
    id: "{m} dari {total} poin yang hilang ada pada ide yang muncul lebih dari sekali.",
    tl: "{m} sa {total} puntos na nawala ay sa mga ideyang naulit.",
    de: "{m} deiner {total} verlorenen Punkte lagen bei wiederkehrenden Ideen.",
    ja: "失点{total}点のうち{m}点は繰り返し出た考え方でした。",
    zh: "{total} 分失分中有 {m} 分来自重复出现的知识点。",
    fa: "{m} از {total} نمره ازدست‌رفته مربوط به ایده‌های تکراری بود.",
    ur: "{total} میں سے {m} ضائع نشانات دہرائے گئے خیالات پر تھے۔",
    bn: "হারানো {total} নম্বরের মধ্যে {m} টি বারবার আসা ধারণায়।",
  },
  "an.weakest": {
    en: "Practise this weakness", es: "Practica esta debilidad", fr: "Travailler cette faiblesse", pt: "Pratique esta fraqueza",
    ar: "تدرّب على هذا الضعف", sw: "Fanya mazoezi ya udhaifu huu", hi: "इस कमज़ोरी का अभ्यास करें", id: "Latih kelemahan ini",
    tl: "Praktisin ang kahinaang ito", de: "Diese Schwäche üben", ja: "この弱点を練習", zh: "练习这个薄弱点",
    fa: "این ضعف را تمرین کنید", ur: "اس کمزوری کی مشق کریں", bn: "এই দুর্বলতা অনুশীলন করুন",
  },
  "an.none": {
    en: "No marks lost on this paper — nothing to repair.", es: "Sin puntos perdidos en este examen: nada que reparar.", fr: "Aucun point perdu sur cette épreuve — rien à réparer.", pt: "Nenhum ponto perdido nesta prova — nada a corrigir.",
    ar: "لا درجات مفقودة في هذه الورقة — لا شيء لإصلاحه.", sw: "Hakuna alama zilizopotea — hakuna cha kurekebisha.", hi: "इस प्रश्नपत्र में कोई अंक नहीं खोया — सुधारने को कुछ नहीं।", id: "Tidak ada poin hilang di ujian ini — tidak ada yang perlu diperbaiki.",
    tl: "Walang nawalang puntos sa papel na ito — walang aayusin.", de: "Keine verlorenen Punkte — nichts zu reparieren.", ja: "失点はありません。直すところもありません。", zh: "本卷没有失分——无需修补。",
    fa: "در این آزمون نمره‌ای از دست نرفت — چیزی برای جبران نیست.", ur: "اس پرچے میں کوئی نشانات ضائع نہیں — درست کرنے کو کچھ نہیں۔", bn: "এই প্রশ্নপত্রে নম্বর হারায়নি — সারানোর কিছু নেই।",
  },
  "err.eyebrow": {
    en: "My mistakes", es: "Mis errores", fr: "Mes erreurs", pt: "Meus erros", ar: "أخطائي", sw: "Makosa yangu",
    hi: "मेरी गलतियाँ", id: "Kesalahanku", tl: "Mga pagkakamali ko", de: "Meine Fehler", ja: "わたしの間違い", zh: "我的错题",
    fa: "اشتباه‌های من", ur: "میری غلطیاں", bn: "আমার ভুল",
  },
  "err.lead": {
    en: "Every recurring slip OpenMind has recorded about you, with what to do about it.",
    es: "Cada error recurrente que OpenMind ha registrado sobre ti, y qué hacer al respecto.",
    fr: "Chaque erreur récurrente enregistrée à votre sujet, et quoi faire.",
    pt: "Cada erro recorrente que o OpenMind registrou sobre você, e o que fazer.",
    ar: "كل خطأ متكرر سجّله OpenMind عنك، وما العمل حياله.",
    sw: "Kila kosa linalojirudia lililorekodiwa kukuhusu, na cha kufanya.",
    hi: "OpenMind ने आपके बारे में जो दोहराई जाने वाली गलतियाँ दर्ज की हैं, और उनका समाधान।",
    id: "Setiap kesalahan berulang yang OpenMind catat tentangmu, dan cara menanganinya.",
    tl: "Bawat paulit-ulit na pagkakamaling naitala tungkol sa iyo, at ang gagawin.",
    de: "Jeder wiederkehrende Fehler, den OpenMind über dich erfasst hat — und was hilft.",
    ja: "OpenMind が記録した繰り返しのつまずきと、その対処法。",
    zh: "OpenMind 记录下的每一个反复出错，以及该怎么办。",
    fa: "هر خطای تکراری که OpenMind درباره شما ثبت کرده، و راه‌حل آن.",
    ur: "ہر دہرائی جانے والی غلطی جو OpenMind نے ریکارڈ کی، اور اس کا حل۔",
    bn: "OpenMind আপনার সম্পর্কে রেকর্ড করা প্রতিটি বারবার ভুল, আর তার সমাধান।",
  },
  "err.none": {
    en: "No mistakes recorded yet. Practise something, and this page fills itself in.",
    es: "Aún no hay errores registrados. Practica algo y esta página se llenará sola.",
    fr: "Aucune erreur enregistrée. Entraînez-vous et cette page se remplira.",
    pt: "Nenhum erro registrado ainda. Pratique algo e esta página se preencherá.",
    ar: "لا أخطاء مسجلة بعد. تدرّب وستمتلئ هذه الصفحة.",
    sw: "Hakuna makosa yaliyorekodiwa bado. Fanya mazoezi, ukurasa huu utajaa.",
    hi: "अभी कोई गलती दर्ज नहीं। अभ्यास करें, यह पेज भर जाएगा।",
    id: "Belum ada kesalahan tercatat. Latih sesuatu, halaman ini akan terisi.",
    tl: "Wala pang naitalang pagkakamali. Magpraktis at mapupuno ang pahinang ito.",
    de: "Noch keine Fehler erfasst. Übe etwas, dann füllt sich diese Seite.",
    ja: "まだ記録がありません。練習すればこのページが埋まります。",
    zh: "还没有记录。练习一下，这一页就会自动填满。",
    fa: "هنوز خطایی ثبت نشده. تمرین کنید تا این صفحه پر شود.",
    ur: "ابھی کوئی غلطی درج نہیں۔ مشق کریں، یہ صفحہ بھر جائے گا۔",
    bn: "এখনো কোনো ভুল নথিভুক্ত হয়নি। অনুশীলন করুন, পৃষ্ঠাটি ভরে যাবে।",
  },
  "err.why": {
    en: "What went wrong", es: "Qué falló", fr: "Ce qui a échoué", pt: "O que deu errado", ar: "ما الذي أخطأتَ فيه",
    sw: "Kilichokwenda vibaya", hi: "क्या गलत हुआ", id: "Apa yang salah", tl: "Ano ang nagkamali", de: "Was schiefging",
    ja: "どこでつまずいたか", zh: "错在哪里", fa: "چه اشتباهی رخ داد", ur: "کیا غلط ہوا", bn: "কী ভুল হয়েছে",
  },
  "err.last": {
    en: "Last seen", es: "Última vez", fr: "Dernière fois", pt: "Última vez", ar: "آخر مرة", sw: "Mara ya mwisho",
    hi: "अंतिम बार", id: "Terakhir terlihat", tl: "Huling beses", de: "Zuletzt gesehen", ja: "最終出現", zh: "最近出现",
    fa: "آخرین بار", ur: "آخری بار", bn: "শেষবার",
  },
  "err.practise": {
    en: "Practise this", es: "Practicar esto", fr: "Travailler ça", pt: "Praticar isto", ar: "تدرّب على هذا",
    sw: "Fanya mazoezi ya hii", hi: "इसका अभ्यास करें", id: "Latih ini", tl: "Praktisin ito", de: "Das üben",
    ja: "これを練習", zh: "练习这个", fa: "این را تمرین کن", ur: "اس کی مشق کریں", bn: "এটি অনুশীলন করুন",
  },
  "err.review": {
    en: "Review the concept", es: "Repasar el concepto", fr: "Revoir la notion", pt: "Revisar o conceito",
    ar: "راجع المفهوم", sw: "Pitia dhana", hi: "अवधारणा दोहराएँ", id: "Tinjau konsep", tl: "Balikan ang konsepto",
    de: "Konzept wiederholen", ja: "概念を復習", zh: "复习概念", fa: "مرور مفهوم", ur: "تصور کا جائزہ لیں", bn: "ধারণাটি আবার দেখুন",
  },
  "err.unknown": {
    en: "A recorded slip this platform has no catalogue entry for.",
    es: "Un error registrado sin ficha en el catálogo.",
    fr: "Une erreur enregistrée sans fiche dans le catalogue.",
    pt: "Um erro registrado sem ficha no catálogo.",
    ar: "خطأ مسجّل لا توجد له بطاقة في الكتالوج.",
    sw: "Kosa lililorekodiwa lisilo na kadi kwenye orodha.",
    hi: "दर्ज गलती जिसकी सूची में प्रविष्टि नहीं है।",
    id: "Kesalahan tercatat yang belum ada entri katalognya.",
    tl: "Naitalang pagkakamaling walang entry sa katalogo.",
    de: "Ein erfasster Fehler ohne Katalogeintrag.",
    ja: "カタログに項目がない記録されたつまずき。",
    zh: "已记录但没有目录条目的错误。",
    fa: "خطای ثبت‌شده‌ای که در فهرست توضیحی ندارد.",
    ur: "درج شدہ غلطی جس کا فہرست میں اندراج نہیں۔",
    bn: "নথিভুক্ত ভুল, যার ক্যাটালগে কোনো বিবরণ নেই।",
  },
  "err.more": {
    en: "more slips on this concept", es: "más errores en este concepto", fr: "autres erreurs sur cette notion", pt: "mais erros neste conceito",
    ar: "أخطاء أخرى في هذا المفهوم", sw: "makosa mengine kwenye dhana hii", hi: "इस अवधारणा में और गलतियाँ", id: "kesalahan lain di konsep ini",
    tl: "iba pang pagkakamali sa konseptong ito", de: "weitere Fehler zu diesem Konzept", ja: "この概念の他のつまずき", zh: "该知识点还有其他错误",
    fa: "خطاهای دیگر در این مفهوم", ur: "اس تصور میں مزید غلطیاں", bn: "এই ধারণায় আরও ভুল",
  },
  "ev.eyebrow": {
    en: "Your evidence", es: "Tu evidencia", fr: "Vos preuves", pt: "Sua evidência", ar: "أدلتك", sw: "Ushahidi wako",
    hi: "आपके साक्ष्य", id: "Bukti kamu", tl: "Ebidensya mo", de: "Deine Belege", ja: "あなたの根拠", zh: "你的证据",
    fa: "شواهد شما", ur: "آپ کا ثبوت", bn: "আপনার প্রমাণ",
  },
  "ev.independent": {
    en: "Independent accuracy", es: "Precisión independiente", fr: "Précision en autonomie", pt: "Precisão independente",
    ar: "الدقة المستقلة", sw: "Usahihi wa kujitegemea", hi: "स्वतंत्र सटीकता", id: "Akurasi mandiri",
    tl: "Katumpakan nang mag-isa", de: "Selbstständige Trefferquote", ja: "自力正答率", zh: "独立正确率",
    fa: "دقت مستقل", ur: "خودمختار درستگی", bn: "স্বাধীন নির্ভুলতা",
  },
  "ev.notProven": {
    en: "not yet proven without hints", es: "aún sin probar sin pistas", fr: "pas encore prouvé sans indice", pt: "ainda não provado sem dicas",
    ar: "لم تُثبت بعد بدون تلميحات", sw: "bado haijathibitishwa bila vidokezo", hi: "बिना संकेत अभी सिद्ध नहीं", id: "belum terbukti tanpa petunjuk",
    tl: "hindi pa napatunayan nang walang hint", de: "noch nicht ohne Hinweis bewiesen", ja: "ヒントなしでは未証明", zh: "尚未在无提示下证明",
    fa: "هنوز بدون راهنما اثبات نشده", ur: "ابھی بغیر اشارے ثابت نہیں", bn: "সংকেত ছাড়া এখনো প্রমাণিত নয়",
  },
  "ev.answers": {
    en: "Answers recorded", es: "Respuestas registradas", fr: "Réponses enregistrées", pt: "Respostas registradas",
    ar: "الإجابات المسجلة", sw: "Majibu yaliyorekodiwa", hi: "दर्ज उत्तर", id: "Jawaban tercatat", tl: "Mga sagot na naitala",
    de: "Erfasste Antworten", ja: "記録された解答", zh: "已记录作答", fa: "پاسخ‌های ثبت‌شده", ur: "درج شدہ جوابات", bn: "নথিভুক্ত উত্তর",
  },
  "ev.hints": {
    en: "Hints used", es: "Pistas usadas", fr: "Indices utilisés", pt: "Dicas usadas", ar: "التلميحات المستخدمة",
    sw: "Vidokezo vilivyotumika", hi: "उपयोग किए संकेत", id: "Petunjuk dipakai", tl: "Mga hint na ginamit",
    de: "Genutzte Hinweise", ja: "使用したヒント", zh: "使用提示数", fa: "راهنماهای استفاده‌شده", ur: "استعمال شدہ اشارے", bn: "ব্যবহৃত সংকেত",
  },
  "ev.lastSeen": {
    en: "Last practised", es: "Última práctica", fr: "Dernier entraînement", pt: "Última prática", ar: "آخر تدريب",
    sw: "Mazoezi ya mwisho", hi: "अंतिम अभ्यास", id: "Latihan terakhir", tl: "Huling praktis", de: "Zuletzt geübt",
    ja: "最終練習", zh: "最近练习", fa: "آخرین تمرین", ur: "آخری مشق", bn: "শেষ অনুশীলন",
  },
  "ev.issue": {
    en: "Common issue", es: "Problema habitual", fr: "Problème fréquent", pt: "Problema comum", ar: "مشكلة شائعة",
    sw: "Tatizo la kawaida", hi: "आम समस्या", id: "Masalah umum", tl: "Karaniwang problema", de: "Häufiges Problem",
    ja: "よくあるつまずき", zh: "常见问题", fa: "مشکل رایج", ur: "عام مسئلہ", bn: "সাধারণ সমস্যা",
  },
  "ev.none": {
    en: "No evidence yet — answer a few questions and this fills itself in.",
    es: "Aún sin evidencia: responde unas preguntas y esto se llenará.",
    fr: "Pas encore de preuves — répondez à quelques questions et cela se remplira.",
    pt: "Ainda sem evidência — responda algumas questões e isto se preenche.",
    ar: "لا أدلة بعد — أجب عن بعض الأسئلة وستمتلئ هذه البطاقة.",
    sw: "Hakuna ushahidi bado — jibu maswali machache na hii itajaa.",
    hi: "अभी कोई साक्ष्य नहीं — कुछ प्रश्न हल करें, यह भर जाएगा।",
    id: "Belum ada bukti — jawab beberapa soal dan ini akan terisi.",
    tl: "Wala pang ebidensya — sagutin ang ilang tanong at mapupuno ito.",
    de: "Noch keine Belege — beantworte ein paar Fragen, dann füllt es sich.",
    ja: "まだ根拠がありません。数問解けば埋まります。",
    zh: "还没有证据——做几道题，这一块就会填满。",
    fa: "هنوز شاهدی نیست — چند پرسش پاسخ دهید تا پر شود.",
    ur: "ابھی کوئی ثبوت نہیں — چند سوال حل کریں، یہ بھر جائے گا۔",
    bn: "এখনো প্রমাণ নেই — কয়েকটি প্রশ্নের উত্তর দিন, এটি ভরে যাবে।",
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
const incomplete = [];
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
console.log(`i18n analysis: +${added} strings (${Object.keys(T).length} keys × ${LANGS.length} languages)`);
