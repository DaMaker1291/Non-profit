# Educational-validation integration report

**Date:** 9–10 November 2026
**Scope:** authenticated teacher review intake, persistence and restart survival
**Technical status:** PASS
**Educator evidence:** NOT ESTABLISHED — the account and review are fixtures

## Bottom line

A teacher-role account signed in through the real sign-in form, reached
`/lesson-review` through the teacher console, submitted a version- and
hash-specific review through `POST /api/lesson-review`, and read it back from
the page, the API and the scratch store. After the application was stopped and
started again against the same directory, the same review, finding and open
improvement task were still present. The server derived the reviewer from the
session: the browser sent no reviewer, account id or source field.

This proves the integration, not educator judgement. The account is a labelled
fixture, the review text says it is a fixture, and no pupil used the lesson. The
catalogue therefore remains at **0 educator-reviewed and 0 learner-tested**.

## Test environment and isolation

| Item | Value |
| --- | --- |
| Application | Next.js dev server at `http://127.0.0.1:4173` |
| Scratch store | `/tmp/openmind-validation-browser-run-c` |
| Store declaration | `OPENMIND_DATA_DIR=/tmp/openmind-validation-browser-run-c` |
| Ephemeral acknowledgement | `OPENMIND_ALLOW_EPHEMERAL_STORE=1` |
| Live store | `.openmind-data` — not opened for writes by this run |
| Teacher fixture | `validation-browser-teacher-vb3-20261109@example.test` (account `acc_647878fdc53745a6bf3e577eb8148236`) |
| Learner fixture | `validation-browser-student-vb3-20261109@example.test` |
| Lesson | `ratio`, version `1.0.0` |
| Content hash | `bb9379a0927d31572417299c2530d0d977b36812bb7ee83f49b2345822803272` |
| Review | `lr_186fe635bc444f77921a21dd0cee7210` |
| Improvement task | `lr_186fe635bc444f77921a21dd0cee7210-f1` |

The real store check after the run found **no file under `.openmind-data` newer
than 00:00**, and no `.openmind-data/lesson-validation.json`. The approval
registry in `lib/pilot-review.ts` is unchanged; no approval was created.

## The browser journey

The walk is `scripts/validation-browser-check.mjs`. It uses Chrome over CDP,
real typing and real click events; it does not call the review endpoint from
Node and present that as a browser result.

1. Open `/onboarding?role=teacher&mode=signin` and sign in through the visible
   email/password form.
2. Complete the teacher profile step and reach `/teacher`.
3. Follow the console's **Review authored lessons** link to `/lesson-review`.
4. Follow the **Ratio** link to `/lesson-review/ratio`.
5. Fill the actual form: qualifications, scope, one finding (location,
   problem, educational consequence, recommendation, severity `major`), the
   `Request changes` decision and the review notes.
6. Press **Record human review** and observe the recorded-review notice.

The form named the signed-in account and stated that the server records the
account rather than a name supplied by the form.

## Submission evidence

- **Browser request:** `POST /api/lesson-review`
- **HTTP response:** `200`
- **Request body contained:** `lessonId`, `lessonVersion`, `contentHash`,
  `reviewRole`, `qualifications`, `scope`, `criteria`, `decision`, `findings`
  and `notes`.
- **Request body did not contain:** `reviewer`, `accountId` or `source`.
- **No test-only identity header:** no `x-openmind` header was sent.
- **Version pin:** the submitted version matched the version rendered on the
  form (`1.0.0`).
- **Hash pin:** the submitted hash was a full 64-character hash and matched the
  hash shown on the form.
- **Resulting decision:** `changes-requested`.
- **Stored reviewer:** account id `acc_647878fdc53745a6bf3e577eb8148236`, name
  `Validation Browser Teacher`, `accountRole: "teacher"`,
  `reviewRole: "subject-teacher"`, `source: "human"`,
  `authority: "teacher-account"`.
- **Stored task:** one task, `status: "open"`, `severity: "major"`, retaining
  the finding's location, problem and recommendation.

The submit phase reported **38 passed, 0 failed**. The evidence file records the
same count: `checksPassed: 38`, `checksFailed: 0`.

## Persistence and restart evidence

The scratch `lesson-validation.json` held one review and one task after the
submit phase. The review retained its id, version, content hash, reviewer
account and notes; the task retained the finding and stayed open.

The dev server was then stopped and started again with the **same**
`OPENMIND_DATA_DIR`, and the teacher signed in again through the same form.
The walk then observed:

- the review page still reports “A human reviewer requested changes to this
  version”;
- the review notes, reviewer name, finding, version `1.0.0` and reviewed hash
  are still shown;
- `/lesson-review` still counts the review and finding task and renders the
  finding;
- `GET /api/lesson-review` still returns the same review id, notes and task id;
- the task is still `open`;
- the stored review's `createdAt` is unchanged;
- the stored reviewer is still the authenticated account.

The after-restart phase reported **18 passed, 0 failed**, with
`survivedRestart: true`.

## Re-verification after the API-client refactor

The form now calls `submitLessonReview` through `lib/api/client.ts` rather than
calling `fetch` directly. The full browser roll was re-run against a fresh
scratch store after that change: the submit phase reported **38 passed, 0
failed**, and the after-restart phase reported **18 passed, 0 failed**. The
harness also waits for the teacher console's hub card to hydrate before
clicking the review link; the earlier timeout was a harness race, not a product
failure. The fixture review remains labelled as a fixture and is still not
human evidence.

## Negative and authority checks

`npm run validation:check` reported **28 passed, 0 failed** against a temporary
store. `npm run validation:http` reported **22 passed, 0 failed** against a
separate scratch-store dev server. Together they exercise the required refusals:

| Required behaviour | Observed result |
| --- | --- |
| Unauthenticated user cannot submit | `401 teacher_account_required` |
| Learner cannot submit or approve | `403 teacher_role_required` |
| AI-generated approval is refused | `422` at the HTTP door; an AI-sourced record is not a human review |
| Blocking finding prevents approval | `422`; an approval carrying a blocking finding is refused |
| Old version or content hash does not approve a revised lesson | `409 review_stale` for both old version and old hash; resolves as `stale`, not approved |
| Completed improvement task does not approve a later version | The completed task remains distinct; the later version still needs its own review |

The HTTP suite also confirmed that a blank form is refused with its reasons
(`422`, nine problems), a done task requires a real resolution note (`422`), a
teacher can record that resolution (`200`), the review and task survive a round
trip, and completing the task does not convert the review into an approval.

## Accessibility evidence — three distinct layers

These are deliberately not collapsed into a single “accessible” claim.

**1. Structural and scripted checks.** `npm run verify:a11y` reported **96
passed, 0 failed** against the running app. It covers the public routes,
`/access`, 200% browser zoom with reflow at 640 CSS px, computed contrast on a
sample of visible text, focus visibility, rendered maths, a diagram's accessible
name and labelled callout controls, keyboard submission of the public
calculation activity, and phone navigation operated by tap at 390 × 844. This is
a structural smoke test, not a WCAG conformance claim.

**2. Measured browser accessibility.** The checks above were made in a real
Chrome session and measured the DOM and interaction they describe. That is
different from asserting what a screen reader announces, and the audit says so
in its own output.

**3. Manual assistive-technology testing.** **NOT PERFORMED.** No VoiceOver or
NVDA session, no switch/eye-gaze input, no captioning review and no
keyboard-only completion of a whole learner lesson was conducted. The status in
`reports/lesson-quality/ASSISTIVE_TECHNOLOGY.md` remains **NOT PERFORMED** and
must not be changed without the session record it specifies.

## Production build

`npm run build` completed with **exit 0** and generated **70 pages**, including
`/lesson-review` and `/lesson-review/[conceptId]`. The log is
`/tmp/openmind-production-build.log`. The build was run with the scratch store
declared. It proves the routes compile and prerender as the production build
expects; it is not a deployment, and the app was exercised on the dev server.

`next-env.d.ts` was restored byte-for-byte after that build. A later bare
`npm run dev` flipped it again to the `.next-dev` reference; that is the
documented generated-file behaviour, not a source change, and it is left
uncommitted with the rest of the work.

## What was corrected during this pass

- `app/teacher/page.tsx` gained the one link needed for the normal journey from
  the teacher console to `/lesson-review`.
- `scripts/validation-browser-check.mjs` was added and wired as
  `npm run validation:browser`, with submit and after-restart phases.
- The browser walk originally wrote its evidence JSON before its last three
  assertions, so the file said 35 for a 38-assertion run. The write now happens
  after the final assertion; the recorded evidence for the cited run says 38
  and 18, matching the console output.
- Two earlier reruns failed before producing clean evidence: one was stuck on
  the onboarding `Loading…` fallback after a stale `.next-dev` cache, and one
  reached the teacher console but the 25-second queue wait expired while the dev
  server compiled the cold `/lesson-review` route. A clean restart with the same
  scratch store and pre-warmed routes resolved both. No product code was changed
  for that harness/environment behaviour.
- An intermediate after-restart run reported 17/1 because the HTTP suite had
  added a later `ratio` review and the lesson page intentionally shows only the
  latest record. The fixture review was intact in the API, ledger and task. The
  cited run used a fresh scratch store, so the reviewed record is unambiguously
  the current one and the page check is meaningful.

## Limitations

- **No genuine teacher or learner.** The teacher account, the review text and
  the finding are marked fixtures. This is not a teacher's subject judgement and
  cannot move a lesson to `educator_reviewed`. No learner result was simulated
  or claimed.
- **No manual assistive-technology session.** See above; structural checks are
  not a substitute.
- **Dev-server, not deployed production runtime.** The build compiled, but the
  browser and API checks ran against `next dev` on port 4173. Nothing was
  deployed, and the production server on port 3000 was not restarted.
- **Shared volume.** Free space was about 5.0 GB at the time of the run. The
  full `npm run verify` and `production-check` suites were not re-run in this
  pass; only the checks listed here were run. The volume is not used by this
  project alone.
- **Scratch data is ephemeral.** The evidence lives under `/tmp` and will not
  survive a reboot or a `/tmp` cleanup. It is intentionally outside the
  repository and outside `.openmind-data`.
- **No commits, pushes, deployments or production-data changes.** The working
  tree also contains earlier uncommitted work, which was preserved.

## Evidence artefacts

| Artefact | Path |
| --- | --- |
| Submit-phase evidence (38/0) | `/tmp/openmind-validation-browser3-submit-evidence.json` |
| After-restart evidence (18/0) | `/tmp/openmind-validation-browser3-evidence.json` |
| Fixture identifiers | `/tmp/openmind-validation-browser3-fixture.json` |
| API read-back | `/tmp/openmind-validation-browser3-api.json` |
| Scratch review/task ledger | `/tmp/openmind-validation-browser-run-c/lesson-validation.json` |
| HTTP suite output (22/0) | `/tmp/openmind-validation-http-run-c.log` |
| Re-verification submit log (38/0) | `/tmp/openmind-validation-rerun2-submit.log` |
| Re-verification after-restart log (18/0) | `/tmp/openmind-validation-rerun2-restart.log` |
| Production build log | `/tmp/openmind-production-build.log` |
| Accessibility audit output (96/0) | `/tmp/openmind-a11y-validation.log` |
| Manual AT status | `reports/lesson-quality/ASSISTIVE_TECHNOLOGY.md` |

## Definition-of-done assessment

An authenticated teacher-role session submitted a version-specific review
through the actual interface and the actual `POST /api/lesson-review` endpoint;
the decision, finding and open task persisted in the declared scratch store and
survived an application restart. The remaining limitation is categorical, not
technical: the session belongs to a fixture account, so this is evidence that
the path works, not evidence that a teacher approved or rejected the lesson.
