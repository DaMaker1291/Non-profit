import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav, Topbar } from "@/components/nav";
import { AppProvider, I18nProvider } from "@/lib/client";
import { AccessProvider } from "@/components/access-provider";
import { OfflineBar } from "@/components/offline-bar";
import { KioskBar } from "@/components/kiosk-bar";
import { Footer } from "@/components/footer-note";
import { RouteGuard } from "@/components/route-guard";

export const metadata: Metadata = {
  title: "OpenMind — learn anything, your way",
  description:
    "Free, open-source, multilingual learning network: adaptive diagnostics, unlimited server-graded practice, misconception tracking and a Socratic tutor — in your language, on any phone.",
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
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#101216" },
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
const THEME_BOOT = `try{var t=localStorage.getItem("openmind:theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

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
