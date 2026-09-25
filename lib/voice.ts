// Voice input (§2 voice-first). Web Speech API where available, honest
// fallback otherwise. No server call, no key, works with the device engine.
export function recognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return typeof w.SpeechRecognition !== "undefined" || typeof w.webkitSpeechRecognition !== "undefined";
}

export function bcp47Voice(code: string): string {
  const map: Record<string, string> = {
    en: "en-US", es: "es-ES", fr: "fr-FR", pt: "pt-BR", ar: "ar-SA",
    sw: "sw-KE", hi: "hi-IN", id: "id-ID", tl: "fil-PH", ur: "ur-PK",
    fa: "fa-IR", de: "de-DE", ja: "ja-JP", zh: "zh-CN",
  };
  return map[code] ?? "en-US";
}

/** One-shot recognition. Resolves with transcript or null if unavailable. */
export function listenOnce(langCode: string, timeoutMs = 15000): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const w = window as unknown as Record<string, new () => {
        lang: string; interimResults: boolean; maxAlternatives: number;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void; stop: () => void;
      }>;
      const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (!Ctor) { resolve(null); return; }
      const rec = new Ctor();
      rec.lang = bcp47Voice(langCode);
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let done = false;
      const finish = (v: string | null) => { if (!done) { done = true; try { rec.stop(); } catch { /* noop */ } resolve(v); } };
      rec.onresult = (e) => {
        try {
          const t = e.results?.[0]?.[0]?.transcript ?? "";
          finish(t.trim() || null);
        } catch { finish(null); }
      };
      rec.onerror = () => finish(null);
      rec.onend = () => finish(null);
      rec.start();
      setTimeout(() => finish(null), timeoutMs);
    } catch { resolve(null); }
  });
}
