"use client";

// ── TEACH AT THE RIGHT LEVEL ─────────────────────────────────────────────────
//
// The screen in front of the mechanism in lib/right-level.ts. It does four
// things and refuses a fifth:
//
//   1. shows which rung each pupil is on, from the server's own projection;
//   2. shows the pupils it CANNOT place, separately, rather than at the bottom;
//   3. gives each band a twenty-minute daily sprint and the move-up rule;
//   4. prints the oral placement sheet, which needs no device and no reading;
//
// The fifth — claiming this raises a national learning rate — is refused on the
// page itself, beside the literacy gap, because a teacher deciding whether to
// spend a term on this deserves the limit before the promise.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProfile } from "@/lib/client";
import { classes as fetchClasses } from "@/lib/api/client";
import type { ClassRoster } from "@/lib/types";
import {
  assessClass,
  classPlan,
  evaluateMoveUp,
  levelGain,
  LITERACY_GAP,
  PLACEMENT,
  RIGHT_LEVEL_CLAIMS,
  RUNGS,
  type AssessedLevel,
  type LevelObservation,
  type RungLevel,
} from "@/lib/right-level";

const LEVEL_OPTIONS: AssessedLevel[] = ["unknown", "below", 0, 1, 2, 3, 4, 5];

function levelLabel(level: AssessedLevel): string {
  if (level === "unknown") return "Not placed";
  if (level === "below") return "Below rung 0";
  const rung = RUNGS.find((r) => r.level === level);
  return `Rung ${level} — ${rung?.label ?? ""}`;
}

// Named `loadLocal`/`saveLocal` on purpose: `readJson`/`writeJson` are the
// FILE STORE's private helpers, and the suite refuses a page that reaches for
// those names (scripts/verify-engines.mjs, "No route reaches past the port").
// This is browser-local placement state, not the store, and it must not look
// like the store to a reader or to the gate.
function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* a full phone: the screen still works, it just forgets */
  }
}

export default function RightLevelPage() {
  const { state, loading } = useProfile();
  const me = state?.profile.id;
  const [rows, setRows] = useState<ClassRoster[] | null>(null);
  const [error, setError] = useState("");
  const [clsId, setClsId] = useState<string>("");
  const [overrides, setOverrides] = useState<Record<string, AssessedLevel>>({});
  const [history, setHistory] = useState<Record<string, LevelObservation[]>>({});

  useEffect(() => {
    if (!me) return;
    let alive = true;
    fetchClasses(me)
      .then((j) => {
        if (!alive) return;
        setRows(j.classes ?? []);
        setClsId((current) => current || (j.classes?.[0]?.id ?? ""));
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not read your classes");
      });
    return () => {
      alive = false;
    };
  }, [me]);

  const cls = useMemo(() => rows?.find((r) => r.id === clsId) ?? null, [rows, clsId]);

  useEffect(() => {
    if (!cls) return;
    setOverrides(loadLocal<Record<string, AssessedLevel>>(`openmind:right-level:${cls.id}`, {}));
    setHistory(loadLocal<Record<string, LevelObservation[]>>(`openmind:right-level-history:${cls.id}`, {}));
  }, [cls]);

  const setLevel = useCallback(
    (handle: string, level: AssessedLevel) => {
      if (!cls) return;
      const next = { ...overrides, [handle]: level };
      setOverrides(next);
      saveLocal(`openmind:right-level:${cls.id}`, next);
      if (typeof level === "number") {
        const day = new Date().toISOString().slice(0, 10);
        const series = history[handle] ?? [];
        const lastDay = series.length ? new Date(series[series.length - 1]!.at).toISOString().slice(0, 10) : "";
        if (lastDay !== day) {
          const nextHistory = { ...history, [handle]: [...series, { at: Date.now(), level: level as RungLevel }] };
          setHistory(nextHistory);
          saveLocal(`openmind:right-level-history:${cls.id}`, nextHistory);
        }
      }
    },
    [cls, overrides, history],
  );

  const members = useMemo(() => {
    if (!cls) return [] as string[];
    const handles = new Set<string>([
      ...Object.keys(cls.live ?? {}),
      ...Object.keys(cls.students ?? {}),
    ]);
    return [...handles].sort((a, b) => a.localeCompare(b));
  }, [cls]);

  const evidenceLevels = useMemo(() => (cls ? assessClass(cls.live).levels : {}), [cls]);

  const levels = useMemo(() => {
    const merged: Record<string, AssessedLevel> = {};
    for (const handle of members) merged[handle] = overrides[handle] ?? evidenceLevels[handle] ?? "unknown";
    return merged;
  }, [members, overrides, evidenceLevels]);

  const plan = useMemo(() => classPlan(levels, cls?.classroom), [levels, cls?.classroom]);

  const gains = useMemo(
    () =>
      Object.entries(history)
        .map(([handle, series]) => ({ handle, gain: levelGain(series) }))
        .filter((row) => row.gain.gained !== null)
        .sort((a, b) => (b.gain.gained ?? 0) - (a.gain.gained ?? 0)),
    [history],
  );

  const movement = evaluateMoveUp([]);

  // The paper loop. Built here rather than through `bandsQuery` so this page
  // does not import the question bank: the sheet module pulls in every
  // generator, and a teacher's bands are a two-field string.
  const today = new Date().toISOString().slice(0, 10);
  const printHref = `/print/right-level?b=${plan.bands.bands.map((b) => `${b.level}:${b.count}`).join(",")}&date=${today}`;

  return (
    <main className="container narrow page" style={{ paddingTop: 40 }}>
      <style>{`@media print { .no-print { display: none !important; } .card { break-inside: avoid; } }`}</style>

      <p className="eyebrow">Teacher console · Placement</p>
      <h1>Teach at the right level</h1>
      <p className="lead">
        A class of fifty spans several years of attainment. This screen finds the rung each pupil is actually on, groups the room by it,
        and gives each group a twenty-minute daily routine — then moves a pupil up only when they have done it unaided, twice.
      </p>

      {!me && !loading && (
        <section className="card soft">
          <p className="muted">Sign in as a teacher to place a class.</p>
          <Link className="btn" href="/onboarding?role=teacher&mode=signin">Sign in as a teacher</Link>
        </section>
      )}

      {error && <p className="small" role="alert" style={{ color: "var(--margin-red)" }}>{error}</p>}
      {me && !error && rows === null && <p className="small muted">Reading your classes…</p>}

      {rows && rows.length === 0 && (
        <section className="card soft">
          <p className="muted">You have no class yet. Create one on the teacher console, then come back.</p>
          <Link className="btn small" href="/teacher">Teacher console →</Link>
        </section>
      )}

      {rows && rows.length > 0 && (
        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          <label className="small muted" htmlFor="class-picker">Class</label>
          <select id="class-picker" value={clsId} onChange={(e) => setClsId(e.target.value)}>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {cls && (
        <>
          <section className="card" style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div><p className="small muted" style={{ margin: 0 }}>Pupils</p><strong>{plan.bands.total}</strong></div>
              <div><p className="small muted" style={{ margin: 0 }}>Placed</p><strong>{plan.bands.measured}</strong></div>
              <div><p className="small muted" style={{ margin: 0 }}>Unmeasured</p><strong>{plan.bands.unknown.length}</strong></div>
              <div><p className="small muted" style={{ margin: 0 }}>Rungs in the room</p><strong>{plan.bands.spread + 1}</strong></div>
            </div>
            {plan.bands.oneExplanationCannotCover && (
              <p className="small" style={{ marginBottom: 0 }}>
                This room spans {plan.bands.spread} rungs. One whole-class explanation cannot reach it.
              </p>
            )}
          </section>

          {plan.warnings.length > 0 && (
            <section className="card soft" style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, marginTop: 0 }}>What this room needs first</h2>
              <ul className="small">
                {plan.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </section>
          )}

          <section style={{ marginBottom: 22 }}>
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>The bands</h2>
              {plan.bands.bands.length > 0 && (
                <Link className="btn small" href={printHref}>Print today&apos;s six-item packs →</Link>
              )}
            </div>
            {plan.bands.bands.length === 0 && (
              <p className="small muted">No pupil has a rung yet. Place the class below — eight pupils this week is enough to start.</p>
            )}
            {plan.bands.bands.map((band) => {
              const sprint = plan.sprints.find((s) => s.level === band.level);
              return (
                <article key={band.level} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>
                      {band.level === 0 ? "Before place value" : `Rung ${band.level} — ${band.conceptTitle}`}
                    </h3>
                    <span className="small muted">{band.count} pupil{band.count === 1 ? "" : "s"}</span>
                  </div>
                  <p className="small" style={{ margin: "6px 0" }}><strong>Can already:</strong> {band.can}</p>
                  <p className="small" style={{ margin: "6px 0" }}><strong>Teach next:</strong> {band.teach}</p>
                  {sprint && (
                    <>
                      <p className="small muted" style={{ marginBottom: 4 }}>
                        20-minute daily sprint · {sprint.available ? "from the app's own lesson" : "not app content"}
                      </p>
                      <ol className="small" style={{ marginTop: 0 }}>
                        {sprint.blocks.map((b) => (
                          <li key={b.step}><strong>{b.minutes} min · {b.step}:</strong> {b.detail}</li>
                        ))}
                      </ol>
                      <p className="small muted" style={{ marginBottom: 0 }}>{sprint.recordNote}</p>
                    </>
                  )}
                  <p className="small muted" style={{ marginBottom: 0 }}>
                    {band.members.slice(0, 12).join(", ")}{band.members.length > 12 ? ` +${band.members.length - 12} more` : ""}
                  </p>
                </article>
              );
            })}
            {plan.bands.below.length > 0 && (
              <p className="small">
                <strong>Below rung 0 ({plan.bands.below.length}):</strong> {plan.bands.below.join(", ")} — counting, one to one, more and fewer.
                The app has no lesson for this; use the ten-minute routine and raise it with your district.
              </p>
            )}
            {plan.bands.unknown.length > 0 && (
              <p className="small">
                <strong>Not placed ({plan.bands.unknown.length}):</strong> {plan.bands.unknown.join(", ")} — unmeasured, not at the bottom.
              </p>
            )}
          </section>

          <section className="card" style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 20, marginTop: 0 }}>Place a pupil</h2>
            <p className="small">
              The placement is oral: you say each probe, the pupil answers out loud, you mark it. Nothing is read and nothing is written by the pupil.
              Start at rung 0 and stop at the first rung they miss.
            </p>
            <p className="small muted">
              {plan.load.pupils} pupils × {plan.load.minutesPerPupil} minutes is {plan.load.wholeClassMinutes} minutes
              ({plan.load.wholeClassLessons} lessons). That is why the eight-pupil sample exists: {plan.load.sampleMinutes} minutes this week,
              the rest placed as they are seen.
            </p>
            <table className="small" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Pupil</th>
                  <th style={{ textAlign: "left" }}>From the ledger</th>
                  <th style={{ textAlign: "left" }}>Rung (this device)</th>
                </tr>
              </thead>
              <tbody>
                {members.map((handle) => (
                  <tr key={handle}>
                    <td>{handle}</td>
                    <td className="muted">{evidenceLevels[handle] === undefined ? "—" : levelLabel(evidenceLevels[handle]!)}</td>
                    <td>
                      <select
                        aria-label={`Rung for ${handle}`}
                        value={String(levels[handle] ?? "unknown")}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setLevel(handle, raw === "unknown" || raw === "below" ? raw : (Number(raw) as RungLevel));
                        }}
                      >
                        {LEVEL_OPTIONS.map((o) => (
                          <option key={String(o)} value={String(o)}>{levelLabel(o)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 && <p className="small muted">No pupils have joined this class yet.</p>}
            <p className="small muted" style={{ marginBottom: 0 }}>
              Rungs you enter are kept on this device only, for this class. They are not sent to the server and not shown to pupils.
            </p>
          </section>

          {gains.length > 0 && (
            <section className="card soft" style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 18, marginTop: 0 }}>Rungs moved</h2>
              <ul className="small">
                {gains.map(({ handle, gain }) => (
                  <li key={handle}>
                    <strong>{handle}</strong>: {gain.gained! > 0 ? "+" : ""}{gain.gained} rung{gain.gained === 1 ? "" : "s"} over {gain.spanDays} day{gain.spanDays === 1 ? "" : "s"}
                    {gain.perWeek === null ? " — too short for a weekly rate" : ` (${gain.perWeek} per week)`}.
                  </li>
                ))}
              </ul>
              <p className="small muted" style={{ marginBottom: 0 }}>
                These are this device's own placement observations, not an external assessment.
              </p>
            </section>
          )}

          <section className="card" style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 20, marginTop: 0 }}>The move-up rule</h2>
            <p className="small">
              Two sittings, on two different days, six items each, at least five right and unaided. A group answer, a shared device or a marking of
              ten sampled books informs what to reteach and never moves a child up.
            </p>
            <p className="small muted" style={{ marginBottom: 0 }}>
              Right now, with no sitting recorded, the rule says: <strong>{movement.decision.replace(/-/g, " ")}</strong> — {movement.because}
            </p>
          </section>

          <section className="card" style={{ marginBottom: 22 }}>
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>Placement sheet</h2>
              <button className="btn small" type="button" onClick={() => window.print()}>Print this</button>
            </div>
            {RUNGS.map((rung) => (
              <div key={rung.level} style={{ marginTop: 14 }}>
                <h3 style={{ fontSize: 16, margin: "0 0 4px" }}>
                  {rung.level === 0 ? "Rung 0 — counting (below the app's content)" : `Rung ${rung.level} — ${rung.label}`}
                </h3>
                <ol className="small" style={{ marginTop: 0 }}>
                  {PLACEMENT[rung.level].map((p) => (
                    <li key={p.show}>
                      {p.show} <span className="muted">Expected: {p.expect}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>

          <section className="card soft" style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>What this does not do</h2>
            <ul className="small">
              {RIGHT_LEVEL_CLAIMS.doesNotAssert.map((line) => <li key={line}>{line}</li>)}
            </ul>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Literacy: {LITERACY_GAP.present ? "present" : "absent"}</h3>
            <p className="small" style={{ marginTop: 0 }}>{LITERACY_GAP.why}</p>
            <p className="small" style={{ marginBottom: 4 }}><strong>What is missing:</strong></p>
            <ul className="small" style={{ marginTop: 0 }}>
              {LITERACY_GAP.missing.map((m) => <li key={m}>{m}</li>)}
            </ul>
            <p className="small" style={{ marginBottom: 0 }}>
              <strong>What it would take:</strong> {LITERACY_GAP.wouldRequire.join("; ")}.
            </p>
          </section>

          <p className="small muted">
            <Link href="/teacher">← Teacher console</Link> · <Link href="/print">Print packs</Link>
          </p>
        </>
      )}
    </main>
  );
}
