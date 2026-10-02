// One-shot i18n: the landing page's worked decision, its margin, and its receipts.
//
// WHY. The landing page's centrepiece is now the engine's OWN output — a real
// decision composed for one example record (lib/example-decision.ts), with the
// record it was read from beside it, and, at the foot, the page's claims each
// set beside where they were counted. That is a lot of new learner-facing text,
// and the rule for this page is the same as for every other: a surface whose
// heading is translated and whose explanation is English is the same bug as an
// English button in a Hindi interface. So all sixteen strings are authored in
// all fifteen dictionaries here, by hand, and the script refuses to write if any
// dictionary is missing one.
//
// Two things worth stating about the words themselves:
//
//   · the margin's four labels (`home.f*`) are COUNT-NOUNS — "answers", "right",
//     "needed help", "hit the same slip" — because a reader meets them as
//     "<figure> <label>" out of context ("6 answers"). The engine's own
//     `next.ev.*` labels are written to sit INSIDE a composed sentence ("6
//     attempts · mastery 25% · same slip 3×"), where the figure comes first for
//     some and last for others, so reusing them here would produce "3 same slip";
//   · the sources (`home.src*`) say where each claim was counted in the reader's
//     own words rather than naming repository files. The page's audience is a
//     learner or a teacher; "counted from the question bank" is checkable and
//     "lib/questions.ts" is not a sentence anyone should have to parse.
//
// Same convention as the other one-shot scripts (i18n-why-fallback.mjs,
// i18n-scaffolding-count.mjs): each dictionary edited by hand, completeness
// asserted, refuse to write twice.

import fs from "node:fs";

const FILE = "lib/i18n.ts";
/** The sibling these belong beside in every dictionary. */
const ANCHOR = '"home.sub"';

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const VALUES = {
  "home.worked": {
    en: "The decision, for one recorded learner",
    es: "La decisión, para un alumno registrado",
    fr: "La décision, pour un élève enregistré",
    pt: "A decisão, para um aluno registado",
    ar: "القرار، لمتعلّم واحد مسجَّل",
    sw: "Uamuzi, kwa mwanafunzi mmoja aliyeandikwa",
    hi: "निर्णय, एक दर्ज शिक्षार्थी के लिए",
    id: "Keputusan, untuk satu pelajar yang tercatat",
    tl: "Ang desisyon, para sa isang rehistradong mag-aaral",
    de: "Die Entscheidung, für einen erfassten Lernenden",
    ja: "ある記録済みの学習者への判断",
    zh: "为一个已记录的学习者给出的决定",
    fa: "تصمیم، برای یک یادگیرندهٔ ثبتشده",
    ur: "فیصلہ، ایک رجسٹرڈ سیکھنے والے کے لیے",
    bn: "একজন নথিভুক্ত শিক্ষার্থীর জন্য সিদ্ধান্ত",
  },
  "home.record": {
    en: "The record it read",
    es: "El registro que leyó",
    fr: "Le relevé qu'il a lu",
    pt: "O registo que leu",
    ar: "السجل الذي قرأه",
    sw: "Kumbukumbu aliyoisoma",
    hi: "जो रिकॉर्ड उसने पढ़ा",
    id: "Catatan yang dibacanya",
    tl: "Ang rekord na binasa nito",
    de: "Der Datensatz, den sie gelesen hat",
    ja: "読み取った記録",
    zh: "它读取的记录",
    fa: "سابقه‌ای که خواند",
    ur: "جو ریکارڈ اس نے پڑھا",
    bn: "যে রেকর্ডটি এটি পড়েছে",
  },
  "home.decider": {
    en: "the answer that decided it",
    es: "la respuesta que lo decidió",
    fr: "la réponse qui l'a emporté",
    pt: "a resposta que a decidiu",
    ar: "الإجابة التي حسمت القرار",
    sw: "jibu lililoamua",
    hi: "जिस उत्तर ने यह तय किया",
    id: "jawaban yang memutuskan",
    tl: "ang sagot na nagpasiya",
    de: "die Antwort, die sie entschieden hat",
    ja: "判断を決めた解答",
    zh: "做出这个决定的那个答案",
    fa: "پاسخی که آن را تعیین کرد",
    ur: "جس جواب نے فیصلہ کیا",
    bn: "যে উত্তরটি এটি নির্ধারণ করেছে",
  },
  "home.cited": {
    en: "{n} recorded answers are cited by this card",
    es: "esta tarjeta cita {n} respuestas registradas",
    fr: "cette fiche cite {n} réponses enregistrées",
    pt: "este cartão cita {n} respostas registadas",
    ar: "هذه البطاقة تستشهد بـ {n} إجابات مسجَّلة",
    sw: "kadi hii inataja majibu {n} yaliyoandikwa",
    hi: "यह कार्ड {n} दर्ज उत्तरों का हवाला देता है",
    id: "kartu ini mengutip {n} jawaban tercatat",
    tl: "sinipi ng card na ito ang {n} naitalang sagot",
    de: "diese Karte bezieht sich auf {n} erfasste Antworten",
    ja: "このカードは {n} 件の記録済み解答を根拠にしています",
    zh: "这张卡片引用了 {n} 个已记录的答案",
    fa: "این کارت به {n} پاسخ ثبت‌شده استناد می‌کند",
    ur: "یہ کارڈ {n} درج جوابات کا حوالہ دیتا ہے",
    bn: "এই কার্ডটি {n}টি নথিভুক্ত উত্তর উল্লেখ করে",
  },
  "home.workedNote": {
    en: "OpenMind wrote this card from that record — the same engine, the same ladder and the same sentences a learner gets on Home. Change the record and the card changes: nothing on this page was written by hand.",
    es: "OpenMind escribió esta tarjeta a partir de ese registro: el mismo motor, la misma escalera y las mismas frases que un alumno ve en Inicio. Si cambia el registro, cambia la tarjeta: nada en esta página está escrito a mano.",
    fr: "OpenMind a écrit cette fiche à partir de ce relevé : le même moteur, la même échelle et les mêmes phrases qu'un élève voit sur Accueil. Changez le relevé, la fiche change : rien sur cette page n'a été écrit à la main.",
    pt: "O OpenMind escreveu este cartão a partir desse registo: o mesmo motor, a mesma escada e as mesmas frases que um aluno vê em Início. Muda o registo, muda o cartão: nada nesta página foi escrito à mão.",
    ar: "كتب OpenMind هذه البطاقة من ذلك السجل: المحرك نفسه، والسلّم نفسه، والجمل نفسها التي يراها المتعلّم في الصفحة الرئيسية. غيّر السجل تتغيّر البطاقة؛ لا شيء في هذه الصفحة مكتوب يدويًا.",
    sw: "OpenMind iliandika kadi hii kutoka kumbukumbu hiyo: injini ile ile, ngazi ile ile na sentensi zile zile ambazo mwanafunzi huona kwenye Nyumbani. Badilisha kumbukumbu, kadi inabadilika; hakuna kilichoandikwa kwa mkono katika ukurasa huu.",
    hi: "OpenMind ने यह कार्ड उसी रिकॉर्ड से लिखा — वही इंजन, वही सीढ़ी और वही वाक्य जो शिक्षार्थी होम पर देखता है। रिकॉर्ड बदलिए, कार्ड बदल जाएगा; इस पृष्ठ पर कुछ भी हाथ से नहीं लिखा गया।",
    id: "OpenMind menulis kartu ini dari catatan itu: mesin yang sama, tangga yang sama, dan kalimat yang sama yang dilihat pelajar di Beranda. Ubah catatannya, kartunya berubah; tidak ada yang ditulis tangan di halaman ini.",
    tl: "Isinulat ng OpenMind ang card na ito mula sa rekord na iyon: parehong makina, parehong hagdan, at parehong pangungusap na nakikita ng mag-aaral sa Home. Baguhin ang rekord, magbabago ang card; walang isinulat sa kamay sa pahinang ito.",
    de: "OpenMind hat diese Karte aus diesem Datensatz geschrieben — dieselbe Engine, dieselbe Leiter und dieselben Sätze, die ein Lernender auf Home sieht. Ändert sich der Datensatz, ändert sich die Karte; nichts auf dieser Seite ist von Hand geschrieben.",
    ja: "OpenMind はその記録からこのカードを書きました。学習者がホームで見るのと同じエンジン、同じ段階、同じ文です。記録が変わればカードも変わります。このページに手書きの文章はありません。",
    zh: "OpenMind 用那条记录生成了这张卡片——和学习者在首页看到的同一个引擎、同一套阶梯、同样的句子。记录变了，卡片就变；这个页面上没有一个字是手写的。",
    fa: "OpenMind این کارت را از همان سابقه نوشت: همان موتور، همان نردبان و همان جمله‌هایی که یادگیرنده در خانه می‌بیند. سابقه را تغییر دهید، کارت تغییر می‌کند؛ هیچ‌چیز در این صفحه دستی نوشته نشده است.",
    ur: "OpenMind نے یہ کارڈ اسی ریکارڈ سے لکھا — وہی انجن، وہی زینہ اور وہی جملے جو سیکھنے والا ہوم پر دیکھتا ہے۔ ریکارڈ بدلیں، کارڈ بدل جائے گا؛ اس صفحے پر کچھ بھی ہاتھ سے نہیں لکھا گیا۔",
    bn: "OpenMind এই কার্ডটি সেই রেকর্ড থেকেই লিখেছে — একই ইঞ্জিন, একই ধাপ, এবং শিক্ষার্থী হোমে যে বাক্যগুলো দেখে সেগুলোই। রেকর্ড বদলালে কার্ডও বদলাবে; এই পাতায় কিছুই হাতে লেখা নয়।",
  },
  "home.fAttempts": {
    en: "answers", es: "respuestas", fr: "réponses", pt: "respostas", ar: "إجابات", sw: "majibu",
    hi: "उत्तर", id: "jawaban", tl: "sagot", de: "Antworten", ja: "解答", zh: "次作答",
    fa: "پاسخ", ur: "جوابات", bn: "উত্তর",
  },
  "home.fCorrect": {
    en: "right", es: "correctas", fr: "justes", pt: "certas", ar: "صحيحة", sw: "sahihi",
    hi: "सही", id: "benar", tl: "tama", de: "richtig", ja: "正解", zh: "次正确",
    fa: "درست", ur: "درست", bn: "সঠিক",
  },
  "home.fHelped": {
    en: "needed help", es: "necesitaron ayuda", fr: "ont eu besoin d'aide", pt: "precisaram de ajuda",
    ar: "احتاجت مساعدة", sw: "zilihitaji msaada", hi: "मदद चाहिए थी", id: "butuh bantuan",
    tl: "kailangan ng tulong", de: "brauchten Hilfe", ja: "助けが必要", zh: "次需要帮助",
    fa: "به کمک نیاز داشت", ur: "مدد کی ضرورت تھی", bn: "সহায়তা দরকার ছিল",
  },
  "home.fSlip": {
    en: "hit the same slip", es: "repitieron el mismo error", fr: "ont répété la même erreur",
    pt: "repetiram o mesmo erro", ar: "كرّرت الخطأ نفسه", sw: "zilirudia kosa lile lile",
    hi: "वही चूक दोहराई", id: "mengulang kesalahan yang sama", tl: "inulet ang parehong pagkakamali",
    de: "wiederholten denselben Fehler", ja: "同じ間違いを繰り返した", zh: "次重复同一个错误",
    fa: "همان اشتباه را تکرار کرد", ur: "وہی غلطی دہرائی", bn: "একই ভুলের পুনরাবৃত্তি",
  },
  "home.claims": {
    en: "Every claim on this page, and where it was counted",
    es: "Cada afirmación de esta página y de dónde se contó",
    fr: "Chaque affirmation de cette page, et d'où elle est comptée",
    pt: "Todas as afirmações desta página e onde foram contadas",
    ar: "كل ادعاء في هذه الصفحة ومن أين تم عدّه",
    sw: "Kila madai katika ukurasa huu, na yalipohesabiwa",
    hi: "इस पृष्ठ का हर दावा, और वह कहाँ से गिना गया",
    id: "Setiap klaim di halaman ini, dan dari mana dihitung",
    tl: "Bawat pahayag sa pahinang ito, at saan ito binilang",
    de: "Jede Aussage dieser Seite und wo sie gezählt wurde",
    ja: "このページの主張と、その数え元",
    zh: "本页的每一条说法，以及它的统计来源",
    fa: "هر ادعای این صفحه، و اینکه از کجا شمرده شده",
    ur: "اس صفحے کا ہر دعویٰ، اور وہ کہاں سے گنا گیا",
    bn: "এই পাতার প্রতিটি দাবি, এবং কোথা থেকে গণনা করা হয়েছে",
  },
  "home.srcSubjects": {
    en: "counted from the curriculum map and the question bank when this page loaded",
    es: "contado desde el mapa curricular y el banco de preguntas al cargar la página",
    fr: "compté depuis la carte des programmes et la banque de questions au chargement de la page",
    pt: "contado do mapa curricular e do banco de perguntas ao carregar a página",
    ar: "معدودة من خريطة المناهج وبنك الأسئلة عند تحميل الصفحة",
    sw: "imehesabiwa kutoka ramani ya mtaala na benki ya maswali wakati ukurasa ulipopakiwa",
    hi: "पृष्ठ लोड होते समय पाठ्यक्रम मानचित्र और प्रश्न बैंक से गिना गया",
    id: "dihitung dari peta kurikulum dan bank soal saat halaman ini dimuat",
    tl: "binilang mula sa mapa ng kurikulum at bangko ng tanong nang mag-load ang pahina",
    de: "beim Laden dieser Seite aus der Lehrplan-Karte und der Aufgabenbank gezählt",
    ja: "このページの読み込み時にカリキュラムマップと問題バンクから集計",
    zh: "页面加载时从课程图谱和题库统计",
    fa: "هنگام بارگذاری این صفحه از نقشهٔ برنامهٔ درسی و بانک پرسش شمرده شده",
    ur: "اس صفحے کے لوڈ ہونے پر نصاب کے نقشے اور سوالات کے بینک سے گنا گیا",
    bn: "এই পাতা লোড হওয়ার সময় পাঠ্যক্রমের মানচিত্র ও প্রশ্নব্যাংক থেকে গণনা করা",
  },
  "home.srcNoPayments": {
    en: "no payment path exists in the code",
    es: "no existe ninguna ruta de pago en el código",
    fr: "aucun chemin de paiement n'existe dans le code",
    pt: "não existe nenhum caminho de pagamento no código",
    ar: "لا يوجد أي مسار دفع في الشيفرة",
    sw: "hakuna njia ya malipo kwenye msimbo",
    hi: "कोड में भुगतान का कोई रास्ता नहीं है",
    id: "tidak ada jalur pembayaran di dalam kode",
    tl: "walang daan ng pagbabayad sa code",
    de: "im Code existiert kein Zahlungsweg",
    ja: "コードに支払いの経路はありません",
    zh: "代码中不存在任何付费路径",
    fa: "هیچ مسیر پرداختی در کد وجود ندارد",
    ur: "کوڈ میں ادائیگی کا کوئی راستہ نہیں",
    bn: "কোডে কোনো পেমেন্ট পথ নেই",
  },
  "home.srcLicence": {
    en: "the licence file, MIT",
    es: "el archivo de licencia, MIT",
    fr: "le fichier de licence, MIT",
    pt: "o ficheiro de licença, MIT",
    ar: "ملف الترخيص، MIT",
    sw: "faili la leseni, MIT",
    hi: "लाइसेंस फ़ाइल, MIT",
    id: "berkas lisensi, MIT",
    tl: "ang file ng lisensya, MIT",
    de: "die Lizenzdatei, MIT",
    ja: "ライセンスファイル、MIT",
    zh: "许可证文件，MIT",
    fa: "پروندهٔ مجوز، MIT",
    ur: "لائسنس فائل، MIT",
    bn: "লাইসেন্স ফাইল, MIT",
  },
  "home.srcDicts": {
    en: "every learner-facing string, in every dictionary",
    es: "todo el texto para el alumno, en todos los diccionarios",
    fr: "tout le texte destiné à l'élève, dans tous les dictionnaires",
    pt: "todo o texto para o aluno, em todos os dicionários",
    ar: "كل نص موجّه للمتعلّم، في كل القواميس",
    sw: "kila maandishi ya mwanafunzi, katika kamusi zote",
    hi: "शिक्षार्थी के लिए हर पाठ, हर शब्दकोश में",
    id: "setiap teks untuk pelajar, di semua kamus",
    tl: "bawat tekstong para sa mag-aaral, sa lahat ng diksyunaryo",
    de: "jede Zeichenkette für Lernende, in allen Wörterbüchern",
    ja: "学習者向けの全文を、すべての辞書で",
    zh: "所有面向学习者的文本，覆盖全部词典",
    fa: "همهٔ متن یادگیرنده، در همهٔ واژه‌نامه‌ها",
    ur: "سیکھنے والے کے لیے ہر متن، ہر لغت میں",
    bn: "শিক্ষার্থীর জন্য সব লেখা, সব অভিধানে",
  },
  "home.notMeasured": {
    en: "About you: not measured",
    es: "Sobre ti: sin medir",
    fr: "À propos de vous : non mesuré",
    pt: "Sobre ti: por medir",
    ar: "عنك: غير مقيس",
    sw: "Kuhusu wewe: haijapimwa",
    hi: "आपके बारे में: अभी मापा नहीं गया",
    id: "Tentang kamu: belum diukur",
    tl: "Tungkol sa iyo: hindi pa nasusukat",
    de: "Über dich: nicht gemessen",
    ja: "あなたについて：未測定",
    zh: "关于你：尚未测量",
    fa: "دربارهٔ شما: اندازه‌گیری‌نشده",
    ur: "آپ کے بارے میں: ابھی ناپا نہیں گیا",
    bn: "আপনার সম্পর্কে: এখনো মাপা হয়নি",
  },
  "home.notMeasuredNote": {
    en: "You have not answered anything here, so there is nothing to show — and an empty square is not a zero. OpenMind treats what it has not seen as unknown, never as a failure.",
    es: "Aquí no has respondido nada, así que no hay nada que mostrar, y un cuadro vacío no es un cero. Lo que OpenMind no ha visto lo trata como desconocido, nunca como un fallo.",
    fr: "Vous n'avez rien répondu ici, il n'y a donc rien à montrer — et une case vide n'est pas un zéro. Ce qu'OpenMind n'a pas vu reste inconnu, jamais un échec.",
    pt: "Aqui não respondeste a nada, por isso não há nada para mostrar — e um quadrado vazio não é um zero. O que o OpenMind não viu fica desconhecido, nunca uma falha.",
    ar: "لم تُجب عن أي شيء هنا، فلا يوجد ما يُعرض — والمربع الفارغ ليس صفرًا. ما لم يره OpenMind يبقى مجهولًا، ولا يُعدّ فشلًا أبدًا.",
    sw: "Hujajibu chochote hapa, kwa hiyo hakuna cha kuonyesha — na mraba mtupu si sifuri. OpenMind huchukulia isiyoonekana kama isiyojulikana, kamwe si kosa.",
    hi: "यहाँ आपने कुछ भी उत्तर नहीं दिया, इसलिए दिखाने को कुछ नहीं है — और खाली ख़ाना शून्य नहीं होता। OpenMind जो नहीं देखा उसे अज्ञात मानता है, कभी असफलता नहीं।",
    id: "Kamu belum menjawab apa pun di sini, jadi tidak ada yang bisa ditampilkan — dan kotak kosong bukan nol. Apa yang belum dilihat OpenMind tetap tidak diketahui, bukan kegagalan.",
    tl: "Wala ka pang sinagot dito, kaya walang maipapakita — at ang walang laman na parisukat ay hindi sero. Ang hindi pa nakita ng OpenMind ay hindi alam, hindi kailanman kabiguan.",
    de: "Du hast hier nichts beantwortet, also gibt es nichts zu zeigen — und ein leeres Kästchen ist keine Null. Was OpenMind nicht gesehen hat, bleibt unbekannt, niemals ein Versagen.",
    ja: "ここではまだ何も答えていないので、示せるものはありません。空欄はゼロではありません。OpenMind は見ていないことを不明として扱い、失敗とは決して扱いません。",
    zh: "你在这里还没有作答，所以没有可展示的内容——而空白的方格不等于零。OpenMind 把没有看到的东西当作未知，绝不当作失败。",
    fa: "اینجا به هیچ پرسشی پاسخ نداده‌اید، پس چیزی برای نشان دادن نیست — و مربع خالی صفر نیست. OpenMind آنچه را ندیده ناشناخته می‌داند، هرگز شکست نه.",
    ur: "یہاں آپ نے کچھ جواب نہیں دیا، اس لیے دکھانے کو کچھ نہیں — اور خالی خانہ صفر نہیں ہوتا۔ OpenMind جو نہیں دیکھا اسے نامعلوم مانتا ہے، کبھی ناکامی نہیں۔",
    bn: "এখানে আপনি এখনো কিছু উত্তর দেননি, তাই দেখানোর মতো কিছু নেই — আর ফাঁকা ঘর শূন্য নয়। OpenMind যা দেখেনি তাকে অজানা ধরে, কখনো ব্যর্থতা নয়।",
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

/** Every language must define every key: a partially translated dictionary would
 *  fall back to English for the whole section, which is the bug being fixed. */
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
console.log(`authored ${PLAN.length} landing-page strings in ${LANGS.length} dictionaries`);
