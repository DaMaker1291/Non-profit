# OpenMind multilingual readiness

Generated 2026-11-12 by `npm run verify:multilingual`.

This report distinguishes interface translation from translated and reviewed teaching. It does not count an unverified link as a usable resource.


## Offline packages

- Offline-eligible concepts: **12**.
- Concepts with translated teaching in the pack allowlist: **1**.
- Offline pack carrying a requested language field: **yes**.
- Offline pack stating the question language: **yes**.
- Measured package sizes: **0**.
- Complete translation of the marked questions: **none** (generated questions are English).

## What changed

`app/api/offline-pack/route.ts` resolves `teachingLang` through `languageProfile`, calls `planFor(conceptId, language)`, and records `requestedLanguage`, `questionLanguage`, `teachingTranslated`, `questionsTranslated` and `complete`. It no longer hardcodes `language: "en"`.

When a complete translation does not exist, the pack says the teaching is English rather than relabelling it. On `/offline/study`, a pack whose `complete` field is false prints that it is a partial translation and names the question language.

## Evidence boundary

No package size is recorded, so no storage claim is made. The offline path's language metadata changed in this pass; the browser offline/reconnect drill was not re-run. Acceptance 36 and 37 remain **partial**.
