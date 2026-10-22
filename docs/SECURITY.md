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

Three credentials exist, and the server owns all three:

- **An account session** — a signed `om_session` cookie (`lib/server/auth.ts`).
  The payload is `accountId.epoch.expiry.hmac`; the HMAC key is
  `OPENMIND_SESSION_SECRET` or a generated `session-secret` file. Sign-out
  **bumps the account's session epoch**, so every outstanding token for that
  account dies immediately — a server decision, not a client courtesy.
- **A capability secret** — each learner profile carries a `secret`, and
  learner-scoped routes require it (`lib/server/capability.ts#authorizeLearner`).
  A profile id alone is never enough; a read route never mints a secret. It is a
  **permanent bearer credential**: no expiry, no rotation, bearer of everything
  that learner may do.
- **A classroom session** — a short-lived token a learner receives by exchanging
  the PIN their teacher issued (`app/api/kiosk/login/route.ts`). Stored as a
  sha256 hash in `kiosk-sessions.json`, bounded by a server-side expiry, deleted
  by the server on hand-back, and marked `via: "kiosk"` where credentials are
  checked so the doors that must refuse it can ask a flag rather than re-parse a
  string. It travels the same `secret` slot, so no route needed a second
  transport. See `docs/DEVICE_MODES.md` for which credential belongs to which
  deployment.

  A classroom session is narrower in what it may **do**, not in whether it can
  learn: it is served practice, has its answers marked, and reads its own
  progress and evidence. That half was measured broken once — the guard *inside*
  each mutator compared the token with the record's permanent capability, so a
  PIN sign-in returned 200 and every lesson route then answered 401. The rule now
  has one owner, `lib/server/capability.ts#checkPresentedSecret`, which accepts a
  session the route has already resolved for **that** learner and never binds it
  as the capability (a token the server ends at hand-back must not become the
  credential for the record). `npm run verify` scans every route for a private
  copy of that comparison, so a fifth hand-written version fails the suite.

**A capability is a learner credential, never an administrative one.**
Teacher-only operations (creating or editing a class, setting its work, issuing
classroom credentials, exporting its roster, reading one learner's evidence, and
the evidence→intervention loop at `/api/needs`) are authorised by an ACCOUNT whose
role is `teacher`/`org` and that owns the class — `lib/server/authority.ts`
(`teacherCaller`, `teacherOfClass`). They do not accept a profile capability at
all. This is a fix, not a preference: a learner's own id and secret could create
a class and then administer it, because every class door asked "is this the
class's owner profile?" and a capability *is* that profile. `/api/needs` was the
last door still asking that question — its intervention loop could freeze a
finding and set the class's work from a capability — and it now asks the account
rule like the rest. The properties are pinned by source assertions in
`npm run verify` and driven over real HTTP by `npm run verify:kiosk` against a
scratch store, whose permission matrix asks every teacher-only action with the
owner account, another teacher's account, the owner's own capability, a learner
capability, a live classroom session and a learner account. `verify:permissions`
(`npm run verify:permissions`) carries the same negative claims against the
production build.

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
| Rate limiting | **PARTIAL** — sign-in and sign-up bounded in-process (`lib/server/rate-limit.ts`); every other door **PROPOSED** (proxy) — see §9 |

## 9. Launch blockers

These are not optional hardening; each is a condition of putting OpenMind in
front of the public:

1. **Rate limiting — partly closed, still a blocker.**

   **What is closed.** `lib/server/rate-limit.ts` bounds the two credential
   doors. It has two modes, and the choice of mode is the security decision:

   * **`hard` refuses before the scrypt derivation.** Used for a SOURCE ADDRESS
     (40 failures per fifteen minutes) and for sign-up (ten accounts per
     address per hour). A refusal here denies nobody their own account, and it
     is the bound that stops an attacker making this server do derivation work.
   * **`soft` slows the attempt and still checks the password.** Used for the
     ACCOUNT (eight failures per fifteen minutes, then a 250 ms → 2 s pause)
     and for the PROCESS (120 derivations per minute, the bound a distributed
     attack cannot route around because it is keyed on nothing an attacker
     chooses).

   **Why the account bound is soft, stated because it was got wrong once.** The
   first version had a hard ceiling on the account and answered `429` to every
   attempt against it, including the account's own correct password. That lets a
   remote stranger who knows an email address keep a learner out of their own
   record for the length of the window — a denial of service produced by the
   protection, on a product whose typical device is shared. The account bound is
   therefore a pause the owner waits out, never a door that is shut on them;
   `npm run verify:permissions` §7 asserts that the owner signs in after an
   attack. An attack costs its target at most two seconds per attempt.

   Four properties are deliberate and asserted in `npm run verify`:

   * the key is the **account**, because Next's route handlers expose no socket
     address and a request header a client can set is not a limit; an address
     key is used only when the deployment declares `OPENMIND_TRUSTED_PROXY=1`,
     and then the RIGHTMOST `x-forwarded-for` hop (the peer the proxy saw),
     never the spoofable leftmost;
   * a **refused attempt does not extend the window**, so an attacker cannot
     hold a hard bound open by continuing to try, and a soft window's end is
     stamped once and never moved;
   * the counter table has a **ceiling**, because its keys are attacker-chosen
     email addresses and an unbounded map is a leak an attacker drives by
     trying to sign in;
   * **a restart clears every counter**, which is asserted rather than assumed:
     it is a reason the proxy remains required, not a property to rely on.

   Neither mode reveals whether an account exists: an unregistered address is
   counted by the same keys and answered with the same `401` and the same body
   as a wrong password, and it is slowed identically.

   **The recovery door is bounded by the same three keys**, deliberately: a
   recovery code is a bearer credential, so guessing one must cost what guessing
   a password costs. `POST /api/auth/recover` shares the account (soft), source
   (hard, where a trusted proxy makes it meaningful) and process (soft) bounds
   with sign-in, counts on failure and clears on success, and answers one `401`
   for a wrong code, an expired grant and a code that belongs to another account
   (app/api/auth/recover). **Teacher-issued grants add a second, tighter bound of
   their own**: eight secret characters, fifteen minutes, single use, and issued
   only by the teacher of a roster the learner is actually on.

   **What is not.** It is an in-process counter: it bounds one server process
   (the shape the file store already has), and a restart clears it. The **AI,
   answer-submission, diagnostic, sync, upload and teacher-invitation** doors are
   still unbounded — one abusive client can exhaust the process through any of
   them. The reverse
   proxy remains required for those, and for any deployment running more than
   one process. Password verification itself is scrypt with a per-account salt,
   compared in constant time (`timingSafeEqual`).
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
