// WCAG AA measurement of the OpenMind palette, read from `app/globals.css`
// itself rather than from a copy of the numbers, so the thing measured is the
// thing that ships. Run: node tools/contrast-check.mjs
//
// AA for normal text is 4.5:1; for large text and UI boundaries 3:1. Every pair
// below is a pair the product actually renders: body copy on paper, a button's
// label on the accent, a chip's label on gold, muted metadata on a card.
import fs from "node:fs";

const css = fs.readFileSync("app/globals.css", "utf8");
const block = (re) => (css.match(re) || [])[1];

function pick(re) {
  const m = css.match(re);
  if (!m) throw new Error(`token block not found: ${re}`);
  return m[1];
}
const light = pick(/:root \{\n([\s\S]*?)\n\}/);
const dark = pick(/:root\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);

// TWO STEPS, IN THIS ORDER, because the order is the whole cascade: collect RAW
// declarations (aliases still written as `var(--x)`), merge the themes as raw
// declarations, and only THEN resolve. Resolving first baked the light green into
// `--mark-correct`, so the dark overrides could not reach it and a correct mark
// measured 2.28:1 against a dark card — a failure the palette did not have.
function decls(src) {
  const raw = {};
  for (const line of src.split("\n")) {
    const m = line.match(/^\s*(--[a-z0-9-]+):\s*([^;]+);/);
    if (m) raw[m[1]] = m[2].trim();
  }
  return raw;
}

function tokens(raw) {
  // THE SEMANTIC LAYER IS ALIASES (`--mark-reward: var(--gold)`), so a check
  // that only collected hex literals would report the reward chip as an
  // undefined colour and measure nothing at all. Resolve the chain the way the
  // browser does, on the same element that declares it.
  const resolve = (name, seen = new Set()) => {
    if (seen.has(name)) return undefined;
    seen.add(name);
    const v = raw[name];
    if (!v) return undefined;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    const alias = v.match(/^var\((--[a-z0-9-]+)\)$/);
    return alias ? resolve(alias[1], seen) : undefined;
  };
  const out = {};
  for (const k of Object.keys(raw)) {
    const c = resolve(k);
    if (c) out[k] = c;
  }
  return out;
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, what it is, minimum]
const PAIRS = [
  ["--ink", "--paper", "heading on the page", 4.5],
  ["--ink-soft", "--paper", "body copy on the page", 4.5],
  ["--pencil", "--paper", "muted label on the page", 4.5],
  ["--ink", "--surface", "body copy on a card", 4.5],
  ["--pencil", "--surface", "muted label on a card", 4.5],
  ["--accent", "--paper", "link / active text on the page", 4.5],
  ["--accent-ink", "--accent-soft", "selected nav item in its own panel", 4.5],
  ["--ink", "--accent-soft", "text in a mint panel", 4.5],
  ["--paper", "--accent", "a primary button's label on teal", 4.5],
  ["--ink", "--paper-deep", "text on a recessed panel", 4.5],
  ["--pencil", "--paper-deep", "muted label on a recessed panel", 4.5],
  ["--mark-correct", "--surface", "correct mark on a card", 4.5],
  ["--mark-wrong", "--surface", "wrong mark on a card", 4.5],
  ["--mark-caution", "--surface", "caution mark on a card", 4.5],
  ["--on-gold", "--mark-reward", "a milestone's label on gold", 4.5],
  ["--stage", "--paper", "the course chip", 4.5],
];

// THE DARK BLOCK ONLY RETARGETS PRIMITIVES. `--mark-correct: var(--tick-green)`
// and friends are aliases declared once in `:root`, and the browser resolves them
// on that same element AFTER the dark block has overridden the primitives. So the
// dark theme is light ∪ dark, not dark alone — measuring the block in isolation
// reported the semantic marks as undefined and called a fine palette a failure.
const lightDecls = decls(light);
const darkDecls = { ...lightDecls, ...decls(dark) };
const lightTokens = tokens(lightDecls);
const darkTokens = tokens(darkDecls);

let failures = 0;
for (const [theme, t] of [["light", lightTokens], ["dark", darkTokens]]) {
  console.log(`\n${theme.toUpperCase()}`);
  for (const [fg, bg, label, min] of PAIRS) {
    const a = t[fg];
    const b = t[bg];
    if (!a || !b) {
      console.log(`  ?? ${label.padEnd(42)} ${fg} or ${bg} undefined`);
      failures++;
      continue;
    }
    const r = ratio(a, b);
    const pass = r >= min;
    if (!pass) failures++;
    console.log(
      `  ${pass ? "AA" : "FAIL"} ${label.padEnd(42)} ${r.toFixed(2)}:1  ${a} on ${b} (needs ${min}:1)`,
    );
  }
}

// Gold is a FILL, and this is what says so — measured, not asserted, because the
// answer is not the same in both themes and a blanket rule would be a guess.
const goldAsText = {};
for (const [theme, t] of [["light", lightTokens], ["dark", darkTokens]]) {
  const r = ratio(t["--gold"], t["--paper"]);
  goldAsText[theme] = r;
  console.log(
    `\n${theme}: gold AS TEXT on paper measures ${r.toFixed(2)}:1 ` +
      (r >= 4.5
        ? "— legible here, but it stays a fill so one rule covers both themes."
        : "— unreadable, so it may never be a glyph."),
  );
}
if (goldAsText.light >= 4.5) {
  failures++;
  console.log("RESULT: gold passed as text on ivory, which contradicts the token's own rule.");
}

console.log(failures === 0 ? "\nRESULT: every measured pair meets WCAG AA" : `\nRESULT: ${failures} pair(s) below AA`);
process.exit(failures === 0 ? 0 : 1);
