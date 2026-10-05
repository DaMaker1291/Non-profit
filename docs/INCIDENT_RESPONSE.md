# Incident response

A short, executable plan. The runbooks are in `OPERATIONS.md`; this document is
about severity, command, and what must not happen.

---

## 1. Severity

| Level | Definition | Examples | Response |
|---|---|---|---|
| **SEV-1** | learners cannot learn, or their data is at risk | site down; evidence lost or corrupted; a data breach | all hands, immediately |
| **SEV-2** | a core capability is broken for many | AI provider down with no fallback; sync failing; a bad content release live | same day |
| **SEV-3** | degraded but usable | slow pages; a single surface broken; one learner affected | next working day |

## 2. First five minutes

```text
1. ASSESS      /api/health  → alive?      /api/ready → serving?
2. PRESERVE    do NOT edit or delete any data. Copy the data directory first.
3. CONTAIN     stop the bleeding: roll back, disable cloud AI, or take the
               instance out of rotation (make /api/ready the LB probe).
4. DECLARE     one incident owner; one channel; one timeline.
5. RECORD      timestamps, commands run, what you observed.
```

## 3. Command

- **Incident owner** — decides, doesn't necessarily fix. Names a scribe.
- **Scribe** — writes the timeline.
- **Comms** — tells affected schools/learners what they need to know, in plain
  language.
- **Investigator(s)** — the people in the system.

For a deployment serving children, the owner also decides whether the school's
safeguarding lead is informed, and whether a data-protection notification is
required (see §6).

## 4. By scenario

### Site down
`curl /api/health` → process? → restart. Then `/api/ready`:
`data:not_writable` = volume problem (do **not** clear it);
`config:*` = the named variable; `content:empty_graph` = bad build, redeploy.
Then the proxy, then the CDN. If a deploy preceded it, roll back.

### Data issue
Freeze writes if possible; preserve the store; read `/api/evidence` for the
affected learner — `deepReconcile.differences` names exactly what the model and
the ledger disagree on. **The ledger is authoritative.** The fix is a
re-projection, never a hand edit. If `unprojectable` is non-null, some history
predates the ledger and cannot be rebuilt from events.

### AI outage
This is a **supported state**, not an incident: four failure modes fall back to
the deterministic offline tutor and the learner is told. If the fallback itself
misbehaves, that is SEV-2. To force the fallback deliberately, unset the provider
keys and redeploy.

### Bad content release
`npm run verify:content-release` names the section that moved. Revert the record
or the code; keep the previous version in git history. An **evidence schema**
change is not a rollback — see `DATA_GOVERNANCE.md` §5.

### Security incident
Contain → rotate → assess → document → notify.
- Rotate `OPENMIND_SESSION_SECRET` to end every session.
- Rotate AI and impact keys; redeploy.
- Preserve logs; do not edit the store while investigating.
- If personal data was exposed, follow §6.

## 5. Aftermath

```text
1. a blameless write-up: what happened, what we saw, what we changed
2. a NEW gate if the incident was catchable (add it to scripts/ + CI)
3. a re-run of `npm run production-check`
4. review whether the runbook above was usable — fix it if not
```

An incident that adds no gate is an incident that can repeat.

## 6. Notification

Because OpenMind serves children, breach handling is not discretionary:

- **Personal data breach** — assess risk to the learner; where required by the
  applicable law (for example UK GDPR), notify the supervisory authority within
  72 hours and inform affected individuals where the risk is high.
- **Safeguarding** — a safety event routes to the deployment's designated
  safeguarding lead, not through an issue tracker.
- **Schools** — the deployment's operator informs the affected school; OpenMind
  the project does not hold a relationship with the child that it can notify
  directly.

Record every decision not to notify, and the reason, so the judgement is
reviewable.
