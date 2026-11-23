import type { MetadataRoute } from "next";
import { PRIVATE_ROUTES, siteOrigin } from "@/lib/server/seo";

/**
 * robots.txt — generated, so the sitemap URL is the same origin the metadata
 * declares rather than a string someone has to keep in two places.
 *
 * WHAT IS DISALLOWED, AND WHY IT IS A SHORT LIST. Only routes that show a
 * signed-in learner's own record (a dashboard, a paper, a class roster) and the
 * API. Disallowing the teaching and print surfaces would be the usual reflex, and
 * it would be wrong here: those are public CONTENT, they are much of what a
 * teacher would search for, and a crawler that can read them costs nothing.
 *
 * A disallow is a request, not a wall. The routes behind these prefixes still
 * refuse without a session — that is the actual control, and `robots.txt` merely
 * stops a crawler wasting its budget on a redirect.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_ROUTES] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
