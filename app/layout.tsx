import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav, Topbar } from "@/components/nav";
import { AppProvider, I18nProvider } from "@/lib/client";
import { AccessProvider } from "@/components/access-provider";
import { OfflineBar } from "@/components/offline-bar";
import { Footer } from "@/components/footer-note";
import { RouteGuard } from "@/components/route-guard";

export const metadata: Metadata = {
  title: "OpenMind — learn anything, your way",
  description:
    "Free, open-source, multilingual learning network: adaptive diagnostics, unlimited server-graded practice, misconception tracking and a Socratic tutor — in your language, on any phone.",
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
