# OpenMind multilingual readiness

Generated 2026-11-10 by `npm run verify:multilingual`.

This report distinguishes interface translation from translated and reviewed teaching. It does not count an unverified link as a usable resource.


## Design state

- Text-first lesson, worked example, diagram, traps and practice exist without a video.
- The video card is link-only: no autoplay, no preload, no iframe and no third-party player loaded before the learner chooses it.
- The data preference is learner-owned (`text`, `low`, `balanced`, `high`); text-only suppresses the video and says why.
- External video is never represented as offline.
- File size and mobile-data cost are unknown unless a provider supplies them. No estimate is fabricated.
- Transcript availability is `unknown` for every exact video.

## Measurements in this pass

| Journey | Result |
|---|---|
| Initial page load under throttling | **not measured** |
| First useful lesson content under throttling | **not measured** |
| Video player load after user request | **not measured**; the app never loads the provider player itself |
| Offline package opening | existing path, **not re-run** |
| Submission and synchronisation under interruption | existing path, **not re-run** |

Acceptance criteria 38 (low-bandwidth browser journeys) and 39 (RTL visual/assistive testing) remain **not done**. This report does not turn an unrun throttled test into a pass.
