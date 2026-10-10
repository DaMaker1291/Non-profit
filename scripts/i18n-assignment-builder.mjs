// One-shot i18n: the guided assignment builder on `/teacher` (`asgb.*`).
//
// WHY THESE STRINGS EXIST. Setting work used to be an expanding form inside
// every class card: a scroll of every concept in the course, a date, a label,
// one button. The sequence a teacher thinks in — who is this for, what should
// they learn, when is it due, show me what I am about to set — had no words
// because it had no steps, and aiming work at three learners rather than thirty
// was not expressible at all.
//
// One of these strings is deliberate honesty rather than UI: `asgb.adapted`
// answers the "how should it adapt?" and "assessment or practice?" questions by
// saying what the product DOES (the serve differentiates per learner from their
// own evidence) and where exam conditions actually live (a paper). Offering
// mode and adaptivity pickers the record cannot honour would be a form that
// changes nothing — the failure this vocabulary exists to avoid.
//
// Same convention and guard as its siblings: insert beside a key that must
// appear exactly fifteen times, author by hand, refuse to guess.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"asg.setBy"';

const TEXTS = [
  ["en", {
    "asgb.title": "Create an assignment",
    "asgb.back": "Back",
    "asgb.stepWho": "Who is this for?",
    "asgb.whoAll": "The whole class",
    "asgb.whoSome": "Selected learners",
    "asgb.stepWhat": "What should they learn?",
    "asgb.search": "Search this course",
    "asgb.cap": "Up to {n} ideas",
    "asgb.stepWhen": "When is it due?",
    "asgb.adapted": "Each learner is taught the idea and practises it at the level their own evidence calls for — the engine differentiates, so there is nothing to configure here. Exam conditions belong to a paper, not to assigned practice.",
    "asgb.created": "Assignment created. Your class can now start.",
    "asgb.createdSome": "Assignment created. {n} learners can now start.",
    "asgb.needPick": "Choose at least one idea, one learner and a deadline.",
    "asgb.wholeClass": "Whole class",
  }],
  ["es", {
    "asgb.title": "Crear una tarea",
    "asgb.back": "Atrás",
    "asgb.stepWho": "¿Para quién es?",
    "asgb.whoAll": "Toda la clase",
    "asgb.whoSome": "Estudiantes seleccionados",
    "asgb.stepWhat": "¿Qué deben aprender?",
    "asgb.search": "Buscar en este curso",
    "asgb.cap": "Hasta {n} ideas",
    "asgb.stepWhen": "¿Cuándo vence?",
    "asgb.adapted": "Cada estudiante aprende la idea y la practica al nivel que indica su propia evidencia: el motor diferencia, así que aquí no hay nada que configurar. Las condiciones de examen son cosa de un examen, no del trabajo asignado.",
    "asgb.created": "Tarea creada. Tu clase ya puede empezar.",
    "asgb.createdSome": "Tarea creada. {n} estudiantes ya pueden empezar.",
    "asgb.needPick": "Elige al menos una idea, un estudiante y una fecha límite.",
    "asgb.wholeClass": "Toda la clase",
  }],
  ["fr", {
    "asgb.title": "Créer un devoir",
    "asgb.back": "Retour",
    "asgb.stepWho": "Pour qui ?",
    "asgb.whoAll": "Toute la classe",
    "asgb.whoSome": "Élèves sélectionnés",
    "asgb.stepWhat": "Que doivent-ils apprendre ?",
    "asgb.search": "Rechercher dans ce cours",
    "asgb.cap": "Jusqu'à {n} idées",
    "asgb.stepWhen": "Pour quand ?",
    "asgb.adapted": "Chaque élève apprend l'idée et la travaille au niveau que ses propres preuves appellent — le moteur différencie, il n'y a donc rien à configurer ici. Les conditions d'examen relèvent d'un sujet, pas d'un devoir.",
    "asgb.created": "Devoir créé. Votre classe peut commencer.",
    "asgb.createdSome": "Devoir créé. {n} élèves peuvent commencer.",
    "asgb.needPick": "Choisissez au moins une idée, un élève et une date limite.",
    "asgb.wholeClass": "Toute la classe",
  }],
  ["pt", {
    "asgb.title": "Criar uma tarefa",
    "asgb.back": "Voltar",
    "asgb.stepWho": "Para quem é?",
    "asgb.whoAll": "A turma inteira",
    "asgb.whoSome": "Alunos selecionados",
    "asgb.stepWhat": "O que devem aprender?",
    "asgb.search": "Procurar neste curso",
    "asgb.cap": "Até {n} ideias",
    "asgb.stepWhen": "Quando é a entrega?",
    "asgb.adapted": "Cada aluno aprende a ideia e pratica-a ao nível que as suas próprias evidências exigem — o motor diferencia, por isso não há nada a configurar aqui. As condições de exame pertencem a um exame, não ao trabalho atribuído.",
    "asgb.created": "Tarefa criada. A tua turma já pode começar.",
    "asgb.createdSome": "Tarefa criada. {n} alunos já podem começar.",
    "asgb.needPick": "Escolhe pelo menos uma ideia, um aluno e um prazo.",
    "asgb.wholeClass": "Toda a turma",
  }],
  ["ar", {
    "asgb.title": "إنشاء تكليف",
    "asgb.back": "رجوع",
    "asgb.stepWho": "لمن هذا العمل؟",
    "asgb.whoAll": "الصف بأكمله",
    "asgb.whoSome": "طلاب مختارون",
    "asgb.stepWhat": "ماذا ينبغي أن يتعلموا؟",
    "asgb.search": "ابحث في هذا المقرر",
    "asgb.cap": "حتى {n} أفكار",
    "asgb.stepWhen": "ما موعد التسليم؟",
    "asgb.adapted": "يتعلّم كل طالب الفكرة ويتدرّب عليها بالمستوى الذي يستدعيه دليله الخاص — المحرّك يفرّق بنفسه، فلا شيء لضبطه هنا. أما ظروف الامتحان فمكانها ورقة الامتحان لا العمل المُكلَّف.",
    "asgb.created": "أُنشئ التكليف. صفك يمكنه البدء الآن.",
    "asgb.createdSome": "أُنشئ التكليف. {n} طالبًا يمكنهم البدء الآن.",
    "asgb.needPick": "اختر فكرة واحدة وطالبًا واحدًا وموعدًا للتسليم على الأقل.",
    "asgb.wholeClass": "الصف بأكمله",
  }],
  ["sw", {
    "asgb.title": "Unda kazi",
    "asgb.back": "Rudi",
    "asgb.stepWho": "Hii ni ya nani?",
    "asgb.whoAll": "Darasa lote",
    "asgb.whoSome": "Wanafunzi waliochaguliwa",
    "asgb.stepWhat": "Wanapaswa kujifunza nini?",
    "asgb.search": "Tafuta katika kozi hii",
    "asgb.cap": "Hadi mawazo {n}",
    "asgb.stepWhen": "Inakamilika lini?",
    "asgb.adapted": "Kila mwanafunzi hujifunza wazo na hufanya mazoezi kwa kiwango ambacho ushahidi wake mwenyewe unahitaji — injini hufanya upambanuzi, kwa hivyo hakuna cha kuweka hapa. Masharti ya mtihani ni ya karatasi ya mtihani, si ya kazi iliyopangwa.",
    "asgb.created": "Kazi imeundwa. Darasa lako linaweza kuanza.",
    "asgb.createdSome": "Kazi imeundwa. Wanafunzi {n} wanaweza kuanza.",
    "asgb.needPick": "Chagua angalau wazo moja, mwanafunzi mmoja na tarehe ya mwisho.",
    "asgb.wholeClass": "Darasa lote",
  }],
  ["hi", {
    "asgb.title": "असाइनमेंट बनाएँ",
    "asgb.back": "वापस",
    "asgb.stepWho": "यह किसके लिए है?",
    "asgb.whoAll": "पूरी कक्षा",
    "asgb.whoSome": "चुने हुए छात्र",
    "asgb.stepWhat": "उन्हें क्या सीखना चाहिए?",
    "asgb.search": "इस पाठ्यक्रम में खोजें",
    "asgb.cap": "अधिकतम {n} अवधारणाएँ",
    "asgb.stepWhen": "इसकी समय-सीमा क्या है?",
    "asgb.adapted": "हर छात्र अवधारणा सीखता है और उस स्तर पर अभ्यास करता है जो उसके अपने प्रमाण माँगते हैं — इंजन स्वयं अंतर करता है, इसलिए यहाँ कुछ सेट करने को नहीं है। परीक्षा की शर्तें पेपर की बात हैं, दिए गए अभ्यास की नहीं।",
    "asgb.created": "असाइनमेंट बन गया। आपकी कक्षा अब शुरू कर सकती है।",
    "asgb.createdSome": "असाइनमेंट बन गया। {n} छात्र अब शुरू कर सकते हैं।",
    "asgb.needPick": "कम से कम एक अवधारणा, एक छात्र और एक समय-सीमा चुनें।",
    "asgb.wholeClass": "पूरी कक्षा",
  }],
  ["id", {
    "asgb.title": "Buat tugas",
    "asgb.back": "Kembali",
    "asgb.stepWho": "Untuk siapa ini?",
    "asgb.whoAll": "Seluruh kelas",
    "asgb.whoSome": "Siswa terpilih",
    "asgb.stepWhat": "Apa yang harus mereka pelajari?",
    "asgb.search": "Cari di kursus ini",
    "asgb.cap": "Hingga {n} ide",
    "asgb.stepWhen": "Kapan tenggatnya?",
    "asgb.adapted": "Setiap siswa mempelajari ide dan berlatih pada tingkat yang dituntut oleh buktinya sendiri — mesin yang membedakan, jadi tidak ada yang perlu diatur di sini. Kondisi ujian tempatnya di kertas ujian, bukan di tugas.",
    "asgb.created": "Tugas dibuat. Kelasmu bisa mulai.",
    "asgb.createdSome": "Tugas dibuat. {n} siswa bisa mulai.",
    "asgb.needPick": "Pilih minimal satu ide, satu siswa dan satu tenggat.",
    "asgb.wholeClass": "Seluruh kelas",
  }],
  ["tl", {
    "asgb.title": "Gumawa ng takdang gawain",
    "asgb.back": "Bumalik",
    "asgb.stepWho": "Para kanino ito?",
    "asgb.whoAll": "Buong klase",
    "asgb.whoSome": "Mga piling mag-aaral",
    "asgb.stepWhat": "Ano ang dapat nilang matutunan?",
    "asgb.search": "Maghanap sa kursong ito",
    "asgb.cap": "Hanggang {n} ideya",
    "asgb.stepWhen": "Kailan ang takda?",
    "asgb.adapted": "Ang bawat mag-aaral ay nag-aaral ng ideya at nagpapraktis sa antas na hinihingi ng sarili nilang ebidensiya — ang makina ang nag-iiba-iba, kaya wala nang ise-set dito. Ang mga kondisyon ng pagsusulit ay para sa papel, hindi sa takdang gawain.",
    "asgb.created": "Nagawa ang takdang gawain. Maaari nang magsimula ang klase mo.",
    "asgb.createdSome": "Nagawa ang takdang gawain. {n} mag-aaral na ang maaaring magsimula.",
    "asgb.needPick": "Pumili ng hindi bababa sa isang ideya, isang mag-aaral at isang takda.",
    "asgb.wholeClass": "Buong klase",
  }],
  ["de", {
    "asgb.title": "Aufgabe anlegen",
    "asgb.back": "Zurück",
    "asgb.stepWho": "Für wen ist das?",
    "asgb.whoAll": "Die ganze Klasse",
    "asgb.whoSome": "Ausgewählte Lernende",
    "asgb.stepWhat": "Was sollen sie lernen?",
    "asgb.search": "Diesen Kurs durchsuchen",
    "asgb.cap": "Bis zu {n} Ideen",
    "asgb.stepWhen": "Bis wann?",
    "asgb.adapted": "Jede Lernende lernt die Idee und übt sie auf dem Niveau, das ihre eigenen Belege verlangen — die Engine differenziert selbst, hier gibt es also nichts einzustellen. Prüfungsbedingungen gehören in eine Klausur, nicht in eine Aufgabe.",
    "asgb.created": "Aufgabe angelegt. Deine Klasse kann beginnen.",
    "asgb.createdSome": "Aufgabe angelegt. {n} Lernende können beginnen.",
    "asgb.needPick": "Wähle mindestens eine Idee, eine Lernende und einen Termin.",
    "asgb.wholeClass": "Die ganze Klasse",
  }],
  ["ja", {
    "asgb.title": "課題を作成",
    "asgb.back": "戻る",
    "asgb.stepWho": "誰のための課題ですか？",
    "asgb.whoAll": "クラス全員",
    "asgb.whoSome": "選んだ学習者",
    "asgb.stepWhat": "何を学ばせますか？",
    "asgb.search": "このコースを検索",
    "asgb.cap": "最大 {n} 個",
    "asgb.stepWhen": "締め切りはいつですか？",
    "asgb.adapted": "学習者ごとに、自分の根拠が求める水準でその概念を学び練習します — エンジンが自動で調整するので、ここで設定することはありません。試験の条件は試験問題のもので、課題のものではありません。",
    "asgb.created": "課題を作成しました。クラスが始められます。",
    "asgb.createdSome": "課題を作成しました。{n} 名の学習者が始められます。",
    "asgb.needPick": "少なくとも 1 つの概念、1 人の学習者、締め切りを選んでください。",
    "asgb.wholeClass": "クラス全員",
  }],
  ["zh", {
    "asgb.title": "创建作业",
    "asgb.back": "返回",
    "asgb.stepWho": "这是给谁的？",
    "asgb.whoAll": "全班",
    "asgb.whoSome": "选定的学生",
    "asgb.stepWhat": "他们应该学什么？",
    "asgb.search": "在本课程中搜索",
    "asgb.cap": "最多 {n} 个概念",
    "asgb.stepWhen": "截止日期是什么时候？",
    "asgb.adapted": "每位学生会按自身证据所要求的水准学习并练习该概念——引擎会自动分级，因此这里无需配置。考试条件属于试卷，而不是布置的练习。",
    "asgb.created": "作业已创建。你的班级可以开始了。",
    "asgb.createdSome": "作业已创建。{n} 名学生可以开始了。",
    "asgb.needPick": "请至少选择一个概念、一名学生和一个截止日期。",
    "asgb.wholeClass": "全班",
  }],
  ["fa", {
    "asgb.title": "ساخت تکلیف",
    "asgb.back": "بازگشت",
    "asgb.stepWho": "این برای کیست؟",
    "asgb.whoAll": "کل کلاس",
    "asgb.whoSome": "دانش‌آموزان انتخاب‌شده",
    "asgb.stepWhat": "چه چیزی باید بیاموزند؟",
    "asgb.search": "جست‌وجو در این دوره",
    "asgb.cap": "حداکثر {n} مفهوم",
    "asgb.stepWhen": "مهلت آن کِی است؟",
    "asgb.adapted": "هر دانش‌آموز مفهوم را می‌آموزد و در سطحی تمرین می‌کند که شواهد خودش می‌طلبد — موتور خودش تفکیک می‌کند، پس چیزی برای تنظیم نیست. شرایط امتحان جای خود را در برگهٔ امتحان دارد، نه در تکلیف.",
    "asgb.created": "تکلیف ساخته شد. کلاس شما می‌تواند شروع کند.",
    "asgb.createdSome": "تکلیف ساخته شد. {n} دانش‌آموز می‌توانند شروع کنند.",
    "asgb.needPick": "حداقل یک مفهوم، یک دانش‌آموز و یک مهلت انتخاب کنید.",
    "asgb.wholeClass": "کل کلاس",
  }],
  ["ur", {
    "asgb.title": "اسائنمنٹ بنائیں",
    "asgb.back": "واپس",
    "asgb.stepWho": "یہ کس کے لیے ہے؟",
    "asgb.whoAll": "پوری کلاس",
    "asgb.whoSome": "منتخب طلبہ",
    "asgb.stepWhat": "انہیں کیا سیکھنا چاہیے؟",
    "asgb.search": "اس کورس میں تلاش کریں",
    "asgb.cap": "زیادہ سے زیادہ {n} تصورات",
    "asgb.stepWhen": "آخری تاریخ کیا ہے؟",
    "asgb.adapted": "ہر طالبِ علم تصور سیکھتا ہے اور اُس سطح پر مشق کرتا ہے جو اُس کے اپنے ثبوت مانگتے ہیں — انجن خود تفریق کرتا ہے، اس لیے یہاں کچھ مقرر کرنے کو نہیں۔ امتحان کی شرائط پرچے کی بات ہیں، دیے گئے کام کی نہیں۔",
    "asgb.created": "اسائنمنٹ بن گئی۔ آپ کی کلاس اب شروع کر سکتی ہے۔",
    "asgb.createdSome": "اسائنمنٹ بن گئی۔ {n} طلبہ اب شروع کر سکتے ہیں۔",
    "asgb.needPick": "کم از کم ایک تصور، ایک طالبِ علم اور ایک آخری تاریخ منتخب کریں۔",
    "asgb.wholeClass": "پوری کلاس",
  }],
  ["bn", {
    "asgb.title": "অ্যাসাইনমেন্ট তৈরি করুন",
    "asgb.back": "ফিরে যান",
    "asgb.stepWho": "এটি কার জন্য?",
    "asgb.whoAll": "পুরো ক্লাস",
    "asgb.whoSome": "নির্বাচিত শিক্ষার্থী",
    "asgb.stepWhat": "তাদের কী শেখা উচিত?",
    "asgb.search": "এই কোর্সে খুঁজুন",
    "asgb.cap": "সর্বোচ্চ {n}টি ধারণা",
    "asgb.stepWhen": "সময়সীমা কখন?",
    "asgb.adapted": "প্রতিটি শিক্ষার্থী ধারণাটি শেখে এবং নিজের প্রমাণ যে স্তরের দাবি করে সেই স্তরে অনুশীলন করে — ইঞ্জিন নিজেই স্তর ভাগ করে, তাই এখানে কিছু সেট করার নেই। পরীক্ষার শর্ত পরীক্ষার প্রশ্নপত্রের, অ্যাসাইনমেন্টের নয়।",
    "asgb.created": "অ্যাসাইনমেন্ট তৈরি হয়েছে। আপনার ক্লাস শুরু করতে পারে।",
    "asgb.createdSome": "অ্যাসাইনমেন্ট তৈরি হয়েছে। {n} জন শিক্ষার্থী শুরু করতে পারে।",
    "asgb.needPick": "কমপক্ষে একটি ধারণা, একজন শিক্ষার্থী ও একটি সময়সীমা বেছে নিন।",
    "asgb.wholeClass": "পুরো ক্লাস",
  }],
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"asgb.title"')) {
  console.log("asgb.title already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const anchors = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(ANCHOR)) anchors.push(i);
if (anchors.length !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ANCHOR} anchors, found ${anchors.length} — refusing to guess which dictionary is which`);
}

for (let i = anchors.length - 1; i >= 0; i--) {
  const [lang, block] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const entries = Object.entries(block)
    .map(([k, v]) => `${indent}"${k}": "${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",`)
    .join("\n");
  lines.splice(anchors[i] + 1, 0, entries);
  console.log(`${lang}: +${Object.keys(block).length} keys`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
