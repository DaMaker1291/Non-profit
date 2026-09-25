"use client";

import { useEffect, useState } from "react";
import { listenOnce, recognitionSupported } from "@/lib/voice";
import { useI18n } from "@/lib/client";

/** Mic button: speech → text into the parent field. Hidden when unsupported. */
export default function VoiceInput({ onText, lang }: { onText: (t: string) => void; lang?: string }) {
  const { t, lang: uiLang } = useI18n();
  const [busy, setBusy] = useState(false);
  // Mount gate (same hydration reason as SpeakButton): server renders null.
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(recognitionSupported()); }, []);
  if (!ready) return null;
  const code = lang ?? uiLang;
  return (
    <button
      className="btn ghost small"
      disabled={busy}
      aria-label={t("voice.aria")}
      title={t("voice.aria")}
      onClick={async () => {
        setBusy(true);
        try {
          const t = await listenOnce(code);
          if (t) onText(t);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "… 🎙" : `🎙 ${t("voice.speak")}`}
    </button>
  );
}
