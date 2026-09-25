// ─────────────────────────────────────────────────────────────────────────────
// WHAT THE TUTOR IS TOLD.
//
// The tutor used to be handed a concept id and the learner's sentence. That is
// enough to talk about algebra; it is not enough to talk to THIS learner about
// the question they are actually looking at — nothing in the prompt knew that
// the app had just put `fractions` in front of them because their independent
// work was shaky and three recorded answers said why.
//
// So the tutor's input is now the same object the surfaces render: the canonical
// decision from the one door (lib/decision), taken from the learner's projection
// — the action, its reason, its citations, its basis, the projection version
// that produced it — plus what has actually been MEASURED about the concept
// being asked about, and the misconception patterns their own answers triggered.
//
// Two rules this module exists to hold:
//
//   1. The grounding is READ, never accepted. A client may say which concept it
//      opened; it cannot say what the decision is, what the reason is, or which
//      events justify it. lib/server/tutor.ts builds that from the store.
//   2. The tutor may explain, hint, adapt and generate practice. It may not
//      write. Nothing in this file, or in the modules it feeds, touches the
//      ledger or the learner model — the only route into either is
//      append → confirm → replay/adopt (lib/server/projection.ts), and the
//      tutor is not on it.
// ─────────────────────────────────────────────────────────────────────────────

import { ctitle } from "./content-i18n";
import { getConcept } from "./genome";

/** One measured dimension of the concept being discussed: COUNTS, never a bare
 *  percentage. A dimension nobody has measured is not in this list at all —
 *  "not yet asked" and "answered wrong" are different sentences, and a tutor
 *  that confuses them tells a learner they are weak at something nobody has
 *  tested. */
export interface TutorDimension {
  key: string;
  label: string;
  asked: number;
  correct: number;
}

/** The action the surfaces are showing this learner, verbatim from the door. */
export interface TutorDecision {
  kind: string;
  conceptId: string | null;
  title: string;
  reason: string;
  basis: string;
  evidenceIds: string[];
  projectionVersion: number;
  /** The rest of the ranking, in the order the surfaces show it. */
  plan: Array<{ kind: string; conceptId: string | null; title: string }>;
}

export interface TutorGrounding {
  /** The learner this turn is grounded in, or null when there is no profile —
   *  a concept-only turn. Never a guess: the server sets it from the profile
   *  whose capability secret it checked. */
  learnerId: string | null;
  /** What the learner asked about. Their page, not the decision: a learner may
   *  open the tutor on any concept in the genome. */
  focus: { conceptId: string; title: string; subject: string | null };
  /** The one door's decision for this learner, or null without a profile. */
  decision: TutorDecision | null;
  /** Measured dimensions of the focus concept (counts and rates, or null). */
  measured: TutorDimension[];
  /** Dimensions the history has not measured, by label — the honest gaps. */
  unmeasured: string[];
  /** Belief patterns this learner's OWN recorded answers triggered, with the
   *  catalogue's coaching line, most-hit first. Not the concept's catalogue
   *  list: what this learner did. */
  misconceptions: Array<{ id: string; name: string; coaching: string; hits: number }>;
  projectionVersion: number | null;
  evidenceEvents: number;
  /** What the ledger cannot account for (a history older than the record). */
  unprojectable: { concepts: number; attempts: number } | null;
  language: string;
}

/** Learner-facing disclosure keys. A reply from the offline engine is never
 *  labelled as AI — the string that says "a model answered this" is only ever
 *  emitted when a model did. */
export const TUTOR_LABEL = {
  /** A model answered, and the learner is told which one. */
  ai: "tutor.aiNote",
  /** AI is configured on this deployment but did not answer (no key for this
   *  request, provider failure, timeout, malformed response). The offline tutor
   *  replied and the learner is told so. */
  fallback: "tutor.fallbackNote",
  /** This deployment has no model wired up at all. The offline tutor is the
   *  product, not a degraded mode. */
  offline: "tutor.offlineNote",
} as const;

export type TutorLabelKey = (typeof TUTOR_LABEL)[keyof typeof TUTOR_LABEL];

const LABEL_KEYS: string[] = [TUTOR_LABEL.ai, TUTOR_LABEL.fallback, TUTOR_LABEL.offline];

/**
 * Which disclosure line a turn earns — decided so that it cannot be escalated.
 *
 * The server sends both the source and the key, and this takes the server's key
 * when it agrees with the source. What it will not do is let a payload claim a
 * model answered: if `answerSource` is not `"ai"`, the AI key is refused and the
 * offline line is used instead, whatever the payload asked for. A learner is
 * never told "a model wrote this" by anything other than a turn a model wrote.
 */
export function disclosureKey(payload: {
  answerSource?: unknown;
  labelKey?: unknown;
  aiUnavailable?: unknown;
}): TutorLabelKey {
  const aiAnswered = payload.answerSource === "ai";
  const offered = typeof payload.labelKey === "string" && LABEL_KEYS.includes(payload.labelKey)
    ? (payload.labelKey as TutorLabelKey)
    : null;
  // A model answered: say so. It did not: the AI key is refused, whatever the
  // payload carried, and the turn is disclosed as the offline tutor's.
  if (aiAnswered) return TUTOR_LABEL.ai;
  if (offered === TUTOR_LABEL.ai) return TUTOR_LABEL.fallback;
  if (offered) return offered;
  // No usable key: a configured-but-silent model is worth saying out loud, a
  // deployment with no model at all is simply the offline product.
  return payload.aiUnavailable && payload.aiUnavailable !== "no_key"
    ? TUTOR_LABEL.fallback
    : TUTOR_LABEL.offline;
}

/** "Why is this learner seeing this question?" — the sentence the tutor (and
 *  the learner, on the tutor screen) is given. */
export function decisionLine(g: TutorGrounding): string {
  const d = g.decision;
  if (!d) return "";
  const what = d.conceptId ? ctitle(g.language, d.conceptId) : d.title;
  return `NEXT STEP SHOWN TO THIS LEARNER: ${d.kind} — ${what}. Why: ${d.reason}`;
}

/**
 * The packet a model receives.
 *
 * Everything in it is read from the learner's projection: the action and its
 * reason, the events it cites, the projection algorithm, what has been measured
 * about the concept, and the patterns their answers triggered. A model that is
 * told why cannot be talked into teaching the wrong thing by a client that
 * sends a different story — and a test can read this string back off the wire
 * and compare it with what the surfaces display.
 */
export function tutorGroundingPacket(g: TutorGrounding, message: string, language: string): string {
  const c = getConcept(g.focus.conceptId);
  const rows = g.measured.length
    ? g.measured
        .map((m) => `- ${m.label}: ${m.correct}/${m.asked} correct`)

        .join("\n")
    : "- (nothing measured on this concept yet)";
  const beliefs = g.misconceptions.length
    ? g.misconceptions
        .map((m) => `- ${m.name} (hit ${m.hits}×): ${m.coaching}`)
        .join("\n")
    : "";
  const conceptBeliefs = (c?.misconceptions ?? [])
    .map((id) => id)
    .filter((id) => !g.misconceptions.some((m) => m.id === id));

  return [
    conceptLine(g, language),
    c?.lesson ? `LESSON: ${c.lesson}` : "",
    decisionLine(g),
    g.decision?.evidenceIds.length
      ? `CITED RECORDED ANSWERS: ${g.decision.evidenceIds.join(", ")}`
      : "CITED RECORDED ANSWERS: none — this step does not hinge on one answer",
    g.decision ? `DECISION BASIS: ${g.decision.basis} · projection v${g.decision.projectionVersion}` : "",
    `WHAT THE RECORD SAYS ABOUT THIS CONCEPT:\n${rows}`,
    g.unmeasured.length ? `NOT YET MEASURED: ${g.unmeasured.join(", ")}` : "",
    beliefs ? `PATTERNS THIS LEARNER'S OWN WORK TRIGGERED:\n${beliefs}` : "",
    conceptBeliefs.length
      ? `OTHER PATTERNS THIS CONCEPT PRODUCES: ${conceptBeliefs.join(", ")}`
      : "",
    `STUDENT MESSAGE: ${message}`,
    `Reply in this language if possible: ${language}`,
    "Ask ONE guiding question. Do NOT give the final answer.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function conceptLine(g: TutorGrounding, language: string): string {
  const c = getConcept(g.focus.conceptId);
  const title = ctitle(language, g.focus.conceptId);
  return `CONCEPT THE STUDENT ASKED ABOUT: ${title} (${c?.subject ?? "general"})`;
}

/**
 * A grounding for a turn with no learner behind it (no profile, or a signed-out
 * visitor): the concept's authored content, and no claims about anyone.
 *
 * It is deliberately NOT an empty object with null fields scattered through it.
 * `decision: null` and an empty `measured` list say "nothing is known about a
 * person", which is true; a fabricated row would let the tutor speak as if it
 * had evidence it never saw.
 */
export function conceptGrounding(conceptId: string, language: string): TutorGrounding {
  const c = getConcept(conceptId);
  return {
    learnerId: null,
    focus: { conceptId, title: c?.title ?? conceptId, subject: c?.subject ?? null },
    decision: null,
    measured: [],
    unmeasured: [],
    misconceptions: [],
    projectionVersion: null,
    evidenceEvents: 0,
    unprojectable: null,
    language,
  };
}
