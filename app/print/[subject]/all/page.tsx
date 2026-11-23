import Link from "next/link";
import { notFound } from "next/navigation";
import { AUTHORED_LESSONS } from "@/lib/lessons/authored";
import { getConcept } from "@/lib/genome";
import { SUBJECT_IDS } from "@/lib/subjects";
import { worksheetFor } from "@/lib/lesson-print";
import { WorksheetSheet } from "@/components/print-sheet";
import { PrintButton } from "@/components/print-button";

const NAMES: Record<string, string> = { maths: "Mathematics", physics: "Physics", chemistry: "Chemistry", biology: "Biology", computing: "Computing" };

/** One subject's worksheets in one document. A teacher with a photocopier and
 *  one connection can save this once as a PDF; the class then needs no network
 *  at all. Keys are not included. */
export default async function PrintAllPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  if (!(SUBJECT_IDS as string[]).includes(subject)) notFound();
  const lessons = AUTHORED_LESSONS
    .filter((l) => l.subject === subject)
    .sort((a, b) => (getConcept(a.conceptId)?.title ?? a.conceptId).localeCompare(getConcept(b.conceptId)?.title ?? b.conceptId));
  if (lessons.length === 0) notFound();

  return (
    <main className="print-page page-shell">
      <div className="print-toolbar print-hide">
        <Link className="btn ghost" href={`/print/${subject}`}>Back to {NAMES[subject] ?? subject}</Link>
        <PrintButton label="Print / save all worksheets" />
      </div>
      <p className="print-hide small muted" style={{ marginBottom: 16 }}>
        {lessons.length} worksheets follow. Printing this page creates a class set of pupil sheets with no answers.
        Teacher keys are on each lesson&apos;s separate key route.
      </p>
      {lessons.map((lesson, i) => {
        const title = getConcept(lesson.conceptId)?.title ?? lesson.conceptId;
        return (
          <div key={lesson.conceptId} className={i > 0 ? "print-page-break" : undefined}>
            <WorksheetSheet sheet={worksheetFor(lesson, title)} keyHref={`/print/${subject}/${lesson.conceptId}/key`} />
          </div>
        );
      })}
    </main>
  );
}
