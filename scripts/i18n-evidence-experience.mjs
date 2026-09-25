// One-shot: strings for Evidence → Experience — the "why this?" drawer, the
// per-dimension "based on" block, the human names for evidence sources, and
// the engine's expected-outcome sentences. Authored in all 15 languages here;
// the call sites are switched to t() in the same change.
import fs from "node:fs";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const K = {
  "next.outcome.explain": [
    "After this: the idea is understood and answerable without help.",
    "Después de esto: la idea queda entendida y podrás responderla sin ayuda.",
    "Après cela : l'idée est comprise et tu peux y répondre sans aide.",
    "Depois disto: a ideia fica compreendida e você responde sem ajuda.",
    "بعد هذا: تكون الفكرة مفهومة وتستطيع الإجابة عنها دون مساعدة.",
    "Baada ya hapo: wazo linaeleweka na unaweza kujibu bila msaada.",
    "इसके बाद: विचार समझ आ जाएगा और बिना मदद उत्तर दे पाएँगे।",
    "Setelah ini: idenya dipahami dan bisa dijawab tanpa bantuan.",
    "Pagkatapos nito: naiintindihan na ang ideya at kayang sagutin nang mag-isa.",
    "Danach: die Idee ist verstanden und ohne Hilfe beantwortbar.",
    "この後：考え方が理解でき、助けなしで答えられます。",
    "之后：这个想法就弄懂了，不需要帮助也能答出来。",
    "بعد از این: ایده فهمیده شده و بدون کمک می‌توانی پاسخش بدهی.",
    "اس کے بعد: تصور سمجھ آ جائے گا اور بغیر مدد کے جواب دے سکو گے۔",
    "এর পরে: ধারণাটি বোঝা যাবে এবং সাহায্য ছাড়াই উত্তর দিতে পারবে।",
  ],
  "next.outcome.practise": [
    "After this: the method holds up under independent exam-style questions.",
    "Después de esto: el método se mantiene en preguntas de examen independientes.",
    "Après cela : la méthode tient face à des questions d'examen en autonomie.",
    "Depois disto: o método se sustenta em questões de prova independentes.",
    "بعد هذا: تصمد الطريقة أمام أسئلة امتحانية مستقلة.",
    "Baada ya hapo: njia inasimama katika maswali ya mtihani bila msaada.",
    "इसके बाद: तरीका स्वतंत्र परीक्षा-शैली के प्रश्नों में टिकेगा।",
    "Setelah ini: metodenya bertahan dalam soal ujian mandiri.",
    "Pagkatapos nito: nananatili ang paraan sa mga tanong na parang pagsusulit.",
    "Danach: die Methode hält selbstständigen Prüfungsaufgaben stand.",
    "この後：独自の試験形式の問題でも方法が保ちます。",
    "之后：这个方法在独立完成的考试题里也站得住。",
    "بعد از این: روش در سؤال‌های امتحانی مستقل دوام می‌آورد.",
    "اس کے بعد: طریقہ خودمختار امتحانی سوالوں میں ٹکے گا۔",
    "এর পরে: পদ্ধতিটি নিজের পরীক্ষার প্রশ্নেও টিকবে।",
  ],
  "next.outcome.retrieve": [
    "After this: the knowledge is refreshed and still yours.",
    "Después de esto: el conocimiento queda refrescado y sigue siendo tuyo.",
    "Après cela : la connaissance est ravivée et reste à toi.",
    "Depois disto: o conhecimento é reativado e continua seu.",
    "بعد هذا: يكون المعلم قد انعش وبقي ملكك.",
    "Baada ya hapo: maarifa yanakadiriwa upya na yanabaki yako.",
    "इसके बाद: ज्ञान तरोताज़ा रहेगा और आपका ही रहेगा।",
    "Setelah ini: pengetahuan segar kembali dan tetap milikmu.",
    "Pagkatapos nito: sariwa muli ang kaalaman at sa'yo pa rin.",
    "Danach: das Wissen ist aufgefrischt und bleibt deins.",
    "この後：知識が取り戻され、あなたのもののままです。",
    "之后：知识被重新唤醒，仍然是你的。",
    "بعد از این: دانش تازه می‌شود و همچنان مالِ توست.",
    "اس کے بعد: علم تازہ ہو گا اور آپ کا ہی رہے گا۔",
    "এর পরে: জ্ঞানটি টাটকা হবে এবং তোমারই থাকবে।",
  ],
  "next.outcome.remediate": [
    "After this: the recurring slip is repaired, not just avoided once.",
    "Después de esto: el error recurrente queda reparado, no solo evitado una vez.",
    "Après cela : l'erreur récurrente est réparée, pas seulement évitée une fois.",
    "Depois disto: o erro recorrente fica reparado, não apenas evitado uma vez.",
    "بعد هذا: يُصلَّح الخطأ المتكرر، لا أن يُتجنَّب مرة واحدة فقط.",
    "Baada ya hapo: kosa linalorudia limetengenezwa, si kuepukwa mara moja tu.",
    "इसके बाद: बार-बार वाली चूक ठीक हो जाएगी, केवल एक बार टाली नहीं जाएगी।",
    "Setelah ini: kesalahan berulang diperbaiki, bukan hanya dihindari sekali.",
    "Pagkatapos nito: naitatama ang paulit-ulit na mali, hindi lang naiwasan nang isang beses.",
    "Danach: der wiederkehrende Fehler ist behoben, nicht nur einmal vermieden.",
    "この後：繰り返していたつまずきが直ります。一度避けただけではありません。",
    "之后：反复出现的错误被修复，而不只是躲过一次。",
    "بعد از این: اشتباه تکراری درست می‌شود، نه اینکه فقط یک بار از آن بگذری.",
    "اس کے بعد: بار بار والی غلطی درست ہو جائے گی، صرف ایک بار ٹالنا نہیں۔",
    "এর পরে: বারবারের ভুলটি সারানো হবে, শুধু একবার এড়ানো নয়।",
  ],
  "next.outcome.challenge": [
    "After this: the next concept has its first real evidence.",
    "Después de esto: el siguiente concepto tendrá su primera evidencia real.",
    "Après cela : le prochain concept aura ses premières preuves.",
    "Depois disto: o próximo conceito terá sua primeira evidência real.",
    "بعد هذا: يحصل المفهوم التالي على أول دليل حقيقي عليه.",
    "Baada ya hapo: dhana inayofuata ina uthibitisho wake wa kwanza.",
    "इसके बाद: अगले सिद्धांत का पहला वास्तविक सबूत बन जाएगा।",
    "Setelah ini: konsep berikutnya punya bukti nyata pertamanya.",
    "Pagkatapos nito: may unang tunay na ebidensya na ang susunod na konsepto.",
    "Danach: das nächste Konzept hat seinen ersten echten Beleg.",
    "この後：次の概念に最初の本当の証拠がつきます。",
    "之后：下一个概念会有它的第一条真实证据。",
    "بعد از این: مفهوم بعدی اولین شواهد واقعی خودش را می‌گیرد.",
    "اس کے بعد: اگلے تصور کا پہلا حقیقی ثبوت بن جائے گا۔",
    "এর পরে: পরের ধারণার প্রথম প্রকৃত প্রমাণ তৈরি হবে।",
  ],
  "next.outcome.transfer": [
    "After this: the idea survives unfamiliar wording — the strongest evidence there is.",
    "Después de esto: la idea sobrevive a un planteamiento nuevo — la evidencia más fuerte que existe.",
    "Après cela : l'idée survit à un énoncé inconnu — la preuve la plus solide qui soit.",
    "Depois disto: a ideia sobrevive a uma situação nova — a evidência mais forte que existe.",
    "بعد هذا: تصمد الفكرة أمام صياغة جديدة — أقوى دليل موجود.",
    "Baada ya hapo: wazo linasimama kwa maneno mapya — uthibitisho imara zaidi.",
    "इसके बाद: विचार नई भाषा में भी टिकेगा — यही सबसे मज़बूत सबूत है।",
    "Setelah ini: ide bertahan dalam kalimat baru — bukti terkuat yang ada.",
    "Pagkatapos nito: nakayanan ng ideya ang bagong pormulasyon — ang pinakamalakas na ebidensya.",
    "Danach: die Idee übersteht unbekannte Formulierungen — der stärkste Beleg überhaupt.",
    "この後：知らない言葉づらでも考え方が保ちます — 一番強い証拠です。",
    "之后：换个说法这个想法也依然成立——这是最强的证据。",
    "بعد از این: ایده در بیان جدید هم دوام می‌آورد — قوی‌ترین شواهد همین است.",
    "اس کے بعد: نیے الفاظ میں بھی تصور قائم رہے گا — یہی سب سے مضبوط ثبوت ہے۔",
    "এর পরে: নতুন ভাষায়ও ধারণাটি টিকবে — এটাই সবচেয়ে জোরালো প্রমাণ।",
  ],
  "next.outcome.project": [
    "After this: strong concepts become a piece of work you can show.",
    "Después de esto: los conceptos fuertes se convierten en un trabajo que puedes mostrar.",
    "Après cela : les concepts maîtrisés deviennent un travail à montrer.",
    "Depois disto: conceitos fortes viram um trabalho que você pode mostrar.",
    "بعد هذا: تتحول المفاهيم القوية إلى عمل يمكنك عرضه.",
    "Baada ya hapo: dhana imara zinakuwa kazi unayoweza kuonyesha.",
    "इसके बाद: मज़बूत सिद्धांत दिखाने लायक काम बन जाएँगे।",
    "Setelah ini: konsep yang kuat menjadi karya yang bisa ditunjukkan.",
    "Pagkatapos nito: nagiging gawang maipapakita ang mga malalakas na konsepto.",
    "Danach: starke Konzepte werden zu einer Arbeit, die du zeigen kannst.",
    "この後：得意な概念が見せられる作品になります。",
    "之后：掌握的概念变成一件能展示的作品。",
    "بعد از این: مفاهیم محکم به کاری قابل نمایش تبدیل می‌شوند.",
    "اس کے بعد: مضبوط تصورات ایسے کام بنیں گے جو دکھا سکیں۔",
    "এর পরে: পাকা ধারণাগুলি দেখানোর মতো কাজ হয়ে উঠবে।",
  ],
  "next.outcome.rest": [
    "Nothing to establish — come back when retrieval is due.",
    "Nada por establecer — vuelve cuando toque repasar.",
    "Rien à établir — reviens quand une révision arrive à échéance.",
    "Nada a estabelecer — volte quando houver revisão pendente.",
    "لا شيء يُثبت الآن — عُد عندما يحين وقت المراجعة.",
    "Hakuna cha kuthibitisha — rudi ukirejesho ukikaribia.",
    "अभी कुछ स्थापित करना नहीं — दोहराव के समय पर लौटें।",
    "Tidak ada yang perlu dibuktikan — kembali saat pengulangan jatuh tempo.",
    "Walang kailangang patunayan — bumalik kapag due na ang pagbabalik-tanaw.",
    "Nichts zu belegen — komm wieder, wenn eine Wiederholung fällig ist.",
    "証明すべきことはありません — 復習の予定が来たら戻ってきてください。",
    "暂时没有要证明的——到该复习的时候再来。",
    "چیزی برای اثبات نیست — وقتی مرور موعد شد برگرد.",
    "ثابت کرنے کو کچھ نہیں — دہرائے کے وقت پر واپس آئیں۔",
    "প্রমাণ করার কিছু নেই — পুনরালোচনার সময় হলে ফিরে এসো।",
  ],
  "evv.because": [
    "Because", "Porque", "Parce que", "Porque", "لأن", "Kwa sababu", "क्योंकि", "Karena", "Dahil sa", "Weil", "なぜなら", "因为", "چون", "کیونکہ", "কারণ",
  ],
  "evv.whyNow": [
    "Why now", "Por qué ahora", "Pourquoi maintenant", "Por que agora", "لماذا الآن", "Kwa nini sasa", "अभी क्यों", "Mengapa sekarang", "Bakit ngayon", "Warum jetzt", "なぜ今か", "为什么是现在", "چرا حالا", "اب کیوں", "কেন এখন",
  ],
  "evv.after": [
    "After this", "Después de esto", "Après cela", "Depois disto", "بعد هذا", "Baada ya hapo", "इसके बाद", "Setelah ini", "Pagkatapos nito", "Danach", "この後", "之后", "بعد از این", "اس کے بعد", "এর পরে",
  ],
  "evv.basedOn": [
    "Based on", "Basado en", "D'après", "Com base em", "بناءً على", "Kulingana na", "के आधार पर", "Berdasarkan", "Batay sa", "Auf der Grundlage von", "根拠", "根据", "بر اساس", "بنیاد پر", "ভিত্তি ধরে",
  ],
  "evv.notYet": [
    "Not yet measured:",
    "Aún sin medir:",
    "Pas encore mesuré :",
    "Ainda não medido:",
    "لم يُقَس بعد:",
    "Hakijapimwa bado:",
    "अभी मापा नहीं गया:",
    "Belum diukur:",
    "Hindi pa nasukat:",
    "Noch nicht gemessen:",
    "まだ測定していません:",
    "尚未测量：",
    "هنوز اندازه‌گیری نشده:",
    "ابھی ناپا نہیں گیا:",
    "এখনো মাপা হয়নি:",
  ],
  "evv.theEvidence": [
    "The evidence", "La evidencia", "Les preuves", "As evidências", "الأدلة", "Ushahidi", "सबूत", "Bukti", "Ang ebidensya", "Die Belege", "証拠", "证据", "شواهد", "ثبوت", "প্রমাণ",
  ],
  "evv.offline": [
    "recorded offline", "registrado sin conexión", "enregistré hors ligne", "registrado offline", "سُجّل دون اتصال", "iliandikwa nje ya mtandao", "ऑफ़लाइन दर्ज", "dicatat luring", "naitala nang offline", "offline aufgezeichnet", "オフラインで記録", "离线记录", "آفلاین ثبت شده", "آف لائن ریکارڈ", "অফলাইনে রেকর্ড",
  ],
  "evv.noCitations": [
    "No individual answers behind this one yet — the reasoning above stands on the model as a whole.",
    "Aún no hay respuestas individuales detrás de esta decisión — el razonamiento de arriba se apoya en el modelo completo.",
    "Aucune réponse individuelle derrière cette décision pour l'instant — le raisonnement ci-dessus s'appuie sur le modèle entier.",
    "Ainda não há respostas individuais por trás desta decisão — o raciocínio acima se apoia no modelo como um todo.",
    "لا توجد إجابات فردية وراء هذا بعد — المنطق أعلاه يقوم على النموذج ككل.",
    "Hakuna majibu binafsi nyuma ya hili bado — mawazo yaliyo hapo juu yanategemea mfano mzima.",
    "इसके पीछे अभी कोई व्यक्तिगत उत्तर नहीं — ऊपर दिया तर्क पूरे मॉडल पर टिका है।",
    "Belum ada jawaban individual di balik ini — alasan di atas berdiri di atas model keseluruhan.",
    "Wala pang indibidwal na sagot sa likod nito — nakasandal ang katwiran sa buong modelo.",
    "Dahinter stehen noch keine einzelnen Antworten — die Begründung oben stützt sich auf das Modell als Ganzes.",
    "この裏にある個別の回答はまだありません — 上の理由はモデル全体に基づいています。",
    "这背后还没有具体的答题记录——上面的理由基于整个模型。",
    "هنوز پاسخ فردی پشت این نیست — استدلال بالا بر کل مدل تکیه دارد.",
    "اس کے پیچھے ابھی کوئی انفرادی جواب نہیں — اوپر کی وجہ پورے ماڈل پر قائم ہے۔",
    "এর পেছনে এখনো কোনো ব্যক্তিগত উত্তর নেই — উপরের যুক্তিটি পুরো মডেলের ভিত্তিতে দাঁড়িয়ে।",
  ],
  "evv.timeline": [
    "View your evidence", "Ver tu evidencia", "Voir tes preuves", "Ver suas evidências", "اعرض أدلتك", "Tazama ushahidi wako", "अपना सबूत देखें", "Lihat buktimu", "Tingnan ang ebidensya mo", "Deine Belege ansehen", "あなたの証拠を見る", "查看你的证据", "شواهدت را ببین", "اپنا ثبوت دیکھیں", "তোমার প্রমাণ দেখো",
  ],
  "evv.unmeasured": [
    "Not yet measured", "Aún sin medir", "Pas encore mesuré", "Ainda não medido", "لم يُقَس بعد", "Haijapimwa bado", "अभी मापा नहीं गया", "Belum diukur", "Hindi pa nasukat", "Noch nicht gemessen", "まだ未測定", "尚未测量", "هنوز اندازه‌گیری نشده", "ابھی ناپا نہیں گیا", "এখনো মাপা হয়নি",
  ],
  "evv.dim.recalled": [
    "Recall", "Recuerdo", "Rappel", "Memorização", "التذكر", "Kukumbuka", "स्मरण", "Mengingat", "Pag-alaala", "Abruf", "記憶", "回忆", "یادآوری", "یاددہانی", "স্মরণ",
  ],
  "evv.dim.applied": [
    "Application", "Aplicación", "Application", "Aplicação", "التطبيق", "Utekelezaji", "अनुप्रयोग", "Penerapan", "Aplikasyon", "Anwendung", "応用", "应用", "کاربست", "اطلاق", "প্রয়োগ",
  ],
  "evv.dim.transferred": [
    "Transfer", "Transferencia", "Transfert", "Transferência", "النقل", "Kuhamisha", "स्थानांतरण", "Transfer", "Paglilipat", "Übertragung", "転移", "迁移", "انتقال", "منتقلی", "স্থানান্তর",
  ],
  "evv.dim.retention": [
    "Long-term retention", "Retención a largo plazo", "Rétention à long terme", "Retenção a longo prazo", "الاحتفاظ طويل الأمد", "Kumbukumbu ya muda mrefu", "दीर्घकालिक स्मृति", "Retensi jangka panjang", "Pangmatagalang pagkakaalala", "Langzeitgedächtnis", "長期の定着", "长期保持", "نگه‌داری بلندمدت", "طویل مدتی یادداشت", "দীর্ঘমেয়াদি স্মৃতি",
  ],
  "evv.source.diagnostic": [
    "Diagnostic", "Diagnóstico", "Diagnostic", "Diagnóstico", "تشخيص", "Upimaji", "निदान", "Diagnostik", "Pagsusuri", "Diagnose", "診断", "诊断", "سنجش", "تشخیص", "নির্ণয়",
  ],
  "evv.source.practice": [
    "Practice", "Práctica", "Entraînement", "Prática", "تدريب", "Mazoezi", "अभ्यास", "Latihan", "Pagsasanay", "Übung", "練習", "练习", "تمرین", "مشق", "অভ্যাস",
  ],
  "evv.source.retrieval": [
    "Retrieval", "Repaso", "Révision", "Revisão", "استرجاع", "Kurejeshwa", "पुनरावृत्ति", "Pengulangan", "Pagbalik-tanaw", "Wiederholung", "復習", "复习", "مرور", "دہرائی", "পুনরালোচনা",
  ],
  "evv.source.past_paper": [
    "Past paper", "Examen anterior", "Sujet d'examen", "Prova anterior", "امتحان سابق", "Karatasi ya zamani", "पिछला पेपर", "Ujian lampau", "Nakaraang pagsusulit", "Alte Prüfung", "過去問", "真题", "امتحان قبلی", "پرانا پیپر", "বিগত সালের প্রশ্ন",
  ],
  "evv.source.transfer": [
    "Transfer task", "Tarea de transferencia", "Exercice de transfert", "Tarefa de transferência", "مهمة نقل", "Kazi ya kuhamisha", "स्थानांतरण कार्य", "Tugas transfer", "Gawain sa paglilipat", "Transfer-Aufgabe", "転移課題", "迁移任务", "تکلیف انتقال", "منتقلی کام", "স্থানান্তর কাজ",
  ],
  "evv.source.project": [
    "Project", "Proyecto", "Projet", "Projeto", "مشروع", "Mradi", "परियोजना", "Proyek", "Proyekto", "Projekt", "プロジェクト", "项目", "پروژه", "منصوبہ", "প্রকল্প",
  ],
  "pev.fromLedger": [
    "Recorded from your answers",
    "Registrado a partir de tus respuestas",
    "Enregistré à partir de tes réponses",
    "Registrado a partir das suas respostas",
    "مسجل من إجاباتك",
    "Imerekodiwa kutoka majibu yako",
    "आपके उत्तरों से दर्ज",
    "Dicatat dari jawaban Anda",
    "Naitala mula sa mga sagot mo",
    "Aus deinen Antworten aufgezeichnet",
    "あなたの解答から記録",
    "从你的答题中记录",
    "ثبت‌شده از پاسخ‌های شما",
    "آپ کے جوابات سے ریکارڈ",
    "তোমার উত্তর থেকে রেকর্ড",
  ],
  "pev.viewAll": [
    "All evidence", "Toda la evidencia", "Toutes les preuves", "Todas as evidências", "كل الأدلة", "Ushahidi wote", "सारा सबूत", "Semua bukti", "Lahat ng ebidensya", "Alle Belege", "すべての証拠", "全部证据", "همه شواهد", "سب ثبوت", "সব প্রমাণ",
  ],
};

// sanity: every row must have exactly one value per language
for (const [k, v] of Object.entries(K)) {
  if (v.length !== LANGS.length) throw new Error(`${k}: ${v.length} values for ${LANGS.length} languages`);
}

const declRe = /^(?:export )?const (\w+): Dict = \{$/gm;
let out = fs.readFileSync("lib/i18n.ts", "utf8");
let added = 0;
for (const lang of LANGS) {
  declRe.lastIndex = 0;
  const decls = []; let d;
  while ((d = declRe.exec(out))) decls.push({ name: d[1], start: d.index });
  const idx = decls.findIndex((x) => x.name === lang);
  if (idx < 0) { console.error(`no dictionary for ${lang}`); process.exit(1); }
  const start = decls[idx].start;
  const rel = out.slice(start).match(/\n[ \t]*\};/);
  if (!rel) { console.error(`${lang}: closing brace not found`); process.exit(1); }
  const end = start + rel.index;
  const have = new Set([...out.slice(start, end).matchAll(/"([a-zA-Z0-9._-]+)":/g)].map((m) => m[1]));
  const col = LANGS.indexOf(lang);
  const lines = Object.entries(K)
    .filter(([k]) => !have.has(k))
    .map(([k, v]) => `  "${k}": ${JSON.stringify(v[col])},`);
  if (lines.length === 0) continue;
  out = out.slice(0, end) + "\n" + lines.join("\n") + out.slice(end);
  added += lines.length;
}
fs.writeFileSync("lib/i18n.ts", out);
console.log(`added ${added} strings (${Object.keys(K).length} keys × ${LANGS.length} languages)`);
