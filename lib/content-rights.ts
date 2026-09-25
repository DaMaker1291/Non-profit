// ─────────────────────────────────────────────────────────────────────────────
// WHAT OPENMIND MAY DO WITH CONTENT IT CAN SEE.
//
// The rights model as CODE rather than as good intentions. Seeing a thing is
// not permission to do anything with it, so every piece of content carries an
// ORIGIN, and the origin decides which operations are permitted:
//
//   openmind_authored  — written by this project to a qualification's own
//                        format. Ours to host, display, process, store.
//   licensed_official  — a board's own material, permitted only as far as a
//                        LICENCE RECORD says. With no record on file NOTHING is
//                        permitted: not hosting, not display, not processing,
//                        not training. The default is denial, and an unstated
//                        permission in a record is a denial too.
//   user_provided      — a learner's own paper. Processed and stored for THAT
//                        learner: never hosted as public content, never shared,
//                        never used to train anything. This is why the
//                        personal-paper route accepts MARKS AND CONCEPT TAGS
//                        ONLY and rejects question text outright — the safest
//                        handling of a copyrighted document is never to receive
//                        it. Uploading does not grant a redistribution licence,
//                        so the product must not behave as though it does.
//   external_link      — lives on the publisher's own site. We may LINK to a
//                        page the publisher publishes; not embed it, not mirror
//                        it, not store it, not process it.
//
// `mayUse` is the single gate. A surface asks before it renders, and
// `originLabelKey`/`originNoteKey` give it the words to tell the learner where
// something came from and what OpenMind is allowed to do with it — which is
// also the honest answer to "why can I see this here and not there?".
//
// ── WHAT IS ACTUALLY LICENSED HERE, STATED PLAINLY ──────────────────────────
// `LICENCES` is empty, because no board has licensed anything to this project.
// Consequently no licensed material is hosted or displayed anywhere, and the
// harness asserts it: a paper claiming an official origin with no licence on
// file must be REFUSED rather than rendered. The type, the records and the gate
// exist so that the day a partnership happens, the change is a data entry.
// ─────────────────────────────────────────────────────────────────────────────

import type { BoardId } from "./types";

export type ContentOrigin =
  | "openmind_authored"
  | "licensed_official"
  | "user_provided"
  | "external_link";

/** Runtime list — the one place a caller validates an untrusted origin string. */
export const CONTENT_ORIGINS: ContentOrigin[] = [
  "openmind_authored", "licensed_official", "user_provided", "external_link",
];

export function isContentOrigin(v: unknown): v is ContentOrigin {
  return typeof v === "string" && (CONTENT_ORIGINS as string[]).includes(v);
}

export type ContentAction = "host" | "display" | "process" | "store" | "link" | "trainAI" | "share";

export const CONTENT_ACTIONS: ContentAction[] = ["host", "display", "process", "store", "link", "trainAI", "share"];

export interface ContentRights {
  canHost: boolean;
  canDisplay: boolean;
  canProcess: boolean;
  canStore: boolean;
  canLink: boolean;
  canTrainAI: boolean;
  canShare: boolean;
}

const DENY_ALL: ContentRights = {
  canHost: false, canDisplay: false, canProcess: false, canStore: false,
  canLink: false, canTrainAI: false, canShare: false,
};

/** Rights that need no licence: our own work, and the learner's own work. */
const STANDING_RIGHTS: Record<Exclude<ContentOrigin, "licensed_official">, ContentRights> = {
  openmind_authored: {
    canHost: true, canDisplay: true, canProcess: true, canStore: true,
    canLink: true, canTrainAI: true, canShare: true,
  },
  user_provided: {
    // Private to one learner: shown to them, kept for them, and nothing else.
    canHost: false, canDisplay: true, canProcess: true, canStore: true,
    canLink: false, canTrainAI: false, canShare: false,
  },
  external_link: {
    // A link is the whole permission. No embed, no mirror, no copy.
    canHost: false, canDisplay: false, canProcess: false, canStore: false,
    canLink: true, canTrainAI: false, canShare: false,
  },
};

/** A licence record is the ONLY thing that can open a licensed origin. */
export interface LicenceRecord {
  id: string;
  /** The qualification the licence covers. */
  specId: string;
  board: BoardId;
  /** Only the permissions the agreement actually grants. Anything absent is
   *  denied — `rightsFor` fills from DENY_ALL, never from a permissive default. */
  rights: Partial<ContentRights>;
  note?: string;
  /** YYYY-MM-DD. An expired licence grants nothing. */
  expires?: string;
}

/** Empty, and honestly so: nothing on file. */
export const LICENCES: LicenceRecord[] = [];

/** The rights a licence actually grants: everything unstated is denied. */
export function licenceRights(licence: LicenceRecord): ContentRights {
  return {
    canHost: licence.rights.canHost === true,
    canDisplay: licence.rights.canDisplay === true,
    canProcess: licence.rights.canProcess === true,
    canStore: licence.rights.canStore === true,
    canLink: licence.rights.canLink === true,
    canTrainAI: licence.rights.canTrainAI === true,
    canShare: licence.rights.canShare === true,
  };
}

function expired(licence: LicenceRecord, now: number): boolean {
  if (!licence.expires) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(licence.expires);
  if (!m) return false; // an unparseable date is not evidence of expiry
  return Date.UTC(+m[1], +m[2] - 1, +m[3]) + 86400000 <= now;
}

/** The licence in force for a qualification, or null. Expired records are not
 *  in force — a licence that has run out grants nothing. */
export function licenceFor(specId: string, now: number = Date.now()): LicenceRecord | null {
  return LICENCES.find((l) => l.specId === specId && !expired(l, now)) ?? null;
}

/** The permissions attached to an origin. Licensed material with no record is
 *  DENIED — the safe direction, and the only defensible default. */
export function rightsFor(origin: ContentOrigin, licence?: LicenceRecord | null): ContentRights {
  if (origin === "licensed_official") {
    return licence ? licenceRights(licence) : DENY_ALL;
  }
  // Total, deliberately: an origin nobody defined (a JS caller, a stored record
  // written by an older version) is granted NOTHING rather than crashing a
  // request or, worse, inheriting someone else's permissions.
  return STANDING_RIGHTS[origin as Exclude<ContentOrigin, "licensed_official">] ?? DENY_ALL;
}

function fieldFor(action: ContentAction): keyof ContentRights {
  switch (action) {
    case "host": return "canHost";
    case "display": return "canDisplay";
    case "process": return "canProcess";
    case "store": return "canStore";
    case "link": return "canLink";
    case "trainAI": return "canTrainAI";
    case "share": return "canShare";
  }
}

export function mayUse(origin: ContentOrigin, action: ContentAction, licence?: LicenceRecord | null): boolean {
  return rightsFor(origin, licence)[fieldFor(action)];
}

export class ContentRightsError extends Error {
  constructor(public origin: ContentOrigin, public action: ContentAction) {
    super(`content-rights: ${origin} may not ${action}`);
    this.name = "ContentRightsError";
  }
}

/** The gate. Callers that would otherwise render or store something must pass
 *  through here first — an exception is the point, because silently rendering
 *  nothing is how a permission bug becomes invisible. */
export function assertUse(origin: ContentOrigin, action: ContentAction, licence?: LicenceRecord | null): void {
  if (!mayUse(origin, action, licence)) throw new ContentRightsError(origin, action);
}

// ── How a surface talks about provenance ────────────────────────────────────

export function originLabelKey(origin: ContentOrigin): string {
  return `rights.origin.${origin}`;
}

export function originNoteKey(origin: ContentOrigin): string {
  return `rights.note.${origin}`;
}

/** The actions an origin permits, in the fixed order of CONTENT_ACTIONS — so a
 *  surface can show a learner the actual permissions instead of a bare claim
 *  like "we respect copyright". */
export function permittedActions(origin: ContentOrigin, licence?: LicenceRecord | null): ContentAction[] {
  return CONTENT_ACTIONS.filter((a) => mayUse(origin, a, licence));
}
