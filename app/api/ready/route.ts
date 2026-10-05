import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/server/store";
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
      // Which configuration problems exist, named but never valued: the operator
      // gets the code here and the sentence in their own log, and a stranger
      // gets nothing to map.
      problems: report.problems.map((p) => ({ key: p.key, code: p.code })),
      now: Date.now(),
    },
    { status: ready ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
