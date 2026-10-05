// ─────────────────────────────────────────────────────────────────────────────
// WHICH BUILD IS THIS? A pure, one-line answer.
//
// §31 of the deployment brief asks for version visibility: an operator needs to
// know exactly which release a learner was using, and a learner must never be
// shown a build id they have no use for. So the identity is DATA here and the
// surfaces decide whether to display it: the operator's `/api/health` and
// `/api/ready` report it, and nothing child-facing reads this module.
//
// The application version is a constant rather than a JSON import because a
// Next route may be bundled without `resolveJsonModule`; a copy that drifts from
// package.json is caught by the engine gate (`npm run verify` pins the pair).
// ─────────────────────────────────────────────────────────────────────────────

/** The application's own version. Must equal `version` in package.json. */
export const APP_VERSION = "1.0.0";

/**
 * The DEPLOYMENT identity: a value an operator sets on every release so a
 * learner's session can be traced to one artefact. It is deliberately separate
 * from APP_VERSION — a hotfix deploy is a new deployment id and the same
 * application version — and it falls back to a local marker so an undeclared
 * build says so instead of inventing a commit hash.
 *
 * Read from, in order: OPENMIND_DEPLOYMENT_ID (server), NEXT_PUBLIC_APP_VERSION
 * (inlined into the client build), or `local-<APP_VERSION>` when neither is set.
 */
export function deploymentId(env: Record<string, string | undefined> = {}): string {
  const explicit = (env.OPENMIND_DEPLOYMENT_ID ?? "").trim();
  if (explicit) return explicit.slice(0, 64);
  const publicVersion = (env.NEXT_PUBLIC_APP_VERSION ?? "").trim();
  if (publicVersion) return publicVersion.slice(0, 64);
  return `local-${APP_VERSION}`;
}

/** True when the deployment id was set by an operator (not the local fallback).
 *  A ready-check reports the difference rather than passing off `local-…` as a
 *  release identifier. */
export function deploymentDeclared(env: Record<string, string | undefined> = {}): boolean {
  return Boolean((env.OPENMIND_DEPLOYMENT_ID ?? env.NEXT_PUBLIC_APP_VERSION ?? "").trim());
}
