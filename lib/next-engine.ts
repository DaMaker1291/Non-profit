// Next Step Engine (§5): the brain. Evidence in, one ranked action list out.
// Actions: EXPLAIN · PRACTISE · RETRIEVE · REMEDIATE · CHALLENGE · TRANSFER
// · PROJECT · REST. Deterministic, explainable, no AI call required.
import { bySubject, getConcept } from "./genome";
import { fill } from "./i18n";
import { dueReviews } from "./retention";
import { buildSnapshot } from "./learner-model";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { orderEvents, type AnswerSubmitted, type EvidenceEvent } from "./evidence";
import type { ProfileState } from "./types";

/** Translator shape (lib/i18n). Optional — callers without a language get
 *  English, the wedge's fallback. */
export type NextT = (key: string) => string;
const EN: NextT = (k) => EN_NEXT[k] ?? k;
export function nextT(t: NextT | undefined): NextT { return t ?? EN; }

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
    case "CHALLENGE": return [{ kind: "practise", count: 6 }];
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
  const whyFor = (dueToday: boolean): string => {
    if (urgency === "now" && days !== null) {
      return fill(t("next.why.examNow"), { n: days, exam: examName });
    }
    if (urgency === "soon" && days !== null) {
      return fill(t("next.why.examSoon"), { n: days, exam: examName });
    }
    if (dueToday) return t("next.why.dueToday");
    if (urgency === "none" && days === null) return t("next.why.noExam");
    return t("next.why.evidence");
  };
  // Budget: the learner's own daily minutes when they told us, else the action's
  // own estimate. Never longer than they said they have.
  const budget = state.profile.timePerDay && state.profile.timePerDay > 0
    ? state.profile.timePerDay
    : Infinity;
  const push = (a: Omit<NextAction, "href" | "plan" | "urgency" | "why" | "evidenceIds" | "expectedOutcome">, opts?: { dueToday?: boolean; budgetMinutes?: number; evidenceIds?: string[] }) => {
    // REST is the one action that is not work: no plan, no press of urgency.
    const minutes = a.minutes;
    const plan = a.kind === "REST" ? [] : planFor(a.kind, Math.min(budget, opts?.budgetMinutes ?? minutes));
    out.push({
      ...a,
      href: hrefFor(a.conceptId),
      why: a.kind === "REST" ? t("next.why.rest") : whyFor(opts?.dueToday ?? false),
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

  // 1. REMEDIATE — a named misconception recurring (≥2 hits): fix the cause.
  for (const e of snap.evidence) {
    if (e.misconceptionHits >= 2 && e.topMisconception && out.length < max) {
      const m = MISCONCEPTIONS_BY_ID[e.topMisconception];
      const mName = m ? t(`mc.${m.id}`) : "";
      const recent = recentFor(ledger, e.conceptId, 4);
      push({
        kind: "REMEDIATE", conceptId: e.conceptId,
        title: `${t("next.title.fix")}: ${name(e.conceptId)}`,
        reason: m
          ? `${t("next.reason.remediatePre")}“${mName}”${t("next.reason.remediatePost")}`
          : t("next.reason.remediateNoName"),
        evidence: `${e.attempts} ${t(e.attempts === 1 ? "next.ev.attemptsOne" : "next.ev.attempts")} · ${t("next.ev.mastery")} ${Math.round(e.mastery * 100)}% · ${t("next.ev.sameSlip")} ${e.misconceptionHits}×`,
        minutes: 10,
      }, { evidenceIds: recent.map((a) => a.id) });
      break;
    }
  }

  // 2. RETRIEVE — spaced review due today.
  const due = dueReviews(state, now).slice(0, 3);
  for (const d of due) {
    if (out.length >= max) break;
    const c = getConcept(d.conceptId);
    if (!c) continue;
    const recent = recentFor(ledger, d.conceptId, 3);
    push({
      kind: "RETRIEVE", conceptId: d.conceptId,
      title: `${t("next.title.retrieve")}: ${name(d.conceptId)}`,
      reason: t("next.reason.retrieve"),
      evidence: `${t("next.ev.mastery")} ${Math.round(d.mastery * 100)}% · ${t("next.ev.overdue")} ${d.overdueBy < 1 ? t("next.ev.today") : `${Math.floor(d.overdueBy)}${t("next.ev.days")}`}`,
      minutes: 5,
    }, { dueToday: d.overdueBy < 1, evidenceIds: recent.map((a) => a.id) });
  }

  // 3. EXPLAIN / PRACTISE — weakest touched concept first.
  const weak = snap.evidence.filter((e) => e.status === "learning" || (e.mastery < 0.65 && e.attempts > 0))[0];
  if (weak && out.length < max) {
    const needsExplain = weak.mastery < 0.35 || weak.hintsUsed >= weak.attempts;
    const recent = recentFor(ledger, weak.conceptId, 4);
    push({
      kind: needsExplain ? "EXPLAIN" : "PRACTISE",
      conceptId: weak.conceptId,
      title: `${needsExplain ? t("next.title.learn") : t("next.title.practise")}: ${name(weak.conceptId)}`,
      reason: needsExplain
        ? t("next.reason.explain")
        : `${t("next.reason.practisePre")} ${Math.round(weak.mastery * 100)}${t("next.reason.practisePost")}`,
      evidence: `${weak.attempts} ${t(weak.attempts === 1 ? "next.ev.attemptsOne" : "next.ev.attempts")} · ${weak.hintsUsed} ${t(weak.hintsUsed === 1 ? "next.ev.hintsOne" : "next.ev.hints")}${weak.confidence === null ? ` · ${t("next.ev.confBuilding")}` : ` · ${t("next.ev.confidence")} ${Math.round(weak.confidence * 100)}%`}`,
      minutes: 8,
    }, { evidenceIds: recent.map((a) => a.id) });
  }

  // 4. TRANSFER / CHALLENGE — strong + confident earns harder work.
  const ripe = snap.evidence.find(
    (e) => e.mastery >= 0.75 && (e.confidence ?? 0) >= 0.6 && e.status !== "strong",
  );
  if (ripe && out.length < max) {
    const recent = recentFor(ledger, ripe.conceptId, 4);
    push({
      kind: "TRANSFER", conceptId: ripe.conceptId,
      title: `${t("next.title.stretch")}: ${name(ripe.conceptId)}`,
      reason: t("next.reason.transfer"),
      evidence: `${t("next.ev.mastery")} ${Math.round(ripe.mastery * 100)}% · ${t("next.ev.confidence")} ${ripe.confidence === null ? t("next.ev.confBuilding") : `${Math.round(ripe.confidence * 100)}%`}`,
      minutes: 8,
    }, { evidenceIds: recent.map((a) => a.id) });
  } else {
    // CHALLENGE: first untouched concept in the learner's first subject.
    const subj = state.profile.subjects[0] ?? "maths";
    const next = bySubject(subj).find((c) => (state.progress[c.id]?.mastery ?? 0) === 0);
    if (next && out.length < max && snap.touched > 0) {
      push({
        kind: "CHALLENGE", conceptId: next.id,
        title: `${t("next.title.challenge")}: ${name(next.id)}`,
        reason: t("next.reason.challenge"),
        evidence: `${snap.strong} ${t("next.ev.strong")} · ${snap.touched} ${t("next.ev.touched")}`,
        minutes: 10,
      }); // cohort-level trigger: no single concept's events caused it
    }
  }

  // 5. PROJECT — 3+ strong concepts in a subject unlocks building.
  if (out.length < max && snap.strong >= 3) {
    push({
      kind: "PROJECT", conceptId: null,
      title: t("next.title.build"),
      reason: `${snap.strong} ${t("next.ev.strong")}${t("next.reason.project")}`,
      evidence: t("next.ev.kcapability"),
      minutes: 30,
    }, { budgetMinutes: 30 }); // cohort-level trigger
  }

  // 6. REST — nothing due, nothing weak: honest completion, not a streak trap.
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
  "next.title.practise": "Practise", "next.title.stretch": "Stretch", "next.title.challenge": "New challenge",
  "next.title.build": "Build something", "next.title.startPoint": "Find your starting point",
  "next.title.caughtUp": "Caught up",
  "next.reason.remediatePre": "You can do the steps, but ", "next.reason.remediatePost": " keeps recurring — let's repair that slip.",
  "next.reason.remediateNoName": "The same slip keeps recurring — let's repair the cause, not the symptom.",
  "next.reason.retrieve": "You proved this before — a quick retrieval now makes it stick.",
  "next.reason.explain": "Straightforward steps are shaky — rebuild the idea before drilling.",
  "next.reason.practisePre": "You solve straightforward ones at ", "next.reason.practisePost": "% — now recognise when the method applies.",
  "next.reason.transfer": "Straightforward questions are solid — now the same idea in unfamiliar wording.",
  "next.reason.challenge": "Ready for new ground — one step beyond current ability.",
  "next.reason.project": " concepts strong — apply them in a project.",
  "next.reason.startPoint": "A 3-minute diagnostic maps what you actually know.",
  "next.reason.rest": "Nothing due. Rest — retrieval will resurface items on schedule.",
  "next.ev.attempts": "attempts", "next.ev.attemptsOne": "attempt", "next.ev.mastery": "mastery", "next.ev.sameSlip": "same slip",
  "next.ev.hints": "hints used", "next.ev.hintsOne": "hint used", "next.ev.confidence": "confidence", "next.ev.confBuilding": "confidence building",
  "next.ev.overdue": "overdue", "next.ev.today": "today", "next.ev.days": "d",
  "next.ev.strong": "strong", "next.ev.touched": "touched so far", "next.ev.due": "due",
  "next.ev.noEvidence": "No answers recorded yet", "next.ev.kcapability": "Knowledge → capability",
  // Why NOW — the deadline half of the decision, kept separate from the reason.
  "next.why.examNow": "Your {exam} paper is in {n} days — this is the highest-value work today.",
  "next.why.examSoon": "{n} days to {exam} — enough time to close this properly.",
  "next.why.dueToday": "Retrieval for this is due today.",
  "next.why.noExam": "No exam date set — the order follows your evidence.",
  "next.why.evidence": "This is the weakest evidence in the model right now.",
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
