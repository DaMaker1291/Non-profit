import Link from "next/link";
import MathText from "@/components/math-text";
import { PrintButton } from "@/components/print-button";
import { bandSheets, parseBands, sheetDate, type BandSheet } from "@/lib/right-level-sheet";
import { CHECK_ITEMS, RUNGS } from "@/lib/right-level";

// ── THE BAND PACK, ON PAPER ─────────────────────────────────────────────────
//
// What a teacher prints when the room has no pupil device: one sheet per band,
// six items each, a key, and the band record the move-up rule needs. The seed
// is the date, so every band sits the same six as every other class on that
// rung that day, and tomorrow's sheet is different.
//
// THE PUPIL SHEETS ARE PUBLIC, THE KEY IS NOT — the same split as every other
// print route (`/print/<subject>/<concept>` vs `.../key`). The first version of
// this page printed the key below the sheets with no gate at all, which broke
// the app's own rule: the six items ARE the check the move-up rule reads, so a
// pupil holding the URL held the answers to a test they are about to sit. The
// key now lives at `/print/right-level/key`, behind the teacher account door
// that `app/print/[subject]/[concept]/key/page.tsx` already uses.
export default async function RightLevelPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const bands = parseBands(pick(sp.b));
  const today = new Date().toISOString().slice(0, 10);
  const date = sheetDate(pick(sp.date), today);
  const sheets = bandSheets(bands, date);

  if (sheets.length === 0) {
    return (
      <main className="print-page page-shell">
        <p className="eyebrow">Printable band packs</p>
        <h1>No bands in this link</h1>
        <p className="lede">
          This page prints one sheet per teaching band. Open it from the right-level screen so it knows which bands your class has,
          or add them to the address as <code>b=1:12,2:25,3:18</code> — rung, then how many pupils.
        </p>
        <div className="print-toolbar print-hide">
          <Link className="btn" href="/teacher/right-level">Right-level groups →</Link>
          <Link className="btn ghost" href="/print">Printable lessons</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="print-page page-shell">
      <div className="print-toolbar print-hide">
        <Link className="btn ghost" href="/teacher/right-level">← Right-level groups</Link>
        <Link className="btn secondary" href={`/print/right-level/key?b=${bands.map((b) => `${b.level}:${b.count}`).join(",")}&date=${date}`}>
          Teacher key →
        </Link>
        <PrintButton label="Print band packs" />
      </div>

      <header>
        <p className="eyebrow">Daily sprint · {date}</p>
        <h1 style={{ marginBottom: 6 }}>Six items, books closed</h1>
        <p className="lede" style={{ maxWidth: 720 }}>
          One sheet per band. Read nothing aloud except the item; pupils answer on the sheet. Four minutes, silently, no partner —
          this is the check the move-up rule reads, not practice. The marking copy is the separate teacher key.
        </p>
      </header>

      {sheets.map((sheet) => (
        <PupilSheet key={sheet.level} sheet={sheet} date={date} />
      ))}

      <p className="small muted" style={{ marginTop: 20 }}>
        {CHECK_ITEMS} items each. Mark from the teacher key; a band count changes what you reteach, and only two separate days of individual
        unaided work changes a rung.
      </p>
    </main>
  );
}

function PupilSheet({ sheet, date }: { sheet: BandSheet; date: string }) {
  const rung = RUNGS.find((r) => r.level === sheet.level);
  return (
    <section className="print-page-break" style={{ marginTop: 26 }} aria-label={`Rung ${sheet.level} sheet`}>
      <h2 style={{ marginBottom: 2 }}>
        {sheet.level === 0 ? "Counting" : `Rung ${sheet.level} — ${sheet.title}`}
      </h2>
      <p className="small muted" style={{ marginTop: 0 }}>
        Name ____________________________ &nbsp;&nbsp; Date {date} &nbsp;&nbsp; Band: {sheet.level === 0 ? "counting" : rung?.label ?? ""}
      </p>

      {sheet.outside ? (
        <>
          <p className="small">
            <strong>No sheet for this band.</strong> Six written items would test reading, not counting. Run the ten-minute routine:
          </p>
          <ol className="small">
            <li>Count to 20 together, touching one object per number.</li>
            <li>Ten stones in a row: one stone per number, again.</li>
            <li>Two rows — “which has more? how many more?”</li>
            <li>“Give me 6” — the pupil counts out exactly six, then checks by counting again.</li>
          </ol>
        </>
      ) : (
        <>
          {sheet.short && (
            <p className="small">
              <strong>This sheet is short:</strong> the bank supplied {sheet.items.length} of {CHECK_ITEMS} items for this rung today.
              Record the count out of {sheet.items.length} and note the shortfall.
            </p>
          )}
          <ol className="print-items" style={{ paddingLeft: 20 }}>
            {/* KEYED BY POSITION, NOT BY `item.id`. The id carries the drawing
                seed, and React puts a key on the element it serialises for
                hydration — so keying by id wrote `right-level:1:2026-11-23:0`
                into the page's own flight payload. The seed never needs to
                leave this module: the sheet is fixed for the day. */}
            {sheet.items.map((item, n) => (
              <li key={n} style={{ marginBottom: 14 }}>
                <div><MathText text={item.prompt} /></div>
                <div className="small" style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 4 }}>
                  {item.choices.map((choice, i) => (
                    <span key={i}>
                      <strong>{String.fromCharCode(65 + i)}.</strong> <MathText text={choice} />
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
