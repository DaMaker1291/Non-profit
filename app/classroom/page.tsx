"use client";

// The pupil's live-class door. It lists only classes the server says this
// learner is in, then lets the shared LiveClassroom component read the room.
// No join code and no peer list appear here: the class door already scoped them.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/client";
import { classes as fetchClasses } from "@/lib/api/client";
import LiveClassroom from "@/components/live-classroom";

interface Row {
  id: string;
  name: string;
  subject?: string | null;
}

export default function ClassroomPage() {
  const { state, loading } = useProfile();
  const [classes, setClasses] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const id = state?.profile.id;
    if (!id) return;
    fetchClasses(id)
      .then((j) => { if (alive) setClasses(Array.isArray(j.classes) ? j.classes : []); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : "Could not read your classes"); });
    return () => { alive = false; };
  }, [state?.profile.id]);

  return (
    <main className="container narrow page" style={{ paddingTop: 40 }}>
      <p className="eyebrow">Live classroom</p>
      <h1>Join your class</h1>
      <p className="lead">
        Your teacher controls the activity. Answers are recorded on the server when you submit.
      </p>
      {loading && <p className="small muted">Loading your classes…</p>}
      {error && <p className="small" role="alert" style={{ color: "var(--margin-red)" }}>{error}</p>}
      {!loading && !error && classes?.length === 0 && (
        <section className="card soft">
          <p className="muted">You have not joined a class yet. Use the class code from your teacher on your account page.</p>
          <Link href="/account" className="btn small">Go to your account →</Link>
        </section>
      )}
      {classes?.map((c) => (
        <section key={c.id} style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>{c.name}</h2>
          <LiveClassroom clsId={c.id} />
        </section>
      ))}
      <p className="small muted" style={{ marginTop: 18 }}>
        <Link href="/dashboard">← Home</Link> · <Link href="/account">Account</Link>
      </p>
    </main>
  );
}
