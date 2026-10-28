import { NextResponse } from "next/server";
import {
  deleteKioskSessionsFor, getProfile, newProfileState, publicProfileState, resolveKioskSession, saveProfile,
} from "@/lib/server/store";
// THE ERASURE IS ONE WORKFLOW, shared with the restore path — see
// lib/server/erasure.ts for why it is a sequence rather than three calls from
// this route, and why the instruction is written before the effects.
import { eraseLearner, portErasureTarget } from "@/lib/server/erasure";
import { activeStorage } from "@/lib/server/storage-file";
// A store that has refused learner-data writes throws from inside `saveProfile`;
// this is the one place that turns the refusal into the answer a learner reads.
import { storeWriteRefusal } from "@/lib/server/write-refusal";
import { accountFromRequest, newProfileId } from "@/lib/server/auth";
import { isBoardId, type ProfileState, type StudentProfile, type SubjectCourse, type SubjectId } from "@/lib/types";
import { coversSubject, incompleteSubjects, specById, specsFor } from "@/lib/specifications";
import { pathwayForCountry } from "@/lib/curricula/registry";
import { COUNTRIES } from "@/lib/i18n";
// WHICH PART OF THE COUNTRY, where the part itself decides the language. The
// table is the one owner of that rule and the client reads the same one, so a
// region accepted here is a region the picker can offer and vice versa.
import { hasRegions, regionFor } from "@/lib/regions";

const SUBJECTS: SubjectId[] = ["maths", "physics", "chemistry", "biology", "computing"];

/** Every country code a profile may name, plus the deliberate "prefer not to
 *  say". The check used to be `/^[A-Z]{2}$/`, which accepts "QQ": a typo, a
 *  hand-rolled client, or a country this product has no route for all became a
 *  national code nothing answers for, and the learner was then handed the
 *  independent pathway as though that were their school system. A named refusal
 *  is the honest answer, and it names the field so a client can fix it. */
const COUNTRY_CODES = new Set<string>([...COUNTRIES.map((c) => c.code), "XX"]);

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
  system: { country?: string; pathway?: string },
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
    // AND IT MUST BELONG TO THE LEARNER'S OWN EDUCATION SYSTEM (§7). The picker
    // is scoped by the pathway, so reaching this is a client bug — and a client
    // bug must not end up serving another system's syllabus at another system's
    // depth. Refused by name like every other invalid course choice, never
    // dropped: a silent drop is how a learner believes they chose a course the
    // engine never read.
    if (system.pathway) {
      const offered = new Set(specsFor(system.country, system.pathway).map((s) => s.id));
      if (!offered.has(spec.id)) return { error: `pathway_does_not_offer_${spec.id}` };
    }
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
  // A CLASSROOM SESSION IS A LEARNER CREDENTIAL, and this door has to know it or
  // a kiosk learner cannot read their own profile. It is checked BEFORE the
  // permanent secret because a kiosk learner has no usable one.
  if (secret.length >= 32) {
    const kiosk = await resolveKioskSession(secret);
    if (kiosk && kiosk.profileId === state.profile.id) return true;
  }
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

/** FIELDS A CLASSROOM SESSION MAY NOT SET. A PIN the teacher issued proves who
 *  the learner is; it does not let them re-declare the course the teacher
 *  provisioned them onto (that would silently change the curriculum, the depth
 *  of every question and the terminology applied to it). The fields are named
 *  here, once, rather than filtered in four places. */
const KIOSK_LOCKED_FIELDS = [
  "country", "pathway", "board", "grade", "spec", "specLevel", "subjectCourses", "exam", "examDate",
  // A REGION IS ON THIS LIST BECAUSE IT CHANGES THE LANGUAGE. It is not the
  // learner's course — but it is the field that decides what language every
  // lesson is written in, and a learner at a PIN must not quietly turn a class
  // provisioned in English into French. It travels with the fields that
  // describe where the learner sits, not with the preferences they own.
  "region",
] as const;

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

    // ── A CLASSROOM SESSION EDITS PREFERENCES, NOT ITS OWN COURSE ────────────
    // The teacher provisioned this learner onto a curriculum. A PIN proves who is
    // at the keyboard; it must not let them swap the qualification, the tier or
    // the education system out from under the class (which would silently change
    // what every question is pitched at and which terminology is applied). The
    // fields they MAY change — goal, intent, time per day, examples, language of
    // explanation — are the ones a learner owns.
    if (await resolveKioskSession(typeof body.secret === "string" ? body.secret : "")) {
      const touched = KIOSK_LOCKED_FIELDS.filter((f) => body[f] !== undefined);
      if (touched.length > 0) {
        return NextResponse.json({ error: `kiosk_field_locked: ${touched.join(", ")}` }, { status: 403 });
      }
    }

    const p = state.profile;
    if (typeof body.handle === "string" && body.handle.trim()) p.handle = body.handle.trim().slice(0, 24);
    if (typeof body.country === "string" && /^[A-Z]{2}$/.test(body.country)) {
      if (!COUNTRY_CODES.has(body.country)) {
        return NextResponse.json({ error: "unknown_country", field: "country" }, { status: 400 });
      }
      p.country = body.country;
    }
    // ── WHERE THEY ARE WITHIN THAT COUNTRY (lib/regions.ts) ─────────────────
    // Validated against the country for the same reason a pathway is: a region
    // is a fact about one country, so "quebec" on a learner in France is a
    // record nothing can act on. Three outcomes, all stated:
    //   · a string is checked and refused BY NAME if it is not this country's;
    //   · `null` clears it (the learner went back to "prefer not to say");
    //   · absent leaves it alone, so a PATCH that changes only a goal does not
    //     silently drop the region.
    if (body.region === null) {
      delete p.region;
    } else if (typeof body.region === "string" && body.region.length > 0) {
      if (!regionFor(p.country, body.region)) {
        return NextResponse.json({ error: "unknown_region", field: "region" }, { status: 400 });
      }
      p.region = body.region;
    }
    // A COUNTRY WITH NO REGIONS CANNOT HOLD ONE. Moving a Quebec learner to
    // Ireland leaves a stored "quebec" that no picker will ever show again, and
    // a later surface reading `profile.region` would take it for a fact about a
    // country it is not about. Derived rather than checked at each write site,
    // so there is no path that forgets.
    if (p.region && !hasRegions(p.country)) delete p.region;
    // ── WHICH EDUCATION SYSTEM (§7) ─────────────────────────────────────────
    // Optional, because most countries run one general secondary system and
    // asking a UK learner to confirm they follow the UK system is a question
    // with one answer. It is REQUIRED only where the country's record says the
    // answer is genuinely open (Cameroon's Anglophone and Francophone systems),
    // and that requirement lives in `courseGaps` — the same gate the form
    // enforces — rather than as a rule here.
    //
    // Validated against the COUNTRY for the reason a tier is validated against
    // its qualification: a national pathway of another country is refused by
    // name, never quietly stored. Otherwise a learner could hold "the
    // Francophone system of Cameroon" on a British profile and every course they
    // were then offered would be scoped by a system they do not sit.
    if (body.pathway === null) {
      delete p.pathway;
    } else if (typeof body.pathway === "string") {
      const pathway = pathwayForCountry(p.country, body.pathway);
      if (!pathway) return NextResponse.json({ error: "unknown_pathway" }, { status: 400 });
      // CHANGING SYSTEM DROPS THE COURSES THAT BELONGED TO THE OLD ONE — but
      // only when both the old and the new system are known.
      //
      // Both halves matter. A Cameroon learner moving from the Anglophone to the
      // Francophone system must not keep a GCE O Level as their course: the
      // syllabus, the depth band and the exam would all be the wrong system's,
      // and every question they were served would be pitched at it. Equally, a
      // profile that predates pathways (no `pathway` stored) may legitimately
      // hold a course that no pathway lists — the live store holds one, a UK
      // learner on Cambridge IGCSE — and clearing THAT on the first save would
      // delete a real course to enforce a rule about a choice they never made.
      // So the rule fires on a change between two declared systems, which is
      // exactly the case it describes.
      if (p.pathway && p.pathway !== pathway.id) {
        const offered = new Set(specsFor(p.country, pathway.id).map((s) => s.id));
        if (p.subjectCourses) {
          for (const entry of Object.values(p.subjectCourses)) {
            if (entry.spec && !offered.has(entry.spec)) {
              delete entry.spec;
              delete entry.specLevel;
            }
          }
        }
        if (p.spec && !offered.has(p.spec)) {
          delete p.spec;
          delete p.specLevel;
        }
      }
      p.pathway = pathway.id;
    }
    // The school a teacher teaches at. Free text and optional — a tutor working
    // alone has none and is never asked for one — but bounded, and CLEARABLE:
    // sending an empty string removes it rather than storing "" , so "no school"
    // and "a school called nothing" are the same state.
    if (typeof body.school === "string") {
      const school = body.school.trim().slice(0, 80);
      if (school) p.school = school;
      else delete p.school;
    }
    if (typeof body.birthYear === "number" && body.birthYear > 1900 && body.birthYear <= new Date().getFullYear()) p.birthYear = body.birthYear;
    if (typeof body.language === "string" && body.language.length <= 8) {
      p.language = body.language;
      // ── A CHOSEN LANGUAGE CARRIES THE OTHER ROLES, UNTIL IT IS SPLIT ──────
      // `newProfileState` ships every role as "en", so the `if (!p.teachingLang)`
      // defaults below could never fire: a learner who picked Arabic on this
      // route got `teachingLang: "en"`, and every surface that prefers the
      // TEACHING language — the offline pack, the tutor's directive, and the
      // decision door — then spoke English to them while the interface was
      // Arabic. (Sign-up does not have this bug: it seeds all four roles from
      // the chosen language. This route is where onboarding and the anonymous
      // path arrive, which is where it mattered.)
      //
      // Scope: only while onboarding is incomplete, and only for roles the
      // request did not name. After onboarding the interface language is the
      // interface's own, and the taught/answered/school languages keep the
      // choices the learner made about them — the four roles exist precisely
      // because a learner may want one language on screen and another in the
      // maths.
      if (!p.onboardedAt) {
        for (const key of ["teachingLang", "answerLang", "schoolLang"] as const) {
          if (typeof body[key] !== "string") p[key] = body.language;
        }
      }
    }
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
        if (p.pathway && !specsFor(p.country, p.pathway).some((s) => s.id === spec.id)) {
          return NextResponse.json({ error: `pathway_does_not_offer_${spec.id}` }, { status: 400 });
        }
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
          const parsed = courseEntry(raw, subject, next[subject], p.spec, { country: p.country, pathway: p.pathway });
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
    // ── WHAT A PROFILE CANNOT BE FINISHED WITHOUT ───────────────────────────
    //
    // The completion stamp used to be writable on an empty profile: a client
    // could POST `{onboarded: true}` with no country and no subjects, and the
    // learner then held a finished-looking record with no curriculum in it — the
    // guard let them into /learn, where the serve fell back to the independent
    // pathway and taught them a course nobody chose. "Required" has to mean the
    // SERVER refuses, not that a screen happens not to offer the button.
    //
    // Only two fields are required HERE, and deliberately not the qualification:
    // enrolment collects where and what, and the course and its tier are chosen
    // on /curriculum (`courseIsReady` in lib/app-state.ts gates the surfaces that
    // need one). This is the floor, so a profile can never be complete and
    // course-less at the same time.
    if (body.onboarded === true) {
      const missing: string[] = [];
      if (!p.country) missing.push("country");
      if (!(p.subjects?.length > 0)) missing.push("subjects");
      if (missing.length > 0) {
        return NextResponse.json({ error: "profile_incomplete", missing }, { status: 422 });
      }
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
  } catch (e) {
    // A REFUSAL IS NOT A BAD REQUEST. On a deployment whose store cannot keep
    // learner data the write is refused at the store, and answering "bad request"
    // (or 500) would tell a learner their form was wrong when the truth is that
    // the site cannot hold what they sent. 503 with the reason, and the reason
    // names the variable the operator has to set.
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

/**
 * DELETE /api/profile?id=…&secret=…&confirm=ERASE — the right to erasure (§23).
 *
 * Deletion is the one act that cannot be undone, so it is consent-gated in the
 * request itself: `confirm=ERASE` typed by the caller, not a checkbox the UI
 * could fire on a misclick. The same three-credential rule authorises it, and
 * it takes the whole record with it: the profile, the evidence ledger, and the
 * learner's membership in every class roster. Personal papers keyed by owner
 * and assignment monitors keyed by learner id resolve to nothing once the id
 * is gone — no orphan row survives with the learner's data in it.
 *
 * The signing-in account is NOT deleted here: a learner erasing their record
 * keeps their email/password, they just have no learning history. Erasing both
 * is a deliberate two-step, and the account screen explains it.
 */
export async function DELETE(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const account = await accountFromRequest(req);
  const id = searchParams.get("id") ?? account?.profileId ?? null;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const state = await getProfile(id);
  if (!state) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!(await authorize(req, state, searchParams.get("secret")))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // ERASURE IS NOT A CLASSROOM ACTION. A kiosk session is a short-lived
  // credential the teacher issued for a lesson; it must not be able to destroy a
  // record (that was one of the measured defects: a capability could erase, and
  // a shared phone holds capabilities). The household case — a learner with no
  // account, holding their own permanent capability — keeps this door, because
  // there is no other authority to ask for.
  if (await resolveKioskSession(searchParams.get("secret") ?? "")) {
    return NextResponse.json({ error: "kiosk_cannot_erase" }, { status: 403 });
  }
  if (searchParams.get("confirm") !== "ERASE") {
    return NextResponse.json({ error: "confirm_required" }, { status: 400 });
  }
  const outcome = await eraseLearner(portErasureTarget(activeStorage()), id);
  // A credential whose learner is gone is a credential nothing should answer to.
  await deleteKioskSessionsFor(id);
  // `removed` is kept at its old meaning ("there was a record and it is gone") so
  // an existing caller or script does not have to learn the richer shape, and the
  // outcome rides beside it for a caller that wants to know what else went.
  return NextResponse.json({ ok: true, removed: outcome.existed, erased: outcome });
}
