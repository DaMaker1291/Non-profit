import { NextResponse } from "next/server";
import {
  accountOwningProfile, createAccount, emailProblem, ensureProfileSecretFor, findAccountByEmail,
  mintRecoveryCodeFor, newProfileId, passwordProblem, publicAccount, type AccountRole,
} from "@/lib/server/auth";
import { getProfile, newProfileState, publicProfileState, saveProfile } from "@/lib/server/store";
import type { ProfileState, SubjectId } from "@/lib/types";
import { hit, SIGNUP_PER_ADDRESS } from "@/lib/server/rate-limit";
import { ingressFor } from "@/lib/server/client-address";
import { tooManyAttempts, untrustedIngress } from "@/lib/server/limits";
import { readBody, sessionTokenFor, str, withSession } from "../_shared";
// A sign-up IS the creation of a learner record, so a deployment whose store has
// refused learner data must refuse the sign-up too — with its reason, not a 500.
import { storeWriteRefusalNow } from "@/lib/server/write-refusal";

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

  // A DECLARED INGRESS THAT DID NOT DELIVER A CHAIN refuses here too — see the
  // login door. Sign-up writes the account AND the learner record, so it is the
  // last door that should run unattributed because a proxy was misconfigured.
  const ingress = ingressFor(req);
  if (ingress.kind === "refused") return untrustedIngress(ingress.reason);

  // ONE ADDRESS MAY NOT CREATE ACCOUNTS WITHOUT A LIMIT.
  //
  // This is the door that writes a learner record AND an account, so an
  // unbounded loop here is a store-filling, mail-less account factory. The
  // count is per source ADDRESS, which only exists when the deployment declares
  // a trusted proxy — with no address there is no key, and the bound is the
  // reverse proxy's (`docs/DEPLOYMENT.md` §10). It is deliberately NOT keyed on
  // the email: a stranger choosing addresses is exactly the behaviour being
  // bounded, so letting them choose a fresh key per attempt bounds nothing.
  if (ingress.kind === "client") {
    const after = hit(`signup:ip:${ingress.address}`, SIGNUP_PER_ADDRESS);
    if (!after.allowed) return tooManyAttempts(after.retryAfterSec);
  }

  if (await findAccountByEmail(email)) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  // NO LEARNER RECORD, NO ACCOUNT. Every branch below writes a profile (a new one
  // or the adopted anonymous one) and an account pointing at it, and a store the
  // deployment has not declared it can keep must not accept either — the account
  // would be a login whose learning had nowhere to live.
  const refusal = storeWriteRefusalNow();
  if (refusal) return refusal;

  // 1. Claim the ANONYMOUS profile, if one was offered and proves itself.
  let state: ProfileState | null = null;
  const claim = body.claim && typeof body.claim === "object" ? (body.claim as Record<string, unknown>) : null;
  if (claim && typeof claim.profileId === "string") {
    const candidate = await getProfile(claim.profileId);
    // A profile with no secret yet binds the first one presented; otherwise the
    // presented secret must match — a profile id alone is never enough.
    const proven = candidate && (!candidate.secret || candidate.secret === claim.secret);
    // PROVEN IS NOT THE SAME AS UNCLAIMED. A device that holds a session always
    // holds the profile's secret, so the test above passes for a profile another
    // account already owns: the second account was bound to the first's learner
    // and this route's own enrolment step then rewrote that learner's year,
    // course and name. Measured: two accounts, one profile id (see
    // lib/server/auth.ts#accountOwningProfile). Adoption requires both facts.
    if (proven && !(await accountOwningProfile(claim.profileId))) state = candidate;
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
  // EVERY NEW LEARNER GETS A RECOVERY CODE BEFORE THEY NEED ONE. Minting it at
  // sign-up rather than on demand is the difference between "there is a way back"
  // and "there was a way back if you thought about it while you still had access" —
  // and the population this exists for is the one that will not think of it.
  //
  // It rides on the sign-up response because there is no second chance to show it:
  // only its hash is stored. A null here means the account write succeeded and this
  // one did not, which is `identity`-purpose storage failing in the middle of a
  // sign-up — rare, and NOT a reason to fail the learner's enrolment. They can mint
  // one from a session later (POST /api/auth/recovery-code), and the UI says so.
  const recoveryCode = await mintRecoveryCodeFor(account.id);
  const token = await sessionTokenFor(account);
  return withSession(
    {
      account: publicAccount(account),
      profile: publicProfileState(state),
      secret,
      ...(recoveryCode ? { recoveryCode } : {}),
    },
    token,
    200,
    req,
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
