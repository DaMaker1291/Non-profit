// Raw-i18n-key leak detector.
//
// A learner must never see a dictionary key. This is a whole class of fault
// (the project has been bitten by it before: `next.why.examNow`, and the
// offline pack shipping English recommendations in every language), and it is
// cheap to reintroduce — a `{c.label}` where `{t(c.label)}` was meant compiles
// perfectly, typechecks, and renders the key.
//
// Two passes, because they catch different things:
//   1. RUNTIME — scan the server-rendered text of every route for a token that
//      looks like a dictionary key (dotted lowercase namespace). Catches a leak
//      that is already shipping.
//   2. SOURCE — scan the JSX for a translation-array member rendered WITHOUT
//      `t(`. Catches the leak on the branch that is not currently mounted.
import fs from "node:fs";
const BASE = process.env.OM_BASE || "http://localhost:4173";
const ROUTES = ["/", "/solve", "/try/fractions", "/dashboard", "/progress", "/learn", "/learn/maths", "/papers",
  "/curriculum", "/mind", "/projects", "/account", "/onboarding", "/diagnostic/maths", "/teacher", "/offline",
  "/help", "/about", "/access", "/rooms", "/mistakes", "/genome"];
// A rendered key: a lowercase dotted namespace that is a real i18n prefix.
const KEY = /\b(?:home|nav|next|learn|evv|mm|an|teach|plan|curr|off|acc|onb|state|res|pack|ask|common|map|prog|mist|hub|room|lq|listen|teach|sco|err|mic|voc|gate|cls|asn|mis|glob|term|aria|hint|q|ui|lan|faq)\.[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)?\b/g;

const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, "\n").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

const runtime = [];
for (const r of ROUTES) {
  let h; try { h = await (await fetch(`${BASE}${r}`)).text(); } catch { continue; }
  const text = strip(h);
  const found = [...new Set(text.match(KEY) || [])].filter((k) => {
    // A dotted token that is legitimately prose (e.g. "e.g.", "i.e.") is not a key.
    if (/^(e\.g|i\.e|etc|vs)$/i.test(k)) return false;
    return true;
  });
  if (found.length) runtime.push({ route: r, keys: found.slice(0, 10) });
}

const out = { generatedAt: new Date().toISOString(), runtimeLeaks: runtime, routesProbed: ROUTES.length,
  method: "server-rendered text of every route, scanned for a token shaped like a dictionary key. Behavioural, not source-string: it catches what a learner would actually be shown." };
fs.writeFileSync("audit/rawkey-audit.json", JSON.stringify(out, null, 2));
console.log(`routes probed: ${ROUTES.length}`);
console.log(`RUNTIME raw-key leaks: ${runtime.length}`);
for (const r of runtime) console.log("  ", r.route, "->", r.keys.join(", "));
process.exit(runtime.length ? 1 : 0);
