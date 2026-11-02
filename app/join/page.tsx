"use client";

// ── THE INVITATION DOOR ─────────────────────────────────────────────────────
//
// A teacher can hand a pupil a URL instead of reading a six-character code
// aloud. The URL carries the same expiring, revocable join code the account
// page accepts; it does not carry a roster, a learner id or a capability. This
// page therefore shows a code box and nothing about the class until the join
// succeeds, and the server answers with the member's own row only.
//
// The page works for a learner who already has a profile and for one who has
// not signed in yet. The latter is sent through the normal onboarding flow with
// this page as the return target, so finishing an account does not lose the
// invitation.
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchProfile, loadLocalProfileId, useAccount, useI18n } from "@/lib/client";
import * as api from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import type { ProfileState } from "@/lib/types";

export default function JoinPage() {
  const { t } = useI18n();
  const { session, ready } = useAccount();
  const [code, setCode] = useState("");
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCode((params.get("code") ?? "").trim().toUpperCase().slice(0, 12));
    const id = loadLocalProfileId();
    if (id) fetchProfile(id).then(setProfile).catch(() => setProfile(null));
  }, []);

  const profileId = loadLocalProfileId();
  const returnPath = `/join?code=${encodeURIComponent(code)}`;
  const teacherAccount = session.account?.role === "teacher" || session.account?.role === "org";

  async function join() {
    const input = code.trim().toUpperCase();
    if (!profileId || !input || busy) return;
    setBusy(true);
    setErr("");
    try {
      await api.classAction({
        action: "join",
        id: profileId,
        joinCode: input,
        handle: profile?.profile.handle,
      });
      setJoined(true);
    } catch (e) {
      setErr(e instanceof ApiError && e.code ? e.code : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">◉</span> {t("acct.class")}</p>
      <h1>{t("acct.class")}</h1>
      <p className="lead">{t("acct.classNote")}</p>

      {!ready && <p className="lead">{t("common.loading")}</p>}

      {ready && !profileId && (
        <div className="exercise" style={{ marginTop: 20 }}>
          <p style={{ marginTop: 0 }}>{t("onb.acctLead")}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" href={`/onboarding?return=${encodeURIComponent(returnPath)}`}>{t("onb.createAcct")}</Link>
            <Link className="btn ghost" href={`/onboarding?mode=signin&return=${encodeURIComponent(returnPath)}`}>{t("onb.signIn")}</Link>
          </div>
        </div>
      )}

      {ready && profileId && teacherAccount && (
        <div className="alert" style={{ marginTop: 20 }}>
          A teacher account administers classes rather than joining one as a pupil.{" "}
          <Link href="/teacher">{t("teach.title")} →</Link>
        </div>
      )}

      {ready && profileId && !teacherAccount && (
        <div className="exercise" style={{ marginTop: 20 }}>
          <label className="field" style={{ maxWidth: 280 }}>
            <span>{t("teach.invite")}</span>
            <input
              className="mono"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 12)); setErr(""); setJoined(false); }}
              maxLength={12}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
          <button className="btn" onClick={() => void join()} disabled={busy || code.trim().length === 0}>
            {busy ? t("common.loading") : t("acct.class")}
          </button>
          {joined && (
            <p className="small marking good" style={{ padding: "8px 12px", marginTop: 12 }}>
              <span className="mark" aria-hidden="true">✓</span> {t("acct.joined")}{" "}
              <Link href="/dashboard">{t("nav.home")} →</Link>
            </p>
          )}
          {err && <p className="small marking bad" style={{ padding: "8px 12px", marginTop: 12 }}><span className="mark" aria-hidden="true">✗</span> {err}</p>}
        </div>
      )}
    </main>
  );
}