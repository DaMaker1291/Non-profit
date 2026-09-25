// Throwaway: measure which concepts' generators ACTUALLY emit which tags, and
// compare with the two declarations (genome's per-concept list, catalogue's list).
const { createRequire } = require("node:module");
const req = createRequire(__filename);
const genome = req("../.contentcheck/genome.js");
const q = req("../.contentcheck/questions.js");
const mis = req("../.contentcheck/misconceptions.js");

const SEEDS = 80;
const emitted = new Map(); // tag -> Set(conceptId)
for (const cid of q.GENERATED_CONCEPT_IDS) {
  for (let i = 0; i < SEEDS; i++) {
    const item = q.generateQuestion(cid, `measure:${i}`);
    if (!item) continue;
    for (const t of item.misconceptionTags) {
      if (!emitted.has(t)) emitted.set(t, new Set());
      emitted.get(t).add(cid);
    }
  }
}

const declaredGenome = new Map(); // tag -> Set(concept)
for (const c of genome.CONCEPTS) {
  for (const t of c.misconceptions ?? []) {
    if (!declaredGenome.has(t)) declaredGenome.set(t, new Set());
    declaredGenome.get(t).add(c.id);
  }
}

const rows = [];
for (const m of Object.values(mis.MISCONCEPTIONS_BY_ID)) {
  const cat = new Set(m.concepts);
  const gen = declaredGenome.get(m.id) ?? new Set();
  const meas = emitted.get(m.id) ?? new Set();
  const missCat = [...gen].filter((c) => !cat.has(c));   // genome says X targets it, catalogue doesn't list X
  const extraCat = [...cat].filter((c) => !gen.has(c));  // catalogue lists Y, genome doesn't claim it
  const notMeasured = [...cat].filter((c) => !meas.has(c)); // catalogue lists Z but no draw ever emitted the tag
  rows.push({ id: m.id, cat: cat.size, gen: gen.size, meas: meas.size, missCat, extraCat, notMeasured, measured: [...meas].sort() });
}
rows.sort((a, b) => a.id.localeCompare(b.id));
console.log("id                cat gen meas | genome-claims-not-in-catalogue | catalogue-lists-not-declared | catalogue-lists-but-never-emitted");
for (const r of rows) {
  console.log(
    r.id.padEnd(17), String(r.cat).padStart(3), String(r.gen).padStart(3), String(r.meas).padStart(4), "|",
    r.missCat.join(",") || "-", "|", r.extraCat.join(",") || "-", "|", r.notMeasured.join(",") || "-",
  );
}
const orphanTags = [...emitted.keys()].filter((t) => !mis.MISCONCEPTIONS_BY_ID[t]);
console.log("\ntags emitted by generators but NOT in the catalogue:", orphanTags.join(", ") || "none");
for (const t of orphanTags) console.log("   ", t, "->", [...emitted.get(t)].sort().join(", "));
const unusedCatalogue = Object.keys(mis.MISCONCEPTIONS_BY_ID).filter((t) => !emitted.has(t));
console.log("\ncatalogue entries no draw ever emitted:", unusedCatalogue.join(", ") || "none");
