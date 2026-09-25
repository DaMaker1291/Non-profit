"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The speak button (§2, §11). A tiny 🔈 control that reads curriculum text
// aloud through the device's own speech engine — free, offline, no AI call.
// With read-aloud enabled it can auto-read on mount (the literacy-adaptive
// path: listen first, then answer), and it never renders on devices without
// a speech engine — honest degradation, not a dead button.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { speak, speakableText, speechSupported, stopSpeaking } from "@/lib/access";
import { useAccess } from "@/components/access-provider";
import { useI18n } from "@/lib/client";

export default function SpeakButton({ text, auto }: { text: string; auto?: boolean }) {
  const { prefs } = useAccess();
  const { t, lang } = useI18n();
  const clean = speakableText(text);
  // Mount gate: the server renders null (no engine there); the first client
  // paint must match it exactly, then enable. Otherwise hydration mismatches.
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(speechSupported()); }, []);

  useEffect(() => {
    if (auto && prefs.readAloud && clean) speak(clean, lang);
  }, [auto, prefs.readAloud, clean, lang]);

  // Leaving the page stops the reading — a student who navigates away must
  // never keep hearing a question they can no longer see.
  useEffect(() => () => stopSpeaking(), []);

  if (!ready) return null;
  return (
    <button
      className="speak-btn"
      aria-label={t("speak.aria")}
      title={t("speak.aria")}
      onClick={() => speak(clean, lang)}
    >
      🔈
    </button>
  );
}
