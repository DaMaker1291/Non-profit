// ─────────────────────────────────────────────────────────────────────────────
// THE ONE PLACE A CLIENT REACHES THE NETWORK.
//
// Before this module existed, ~50 call sites across app/, components/ and lib/
// each spelled out their own `fetch`, their own query string, their own
// `if (!res.ok)`, their own JSON parse and their own decision about whether the
// capability secret belonged in the URL or in the body. That is three products
// wearing one name: the React page, the static page and the tests all had a
// private opinion about how a learner's work is read and written.
//
// So the network is here, once, behind `send()`. Everything above it — the
// pages, the components, the static build — asks for an OPERATION
// (lib/api/client.ts) and never for a URL.
//
// Two rules are enforced here rather than at each call site:
//
//   1. A LEARNER DOOR ALWAYS PRESENTS THE CAPABILITY. The table below is the
//      only place that knows how a capability travels (query for a read, body
//      for a write), so a new page physically cannot forget the token — and a
//      page that 401s can no longer paint an empty state as if the learner had
//      done nothing.
//
//   2. THE SENDER IS SWAPPABLE. `setApiSender` replaces HTTP with anything that
//      answers the same shape. That is the seam a server-less build (the static
//      export, an offline PWA, a test) installs: the SAME domain logic, the same
//      operations, a different wire. Nothing above this line changes.
// ─────────────────────────────────────────────────────────────────────────────

import { ensureSecret, loadSecret } from "./identity";
import { postAnswer as postAnswerThroughQueue, setAnswerWire, type PostOutcome } from "../sync-queue";

export type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

/**
 * A failed call — ONE error type, carrying the two facts a caller actually
 * needs to tell apart:
 *
 *   status      the HTTP status. `0` means we never reached the server at all,
 *               which is a different sentence from any answer the server gave;
 *   code        the server's own `error` key when it named one, else "".
 *
 * The distinction is load-bearing and used to be re-derived (badly) at every
 * call site: a 404 is a FACT about the learner ("this profile is gone"), while
 * an unreachable server is NO information about them. Collapsing the two is how
 * a dropped packet becomes "you have recorded no evidence".
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code ?? `http_${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  /** We did not reach the server. Nothing is known about the request. */
  get unreachable(): boolean {
    return this.status === 0;
  }

  /** The server answered, and the thing asked about does not exist. */
  get notFound(): boolean {
    return this.status === 404;
  }
}

/** How a request carries this device's capability, if at all. */
export type Capability =
  /** Send the device's secret, minting one when it has none. */
  | "mint"
  /** Send the secret only when this device already holds one — never mint. */
  | "device"
  /** No learner is involved (sign-in, a public read). */
  | "none";

export type Method = "GET" | "POST" | "DELETE";

export interface ResolvedRequest {
  path: string;
  method: Method;
  /** Already built, capability included. This is the whole URL. */
  url: string;
  /** The request body, capability included, or undefined for a GET. */
  body: Record<string, unknown> | undefined;
}

export interface SenderResponse {
  status: number;
  /** Parsed JSON body, or null when the response carried none. */
  json: unknown;
}

/** How a request is delivered. The default speaks HTTP; `setApiSender` swaps
 *  it, which is how the same domain logic runs with no server (and how a test
 *  can drive a page without a port). */
export type ApiSender = (req: ResolvedRequest) => Promise<SenderResponse>;

/**
 * The doors that speak about ONE learner. Every one of them is authorised by
 * the profile's capability secret, so every one of them must present it.
 *
 * The ONE exception is a read of `/api/profile`, and it is a deliberate one:
 * that door binds an unclaimed secret to a profile on first use ("first writer
 * wins"), so a stranger holding an id must be able to ASK without thereby
 * CLAIMING. A read that mints a secret would turn a lookup into a takeover. A
 * write to the same door does mint — creating a profile is exactly the moment
 * the device is supposed to take ownership.
 */
const LEARNER_DOORS = new Set([
  "next", "my-pack", "path", "classes", "assignments", "profile",
  "session", "progress", "evidence", "evidence-summary", "my-paper",
  "diagnostic", "paper", "tutor", "packs", "pack-export", "needs",
]);

function doorOf(path: string): string {
  const m = /^\/api\/([a-z-]+)/.exec(path);
  return m ? m[1] : "";
}

/** The capability policy for one request, derived from the door and the method
 *  so that no caller has to remember it. */
export function capabilityFor(path: string, method: Method): Capability {
  const door = doorOf(path);
  if (!LEARNER_DOORS.has(door)) return "none";
  if (door === "profile" && method === "GET") return "device";
  return "mint";
}

function capabilityValue(policy: Capability): string | null {
  if (policy === "none") return null;
  if (policy === "device") return loadSecret();
  return ensureSecret();
}

/** Build the URL for one request: the caller's query, plus the capability when
 *  this is a learner read. */
export function buildUrl(path: string, query: Query | undefined, policy: Capability, method: Method): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  // A write carries its capability in the BODY (that is the shape every Post
  // handler reads); a read can only carry it in the query.
  if (policy !== "none" && method !== "POST") {
    const secret = capabilityValue(policy);
    if (secret) params.set("secret", secret);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Build the request body for one request, capability included. */
export function buildBody(
  body: Record<string, unknown> | undefined,
  policy: Capability,
  method: Method,
): Record<string, unknown> | undefined {
  if (method !== "POST") return undefined;
  const base = body ?? {};
  if (policy === "none") return base;
  const secret = capabilityValue(policy);
  return secret ? { ...base, secret } : base;
}

/**
 * The default sender: HTTP, in the browser.
 *
 * A network failure is reported as status 0 rather than thrown raw, so every
 * caller above this line sees one error type and one distinction.
 */
async function httpSender(req: ResolvedRequest): Promise<SenderResponse> {
  let res: Response;
  try {
    res = await fetch(req.url, {
      method: req.method,
      headers: req.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: req.body === undefined ? undefined : JSON.stringify(req.body),
    });
  } catch {
    throw new ApiError(0, "unreachable", "the server could not be reached");
  }
  return { status: res.status, json: await readJson(res) };
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

let sender: ApiSender = httpSender;

/**
 * Deliver one request through `sender` and dress the answer as a `Response`.
 *
 * This exists for ONE caller: the offline queue (lib/sync-queue.ts), which
 * holds an answer and returns what the route said in the shape the callers of
 * `postAnswer` already read. Without it, installing a wire moved every call
 * except the answer — the one that matters most — and a server-less build would
 * fail to grade and hold the learner's work for a server that is not there.
 */
function respondThroughSender(url: string, init: { method: string; headers: Record<string, string>; body: string }): Promise<Response> {
  const path = url.split("?")[0];
  let body: Record<string, unknown> | undefined;
  try {
    body = init.body ? (JSON.parse(init.body) as Record<string, unknown>) : undefined;
  } catch {
    body = undefined;
  }
  return sender({ path, method: "POST", url, body }).then(
    (res) => new Response(JSON.stringify(res.json ?? null), { status: res.status, headers: { "Content-Type": "application/json" } }),
    // A wire that could not answer is a network failure, in the shape the queue
    // already understands: it holds the answer rather than losing it.
    () => { throw new ApiError(0, "unreachable", "the wire could not deliver the answer"); },
  );
}

/**
 * Install a different wire. The static build and the tests use this; the
 * product never calls it outside bootstrap.
 *
 * IT MOVES THE ANSWERS TOO. `setAnswerWire` is called here rather than left to
 * the caller, because two installs that can disagree is exactly how the seam
 * ended up covering every call except the one a learner's work depends on.
 */
export function setApiSender(next: ApiSender | null): void {
  sender = next ?? httpSender;
  setAnswerWire(next ? respondThroughSender : null);
}

export interface SendOptions {
  method?: Method;
  query?: Query;
  body?: Record<string, unknown>;
  /** Override the door-derived policy. Only for a request that is about a
   *  learner but does not live on a learner door. */
  capability?: Capability;
  /** Statuses that mean "the answer is no", not "the call failed". A 404 on a
   *  profile lookup is a fact; a 404 on a save is an error. */
  tolerate?: readonly number[];
}

/**
 * Send one request and return its parsed body.
 *
 * Throws `ApiError` for a status the caller did not tolerate. An empty body
 * returns `{}` so callers never have to null-check a 200.
 */
export async function send<T>(path: string, opts: SendOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const policy = opts.capability ?? capabilityFor(path, method);
  const req: ResolvedRequest = {
    path,
    method,
    url: buildUrl(path, opts.query, policy, method),
    body: buildBody(opts.body, policy, method),
  };
  const res = await sender(req);
  if (!opts.tolerate?.includes(res.status) && (res.status < 200 || res.status >= 300)) {
    throw new ApiError(res.status, errorCode(res.json), `http_${res.status}`);
  }
  return (res.json ?? {}) as T;
}

/** The server's own error key, when it named one. Every route in this app
 *  reports failures as `{ error: "some_key" }`, so that key is the honest thing
 *  to surface rather than the status. */
function errorCode(body: unknown): string {
  if (body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string") {
    return (body as { error: string }).error;
  }
  return "";
}

/**
 * A read that says WHICH of the three things happened, for callers that cannot
 * collapse them: `notFound` is a fact about the learner, `unreachable` is no
 * information at all, `ok` carries the data.
 */
export type Probe<T> =
  | { status: "ok"; data: T }
  | { status: "notFound" }
  | { status: "unreachable" }
  | { status: "refused"; code: string };

export async function probe<T>(path: string, opts: SendOptions = {}): Promise<Probe<T>> {
  try {
    return { status: "ok", data: await send<T>(path, { ...opts, tolerate: [] }) };
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.unreachable) return { status: "unreachable" };
    if (e.notFound) return { status: "notFound" };
    return { status: "refused", code: e.code || `http_${e.status}` };
  }
}

/**
 * One answer, written through the OFFLINE-SAFE path.
 *
 * An answer is the one request that must not be lost to a dropped connection,
 * so it does not go through `send`: it goes through the queue, which either
 * delivers it now or holds the exact body for replay through the same door. The
 * caller learns which, because "we will mark it when the connection returns" is
 * a different sentence from "you were wrong".
 */
export function postAnswer(path: string, body: Record<string, unknown>, submissionId: string, deviceAt: number): Promise<PostOutcome> {
  const policy = capabilityFor(path, "POST");
  const withCapability = buildBody(body, policy, "POST") ?? body;
  return postAnswerThroughQueue(path, {
    submissionId,
    deviceAt,
    body: withCapability,
  });
}

/** Exposed for the gate suite: the table itself, so the doors that carry a
 *  capability are asserted rather than described in a comment. */
export function learnerDoors(): string[] {
  return [...LEARNER_DOORS].sort();
}
