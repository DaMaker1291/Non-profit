// One-shot i18n fix: `asgb.createdSome` must not count learners.
//
// WHY. The first version read "Assignment created. {n} learners can now start.",
// and the confirmation a teacher actually saw for a single-target assignment
// said "1 learners" — a plural template used on a singular. The product already
// solves this elsewhere with a second key (`teach.studentsOne`), but a count is
// not what this sentence is for: the fact worth stating is that the learners the
// teacher CHOSE can start, and that sentence is true for one learner and for
// thirty. So the placeholder goes and the wording carries the meaning.
//
// Mechanical and verified: it rewrites the value on the key's own line, one
// block per dictionary in file order, and refuses to run unless the key appears
// exactly fifteen times.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const KEY = "asgb.createdSome";

/** Dictionary order as they appear in lib/i18n.ts. */
const VALUES = [
  "Assignment created. The learners you selected can now start.",
  "Tarea creada. Los estudiantes que elegiste ya pueden empezar.",
  "Devoir créé. Les élèves que vous avez choisis peuvent commencer.",
  "Tarefa criada. Os alunos que escolheste já podem começar.",
  "أُنشئ التكليف. الطلاب الذين اخترتهم يمكنهم البدء الآن.",
  "Kazi imeundwa. Wanafunzi uliowachagua wanaweza kuanza.",
  "असाइनमेंट बन गया। आपने जिन छात्रों को चुना, वे अब शुरू कर सकते हैं।",
  "Tugas dibuat. Siswa yang kamu pilih bisa mulai.",
  "Nagawa ang takdang gawain. Maaari nang magsimula ang mga pinili mong mag-aaral.",
  "Aufgabe angelegt. Die von dir gewählten Lernenden können beginnen.",
  "課題を作成しました。選んだ学習者が始められます。",
  "作业已创建。你选定的学生可以开始了。",
  "تکلیف ساخته شد. دانش‌آموزانی که انتخاب کردید می‌توانند شروع کنند.",
  "اسائنمنٹ بن گئی۔ جن طلبہ کو آپ نے منتخب کیا وہ اب شروع کر سکتے ہیں۔",
  "অ্যাসাইনমেন্ট তৈরি হয়েছে। আপনি যাদের বেছে নিয়েছেন তারা শুরু করতে পারে।",
];

const lines = fs.readFileSync(FILE, "utf8").split("\n");
const at = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(`"${KEY}":`)) at.push(i);
if (at.length !== VALUES.length) {
  throw new Error(`expected ${VALUES.length} ${KEY} lines, found ${at.length} — refusing to guess`);
}

at.forEach((lineNo, i) => {
  const indent = lines[lineNo].match(/^\s*/)[0];
  const value = VALUES[i].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines[lineNo] = `${indent}"${KEY}": "${value}",`;
});
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`rewrote ${at.length} ${KEY} lines — no placeholder, so no "1 learners"`);
