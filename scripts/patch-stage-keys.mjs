// One-shot: the genome's stage names (Foundations → Frontier). The subject
// index already looked up `stage.<n>` (and rendered the raw key), while the
// genome map rendered lib/genome.ts's English STAGE_NAMES. Author both in all
// 15 languages; STAGE_NAMES now holds these keys instead of English text.
import fs from "node:fs";

const LANGS = ["en", "es", "fr", "pt", "ar", "sw", "hi", "id", "tl", "de", "ja", "zh", "fa", "ur", "bn"];

const K = {
  "stage.0": ["Foundations", "Fundamentos", "Fondations", "Fundamentos", "الأساسات", "Misingi", "आधार", "Dasar", "Pundasyon", "Grundlagen", "基礎", "基础", "مبانی", "بنیادیں", "ভিত্তি"],
  "stage.1": ["Core", "Núcleo", "Cœur", "Núcleo", "الجوهر", "Msingi", "मुख्य", "Inti", "Ubod", "Kern", "中核", "核心", "هسته", "بنیادی", "মূল"],
  "stage.2": ["Development", "Desarrollo", "Développement", "Desenvolvimento", "التطوير", "Maendeleo", "विकास", "Pengembangan", "Pagpapaunlad", "Entwicklung", "発展", "发展", "توسعه", "ترقی", "বিকাশ"],
  "stage.3": ["Advanced", "Avanzado", "Avancé", "Avançado", "متقدم", "Juu", "उन्नत", "Lanjutan", "Advanced", "Fortgeschritten", "上級", "进阶", "پیشرفته", "اعلیٰ", "উন্নত"],
  "stage.4": ["Specialist", "Especialista", "Spécialiste", "Especialista", "تخصصي", "Mtaalamu", "विशेषज्ञ", "Spesialis", "Espesyalista", "Spezialist", "専門", "专业", "تخصصی", "ماہر", "বিশেষজ্ঞ"],
  "stage.5": ["Frontier", "Frontera", "Frontière", "Fronteira", "الحدود", "Mpakani", "सीमांत", "Garis depan", "Hangganan", "Grenzbereich", "最前線", "前沿", "مرز دانش", "سرحد", "সীমান্ত"],
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
  out = out.slice(0, end) + "\n  // ── genome stages ──\n" + lines.join("\n") + out.slice(end);
  added += lines.length;
}
fs.writeFileSync("lib/i18n.ts", out);
console.log(`added ${added} stage keys across ${LANGS.length} dictionaries`);
