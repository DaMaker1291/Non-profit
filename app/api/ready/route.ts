import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/server/store";
// The ONE owner of "which backend this configuration asks for". /api/ready must
// not re-decide it, and an operator must be able to read it without a stack
// trace (docs/STORAGE_SPEC.md acceptance 6).
import { storeKindReport } from "@/lib/server/storage";
import { envReport } from "@/lib/env";
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
  const data = await (async (): Promise<{ ok: boolean; code: string }> => {
    const probe = path.join(DATA_DIR, `.ready-${process.pid}-${Date.now().toString(36)}`);
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(probe, "ok", "utf8");
      const back = await fs.readFile(probe, "utf8");
      await fs.unlink(probe);
      return back === "ok" ? { ok: true, code: "writable" } : { ok: false, code: "read_back_mismatch" };
    } catch {
      return { ok: false, code: "not_writable" };
    }
  })();

  // 2. Configuration: well-formed, by the one owner of that judgement.
  const config = { ok: report.ok, code: report.ok ? "ok" : report.problems[0].code };

  // 3. Content: the graph the engines actually loaded, not a hardcoded count.
  const content = {
    ok: CONCEPTS.length > 0 && SPECIFICATIONS.length > 0,
    code: CONCEPTS.length > 0 && SPECIFICATIONS.length > 0 ? "loaded" : "empty_graph",
  };

  // 4. THE STORE: which backend, and — the part an incident taught us to say
  //    out loud — whether the HOST keeps it.
  //
  // Why this belongs on a readiness probe and not only in a log: a deployment
  // whose data directory lives on the filesystem the host discards answers
  // every request perfectly and loses every learner record on the next restart.
  // Its readiness is 200, its smoke test passes, and the loss is invisible
  // until a class comes back. `durability` is `lib/env.ts`'s own judgement
  // reported in one word, so a monitor can alarm on it and the deploy drill can
  // refuse to certify persistence against it.
  //
  // The vocabulary is deliberately the report's, not a new one:
  //   "durable"   — no configuration problem says this directory is discarded
  //                 (a mounted volume on a host that discards filesystems, or a
  //                 host where the question does not apply);
  //   "ephemeral" — it IS discarded, whether that was accepted or not
  //                 (`ephemeral_store_accepted`, `data_dir_undeclared`,
  //                 `data_dir_not_durable`);
  //   "unknown"   — could not be measured, reported as unknown and never as a
  //                 pass.
  const storage = storeKindReport(process.env);
  const durabilityCodes = new Set([
    "data_dir_not_durable",
    "data_dir_undeclared",
    "ephemeral_store_accepted",
    "durability_unknown",
  ]);
  const storeNotes = [...report.problems, ...report.notes].filter((n) => durabilityCodes.has(n.code));
  const durability: "durable" | "ephemeral" | "unknown" = storeNotes.some((n) => n.code !== "durability_unknown")
    ? "ephemeral"
    : storeNotes.length > 0
      ? "unknown"
      : "durable";

  const checks = { data, config, content };
  const ready = data.ok && config.ok && content.ok;

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
        kind: storage.kind,
        /** What was ASKED for, so a typo is visible beside the refusal. */
        configured: storage.configured,
        /** The file backend is single-process: two servers over one directory
         *  lose each other's writes. A second backend is what removes it. */
        singleInstance: storage.kind === "file",
        durability,
        /** Whether losing the store was DECLARED (`OPENMIND_ALLOW_EPHEMERAL_STORE`)
         *  rather than suffered. A release gate may pass an accepted throwaway
         *  and may not pass an unaccepted one — the difference between a demo and
         *  an incident is whether anyone said so. */
        accepted: storeNotes.some((n) => n.code === "ephemeral_store_accepted"),
        /** The codes behind `durability`, verbatim, for a log or a drill. */
        codes: storeNotes.map((n) => n.code),
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
