// ─────────────────────────────────────────────────────────────────────────────
// The adaptation engine (§1, §2, §10, §11). "OpenMind adapts to the learner's
// world — not the learner to OpenMind." This module is deliberately tiny and
// dependency-free: it must run on the weakest reasonable phone, on a flaky
// connection, with zero AI services and zero cloud calls.
//
// Three halves:
//   1. Preferences — how the student wants to be taught. Stored locally
//      (data sovereignty §16: preferences are the learner's, not ours) and
//      derivable as CSS classes / html attributes.
//   2. Speech — read-aloud through the device's own speech engine. Free,
//      offline, no model to download: the same trick the pack uses to teach
//      without a server. Voice is mapped from the UI language.
//   3. Derivation — how the rest of the app reads the preferences (a tiny
//      React hook in access-provider.tsx wraps this for components).
// ─────────────────────────────────────────────────────────────────────────────

export interface AccessPrefs {
  /** Read controls and feedback aloud when tapped (§10). */
  readAloud: boolean;
  /** Larger base type (§10). */
  largeText: boolean;
  /** High-contrast ink (§10). */
  highContrast: boolean;
  /** Fewer animations, calmer motion (§3, §6). */
  reduceMotion: boolean;
  /** The student said they'd rather speak than type (§2). Drives UI priority. */
  preferSpeech: boolean;
}

export const DEFAULT_PREFS: AccessPrefs = {
  readAloud: false,
  largeText: false,
  highContrast: false,
  reduceMotion: false,
  preferSpeech: false,
};

const KEY = "openmind:access";

export function loadPrefs(): AccessPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const j = JSON.parse(raw) as Partial<AccessPrefs>;
    return {
      readAloud: j.readAloud === true,
      largeText: j.largeText === true,
      highContrast: j.highContrast === true,
      reduceMotion: j.reduceMotion === true,
      preferSpeech: j.preferSpeech === true,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: AccessPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch { /* storage full or blocked: prefs stay session-only, never fatal */ }
}

/** How the rest of the app reads the prefs: one string of classes for <html>.
 *  The CSS side is a mirror of this list — see globals.css. */
export function prefClasses(p: AccessPrefs): string[] {
  const out: string[] = [];
  if (p.largeText) out.push("access-large");
  if (p.highContrast) out.push("access-contrast");
  if (p.reduceMotion) out.push("access-calm");
  return out;
}

// ── Speech (§2, §11) ────────────────────────────────────────────────────────

/** Is any speech engine available? Checked lazily — capabilities vary by
 *  device, and the UI must degrade honestly (hide the button) not lie. */
export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Our UI code → BCP-47 tag for the device voice picker. */
export function bcp47(code: string): string {
  const map: Record<string, string> = {
    en: "en-US", es: "es-ES", fr: "fr-FR", pt: "pt-BR", ar: "ar-SA",
    sw: "sw-KE", hi: "hi-IN", id: "id-ID", tl: "fil-PH", ur: "ur-PK",
    fa: "fa-IR", de: "de-DE", ja: "ja-JP", zh: "zh-CN",
  };
  return map[code] ?? "en-US";
}

/** True when the device has any installed voice covering the language. */
export function hasVoiceFor(code: string): boolean {
  if (!speechSupported()) return false;
  const tag = bcp47(code);
  const base = tag.split("-")[0];
  return window.speechSynthesis.getVoices().some(
    (v) => v.lang === tag || v.lang.replace("_", "-").split("-")[0] === base,
  );
}

/** Speak text in the student's language. Stops anything already speaking so
 *  taps feel immediate. Fire-and-forget by design: speech is a courtesy
 *  layer and must never throw into the app's own flow. */
export function speak(text: string, langCode: string): void {
  if (!speechSupported() || !text.trim()) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = bcp47(langCode);
    const tag = u.lang;
    const base = tag.split("-")[0];
    const voice = window.speechSynthesis.getVoices().find(
      (v) => v.lang === tag || v.lang.replace("_", "-").split("-")[0] === base,
    );
    if (voice) u.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* never let a speech hiccup break learning */ }
}

export function stopSpeaking(): void {
  if (!speechSupported()) return;
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
}

/** Strip control glyphs so the synthesiser doesn't read decoration aloud. */
export function speakableText(s: string): string {
  return s.replace(/[✓✗→←🔈🔊🎙♿⭐]/g, "").replace(/\s+/g, " ").trim();
}
