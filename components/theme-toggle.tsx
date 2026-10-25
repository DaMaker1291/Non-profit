"use client";

import { useI18n } from "@/lib/client";

/**
 * THE DARK / LIGHT SWITCH.
 *
 * The only place a theme is CHOSEN. `app/globals.css` owns what each theme looks
 * like; this owns which one is in force, and it does so by writing one
 * attribute on `<html>`.
 *
 * THERE IS DELIBERATELY NO REACT STATE HERE, and that is the whole design. The
 * obvious version — `useState` + `useEffect` reading the stored preference —
 * cannot know the answer while rendering on the server, so the first client
 * paint disagrees with the HTML and then corrects itself: a wrong icon for a
 * frame, and a hydration mismatch. Both icons are rendered instead and CSS
 * decides which one is visible, keyed on the same `data-theme` attribute the
 * stylesheet already reads. That means the correct icon is on screen from the
 * FIRST paint, before any JavaScript has run, and the component never has to
 * guess.
 *
 * The stored value is a preference, not a state: absent means LIGHT, which is
 * what this product ships as. It used to follow the machine's
 * `prefers-color-scheme`, so a learner whose phone happened to be in dark mode
 * met a dark product on their first visit, having chosen nothing — and a
 * learning site is read by daylight, in classrooms, beside a printed page. The
 * dark theme still exists and is still one press away; it is now a choice
 * rather than a surprise. (`data-theme="light"` is the default, `"dark"` the
 * stored alternative; no media query can produce a theme the learner did not
 * ask for.)
 *
 * The icon shows the theme IN FORCE rather than the one the press will produce,
 * so the control reads as what it currently is. That is the convention the
 * published page (`docs/app.js`) already uses, and the two must not disagree
 * about a control that means the same thing on both surfaces.
 */

const KEY = "openmind:theme";
type Theme = "dark" | "light";

/** What is in force RIGHT NOW: the attribute, else the product's own default. */
function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const { t } = useI18n();

  function toggle(): void {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private mode, or a full disk. The theme still changes for this page —
      // losing the PREFERENCE is not a reason to refuse the click.
    }
  }

  return (
    <button
      type="button"
      className="theme-btn"
      onClick={toggle}
      aria-label={t("theme.toggle")}
      title={t("theme.toggle")}
    >
      <svg className="i-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.4" />
        <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
      </svg>
      <svg className="i-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
      </svg>
    </button>
  );
}
