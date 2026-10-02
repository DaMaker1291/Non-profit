// One-shot i18n: THE PROOF VOCABULARY (§10, §14, §15, §18).
//
// The priority rule that decides what an answer proved now lives in exactly one
// place (lib/proof.ts), and it has two renderings: the SENTENCE a learner reads
// under the mark (`fb.*`, authored by scripts/i18n-feedback.mjs) and the SHORT
// NAME for the same verdict, for the places that name it rather than explain it
// — My Evidence's concept row, the session headline, a learner's assigned work
// and the teacher's monitor column. "Independent" has to mean one thing
// wherever it appears, which means one key set, in every dictionary.
//
// Six keys, all fifteen dictionaries, authored here rather than left to a
// runtime English fallback: a one-word label is read at a glance in a table, so
// a missing translation is the whole cell in the wrong language.
//
// Run: node scripts/i18n-proof.mjs   (idempotent — refuses to run twice)
import fs from "node:fs";

const FILE = "lib/i18n.ts";

// Where each key belongs, and beside what. Anchors are located BY NAME inside
// each language's own dictionary, never by position: the dictionaries in
// lib/i18n.ts are not in `LANGS` order (the draft block de, ja, zh, fa, ur sits
// between `tl` and `bn`), so a positional pairing writes Urdu into German and
// nothing crashes — the app simply labels in the wrong language. The same trap
// is documented in scripts/i18n-feedback.mjs, which is where it was caught.
const GROUPS = [
  // The four verdict names, beside the verdict sentence they abbreviate.
  { anchor: '"fb.retained"', keys: ["prf.independent", "prf.supported", "prf.transfer", "prf.retained"] },
  // The session result's headline, beside the other session labels.
  { anchor: '"sess.independence"', keys: ["sess.proved"] },
  // The teacher's monitor column, beside its sibling columns.
  { anchor: '"teach.accuracy"', keys: ["teach.proved"] },
];

const TEXT = {
  en: {
    "prf.independent": "Independent",
    "prf.supported": "Supported",
    "prf.transfer": "Transfer",
    "prf.retained": "Retained",
    "sess.proved": "What this session proved",
    "teach.proved": "Proved",
  },
  es: {
    "prf.independent": "Independente",
    "prf.supported": "Con apoyo",
    "prf.transfer": "Transferencia",
    "prf.retained": "Retenido",
    "sess.proved": "Lo que demostró esta sesión",
    "teach.proved": "Demostrado",
  },
  fr: {
    "prf.independent": "Autonome",
    "prf.supported": "Aidé",
    "prf.transfer": "Transfert",
    "prf.retained": "Retenu",
    "sess.proved": "Ce que cette séance a prouvé",
    "teach.proved": "Prouvé",
  },
  pt: {
    "prf.independent": "Independente",
    "prf.supported": "Com apoio",
    "prf.transfer": "Transferência",
    "prf.retained": "Retido",
    "sess.proved": "O que esta sessão provou",
    "teach.proved": "Provado",
  },
  ar: {
    "prf.independent": "مستقل",
    "prf.supported": "بمساعدة",
    "prf.transfer": "نقل",
    "prf.retained": "محتفظ به",
    "sess.proved": "ما أثبتته هذه الجلسة",
    "teach.proved": "مُثبَت",
  },
  sw: {
    "prf.independent": "Bila msaada",
    "prf.supported": "Kwa usaidizi",
    "prf.transfer": "Uhamishaji",
    "prf.retained": "Uliyohifadhiwa",
    "sess.proved": "Iliyothibitishwa na kipindi hiki",
    "teach.proved": "Iliyothibitishwa",
  },
  hi: {
    "prf.independent": "स्वतंत्र",
    "prf.supported": "सहायता के साथ",
    "prf.transfer": "स्थानांतरण",
    "prf.retained": "स्मरण",
    "sess.proved": "इस सत्र ने क्या सिद्ध किया",
    "teach.proved": "सिद्ध",
  },
  id: {
    "prf.independent": "Mandiri",
    "prf.supported": "Dengan bantuan",
    "prf.transfer": "Terapan baru",
    "prf.retained": "Diingat",
    "sess.proved": "Yang dibuktikan sesi ini",
    "teach.proved": "Terbukti",
  },
  tl: {
    "prf.independent": "Mag-isa",
    "prf.supported": "May tulong",
    "prf.transfer": "Paglilipat",
    "prf.retained": "Naalala",
    "sess.proved": "Ang napatunayan ng sesyong ito",
    "teach.proved": "Napatunayan",
  },
  ur: {
    "prf.independent": "خودمختار",
    "prf.supported": "معاونت کے ساتھ",
    "prf.transfer": "منتقلی",
    "prf.retained": "یادداشت",
    "sess.proved": "اس نشست نے کیا ثابت کیا",
    "teach.proved": "ثابت شدہ",
  },
  fa: {
    "prf.independent": "مستقل",
    "prf.supported": "با کمک",
    "prf.transfer": "انتقال",
    "prf.retained": "به‌خاطرسپرده",
    "sess.proved": "آنچه این جلسه ثابت کرد",
    "teach.proved": "اثبات‌شده",
  },
  de: {
    "prf.independent": "Selbstständig",
    "prf.supported": "Mit Hilfe",
    "prf.transfer": "Übertragung",
    "prf.retained": "Behalten",
    "sess.proved": "Was diese Sitzung belegt hat",
    "teach.proved": "Belegt",
  },
  ja: {
    "prf.independent": "自力",
    "prf.supported": "支援あり",
    "prf.transfer": "転移",
    "prf.retained": "保持",
    "sess.proved": "このセッションで証明できたこと",
    "teach.proved": "証明済み",
  },
  zh: {
    "prf.independent": "独立",
    "prf.supported": "有提示",
    "prf.transfer": "迁移",
    "prf.retained": "保持",
    "sess.proved": "本次练习证明了什么",
    "teach.proved": "已证明",
  },
  bn: {
    "prf.independent": "স্বাধীন",
    "prf.supported": "সহায়তাসহ",
    "prf.transfer": "স্থানান্তর",
    "prf.retained": "স্মৃতিধারণ",
    "sess.proved": "এই সেশনটি যা প্রমাণ করেছে",
    "teach.proved": "প্রমাণিত",
  },
};

const CODES = Object.keys(TEXT);
const ALL_KEYS = GROUPS.flatMap((g) => g.keys);
if (CODES.length !== 15) throw new Error(`${CODES.length} languages — expected 15`);

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"prf.independent"')) {
  console.log("proof vocabulary already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");

/** The line range of ONE language's dictionary, found by NAME. */
function dictRange(code) {
  const open = new RegExp(`^(export )?const ${code}: Dict = \\{`);
  const start = lines.findIndex((l) => open.test(l));
  if (start < 0) throw new Error(`${code}: no \`const ${code}: Dict = {\` in ${FILE}`);
  const next = lines.findIndex((l, i) => i > start && /^(export )?const [a-z]{2}: Dict = \{/.test(l));
  return [start, next < 0 ? lines.length : next];
}

/** Insert every group's keys after its anchor, bottom-up so earlier indices
 *  stay valid. Every pairing is asserted before anything is written: a missing
 *  anchor means the key landed in the wrong dictionary. */
const insertions = [];
for (const group of GROUPS) {
  for (const code of CODES) {
    const [start, end] = dictRange(code);
    const idx = lines.findIndex((l, i) => i > start && i < end && l.includes(group.anchor));
    if (idx < 0) throw new Error(`${code}: no ${group.anchor} inside its own dictionary`);
    const texts = group.keys.map((k) => TEXT[code][k]);
    if (texts.some((s) => typeof s !== "string" || s.length === 0)) {
      throw new Error(`${code}: missing text for ${group.keys.join(", ")}`);
    }
    const indent = lines[idx].match(/^\s*/)[0];
    insertions.push({
      at: idx + 1,
      label: `${code} @ ${idx + 1}`,
      lines: group.keys.map((k, i) => {
        const escaped = texts[i].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return `${indent}"${k}": "${escaped}",`;
      }),
    });
  }
}
// One anchor may only be used once per language, or the keys go in twice.
const seen = new Set();
for (const ins of insertions) {
  if (seen.has(ins.at)) throw new Error(`two groups resolve to line ${ins.at} — refusing to write`);
  seen.add(ins.at);
}
// Bottom-up by LINE, not by discovery order: the dictionaries are not in CODE
// order in this file, so discovery order says nothing about line order.
insertions.sort((a, b) => b.at - a.at);
for (const ins of insertions) {
  lines.splice(ins.at, 0, ...ins.lines);
}

const out = lines.join("\n");
fs.writeFileSync(FILE, out);
console.log(`wrote ${CODES.length * ALL_KEYS.length} strings (${ALL_KEYS.length} keys × ${CODES.length} languages) to ${FILE}`);
