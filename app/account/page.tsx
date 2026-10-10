"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchProfile, loadLocalProfileId, loadLocalProfileSecret, saveProfilePatch, signOut, updateAccount, useAccount, useI18n } from "@/lib/client";
import * as api from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import AttachAccount from "@/components/attach-account";
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
  // ── The school a teacher teaches at ──
  // It lives on the PROFILE, not on each class: a teacher with five classes in
  // one school has one school, and five copies would drift. Optional in both
  // directions — a tutor working alone leaves it empty, and emptying it clears
  // it rather than storing an empty string.
  const [school, setSchool] = useState("");
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
  // ── Privacy: export, and the right to erasure (§23) ──
  // Erasure is consent-gated twice: the learner must first reveal the control
  // (a stray click must never delete a history), then type ERASE to confirm.
  const [showErase, setShowErase] = useState(false);
  const [eraseWord, setEraseWord] = useState("");
  const [erasing, setErasing] = useState(false);
  const [eraseErr, setEraseErr] = useState("");

  useEffect(() => {
    const id = loadLocalProfileId();
    if (id) fetchProfile(id).then((s) => s && setProfile(s));
  }, [session.account]);

  useEffect(() => {
    if (session.account) setName(session.account.name);
  }, [session.account]);

  useEffect(() => {
    setSchool(profile?.profile.school ?? "");
  }, [profile]);

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
      try {
        await api.classAction({ action: "join", id, joinCode: code, handle: profile?.profile.handle });
      } catch (e) {
        setJoinErr(e instanceof ApiError && e.code ? e.code : (e instanceof ApiError ? `HTTP ${e.status}` : t("common.error")));
        return;
      }
      // One snapshot of the learner model joins the roster's stored record;
      // from here the teacher's table reads the LEDGER, which updates itself
      // as the learner answers — nothing more needs sending. A report that
      // fails does not undo the join, so it is not allowed to block the news.
      if (profile) {
        const mastery: Record<string, number> = {};
        for (const [cid, p] of Object.entries(profile.progress)) mastery[cid] = p.mastery;
        void api.classAction({
          action: "report", id, joinCode: code,
          handle: profile.profile.handle, conceptMastery: mastery,
        }).catch(() => { /* the roster refreshes from the ledger anyway */ });
      }
      setJoinedMsg(t("acct.joined"));
      setClassCode("");
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

  async function saveSchool() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const state = await saveProfilePatch({ school });
      setProfile(state);
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
  /** THIS DEVICE ALREADY HAS A LEARNER ON IT. It is not an account — there is
   *  nothing to sign out of — but it is not nothing either, and the screen a
   *  learner sees here has to know the difference (see the two branches below). */
  const hasGuest = profile !== null;

  return (
    <main className="container narrow" style={{ paddingTop: 32, maxWidth: 720 }}>
      <p className="eyebrow"><span className="no">◉</span> {t("acct.title")}</p>

      {!ready && <p className="lead">{t("common.loading")}</p>}

      {/* ── NO ACCOUNT: TWO DIFFERENT PEOPLE, TWO DIFFERENT SCREENS ───────────
          A device with a learner on it is a GUEST, not a stranger. Telling them
          "you are not signed in" and offering a link to enrolment answered a
          question they had not asked and hid the one they had: their work is
          real, it is on this device, and an account takes it with them. The two
          cases read differently because they ARE different — one has something
          to lose and something to attach, the other has not started. */}
      {ready && !session.account && (
        hasGuest ? (
          <>
            <h1>{t("acct.title")}</h1>
            <p className="lead">{t("acct.guestLead")}</p>
            {/* What is on this device, counted from the profile itself — read
                only once it has actually loaded, because "0 answers" while the
                fetch is in flight would be a claim about the learner rather
                than a fact about the request. */}
            {profile && (
              <div className="exercise" style={{ marginTop: 20 }}>
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <div className="stat">{attempts}</div>
                    <div className="stat-label">{t("prog.attempts")}</div>
                  </div>
                  <div>
                    <div className="stat">{touched}</div>
                    <div className="stat-label">{t("map.concepts")}</div>
                  </div>
                </div>
              </div>
            )}
            <AttachAccount />
            <p style={{ marginTop: 16 }}>
              <Link href="/onboarding?mode=signin">{t("onb.signIn")} →</Link>
            </p>
          </>
        ) : (
          <>
            <h1>{t("acct.title")}</h1>
            <p className="lead">{t("acct.noAccount")}</p>
            <p>
              <Link className="btn" href="/onboarding">{t("onb.createAcct")} →</Link>
            </p>
          </>
        )
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

            {/* A learner has no school to record; a teacher (or a school
                account) does, and it is what the class panels show beside the
                qualification. Hidden entirely for students, so the field is
                never a question the wrong person is asked. */}
            {session.account.role !== "student" && (
              <>
                <h3 style={{ marginTop: 24 }}>{t("teach.school")}</h3>
                <p className="small muted" style={{ marginTop: 4 }}>{t("teach.schoolHint")}</p>
                <label className="field">
                  <span>{t("teach.school")}</span>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveSchool()}
                    maxLength={80}
                  />
                </label>
                <button className="btn small" onClick={saveSchool} disabled={busy}>{t("common.save")}</button>
              </>
            )}

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

            <h3 style={{ marginTop: 24 }}>{t("acct.privacyTitle")}</h3>
            <p className="small muted" style={{ marginTop: 4 }}>{t("acct.privacyNote")}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              {/* The machine-readable export: profile, model state and the
                  evidence ledger itself — the learner's data, in their hands. */}
              <a
                className="btn ghost small"
                href={`/api/my-data?id=${encodeURIComponent(profile?.profile.id ?? "")}&secret=${encodeURIComponent(loadLocalProfileSecret() ?? "")}`}
                download="openmind-my-data.json"
              >
                {t("acct.exportBtn")}
              </a>
            </div>
            {!showErase ? (
              <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => { setShowErase(true); setEraseErr(""); }}>
                {t("acct.eraseReveal")}
              </button>
            ) : (
              <div style={{ marginTop: 10 }}>
                <p className="small marking bad" style={{ padding: "8px 12px", maxWidth: 520 }}>
                  <span className="mark" aria-hidden="true">✗</span> {t("acct.eraseWarn")}
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={eraseWord}
                    onChange={(e) => setEraseWord(e.target.value.toUpperCase())}
                    placeholder="ERASE"
                    maxLength={8}
                    className="mono"
                    style={{ maxWidth: 140 }}
                    aria-label={t("acct.eraseWordLabel")}
                  />
                  <button
                    className="btn small"
                    disabled={erasing || eraseWord !== "ERASE"}
                    onClick={async () => {
                      const pid = profile?.profile.id;
                      if (!pid) return;
                      setErasing(true);
                      setEraseErr("");
                      try {
                        // The confirmation word is part of the OPERATION, so no
                        // caller can erase a learner without meaning to.
                        await api.eraseProfile(pid);
                        // The record is gone; the session is too. A sign-out
                        // lands the learner on a fresh Home — nothing of the
                        // old profile is left on this device to read.
                        await signOut();
                        window.location.href = "/";
                      } catch {
                        setEraseErr(t("common.error"));
                      } finally {
                        setErasing(false);
                      }
                    }}
                  >
                    {erasing ? t("common.loading") : t("acct.eraseBtn")}
                  </button>
                  <button className="btn ghost small" onClick={() => { setShowErase(false); setEraseWord(""); }}>
                    {t("acct.eraseCancel")}
                  </button>
                </div>
                {eraseErr && <p className="small" style={{ color: "var(--margin-red)", marginTop: 8 }}>{eraseErr}</p>}
              </div>
            )}

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
