"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// THE DECISION DOOR — one context in, one decision out.
//
// Before this module, every surface assembled its own call to the engine:
//
//     next-step.tsx   → decideNext(model, …, ledger.events)
//     dashboard       → decideNext(model, …)          ← no events
//     have-plan       → decideNext(model, …)          ← no events
//     /api/next       → decideNext(model, …)          ← no events
//     /api/my-pack    → decideNext(model, …)          ← no events
//
// Two of those could cite the learner's real recorded answers and three could
// not, and nothing stopped a fourth from disagreeing outright about what to do
// next. A recommendation is a PROJECTION of the evidence, so a surface that
// does not hand the evidence over is not making a smaller decision — it is
// making a different one.
//
// So there is now exactly one way in. A surface assembles a `DecisionContext`
// (the model AND the ledger it was projected from) and calls `decide`. Every
// consumer therefore receives the same object for the same learner, and
// `DecisionAction` carries its own `basis` and `projectionVersion` so a caller
// can tell what kind of claim it is holding.
//
// ── Why `basis` is a state and not a boolean ──────────────────────────────
//
// The tempting shortcut is `basis = evidenceIds.length > 0 ? "cited" : "none"`,
// which reads "no citations" as "no evidence". Those are different facts, and
// conflating them is how a surface ends up telling a learner with three
// hundred recorded answers that nothing has been recorded yet. There are five
// states, and each one is a different sentence:
//
//   cited         evidence exists and this action cites the events that caused
//                 it. Every cited id must resolve in the context's own ledger.
//   unattributed  evidence exists, but this action's rule does not hinge on any
//                 single event (a rest day; a project with no resources). Naming
//                 none is honest; manufacturing a citation is not.
//   no_evidence   the ledger is empty AND the model holds no recorded work: a
//                 learner nothing has been measured about yet. The only state
//                 in which "no answers recorded yet" is true.
//   unrecorded    the ledger is empty but the MODEL holds recorded attempts —
//                 a learner whose work predates the evidence record (real: the
//                 live store holds one with 13 answers and an empty ledger).
//                 "No answers recorded yet" would be a lie about them.
//   unknown       this SURFACE does not have the ledger. Every client surface
//                 passes through this state while its fetch is in flight, and
//                 treating that window as an empty ledger is how the loading
//                 spinner tells a learner their history does not exist.
//
// `unknown` and `unrecorded` exist for the same reason `null ≠ 0` everywhere
// else here: the engine must not be able to say "we have not measured you"
// when the truth is "we have not looked" or "we lost the record of it".
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.decisionContext = decisionContext;
exports.decisionContextFrom = decisionContextFrom;
exports.hasRecordedWork = hasRecordedWork;
exports.decide = decide;
exports.decideOne = decideOne;
exports.citationGaps = citationGaps;
exports.basisViolations = basisViolations;
const evidence_1 = require("./evidence");
const next_engine_1 = require("./next-engine");
/**
 * Assemble a context. Pure and total, so the SERVER (`decisionContextFor`) and
 * the CLIENT (a ledger fetch plus the profile it already has) build the same
 * thing from the same inputs — which is what makes the cross-surface equality
 * claim a property of the code rather than a coincidence of two code paths.
 *
 * This is the EXACT door: it takes the events themselves, so every caller that
 * can reach it has the ledger in hand.
 */
function decisionContext(model, events, projectionVersion = evidence_1.PROJECTION_VERSION, unprojectable = null) {
    return { model, events, ledgerKnown: true, projectionVersion, unprojectable };
}
/**
 * The door a CLIENT surface uses: the profile it has, and the ledger if the
 * fetch has come back.
 *
 * This is not a convenience. `decisionContext(state, ledger?.events ?? [])` is
 * the shape that produces the bug — a fetch still in flight (or a failed one)
 * becomes an empty ledger, which becomes `no_evidence`, which the card renders
 * as "No answers recorded yet" for a learner with three hundred of them. With
 * a null ledger the action's basis is `unknown`, which is a different sentence
 * and the true one. Nothing else about the decision changes: the work proposed
 * is the model's to choose, and it is the CITATIONS that need the evidence.
 *
 * The server never needs this — `decisionContextFor` reads the file — so a
 * server route cannot be handed an "unknown" ledger and cannot skip the check.
 */
function decisionContextFrom(model, ledger, projectionVersion = evidence_1.PROJECTION_VERSION, unprojectable = null) {
    if (!ledger)
        return { model, events: [], ledgerKnown: false, projectionVersion, unprojectable };
    return decisionContext(model, ledger.events, projectionVersion, unprojectable);
}
/** Does the model hold work — an answer, an independence attempt, a transfer
 *  attempt — that an empty ledger would have to be lying about? The question
 *  `unrecorded` answers, asked of the MODEL because the ledger is the thing
 *  that is missing. */
function hasRecordedWork(model) {
    return Object.values(model.progress ?? {}).some((p) => (p.attempts ?? 0) > 0 || (p.independent?.asked ?? 0) > 0 || (p.transfer?.asked ?? 0) > 0);
}
/**
 * THE DOOR. Every learner-facing surface that asks "what next?" comes through
 * here, so the same learner and the same ledger always yield the same action —
 * with the same reason, the same plan, and the same cited evidence.
 */
function decide(ctx, opts = {}) {
    const actions = (0, next_engine_1.decideNext)(ctx.model, opts.max ?? 4, opts.tt, opts.title, opts.now, ctx.events);
    return actions.map((a) => ({
        ...a,
        basis: basisOf(ctx, a),
        projectionVersion: ctx.projectionVersion,
    }));
}
/**
 * Which of the five sentences is true of this action. In order: the ledger was
 * not loaded; the action cites events; the ledger is empty but the model is
 * not; the ledger is empty and so is the model; evidence exists but this rule
 * hinges on none of it.
 */
function basisOf(ctx, a) {
    if (!ctx.ledgerKnown)
        return "unknown";
    if (a.evidenceIds.length > 0)
        return "cited";
    if (ctx.events.length === 0)
        return hasRecordedWork(ctx.model) ? "unrecorded" : "no_evidence";
    return "unattributed";
}
/** The top of the ranking — what most surfaces actually present. */
function decideOne(ctx, opts = {}) {
    return decide(ctx, { ...opts, max: 1 })[0];
}
/**
 * Every cited id that does NOT resolve in the context's own ledger.
 *
 * A citation is a promise: "this recorded answer is why". An id the learner's
 * ledger does not contain cannot be that, so this returns the broken promises
 * rather than letting a surface render a plausible-looking lie. The engines
 * suite requires it to be empty for every action the engine can produce.
 */
function citationGaps(ctx, actions) {
    const known = new Set(ctx.events.map((e) => e.id));
    const gaps = [];
    actions.forEach((a, index) => {
        for (const id of a.evidenceIds)
            if (!known.has(id))
                gaps.push({ index, kind: a.kind, id });
    });
    return gaps;
}
/**
 * Is this decision's claim consistent with its evidence? Each of the five
 * states is pinned to the fact that licenses it, and this returns the
 * violations by name — so a surface that tells a learner something the model
 * and the ledger do not support fails a test instead of shipping.
 */
function basisViolations(ctx, actions) {
    const hasEvidence = ctx.events.length > 0;
    const hasWork = hasRecordedWork(ctx.model);
    const out = [];
    for (const a of actions) {
        // The claim and the ledger that would license it, in both directions.
        if (a.basis === "unknown" && ctx.ledgerKnown)
            out.push(`${a.kind}: claims the ledger was not loaded, but it was`);
        if (a.basis !== "unknown" && !ctx.ledgerKnown)
            out.push(`${a.kind}: claims ${a.basis} without having loaded the ledger`);
        if (a.basis === "unknown" && a.evidenceIds.length > 0)
            out.push(`${a.kind}: cites ${a.evidenceIds.length} event(s) while claiming not to have the ledger`);
        if (a.basis === "cited" && a.evidenceIds.length === 0)
            out.push(`${a.kind}: cited with no citations`);
        if (a.basis === "unattributed" && a.evidenceIds.length > 0)
            out.push(`${a.kind}: unattributed but cites ${a.evidenceIds.length}`);
        if (a.basis === "no_evidence" && hasEvidence)
            out.push(`${a.kind}: claims no evidence while the ledger holds ${ctx.events.length}`);
        if (a.basis === "no_evidence" && hasWork)
            out.push(`${a.kind}: claims no evidence while the model holds recorded work`);
        if (a.basis === "unrecorded" && hasEvidence)
            out.push(`${a.kind}: claims an unrecorded history while the ledger holds ${ctx.events.length}`);
        if (a.basis === "unrecorded" && !hasWork)
            out.push(`${a.kind}: claims work the record cannot account for, but the model holds none`);
    }
    return out;
}
