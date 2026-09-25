"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n, loadLocalProfileId, loadLocalProfileSecret } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { getConcept } from "@/lib/genome";
import { disclosureKey } from "@/lib/tutor-context";
import VoiceInput from "@/components/voice-input";
import SpeakButton from "@/components/speak-button";

/** A turn, with the disclosure line only a tutor reply can carry.
 *
 * `labelKey` is not decoration: the mission's rule is that a learner is never
 * told a model answered when the offline engine did, and the only way to keep
 * that on screen across a conversation is for each reply to bring its own
 * label with it. A reply with no label is never labelled as AI. */
interface Turn { role: "you" | "tutor"; text: string; labelKey?: string; why?: string }

/** What the tutor's grounding said about WHY this concept is in front of them.
 *  Rendered from the payload, not composed here: the client does not get to
 *  write the reason a decision was made. */
function whyLine(grounding: unknown, t: (k: string) => string, conceptTitle: string): string | undefined {
  const g = grounding as { decision?: { reason?: string; title?: string } } | null;
  const reason = g?.decision?.reason;
  if (!reason) return undefined;
  return fill(t("tutor.whyThis"), { concept: g?.decision?.title || conceptTitle, reason });
}

export default function TutorPage() {
  const params = useParams<{ concept: string }>();
  const conceptId = params?.concept ?? "";
  const c = getConcept(conceptId);
  const { t, lang } = useI18n();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // There is deliberately no "this deployment has AI" banner before the first
  // question is asked: the page does not yet KNOW that (it would have to ask the
  // AI-status route, and a claim rendered before it is verified is exactly the
  // kind of sentence this screen must not print). Every reply brings its own
  // disclosure instead — see `disclosureKey` above.

  useEffect(() => {
    scroller.current?.scrollTo(0, 1e6);
  }, [turns.length]);

  function seed() {
    if (!c) return;
    setTurns([{ role: "tutor", text: c.lesson }]);
  }

  useEffect(() => { seed(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [conceptId]);

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setText("");
    setTurns((prev) => [...prev, { role: "you", text: message }]);
    try {
      // The learner's capability rides along so the turn can be grounded in
      // their own projection — the plan, the reason and the citations are read
      // server-side from that profile, never from this request.
      const id = loadLocalProfileId();
      const secret = id ? loadLocalProfileSecret() : null;
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId, message, language: lang, id, secret }),
      });
      const body = await res.json();
      setTurns((prev) => [...prev, {
        role: "tutor",
        text: body.reply ?? "…",
        labelKey: disclosureKey(body),
        why: whyLine(body.grounding, t, c?.title ?? ""),
      }]);
    } catch {
      setTurns((prev) => [...prev, { role: "tutor", text: t("tutor.err") }]);
    } finally {
      setBusy(false);
    }
  }

  if (!c) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        <h1>404</h1>
        <Link href="/dashboard" className="btn ghost">← {t("dashboard.title")}</Link>
      </main>
    );
  }

  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">?</span> {t("tutor.title")} · {c.title}</p>
      <h1 className="visually-small">{t("tutor.sub")}</h1>

      <div className="chat" ref={scroller} style={{ height: "52vh" }}>
        {turns.map((turn, i) => (
          <div key={i} className={`msg ${turn.role === "you" ? "me" : turn.role === "tutor" ? "tutor" : "them"}`}>
            <span className="who">{turn.role === "you" ? t("tutor.you") : t("tutor.title")}</span>
            {turn.text}
            {turn.why && <span className="small muted" style={{ display: "block", marginTop: 6 }}>{turn.why}</span>}
            {turn.labelKey && <span className="small muted" style={{ display: "block", marginTop: 4, opacity: 0.8 }}>{t(turn.labelKey)}</span>}
          </div>
        ))}
        {busy && <div className="msg tutor"><span className="who">…</span></div>}
      </div>

      <div className="actions" style={{ marginTop: 10 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={t("tutor.ph")}
          aria-label={t("tutor.ph")}
        />
        <button className="btn" onClick={send} disabled={busy}>{t("rooms.send")}</button>
        <VoiceInput onText={(v) => setText((p) => (p ? `${p} ${v}` : v))} lang={lang} />
      </div>
      {turns.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <SpeakButton text={turns[turns.length - 1].text} />
        </div>
      )}

      {/* No banner about which tutor is running: each reply says who wrote it,
          and the page has not earned a claim before it has an answer to show. */}
    </main>
  );
}
