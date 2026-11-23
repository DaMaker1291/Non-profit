// ─────────────────────────────────────────────────────────────────────────────
// THE FRONT PAGE: what this is, who it is for, and one way in.
//
// The shape follows what a UK department actually looks for before they will put
// a product in front of a class — a statement of what it is, evidence that the
// practice is real, what the syllabus coverage is, and what teachers get — in
// that order, on one page, with no more than one primary action per audience.
//
// What it used to be: a visitor's first screen carried the LEARNER's shell (Home,
// My evidence, Your knowledge, a subject list they had never chosen), a
// "Continue where you left off" card whose only content was "your course and
// subjects are not set yet", and a panel headed "About you: not measured" with an
// empty square in it. Every one of those was true and every one of them told a
// stranger they had arrived in the middle of somebody else's account.
//
// Three rules hold this page:
//
//   · ONE PRIMARY ACTION PER AUDIENCE. A learner presses Start; a teacher presses
//     the secondary door beside it. Nothing else on the page is a filled button.
//   · EVERY FIGURE IS MEASURED, at module load, from the genome, the question
//     bank and the specification list — never typed in. A number on a marketing
//     page that cannot be checked is decoration.
//   · A LEARNER WHO IS ALREADY PLACED NEVER SEES IT. The state machine redirects
//     them to their own home; this page is for people who are not in yet.
//
// WHY THIS FILE IS A SERVER COMPONENT. The second rule used to be paid for by the
// visitor: importing `@/lib/questions` here to count the bank put the whole
// question bank — ~553 KiB compressed, ~1.8 MB of source — into the page's initial
// download, and the bundler hoisted it into the shared chunk, so sign-up and the
// dashboard carried it too. The measurement is unchanged; only its address is.
// Counting happens once, on the server, at build/render time; the visitor
// downloads three integers and the copy. The bank they will USE is fetched by the
// practice route, when they practise.
// ─────────────────────────────────────────────────────────────────────────────
import { Landing } from "@/components/landing";
import { CONCEPTS, bySubject } from "@/lib/genome";
import { SPECIFICATIONS } from "@/lib/specifications";
import { bankDepth, hasGenerator } from "@/lib/questions";
import { difficultyBandFor } from "@/lib/question-bank";
import type { SubjectId } from "@/lib/types";

/** The subjects on the coverage table, in the order it shows them. The rows' LABELS
 *  and links live in the client component, which is display; this list is what gets
 *  measured, so that the two halves never disagree about which subject is which. */
const MEASURED: SubjectId[] = ["maths", "physics", "chemistry", "biology", "computing"];

/**
 * How deep the practice actually goes, per subject, measured from the bank.
 *
 * A subject row that says "18 concepts" tells a student nothing about whether
 * the work there is real. The deepest band the bank can serve for that subject
 * does — said on the row rather than discovered by a disappointed student.
 */
const SUBJECT_LEVEL: Record<string, { concepts: number; band: number }> = Object.fromEntries(
  MEASURED.map((id) => {
    const ids = bySubject(id).filter((c) => hasGenerator(c.id)).map((c) => c.id);
    return [id, { concepts: bySubject(id).length, band: difficultyBandFor(bankDepth(ids)) }];
  }),
);

/** The top of the depth scale, measured from the bank rather than typed in — the
 *  table says "3 / 5" because five is the deepest band any subject reaches. */
const BAND_MAX = difficultyBandFor(
  bankDepth(CONCEPTS.filter((c) => hasGenerator(c.id)).map((c) => c.id)),
);

export default function Home() {
  return (
    <Landing
      subjectLevel={SUBJECT_LEVEL}
      bandMax={BAND_MAX}
      proof={{ concepts: CONCEPTS.length, courses: SPECIFICATIONS.length }}
    />
  );
}
