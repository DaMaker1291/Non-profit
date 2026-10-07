// ─────────────────────────────────────────────────────────────────────────────
// THE BROWSER PLUMBING, SHARED BY EVERY WALK THAT DRIVES A REAL PAGE.
//
// WHY IT IS NOT INSIDE EACH WALK. OpenMind has two products to walk: the Next
// application (scripts/ui-walk.mjs) and the published static build
// (scripts/static-page-walk.mjs), which has no server at all and is therefore
// the one a learner actually meets on GitHub Pages. Two walks need the same
// three things — a Chrome with a debug port, a CDP client, and an element
// addresser that clicks where a person would — and two copies of that is two
// chances for one walk to be driving a subtly different browser than the other.
//
// WHY REAL EVENTS AND NOT `el.click()`. React rejects a synthetic `change`
// event: dispatch one and a native `<select>` shows the new value while the
// component's state stays put, so the screen does not move. The addresses below
// therefore resolve to a POINT and the click is dispatched as browser INPUT
// (Input.dispatchMouseEvent / dispatchKeyEvent), so the browser's own event
// pipeline fires the handlers the product is listening for. A pin that cannot
// touch the control it guards is not a gate.
//
// No dependency is added: Chrome and Node's global WebSocket are enough.
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** Is there a browser to drive at all? A machine without one must be able to
 *  say so instead of failing a product check it never ran. */
export function chromeAvailable() {
  const bin = process.env.CHROME_BIN ?? DEFAULT_CHROME;
  if (existsSync(bin)) return true;
  return ["google-chrome", "chromium", "chromium-browser"].some((name) => {
    const found = spawnSync(process.platform === "win32" ? "where" : "which", [name], { stdio: "ignore" });
    return found.status === 0;
  });
}

/** A minimal CDP client: one socket, one request map, promises out. */
export function client(ws) {
  let seq = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (!m.id || !pending.has(m.id)) return;
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) reject(new Error(`${m.error.message ?? "cdp error"}`));
    else resolve(m.result);
  });
  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
}

/**
 * Launch headless Chrome and attach to its first page target.
 *
 * The debug port is chosen by the caller (walks randomise it) so two walks can
 * run beside each other, and the profile directory is a fresh temp dir so a
 * walk never inherits a returned learner's localStorage.
 */
export async function launchChrome(opts = {}) {
  const chrome = opts.chrome ?? process.env.CHROME_BIN ?? DEFAULT_CHROME;
  const port = opts.port ?? 9333 + Math.floor(Math.random() * 400);
  const width = opts.width ?? 1280;
  const height = opts.height ?? 900;
  const dir = mkdtempSync(path.join(tmpdir(), "openmind-walk-"));
  let stderr = "";
  const proc = spawn(chrome, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu",
    "--disable-dev-shm-usage", "--no-sandbox", `--window-size=${width},${height}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  proc.stderr.on("data", (d) => { stderr += d.toString(); });

  const deadline = Date.now() + 20000;
  let target = null;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (target) break;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  if (!target) {
    proc.kill("SIGKILL");
    throw new Error(`Chrome did not expose a page target on :${port}.\n${stderr.slice(-600)}`);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("could not open the CDP socket")), { once: true });
  });
  const send = client(ws);
  await send("Page.enable");
  await send("Runtime.enable");
  const close = async () => {
    try { await send("Browser.close"); } catch { /* already gone */ }
    try { ws.close(); } catch { /* already closed */ }
    proc.kill("SIGKILL");
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  };
  return { send, close, port };
}

/**
 * The generic page helpers: evaluate, navigate, wait, and address/click/type
 * with real input events. Everything app-specific (which label, which button,
 * which select) belongs to the walk that knows the product.
 */
export function pageFor(send) {
  const evaluate = async (body) => {
    const r = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => { ${body} })())`,
      awaitPromise: true, returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "evaluate threw");
    return r.result.value === undefined ? null : JSON.parse(r.result.value);
  };

  const goto = async (url) => {
    await send("Page.navigate", { url });
    await waitFor(`return document.readyState === "complete";`, `a completed load of ${url}`);
  };

  const waitFor = async (body, what, timeout = 20000) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try { if (await evaluate(body)) return true; } catch { /* mid-navigation */ }
      await sleep(200);
    }
    // A gate that says only "timed out" wastes the next run. Show what the page
    // was actually displaying, which is enough to tell a wrong selector from a
    // step that never advanced.
    let where = "(the page could not be read)";
    try {
      where = await evaluate(`const m = document.querySelector("main"); return { heading: m?.querySelector("h1")?.textContent?.trim() ?? null, step: (m?.innerText.match(/Step \\d+\\s*\\/\\s*\\d+/) || [null])[0], text: (m?.innerText || "").replace(/\\n+/g, " · ").slice(0, 220) };`);
    } catch { /* keep the generic sentence */ }
    throw new Error(`timed out waiting for ${what} — on screen: ${JSON.stringify(where)}`);
  };

  /**
   * Where to click an element — SCROLLED INTO VIEW first.
   *
   * `getBoundingClientRect()` is viewport-relative, so a control below the fold
   * returns a y past the window and a mouse event at that coordinate hits
   * nothing at all. The tall steps (two subjects, each with its own selects) put
   * `Next` below the fold, which is exactly how a real click silently did
   * nothing while the button was enabled. A user scrolls; so does this.
   */
  const rectOf = (expr) => evaluateAsync(`
    (async () => {
      const el = ${expr};
      if (!el) return null;
      // INSTANT, and then SETTLED — because the page scrolls smoothly.
      //
      // The published stylesheet sets html { scroll-behavior: smooth }, so a
      // plain scrollIntoView ANIMATES: the rect read on the very next line is
      // still the PRE-scroll position, so the mouse event is aimed at coordinates
      // the content has already left and lands on whatever has moved under them.
      // That is not theoretical — it stalled the live walk in 2 of 3 runs: the
      // "Continue learning" link on the diagnostic report was present, hit-tested
      // clean, clicked with real input, and navigated nowhere, so the walk waited
      // 20s for Home with the report still on screen. The scroll option's own
      // behaviour wins over the CSS property, so INSTANT removes the animation;
      // the settle loop below then covers everything ELSE that moves a control
      // (a CSS transition, a late render, a font swap) by requiring two
      // consecutive frames to agree before the coordinates are handed out.
      el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      const read = () => el.getBoundingClientRect();
      let r = read();
      for (let i = 0; i < 20; i++) {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
        const now = read();
        const same = Math.abs(now.x - r.x) < 0.5 && Math.abs(now.y - r.y) < 0.5 && Math.abs(now.width - r.width) < 0.5;
        r = now;
        if (same) break;
      }
      const vh = window.innerHeight || 900;
      if (r.top < 8 || r.bottom > vh - 8) {
        window.scrollBy({ top: r.top - (vh - r.height) / 2, behavior: "instant" });
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
        r = read();
      }
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, inView: r.top >= 0 && r.bottom <= (window.innerHeight || 900) && r.left >= 0 && r.right <= (window.innerWidth || 1280), text: (el.textContent || "").trim().slice(0, 40) };
    })()
  `);

  /**
   * A real, trusted mouse click at the element's centre — not `el.click()`.
   *
   * The point is verified IMMEDIATELY BEFORE the event is dispatched, because a
   * real click goes to a POINT and anything lying over it takes the event. Where
   * the fixture-level `clickLink` does this for anchors, this covers every other
   * control (buttons, selects, fields) and turns the worst failure mode into a
   * diagnosis: previously a click that landed on something else did nothing at
   * all, and the run reported a timeout on whatever it was waiting for. A pin
   * that cannot touch the control it guards is not a gate.
   */
  const clickExpr = async (expr, what) => {
    const p = await rectOf(expr);
    if (!p || !p.w || !p.h) throw new Error(`nothing clickable for ${what}`);
    if (!p.inView) throw new Error(`${what} could not be scrolled into the viewport (x=${Math.round(p.x)}, y=${Math.round(p.y)})`);
    const at = await evaluate(`const el = ${expr};
      const hit = document.elementFromPoint(${p.x}, ${p.y});
      return hit ? { tag: hit.tagName.toLowerCase(), cls: String(hit.className || "").slice(0, 40), text: (hit.textContent || "").trim().slice(0, 40), mine: hit === el || (!!el && el.contains(hit)) } : null;`);
    if (!at?.mine) {
      throw new Error(`${what} is unreachable: the click point (${Math.round(p.x)}, ${Math.round(p.y)}) is over <${at?.tag ?? "nothing"} class="${at?.cls ?? ""}"> ("${at?.text ?? ""}")`);
    }
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
    await sleep(150);
    return p.text;
  };

  /** One real key press (with the character, so the page sees typed input). */
  const press = async (key) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, text: key, unmodifiedText: key });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key });
  };

  /** Real typing into a field: focus with a click, then per-character key events. */
  const typeInto = async (expr, text, what) => {
    await clickExpr(expr, what);
    for (const ch of text) { await press(ch); await sleep(25); }
  };

  /**
   * Choose an option in a native select USING REAL KEYS.
   *
   * Chromium's own behaviour: a focused `<select>` responds to a typed character
   * by jumping to the matching option, and repeating the same character cycles
   * through the options that share it. So this reads the options out of the DOM,
   * presses the SHORTEST UNIQUE PREFIX of the target's label, and falls back to
   * cycling — which is what a person does. Its last act on failure is to say WHY
   * (not focused any more? no option starts with that character?) rather than
   * just "timed out".
   *
   * Shared because both products have native selects and neither may be driven
   * by a synthetic `change` event: React rejects it, and a plain listener only
   * accepts it because nothing is checking. Real keys are the honest instrument.
   */
  const pickOption = async (selectExpr, wanted, what, settle) => {
    const sel = `(() => { const s = ${selectExpr}; if (!s) return null; return { value: s.value, options: [...s.options].map(o => ({ value: o.value, text: (o.textContent || "").trim() })) }; })()`;
    const info = await evaluate(`return ${sel};`);
    if (!info) throw new Error(`the ${what} select is not on the page`);
    const target = info.options.find((o) => o.value === wanted);
    if (!target) throw new Error(`no option "${wanted}" in the ${what} select: ${info.options.map((o) => o.value || "(empty)").join(", ")}`);
    if (info.value === wanted) return target.text;
    // Blur first: Chromium keeps a select's typeahead SEARCH STRING alive while
    // the element stays focused, so typing "e" straight after a pick that ended
    // in "fr" extends that search to "fre" — never a match, and the control looks
    // unfocusable while it is working perfectly. Dropping focus resets the string.
    await evaluate(`const el = ${selectExpr}; if (el) { el.blur(); el.focus(); } return true;`);
    await sleep(150);
    const read = async () => (settle
      ? await evaluate(`return !!(${settle});`)
      : (await evaluate(`const el = ${selectExpr}; return el ? el.value : null;`)) === wanted);

    // TYPE THE SHORTEST UNIQUE PREFIX of the option's label. One character is
    // rarely unique — "English" and "Español" both start with E — and cycling on
    // a shared character lands on whichever match follows the current one, which
    // is how switching the interface back to English stalled on French. A prefix
    // no other option shares selects the choice outright.
    const labels = info.options.map((o) => ({ value: o.value, text: (o.text || "").trim().toLowerCase() }));
    const own = (target.text || "").trim().toLowerCase();
    let prefix = own.slice(0, 1);
    for (let n = 1; n <= own.length; n++) {
      const cand = own.slice(0, n);
      prefix = cand;
      if (!labels.some((o) => o.value !== wanted && o.text.startsWith(cand))) break;
    }
    // A space would open the dropdown rather than type into it, so labels needing
    // one ("United Kingdom") keep the cycling behaviour below.
    if (prefix && !prefix.includes(" ")) {
      for (const ch of prefix) { await press(ch); await sleep(60); }
      await sleep(150);
      if (await read()) return target.text;
    }
    const first = own.slice(0, 1) || "a";
    await sleep(1300); // let any half-typed search string expire before cycling
    for (let i = 0; i < info.options.length + 2; i++) {
      await press(first);
      await sleep(90);
      if (await read()) return target.text;
    }
    // Say WHY it refused: a select that keeps its old value after a real key
    // press is either not focused any more, or has no option whose label starts
    // with the character typed. Both are visible in one line.
    const diag = await evaluate(`const s = ${selectExpr}; return { focused: document.activeElement === s, value: s?.value ?? null, labels: [...(s?.options ?? [])].map(o => (o.textContent || "").trim()).slice(0, 8) };`);
    throw new Error(`could not choose "${wanted}" in the ${what} select — it stayed on "${info.value}" (focused=${diag.focused}, labels: ${diag.labels.join(" | ")})`);
  };

  /**
   * Evaluate an expression that RETURNS A PROMISE and hand back what it resolves
   * to.
   *
   * `evaluate` above stringifies its result inside a synchronous wrapper, so a
   * promise reaching it is stringified AS a promise (`"[object Object]"`) rather
   * than awaited — which reads as "the page returned something odd" instead of
   * "the harness could not carry the answer". A page has async work (an
   * operation, a fetch, a timer), so this exists for it.
   */
  const evaluateAsync = async (expr) => {
    const r = await send("Runtime.evaluate", {
      expression: `(async () => { const v = await (${expr}); return JSON.stringify(v === undefined ? null : v); })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "the expression threw");
    return r.result.value === undefined ? null : JSON.parse(r.result.value);
  };

  const valueOf = (expr) => evaluate(`return ${expr}?.value ?? null;`);
  const text = () => evaluate(`return (document.querySelector("main")?.innerText || "").replace(/\\n+/g, " · ").slice(0, 400);`);
  /** Everything on screen, not the first 400 characters of it — a check that
   *  scans for a raw key or an invented number must not miss it for being far
   *  down the page. */
  const allText = () => evaluate(`return (document.querySelector("main")?.innerText || "").replace(/\\n+/g, " · ");`);

  return { evaluate, evaluateAsync, goto, waitFor, rectOf, clickExpr, press, typeInto, pickOption, valueOf, text, allText };
}
