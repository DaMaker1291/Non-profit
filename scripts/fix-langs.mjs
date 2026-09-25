// One-shot: (1) home.languages 14 → 15 everywhere; (2) add the 5 missing
// onb.* language keys to the 14 non-English dictionaries.
import fs from "node:fs";

const ONB = {
  es: {"onb.teachingLang":"Idioma de enseñanza (explicaciones)","onb.understandLang":"Entiendo mejor en","onb.schoolLang":"Mi escuela usa (mantener términos en)","onb.answerLang":"Idioma de respuesta (respondo en)","onb.langHint":"Explicar en mi idioma, términos escolares en inglés. Cambiar en 2 toques cuando quiera."},
  fr: {"onb.teachingLang":"Langue d'enseignement (explications)","onb.understandLang":"Je comprends mieux en","onb.schoolLang":"Mon école utilise (garder les termes en)","onb.answerLang":"Langue de réponse (je réponds en)","onb.langHint":"Expliquer dans ma langue, termes scolaires en anglais. Changer en 2 gestes quand je veux."},
  pt: {"onb.teachingLang":"Idioma de ensino (explicações)","onb.understandLang":"Entendo melhor em","onb.schoolLang":"Minha escola usa (manter termos em)","onb.answerLang":"Idioma de resposta (respondo em)","onb.langHint":"Explicar no meu idioma, termos escolares em inglês. Mudar em 2 toques quando quiser."},
  ar: {"onb.teachingLang":"لغة التدريس (الشرح)","onb.understandLang":"أفهم أفضل بـ","onb.schoolLang":"مدرستي تستخدم (إبقاء المصطلحات بـ)","onb.answerLang":"لغة الإجابة (أجيب بـ)","onb.langHint":"الشرح بلغتي مع إبقاء المصطلحات المدرسية بالإنجليزية. التغيير بلمستين متى شئت."},
  sw: {"onb.teachingLang":"Lugha ya kufundisha (maelezo)","onb.understandLang":"Naelewa vizuri zaidi kwa","onb.schoolLang":"Shule yangu hutumia (kuhifadhi maneno kwa)","onb.answerLang":"Lugha ya kujibu (najibu kwa)","onb.langHint":"Kueleza kwa lugha yangu, maneno ya shule kwa Kiingereza. Kubadilisha kwa mibiri miwili ninapopenda."},
  hi: {"onb.teachingLang":"शिक्षा की भाषा (व्याख्या)","onb.understandLang":"मैं बेहतर समझता हूँ","onb.schoolLang":"मेरा स्कूल उपयोग करता है (शब्द इसमें रखें)","onb.answerLang":"उत्तर की भाषा (मैं इसमें लिखूँ)","onb.langHint":"मेरी भाषा में समझाएँ, स्कूली शब्द अंग्रेज़ी में रखें। कभी भी २ टैप में बदलें।"},
  id: {"onb.teachingLang":"Bahasa pengajaran (penjelasan)","onb.understandLang":"Saya lebih paham dalam","onb.schoolLang":"Sekolah saya memakai (istilah tetap dalam)","onb.answerLang":"Bahasa jawaban (saya menjawab dalam)","onb.langHint":"Jelaskan dalam bahasa saya, istilah pelajaran tetap bahasa Inggris. Ganti kapan saja dengan 2 ketukan."},
  tl: {"onb.teachingLang":"Wika ng pagtuturo (mga paliwanag)","onb.understandLang":"Mas nauunawaan ko sa","onb.schoolLang":"Ginagamit ng paaralan ko (panatilihin ang mga termino sa)","onb.answerLang":"Wika ng sagot (sumasagot ako sa)","onb.langHint":"Ipaliwanag sa wika ko, panatilihin ang mga terminong pang-eskuwela sa Ingles. Palitan anumang oras sa 2 tap."},
  de: {"onb.teachingLang":"Unterrichtssprache (Erklärungen)","onb.understandLang":"Ich verstehe besser auf","onb.schoolLang":"Meine Schule verwendet (Begriffe auf)","onb.answerLang":"Antwortsprache (ich antworte auf)","onb.langHint":"Auf meiner Sprache erklären, Fachbegriffe auf Englisch. Jederzeit mit 2 Tippern ändern."},
  ja: {"onb.teachingLang":"教える言語(説明)","onb.understandLang":"よくわかる言語","onb.schoolLang":"学校で使う言語(用語はこのまま)","onb.answerLang":"答える言語(返信はここで)","onb.langHint":"説明は私の言語で、学校の用語は英語のまま。いつでも2タップで変更できます。"},
  zh: {"onb.teachingLang":"教学语言(讲解)","onb.understandLang":"我用……理解得更清楚","onb.schoolLang":"我的学校使用(术语保留为)","onb.answerLang":"作答语言(我用……回答)","onb.langHint":"用我的语言讲解,学校术语保留英文。随时两次点按即可更改。"},
  fa: {"onb.teachingLang":"زبان آموزش (توضیح‌ها)","onb.understandLang":"بهتر می‌فهمم با","onb.schoolLang":"مدرسه‌ام استفاده می‌کند (اصطلاح‌ها به)","onb.answerLang":"زبان پاسخ (پاسخ می‌دهم با)","onb.langHint":"توضیح به زبان من، اصطلاح‌های درسی انگلیسی. هر وقت خواستی با دو لمس عوض کن."},
  ur: {"onb.teachingLang":"تدریس کی زبان (وضاحتیں)","onb.understandLang":"مجھے بہتر سمجھ آتی ہے","onb.schoolLang":"میرا اسکول استعمال کرتا ہے (اصطلاحات رکھے)","onb.answerLang":"جواب کی زبان (جواب دیتا ہوں)","onb.langHint":"میری زبان میں سمجھائیں، اسکولی اصطلاحات انگریزی میں رکھیں۔ کبھی بھی دو ٹیپ میں بدلیں۔"},
  bn: {"onb.teachingLang":"শেখানোর ভাষা (ব্যাখ্যা)","onb.understandLang":"আমি ভালো বুঝি যেখানে","onb.schoolLang":"আমার স্কুল ব্যবহার করে (পদগুলো রাখবো)","onb.answerLang":"উত্তরের ভাষা (আমি উত্তর দিই)","onb.langHint":"আমার ভাষায় বোঝান, স্কুলের পদ ইংরেজিতে রাখুন। যেকোনো সময় ২ ট্যাপে বদলান।"},
};

const src = fs.readFileSync("lib/i18n.ts", "utf8");
const lines = src.split("\n");
const declRe = /^(?:export )?const (\w+): Dict = \{$/;
let cur = null, fixed = 0, added = 0;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(declRe);
  if (m) { cur = m[1]; continue; }
  if (lines[i] === "};") { cur = null; continue; }
  if (!cur) continue;
  // (1) 14 → 15 in home.languages
  if (lines[i].includes('"home.languages"') && /14 (languages|idiomas|langues|لغة|ভাষা)|Lugha 14|14 भाषाएँ|14 bahasa|14 wika|14 Sprachen|14の言語|14 种语言|14 زبان|14 زبانیں/.test(lines[i])) {
    lines[i] = lines[i].replace(/14/, "15");
    fixed++;
  }
  // (2) missing onb.* keys — insert after onb.grade line if present, else after declaration
  if (cur !== "en" && !ONB[cur]) continue;
  if (cur !== "en" && lines[i].includes('"onb.lang"')) {
    const block = Object.entries(ONB[cur]).map(([k, v]) => `  "${k}": ${JSON.stringify(v)},`);
    if (!lines.join("\n").includes(`"${cur}`)) { /* noop */ }
    // check the dict doesn't already have onb.langHint (scan its block later is costly; single dict scan)
    const end = (() => { let e = i; while (e < lines.length && lines[e] !== "};") e++; return e; })();
    const seg = lines.slice(i, end).join("\n");
    if (!seg.includes('"onb.langHint"')) {
      lines.splice(i + 1, 0, block.join("\n"));
      added++;
      i += block.length;
    }
  }
}
fs.writeFileSync("lib/i18n.ts", lines.join("\n"));
console.log(`languages bumped: ${fixed}, onb blocks added: ${added}`);
