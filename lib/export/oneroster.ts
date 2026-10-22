// ─────────────────────────────────────────────────────────────────────────────
// ONEROSTER 1.2 (CSV binding) — a class roster another system can import.
//
// OneRoster is what school information systems and most national platforms speak
// when they exchange users, classes and enrolments. A teacher who can hand their
// class to the school's own system, and get it back, does not have to run two
// registers — and a ministry evaluating this product can ask "does it export our
// roster?" and get a file rather than a promise.
//
// THE PRIVACY RULE, AND IT IS ABSOLUTE. OneRoster's `users.csv` has an `email`
// column, and this exporter writes an EMPTY STRING in it — always. The roster the
// product actually holds is a learner id and a chosen handle; it does not hold a
// child's email address (the account's address is the adult-side credential and is
// not on the profile). Emitting one would mean joining two stores to invent a
// column the receiving system did not need, and it would turn "export a roster"
// into "export contact details for every child in the class" — which is the exact
// thing a DPIA asks you not to do. `givenName`/`familyName` are the handle and an
// empty string for the same reason: a handle is what the teacher already sees.
//
// THE SHAPE IS THE STANDARD'S, NOT OURS. Column order is the CSV binding's, dates
// are ISO-8601, `status` is `active`, and the ids are stable sourcedIds derived
// from our own ids so a re-import updates rather than duplicates. Anything a
// receiving system requires but we do not hold (grades, periods, location) is
// present and empty rather than omitted: a missing header is a schema failure,
// an empty value is a fact.
// ─────────────────────────────────────────────────────────────────────────────
import type { ClassRoster } from "../types";
import { zipStore } from "./zip";

const CRLF = "\r\n";

/** RFC 4180 quoting. A handle containing a comma or a quote must not shift every
 *  later column by one — that failure looks like corrupted data, not like a bug. */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function csv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvField).join(",")).join(CRLF) + CRLF;
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

/** A zip-safe file name fragment. Join codes are alphanumeric by construction,
 *  but a legacy roster's code is stored text, not a guarantee. */
function fileToken(text: string): string {
  const cleaned = text.replace(/[^A-Za-z0-9_-]/g, "");
  return cleaned.length ? cleaned : "class";
}

/** A person in the package, and WHAT THEY ARE IN THE CLASS.
 *
 * The role is carried rather than assumed, because the class view's member list is
 * deliberately the LEARNERS (lib/server/class-view#resolveMembers drops the
 * teacher). A package built only from that list is a class with no teacher in it:
 * an importing SIS creates the section and then cannot say who teaches it, which
 * is a roster that needs fixing by hand on the receiving side — the exact work an
 * export exists to remove. The route adds the teachers with this role. */
export type OneRosterRole = "student" | "teacher";

export interface OneRosterMember {
  id: string;
  handle: string;
  role?: OneRosterRole;
}

/**
 * The seven CSV files OneRoster 1.2 requires, keyed by filename.
 *
 * `members` is resolved by the CALLER (the route asks lib/server/class-view for
 * the class's students by identity, then adds the teachers), so this function has
 * no storage dependency and can be exercised with a fixture.
 */
export function oneRosterCsvBundle(input: {
  cls: ClassRoster;
  members: ReadonlyArray<OneRosterMember>;
  now?: number;
}): Record<string, string> {
  const { cls, members } = input;
  // OneRoster's `primary` flag marks the ONE teacher a class is taught by; it is
  // not a per-row "enrolled" flag. Stamped on the first teacher only, and never on
  // a learner, so a receiving system does not read every student as a head of
  // department.
  const firstTeacher = members.find((m) => m.role === "teacher")?.id;
  // Determinism: defaulting to the roster's own creation time means exporting the
  // same class twice produces the same bytes unless the class changed.
  const at = input.now ?? cls.createdAt;
  const stamp = iso(at);

  const schoolId = `om-org-${cls.id}`;
  const termId = `om-term-${cls.id}`;
  const courseId = `om-course-${cls.id}`;
  const classId = `om-class-${cls.id}`;
  const subject = cls.subject ?? "";
  const courseCode = cls.specificationId ?? subject;
  const year = new Date(at).getUTCFullYear();
  const termStart = iso(at).slice(0, 10);
  const termEnd = iso(at + 365 * 24 * 60 * 60_000).slice(0, 10);

  const manifest = csv([
    ["propertyName", "value"],
    ["manifest.version", "1.0"],
    ["oneroster.version", "1.2"],
    ["file.academicSessions", "academicSessions.csv"],
    ["file.orgs", "orgs.csv"],
    ["file.courses", "courses.csv"],
    ["file.classes", "classes.csv"],
    ["file.users", "users.csv"],
    ["file.enrollments", "enrollments.csv"],
  ]);

  const orgs = csv([
    ["sourcedId", "status", "dateLastModified", "name", "type", "identifier", "parentSourcedId"],
    [schoolId, "active", stamp, cls.name, "school", "", ""],
  ]);

  const academicSessions = csv([
    ["sourcedId", "status", "dateLastModified", "title", "type", "startDate", "endDate", "parentSourcedId", "schoolYear"],
    [termId, "active", stamp, `${year} school year`, "schoolYear", termStart, termEnd, "", String(year)],
  ]);

  const courses = csv([
    ["sourcedId", "status", "dateLastModified", "schoolYearSourcedId", "title", "courseCode", "grades", "orgSourcedId", "subjects", "subjectCodes"],
    [courseId, "active", stamp, termId, cls.name, courseCode, "", schoolId, subject, courseCode],
  ]);

  const classes = csv([
    ["sourcedId", "status", "dateLastModified", "title", "grades", "courseSourcedId", "classCode", "classType", "location", "schoolSourcedId", "termSourcedIds", "subjects", "subjectCodes", "periods"],
    [classId, "active", stamp, cls.name, "", courseId, cls.joinCode, "scheduled", "", schoolId, termId, subject, courseCode, ""],
  ]);

  // `email` is the empty string on EVERY row — see the header. It is not a value
  // we failed to look up; it is a column we refuse to fill.
  const users = csv([
    ["sourcedId", "status", "dateLastModified", "enabledUser", "orgSourcedIds", "role", "username", "userIds", "givenName", "familyName", "middleName", "identifier", "email", "sms", "phone", "agents", "grades", "password"],
    ...members.map((m) => [
      `om-user-${m.id}`,
      "active",
      stamp,
      "true",
      schoolId,
      m.role ?? "student",
      m.handle,
      "",
      m.handle,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  ]);

  const enrollments = csv([
    ["sourcedId", "status", "dateLastModified", "classSourcedId", "schoolSourcedId", "userSourcedId", "role", "primary", "beginDate", "endDate"],
    ...members.map((m) => [
      `om-enrollment-${cls.id}-${m.id}`,
      "active",
      stamp,
      classId,
      schoolId,
      `om-user-${m.id}`,
      m.role ?? "student",
      m.id === firstTeacher ? "true" : "false",
      termStart,
      "",
    ]),
  ]);

  return {
    "manifest.csv": manifest,
    "orgs.csv": orgs,
    "academicSessions.csv": academicSessions,
    "courses.csv": courses,
    "classes.csv": classes,
    "users.csv": users,
    "enrollments.csv": enrollments,
  };
}

/** The same bundle as a ZIP, which is how a OneRoster CSV package is delivered:
 *  one file, seven CSVs, no instructions. */
export function oneRosterPackage(input: {
  cls: ClassRoster;
  members: ReadonlyArray<OneRosterMember>;
  now?: number;
}): Uint8Array {
  const bundle = oneRosterCsvBundle(input);
  return zipStore(
    Object.entries(bundle).map(([path, data]) => ({ path, data })),
  );
}

/** The download name for a class's package. Exported so the route and any future
 *  caller cannot disagree about it — a name that changes between two doors is a
 *  user's downloads folder filling with near-duplicates. */
export function oneRosterFileName(cls: ClassRoster): string {
  return `openmind-class-${fileToken(cls.joinCode || cls.id)}.oneroster.zip`;
}
