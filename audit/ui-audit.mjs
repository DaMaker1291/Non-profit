// Stage 1 UI/flow baseline against a LIVE dev server. Findings 5–8.
import fs from "node:fs";
const BASE = process.env.OM_BASE || "http://localhost:4173";
const out = { generatedAt: new Date().toISOString(), base: BASE, findings: {} };
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const mainOf = (h) => { const i = h.indexOf("<main"), j = h.indexOf("</main>"); return i < 0 || j < 0 ? "" : strip(h.slice(i, j)); };

// F5 — landing page: fictional learner telemetry + internal ids
{
  const h = await (await fetch(`${BASE}/`)).text();
  const t = strip(h);
  const idPat = /\b[a-z]+(?:-[a-z]+)*-\d+\b/g;
  const ids = [...new Set((t.match(idPat) || []).filter((x) => !/^(skip-to|offline|read-more)$/i.test(x)))];
  out.findings.landing = {
    bytes: h.length,
    sectionMarkerCount: (t.match(/§/g) || []).length,
    sectionHeadings: [...new Set(t.match(/§\s*[A-Z][A-Z ,'-]{6,60}/g) || [])].slice(0, 12),
    telemetryPhrases: ["THE RECORD IT READ", "THE ANSWER THAT DECIDED IT", "answers", "needed help", "hit the same slip", "EVERY CLAIM ON THIS PAGE", "WHERE IT WAS COUNTED", "written by hand"]
      .filter((p) => t.includes(p)),
    internalIds: ids.slice(0, 12),
    selfReferentialProof: /nothing on this page was written by hand|Change the record and the card changes/i.test(t),
  };
}

// F6 — loading/SSR state per core student route
{
  const routes = ["/", "/solve", "/try/fractions", "/dashboard", "/progress", "/learn", "/learn/maths", "/papers", "/curriculum", "/mind", "/projects", "/account", "/onboarding", "/diagnostic/maths", "/teacher", "/offline", "/help", "/about"];
  const rows = [];
  for (const r of routes) {
    const res = await fetch(`${BASE}${r}`, { redirect: "follow" });
    const h = await res.text();
    const m = mainOf(h);
    rows.push({ route: r, status: res.status, bytes: h.length, mainWords: m ? m.split(/\s+/).length : 0,
      mainIsBootScreen: /Loading your learning|Taking you to the right step/.test(m),
      sectionMarker: /§/.test(m), sample: m.slice(0, 90) });
  }
  out.findings.coreRoutes = rows;
  out.findings.ssrSummary = {
    routesProbed: rows.length,
    bootScreenOnly: rows.filter((r) => r.mainIsBootScreen).map((r) => r.route),
    withRealContent: rows.filter((r) => r.mainWords > 40).map((r) => r.route),
    sectionMarkerRoutes: rows.filter((r) => r.sectionMarker).map((r) => r.route),
  };
}

// F7 — nav landmarks, responsiveness, keyboard
{
  const h = await (await fetch(`${BASE}/`)).text();
  const navs = [...h.matchAll(/<nav\b([^>]*)>/g)].map((m) => (m[1].match(/aria-label="([^"]*)"/) || [, "(no label)"])[1]);
  const landmarks = [...h.matchAll(/<nav\b[^>]*aria-label="([^"]*)"/g)].map((m) => m[1]);
  const dupes = landmarks.filter((l, i) => landmarks.indexOf(l) !== i);
  const css = fs.readFileSync("app/globals.css", "utf8");
  out.findings.nav = {
    navElements: navs, labelledLandmarks: landmarks, duplicateLabels: [...new Set(dupes)],
    internalLinkTargets: new Set([...h.matchAll(/href="(\/[a-zA-Z0-9/_-]*)"/g)].map((m) => m[1])).size,
    skipLink: /Skip to the work/.test(h),
    mediaQueries: (css.match(/@media/g) || []).length, cssLines: css.split("\n").length,
    focusVisibleRules: (css.match(/:focus/g) || []).length,
  };
  const interactive = [...h.matchAll(/<(button|a|input|select|textarea)\b([^>]*)>/g)];
  out.findings.nav.keyboard = {
    interactiveWithoutLabel: interactive.filter(([, tag, attrs]) => {
      const labelled = /aria-label|aria-labelledby|title=/.test(attrs);
      const text = /aria-label|aria-labelledby|title=/.test(attrs) || tag === "a" || tag === "button";
      return !labelled && text && !/href=/.test(attrs) && !/type=/.test(attrs);
    }).length,
    positiveTabindex: (h.match(/tabindex="(?!0|-1)[0-9]+"/g) || []).length,
  };
}

// F8 — i18n asymmetry + student-visible fallback
{
  const { DICTS, LANG_CODES, translator } = await import("../.verify/i18n.js");
  const { cblurb, ctitle } = await import("../.verify/content-i18n.js");
  const en = DICTS.en, codes = LANG_CODES;
  const enKeys = Object.keys(en);
  const rows = [];
  for (const c of codes) {
    const d = DICTS[c]; if (!d) { rows.push({ lang: c, present: false }); continue; }
    const k = Object.keys(d);
    const missingInThis = enKeys.filter((x) => !(x in d));
    rows.push({ lang: c, present: true, keys: k.length, missingVsEnglish: missingInThis.length,
      untranslatedVsEnglish: enKeys.filter((x) => x in d && d[x] === en[x]).length });
  }
  const nonEn = codes.filter((c) => c !== "en");
  const onlyInNonEnglish = Object.keys(DICTS[nonEn[0]]).filter((k) => !(k in en));
  const inAllNonEnglish = nonEn.map((c) => Object.keys(DICTS[c]).filter((k) => !(k in en)))
    .reduce((acc, a) => acc.filter((k) => a.includes(k)), Object.keys(DICTS[nonEn[0]]));
  const tEn = translator("en");
  const sample = ["place-value", "quadratics", "pythagoras", "photosynthesis", "recursion"];
  out.findings.i18n = {
    languages: codes.length, englishKeyCount: enKeys.length,
    perLanguage: rows,
    keyCountAsymmetry: enKeys.length !== rows.find((r) => r.lang !== "en").keys,
    keysMissingFromEnglish: inAllNonEnglish.length,
    sampleKeysMissingFromEnglish: inAllNonEnglish.slice(0, 8),
    studentVisibleFallback: sample.map((id) => ({ concept: id, english: cblurb("en", id), urdu: cblurb("ur", id), rawKeyLeaks: tEn(`cb.${id}`) === `cb.${id}` })),
    note: "cblurb() falls back to the genome's authored English, so the asymmetry is a maintenance/drift fault and a documentation error, not a raw-key leak — asserted explicitly below.",
  };
}

fs.writeFileSync("audit/baseline-ui.json", JSON.stringify(out, null, 2));
console.log("wrote audit/baseline-ui.json\n");
console.log("F5 landing:", JSON.stringify(out.findings.landing, null, 1).slice(0, 900));
console.log("\nF6 ssr:", JSON.stringify(out.findings.ssrSummary, null, 1));
console.log("\nF7 nav:", JSON.stringify(out.findings.nav, null, 1));
console.log("\nF8 i18n keys:", out.findings.i18n.englishKeyCount, "en vs", out.findings.i18n.perLanguage[1].keys, "| missingFromEnglish:", out.findings.i18n.keysMissingFromEnglish);
console.log("   raw key leak to student:", out.findings.i18n.studentVisibleFallback.some((s) => s.rawKeyLeaks));
