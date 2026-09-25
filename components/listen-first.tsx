"use client";

import { useState } from "react";
import { speak } from "@/lib/access";
import { useAccess } from "@/components/access-provider";
import { useI18n } from "@/lib/client";
import VoiceInput from "@/components/voice-input";

/** Literacy-adaptive (§11): listen first, then say what you understood.
 *  Only prominent when read-aloud is on; otherwise a quiet helper. */
export default function ListenFirst({ lesson }: { lesson: string }) {
  const { prefs } = useAccess();
  const { t, lang } = useI18n();
  const [heard, setHeard] = useState("");
  if (!prefs.readAloud) return null;
  return (
    <section className="card" style={{ borderLeft: "4px solid var(--tick-green)" }}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">🔊</span> {t("listen.eyebrow")}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button className="btn small" onClick={() => speak(`${t("listen.spokenPrefix")} ${lesson}`, lang)}>
          🔊 {t("listen.play")}
        </button>
        <VoiceInput onText={(v) => setHeard(v)} lang={lang} />
      </div>
      {heard && <p className="small" style={{ marginTop: 8 }}>{t("listen.youSaid")} “{heard}” — {t("listen.nowTry")}</p>}
    </section>
  );
}
