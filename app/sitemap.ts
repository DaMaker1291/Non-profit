import type { MetadataRoute } from "next";
import { CONCEPTS } from "@/lib/genome";
import { siteOrigin } from "@/lib/server/seo";
import type { SubjectId } from "@/lib/types";

/**
 * sitemap.xml — every public page, generated from the same genome the app
 * teaches from.
 *
 * WHY THE CONCEPT PAGES ARE THE POINT. A learner does not search for "OpenMind";
 * they search for "how to complete the square" or "what is a mole in chemistry".
 * Each of the 135 concepts is a page that answers one of those, and a sitemap is
 * how a crawler learns they exist without following the nav. The list is derived
 * from `CONCEPTS` rather than typed, so a concept added tomorrow is in tomorrow's
 * sitemap and a removed one cannot linger as a 404.
 *
 * The private surfaces are absent on purpose — a sitemap that advertises a
 * dashboard, a paper or a roster invites a crawler to index a redirect.
 */
const SUBJECTS: SubjectId[] = ["maths", "physics", "chemistry", "biology", "computing"];

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/try", priority: 0.9 },
  { path: "/solve", priority: 0.9 },
  { path: "/curriculum", priority: 0.8 },
  { path: "/subjects", priority: 0.8 },
  { path: "/about", priority: 0.8 },
  { path: "/help", priority: 0.7 },
  { path: "/print", priority: 0.7 },
  { path: "/teacher", priority: 0.7 },
  { path: "/teach", priority: 0.6 },
  { path: "/tutor", priority: 0.6 },
  { path: "/genome", priority: 0.6 },
  { path: "/pilot", priority: 0.5 },
  { path: "/content", priority: 0.5 },
  { path: "/offline", priority: 0.5 },
  { path: "/access", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.priority >= 0.8 ? "weekly" : "monthly",
    priority: r.priority,
  }));

  for (const subject of SUBJECTS) {
    pages.push({
      url: `${base}/learn/${subject}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const concept of CONCEPTS) {
    pages.push({
      url: `${base}/learn/${concept.subject}/${concept.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return pages;
}
