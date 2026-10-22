"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE HAND-BACK CONTROL, ON EVERY PAGE.
//
// It renders OUTSIDE the route guard (app/layout.tsx), for the same reason the
// offline bar does: a learner staring at a boot screen still has to be able to
// hand the handset back. A control that exists only on `/kiosk` is a control a
// learner leaves behind the moment they tap "continue", and the next child then
// inherits a live session — the failure this whole mode exists to prevent.
//
// WHAT "HAND BACK" ACTUALLY DOES, in order:
//
//   1. the SERVER ends the session (`POST /api/kiosk/leave`), so a token copied
//      off the handset is dead even if this device is never touched again;
//   2. the identity and the classroom marker are cleared locally, and the page
//      is RELOADED rather than re-rendered — the shell holds one learner's
//      profile, diagnostic lifecycle and session in React state, and swapping
//      that in place is how one child's marks appear under another child's name
//      (the same rule the device roster follows for switching).
//
// If the request never arrives the local clear still happens (`kioskLeave` does
// it in a `finally`), and the server's expiry ends the token anyway — the two
// protections are independent on purpose, because a hand-back must survive a
// failed network call, a refreshed tab and a killed app.
import { useEffect, useState } from "react";
import { useI18n, kioskLeave } from "@/lib/client";
import { readKioskSession, KIOSK_EVENT, type KioskMarker } from "@/lib/kiosk-session";

export function KioskBar() {
  const { t } = useI18n();
  const [marker, setMarker] = useState<KioskMarker | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Read on mount (not during render): localStorage does not exist on the
  // server, and the bar must not decide what it shows from a value that differs
  // between the server's HTML and the browser's first paint.
  useEffect(() => {
    setMarker(readKioskSession());
    const onChange = () => setMarker(readKioskSession());
    // `storage` fires only in OTHER tabs, so the local clear is announced by
    // KIOSK_EVENT — and both are listened to, because a hand-back on one tab
    // must take the control off the other one too.
    window.addEventListener("storage", onChange);
    window.addEventListener(KIOSK_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(KIOSK_EVENT, onChange);
    };
  }, []);

  if (!marker) return null;

  async function handBack() {
    setLeaving(true);
    try {
      await kioskLeave();
    } finally {
      // Hard navigation on purpose: every mounted component, every cached
      // profile and every in-flight request belongs to the learner who just
      // left, and a reload is the one way to be sure none of it survives.
      window.location.replace("/kiosk");
    }
  }

  const expired = marker.expiresAt <= Date.now();

  // Inline, like the offline bar: this strip is part of the shell and must not
  // depend on a stylesheet rule that a page's own layout could outrank. The
  // colours are the design system's tokens — `--surface-sunken` and `--ink` are
  // real, `--accent` and friends are not (the offline banner once painted white
  // on paper by naming one that does not exist).
  return (
    <div
      role="region"
      aria-label={t("kiosk.leave")}
      style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        justifyContent: "space-between",
        background: "var(--surface-sunken)", color: "var(--ink)",
        padding: "6px 16px", fontSize: 14,
        borderBottom: "1.5px solid var(--line-soft)",
      }}
    >
      <span style={{ fontFamily: "var(--mono)", minWidth: 0 }}>
        {marker.className} · {marker.handle}
        {expired ? " · ⏱" : ""}
      </span>
      <button className="btn small" onClick={() => void handBack()} disabled={leaving}>
        {leaving ? t("kiosk.leaving") : t("kiosk.leave")}
      </button>
    </div>
  );
}
