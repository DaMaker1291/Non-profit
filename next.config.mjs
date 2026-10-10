import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import("next").NextConfig} */
const nextConfig = (phase) => ({
  reactStrictMode: true,
  // ── TWO WRITERS, TWO DIRECTORIES ──────────────────────────────────────────
  // `next dev` and `next build` both rewrite their dist directory. When they
  // share one, starting the dev server DELETES the running production server's
  // bundle out from under it: `next dev` removes BUILD_ID, `standalone/server.js`
  // and the hashed `static/` tree, so the live process keeps answering HTTP 200
  // while every asset it points at is gone. The page renders as bare HTML and
  // nothing in the response says so. That is a real outage this repository
  // shipped, not a hypothetical.
  //
  // So the split is by PHASE, not by a variable someone has to remember to set:
  //   · production (build/start) → `.next`     — what Dockerfile, gates.yml,
  //                                              start-openmind.sh and
  //                                              scripts/production-server.mjs
  //                                              all expect, and the default
  //                                              `next build` still produces;
  //   · development (`next dev`)  → `.next-dev` — the disposable one, so a stray
  //                                              dev server can never touch a
  //                                              servable artefact.
  // Keeping PRODUCTION on `.next` is deliberate: every deployment path already
  // names it, so isolating development costs no deploy-time change. Reversing
  // it (prod → `.next-prod`) would mean editing the Dockerfile, CI, the launcher
  // and the serve gates in lockstep, and missing one ships an unstyled page.
  //
  // NEXT_DIST_DIR still overrides BOTH — `npm run production-check` uses it to
  // build production into its own scratch dir (`.next-prod`) and to start its dev
  // server, so the deploy checklist cannot disturb a running instance.
  distDir: process.env.NEXT_DIST_DIR ?? (phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"),
  // Emits .next/standalone — a self-contained server.js with only the needed
  // node_modules. This is what makes the Docker image small enough for a
  // school laptop and the deployment a single `docker compose up -d`.
  output: "standalone",
});

export default nextConfig;
