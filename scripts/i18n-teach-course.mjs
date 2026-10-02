// One-shot i18n: THE SCHOOL A TEACHER TEACHES AT, AND THE CLASS'S COURSE.
//
// Two steps the acceptance battery named as missing from the teacher path
// (§2's teacher flow): "SCHOOL/CLASS" and "SUBJECT/QUALIFICATION". A teacher
// could not record the school they teach at anywhere in the product, and the
// assignment door has always accepted a class-level qualification while no
// screen ever sent one — so two classes of one subject at different
// qualifications were the same class twice.
//
// Six strings carry the whole surface: the school field and its note, the label
// for a class's course, the picker's name, the choice that means "no single
// qualification", and the refusal a course the subject is not part of earns.
//
// Located BY DICTIONARY NAME, one insertion per language, like every other
// one-shot i18n script here (a positional pairing once wrote Urdu into German —
// see scripts/i18n-feedback.mjs).
//
// Run: node scripts/i18n-teach-course.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"teach.pickSubject"';

const KEYS = {
  "teach.school": {
    en: "School or organisation",
    es: "Centro u organización",
    fr: "Établissement ou organisation",
    pt: "Escola ou organização",
    ar: "المدرسة أو المؤسسة",
    sw: "Shule au taasisi",
    hi: "स्कूल या संस्था",
    id: "Sekolah atau organisasi",
    tl: "Paaralan o organisasyon",
    ur: "اسکول یا ادارہ",
    fa: "مدرسه یا سازمان",
    de: "Schule oder Organisation",
    ja: "学校・機関",
    zh: "学校或机构",
    bn: "স্কুল বা প্রতিষ্ঠান",
  },
  "teach.schoolHint": {
    en: "Where you teach. Optional — a tutor working alone can leave this empty.",
    es: "Dónde enseñas. Opcional: quien da clases por su cuenta puede dejarlo vacío.",
    fr: "Où vous enseignez. Facultatif — un professeur particulier peut laisser ce champ vide.",
    pt: "Onde ensina. Opcional — quem dá aulas sozinho pode deixar vazio.",
    ar: "أين تُدرّس. اختياري — يمكن للمعلّم المستقل تركه فارغًا.",
    sw: "Unapofundisha. Si lazima — mwalimu anayefundisha peke yake anaweza kuacha wazi.",
    hi: "आप कहाँ पढ़ाते हैं। वैकल्पिक — अकेले पढ़ाने वाला शिक्षक इसे खाली छोड़ सकता है।",
    id: "Di mana Anda mengajar. Opsional — tutor yang mengajar sendiri boleh mengosongkannya.",
    tl: "Saan ka nagtuturo. Opsyonal — maaaring iwang blangko ito ng nagtuturo nang mag-isa.",
    ur: "آپ کہاں پڑھاتے ہیں۔ اختیاری — تنہا پڑھانے والا استاد اسے خالی چھوڑ سکتا ہے۔",
    fa: "جایی که درس می‌دهید. اختیاری — مدرس خصوصی می‌تواند خالی بگذارد.",
    de: "Wo Sie unterrichten. Optional — wer allein unterrichtet, kann das Feld leer lassen.",
    ja: "教えている場所。任意です。個人指導の場合は空欄のままで構いません。",
    zh: "你授课的学校。可选——单独授课的老师可以留空。",
    bn: "আপনি যেখানে পড়ান। ঐচ্ছিক — একা পড়ানো শিক্ষক এটি খালি রাখতে পারেন।",
  },
  "teach.course": {
    en: "Course",
    es: "Curso",
    fr: "Cursus",
    pt: "Curso",
    ar: "المقرر",
    sw: "Kozi",
    hi: "पाठ्यक्रम",
    id: "Kurikulum",
    tl: "Kurso",
    ur: "کورس",
    fa: "دوره",
    de: "Kurs",
    ja: "コース",
    zh: "课程",
    bn: "কোর্স",
  },
  "teach.pickCourse": {
    en: "Qualification or board this class sits",
    es: "Titulación o junta a la que se presenta esta clase",
    fr: "Diplôme ou jury que prépare cette classe",
    pt: "Qualificação ou banca a que esta turma se apresenta",
    ar: "المؤهل أو الهيئة التي يتقدم لها هذا الفصل",
    sw: "Kiwango au bodi ambayo darasa hili hufanya mtihani",
    hi: "इस कक्षा की योग्यता या बोर्ड",
    id: "Kualifikasi atau dewan yang diikuti kelas ini",
    tl: "Kwalipikasyon o board na kinukuha ng klase na ito",
    ur: "اس کلاس کا امتحان بورڈ یا قابلیت",
    fa: "مدرک یا هیئتی که این کلاس امتحان می‌دهد",
    de: "Abschluss oder Prüfungsausschuss dieser Klasse",
    ja: "このクラスが受ける資格・試験委員会",
    zh: "这个班报考的资格或考试局",
    bn: "এই ক্লাস যে যোগ্যতা বা বোর্ডের পরীক্ষা দেয়",
  },
  "teach.wholeSubject": {
    en: "Whole subject (no qualification)",
    es: "Toda la asignatura (sin titulación)",
    fr: "Matière entière (sans diplôme)",
    pt: "Disciplina completa (sem qualificação)",
    ar: "المادة كاملة (بدون مؤهل)",
    sw: "Somo lote (bila kiwango)",
    hi: "पूरा विषय (बिना योग्यता)",
    id: "Seluruh mata pelajaran (tanpa kualifikasi)",
    tl: "Buong asignatura (walang kwalipikasyon)",
    ur: "پورا مضمون (بغیر قابلیت)",
    fa: "کل درس (بدون مدرک)",
    de: "Gesamtes Fach (ohne Abschluss)",
    ja: "科目全体（資格なし）",
    zh: "整个科目（不指定资格）",
    bn: "সম্পূর্ণ বিষয় (যোগ্যতা ছাড়া)",
  },
  "teach.errCourse": {
    en: "That qualification cannot be set for this class",
    es: "Esa titulación no se puede asignar a esta clase",
    fr: "Ce diplôme ne peut pas être attribué à cette classe",
    pt: "Essa qualificação não pode ser atribuída a esta turma",
    ar: "لا يمكن إسناد هذا المؤهل إلى هذا الفصل",
    sw: "Kiwango hicho hakiwezi kuwekwa kwa darasa hili",
    hi: "यह योग्यता इस कक्षा के लिए सेट नहीं की जा सकती",
    id: "Kualifikasi itu tidak dapat diterapkan pada kelas ini",
    tl: "Hindi maitakda ang kwalipikasyong iyon para sa klaseng ito",
    ur: "یہ قابلیت اس کلاس کے لیے مقرر نہیں ہو سکتی",
    fa: "این مدرک برای این کلاس قابل تنظیم نیست",
    de: "Dieser Abschluss lässt sich für diese Klasse nicht festlegen",
    ja: "この資格はこのクラスには設定できません",
    zh: "无法为这个班设置该资格",
    bn: "এই যোগ্যতা এই ক্লাসের জন্য নির্ধারণ করা যায় না",
  },
};

const CODES = Object.keys(KEYS["teach.school"]);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);
for (const key of Object.keys(KEYS)) {
  for (const code of CODES) {
    if (typeof KEYS[key][code] !== "string" || !KEYS[key][code]) throw new Error(`${key}/${code}: missing`);
  }
}

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"teach.wholeSubject"')) {
  console.log("teach.* course strings already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. */
function dictRange(code) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  return [start, next < 0 ? lines.length : next];
}

// One block of six lines per dictionary, spliced bottom-up so an earlier
// dictionary's line numbers stay valid, and in declaration order so the block
// reads the way the surface uses it.
const blocks = [];
for (const code of CODES) {
  const [start, end] = dictRange(code);
  const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(ANCHOR));
  if (idx < 0) throw new Error(`${code}: no ${ANCHOR} inside its own dictionary`);
  const indent = lines[idx].match(/^\s*/)[0];
  const block = Object.entries(KEYS).map(([key, text]) => {
    const escaped = text[code].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${indent}"${key}": "${escaped}",`;
  });
  blocks.push({ at: idx + 1, lines: block });
}
const seen = new Set();
for (const b of blocks) {
  if (seen.has(b.at)) throw new Error(`two dictionaries insert at line ${b.at} — refusing to write`);
  seen.add(b.at);
}
blocks.sort((a, b) => b.at - a.at);
for (const b of blocks) lines.splice(b.at, 0, ...b.lines);

fs.writeFileSync(FILE, lines.join("\n"));
console.log(`wrote ${Object.keys(KEYS).length} strings × ${CODES.length} languages (${Object.keys(KEYS).join(", ")}) to ${FILE}`);
