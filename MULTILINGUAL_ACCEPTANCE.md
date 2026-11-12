# OpenMind multilingual readiness

Generated 2026-11-12 by `npm run verify:multilingual`.

This report distinguishes interface translation from translated and reviewed teaching. It does not count an unverified link as a usable resource.


## Acceptance criteria 24–40

These are tracked independently. `partial` and `not-done` are not passes.

| # | Criterion | Status | Evidence |
|---:|---|---|---|
| 24 | Learners can study in their selected teaching language. | **partial** | Teaching-language selection is persisted and the read stage uses it. Complete translated teaching exists for fractions/fr. |
| 25 | Learners can use a different examination language. | **partial** | The exam-language field is learner-owned and persisted. Assessment content is still English-only. |
| 26 | Bilingual presentation works where appropriate. | **partial** | The bilingual flag and original-term preference are stored; no side-by-side glossary is authored. |
| 27 | Coverage distinguishes translated UI from translated and reviewed teaching. | **implemented** | LANGUAGE_COVERAGE_MATRIX.json reports interface strings, complete teaching pairs, assessment language and review separately. |
| 28 | Resources are matched to curriculum, level, language and need. | **partial** | Language and data preference are enforced; level is carried but no reviewed catalogue records a level. |
| 29 | Provider links lead to relevant content, not homepages or searches. | **implemented** | Provider-search routes were removed; only exact-concept URLs are returned and asserted direct. |
| 30 | Essential learning does not depend on external streaming. | **implemented** | The lesson, worked example, diagram and practice are internal; the video card is optional. |
| 31 | Every essential lesson has a usable text-based alternative. | **partial** | Every complete plan is text-first, but not every concept has a complete plan. |
| 32 | Video loading is user-controlled and never autoplayed. | **implemented** | Link-only card; no autoplay, preload, iframe or embedded player in the lesson page. |
| 33 | Data usage and download sizes are not fabricated. | **implemented** | All video file sizes are null and every cost statement says it depends on provider and quality. |
| 34 | Legitimately downloadable content can be used offline. | **partial** | Pilot lesson packs are offline-capable; no external video is represented as downloadable. |
| 35 | Restricted external video is never copied or represented as offline. | **implemented** | Every external resource has offlineAvailable=false. |
| 36 | Downloadable lesson packages work without permanent internet. | **partial** | Existing offline path; the browser reconnect drill was not re-run after the language change. |
| 37 | Offline learner evidence synchronises correctly. | **partial** | Existing queue/sync path; not re-run in this pass. |
| 38 | Low-bandwidth browser journeys have passed. | **not-done** | No throttled browser run in this pass; the report records no measurement. |
| 39 | RTL interfaces and non-Latin scripts have been tested. | **not-done** | RTL metadata is present for ar/ur/fa; no visual or assistive-technology run. |
| 40 | External resources have traceable provenance and review status. | **partial** | Exact links carry provider, language and provisional metadata; review and transcript status are visibly absent. |

## Counts

- implemented: 6
- partial: 9
- not done: 2
