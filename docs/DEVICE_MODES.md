# Three device modes, three different security problems

A device that several people use is not one problem. A family sharing a phone, a
learner moving from a phone to a tablet, and **three supervised handsets for a
class of forty** have different attackers, different credentials and different
things to lose. OpenMind therefore ships three modes, and the rule that matters is
that they do not borrow each other's credentials.

| | **Household** | **One-to-one** | **Classroom kiosk** |
|---|---|---|---|
| Who | A family or siblings on one device | One learner, several devices | ~40 learners, shared handsets |
| How a learner signs in | picks themselves from the device roster | their own device, already signed in | class code + name + **PIN** from the teacher |
| Credential after sign-in | their **capability secret** | their **capability secret** | a **classroom session token** (90 min, server-held) |
| Stored on the device | capability, cleartext, in the roster (`openmind:learners`) | capability, cleartext, in the identity keys | session token only; **not** on the roster |
| Teacher authority | none (there is no class) | none | a **teaching account**; the roster never holds it |
| Hand-back | switch learner from the roster | not applicable | "Finish and hand back" on every page; **the server ends the session** |
| Revocation | re-enrol / erase (see below) | sign out of the account | `POST /api/classes {action:"revoke"}` kills the PIN **and** its sessions |

## One person, one side of the desk

The two credentials in that table are not two modes of one person; they are two
roles. A **teaching account** administers classes and is not a member of one: the
class records its creator as `ownerId`/`teacherAccountId` and enrols nobody, and
the join door refuses a teaching account by name (`teacher_account_cannot_join`,
`app/api/classes/route.ts`). A **learner account** joins a class with its code and
never creates one.

This is a rule about the DOOR, not about a hidden button. The console used to
offer "create a class" and "join a class" side by side to the same person, and
the server accepted either, so one identity could be a class's administrator and
a pupil on another class's roster at once — which left every screen downstream
answering "which one is this?" from a flat profile, and the answer was "both".
A class's roster is its learners; the person who owns it is a different fact
(`ownerId`), and every door that used to ask "is this profile on the roster?" now
asks "is this profile on the roster **or** the class's administrator?"
(`GET /api/classes`, the per-member evidence read, and `GET /api/assignments`,
whose listing began with membership alone).

## Classroom kiosk

1. **The teacher provisions — from the class card.** `POST /api/classes
   {action:"provision"}` creates one profile per named learner, hashes a freshly
   minted 6-digit PIN onto the class roster (`salt` + scrypt `hash`,
   `lib/server/store.ts#kioskPinHash`) and returns the PINs **once**.
   `components/classroom-pins.tsx` is the console half: a list of names in, a
   printable table of PINs out, and nothing to read back afterwards.

   **A forgotten PIN is re-issued on the SAME record** — `provision` with the
   learner's `id` mints a new PIN on their existing profile and ends the sessions
   the old one bought. The alternative (revoke, then enrol the name again) would
   create a SECOND profile for one child and split their evidence in two, which is
   the quiet version of losing it. `action:"revoke"` remains for a learner who
   should have no way in at all (a phone handed on), and refuses an id the class
   does not carry (`not_a_classroom_learner`) rather than guessing at one.
2. **The learner exchanges the PIN for a session.**
   `POST /api/kiosk/login` answers with a session token, not the profile's
   capability. The profile's permanent secret exists (every record needs one) but is
   **never disclosed**.
3. **The session is narrower than a capability — and it can actually learn.** A
   classroom session is served practice, has its answers graded, and reads its own
   progress, evidence and preferences; that half was a real defect once, not a
   tautology (see below). It **cannot** erase a record (`kiosk_cannot_erase`), pull
   the full personal-data export (`kiosk_cannot_export`), create or administer a
   class, or re-declare the course its teacher provisioned (`kiosk_field_locked`).

   > **Measured, then fixed.** The first build let a PIN sign-in return 200 and then
   > refused `POST /api/progress {action:"serve"}` with 401 — the learner was signed
   > in and unable to practise. The route had accepted the token
   > (`lib/server/auth.ts#authorisedProfile`), but the guard *inside* each mutator
   > compared it against the record's permanent capability, and four route files had
   > their own copy of that comparison. There is now one owner,
   > `lib/server/capability.ts#checkPresentedSecret`: a capability, or a session the
   > route resolved for **this** learner first (`classroomSessionFor`). A proven
   > session is never written into `state.secret` — binding a token the server ends
   > at hand-back would lock the learner out of their own record when the lesson
   > ends. `npm run verify` asserts that no route keeps a copy of the comparison, and
   > `verify:kiosk` drives a served question, its marking, the progress read and the
   > evidence read with nothing but the session token.
4. **Hand-back is a server act.** `POST /api/kiosk/leave` deletes the session; the
   client also clears the identity and reloads, but the guarantee does not depend on
   it. A token copied off the handset is dead, and an abandoned session dies at its
   expiry regardless of what the browser does.
5. **Attempts are bounded.** Eight wrong PINs per learner per class per 15 minutes,
   a **hard** refusal (`lib/server/kiosk.ts#KIOSK_PIN_POLICY`), consulted before the
   hash is computed, with the failure count also written on the class so a restart
   does not reset it. A locked-out learner waits or asks the teacher for a new PIN —
   the credential is issued for a lesson, not for an account.

### What the classroom mode does *not* protect against

- **A classmate deliberately spending a learner's PIN budget.** Inherent to a
  ~20-bit credential; the mitigation is re-issue, not a longer lockout (which would
  hand the same classmate a stronger denial of service).
- **The teacher's own account on the handset.** A teaching sign-in must not be
  remembered: `lib/client.tsx#adoptSession` adds **only** a `student` role to the
  device roster, because a remembered teacher capability would be classroom
  authority in cleartext — the defect this work started from.
- **The store is single-process.** Revocation and expiry are enforced by the server
  that holds `kiosk-sessions.json`; a second process would not see them until the
  store moves to a backend that shares them (see `docs/STORAGE_SPEC.md`). What a
  RESTART does is measured rather than assumed (`npm run verify:kiosk:restart`):
  a live session **survives** it (a restart is not a sign-out), an ended or
  expired session does **not** come back (both are a deletion / a clock check on
  the file), and the PIN failure counter survives because every failure is also
  written to the class row — after three failures and a restart, the refusal
  arrives after the five remaining attempts, not a fresh eight. The in-process
  `hit()` window is only a second, faster counter; it is not the bound.

## Household roster

Kept, deliberately, for its own use case — and it is **not** the classroom answer.
The roster (`lib/device-roster.ts`) holds up to eight `{id, secret, name}` entries in
`localStorage`, so **anyone holding the device can be any remembered learner**:
read, export, modify and erase. Before this is offered to a household with people
who should not see each other's records, these remain open:

- the stored credential is a permanent bearer secret in cleartext (no device
  binding, no expiry);
- switching is not re-authenticated;
- there is no revocation or rotation endpoint for a profile secret;
- destructive and export operations are not re-confirmed.

Supervised deployment is exactly the case where "holding the device is holding
every learner" is unacceptable, which is why it uses the kiosk mode instead.

## Which mode am I looking at?

The client knows by what is in storage: a classroom session leaves a marker
(`openmind:kioskSession`, `lib/kiosk-session.ts`) and the shell renders the hand-back
bar from it (`components/kiosk-bar.tsx`), outside the route guard so it is reachable
even from a boot screen. No marker means the household/one-to-one path.

`/kiosk` is a **public** route: a handset at rest shows the class-code form to
whoever picks it up, and a signed-in learner reaching it sees "continue" and
"finish and hand back" instead of a second sign-in.

## How this is verified

```bash
# the authority boundary and the classroom model, over real HTTP, on a scratch store
OPENMIND_DATA_DIR=/tmp/om-kiosk npm run dev
OPENMIND_BASE=http://127.0.0.1:4173 npm run verify:kiosk

# what survives a process restart — starts its own server on a temp store
npm run verify:kiosk:restart

# the same rules as source assertions, in the always-run suite
npm run verify
```

`verify:kiosk` refuses to start without `OPENMIND_BASE`, because it creates
accounts, classes and learner records: it must be pointed at a scratch deployment
explicitly. It asserts, among 105 properties: a classroom session **can** be served
practice, answer it, and read its own progress and evidence; a learner's capability
cannot create or administer a class, set its work or export its roster; another
teacher cannot read it; a wrong PIN is refused; a classroom session cannot erase,
export or administer; one learner's token cannot read another's record by changing
the id; hand-back and revocation kill the session **on the server**; and one
learner's spent attempt budget does not lock a classmate out; and a re-issued PIN
opens the same record (the work is still there) while the old one stops working. A
permission **matrix** then asks every teacher-only action and door (create,
update, provision, revoke, one learner's evidence, the answer-key pack, the
OneRoster export, setting work and the needs door) with six principals — the
owner account, another teacher's account, the owner's own PROFILE CAPABILITY, a
learner capability, a live classroom session and a signed-in learner account —
and asserts the refusal each one gets. The owner's own capability is in that
list on purpose: it is the measured defect, and a capability is a learner
credential even when the profile belongs to an adult.

The teacher console is walked as well as asserted: a class card's "Classroom
PINs" panel turns two names into two PINs, and "New PIN" beside an A-level
learner returns a fresh one on the same profile.

The browser path is walked as well as asserted: sign in with a PIN, change a
preference and save (which must **not** add the session to the household roster),
hand back, reload — the handset is locked with no name on screen — then sign in as
the second learner and confirm that learner's own record opens (200) while the
first learner's record refuses a read and an erase (401).
