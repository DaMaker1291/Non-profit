// ─────────────────────────────────────────────────────────────────────────────
// BUILD THE STATIC BUILD — the same engines, bundled for a browser.
//
// Why this exists at all: GitHub Pages serves files and cannot run a Next
// server, so nothing that needs a route handler (grading, the ledger, the
// decision door) can be a server call there. The engines, though, are plain
// TypeScript with no Node dependency — the question bank, the diagnostic
// ladder, the learner model, the replay, the decision door, the content graph
// and all fifteen dictionaries.
//
// So this script compiles those modules with the SAME compiler settings the
// verification mirror uses and bundles them into one file the page loads. It is
// not a rewrite: `scripts/static-smoke.mjs` drives one learner journey through
// BOTH this bundle and the server's own fs-backed path and requires the
// resulting model, decision and citations to be identical. If the two ever
// disagree, the build is wrong, not the test.
//
// TWO HARD RULES, both enforced here rather than promised:
//
//   1. A module that reaches the bundle must not `require` anything that is not
//      another module in the bundle. A Node builtin arriving in the graph means
//      someone imported a server-only module into a browser path — the build
//      FAILS and names the module and the specifier.
//   2. The bundle must load and run in plain Node as well as a browser (it is
//      UMD), so the parity test can execute the exact artifact the site serves.
//
// Run: node scripts/build-static-app.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ENGINE_SOURCES, MIRROR_DIR } from "./compile-engines.mjs";

const OUT_DIR = ".static-build";
const BUNDLE = path.join("docs", "openmind.engine.js");

/** Everything the page asks for, by namespace. This list IS the static build's
 *  dependency set: the bundler walks it and includes only what it reaches, so
 *  adding a namespace here is what puts a module in the browser, and removing
 *  one is what takes it out. */
const ENTRY = {
  genome: "genome",
  skills: "skills",
  questions: "questions",
  diagnostic: "diagnostic",
  progress: "progress",
  mastery: "mastery",
  questionBank: "question-bank",
  specifications: "specifications",
  curriculum: "curriculum",
  subjects: "subjects",
  evidence: "evidence",
  replay: "replay",
  ledger: "ledger",
  learnerProfile: "learner-profile",
  decision: "decision",
  nextEngine: "next-engine",
  learnerModel: "learner-model",
  evidenceView: "evidence-view",
  i18n: "i18n",
  contentI18n: "content-i18n",
  deadline: "deadline",
  hints: "hints",
  socratic: "socratic",
  misconceptions: "misconceptions",
  matcher: "matcher",
  retention: "retention",
  microdiag: "microdiag",
  starter: "starter",
  localModel: "local-model",
  localAi: "local-ai",
  contentGraph: "content-graph",
  papers: "papers",
  access: "access",
};

/** The sources this build compiles: the verification set, plus the
 *  storage-independent ledger that extraction made possible. Anything not in
 *  this list cannot be reached by the bundle, because it does not exist as a
 *  compiled module — which is the point. */
const SOURCES = [...new Set([...ENGINE_SOURCES, "lib/ledger.ts"])];

function compile() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  execFileSync(
    "npx",
    [
      "tsc",
      ...SOURCES,
      "--outDir", OUT_DIR,
      "--module", "commonjs",
      "--target", "es2020",
      "--skipLibCheck",
      "--esModuleInterop",
      "--strict",
    ],
    { stdio: "inherit" },
  );
}

/** Compiled path for a source: `lib/genome.ts` → `<out>/genome.js`.
 *  tsc uses the longest common directory of its inputs (`lib/`) as the root,
 *  and every require it emits between these modules is relative, so ids and
 *  requires live in the same space. */
function compiledId(source) {
  return path.relative("lib", source).replace(/\.ts$/, ".js").split(path.sep).join("/");
}

function moduleFile(id) {
  const file = path.join(OUT_DIR, id);
  if (!fs.existsSync(file)) {
    throw new Error(`compiled module missing: ${id} (expected ${file}) — is every source in SOURCES?`);
  }
  return file;
}

const REQUIRE_RE = /require\(\s*"([^"]+)"\s*\)/g;

function depsOf(id) {
  const code = fs.readFileSync(moduleFile(id), "utf8");
  const specs = new Set();
  for (const m of code.matchAll(REQUIRE_RE)) specs.add(m[1]);
  return [...specs];
}

/** Resolve a require the way Node would, restricted to the compiled mirror. */
function resolve(fromId, spec) {
  if (!spec.startsWith(".")) return null; // bare specifier: a Node builtin or a package
  const fromDir = path.posix.dirname(fromId);
  const base = path.posix.normalize(path.posix.join(fromDir, spec));
  for (const candidate of [`${base}.js`, path.posix.join(base, "index.js"), base]) {
    if (fs.existsSync(path.join(OUT_DIR, candidate))) return candidate;
  }
  return null;
}

/** Walk from the entry and return the reachable closure, or throw naming the
 *  module and the specifier that broke the browser contract. */
function closure() {
  const reachable = new Set();
  const queue = [];
  const bare = [];
  for (const mod of Object.values(ENTRY)) {
    const id = `${mod}.js`;
    moduleFile(id); // fail early and precisely if the namespace is wrong
    queue.push(id);
  }
  while (queue.length) {
    const id = queue.shift();
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const spec of depsOf(id)) {
      const target = resolve(id, spec);
      if (!target) {
        if (spec.startsWith(".")) throw new Error(`unresolvable require "${spec}" in ${id}`);
        bare.push({ id, spec });
        continue;
      }
      if (!reachable.has(target)) queue.push(target);
    }
  }
  if (bare.length) {
    const lines = bare.map((b) => `  · ${b.id} requires "${b.spec}"`).join("\n");
    throw new Error(
      "the static bundle reached a specifier that cannot exist in a browser.\n" +
      "A module on a browser path imported a server-only one; move the shared\n" +
      "logic out (see lib/ledger.ts for the shape of that extraction).\n" + lines,
    );
  }
  return reachable;
}

function bundle(ids) {
  const ordered = [...ids].sort();
  const parts = [];
  for (const id of ordered) {
    const code = fs.readFileSync(moduleFile(id), "utf8");
    parts.push(`__def(${JSON.stringify(id)}, function (module, exports, require) {\n${code}\n});`);
  }
  const entry = Object.entries(ENTRY)
    .map(([ns, mod]) => `    ${ns}: require(${JSON.stringify(`./${mod}.js`)}),`)
    .join("\n");
  return `/* OpenMind — static build of the engines.
 *
 * GENERATED FILE. Do not edit: run \`node scripts/build-static-app.mjs\`.
 * Source: ${ordered.length} modules compiled from lib/ by that script, wired
 * into a tiny module registry so one learner journey can run with no server.
 *
 * This file is the SAME engine code the Next server runs. It is here so the
 * public site can grade answers, record evidence and choose a next action
 * without a backend; scripts/static-smoke.mjs holds the two builds to the same
 * numbers.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OpenMindEngine = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var __modules = {};
  var __cache = {};
  function __def(id, fn) { __modules[id] = fn; }
  // Ids are paths inside the compiled mirror ("diagnostic.js",
  // "server/store.js") and every require in it is relative, so resolving is
  // path arithmetic — no extensions to guess beyond the ".js" the compiler
  // leaves off.
  function __resolve(fromId, spec) {
    if (spec.charAt(0) !== ".") throw new Error("bare specifier in bundle: " + spec);
    var parts = fromId.split("/").slice(0, -1).concat(spec.split("/"));
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === "" || p === ".") continue;
      if (p === "..") out.pop();
      else out.push(p);
    }
    var id = out.join("/");
    return id.slice(-3) === ".js" ? id : id + ".js";
  }
  function __req(id) {
    if (__cache[id]) return __cache[id].exports;
    var mod = __cache[id] = { exports: {} };
    var fn = __modules[id];
    if (!fn) throw new Error("module not in bundle: " + id);
    fn(mod, mod.exports, function (spec) { return __req(__resolve(id, spec)); });
    return mod.exports;
  }
${parts.join("\n")}
  __def("__entry__.js", function (module, exports, require) {
    module.exports = {
${entry}
      meta: { modules: ${ordered.length}, builtAt: ${JSON.stringify(new Date().toISOString())} },
    };
  });
  return __req("__entry__.js");
});
`;
}

const SINGLE_FILE = path.join("docs", "openmind.html");

/**
 * One file with the shell, the styles and the engine inlined.
 *
 * Two reasons this is built rather than hand-written. It is the only way the
 * app can run from `file://` — with no server at all, which is what a learner
 * on a school laptop needs — and it is what the verification pipeline drives in
 * a real browser, so the tested artifact is generated from the same sources as
 * the served one instead of being a copy that drifts.
 */
function singleFile(engineCode) {
  const css = fs.readFileSync(path.join("docs", "app.css"), "utf8");
  const app = fs.readFileSync(path.join("docs", "app.js"), "utf8");
  const shell = fs.readFileSync(path.join("docs", "index.html"), "utf8");
  // Syntax-check what is about to be inlined. A page whose script does not
  // parse renders an empty shell to every visitor and reports nothing anywhere
  // — this build must fail instead.
  try {
    new vm.Script(app, { filename: "docs/app.js" });
  } catch (e) {
    throw new Error(`docs/app.js does not parse: ${e.message}`);
  }
  for (const [what, body] of [["engine", engineCode], ["app", app]]) {
    if (body.includes("</script")) {
      throw new Error(`${what} contains a literal </script — inlining it would break the page`);
    }
  }
  // The replacements are FUNCTIONS on purpose. A replacement STRING goes
  // through $-substitution in String.replace, so an engine bundle containing
  // `$&` or `$'` (a template literal in the dictionaries, a regexp) would be
  // rewritten into the surrounding document — the file would still parse, and
  // the app would fail at runtime for a reason no one would guess.
  const swap = (needle, body, tag) => (html) => {
    if (!html.includes(needle)) throw new Error(`single-file build: ${needle} is missing from index.html`);
    return html.replace(needle, () => `<${tag}>\n${body}\n</${tag}>`);
  };
  let html = shell;
  html = swap('<link rel="stylesheet" href="app.css">', css, "style")(html);
  html = swap('<script src="openmind.engine.js"></script>', engineCode, "script")(html);
  html = swap('<script src="app.js"></script>', app, "script")(html);
  return html;
}

function main() {
  compile();
  const reachable = closure();
  const code = bundle(reachable);
  fs.mkdirSync(path.dirname(BUNDLE), { recursive: true });
  fs.writeFileSync(BUNDLE, code);
  const kb = (Buffer.byteLength(code) / 1024).toFixed(1);
  console.log(`static bundle: ${reachable.size} modules, ${kb} KiB → ${BUNDLE}`);

  const single = singleFile(code);
  fs.writeFileSync(SINGLE_FILE, single);
  console.log(`single file: ${(Buffer.byteLength(single) / 1024).toFixed(1)} KiB → ${SINGLE_FILE} (runs from file://)`);
  console.log(`compile mirror kept at ${MIRROR_DIR}/ for the verification pipeline`);
}

main();
