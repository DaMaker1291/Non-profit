import { NextResponse } from "next/server";
import { bySubject, getConcept, ancestorsOf, descendantsOf } from "@/lib/genome";
import { hasGenerator } from "@/lib/questions";
import { MISCONCEPTIONS } from "@/lib/misconceptions";
import type { SubjectId } from "@/lib/types";

/** Public read-only view of the Knowledge Genome — the data other builders can integrate against. */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const conceptId = searchParams.get("concept");

  if (conceptId) {
    const c = getConcept(conceptId);
    if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({
      concept: c,
      prereqChain: ancestorsOf(conceptId),
      unlocks: descendantsOf(conceptId),
      hasGenerator: hasGenerator(conceptId),
      misconceptions: (c.misconceptions ?? [])
        .map((m) => MISCONCEPTIONS.find((x) => x.id === m))
        .filter(Boolean),
    });
  }

  const subject = searchParams.get("subject") as SubjectId | null;
  const list = subject ? bySubject(subject) : undefined;
  const concepts = (list ?? []).map((c) => ({
    id: c.id, subject: c.subject, stage: c.stage, title: c.title, blurb: c.blurb,
    prereqs: c.prereqs, hasGenerator: hasGenerator(c.id),
  }));
  return NextResponse.json({ count: concepts.length, concepts });
}
