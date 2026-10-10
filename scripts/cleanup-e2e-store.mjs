// Post-e2e cleanup: remove the data the e2e run wrote into the LIVE store.
// The user's own account/profile is never touched (its profile id is pinned
// below and asserted). Backups live in /tmp/openmind-backup-ui-*.
import fs from "node:fs";

const DIR = ".openmind-data";
const MINE = "stu_mub5fkj8lg2plm7a0a"; // the user's real account/profile
const CUTOFF = Date.now() - 3 * 3600e3; // the e2e ran minutes ago
const backup = (name) => fs.copyFileSync(`${DIR}/${name}`, `/tmp/cleanup-${name}-${Date.now()}`);

// profiles: keep only mine
backup("profiles.json");
const profiles = JSON.parse(fs.readFileSync(`${DIR}/profiles.json`, "utf8"));
if (!profiles[MINE]) throw new Error("refusing to run: the pinned profile is missing");
const before = Object.keys(profiles).length;
for (const id of Object.keys(profiles)) if (id !== MINE) delete profiles[id];
fs.writeFileSync(`${DIR}/profiles.json`, JSON.stringify(profiles, null, 2));
console.log(`profiles: ${before} -> ${Object.keys(profiles).length} (kept: ${MINE})`);

// accounts: keep only the one that owns the pinned profile
backup("accounts.json");
const accounts = JSON.parse(fs.readFileSync(`${DIR}/accounts.json`, "utf8"));
const beforeA = Object.keys(accounts).length;
for (const [email, a] of Object.entries(accounts)) {
  if ((a.profileId ?? a.profile?.id) !== MINE) delete accounts[email];
}
fs.writeFileSync(`${DIR}/accounts.json`, JSON.stringify(accounts, null, 2));
console.log(`accounts: ${beforeA} -> ${Object.keys(accounts).length}`);

// evidence ledgers: none belongs to the pinned profile (asserted), remove all
const ledgerDir = `${DIR}/evidence`;
const ledgers = fs.readdirSync(ledgerDir);
if (ledgers.includes(`${MINE}.jsonl`)) throw new Error("refusing to remove the pinned learner's ledger");
for (const f of ledgers) fs.rmSync(`${ledgerDir}/${f}`);
console.log(`evidence ledgers removed: ${ledgers.length}`);

// the recent e2e's classes / rooms / papers / personal papers
const sweepRecent = (name) => {
  backup(name);
  const j = JSON.parse(fs.readFileSync(`${DIR}/${name}`, "utf8"));
  const entries = Array.isArray(j) ? j.map((v) => [null, v]) : Object.entries(j);
  const beforeN = entries.length;
  const kept = entries.filter(([, v]) => (v.createdAt ?? 0) <= CUTOFF);
  if (Array.isArray(j)) fs.writeFileSync(`${DIR}/${name}`, JSON.stringify(kept.map(([, v]) => v), null, 2));
  else fs.writeFileSync(`${DIR}/${name}`, JSON.stringify(Object.fromEntries(kept), null, 2));
  console.log(`${name}: ${beforeN} -> ${kept.length}`);
};
sweepRecent("classes.json");
// NOT rooms. Recency is the WRONG test for a room, in BOTH directions: it
// missed every room older than the window (the 164 that had to be quarantined
// by hand) AND it deleted the real learner's own room if they happened to make
// one within three hours of a cleanup run. Ownership is the right test, and it
// is applied below once the profiles are gone — measured on the live store, an
// e2e run forks rooms under handles that no surviving profile answers to, so
// `liveHandles` already identifies them without a clock.
sweepRecent("papers.json");
sweepRecent("personal-papers.json");

// ── ARTEFACTS WHOSE PEOPLE ARE GONE ────────────────────────────────────────
// The recency sweep above cannot do this job, and the gap it leaves is not
// theoretical: measured on the live store, 196 classes and 27 personal papers
// were residue from runs OLDER than the cutoff, so they survived every previous
// cleanup. They are unreachable by construction — every read of them is
// owner-scoped (`getPersonalPaper(id, owner)`, `lib/server/class-membership.ts`
// answers only a profile in `cls.members`) — so no learner can ever claim one
// back, and AGENTS.md's rule is explicit: "delete those profiles and any paper
// whose owner is gone".
//
// WHAT COUNTS AS PROOF, per file, because guessing here would delete a real
// learner's work. A CLASS is dead when its `members` array holds no surviving
// profile id: that array is profile ids (`membersById` and `students` are
// HANDLE-keyed, so they prove nothing either way, and `teacher` is the literal
// role string, not an id). A PAPER is dead when its `owner` is gone — papers
// are read owner-scoped too.
//
// A ROOM carries NO profile id — `createdBy` and `members` are handles — so it
// is judged on the handle instead, and the recency sweep stays in front of that
// judgement. That is sound because of where the handle comes from:
// `app/rooms/page.tsx` sends `state?.profile.handle ?? "guest"`, so a room a
// real learner created carries THEIR handle, and a profile whose handle is
// unset falls back to "guest" and is protected by name. This rule is what the
// live store needed: it held 164 demo rooms (every one `subject: "physics"`
// with an empty `conceptIds`) that the recency sweep alone never removed,
// because it only ever looked at rooms from the CURRENT run. They were
// quarantined by hand — see scripts/quarantine-fixture-rooms.mjs — and this is
// the rule that stops the next 164 accumulating.
const live = new Set(Object.keys(profiles));
const liveHandles = new Set(
  Object.values(profiles).map((v) => v.profile?.handle).filter((h) => typeof h === "string" && h),
);

const sweepWhere = (name, isGone, why) => {
  backup(name);
  const j = JSON.parse(fs.readFileSync(`${DIR}/${name}`, "utf8"));
  const entries = Array.isArray(j) ? j.map((v) => [null, v]) : Object.entries(j);
  const beforeN = entries.length;
  const kept = entries.filter(([, v]) => !isGone(v));
  if (Array.isArray(j)) fs.writeFileSync(`${DIR}/${name}`, JSON.stringify(kept.map(([, v]) => v), null, 2));
  else fs.writeFileSync(`${DIR}/${name}`, JSON.stringify(Object.fromEntries(kept), null, 2));
  console.log(`${name}: ${beforeN} -> ${kept.length} (dropped ${beforeN - kept.length} ${why})`);
};

sweepWhere(
  "classes.json",
  (v) => Array.isArray(v.members) && v.members.length > 0 && !v.members.some((m) => live.has(m)),
  "with no surviving member",
);
sweepWhere(
  "personal-papers.json",
  (v) => typeof v.owner === "string" && v.owner && !live.has(v.owner),
  "whose owner is gone",
);
sweepWhere(
  "papers.json",
  (v) => typeof v.owner === "string" && v.owner && !live.has(v.owner),
  "whose owner is gone",
);
// Rooms: no surviving profile answers to any handle the room names. Age is
// deliberately NOT part of this — a room made by the real learner minutes ago
// is theirs and must survive, and a demo room made weeks ago must not.
// "guest" is protected by name because that is the handle the rooms page sends
// for a profile that never chose one, so it can be a real learner.
sweepWhere(
  "rooms.json",
  (v) =>
    !liveHandles.has(v.createdBy) &&
    v.createdBy !== "guest" &&
    !(v.members ?? []).some((m) => liveHandles.has(m) || m === "guest"),
  "nobody owns",
);

// ── INTERVENTIONS (§8), the same proof as classes ─────────────────────────
// An intervention record is class state beside the roster: it is read only
// through `withNeed(id, clsId, …)` and listed only for a class the caller
// owns, so a record whose class is gone is unreachable exactly the way a dead
// class is — and one whose owner is gone has no teacher who could ever read
// it. Judged on the class it names (the file's own key: `clsId`) and the
// teacher's profile id, both of which are real ids rather than handles.
//
// NOT `sweepWhere`: that helper treats a file as a map or a list, and this
// file is neither — it is `{ records: [...], version }`. Read through the
// wrapper, its two keys looked like the two "entries" and the sweep reported
// "2 -> 2 dropped 0" while every record stayed (measured: 8 left behind).
// The class set is read from the file the sweep above just rewrote, so the
// answer is the SURVIVING set, not the pre-sweep one.
// Only a store that has ever recorded one HAS this file — a fresh deployment's
// does not — so a missing file is SKIPPED, not crashed into. `backup` copies
// and would throw on the absent source, which would abort the cleanup halfway
// (profiles and ledgers already swept) on a store that never used the loop.
const ivPath = `${DIR}/interventions.json`;
if (!fs.existsSync(ivPath)) {
  console.log("interventions.json: none on this store");
} else {
  backup("interventions.json");
  const ivFile = JSON.parse(fs.readFileSync(ivPath, "utf8"));
  const liveClasses = new Set(
    (JSON.parse(fs.readFileSync(`${DIR}/classes.json`, "utf8")) ?? []).map((c) => c.id),
  );
  const ivBefore = (ivFile.records ?? []).length;
  const ivKept = (ivFile.records ?? []).filter((r) => live.has(r.ownerId) && liveClasses.has(r.clsId));
  fs.writeFileSync(ivPath, JSON.stringify({ ...ivFile, records: ivKept }, null, 2));
  console.log(`interventions.json: ${ivBefore} -> ${ivKept.length} (dropped ${ivBefore - ivKept.length} whose class or teacher is gone)`);
}
console.log("done");
