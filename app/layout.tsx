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
  themeColor: "#f8f9f4",
};

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
