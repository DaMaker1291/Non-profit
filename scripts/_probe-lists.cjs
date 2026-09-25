// Throwaway: the measured `concepts` array for every catalogue entry.
const { createRequire } = require("node:module");
const req = createRequire(__filename);
const mis = req("../.contentcheck/misconceptions.js");
const graph = req("../.contentcheck/content-graph.js");

const detected = graph.tagDetection();
for (const m of Object.values(mis.MISCONCEPTIONS_BY_ID)) {
  const measured = detected[m.id] ?? [];
  const current = m.concepts;
  const same = measured.length === current.length && measured.every((x, i) => x === current[i]);
  console.log(`${same ? "  " : "→ "}${m.id}: [${measured.map((x) => `"${x}"`).join(", ")}]  (was: ${current.join(",")})`);
}
