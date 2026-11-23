import Link from "next/link";
import { headers } from "next/headers";
import { teachingAccountOf } from "@/lib/server/authority";
import { AUTHORED_LESSONS } from "@/lib/lessons/authored";
import { getConcept } from "@/lib/genome";
import { PaperMarkEntry } from "@/components/paper-mark-entry";

export const dynamic = "force-dynamic";

/** Paper-based assessment entry. Deliberately a teacher surface: it writes
 *  evidence about a named pupil, so the account and class authority are checked
 *  on the same request that writes it. */
export default async function PaperEntryPage() {
  const incoming = await headers();
  const plain: Record<string, string> = {};
  incoming.forEach((value, name) => { plain[name] = value; });
  const teaching = await teachingAccountOf(new Request("http://openmind.local/teacher/paper", { headers: plain }));

  if (!teaching) {
    return (
      <main className="page-shell" style={{ maxWidth: 640, padding: "48px 20px" }}>
        <p className="eyebrow">Paper assessment</p>
        <h1>Sign in as a teacher to record paper marks</h1>
        <p>Marks entered here become teacher-entered evidence. The learner, the lesson version, the rubric and whether the work was individually observed are all recorded.</p>
        <Link className="btn primary" href="/teacher">Teacher console</Link>
      </main>
    );
  }

  const lessons = AUTHORED_LESSONS.map((l) => ({
    conceptId: l.conceptId,
    title: getConcept(l.conceptId)?.title ?? l.conceptId,
    subject: l.subject,
    version: l.version,
    review: l.declaredStatus,
  })).sort((a, b) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title));

  return (
    <main className="page-shell" style={{ maxWidth: 980 }}>
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <Link className="btn ghost" href="/teacher">Teacher console</Link>
        <Link className="btn ghost" href="/print">Printable lessons</Link>
      </div>
      <p className="eyebrow">Paper assessment</p>
      <h1>Record marks from a printed lesson</h1>
      <p className="lede" style={{ maxWidth: 720 }}>
        This is for work completed on paper. It never claims the paper was auto-marked. A mark entered as unobserved
        group work is kept as context but cannot become an individual mastery claim.
      </p>
      <PaperMarkEntry lessons={lessons} meId={teaching.profile.profile.id} />
    </main>
  );
}
