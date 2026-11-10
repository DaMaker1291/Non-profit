// THE TEST FIXTURE'S THREE LOCKS, ON THE SERVER WHERE THE STORE LIVES.
//
// It is deliberately not in lib/assessment-serving.ts: that module is compiled
// as a pure engine and is imported by the marking gates, while this decision
// depends on the deployment's resolved DATA_DIR. A second resolver of the data
// directory is the defect the store's one-owner rule exists to prevent.
import os from "node:os";
import path from "node:path";
import { DATA_DIR } from "./store";

export function assessmentFixtureEnabled(
  env: NodeJS.ProcessEnv = process.env,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (nodeEnv === "production") return false;
  if (env.OPENMIND_ASSESSMENT_FIXTURE !== "1") return false;
  const dir = path.resolve(DATA_DIR);
  const tmp = path.resolve(os.tmpdir());
  return dir === tmp
    || dir.startsWith(`${tmp}${path.sep}`)
    || dir.startsWith("/tmp/")
    || dir.startsWith("/private/tmp/");
}