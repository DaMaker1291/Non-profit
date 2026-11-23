import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav, Topbar } from "@/components/nav";
import { AppProvider, I18nProvider } from "@/lib/client";
import { AccessProvider } from "@/components/access-provider";
import { OfflineBar } from "@/components/offline-bar";
import { KioskBar } from "@/components/kiosk-bar";
import { Footer } from "@/components/footer-note";
import { RouteGuard } from "@/components/route-guard";

/**
 * THE PUBLIC ORIGIN, in one place.
 *
 * Canonical URLs, Open Graph images, the sitemap and the robots file must all
 * name the SAME origin, or a crawler is told two different things about one page
 * and indexes neither well. `NEXT_PUBLIC_SITE_URL` is the operator's declaration
 * (Render sets it, a self-host sets its own); the fallback is the deployment this
 * repository is published at, so a clone that sets nothing still emits absolute
 * URLs rather than relative ones — which Open Graph refuses.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://openmind-ew2i.onrender.com").replace(/\/+$/, "");

/**
 * WHAT A SEARCH RESULT SEES.
 *
 * The title and description are written for the query a learner actually types
 * ("free learning app", "maths practice", "GSCE revision") while staying true to
 * the product: it IS free, it IS a learning app, and the practice IS graded by
 * the server. No keyword is claimed that the app cannot show when the result is
 * clicked — a page that ranks for a promise it does not keep costs the next click
 * as well as this one.
 *
 * `metadataBase` is what turns every relative URL in this object into the absolute
 * one Open Graph requires; without it the build warns and the tags ship relative,
 * which most scrapers ignore.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OpenMind — a free learning app for maths, science and computing",
    template: "%s · OpenMind",
  },
  description:
    "A free learning app for maths, physics, chemistry, biology and computing: a real diagnostic, unlimited server-graded practice, misconception tracking and a tutor that explains the next step — in 15 languages, on any phone.",
  applicationName: "OpenMind",
  keywords: [
    "learning app",
    "free learning app",
    "maths practice",
    "science revision",
    "GCSE maths",
    "A-level physics",
    "adaptive learning",
    "open source education",
    "online tutor",
  ],
  authors: [{ name: "OpenMind" }],
  creator: "OpenMind",
  publisher: "OpenMind",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "OpenMind",
    title: "OpenMind — a free learning app for maths, science and computing",
    description:
      "Real diagnostic questions, unlimited server-graded practice and a tutor that explains the next step. Free, open source, 15 languages, any phone.",
    url: SITE_URL,
    locale: "en_GB",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "OpenMind" }],
  },
  twitter: {
    card: "summary",
    title: "OpenMind — a free learning app for maths, science and computing",
    description:
      "Real diagnostic questions, unlimited server-graded practice and a tutor that explains the next step. Free and open source.",
    images: ["/icons/icon-512.png"],
  },
  /**
   * INDEXING IS ALLOWED, WITH THE PRIVATE DOORS NAMED. `robots.ts` carries the
   * same list for the crawler that reads robots.txt; this covers the ones that
   * only read the tag. Neither is a security control — every one of these routes
   * refuses without a session — it stops a learner's dashboard being indexed.
   */
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  /**
   * GOOGLE SEARCH CONSOLE OWNERSHIP.
   *
   * The meta-tag method, because a Render subdomain cannot have the DNS record a
   * domain property needs. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the
   * content value Search Console gives you and redeploy; the tag appears on every
   * page. Absent when unset, so a clone emits nothing it cannot back.
   */
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  /**
   * THE SAME MANIFEST THE STATIC TWIN PUBLISHES, deliberately — one file in
   * `public/`, not one per surface. It is what makes the app installable: with
   * a manifest naming a 192 and a 512 icon and `display: standalone`, a phone
   * offers "Add to home screen" and then opens the app without browser chrome.
   *
   * That matters more here than it does for a product with a support desk. The
   * learner this is for pays for data by the megabyte and shares one handset;
   * an icon that opens straight into their own record is the difference between
   * "a website I looked at once" and "the thing I use to revise". The URLs inside
   * it are RELATIVE on purpose, so the same bytes work at the root of a domain
   * and under a project subpath (docs/ on GitHub Pages).
   */
  manifest: "/manifest.json",
  /**
   * iOS does not install from the manifest alone: `apple-touch-icon` is the icon
   * it puts on the home screen, and it must be opaque (iOS composites it over
   * black if it carries transparency), which is why that PNG is full-bleed.
   */
  icons: {
    /**
     * THE BROWSER-TAB ICON, and it has to be named here. Without a `rel="icon"`
     * link the browser falls back to requesting `/favicon.ico`, which this app
     * does not serve — a 404 on every page load that no gate was watching.
     * `/icon.svg` is the file `app/icon.svg` already serves.
     */
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    title: "OpenMind",
    statusBarStyle: "default",
  },
  /**
   * `apple-mobile-web-app-capable` HAS TO BE EMITTED BY HAND, and Next's own
   * `appleWebApp.capable` is not enough: measured on the served HTML of this
   * layout, Next emits `apple-mobile-web-app-title` and
   * `-status-bar-style` and silently drops `capable`. iOS 16.4+ opens a
   * home-screen app standalone from the manifest's `display`, but an older
   * handset (an iPhone 8 on iOS 15 is not a hypothetical here) only looks at
   * this tag — without it the same icon opens inside Safari, address bar and
   * all, which is the thing an install was supposed to get rid of.
   */
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Both palettes from globals.css, so the browser's own chrome (the phone's
  // address bar) does not stay white above a dark page.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c171c" },
  ],
};

/**
 * THE STORED THEME IS APPLIED BY THIS INLINE SCRIPT, and it has to be inline.
 *
 * A module cannot do this job: it would run after the first paint, so a learner
 * who chose dark would get a white flash on every navigation — the one thing
 * that makes a theme toggle feel broken. Executing here, as the parser reaches
 * it, puts the attribute on `<html>` before anything below is painted.
 *
 * The key is the same one `components/theme-toggle.tsx` writes. An ABSENT value
 * is deliberately NOT resolved here: leaving the attribute off is what makes
 * `prefers-color-scheme` in globals.css take over, so a learner who has chosen
 * nothing follows their device instead of being pinned to light.
 */
//
// THE LEARNER'S ACCESS PREFERENCES ARE APPLIED HERE TOO, for the same reason and
// with the same consequence if they are not. `AccessProvider` applies them in a
// `useEffect`, which is after hydration — so a learner who chose larger text got
// a page of ordinary text first and watched it grow, on every navigation, and a
// learner who chose the calm screen saw the motion they had switched off. The
// classes are the whole contract (`html.access-large` raises the root size in
// globals.css), so setting them before the shell paints is the difference
// between a preference and a flash. Measured by `npm run verify:a11y`:
// with the classes stored, `<html>` carries them before the first paint.
/** The three things a search engine may take as fact about this site. */
const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "OpenMind",
      description: "A free learning app for maths, science and computing, with server-graded practice in 15 languages.",
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: "OpenMind",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icons/icon-512.png`,
      description: "Open-source, multilingual learning platform for schools and independent learners.",
    },
    {
      "@type": "SoftwareApplication",
      name: "OpenMind",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      url: `${SITE_URL}/`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
      featureList: [
        "Adaptive diagnostic",
        "Server-graded practice with marking explanations",
        "Misconception tracking",
        "Works offline and on low-bandwidth connections",
      ],
    },
  ],
});

const THEME_BOOT = `try{var t=localStorage.getItem("openmind:theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);var a=JSON.parse(localStorage.getItem("openmind:access")||"{}");var c=[];var s=typeof a.textScale==="number"?a.textScale:(a.largeText?1:0);if(s>=2)c.push("access-xlarge");else if(s>=1)c.push("access-large");if(a.roomy)c.push("access-roomy");if(a.highContrast)c.push("access-contrast");if(a.reduceMotion)c.push("access-calm");if(c.length)document.documentElement.className+=(document.documentElement.className?" ":"")+c.join(" ");if(a.preferSpeech)document.documentElement.classList.add("access-voice-first")}catch(e){}`;

/**
 * THE SHELL, mounted once.
 *
 * Two things are deliberate here:
 *
 *  1. NAVIGATION IS STABLE. The same sidebar on every page, in the same order,
 *     with the learner's own courses in it. Nothing about the chrome moves when
 *     the learner moves, which is what lets them stop reading it.
 *
 *  2. THE ACCESSIBILITY AND OFFLINE LAYERS RENDER *OUTSIDE* the route guard.
 *     `AccessProvider` (the ♿ panel) and `OfflineBar` (the connectivity status)
 *     are part of the shell, not part of a page — so a learner staring at a
 *     boot screen still has them, and `scripts/e2e-api.mjs` can prove they ship
 *     in the server HTML of every route. Do not move them inside the guard.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        {/* First child of the body on purpose: it must run before the shell
            below it is painted. See THEME_BOOT. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        {/* STRUCTURED DATA, in the shell so it is in the first HTML byte of every
            page rather than something a crawler must execute JavaScript to see.
            It states only what the app can prove: it is a free educational
            application, and this is its web site. No aggregate rating, no review
            count — those are the fields a rich result is easiest to fake with
            and hardest to defend when a reviewer asks where the number came from. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }}
        />
        <I18nProvider>
          <AppProvider>
            <AccessProvider>
              <div className="shell">
                <Nav />
                <div className="shell-main" id="main">
                  <Topbar />
                  <OfflineBar />
                  {/* A classroom handset needs its way out on EVERY page, which
                      is why this sits beside the offline bar and outside the
                      guard — see components/kiosk-bar.tsx. */}
                  <KioskBar />
                  {/* One guard for every page: see components/route-guard.tsx. */}
                  <RouteGuard>{children}</RouteGuard>
                  <footer className="footer">
                    <div className="container">
                      <Footer />
                    </div>
                  </footer>
                </div>
              </div>
            </AccessProvider>
          </AppProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
