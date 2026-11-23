#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE FOUR NEW ASSESSMENT FORMATS, DRIVEN AS A LEARNER DRIVES THEM.
//
// The marker gate proves the pure functions. This walk proves the actual page:
// a real browser fills the gaps, chooses matches, moves an ordering with Up/Down,
// labels diagram positions, and submits a six-mark structured calculation. It
// asserts the visible score, the per-point criteria, partial credit, the 320-px
// layout, and that the submissions reach the evidence ledger.
//
// It deliberately does not treat rendered controls as coverage. Each format is
// submitted and the returned score is read from the DOM.
//
// Usage: start dev on 4173, then `node scripts/lesson-formats-browser-check.mjs`.
// ─────────────────────────────────────────────────────────────────────────────
import { launchChrome, pageFor, sleep } from "./browser.mjs";
import fs from "node:fs";

const BASE = process.env.LESSON_FORMATS_BASE ?? "http://127.0.0.1:4173";
let passed = 0;
let failed = 0;
const check = (condition, message) => {
  if (condition) { passed += 1; console.log(`   ✓ ${message}`); }
  else { failed += 1; console.log(`   ✗ FAIL: ${message}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

async function main() {
  const { send, close } = await launchChrome({ port: 9791 });
  const base = pageFor(send);
  const p = { ...base, pick: base.pickOption };
  const labelWith = (text) => `[...document.querySelectorAll("main label")].find(l => { const span = l.querySelector(":scope > span"); const own = span ? span.textContent.trim() : (l.textContent || "").trim(); return own === ${JSON.stringify(text)}; })`;
  const selectUnder = (text) => `${labelWith(text)}?.querySelector("select")`;
  const buttonMatching = (re) => `[...document.querySelectorAll("main button")].find(b => ${re}.test(b.textContent || ""))`;

  try {
    section("A fresh learner enrols");
    await p.goto(`${BASE}/onboarding`);
    await p.evaluate(`localStorage.clear(); sessionStorage.clear(); return true;`);
    await p.goto(`${BASE}/onboarding`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the wizard", 90000);
    await p.waitFor(`return document.querySelectorAll("main label").length >= 3;`, "the account choices", 30000);
    await p.clickExpr(labelWith("Continue without an account"), "the guest choice");
    await p.clickExpr(buttonMatching("/(Next|Start learning)/"), "Next on the account step");
    await p.waitFor(`return !!${selectUnder("Where you are")};`, "the about step");
    await p.typeInto(`document.querySelector("main input[type=text]")`, "formats_check", "the display-name field");
    await p.pick(selectUnder("Where you are"), "GB", "country");
    await p.clickExpr(buttonMatching("/(Next|Start learning)/"), "Next on the about step");
    await p.waitFor(`return !!${labelWith("Mathematics")};`, "the subject step");
    await p.clickExpr(`${labelWith("Mathematics")}?.querySelector("input")`, "Mathematics");
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
    await p.pick(selectUnder("Your grade level"), "Year 10", "the year group");
    await p.clickExpr(buttonMatching("/Save my course/"), "Save my course");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Saved/i.test(b.textContent || ""));`, "the saved course", 15000);
    check(true, "a learner exists and can reach the authored lessons");

    section("Photosynthesis: five gaps and five independently marked matches");
    await p.goto(`${BASE}/learn/biology/photosynthesis`);
    await p.waitFor(`return !!document.querySelector('[data-gap="g1"]');`, "the photosynthesis gap fill", 30000);
    const gapValues = ["Carbon Dioxide", "H2O", "chloroplasts", "sugar", "O2"];
    for (const [index, value] of gapValues.entries()) {
      await p.typeInto(`document.querySelector('[data-gap="g${index + 1}"]')`, value, `gap ${index + 1}`);
    }
    const gapScope = `document.querySelector('[data-interaction-item="a3"]')`;
    await p.clickExpr(`document.querySelector('[data-interaction-item="a3"] [data-interaction-submit]')`, "the gap-fill submit");
    await p.waitFor(`return /5 \\/ 5/.test(${gapScope}?.querySelector('[data-interaction-verdict]')?.innerText || "");`, "the gap-fill verdict", 15000);
    const gapText = await p.evaluate(`return ${gapScope}?.querySelector('[data-interaction-verdict]')?.innerText || "";`);
    check(/5 \/ 5/.test(gapText) && /full marks/.test(gapText), "accepted scientific variants and capitals earn 5/5 visibly");
    check(/recorded on this concept as an independent answer/.test(gapText), "the page says the gap answers were recorded as evidence");

    const matchPairs = [["m1", "r1"], ["m2", "r2"], ["m3", "r3"], ["m4", "r4"], ["m5", "r5"]];
    for (const [left, right] of matchPairs) {
      await p.pick(`document.querySelector('[data-match="${left}"]')`, right, `the ${left} match`);
    }
    const matchScope = `document.querySelector('[data-interaction-item="a4"]')`;
    await p.clickExpr(`document.querySelector('[data-interaction-item="a4"] [data-interaction-submit]')`, "the matching submit");
    await p.waitFor(`return /5 \\/ 5/.test(${matchScope}?.querySelector('[data-interaction-verdict]')?.innerText || "");`, "the matching verdict", 15000);
    const matchText = await p.evaluate(`return ${matchScope}?.querySelector('[data-interaction-verdict]')?.innerText || "";`);
    check(/5 \/ 5/.test(matchText), "all five matches earn 5/5");

    section("Fractions: diagram labelling with partial credit");
    await p.goto(`${BASE}/learn/maths/fractions`);
    await p.waitFor(`return !!document.querySelector('[data-diagram="a3"]');`, "the fraction diagram", 30000);
    const targets = ["t1", "t1", "t3", ""];
    for (const [index, target] of targets.entries()) {
      await p.pick(`document.querySelector('[data-diagram-label="l${index + 1}"]')`, target, `label ${index + 1}`);
    }
    const fractionScope = `document.querySelector('[data-interaction-item="a3"]')`;
    await p.clickExpr(`document.querySelector('[data-interaction-item="a3"] [data-interaction-submit]')`, "the diagram submit");
    await p.waitFor(`return /2 \\/ 4/.test(${fractionScope}?.querySelector('[data-interaction-verdict]')?.innerText || "");`, "the partial diagram verdict", 15000);
    const partialDiagram = await p.evaluate(`return ${fractionScope}?.querySelector('[data-interaction-verdict]')?.innerText || "";`);
    check(/2 \/ 4/.test(partialDiagram) && /partial credit recorded/.test(partialDiagram), "two correct labels and one blank keep 2/4 visibly");

    for (const [index, target] of ["t1", "t2", "t3", "t4"].entries()) {
      await p.pick(`document.querySelector('[data-diagram-label="l${index + 1}"]')`, target, `label ${index + 1} corrected`);
    }
    await p.clickExpr(`document.querySelector('[data-interaction-item="a3"] [data-interaction-submit]')`, "the corrected diagram submit");
    await p.waitFor(`return /4 \\/ 4/.test(${fractionScope}?.querySelector('[data-interaction-verdict]')?.innerText || "");`, "the full diagram verdict", 15000);
    check(true, "all four fraction labels earn 4/4 after correction");

    section("What is code: ordering by position");
    await p.goto(`${BASE}/learn/computing/what-is-code`);
    await p.waitFor(`return !!document.querySelector('[data-order-id="s1"]');`, "the ordering exercise", 30000);
    const movePrintLater = `[...document.querySelectorAll("main button")].find(x => x.getAttribute("aria-label") === "Move Print the running total. later")`;
    await p.clickExpr(movePrintLater, "move print later");
    await sleep(120);
    await p.clickExpr(movePrintLater, "move print later again");
    const orderScope = `document.querySelector('[data-interaction-item="a3"]')`;
    await p.clickExpr(`document.querySelector('[data-interaction-item="a3"] [data-interaction-submit]')`, "the ordering submit");
    await p.waitFor(`return /4 \\/ 4/.test(${orderScope}?.querySelector('[data-interaction-verdict]')?.innerText || "");`, "the ordering verdict", 15000);
    const orderText = await p.evaluate(`return [...document.querySelectorAll('[data-order-id]')].map(el => el.getAttribute('data-order-id')).join(',');`);
    check(orderText === "s1,s3,s4,s2", "Up/Down controls produce the authored sequence s1,s3,s4,s2");
    check(/4 \/ 4/.test(await p.evaluate(`return ${orderScope}?.querySelector('[data-interaction-verdict]')?.innerText || "";`)), "the ordered sequence earns 4/4");

    const codeMatches = [["c1", "b1"], ["c2", "b2"], ["c3", "b3"], ["c4", "b4"], ["c5", "b5"]];
    for (const [left, right] of codeMatches) {
      await p.pick(`document.querySelector('[data-match="${left}"]')`, right, `the ${left} match`);
    }
    const codeMatchScope = `document.querySelector('[data-interaction-item="a4"]')`;
    await p.clickExpr(`document.querySelector('[data-interaction-item="a4"] [data-interaction-submit]')`, "the code matching submit");
    await p.waitFor(`return /5 \\/ 5/.test(${codeMatchScope}?.querySelector('[data-interaction-verdict]')?.innerText || "");`, "the code matching verdict", 15000);
    check(true, "five code concepts match their behaviours for 5/5");

    section("Electricity: six-mark structured method and answer");
    await p.goto(`${BASE}/learn/physics/electricity-circuits`);
    await p.waitFor(`return !!document.querySelector('[data-structured-answer="a"]');`, "the structured circuit item", 30000);
    check(await p.evaluate(`return document.querySelectorAll('[data-structured-answer]').length === 3 && document.querySelectorAll('[data-structured-working]').length === 3;`),
      "the item renders three answer boxes and three method boxes");
    for (const [part, answer] of [["a", "3 A"], ["b", "2 V"], ["c", "60 C"]]) {
      await p.typeInto(`document.querySelector('[data-structured-answer="${part}"]')`, answer, `part ${part} answer`);
    }
    for (const [part, working] of [["a", "12 / 4"], ["b", "0.50 x 4"], ["c", "3 x 20"]]) {
      await p.typeInto(`document.querySelector('[data-structured-working="${part}"]')`, working, `part ${part} working`);
    }
    await p.clickExpr(`document.querySelector('[data-structured-submit]')`, "the structured submit");
    await p.waitFor(`return /6 \\/ 6/.test(document.querySelector('[data-structured-verdict]')?.innerText || "");`, "the structured verdict", 15000);
    const structuredText = await p.evaluate(`return document.querySelector('[data-structured-verdict]')?.innerText || "";`);
    check(/6 \/ 6/.test(structuredText) && /full marks/.test(structuredText), "three method and three answer marks earn 6/6");
    check((structuredText.match(/✓/g) || []).length >= 6, "every criterion is traceable in the visible mark scheme");

    section("The four pages hold a phone screen");
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 640, deviceScaleFactor: 1, mobile: false });
    for (const [subject, concept] of [["maths", "fractions"], ["biology", "photosynthesis"], ["computing", "what-is-code"], ["physics", "electricity-circuits"]]) {
      await p.goto(`${BASE}/learn/${subject}/${concept}`);
      await p.waitFor(`return !!document.querySelector("main .authored-lesson");`, `${concept} at 320`, 30000);
      await sleep(300);
      const size = await p.evaluate(`return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth };`);
      check(size.scroll <= size.client + 1, `${concept} fits 320 px (${size.scroll} vs ${size.client})`);
    }

    section("The responses reach the evidence ledger");
    const identity = await p.evaluate(`return { id: localStorage.getItem("openmind:profileId"), secret: localStorage.getItem("openmind:profileSecret") };`);
    check(typeof identity?.id === "string" && typeof identity?.secret === "string", "the browser has a learner capability");
    const ledger = await (await fetch(`${BASE}/api/evidence?id=${encodeURIComponent(identity.id)}&secret=${encodeURIComponent(identity.secret)}`)).json();
    const events = (ledger.events ?? []).filter((event) => event.type === "answer_submitted");
    check(events.length >= 6, `the ledger holds the six browser submissions (${events.length})`);
    check(events.some((event) => event.score?.awarded === 2 && event.score?.max === 4), "the 2/4 partial diagram result survives into evidence");
    check(events.every((event) => event.provenance === "server"), "every browser result is recorded as server-observed");
  } finally {
    try { await close(); } catch { /* already gone */ }
  }

  fs.mkdirSync("audit", { recursive: true });
  fs.writeFileSync("audit/lesson-formats-browser.json", `${JSON.stringify({
    generatedBy: "scripts/lesson-formats-browser-check.mjs",
    at: new Date().toISOString(),
    passed,
    failed,
    lessons: ["fractions", "photosynthesis", "what-is-code", "electricity-circuits"],
    formats: ["gap-fill", "matching", "ordering", "diagram", "structured"],
    widths: [320],
    note: "Browser-driven submissions, not render-only. The evidence ledger is read back after submission.",
  }, null, 2)}\n`);
  console.log(`\nlesson formats browser: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error?.stack ?? String(error));
  process.exit(2);
});
