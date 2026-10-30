// One-shot i18n: the mistakes page's two kinds of row, and the paper SET label.
//
// Four changes, and the interesting one is a REPLACEMENT rather than an insert.
// `err.lead` said "Every recurring slip OpenMind has recorded about you", which
// stopped being true when the page learned to show a wrong answer with no belief
// behind it: those are not "recurring slips", they are misses the record can
// count but not name, and the page says so on each row. A heading that claims
// more than its rows is the exact failure this repository keeps catching.
//
// Located BY DICTIONARY NAME, never by position: lib/i18n.ts's dictionaries are
// not in `LANGS` order.
//
// Run: node scripts/i18n-mistakes.mjs
// Idempotent: a key already present is skipped; `err.lead` is replaced in place.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "ur", "fa", "de", "ja", "zh", "bn"];

const INSERT = {
  en: {
    "err.misses": "{w} of {n} answers missed",
    "err.noBelief": "OpenMind recorded which answers were wrong here, but has no belief to name for them yet — practise here and one may be caught.",
    "pp.set": "Set {s}",
  },
  es: {
    "err.misses": "{w} de {n} respuestas falladas",
    "err.noBelief": "OpenMind registró qué respuestas fallaste aquí, pero aún no puede nombrar la creencia detrás — practica aquí y quizá se detecte.",
    "pp.set": "Conjunto {s}",
  },
  fr: {
    "err.misses": "{w} réponses ratées sur {n}",
    "err.noBelief": "OpenMind a enregistré quelles réponses tu as ratées ici, mais ne peut pas encore nommer la croyance derrière — entraîne-toi ici et elle sera peut-être repérée.",
    "pp.set": "Série {s}",
  },
  pt: {
    "err.misses": "{w} de {n} respostas falhadas",
    "err.noBelief": "O OpenMind registou que respostas falhaste aqui, mas ainda não consegue nomear a crença por trás — pratica aqui e talvez seja detetada.",
    "pp.set": "Conjunto {s}",
  },
  ar: {
    "err.misses": "{w} من {n} إجابات خاطئة",
    "err.noBelief": "سجّل OpenMind أي الإجابات كانت خاطئة هنا، لكنه لا يستطيع بعد تسمية الاعتقاد وراءها — تدرّب هنا فقد يُكشف.",
    "pp.set": "المجموعة {s}",
  },
  sw: {
    "err.misses": "{w} kati ya {n} majibu yaliyokosewa",
    "err.noBelief": "OpenMind ilirekodi majibu gani yalikosewa hapa, lakini bado haiwezi kutaja imani iliyo nyuma — fanya mazoezi hapa huenda ikagunduliwa.",
    "pp.set": "Seti {s}",
  },
  hi: {
    "err.misses": "{n} में से {w} उत्तर गलत",
    "err.noBelief": "OpenMind ने दर्ज किया कि यहाँ कौन-से उत्तर गलत हुए, पर उनके पीछे की धारणा का नाम अभी नहीं बता सकता — यहाँ अभ्यास करें, शायद वह पकड़ी जाए।",
    "pp.set": "सेट {s}",
  },
  id: {
    "err.misses": "{w} dari {n} jawaban salah",
    "err.noBelief": "OpenMind mencatat jawaban mana yang salah di sini, tetapi belum bisa menamai keyakinan di baliknya — berlatihlah di sini, mungkin akan terdeteksi.",
    // "Set" is English in Indonesian too, and the gate is right to refuse a
    // row that is byte-identical to the English one: "paket soal" is what a
    // paper set is actually called.
    "pp.set": "Paket {s}",
  },
  tl: {
    "err.misses": "{w} sa {n} sagot ang mali",
    "err.noBelief": "Naitala ng OpenMind kung aling mga sagot ang mali rito, ngunit wala pa itong maipangalan na paniniwala sa likod — magsanay dito at baka mahuli ito.",
    "pp.set": "Pangkat {s}",
  },
  ur: {
    "err.misses": "{n} میں سے {w} جواب غلط",
    "err.noBelief": "OpenMind نے درج کیا کہ یہاں کون سے جواب غلط ہوئے، مگر ان کے پیچھے کے تصور کا نام ابھی نہیں بتا سکتا — یہاں مشق کریں، ممکن ہے پکڑا جائے۔",
    "pp.set": "سیٹ {s}",
  },
  fa: {
    "err.misses": "{w} از {n} پاسخ نادرست",
    "err.noBelief": "OpenMind ثبت کرده کدام پاسخ‌ها اینجا نادرست بوده، اما هنوز نمی‌تواند باورِ پشت آن را نام ببرد — اینجا تمرین کنید، شاید شناسایی شود.",
    "pp.set": "مجموعه {s}",
  },
  de: {
    "err.misses": "{w} von {n} Antworten falsch",
    "err.noBelief": "OpenMind hat festgehalten, welche Antworten hier falsch waren, kann aber noch nicht benennen, welcher Gedanke dahintersteckt — übe hier, vielleicht zeigt er sich.",
    "pp.set": "Satz {s}",
  },
  ja: {
    "err.misses": "{n}問中{w}問まちがい",
    "err.noBelief": "ここでどの解答がまちがっていたかは記録しましたが、その背景の思い込みまではまだ特定できていません。ここで練習すれば見つかるかもしれません。",
    "pp.set": "セット{s}",
  },
  zh: {
    "err.misses": "{n} 题中错了 {w} 题",
    "err.noBelief": "OpenMind 记录下了这里哪些答案错了，但还说不清背后的想法——在这里练习，也许就能被发现。",
    "pp.set": "第 {s} 套",
  },
  bn: {
    "err.misses": "{n}টির মধ্যে {w}টি ভুল",
    "err.noBelief": "OpenMind রেকর্ড করেছে এখানে কোন উত্তরগুলো ভুল, কিন্তু তার পেছনের ধারণার নাম এখনো বলতে পারে না — এখানে অনুশীলন করো, হয়তো ধরা পড়বে।",
    "pp.set": "সেট {s}",
  },
};

const LEAD = {
  en: "Every slip OpenMind has recorded about you — the ones it can name, and the ones it can only count.",
  es: "Cada error que OpenMind ha registrado sobre ti: los que puede nombrar y los que solo puede contar.",
  fr: "Chaque erreur qu'OpenMind a enregistrée à ton sujet : celles qu'il peut nommer et celles qu'il ne peut que compter.",
  pt: "Cada erro que o OpenMind registou sobre ti: os que consegue nomear e os que só consegue contar.",
  ar: "كل خطأ سجّله OpenMind عنك — ما يستطيع تسميته وما يستطيع عدّه فقط.",
  sw: "Kila kosa ambalo OpenMind limerekodi juu yako — lile linaloweza kulitaja na lile linaloweza kulihesabu tu.",
  hi: "हर वह गलती जो OpenMind ने आपके बारे में दर्ज की — जिसे वह नाम दे सकता है और जिसे वह केवल गिन सकता है।",
  id: "Setiap kesalahan yang OpenMind catat tentangmu — yang bisa dinamainya dan yang hanya bisa dihitungnya.",
  tl: "Bawat pagkakamaling naitala ng OpenMind tungkol sa iyo — ang kayang pangalanan at ang kayang bilangin lamang.",
  ur: "ہر وہ غلطی جو OpenMind نے آپ کے بارے میں درج کی — جسے وہ نام دے سکتا ہے اور جسے صرف گن سکتا ہے۔",
  fa: "هر خطایی که OpenMind دربارهٔ شما ثبت کرده — آنچه می‌تواند نام ببرد و آنچه فقط می‌تواند بشمارد.",
  de: "Jeder Fehler, den OpenMind über dich festgehalten hat — die, die es benennen kann, und die, die es nur zählen kann.",
  ja: "OpenMind が記録したあなたのつまずき — 名前を特定できたものと、数えることしかできないもの。",
  zh: "OpenMind 记录下的你的每一次失误——能说出原因的，和只能统计次数的。",
  bn: "OpenMind তোমার সম্পর্কে যে ভুলগুলো রেকর্ড করেছে — যেগুলোর কারণ বলতে পারে আর যেগুলো শুধু গুনতে পারে।",
};

const KEYS = Object.keys(INSERT.en);
for (const code of LANGS) {
  const got = Object.keys(INSERT[code] ?? {});
  if (got.length !== KEYS.length || got.some((k) => !KEYS.includes(k))) {
    throw new Error(`${code}: refusing to write a half dictionary (${got.join(",")})`);
  }
  if (!LEAD[code]) throw new Error(`${code}: no lead sentence`);
}

const src = fs.readFileSync(FILE, "utf8");
let lines = src.split("\n");

function spanOf(code, arr) {
  const head = arr.findIndex((l) => /^(export )?const \w+: Dict = \{$/.test(l) && l.includes(`const ${code}: Dict = {`));
  if (head < 0) throw new Error(`${code}: no dictionary in ${FILE}`);
  for (let i = head + 1; i < arr.length; i += 1) if (/^\s*\};/.test(arr[i])) return [head, i];
  throw new Error(`${code}: its dictionary never closes`);
}

const escape = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// ── 1. Replace err.lead inside each dictionary ──────────────────────────────
let replaced = 0;
for (const code of LANGS) {
  const [start, end] = spanOf(code, lines);
  for (let i = start + 1; i < end; i += 1) {
    if (/^\s*"err\.lead": /.test(lines[i])) {
      lines[i] = `  "err.lead": "${escape(LEAD[code])}",`;
      replaced += 1;
      break;
    }
  }
}
if (replaced !== LANGS.length) throw new Error(`err.lead: replaced ${replaced} of ${LANGS.length} — a dictionary has no lead to fix`);

// ── 2. Insert the new keys ─────────────────────────────────────────────────
let wrote = 0;
let skipped = 0;
const inserts = [];
for (const code of LANGS) {
  const [start, end] = spanOf(code, lines);
  const body = lines.slice(start, end).join("\n");
  const missing = KEYS.filter((k) => !body.includes(`"${k}":`));
  if (missing.length === 0) { skipped += KEYS.length; continue; }
  inserts.push({ at: end, block: missing.map((k) => `  "${k}": "${escape(INSERT[code][k])}",`).join("\n") });
  wrote += missing.length;
}
for (const { at, block } of inserts.sort((a, b) => b.at - a.at)) lines.splice(at, 0, block);
fs.writeFileSync(FILE, lines.join("\n"));

// ── POST-CONDITION: every dictionary has every key, with ITS OWN text ───────
const after = fs.readFileSync(FILE, "utf8").split("\n");
for (const code of LANGS) {
  const body = after.slice(...spanOf(code, after)).join("\n");
  const missing = KEYS.filter((k) => !body.includes(`"${k}":`));
  if (missing.length) throw new Error(`${code}: still missing ${missing.join(", ")}`);
  const wrong = [...KEYS, "err.lead"].filter((k) => {
    const mine = k === "err.lead" ? LEAD[code] : INSERT[code][k];
    return !body.includes(`"${k}": "${escape(mine)}"`);
  });
  if (wrong.length) throw new Error(`${code}: ${wrong.length} key(s) carry another dictionary's text (${wrong.join(", ")})`);
}

console.log(`mistakes: err.lead replaced in ${replaced}, ${wrote} keys written, ${skipped} already present, ${(KEYS.length + 1)} × ${LANGS.length} verified`);
