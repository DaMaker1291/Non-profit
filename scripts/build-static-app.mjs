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
import crypto from "node:crypto";
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
  // Prompt formatting (prose vs code), shared with the React surfaces so both
  // builds set a code question the same way.
  prompt: "prompt",
  // The answer rule, so the offline build grades a typed number by the SAME
  // tolerance the server would — the two kits must not disagree about whether
  // 0.75 is right.
  answer: "answer",
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
      meta: { modules: ${ordered.length} },
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
  html = swap(`<link rel="stylesheet" href="${HASHED.css}">`, css, "style")(html);
  // index.html was rewritten to the content-hashed names by emitHashedAssets
  // before singleFile reads it, so the needles are the hashed ones.
  html = swap(`<script src="${HASHED.engine}"></script>`, engineCode, "script")(html);
  html = swap(`<script src="${HASHED.app}"></script>`, app, "script")(html);
  return html;
}

// ── THE OFFLINE SHELL, VERSIONED BY ITS OWN CONTENTS ────────────────────────
//
// The service worker is cache-first: a learner who has used the site once gets
// the cached engine back even after a deploy. That is the point of it — the app
// works with no network — but it also means a fix to the GRADER is invisible to
// every returning learner until the cache key changes.
//
// The key used to be a name a human bumped by hand ("openmind-static-v3"), and
// the worker's own comment said so: "Bump CACHE when the bundle changes." A step
// only a human can remember is a step that will be forgotten, and forgetting it
// does not fail any test — it silently keeps serving yesterday's grader to
// everyone who came back. So the key is now derived here, from the exact bytes
// of every artifact the worker caches. Change any one of them and the next
// deploy installs a new worker, whose `activate` deletes the old cache.
//
// scripts/static-smoke.mjs recomputes the same hash from the same files and
// fails if the shipped sw.js disagrees, so a stale worker cannot be committed.
const SHELL_FILES = ["index.html"];

/**
 * THE ASSETS THAT CARRY CONTENT ARE NAMED BY THEIR OWN HASH.
 *
 * THE FAILURE THIS FIXES, OBSERVED ON THE LIVE SITE: GitHub Pages serves every
 * file under docs/ with `cache-control: max-age=600` and the asset URLs never
 * changed between builds — `<script src="openmind.engine.js">` was the same URL
 * before and after a deploy. So a returning learner kept the PREVIOUS 2.4 MB
 * engine in the browser's HTTP cache, and the service worker's content-hashed
 * CACHE NAME could not help: it versions the worker's own cache, while the HTTP
 * cache sits IN FRONT of it and was never versioned at all. A deploy that
 * replaced every learner-visible string still rendered the old strings for as
 * long as that entry lived.
 *
 * Worse, it fed itself. The incoming worker's `install` runs `addAll`, and those
 * requests are handled by the OUTGOING worker — which is cache-first — so the
 * new worker could pre-cache the OLD bytes under the NEW cache name, evict the
 * genuinely-old cache, and leave the learner stuck on a build the cache claimed
 * was current.
 *
 * Putting the hash in the FILENAME removes the ambiguity rather than managing it:
 * a new build's engine is a new URL, which no cache can already hold. The
 * outgoing worker's cache-first lookup misses and goes to the network, so the
 * new worker caches the NEW bytes. There is no window in which the right cache
 * name holds the wrong bytes.
 *
 * `index.html` stays UNHASHED on purpose: it is the one file that has to be
 * re-read to discover the new names, so the worker serves it network-first and
 * falls back to the cache only when there is no network.
 *
 * THE STYLESHEET WAS THE HOLE, AND IT WAS OBSERVED, NOT FEARED. The paragraphs
 * above were written for the engine and the app script; `app.css` kept a fixed
 * URL AND stayed on the worker's cache-first list, which is the one combination
 * this fix is supposed to make impossible. Measured on the published site
 * minutes after a deploy that changed only styles: the first visit rendered the
 * PREVIOUS stylesheet — the head read `--accent: #82a5ff` and `--serif:
 * ui-serif, "Iowan Old Style", Georgia, "Times New Roman", serif`, two values
 * that exist nowhere in the file being served — and a reload applied the new
 * one. A returning learner therefore meets the old design on the visit that
 * matters (the first one), while this comment claimed otherwise. `app.css` is
 * content-hashed below for the same reason the other two are: a new build's
 * stylesheet must be a URL no cache has ever held. The unhashed `app.css` stays
 * on disk as the SOURCE.
 */
const HASHED = { engine: null, app: null, css: null };

function sha12(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 12);
}

/** Content-hash the engine and app, write them under hashed names, and point
 *  index.html at them. Returns the names the worker must cache. */
function emitHashedAssets(engineCode) {
  const appSrc = fs.readFileSync(path.join("docs", "app.js"), "utf8");
  const cssSrc = fs.readFileSync(path.join("docs", "app.css"), "utf8");
  const engineName = `openmind.engine.${sha12(engineCode)}.js`;
  const appName = `app.${sha12(appSrc)}.js`;
  const cssName = `app.${sha12(cssSrc)}.css`;
  HASHED.engine = engineName;
  HASHED.app = appName;
  HASHED.css = cssName;

  // Sweep the PREVIOUS build's assets FIRST. Done before the write, because a
  // sweep afterwards deletes the file this build just emitted — and done at all
  // because an old engine left on disk under its hashed name can still be
  // fetched by an index.html sitting in someone's HTTP cache.
  for (const f of fs.readdirSync("docs")) {
    if (
      /^openmind\.engine\.[a-f0-9]{12}\.js$/.test(f) ||
      /^app\.[a-f0-9]{12}\.js$/.test(f) ||
      // `docs/app.css` is the SOURCE and cannot match this: twelve hex digits
      // after `app.` is what a build emits, never what a human writes.
      /^app\.[a-f0-9]{12}\.css$/.test(f) ||
      f === "openmind.engine.js"
    ) {
      fs.rmSync(path.join("docs", f), { force: true });
    }
  }
  fs.writeFileSync(path.join("docs", engineName), engineCode);
  fs.writeFileSync(path.join("docs", appName), appSrc);
  fs.writeFileSync(path.join("docs", cssName), cssSrc);

  // The replacements are PATTERNS, not literals, because this build rewrites a
  // file that the PREVIOUS build already rewrote: docs/ is both the source and
  // the published artifact, so index.html already names hashed assets by the
  // time the next build runs. Matching the literal fixed name would find
  // nothing, silently change nothing, and ship yesterday's engine under today's
  // cache key — which is the exact failure the hashed names exist to prevent.
  const html = fs.readFileSync(path.join("docs", "index.html"), "utf8");
  const swapped = html
    .replace(/<script src="openmind\.engine(?:\.[a-f0-9]{12})?\.js"><\/script>/, `<script src="${engineName}"></script>`)
    .replace(/<script src="app(?:\.[a-f0-9]{12})?\.js"><\/script>/, `<script src="${appName}"></script>`)
    .replace(/<link rel="stylesheet" href="app(?:\.[a-f0-9]{12})?\.css">/, `<link rel="stylesheet" href="${cssName}">`);
  if (
    !swapped.includes(`src="${engineName}"`) ||
    !swapped.includes(`src="${appName}"`) ||
    !swapped.includes(`href="${cssName}"`)
  ) {
    throw new Error("index.html does not name the engine/app scripts/styles — cannot version them");
  }
  if (/src="(?:app|openmind\.engine)\.js"/.test(swapped) || /href="app\.css"/.test(swapped)) {
    throw new Error("index.html still references a fixed (unversioned) asset URL");
  }
  fs.writeFileSync(path.join("docs", "index.html"), swapped);
  return [engineName, appName, cssName];
}

// ── NO TIMESTAMP IN THE ARTIFACT ─────────────────────────────────────────────
// The engine used to carry `meta.builtAt` (nothing ever read it). Its bytes are
// the service worker's cache key — `shellVersion` hashes every file in
// SHELL_FILES — so a build clock in there made the key change on EVERY rebuild,
// including one that changed nothing, and the worker's `activate` then evicted
// the cached shell for every returning learner: the whole 2.4 MB engine
// re-downloaded on their next visit, on exactly the connections this offline
// build exists for. The worker's own comment states the intent — a changed key
// must mean "the app changed" — and a timestamp makes it mean "someone rebuilt".
// Removing it makes the artifact byte-stable, which is what lets the key do its
// job in both directions: it moves when the content moves, and only then.

/** The worker's cache list. `"./"` is here for a reason that is easy to lose:
 *  a browser asking for the directory (`https://host/Non-profit/`) sends that
 *  URL itself, not `.../index.html`, so a shell list without `"./"` misses on
 *  the ONE request that matters — opening the app — and, with no network, the
 *  worker has nothing to answer with. The rest are listed by name because the
 *  page requests them by name. */
const SHELL_URLS_LAZY = () => ["./", ...shellFileList().map((f) => `./${f}`)];

/** The files the worker caches, in a stable order: the two fixed ones, then the
 *  content-hashed assets as this build emitted them. Read lazily, because the
 *  hashed names do not exist until emitHashedAssets has run. */
function shellFileList() {
  return [
    ...SHELL_FILES,
    ...(HASHED.engine ? [HASHED.engine, HASHED.app, HASHED.css] : ["openmind.engine.js", "app.js", "app.css"]),
  ];
}

function shellVersion() {
  const h = crypto.createHash("sha256");
  for (const f of shellFileList()) {
    h.update(f);
    h.update(fs.readFileSync(path.join("docs", f)));
  }
  return h.digest("hex").slice(0, 12);
}

function writeServiceWorker() {
  const version = shellVersion();
  const src = `/* OpenMind — offline shell for the static build. GENERATED by
 * scripts/build-static-app.mjs: do not edit. The cache name below is a hash of
 * the exact files it caches, so a deploy that changes any of them installs a
 * new worker and evicts the old cache. Never hand-bump it.
 *
 * The static build has no server, so "offline" needs no sync protocol: the
 * learner's work is already on the device. What it does need is the app itself,
 * and that is what this caches — the shell, the stylesheet and the engine
 * bundle.
 */
const CACHE = "openmind-static-${version}";
const SHELL = [${SHELL_URLS_LAZY().map((u) => JSON.stringify(u)).join(", ")}];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch another origin's traffic

  // index.html is NETWORK-FIRST, and it is the one exception to the rule below.
  // It is the file that names the content-hashed engine, so serving a cached
  // copy would hand the learner a page pointing at the PREVIOUS build's assets
  // while the previous assets are the only ones in this cache. Re-reading it
  // online is what lets a returning learner discover a new build at all; with
  // no network it falls back to the cached copy, which is the whole point.
  if (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./"))),
    );
    return;
  }

  // Cache-first for everything else, deliberately: offline the app must open
  // INSTANTLY, not after a network call has timed out. It is safe now that the
  // assets are content-hashed — a cached hit for "app.<hash>.js" is by
  // definition this build's file, so cache-first cannot serve stale content the
  // way it could when every build shared one URL.
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});
`;
  fs.writeFileSync(path.join("docs", "sw.js"), src);
  console.log(`service worker: cache openmind-static-${version} → docs/sw.js`);

  // GitHub Pages runs Jekyll over the published directory unless it is told
  // not to, and Jekyll will silently drop or refuse to copy files it treats
  // as special. `.nojekyll` is the only supported way to say "serve these
  // bytes verbatim", so it is generated here rather than left as an
  // untracked file that the next clean checkout would lose.
  fs.writeFileSync(path.join("docs", ".nojekyll"), "");
  console.log("static-host marker: docs/.nojekyll (serve docs/ verbatim)");
}

function main() {
  compile();
  const reachable = closure();
  const code = bundle(reachable);
  const kb = (Buffer.byteLength(code) / 1024).toFixed(1);

  // Written under content-hashed names FIRST, because index.html has to name
  // them and the worker's key is a hash of the files that exist afterwards.
  const [engineName, appName] = emitHashedAssets(code);
  console.log(`static bundle: ${reachable.size} modules, ${kb} KiB → docs/${engineName}`);

  const single = singleFile(code);
  fs.writeFileSync(SINGLE_FILE, single);
  console.log(`single file: ${(Buffer.byteLength(single) / 1024).toFixed(1)} KiB → ${SINGLE_FILE} (runs from file://)`);
  // Last, so the hash covers the bundle this build just wrote.
  writeServiceWorker();
  console.log(`compile mirror kept at ${MIRROR_DIR}/ for the verification pipeline`);
  void BUNDLE;
  void appName;
}

main();
