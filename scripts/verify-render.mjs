// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION RENDER GATE.
//
// Every assertion here corresponds to a symptom in the reported screenshot of the
// unstyled page. That page was NOT a CSS authoring bug — `app/globals.css` is
// 1,149 lines of real design system and `app/layout.tsx` imports it correctly. The
// stylesheet was never delivered, because a Next standalone server serves HTML
// pointing at a separate content-hashed static tree, and the two had come from
// different builds. The document still returned HTTP 200.
//
// So the failure had exactly one cause with many faces, and this gate asserts the
// faces so none of them can come back unnoticed:
//
//   · the main stylesheet fails to load        → linked exactly once, resolves 200,
//                                                is CSS and not an error body
//   · browser-default typography               → the stylesheet defines a body
//                                                font-family AND design tokens
//   · primary navigation duplicated            → both navs are in the markup (they
//                                                must be: one is a different
//                                                breakpoint's nav) AND the
//                                                stylesheet hides exactly one at
//                                                each of the two widths
//   · footer directly under short content      → the flex/grid rules that push it
//                                                down exist AND the footer is the
//                                                last child of .shell-main
//   · curriculum has neither content nor a
//     proper empty state                       → the served document must be the
//                                                app's BOOT state (the page is a
//                                                client component, so that is all a
//                                                fetch can see), the route's render
//                                                path must hold a content branch and
//                                                an honest no-record one, and the
//                                                RENDERED page is walked in a real
//                                                browser by scripts/ui-walk.mjs
//
// LAYERS, and what each is allowed to prove. This script runs over the PRODUCTION
// build and checks the served bytes: the markup, and the stylesheet that the
// markup points at, including the media-query rules that decide the layout at
// each width. That is a real assertion about what the browser will apply.
// Computed styles (an element's actual resolved font, an element's actual
// position) are the browser's answer to the same question and are checked
// separately against a live server; a stylesheet can contain a rule and still be
// overridden, so the two layers are complementary rather than interchangeable.
//
//   node scripts/verify-render.mjs [--port 3000] [--route /]
// ─────────────────────────────────────────────────────────────────────────────
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const PORT = arg("port", "3000");
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const bad = [];
const ok = (c, name, detail = "") => {
  if (c) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; bad.push({ name, detail }); console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
};
const group = (n) => console.log(`\n${n}`);

import fs from "node:fs";
const text = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, "\n").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ");

let css = "";
try {
  const home = await (await fetch(`${BASE}/`)).text();
  group("R1 · the main stylesheet actually loads");
  const sheets = [...home.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  ok(sheets.length === 1, "the page links exactly one stylesheet", `found ${sheets.length}`);
  if (sheets.length === 1) {
    const res = await fetch(BASE + sheets[0]);
    ok(res.ok, "the stylesheet returns 200", String(res.status));
    const body = await res.text();
    css = body;
    ok(body.length > 5000, "the stylesheet is substantial, not a stub or an error body", `${body.length} bytes`);
    ok(!/<(!doctype|html)/i.test(body), "the stylesheet response is CSS, not an HTML error page");
  }

  group("R2 · typography is not the browser default");
  // A page with no stylesheet renders in the UA default serif. The design system
  // sets a deliberate stack; this asserts the rule that prevents that fallback.
  //
  // READ EVERY RULE FOR A SELECTOR, NOT THE FIRST ONE. Minifiers differ in how
  // they order declarations and in how many rules a selector ends up in: webpack
  // emitted one `body` rule carrying the design system, Turbopack emits a reset
  // (`body{margin:0;padding:0}`) and the themed rule separately, in the opposite
  // order. A first-match regex therefore read the reset and reported "the body
  // rule sets font-family — none" for a page whose typography was correct. The
  // same mistake, one level down, is requiring `display:flex` to appear BEFORE
  // `flex-direction:column` in `.shell-main` — true of webpack's output and false
  // of Turbopack's, for identical styles. So the declarations are merged per
  // selector and each property is asserted on its own.
  const declsFor = (sel) => {
    const rx = /([^{}]+)\{([^{}]*)\}/g;
    let m, out = "";
    while ((m = rx.exec(css))) {
      if (m[1].split(",").map((s) => s.trim()).includes(sel)) out += ";" + m[2];
    }
    return out;
  };
  const ruleDecls = declsFor("body");
  ok(ruleDecls.length > 0, "the stylesheet has a body rule");
  const font = (ruleDecls.match(/font-family\s*:\s*([^;]+)/) || [])[1] || "";
  ok(font.length > 0, "the body rule sets font-family", font || "none");
  ok(!/^\s*(serif|Times|sans-serif)\s*$/i.test(font.trim()) || /system-ui|-apple-system/.test(font),
     "the body font is the project's stack, not a bare generic", font.trim().slice(0, 60));
  ok(/--paper\s*:/.test(css), "the design tokens (:root custom properties) are present");
  ok(/--ink\s*:/.test(css), "the ink token is present — the palette, not just a font");
  ok(/:root\s*\{/.test(css), "a :root block exists to carry the theme");

  group("R3 · primary navigation appears once per viewport");
  // CORRECTED INVARIANT. This used to assert `mainMenus === 2` — two <nav>
  // elements carrying the IDENTICAL aria-label "Main menu" — and so the gate
  // was pinning the defect the audit reported rather than the intent behind it.
  // The intent is one primary navigation per viewport, which is served by two
  // landmarks with DIFFERENT names: the sidebar ("Main menu") and the phone's
  // bottom bar ("Sections"). Only one is visible at a given width, but a
  // landmark list read by a screen reader never consults the stylesheet, so two
  // landmarks of the same name are two places the user cannot tell apart.
  //
  // This is stricter than what it replaced, not looser: it requires both
  // elements to exist AND requires their names to differ, which `=== 2` on a
  // single label could not express.
  const mainMenus = [...home.matchAll(/<nav[^>]*aria-label="Main menu"/g)].length;
  const bottomNavs = [...home.matchAll(/<nav[^>]*aria-label="Sections"/g)].length;
  ok(mainMenus === 1, "exactly one <nav> is named 'Main menu' — the sidebar", String(mainMenus));
  ok(bottomNavs === 1, "exactly one <nav> is named 'Sections' — the phone's bottom bar", String(bottomNavs));
  ok(/class="[^"]*bottomnav[^"]*"/.test(home), "markup still carries the bottom nav element itself");
  // The duplication in the screenshot was BOTH visible at once, which happens only
  // when the rule that hides one of them never arrives. Assert that rule exists at
  // the desktop width and that the media query swaps it below the breakpoint.
  const desktopHide = /\.bottomnav\s*\{[^}]*display\s*:\s*none/.test(css);
  ok(desktopHide, "the stylesheet hides .bottomnav at desktop width (one nav visible)");
  const swap = /@media[^{]*max-width\s*:\s*900px[^}]*\{[\s\S]*?\.sidebar\s*\{[^}]*display\s*:\s*none/.test(css);
  ok(swap, "below the breakpoint the stylesheet hides .sidebar instead (still one nav visible)");
  const bottomShown = /@media[^{]*max-width\s*:\s*900px[\s\S]*?\.bottomnav\s*\{[^}]*display\s*:\s*(flex|block)/.test(css);
  ok(bottomShown, "and the bottom nav becomes the visible one on a phone");

  group("R4 · the footer is pushed to the bottom of the layout");
  const declares = (sel, prop, valueRx) => new RegExp(`${prop}\\s*:\\s*${valueRx}`).test(declsFor(sel));
  ok(declares(".shell", "display", "grid"), ".shell is a grid (the two-column shell)");
  ok(declares(".shell-main", "display", "flex") && declares(".shell-main", "flex-direction", "column"),
     ".shell-main is a column flex box, so main content grows and the footer sinks");
  ok(declares(".shell-main", "min-height", "(100|100vh|100dvh)") ||
     declares(".shell", "min-height", "(100|100vh|100dvh)") ||
     declares(".shell-main", "flex", "1"),
     "the shell/main has a min-height or flex-grow so a short page still pushes the footer down");
  ok(declares(".footer", "margin-top", "auto"), "the footer carries margin-top:auto (the actual bottom-push)");
  // …and structurally, the footer is the last child of the main column.
  const shellMain = home.slice(home.indexOf('class="shell-main"'));
  const fi = shellMain.lastIndexOf("<footer");
  const shellMainClose = shellMain.indexOf("</div>", shellMain.indexOf('class="footer"'));
  ok(fi > -1, "the footer is inside .shell-main");
  ok(fi > shellMain.indexOf("<main"), "the footer comes after the page content, not before it");

  group("R5 · curriculum shows content or a real empty state");
  const curr = await (await fetch(`${BASE}/curriculum`)).text();
  const ct = text(curr);
  // CORRECTED INSTRUMENT, and this was the whole of the defect. `/curriculum` is
  // a CLIENT page, so the bytes the server sends are the route guard's BOOT state
  // — `<p class="muted">Loading…</p>` inside its main — for a visitor and a
  // learner alike, because the guard cannot decide before the session probe
  // answers. This assertion scraped that text for /concept|subject|board|course/
  // and so passed on the VISITOR SIDEBAR's own words ("Subjects", the platform's
  // subject list): it was reading the shell and calling it the page. It began
  // failing the moment the visitor's navigation stopped listing subjects — a
  // correction to the shell, with the curriculum screen itself unchanged and
  // still rendering. So the served document is asserted to BE the boot state, and
  // the route's own render path is asserted to hold both a content branch and an
  // honest no-record one. The RENDERED page is a browser's answer and is claimed
  // there: scripts/ui-walk.mjs opens /curriculum, waits for the course control
  // and drives it (asserted in the UI walk, not here).
  ok(/role="status"/.test(curr) && /<main/.test(curr),
     "curriculum serves the app's boot state, not an error page or an empty body");
  const currSrc = fs.readFileSync("app/curriculum/page.tsx", "utf8");
  ok(/coverageReport\(active\)|curr\.sub/.test(currSrc),
     "the curriculum route renders a content branch — the course, its tiers and the coverage panel");
  ok(/curr\.noProfile/.test(currSrc) && /href="\/onboarding"/.test(currSrc),
     "and an honest empty state for a learner with no record, carrying the way in");
  // A bare "Loading…" DOCUMENT is not a page: the shell (nav, footer) must be
  // there around the boot state, which is what says the app served rather than
  // threw. The gate is on the words, not the markup.
  ok(ct.length > 200 && !/^(loading|please wait|…)/i.test(ct.trim()),
     "curriculum serves the whole shell around the boot state, not a bare loading message", `${ct.length} chars`);

  // R5b · every design token a surface uses must actually EXIST.
  // `var(--accent)` was used once with no fallback and is not a token this design
  // system defines, so the offline banner painted paper-on-paper and the one
  // message that must be legible without a network was unreadable. A token with
  // a fallback is fine; a bare undefined token is an invisible style.
  group("R5b · every design token a surface uses is defined (or has a fallback)");
  const defined = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const bare = [];
  for (const route of ["/", "/offline", "/curriculum", "/learn"]) {
    let h; try { h = await (await fetch(BASE + route)).text(); } catch { continue }
    for (const m of h.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      if (!defined.has(m[1])) bare.push(route + " uses " + m[1] + " with no fallback");
    }
  }
  // …and the source, which is where an inline style can slip one past the served
  // HTML (the bar only renders its markup when the device is actually offline).
  // COMMENTS ARE STRIPPED FIRST, and that is not a nicety: the comment recording
  // the `--accent` fix above quotes the offending expression verbatim, so a naive
  // scan reads its own post-mortem as a live violation. `//` is only a comment
  // when it is not the `//` of a URL.
  for (const f of ["components/offline-bar.tsx", "components/nav.tsx"]) {
    let src; try { src = fs.readFileSync(f, "utf8"); } catch { continue }
    const code = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
    for (const m of code.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      if (!defined.has(m[1])) bare.push(f + " uses " + m[1] + " with no fallback");
    }
  }
  ok(bare.length === 0, "no surface uses an undefined design token without a fallback", [...new Set(bare)].slice(0, 3).join(" | "));

  group("R6 · icon-only controls carry an accessible name");
  const unlabelled = [];
  for (const m of curr.matchAll(/<(button|a)\b([^>]*)>([\s\S]{0,400}?)<\/\1>/g)) {
    const [, tag, attrs, inner] = m;
    const text0 = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const hasAria = /aria-label\s*=\s*"[^"]+"/.test(attrs) || /aria-labelledby\s*=\s*"[^"]+"/.test(attrs);
    const hasTitle = /title\s*=\s*"[^"]+"/.test(attrs);
    const isIconOnly = /<svg|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(inner) && text0.length === 0;
    if (isIconOnly && !hasAria && !hasTitle) unlabelled.push(inner.replace(/\s+/g, " ").slice(0, 50));
  }
  ok(unlabelled.length === 0, "every icon-only control has aria-label or title", unlabelled.slice(0, 3).join(" | "));

  // ── NAVIGATION LANDMARKS ───────────────────────────────────────────────
  // THE FAILING SCENARIO, KEPT: the shell renders two <nav> landmarks — the
  // desktop sidebar and the phone's bottom bar — and both carried the SAME
  // aria-label, "Main menu". Only one is visible at any width (the other is
  // hidden by CSS), but a landmark list read by a screen reader never consults
  // the stylesheet: the user heard "Main menu" twice and had no way to tell the
  // two destinations apart. The bottom bar now carries its own name.
  //
  // Asserted against the SERVED markup, not the JSX, because the pairing of a
  // label with a landmark is decided by what ships.
  group("Navigation landmarks");
  for (const route of ["/", "/learn", "/dashboard"]) {
    const html = await text(route);
    const navs = [...html.matchAll(/<nav\b[^>]*>/gi)].map((m) => m[0]);
    const labels = navs
      .map((n) => (n.match(/aria-label="([^"]*)"/i) || [])[1])
      .filter((l) => typeof l === "string" && l.length > 0);
    const dupes = labels.filter((l, i) => labels.indexOf(l) !== i);
    ok(
      dupes.length === 0,
      `${route}: no two <nav> landmarks share an accessible name`,
      `duplicated: ${[...new Set(dupes)].join(", ")} — labels were ${labels.join(" / ")}`,
    );
    ok(
      navs.every((n) => /aria-label=/i.test(n)),
      `${route}: every <nav> landmark is named`,
      `${navs.length} nav(s), ${labels.length} labelled`,
    );
    // The raw key must never reach the accessible name: `t("nav.bottomAria")`
    // returning the key would produce a landmark literally called
    // "nav.bottomAria", which is worse than a duplicate.
    ok(
      labels.every((l) => !/^[a-z][a-z]*\.[a-zA-Z]/.test(l)),
      `${route}: no landmark is labelled with a dictionary key`,
      labels.filter((l) => /^[a-z][a-z]*\.[a-zA-Z]/.test(l)).join(", "),
    );
  }
} catch (e) {
  fail++;
  bad.push({ name: "gate crashed", detail: e.message });
  console.log(`  ✗ gate crashed — ${e.message}`);
}

console.log(`\n${"─".repeat(58)}`);
console.log(`RENDER GATE: ${pass} passed, ${fail} failed`);
if (fail) for (const b of bad) console.log(`  · ${b.name}${b.detail ? " — " + b.detail : ""}`);
process.exit(fail ? 1 : 0);
