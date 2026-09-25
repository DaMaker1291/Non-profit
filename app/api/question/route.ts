import { NextResponse } from "next/server";
import { generateQuestion, serveView } from "@/lib/questions";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const conceptId = searchParams.get("conceptId") ?? "";
  const seed = searchParams.get("seed") ?? String(Math.floor(Math.random() * 1e9));
  const lang = searchParams.get("lang") ?? "en";
  const q = generateQuestion(conceptId, seed);
  if (!q) return NextResponse.json({ error: "no generator for concept" }, { status: 404 });
  // Answers never leave the server before grading (see serveView).
  return NextResponse.json({ question: serveView(q, lang) });
}
