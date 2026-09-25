"use client";

// OPENMIND OFFLINE (§offline-product): the downloaded plan, readable with no
// connection. Cached snapshot from the last download — never a network error.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n, loadLocalProfileId, useProfile } from "@/lib/client";
import DownloadPack from "@/components/download-pack";

interface Snap {
  at: number;
  summary: { activities?: number; due?: number; touched?: number; strong?: number } | null;
  today: Array<{ kind: string; title: string; reason: string; minutes: number; href: string; why?: string; plan?: Array<{ kind: string; count: number }> }>;
  weakAreas: string[];
}

export default function OfflinePage() {
  const { t, lang } = useI18n();
  const { state } = useProfile();
  const [snap, setSnap] = useState<Snap | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem("openmind:offline-snapshot");
        if (raw) setSnap(JSON.parse(raw) as Snap);
      } catch { /* no snapshot yet */ }
    };
    read();
    // The pack button writes the snapshot; this page shows it. Re-read when it
    // lands, so downloading the pack fills in the plan on the spot.
    window.addEventListener("openmind:pack-ready", read);
    return () => window.removeEventListener("openmind:pack-ready", read);
  }, []);
  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">📴</span> {t("off.eyebrow")}</p>
      <h1>{t("off.title")}</h1>
      {/* The pack download lives HERE, not on Home: it is the thing that makes
          this page useful with no connection, and Home is for today's work. */}
      <div style={{ margin: "0 0 18px" }}>
        <DownloadPack />
      </div>
      {!snap && (
        <>
          <p className="lead">{t("off.noPlan")}</p>
          <Link href="/dashboard" className="btn">{t("off.getPlan")} →</Link>
        </>
      )}
      {snap && (
        <>
          <p className="lead">
            {snap.summary?.activities ?? snap.today.length} {t("off.activities")} · {snap.summary?.due ?? 0} {t("off.reviews")} ·{" "}
            {snap.weakAreas.length} {t("off.weakAreas")} · {t("off.synced")} {new Date(snap.at).toLocaleString()}
          </p>
          {snap.today[0] && (
            <section className="card" style={{ borderLeft: "4px solid var(--margin-red)" }}>
              {/* No raw `kind` enum: the title opens with the translated verb. */}
              <p className="eyebrow" style={{ margin: 0 }}>{t("next.eyebrow")}</p>
              <p style={{ fontSize: 18, margin: "8px 0 4px" }}><b>{snap.today[0].title}</b></p>
              <p className="small muted">{snap.today[0].reason} · ~{snap.today[0].minutes} {t("next.ev.min")}</p>
              {snap.today[0].why && <p className="small muted" style={{ margin: "4px 0 0" }}>{t("next.whyNow")} {snap.today[0].why}</p>}
              {snap.today[0].plan && snap.today[0].plan.length > 0 && (
                <p className="mono small muted" style={{ margin: "4px 0 0" }}>
                  {t("next.how")}{" "}
                  {snap.today[0].plan.map((p) => `${p.count} ${t(`plan.${p.kind}`)}`).join(" → ")}
                </p>
              )}
              <Link href={snap.today[0].href} className="btn small">{t("next.start")} →</Link>
            </section>
          )}
          {snap.today.slice(1).map((a, i) => (
            <p key={i} className="small" style={{ margin: "8px 0" }}>
              <Link href={a.href}>{a.title}</Link> <span className="muted">· {a.reason}</span>
            </p>
          ))}
          <p className="small muted" style={{ marginTop: 16 }}>{t("off.resumes")}</p>
        </>
      )}
    </main>
  );
}
