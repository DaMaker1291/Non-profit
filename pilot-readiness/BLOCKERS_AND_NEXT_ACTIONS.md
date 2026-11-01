# Blockers and next actions

## External blockers (cannot be simulated)

1. **No qualified subject teacher has reviewed any lesson.** All 12 are `needs-educator-review`; `PILOT_APPROVALS` is empty. This is the first blocker and the only one a coding agent cannot clear.
2. **No school or local education partner.** Curriculum relevance, language choice, device conditions and safeguarding arrangements are unconfirmed.
3. **No learner evidence.** No learning-effectiveness claim is possible.

## Product/content blockers

4. **116 concepts remain without a complete lesson.** They are gated behind “not available as a lesson,” not silently taught.
5. **Science mappings are `portal`-verified only.** A teacher must check the headings against the official CBSE PDF, including the edition and any topic wording that changed.
6. **No local-language teaching.** The pilot is English-medium only; the page refuses to present an English plan as a Hindi/Bengali/Urdu lesson.
7. **Class assignment is deliberately closed.** Because no lesson is approved, `assignableConcepts` returns an empty list; the picker says there is no work to set. This is the approved-only gate working, not a bug to “fix” by allowing candidates.
8. **Offline learning is incomplete.** Reading is cached; marking needs the server. No complete offline journey has been tested.
9. **Low-resource performance is unmeasured after this change.** The lesson route still loads the question-bank bundle; no throttled-device test was run.
10. **Safeguarding/consent workflow is absent.** Required before any real learner.
11. **The review form is offline and human-operated.** `npm run pilot:review` validates a record; it cannot create a reviewer or an approval.
12. **Two mathematics lessons do not match their Class 10 mapping statements.** `linear-equations` teaches one-variable equations while the CBSE entry names two-variable linear equations; `coordinates` teaches plotting/straight-line graphs while the entry names distance, section and area formulas. A teacher must decide whether the prerequisite content is appropriate, or the lessons must be revised before approval.
13. **Four mathematics lessons are foundations, not Class 10 depth.** Fractions, decimals, negatives and order of operations are prerequisites; the pack does not claim they cover the Class 10 Number Systems chapter.
14. **Most external sources are not rights-cleared for ingestion.** The registry has 25 records; only the 2 OpenMind-authored records are ingestible. NCERT is all-rights-reserved; DIKSHA, eLearn Punjab, ROC, UNESCO-IBE, OER Commons, Kolibri, CK-12, Siyavula and GeoGebra are unknown or item-specific; OpenStax, PhET and MIT OCW have a stated CC basis but no primary proof on file. Any future import must clear the exact item first.

## Deployment gate

`npm run deployment:check -- --stage=pilot-preparation` passes only Stage 1. `npm run deployment:check -- --stage=controlled-pilot` currently refuses with the full blocker list; see `DEPLOYMENT_READINESS.md` and `DEPLOYMENT_EVIDENCE.json`. Do not populate that evidence file with synthetic names to make the gate green.

## Immediate next actions

- Hand `PILOT_LESSONS_REVIEW_PACK.md` to a CBSE mathematics and science teacher. Ask them to copy `REVIEW_RECORD_TEMPLATE.json`, fill in their own identity, role, date, scope, lesson version and checklist, and return it.
- Validate the returned record with `npm run pilot:review -- --file <record>.json`. If the decision is `approve`, a project owner must make a deliberate code change to `PILOT_APPROVALS`; the CLI will print the exact fields it justifies.
- Re-run `npm run pilot:check` after that edit and confirm the approved lesson appears in `approvedPilotPath()` and in the teacher’s assignment picker.
- Run `npm run verify:lesson` and a clean 320-px walk of all four science lessons and the learner journey on the final approval state.
- If a partner supplies OER, record its exact item licence and proof in `lib/source-registry.ts` before ingesting; unknown rights remain blocked.
- Run `npm run e2e` only after an approval fixture exists that does not fabricate a reviewer; update its assignment section to assert the approved-only refusal or use a genuinely approved lesson.
- Run `npm run production-check`, `npm run restore-drill`, the storage conformance gate, `npm run verify:sync`, and an accessibility/low-end-device pass.
- Do not open a learner path, publish an effectiveness claim, or describe the pack as South Asia-ready until external review and a supervised learner pilot exist.
