// ─────────────────────────────────────────────────────────────────────────────
// SEVERAL LEARNERS, ONE DEVICE.
//
// THE PROBLEM THIS EXISTS FOR. The app has always held ONE learner per browser:
// a profile id and its capability secret in localStorage. That is the right
// model for a personal phone and the wrong one for the deployment this project
// says it is for — a classroom where forty children share three handsets, or a
// household where two siblings share one. On such a device the second child
// either overwrites the first child's identity (and then cannot get back to
// their own record) or has to sign out and retype a secret nobody has written
// down. Measured on this checkout: no profile switcher existed anywhere.
//
// WHAT THIS IS NOT. It does not merge records, share a secret between learners,
// or let one learner read another's work. Each entry is that learner's OWN
// capability — the same token their personal phone would hold — and switching
// is simply "this device now speaks for that learner". The server still checks
// the secret on every call, so holding a roster entry is exactly as powerful as
// holding a phone, which is the trust boundary a shared device already has.
//
// WHY IT IS A SEPARATE, PURE MODULE. `lib/api/identity.ts` owns the two storage
// keys and the announce rule; this file owns only "which learners this device
// has met and in what order", over an injected key-value store. That keeps the
// ordering, dedupe and cap testable in `npm run verify` with a Map, with no
// window and no React — the same reason the transport is separate from the UI.
//
// THE CAP IS DELIBERATE. A roster that grows without limit eventually exposes
// every learner who ever used the device to the next person who opens the
// account screen, which is a safeguarding problem rather than a storage one.
// Eight is enough for a study group and small enough to read on one screen.
// ─────────────────────────────────────────────────────────────────────────────

/** The slice of `Storage` this module needs, so a test can pass a Map-backed
 *  double and the browser passes `window.localStorage`. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const ROSTER_KEY = "openmind:learners";
export const ROSTER_LIMIT = 8;
/** A name is a LABEL for a shared screen, not an identity: the record's own
 *  handle is authoritative, and this is only what fits on a button. */
export const NAME_LIMIT = 24;

export interface RosterLearner {
  id: string;
  secret: string;
  name: string;
  /** When this learner last used the device. Only used for ordering; the
   *  server never sees it. */
  lastUsedAt: number;
}

/** The name shown on a switch button. Falls back to a neutral label rather than
 *  an empty button, which is unusable — and never to the id, which is a
 *  credential-adjacent string nobody should be reading off a screen. */
export function displayName(entry: { name?: string }): string {
  const name = (entry.name ?? "").trim();
  return name ? name.slice(0, NAME_LIMIT) : "";
}

function normalise(raw: unknown): RosterLearner | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id.trim() : "";
  const secret = typeof r.secret === "string" ? r.secret.trim() : "";
  if (!id || !secret) return null;
  const name = typeof r.name === "string" ? displayName({ name: r.name }) : "";
  const lastUsedAt = typeof r.lastUsedAt === "number" && Number.isFinite(r.lastUsedAt) ? r.lastUsedAt : 0;
  return { id, secret, name, lastUsedAt };
}

/** Tolerant by construction: a roster written by an older build, or by hand, or
 *  half-written by a browser that closed mid-write, must not throw on every page
 *  load. Unreadable content reads as "no other learners", never as an error the
 *  account screen has to render. */
export function readRoster(store: KeyValueStore | null): RosterLearner[] {
  if (!store) return [];
  let parsed: unknown;
  try {
    const raw = store.getItem(ROSTER_KEY);
    if (!raw) return [];
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const out: RosterLearner[] = [];
  for (const item of parsed) {
    const entry = normalise(item);
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push(entry);
    if (out.length >= ROSTER_LIMIT) break;
  }
  return out;
}

function writeRoster(store: KeyValueStore | null, list: readonly RosterLearner[]): void {
  if (!store) return;
  try {
    store.setItem(ROSTER_KEY, JSON.stringify(list.slice(0, ROSTER_LIMIT)));
  } catch {
    // Private mode or a full quota: the learner this device is currently
    // speaking for is unaffected, so a roster write failure must not surface as
    // an error on a screen whose real job is showing their record.
  }
}

/** Add or refresh one learner, most-recent first, capped. The learner being
 *  remembered is NEVER the one dropped when the cap is reached — evicting the
 *  entry just created would leave the screen claiming a switch it cannot make. */
export function rememberLearner(
  store: KeyValueStore | null,
  entry: { id: string; secret: string; name?: string; at?: number },
): RosterLearner[] {
  const clean = normalise({ ...entry, lastUsedAt: entry.at ?? Date.now() });
  if (!clean) return readRoster(store);
  const rest = readRoster(store).filter((r) => r.id !== clean.id);
  const next = [clean, ...rest].slice(0, ROSTER_LIMIT);
  writeRoster(store, next);
  return next;
}

/** Drop one learner. Removing the CURRENT one is the caller's problem (it must
 *  clear the identity too) — this function only edits the list, so it cannot
 *  half-forget somebody. */
export function forgetLearner(store: KeyValueStore | null, id: string): RosterLearner[] {
  const next = readRoster(store).filter((r) => r.id !== id);
  writeRoster(store, next);
  return next;
}

export function findLearner(store: KeyValueStore | null, id: string): RosterLearner | null {
  return readRoster(store).find((r) => r.id === id) ?? null;
}

/** Touch the entry a switch just used, so "most recent" keeps meaning it. */
export function touchLearner(store: KeyValueStore | null, id: string, at = Date.now()): RosterLearner[] {
  const list = readRoster(store);
  const entry = list.find((r) => r.id === id);
  if (!entry) return list;
  return rememberLearner(store, { ...entry, at });
}
