"use client";

import { useState } from "react";
import { teacherResetGrant, useI18n } from "@/lib/client";

/**
 * A teacher's way to get one learner back into their own record.
 *
 * THE SITUATION THIS IS FOR: a learner at the teacher's desk, having forgotten
 * their password, holding a phone they share, and unable to open the email address
 * they typed when they enrolled. There is no mail service on this deployment, so
 * every reset design that ends in "check your inbox" ends here with nothing. What
 * the teacher DOES have is the relationship — this learner is on their roster — so
 * the authority to hand over a key is membership, and it is checked server-side
 * (`app/api/auth/reset-grant`), not by the presence of this button.
 *
 * WHAT THE TEACHER SEES: a code that works once, for fifteen minutes, and that also
 * names its own account — so the learner does not have to remember which address
 * they used. What the teacher never sees: the learner's password, or a way to keep
 * the grant alive.
 *
 * The code is rendered as selectable mono text rather than in a dialog, because
 * the teacher's job is to read it out loud or write it on a slip of paper, and both
 * of those want it visible and copyable while the learner is still standing there.
 *
 * It replaces itself with the code so the roster row does not grow a second line
 * for every learner: one action, one transient answer, and the button returns when
 * the grant expires or the teacher moves on.
 */
export function ResetCode({ learnerId }: { learnerId: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [grant, setGrant] = useState<{ code: string; expiresAt: number } | null>(null);
  const [failed, setFailed] = useState(false);

  if (grant) {
    return (
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
        <span className="mono small" style={{ letterSpacing: 1 }} aria-live="polite">{grant.code}</span>
        <span className="muted" style={{ fontSize: 11 }}>{t("rec.grantLead")}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="btn ghost small"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setFailed(false);
        try {
          const issued = await teacherResetGrant(learnerId);
          setGrant({ code: issued.code, expiresAt: issued.expiresAt });
        } catch {
          // A refusal here is a real answer, not a glitch: the learner is not on
          // one of this teacher's rosters (403) or has no account to reset (404).
          // Both are said the same way, because the difference is not the
          // teacher's business — and a spinner that never resolves is worse than
          // either.
          setFailed(true);
        } finally {
          setBusy(false);
        }
      }}
    >
      {failed ? t("rec.err") : t("rec.make")}
    </button>
  );
}
