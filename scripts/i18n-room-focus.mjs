// One-shot i18n: `rooms.focusAsk`.
//
// A room that has no focus concept can no longer guess one from another subject
// (it used to answer every Physics room with linear-equations coaching). Instead
// the room tutor says it does not know which idea the room is on, names the
// room's subject, offers that subject's own concept titles and asks. That line
// is learner-visible, so it exists in every supported language at once —
// following the convention of the other one-shot scripts here: insert beside a
// sibling key (`rooms.tutorNote`), authored by hand, one block per dictionary.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"rooms.tutorNote"';

/** Dictionary order as they appear in lib/i18n.ts. */
const TEXTS = [
  ["en", "Which idea are you working on?"],
  ["es", "¿En qué idea estás trabajando?"],
  ["fr", "Sur quelle notion travailles-tu ?"],
  ["pt", "Em que ideia estás a trabalhar?"],
  ["ar", "ما الفكرة التي تعمل عليها؟"],
  ["sw", "Unashughulikia wazo gani?"],
  ["hi", "आप किस विचार पर काम कर रहे हैं?"],
  ["id", "Ide mana yang sedang kamu kerjakan?"],
  ["tl", "Aling ideya ang ginagawa mo ngayon?"],
  ["de", "An welcher Idee arbeitest du gerade?"],
  ["ja", "どの考え方に取り組んでいますか？"],
  ["zh", "你正在学习哪个概念？"],
  ["fa", "روی کدام مفهوم کار می‌کنی؟"],
  ["ur", "آپ کس خیال پر کام کر رہے ہیں؟"],
  ["bn", "তুমি কোন ধারণাটি নিয়ে কাজ করছ?"],
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"rooms.focusAsk"')) {
  console.log("rooms.focusAsk already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const anchors = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(ANCHOR)) anchors.push(i);
if (anchors.length !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ANCHOR} anchors, found ${anchors.length} — refusing to guess which dictionary is which`);
}

// Insert from the bottom so earlier indices stay valid.
for (let i = anchors.length - 1; i >= 0; i--) {
  const [lang, text] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.splice(anchors[i] + 1, 0, `${indent}"rooms.focusAsk": "${escaped}",`);
  console.log(`${lang}: added`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
