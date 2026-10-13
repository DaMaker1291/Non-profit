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
import { loadLocalProfileId, useI18n, useProfile } from "@/lib/client";
import * as api from "@/lib/api/client";
import { curriculumFor, routeForPathwayId, INDEPENDENT_ROUTE } from "@/lib/curriculum";
import {
  defaultPathwayFor, initialPathwayFor, mappingReviewKey, nationalPathwaysFor, pathwayChoices, pathwayForCountry,
} from "@/lib/curricula/registry";
import { COUNTRIES, fill } from "@/lib/i18n";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { ctitle, levelLabel } from "@/lib/content-i18n";
import type { ProfileState, SubjectId } from "@/lib/types";
import {
  NATIONAL_ROUTE_COUNT,
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
  // TWO MORE PARTS OF THE SAME COURSE. `courseGaps` can report a missing country
  // or year group as well as a qualification or tier, and Home sends the learner
  // HERE for any of them — so this screen has to be able to set the ones it was
  // being asked about. It could not: it only read them. A learner who had chosen
  // their qualification but no year group was sent here, changed nothing, and
  // came back to the same card.
  const [countryId, setCountryId] = useState<string | null>(null);
  const [gradeId, setGradeId] = useState<string | null>(null);
  // WHICH EDUCATION SYSTEM (§7). This is the screen whose job is CHANGING a
  // course, so it is where the alternatives live: a UK learner at an
  // international school reaches IGCSE or the IB from here, and a Cameroonian
  // learner picks which of their country's two systems they follow. Null until
  // touched, so the field shows what is actually in force.
  const [pathwayId, setPathwayId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // WHICH SUBJECT'S COURSE is being edited. A learner sits GCSE Maths (Higher)
  // and A-Level Physics at the same time, so "your course" is not one thing and
  // this page must not pretend it is.
  const [picked, setPicked] = useState<SubjectId | null>(null);

  const country = countryId ?? profile?.country ?? "XX";
  // The pathway in force: the learner's own choice if they have one (and it is
  // one this country offers — a stored pathway from another country is stale,
  // not a choice), else the country's own system, else nothing at all, which is
  // the state a country we have not researched is in.
  const pathway = pathwayId ?? pathwayForCountry(country, profile?.pathway)?.id ?? initialPathwayFor(country);
  const grade = gradeId ?? profile?.grade ?? "";
  const declared = profile?.subjects?.length ? profile.subjects : SUBJECT_IDS;
  const subject: SubjectId = picked && declared.includes(picked) ? picked : declared[0];
  const noNationalRoute = nationalPathwaysFor(country).length === 0;
  const reviewKey = mappingReviewKey(pathwayForCountry(country, pathway) ?? defaultPathwayFor(country));
  // Only the qualifications that actually contain THIS subject — offering a
  // maths-only paper as a Biology course would be a choice that cannot be saved —
  // AND only those the chosen education system leads to.
  const baseChoices = useMemo(
    () => specOptionsFor(country, subject, pathway || undefined),
    [country, subject, pathway],
  );
  const active: ActiveSpec = useMemo(() => {
    if (specId) {
      const spec = specById(specId) ?? baseChoices[0];
      const level = levelOf(spec, levelId ?? undefined) ?? levelForGrade(spec, profile?.grade) ?? spec.levels[0];
      return { spec, level };
    }
    // The pathway the learner has picked in THIS session is part of the course
    // it resolves: otherwise the page would keep resolving a course from the
    // system they just moved away from.
    return specForProfile({ ...(profile ?? {}), pathway: pathway || undefined }, subject);
  }, [specId, levelId, baseChoices, profile, subject, pathway]);
  // A PICKER MUST NEVER HIDE THE COURSE IN FORCE. A learner whose stored
  // qualification belongs to a pathway the select is not scoping to — a UK
  // learner on Cambridge IGCSE, which the live store holds — would otherwise see
  // a list that does not contain their own course, and the control would display
  // somebody else's. It stays at the top of the list until they change it.
  const choices = useMemo(
    () => (baseChoices.some((s) => s.id === active.spec.id) ? baseChoices : [active.spec, ...baseChoices]),
    [baseChoices, active.spec],
  );
  const gaps = useMemo(() => incompleteSubjects(profile ?? {}), [profile]);

  const report = useMemo(() => coverageReport(active), [active]);
  // The same fallback the course gate uses: a country this product does not
  // model still has the independent pathway, and it still has grades to choose
  // from. Without it the grade control here was a placeholder with an empty
  // list — a course that could never be completed for 53 of the 70 countries.
  const route = routeForPathwayId(country, pathway) ?? curriculumFor(country) ?? INDEPENDENT_ROUTE;
  const terms = termsFor(active.spec.board);
  const inSpec = report.covered;

  async function save() {
    const id = loadLocalProfileId();
    if (!id) return;
    // Written to THIS subject's course. /api/profile mirrors the learner's first
    // subject into the flat fields, so single-course readers stay true.
    //
    // THE SAVE'S OWN RESPONSE IS THE NEW PROFILE, and that is what the page
    // adopts. This used to POST the course and then read `/api/progress` and
    // store the result as if it were a profile — so a learner who had just set
    // "AQA GCSE Mathematics Higher" watched the page redraw from a payload that
    // never contained a profile, and their course looked unset again. One write,
    // one read, the thing that actually changed.
    let fresh: ProfileState;
    try {
      fresh = await api.saveProfile({
        subjectCourses: { [subject]: { spec: active.spec.id, specLevel: active.level.id } },
        // Sent only when the learner actually chose one: an untouched select must
        // not write anything back, and `country` is validated as an ISO code
        // server-side (a blank one is simply ignored, never stored).
        ...(countryId ? { country: countryId } : {}),
        ...(grade ? { grade } : {}),
        // The education system, when one is in force. Changing it server-side
        // drops a course that belonged to the old system, which is why the
        // course is saved in the SAME request: the learner ends this save with a
        // course that belongs to the system they chose.
        ...(pathway ? { pathway } : {}),
      }, id);
    } catch {
      // Refused writes leave the selection alone: clearing it would look like a
      // save that did not happen, which is the one thing this screen must not do.
      return;
    }
    set(fresh);
    setSpecId(null);
    setLevelId(null);
    setCountryId(null);
    setGradeId(null);
    setPathwayId(null);
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
        <p className="eyebrow">{t("curr.title")}</p>
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
      <p className="eyebrow">{t("curr.title")}</p>
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
        {/* THE TWO PARTS OF A COURSE THIS SCREEN COULD ONLY READ. Same controls,
            same labels and the same "independent" empty option as the step that
            first asks for them, so a learner who skipped one in setup — or whose
            country's grades changed — can finish the course from the card Home
            sends them to. Changing the country clears the qualification, because
            a GCSE is not a course in Kenya. */}
        <div className="grid cols2" style={{ marginTop: 12 }}>
          <label className="field">
            <span>{t("onb.where")}</span>
            <select
              value={country}
              onChange={(e) => { setCountryId(e.target.value); setSpecId(null); setLevelId(null); }}
            >
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t("onb.grade")}</span>
            <select value={grade} onChange={(e) => setGradeId(e.target.value)}>
              <option value="">{t("onb.independent")}</option>
              {(route?.grades ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
        </div>
        {/* WHICH EDUCATION SYSTEM. The years above and the qualifications below
            are the pathway's, so this control is the one that explains why the
            list changed. Changing it clears the qualification selection, because
            a GCE O Level is not a Francophone course and an AQA GCSE is not an
            IGCSE — the server drops the stale one on save. */}
        <div className="rowline" style={{ marginTop: 12, display: "block" }}>
          <label className="small muted" htmlFor="curr-pathway">{t("onb.pathway")}</label>
          <select
            id="curr-pathway"
            className="mono"
            style={{ width: "100%", marginTop: 6 }}
            value={pathway}
            onChange={(e) => { setPathwayId(e.target.value); setSpecId(null); setLevelId(null); setGradeId(null); }}
          >
            <option value="">{t("onb.pickPathway")}</option>
            {pathwayChoices(country).map((pw) => (
              <option key={pw.id} value={pw.id}>{pw.name}</option>
            ))}
          </select>
          {noNationalRoute && <p className="small muted" style={{ marginBottom: 0 }}>{t("curr.unmapped")}</p>}
          {/* HOW FAR THE MAPPING HAS BEEN CHECKED. The page states how much of
              the genome the course contains and how deep practice will pitch;
              this is the third fact of the same kind, and the one that used to
              be missing — every course looked equally authoritative while none
              of the mappings had been read by a specialist. */}
          {reviewKey && <p className="small muted" style={{ marginBottom: 0 }}>{t(reviewKey as Parameters<typeof t>[0])}</p>}
        </div>
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
                {levelLabel(lang, l.tier, l.name)}
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
      {/* The number comes FROM THE DATA, not from the sentence, and it counts
          countries rather than courses. It used to be `SPECIFICATIONS.length`
          — 25, which is a count of COURSES — printed in front of a dictionary
          string that said "courses from 20 countries", so the line was wrong
          twice: the sentence counted the international and independent
          pseudo-countries as countries, and the prefix counted courses. Six of
          the fifteen languages take their number from this prefix and read
          "25 countries". */}
      <p className="small muted">
        {fill(t("curr.specsNote"), { n: NATIONAL_ROUTE_COUNT })}
      </p>
    </main>
  );
}
