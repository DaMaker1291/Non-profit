# Interoperability exports

Three formats, because a platform is adopted through the systems a ministry
already owns: **QTI** moves the questions, **OneRoster** moves the people, and
**CASE** moves the curriculum. Without them, "use OpenMind" is a procurement
fight; with them, a content team can drop the item bank into the LMS they already
bought.

All three are implemented with no dependencies, are deterministic (the same
content exports byte-identical), and are public except the roster — which is one
teacher's document about named children.

| Format | Endpoint | Audience | Delivered as |
|---|---|---|---|
| QTI 2.2 | `GET /api/export/qti?concept=<id>&limit=<n>` | public | `application/zip` |
| OneRoster 1.2 (CSV binding) | `GET /api/export/oneroster?class=<id>` | the class's teacher | `application/zip` |
| CASE 1.1 (JSON) | `GET /api/export/case?spec=<id>` | public | `application/json` |

## QTI 2.2 — `lib/export/qti.ts`

A package containing `imsmanifest.xml` (IMS Content Package 1.1.4) and one
`items/<n>-<itemId>.xml` per item, each a QTI 2.2 `assessmentItem` with a
`responseDeclaration` (single identifier), an SCORE outcome, and a
`choiceInteraction` of `maxChoices="1"`.

Three decisions worth knowing before importing:

- **The explanation is not in the export.** `Question.explanation` names or
  derives the correct answer, so an item carrying it would leak the key through
  any feedback or review view in the receiving system.
- **`shuffle="true"` is set on every interaction.** This bank has a measured
  option-length tell (see `ASSESSMENT_VALIDITY.md`); exporting authored order as
  fixed would export the bias with it.
- **Numeric items arrive as choice items.** They already carry an MCQ projection
  (`choices` + `answer` aligned with the true value), so nothing is lost, and no
  tolerance semantics are pushed onto an importer that cannot know them.

`limit` defaults to 12 and is clamped to 1–40. Items are drawn deterministically
from the concept's own ceiling (`conceptDepth`), de-duplicated by prompt, so two
downloads of the same URL give the same package.

Drawing is real CPU work (up to ~2,000 generator calls at the maximum limit), so
the route names its bound: a hard per-address budget when the deployment declares
a trusted proxy, and a soft process-wide one that applies on every deployment.
The OneRoster and CASE routes are cheap maps and carry none.

## OneRoster 1.2 — `lib/export/oneroster.ts`

Seven CSVs — `manifest.csv`, `orgs.csv`, `academicSessions.csv`, `courses.csv`,
`classes.csv`, `users.csv`, `enrollments.csv` — with the standard's column order,
ISO-8601 dates and RFC 4180 quoting (a handle containing `,` or `"` must not shift
a row).

**The privacy rule is absolute: `email` is empty on every row.** The product does
not hold a child's email address — the account's address is the adult-side
credential and is not on the profile — and filling that column would mean joining
two stores to invent contact details the receiving system did not need.
`username` and `givenName` are the learner's handle; `familyName` is empty.
Columns a receiving system requires but we do not hold (grades, periods,
location) are present and empty rather than omitted: a missing header is a schema
failure, an empty value is a fact.

**The teacher travels with the roster.** The class view's member list answers the
learners by design — it is the monitor a teacher reads — so the route adds the
people who teach the class: the caller first, then any co-teacher on the same
roster, each as a `users.csv` row with `role=teacher` and an `enrollments.csv` row.
Exactly one teacher is marked `primary=true` (the caller); learners are
`primary=false`. A package built from the member list alone describes a section
with nobody teaching it, and an importing SIS would then have to be told by hand
who does — the chore the export exists to remove.

Authorisation is `isTeacherOf` — the same rule that decides who may set a class's
work (`lib/server/class-membership.ts`). Membership alone is not enough: a learner
could otherwise export their classmates. Both credentials work (`authorisedProfile`):
a session that owns the profile, or the profile's capability secret.

## CASE 1.1 — `lib/export/case.ts`

A `CFPackage` with a `CFDocument`, one `CFItem` per concept in the declared course
(`courseConceptIds`), `isChildOf` associations built from the prerequisite graph
(origin = the child, destination = its prerequisite), and one `CFConcept` per
concept. Concept ids are the `humanCodingScheme`, so a ministry can quote them in
a syllabus mapping.

Associations whose prerequisite falls outside the exported course are omitted
rather than given a stub node: a dangling reference is a schema error, and the
absence honestly says "this course assumes knowledge taught elsewhere".

`lastChangeDateTime` is a fixed build constant, not `Date.now()`, so two exports of
unchanged content are byte-identical and a reviewer can diff them.

## What these exports do not claim

- **No ministry alignment.** The framework states what this bank teaches. Mapping
  it to a national syllabus is human review, and `audit/status.json` records that
  `Pathways whose syllabus mapping has been reviewed: 0`.
- **No third-party content.** `lib/question-bank.ts` records `OFFICIAL_ITEMS === 0`
  — no board question is bundled — so an export cannot imply a licensed past paper.
- **Not available offline.** The static build has no server, so `app/api/export/*`
  exists only on a running deployment. The offline pack (`/api/pack-export`) is the
  download that works with no connection.
- **No compression.** The ZIP writer stores entries uncompressed, which every
  unzipper reads. It is not a minimal archive, and it does not pretend to be.
