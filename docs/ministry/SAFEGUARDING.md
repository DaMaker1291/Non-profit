# Safeguarding policy — schools, teachers and volunteers

**Status: DRAFT for adoption by the operating organisation. No safeguarding lead
has been appointed, because no organisation has been formed yet.** This document
is written so that a school can read it before a pilot and see exactly what is
proposed, and so that the first trustees can adopt or amend it rather than start
from a blank page.

It covers a deployment of OpenMind into schools: who is involved, what they may
do, how a concern is raised when the school has no internet, and how the policy
is reviewed. The **product-side** half — what the software itself refuses to do
and which code enforces it — is [`../SAFEGUARDING.md`](../SAFEGUARDING.md); these
two documents are one policy in two halves and neither stands alone. It is not a substitute for the operating country's own safeguarding
law or the school's own policy, and it does not claim compliance with either.
[counsel to confirm] and [local safeguarding partner to confirm] apply throughout.

---

## 1. Scope and status

| Item | State |
|---|---|
| Operating organisation | **to be appointed** — no legal entity exists at the time of drafting |
| Named safeguarding lead | **to be appointed** |
| Deputy / out-of-hours contact | **to be appointed** |
| Trustee with safeguarding responsibility | **to be appointed** (a UK charity must have trustees; three is the usual minimum) |
| Children covered | learners in partner schools, any age the school enrols |
| Adults covered | employees, contractors, volunteers, teacher-trainers, anyone with access to the store or to a school |
| Review cycle | annually, and after any serious incident |

The product has **no chat between learners, no image upload, no public profile and
no messaging feature**. A learner can post a study pack and a room message that
other members of that room can read (`lib/types.ts#StudyPack`, `StudyRoom`), and a
teacher can attach work to a class. Those are the only places one person's words
reach another, and they are membership-scoped.

---

## 2. Roles and responsibilities

| Role | Responsibility | Who |
|---|---|---|
| Safeguarding lead | owns this policy, receives and escalates concerns, keeps the incident log | **to be appointed** |
| Deployment coordinator (per country) | trains teachers, is the school's first contact, keeps the local contact list current | **to be appointed** |
| Teacher | supervises learners using the product, reports concerns to the school's designated person and to the coordinator | the partner school's own staff |
| Engineer with store access | may read learner data only to fix a fault, only with the school's written authorisation, and logs what was accessed | **to be appointed** |
| Trustees | assure themselves the policy is followed; receive an annual report | **to be appointed** |

No volunteer is given store access. No role in this table may be held by someone
who has not completed the recruitment checks in §4.

---

## 3. Code of conduct

Applies to every adult acting for the deployment, in a school or online.

1. **Two adults, or a visible space.** No one-to-one unsupervised contact with a
   learner, in person or online. Product support is handled through the school,
   not through a child's account.
2. **No private channels.** Staff do not ask a learner for a phone number, a
   personal social account or an email address, and do not contact a learner
   outside the school's own channels.
3. **No photography of learners** without the school's written permission and the
   parents' consent, and never with a device that syncs outside the school.
4. **Data access is a task, not a right.** Reading a learner's record is permitted
   only to resolve a specific, recorded support request. The store is not browsed
   out of curiosity.
5. **Do not promise confidentiality** you cannot keep. Explain what will be shared
   and with whom when a learner discloses something.
6. **Report, do not investigate.** A concern goes to the school's designated
   safeguarding person and the deployment's safeguarding lead. Staff do not
   interview a child, and do not confront an accused adult.
7. **Respect the learner's own words.** Handle and profile data are the child's;
   do not copy screenshots of a learner's record into chat groups or email.

---

## 4. Safer recruitment

Before any adult has contact with learners or access to the store:

| Step | Evidence kept |
|---|---|
| Identity check | photo id seen and recorded |
| References | two, one from the most recent employer, taken verbally and written up |
| Criminal-record check appropriate to the role and country | certificate or equivalent **[local safeguarding partner to confirm what is available and mandatory]** |
| Self-declaration of any caution, conviction or barring | signed form |
| Right-to-work / contract status | per the operating country |
| Safeguarding induction before first contact | signed attendance record |
| Annual refresher | attendance record |

A UK DBS check is not a substitute for a local check, and neither replaces
references. Where a country has no accessible criminal-record process, the
deployment runs references, a self-declaration and a probation period with no
unsupervised access, and records that decision.

---

## 5. Incident and escalation

### 5.1 If a learner discloses harm

1. Listen. Do not promise secrecy. Do not ask leading questions.
2. Tell the child what happens next, in words they understand.
3. Record what was said, in their words, the same day: date, time, place, who was
   present, what was said.
4. Report the same day to the school's designated safeguarding person. If the
   school has none, to the deployment's safeguarding lead. If the concern
   involves the school's own staff, report to the deployment's lead directly and
   do not report to the school.
5. The safeguarding lead decides whether a referral to the local authority or
   police is required, and records the decision and its reason.
6. Do not discuss the concern with the accused person, with other learners, or in
   any group channel.

### 5.2 If the concern is about a user's conduct in the product

A room message or study pack can carry text that is abusive, sexual, or
identifies a child. The handling route is:

1. The teacher removes the content (a room's owner and a class's teacher can
   remove or close it; `app/api/rooms/route.ts`, `app/api/classes/route.ts`).
2. The school records the incident and informs the deployment lead.
3. The deployment lead preserves what is needed for the school's process — a
   copy of the message, its author handle and the room id — and does not delete
   the room until the school says the record is no longer needed.
4. Where the content suggests a child is at risk, §5.1 applies.

### 5.3 If the concern is about an adult acting for the deployment

The lead reports to the trustees (or, before trustees exist, to the commissioning
school and to the funder/host organisation) and suspends the person's access to
the store the same day. Store access is a single directory; revoking it is a
documented action, not an assumption.

### 5.4 Incident log

One log, kept by the lead, containing: date, who raised it, what was alleged, the
decisions taken and by whom, and the outcome. It contains child-identifying
detail and is kept separately from any learning data — never in
`OPENMIND_DATA_DIR`.

---

## 6. Reporting routes that work without internet

The deployment target is a school with intermittent power and connectivity. A
reporting route that requires a working web form is not a route.

| Route | How it works | Who holds it |
|---|---|---|
| In person | the school's designated person, named on a printed card given to every teacher | the school |
| Phone call or SMS | the coordinator's number, printed on the same card | the coordinator |
| Paper form | a one-page incident form in the teacher pack, collected at the next visit and scanned by the coordinator | the school, copied to the lead |
| Offline app note | a teacher can record a concern in the product's own notes and it syncs when the device reconnects — **not** a substitute for a phone call when a child is at immediate risk | the coordinator |

The card also states: **if a child is in immediate danger, contact the local
emergency service first, then the school, then the deployment.**

---

## 7. Design decisions that reduce risk

These are properties of the code, offered here because a school will ask what
the product itself does to protect a child.

| Decision | Why it matters for safeguarding | Where |
|---|---|---|
| No learner-to-learner direct messaging, no images, no public profiles | removes the main channel for grooming and for image abuse | `lib/types.ts#StudyRoom` |
| A student receives only their own assignment row; the class monitor is the owner's | a classmate cannot see another child's weaknesses | `lib/server/class-view.ts`; `npm run verify:permissions` |
| A profile id alone opens nothing; a capability secret or an owning session is required | a screenshot of a URL does not expose a child | `lib/server/capability.ts` |
| The AI tutor is optional, is told the concept and the counts but **not** the child's name or address, and the learner is told which system answered | a model is never handed an identified child, and a fallback is never disguised as AI | `lib/tutor-context.ts#tutorGroundingPacket`, `#disclosureKey` |
| Erasure is a resumable workflow that also survives a restore | a child who asks to be forgotten is not resurrected from an archive | `lib/server/erasure.ts`, `lib/server/erasures.ts` |
| The roster export writes an empty email on every row | exporting a class does not export contact details for every child | `lib/export/oneroster.ts` |

---

## 8. Partner school agreement — points the school should expect

Before the first learner is onboarded, the deployment and the school agree in
writing:

- who is the controller and who is the processor of the learning record
  [counsel to confirm];
- which adult is the school's designated safeguarding person, and their contact
  details on the printed card;
- that learners will be taught to sign out on a shared device, and how often;
- what the school will do with a learner's recovery code (print it, keep it, and
  what happens at the end of the year);
- whether AI tutoring is enabled, and if so what learners are told about it;
- the retention decision for the ledger at the end of the academic year;
- the device policy for any device that holds a learner's profile id, secret or
  unsent answers;
- the route for a data subject request (access, correction, erasure), and who at
  the school answers it.

---

## 9. Annual review

The lead reviews this policy annually and after any serious incident, and records:

- incidents in the year, and what changed as a result;
- training completed by each adult;
- any change to the recruitment checks available in the operating countries;
- whether the product still matches §7, checked against `npm run verify` and
  `npm run verify:permissions` on the deployed version;
- the school agreements renewed or lapsed.

---

## 10. What this document does not establish

It does not establish that any adult has been recruited, checked or trained; that
a safeguarding lead or trustee exists; that a school has signed anything; or that
the deployment complies with the safeguarding law of any country. It is a draft
for the first organisation to adopt, and the appointments in §1 and §2 are
prerequisites, not formalities.
