"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION BANK — provenance, three pools, and deterministic selection.
//
// The division this module exists to enforce:
//
//   past papers MEASURE · authored questions TEACH · unseen questions VERIFY
//
// So there are three pools, and they are not interchangeable:
//
//   · "diagnostic"  — probes used to find the learner's boundary. An item
//                     exposed here is spent: re-serving it to the same learner
//                     would let a later "improvement" be nothing but memory.
//   · "practice"    — the teaching pool. Re-exposure is the point.
//   · "assessment"  — independent verification. Never re-served either.
//
// ── ON COPYRIGHT, STATED PLAINLY ────────────────────────────────────────────
// `source` distinguishes an OpenMind-authored item from an official board
// question. THE BUNDLED BANK CONTAINS NO OFFICIAL BOARD QUESTIONS — none are
// licensed to this project, and scraping them is not an option. `OFFICIAL_ITEMS`
// is therefore 0, and every surface that shows provenance says "OpenMind-authored
// to <board> <spec>". The type, the provenance record and the pools exist so
// that adding licensed content is a DATA change (drop items in with
// `source: "official_past_paper"` and their real paper/season/question numbers)
// rather than an architecture change. Nothing here may claim an item is an
// official past-paper question when it is not: that is the one line this file
// must never blur.
//
// ── WHAT THE BLUEPRINT CAN HONESTLY BE ──────────────────────────────────────
// The specification layer (lib/specifications.ts) encodes each qualification's
// COVERAGE WINDOW over the genome — not a board's named topic taxonomy. So the
// diagnostic blueprint is written over the genome's STAGE bands and the
// concepts the spec actually covers. Inventing "4.3.1 Infection and response"
// headings would make the blueprint look more authoritative than the data is.
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPAIR_MISCONCEPTION_HITS = exports.REPAIR_MIN_ATTEMPTS = exports.REPAIR_ACCURACY = exports.STRETCH_ACCURACY = exports.STRETCH_STREAK = exports.PRACTICE_MIN = exports.PRACTICE_MAX = exports.DIAGNOSTIC_ITEMS = exports.AUTHORED_MARKS = exports.DRAWS_PER_CONCEPT = exports.DEMONSTRATED_FLOOR = exports.SETTLED_BOUND = exports.CONFIDENCE_MEDIUM_MAX_HW = exports.CONFIDENCE_HIGH_MAX_HW = exports.difficultyBandFor = exports.skillRank = exports.skillForDifficulty = exports.bandReachable = exports.SKILL_MIX = exports.SKILLS_NOT_IN_BANK = exports.SKILLS_IN_BANK = exports.SKILL_MIN_DIFFICULTY = exports.SKILL_LADDER = exports.OFFICIAL_ITEMS = void 0;
exports.commandWordFor = commandWordFor;
exports.estimateEvidence = estimateEvidence;
exports.estimateFromProgress = estimateFromProgress;
exports.settledSide = settledSide;
exports.estimateIsDecided = estimateIsDecided;
exports.bandDemonstrated = bandDemonstrated;
exports.makeItemId = makeItemId;
exports.candidateSeeds = candidateSeeds;
exports.itemFor = itemFor;
exports.declareQuestion = declareQuestion;
exports.exposureOf = exposureOf;
exports.hasSeen = hasSeen;
exports.markSpent = markSpent;
exports.poolAllowsReuse = poolAllowsReuse;
exports.isUsable = isUsable;
exports.buildBlueprint = buildBlueprint;
exports.skillQuotaFor = skillQuotaFor;
exports.targetDifficulty = targetDifficulty;
exports.practiceTarget = practiceTarget;
exports.scoreCandidate = scoreCandidate;
exports.selectDiagnosticQuestion = selectDiagnosticQuestion;
exports.blueprintConcepts = blueprintConcepts;
const genome_1 = require("./genome");
const specifications_1 = require("./specifications");
const questions_1 = require("./questions");
Object.defineProperty(exports, "difficultyBandFor", { enumerable: true, get: function () { return questions_1.difficultyBandFor; } });
/** Official items present in this deployment. Zero, and honestly so. */
exports.OFFICIAL_ITEMS = 0;
// ── Skills ──────────────────────────────────────────────────────────────────
// The demand ladder now lives in its own module (lib/skills.ts) because the
// question SERVE aims items at a demand level and the diagnostic REPORT buckets
// answers into one — and those two disagreeing is how a sitting ends with a
// band the course can express reported as unmeasured. Re-exported here so every
// existing consumer keeps importing it from the bank.
const skills_1 = require("./skills");
Object.defineProperty(exports, "SKILL_LADDER", { enumerable: true, get: function () { return skills_1.SKILL_LADDER; } });
Object.defineProperty(exports, "SKILL_MIN_DIFFICULTY", { enumerable: true, get: function () { return skills_1.SKILL_MIN_DIFFICULTY; } });
Object.defineProperty(exports, "SKILLS_IN_BANK", { enumerable: true, get: function () { return skills_1.SKILLS_IN_BANK; } });
Object.defineProperty(exports, "SKILLS_NOT_IN_BANK", { enumerable: true, get: function () { return skills_1.SKILLS_NOT_IN_BANK; } });
Object.defineProperty(exports, "SKILL_MIX", { enumerable: true, get: function () { return skills_1.SKILL_MIX; } });
Object.defineProperty(exports, "bandReachable", { enumerable: true, get: function () { return skills_1.bandReachable; } });
Object.defineProperty(exports, "skillForDifficulty", { enumerable: true, get: function () { return skills_1.skillForDifficulty; } });
Object.defineProperty(exports, "skillRank", { enumerable: true, get: function () { return skills_1.skillRank; } });
/** The command word a board would use at this demand level. Authored items are
 *  written to the word, so the label is descriptive rather than decorative. */
function commandWordFor(skill) {
    switch (skill) {
        case "recall": return "state";
        case "application": return "apply";
        case "multi_step": return "solve";
        case "data_interpretation": return "interpret";
        case "extended_response": return "explain";
    }
}
const Z_95 = 1.96;
/** Interval half-widths that buy each confidence label. Calibrated against real
 *  records, not chosen for feel:
 *    · 2/2 correct → half-width 0.38 → LOW      (two answers prove nothing)
 *    · 6/6 correct → half-width 0.25 → MEDIUM
 *    · 12/12       → half-width 0.16 → HIGH
 *    · 1/1 correct → half-width 0.44 → LOW
 *  A perfect record needs ~12 clean answers before the claim is precise.
 *  (`npm run verify` asserts each of those rows.) */
exports.CONFIDENCE_HIGH_MAX_HW = 0.18;
exports.CONFIDENCE_MEDIUM_MAX_HW = 0.3;
/** The product's own weak/strong line — the threshold the plan switches on at
 *  0.65 mastery. Estimates are judged against the line they will actually be
 *  used to decide, not against a number invented for statistics. */
exports.SETTLED_BOUND = 0.65;
/** The lower bound an interval must clear before a demand band counts as
 *  DEMONSTRATED. Deliberately weaker than SETTLED_BOUND, and defensible
 *  because the ladder's own band rule already accepts a clean two-answer pair
 *  as proof of a band: this asks for more than that (the interval's floor above
 *  evens), just over the whole session instead of one concept. */
exports.DEMONSTRATED_FLOOR = 0.5;
/**
 * Estimate from answered items.
 *
 * `sources` is collected rather than assumed, so an estimate over licensed
 * board items cannot render as though it were built on authored practice.
 */
function estimateEvidence(rows) {
    const attempts = rows.length;
    const correct = rows.filter((r) => r.correct).length;
    if (attempts === 0) {
        return { value: null, attempts: 0, correct: 0, measured: false, confidence: "insufficient", interval: null, sources: [] };
    }
    const z2 = Z_95 * Z_95;
    const nAdj = attempts + z2;
    const pAdj = (correct + z2 / 2) / nAdj;
    const halfWidth = Z_95 * Math.sqrt((pAdj * (1 - pAdj)) / nAdj);
    return {
        value: correct / attempts,
        attempts,
        correct,
        measured: true,
        confidence: halfWidth <= exports.CONFIDENCE_HIGH_MAX_HW ? "high"
            : halfWidth <= exports.CONFIDENCE_MEDIUM_MAX_HW ? "medium" : "low",
        interval: [Math.max(0, pAdj - halfWidth), Math.min(1, pAdj + halfWidth)],
        sources: [...new Set(rows.map((r) => r.source ?? "openmind_authored"))].sort(),
    };
}
/** The same estimate for a concept's stored record — used by the selector and
 *  by any surface that wants the concept's own confidence, not a demand row's. */
function estimateFromProgress(p) {
    const attempts = Math.max(0, Math.floor(p?.attempts ?? 0));
    const correct = Math.min(attempts, Math.max(0, Math.floor(p?.correct ?? 0)));
    return estimateEvidence(Array.from({ length: attempts }, (_, i) => ({ correct: i < correct, source: "openmind_authored" })));
}
/**
 * Which side of `bound` the evidence has settled on.
 *
 * "above"/"below" mean the interval does not straddle the line, so no single
 * further answer can move the learner across it: the measurement is done and
 * another probe there would spend a question to learn nothing. null means the
 * learner is genuinely near the boundary — the one case worth probing.
 */
function settledSide(e, bound = exports.SETTLED_BOUND) {
    if (!e.measured || !e.interval)
        return null;
    if (e.interval[0] >= bound)
        return "above";
    if (e.interval[1] <= bound)
        return "below";
    return null;
}
/** Would another probe be unable to change the decision? Then don't spend one. */
function estimateIsDecided(e, bound = exports.SETTLED_BOUND) {
    return !!e && settledSide(e, bound) !== null;
}
/** Has this demand band been demonstrated well enough that a FRESH concept need
 *  not re-prove it? Only the strong direction skips: a band settled weak must
 *  still be probed on every concept, because "has not shown it" is a reason to
 *  teach, never a reason to stop looking. */
function bandDemonstrated(e) {
    if (!e || !e.measured || !e.interval)
        return false;
    return e.interval[0] > exports.DEMONSTRATED_FLOOR;
}
function makeItemId(conceptId, seed) {
    return `${conceptId}:${seed}`;
}
/** How many alternative draws a concept is asked for before the selection gives
 *  up on it. Generators have fixed difficulty ranges, so the band the blueprint
 *  wants may not be reachable from the first salt. */
exports.DRAWS_PER_CONCEPT = 3;
/**
 * The salts tried for one concept within a session.
 *
 * Exported so that the exposure ledger, the selection and any auditor agree on
 * EXACTLY which item ids a session could have produced. The salts used to be
 * derived inline in the selector, which meant "which items could this session
 * have chosen?" had no single answer — and a spent-item check that disagrees
 * with the item actually served is worse than no check at all.
 */
function candidateSeeds(sessionSeed, conceptId) {
    return Array.from({ length: exports.DRAWS_PER_CONCEPT }, (_, attempt) => (0, questions_1.hashSeed)(`${sessionSeed}:${conceptId}:${attempt}`).toString(36));
}
/** Marks an item is worth. Authored items are single-answer questions: 1 mark
 *  is the honest value, and pretending otherwise would inflate every total.
 *  Official items carry their own marks from the paper. */
exports.AUTHORED_MARKS = 1;
/**
 * Build the bank item for a served question. `subject`/`spec` decide the
 * provenance; the item's skill and band come from its real difficulty.
 */
function itemFor(conceptId, seed, difficulty, active, pool, tags = []) {
    const c = (0, genome_1.getConcept)(conceptId);
    const skill = (0, skills_1.skillForDifficulty)(difficulty);
    return {
        id: makeItemId(conceptId, seed),
        conceptId,
        subject: c?.subject ?? "maths",
        pool,
        skill,
        difficultyBand: (0, questions_1.difficultyBandFor)(difficulty),
        difficulty,
        commandWord: commandWordFor(skill),
        // An authored item cannot be worth more than one mark: it is one answer.
        marks: exports.AUTHORED_MARKS,
        misconceptionTags: tags,
        provenance: {
            source: "openmind_authored",
            board: active.spec.board,
            specId: active.spec.id,
            qualification: `${active.spec.name}${active.level.name ? ` ${active.level.name}` : ""}`,
        },
    };
}
function declareQuestion(q) {
    const c = (0, genome_1.getConcept)(q.conceptId);
    return {
        conceptId: q.conceptId,
        subject: c?.subject ?? "maths",
        skill: (0, skills_1.skillForDifficulty)(q.difficulty),
        difficulty: q.difficulty,
        marking: q.responseKind ?? "choice",
        marks: exports.AUTHORED_MARKS,
        misconceptions: q.misconceptionTags ?? [],
        explanation: q.explanation ?? "",
    };
}
function exposureOf(state) {
    return { seen: state.seenQuestions ?? {} };
}
function hasSeen(ledger, itemId) {
    return Object.prototype.hasOwnProperty.call(ledger.seen, itemId);
}
/** Mark an item as spent. Idempotent: the FIRST exposure is the one recorded,
 *  so the age of a question's use never resets. */
function markSpent(ledger, itemId, at) {
    if (!hasSeen(ledger, itemId))
        ledger.seen[itemId] = at;
}
/** May this pool re-serve an item the learner has already met?
 *  Practice may — repetition is how a skill is built. Diagnostic and
 *  assessment may NOT — that is what makes them measurements. */
function poolAllowsReuse(pool) {
    return pool === "practice";
}
/** Whether an item is usable for this learner in this pool. */
function isUsable(item, ledger) {
    return poolAllowsReuse(item.pool) || !hasSeen(ledger, item.id);
}
/** Default size of a baseline diagnostic. Twenty probes is the point at which
 *  coverage starts costing more time than it buys; the ladder may stop sooner. */
exports.DIAGNOSTIC_ITEMS = 20;
/**
 * Build the blueprint for a qualification.
 *
 * Two things it must not do:
 *   1. Demand a topic the specification does not cover. Quotas are drawn from
 *      the coverage the spec layer actually resolves against the genome.
 *   2. Demand more items than the coverage can supply. When the spec is far
 *      narrower than the requested total, `shortfall` reports the gap and the
 *      quotas are scaled down — never filled by repeating a topic.
 */
function buildBlueprint(active, subject, total = exports.DIAGNOSTIC_ITEMS, servable = () => true) {
    const inSpec = (0, specifications_1.coverageOf)(active)
        .filter((c) => c.subject === subject && servable(c.id))
        .map((c) => c.id);
    // Group by the genome's stage band, ascending — the order a course teaches.
    const byStage = new Map();
    for (const id of inSpec) {
        const c = (0, genome_1.getConcept)(id);
        if (!c)
            continue;
        const list = byStage.get(c.stage) ?? [];
        list.push(id);
        byStage.set(c.stage, list);
    }
    const stages = [...byStage.keys()].sort((a, b) => a - b);
    if (stages.length === 0) {
        return {
            specId: active.spec.id, subject, board: active.spec.board, total: 0,
            topics: [], skillQuota: emptySkillQuota(), shortfall: total,
        };
    }
    // Even spread, remainder to the earlier bands (a course is examined on its
    // foundations more heavily than its frontier), capped by what each band has.
    const share = Math.floor(total / stages.length);
    let remainder = total % stages.length;
    const topics = stages.map((stage) => {
        const concepts = byStage.get(stage) ?? [];
        const want = share + (remainder-- > 0 ? 1 : 0);
        return { stage, concepts, quota: Math.min(want, concepts.length) };
    });
    const supply = topics.reduce((s, t) => s + t.concepts.length, 0);
    const wanted = topics.reduce((s, t) => s + t.quota, 0);
    // Redistribute a band's unused quota to bands with concepts to spare, so a
    // narrow band does not silently shrink the diagnostic.
    let deficit = wanted - supply > 0 ? 0 : Math.min(total, supply) - wanted;
    for (const t of topics) {
        if (deficit <= 0)
            break;
        const room = t.concepts.length - t.quota;
        const take = Math.min(room, deficit);
        t.quota += take;
        deficit -= take;
    }
    const planned = topics.reduce((s, t) => s + t.quota, 0);
    return {
        specId: active.spec.id, subject, board: active.spec.board,
        total: planned,
        topics,
        skillQuota: skillQuotaFor(planned),
        shortfall: Math.max(0, total - planned),
    };
}
function emptySkillQuota() {
    return { recall: 0, application: 0, multi_step: 0, data_interpretation: 0, extended_response: 0 };
}
/** Integer targets from the mix, with the extended-response share REDISTRIBUTED
 *  rather than dropped: the bank cannot write one, so pretending to save a slot
 *  for it would leave the diagnostic smaller than advertised. */
function skillQuotaFor(total) {
    const q = emptySkillQuota();
    const mixTotal = skills_1.SKILLS_IN_BANK.reduce((s, k) => s + skills_1.SKILL_MIX[k], 0);
    let assigned = 0;
    for (const k of skills_1.SKILLS_IN_BANK) {
        const n = Math.floor((skills_1.SKILL_MIX[k] / mixTotal) * total);
        q[k] = n;
        assigned += n;
    }
    // Hand the rounding remainder to the highest-demand producible skill, which
    // is where a diagnostic learns the most.
    q.data_interpretation += Math.max(0, total - assigned);
    q.extended_response = 0;
    return q;
}
/** The target difficulty a probe aims at. The diagnostic is NOT a hard test:
 *  it seeks the learner's PERFORMANCE BOUNDARY, so the target sits just above
 *  what the evidence already supports. */
function targetDifficulty(mastery) {
    const m = mastery ?? 0.5;
    return Math.min(0.85, Math.max(0.15, m + 0.15));
}
/** The ceiling a practice ramp may reach on its own. Above this, a harder
 *  question is a decision for the plan (stretch/transfer), not for the serve. */
exports.PRACTICE_MAX = 0.9;
/** The floor. Below this, "easier" stops being scaffolding and becomes a
 *  different question — the fix there is a hint, not an easier item. */
exports.PRACTICE_MIN = 0.15;
/** The run of correct answers that outgrows a band. */
exports.STRETCH_STREAK = 3;
/** …and the accuracy that has to come with it. A three-streak on a concept
 *  answered 4/12 overall is a recovering learner, not a bored one. */
exports.STRETCH_ACCURACY = 0.75;
/** The accuracy below which the band is not landing (with enough answers to
 *  mean anything). */
exports.REPAIR_ACCURACY = 0.34;
exports.REPAIR_MIN_ATTEMPTS = 2;
/** Recurring belief-hits that call for support regardless of the score. */
exports.REPAIR_MISCONCEPTION_HITS = 2;
function practiceTarget(i) {
    const tier = Math.min(0.7, Math.max(exports.PRACTICE_MIN, i.tier));
    const attempts = Math.max(0, Math.floor(i.attempts));
    const correct = Math.min(attempts, Math.max(0, Math.floor(i.correct)));
    const accuracy = attempts ? correct / attempts : 0;
    if (attempts === 0) {
        return { difficulty: tier, tier, uplift: 0, reason: "fresh", scaffold: false };
    }
    const struggling = (attempts >= exports.REPAIR_MIN_ATTEMPTS && accuracy <= exports.REPAIR_ACCURACY)
        || (i.misconceptionHits ?? 0) >= exports.REPAIR_MISCONCEPTION_HITS;
    if (struggling) {
        const difficulty = Math.max(exports.PRACTICE_MIN, tier - 0.12);
        return { difficulty, tier, uplift: difficulty - tier, reason: "repair", scaffold: true };
    }
    if (i.streak >= exports.STRETCH_STREAK && accuracy >= exports.STRETCH_ACCURACY) {
        const difficulty = Math.min(exports.PRACTICE_MAX, tier + 0.22);
        return { difficulty, tier, uplift: difficulty - tier, reason: "stretch", scaffold: false };
    }
    if (i.streak >= 2 && accuracy >= 0.6) {
        const difficulty = Math.min(exports.PRACTICE_MAX, tier + 0.1);
        return { difficulty, tier, uplift: difficulty - tier, reason: "stretch", scaffold: false };
    }
    return { difficulty: tier, tier, uplift: 0, reason: "steady", scaffold: false };
}
/**
 * Score one candidate. Deliberately additive and explainable — every term is a
 * number a person can reason about, and there is no model in the loop. §8.
 */
function scoreCandidate(input, conceptId, stage, difficulty, skill) {
    const { blueprint, mastery, ledger, drawn } = input;
    const topic = blueprint.topics.find((t) => t.stage === stage);
    const want = topic?.quota ?? 0;
    const have = topic?.concepts.length ? (drawn.stage[stage] ?? 0) : 0;
    // Coverage: what this band still owes the blueprint, as a fraction.
    const coverage = want > 0 ? Math.max(0, (want - have) / want) : 0;
    // Information gain is the Shannon-style hump: a probe at p ≈ 0.5 tells you
    // the most. Asking something the learner will certainly get right, or
    // certainly fail, spends a question and learns nothing.
    const p = mastery[conceptId] ?? 0.5;
    const informationGain = 4 * p * (1 - p);
    const target = targetDifficulty(mastery[conceptId] ?? null);
    const difficultyFit = 1 - Math.min(1, Math.abs(difficulty - target) / 0.5);
    const skillWant = blueprint.skillQuota[skill] ?? 0;
    const skillHave = drawn.skill[skill] ?? 0;
    const skillCoverage = skillWant > 0 ? Math.max(0, (skillWant - skillHave) / skillWant) : 0;
    const novelty = hasSeen(ledger, makeItemId(conceptId, input.seed)) ? 0 : 1;
    const total = coverage * 0.3 + informationGain * 0.25 + difficultyFit * 0.25 + skillCoverage * 0.1 + novelty * 0.1;
    return { coverage, informationGain, difficultyFit, skillCoverage, novelty, total };
}
/**
 * Choose the next diagnostic probe.
 *
 * Answers the question the product is actually asking — "which item will tell
 * me the most about this learner?" — deterministically. No LLM decides this:
 * the same blueprint, evidence and seed always yield the same item, which is
 * what makes a diagnostic comparable across sittings.
 *
 * Candidates are the still-unused items the blueprint's bands allow, restricted
 * to the skills the bank can honestly produce. Returns null when the blueprint
 * is satisfied or supply is exhausted — which is a legitimate end state, not an
 * error, and never resolved by re-serving a spent item.
 */
function selectDiagnosticQuestion(input) {
    const { blueprint, ledger, draw } = input;
    const candidates = [];
    /** Concepts whose evidence is already decided: probing them cannot change
     *  what OpenMind will recommend, so the probe would buy nothing. */
    const skippedSettled = [];
    for (const topic of blueprint.topics) {
        if ((input.drawn.stage[topic.stage] ?? 0) >= topic.quota)
            continue;
        for (const conceptId of topic.concepts) {
            if (estimateIsDecided(input.evidence?.[conceptId])) {
                if (!skippedSettled.includes(conceptId))
                    skippedSettled.push(conceptId);
                continue;
            }
            // Try a couple of draws per concept: generators have fixed difficulty
            // ranges, so the band the blueprint wants may not be reachable from the
            // first seed. Deterministic — the salt comes from the session seed.
            for (const salt of candidateSeeds(input.seed, conceptId)) {
                const item = draw(conceptId, salt);
                if (!item)
                    continue;
                const skill = (0, skills_1.skillForDifficulty)(item.difficulty);
                if (!skills_1.SKILLS_IN_BANK.includes(skill))
                    continue;
                const id = makeItemId(conceptId, salt);
                if (!isUsable({ id, pool: "diagnostic" }, ledger))
                    break;
                candidates.push({ conceptId, stage: topic.stage, item });
                break;
            }
        }
    }
    if (candidates.length === 0)
        return null;
    let best = null;
    for (const c of candidates) {
        const skill = (0, skills_1.skillForDifficulty)(c.item.difficulty);
        const score = scoreCandidate(input, c.conceptId, c.stage, c.item.difficulty, skill);
        // Deterministic tie-break: higher score wins, then the lower stage (a
        // course is taught foundations-first), then the concept id.
        if (!best ||
            score.total > best.score.total + 1e-9 ||
            (Math.abs(score.total - best.score.total) <= 1e-9 && c.stage < best.c.stage) ||
            (Math.abs(score.total - best.score.total) <= 1e-9 && c.stage === best.c.stage && c.conceptId < best.c.conceptId)) {
            best = { c, score };
        }
    }
    if (!best)
        return null;
    return {
        item: itemFor(best.c.conceptId, input.seed, best.c.item.difficulty, input.active, "diagnostic", best.c.item.tags),
        score: best.score,
        skippedSettled,
    };
}
// ── Blueprint-driven sampling for the baseline diagnostic ───────────────────
/**
 * The concepts a baseline (or its retest) should sample, in teaching order.
 *
 * Deterministic in (spec, subject): a baseline and its later retest therefore
 * choose the SAME concepts, which is what makes a before→after number mean
 * anything. Falls back to `fallback` when the qualification is too narrow to
 * fill a blueprint — never by inventing coverage.
 */
function blueprintConcepts(active, subject, servable, fallback, total = 4, 
/** How deep each concept's generator can go (`questions.conceptDepth`). When
 *  supplied, the sample is GUARANTEED to contain a concept that can express
 *  the deepest band the course can reach. Without this, a sample can be drawn
 *  entirely from concepts that top out at application level — and then a
 *  demand level reports "not measured" for every learner in that course
 *  forever. That is a sampling bug, not a fact about the learner. */
depth) {
    const bp = buildBlueprint(active, subject, total, servable);
    // Every concept the qualification covers — the pool the depth cover may draw
    // from. Deliberately NOT the truncated pick list: the deep concepts are
    // usually NOT in the first `quota / 2` of their band, which is exactly why
    // the first version of this guarantee silently did nothing.
    const eligiblePool = bp.topics.flatMap((t) => t.concepts);
    const picked = [];
    for (const t of bp.topics) {
        for (const id of t.concepts.slice(0, Math.max(1, Math.ceil(t.quota / 2)))) {
            if (!picked.includes(id))
                picked.push(id);
        }
    }
    const ordered = picked.sort((a, b) => {
        const ca = (0, genome_1.getConcept)(a);
        const cb = (0, genome_1.getConcept)(b);
        return (ca?.stage ?? 0) - (cb?.stage ?? 0) || a.localeCompare(b);
    });
    let top = ordered.slice(0, total);
    // Depth cover: if nothing in the sample can express the DEEPEST band the
    // course's own concepts can reach, swap the last pick for the deepest
    // eligible concept. The bar used to be multi-step, because that was the top
    // of the bank; now that the depth layer reaches the data-and-graphs band, the
    // guarantee has to move with it — otherwise a full baseline could never serve
    // an interpreting question, and that band would read "not measured" for every
    // learner in the course forever, which is a sampling bug wearing the costume
    // of a fact about the learner.
    // Deterministic (depth, then teaching order, then id), so a retest samples
    // the same concepts as its baseline — the premise of every before/after.
    if (depth && top.length > 0) {
        const poolDepth = Math.max(0, ...eligiblePool.map((id) => depth(id)));
        const wanted = Math.max(skills_1.SKILL_MIN_DIFFICULTY.multi_step, poolDepth >= skills_1.SKILL_MIN_DIFFICULTY.data_interpretation ? skills_1.SKILL_MIN_DIFFICULTY.data_interpretation : 0);
        const deepest = Math.max(...top.map((id) => depth(id)), 0);
        if (deepest < wanted) {
            const deeper = eligiblePool
                .filter((id) => !top.includes(id) && depth(id) >= wanted)
                .sort((a, b) => depth(b) - depth(a)
                || ((0, genome_1.getConcept)(a)?.stage ?? 0) - ((0, genome_1.getConcept)(b)?.stage ?? 0)
                || a.localeCompare(b));
            if (deeper[0]) {
                top = [...top.slice(0, Math.max(1, top.length - 1)), deeper[0]]
                    .sort((a, b) => ((0, genome_1.getConcept)(a)?.stage ?? 0) - ((0, genome_1.getConcept)(b)?.stage ?? 0) || a.localeCompare(b));
            }
        }
    }
    return top.length >= Math.min(3, total) ? top : fallback;
}
