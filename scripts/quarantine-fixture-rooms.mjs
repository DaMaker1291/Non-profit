// One-off: quarantine the pre-fix study-room fixtures found in the live store
// during the build-recovery release. Evidence-preserving: every removed record
// is written verbatim beside the backup, with instructions to restore it.
//
// The proof is OWNERSHIP, and it is deliberately the narrow kind. A room
// carries no profile id at all — `createdBy` and `members` are handles, and
// `app/rooms/page.tsx` sends `state?.profile.handle ?? "guest"`, so a room a
// real learner made is labelled with THEIR handle. A room is removed only when
// ALL of these hold:
//   · nothing is declared about it (`conceptIds` is empty) — so it was nobody's
//     chosen focus, and no course was ever attached to it;
//   · no surviving profile owns it — neither `createdBy` nor any member is a
//     handle belonging to a profile that still exists, and none is the literal
//     "guest" the UI falls back to. A handle-less legacy profile therefore
//     protects its rooms instead of having them guessed away;
//   · it is older than the run cutoff, so a room created minutes ago in a
//     session that is still going is never touched.
//
// The content is CORROBORATION, not the criterion, and the manifest reports it
// so a human can see what was discarded: many of these still carry the ORIGINAL
// defect (`room.conceptIds[0] ?? "linear-equations"` answering "why does the
// ball accelerate?" with balance-scale algebra), and the rest carry the fixed
// tutor's "Which idea are you working on?" reply — i.e. they are from demo and
// e2e runs either side of that fix. None of them is a learner's work.
import fs from "node:fs";
import path from "node:path";

const DIR = ".openmind-data";
const Q = process.argv[2];
if (!Q) throw new Error("usage: quarantine-fixture-rooms.mjs <quarantine-dir>");

const ROOM_TTL_MS = 3 * 3600e3; // the same window scripts/cleanup-e2e-store.mjs uses
const CUTOFF = Date.now() - ROOM_TTL_MS;

const rooms = JSON.parse(fs.readFileSync(`${DIR}/rooms.json`, "utf8"));
const profiles = JSON.parse(fs.readFileSync(`${DIR}/profiles.json`, "utf8"));

// The handles a surviving profile actually answers to.
const liveHandles = new Set(
  Object.values(profiles)
    .map((v) => v.profile?.handle)
    .filter((h) => typeof h === "string" && h),
);

const noDeclaredFocus = (r) => (r.conceptIds ?? []).length === 0;
const teachableSubject = (r) =>
  ["maths", "physics", "chemistry", "biology", "computing"].includes(r.subject);
const ownsNothing = (r) =>
  !liveHandles.has(r.createdBy) &&
  r.createdBy !== "guest" &&
  !(r.members ?? []).some((m) => liveHandles.has(m) || m === "guest");
const isRecent = (r) => (r.createdAt ?? 0) > CUTOFF;

const isFixture = (r) => teachableSubject(r) && noDeclaredFocus(r) && ownsNothing(r) && !isRecent(r);
const reasonForKeeping = (r) =>
  !teachableSubject(r) ? `subject ${r.subject}` :
  !noDeclaredFocus(r) ? `declares ${r.conceptIds.join("+")}` :
  isRecent(r) ? "recent" :
  `owned by a live profile (${r.createdBy} / ${(r.members ?? []).join(",")})`;

const fixtures = rooms.filter(isFixture);
const kept = rooms.filter((r) => !isFixture(r));

console.log(`rooms: ${rooms.length} → quarantining ${fixtures.length}, keeping ${kept.length}`);
for (const r of kept) console.log(`  KEPT ${r.id} — ${reasonForKeeping(r)}`);

// ── POST-CONDITION, asserted rather than assumed ───────────────────────────
// Everything retained must be retained for a reason that survives a rebuild:
// it is owned by a surviving profile, or it is recent. A kept room that is
// neither means the classification has a hole and the run must not proceed —
// that is the failure this script exists to refuse rather than paper over.
const unexplained = kept.filter((r) => !isRecent(r) && ownsNothing(r));
if (unexplained.length) {
  throw new Error(
    `refusing to run: ${unexplained.length} kept room(s) are neither owned by a live profile nor recent, ` +
    `so the classification does not explain them (${unexplained.slice(0, 3).map((r) => r.id).join(", ")})`,
  );
}
const wronglyRemoved = fixtures.filter((r) => !ownsNothing(r));
if (wronglyRemoved.length) {
  throw new Error(`refusing to run: ${wronglyRemoved.length} room(s) to remove have a live owner`);
}

// ── what the removed records actually contained, for the manifest ──────────
const ALGEBRA = /3x|balance\s*scale|linear-equations|an equation|solve for|\bx\b\s*=/i;
const hasPreFixAlgebra = (r) => (r.messages ?? []).some((m) => ALGEBRA.test(m.tutorReply ?? ""));
const hasFixedNoFocus = (r) => (r.messages ?? []).some((m) => m.tutorUnavailable === "no_focus" || /Which idea are you working on/.test(m.tutorReply ?? ""));
const preFix = fixtures.filter(hasPreFixAlgebra).length;
const postFix = fixtures.filter((r) => !hasPreFixAlgebra(r) && hasFixedNoFocus(r)).length;
const empty = fixtures.filter((r) => !(r.messages ?? []).length).length;

fs.mkdirSync(Q, { recursive: true });
fs.writeFileSync(path.join(Q, "fixture-rooms.json"), `${JSON.stringify(fixtures, null, 2)}\n`);

const owned = [...new Set(fixtures.map((r) => r.createdBy))];
const dates = fixtures.map((r) => r.createdAt);
fs.writeFileSync(
  path.join(Q, "QUARANTINE.md"),
  [
    "# Quarantined study-room fixtures",
    "",
    "Removed from `.openmind-data/rooms.json` during the build-recovery release.",
    "Nothing was destroyed: `fixture-rooms.json` in this directory holds every",
    "removed record verbatim, and `../rooms.json` in the backup beside it is the",
    "whole pre-removal file.",
    "",
    `**What they were.** ${fixtures.length} study rooms, created only by the handles`,
    `${owned.map((h) => `\`${h}\``).join(" and ")}, every one with an EMPTY \`conceptIds\` (no declared`,
    "focus, no course attached). No room named a handle belonging to any surviving",
    `profile, and none was newer than ${new Date(Math.max(...dates)).toISOString().slice(0, 10)}.`,
    "",
    "**How they were identified — ownership, not appearance.** A study room stores no",
    "profile id: `createdBy` and `members` are handles, and `app/rooms/page.tsx` sends",
    "`state?.profile.handle ?? \"guest\"`, so a room a real learner created carries their",
    "own handle. These rooms carry handles (`" + owned.join("`, `") + "`) and members (`" +
      [...new Set(fixtures.flatMap((r) => r.members ?? []))].join("`, `") + "`) that belong to",
    "no surviving profile, declare no concept, and predate the 3-hour cutoff in",
    "`scripts/cleanup-e2e-store.mjs`. The script refuses to run if any room it would",
    "remove has a live owner, or if any room it would KEEP is neither owned by a live",
    "profile nor recent — so the split is asserted, not assumed.",
    "",
    "**What their content shows.**",
    "",
    `- ${preFix} still carried the ORIGINAL defect: a physics room whose message was`,
    '  "why does the ball accelerate?" answered with *"An equation is a balance scale:',
    '  whatever you do to one side…"* — from `room.conceptIds[0] ?? "linear-equations"`,',
    "  a MATHS concept as the universal default.",
    `- ${postFix} carried the FIXED tutor's reply instead (*"Which idea are you working`,
    '  on? Physics: Forces · Motion · Newton\'s laws."*), with `tutorFocus: null`.',
    `- ${empty} were empty forks of the above (created by the e2e "fork" action).`,
    "",
    "That mix is the point: these are demo and end-to-end runs from either side of the",
    "`lib/server/room-tutor.ts#roomFocus` fix, not a learner's history.",
    "",
    "**To restore.** Merge them back into the live file:",
    "",
    "```sh",
    "node -e \"const fs=require('fs');const q=JSON.parse(fs.readFileSync('fixture-rooms.json','utf8'));const live=JSON.parse(fs.readFileSync('.openmind-data/rooms.json','utf8'));fs.writeFileSync('.openmind-data/rooms.json',JSON.stringify([...live,...q],null,2))\"",
    "```",
    "",
    "Do this only against a STOPPED server: the store has no multi-writer safety.",
    "",
    "**Guards added so this cannot accumulate again.** `scripts/cleanup-e2e-store.mjs`",
    "now drops an unowned room that is also older than the run cutoff, and `npm run",
    "verify` sweeps every subject to prove a room can never be grounded in another",
    "subject's concept.",
    "",
  ].join("\n"),
);

fs.writeFileSync(`${DIR}/rooms.json`, `${JSON.stringify(kept, null, 2)}\n`);
console.log(`quarantined ${fixtures.length} → ${Q}`);
console.log(`  content: ${preFix} pre-fix algebra · ${postFix} post-fix no-focus · ${empty} empty forks`);
console.log(`live rooms.json now holds ${kept.length}`);
