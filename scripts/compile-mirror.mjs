// Compile the ONE verification mirror (`.verify`) and stop.
//
// `npm run verify` and `npm run content-check` do this themselves as their first
// step, because neither is useful without it. This entry point exists for the
// callers that need the mirror WITHOUT running a whole suite — the Pages
// workflow, which builds the static bundle and then proves it against the real
// server modules in `npm run verify:static`.
//
// Usage: node scripts/compile-mirror.mjs
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
console.log("verification mirror compiled");
