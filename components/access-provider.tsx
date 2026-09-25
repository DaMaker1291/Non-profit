"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The adaptation provider (§10). Accessibility as a first-class surface, not
// a settings page: the ♿ button lives in the margin rail on every page, the
// panel states each option as a preference about HOW to be taught, and every
// choice applies instantly via <html> classes + a React context.
//
// The panel also reports honestly which of the device's capabilities are
// missing — a student without a local speech engine sees why the speaker
// buttons are absent, in their own language.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_PREFS, hasVoiceFor, loadPrefs, prefClasses, savePrefs, speechSupported } from "@/lib/access";
import type { AccessPrefs } from "@/lib/access";
import { chooseTier, probeWhenIdle, refusedBiggerModel, tierNoteKey } from "@/lib/local-ai";
import type { LocalAiPlan } from "@/lib/local-ai";
import { useI18n } from "@/lib/client";

interface AccessCtx {
  prefs: AccessPrefs;
  set: (p: Partial<AccessPrefs>) => void;
}

const Ctx = createContext<AccessCtx>({ prefs: DEFAULT_PREFS, set: () => {} });

export function useAccess(): AccessCtx {
  return useContext(Ctx);
}

/** Derive extra html classes for the speech preference (applied separately
 *  because it changes component behaviour, not just styling). */
function applyHtmlClasses(p: AccessPrefs): void {
  const el = document.documentElement;
  const classes = prefClasses(p).join(" ");
  el.className = el.className
    .split(" ")
    .filter((c) => c && !c.startsWith("access-"))
    .join(" ")
    .trim();
  if (classes) el.className += (el.className ? " " : "") + classes;
  if (p.preferSpeech) el.classList.add("access-voice-first");
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AccessPrefs>(DEFAULT_PREFS);
  const [open, setOpen] = useState(false);
  const [speechOk, setSpeechOk] = useState(true);
  const [voiceOk, setVoiceOk] = useState(true);
  const [plan, setPlan] = useState<LocalAiPlan | null>(null);
  const { t, lang } = useI18n();

  useEffect(() => {
    setPrefs(loadPrefs());
    setSpeechOk(speechSupported());
    setVoiceOk(hasVoiceFor(lang));
  }, [lang]);

  // The device audit runs AFTER the screen is usable, never during first paint:
  // measuring a slow CPU is exactly the kind of work that must not delay the
  // learner's first question. `null` until it answers, and the panel simply
  // omits the line rather than inventing a tier.
  useEffect(() => {
    let alive = true;
    probeWhenIdle()
      .then((facts) => { if (alive) setPlan(chooseTier(facts)); })
      .catch(() => { /* a failed probe leaves the line out; nothing else changes */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    applyHtmlClasses(prefs);
  }, [prefs]);

  const set = useCallback((p: Partial<AccessPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...p };
      savePrefs(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ prefs, set }), [prefs, set]);

  const Toggle = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button
      className={`btn small ${on ? "" : "ghost"}`}
      style={{ justifyContent: "flex-start", width: "100%", textAlign: "start" }}
      aria-pressed={on}
      onClick={onClick}
    >
      {on ? "✓ " : ""}{label}
    </button>
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <button
        className="access-btn"
        aria-label={t("access.open")}
        title={t("access.open")}
        onClick={() => setOpen((o) => !o)}
      >
        ♿
      </button>
      {open && (
        <div className="access-panel" role="dialog" aria-label={t("access.title")}>
          <strong>{t("access.title")}</strong>
          <p className="small muted" style={{ margin: "4px 0 10px" }}>{t("access.lead")}</p>
          <Toggle on={prefs.readAloud} label={`🔊 ${t("access.readAloud")}`} onClick={() => set({ readAloud: !prefs.readAloud })} />
          <Toggle on={prefs.largeText} label={`👁 ${t("access.largeText")}`} onClick={() => set({ largeText: !prefs.largeText })} />
          <Toggle on={prefs.highContrast} label={`🎨 ${t("access.highContrast")}`} onClick={() => set({ highContrast: !prefs.highContrast })} />
          <Toggle on={prefs.reduceMotion} label={`🧠 ${t("access.reduceMotion")}`} onClick={() => set({ reduceMotion: !prefs.reduceMotion })} />
          <Toggle on={prefs.preferSpeech} label={`🎙 ${t("access.preferSpeech")}`} onClick={() => set({ preferSpeech: !prefs.preferSpeech })} />
          {!speechOk && <p className="small muted" style={{ margin: "8px 0 0" }}>📵 {t("access.noSpeech")}</p>}
          {speechOk && !voiceOk && <p className="small muted" style={{ margin: "8px 0 0" }}>🌐 {t("access.noVoice")}</p>}
          {plan && (
            <p className="small muted" style={{ margin: "8px 0 0" }}>
              ⚙ {t("ai.localTitle")}: {t(tierNoteKey(plan))}
              {refusedBiggerModel(plan) ? ` · ${t("ai.note.refused")}` : ""}
            </p>
          )}
          <p className="small muted" style={{ margin: "8px 0 0" }}>🔒 {t("access.localNote")}</p>
        </div>
      )}
    </Ctx.Provider>
  );
}
