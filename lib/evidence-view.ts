// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE → EXPERIENCE (the read half of the loop).
//
// The decision engine (lib/next-engine) emits `evidenceIds` — the events that
// caused the decision. This module is the ONLY translator between those raw
// events and what a learner sees, so the explanation exists in exactly one
// place and the UI never re-derives a reason. Pages render; they do not think.
//
// Two honesty rules carried over from the ledger:
//   · unknown stays unknown — a dimension with no observations renders as
//     "not yet measured", never as 0;
//   · provenance is disclosed — a device-reported answer says it was recorded
//     offline, it does not pass as server-verified.
// ─────────────────────────────────────────────────────────────────────────────

import { isDeviceReported, type AnswerSubmitted, type EvidenceEvent, type LearnerProjection } from "./evidence";

export interface LedgerFetch {
  events: EvidenceEvent[];
  projection: LearnerProjection;
}

/**
 * The THREE outcomes of reading a learner's record — never collapsed into two.
 *
 * "We have not read your record" and "your record is empty" are different
 * sentences, and a surface that cannot tell them apart either claims a learner
 * has no evidence or shows a spinner forever. So the outcome is named:
 * `loading` while the request is in flight, `ready` with the record, `failed`
 * when it did not come back. Everything that speaks about evidence reads this
 * and renders all three.
 */
export type LedgerLoad =
  | { status: "loading" }
  | { status: "ready"; ledger: LedgerFetch }
  | { status: "failed" };

/** Read the learner's ledger, saying WHICH of the three happened. */
export async function loadLedgerState(
  id: string,
  secret: string,
): Promise<{ status: "ready"; ledger: LedgerFetch } | { status: "failed" }> {
  try {
    const res = await fetch(`/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`);
    // A refusal is a failure, not an empty record: a learner whose capability
    // secret expired does not stop having answered questions.
    if (!res.ok) return { status: "failed" };
    const j = (await res.json()) as { events?: EvidenceEvent[]; projection?: LearnerProjection };
    // A 200 whose SHAPE is wrong is a failure too. Reading `events` as `[]` here
    // is how a malformed response becomes "you have demonstrated nothing".
    if (!Array.isArray(j.events) || !j.projection) return { status: "failed" };
    return { status: "ready", ledger: { events: j.events, projection: j.projection } };
  } catch {
    return { status: "failed" };
  }
}

/**
 * The ready-or-nothing form. For callers whose surface degrades honestly without
 * the record — Home's card decides from the model and simply cites nothing, and
 * the decision door marks that action `unknown` rather than `no_evidence`. A
 * surface whose PURPOSE is evidence uses `loadLedgerState` and shows all three
 * outcomes instead; see the Mind pages and /progress.
 */
export async function loadLedger(id: string, secret: string): Promise<LedgerFetch | null> {
  const r = await loadLedgerState(id, secret);
  return r.status === "ready" ? r.ledger : null;
}

/** One human-readable line about a real recorded answer. */
export interface Citation {
  id: string;
  /** "18 Sep" in the learner's locale. */
  when: string;
  /** The concept it was about, in the learner's language. */
  concept: string;
  /** The kind of evidence it is, in plain words. */
  kind: string;
  correct: boolean | null;
  /** Marks when the source carried them (a paper); null for plain answers. */
  score: { awarded: number; max: number } | null;
  /** Disclosed, never hidden: this answer was recorded offline. */
  offline: boolean;
}

export function citationsFor(
  evidenceIds: readonly string[],
  events: readonly EvidenceEvent[],
  opts: { titleFor: (conceptId: string) => string; t: (key: string) => string; locale?: string },
): Citation[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const out: Citation[] = [];
  for (const id of evidenceIds) {
    const e = byId.get(id);
    if (!e) continue; // a cited event that is not in the learner's ledger is not shown — and never invented
    if (e.type !== "answer_submitted") continue;
    out.push({
      id: e.id,
      when: new Date(e.at).toLocaleDateString(opts.locale, { day: "numeric", month: "short" }),
      concept: e.conceptId ? opts.titleFor(e.conceptId) : "",
      kind: opts.t(`evv.source.${e.source}`),
      correct: e.correct,
      score: e.score,
      // One rule for the disclosure (lib/evidence#isDeviceReported): an answer
      // authored on a device AND one the server graded only after it arrived
      // from a device's offline queue both say "recorded offline".
      offline: isDeviceReported(e),
    });
  }
  return out;
}

/** One measured dimension of the learner model, as the drawer shows it. */
export interface Dimension {
  key: "recalled" | "applied" | "transferred" | "retained";
  label: string;
  /** null = never measured. Distinct from 0, always. */
  rate: { asked: number; correct: number } | null;
  /** "strong" | "developing" once measured; null when unmeasured. */
  band: "strong" | "developing" | null;
}

function dim(
  key: Dimension["key"], label: string, r: { asked: number; correct: number } | null,
): Dimension {
  if (!r || r.asked === 0) return { key, label, rate: null, band: null };
  return { key, label, rate: r, band: r.correct / r.asked >= 0.7 ? "strong" : "developing" };
}

/**
 * The "based on" block: what the model has actually measured about the concept
 * a decision points at. Everything absent is listed as absent — the drawer
 * ends with an explicit "not yet measured" section rather than implying
 * coverage.
 */
export function basedOn(
  projection: LearnerProjection,
  conceptId: string | null,
  t: (key: string) => string,
): { dimensions: Dimension[]; unmeasured: string[] } {
  const c = conceptId ? projection.byConcept[conceptId] : null;
  const dims = [
    dim("recalled", t("evv.dim.recalled"), c && c.measured.asked > 0 ? c.measured : null),
    dim("applied", t("evv.dim.applied"), c && c.independent.asked > 0 ? c.independent : null),
    dim("transferred", t("evv.dim.transferred"), c && c.transfer.asked > 0 ? c.transfer : null),
    // Retention, once the ledger holds a delayed re-measurement of it: a due
    // concept retrieved hint-free after it had aged. Before that it is a
    // scheduled promise, not a result — and it is listed as unmeasured below
    // rather than shown as a score nobody earned.
    dim("retained", t("evv.dim.retention"), c && c.retention.asked > 0 ? c.retention : null),
  ];
  const unmeasured: string[] = [];
  for (const d of dims) if (!d.rate) unmeasured.push(d.label);
  return { dimensions: dims, unmeasured };
}

/** One row of "what we know about this concept", with the meaning attached. */
export interface KnowledgeRow extends Dimension {
  /** Which slice of the record this row counts — named so no caller has to
   *  guess whether "Recall" means every answer or only measured ones. */
  from: "all-answers" | "measured-answers" | "independent" | "transfer" | "retention";
  /** True when the learner's record holds nothing of this kind. */
  unmeasured: boolean;
}

/**
 * WHAT WE KNOW about one concept — the concept page's version.
 *
 * This is deliberately NOT `basedOn`. That function answers the DRAWER's
 * question ("what has MEASURED this learner?"), so its first row is the
 * diagnostic/paper subset — correct there, and measurable in the tests. On a
 * concept page it produces a contradiction in the learner's face: a learner
 * whose only work is practice sees "Application 5/5" beside "Recall: not yet
 * measured", as if five recorded correct answers were not recall (observed
 * live on a probe learner before this function existed).
 *
 * So this answers the learner's question instead — what do we know, from
 * everything recorded:
 *
 *   recalled     every recorded answer, any source, any mode: "when asked,
 *                how often were you right";
 *   measured     the diagnostic/paper subset, shown ONLY when it exists: "how
 *                did you do under measurement conditions";
 *   applied      hint-free proof (guided work is not independence);
 *   transferred  re-framed proof;
 *   retained     always unmeasured: the ledger cannot express a later
 *                re-measurement of the same concept yet, and saying so is the
 *                point — a "retention 0%" would be a fabricated memory loss.
 */
export function conceptKnowledge(
  projection: LearnerProjection,
  conceptId: string,
  t: (key: string) => string,
): { rows: KnowledgeRow[]; unmeasuredLabels: string[] } {
  const c = projection.byConcept[conceptId] ?? null;
  const make = (
    key: Dimension["key"], from: KnowledgeRow["from"], label: string,
    r: { asked: number; correct: number } | null,
  ): KnowledgeRow => {
    const d = dim(key, label, r);
    return { ...d, from, unmeasured: d.rate === null };
  };
  const rows: KnowledgeRow[] = [
    make("recalled", "all-answers", t("evv.dim.recalled"),
      c && c.attempts > 0 ? { asked: c.attempts, correct: c.correct } : null),
    // Only shown when measurement conditions actually happened: an empty
    // "Diagnostic: —" row would be a heading with nothing under it.
    ...(c && c.measured.asked > 0
      ? [make("recalled", "measured-answers", t("evv.source.diagnostic"), c.measured)]
      : []),
    make("applied", "independent", t("evv.dim.applied"),
      c && c.independent.asked > 0 ? c.independent : null),
    make("transferred", "transfer", t("evv.dim.transferred"),
      c && c.transfer.asked > 0 ? c.transfer : null),
    // Retention is MEASURED here when it exists: the delayed, hint-free recall
    // of a concept the scheduler had due. Same dimension the drawer shows, same
    // honesty rule — absent observations are `unmeasured`, never 0%.
    make("retained", "retention", t("evv.dim.retention"),
      c && c.retention.asked > 0 ? c.retention : null),
  ];
  return { rows, unmeasuredLabels: rows.filter((r) => r.unmeasured).map((r) => r.label) };
}

/** Newest-first answer stream for the My-evidence timeline. */
export function recentAnswers(events: readonly EvidenceEvent[], n = 12): AnswerSubmitted[] {
  return [...events]
    .filter((e): e is AnswerSubmitted => e.type === "answer_submitted")
    .sort((a, b) => b.at - a.at)
    .slice(0, n);
}

/**
 * ONE concept's own answers, newest first: the trail a concept page shows.
 *
 * Filtered from the same ledger as everything else rather than re-read from
 * the model — a page that lists "the answers behind this" must be able to show
 * them, and the model only ever kept counts. Diagnostic answers are included:
 * they are the reason a concept was ever thought weak, and hiding them would
 * make the trail start in the middle of the story.
 */
export function conceptAnswers(
  events: readonly EvidenceEvent[],
  conceptId: string,
  n = 12,
): AnswerSubmitted[] {
  return [...events]
    .filter((e): e is AnswerSubmitted => e.type === "answer_submitted" && e.conceptId === conceptId)
    .sort((a, b) => b.at - a.at)
    .slice(0, n);
}
