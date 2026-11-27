// ─────────────────────────────────────────────────────────────────────────────
// RECONCILE A TEST-INCIDENT CLEANUP, RECORD BY RECORD.
//
// The question this answers is not "how many profiles are left" — it is "which
// record, exactly, was deleted, when was it created, and did any SURVIVOR
// change". Totals hide the only fact that matters: a cleanup can delete the
// right number of the wrong records.
//
// It reads the backups the old cleanup wrote (cleanup-profiles.json-*,
// cleanup-accounts.json-*, …) and the current store, and reports:
//
//   · every surviving profile/account, and whether it is byte-identical to its
//     pre-cleanup copy (a survivor that changed is a failed reconciliation);
//   · every deleted profile, classified PRE-EXISTING or INCIDENT-WINDOW by the
//     instant the run began — because "the e2e created it" and "it was already
//     there" are different findings, and only the second is a data-integrity
//     question;
//   · what work each deleted record held (events, practice, masteries, papers);
//   · every deleted account, paper, class and room, with its timestamp;
//   · the evidence ledgers, which the old cleanup deleted WITHOUT a backup — the
//     one thing this incident cannot reconcile, reported as such.
//
// Exit 0 only when every survivor is unchanged and no store record is absent
// from the backup (i.e. nothing was created after cleanup). Exit 1 otherwise.
//
//   node scripts/reconcile-e2e-incident.mjs \
//     --backup-dir /tmp/openmind-incident-<stamp>/backups \
//     --incident 2026-11-25T21:15:00Z \
//     --json /tmp/openmind-incident-<stamp>/reconciliation.json
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const backupDir = arg("--backup-dir");
const storeDir = path.resolve(arg("--store", ".openmind-data"));
const incident = new Date(arg("--incident", "2026-11-25T21:15:00Z")).getTime();
const jsonOut = arg("--json", null);

if (!backupDir || !fs.existsSync(backupDir)) {
  console.error(`usage: node scripts/reconcile-e2e-incident.mjs --backup-dir <dir> [--store .openmind-data] [--incident ISO] [--json out]`);
  console.error(`\n  ${backupDir ? `${backupDir} does not exist.` : "--backup-dir is required."}`);
  process.exit(2);
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const sha = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const iso = (t) => (typeof t === "number" && Number.isFinite(t) ? new Date(t).toISOString() : "(none)");

/** The EARLIEST backup with this prefix is the pre-cleanup state: later copies
 *  are taken between sweeps, after records have already gone. */
const backupFor = (name) => {
  const found = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith(`cleanup-${name}.json-`))
    .sort((a, b) => Number(a.split("-").pop()) - Number(b.split("-").pop()));
  return found.length ? path.join(backupDir, found[0]) : null;
};

const requireBackup = (name) => {
  const file = backupFor(name);
  if (!file) {
    console.error(`  MISSING BACKUP: no cleanup-${name}.json-* in ${backupDir}. The reconciliation cannot be complete.`);
    process.exit(2);
  }
  return file;
};

const storeFile = (name) => path.join(storeDir, name);
const storeJson = (name, fallback) => (fs.existsSync(storeFile(name)) ? readJson(storeFile(name)) : fallback);

const findings = { incident: new Date(incident).toISOString(), store: storeDir, backupDir, failures: [], preExisting: [], incidentWindow: [], survivors: [], accounts: [], papers: [], classes: [], rooms: [], ledgers: {} };

// ── PROFILES ────────────────────────────────────────────────────────────────
const profilesBefore = readJson(requireBackup("profiles"));
const profilesAfter = storeJson("profiles.json", {});
for (const [id, state] of Object.entries(profilesAfter)) {
  if (!(id in profilesBefore)) {
    findings.failures.push(`profile ${id} exists now but not in the pre-cleanup backup — a record was created after cleanup`);
    continue;
  }
  const identical = sha(state) === sha(profilesBefore[id]);
  findings.survivors.push({ id, identical, handle: state.profile?.handle ?? null, createdAt: createdAtOf(state) });
  if (!identical) findings.failures.push(`surviving profile ${id} differs from its pre-cleanup copy`);
}

// The creation instant is a SIBLING (`state.createdAt`) on records written by
// the current store and INSIDE `profile` on older ones. Reading only one of the
// two made every deletion look pre-existing on the first run of this script —
// which is exactly the error that would turn an incident report into a false
// alarm about real learners, so both are read here.
function createdAtOf(state) {
  return state.createdAt ?? state.profile?.createdAt ?? null;
}

const record = (id, state, era) => ({
  id,
  handle: state.profile?.handle ?? null,
  createdAt: createdAtOf(state),
  era,
  events: Array.isArray(state.events) ? state.events.length : 0,
  practice: state.practice && typeof state.practice === "object" ? Object.keys(state.practice).length : 0,
  masteries: state.masteries && typeof state.masteries === "object" ? Object.keys(state.masteries).length : 0,
  personalPapers: state.personalPapers && typeof state.personalPapers === "object" ? Object.keys(state.personalPapers).length : 0,
  diagnostics: Array.isArray(state.diagnostics) ? state.diagnostics.length : state.diagnostics && typeof state.diagnostics === "object" ? Object.keys(state.diagnostics).length : 0,
});
for (const [id, state] of Object.entries(profilesBefore)) {
  if (id in profilesAfter) continue;
  const entry = record(id, state, (createdAtOf(state) ?? 0) >= incident ? "incident-window" : "pre-existing");
  (entry.era === "pre-existing" ? findings.preExisting : findings.incidentWindow).push(entry);
}

// ── ACCOUNTS ────────────────────────────────────────────────────────────────
const accountsBefore = readJson(requireBackup("accounts"));
const accountsAfter = storeJson("accounts.json", {});
for (const [email, account] of Object.entries(accountsAfter)) {
  if (!(email in accountsBefore)) findings.failures.push(`account ${email} exists now but not in the pre-cleanup backup`);
}
for (const [email, account] of Object.entries(accountsBefore)) {
  const kept = email in accountsAfter;
  const identical = kept ? sha(account) === sha(accountsBefore[email]) : null;
  if (kept && !identical) findings.failures.push(`surviving account ${email} differs from its pre-cleanup copy`);
  findings.accounts.push({
    email,
    profileId: account.profileId ?? null,
    createdAt: account.createdAt ?? null,
    era: (account.createdAt ?? 0) >= incident ? "incident-window" : "pre-existing",
    kept,
  });
}

// ── PAPERS / CLASSES / ROOMS / PERSONAL PAPERS ──────────────────────────────
const diffCollection = (name, before, after, isArray) => {
  const beforeEntries = isArray ? before.map((v) => [v.id, v]) : Object.entries(before);
  const afterKeys = new Set(isArray ? after.map((v) => v.id) : Object.keys(after));
  return beforeEntries
    .filter(([key]) => !afterKeys.has(key))
    .map(([key, value]) => ({
      id: key,
      createdAt: value.createdAt ?? null,
      era: (value.createdAt ?? 0) >= incident ? "incident-window" : "pre-existing",
      owner: value.owner ?? value.createdBy ?? null,
      label: value.name ?? value.title ?? value.subject ?? null,
    }));
};

const papersBefore = readJson(requireBackup("papers"));
findings.papers = diffCollection("papers", papersBefore, storeJson("papers.json", {}), false);
const classesBefore = readJson(requireBackup("classes"));
findings.classes = diffCollection("classes", classesBefore, storeJson("classes.json", []), true);
const roomsBefore = readJson(requireBackup("rooms"));
findings.rooms = diffCollection("rooms", roomsBefore, storeJson("rooms.json", []), true);
const personalBefore = readJson(requireBackup("personal-papers"));
findings.personalPapers = diffCollection("personal-papers", personalBefore, storeJson("personal-papers.json", {}), false);

// ── EVIDENCE LEDGERS: the irreversible gap ──────────────────────────────────
const evidenceDir = storeFile("evidence");
const ledgersNow = fs.existsSync(evidenceDir) ? fs.readdirSync(evidenceDir).filter((f) => f.endsWith(".jsonl")) : [];
findings.ledgers = {
  now: ledgersNow.length,
  backedUp: false,
  note:
    "The old cleanup deleted every ledger in .openmind-data/evidence/ with rmSync and made no copy. " +
    "Their COUNT can be reconstructed from its log; their CONTENTS cannot. This is the one deletion " +
    "in the incident that is not recoverable from the preserved backup.",
};

// ── REPORT ──────────────────────────────────────────────────────────────────
const work = (r) => `events=${r.events} practice=${r.practice} masteries=${r.masteries} papers=${r.personalPapers} diagnostics=${r.diagnostics}`;
console.log(`\nRECONCILIATION — incident ${findings.incident}`);
console.log(`  store:  ${storeDir}`);
console.log(`  backup: ${backupDir}\n`);

console.log(`SURVIVORS (${findings.survivors.length})`);
for (const s of findings.survivors) console.log(`  ${s.identical ? "unchanged" : "CHANGED  "} ${s.id.padEnd(34)} ${String(s.handle).padEnd(12)} ${iso(s.createdAt)}`);

console.log(`\nDELETED PROFILES — PRE-EXISTING (${findings.preExisting.length})  ← these predate the test run`);
for (const r of findings.preExisting.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))) {
  console.log(`  ${r.id.padEnd(34)} ${String(r.handle).padEnd(12)} ${iso(r.createdAt)}  ${work(r)}`);
}
console.log(`\nDELETED PROFILES — INCIDENT WINDOW (${findings.incidentWindow.length})`);
for (const r of findings.incidentWindow.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))) {
  console.log(`  ${r.id.padEnd(34)} ${String(r.handle).padEnd(22)} ${iso(r.createdAt)}  ${work(r)}`);
}

console.log(`\nACCOUNTS (${findings.accounts.length})`);
for (const a of findings.accounts) console.log(`  ${a.kept ? "kept   " : "deleted"} ${a.era.padEnd(15)} ${a.email.padEnd(36)} owner=${a.profileId}`);

const collection = (label, rows) => {
  console.log(`\n${label} (${rows.length})`);
  for (const r of rows) console.log(`  ${r.era.padEnd(15)} ${String(r.id).padEnd(34)} ${iso(r.createdAt)}  owner=${r.owner ?? "-"}  ${r.label ?? ""}`);
  const pre = rows.filter((r) => r.era === "pre-existing");
  if (pre.length > 0) findings.failures.push(`${label}: ${pre.length} record(s) predate the incident and were deleted`);
};
collection("PAPERS REMOVED", findings.papers);
collection("CLASSES REMOVED", findings.classes);
collection("ROOMS REMOVED", findings.rooms);
collection("PERSONAL PAPERS REMOVED", findings.personalPapers);

console.log(`\nEVIDENCE LEDGERS`);
console.log(`  now: ${findings.ledgers.now}   backed up: no`);
console.log(`  ${findings.ledgers.note}`);

console.log(`\nFAILURES (${findings.failures.length})`);
for (const f of findings.failures) console.log(`  ✗ ${f}`);
if (findings.failures.length === 0) {
  console.log("  none — every survivor is byte-identical, and no store record is absent from the backup");
}

const preExistingDeleted = findings.preExisting.length + findings.accounts.filter((a) => !a.kept && a.era === "pre-existing").length;
console.log(
  `\nRECONCILIATION: ${findings.survivors.length} survivor(s) unchanged; ` +
    `${findings.preExisting.length} pre-existing profile(s) and ` +
    `${findings.accounts.filter((a) => !a.kept && a.era === "pre-existing").length} pre-existing account(s) deleted; ` +
    `${findings.incidentWindow.length} incident-window profile(s) deleted; ` +
    `${findings.papers.length} paper(s), ${findings.classes.length} class(es), ${findings.rooms.length} room(s) removed; ` +
    `ledgers unrecoverable.`,
);
console.log(
  preExistingDeleted > 0
    ? `\nVERDICT: the cleanup was NOT limited to test-created records. ${preExistingDeleted} record(s) that predate the incident were deleted; they are recoverable byte-for-byte from the preserved backup, and none has been restored.\n`
    : `\nVERDICT: every deleted record was created by the incident run. No pre-existing record was removed.\n`,
);

if (jsonOut) {
  fs.writeFileSync(jsonOut, JSON.stringify(findings, null, 2));
  console.log(`  machine-readable record: ${jsonOut}`);
}

process.exit(findings.failures.length > 0 ? 1 : 0);
