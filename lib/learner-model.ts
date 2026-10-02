// Learner model snapshot (§1): every interaction becomes structured evidence.
// Pure functions of ProfileState — the single source the Mind Map, Review
// Queue, Next Step and Offline Pack all read. No estimates, no simulation.
import { getConcept } from "./genome";
import { confidenceOf, dueReviews } from "./retention";
import type { ProfileState } from "./types";

export interface ConceptEvidence {
  conceptId: string;
  subject: string;
  title: string;
  mastery: number;
  confidence: number | null;
  attempts: number;
  /** Graded answers this learner got right. Carried because `mastery` is a
   *  smoothed curve, so "below the established bar" and "has got something
   *  wrong" are different facts: four correct answers sit at 75% and two sit at
   *  64%, and only the raw count separates a learner who is slow to accumulate
   *  evidence from one who is actually failing. */
  correct: number;
  /** Answers that took at least one hint — scaffolding demand, in the only form
   *  the ledger can reproduce (types.ts#hinted). `hintedAnswers >= attempts`
   *  means every answer on this concept was taken with help, which is the one
   *  fact a high accuracy score cannot show.
   *
   *  There used to be a second field beside this one — the total hint count off
   *  `ConceptProgress.hints`, the per-level tally the hint endpoint writes and
   *  the fold drops (lib/replay.ts's LEDGER_ABSENT_FIELDS). Two representations
   *  of one fact, and every surface read the droppable one, so the engine told a
   *  learner who had taken a hint on EVERY answer that they had used
   *  `0 hints` — above a branch, three lines away, that had just read the
   *  fold-owned count to decide the very same question. One owner now. */
  hintedAnswers: number;
  /** The slip still worth acting on, or null once the learner has repaired it. */
  topMisconception: string | null;
  /** Slips still being made. Zero after a repair — see REPAIR_STREAK. */
  misconceptionHits: number;
  /** The same slip over the whole history, never erased: the record a teacher
   *  and the mind map read. It is NOT what decides the recommendation. */
  lifetimeMisconception: { id: string; hits: number } | null;
  lastSeen: number;
  status: "strong" | "developing" | "learning" | "new" | "untouched";
  /** Hint-free prove-it record (independent) and unfamiliar-wording record. */
  independentAsked: number;
  independentCorrect: number;
  transferAsked: number;
  transferCorrect: number;
  /** Mean answer time in seconds, null until timed answers exist. */
  avgSeconds: number | null;
}

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
export const REPAIR_STREAK = 3;

/** The slip that is still current: null once repaired by REPAIR_STREAK answers. */
export function currentSlip(
  p: { misconceptions?: Record<string, number>; streak?: number } | undefined,
): { id: string; hits: number } | null {
  const entries = Object.entries(p?.misconceptions ?? {});
  if (entries.length === 0) return null;
  if ((p?.streak ?? 0) >= REPAIR_STREAK) return null;
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { id: entries[0][0], hits: entries[0][1] };
}

export function statusOf(mastery: number, attempts: number): ConceptEvidence["status"] {
  if (attempts === 0) return "untouched";
  if (mastery >= 0.9) return "strong";
  if (mastery >= 0.65) return "developing";
  if (mastery > 0) return "learning";
  return "new";
}

/** The mastery a prerequisite must reach before it can carry weight. Deliberately
 *  the SAME boundary `statusOf` calls "developing": one number, one owner, so a
 *  concept the teacher view calls developing is a concept the engine will build
 *  on — and a concept it calls learning is not. */
export const ESTABLISHED_MASTERY = 0.65;

// ─────────────────────────────────────────────────────────────────────────────
// THE LADDER. One ordered set of states a concept can be in for one learner,
// derived from the evidence the model already holds.
//
// It exists because the decision engine used to answer "what next?" from two
// numbers — mastery and confidence — and those two cannot tell the difference
// between the things that need different work:
//
//   an idea not yet met          → introduce it
//   an idea met but shaky        → practise it
//   an idea done WITH HELP       → prove it unaided
//   an idea done unaided         → use it on unfamiliar wording
//   demonstrated AND transferred → move on to the next thing
//
// The stretch rule read "accuracy 0.75 and confidence 0.6" as the fourth state,
// which a learner can reach entirely on hinted answers — the model's own premise
// is that such accuracy is "discounted, not displayed", but the discount only
// applies once a prove attempt exists, so with none it was never applied. And
// nothing could reach the fifth state at all, so a learner who had proved and
// transferred a concept was offered the same transfer again, indefinitely.
//
// The ladder is a VIEW of the evidence, not a second model: every rung is a
// predicate over fields the ledger already carries (`hinted` is fold-owned for
// exactly this reason — types.ts#hinted). Nothing here is stored, and nothing
// here can disagree with a replay, because a replay produces these fields.
// ─────────────────────────────────────────────────────────────────────────────

/** Where one concept stands for one learner. Ordered: later rungs assume the
 *  earlier ones. `transfer` means "proved, and its unfamiliar-wording surface
 *  has not been used yet" — for a concept with no such surface this rung is
 *  unreachable rather than pending, which is what `conceptDone` folds in. */
export type ConceptStage = "unmeasured" | "introduce" | "practise" | "prove" | "transfer" | "advance";

export const CONCEPT_STAGES: ConceptStage[] = ["unmeasured", "introduce", "practise", "prove", "transfer", "advance"];

/**
 * The rung, from the evidence alone. `canTransfer` is not consulted: whether a
 * concept HAS a second surface is a fact about the content, and this function
 * is a fact about the learner. The two meet in `conceptDone` below.
 */
export function stageOf(e: ConceptEvidence): ConceptStage {
  if (e.attempts === 0) return "unmeasured";
  if (e.mastery < 0.35) return "introduce";
  if (e.mastery < ESTABLISHED_MASTERY) return "practise";
  // Accurate — but accurate HOW? `hintedAnswers >= attempts` is "every answer
  // taken with help", the one fact an accuracy score cannot show. It reads the
  // fold-owned count rather than the level tally, so a learner whose work
  // arrived from a device is judged the same as one answering live.
  if (e.hintedAnswers >= e.attempts) return "prove";
  if (e.transferCorrect === 0) return "transfer";
  return "advance";
}

/**
 * The slip that is still happening. Asked by BOTH questions below rather than
 * written twice, because a concept that is "finished" and a concept that "can
 * carry weight" must never disagree about whether something is broken: the one
 * time they did, the engine served a concept it had just called finished.
 */
export function hasLiveSlip(e: ConceptEvidence): boolean {
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
export function conceptDone(e: ConceptEvidence, canTransfer: (conceptId: string) => boolean): boolean {
  if (hasLiveSlip(e)) return false;
  const s = stageOf(e);
  if (s === "advance") return true;
  return s === "transfer" && !canTransfer(e.conceptId);
}

/**
 * Can this concept carry weight as a foundation for another?
 *
 * A live slip is disqualifying: `stageOf` can call a concept "transfer"-ready
 * while its commonest wrong answer is still recurring, and building on a
 * known-broken step is what the REMEDIATE branch exists to avoid.
 */
export function prerequisiteMet(e: ConceptEvidence | undefined): boolean {
  if (!e || e.attempts === 0) return false;
  if (hasLiveSlip(e)) return false;
  return e.mastery >= ESTABLISHED_MASTERY;
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
export function provedUnaided(e: ConceptEvidence): boolean {
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
export function stuckOn(e: ConceptEvidence): boolean {
  return e.attempts > 0 && e.mastery < ESTABLISHED_MASTERY && e.correct < e.attempts;
}

/**
 * The declared prerequisites of `conceptId` this learner has not established,
 * in the order the curriculum declares them.
 *
 * This is a real content relation (Concept.prereqs — 168 declared edges across
 * the bank), not a guess from ordering, so "repair the foundation first" names
 * a concept the content actually says the work depends on.
 */
export function unmetPrerequisites(
  conceptId: string,
  state: ProfileState,
): string[] {
  const c = getConcept(conceptId);
  if (!c) return [];
  return (c.prereqs ?? []).filter((pid) => !prerequisiteMet(evidenceFor(state, pid) ?? undefined));
}

export function evidenceFor(state: ProfileState, conceptId: string): ConceptEvidence | null {
  const c = getConcept(conceptId);
  if (!c) return null;
  const p = state.progress[conceptId];
  const mastery = p?.mastery ?? 0;
  const attempts = p?.attempts ?? 0;
  const current = currentSlip(p);
  const lifetime = p?.misconceptions
    ? Object.entries(p.misconceptions).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
    : undefined;
  return {
    conceptId, subject: c.subject, title: c.title, mastery,
    confidence: p ? confidenceOf(p) : null,
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

export interface LearnerSnapshot {
  evidence: ConceptEvidence[];
  touched: number;
  strong: number;
  developing: number;
  learning: number;
  dueCount: number;
  topMisconceptions: Array<{ id: string; hits: number }>;
}

export function buildSnapshot(state: ProfileState): LearnerSnapshot {
  const evidence = Object.keys(state.progress)
    .map((cid) => evidenceFor(state, cid))
    .filter((e): e is ConceptEvidence => e !== null)
    .sort((a, b) => a.mastery - b.mastery);
  const ledger = new Map<string, number>();
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
    dueCount: dueReviews(state).length,
    topMisconceptions: [...ledger.entries()]
      .map(([id, hits]) => ({ id, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 5),
  };
}
