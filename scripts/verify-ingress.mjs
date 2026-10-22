// ── THE INGRESS CONTRACT, THROUGH A REAL PROXY ─────────────────────────────
//
// `npm run verify` drives the address parser with `new Headers()` objects. That
// proves the RULES; it does not prove the rules survive what actually arrives on
// a socket — a header sent twice, a chain a proxy appended to, a request that
// skipped the proxy entirely. Those are exactly the shapes an attacker produces,
// and every one of them is invisible to a unit test that builds its own headers.
//
// So this harness runs TWO real HTTP servers:
//
//   client ──▶ proxy ──▶ upstream
//
//   · the PROXY appends `x-forwarded-for` with the peer it saw, which is the
//     documented behaviour of the edge this app is built for (Fly's proxy
//     appends rather than replaces — docs/DEPLOYMENT.md §10 records the source);
//   · the UPSTREAM calls the REAL `readIngress` the routes call, over the real
//     `Headers` Node produced from the wire, and answers with what it decided;
//   · a second proxy can be chained to model a two-proxy topology, and the
//     upstream's hop count is the knob under test.
//
// WHAT THIS IS NOT: proof that a hosting provider is configured correctly. A
// local proxy is a model of the contract, not the deployment. The staging check
// (`npm run verify:ingress -- --base <url>`) is the only thing that can answer
// that, because only it goes through the live ingress.
//
// Usage:  node scripts/verify-ingress.mjs        (exit 0 when every case holds)
//
import http from "http";
import net from "net";
import { compileEngines } from "./compile-engines.mjs";

let pass = 0, fail = 0;
const bad = [];
const ok = (cond, msg, detail = "") => {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; bad.push(msg); console.error(`  ✗ ${msg}${detail ? ` — ${detail}` : ""}`); }
};

// The suite compiles the modules it requires into `.verify/`; importing the
// export is the documented way to do that (running compile-engines.mjs directly
// compiles nothing).
await compileEngines();
const { createRequire } = await import("module");
const require = createRequire(import.meta.url);
const ingress = require("../.verify/server/client-address.js");

const listen = (server) =>
  new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));

// ── The upstream: answers with what the REAL parser decided ─────────────────
const upstream = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const env = {
    OPENMIND_TRUSTED_PROXY: url.searchParams.get("trusted") ?? undefined,
    OPENMIND_TRUSTED_PROXY_HOPS: url.searchParams.get("hops") ?? undefined,
  };
  // Node hands the app its raw incoming headers; the routes see a `Headers`.
  // Convert the way Node itself would, so a duplicated header arrives as the
  // same single chain the app would have been given.
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const v of value) headers.append(name, v);
    else if (typeof value === "string") headers.set(name, value);
  }
  const verdict = ingress.readIngress(headers, env);
  // An explicit length, so a client reading the RAW socket (the duplicate-header
  // case) gets a body rather than chunk framing it would have to strip.
  const payload = JSON.stringify(verdict);
  res.writeHead(200, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
});

// ── The proxy: appends the peer it saw, like the edge this app deploys behind.
// `x-sim-peer` lets a case name the upstream peer it is pretending to be, so a
// loopback harness can model two different clients. It is the ONE simulated part
// and it is labelled as such wherever a case depends on it.
const proxy = http.createServer((req, res) => {
  const peer = (req.headers["x-sim-peer"] || req.socket.remoteAddress || "").toString().trim();
  const existing = req.headers["x-forwarded-for"];
  const chain = [existing, peer].filter((v) => v !== undefined && v !== "").join(", ");
  const headers = { ...req.headers, "x-forwarded-for": chain };
  delete headers["x-sim-peer"];
  const host = req.headers.host?.replace(/:\d+$/, "");
  const target = http.request(
    { hostname: "127.0.0.1", port: upstreamPort, path: req.url, method: req.method, headers },
    (up) => { res.writeHead(up.statusCode ?? 502, up.headers); up.pipe(res); },
  );
  target.on("error", () => { res.writeHead(502); res.end("proxy error"); });
  void host;
  req.pipe(target);
});

const upstreamPort = await listen(upstream);
const proxyPort = await listen(proxy);

/** One request through the proxy. Returns the parser's verdict. */
function through(port, { path = "/", headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path, method: body ? "POST" : "GET", headers }, (res) => {
      let text = "";
      res.on("data", (c) => (text += c));
      res.on("end", () => {
        try { resolve(JSON.parse(text)); } catch { resolve({ raw: text, status: res.statusCode }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

/** Send a request with a header written TWICE on the wire.
 *
 *  Node's client joins an array value into one comma chain, which is NOT the
 *  same thing as two header lines — and a proxy or a buggy client can send the
 *  latter. A raw socket is the only honest way to produce it. */
function duplicateHeader(port, values) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => {
      const lines = values.map((v) => `x-forwarded-for: ${v}`).join("\r\n");
      socket.write(`GET /?trusted=1 HTTP/1.1\r\nHost: localhost\r\n${lines}\r\nConnection: close\r\n\r\n`);
    });
    let text = "";
    socket.on("data", (c) => (text += c));
    socket.on("end", () => {
      const bodyAt = text.indexOf("\r\n\r\n");
      try { resolve(JSON.parse(text.slice(bodyAt + 4))); } catch { resolve({ raw: text }); }
    });
    socket.on("error", reject);
    setTimeout(() => { socket.destroy(); resolve({ raw: "timeout" }); }, 5_000);
  });
}

const addr = (v) => (v.kind === "client" ? v.address : v.kind === "refused" ? `refused:${v.reason}` : "direct");

console.log("▸ A forwarded address survives a real proxy, and a bypass is refused");

// 1. NO PROXY DECLARED, and the client forges the header anyway.
{
  const v = await through(proxyPort, { path: "/?trusted=", headers: { "x-forwarded-for": "9.9.9.9" } });
  ok(addr(v) === "direct",
    "with no proxy declared, a real proxied request still has NO identity (the client cannot choose one)");
}

// 2. ORDINARY REQUEST: the proxy appended the peer, the app reads it.
{
  const v = await through(proxyPort, { path: "/?trusted=1" });
  ok(addr(v) === "127.0.0.1", `a request through the proxy is attributed to the peer it saw (${addr(v)})`);
  ok(v.chainLength === 1, `and the chain it read was one entry long (${v.chainLength})`);
}

// 3. FORGED FIRST ENTRY, through a real proxy that appends. The append is the
//    whole safety property: the forged value is to the LEFT of what the proxy
//    wrote, so it can never be the trusted position.
{
  const v = await through(proxyPort, { path: "/?trusted=1", headers: { "x-forwarded-for": "9.9.9.9" } });
  ok(addr(v) === "127.0.0.1",
    `an injected first entry does not name the client (header ${JSON.stringify("9.9.9.9")} → ${addr(v)})`);
  ok(v.chainLength === 2, "the forged entry is still visible in the chain, just not trusted");
}

// 4. ROTATION: a hundred different forged prefixes, one identity.
{
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const v = await through(proxyPort, { path: "/?trusted=1", headers: { "x-forwarded-for": `10.0.${i}.${i}` } });
    seen.add(addr(v));
  }
  ok(seen.size === 1 && seen.has("127.0.0.1"),
    `100 rotating forged addresses produce ONE rate-limit identity (${[...seen].join(", ")})`);
}

// 5. TWO CLIENTS, on a real socket. The peer is simulated because everything is
//    loopback; the header path is real.
{
  const a = await through(proxyPort, { path: "/?trusted=1", headers: { "x-sim-peer": "198.51.100.7" } });
  const b = await through(proxyPort, { path: "/?trusted=1", headers: { "x-sim-peer": "198.51.100.8" } });
  ok(addr(a) === "198.51.100.7" && addr(b) === "198.51.100.8" && addr(a) !== addr(b),
    `two peers are two identities (${addr(a)} / ${addr(b)})`);
}

// 6. TWO PROXIES: the hop count is what makes the second-from-right entry the
//    client, and a one-hop declaration would name the inner proxy instead. This
//    is the case the old "rightmost is always the client" rule got wrong.
{
  const twoHopPort = await listen(http.createServer((req, res) => {
    // The outer proxy appends its simulated peer, then forwards to the inner one.
    const chain = [req.headers["x-forwarded-for"], "203.0.113.9"].filter(Boolean).join(", ");
    const headers = { ...req.headers, "x-forwarded-for": chain };
    delete headers["x-sim-peer"];
    const t = http.request({ hostname: "127.0.0.1", port: proxyPort, path: req.url, headers }, (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    });
    t.on("error", () => { res.writeHead(502); res.end(); });
    req.pipe(t);
  }));
  const at2 = await through(twoHopPort, { path: "/?trusted=1&hops=2" });
  ok(addr(at2) === "203.0.113.9",
    `behind two proxies the client is the second entry from the right (${addr(at2)})`);
  const at1 = await through(twoHopPort, { path: "/?trusted=1&hops=1" });
  ok(addr(at1) === "127.0.0.1",
    `and declaring ONE hop names the inner proxy instead (${addr(at1)}) — which is why the hop count is not optional`);
  twoHopPort.close?.();
  void twoHopPort;
}

// 7. THE HEADER SENT TWICE, on the wire. Node joins duplicates into one chain
//    for `headers.get`, so this asserts the join is the chain the parser reads.
{
  const v = await duplicateHeader(proxyPort, ["6.6.6.6", "7.7.7.7"]);
  ok(v.kind === "client" && v.chainLength >= 2,
    `a duplicated header arrives as ONE chain (${v.chainLength} entries)`);
  ok(addr(v) === "127.0.0.1",
    `and the appended peer is still the trusted entry, not either duplicate (${addr(v)})`);
}

// 8. THE BYPASS: a request that reaches the origin without going through the
//    proxy, on a deployment that declared one. This is the case the old code
//    silently treated as "no address limit"; it must refuse.
{
  const v = await through(upstreamPort, { path: "/?trusted=1" });
  ok(addr(v) === "refused:header_missing",
    `a request that skips the proxy is REFUSED, not silently unbounded (${addr(v)})`);
}

// 9. THE SAME BYPASS with a forged header, which is what an attacker would try.
{
  const v = await through(upstreamPort, { path: "/?trusted=1", headers: { "x-forwarded-for": "9.9.9.9" } });
  ok(addr(v) === "9.9.9.9",
    `a direct request with a forged chain IS believed by the parser (${addr(v)}) — which is why the origin must be reachable only through the proxy, and why a proxy-less deployment must not declare one`);
}

proxy.close();
upstream.close();

console.log(`\n${"─".repeat(58)}`);
console.log(`INGRESS: ${pass} passed, ${fail} failed`);
if (fail) for (const b of bad) console.log(`  · ${b}`);
process.exit(fail ? 1 : 0);
