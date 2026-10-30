// One-shot i18n: MOMENTUM (the streak row and the milestones).
//
// Nineteen keys, and every one of them is a sentence a learner reads on Home or
// at the end of a session. They live in all fifteen dictionaries rather than in
// an English object with a runtime fallback, because a motivational line is the
// one place a product is most tempted to say "coming soon" in English under a
// translated heading.
//
// The milestone labels are the interesting half: a milestone renders `t(key)`
// from a table in lib/momentum.ts, so a label that exists only in `en` would
// show seven English badges to a Bengali learner and nothing would crash.
//
// Located BY DICTIONARY NAME, never by position: lib/i18n.ts's dictionaries are
// not in `LANGS` order, so pairing text with dictionary by index writes Urdu
// into German and no test notices.
//
// Run: node scripts/i18n-momentum.mjs
// Idempotent per key: a key already present is skipped and the rest are written.
import fs from "node:fs";

const FILE = "lib/i18n.ts";

/** File order of the dictionaries in lib/i18n.ts. */
const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "ur", "fa", "de", "ja", "zh", "bn"];

const TEXT = {
  en: {
    "mom.title": "Momentum",
    "mom.loading": "Reading your record…",
    "mom.streak": "{n}-day streak",
    "mom.none": "No run going yet",
    "mom.weekLine": "{n} of the last 7 days",
    "mom.startLine": "One answer today starts your run.",
    "mom.keepLine": "One answer today keeps your run alive.",
    "mom.todayDoneLine": "Today is counted.",
    "mom.next": "Next",
    "mom.of": "{n} of {total}",
    "mom.noneYet": "Nothing earned yet — the first one is one answer away.",
    "mom.foot": "Days with a recorded answer and counted milestones — not a measure of ability.",
    "mom.m.first": "First answer recorded",
    "mom.m.clean": "First hint-free answer",
    "mom.m.concepts": "Five different ideas",
    "mom.m.slip": "A slip you fixed",
    "mom.m.streak3": "Three days in a row",
    "mom.m.clean10": "Ten hint-free answers",
    "mom.m.transfer": "Proved on a new question",
    // THE DAILY TARGET, and the return-after-a-break copy. Every sentence here
    // is shaped so the NUMBER can be 1 without breaking grammar: "Best run: 1"
    // and "1 to go today" inflect nothing, where "1 days" would (which is
    // exactly what German did with "Serie von 1 Tagen" before it was read on a
    // screen). A target of five never needs a singular, but "{n} to go" does.
    "mom.goal": "Today",
    "mom.goalLeft": "{n} to go today.",
    "mom.goalDone": "Target met — anything more still counts.",
    "mom.best": "Best run: {n}.",
    "mom.back": "Today starts a new one.",
    "mom.justEarned": "Earned just now:",
  },
  es: {
    "mom.title": "Constancia",
    "mom.loading": "Leyendo tu registro…",
    "mom.streak": "Días seguidos: {n}",
    "mom.none": "Aún sin racha",
    "mom.weekLine": "{n} de los últimos 7 días",
    "mom.startLine": "Una respuesta hoy pone en marcha tu racha.",
    "mom.keepLine": "Una respuesta hoy mantiene viva tu racha.",
    "mom.todayDoneLine": "Hoy ya cuenta.",
    "mom.next": "Siguiente",
    "mom.of": "{n} de {total}",
    "mom.noneYet": "Todavía no hay nada conseguido: el primero está a una respuesta.",
    "mom.foot": "Días con una respuesta registrada e hitos contados; no mide tu capacidad.",
    "mom.m.first": "Primera respuesta registrada",
    "mom.m.clean": "Primera respuesta sin pistas",
    "mom.m.concepts": "Cinco ideas distintas",
    "mom.m.slip": "Un error que corregiste",
    "mom.m.streak3": "Tres días seguidos",
    "mom.m.clean10": "Diez respuestas sin pistas",
    "mom.m.transfer": "Demostrado en una pregunta nueva",
    "mom.goal": "Hoy",
    "mom.goalLeft": "Te quedan {n} hoy.",
    "mom.goalDone": "Objetivo cumplido: lo que hagas de más también cuenta.",
    "mom.best": "Mejor racha: {n}.",
    "mom.back": "Hoy empieza otra.",
    "mom.justEarned": "Conseguido ahora mismo:",
  },
  fr: {
    "mom.title": "Régularité",
    "mom.loading": "Lecture de ton suivi…",
    "mom.streak": "Jours d'affilée : {n}",
    "mom.none": "Pas encore de série",
    "mom.weekLine": "{n} des 7 derniers jours",
    "mom.startLine": "Une réponse aujourd'hui lance ta série.",
    "mom.keepLine": "Une réponse aujourd'hui maintient ta série.",
    "mom.todayDoneLine": "Aujourd'hui est compté.",
    "mom.next": "Ensuite",
    "mom.of": "{n} sur {total}",
    "mom.noneYet": "Rien d'acquis pour l'instant — le premier est à une réponse.",
    "mom.foot": "Des jours avec une réponse enregistrée et des étapes comptées — pas une mesure de tes capacités.",
    "mom.m.first": "Première réponse enregistrée",
    "mom.m.clean": "Première réponse sans indice",
    "mom.m.concepts": "Cinq idées différentes",
    "mom.m.slip": "Une erreur corrigée",
    "mom.m.streak3": "Trois jours d'affilée",
    "mom.m.clean10": "Dix réponses sans indice",
    "mom.m.transfer": "Prouvé sur une nouvelle question",
    "mom.goal": "Aujourd'hui",
    "mom.goalLeft": "Encore {n} aujourd'hui.",
    "mom.goalDone": "Objectif atteint — le reste compte aussi.",
    "mom.best": "Meilleure série : {n}.",
    "mom.back": "Aujourd'hui en commence une autre.",
    "mom.justEarned": "Obtenu à l'instant :",
  },
  pt: {
    "mom.title": "Constância",
    "mom.loading": "A ler o teu registo…",
    "mom.streak": "Dias seguidos: {n}",
    "mom.none": "Ainda sem sequência",
    "mom.weekLine": "{n} dos últimos 7 dias",
    "mom.startLine": "Uma resposta hoje inicia a tua sequência.",
    "mom.keepLine": "Uma resposta hoje mantém a sequência viva.",
    "mom.todayDoneLine": "Hoje já conta.",
    "mom.next": "A seguir",
    "mom.of": "{n} de {total}",
    "mom.noneYet": "Ainda nada alcançado — o primeiro está a uma resposta.",
    "mom.foot": "Dias com uma resposta registada e marcos contados — não mede a tua capacidade.",
    "mom.m.first": "Primeira resposta registada",
    "mom.m.clean": "Primeira resposta sem ajudas",
    "mom.m.concepts": "Cinco ideias diferentes",
    "mom.m.slip": "Um erro que corrigiste",
    "mom.m.streak3": "Três dias seguidos",
    "mom.m.clean10": "Dez respostas sem ajudas",
    "mom.m.transfer": "Provado numa pergunta nova",
    "mom.goal": "Hoje",
    "mom.goalLeft": "Faltam {n} hoje.",
    "mom.goalDone": "Objetivo cumprido — o que fizeres a mais também conta.",
    "mom.best": "Melhor sequência: {n}.",
    "mom.back": "Hoje começa outra.",
    "mom.justEarned": "Ganho agora mesmo:",
  },
  ar: {
    "mom.title": "الاستمرارية",
    "mom.loading": "جارٍ قراءة سجلك…",
    "mom.streak": "أيام متتالية: {n}",
    "mom.none": "لا سلسلة بعد",
    "mom.weekLine": "{n} من آخر 7 أيام",
    "mom.startLine": "إجابة واحدة اليوم تبدأ سلسلتك.",
    "mom.keepLine": "إجابة واحدة اليوم تُبقي سلسلتك حيّة.",
    "mom.todayDoneLine": "تم احتساب اليوم.",
    "mom.next": "التالي",
    "mom.of": "{n} من {total}",
    "mom.noneYet": "لم تتحقق أي خطوة بعد — الأولى على بُعد إجابة واحدة.",
    "mom.foot": "أيام فيها إجابة مسجّلة وخطوات معدودة — وليست قياسًا لقدرتك.",
    "mom.m.first": "أول إجابة مسجّلة",
    "mom.m.clean": "أول إجابة دون مساعدة",
    "mom.m.concepts": "خمس أفكار مختلفة",
    "mom.m.slip": "خطأ أصلحته",
    "mom.m.streak3": "ثلاثة أيام متتالية",
    "mom.m.clean10": "عشر إجابات دون مساعدة",
    "mom.m.transfer": "أُثبت في سؤال جديد",
    "mom.goal": "اليوم",
    "mom.goalLeft": "بقي {n} اليوم.",
    "mom.goalDone": "تحقق الهدف — وما زاد عنه يُحتسب أيضًا.",
    "mom.best": "أفضل سلسلة: {n}.",
    "mom.back": "اليوم تبدأ سلسلة جديدة.",
    "mom.justEarned": "تحقق الآن:",
  },
  sw: {
    "mom.title": "Uthabiti",
    "mom.loading": "Inasoma kumbukumbu yako…",
    "mom.streak": "Siku {n} mfululizo",
    "mom.none": "Bado hakuna mfululizo",
    "mom.weekLine": "{n} kati ya siku 7 zilizopita",
    "mom.startLine": "Jibu moja leo huanzisha mfululizo wako.",
    "mom.keepLine": "Jibu moja leo huendeleza mfululizo wako.",
    "mom.todayDoneLine": "Leo imehesabiwa.",
    "mom.next": "Kifuatacho",
    "mom.of": "{n} kati ya {total}",
    "mom.noneYet": "Hakuna kilichopatikana bado — cha kwanza kiko jibu moja mbele.",
    "mom.foot": "Siku zenye jibu lililorekodiwa na hatua zilizohesabiwa — si kipimo cha uwezo wako.",
    "mom.m.first": "Jibu la kwanza limerekodiwa",
    "mom.m.clean": "Jibu la kwanza bila msaada",
    "mom.m.concepts": "Mawazo matano tofauti",
    "mom.m.slip": "Kosa ulilorekebisha",
    "mom.m.streak3": "Siku tatu mfululizo",
    "mom.m.clean10": "Majibu kumi bila msaada",
    "mom.m.transfer": "Imedhibitishwa kwenye swali jipya",
    "mom.goal": "Leo",
    "mom.goalLeft": "Zimebaki {n} leo.",
    "mom.goalDone": "Lengo limefikiwa — zaidi ya hapo pia huhesabiwa.",
    "mom.best": "Mfululizo bora: {n}.",
    "mom.back": "Leo unaanza mpya.",
    "mom.justEarned": "Imepatikana sasa hivi:",
  },
  hi: {
    "mom.title": "निरंतरता",
    "mom.loading": "आपका रिकॉर्ड पढ़ा जा रहा है…",
    "mom.streak": "{n} दिन की लय",
    "mom.none": "अभी कोई लय नहीं",
    "mom.weekLine": "पिछले 7 दिनों में से {n}",
    "mom.startLine": "आज एक उत्तर देने से आपकी लय शुरू होती है।",
    "mom.keepLine": "आज एक उत्तर देने से आपकी लय बनी रहती है।",
    "mom.todayDoneLine": "आज गिना गया है।",
    "mom.next": "अगला",
    "mom.of": "{n} / {total}",
    "mom.noneYet": "अभी कुछ हासिल नहीं — पहला एक उत्तर दूर है।",
    "mom.foot": "जिन दिनों में उत्तर दर्ज हुआ और जो पड़ाव गिने गए — यह आपकी क्षमता का माप नहीं है।",
    "mom.m.first": "पहला उत्तर दर्ज",
    "mom.m.clean": "बिना संकेत पहला सही उत्तर",
    "mom.m.concepts": "पाँच अलग विचार",
    "mom.m.slip": "आपने सुधारी हुई गलती",
    "mom.m.streak3": "लगातार तीन दिन",
    "mom.m.clean10": "बिना संकेत दस सही उत्तर",
    "mom.m.transfer": "नए सवाल पर सिद्ध",
    "mom.goal": "आज",
    "mom.goalLeft": "आज {n} बाकी।",
    "mom.goalDone": "लक्ष्य पूरा — इससे ज़्यादा भी गिना जाता है।",
    "mom.best": "सबसे लंबी लय: {n}।",
    "mom.back": "आज नई लय शुरू होती है।",
    "mom.justEarned": "अभी हासिल हुआ:",
  },
  id: {
    "mom.title": "Konsistensi",
    "mom.loading": "Membaca catatanmu…",
    "mom.streak": "Rentetan {n} hari",
    "mom.none": "Belum ada rentetan",
    "mom.weekLine": "{n} dari 7 hari terakhir",
    "mom.startLine": "Satu jawaban hari ini memulai rentetanmu.",
    "mom.keepLine": "Satu jawaban hari ini menjaga rentetanmu.",
    "mom.todayDoneLine": "Hari ini sudah terhitung.",
    "mom.next": "Berikutnya",
    "mom.of": "{n} dari {total}",
    "mom.noneYet": "Belum ada yang tercapai — yang pertama tinggal satu jawaban.",
    "mom.foot": "Hari dengan jawaban tercatat dan tonggak yang dihitung — bukan ukuran kemampuanmu.",
    "mom.m.first": "Jawaban pertama tercatat",
    "mom.m.clean": "Jawaban pertama tanpa petunjuk",
    "mom.m.concepts": "Lima gagasan berbeda",
    "mom.m.slip": "Kesalahan yang kamu perbaiki",
    "mom.m.streak3": "Tiga hari berturut-turut",
    "mom.m.clean10": "Sepuluh jawaban tanpa petunjuk",
    "mom.m.transfer": "Terbukti pada soal baru",
    "mom.goal": "Hari ini",
    "mom.goalLeft": "Tersisa {n} hari ini.",
    "mom.goalDone": "Target tercapai — lebih dari itu tetap dihitung.",
    "mom.best": "Rentetan terbaik: {n}.",
    "mom.back": "Hari ini memulai yang baru.",
    "mom.justEarned": "Baru saja tercapai:",
  },
  tl: {
    "mom.title": "Pagpapatuloy",
    "mom.loading": "Binabasa ang iyong talaan…",
    "mom.streak": "{n} araw na sunod-sunod",
    "mom.none": "Wala pang sunod-sunod",
    "mom.weekLine": "{n} sa huling 7 araw",
    "mom.startLine": "Isang sagot ngayon ang magsisimula ng iyong sunod-sunod.",
    "mom.keepLine": "Isang sagot ngayon ang magpapatuloy ng iyong sunod-sunod.",
    "mom.todayDoneLine": "Bilang na ang ngayon.",
    "mom.next": "Susunod",
    "mom.of": "{n} sa {total}",
    "mom.noneYet": "Wala pang nakamit — isang sagot lang ang layo ng una.",
    "mom.foot": "Mga araw na may nakatalang sagot at mga bilang na hakbang — hindi sukat ng kakayahan.",
    "mom.m.first": "Naitala ang unang sagot",
    "mom.m.clean": "Unang sagot na walang tulong",
    "mom.m.concepts": "Limang magkaibang ideya",
    "mom.m.slip": "Naitama mong pagkakamali",
    "mom.m.streak3": "Tatlong araw na sunod-sunod",
    "mom.m.clean10": "Sampung sagot na walang tulong",
    "mom.m.transfer": "Napatunayan sa bagong tanong",
    "mom.goal": "Ngayon",
    "mom.goalLeft": "{n} pa ngayon.",
    "mom.goalDone": "Naabot ang target — bilang pa rin ang sobra.",
    "mom.best": "Pinakamahabang sunod-sunod: {n}.",
    "mom.back": "Ngayon magsisimula ng bago.",
    "mom.justEarned": "Kararaang nakamit:",
  },
  ur: {
    "mom.title": "تسلسل",
    "mom.loading": "آپ کا ریکارڈ پڑھا جا رہا ہے…",
    "mom.streak": "{n} دن کا تسلسل",
    "mom.none": "ابھی کوئی تسلسل نہیں",
    "mom.weekLine": "پچھلے 7 دنوں میں سے {n}",
    "mom.startLine": "آج ایک جواب دینے سے آپ کا تسلسل شروع ہوتا ہے۔",
    "mom.keepLine": "آج ایک جواب دینے سے تسلسل قائم رہتا ہے۔",
    "mom.todayDoneLine": "آج شمار ہو گیا۔",
    "mom.next": "اگلا",
    "mom.of": "{n} / {total}",
    "mom.noneYet": "ابھی کچھ حاصل نہیں — پہلا ایک جواب کی دوری پر ہے۔",
    "mom.foot": "وہ دن جن میں جواب درج ہوا اور گنے گئے سنگِ میل — یہ آپ کی صلاحیت کا پیمانہ نہیں۔",
    "mom.m.first": "پہلا جواب درج",
    "mom.m.clean": "بغیر اشارے پہلا جواب",
    "mom.m.concepts": "پانچ مختلف خیال",
    "mom.m.slip": "آپ کی درست کی ہوئی غلطی",
    "mom.m.streak3": "لگاتار تین دن",
    "mom.m.clean10": "دس جواب بغیر اشارے",
    "mom.m.transfer": "نئے سوال پر ثابت",
    "mom.goal": "آج",
    "mom.goalLeft": "آج {n} باقی ہیں۔",
    "mom.goalDone": "ہدف پورا — اس سے زیادہ بھی شمار ہوتا ہے۔",
    "mom.best": "بہترین تسلسل: {n}۔",
    "mom.back": "آج نیا تسلسل شروع ہوتا ہے۔",
    "mom.justEarned": "ابھی حاصل ہوا:",
  },
  fa: {
    "mom.title": "پیوستگی",
    "mom.loading": "در حال خواندن سابقهٔ شما…",
    "mom.streak": "زنجیرهٔ {n} روزه",
    "mom.none": "هنوز زنجیره‌ای نیست",
    "mom.weekLine": "{n} از ۷ روز گذشته",
    "mom.startLine": "یک پاسخ امروز زنجیرهٔ شما را آغاز می‌کند.",
    "mom.keepLine": "یک پاسخ امروز زنجیره را زنده نگه می‌دارد.",
    "mom.todayDoneLine": "امروز حساب شد.",
    "mom.next": "بعدی",
    "mom.of": "{n} از {total}",
    "mom.noneYet": "هنوز چیزی به دست نیامده — اولی یک پاسخ فاصله دارد.",
    "mom.foot": "روزهایی با پاسخ ثبت‌شده و گام‌های شمرده‌شده — نه سنجش توانایی شما.",
    "mom.m.first": "نخستین پاسخ ثبت شد",
    "mom.m.clean": "نخستین پاسخ بدون راهنما",
    "mom.m.concepts": "پنج ایدهٔ متفاوت",
    "mom.m.slip": "خطایی که اصلاح کردید",
    "mom.m.streak3": "سه روز پیاپی",
    "mom.m.clean10": "ده پاسخ بدون راهنما",
    "mom.m.transfer": "در پرسشی تازه اثبات شد",
    "mom.goal": "امروز",
    "mom.goalLeft": "{n} امروز باقی مانده.",
    "mom.goalDone": "هدف محقق شد — بیشتر از آن هم حساب می‌شود.",
    "mom.best": "بهترین زنجیره: {n}.",
    "mom.back": "امروز زنجیرهٔ تازه‌ای آغاز می‌شود.",
    "mom.justEarned": "همین حالا به دست آمد:",
  },
  de: {
    "mom.title": "Dranbleiben",
    "mom.loading": "Dein Verlauf wird gelesen…",
    "mom.streak": "Tage in Folge: {n}",
    "mom.none": "Noch keine Serie",
    "mom.weekLine": "{n} der letzten 7 Tage",
    "mom.startLine": "Eine Antwort heute startet deine Serie.",
    "mom.keepLine": "Eine Antwort heute hält deine Serie am Leben.",
    "mom.todayDoneLine": "Heute zählt mit.",
    "mom.next": "Als Nächstes",
    "mom.of": "{n} von {total}",
    "mom.noneYet": "Noch nichts erreicht — das erste ist eine Antwort entfernt.",
    "mom.foot": "Tage mit einer aufgezeichneten Antwort und gezählte Meilensteine — kein Maß für dein Können.",
    "mom.m.first": "Erste Antwort aufgezeichnet",
    "mom.m.clean": "Erste Antwort ohne Hinweis",
    "mom.m.concepts": "Fünf verschiedene Ideen",
    "mom.m.slip": "Ein Fehler, den du behoben hast",
    "mom.m.streak3": "Drei Tage in Folge",
    "mom.m.clean10": "Zehn Antworten ohne Hinweis",
    "mom.m.transfer": "Bei einer neuen Frage bewiesen",
    "mom.goal": "Heute",
    "mom.goalLeft": "Heute noch {n}.",
    "mom.goalDone": "Ziel erreicht — alles Weitere zählt trotzdem.",
    "mom.best": "Beste Serie: {n}.",
    "mom.back": "Heute beginnt eine neue.",
    "mom.justEarned": "Gerade erreicht:",
  },
  ja: {
    "mom.title": "継続",
    "mom.loading": "記録を読み込んでいます…",
    "mom.streak": "{n}日連続",
    "mom.none": "まだ連続記録はありません",
    "mom.weekLine": "過去7日のうち{n}日",
    "mom.startLine": "今日1問答えると連続記録が始まります。",
    "mom.keepLine": "今日1問答えると連続記録が続きます。",
    "mom.todayDoneLine": "今日は記録済みです。",
    "mom.next": "次",
    "mom.of": "{n} / {total}",
    "mom.noneYet": "まだ達成はありません。最初の一つはあと1問です。",
    "mom.foot": "解答が記録された日と数えた到達点です。能力の測定ではありません。",
    "mom.m.first": "最初の解答を記録",
    "mom.m.clean": "ヒントなしで最初の正解",
    "mom.m.concepts": "5つの異なる考え",
    "mom.m.slip": "直したつまずき",
    "mom.m.streak3": "3日連続",
    "mom.m.clean10": "ヒントなしの正解10問",
    "mom.m.transfer": "新しい問題で証明",
    "mom.goal": "今日",
    "mom.goalLeft": "今日はあと{n}問。",
    "mom.goalDone": "目標達成 — それ以上も記録されます。",
    "mom.best": "最長記録: {n}。",
    "mom.back": "今日からまた始まります。",
    "mom.justEarned": "たった今の達成:",
  },
  zh: {
    "mom.title": "坚持",
    "mom.loading": "正在读取你的记录…",
    "mom.streak": "连续 {n} 天",
    "mom.none": "还没有连续记录",
    "mom.weekLine": "最近 7 天中有 {n} 天",
    "mom.startLine": "今天答一题就开始你的连续记录。",
    "mom.keepLine": "今天答一题就能保持连续记录。",
    "mom.todayDoneLine": "今天已计入。",
    "mom.next": "下一个",
    "mom.of": "{n} / {total}",
    "mom.noneYet": "还没有达成任何一项——第一项只差一题。",
    "mom.foot": "有作答记录的天数和已计数的里程碑——不是能力测评。",
    "mom.m.first": "记录第一次作答",
    "mom.m.clean": "第一次无提示答对",
    "mom.m.concepts": "五个不同的概念",
    "mom.m.slip": "你修正的失误",
    "mom.m.streak3": "连续三天",
    "mom.m.clean10": "十次无提示答对",
    "mom.m.transfer": "在新题上得到证明",
    "mom.goal": "今天",
    "mom.goalLeft": "今天还差 {n} 题。",
    "mom.goalDone": "目标达成 — 多做也算数。",
    "mom.best": "最长纪录：{n}。",
    "mom.back": "今天重新开始。",
    "mom.justEarned": "刚刚达成：",
  },
  bn: {
    "mom.title": "ধারাবাহিকতা",
    "mom.loading": "তোমার রেকর্ড পড়া হচ্ছে…",
    "mom.streak": "টানা {n} দিন",
    "mom.none": "এখনো কোনো ধারা নেই",
    "mom.weekLine": "গত ৭ দিনের মধ্যে {n} দিন",
    "mom.startLine": "আজ একটা উত্তর দিলেই তোমার ধারা শুরু হয়।",
    "mom.keepLine": "আজ একটা উত্তর দিলে ধারা চলতে থাকে।",
    "mom.todayDoneLine": "আজ গণনা হয়েছে।",
    "mom.next": "পরবর্তী",
    "mom.of": "{n} / {total}",
    "mom.noneYet": "এখনো কিছু পাওয়া যায়নি — প্রথমটি মাত্র এক উত্তরের দূরে।",
    "mom.foot": "যে দিনগুলোতে উত্তর রেকর্ড হয়েছে এবং যেসব ধাপ গোনা হয়েছে — এটি তোমার সামর্থ্যের মাপকাঠি নয়।",
    "mom.m.first": "প্রথম উত্তর রেকর্ড হয়েছে",
    "mom.m.clean": "ইঙ্গিত ছাড়া প্রথম সঠিক উত্তর",
    "mom.m.concepts": "পাঁচটি আলাদা ধারণা",
    "mom.m.slip": "তুমি শুধরে নেওয়া ভুল",
    "mom.m.streak3": "টানা তিন দিন",
    "mom.m.clean10": "ইঙ্গিত ছাড়া দশটি উত্তর",
    "mom.m.transfer": "নতুন প্রশ্নে প্রমাণিত",
    "mom.goal": "আজ",
    "mom.goalLeft": "আজ আর {n}টি বাকি।",
    "mom.goalDone": "লক্ষ্য পূরণ — এর বেশি হলেও গণনা হয়।",
    "mom.best": "সেরা ধারা: {n}।",
    "mom.back": "আজ নতুন ধারা শুরু হয়।",
    "mom.justEarned": "এইমাত্র অর্জিত:",
  },
};

const KEYS = Object.keys(TEXT.en);
for (const code of LANGS) {
  const got = Object.keys(TEXT[code] ?? {});
  if (got.length !== KEYS.length) {
    throw new Error(`${code}: ${got.length} texts for ${KEYS.length} keys — refusing to write a half dictionary`);
  }
  const stray = got.filter((k) => !KEYS.includes(k));
  if (stray.length) throw new Error(`${code}: keys that are not in the set (${stray.join(", ")})`);
}

const src = fs.readFileSync(FILE, "utf8");
const lines = src.split("\n");

/** The [start, end) line range of ONE dictionary, found by name. */
function dictSpan(code) {
  const head = lines.findIndex((l) => /^(export )?const \w+: Dict = \{$/.test(l) && l.includes(`const ${code}: Dict = {`));
  if (head < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  for (let i = head + 1; i < lines.length; i += 1) {
    if (/^\s*\};\s*$/.test(lines[i])) return [head, i];
  }
  throw new Error(`${code}: its dictionary never closes`);
}

const escape = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// Collect inserts first, then splice bottom-up so earlier line numbers stay valid.
const inserts = [];
let wrote = 0;
let skipped = 0;
for (const code of LANGS) {
  const [start, end] = dictSpan(code);
  const body = lines.slice(start, end).join("\n");
  const missing = KEYS.filter((k) => !body.includes(`"${k}":`));
  if (missing.length === 0) { skipped += KEYS.length; continue; }
  const block = missing.map((k) => `  "${k}": "${escape(TEXT[code][k])}",`).join("\n");
  inserts.push({ at: end, block });
  wrote += missing.length;
}

for (const { at, block } of inserts.sort((a, b) => b.at - a.at)) {
  lines.splice(at, 0, block);
}
fs.writeFileSync(FILE, lines.join("\n"));

// POST-CONDITION: no dictionary may be missing a key now, and each must carry
// its OWN text (a block pasted into the wrong dictionary is the failure the
// name-based lookup exists to prevent).
const after = fs.readFileSync(FILE, "utf8").split("\n");
function spanOf(code) {
  const head = after.findIndex((l) => /^(export )?const \w+: Dict = \{$/.test(l) && l.includes(`const ${code}: Dict = {`));
  for (let i = head + 1; i < after.length; i += 1) if (/^\s*\};\s*$/.test(after[i])) return [head, i];
  throw new Error(`${code}: its dictionary never closes`);
}
const spans = LANGS.map((code) => ({ code, body: after.slice(...spanOf(code)).join("\n") }));
for (const { code, body } of spans) {
  const missing = KEYS.filter((k) => !body.includes(`"${k}":`));
  if (missing.length) throw new Error(`${code}: still missing ${missing.join(", ")}`);
  const mine = KEYS.filter((k) => body.includes(`"${k}": "${escape(TEXT[code][k])}"`));
  if (mine.length !== KEYS.length) {
    // NAME the keys, not just the count: a bare number sends the next reader
    // back through 280 lines to find which line disagreed.
    const wrong = KEYS.filter((k) => !mine.includes(k));
    throw new Error(`${code}: ${wrong.length} key(s) carry another dictionary's text (${wrong.join(", ")})`);
  }
}

console.log(`momentum: ${wrote} keys written, ${skipped} already present, ${KEYS.length} keys × ${LANGS.length} dictionaries verified`);
