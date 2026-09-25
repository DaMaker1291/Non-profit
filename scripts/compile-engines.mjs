// ONE compile mirror for the verification pipeline.
//
// `npm run verify` and `npm run content-check` are two entry points onto the
// same compiled engines, and this module owns the source list and the output
// directory so there is exactly one mirror (`.verify`) to build and reason
// about. The content graph is compiled WITH the engines rather than beside
// them: it is a gate on `npm run verify`, and a gate that compiles its own
// private copy can silently disagree with the code it is judging.
//
// `lib/content-graph.ts` imports only these engines, so the list below is also
// the graph's own dependency set — a new import in the graph that is not
// compiled here fails the build loudly rather than at runtime.
import { execSync } from "node:child_process";

export const ENGINE_SOURCES = [
  "lib/genome.ts",
  "lib/misconceptions.ts",
  "lib/questions.ts",
  "lib/questions-deep.ts",
  "lib/diagnostic.ts",
  "lib/progress.ts",
  "lib/progress-types.ts",
  "lib/socratic.ts",
  "lib/i18n.ts",
  "lib/matcher.ts",
  "lib/retention.ts",
  "lib/hints.ts",
  "lib/teacher-plan.ts",
  "lib/microdiag.ts",
  "lib/starter.ts",
  "lib/access.ts",
  "lib/mastery.ts",
  "lib/curriculum.ts",
  "lib/deadline.ts",
  "lib/specifications.ts",
  "lib/learner-model.ts",
  "lib/next-engine.ts",
  "lib/session.ts",
  "lib/papers.ts",
  "lib/paper-analysis.ts",
  "lib/content-i18n.ts",
  "lib/subjects.ts",
  "lib/question-bank.ts",
  "lib/content-rights.ts",
  "lib/personal-paper.ts",
  "lib/app-state.ts",
  "lib/local-ai.ts",
  "lib/local-model.ts",
  "lib/evidence.ts",
  "lib/replay.ts",
  "lib/decision.ts",
  "lib/server/store.ts",
  "lib/server/evidence.ts",
  "lib/server/projection.ts",
  "lib/server/decision.ts",
  "lib/content-graph.ts",
  // The read half of the loop (evidence → what the learner is told). It is a
  // client module, and it belongs here because the suite asserts its behaviour
  // (dimension rows, "unmeasured" honesty) IN the same compiled mirror the rest
  // of the pipeline runs from — no block may depend on another block's private
  // compile step to load it.
  "lib/evidence-view.ts",
  // The AI layer's grounding. It belongs in the same mirror for the same
  // reason: the suite asserts that the tutor's input IS the decision the
  // surfaces display, and that nothing on the AI path can write. Both claims
  // are about these three modules, so they must be compiled with the rest
  // rather than loaded from a private copy.
  "lib/tutor-context.ts",
  "lib/llm.ts",
  "lib/server/tutor.ts",
  // The room's tutor turn. Same reason again: the suite asserts that a shared
  // room resolves an HONEST focus (never a default from another subject) and
  // that its disclosure is the source that actually answered — claims about
  // this module, so it is compiled with the rest.
  "lib/server/room-tutor.ts",
  // The assignment derivation. The suite asserts the monitor's numbers come
  // from the ledger over the assignment's own window (and that a device's
  // claimed clock cannot move them), so this module is compiled with the rest
  // rather than described in prose.
  "lib/server/assignment-view.ts",
  // The offline answer queue. It is a client module too, and it belongs here for
  // the same reason as the two above: the suite drives its dedupe, ordering and
  // retry behaviour directly, on the REAL module the browser loads, rather than
  // describing it in prose and hoping.
  "lib/sync-queue.ts",
];

export const MIRROR_DIR = ".verify";

/** Compile the engine sources into the one mirror, or throw on a type error. */
export function compileEngines() {
  execSync(
    `npx tsc ${ENGINE_SOURCES.join(" ")} --outDir ${MIRROR_DIR} --module commonjs --target es2020 ` +
    "--skipLibCheck --esModuleInterop --strict",
    { stdio: "inherit" },
  );
}
