import type { Metadata } from "next";

/**
 * THE SUBJECT LANDING PAGES (`/learn/maths`, `/learn/biology`, …).
 *
 * Same reason as the concept layout beside it: the page is a client component,
 * so without this file every subject inherits the site title. These are the
 * second-most valuable pages to a search engine after the concepts, because
 * "GCSE maths practice" is a shorter, more common query than any single concept.
 *
 * The label is a plain map rather than `t("subj.maths")`: metadata is rendered
 * outside the request's language context, and a title that silently fell back to
 * a raw key would be worse than an English one.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://openmind-ew2i.onrender.com").replace(/\/+$/, "");

const SUBJECTS: Record<string, { name: string; blurb: string }> = {
  maths: {
    name: "Maths",
    blurb: "Number, algebra, geometry, ratio, proportion and statistics — from first principles to exam-style problems.",
  },
  physics: {
    name: "Physics",
    blurb: "Forces, energy, waves, electricity and the particle model, with the arithmetic shown step by step.",
  },
  chemistry: {
    name: "Chemistry",
    blurb: "Atoms, bonding, moles, reactions and rates, taught with the calculations worked out in full.",
  },
  biology: {
    name: "Biology",
    blurb: "Cells, digestion, genetics, ecosystems and homeostasis, with the misconceptions that cost marks.",
  },
  computing: {
    name: "Computing",
    blurb: "Algorithms, data structures, networks, binary and programming ideas, explained from the machine up.",
  },
};

export async function generateMetadata(
  { params }: { params: Promise<{ subject: string }> },
): Promise<Metadata> {
  const { subject } = await params;
  const found = SUBJECTS[subject];

  if (!found) {
    return { title: "Subject not found", robots: { index: false, follow: false } };
  }

  const title = `${found.name} — free lessons and adaptive practice`;
  const description = `${found.blurb} Free, server-marked practice with a diagnostic that finds the gap rather than the score.`;
  const path = `/learn/${subject}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", title, description, url: `${SITE_URL}${path}` },
  };
}

export default function SubjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
