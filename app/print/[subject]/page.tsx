import Link from "next/link";
import { notFound } from "next/navigation";
import { AUTHORED_LESSONS } from "@/lib/lessons/authored";
import { getConcept } from "@/lib/genome";
import { SUBJECT_IDS } from "@/lib/subjects";
import { PrintButton } from "@/components/print-button";

const NAMES: Record<string, string> = { maths: "Mathematics", physics: "Physics", chemistry: "Chemistry", biology: "Biology", computing: "Computing" };

export default async function PrintableSubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  if (!(SUBJECT_IDS as string[]).includes(subject)) notFound();
  const lessons = AUTHORED_LESSONS
    .filter((l) => l.subject === subject)
    .map((l) => ({ ...l, title: getConcept(l.conceptId)?.title ?? l.conceptId }))
    .sort((a, b) => a.title.localeCompare(b.title));
  if (lessons.length === 0) notFound();

  return (
    <main className="page-shell" style={{ maxWidth: 940 }}>
      <div className="toolbar" style={{ marginBottom: 10 }}>
        <Link className="btn ghost" href="/print">All subjects</Link>
        <Link className="btn secondary" href={`/print/${subject}/all`}>Print every worksheet</Link>
        <PrintButton label="Print this index" />
      </div>
      <p className="eyebrow">Printable subject pack</p>
      <h1>{NAMES[subject] ?? subject}</h1>
      <p className="lede">{lessons.length} authored lessons. Each worksheet carries the explanation, worked examples, diagrams, practice, assessment, answer spaces and marking guidance link. Answers are only in the separate teacher key.</p>

      <table className="print-table" style={{ marginTop: 20 }}>
        <thead><tr><th>Lesson</th><th>Version</th><th>Review state</th><th>Sheets</th></tr></thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.conceptId}>
              <td><strong>{lesson.title}</strong></td>
              <td>{lesson.version}</td>
              <td>{lesson.declaredStatus.replace(/_/g, " ")}</td>
              <td>
                <Link href={`/print/${subject}/${lesson.conceptId}`}>worksheet</Link>
                {" · "}
                <Link href={`/print/${subject}/${lesson.conceptId}/key`}>key</Link>
                {" · "}
                <Link href={`/teach/${subject}/${lesson.conceptId}`}>teacher-led</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="card soft" style={{ marginTop: 22 }}>
        <h2 style={{ marginTop: 0 }}>Using the pack without internet</h2>
        <p>Open “Print every worksheet”, then print or save the whole set as one PDF while connected. The saved PDF needs no network in class. The teacher key is separate and must be saved separately.</p>
        <p className="small muted">A worksheet never contains the answer key. A teacher key requires a teaching account.</p>
      </section>
    </main>
  );
}
