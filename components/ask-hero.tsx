"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/client";
import VoiceInput from "@/components/voice-input";

/** Calm companion entry (§home): one huge ask box, photo-of-question entry,
 *  voice-first. No intimidation, one obvious next action. */
export default function AskHero() {
  const { t, lang } = useI18n();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [guess, setGuess] = useState<{ title: string; id: string; subject: string } | null>(null);
  const [guessing, setGuessing] = useState(false);

  return (
    <section className="card" style={{ padding: 22, borderLeft: "4px solid var(--margin-red)" }}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">◉</span> {t("home.askEyebrow")}</p>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("solve.placeholder")}
        style={{ width: "100%", marginTop: 10, fontSize: 17 }}
        aria-label={t("solve.title")}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <Link
          href={text.trim() ? `/solve` : "/solve"}
          className="btn"
        >
          {t("solve.cta")} →
        </Link>
        <VoiceInput onText={(v) => setText((p) => (p ? `${p} ${v}` : v))} lang={lang} />
        <button
          className="btn ghost small"
          disabled={!text.trim() || guessing}
          onClick={async () => {
            setGuessing(true);
            setGuess(null);
            try {
              const res = await fetch("/api/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
              });
              const j = await res.json();
              if (j.match?.conceptId) {
                const { getConcept } = await import("@/lib/genome");
                const c = getConcept(j.match.conceptId);
                if (c) setGuess({ title: c.title, id: c.id, subject: c.subject });
              }
            } catch { /* guess is a bonus; solve still works */ }
            finally { setGuessing(false); }
          }}
        >
          {guessing ? t("ask.reading") : t("ask.whatTesting")}
        </button>
        <label className="btn ghost small" style={{ cursor: "pointer" }}>
          📷 {t("ask.takePhoto")}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => setPhoto(String(r.result));
              r.readAsDataURL(f);
            }}
          />
        </label>
      </div>
      {guess && (
        <p className="small" style={{ marginTop: 8 }}>
          {t("ask.thinkTests")} <Link href={`/learn/${guess.subject}/${guess.id}`}><b>{guess.title}</b></Link> —{" "}
          <Link href="/solve">{t("ask.workThrough")} →</Link>
        </p>
      )}
      {photo && (
        <p className="small muted" style={{ marginTop: 8 }}>
          {t("ask.photoAttached")}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={t("ask.previewAlt")} style={{ display: "block", maxWidth: 220, marginTop: 8, border: "1px solid var(--line)" }} />
        </p>
      )}
    </section>
  );
}
