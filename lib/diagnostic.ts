import { bySubject, getConcept } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import {
  SKILLS_NOT_IN_BANK, SKILL_LADDER, bandDemonstrated, bandReachable, estimateEvidence, skillForDifficulty,
  type EvidenceEstimate, type QuestionSource, type SkillId,
} from "./question-bank";
import type { ActiveSpec } from "./specifications";
import { blueprintConcepts } from "./question-bank";
import { DIAG_RELEASE_EVIDENCE } from "./mastery";
import { conceptDepth, generateQuestion, generateQuestionAt, hasGenerator, isVariableGen } from "./questions";
import type { ConceptScore, ConceptProgress, DiagnosticResult, PathStep, ProfileState, Question, SubjectId } from "./types";
// FOUR rungs, one per band the bank can actually produce: recall, application,
// multi-step, and data-and-graphs. The ladder used to stop at multi-step
// because no question in the bank could reach the band above it — a diagnostic
// cannot measure a demand level its questions cannot express, so the ceiling
// was honest. The depth layer changed what the bank can serve (see
// lib/questions-deep.ts), so the ceiling moved: a full baseline now asks the
// interpreting questions too, and `demandEstimates` reports every band the
// learner's own sitting actually reached. The top rung is not "harder numbers"
// — it is the band where the answer must be read out of a table, graph or
// model, which is the skill exam-style questions are built on.
export const LADDER_STAGES = 4; // diagnostic ceiling (practice extends beyond)
export const LADDER_DIFFICULTIES = [0.15, 0.4, 0.6, 0.85];

/** Evidence rules per difficulty band (audit P0-C), stated once so code and
 *  comments can never disagree again:
 *    2/2 correct          → advance to the next band
 *    1/2 (any order)      → the band is re-tested exactly once (two-strike)
 *    0/2 after the retest → stop: the band is genuinely beyond the learner
 *    1/2 after the retest → stop: the band capped what this session proved
 *  The ladder measures UP, so a mid-band recovery (wrong then right) earns a
 *  second question at the same band before the band is judged. */
export const BAND_RULES = { advance: 2, retest: 1, stop: 0 } as const;

// ── Matched benchmark (audit P0-B): a fixed anchor set per subject so the
// "before → after" number compares like with like. The same anchor concepts
// every run; retest questions are parallel forms (same skill, fresh numbers
// from the generator). Probe sessions stay random and never enter gains. ───
export const BENCHMARK_ANCHORS: Record<SubjectId, string[]> = {
  maths: ["fractions", "linear-equations", "quadratics", "pythagoras"],
  physics: ["forces-newton", "circuits-ohms-law", "waves-basics", "energy-conservation"],
  chemistry: ["atomic-structure", "ionic-bonding", "moles", "rates-of-reaction"],
  biology: ["cells", "photosynthesis", "enzymes", "genetics-punnett"],
  computing: ["variables", "loops", "conditionals", "functions"],
};

/** Concepts from the anchor list that actually exist and can generate
 *  variable questions — the honest anchor set for this deployment. */
export function benchmarkAnchors(subject: SubjectId): string[] {
  return BENCHMARK_ANCHORS[subject]
    .filter((id) => hasGenerator(id) && isVariableGen(id) && getConcept(id));
}

export interface LadderState {
  conceptId: string;
  stage: number; // 0..LADDER_STAGES-1
  askedThisStage: number;
  correctThisStage: number;
  /** A miss at the current band has been served its one re-test. */
  missedThisStage?: boolean;
  done: boolean;
  asked: number;
  correct: number;
  /** seeds already served, to avoid repeats within a session */
  usedSeeds: string[];
  /** Difficulty actually served per question — the honest record that caps
   *  what this ladder's mastery may claim (generators have fixed ranges). */
  servedDifficulty: number[];
  /** Demand bands this concept never re-proved, because the session had already
   *  demonstrated them before the concept was reached (see `startingStage`).
   *  Recorded so a shorter ladder is auditable: a concept that starts at band 2
   *  is not a concept whose bands 0–1 were measured here. */
  skippedBands?: SkillId[];
}

export interface DiagnosticSession {
  subject: SubjectId;
  /** benchmark run type — fixed anchors (baseline/retest) vs random probe */
  kind: "baseline" | "retest" | "probe";
  concepts: LadderState[];
  order: number; // which concept is current
  wrongTags: string[];
  startedAt: number;
  finished: boolean;
  /** Every probe actually answered, in order, with the difficulty served and
   *  whether it was right. The per-concept ladder cannot answer "can they
   *  APPLY but not interpret data?" — that question needs the individual
   *  answers, and it is the question a serious diagnostic exists to answer. */
  log: Array<{ conceptId: string; difficulty: number; correct: boolean; source: QuestionSource }>;
}

export function newDiagnosticSession(
  subject: SubjectId,
  kind: "baseline" | "retest" | "probe" = "probe",
  /** The learner's qualification. When given, a baseline/retest samples the
   *  BLUEPRINT (coverage across the spec's own stage bands) instead of four
   *  hard-coded anchors. Deterministic in (spec, subject), so a baseline and
   *  its later retest still choose the SAME concepts — which is the whole
   *  reason a before→after number means anything. */
  active?: ActiveSpec | null,
): DiagnosticSession {
  const pool = bySubject(subject);
  // Benchmark runs walk the subject's FIXED anchor concepts (audit P0-B), in
  // curriculum order, so every baseline/retest pair measures the same skills.
  // Quick probes keep the old behaviour: a random spread across the spine.
  // Constant (designed-item) generators are excluded either way: the
  // diagnostic must always vary.
  let chosen: string[];
  if (kind === "probe") {
    const withGen = pool.filter((c) => hasGenerator(c.id) && isVariableGen(c.id));
    const pickStage = (stage: number) => {
      const band = withGen.filter((c) => c.stage === stage);
      return band.length ? band[Math.floor(Math.random() * band.length)] : withGen[Math.floor(Math.random() * withGen.length)];
    };
    chosen = [];
    for (const stage of [0, 1, 2, 3]) {
      const c = pickStage(stage);
      if (c && !chosen.includes(c.id)) chosen.push(c.id);
    }
    // top up if some bands were empty
    for (const c of withGen) {
      if (chosen.length >= 4) break;
      if (!chosen.includes(c.id)) chosen.push(c.id);
    }    } else {
      const anchors = benchmarkAnchors(subject);
      chosen = active
        // `conceptDepth` guarantees the sample can actually climb the ladder:
        // without it a course whose sample happens to contain only low-ceiling
        // generators can never measure the multi-step band (see question-bank).
        ? blueprintConcepts(active, subject, (id) => hasGenerator(id) && isVariableGen(id), anchors, anchors.length || 4, conceptDepth)
        : anchors;
      if (chosen.length < 3) chosen = pool.filter((c) => hasGenerator(c.id) && isVariableGen(c.id)).slice(0, 4).map((c) => c.id);
    }
  const sorted = chosen
    .map((id) => pool.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => a.stage - b.stage)
    .map((c) => c.id);

  return {
    subject,
    kind,
    concepts: sorted.map((id) => ({ conceptId: id, stage: 0, askedThisStage: 0, correctThisStage: 0, missedThisStage: false, done: false, asked: 0, correct: 0, usedSeeds: [], servedDifficulty: [] })),
    order: 0,
    wrongTags: [],
    startedAt: Date.now(),
    finished: false,
    log: [],
  };
}

export function currentConcept(s: DiagnosticSession): LadderState | null {
  while (s.order < s.concepts.length && s.concepts[s.order].done) s.order++;
  if (s.order >= s.concepts.length) { s.finished = true; return null; }
  return s.concepts[s.order];
}

/**
 * The band a FRESH concept may start at.
 *
 * This is the diagnostic's early stop, and it is deliberately one-sided: a
 * band the session has already DEMONSTRATED (`bandDemonstrated` — the interval
 * floor above evens, typically six clean answers at that band across the
 * session) is not re-proved on every remaining concept. A band settled WEAK
 * never skips: "has not shown it" is a reason to teach, never a reason to stop
 * looking.
 *
 * The standard is calibrated against the ladder's own band rule, which already
 * accepts a clean TWO-answer pair at a band as proof of it. This asks for more
 * than that, just over the whole session instead of one concept — so skipping
 * cannot claim more than the ladder would have claimed had the items been
 * served. The claim stays capped by the hardest item actually served, so a
 * shorter ladder can never produce a HIGHER mastery than the same learner's
 * full ladder would have.
 */
export function startingStage(s: DiagnosticSession): number {
  const bands = demandEstimates(s);
  let floor = 0;
  for (const b of bands) {
    if (!b.inBank) break; // never skip past the measurable ladder
    if (!bandDemonstrated(b.estimate)) break;
    floor++;
  }
  // The top band is always probed: a diagnostic that asks nothing is not a
  // diagnosis, and a learner who has demonstrated everything still deserves to
  // see the measurement that says so.
  return Math.min(floor, LADDER_STAGES - 1);
}

export function nextQuestion(s: DiagnosticSession): Question | null {
  let cur = currentConcept(s);
  while (cur) {
    // Early stop, per band (see `startingStage`): a concept reached after the
    // session has already demonstrated a band starts above it instead of
    // paying for the same proof again. Only for a concept with no answers yet,
    // so the tested band rules below are untouched mid-ladder.
    if (cur.asked === 0 && cur.stage === 0 && (s.log?.length ?? 0) > 0) {
      const floor = startingStage(s);
      if (floor > 0) {
        cur.skippedBands = SKILL_LADDER.slice(0, floor);
        cur.stage = floor;
      }
    }
    // The ladder must be a difficulty ladder, not a stage counter (audit P0-A):
    // serve a question whose drawn difficulty actually tracks the band target.
    const target = LADDER_DIFFICULTIES[Math.min(cur.stage, LADDER_DIFFICULTIES.length - 1)];
    // What this sitting has already spent on this concept. Handing it to the
    // serve is what makes the retry loop below meaningful: without it the queue
    // of candidates is identical every attempt, so a stage whose demand the
    // concept cannot express would serve one item six times and the concept
    // would be closed as "run dry" mid-ladder — a flawless run truncated at
    // stage 1, reported as a mediocre score. See `generateQuestionAt`.
    const spent = new Set(cur.usedSeeds);
    for (let attempt = 0; attempt < 6; attempt++) {
      // Deterministic in (session start, concept, position): the same session
      // always probes the same items, so a dropped connection resumes the SAME
      // measurement and a result can be audited afterwards. `startedAt` is what
      // keeps two sittings from being identical. A `Math.random()` salt here
      // made every retry a different test — which quietly made "before vs
      // after" incomparable.
      const seed = `d${s.startedAt}:${cur.conceptId}:${cur.asked}:${attempt}`;
      const q = generateQuestionAt(cur.conceptId, seed, target, attempt, spent);
      const sig = q ? `${q.prompt}|${q.choices[q.answer]}` : "";
      if (q && !cur.usedSeeds.includes(sig)) {
        cur.usedSeeds.push(sig);
        (cur.servedDifficulty ??= []).push(q.difficulty); // record what was truly served
        return q;
      }
    }
    // This concept's generator has run dry (constant question): close it as
    // mastered-by-default (nothing left to prove) and move on.
    cur.done = true;
    cur = currentConcept(s);
  }
  return null;
}

export function gradeAnswer(
  s: DiagnosticSession,
  conceptId: string,
  question: Question,
  choiceIdx: number,
): { correct: boolean; explanation: string } {
  const correct = choiceIdx === question.answer;
  // The per-answer record, including the difficulty actually served, is what
  // the skill breakdown is derived from. Recorded before the band rules run so
  // an answer that ENDS a band is still counted.
  // The SOURCE is recorded with every answer: today every probe is authored by
  // OpenMind, and the day a licensed board item is served this record is what
  // keeps "measured on real board material" from being an assumption.
  s.log.push({ conceptId, difficulty: question.difficulty, correct, source: "openmind_authored" });
  const cur = s.concepts.find((c) => c.conceptId === conceptId);
  if (cur && !cur.done) {
    cur.asked++;
    cur.askedThisStage++;
    if (correct) { cur.correct++; cur.correctThisStage++; }
    // Band rules (see BAND_RULES): the single source of ladder truth.
    if (!correct) {
      for (const t of question.misconceptionTags) s.wrongTags.push(t);
      if (cur.missedThisStage) {
        cur.done = true; // second miss at this band: genuinely beyond it
      } else {
        cur.missedThisStage = true; // one slip is noise: the band gets a confirming question
      }
    } else if (cur.correctThisStage >= BAND_RULES.advance) {
      // Two correct at this band — clean 2/2, or recovery after one forgiven
      // slip (the slip is confirmed noise by the evidence, not ignored).
      if (cur.stage < LADDER_STAGES - 1) {
        cur.stage++;
        cur.askedThisStage = 0;
        cur.correctThisStage = 0;
        cur.missedThisStage = false;
      } else {
        cur.done = true; // top band passed
      }
    } else if (cur.askedThisStage >= 3) {
      // Slip forgiven, but only one correct across three band questions:
      // the band capped what this session could prove. Stop honestly —
      // partial credit is recorded, and the claim cannot outrun the band.
      cur.done = true;
    }
    // else: mid-band (1 correct + 1 forgiven slip) — the band continues with
    // one more question, which either confirms recovery or ends the band.
  }
  return { correct, explanation: question.explanation };
}

/** mastery from ladder position: 0.1 + 0.28/stage passed + 0.12 partial credit.
 *  Depth-honest (audit P0-A): the claim is capped by the hardest question
 *  actually served — a ladder whose generator never produced above 0.3
 *  difficulty cannot yield a 0.9 mastery number, no matter how cleanly the
 *  student ran it. Claims never outrun the evidence. */
export function ladderMastery(c: LadderState): number {
  if (c.asked === 0) return 0.1;
  // Perfect final stage (all correct, never failed) counts as passing it.
  const perfectFinal = c.done && c.correctThisStage === c.askedThisStage && c.askedThisStage > 0;
  const stagesPassed = perfectFinal ? c.stage + 1 : c.stage;
  const partial = !perfectFinal && c.correctThisStage === 1 && c.askedThisStage >= 1 ? 1 : 0;
  let m = 0.1 + 0.28 * stagesPassed + 0.12 * partial;
  // Flawless full-depth run only: every band passed clean, never missed.
  const fullClean = c.done && stagesPassed >= LADDER_STAGES && c.correct === c.asked && c.asked >= LADDER_STAGES;
  if (fullClean) m = Math.max(m, 0.9);
  // Cap by the hardest question genuinely served: the easiest band (0.15)
  // maps to ~0.62 ceiling, the full ladder (0.65) to the full range.
  const hardest = c.servedDifficulty.length ? Math.max(...c.servedDifficulty) : 0;
  const depthCap = 0.35 + 0.95 * hardest;
  m = Math.min(m, depthCap);
  return Math.max(0.05, Math.min(0.98, m));
}

export function detectMisconceptions(tags: string[]): Array<{ id: string; name: string; count: number; conceptId: string }> {
  const counts = new Map<string, number>();
  for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => {
      const m = MISCONCEPTIONS_BY_ID[id];
      return { id, name: m?.name ?? id, count, conceptId: m?.concepts[0] ?? "" };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * What the diagnostic can say about SKILLS, from the answers themselves.
 *
 * A concept percentage ("Vaccination 50%") cannot be acted on. "You can recall
 * and apply, but interpretation of unfamiliar data is where you lose marks"
 * can. This is derived from each answer's own served difficulty — the same
 * bands the question was written to — and NOT from a mark scheme: the bank is
 * multiple-choice, so this measures whether the answer was right at that demand
 * level, and nothing finer.
 *
 * Skills the bank cannot produce are reported with `measured: false` rather than
 * being omitted, so a surface is forced to say "not measured" instead of letting
 * a learner infer that their extended writing was assessed.
 *
 * Each row is an EvidenceEstimate, not a bare percentage: 2/2 and 6/6 are the
 * same number and emphatically not the same evidence, so the confidence travels
 * with the value and no surface can show one without being able to show the
 * other.
 */
export interface DemandEvidence {
  skill: SkillId;
  /** False for a demand level this bank cannot produce at all. */
  inBank: boolean;
  /** Could THIS SESSION's questions express the band at all?
   *
   *  A course whose sampled concepts top out at application level cannot
   *  measure multi-step however long the diagnostic runs — the floor of a
   *  Kenyan junior maths paper is genuinely different from an A-level one.
   *  Without this flag the report would say "not measured" and leave the
   *  learner to read it as a gap in themselves; with it, the reason is stated. */
  reachable: boolean;
  estimate: EvidenceEstimate;
}

export function demandEstimates(s: DiagnosticSession): DemandEvidence[] {
  // The deepest question any of this session's concepts can serve. Measured
  // from the generators, not assumed from the syllabus.
  const deepest = s.concepts.reduce((m, c) => Math.max(m, conceptDepth(c.conceptId)), 0);
  return SKILL_LADDER.map((skill) => {
    const rows = s.log
      .filter((a) => skillForDifficulty(a.difficulty) === skill)
      .map((a) => ({ correct: a.correct, source: a.source ?? ("openmind_authored" as QuestionSource) }));
    return {
      skill,
      inBank: !SKILLS_NOT_IN_BANK.includes(skill),
      reachable: bandReachable(skill, deepest),
      estimate: estimateEvidence(rows),
    };
  });
}

export function buildResult(s: DiagnosticSession): DiagnosticResult {
  const probedScores = s.concepts.filter((c) => c.asked > 0);
  const scores: ConceptScore[] = probedScores.map((c) => ({
    conceptId: c.conceptId,
    correct: c.asked ? c.correct / c.asked : 0,
    mastery: ladderMastery(c),
    asked: c.asked,
  }));
  // Extend coverage — HONESTLY (audit P0-A): unprobed concepts carry a weak
  // prior (0.2) that the learner model treats as inference, never as
  // observation. `probedConcepts` is the boundary between the two.
  const probed = new Set(scores.map((x) => x.conceptId));
  const extras: ConceptScore[] = bySubject(s.subject)
    .filter((c) => !probed.has(c.id) && hasGenerator(c.id) && isVariableGen(c.id))
    .slice(0, 8)
    .map((c) => ({ conceptId: c.id, correct: 0, mastery: 0.2, asked: 0 }));
  const all = [...scores, ...extras];
  const misconceptions = detectMisconceptions(s.wrongTags);
  return {
    startedAt: s.startedAt,
    answered: s.concepts.reduce((n, c) => n + c.asked, 0),
    asked: s.concepts.reduce((n, c) => n + c.asked, 0),
    scores: all,
    gaps: all.filter((x) => x.mastery < 0.65).sort((a, b) => a.mastery - b.mastery),
    strengths: all.filter((x) => x.mastery >= 0.85),
    misconceptions,
    path: [],
    kind: s.kind,
    probedConcepts: probedScores.map((c) => c.conceptId),
    skills: demandEstimates(s),
    // Bands a later concept did not re-prove, in ladder order — the honest
    // record of a shortened measurement.
    skippedBands: SKILL_LADDER.filter((sk) =>
      s.concepts.some((c) => c.skippedBands?.includes(sk)),
    ),
  };
}

// ── P0-A: the diagnostic is the learner model's initial state estimator ─────

/** Seed a fresh ConceptProgress from one diagnostic concept's evidence. */
export function diagnosticToProgress(c: LadderState, at = Date.now()): ConceptProgress {
  const mastery = ladderMastery(c);
  return {
    attempts: c.asked,
    correct: c.correct,
    streak: 0,
    // Accuracy == mastery here: the diagnostic is the accuracy evidence.
    accuracy: mastery,
    mastery,
    lastSeen: at,
    misconceptions: {},
  };
}

/** Fold one diagnostic seed into the model — THE merge rule, shared by the
 *  live path (applyDiagnosticEvidence) and by replay (lib/replay.ts). One
 *  implementation exists so the two paths cannot drift: a second copy of
 *  this logic would make "the ledger reproduces the model" false quietly. */
export function mergeDiagnosticSeed(
  progress: Record<string, ConceptProgress>,
  conceptId: string,
  seed: ConceptProgress,
  at: number,
): void {
  const existing = progress[conceptId];
  if (!existing) {
    progress[conceptId] = seed;
    return;
  }
  const practiceAnswers = existing.attempts ?? 0;
  if (practiceAnswers < DIAG_RELEASE_EVIDENCE) {
    // Supervised window: the diagnostic measurement IS the best evidence.
    existing.attempts = Math.max(existing.attempts ?? 0, seed.attempts);
    existing.correct = Math.max(existing.correct ?? 0, seed.correct);
    existing.accuracy = seed.accuracy;
  } else {
    // Practice has taken over; only lift the claim if the diagnostic is stronger.
    existing.accuracy = Math.max(existing.accuracy ?? 0, seed.accuracy ?? 0);
  }
  existing.mastery = Math.max(existing.mastery ?? 0, seed.mastery);
  existing.lastSeen = Math.max(existing.lastSeen ?? 0, at);
}

/** Merge one concept's diagnostic evidence into the learner model. The model
 *  keeps its independent record (never touched here), and practice evidence
 *  is only released once DIAG_RELEASE_EVIDENCE graded answers exist — until
 *  then the diagnostic measurement stays the dominant accuracy signal.
 *  @param markObserved record the concept as directly probed (baseline). */
export function applyDiagnosticEvidence(
  state: ProfileState,
  conceptId: string,
  ladder: LadderState,
  opts: { baseline?: boolean } = {},
  /** The sitting's clock. Routes pass the SAME stamp the diagnostic_completed
   *  event carries — one sitting, one time, or replay parity is broken. */
  at = Date.now(),
): void {
  if (ladder.asked === 0) return;
  if (opts.baseline) state.observed ??= {};
  const seed = diagnosticToProgress(ladder, at);
  mergeDiagnosticSeed(state.progress, conceptId, seed, at);
  if (opts.baseline) state.observed![conceptId] = Math.max(state.observed![conceptId] ?? 0, at);
}

/** Mark the concepts a BASELINE sitting directly probed as observed (audit
 *  P0-B) — the boundary between observed evidence and inferred priors.
 *
 *  Observation is an exposure fact, not evidence content, which is why the
 *  ledger's fold does not carry it: the diagnostic route re-applies it after
 *  the projection. Probe and retest runs never invent observations for
 *  concepts they did not test. */
export function markObservedConcepts(state: ProfileState, session: DiagnosticSession, at = Date.now()): void {
  if (session.kind !== "baseline") return;
  state.observed ??= {};
  for (const c of session.concepts) {
    if (c.asked === 0) continue;
    state.observed[c.conceptId] = Math.max(state.observed[c.conceptId] ?? 0, at);
  }
}

/** Fold a completed diagnostic session into the learner model, in one shot.
 *
 *  This is no longer the production path. Since the cutover, the route mints
 *  ONE `diagnostic_completed` event and the learner model is projected from
 *  the ledger, whose fold calls the same `mergeDiagnosticSeed` this does — so
 *  the model is unchanged and now reconstructible. What this function still is
 *  is the LIVE PATH'S OWN MATH, which is what the replay-parity tests re-run
 *  against the projection: two implementations would let the two drift apart
 *  quietly, and one implementation cannot. Do not delete it as dead code. */
export function applyDiagnosticResult(state: ProfileState, session: DiagnosticSession, at = Date.now()): void {
  for (const c of session.concepts) {
    if (c.asked === 0) continue;
    applyDiagnosticEvidence(state, c.conceptId, c, { baseline: session.kind === "baseline" }, at);
  }
}

// ── Learning path (also used by /api/path and the dashboard) ────────────────

export function buildPath(
  subject: SubjectId,
  masteries: Record<string, number>,
  misconceptionHits: Record<string, number>,
  limit = 8,
): PathStep[] {
  const pool = bySubject(subject);
  const m = (id: string) => masteries[id] ?? 0.2;
  const steps: PathStep[] = [];
  const needing = pool
    .filter((c) => m(c.id) < 0.65)
    .sort((a, b) => a.stage - b.stage || m(a.id) - m(b.id));

  for (const c of needing) {
    const actions: PathStep["actions"] = [];
    // weakest prerequisite first
    const weakPre = c.prereqs.map((p) => getConcept(p)).filter((p): p is NonNullable<typeof p> => !!p && m(p.id) < 0.6);
    if (weakPre.length) actions.push({ kind: "prerequisite", conceptId: weakPre.sort((a, b) => m(a.id) - m(b.id))[0].id });
    if (m(c.id) < 0.35) actions.push({ kind: "learn", conceptId: c.id });
    if (m(c.id) < 0.85) {
      actions.push({
        kind: "practice",
        conceptId: c.id,
        count: m(c.id) < 0.4 ? 6 : 4,
        difficulty: Math.min(0.85, Math.max(0.12, m(c.id) + 0.1)),
      });
    }
    if (m(c.id) >= 0.75 && m(c.id) < 0.9) actions.push({ kind: "master", conceptId: c.id, count: 3, difficulty: 0.75 });
    if (actions.length) steps.push({ conceptId: c.id, mastery: m(c.id), actions });
    if (steps.length >= limit) break;
  }
  // attach the most relevant active misconception note per step
  const hits = Object.entries(misconceptionHits).sort((a, b) => b[1] - a[1]);
  for (const step of steps) {
    const c = getConcept(step.conceptId);
    const relevant = hits.find(([mid]) => c?.misconceptions?.includes(mid) || MISCONCEPTIONS_BY_ID[mid]?.concepts.includes(step.conceptId));
    if (relevant) step.note = MISCONCEPTIONS_BY_ID[relevant[0]]?.coaching;
  }
  return steps;
}
