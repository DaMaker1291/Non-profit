import { NextResponse } from "next/server";
import { AUTHORED_LESSONS, authoredLessonFor } from "@/lib/lessons/authored";
import { getConcept } from "@/lib/genome";

/**
 * GET /api/authored-lessons
 *
 * A compact index for the paper-marking form. It deliberately returns NO model
 * answers, marking criteria, accepted spellings or correct orders: those live
 * only in the teacher answer key route.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const concept = new URL(req.url).searchParams.get("concept");
  if (!concept) {
    return NextResponse.json({
      lessons: AUTHORED_LESSONS.map((l) => ({
        conceptId: l.conceptId,
        title: getConcept(l.conceptId)?.title ?? l.conceptId,
        subject: l.subject,
        version: l.version,
        review: l.declaredStatus,
      })).sort((a, b) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title)),
    });
  }

  const lesson = authoredLessonFor(concept);
  if (!lesson) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const marks = (item: { structured?: { parts: readonly { marks: number }[] } }) =>
    item.structured ? item.structured.parts.reduce((n, p) => n + p.marks, 0) : 4;
  return NextResponse.json({
    conceptId: lesson.conceptId,
    title: getConcept(concept)?.title ?? concept,
    subject: lesson.subject,
    version: lesson.version,
    review: lesson.declaredStatus,
    items: [
      ...lesson.assessment.map((a) => ({ id: a.id, prompt: a.prompt, kind: a.kind, max: marks(a), section: "assessment" })),
      ...lesson.transfer.map((t) => ({ id: t.id, prompt: t.prompt, kind: "transfer", max: 4, section: "transfer" })),
    ],
  });
}
