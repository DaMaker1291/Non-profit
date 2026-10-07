// ─────────────────────────────────────────────────────────────────────────────
// WHO THIS DEVICE IS, AND WHAT IT MAY READ.
//
// One module owns two values in localStorage — the learner profile id and that
// profile's capability secret — and nothing else. It is deliberately free of
// React and free of the network, so the transport (lib/api/transport.ts) can
// present a capability without importing a component tree, and the static build
// can read the same storage without a hook.
//
// ONE RULE FOR ANNOUNCING. There used to be three: a write of the id announced
// a change, a write of the secret announced a change, and the session probe's
// own writes announced nothing (deliberately, or the provider would re-probe
// itself forever). Which rule applied was a property of WHICH FUNCTION you
// called, so "does this update the app?" was answered differently in three
// places. Here it is a property of the fact: a write that CHANGES the stored
// value announces, and a write that changes nothing does not. The probe is then
// safe by construction — it writes the value it just read, so it cannot
// announce, and a genuine token change announces exactly once.
//
// `lib/client.tsx` subscribes once and re-dispatches to React; it no longer
// needs to know when identity is written.
// ─────────────────────────────────────────────────────────────────────────────

export const PROFILE_ID_KEY = "openmind:profileId";
export const PROFILE_SECRET_KEY = "openmind:profileSecret";

/** localStorage, or null when there is no window (server render, tests) or when
 *  storage is blocked (private mode). Every accessor below tolerates both. */
function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Called whenever the learner this device names actually changes.
 *
 * The subscription is registered by the shell, not read from the environment:
 * this module is imported by transport code that has no window and by tests
 * that have no React, so the notification has to be something a caller opts
 * into.
 */
export function onIdentityChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function announce(): void {
  for (const fn of [...listeners]) {
    try {
      fn();
    } catch {
      // One broken listener must not stop the others, and must not turn an
      // identity write into a thrown error the caller has to handle.
    }
  }
}

function setIfChanged(key: string, value: string | null): void {
  const store = storage();
  if (!store) return;
  const before = store.getItem(key);
  if (before === value) return; // no change, no announcement — see the header
  if (value === null) store.removeItem(key);
  else store.setItem(key, value);
  announce();
}

export function loadProfileId(): string | null {
  return storage()?.getItem(PROFILE_ID_KEY) ?? null;
}

export function writeProfileId(id: string): void {
  setIfChanged(PROFILE_ID_KEY, id);
}

/** The secret this device holds, or null. Never mints — a read must be able to
 *  ask "do I have a token?" without creating one. */
export function loadSecret(): string | null {
  return storage()?.getItem(PROFILE_SECRET_KEY) ?? null;
}

export function writeSecret(secret: string): void {
  setIfChanged(PROFILE_SECRET_KEY, secret);
}

/** A capability secret the server will accept: 32 hex characters, inside the
 *  16..128 range every door validates. */
export function mintSecret(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid.replace(/-/g, "");
  // No WebCrypto (an old browser, a Node test harness): still unpredictable
  // enough for a bearer token that only ever guards its own learner, and never
  // the same twice.
  const part = () => Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}${part()}${part()}${part()}`.slice(0, 32);
}

/** Load-or-mint. The secret is the credential for every learner-scoped route, so
 *  a device that has none gets one now rather than sending an empty token and
 *  being told it is not allowed to read its own work. */
export function ensureSecret(): string {
  const existing = loadSecret();
  if (existing) return existing;
  const secret = mintSecret();
  writeSecret(secret);
  return secret;
}

/** Forget this device's learner entirely. Used when the server confirms the
 *  profile is gone (404) — keeping the ghost would make every page insist on a
 *  learner that no longer exists. */
export function clearIdentity(): void {
  const store = storage();
  if (!store) return;
  const had = store.getItem(PROFILE_ID_KEY) !== null || store.getItem(PROFILE_SECRET_KEY) !== null;
  store.removeItem(PROFILE_ID_KEY);
  store.removeItem(PROFILE_SECRET_KEY);
  if (had) announce();
}
