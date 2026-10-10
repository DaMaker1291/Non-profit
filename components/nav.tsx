"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LanguagePicker, useAccount, useI18n, useProfile } from "@/lib/client";
import { ContextStrip } from "@/components/context-strip";
import { ThemeToggle } from "@/components/theme-toggle";
import { ctitle } from "@/lib/content-i18n";
import { CONCEPTS } from "@/lib/genome";
import { SUBJECT_LABELS } from "@/lib/subjects";
import type { SubjectId } from "@/lib/types";

/** The five learning destinations, in the order the product is used.
 *
 *  ONE list, rendered twice: as the desktop sidebar and as the phone's bottom
 *  bar. Two hand-maintained lists is how a destination ends up reachable on a
 *  laptop and missing on the phone the product is actually built for, so the
 *  order here IS the order in both.
 *
 *  Projects is a learning surface (a project produces evidence like any other
 *  work), so it sits in the primary set — not in the overflow with About. */
const PRIMARY = [
  { href: "/dashboard", key: "nav.home", glyph: "⌂" },
  { href: "/learn", key: "nav.learn", glyph: "✎" },
  { href: "/papers", key: "nav.papers", glyph: "▤" },
  { href: "/progress", key: "prog.nav", glyph: "≡" },
  { href: "/mind", key: "mm.yourKnowledge", glyph: "◍" },
  { href: "/projects", key: "proj.eyebrow", glyph: "❖" },
];

/** The four the phone shows without opening anything, plus More. */
const PHONE = PRIMARY.slice(0, 4);

/** Everything that is a place, but not a daily destination. Help and Account
 *  are NOT here: §shell puts them at the foot of the sidebar, in the same
 *  place on every page, because they are the two links a learner reaches for
 *  when something has gone wrong or needs changing — and a menu they have to
 *  open first is exactly the wrong shape for that. */
const UTILITY = [
  { href: "/solve", key: "nav.solve" },
  { href: "/teacher", key: "nav.teach" },
  { href: "/curriculum", key: "nav.currTitle" },
  { href: "/offline", key: "nav.offlineTitle" },
  { href: "/access", key: "nav.accessTitle" },
  { href: "/about", key: "nav.about" },
];

/** The two at the bottom, on their own, always visible. */
const FOOT = [
  { href: "/help", key: "nav.help", glyph: "?" },
  { href: "/account", key: "acct.title", glyph: "◑" },
];

/**
 * THE SIDEBAR and the PHONE BAR.
 *
 * The sidebar is the exercise book's margin: the red rule that has always run
 * down the left of this product is now the edge of the navigation, which is
 * where a margin belongs in a book — you write the index there.
 *
 * It is deliberately two things: where you can GO (the five learning surfaces,
 * always in the same order) and what you are STUDYING (the courses actually
 * recorded on this learner's profile, read from their own record and never
 * invented). "Help" and "Account" sit at the bottom, out of the way of the work.
 */
export function Nav() {
  const { t, lang } = useI18n();
  const { state } = useProfile();
  const path = usePathname();
  const active = (p: string) => (path === p || path.startsWith(p + "/") ? "active" : "");
  // The learner's OWN courses. Absent while the profile is in flight, and
  // absent for a visitor — in which case the sidebar shows the subjects the
  // platform teaches rather than claiming courses this person never chose.
  const courses = state?.profile.subjects ?? [];
  const board = state?.profile.board;

  return (
    <>
      {/* The first tab stop on every page. A sidebar, a top bar and a bottom
          bar are a lot of chrome to walk past with a keyboard. */}
      <a href="#main" className="skip-link">{t("a11y.skip")}</a>

      <aside className="sidebar">
        <Link href="/" className="sidebar-logo">
          OpenMind <span className="stamp">{t("common.free")}</span>
        </Link>

        <nav className="sidebar-nav" aria-label={t("nav.mainAria")}>
          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active(item.href)}`}>
              <span className="glyph" aria-hidden="true">{item.glyph}</span>
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div>
          <p className="sidebar-group">{t("nav.currTitle")}</p>
          {courses.length > 0 ? (
            courses.map((s: SubjectId) => (
              <Link key={s} href={`/learn/${s}`} className={`sidebar-link ${active(`/learn/${s}`)}`}>
                <span className="glyph" aria-hidden="true">·</span>
                {t(SUBJECT_LABELS[s] ?? `subj.${s}`)}
              </Link>
            ))
          ) : (
            <Link href="/learn" className="course-line">
              <b>{t("nav.subjects")}</b>
              <span>{board ? String(board).toUpperCase() : t("nav.setup")}</span>
            </Link>
          )}
        </div>

        <div className="sidebar-spacer" />

        {/* The foot of the sidebar: Help and Account, spelled out. */}
        <nav className="sidebar-nav" aria-label={t("nav.help")}>
          {FOOT.map((item) => (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active(item.href)}`}>
              <span className="glyph" aria-hidden="true">{item.glyph}</span>
              {t(item.key)}
            </Link>
          ))}
          <details className="nav-overflow">
            <summary aria-label={t("nav.moreAria")}>⋯ {t("nav.more")}</summary>
            <div className="nav-overflow-menu">
              {UTILITY.map((item) => (
                <Link key={item.href} href={item.href} className={active(item.href)}>{t(item.key)}</Link>
              ))}
            </div>
          </details>
        </nav>
      </aside>

      {/* The phone: five destinations in the thumb's reach. It is NOT the
          sidebar squeezed onto a phone, and it never scrolls sideways.

          Its own accessible name, deliberately NOT `nav.mainAria`: both this and
          the sidebar are <nav> landmarks, and only one is visible at a given
          width, but a landmark list read by a screen reader does not consult the
          stylesheet. Two landmarks called "Main menu" are two places the user
          cannot tell apart. `nav.bottomAria` names this one for what it is. */}
      <nav className="bottomnav" aria-label={t("nav.bottomAria")}>
        {PHONE.map((item) => (
          <Link key={item.href} href={item.href} className={active(item.href)}>
            <span className="glyph" aria-hidden="true">{item.glyph}</span>
            {t(item.key)}
          </Link>
        ))}
        <details className="nav-overflow">
          <summary aria-label={t("nav.moreAria")}>
            <span className="glyph" aria-hidden="true">⋯</span>
            {t("nav.more")}
          </summary>
          <div className="nav-overflow-menu">
            {[...PRIMARY.slice(4), ...FOOT, ...UTILITY].map((item) => (
              <Link key={item.href} href={item.href} className={active(item.href)}>{t(item.key)}</Link>
            ))}
          </div>
        </details>
      </nav>
    </>
  );
}

/**
 * THE TOP BAR: where you are, what you are looking for, what language, and who
 * you are. Four things, one line, and nothing else — it is chrome, and chrome
 * that grows is chrome that competes with the work.
 *
 * The search is real: it filters the concept graph the learner can actually
 * open, in their interface language, and it says so when it finds nothing.
 */
export function Topbar() {
  const { t, lang } = useI18n();
  const { session, ready } = useAccount();
  // A guest's learner: a profile with no account behind it. The account control
  // distinguishes the two, because "Create account" has to lead somewhere that
  // makes one (see the comment on that link below).
  const { state } = useProfile();
  const path = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    // Two characters: one letter matches most of the genome, which is not a
    // search result, it is the whole curriculum.
    if (needle.length < 2) return [];
    return CONCEPTS.filter((c) => ctitle(lang, c.id).toLowerCase().includes(needle) || c.id.includes(needle)).slice(0, 6);
  }, [q, lang]);

  // Escape closes, as it does everywhere. `aria-expanded` on the input is what
  // tells a screen reader the list exists at all.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) { setOpen(false); setQ(""); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const here = path.startsWith("/learn/")
    ? ctitle(lang, path.split("/")[3] ?? "")
    : path.startsWith("/papers") ? t("nav.papers")
      : path.startsWith("/progress") ? t("prog.title")
        : path.startsWith("/mind") ? t("mm.yourKnowledge")
          : path.startsWith("/teacher") ? t("nav.teach")              : path.startsWith("/learn") ? t("nav.subjects")
              : "";


  return (
    <header className="topbar">
      {/* The phone has no sidebar, so the book's own label lives here. */}
      <Link href="/" className="topbar-logo">OpenMind</Link>
      {/* Not just "Fractions": a learner sent here by the engine should be able
          to see WHICH course this is being taught as, without opening anything. */}
      <div className="topbar-where">
        {here && <b>{here}</b>}
        {/* WHICH COURSE this is being taught as — country, qualification, board,
            year and subject · tier. It used to be a bare subject name and a
            board code, which told a learner nothing about the context the whole
            product was in. See components/context-strip.tsx. */}
        <ContextStrip />
      </div>
      <div className="topbar-spacer" />

      <div className="topbar-search" ref={box} role="search"
        onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
        <input
          type="text"
          value={q}
          placeholder={t("nav.search")}
          aria-label={t("nav.search")}
          aria-expanded={open}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && q.trim().length >= 2 && (
          <div className="search-results">
            {results.length === 0 ? (
              <p className="empty" style={{ margin: 0 }}>{t("learn.notFound")}</p>
            ) : (
              results.map((c) => (
                <Link key={c.id} href={`/learn/${c.subject}/${c.id}`} onClick={() => { setOpen(false); setQ(""); }}>
                  {ctitle(lang, c.id)}
                  <span className="muted small"> · {t(SUBJECT_LABELS[c.subject] ?? `subj.${c.subject}`)}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <LanguagePicker compact />
      {/* Beside the language control, not at the far edge: both are preferences
          about how the product is presented, and grouping them keeps the
          account control as the last thing on the line. */}
      <ThemeToggle />
      {/* There IS an account system now: a signed-in learner gets their own
          name as the entry point, and a guest is offered the real sign-up.
          While the session probe is in flight NEITHER shows: “Create
          account” flashing at a learner who has an account is the precise
          “did OpenMind lose my account?” betrayal — the one thing this slot
          must never do. Silence for one paint is honest; contradiction is
          not. */}
      {/* The label is its own span, and the arrow its own span, because a phone
          has to be able to treat them differently: the label may be TRUNCATED
          (a learner's name is not ours to shorten) and the arrow may be DROPPED
          (it is decoration). Without the wrap the whole button refused to
          shrink and wrapped onto three lines at 390px. */}
      {!ready ? null : session.account ? (
        <Link href="/account" className="btn small" title={session.account.email}>
          <span className="btn-label">{session.account.name || session.account.email}</span>
          <span className="btn-arrow" aria-hidden="true">→</span>
        </Link>
      ) : (
        // A GUEST ALREADY HAS A PROFILE, and "Create account" has to lead
        // somewhere that MAKES one. It went to /onboarding, which reads this
        // device's remembered account choice — "continue without an account" —
        // and opened on the guest step: a learner pressing "Create account" was
        // handed the screen that declines one, and pressing it twice did the
        // same thing twice. The account page is where an existing device's work
        // is shown and attached in one step (components/attach-account.tsx), so
        // that is where a guest is sent; a visitor with nothing here yet still
        // gets the enrolment page, which is what they need.
        <Link href={state ? "/account" : "/onboarding"} className="btn small">
          <span className="btn-label">{t("onb.createAcct")}</span>
          <span className="btn-arrow" aria-hidden="true">→</span>
        </Link>
      )}
    </header>
  );
}
