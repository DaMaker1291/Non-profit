"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Your curriculum (§1, §2, §4, §9). The student picks the qualification and
// tier they actually sit — AQA GCSE Foundation, CBSE Class 10, KCSE Form 4,
// Digital SAT — and sees, honestly:
//   · how much of the genome their course contains (and what it does not)
//   · how deep practice will pitch, because the tier chooses the difficulty band
//   · the words their own curriculum uses for the same ideas
//
// Everything on this page is derived from lib/specifications.ts, resolved
// against the real genome. No coverage claim here can name a concept the
// platform cannot teach.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import Link from "next/link";
import { loadLocalProfileId, loadLocalProfileSecret, useI18n, useProfile } from "@/lib/client";
import { curriculumFor } from "@/lib/curriculum";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { ctitle } from "@/lib/content-i18n";
import type { ProfileState, SubjectId } from "@/lib/types";
import {
  SPECIFICATIONS,
  coverageReport,
  incompleteSubjects,
  levelForGrade,
  levelOf,
  specForProfile,
  specById,
  specOptionsFor,
  termsFor,
  type ActiveSpec,
} from "@/lib/specifications";

export default function CurriculumPage() {
  const { t, lang } = useI18n();
  const { state, loading, set } = useProfile();
  const profile = state?.profile;

  const [specId, setSpecId] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // WHICH SUBJECT'S COURSE is being edited. A learner sits GCSE Maths (Higher)
  // and A-Level Physics at the same time, so "your course" is not one thing and
  // this page must not pretend it is.
  const [picked, setPicked] = useState<SubjectId | null>(null);

  const country = profile?.country ?? "XX";
  const declared = profile?.subjects?.length ? profile.subjects : SUBJECT_IDS;
  const subject: SubjectId = picked && declared.includes(picked) ? picked : declared[0];
  // Only the qualifications that actually contain THIS subject — offering a
  // maths-only paper as a Biology course would be a choice that cannot be saved.
  const choices = useMemo(() => specOptionsFor(country, subject), [country, subject]);
  const active: ActiveSpec = useMemo(() => {
    if (specId) {
      const spec = specById(specId) ?? choices[0];
      const level = levelOf(spec, levelId ?? undefined) ?? levelForGrade(spec, profile?.grade) ?? spec.levels[0];
      return { spec, level };
    }
    return specForProfile(profile ?? {}, subject);
  }, [specId, levelId, choices, profile, subject]);
  const gaps = useMemo(() => incompleteSubjects(profile ?? {}), [profile]);

  const report = useMemo(() => coverageReport(active), [active]);
  const route = curriculumFor(country);
  const terms = termsFor(active.spec.board);
  const inSpec = report.covered;

  async function save() {
    const id = loadLocalProfileId();
    if (!id) return;
    // Written to THIS subject's course. /api/profile mirrors the learner's first
    // subject into the flat fields, so single-course readers stay true.
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        secret: loadLocalProfileSecret(),
        subjectCourses: { [subject]: { spec: active.spec.id, specLevel: active.level.id } },
      }),
    });
    setSpecId(null);
    setLevelId(null);
    const res = await fetch(`/api/progress?id=${id}&secret=${loadLocalProfileSecret()}`);
    if (res.ok) set((await res.json()) as ProfileState);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <main className="container narrow" style={{ paddingTop: 44 }}>
        <p className="muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        <p className="eyebrow"><span className="no">§</span> {t("curr.title")}</p>
        <h1 className="visually-small">{t("curr.title")}</h1>
        <p className="lead">{t("curr.noProfile")}</p>
        <div className="actions">
          <Link href="/onboarding" className="btn">{t("onb.start")} →</Link>
          <Link href="/learn" className="btn ghost">{t("nav.subjects")}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">§</span> {t("curr.title")}</p>
      <h1 className="visually-small">{t("curr.title")}</h1>
      <p className="lead">{t("curr.sub")}</p>

      {/* What the country's system looks like, and which course is in force. */}
      <section className="card soft" style={{ padding: 20, marginBottom: 18 }}>
        <p className="small muted" style={{ margin: 0 }}>
          {/* A country with no mapped route still gets the international and
              independent pathways (specsFor falls back) — say so, rather than
              printing a bare ISO code like "DO". */}
          {route ? route.system : t("curr.unmapped")} {profile.grade ? ` · ${profile.grade}` : ""}
        </p>
        {/* One course per subject. The chips say which subjects have one — a
            subject still missing its course is named, never silently defaulted. */}
        <div className="checks" style={{ flexWrap: "wrap", marginTop: 10 }}>
          {declared.map((s) => {
            const gap = gaps.find((g) => g.subject === s);
            return (
              <button
                key={s}
                type="button"
                className={`chip ${s === subject ? "on" : ""}`}
                onClick={() => { setPicked(s); setSpecId(null); setLevelId(null); }}
                style={{ cursor: "pointer", border: s === subject ? "1px solid var(--line)" : undefined }}
                title={gap ? t("onb.courseNeed") : undefined}
              >
                {gap ? "⚠ " : "✓ "}{t(SUBJECT_LABELS[s] as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          <strong>{t(SUBJECT_LABELS[subject])}</strong> · {t("curr.course")}
        </p>
        <div className="rowline" style={{ marginTop: 10, display: "block" }}>
          <label className="small muted" htmlFor="curr-spec">{t("curr.course")}</label>
          <select
            id="curr-spec"
            className="mono"
            style={{ width: "100%", marginTop: 6 }}
            value={active.spec.id}
            onChange={(e) => { setSpecId(e.target.value); setLevelId(null); }}
          >
            {choices.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="rowline" style={{ marginTop: 12, display: "block" }}>
          <label className="small muted" htmlFor="curr-level">{t("curr.level")}</label>
          <select
            id="curr-level"
            className="mono"
            style={{ width: "100%", marginTop: 6 }}
            value={active.level.id}
            onChange={(e) => setLevelId(e.target.value)}
          >
            {active.spec.levels.map((l) => (
              <option key={l.id} value={l.id}>
                {t(`lvl.${l.tier}`)}{l.name ? ` · ${l.name}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn" onClick={save}>{saved ? t("curr.saved") : t("curr.save")}</button>
        </div>
      </section>

      {/* Honest coverage: what the course contains, out of the whole map. */}
      <section className="card" style={{ padding: 20, marginBottom: 18 }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="no">1</span> {t("curr.covered")}</p>
        <p className="stat" style={{ margin: "6px 0 2px" }}>
          {inSpec} <span className="small muted">{t("curr.ofGenome")} {report.genomeTotal}</span>
        </p>
        <p className="small muted" style={{ marginTop: 0 }}>{t("curr.coveredNote")}</p>
        <div style={{ display: "grid", gap: 8 }}>
          {SUBJECT_IDS.map((s) => {
            const n = report.bySubject[s] ?? 0;
            if (n === 0) return null;
            return (
              <Link key={s} href={`/learn/${s}`} className="rowline">
                <span className="grow">{t(SUBJECT_LABELS[s])}</span>
                <span className="mono">{n}</span>
              </Link>
            );
          })}
        </div>
        {report.outside.length > 0 && (
          <p className="small muted" style={{ marginBottom: 0 }}>
            {t("curr.outside")}: {report.outside.slice(0, 6).map((c) => ctitle(lang, c.id)).join(" · ")}
            {report.outside.length > 6 ? " …" : ""} — {t("curr.outsideNote")}{" "}
            <Link href="/genome">{t("curr.wholeMap")}</Link>
          </p>
        )}
      </section>

      {/* The tier chooses the depth, which is what makes Foundation and Higher
          genuinely different work rather than a label. */}
      <section className="card soft" style={{ padding: 20, marginBottom: 18 }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="no">2</span> {t("curr.depth")}</p>
        <p className="small" style={{ margin: "6px 0 0" }}>
          {t("curr.depthNote")} <span className="mono">{Math.round(active.level.difficulty * 100)}%</span>
        </p>
      </section>

      {/* Same idea, the student's own words (§4). */}
      {terms.length > 0 && (
        <section className="card" style={{ padding: 20, marginBottom: 18 }}>
          <p className="eyebrow" style={{ margin: 0 }}><span className="no">3</span> {t("curr.terms")}</p>
          <p className="small muted" style={{ marginTop: 6 }}>{t("curr.termsNote")}</p>
          <div style={{ display: "grid", gap: 6 }}>
            {terms.map((x) => (
              <p key={x.from} className="small" style={{ margin: 0 }}>
                <span className="mono muted">{x.from}</span> → <strong>{x.to}</strong>
              </p>
            ))}
          </div>
        </section>
      )}

      <div className="actions">
        <Link href="/learn" className="btn">{t("curr.start")} →</Link>
        <Link href="/access" className="btn ghost">{t("curr.change")}</Link>
      </div>
      <p className="small muted">
        {SPECIFICATIONS.length} {t("curr.specsNote")}
      </p>
    </main>
  );
}
