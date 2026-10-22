"use client";

// MY LEARNING ACCESS (§access-profile): one place for how OpenMind teaches
// you — languages, teaching style, reading, voice, connectivity, materials.
// Everything here applies instantly; nothing here leaves your device except
// what you explicitly save to your profile.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAccess } from "@/components/access-provider";
import { useI18n, useLearnLangs, useProfile, loadLocalProfileId } from "@/lib/client";
import * as api from "@/lib/api/client";
import { LANGS } from "@/lib/i18n";
import LangQuick from "@/components/lang-quick";
import { queueLength } from "@/lib/sync-queue";
import { isContinuityMode, setContinuityMode } from "@/lib/curriculum";
import { RESOURCE_OPTIONS } from "@/lib/resources";
import { CULTURES, cultureLabel } from "@/lib/culture";

export default function AccessPage() {
  const { prefs, set } = useAccess();
  const { t, lang, setLang } = useI18n();
  const { state } = useProfile();
  const [pending, setPending] = useState(0);
  const [continuity, setCont] = useState(false);
  const [terms, setTerms] = useState<"local" | "mixed">(state?.profile.termsMode ?? "mixed");
  const [explainLen, setExplainLen] = useState<"short" | "full">(state?.profile.explainLen ?? "full");
  const [resources, setResources] = useState<string[]>(state?.profile.resources ?? []);
  const [board, setBoard] = useState(state?.profile.board ?? "");
  const [exam, setExam] = useState(state?.profile.exam ?? "");
  const [learningStyle, setLearningStyle] = useState(state?.profile.learningStyle ?? "");
  // THE SETTING EXAMPLES ARE SET IN. Enrolment used to ask this beside the year
  // group, which made a sign-up carry one more question than it needed; the
  // answer is a preference about how the teaching reads, so it lives with the
  // other preferences. The list comes from its ONE owner (lib/culture.ts), whose
  // ids are the ones `exampleFor` can resolve — a second hand-written list is how
  // the form once offered two ids the engine could not read.
  const [examples, setExamples] = useState(state?.profile.examples ?? "neutral");
  const [saved, setSaved] = useState(false);

  // ── A CLICK MADE WHILE THE PROFILE IS STILL LOADING MUST NOT BE UNDONE ────
  //
  // The effect below seeds these controls from the profile. It re-runs whenever
  // `state` arrives or is refetched, and it used to OVERWRITE whatever the
  // learner had chosen in the meantime: measured in `npm run verify:ui`, the
  // walk pressed "Local terms only" and pressed Save, and the stored value was
  // `mixed` — the default — because the fetch that landed in between put the
  // untouched value back over the choice. A preference the learner set and the
  // screen then abandoned for them is the same defect as a course seeded from
  // `levels[0]`, one layer quieter. Once anything here is touched, the server's
  // copy is no longer allowed to answer for it.
  const touched = useRef(false);
  /** Mark the learner's choice, then make it. Every control on this screen uses
   *  this so the effect's seeding cannot answer over a real answer. */
  const choose = (apply: () => void) => () => {
    touched.current = true;
    apply();
  };
  useEffect(() => {
    setPending(queueLength());
    setCont(isContinuityMode());
    if (state && !touched.current) {
      setTerms(state.profile.termsMode ?? "mixed");
      setExplainLen(state.profile.explainLen ?? "full");
      setResources(state.profile.resources ?? []);
      setExamples(state.profile.examples ?? "neutral");
    }
  }, [state]);

  async function save() {
    const id = loadLocalProfileId();
    if (!id) return;
    try {
      await api.saveProfile({ termsMode: terms, explainLen, resources, board, exam, learningStyle, examples }, id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // The badge is a claim the learner can check, so a write that was refused
      // must not earn it — and the selections stay on screen for a retry rather
      // than being cleared as though they had been stored.
    }
  }

  const Toggle = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button className={`btn small ${on ? "" : "ghost"}`} aria-pressed={on} onClick={onClick} style={{ justifyContent: "flex-start" }}>
      {on ? "✓ " : ""}{label}
    </button>
  );

  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">♿</span> {t("acc.eyebrow")}</p>
      <h1>{t("acc.title")}</h1>
      <p className="lead">{t("acc.lead")}</p>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ margin: 0 }}>🌐 {t("acc.language")}</p>
        {/* Interface language is configuration and lives here, with the rest of
            the settings — it must not compete with learning decisions on Home. */}
        <label className="field" style={{ maxWidth: 260 }}>
          <span>{t("lq.interface")}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
          </select>
        </label>
        <LangQuick profileLang={state?.profile.language} />
        <label className="field" style={{ maxWidth: 320, marginTop: 10 }}>
          <span>{t("onb.examples")}</span>
          <select value={examples} onChange={(e) => choose(() => setExamples(e.target.value))()}>
            {CULTURES.map((c) => <option key={c.id} value={c.id}>{t(cultureLabel(c.id))}</option>)}
          </select>
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button className={`btn small ${terms === "mixed" ? "" : "ghost"}`} onClick={choose(() => setTerms("mixed"))}>{t("acc.termsMixed")}</button>
          <button className={`btn small ${terms === "local" ? "" : "ghost"}`} onClick={choose(() => setTerms("local"))}>{t("acc.termsLocal")}</button>
          <button className={`btn small ${explainLen === "full" ? "" : "ghost"}`} onClick={choose(() => setExplainLen("full"))}>{t("acc.fullExplain")}</button>
          <button className={`btn small ${explainLen === "short" ? "" : "ghost"}`} onClick={choose(() => setExplainLen("short"))}>{t("acc.shortExplain")}</button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ margin: 0 }}>🔊 {t("acc.readingVoice")}</p>
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <Toggle on={prefs.readAloud} label={`🔊 ${t("acc.readAloud")}`} onClick={() => set({ readAloud: !prefs.readAloud })} />
          <Toggle on={prefs.preferSpeech} label={`🎙 ${t("acc.preferSpeech")}`} onClick={() => set({ preferSpeech: !prefs.preferSpeech })} />
          <Toggle on={prefs.largeText} label={`👁 ${t("acc.largeText")}`} onClick={() => set({ largeText: !prefs.largeText })} />
          <Toggle on={prefs.highContrast} label={`🎨 ${t("acc.highContrast")}`} onClick={() => set({ highContrast: !prefs.highContrast })} />
          <Toggle on={prefs.reduceMotion} label={`🧠 ${t("acc.calmScreen")}`} onClick={() => set({ reduceMotion: !prefs.reduceMotion })} />
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ margin: 0 }}>📴 {t("acc.connectivity")}</p>
        <p className="small muted">{pending === 0 ? t("acc.syncedAll") : `🟡 ${pending} ${t("acc.pendingSync")}`} <Link href="/offline">{t("acc.offlinePlan")} →</Link></p>
        <Toggle on={continuity} label={t("acc.continuity")} onClick={() => { const n = !continuity; setContinuityMode(n); setCont(n); }} />
      </section>

       <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ margin: 0 }}>{t("acc.have")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {RESOURCE_OPTIONS.map((r) => (
            <button key={r.id} className={`btn small ${resources.includes(r.id) ? "" : "ghost"}`} aria-pressed={resources.includes(r.id)} onClick={choose(() => setResources((prev) => prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id]))}>{t(r.label)}</button>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ margin: 0 }}>📚 {t("acc.boardExam")}</p>
        <p className="small muted">{t("acc.boardNote")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {[["cbse", "acc.b.cbse"], ["icse", "acc.b.icse"], ["igcse", "acc.b.igcse"], ["state", "acc.b.state"], ["matric", "acc.b.matric"], ["nigerian", "acc.b.nigerian"], ["kenyan", "acc.b.kenyan"], ["philippine", "acc.b.philippine"], ["bangladeshi", "acc.b.bangladeshi"], ["indonesian", "acc.b.indonesian"], ["brazilian", "acc.b.brazilian"], ["mexican", "acc.b.mexican"]].map(([id, key]) => (
            <button key={id} className={`btn small ${board === id ? "" : "ghost"}`} onClick={choose(() => setBoard((b) => b === id ? "" : id))}>{t(key)}</button>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <label className="small muted" htmlFor="exam-input">{t("acc.examLabel")}</label>
          <input id="exam-input" className="input" style={{ width: "100%", marginTop: 4 }} value={exam} onChange={(e) => choose(() => setExam(e.target.value.slice(0, 40)))()} placeholder={t("acc.examPh")} />
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ margin: 0 }}>🧠 {t("onb.learningStyle")}</p>
        <p className="small muted">{t("acc.howTeachNote")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {[["visual", "ls.visual"], ["auditory", "ls.auditory"], ["kinesthetic", "ls.kinesthetic"], ["reading-writing", "ls.reading"]].map(([id, label]) => (
            <button key={id} className={`btn small ${learningStyle === id ? "" : "ghost"}`} onClick={choose(() => setLearningStyle((s) => s === id ? "" : id))}>{t(label)}</button>
          ))}
        </div>
      </section>

      <button className="btn" onClick={save}>{saved ? t("acc.saved") : t("common.save")}</button>
      <p className="small muted" style={{ marginTop: 10 }}>{t("acc.stayLocal")}</p>
    </main>
  );
}
