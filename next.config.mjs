/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Overridable build directory so a production build can coexist with a
  // running dev server (which owns `.next`): NEXT_DIST_DIR=.next-prod.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Emits .next/standalone — a self-contained server.js with only the needed
  // node_modules. This is what makes the Docker image small enough for a
  // school laptop and the deployment a single `docker compose up -d`.
  output: "standalone",
};

export default nextConfig;
