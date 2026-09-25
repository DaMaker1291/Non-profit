// ─────────────────────────────────────────────────────────────────────────────
// DEADLINES — calendar days, counted from a date-only string.
//
// A countdown is a claim about time, and time is where a UI quietly lies. Three
// rules this module exists to enforce:
//
//   1. A date-only string ("2027-06-12") is a CALENDAR day, not an instant.
//      Parsing it as an instant and subtracting makes "the exam is today" flip
//      to "tomorrow" for part of every day, in every timezone east or west of
//      the writer's.
//   2. An impossible date is not a date. `new Date(2026, 1, 31)` rolls silently
//      into 3 March; a stored "2026-02-31" must resolve to null (no countdown)
//      rather than to a deadline three days later.
//   3. Absent means ABSENT. Nothing here invents a session, a term or a default
//      exam date: a learner who has not chosen one sees no countdown, because a
//      fabricated deadline is worse than none.
//
// It is a module rather than a component body so the arithmetic is testable on
// its own — a component can only be proved by rendering it, and the interesting
// failures here are arithmetic.
// ─────────────────────────────────────────────────────────────────────────────

export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A date-only string as LOCAL midnight, or null when it is not a real day. */
export function calendarDay(date: string | undefined | null): Date | null {
  if (!date || !DATE_ONLY.test(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  // Rejects 2026-02-31: Date would have rolled it into March.
  if (day.getFullYear() !== y || day.getMonth() !== m - 1 || day.getDate() !== d) return null;
  return day;
}

/** Whole days from `from` to `date`: 0 today, 1 tomorrow, negative once past.
 *  Null when `date` is absent or impossible. */
export function daysUntil(date: string | undefined | null, from: Date = new Date()): number | null {
  const target = calendarDay(date);
  if (!target) return null;
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** How a deadline should be spoken about: far enough to plan, imminent, today,
 *  or already past. `none` when there is no deadline at all — a state, not a
 *  count of zero. */
export type DeadlineBand = "none" | "upcoming" | "imminent" | "today" | "past";

export function deadlineBand(date: string | undefined | null, from: Date = new Date()): DeadlineBand {
  const days = daysUntil(date, from);
  if (days === null) return "none";
  if (days < 0) return "past";
  if (days === 0) return "today";
  if (days <= 7) return "imminent";
  return "upcoming";
}
