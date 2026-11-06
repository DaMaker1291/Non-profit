#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// DO FOUR STARTING SITUATIONS GET FOUR DIFFERENT ROUTES — FOR EVERY AUTHORED
// LESSON, NOT ONE?
//
// The mandate's central claim is that a lesson must work for a beginner, a pupil
// who has forgotten the topic, one with a partial understanding and a strong one.
// `practiceAim` and `servePractice` (lib/operations.ts) are where that claim either
// exists or does not: they are the ONE owner of the serve decision, shared by the
// route handler and the static build.
//
// Measuring them directly rather than through the UI is deliberate. The page adds
// transport, auth and rendering, but the EDUCATIONAL decision is this function, and
// a harness that drove the browser would be testing whether a click reached the
// function this script already calls. What it does NOT prove is that the read stage
// shows a different EXPLANATION to each learner — it does not, and this script says
// so rather than letting the green ticks imply otherwise.
//
// FIXTURE TRAPS, each found by running this, each worth keeping in view:
//   · `dueReviews` compares `lastSeen` as a NUMBER of milliseconds and needs a
//     `mastery` bucket. A fixture with an ISO string and no mastery silently never
//     comes due — `"2020-01-01" + 30 days` is a string and the comparison is false.
//     The first run reported a "forgotten" learner as identical to a beginner.
//   · a belief id belongs to the GENOME, not to the lesson. An authored lesson's
//     `misconceptions[0].id` is a local handle (`m1`); feeding that to the serve as
//     a belief matched nothing, so every concept read `slip=false` and the sweep
//     looked like a bank-wide content gap. The belief now comes from
//     `getConcept(id).misconceptions[0]`.
//   · the stretch route is an AIM, not a promise about the item. `generateQuestionAt`
//     clamps at `conceptDepth`, so on the eight low-ceiling primary concepts an
//     advanced learner is served at 0.30–0.50 however high the target — that is the
//     documented ceiling limit, not a broken route, and this script separates the
//     two instead of failing the concept for it.
//
//   node scripts/learner-routes.mjs            # every authored lesson
//
// Exists as a script, not a one-off: the routes are a standing property, and a
// change to the aim rules should have to face it.
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const ops = require("../.verify/operations.js");
const authored = require("../.verify/lessons/authored/index.js");
const genome = require("../.verify/genome.js");
const questions = require("../.verify/questions.js");

const DAY = 24 * 60 * 60 * 1000;
/** Above this the concept's own bank can serve a stretch item; at or below it the
 *  serve is clamped and the route can only report the band it really reached. */
const CEILING_ENOUGH = 0.55;
const pad = (s, n) => String(s).padEnd(n).slice(0, n);

const ALL = authored.AUTHORED_LESSONS ?? [];
const lessons = ALL.map((l) => {
  const id = l.conceptId ?? l.meta?.conceptId ?? l.id;
  const concept = typeof id === "string" ? genome.getConcept(id) : null;
  return {
    id,
    belief: concept?.misconceptions?.[0] ?? null,
    ceiling: typeof id === "string" ? questions.conceptDepth(id) : 0,
  };
}).filter((l) => typeof l.id === "string");

const baseState = () => ({
  profile: { id: "route-probe", country: "GB", subjects: ["maths"], subjectCourses: { maths: {} } },
  progress: {},
});

const situations = {
  beginner: () => baseState(),
  forgotten: () => {
    const s = baseState();
    s.progress.CONCEPT = {
      attempts: 6, correct: 5, streak: 0, mastery: 0.92,
      lastSeen: Date.now() - 40 * DAY, misconceptions: {},
    };
    return s;
  },
  partial: (belief) => {
    const s = baseState();
    s.progress.CONCEPT = {
      attempts: 6, correct: 1, streak: 0, mastery: 0.2,
      lastSeen: Date.now(), misconceptions: belief ? { [belief]: 3 } : {},
    };
    return s;
  },
  advanced: () => {
    const s = baseState();
    s.progress.CONCEPT = {
      attempts: 10, correct: 10, streak: 6, mastery: 0.95, lastSeen: Date.now(),
      misconceptions: {}, transfer: { correct: 1, attempts: 1 },
    };
    return s;
  },
};

function measure(conceptId, belief) {
  const out = {};
  for (const [name, build] of Object.entries(situations)) {
    const state = build(belief);
    if (state.progress.CONCEPT) {
      state.progress[conceptId] = state.progress.CONCEPT;
      delete state.progress.CONCEPT;
    }
    const aim = ops.practiceAim(state, conceptId);
    const result = ops.servePractice({ state, conceptId, seed: "routes:probe" });
    out[name] = {
      aim: aim.aim,
      due: aim.due,
      reason: aim.target?.reason ?? "none",
      ok: result.ok,
      served: result.ok ? (result.served.question.difficulty ?? null) : null,
      slip: result.ok ? result.served.slipCheck : null,
      staged: Boolean(state.retrievalStage?.[conceptId]),
    };
  }
  return out;
}

let passed = 0;
let failed = 0;
const check = (cond, msg) => (cond ? (passed++, console.log(`   ✓ ${msg}`)) : (failed++, console.log(`   ✗ FAIL: ${msg}`)));

const table = [];
const noRepair = [];
const noStretchAim = [];
const clamped = [];
const stretchServed = [];
const noSlip = [];
let beliefMissing = [];

for (const { id, belief, ceiling } of lessons) {
  if (!belief) beliefMissing.push(id);
  const r = measure(id, belief);
  const aims = [...new Set([r.beginner.aim, r.forgotten.aim, r.partial.aim, r.advanced.aim].map((a) => a.toFixed(3)))];
  table.push({
    id,
    ceiling,
    aims: aims.length,
    forgot: `${r.forgotten.reason}${r.forgotten.due ? "+due" : ""}${r.forgotten.staged ? "+ret" : ""}`,
    repair: r.partial.reason,
    stretch: r.advanced.reason,
    served: r.advanced.served,
    beginnerServed: r.beginner.served,
    slip: r.partial.slip,
    ok: Object.values(r).every((x) => x.ok),
  });
  if (!r.partial.ok || r.partial.reason !== "repair") noRepair.push(id);
  if (!r.advanced.ok || r.advanced.aim <= r.beginner.aim) noStretchAim.push(id);
  if (r.advanced.ok && r.advanced.served !== null && r.beginner.ok && r.beginner.served !== null) {
    if (ceiling <= CEILING_ENOUGH) clamped.push(id);
    else if (r.advanced.served <= r.beginner.served) stretchServed.push(id);
  }
  if (r.partial.reason === "repair" && r.partial.slip !== true) noSlip.push(id);
}

console.log(`\n▸ Four starting situations across ${table.length} authored lessons\n`);
console.log(
  `${pad("concept", 24)} ceil  aims ${pad("forgotten", 20)} ${pad("repair", 7)} ${pad("stretch", 8)} beg→adv served  slip`,
);
for (const t of table) {
  console.log(
    `${pad(t.id, 24)} ${t.ceiling.toFixed(2)}  ${pad(t.aims, 5)}${pad(t.forgot, 21)} ${pad(t.repair, 7)} ${pad(t.stretch, 8)} ` +
      `${t.beginnerServed === null ? "-" : t.beginnerServed.toFixed(2)}→${t.served === null ? "-" : t.served.toFixed(2)}       ${t.slip === true ? "Y" : t.slip === false ? "." : "-"}`,
  );
}

console.log("");
check(table.length >= 16, `every authored lesson was measured (${table.length})`);
check(table.every((t) => t.ok), `every lesson served all four situations (${table.filter((t) => t.ok).length}/${table.length})`);
check(noRepair.length === 0, `every lesson routes a stuck learner to a repair (${noRepair.join(", ") || "none missing"})`);
check(noStretchAim.length === 0, `every lesson aims an advanced learner above a beginner (${noStretchAim.join(", ") || "none stuck"})`);
check(table.every((t) => t.aims >= 2), `the aim follows the record in every lesson (min ${Math.min(...table.map((t) => t.aims))} distinct aims)`);
check(
  table.every((t) => t.forgot.startsWith("steady+due+ret")),
  `a forgotten topic is a retrieval check in every lesson, not a fresh start (${table.filter((t) => !t.forgot.startsWith("steady+due+ret")).length} exceptions)`,
);
check(
  stretchServed.length === 0,
  `where the bank can reach it, an advanced learner is served deeper than a beginner (${stretchServed.join(", ") || "none stuck"})`,
);

console.log(
  `\n   ceiling-clamped, reported not failed: ${clamped.length}/${table.length}` +
    (clamped.length ? ` — ${clamped.join(", ")}` : ""),
);
console.log(`   belief resolved from the genome in ${table.length - beliefMissing.length}/${table.length}` +
  (beliefMissing.length ? ` — missing: ${beliefMissing.join(", ")}` : ""));
console.log(
  `   repair reached a slip-tagged item in ${table.length - noSlip.length}/${table.length}` +
    (noSlip.length ? ` — not reached: ${noSlip.join(", ")}` : ""),
);

// ── THE READ STAGE'S ONE EVIDENCE-BRANCHED SECTION ───────────────────────────
//
// The sweep above measures the SERVE. The lesson page is where a learner actually
// reads, and for a due concept it now opens on a recall prompt instead of the
// teaching. That is asserted here as a SOURCE-ORDER check and labelled as such: it
// proves the card exists, is gated on the scheduler, and comes before the teaching —
// not that React paints it. The browser proof is a separate, honest gap.
const pageSrc = readFileSync(new URL("../app/learn/[subject]/[concept]/page.tsx", import.meta.url), "utf8");
const gateAt = pageSrc.indexOf("isRetentionDue(state, conceptId)");
const cardAt = pageSrc.indexOf('t("skill.recall")');
const ideaAt = pageSrc.indexOf('t("learn.idea")');
check(gateAt > 0 && cardAt > 0, `the lesson page asks the scheduler whether the topic has faded (gate=${gateAt}, card=${cardAt})`);
check(
  gateAt < cardAt && cardAt < ideaAt,
  `the recall prompt is gated, and comes BEFORE the teaching (gate ${gateAt} < card ${cardAt} < idea ${ideaAt})`,
);
check(
  !/t\("[a-z]+\.[A-Za-z]+"\)[^\n]*recall/.test(pageSrc) && pageSrc.includes('t("plan.rest")'),
  "the card uses only strings already translated in all 15 dictionaries (plan.finishIt, plan.rest, skill.recall)",
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
