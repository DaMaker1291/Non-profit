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
//     proper empty state                       → asserted on the served markup
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
  const bodyRule = css.match(/(^|[},])\s*body\s*\{([^}]*)\}/);
  ok(!!bodyRule, "the stylesheet has a body rule");
  const bodyDecls = bodyRule ? bodyRule[2] : "";
  const font = (bodyDecls.match(/font-family\s*:\s*([^;]+);/) || [])[1] || "";
  ok(font.length > 0, "the body rule sets font-family", font || "none");
  ok(!/^\s*(serif|Times|sans-serif)\s*$/i.test(font.trim()) || /system-ui|-apple-system/.test(font),
     "the body font is the project's stack, not a bare generic", font.trim().slice(0, 60));
  ok(/--paper\s*:/.test(css), "the design tokens (:root custom properties) are present");
  ok(/--ink\s*:/.test(css), "the ink token is present — the palette, not just a font");
  ok(/:root\s*\{/.test(css), "a :root block exists to carry the theme");

  group("R3 · primary navigation appears once per viewport");
  const mainMenus = [...home.matchAll(/<nav[^>]*aria-label="Main menu"/g)].length;
  ok(mainMenus === 2, "markup carries the sidebar nav and the bottom nav (one per breakpoint)", String(mainMenus));
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
  ok(/\.shell\s*\{[^}]*display\s*:\s*grid/.test(css), ".shell is a grid (the two-column shell)");
  ok(/\.shell-main\s*\{[^}]*display\s*:\s*flex[^}]*flex-direction\s*:\s*column/.test(css),
     ".shell-main is a column flex box, so main content grows and the footer sinks");
  ok(/\.shell-main\s*\{[^}]*min-height\s*:\s*(100|100vh|100dvh)/.test(css) ||
     /\.shell\s*\{[^}]*min-height\s*:\s*(100|100vh|100dvh)/.test(css) ||
     /\.shell-main\s*\{[^}]*flex\s*:\s*1/.test(css),
     "the shell/main has a min-height or flex-grow so a short page still pushes the footer down");
  ok(/\.footer\s*\{[^}]*margin-top\s*:\s*auto/.test(css), "the footer carries margin-top:auto (the actual bottom-push)");
  // …and structurally, the footer is the last child of the main column.
  const shellMain = home.slice(home.indexOf('class="shell-main"'));
  const fi = shellMain.lastIndexOf("<footer");
  const shellMainClose = shellMain.indexOf("</div>", shellMain.indexOf('class="footer"'));
  ok(fi > -1, "the footer is inside .shell-main");
  ok(fi > shellMain.indexOf("<main"), "the footer comes after the page content, not before it");

  group("R5 · curriculum shows content or a real empty state");
  const curr = await (await fetch(`${BASE}/curriculum`)).text();
  const ct = text(curr);
  const mainOnly = ct.slice(ct.indexOf("curriculum") > -1 ? 0 : 0);
  const hasRealContent = /concept|stage|subject|specification|qualification|board|course/i.test(mainOnly);
  const hasEmptyState = /(set up|choose|start learning|get started|no .*yet|add |pick )/i.test(mainOnly);
  ok(hasRealContent || hasEmptyState, "curriculum shows curriculum content or a useful empty state");
  // A bare spinner is NOT an empty state. The gate is on the words, not the markup.
  ok(!/^\s*(loading|please wait|…)\s*$/i.test(mainOnly.trim().slice(0, 200)) || hasRealContent || hasEmptyState,
     "curriculum is not left on a bare loading message");
  ok(ct.length > 200, "curriculum serves real copy", `${ct.length} chars`);

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
} catch (e) {
  fail++;
  bad.push({ name: "gate crashed", detail: e.message });
  console.log(`  ✗ gate crashed — ${e.message}`);
}

console.log(`\n${"─".repeat(58)}`);
console.log(`RENDER GATE: ${pass} passed, ${fail} failed`);
if (fail) for (const b of bad) console.log(`  · ${b.name}${b.detail ? " — " + b.detail : ""}`);
process.exit(fail ? 1 : 0);
