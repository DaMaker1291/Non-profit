// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS DEPLOYMENT IS CONFIGURED WITH — reported, never assumed.
//
// The deployment brief (§7, §11, §35) asks for environment validation as an
// executable check. That check has to be honest about this product's actual
// design, and the actual design is unusual: OpenMind needs NO environment
// variable to work. There is no database URL, no required key, no mandatory
// mail provider — a laptop with an empty `.env` runs the whole product, because
// offline-first is the point.
//
// So this module does not invent requirements to look like an enterprise
// checklist. It reports two different things, kept apart on purpose:
//
//   problems — configuration that is PRESENT AND WRONG. A key without the
//              endpoint it belongs to, a 4-character signing secret, a
//              deployment profile whose own validator refused it. These are
//              misconfigurations: something was set, and it will not do what it
//              looks like it does. A readiness check fails on these.
//
//   notes    — the honest shape of an undeclared site. No app URL, no impact
//              key, no explicit signing secret, data in the default directory.
//              None of that breaks learning, so none of it is an error; all of
//              it is what an operator should read before opening the doors.
//
// Pure: it takes an environment object, returns a report, touches no disk. That
// is what lets `npm run verify` pin the rules and `/api/ready` reuse them — one
// definition, two callers, no second opinion about what "configured" means.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { resolveDeployment, type ResolvedDeployment } from "./deployment";
// The one owner of "which storage backend does this configuration ask for", so
// this report and `lib/server/store.ts` cannot disagree about it.
import { STORE_ENV, storeKindReport } from "./server/storage";

export interface EnvProblem {
  /** The variable at fault, named so an operator can act on it. */
  key: string;
  /** A stable machine code, not a sentence — read by a log, a screen and a test. */
  code: string;
  /** One sentence an operator can act on. */
  detail: string;
}

export interface EnvNote {
  key: string;
  code: string;
  detail: string;
}

export interface EnvReport {
  /** No PROBLEMS. Notes are advice, not failures. */
  ok: boolean;
  /** The target environment this site declared (lib/deployment.ts). */
  deployment: ResolvedDeployment;
  /** Which AI provider, if any, is wired up — the same ordering lib/llm.ts uses. */
  ai: { provider: string; configured: boolean };
  /** The declared data directory, or "" when the default is in use. */
  dataDir: string;
  problems: EnvProblem[];
  notes: EnvNote[];
}

const VENDOR_KEYS = ["GEMINI_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"] as const;

/**
 * The hosts that DISCARD their filesystem between releases.
 *
 * Each variable below is documented by the platform that sets it as an
 * always-present runtime marker: Render's own docs say `RENDER` "is always
 * true", Heroku sets `DYNO`, Fly sets `FLY_APP_NAME`, Cloud Run sets
 * `K_SERVICE`, Azure App Service sets `WEBSITE_SITE_NAME`. Recognising the host
 * matters because a declaration like `OPENMIND_DATA_DIR=/data` reads identically
 * on a laptop and in a container — and means opposite things. On a laptop
 * `/data` is that machine's disk; in a container platform with no volume
 * attached it is a directory in the layer the next deploy throws away.
 *
 * Measured, on a real deployment: a host with no volume answered
 * `/api/ready` with `ready:true`, `data:{ok:true,code:"writable"}` and **no
 * problems** while every learner record was destroyed about fifteen minutes
 * after their last click — the store was declared, writable, and gone. Nothing
 * in this report could see it, because a declaration is not a promise.
 */
const EPHEMERAL_HOSTS = [
  ["RENDER", "Render"],
  ["DYNO", "Heroku"],
  ["FLY_APP_NAME", "Fly.io"],
  ["K_SERVICE", "Cloud Run"],
  ["WEBSITE_SITE_NAME", "Azure App Service"],
] as const;

/** The host that discards its filesystem, or "" when this is not such a host (a
 *  laptop, a CI runner, a self-hosted box). */
export function ephemeralHost(env: Record<string, string | undefined> = {}): string {
  for (const [key, name] of EPHEMERAL_HOSTS) {
    if ((env[key] ?? "").trim()) return name;
  }
  return "";
}

/** The device a path lives on, walking up to the nearest EXISTING ancestor
 *  (a directory the store will create on first write does not exist yet), or
 *  `null` when nothing on the path can be stat-ed. */
function deviceOf(target: string): number | null {
  let current = path.resolve(target);
  for (let i = 0; i < 64; i++) {
    try {
      return fs.statSync(current).dev;
    } catch { /* keep climbing */ }
    const up = path.dirname(current);
    if (up === current) return null;
    current = up;
  }
  return null;
}

/**
 * Is the data directory on a filesystem of ITS OWN?
 *
 *   true  — a different device from the filesystem root;
 *   false — the same filesystem as everything else;
 *   null  — could not be determined.
 *
 * ⚠ `true` IS NOT A VOLUME, and this function is not the durability judgement.
 * Measured on a live deployment (Render, free instance type, no disk attached):
 * a device of its own, `/api/ready` answering `durability:"durable"` — and
 * `npm run verify:persistence -- --verify` reporting **4 passed, 30 failed**
 * after a deploy replaced the process, every learner-scoped read a 404. Inside a
 * container the app directory is routinely a mount of its own, and the host
 * throws it away with the image. So a device number is a reason to look, never a
 * reason to promise: `dataDirDurability` below is the judgement, and this is
 * one of its inputs.
 */
export function dataDirOnOwnFilesystem(dir: string): boolean | null {
  const target = path.resolve(dir);
  const here = deviceOf(target);
  const root = deviceOf(path.parse(target).root);
  if (here === null || root === null) return null;
  return here !== root;
}

/**
 * Filesystems that are a VIEW of something else rather than a disk of their
 * own: the image layer a host builds each release into, a bind of it, or memory.
 * A mount with one of these is not a volume however separate its device looks —
 * which is the whole reason `/proc/self/mountinfo` is read instead of trusting a
 * device number.
 */
const NON_VOLUME_FSTYPES = [
  "overlay",
  "overlayfs",
  "aufs",
  "tmpfs",
  "ramfs",
  "devtmpfs",
  "squashfs",
  "fuse",
];

/** Mount points come out of `/proc/self/mountinfo` escaped `\040`-style. */
function unescapeMountPath(raw: string): string {
  return raw.replace(/\\([0-7]{3})/g, (_m, oct) => String.fromCharCode(Number.parseInt(oct, 8)));
}

/** Is `child` `parent` itself, or beneath it? A single owner for the question,
 *  because "is this path inside that one" has a trailing-separator trap: a
 *  naive `startsWith` calls `/data-old` a child of `/data`. */
function isWithin(child: string, parent: string): boolean {
  if (parent === path.sep) return true;
  return child === parent || child.startsWith(parent.endsWith(path.sep) ? parent : parent + path.sep);
}

/** The kernel's mount table, or `null` where there is none to read (not Linux).
 *  Only `/proc/self/mountinfo` is parsed: `/proc/mounts` spells the same facts
 *  differently, and two parsers for one fact is how they drift apart. */
function readMountTable(): string | null {
  try {
    return fs.readFileSync("/proc/self/mountinfo", "utf8");
  } catch {
    return null;
  }
}

/** What the filesystem under a data directory IS, as far as this process can
 *  measure it. */
export type DataDirDurability = "volume" | "host-filesystem" | "unknown";

/**
 * WILL THE HOST KEEP THIS DIRECTORY?
 *
 *   "volume"          — the longest mount point above it is a filesystem of its
 *                       own that is not a view of the image: a disk the host
 *                       preserves across deploys and restarts;
 *   "host-filesystem" — it sits on the container's root filesystem, or on an
 *                       overlay/bind/tmpfs mount, which is the same fact: the
 *                       next deploy or cold start takes it with it;
 *   "unknown"         — nothing on the path could be measured. Reported as
 *                       unknown, never as a pass.
 *
 * The mount TABLE is the measurement, not the device number, and that is a
 * lesson from a real deployment rather than a preference: a container's app
 * directory is a mount of its own (so "different device" said volume) while
 * being an overlay the host discards with the image (so every learner was lost).
 * An overlay or tmpfs mount IS the host's filesystem, and saying so is the point
 * of this function.
 *
 * `mountInfo` is the table's TEXT, injectable so a test can drive the real
 * deploy layouts (a disk at `/data`, the same path inside an overlay) on one
 * machine instead of asserting the rule from memory.
 */
export function dataDirDurability(dir: string, mountInfo?: string | null): DataDirDurability {
  const target = path.resolve(dir);
  const table = mountInfo === undefined ? readMountTable() : mountInfo;
  if (table) {
    // The DEEPEST mount point that contains the directory decides: a disk
    // mounted under an overlay wins over the overlay above it, which is exactly
    // the difference between data kept and data discarded.
    let best: { at: string; fstype: string } | null = null;
    for (const line of table.split("\n")) {
      if (!line.trim()) continue;
      const [head, tail] = line.split(" - ");
      if (!head || tail === undefined) continue;
      const at = unescapeMountPath(head.split(" ")[4] ?? "");
      if (!at || !isWithin(target, at)) continue;
      if (best === null || at.length > best.at.length) {
        best = { at, fstype: (tail.split(" ")[0] ?? "").toLowerCase() };
      }
    }
    if (best === null) return "unknown";
    if (best.at === path.sep) return "host-filesystem";
    const fstype = best.fstype;
    if (NON_VOLUME_FSTYPES.some((t) => fstype === t || fstype.startsWith(`${t}.`))) return "host-filesystem";
    return "volume";
  }
  // No mount table to read, so the device comparison is all that is left. Its
  // strong direction still holds (the same device as the root IS the host's
  // filesystem); its weak one does not, and saying "volume" there is the false
  // promise above. So: refuse the claim, never invent it.
  return dataDirOnOwnFilesystem(target) === false ? "host-filesystem" : "unknown";
}

/** Facts a caller can supply instead of measuring, so a test can drive every
 *  branch of the durability rule on one machine (and so a caller that has
 *  already measured the directory does not have to do it twice). */
export interface EnvFacts {
  /** The judgement itself, from `dataDirDurability`. `"unknown"` is the
   *  explicit "could not be measured" — there is no `null` spelling of it, so a
   *  caller cannot say "unknown" by forgetting a field. */
  dataDirDurability?: DataDirDurability;
}

/**
 * The provider `lib/llm.ts` would actually call, in its own precedence order.
 * Kept here as a REPORTER, not a decision: the tutor reads aiStatus() itself, and
 * this exists so /api/ready and the production gate can name the same answer
 * without a third copy of the ordering.
 */
export function aiProviderOf(env: Record<string, string | undefined> = {}): string {
  if ((env.OPENMIND_AI_BASE_URL ?? "").trim() && (env.OPENMIND_AI_KEY ?? "").trim()) return "custom";
  if ((env.GEMINI_API_KEY ?? "").trim()) return "gemini";
  if ((env.OPENAI_API_KEY ?? "").trim()) return "openai";
  if ((env.GROQ_API_KEY ?? "").trim()) return "groq";
  if ((env.OPENROUTER_API_KEY ?? "").trim()) return "openrouter";
  return "offline";
}

/**
 * Read the environment and say what is wrong and what is merely undeclared.
 *
 * The order of checks is deliberate: the deployment profile is first because it
 * shapes what children are taught, and a refused profile is the only
 * misconfiguration here that changes the product rather than a credential.
 */
export function envReport(env: Record<string, string | undefined> = {}, facts: EnvFacts = {}): EnvReport {
  const problems: EnvProblem[] = [];
  const notes: EnvNote[] = [];

  // 1. The declared environment. resolveDeployment returns the DEFAULT plus the
  //    reason it was refused — and a refusal is a configuration error that must
  //    be visible, never rounded to the nearest built-in.
  const deployment = resolveDeployment(env);
  if (deployment.problem) {
    problems.push({
      key: "OPENMIND_DEPLOYMENT",
      code: deployment.problem,
      detail: `the requested deployment profile “${deployment.requested}” was refused, so the site is running the built-in default profile — the connectivity, storage budget and language rules are NOT what was asked for`,
    });
  }

  // 2. The custom AI endpoint. Both halves are needed: a base URL with no key
  //    gets a 401 from the provider, and a key with no base URL is never read.
  const baseUrl = (env.OPENMIND_AI_BASE_URL ?? "").trim();
  const baseKey = (env.OPENMIND_AI_KEY ?? "").trim();
  if (baseUrl && !baseKey) {
    problems.push({
      key: "OPENMIND_AI_KEY",
      code: "ai_key_missing",
      detail: "OPENMIND_AI_BASE_URL is set but OPENMIND_AI_KEY is not, so every call to your own model is refused and the offline tutor answers instead",
    });
  }
  if (!baseUrl && baseKey) {
    problems.push({
      key: "OPENMIND_AI_BASE_URL",
      code: "ai_base_url_missing",
      detail: "OPENMIND_AI_KEY is set but OPENMIND_AI_BASE_URL is not, so the key is never used",
    });
  }

  // 3. The session signing secret. 32+ random characters is the bar here; a
  //    short secret still signs, which is exactly why it must be reported —
  //    the cookie is HttpOnly and the epoch is signed, but a guessable HMAC key
  //    defeats both.
  const secret = (env.OPENMIND_SESSION_SECRET ?? "").trim();
  if (secret && secret.length < 32) {
    problems.push({
      key: "OPENMIND_SESSION_SECRET",
      code: "session_secret_short",
      detail: `the session signing secret is ${secret.length} characters; use at least 32 random characters`,
    });
  }
  if (!secret) {
    notes.push({
      key: "OPENMIND_SESSION_SECRET",
      code: "session_secret_generated",
      detail: "no signing secret is set, so one is generated in the data directory on first run — fine for a single instance, but set it explicitly when running more than one, and keep it beside a backup so a restore does not sign every learner out",
    });
  }

  // 4. The impact report's publisher key. Without it /api/impact is open, which
  //    is the right default for a single school and the wrong one for a public
  //    site. Also checked for length, since a set key implies intent to protect.
  const impact = (env.OPENMIND_IMPACT_KEY ?? "").trim();
  if (impact && impact.length < 16) {
    problems.push({
      key: "OPENMIND_IMPACT_KEY",
      code: "impact_key_short",
      detail: "the impact key is shorter than 16 characters; use a random value long enough to not be guessed",
    });
  }
  if (!impact) {
    notes.push({
      key: "OPENMIND_IMPACT_KEY",
      code: "impact_open",
      detail: "the aggregate impact report is unauthenticated; set OPENMIND_IMPACT_KEY before exposing this deployment publicly",
    });
  }

  // 5. The public origin. Absent means canonical URLs, share metadata and the
  //    sitemap have no origin to name — a note, never an error, because every
  //    learning route works without it.
  const appUrl = (env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (!appUrl) {
    notes.push({
      key: "NEXT_PUBLIC_APP_URL",
      code: "app_url_unset",
      detail: "no public origin is declared, so canonical URLs, share metadata and the sitemap have no hostname to name",
    });
  } else if (!/^https?:\/\/[^\s/]+/.test(appUrl)) {
    problems.push({
      key: "NEXT_PUBLIC_APP_URL",
      code: "app_url_bad",
      detail: "NEXT_PUBLIC_APP_URL must be an absolute URL (for example https://openmind.example.org)",
    });
  }

  // 6. Where the learning data lives, AND WHETHER IT CAN SURVIVE A REDEPLOY.
  //
  //    Data in the application directory is fine on a school laptop and wrong in
  //    a container: the next deploy replaces the image, and a classroom goes with
  //    it. `/api/ready`'s storage check cannot see the difference — a writable
  //    store in a container's ephemeral layer answers "writable" right up to the
  //    redeploy that discards it, which is how a host can report ready:true and
  //    still lose every learner on the next push.
  //
  //    So on the PRODUCTION artefact an undeclared data directory is a READINESS
  //    PROBLEM, not a note. Two ways out, and both are deliberate acts: declare
  //    the directory on a durable volume, or say in so many words that this
  //    deployment accepts an ephemeral store (OPENMIND_ALLOW_EPHEMERAL_STORE),
  //    which turns it back into a note for a throwaway demo instance. A laptop is
  //    unaffected — `./start-openmind.sh` declares its data directory and the
  //    Dockerfile sets /data — because the case this catches is the host that
  //    starts the image with an empty environment and no operator watching.
  //
  //    AND A DECLARED DIRECTORY IS NOT AUTOMATICALLY DURABLE, which is the half
  //    that a real deployment slipped through: `OPENMIND_DATA_DIR=/data` is
  //    silent on a host with no volume attached, because the declaration is
  //    about a PATH and the question is about a FILESYSTEM. Measured on a live
  //    Render service with no disk: /api/ready answered ready:true,
  //    data:{ok:true,code:"writable"}, problems:[] — and a learner created 20
  //    minutes earlier was HTTP 404 twenty minutes later, after the instance had
  //    slept and been replaced. So when the environment says it is running on a
  //    host that discards its filesystem, the data directory must be a VOLUME,
  //    decided by the mount table rather than by a device number — and a device
  //    of its own was then measured to be the wrong test on that very host (see
  //    `dataDirOnOwnFilesystem`, where the drill's 4/30 is recorded). If it is
  //    not a volume, that is a problem, and the escapes are the same two as
  //    above.
  const dataDir = (env.OPENMIND_DATA_DIR ?? "").trim();
  const host = ephemeralHost(env);
  const production = (env.NODE_ENV ?? "").trim() === "production" || Boolean(host);
  const acceptsEphemeral = /^(1|true|yes)$/i.test((env.OPENMIND_ALLOW_EPHEMERAL_STORE ?? "").trim());
  if (!dataDir) {
    const detail =
      "learning data lives in ./.openmind-data inside the application directory, and a redeploy replaces that directory — point OPENMIND_DATA_DIR at a durable volume, or set OPENMIND_ALLOW_EPHEMERAL_STORE=1 to accept that this deployment's learner records are lost on every deploy";
    if (production && !acceptsEphemeral) {
      problems.push({ key: "OPENMIND_DATA_DIR", code: "data_dir_undeclared", detail });
    } else {
      notes.push({ key: "OPENMIND_DATA_DIR", code: "data_dir_default", detail });
    }
  } else if (acceptsEphemeral) {
    notes.push({
      key: "OPENMIND_ALLOW_EPHEMERAL_STORE",
      code: "ephemeral_store_accepted",
      detail: `this deployment declares ${dataDir} AND says it accepts an ephemeral store, so losing it on a deploy is a known state rather than a surprise`,
    });
  } else if (host) {
    // The judgement is `dataDirDurability`, and it reads the MOUNT TABLE — the
    // one measurement that separates a disk the host keeps from an overlay it
    // rebuilds. A device number cannot: inside a container the app directory has
    // a device of its own and is still thrown away with the image, and that
    // exact false promise was measured on a live deployment (see
    // `dataDirOnOwnFilesystem`). An injected fact is honoured and never
    // re-measured, or the unknown case would report a confident answer on the
    // caller's behalf.
    const durability = facts.dataDirDurability ?? dataDirDurability(dataDir);
    if (durability === "host-filesystem") {
      problems.push({
        key: "OPENMIND_DATA_DIR",
        code: "data_dir_not_durable",
        detail: `this host (${host}) replaces its filesystem when it deploys or restarts, and ${dataDir} is not a volume of its own — it is a directory on the root filesystem or on a mount (overlay, bind, tmpfs) that the host rebuilds with the image, so every learner record and evidence ledger is lost on the next sleep or deploy. Attach a disk and point OPENMIND_DATA_DIR at its mount path, or set OPENMIND_ALLOW_EPHEMERAL_STORE=1 to accept losing them`,
      });
    } else if (durability === "unknown") {
      notes.push({
        key: "OPENMIND_DATA_DIR",
        code: "durability_unknown",
        detail: `this host (${host}) discards its filesystem, and whether ${dataDir} is a volume of its own could NOT be determined — verify the volume is attached and mounted at that path before trusting the store`,
      });
    }
    // "volume" — a filesystem of its own that is not a view of the image.
    // Silence, because that is the only answer with nothing left to ask for.
  }

  // 6b. WHICH STORE, and whether this build can serve it. A deployment that
  //     names a backend the build does not implement must be told so as a
  //     configuration PROBLEM rather than discovering it from a stack trace on
  //     the first answer — and the file store must never be served to a site that
  //     asked for a database. The refusal itself lives in the store (every
  //     learner-scoped route imports it and fails at the door); this is the half
  //     an operator can READ, including from /api/ready.
  const store = storeKindReport(env);
  if (store.problem) {
    problems.push({ key: STORE_ENV, code: store.problem.code, detail: store.problem.detail });
  }

  // 6c. A DATABASE THAT IS PROVISIONED AND NOT READ.
  //
  //     This is reported because it is the easiest way for an operator to be
  //     wrong about where a learner's record lives: hand the deployment a
  //     connection string, tick the box mentally, and the store is still a
  //     directory of JSON files that the next deploy replaces. The schema and
  //     its migrations exist and are exercised by `npm run db:verify`; what does
  //     not exist is the code that reads them — docs/STORAGE_SPEC.md slice 3 (the
  //     learner write path) and slice 4 (the backend). So while the store is
  //     file-backed, a configured database is a NOTE naming what is still true,
  //     never a silent implication that the data is in it.
  const databaseUrl = (env.DATABASE_URL ?? "").trim();
  if (databaseUrl) {
    if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
      problems.push({
        key: "DATABASE_URL",
        code: "database_url_bad",
        detail: "DATABASE_URL must be a postgres:// or postgresql:// connection string",
      });
    } else if (store.kind === "file") {
      notes.push({
        key: "DATABASE_URL",
        code: "database_provisioned_not_used",
        detail: `a database is configured, but this build's store is FILE-BACKED (${dataDir || "./.openmind-data"}) and does not read or write it — the cutover onto the database is docs/STORAGE_SPEC.md slice 3 (the learner write path) and slice 4 (the backend), so until they land every record still lives on the filesystem this host replaces`,
      });
    }
  }

  // 7. The AI timeout must be a sane number of milliseconds, or a typo silently
  //    becomes either an instant fallback or a 2-minute hang.
  const timeoutRaw = (env.OPENMIND_AI_TIMEOUT_MS ?? "").trim();
  if (timeoutRaw) {
    const n = Number(timeoutRaw);
    if (!Number.isFinite(n) || n < 500 || n > 120_000) {
      problems.push({
        key: "OPENMIND_AI_TIMEOUT_MS",
        code: "ai_timeout_bad",
        detail: "OPENMIND_AI_TIMEOUT_MS must be a number of milliseconds between 500 and 120000",
      });
    }
  }

  const provider = aiProviderOf(env);
  if (provider === "offline") {
    notes.push({
      key: VENDOR_KEYS.join("/"),
      code: "no_model_configured",
      detail: "no model is configured, so the deterministic offline tutor answers every learner in their own language — a supported deployment, not a degraded one",
    });
  }

  return {
    ok: problems.length === 0,
    deployment,
    ai: { provider, configured: provider !== "offline" },
    dataDir,
    problems,
    notes,
  };
}

/** One line for a startup log or a gate's output. Never contains a secret value
 *  — only which variables are present and whether they are well-formed. */
export function envSummary(report: EnvReport): string {
  const p = report.problems.length;
  return `${report.deployment.profile.id} · ai=${report.ai.provider} · ${p === 0 ? "configuration ok" : `${p} configuration problem(s)`}`;
}
