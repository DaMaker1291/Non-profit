"use client";

// Home, at its own address.
//
// The learner screen lives in components/learner-home.tsx because it is TWO
// routes (the navigation item called "Home", and this one, which keeps working
// because a learner may have bookmarked it or have a link to it in a pack). Two
// routes, one implementation — a copy of this page would drift from the one
// learners actually see, which is the failure this project has already paid for
// once with the landing page's dictionary.
//
// ── AND A TEACHER'S HOME IS NOT THIS ONE ─────────────────────────────────────
//
// A teacher account owns a learner profile like everybody else, so this page
// rendered them the learner's Home: "YOUR NEXT STEP — Find your starting point.
// A 3-minute diagnostic", above a mastery dashboard reading 0/67, 0, 0, 0. That
// is the app treating the person who came here to teach as a child to be
// measured — and it is not a cosmetic mismatch, because the diagnostic it offers
// is a sitting in a subject they may not even teach.
//
// A TEACHER'S HOME IS THE WORK THEY SET (§teacher home), and it already exists:
// `/teacher` opens on what needs them, then their classes, join codes and the
// assignment builder. So this page HANDS OVER rather than building a second
// class list that would drift from it — the same move the landing page makes when
// it replaces `/dashboard` for a measured learner, and the same destination as a
// teacher's own route in `deriveAppState` (they cannot disagree: both read
// lib/app-state.ts#homeRouteFor).
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LearnerHome from "@/components/learner-home";
import { Loading } from "@/components/states";
import { homeRouteFor } from "@/lib/app-state";
import { useAppState } from "@/lib/client";

export default function DashboardPage() {
  const router = useRouter();
  const { lifecycle, ready } = useAppState();
  const isTeacher = ready && lifecycle.isTeacher;
  useEffect(() => {
    // `ready` first: the guard renders the boot screen until the session probe
    // answers, so this never fires on a guess — and never sends a learner
    // anywhere.
    if (isTeacher) router.replace(homeRouteFor(lifecycle));
  }, [isTeacher, lifecycle, router]);

  // A skeleton, never the learner's Home: one paint of "Hello … your next step is
  // a diagnostic" is the whole complaint, and it is not something a teacher
  // should ever be shown on their way to their classes.
  if (isTeacher) return <Loading lines={3} />;
  return <LearnerHome />;
}
