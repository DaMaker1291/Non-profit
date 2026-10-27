"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LanguagePicker, useAccount, useAppState, useI18n, useProfile } from "@/lib/client";
import { ContextStrip } from "@/components/context-strip";
import { Icon, type IconName } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { ctitle, levelLabel } from "@/lib/content-i18n";
import { CONCEPTS } from "@/lib/genome";
import { specForProfile } from "@/lib/specifications";
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
  { href: "/dashboard", key: "nav.home", icon: "home" as IconName },
  { href: "/learn", key: "nav.learn", icon: "learn" as IconName },
  { href: "/papers", key: "nav.papers", icon: "papers" as IconName },
  { href: "/progress", key: "prog.nav", icon: "progress" as IconName },
  { href: "/mind", key: "mm.yourKnowledge", icon: "mind" as IconName },
  { href: "/projects", key: "proj.eyebrow", icon: "projects" as IconName },
];

/**
 * A TEACHER'S NAVIGATION IS A TEACHER'S NAVIGATION.
 *
 * The product's two halves hang off the account's role, and this is the half a
 * teacher could not see: their platform was one item inside the "⋯ More"
 * overflow, under a sidebar that named Home, Learn, Papers, Progress, Mind and
 * Projects — a learner's list. A teacher who signed up read the same chrome as a
 * child, opened Home onto a learner's dashboard offering them a baseline
 * diagnostic, and had no visible way to reach the work they came here to set.
 * Nothing was different for them because nothing here asked who they were.
 *
 * So their list is their own: Teacher tools is where their classes are, it is the
 * FIRST item, and the learner's Home is not in it at all — a teacher's Home is
 * their class list (lib/app-state.ts#homeRouteFor), and offering a second "Home"
 * that means somebody else's dashboard is the confusion, not the fix. The
 * learning surfaces stay below it: a teacher is allowed to practise, and
 * subtracting them would be its own kind of wrong.
 */
const TEACHER_PRIMARY = [
  { href: "/teacher", key: "teach.title", icon: "teach" as IconName },
  ...PRIMARY.filter((i) => i.href !== "/dashboard"),
];

/** The four the phone shows without opening anything, plus More. */
const phoneOf = (list: typeof PRIMARY) => list.slice(0, 4);

/**
 * A VISITOR'S NAVIGATION IS NOT A LEARNER'S, AND IT IS NOT EMPTY.
 *
 * The front page is a visitor's page, so it used to carry the learner's sidebar:
 * Home, Learn, Exam papers, My evidence, Your knowledge, Projects and a list of
 * subjects they had never chosen, above a course card reading "Subjects · Set
 * up". A stranger reads that as "I am logged into somebody's account", which is
 * the opposite of the thing the page is trying to say — and every one of those
 * links is behind the route guard, so four of the six bounced them back to
 * enrolment.
 *
 * What a visitor actually needs is the four public questions: what the syllabus
 * is, what teachers get, how accessibility works, and what this is. They all sit
 * under the final link, About, and the enrolment action is a button rather than
 * the sixth item in a menu.
 */
const VISITOR_PRIMARY = [
  { href: "/curriculum", key: "nav.currTitle", icon: "mind" as IconName },
  { href: "/teacher", key: "nav.teach", icon: "teach" as IconName },
  { href: "/access", key: "nav.accessTitle", icon: "access" as IconName },
  { href: "/help", key: "nav.help", icon: "help" as IconName },
];

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
  { href: "/help", key: "nav.help", icon: "help" as IconName },
  { href: "/account", key: "acct.title", icon: "account" as IconName },
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
  // The learner's own declared subjects, for the one-line summary under the
  // course card. Absent while the profile is in flight and for a visitor.
  // WHOSE APP THIS IS. The role is the account's, so it is read from the
  // session-shaped lifecycle rather than from the profile — a profile cannot
  // know it teaches, and `deriveLifecycle` already carries the answer.
  const { lifecycle } = useAppState();
  const isTeacher = lifecycle.isTeacher;
  const primary = isTeacher ? TEACHER_PRIMARY : PRIMARY;
  const phone = phoneOf(primary);
  // `/teacher` is already the first item of a teacher's own list; leaving it in
  // the overflow as well would offer the same door twice under two names.
  const utility = isTeacher ? UTILITY.filter((i) => i.href !== "/teacher") : UTILITY;
  // A VISITOR is offered only doors that open. `state` is null for a stranger,
  // and the learner's list replaces this one the moment a record arrives.
  const visitor = !state?.profile;
  const items = visitor ? VISITOR_PRIMARY : primary;
  const phoneItems = visitor ? VISITOR_PRIMARY.slice(0, 3) : phone;
  /** ONE DESTINATION, ONE ENTRY. A menu that repeats a row already visible above
   *  it makes the learner read the same label twice and — because React keys on
   *  the href — logged two errors per render once the visitor's Help was both a
   *  navigation row and an overflow row. */
  const unique = <T extends { href: string }>(list: T[]): T[] =>
    list.filter((it, i, arr) => arr.findIndex((x) => x.href === it.href) === i);
  const sidebarOverflow = unique(utility).filter((i) => !items.some((x) => x.href === i.href));
  const phoneOverflow = unique([...items.slice(visitor ? 3 : 4), ...FOOT, ...utility]);

  /** THE COURSE, AS ONE CARD.
   *
   *  The sidebar used to list one row per declared subject under "Your
   *  curriculum" — five rows that said the same thing as the Learn page, in the
   *  navigation, on every screen. A learner reads that once and then never again;
   *  what they need from this corner of the shell is the course they are being
   *  taught, named once (GCSE · Higher tier · Year 10), and a way to change it.
   *  A subject list belongs on the page that is about subjects.
   *
   *  Resolved through `specForProfile`, so the card can only ever name a course
   *  the learner's own record resolves — a course still being chosen falls back
   *  to the setup prompt rather than to a guess. */
  const course = useMemo(() => {
    const p = state?.profile;
    const subject = p?.subjects?.[0];
    if (!p || !subject) return null;
    try {
      const active = specForProfile(p, subject);
      return {
        subject: t(SUBJECT_LABELS[subject] ?? `subj.${subject}`),
        course: active.spec.name,
        tier: active.level ? levelLabel(lang, active.level.tier, active.level.name) : "",
        grade: p.grade ?? "",
      };
    } catch {
      return null;
    }
  }, [state, lang, t]);

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
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active(item.href)}`}>
              <span className="glyph" aria-hidden="true"><Icon name={item.icon} /></span>
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* ONE CARD FOR THE COURSE, not one row per subject. See `course`
            above. A teacher with nothing recorded of their own has no course to
            name — their curricula are declared per class — so it is absent for
            them rather than showing the learner's setup prompt. */}
        {/* NOTHING HERE FOR A VISITOR. A launcher used to sit in this corner as
            well as in the hero — two calls to the same action on one screen,
            which is what "one primary action" means not doing. The hero owns
            it, and this space stays empty rather than repeating the hero's own
            sentence in the margin. */}
        {visitor ? null : !(isTeacher && !course) ? (
          <div className="sidebar-course">
            <p className="sidebar-group">{t("nav.currTitle")}</p>
            <Link href="/curriculum" className={`course-line ${active("/curriculum")}`}>
              <b>{course ? course.subject : t("nav.subjects")}</b>
              <span>
                {course
                  ? [course.course, course.tier, course.grade].filter((x) => x && x.trim().length > 0).join(" · ")
                  : t("nav.setup")}
              </span>
            </Link>
            <Link href="/learn" className="sidebar-subjects">
              {(state?.profile.subjects ?? []).map((s: SubjectId) => t(SUBJECT_LABELS[s] ?? `subj.${s}`)).join(" · ")}
              {" →"}
            </Link>
          </div>
        ) : null}

        <div className="sidebar-spacer" />

        {/* The foot of the sidebar: Help and Account, spelled out. */}
        <nav className="sidebar-nav" aria-label={t("nav.help")}>
          {/* A visitor already has Help in the list above, so the foot carries
              the one destination that list does not: their account. */}
          {(visitor ? FOOT.filter((i) => i.href !== "/help") : FOOT).map((item) => (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active(item.href)}`}>
              <span className="glyph" aria-hidden="true"><Icon name={item.icon} /></span>
              {t(item.key)}
            </Link>
          ))}
          <details className="nav-overflow">
            <summary aria-label={t("nav.moreAria")}>
              <span className="glyph" aria-hidden="true"><Icon name="more" /></span>
              {t("nav.more")}
            </summary>
            <div className="nav-overflow-menu">
              {sidebarOverflow.map((item) => (
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
        {phoneItems.map((item) => (
          <Link key={item.href} href={item.href} className={active(item.href)}>
            <span className="glyph" aria-hidden="true"><Icon name={item.icon} /></span>
            {t(item.key)}
          </Link>
        ))}
        <details className="nav-overflow">
          <summary aria-label={t("nav.moreAria")}>
            <span className="glyph" aria-hidden="true"><Icon name="more" /></span>
            {t("nav.more")}
          </summary>
          <div className="nav-overflow-menu">
            {phoneOverflow.map((item) => (
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
  /* On a CONCEPT page the subject is the parent, and naming it is what turns a
     bare title into a position: "Mathematics / Quadratics" locates the learner
     in the curriculum; "Quadratics" alone is a word floating in a header. It is
     the only parent shown — a two-item trail, because a full breadcrumb in a
     62px bar is chrome pretending to be content. */
  // The subject comes from the CONCEPT, never from the URL segment. The route
  // accepts either spelling (`/learn/mathematics/quadratics` is what a learner
  // links to, `/learn/maths/...` is what the sidebar emits), and reading the
  // segment gave `subj.mathematics` — a missing dictionary key printed as its own
  // name across the top of the page. The concept knows which subject it is.
  const parent = path.startsWith("/learn/")
    ? (() => {
      const conceptId = path.split("/")[3] ?? "";
      const s = CONCEPTS.find((c) => c.id === conceptId)?.subject;
      return s ? t(SUBJECT_LABELS[s] ?? `subj.${s}`) : "";
    })()
    : "";


  return (
    <header className="topbar">
      {/* The phone has no sidebar, so the book's own label lives here. */}
      <Link href="/" className="topbar-logo">OpenMind</Link>
      {/* Not just "Fractions": a learner sent here by the engine should be able
          to see WHICH course this is being taught as, without opening anything. */}
      <div className="topbar-where">
        {parent && (
          <span className="crumb-sec">
            {parent}
            <span className="crumb-sep" aria-hidden="true">/</span>
          </span>
        )}
        {here && <b>{here}</b>}
        {/* WHICH COURSE this is being taught as — country, qualification, board,
            year and subject · tier. It used to be a bare subject name and a
            board code, which told a learner nothing about the context the whole
            product was in. See components/context-strip.tsx. */}
        <ContextStrip />
      </div>
      <div className="topbar-spacer" />

      {/* A STRANGER HAS NOTHING TO SEARCH. The box filters the concept graph a
          learner can open, and every result behind it is a gated page — so on
          the front page it was a control whose only outcomes were a bounce back
          to enrolment. It appears with the record it searches. */}
      {state && (
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
              <p className="empty">{t("learn.notFound")}</p>
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
      )}

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
      ) : state ? (
        // A GUEST ALREADY HAS A PROFILE, and "Create account" has to lead
        // somewhere that MAKES one. It went to /onboarding, which reads this
        // device's remembered account choice — "continue without an account" —
        // and opened on the guest step: a learner pressing "Create account" was
        // handed the screen that declines one, and pressing it twice did the
        // same thing twice. The account page is where an existing device's work
        // is shown and attached in one step (components/attach-account.tsx).
        //
        // AND IT IS QUIET NOW. A learner mid-session was reading this as the
        // loudest control on their page — a filled button, beside the work they
        // came to do, asking them to make an account. The capability (it opens
        // /account and does the attach) is unchanged; the rank is not.
        <Link href="/account" className="btn small ghost">
          <span className="btn-label">{t("onb.createAcct")}</span>
          <span className="btn-arrow" aria-hidden="true">→</span>
        </Link>
      ) : (
        // A visitor's one action on every marketing page is the one the front
        // page leads with. It used to read "Create account" on a product whose
        // whole promise is that an account is optional.
        <Link href="/onboarding" className="btn small">
          <span className="btn-label">{t("home.start")}</span>
          <span className="btn-arrow" aria-hidden="true">→</span>
        </Link>
      )}
    </header>
  );
}
