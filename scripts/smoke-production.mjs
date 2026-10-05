// ─────────────────────────────────────────────────────────────────────────────
// THE SMOKE CHECK AN UPTIME MONITOR WOULD RUN (§14 of the deployment brief).
//
// This is the check that has to work from OUTSIDE the building: it makes plain
// GETs against a running deployment, asserts the things a stranger can see, and
// reports one line per route. It deliberately does not know about the data
// directory, does not create a learner, and does not read the filesystem — if it
// can only pass on the machine that runs the server, it cannot answer "are we
// up?", which is the whole question.
//
// External monitoring should poll the same handful of URLs this checks:
//
//   /            the public entry point
//   /about       a static public page
//   /curriculum  a public page that must show content or a real empty state
//   /offline     the offline promise page
//   /onboarding  the account/sign-in entry (this app has no separate /signin)
//   /api/health  liveness
//   /api/ready   readiness (503 means "do not send users here")
//
// It also asserts the two failures that are worth catching before a person does:
// a page that returns 200 while shipping NO stylesheet (the unstyled page this
// repository has actually shipped once), and a 404 that returns 200.
//
// Usage:
//   OPENMIND_BASE=https://openmind.example.org node scripts/smoke-production.mjs
//   (default BASE: http://localhost:3000 on a local machine)
//
// Exit code 0 when the deployment is serving; 1 otherwise.
// ─────────────────────────────────────────────────────────────────────────────
const BASE = process.env.OPENMIND_BASE ?? "http://localhost:3000";
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 8000);
const SLOW_MS = Number(process.env.SMOKE_SLOW_MS ?? 3000);

let pass = 0, fail = 0;
const bad = [];
const ok = (c, msg, detail = "") => {
  if (c) { pass++; console.log(`  ✓ ${msg}${detail ? ` (${detail})` : ""}`); }
  else { fail++; bad.push(`${msg}${detail ? ` — ${detail}` : ""}`); console.error(`  ✗ ${msg}${detail ? ` — ${detail}` : ""}`); }
};
const group = (n) => console.log(`\n${n}`);

async function timed(pathname) {
  const started = Date.now();
  try {
    const res = await fetch(BASE + pathname, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "openmind-smoke/1.0" },
    });
    const body = await res.text();
    return { ok: true, status: res.status, body, ms: Date.now() - started, headers: res.headers };
  } catch (e) {
    return { ok: false, status: 0, body: "", ms: Date.now() - started, error: e.message };
  }
}

console.log(`\nProduction smoke — ${BASE}\n`);

// ── 1. Public pages ──────────────────────────────────────────────────────────
group("1 · public pages answer");
const PAGES = [
  ["/", "the public entry point"],
  ["/about", "the about page"],
  ["/curriculum", "the curriculum page"],
  ["/offline", "the offline page"],
  ["/onboarding", "the account entry (sign-up / sign-in)"],
];
const pages = {};
for (const [route, name] of PAGES) {
  const r = await timed(route);
  pages[route] = r;
  ok(r.ok && r.status === 200, `${name} returns 200`, r.ok ? `${r.ms}ms` : r.error);
  if (r.ok && r.ms > SLOW_MS) console.log(`    · slow: ${route} took ${r.ms}ms (budget ${SLOW_MS}ms)`);
}

// The home page must ship a stylesheet. A 200 that points at no CSS is the
// unstyled-page failure this repository has already shipped once.
const home = pages["/"];
if (home?.ok) {
  const sheets = [...home.body.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  ok(sheets.length >= 1, "the home page links a stylesheet (it will not render unstyled)", `${sheets.length} link(s)`);
  const one = sheets[0];
  if (one) {
    const css = await timed(one);
    ok(css.ok && css.status === 200 && css.body.length > 1000,
      "and that stylesheet actually serves", css.ok ? `${css.body.length} bytes` : css.error);
  }
  ok(/<html[^>]+lang=/.test(home.body), "the document declares a language", "WCAG 3.1.1");
  ok(!/<title[^>]*>\s*<\/title>/.test(home.body), "the document has a non-empty title");
}

// ── 2. Health and readiness ──────────────────────────────────────────────────
group("2 · the operational endpoints");
const health = await timed("/api/health");
ok(health.ok && health.status === 200, "liveness (/api/health) returns 200", health.ok ? `${health.ms}ms` : health.error);
if (health.ok && health.status === 200) {
  let j = null;
  try { j = JSON.parse(health.body); } catch { /* reported below */ }
  ok(j?.status === "ok", "and reports status:\"ok\"");
  ok(typeof j?.deployment === "string" && j.deployment.length > 0, "and names the deployment version", j?.deployment);
}

const ready = await timed("/api/ready");
ok(ready.ok && ready.status === 200, "readiness (/api/ready) returns 200", ready.ok ? `${ready.ms}ms` : ready.error);
if (ready.ok) {
  let j = null;
  try { j = JSON.parse(ready.body); } catch { /* reported below */ }
  if (ready.status !== 200) {
    const failedChecks = Object.entries(j?.checks ?? {}).filter(([, c]) => !c?.ok).map(([k, c]) => `${k}:${c?.code}`);
    console.error(`    · not ready — failing checks: ${failedChecks.join(", ") || "unknown"}`);
  } else {
    ok(j?.ready === true, "and reports ready:true");
    ok(j?.checks?.data?.ok === true, "storage is writable");
    ok(j?.checks?.config?.ok === true, "configuration is well-formed");
    ok(j?.checks?.content?.ok === true, "the content graph is loaded");
  }
}

// ── 3. Errors are errors ─────────────────────────────────────────────────────
group("3 · a missing page is a 404, not a 200");
const missing = await timed(`/this-page-does-not-exist-${Date.now().toString(36)}`);
ok(missing.ok && missing.status === 404, "an unknown route returns 404", `got ${missing.status}`);

console.log(`\n${"─".repeat(58)}`);
console.log(`PRODUCTION SMOKE: ${pass} passed, ${fail} failed`);
if (fail) for (const b of bad) console.log(`  · ${b}`);
process.exit(fail ? 1 : 0);
