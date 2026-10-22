// ── WHO IS THIS REQUEST FROM? ──────────────────────────────────────────────
//
// Every source-keyed limit needs one fact this app cannot observe for itself:
// the address the connection came from. Next's route handlers expose no socket,
// so the only candidate is a request header — and a header a client can set is
// not a limit. This module is the single place that decides whether the header
// in front of it can be believed, and it is deliberately a separate module from
// the counter so the two questions stay separable:
//
//   · CAN this request be attributed to a client?  (here)
//   · what should be done about it?                (lib/server/rate-limit.ts)
//
// WHAT THE DEPLOYMENTS ACTUALLY PUT IN FRONT OF US. Established from this
// repository's own configuration and the host's documentation, not assumed:
//
//   · `docker compose up` / `docker run -p 4173:4173` — NO proxy. Nothing
//     writes a forwarding header, and the port is published straight to the
//     container. Declaring a trusted proxy here would be a lie, and the flag
//     must stay unset (docs/DEPLOYMENT.md §10).
//   · Fly.io (`fly.toml`) — one edge proxy, and it is the only public ingress:
//     "All requests to Fly.io apps are routed to our edge servers", and a
//     service port is not directly reachable. Its docs list `Fly-Client-IP` as
//     "the IP address of the client from the perspective of Fly Proxy", AND they
//     warn that `X-Forwarded-For` "must be treated with caution to avoid
//     spoofing attempts" — because Fly APPENDS to whatever the client sent.
//     Measured consequence: a request carrying `x-forwarded-for: 1.2.3.4`
//     reaches the app as `1.2.3.4, <real peer>`.
//
// WHY THAT MAKES THE POSITION, NOT THE HEADER NAME, THE RULE.
//
// Reading `x-forwarded-for` is safe only when you read an entry the CLIENT
// cannot choose. Fly's append behaviour means the RIGHTMOST entry is the peer
// the edge saw, whatever the client injected to the left of it. So the trusted
// entry is counted FROM THE RIGHT: `OPENMIND_TRUSTED_PROXY_HOPS` names how many
// proxies of ours append, and the client is that many entries from the end.
// With the default of 1 that is the rightmost entry.
//
// The tempting alternative — prefer `Fly-Client-IP` because it is documented as
// the client — is NOT what this module does, and the reason is written down in
// Fly's own documentation: it documents what the header MEANS, not that the edge
// OVERWRITES a value the client sent. A header whose collision behaviour is
// unspecified is not a header a rate-limit key may rest on, and one declaration
// that reads it anyway would be a bypass an attacker chooses. The append
// behaviour of `x-forwarded-for` IS specified, and a fixed position from the
// right is immune to injection by construction.
//
// FAILING CLOSED, AND WHY THAT IS NOT A LOCKOUT.
//
// If a deployment has DECLARED a proxy and the chain it delivers does not prove
// a client — the header is absent, or shorter than the declared hop count, or
// the trusted entry is not an address — then the request did not arrive through
// the ingress the deployment declared. The two honest readings are "misconfigured
// proxy" and "someone reached the origin directly"; both are failures a rate
// limiter must not paper over, so the credential doors REFUSE rather than
// silently running with no address key. That refusal is only ever reached when
// the operator has asked for an address bound, and it is loud on the first
// request instead of invisible until an incident.
import type { NextRequest } from "next/server";

export interface IngressConfig {
  /** `OPENMIND_TRUSTED_PROXY` — the operator declares a proxy they control. */
  declared: boolean;
  /** `OPENMIND_TRUSTED_PROXY_HOPS` — how many of our proxies APPEND an entry.
   *  The client is this many entries from the RIGHT of the chain. */
  hops: number;
}

export type Ingress =
  /** No proxy declared: this app is its own front door and there is no
   *  trustworthy address at all (never a placeholder — see rate-limit.ts). */
  | { kind: "direct" }
  /** A trusted address, and the chain length it was read from. */
  | { kind: "client"; address: string; chainLength: number }
  /** The deployment declared an ingress and this request did not come through
   *  it (or came through it with a chain that cannot be parsed). */
  | { kind: "refused"; reason: IngressRefusal };

export type IngressRefusal =
  | "proxy_misconfigured"
  | "header_missing"
  | "chain_too_short"
  | "address_malformed";

/** The one header this app trusts. `x-forwarded-for` is the only forwarding
 *  header whose append semantics are specified across the proxies it documents
 *  (see the header note); a proxy that sets only its own header must be
 *  configured to add this one too. */
export const CLIENT_ADDRESS_HEADER = "x-forwarded-for";

/** More than this many proxies in front of one process is not a topology this
 *  app claims to support, and an absurd hop count would make the trusted entry
 *  an attacker-chosen one in a long chain. */
export const MAX_TRUSTED_HOPS = 8;

function truthy(value: string | undefined): boolean {
  return /^(1|true|yes)$/i.test((value ?? "").trim());
}

/** Read the declared ingress from the environment. A hop count that is not a
 *  whole number in 1..MAX is a CONFIGURATION fault, and it is reported as one
 *  rather than quietly clamped: guessing what an operator meant is how a bound
 *  becomes decorative. */
export function ingressConfig(env: NodeJS.ProcessEnv = process.env): IngressConfig {
  const declared = truthy(env.OPENMIND_TRUSTED_PROXY);
  const raw = (env.OPENMIND_TRUSTED_PROXY_HOPS ?? "").trim();
  if (!raw) return { declared, hops: 1 };
  const hops = Number(raw);
  if (!Number.isInteger(hops) || hops < 1 || hops > MAX_TRUSTED_HOPS) {
    return { declared, hops: 0 };
  }
  return { declared, hops };
}

/** An IPv4 dotted quad, exactly. No leading-zero forms (`010.0.0.1` is octal in
 *  some parsers and refused here), no shorthand. */
function isIPv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && (p === "0" || !p.startsWith("0")) && Number(p) <= 255);
}

/** An IPv6 address, conservatively: groups of 1–4 hex digits, at most one `::`,
 *  and no characters beyond the ones an address may contain. A conservative
 *  check is the right failure direction — an address it refuses costs a source
 *  its bound (and refuses the request, loudly), while an address it accepts
 *  wrongly would become an attacker-chosen key. */
function isIPv6(value: string): boolean {
  const addr = value.split("%")[0]; // zone ids are not part of the address
  if (!addr.includes(":")) return false;
  if (addr.length > 45) return false;
  if (!/^[0-9a-fA-F:.]+$/.test(addr)) return false;
  if ((addr.match(/::/g) ?? []).length > 1) return false;
  const [head, tail] = addr.split("::");
  const headGroups = head ? head.split(":").filter((g) => g.length > 0) : [];
  const tailGroups = tail ? tail.split(":").filter((g) => g.length > 0) : [];
  if (![...headGroups, ...tailGroups].every((g) => g.length <= 4)) return false;
  const groups = headGroups.length + tailGroups.length;
  // `::` stands for at least one zero group, so a full 8 without `::` is the
  // only way to have 8 groups.
  if (addr.includes("::")) return groups <= 7;
  return groups === 8;
}

const IPV4_MAPPED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

/** A TCP port that could appear after an address. Out of range is malformed, not
 *  a port: the entry is a peer description, and `1.2.3.4:99999` is not one. */
function portOk(port: string): boolean {
  const n = Number(port);
  return Number.isInteger(n) && n >= 0 && n <= 65535;
}

/**
 * Normalise one chain entry to the string a counter is keyed on, or `null`.
 *
 * TWO CLIENTS MUST NOT LOOK LIKE ONE, and ONE CLIENT MUST NOT LOOK LIKE TWO:
 * `[2001:db8::1]:443` and `2001:db8::1` are the same peer; `1.2.3.4:5678` and
 * `1.2.3.4` are the same peer; an IPv4-mapped IPv6 address and its IPv4 form are
 * the same peer. Getting any of these wrong either splits a budget (evasion) or
 * merges two clients into one (one learner's failures slowing another's).
 */
export function normaliseAddress(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  // Some proxies quote the entry; some wrap IPv6 in brackets.
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).trim();
  if (value.startsWith("[")) {
    const close = value.indexOf("]");
    if (close < 0) return null;
    const inner = value.slice(1, close);
    const rest = value.slice(close + 1);
    if (rest && !(/^:(\d{1,5})$/.test(rest) && portOk(rest.slice(1)))) return null;
    return isIPv6(inner) ? applyMapped(inner.toLowerCase()) : null;
  }
  // Host:port without brackets is only unambiguous for IPv4.
  const v4Port = /^(\d{1,3}(?:\.\d{1,3}){3}):(\d{1,5})$/.exec(value);
  if (v4Port) return isIPv4(v4Port[1]) && portOk(v4Port[2]) ? v4Port[1] : null;
  if (isIPv4(value)) return value;
  // BEFORE the IPv6 check: `isIPv6` refuses a dotted-quad tail on purpose (a
  // group is at most four hex digits), and `::ffff:1.2.3.4` is a v4 peer wearing
  // a v6 coat — one client, so it must not become a second budget.
  const mapped = IPV4_MAPPED.exec(value);
  if (mapped) return isIPv4(mapped[1]) ? mapped[1] : null;
  if (isIPv6(value)) return value.toLowerCase();
  return null;
}

function applyMapped(address: string): string {
  const mapped = IPV4_MAPPED.exec(address);
  return mapped && isIPv4(mapped[1]) ? mapped[1] : address;
}

/**
 * The client address this request may be counted against, or the reason it
 * cannot be. Pure: it reads headers and the environment and nothing else, which
 * is what lets the whole contract be driven from a test with no server.
 */
export function readIngress(
  headers: Headers,
  env: NodeJS.ProcessEnv = process.env,
): Ingress {
  const config = ingressConfig(env);
  if (!config.declared) return { kind: "direct" };
  if (config.hops === 0) return { kind: "refused", reason: "proxy_misconfigured" };

  // Node joins repeated headers with ", ", which is the same separator the chain
  // itself uses — so a client that sends the header TWICE cannot create an
  // extra, attacker-chosen position: both copies land in the chain and the
  // trusted entry is still counted from the right.
  const chain = (headers.get(CLIENT_ADDRESS_HEADER) ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (chain.length === 0) return { kind: "refused", reason: "header_missing" };
  if (chain.length < config.hops) return { kind: "refused", reason: "chain_too_short" };

  const address = normaliseAddress(chain[chain.length - config.hops]);
  if (!address) return { kind: "refused", reason: "address_malformed" };
  return { kind: "client", address, chainLength: chain.length };
}

/** The convenience the routes use. */
export function ingressFor(req: Request | NextRequest): Ingress {
  return readIngress(req.headers);
}
