"use client";

// MY LEARNING ACCESS (§access-profile): one place for how OpenMind teaches
// you — languages, teaching style, reading, voice, connectivity, materials.
// Everything here applies instantly; nothing here leaves your device except
// what you explicitly save to your profile.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccess } from "@/components/access-provider";
import { useI18n, useLearnLangs, useProfile, loadLocalProfileId, loadLocalProfileSecret } from "@/lib/client";
import { LANGS } from "@/lib/i18n";
import LangQuick from "@/components/lang-quick";
import { queueLength } from "@/lib/sync-queue";
import { isContinuityMode, setContinuityMode } from "@/lib/curriculum";
import { RESOURCE_OPTIONS } from "@/lib/resources";

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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPending(queueLength());
    setCont(isContinuityMode());
    if (state) {
      setTerms(state.profile.termsMode ?? "mixed");
      setExplainLen(state.profile.explainLen ?? "full");
      setResources(state.profile.resources ?? []);
    }
  }, [state]);

  async function save() {
    const id = loadLocalProfileId();
    if (!id) return;
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, secret: loadLocalProfileSecret(), termsMode: terms, explainLen, resources, board, exam, learningStyle }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button className={`btn small ${terms === "mixed" ? "" : "ghost"}`} onClick={() => setTerms("mixed")}>{t("acc.termsMixed")}</button>
          <button className={`btn small ${terms === "local" ? "" : "ghost"}`} onClick={() => setTerms("local")}>{t("acc.termsLocal")}</button>
          <button className={`btn small ${explainLen === "full" ? "" : "ghost"}`} onClick={() => setExplainLen("full")}>{t("acc.fullExplain")}</button>
          <button className={`btn small ${explainLen === "short" ? "" : "ghost"}`} onClick={() => setExplainLen("short")}>{t("acc.shortExplain")}</button>
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
            <button key={r.id} className={`btn small ${resources.includes(r.id) ? "" : "ghost"}`} aria-pressed={resources.includes(r.id)} onClick={() => setResources((prev) => prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id])}>{t(r.label)}</button>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ margin: 0 }}>📚 {t("acc.boardExam")}</p>
        <p className="small muted">{t("acc.boardNote")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {[["cbse", "acc.b.cbse"], ["icse", "acc.b.icse"], ["igcse", "acc.b.igcse"], ["state", "acc.b.state"], ["matric", "acc.b.matric"], ["nigerian", "acc.b.nigerian"], ["kenyan", "acc.b.kenyan"], ["philippine", "acc.b.philippine"], ["bangladeshi", "acc.b.bangladeshi"], ["indonesian", "acc.b.indonesian"], ["brazilian", "acc.b.brazilian"], ["mexican", "acc.b.mexican"]].map(([id, key]) => (
            <button key={id} className={`btn small ${board === id ? "" : "ghost"}`} onClick={() => setBoard((b) => b === id ? "" : id)}>{t(key)}</button>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <label className="small muted" htmlFor="exam-input">{t("acc.examLabel")}</label>
          <input id="exam-input" className="input" style={{ width: "100%", marginTop: 4 }} value={exam} onChange={(e) => setExam(e.target.value.slice(0, 40))} placeholder={t("acc.examPh")} />
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ margin: 0 }}>🧠 {t("onb.learningStyle")}</p>
        <p className="small muted">{t("acc.howTeachNote")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {[["visual", "ls.visual"], ["auditory", "ls.auditory"], ["kinesthetic", "ls.kinesthetic"], ["reading-writing", "ls.reading"]].map(([id, label]) => (
            <button key={id} className={`btn small ${learningStyle === id ? "" : "ghost"}`} onClick={() => setLearningStyle((s) => s === id ? "" : id)}>{t(label)}</button>
          ))}
        </div>
      </section>

      <button className="btn" onClick={save}>{saved ? t("acc.saved") : t("common.save")}</button>
      <p className="small muted" style={{ marginTop: 10 }}>{t("acc.stayLocal")}</p>
    </main>
  );
}
