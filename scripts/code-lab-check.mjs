#!/usr/bin/env node
// THE CODE LAB, DRIVEN AS A LEARNER DRIVES IT.
//
// The authored lesson gate can prove that a lesson HAS a CodeExercise. It cannot
// prove that the sandboxed iframe loads, that a real keyboard edit reaches the
// textarea, that the starter program fails its check, or that a repaired program
// passes. Those are the claims this walk makes, on the real `/learn` route.
//
// It intentionally does not treat a passed stdout check as a mark: the lesson
// says on screen that the checks are practice feedback. This walk tests that
// disclosure exists as well as the run.
//
// Usage: start the dev server on 4173 with a scratch OPENMIND_DATA_DIR, then
//   node scripts/code-lab-check.mjs
// Optional: CODE_LAB_BASE, CHROME_BIN.
import { pageFor, launchChrome, sleep } from "./browser.mjs";

const BASE = process.env.CODE_LAB_BASE ?? "http://127.0.0.1:4173";
let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`   ✓ ${msg}`); }
  else { failed++; console.log(`   ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

async function main() {
  const { send, close } = await launchChrome();
  const base = pageFor(send);
  const p = { ...base, pick: base.pickOption };

  const labelWith = (text) => `[...document.querySelectorAll("main label")].find(l => {
    const span = l.querySelector(":scope > span");
    const own = span ? span.textContent.trim() : (l.textContent || "").trim();
    return own === ${JSON.stringify(text)};
  })`;
  const selectUnder = (text) => `${labelWith(text)}?.querySelector("select")`;
  const buttonMatching = (re) => `[...document.querySelectorAll("main button")].find(b => ${re}.test(b.textContent || ""))`;
  const lab = `document.querySelector("[data-code-lab]")`;
  const runButton = `${lab} && [...${lab}.querySelectorAll("button")].find(b => /^Run program$/.test((b.textContent || "").trim()))`;
  const resetButton = `${lab} && [...${lab}.querySelectorAll("button")].find(b => /^Reset$/.test((b.textContent || "").trim()))`;
  const output = `${lab}?.querySelector("pre")?.textContent || ""`;
  const labText = `${lab}?.innerText || ""`;

  try {
    section("A fresh learner enrols so the lesson route is reachable");
    await p.goto(`${BASE}/onboarding`);
    await p.evaluate(`localStorage.clear(); sessionStorage.clear(); return true;`);
    await p.goto(`${BASE}/onboarding`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the wizard", 90000);
    await p.waitFor(`return document.querySelectorAll("main label").length >= 3;`, "the account choices", 30000);
    const labels = await p.evaluate(`return [...document.querySelectorAll("main label")].map(l => (l.textContent || "").trim()).filter(Boolean).slice(0, 8);`);
    const guest = labels.find((text) => /^Continue without an account$/i.test(text));
    if (!guest) throw new Error(`the account step was not in English (labels: ${labels.join(" | ")})`);
    await p.clickExpr(labelWith(guest), "the guest account choice");
    await p.clickExpr(buttonMatching("/(Next|Start learning)/"), "Next on the account step");
    await p.waitFor(`return !!${selectUnder("Where you are")};`, "the about step");
    await p.typeInto(`document.querySelector("main input[type=text]")`, "code_lab_check", "the display-name field");
    await p.pick(selectUnder("Where you are"), "GB", "country");
    await p.clickExpr(buttonMatching("/(Next|Start learning)/"), "Next on the about step");
    await p.waitFor(`return !!${labelWith("Mathematics")};`, "the subject step");
    await p.clickExpr(`${labelWith("Mathematics")}?.querySelector("input")`, "the Mathematics subject");
    await p.clickExpr(buttonMatching("/(Next|Start learning)/"), "Next on the subject step");
    await p.waitFor(`return location.pathname === "/curriculum";`, "the course screen", 30000);
    await p.waitFor(`return !!document.querySelector("#curr-spec");`, "the qualification select");
    const specs = await p.evaluate(`return [...document.querySelector("#curr-spec").options].map(o => ({ value: o.value, text: (o.textContent || "").trim() }));`);
    const spec = specs.find((o) => /gcse/i.test(o.value) && /mathematics/i.test(o.text))?.value ?? specs.find((o) => o.value)?.value;
    await p.pick(`document.querySelector("#curr-spec")`, spec, "the maths qualification");
    await p.waitFor(`return !!document.querySelector("#curr-level");`, "the tier select");
    const tiers = await p.evaluate(`return [...document.querySelector("#curr-level").options].map(o => o.value).filter(Boolean);`);
    await p.pick(`document.querySelector("#curr-level")`, tiers.includes("foundation") ? "foundation" : tiers[0], "the maths tier");
    await p.waitFor(`return [...(${selectUnder("Your grade level")}?.options ?? [])].some(o => o.value === "Year 10");`, "the year groups");
    await p.pick(selectUnder("Your grade level"), "Year 10", "year group");
    await p.clickExpr(buttonMatching("/Save my course/"), "Save my course");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Saved/i.test(b.textContent || ""));`, "the save to confirm", 15000);
    check(true, "a learner exists and can reach the Computing lesson");

    section("The lists lesson renders its code lab");
    await p.goto(`${BASE}/learn/computing/lists-arrays`);
    await p.waitFor(`return !!document.querySelector("main .authored-lesson");`, "the lists authored lesson", 30000);
    await p.waitFor(`return !!${lab};`, "the code lab", 30000);
    check(await p.evaluate(`return !!${lab}.querySelector("#code-lab-editor");`), "the lab has a labelled code editor");
    check(await p.evaluate(`return !!${lab}.querySelector("iframe[sandbox]");`), "the runner is an iframe with a sandbox attribute");
    check(await p.evaluate(`return ${lab}.querySelector("iframe")?.getAttribute("sandbox") === "allow-scripts";`), "the runner has allow-scripts and deliberately not allow-same-origin");
    check(await p.evaluate(`return !!${lab}.querySelector("[role=status]");`), "the lab exposes a live status region");

    section("The sandboxed Python runtime becomes ready");
    await p.waitFor(`return !/Loading the sandboxed Python runtime/.test(${labText});`, "the Python runtime to load from its CDN", 60000);
    const readyText = await p.evaluate(`return ${labText};`);
    const runtimeReady = /Ready|Python/.test(readyText) && !/Loading the sandboxed Python runtime/.test(readyText);
    check(runtimeReady, "the lab leaves its loading state rather than silently hanging");

    section("A real keyboard edit reaches the editor");
    await p.clickExpr(`document.querySelector("#code-lab-editor")`, "the code editor");
    const focused = await p.evaluate(`return document.activeElement?.id === "code-lab-editor";`);
    check(focused, "clicking the editor gives it keyboard focus");
    await p.typeInto(`document.querySelector("#code-lab-editor")`, 'print("keyboard")', "the code editor");
    const typed = await p.evaluate(`return document.querySelector("#code-lab-editor")?.value ?? null;`);
    check(typed === 'print("keyboard")', `the editor accepts real key events (got ${JSON.stringify(typed)})`);
    await p.clickExpr(resetButton, "Reset");
    await p.waitFor(`return (document.querySelector("#code-lab-editor")?.value || "").includes("def count_above");`, "the starter program to return", 10000);
    const reset = await p.evaluate(`return document.querySelector("#code-lab-editor")?.value ?? null;`);
    check(typeof reset === "string" && reset.includes("def count_above"), "Reset restores the starter program");

    section("The starter program runs, is observed, and fails its check");
    await p.clickExpr(runButton, "Run program");
    await p.waitFor(`return /Not there yet|All checks passed/.test(${labText});`, "the first run's feedback", 30000);
    const firstText = await p.evaluate(`return ${labText};`);
    const firstOutput = await p.evaluate(`return ${output};`);
    check(/Not there yet/.test(firstText), "the starter is reported as not meeting the check");
    check(firstOutput.trim() === "3\nNone", `the observed output keeps the two print lines apart (got ${JSON.stringify(firstOutput.trim())})`);

    section("A repaired program passes without sending code to the server");
    const repaired = `def count_above(values, threshold):
    count = 0
    for value in values:
        if value > threshold:
            count = count + 1
    return count

print(count_above([12, 18, 9, 25, 21], 15))`;
    await p.evaluate(`
      const el = document.querySelector("#code-lab-editor");
      const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      set.call(el, ${JSON.stringify(repaired)});
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return el.value;
    `);
    await p.clickExpr(runButton, "Run program after the repair");
    await p.waitFor(`return /All checks passed|Not there yet/.test(${labText});`, "the repaired run's feedback", 30000);
    const repairedText = await p.evaluate(`return ${labText};`);
    const repairedOutput = await p.evaluate(`return ${output};`);
    check(/All checks passed/.test(repairedText), "the repaired count_above exercise passes the authored check");
    check(/^3$/.test(repairedOutput.trim()), `the repaired output is 3, with no stray None (got ${JSON.stringify(repairedOutput.trim())})`);
    check(/not a recorded mark|practice feedback/.test(repairedText), "the lab tells the learner the check is practice feedback, not a recorded mark");
    check(/No code is sent to OpenMind's server/.test(repairedText), "the lab discloses that code stays in the sandboxed browser iframe");

    section("The page holds the narrow screens");
    for (const [width, height, label] of [[1280, 900, "desktop"], [768, 1024, "tablet"], [375, 667, "375-px phone"], [320, 640, "320-px phone"]]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      await sleep(180);
      const size = await p.evaluate(`return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth };`);
      check(size.scroll <= size.client + 1, `the code-lab page fits a ${label} (${size.scroll} vs ${size.client})`);
    }
  } finally {
    try { await close(); } catch { /* already gone */ }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error?.stack ?? String(error));
  process.exit(2);
});
