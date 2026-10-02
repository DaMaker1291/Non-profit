// One-shot i18n: a DISTINCT accessible name for the phone's bottom navigation.
//
// WHY. The shell renders two <nav> landmarks — the desktop sidebar and the
// phone's bottom bar — and they carried the SAME aria-label ("Main menu"), from
// the same key. That is not two competing menus: `.bottomnav` is hidden by CSS
// at desktop widths and `.sidebar-nav` is hidden at phone widths, so a learner
// only ever sees one. But a screen-reader user navigating BY LANDMARK does not
// read CSS, and a landmark list that contains "Main menu" twice gives them two
// destinations with no way to tell them apart and no way to know one is
// currently hidden from view.
//
// The fix is not to delete a landmark — both are real navigation and both need
// names — it is to name them for what they are. The sidebar is the main menu.
// The bottom bar is the phone's section switcher, which is what it is: five
// destinations in thumb reach. Hence "Sections", and the key is named for the
// element rather than for the string, so a later reader knows which landmark
// the text belongs to.
//
// Anchored beside `nav.mainAria`, which every dictionary already carries and
// which is the key being disambiguated. Resolved by dictionary NAME, never by
// position — the dictionaries in lib/i18n.ts are not in LANGS order, so pairing
// by index writes Urdu into German and nothing crashes.
//
// Same convention as the other one-shot scripts: each dictionary edited by hand,
// completeness asserted, refuse to write twice.
//
// Run: node scripts/i18n-nav-landmark.mjs

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling this belongs beside in every dictionary — the key it disambiguates. */
const ANCHOR = '"nav.mainAria"';

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUES = {
  "nav.bottomAria": {
    en: "Sections",
    es: "Secciones",
    fr: "Sections",
    pt: "Secções",
    ar: "الأقسام",
    sw: "Sehemu",
    hi: "अनुभाग",
    id: "Bagian",
    tl: "Mga bahagi",
    de: "Bereiche",
    ja: "セクション",
    zh: "板块",
    fa: "بخش‌ها",
    ur: "سیکشنز",
    bn: "বিভাগ",
  },
};

const PLAN = Object.keys(VALUES);

let src = fs.readFileSync(FILE, "utf8");
if (src.includes(`"${PLAN[0]}"`)) {
  console.log("already applied — nothing to do");
  process.exit(0);
}

function dictSpan(code) {
  const head = new RegExp(`^(export )?const ${code}: Dict = \\{`, "m").exec(src);
  if (!head) throw new Error(`dictionary ${code} not found`);
  const end = src.indexOf("\n};", head.index);
  if (end < 0) throw new Error(`dictionary ${code} has no terminator`);
  return [head.index, end];
}

const problems = [];
for (const code of LANGS) {
  for (const key of PLAN) {
    const v = VALUES[key][code];
    if (typeof v !== "string" || v.length === 0) problems.push(`${key}: no value for ${code}`);
  }
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  let block = src.slice(from, to);
  const anchor = block.indexOf(`${ANCHOR}:`);
  if (anchor < 0) {
    problems.push(`${code}: anchor ${ANCHOR} missing`);
    continue;
  }
  const lineEnd = block.indexOf("\n", anchor);
  if (lineEnd < 0) {
    problems.push(`${code}: anchor line unterminated`);
    continue;
  }
  const indent = " ".repeat(anchor - block.lastIndexOf("\n", anchor) - 1);
  const added = PLAN.map((k) => `${indent}"${k}": ${JSON.stringify(VALUES[k][code])},`).join("\n");
  block = block.slice(0, lineEnd) + "\n" + added + block.slice(lineEnd);
  src = src.slice(0, from) + block + src.slice(to);
}

for (const code of LANGS) {
  const [from, to] = dictSpan(code);
  const block = src.slice(from, to);
  for (const key of PLAN) if (!block.includes(`"${key}"`)) problems.push(`${code}: no ${key}`);
}
if (problems.length) {
  console.error("REFUSING TO WRITE:\n  " + problems.join("\n  "));
  process.exit(1);
}

fs.writeFileSync(FILE, src);
console.log(`authored ${PLAN.length} landmark label in ${LANGS.length} dictionaries`);