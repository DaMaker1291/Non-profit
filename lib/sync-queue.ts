// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE ANSWERS: held on the device, replayed through the ONLINE answer route
// when the connection comes back.
//
// A learner who loses signal mid-session must not lose the work, and must not be
// graded twice for it. Four rules live here, and each one is asserted in
// scripts/verify-engines.mjs:
//
//   * NOTHING SILENTLY DISAPPEARS. An answer the server cannot take is held in
//     localStorage, and a refusal that retrying cannot fix is recorded as a
//     refusal rather than dropped.
//   * NOTHING COUNTS TWICE. Every held answer names its own submission
//     (`submissionId`). The server derives the ledger event's id from that
//     token, so a replay — after a dropped response, a double flush, two tabs —
//     is the SAME event and the ledger records it once.
//   * THE ORDER IS THE LEARNER'S. Held answers flush oldest-first, and a
//     retryable failure STOPS the flush: nothing may overtake an older answer,
//     because the server stamps each replay with its own arrival time and that
//     stamp is the learner's timeline.
//   * THE DEVICE'S CLOCK IS A CLAIM, NOT A FACT. `deviceAt` says when the
//     learner says they answered. It travels with the answer and is recorded on
//     the event, disclosed as the device's own claim — but the server stamps
//     the event with ITS clock and schedules from that, so a backdated device
//     can never manufacture retention, due dates or ordering.
//
// The only dependency is `fetch` and localStorage; both are read at call time,
// so the module is testable in Node with a fake window.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "openmind:sync-queue";
const REFUSED_KEY = "openmind:sync-refused";

/** How many answers one device may hold. Reaching it REFUSES the new answer
 *  (visibly) instead of evicting an older one: dropping a learner's work to make
 *  room for newer work is the one thing a queue must never do. */
const MAX_HELD = 200;
/** How many refusals are kept for disclosure, newest last. */
const MAX_REFUSED = 20;

export interface QueuedAnswer {
  /** The route the answer belonged to. Stored rather than assumed, so replay
   *  goes back through the same door the online path used. */
  url: string;
  /** Client-minted token naming THIS submission — not the question. Two genuine
   *  attempts at one question are two submissions and stay two ledger events;
   *  the same submission replayed is one. The server derives the event id from
   *  it (lib/evidence.ts#submissionEventId), which is what makes replay safe. */
  submissionId: string;
  /** The device's own claim about when the learner answered. Recorded on the
   *  event and disclosed; never trusted by the server for memory evidence,
   *  scheduling or ordering. */
  deviceAt: number;
  /** The exact body the online path would have sent, so a replay is graded by
   *  the same route with the same meaning. */
  body: Record<string, unknown>;
  /** The device's own answer order. Flushing follows it, so a replay can never
   *  overtake an answer the learner gave earlier. */
  seq: number;
  /** Retryable failures so far — kept so a device that cannot reach the server
   *  is visible rather than merely quiet. */
  tries: number;
  queuedAt: number;
}

export interface RefusedAnswer {
  submissionId: string;
  reason: "full" | "rejected";
  status: number | null;
  at: number;
}

export interface QueueSummary {
  /** Answers the server has not accepted yet. */
  pending: number;
  /** Answers the server refused in a way retrying cannot fix. */
  refused: number;
  /** When the oldest held answer was taken, or null when nothing is held. */
  oldest: number | null;
}

// ── Storage: defensive. Corrupt JSON must never brick a lesson. ─────────────

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null; // private mode / disabled storage
  }
}

function readJson<T>(key: string): T[] {
  const s = store();
  if (!s) return [];
  try {
    const raw = s.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full — the caller still has the answer in memory for this turn */
  }
}

/** Held answers, in the order the learner answered them. Malformed rows are
 *  skipped rather than thrown on: one bad row must not hide the others. */
export function readQueue(): QueuedAnswer[] {
  const rows = readJson<QueuedAnswer>(KEY).filter(
    (r) =>
      r && typeof r.submissionId === "string" && r.submissionId.length > 0 &&
      typeof r.url === "string" && r.url.length > 0 &&
      typeof r.seq === "number" && Number.isFinite(r.seq) &&
      r.body !== null && typeof r.body === "object",
  );
  for (const r of rows) {
    if (typeof r.deviceAt !== "number" || !Number.isFinite(r.deviceAt)) r.deviceAt = r.queuedAt ?? 0;
    if (typeof r.tries !== "number" || !Number.isFinite(r.tries)) r.tries = 0;
    if (typeof r.queuedAt !== "number" || !Number.isFinite(r.queuedAt)) r.queuedAt = r.deviceAt;
  }
  return rows.sort((a, b) => a.seq - b.seq);
}

export function refusedAnswers(): RefusedAnswer[] {
  return readJson<RefusedAnswer>(REFUSED_KEY);
}

export function queueSummary(): QueueSummary {
  const held = readQueue();
  return {
    pending: held.length,
    refused: refusedAnswers().length,
    oldest: held.length ? held[0].queuedAt : null,
  };
}

export function queueLength(): number {
  return readQueue().length;
}

/** A token that names one submission of one answer. Random, not derived from
 *  the content: two genuine attempts at the same question must not collide. */
export function newSubmissionId(): string {
  const rnd =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "") ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  return `sub_${rnd.replace(/[^A-Za-z0-9_-]/g, "")}`;
}

function refuse(entry: RefusedAnswer): void {
  const list = refusedAnswers();
  list.push(entry);
  writeJson(REFUSED_KEY, list.slice(-MAX_REFUSED));
}

/**
 * Hold one answer for replay. Idempotent in `submissionId`: holding the same
 * submission twice — a retry racing a flush, a double-click, two tabs — leaves
 * ONE entry, because the second copy would only ever be a duplicate event.
 * Returns what happened, so a surface can tell the learner the truth.
 */
export function enqueueAnswer(op: {
  submissionId: string;
  url: string;
  body: Record<string, unknown>;
  deviceAt?: number;
  queuedAt?: number;
}): { accepted: boolean; reason?: "duplicate" | "full"; pending: number } {
  const list = readQueue();
  if (list.some((r) => r.submissionId === op.submissionId)) {
    return { accepted: false, reason: "duplicate", pending: list.length };
  }
  if (list.length >= MAX_HELD) {
    // Refuse the NEW answer, never evict an older one: the older answer is work
    // the learner already did, and it is not this module's to throw away.
    refuse({ submissionId: op.submissionId, reason: "full", status: null, at: Date.now() });
    return { accepted: false, reason: "full", pending: list.length };
  }
  const queuedAt = op.queuedAt ?? Date.now();
  const seq = list.reduce((n, r) => Math.max(n, r.seq), 0) + 1;
  const deviceAt = typeof op.deviceAt === "number" && Number.isFinite(op.deviceAt) ? op.deviceAt : queuedAt;
  list.push({
    url: op.url,
    submissionId: op.submissionId,
    deviceAt,
    // The held body is the body that will be REPLAYED, so the token and the
    // claim are written INTO it here rather than kept beside it. A held answer
    // whose body lacks its submission id would replay as a fresh answer every
    // time — the exact double-count this module exists to prevent.
    body: { ...op.body, submissionId: op.submissionId, deviceAt },
    seq,
    tries: 0,
    queuedAt,
  });
  writeJson(KEY, list);
  return { accepted: true, pending: list.length };
}

export interface AnswerRequest {
  submissionId: string;
  body: Record<string, unknown>;
  /** The device's claim about when the learner answered. */
  deviceAt?: number;
}

export type PostOutcome =
  | { kind: "sent"; res: Response }
  | { kind: "held"; pending: number }
  | { kind: "refused"; status: number; res: Response };

/** A status a LATER attempt could still succeed on: the network, the server, or
 *  a capability that can be re-established. Everything else is a refusal the
 *  server would repeat, and holding it forever would be a lie about a queue
 *  that is draining. */
export function isRetryable(status: number): boolean {
  return status >= 500 || status === 408 || status === 425 || status === 429 || status === 401 || status === 403;
}

/**
 * POST one answer through the ONLINE route. On a connection failure, or on a
 * server failure a later attempt can fix, the answer is HELD instead of lost —
 * the same body, the same route, the same server-decided meaning. A refusal the
 * server would repeat is returned to the caller AND recorded, so nothing is
 * dropped in silence.
 */
export async function postAnswer(url: string, req: AnswerRequest): Promise<PostOutcome> {
  const deviceAt = typeof req.deviceAt === "number" && Number.isFinite(req.deviceAt) ? req.deviceAt : Date.now();
  const body = { ...req.body, submissionId: req.submissionId, deviceAt };
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    enqueueAnswer({ url, submissionId: req.submissionId, body, deviceAt });
    return { kind: "held", pending: queueLength() };
  }
  if (!res.ok && isRetryable(res.status)) {
    enqueueAnswer({ url, submissionId: req.submissionId, body, deviceAt });
    return { kind: "held", pending: queueLength() };
  }
  if (!res.ok) {
    refuse({ submissionId: req.submissionId, reason: "rejected", status: res.status, at: Date.now() });
    return { kind: "refused", status: res.status, res };
  }
  return { kind: "sent", res };
}

let flushing: Promise<FlushResult> | null = null;

export interface FlushResult {
  /** Answers the server accepted (or recognised as already recorded) now. */
  synced: number;
  /** Still waiting. */
  pending: number;
  /** Refused by the server in a way retrying cannot fix. */
  refused: number;
}

/**
 * Drain the queue, oldest first. Single-flight: two callers (a reconnect event
 * and a page mount) share one flush rather than racing two copies of the same
 * answer — and the server would dedupe them anyway, which is the second line of
 * defence, not the first.
 */
export function flushQueue(): Promise<FlushResult> {
  flushing ??= runFlush().finally(() => {
    flushing = null;
  });
  return flushing;
}

async function runFlush(): Promise<FlushResult> {
  const list = readQueue();
  if (!list.length) return { synced: 0, pending: 0, refused: refusedAnswers().length };
  let synced = 0;
  const stillHeld: QueuedAnswer[] = [];
  let stopped = false;
  for (const op of list) {
    if (stopped) {
      stillHeld.push(op);
      continue;
    }
    let res: Response;
    try {
      res = await fetch(op.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(op.body),
      });
    } catch {
      // Still unreachable. Keep this answer AND everything after it: recording a
      // later answer first would put it earlier in the learner's timeline than
      // the answer they actually gave before it.
      stillHeld.push({ ...op, tries: op.tries + 1 });
      stopped = true;
      continue;
    }
    if (res.ok) {
      synced += 1;
      continue;
    }
    if (isRetryable(res.status)) {
      stillHeld.push({ ...op, tries: op.tries + 1 });
      stopped = true;
      continue;
    }
    // The server will keep saying no (a question that is no longer staged, a
    // malformed body). Record the refusal and move on rather than blocking the
    // queue behind something that can never succeed.
    refuse({ submissionId: op.submissionId, reason: "rejected", status: res.status, at: Date.now() });
  }
  writeJson(KEY, stillHeld);
  return { synced, pending: stillHeld.length, refused: refusedAnswers().length };
}

/** Forget the refusal record once it has been shown. Held answers are NOT
 *  cleared here: only the server may retire those, by accepting them. */
export function clearRefused(): void {
  writeJson(REFUSED_KEY, []);
}

/** Test/teardown seam: drop everything this device is holding. */
export function clearQueue(): void {
  writeJson(KEY, []);
  writeJson(REFUSED_KEY, []);
}
