import { NextResponse } from "next/server";
import { matchQuestion, matchTop } from "@/lib/matcher";

/** POST /api/match — free question text in, best genome concept out (or an
 *  honest "not sure" when no signal clears the floor). Deterministic, offline
 *  — same result on a flaky connection as a good one. */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { text?: string };
    const text = typeof body.text === "string" ? body.text.slice(0, 500) : "";
    if (!text.trim()) return NextResponse.json({ error: "no text" }, { status: 400 });
    const best = matchQuestion(text);
    if (!best) return NextResponse.json({ match: null, alternatives: [] });
    return NextResponse.json({
      match: best,
      alternatives: matchTop(text, 3).filter((m) => m.conceptId !== best.conceptId),
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
