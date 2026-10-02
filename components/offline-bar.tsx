"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { clearRefused, flushQueue, queueSummary, type QueueSummary } from "@/lib/sync-queue";
import { watchPower } from "@/lib/power";
import { drainIntervalMs, drainsOnArrival, resolveDeployment } from "@/lib/deployment";

/** Registers the offline service worker and tells the student, honestly and
 *  in their own language, when they are reading cached pages and — the part
 *  that matters for learning — how much work is still waiting to be marked
 *  (§ offline UI: never a bare network error, and never a silent queue). */
export function OfflineBar() {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueueSummary>({ pending: 0, refused: 0, oldest: null });
  const { t } = useI18n();
  // WHETHER THIS DEVICE MAY DRAIN THE QUEUE BY ITSELF — one answer, read from
  // the declared deployment (lib/deployment.ts). A school on metered data says
  // `syncFrequency: "manual"`, and its work leaves the device when the person
  // in the room asks, not when the app feels like it. The two derived answers
  // are read once here rather than each caller deciding for itself.
  const deployment = useMemo(
    () => resolveDeployment({
      NEXT_PUBLIC_OPENMIND_DEPLOYMENT: process.env.NEXT_PUBLIC_OPENMIND_DEPLOYMENT,
      NEXT_PUBLIC_OPENMIND_DEPLOYMENT_PROFILE: process.env.NEXT_PUBLIC_OPENMIND_DEPLOYMENT_PROFILE,
    }).profile,
    [],
  );
  const auto = drainsOnArrival(deployment);

  const drain = () =>
    void flushQueue().then((r) => setQueue({ pending: r.pending, refused: r.refused, oldest: null }));

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
    if (auto && navigator.onLine) drain();
    else setQueue(queueSummary());
    const on = () => {
      setOnline(true);
      if (auto) drain();
    };
    const off = () => {
      setOnline(false);
      setQueue(queueSummary());
    };
    // A site with a real connection also drains on a clock, so work does not
    // wait for someone to close and reopen the page. A site that did not
    // declare one gets no timer: a background call on a metered device is the
    // opposite of what this product is for.
    const every = drainIntervalMs(deployment);
    const timer = every ? window.setInterval(() => { if (navigator.onLine) drain(); }, every) : null;
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      if (timer !== null) window.clearInterval(timer);
      stopPower();
    };
  }, [auto, deployment]);

  // `fill` rather than concatenation: the count's place in the sentence is a
  // property of the LANGUAGE, so each dictionary decides it.
  const pendingLabel = fill(t("offline.pending"), { n: queue.pending });
  const syncingLabel = fill(t("offline.syncing"), { n: queue.pending });
  const refusedLabel = fill(t("offline.refused"), { n: queue.refused });
  const waitingLabel = fill(t("offline.waiting"), { n: queue.pending });

  // The status region exists in the DOM from the first paint — a live region
  // only announces if it's already there when the state changes. While
  // everything is synced and online it's empty; a change of state inserts the
  // message (and announces it).
  return (
    <div role="status" aria-live="polite">
      {!online && (
        // `--accent` is NOT a token this design system defines — the tokens are
        // --margin-red, --amber, --ink, --paper and the rest. `var(--accent)` with
        // no fallback resolved to nothing, so this banner had NO background and
        // painted paper-coloured text on paper: the one message that has to be
        // legible when the network is gone was the one that could not be read.
        // --margin-red is the system's single attention colour, and white on it
        // is the contrast this banner needs.
        <div style={{ background: "var(--margin-red)", color: "var(--paper)", padding: "6px 16px", textAlign: "center", fontSize: 14 }}>
          {t("offline.bar")}
          {queue.pending > 0 && ` · ${pendingLabel}`}
        </div>
      )}
      {/* A MANUAL SITE DOES NOT CLAIM TO BE SYNCING. The old banner said
          "Syncing your offline answers" whenever the device was online with
          work pending — which, on a site whose profile forbids unattended
          sync, is the app describing something it is deliberately not doing.
          Here the learner is told the truth and given the one control that
          spends data: send now. */}
      {online && queue.pending > 0 && (
        <div style={{ background: "var(--amber, #b0670b)", color: "#fff", padding: "6px 16px", textAlign: "center", fontSize: 14 }}>
          {auto ? syncingLabel : waitingLabel}{" "}
          {!auto && (
            <button className="btn ghost small" style={{ color: "#fff" }} onClick={drain}>
              {t("offline.syncNow")}
            </button>
          )}
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
