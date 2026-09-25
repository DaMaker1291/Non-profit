import { NextResponse } from "next/server";
import {
  createAccount, emailProblem, ensureProfileSecretFor, findAccountByEmail, newProfileId,
  passwordProblem, publicAccount, type AccountRole,
} from "@/lib/server/auth";
import { getProfile, newProfileState, publicProfileState, saveProfile } from "@/lib/server/store";
import type { ProfileState, SubjectId } from "@/lib/types";
import { readBody, sessionTokenFor, str, withSession } from "../_shared";

const SUBJECTS: SubjectId[] = ["maths", "physics", "chemistry", "biology", "computing"];
const ROLES: AccountRole[] = ["student", "teacher", "org"];

/**
 * POST /api/auth/signup — real account creation.
 *
 * If the visitor was already learning anonymously (`claim.profileId` plus the
 * profile's secret), the new account *takes over that exact profile*: every
 * answered question, diagnostic and misconception carries across instead of
 * being thrown away at the sign-up wall.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await readBody(req);
  const email = str(body.email);
  const password = str(body.password);
  const name = str(body.name);

  const emailErr = emailProblem(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });
  const pwErr = passwordProblem(password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
  if (name.trim().length < 1) return NextResponse.json({ error: "bad_name" }, { status: 400 });

  if (await findAccountByEmail(email)) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  // 1. Claim the anonymous profile, if one was offered and proves itself.
  let state: ProfileState | null = null;
  const claim = body.claim && typeof body.claim === "object" ? (body.claim as Record<string, unknown>) : null;
  if (claim && typeof claim.profileId === "string") {
    const candidate = await getProfile(claim.profileId);
    // A profile with no secret yet binds the first one presented; otherwise the
    // presented secret must match — a profile id alone is never enough.
    const proven = candidate && (!candidate.secret || candidate.secret === claim.secret);
    if (proven) state = candidate;
  }

  // 2. Otherwise a brand-new learner profile is created alongside the account,
  //    so an account is never a login with nowhere to put the learning.
  if (!state) {
    const language = str(body.language).slice(0, 8) || "en";
    const country = /^[A-Z]{2}$/.test(str(body.country)) ? str(body.country) : "XX";
    const subjects = Array.isArray(body.subjects)
      ? (body.subjects as unknown[]).filter((s): s is SubjectId => SUBJECTS.includes(s as SubjectId))
      : [];
    state = newProfileState(newProfileId(), {
      handle: name.trim().slice(0, 24),
      country,
      language,
      teachingLang: language,
      answerLang: language,
      schoolLang: language,
      subjects: subjects.length ? subjects.slice(0, 5) : ["maths"],
    });
    await saveProfile(state);
  } else if (name.trim() && state.profile.handle === "student") {
    state.profile.handle = name.trim().slice(0, 24);
    await saveProfile(state);
  }

  const role = ROLES.includes(str(body.role) as AccountRole) ? (str(body.role) as AccountRole) : "student";
  let account;
  try {
    account = await createAccount({ email, password, name, role, profileId: state.profile.id });
  } catch (e) {
    // The unique-email check above races with a concurrent sign-up; the lock in
    // createAccount is what actually decides.
    if (e instanceof Error && e.message === "email_taken") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const secret = await ensureProfileSecretFor(state);
  const token = await sessionTokenFor(account);
  return withSession(
    { account: publicAccount(account), profile: publicProfileState(state), secret },
    token,
  );
}

/** Exposed for the client's "is this email free?" affordance — never returns
 *  anything but a boolean, so it cannot be used to enumerate account details. */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") ?? "";
  if (emailProblem(email)) return NextResponse.json({ error: "bad_email" }, { status: 400 });
  const taken = (await findAccountByEmail(email)) !== null;
  return NextResponse.json({ taken });
}
