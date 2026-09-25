"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/client";

/** Hub status card (§5): one school computer serving a room over local Wi-Fi.
 *  Counts only — no learner data leaves the hub. */
export default function HubStatus() {
  const { t } = useI18n();
  const [s, setS] = useState<{ learners: number; rooms: number; classes: number } | null>(null);
  useEffect(() => {
    fetch("/api/hub-status").then((r) => r.json()).then((j) => setS(j)).catch(() => {});
  }, []);
  if (!s) return null;
  return (
    <div className="card soft" style={{ padding: 16 }}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">🛜</span> {t("hub.local")}</p>
      <p className="small muted" style={{ margin: "6px 0 0" }}>
        {s.learners} {t("hub.learners")} · {s.rooms} {t("hub.rooms")} · {s.classes} {t("hub.classes")} {t("hub.localNote")}
      </p>
    </div>
  );
}
