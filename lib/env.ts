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

import { resolveDeployment, type ResolvedDeployment } from "./deployment";

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
export function envReport(env: Record<string, string | undefined> = {}): EnvReport {
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

  // 6. Where the learning data lives. A note, not an error: this product is
  //    designed to run with data in the application directory. But a real
  //    deployment should point it at a durable volume, and saying so is the
  //    difference between a backup plan and a hope.
  const dataDir = (env.OPENMIND_DATA_DIR ?? "").trim();
  if (!dataDir) {
    notes.push({
      key: "OPENMIND_DATA_DIR",
      code: "data_dir_default",
      detail: "learning data lives in ./.openmind-data inside the application directory; point OPENMIND_DATA_DIR at a durable volume so a redeploy cannot discard a classroom",
    });
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
