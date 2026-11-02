"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMONSTRATED_ORDER = exports.CONCEPT_STAGES = exports.ESTABLISHED_MASTERY = exports.REPAIR_STREAK = void 0;
exports.currentSlip = currentSlip;
exports.retiredSlip = retiredSlip;
exports.slipProgress = slipProgress;
exports.statusOf = statusOf;
exports.stageOf = stageOf;
exports.hasLiveSlip = hasLiveSlip;
exports.conceptDone = conceptDone;
exports.prerequisiteMet = prerequisiteMet;
exports.provedUnaided = provedUnaided;
exports.stuckOn = stuckOn;
exports.unmetPrerequisites = unmetPrerequisites;
exports.evidenceFor = evidenceFor;
exports.buildSnapshot = buildSnapshot;
exports.demonstratedLabelKey = demonstratedLabelKey;
exports.demonstrationSplit = demonstrationSplit;
exports.conceptStanding = conceptStanding;
// Learner model snapshot (§1): every interaction becomes structured evidence.
// Pure functions of ProfileState — the single source the Mind Map, Review
// Queue, Next Step and Offline Pack all read. No estimates, no simulation.
const genome_1 = require("./genome");
const proof_1 = require("./proof");
const retention_1 = require("./retention");
const transfer_1 = require("./transfer");
/**
 * How many answers in a row retire a recurring slip.
 *
 * The misconception ledger only ever counts UP (`recordAnswer` increments it
 * and never clears it), so a lifetime count can never stop being true. Using it
 * to decide the next step made REMEDIATE permanent: a learner could repair the
 * slip with six clean answers and the engine would still open with "Fix: …",
 * which is precisely the failure of adaptation this product claims to avoid.
 *
 * The evidence is therefore never deleted — `lifetimeMisconception` still holds
 * it for the teacher view — but it stops being *actionable* once the learner
 * has since answered this concept correctly three times in a row. A hint does
 * not clear the streak: the slip is about the answer given, not about help
 * received (independence is a separate measure).
 */
exports.REPAIR_STREAK = 3;
/** The slip that is still current: null once repaired by REPAIR_STREAK answers. */
function currentSlip(p) {
    const entries = Object.entries(p?.misconceptions ?? {});
    if (entries.length === 0)
        return null;
    if ((p?.streak ?? 0) >= exports.REPAIR_STREAK)
        return null;
    entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { id: entries[0][0], hits: entries[0][1] };
}
/** THE SAME SLIP, AFTER THE REPAIR HAS HELD — the other end of `currentSlip`'s
 *  rule, and deliberately not a second rule.
 *
 *  `currentSlip` answers null in two different situations: no slip was ever made
 *  here, and a slip was made and then repaired. They are not the same fact, and
 *  a learner who worked their way out of a belief deserves to be told so rather
 *  than left to notice that a card stopped appearing. This function separates
 *  them: it answers the retired slip only when a slip is on the record AND the
 *  streak that retires it has been earned.
 *
 *  It CANNOT disagree with `currentSlip`, because it asks it first: a slip that
 *  function still calls live is never reported as retired. That is the property
 *  worth having, since the read stage will print this as "you have fixed it". */
function retiredSlip(p) {
    if (currentSlip(p))
        return null;
    if ((p?.streak ?? 0) < exports.REPAIR_STREAK)
        return null;
    const entries = Object.entries(p?.misconceptions ?? {});
    if (entries.length === 0)
        return null;
    entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { id: entries[0][0], hits: entries[0][1] };
}
function slipProgress(p) {
    const slip = currentSlip(p);
    if (!slip)
        return null;
    return { slip, clean: Math.min(p?.streak ?? 0, exports.REPAIR_STREAK), need: exports.REPAIR_STREAK };
}
function statusOf(mastery, attempts) {
    if (attempts === 0)
        return "untouched";
    if (mastery >= 0.9)
        return "strong";
    if (mastery >= 0.65)
        return "developing";
    if (mastery > 0)
        return "learning";
    return "new";
}
/** The mastery a prerequisite must reach before it can carry weight. Deliberately
 *  the SAME boundary `statusOf` calls "developing": one number, one owner, so a
 *  concept the teacher view calls developing is a concept the engine will build
 *  on — and a concept it calls learning is not. */
exports.ESTABLISHED_MASTERY = 0.65;
exports.CONCEPT_STAGES = ["unmeasured", "introduce", "practise", "prove", "transfer", "advance"];
/**
 * The rung, from the evidence alone. `canTransfer` is not consulted: whether a
 * concept HAS a second surface is a fact about the content, and this function
 * is a fact about the learner. The two meet in `conceptDone` below.
 */
function stageOf(e) {
    if (e.attempts === 0)
        return "unmeasured";
    if (e.mastery < 0.35)
        return "introduce";
    if (e.mastery < exports.ESTABLISHED_MASTERY)
        return "practise";
    // Accurate — but accurate HOW? `hintedAnswers >= attempts` is "every answer
    // taken with help", the one fact an accuracy score cannot show. It reads the
    // fold-owned count rather than the level tally, so a learner whose work
    // arrived from a device is judged the same as one answering live.
    if (e.hintedAnswers >= e.attempts)
        return "prove";
    if (e.transferCorrect === 0)
        return "transfer";
    return "advance";
}
/**
 * The slip that is still happening. Asked by BOTH questions below rather than
 * written twice, because a concept that is "finished" and a concept that "can
 * carry weight" must never disagree about whether something is broken: the one
 * time they did, the engine served a concept it had just called finished.
 */
function hasLiveSlip(e) {
    return e.misconceptionHits >= 2;
}
/**
 * Is this concept finished for this learner?
 *
 * `transfer` on a concept that has no second surface (lib/transfer.ts) is not
 * "still to do" — there is nothing to do, and treating it as pending is how a
 * learner ends up being prescribed the same impossible step forever. So the one
 * place that knows about both facts decides it here.
 *
 * A live slip reopens it. Progress on the ladder is a fact about what the
 * learner has demonstrated; being DONE also requires that nothing they
 * demonstrated is currently broken, which is the same rule `prerequisiteMet`
 * applies one level down.
 */
function conceptDone(e, canTransfer) {
    if (hasLiveSlip(e))
        return false;
    const s = stageOf(e);
    if (s === "advance")
        return true;
    return s === "transfer" && !canTransfer(e.conceptId);
}
/**
 * Can this concept carry weight as a foundation for another?
 *
 * A live slip is disqualifying: `stageOf` can call a concept "transfer"-ready
 * while its commonest wrong answer is still recurring, and building on a
 * known-broken step is what the REMEDIATE branch exists to avoid.
 */
function prerequisiteMet(e) {
    if (!e || e.attempts === 0)
        return false;
    if (hasLiveSlip(e))
        return false;
    return e.mastery >= exports.ESTABLISHED_MASTERY;
}
/**
 * Has this learner demonstrated the concept with NO help at all?
 *
 * One answer is enough, in either mode: a hint-free practice answer and an
 * unaided answer on unfamiliar wording are the same proof, and the second is
 * strictly stronger, so requiring the first specifically would call a learner
 * who transferred a concept "unproved". Both counts are fold-owned, so a
 * learner whose work arrived from a device is judged exactly as one answering
 * live — which matters because this single fact decides the `prove` rung AND
 * the sentence a spaced review shows (see `next.reason.retrieveUnproved`).
 *
 * IT IS NOT THE LADDER'S GATE, and the two are deliberately different questions.
 * `stageOf` asks "has any of this work been done unaided?" — an approximation it
 * uses to decide what to serve next, written as `hintedAnswers >= attempts` and
 * pinned by the suite. This asks "has the learner demonstrated it, correctly,
 * without help?" — the only form in which a CLAIM about the learner may be
 * asserted, and the one a surface must consult. They diverge on exactly one
 * reachable record: answers taken with help plus a hint-free answer that was
 * WRONG. There the gate says "not all helped" while nothing has been proved, so
 * a sentence drawn from the gate would tell that learner they had proved it.
 * Changing the gate too is a pass of its own — it re-derives several pinned
 * ladder states — so it is not done silently while fixing a sentence.
 */
function provedUnaided(e) {
    return e.independentCorrect > 0 || e.transferCorrect > 0;
}
/**
 * Is this learner STUCK on a concept — the precondition for sending them back
 * to its foundations?
 *
 * Measured, below the established bar, and with at least one answer they got
 * wrong. All three are needed, and each excludes a real learner the others
 * would have mis-served:
 *
 *  - "measured" keeps UNKNOWN out of it. A concept nobody has asked about has
 *    no failed answers, so it can never read as stuck.
 *  - "below the bar" keeps a finished concept from being reopened by a detour.
 *  - "got one wrong" is the one that matters most. Accuracy earned with help
 *    sits above the bar (a hint costs little), so a learner who was right every
 *    time with scaffolding is NOT stuck and does not get a foundation detour —
 *    they get the rung that proves it (see `stageOf`). Without this clause the
 *    engine sent every such learner back a page instead of forward, which is
 *    exactly the failure `"correct but scaffolded"` exists to catch.
 */
function stuckOn(e) {
    return e.attempts > 0 && e.mastery < exports.ESTABLISHED_MASTERY && e.correct < e.attempts;
}
/**
 * The declared prerequisites of `conceptId` this learner has not established,
 * in the order the curriculum declares them.
 *
 * This is a real content relation (Concept.prereqs — 168 declared edges across
 * the bank), not a guess from ordering, so "repair the foundation first" names
 * a concept the content actually says the work depends on.
 */
function unmetPrerequisites(conceptId, state) {
    const c = (0, genome_1.getConcept)(conceptId);
    if (!c)
        return [];
    return (c.prereqs ?? []).filter((pid) => !prerequisiteMet(evidenceFor(state, pid) ?? undefined));
}
function evidenceFor(state, conceptId) {
    const c = (0, genome_1.getConcept)(conceptId);
    if (!c)
        return null;
    const p = state.progress[conceptId];
    const mastery = p?.mastery ?? 0;
    const attempts = p?.attempts ?? 0;
    const current = currentSlip(p);
    const lifetime = p?.misconceptions
        ? Object.entries(p.misconceptions).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
        : undefined;
    return {
        conceptId, subject: c.subject, title: c.title, mastery,
        confidence: p ? (0, retention_1.confidenceOf)(p) : null,
        attempts, correct: p?.correct ?? 0,
        hintedAnswers: p?.hinted ?? 0,
        topMisconception: current?.id ?? null,
        misconceptionHits: current?.hits ?? 0,
        lifetimeMisconception: lifetime ? { id: lifetime[0], hits: lifetime[1] } : null,
        lastSeen: p?.lastSeen ?? 0,
        status: statusOf(mastery, attempts),
        independentAsked: p?.independent?.asked ?? 0,
        independentCorrect: p?.independent?.correct ?? 0,
        transferAsked: p?.transfer?.asked ?? 0,
        transferCorrect: p?.transfer?.correct ?? 0,
        avgSeconds: p?.answers ? (p.totalMs ?? 0) / p.answers / 1000 : null,
    };
}
function buildSnapshot(state) {
    const evidence = Object.keys(state.progress)
        .map((cid) => evidenceFor(state, cid))
        .filter((e) => e !== null)
        .sort((a, b) => a.mastery - b.mastery);
    const ledger = new Map();
    for (const p of Object.values(state.progress)) {
        for (const [mid, hits] of Object.entries(p.misconceptions ?? {})) {
            ledger.set(mid, (ledger.get(mid) ?? 0) + hits);
        }
    }
    return {
        evidence,
        touched: evidence.length,
        strong: evidence.filter((e) => e.status === "strong").length,
        developing: evidence.filter((e) => e.status === "developing").length,
        learning: evidence.filter((e) => e.status === "learning").length,
        dueCount: (0, retention_1.dueReviews)(state).length,
        topMisconceptions: [...ledger.entries()]
            .map(([id, hits]) => ({ id, hits }))
            .sort((a, b) => b.hits - a.hits)
            .slice(0, 5),
    };
}
exports.DEMONSTRATED_ORDER = [
    "recalled", "applied", "transferred", "retained",
];
/** The label for one rung. The three that name a dimension borrow the words the
 *  rest of the product already uses for it; retention's key is spelled
 *  `evv.dim.retention` because that is the key its own row in the evidence
 *  record uses — one word, one key, wherever it is said. */
function demonstratedLabelKey(d) {
    return d === "retained" ? "evv.dim.retention" : `evv.dim.${d}`;
}
/** What this learner has demonstrated about one concept, and what remains. */
function demonstrationSplit(state, conceptId) {
    const e = evidenceFor(state, conceptId);
    const earned = {
        recalled: !!e && e.attempts > 0 && e.correct > 0,
        applied: !!e && provedUnaided(e),
        transferred: !!e && e.transferCorrect > 0,
        retained: (0, proof_1.retentionState)(state.progress[conceptId]?.retention) === "retained",
    };
    const demonstrated = exports.DEMONSTRATED_ORDER.filter((d) => earned[d]);
    const pending = exports.DEMONSTRATED_ORDER.filter((d) => !earned[d]);
    return { demonstrated, pending, next: pending[0] ?? null };
}
function conceptStanding(state, conceptId) {
    const split = demonstrationSplit(state, conceptId);
    const e = evidenceFor(state, conceptId);
    const unmeasured = !e || e.attempts === 0;
    const done = !!e && conceptDone(e, transfer_1.canTransfer);
    return {
        conceptId,
        stage: e ? stageOf(e) : "unmeasured",
        demonstrated: split.demonstrated,
        pending: split.pending,
        next: split.next,
        unmeasured,
        blockedBy: unmetPrerequisites(conceptId, state),
        done,
        proved: e
            ? (0, proof_1.strongestProof)({
                correct: e.correct,
                independentCorrect: e.independentCorrect,
                transferCorrect: e.transferCorrect,
                retentionCorrect: state.progress[conceptId]?.retention?.correct ?? 0,
            })
            : null,
        mark: done ? "done" : unmeasured ? "unstarted" : "underway",
    };
}
