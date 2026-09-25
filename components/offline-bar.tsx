"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { clearRefused, flushQueue, queueSummary, type QueueSummary } from "@/lib/sync-queue";
import { watchPower } from "@/lib/power";

/** Registers the offline service worker and tells the student, honestly and
 *  in their own language, when they are reading cached pages and — the part
 *  that matters for learning — how much work is still waiting to be marked
 *  (§ offline UI: never a bare network error, and never a silent queue). */
export function OfflineBar() {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueueSummary>({ pending: 0, refused: 0, oldest: null });
  const { t } = useI18n();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    const stopPower = watchPower();
    setOnline(navigator.onLine);
    setQueue(queueSummary());
    // A reconnect is TWO events, not one: the browser's `online` event fires
    // only if the page was already open when the connection dropped. A device
    // that was closed while offline and reopened on wifi fires nothing at all —
    // so the queue is drained on mount too, or a returning learner's work would
    // sit in localStorage forever.
    const drain = () =>
      void flushQueue().then((r) => setQueue({ pending: r.pending, refused: r.refused, oldest: null }));
    if (navigator.onLine) drain();
    else setQueue(queueSummary());
    const on = () => {
      setOnline(true);
      drain();
    };
    const off = () => {
      setOnline(false);
      setQueue(queueSummary());
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      stopPower();
    };
  }, []);

  // `fill` rather than concatenation: the count's place in the sentence is a
  // property of the LANGUAGE, so each dictionary decides it.
  const pendingLabel = fill(t("offline.pending"), { n: queue.pending });
  const syncingLabel = fill(t("offline.syncing"), { n: queue.pending });
  const refusedLabel = fill(t("offline.refused"), { n: queue.refused });

  // The status region exists in the DOM from the first paint — a live region
  // only announces if it's already there when the state changes. While
  // everything is synced and online it's empty; a change of state inserts the
  // message (and announces it).
  return (
    <div role="status" aria-live="polite">
      {!online && (
        <div style={{ background: "var(--accent)", color: "var(--paper)", padding: "6px 16px", textAlign: "center", fontSize: 14 }}>
          {t("offline.bar")}
          {queue.pending > 0 && ` · ${pendingLabel}`}
        </div>
      )}
      {online && queue.pending > 0 && (
        <div style={{ background: "var(--amber, #b0670b)", color: "#fff", padding: "6px 16px", textAlign: "center", fontSize: 14 }}>
          {syncingLabel}
        </div>
      )}
      {queue.refused > 0 && (
        <div style={{ background: "var(--bad, #b00)", color: "#fff", padding: "6px 16px", textAlign: "center", fontSize: 14 }}>
          {refusedLabel}{" "}
          <button className="btn ghost small" style={{ color: "#fff" }} onClick={() => { clearRefused(); setQueue(queueSummary()); }}>
            {t("common.close")}
          </button>
        </div>
      )}
    </div>
  );
}
