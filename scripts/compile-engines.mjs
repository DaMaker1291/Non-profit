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
  // The demand ladder, on its own so the question SERVE and the diagnostic
  // REPORT read one definition rather than two that agree by luck.
  "lib/skills.ts",
  "lib/questions.ts",
  "lib/questions-deep.ts",
  // The per-SUBJECT depth layers: a subject with no depth family of its own
  // declared an advanced difficulty it could not serve, so its families are
  // compiled with the bank that composes them — a mirror that omitted one of
  // these files would measure a bank the product does not run.
  "lib/questions-computing.ts",
  "lib/questions-chemistry.ts",
  "lib/questions-physics.ts",
  "lib/questions-biology.ts",
  // The numeric-item families (§6): the concepts whose questions could only
  // ever be four printed options, given an answer box. Compiled with the bank
  // because the bank composes them, so the gate asserts the coverage on the
  // REAL composed generator rather than a parallel list.
  "lib/numeric-items.ts",
  "lib/numeric-items-core.ts",
  // The ONE answer-identity and grading rule. Pure, and shared by the server
  // grade, the static twin and the serve search — a typed answer and its
  // equivalent option must be the same answer everywhere, so it is compiled
  // with the rest rather than left to each caller to re-derive.
  "lib/answer.ts",
  // The re-framer, and its own question — can this concept's questions be put
  // on a second surface at all? The decision engine asks it (a TRANSFER
  // recommendation the serve cannot honour is a promise the product cannot
  // keep), so the mirror has to carry it for the engine to be judged whole.
  "lib/transfer.ts",
  "lib/diagnostic.ts",
  // The proof vocabulary and the retention rule: what one answer ESTABLISHED,
  // in one place, asked by the live model, the assignment monitor, the grade a
  // learner is shown and the surfaces that name a verdict. Pure, so the server
  // modules in this list can share it without dragging a graph behind it.
  "lib/proof.ts",
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
  // What a course can ACTUALLY serve, measured from its generators. Imported
  // by no engine module — it exists so a surface can state the gap honestly,
  // and it imports both questions.ts and specifications.ts, so it must stay
  // a leaf or the module graph closes a cycle.
  "lib/content-ceiling.ts",
  "lib/questions-senior.ts",
  // The target environment, its derived answers, and the deployment's own
  // configuration report. Pure (an env object in, a report out, no disk), so the
  // suite can pin the rules that /api/ready and `npm run production-check` both
  // act on — one definition, two callers, no second opinion about what
  // "configured" means.
  "lib/deployment.ts",
  "lib/version.ts",
  "lib/env.ts",
  // The profile's own shape (a new learner state, and the wire-stripping rule)
  // is pure, so it lives outside the fs-bound store and both builds share it.
  "lib/learner-profile.ts",
  "lib/learner-model.ts",
  // The append-and-project path, with its storage injected: the server uses the
  // JSONL store, the static build uses localStorage, and one module decides
  // the order of operations for both.
  "lib/ledger.ts",
  // ── THE SHARED CLIENT LAYER, COMPILED WITH THE ENGINES ──────────────────
  // Every page asks for an OPERATION (lib/api/client.ts) and never for a URL,
  // and lib/api/transport.ts is the one module that knows how an operation
  // travels. Compiled here because the published static build has to reach the
  // SAME operations with no server at all — which is the whole point of the
  // seam — and because the gate suite can then hold the seam still: installing
  // a wire must move every call, INCLUDING the answer (lib/sync-queue.ts
  // reached `fetch` itself until `setAnswerWire` closed that hole).
  "lib/api/identity.ts",
  "lib/api/transport.ts",
  "lib/api/client.ts",
  // ── THE SERVE, WITHOUT A TRANSPORT ──────────────────────────────────────
  // A serve is answered in two places — the Next route handler and the
  // published static build — and both must make the SAME educational decision:
  // which band, whether the recall is due, which draw, which served keys are
  // excluded, what gets staged. It used to live in the route with a copy in
  // docs/app.js, and the copy had already drifted (the page read the concept's
  // own subject's course, the route the profile's first one). Compiled here so
  // the static build can reach the ONE decision, and asserted by
  // scripts/verify-engines.mjs so neither caller can quietly re-derive it.
  "lib/operations.ts",
  "lib/next-engine.ts",
  "lib/session.ts",
  "lib/papers.ts",
  "lib/paper-analysis.ts",
  "lib/content-i18n.ts",
  "lib/subjects.ts",
  // Every number the product publishes about itself, derived from the code that
  // makes it true. Compiled with the rest because the suite must hold the
  // CLAIMS and the FACTS together: the copy in all fifteen dictionaries carries
  // placeholders, and this module is the only thing that can fill them. While it
  // sat outside the mirror the dictionary could say 43 about a catalogue of 53
  // and no assertion in the repository could tell.
  "lib/claims.ts",
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
  // Real accounts: scrypt hashing, the signed session token, and the cookie
  // attributes. Compiled with the rest so the suite can assert the SESSION
  // FLAGS BEHAVIOURALLY (Secure follows the scheme, never blanket-on or
  // blanket-off) rather than reading the source for a string.
  "lib/server/auth.ts",
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
  // Prompt formatting (prose vs code). Pure and shared with the static build,
  // so the suite can assert the split on the REAL questions rather than reading
  // a regex over a renderer's source.
  "lib/prompt.ts",
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
  // Who is in a class, and who is one of its STUDENTS. The two modules that
  // answer those questions for the roster, the monitor and the printed plan are
  // compiled too, so the suite can assert the rules BEHAVIOURALLY (the class's
  // teacher is a member but not a student) instead of reading their source for
  // a string — which is what it had to do while they lived outside the mirror.
  "lib/server/class-membership.ts",
  "lib/server/class-view.ts",
  // The offline answer queue. It is a client module too, and it belongs here for
  // the same reason as the two above: the suite drives its dedupe, ordering and
  // retry behaviour directly, on the REAL module the browser loads, rather than
  // describing it in prose and hoping.
  "lib/sync-queue.ts",
];

export const MIRROR_DIR = ".verify";

/** Compile the engine sources into the one mirror, or throw on a type error. */
// ONCE PER PROCESS, however many modules ask. Two entry points now share these
// compiled engines (the benchmark and the north-star report), and each one
// importing the mirror meant `tsc` ran twice for one run. The mirror is a
// function of the sources, so a second compile in the same process cannot
// produce anything the first did not.
let compiled = false;

export function compileEngines() {
  if (compiled) return;
  compiled = true;
  execSync(
    `npx tsc ${ENGINE_SOURCES.join(" ")} --outDir ${MIRROR_DIR} --module commonjs --target es2020 ` +
    "--skipLibCheck --esModuleInterop --strict",
    { stdio: "inherit" },
  );
}
