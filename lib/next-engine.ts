// Next Step Engine (§5): the brain. Evidence in, one ranked action list out.
// Actions: EXPLAIN · PRACTISE · RETRIEVE · REMEDIATE · CHALLENGE · TRANSFER
// · PROJECT · REST. Deterministic, explainable, no AI call required.
import { bySubject, getConcept } from "./genome";
import { fill } from "./i18n";
import { dueReviews } from "./retention";
import {
  buildSnapshot,
  conceptDone,
  provedUnaided,
  stageOf,
  stuckOn,
  unmetPrerequisites,
  type ConceptEvidence,
} from "./learner-model";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { isRetentionEvidence } from "./proof";
import { orderEvents, type AnswerSubmitted, type EvidenceEvent } from "./evidence";
import { canTransfer } from "./transfer";
import type { ProfileState } from "./types";

/** Translator shape (lib/i18n). Optional — callers without a language get
 *  English, the wedge's fallback. */
export type NextT = (key: string) => string;
const EN: NextT = (k) => EN_NEXT[k] ?? k;
export function nextT(t: NextT | undefined): NextT { return t ?? EN; }

/**
 * A belief's name, in the learner's language, that can never be a raw key.
 *
 * The engine composes the remediation sentence from a fragment and a name, so
 * a missing `mc.<id>` key does not degrade gracefully — it ships
 * `You can do the steps, but “mc.sf-sig” keeps recurring` to the learner. That
 * is not hypothetical: English was missing all 53 `mc.*` names while every
 * other dictionary had them (see scripts/i18n-misconception-names.mjs), so the
 * SOURCE language was the one showing keys.
 *
 * A translator renders an undefined key as its own name, which is detectable,
 * and the catalogue's authored English is the right fallback for it: the belief
 * being named is a fact about arithmetic, not prose to be localized.
 */
function beliefName(t: NextT, id: string): string {
  const key = `mc.${id}`;
  const v = t(key);
  if (v !== key) return v;
  return MISCONCEPTIONS_BY_ID[id]?.name ?? id;
}

export type NextKind =
  | "EXPLAIN" | "PRACTISE" | "RETRIEVE" | "REMEDIATE"
  | "CHALLENGE" | "TRANSFER" | "PROJECT" | "REST";

/** Runtime list of the kinds — the one place a caller (an API route, a page
 *  reading `?intent=`, a script) can validate an untrusted action name. */
export const NEXT_KINDS: NextKind[] = [
  "EXPLAIN", "PRACTISE", "RETRIEVE", "REMEDIATE", "CHALLENGE", "TRANSFER", "PROJECT", "REST",
];

export function isNextKind(v: unknown): v is NextKind {
  return typeof v === "string" && (NEXT_KINDS as string[]).includes(v);
}

export interface NextAction {
  kind: NextKind;
  conceptId: string | null;
  title: string;
  reason: string;
  /** Concrete evidence behind the decision — answers "why am I seeing this?" */
  evidence: string;
  minutes: number;
  href: string;
  /** Why NOW, not why at all: the deadline or due-date that makes this the
   *  right work today. Absent urgency is stated, never implied. */
  why: string;
  urgency: NextUrgency;/** How the session is shaped, in order — "3 retrieval → 4 practice → 1 exam
 *  question". Counts are sized to the learner's own stated daily minutes. */
  plan: NextPlanPart[];
  /** The evidence events that CAUSED this decision, most recent first — the
   *  audit trail of the recommendation itself. A learner (or a teacher, or a
   *  funder) can walk from "why am I doing this?" back to individual answers.
   *  A rule with no attributable evidence names none: honesty at the boundary,
   *  not a fabricated citation. */
  evidenceIds: string[];
  /** What OpenMind expects this session to establish — the LOOP's forward
   *  half: evidence in, intended evidence out. Rendered as "after this, …". */
  expectedOutcome: string;
}

/** How pressing this is: a deadline inside a week, inside a month, or none. */
export type NextUrgency = "now" | "soon" | "none";

/** One block of a session. `count` is the number of items, never a duration. */
export interface NextPlanPart {
  kind: "learn" | "retrieve" | "practise" | "remediate" | "transfer" | "exam" | "project";
  count: number;
}

/** Minutes one item of a kind realistically takes. Used to make the plan fit the
 *  learner's stated daily time — a recommendation that does not fit their day
 *  is a recommendation they will not do. */
const ITEM_COST: Record<NextPlanPart["kind"], number> = {
  learn: 2, retrieve: 1, practise: 1, remediate: 1, transfer: 2.5, exam: 2.5, project: 30,
};

const DAY = 86400000;

/** Whole days from the learner's local calendar day to an exam date.
 *
 *  Date-only, deliberately: `Date.parse("2027-06-05")` is UTC midnight, so
 *  comparing it to `Date.now()` would report "0 days" for part of the final
 *  local day. Returns null when no usable date was given — and the engine then
 *  says so rather than inventing urgency. */
export function daysUntilExam(examDate: string | undefined, now: number): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(examDate ?? "");
  if (!m) return null;
  const exam = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const today = new Date(now);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((exam - todayUtc) / DAY);
  // A date in the past is not a deadline — say nothing rather than "-4 days".
  return days < 0 ? null : days;
}

/** The urgency a deadline of `days` produces. 7 days is "now": one week is the
 *  point at which a topic can still be closed properly rather than crammed. */
export function urgencyFor(days: number | null): NextUrgency {
  if (days === null) return "none";
  if (days <= 7) return "now";
  if (days <= 30) return "soon";
  return "none";
}

/** The shape of the session a kind implies, before it is fitted to the day. */
function desiredPlan(kind: NextKind): NextPlanPart[] {
  switch (kind) {
    case "EXPLAIN": return [{ kind: "learn", count: 1 }, { kind: "practise", count: 5 }];
    case "PRACTISE": return [{ kind: "practise", count: 6 }, { kind: "exam", count: 1 }];
    case "REMEDIATE": return [{ kind: "remediate", count: 4 }, { kind: "exam", count: 1 }];
    case "RETRIEVE": return [{ kind: "retrieve", count: 5 }];
    case "TRANSFER": return [{ kind: "transfer", count: 3 }, { kind: "exam", count: 1 }];
    // ADVANCE (kind CHALLENGE — "new ground" was always what it meant; it was
    // just aimed at page one). A concept the learner has never met is introduced
    // and then practised, which is the same shape EXPLAIN already has.
    case "CHALLENGE": return [{ kind: "learn", count: 1 }, { kind: "practise", count: 5 }];
    case "PROJECT": return [{ kind: "project", count: 1 }];
    case "REST": return [];
  }
}

/**
 * Fit a session to the time the learner actually has.
 *
 * Trims the LARGEST block first and never drops the last one: the closing exam
 * question is the whole point of a PRACTISE or TRANSFER session, so "fit the
 * budget" must not silently delete the proof step. Every block keeps at least
 * one item — a plan with a zero-count block is not a plan.
 */
export function planFor(kind: NextKind, budgetMinutes: number): NextPlanPart[] {
  const plan = desiredPlan(kind).map((p) => ({ ...p }));
  if (plan.length === 0) return plan;
  const cost = (p: NextPlanPart) => p.count * ITEM_COST[p.kind];
  const total = () => plan.reduce((s, p) => s + cost(p), 0);
  const budget = Math.max(ITEM_COST[plan[plan.length - 1].kind], budgetMinutes);
  while (total() > budget) {
    let big = -1;
    for (let i = 0; i < plan.length; i++) {
      if (plan[i].count > 1 && (big === -1 || cost(plan[i]) > cost(plan[big]))) big = i;
    }
    if (big === -1) break; // every block is already down to one item
    plan[big].count -= 1;
  }
  return plan;
}

/** Minutes a plan implies — the number the fitting is judged against. */
export function planMinutes(plan: NextPlanPart[]): number {
  return plan.reduce((s, p) => s + p.count * ITEM_COST[p.kind], 0);
}

function hrefFor(conceptId: string | null): string {
  if (!conceptId) return "/dashboard";
  const c = getConcept(conceptId);
  return c ? `/learn/${c.subject}/${c.id}` : "/dashboard";
}

/** The recorded answers behind each concept, when a ledger is supplied: the
 *  material `evidenceIds` is built from. Newest first, per concept. Returns
 *  null when there is no ledger (headless callers, the harness) — the engine
 *  then still decides, and simply cites nothing rather than inventing ids. */
function answersByConcept(events: readonly EvidenceEvent[]): Map<string, AnswerSubmitted[]> | null {
  if (!events || events.length === 0) return null;
  const byConcept = new Map<string, AnswerSubmitted[]>();
  for (const e of orderEvents(events)) {
    if (e.type !== "answer_submitted" || !e.conceptId) continue;
    const list = byConcept.get(e.conceptId) ?? [];
    list.push(e);
    byConcept.set(e.conceptId, list);
  }
  for (const list of byConcept.values()) list.reverse(); // newest first
  return byConcept;
}

/** The most recent N answers for a concept, newest first. */
function recentFor(by: Map<string, AnswerSubmitted[]> | null, conceptId: string | null, n: number): AnswerSubmitted[] {
  if (!by || !conceptId) return [];
  return (by.get(conceptId) ?? []).slice(0, n);
}

/**
 * Did the learner's NEWEST answer on this concept come back as a delayed recall
 * that FAILED?
 *
 * "I cannot do this" and "I have forgotten this" are different diagnoses with
 * different remedies, and the record already separates them — a recall is
 * delayed (the server attributed `source: "retrieval"`, which only happens
 * because the scheduler had the concept due), unaided (no hints), and at least a
 * day after the previous evidence on the concept. `isRetentionEvidence` is the
 * one rule that answers "was this a delayed recall"; it is ASKED here rather
 * than restated, and fed the same gap the fold feeds it (the previous answer's
 * server clock, lib/evidence.ts#projectLearner), so the engine and the ledger
 * cannot disagree about which answers were recalls.
 *
 * The NEWEST answer is the point: the fact has to be current. A learner who
 * failed a recall and then kept failing ordinary practice is stuck in the
 * ordinary way, and the foundations branch below is for exactly them.
 */
function latestAnswerWasForgottenRecall(answers: AnswerSubmitted[] | undefined): boolean {
  const [latest, previous] = answers ?? [];
  if (!latest || latest.correct) return false;
  return isRetentionEvidence({
    source: latest.source,
    hints: latest.hints,
    sinceLast: previous ? latest.at - previous.at : null,
  });
}

/** The shape `push` accepts — an action before the fields the engine computes
 *  for every action (href, plan, urgency, why, citations, outcome). Named so the
 *  stage resolver below can return one. */
type ActionSeed = Omit<NextAction, "href" | "plan" | "urgency" | "why" | "evidenceIds" | "expectedOutcome">;

/** English outcome sentences for the loop's forward half. These are engine
 *  output — the same contract as `reason` — so the UI never composes them. */
const OUTCOMES: Record<NextKind, string> = {
  EXPLAIN: "next.outcome.explain",
  PRACTISE: "next.outcome.practise",
  RETRIEVE: "next.outcome.retrieve",
  REMEDIATE: "next.outcome.remediate",
  CHALLENGE: "next.outcome.challenge",
  TRANSFER: "next.outcome.transfer",
  PROJECT: "next.outcome.project",
  REST: "next.outcome.rest",
};

/**
 * The brain. `tt` translates its chrome; `title` resolves a concept's name in
 * the learner's language. Both are optional so headless callers (and the
 * verification harness) get a complete English decision with no setup.
 */
export function decideNext(
  state: ProfileState,
  max = 4,
  tt?: NextT,
  title?: (conceptId: string) => string,
  now: number = Date.now(),
  evidence?: readonly EvidenceEvent[],
): NextAction[] {
  const t = nextT(tt);
  const name = title ?? ((id: string) => getConcept(id)?.title ?? id);
  const snap = buildSnapshot(state);
  const ledger = answersByConcept(evidence ?? []);
  const out: NextAction[] = [];

  // ── The deadline ─────────────────────────────────────────────────────────
  // The exam date is the learner's own, so it is the most honest urgency
  // signal available: it decides which correct action is the RIGHT one today.
  const days = daysUntilExam(state.profile.examDate, now);
  const urgency = urgencyFor(days);
  const examName = state.profile.exam || state.profile.spec || "";
  // "Why now" is separate from "why at all", and is filled per action below.
  // "Why NOW" is a different question for each kind of work, and this line used
  // to answer all of them with one sentence: "This is the weakest evidence in the
  // model right now." With an exam more than a month out that is what EVERY kind
  // fell through to — on a due review, which is the most OVERDUE evidence rather
  // than the weakest, and on a transfer target, which is by definition the
  // concept the learner has just proved unaided. A branch can now supply its own
  // true fact (`push`'s `whyKey`); kinds that supply none keep the generic line.
  const GENERIC_WHY = "next.why.evidence";
  const whyFor = (dueToday: boolean, own: string): string => {
    if (urgency === "now" && days !== null) {
      return fill(t("next.why.examNow"), { n: days, exam: examName });
    }
    if (urgency === "soon" && days !== null) {
      return fill(t("next.why.examSoon"), { n: days, exam: examName });
    }
    if (dueToday) return t("next.why.dueToday");
    // A BRANCH'S OWN FACT OUT-RANKS the generic "no deadline is set" line, and it
    // has to: an overdue review is overdue whether or not the learner has an exam
    // date. Testing `days === null` before this discarded the branch's timing
    // fact for exactly the self-directed learner — and the offline one — who
    // never sets a date, so the review that was most overdue said the least about
    // why it was today's work. Only a branch that supplied a fact is affected.
    if (own !== GENERIC_WHY) return t(own);
    if (urgency === "none" && days === null) return t("next.why.noExam");
    return t(GENERIC_WHY);
  };
  // Budget: the learner's own daily minutes when they told us, else the action's
  // own estimate. Never longer than they said they have.
  const budget = state.profile.timePerDay && state.profile.timePerDay > 0
    ? state.profile.timePerDay
    : Infinity;
  const push = (a: ActionSeed, opts?: { dueToday?: boolean; budgetMinutes?: number; evidenceIds?: string[]; whyKey?: string }) => {
    // REST is the one action that is not work: no plan, no press of urgency.
    const minutes = a.minutes;
    const plan = a.kind === "REST" ? [] : planFor(a.kind, Math.min(budget, opts?.budgetMinutes ?? minutes));
    out.push({
      ...a,
      href: hrefFor(a.conceptId),
      why: a.kind === "REST" ? t("next.why.rest") : whyFor(opts?.dueToday ?? false, opts?.whyKey ?? GENERIC_WHY),
      urgency,
      plan,
      // The plan is the promise, so the time shown is the plan's own cost. A
      // kind's declared estimate only leads when it has no plan (REST).
      minutes: plan.length ? Math.max(1, Math.round(planMinutes(plan))) : minutes,
      // Attribution: exactly the events the rule actually looked at, newest
      // first — or none, when no ledger was supplied. Never a guess.
      evidenceIds: opts?.evidenceIds ?? [],
      expectedOutcome: t(OUTCOMES[a.kind]),
    });
  };

  // ── WHICH CONCEPT, BEFORE WHICH KIND OF WORK ────────────────────────────
  //
  // Two of the branches below answer "on WHAT?" rather than "what kind of
  // work?", and the old engine conflated them. It chose an action from mastery
  // and confidence, and its only route to a concept the learner had never met
  // was `find(c => mastery === 0)` — the first unwritten page in the whole
  // subject, which for anybody past the start is page one. So a learner who had
  // proved and transferred everything they had met was offered that same
  // transfer again, and `0 of 90` learners in the benchmark could ever reach
  // new material.
  //
  // `open` is the weakest concept whose ladder is not finished. If there is
  // one, the work is on it — or, when its DECLARED foundations are missing, on
  // those, because a slip on a concept whose prerequisite was never met is the
  // symptom and the prerequisite is the cause (which is REMEDIATE's own
  // philosophy, applied one level down). If there is none, the learner has
  // demonstrated what they have met and the work is the NEXT thing in their
  // curriculum — the concept the specification puts after their frontier.
  const touched = snap.evidence.filter((e) => e.attempts > 0);
  // ── WHICH unfinished concept, and why the ORDER is the point ──────────────
  // `snap.evidence` arrives ordered by mastery ascending, and taking the first
  // unfinished concept from it was correct while mastery meant one thing. It no
  // longer does: mastery is now capped by the CONCEPT'S OWN question bank (see
  // `ladderMastery`), so a concept whose items all sit in the recall band tops
  // out at 0.90 while a concept the depth layer reaches tops out at 0.98 — and
  // ranking by those numbers puts the SHALLOWEST concept in the course first,
  // every time. That is how a Year 11 learner who had just swept every concept
  // at their own level was offered "Stretch: Place value".
  //
  // Three tiers, in the order a teacher would use them:
  //   1. measurably weak — the record itself says so (`stuckOn`);
  //   2. established but never done unaided — the scaffolded learner, whom the
  //      `prove` rung exists to catch, and who must not be ranked away; a deeper
  //      concept someone else swept is not more urgent than their own proof;
  //   3. otherwise CURRICULUM DEPTH, but ONLY once every unfinished concept is
  //      established (rung `transfer`): that is the case where there is nothing
  //      left to measure anywhere and the honest place to continue is the
  //      furthest thing the learner has almost finished — where their course
  //      actually is. While any unfinished concept is still unestablished, the
  //      model's own weakest-first order stands, because that order carries a
  //      property this must not destroy: it is stable in the record's own
  //      arrival order, which is what the out-of-order-sync suite pins. A
  //      learner with one thin answer on three concepts is not sent to the
  //      highest-staged of them; that would make the advice depend on the
  //      curriculum rather than on the record, and the record is the point.
  const unfinished = touched.filter((e) => !conceptDone(e, canTransfer));
  const allEstablished = unfinished.length > 0 && unfinished.every((e) => stageOf(e) === "transfer");
  const open =
    unfinished.find((e) => stuckOn(e)) ??
    unfinished.find((e) => stageOf(e) === "prove") ??
    (allEstablished
      ? [...unfinished].sort((a, b) =>
          (getConcept(b.conceptId)?.stage ?? 0) - (getConcept(a.conceptId)?.stage ?? 0) || a.mastery - b.mastery,
        )[0]
      : unfinished[0]);

  /** The action a concept's own rung calls for. `becauseOf`, when set, means
   *  this concept is being served as the FOUNDATION of that one. */
  const stageSeed = (conceptId: string, becauseOf: string | null): ActionSeed => {
    const e = snap.evidence.find((x) => x.conceptId === conceptId);
    const nm = name(conceptId);
    const stage = e ? stageOf(e) : "unmeasured";
    const attempts = e?.attempts ?? 0;
    // HOW the work was done, from the fold-owned count.
    //
    // This line read `hintsUsed` — the per-level tally the hint endpoint writes
    // and the fold cannot reproduce (lib/replay.ts's LEDGER_ABSENT_FIELDS) — so
    // for any learner whose answers arrived from a device after working offline
    // it announced "0 hints used" no matter how much help was taken, including
    // in the same card as the branch below that had *just* read `hintedAnswers`
    // to decide the concept's rung. The card answered "why am I seeing this?"
    // with a number the record contradicted.
    const helped = e?.hintedAnswers ?? 0;
    const attemptText = `${attempts} ${t(attempts === 1 ? "next.ev.attemptsOne" : "next.ev.attempts")} · ${helped} ${t(helped === 1 ? "next.ev.helpedOne" : "next.ev.helped")}`;
    if (becauseOf) {
      // UNKNOWN IS NOT WEAK, and the sentence has to say which one this is. An
      // unmeasured prerequisite is material the learner has never been asked
      // about, so the honest reason is "you have not covered this yet" — the
      // older wording ("it is not established yet") reads as a judgement on a
      // concept nothing has been measured about, which is the same defect the
      // teacher surface was fixed for: absence of evidence shown as failure.
      const untouched = stage === "unmeasured";
      const foundational = untouched || stage === "introduce";
      return {
        kind: foundational ? "EXPLAIN" : "PRACTISE",
        conceptId,
        title: `${t("next.title.learn")}: ${nm}`,
        reason: fill(t(untouched ? "next.reason.prereqNew" : "next.reason.prereqFirst"), { next: name(becauseOf) }),
        evidence: attempts === 0 ? t("next.ev.noEvidence") : `${attemptText} · ${t("next.ev.mastery")} ${Math.round((e?.mastery ?? 0) * 100)}%`,
        minutes: 8,
      };
    }
    switch (stage) {
      case "unmeasured":
      case "introduce":
        return {
          kind: "EXPLAIN", conceptId, title: `${t("next.title.learn")}: ${nm}`,
          reason: t("next.reason.explain"),
          evidence: attempts === 0 ? t("next.ev.noEvidence") : `${attemptText} · ${t("next.ev.confBuilding")}`,
          minutes: 8,
        };
      case "practise":
        return {
          kind: "PRACTISE", conceptId, title: `${t("next.title.practise")}: ${nm}`,
          reason: `${t("next.reason.practisePre")} ${Math.round((e?.mastery ?? 0) * 100)}${t("next.reason.practisePost")}`,
          evidence: `${attemptText} · ${t("next.ev.mastery")} ${Math.round((e?.mastery ?? 0) * 100)}%`,
          minutes: 8,
        };
      case "prove":
        return {
          kind: "PRACTISE", conceptId, title: `${t("next.title.prove")}: ${nm}`,
          reason: t("next.reason.proveNoHelp"),
          evidence: `${attemptText} · ${t("next.ev.needsNoHelp")}`,
          minutes: 8,
        };
      default:
        return {
          kind: "TRANSFER", conceptId, title: `${t("next.title.stretch")}: ${nm}`,
          reason: t("next.reason.transfer"),
          evidence: `${t("next.ev.mastery")} ${Math.round((e?.mastery ?? 0) * 100)}% · ${t("next.ev.confidence")} ${e?.confidence === null || e?.confidence === undefined ? t("next.ev.confBuilding") : `${Math.round(e.confidence * 100)}%`}`,
          minutes: 8,
        };
    }
  };

  // 1. REMEDIATE — a named misconception recurring (≥2 hits): fix the cause.
  //
  // FIRST, above the foundations detour, because it is the better-founded
  // claim: a slip the record has actually named twice is evidence, while an
  // unestablished prerequisite is often only an absence of measurement. When
  // both are true the learner is told the specific, checkable thing.
  for (const e of snap.evidence) {
    if (e.misconceptionHits >= 2 && e.topMisconception && out.length < max && !out.some((a) => a.conceptId === e.conceptId)) {
      const m = MISCONCEPTIONS_BY_ID[e.topMisconception];
      const mName = m ? beliefName(t, m.id) : "";
      const recent = recentFor(ledger, e.conceptId, 4);
      push({
        kind: "REMEDIATE", conceptId: e.conceptId,
        title: `${t("next.title.fix")}: ${name(e.conceptId)}`,
        // THE DICTIONARY OWNS THE QUOTES. This template used to wrap the name
        // in hard-coded “ ”, while every one of the fifteen dictionaries ALSO
        // carries the language's own marks around the same slot — so the
        // translator path rendered `““Sign slip””`, and in French, German,
        // Arabic, Persian and Portuguese it mixed two quoting systems
        // (`mais « “Sign slip” »`, `aber „ “Sign slip” “`). The English
        // fallback table below has no marks of its own, which is exactly why
        // this survived: the one path nobody reads in production was the only
        // one that looked right.
        reason: m
          ? `${t("next.reason.remediatePre")}${mName}${t("next.reason.remediatePost")}`
          : t("next.reason.remediateNoName"),
        evidence: `${e.attempts} ${t(e.attempts === 1 ? "next.ev.attemptsOne" : "next.ev.attempts")} · ${t("next.ev.mastery")} ${Math.round(e.mastery * 100)}% · ${t("next.ev.sameSlip")} ${e.misconceptionHits}×`,
        minutes: 10,
      }, { evidenceIds: recent.map((a) => a.id) });
      break;
    }
  }

  // 2. FOUNDATIONS — the learner is STUCK on a concept whose declared
  // prerequisite they have not established, so repair the prerequisite first.
  //
  // The one branch that can send work BACKWARDS on purpose, and it is narrow for
  // three separate reasons. The relation is declared by the content (168 edges),
  // not inferred from order — and it only fires when the open concept's own
  // record shows the learner is stuck on it (`stuckOn`: measured, below the bar,
  // and a wrong answer). Before that gate existed this branch was first and
  // unconditional, so a learner who was accurate-with-help on the concept their
  // diagnostic measured was sent back to an unmeasured prerequisite instead of
  // being asked to prove the thing they had just done — and every cohort learner
  // in the benchmark got a page-one detour. Trailing a learner is not repair.
  //
  // ── AND "STUCK" IS NOT "FORGOT" ─────────────────────────────────────────
  // A failed DELAYED RECALL is not a demonstration that the learner cannot do
  // the work: it is a memory that lapsed, and the record names it (retention
  // state "forgotten"). For a learner whose newest answer is one of those, the
  // remedy is the concept itself — its own rung re-secures it, and the schedule
  // already pulls the next review forward — while a detour INTO an unmeasured
  // prerequisite displaces that with work no evidence asked for. It also reads
  // absence as the cause of a measured failure, which is the one diagnosis this
  // codebase refuses everywhere else. The remedy for a lapse is the thing that
  // lapsed; the foundation detour keeps its place for a learner still failing
  // ordinary work, which is why the newest answer is the fact consulted.
  if (open && out.length < max && stuckOn(open) && !latestAnswerWasForgottenRecall(ledger?.get(open.conceptId))) {
    const unmet = unmetPrerequisites(open.conceptId, state);
    if (unmet.length) {
      const foundation = unmet[0];
      const ids = recentFor(ledger, foundation, 4).map((a) => a.id);
      push(stageSeed(foundation, open.conceptId), { evidenceIds: ids });
    }
  }

  // 3. RETRIEVE — spaced review due today. Below the foundations repair above,
  // and above ordinary work: the schedule is the one thing that decays if it is
  // ignored, but a concept built on a missing foundation does not come back.
  const due = dueReviews(state, now).slice(0, 3);
  for (const d of due) {
    if (out.length >= max) break;
    const c = getConcept(d.conceptId);
    if (!c) continue;
    // ── ONE CONCEPT, ONE ROW ───────────────────────────────────────────────
    // A concept already scheduled above — the REMEDIATE pick, or a foundation
    // repair — must not be scheduled twice. It could be: a concept can be both
    // an unmet prerequisite of the open one AND due for review, and the plan
    // then carried two rows for it with CONTRADICTORY sentences, because the
    // two branches decide from different facts. Measured on cohort_0:
    //
    //   PRACTISE angles-lines  "Circle theorems is built on this, and it is
    //                           not established yet — this comes first."
    //   RETRIEVE angles-lines  "You proved this before — a quick retrieval now
    //                           makes it stick."
    //
    // Both facts are true (mastery 64% is below the established bar; an
    // unaided proof exists), but a learner reading one session's plan cannot
    // be told both. The repair goes first because it is more urgent, and the
    // repair row already covers this concept — the foundation branch decides
    // its rung from `stageOf`, which is the same ladder the schedule reads.
    // The open-concept branch below has always had this guard; the retrieval
    // branch was the one place it was missing.
    if (out.some((a) => a.conceptId === d.conceptId)) continue;
    const recent = recentFor(ledger, d.conceptId, 3);
    // THE CLAIM IS CHOSEN FROM THE EVIDENCE, not from the fact that a review is
    // due. This branch fired for any concept whose interval had elapsed, and
    // said "You proved this before" to all of them — including a learner who had
    // never once answered that concept without help: measured at the same
    // mastery as a learner with nine unaided answers, told the same untrue
    // thing, in the same decision list where the concept's own rung said "Prove
    // it: do one unaided before moving on". A due review is a fact about the
    // SCHEDULE; a proof is a fact about the learner, and only the second may be
    // asserted here.
    const ev = snap.evidence.find((x) => x.conceptId === d.conceptId);
    const proved = ev ? provedUnaided(ev) : false;
    push({
      kind: "RETRIEVE", conceptId: d.conceptId,
      title: `${t("next.title.retrieve")}: ${name(d.conceptId)}`,
      reason: t(proved ? "next.reason.retrieve" : "next.reason.retrieveUnproved"),
      evidence: `${t("next.ev.mastery")} ${Math.round(d.mastery * 100)}% · ${t("next.ev.overdue")} ${d.overdueBy < 1 ? t("next.ev.today") : `${Math.floor(d.overdueBy)}${t("next.ev.days")}`}`,
      minutes: 5,
    }, { dueToday: d.overdueBy < 1, whyKey: "next.why.due", evidenceIds: recent.map((a) => a.id) });
  }

  // 4. THE OPEN CONCEPT — the weakest one whose ladder is unfinished, served the
  // way its own rung calls for. This is the branch the ladder replaced: mastery
  // and confidence cannot tell "done with help" from "done alone", and the
  // answer differs — prove it, versus use it on unfamiliar wording.
  if (open && out.length < max && !out.some((a) => a.conceptId === open.conceptId)) {
    const ids = recentFor(ledger, open.conceptId, 4).map((a) => a.id);
    push(stageSeed(open.conceptId, null), { evidenceIds: ids });
  }

  // 5. ADVANCE — nothing left open: move to the next concept in the CURRICULUM.
  //
  // The frontier is the furthest concept in specification order the learner has
  // any evidence on; the next thing is the one after it. If that concept's
  // declared foundations are not established, those are the work instead (a new
  // concept built on a missing one is how the gap becomes permanent). If the
  // specification has nothing after the frontier, the learner has reached the
  // end of what this course contains and the branches below decide.
  if (!open && touched.length > 0 && out.length < max) {
    const subj = state.profile.subjects[0] ?? "maths";
    const order = bySubject(subj);
    const frontier = order.reduce((n, c, i) => ((state.progress[c.id]?.attempts ?? 0) > 0 ? i : n), -1);
    const next = frontier >= 0 ? order[frontier + 1] : order[0];
    if (next) {
      const unmet = unmetPrerequisites(next.id, state);
      if (unmet.length) {
        const foundation = unmet[0];
        const ids = recentFor(ledger, foundation, 4).map((a) => a.id);
        push(stageSeed(foundation, next.id), { evidenceIds: ids });
      } else {
        const met = (next.prereqs ?? []).map((pid) => name(pid)).join(", ");
        push({
          kind: "CHALLENGE", conceptId: next.id,
          title: `${t("next.title.advance")}: ${name(next.id)}`,
          reason: fill(t("next.reason.advance"), { next: name(next.id) }),
          evidence: met ? `${t("next.ev.prereqsMet")}: ${met}` : `${t("next.ev.kcapability")}`,
          minutes: 10,
        }, { evidenceIds: recentFor(ledger, touched[0]?.conceptId ?? "", 3).map((a) => a.id) });
      }
    }
  }

  // 6. PROJECT — 3+ concepts finished on the ladder unlocks building. Keyed on
  // demonstrated-and-transferred rather than on mastery >= 0.9, which
  // `statusOf` calls "strong" and which the smoothing makes all but unreachable:
  // a learner could hold four proved, transferred concepts with no active slip
  // and still never reach it.
  const doneCount = touched.filter((e) => conceptDone(e, canTransfer)).length;
  if (out.length < max && doneCount >= 3) {
    push({
      kind: "PROJECT", conceptId: null,
      title: t("next.title.build"),
      reason: `${doneCount} ${t("next.ev.demonstrated")}${t("next.reason.project")}`,
      evidence: t("next.ev.kcapability"),
      minutes: 30,
    }, { budgetMinutes: 30 }); // cohort-level trigger
  }

  // 7. REST — nothing due, nothing weak: honest completion, not a streak trap.
  if (out.length === 0) {
    if (snap.touched === 0) {
      push({
        kind: "EXPLAIN", conceptId: null,
        title: t("next.title.startPoint"),
        reason: t("next.reason.startPoint"),
        evidence: t("next.ev.noEvidence"),
        minutes: 3,
      });
      out[0].href = "/diagnostic/maths";
    } else {
      push({ kind: "REST", conceptId: null, title: t("next.title.caughtUp"), reason: t("next.reason.rest"), evidence: `${snap.strong} ${t("next.ev.strong")} · ${snap.dueCount} ${t("next.ev.due")}`, minutes: 0 });
    }
  }
  return out.slice(0, max);
}

// English fallbacks — keep engine output complete when no translator is passed.
//
// EXPORTED so the harness can assert every key in here ALSO exists in the `en`
// dictionary. It is tempting to treat this table as "the English strings", but
// it is only reached when a caller passes no translator — and every page passes
// one. A key that lives only here renders as a raw key on screen, which is how
// `next.why.examNow` shipped into an English next-step card.
export const EN_NEXT: Record<string, string> = {
  "next.title.fix": "Fix", "next.title.retrieve": "Retrieve", "next.title.learn": "Learn",
  "next.title.practise": "Practise", "next.title.stretch": "Stretch",
  // ADVANCE. The kind is CHALLENGE (see `desiredPlan`) — "new ground" was always
  // what a CHALLENGE was for; what was wrong was its target, not its name.
  "next.title.advance": "Next topic",
  "next.reason.advance": "You have demonstrated everything up to here — next is {next}.",
  // FOUNDATIONS. Names the concept that DEPENDS on the work being served, so the
  // learner can see why a step backwards is the next step.
  "next.reason.prereqFirst": "{next} is built on this, and it is not established yet — this comes first.",
  // The UNMEASURED half, kept separate on purpose: nothing has been asked about
  // this concept, so there is no judgement to report — only coverage.
  "next.reason.prereqNew": "{next} is built on this, and you have not covered it yet — this comes first.",
  // The PROVE branch: accuracy earned with help is not independence.
  "next.title.prove": "Prove it",
  "next.title.build": "Build something", "next.title.startPoint": "Find your starting point",
  "next.title.caughtUp": "Caught up",
  // The quotes belong here (and in every dictionary), NOT in the composition:
  // see the REMEDIATE branch, where a hard-coded pair doubled them.
  "next.reason.remediatePre": "You can do the steps, but “", "next.reason.remediatePost": "” keeps recurring — let's repair that slip.",
  "next.reason.remediateNoName": "The same slip keeps recurring — let's repair the cause, not the symptom.",
  "next.reason.retrieve": "You proved this before — a quick retrieval now makes it stick.",
  // The other half of a due review: the schedule elapsed, but nothing has been
  // done unaided yet. It says what a review is FOR without claiming a proof the
  // record does not hold.
  "next.reason.retrieveUnproved": "This is due for review and has not been done unaided yet — recalling it now is what tells us where it really stands.",
  "next.reason.explain": "Straightforward steps are shaky — rebuild the idea before drilling.",
  // No trailing space on the prefix: the template joins with its own space, so
  // "at " produced "at  38%" in every reason served from this table. The
  // verifier pins this table to the `en` dictionary key-by-key, which is why a
  // one-character difference here went unnoticed while the text was still
  // English in both.
  "next.reason.practisePre": "You solve straightforward ones at",  "next.reason.practisePost": "% — now recognise when the method applies.",
  "next.reason.proveNoHelp": "You have got these right, but every one needed help — do one unaided before moving on.",
  "next.reason.transfer": "Straightforward questions are solid — now the same idea in unfamiliar wording.",
  "next.reason.project": " concepts strong — apply them in a project.",
  "next.reason.startPoint": "A 3-minute diagnostic maps what you actually know.",
  "next.reason.rest": "Nothing due. Rest — retrieval will resurface items on schedule.",
  "next.ev.attempts": "attempts", "next.ev.attemptsOne": "attempt", "next.ev.mastery": "mastery", "next.ev.sameSlip": "same slip",
  // Scaffolding demand as the LEDGER records it: answers that took help, not a
  // tally of hints — the tally is absent from a rebuilt model (replay.ts).
  "next.ev.helped": "needed help", "next.ev.helpedOne": "needed help", "next.ev.confidence": "confidence", "next.ev.confBuilding": "confidence building",
  "next.ev.needsNoHelp": "nothing done unaided yet",
  "next.ev.prereqsMet": "foundations met",
  "next.ev.demonstrated": "demonstrated",
  "next.ev.overdue": "overdue", "next.ev.today": "today", "next.ev.days": "d",
  "next.ev.strong": "strong", "next.ev.touched": "touched so far", "next.ev.due": "due",
  "next.ev.noEvidence": "No answers recorded yet", "next.ev.kcapability": "Knowledge → capability",
  // Why NOW — the deadline half of the decision, kept separate from the reason.
  "next.why.examNow": "Your {exam} paper is in {n} days — this is the highest-value work today.",
  "next.why.examSoon": "{n} days to {exam} — enough time to close this properly.",
  "next.why.dueToday": "Retrieval for this is due today.",
  "next.why.noExam": "No exam date set — the order follows your evidence.",
  // The generic fallback must be TRUE for every kind that reaches it: unlike the
  // per-branch reasons, this line is shared, so a claim about the learner ("the
  // weakest evidence") is a claim it cannot support for most of them.
  "next.why.evidence": "No deadline is pressing — this is what your evidence points to right now.",
  // A review that is overdue (rather than due today): the timing fact IS the
  // reason it is the right work now, and it is a fact about the schedule.
  "next.why.due": "This review is overdue — the gap is what makes recalling it worth doing today.",
  "next.why.rest": "Nothing is pressing: nothing is due and nothing is weak.",
  // The loop's forward half: what this session is expected to ESTABLISH.
  "next.outcome.explain": "After this: the idea is understood and answerable without help.",
  "next.outcome.practise": "After this: the method holds up under independent exam-style questions.",
  "next.outcome.retrieve": "After this: the knowledge is refreshed and still yours.",
  "next.outcome.remediate": "After this: the recurring slip is repaired, not just avoided once.",
  "next.outcome.challenge": "After this: the next concept has its first real evidence.",
  "next.outcome.transfer": "After this: the idea survives unfamiliar wording — the strongest evidence there is.",
  "next.outcome.project": "After this: strong concepts become a piece of work you can show.",
  "next.outcome.rest": "Nothing to establish — come back when retrieval is due.",
};
