// ─────────────────────────────────────────────────────────────────────────────
// THE DEVICE'S MEMORY OF "A LESSON IS RUNNING HERE", AND WHY IT IS A MARKER.
//
// A classroom handset needs one control on EVERY page: "finish and hand back".
// If it lived only on the kiosk screen, a learner who walked to a lesson and then
// a dashboard would have no way out — and a hand-back nobody can find is a
// hand-back that does not happen, which is how the next learner inherits screen
// one's session. So the marker is what the shell reads to render that control.
//
// WHAT THIS IS NOT: a credential. The token lives in the same two identity keys
// every route reads (`openmind:profileId` / `openmind:profileSecret`); this record
// holds only what a page needs to SAY — the class, the handle, and when the
// server will stop accepting the token. A forged marker buys a screen; it cannot
// buy a session, because the server decides that (`kiosk-sessions.json`).
//
// IT IS ALSO NOT THE ROSTER. `lib/device-roster.ts` remembers a learner's
// PERMANENT capability for household switching; a classroom session is the
// opposite kind of thing (short-lived, revocable, issued for one lesson), so it is
// remembered nowhere. `clearIdentity` removes this marker for that reason: a
// device that has forgotten its learner must not still claim a class.
// ─────────────────────────────────────────────────────────────────────────────

export const KIOSK_KEY = "openmind:kioskSession";

/** The event the shell listens for. `lib/api/identity.ts` announces identity
 *  changes through an in-module subscription (transport code has no window), so
 *  this module needs its own — and it must be a DOM event, because the only
 *  listener is a component that mounted before the marker existed. */
export const KIOSK_EVENT = "openmind:kiosk";

function announce(): void {
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(KIOSK_EVENT));
  } catch {
    // A listener that throws is not a reason to fail a sign-in.
  }
}

export interface KioskMarker {
  classId: string;
  className: string;
  handle: string;
  /** When the SERVER will refuse the token. Local only, for what the screen says. */
  expiresAt: number;
}

function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The active classroom lesson, or null. A malformed record reads as null rather
 *  than throwing: a half-written entry must not break the shell of every page. */
export function readKioskSession(): KioskMarker | null {
  const s = store();
  if (!s) return null;
  const raw = s.getItem(KIOSK_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<KioskMarker>;
    if (
      typeof v.classId !== "string" || !v.classId ||
      typeof v.className !== "string" ||
      typeof v.handle !== "string" ||
      typeof v.expiresAt !== "number"
    ) {
      return null;
    }
    return { classId: v.classId, className: v.className, handle: v.handle, expiresAt: v.expiresAt };
  } catch {
    return null;
  }
}

export function markKioskSession(marker: KioskMarker): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(KIOSK_KEY, JSON.stringify(marker));
  } catch {
    // A full or disabled storage must not turn a successful sign-in into a
    // failed one. The lesson still works; only the hand-back control is missing,
    // and `/kiosk` still offers it.
  }
  announce();
}

export function clearKioskSession(): void {
  const s = store();
  if (!s) return;
  try {
    s.removeItem(KIOSK_KEY);
  } catch {
    // Nothing to do: a marker that cannot be removed is removed by the next
    // successful hand-back or by the identity being cleared.
  }
  announce();
}
