// ─────────────────────────────────────────────────────────────────────────────
// THE TUTOR TURN, ASSEMBLED FROM THE LEARNER'S OWN PROJECTION.
//
// This module is where the mission's hardest rule about AI is kept:
//
//     AI may explain, hint, adapt and generate practice.
//     AI may never write mastery or evidence.
//
// It holds because of what is NOT here. Nothing in this file — or in the two
// modules it composes, lib/llm.ts and lib/server/tutor.ts's own call graph —
// imports `answerEvidence`, `appendEvidence`, `commitAndProject`, `updateProfile`
// or `saveProfile`. The only way into the ledger is append → confirm →
// replay/adopt (`lib/server/projection.ts`), reached from the grading routes
// after the SERVER has marked something against the deterministic engine's own
// key. A model's text is returned to the caller and to nobody else. The engines
// suite asserts both halves: a source tripwire over the AI module set, and a
// runtime check that a full tutor exchange leaves the ledger file and every
// mastery field byte-for-byte unchanged.
//
// And the grounding: every claim the tutor makes about why this learner is
// seeing this question is READ here, from the projection, through the same door
// every surface uses. A request body may name the concept a learner opened; it
// cannot name the decision, the reason, the citations or the projection version.
// ─────────────────────────────────────────────────────────────────────────────

import { conceptKnowledge } from "../evidence-view";
import { projectLearner } from "../evidence";
import { decide, type DecisionAction } from "../decision";
import { decisionContextFor } from "./decision";
import { MISCONCEPTIONS_BY_ID } from "../misconceptions";
import { translator } from "../i18n";
import { ctitle, mcName } from "../content-i18n";
import { getConcept } from "../genome";
import { aiStatus, llmTutorReply, type AiUnavailableReason, type AiStatus } from "../llm";
import { socraticReply } from "../socratic";
import {
  conceptGrounding, TUTOR_LABEL, type TutorDecision, type TutorDimension, type TutorGrounding,
} from "../tutor-context";

/** The reply text a learner sees, and where it came from. */
export type TutorAnswerSource = "ai" | "offline";

export interface TutorTurnInput {
  /** The learner, when one is authenticated. Null is a real case: a signed-out
   *  visitor on /try, who gets the concept and nothing about any person. */
  learnerId?: string | null;
  /** The concept the learner asked about. Advisory: it is used as the FOCUS,
   *  never as the decision, and an id the genome does not know is refused by
   *  the caller before we get here. */
  conceptId: string;
  message: string;
  language: string;
  /** Fixed clock, so a turn is reproducible in tests. */
  now?: number;
}

export interface TutorTurnResult {
  /** Kept for the existing client and for `/api/tutor` compatibility. */
  mode: "ai" | "socratic";
  answerSource: TutorAnswerSource;
  /** The i18n key the UI renders to disclose who answered. A reply from the
   *  offline engine can never receive the AI key — see `answerSource` above. */
  labelKey: string;
  /** Null when a model answered. Otherwise the reason, so a deployment can be
   *  told (and asserted) exactly which failure produced the fallback. */
  aiUnavailable: AiUnavailableReason | null;
  ai: AiStatus;
  reply: string;
  grounding: TutorGrounding;
}

/**
 * The learner's grounding: the canonical decision, taken from the projection.
 *
 * Returns null when there is no such learner, so the caller keeps its 404 (or
 * falls back to a concept-only turn, which is a different sentence and must not
 * be produced by accident).
 */
export async function tutorGroundingFor(
  learnerId: string,
  focusConceptId: string,
  language: string,
  now?: number,
): Promise<TutorGrounding | null> {
  const ctx = await decisionContextFor(learnerId);
  if (!ctx) return null;
  const tt = translator(language);
  const title = (id: string) => ctitle(language, id);

  // The same door, the same options, the same order the surfaces use — /api/next
  // asks for `max: 6` and renders the top of it, Home presents the first and
  // queues the rest. The tutor is handed exactly that list.
  const actions = decide(ctx, { max: 6, tt, title, now });
  const top = actions[0];
  // The FOCUS is the concept the learner opened — what they are asking about —
  // and the DECISION rides alongside it. They are usually the same concept and
  // are not the same fact: a learner who opens the tutor on quadratics while the
  // app's next step is fractions must be answered about quadratics with the
  // decision still visible, not silently tutored on fractions they did not ask
  // about. The requested id falls back to the decision's only when the caller
  // named none.

  const focus = focusConceptId || top?.conceptId || "";
  if (!getConcept(focus)) return null;
  const projection = projectLearner(ctx.events);
  const { rows, unmeasuredLabels } = conceptKnowledge(projection, focus, tt);
  // Only rows with actual observations: a dimension nobody has measured is a
  // gap and belongs in `unmeasured`, not in a list of rates. `rate` is the
  // projection's own `{asked, correct}` pair, so the model is told counts —
  // "3 of 5", which it can reason about — rather than a bare percentage.
  const measured: TutorDimension[] = rows
    .filter((r) => r.rate !== null && r.rate.asked > 0)
    .map((r) => ({ key: r.key, label: r.label, asked: r.rate!.asked, correct: r.rate!.correct }));

  // The patterns THIS learner's answers on THIS concept triggered — not the
  // subject's total, and not the concept's catalogue list.
  //
  // Per concept on purpose: `misconceptionHits(state, subject)` sums across a
  // whole subject, so a learner whose algebra answers exposed a sign error would
  // be introduced to that pattern while asking about fractions — a claim about
  // them that their work on fractions did not make. The model keeps this count
  // per concept; that is the one that belongs here.
  const hits = ctx.model.progress[focus]?.misconceptions ?? {};
  const misconceptions = Object.entries(hits)
    .map(([id, n]) => ({ id, hits: n, def: MISCONCEPTIONS_BY_ID[id] }))
    .filter((m) => m.def && m.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((m) => ({ id: m.id, hits: m.hits, name: mcName(language, m.id, m.def.name), coaching: m.def.coaching }));

  return {
    learnerId,
    focus: { conceptId: focus, title: title(focus), subject: getConcept(focus)?.subject ?? null },
    decision: top ? decisionOf(top, actions, language) : null,
    measured,
    unmeasured: unmeasuredLabels,
    misconceptions,
    projectionVersion: ctx.projectionVersion,
    evidenceEvents: ctx.events.length,
    unprojectable: ctx.unprojectable,
    language,
  };
}

function decisionOf(top: DecisionAction, all: readonly DecisionAction[], language: string): TutorDecision {
  // Some steps name no concept: a sitting ("take the 3-minute diagnostic"), a
  // rest day, a project. `ctitle(lang, "")` is the empty string, which put
  // "NEXT STEP…: EXPLAIN — ." in front of the model and a blank title in the
  // payload. The action's own title is the honest fallback — it is what the
  // card renders for exactly these steps.
  return {
    kind: top.kind,
    conceptId: top.conceptId ?? null,
    title: top.conceptId ? ctitle(language, top.conceptId) : top.title,
    reason: top.reason,
    basis: top.basis,
    evidenceIds: [...top.evidenceIds],
    projectionVersion: top.projectionVersion,
    plan: all.map((a) => ({
      kind: a.kind,
      conceptId: a.conceptId ?? null,
      title: a.conceptId ? ctitle(language, a.conceptId) : a.title,
    })),
  };
}

/**
 * One tutor turn: ground it, ask the model, and if the model does not answer,
 * answer from the offline engine and SAY SO.
 *
 * `tutorTurn` never throws for an AI reason and never returns an empty reply.
 * The four unavailability reasons — no key, provider error, timeout, malformed
 * response — are four ways of arriving at the same supported outcome: the
 * Socratic engine replies, in the learner's language, and the payload carries
 * the bit the UI needs to label it honestly.
 */
export async function tutorTurn(input: TutorTurnInput): Promise<TutorTurnResult | null> {
  const language = input.language || "en";
  const focus = input.conceptId;
  if (!getConcept(focus)) return null;

  const grounding = input.learnerId
    ? await tutorGroundingFor(input.learnerId, focus, language, input.now)
    : conceptGrounding(focus, language);
  if (!grounding) return null;

  const status = aiStatus();
  const outcome = await llmTutorReply(grounding, input.message, language);

  if (outcome.ok) {
    return {
      mode: "ai",
      answerSource: "ai",
      labelKey: TUTOR_LABEL.ai,
      aiUnavailable: null,
      ai: status,
      reply: outcome.text,
      grounding,
    };
  }

  // The offline engine's reply is the whole answer here — not an apology, and
  // not an error page. `tutor.offlineNote` when this deployment has no model at
  // all; `tutor.fallbackNote` when it has one that did not answer. The learner
  // is never told a model spoke when it did not.
  return {
    mode: "socratic",
    answerSource: "offline",
    labelKey: outcome.reason === "no_key" ? TUTOR_LABEL.offline : TUTOR_LABEL.fallback,
    aiUnavailable: outcome.reason,
    ai: status,
    reply: socraticReply(focus, input.message, language),
    grounding,
  };
}
