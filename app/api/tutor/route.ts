import { NextResponse } from "next/server";
import { authorizeLearner } from "@/lib/server/capability";
import { tutorTurn } from "@/lib/server/tutor";

/**
 * POST /api/tutor — one turn with the tutor.
 *
 * The body carries the learner's sentence, the interface language, and (when
 * they have a profile) the capability secret. It deliberately cannot carry the
 * decision: the concept they opened is a FOCUS, while the plan, the reason, the
 * citations and the projection version are read from the learner's own
 * projection server-side (lib/server/tutor.ts). A client that sent its own
 * "reason" would be telling the model a story the app is not telling itself.
 *
 * Authorization is OPTIONAL and honest about it: a signed-out visitor gets a
 * concept-grounded turn, and someone who presents an id must present its secret
 * — otherwise anybody holding an id could read this learner's plan back out of
 * the tutor's grounding. A wrong secret is refused the way the other read doors
 * refuse it, rather than quietly downgrading to a concept-only turn.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let body: { conceptId?: string; message?: string; language?: string; id?: string; secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const conceptId = body.conceptId ?? "";
  const message = (body.message ?? "").slice(0, 500);
  const language = body.language ?? "en";
  if (!conceptId) return NextResponse.json({ error: "missing conceptId" }, { status: 400 });

  let learnerId: string | null = null;
  if (body.id) {
    const auth = await authorizeLearner(body.id, body.secret);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    learnerId = auth.state.profile.id;
  }

  const turn = await tutorTurn({ learnerId, conceptId, message, language });
  if (!turn) return NextResponse.json({ error: "unknown concept" }, { status: 404 });

  return NextResponse.json({
    reply: turn.reply,
    mode: turn.mode,
    // WHO answered, in machine-readable and learner-readable form. The UI
    // renders `labelKey`; a fallback reply can never be given the AI key.
    answerSource: turn.answerSource,
    labelKey: turn.labelKey,
    aiUnavailable: turn.aiUnavailable,
    ai: turn.ai,
    // WHY this learner is seeing this question: the same decision the surfaces
    // render, so the tutor screen can show it and a test can compare it with
    // what /api/next reports for the same learner.
    grounding: turn.grounding,
  });
}
