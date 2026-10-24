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
import { useRouter } from "next/navigation";
import { safeReturnPath } from "@/lib/app-state";
import { loadLocalProfileId, useI18n, useProfile } from "@/lib/client";
import * as api from "@/lib/api/client";
import { curriculumFor, routeForPathwayId, INDEPENDENT_ROUTE } from "@/lib/curriculum";
import {
  defaultPathwayFor, initialPathwayFor, mappingReviewKey, nationalPathwaysFor, pathwayChoices, pathwayForCountry,
} from "@/lib/curricula/registry";
import { mappingCitation, mappingForSpec } from "@/lib/curricula/mappings";
// THE NAME OF A MISSING PART OF A COURSE HAS ONE OWNER. Home's card, and this
// screen now that the course is chosen here rather than in the wizard, both say
// which field is missing — and a learner who reads "Tier" on one and "Level" on
// the other is being sent to fix two different things that are the same thing.
import { FIELD_LABEL } from "@/components/course-first";
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
  // A REFUSED SAVE HAS TO SAY SOMETHING. It used to `catch { return; }` — the
  // learner pressed Save, nothing moved, nothing was said, and the screen went on
  // describing the course they had just chosen, which is indistinguishable from
  // a dead button. Measured on this very page: a tier change POSTed a pathway the
  // learner never chose, the server answered `400
  // pathway_does_not_offer_int-igcse`, and the whole interaction was silent.
  const [saveError, setSaveError] = useState<{ message: string; code: string } | null>(null);
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
  // The country's route, read HERE because the save gate below needs to know
  // which year groups exist. `courseGaps` treats a year group as part of the
  // course, so Save must not write a course that the gate which sends learners
  // here still calls incomplete — that is a loop (this screen says "saved", Home
  // says "needs: year group") and the same class of defect as the tier gate
  // beside it.
  // The same fallback the course gate uses: a country this product does not
  // model still has the independent pathway, and it still has grades to choose
  // from. Without it the grade control here was a placeholder with an empty
  // list — a course that could never be completed for 53 of the 70 countries.
  const route = routeForPathwayId(country, pathway) ?? curriculumFor(country) ?? INDEPENDENT_ROUTE;
  // Only the qualifications that actually contain THIS subject — offering a
  // maths-only paper as a Biology course would be a choice that cannot be saved —
  // AND only those the chosen education system leads to.
  const baseChoices = useMemo(
    () => specOptionsFor(country, subject, pathway || undefined),
    [country, subject, pathway],
  );
  // ── A COURSE ALREADY ON THE PROFILE IS AN ANSWER, TOO ───────────────────
  //
  // `needsSpec` has always treated a stored qualification as the learner's own
  // choice. The tier beside it did not: it counted only `levelId` — the select's
  // own value, which is EMPTY until the control is touched — plus a year group
  // that happens to map to a tier. So a learner whose course was already saved as
  // "Cambridge IGCSE · Extended" opened this page to a tier select reading
  // "Choose a tier", a disabled Save and "⚠ Still to choose: Level" over a
  // course they had chosen, on every visit. That is the report "I inputted level
  // but it wouldn't work", and it is literally true: the page forgot who
  // answered.
  //
  // The stored tier therefore counts exactly as the stored qualification does,
  // and only while the qualification is untouched (`!specId`). Choosing a
  // DIFFERENT qualification is a new course, and its tier is asked for again —
  // the never-seeded rule this block exists to protect.
  //
  // The order is the learner's answers, most explicit first: what they picked on
  // this screen → the tier stored for this qualification → the tier their year
  // group sits → nothing, in which case the select asks and Save waits.
  const storedCourse = profile?.subjectCourses?.[subject];
  const hasStoredCourse = Boolean(storedCourse?.spec && storedCourse?.specLevel);
  // AN UNCHOSEN QUALIFICATION HAS TO BE EXPRESSIBLE. The select is driven by the
  // RESOLVED course, so when the fallback for this country happens to be the one
  // the learner wants, choosing it fired no `change` at all — the page went on
  // saying "still to choose: qualification" above a box that already showed it,
  // and Save stayed dead. Null until touched (or a stored course), so the empty
  // option is a prompt and picking the fallback is a real choice.
  const needsSpec = !specId && !hasStoredCourse;
  const chosenSpec = specId
    ? (specById(specId) ?? baseChoices[0] ?? null)
    : hasStoredCourse ? (specById(storedCourse!.spec!) ?? null) : null;
  const pickedLevel = chosenSpec ? levelOf(chosenSpec, levelId ?? undefined) : null;
  const storedLevel = chosenSpec && !specId ? levelOf(chosenSpec, storedCourse?.specLevel) : null;
  const gradeLevel = chosenSpec ? levelForGrade(chosenSpec, profile?.grade ?? "") : null;
  const levelAnswer = pickedLevel ?? storedLevel ?? gradeLevel;
  const chosenLevel = levelAnswer ?? chosenSpec?.levels[0] ?? null;
  const needsLevel = Boolean(chosenSpec) && chosenSpec!.levels.length > 1 && !levelAnswer;
  // THE YEAR GROUP IS PART OF THE COURSE (`courseGaps` says so), so it is part of
  // this gate too. It was not: a learner could answer the qualification and the
  // tier, press Save, read "Saved ✓" — and Home would still say "needs: year
  // group", with nothing on this screen having asked. Named in the same sentence
  // as the other gaps, in the order a learner answers them.
  const needsGrade = route.grades.length > 0 && !route.grades.includes(grade);
  const missingField: "spec" | "specLevel" | "grade" = !chosenSpec ? "spec" : needsLevel ? "specLevel" : "grade";
  const canSave = Boolean(chosenSpec) && !needsLevel && !needsGrade;
  // ── THE SELECTION IS THE COURSE, IN BOTH HALVES ─────────────────────────
  //
  // This page chooses two things — WHICH qualification, at WHICH tier — and both
  // must reach `active`, the value the coverage panel, the depth line and Save
  // all read.
  //
  // It used to read `if (specId)`: the qualification select first, and the tier
  // only then. A learner whose course is already stored FILLS that select, so
  // changing ONLY the tier took the other branch — the control snapped back to
  // the stored tier (its value came from `active.level`) and Save wrote that same
  // tier again. Measured on a scratch store: choosing "Foundation · Core" over a
  // stored "Extended" left the select reading "Extended", and the save wrote
  // `extended`. A screen that accepts an answer and discards it is worse than one
  // that refuses it.
  //
  // A tier is still CHOSEN, never seeded: when nothing has answered it, `chosenLevel`
  // falls back to `levels[0]` for DISPLAY only, `needsLevel` is true, the select
  // shows its prompt and Save refuses — the behaviour the assertion in
  // `npm run verify` pins.
  const active: ActiveSpec = useMemo(() => {
    if (chosenSpec && chosenLevel) return { spec: chosenSpec, level: chosenLevel };
    // Nothing chosen yet — this is the DISPLAY course (the coverage panel must
    // say something). The pathway the learner picked in THIS session is part of
    // the course it resolves, or the page would keep resolving a course from the
    // system they just moved away from.
    return specForProfile({ ...(profile ?? {}), pathway: pathway || undefined }, subject);
  }, [chosenSpec, chosenLevel, profile, subject, pathway]);
  // The mapping the ACTIVE COURSE has, if one has been written — the evidence under
  // the status sentence above, and the only thing allowed to put a document's name
  // beside a course. Read AFTER `active`, because it is derived from it.
  const mapping = mappingForSpec(active.spec.id);
  // A PICKER MUST NEVER HIDE THE COURSE IN FORCE. A learner whose stored
  // qualification belongs to a pathway the select is not scoping to — a UK
  // learner on Cambridge IGCSE, which the live store holds — would otherwise see
  // a list that does not contain their own course, and the control would display
  // somebody else's. It stays at the top of the list until they change it.
  const choices = useMemo(
    () => (baseChoices.some((s) => s.id === active.spec.id) ? baseChoices : [active.spec, ...baseChoices]),
    [baseChoices, active.spec],
  );
  // A course is saved only when it is theirs — an explicit choice here, or a
  // COMPLETE course already on the profile (the rule the block above this memo
  // spells out).
  const gaps = useMemo(() => incompleteSubjects(profile ?? {}), [profile]);

  // THE TICKET THIS PAGE WAS OPENED WITH, if the guard sent the learner here
  // because a course is required. Read from the URL in the save handler rather
  // than through `useSearchParams`, which would put this whole page behind a
  // Suspense boundary for one string that is only needed after a click.
  const router = useRouter();
  const report = useMemo(() => coverageReport(active), [active]);
  const terms = termsFor(active.spec.board);
  const inSpec = report.covered;

  async function save() {
    const id = loadLocalProfileId();
    if (!id || !canSave) return;
    // Written to THIS subject's course. /api/profile mirrors the learner's first
    // subject into the flat fields, so single-course readers stay true.
    //
    // THE SAVE'S OWN RESPONSE IS THE NEW PROFILE, and that is what the page
    // adopts. This used to POST the course and then read `/api/progress` and
    // store the result as if it were a profile — so a learner who had just set
    // "AQA GCSE Mathematics Higher" watched the page redraw from a payload that
    // never contained a profile, and their course looked unset again. One write,
    // one read, the thing that actually changed.
    // THE SYSTEM IS SENT ONLY WHEN IT IS THE LEARNER'S ANSWER.
    //
    // `pathway` above is the one in FORCE — for most countries a resolved
    // default, which exists so the lists can be scoped. Sending that back
    // declared a choice nobody had made. For a learner whose stored course
    // predates pathways (the live store holds one: a UK learner on Cambridge
    // IGCSE) the resolved UK system does not offer that qualification, so
    // changing ONLY the tier posted a pathway they never chose and the server
    // refused the entire course — `pathway_does_not_offer_int-igcse`, measured
    // here. The profile's own stored system is re-sent only if it already has
    // one; a country with a single system needs none, and asking the server to
    // enforce a system the learner never picked is how a real course gets
    // deleted by a rule about a choice that was never made.
    const declaredPathway = pathwayId ?? profile?.pathway ?? "";
    setSaveError(null);
    let fresh: ProfileState;
    try {
      fresh = await api.saveProfile({
        subjectCourses: { [subject]: { spec: active.spec.id, specLevel: active.level.id } },
        // Sent only when the learner actually chose one: an untouched select must
        // not write anything back, and `country` is validated as an ISO code
        // server-side (a blank one is simply ignored, never stored).
        ...(countryId ? { country: countryId } : {}),
        ...(grade ? { grade } : {}),
        // Changing the system server-side drops a course that belonged to the
        // old one, which is why the course is saved in the SAME request: the
        // learner ends this save with a course that belongs to the system they
        // chose.
        ...(declaredPathway ? { pathway: declaredPathway } : {}),
      }, id);
    } catch (e) {
      // Refused writes leave the selection alone: clearing it would look like a
      // save that did not happen, which is the one thing this screen must not do.
      // The reason is now on screen with the server's own code, because silence
      // is what made this look like a broken button.
      setSaveError({
        message: t("onb.errRefused"),
        code: e instanceof api.ApiError ? (e.code || `http_${e.status}`) : "unreachable",
      });
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
    // A COURSE NO LONGER KEEPS THE LEARNER HERE. When the guard sent them to this
    // screen (`?return=`), the save is the last thing standing between them and
    // the page they asked for, so honour the ticket. A learner who came to change
    // a course on purpose carried no ticket and stays where they are, with the
    // confirmation they expect.
    const wanted = safeReturnPath(new URLSearchParams(window.location.search).get("return"), "");
    if (wanted) router.push(wanted);
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
          {/* WHAT IT WAS MAPPED AGAINST, named. "Not yet reviewed" is an
              admission; a citation is something a specialist can audit, and a
              ministry's first question about any curriculum claim is "against
              which document?". The title, publisher and date are the
              document's own, untranslated on purpose: a citation that has been
              translated cannot be looked up. */}
          {mapping && (
            <p className="small muted" style={{ marginBottom: 0 }}>
              {t("course.mapSource")} {mappingCitation(mapping)}
              {mapping.source.verification === "portal" ? ` · ${t("course.mapPortal")}` : ""}
            </p>
          )}
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
            value={needsSpec ? "" : active.spec.id}
            onChange={(e) => { setSpecId(e.target.value); setLevelId(null); }}
          >
            {/* A prompt, not the fallback painted as an answer. */}
            {needsSpec && <option value="" disabled>{t("onb.pickSpec")}</option>}
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
            value={needsLevel ? "" : active.level.id}
            onChange={(e) => setLevelId(e.target.value)}
            // A TIER OF WHAT? With no qualification chosen there is no course to
            // pick a tier of, so the control is shown (its list is the resolved
            // course's, which is why it is not empty) but cannot be answered —
            // the alternative is a select that accepts a choice and drops it,
            // the exact defect this page just had one layer up.
            disabled={!chosenSpec}
          >
            {/* A prompt, not an answer: the first tier used to be painted as the
                learner's own choice. */}
            {needsLevel && <option value="" disabled>{t("onb.pickLevel")}</option>}
            {active.spec.levels.map((l) => (
              <option key={l.id} value={l.id}>
                {levelLabel(lang, l.tier, l.name)}
              </option>
            ))}
          </select>
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn" onClick={save} disabled={!canSave}>{saved ? t("curr.saved") : t("curr.save")}</button>
        </div>
        {saveError && (
          <p className="field-error" role="status">
            ⚠ {saveError.message} <span className="mono">{saveError.code}</span>
          </p>
        )}
        {!canSave && (
          <p className="field-error" role="status">
            ⚠ {fill(t("onb.needFields"), { fields: t(FIELD_LABEL[missingField] as Parameters<typeof t>[0]) })}
          </p>
        )}
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

      {/* WHERE "CONTINUE" GOES DEPENDS ON WHETHER ANYTHING HAS BEEN MEASURED.
          It was a hardcoded `/learn` for everybody, and measured live — a
          first-time learner on a phone chose KCSE Form 3 here, pressed
          "Continue learning", and landed on the concept picker: the baseline
          diagnostic the whole product is built on (onboarding → course →
          diagnostic → home) was silently skipped by the one button this screen
          offers, because `/learn` is allowed to an onboarded learner and the
          guard therefore had nothing to refuse. Every other door into the
          product insists on the measurement; this one has to as well, and it is
          the door a new learner reaches first. */}
      <div className="actions">
        <Link
          href={Object.keys(state?.diagnostics ?? {}).length > 0
            ? "/learn"
            : `/diagnostic/${profile?.subjects[0] ?? "maths"}`}
          className="btn"
        >{t("curr.start")} →</Link>
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
