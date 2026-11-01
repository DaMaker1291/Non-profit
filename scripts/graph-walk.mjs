#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE GRAPH WALK — the plotted-line question in a real browser.
//
// WHAT IT PROVES, and why a module test cannot:
//   · the grid the learner uses is the grid whose line is marked;
//   · joining points stores an explicit line, and adding or removing a point
//     afterwards does NOT move that line;
//   · a full plotted answer marks 6/6 through the real paper submission;
//   · the same editor works at 390×844 without sideways scroll, and a
//     read-off from the line the learner just drew earns its mark.
//
// Run with the dev server up on a scratch store:
//   OPENMIND_DATA_DIR=$(mktemp -d) npm run dev
//   npm run verify:graph
// ─────────────────────────────────────────────────────────────────────────────
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = process.env.GRAPH_WALK_BASE ?? "http://127.0.0.1:4173";
const PORT = 9333 + Math.floor(Math.random() * 400);
let passed = 0, failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`   ✓ ${msg}`); }
  else { failed++; console.log(`   ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

async function main() {
  try {
    const r = await fetch(BASE, { method: "GET" });
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`The app is not answering at ${BASE}. Start it first:  npm run dev`);
    process.exit(2);
  }

  // The same profile fields the wizard writes; Year 11 is deliberate, because
  // the earlier browser attempt lost that value and the gate must accept it.
  const secret = `graph-walk-${Math.random().toString(36).slice(2)}-secret`;
  const seed = await (await fetch(`${BASE}/api/profile`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle: "graph_walk", country: "GB", language: "en", birthYear: 2010, subjects: ["maths"], spec: "uk-gcse", secret }),
  })).json();
  const id = seed.profile?.id;
  if (!id) { console.error("could not seed:", JSON.stringify(seed).slice(0, 300)); process.exit(2); }
  const saved = await (await fetch(`${BASE}/api/profile`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id, secret, country: "GB", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
      grade: "Year 11", onboarded: true,
    }),
  })).json();
  if (!saved.profile) { console.error("could not complete course:", JSON.stringify(saved).slice(0, 300)); process.exit(2); }
  check(saved.profile.grade === "Year 11", `the supported fixture stores the Year 11 the course screen would send (${saved.profile.grade})`);

  const { send, close } = await launchChrome({ port: PORT, width: 1280, height: 900 });
  const p = pageFor(send);
  const viewport = async (width, height) => {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await sleep(300);
  };
  const startP2 = `[...document.querySelectorAll("main button")].find(b => /^Start$/.test((b.textContent || "").trim()) && /AQA/.test(b.parentElement?.innerText || "") && /Paper 2/.test(b.parentElement?.innerText || ""))`;
  const addPoint = async (x, y) => {
    await p.typeInto(`document.querySelector('input[aria-label="Question 33 (a): add a point as x,y"]')`, `${x},${y}`, `point ${x},${y}`);
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /^Add point$/.test((b.textContent || "").trim()))`, "Add point");
  };
  const toggleLine = () => p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Join my points|Line drawn/.test(b.textContent || ""))`, "Join my points");
  const lineData = () => p.evaluate(`return document.querySelector("svg[data-plot-points]")?.getAttribute("data-plot-line") ?? null;`);
  const pointCount = () => p.evaluate(`return Number(document.querySelector("svg[data-plot-points]")?.getAttribute("data-plot-points") ?? -1);`);
  const finish = `[...document.querySelectorAll("main button")].find(b => /Finish and mark/.test(b.textContent || ""))`;
  const startSitting = async () => {
    await p.clickExpr(startP2, "AQA Paper 2");
    await p.waitFor(`return !!document.querySelector("[data-exam-head]");`, "the paper to open", 30000);
    await p.clickExpr(`[...document.querySelectorAll("[data-question-grid] button")].at(-1)`, "the plotted question");
    await p.waitFor(`return /Question 33 of 33/.test(document.querySelector("[data-question-of]")?.textContent || "") && !!document.querySelector("svg[data-plot-points]");`, "the plotted grid", 15000);
  };
  const type = (label, value) => p.typeInto(`document.querySelector('input[aria-label="${label}"]')`, value, label);

  try {
    await p.goto(`${BASE}/onboarding`);
    await p.evaluate(`localStorage.setItem("openmind:profileId", ${JSON.stringify(id)});
      localStorage.setItem("openmind:profileSecret", ${JSON.stringify(secret)}); return true;`);
    await p.goto(`${BASE}/papers`);
    await p.waitFor(`return location.pathname === "/papers" && [...document.querySelectorAll("main button")].some(b => /^Start$/.test((b.textContent || "").trim()));`, "the picker for a Year 11 learner", 30000);

    section("Desktop: plot, join, and keep the line still");
    await startSitting();
    const lines = [];
    for (const [x, y] of [[-1, -3], [0, -1], [2, 3], [3, 5]]) await addPoint(x, y);
    check(await pointCount() === 4, "four points are plotted through the keyboard path");
    await toggleLine();
    await sleep(200);
    const line = await lineData();
    const coords = line ? line.split(" ").map((s) => s.split(",").map(Number)) : [];
    check(coords.length === 2 && coords.every(([x, y]) => Math.abs(y - (2 * x - 1)) < 1e-9),
      `the rendered line is exactly y = 2x − 1 (${line})`);
    await addPoint(1, 1);
    check(await pointCount() === 5, "an extra point can be added");
    check(await lineData() === line, "adding a point does NOT move the joined line");
    await p.clickExpr(`document.querySelector('button[aria-label="Remove point (1, 1)"]')`, "remove the extra point");
    check(await pointCount() === 4, "and a point can be removed");
    check(await lineData() === line, "removing a point does not move the line either");

    section("Desktop: the submission is marked against that graph");
    await type("Question 33 (b)", "2");
    await type("Question 33 (c)", "0,3 2,1");
    await type("Question 33 (d)", "4");
    await p.clickExpr(finish, "Finish and mark");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Sit another paper/.test(b.textContent || ""));`, "the marked result", 30000);
    const result = await p.allText();
    check(/6\/80/.test(result) && /6\/6/.test(result),
      `the fully plotted and read answer marks 6/6 and 6/80 overall (${result.match(/\d+\/80/)?.[0] ?? "no total found"})`);

    section("Mobile 390×844: the same editor, no sideways scroll");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Sit another paper/.test(b.textContent || ""))`, "Sit another paper");
    await viewport(390, 844);
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /^Start$/.test((b.textContent || "").trim()));`, "the picker at phone width", 20000);
    await startSitting();
    const width = await p.evaluate(`return { scroll: document.documentElement.scrollWidth, inner: window.innerWidth, grid: document.querySelector("svg[data-plot-points]")?.getBoundingClientRect().width ?? 0 };`);
    check(width.scroll <= width.inner + 1, `the plotted page does not scroll sideways at 390 (${width.scroll} vs ${width.inner})`);
    check(width.grid > 0 && width.grid <= width.inner, `the grid fits the phone viewport (${Math.round(width.grid)} px)`);
    // THE SECOND SITTING'S OTHER PARTS MUST BE EMPTY. These were answered in
    // the desktop sitting; a carried value here would make the mark meaningless.
    const otherParts = await p.evaluate(`return ["Question 33 (c)", "Question 33 (d)"].map(label => document.querySelector('input[aria-label="' + label + '"]')?.value ?? null);`);
    check(otherParts.every((v) => v === ""),
      `the second sitting's parts (c) and (d) start empty (${JSON.stringify(otherParts)})`);
    await addPoint(-1, -3);
    await addPoint(0, -1);
    await toggleLine();
    await sleep(200);
    const mobileLine = await lineData();
    const mc = mobileLine ? mobileLine.split(" ").map((s) => s.split(",").map(Number)) : null;
    const m = mc && mc[1][0] !== mc[0][0] ? (mc[1][1] - mc[0][1]) / (mc[1][0] - mc[0][0]) : null;
    const expected = m === null ? null : m * 1.5 + (mc[0][1] - m * mc[0][0]);
    check(expected !== null && Math.abs(expected - 2) < 1e-9, `the phone's drawn line reads y = 2 at x = 1.5 (${expected})`);
    await type("Question 33 (b)", String(expected));
    // PART (d) READS FROM THE LINE THE LEARNER GAVE IN (c). These points state
    // y = −x + 4: a valid but WRONG line for the asked-for y = −x + 3. Reading
    // y = 5 at x = −1 earns the follow-through mark; the key's 4 would not. A
    // marker using the intended line would score this sitting 4/6, not 5/6.
    await type("Question 33 (c)", "0,4 2,2");
    await type("Question 33 (d)", "5");
    await p.clickExpr(finish, "Finish and mark on the phone");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Sit another paper/.test(b.textContent || ""));`, "the phone result", 30000);
    const mobileResult = await p.allText();
    check(/5\/80/.test(mobileResult) && /5\/6/.test(mobileResult),
      `the phone follows through from BOTH learner lines: 5/6, 5/80 (${mobileResult.match(/\d+\/80/)?.[0] ?? "no total found"})`);
  } finally {
    await close();
  }

  console.log(`\nGraph walk: ${passed} passed, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(`\nGraph walk aborted: ${e?.message ?? e}`); process.exit(2); });
