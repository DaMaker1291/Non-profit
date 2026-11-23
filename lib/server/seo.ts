// ─────────────────────────────────────────────────────────────────────────────
// WHERE THIS SITE LIVES, AND WHICH DOORS A CRAWLER MUST NOT OPEN.
//
// Both facts are needed by more than one surface (metadata, `robots.ts`,
// `sitemap.ts`, and every absolute link in a mail), and both are deployment
// configuration rather than page content — so they live here rather than in any
// one route.
//
// WHY `publicBaseUrl` IS NOT DERIVED FROM THE REQUEST. A message is written once
// and read on another device, and a canonical URL is a claim about the whole
// site; a Host header is chosen by whoever made the request. Building either from
// it is how a verification mail becomes a phishing mail, which is the same rule
// `lib/server/auth.ts` keeps for the session cookie.
//
// WHY THE PRIVATE LIST IS HERE AND NOT IN `app/robots.ts`. The suite asserts that
// nothing outside `lib/api`, `lib/server` and a route handler names a server door
// (`"/api/…"`) — the rule that keeps a page from reaching a door by hand and
// getting the capability wrong. A disallow rule is not a call, but it does spell
// the prefix, and a gate that has to be weakened for a legitimate use is a gate
// that will be weakened for an illegitimate one. The list belongs with the other
// server-side facts, so the assertion stays as strict as it was.
// ─────────────────────────────────────────────────────────────────────────────

/** The origin used when a deployment does not declare one. Correct for this
 *  repository's published instance, and harmless for a clone that sets
 *  `NEXT_PUBLIC_SITE_URL` (which every deployment should). */
const FALLBACK_ORIGIN = "https://openmind-ew2i.onrender.com";

export function publicBaseUrl(): string | null {
  for (const raw of [process.env.OPENMIND_PUBLIC_URL, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim().replace(/\/+$/, "");
    if (/^https?:\/\/[^/\s]+$/i.test(trimmed)) return trimmed;
  }
  // `null` means "this deployment has not said". A caller that writes a link must
  // then send nothing rather than send one nobody can open; a caller that writes
  // metadata may fall back to the published origin, because a canonical URL is a
  // hint rather than a credential.
  return null;
}

/** The origin to build absolute URLs from, with the published instance as the
 *  fallback. Used by routes (sitemap, robots, canonical tags), never by a link a
 *  learner is asked to trust. */
export function siteOrigin(): string {
  return publicBaseUrl() ?? FALLBACK_ORIGIN;
}

/**
 * Routes that show one learner's own record, or an API door. A crawler is asked
 * to skip them — a request it may ignore, because the actual control is that
 * every one of them refuses without a session.
 *
 * The teaching and print surfaces are deliberately NOT here: they are public
 * content and much of what a teacher would search for.
 */
export const PRIVATE_ROUTES: readonly string[] = [
  "/api/",
  "/dashboard",
  "/account",
  "/onboarding",
  "/kiosk",
  "/classroom",
  "/progress",
  "/papers",
  "/join",
  "/rooms/",
  "/mistakes",
  "/mind",
  "/diagnostic/",
  "/assessment/",
];
