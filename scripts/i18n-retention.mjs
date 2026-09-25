// One-shot i18n: the session result's RETENTION reason.
//
// `ChangeReason` gained "retained" (lib/session.ts): the sentence a learner
// reads when a review they were due for came back correct — the only result
// line that speaks about memory rather than about understanding. A learner-visible
// string that exists in one language only would ship half-English in fourteen
// others, so it is authored everywhere at once, following the convention of the
// other one-shot scripts here: insert the key beside its siblings, in each
// dictionary, with the translation written by hand rather than machine-filled.
import fs from "node:fs";

const FILE = "lib/i18n.ts";
const ANCHOR = '"sess.r.transfer"';

/** Language order as the dictionaries appear in lib/i18n.ts — en, es, fr, pt,
 *  ar, sw, hi, id, fil, de, ja, zh, fa, ur, bn. */
const TEXTS = [
  ["en", "You recalled this without help after it had faded — that is durable learning."],
  ["es", "Lo recordaste sin ayuda después de que se desvaneciera: eso es aprendizaje duradero."],
  ["fr", "Vous l'avez retrouvé sans aide après l'oubli : c'est un apprentissage durable."],
  ["pt", "Você lembrou sem ajuda depois que esfriou: isso é aprendizagem duradoura."],
  ["ar", "استرجعت هذا دون مساعدة بعد أن خفت: هذا تعلّم راسخ."],
  ["sw", "Ulikumbuka bila msaada baada ya kusahaulika: huo ni ujuzi wa kudumu."],
  ["hi", "भूलने के बाद आपने बिना सहायता इसे याद किया — यही टिकाऊ सीख है।"],
  ["id", "Kamu mengingatnya tanpa bantuan setelah sempat lupa — itulah pembelajaran yang bertahan."],
  ["fil", "Naalala mo ito nang walang tulong matapos itong lumabo — iyon ang tumatagal na pagkatuto."],
  ["de", "Du hast es ohne Hilfe erinnert, nachdem es verblasst war — das ist dauerhaftes Lernen."],
  ["ja", "忘れかけた後で、助けなしに思い出せました。それが定着した学びです。"],
  ["zh", "在淡忘之后你仍能独立回忆起来——这才是真正的长期记忆。"],
  ["fa", "پس از کمرنگ شدن، آن را بدون کمک به یاد آوردید — این یادگیری ماندگار است."],
  ["ur", "بھول جانے کے بعد آپ نے اسے بغیر مدد کے یاد کیا — یہی پائیدار سیکھنا ہے۔"],
  ["bn", "ভুলে যাওয়ার পরেও আপনি সাহায্য ছাড়াই এটি মনে করতে পেরেছেন — এটাই স্থায়ী শেখা।"],
];

const src = fs.readFileSync(FILE, "utf8");
if (src.includes('"sess.r.retained"')) {
  console.log("sess.r.retained already present — nothing to do");
  process.exit(0);
}

const lines = src.split("\n");
const anchors = [];
for (let i = 0; i < lines.length; i++) if (lines[i].includes(ANCHOR)) anchors.push(i);
if (anchors.length !== TEXTS.length) {
  throw new Error(`expected ${TEXTS.length} ${ANCHOR} anchors, found ${anchors.length} — refusing to guess which dictionary is which`);
}

// Insert from the BOTTOM so earlier indices stay valid.
for (let i = anchors.length - 1; i >= 0; i--) {
  const [lang, text] = TEXTS[i];
  const indent = lines[anchors[i]].match(/^\s*/)[0];
  const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.splice(anchors[i] + 1, 0, `${indent}"sess.r.retained": "${escaped}",`);
  console.log(`${lang}: added`);
}
fs.writeFileSync(FILE, lines.join("\n"));
console.log(`done — ${TEXTS.length} dictionaries updated`);
