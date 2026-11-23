import Link from "next/link";
import { AUTHORED_LESSONS } from "@/lib/lessons/authored";
import { getConcept } from "@/lib/genome";
import { SUBJECT_IDS } from "@/lib/subjects";

export default function PrintableIndexPage() {
  const names: Record<string, string> = { maths: "Mathematics", physics: "Physics", chemistry: "Chemistry", biology: "Biology", computing: "Computing" };
  const bySubject = SUBJECT_IDS.map((id) => ({
    subject: { id, name: names[id] ?? id },
    lessons: AUTHORED_LESSONS
      .filter((l) => l.subject === id)
      .map((l) => ({ ...l, title: getConcept(l.conceptId)?.title ?? l.conceptId }))
      .sort((a, b) => a.title.localeCompare(b.title)),
  })).filter((s) => s.lessons.length > 0);

  return (
    <main className="page-shell" style={{ maxWidth: 980 }}>
      <p className="eyebrow">Printable lessons</p>
      <h1>Teach and assess without a device per pupil</h1>
      <p className="lede" style={{ maxWidth: 760 }}>
        Every authored lesson has a pupil worksheet and a separate teacher answer key generated from the same lesson
        definition. Worksheets print without answers. Keys require a teacher account.
      </p>
      <div className="card soft" style={{ marginBottom: 20 }}>
        <p style={{ margin: 0 }}><strong>Using paper only:</strong> open a subject, then print the whole subject pack if you want a unit set. Each lesson starts on a new sheet.</p>
        <p style={{ margin: "8px 0 0" }}><strong>Using one teacher computer:</strong> open a lesson’s teacher-led mode for a projector run with class prompts and group tasks.</p>
      </div>

      {bySubject.map(({ subject, lessons }) => (
        <section key={subject.id} style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 6 }}>{subject.name}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link className="btn secondary" href={`/print/${subject.id}`}>Subject index</Link>
              <Link className="btn ghost" href={`/print/${subject.id}/all`}>Print all worksheets</Link>
            </div>
          </div>
          <ul className="lesson-list">
            {lessons.map((lesson) => (
              <li key={lesson.conceptId}>
                <Link href={`/print/${subject.id}/${lesson.conceptId}`}>{lesson.title}</Link>
                <span className="small muted"> · <Link href={`/print/${subject.id}/${lesson.conceptId}/key`}>teacher key</Link> · <Link href={`/teach/${subject.id}/${lesson.conceptId}`}>teacher-led</Link></span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
