"use client";

import { useState } from "react";
import { loadLocalProfileId, useI18n, withCapability } from "@/lib/client";

/** Download-my-learning-pack (§4): lessons + progress + review queue as one
 *  JSON file. Works with the printable class pack: personal + class cover
 *  both sides of an offline week. */
export default function DownloadPack() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button
        className="btn small ghost"
        disabled={busy}
        onClick={async () => {
          const id = loadLocalProfileId();
          if (!id) return;
          setBusy(true);
          try {
            const res = await fetch(withCapability(`/api/my-pack?id=${encodeURIComponent(id)}`));
            if (!res.ok) return;
            const j = await res.json();
            const blob = new Blob([JSON.stringify(j)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "openmind-learning-pack.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            try { window.localStorage.setItem("openmind:packAt", String(Date.now())); } catch { /* ignore */ }
            const s = j.summary as { activities?: number; due?: number } | undefined;
            setSummary(
              s ? `${t("pack.ready")} ${s.activities ?? 0} ${t("off.activities")}, ${s.due ?? 0} ${t("off.reviews")}`
                : t("pack.ready"),
            );
            // Cache a compact snapshot so /offline renders with no connection.
            try {
              window.localStorage.setItem("openmind:offline-snapshot", JSON.stringify({
                at: Date.now(), summary: j.summary ?? null,
                today: (j.today ?? []).slice(0, 6), weakAreas: j.weakAreas ?? [],
              }));
            } catch { /* storage full: download still works */ }
            // Tell the page that reads the snapshot (the offline plan) that
            // there is one now. Without this, a learner clicks "download my
            // pack" on /offline and the page underneath still says there is no
            // plan — a control that looks dead is worse than no control.
            window.dispatchEvent(new Event("openmind:pack-ready"));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? t("pack.packing") : t("pack.download")}
      </button>
      {summary && <span className="small muted">{summary}</span>}
    </div>
  );
}
