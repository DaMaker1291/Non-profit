"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PILOT_TEST_APPROVALS = exports.PILOT_LESSON_VERSION = exports.PILOT_APPROVALS = exports.PILOT_SUPPORTED_LANGUAGES = exports.PILOT_CONCEPT_IDS = exports.PILOT_SEQUENCE = exports.CBSE_X_PILOT = void 0;
exports.pilotLanguageSupported = pilotLanguageSupported;
exports.pilotApprovals = pilotApprovals;
exports.planGaps = planGaps;
exports.approvalProblems = approvalProblems;
exports.lessonStatus = lessonStatus;
exports.approvedPilotPath = approvedPilotPath;
exports.reviewQueue = reviewQueue;
exports.pilotCoverage = pilotCoverage;
exports.pilotConcept = pilotConcept;
exports.isPilotConcept = isPilotConcept;
exports.pilotWordCount = pilotWordCount;
// ─────────────────────────────────────────────────────────────────────────────
// THE PILOT — what is actually allowed in front of a learner, and what is not.
//
// The deployment audit found the product's most dangerous educational defect:
// before the supplemental plans, 120 of 135 concepts rendered a 31–58 word
// genome summary in the same visual position as a complete lesson. Nothing on
// the page said "this is not a lesson", so a learner — and a visiting teacher —
// could reasonably read it as one. This module is the single answer to that
// question, and it still distinguishes a complete plan from a reviewed one.
//
// FOUR STATES, and they are deliberately not a percentage:
//
//   draft                 — a plan exists but is not complete enough to review.
//   needs-educator-review — a complete authored plan, with no qualified reviewer.
//   approved-for-pilot    — a real reviewer signed THIS lesson version for THIS
//                           scope (curriculum, level and language).
//   unavailable-for-pilot — no complete plan. The genome paragraph is background
//                           material, never teaching.
//
// APPROVAL IS NOT A PROPERTY OF "THE LESSON" IN GENERAL. A lesson approved for
// CBSE Class 10 English is not thereby approved for ICSE, for Class 9, or for
// Hindi. The approval record carries the scope and the version, and a mismatch
// refuses it. `PILOT_APPROVALS` is empty on purpose: a coding agent cannot
// substitute for a subject teacher, and this file must never invent a name or a
// date to make a dashboard green.
// ─────────────────────────────────────────────────────────────────────────────
const genome_1 = require("./genome");
const lesson_plans_1 = require("./lesson-plans");
exports.CBSE_X_PILOT = {
    id: "cbse-10-maths-science-en",
    title: "CBSE Class 10 (with the Class 9 cell prerequisite) — Mathematics and Science (English medium)",
    country: "IN",
    board: "CBSE",
    specId: "in-cbse",
    levelId: "class10",
    curriculumEdition: "CBSE Curriculum 2025–26",
    language: "en",
    subjects: ["maths", "physics", "chemistry", "biology"],
    excludes: [
        "ICSE, state boards and every other country",
        "Hindi, Bengali, Urdu and every other medium of instruction",
        "the 116 concepts outside this 12-lesson path, including every supplemental lesson",
        "any claim of full CBSE syllabus coverage",
        "any school, teacher or learner partnership",
    ],
    status: "candidate",
};
/** The 12 lessons this candidate pack proposes. EIGHT mathematics concepts are
 *  already in the reviewed CBSE Class X mapping (`lib/curricula/mappings.ts`)
 *  and already have plans. FOUR science concepts are authored for this pack and
 *  mapped to named CBSE Class X units in `lib/pilot-mappings.ts`.
 *
 *  The order is a teaching order, not an alphabetical one: number sense →
 *  algebra → graphs, with science concepts placed where their prerequisites
 *  are already met. */
exports.PILOT_SEQUENCE = [
    // Mathematics — number foundations then algebra and graphs.
    "fractions",
    "decimals",
    "negatives",
    "order-ops",
    "algebra-expand",
    "linear-equations",
    "quadratics",
    "coordinates",
    // Science — each mapped to a named CBSE Class X unit.
    "cells",
    "photosynthesis",
    "equations-stoich",
    "electricity-circuits",
];
exports.PILOT_CONCEPT_IDS = exports.PILOT_SEQUENCE;
/** THE TEACHING LANGUAGES THIS BUILD ACTUALLY SUPPORTS, DERIVED FROM THE PLANS.
 *
 *  This used to be the literal `["en"]`, and it was true when it was written:
 *  no plan had a translation. It stopped being true the moment the French
 *  `fractions` plan landed, and nothing failed — `lessonStatus("fractions",
 *  "fr")` called a French lesson "authored in English" while the page rendered
 *  the French text. A hand-kept list beside the translations is the same defect
 *  as a hand-kept list beside the dictionaries: it describes a previous version
 *  of the thing next to it. Derived here, so a language is supported the moment
 *  a complete translation exists and not one moment before. */
exports.PILOT_SUPPORTED_LANGUAGES = [
    "en",
    ...Object.keys(lesson_plans_1.LESSON_PLANS).flatMap((id) => (0, lesson_plans_1.teachingLanguages)(id)),
].filter((l, i, all) => all.indexOf(l) === i).sort();
function pilotLanguageSupported(lang) {
    return exports.PILOT_SUPPORTED_LANGUAGES.includes(lang);
}
/** NO APPROVALS EXIST. This is the truthful state until a qualified teacher
 *  reviews a lesson and supplies their own name, role and date. */
exports.PILOT_APPROVALS = [];
/** A content version. Bump this whenever any pilot lesson changes; an approval
 *  for an older version no longer applies. */
exports.PILOT_LESSON_VERSION = "2026-11-01.3";
/** TEST-ONLY APPROVALS, AND THEY ARE NOT A REVIEW.
 *
 *  The browser walks need to exercise the assignment loop, and a real teacher
 *  has not signed any lesson for this build. This registry exists so the walk
 *  can run against the real gate instead of bypassing it: the records are
 *  deliberately named as test fixtures, the registry is empty in production,
 *  and it is read only when `OPENMIND_TEST_CONTENT_APPROVALS=1` in a
 *  non-production process. `PILOT_APPROVALS` stays empty — the product's own
 *  answer to "may a class be set this lesson?" remains no.
 *
 *  The two concepts are the ones `scripts/ui-walk-teacher.mjs` sets. The
 *  approval is scoped to the candidate CBSE scope and the current lesson
 *  version, like every real approval, so the gate still checks the shape it
 *  will check when a qualified reviewer supplies one. */
exports.PILOT_TEST_APPROVALS = [
    "fractions",
    "negatives",
].map((conceptId) => ({
    conceptId,
    scopeId: exports.CBSE_X_PILOT.id,
    lessonVersion: exports.PILOT_LESSON_VERSION,
    reviewer: "OpenMind test fixture",
    reviewerRole: "automated test fixture — not a subject review",
    reviewedAt: "2026-11-01",
    notes: "Test-only approval used by the browser walk; never a claim of review.",
    checklist: {
        subjectAccuracy: true,
        explanationQuality: true,
        workedExamples: true,
        questionsAndMarking: true,
        diagramQuality: true,
        languageAndTerminology: true,
        ageAppropriateness: true,
        accessibility: true,
    },
}));
/** The approvals in force for this process. Production always reads the real,
 *  empty registry; the fixture is reachable only from an explicit development
 *  test run. */
function pilotApprovals() {
    const testRun = process.env.NODE_ENV !== "production"
        && process.env.OPENMIND_TEST_CONTENT_APPROVALS === "1";
    return testRun ? [...exports.PILOT_APPROVALS, ...exports.PILOT_TEST_APPROVALS] : exports.PILOT_APPROVALS;
}
/** What a complete plan must carry before anybody can review it. This is a
 *  STRUCTURAL check, not a subject review: it can say a plan has four idea
 *  paragraphs and a trap explanation, and it cannot say the physics is right. */
function planGaps(plan) {
    if (!plan)
        return [{ field: "plan", problem: "no authored plan" }];
    const gaps = [];
    const need = (field, value, min) => {
        if (value.trim().length < min)
            gaps.push({ field, problem: `shorter than ${min} characters` });
    };
    need("objective", plan.objective, 20);
    need("intuition", plan.intuition, 80);
    if (plan.idea.length < 4)
        gaps.push({ field: "idea", problem: "fewer than four idea paragraphs" });
    plan.idea.forEach((p, i) => need(`idea[${i}]`, p, 40));
    if (plan.traps.length < 3)
        gaps.push({ field: "traps", problem: "fewer than three named traps" });
    plan.traps.forEach((tr, i) => {
        need(`traps[${i}].move`, tr.move, 8);
        need(`traps[${i}].why`, tr.why, 30);
    });
    need("usedFor", plan.usedFor, 20);
    if (plan.figure)
        need("figure.caption", plan.figure.caption, 30);
    for (const [i, ex] of (plan.workedExamples ?? []).entries()) {
        need(`workedExamples[${i}].prompt`, ex.prompt, 8);
        if (ex.steps.length < 2)
            gaps.push({ field: `workedExamples[${i}].steps`, problem: "fewer than two steps" });
        ex.steps.forEach((s, j) => need(`workedExamples[${i}].steps[${j}]`, s, 8));
        need(`workedExamples[${i}].answer`, ex.answer, 2);
    }
    for (const [i, term] of (plan.terms ?? []).entries()) {
        need(`terms[${i}].term`, term.term, 2);
        need(`terms[${i}].meaning`, term.meaning, 15);
    }
    return gaps;
}
function approvalFor(conceptId, scopeId, approvals = exports.PILOT_APPROVALS) {
    return approvals.find((a) => a.conceptId === conceptId && a.scopeId === scopeId && a.lessonVersion === exports.PILOT_LESSON_VERSION) ?? null;
}
/** Is every checklist item true, and does the record name a real reviewer and
 *  date? Exported so the gate can plant a fake approval and watch it fail. */
function approvalProblems(a, plan) {
    const problems = [];
    if (!a.reviewer || a.reviewer.trim().length < 2)
        problems.push("reviewer name missing");
    if (!a.reviewerRole || a.reviewerRole.trim().length < 2)
        problems.push("reviewer role missing");
    if (!a.reviewedAt || !Number.isFinite(Date.parse(a.reviewedAt)))
        problems.push("review date is not a date");
    if (a.scopeId !== exports.CBSE_X_PILOT.id)
        problems.push("approval is for a different scope");
    if (a.lessonVersion !== exports.PILOT_LESSON_VERSION)
        problems.push("approval is for a different lesson version");
    if (!plan)
        problems.push("no plan to approve");
    const unchecked = Object.entries(a.checklist).filter(([, v]) => v !== true).map(([k]) => k);
    if (unchecked.length)
        problems.push(`checklist incomplete: ${unchecked.join(", ")}`);
    return problems;
}
/** The state of one concept IN THIS PILOT. `lang` is the requested teaching
 *  language, not the interface language: an English plan read under an Urdu
 *  interface is not an Urdu lesson. */
function lessonStatus(conceptId, lang = "en", scope = exports.CBSE_X_PILOT, 
/** Injected ONLY by the gate, so the approved branch can be driven with a
 *  synthetic record. The product always uses the empty real registry above. */
approvals = pilotApprovals()) {
    // THE PLAN IN THE LANGUAGE THE LESSON IS TAUGHT IN, not the English one.
    // `planFor` falls back to English when no complete translation exists; the
    // language branch below is what stops that fallback from being reported as a
    // lesson in the requested language.
    const plan = (0, lesson_plans_1.planFor)(conceptId, lang);
    const inScope = exports.PILOT_SEQUENCE.includes(conceptId);
    const gaps = planGaps(plan);
    const reasons = [];
    let state;
    if (!plan) {
        state = "unavailable-for-pilot";
        reasons.push("No complete authored lesson exists. The genome summary is background material, not teaching.");
    }
    else if (gaps.length > 0) {
        state = "draft";
        reasons.push("The authored plan is structurally incomplete.");
    }
    else if (lang !== "en" && !(0, lesson_plans_1.teachingLanguages)(conceptId).includes(lang)) {
        // A complete English lesson is not a complete Urdu lesson. The PAGE renders
        // the English fallback with a note; the pilot status refuses to call it a
        // lesson in the requested language. Per CONCEPT, not from a global list: a
        // `fr` translation of `fractions` is not an `fr` translation of `surds`.
        state = "needs-educator-review";
        reasons.push(`No complete ${lang} lesson exists for this concept; the English lesson is shown instead.`);
    }
    else if (!inScope) {
        state = "needs-educator-review";
        reasons.push("A complete lesson plan, but outside the 12-lesson CBSE pilot scope.");
    }
    else {
        const approval = approvalFor(conceptId, scope.id, approvals);
        if (!approval) {
            state = "needs-educator-review";
            reasons.push("No qualified subject teacher has signed this lesson for this scope.");
        }
        else {
            const problems = approvalProblems(approval, plan);
            if (problems.length) {
                state = "needs-educator-review";
                reasons.push(...problems);
            }
            else {
                state = "approved-for-pilot";
                reasons.push(`Approved by ${approval.reviewer} (${approval.reviewerRole}) on ${approval.reviewedAt}.`);
            }
        }
    }
    return { conceptId, state, inScope, plan, reasons, gaps, version: exports.PILOT_LESSON_VERSION };
}
/** ONLY approved lessons may enter the learner-facing pilot path. Today this is
 *  empty, and that is the honest answer, not a bug to work around. */
function approvedPilotPath(scope = exports.CBSE_X_PILOT, approvals = pilotApprovals()) {
    return exports.PILOT_SEQUENCE.filter((id) => lessonStatus(id, scope.language, scope, approvals).state === "approved-for-pilot");
}
/** The review queue: complete authored candidates that are not approved. */
function reviewQueue(scope = exports.CBSE_X_PILOT) {
    return exports.PILOT_SEQUENCE.map((id) => lessonStatus(id, scope.language, scope))
        .filter((s) => s.inScope && s.state === "needs-educator-review");
}
function pilotCoverage(scope = exports.CBSE_X_PILOT) {
    const rows = exports.PILOT_SEQUENCE.map((id) => lessonStatus(id, scope.language, scope));
    return {
        total: rows.length,
        approved: rows.filter((r) => r.state === "approved-for-pilot").length,
        needsReview: rows.filter((r) => r.state === "needs-educator-review").length,
        draft: rows.filter((r) => r.state === "draft").length,
        unavailable: rows.filter((r) => r.state === "unavailable-for-pilot").length,
    };
}
/** Concept metadata for the teacher surface. Null for a concept that is not in
 *  the pack, so a typo cannot silently produce an empty preview. */
function pilotConcept(conceptId) {
    if (!exports.PILOT_SEQUENCE.includes(conceptId))
        return null;
    return genome_1.CONCEPTS_BY_ID[conceptId] ?? null;
}
function isPilotConcept(conceptId) {
    return exports.PILOT_SEQUENCE.includes(conceptId);
}
/** The word count of a plan, re-exported so the gate and the teacher packet
 *  read the product's own measure rather than a second one. */
function pilotWordCount(plan) {
    return (0, lesson_plans_1.planWordCount)(plan);
}
