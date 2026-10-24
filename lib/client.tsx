"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ProfileState, SubjectCourse, SubjectId } from "./types";
import { clearIdentity, deviceLearners, ensureSecret, forgetDeviceLearner, loadProfileId, loadSecret, onIdentityChange, rememberOnDevice, switchToDeviceLearner, writeProfileId, writeSecret } from "./api/identity";
import * as api from "./api/client";
import { ApiError } from "./api/client";
import {
  deriveLifecycle, profileStatusOf, resolveRoute, safeReturnPath, withReturn,
  type AuthStatus, type Lifecycle, type ProfileStatus, type RouteDecision,
} from "./app-state";
import { LANGS, isRtl, langMeta, translator } from "./i18n";
import { clearKioskSession } from "./kiosk-session";

// ── Identity on this device ─────────────────────────────────────────────────
// One event, one meaning: "the learner identity stored on this device changed".
// Sign-up, sign-in, sign-out, profile creation and account-claiming all end in
// a write, and the AppProvider re-probes the server when it fires. This is what
// stops the classic bug where a client-side navigation right after signing in
// is served by a session provider that still believes nobody is signed in.
//
// THE STORAGE IS NOT HERE ANY MORE. It lives in lib/api/identity.ts, next to
// the ONE rule about when a write is a change: a value that actually moved
// announces, and a value written back unchanged does not. That rule used to be
// three rules — announced-on-id, announced-on-secret, and a private silent
// write for the session probe's own updates so it would not re-trigger itself —
// so "does this update the app?" depended on WHICH function you called. Now the
// probe is safe by construction (it writes back what it just read) and this
// module has one job left: turn an announcement into a React event.

export const SESSION_EVENT = "openmind:session";

function emitSessionChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

if (typeof window !== "undefined") onIdentityChange(emitSessionChange);

// ── Profile bootstrap ───────────────────────────────────────────────────────

export function loadLocalProfileId(): string | null {
  return loadProfileId();
}

export function storeLocalProfileId(id: string): void {
  writeProfileId(id);
}

/** The capability secret this device presents to every learner-scoped route.
 *  Audit P0-E: an id alone is not a credential — it sits in URLs and
 *  screenshots — so each profile also has a token, minted here when a device
 *  has none (legacy profiles bind it on their first authenticated call). */
export function loadLocalProfileSecret(): string | null {
  if (typeof window === "undefined") return null;
  return ensureSecret();
}

export const ensureProfileSecret = ensureSecret;

// ── Real accounts ───────────────────────────────────────────────────────────
// Sign-up / sign-in return the whole learner profile plus its capability
// secret; adoptSession() writes both to localStorage so every existing learner
// API keeps working on this device. That is what makes an account actually
// save the work rather than just label it.

/** The signed-in learner, its profile and its capability. The shape lives with
 *  the operations that produce it (lib/api/client.ts), so a response cannot
 *  drift from what the callers here destructure. */
export type AccountSession = api.AccountSession;
export const EMPTY_SESSION: AccountSession = api.EMPTY_SESSION;

/** Adopt an account's identity as THIS device's learner. Both halves matter:
 *  without the id every later page reads "no profile", and without the secret
 *  every later write is refused with no session to fall back on. */
export function adoptSession(s: AccountSession): void {
  if (typeof window === "undefined") return;
  // A SIGN-IN ENDS ANY CLASSROOM LESSON ON THIS HANDSET. Otherwise the shell
  // would keep showing "finish and hand back" for a session that is no longer
  // the identity in storage, and pressing it would clear the account's identity
  // instead of the lesson's.
  clearKioskSession();
  if (s.profile) writeProfileId(s.profile.profile.id);
  if (s.secret) writeSecret(s.secret);
  // Signing in on a shared handset must leave that learner SELECTABLE
  // afterwards, or the next child's sign-in erases the first child's way back.
  //
  // BUT ONLY A LEARNER. The roster stores each entry's capability in cleartext,
  // and a TEACHER's capability is classroom authority — the audit measured that a
  // learner's secret could already create and administer a class, and remembering
  // a teacher's would hand that to every child who picks the phone up. A teacher
  // account is not a household learner; it is never added, and the switch screen
  // therefore cannot offer it.
  const role = s.account?.role;
  const isLearner = !role || role === "student";
  if (isLearner && s.profile && s.secret) rememberOnDevice(s.profile.profile.handle);
}

// ── Several learners on one device ─────────────────────────────────────────
// Re-exported so a page can read and change the device roster without importing
// the storage module directly — the same reason loadLocalProfileId lives here.
export { deviceLearners, rememberOnDevice, switchToDeviceLearner, forgetDeviceLearner };
export type { RosterLearner } from "./device-roster";

/** The server's own reason for a refusal, so a caller can explain rather than
 *  report "something went wrong" — and so the fallback is the caller's to name
 *  rather than a status code leaking into a sentence a learner reads.
 *
 *  THE FALLBACK IS `unreachable` AND THAT WORD IS LOAD-BEARING. It is returned
 *  only when the call never reached the server (status 0), so it is the ONE case
 *  in which "check your connection" is a true sentence. Every other outcome — a
 *  401 from a device whose stored secret does not own the record, a 400 naming a
 *  course the qualification does not teach, a 500 — is a refusal the SERVER
 *  made, and this module used to collapse all of them into a bare
 *  "profile create failed" that no caller could tell apart. The onboarding form
 *  then printed the connection sentence for all of it, so a learner with working
 *  internet was told to check it. The onboarding form maps `unreachable` to
 *  that sentence and every other outcome to one that says the server refused.
 *
 *  A thrown non-ApiError (a storage failure inside adoption, a bug) is
 *  `client_error`: also not the learner's connection, and equally worth naming. */
function reasonOf(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    if (e.code) return e.code;
    return e.status === 0 ? "unreachable" : `http_${e.status}`;
  }
  return fallback;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  clearIdentity();
}

// ── CLASSROOM MODE ─────────────────────────────────────────────────────────
//
// A kiosk learner is NOT a remembered learner. The identity is written (every
// route reads those two keys) but the household roster is deliberately not — and
// that distinction is the whole Phase C requirement: one mechanism must not solve
// two different security problems. A classroom handset holds no permanent
// capability for anyone (the server issues a session instead), so there is nothing
// worth remembering and everything to lose by storing it.

export async function kioskLogin(input: { classId?: string; joinCode?: string; handle: string; pin: string }): Promise<api.KioskSession> {
  const data = await api.kioskLogin(input);
  if (data.profile?.profile?.id && data.secret) {
    writeProfileId(data.profile.profile.id);
    writeSecret(data.secret);
  }
  return data;
}

/** Hand the device back: the server ends the session, then this device forgets it.
 *  The server first ON PURPOSE — if the network fails, the identity is still
 *  cleared locally (the next learner must not inherit it), and the token dies at
 *  its expiry even if the call never arrives. */
export async function kioskLeave(): Promise<void> {
  const token = loadSecret();
  try {
    if (token) await api.kioskLeave(token);
  } finally {
    clearIdentity();
  }
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  role?: "student" | "teacher" | "org";
  country?: string;
  language?: string;
  subjects?: SubjectId[];
  /** Bring the anonymous profile on this device into the new account. */
  claimCurrent?: boolean;
}

/** HOW MUCH OF WHAT THIS SCREEN WRITES WILL BE HERE TOMORROW.
 *
 *  Asked of the deployment itself (`/api/health` → `lib/env.ts`) rather than
 *  inferred from the URL or the host name: only the process knows what its
 *  operator declared, and a second opinion about a filesystem is how a site
 *  once reported "durable" while a canary learner vanished on the next deploy.
 *
 *  Never throws, and `unknown` on any failure. This is a disclosure a surface
 *  may show; it must not be able to break the form it is describing.
 */
export async function storeDurability(): Promise<"durable" | "ephemeral" | "unknown"> {
  try {
    return (await api.deploymentHealth()).store.durability;
  } catch {
    return "unknown";
  }
}

export async function signUp(input: SignUpInput): Promise<AccountSession> {
  const claim = input.claimCurrent ? currentGuestClaim() : null;
  try {
    const data = await api.signUp({ ...input, claim });
    adoptSession(data);
    return data;
  } catch (e) {
    throw new Error(reasonOf(e, "signup_failed"));
  }
}

export async function signIn(email: string, password: string): Promise<AccountSession> {
  try {
    const data = await api.signIn(email, password);
    adoptSession(data);
    return data;
  } catch (e) {
    throw new Error(reasonOf(e, "login_failed"));
  }
}

export async function signOut(): Promise<void> {
  await api.signOut();
  clearSession();
}

/**
 * Get back into an account with a recovery code — the learner's own printed one,
 * or a teacher's fifteen-minute grant.
 *
 * This is a SIGN-IN, not a repair: it adopts the returned session (account,
 * profile, capability secret) exactly as `signIn` does, because the learner's next
 * action is to keep working and a session that is "recovered" but not adopted is a
 * second sign-in they were never told to do.
 *
 * The new `recoveryCode` rides on the returned session and must be shown before it
 * is forgotten: the old code is dead the moment this succeeds.
 */
export async function recoverAccount(input: {
  email?: string;
  code: string;
  newPassword: string;
}): Promise<AccountSession> {
  try {
    const data = await api.recover(input);
    adoptSession(data);
    emitSessionChange();
    return data;
  } catch (e) {
    throw new Error(reasonOf(e, "recovery_failed"));
  }
}

/** Mint a fresh recovery code from a signed-in session (current password required). */
export async function mintRecoveryCode(currentPassword: string): Promise<string> {
  try {
    return (await api.rotateRecoveryCode(currentPassword)).recoveryCode;
  } catch (e) {
    throw new Error(reasonOf(e, "recovery_code_failed"));
  }
}

/** A teacher's reset grant for one learner on their own roster. */
export function teacherResetGrant(
  learnerId: string,
): Promise<{ code: string; expiresAt: number; learner: string }> {
  return api.requestResetGrant(learnerId);
}

/** Who is signed in on this device, and which learner profile that is. */
export async function fetchSession(): Promise<AccountSession> {
  const data = await api.session();
  if (data.profile) adoptSession(data);
  return data;
}

/** The anonymous profile on this device, if any — what a sign-up can claim. */
export function currentGuestClaim(): { profileId: string; secret: string } | null {
  const id = loadLocalProfileId();
  if (!id) return null;
  return { profileId: id, secret: ensureProfileSecret() };
}

/**
 * Attach this device's guest progress to the signed-in account. Throws with the
 * server's reason (e.g. "account_has_progress") so the UI can explain.
 *
 * The claim is a PARAMETER, and that is load-bearing: signing in adopts the
 * account's profile into localStorage, so a claim read at call time would name
 * the account's own brand-new profile instead of the anonymous work sitting on
 * this device — silently making "bring this device's progress with me" claim
 * nothing. Capture the claim BEFORE signing in and pass it here.
 */
export async function claimGuestProfile(
  guest?: { profileId: string; secret: string } | null,
): Promise<void> {
  const claim = guest ?? currentGuestClaim();
  if (!claim) return;
  try {
    adoptSession(await api.claimProfile(claim));
  } catch (e) {
    throw new Error(reasonOf(e, "claim_failed"));
  }
}

/**
 * Change the account itself (display name, role, password). The door answers with
 * the session it just changed — account, profile AND capability — so the change
 * is adopted here rather than left in a response body nobody reads: a teacher who
 * declares themselves a teacher on `/account` must not have to reload to stop
 * being shown a learner's Home. The shell re-probes on the next identity change;
 * `useAccount().refresh` is what re-asks when nothing about the identity moved
 * (the role is not a stored credential, so nothing would announce it).
 */
export async function updateAccount(patch: {
  name?: string; role?: string; currentPassword?: string; newPassword?: string;
}): Promise<void> {
  try {
    adoptSession(await api.updateAccount(patch));
  } catch (e) {
    throw new Error(reasonOf(e, "update_failed"));
  }
}

/**
 * The ONE session probe for the whole tree (P0). Mounted once in the app
 * shell, this is the only thing that ever calls /api/auth/me; every consumer
 * reads it from context, so two components physically cannot disagree about
 * who is signed in. `status` is explicit — `booting` is never `signed_out`.
 */
interface AppCtxValue {
  auth: AuthStatus;
  session: AccountSession;
  profile: ProfileState | null;
  profileStatus: ProfileStatus;
  lifecycle: Lifecycle;
  refresh: () => void;
  setProfile: (s: ProfileState) => void;
}

const AppCtx = createContext<AppCtxValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AccountSession>(EMPTY_SESSION);
  const [auth, setAuth] = useState<AuthStatus>("booting");
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [generation, setGeneration] = useState(0);
  /** Consecutive probes that could not reach the server. Reset on any answer. */
  const probeRetry = useRef(0);

  useEffect(() => {
    let alive = true;
    setAuth("booting");
    fetchSession().then((s) => {
      if (!alive) return;
      setSession(s);
      setAuth(s.account ? "signed_in" : "signed_out");
      // A signed-in session carries its own profile, so one request answers
      // both questions. Only a guest needs the second fetch.
      if (s.profile) {
        setProfile(s.profile);
        setProfileStatus(profileStatusOf(s.profile));
        return;
      }
      const id = loadLocalProfileId();
      if (!id) {
        setProfile(null);
        setProfileStatus("missing");
        return;
      }
      setProfileStatus("loading");
      // `probeProfile` never rejects, so this always settles — the old code had
      // no failure path, and a single failed fetch left `profileStatus` at
      // "loading" for the life of the tab. `deriveLifecycle` reads that as
      // `booting`, so every gated page rendered the boot screen — a page whose
      // only control is a link it cannot resolve — and NOTHING the learner
      // clicked did anything. That is what a stalled probe looks like from the
      // outside, and it is why this branch exists at all.
      probeProfile(id).then(({ state, gone, refused }) => {
        if (!alive) return;
        if (gone || refused) {
          // The device names a profile the server does not have — a store reset,
          // a profile erased on another device, a test id left behind. The ghost
          // is not a learner: while it sits in localStorage, `loadLocalProfileId`
          // keeps claiming one, the guard bounces the learner back to enrolment
          // on every page, and enrolment PATCHes a profile that does not exist
          // instead of creating one. Clear it, so "no learner" is true when we
          // say it and the next move (a fresh enrolment) is honest.
          //
          // A REFUSAL IS THE SAME DEAD END (and was the same bug, one answer
          // later): the secret this device holds cannot write to that record, so
          // every gated page is refused and no retry can change that. Clearing
          // the identity asks the learner to enrol again — which CREATES a
          // profile, since there is no id left to patch — and erases nothing on
          // the server: the old record stays exactly where it is, reachable by
          // signing in to whichever account owns it.
          clearSession();
          setProfile(null);
          setProfileStatus("missing");
          return;
        }
        if (!state) {
          // Unreachable, not gone. Keep the identity, stay in the boot state
          // (which is never mistaken for signed-out), and ask again shortly — a
          // flaky link is the normal case on the devices this is built for.
          probeRetry.current += 1;
          if (probeRetry.current <= MAX_PROBE_RETRIES) {
            setTimeout(() => { if (alive) setGeneration((g) => g + 1); }, 600 * probeRetry.current);
          }
          return;
        }
        probeRetry.current = 0;
        setProfile(state);
        setProfileStatus(profileStatusOf(state));
      });
    });
    return () => { alive = false; };
  }, [generation]);

  useEffect(() => {
    const on = () => setGeneration((g) => g + 1);
    window.addEventListener(SESSION_EVENT, on);
    // Coming back online is itself a reason to re-probe: a probe that gave up
    // while the connection was down should not leave a dead boot screen once it
    // is back.
    const onOnline = () => { probeRetry.current = 0; setGeneration((g) => g + 1); };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener(SESSION_EVENT, on);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  // The ACCOUNT's role reaches the lifecycle, so the guard can tell a teacher
  // from a learner: a teacher is never moved into a baseline diagnostic (see
  // `MET.diagnosed` in lib/app-state.ts). An `org` (school) account sets work
  // too, so it is on the same side of the line.
  const isTeacher = !!session.account && session.account.role !== "student";
  const lifecycle = useMemo(
    () => deriveLifecycle({ auth, profileStatus, profile, isTeacher }),
    [auth, profileStatus, profile, isTeacher],
  );
  const value = useMemo<AppCtxValue>(() => ({
    auth, session, profile, profileStatus, lifecycle,
    refresh: () => setGeneration((g) => g + 1),
    setProfile,
  }), [auth, session, profile, profileStatus, lifecycle]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

/** The signed-in account for the current page. `ready` is false until the
 *  session probe answers, so guards never bounce a signed-in learner out
 *  during the first render. */
export function useAccount(): { session: AccountSession; status: AuthStatus; ready: boolean; refresh: () => void } {
  const ctx = useContext(AppCtx);
  const [own, setOwn] = useState<AccountSession>(EMPTY_SESSION);
  const [ownStatus, setOwnStatus] = useState<AuthStatus>("booting");
  // Standalone only: a re-probe asked for by a caller (the account page, after a
  // change the probe is the only thing that can see).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Standalone fallback for a component rendered outside the shell.
    if (ctx) return;
    let alive = true;
    fetchSession().then((s) => {
      if (!alive) return;
      setOwn(s);
      setOwnStatus(s.account ? "signed_in" : "signed_out");
    });
    return () => { alive = false; };
  }, [ctx, tick]);
  const refresh = () => (ctx ? ctx.refresh() : setTick((t) => t + 1));
  if (ctx) return { session: ctx.session, status: ctx.auth, ready: ctx.auth !== "booting", refresh };
  return { session: own, status: ownStatus, ready: ownStatus !== "booting", refresh };
}

export async function createProfile(init: {
  /** Optional: an unset handle means the learner chose no name — never mint
   *  one here. The greeting falls back to a neutral "Welcome back". */
  handle?: string; country: string; language: string; teachingLang?: string; answerLang?: string; schoolLang?: string; grade?: string; examples?: string; birthYear: number | null; goal: string; intent?: string;  subjects: SubjectId[]; board?: string; learningStyle?: string;
  spec?: string; specLevel?: string; exam?: string; examDate?: string; timePerDay?: number;
  /** One course per subject (§1). The flat spec/specLevel above stay as the
   *  learner's FIRST subject, so readers with a single course keep a true one. */
  subjectCourses?: Partial<Record<SubjectId, SubjectCourse>>;
  onboarded?: boolean;
}): Promise<ProfileState> {
  // Every profile is born with its capability secret (lib/api/transport.ts puts
  // it in the body for this door) — a signed-in learner needs none, because the
  // session cookie authorises the write. The operation adopts the profile as
  // *this device's* learner; without that the guest path has no session and no
  // identity, and every later write is refused.
  try {
    return await api.createProfile(init);
  } catch (e) {
    // The reason travels. Swallowing it here cost a walk of the whole
    // enrolment flow to learn that a 401 had been reported as a connection
    // problem (see `reasonOf`).
    throw new Error(reasonOf(e, "client_error"));
  }
}

/** Save changes to the existing learner profile (used by the enrolment flow
 *  and the settings pages). Falls back to creating one if there is none. */
export async function saveProfilePatch(
  patch: Partial<Parameters<typeof createProfile>[0]> & Record<string, unknown>,
): Promise<ProfileState> {
  const id = loadLocalProfileId();
  try {
    return await api.saveProfile(patch, id);
  } catch (e) {
    throw new Error(reasonOf(e, "client_error"));
  }
}

export async function fetchProfile(id: string): Promise<ProfileState | null> {
  try {
    const state = await api.readProfile(id);
    // A changed token is a real change to this device's credential, so it is
    // announced by the write itself; writing back the token we already sent is
    // not a change and stays silent (lib/api/identity.ts owns that rule).
    if (state.secret && loadSecret() !== state.secret) writeSecret(state.secret);
    return state;
  } catch {
    return null;
  }
}

/** How many times a probe that could not REACH the server is retried before we
 *  stop re-asking. Bounded so a genuinely dead server does not spin. */
const MAX_PROBE_RETRIES = 4;

/**
 * The session provider's probe, and the one place two very different failures
 * are told apart.
 *
 * `fetchProfile` answers a single question ("the profile, or nothing") because
 * that is all its other callers need. The provider needs a second distinction,
 * and without it the app had no honest state to move to:
 *
 *   gone      the server answered 404 — the learner this device names has been
 *             erased or never existed. A FACT, and the identity must be cleared.
 *   unreachable a network failure or a 5xx — we did not reach the server, so we
 *             know NOTHING. Concluding "no learner" here, or clearing the
 *             identity, would throw away a real learner over a dropped packet.
 *
 * Never rejects, so the caller cannot be left with a pending promise and a
 * boot state it can never leave.
 */
/** A refusal of the CREDENTIAL, not of the request: the server answered, and this
 *  device's secret does not authorise that record. 401/403 only — a 500 or a 429
 *  is the server failing to answer usefully, and clearing the identity for one
 *  would throw away a real learner over somebody else's outage. */
function isCredentialRefusal(code: string): boolean {
  return code === "unauthorized" || code === "forbidden" || code === "http_401" || code === "http_403";
}

async function probeProfile(id: string): Promise<{ state: ProfileState | null; gone: boolean; refused: boolean }> {
  const r = await api.probeProfile(id);
  if (r.status !== "ok") {
    // THREE ANSWERS, KEPT APART — and the middle one was being lost.
    //
    //   notFound     the server answered "I do not have this" — a FACT.
    //   refused      the server answered "not with that secret" — also a fact
    //                about this device, and not an outage. `transport.probe`
    //                already distinguishes it; collapsing it into "unreachable"
    //                is what made a stale id+secret pair sit on the boot screen
    //                through four retries and then forever, because the boot
    //                state is never mistaken for signed-out and nothing retries
    //                after the ceiling.
    //   unreachable  nobody answered. NO information: keep the identity, retry.
    if (r.status === "refused" && isCredentialRefusal(r.code)) {
      return { state: null, gone: false, refused: true };
    }
    return { state: null, gone: r.status === "notFound", refused: false };
  }
  if (r.data.secret && loadSecret() !== r.data.secret) writeSecret(r.data.secret);
  return { state: r.data, gone: false, refused: false };
}

export function useProfile(): {
  state: ProfileState | null;
  loading: boolean;
  set: (s: ProfileState) => void;
  status: ProfileStatus;
} {
  const ctx = useContext(AppCtx);
  const [own, setOwn] = useState<ProfileState | null>(null);
  const [ownLoading, setOwnLoading] = useState(true);
  useEffect(() => {
    if (ctx) return;
    const id = loadLocalProfileId();
    if (!id) { setOwnLoading(false); return; }
    fetchProfile(id).then((s) => { setOwn(s); setOwnLoading(false); });
  }, [ctx]);
  if (ctx) {
    return { state: ctx.profile, loading: ctx.profileStatus === "loading", set: ctx.setProfile, status: ctx.profileStatus };
  }
  return { state: own, loading: ownLoading, set: setOwn, status: ownLoading ? "loading" : profileStatusOf(own) };
}

// ── i18n context ────────────────────────────────────────────────────────────

interface I18nCtx { lang: string; setLang: (l: string) => void; t: (k: string) => string; dir: "ltr" | "rtl" }
const Ctx = createContext<I18nCtx>({ lang: "en", setLang: () => {}, t: (k) => k, dir: "ltr" });

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: string }) {
  const [lang, setLangState] = useState(initialLang ?? "en");
  useEffect(() => {
    const stored = window.localStorage.getItem("openmind:lang");
    if (stored && LANGS.some((l) => l.code === stored)) setLangState(stored);
  }, []);
  const setLang = useCallback((l: string) => {
    setLangState(l);
    window.localStorage.setItem("openmind:lang", l);
    const m = langMeta(l);
    document.documentElement.lang = l;
    document.documentElement.dir = m.dir;
  }, []);
  const t = useMemo(() => translator(lang), [lang]);
  const dir = isRtl(lang) ? "rtl" : "ltr";
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);
  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  return useContext(Ctx);
}

export function LanguagePicker({ compact }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <select
      aria-label={t("common.language")}
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      style={compact ? { maxWidth: 150 } : undefined}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.native}{" "}
          {l.status === "draft" ? "◐" : ""}
        </option>
      ))}
    </select>
  );
}

// ── Learning-language prefs (interface vs teaching vs answer vs school) ─────
// Anonymous-first: stored locally, upgraded to the profile when one exists.
// teaching = explanations, answer = student responds in, school = terms kept.
export interface LearnLangs { teaching: string; answer: string; school: string }

function readStored(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  return v && LANGS.some((l) => l.code === v) ? v : fallback;
}

export function useLearnLangs(profileLang?: string): {
  langs: LearnLangs;
  set: (p: Partial<LearnLangs>) => void;
} {
  const { lang } = useI18n();
  const base = profileLang ?? lang;
  const [over, setOver] = useState<Partial<LearnLangs>>({});
  useEffect(() => {
    setOver({
      teaching: readStored("openmind:teaching", base),
      answer: readStored("openmind:answer", base),
      school: readStored("openmind:school", base),
    });
  }, [base]);
  const set = useCallback((p: Partial<LearnLangs>) => {
    setOver((prev) => {
      const next = { ...prev, ...p };
      try {
        if (next.teaching) window.localStorage.setItem("openmind:teaching", next.teaching);
        if (next.answer) window.localStorage.setItem("openmind:answer", next.answer);
        if (next.school) window.localStorage.setItem("openmind:school", next.school);
      } catch { /* storage blocked: session-only */ }
      return next;
    });
  }, []);
  return {
    langs: {
      teaching: over.teaching ?? base,
      answer: over.answer ?? base,
      school: over.school ?? base,
    },
    set,
  };
}

// ── Shared bits ─────────────────────────────────────────────────────────────

export function MasteryBar({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="bar thin" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="stat">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function useActiveProfile(): ProfileState | null {
  const { state } = useProfile();
  return state;
}

/**
 * Where is this learner in the lifecycle? Under the shell this is the provider's
 * single derivation; outside it, the two hooks compose the same way.
 */
export function useLifecycle(): { lifecycle: Lifecycle; booting: boolean } {
  const ctx = useContext(AppCtx);
  const { status, session } = useAccount();
  const { state: profile, status: profileStatus } = useProfile();
  // Same rule as the provider's own derivation — the standalone fallback (a
  // component rendered outside the shell) must not disagree with it about who
  // the learner is.
  const isTeacher = !!session.account && session.account.role !== "student";
  const lifecycle = useMemo(
    () => ctx ? ctx.lifecycle : deriveLifecycle({ auth: status, profileStatus, profile, isTeacher }),
    [ctx, status, profileStatus, profile, isTeacher],
  );
  return { lifecycle, booting: lifecycle.booting };
}

/**
 * Back-compatible shape: `appState` is null ONLY while booting, which is the
 * one thing a caller genuinely cannot act on. Anything that reads `appState`
 * can no longer mistake "we do not know yet" for "no learner".
 */
export function useAppState(): { appState: Lifecycle | null; ready: boolean; lifecycle: Lifecycle } {
  const { lifecycle } = useLifecycle();
  return { appState: lifecycle.booting ? null : lifecycle, ready: !lifecycle.booting, lifecycle };
}

/** Should this page render, wait, or move the learner on? Pure decision in
 *  `lib/app-state.ts#resolveRoute`; this only supplies the current path. */
export function useRouteAccess(path?: string): { decision: RouteDecision; lifecycle: Lifecycle } {
  const { lifecycle } = useLifecycle();
  const pathname = usePathname();
  const decision = useMemo(
    () => resolveRoute(lifecycle, path ?? pathname ?? "/"),
    [lifecycle, path, pathname],
  );
  return { decision, lifecycle };
}

/** The learner's intent, carried through a redirect. Structural type so both
 *  `URLSearchParams` and Next's read-only variant are accepted. */
export function returnTarget(from: { get(k: string): string | null } | null | undefined, fallback: string): string {
  return safeReturnPath(from?.get("return"), fallback);
}

export function requireProfile(router: ReturnType<typeof useRouter>): string | null {
  const id = loadLocalProfileId();
  if (!id) {
    // Intent-preserving: never send a learner to onboarding and then forget
    // which page they actually asked for.
    const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard";
    router.push(withReturn("/onboarding", here));
    return null;
  }
  return id;
}
