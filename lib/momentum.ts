// ─────────────────────────────────────────────────────────────────────────────
// MOMENTUM — the motivational layer, folded from the record rather than awarded.
//
// The product had no answer to "why should I come back tomorrow?". Every number
// on Home described the learner's standing (measured, independent, transferred,
// mastered) and none of them described PROGRESS IN TIME, which is what a streak
// and a milestone actually are.
//
// This module adds both, and it is deliberately built out of evidence rather
// than out of a game system:
//
//   · A streak is DAYS ON WHICH THE LEDGER HOLDS AN ANSWER. Not a login, not a
//     page view, not a tap on a button: a graded answer is the only event this
//     product will call work. A learner who opens the app twice and answers
//     nothing does not extend a run, because the record says they did nothing.
//   · A milestone is a THRESHOLD ON A COUNTED FACT — five concepts answered,
//     ten hint-free answers, a slip missed and then answered correctly. Each one
//     is earned at the event that crossed it, so the date shown beside an earned
//     milestone is a real timestamp from the ledger, not the day the UI noticed.
//   · Nothing here is a currency. There are no points to spend, no rank against
//     another learner and no percentage of a holding you do not have. A "streak
//     freeze" or an "XP boost" would be an invented resource, and the first time
//     it decided what a learner was shown it would be a fabricated claim.
//
// Two properties the rest of the app relies on:
//
//   · PURE. It takes events and a clock and returns numbers, so the engine suite
//     can assert a seven-day run and a broken one without a browser or a server.
//   · UNKNOWN IS NOT ZERO. A learner with no events has no streak and no earned
//     milestone; the caller renders "the first one is one answer away" rather
//     than "0 days", because a run of zero days is not a fact about anybody.
// ─────────────────────────────────────────────────────────────────────────────

import type { EvidenceEvent } from "./evidence";

/** One UTC day, in milliseconds. Day indices are local calendar days, so a
 *  learner answering at 23:50 and again at 00:10 has worked on two days — which
 *  is what a streak means to the person living it. */
const DAY = 86_400_000;

/** The local calendar day a timestamp falls on, as a day index.
 *
 *  Built from the date's LOCAL parts and then re-encoded in UTC, so the result is
 *  an integer that is stable within a day and comparable across days, without a
 *  timezone library. `Math.floor(at / DAY)` would have been the one-liner and it
 *  is wrong: it counts UTC days, so a learner in Auckland would see their run
 *  break at 12:00 local, and one in Los Angeles would see two days merge. */
export function dayOf(at: number): number {
  const d = new Date(at);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
}

/** The weekday a day index names, in UTC — the encoding `dayOf` produced. */
export function weekdayOf(day: number): number {
  return new Date(day * DAY).getUTCDay();
}

/** Everything the counted facts are folded from, in ONE pass over the record.
 *
 *  The sets are internal: a caller reads `Tally`, which holds counts, because a
 *  UI that receives the learner's whole concept set will eventually render it,
 *  and this row is a summary rather than a second knowledge map. */
interface Fold {
  answers: number;
  correct: number;
  /** Hint-free correct answers: the same rule the proof vocabulary uses. */
  clean: number;
  /** Correct answers on an unfamiliar re-wording. */
  transfer: number;
  concepts: Set<string>;
  days: Set<number>;
  /** Answers per local day. Kept as a map rather than re-walking the stream for
   *  "how many did I do today", so the count and the run can never disagree. */
  perDay: Map<number, number>;
  /** Beliefs the learner has answered INCORRECTLY on an item built to catch
   *  them. The tags name what the item was built to discriminate, and a wrong
   *  answer is the record saying which one it caught. */
  missed: Set<string>;
  /** Of those, the ones the learner has since answered correctly on a tagged
   *  item — the narrow, checkable meaning of "fixed a slip". */
  fixed: Set<string>;
  /** The run in progress, its last day, and the longest run seen. */
  run: number;
  runDay: number | null;
  best: number;
}

/** The counted facts a milestone threshold is compared against. */
export interface Tally {
  answers: number;
  correct: number;
  clean: number;
  transfer: number;
  concepts: number;
  days: number;
  bestStreak: number;
  fixedSlips: number;
}

function emptyFold(): Fold {
  return {
    answers: 0, correct: 0, clean: 0, transfer: 0,
    concepts: new Set(), days: new Set(), perDay: new Map(), missed: new Set(), fixed: new Set(),
    run: 0, runDay: null, best: 0,
  };
}

function tallyOf(f: Fold): Tally {
  return {
    answers: f.answers,
    correct: f.correct,
    clean: f.clean,
    transfer: f.transfer,
    concepts: f.concepts.size,
    days: f.days.size,
    bestStreak: f.best,
    fixedSlips: f.fixed.size,
  };
}

/** Answers, oldest first. Only `answer_submitted` extends anything: a diagnostic
 *  that was opened and abandoned, a paper that was read, an erased record — none
 *  of them is work, and counting them would make the streak a measure of visits
 *  rather than of learning.
 *
 *  Ordered by `at`, the SERVER's clock — the same field retention and due dates
 *  read. `deviceAt` is the device's own claim and is deliberately not used: it
 *  would let a handset with a wrong clock (or a learner changing it) rewrite the
 *  order of their own history. */
function answersInOrder(events: readonly EvidenceEvent[]) {
  return [...events]
    .filter((e): e is Extract<EvidenceEvent, { type: "answer_submitted" }> => e.type === "answer_submitted")
    .sort((a, b) => a.at - b.at);
}

function apply(f: Fold, e: Extract<EvidenceEvent, { type: "answer_submitted" }>): void {
  f.answers += 1;
  if (e.correct) f.correct += 1;
  if (e.correct && e.hints === 0) f.clean += 1;
  if (e.correct && e.mode === "transfer") f.transfer += 1;
  if (e.conceptId) f.concepts.add(e.conceptId);

  const day = dayOf(e.at);
  f.days.add(day);
  f.perDay.set(day, (f.perDay.get(day) ?? 0) + 1);
  if (f.runDay === null) {
    // The first answer STARTS the run on its own day. Without this assignment
    // `runDay` stayed null for the whole stream, so every later answer took this
    // branch and the run was reset to one day — a seven-day streak folded as
    // `best: 1`, which the suite caught before the panel ever rendered it.
    f.run = 1;
    f.runDay = day;
  } else if (day !== f.runDay) {
    f.run = day === f.runDay + 1 ? f.run + 1 : 1;
    f.runDay = day;
  }
  if (f.run > f.best) f.best = f.run;

  // A SLIP IS A BELIEF THE ITEM AIMED AT AND THE ANSWER MISSED. The tags say
  // what the item was built to discriminate, so a wrong answer on a tagged item
  // is the record naming the belief it caught; a later correct answer on an
  // item tagged the same way is the learner getting past it. That is the whole
  // definition — no model inference, no re-scoring of the concept.
  const tags = Array.isArray(e.tags) ? e.tags : [];
  if (!e.correct) for (const tag of tags) f.missed.add(tag);
  else for (const tag of tags) if (f.missed.has(tag)) f.fixed.add(tag);
}

/** A milestone: a threshold on a counted fact, and the words it is shown in.
 *
 *  `key` is an i18n KEY, never a sentence: the label has to exist in all fifteen
 *  dictionaries, and a milestone a Spanish learner reads in English is the same
 *  failure the coaching paragraphs had. */
export interface MilestoneDef {
  id: string;
  key: string;
  target: number;
  of: (t: Tally) => number;
}

/**
 * SEVEN, IN THE ORDER A LEARNER MEETS THEM.
 *
 * The set is small on purpose. A wall of forty badges is a wall of things you
 * have not done; seven is a shelf, and each one names a capability the product
 * actually measures elsewhere — a clean answer here is the same clean answer My
 * Evidence counts, and a fixed slip is the same belief the repair card teaches.
 */
export const MILESTONES: readonly MilestoneDef[] = [
  { id: "first-answer", key: "mom.m.first", target: 1, of: (t) => t.answers },
  { id: "first-clean", key: "mom.m.clean", target: 1, of: (t) => t.clean },
  { id: "five-concepts", key: "mom.m.concepts", target: 5, of: (t) => t.concepts },
  { id: "slip-fixed", key: "mom.m.slip", target: 1, of: (t) => t.fixedSlips },
  { id: "streak-three", key: "mom.m.streak3", target: 3, of: (t) => t.bestStreak },
  { id: "ten-clean", key: "mom.m.clean10", target: 10, of: (t) => t.clean },
  { id: "first-transfer", key: "mom.m.transfer", target: 1, of: (t) => t.transfer },
];

/** One milestone, as a surface renders it: how far along, and when it landed. */
export interface MilestoneState {
  id: string;
  key: string;
  target: number;
  /** Counted progress toward the target, clamped to it. */
  progress: number;
  /** The timestamp of the answer that crossed the threshold; null if it has not
   *  been crossed. This is why the fold walks in order rather than reading the
   *  final tally — the date is a fact about the record, and a milestone shown
   *  with today's date because that is when the page was opened would be a lie
   *  about when the learner earned it. */
  earnedAt: number | null;
  /** Questions still to go. 0 once earned. */
  remaining: number;
}

/** One dot in the week strip. */
export interface WeekDay {
  /** The local day index, so a caller can name the weekday without re-deriving
   *  it from a timestamp that has already been thrown away. */
  day: number;
  worked: boolean;
  today: boolean;
}

/**
 * TODAY'S TARGET, and the reason it is a constant rather than a setting.
 *
 * Every app that makes a daily habit stick gives the learner a SMALL, CLOSED
 * target: Duolingo's daily goal, RemNote's streak goal (deliberately smaller
 * than its learning goal), Anki's daily limit. The target is what turns "study
 * some maths" — which is not a task — into something with an edge you can see.
 *
 * Five, because five is the product's own session (SESSION_TARGET in
 * lib/session.ts): one sitting is one day's target, and a learner who does more
 * is not asked to. It is NOT derived from the profile's `timePerDay` minutes,
 * because converting minutes to questions would be an invented exchange rate —
 * a number this product would then be claiming to know. A learner's own target,
 * chosen on a screen, would be the honest way to personalise it; a constant
 * that matches the sitting they already do is the honest way to start.
 */
export const DAILY_TARGET = 5;

export interface Momentum {
  /** Answers recorded TODAY, local time. Zero is a fact here (nothing recorded
   *  yet today) — unlike a dimension, which is null when unmeasured. */
  today: number;
  /** Today's target, in answers. */
  target: number;
  /** Answers still needed to meet today's target; 0 once it is met. */
  toGo: number;
  /** Whether today's target has been met. "Met" is not "mastered": it counts
   *  work done, which is exactly what a goal is allowed to count. */
  met: boolean;
  /** Consecutive days ending today, or ending yesterday when today is empty —
   *  a run is not broken by a day that has not finished. */
  streak: number;
  /** True when the run is alive but today has no answer yet: the one state that
   *  deserves a nudge rather than a celebration. */
  atRisk: boolean;
  /** The longest run this learner has ever had, which is what the three-day and
   *  seven-day milestones are measured on. */
  best: number;
  /** Distinct days with an answer, ever. */
  days: number;
  /** The last seven local days, oldest first, TODAY LAST. */
  week: WeekDay[];
  answers: number;
}

export interface MomentumView {
  momentum: Momentum;
  milestones: MilestoneState[];
  /** The next milestone to aim at: the first one not yet earned, in declared
   *  order. Null when every milestone has been earned. */
  next: MilestoneState | null;
}

/**
 * THE ONE ENTRY POINT.
 *
 * `now` is a parameter rather than a call to `Date.now()` inside, so a test can
 * ask what a seven-day run looked like on the eighth day and get an answer, and
 * so the week strip is computed against the same instant as the streak.
 */
/**
 * THE MILESTONES A SITTING EARNED, not the ones the learner happens to hold.
 *
 * A session-end screen is the one moment where "you just did this" is true and
 * checkable: the crossing is a timestamp in the ledger (`earnedAt`), and the
 * sitting has a start (`SessionResult.startedAt`). Comparing the two is the
 * whole rule — a milestone earned last week is NOT news, and a badge shown as
 * though the learner had just earned it would be exactly the kind of claim this
 * module exists to avoid.
 */
export function earnedSince(view: MomentumView, since: number): MilestoneState[] {
  return view.milestones.filter((m) => m.earnedAt !== null && m.earnedAt >= since);
}

export function momentumOf(events: readonly EvidenceEvent[], now: number = Date.now()): MomentumView {
  const stamp = new Map<string, number>();
  const f = emptyFold();
  for (const e of answersInOrder(events)) {
    apply(f, e);
    const t = tallyOf(f);
    // The crossing is stamped at the event that crossed it, in the same pass.
    for (const m of MILESTONES) if (!stamp.has(m.id) && m.of(t) >= m.target) stamp.set(m.id, e.at);
  }
  const tally = tallyOf(f);
  const todayIndex = dayOf(now);
  const todayCount = f.perDay.get(todayIndex) ?? 0;

  // The run, read against TODAY rather than against the last answer: a learner
  // who worked every day last week and stopped has a best of seven and a current
  // streak of zero, and both of those are true at once.
  let streak = 0;
  let atRisk = false;
  if (f.days.has(todayIndex)) {
    let d = todayIndex;
    while (f.days.has(d)) { streak += 1; d -= 1; }
  } else if (f.days.has(todayIndex - 1)) {
    let d = todayIndex - 1;
    while (f.days.has(d)) { streak += 1; d -= 1; }
    atRisk = true;
  }

  const week: WeekDay[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = todayIndex - i;
    week.push({ day, worked: f.days.has(day), today: i === 0 });
  }

  const milestones: MilestoneState[] = MILESTONES.map((m) => {
    const progress = Math.max(0, Math.min(m.target, m.of(tally)));
    return {
      id: m.id,
      key: m.key,
      target: m.target,
      progress,
      earnedAt: stamp.get(m.id) ?? null,
      remaining: Math.max(0, m.target - progress),
    };
  });

  return {
    momentum: {
      today: todayCount,
      target: DAILY_TARGET,
      toGo: Math.max(0, DAILY_TARGET - todayCount),
      met: todayCount >= DAILY_TARGET,
      streak,
      atRisk,
      best: f.best,
      days: f.days.size,
      week,
      answers: f.answers,
    },
    milestones,
    next: milestones.find((m) => m.earnedAt === null) ?? null,
  };
}
