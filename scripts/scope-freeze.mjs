#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE SCOPE FREEZE — a stop, not a slogan.
//
// THE FAILURE THIS EXISTS FOR. Breadth kept growing because adding a country,
// a qualification or a concept is easy, testable and looks like progress. It is
// not evidence that a child learned anything, and it makes the product harder to
// change when the evidence finally arrives. The decision recorded in
// OPENMIND_SCOPE.json is therefore only worth the mechanism that enforces it:
// this gate fails when the content surface grows while the programme is still
// undecided, so the next addition is a deliberate, reviewed act rather than a
// quiet side effect of a busy afternoon.
//
// WHAT IT IS NOT. It does not judge quality, review content, or claim that
// anything works. It answers one question mechanically: has the surface expanded
// without someone deciding that it should?
//
// HOW TO CHANGE IT. Edit OPENMIND_SCOPE.json. Moving a number there is the
// review — the diff says what was added and who decided. `--write` is
// deliberately NOT provided: a script that rewrites its own baseline turns a
// decision into a keystroke.
//
// A claim can also move in the honest direction: when a real educator reviews a
// lesson, the recorded claim goes UP. That is a human act, recorded by a human in
// the manifest, and this gate refuses a claim that appeared in the content
// without appearing in the record.
//
// Run: node scripts/scope-freeze.mjs [--self-test]
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const MANIFEST = path.join(root, "OPENMIND_SCOPE.json");
// `compile-engines.mjs` is ESM and exports a function; `require()` of it depends
// on the Node version, so it is imported the way it is written.
const { compileEngines } = await import("./compile-engines.mjs");

const METRICS = [
  ["concepts", "concepts in the knowledge genome"],
  ["subjects", "subjects the genome covers"],
  ["specifications", "course / qualification options"],
  ["pathways", "curriculum pathways"],
  ["interfaceLanguages", "interface languages"],
  ["authoredLessons", "authored lessons"],
];

const CLAIMS = [
  ["educatorReviewedLessons", "lessons claiming educator review or above"],
  ["learnerTestedLessons", "lessons claiming learner testing or above"],
  ["publishedLessons", "lessons claiming publication"],
  ["educatorReviewedCurricula", "curricula claiming local educator review"],
];

/** The comparison, pure, so it can be planted with a failure. */
function compare(manifest, actual) {
  const problems = [];
  const frozen = manifest.frozen ?? {};
  const claims = manifest.claims ?? {};

  if (manifest.status === "frozen") {
    for (const [key, label] of METRICS) {
      const was = frozen[key];
      const now = actual.counts?.[key];
      if (typeof was !== "number") {
        problems.push(`OPENMIND_SCOPE.json does not record a frozen count for ${label} (${key})`);
      } else if (now !== was) {
        const direction = now > was ? "grew" : "shrank";
        problems.push(
          `${label} (${key}) ${direction} from ${was} to ${now}. Breadth is frozen until one programme has classroom evidence. ` +
          "Changing this is a decision: edit OPENMIND_SCOPE.json and record why.",
        );
      }
    }
  } else if (manifest.status === "open") {
    // An unfrozen programme must exist. Flipping the status alone is not a plan.
    const programme = manifest.programme ?? {};
    for (const field of ["context", "learners", "priority", "language", "outcome"]) {
      if (!programme[field]) problems.push(`status is "open" but the programme's ${field} is not stated`);
    }
  } else {
    problems.push(`unknown status "${manifest.status}" — expected "frozen" or "open"`);
  }

  // A CLAIM MAY NOT APPEAR BY ITSELF. If the content now claims a human rung that
  // the manifest does not record, somebody marked work as reviewed without saying
  // so where the decision lives. The reverse is also a problem: the record would
  // be describing a product that no longer exists.
  for (const [key, label] of CLAIMS) {
    const recorded = claims[key];
    const now = actual.claims?.[key];
    if (typeof recorded !== "number") {
      problems.push(`OPENMIND_SCOPE.json does not record ${label} (${key})`);
    } else if (now > recorded) {
      problems.push(
        `${label}: ${now} now, ${recorded} recorded. A human review is a real act — add the reviewer and date to ` +
        "OPENMIND_SCOPE.json so the claim is backed by a name, not by a status field.",
      );
    } else if (now < recorded) {
      problems.push(`${label}: ${now} now, ${recorded} recorded. The manifest describes a product that no longer exists.`);
    }
  }

  return problems;
}

function measure() {
  // The mirror is a function of the sources, so it is compiled here rather than
  // trusted from a previous run: a stale `.verify` would freeze the wrong counts.
  compileEngines();
  const genome = require("../.verify/genome.js");
  const specs = require("../.verify/specifications.js");
  const registry = require("../.verify/curricula/registry.js");
  const i18n = require("../.verify/i18n.js");
  const authored = require("../.verify/lessons/authored/index.js");
  const subjects = require("../.verify/subjects.js");

  const lessons = authored.AUTHORED_LESSONS;
  const rung = (l) => l.declaredStatus;
  const pathways = registry.allPathways();
  const reviewed = (status) => status === "reviewed" || status === "verified";

  return {
    counts: {
      concepts: genome.CONCEPTS.length,
      subjects: subjects.SUBJECT_IDS.length,
      specifications: specs.SPECIFICATIONS.length,
      pathways: pathways.length,
      interfaceLanguages: i18n.LANG_CODES.length,
      authoredLessons: lessons.length,
    },
    claims: {
      educatorReviewedLessons: lessons.filter((l) => ["educator_reviewed", "learner_tested", "published"].includes(rung(l))).length,
      learnerTestedLessons: lessons.filter((l) => ["learner_tested", "published"].includes(rung(l))).length,
      publishedLessons: lessons.filter((l) => rung(l) === "published").length,
      educatorReviewedCurricula: pathways.filter((p) => reviewed(p.mappingReview)).length,
    },
    programme: {
      context: null,
      note: "no single programme context is chosen",
    },
  };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const actual = measure();

if (process.argv.includes("--self-test")) {
  // The planted failures are the two this gate exists for: silent growth, and a
  // review claim that appeared without a record.
  const grown = compare(manifest, {
    ...actual,
    counts: { ...actual.counts, concepts: actual.counts.concepts + 1 },
  });
  const claimed = compare(manifest, {
    ...actual,
    claims: { ...actual.claims, educatorReviewedLessons: actual.claims.educatorReviewedLessons + 1 },
  });
  const doubled = compare(manifest, {
    ...actual,
    counts: { ...actual.counts, specifications: actual.counts.specifications * 2 },
  });
  const cases = [
    ["a concept added silently is refused", grown.some((p) => p.includes("(concepts) grew"))],
    ["a review claim without a record is refused", claimed.some((p) => p.includes("A human review is a real act"))],
    ["a doubled qualification list is refused", doubled.some((p) => p.includes("(specifications) grew"))],
    ["the real tree passes as it stands", compare(manifest, actual).length === 0],
  ];
  for (const [label, pass] of cases) console.log(`  ${pass ? "✓" : "✗"} ${label}`);
  process.exit(cases.every(([, pass]) => pass) ? 0 : 1);
}

console.log("▸ Scope freeze (OPENMIND_SCOPE.json)");
for (const [key, label] of METRICS) {
  console.log(`  ${key.padEnd(20)} ${String(actual.counts[key]).padStart(4)}  ${label}`);
}
console.log("  programme            " + (manifest.programme?.context ?? "not chosen"));
console.log(
  "  claims               " +
    CLAIMS.map(([key]) => `${key}=${actual.claims[key]}`).join(" "),
);

const problems = compare(manifest, actual);
if (problems.length === 0) {
  console.log("✓ nothing has been added while the programme is undecided.");
  process.exit(0);
}
console.error("\n✗ the content surface and the recorded decision disagree:");
for (const problem of problems) console.error(`  · ${problem}`);
process.exit(1);
