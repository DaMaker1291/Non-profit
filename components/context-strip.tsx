"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE GLOBAL CONTEXT STRIP.
//
// One line in the shell that says, without opening anything, which learner
// context everything on screen is being taught in:
//
//     United Kingdom · GCSE · AQA · Year 11 · Mathematics Higher tier
//
// WHY IT EXISTS. A learner's experience changes completely with their course —
// the curriculum map, the questions served, the papers offered and the
// vocabulary all move — and none of that was visible from the shell. A learner
// who had just switched course could not tell that the whole product had
// changed underneath them, and a learner who had never chosen a course could
// not tell which one they were being taught. Naming it in one quiet line makes
// the platform feel academically serious rather than generic.
//
// IT IS DATA, NOT PROSE. Every part of the line is a proper noun or a label the
// product already shows elsewhere (the country name, the qualification's own
// name, the awarding body's own name, the year group, the subject and its
// tier). Nothing here is a new sentence to translate, which is why the strip
// adds no words to fifteen dictionaries — only the accessible name it needs,
// because a run of bare nouns joined by "·" tells a screen-reader user nothing
// about what those nouns ARE.
//
// WHERE IT SHOWS. The topbar, so it is on every page. It answers "which course
// am I in?" — not "where am I?", which is the bold name beside it.
// ─────────────────────────────────────────────────────────────────────────────

import { usePathname } from "next/navigation";
import { useI18n, useProfile } from "@/lib/client";
import { boardName } from "@/lib/curriculum";
import { COUNTRIES } from "@/lib/i18n";
import { specForProfile, type ActiveSpec } from "@/lib/specifications";
import { SUBJECT_LABELS } from "@/lib/subjects";
import type { SubjectId } from "@/lib/types";

export function ContextStrip() {
  const { t } = useI18n();
  const { state } = useProfile();
  const path = usePathname();

  const p = state?.profile;
  if (!p) return null;

  // WHICH SUBJECT'S COURSE IS IN VIEW. On a Learn page it is the subject in the
  // URL — a learner reading Physics must not be told their maths tier. Everywhere
  // else it is their first declared subject, which is the one the shell's
  // "where am I" line already names.
  const fromUrl = /^\/learn\/([^/]+)/.exec(path ?? "")?.[1];
  const declared = (p.subjects ?? []) as SubjectId[];
  const subject: SubjectId | undefined =
    fromUrl && declared.includes(fromUrl as SubjectId) ? (fromUrl as SubjectId) : declared[0];
  if (!subject) return null;

  // A course that cannot be resolved is reported as ABSENT, never guessed: an
  // honest gap is better than naming a qualification this learner never chose.
  let active: ActiveSpec | null = null;
  try {
    active = specForProfile(p, subject);
  } catch {
    active = null;
  }

  const country = COUNTRIES.find((c) => c.code === p.country)?.name ?? "";
  const subjectLabel = t(SUBJECT_LABELS[subject] ?? `subj.${subject}`);
  const parts = [
    country,
    active?.spec.name ?? "",
    // The course's own board when we have a course; the profile's board
    // otherwise. Never both, or a learner with a stale profile board would read
    // two awarding bodies at once.
    active ? boardName(active.spec.board) : boardName(p.board),
    p.grade ?? "",
    active?.level?.name ? `${subjectLabel} ${active.level.name}` : subjectLabel,
  ].filter((x) => x && x.trim().length > 0);

  if (parts.length === 0) return null;

  // A <span>, not a <p>: the strip sits inside the topbar's flex row (and
  // inherits `.topbar-where span`'s quiet mono treatment), where a block element
  // would break the line the shell's own "where am I" name shares with it.
  // `role="group"` is what makes the accessible name apply — a bare span with an
  // aria-label is announced by nothing.
  return (
    <span
      className="context-strip small muted"
      data-context-strip
      role="group"
      aria-label={t("ctx.aria")}
      title={t("ctx.aria")}
    >
      {parts.join(" · ")}
    </span>
  );
}
