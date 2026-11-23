// ─────────────────────────────────────────────────────────────────────────────
// THE LESSON-OBJECTIVE GATE.
//
// WHY THIS EXISTS. Every lesson plan opens with one sentence, printed by the read
// stage directly under the eyebrow "By the end you can". For the 112 supplemental
// plans that sentence was COMPOSED by pasting a lower-cased title into
// "… in a problem, and explain why it works: <blurb>", so the first thing a
// learner read on the lesson was
//
//   By the end you can addition in a problem, and explain why it works: …
//
// which is a clause with no verb, and for the one question-shaped title
// "what is code? in a problem" — a question mark in the middle of a sentence.
// Nothing failed. The string was non-empty, it was the right length, and every
// check that touched it asked only whether a plan HAD an objective. A template
// fault of this shape is invisible to a presence check, so this gate asserts the
// FORM of the sentence, not the existence of one.
//
// WHAT IT ASSERTS
//   1. Every plan has an objective: trimmed, unique across the registry, 20–240
//      characters, starting with a capital letter and ending with a full stop.
//   2. It does not begin with a determiner or a pronoun. It has to complete
//      "By the end you can", and "By the end you can the…" is not a sentence.
//   3. The retired template is rejected BY NAME — the exact substring that
//      shipped — so a generator that reintroduces it fails here rather than
//      waiting for a reader to notice.
//   4. A supplemental (machine-composed) objective starts with an action verb
//      and names the concept's title in quotes. Both are what the fix
//      established, and both are cheap to lose in a later refactor.
//
// AUTHORED PLANS ARE HELD TO 1–3 ONLY. They are hand-written and checked by
// their own subject gates; forcing a house template on them would be this gate
// inventing teaching rather than proving it.
//
// Run:  npm run gate:objectives        (also the last step of verify:lessons)
// ─────────────────────────────────────────────────────────────────────────────
import { compileEngines } from "./compile-engines.mjs";
import { createRequire } from "node:module";

compileEngines();
const require = createRequire(import.meta.url);
const L = require("../.verify/lesson-plans.js");
const G = require("../.verify/genome.js");

const MIN_LENGTH = 20;
const MAX_LENGTH = 240;

/** The substrings that must never come back. Kept verbatim, because "similar"
 *  is not the claim: these are the exact forms that rendered on the page. */
const RETIRED = [
  "in a problem, and explain why it works",
  " in a problem, and explain",
];

/** A sentence read after "By the end you can" cannot open with one of these. */
const NOT_A_VERB = new Set([
  "the", "a", "an", "this", "that", "these", "those",
  "it", "its", "there", "here", "you", "we", "they",
]);

/** The verbs a composed objective may open with. A closed list on purpose: a
 *  generator that starts emitting "Addition: use it…" is exactly the fault this
 *  gate exists to catch, and it is not a wording tweak worth tolerating. */
const ACTION_VERBS = new Set([
  "explain", "use", "apply", "solve", "describe", "compare", "calculate",
  "find", "draw", "identify", "read", "write", "evaluate", "interpret",
  "choose", "test", "trace", "label", "order", "convert",
]);

const titles = Object.fromEntries(G.CONCEPTS.map((c) => [c.id, c.title]));
const plans = L.LESSON_PLANS;
const ids = Object.keys(plans).sort();

let pass = 0;
const failures = [];
const ok = (condition, name, detail = "") => {
  if (condition) pass += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
};

const seen = new Map();
for (const id of ids) {
  const plan = plans[id];
  const objective = plan.objective ?? "";
  const trimmed = objective.trim();

  ok(Boolean(titles[id]), `${id}: the plan is filed under a real concept id`);
  ok(trimmed.length > 0, `${id}: has an objective`);
  ok(trimmed === objective, `${id}: the objective is trimmed`);
  ok(trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH,
    `${id}: the objective is ${MIN_LENGTH}–${MAX_LENGTH} characters`, `${trimmed.length}`);
  ok(/^[A-Z0-9“"']/.test(trimmed), `${id}: the objective starts with a capital`, trimmed.slice(0, 40));
  ok(/\.$/.test(trimmed), `${id}: the objective ends with a full stop`, trimmed.slice(-40));

  const firstWord = trimmed.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
  ok(!NOT_A_VERB.has(firstWord),
    `${id}: the objective opens with an action, not a determiner`,
    `opens with "${firstWord}"`);

  for (const retired of RETIRED) {
    ok(!trimmed.includes(retired),
      `${id}: the retired objective template is gone`,
      `contains "${retired}"`);
  }

  if (plan.provenance === "supplemental") {
    ok(ACTION_VERBS.has(firstWord),
      `${id}: the composed objective opens with an action verb`,
      `opens with "${firstWord}"`);
    ok(trimmed.includes(`"${titles[id]}"`),
      `${id}: the composed objective names the concept it belongs to`,
      trimmed);
  }

  if (seen.has(trimmed)) {
    ok(false, `${id}: the objective is not a copy of ${seen.get(trimmed)}`, trimmed);
  } else {
    seen.set(trimmed, id);
  }
}

// A registry with no supplemental plans would pass every check above by having
// nothing to check — the same silence that let the template ship.
const supplemental = ids.filter((id) => plans[id].provenance === "supplemental");
ok(supplemental.length > 0, "the registry still carries composed plans to check");
ok(ids.length === Object.keys(plans).length, "every plan in the registry was examined");

console.log(
  `Checked the objective of ${ids.length} lesson plans ` +
  `(${supplemental.length} composed, ${ids.length - supplemental.length} authored):`,
);
if (failures.length) {
  console.log("");
  for (const failure of failures) console.log(`  ✗ ${failure}`);
}
console.log(`\nPASS ${pass}   FAIL ${failures.length}`);
process.exit(failures.length ? 1 : 0);
