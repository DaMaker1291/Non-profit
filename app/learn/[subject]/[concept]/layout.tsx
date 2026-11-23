import type { Metadata } from "next";
import { CONCEPTS } from "@/lib/genome";

/**
 * PER-CONCEPT TITLES FOR THE PAGES A LEARNER ACTUALLY SEARCHES FOR.
 *
 * `/learn/[subject]/[concept]/page.tsx` is a client component, so it cannot
 * export `metadata` itself — and before this file every one of the 135 concept
 * pages served the site's generic title. That is the difference between a search
 * result that says "OpenMind — a free learning app" and one that says "Completing
 * the square — free practice and a step-by-step lesson", for the query somebody
 * actually typed.
 *
 * The TITLE is the concept's own authored title (the same string the lesson
 * prints) plus what the page offers; the DESCRIPTION is the concept's own blurb,
 * which is already written for a learner and already true. Nothing is generated
 * per-request from a model, and nothing claims a feature the page lacks.
 *
 * AN UNKNOWN CONCEPT IS `noindex`. A title-and-description for a page that does
 * not exist is exactly the soft-404 a crawler needs to be told about.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://openmind-ew2i.onrender.com").replace(/\/+$/, "");

export async function generateMetadata(
  { params }: { params: Promise<{ subject: string; concept: string }> },
): Promise<Metadata> {
  const { subject, concept } = await params;
  const found = CONCEPTS.find((c) => c.id === concept && c.subject === subject);

  if (!found) {
    return {
      title: "Concept not found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${found.title} — free practice and a step-by-step lesson`;
  const description = `${found.blurb} Practise it with server-marked questions, a worked example and the misconceptions that trip people up. Free, no sign-up needed to start.`;
  const path = `/learn/${subject}/${concept}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}${path}`,
    },
  };
}

export default function ConceptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
