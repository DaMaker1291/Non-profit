"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LanguagePicker, useAccount, useI18n, useProfile } from "@/lib/client";
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
          sidebar squeezed onto a phone, and it never scrolls sideways. */}
      <nav className="bottomnav" aria-label={t("nav.mainAria")}>
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
          : path.startsWith("/teacher") ? t("nav.teach")
            : path.startsWith("/learn") ? t("nav.subjects")
              : "";
  const subjects = state?.profile.subjects ?? [];

  return (
    <header className="topbar">
      {/* The phone has no sidebar, so the book's own label lives here. */}
      <Link href="/" className="topbar-logo">OpenMind</Link>
      {/* Not just "Fractions": a learner sent here by the engine should be able
          to see WHICH course this is being taught as, without opening anything. */}
      <div className="topbar-where">
        {here && <b>{here}</b>}
        {subjects.length > 0 && (
          <span>
            {t(SUBJECT_LABELS[subjects[0]] ?? `subj.${subjects[0]}`)}
            {state?.profile.board ? ` · ${String(state.profile.board).toUpperCase()}` : ""}
          </span>
        )}
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
    </header>
  );
}
