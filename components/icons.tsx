/**
 * THE ICON SET.
 *
 * One 24px grid, one stroke weight, one drawing convention: no fills, no
 * rounded corners invented per icon, `currentColor` for the ink. That is what
 * makes a set read as a set — the reason the navigation previously did not is
 * that it was not a set at all. It was `⌂ ✎ ▤ ≡ ◍ ❖ ◆ ? ◑ ⋯`, which are font
 * glyphs borrowed from the math and dingbat blocks: each one is drawn by
 * whatever font the device happens to have, at that font's own weight and
 * optical size, and a cheap Android phone renders several of them as tofu.
 * They could also never share the type's colour, weight or alignment.
 *
 * These are drawn rather than imported because a dependency for eleven icons is
 * a network, a licence and a bundle step for something a learner sees at 20px;
 * and because the shapes here are the product's own — `mind` is the knowledge
 * graph, `papers` is an exam booklet, `stuck` is a lifebuoy rather than a
 * question mark.
 *
 * `aria-hidden` always: an icon here never carries meaning on its own. Every
 * one of them sits beside the word it stands for, so a screen reader that
 * announced it would read the navigation item twice.
 */

import type { ReactElement } from "react";

type IconName =
  | "home"
  | "learn"
  | "papers"
  | "progress"
  | "mind"
  | "projects"
  | "teach"
  | "help"
  | "account"
  | "more"
  | "stuck"
  | "sound"
  | "camera"
  | "compass"
  | "mic"
  | "access";

const PATHS: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M3.4 10.6 12 3.6l8.6 7" />
      <path d="M5.9 9.4V20.2h12.2V9.4" />
      <path d="M9.7 20.2v-5.5h4.6v5.5" />
    </>
  ),
  // An open book: the surface a learner opens, rather than a pencil, which says
  // "write" — and writing is one thing you do here, not the destination.
  learn: (
    <>
      <path d="M12 6.3C9.5 5.1 6.9 4.9 4 5.6v12.8c2.9-.7 5.5-.5 8 .7" />
      <path d="M12 6.3c2.5-1.2 5.1-1.4 8-.7v12.8c-2.9-.7-5.5-.5-8 .7" />
      <path d="M12 6.3v12.8" />
    </>
  ),
  papers: (
    <>
      <path d="M6.8 3.6h7.1l4.3 4.3v12.5H6.8z" />
      <path d="M13.7 3.6v4.4H18" />
      <path d="M9.9 12.4h5M9.9 15.9h5" />
    </>
  ),
  progress: (
    <>
      <path d="M3.6 20.2h16.8" />
      <path d="M6.6 20.2v-5.6M12 20.2V8.9M17.4 20.2V4.6" />
    </>
  ),
  // The knowledge graph: three nodes, and the edges the product actually draws
  // between them. It is the shape of /mind, so the icon is a diagram of it.
  mind: (
    <>
      <circle cx="12" cy="5.4" r="2.3" />
      <circle cx="5.1" cy="17.2" r="2.3" />
      <circle cx="18.9" cy="17.2" r="2.3" />
      <path d="M10.5 7.4 6.6 15.2M13.5 7.4l3.9 7.8M7.4 17.2h9.2" />
    </>
  ),
  projects: (
    <>
      <path d="M12 3.6 20 8l-8 4.4L4 8z" />
      <path d="M4.6 12.3 12 16.4l7.4-4.1" />
      <path d="M4.6 16.3 12 20.4l7.4-4.1" />
    </>
  ),
  teach: (
    <>
      <circle cx="9.2" cy="8.4" r="3.1" />
      <path d="M3.4 20.2c0-3.1 2.6-5.4 5.8-5.4s5.8 2.3 5.8 5.4" />
      <path d="M16.1 5.8a3 3 0 0 1 0 5.4" />
      <path d="M17.4 15.2c2 .7 3.3 2.5 3.3 5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.7 2.4c-.8.5-1.3 1.1-1.3 2" />
      <circle cx="12" cy="16.6" r=".95" fill="currentColor" stroke="none" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="9.7" r="2.9" />
      <path d="M6.6 19.2c.9-2.4 2.9-3.7 5.4-3.7s4.5 1.3 5.4 3.7" />
    </>
  ),
  more: (
    <>
      <circle cx="5.6" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18.4" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </>
  ),
  // A lifebuoy, not a question mark: "I'm stuck" asks for support, and the
  // ladder behind that button is help arriving rather than a quiz.
  stuck: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M6.1 6.1l3.5 3.5M17.9 6.1l-3.5 3.5M6.1 17.9l3.5-3.5M17.9 17.9l-3.5-3.5" />
    </>
  ),
  // Read aloud. The treble clef of the emoji it replaces was a musical note,
  // which is the wrong idea for "hear this question read to you".
  sound: (
    <>
      <path d="M4.5 9.5h3.2L12.5 5.6v12.8L7.7 14.5H4.5z" />
      <path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.4a7.8 7.8 0 0 1 0 11.2" />
    </>
  ),
  mic: (
    <>
      <rect x="9.2" y="3.2" width="5.6" height="10.2" rx="2.8" />
      <path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8v3M9.2 20.8h5.6" />
    </>
  ),
  camera: (
    <>
      <path d="M3.6 8.4h4l1.6-2.2h5.6l1.6 2.2h4v11H3.6z" />
      <circle cx="12" cy="13.6" r="3.3" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M15.2 8.8 13.6 13.6 8.8 15.2 10.4 10.4z" />
    </>
  ),
  // The universal access symbol: a figure inside a ring. Drawn rather than typed
  // because the ♿ character is rendered by the platform's emoji font — in colour
  // on Android — and this is a control, not decoration.
  access: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="6.6" r="1.7" />
      <path d="M5.9 10.4c4 .9 8.2.9 12.2 0" />
      <path d="M12 10.6v3.2M12 13.8l-2.6 4M12 13.8l2.6 4" />
    </>
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
