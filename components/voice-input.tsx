"use client";

import { useEffect, useState } from "react";
import { listenOnce, recognitionSupported } from "@/lib/voice";
import { useI18n } from "@/lib/client";
import { Icon } from "@/components/icons";

/** Mic button: speech → text into the parent field. Hidden when unsupported.
 *
 *  `compact` drops the word and keeps the glyph. The tutor composer is 360px
 *  wide and shares its row with an "Ask" button, so the labelled version
 *  measured 151px of a 337px row and left the textarea it is meant to feed
 *  with **41px** — a box one character wide. The word was the bug; the mic
 *  still carries an accessible name, because `aria-label` is what a screen
 *  reader reads and it was never the visible label's job. */
export default function VoiceInput({ onText, lang, compact }: { onText: (t: string) => void; lang?: string; compact?: boolean }) {
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
      {busy ? "…" : <Icon name="mic" />}
      {!busy && !compact && ` ${t("voice.speak")}`}
    </button>
  );
}
