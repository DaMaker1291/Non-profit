"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ProfileState, PublicAccount, SubjectCourse, SubjectId } from "./types";
import {
  deriveLifecycle, profileStatusOf, resolveRoute, safeReturnPath, withReturn,
  type AuthStatus, type Lifecycle, type ProfileStatus, type RouteDecision,
} from "./app-state";
import { LANGS, isRtl, langMeta, translator } from "./i18n";

// ── Identity on this device ─────────────────────────────────────────────────
// One event, one meaning: "the learner identity stored on this device changed".
// Sign-up, sign-in, sign-out, profile creation and account-claiming all end in
// a write here, and the AppProvider re-probes the server when it fires. This is
// what stops the classic bug where a client-side navigation right after signing
// in is served by a session provider that still believes nobody is signed in.

export const SESSION_EVENT = "openmind:session";

function emitSessionChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// ── Profile bootstrap ───────────────────────────────────────────────────────

export function loadLocalProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("openmind:profileId");
}

export function storeLocalProfileId(id: string): void {
  if (typeof window === "undefined") return;
  const changed = window.localStorage.getItem("openmind:profileId") !== id;
  window.localStorage.setItem("openmind:profileId", id);
  // Emit on CHANGE only. The provider's own probe writes the same values back,
  // and an unconditional emit would make the probe trigger itself forever.
  if (changed) emitSessionChange();
}

/** Store the capability secret, announcing a change only when it really is one
 *  (same reason as above: an emit loop is an infinite probe loop). */
function storeSecret(secret: string): void {
  if (typeof window === "undefined") return;
  const changed = window.localStorage.getItem(SECRET_KEY) !== secret;
  window.localStorage.setItem(SECRET_KEY, secret);
  if (changed) emitSessionChange();
}

// Audit P0-E: the profile's capability secret. The id alone stopped being a
// credential — every authenticated write/read also presents this token. It is
// generated once with the profile and lives in localStorage next to the id.
const SECRET_KEY = "openmind:profileSecret";

export function loadLocalProfileSecret(): string | null {
  if (typeof window === "undefined") return null;
  return ensureProfileSecret();
}

/**
 * A read URL with the caller's capability attached.
 *
 * Every learner-scoped GET presents the secret now, not just an id: an id is
 * not a credential (it sits in URLs and screenshots). Callers that must also
 * name themselves in the query — the class door asks with `me=` — build that
 * part themselves; this appends only the token, so exactly one place knows how
 * a capability travels over HTTP.
 */
export function withCapability(url: string): string {
  const secret = loadLocalProfileSecret() ?? "";
  return `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}`;
}

/** Load-or-create the capability secret (audit P0-E rollout). Profiles created
 *  before secrets existed get one generated here; the server binds it to this
 *  id on the first authenticated call if the profile has none yet. From then
 *  on the binding is immutable — the secret IS the credential. */
export function ensureProfileSecret(): string {
  let s = window.localStorage.getItem(SECRET_KEY);
  if (!s) {
    s = crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(SECRET_KEY, s);
  }
  return s;
}

// ── Real accounts ───────────────────────────────────────────────────────────
// Sign-up / sign-in return the whole learner profile plus its capability
// secret; adoptSession() writes both to localStorage so every existing learner
// API keeps working on this device. That is what makes an account actually
// save the work rather than just label it.

export interface AccountSession {
  account: PublicAccount | null;
  profile: ProfileState | null;
  secret: string | null;
}

export const EMPTY_SESSION: AccountSession = { account: null, profile: null, secret: null };

export function adoptSession(s: AccountSession): void {
  if (typeof window === "undefined") return;
  if (s.profile) storeLocalProfileId(s.profile.profile.id);
  if (s.secret) storeSecret(s.secret);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("openmind:profileId");
  window.localStorage.removeItem(SECRET_KEY);
  emitSessionChange();
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

export async function signUp(input: SignUpInput): Promise<AccountSession> {
  const claim = input.claimCurrent ? currentGuestClaim() : null;
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, claim }),
  });
  const data = (await res.json()) as AccountSession & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "signup_failed");
  adoptSession(data);
  return data;
}

export async function signIn(email: string, password: string): Promise<AccountSession> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as AccountSession & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "login_failed");
  adoptSession(data);
  return data;
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  clearSession();
}

/** Who is signed in on this device, and which learner profile that is. */
export async function fetchSession(): Promise<AccountSession> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return EMPTY_SESSION;
    const data = (await res.json()) as AccountSession;
    if (data.profile) adoptSession(data);
    return data.account ? data : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
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
  const res = await fetch("/api/auth/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(claim),
  });
  const data = (await res.json()) as AccountSession & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "claim_failed");
  adoptSession(data);
}

export async function updateAccount(patch: {
  name?: string; role?: string; currentPassword?: string; newPassword?: string;
}): Promise<void> {
  const res = await fetch("/api/auth/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "update_failed");
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
      fetchProfile(id).then((p) => {
        if (!alive) return;
        setProfile(p);
        setProfileStatus(profileStatusOf(p));
      });
    });
    return () => { alive = false; };
  }, [generation]);

  useEffect(() => {
    const on = () => setGeneration((g) => g + 1);
    window.addEventListener(SESSION_EVENT, on);
    return () => window.removeEventListener(SESSION_EVENT, on);
  }, []);

  const lifecycle = useMemo(
    () => deriveLifecycle({ auth, profileStatus, profile }),
    [auth, profileStatus, profile],
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
export function useAccount(): { session: AccountSession; status: AuthStatus; ready: boolean } {
  const ctx = useContext(AppCtx);
  const [own, setOwn] = useState<AccountSession>(EMPTY_SESSION);
  const [ownStatus, setOwnStatus] = useState<AuthStatus>("booting");
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
  }, [ctx]);
  if (ctx) return { session: ctx.session, status: ctx.auth, ready: ctx.auth !== "booting" };
  return { session: own, status: ownStatus, ready: ownStatus !== "booting" };
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
  // Audit P0-E: every profile is born with its capability secret. A signed-in
  // learner needs none — the session cookie authorises the write.
  const secret = ensureProfileSecret();
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...init, secret }),
  });
  if (!res.ok) throw new Error("profile create failed");
  const state = (await res.json()) as ProfileState;
  // Adopt the profile as *this device's* learner. Both halves matter: without
  // the id every later page reads "no profile", without the secret every later
  // write is rejected — and the guest path has no session to fall back on.
  storeLocalProfileId(state.profile.id);
  if (state.secret) storeSecret(state.secret);
  return state;
}

/** Save changes to the existing learner profile (used by the enrolment flow
 *  and the settings pages). Falls back to creating one if there is none. */
export async function saveProfilePatch(
  patch: Partial<Parameters<typeof createProfile>[0]> & Record<string, unknown>,
): Promise<ProfileState> {
  const id = loadLocalProfileId();
  const secret = ensureProfileSecret();
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...patch, id: id ?? undefined, secret }),
  });
  if (!res.ok) throw new Error("profile save failed");
  const state = (await res.json()) as ProfileState;
  if (state.profile?.id) storeLocalProfileId(state.profile.id);
  if (state.secret) storeSecret(state.secret);
  return state;
}

export async function fetchProfile(id: string): Promise<ProfileState | null> {
  // Present the stored capability secret when there is one: legacy profiles
  // (no server-side secret yet) bind the caller's token on this first
  // authenticated call. On a device that has only just signed in there is no
  // secret yet — the session cookie authorises the read instead.
  const stored = window.localStorage.getItem(SECRET_KEY);
  const qs = new URLSearchParams({ id });
  if (stored) qs.set("secret", stored);
  const res = await fetch(`/api/profile?${qs.toString()}`);
  if (!res.ok) return null;
  const state = (await res.json()) as ProfileState;
  // Written directly, NOT through storeSecret: this call is made by the session
  // provider's own probe, so announcing a change here would make the provider
  // re-probe itself. The identity is unchanged; only the token is new.
  if (state.secret) window.localStorage.setItem(SECRET_KEY, state.secret);
  return state;
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
  const { status } = useAccount();
  const { state: profile, status: profileStatus } = useProfile();
  const lifecycle = useMemo(
    () => ctx ? ctx.lifecycle : deriveLifecycle({ auth: status, profileStatus, profile }),
    [ctx, status, profileStatus, profile],
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
