// Throwaway: per-concept declared (genome) vs emitted (generator) tags.
const { createRequire } = require("node:module");
const req = createRequire(__filename);
const genome = req("../.contentcheck/genome.js");
const q = req("../.contentcheck/questions.js");

const SEEDS = 120;
const want = process.argv.slice(2);
for (const cid of q.GENERATED_CONCEPT_IDS) {
  if (want.length && !want.includes(cid)) continue;
  const emitted = new Set();
  for (let i = 0; i < SEEDS; i++) {
    const item = q.generateQuestion(cid, `m:${i}`);
    if (item) for (const t of item.misconceptionTags) emitted.add(t);
  }
  const declared = genome.CONCEPTS_BY_ID[cid]?.misconceptions ?? [];
  const missing = declared.filter((t) => !emitted.has(t));
  const extra = [...emitted].filter((t) => !declared.includes(t));
  if (want.length || missing.length) {
    console.log(
      cid.padEnd(22),
      "declared:", (declared.join(",") || "-").padEnd(34),
      "emitted:", ([...emitted].join(",") || "-").padEnd(30),
      missing.length ? `DECLARED-NOT-EMITTED: ${missing.join(",")}` : "",
      extra.length ? `EMITTED-NOT-DECLARED: ${extra.join(",")}` : "",
    );
  }
}
