#!/usr/bin/env node
// A read-only HTTP server for the exported content mirror. It serves the folder
// and nothing else: no accounts, no learner records, no writes, no uploads.
// Bind defaults to all interfaces so a school laptop can be reached on the LAN;
// set LOCAL_CONTENT_HOST=127.0.0.1 to keep it on the machine for testing.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.env.OPENMIND_CONTENT_DIR ?? "dist/openmind-content");
const HOST = process.env.LOCAL_CONTENT_HOST ?? "0.0.0.0";
const PORT = Number(process.env.LOCAL_CONTENT_PORT ?? 8787);
const TYPES = {
  ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

if (!existsSync(path.join(ROOT, "manifest.json"))) {
  console.error(`No manifest at ${ROOT}. Run: npm run content:bundle`);
  process.exit(1);
}

const server = createServer((req, res) => {
  // Read-only by construction: anything but GET/HEAD is refused.
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("read-only content server");
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400); res.end("bad path"); return;
  }
  if (pathname === "/") pathname = "/index.html";
  const target = path.resolve(ROOT, "." + pathname);
  // The mirror is a folder; a traversal attempt must not reach the rest of the
  // laptop that is serving it.
  if (!target.startsWith(ROOT + path.sep) || !existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404); res.end("not found"); return;
  }
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    "Content-Type": TYPES[ext] ?? "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") { res.end(); return; }
  createReadStream(target).pipe(res);
});

server.listen(PORT, HOST, () => {
  const local = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log(`OpenMind local content: http://${local}:${PORT}/`);
  console.log(`Serving ${ROOT} read-only. No learner records, accounts or teacher keys.`);
  console.log("Devices must be on the same network. Stop with Ctrl+C.");
});
