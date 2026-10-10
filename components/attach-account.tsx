"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FROM A DEVICE'S WORK TO A REAL ACCOUNT, IN ONE STEP.
//
// "Continue without an account" is a supported way to use OpenMind — anonymous
// learning is first-class, and the server has ALWAYS supported the other
// direction too: an account created with `claim` takes over the anonymous
// profile exactly, keeping every answered question, diagnostic and
// misconception (app/api/auth/signup/route.ts). What was missing was a place to
// do it, so the interface made a one-way door out of a two-way one:
//
//   · the shell's "Create account" went to /onboarding, which reads this
//     device's remembered account choice ("guest") and so opened on the guest
//     step — the screen that declines an account;
//   · switching that radio to "create account" by hand ran the SIX-STEP
//     enrolment form over the top of a profile that was already complete, from
//     EMPTY field state. A guest who had declared GCSE Higher and three
//     subjects had their country rewritten to the "not mapped" placeholder and
//     their subjects reset to the default — the reform, not the work, was what
//     they lost.
//
// This is the third path: an email, a password, a name, and nothing else to
// re-answer, because the account adopts the learner this device already has.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { signUp, useI18n } from "@/lib/client";

/** The server's refusal codes, in the learner's own language. The same six
 *  strings the enrolment form uses — one vocabulary for one set of refusals,
 *  so the two forms cannot explain the same refusal two ways. */
const ERROR_KEYS: Record<string, string> = {
  email_taken: "onb.errTaken",
  bad_email: "onb.errEmail",
  weak_password: "onb.errPassword",
  long_password: "onb.errPassword",
  bad_name: "onb.errName",
  signup_failed: "onb.errCreate",
};

export default function AttachAccount() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  /** The same rules the server enforces, applied BEFORE the press rather than
   *  reported after it: a form that lets you submit something it knows it will
   *  refuse is a form that wastes the one attempt a first run gets. */
  const problem =
    !email.includes("@") ? (email.length > 0 ? "onb.errEmail" : null)
      : password.length < 8 ? (password.length > 0 ? "onb.errPassword" : null)
        : name.trim().length === 0 ? "onb.errName"
          : null;

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      // `claimCurrent` is the whole point: the new account ADOPTS this device's
      // learner rather than starting a second one beside it. `signUp` reads the
      // claim itself, before it replaces anything on this device.
      await signUp({ email, password, name: name.trim(), claimCurrent: true });
      // No navigation: the session probe has already re-run, so the account
      // page this form sits on re-renders as the signed-in account it now is.
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setErr(t(ERROR_KEYS[code] ?? "onb.errCreate"));
      setBusy(false);
    }
  }

  return (
    <form
      className="exercise"
      style={{ marginTop: 20 }}
      onSubmit={(e) => { e.preventDefault(); if (!problem && !busy) void submit(); }}
    >
      <h2 className="section" style={{ marginTop: 0 }}>{t("acct.attach")}</h2>
      <label className="field">
        <span>{t("onb.email")}</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="amina@example.org"
          required
        />
      </label>
      <label className="field">
        <span>{t("onb.password")}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <p className="small muted">{t("onb.pwNote")}</p>
      <label className="field">
        <span>{t("onb.name")}</span>
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          required
        />
      </label>
      {problem && <p className="field-error" role="status">{t(problem)}</p>}
      {err && (
        <p className="marking bad" style={{ padding: "10px 14px" }}>
          <span className="mark" aria-hidden="true">✗</span> {err}
        </p>
      )}
      <button className="btn" type="submit" disabled={busy || problem !== null}>
        {busy ? t("onb.settingUp") : t("acct.attach")}
      </button>
      <p className="small muted" style={{ marginBottom: 0 }}>{t("onb.verifyNote")}</p>
    </form>
  );
}
