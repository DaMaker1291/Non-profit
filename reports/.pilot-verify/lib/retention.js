"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// The learner model's time dimension: retention scheduling, confidence and
// weak links. Everything here is computed from genuinely recorded progress —
// no estimates, no simulated data. Pure functions; safe on client and server.
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewIntervalDays = reviewIntervalDays;
exports.dueReviews = dueReviews;
exports.isRetentionDue = isRetentionDue;
exports.confidenceOf = confidenceOf;
exports.weakLinks = weakLinks;
const genome_1 = require("./genome");
const DAY = 24 * 60 * 60 * 1000;
/** Spaced-repetition ladder: mastered concepts return for review after 30
 *  days; shakier ones come back sooner. Below 0.3 the concept is still in
 *  active learning, not scheduled for retention. */
function reviewIntervalDays(mastery) {
    if (mastery >= 0.9)
        return 30;
    if (mastery >= 0.75)
        return 7;
    if (mastery >= 0.5)
        return 2;
    if (mastery >= 0.3)
        return 1;
    return null;
}
/** Concepts whose retention window has elapsed, most overdue first. */
function dueReviews(state, now = Date.now()) {
    const out = [];
    for (const [conceptId, p] of Object.entries(state.progress)) {
        if (!p.lastSeen || p.attempts === 0)
            continue;
        const days = reviewIntervalDays(p.mastery);
        if (days === null)
            continue;
        const dueAt = p.lastSeen + days * DAY;
        if (now >= dueAt)
            out.push({ conceptId, overdueBy: (now - dueAt) / DAY, mastery: p.mastery });
    }
    return out.sort((a, b) => b.overdueBy - a.overdueBy);
}
/**
 * Is THIS concept due for spaced review?
 *
 * The serve path's one question, kept here so the answer lives beside the
 * schedule that produces it: a concept is due when its own mastery bucket's
 * interval has elapsed. Nothing a client sends can make a concept due — which
 * is what stops retention credit from being claimed rather than earned.
 */
function isRetentionDue(state, conceptId, now = Date.now()) {
    return dueReviews(state, now).some((d) => d.conceptId === conceptId);
}
/**
 * Confidence separates "answered correctly" from "answered fluently".
 * Signals, all real: fast-growing streaks and mostly-first-try accuracy with
 * few hints raise it; frequent hint requests and high attempt counts per
 * correct answer lower it. Returns 0–1, or null when there is not enough
 * evidence to say anything (fewer than 3 attempts) — honesty over vibes.
 *
 * THE HINT SIGNAL IS FOLD-OWNED. This read `ConceptProgress.hints`, the
 * per-level tally the hint endpoint writes and the fold drops, so the penalty
 * below never applied to a learner whose work arrived from a device — their
 * confidence came back with the help silently forgiven, and that number is
 * displayed on the Mind map, on Progress and in the next-step card's own
 * evidence line. `hinted` (answers that took help) is what the ledger can
 * reproduce, so it is what this reads; the ratio is "share of answers that
 * needed help", which is the same quantity in the form the record can prove.
 */
function confidenceOf(p) {
    if (p.attempts < 3)
        return null;
    const accuracy = p.correct / p.attempts;
    const hintsPerAttempt = (p.hinted ?? 0) / p.attempts;
    const streakBonus = Math.min(0.15, p.streak * 0.03);
    // Each hint per attempt costs 6 points of confidence; thin accuracy costs more.
    const raw = accuracy + streakBonus - hintsPerAttempt * 0.06;
    return Math.max(0, Math.min(1, raw));
}
/**
 * The dashboard's "weak links": concepts worth attention next, ranked from
 * the student's own record. A concept enters the list for one of four
 * evidence-backed reasons — low mastery, a fading retention window, a
 * recurring misconception, or low confidence despite correct answers.
 */
function weakLinks(state, subject, now = Date.now()) {
    const out = [];
    for (const [conceptId, p] of Object.entries(state.progress)) {
        const c = (0, genome_1.getConcept)(conceptId);
        if (!c || p.attempts === 0)
            continue;
        if (subject && c.subject !== subject)
            continue;
        if (p.mastery >= 0.9)
            continue; // mastered concepts stay out of the list
        const reasons = [];
        let score = 0;
        if (p.mastery < 0.5) {
            reasons.push("lowMastery");
            score += (0.5 - p.mastery) * 2; // 0–1
        }
        const days = reviewIntervalDays(p.mastery);
        if (days !== null && p.lastSeen) {
            const overdue = (now - (p.lastSeen + days * DAY)) / DAY;
            if (overdue > 0) {
                reasons.push("fading");
                score += Math.min(0.5, overdue * 0.1);
            }
        }
        const worstMisc = Math.max(0, ...Object.values(p.misconceptions));
        if (worstMisc >= 2) {
            reasons.push("misconception");
            score += Math.min(0.4, worstMisc * 0.08);
        }
        const conf = confidenceOf(p);
        if (conf !== null && conf < 0.6) {
            reasons.push("lowConfidence");
            score += (0.6 - conf) * 0.5;
        }
        if (reasons.length > 0)
            out.push({ conceptId, subject: c.subject, score, reasons, mastery: p.mastery });
    }
    return out.sort((a, b) => b.score - a.score);
}
