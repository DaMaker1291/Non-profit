import Link from "next/link";
import { notFound } from "next/navigation";
import { getConcept } from "@/lib/genome";
import { authoredLessonFor } from "@/lib/lessons/authored";
import { worksheetFor } from "@/lib/lesson-print";
import { WorksheetSheet } from "@/components/print-sheet";
import { PrintButton } from "@/components/print-button";

/** The pupil handout. It is deliberately answer-free: the key is a different
 *  route, behind a teacher account, generated from the same authored lesson. */
export default async function PrintableLessonPage({
  params,
}: {
  params: Promise<{ subject: string; concept: string }>;
}) {
  const { subject, concept } = await params;
  const lesson = authoredLessonFor(concept);
  const meta = getConcept(concept);
  if (!lesson || lesson.subject !== subject) notFound();

  const sheet = worksheetFor(lesson, meta?.title ?? concept);
  return (
    <main className="print-page page-shell">
      <div className="print-toolbar print-hide">
        <Link className="btn ghost" href={`/learn/${subject}/${concept}`}>Back to lesson</Link>
        <PrintButton />
        <Link className="btn secondary" href={`/print/${subject}/${concept}/guide`}>Teacher guide</Link>
        <Link className="btn secondary" href={`/print/${subject}/${concept}/key`}>Teacher answer key</Link>
        <Link className="btn ghost" href={`/teach/${subject}/${concept}`}>Teacher-led mode</Link>
      </div>
      <WorksheetSheet sheet={sheet} keyHref={`/print/${subject}/${concept}/key`} />
    </main>
  );
}
