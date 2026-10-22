import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/server/store";
// The ONE owner of "which backend this configuration asks for" AND of "may this
// deployment keep a learner record". /api/ready must not re-decide either, and an
// operator must be able to read both without a stack trace (docs/STORAGE_SPEC.md
// acceptance 6). `storeKindReport` is reached through `storeReadiness`, which is
// the rule the write path enforces — one function, three callers, one answer.
import { envReport, storeReadiness } from "@/lib/env";
// The store's own record of the processes that have opened it: the only
// MEASUREMENT of persistence available from inside a process, reported beside
// the declaration and never instead of it.
import { recordBoot } from "@/lib/server/boot-log";
import { CONCEPTS } from "@/lib/genome";
import { SPECIFICATIONS } from "@/lib/specifications";
import { APP_VERSION, deploymentDeclared, deploymentId } from "@/lib/version";

/**
 * GET /api/ready — READINESS. "Can this instance actually serve a learner?"
 *
 * The deployment brief (§11) asks for the three things a readiness check must
 * establish — storage, required configuration, and the critical services this
 * product actually has — and then warns against exposing sensitive diagnostics
 * publicly. Both rules are honoured by what this route does NOT return:
 *
 *   · no filesystem paths, no secret values, no learner counts;
 *   · a failed check reports its NAME and a stable CODE, so an operator can act
 *     on it (with the detail in the server log) without a stranger learning the
 *     deployment's layout from a public endpoint.
 *
 * The three checks, and why each is real rather than ceremonial:
 *
 *   data    — the store must be writable. Every learner action is a write to
 *             the data directory, so an unwritable volume is not "degraded":
 *             the product cannot record an answer at all.
 *   config  — the declared configuration must be well-formed (lib/env.ts). A
 *             refused deployment profile or a half-set AI endpoint is a real
 *             fault: the site is not doing what it was configured to do.
 *   content — the content graph must resolve to concepts and specifications. An
 *             engine that loads to an empty catalogue can still answer HTTP 200
 *             and teach nothing.
 *
 * Returns 200 when all three pass and 503 (Service Unavailable) otherwise, which
 * is what a load balancer's readiness probe understands. Liveness — the cheap
 * "is this process alive" question — is GET /api/health.
 */
export async function GET(): Promise<NextResponse> {
  const report = envReport(process.env);

  // 1. Storage: a real write, a real read-back, and a real unlink. Asking
  //    `access()` proves less — a read-only mount passes a permissions check and
  //    still loses every answer.
  //    AND WHEN IT FAILS IT NAMES THE PATH AND THE ERROR. "not_writable" is the
  //    truth and useless on its own: measured on a live Render service, an
  //    `OPENMIND_DATA_DIR` pointing at a directory the process may not create
  //    reported exactly that, while the operator had no way to tell WHICH path
  //    the server had resolved (`path.resolve` of a relative value depends on the
  //    process's cwd) or whether the cause was permission (EACCES), a read-only
  //    mount (EROFS), a missing parent (ENOENT) or a full disk (ENOSPC). The
  //    path is not a secret — it is the operator's own variable — and the errno
  //    is the whole diagnosis, so both are reported.
  const data = await (async (): Promise<{ ok: boolean; code: string; dir: string; error?: string }> => {
    const probe = path.join(DATA_DIR, `.ready-${process.pid}-${Date.now().toString(36)}`);
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(probe, "ok", "utf8");
      const back = await fs.readFile(probe, "utf8");
      await fs.unlink(probe);
      return back === "ok"
        ? { ok: true, code: "writable", dir: DATA_DIR }
        : { ok: false, code: "read_back_mismatch", dir: DATA_DIR };
    } catch (e) {
      const err = e as { code?: unknown; message?: unknown };
      return {
        ok: false,
        code: "not_writable",
        dir: DATA_DIR,
        error: typeof err?.code === "string" ? err.code : String(err?.message ?? "unknown"),
      };
    }
  })();

  // 2. Configuration: well-formed, by the one owner of that judgement.
  const config = { ok: report.ok, code: report.ok ? "ok" : report.problems[0].code };

  // 3. Content: the graph the engines actually loaded, not a hardcoded count.
  const content = {
    ok: CONCEPTS.length > 0 && SPECIFICATIONS.length > 0,
    code: CONCEPTS.length > 0 && SPECIFICATIONS.length > 0 ? "loaded" : "empty_graph",
  };

  // 4. THE STORE: which backend, what the operator has DECLARED about it, and —
  //    the part two incidents taught us to say out loud — whether the host keeps
  //    it at all.
  //
  // Why this belongs on a readiness probe and not only in a log: a deployment
  // whose data directory lives on the filesystem the host discards answers
  // every request perfectly and loses every learner record on the next restart.
  // Its readiness was 200, its smoke test passed, and the loss was invisible
  // until a class came back. `/api/ready` now says THREE things and never
  // conflates them:
  //
  //   durability  — one word for the findings, so a monitor can alarm on it
  //                 (`durable` | `ephemeral` | `unknown`, lib/env.ts's map);
  //   persistence — WHAT WAS DECLARED (mode, by which variable) and whether
  //                 learner-data writes are permitted at all: configuration,
  //                 never evidence;
  //   measured    — what this store has OBSERVED about its own survival: the
  //                 number of process starts that have opened it, and how many of
  //                 those found a record written by a different deployment. Weak
  //                 by construction, and named as a measurement rather than a
  //                 guarantee (see lib/server/boot-log.ts).
  //
  // The proof of a declared-durable store is the restart drill, which is named
  // in `persistence.evidence` rather than implied by a green tick here.
  const store = storeReadiness(process.env);
  const boots = recordBoot(DATA_DIR, process.env);

  const checks = { data, config, content };
  // WRITES ARE PART OF BEING READY. A deployment that has refused learner-data
  // writes cannot serve a learner whatever its disk is doing, so it is not ready
  // — 503, with the code — and the refusal is real rather than advisory: the
  // store throws it at the primitive every learner-record write goes through.
  const ready = data.ok && config.ok && content.ok && store.writesPermitted;

  return NextResponse.json(
    {
      ready,
      service: "openmind",
      version: APP_VERSION,
      deployment: deploymentId(process.env),
      deploymentDeclared: deploymentDeclared(process.env),
      profile: report.deployment.profile.id,
      ai: report.ai,
      checks,
      store: {
        /** The backend in force. `null` means the configuration asks for one
         *  this build cannot serve — which is also a `problems` entry, so
         *  readiness is 503 rather than a file store wearing a Postgres name. */
        kind: store.kind,
        /** What was ASKED for, so a typo is visible beside the refusal. */
        configured: store.configured,
        /** The file backend is single-process: two servers over one directory
         *  lose each other's writes. A second backend is what removes it. */
        singleInstance: store.kind === "file",
        durability: store.durability,
        /** Whether losing the store was DECLARED (`OPENMIND_ALLOW_EPHEMERAL_STORE`)
         *  rather than suffered. A release gate may pass an accepted throwaway
         *  and may not pass an unaccepted one — the difference between a demo and
         *  an incident is whether anyone said so. */
        accepted: store.mode === "accepted-ephemeral",
        /** CONFIGURATION — what this deployment declares about persistence, and
         *  whether it may take a learner record at all. Nothing here is
         *  evidence; `mode` names WHAT was declared and `declaredBy` names the
         *  variable, so a reader can go and look at it. */
        persistence: {
          mode: store.mode,
          declaredBy: store.declaredBy,
          writesPermitted: store.writesPermitted,
          /** The finding that stopped writes, or null. */
          blockedBy: store.blockedBy,
          /** The claim's only acceptable measurement, named rather than implied:
           *  a declaration this process cannot check is proved by surviving a
           *  real restart, and by nothing else. */
          evidence: "restart drill — OPENMIND_BASE=<url> npm run verify:persistence -- --write, replace the instance, then --verify",
        },
        /** MEASUREMENT — what this store has seen about itself. `null` means no
         *  record could be written or read (an unwritable or fresh directory),
         *  which is reported as no measurement rather than as a pass.
         *
         *  `survivedDeployments > 0` is the only positive evidence of
         *  persistence obtainable from here, and it is deliberately weak: it says
         *  a release change found the store still there, not that it always will. */
        measured: boots
          ? {
            boots: boots.boots,
            firstSeenAt: boots.firstSeenAt,
            survivedDeployments: boots.survivedDeployments,
            deployment: boots.deployment,
          }
          : null,
        /** The codes behind `durability`, verbatim, for a log or a drill. */
        codes: store.codes,
      },
      // Which configuration problems exist, named but never valued: the operator
      // gets the code here and the sentence in their own log, and a stranger
      // gets nothing to map.
      problems: report.problems.map((p) => ({ key: p.key, code: p.code })),
      now: Date.now(),
    },
    { status: ready ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
