# Safety and operations gate

## Changed in this pass
- `/api/ready` no longer returns the absolute data-directory path; a write failure reports only a stable code and errno.
- Teacher assignment no longer offers a concept with no complete lesson, and accepts only a lesson whose state is `approved-for-pilot`. With zero approvals the picker is empty; the broader `curriculumConcepts` view still reports what the course contains.
- `/pilot` and `/pilot/[concept]` are public content pages: no learner record, no session, no write.
- Approval records cannot be created by the application; `PILOT_APPROVALS` is empty and validated for reviewer, role, date, scope, version and full checklist.
- `npm run pilot:review` validates a human-supplied record but does not write an approval. It refuses a tool name as reviewer, a future date, an incomplete checklist and an old version.
- `lib/source-registry.ts` blocks ingestion when the licence is unknown or primary rights proof is absent. Its generated report is `pilot-readiness/SOURCE_AND_RIGHTS_REGISTRY.md`. The 12 lessons are OpenMind-authored and embed no external asset.

## Previously verified (audit)
- Cross-profile GET and POST returned 401; a profile id without its secret returned 401.
- `/api/question` withheld answer, explanation and misconception tags.

## Not verified in this pass
- The source registry is an operational default, not legal advice. No external OER/textbook is ingested.
- No E2E, production-check, permissions, backup or restore drill was run.
- No parental-consent, age-verification or safeguarding workflow exists. A responsible adult and local organisation must review data collection, consent, retention, deletion and incident reporting before any real learner uses the product.
- Automated security tests are not a legal-compliance claim.
