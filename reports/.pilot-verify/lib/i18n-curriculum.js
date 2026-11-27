"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// THE CURRICULUM-MAPPING VOCABULARY, in all fifteen languages.
//
// Two strings, and they exist because a citation nobody can read is not a
// citation. `course.mapPending` (lib/i18n.ts) already says how far the mapping
// has been checked; these name WHAT it was checked against, which is the fact a
// ministry's subject specialist needs before they can disagree with a single
// line of it.
//
// The document's own title, publisher and date are NOT translated: they are
// proper nouns and a citation, and a translated citation cannot be looked up.
// Only the lead-in and the caveat are localised.
//
// Merged into `DICTS` at module load (lib/i18n.ts), so `t()`, the English
// fallback and the suite's key-parity assertion all see one dictionary.
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRICULUM_STRINGS = void 0;
exports.CURRICULUM_STRINGS = {
    en: {
        "course.mapSource": "Mapped against:",
        "course.mapPortal": "the source is on file; a reviewer must still check each heading against the document",
    },
    es: {
        "course.mapSource": "Mapeado con:",
        "course.mapPortal": "la fuente está archivada; un revisor debe comprobar aún cada encabezado con el documento",
    },
    fr: {
        "course.mapSource": "Correspondance établie avec :",
        "course.mapPortal": "la source est archivée ; un relecteur doit encore vérifier chaque intitulé dans le document",
    },
    pt: {
        "course.mapSource": "Mapeado com base em:",
        "course.mapPortal": "a fonte está arquivada; um revisor ainda deve conferir cada título no documento",
    },
    ar: {
        "course.mapSource": "تمت المطابقة مع:",
        "course.mapPortal": "المصدر محفوظ؛ على المراجع أن يتحقق بعد من كل عنوان في الوثيقة",
    },
    sw: {
        "course.mapSource": "Imeoanishwa na:",
        "course.mapPortal": "chanzo kipo kwenye faili; mhakiki bado anapaswa kuhakiki kila kichwa ndani ya hati",
    },
    hi: {
        "course.mapSource": "इसके अनुसार मैप किया गया:",
        "course.mapPortal": "स्रोत फ़ाइल में है; समीक्षक को अभी दस्तावेज़ में प्रत्येक शीर्षक जाँचना है",
    },
    id: {
        "course.mapSource": "Dipetakan terhadap:",
        "course.mapPortal": "sumbernya tersimpan; peninjau masih harus memeriksa setiap judul di dalam dokumen",
    },
    tl: {
        "course.mapSource": "Nakamapa laban sa:",
        "course.mapPortal": "nasa file ang pinagmulan; kailangan pa ring suriin ng tagasuri ang bawat pamagat sa dokumento",
    },
    de: {
        "course.mapSource": "Abgeglichen mit:",
        "course.mapPortal": "die Quelle liegt vor; eine Prüfperson muss noch jede Überschrift im Dokument abgleichen",
    },
    ja: {
        "course.mapSource": "対応付けの根拠：",
        "course.mapPortal": "出典は保管済みです。確認者が文書内の各見出しを照合する必要があります",
    },
    zh: {
        "course.mapSource": "对照依据：",
        "course.mapPortal": "来源已存档；审阅者仍需逐条核对文件中的标题",
    },
    fa: {
        "course.mapSource": "نگاشتشده بر پایه:",
        "course.mapPortal": "منبع در پرونده موجود است؛ بازبین باید هر سرصفحه را با سند بررسی کند",
    },
    ur: {
        "course.mapSource": "اس کی بنیاد پر نقشہ بنایا گیا:",
        "course.mapPortal": "ماخذ فائل میں موجود ہے؛ جائزہ لینے والے کو دستاویز میں ہر عنوان جانچنا باقی ہے",
    },
    bn: {
        "course.mapSource": "যার ভিত্তিতে ম্যাপ করা হয়েছে:",
        "course.mapPortal": "উৎস ফাইলে আছে; পর্যালোচককে এখনও নথির প্রতিটি শিরোনাম যাচাই করতে হবে",
    },
};
// ── TIERS ARE NOT THE SAME THING AS SCHOOL YEARS ──────────────────────────
//
// One sentence, in every language, for the qualifications that have no tiers
// for a subject at all (GCSE Computer Science, for one). The picker used to draw
// a tier control for every subject of every qualification, which asked a
// question the examination does not put; the honest state is a sentence derived
// from `Specification.subjectTiers`, not a hidden dropdown and not a guess.
//
// Declared here rather than inside the map above because it is one concept with
// one meaning, and adding it to fifteen literals by hand is fifteen chances to
// mistype a key that the parity gate would then fail.
const UNTIERED = {
    en: "This qualification has no tiers for this subject: every candidate sits the same papers.",
    es: "Esta titulación no tiene niveles para esta asignatura: todos los candidatos hacen los mismos exámenes.",
    fr: "Cette certification n'a pas de niveaux dans cette matière : tous les candidats passent les mêmes épreuves.",
    pt: "Esta qualificação não tem níveis nesta disciplina: todos os candidatos fazem os mesmos exames.",
    ar: "هذا المؤهل لا يتضمن مستويات في هذه المادة: جميع المترشحين يؤدون نفس الامتحانات.",
    sw: "Sifa hii haina madaraja kwa somo hili: watahiniwa wote hufanya mitihani ile ile.",
    hi: "इस योग्यता में इस विषय के स्तर नहीं हैं: सभी परीक्षार्थी एक ही प्रश्नपत्र देते हैं।",
    id: "Kualifikasi ini tidak berjenjang untuk mata pelajaran ini: semua peserta mengerjakan ujian yang sama.",
    tl: "Walang antas ang kwalipikasyong ito para sa asignaturang ito: isang pares ng pagsusulit ang kinukuha ng lahat.",
    ur: "اس قابلیت میں اس مضمون کے درجے نہیں ہیں: تمام امیدوار ایک ہی پرچے دیتے ہیں۔",
    fa: "این مدرک برای این درس سطح‌بندی ندارد: همه داوطلبان همان آزمون‌ها را می‌دهند.",
    de: "Dieser Abschluss hat in diesem Fach keine Niveaus: alle Prüflinge schreiben dieselben Prüfungen.",
    ja: "この資格では、この科目に段階はありません。全員が同じ試験を受けます。",
    zh: "该资格考试在本学科不分层级：所有考生参加同一套试卷。",
    bn: "এই যোগ্যতায় এই বিষয়ে স্তর নেই: সব পরীক্ষার্থী একই প্রশ্নপত্রে বসে।",
};
for (const [code, value] of Object.entries(UNTIERED)) {
    const dict = exports.CURRICULUM_STRINGS[code];
    if (dict && !("curr.untiered" in dict))
        dict["curr.untiered"] = value;
}
// ── WHY SAVE IS OFF: THE YEAR GROUP ───────────────────────────────────────
//
// The qualification and the tier are empty selects with a prompt, so a
// learner can see they are unanswered. The year group is not: it renders the
// option "I'm learning independently", which looks like an answer, while the
// course gate (and Home's "needs: year group" card) still counts it as
// missing and Save stays dark. Naming the field is not enough next to a box
// that looks filled — the sentence says what the year group is blocking.
//
// Declared as one map and merged, like UNTIERED above, so the fifteen
// translations sit in one place and the parity gate sees one key.
const NEED_GRADE = {
    en: "Save stays off until you choose a year group above.",
    es: "Guardar sigue desactivado hasta que elijas un año escolar arriba.",
    fr: "L'enregistrement reste désactivé tant que tu n'as pas choisi une année scolaire ci-dessus.",
    pt: "Guardar continua desativado até escolheres um ano escolar acima.",
    ar: "يبقى الحفظ معطّلًا حتى تختار الصف الدراسي أعلاه.",
    sw: "Kuhifadhi hakutumika hadi uchague darasa lako la mwaka hapo juu.",
    hi: "जब तक आप ऊपर अपनी कक्षा नहीं चुनते, सहेजना बंद रहेगा।",
    id: "Simpan tetap nonaktif sampai kamu memilih tingkat kelas di atas.",
    tl: "Mananatiling naka-off ang Save hanggang pumili ka ng baitang sa itaas.",
    de: "Speichern bleibt aus, bis du oben eine Jahrgangsstufe auswählst.",
    ja: "上で学年を選ぶまで保存はできません。",
    zh: "选择上方年级后才能保存。",
    fa: "تا زمانی که سال تحصیلی خود را در بالا انتخاب نکنید، ذخیره خاموش می‌ماند.",
    ur: "جب تک آپ اوپر اپنی جماعت منتخب نہیں کرتے، محفوظ کرنا بند رہے گا۔",
    bn: "উপরে আপনার শিক্ষাবর্ষ বেছে না নেওয়া পর্যন্ত সংরক্ষণ বন্ধ থাকবে।",
};
for (const [code, value] of Object.entries(NEED_GRADE)) {
    const dict = exports.CURRICULUM_STRINGS[code];
    if (dict && !("curr.needGrade" in dict))
        dict["curr.needGrade"] = value;
}
