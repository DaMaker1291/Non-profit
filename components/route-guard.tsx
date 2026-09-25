"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE ONE GUARD (P0). Mounted once in the app shell, wrapping every page, so no
// page has to decide whether it is allowed to exist. The decision itself is
// pure and lives in `lib/app-state.ts#resolveRoute`; this component only acts
// on it.
//
// Three outcomes, and each one is visible rather than silent:
//   allow    → render the page
//   boot     → the session probe has not answered yet, so NOTHING is concluded
//              (this is the state that used to look like "signed out")
//   redirect → the learner is not where they can be yet, and their destination
//              is remembered (`?return=`) so they come back to what they asked
//              for instead of being dumped somewhere sensible
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useI18n, useRouteAccess } from "@/lib/client";

export function RouteGuard({ children }: { children: ReactNode }) {
  const { decision } = useRouteAccess();
  const router = useRouter();
  const { t } = useI18n();
  const to = decision.action === "redirect" ? decision.to : undefined;

  useEffect(() => {
    if (to) router.replace(to);
  }, [to, router]);

  if (decision.action === "allow") return <>{children}</>;

  return (
    <main className="container narrow" style={{ paddingTop: 44 }}>
      <p className="eyebrow">
        <span className="no">§</span> {t("state.moving")}
      </p>
      <p className="lead">{t(decision.reasonKey)}</p>
      {to ? (
        // For the frame or two the navigation takes — and for anyone whose
        // browser blocks it — the move must still be actionable by hand.
        <Link href={to} className="btn">
          {t("common.next")} →
        </Link>
      ) : (
        <p className="small muted">{t("state.bootNote")}</p>
      )}
    </main>
  );
}
