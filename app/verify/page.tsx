"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE PAGE A CONFIRMATION LINK LANDS ON.
//
// It reads the token from the URL and POSTS it (see app/api/auth/verify): the
// GET that a mail scanner performs must not be the thing that confirms an
// address, so opening this page decides nothing until the learner's own browser
// makes the POST.
//
// THE TOKEN IS READ FROM `window.location.search` IN AN EFFECT rather than
// `useSearchParams`, which would force a Suspense boundary on a page whose whole
// content is "checking…". There is nothing to prefetch here and nothing to
// stream: the page is a single status line.
//
// EVERY FAILURE SAYS THE SAME THING, and the one thing it must never do is imply
// the account is broken. An expired or already-used link means the address may
// already be confirmed; the way forward is a new link from `/account`, and the
// page says so with the door to it.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n, verifyEmail } from "@/lib/client";

type Phase = "checking" | "ok" | "failed" | "missing";

export default function VerifyPage() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("checking");
  // A ref, not state: React 18 in development renders effects twice, and the
  // token is single-use — the second POST would confirm nothing and paint a
  // failure over the success the first one just earned.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const raw = new URLSearchParams(window.location.search).get("token");
    if (!raw) { setPhase("missing"); return; }

    verifyEmail(raw).then((r) => {
      setPhase(r.verified ? "ok" : "failed");
    }).catch(() => {
      // A network failure is not proof the token is bad, but the learner can act
      // on the same advice either way: open the link again, or ask for a new one.
      setPhase("failed");
    });
  }, []);

  return (
    <main className="container narrow" style={{ paddingTop: 44 }}>
      <p className="eyebrow">{t("ver.title")}</p>
      {phase === "checking" && <p className="lead">{t("ver.checking")}</p>}

      {phase === "ok" && (
        <>
          <h1>{t("ver.ok")}</h1>
          <p className="lead">{t("ver.verified")}</p>
          <p><Link className="btn" href="/dashboard">{t("ver.home")} →</Link></p>
        </>
      )}

      {phase === "missing" && (
        <>
          <h1>{t("ver.title")}</h1>
          <p className="lead">{t("ver.missing")}</p>
          <p><Link className="btn ghost" href="/account">{t("ver.resend")} →</Link></p>
        </>
      )}

      {phase === "failed" && (
        <>
          <h1>{t("ver.failed")}</h1>
          <p className="lead">{t("ver.failedWhy")}</p>
          <p><Link className="btn ghost" href="/account">{t("ver.resend")} →</Link></p>
        </>
      )}
    </main>
  );
}
