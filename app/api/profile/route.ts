import { NextResponse } from "next/server";
import { getProfile, newProfileState, publicProfileState, saveProfile } from "@/lib/server/store";
import { accountFromRequest, newProfileId } from "@/lib/server/auth";
import { isBoardId, type ProfileState, type StudentProfile, type SubjectCourse, type SubjectId } from "@/lib/types";
import { coversSubject, incompleteSubjects, specById } from "@/lib/specifications";

const SUBJECTS: SubjectId[] = ["maths", "physics", "chemistry", "biology", "computing"];

/** One per-subject course entry, validated field by field.
 *
 *  A course is only valid FOR A SUBJECT if the qualification contains that
 *  subject, so an entry naming a qualification the subject is not part of is
 *  REFUSED BY NAME rather than dropped — a silent drop is how a learner ends up
 *  believing they chose a course the engine never read. */
type CoursePatch = SubjectCourse | null;

function courseEntry(
  raw: unknown,
  subject: SubjectId,
  current: SubjectCourse | undefined,
  fallbackSpec: string | undefined,
): { entry: CoursePatch } | { error: string } {
  if (raw === null) return { entry: null };
  if (typeof raw !== "object" || Array.isArray(raw)) return { error: "bad_subject_course" };
  const body = raw as Record<string, unknown>;
  const entry: SubjectCourse = { ...(current ?? {}) };

  if (body.spec === null) {
    delete entry.spec;
    delete entry.specLevel;
  } else if (typeof body.spec === "string") {
    const spec = specById(body.spec);
    // Either the id means nothing, or it is a real qualification this subject
    // is not part of (Biology under a maths-only paper). Both are refusals.
    if (!spec) return { error: "unknown_spec" };
    if (!coversSubject(spec, subject)) return { error: `spec_does_not_teach_${subject}` };
    entry.spec = spec.id;
    const level = body.specLevel;
    // A tier that belongs to a DIFFERENT qualification is REFUSED, never
    // silently replaced by the course's first tier: a learner who chose Higher
    // and was stored on Foundation would be wrong about their own course, and
    // the depth of every question they are served would be wrong with it.
    if (typeof level === "string" && level.length > 0) {
      if (!spec.levels.some((l) => l.id === level)) return { error: "bad_spec_level" };
      entry.specLevel = level;
    } else if (!entry.specLevel) {
      entry.specLevel = spec.levels[0].id;
    }
  } else if (typeof body.specLevel === "string" && body.specLevel.length > 0) {
    const spec = specById(entry.spec ?? fallbackSpec);
    if (!spec) return { error: "spec_level_without_course" };
    if (!spec.levels.some((l) => l.id === body.specLevel)) return { error: "bad_spec_level" };
    entry.specLevel = body.specLevel;
  }

  if (isBoardId(body.board)) entry.board = body.board;
  else if (body.board === null) delete entry.board;
  if (typeof body.exam === "string") entry.exam = body.exam.slice(0, 40);
  if (body.examDate === "" || body.examDate === null) delete entry.examDate;
  else if (typeof body.examDate === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.examDate)) return { error: "bad_exam_date" };
    entry.examDate = body.examDate;
  }

  // An entry that names nothing is not a course; store no entry at all rather
  // than an empty object the gap report would have to special-case.
  return { entry: Object.keys(entry).length > 0 ? entry : null };
}

/** Load a profile and decide whether this caller may touch it.
 *
 *  Three credentials are accepted, and nothing else:
 *   1. a signed-in account that owns the profile (real sign-in), or
 *   2. the profile's capability secret (the anonymous path), or
 *   3. a profile that has no secret yet — the legacy migration, where the
 *      first writer's token becomes the credential and is then immutable.
 */
async function authorize(
  req: Request,
  state: ProfileState,
  presented: unknown,
): Promise<boolean> {
  const account = await accountFromRequest(req);
  if (account && account.profileId === state.profile.id) return true;
  const secret = typeof presented === "string" ? presented : "";
  if (!state.secret) {
    if (secret.length < 16 || secret.length > 128) return false;
    state.secret = secret;
    await saveProfile(state);
    return true;
  }
  if (secret.length > 0 && secret === state.secret) return true;
  // A signed-in visitor may read their own profile even if this browser never
  // held the secret (fresh device) — but only their own.
  return Boolean(account && account.profileId === state.profile.id);
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const account = await accountFromRequest(req);
  const id = searchParams.get("id") ?? account?.profileId ?? null;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const state = await getProfile(id);
  if (!state) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!(await authorize(req, state, searchParams.get("secret")))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Same derived gap report the write returns, so a reader can always tell
  // whether this learner's courses are finished without recomputing the rule.
  return NextResponse.json({ ...publicProfileState(state), courseGaps: incompleteSubjects(state.profile) });
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Partial<StudentProfile> & Record<string, unknown> & { id?: string };
    const account = await accountFromRequest(req);

    // Load existing, or create. A signed-in learner writing without an id is
    // writing to their own profile — an account is never profile-less.
    const requestedId = body.id ?? account?.profileId;
    let state: ProfileState | null = requestedId ? await getProfile(requestedId) : null;
    const isNew = !state;
    if (!state) {
      const seedSecret = typeof body.secret === "string" && body.secret.length >= 16 && body.secret.length <= 128
        ? body.secret
        : undefined;
      state = newProfileState(newProfileId(), {});
      if (seedSecret) state.secret = seedSecret;
      await saveProfile(state);
    } else if (!(await authorize(req, state, body.secret))) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const p = state.profile;
    if (typeof body.handle === "string" && body.handle.trim()) p.handle = body.handle.trim().slice(0, 24);
    if (typeof body.country === "string" && /^[A-Z]{2}$/.test(body.country)) p.country = body.country;
    if (typeof body.birthYear === "number" && body.birthYear > 1900 && body.birthYear <= new Date().getFullYear()) p.birthYear = body.birthYear;
    if (typeof body.language === "string" && body.language.length <= 8) p.language = body.language;
    // The four language roles (interface / taught in / answered in / school).
    for (const key of ["teachingLang", "answerLang", "schoolLang"] as const) {
      const v = body[key];
      if (typeof v === "string" && v.length <= 8) p[key] = v;
    }
    if (!p.teachingLang) p.teachingLang = p.language;
    if (!p.answerLang) p.answerLang = p.teachingLang;
    if (!p.schoolLang) p.schoolLang = p.language;
    if (typeof body.grade === "string") p.grade = body.grade.slice(0, 24);
    if (typeof body.examples === "string") p.examples = body.examples.slice(0, 24);
    if (body.termsMode === "local" || body.termsMode === "mixed") p.termsMode = body.termsMode;
    if (body.explainLen === "short" || body.explainLen === "full") p.explainLen = body.explainLen;
    if (Array.isArray(body.resources)) {
      p.resources = (body.resources as unknown[])
        .filter((r): r is string => typeof r === "string")
        .map((r) => r.slice(0, 24))
        .slice(0, 8);
    }
    // One registry (lib/types.ts BOARD_IDS) — a hand-written list here meant a
    // new board could be offered by the UI and silently rejected on save.
    if (isBoardId(body.board)) p.board = body.board;
    // Curriculum specification + level (§1): the 25 specs in
    // lib/specifications.ts own coverage, difficulty and terminology.
    if (body.spec === null) {
      delete p.spec;
      delete p.specLevel;
    } else if (typeof body.spec === "string") {
      const spec = specById(body.spec);
      if (spec) {
        p.spec = spec.id;
        const level = body.specLevel;
        // Same rule as the per-subject path: a named tier the qualification does
        // not have is an error, not something to quietly overwrite.
        if (typeof level === "string" && level.length > 0) {
          if (!spec.levels.some((l) => l.id === level)) {
            return NextResponse.json({ error: "bad_spec_level" }, { status: 400 });
          }
          p.specLevel = level;
        } else {
          p.specLevel = spec.levels[0].id;
        }
      }
    } else if (typeof body.specLevel === "string" && p.spec) {
      const spec = specById(p.spec);
      if (spec?.levels.some((l) => l.id === body.specLevel)) p.specLevel = body.specLevel;
    }
    if (typeof body.exam === "string") p.exam = body.exam.slice(0, 40);
    // A date must be removable, not only settable: a learner who mistypes their
    // exam, or whose exam has been sat, would otherwise carry a deadline they
    // cannot correct for the life of the profile.
    if (body.examDate === "" || body.examDate === null) {
      delete p.examDate;
    } else if (typeof body.examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.examDate)) {
      p.examDate = body.examDate;
    }
    if (typeof body.timePerDay === "number" && body.timePerDay >= 5 && body.timePerDay <= 480) {
      p.timePerDay = Math.round(body.timePerDay);
    }
    if (body.learningStyle && ["visual", "auditory", "kinesthetic", "reading-writing"].includes(body.learningStyle as string)) {
      p.learningStyle = body.learningStyle as StudentProfile["learningStyle"];
    }
    if (typeof body.goal === "string") p.goal = body.goal.slice(0, 200);
    if (typeof body.intent === "string" && ["exams", "understand", "project", "code", "competition", "life", ""].includes(body.intent)) {
      p.intent = body.intent as StudentProfile["intent"];
    }
    if (Array.isArray(body.subjects) && body.subjects.length) {
      p.subjects = (body.subjects.filter((s) => SUBJECTS.includes(s as SubjectId)) as SubjectId[]).slice(0, 5);
    }

    // ── Per-subject courses (§1) ────────────────────────────────────────────
    // GCSE Maths (Foundation) alongside A-Level Physics is an ordinary
    // combination, and one flat course cannot express it — it would pitch one
    // of the two subjects at the wrong depth. Validation lives here because this
    // is the only door a course can be written through.
    if (body.subjectCourses !== undefined) {
      if (body.subjectCourses === null) {
        delete p.subjectCourses;
      } else if (typeof body.subjectCourses !== "object" || Array.isArray(body.subjectCourses)) {
        return NextResponse.json({ error: "bad_subject_courses" }, { status: 400 });
      } else {
        const next: Partial<Record<SubjectId, SubjectCourse>> = { ...(p.subjectCourses ?? {}) };
        for (const [key, raw] of Object.entries(body.subjectCourses as Record<string, unknown>)) {
          const subject = SUBJECTS.find((s) => s === key);
          if (!subject) continue;
          const parsed = courseEntry(raw, subject, next[subject], p.spec);
          if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
          if (parsed.entry) next[subject] = parsed.entry;
          else delete next[subject];
        }
        p.subjectCourses = next;
      }
    }
    // A course for a subject the learner no longer studies is a stale record,
    // not a preference: drop it so the gap report cannot claim completeness for
    // work that is not theirs.
    if (p.subjectCourses) {
      for (const key of Object.keys(p.subjectCourses) as SubjectId[]) {
        if (!p.subjects.includes(key)) delete p.subjectCourses[key];
      }
      if (Object.keys(p.subjectCourses).length === 0) delete p.subjectCourses;
    }
    // The flat fields stay in step with the learner's FIRST subject, because
    // readers that genuinely have one course in hand (a countdown, a paper tag, a
    // single-course legacy screen) must not read a course the learner never
    // chose. Readers with a subject must use specForProfile(profile, subject).
    const first = p.subjects[0];
    const firstCourse = first ? p.subjectCourses?.[first] : undefined;
    if (firstCourse) {
      if (firstCourse.spec) p.spec = firstCourse.spec;
      if (firstCourse.specLevel) p.specLevel = firstCourse.specLevel;
      if (firstCourse.board) p.board = firstCourse.board;
      if (firstCourse.exam) p.exam = firstCourse.exam;
      // Only a field the entry actually declares is mirrored. Writing absence
      // back would clear a learner's exam date because they set a tier.
      if (firstCourse.examDate) p.examDate = firstCourse.examDate;
    }
    // Enrolment completeness is recorded, never assumed: an abandoned flow
    // leaves the stamp absent and the app can say so.
    if (body.onboarded === true && !p.onboardedAt) p.onboardedAt = Date.now();

    await saveProfile(state);
    // What this learner's courses still have NOT decided, named field by field,
    // so a surface can refuse to personalise rather than silently falling back to
    // a qualification nobody chose. DERIVED — computed from the profile on every
    // read, never stored, so it cannot drift from the profile it describes.
    return NextResponse.json({ ...publicProfileState(state), isNew, courseGaps: incompleteSubjects(p) });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
