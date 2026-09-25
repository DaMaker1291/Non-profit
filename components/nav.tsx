"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguagePicker, useAccount, useI18n } from "@/lib/client";

/** The book label at the top of every page.
 *
 *  Two identity rules, enforced here and nowhere else:
 *  1. A signed-in learner NEVER sees "Create account" as an action — their
 *     entry point is their own name. A guest is offered the real sign-up.
 *     Both at once tells the learner the app lost their account, and it is
 *     the fastest way to destroy trust in a free product.
 *  2. Learning surfaces (Learn · Papers · Review · Progress) stay in the bar;
 *     utility pages fold into the ⋯ overflow. Fewer competing labels.
 */
export function Nav() {
  const { t } = useI18n();
  const { session, ready } = useAccount();
  const path = usePathname();
  const active = (p: string) => (path === p || path.startsWith(p + "/") ? "active" : "");
  return (
    <nav className="masthead">
      <div className="masthead-inner">
        <Link href="/" className="masthead-logo">
          OpenMind <span className="stamp">{t("common.free")}</span>
        </Link>
        <div className="masthead-links">
          <Link href="/dashboard" className={active("/dashboard")}>{t("nav.home")}</Link>
          <Link href="/learn" className={active("/learn")}>{t("nav.learn")}</Link>
          <Link href="/papers" className={active("/papers")}>{t("nav.papers")}</Link>
          <Link href="/progress" className={active("/progress")}>{t("prog.nav")}</Link>
          {/* Utility pages in one overflow so the bar stays a learning bar. */}
          <details className="nav-overflow">
            <summary aria-label={t("nav.moreAria")}>⋯</summary>
            <div className="nav-overflow-menu">
              <Link href="/solve" className={active("/solve")}>{t("nav.solve")}</Link>
              <Link href="/teacher" className={active("/teacher")}>{t("nav.teach")}</Link>
              <Link href="/curriculum" className={active("/curriculum")}>{t("nav.currTitle")}</Link>
              <Link href="/offline" className={active("/offline")}>{t("nav.offlineTitle")}</Link>
              <Link href="/access" className={active("/access")}>{t("nav.accessTitle")}</Link>
              <Link href="/about" className={active("/about")}>{t("nav.about")}</Link>
            </div>
          </details>
        </div>
        <div className="masthead-spacer" />
        <LanguagePicker compact />
        {/* There IS an account system now: a signed-in learner gets their own
            name as the entry point, and a guest is offered the real sign-up.
            While the session probe is in flight NEITHER shows: “Create
            account” flashing at a learner who has an account is the precise
            “did OpenMind lose my account?” betrayal — the one thing this slot
            must never do. Silence for one paint is honest; contradiction is
            not. */}
        {!ready ? null : session.account ? (
          <Link href="/account" className="btn small" title={session.account.email}>
            {session.account.name || session.account.email} →
          </Link>
        ) : (
          <Link href="/onboarding" className="btn small">
            {t("onb.createAcct")} →
          </Link>
        )}
      </div>
    </nav>
  );
}
