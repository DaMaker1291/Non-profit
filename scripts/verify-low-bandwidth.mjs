#!/usr/bin/env node
// ── MEASURE WHAT A SLOW SCHOOL CONNECTION ACTUALLY RECEIVES ─────────────────
//
// Printed lesson pages are the lowest-bandwidth route; the interactive lesson
// is the highest. This walk throttles Chrome's own network stack, disables the
// cache, and records transferred bytes and time-to-heading for both, so a
// budget can be set from measurements rather than from a feeling.
//
//   BANDWIDTH_BASE=http://127.0.0.1:4174 node scripts/verify-low-bandwidth.mjs
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = process.env.BANDWIDTH_BASE ?? "http://127.0.0.1:4174";
const profileDir = mkdtempSync(path.join(tmpdir(), "openmind-bw-"));

const results = [];
let browser = null;
try {
  const ping = await fetch(`${BASE}/api/health`);
  if (!ping.ok) throw new Error(`health ${ping.status}`);
  browser = await launchChrome({ port: 11300 + Math.floor(Math.random() * 50), userDataDir: profileDir, keepProfile: true });
  const p = pageFor(browser.send);
  const events = [];
  await browser.send("Network.enable");
  // The event listener is installed by launchChrome only when onEvent is
  // supplied, so this script re-launches nothing: it reads the counters from
  // performance entries, which are available to the page itself and include
  // every asset the browser actually transferred.
  async function measure(label, route, kbps, latencyMs) {
    await browser.send("Network.setCacheDisabled", { cacheDisabled: true });
    await browser.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: latencyMs,
      downloadThroughput: Math.round((kbps * 1024) / 8),
      uploadThroughput: Math.round((kbps * 1024) / 8),
      connectionType: kbps <= 100 ? "cellular2g" : "cellular3g",
    });
    const started = Date.now();
    // Navigate WITHOUT waiting for `load`: on a 50 kbps link the page's main
    // content is readable while its optional chunks are still arriving, and the
    // point of the measurement is instruction, not every asset. This is also
    // what a learner experiences.
    await browser.send("Page.navigate", { url: `${BASE}${route}` });
    await p.waitFor(`return !!document.querySelector("main");`, `${label} main content`, 90000);
    const elapsed = Date.now() - started;
    await sleep(500);
    const info = await p.evaluate(`return (() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      const transfer = resources.reduce((n, r) => n + (r.transferSize || 0), 0) + (nav?.transferSize || 0);
      const decoded = resources.reduce((n, r) => n + (r.decodedBodySize || 0), 0) + (nav?.decodedBodySize || 0);
      return {
        transfer,
        decoded,
        resources: resources.length,
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        load: nav ? Math.round(nav.loadEventEnd) : null,
        js: resources.filter((r) => /\\.js(\\?|$)/.test(r.name)).length,
        images: resources.filter((r) => /\\.(png|jpe?g|webp|gif)(\\?|$)/.test(r.name)).length,
        video: resources.filter((r) => /\\.(mp4|webm|m3u8)(\\?|$)/.test(r.name)).length,
      };
    })();`);
    const row = { label, route, kbps, latencyMs, wallMs: elapsed, ...info };
    results.push(row);

    // WHAT THE FIRST LOAD ACTUALLY COST. The snapshot above is taken the moment
    // `main` is on screen, so its bytes are a HALF-LOADED page: on a slow link the
    // chunks that arrive after the content are still in flight, and the same route
    // measured twice could report 5 resources or 38 depending on timing. Time to
    // instruction is the number that matters to a learner, but "how much does this
    // page download" is a different question and it needs the settled figure. So
    // wait for the page to finish loading (bounded — a slow route is a finding, not
    // a hang) and report both, labelled.
    let settled = null;
    try {
      await p.waitFor('return document.readyState === "complete";', `${label} settled`, 60000);
      const settledMs = Date.now() - started;
      const late = await p.evaluate(`return (() => {
        const nav = performance.getEntriesByType("navigation")[0];
        const resources = performance.getEntriesByType("resource");
        return {
          transfer: resources.reduce((n, r) => n + (r.transferSize || 0), 0) + (nav?.transferSize || 0),
          resources: resources.length,
          js: resources.filter((r) => /\\.js(\\?|$)/.test(r.name)).length,
        };
      })();`);
      settled = { settledWallMs: settledMs, settledTransfer: late.transfer, settledResources: late.resources, settledJs: late.js };
      Object.assign(row, settled);
    } catch {
      // The page never reached `complete` inside the budget: report that plainly
      // rather than printing the half-loaded snapshot as if it were the total.
      row.settledTimedOut = true;
    }

    console.log(`  ${label}: ${(info.transfer / 1024).toFixed(1)} KiB when readable (${info.resources} resources, ${elapsed} ms), `
      + (settled
        ? `${(settled.settledTransfer / 1024).toFixed(1)} KiB when loaded (${settled.settledResources} resources, ${settled.settledWallMs} ms) `
        : "did not finish loading within 60 s ")
      + `at ${kbps} kbps / ${latencyMs} ms latency`);
    await browser.send("Network.emulateNetworkConditions", {
      offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1, connectionType: "wifi",
    });
    return row;
  }

  console.log("▸ 2G-class connection (50 kbps, 300 ms latency)");
  const sheet = await measure("pupil worksheet", "/print/maths/fractions", 50, 300);
  const index = await measure("print index", "/print", 50, 300);
  console.log("\n▸ 3G-class connection (500 kbps, 150 ms latency)");
  const lesson = await measure("interactive lesson", "/learn/maths/fractions", 500, 150);
  const home = await measure("home", "/", 500, 150);

  const noVideo = results.every((r) => r.video === 0);
  const sheetBudget = 250 * 1024;
  const lessonBudget = 2.5 * 1024 * 1024;
  if (sheet.transfer > sheetBudget) throw new Error(`worksheet exceeded its measured budget: ${sheet.transfer} > ${sheetBudget}`);
  if (lesson.transfer > lessonBudget) throw new Error(`lesson exceeded its measured budget: ${lesson.transfer} > ${lessonBudget}`);
  if (!noVideo) throw new Error("a measured route transferred video");
  if (sheet.wallMs > 20000) throw new Error(`worksheet took ${sheet.wallMs} ms on a 2G connection`);

  writeFileSync(path.resolve("reports/low-bandwidth.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    base: BASE,
    note: "Chrome network emulation with the HTTP cache disabled. transferSize is the browser's own byte count, not a gzip estimate. `transfer` is what had arrived when the main content was readable, `settledTransfer` is the whole page once it finished loading.",
    budgets: {
      worksheetTransferBytes: sheetBudget,
      lessonTransferBytes: lessonBudget,
      worksheetWallMsAt50kbps: 20000,
      videoAllowed: false,
    },
    results,
  }, null, 2));
  console.log(`\nBudgets: worksheet ≤ ${(sheetBudget / 1024).toFixed(0)} KiB, lesson ≤ ${(lessonBudget / 1024).toFixed(0)} KiB, no video.`);
  console.log("Evidence written to reports/low-bandwidth.json");
} finally {
  try { if (browser) await browser.close(); } catch { /* best effort */ }
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* best effort */ }
}
