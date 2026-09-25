"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchProfile, loadLocalProfileId, loadLocalProfileSecret, signOut, updateAccount, useAccount, useI18n } from "@/lib/client";
import type { ProfileState } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Your account. Until this page existed, "saving your work" was a claim the
// product could not back up: the only record lived in this browser. Here a
// learner sees which account holds their data, how much of it there is, and can
// change their password or sign out — and a guest is told plainly that their
// work is on this device only.
// ─────────────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { t } = useI18n();
  const { session, ready } = useAccount();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  // ── Join a class by code ──
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinedMsg, setJoinedMsg] = useState("");
  const [joinErr, setJoinErr] = useState("");

  useEffect(() => {
    const id = loadLocalProfileId();
    if (id) fetchProfile(id).then((s) => s && setProfile(s));
  }, [session.account]);

  useEffect(() => {
    if (session.account) setName(session.account.name);
  }, [session.account]);

  async function joinClass() {
    const code = classCode.trim().toUpperCase();
    if (!code) return;
    const id = loadLocalProfileId();
    const secret = loadLocalProfileSecret();
    if (!id || !secret) { setJoinErr(t("common.error")); return; }
    setJoining(true);
    setJoinErr("");
    setJoinedMsg("");
    try {
      const res = await fetch("/api/classes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, secret, action: "join", joinCode: code, handle: profile?.profile.handle }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setJoinErr(j.error ?? `HTTP ${res.status}`); return; }
      // One snapshot of the learner model joins the roster's stored record;
      // from here the teacher's table reads the LEDGER, which updates itself
      // as the learner answers — nothing more needs sending.
      if (profile) {
        const mastery: Record<string, number> = {};
        for (const [cid, p] of Object.entries(profile.progress)) mastery[cid] = p.mastery;
        void fetch("/api/classes", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, secret, action: "report", joinCode: code, handle: profile.profile.handle, conceptMastery: mastery }),
        });
      }
      setJoinedMsg(t("acct.joined"));
      setClassCode("");
    } catch {
      setJoinErr(t("common.error"));
    } finally {
      setJoining(false);
    }
  }

  async function saveName() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await updateAccount({ name });
      setMsg(t("acc.saved"));
    } catch {
      setErr(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await updateAccount({ currentPassword: current, newPassword: next });
      setCurrent("");
      setNext("");
      setMsg(t("acc.saved"));
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setErr(code === "bad_current_password" ? t("acct.errCurrent") : t("onb.pwNote"));
    } finally {
      setBusy(false);
    }
  }

  const attempts = profile
    ? Object.values(profile.progress).reduce((s, p) => s + (p.attempts ?? 0), 0)
    : 0;
  const touched = profile ? Object.keys(profile.progress).length : 0;

  return (
    <main className="container narrow" style={{ paddingTop: 32, maxWidth: 720 }}>
      <p className="eyebrow"><span className="no">◉</span> {t("acct.title")}</p>

      {!ready && <p className="lead">{t("common.loading")}</p>}

      {ready && !session.account && (
        <>
          <h1>{t("acct.title")}</h1>
          <p className="lead">{t("acct.noAccount")}</p>
          <p>
            <Link className="btn" href="/onboarding">{t("onb.createAcct")} →</Link>
          </p>
        </>
      )}

      {ready && session.account && (
        <>
          <h1>{session.account.email}</h1>
          <p className="lead">{t("acct.lead")}</p>
          <p className="small muted">{t("onb.verifyNote")}</p>

          <div className="exercise" style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
              <div>
                <div className="stat">{attempts}</div>
                <div className="stat-label">{t("prog.attempts")}</div>
              </div>
              <div>
                <div className="stat">{touched}</div>
                <div className="stat-label">{t("map.concepts")}</div>
              </div>
            </div>

            <label className="field">
              <span>{t("onb.name")}</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </label>
            <button className="btn small" onClick={saveName} disabled={busy}>{t("common.save")}</button>

            <h3 style={{ marginTop: 24 }}>{t("acct.class")}</h3>
            <p className="small muted" style={{ marginTop: 4 }}>{t("acct.classNote")}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <input
                type="text"
                placeholder="ABC123"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && joinClass()}
                maxLength={6}
                className="mono"
                style={{ maxWidth: 140 }}
              />
              <button className="btn small" onClick={joinClass} disabled={joining || classCode.trim().length === 0}>
                {t("acct.class")}
              </button>
            </div>
            {joinedMsg && <p className="small marking good" style={{ padding: "8px 12px", marginTop: 10 }}><span className="mark" aria-hidden="true">✓</span> {joinedMsg}</p>}
            {joinErr && <p className="small marking bad" style={{ padding: "8px 12px", marginTop: 10 }}><span className="mark" aria-hidden="true">✗</span> {joinErr}</p>}

            <h3 style={{ marginTop: 24 }}>{t("acct.change")}</h3>
            <div className="grid cols2">
              <label className="field">
                <span>{t("acct.currentPw")}</span>
                <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </label>
              <label className="field">
                <span>{t("acct.newPw")}</span>
                <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
              </label>
            </div>
            <p className="small muted">{t("onb.pwNote")}</p>
            <button className="btn small" onClick={savePassword} disabled={busy || !current || !next}>
              {busy ? t("onb.settingUp") : t("common.save")}
            </button>

            {msg && <p className="small" style={{ marginTop: 12 }}>{msg}</p>}
            {err && <p className="marking bad" style={{ padding: "10px 14px" }}><span className="mark" aria-hidden="true">✗</span> {err}</p>}

            <div style={{ marginTop: 24 }}>
              <button
                className="btn"
                onClick={async () => {
                  await signOut();
                  window.location.href = "/";
                }}
              >
                {t("onb.signOut")}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
