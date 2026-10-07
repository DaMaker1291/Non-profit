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
sweepRecent("rooms.json");
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
// are read owner-scoped too. A ROOM has no profile id anywhere in it
// (`createdBy` and `members` are handles), so rooms are left to the recency
// sweep rather than judged by a field that cannot carry the answer.
const live = new Set(Object.keys(profiles));

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
console.log("done");
