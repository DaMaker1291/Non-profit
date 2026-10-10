// ── CLASS LEARNING NEEDS, FROM THE LEDGERS ALONE (§8) ───────────────────────
//
// No number in this file is stored, guessed or self-reported: every need is a
// function of the members' own evidence ledgers (class-view.ts feeds them in
// through the same `projectLearner` every other teacher view reads), the
// class's DECLARED curriculum (never a default), and a fixed window. That keeps
// the whole derivation PURE — the same ledgers produce the same findings, so a
// review the teacher reads today can be re-derived in a year from the same
// events with one `window`.
//
// THE FIVE WORDS, AND WHAT EACH ONE IS ALLOWED TO CLAIM. A finding is a
// statement about EVIDENCE, never a diagnosis of a child:
//   misconception  a named wrong pattern the ledger recorded on graded misses
//                  built to probe it — a hypothesis about a RULE, shared
//                  knowingly by several learners;
//   weak_rate      repeated low INDEPENDENT accuracy on one concept — an
//                  OBSERVED DIFFICULTY, with no claim about why;
//   hint_dependent right answers that needed help every time — scaffolding
//                  demand, and never independence;
//   prereq_gap     a prerequisite of a struggling concept that the same
//                  learners are weak on or unmeasured on — a LIKELY
//                  PREREQUISITE GAP, inferred from the genome's own graph and
//                  always phrased as suspect;
//   unmeasured     concepts of the class's curriculum that NO member has any
//                  answer on — NOT YET MEASURED. An absence, named as one.
//
// THE POPULATION RULE, which is the whole honesty of this module. Every
// proportion in a finding names its own denominator explicitly: of the
// `eligible` learners in the class (students only; the teacher is not one, and
// a learner with no ledger behind their row is still COUNTED — as
// `unmeasured`, never excluded and never scored 0), `withEvidence` have any
// answer on the concept, `showing` the pattern. Sparse evidence is reported as
// sparse: a finding below the certainty floor is marked `thin: true` and the
// UI renders it as "may need more evidence" rather than as a class-wide claim.
import { projectLearner, type LearnerProjection, type EvidenceEvent } from "../evidence";
import type { ClassNeed } from "../types";

/** The window a finding may be computed over. Nothing in this module reads a
 *  clock of its own: the caller supplies `now`, so a test can fix it and a
 *  re-derivation can re-freeze it. */
export const NEED_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Minimum divided evidence for a class-wide claim to be made at full
 *  strength. Below it the finding still surfaces (the pattern IS there), with
 *  `thin: true` so the UI says the review is informed less than the teacher
 *  should want. */
export const NEED_MIN_SHOWING = 2;

/** Minimum WITH-EVIDENCE population before class-wide wording is permitted at
 *  all. Below it, even two learners showing a pattern is one marked `thin`. */
export const NEED_MIN_EVIDENCE = 3;

/** A prerequisite's OWN mark that suspends judgment on the dependent concept.
 *  The same boundary the rest of the model calls "established" (learner-model),
 *  for one rule everywhere. */
const PREREQ_MIN_RATE = 0.5;

// ── What one member's ledger says about one concept, for finding purposes ───

interface ConceptFoot {
  /** Any graded answer at all on the concept, inside the window. */
  answered: number;
  correct: number;
  /** Answered UNAIDED (hints === 0) — the independence slice, found from the
   *  raw events because the projection's `independent` bucket is defined by
   *  MODE as well as hints, and "the learner answered with no help" is the
   *  wider set a hint-dependent finding needs. */
  unaided: { asked: number; correct: number };
  hinted: { asked: number; correct: number };
  /** Slips the projection recorded on the concept (still-counting). */
  misconceptions: Record<string, number>;
}



// ── The scan: one pass over every member's ordered events ───────────────────

interface MemberScan {
  handle: string;
  learnerId: string;
  feet: Map<string, ConceptFoot>;
  /** Total answers in the window (any concept) — the "started at all" signal. */
  answered: number;
}

/** The per-member per-concept window scan every finding below is built from.
 *  Pure in (events, window): the same ledgers and clock return the same scan,
 *  which is what makes a finding's re-derivation deterministic. */
export function scanMembers(
  members: ReadonlyArray<{ handle: string; events: readonly EvidenceEvent[] }>,
  fromMs: number | null,
): MemberScan[] {
  const out: MemberScan[] = [];
  for (const { handle, events } of members) {
    const p = projectLearner(events);
    const feet = new Map<string, ConceptFoot>();
    let answered = 0;
    // Walk the events ONCE, newest to oldest server-clock, updating feet — the
    // raw order is what the window needs and the projection cannot give.
    const ordered = [...events].sort((a, b) => b.at - a.at);
    for (const e of ordered) {
      if (e.type !== "answer_submitted" || !e.conceptId) continue;
      if (e.at < (fromMs ?? 0)) continue;
      answered += 1;
      const f = feet.get(e.conceptId) ?? {
        answered: 0, correct: 0,
        unaided: { asked: 0, correct: 0 }, hinted: { asked: 0, correct: 0 },
        misconceptions: {},
      };
      f.answered += 1;
      if (e.correct) f.correct += 1;
      if (e.hints === 0) {
        f.unaided.asked += 1;
        if (e.correct) f.unaided.correct += 1;
      } else {
        f.hinted.asked += 1;
        if (e.correct) f.hinted.correct += 1;
      }
      if (!e.correct) {
        for (const tag of e.tags ?? []) f.misconceptions[tag] = (f.misconceptions[tag] ?? 0) + 1;
      }
      feet.set(e.conceptId, f);
    }
    out.push({ handle, learnerId: p.learnerId ?? handle, feet, answered });
  }
  return out;
}

/** Aggregate one finding's population over the scans, restricted to concepts
 *  meaningful for the class (the declared curriculum's assignable list). */
function population(
  scans: readonly MemberScan[],
  conceptId: string,
  kind: "answered" | "unaided",
): { eligible: number; withEvidence: number; unmeasured: number } {
  let withEvidence = 0;
  for (const s of scans) {
    const f = s.feet.get(conceptId);
    if (f && (kind === "answered" ? f.answered > 0 : f.unaided.asked > 0)) withEvidence += 1;
  }
  return { eligible: scans.length, withEvidence, unmeasured: scans.length - withEvidence };
}

// ── The five findings ───────────────────────────────────────────────────────

/**
 * Derive the class's open learning needs, strongest first.
 *
 * `curriculum` is the class's own assignable concept list
 * (lib/server/assignment-view#assignableConcepts), which the caller is
 * responsible for restricting to — nothing here substitutes a default.
 * `members` is every STUDENT's handle + full ledger, resolved by class-view.
 * `now` is the server clock this derivation is frozen at.
 *
 * Deterministic through and through: sorts are total (rate, then hits, then
 * id), and a concept with no evidence on both legs of a prerequisite finding
 * is sorted by concept id, so two derivations of the same ledger set cannot
 * disagree about the ORDER of the needs.
 */
export function deriveClassNeeds(input: {
  members: ReadonlyArray<{ handle: string; learnerId: string; events: readonly EvidenceEvent[] }>;
  curriculum: readonly string[];
  nowMs: number;
}): ClassNeed[] {
  const from = input.nowMs - NEED_WINDOW_MS;
  const scans = scanMembers(input.members, from);
  const needs: ClassNeed[] = [];

  // One pass to find the weak concepts the prerequisite finder will need.
  const weakRates = new Map<string, { rate: number; n: number; withEvidence: number }>();

  for (const conceptId of input.curriculum) {
    // Answered-but-shaky: how the class did on this concept, unaided.
    const pop = population(scans, conceptId, "answered");
    if (pop.withEvidence > 0) {
      const unaided = population(scans, conceptId, "unaided");
      // Unaided slice: what the class demonstrated without help. A class whose
      // answers all had hints on them is NOT measured on the concept's
      // application, and `unaided.asked === 0` says so rather than dividing 0.
      let asked = 0, correct = 0;
      for (const s of scans) {
        const f = s.feet.get(conceptId);
        if (!f) continue;
        asked += f.unaided.asked;
        correct += f.unaided.correct;
      }
      const rate = asked > 0 ? Math.round((correct / asked) * 100) / 100 : null;
      const foots = scans.map((s) => s.feet.get(conceptId)).filter((f): f is ConceptFoot => Boolean(f));
      const carriers = foots.filter(
        (f) => Object.values(f.misconceptions).some((n) => n > 0),
      );
      if (rate !== null && rate < PREREQ_MIN_RATE && foots.length >= 1) {
        weakRates.set(conceptId, { rate, n: carriers.length, withEvidence: pop.withEvidence });
      }

      // ── 1 · RECURRING MISCONCEPTIONS ──
      const midHits = new Map<string, { hits: number; carriers: number; learners: string[] }>();
      for (const s of scans) {
        const f = s.feet.get(conceptId);
        if (!f) continue;
        for (const [mid, hits] of Object.entries(f.misconceptions)) {
          const a = midHits.get(mid) ?? { hits: 0, carriers: 0, learners: [] };
          a.hits += hits;
          if (hits > 0) { a.carriers += 1; a.learners.push(s.handle); }
          midHits.set(mid, a);
        }
      }
      for (const [mid, a] of [...midHits.entries()].sort((x, y) => y[1].carriers - x[1].carriers || y[1].hits - x[1].hits || (x[0] < y[0] ? -1 : 1))) {
        if (a.carriers < NEED_MIN_SHOWING) continue;
        needs.push({
          id: `mis:${mid}:${conceptId}`,
          clsId: "",   // the caller stamps the class; this module stays pure
          conceptId,
          kind: "misconception",
          misconceptionId: mid,
          eligible: pop.eligible,
          withEvidence: pop.withEvidence,
          unmeasured: pop.unmeasured,
          showing: a.carriers,
          unaidedRate: rate,
          handles: a.learners,
          evIds: [],  // the route links the events; the derivation stays pure
          thin: pop.withEvidence < NEED_MIN_EVIDENCE,
          from,
          nowMs: input.nowMs,
        });
      }

      // ── 2 · WEAK APPLICATION (observed difficulty) ──
      if (rate !== null && rate < PREREQ_MIN_RATE && pop.withEvidence >= NEED_MIN_EVIDENCE) {
        needs.push({
          id: `weak:${conceptId}`,
          clsId: "",
          conceptId,
          kind: "weak_rate",
          eligible: pop.eligible,
          withEvidence: pop.withEvidence,
          unmeasured: pop.unmeasured,
          showing: scans.filter((s) => {
            const f = s.feet.get(conceptId);
            return f && f.unaided.asked > 0 && f.unaided.correct < f.unaided.asked;
          }).length,
          unaidedRate: rate,
          handles: scans.filter((s) => {
            const f = s.feet.get(conceptId);
            return f && f.unaided.asked > 0 && f.unaided.correct < f.unaided.asked;
          }).map((s) => s.handle),
          evIds: [],
          thin: false,
          from,
          nowMs: input.nowMs,
        });
      }

      // ── 3 · HINT DEPENDENCE ──
      // Right WITH help on nearly every answer, and nothing unaided: real
      // progress and never a proof of autonomy. `minHinted` keeps an incident
      // ("I had one but it didn't establish") from becoming a finding.
      let hintedRight = 0;
      for (const s of scans) {
        const f = s.feet.get(conceptId);
        if (!f || f.unaided.asked > 0 || f.hinted.asked < 2) continue;
        if (f.hinted.correct >= Math.ceil(f.hinted.asked * 0.75)) hintedRight += 1;
      }
      if (hintedRight >= NEED_MIN_SHOWING && pop.withEvidence >= NEED_MIN_EVIDENCE) {
        needs.push({
          id: `hint:${conceptId}`,
          clsId: "",
          conceptId,
          kind: "hint_dependent",
          eligible: pop.eligible,
          withEvidence: pop.withEvidence,
          unmeasured: pop.unmeasured,
          showing: hintedRight,
          unaidedRate: null,
          handles: scans.filter((s) => {
            const f = s.feet.get(conceptId);
            return f && f.unaided.asked === 0 && f.hinted.asked >= 2
              && f.hinted.correct >= Math.ceil(f.hinted.asked * 0.75);
          }).map((s) => s.handle),
          evIds: [],
          thin: false,
          from,
          nowMs: input.nowMs,
        });
      }
    }
  }

  // ── 4 · LIKELY PREREQUISITE GAPS ──
  // For a concept WITHOUT enough unaided evidence to judge (or judged shaky),
  // the genome's prerequisite links are the reason: if the same learners who
  // struggle here are unmeasured or weak on a prerequisite, THAT is the likely
  // lever, and the finding names it as LIKELY.
  // ( Implemented via needing the genome's prereq links, which live in
  // lib/genome — imported by the route, not here, to keep this module's
  // dependency-light mirror compile list intact. `derivePrerequisiteGaps`
  // below is the caller's extension point. )

  // ── 5 · NOT YET MEASURED ──
  // A curriculum concept NO member has any answer on, inside the window: named,
  // never scored. Combined per concept so one unmeasured row covers the whole
  // class's silence on it.
  const measuredSomewhere = new Set<string>();
  for (const s of scans) for (const cid of s.feet.keys()) measuredSomewhere.add(cid);
  const neverTouched = input.curriculum.filter((cid) => !measuredSomewhere.has(cid));
  if (neverTouched.length > 0 && scans.length > 0) {
    // One finding per concept keeps each row inspectable; cap the list so a
    // torn curriculum does not flood the review page.
    for (const conceptId of neverTouched.slice(0, 12)) {
      needs.push({
        id: `unmeasured:${conceptId}`,
        clsId: "",
        conceptId,
        kind: "unmeasured",
        eligible: scans.length,
        withEvidence: 0,
        unmeasured: scans.length,
        showing: 0,
        unaidedRate: null,
        handles: [],
        evIds: [],
        thin: false,
        from,
        nowMs: input.nowMs,
      });
    }
  }

  return needs.sort((a, b) => {
    const rank: Record<ClassNeed["kind"], number> = { misconception: 0, weak_rate: 1, hint_dependent: 2, prereq_gap: 3, unmeasured: 4 };
    return rank[a.kind] - rank[b.kind] || b.showing - a.showing || (a.conceptId < b.conceptId ? -1 : 1);
  });
}

/**
 * The LIKELY PREREQUISITE GAPS: for a concept the class has evidence on but
 * found shaky (or none), check the genome's prerequisites and see whether the
 * same struggling learners are unmeasured or weak there. That is what makes it
 * a probable lever — and it is phrased "likely" throughout, never as a cause.
 *
 * `prereqsOf` is the genome's own lookup (lib/genome), injected so this file
 * stays free of a genome import in the mirror — but it is the same data the
 * learner's own pages read, never a second list.
 */
/**
 * The LIKELY PREREQUISITE GAPS: for the class's weak/unmeasured concepts, ask
 * the genome's prerequisite graph what the lever might be — is there a
 * prerequisite the SAME learners are unmeasured or weak on? A gap that
 * explains some of the difficulty is a hypothesis with a direction, phrased
 * LIKELY everywhere it surfaces, never as a cause.
 *
 * `prereqsOf` is injected (the genome's own lookup) so this module keeps its
 * dependency-light mirror list — but it is the same data the learner's own
 * pages read, never a second list.
 */
export function derivePrerequisiteGaps(input: {
  members: ReadonlyArray<{ handle: string; learnerId: string; events: readonly EvidenceEvent[] }>;
  curriculum: readonly string[];
  prereqsOf: (conceptId: string) => readonly string[];
  nowMs: number;
}): ClassNeed[] {
  const from = input.nowMs - NEED_WINDOW_MS;
  const scans = scanMembers(input.members, from);
  const out: ClassNeed[] = [];

  for (const conceptId of input.curriculum) {
    // Who has tried (or been taught) the concept in the window and not
    // demonstrated it unaided — the population a prereq gap could explain.
    const struggling = scans.filter((s) => {
      const f = s.feet.get(conceptId);
      if (!f) return false;
      if (f.unaided.asked === 0) return true;           // answered only with help
      return f.unaided.correct < f.unaided.asked;       // not everything unaided right
    });
    if (struggling.length < NEED_MIN_SHOWING) continue;

    for (const pre of input.prereqsOf(conceptId)) {
      if (!input.curriculum.includes(pre)) continue;
      // The same learners on the prerequisite: has the class ANY evidence on
      // it inside the window, and how did the struggling ones do?
      const preEvidence = scans.filter((s) => Boolean(s.feet.get(pre)));
      const preWeak = struggling.filter((s) => {
        const g = s.feet.get(pre);
        if (!g) return true;                            // never measured there
        if (g.unaided.asked === 0) return true;
        return g.unaided.correct < g.unaided.asked;
      });
      if (preWeak.length < NEED_MIN_SHOWING) continue;
      const covered = preEvidence.length;
      out.push({
        id: `prereq:${pre}:${conceptId}`,
        clsId: "",
        conceptId: pre,
        kind: "prereq_gap",
        // The population is the class; the proportion the finding offers is
        // the share of the STRUGGLING group the prereq leg applies to.
        eligible: struggling.length,
        withEvidence: struggling.length - preWeak.filter((s) => !s.feet.get(pre)).length,
        unmeasured: preWeak.filter((s) => !s.feet.get(pre)).length,
        showing: preWeak.length,
        unaidedRate: null,
        handles: preWeak.map((s) => s.handle),
        evIds: [],
        // Always thin: an inferred lever from a small group is a lead for the
        // teacher to check, not a measured class-wide claim.
        thin: true,
        from,
        nowMs: input.nowMs,
      });
    }
  }
  return out.sort((a, b) => b.showing - a.showing || (a.id < b.id ? -1 : 1));
}

// ── OUTCOME: what the assignment (the intervention) produced ───────────────
//
// The intervention's outcome is derived from the SAME ledgers, split at the
// approval instant. Nothing here is stored, and an intervention that has
// collected no follow-up answers reads as exactly that.

/** What one member showed for the concept, before and after the instant. */
export interface MemberOutcome {
  handle: string;
  learnerId: string;
  before: { answered: number; correct: number; unaided: { asked: number; correct: number } };
  after: { answered: number; correct: number; unaided: { asked: number; correct: number }; hinted: { asked: number; correct: number } };
  /** Still unanswered by this member after assignment. */
  untouchedAfter: boolean;
}

export function memberOutcome(
  events: readonly EvidenceEvent[],
  conceptId: string,
  baseAt: number,
  handle: string,
  learnerId: string,
): MemberOutcome {
  const before = { answered: 0, correct: 0, unaided: { asked: 0, correct: 0 } };
  const after = { answered: 0, correct: 0, unaided: { asked: 0, correct: 0 }, hinted: { asked: 0, correct: 0 } };
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    if (e.type !== "answer_submitted" || e.conceptId !== conceptId) continue;
    if (e.at < baseAt) {
      before.answered += 1;
      if (e.correct) before.correct += 1;
      // Like with like: the baseline's slice is the UNAIDED one, the same
      // slice the finding's rate was computed over.
      if (e.hints === 0) {
        before.unaided.asked += 1;
        if (e.correct) before.unaided.correct += 1;
      }
    } else {
      after.answered += 1;
      if (e.correct) after.correct += 1;
      if (e.hints === 0) {
        after.unaided.asked += 1;
        if (e.correct) after.unaided.correct += 1;
      } else {
        after.hinted.asked += 1;
        if (e.correct) after.hinted.correct += 1;
      }
    }
  }
  return { handle, learnerId, before, after, untouchedAfter: after.answered === 0 };
}

export type OutcomeVerdict =
  | "no_baseline"           // nothing before the instant: an intervention without a comparison
  | "incomplete_followup"   // some targeted members still have no follow-up evidence
  | "improved"              // more members demonstrated unaided in the follow-up than did before
  | "no_change"             // the follow-up demonstrated no measurable shift
  | "still_difficult"       // the follow-up showed a LOWER unaided demonstration
  | "not_enough_evidence";  // too little follow-up evidence to say anything

/**
 * THE VERDICT — what the before/after comparison is licensed to say, and only
 * that. Nothing here claims causation: the wording the UI renders is
 * "more learners demonstrated the target skill independently in the follow-up
 * work" (improved) — a change in DEMONSTRATION, not a statement that the
 * teaching caused it. The baseline is unaided answers; the follow-up is the
 * same slice; nothing else is compared, and a comparison that would need data
 * that does not exist reads as exactly that instead of as a number.
 */
export function outcomeVerdict(outcomes: readonly MemberOutcome[]): OutcomeVerdict {
  const beforeUnaided = outcomes.filter((o) => o.before.unaided.asked > 0);
  const afterUnaided = outcomes.filter((o) => o.after.unaided.asked > 0);
  if (afterUnaided.length === 0) return "no_baseline";       // nobody has answered since: not even follow-up
  if (beforeUnaided.length === 0) return "not_enough_evidence"; // nothing to compare against
  const improvedCount = afterUnaided.filter((o) => o.after.unaided.correct > o.before.unaided.correct).length;
  const declinedCount = afterUnaided.filter((o) => o.after.unaided.correct < o.before.unaided.correct).length;
  if (improvedCount > declinedCount) return "improved";
  if (declinedCount > improvedCount) return "still_difficult";
  // Nothing shifted measurably, and the follow-up may still be thin.
  return afterUnaided.reduce((s, o) => s + o.after.unaided.asked, 0) < NEED_MIN_EVIDENCE * 2
    ? "not_enough_evidence"
    : "no_change";
}
