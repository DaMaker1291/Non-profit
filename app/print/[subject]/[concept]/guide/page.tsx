import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { accountFromRequest } from "@/lib/server/auth";
import { isTeachingRole } from "@/lib/server/authority";
import { getConcept } from "@/lib/genome";
import { authoredLessonFor } from "@/lib/lessons/authored";
import { teacherGuideFor } from "@/lib/teacher-guide";
import { TeacherGuideSheet } from "@/components/teacher-guide-sheet";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

/** The teacher's run sheet. It is teacher-only because it names expected answers
 *  to the prior and guided questions; assessment answers remain in the separate
 *  key, so this page is not a second marking copy. */
export default async function PrintableTeacherGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string; concept: string }>;
  searchParams: Promise<{ context?: string }>;
}) {
  const { subject, concept } = await params;
  const { context } = await searchParams;
  const lesson = authoredLessonFor(concept);
  const meta = getConcept(concept);
  if (!lesson || lesson.subject !== subject) notFound();

  const incoming = await headers();
  const plain: Record<string, string> = {};
  incoming.forEach((value, name) => { plain[name] = value; });
  const req = new Request("http://openmind.local/print", { headers: plain });
  const account = await accountFromRequest(req);

  if (!account || !isTeachingRole(account.role)) {
    return (
      <main className="page-shell" style={{ maxWidth: 620, padding: "48px 20px" }}>
        <p className="eyebrow">Teacher guide</p>
        <h1>Sign in as a teacher to open the lesson plan</h1>
        <p>The pupil worksheet is available without an account. The teacher guide and the answer key are separate so neither is handed out with the worksheet.</p>
        <Link className="btn primary" href="/teacher">Go to the teacher console</Link>
      </main>
    );
  }

  const guide = teacherGuideFor(lesson, meta?.title ?? concept, context);
  return (
    <main className="print-page page-shell">
      <div className="print-toolbar print-hide">
        <Link className="btn ghost" href={`/print/${subject}/${concept}`}>Pupil worksheet</Link>
        <Link className="btn ghost" href={`/print/${subject}/${concept}/key`}>Answer key</Link>
        <Link className="btn ghost" href={`/teach/${subject}/${concept}?context=${guide.context.id}`}>Teacher-led mode</Link>
        <PrintButton label="Print / save guide as PDF" />
      </div>
      <TeacherGuideSheet guide={guide} />
    </main>
  );
}
