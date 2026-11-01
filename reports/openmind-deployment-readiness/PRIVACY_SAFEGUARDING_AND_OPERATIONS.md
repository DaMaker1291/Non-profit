# Privacy, Safeguarding and Operations

## 1. What was tested

Against the production build and an isolated scratch store:

| Test | Result |
|---|---|
| `GET /api/profile?id=A` with no secret | **401** |
| `GET /api/profile?id=A` with profile B's secret | **401** |
| `POST /api/progress` for A with B's secret | **401** |
| `GET /api/question` response fields | `id, conceptId, difficulty, prompt, choices` — **no answer, no explanation** |
| `GET /api/health` | Public; no learner data, no data-directory path |
| `GET /api/ready` | Public; **includes the absolute data-directory path**, store mode and durability codes |
| `GET /api/impact` | Public aggregate; empty store returned zero learners, no PII |

The capability-secret model is sound in the cases tested: **an id alone is not a credential**. Answer keys are stripped from the served question view. The separate `/api/worked-example` route intentionally returns a key, takes no seed, holds no learner state and writes nothing.

## 2. Data collected

From the profile shape and API:

- handle, country, optional birth year, language(s), subjects, grade/spec/specLevel, board, exam date, daily time budget, goal/intent;
- progress, diagnostics, masteries, evidence ledgers, papers, personal papers, classes, rooms;
- account email/password hash for signed-in users; recovery codes;
- device roster entries for shared handsets;
- AI cache when a model key is configured.

**Data minimisation is partial.** The product asks for country, grade and course because they change the curriculum; that is justified. Birth year is optional. There is no evidence that email is required for a guest learner (it is not). No age verification or parental-consent flow was found in the surfaces inspected.

## 3. Safeguarding

**Present:**

- Teacher and learner roles; class/roster boundaries; reset grants for teachers.
- Kiosk mode for shared devices; per-learner capability secrets; a "finish and hand back" flow.
- AI cannot write to the evidence ledger or mastery fields; the only write path is append → confirm → replay/adopt from the grading routes.
- Rate limits on signup, login, answers, diagnostics, AI and uploads.
- Erasure/tombstone support and a personal-data export (`/api/export/case`, `/api/my-data`).
- Safeguarding, privacy and data-governance documents exist in `docs/`.

**Not established:**

- No age assurance, parental consent, or child-safe account recovery designed for minors.
- No evidence of a school/teacher acceptable-use policy built into the product.
- Rooms/classes could allow learner-to-learner visibility; the access rules were not penetration-tested in this audit. `npm run verify:permissions` exists and was **not run**.
- Logs and error reporting were not inspected for PII leakage.
- No deletion request was executed end to end; only the presence of erasure code was confirmed.
- No local Data Protection Impact Assessment, safeguarding review, or jurisdiction-specific agreement exists for Bangladesh, India, Pakistan, Nepal or Sri Lanka.

## 4. Security findings

### P1 — `/api/ready` discloses the server's absolute data directory

Unauthenticated response included:

```json
"data":{"ok":true,"code":"writable","dir":"/Users/…/reports/.audit-tmp/store"}
```

No learner data is exposed, but the filesystem path, store mode and durability codes are operational intelligence. A public readiness endpoint should report `ok`/`not ok` and stable codes, not the path. Restrict the detail to a loopback/admin token or remove `dir`.

### P2 — `next start` is not the standalone production server

The build uses `output: "standalone"`. `npm run start` prints:

> `"next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.`

It served in this audit, but the warning means the documented `npm run start` is not the deployment path for the standalone artefact. `start-openmind.sh` is the production path; the documentation must say so consistently.

### P2 — untracked nested directory in the working tree

`git status` shows an untracked `NON PROFIT/` directory inside the project. It is a packaging risk (accidental inclusion in a build/archive) and should be removed or ignored before a release.

### Positive controls

- Capability secrets, not bare ids.
- Key-stripped serve view.
- Rate limits.
- AI write isolation.
- Durable-store refusal when storage is undeclared.
- `OFFICIAL_ITEMS = 0` with explicit provenance rather than a false board claim.

## 5. Operational readiness

| Area | State | Evidence |
|---|---|---|
| Build | **Pass** | `npm run build` exit 0 |
| Typecheck | **Pass** | `tsc --noEmit` exit 0 |
| Health | **Pass** | `/api/health` 200, cheap, no disk work |
| Readiness | **Pass with disclosure defect** | `/api/ready` 200; exposes path |
| Durable storage | **Conditional** | Requires `OPENMIND_DATA_DIR` or explicit ephemeral acceptance; audit ran ephemeral |
| Backup | **Script exists** | `scripts/backup-store.mjs`; not executed |
| Restore drill | **Not run** | `npm run restore-drill` not executed |
| Monitoring | **Not established** | No external uptime/error-reporting configuration inspected |
| Rollback | **Not established** | No deployment rollback procedure executed |
| Multi-instance | **Not supported by file store** | `singleInstance: true` |
| Migrations | **Scripts exist** | `npm run db:migrate`, `db:status`, `db:verify`, `db:rehearse`; not run |

## 6. What a supervised school pilot must put in place

1. **Local legal basis and consent**: parental/guardian consent, school agreement, retention period, deletion route, and a named data controller. The product's MIT licence is not a privacy framework.
2. **Local safeguarding review**: who sees learner records, how a teacher's roster is authorised, what happens if a child uses a shared handset, and how to report a concern.
3. **DPIA for the pilot**: purpose, data categories, storage location, retention, cross-border transfer (if any), and children's data.
4. **Durable, backed-up storage**: a declared directory on persistent storage, a nightly backup, and a **restored** backup tested before the pilot.
5. **Access review**: at minimum, run `npm run verify:permissions`, test two teachers/two classes, and confirm a teacher cannot read another class's records.
6. **Incident response**: a named contact, a breach procedure, and a log-retention policy.
7. **Remove `/api/ready` path detail** and confirm no PII in logs before the first learner signs in.

## 7. Verdict

**PARTIAL.** The capability model and answer-key handling passed the tests that matter most, and the product is unusually candid about what it does not claim. But `/api/ready` leaks operational detail, there is no evidence of a child-specific consent/safeguarding process, and backup/restore is unproven. Those are deployment gates, not polish. A pilot may proceed only with the local agreements and a tested restore in place.
