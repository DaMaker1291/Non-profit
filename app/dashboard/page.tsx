// The learner home, at its own address.
//
// The screen itself lives in components/learner-home.tsx because it is now TWO
// routes: the navigation item called "Home" points at "/", and this route keeps
// working because a learner may have bookmarked it or have a link to it in a
// pack. Two routes, one implementation — a copy of this page would drift from
// the one learners actually see, which is the failure this project has already
// paid for once with the landing page's dictionary.
import LearnerHome from "@/components/learner-home";

export default function DashboardPage() {
  return <LearnerHome />;
}