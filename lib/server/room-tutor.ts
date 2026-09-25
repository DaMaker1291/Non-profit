// ─────────────────────────────────────────────────────────────────────────────
// THE ROOM'S TUTOR.
//
// A study room is a tiny class: one focus, a few members, and a Socratic tutor
// in the corner. Two defects lived in that corner, both reproduced live:
//
//   1. A room with no declared concept was taught `linear-equations`, always.
//      The line was `room.conceptIds[0] ?? "linear-equations"` — a MATHS concept
//      as the universal default — so a GCSE Physics room answered "why does the
//      ball accelerate?" with a lecture about balance scales. The room's own
//      subject was ignored exactly when it mattered most.
//
//   2. The room never consulted a model at all. It called the offline engine
//      directly and stored the text under one label, so a deployment WITH a key
//      still gave every room the same canned reply, and nothing on screen said
//      who had answered.
//
// What replaces them:
//
//   · Focus is RESOLVED, never defaulted. The room's declared concept wins; a
//     concept the message names from the room's OWN subject comes next; and if
//     neither exists the tutor says it does not know which idea they are on and
//     asks — instead of guessing a concept from another subject.
//   · The turn goes through the one tutor door (lib/server/tutor.ts), so a
//     configured model answers in rooms too, and the disclosure key travels
//     with the reply to the surface. The offline engine remains a supported
//     outcome, not a degraded one.
//
// GROUNDING IS CONCEPT-ONLY, deliberately. A room is shared: everyone reads
// every reply, so a turn must not carry one member's private record into it.
// The private tutor screen (/tutor/[concept]) is where a turn is grounded in a
// learner's own projection, decision, citations and projection version.
//
// And the standing rule still holds here: a tutor may explain, hint, adapt and
// ask. It may never write. Nothing in this file imports a ledger writer or a
// mastery setter — the only route into the record is append → confirm →
// replay/adopt, and a room message is not on it.
// ─────────────────────────────────────────────────────────────────────────────

import { bySubject, getConcept } from "../genome";
import { ctitle } from "../content-i18n";
import { translator } from "../i18n";
import { conceptGrounding, type TutorGrounding } from "../tutor-context";
import { tutorTurn, type TutorAnswerSource } from "./tutor";
import type { StudyRoom } from "../types";

/** The vocabulary a room may be about: the focus the room was opened on, or a
 *  concept the learner's own message names. */
type RoomFocus = { conceptId: string; because: "declared" | "named" };

/** Words that carry no subject meaning, so a message containing only these can
 *  never be read as naming a concept. */
const GENERIC = new Set([
  "what", "why", "how", "when", "does", "this", "that", "with", "from", "into",
  "stuck", "help", "please", "question", "answer", "problem", "work", "workout",
  "understand", "explain", "again", "still", "dont", "doesnt", "cant", "about",
]);

/** Normalise a message into comparison tokens: lower-case words of four or more
 *  characters, punctuation stripped. Short words are excluded because they match
 *  everything ("law", "set", "gas" are fine at three, but "the", "and" are not —
 *  the length floor is the crude part, the GENERIC set is the careful part). */
function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length >= 3 && !GENERIC.has(w));
}

/**
 * Which idea is this room actually about?
 *
 * Returns null when nothing can be resolved — which is a real answer, not a
 * failure: the caller asks the learner which topic they mean. What must never
 * happen is a default from another subject, which is what shipped.
 */
export function roomFocus(room: Pick<StudyRoom, "subject" | "conceptIds">, message: string): RoomFocus | null {
  const declared = (room.conceptIds ?? []).find((id) => getConcept(id));
  if (declared) return { conceptId: declared, because: "declared" };

  const said = new Set(tokens(message));
  if (said.size === 0) return null;

  let best: { conceptId: string; score: number } | null = null;
  for (const c of bySubject(room.subject)) {
    // Match on the concept's title words and its id words: a learner types
    // "momentum" or "momentum conservation", never "forces-basics".
    const words = new Set([...tokens(c.title), ...tokens(c.id)]);
    let score = 0;
    for (const w of words) if (said.has(w)) score += w.length;
    if (score === 0) continue;
    // Deterministic tie-break: the longest match wins, then the earlier concept
    // in the subject's own order, so the same message always resolves the same.
    if (!best || score > best.score || (score === best.score && c.id < best.conceptId)) {
      best = { conceptId: c.id, score };
    }
  }
  return best ? { conceptId: best.conceptId, because: "named" } : null;
}

export interface RoomTurn {
  reply: string;
  answerSource: TutorAnswerSource;
  /** The disclosure key the room renders. A reply from the offline engine can
   *  never receive the AI key — the same rule the tutor screen keeps. */
  labelKey: string;
  aiUnavailable: string | null;
  /** The concept the turn was grounded in, or null when the room had none. */
  focus: string | null;
  /** How the focus was found — so a test (and a debugging human) can tell a
   *  declared focus from one the learner's own words named. */
  focusBecause: "declared" | "named" | null;
}

/**
 * The reply when a room has no resolvable focus.
 *
 * This is the honest half of the fix: it says what it does not know, names the
 * room's subject, offers the vocabulary the room could be about (real concept
 * titles, translated) and asks. It is a question, so the Socratic promise still
 * holds; and it teaches nothing about another subject, because it has no concept
 * to teach.
 */
export function noFocusReply(subject: StudyRoom["subject"], language: string): string {
  const t = translator(language);
  const key = "rooms.focusAsk";
  const line = t(key) === key ? "Which idea are you working on?" : t(key);
  const subjectName = (() => {
    const k = `subj.${subject}`;
    return t(k) === k ? subject : t(k);
  })();
  const examples = bySubject(subject)
    .slice(0, 3)
    .map((c) => ctitle(language, c.id))
    .join(" · ");
  return examples ? `${line} ${subjectName}: ${examples}.` : `${line} ${subjectName}.`;
}

export interface RoomTurnInput {
  room: Pick<StudyRoom, "subject" | "conceptIds" | "language">;
  message: string;
  now?: number;
}

/**
 * One turn in a room: resolve the focus, then run the ordinary tutor turn.
 *
 * `tutorTurn` never throws for an AI reason and never returns an empty reply —
 * no key, provider error, timeout and malformed response all end in the offline
 * engine answering, with the reason kept so the room can be honest about it.
 */
export async function roomTutorTurn(input: RoomTurnInput): Promise<RoomTurn> {
  const language = input.room.language || "en";
  const focus = roomFocus(input.room, input.message);

  if (!focus) {
    return {
      reply: noFocusReply(input.room.subject, language),
      answerSource: "offline",
      labelKey: "tutor.offlineNote",
      aiUnavailable: "no_focus",
      focus: null,
      focusBecause: null,
    };
  }

  const turn = await tutorTurn({
    // Concept-only grounding: a room is shared (see the header).
    learnerId: null,
    conceptId: focus.conceptId,
    message: input.message,
    language,
    now: input.now,
  });
  if (!turn) {
    // The genome lost the concept between resolution and the turn: say so
    // rather than replying about something else.
    return {
      reply: noFocusReply(input.room.subject, language),
      answerSource: "offline",
      labelKey: "tutor.offlineNote",
      aiUnavailable: "no_focus",
      focus: null,
      focusBecause: null,
    };
  }
  return {
    reply: turn.reply,
    answerSource: turn.answerSource,
    labelKey: turn.labelKey,
    aiUnavailable: turn.aiUnavailable,
    focus: focus.conceptId,
    focusBecause: focus.because,
  };
}

/** The grounding a room turn is built from, exposed so a test can assert the
 *  room never carries a learner's private record into a shared space. */
export function roomGrounding(focusConceptId: string, language: string): TutorGrounding {
  return conceptGrounding(focusConceptId, language);
}
