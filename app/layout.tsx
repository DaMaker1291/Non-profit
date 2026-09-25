import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { MarginRail } from "@/components/margin-rail";
import { AppProvider, I18nProvider } from "@/lib/client";
import { AccessProvider } from "@/components/access-provider";
import { OfflineBar } from "@/components/offline-bar";
import { Footer } from "@/components/footer-note";
import { RouteGuard } from "@/components/route-guard";

export const metadata: Metadata = {
  title: "OpenMind — a world-class tutor for every student",
  description:
    "Free, open-source, multilingual learning network: adaptive diagnostics, unlimited server-graded practice, misconception tracking and a Socratic tutor — in your language, on any phone.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f9f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <AppProvider>
            <AccessProvider>
              <MarginRail />
              <OfflineBar />
              <Nav />
              {/* One guard for every page: see components/route-guard.tsx. */}
              <RouteGuard>{children}</RouteGuard>
              <footer className="footer">
                <div className="container">
                  <Footer />
                </div>
              </footer>
            </AccessProvider>
          </AppProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
