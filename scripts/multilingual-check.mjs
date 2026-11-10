import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { compileEngines } from "./compile-engines.mjs";

// The gate measures the bank and the dictionaries. It is deliberately able to
// fail: a translated interface is not translated teaching, a resolving link is
// not a reviewed resource, and an unknown file size is not zero bytes.
compileEngines();
const require = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (p) => readFileSync(resolve(root, p), "utf8");
const i18n = require("../.verify/i18n.js");
const exact = require("../.verify/exact-resources.js");
const plans = require("../.verify/lesson-plans.js");
const genome = require("../.verify/genome.js");
const pilot = require("../.verify/pilot.js");
const learning = require("../.verify/i18n-learning.js");
const { LANGS, DICTS, langMeta } = i18n;
const { exactVideoResources, recommendResources, isDirectResourceUrl } = exact;
const { planFor, teachingLanguages } = plans;

let pass = 0;
const failures = [];
const ok = (condition, message) => { if (condition) pass++; else failures.push(message); };
const concepts = Object.keys(genome.CONCEPTS_BY_ID);
const langCodes = LANGS.map((l) => l.code);
const lrnKeys = Object.keys(learning.LEARNING_STRINGS.en);

// 1. Interface dictionaries: all fifteen carry the learning-language labels.
ok(LANGS.length === 15, `expected 15 languages, found ${LANGS.length}`);
ok(new Set(langCodes).size === 15, "duplicate language codes");
for (const code of langCodes) {
  const dict = DICTS[code];
  ok(!!dict, `missing dictionary: ${code}`);
  if (!dict) continue;
  for (const key of lrnKeys) ok(key in dict, `${code} is missing ${key}`);
  // Extra keys are legitimate (translated concept blurbs and other
  // language-only labels). A MISSING English key is not: t() would silently
  // fall back to English inside that dictionary.
  const missing = Object.keys(DICTS.en).filter((key) => !(key in dict));
  ok(missing.length === 0, `${code} is missing English keys: ${missing.slice(0, 5).join(", ")}`);
  if (code !== "en") ok(lrnKeys.some((k) => dict[k] !== DICTS.en[k]), `${code} has no translated learning-language labels`);
}
const rtl = langCodes.filter((code) => langMeta(code).dir === "rtl");
ok(rtl.length === 3, `expected three RTL languages, found ${rtl.length}`);
for (const code of ["ar", "ur", "fa"]) ok(langMeta(code).dir === "rtl", `${code} is not RTL`);

// 2. Translated teaching, counted rather than assumed.
const completePairs = [];
const completeByLang = Object.fromEntries(langCodes.map((c) => [c, []]));
for (const id of concepts) {
  for (const lang of teachingLanguages(id)) {
    if (lang === "en") continue;
    completePairs.push({ conceptId: id, language: lang });
    completeByLang[lang].push(id);
  }
}
const reviewedPlans = concepts.filter((id) => planFor(id)?.review === "subject-reviewed");
const humanReviewedTranslations = completePairs.filter((p) => planFor(p.conceptId, p.language)?.review === "subject-reviewed");
const translatedConcepts = new Map();
for (const pair of completePairs) {
  if (!translatedConcepts.has(pair.conceptId)) translatedConcepts.set(pair.conceptId, []);
  translatedConcepts.get(pair.conceptId).push(pair.language);
}
const fullLessonLanguages = langCodes.filter((code) => (completeByLang[code] ?? []).length > 0);
ok(humanReviewedTranslations.length === 0, "a translation claims subject review without a reviewer record");
ok(completePairs.length >= 1, "no complete translated lesson was found");
ok(completePairs.every((p) => p.language !== "en"), "English was counted as a translation");

// 3. Exact resources, never provider search pages.
const videos = exactVideoResources();
const external = videos.filter((r) => r.external);
ok(external.length > 0, "no exact-concept external resource was found");
for (const r of external) {
  ok(isDirectResourceUrl(r.url), `not a direct resource URL: ${r.url}`);
  ok(!/search|results\?|page_search_query/i.test(r.url), `search URL survived: ${r.url}`);
  ok(r.offlineAvailable === false, `${r.id} claims offline availability for a restricted video`);
  ok(r.fileSizeBytes === null, `${r.id} invents a file size`);
  ok(r.transcript === "unknown", `${r.id} claims a transcript without verification`);
  ok(r.registrationRequired !== "no", `${r.id} claims no registration without verification`);
}
const toolsSource = read("components/lesson-study-tools.tsx");
ok(!/studyResourcesFor|page_search_query|results\?search_query/.test(toolsSource), "lesson tools still contain provider-search routes");
ok(!/studyResourcesFor/.test(read("lib/lesson-resources.ts")), "the old search function survived in the compatibility module");
ok(/recommendResources/.test(read("app/learn/[subject]/[concept]/page.tsx")), "the lesson page does not call the recommender");
ok(!/autoPlay|<video|youtube\.com\/embed|<iframe/i.test(read("app/learn/[subject]/[concept]/page.tsx")), "the lesson page autoplays or embeds a third-party player");

// 4. The recommendation decisions, driven.
const cases = {
  englishHigher: recommendResources("percentages", { teachingLang: "en", dataPreference: "high" }),
  englishTextOnly: recommendResources("percentages", { teachingLang: "en", dataPreference: "text" }),
  bengaliBalanced: recommendResources("percentages", { teachingLang: "bn", dataPreference: "balanced" }),
  frenchFractions: recommendResources("fractions", { teachingLang: "fr", dataPreference: "balanced" }),
};
ok(cases.englishHigher.resources.some((r) => r.kind === "external-video"), "English/high did not receive the exact video");
ok(!cases.englishTextOnly.resources.some((r) => r.kind === "external-video"), "text-only received a video");
ok(cases.englishTextOnly.externalReason === "text-only-preference", "text-only reason is wrong");
ok(!cases.bengaliBalanced.resources.some((r) => r.kind === "external-video"), "Bengali received an English video");
ok(cases.bengaliBalanced.resources.some((r) => r.kind === "internal-lesson"), "Bengali lost the internal lesson");
ok(cases.bengaliBalanced.resources[0].language === "en", "the Bengali fallback lesson was labelled Bengali");
ok(cases.frenchFractions.resources.some((r) => r.kind === "external-video") === false, "French fractions received an English video");
ok(cases.frenchFractions.resources.some((r) => r.kind === "offline-pack"), "French fractions lost the offline pack");
ok(cases.frenchFractions.resources[0].language === "fr", "French fractions was not taught in French");
const frPlan = planFor("fractions", "fr");
const enPlan = planFor("fractions", "en");
ok(!!frPlan && !!enPlan && frPlan.objective !== enPlan.objective, "French fractions did not receive translated teaching");

// 5. The offline pack carries the language it is actually in.
const offlineRoute = read("app/api/offline-pack/route.ts");
ok(/languageProfile/.test(offlineRoute), "offline pack ignores the learner language profile");
ok(/requestedLanguage/.test(offlineRoute), "offline pack does not preserve the requested language");
ok(/questionLanguage/.test(offlineRoute), "offline pack does not state the question language");
ok(!/\blanguage:\s*"en"/.test(offlineRoute), "offline pack still hardcodes English");
ok(/pack\.complete|complete:/.test(read("app/offline/study/page.tsx")), "offline page does not show partial-translation status");

// 6. Learner-owned profile fields are persisted and rendered.
const profileRoute = read("app/api/profile/route.ts");
for (const field of ["examLang", "secondaryLang", "bilingualTerms", "dataPreference"]) {
  ok(profileRoute.includes(field), `profile route does not persist ${field}`);
}
const accessPage = read("app/access/page.tsx");
for (const key of ["lrn.exam", "lrn.secondary", "lrn.bilingual", "lrn.dataText"]) {
  ok(accessPage.includes(key), `/access does not render ${key}`);
}

// 7. Reports, from the measurements above.
const today = new Date().toISOString().slice(0, 10);
const captions = {
  human: external.filter((r) => r.captions === "human").length,
  auto: external.filter((r) => r.captions === "auto").length,
  none: external.filter((r) => r.captions === "none").length,
  unknown: external.filter((r) => r.captions === "unknown").length,
};
const videoByLanguage = Object.fromEntries(langCodes.map((c) => [c, external.filter((r) => r.language === c).length]));
const offlineTranslated = pilot.PILOT_SEQUENCE.filter((id) => teachingLanguages(id).length > 0);
const matrix = {
  generatedAt: new Date().toISOString(),
  command: "npm run verify:multilingual",
  method: "Measured from lib/i18n.ts, lib/lesson-plans.ts, lib/exact-resources.ts and lib/pilot.ts. A missing translation is reported as missing.",
  summary: {
    interfaceLanguages: langCodes.length, rtlLanguages: rtl, concepts: concepts.length,
    completeTranslatedLessonPairs: completePairs.length, languagesWithCompleteLesson: fullLessonLanguages,
    humanReviewedTranslations: humanReviewedTranslations.length, humanReviewedPlans: reviewedPlans.length,
    exactExternalResources: external.length, exactResourcesOffline: external.filter((r) => r.offlineAvailable).length,
    transcriptsVerified: external.filter((r) => r.transcript === "available").length,
    offlineEligibleConcepts: pilot.PILOT_SEQUENCE.length, offlineConceptsWithTranslatedTeaching: offlineTranslated.length,
    measuredDownloadSizes: 0,
  },
  languages: langCodes.map((code) => {
    const meta = langMeta(code);
    const dict = DICTS[code] ?? {};
    const translatedStrings = Object.keys(DICTS.en).filter((k) => dict[k] && dict[k] !== DICTS.en[k]).length;
    const conceptIds = completeByLang[code] ?? [];
    return {
      code, name: meta.name, native: meta.native, direction: meta.dir,
      interface: translatedStrings > 0 ? "translated-strings" : "missing",
      translatedInterfaceStrings: translatedStrings, navigation: "translated-labels", systemMessages: "translated-labels",
      lessonContent: conceptIds.length ? `complete:${conceptIds.length}` : "english-only", lessonConcepts: conceptIds,
      subjectTerminology: "bilingual-terms-control-only",
      workedExamples: conceptIds.length ? `translated:${conceptIds.length}` : "english-only",
      questions: "english-only", assessmentInstructions: "english-only", markingFeedback: "english-only",
      misconceptionExplanations: "interface-coaching-only", externalVideoResources: videoByLanguage[code] ?? 0,
      captions, transcriptsVerified: 0, accessibility: "not-verified",
      humanLinguisticReview: "none", humanSubjectReview: "none",
      status: conceptIds.length ? "partial-teaching" : "interface-only",
    };
  }),
};
writeFileSync(resolve(root, "LANGUAGE_COVERAGE_MATRIX.json"), JSON.stringify(matrix, null, 2) + "\n");

const header = `# OpenMind multilingual readiness\n\nGenerated ${today} by \`npm run verify:multilingual\`.\n\nThis report distinguishes interface translation from translated and reviewed teaching. It does not count an unverified link as a usable resource.\n\n`;
const write = (name, text) => writeFileSync(resolve(root, name), text);
const pairList = completePairs.map((p) => `${p.conceptId}/${p.language}`).join(", ") || "none";
const externalLines = external.map((r) => `- **${r.title}** — ${r.provider}, ${r.language.toUpperCase()}${r.duration ? `, ${r.duration}` : ""}. Exact topic. <${r.url}>. Captions: ${r.captions ?? "unknown"}. Transcript: ${r.transcript}. Offline: no. Last checked: ${r.linkStatus}.`).join("\n") || "- None.";

write("MULTILINGUAL_READINESS_REPORT.md", `${header}
## Headline

- Interface languages: **${langCodes.length}** (${rtl.join(", ")} are RTL).
- Complete translated lesson pairs: **${completePairs.length}** (${pairList}).
- Concepts with a complete plan in any non-English language: **${translatedConcepts.size}** of ${concepts.length}.
- Translations with a human linguistic or subject review record: **${humanReviewedTranslations.length}**.
- Complete plans with subject review: **${reviewedPlans.length}**.
- Questions, assessment instructions and marking feedback: **English only**.
- Exact external resources: **${external.length}**; verified transcripts: **0**.
- Offline-eligible lessons: **${pilot.PILOT_SEQUENCE.length}**; with translated teaching: **${offlineTranslated.length}**.

## What a learner can actually do

A learner can choose interface, teaching, examination, optional second-language and data-budget settings. None is inferred from country, script or interface language.

The read stage follows the teaching language only where a complete translation exists. The complete translated teaching measured here is **${pairList}**. When no complete translation exists, the lesson is English and the recommendation says so; it is never relabelled as the requested language.

## Honest limits

1. Translated interface is not translated teaching. All fifteen dictionaries carry the learning-language labels; only the pairs above carry complete translated lesson prose.
2. No human translation review has happened. The count is zero.
3. Questions, instructions and marking feedback are English.
4. RTL is present in dictionary metadata but was not visually or assistively tested in this run.
5. A direct link is not a reviewed lesson. Captions, transcripts and review status are separate measurements.

The machine-readable matrix is \`LANGUAGE_COVERAGE_MATRIX.json\`.
`);

write("EXTERNAL_RESOURCE_CATALOGUE_REPORT.md", `${header}
## Catalogue

| Measure | Value |
|---|---:|
| Exact-concept resources found | ${external.length} |
| Providers | ${[...new Set(external.map((r) => r.provider))].join(", ") || "none"} |
| Languages with an exact video | ${Object.entries(videoByLanguage).filter(([, n]) => n).map(([c, n]) => `${c}:${n}`).join(", ") || "none"} |
| Human captions | ${captions.human} |
| Automatic captions | ${captions.auto} |
| Known to have no captions | ${captions.none} |
| Caption status unknown | ${captions.unknown} |
| Verified transcripts | 0 |
| Legitimately offline | 0 |
| Requiring external internet | ${external.length} |

## Quality ladder

| State | Count |
|---|---:|
| Found | ${external.length} |
| Link checked in this build | 0 |
| Metadata verified from the authored plan | ${external.length} |
| Machine assessed for teaching quality | 0 |
| Teacher reviewed | 0 |
| Curriculum reviewed | 0 |
| Approved for recommendation | 0 |

The authored plan records title, provider, language, duration and caption status where it knows them. File size, transcript availability, registration requirements and region restrictions are unknown and are not invented.

## Resources

${externalLines}

No provider homepage or search-results URL is used. A search page is not presented as a recommendation.
`);

write("RESOURCE_RECOMMENDATION_REPORT.md", `${header}
## Order

Internal text lesson → offline package (only for the authored pilot allowlist) → exact external video (only if its audio language equals the teaching language and the data preference is not text-only).

\`\`\`json
${JSON.stringify(cases, null, 2)}
\`\`\`

## What changed

The old \`studyResourcesFor\` returned Khan Academy, BBC Bitesize, YouTube and subject-provider search URLs for every concept. It could not say what the result's language, level or duration was. That function is gone. \`lib/lesson-resources.ts\` re-exports the exact-concept recommender, and \`components/lesson-study-tools.tsx\` keeps only the three in-lesson doors.

## Why a resource is absent

- \`text-only-preference\`: the learner chose text only.
- \`no-language-match\`: an exact video exists but not in the teaching language.
- \`no-exact-resource\`: no exact video exists for this concept.

The internal lesson is always present and is complete without the video.
`);

write("LOW_BANDWIDTH_READINESS_REPORT.md", `${header}
## Design state

- Text-first lesson, worked example, diagram, traps and practice exist without a video.
- The video card is link-only: no autoplay, no preload, no iframe and no third-party player loaded before the learner chooses it.
- The data preference is learner-owned (\`text\`, \`low\`, \`balanced\`, \`high\`); text-only suppresses the video and says why.
- External video is never represented as offline.
- File size and mobile-data cost are unknown unless a provider supplies them. No estimate is fabricated.
- Transcript availability is \`unknown\` for every exact video.

## Measurements in this pass

| Journey | Result |
|---|---|
| Initial page load under throttling | **not measured** |
| First useful lesson content under throttling | **not measured** |
| Video player load after user request | **not measured**; the app never loads the provider player itself |
| Offline package opening | existing path, **not re-run** |
| Submission and synchronisation under interruption | existing path, **not re-run** |

Acceptance criteria 38 (low-bandwidth browser journeys) and 39 (RTL visual/assistive testing) remain **not done**. This report does not turn an unrun throttled test into a pass.
`);

write("VIDEO_AND_MEDIA_OFFLINE_REPORT.md", `${header}
## Exact video inventory

- Exact-concept videos: **${external.length}**.
- Languages: ${Object.entries(videoByLanguage).filter(([, n]) => n).map(([c, n]) => `${c}:${n}`).join(", ") || "none"}.
- Captions: human ${captions.human}, auto ${captions.auto}, none ${captions.none}, unknown ${captions.unknown}.
- Transcripts verified: **0**.
- Legitimately downloadable/offline: **0**.
- Player embeds or autoplay in the lesson page: **0**.

## Media categories

| Category | This build |
|---|---|
| OpenMind-owned media | No OpenMind-owned video is served. |
| Open-licensed/permissioned external media | None recorded. |
| Restricted external streaming | ${external.length} exact links. Link-only, external, not downloadable, not offline. |

Every restricted video is accompanied by the complete text lesson. If the provider is blocked or the learner has no data, the essential teaching remains available without it.

## Claims not made

No transcript is claimed because none was verified. No file size is claimed because none was measured. No offline availability is claimed for a restricted video. No provider availability, region access or registration status is claimed as known.
`);

write("OFFLINE_PACKAGE_REPORT.md", `${header}
## Offline packages

- Offline-eligible concepts: **${pilot.PILOT_SEQUENCE.length}**.
- Concepts with translated teaching in the pack allowlist: **${offlineTranslated.length}**.
- Offline pack carrying a requested language field: **yes**.
- Offline pack stating the question language: **yes**.
- Measured package sizes: **0**.
- Complete translation of the marked questions: **none** (generated questions are English).

## What changed

\`app/api/offline-pack/route.ts\` resolves \`teachingLang\` through \`languageProfile\`, calls \`planFor(conceptId, language)\`, and records \`requestedLanguage\`, \`questionLanguage\`, \`teachingTranslated\`, \`questionsTranslated\` and \`complete\`. It no longer hardcodes \`language: "en"\`.

When a complete translation does not exist, the pack says the teaching is English rather than relabelling it. On \`/offline/study\`, a pack whose \`complete\` field is false prints that it is a partial translation and names the question language.

## Evidence boundary

No package size is recorded, so no storage claim is made. The offline path's language metadata changed in this pass; the browser offline/reconnect drill was not re-run. Acceptance 36 and 37 remain **partial**.
`);

const rows = [
  [24, "Learners can study in their selected teaching language.", "partial", `Teaching-language selection is persisted and the read stage uses it. Complete translated teaching exists for ${pairList}.`],
  [25, "Learners can use a different examination language.", "partial", "The exam-language field is learner-owned and persisted. Assessment content is still English-only."],
  [26, "Bilingual presentation works where appropriate.", "partial", "The bilingual flag and original-term preference are stored; no side-by-side glossary is authored."],
  [27, "Coverage distinguishes translated UI from translated and reviewed teaching.", "implemented", "LANGUAGE_COVERAGE_MATRIX.json reports interface strings, complete teaching pairs, assessment language and review separately."],
  [28, "Resources are matched to curriculum, level, language and need.", "partial", "Language and data preference are enforced; level is carried but no reviewed catalogue records a level."],
  [29, "Provider links lead to relevant content, not homepages or searches.", "implemented", "Provider-search routes were removed; only exact-concept URLs are returned and asserted direct."],
  [30, "Essential learning does not depend on external streaming.", "implemented", "The lesson, worked example, diagram and practice are internal; the video card is optional."],
  [31, "Every essential lesson has a usable text-based alternative.", "partial", "Every complete plan is text-first, but not every concept has a complete plan."],
  [32, "Video loading is user-controlled and never autoplayed.", "implemented", "Link-only card; no autoplay, preload, iframe or embedded player in the lesson page."],
  [33, "Data usage and download sizes are not fabricated.", "implemented", "All video file sizes are null and every cost statement says it depends on provider and quality."],
  [34, "Legitimately downloadable content can be used offline.", "partial", "Pilot lesson packs are offline-capable; no external video is represented as downloadable."],
  [35, "Restricted external video is never copied or represented as offline.", "implemented", "Every external resource has offlineAvailable=false."],
  [36, "Downloadable lesson packages work without permanent internet.", "partial", "Existing offline path; the browser reconnect drill was not re-run after the language change."],
  [37, "Offline learner evidence synchronises correctly.", "partial", "Existing queue/sync path; not re-run in this pass."],
  [38, "Low-bandwidth browser journeys have passed.", "not-done", "No throttled browser run in this pass; the report records no measurement."],
  [39, "RTL interfaces and non-Latin scripts have been tested.", "not-done", "RTL metadata is present for ar/ur/fa; no visual or assistive-technology run."],
  [40, "External resources have traceable provenance and review status.", "partial", "Exact links carry provider, language and provisional metadata; review and transcript status are visibly absent."],
];
write("MULTILINGUAL_ACCEPTANCE.md", `${header}
## Acceptance criteria 24–40

These are tracked independently. \`partial\` and \`not-done\` are not passes.

| # | Criterion | Status | Evidence |
|---:|---|---|---|
${rows.map(([n, c, s, e]) => `| ${n} | ${c} | **${s}** | ${e} |`).join("\n")}

## Counts

- implemented: ${rows.filter((r) => r[2] === "implemented").length}
- partial: ${rows.filter((r) => r[2] === "partial").length}
- not done: ${rows.filter((r) => r[2] === "not-done").length}
`);

if (failures.length) {
  console.error(`Multilingual audit: ${pass} assertions, ${failures.length} failures`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Multilingual audit: ${pass} assertions, 0 failures`);
console.log(`  ${langCodes.length} interface languages, ${completePairs.length} translated lesson pair(s), ${external.length} exact resource(s), ${pilot.PILOT_SEQUENCE.length} offline-eligible concepts.`);
