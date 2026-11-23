import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { accountFromRequest } from "@/lib/server/auth";
import { isTeachingRole } from "@/lib/server/authority";
import { getConcept } from "@/lib/genome";
import { authoredLessonFor } from "@/lib/lessons/authored";
import { answerKeyFor } from "@/lib/lesson-print";
import { AnswerKeySheet } from "@/components/print-sheet";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

/** The teacher's marking copy. The key is never rendered on the pupil route, so
 *  a browser that has the worksheet has not been sent the answers. */
export default async function PrintableAnswerKeyPage({
  params,
}: {
  params: Promise<{ subject: string; concept: string }>;
}) {
  const { subject, concept } = await params;
  const lesson = authoredLessonFor(concept);
  const meta = getConcept(concept);
  if (!lesson || lesson.subject !== subject) notFound();

  // A page can read the session too: the same account door the teacher API
  // uses, reconstructed from the request headers Next already has.
  const incoming = await headers();
  const plain: Record<string, string> = {};
  incoming.forEach((value, name) => { plain[name] = value; });
  const req = new Request("http://openmind.local/print", { headers: plain });
  const account = await accountFromRequest(req);

  if (!account || !isTeachingRole(account.role)) {
    return (
      <main className="page-shell" style={{ maxWidth: 620, padding: "48px 20px" }}>
        <p className="eyebrow">Teacher answer key</p>
        <h1>Sign in as a teacher to open the marking copy</h1>
        <p>The pupil worksheet is available without an account. The answer key is separate so it can be printed for marking without being handed out.</p>
        <Link className="btn primary" href="/teacher">Go to the teacher console</Link>
      </main>
    );
  }

  const key = answerKeyFor(lesson, meta?.title ?? concept);
  return (
    <main className="print-page page-shell">
      <div className="print-toolbar print-hide">
        <Link className="btn ghost" href={`/print/${subject}/${concept}`}>Pupil worksheet</Link>
        <Link className="btn ghost" href={`/print/${subject}/${concept}/guide`}>Teacher guide</Link>
        <PrintButton label="Print / save key as PDF" />
      </div>
      <AnswerKeySheet answerKey={key} />
    </main>
  );
}
