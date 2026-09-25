"use client";

// OPENMIND HUB (§hub-simple): one laptop + local Wi-Fi + many phones.
// Counts only, no learner data shown. Students just connect — no setup.
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/client";

export default function HubPage() {
  const { t } = useI18n();
  const [s, setS] = useState<{ learners: number; rooms: number; classes: number } | null>(null);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    fetch("/api/hub-status").then((r) => r.json()).then((j) => setS(j)).catch(() => {});
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">🛜</span> {t("hub.eyebrow")}</p>
      <h1>{t("hub.title")}</h1>
      <p className="lead">
        {s ? `${s.learners} ${t("hub.learners")} · ${s.rooms} ${t("hub.rooms")} · ${s.classes} ${t("hub.classes")}` : t("hub.loading")}
      </p>
      <div className="card soft">
        <p style={{ margin: 0 }}>{t("hub.internet")} {online ? `🟢 ${t("hub.online")}` : `○ ${t("hub.offlineState")}`}</p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          {t("hub.note")}
        </p>
      </div>
    </main>
  );
}
