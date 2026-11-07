// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED LESSONS — a concept's teaching, as a SEQUENCE rather than a
// paragraph.
//
// The genome gives every concept a `lesson` field of two to four sentences. That
// is enough to remind someone, and not enough to teach someone who has never met
// the idea — which is the learner this product exists for. The read stage was
// therefore a paragraph followed by a question, and the first item a learner met
// was also the first they had to do unaided.
//
// This module is the missing half: an authored plan per concept that the lesson
// page renders in the order a classroom uses.
//
//   1. objective   — what you will be able to DO by the end (not a topic name)
//   2. intuition   — a concrete situation the idea already lives in, before any
//                    terminology, so the words have something to attach to
//   3. idea        — the formal teaching, one paragraph per idea, several of
//                    them: this is the part that was one sentence long
//   4. worked      — a real item from the concept's own generator, solved (the
//                    page composes this from the live bank; see
//                    app/api/worked-example/route.ts, so it can never drift
//                    from what the practice serves)
//   5. together    — the same, faded: the first step is shown, the learner
//                    supplies the rest, then checks
//   6. traps       — the wrong moves a learner actually makes here, each with
//                    WHY it fails, because "don't do that" teaches nothing
//   7. your turn   — the door into practice
//
// WHY THIS IS A SEPARATE FILE AND NOT A GENOME FIELD. The genome's rows are a
// compact tuple table with 135 entries; a structured lesson does not fit in a
// tuple, and reshaping that table to carry one would have touched every row and
// every gate that reads it. Keeping plans keyed by concept id also makes the
// coverage honest and countable: the 19 pilot-candidate plans are authored in
// this module, and `planFor` serves a supplemental plan for every other concept
// from `lesson-plans-supplemental.ts`. Those supplemental plans are composed from
// the concept's genome note and its own concept-specific lens, and are marked
// `provenance: "supplemental"` / `review: "unreviewed"`; they are not presented
// as reviewed teaching. A concept with no lens still answers null, so a genome
// addition cannot silently inherit another concept's lesson.
//
// PROVENANCE IS PART OF THE CONTENT (§3 of the strategy note: authored ≠
// reviewed ≠ pilot-tested). Every plan states its review state, and the page
// PRINTS it. A lesson written by the team and never read by a subject teacher
// must say so on the screen, not just in a document.
// ─────────────────────────────────────────────────────────────────────────────
import { CONCEPTS } from "./genome";
import type { FigureSpec } from "./types";
import { completeLanguages, translatedPlanFor } from "./lesson-plans-intl";
import { SUPPLEMENTAL_LESSON_PLANS } from "./lesson-plans-supplemental";

/** One wrong move, and why it does not work. */
export interface LessonTrap {
  /** What the learner does — written as they would say it. */
  readonly move: string;
  /** Why it fails. Never "that's just the rule": a trap a learner cannot see
   *  through is a rule to memorise, and rules to memorise are what they came
   *  here to escape. */
  readonly why: string;
}

/** How far a plan has been checked. The strategy note's review ladder starts
 *  here and climbs; a plan may not claim a rung it has not reached. */
export type PlanReview =
  /** Stage 0-1: only metadata (title + blurb), no lesson plan yet */
  | "metadata_only"
  /** Stage 2: lesson plan outline exists (structure, objectives) */
  | "outline"
  /** Stage 3: authored draft present (full teaching plan) */
  | "draft"
  /** Stage 4: reviewed by a subject teacher */
  | "educator_reviewed"
  /** Stage 5: tested with learners, data exists */
  | "learner_tested"
  /** Stage 6: fully published and deployed */
  | "published"
  /** Written by the project team. No subject teacher has read it. */
  | "unreviewed"
  /** A qualified teacher of the subject has read the mathematics and the
   *  explanations. */
  | "subject-reviewed";
/** ONE STRUCTURED SECTION OF A LESSON, for a topic whose teaching is a
 *  sequence rather than a set of paragraphs. `body` is still prose; the
 *  structure is the point. A calculation lesson needs a formula and a method
 *  beside the explanation, and a comparison needs a table — putting all three
 *  into one undifferentiated card is how a lesson becomes a wall of text. */
export interface LessonSection {
  readonly heading: string;
  readonly body: readonly string[];
  /** One display formula for this section, e.g. "n = m / Mᵣ". */
  readonly formula?: string;
  /** An ordered method, when the section is a procedure. */
  readonly steps?: readonly string[];
  /** A small data table the learner must read across. */
  readonly table?: {
    readonly columns: readonly string[];
    readonly rows: readonly (readonly string[])[];
    readonly caption?: string;
  };
}

export interface LessonPlan {
  /** The genome id this teaches. Checked against the genome by `npm run
   *  verify` — a plan filed under a typo'd id would render for nobody. */
  readonly conceptId: string;
  /** One sentence, action-first: what the learner will be able to do. */
  readonly objective: string;
  /** A concrete situation, before terminology. */
  readonly intuition: string;
  /** The formal teaching — one paragraph per idea, in the order it must land. */
  readonly idea: readonly string[];
  /** A STRUCTURED ROUTE through the same teaching. When present, the page
   *  renders these sections instead of the bare idea paragraphs: a heading, a
   *  formula, a method and a table are content, not decoration. The flat `idea`
   *  remains for translation, word counts and the fallback renderer. */
  readonly sections?: readonly LessonSection[];
  /** Wrong moves, each with the reason it fails. */
  readonly traps: readonly LessonTrap[];
  /** Where this idea is used next, in plain words, so the concept is not an
   *  island: the read stage prints it under the practice door. */
  readonly usedFor: string;
  readonly review: PlanReview;
  /** Where this plan came from. The 19 pilot plans are the authored review
   *  candidates; supplemental plans cover the rest of the genome from the
   *  concept's own teaching note and are never presented as pilot-reviewed. */
  readonly provenance?: "pilot" | "authored" | "supplemental";
  /** THE WORDS THE LESSON USES, defined where they are first needed. A learner
   *  who meets "limiting factor" in a paragraph and nowhere else has to infer
   *  it from context; a short glossary is the difference between reading and
   *  guessing. Optional because the older plans teach their vocabulary inside
   *  the prose already. */
  readonly terms?: readonly { readonly term: string; readonly meaning: string }[];
  /** FULLY WORKED EXAMPLES AUTHORED WITH THE LESSON, for concepts whose live
   *  generated item is not enough on its own. Each step says WHY, not only what
   *  to write. The page still shows a live item from the bank as well. */
  readonly workedExamples?: readonly {
    readonly prompt: string;
    readonly steps: readonly string[];
    readonly answer: string;
  }[];
  /** THE LAST RETRIEVAL BEFORE PRACTICE: three sentences a learner should be
   *  able to say without looking back. Optional for the older plans. */
  readonly recap?: readonly string[];
  /** An INTERACTIVE model the page renders beside the figure, where a static
   *  picture cannot answer the question the lesson raises. Optional and named by
   *  a small union: a plan that carries no model renders exactly what it did. */
  readonly interactive?: "fraction-model";
  /** A WORKED-OUT VIDEO, where a real one exists.
   *
   *  Some ideas need to be watched being done before the prose lands — a
   *  column method, an order of operations, a decimal place-value table — and
   *  the static figure vocabulary cannot draw those honestly. This is a LINK,
   *  not an embed: a third-party player inside the lesson can fail silently or
   *  be blocked entirely, leaving a blank rectangle where teaching was promised.
   *  The card says whose video it is and how long it runs, so the learner knows
   *  what will open before they tap it.
   *
   *  Every URL here was resolved and its title confirmed at the source. A video
   *  link is a claim about the world, so an invented or unverified one is worse
   *  than no card at all. */
  readonly video?: {
    readonly url: string;
    readonly title: string;
    readonly source: string;
    /** The running time the source states ("4:33"), not an estimate. */
    readonly length?: string;
    /** The language of the AUDIO, as a BCP-47 tag. A video is not a
     *  translation of the lesson and this field is how the card says so. */
    readonly language: string;
    /** Whether the source is known to provide captions. `unknown` is an honest
     *  answer, not a missing one: a caption claim that has not been checked is
     *  worse than telling the learner to look for the CC control. */
    readonly captions: "human" | "auto" | "none" | "unknown";
    /** WHAT THE VIDEO SHOWS, in the lesson's own words. This is the fallback:
     *  a learner on a blocked network, a slow connection or a different
     *  language still gets the teaching from the text, and the card is useful
     *  before the video opens. */
    readonly summary: string;
    /** Whether this video teaches THIS concept or gives a subject overview.
     *  Omitted on an authored concept video for compatibility; `videoFor`
     *  supplies `"concept"` and every subject fallback supplies `"subject"`. */
    readonly scope?: "concept" | "subject";
  };
  /** THE PICTURE THIS IDEA NEEDS, when it needs one.
   *
   *  A figure belongs to a plan only when the picture makes a relationship
   *  visible that prose has to assert — the direction of a negative jump, what
   *  "both sides" looks like, the term an incomplete expansion leaves out. A
   *  diagram drawn beside every lesson is decoration, and decoration teaches a
   *  learner to skip pictures.
   *
   *  The caption is the teaching, in words, and is required: the SVG itself is
   *  `aria-hidden` (see components/question-figure.tsx), so a learner using a
   *  screen reader — or printing in greyscale, or on a phone — must be able to
   *  get the whole point from the sentence under it. */
  readonly figure?: { readonly spec: FigureSpec; readonly caption: string };
  /** A SECOND ROUTE THROUGH THE SAME IDEA, for a learner whose own evidence
   *  says the default route has not landed.
   *
   *  The mandate asks for multiple explanations and for the engine to choose one
   *  from the learner's evidence. A generator cannot write that choice: an
   *  explanation that has not been thought through is worse than the one that
   *  has, so a route exists ONLY where an author wrote it, and a plan with no
   *  routes answers exactly what it always did. This is the same rule as
   *  `planFor` answering null for an unwritten concept — no template, no prose
   *  invented to fill a slot.
   *
   *  `idea` REPLACES the base `idea`; it does not add to it. A struggling
   *  learner handed both routes reads the same six paragraphs twice with a
   *  different opening, which is the padding the mandate forbids. The advanced
   *  route is for a learner whose evidence shows mastery, and it must go
   *  FURTHER (generalise, prove, connect), not merely faster. */
  readonly routes?: readonly {
    readonly when: "struggling" | "advanced";
    readonly idea: readonly string[];
  }[];
}

/** Which route through the idea a learner is reading, and the paragraphs of it. */
export interface LessonRouteChoice {
  readonly route: "default" | "struggling" | "advanced";
  readonly idea: readonly string[];
}

/** The evidence the route is chosen from — the same fields `ConceptProgress`
 *  carries, as an optional bag so a caller with only part of the record (a
 *  learner who has answered twice) still gets a defensible answer. */
export interface LessonRouteEvidence {
  readonly attempts?: number;
  readonly correct?: number;
  readonly mastery?: number;
}

/**
 * THE AUTHORED PLANS.
 *
 * Deliberately a small set, and deliberately the START of the GCSE pilot
 * cluster rather than its end: these are the stage 0–1 concepts (negatives,
 * order of operations, expressions, coordinates, indices, equations) that every
 * later concept in the pathway stands on, and they are the concepts whose
 * one-paragraph lessons were thinnest. `algebra-expand`, `straight-lines`,
 * `completing-square`, `quadratics` and `surds` complete that pathway, so ALL
 * ELEVEN concepts of the reviewed pilot now teach as a sequence.
 *
 * THEN THE FRONT OF THE PATHWAY WAS CLOSED. `fractions` and `percentages` are
 * the two concepts the pilot assumed and did not teach — the first prerequisite
 * of the data-and-ratio work every science course leans on. They are authored
 * here as a SEQUENCE (fractions → percentages, with `decimals` between them in
 * the genome and still on the prose), which makes THIRTEEN. The other 122
 * concepts still render the prose: this is a pathway with both ends closed, not
 * the curriculum, and saying otherwise is the exact claim this format exists to
 * avoid. `npm run verify` measures the count rather than trusting this
 * paragraph, and `audit/pilot-pack.json` is regenerated from it.
 */
const PILOT_LESSON_PLANS: Readonly<Record<string, LessonPlan>> = {
  // ── THE FOUNDATIONS RING, ADDED AFTER THE PILOT WAS VERIFIED ────────────────
  //
  // The pilot is a pathway through stage 0–3 algebra and number. A learner who
  // wants to START that pathway cannot: `fractions` is a prerequisite of
  // `percentages`, which is a prerequisite of the ratio and proportion work every
  // science course assumes, and all of them still rendered the genome paragraph.
  //
  // These two are the smallest sequence that closes the FRONT of the pathway
  // rather than extending its tail: `fractions` is where a learner who cannot
  // order 1/4 and 1/8 is stuck, and `percentages` is the one concept the whole of
  // data, finance and science teaching leans on. Both are in the served bank (so
  // the worked example and the practice are real items, not prose), and both name
  // a misconception the catalog already holds — which is what lets the read stage
  // open on a learner's own slip instead of a generic paragraph.
  // ── decimals · the first concept in the pilot pathway ───────────────────
  //
  // The entry point of the pathway and the one concept with no teaching at all:
  // a learner arriving at the start of the course met a paragraph and then a
  // question. It is deliberately placed here, before `fractions`, because that
  // is the order a learner meets them — the same quantity written two ways.
  //
  // NO FIGURE, on purpose. The relationship this lesson turns on is PLACE VALUE —
  // the column a digit sits in — and no kind the union declares draws a
  // place-value table: a pie of 0.45 would show that almost half is shaded and
  // say nothing about why 0.45 < 0.5, which is the thing being taught. A drawing
  // that teaches nothing is decoration, and decoration teaches a learner to skip
  // pictures.
  decimals: {
    conceptId: "decimals",
    objective:
      "Read 0.45 aloud as 45 hundredths, put a list of decimals in size order, and add or multiply two of them without losing the decimal point.",
    intuition:
      "Two prices on a shelf: £0.50 and £0.45. The second one has MORE digits, and the first is worth more — 50p beats 45p. That is the whole difficulty of decimals in one comparison: the digits are not the amount, their position is. A decimal continues the place-value system whole numbers already use, past a point and into tenths, hundredths and thousandths, so the column a digit sits in decides what it counts.",
    idea: [
      "Read the point as the word \"and\": 0.45 is 4 tenths and 5 hundredths, which is 45/100. Everything to the right of the point is a fraction whose denominator is a power of ten, and each step further right divides the value by ten again — tenths, then hundredths, then thousandths. A digit's position is doing exactly the work it does in 452, where the 4 means 400, except now it continues into amounts smaller than one.",
      "Comparing decimals is decided column by column, not by how long the number is. Write them with the same number of places — 0.5 becomes 0.50 — and compare from the left: the tenths decide it, and only if they tie do you look at the hundredths. That is why 0.09 is smaller than 0.1 despite 9 being bigger than 1: 0.09 has no tenths at all, and 0.1 has one.",
      "To add or subtract, put the points in a line — one number under the other with the points in the same column — fill any gaps with zeros, and add the columns exactly as you would whole numbers. 0.3 + 0.4 is three tenths plus four tenths: seven tenths, 0.7. The point is not written in because it was moved; it stays in the column it started in, which is why lining it up is the whole method.",
      "Multiplying needs a different routine, because the columns no longer have to match. Multiply the digits as if the points were not there, then count the decimal places in BOTH factors and put that many back into the answer: 3 × 2 = 6, and 0.3 and 0.2 have one place each, so the answer needs two — 0.06. That count is not a trick; tenths times tenths really is hundredths, which is the same fact as 1/10 × 1/10 = 1/100.",
      "A decimal is one quantity written in another notation, so converting costs nothing: 0.45 = 45/100 = 45%. The same number can be a price, a length, a probability or a percentage, and none of those changes its size. What does change is the precision a written decimal claims — 2.4 said to one decimal place means \"between 2.35 and 2.45\" — which is why rounding is a decision about which column matters rather than a tidy-up.",
      "Multiplying or dividing by ten shifts the digits, not the quantity: 0.45 × 10 = 4.5 and 0.45 ÷ 10 = 0.045, with the point moving one place each time because every digit has moved one column. That is the one legitimate use of \"move the point\", and saying the operation out loud — \"divide by ten\" — keeps it attached to something true.",
    ],
    traps: [
      {
        move: "\"0.45 is bigger than 0.5, because 45 is bigger than 5.\"",
        why: "Comparing the digits as if the point were not there ignores the column each one is in. Give both numbers the same number of places — 0.50 against 0.45 — and the tenths decide: five tenths beat four tenths. A longer decimal is not a bigger amount; 0.09 is smaller than 0.1.",
      },
      {
        move: "\"0.3 × 0.2 = 0.6.\"",
        why: "That is 0.3 × 2 — the point moved one place when the two factors had two decimal places between them. 3 × 2 = 6, so two places back gives 0.06. The check that catches it: multiplying two numbers smaller than 1 must give an answer smaller than either of them, and 0.6 is bigger than 0.3.",
      },
      {
        move: "\"0.3 + 0.4 = 7, because 3 + 4 = 7.\"",
        why: "Dropping the points multiplied both numbers by ten, so the answer is ten times too big. Three tenths plus four tenths is seven tenths, 0.7. Write the numbers one under the other with the points in a column: the digits you are adding are then the ones in the same place value.",
      },
    ],
    usedFor:
      "Percentages (0.45 is 45%), measurement to a stated precision, ratio and standard form all read decimals, and rounding an answer to one decimal place is a judgement about which column the question cares about.",
    review: "unreviewed",
    // THE WORKED-ON-SCREEN ROUTE. This plan deliberately draws no static figure
    // because the figure vocabulary has no place-value table; a real video is
    // the honest alternative, linked rather than embedded.
    video: {
      url: "https://www.khanacademy.org/v/decimal-place-value",
      title: "Decimal place value",
      source: "Khan Academy",
      length: "4:00",
      language: "en",
      captions: "unknown",
      summary:
        "A short walkthrough of decimal place value. Watch how each column is named and how the decimal point fixes which column a digit occupies; the lesson below teaches the same columns without needing the video.",
    },
  },

  fractions: {
    conceptId: "fractions",
    objective: "Read a fraction as a number, compare two of them, and say why 1/8 is smaller than 1/4 when 8 is bigger.",
    intuition:
      "Two chocolate bars, identical. One is broken into four pieces, the other into eight, and you are handed one piece of each. The eight-piece bar gave you the SMALLER piece even though 8 is the bigger number — because the number underneath the fraction is not how much you get, it is how many pieces the bar was cut into. Every fraction question starts by asking which of those two things the number is doing.",
    idea: [
      "A fraction counts equal pieces of one whole. In 3/4 the bottom number, 4, says the whole was cut into four equal pieces; the top number, 3, says how many of them you have. Say it out loud that way — \"three pieces, each a quarter\" — and the notation stops being two numbers stacked up.",
      "The bottom number is a SIZE, not a quantity. Cutting a bar into more pieces makes each piece smaller, so a bigger denominator means a smaller slice: 1/8 < 1/4. This is the single most common wrong answer in the whole of fractions, and it is not carelessness — it is reading the denominator as an amount, which is exactly what the top number is for.",
      "Equivalent fractions say the same amount in different pieces. 1/2 = 2/4 = 3/6 because multiplying the top and the bottom by the same number doubles the count AND halves the slice size, so the amount of chocolate is unchanged. That is why you may scale a fraction up or down as long as you scale both parts: you are renaming the pieces, not changing the amount.",
      "To compare fractions with different bottoms, make the pieces the same size — a common denominator. 2/3 and 3/4 become 8/12 and 9/12, and now the tops can be compared directly. The other reliable method needs no arithmetic: compare each fraction with 1/2. A fraction whose top is less than half its bottom (3/8) is below 1/2, and one whose top is more than half its bottom (5/8) is above it, so 3/8 < 5/8 and you never had to compute anything.",
      "A fraction is ONE number, not a division you have not finished. 3/4 sits at a definite place on the number line, between 0 and 1, closer to 1 than to 0 — and once you can see it there, adding, comparing and scaling it are operations on a number rather than rules about two integers that happen to be written on top of each other.",
      "Decimals and percentages are the same idea in other notation: 3/4 = 0.75 = 75%. Nothing about the quantity changes when the notation does, and a learner who knows where 3/4 sits on the line already knows most of what the next two concepts teach.",
    ],
    traps: [
      {
        move: "\"1/8 is bigger than 1/4 because 8 is bigger than 4.\"",
        why: "The bottom number counts the pieces, so a bigger bottom means each piece is smaller. Cut the same bar into eight and every piece is half the size of the quarter you had before. Compare the slices, not the numbers.",
      },
      {
        move: "\"2/3 is bigger than 3/4 because 2 and 3 are bigger than 3 and 4 in the other one.\"",
        why: "Comparing tops alone only works when the bottoms match. Here the pieces are different sizes, so 2 of one size and 3 of another cannot be counted against each other until the sizes are made equal: 8/12 against 9/12.",
      },
      {
        move: "\"3/4 + 1/4 = 4/8.\"",
        why: "Adding the bottoms together changes the size of every piece in the answer, so the addition is no longer about the same wholes. Quarters and quarters are the same size, so the tops simply add: 3/4 + 1/4 = 1. (Different bottoms are next concept, and they need a common denominator first.)",
      },
    ],
    usedFor:
      "Percentages and decimals are fractions in another notation, ratio compares two of them, and probability is one: the chance of a six is 1/6, which is a fraction before it is ever a percentage.",
    review: "unreviewed",
    // THE SECOND ROUTE FOR A LEARNER THE FIRST ROUTE DID NOT REACH. Measured
    // need, not a hunch: `fractions` is a stage-0 concept and the first
    // prerequisite of the data-and-ratio work every science course leans on, so
    // a learner arriving here having failed it is common. The base route opens
    // with notation ("in 3/4 the bottom number, 4…"); a pupil who does not yet
    // believe the bottom is a SIZE cannot start there. This route builds the
    // picture first and does not write a fraction until paragraph three, then
    // proves the comparison rule by drawing before naming it.
    routes: [
      {
        when: "struggling",
        idea: [
          "Start with one bar of chocolate and no symbols at all. Break it into two equal pieces and you have two halves. Break a SECOND identical bar into four equal pieces and you have four quarters. Hold up one piece from each: the quarter is the smaller piece, even though 4 is the bigger number — because the number underneath a fraction counts how many pieces the bar was cut into, not how many you get.",
          "So when you meet 3/4, read the bottom first: the bar was cut into 4 equal pieces. Then read the top: you have 3 of them. Say the whole thing out loud as \"three quarters\" and check it against the picture — three pieces, each one a quarter of the bar. If the words and the picture ever disagree, the picture is right; the two numbers are a shorthand for it.",
          "Now compare 1/8 and 1/4 the slow way, by drawing. Draw two identical bars. Cut the first into 8 and shade 1 piece; cut the second into 4 and shade 1 piece. The shaded eighth is visibly the smaller piece, so 1/8 is less than 1/4. You have just proved the rule by looking at it, which is why you will not need to memorise which way round it goes.",
          "Only when that is comfortable, use the shortcut. To compare fractions with different bottoms, cut both bars into the same number of pieces and count: 2/3 and 3/4 both become twelfths, 8/12 and 9/12, so 3/4 is bigger by one twelfth. If the shortcut will not come in an exam, draw the bars instead — slower, and always right.",
        ],
      },
    ],
    interactive: "fraction-model",
    // THE PICTURE THE IDEA NEEDS. "A bigger bottom means smaller pieces" is a
    // claim about SHAPE — the same circle, cut more ways — so the drawing shows
    // three quarters of one whole and the caption says what to notice: four of
    // these slices fill it.
    figure: {
      spec: { kind: "pie", sectorDegrees: 270, label: "3/4", slices: 4 },
      caption:
        "Three quarters of one whole: the circle is the 1, and the shaded part is three of its four equal slices. A quarter is one slice, so three of them are 3/4 — and four of them would fill the circle exactly.",
    },
  },

  // ── THE LINK BETWEEN THE TWO, AND THE MOST-HIT BELIEF IN THE BANK ────────
  //
  // `denom-add` is the misconception this concept exists for, and until now it
  // had a name, a pattern, a coaching paragraph and NO REPAIR — a learner who
  // added the bottoms was told what they had done and given nowhere to go. The
  // concept sits between `fractions` (what a fraction IS) and `percentages`
  // (what a proportion OF something is), so the pathway now runs front to back
  // without a hole in the middle.
  "fraction-ops": {
    conceptId: "fraction-ops",
    objective:
      "Add and subtract two fractions whose bottoms differ, by making the pieces the same size first — and say why the bottoms are never added.",
    intuition:
      "Two people both eat some pizza. One eats half of a pizza, the other eats a third of a pizza the same size. Together they have not eaten two fifths of anything: a half and a third are counts of DIFFERENT-SIZED pieces, and until both are counted in the same size, there is no number to add. That is the whole method, and the only reason a common denominator appears at all — it is the unit you agree to count in.",
    idea: [
      "The bottom number names the size of the piece being counted. 3/4 is \"three quarters\"; 2/3 is \"two thirds\". Adding them is asking for a count of pieces you have not yet chosen a size for, which is why the rule that follows is about converting and not about arithmetic.",
      "Any two fractions can be counted in the same size of piece, because multiplying the top and the bottom of a fraction by the same number renames the pieces without changing the amount: 1/2 = 3/6 = 50/100. The smallest shared size is convenient, not compulsory — the product of the two bottoms always works, and is what to do when the smallest is not obvious. For 2/3 and 5/6 the shared size is sixths: 2/3 = 4/6.",
      "Once the pieces match, the addition is the tops: 4/6 + 5/6 = 9/6. Nine sixths, which simplifies to 3/2, or 1 1/2. The bottom is not part of the addition because it is not a quantity — it is the name of the piece, and adding names is how 2/3 + 5/6 becomes 7/9, an answer smaller than 5/6, one of the numbers being added.",
      "That size check is what makes the wrong answer visible instead of plausible. Adding two positive fractions must give MORE than either one: 1/3 + 1/4 is more than 1/3, so 2/7 cannot be right — 2/7 is smaller than 1/3. Before writing an answer down, ask whether it is the right sort of size; it catches the denominator slip without any arithmetic at all.",
      "Subtraction uses the same method, and the same check in reverse: 3/4 − 2/3 = 9/12 − 8/12 = 1/12, which is less than 3/4 and more than nothing. A difference bigger than the number you started with is a sign that the pieces were never made the same size.",
      "Mixed numbers are added in two parts — the wholes, then the fractions — and the fraction part still needs a common denominator: 2 1/2 + 1 1/3 = 3 + (3/6 + 2/6) = 3 5/6. The answer is then simplified if it can be, and only at the end: 9/6 was 3/2 all along, and simplifying mid-calculation is how a learner loses a factor they needed.",
    ],
    traps: [
      {
        move: "\"2/3 + 5/6 = 7/9 — add the tops, add the bottoms.\"",
        why: "Adding the bottoms changes the size of the piece in the answer, so the sum is no longer about the same whole. The size check settles it without argument: 7/9 is smaller than 5/6, and adding 2/3 to 5/6 cannot make it smaller. Convert to sixths first: 4/6 + 5/6 = 9/6.",
      },
      {
        move: "\"2/3 + 5/6 = 7/6 — keep the bigger bottom and add the tops.\"",
        why: "Sixths is the right unit, but 2/3 was never converted into it: two thirds is four sixths, not two sixths. Keeping the denominator without rescaling the fraction quietly adds a smaller number than the question asked for. Nine sixths is the answer, and it is 1 1/2 rather than 1 1/6.",
      },
      {
        move: "\"2 1/2 + 1 1/3 = 3 2/5 — add the wholes, then the fractions.\"",
        why: "The whole parts may be added directly, but the fraction parts are counted in halves and thirds, so they need a shared size first: 3/6 + 2/6 = 5/6, giving 3 5/6. The 2/5 comes from adding halves to thirds as if the bottoms were quantities — the same slip as 1/2 + 1/3 = 2/5.",
      },
    ],
    usedFor:
      "Percentages (a percentage is a fraction with 100 on the bottom), ratio and proportion, probability added along a tree's branches, and algebraic fractions — x/2 + x/3 needs exactly this shared-denominator move with letters in it.",
    review: "unreviewed",
    // THE PICTURE STATES THE MOVE THE METHOD ASKS FOR. A shaded sector says "this
    // much"; the same shading with the circle cut into six says "four of six",
    // which is the fact a learner has to see before 5/6 can be added to it. The
    // sector is 240° of 360° = four of six slices, so the picture, the label and
    // the caption are one claim (and `npm run verify` drives that arithmetic).
    figure: {
      spec: { kind: "pie", sectorDegrees: 240, slices: 6, label: "2/3 = 4/6", showDegrees: false },
      caption:
        "Two thirds, cut into sixths: the same shaded amount is four of the six equal slices, because cutting each third in half doubles the count and halves the size. So 2/3 = 4/6 — and now 5/6 can be added to it directly, because both are counted in sixths.",
    },
  },

  percentages: {
    conceptId: "percentages",
    objective: "Find a percentage of an amount, work out a percentage change, and explain why a 20% rise followed by a 20% fall does not return to where you started.",
    intuition:
      "A shop raises a £100 jacket by 20%, and the price tag now reads £120. A month later it takes 20% off — and the tag reads £96, not £100. Nobody made a mistake and nothing was hidden: the second 20% was taken off a bigger number, because the first one had already changed what \"the price\" is. Percentages always act on whatever the amount is NOW, and almost every percentage error is a question about which amount that is.",
    idea: [
      "Per cent means \"per hundred\", so a percentage is a fraction with 100 on the bottom. 45% = 45/100 = 0.45, and 7% = 0.07. Writing the percentage as a decimal is not a shortcut, it is the definition: it is the number you can multiply by.",
      "\"Of\" is multiplication. 15% of 60 is 0.15 × 60 = 9. Two reliable ways to get there: build 10% by dividing by 10 (6), then take half of that for 5% (3) and add them for 15% (9); or multiply by the decimal in one step. The first is what people do in a shop without a calculator, and the second is what generalises.",
      "Percentage CHANGE always divides by the ORIGINAL amount. If a price goes from 80 to 92, the change is 12 and the original is 80, so the change is 12/80 = 15%. Dividing by the new amount would give 12/92 ≈ 13% — a number that is not the change at all, because the change was measured against what you started with.",
      "One multiplication can do a whole percentage change, and this is the tool that makes the jacket obvious. A 20% rise multiplies by 1.2; a 20% fall multiplies by 0.8. Doing both is ×1.2 then ×0.8 = ×0.96 — a 4% LOSS, because 0.96 is less than 1. The two percentages do not cancel: the second multiplies a bigger base, which is why the fall takes more money than the rise added.",
      "Reversing a percentage change is division, not subtraction. If £96 is the price AFTER a 20% rise, the original is 96 ÷ 1.2 = £80. Subtracting 20% of £96 gives £76.80 and is wrong, because the 20% was taken of the original — the very number the question is asking for.",
      "Percentages of different wholes cannot be compared directly. 30% of a small class and 20% of a large one can be the same number of learners, so a percentage on its own says how much of a whole, never how many. Say what the whole is before you compare two percentages — that is the same discipline the percentage-change rule enforces, applied to two quantities at once.",
    ],
    traps: [
      {
        move: "\"A 20% rise then a 20% fall returns to the starting price.\"",
        why: "The second percentage acts on the raised price, so 20% of it is a bigger amount of money than the first 20% added. In multipliers: 1.2 × 0.8 = 0.96, a 4% net loss — and the gap grows with the percentage, which is why 50% up then 50% down loses a quarter.",
      },
      {
        move: "\"The original price is the new price minus the percentage.\"",
        why: "The percentage was taken of the ORIGINAL, so removing it from the NEW price removes the wrong amount. £96 after a 20% rise came from £80, and 96 ÷ 1.2 = 80; 96 − 19.2 = 76.80 is not an original, it is a number produced by taking 20% of the wrong base.",
      },
      {
        move: "\"The change is 12 out of 92, so it went up by about 13%.\"",
        why: "The change is measured against the amount before it happened, which was 80: 12/80 = 15%. Dividing by the new value understates every increase and overstates every decrease, and the error is largest exactly where percentages matter most — big changes.",
      },
    ],
    usedFor:
      "Interest and depreciation, every statistic in a news report, concentration in chemistry and efficiency in physics, and the ratio and proportion work that follows it.",
    review: "unreviewed",
    video: {
      url: "https://www.khanacademy.org/math/pre-algebra/xb4832e56:percentages/xb4832e56:equivalent-representations-of-percent-problems/v/taking-a-percentage-example",
      title: "Percent of a whole number",
      source: "Khan Academy",
      length: "2:07",
      language: "en",
      captions: "unknown",
      summary:
        "A worked example of finding a percentage of a whole number. Watch how the percentage becomes a decimal before it multiplies; the lesson below applies the same move to a percentage change, where the base matters.",
    },
    // NO FIGURE, and that is a decision rather than an omission. Every kind the
    // figure union declares draws ONE scale — an area model, a pie, an axis. The
    // belief this lesson exists to break is that there are TWO bases, and a
    // drawing of one whole cannot show a base changing. A picture here would be
    // decoration beside the one claim it cannot make.
  },

  negatives: {
    conceptId: "negatives",
    objective: "Read, compare and calculate with numbers below zero — and know which way the answer goes.",
    intuition:
      "An underground car park already uses this idea. You are parked on level −2 and you drive up four floors. You do not arrive at 5: you arrive at 3, because you started below street level and passing zero changes nothing about the counting. Every rule about negatives is that one picture — a number line where zero is not a wall you stop at, but a line you can walk straight past.",
    idea: [
      "A negative number is an amount below zero. −4 sits the same distance from zero as 4 does, on the other side, which is why the sign is the only thing separating them: the distance of −4 from zero is 4, exactly as it is for 4. The sign says direction, not size.",
      "Adding and subtracting are moves along the line. Adding a negative moves left: 6 + (−4) = 2. Subtracting a negative needs a second look, because it takes away a leftward move, which leaves you further right: 5 − (−3) = 5 + 3 = 8. You do not have to memorise that. 5 − (−3) asks \"what number added to −3 gives 5?\", and only 8 does.",
      "Multiplying is repeated addition, so signs follow the moves. (−3) × 4 is four jumps of three to the left: −12. (−3) × (−4) reverses direction twice — taking away four debts of 3 leaves you 12 better off — so the answer is positive. One negative gives a negative answer; two negatives give a positive one.",
      "Comparing catches people out because the line runs the other way from the numbers: −2 is greater than −5, even though 5 is greater than 2. Rightwards is larger. That single fact is also why an inequality flips sign the moment you multiply or divide by a negative.",
    ],
    traps: [
      {
        move: "Turning 5 − (−3) into 5 − 3 = 2.",
        why: "The minus in front acts on a value that is already negative; it does not cancel the subtraction. On the line, subtracting a leftward move of three has to take you further right, and 5 + 3 = 8 is the only value for which 8 + (−3) comes back to 5.",
      },
      {
        move: "Saying −8 is bigger than −3 because 8 is bigger than 3.",
        why: "Distance from zero is not size. −3 sits three steps to the RIGHT of −8, and rightwards is larger, so −3 > −8. Learners who reorder numbers this way later read inequalities backwards, which is why this one is worth fixing now.",
      },
      {
        move: "Working out (−2) × (−3) as −6.",
        why: "Both signs reverse the direction, so the result points back to the positive side. Test it against the rule you already trust: (−2) × 3 = −6, so (−2) × (−3) must be the opposite of that, which is 6.",
      },
    ],
    usedFor:
      "Coordinates, gradients and inequalities all stand on this: a point below the axis, a line falling to the right, or any inequality you multiply by −1.",
    review: "unreviewed",
    // THE ADVANCED ROUTE. A learner whose evidence shows mastery of the moves is
    // handed the same picture as an ALGEBRA (numbers are positions, operations are
    // transformations) and the two results the default route can only assert:
    // why two reflections cancel, and where the inequality flip comes from. It
    // replaces the base paragraphs rather than adding to them, so nothing is
    // read twice.
    routes: [
      {
        when: "advanced",
        idea: [
          "Treat every number as a POSITION on the line and every operation as a transformation, and the sign rules stop being rules to remember. Adding a number slides the whole line; multiplying by −1 reflects it through zero; subtracting b is adding the reflection of b. That is the whole algebra, and 5 − (−3) = 8 is one sentence in it: reflect −3 to 3, then slide right by 3.",
          "This framing answers what the default route can only assert. Why is (−2) × (−3) positive? Multiplication by a negative is a reflection through zero, and reflecting twice returns you to where you began — two half-turns make a full turn. The product of two negatives is positive because the two reversals cancel, not because \"two minuses make a plus\" is something to chant.",
          "Two results worth deriving now, because both are used later. Distance between two numbers is |a − b|, so the distance from −4 to 3 is 7, and the midpoint is their mean, (−4 + 3)/2 = −0.5 — check on the line that −0.5 is equally far from −4 and from 3. Then the inequality flip follows from the same picture: multiplying by −1 MIRRORS the line, so every point that was to the left is now to the right, and a \"less than\" becomes a \"greater than\" because the order reversed, not because of a separate rule.",
        ],
      },
    ],
    // THE PICTURE IS THE RULE. 5 − (−3) is the one move in this concept that a
    // learner reliably gets backwards, and it is backwards because they picture
    // it as "take away", which travels left. Drawn, the journey travels right
    // and the sentence in the plan describes what the picture already shows.
    figure: {
      spec: { kind: "number-line", min: -6, max: 10, from: 5, to: 8 },
      caption:
        "Start at 5. Taking away −3 is removing a leftward move, so the journey goes RIGHT to 8 — the arrow does not turn round because the sign does.",
    },
  },

  // ── THE TWO IDEAS EVERY LATER NUMBER TOPIC ASSUMES ────────────────────────
  // These were supplemental: a genome paragraph plus a lens. That is enough to
  // remind someone and not enough to teach someone who has never met the idea,
  // which is who the catch-up path sends here. Written to the pilot format:
  // objective, intuition before terminology, several idea paragraphs in the
  // order they must land, traps that say WHY the wrong move fails.
  "place-value": {
    conceptId: "place-value",
    objective:
      "Read and write any number by what each digit is actually worth, and explain what multiplying or dividing by ten does to it.",
    intuition:
      "A bus goes past with the number 45 on the front. A price tag reads £45. Same two digits, and one of them is nine times bigger than the other number's twin. The digits did not change; their POSITION did. That is the whole idea, and it is why 405 and 45 are not the same amount of anything.",
    idea: [
      "Every column is ten times the column on its right. So 452 is not \"four, five, two\": it is 4 hundreds + 5 tens + 2 ones = 400 + 50 + 2. The digit 4 is worth 400 here, 40 in 45, and 4 in 4 — the same symbol, three different amounts.",
      "Zero is a placeholder, not decoration. 405 has no tens, and the zero is what holds the hundreds column in its place. Drop it and you have written 45, a different number. This is also why you cannot \"cancel\" a zero off the end of a number unless you are dividing by ten.",
      "Multiplying by 10 moves every digit one column LEFT, because each digit becomes ten times bigger: 35 × 10 = 350. Dividing by 10 moves them right, which is why 350 ÷ 10 = 35. The decimal point never moves — the digits do, and the point stays where it is to mark the ones column.",
      "Decimals continue the same pattern to the right. The column after the point is tenths, then hundredths: 0.1 is one tenth, 0.45 is four tenths and five hundredths. Nothing new starts at the point; the tens pattern simply keeps halving in the other direction.",
      "Comparing numbers means comparing the leftmost column where they differ, not counting digits. 0.45 and 0.5 look like 45 against 5, but line up the columns: 0.45 is 45 hundredths and 0.5 is 50 hundredths, so 0.5 is larger. The same rule settles 4,099 against 4,100.",
      "This is the machinery under every written method you will meet. Column addition lines up the columns so ones meet ones; long multiplication splits a number into its place-value parts; standard form writes a number as a digit string times a power of ten. A learner who cannot say what a digit is worth cannot check any of them.",
    ],
    traps: [
      {
        move: "Saying the 4 in 452 is worth 4.",
        why: "The value comes from the column, not the symbol. That 4 sits in the hundreds column, so it contributes 400; the number would be 52 without it. Ask \"which column is it in?\" before \"what is the digit?\".",
      },
      {
        move: "Deciding 0.45 is bigger than 0.5 because 45 is bigger than 5.",
        why: "They are not in the same column. 0.45 is 45 hundredths and 0.5 is 5 tenths, which is 50 hundredths — so 0.5 is bigger. Compare by place, and pad with zeros if it helps: 0.45 against 0.50.",
      },
      {
        move: "Multiplying by 10 by writing a zero on the end.",
        why: "That happens to work for whole numbers and quietly fails for decimals: 3.5 × 10 is 35, not 3.50. The digits move one column left; writing a zero does not move anything, it just adds a placeholder.",
      },
    ],
    terms: [
      { term: "digit", meaning: "One of the ten symbols 0–9. On its own it has no value; its column gives it one." },
      { term: "place value", meaning: "What a digit is worth because of the column it sits in — 4 means 400 in 452." },
      { term: "placeholder", meaning: "A zero that keeps the other digits in their columns, as in 405." },
    ],
    recap: [
      "Each column is ten times the one on its right, so 452 = 400 + 50 + 2.",
      "Zero holds a column open; 405 is not 45.",
      "Multiplying by 10 moves the digits one column left; the decimal point stays put.",
    ],
    usedFor:
      "Column addition and subtraction, long multiplication and division, decimals, rounding and standard form all read the columns this way.",
    review: "unreviewed",
    video: {
      url: "https://www.youtube.com/watch?v=wx2gI8iwMCA",
      title: "Introduction to place value",
      source: "Khan Academy",
      language: "en",
      captions: "unknown",
      summary:
        "An introduction to place value. Watch how a digit's value comes from its column rather than from the digit alone; the lesson below uses the same columns for whole numbers and decimals.",
    },
  },

  "multiplication": {
    conceptId: "multiplication",
    objective:
      "Multiply any two whole numbers without a calculator, and explain why the column method works rather than just following it.",
    intuition:
      "A hall has 4 rows of 3 chairs. You do not count twelve chairs one at a time; you see four equal groups and know the total. That is what multiplication is — repeated addition of equal groups — and 4 × 3 and 3 × 4 give the same twelve because a 4-by-3 rectangle is the same rectangle turned on its side.",
    idea: [
      "4 × 3 means four groups of three: 3 + 3 + 3 + 3 = 12. The two numbers have names that matter later — factors — and the answer is the product. Multiplication is commutative (4 × 3 = 3 × 4) and associative ((2 × 3) × 4 = 2 × (3 × 4)), which is what lets you regroup a hard product into two easy ones.",
      "Split a number by its place value and the hard product becomes two easy ones: 23 × 4 = (20 × 4) + (3 × 4) = 80 + 12 = 92. This is not a trick; it is the distributive law, and it is the reason every written method looks the way it does.",
      "The column method is that split written down. For 23 × 14 you multiply by the 4 ones first (92), then by the 1 ten — which gives 23 tens, not 23 ones — and add: 230 + 92 = 322. The shifted second row is the tens row, which is why the zero appears at its end.",
      "Times tables are retrieval, not the idea. Knowing 6 × 7 by heart frees working memory, but if it slips, derive it: 6 × 7 = 6 × 5 + 6 × 2 = 30 + 12 = 42. A learner with two anchor facts and the distributive law can rebuild the rest.",
      "Always estimate before and after. 23 × 14 is about 20 × 14 = 280, so 322 is plausible and 115 is not. Estimation is not a second method; it is the check that catches a missing shifted row.",
    ],
    traps: [
      {
        move: "Writing 23 × 4 = 812 by putting 8 and 12 side by side.",
        why: "12 ones is one ten and two ones, so the ten has to be carried into the tens column: 80 + 12 = 92. Writing the digits in sequence treats a two-digit column result as if it were two separate columns.",
      },
      {
        move: "Forgetting the shift when multiplying by the tens digit.",
        why: "The 1 in 14 is one ten, so 23 × 1 gives 23 TENS — 230, not 23. Adding 23 + 92 = 115 instead of 322 is the classic missing-zero error, and estimating first catches it immediately.",
      },
      {
        move: "Multiplying a decimal by 10 by appending a zero.",
        why: "0.4 × 10 is 4, not 0.40. The digits move one column left; appending a zero leaves the value unchanged. (Place value is the idea doing the work here.)",
      },
      {
        move: "Treating multiplication as addition when the numbers are small.",
        why: "3 × 4 is 12, while 3 + 4 is 7. The sign tells you which structure you have: equal groups means multiply, combining unequal amounts means add.",
      },
    ],
    terms: [
      { term: "factor", meaning: "One of the numbers being multiplied; in 23 × 4, both 23 and 4 are factors." },
      { term: "product", meaning: "The result of a multiplication." },
      { term: "partition", meaning: "Splitting a number into place-value parts, as 23 becomes 20 + 3." },
    ],
    recap: [
      "Multiplication is repeated addition of equal groups, and 4 × 3 = 3 × 4.",
      "Partition by place value: 23 × 4 = 80 + 12 = 92.",
      "The second row of a long multiplication is TENS, so it is shifted; estimate to check.",
    ],
    usedFor:
      "Division, fractions, ratio and proportion, area, algebra (3x means 3 times x) and every formula that multiplies a rate by a time.",
    review: "unreviewed",
    // THE ARRAY IS THE IDEA. Four rows of three is the picture the intuition
    // opens with, and the same rectangle on its side is why 4 × 3 = 3 × 4 — a
    // fact the prose asserts and this drawing shows. The column method has its
    // own worked example and is not what a rectangle can teach.
    figure: {
      spec: {
        kind: "rectangle",
        widthParts: [{ units: 3, label: "3" }],
        heightParts: [{ units: 4, label: "4" }],
        emphasis: ["12"],
      },
      caption:
        "Four rows of three chairs, drawn as a rectangle. Its area is 3 × 4 = 12, and turning the same rectangle on its side gives 4 × 3 — the same twelve chairs, which is why the order of the factors does not change the product.",
    },
  },

  "order-ops": {
    conceptId: "order-ops",
    objective: "Evaluate any arithmetic expression the way the rest of the world does, and explain why that order is the one.",
    intuition:
      "3 + 4 × 2 is 11, not 14 — and the reason is not that 11 is the more pleasing answer. Multiplication is repeated addition, so 4 × 2 is a single quantity: eight. The expression reads \"three, plus the object eight\". It never says \"three plus four, and then double it\".",
    idea: [
      "Brackets are a request to act early. They do not change the rules; they say \"work this out first\": 3 × (4 + 2) = 18, where 3 × 4 + 2 = 14.",
      "Indices come next because a power is already a finished multiplication: 3² means 3 × 3. So 2 + 3² is 2 + 9 = 11, and someone who reads it left to right gets 25 from squaring (2 + 3).",
      "Multiplication and division have the SAME rank, as do addition and subtraction. Equal ranks are worked left to right: 12 ÷ 4 × 3 = 9, because 12 ÷ 4 = 3 and 3 × 3 = 9. Reading it right to left gives 1, which is a different sum.",
      "The order is a shared convention, not a law of mathematics — without it, one written expression would have several values and nobody could check anybody's work. It is also what makes formulae predictable later: in 3x² with x = 4, the power belongs to x, so the value is 3 × 16 = 48.",
    ],
    traps: [
      {
        move: "Working straight through from left to right.",
        why: "That gives 14 for 3 + 4 × 2. The 4 × 2 is one quantity — eight — and quantities are finished before they are joined to anything.",
      },
      {
        move: "Doing multiplication before division because M comes first in BIDMAS.",
        why: "They share a rank, so 12 ÷ 4 × 3 is 9. Taking the multiplication first makes 12 ÷ 12 = 1. The letters are a memory aid, not three separate ranks.",
      },
      {
        move: "Reading −3² as 9.",
        why: "The power binds to 3 alone and the minus is applied afterwards: −(3²) = −9. If the negative is meant to be squared, it has to be bracketed as (−3)², which is why that bracket gets written.",
      },
    ],
    usedFor:
      "Every formula you meet later — substituting into 3x² + 2, evaluating a physics equation, simplifying an expression — is this order applied to letters instead of numbers.",
    review: "unreviewed",
    video: {
      url: "https://www.youtube.com/watch?v=eoYThjIAhOc",
      title: "Order of operations introduction",
      source: "Khan Academy",
      length: "4:33",
      language: "en",
      captions: "unknown",
      summary:
        "A worked introduction to the order of operations. Watch how brackets and powers are handled before multiplication and addition; the lesson below uses the same order on expressions with letters.",
    },
  },

  "algebra-expressions": {
    conceptId: "algebra-expressions",
    objective: "Write an expression for a situation, simplify it by collecting like terms, and evaluate it for a given value.",
    intuition:
      "A letter is a label on a box you have not opened. \"3x + 2\" says: three boxes of the same size, and two loose counters. You can merge boxes with boxes — 2x + 3x is five boxes — but a box cannot be added to a counter, which is exactly why 3x + 2y stays as it is.",
    idea: [
      "A term is built from a coefficient and a letter part: in 5x the 5 multiplies the x. 5x means x + x + x + x + x. It does not mean 5 followed by x, and it does not mean 5 + x.",
      "Like terms have exactly the same letter part. 3x + 2x = 5x, and 7x − 4x = 3x. 3x + 2x² does not simplify: x and x² are different sizes of thing, a box and a square of boxes, so their counts cannot be added.",
      "Multiplying is not adding. 3x × 2x = 6x², because the coefficients multiply (3 × 2) and the letter parts multiply as well (x × x = x²). The commonest error in this topic is doing the multiplying rule on an adding question.",
      "Substituting means replacing the letter with a number, and a negative value goes in BRACKETS so the sign travels with it: x = −2 in 3x + 2 gives 3(−2) + 2 = −6 + 2 = −4.",
      "Expanding reverses the brackets: 3(x + 4) = 3x + 12, because the whole bracket is one quantity being tripled, so every term inside is tripled. Missing the second term is what leaves 3x + 4.",
    ],
    traps: [
      {
        move: "3x + 2y = 5xy.",
        why: "Adding counts how many of one thing you have; x and y are different things, so their counts cannot merge. 5xy is a product — five times x times y — which is a different quantity altogether, and you can see it: with x = y = 2, the left side is 10 and 5xy is 20.",
      },
      {
        move: "3 + 2x = 5x.",
        why: "The 3 is a number and the 2x is a count of boxes; joining them invents a box that was never there. Substitute to check: with x = 3, 3 + 2x = 9 while 5x = 15.",
      },
      {
        move: "Reading 2x² as (2x)².",
        why: "The power belongs to x alone. With x = 3, 2x² = 2 × 9 = 18, while (2x)² = 36. Whenever the coefficient is meant to be squared too, the bracket has to be written.",
      },
    ],
    usedFor:
      "Solving equations, expanding and factorising, and every formula in science: once you can read 3x + 2 as a quantity, the rest of algebra is the same language.",
    review: "unreviewed",
    // THE AREA MODEL OF EXPANSION. "Every term inside is multiplied" is a rule a
    // learner can recite and still not apply; a rectangle whose corner cell is
    // 12 is the same statement as a count. The `x` band is one unit wide so the
    // 4-band is visibly four times it.
    figure: {
      spec: {
        kind: "rectangle",
        widthParts: [{ units: 1, label: "x" }, { units: 4, label: "4" }],
        heightParts: [{ units: 3, label: "3" }],
      },
      caption:
        "3(x + 4) as an area: three rows, each holding an x and a 4. The cells read 3x and 12 — the 12 is the term left out when someone writes 3x + 4.",
    },
  },

  coordinates: {
    conceptId: "coordinates",
    objective: "Plot and read points on a grid, and read an equation as the shape it draws.",
    intuition:
      "A map reference works like this: go along the corridor, then up the stairs. Coordinates always give the horizontal move first. (3, 2) and (2, 3) are two different places, which is why the order is not a detail you can shrug at.",
    idea: [
      "The axes cross at the origin (0, 0). x counts to the right, with negatives to the left; y counts upwards, with negatives downwards. The grid is four regions — the quadrants — and each is defined by the signs of its points.",
      "A point is written (x, y) — along, then up. So (3, −2) is three right and two down, which puts it in the bottom-right quadrant. (−3, 2) is a different point on the other side.",
      "An equation is a rule for which points belong. y = 2x + 1 says: pick an x, double it, add one, and that is the y. Choosing x = 0, 1, 2 gives (0, 1), (1, 3), (2, 5).",
      "Joining those points gives a straight line, and the straightness is information: a constant step in x producing a constant step in y is what \"linear\" means. A curve on a linear equation is evidence of an arithmetic slip in the table, not a discovery.",
      "Reading a graph and solving an equation are the same fact in two languages. Where two lines cross, that point's coordinates satisfy both equations at once — which is what solving a pair of equations simultaneously is.",
    ],
    traps: [
      {
        move: "Plotting (3, −2) as three up and two left.",
        why: "The pair is x then y, the same order as the alphabet. Swapping them puts the point in a different place entirely — it reflects the point in the line y = x — and every gradient and distance read from that point then comes out wrong.",
      },
      {
        move: "Reading a y-value off the horizontal axis.",
        why: "The horizontal axis is x. A point that sits ON the x-axis has y = 0, which is why its coordinates look like (4, 0) and why an intercept on that axis is where the graph crosses zero.",
      },
      {
        move: "Freehand-joining plotted points into a wobbly curve.",
        why: "Two points are enough to fix a straight line, so a curve on a linear equation means a mistake in the table. Checking one plotted point by substituting its x into the equation catches it before the line is drawn.",
      },
    ],
    usedFor:
      "Straight-line graphs, gradients, quadratics and every graph in science: this is where algebra becomes something you can see.",
    review: "unreviewed",
    // THE POINTS AND THE LINE THEY MAKE. A table of values plus a rule is how
    // the idea is taught; the picture is what makes "constant step in x, constant
    // step in y" visible, and the line is drawn from the same rule the plan
    // quotes (y = 2x + 1) rather than from the counts.
    figure: {
      spec: {
        kind: "axes",
        xMin: -1, xMax: 4, yMin: -1, yMax: 6,
        points: [{ at: [0, 1] }, { at: [1, 3] }, { at: [2, 5] }],
        lines: [{ from: [-1, -1], to: [2.5, 6] }],
      },
      caption:
        "y = 2x + 1 plotted: from (0, 1) each step of 1 across goes 2 up, so the points sit on one straight line. A wobble in the line would be an arithmetic slip in the table, not a discovery.",
    },
  },

  "algebra-expand": {
    conceptId: "algebra-expand",
    objective: "Multiply out a pair of brackets, say where each of the four terms came from, and factorise a simple quadratic back again.",
    intuition:
      "A garden is x + 3 metres long and x + 2 metres wide, with the x part cut off at a fixed place on each side. Its area is not one number you can look up — but the garden splits into four rectangular beds, and each bed has an area you can write down. Expanding brackets is that split written out, which is why nothing is ever dropped.",
    idea: [
      "One bracket is one quantity multiplied. 3(x + 4) says: the whole quantity x + 4 is tripled, so both parts are tripled — 3x + 12. The 4 is a length inside the bracket, not a separate add-on, which is why 3x + 4 is too small.",
      "Two brackets multiply every term of the first by every term of the second, because each side is a length and the area model needs a rectangle for each pair. (x + 3)(x + 2) gives four pieces: x², 2x, 3x and 6.",
      "The middle term is made of the two CROSS pieces. 2x and 3x are different rectangles, and they add to 5x — so x² + 5x + 6. The 5 is not 3 + 2 arrived at separately; it is what the two crossings come to, which is also why x² + 6 is a real answer to a different question.",
      "A sign belongs to the term it sits in front of, and it travels into every product that term takes part in. (x − 3)(x + 2) = x² + 2x − 3x − 6 = x² − x − 6: the −3 changes both of its products, which is what turns +2x into 2x − 3x = −x.",
      "Factorising reverses the multiplication, so it is a search with two clues. In x² + 5x + 6 the two numbers must multiply to 6 (the constant) and add to 5 (the middle), which only 2 and 3 do. The sign of the constant tells you whether the two numbers share a sign; the sign of the middle tells you which sign they share when they do.",
      "(x + 3)(x − 3) = x² − 9: the cross pieces are +3x and −3x, equal and opposite, so they cancel and no middle term survives. That is the difference of two squares, and it is a pattern you can recognise rather than a separate rule to memorise.",
    ],
    traps: [
      {
        move: "Writing (x + 3)(x + 2) = x² + 6.",
        why: "The two cross pieces have been dropped. With x = 10 the brackets give 13 × 12 = 156, while x² + 6 gives 106 — the missing 50 is 2x + 3x. Any expansion can be checked the same way, by substituting a value into the brackets and into the answer.",
      },
      {
        move: "Expanding 3(x + 4) as 3x + 4.",
        why: "Only the first term was multiplied. The bracket is one length tripled: with x = 2 the true value is 3 × 6 = 18, and 3x + 4 gives 10. One substitution at the end catches this every time.",
      },
      {
        move: "Writing (x − 3)(x + 2) = x² + 5x − 6.",
        why: "The −3 was multiplied by x but its sign was not carried into the second product: the pieces are −3 × 2 = −6 AND −3 × x = −3x. Adding the middle terms honestly gives 2x − 3x = −x, so the answer is x² − x − 6.",
      },
      {
        move: "Factorising x² + 5x + 6 as (x + 1)(x + 6).",
        why: "Those numbers multiply to 6 but add to 7, and the middle term says 5. Both clues have to hold at once; check by expanding the pair back and seeing whether you recover the expression you started with.",
      },
    ],
    usedFor:
      "Quadratics, completing the square, the quadratic formula and any area problem with an unknown side — this is the multiplication that all of them are built on.",
    review: "unreviewed",
    // THE FOUR BEDS OF THE GARDEN. "Every term meets every term" is a rule a
    // learner can recite and still leave a cross piece out; the grid makes the
    // two crossings two separate rectangles whose labels sum to the middle term.
    // The cell labels are COMPUTED (`areaTerm`), so a grid can never print a
    // product that is not the product of its own bands.
    figure: {
      spec: {
        kind: "rectangle",
        heightParts: [{ units: 1, label: "x" }, { units: 3, label: "3" }],
        widthParts: [{ units: 1, label: "x" }, { units: 2, label: "2" }],
      },
      caption:
        "(x + 3)(x + 2) drawn as four beds: x², 2x, 3x and 6. The middle term of the answer is the two cross beds added together, and leaving one of them out is exactly how x² + 6 appears instead.",
    },
  },

  "straight-lines": {
    conceptId: "straight-lines",
    objective: "Find the gradient and intercept of a line from its equation or from two points, and say what each number does to the picture.",
    intuition:
      "A taxi fare is a fixed charge to get in plus a price per mile: 3 + 2d. Change d and the fare changes at a steady rate; that rate is the whole line. Every straight line is a starting value plus a rate — and a graph is the fare chart you could read without doing the arithmetic again.",
    idea: [
      "y = mx + c carries two numbers. m is the gradient — how much y changes for each 1 across — and c is the value of y when x is 0, which is where the line crosses the vertical axis.",
      "The gradient is rise ÷ run, and rise is vertical while run is horizontal: a line that climbs 3 for every 2 across has m = 3/2. Between two points it is (y₂ − y₁) ÷ (x₂ − x₁) — the SAME point first on top and bottom, because swapping one and not the other flips the sign.",
      "Direction matters as much as steepness. A line falling from left to right has a negative gradient; a horizontal line has m = 0; a vertical line has no gradient at all, because the run is zero and division by zero is not a number.",
      "c is the y-intercept, at the point (0, c) — not the x-intercept. Where the line crosses the horizontal axis is where y = 0, so it is found by solving mx + c = 0. Those two intercepts are usually different numbers, and reading one off as the other is a reliable way to lose marks.",
      "Parallel lines share the same m and differ only in c. Perpendicular lines have gradients that multiply to −1, so a line perpendicular to y = 2x has gradient −1/2: it falls while the first climbs, and by the reciprocal amount.",
      "A gradient is a rate, which is why this idea leaves maths: speed on a distance–time graph, cost per item, degrees per minute. Given a table, the gradient is the change in the second column per ONE unit of the first — divide the difference by however many units the step covered.",
    ],
    traps: [
      {
        move: "Computing run ÷ rise instead of rise ÷ run.",
        why: "That inverts every answer, so a steep line reads as shallow. Check with one step: going 1 across should move the line up by m, and if the picture moves up 3 while your gradient says 2, the fraction is upside down.",
      },
      {
        move: "Working out (y₂ − y₁) ÷ (x₁ − x₂).",
        why: "One difference has been reversed and the other not, which flips the sign of the gradient — so a climbing line comes out falling. Pick which point is 'first' and use it first in both differences.",
      },
      {
        move: "Reading c as the x-intercept — saying y = 2x + 4 crosses the horizontal axis at 4.",
        why: "c is the value at x = 0, so 4 is where it crosses the VERTICAL axis. The horizontal crossing solves 2x + 4 = 0, which is x = −2. Substituting 0 for x, and separately 0 for y, tells you which is which without memorising anything.",
      },
    ],
    usedFor:
      "Distance–time and velocity–time graphs, every rate in science, simultaneous equations solved by graphs, and finding the equation of a line through two given points.",
    review: "unreviewed",
    // THE TRIANGLE IS THE DEFINITION. `m = rise ÷ run` is a sentence a learner can
    // recite while reading a steep line as shallow; drawn on the line, the two
    // legs are lengths they can count, and the division is the thing they do with
    // them. The quotient is deliberately NOT printed — the picture raises the
    // question the lesson answers, and the intercept is marked with the SYMBOL c
    // rather than its value for the same reason.
    figure: {
      spec: {
        kind: "axes",
        xMin: -1, xMax: 4, yMin: -3, yMax: 6,
        lines: [{ from: [-1, -3], to: [3, 5] }],
        points: [{ at: [0, -1], label: "c" }],
        gradient: { from: [1, 1], to: [3, 5] },
      },
      caption:
        "y = 2x − 1 with the rise/run triangle drawn on it: 2 across and 4 up, so the gradient is 4 ÷ 2 = 2. The line meets the vertical axis at c, one step below zero — that is the number after the x, not the place it crosses the other axis.",
    },
  },

  "completing-square": {
    conceptId: "completing-square",
    objective: "Rewrite x² + bx + c in the form (x + p)² + q, and read the turning point straight off the result.",
    intuition:
      "Lay a patio x metres by x metres, then add two strips along two sides to make it bigger. The shape you now have is not a square: there is a notch where the two strips fail to meet. x² + 6x is exactly that shape — a square plus two 3-by-x strips — and the only thing missing to make it a square again is the little corner where the strips would cross.",
    idea: [
      "x² + 6x is not a perfect square, and the reason is visible: a square of side x has area x², and adding 6x is adding two equal strips, 3x each. Splitting the 6 in half is where the 3 comes from, which is why the method starts by halving the coefficient of x.",
      "Completing the square means adding the missing corner. The strips are 3 wide, so the corner is 3 × 3 = 9. Adding it gives x² + 6x + 9, which is a square of side (x + 3), because (x + 3)² = x² + 6x + 9.",
      "If the expression does not already contain that 9, you add it and take it straight back out, so the value never changes: x² + 6x + 5 = (x² + 6x + 9) − 9 + 5 = (x + 3)² − 4. The bracket is the completed square; the number after it is whatever is left over.",
      "The rule, once and for all: halve the coefficient of x, square it, write (x + half)², then subtract the square you added. For x² − 6x the half is −3, so the form is (x − 3)² − 9 plus whatever constant the expression already had. The sign of the half follows the sign of the x term — it is never chosen for tidiness.",
      "WHY anyone bothers: a square cannot be negative. (x + 3)² is 0 at least, so (x + 3)² − 4 is −4 at least, and it reaches −4 exactly when x = −3. That is the turning point read off with no table of values and no calculus: the minimum is −4, at x = −3. With the sign outside different — a −(x + 3)² − 4 — it would be a maximum instead.",
      "It also solves equations that factorising cannot reach. (x + 3)² − 4 = 0 gives (x + 3)² = 4, and a square equal to 4 has TWO roots, x + 3 = 2 or x + 3 = −2, so x = −1 or x = −5. Taking only the positive branch is the same error as forgetting a ± in the quadratic formula, because it is literally the same step.",
    ],
    traps: [
      {
        move: "Writing (x + 3)² = x² + 9.",
        why: "The square of a bracket is not the sum of the squares of its parts: (x + 3)² = (x + 3)(x + 3) = x² + 3x + 3x + 9. The two 3x strips are the whole point of the shape, so dropping them removes exactly the term the method is trying to explain.",
      },
      {
        move: "Turning x² + 6x + 5 into (x + 3)² − 9 and stopping.",
        why: "The 9 has been taken away but the original +5 has gone missing, so the expression is no longer equal to the one you started with. Substitute x = 0 to see it: the original is 5, while (x + 3)² − 9 is 0. The form must be (x + 3)² − 4, and the check is that both sides agree at any value of x.",
      },
      {
        move: "Solving (x + 3)² = 4 by taking the positive root only.",
        why: "Both 2 and −2 square to 4, so the equation has two solutions, x = −1 and x = −5. A sketch of the parabola shows two crossings of the axis, which is the independent check that a root has not been lost.",
      },
      {
        move: "Completing the square on x² − 6x + 5 as (x + 3)² − 4.",
        why: "The half of −6 is −3, not +3, so the bracket is (x − 3)². Expanding your answer is the test: (x + 3)² − 4 gives x² + 6x + 5 — the wrong sign on the middle term, which the expansion makes obvious in one line.",
      },
    ],
    usedFor:
      "Turning points and curve sketching, maximum and minimum problems, solving quadratics that do not factorise, and the derivation of the quadratic formula itself.",
    review: "unreviewed",
    // THE MISSING CORNER, DRAWN. x² + 6x is a square with two strips and a notch;
    // the 9 is the piece that closes it, and it has to READ as the added piece
    // rather than as one of four equal cells. The grid is the same verified area
    // model as the expansion lesson — (x + 3)² is four cells whose areas are the
    // terms — with the corner marked.
    figure: {
      spec: {
        kind: "rectangle",
        heightParts: [{ units: 1, label: "x" }, { units: 3, label: "3" }],
        widthParts: [{ units: 1, label: "x" }, { units: 3, label: "3" }],
        emphasis: ["9"],
      },
      caption:
        "x² + 6x drawn as a shape: the x-by-x square plus two 3-by-x strips (3x each), with a notch where they fail to meet. The marked 9 is the corner that closes it, so x² + 6x + 9 = (x + 3)².",
    },
  },

  quadratics: {
    conceptId: "quadratics",
    objective: "Solve a quadratic equation by factorising, and know from the equation itself when to reach for the formula instead.",
    intuition:
      "A ball thrown upwards is at 6 metres on the way up and again on the way down. \"When is it 6 metres high?\" has two answers, and that is not a quirk of the ball — it is what a quadratic equation is: the same value reached twice, before and after the turning point. A quadratic can have two solutions, one, or none, and the equation itself tells you which.",
    idea: [
      "Put it in standard form first: everything on one side, zero on the other. x² − 5x = −6 becomes x² − 5x + 6 = 0. Factorising only works against zero, because the whole method rests on a product being zero — so this rearrangement is the first step, not tidying up.",
      "Factorising is a search with two clues: two numbers that multiply to the constant (+6) and add to the coefficient of x (−5). Here −2 and −3, so (x − 2)(x − 3) = 0. Check by expanding — that is the one habit that catches a wrong pair before it becomes a wrong answer.",
      "The zero product rule finishes it: if two things multiply to zero, at least one of them is zero. So x − 2 = 0 or x − 3 = 0, giving x = 2 or x = 3. Both are solutions; the equation is satisfied by either, not by both at once.",
      "When no pair of whole numbers fits, the formula does the same job without guessing: x = (−b ± √(b² − 4ac)) ÷ 2a, with a, b and c read off standard form INCLUDING their signs. It is not a different method — it is the same equation solved by completing the square once and for all, which is why it never fails.",
      "The discriminant b² − 4ac decides how many answers to expect before you compute anything: positive gives two real roots, zero gives one repeated root (the curve just touches the axis), negative gives none (the curve never reaches it). Negative is an answer about the curve, not a mistake in the arithmetic.",
      "The two roots are where the parabola crosses the x-axis, and the turning point sits exactly halfway between them. So a sketch is a check on the algebra: if your answers are 2 and 3, the curve must cross at 2 and 3 and turn at 2.5 — an answer of 2 and 8 for a curve whose sketch crosses close together means the factorising went wrong.",
    ],
    traps: [
      {
        move: "Solving x² = 3x by dividing both sides by x.",
        why: "Dividing by x throws away the case x = 0, and x = 0 really is a solution. Move everything to one side and factorise instead: x² − 3x = 0, so x(x − 3) = 0, giving x = 0 or x = 3. Do not divide by a variable unless you have first checked that it cannot be zero; factorise it out instead.",
      },
      {
        move: "Reading (x − 2)(x − 3) = 0 as x = −2 or x = −3.",
        why: "Each bracket is set to zero and solved, which reverses its sign: x − 2 = 0 gives x = +2. Substituting back settles it in seconds — putting x = 2 into the original makes the first bracket zero, which is exactly what the equation claims.",
      },
      {
        move: "Using the formula with c taken as positive from 2x² + 3x − 5.",
        why: "The signs belong to the terms: a = 2, b = 3, c = −5. Dropping the minus changes the discriminant from 9 + 40 = 49 to 9 − 40 = −31 and turns two real roots into none — a wrong answer that looks like a legitimate \"no solutions\" conclusion.",
      },
      {
        move: "Reporting a negative discriminant as an error.",
        why: "It is information: the parabola sits entirely above or below the axis, so there is no real x making the expression zero. Say so, and support it with the sign of a — that is a complete answer, not a failed one.",
      },
    ],
    usedFor:
      "Curve sketching, where a line meets a curve, maximum-area and optimisation problems, and any \"when does it reach\" question in physics — the two roots are the two times.",
    review: "unreviewed",
    // THE CROSSINGS ARE THE ROOTS, DRAWN. The plan's last idea says a sketch is a
    // check on the algebra; this is that sketch, computed from the same
    // coefficients the plan solves (x² − 5x + 6), with the axis of symmetry
    // dashed in. A pair of answers that does not sit either side of that line
    // cannot be the roots of this curve.
    figure: {
      spec: {
        kind: "axes",
        xMin: -1, xMax: 6, yMin: -2, yMax: 8,
        curve: { a: 1, b: -5, c: 6 },
        points: [{ at: [2, 0] }, { at: [3, 0] }],
        lines: [{ from: [2.5, -2], to: [2.5, 8], dashed: true }],
      },
      caption:
        "y = x² − 5x + 6 drawn from its own coefficients: it crosses the horizontal axis at 2 and 3, the two roots the factorising gives, and it turns on the dashed line exactly halfway between them. A pair of answers with no such crossing is a pair the algebra got wrong.",
    },
  },

  surds: {
    conceptId: "surds",
    objective: "Simplify, combine and rationalise surds, and say why an exact root can be a better answer than a decimal.",
    intuition:
      "Draw a square one metre by one metre and measure its diagonal. The length is real — you can cut a piece of string for it — but no fraction names it exactly. That length is √2, and a surd is how mathematics writes a number it can point at precisely but cannot write as a decimal that stops.",
    idea: [
      "A surd is a root of a number that is not a perfect square, kept in root form. √2 is about 1.41421356, and the digits never end and never repeat, so any decimal you write is an approximation — while √2 is the number itself. That is the whole reason surds are kept rather than evaluated.",
      "Simplify by pulling out the largest square factor. √50 = √(25 × 2) = √25 × √2 = 5√2, using √(ab) = √a × √b — a rule about MULTIPLICATION only, which is why it cannot be applied to a sum. The largest square matters: pulling out 1 leaves the surd unchanged and looks like working without being any.",
      "Surds add like algebraic terms, because that is exactly what they are. 3√2 + 5√2 = 8√2, the same way 3x + 5x = 8x. √2 + √3 does not combine, the same way x + y does not: the roots are different sizes of thing.",
      "Rationalising removes a root from a denominator by multiplying top and bottom by something that squares it away. 1/√2 becomes √2/2, because √2 × √2 = 2 — and multiplying both parts by the same thing does not change the value, only its form. For 1/(1 + √2) the multiplier is the conjugate 1 − √2, chosen so the denominator becomes 1 − 2 by the difference of two squares.",
      "The check that catches the commonest error in the topic: √(a + b) is NOT √a + √b. With 9 and 16, √25 = 5 while √9 + √16 = 7. Roots distribute over multiplication and division only, and testing one pair of numbers is enough to see it.",
      "Exactness has a practical pay-off. (5√2)² is 25 × 2 = 50 exactly, while squaring 7.0710678 gives something that only rounds to 50. In a multi-step problem the rounding error grows at every step, which is why the exact form is kept until the final line.",
    ],
    traps: [
      {
        move: "Writing √(a + b) = √a + √b.",
        why: "Test it: √(9 + 16) = √25 = 5, but √9 + √16 = 3 + 4 = 7. The rule that lets you split a root is about a PRODUCT — √(ab) = √a × √b — and using it on a sum is the single most common surd error.",
      },
      {
        move: "Simplifying √50 as 25√2.",
        why: "25 is the square, not the root: √50 = √25 × √2 = 5√2. The answer must be checked by squaring it back — (5√2)² = 50, while (25√2)² = 1250, which is not the number you started with.",
      },
      {
        move: "Rationalising by multiplying only the numerator by √2.",
        why: "That changes the value: 1/√2 does not equal √2/√2. Top AND bottom must be multiplied by the same thing, so the fraction is unchanged in value — 1/√2 becomes √2/2, and the check is that both still equal about 0.707.",
      },
      {
        move: "Adding √2 + √3 as √5.",
        why: "The roots are different sizes, so they do not combine — the same reason 3x + 5y is not 8xy. Numerically √2 + √3 ≈ 3.146 while √5 ≈ 2.236, and one decimal place of checking shows the sum is not the root of the sum.",
      },
    ],
    usedFor:
      "Pythagoras and trig questions that need exact lengths, the quadratic formula (whose answers are often surds), circle geometry, and any calculation where rounding early would compound the error.",
    review: "unreviewed",
    // THE SIMPLIFICATION IS A TILING. "Pull out the largest square factor" is a
    // procedure; a square of area 50 that is exactly 25 squares of area 2, five
    // along each edge, is WHY the edge is 5√2 — and why the answer is exact
    // rather than a decimal that nearly works. The grid comes from the two
    // numbers (50, 25), so it cannot label an edge the tiling does not have.
    figure: {
      spec: { kind: "surd-square", total: 50, parts: 25 },
      caption:
        "A square of area 50 cut into 25 equal squares: each small square has area 2, so its side is √2, and the big square is five of them along each edge. That is why √50 = 5√2 — the root is the edge of the square, drawn.",
    },
  },

  "indices-intro": {
    conceptId: "indices-intro",
    objective: "Use the index laws to multiply, divide and simplify powers — and say why each law is true.",
    intuition:
      "a³ is shorthand, not a new operation: it is a × a × a. Almost every index law is just counting how many copies of a you have written down, which is why the laws are simple — multiplying two powers does not need a rule so much as a tally.",
    idea: [
      "aᵐ means m copies of a multiplied together, so a⁵ = a × a × a × a × a. The base is the a; the index is the 5. The index counts copies, and it is not a value — a⁵ is not 5a.",
      "Multiplying adds the counts: a² × a³ = (a × a)(a × a × a) = a⁵. Dividing subtracts them: a⁵ ÷ a² cancels two copies and leaves a³. Neither law needs memorising if you are willing to write the copies out once.",
      "a⁰ = 1 follows from the subtraction law for a non-zero base: aⁿ ÷ aⁿ = a⁰, and a non-zero quantity divided by itself is 1. It is not a special case bolted on — it is what the pattern forces. (0⁰ is undefined; the base must not be zero.)",
      "Negative indices carry the same pattern downwards for a non-zero base: a² ÷ a⁴ = a⁻², and that division is 1/a². So a⁻² means the reciprocal of a².",
      "Fractional indices are roots, and the reason is the multiplication law turned around: a^(1/2) × a^(1/2) = a¹, so a^(1/2) must be the number that squares to a — the square root.",
      "The laws hold only for the SAME base. 2³ × 2² = 2⁵, but 2³ × 3² stays as it is, because the copies are of different things.",
    ],
    traps: [
      {
        move: "a² × a³ = a⁶.",
        why: "That multiplies the indices, but multiplying powers ADDS how many copies you have. The multiplication sign has already done the combining; squaring the index would count every copy twice.",
      },
      {
        move: "a² + a³ = a⁵.",
        why: "The laws are for multiplying and dividing only. Adding powers means adding their VALUES: with a = 2, that is 4 + 8 = 12, not 32.",
      },
      {
        move: "Reading 2a³ as (2a)³.",
        why: "The power binds to the a alone, and the 2 is not inside it. With a = 2, 2a³ is 2 × 8 = 16, while (2a)³ is 2 × 2 × 2 × 8 = 64 — so a bracket has to be written whenever the coefficient was meant to be cubed too.",
      },
    ],
    usedFor:
      "Standard form, growth and decay, surds and quadratic formulae all rest on these laws — and they are the difference between manipulating algebra and guessing at it.",
    review: "unreviewed",
    video: {
      url: "https://www.youtube.com/watch?v=XZRQhkii0h0",
      title: "Introduction to exponents",
      source: "Khan Academy",
      length: "3:02",
      language: "en",
      captions: "unknown",
      summary:
        "An introduction to exponents. Watch how a power counts repeated factors and why a² × a³ adds the indices; the lesson below uses the same laws on algebraic expressions.",
    },
  },

  "linear-equations": {
    conceptId: "linear-equations",
    objective: "Solve one- and two-step equations, including with unknowns on both sides, and check the answer.",
    intuition:
      "The equals sign is a balance beam. 3x + 5 = 20 says: three identical bags plus five weights balance twenty weights. Whatever you take off one pan you must take off the other, or the beam tips and the two sides are no longer equal — which is the whole reason the rules of solving work.",
    idea: [
      "An equation is a claim: these two expressions are equal. Solving means finding the value of x that makes the claim true. A value that breaks the balance is not a solution, however tidy the working looked.",
      "Undo the operations in the reverse order to the one that built the expression. x was multiplied by 3 and then had 5 added; undo the addition first. Subtract 5 from both sides: 3x = 15. Then divide both sides by 3: x = 5.",
      "Both sides, always. Subtracting 5 from the left only breaks the balance, and the value you end up with will not satisfy the original equation — which is what the check at the end is for.",
      "Unknowns on both sides reduce to the same discipline: 5x = 2x + 9. Subtract 2x from both sides — that is a move performed on the whole of each side — leaving 3x = 9, so x = 3.",
      "Brackets can be expanded (3(x + 2) = 15 → 3x + 6 = 15 → x = 3) or divided away first (x + 2 = 5 → x = 3). Both routes are correct; picking the shorter one is a judgement, not a rule.",
      "Finish by substituting your answer back into the ORIGINAL equation: with x = 5, the left side is 3(5) + 5 = 20, which is what the right side says. The check takes five seconds and it is the one step that catches the sign slip the algebra hid — an answer that came from broken working still has to survive being put back.",
    ],
    traps: [
      {
        move: "Subtracting 5 from only the left-hand side.",
        why: "That tips the balance, so the two sides stop being equal and any x you read off afterwards is answering a different question. Every operation is applied to a whole side — which is also why dividing \"the 3x by 3\" and leaving the +5 alone is the same mistake in a different disguise.",
      },
      {
        move: "Moving 2x across the equals sign to get 7x = 9 on 5x = 2x + 9.",
        why: "Changing sides is not an operation; subtracting is. Subtract 2x from both sides and 5x − 2x = 9 gives 3x = 9. \"Moves across and changes sign\" happens to give the same result for added terms, which is why it survives — but it stops being true for multiplication, and it hides what is actually being done.",
      },
      {
        move: "Reporting x = 3 from 3(x + 2) = 15 without expanding correctly.",
        why: "The 3 multiplies both terms inside the bracket, so the left side is 3x + 6, not 3x + 2. Missing it gives 3x + 2 = 15, x = 13/3 — an answer that a single check by substitution would have refused.",
      },
    ],
    usedFor:
      "Formulae, simultaneous equations, rearranging, and every \"find the value of\" question in maths and science; also the discipline of checking an answer by substituting it back.",
    review: "unreviewed",
    // THE BALANCE, AS COUNTS. 3x + 5 = 20 drawn as three bags and five weights
    // against twenty weights: the picture supplies the reason the operation is
    // applied to both sides, which the prose can only assert. The units are
    // drawn as single circles so the five can be taken off by counting.
    figure: {
      spec: { kind: "balance", left: { bags: 3, units: 5 }, right: { bags: 0, units: 20 } },
      caption:
        "3x + 5 = 20 as a balance: three bags and five weights against twenty weights. Take the same five off both pans, and the three bags are left holding fifteen — so one bag is 5.",
    },
  },
  // ── SCIENCE · CELLS ───────────────────────────────────────────────────────
  // The first science lesson in the pilot pack. It is a Class 9 prerequisite
  // that the Class 10 life-processes work assumes, and it is included because a
  // learner who cannot say what a cell membrane, a chloroplast or a vacuole does
  // cannot explain photosynthesis or gas exchange. The lesson is written for
  // the CBSE English-medium classroom, not translated from a UK worksheet.
  cells: {
    conceptId: "cells",
    objective:
      "Name the parts of an animal and a plant cell, and explain how each part's structure helps it do its job.",
    intuition:
      "A brick wall and a living factory look equally solid from a distance, and only one of them is doing anything. A cell is the smallest piece of a living thing that can carry out all the processes of life: it takes in materials, releases energy, makes what it needs and gets rid of waste. Most cells are too small to see without a microscope, which is why the idea feels abstract until you look at one.",
    idea: [
      "A cell is the basic structural and functional unit of life. Every living organism is made of one cell (a bacterium) or many cells (a plant, an animal, you). The cell is not a container with parts floating in it by accident: each part, or organelle, has a job, and the shape of the part is tied to that job.",
      "An animal cell has a cell membrane around the outside, cytoplasm inside, a nucleus, and mitochondria. The membrane is a thin, flexible boundary that controls what enters and leaves. The cytoplasm is where many reactions happen. The nucleus holds the genetic material (DNA) and controls the cell's activities. Mitochondria are where aerobic respiration releases energy from glucose.",
      "A plant cell has the same four parts and three more that matter here: a cellulose cell wall outside the membrane, chloroplasts, and a large permanent vacuole. The wall is strong and gives the cell its shape; it is freely permeable to water and small dissolved substances, but it is not the selective barrier — the membrane underneath is. Chloroplasts contain chlorophyll and carry out photosynthesis. The vacuole is filled with cell sap and helps keep the cell firm.",
      "Specialised cells show the same rule at a larger scale: structure serves function. A red blood cell has no nucleus and is packed with haemoglobin, leaving more room to carry oxygen. A root hair cell has a long, thin extension that increases the surface area for absorbing water and minerals. A sperm cell has many mitochondria to power its journey. A nerve cell is long so it can carry an electrical impulse from one part of the body to another.",
      "Cells are not all the same size, and the units matter. Most plant and animal cells are measured in micrometres (μm): one micrometre is one-thousandth of a millimetre, or 10⁻⁶ m. A typical cheek cell is about 50–100 μm across. Magnification tells you how many times larger the image is than the object; it does not, by itself, tell you how much detail you can resolve.",
      "Similar cells group into tissues, tissues into organs, and organs into organ systems. This hierarchy is why a single cell does not need to do everything in a large organism: specialised cells do one job well, and the system coordinates them. It also explains why a large organism cannot simply be one giant cell — the surface area available for exchange grows more slowly than the volume that needs supplying.",
    ],
    terms: [
      { term: "cell membrane", meaning: "The thin, flexible boundary that controls which substances enter and leave the cell." },
      { term: "nucleus", meaning: "The organelle that contains DNA and controls the cell's activities." },
      { term: "chloroplast", meaning: "A plant-cell organelle containing chlorophyll, where photosynthesis takes place." },
      { term: "vacuole", meaning: "A fluid-filled space; the large permanent vacuole in a plant cell helps keep the cell firm." },
      { term: "mitochondrion", meaning: "The organelle where aerobic respiration releases energy from glucose." },
    ],
    workedExamples: [
      {
        prompt:
          "A root hair cell has a long, narrow extension into the soil. Explain one way this shape helps the cell do its job.",
        steps: [
          "Identify the job: the root hair cell absorbs water and dissolved mineral ions from the soil.",
          "Connect shape to job: absorption happens across the cell membrane, so a larger membrane surface allows more water and ions to enter in a given time.",
          "Name the principle: the long extension increases the surface area to volume ratio; it does not increase the volume of soil the root reaches by magic.",
        ],
        answer:
          "The extension increases the surface area of membrane available for absorbing water and minerals, so the cell can take them in faster.",
      },
      {
        prompt:
          "A palisade cell from a leaf and a human cheek cell are compared. Which organelles would you expect in the palisade cell but not in the cheek cell, and why?",
        steps: [
          "Recall the plant-cell additions: a cellulose cell wall, chloroplasts and a large permanent vacuole.",
          "Check the job: palisade cells are packed with chloroplasts because they are the main photosynthetic cells of the leaf.",
          "Do not overclaim: a cheek cell is an animal cell, so it has no chloroplasts and no cellulose wall; both cell types still have mitochondria and a nucleus.",
        ],
        answer:
          "Chloroplasts (and a cellulose cell wall and large permanent vacuole). The palisade cell photosynthesises, so it needs chlorophyll; the cheek cell does not.",
      },
    ],
    traps: [
      {
        move: "\"Plant cells have no mitochondria because they get energy from sunlight.\"",
        why:
          "Photosynthesis makes glucose; respiration releases energy from glucose, and plant cells carry out respiration day and night. Mitochondria are therefore present in plant cells too. Sunlight is the energy source for making the glucose, not a replacement for respiring it.",
      },
      {
        move: "\"The cell wall controls what enters the cell.\"",
        why:
          "The cellulose wall is strong and freely permeable to water and small dissolved substances: it gives shape and support, but it is not the cell's selective barrier. The cell membrane underneath is the selectively permeable boundary that controls what enters and leaves.",
      },
      {
        move: "\"A red blood cell has a nucleus like every other cell.\"",
        why:
          "A mature human red blood cell loses its nucleus during development. That leaves more space for haemoglobin, so each cell can carry more oxygen. The absence is a specialisation, not a mistake in the diagram.",
      },
    ],
    usedFor:
      "Photosynthesis, respiration, gas exchange and transport all depend on cell structure: chloroplasts, mitochondria, membranes and surface area are the same ideas used again in every later biology lesson.",
    recap: [
      "A cell is the smallest unit that carries out all the processes of life; its parts are organelles with specific jobs.",
      "Animal and plant cells share a membrane, cytoplasm, nucleus and mitochondria; plant cells also have a wall, chloroplasts and a large vacuole.",
      "Specialised cells have shapes that increase the surface area or machinery needed for their particular job.",
    ],
    review: "unreviewed",
    // THE PICTURE THE LESSON NEEDS. The numbered shapes are language-neutral;
    // the caption maps every number to its name, so a translated plan can
    // translate the teaching without the SVG growing an English label layer.
    figure: {
      spec: { kind: "cell", variant: "plant" },
      caption:
        "A plant cell, schematic and not to scale. 1 nucleus, holding the DNA; 2 cytoplasm, where many reactions happen; 3 large permanent vacuole, filled with cell sap; 4 chloroplast, containing chlorophyll; 5 mitochondrion, where aerobic respiration releases energy; 6 cellulose cell wall, outside the membrane. The wall gives shape and support; the membrane just inside it is the selectively permeable barrier that controls what enters and leaves.",
    },
  },
  // ── SCIENCE · PHOTOSYNTHESIS ──────────────────────────────────────────────
  // CBSE Class X, Life Processes (nutrition in plants). The lesson teaches the
  // equation, the leaf as the organ, and the limiting-factor graph — the three
  // things a learner is asked to use, not merely recall.
  photosynthesis: {
    conceptId: "photosynthesis",
    objective:
      "Write the balanced equation for photosynthesis, explain what limits its rate, and interpret a rate-versus-light graph.",
    intuition:
      "A leaf is a solar-powered factory with no chimney. It takes carbon dioxide in through tiny pores, draws water up from the roots, and uses light energy to build glucose — while releasing oxygen that every animal, including you, needs. The mass of a tree does not come mostly from the soil; it comes mostly from carbon dioxide in the air. That is the surprising idea this lesson makes visible.",
    idea: [
      "Photosynthesis is the process by which plants, algae and some bacteria use light energy to convert carbon dioxide and water into glucose and oxygen. The balanced symbol equation is 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Read it as six carbon dioxide molecules plus six water molecules, using light energy and chlorophyll, forming one glucose molecule and six oxygen molecules.",
      "The reaction happens in chloroplasts, which contain the green pigment chlorophyll. Chlorophyll absorbs mainly red and blue-violet light and reflects green, which is why leaves look green. Light energy is used to split water and drive the reactions that fix carbon dioxide into glucose; the oxygen released comes from water, not from carbon dioxide.",
      "A leaf is shaped for the job. It is broad and thin, so light reaches the palisade cells near the upper surface and gases do not have far to diffuse. The epidermis is transparent, and stomata — usually on the lower surface — let carbon dioxide in and oxygen out, while a network of veins brings water and carries away sucrose. The palisade cells are packed with chloroplasts; the spongy layer has air spaces that connect to the stomata.",
      "The rate of photosynthesis is not unlimited. Light intensity, carbon dioxide concentration and temperature are limiting factors: at any moment the factor in shortest supply sets the ceiling. Increase light and the rate rises, but only until another factor becomes limiting; the graph then flattens into a plateau. A plateau is not a failure of the plant — it is evidence that light is no longer the bottleneck.",
      "Temperature affects the enzymes that control the reactions. The rate rises with temperature up to an optimum and then falls sharply as the enzymes denature. That is a different shape from the light curve: a peak, not a plateau. A learner who can tell the two shapes apart can explain the biology rather than recite a list.",
      "The glucose made is not all used immediately. Some is respired to release energy, some is converted to starch for storage, some becomes cellulose for cell walls, and some is transported as sucrose to growing parts. The oxygen is released as a by-product. Photosynthesis and respiration both run in a plant; in daylight photosynthesis usually exceeds respiration, so there is a net release of oxygen, while at night only respiration continues and carbon dioxide is released.",
    ],
    terms: [
      { term: "chlorophyll", meaning: "The green pigment in chloroplasts that absorbs light energy for photosynthesis." },
      { term: "chloroplast", meaning: "The plant-cell organelle where photosynthesis takes place." },
      { term: "stomata", meaning: "Small pores in the leaf surface that let carbon dioxide in and oxygen and water vapour out." },
      { term: "limiting factor", meaning: "The factor in shortest supply that sets the maximum rate of a process at that moment." },
    ],
    workedExamples: [
      {
        prompt:
          "A plant is given brighter and brighter light, but its rate of photosynthesis stops increasing after a point. Explain what is happening.",
        steps: [
          "Start from the graph's shape: the rate rises with light at first, then levels off.",
          "Identify what a plateau means: light is no longer the factor in shortest supply, so adding more cannot help.",
          "Name a plausible limiting factor: carbon dioxide concentration or temperature. If the plant is warm and well lit but in still air, CO₂ is the usual candidate.",
          "State the conclusion carefully: the rate is now limited by another factor, not by the plant refusing to photosynthesise.",
        ],
        answer:
          "Light has stopped being the limiting factor. Another factor — most often carbon dioxide concentration or temperature — now sets the maximum rate, so the graph flattens.",
      },
      {
        prompt:
          "A leafy plant is kept in complete darkness for 24 hours. Explain why it still releases carbon dioxide.",
        steps: [
          "Separate the two processes: photosynthesis needs light; respiration does not.",
          "In darkness, photosynthesis stops, so no new glucose and no oxygen are produced.",
          "Respiration continues in every living cell, using glucose and oxygen and releasing carbon dioxide and water.",
        ],
        answer:
          "Respiration continues in the dark, releasing carbon dioxide, while photosynthesis has stopped because there is no light.",
      },
    ],
    traps: [
      {
        move: "\"Plants take their food from the soil.\"",
        why:
          "The soil supplies water and mineral ions, not the carbon and energy that make up most of the plant's dry mass. The carbon comes from carbon dioxide in the air and the energy from sunlight; the glucose is made in the leaves.",
      },
      {
        move: "\"More light always means a faster rate of photosynthesis.\"",
        why:
          "Only while light is the limiting factor. Once another factor — carbon dioxide or temperature — is in shortest supply, extra light cannot increase the rate, and the graph plateaus. The plateau is the evidence that the limiting factor has changed.",
      },
      {
        move: "\"Photosynthesis is the same thing as respiration, just in reverse.\"",
        why:
          "The equations look like reverses, but the processes are not interchangeable. Photosynthesis stores energy in glucose using light; respiration releases that energy in a controlled series of reactions. They happen in different organelles and are active at different times.",
      },
    ],
    usedFor:
      "Every food chain begins with photosynthesis, and the carbon and oxygen cycles are its large-scale consequences. Respiration, ecosystems and climate change all depend on the rate at which plants fix carbon.",
    recap: [
      "Photosynthesis uses light energy to turn carbon dioxide and water into glucose and oxygen: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.",
      "Chloroplasts contain chlorophyll; the leaf's broad, thin shape and stomata make gas exchange and light capture efficient.",
      "Light, carbon dioxide and temperature can each limit the rate; a plateau means the limiting factor has changed, not that the plant has stopped working.",
    ],
    review: "unreviewed",
    figure: {
      spec: {
        kind: "axes",
        xMin: 0,
        xMax: 10,
        yMin: 0,
        yMax: 8,
        points: [
          { at: [0, 0] },
          { at: [2, 3] },
          { at: [4, 5] },
          { at: [6, 6] },
          { at: [8, 6] },
          { at: [10, 6] },
        ],
      },
      caption:
        "Rate of photosynthesis against light intensity. The points rise while light is limiting, then flatten at a plateau: beyond that point another factor, such as carbon dioxide or temperature, is setting the ceiling.",
    },
  },
  // ── SCIENCE · CHEMICAL EQUATIONS ─────────────────────────────────────────
  // CBSE Class X, Chemical Reactions and Equations. Balancing is taught as
  // atom accounting, because that is the idea a learner can check — not as a
  // set of coefficients to memorise.
  "equations-stoich": {
    conceptId: "equations-stoich",
    objective:
      "Balance a chemical equation by counting atoms, add state symbols correctly, and explain why balancing does not change the substances.",
    intuition:
      "A chemical equation is a recipe written in symbols, and the recipe has a strict rule: atoms are not created or destroyed. You can rearrange the same atoms into new groups, but you cannot make a new atom appear. That is why the number of each kind of atom on the left must equal the number on the right — not approximately, exactly.",
    idea: [
      "A chemical reaction rearranges atoms. The starting substances are reactants, written on the left; the new substances are products, written on the right. A word equation names them, and a symbol equation replaces names with formulas: methane + oxygen → carbon dioxide + water becomes CH₄ + O₂ → CO₂ + H₂O.",
      "The law of conservation of mass says the total mass of reactants equals the total mass of products in a closed system, because atoms are only rearranged. Balancing an equation is how that law is written down. Count each element on both sides; if the counts differ, adjust the coefficient in front of a formula, never the subscript inside it.",
      "A coefficient multiplies the whole formula. 2H₂O means two water molecules, so it contains four hydrogen atoms and two oxygen atoms. Changing H₂O to H₂O₂ changes the substance itself — that is hydrogen peroxide, not water — so subscript editing is not a balancing move. This is the single most damaging shortcut in the topic, because the equation then balances a reaction that did not happen.",
      "Balance by inspection, one element at a time, leaving hydrogen and oxygen until late. For CH₄ + O₂ → CO₂ + H₂O: carbon is already one on each side; hydrogen needs two water molecules on the right, giving four hydrogen; that makes four oxygen on the right, so put a 2 in front of O₂ on the left. The balanced equation is CH₄ + 2O₂ → CO₂ + 2H₂O.",
      "State symbols record the physical form: (s) solid, (l) liquid, (g) gas, (aq) dissolved in water. They are not decoration. A reaction between aqueous solutions and one that produces a gas look different in the laboratory, and the symbol is how the equation says so. Ionic equations go further and remove spectator ions, leaving only the species that actually change.",
      "Recognise the common reaction types so a name can be attached to the equation: combination (two or more reactants form one product), decomposition (one reactant breaks into two or more), displacement (a more reactive element takes the place of a less reactive one), double displacement (ions swap partners, often making a precipitate), and redox (oxidation and reduction happen together). Exothermic reactions release energy and endothermic reactions absorb it; that is a separate fact from whether the equation balances.",
    ],
    terms: [
      { term: "reactant", meaning: "A starting substance in a chemical reaction, written on the left of the arrow." },
      { term: "product", meaning: "A new substance formed in a chemical reaction, written on the right of the arrow." },
      { term: "coefficient", meaning: "The number in front of a formula; it multiplies the whole formula and is the only thing changed when balancing." },
      { term: "state symbol", meaning: "(s), (l), (g) or (aq), recording the physical state of a substance in the equation." },
    ],
    workedExamples: [
      {
        prompt: "Balance: Fe + O₂ → Fe₂O₃.",
        steps: [
          "Count oxygen: two on the left, three on the right. The lowest common multiple is six, so use 3O₂ and 2Fe₂O₃.",
          "That gives six oxygen on each side and four iron on the right.",
          "Balance iron: put a 4 in front of Fe on the left.",
          "Check every element: 4 Fe and 6 O on both sides.",
        ],
        answer: "4Fe + 3O₂ → 2Fe₂O₃.",
      },
      {
        prompt: "Balance: Al + HCl → AlCl₃ + H₂.",
        steps: [
          "Chlorine appears as HCl on the left and AlCl₃ on the right; the lowest common multiple of 1 and 3 is 3, so use 3HCl and 1AlCl₃.",
          "That gives three chlorine on each side and one aluminium on the right, so put a 2 in front of Al on the left? No — check hydrogen first: 3HCl gives three hydrogen, and H₂ needs two.",
          "Use 6HCl instead: six chlorine and six hydrogen on the left. Then 2AlCl₃ gives six chlorine, and 3H₂ gives six hydrogen.",
          "Balance aluminium: 2Al on the left. Check: 2 Al, 6 H, 6 Cl on both sides.",
        ],
        answer: "2Al + 6HCl → 2AlCl₃ + 3H₂.",
      },
    ],
    traps: [
      {
        move: "Changing H₂O to H₂O₂ to make the oxygen count match.",
        why:
          "The subscript is part of the substance's identity: H₂O is water and H₂O₂ is hydrogen peroxide. Changing it balances a reaction that did not happen. Only coefficients may change.",
      },
      {
        move: "Counting molecules instead of atoms.",
        why:
          "One O₂ molecule contains two oxygen atoms, and one H₂O molecule contains one. A count of 'two molecules on the left' says nothing about the number of atoms; the conservation law is about atoms.",
      },
      {
        move: "Writing 2H₂ + O₂ → 2H₂O and then saying the mass has doubled.",
        why:
          "The coefficients describe the ratio in which the substances react; they do not create extra mass. Four hydrogen atoms and two oxygen atoms are rearranged into two water molecules, and the total mass is unchanged.",
      },
    ],
    usedFor:
      "Every later chemistry calculation — moles, concentrations, limiting reagents, electrolysis and energy changes — starts from a balanced equation, because the coefficients are the ratio in which particles react.",
    recap: [
      "A balanced equation has the same number of each kind of atom on both sides; only coefficients may be changed.",
      "State symbols record solid, liquid, gas or aqueous form and are part of the chemistry, not decoration.",
      "Reaction types describe how atoms are rearranged; exothermic and endothermic describe the energy change, which is a separate question.",
    ],
    review: "unreviewed",
    // THE PICTURE THE LESSON NEEDS. Coefficients are the thing learners read as
    // atom counts, so the molecules are drawn: four H and two O before the
    // arrow, four H and two O after it. The layout computes those counts, so
    // the drawing and the conservation claim cannot drift apart.
    figure: {
      spec: {
        kind: "particles",
        left: [
          { atoms: ["H", "H"], count: 2 },
          { atoms: ["O", "O"], count: 1 },
        ],
        right: [{ atoms: ["O", "H", "H"], count: 2 }],
      },
      caption:
        "2H₂ + O₂ → 2H₂O as particles. Left: two hydrogen molecules (four H atoms) and one oxygen molecule (two O atoms). Right: two water molecules, each with one O and two H — four H and two O again. The atoms are rearranged, not created; the coefficient 2 doubles the MOLECULE count, and that is why the atom count is unchanged.",
    },
  },
  // ── SCIENCE · ELECTRIC CIRCUITS ──────────────────────────────────────────
  // CBSE Class X, Electricity. The lesson keeps the water analogy only as an
  // opening picture, then replaces it with the quantities and the rules a
  // learner must actually calculate with.
  "electricity-circuits": {
    conceptId: "electricity-circuits",
    objective:
      "Use V = IR to calculate current, voltage or resistance, and apply the series and parallel rules to a simple circuit.",
    intuition:
      "A circuit is a closed path with a pump, a flow and a narrow place. The battery is the pump that gives charge energy; current is the rate at which charge flows; resistance is the narrowness that turns some of that energy into heat. The analogy is useful only up to a point — charge is not water, and it is not used up as it goes round — so the lesson replaces the picture with the quantities as soon as they are defined.",
    idea: [
      "Electric current is the rate of flow of electric charge: I = Q/t, measured in amperes (A), where one ampere is one coulomb per second. Conventional current is drawn from the positive terminal to the negative terminal, even though electrons move the other way. An ammeter measures current and is connected in series, because the same current must pass through it and the component.",
      "Potential difference, or voltage, is the energy transferred per unit charge between two points: V = W/Q, measured in volts (V). One volt is one joule per coulomb. A voltmeter measures the difference across a component and is connected in parallel with it, because it must compare the two sides without interrupting the current.",
      "Ohm's law says that, at constant temperature, the current through a metallic conductor is directly proportional to the potential difference across it: V = IR. Resistance R is measured in ohms (Ω) and depends on the material, length, cross-sectional area and temperature. A longer wire has more resistance; a thicker wire has less; a hotter metal usually has more.",
      "In a series circuit there is one path, so the current is the same through every component. The potential differences add to the supply voltage, and the total resistance is the sum: R = R₁ + R₂ + … . Adding a resistor in series always increases the total resistance and reduces the current.",
      "In a parallel circuit the components are connected across the same two points, so the potential difference is the same across each branch. The currents add to the total, and the total resistance is found from 1/R = 1/R₁ + 1/R₂ + … . The total resistance is less than the smallest branch resistance, because the extra branch gives charge another path.",
      "Electrical power is the rate of energy transfer: P = VI = I²R = V²/R. A resistor converts electrical energy to heat, which is the heating effect used in a filament lamp, a kettle and a fuse. The same power can be delivered at a lower current by using a higher voltage, which is why electricity is transmitted at high voltage and low current: less energy is lost as heat in the cables.",
    ],
    terms: [
      { term: "current", meaning: "The rate of flow of electric charge, measured in amperes; I = Q/t." },
      { term: "potential difference", meaning: "The energy transferred per unit charge between two points, measured in volts." },
      { term: "resistance", meaning: "The opposition to current in a component, measured in ohms; V = IR at constant temperature." },
      { term: "series", meaning: "A circuit with one path, so the same current flows through every component." },
      { term: "parallel", meaning: "A circuit with branches across the same two points, so the voltage is the same across each branch." },
    ],
    workedExamples: [
      {
        prompt: "A 12 V battery is connected across a 4 Ω resistor. Calculate the current and the power dissipated.",
        steps: [
          "Write the rule: V = IR, so I = V/R.",
          "Substitute: I = 12 V ÷ 4 Ω = 3 A.",
          "Use P = VI: P = 12 V × 3 A = 36 W. Check with P = I²R = 9 × 4 = 36 W.",
        ],
        answer: "Current = 3 A; power = 36 W.",
      },
      {
        prompt:
          "Two 6 Ω resistors are connected first in series and then in parallel across a 12 V supply. Find the total resistance and the total current in each case.",
        steps: [
          "Series: R = 6 + 6 = 12 Ω. Current I = V/R = 12/12 = 1 A.",
          "Parallel: 1/R = 1/6 + 1/6 = 2/6, so R = 3 Ω. Current I = 12/3 = 4 A.",
          "Check the direction: the parallel combination has less resistance, so it draws more current from the same supply.",
        ],
        answer: "Series: 12 Ω, 1 A. Parallel: 3 Ω, 4 A.",
      },
    ],
    traps: [
      {
        move: "\"The current is used up as it goes round the circuit.\"",
        why:
          "Charge is conserved: the same current enters and leaves a component in series. What is transferred is energy, not charge. A bulb does not consume current; it transfers electrical energy to light and heat, and the current continues.",
      },
      {
        move: "\"Two resistors in parallel have a total resistance of R₁ + R₂.\"",
        why:
          "The series rule adds resistances because the same current passes through both. In parallel, each branch has the same voltage and the currents add, so the total resistance is smaller than either branch — for two 6 Ω resistors it is 3 Ω, not 12 Ω. Adding a branch makes it easier for charge to flow.",
      },
      {
        move: "\"A voltmeter goes in series with the component.\"",
        why:
          "A voltmeter has a very high resistance and is connected in parallel, so it measures the potential difference across the component without diverting much current. An ammeter has a very low resistance and goes in series. Swapping them gives a reading that is not the quantity asked for.",
      },
    ],
    usedFor:
      "Household wiring, fuses, the heating effect, electrical power bills and the transmission of electricity all use these rules; later electromagnetism and electronics depend on them.",
    recap: [
      "Current is charge flow per second, voltage is energy per unit charge, and resistance is the opposition that links them: V = IR.",
      "Series: same current, voltages add, resistances add. Parallel: same voltage, currents add, total resistance is less than the smallest branch.",
      "Power is P = VI; a higher voltage can deliver the same power at a lower current, which reduces heating losses in transmission.",
    ],
    review: "unreviewed",
    figure: {
      spec: {
        kind: "axes",
        xMin: 0,
        xMax: 5,
        yMin: 0,
        yMax: 12,
        // The caption says the line passes through the origin and is straight;
        // without this the renderer drew only the dashed rise/run triangle.
        lines: [{ from: [0, 0], to: [4, 8] }],
        gradient: { from: [0, 0], to: [4, 8] },
      },
      caption:
        "A current–voltage graph for a fixed resistor: the line passes through the origin and is straight, so V is proportional to I. The gradient of this line is the resistance (8 V ÷ 4 A = 2 Ω).",
    },
  },
};

// ── CHEMISTRY · THE QUANTITATIVE CORE ───────────────────────────────────────
//
// These two lessons are AUTHORED but deliberately not added to the pilot
// sequence: the pilot is a CBSE Class X pathway, and adding concepts to it
// would change a scope a teacher is being asked to review. They are still
// authored teaching, so they go into LESSON_PLANS ahead of the generated
// fallback. `provenance: "authored"` is the honest label: written here, not
// reviewed, and not claimed as part of the pilot.
//
// Moles and energy changes are the two topics the comparison found every
// serious chemistry product teaches as a CALCULATION WITH A METHOD. A paragraph
// that states n = m/Mr is not a lesson; a learner needs the quantity triangle,
// a worked substitution, the unit check and the traps that produce the wrong
// answer. The `sections` field is what lets those sit beside the prose instead
// of being flattened into it.
const MOLES_SECTIONS: readonly LessonSection[] = [
  {
    heading: "A mole is a count, not a mass",
    body: [
      "A mole is a fixed number of particles: 6.02 × 10²³ of them. That number is Avogadro's constant, and it is chosen so that one mole of a substance has a mass in grams equal to its relative formula mass. The mole is the bridge between a count too large to see and a mass you can weigh.",
      "The size is not arbitrary. Atoms are so small that a visible sample contains an enormous number of them; counting in moles keeps the numbers human-sized. One mole of carbon-12 has a mass of exactly 12 g, one mole of water has a mass of about 18 g, and both contain the same number of formula units.",
    ],
    formula: "n = N / N_A",
    table: {
      columns: ["Symbol", "Meaning", "Unit"],
      rows: [
        ["n", "amount of substance", "mol"],
        ["N", "number of particles", "count"],
        ["N_A", "Avogadro's constant", "6.02 × 10²³ mol⁻¹"],
      ],
      caption: "The unit of n is mol; N is a pure count, so N/N_A is mol.",
    },
  },
  {
    heading: "Mass to moles: the formula you rearrange",
    body: [
      "The relative formula mass, Mᵣ, is the mass of one mole in grams. For water, add the relative atomic masses: 2(1) + 16 = 18, so Mᵣ = 18 g/mol. For sodium hydroxide: 23 + 16 + 1 = 40 g/mol. The subscript belongs to the atom before it, so H₂O has two hydrogens, not one.",
      "Divide a mass by Mᵣ to get moles; multiply moles by Mᵣ to get mass. Rearranging is not a second formula to memorise — it is the same relationship read in the direction the question needs.",
    ],
    formula: "n = m / M_r        m = n × M_r",
    steps: [
      "Write the formula and the value of Mᵣ with its unit.",
      "Substitute the mass in grams and divide.",
      "Check the unit: g ÷ (g/mol) leaves mol.",
    ],
  },
  {
    heading: "Concentration: moles per cubic decimetre",
    body: [
      "Concentration is the amount of solute in a given volume of solution. It is measured in mol/dm³ (the same as mol L⁻¹). A 0.100 mol/dm³ solution contains 0.100 mol of solute in every cubic decimetre of solution.",
      "The volume must be in dm³ before you substitute. 1 dm³ is 1000 cm³, so 25.0 cm³ is 0.0250 dm³, not 25. Dividing by the volume in cm³ gives an answer a thousand times too large — the most common unit error in the topic.",
    ],
    formula: "c = n / V        n = c × V",
    table: {
      columns: ["You are given", "Use", "Result"],
      rows: [
        ["mass (g)", "n = m ÷ Mᵣ", "moles"],
        ["moles", "m = n × Mᵣ", "mass (g)"],
        ["concentration and volume", "n = c × V", "moles"],
        ["moles and volume", "c = n ÷ V", "concentration (mol/dm³)"],
      ],
      caption: "Convert to moles before using an equation's ratio; the ratio is a ratio of amounts, not of masses or volumes.",
    },
  },
  {
    heading: "The balanced equation supplies the ratio",
    body: [
      "The coefficients in a balanced equation are the ratio in which particles react. In 2H₂ + O₂ → 2H₂O, two moles of hydrogen react with one mole of oxygen to make two moles of water. The coefficient 2 in front of H₂ doubles the number of hydrogen MOLECULES; it does not mean 2 g.",
      "Read the ratio in the direction you need. If you know the moles of water produced, the equation says the hydrogen used was the same number of moles and the oxygen used was half as many. If you know a mass, convert it to moles first, apply the ratio, then convert the answer to the requested unit.",
    ],
    formula: "2H₂ + O₂ → 2H₂O     ratio 2 : 1 : 2",
  },
  {
    heading: "Limiting reagent: the reactant that runs out first",
    body: [
      "When the reactants are not in the exact ratio, one of them is used up first. That reactant limits the amount of product; the other is in excess and some of it will remain. The limiting reactant is not necessarily the one with the smaller mass — it is the one whose amount divided by its coefficient is smallest.",
      "For 2H₂ + O₂ → 2H₂O with 4 mol H₂ and 1 mol O₂: hydrogen needs 2 mol O₂ to react completely, but only 1 mol is present. Oxygen runs out first, so oxygen is limiting and 2 mol of water forms. The 2 mol of hydrogen left over is the excess.",
    ],
  },
  {
    heading: "The four-line method that works every time",
    body: [
      "Most mole questions are the same four moves with different numbers. Keeping the moves in order prevents the common mistake of multiplying a mass by a coefficient, which mixes a mass ratio with a particle ratio.",
    ],
    steps: [
      "Write and balance the equation; write the mole ratio under it.",
      "Convert everything you are given into moles (mass ÷ Mᵣ, or concentration × volume in dm³).",
      "Multiply by the mole ratio, using the coefficients from the equation.",
      "Convert the moles back to the unit asked for (mass, volume of gas, or concentration).",
    ],
  },
];

const ENERGY_SECTIONS: readonly LessonSection[] = [
  {
    heading: "Enthalpy is the energy ledger",
    body: [
      "Every reaction exchanges energy with its surroundings. Enthalpy, H, is the energy stored in the chemical system at constant pressure. We cannot measure the absolute value, so we measure the change: ΔH = H(products) − H(reactants).",
      "If the products have less enthalpy than the reactants, the difference has been transferred to the surroundings, usually as heat. That reaction is exothermic and ΔH is negative. If the products have more enthalpy, energy has been absorbed from the surroundings; the reaction is endothermic and ΔH is positive. The sign is a direction, not a size.",
    ],
    formula: "ΔH = H(products) − H(reactants)",
    table: {
      columns: ["Reaction", "ΔH", "Surroundings"],
      rows: [
        ["exothermic", "negative", "temperature rises"],
        ["endothermic", "positive", "temperature falls"],
      ],
      caption: "A sign tells you the direction of energy transfer; the magnitude tells you how much per mole.",
    },
  },
  {
    heading: "Breaking costs, making pays",
    body: [
      "A chemical reaction breaks the bonds in the reactants and makes new bonds in the products. Breaking a bond always requires energy; making a bond always releases energy. The overall energy change is the difference between the two ledgers.",
      "Use average bond enthalpies when the question supplies them. They are averages over similar compounds and are defined for gaseous species, so a calculation using them is an estimate. A negative ΔH means the energy released in making bonds is greater than the energy absorbed in breaking bonds: the reaction is exothermic.",
    ],
    formula: "ΔH = Σ(bonds broken) − Σ(bonds formed)",
  },
  {
    heading: "A bond-energy calculation",
    body: [
      "Hydrogen and chlorine react: H₂ + Cl₂ → 2HCl. Count the bonds, not the molecules. One H–H bond and one Cl–Cl bond are broken; two H–Cl bonds are made, because the equation produces two HCl molecules.",
      "Use the table's values, then subtract the energy released from the energy absorbed. The result is negative, so the reaction is exothermic. Writing the calculation in two lines — energy in, energy out — is safer than trying to hold both sums in your head.",
    ],
    table: {
      columns: ["Bond", "Bond energy / kJ mol⁻¹"],
      rows: [
        ["H–H", "436"],
        ["Cl–Cl", "243"],
        ["H–Cl", "432"],
      ],
      caption: "Average bond enthalpies. The values apply to gaseous bonds; they are not the same as the enthalpy of formation of the compound.",
    },
    formula: "energy in = 436 + 243 = 679 kJ/mol; energy out = 2 × 432 = 864 kJ/mol; ΔH = 679 − 864 = −185 kJ/mol",
  },
  {
    heading: "Reading a reaction profile",
    body: [
      "A reaction profile plots energy against reaction progress. The reactants sit on the left and the products on the right. The peak between them is the transition state, and the height from the reactants to that peak is the activation energy, Eₐ — the barrier a collision must clear before the reaction can happen.",
      "The height from the reactants to the products is ΔH. On an exothermic profile the product level is lower; on an endothermic profile it is higher. A catalyst lowers the peak, so Eₐ falls, but it does not move the reactant or product levels — the overall ΔH is unchanged.",
    ],
  },
  {
    heading: "Calorimetry: measuring the heat",
    body: [
      "A calorimetry experiment measures the temperature change of a known mass of water or solution. The heat gained or lost is q = m c ΔT, where m is the mass of the liquid being heated, c is its specific heat capacity, and ΔT is the temperature change. For water, c is about 4.18 J g⁻¹ °C⁻¹.",
      "That q is the heat for the amount you actually used, not per mole. Divide by the number of moles of the limiting reactant to get ΔH per mole. If the temperature rises, the reaction released heat to the water, so the reaction's ΔH is negative; the negative sign is the direction, not a mistake in the arithmetic.",
    ],
    formula: "q = m c ΔT        ΔH = −q / n",
    steps: [
      "Find ΔT = final temperature − initial temperature.",
      "Calculate q in joules with the mass of the solution in grams.",
      "Convert q to kJ by dividing by 1000.",
      "Divide by the moles that reacted and attach the sign.",
    ],
  },
  {
    heading: "Signs and units: the check before you move on",
    body: [
      "A number without a sign is not an enthalpy change, and a value per mole without per mole in the unit is incomplete. Check three things before writing the answer: the sign agrees with the temperature change, the unit is kJ/mol, and the magnitude is plausible for the bonds involved.",
      "Bond energies are quoted per mole of bonds. If the equation makes two H–Cl bonds, multiply by two. If it makes one, do not. The coefficient in the equation is the multiplier; the subscript inside a formula is already part of that formula's identity.",
    ],
  },
];

const CHEMISTRY_AUTHORED_PLANS: Readonly<Record<string, LessonPlan>> = {
  "moles-calcs": {
    conceptId: "moles-calcs",
    objective:
      "Convert between mass, moles and concentration, use a balanced equation's mole ratio, and identify the limiting reagent in a reaction.",
    intuition:
      "A recipe for one cake uses two eggs for every 200 g of flour. If you have 400 g of flour but only two eggs, the eggs limit how many cakes you can make — the flour is in excess. Chemistry has the same arithmetic: a balanced equation gives the ratio, and the reactant that runs out first decides how much product forms. The mole is the unit that makes the recipe countable.",
    idea: MOLES_SECTIONS.flatMap((section) => section.body),
    sections: MOLES_SECTIONS,
    terms: [
      { term: "mole", meaning: "The amount of substance containing 6.02 × 10²³ particles; its mass in grams equals the relative formula mass." },
      { term: "relative formula mass (Mᵣ)", meaning: "The sum of the relative atomic masses in a formula, in g/mol." },
      { term: "concentration", meaning: "The amount of solute per cubic decimetre of solution, in mol/dm³." },
      { term: "limiting reagent", meaning: "The reactant that is used up first and therefore limits the amount of product formed." },
      { term: "mole ratio", meaning: "The ratio of coefficients in a balanced equation, which tells you how many moles of each substance react or form." },
    ],
    workedExamples: [
      {
        prompt: "Calculate the amount, in moles, in 8.0 g of sodium hydroxide, NaOH. (Mᵣ = 40)",
        steps: [
          "Write the formula: n = m ÷ Mᵣ.",
          "Substitute: n = 8.0 g ÷ 40 g/mol.",
          "Check the unit: g ÷ g/mol = mol.",
        ],
        answer: "0.20 mol",
      },
      {
        prompt:
          "25.0 cm³ of 0.100 mol/dm³ sodium hydroxide is neutralised by hydrochloric acid of concentration 0.0500 mol/dm³. The reaction is 1:1. Calculate the volume of acid needed.",
        steps: [
          "Convert the volume to dm³: 25.0 cm³ ÷ 1000 = 0.0250 dm³.",
          "Find the moles of NaOH: n = c × V = 0.100 × 0.0250 = 0.00250 mol.",
          "The ratio is 1:1, so the acid also needs 0.00250 mol.",
          "Rearrange c = n ÷ V: V = n ÷ c = 0.00250 ÷ 0.0500 = 0.0500 dm³ = 50.0 cm³.",
        ],
        answer: "50.0 cm³ of hydrochloric acid",
      },
      {
        prompt:
          "10.0 g of calcium carbonate, CaCO₃, decomposes completely: CaCO₃ → CaO + CO₂. Calculate the mass of calcium oxide formed. (Mᵣ: CaCO₃ = 100, CaO = 56)",
        steps: [
          "Convert the reactant to moles: n = 10.0 ÷ 100 = 0.100 mol.",
          "The ratio CaCO₃ : CaO is 1:1, so 0.100 mol of CaO forms.",
          "Convert back to mass: m = n × Mᵣ = 0.100 × 56 = 5.60 g.",
        ],
        answer: "5.60 g of calcium oxide",
      },
    ],
    traps: [
      {
        move: "Multiplies the mass by Mᵣ to find the number of moles.",
        why:
          "The unit check exposes it: g × g/mol gives g²/mol, which is not a count. Dividing mass by Mᵣ makes the number smaller, as it should — a mole is a very large count, so a small mass contains a fraction of a mole (unless the substance is very light).",
      },
      {
        move: "Uses the coefficients in the equation as a ratio of masses.",
        why:
          "The coefficients count particles, or moles of particles, not grams. Convert the given mass to moles first, apply the coefficient ratio, then convert the product's moles back to grams using its own Mᵣ. A coefficient of 2 means twice as many particles, not twice as many grams.",
      },
      {
        move: "Puts 25 cm³ straight into c = n ÷ V and gets a concentration a thousand times too large.",
        why:
          "Concentration is per cubic decimetre. Convert cm³ to dm³ by dividing by 1000 before substituting: 25 cm³ = 0.025 dm³. The same numerical mistake appears when a volume of gas is given in cm³ but the molar volume is in dm³.",
      },
    ],
    usedFor:
      "Titration, percentage yield, atom economy, gas volumes, electrolysis and every energy-per-mole calculation use the mole as their common currency. A balanced equation is the ratio; the mole is how you count with it.",
    recap: [
      "A mole is 6.02 × 10²³ particles; n = m ÷ Mᵣ converts mass to moles, and m = n × Mᵣ converts back.",
      "Concentration is c = n ÷ V, with V in dm³; 1 dm³ = 1000 cm³.",
      "The balanced equation gives the mole ratio; the limiting reagent is the reactant whose amount divided by its coefficient is smallest.",
    ],
    review: "unreviewed",
    provenance: "authored",
  },
  "energy-changes": {
    conceptId: "energy-changes",
    objective:
      "Classify a reaction as exothermic or endothermic, calculate ΔH from bond energies or calorimetry, and read a reaction profile without confusing Eₐ with ΔH.",
    intuition:
      "A hand warmer gets hot when you open it; a cold pack gets cold. Both are chemical reactions exchanging energy with their surroundings. The hand warmer's products have less enthalpy than its reactants, so the difference leaves as heat. The cold pack absorbs energy, so its products have more enthalpy. The sign of ΔH is simply which way the energy went.",
    idea: ENERGY_SECTIONS.flatMap((section) => section.body),
    sections: ENERGY_SECTIONS,
    terms: [
      { term: "enthalpy change (ΔH)", meaning: "The heat energy exchanged with the surroundings at constant pressure; negative for exothermic, positive for endothermic." },
      { term: "activation energy (Eₐ)", meaning: "The minimum energy colliding particles need to react; the height of the barrier on a reaction profile." },
      { term: "bond enthalpy", meaning: "The average energy needed to break one mole of a particular covalent bond in the gaseous state." },
      { term: "calorimetry", meaning: "An experiment that measures heat exchange from a temperature change, usually using q = m c ΔT." },
      { term: "specific heat capacity", meaning: "The energy needed to raise the temperature of 1 g of a substance by 1 °C; for water it is about 4.18 J g⁻¹ °C⁻¹." },
    ],
    workedExamples: [
      {
        prompt:
          "Calculate ΔH for H₂ + Cl₂ → 2HCl using these average bond enthalpies: H–H 436, Cl–Cl 243, H–Cl 432 kJ/mol.",
        steps: [
          "Energy absorbed breaking bonds: 436 + 243 = 679 kJ/mol.",
          "Energy released making bonds: two H–Cl bonds, so 2 × 432 = 864 kJ/mol.",
          "ΔH = energy in − energy out = 679 − 864 = −185 kJ/mol.",
          "The negative sign means more energy is released than absorbed, so the reaction is exothermic.",
        ],
        answer: "ΔH = −185 kJ/mol (exothermic)",
      },
      {
        prompt:
          "A reaction raises the temperature of 100 g of water by 6.8 °C. The amount reacting is 0.0500 mol. Calculate ΔH per mole. (c = 4.18 J g⁻¹ °C⁻¹)",
        steps: [
          "Calculate the heat gained by the water: q = m c ΔT = 100 × 4.18 × 6.8 = 2842.4 J.",
          "Convert to kJ: 2842.4 J ÷ 1000 = 2.842 kJ.",
          "Divide by the amount reacting: 2.842 ÷ 0.0500 = 56.8 kJ/mol.",
          "The water warmed, so the reaction released heat: the sign is negative.",
        ],
        answer: "ΔH = −56.8 kJ/mol",
      },
    ],
    traps: [
      {
        move: "Says breaking bonds releases energy because the reaction gives out heat overall.",
        why:
          "Breaking a bond always requires energy; forming a bond always releases it. A reaction is exothermic when the energy released by forming the products' bonds is GREATER than the energy absorbed by breaking the reactants' bonds. The overall sign comes from the difference, not from the direction of either half.",
      },
      {
        move: "Gives an exothermic reaction a positive ΔH because the temperature rose.",
        why:
          "The sign describes the reaction, not the thermometer. In an exothermic reaction the system loses enthalpy to the surroundings, so ΔH is negative while the surroundings' temperature rises. An endothermic reaction has a positive ΔH and the surroundings cool.",
      },
      {
        move: "Calculates q = m c ΔT and reports q as the enthalpy change per mole.",
        why:
          "q is the heat exchanged for the amount actually used, in joules. Enthalpy per mole needs q divided by the number of moles, converted to kJ/mol, with the sign chosen from the temperature change. Reporting q alone gives a total energy, not a molar quantity.",
      },
    ],
    usedFor:
      "Fuels, hand warmers and cold packs, bond-energy calculations, calorimetry practicals and the energy balance of industrial reactions all use ΔH. The same sign convention returns in equilibrium, where heating shifts the position of a reversible reaction.",
    recap: [
      "ΔH is products' enthalpy minus reactants' enthalpy; negative is exothermic, positive is endothermic.",
      "Breaking bonds costs energy; making bonds releases it; ΔH = bonds broken − bonds formed.",
      "On a profile, Eₐ is the barrier from reactants to the peak, while ΔH is the difference between reactant and product levels.",
    ],
    review: "unreviewed",
    provenance: "authored",
    figure: {
      spec: { kind: "energy-profile", reaction: "H₂ + Cl₂ → 2HCl", activation: 150, delta: -185 },
      caption:
        "Reaction profile for H₂ + Cl₂ → 2HCl, schematic and not to scale. The vertical axis is energy; R marks the reactants and P the products. The peak is the transition state, and Eₐ is the activation energy — the barrier a collision must clear. P is below R, so the products have less enthalpy: ΔH is negative and the reaction is exothermic. The barrier is drawn to show the idea, not as a measured value.",
    },
  },
};

/** Every concept in the genome now has a plan: the pilot-authored lessons above,
 *  the two authored chemistry lessons, plus a supplemental plan built from the
 *  concept's own teaching note and a concept-specific lens. Supplemental plans
 *  are marked unreviewed, so the pilot's review gate still means only the
 *  candidates in the named packs.
 *
 *  The full registry is what `planFor` answers from. `pilotPlanIds()` is the
 *  smaller set the review packs and the browser lesson walk measure. */
// AUTHORED WINS, AND THE ORDER IS THE WHOLE RULE. The supplemental module
// builds a plan for every concept that has a lens, and it is spread LAST in the
// first version of this merge — so an authored plan whose concept also has a
// lens was silently replaced by the generated one. Nothing threw: `planFor`
// answered, the page rendered, the coverage counts looked right, and two new
// lessons would have shipped as supplemental prose while their authors believed
// they were live. Found by reading the registry (`place-value` reported
// `provenance: "supplemental"`) rather than by trusting the file diff. The
// generated plan is the FALLBACK; it is never allowed to shadow taught content.
export const LESSON_PLANS: Readonly<Record<string, LessonPlan>> = {
  ...SUPPLEMENTAL_LESSON_PLANS,
  ...CHEMISTRY_AUTHORED_PLANS,
  ...PILOT_LESSON_PLANS,
};

/** The plans that belong to the review packs, not the supplemental coverage. */
export function pilotPlanIds(): string[] {
  return Object.keys(PILOT_LESSON_PLANS);
}

/** The plan for a concept, or null when nobody has written one. Null is a real
 *  answer, not an error: the page falls back to the genome's prose, so a concept
 *  without a plan renders what it always did rather than an empty shell.
 *
 *  WITH A LANGUAGE, THE LESSON COMES IN THAT LANGUAGE when a COMPLETE
 *  translation exists (lib/lesson-plans-intl.ts). English is answered without
 *  consulting the record at all, and an absent or PARTIAL translation answers
 *  the authored English — never a half-French lesson, which reads as the
 *  product switching language mid-paragraph. The second argument is optional on
 *  purpose: every existing caller and every assertion that reads a plan is
 *  still asking "is there a lesson here", and that question has nothing to do
 *  with the reader's language. */
export function planFor(conceptId: string, lang?: string): LessonPlan | null {
  const base = LESSON_PLANS[conceptId];
  if (!base) return null;
  if (!lang || lang === "en") return base;
  return translatedPlanFor(conceptId, lang, base) ?? base;
}

/** THE SECTIONS EVERY LESSON RENDERS.
 *
 *  Authored plans carry their own sequence (the chemistry lessons have formulas
 *  and tables; the pilot plans teach a deliberate path). For the plans that do
 *  not, the four authored idea paragraphs are still a sequence, and putting them
 *  in one undifferentiated card is the wall this format exists to break. This
 *  groups them into two or three readable sections with honest structural
 *  headings. It does not invent teaching: every body string is already in the
 *  plan, and an authored `sections` field always wins. */
export function sectionsFor(plan: LessonPlan): readonly LessonSection[] {
  if (plan.sections?.length) return plan.sections;
  const ideas = plan.idea.filter((para) => para.trim().length > 0);
  if (!ideas.length) return [];
  const groups: string[][] = [];
  for (let i = 0; i < ideas.length; i += 2) groups.push(ideas.slice(i, i + 2));
  const headings = ["The core idea", "Building the idea", "Putting it together", "Extending the idea"];
  return groups.map((body, i) => ({
    heading: headings[Math.min(i, headings.length - 1)],
    body,
  }));
}

/** WHICH ROUTE THROUGH THE IDEA THIS LEARNER READS, and its paragraphs.
 *
 *  Thresholds, and why they are where they are:
 *   - fewer than three answers is not evidence of anything, so the default
 *     route is served rather than a route chosen from one lucky guess;
 *   - struggling is accuracy BELOW 0.5 over at least three answers — a learner
 *     getting most items wrong — and never applies to a learner whose mastery
 *     has been established, because mastery outranks a bad early run;
 *   - advanced requires mastery at 0.8 or more AND the three answers, so a
 *     single correct answer does not promote anybody;
 *   - a route that has not been authored falls back to the default, so the
 *     function can only ever return teaching somebody wrote.
 *  The returned `route` is the one ACTUALLY served, so a caller can tell
 *  "default because no evidence" from "default because no alternate exists". */
export function ideaRouteFor(
  plan: LessonPlan,
  evidence?: LessonRouteEvidence | null,
): LessonRouteChoice {
  const attempts = evidence?.attempts ?? 0;
  const correct = evidence?.correct ?? 0;
  const mastery = evidence?.mastery ?? 0;
  const authored = plan.routes ?? [];
  if (attempts >= 3) {
    const accuracy = correct / attempts;
    if (mastery >= 0.8) {
      const advanced = authored.find((r) => r.when === "advanced");
      if (advanced) return { route: "advanced", idea: advanced.idea };
    } else if (accuracy < 0.5) {
      const struggling = authored.find((r) => r.when === "struggling");
      if (struggling) return { route: "struggling", idea: struggling.idea };
    }
  }
  return { route: "default", idea: plan.idea };
}

/** The languages this concept's lesson is COMPLETELY translated into, English
 *  excluded. Empty is the honest answer for almost the whole bank: one plan, one
 *  language is what has been authored, and the page's language note reads this
 *  rather than a hand-maintained list. */
export function teachingLanguages(conceptId: string): string[] {
  return completeLanguages(conceptId, LESSON_PLANS[conceptId] ?? null);
}

/** Words of authored teaching in a plan, for the coverage report and the
 *  assertion that a plan is longer than the paragraph it replaces. Counts the
 *  objective, intuition, idea paragraphs and trap explanations — the teaching —
 *  and not the internal ids. */
export function planWordCount(plan: LessonPlan): number {
  const text = [
    plan.objective,
    plan.intuition,
    ...plan.idea,
    ...plan.traps.flatMap((tr) => [tr.move, tr.why]),
    plan.usedFor,
  ].join(" ");
  return text.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
}

/** The FIRST MOVE of a marking explanation, and the rest of the working.
 *
 *  This is what makes the faded "we do" stage possible without authoring a
 *  second item: the bank's explanation already opens with the first thing to do
 *  ("Multiply the numerators: 3 × 2 = 6, then the denominators. The answer is
 *  6/15."), so the opening sentence is the part the learner is shown and the
 *  remainder is the part they have to reach themselves.
 *
 *  THE TWO GUARDS ARE THE WHOLE POINT, and both are measured in `npm run
 *  verify`:
 *   - a full stop only ends a sentence when WHITESPACE follows it, so a decimal
 *     ("13 ÷ 5 = 2.6. The answer is 2.6.") is not cut at "2.";
 *   - the next character must be a capital letter or an opening bracket, so an
 *     abbreviation ("e.g.", "i.e.") does not end the move.
 *  A one-sentence explanation has no rest: the learner then sees the whole
 *  method on the first press, which is still a fade relative to the worked
 *  example above it, because they had to start it.
 */
export function firstMoveOf(explanation: string): { first: string; rest: string } {
  const m = explanation.match(/^(.+?[.!?])\s+([A-Z(].*)$/s);
  if (m) return { first: m[1], rest: m[2] };
  return { first: explanation, rest: "" };
}

/** Which concepts have a plan: every concept in the genome today, including
 *  the supplemental coverage. `pilotPlanIds()` remains the smaller reviewed
 *  candidate set. */
export function plannedConceptIds(): string[] {
  return Object.keys(LESSON_PLANS);
}

/** Concepts a plan names that the genome does not hold. Must be empty — a plan
 *  filed under a typo'd id would render for nobody, silently. Exported so the
 *  suite can assert it rather than trusting the table above. */
export function orphanPlans(): string[] {
  const ids = new Set(CONCEPTS.map((c) => c.id));
  return plannedConceptIds().filter((id) => !ids.has(id));
}
