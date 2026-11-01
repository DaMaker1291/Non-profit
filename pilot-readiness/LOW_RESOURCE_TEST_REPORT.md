# Low-resource test report

## Measured before this pass (audit)
- Lesson route first-load JavaScript: 3,212,647 B raw / 1,034,600 B gzip across 15 scripts; largest chunk 1,716 KB raw / 563 KB gzip.
- `.next/static` total: 3.7 MB; published static twin: 8.6 MB.
- Service worker: network-first for pages/assets, never caches `/api/*`. Offline answers are queued, not marked.

## This pass
- No new bundle measurement was taken after adding the pilot routes.
- No mobile-device, throttled-network or low-end-Android test was run.
- No complete offline journey was tested: open lesson → diagram → questions → submit → feedback → reload → sync.
- The offline page remains a reading/plan pack, not a complete learning mode. Marking requires the server.

**Conclusion:** low-resource readiness is not established. The pilot must be described as connectivity-dependent until the end-to-end offline journey and a real device test exist.
