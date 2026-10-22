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

export type CurriculumDict = Record<string, string>;

export const CURRICULUM_STRINGS: Record<string, CurriculumDict> = {
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
