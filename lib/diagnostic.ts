import { bySubject, getConcept } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import {
  SKILLS_NOT_IN_BANK, SKILL_LADDER, bandDemonstrated, bandReachable, estimateEvidence, skillForDifficulty,
  type EvidenceEstimate, type QuestionSource, type SkillId,
} from "./question-bank";
import { coverageOf, difficultyFor, type ActiveSpec } from "./specifications";
import { blueprintConcepts } from "./question-bank";
import { DIAG_RELEASE_EVIDENCE } from "./mastery";
import { conceptDepth, difficultyBandFor, generateQuestion, generateQuestionAt, hasGenerator, isVariableGen } from "./questions";
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

/** The rung a learner's OWN COURSE opens the ladder at.
 *
 *  The ladder used to open every concept at 0.15 — the anonymous floor — no
 *  matter who was sitting it. A Year 11 GCSE Higher learner's real first-run
 *  sitting therefore contained "Which fraction is larger: 1/2 or 1/8?" and
 *  "What is the value of the tens digit in 276?": primary questions asked of a
 *  learner with eleven years of schooling, before anything at their own level,
 *  on the way to items that could actually place them. The same happened one
 *  rung up for every qualification — an A-level learner's first item on a
 *  concept was the easiest draw its generator owns.
 *
 *  A placement starts where the learner's own course sits: the deepest rung at
 *  or below the difficulty their qualification declares. That is a statement
 *  about the SITTING, not about the learner — which is why it earns no mastery
 *  credit (see `ladderMastery`): a band that was never asked was never
 *  demonstrated, and the descent below the course's rung is what tells a
 *  learner's real floor from their declared one.
 */
export function openingStageFor(declaredDifficulty: number | null | undefined): number {
  if (declaredDifficulty === null || declaredDifficulty === undefined) return 0;
  let stage = 0;
  for (let i = 0; i < LADDER_DIFFICULTIES.length; i++) {
    if (LADDER_DIFFICULTIES[i] <= declaredDifficulty + 1e-9) stage = i;
  }
  return stage;
}

/**
 * How many rungs of the ladder THIS concept's bank can actually express.
 *
 * The ladder offers up to `LADDER_STAGES` demand levels, but a concept's
 * generator has a MEASURED ceiling (`conceptDepth`) and cannot produce an item
 * above it. Asking anyway is not harmless. The band rules spend two questions
 * per band, so a concept whose items all sit inside the recall band was served
 * roughly eight near-identical questions, and the mastery the run produced was
 * computed against bands the concept had never expressed — which the decision
 * engine then read as "needs practice" and prescribed again, permanently,
 * because no amount of answering well moves a ceiling that belongs to the
 * BANK. "We cannot ask this deeper" is not "the learner has not shown it".
 *
 * Measured from the generator's own seeds, never declared, so a concept that
 * gains a deeper generator widens here automatically.
 */
export function bandsFor(conceptId: string): number {
  const depth = conceptDepth(conceptId);
  return Math.max(1, Math.min(LADDER_STAGES, SKILL_LADDER.filter((s) => bandReachable(s, depth)).length));
}

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
// Every id here must be a real concept id with a variable generator — the
// filter in `benchmarkAnchors` silently drops anything else, and a subject
// whose anchors all drop runs its baseline on a random spread (or nothing)
// while the table claims a fixed benchmark. Chemistry's and biology's lists
// named ids that never existed in the genome (`atomic-structure`, `moles`,
// `rates-of-reaction`, `genetics-punnett`), so those subjects lost the
// before/after guarantee this table exists to provide. Now they name the real
// generators — which also means every anchor subject must KEEP a variable
// generator for each anchor, and the genome-integrity sweep enforces that.
export const BENCHMARK_ANCHORS: Record<SubjectId, string[]> = {
  maths: ["fractions", "linear-equations", "quadratics", "pythagoras"],
  physics: ["forces-basics", "electricity-circuits", "waves-basics", "energy-conservation"],
  chemistry: ["atoms-elements", "ionic-bonding", "moles-calcs", "rates-reaction"],
  biology: ["cells", "photosynthesis", "enzymes", "genetics"],
  computing: ["variables", "loops", "conditionals", "functions-code"],
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
  /** The rung this ladder OPENED at, when that is not the bank's floor.
   *
   *  Two different facts live here and in `skippedBands`, and conflating them
   *  was how a weak learner's sitting came to report skips it had not earned:
   *   · `openedAt` is where the learner's own COURSE placed them — a statement
   *     about the sitting, never evidence about the learner;
   *   · `skippedBands` is a band this session had already demonstrated on an
   *     earlier concept, which is evidence, and is the only thing a shortened
   *     report may claim credit for.
   *  `ladderMastery` reads both (the rung for position, the proof for credit),
   *  and a surface can tell the difference between "we did not ask" and "you
   *  had already shown it". */
  openedAt?: number;
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
  /** The rung this sitting opens each concept at, from the learner's own
   *  declared course (`openingStageFor`). Zero when no course is declared, so
   *  an anonymous probe keeps the old floor-to-top ladder unchanged. */
  openStage?: number;
  /** Every probe actually answered, in order, with the difficulty served and
   *  whether it was right. The per-concept ladder cannot answer "can they
   *  APPLY but not interpret data?" — that question needs the individual
   *  answers, and it is the question a serious diagnostic exists to answer. */
  log: Array<{
    conceptId: string;
    difficulty: number;
    correct: boolean;
    source: QuestionSource;
    /** What the learner said about their own knowing BEFORE the verdict — see
     *  lib/evidence.ts#Certainty. Null when the answer was given without one
     *  (every answer from before this existed, and any answer that was not
     *  asked). Kept per answer because the sitting's register is the one thing a
     *  score cannot reconstruct. */
    certainty: import("./evidence").Certainty | null;
  }>;
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
  // ── WHERE THIS SITTING PLACES THE LEARNER ────────────────────────────────
  // The rung the ladder opens at, and the shallowest ceiling worth sampling,
  // both come from the learner's own declared course (see `openingStageFor`).
  // `active` is resolved by the caller from the profile, so an undeclared
  // learner is placed by the grade-derived fallback course rather than by the
  // bank's floor — which is what makes the sitting comparable across learners.
  const declared = active ? difficultyFor(active) : null;
  const openStage = openingStageFor(declared);
  const declaredBand = declared === null ? 1 : difficultyBandFor(declared);
  // A concept that tops out a band below the learner's own course cannot PLACE
  // them: every item it owns is easier than the work they are here for, so the
  // questions it costs can only tell the learner that the product does not know
  // them. Excluded from EVERY sample — the anchor and blueprint runs and the
  // random probe alike, which is where primary place value reached a Year 11
  // GCSE Higher sitting. The ladder's descent already covers a learner who is
  // genuinely weak at their course's level, and it does so from their own
  // answers instead of from a foundation concept the coverage happened to
  // contain.
  const canPlaceThem = (id: string) =>
    hasGenerator(id) && isVariableGen(id) && difficultyBandFor(conceptDepth(id)) >= declaredBand - 1;
  // Benchmark runs walk the subject's FIXED anchor concepts (audit P0-B), in
  // curriculum order, so every baseline/retest pair measures the same skills.
  // Quick probes keep the old behaviour: a random spread across the spine.
  // Constant (designed-item) generators are excluded either way: the
  // diagnostic must always vary.
  let chosen: string[];
  if (kind === "probe") {
    const withGen = pool.filter((c) => canPlaceThem(c.id));
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
        ? blueprintConcepts(active, subject, canPlaceThem, anchors, anchors.length || 4, conceptDepth)
        : anchors;
      // The filter can empty a narrow qualification's blueprint; fall back to
      // its own coverage rather than to concepts the course does not contain.
      if (active && chosen.length < 3) {
        chosen = coverageOf(active).filter((c) => c.subject === subject && canPlaceThem(c.id)).slice(0, 4).map((c) => c.id);
      }
      if (chosen.length < 3) chosen = pool.filter((c) => hasGenerator(c.id) && isVariableGen(c.id)).slice(0, 4).map((c) => c.id);
    }
  // DEEPEST FIRST. The order a sitting serves its sample is a product
  // decision, not a detail: ascending order meant a Year 11 GCSE Higher
  // learner's FIRST question was always the shallowest concept in their whole
  // course — primary place value — and the foundations were spent before
  // anything at their own level had been asked. Descending asks "can you do
  // the top of your course?" first and descends through the rest of the sample
  // only as far as the evidence requires, so the foundations are reached when
  // the harder work has actually failed. The sample itself is unchanged (a
  // baseline and its retest still choose the same concepts), and each concept
  // still climbs its own ladder from the bottom.
  const sorted = chosen
    .map((id) => pool.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => b.stage - a.stage)
    .map((c) => c.id);

  return {
    subject,
    kind,
    openStage,
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
    // What THIS concept's bank can express (see `bandsFor`). The ladder may
    // never ask for a band beyond it — neither by starting above it nor by
    // climbing past it.
    const rungs = bandsFor(cur.conceptId);
    if (cur.asked === 0 && cur.stage === 0) {
      // TWO FLOORS, AND THE DEEPER ONE WINS.
      // The learner's COURSE is where placement starts (see
      // `openingStageFor`): a Year 11 GCSE Higher learner is placed against
      // their course, never against the bank's primary floor. The SESSION's own
      // evidence can raise it further — a band this sitting has already
      // demonstrated on an earlier concept is not re-proved on every remaining
      // one (see `startingStage`). Both are capped by what this concept's bank
      // can express, because the top rung of a concept is the deepest its items
      // reach, and asking beyond it spends questions on a band that does not
      // exist.
      const courseFloor = Math.min(s.openStage ?? 0, rungs - 1);
      const demonstratedFloor = (s.log?.length ?? 0) > 0 ? startingStage(s) : 0;
      const floor = Math.min(Math.max(courseFloor, demonstratedFloor), rungs - 1);
      if (floor > 0) {
        // TWO FACTS, RECORDED SEPARATELY (see `LadderState.openedAt`): where
        // the learner's own course placed this concept, and the bands this
        // session had already PROVEN on an earlier one. Only the second is a
        // skip, and conflating them reported a weak learner as having skipped
        // bands that nothing had demonstrated.
        cur.openedAt = courseFloor;
        const provenPart = Math.min(demonstratedFloor, floor);
        if (provenPart > 0) cur.skippedBands = SKILL_LADDER.slice(0, provenPart);
        cur.stage = floor;
      }
    }
    // The ladder must be a difficulty ladder, not a stage counter (audit P0-A):
    // serve a question whose drawn difficulty actually tracks the band target.
    // Deliberately NOT clamped to `rungs`: a stage the concept cannot express
    // must still ask for the HARDEST item its generator has, and clamping here
    // would drop a stuck-but-deep band back to the easiest draw the bank owns.
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
  /** The learner's own statement about their knowing, made before this verdict
   *  existed. Optional, and null by default: a caller that does not ask records
   *  an absent self-report, never an implied "sure". */
  certainty: import("./evidence").Certainty | null = null,
): { correct: boolean; explanation: string } {
  const correct = choiceIdx === question.answer;
  // The per-answer record, including the difficulty actually served, is what
  // the skill breakdown is derived from. Recorded before the band rules run so
  // an answer that ENDS a band is still counted.
  // The SOURCE is recorded with every answer: today every probe is authored by
  // OpenMind, and the day a licensed board item is served this record is what
  // keeps "measured on real board material" from being an assumption.
  s.log.push({ conceptId, difficulty: question.difficulty, correct, source: "openmind_authored", certainty });
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
      // The climb stops at this concept's own ceiling: the top band is the
      // deepest one its bank can express, not band `LADDER_STAGES - 1`.
      if (cur.stage < bandsFor(cur.conceptId) - 1) {
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

/**
 * HOW LONG THIS SITTING IS, approximately — measured, never guessed.
 *
 * The diagnostic is adaptive, so its length is not a fixed number: a concept's
 * band rules stop it the moment they decide, and a band the sitting has already
 * PROVED is not re-proved on every concept after it. Both are facts about
 * answers that do not exist yet, so no closed-form count can be honest about
 * them — which is why the alternative, a constant like "12 questions", would be
 * a number the app invented and the learner could catch it missing.
 *
 * So the estimate is a forward SIMULATION, and the one it runs is the honest
 * one: clone the live sitting and climb the ladder answering everything
 * CORRECTLY — the climb nothing would stop. It is therefore an upper-ish bound:
 * a learner who misses early finishes below it, and the report is what says how
 * far they actually got. That is exactly why the surface prints "about".
 *
 * Deterministic in the sitting it is handed, and it never mutates it: the clone
 * starts from the `asked` the log already counts, so asking the same session
 * twice returns the same number and one answered question cannot be counted
 * twice.
 */
export function plannedQuestions(s: DiagnosticSession): number {
  const clone = structuredClone(s) as DiagnosticSession;
  let n = clone.log.length;
  // A sitting is a handful of concepts and at most a few questions each. The
  // guard exists only so a generator that can never close a concept cannot
  // loop forever while a learner waits on the response.
  for (let guard = 0; guard < 400; guard++) {
    const q = nextQuestion(clone);
    if (!q) break;
    gradeAnswer(clone, q.conceptId, q, q.answer);
    n++;
  }
  return n;
}

/** mastery from ladder position: 0.1 + 0.28/stage passed + 0.12 partial credit.
 *  Depth-honest (audit P0-A): the claim is capped by the hardest question
 *  actually served — a ladder whose generator never produced above 0.3
 *  difficulty cannot yield a 0.9 mastery number, no matter how cleanly the
 *  student ran it. Claims never outrun the evidence. */
export function ladderMastery(c: LadderState): number {
  if (c.asked === 0) return 0.1;
  // The ladder THIS concept's bank can express — the reference frame of every
  // claim below. Not `LADDER_STAGES`: a concept whose items all live in the
  // recall band was judged as a four-band run, and the difficulty cap then
  // pinned it below 0.65 for EVERY learner who ever touched it, which is how a
  // flawless learner kept being prescribed it as "practice".
  const rungs = bandsFor(c.conceptId);
  // Perfect final stage (all correct, never failed) counts as passing it.
  const perfectFinal = c.done && c.correctThisStage === c.askedThisStage && c.askedThisStage > 0;
  // ── WHERE THE LADDER OPENED, AND WHAT THAT DOES TO THE COUNT ─────────────
  // A course-placed ladder opens above the bank's floor (see
  // `openingStageFor`), and the number this function returns is read by the
  // engine's own bar — so two ways of getting it wrong matter, in opposite
  // directions:
  //   · counting only the rungs ASKED under-claims, and an under-claim is not
  //     the safe error here: a learner who swept the top of their course
  //     unaided would land under the established bar and be prescribed
  //     practice on a concept they had just demonstrated. That is the exact
  //     failure ("a flawless learner kept being prescribed it") this function
  //     was rewritten to stop.
  //   · counting the rungs NOT asked as passed would invent evidence.
  // The resolution is the one the audit trail already supports: the rung the
  // learner's own course opened at counts toward the POSITION the ladder
  // reached (it is where the sitting placed them — `openedAt`, for any surface
  // to see), and it counts only once the learner has proven a band at or above
  // it (see the guard below).
  const openRung = Math.min(c.openedAt ?? 0, rungs - 1);
  // The highest rung this ladder actually PASSED: a perfect final stage is a
  // pass, anything else leaves the current rung unproven. Everything between
  // the opening rung and that one was proven on the way up, because an
  // ascending ladder only advances by proving a band.
  const highestPassed = perfectFinal ? c.stage : c.stage - 1;
  const demonstrated = Math.max(0, Math.min(highestPassed, rungs - 1) - openRung + 1);
  // The sitting's floor counts as POSITION only once the learner has proven
  // something at or above it. An all-wrong sitting must not collect the credit
  // for a band its own answers never touched: measured before this guard was
  // added, a learner who answered everything wrongly scored 0.66–0.94 — above
  // the engine's established bar — on every concept. That is the exact
  // over-claim this function exists to refuse.
  const stagesPassed = (demonstrated > 0 ? openRung : 0) + demonstrated;
  const partial = !perfectFinal && c.correctThisStage === 1 && c.askedThisStage >= 1 ? 1 : 0;
  let m = 0.1 + 0.28 * stagesPassed + 0.12 * partial;
  // A FLAWLESS SWEEP OF THIS CONCEPT'S OWN RANGE: every band its bank can
  // express, passed without a single error. It returns ABOVE the difficulty
  // cap deliberately, and this is the one place where that is the honest
  // reading rather than an over-claim. The cap exists so a claim cannot outrun
  // the evidence, and it is measured against the items actually served — so
  // for a concept whose items stop at 0.30 it punished the learner for the
  // instrument's ceiling and made the strongest possible demonstration of that
  // concept indistinguishable from a weak one. The claim below is not "they can
  // do harder questions" (none exist); it is "everything this concept can ask,
  // they answered, unaided, first time". `asked >= rungs * BAND_RULES.advance`
  // keeps a SKIPPED band from earning it: a concept entered mid-ladder has not
  // swept its range here.
  const fullClean = c.done && stagesPassed >= rungs && c.correct === c.asked
    && c.asked >= Math.max(1, rungs - openRung) * BAND_RULES.advance;
  if (fullClean) {
    m = Math.max(m, 0.9);
  } else {
    // Cap by the hardest question genuinely served: the easiest band (0.15)
    // maps to ~0.62 ceiling, the full ladder (0.65) to the full range.
    const hardest = c.servedDifficulty.length ? Math.max(...c.servedDifficulty) : 0;
    const depthCap = 0.35 + 0.95 * hardest;
    m = Math.min(m, depthCap);
  }
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
  /** Was this band never put on the table at all, because every concept the
   *  sitting served OPENED ABOVE it (`openingStageFor`)?
   *
   *  THE THIRD REASON AN UNMEASURED BAND CAN HONESTLY HAVE, and the one the
   *  two flags above cannot state. `reachable` is a fact about the sitting's
   *  SAMPLED CONCEPTS (can these generators express the band?); this is a fact
   *  about its PLACEMENT (did it start above it?). A Year 11 GCSE Higher
   *  baseline is placed at its own course's rung — deliberately, so it is never
   *  handed primary place value — and a learner who answers correctly on the way
   *  up never descends below that rung, so `recall` came back "not measured"
   *  with nothing to explain it. Placement is a statement about the SITTING, so
   *  it can never be shown as a fact about the learner.
   *
   *  Derived from the LOG rather than from the configured floor: a band counts
   *  as not-asked only when the sitting genuinely asked nothing below the lowest
   *  band it reached. A learner who fails early is descended to, does ask at the
   *  floor, and so has no not-asked band at all — which keeps the three reasons
   *  from collapsing into one. */
  notAsked: boolean;
  estimate: EvidenceEstimate;
}

export function demandEstimates(s: DiagnosticSession): DemandEvidence[] {
  // The deepest question any of this session's concepts can serve. Measured
  // from the generators, not assumed from the syllabus.
  const deepest = s.concepts.reduce((m, c) => Math.max(m, conceptDepth(c.conceptId)), 0);
  // The lowest band this sitting actually asked at, or null when it asked
  // nothing at all (an empty sitting has no placement to report).
  const lowestAsked = s.log.reduce<number | null>((lo, a) => {
    const i = SKILL_LADDER.indexOf(skillForDifficulty(a.difficulty));
    if (i < 0) return lo;
    return lo === null ? i : Math.min(lo, i);
  }, null);
  return SKILL_LADDER.map((skill, i) => {
    const rows = s.log
      .filter((a) => skillForDifficulty(a.difficulty) === skill)
      .map((a) => ({ correct: a.correct, source: a.source ?? ("openmind_authored" as QuestionSource) }));
    return {
      skill,
      inBank: !SKILLS_NOT_IN_BANK.includes(skill),
      reachable: bandReachable(skill, deepest),
      notAsked: lowestAsked !== null && i < lowestAsked,
      estimate: estimateEvidence(rows),
    };
  });
}

/**
 * What the learner said about their own knowing, over a whole sitting.
 *
 * `unsureCorrect` is the reason this exists at all: an accuracy figure counts a
 * confident right answer and a half-guessed one identically, and those are two
 * different states to teach from. Only answers that STATED something are
 * counted — a learner who was never asked the question has an empty tally, not
 * a fabricated confident one.
 *
 * Read from the sitting's own log, so it is derived from the answers rather than
 * from a counter that could drift away from them.
 */
export function certaintyTally(s: DiagnosticSession): { stated: number; unsure: number; unsureCorrect: number } {
  const t = { stated: 0, unsure: 0, unsureCorrect: 0 };
  for (const a of s.log) {
    if (a.certainty !== "sure" && a.certainty !== "unsure") continue;
    t.stated += 1;
    if (a.certainty === "unsure") { t.unsure += 1; if (a.correct) t.unsureCorrect += 1; }
  }
  return t;
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
    // GAPS AND STRENGTHS ARE CLAIMS ABOUT THE LEARNER, so they may only be drawn
    // from concepts this sitting actually asked about (`probedScores`). The
    // unprobed coverage rows above carry the model's neutral prior by design —
    // folding them in turned "we have not looked" into "you are weak at
    // addition" on the results screen, for a learner who had just answered
    // every question correctly, and handed the plan remediation for concepts
    // nothing had measured. Unmeasured is a third state and it has its own
    // representation: the coverage rows, with `asked: 0`.
    gaps: probedScores.map((c) => scores.find((s) => s.conceptId === c.conceptId)!).filter((x) => x.mastery < 0.65).sort((a, b) => a.mastery - b.mastery),
    strengths: scores.filter((x) => x.asked > 0 && x.mastery >= 0.85),
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
    // What the learner said about their own knowing, so the report can name the
    // difference between "I know this" and "I got it, but I wasn't sure" — the
    // one thing the score cannot say.
    certainty: certaintyTally(s),
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
    // EVERY ANSWER IN A SITTING IS INDEPENDENT, and this seed says so because
    // it is the whole of what the sitting proved. The diagnostic has no hint
    // action at all, which is why the grading route mints `mode:
    // "independent"` for each of its answers and why the ledger — projected by
    // My Evidence — already reported these as independent evidence.
    //
    // Leaving the dimension off this seed is what made the same answer read two
    // ways: Home called a hint-free correct answer "Supported — you got there
    // with support" (strongestProof over a row with no independent counts),
    // while My Evidence called it independent; and lib/mastery.ts caps a
    // concept with no independent record at 0.75, so a diagnostic-only concept
    // sat under a ceiling its own evidence had already lifted.
    independent: { asked: c.asked, correct: c.correct },
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
  // The independence the sitting proved rides along, and the merge is a CHOICE
  // BETWEEN two coherent records rather than a max per field: taking the higher
  // `asked` beside the higher `correct` would mix a practice record with a
  // diagnostic one and publish a rate neither of them ever showed. Re-folding
  // the same sitting therefore selects the same pair again — idempotent, like
  // everything else here — and a diagnostic can never lower what practice
  // proved.
  const mine = existing.independent;
  if (seed.independent && (!mine || seed.independent.correct > mine.correct ||
      (seed.independent.correct === mine.correct && seed.independent.asked > mine.asked))) {
    existing.independent = { ...seed.independent };
  }
}

/** Merge one concept's diagnostic evidence into the learner model. The sitting
 *  carries its own independence — every answer in it is hint-free by
 *  construction (there is no hint action to take), which is why the ledger
 *  records `mode: "independent"` per answer — and practice evidence is only
 *  released once DIAG_RELEASE_EVIDENCE graded answers exist — until then the
 *  diagnostic measurement stays the dominant accuracy signal.
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
