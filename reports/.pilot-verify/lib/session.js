"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// THE CLOSED LEARNING LOOP.
//
// "Progress recorded" is not the same thing as "the learner model meaningfully
// changed". Before this module the app could record twenty answers and still
// recommend exactly what it recommended before — a progress tracker wearing an
// adaptive system's clothes. This module makes the difference explicit:
//
//   capture a baseline → the practice API records evidence → recompute the
//   next step from the same ProfileState → report the difference, honestly.
//
// Deliberate properties:
//   · The baseline is captured BEFORE the first answer, so the "before" column
//     is a fact, not a reconstruction.
//   · The diff is computed from the engines that already exist (mastery,
//     learner-model, next-engine) — no second model, no second truth.
//   · `changeReason` says WHY the plan moved, and admits when it did not.
//     Nothing here is ever allowed to claim adaptation that did not happen.
//   · Structural only: no composed text crosses this boundary, so a persisted
//     summary can never freeze one language into a learner's profile.
// Pure, offline, deterministic — like every engine in this project.
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_TTL_MS = exports.SESSION_TARGET = void 0;
exports.bandOf = bandOf;
exports.metricsOf = metricsOf;
exports.topMistake = topMistake;
exports.sameStep = sameStep;
exports.kindTitleKey = kindTitleKey;
exports.emptyActivity = emptyActivity;
exports.captureBaseline = captureBaseline;
exports.openSession = openSession;
exports.reasonKey = reasonKey;
exports.toSummary = toSummary;
exports.computeResult = computeResult;
exports.noteActivity = noteActivity;
exports.isComplete = isComplete;
exports.continuesHere = continuesHere;
const genome_1 = require("./genome");
const mastery_1 = require("./mastery");
const learner_model_1 = require("./learner-model");
const decision_1 = require("./decision");
/** Questions a session aims for. Short enough to finish in one sitting on a
 *  shared phone, long enough for the EWMA and the proof records to move. */
exports.SESSION_TARGET = 5;
/** An unfinished session older than this is abandoned, not resumed. */
exports.SESSION_TTL_MS = 6 * 60 * 60 * 1000;
/** Bands are the only vocabulary a learner sees; the numbers stay internal. */
function bandOf(mastery, attempts) {
    if (attempts === 0 || mastery <= 0)
        return "new";
    if (mastery >= 0.9)
        return "strong";
    if (mastery >= 0.65)
        return "developing";
    return "learning";
}
/** Metrics for one concept, straight from the evidence record. */
function metricsOf(p) {
    if (!p) {
        return { mastery: 0, accuracy: 0, independence: null, transfer: null, retentionCorrect: 0, band: "new" };
    }
    const parts = (0, mastery_1.integratedMastery)(p);
    const rate = (e) => e && e.asked > 0 ? e.correct / e.asked : null;
    return {
        mastery: parts.integrated,
        accuracy: parts.accuracy,
        independence: rate(p.independent),
        transfer: rate(p.transfer),
        retentionCorrect: p.retention?.correct ?? 0,
        band: bandOf(parts.integrated, p.attempts),
    };
}
/** The misconception a concept's record points at most strongly, if any. */
function topMistake(p) {
    if (!p)
        return null;
    const hit = Object.entries(p.misconceptions)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])[0];
    return hit ? { id: hit[0], hits: hit[1] } : null;
}
function coreOf(a) {
    return a ? { kind: a.kind, conceptId: a.conceptId, minutes: a.minutes, href: a.href } : null;
}
/** Did the plan actually move? Compared on kind + concept, not on wording. */
function sameStep(a, b) {
    if (!a || !b)
        return a === b;
    return a.kind === b.kind && a.conceptId === b.conceptId;
}
/** i18n key for a next-step kind's title — shared by the result screen and
 *  Home so both name the same action the same way. */
function kindTitleKey(kind) {
    switch (kind) {
        case "PRACTISE": return "next.title.practise";
        case "RETRIEVE": return "next.title.retrieve";
        case "REMEDIATE": return "next.title.fix";
        case "CHALLENGE": return "next.title.challenge";
        case "TRANSFER": return "next.title.stretch";
        case "PROJECT": return "next.title.build";
        case "REST": return "next.title.caughtUp";
        default: return "next.title.learn";
    }
}
function emptyActivity() {
    return {
        asked: 0, correct: 0,
        independentAsked: 0, independentCorrect: 0,
        transferAsked: 0, transferCorrect: 0,
        hints: 0, durationMs: 0,
    };
}
function captureBaseline(state, conceptId, tt, 
/** The learner's ledger. Passed so the baseline's "step" is the SAME decision
 *  Home will make: a session that recorded a different next action from the
 *  one the learner acted on could never honestly report a moved plan. */
events) {
    const snap = (0, learner_model_1.buildSnapshot)(state);
    const p = state.progress[conceptId];
    return {
        metrics: metricsOf(p),
        attempts: p?.attempts ?? 0,
        mistake: topMistake(p),
        step: coreOf((0, decision_1.decideOne)((0, decision_1.decisionContext)(state, events ?? []), { tt })),
        counts: { touched: snap.touched, strong: snap.strong, due: snap.dueCount },
    };
}
/** Start, or resume, a session on one concept.
 *
 *  Resuming is deliberate: a learner who loses the connection (or the tab)
 *  mid-session continues the same session rather than being handed a fresh
 *  baseline that erases what they already did. */
function openSession(state, conceptId, kind, existing, target = exports.SESSION_TARGET, now = Date.now(), tt, 
/** The learner's ledger — see captureBaseline. */
events) {
    if (existing && existing.conceptId === conceptId && now - existing.startedAt < exports.SESSION_TTL_MS) {
        return { ledger: existing, resumed: true };
    }
    return {
        ledger: {
            conceptId,
            kind,
            target,
            startedAt: now,
            baseline: captureBaseline(state, conceptId, tt, events),
            activity: emptyActivity(),
        },
        resumed: false,
    };
}
/** i18n key for the reason field — the result screen and Home must explain the
 *  same change the same way, in the learner's language. */
function reasonKey(reason) {
    switch (reason) {
        case "mastery-up": return "sess.r.masteryUp";
        case "mastery-down": return "sess.r.masteryDown";
        default: return `sess.r.${reason}`;
    }
}
function toSummary(r) {
    return {
        conceptId: r.conceptId,
        kind: r.kind,
        at: r.finishedAt,
        activity: r.activity,
        before: r.before,
        after: r.after,
        mistake: r.mistake,
        changeReason: r.changeReason,
        nextStepChanged: r.nextStepChanged,
        nextStep: r.nextStep,
    };
}
function changeReasonFor(r, previousStep, nextStep) {
    const { activity, delta, proof, mistake } = r;
    if (activity.asked === 0)
        return "unchanged";
    // A held delayed recall outranks every other reason: it is the one claim that
    // says the teaching stuck rather than merely landed. A FAILED recall does not
    // reach this branch (the count did not rise) and reports the mastery pull-back
    // it caused, which is the honest sentence for it.
    if (r.after.retentionCorrect > r.before.retentionCorrect)
        return "retained";
    if (proof.transfer)
        return "transfer";
    const mistakeRose = mistake ? mistake.after > mistake.before : false;
    const nowRepairing = nextStep?.kind === "REMEDIATE" && previousStep?.kind !== "REMEDIATE";
    if (mistakeRose || nowRepairing)
        return "misconception";
    const independenceRose = r.before.independence === null
        ? r.after.independence !== null
        : r.after.independence !== null && r.after.independence > r.before.independence;
    if (independenceRose && delta.mastery > 0)
        return "independence";
    if (delta.mastery > 0.005)
        return "mastery-up";
    if (delta.mastery < -0.005)
        return "mastery-down";
    return "same";
}
/** Close the loop: recompute the plan from the state the evidence produced and
 *  report what changed. The baseline is the ledger's, so the comparison is
 *  against a real measurement rather than a remembered one. */
function computeResult(state, ledger, finishedAt = Date.now(), tt, 
/** The learner's ledger, for the closing decision. Same contract as
 *  `captureBaseline`: the before and the after must come from one door. */
events) {
    const conceptId = ledger.conceptId;
    const p = state.progress[conceptId];
    const before = ledger.baseline.metrics;
    const after = metricsOf(p);
    const nowMistake = topMistake(p);
    const mistake = ledger.baseline.mistake || nowMistake
        ? {
            id: (nowMistake ?? ledger.baseline.mistake).id,
            before: ledger.baseline.mistake?.hits ?? 0,
            after: nowMistake?.hits ?? 0,
        }
        : null;
    const nextStep = coreOf((0, decision_1.decideOne)((0, decision_1.decisionContext)(state, events ?? []), { tt }));
    const partial = {
        conceptId,
        subject: (0, genome_1.getConcept)(conceptId)?.subject ?? "maths",
        kind: ledger.kind,
        startedAt: ledger.startedAt,
        finishedAt,
        minutes: Math.max(0, Math.round((finishedAt - ledger.startedAt) / 60000)),
        activity: ledger.activity,
        before,
        after,
        delta: {
            mastery: after.mastery - before.mastery,
            independence: ledger.baseline.metrics.independence === null || after.independence === null
                ? after.independence
                : after.independence - ledger.baseline.metrics.independence,
        },
        mistake,
        proof: {
            independent: ledger.activity.independentCorrect > 0,
            transfer: ledger.activity.transferCorrect > 0,
        },
        previousStep: ledger.baseline.step,
        nextStep,
        nextStepChanged: !sameStep(ledger.baseline.step, nextStep),
        counts: buildCounts(state),
    };
    return { ...partial, changeReason: changeReasonFor(partial, ledger.baseline.step, nextStep) };
}
function buildCounts(state) {
    const snap = (0, learner_model_1.buildSnapshot)(state);
    return { touched: snap.touched, strong: snap.strong, due: snap.dueCount };
}
/** Record one graded answer against the open session — called from the grading
 *  path, so every counter here is server-attributed. `mode` is the mode the
 *  server derived, never the one the client claimed. */
function noteActivity(ledger, input) {
    if (input.conceptId !== ledger.conceptId)
        return;
    const a = ledger.activity;
    a.asked += 1;
    if (input.correct)
        a.correct += 1;
    if (input.mode === "transfer") {
        a.transferAsked += 1;
        if (input.correct && input.hints === 0)
            a.transferCorrect += 1;
    }
    else if (input.mode === "independent") {
        a.independentAsked += 1;
        if (input.correct && input.hints === 0)
            a.independentCorrect += 1;
    }
    a.hints += input.hints;
    if (typeof input.ms === "number" && input.ms >= 0)
        a.durationMs += input.ms;
}
/** Is this session finished — target reached, or the learner answered a
 *  transfer question (a proven transfer ends the session on a high note)? */
function isComplete(ledger) {
    return ledger.activity.asked >= ledger.target || ledger.activity.transferAsked > 0;
}
/**
 * DOES THIS NEXT STEP MEAN "GO ELSEWHERE", OR "DO THE NEXT THING HERE"?
 *
 * The result screen offers "Continue to my next step" against the engine's own
 * href, and for a step ON THIS CONCEPT that href is the page the learner is
 * already standing on (`/learn/<subject>/<concept>`). A link to the current
 * path is not a navigation — the router keeps the mounted component, so the
 * result panel stayed on screen and the control did nothing. Measured in a
 * browser after a transfer: an `<a>` whose href equalled `location.pathname`,
 * pressed, no change. The commonest next step after a transfer is more work on
 * the same idea, so this was the usual case, not an edge.
 *
 * The rule lives here, next to the session that produces the href, so the panel
 * and any future surface ask the same question. The query is ignored: the engine
 * builds none, and a same-route href with one would still not remount the page.
 * Both arguments are paths (`/learn/maths/fractions`), never full URLs.
 */
function continuesHere(href, pathname) {
    if (!href || !pathname)
        return false;
    const path = (value) => value.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
    return path(href) === path(pathname);
}
