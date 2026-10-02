// ─────────────────────────────────────────────────────────────────────────────
// THE TARGET ENVIRONMENT, DECLARED.
//
// OpenMind is built for schools where a class can be 50 learners, one teacher
// has no marking time, several children share a device, and the connection
// disappears for a week. Those are not edge cases to bolt on later — they are
// the constraints the product is designed around, so they are an INPUT the
// system reads rather than an assumption it makes.
//
// This module is the one owner of that input: the shape of a deployment
// profile, the profiles itself, the rules that validate one, and the DERIVED
// answers the rest of the app asks for ("may this device call the cloud?",
// "must the learner press sync?"). Nothing else may read a raw field to decide
// behaviour — a surface that reads `connectivity` and decides for itself is a
// second rule with its own bugs.
//
// WHY THE PROFILES ARE DATA IN THIS FILE, not `deploymentProfiles/*.json`:
// the profiles have to travel into the OFFLINE bundle (`docs/openmind.html`),
// which is a single file with no filesystem and no fetch of its own config.
// A JSON file read at runtime would exist on the server and be missing on
// exactly the device that needs it most. The JSON shape is still the authored
// format — `parseDeployment` accepts it and refuses a bad one by name — so an
// operator can supply their own through the environment without touching code.
//
// THREE RULES, kept from the rest of the product:
//   · an unknown or malformed profile is REFUSED with a reason, never silently
//     swapped for a default that would then shape what children are taught;
//   · a derived answer has one meaning, whatever the caller is;
//   · nothing here is required for learning to work — a bad profile leaves the
//     product usable offline, which is the state it is built for anyway.
// ─────────────────────────────────────────────────────────────────────────────

export type Connectivity = "offline" | "intermittent" | "online";
export type DeviceMode = "personal" | "shared" | "hub";
export type SyncFrequency = "manual" | "opportunistic" | "continuous";

export interface DeploymentProfile {
  id: string;
  label: string;
  /** What the connection actually does — the honest answer, not the best case. */
  connectivity: Connectivity;
  /** Whether a device belongs to one learner, is passed around a class, or IS the school's server. */
  deviceMode: DeviceMode;
  /** Bytes, not megabytes: everything downstream compares against a budget. */
  maxDeviceStorageBytes: number;
  /** Interface languages this site can actually render and has reviewers for. */
  languages: string[];
  teacherDevices: number;
  learnerDevices: number;
  /** How eagerly a queue of unmarked work is allowed to drain itself. */
  syncFrequency: SyncFrequency;
}

/**
 * The profiles. `default` is what an undeclared site gets, and it is named
 * `default` rather than pretending to be a real deployment — a site that has
 * declared nothing should not be described as a rural school.
 */
export const DEPLOYMENT_PROFILES: readonly DeploymentProfile[] = Object.freeze([
  {
    id: "default",
    label: "Default (undeclared site)",
    connectivity: "online",
    deviceMode: "personal",
    maxDeviceStorageBytes: 200_000_000,
    languages: ["en"],
    teacherDevices: 0,
    learnerDevices: 0,
    syncFrequency: "opportunistic",
  },
  {
    id: "rural_school",
    label: "Rural school — intermittent power and signal",
    connectivity: "offline",
    deviceMode: "hub",
    maxDeviceStorageBytes: 60_000_000,
    languages: ["en", "sw", "fr"],
    teacherDevices: 1,
    learnerDevices: 5,
    syncFrequency: "manual",
  },
  {
    id: "low_bandwidth_school",
    label: "Low-bandwidth school — metered data, occasional signal",
    connectivity: "intermittent",
    deviceMode: "hub",
    maxDeviceStorageBytes: 120_000_000,
    languages: ["en", "sw"],
    teacherDevices: 1,
    learnerDevices: 12,
    syncFrequency: "opportunistic",
  },
  {
    id: "shared_device",
    label: "Shared device — one classroom tablet, many learners",
    connectivity: "intermittent",
    deviceMode: "shared",
    maxDeviceStorageBytes: 150_000_000,
    languages: ["en", "hi", "bn"],
    teacherDevices: 1,
    learnerDevices: 1,
    syncFrequency: "opportunistic",
  },
  {
    id: "community_learning_hub",
    label: "Community learning hub — a hub the whole centre shares",
    connectivity: "online",
    deviceMode: "hub",
    maxDeviceStorageBytes: 400_000_000,
    languages: ["en", "pt", "fr"],
    teacherDevices: 2,
    learnerDevices: 20,
    syncFrequency: "continuous",
  },
]);

export const DEPLOYMENT_IDS = DEPLOYMENT_PROFILES.map((p) => p.id);

const CONNECTIVITIES: Connectivity[] = ["offline", "intermittent", "online"];
const DEVICE_MODES: DeviceMode[] = ["personal", "shared", "hub"];
const SYNC_FREQUENCIES: SyncFrequency[] = ["manual", "opportunistic", "continuous"];

/**
 * MAY THIS PROFILE BE USED? Returns the reason it may not, or null.
 *
 * The reason is a stable code, not a sentence, because the same refusal is
 * read by a server log, a settings screen and a test. An unreadable profile is
 * a configuration error and must never be rounded to the nearest built-in:
 * the profile decides how much content a device holds and whether children's
 * work may leave the building, and a silent substitution is how a school ends
 * up running a plan nobody chose.
 */
export function deploymentRefusal(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return "not_an_object";
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id.trim()) return "missing_id";
  if (!CONNECTIVITIES.includes(p.connectivity as Connectivity)) return "bad_connectivity";
  if (!DEVICE_MODES.includes(p.deviceMode as DeviceMode)) return "bad_device_mode";
  if (!SYNC_FREQUENCIES.includes(p.syncFrequency as SyncFrequency)) return "bad_sync_frequency";
  if (typeof p.maxDeviceStorageBytes !== "number" || !(p.maxDeviceStorageBytes > 0)) return "bad_storage_budget";
  if (!Array.isArray(p.languages) || p.languages.length === 0) return "no_languages";
  if (!p.languages.every((l) => typeof l === "string" && l.length >= 2 && l.length <= 8)) return "bad_language";
  for (const n of ["teacherDevices", "learnerDevices"] as const) {
    const v = p[n];
    if (typeof v !== "number" || v < 0 || !Number.isInteger(v)) return `bad_${n}`;
  }
  return null;
}

/** The profile with this id, or null. Never a fallback: an unknown id IS the error. */
export function profileById(id: string): DeploymentProfile | null {
  return DEPLOYMENT_PROFILES.find((p) => p.id === id) ?? null;
}

export interface ResolvedDeployment {
  profile: DeploymentProfile;
  /** "" when the declaration was honoured; otherwise WHY it was not. */
  problem: string;
  /** What the site asked for, verbatim — so a screen can show the request beside the result. */
  requested: string;
}

/**
 * WHAT THIS SITE IS RUNNING AS.
 *
 * `OPENMIND_DEPLOYMENT` names a built-in profile; `OPENMIND_DEPLOYMENT_PROFILE`
 * carries one as inline JSON, for a site whose environment is not on this list
 * yet. Client code can only see the `NEXT_PUBLIC_` form (Next inlines prefixed
 * variables at build time), which is the right shape anyway: a DEVICE is
 * configured, and the device's build is where its profile belongs.
 *
 * An unhonoured declaration returns the default profile AND the reason. The
 * product stays usable — a school with a typo in one environment variable can
 * still teach — but nothing anywhere is allowed to claim the profile was
 * applied.
 */
export function resolveDeployment(env: Record<string, string | undefined> = {}): ResolvedDeployment {
  const requested = (env.NEXT_PUBLIC_OPENMIND_DEPLOYMENT || env.OPENMIND_DEPLOYMENT || "").trim();
  const inline = (env.NEXT_PUBLIC_OPENMIND_DEPLOYMENT_PROFILE || env.OPENMIND_DEPLOYMENT_PROFILE || "").trim();
  const fallback = profileById("default")!;

  if (inline) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(inline);
    } catch {
      return { profile: fallback, problem: "profile_not_json", requested: inline.slice(0, 40) };
    }
    const refusal = deploymentRefusal(parsed);
    return refusal
      ? { profile: fallback, problem: refusal, requested: (parsed as { id?: string })?.id ?? inline.slice(0, 40) }
      : { profile: parsed as DeploymentProfile, problem: "", requested: (parsed as DeploymentProfile).id };
  }

  if (!requested) return { profile: fallback, problem: "", requested: "default" };
  const named = profileById(requested);
  return named
    ? { profile: named, problem: "", requested }
    : { profile: fallback, problem: "unknown_profile", requested };
}

/**
 * ── THE DERIVED ANSWERS ────────────────────────────────────────────────────
 *
 * Everything below is the ONLY way a caller asks a question about the
 * environment. They are pure functions of the profile, so a test can prove
 * each policy without a browser and every surface gets the same answer.
 */

/** May a request leave this device for OpenMind's cloud at all? An offline
 *  site answers NO even when a signal happens to be present: the build was
 *  configured not to depend on one, and a background call that works today and
 *  not tomorrow is how "it sometimes loses my work" starts. */
export function mayReachCloud(p: DeploymentProfile): boolean {
  return p.connectivity === "online";
}

/** Does the queue drain itself the moment the page opens / a signal returns?
 *  A manual site says no — its data is metered, and spending a child's credit
 *  on a sync the teacher did not ask for is not the app's decision to make. */
export function drainsOnArrival(p: DeploymentProfile): boolean {
  return p.syncFrequency !== "manual";
}

/** The periodic drain, in ms — or null when there is none. Only a site that
 *  declared a real connection gets a timer: a timer on a device that is trying
 *  to save power and bytes is the opposite of offline-first. */
export function drainIntervalMs(p: DeploymentProfile): number | null {
  return p.syncFrequency === "continuous" ? 60_000 : null;
}

// NOTE ON WHAT IS DELIBERATELY NOT HERE. `deviceMode`, `maxDeviceStorageBytes`
// and `languages` are declared and REPORTED (GET /api/hub-status) but no rule
// reads them yet: a learner switcher for a shared tablet, a pack that trims
// itself to the storage budget, and a language list restricted to what the
// site can serve are three behaviours, and an exported helper with no caller
// is scaffolding that drifts from the product. They arrive with their
// consumers, not before them.
