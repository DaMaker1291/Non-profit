import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { accountFromRequest } from "@/lib/server/auth";
import { isTeachingRole } from "@/lib/server/authority";
import { getConcept } from "@/lib/genome";
import { authoredLessonFor } from "@/lib/lessons/authored";
import { classroomSession } from "@/lib/classroom-session";
import { ClassroomPresenter } from "@/components/classroom-presenter";

export const dynamic = "force-dynamic";

/** Mode A/B: one screen for the class or one device per group. The teacher's
 *  answer view is behind the teaching account, because it contains answers. */
export default async function TeacherLedPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string; concept: string }>;
  searchParams: Promise<{ context?: string }>;
}) {
  const { subject, concept } = await params;
  const { context: requestedContext } = await searchParams;
  const lesson = authoredLessonFor(concept);
  const meta = getConcept(concept);
  if (!lesson || lesson.subject !== subject) notFound();

  const incoming = await headers();
  const plain: Record<string, string> = {};
  incoming.forEach((value, name) => { plain[name] = value; });
  const account = await accountFromRequest(new Request("http://openmind.local/teach", { headers: plain }));

  if (!account || !isTeachingRole(account.role)) {
    return (
      <main className="page-shell" style={{ maxWidth: 640, padding: "48px 20px" }}>
        <p className="eyebrow">Teacher-led mode</p>
        <h1>Sign in as a teacher to present this lesson</h1>
        <p>The presentation contains worked answers and teacher notes. Pupils need no accounts and no devices; the printable worksheet is available without signing in.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn primary" href="/teacher">Teacher console</Link>
          <Link className="btn secondary" href={`/print/${subject}/${concept}`}>Printable worksheet</Link>
          <Link className="btn ghost" href={`/print/${subject}/${concept}/guide`}>Teacher guide</Link>
        </div>
      </main>
    );
  }

  const session = classroomSession(lesson, meta?.title ?? concept, requestedContext);
  return (
    <ClassroomPresenter
      session={session}
      worksheetHref={`/print/${subject}/${concept}`}
      keyHref={`/print/${subject}/${concept}/key`}
      guideHref={`/print/${subject}/${concept}/guide?context=${session.context.id}`}
    />
  );
}
