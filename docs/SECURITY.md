# Security

OpenMind serves children. Its security posture is measured, not asserted: every
claim below names the code that enforces it, and every gap is labelled
**PROPOSED**. `npm run verify:permissions` and `npm run verify:sync` turn the two
most important claims into executable tests.

---

## 1. What we are protecting

| Asset | Why it matters |
|---|---|
| A learner's evidence ledger | their whole educational record |
| A learner's profile (course, year, name) | identifies a child |
| Account credentials | access to all of the above |
| Class rosters | who is in a class, and their measured work |
| Teacher assignment monitors | per-learner progress across a class |
| Session signing secret / AI keys | infrastructure access |

## 2. The threat model we design against

1. **A leaked id.** A profile id in a URL, a screenshot or a shared link must not
   be enough to read anyone's data. *(The single most important rule here.)*
2. **A shared device.** One phone, many learners. Sign-out must actually end the
   session, not just clear a cookie.
3. **A misconfigured deployment.** A half-set key or a refused profile must be
   visible, never silent.
4. **An offline device.** Work that arrives after a disconnect is real but
   unverifiable, and must be treated as both.
5. **A bad AI provider or a malicious model output.** A model may never write to
   the record.

What we deliberately do **not** assume: that the browser is trustworthy, that a
device's clock is correct, or that a caller who presents an id is its owner.

## 3. Identity and authority — where the decisions live

Two credentials exist, and the server owns both:

- **An account session** — a signed `om_session` cookie (`lib/server/auth.ts`).
  The payload is `accountId.epoch.expiry.hmac`; the HMAC key is
  `OPENMIND_SESSION_SECRET` or a generated `session-secret` file. Sign-out
  **bumps the account's session epoch**, so every outstanding token for that
  account dies immediately — a server decision, not a client courtesy.
- **A capability secret** — each learner profile carries a `secret`, and
  learner-scoped routes require it (`lib/server/capability.ts#authorizeLearner`).
  A profile id alone is never enough; a read route never mints a secret.

The cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` **when the
request is actually served over HTTPS** (or carries `x-forwarded-proto: https`) —
never blanket-on (which breaks plain-HTTP school installs) and never
blanket-off (which would transmit a session over a downgrade). This behaviour is
pinned by `npm run verify`.

Identity is resolved in **one** place per request, and authorisation is resolved
by one rule per resource. The negative claims are tested:

```bash
OPENMIND_BASE=http://localhost:4173 npm run verify:permissions
```

which asserts, over HTTP:

- an id with no secret is refused by every learner read door;
- learner B's valid secret cannot read or append to learner A's ledger;
- a class answers only a member, and its refusal does not leak the join code;
- a non-owner cannot edit a class's curriculum or set its work;
- a student receives their own assignment row and **no** class monitor;
- the aggregate impact report honours its publisher key, when set;
- the session cookie is `HttpOnly`, identifies the account alone, and the old
  cookie stops working after sign-out.

## 4. What the browser is never trusted for

- **Answer grading.** The answer key lives on the server; the browser receives a
  served view with no answers in it, and the server marks against its own key.
- **Evidence authorship.** Anything arriving over the wire is stamped
  `provenance: "device"`, even if the body claims `"server"`
  (`lib/evidence.ts#validateEvent`). `verify:sync` proves this.
- **Clock claims.** A device's claimed time is kept in `deviceAt` and disclosed,
  never used as the record's time.
- **Ids.** Every learner-scoped request re-checks the capability; no route trusts
  a client-supplied ownership claim.

## 5. The evidence ledger's integrity rules

1. Events are **never rewritten or deleted** on a normal path.
2. Events are minted **server-side**; a client cannot author evidence about
   itself.
3. Every event carries a **schema version**; a shape change is a migration, not a
   silent re-interpretation.
4. Ingestion is **idempotent by event id** against what is on disk, so a retried
   sync cannot double-count (`lib/server/evidence.ts#appendEvidence`).
5. The degradation proof is always available: `/api/evidence` returns
   `deepReconcile`, comparing the model against a rebuild from the ledger.

## 6. AI security

- Provider credentials live **only** on the server (`lib/llm.ts`); the UI never
  holds a key.
- **There is no code path from an AI response to the ledger or a mastery field.**
  The only way in is append → confirm → replay/adopt, reached from grading routes
  after server-side marking. This is asserted in `npm run verify`.
- A model failure is a supported outcome, not an error page; four failure modes
  fall back to the deterministic offline tutor, and the learner is told which one
  answered (see `AI_SAFETY.md`).

## 7. Secrets

- `.env` and `.env.*.local` are gitignored; only `NEXT_PUBLIC_*` reaches the
  browser.
- `lib/env.ts` flags a present-but-wrong secret (too short) as a **problem**, so
  `/api/ready` fails rather than running with a guessable HMAC key.
- **PROPOSED:** a managed secret store and rotation tooling. Today, rotating a
  secret is a value change and a redeploy.

## 8. Transport, headers, rate limiting

| Control | State |
|---|---|
| HTTPS + reverse proxy | required in production (`DEPLOYMENT.md`) |
| Session `Secure` flag | implemented, scheme-aware |
| `Content-Security-Policy` | **PROPOSED** (proxy) |
| `Strict-Transport-Security` | **PROPOSED** (proxy) |
| `X-Content-Type-Options` | **PROPOSED** (proxy) |
| `Referrer-Policy` | **PROPOSED** (proxy) |
| `Permissions-Policy` | **PROPOSED** (proxy) |
| Clickjacking protection | **PROPOSED** (proxy / frame-ancestors) |
| Rate limiting | **PROPOSED** (proxy) — see §9 |

## 9. Launch blockers

These are not optional hardening; each is a condition of putting OpenMind in
front of the public:

1. **Rate limiting.** Signup, signin, password-reset, AI, answer submission,
   diagnostic submission, sync, uploads and teacher invitations must be limited
   at the proxy. One abusive client can otherwise exhaust the process.
2. **Security headers.** The set in §8, tested rather than copied.
3. **HTTPS everywhere in production**, with `Secure` cookies confirmed on a real
   HTTPS host.
4. **A real secret store** and documented rotation.
5. **Monitoring.** You cannot defend what you cannot see (`OPERATIONS.md` §6).

## 10. Reporting a vulnerability

Contact the maintainers privately (open a security advisory on the repository
rather than a public issue). Do not include a child's data in a report. Include
the route, the request, and the observed response; the two permission suites are
the fastest way to reproduce an authorisation fault.
