"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE TEACHER'S FIRST LESSON — one page, three answers, no registration form.
//
// WHY THIS PAGE EXISTS. The teacher console could create a class and then
// showed nine panels. Nothing asked the two questions that decide how a lesson
// actually runs — what is in the room, and what am I teaching next — and
// nothing joined them, so a teacher arriving for the first time had to work out
// for themselves that the printable guide, the presenter, the worksheet and the
// live classroom are four doors onto one lesson.
//
// The shape is deliberately three steps and not twenty fields:
//
//   1. YOUR CLASSROOM. Four answers change the plan most (class size, devices,
//      connectivity, languages). The rest is behind one disclosure, and every
//      field says what answering it changes, so "add detail later" is a list of
//      consequences rather than homework.
//   2. WHAT TO TEACH. The class's own curriculum, not the whole genome.
//   3. YOUR FIRST LESSON. The derived plan (how the room runs), the traps the
//      authored plan warns about, and the four doors: prepare, present, print,
//      key.
//
// THE HONESTY RULES THIS PAGE KEEPS. It never prints a fact the teacher did not
// declare: undecided fields say "not said yet" and the plan names what it
// assumed (lib/classroom-context.ts#teachingPlan). It never claims a lesson is
// reviewed: the plan's own review state is shown where the plan is shown.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadLocalProfileId, useI18n, useProfile } from "@/lib/client";
import * as api from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import { ctitle } from "@/lib/content-i18n";
import { LANGS } from "@/lib/i18n";
import { bySubject } from "@/lib/genome";
import { planFor } from "@/lib/lesson-plans";
import { courseConceptIds, specById } from "@/lib/specifications";
import { allPathways } from "@/lib/curricula/registry";
import { classroomContext } from "@/lib/classroom-session";
import {
  ACCESS_NEEDS,
  CONNECTIVITY,
  DEVICE_MODES,
  MATERIALS,
  QUICK_START_FIELDS,
  SCHOOL_TYPES,
  classroomDeclared,
  classroomGaps,
  classroomReady,
  normalizeClassroom,
  teachingPlan,
  type AccessNeed,
  type ClassroomFieldId,
  type ClassroomProfile,
  type Connectivity,
  type DeliveryMode,
  type DeviceMode,
  type MaterialId,
  type SchoolType,
} from "@/lib/classroom-context";
import type { ClassRoster, SubjectId } from "@/lib/types";

const EMPTY: ClassroomProfile = { version: 1, languages: [], materials: [], access: [] };

const DEVICE_LABEL: Record<DeviceMode, string> = {
  none: "No pupil devices",
  "teacher-only": "One teacher computer",
  shared: "A few shared devices",
  "one-per-pupil": "A device for every pupil",
};

const NET_LABEL: Record<Connectivity, string> = {
  none: "None during lessons",
  intermittent: "Intermittent",
  reliable: "Reliable",
};

const MATERIAL_LABEL: Record<MaterialId, string> = {
  board: "Board / chalkboard",
  textbooks: "Textbooks",
  printer: "Printer",
  projector: "Projector",
  laboratory: "Laboratory",
  manipulatives: "Counters / apparatus",
};

const ACCESS_LABEL: Record<AccessNeed, string> = {
  "low-vision": "Low vision",
  "large-print": "Needs large print",
  hearing: "Hearing difficulty",
  motor: "Motor difficulty",
  attention: "Attention difficulty",
  "screen-reader": "Uses a screen reader",
};

const SCHOOL_LABEL: Record<SchoolType, string> = {
  public: "Public",
  private: "Private",
  community: "Community",
  faith: "Faith-based",
  independent: "Independent",
  informal: "Informal / community learning",
};

const DELIVERY: Record<DeliveryMode, string> = {
  "whole-class": "Whole-class teaching",
  "shared-device": "Shared-device teaching",
  individual: "Individual learning",
  offline: "Offline teaching",
};

/** Country codes the curriculum registry actually holds. A teacher whose
 *  country is absent is not silently mapped to another: the field stays empty
 *  and the custom-curriculum line below is where they say what they follow. */
const COUNTRY_CODES = [...new Set(
  allPathways()
    .map((p) => p.countryCode)
    // "INT" is not a country: it is a programme available everywhere, and a
    // classroom is in one place.
    .filter((code) => code !== "INT"),
)].sort();

function failureText(e: unknown): string {
  return e instanceof ApiError ? e.code || `HTTP ${e.status}` : "Could not save";
}

function Field({ label, why, children }: { label: string; why: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontWeight: 700, fontSize: 14 }}>{label}</span>
      <span style={{ display: "block", margin: "4px 0 6px" }}>{children}</span>
      <span className="small muted" style={{ display: "block" }}>{why}</span>
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`chip ${on ? "warn" : ""}`}
      aria-pressed={on}
      onClick={onClick}
      style={{ marginRight: 6, marginBottom: 6 }}
    >
      {children}
    </button>
  );
}

export default function ClassroomSetupPage() {
  const { lang } = useI18n();
  const { state, loading } = useProfile();
  const me = state?.profile.id ?? (typeof window === "undefined" ? "" : loadLocalProfileId() ?? "");

  const [classes, setClasses] = useState<ClassRoster[] | null>(null);
  const [classId, setClassId] = useState("");
  const [draft, setDraft] = useState<ClassroomProfile>(EMPTY);
  const [focus, setFocus] = useState("");
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<"profile" | "lesson" | "">("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me) return;
    let alive = true;
    api
      .classes(me)
      .then((j) => {
        if (!alive) return;
        const list = j.classes ?? [];
        setClasses(list);
        const wanted = new URLSearchParams(window.location.search).get("class");
        const chosen = list.find((c) => c.id === wanted) ?? list[0];
        if (chosen) {
          setClassId(chosen.id);
          setDraft(chosen.classroom ?? EMPTY);
          setFocus(chosen.focusConceptId ?? "");
        }
      })
      .catch((e) => {
        if (alive) {
          setClasses([]);
          setErr(failureText(e));
        }
      });
    return () => {
      alive = false;
    };
  }, [me]);

  const selected = classes?.find((c) => c.id === classId);
  const subject: SubjectId = selected?.subject ?? "maths";
  const plan = useMemo(() => teachingPlan(draft), [draft]);
  const gaps = useMemo(() => classroomGaps(draft), [draft]);
  const ready = classroomReady(draft);

  const conceptIds = useMemo(() => {
    const spec = selected?.specificationId ? specById(selected.specificationId) : null;
    return spec ? [...courseConceptIds(spec)].sort() : bySubject(subject).map((c) => c.id);
  }, [selected?.specificationId, subject]);

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return conceptIds;
    return conceptIds.filter((id) => ctitle(lang, id).toLowerCase().includes(needle) || id.includes(needle));
  }, [conceptIds, filter, lang]);

  const pickClass = useCallback((cls: ClassRoster) => {
    setClassId(cls.id);
    setDraft(cls.classroom ?? EMPTY);
    setFocus(cls.focusConceptId ?? "");
    setSaved("");
    setErr("");
    const url = new URL(window.location.href);
    url.searchParams.set("class", cls.id);
    window.history.replaceState(null, "", url);
  }, []);

  function set<K extends keyof ClassroomProfile>(key: K, value: ClassroomProfile[K]): void {
    setDraft((d) => normalizeClassroom({ ...d, [key]: value }));
    setSaved("");
  }

  function toggleIn<K extends "materials" | "access">(key: K, value: string): void {
    const list = draft[key] as string[];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    setDraft((d) => normalizeClassroom({ ...d, [key]: next }));
    setSaved("");
  }

  function toggleLanguage(code: string): void {
    const next = draft.languages.includes(code)
      ? draft.languages.filter((c) => c !== code)
      : [...draft.languages, code];
    setDraft((d) => normalizeClassroom({ ...d, languages: next }));
    setSaved("");
  }

  async function saveClassroom(): Promise<void> {
    if (!classId || busy) return;
    setBusy(true);
    setErr("");
    try {
      const j = await api.classAction({ action: "update", id: me, clsId: classId, classroom: draft });
      const updated = j.cls as ClassRoster;
      setClasses((list) => (list ?? []).map((c) => (c.id === classId ? updated : c)));
      setSaved("profile");
    } catch (e) {
      setErr(failureText(e));
    } finally {
      setBusy(false);
    }
  }

  async function chooseConcept(id: string): Promise<void> {
    if (!classId) return;
    setErr("");
    try {
      const j = await api.classAction({ action: "update", id: me, clsId: classId, focusConceptId: id });
      const updated = j.cls as ClassRoster;
      setClasses((list) => (list ?? []).map((c) => (c.id === classId ? updated : c)));
      setFocus(id);
      setSaved("lesson");
    } catch (e) {
      setErr(failureText(e));
    }
  }

  const focusPlan = focus ? planFor(focus) : null;
  const quickGaps = gaps.filter((g) => g.quick);
  const detailGaps = gaps.filter((g) => !g.quick);

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: 36 }}>
        <p className="small muted">Reading your classes…</p>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="container" style={{ paddingTop: 36, maxWidth: 720 }}>
        <h1>Your first lesson</h1>
        <p className="lead">Sign in as a teacher to describe your classroom and prepare a lesson.</p>
        <Link className="btn" href="/teacher">Go to the teacher console</Link>
      </main>
    );
  }

  if (classes !== null && classes.length === 0) {
    return (
      <main className="container" style={{ paddingTop: 36, maxWidth: 720 }}>
        <h1>Your first lesson</h1>
        <p className="lead">Make a class first. A class carries the subject, the curriculum and the room it is taught in.</p>
        {err && <p className="small" role="alert">{err}</p>}
        <Link className="btn" href="/teacher">Make a class →</Link>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 36, maxWidth: 900 }}>
      <p className="eyebrow">Teacher · first lesson</p>
      <h1>Set up your classroom, then teach one lesson</h1>
      <p className="lead" style={{ maxWidth: 720 }}>
        Four answers change how a lesson runs. Everything else can wait, and every field says what it changes.
        Nothing here needs pupil accounts, and nothing needs a device in a pupil&apos;s hand.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0 4px" }}>
        <span className={`chip ${ready ? "warn" : ""}`}>{ready ? "1 · Classroom recorded" : `1 · ${quickGaps.length} quick answers left`}</span>
        <span className={`chip ${focus ? "warn" : ""}`}>{focus ? "2 · Lesson chosen" : "2 · Choose a lesson"}</span>
        <span className="chip">{focus ? "3 · Ready to teach" : "3 · Your run sheet"}</span>
      </div>

      {classes && classes.length > 1 && (
        <div className="card" style={{ marginTop: 12 }}>
          <p className="eyebrow" style={{ marginTop: 0 }}>Which class?</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${c.id === classId ? "warn" : ""}`}
                aria-pressed={c.id === classId}
                onClick={() => pickClass(c)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {err && <div className="feedback no" style={{ marginTop: 14 }}><span className="verdict">✗</span>{err}</div>}

      {/* ── 1 · THE ROOM ─────────────────────────────────────────────────── */}
      <section className="card" style={{ marginTop: 16 }} aria-labelledby="room-heading">
        <p className="eyebrow" style={{ marginTop: 0 }}><span className="no">1</span> Your classroom</p>
        <h2 id="room-heading" className="section" style={{ marginTop: 4 }}>
          {selected ? selected.name : "Your class"}
        </h2>
        <p className="small muted" style={{ marginTop: 0 }}>
          These four answers are the ones that change the lesson. {QUICK_START_FIELDS.length === 4 ? "They take about a minute." : ""}
        </p>

        <div className="grid cols2" style={{ gap: 16 }}>
          <Field label="How many pupils are in the room?" why="Decides whether understanding is checked in writing, orally or by sampling.">
            <input
              type="number"
              min={1}
              max={500}
              inputMode="numeric"
              placeholder="e.g. 42"
              value={draft.classSize ?? ""}
              onChange={(e) => set("classSize", e.target.value === "" ? undefined : Number(e.target.value))}
              style={{ width: 140 }}
            />
          </Field>

          <Field label="What do pupils have in front of them?" why="Decides whether a pupil can answer on a device at all.">
            <select
              value={draft.devices ?? ""}
              onChange={(e) => set("devices", (e.target.value || undefined) as DeviceMode | undefined)}
            >
              <option value="">Not said yet</option>
              {DEVICE_MODES.map((d) => <option key={d} value={d}>{DEVICE_LABEL[d]}</option>)}
            </select>
          </Field>

          <Field label="Does the internet work during a lesson?" why="Decides whether the lesson can use the live classroom or must be prepared offline.">
            <select
              value={draft.internet ?? ""}
              onChange={(e) => set("internet", (e.target.value || undefined) as Connectivity | undefined)}
            >
              <option value="">Not said yet</option>
              {CONNECTIVITY.map((c) => <option key={c} value={c}>{NET_LABEL[c]}</option>)}
            </select>
          </Field>

          <Field
            label="Which languages are in the room?"
            why="The first one you choose is the language of instruction. Others are languages pupils may think and discuss in."
          >
            <div>
              {LANGS.map((l) => (
                <Chip key={l.code} on={draft.languages.includes(l.code)} onClick={() => toggleLanguage(l.code)}>
                  {l.native}
                  {draft.languages[0] === l.code ? " · instruction" : ""}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <button type="button" className="btn ghost small" onClick={() => setDetail((v) => !v)} aria-expanded={detail}>
          {detail ? "Hide" : "Add"} classroom detail ({detailGaps.length} optional)
        </button>

        {detail && (
          <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div className="grid cols2" style={{ gap: 16 }}>
              <Field label="Country" why="Selects the education system the class's curriculum comes from. Leave it empty if your country is not listed — you can name your curriculum below.">
                <select value={draft.country ?? ""} onChange={(e) => set("country", e.target.value || undefined)}>
                  <option value="">Not said yet</option>
                  {COUNTRY_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                </select>
              </Field>

              <Field label="State, province or region" why="Records a regional curriculum or board that differs from the national one.">
                <input type="text" value={draft.region ?? ""} onChange={(e) => set("region", e.target.value || undefined)} placeholder="e.g. Lagos State" />
              </Field>

              <Field label="School type" why="Records what the school can rely on; it does not change the content.">
                <select value={draft.schoolType ?? ""} onChange={(e) => set("schoolType", (e.target.value || undefined) as SchoolType | undefined)}>
                  <option value="">Not said yet</option>
                  {SCHOOL_TYPES.map((s) => <option key={s} value={s}>{SCHOOL_LABEL[s]}</option>)}
                </select>
              </Field>

              <Field label="Year or class group" why="Names the group being taught, in your system's own words.">
                <input type="text" value={draft.stage ?? ""} onChange={(e) => set("stage", e.target.value || undefined)} placeholder="e.g. Year 9" />
              </Field>

              <Field label="Electricity" why="Decides whether a projector or a charged device can be assumed.">
                <select value={draft.power ?? ""} onChange={(e) => set("power", (e.target.value || undefined) as Connectivity | undefined)}>
                  <option value="">Not said yet</option>
                  {CONNECTIVITY.map((c) => <option key={c} value={c}>{NET_LABEL[c]}</option>)}
                </select>
              </Field>

              <Field label="What the room has" why="Decides whether the lesson can print, project or use apparatus.">
                <div>
                  {MATERIALS.map((m) => (
                    <Chip key={m} on={draft.materials.includes(m)} onClick={() => toggleIn("materials", m)}>{MATERIAL_LABEL[m]}</Chip>
                  ))}
                </div>
              </Field>

              <Field label="Pupils who need a different delivery" why="Each one adds a change to how the lesson is delivered. It is never a label on a pupil.">
                <div>
                  {ACCESS_NEEDS.map((a) => (
                    <Chip key={a} on={draft.access.includes(a)} onClick={() => toggleIn("access", a)}>{ACCESS_LABEL[a]}</Chip>
                  ))}
                </div>
              </Field>

              <Field label="More than one year group in the class?" why="One prompt, different expectations, rather than three unrelated tasks.">
                <Chip on={draft.mixedAge === true} onClick={() => set("mixedAge", draft.mixedAge === true ? false : true)}>
                  {draft.mixedAge === true ? "Yes, mixed-age" : "No, one year group"}
                </Chip>
              </Field>
            </div>

            <Field label="Your own curriculum or objectives" why="For a curriculum the registry does not hold. It is recorded as yours, and never claimed as a national mapping.">
              <input
                type="text"
                value={draft.customCurriculum ?? ""}
                onChange={(e) => set("customCurriculum", e.target.value || undefined)}
                placeholder="e.g. Diocesan science scheme, Unit 4: forces"
                style={{ width: "100%" }}
              />
            </Field>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
          <button className="btn" onClick={() => void saveClassroom()} disabled={busy || !classroomDeclared(draft)}>
            {busy ? "Saving…" : "Save my classroom"}
          </button>
          {saved === "profile" && <span className="small muted">Saved. You can change any of this later.</span>}
          {!classroomDeclared(draft) && <span className="small muted">Answer at least one question to save.</span>}
        </div>

        {ready && (
          <div className="note" style={{ marginTop: 14 }}>
            <b>How this room runs a lesson</b>
            <p style={{ margin: "6px 0 4px" }}>
              <strong>{DELIVERY[plan.delivery]}</strong>
              {plan.adaptations.length > 0 && (
                <> · also adapted for {plan.adaptations.map((a) => classroomContext(a).label.toLowerCase()).join(", ")}</>
              )}
              {plan.groupSize !== null && <> · groups of about {plan.groupSize}</>}
            </p>
            <ul className="small" style={{ margin: "6px 0 6px 18px", padding: 0 }}>
              <li>{plan.evidence.sentence}</li>
              {plan.constraints.map((c) => <li key={c}>{c}</li>)}
              {plan.languageSupport.map((c) => <li key={c}>{c}</li>)}
            </ul>
            {plan.assumed.length > 0 && (
              <p className="small muted" style={{ margin: "6px 0 0" }}>
                Not declared, so this plan does not assume it: {plan.assumed.join(", ")}. You can still teach; the plan
                says what it left out rather than guessing.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── 2 · WHAT TO TEACH ─────────────────────────────────────────────── */}
      <section className="card" style={{ marginTop: 16 }} aria-labelledby="lesson-heading">
        <p className="eyebrow" style={{ marginTop: 0 }}><span className="no">2</span> What will you teach?</p>
        <h2 id="lesson-heading" className="section" style={{ marginTop: 4 }}>
          {selected?.specificationId ? "This class's course" : "This class's subject"}
        </h2>
        <p className="small muted" style={{ marginTop: 0 }}>
          {conceptIds.length} concepts{selected?.specificationId ? " in the course this class declared" : " in the subject this class declared"}.
          A lesson marked “full plan” teaches in sequence; one without it still has objectives, a worked example and questions,
          and the page will say what it does not have.
        </p>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Find a concept…"
          aria-label="Find a concept"
          style={{ width: "100%", marginBottom: 10 }}
        />
        <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
          {shown.map((id) => {
            const plan = planFor(id);
            const on = focus === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => void chooseConcept(id)}
                aria-pressed={on}
                className={`chip ${on ? "warn" : ""}`}
                style={{ marginRight: 6, marginBottom: 6 }}
                title={plan ? "Full authored plan" : "Authored lesson without a written plan"}
              >
                {ctitle(lang, id)}{plan ? " · full plan" : ""}
              </button>
            );
          })}
          {shown.length === 0 && <p className="small muted" style={{ margin: 0 }}>No concept matches “{filter}”.</p>}
        </div>
        {saved === "lesson" && <p className="small muted">Saved: this is the lesson you are preparing.</p>}
      </section>

      {/* ── 3 · YOUR RUN SHEET ────────────────────────────────────────────── */}
      <section className="card" style={{ marginTop: 16 }} aria-labelledby="run-heading">
        <p className="eyebrow" style={{ marginTop: 0 }}><span className="no">3</span> Your run sheet</p>
        <h2 id="run-heading" className="section" style={{ marginTop: 4 }}>
          {focus ? ctitle(lang, focus) : "Choose a lesson above"}
        </h2>

        {!focus && (
          <p className="muted small" style={{ marginBottom: 0 }}>
            Pick one concept and this becomes a lesson plan for the room you described: what to print, what to present,
            how to check understanding, and what to do when it has not landed.
          </p>
        )}

        {focus && (
          <>
            <div className="note" style={{ marginBottom: 12 }}>
              <b>{DELIVERY[plan.delivery]}</b>
              <p className="small" style={{ margin: "4px 0" }}>{plan.evidence.sentence}</p>
              <p className="small muted" style={{ margin: 0 }}>
                {plan.printer
                  ? "Print the worksheet before the lesson; the answer key stays with you."
                  : "No printer declared: teach from the board and the on-screen prompts, and pupils write in their books."}
                {plan.projector ? " The projector can carry the diagrams." : ""}
              </p>
            </div>

            {focusPlan ? (
              <>
                <p className="eyebrow" style={{ marginTop: 0 }}>Objective</p>
                <p style={{ marginTop: 0 }}>{focusPlan.objective}</p>
                {focusPlan.traps.length > 0 && (
                  <>
                    <p className="eyebrow">What to watch for</p>
                    <ul className="small" style={{ margin: "0 0 10px 18px", padding: 0 }}>
                      {focusPlan.traps.slice(0, 3).map((trap) => (
                        <li key={trap.move} style={{ marginBottom: 6 }}>
                          <b>{trap.move}</b> — {trap.why}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="small muted">
                  Plan review: <b>{focusPlan.review}</b> — printed with the lesson, because “authored” is not “checked by a teacher”.
                </p>
              </>
            ) : (
              <p className="note small">
                This concept has an authored lesson but no written teaching plan yet. The guide below still has its
                objectives, explanation, worked example and questions, and it says what it does not have.
              </p>
            )}

            <p className="eyebrow">Teach it</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link className="btn" href={`/teach/${subject}/${focus}?context=${plan.contextId}`}>Present to the class</Link>
              <Link className="btn secondary" href={`/print/${subject}/${focus}/guide?context=${plan.contextId}`}>Teacher guide (print)</Link>
              <Link className="btn ghost" href={`/print/${subject}/${focus}`}>Pupil worksheet</Link>
              <Link className="btn ghost" href={`/print/${subject}/${focus}/key`}>Answer key</Link>
              <Link className="btn ghost" href={`/learn/${subject}/${focus}`}>Open the pupil lesson</Link>
            </div>
            <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>
              The worksheet carries no answers and needs no account. The key and the guide are teacher-only. After the
              lesson, the class&apos;s evidence tab says who understood — and an empty answer is not treated as a wrong one.
            </p>
          </>
        )}
      </section>

      <p className="small muted" style={{ margin: "18px 0 40px" }}>
        <Link href={classId ? `/teacher#class-${classId}` : "/teacher"}>← Back to the class</Link>
        {" · "}
        <Link href="/print">All printable lessons</Link>
        {" · "}
        <Link href="/kiosk">Shared-device sign-in</Link>
      </p>
    </main>
  );
}
