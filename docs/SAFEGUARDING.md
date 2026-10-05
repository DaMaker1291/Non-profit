# Safeguarding

> What happens if something unsafe happens in the tutor?

This is the operational answer. It covers the learner-facing surfaces that can
carry risk — the AI tutor, class rooms, names and handles — and it is honest
about which parts are code and which are process.

---

## 1. The surfaces where a child could encounter something unsafe

| Surface | Risk | Control |
|---|---|---|
| AI tutor / room tutor | a model produces harmful, distressing or unsafe text | the model cannot write; fallback; disclosure (`AI_SAFETY.md`) |
| Study rooms | one learner posts something harmful to another | room content is learner-authored; moderation is **PROPOSED** |
| Handles / display names | a name that is abusive or identifies a child | length-capped; uniqueness resolved; no real-name requirement |
| Teacher messaging | — | there is no free-text teacher↔child messaging channel |
| Offline packs | shared content | packs are curated study material |

The product deliberately has **no** free-text social feed, no direct messaging
between children, and no notifications that pull a child back.

## 2. The tutor's boundaries (enforced in code)

The AI layer **explains, hints, adapts and generates practice; it can never
write**. Concretely:

- there is no code path from a model response to the evidence ledger or a mastery
  field (`lib/llm.ts`; asserted by `npm run verify`);
- the tutor is given the learner's *own* decision, reason and citations — never a
  hidden store of personal data;
- four failure modes fall back to the deterministic offline tutor, and the
  learner is always told which of the two answered.

**PROPOSED — an explicit content policy for the tutor prompt**: refuse and
redirect on self-harm, abuse, or attempts to elicit unsafe content, with a fixed
safe response in the learner's language, rather than relying on the provider's
own guardrails.

## 3. Detection → safe response → log → escalate

The response ladder every deployment should operate:

```text
detect      a model reply, or a room message, that is unsafe or distressing
   ↓
respond     the learner gets a safe, calm message and a route to a trusted adult
            (PROPOSED — a fixed safe-response template, 15 languages)
   ↓
log         an audit-safe event that records THAT a safety path triggered,
            without retaining the child's whole conversation (PROPOSED)
   ↓
escalate    where the deployment's safeguarding policy requires it, a named
            human is told — the school's designated safeguarding lead
```

**Detection is not automated today.** Nothing scans model output or room content
for unsafe material. Until that exists, the operator's answer is human review and
a clear reporting route.

## 4. Reporting route

```text
In-app:  a "get help" / "report this" affordance on tutor and room surfaces
         (PROPOSED)
Out-of-app: the deploying school's designated safeguarding lead, whose contact is
         recorded in that deployment's own policy
Infrastructure: a security or safety incident follows INCIDENT_RESPONSE.md
```

Do not route a safeguarding report through a public issue tracker.

## 5. What an operator must decide before launch

1. Who is the named safeguarding contact for this deployment?
2. What is the escalation path, and in what timeframe?
3. What do learners see when they need help, in their language?
4. Is cloud AI enabled? If so, the safeguarding policy must cover it.
5. Are study rooms enabled? If so, who moderates them?

A deployment that cannot answer 1 and 2 should not enable cloud AI or rooms.

## 6. Data handling in a safety event

- Record as little as the escalation requires: a flag, a timestamp, the surface,
  and the deployment id — **not** a copy of the child's conversation.
- Anything retained follows the retention schedule in `PRIVACY.md` §6.
- A safety report is handled by the deployment's own processes; OpenMind does not
  become a controller of a child's disclosure by logging it.
