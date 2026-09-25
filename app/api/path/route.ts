import { NextResponse } from "next/server";
import { authorizeLearner } from "@/lib/server/capability";
import { buildPath } from "@/lib/diagnostic";
import { masteryMap, misconceptionHits } from "@/lib/progress";
import type { SubjectId } from "@/lib/types";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const subject = (searchParams.get("subject") ?? "maths") as SubjectId;
  // A path IS a mastery map with a narrative: which concepts a named learner is
  // weak at, in order. It answers to the same capability rule as the answers it
  // was computed from.
  const auth = await authorizeLearner(id, searchParams.get("secret"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const state = auth.state;
  const path = buildPath(subject, masteryMap(state, subject), misconceptionHits(state, subject));
  return NextResponse.json({ path });
}
