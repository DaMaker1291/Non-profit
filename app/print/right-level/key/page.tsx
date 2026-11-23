import Link from "next/link";
import { headers } from "next/headers";
import MathText from "@/components/math-text";
import { PrintButton } from "@/components/print-button";
import { accountFromRequest } from "@/lib/server/auth";
import { isTeachingRole } from "@/lib/server/authority";
import { bandSheets, parseBands, sheetDate } from "@/lib/right-level-sheet";
import { CHECK_ITEMS } from "@/lib/right-level";

export const dynamic = "force-dynamic";

// ── THE TEACHER'S MARKING COPY ──────────────────────────────────────────────
//
// Gated for the same reason every other key is: these six items ARE the check
// the move-up rule reads, so the answers must not travel with the pupil sheet.
// The door is the one `app/print/[subject]/[concept]/key/page.tsx` already uses
// — the session reconstructed from the request headers, checked against the
// teaching-role rule — so there is one definition of "may read a key".
export default async function RightLevelKeyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const incoming = await headers();
  const plain: Record<string, string> = {};
  incoming.forEach((value, name) => {
    plain[name] = value;
  });
  const account = await accountFromRequest(new Request("http://openmind.local/print", { headers: plain }));

  if (!account || !isTeachingRole(account.role)) {
    return (
      <main className="page-shell" style={{ maxWidth: 620, padding: "48px 20px" }}>
        <p className="eyebrow">Band pack — teacher key</p>
        <h1>Sign in as a teacher to open the marking copy</h1>
        <p>
          The pupil sheets are available without an account. The key is separate so the six items can be marked without being handed out —
          they are the check that decides whether a band moves up.
        </p>
        <Link className="btn primary" href="/teacher">Go to the teacher console</Link>
      </main>
    );
  }

  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const bands = parseBands(pick(sp.b));
  const today = new Date().toISOString().slice(0, 10);
  const date = sheetDate(pick(sp.date), today);
  const sheets = bandSheets(bands, date);

  return (
    <main className="print-page page-shell">
      <div className="print-toolbar print-hide">
        <Link className="btn ghost" href={`/print/right-level?b=${bands.map((b) => `${b.level}:${b.count}`).join(",")}&date=${date}`}>
          Pupil sheets
        </Link>
        <Link className="btn ghost" href="/teacher/right-level">← Right-level groups</Link>
        <PrintButton label="Print key and record" />
      </div>

      <p className="eyebrow">Daily sprint · {date}</p>
      <h1 style={{ marginBottom: 4 }}>Key and band record</h1>
      <p className="lede" style={{ maxWidth: 720 }}>
        Mark only what is written on the pupil&apos;s sheet. An answer copied from a partner is not that pupil&apos;s evidence, and a band
        count can change what you reteach without moving one child up.
      </p>

      {sheets.length === 0 ? (
        <p className="small muted">No bands in this link. Open it from the right-level screen.</p>
      ) : (
        <>
          {sheets.map((sheet) => (
            <section key={sheet.level} style={{ marginTop: 18, breakInside: "avoid" }}>
              <h2 style={{ fontSize: 17, margin: "0 0 6px" }}>
                Rung {sheet.level} — {sheet.title}
              </h2>
              {sheet.outside ? (
                <p className="small">No app items: this band needs counting, one to one, and more/fewer with real objects.</p>
              ) : (
                <ol className="small" style={{ marginTop: 0 }}>
                  {sheet.answers.map((a, n) => (
                    <li key={n} style={{ marginBottom: 6 }}>
                      <MathText text={a.prompt} /> — <strong><MathText text={a.answer} /></strong>
                      {a.explanation ? <span className="muted"> · <MathText text={a.explanation} /></span> : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          <section style={{ marginTop: 26 }}>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Band record</h2>
            <p className="small" style={{ marginTop: 0 }}>
              {CHECK_ITEMS} items each. The move-up rule needs <strong>two different days</strong> at 5 or more out of {CHECK_ITEMS},
              unaided and individual.
            </p>
            <table className="print-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Rung</th>
                  <th style={{ textAlign: "left" }}>Pupils</th>
                  <th>6 / 6</th>
                  <th>5 / 6</th>
                  <th>4 / 6</th>
                  <th>Fewer</th>
                  <th>Absent</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map((sheet) => (
                  <tr key={sheet.level}>
                    <td>Rung {sheet.level} — {sheet.title}</td>
                    <td>{bands.find((b) => b.level === sheet.level)?.count ?? ""}</td>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <td key={i} style={{ borderBottom: "1px solid #1d2a24", height: 26 }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 12 }}>
              Next lesson: a band with 5+ on two separate days moves up one rung. A band that is mostly 4 or fewer gets the same rung again
              with a different representation — not the same explanation louder.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
