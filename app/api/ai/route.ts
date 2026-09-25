import { NextResponse } from "next/server";
import { aiStatus, llmExplain, llmMarkWork } from "@/lib/llm";
import { cacheGet, cacheSet } from "@/lib/server/store";
import { generateQuestion, serveView } from "@/lib/questions";
import { termsFor } from "@/lib/specifications";
import { authorisedProfile } from "@/lib/server/auth";
import { tutorGroundingFor } from "@/lib/server/tutor";
import type { BoardId, Question } from "@/lib/types";

/** GET /api/ai — is a model wired up on this deployment, and which one? The UI
 *  shows this verbatim: a learner is told when they are being taught by a model
 *  and when they are being taught by the offline engine. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(aiStatus());
}

interface AiBody {
  task?: "explain" | "mark";
  conceptId?: string;
  question?: string;
  language?: string;
  length?: "short" | "full";
  prompt?: string;
  correctAnswer?: string;
  studentWork?: string;
  id?: string;
  secret?: string;
  /** Keep the same answer key as the question the student was looking at. */
  seed?: string;
}


export async function POST(req: Request): Promise<NextResponse> {
  let body: AiBody = {};
  try {
    body = (await req.json()) as AiBody;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const conceptId = body.conceptId ?? "";
  const language = body.language ?? "en";
  if (!conceptId) return NextResponse.json({ error: "missing conceptId" }, { status: 400 });

  const profile = await authorisedProfile(req, body.id ?? null, body.secret ?? null);
  const board = profile?.profile.board as BoardId | undefined;
  // The same grounding the tutor gets, read from this learner's projection:
  // an explanation written for the step they are actually on, not for the
  // concept in the abstract. Null for a signed-out visitor, and the prompt says
  // nothing about a person rather than inventing one.
  const grounding = profile ? await tutorGroundingFor(profile.profile.id, conceptId, language) : null;

  if (body.task === "mark") {
    const outcome = await llmMarkWork({
      conceptId,
      prompt: (body.prompt ?? "").slice(0, 600),
      correctAnswer: (body.correctAnswer ?? "").slice(0, 200),
      studentWork: (body.studentWork ?? "").slice(0, 800),
      language,
    });
    return NextResponse.json({
      feedback: outcome.ok ? outcome.text : null,
      mode: outcome.ok ? "ai" : "unavailable",
      aiUnavailable: outcome.ok ? null : outcome.reason,
    });
  }

  // task === "explain" (default)
  const cacheKey = `explain:${conceptId}:${language}:${board ?? ""}:${body.length ?? "full"}:${(body.question ?? "").slice(0, 80)}`;
  const cached = (await cacheGet(cacheKey)) as string | null;
  if (cached) return NextResponse.json({ explanation: cached, mode: "ai", cached: true, aiUnavailable: null });

  const outcome = await llmExplain({
    conceptId,
    language,
    question: body.question,
    terms: termsFor(board),
    length: body.length,
    grounding: grounding ?? undefined,
  });
  if (outcome.ok) await cacheSet(cacheKey, outcome.text);

  // No model: hand back a real worked example from the engine instead of an
  // apology, so the learner still gets something to read — and name the reason
  // so the surface can say which of the four happened instead of guessing.
  if (!outcome.ok) {
    const seed = body.seed ?? `x${Date.now().toString(36)}`;
    const q: Question | null = generateQuestion(conceptId, seed);
    const fallback = q ? serveView(q, language, board) : null;
    return NextResponse.json({
      explanation: null, fallback,
      mode: "engine",
      aiUnavailable: outcome.reason,
    });
  }
  return NextResponse.json({ explanation: outcome.text, mode: "ai", aiUnavailable: null });
}
