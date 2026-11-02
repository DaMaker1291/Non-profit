// ─────────────────────────────────────────────────────────────────────────────
// THE CONSTRUCTED-RESPONSE AUDIT.
//
// The 149-item pilot pack is generated multiple-choice/numeric content. The
// product also has authored constructed-response items with method marks, and
// they were invisible to that pack: a teacher could review every generated item
// and never see the format Stage 3 is asking for. This script does two things
// that the generated-item audit cannot:
//
//   · it exercises EVERY structured item against representative responses —
//     full, blank, correct answer without working, correct working with a wrong
//     answer, a missing unit, a wrong graph, a partial plot, a wrong algebra
//     form, and a table with one cell wrong;
//   · it writes a teacher-facing mark-scheme addendum, because a marking claim
//     nobody can inspect is not a review.
//
// WHAT THIS IS NOT: it is not human review. `audit/item-reviews.json` remains
// the only source of a human-review claim, and it is empty. A green run here
// says the marking engine handles these authored cases correctly; it does not
// say the questions are good, the level is right, or a teacher has read them.
//
// Usage: node scripts/audit-structured-items.mjs
// Writes: audit/structured-items-audit.json
//         audit/structured-items-audit.md
//         docs/STRUCTURED_REVIEW_PACK.md
// Exit: 1 when any marking scenario disagrees with its authored scheme, or a
//       structural invariant fails; 0 with warnings otherwise.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const SI = require("../.verify/structured-items.js");
const G = require("../.verify/genome.js");
const S = require("../.verify/specifications.js");
const PG = require("../.verify/plot-geometry.js");

const OUT_JSON = path.join("audit", "structured-items-audit.json");
const OUT_MD = path.join("audit", "structured-items-audit.md");
const OUT_REVIEW = path.join("docs", "STRUCTURED_REVIEW_PACK.md");
const PACK = path.join("audit", "pilot-pack.json");

const SPEC = S.specById("uk-gcse");
if (!SPEC) throw new Error("uk-gcse specification is missing");

const levelConcepts = Object.fromEntries(
  SPEC.levels.map((level) => [
    level.id,
    new Set(S.coverageOf({ spec: SPEC, level }).map((c) => c.id)),
  ]),
);
const tiersFor = (id) => SPEC.levels.filter((level) => levelConcepts[level.id].has(id)).map((l) => l.id);

const pack = fs.existsSync(PACK) ? JSON.parse(fs.readFileSync(PACK, "utf8")) : null;
const packConcepts = new Set((pack?.concepts ?? []).map((c) => c.id));

const TIER_LABEL = { foundation: "Foundation", higher: "Higher" };
const RESPONSE_LABEL = {
  number: "numeric entry",
  graph: "two points on a line",
  plot: "plotted points joined",
  readoff: "read from the learner's line",
  algebra: "algebraic expression",
  table: "table cells",
};
const proseWords = (s) => String(s ?? "").split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w)).length;
const round = (n, d = 2) => (n === null || n === undefined ? null : Number(n.toFixed(d)));
const list = (xs) => xs.join(", ");

const checks = [];
const failures = [];
const warnings = [];
function check(ok, label, detail = "") {
  checks.push({ ok: Boolean(ok), label, detail });
  if (!ok) failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
}
function warn(message) {
  warnings.push(message);
}

// ── Authoring helpers ────────────────────────────────────────────────────────

function numberAnswer(p) {
  if (p.accepted?.length) return p.accepted[0];
  return p.unitRequired && p.unit ? `${p.answer} ${p.unit}` : String(p.answer);
}

function wrongNumber(p) {
  const value = `${p.answer + 1}`;
  return p.unit ? `${value} ${p.unit}` : value;
}

function tableAnswer(p, wrongFirst = false) {
  const cells = p.table.rows.flatMap((row) => row.cells.filter((c) => c.answer !== undefined));
  return JSON.stringify(
    cells.map((cell, i) => (wrongFirst && i === 0 ? "999" : cell.accepted?.[0] ?? String(cell.answer))),
  );
}

// Two points on the declared line, chosen from x values that are inside the
// grid and whose y values are too. Throws if the authored grid cannot hold the
// line it claims, which is a content defect rather than a marking case.
function graphPair(g) {
  const pts = [];
  for (const x of [0, 1, 2, -1, -2, 3, -3]) {
    if (x < g.xMin || x > g.xMax) continue;
    const y = g.m * x + g.c;
    if (y < g.yMin || y > g.yMax) continue;
    pts.push([x, y]);
    if (pts.length === 2) return pts;
  }
  throw new Error(`no two visible points on y = ${g.m}x + ${g.c} inside the grid`);
}

const pointString = (pts) => pts.map(([x, y]) => `${x},${y}`).join(" ");
const lineFromPair = (pts) => ({
  a: { x: pts[0][0], y: pts[0][1] },
  b: { x: pts[1][0], y: pts[1][1] },
});
const lineFromPlot = (pts) => ({
  a: { x: pts[0][0], y: pts[0][1] },
  b: { x: pts[pts.length - 1][0], y: pts[pts.length - 1][1] },
});
// The stored plot answer uses coordinate ARRAYS, because the editor parses a
// point as [x, y]. The read-off marker uses the object form, so the two are
// converted explicitly rather than assumed interchangeable.
const lineJson = (line) => ({ a: [line.a.x, line.a.y], b: [line.b.x, line.b.y] });

function buildCorrect(item) {
  const given = [];
  const working = [];
  const lines = new Map();
  for (const p of item.parts) {
    const kind = p.response ?? "number";
    let value = "";
    if (kind === "graph") {
      const pts = graphPair(p.graph);
      value = pointString(pts);
      lines.set(p.id, lineFromPair(pts));
    } else if (kind === "plot") {
      const pts = p.plot.points.map((q) => [q.x, q.y]);
      const line = lineFromPlot(pts);
      value = JSON.stringify({ points: pts, line: lineJson(line) });
      lines.set(p.id, line);
    } else if (kind === "readoff") {
      const line = lines.get(p.readOff.from);
      const expected = line ? PG.valueAt(line, p.readOff.at) : null;
      value = expected === null ? String(p.answer) : String(Number(expected.toFixed(4)));
    } else if (kind === "algebra") {
      value = p.algebra.accepted[0];
    } else if (kind === "table") {
      value = tableAnswer(p);
    } else {
      value = numberAnswer(p);
    }
    given.push(value);
    working.push(p.method ? p.method.accept[0] : "");
  }
  return { given, working, lines };
}

function gradeWith(item, given, working) {
  return SI.gradeStructuredItem(item, given, working);
}

// ── Audit every item ─────────────────────────────────────────────────────────

const reports = [];
const conceptIds = new Set();

for (const item of SI.STRUCTURED_ITEMS) {
  const marks = SI.structuredMarks(item);
  const concept = G.getConcept(item.conceptId);
  const tiers = tiersFor(item.conceptId);
  const inPack = packConcepts.has(item.conceptId);
  const itemWarnings = [];
  const itemFailures = [];
  const itemChecks = [];
  const runCheck = (ok, label, detail = "") => {
    const before = checks.length;
    check(ok, label, detail);
    itemChecks.push(checks[before]);
    if (!ok) itemFailures.push(checks[before].label);
  };

  conceptIds.add(item.conceptId);
  if (!concept) itemFailures.push(`${item.id}: concept ${item.conceptId} is not in the genome`);
  if (!tiers.length) itemWarnings.push(`${item.id}: concept is not reachable in any uk-gcse tier`);
  if (!inPack) itemWarnings.push(`${item.id}: ${item.conceptId} is not in the 149-item generated pilot pack`);
  if (!item.intro?.trim()) itemWarnings.push(`${item.id}: no intro`);
  if (!item.note?.trim()) itemWarnings.push(`${item.id}: no note`);
  if (!Number.isFinite(item.difficulty) || item.difficulty < 0 || item.difficulty > 1) {
    itemFailures.push(`${item.id}: difficulty ${item.difficulty} outside 0..1`);
  }
  if (marks < 1) itemFailures.push(`${item.id}: no marks`);
  if (item.parts.length === 0) itemFailures.push(`${item.id}: no parts`);
  if (new Set(item.parts.map((p) => p.id)).size !== item.parts.length) {
    itemFailures.push(`${item.id}: duplicate part id`);
  }

  for (const p of item.parts) {
    const kind = p.response ?? "number";
    if (!RESPONSE_LABEL[kind]) itemFailures.push(`${item.id}#${p.id}: unknown response kind ${kind}`);
    if (!Number.isInteger(p.marks) || p.marks < 1) itemFailures.push(`${item.id}#${p.id}: bad part marks`);
    const methodMarks = p.method?.marks ?? 0;
    if (p.method && (!Number.isInteger(methodMarks) || methodMarks < 1 || methodMarks >= p.marks)) {
      itemFailures.push(`${item.id}#${p.id}: method marks are not a proper subset of the part`);
    }
    if (p.method && p.method.accept.length === 0) itemFailures.push(`${item.id}#${p.id}: method has no accepted working`);
    if (p.unitRequired && !p.unit) itemFailures.push(`${item.id}#${p.id}: required unit is unset`);
    if (p.unitRequired && (p.accepted ?? []).length) {
      // A unit has print forms: m², m2 and square metres all name the same
      // thing, so the check must not call a legitimate form invisible.
      const unitKey = String(p.unit).toLowerCase().replace(/²/g, "2").replace(/³/g, "3");
      const visible = (p.accepted ?? []).some((a) =>
        String(a).toLowerCase().replace(/²/g, "2").replace(/³/g, "3").includes(unitKey));
      if (!visible) itemWarnings.push(`${item.id}#${p.id}: an accepted answer does not visibly carry its required unit`);
    }
    if (proseWords(p.explanation) < 25) {
      itemWarnings.push(`${item.id}#${p.id}: explanation is ${proseWords(p.explanation)} prose words`);
    }
  }

  // A full correct response. This is the one scenario that must be exactly the
  // whole mark scheme: a marking engine that cannot award its own key is broken.
  let full;
  try {
    full = buildCorrect(item);
  } catch (e) {
    itemFailures.push(`${item.id}: could not construct a correct response — ${e.message}`);
  }
  if (full) {
    const graded = gradeWith(item, full.given, full.working);
    runCheck(graded.awarded === marks, `${item.id}: a fully correct response earns ${marks}/${marks}`, `got ${graded.awarded}`);
    runCheck(graded.parts.every((p) => p.correct), `${item.id}: every part is marked correct on the full response`, graded.parts.map((p) => `${p.partId}:${p.awarded}/${p.marks}`).join(" "));
    runCheck(graded.answered === item.parts.length, `${item.id}: every part counts as answered`, `${graded.answered}/${item.parts.length}`);

    // A blank response is not a wrong belief, and it must not earn method marks.
    const blank = gradeWith(item, item.parts.map(() => ""), item.parts.map(() => ""));
    runCheck(blank.awarded === 0 && blank.answered === 0,
      `${item.id}: a blank response earns 0 and counts as unanswered`,
      `${blank.awarded}/${blank.marks}, answered ${blank.answered}`);

    // Per-part cases. Earlier parts are filled with correct answers so a
    // read-off part has the learner's line to follow through from.
    item.parts.forEach((p, i) => {
      const kind = p.response ?? "number";
      const methodMarks = p.method?.marks ?? 0;
      const answerMarks = p.marks - methodMarks;
      const partWith = (value, work = "", fillPrior = true) => {
        const given = item.parts.map(() => "");
        const working = item.parts.map(() => "");
        if (fillPrior) {
          for (let j = 0; j < i; j++) {
            given[j] = full.given[j];
            working[j] = full.working[j];
          }
        }
        given[i] = value;
        working[i] = work;
        return gradeWith(item, given, working).parts[i];
      };
      const tag = `${item.id}#${p.id}`;

      if (kind === "number") {
        const noWork = partWith(full.given[i], "");
        runCheck(noWork.awarded === answerMarks,
          `${tag}: a correct answer without working keeps the answer mark${answerMarks === 1 ? "" : "s"}`,
          `got ${noWork.awarded}, expected ${answerMarks}`);
        if (p.method) {
          const methodOnly = partWith(wrongNumber(p), p.method.accept[0]);
          runCheck(methodOnly.awarded === methodMarks,
            `${tag}: correct working with a wrong answer earns the method mark`,
            `got ${methodOnly.awarded}, expected ${methodMarks}`);
          const answerOnly = partWith(full.given[i], "1 + 1");
          runCheck(answerOnly.awarded === answerMarks,
            `${tag}: a right answer with unrecognised working keeps the answer mark but loses the method`,
            `got ${answerOnly.awarded}, expected ${answerMarks}`);
        }
        const wrong = partWith(wrongNumber(p), "");
        runCheck(wrong.awarded === 0,
          `${tag}: a wrong answer with no method earns 0`,
          `got ${wrong.awarded}`);
        if (p.unitRequired) {
          const noUnit = partWith(String(p.answer), p.method ? p.method.accept[0] : "");
          runCheck(noUnit.awarded === methodMarks,
            `${tag}: a correct value without its required unit loses the answer mark`,
            `got ${noUnit.awarded}, expected ${methodMarks}`);
        }
      }

      if (kind === "graph") {
        const pts = graphPair(p.graph);
        const wrongGradient = partWith(`${pts[0][0]},${pts[0][1]} ${pts[1][0]},${pts[1][1] + 1}`);
        runCheck(wrongGradient.awarded === 1,
          `${tag}: the right intercept with the wrong gradient earns 1 of 2`,
          `got ${wrongGradient.awarded}`);
        const wrongIntercept = partWith(`${pts[0][0]},${pts[0][1] + 1} ${pts[1][0]},${pts[1][1] + 1}`);
        runCheck(wrongIntercept.awarded === 1,
          `${tag}: the right gradient with the wrong intercept earns 1 of 2`,
          `got ${wrongIntercept.awarded}`);
      }

      if (kind === "plot") {
        const first = p.plot.points.slice(0, p.plot.partialMin).map((q) => [q.x, q.y]);
        // The line is deliberately NOT the correct line: a correct line implies
        // every point and earns 2, while two required points with line intention
        // are the B1 rung this case is for.
        const partialLine = { a: first[0], b: [first[0][0] + 1, first[0][1]] };
        const partial = partWith(JSON.stringify({ points: first, line: partialLine }));
        runCheck(partial.awarded === 1,
          `${tag}: at least ${p.plot.partialMin} required points with a line earns 1 of 2`,
          `got ${partial.awarded}`);
        const noLine = partWith(JSON.stringify({ points: p.plot.points.map((q) => [q.x, q.y]), line: null }));
        runCheck(noLine.awarded === 0,
          `${tag}: correct points with no line earn 0 — the question asks for the graph`,
          `got ${noLine.awarded}`);
      }

      if (kind === "algebra") {
        const variable = p.algebra.variable ?? "x";
        const wrong = partWith(variable === "n" ? "n + 1" : "x + 1");
        runCheck(wrong.awarded === 0, `${tag}: a non-equivalent expression earns 0`, `got ${wrong.awarded}`);
        if (p.algebra.requireExpanded) {
          const bracketed = partWith(`(${p.algebra.accepted[0]})`);
          runCheck(bracketed.awarded === 0,
            `${tag}: an equivalent but unexpanded expression loses the mark`,
            `got ${bracketed.awarded}`);
        }
      }

      if (kind === "table") {
        const oneWrong = partWith(tableAnswer(p, true));
        runCheck(oneWrong.awarded === p.marks - 1,
          `${tag}: one wrong cell keeps the other marks`,
          `got ${oneWrong.awarded}, expected ${p.marks - 1}`);
      }

      if (kind === "readoff") {
        const line = full.lines.get(p.readOff.from);
        const expected = line ? PG.valueAt(line, p.readOff.at) : null;
        if (expected !== null) {
          const wrong = partWith(String(Number((expected + 1).toFixed(4))));
          runCheck(wrong.awarded === 0, `${tag}: a value not on the learner's own line earns 0`, `got ${wrong.awarded}`);
        }
        const noPrior = partWith(full.given[i], "", false);
        runCheck(noPrior.awarded === 0,
          `${tag}: no earlier line means there is nothing to read from`,
          `got ${noPrior.awarded}`);
      }
    });
  }

  const packs = inPack ? "in the 149-item pack" : "outside the 149-item pack";
  reports.push({
    id: item.id,
    title: item.title,
    conceptId: item.conceptId,
    concept: concept?.title ?? null,
    subject: concept?.subject ?? null,
    tiers,
    difficulty: round(item.difficulty),
    marks,
    parts: item.parts.length,
    responseKinds: [...new Set(item.parts.map((p) => p.response ?? "number"))].sort(),
    methodMarks: item.parts.reduce((n, p) => n + (p.method?.marks ?? 0), 0),
    inPilotPack: inPack,
    packNote: packs,
    checks: itemChecks.length,
    failed: itemFailures.length + itemChecks.filter((c) => !c.ok).length,
    failures: [...itemFailures, ...itemChecks.filter((c) => !c.ok).map((c) => c.label)],
    warnings: itemWarnings,
  });
}

const partCount = reports.reduce((n, r) => n + r.parts, 0);
const markCount = reports.reduce((n, r) => n + r.marks, 0);
const inPackItems = reports.filter((r) => r.inPilotPack);
const outPackItems = reports.filter((r) => !r.inPilotPack);
const inPackMarks = inPackItems.reduce((n, r) => n + r.marks, 0);
const outPackMarks = outPackItems.reduce((n, r) => n + r.marks, 0);
const foundation = reports.filter((r) => r.tiers.includes("foundation"));
const higher = reports.filter((r) => r.tiers.includes("higher"));
const responseTotals = {};
for (const r of reports) {
  for (const kind of r.responseKinds) {
    responseTotals[kind] = (responseTotals[kind] ?? 0) + 1;
  }
}
const failedChecks = checks.filter((c) => !c.ok);
const hard = [...new Set([...reports.flatMap((r) => r.failures), ...failedChecks.map((c) => c.label)])];
const allWarnings = [...new Set([...warnings, ...reports.flatMap((r) => r.warnings)])];

const findings = [
  `**${reports.length} constructed-response items are outside the 149-item generated pack.** ${inPackItems.length} of them sit on concepts that are in that pack and ${outPackItems.length} sit on concepts that are not; the pack therefore cannot show a reviewer the method-marked format at all. This addendum is the review surface for them.`,
  `**${partCount} parts, ${markCount} marks.** ${inPackMarks} marks are on in-pack concepts and ${outPackMarks} on concepts outside it. A reviewer reading only the 149-item pack is not seeing those marks.`,
  `**${checks.length} marking scenarios passed${failedChecks.length ? `, ${failedChecks.length} failed` : ""}.** They cover full correct answers, blank responses, answer-without-working, working-with-wrong-answer, missing units, wrong graph coordinates, partial plots, wrong algebra forms and one-cell table errors.`,
  `**Marking is machine-validated, not teacher-validated.** No item here has a named reviewer: \`audit/item-reviews.json\` is empty. A green run says the engine agrees with these authored schemes; it does not say the schemes are right for the pupils.`,
];

if (allWarnings.length) {
  findings.push(`**${allWarnings.length} warnings** are recorded below. The largest is coverage: ${outPackItems.length} items are on concepts outside the generated pack, so adding more structured items will not make the pilot's review surface complete until those concepts are brought in.`);
}

const report = {
  generatedBy: "scripts/audit-structured-items.mjs",
  course: { id: SPEC.id, name: SPEC.name, tiers: SPEC.levels.map((l) => ({ id: l.id, name: l.name, difficulty: l.difficulty })) },
  reviewState: {
    reviewedItems: 0,
    note: "No constructed-response item has a human review. audit/item-reviews.json is the only source of a human-review claim, and it is empty.",
  },
  headline: {
    items: reports.length,
    concepts: conceptIds.size,
    parts: partCount,
    marks: markCount,
    foundationItems: foundation.length,
    higherItems: higher.length,
    inPilotPackItems: inPackItems.length,
    outsidePilotPackItems: outPackItems.length,
    inPilotPackMarks: inPackMarks,
    outsidePilotPackMarks: outPackMarks,
    checks: checks.length,
    failures: failedChecks.length,
  },
  responseTotals,
  items: reports,
  findings,
  hard,
  warnings: allWarnings,
};

fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

// ── The teacher-facing addendum ──────────────────────────────────────────────

const md = [];
md.push("# Constructed-response items — review addendum");
md.push("");
md.push("Generated by `scripts/audit-structured-items.mjs`; run `npm run audit:structured`.");
md.push("");
md.push("This is the review surface for the items that are **not** in the 149-item generated pack. They are served in papers and carry method marks. Nothing here is marked reviewed: `audit/item-reviews.json` is empty, and this document does not change that.");
md.push("");
md.push("## What this addendum contains");
md.push("");
md.push(`- **${reports.length} constructed-response items**, ${partCount} parts, ${markCount} marks.`);
md.push(`- **${inPackItems.length} items** sit on concepts also covered by the generated pack; **${outPackItems.length}** sit on concepts outside it.`);
md.push(`- **${checks.length} machine marking scenarios**, ${failedChecks.length === 0 ? "all passing" : `${failedChecks.length} failing`}. These are representative cases, not a claim that every possible learner response has been tested.`);
md.push("- **0 human reviews.** A machine agreeing with an authored scheme is not a teacher agreeing with the teaching.");
md.push("");
md.push("## By item");
md.push("");
md.push("| Item | Concept | Tier(s) | Parts | Marks | Formats | In 149-item pack? |");
md.push("|---|---|---|---|---|---|---|");
for (const r of reports) {
  md.push(`| ${r.title} (\`${r.id}\`) | \`${r.conceptId}\` | ${r.tiers.map((t) => TIER_LABEL[t] ?? t).join(", ") || "—"} | ${r.parts} | ${r.marks} | ${r.responseKinds.map((k) => RESPONSE_LABEL[k] ?? k).join(", ")} | ${r.inPilotPack ? "concept yes, item no" : "no"} |`);
}
md.push("");
md.push("## Findings");
md.push("");
findings.forEach((f, i) => md.push(`${i + 1}. ${f}`));
md.push("");
md.push("## The items and their mark schemes");
md.push("");
reports.forEach((r, n) => {
  const item = SI.structuredById(r.id);
  md.push(`### ${n + 1}. ${item.title} \`${item.id}\``);
  md.push("");
  md.push(`- **Concept:** \`${item.conceptId}\`${r.concept ? ` — ${r.concept}` : ""}`);
  md.push(`- **Tier(s):** ${r.tiers.map((t) => TIER_LABEL[t] ?? t).join(", ") || "—"} · **difficulty:** ${r.difficulty.toFixed(2)} · **marks:** ${r.marks}`);
  md.push(`- **In the 149-item generated pack:** ${r.inPilotPack ? "the concept is, this item is not" : "no"}`);
  md.push("");
  md.push(item.intro);
  md.push("");
  md.push(`*What this item does not assess:* ${item.note}`);
  md.push("");
  for (const p of item.parts) {
    const kind = p.response ?? "number";
    md.push(`**Part ${p.id} — ${p.prompt}**`);
    md.push("");
    md.push(`- Marks: **${p.marks}**${p.method ? ` (${p.method.marks} method + ${p.marks - p.method.marks} answer)` : " (answer)"} · response: ${RESPONSE_LABEL[kind] ?? kind}`);
    if (p.method) {
      md.push(`- Method: **${p.method.label}** — accepted working: ${p.method.accept.map((a) => `\`${a}\``).join(", ")}`);
    }
    if (kind === "graph") {
      md.push(`- Required line: \`y = ${p.graph.m}x + ${p.graph.c}\` · grid x ${p.graph.xMin}…${p.graph.xMax}, y ${p.graph.yMin}…${p.graph.yMax} · tolerance m ±${p.graph.tolerance.m}, c ±${p.graph.tolerance.c}`);
    } else if (kind === "plot") {
      md.push(`- Required points: ${p.plot.points.map((q) => `(${q.x}, ${q.y})`).join(", ")} · partial mark at ${p.plot.partialMin} points with a line`);
    } else if (kind === "readoff") {
      md.push(`- Read from part **${p.readOff.from}** at x = ${p.readOff.at}; marked against the learner's own line, tolerance ±${p.readOff.tolerance}`);
    } else if (kind === "algebra") {
      md.push(`- Accepted equivalent forms: ${p.algebra.accepted.map((a) => `\`${a}\``).join(", ")}${p.algebra.requireExpanded ? " · expanded form required" : ""}`);
    } else if (kind === "table") {
      const cells = p.table.rows.flatMap((row) => row.cells.filter((c) => c.answer !== undefined));
      md.push(`- Table: ${p.table.columns.join(" · ")} · ${cells.length} blank cell(s), one mark each`);
    } else {
      md.push(`- Answer: **${p.answer}${p.unit ? ` ${p.unit}` : ""}**${p.unitRequired ? " · unit required for the answer mark" : ""}`);
      if (p.accepted?.length) md.push(`- Also accepted: ${p.accepted.map((a) => `\`${a}\``).join(", ")}`);
    }
    md.push(`- Explanation: ${p.explanation}`);
    md.push("");
  }
  md.push(`**Items in this addendum are reviewable, not reviewed.** If every part is read and the scheme is sound, record the concept in \`audit/item-reviews.json\` with a reviewer, a date and a scope.`);
  md.push("");
});
md.push("## What the reviewer is asked to do");
md.push("");
md.push("For each item, work every part independently and check the mark scheme against the working. In particular:");
md.push("");
md.push("- Is the key correct, and is the accepted working genuinely a correct method — not merely the route the author happened to use?");
md.push("- Does the method mark survive a wrong answer, and does a right answer without working still earn the answer mark?");
md.push("- Does the unit rule match how the question is worded, and is a missing unit correctly denied the answer mark?");
md.push("- For a graph or plot, does the mark scheme reflect the geometry the question asks for rather than the author's chosen points?");
md.push("- Is the explanation teaching the idea, or merely arriving at the key?");
md.push("");
md.push("Record one entry per concept, as described in the generated pack (`docs/REVIEW_PACK.md`). A machine cannot sign this off.");
md.push("");
md.push("## What this audit cannot say");
md.push("");
md.push("It cannot say the questions are at the right level, that the mark schemes match an awarding body's published scheme, that the wording is accessible, or that a teacher has read them. It also does not test free-text explanations or essay marking: the structured response types here are numeric, algebra, graph, plot, read-off and table. A written explanation remains unmarked by design.");
md.push("");

fs.writeFileSync(OUT_MD, md.join("\n"));
fs.writeFileSync(OUT_REVIEW, md.join("\n"));

console.log("Structured-response audit");
console.log(`  items ${report.headline.items} · concepts ${report.headline.concepts} · parts ${report.headline.parts} · marks ${report.headline.marks}`);
console.log(`  Foundation ${report.headline.foundationItems} · Higher ${report.headline.higherItems}`);
console.log(`  in 149-item pack: ${report.headline.inPilotPackItems} item(s) / ${report.headline.inPilotPackMarks} mark(s) · outside: ${report.headline.outsidePilotPackItems} / ${report.headline.outsidePilotPackMarks}`);
console.log(`  marking checks ${report.headline.checks} · failures ${report.headline.failures}`);
console.log(`  hard ${hard.length} · warnings ${allWarnings.length}`);
if (hard.length) {
  console.log("\nHARD:");
  hard.slice(0, 30).forEach((x) => console.log(`  ✗ ${x}`));
}
if (allWarnings.length) {
  console.log("\nWARN:");
  allWarnings.slice(0, 30).forEach((x) => console.log(`  · ${x}`));
  if (allWarnings.length > 30) console.log(`  … ${allWarnings.length - 30} more in the report`);
}
console.log(`\n→ ${OUT_JSON}\n→ ${OUT_MD}\n→ ${OUT_REVIEW}`);
process.exit(hard.length ? 1 : 0);
