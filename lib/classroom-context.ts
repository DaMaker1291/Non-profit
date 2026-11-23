// ─────────────────────────────────────────────────────────────────────────────
// THE CLASSROOM, AS THE TEACHER DECLARES IT — and the plan that follows.
//
// WHY THIS MODULE EXISTS. `lib/classroom-session.ts` already models five
// DELIVERY MODES and builds a run of show from them, but nothing recorded which
// mode a TEACHER's room is in. The mode was a query parameter: a teacher picked
// "shared devices" on the guide, picked it again on the presenter, and picked it
// again next lesson, and the class record held no classroom at all. So the
// product could not say "this class has no pupil devices" anywhere it mattered,
// and the first lesson of a 65-pupil classroom looked exactly like the first
// lesson of a 12-pupil one with a tablet each.
//
// THE RULE THIS MODULE KEEPS: derive only from what the teacher declared, and
// NAME what was defaulted. A plan is not a policy. If the teacher has not said
// whether there is a printer, the plan does not assume one — it says so
// (`assumed`) and works from the board and exercise books. `unknowns` lists the
// answers that would change the plan, so "add detail later" is a checklist with
// consequences rather than a form with a Save button.
//
// WHAT IT DELIBERATELY DOES NOT DO. It does not claim a curriculum is reviewed,
// does not score a lesson, and does not decide what a pupil has learned: those
// live in lib/curricula/registry.ts (readiness), lib/lesson-contract.ts (review
// rungs) and the evidence ledger (mastery). This module answers one question a
// teacher asks before the bell: "given this room, how does the lesson actually
// run?"
// ─────────────────────────────────────────────────────────────────────────────

import type { ClassroomContextId } from "./classroom-session";

export const CLASSROOM_PROFILE_VERSION = 1 as const;

/** What the pupils have in front of them. `teacher-only` is one computer the
 *  teacher uses; `none` is a board and exercise books. */
export const DEVICE_MODES = ["none", "teacher-only", "shared", "one-per-pupil"] as const;
export type DeviceMode = (typeof DEVICE_MODES)[number];

/** Connectivity during a lesson, not at the school gate. */
export const CONNECTIVITY = ["none", "intermittent", "reliable"] as const;
export type Connectivity = (typeof CONNECTIVITY)[number];

export const SCHOOL_TYPES = ["public", "private", "community", "faith", "independent", "informal"] as const;
export type SchoolType = (typeof SCHOOL_TYPES)[number];

/** Materials a lesson can actually rely on. Nothing here is assumed. */
export const MATERIALS = ["board", "textbooks", "printer", "projector", "laboratory", "manipulatives"] as const;
export type MaterialId = (typeof MATERIALS)[number];

/** Needs a delivery plan must accommodate. Ids, not diagnoses: each names a
 *  change to HOW the lesson is delivered, never a label for a pupil. */
export const ACCESS_NEEDS = ["low-vision", "hearing", "motor", "attention", "screen-reader", "large-print"] as const;
export type AccessNeed = (typeof ACCESS_NEEDS)[number];

export type ClassroomFieldId =
  | "country"
  | "region"
  | "schoolType"
  | "stage"
  | "languages"
  | "classSize"
  | "mixedAge"
  | "devices"
  | "internet"
  | "power"
  | "materials"
  | "access"
  | "customCurriculum";

export interface ClassroomProfile {
  version: number;
  country?: string;
  region?: string;
  schoolType?: SchoolType;
  /** The educational stage taught, e.g. "Year 7" or "Class 9". Free text on
   *  purpose: a teacher whose system names it differently must not be forced
   *  into another country's vocabulary. */
  stage?: string;
  /** Language codes, most-used first. The first is the language of instruction. */
  languages: string[];
  classSize?: number;
  mixedAge?: boolean;
  devices?: DeviceMode;
  internet?: Connectivity;
  power?: Connectivity;
  materials: MaterialId[];
  access: AccessNeed[];
  /** A curriculum the registry does not hold, named by the teacher, with the
   *  objectives they gave it. Never mapped onto a genome concept by guessing. */
  customCurriculum?: string;
}

/** The four answers that change the plan most, and therefore the ones a teacher
 *  is asked first. Everything else is optional detail. */
export const QUICK_START_FIELDS: readonly ClassroomFieldId[] = ["classSize", "devices", "internet", "languages"];

export const CLASSROOM_FIELDS: readonly {
  id: ClassroomFieldId;
  quick: boolean;
  /** What answering this changes. Shown beside the field, so the form is a
   *  decision rather than a registration. */
  why: string;
}[] = [
  { id: "classSize", quick: true, why: "Decides whether checks are written, oral, sampled or individual." },
  { id: "devices", quick: true, why: "Decides whether pupils can answer on a device at all." },
  { id: "internet", quick: true, why: "Decides whether the lesson can use the live classroom or must be prepared offline." },
  { id: "languages", quick: true, why: "Decides which language the idea is explained in and which term the written answer uses." },
  { id: "country", quick: false, why: "Selects the education system the class's curriculum comes from." },
  { id: "region", quick: false, why: "Records a state, province or board that differs from the national one." },
  { id: "schoolType", quick: false, why: "Records the school's funding and governance, which affects what it can rely on." },
  { id: "stage", quick: false, why: "Names the year or class group being taught." },
  { id: "power", quick: false, why: "Decides whether a projector or a charged device can be assumed." },
  { id: "materials", quick: false, why: "Decides whether the lesson can print, project or use apparatus." },
  { id: "access", quick: false, why: "Adds the delivery changes the lesson must include." },
  { id: "mixedAge", quick: false, why: "Sets one prompt at different depths for different year groups." },
  { id: "customCurriculum", quick: false, why: "Lets a teacher whose curriculum is not in the registry still plan a lesson." },
];

export interface ClassroomGap {
  field: ClassroomFieldId;
  quick: boolean;
  why: string;
}

/** What has not been declared. Quick-start gaps first: the plan degrades
 *  honestly without the rest, but not without these. */
export function classroomGaps(profile: ClassroomProfile): ClassroomGap[] {
  const missing: ClassroomFieldId[] = [];
  if (profile.classSize === undefined) missing.push("classSize");
  if (profile.devices === undefined) missing.push("devices");
  if (profile.internet === undefined) missing.push("internet");
  if (profile.languages.length === 0) missing.push("languages");
  if (!profile.country) missing.push("country");
  if (!profile.stage) missing.push("stage");
  if (profile.power === undefined) missing.push("power");
  if (profile.materials.length === 0) missing.push("materials");
  if (profile.access.length === 0) missing.push("access");
  const order = new Map(CLASSROOM_FIELDS.map((f, i) => [f.id, i] as const));
  return missing
    .map((field) => CLASSROOM_FIELDS.find((f) => f.id === field)!)
    .sort((a, b) => Number(b.quick) - Number(a.quick) || (order.get(a.id)! - order.get(b.id)!))
    .map((f) => ({ field: f.id, quick: f.quick, why: f.why }));
}

/** The plan is usable once the four quick answers exist. A teacher may still
 *  teach from a half-filled profile — the plan says what it assumed — but this
 *  is what "classroom configured" means on screen. */
export function classroomReady(profile: ClassroomProfile): boolean {
  return classroomGaps(profile).every((g) => !g.quick);
}

export type DeliveryMode = "whole-class" | "shared-device" | "individual" | "offline";

export type EvidenceRoute = "learner-accounts" | "kiosk" | "printed-answers" | "teacher-observation";

export interface TeachingPlan {
  delivery: DeliveryMode;
  /** The run-sheet mode the presenter and the printable guide should use. */
  contextId: ClassroomContextId;
  /** Other modes this class also needs; the primary one is not repeated. */
  adaptations: ClassroomContextId[];
  pupilDevices: boolean;
  accounts: boolean;
  printer: boolean;
  projector: boolean;
  offline: boolean;
  groupSize: number | null;
  evidence: { route: EvidenceRoute; sentence: string };
  languageSupport: string[];
  constraints: string[];
  /** Fields the plan filled with a conservative default, named so a teacher can
   *  correct them. Never presented as a fact about the room. */
  assumed: ClassroomFieldId[];
  unknowns: ClassroomGap[];
}

const has = <T extends string>(list: readonly T[], value: string | undefined): value is T =>
  value !== undefined && (list as readonly string[]).includes(value);

function languageSupport(languages: string[]): string[] {
  if (languages.length === 0) {
    return ["Language of instruction not recorded yet. Ask pupils to say the key term in the language they understand, then write the examination term."];
  }
  const first = languages[0];
  if (languages.length === 1) {
    return [`Explain and write in ${first}. Say the key term aloud before pupils write it, because a term a pupil only reads is a term they may not recognise spoken.`];
  }
  const others = languages.slice(1).join(", ");
  return [
    `Explain the idea in ${first}, and let pupils discuss it in ${others}.`,
    `Every written answer uses the subject term the assessment uses (${first}), so a pupil who understands the idea in ${others} still practises the word the examination will show them.`,
    `Keep both on the board: the explanation in ${others}, the subject term in ${first}. Ask one pupil to use both in one sentence.`,
  ];
}

function accessLines(needs: AccessNeed[]): string[] {
  return needs.map((need) => {
    switch (need) {
      case "low-vision":
        return "Low vision: read every prompt aloud, use large print, and never put the only copy of a question on a screen pupils must squint at.";
      case "large-print":
        return "Large print: print the worksheet at a larger size; check that the diagram still fits one page before the lesson.";
      case "hearing":
        return "Hearing: face the class when speaking, write the key term on the board, and never make hearing a spoken instruction the only route to the task.";
      case "motor":
        return "Motor: allow oral answers or a scribe for written work; do not make fine handwriting the barrier to showing the method.";
      case "attention":
        return "Attention: one instruction at a time, a visible sequence on the board, and a short check after each step.";
      case "screen-reader":
        return "Screen reader: the printed and on-screen prompts must be readable in order; a diagram needs its caption read as text, not only drawn.";
    }
  });
}

/**
 * GIVEN THIS ROOM, HOW DOES THE LESSON RUN?
 *
 * Every branch below is a consequence of a declared answer. Where an answer is
 * absent, the conservative branch is taken and the field is named in `assumed`
 * — a plan that quietly assumed pupil devices would be the same defect as a
 * label that quietly assumed a qualification.
 */
export function teachingPlan(profile: ClassroomProfile): TeachingPlan {
  const assumed: ClassroomFieldId[] = [];
  const devices = profile.devices;
  const internet = profile.internet;
  const power = profile.power;
  if (devices === undefined) assumed.push("devices");
  if (internet === undefined) assumed.push("internet");
  if (power === undefined) assumed.push("power");
  if (profile.materials.length === 0) assumed.push("materials");
  if (profile.classSize === undefined) assumed.push("classSize");

  const printer = profile.materials.includes("printer");
  const electricity = power !== "none";
  const projector = profile.materials.includes("projector") && electricity && devices !== "none";

  const pupilDevices = devices === "shared" || devices === "one-per-pupil";
  const online = internet !== "none";

  let delivery: DeliveryMode;
  let contextId: ClassroomContextId;
  if (devices === "one-per-pupil") {
    if (online) {
      delivery = "individual";
      contextId = "individual-devices";
    } else {
      delivery = "offline";
      contextId = "individual-devices";
    }
  } else if (devices === "shared") {
    delivery = online ? "shared-device" : "offline";
    contextId = "shared-devices";
  } else {
    delivery = online && pupilDevices ? "whole-class" : "whole-class";
    contextId = "no-student-devices";
  }

  const size = profile.classSize;
  const groupSize = size === undefined ? null : size >= 40 ? 6 : size >= 25 ? 4 : size >= 12 ? 3 : 2;

  const adaptations: ClassroomContextId[] = [];
  if (size !== undefined && size >= 40) adaptations.push("large-class");
  if (profile.languages.length > 1) adaptations.push("multilingual");
  const noMaterials = !profile.materials.includes("textbooks") && !profile.materials.includes("projector") && !profile.materials.includes("laboratory");
  if (profile.materials.length > 0 && noMaterials) adaptations.push("limited-materials");

  let evidence: { route: EvidenceRoute; sentence: string };
  if (delivery === "individual" && online) {
    evidence = {
      route: "learner-accounts",
      sentence: "Each pupil answers on their own device with their own account, so every answer is that pupil's evidence.",
    };
  } else if (devices === "shared" && online) {
    evidence = {
      route: "kiosk",
      sentence:
        internet === "intermittent"
          ? "Use the shared-device class code and PIN, and sync the answers when the connection returns. A group answer is group evidence, never one pupil's mastery."
          : "Use the shared-device class code and PIN so each answer is recorded against the pupil who entered it; a group answer is still group evidence.",
    };
  } else if (printer) {
    evidence = {
      route: "printed-answers",
      sentence: "Print the worksheet and collect the written work. Marking the books is the evidence; nothing is recorded on a screen.",
    };
  } else {
    evidence = {
      route: "teacher-observation",
      sentence: "No printer and no pupil device: evidence is the teacher's own observation and the exercise books. A sampled oral answer is feedback, not a mastery record.",
    };
  }

  const constraints: string[] = [];
  if (devices === "none" || devices === "teacher-only" || devices === undefined) {
    constraints.push("No pupil device and no pupil account are assumed.");
  }
  if (internet === "none") {
    constraints.push("Nothing in this lesson needs the internet while it runs. Download or print the pack before the lesson.");
  } else if (internet === "intermittent") {
    constraints.push("The connection may drop: answers recorded offline sync when it returns, and the lesson never waits for a page to load.");
  }
  if (internet === undefined) constraints.push("Connectivity was not declared, so this plan does not depend on it during the lesson.");
  if (!printer) constraints.push("No printer is declared, so this plan works from the board and exercise books.");
  if (!electricity) constraints.push("No electricity is assumed: no projector, and no device that has to be charged during the lesson.");
  if (size !== undefined && size >= 40) {
    constraints.push(`With ${size} pupils, checks are oral or sampled — no teacher reads ${size} written answers in one lesson.`);
  }
  if (profile.mixedAge) {
    constraints.push("More than one year group: one prompt, different expectations. Give each group the same question at its own depth rather than three unrelated tasks.");
  }
  if (profile.customCurriculum) {
    constraints.push("Curriculum named by the teacher, not held in the registry: objectives come from the teacher's own statement and are not claimed as a national mapping.");
  }

  return {
    delivery,
    contextId,
    adaptations,
    pupilDevices,
    accounts: delivery === "individual",
    printer,
    projector,
    offline: internet === "none" || power === "none",
    groupSize,
    evidence,
    languageSupport: languageSupport(profile.languages),
    constraints: [...constraints, ...accessLines(profile.access)],
    assumed,
    unknowns: classroomGaps(profile),
  };
}

/** One line for a class card. Only declared facts: an unrecorded classroom
 *  prints nothing rather than a default that reads like a measurement. */
export function describeClassroom(profile: ClassroomProfile | undefined): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.classSize !== undefined) parts.push(`${profile.classSize} pupils`);
  if (profile.devices !== undefined) {
    parts.push(
      profile.devices === "none"
        ? "no pupil devices"
        : profile.devices === "teacher-only"
          ? "teacher device only"
          : profile.devices === "shared"
            ? "shared devices"
            : "a device each",
    );
  }
  if (profile.internet !== undefined) {
    parts.push(profile.internet === "none" ? "no internet" : profile.internet === "intermittent" ? "intermittent internet" : "reliable internet");
  }
  if (profile.languages.length > 1) parts.push(`${profile.languages.length} classroom languages`);
  return parts.join(" · ");
}

const LANG_CODE = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/;

function strings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= 40).map((v) => v.trim());
}

/**
 * VALIDATE WHAT THE SERVER WAS TOLD, and never invent the rest.
 *
 * A value outside a closed list is DROPPED, not coerced to the first option: a
 * teacher who sends "sometimes" for connectivity has not told us whether the
 * internet works, and storing "reliable" would be a fact nobody declared.
 */
export function normalizeClassroom(raw: unknown): ClassroomProfile {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const languages: string[] = [];
  for (const code of strings(src.languages)) {
    const clean = code.trim();
    if (LANG_CODE.test(clean) && !languages.includes(clean)) languages.push(clean);
    if (languages.length === 6) break;
  }
  const materials = strings(src.materials).filter((m): m is MaterialId => has(MATERIALS, m));
  const access = strings(src.access).filter((a): a is AccessNeed => has(ACCESS_NEEDS, a));
  const size = typeof src.classSize === "number" && Number.isFinite(src.classSize)
    ? Math.max(1, Math.min(500, Math.round(src.classSize)))
    : undefined;
  const text = (value: unknown, max: number): string | undefined =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

  const profile: ClassroomProfile = {
    version: CLASSROOM_PROFILE_VERSION,
    languages,
    materials: [...new Set(materials)],
    access: [...new Set(access)],
  };
  const country = text(src.country, 2)?.toUpperCase();
  if (country && /^[A-Z]{2}$/.test(country)) profile.country = country;
  const region = text(src.region, 60);
  if (region) profile.region = region;
  if (has(SCHOOL_TYPES, src.schoolType as string)) profile.schoolType = src.schoolType as SchoolType;
  const stage = text(src.stage, 40);
  if (stage) profile.stage = stage;
  if (size !== undefined) profile.classSize = size;
  if (src.mixedAge === true) profile.mixedAge = true;
  if (has(DEVICE_MODES, src.devices as string)) profile.devices = src.devices as DeviceMode;
  if (has(CONNECTIVITY, src.internet as string)) profile.internet = src.internet as Connectivity;
  if (has(CONNECTIVITY, src.power as string)) profile.power = src.power as Connectivity;
  const custom = text(src.customCurriculum, 120);
  if (custom) profile.customCurriculum = custom;
  return profile;
}

/** True when the record holds something a teacher declared. Used to decide
 *  whether a class carries a classroom at all, so an empty normalisation is not
 *  stored as if it were an answer. */
export function classroomDeclared(profile: ClassroomProfile): boolean {
  return (
    profile.classSize !== undefined ||
    profile.devices !== undefined ||
    profile.internet !== undefined ||
    profile.power !== undefined ||
    profile.languages.length > 0 ||
    profile.materials.length > 0 ||
    profile.access.length > 0 ||
    profile.mixedAge === true ||
    Boolean(profile.country || profile.region || profile.stage || profile.schoolType || profile.customCurriculum)
  );
}
