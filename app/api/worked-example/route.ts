import { NextResponse } from "next/server";
import { CONCEPTS } from "@/lib/genome";
import { generateQuestionNear, serveView } from "@/lib/questions";
import type { WorkedExampleView } from "@/lib/types";

// ── ONE ITEM, WORKED IN FULL, FOR TEACHING ──────────────────────────────────
//
// A lesson needs a worked example: "I do" before "you do". The bank can produce
// one for every concept, and the lesson already has the concept's own
// explanation for it — what it did not have was a way to SHOW a solved item
// without asking the learner to answer it first.
//
// WHY THIS IS A SEPARATE DOOR AND NOT A FLAG ON THE SERVE. `/api/progress`'s
// serve withholds the key deliberately: an answer that reaches the browser
// before the learner has committed is not a question any more. Adding a
// `reveal: true` flag to that route would put the key on the same endpoint that
// serves graded questions, one mistaken call away from a session where every
// answer is known. This route holds no learner state at all — no profile, no
// secret, nothing written — so it can hand over the answer and the explanation
// as a teaching artefact.
//
// AND IT CANNOT BE USED TO ANSWER THE QUESTION ON SCREEN. The seed is chosen
// HERE and is never returned to the client, and every served question already
// gets its own seed from the serve. What a learner can get from this door is a
// random item of the same concept with its method spelled out — which is the
// teaching, not the marking. (The alternative, a client that reveals an
// arbitrary seed, would have been an oracle: the serve's seed is guessable
// enough from a question's id to matter, so this route takes no seed at all.)
//
// THE TARGET DEPTH IS BELOW THE PRACTICE. A worked example the learner could not
// attempt yet teaches copying, and one harder than the session that follows
// reads as "this is what you will fail at". 0.35 sits under the first serve, and
// `generateQuestionNear` clamps to what the concept can actually produce — a
// stage-0 concept with a 0.30 ceiling gets its 0.30 item, which is right.

const WORKED_TARGET = 0.35;
/** The hardest a worked example will aim at. Above this the page is showing a
 *  learner a stretch item they have not been prepared for — which is the
 *  practice's job, not the lesson's. */
const WORKED_CEILING = 0.85;

/** The depth this example should aim at: the caller's request, clamped.
 *
 *  A client-visible depth is fine (it is not an answer), and it is what makes
 *  the second and third examples possible: "another one, harder" is how a
 *  worked example fades from copying to attempting, which is the whole reason
 *  to show more than one. Anything unparseable falls back to the default rather
 *  than failing — a lesson that breaks on a query string is worse than one that
 *  shows the standard example. */
function targetFrom(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return WORKED_TARGET;
  return Math.min(Math.max(n, 0.1), WORKED_CEILING);
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const conceptId = searchParams.get("conceptId") ?? "";
  const lang = searchParams.get("lang") ?? "en";
  if (!CONCEPTS.some((c) => c.id === conceptId)) {
    // Named, like every other refusal in this product: a client that asks for a
    // concept the genome does not hold must not be answered with a blank page.
    return NextResponse.json({ error: "unknown_concept" }, { status: 404 });
  }
  // 40 draws, the same order of effort the serve spends choosing an item: a
  // worked example that is a poor draw (a padded distractor set, a degenerate
  // parameter) is worse than none, because it is the one item a learner reads
  // closely.
  const q = generateQuestionNear(conceptId, crypto.randomUUID(), targetFrom(searchParams.get("target")), 40);
  if (!q) return NextResponse.json({ error: "no_generator_for_concept" }, { status: 404 });
  const view = serveView(q, lang);
  const body: WorkedExampleView = {
    conceptId,
    prompt: view.prompt,
    choices: view.choices,
    figure: view.figure,
    responseKind: q.responseKind ?? "choice",
    answerIndex: q.answer,
    explanation: q.explanation,
    misconceptionId: q.misconceptionTags[0] ?? null,
  };
  return NextResponse.json(body);
}
