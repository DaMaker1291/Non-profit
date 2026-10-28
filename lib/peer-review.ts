// ── "EXPLAIN IT IN YOUR OWN WORDS": WHAT THIS CAN AND CANNOT SAY ────────────
//
// This module used to score an explanation. It lowercased the concept's lesson
// text, kept every word longer than four characters, checked which of those
// appeared in the learner's sentences, and turned the ratio into a verdict:
// "strong" above 60%, "thin" below 20%. That verdict was written into the
// learner's record as `peer.strong`, and the learner was TOLD it — "Your
// explanation covers the key ideas"; "That is too thin to count as teaching".
//
// It was wrong in four ways that matter, and each one is a reason the verdict is
// gone rather than tuned:
//
//   1. IT MEASURED VOCABULARY, NOT UNDERSTANDING. A correct explanation in a
//      learner's own words — "you times the outside bits and add the insides" —
//      scores zero against a lesson that says "multiply the coefficients". The
//      better the learner's own phrasing, the worse this marked them.
//   2. IT PUNISHED A DIFFERENT ROUTE TO THE SAME IDEA, which is the normal case
//      in a classroom, not an edge case. Somebody explaining a fraction by
//      sharing a pizza and somebody explaining it by division are both right,
//      and only one of them matched the lesson's nouns.
//   3. IT WAS AN ENGLISH-ONLY MEASURE applied to every learner. The lesson text
//      it compares against is English (lib/genome), so a learner writing in
//      Spanish, Hindi or Swahili scored near zero however well they explained it.
//      A verdict that depends on which language you write in is not a measurement
//      of the idea.
//   4. NOBODY EVER READ IT. The verdict was presented as a check, and the thing
//      it claimed to check — whether the explanation is right — is exactly what a
//      keyword matcher cannot see and no human in this pipeline looked at.
//
// What is left is the part that IS true and useful: the concept's lesson names
// certain ideas, and listing which of them the learner actually used is a fair
// prompt to look again. So this now returns a CHECKLIST, never a score: no
// verdict, no percentage, no threshold, nothing written to the learner's record
// as evidence of understanding. The component that renders it says plainly that
// it is not marked — see components/peer-teach.tsx.

export interface ExplanationReview {
  /** Ideas from the concept's own lesson that the explanation names. */
  covered: string[];
  /** The rest of them, offered as "worth a mention", never as a failure. */
  missing: string[];
}

/** How many ideas to put on the checklist. Short on purpose: ten items is a
 *  checklist nobody reads, and the point is a second look at the idea rather
 *  than an exhaustive audit of the paragraph. */
const MAX_IDEAS = 5;

/** The lesson's own key words, longest first, capped.
 *
 *  Longest first because the distinctive words in a lesson are the long ones
 *  ("denominator", "coefficient", "gradient") while the short ones are the glue —
 *  and a five-item checklist of "which, when, their" teaches nothing. Words of
 *  four letters or fewer are dropped for the same reason. */
export function keyIdeasOf(lesson: string): string[] {
  const words = lesson
    .toLowerCase()
    .replace(/[^a-zà-ÿа-я一-鿿à-ʼ\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const unique = [...new Set(words)];
  unique.sort((a, b) => b.length - a.length);
  return unique.slice(0, MAX_IDEAS);
}

/** Which of the lesson's key ideas the explanation names — and nothing more. */
export function reviewExplanation(lesson: string, explanation: string): ExplanationReview {
  const ideas = keyIdeasOf(lesson);
  const written = explanation.toLowerCase();
  return {
    covered: ideas.filter((idea) => written.includes(idea)),
    missing: ideas.filter((idea) => !written.includes(idea)),
  };
}
