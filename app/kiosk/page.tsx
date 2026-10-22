"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE CLASSROOM'S FRONT DOOR: a shared handset at rest, waiting for a lesson.
//
// This screen is the FIRST and LAST thing a learner sees on a school device. It
// deliberately shows nothing about anybody: no name, no class list, no "last used
// by" hint — an unattended handset must not become a directory of who is enrolled
// or what they were working on.
//
// THE CREDENTIAL IS A PIN, AND IT IS EXCHANGED — not stored. Submitting it calls
// `/api/kiosk/login`, which returns a SHORT-LIVED session token (the `secret` the
// rest of the app already carries). The token is not the learner's permanent
// capability, it is not remembered in the device roster, and the server deletes
// it on hand-back or at expiry. That is the whole difference from the household
// roster, whose entries are permanent capabilities sitting in localStorage.
//
// A FULL NAVIGATION follows a successful login rather than a client-side push:
// the shell caches one learner's profile, diagnostic lifecycle and session in
// React state, and a fresh document is the one way to be certain that none of the
// previous lesson's state is still mounted when the next one begins.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n, kioskLogin, kioskLeave } from "@/lib/client";
import { ApiError } from "@/lib/api/client";
import { markKioskSession, readKioskSession, clearKioskSession } from "@/lib/kiosk-session";

export default function KioskPage() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [handle, setHandle] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"bad" | "locked" | "">("");
  const [active, setActive] = useState<{ className: string; handle: string } | null>(null);

  // An ACTIVE lesson is shown rather than the form, so a learner who comes back
  // to this screen mid-lesson continues instead of starting a second session.
  useEffect(() => {
    const m = readKioskSession();
    if (m) setActive({ className: m.className, handle: m.handle });
  }, []);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await kioskLogin({ joinCode: code.trim(), handle: handle.trim(), pin: pin.trim() });
      markKioskSession({
        classId: data.classId,
        className: data.className,
        handle: data.handle,
        expiresAt: data.expiresAt,
      });
      window.location.assign("/dashboard");
    } catch (e2) {
      // A 429 is the attempt budget, and it says so: this is the one refusal a
      // learner can act on (wait, or ask the teacher for a new PIN). Everything
      // else is the same sentence, because the server does not say which part of
      // the credential was wrong — and neither does this screen.
      const status = e2 instanceof ApiError ? e2.status : 0;
      setError(status === 429 ? "locked" : "bad");
      setPin("");
      setBusy(false);
    }
  }

  async function handBack() {
    setBusy(true);
    try {
      await kioskLeave();
    } finally {
      clearKioskSession();
      window.location.replace("/kiosk");
    }
  }

  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow">
        <span className="no">▣</span> {t("kiosk.title")}
      </p>
      <h1>{t("kiosk.title")}</h1>

      {active ? (
        <section className="card">
          <p className="lead" style={{ marginTop: 0 }}>
            {active.className} · {active.handle}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="btn" href="/dashboard">{t("dash.continue")}</Link>
            <button className="btn ghost" onClick={() => void handBack()} disabled={busy}>
              {busy ? t("kiosk.leaving") : t("kiosk.leave")}
            </button>
          </div>
        </section>
      ) : (
        <form className="card" onSubmit={start}>
          <p className="lead" style={{ marginTop: 0 }}>{t("kiosk.lead")}</p>
          <label className="field" style={{ maxWidth: 260 }}>
            <span>{t("kiosk.code")}</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={12}
              required
            />
          </label>
          <label className="field" style={{ maxWidth: 260 }}>
            <span>{t("kiosk.name")}</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              autoComplete="off"
              maxLength={24}
              required
            />
          </label>
          <label className="field" style={{ maxWidth: 260 }}>
            <span>{t("kiosk.pin")}</span>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              // A PIN is a numeric code, not a password: the numeric keypad is
              // the right keyboard on the phones this is for, and the value is
              // never read back from the DOM by anything but this form.
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={8}
              required
            />
          </label>
          {error && (
            <p className="note" role="alert" style={{ borderInlineStartColor: "var(--margin-red)" }}>
              {error === "locked" ? t("kiosk.locked") : t("kiosk.bad")}
            </p>
          )}
          <button className="btn" type="submit" disabled={busy}>
            {t("kiosk.start")}
          </button>
        </form>
      )}

      <p className="note" style={{ marginTop: 16 }}>
        <Link href="/">{t("nav.home")}</Link>
      </p>
    </main>
  );
}
