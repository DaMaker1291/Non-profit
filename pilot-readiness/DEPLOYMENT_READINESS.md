# Deployment readiness

**Current stage: pilot preparation only.** The 12-lesson pack is a technically checked review candidate, not a school pilot and not a deployment. No learner path is open.

```
npm run deployment:check -- --stage=pilot-preparation
  ✓ Stage 1 only: technically checked review candidate. No learner path is open.

npm run deployment:check -- --stage=controlled-pilot
  ✗ stage is blocked
```

The stage gate is `scripts/deployment-gate.mjs`; the external/technical evidence it reads is `pilot-readiness/DEPLOYMENT_EVIDENCE.json`. The gate derives lesson count, rights clearance, educator approvals, mapping reviews and lesson version from the real modules. It does not create approvals, names or dates.

## What is actually present

| Area | Status | Evidence / remaining condition |
|---|---|---|
| 1. Complete educational content | **Partial** | 12 lessons are complete and technically checked; 116 concepts have no complete lesson. One chemistry key and three diagrams were corrected in version `2026-11-01.3`. |
| 2. Curriculum coverage | **Partial / mismatched** | 25 source records. `linear-equations` and `coordinates` do not match their Class 10 mapping statements; the four number lessons are prerequisites. 0/12 mappings are reviewer-confirmed. |
| 3. Local-language teaching | **Blocked** | English only. No Hindi, Bengali, Urdu, Nepali, Sinhala or Tamil teaching or terminology review. |
| 4. Educator and school partnerships | **Blocked** | 0 educator approvals, no confirmed school/organisation, no agreed supervised pilot. |
| 5. Child safety, privacy and legal | **Blocked** | No consent, safeguarding, retention/deletion or jurisdiction-specific legal review. Automated permission tests are not legal advice. |
| 6. Production infrastructure and offline | **Partial** | Build and lesson browser walk pass. Durable store, backup/restore, permissions, complete offline journey, low-end device and WCAG 2.2 AA testing are **not verified for this deployment**. |
| 7. Educational effectiveness | **Not started** | 0 learners. No baseline, post-assessment, retention assessment or teacher observation. |
| 8. Teacher onboarding and support | **Blocked** | No training, support contact, incident process or post-publication correction workflow. |
| 9. Funding and governance | **Undefined** | No operating-cost model, funding route, data-governance owner or content-maintenance ownership recorded. |

## Stage gate

| Stage | What must be true | Current result |
|---|---|---|
| 1. Pilot preparation | 12 complete lessons; 12/12 rights-clear; versioned validation/review pack; no learner path | **PASS** — the gate warns this is Stage 1 only. |
| 2. Educator and school validation | Stage 1 + at least one real educator approval + a confirmed partner/scope | **BLOCKED** — 0 approvals, no partner. |
| 3. Controlled school pilot | 12/12 approvals; 12/12 reviewer-confirmed mappings; partner; legal and safeguarding review; durable store, backup/restore, permissions, offline, low-resource and accessibility evidence; teacher onboarding and named support | **BLOCKED** — all external and most technical evidence is absent. |
| 4. Limited country deployment | Stage 3 + verified learner evidence + language review + country-level approval | **BLOCKED** — no learner or language evidence. |
| 5. Multi-country deployment | Two or more country approvals, each with its own curriculum, language, legal and operational clearance | **BLOCKED** — no country approvals. |

`npm run deployment:check -- --self-test` proves the gate can refuse an incomplete stage and can pass only a fully synthetic, explicitly non-real evidence shape. It writes nothing.

## The honest next step

The next move is **not** another feature. It is to hand the review packet to a qualified CBSE mathematics and science teacher, then secure a partner school/organisation that can define the curriculum, language, devices, connectivity and safeguarding arrangements. After that, the technical gates in `production-check` and the learner pilot protocol can be run against a real scope.

## Commands

```bash
npm run deployment:check -- --stage=pilot-preparation
npm run deployment:check -- --stage=educator-validation
npm run deployment:check -- --stage=controlled-pilot
npm run deployment:check -- --stage=limited-country
npm run deployment:check -- --stage=multi-country
npm run deployment:check -- --self-test
```

No approval, reviewer, partner, legal review, learner or learning-effectiveness claim is invented by this document or the gate.
