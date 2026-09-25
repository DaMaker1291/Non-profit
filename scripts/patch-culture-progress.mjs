// One-shot: the last user-visible English that no JSX scan could see —
// cultural example labels and sentences (lib/culture.ts), the "Think:" label
// inline in a lesson, and the JS-built Diagnostic→Learning→Independent→Transfer
// gain line on the progress page.
import fs from "node:fs";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const K = {
  // ── culture picker labels ──
  "cul.neutral": ["General examples", "Ejemplos generales", "Exemples généraux", "Exemplos gerais", "أمثلة عامة", "Mifano ya jumla", "सामान्य उदाहरण", "Contoh umum", "Pangkalahatang halimbawa", "Allgemeine Beispiele", "一般的な例", "通用例子", "مثال‌های عمومی", "عام مثالیں", "সাধারণ উদাহরণ"],
  "cul.agriculture": ["Farming, markets, transport", "Agricultura, mercados, transporte", "Agriculture, marchés, transport", "Agricultura, feiras, transporte", "الزراعة والأسواق والنقل", "Kilimo, masoko, usafiri", "खेती, बाज़ार, परिवहन", "Pertanian, pasar, transportasi", "Pagsasaka, palengke, transportasyon", "Landwirtschaft, Märkte, Verkehr", "農業・市場・交通", "农业、市场、交通", "کشاورزی، بازار، حمل‌ونقل", "کھیتی، منڈی، سواری", "কৃষি, বাজার, যাতায়াত"],
  "cul.urban": ["City life, shops, buses", "Vida urbana, tiendas, autobuses", "Vie urbaine, boutiques, bus", "Vida urbana, lojas, ônibus", "حياة المدينة والمتاجر والحافلات", "Maisha ya mjini, maduka, mabasi", "शहरी जीवन, दुकानें, बसें", "Kehidupan kota, toko, bus", "Buhay lungsod, tindahan, bus", "Stadtleben, Läden, Busse", "都市生活・店・バス", "城市生活、商店、公交", "زندگی شهری، مغازه‌ها، اتوبوس", "شہری زندگی، دکانیں، بسیں", "শহরের জীবন, দোকান, বাস"],
  "cul.coast": ["Fishing, rivers, weather", "Pesca, ríos, clima", "Pêche, rivières, météo", "Pesca, rios, clima", "الصيد والأنهار والطقس", "Uvuvi, mito, hali ya hewa", "मछली पकड़ना, नदियाँ, मौसम", "Perikanan, sungai, cuaca", "Pangingisda, ilog, panahon", "Fischerei, Flüsse, Wetter", "漁・川・天気", "渔业、河流、天气", "ماهیگیری، رودخانه، هوا", "ماہی گیری، دریا، موسم", "মাছ ধরা, নদী, আবহাওয়া"],
  "cul.sport": ["Sports and games", "Deportes y juegos", "Sports et jeux", "Esportes e jogos", "الرياضة والألعاب", "Michezo na michezo ya kucheza", "खेल-कूद और खेल", "Olahraga dan permainan", "Palakasan at mga laro", "Sport und Spiele", "スポーツとゲーム", "体育运动和游戏", "ورزش و بازی", "کھیل اور گیمز", "খেলাধুলা ও খেলা"],

  // ── cultural examples ──
  "cul.ex.fractions.neutral": ["sharing a loaf equally", "repartir un pan en partes iguales", "partager un pain en parts égales", "dividir um pão em partes iguais", "تقاسم رغيف بالتساوي", "kugawana mkate kwa usawa", "एक रोटी बराबर बाँटना", "membagi roti sama rata", "paghahati ng tinapay nang patas", "ein Brot gleichmäßig teilen", "パンを公平に分ける", "把一条面包平均分", "تقسیم مساوی یک نان", "ایک روٹی برابر بانٹنا", "একটি রুটি সমান ভাগ করা"],
  "cul.ex.fractions.agriculture": ["sharing a harvest sack equally", "repartir un saco de cosecha en partes iguales", "partager un sac de récolte en parts égales", "dividir um saco de colheita igualmente", "تقاسم كيس حصاد بالتساوي", "kugawana gunia la mavuno kwa usawa", "फ़सल की बोरी बराबर बाँटना", "membagi karung panen sama rata", "paghahati ng sako ng ani nang patas", "einen Erntesack gleichmäßig teilen", "収穫袋を公平に分ける", "把一袋收成平均分", "تقسیم مساوی یک کیسه محصول", "فصل کی بوری برابر بانٹنا", "এক বস্তা ফসল সমান ভাগ করা"],
  "cul.ex.fractions.urban": ["splitting a bus fare equally", "dividir el pasaje del autobús en partes iguales", "partager le prix du bus en parts égales", "dividir a passagem de ônibus igualmente", "تقاسم أجرة الحافلة بالتساوي", "kugawana nauli ya basi kwa usawa", "बस का किराया बराबर बाँटना", "membagi tarif bus sama rata", "paghahati ng pamasahe sa bus nang patas", "ein Busfahrgeld gleichmäßig teilen", "バス代を公平に分ける", "平均分摊公交车费", "تقسیم مساوی کرایه اتوبوس", "بس کا کرایہ برابر بانٹنا", "বাসের ভাড়া সমান ভাগ করা"],
  "cul.ex.fractions.coast": ["sharing a day's catch equally", "repartir la pesca del día en partes iguales", "partager la pêche du jour en parts égales", "dividir a pesca do dia igualmente", "تقاسم صيد اليوم بالتساوي", "kugawana samaki wa siku kwa usawa", "दिन की पकड़ बराबर बाँटना", "membagi hasil tangkapan hari itu sama rata", "paghahati ng huli sa araw nang patas", "den Tagesfang gleichmäßig teilen", "その日の漁獲を公平に分ける", "平均分配当天的渔获", "تقسیم مساوی صید امروز", "دن کی پکڑ برابر بانٹنا", "দিনের মাছ সমান ভাগ করা"],
  "cul.ex.fractions.sport": ["splitting teams equally", "formar equipos iguales", "former des équipes égales", "dividir times igualmente", "تقسيم الفرق بالتساوي", "kugawanya timu kwa usawa", "टीमें बराबर बाँटना", "membagi tim sama rata", "paghahati ng mga koponan nang patas", "Teams gleichmäßig aufteilen", "チームを公平に分ける", "把队伍平均分开", "تقسیم مساوی تیم‌ها", "ٹیمیں برابر بانٹنا", "দল সমান ভাগ করা"],
  "cul.ex.percentages.neutral": ["a 10% discount", "un 10 % de descuento", "une remise de 10 %", "um desconto de 10%", "خصم 10%", "punguzo la 10%", "10% छूट", "diskon 10%", "10% diskwento", "10 % Rabatt", "10%割引", "10% 折扣", "۱۰٪ تخفیف", "10% رعایت", "১০% ছাড়"],
  "cul.ex.percentages.agriculture": ["10% of seed saved back", "10 % de la semilla guardada", "10 % des semences mises de côté", "10% da semente guardada", "10% من البذور محفوظة", "10% ya mbegu iliyohifadhiwa", "10% बीज बचाकर रखना", "10% benih disisihkan", "10% ng binhi na itinabi", "10 % des Saatguts zurückgelegt", "種の10%を残す", "留出 10% 的种子", "۱۰٪ بذر کنار گذاشته", "10% بیج محفوظ", "১০% বীজ রেখে দেওয়া"],
  "cul.ex.percentages.urban": ["10% market commission", "10 % de comisión del mercado", "10 % de commission au marché", "10% de comissão na feira", "عمولة السوق 10%", "10% ya kamishna wa soko", "बाज़ार का 10% कमीशन", "komisi pasar 10%", "10% komisyon sa palengke", "10 % Marktprovision", "市場の手数料10%", "10% 的市场佣金", "۱۰٪ کمیسیون بازار", "10% منڈی کمیشن", "১০% বাজার কমিশন"],
  "cul.ex.percentages.coast": ["10% of catch set aside", "10 % de la pesca apartada", "10 % de la pêche mise de côté", "10% da pesca reservada", "10% من الصيد محفوظ", "10% ya samaki iliyotengwa", "10% पकड़ अलग रखना", "10% tangkapan disisihkan", "10% ng huli ay itinabi", "10 % des Fangs zurückgelegt", "漁獲の10%を取り分ける", "留出 10% 的渔获", "۱۰٪ صید کنار گذاشته", "10% پکڑ الگ رکھنا", "১০% মাছ আলাদা রাখা"],
  "cul.ex.percentages.sport": ["win rate out of games played", "tasa de victorias sobre partidos jugados", "taux de victoires par match joué", "taxa de vitórias por jogos", "نسبة الفوز من المباريات", "kiwango cha ushindi kati ya mechi", "खेले गए मैचों में जीत की दर", "persentase kemenangan dari pertandingan", "panalo sa mga larong nilaro", "Siegquote aus gespielten Spielen", "試合数に対する勝率", "胜场占比赛场次的比例", "نسبت برد به بازی‌های انجام‌شده", "کھیلے گئے میچوں میں جیت کی شرح", "খেলা ম্যাচে জয়ের হার"],

  // ── inline lesson label ──
  "learn.think": ["Think", "Piensa", "Pense", "Pense", "فكّر", "Fikiri", "सोचें", "Pikirkan", "Isipin", "Denk", "考える", "想一想", "فکر کن", "سوچیں", "ভাবুন"],

  // ── progress gain line ──
  "prog.diagnostic": ["Diagnostic", "Diagnóstico", "Diagnostic", "Diagnóstico", "التشخيص", "Utambuzi", "निदान", "Diagnostik", "Diagnostic", "Diagnose", "診断", "诊断", "تشخیص", "تشخیص", "রোগনির্ণয়"],
  "prog.learning": ["Learning", "Aprendizaje", "Apprentissage", "Aprendizado", "التعلّم", "Kujifunza", "सीखना", "Pembelajaran", "Pag-aaral", "Lernen", "学習", "学习", "یادگیری", "سیکھنا", "শেখা"],
  "prog.independent": ["Independent", "Independiente", "Autonome", "Independente", "مستقل", "Kujitegemea", "स्वतंत्र", "Mandiri", "Malaya", "Selbstständig", "自立", "独立", "مستقل", "خودمختار", "স্বাধীন"],
  "prog.transfer": ["Transfer", "Transferencia", "Transfert", "Transferência", "نقل", "Uhamisho", "स्थानांतरण", "Transfer", "Transfer", "Transfer", "転移", "迁移", "انتقال", "منتقلی", "স্থানান্তর"],
  "prog.gain": ["GAIN:", "GANANCIA:", "GAIN :", "GANHO:", "المكسب:", "FAIDA:", "लाभ:", "KEUNTUNGAN:", "KITA:", "ZUWACHS:", "伸び:", "提升：", "رشد:", "اضافہ:", "অর্জন:"],
  "prog.points": ["points", "puntos", "points", "pontos", "نقطة", "pointi", "अंक", "poin", "puntos", "Punkte", "ポイント", "分", "امتیاز", "پوائنٹس", "পয়েন্ট"],
  "prog.diagnostics": ["diagnostics", "diagnósticos", "diagnostics", "diagnósticos", "تشخيصات", "utambuzi", "निदान", "diagnostik", "diagnostic", "Diagnosen", "診断", "次诊断", "تشخیص", "تشخیصات", "রোগনির্ণয়"],
};

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
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v[col])},`);
  if (!lines.length) continue;
  out = out.slice(0, end) + "\n  // ── culture, lesson label, progress gain ──\n" + lines.join("\n") + out.slice(end);
  added += lines.length;
}
fs.writeFileSync("lib/i18n.ts", out);
console.log(`added ${added} keys across ${LANGS.length} dictionaries (${Object.keys(K).length} key names)`);
