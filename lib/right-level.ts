// ─────────────────────────────────────────────────────────────────────────────
// TEACHING AT THE RIGHT LEVEL — the mechanism this product was missing.
//
// WHAT THE EVIDENCE SAYS, AND WHY THIS MODULE EXISTS.
//
// The 2023 GEEAP synthesis rates "structured pedagogy" and "teaching at the
// right level" as Great Buys, and hardware as a Bad Buy. The distinction is not
// about content quality: it is that a lesson pitched above a child's actual
// level produces no learning however good the lesson is. A class of 55 pupils
// in one grade typically spans four to six years of attainment, so a single
// whole-class explanation is aimed at nobody in particular.
//
// OpenMind already had 135 authored lessons, five delivery modes and a print
// pipeline. What it did not have was the step before all of them: find out what
// each pupil can actually do, group by that, and move a pupil up only when they
// have done it unaided. That is this module. It adds NO content — that is
// deliberate and enforced (OPENMIND_SCOPE.json is frozen) — it adds the routing
// rule the existing content needs in order to reach a child at the level they
// are at.
//
// FOUR RULES THIS MODULE KEEPS, each one learned from a failure mode:
//
//  1. THE PLACEMENT IS ORAL AND FIXED. EGMA is administered orally and
//     individually because a child who cannot read the question is not being
//     tested on mathematics. So every probe here is spoken by the teacher and
//     answered out loud; the PUPIL reads nothing and writes nothing. The probes
//     are also the SAME for every pupil, because a placement whose items are
//     freshly generated per child cannot compare two children or two terms.
//     Nothing here is drawn from the question bank. What the pupil sees and
//     hears is numerals and objects, so the instrument itself is
//     language-independent — but the teacher's script below is written in
//     English in this build, and the claims say so rather than implying the
//     script has been translated.
//
//  2. ABSENCE IS NOT A LEVEL. A pupil with no evidence is NOT at rung 1. They
//     are unmeasured, and they are listed as unmeasured. Assigning the bottom
//     rung from missing data is the same defect as scoring an unattempted
//     concept 0, and it is the defect that makes a "level" system harmful: the
//     child is then taught the wrong thing and the record says it was measured.
//
//  3. A GROUP ANSWER NEVER MOVES A PUPIL UP. The move-up rule reads sit-
//     tings that were unaided, individual and on two different days. A shared
//     device, a sampled marking of ten books, or one teacher-observed answer
//     can inform what to reteach; none of them can promote a child. This is the
//     same distinction lib/classroom-context.ts already makes between evidence
//     routes, applied where it changes a decision rather than only a sentence.
//
//  4. THE HONEST EDGES ARE IN THE DATA, NOT IN A FOOTNOTE. Two pupils matter
//     most for a national average and this product cannot serve either from its
//     own content: the child who cannot yet do rung 0 (the app's lowest concept
//     is place value) and the child who cannot read at all (the genome holds no
//     literacy concept). Both are represented as first-class states —
//     `"below"` and `LITERACY_GAP` — so a screen cannot quietly round them into
//     the nearest thing the product does have.
// ─────────────────────────────────────────────────────────────────────────────
import { CONCEPTS, getConcept } from "./genome";
import { teachingPlan, type ClassroomProfile } from "./classroom-context";
import type { ClassMemberLive } from "./types";

export const RIGHT_LEVEL_VERSION = 1 as const;

/** The rungs, lowest first. Rung 0 is BELOW the app's own content: place value
 *  is the lowest concept the genome holds, and a pupil who cannot yet read a
 *  three-digit number needs counting and one-to-one correspondence first. The
 *  product must be able to say so rather than teach place value to a child who
 *  cannot count to ten. */
export type RungLevel = 0 | 1 | 2 | 3 | 4 | 5;

/** `"below"` — failed the rung-0 probes, so below even this instrument.
 *  `"unknown"` — never assessed. Never rendered as a rung. */
export type AssessedLevel = RungLevel | "below" | "unknown";

export interface Rung {
  level: RungLevel;
  /** The app's own concepts that carry this rung. EMPTY for rung 0, which is
   *  the fact the product must not hide. */
  conceptIds: readonly string[];
  label: string;
  /** What a pupil at this rung can already do unaided — checkable in ten
   *  seconds, and the sentence a band card prints. */
  can: string;
  /** What the teacher teaches next, in one sentence. */
  teach: string;
}

export const RUNGS: readonly Rung[] = [
  {
    level: 0,
    conceptIds: [],
    label: "Before place value",
    can: "Counts objects to 10 and gives one number to one object.",
    teach: "Counting, one-to-one matching, and more/fewer with real objects — not a lesson in this app.",
  },
  {
    level: 1,
    conceptIds: ["place-value"],
    label: "Place value",
    can: "Reads a three-digit number and says what a digit is worth.",
    teach: "Place value: the 4 in 452 means 400, not 4.",
  },
  {
    level: 2,
    conceptIds: ["addition", "subtraction"],
    label: "Add and subtract",
    can: "Adds and subtracts within 100 without counting on fingers.",
    teach: "Column addition and subtraction with carrying and borrowing.",
  },
  {
    level: 3,
    conceptIds: ["multiplication", "division"],
    label: "Equal groups",
    can: "Uses multiplication as equal groups and division as sharing.",
    teach: "Multiplication as equal groups, and division as its inverse.",
  },
  {
    level: 4,
    conceptIds: ["fractions", "decimals"],
    label: "Parts of a whole",
    can: "Names a fraction of a shape and of a set, and reads a decimal.",
    teach: "Fractions as equal parts, then the same idea written as a decimal.",
  },
  {
    level: 5,
    conceptIds: ["percentages"],
    label: "Percent",
    can: "Finds a percentage of an amount.",
    teach: "Percent as 'per hundred', and a percentage of a quantity.",
  },
];

export function rungOf(level: RungLevel): Rung {
  return RUNGS.find((r) => r.level === level) ?? RUNGS[0]!;
}

export interface PlacementPrompt {
  /** What the teacher shows or says. Numerals and objects only: the instrument
   *  must not depend on the pupil reading, or on the language of instruction. */
  show: string;
  /** The expected answer, for the teacher's ear. Never shown to the pupil. */
  expect: string;
}

/** Three probes per rung, the same for every pupil and every term. */
export const PLACEMENT: Record<RungLevel, readonly PlacementPrompt[]> = {
  0: [
    { show: "Put 7 stones in front of the pupil. Say: “Count these.”", expect: "7, touching one stone per number." },
    { show: "Put 5 stones and 8 stones in two rows. Say: “Which row has more?”", expect: "The row of 8." },
    { show: "Put 10 stones in a row. Say: “Give me 6.”", expect: "Exactly 6, counted out." },
  ],
  1: [
    { show: "Write 452. Say: “Read this number.”", expect: "Four hundred and fifty-two." },
    { show: "Point at the 4 in 452. Say: “What is this digit worth here?”", expect: "Four hundred (400)." },
    { show: "Write 452 and 425. Say: “Which is bigger?”", expect: "452." },
  ],
  2: [
    { show: "Say: “47 add 8.”", expect: "55." },
    { show: "Say: “63 take away 25.”", expect: "38." },
    { show: "Say: “100 take away 37.”", expect: "63." },
  ],
  3: [
    { show: "Draw 4 circles, 3 dots in each. Say: “How many dots altogether?”", expect: "12." },
    { show: "Say: “7 times 6.”", expect: "42." },
    { show: "Put out 12 stones. Say: “Share these into 3 equal groups.”", expect: "4 in each." },
  ],
  4: [
    { show: "Put out 8 stones. Say: “Show me three quarters of these.”", expect: "6 stones (groups of 2, three taken)." },
    { show: "Write 0.3. Say: “Write this as a fraction.”", expect: "3/10." },
    { show: "Say: “One quarter add one quarter.”", expect: "One half (2/4)." },
  ],
  5: [
    { show: "Say: “What is 10% of 60?”", expect: "6." },
    { show: "Say: “What is 50% of 90?”", expect: "45." },
    { show: "Say: “Share 20 in the ratio 2 to 3.”", expect: "8 and 12." },
  ],
};

/** How many of a rung's three probes must be right to work at that rung. Two of
 *  three: one slip on a fixed instrument is not a level, and demanding three
 *  makes a tired child repeat a rung they can do. */
export const PROMOTION_MARK = 2;

export interface PlacementResponse {
  level: RungLevel;
  /** Did the pupil answer this probe correctly, unaided? */
  correct: boolean;
}

export interface PlacementResult {
  level: AssessedLevel;
  /** The rung that ended the staircase: failed, or never asked. */
  stoppedAt: RungLevel | null;
  complete: boolean;
  because: string;
}

/**
 * THE STAIRCASE. Start at rung 0 and climb while the pupil clears each rung;
 * stop at the first rung they fail. Only the rungs asked are used: an
 * unassessed rung stops the climb as `incomplete` rather than being treated as
 * a failure, so a teacher who ran out of time gets "not yet placed", never a
 * lower level than the child earned.
 */
export function markPlacement(responses: readonly PlacementResponse[]): PlacementResult {
  if (responses.length === 0) {
    return { level: "unknown", stoppedAt: null, complete: false, because: "No probe was recorded." };
  }
  const byLevel = new Map<RungLevel, { asked: number; correct: number }>();
  for (const r of responses) {
    const row = byLevel.get(r.level) ?? { asked: 0, correct: 0 };
    row.asked += 1;
    if (r.correct) row.correct += 1;
    byLevel.set(r.level, row);
  }

  const zero = byLevel.get(0);
  if (!zero) {
    return { level: "unknown", stoppedAt: 0, complete: false, because: "The counting probes were not recorded, so no rung above them can be trusted." };
  }
  if (zero.correct < PROMOTION_MARK) {
    return {
      level: "below",
      stoppedAt: 0,
      complete: true,
      because: `${zero.correct} of ${zero.asked} counting probes correct: below this instrument, and below every concept the app holds.`,
    };
  }

  let level: RungLevel = 0;
  for (let next = 1 as RungLevel; next <= 5; next = (next + 1) as RungLevel) {
    const row = byLevel.get(next);
    if (!row) {
      return { level, stoppedAt: next, complete: false, because: `Rung ${next} was not asked, so this is a floor and not a ceiling.` };
    }
    if (row.correct < PROMOTION_MARK) {
      return { level, stoppedAt: next, complete: true, because: `${row.correct} of ${row.asked} probes correct at rung ${next}.` };
    }
    level = next;
  }
  return { level, stoppedAt: null, complete: true, because: "All five rungs cleared." };
}

// ── FROM THE APP'S OWN EVIDENCE, WHERE EVIDENCE EXISTS ──────────────────────

/** A concept counts as established at this rate over at least this many
 *  independently-graded answers. Deliberately the same shape as the product's
 *  own mastery bar: a level built on a different threshold from every other
 *  screen would be a second opinion about the same child. */
export const LEVEL_RATE = 0.7;
export const LEVEL_ANSWERS = 4;

export interface EvidenceLevel {
  level: AssessedLevel;
  /** Rungs the evidence actually covers, 0–5. */
  measuredRungs: RungLevel[];
  because: string;
}

/**
 * Derive a working rung from a member's ledger projection.
 *
 * Only the RUNG MAPPING is derived here; the evidence itself is the server's
 * (`ClassMemberLive`, computed from that member's append-only ledger). Two
 * rules matter:
 *
 *  - A rung is held only when EVERY concept carrying it has enough answers and
 *    clears LEVEL_RATE. A child who can multiply but not divide is not at the
 *    equal-groups rung.
 *  - A failure at rung 1 does NOT mean rung 0. Rung 1 evidence can only say
 *    "working at rung 1", because nothing in the ledger measures counting. Only
 *    the oral rung-0 probes can place a child below rung 1, which is why the
 *    placement sheet exists and why this function never returns 0.
 */
export function levelFromEvidence(concepts: ClassMemberLive["concepts"] | undefined | null): EvidenceLevel {
  const measured: RungLevel[] = [];
  if (!concepts) {
    return { level: "unknown", measuredRungs: measured, because: "This member has no graded answers on record." };
  }
  for (const rung of RUNGS) {
    if (rung.level === 0) continue;
    const rows = rung.conceptIds.map((id) => ({ id, row: concepts[id] }));
    const known = rows.filter((r) => r.row && r.row.asked >= LEVEL_ANSWERS);
    if (known.length === 0) break;
    measured.push(rung.level);
    const held = rows.every((r) => !!r.row && r.row.asked >= LEVEL_ANSWERS && r.row.rate >= LEVEL_RATE);
    if (!held) {
      return {
        level: rung.level,
        measuredRungs: measured,
        because: `Working at rung ${rung.level}: ${rung.label} is not yet held on independent answers.`,
      };
    }
  }
  const top = measured.length ? measured[measured.length - 1]! : null;
  if (top === null) {
    return { level: "unknown", measuredRungs: measured, because: "No rung has enough graded answers to place this member." };
  }
  const beyondTop = (top + 1) as RungLevel;
  const nextRung = RUNGS.find((r) => r.level === beyondTop);
  if (!nextRung) {
    return { level: top, measuredRungs: measured, because: "Every rung the evidence covers is held." };
  }
  return {
    level: top,
    measuredRungs: measured,
    because: `Rung ${top} is held; rung ${beyondTop} (${nextRung.label}) has no answers yet, so this is a floor.`,
  };
}

// ── BANDS ───────────────────────────────────────────────────────────────────

export interface Band {
  level: RungLevel;
  members: string[];
  count: number;
  /** The app concept to teach this band. `null` for rung 0: nothing in the app
   *  is pitched there. */
  conceptId: string | null;
  conceptTitle: string;
  can: string;
  teach: string;
  /** True when the app's own lessons can carry this band. */
  inApp: boolean;
}

export interface BandPlan {
  bands: Band[];
  /** Assessed below the rung-0 probes: needs counting, which the app does not
   *  teach. Named separately, never folded into rung 1. */
  below: string[];
  /** No level recorded. NOT the bottom band. */
  unknown: string[];
  total: number;
  measured: number;
  /** Numeric rungs present, highest minus lowest. 0 with fewer than two bands. */
  spread: number;
  /** A single whole-class explanation cannot reach a room spanning three or
   *  more rungs — the fact that makes the sprint necessary rather than nice. */
  oneExplanationCannotCover: boolean;
}

/**
 * Group assessed pupils into bands, lowest rung first.
 *
 * Every member lands in exactly one of `bands`, `below` or `unknown`. The
 * partition is the assertion a caller can rely on: a member who vanishes from
 * the screen is a child nobody teaches.
 */
export function bandsFrom(levels: Readonly<Record<string, AssessedLevel>>): BandPlan {
  const buckets = new Map<RungLevel, string[]>();
  const below: string[] = [];
  const unknown: string[] = [];
  for (const [handle, level] of Object.entries(levels)) {
    if (level === "unknown") {
      unknown.push(handle);
      continue;
    }
    if (level === "below") {
      below.push(handle);
      continue;
    }
    const list = buckets.get(level) ?? [];
    list.push(handle);
    buckets.set(level, list);
  }
  const bands: Band[] = [];
  for (const rung of RUNGS) {
    const members = (buckets.get(rung.level) ?? []).sort((a, b) => a.localeCompare(b));
    if (members.length === 0) continue;
    const conceptId = rung.conceptIds[0] ?? null;
    bands.push({
      level: rung.level,
      members,
      count: members.length,
      conceptId,
      conceptTitle: conceptId ? (getConcept(conceptId)?.title ?? conceptId) : "Counting (not in this app)",
      can: rung.can,
      teach: rung.teach,
      inApp: rung.conceptIds.length > 0,
    });
  }
  below.sort((a, b) => a.localeCompare(b));
  unknown.sort((a, b) => a.localeCompare(b));
  const numeric = bands.map((b) => b.level).filter((l): l is RungLevel => l > 0);
  const spread = numeric.length > 1 ? Math.max(...numeric) - Math.min(...numeric) : 0;
  return {
    bands,
    below,
    unknown,
    total: Object.keys(levels).length,
    measured: Object.keys(levels).length - unknown.length,
    spread,
    oneExplanationCannotCover: spread >= 3,
  };
}

/** The level map for a whole class, preferring the server's ledger projection
 *  over any stored self-report — the same precedence lib/teacher-plan.ts uses. */
export function assessClass(live: Readonly<Record<string, ClassMemberLive>> | undefined | null): {
  levels: Record<string, AssessedLevel>;
  sources: number;
} {
  const levels: Record<string, AssessedLevel> = {};
  let sources = 0;
  for (const [handle, member] of Object.entries(live ?? {})) {
    const derived = levelFromEvidence(member.concepts);
    levels[handle] = derived.level;
    if (derived.level !== "unknown") sources += 1;
  }
  return { levels, sources };
}

// ── THE DAILY SPRINT ────────────────────────────────────────────────────────

export interface SprintBlock {
  minutes: number;
  step: string;
  detail: string;
}

export interface Sprint {
  level: RungLevel;
  /** False for rung 0: the routine below is a teacher's counting routine, not
   *  an OpenMind lesson, and the screen must not colour it as one. */
  available: boolean;
  blocks: SprintBlock[];
  totalMinutes: number;
  /** `per-child` when each answer is that pupil's own evidence; `band-only`
   *  when no evidence route can carry an individual claim. */
  record: "per-child" | "band-only";
  recordNote: string;
}

export const SPRINT_MINUTES = 20;
/** Six short items in the independent part. Two sittings of six are what the
 *  move-up rule reads. */
export const CHECK_ITEMS = 6;

const SAFE_PROFILE: ClassroomProfile = { version: 1, languages: [], materials: [], access: [] };

/**
 * THE TWENTY-MINUTE INSERT, not a programme.
 *
 * The evidence for right-level teaching comes from timetabled blocks — TaRL
 * runs an hour a day — and this product is used inside a national curriculum,
 * so twenty minutes is what a teacher can actually take from a lesson without
 * abandoning the syllabus. That is a real limit, and it is stated in the plan
 * rather than implied away: twenty minutes a day is enough to move a band
 * roughly one rung in six to ten weeks if it is every day, and nothing at all
 * if it is once a week.
 */
export function dailySprint(level: RungLevel, profile?: ClassroomProfile): Sprint {
  const plan = teachingPlan(profile ?? SAFE_PROFILE);
  const perChild = plan.evidence.route === "learner-accounts" || plan.evidence.route === "kiosk";
  const recordNote = perChild
    ? "Answers are that pupil's own evidence, so the rule can move an individual up."
    : "No pupil account can carry an individual claim in this room: record the BAND's count. A sampled marking informs the reteach and never promotes a child.";

  if (level === 0) {
    return {
      level,
      available: false,
      totalMinutes: 10,
      record: "band-only",
      recordNote: "No OpenMind lesson is pitched below place value. This is a teacher routine, not app content.",
      blocks: [
        { minutes: 2, step: "Count together", detail: "Count to 20 aloud, together, touching one object per number." },
        { minutes: 3, step: "One to one", detail: "Ten stones in a row. Pupil gives one stone per number as the class counts." },
        { minutes: 3, step: "More and fewer", detail: "Two rows. “Which row has more? How many more?”" },
        { minutes: 2, step: "Give me N", detail: "“Give me 6.” Pupil counts out exactly six, then checks by counting again." },
      ],
    };
  }

  const rung = rungOf(level);
  const title = rung.conceptIds[0] ? (getConcept(rung.conceptIds[0])?.title ?? rung.label) : rung.label;
  const board = plan.projector ? "the board or the projector" : "the board";
  return {
    level,
    available: true,
    totalMinutes: SPRINT_MINUTES,
    record: perChild ? "per-child" : "band-only",
    recordNote,
    blocks: [
      {
        minutes: 2,
        step: "Say it together",
        detail: `Choral warm-up on ${title}: the counting or table facts this rung needs, said aloud by the whole band.`,
      },
      {
        minutes: 5,
        step: "One idea, one example",
        detail: `Teach ONE step at ${board}. One worked example, said out loud, then a second with the band telling you each move.`,
      },
      {
        minutes: 8,
        step: "Pairs",
        detail: `Six items at ${title}. One works, one checks the method; swap after every two. The checker must say WHY, not only right or wrong.`,
      },
      {
        minutes: 4,
        step: "Books closed",
        detail: `${CHECK_ITEMS} items, silent, no help, no partner. This is the sitting the move-up rule reads — it is not practice.`,
      },
      {
        minutes: 1,
        step: "Record",
        detail: perChild
          ? "Each pupil submits their six on their own account; nothing is typed for them."
          : "Write the band's count on the class sheet. Do not write an individual's score from a group answer.",
      },
    ],
  };
}

/**
 * THE MOVE-UP RULE. Deliberately hard to satisfy.
 *
 * Two sittings, on two different days, each of six individual unaided items,
 * each with at least five correct. Anything less is `not-enough-evidence` or
 * `reteach`; nothing is `hold` except a pupil who has stopped attending.
 *
 * Why two days: one good sitting is a good day. The whole point of a level is
 * that it predicts what the child can do tomorrow, and a single sitting cannot
 * distinguish learning from a lucky draw or a copied page.
 */
export const MOVE_UP_UNAIDED = 5;
export const RETEACH_AT_OR_BELOW = 4;

export interface CheckSitting {
  /** Epoch ms. Compared by calendar day, not by elapsed hours. */
  at: number;
  /** Items attempted, and answered without help. */
  items: number;
  unaided: number;
  /** A group or shared-device answer: group evidence, never one pupil's. */
  group: boolean;
  /** The teacher marked a sample and recorded a rate, not this pupil's six. */
  sampled: boolean;
}

export type MoveUpDecision = "move-up" | "reteach" | "hold" | "not-enough-evidence";

export interface MoveUpVerdict {
  decision: MoveUpDecision;
  because: string;
  /** The sittings the verdict actually read — the ones it was allowed to. */
  counted: number;
}

function dayOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function evaluateMoveUp(sittings: readonly CheckSitting[]): MoveUpVerdict {
  const usable = sittings.filter((s) => !s.group && !s.sampled && s.items >= CHECK_ITEMS);
  if (usable.length === 0) {
    return {
      decision: "not-enough-evidence",
      because: "No individual, unaided sitting of six items is on record. A group answer and a sampled marking cannot move a pupil up.",
      counted: 0,
    };
  }
  const days = new Set(usable.map((s) => dayOf(s.at)));
  if (days.size < 2) {
    return {
      decision: "not-enough-evidence",
      because: "One sitting is a good day, not a level. The rule needs two sittings on two different days.",
      counted: usable.length,
    };
  }
  // The two strongest sittings on distinct days decide.
  const best = [...usable].sort((a, b) => b.unaided - a.unaided);
  const chosen: CheckSitting[] = [];
  const usedDays = new Set<string>();
  for (const s of best) {
    const day = dayOf(s.at);
    if (usedDays.has(day)) continue;
    usedDays.add(day);
    chosen.push(s);
    if (chosen.length === 2) break;
  }
  if (chosen.length < 2) {
    return { decision: "not-enough-evidence", because: "Two usable sittings fell on the same day.", counted: usable.length };
  }
  const weak = chosen.filter((s) => s.unaided < MOVE_UP_UNAIDED);
  if (weak.length === 0) {
    return {
      decision: "move-up",
      because: `Two separate days at ${MOVE_UP_UNAIDED}+ of ${CHECK_ITEMS} unaided. Move to the next rung and keep the old one warm in the warm-up.`,
      counted: usable.length,
    };
  }
  const reteach = chosen.some((s) => s.unaided >= RETEACH_AT_OR_BELOW);
  if (reteach) {
    return {
      decision: "reteach",
      because: `At least one sitting reached ${RETEACH_AT_OR_BELOW} of ${CHECK_ITEMS} but not ${MOVE_UP_UNAIDED}. Reteach the same rung with a different representation rather than repeating the same explanation.`,
      counted: usable.length,
    };
  }
  return {
    decision: "hold",
    because: "Both sittings were below 4 of 6: this pupil is not yet at this rung. Go down one rung and check they can do what it says.",
    counted: usable.length,
  };
}

// ── HOW LONG THE PLACEMENT TAKES — AND WHAT A 55-PUPIL ROOM CAN DO ──────────

export const PLACEMENT_MINUTES_PER_PUPIL = 3;
const LESSON_MINUTES = 40;

export interface PlacementRoute {
  id: "whole-class" | "sample" | "show-me";
  label: string;
  gets: string;
  costs: string;
  precision: string;
}

export interface PlacementLoad {
  pupils: number;
  minutesPerPupil: number;
  wholeClassMinutes: number;
  wholeClassLessons: number;
  samplePupils: number;
  sampleMinutes: number;
  routes: PlacementRoute[];
}

/**
 * An individual oral placement is three minutes. For 55 pupils that is 165
 * minutes — four lessons — which no teacher spends, and pretending otherwise is
 * why placement systems get abandoned in week one. So the load is computed and
 * three routes are offered with their real costs. `show-me` is whole-class:
 * response cards or fingers, a rung at a time, which bands the class in ten
 * minutes but cannot place one child exactly.
 */
export function placementLoad(pupils: number): PlacementLoad {
  const n = Math.max(0, Math.floor(pupils));
  const wholeClassMinutes = n * PLACEMENT_MINUTES_PER_PUPIL;
  const samplePupils = Math.min(n, 8);
  return {
    pupils: n,
    minutesPerPupil: PLACEMENT_MINUTES_PER_PUPIL,
    wholeClassMinutes,
    wholeClassLessons: Math.ceil(wholeClassMinutes / LESSON_MINUTES),
    samplePupils,
    sampleMinutes: samplePupils * PLACEMENT_MINUTES_PER_PUPIL,
    routes: [
      {
        id: "whole-class",
        label: "Every pupil, orally",
        gets: `An exact rung for all ${n} pupils.`,
        costs: `${wholeClassMinutes} minutes — ${Math.ceil(wholeClassMinutes / LESSON_MINUTES)} lessons — in 3-minute slots while the class works.`,
        precision: "Exact for every pupil.",
      },
      {
        id: "sample",
        label: "Eight pupils, then teach",
        gets: `Eight exact rungs in ${samplePupils * PLACEMENT_MINUTES_PER_PUPIL} minutes this week; the rest join a band on the evidence they already have and are placed next week.`,
        costs: `${samplePupils * PLACEMENT_MINUTES_PER_PUPIL} minutes.`,
        precision: "Exact for eight; provisional for the rest, and labelled provisional.",
      },
      {
        id: "show-me",
        label: "Whole class, show me",
        gets: "The whole class banded in ten minutes: one rung's probe at a time, everyone shows fingers or a card.",
        costs: "10 minutes, no individual interview.",
        precision: "Approximate: tells you which rungs exist in the room, not which pupil is on which.",
      },
    ],
  };
}

// ── ONE CLASS'S PLAN ────────────────────────────────────────────────────────

export interface ClassPlan {
  bands: BandPlan;
  sprints: Sprint[];
  load: PlacementLoad;
  warnings: string[];
}

/** Everything a teacher's screen needs, from one declared classroom and the
 *  server's own member projections. Pure: same inputs, same plan. */
export function classPlan(
  levels: Readonly<Record<string, AssessedLevel>>,
  profile: ClassroomProfile | undefined,
): ClassPlan {
  const bands = bandsFrom(levels);
  const sprints = bands.bands.map((b) => dailySprint(b.level, profile));
  const load = placementLoad(bands.total);
  const warnings: string[] = [];

  if (bands.unknown.length > 0) {
    warnings.push(
      `${bands.unknown.length} pupil${bands.unknown.length === 1 ? " has" : "s have"} no level on record. They are unmeasured, not at rung 1 — place them before grouping.`,
    );
  }
  if (bands.below.length > 0) {
    warnings.push(
      `${bands.below.length} pupil${bands.below.length === 1 ? " is" : "s are"} below rung 0 (cannot yet count to ten reliably). This app has no content for them: use the 10-minute counting routine and raise it with your district.`,
    );
  }
  if (bands.oneExplanationCannotCover) {
    warnings.push(
      `This room spans ${bands.spread} rungs. One whole-class explanation cannot reach it: teach two bands on alternate days, or run the sprint with a capable pupil leading one band.`,
    );
  }
  if (bands.total >= 40) {
    warnings.push(
      `${bands.total} pupils x ${PLACEMENT_MINUTES_PER_PUPIL} minutes is ${load.wholeClassMinutes} minutes of individual placement. Use the eight-pupil sample this week and place the rest as they are seen.`,
    );
  }
  if (profile && profile.devices !== "one-per-pupil" && profile.devices !== "shared") {
    warnings.push("No pupil device: the independent check is marked in books, so record the band's count, not an individual's.");
  }
  return { bands, sprints, load, warnings };
}

// ── DID IT MOVE? ────────────────────────────────────────────────────────────

export interface LevelObservation {
  at: number;
  level: RungLevel;
}

export interface LevelGain {
  gained: number | null;
  spanDays: number;
  perWeek: number | null;
  because: string;
}

/**
 * Level movement for ONE pupil, from placement observations.
 *
 * A rate needs at least SEVEN days between the first and last observation: a
 * gain measured over two days is a good week, not a rate, and quoting it as
 * "levels per week" would multiply it by three and a half. Below seven days the
 * gain is reported and the rate is `null`.
 */
export const RATE_WINDOW_DAYS = 7;

export function levelGain(observations: readonly LevelObservation[]): LevelGain {
  const ordered = [...observations].sort((a, b) => a.at - b.at);
  if (ordered.length < 2) {
    return { gained: null, spanDays: 0, perWeek: null, because: "One observation: a level, not yet a gain." };
  }
  const first = ordered[0]!;
  const last = ordered[ordered.length - 1]!;
  const spanDays = Math.round((last.at - first.at) / 86_400_000);
  const gained = last.level - first.level;
  if (spanDays < RATE_WINDOW_DAYS) {
    return {
      gained,
      spanDays,
      perWeek: null,
      because: `${spanDays} day${spanDays === 1 ? "" : "s"} between observations: the gain is what happened, the weekly rate is not measurable yet.`,
    };
  }
  return {
    gained,
    spanDays,
    perWeek: Number(((gained * 7) / spanDays).toFixed(2)),
    because: `Measured over ${spanDays} days on this device's own observations.`,
  };
}

// ── WHAT THIS DOES NOT CLAIM ────────────────────────────────────────────────

/** The literacy concepts the genome holds. It is empty, and the emptiness is
 *  the finding: no amount of right-level routing teaches a child to read. */
// Word boundaries, not substrings: "Averages & spread" contains "read", and a
// substring match would have reported a statistics concept as literacy content
// and made the gap look one concept smaller than it is.
const LITERACY_ID = /\b(reading|read|literacy|phonics|phonic|spelling|spell|writing|written|comprehension|fluency|vocabulary)\b/i;

export function literacyConcepts(): string[] {
  return CONCEPTS.filter((c) => LITERACY_ID.test(c.id) || LITERACY_ID.test(c.title)).map((c) => c.id);
}

export interface LiteracyGap {
  present: false;
  concepts: number;
  missing: string[];
  wouldRequire: string[];
  why: string;
}

/**
 * THE LARGEST HONEST STATEMENT THIS PRODUCT CAN MAKE ABOUT LITERACY.
 *
 * Numeracy and literacy are not the same intervention, and this genome is
 * numerate and scientific. A child who cannot decode a word cannot read a maths
 * question either — so the absence is not a scope choice, it is the ceiling on
 * what this app can do for a learning rate in the countries it is written for.
 */
export const LITERACY_GAP: LiteracyGap = {
  present: false,
  concepts: 0,
  missing: [
    "Letter sounds and decoding (phonics), in the language of instruction",
    "Oral language and vocabulary, before print",
    "High-frequency words read on sight",
    "Oral reading fluency, measured in correct words per minute",
    "Comprehension of a short passage, asked aloud",
    "Writing: a sentence a child can read back",
  ],
  wouldRequire: [
    "A foundational literacy strand authored in one named language of instruction",
    "A local educator reviewing that strand, with their name and date recorded",
    "An oral reading fluency instrument administered one child at a time",
    "The freeze in OPENMIND_SCOPE.json lifted by a named decision, not by a feature request",
  ],
  why:
    "The genome's 135 concepts teach mathematics, science and computing. None of them teaches a child to read, and no routing rule can substitute for decoding instruction.",
};

export const RIGHT_LEVEL_CLAIMS = {
  asserts: [
    "Every pupil is routed to a rung, or is explicitly unmeasured.",
    "A pupil moves up only on two separate days of individual, unaided work.",
    "The placement asks nothing the pupil must read; the pupil answers aloud.",
    "The plan names what the app cannot teach: rung 0 and literacy.",
  ],
  doesNotAssert: [
    "That OpenMind raises literacy rates. It has no literacy content.",
    "That the teacher's placement script has been translated. It is English in this build.",
    "That a rung is a grade, a year group or a qualification.",
    "That a band rate is any pupil's mastery.",
    "That this plan has been taught in a real classroom.",
  ],
} as const;
