// ─────────────────────────────────────────────────────────────────────────────
// THE POSTGRES BACKEND — the port, implemented against the schema in `db/`.
//
// WHAT THIS FILE IS. `lib/server/storage.ts` is the contract and
// `lib/server/storage-file.ts` is one implementation of it. This is the second,
// and it exists because the file store is single-process by construction: its
// lock is a promise chain and its records are whole-file rewrites, so two
// instances over one directory lose each other's writes. docs/STORAGE_SPEC.md
// §6 names the rule that keeps a second backend from becoming a second product:
// ONE conformance suite, driven through the PORT. `npm run storage-check` runs
// it against whichever backend the environment selects — including this one.
//
// EVERY METHOD HERE OBEYS THE PORT'S PROMISES, and the ones that are easy to
// break silently are called out where they are implemented:
//
//   · `getProfile` for an unknown learner is `null`, never an empty record
//     (§3 Q2: creating is not a mutation of an existing learner).
//   · `readEvents` is OLDEST FIRST by CLOCK, tie-broken by id — the same rule
//     `lib/evidence.ts#orderEvents` applies, because a device syncing offline
//     work appends events that happened before ones already written.
//   · `appendEvents` is idempotent by event id, and an event about another
//     learner is refused outright: the ledger is the authorisation boundary's
//     last line, not the caller's.
//   · `withLearner` is ONE transaction holding an advisory lock on the learner,
//     so the record and the evidence that justifies it are one unit — and the
//     ledger operations travel on THAT connection, which is what stops a
//     mutator from opening a second connection and deadlocking against the lock
//     it already holds (docs/STORAGE_SPEC.md §14 decision 1).
//   · the write policy is enforced HERE as well as in the file backend. A
//     database is durable, but "durable" is still a claim the deployment has to
//     have made; a second backend that skipped the check would be a way to write
//     learner records on a deployment that never declared it can keep them.
//     Erasure and identity writes are never refused (lib/server/write-policy.ts).
//
// WHAT LIVES WHERE, because the schema is deliberately split (§5 of the spec):
//   profiles.payload            the learner's OWN record — the `StudentProfile`
//                               verbatim plus the capability secret, and any
//                               field added to `ProfileState` that is not part of
//                               the model. Additive fields land here by default
//                               rather than being dropped silently, which is the
//                               defect 0005 exists for.
//   learner_projections.model   the MODEL half — progress, masteries,
//                               diagnostics, observed, seenQuestions, the
//                               pre-ledger base, the last session. Rebuildable by
//                               replaying the ledger, and therefore not stored
//                               beside the record where it could disagree.
//   evidence_events.payload     the event VERBATIM; the typed columns beside it
//                               are the ones queries and indexes read.
// ─────────────────────────────────────────────────────────────────────────────
import { createHash } from "node:crypto";
import type { Account, AccountRole, ClassRoster, ProfileState, StudyPack, StudyRoom } from "../types";
import { orderEvents, PROJECTION_VERSION } from "../evidence";
import type { AppendResult, EvidenceEvent } from "../evidence";
import type { BuiltPaperAnswerKey } from "../papers";
import type { PersonalPaper } from "../personal-paper";
import type { ContentReviewRecord } from "../content-platform/types";
import type { EducatorReviewRecord, ImprovementTask } from "../validation/types";
import type { ErasureRecord } from "./erasures";
import type { Storage } from "./storage";
import { getPool, pgQuery, withLockedTransaction } from "./pg";
import { assertWritable } from "./write-policy";
import { bindLegacyHandles, removeMember } from "./class-membership";
import { hashPassword, makeSalt, newId, normaliseEmail } from "./identity-crypto";
import type { PoolClient } from "pg";

/** The keys of `ProfileState` that are the MODEL — derived from the ledger, and
 *  therefore stored in `learner_projections`. Everything else is the record and
 *  rides in `profiles.payload`. */
const MODEL_KEYS = [
  "progress",
  "diagnostics",
  "masteries",
  "projectionBase",
  "observed",
  "lastSession",
  "seenQuestions",
] as const;

type Row = Record<string, unknown>;
type Client = Pick<PoolClient, "query">;

/** A single statement (no transaction). */
async function q<R extends Row = Row>(text: string, params: readonly unknown[] = []): Promise<R[]> {
  return pgQuery<R>(text, params);
}

/** The SHA-256 of a capability secret. The raw secret round-trips in the record
 *  (0005 explains why: sign-in hands it back to a new device), and this column
 *  exists so the database has a non-reversible form of it too. Written from the
 *  SAME object in the SAME statement, so the two can never disagree.
 *
 *  ALWAYS A DIGEST, including for the empty secret a freshly-created profile
 *  carries before one is minted: `profiles.secret_hash` is NOT NULL (0001), and
 *  answering `null` for "no secret yet" turned a legitimate record — the one
 *  `newProfileState` makes — into a constraint violation. The hash of "" is the
 *  honest value; the column is a digest of whatever the record holds, never a
 *  claim that the record holds a usable credential. */
function secretHash(secret: string): string {
  return createHash("sha256").update(secret ?? "").digest("hex");
}

/** A timestamptz column as epoch ms. `pg` hands back a Date; a NULL stays null. */
function ms(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getTime();
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ── Profiles: record + projection, one shape ────────────────────────────────

function stateFromRows(payload: unknown, model: unknown): ProfileState | null {
  const record = (payload ?? {}) as Partial<ProfileState>;
  const derived = (model ?? {}) as Partial<ProfileState>;
  if (!record.profile) return null;
  return {
    ...record,
    ...derived,
    profile: record.profile,
    secret: record.secret ?? "",
    progress: derived.progress ?? {},
    diagnostics: derived.diagnostics ?? {},
    masteries: derived.masteries ?? {},
  } as ProfileState;
}

const STATE_SELECT = `
  select p.payload, j.model
    from profiles p
    left join learner_projections j on j.learner_id = p.id
   where p.id = $1`;

async function readStateIn(client: Client, id: string): Promise<ProfileState | null> {
  const rows = (await client.query(STATE_SELECT, [id])).rows as Row[];
  if (!rows.length) return null;
  return stateFromRows(rows[0].payload, rows[0].model);
}

async function readState(id: string): Promise<ProfileState | null> {
  const rows = await q(STATE_SELECT, [id]);
  if (!rows.length) return null;
  return stateFromRows(rows[0].payload, rows[0].model);
}

/**
 * Write BOTH halves of a learner record from ONE object, in ONE statement each,
 * inside the caller's transaction.
 *
 * `user_id` is deliberately absent from the UPDATE: a profile's link to an
 * account is `users.profile_id` (0006), and a profile write must never be able
 * to re-point somebody's account at a different learner.
 */
async function writeStateIn(client: Client, state: ProfileState): Promise<void> {
  const profile = state.profile;
  const { progress, diagnostics, masteries, projectionBase, observed, lastSession, seenQuestions, ...record } = state;
  const model: Record<string, unknown> = {
    progress: progress ?? {},
    diagnostics: diagnostics ?? {},
    masteries: masteries ?? {},
  };
  if (projectionBase !== undefined) model.projectionBase = projectionBase;
  if (observed !== undefined) model.observed = observed;
  if (lastSession !== undefined) model.lastSession = lastSession;
  if (seenQuestions !== undefined) model.seenQuestions = seenQuestions;

  await client.query(
    `insert into profiles (
       id, country, language, birth_year, goal, intent, subjects,
       specification_id, level_id, secret_hash, payload
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (id) do update set
       country = excluded.country,
       language = excluded.language,
       birth_year = excluded.birth_year,
       goal = excluded.goal,
       intent = excluded.intent,
       subjects = excluded.subjects,
       specification_id = excluded.specification_id,
       level_id = excluded.level_id,
       secret_hash = excluded.secret_hash,
       payload = excluded.payload,
       updated_at = now()`,
    [
      profile.id,
      profile.country ?? "INT",
      profile.language ?? "en",
      typeof profile.birthYear === "number" ? profile.birthYear : null,
      profile.goal ?? "",
      profile.intent ?? "",
      profile.subjects ?? [],
      profile.spec ?? null,
      profile.specLevel ?? null,
      secretHash(state.secret ?? ""),
      JSON.stringify(record),
    ],
  );

  const lastEventAt = projectionBase?.ledgerMark ?? null;
  await client.query(
    `insert into learner_projections (learner_id, model, projection_version, last_event_at)
     values ($1,$2,$3,$4)
     on conflict (learner_id) do update set
       model = excluded.model,
       projection_version = excluded.projection_version,
       last_event_at = excluded.last_event_at,
       updated_at = now()`,
    [profile.id, JSON.stringify(model), PROJECTION_VERSION, lastEventAt],
  );
}

/** Remove a learner's record and its projection. The ledger is NOT touched: the
 *  erase is a SEQUENCE (ledger, papers, memberships, record, tombstone) and no
 *  single call owns it (F-2 of docs/STORAGE_SPEC.md §13, lib/server/erasure.ts). */
async function deleteStateIn(client: Client, id: string): Promise<boolean> {
  const found = await client.query("select 1 from profiles where id = $1", [id]);
  if (!found.rowCount) return false;
  await client.query("delete from learner_projections where learner_id = $1", [id]);
  await client.query("delete from profiles where id = $1", [id]);
  return true;
}

// ── The ledger ──────────────────────────────────────────────────────────────

/** The event's `chosen`, clamped to the schema's rule rather than dropped: −1 is
 *  "the learner typed their answer", and any real option index is ≥ 0. */
function chosenOf(event: EvidenceEvent): number | null {
  const chosen = (event as { chosen?: unknown }).chosen;
  return typeof chosen === "number" && Number.isFinite(chosen) && chosen >= -1 ? chosen : null;
}

/** `ms` is bounded by the schema (a sitting cannot last an hour). An
 *  out-of-range value is stored as NULL in the COLUMN and kept verbatim in
 *  `payload`, so the record is never altered to satisfy a constraint. */
function durationOf(event: EvidenceEvent): number | null {
  const value = (event as { ms?: unknown }).ms;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 3_600_000 ? value : null;
}

function scoreOf(event: EvidenceEvent): [number | null, number | null] {
  const score = (event as { score?: { awarded?: unknown; max?: unknown } | null }).score;
  if (!score) return [null, null];
  const awarded = typeof score.awarded === "number" && Number.isFinite(score.awarded) ? Math.max(0, score.awarded) : null;
  const max = typeof score.max === "number" && Number.isFinite(score.max) ? score.max : null;
  // The schema requires the pair to be present together and awarded ≤ max.
  if (awarded === null || max === null || max < awarded) return [null, null];
  return [awarded, max];
}

function strOf(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function appendIn(client: Client, learnerId: string, events: readonly EvidenceEvent[]): Promise<AppendResult> {
  const accepted: string[] = [];
  const duplicates: string[] = [];
  if (!events.length) return { accepted, duplicates };
  // Checked before a single row is written, exactly as the file backend checks
  // before touching its file: a store the deployment cannot keep must not accept
  // one more event, because `commitAndProject` answers `evidence_not_recorded`
  // rather than moving the model on an event nobody will find again.
  assertWritable("learner-record", "evidence");

  for (const event of events) {
    if (event.learnerId !== learnerId) {
      throw new Error("refusing to write evidence for a different learner");
    }
    const answer = event.type === "answer_submitted" ? event : null;
    const [awarded, max] = answer ? scoreOf(answer) : [null, null];
    const rows = await client.query(
      `insert into evidence_events (
         id, learner_id, at, device_at, type, subject, concept_id, specification_id,
         source, question_id, correct, chosen, given_value, mode, hints, ms,
         score_awarded, score_max, tags, certainty, schema_version, payload
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       on conflict (id) do nothing
       returning id`,
      [
        event.id,
        learnerId,
        event.at,
        answer ? (answer.deviceAt ?? null) : null,
        event.type,
        event.subject ?? null,
        event.conceptId ?? null,
        event.specificationId ?? null,
        event.source,
        strOf((event as { questionId?: unknown }).questionId),
        answer ? answer.correct : null,
        chosenOf(event),
        answer ? (typeof answer.givenValue === "number" ? answer.givenValue : null) : null,
        answer ? answer.mode : null,
        answer ? Math.max(0, answer.hints ?? 0) : null,
        durationOf(event),
        awarded,
        max,
        (event as { tags?: string[] }).tags ?? [],
        answer ? (answer.certainty ?? null) : null,
        event.schemaVersion,
        // THE EVENT VERBATIM. The typed columns above are what queries read;
        // this is the record itself, so a projection change is replayed against
        // history rather than assumed.
        JSON.stringify(event),
      ],
    );
    if (rows.rowCount) accepted.push(event.id);
    else duplicates.push(event.id);
  }
  return { accepted, duplicates };
}

async function readEventsAll(learnerId: string): Promise<EvidenceEvent[]> {
  const rows = await q(
    "select payload from evidence_events where learner_id = $1 order by at asc, id asc",
    [learnerId],
  );
  return orderEvents(rows.map((row) => row.payload as EvidenceEvent).filter(Boolean));
}

async function readEventsIn(client: Client, learnerId: string): Promise<EvidenceEvent[]> {
  // ORDER BY the same pair `orderEvents` uses, so the promise is kept by the
  // query rather than by a sort the caller might forget.
  const rows = (await client.query(
    "select payload from evidence_events where learner_id = $1 order by at asc, id asc",
    [learnerId],
  )).rows as Row[];
  const out: EvidenceEvent[] = [];
  for (const row of rows) {
    const payload = row.payload as EvidenceEvent | null;
    if (payload) out.push(payload);
  }
  return orderEvents(out);
}

// ── Accounts ────────────────────────────────────────────────────────────────

const USER_SELECT = `
  select id, email, name, role, pass_hash, salt, profile_id, verified, session_epoch,
         created_at, last_seen_at, recovery_salt, recovery_hash,
         reset_salt, reset_hash, reset_expires_at,
         verify_salt, verify_hash, verify_expires_at
    from users`;

function accountFromRow(row: Row): Account {
  const account: Account = {
    id: String(row.id),
    email: String(row.email ?? ""),
    name: String(row.name ?? ""),
    role: (row.role as AccountRole) ?? "student",
    passHash: String(row.pass_hash ?? ""),
    salt: String(row.salt ?? ""),
    createdAt: ms(row.created_at) ?? 0,
    lastSeenAt: ms(row.last_seen_at) ?? 0,
    profileId: String(row.profile_id ?? ""),
    verified: Boolean(row.verified),
    // Always present from the database's own default, which is 0. A token issued
    // before the epoch existed reads as epoch 0, so this is the same value that
    // makes an old token valid rather than a fabricated revocation.
    sessionEpoch: Number(row.session_epoch ?? 0),
  };
  // Optional credential artefacts are set only when they EXIST: an account with
  // no recovery code must be distinguishable from one holding an empty string.
  if (row.recovery_salt != null) account.recoverySalt = String(row.recovery_salt);
  if (row.recovery_hash != null) account.recoveryHash = String(row.recovery_hash);
  if (row.reset_salt != null) account.resetSalt = String(row.reset_salt);
  if (row.reset_hash != null) account.resetHash = String(row.reset_hash);
  if (row.reset_expires_at != null) account.resetExpiresAt = Number(row.reset_expires_at);
  if (row.verify_salt != null) account.verifySalt = String(row.verify_salt);
  if (row.verify_hash != null) account.verifyHash = String(row.verify_hash);
  if (row.verify_expires_at != null) account.verifyExpiresAt = Number(row.verify_expires_at);
  return account;
}

async function accountById(id: string): Promise<Account | null> {
  const rows = await q(`${USER_SELECT} where id = $1`, [id]);
  return rows.length ? accountFromRow(rows[0]) : null;
}

async function accountByIdIn(client: Client, id: string): Promise<Account | null> {
  const rows = (await client.query(`${USER_SELECT} where id = $1`, [id])).rows as Row[];
  return rows.length ? accountFromRow(rows[0]) : null;
}

/** Every account write is serialised on ONE key, because the decisions taken
 *  inside them ("is this address free?") are about the whole set — the same
 *  reason the file backend takes `accounts.json`'s lock. */
const ACCOUNT_LOCK = "accounts";

// ── Classes ─────────────────────────────────────────────────────────────────

/** ONE lock for the class set, like the file backend's `classes.json`: a join
 *  code is unique across classes, so two teachers creating a class at the same
 *  moment must not each be told their code was free. The unique index is the
 *  database's own guarantee; the lock is what keeps the common case from being a
 *  retry loop. */
const CLASS_LOCK = "classes";

const JOIN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomJoinCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += JOIN_ALPHABET[Math.floor(Math.random() * JOIN_ALPHABET.length)];
  }
  return s;
}

async function codeInUseIn(client: Client, code: string, exceptId?: string): Promise<boolean> {
  const rows = (await client.query(
    `select 1 from classes
      where upper(join_code) = $1 and archived_at is null and ($2::text is null or id <> $2)`,
    [code, exceptId ?? null],
  )).rows as Row[];
  return rows.length > 0;
}

/** The typed columns and the payload, from ONE object — the rule every table in
 *  this schema follows (a field added to the record must not require rewriting a
 *  stored one). */
async function writeClassIn(client: Client, cls: ClassRoster): Promise<void> {
  await client.query(
    `insert into classes (id, owner_id, name, join_code, subject, created_at, payload)
     values ($1,$2,$3,$4,$5, to_timestamp($6 / 1000.0), $7)
     on conflict (id) do update set
       owner_id = excluded.owner_id,
       name = excluded.name,
       join_code = excluded.join_code,
       subject = excluded.subject,
       payload = excluded.payload`,
    [cls.id, cls.ownerId ?? null, cls.name || "Untitled class", cls.joinCode ?? "", cls.subject ?? null, cls.createdAt ?? Date.now(), JSON.stringify(cls)],
  );
  await projectMembershipIn(client, cls);
}

/**
 * THE ROSTER AS ROWS, WRITTEN IN THE CLASS'S OWN TRANSACTION.
 *
 * `classes.payload` is the roster the app reads — it carries handles, per-member
 * bindings and everything a roster row is not. But `class_members` is the table an
 * operator (and `scripts/postgres-app-smoke.mjs`) reads to answer "who is in this
 * class", and the reconstruction wrote the class and never its membership: a join
 * answered 200, the roster rendered, and the table stayed empty. Found by the
 * smoke test's final check (`1/0`), which is exactly why that check exists.
 *
 * THE ROLES ARE SEPARATED because the FK is to `users`: a class has ONE teacher
 * account (the owner, or the co-teacher later) and its learners. `profiles.user_id`
 * IS the account id, so the roster's ids are user ids already — a member whose
 * account no longer exists (a legacy profile written before accounts) is SKIPPED
 * by the `exists` rather than allowed to fail the class write on a foreign key.
 *
 * Removal is a DELETE, not a `left_at`: the payload is rewritten wholesale on every
 * class mutation, so a member absent from it has been removed from the roster, and
 * a soft-deleted row would keep answering "is a member" to the table's own readers.
 * `left_at` stays available for a future leave-with-history path.
 */
async function projectMembershipIn(client: Client, cls: ClassRoster): Promise<void> {
  // A CLASS NAMES PROFILES; THE TABLE NAMES ACCOUNTS. `class_members.user_id`
  // references `users(id)` and migration 0007 made a class's owner a PROFILE id,
  // so the roster's ids must be resolved through `users.profile_id` before the
  // foreign key sees them — otherwise every learner is silently skipped by the
  // `exists` guard and the roster table holds only the teacher, which is exactly
  // what the smoke test measured (`1/0`) before this mapping existed.
  const accountIds = [cls.teacherAccountId].filter((v): v is string => !!v);
  const profileIds = Array.from(new Set([
    ...(cls.members ?? []),
    ...Object.values(cls.membersById ?? {}),
    ...[cls.ownerId].filter((v): v is string => !!v),
  ].filter((v): v is string => typeof v === "string" && v.length > 0)));
  const resolved: Row[] = profileIds.length
    ? (await client.query(
      `select u.id from unnest($1::text[]) as p(pid) join users u on u.profile_id = p.pid`,
      [profileIds],
    )).rows as Row[]
    : [];
  // The owner's account, resolved separately so "the teacher" is a name and not a
  // guess: a co-teacher is not on the roster payload, and a learner whose profile
  // the teacher also owns is not the teacher.
  const ownerAccount = cls.ownerId
    ? ((await client.query(
      `select id from users where profile_id = $1 and deleted_at is null limit 1`,
      [cls.ownerId],
    )).rows[0] as Row | undefined)?.id as string | undefined
    : undefined;
  const teachers = Array.from(new Set([...accountIds, ...(ownerAccount ? [ownerAccount] : [])]));
  const students = Array.from(new Set(resolved.map((r) => String(r.id)))).filter((id) => !teachers.includes(id));
  for (const [role, ids] of [["teacher", teachers], ["student", students]] as const) {
    if (!ids.length) continue;
    await client.query(
      `insert into class_members (class_id, user_id, role)
       select $1, u.id, $2 from unnest($3::text[]) as u(id)
       where exists (select 1 from users where id = u.id)
       on conflict (class_id, user_id) do update set role = excluded.role, left_at = null`,
      [cls.id, role, ids],
    );
  }
  await client.query(
    `delete from class_members where class_id = $1 and user_id <> all($2::text[])`,
    [cls.id, Array.from(new Set([...teachers, ...students]))],
  );
}

async function classFromRow(row: Row): Promise<ClassRoster | null> {
  const payload = row.payload as ClassRoster | null;
  return payload ?? null;
}

async function classesIn(client: Client, forUpdate = false): Promise<ClassRoster[]> {
  const rows = (await client.query(
    `select payload from classes where archived_at is null order by created_at${forUpdate ? " for update" : ""}`,
  )).rows as Row[];
  const out: ClassRoster[] = [];
  for (const row of rows) {
    const cls = await classFromRow(row);
    if (cls) out.push(cls);
  }
  return out;
}

// ── The backend ─────────────────────────────────────────────────────────────

export const postgresStorage: Storage = {
  kind: "postgres",

  // ── Profiles ──────────────────────────────────────────────────────────────
  getProfile: readState,
  async listProfiles() {
    const rows = await q(`select p.payload, j.model from profiles p left join learner_projections j on j.learner_id = p.id`);
    const out: ProfileState[] = [];
    for (const row of rows) {
      const state = stateFromRows(row.payload, row.model);
      if (state) out.push(state);
    }
    return out;
  },
  async saveProfile(state) {
    assertWritable("learner-record", "a learner record");
    const id = state.profile.id;
    await withLockedTransaction(`learner:${id}`, (client) => writeStateIn(client, state));
  },

  async withLearner(learnerId, fn) {
    return withLockedTransaction(`learner:${learnerId}`, async (client) => {
      const current = await readStateIn(client, learnerId);
      let staged: ProfileState | null = null;
      let removed = false;

      const ctx = {
        learnerId,
        kind: "postgres" as const,
        getProfile: async () => current,
        saveProfile: async (next: ProfileState) => {
          if (next.profile.id !== learnerId) {
            throw new Error(`a transaction for ${learnerId} cannot write ${next.profile.id}'s record`);
          }
          staged = next;
          removed = false;
        },
        deleteProfile: async () => {
          if (!current) return false;
          removed = true;
          staged = null;
          return true;
        },
        readEvents: () => readEventsIn(client, learnerId),
        appendEvents: (events: readonly EvidenceEvent[]) => appendIn(client, learnerId, events),
      };

      // Throwing here commits NOTHING: the record's write is still staged, and
      // the transaction rolls back — so a model that cannot be reconstructed
      // from the ledger is not a state this backend can reach.
      const result = await fn(ctx);

      if (removed) {
        await deleteStateIn(client, learnerId);
      } else if (staged) {
        assertWritable("learner-record", "a learner record");
        await writeStateIn(client, staged);
      }
      return result;
    });
  },

  async withLearnerState(id, mutator) {
    // A specialisation of `withLearner`, exactly as the file backend's is: the
    // two cannot drift into disagreeing about what a serialised write means.
    return postgresStorage.withLearner(id, async (ctx) => {
      const state = await ctx.getProfile();
      // `null` means the learner does not exist, and the mutator is never run for
      // one who does not — creating is not a mutation of an existing learner.
      if (!state) return null;
      const result = await mutator(ctx, state);
      await ctx.saveProfile(state);
      return { state, result };
    });
  },

  async deleteProfile(id) {
    assertWritable("erasure", "an erasure");
    return withLockedTransaction(`learner:${id}`, (client) => deleteStateIn(client, id));
  },

  // ── The erasure log: the instruction and its confirmation, as two records ──
  async recordErasure(learnerId, at) {
    const rows = await q(
      // NO CONFLICT TARGET, deliberately: the key is (learner_id, erased_at,
      // kind) — 0009 explains why — and a target listing fewer columns matches
      // no unique index at all (PostgreSQL refuses the statement).
      `insert into erasures (learner_id, erased_at, kind) values ($1,$2,'recorded')
       on conflict do nothing returning learner_id`,
      [learnerId, at],
    );
    return rows.length > 0;
  },

  async confirmErasure(learnerId, at) {
    // The completion names the instruction it finishes, and refuses to invent
    // one: a confirmation without an instruction is a record of nothing.
    return withLockedTransaction(`erasures:${learnerId}`, async (client) => {
      // THE LATEST INSTRUCTION, which is the one this confirmation finishes.
      // `erasureStateFor` (lib/server/erasures.ts) reads the log the same way —
      // latest instruction, plus the completion whose `of` names it — so a workflow
      // that was interrupted and resumed (instruction at T1, a second at T2, then
      // the confirmation) pairs its completion with T2. Confirming the EARLIEST
      // instruction left the resumed erase permanently `incomplete`, which is the
      // state an operator is supposed to be able to trust.
      const rows = (await client.query(
        `select erased_at from erasures
          where learner_id = $1 and kind = 'recorded'
          order by erased_at desc limit 1`,
        [learnerId],
      )).rows as Row[];
      if (!rows.length) return false;
      const instructionAt = Number(rows[0].erased_at);
      const written = await client.query(
        `insert into erasures (learner_id, erased_at, kind, of_at) values ($1,$2,'completed',$3)
         on conflict do nothing returning learner_id`,
        [learnerId, at, instructionAt],
      );
      return Boolean(written.rowCount);
    });
  },

  async readErasures() {
    const rows = await q(
      `select learner_id, erased_at, kind, of_at from erasures order by erased_at asc`,
    );
    return rows.map((row): ErasureRecord => {
      const record: ErasureRecord = {
        learnerId: String(row.learner_id),
        at: Number(row.erased_at),
      };
      if (row.kind === "completed") record.entry = "completed";
      else record.entry = "recorded";
      if (row.of_at != null) record.of = Number(row.of_at);
      return record;
    });
  },

  async deletePersonalPapersFor(owner) {
    // `erasure`: a right, never refused.
    assertWritable("erasure", "a learner's own papers");
    const rows = await q(`delete from personal_papers where owner_id = $1 returning id`, [owner]);
    return rows.length;
  },

  async removeMemberEverywhere(profileId) {
    assertWritable("erasure", "a learner's memberships");
    return withLockedTransaction(CLASS_LOCK, async (client) => {
      const rosters = await classesIn(client);
      let changed = 0;
      for (const cls of rosters) {
        if (removeMember(cls, profileId)) {
          await writeClassIn(client, cls);
          changed++;
        }
      }
      return changed;
    });
  },

  async counts() {
    // STRICT, like the file backend's `readJsonStrict`: a count is a statement
    // about a school, and a failed read must report a failure rather than 0.
    const [learners, rooms, classes] = await Promise.all([
      q<{ n: string }>("select count(*)::text as n from profiles"),
      q<{ n: string }>("select count(*)::text as n from rooms where closed_at is null"),
      q<{ n: string }>("select count(*)::text as n from classes where archived_at is null"),
    ]);
    return {
      learners: Number(learners[0]?.n ?? 0),
      rooms: Number(rooms[0]?.n ?? 0),
      classes: Number(classes[0]?.n ?? 0),
    };
  },

  // ── Identity ──────────────────────────────────────────────────────────────
  async accountOwningProfile(profileId, exceptAccountId) {
    if (!profileId) return null;
    const rows = await q(
      `${USER_SELECT} where profile_id = $1 and id <> $2 order by created_at asc limit 1`,
      [profileId, exceptAccountId ?? ""],
    );
    return rows.length ? accountFromRow(rows[0]) : null;
  },

  getAccount: accountById,

  async findAccountByEmail(email) {
    const rows = await q(`${USER_SELECT} where lower(email) = $1 and deleted_at is null limit 1`, [normaliseEmail(email)]);
    return rows.length ? accountFromRow(rows[0]) : null;
  },

  async countAccounts() {
    const rows = await q<{ n: string }>("select count(*)::text as n from users where deleted_at is null");
    return Number(rows[0]?.n ?? 0);
  },

  async createAccount(input) {
    assertWritable("identity", "an account");
    return withLockedTransaction(ACCOUNT_LOCK, async (client) => {
      const email = normaliseEmail(input.email);
      // THE CHECK IS INSIDE THE LOCK, and the unique index is behind it: a check
      // made outside a transaction protects nothing, and two concurrent sign-ups
      // with one address would both pass it (F-4 of docs/STORAGE_SPEC.md §13).
      const taken = (await client.query(
        "select 1 from users where lower(email) = $1 and deleted_at is null",
        [email],
      )).rows as Row[];
      if (taken.length) throw new Error("email_taken");
      const salt = makeSalt();
      const now = Date.now();
      const account: Account = {
        id: newId("acc"),
        email,
        name: input.name.trim().slice(0, 40) || email.split("@")[0],
        role: input.role ?? "student",
        salt,
        passHash: hashPassword(input.password, salt),
        createdAt: now,
        lastSeenAt: now,
        profileId: input.profileId,
        verified: false,
        sessionEpoch: 0,
      };
      await client.query(
        `insert into users (id, email, name, role, salt, pass_hash, created_at, last_seen_at, profile_id, verified, session_epoch)
         values ($1,$2,$3,$4,$5,$6, to_timestamp($7 / 1000.0), to_timestamp($8 / 1000.0), $9, false, 0)`,
        [account.id, account.email, account.name, account.role, account.salt, account.passHash, now, now, account.profileId],
      );
      return account;
    });
  },

  async setAccountProfile(accountId, profileId) {
    const rows = await q(
      `update users set profile_id = $2, last_seen_at = now(), updated_at = now() where id = $1 returning id`,
      [accountId, profileId],
    );
    return rows.length ? accountById(accountId) : null;
  },

  async touchAccount(accountId) {
    await q("update users set last_seen_at = now(), updated_at = now() where id = $1", [accountId]);
  },

  async updateAccount(accountId, patch) {
    const rows = await q(
      `update users set
         name = case when $2::text is null then name else $2 end,
         role = case when $3::text is null then role else $3 end,
         updated_at = now()
       where id = $1 returning id`,
      [
        accountId,
        typeof patch.name === "string" && patch.name.trim() ? patch.name.trim().slice(0, 40) : null,
        patch.role ?? null,
      ],
    );
    return rows.length ? accountById(accountId) : null;
  },

  async setPassword(accountId, password) {
    const salt = makeSalt();
    await q(
      "update users set salt = $2, pass_hash = $3, updated_at = now() where id = $1",
      [accountId, salt, hashPassword(password, salt)],
    );
  },

  async revokeSessions(accountId) {
    // ONE statement, which is why `revokeSessions` is a method rather than
    // "read, mutate, write": a concurrent sign-in and sign-out doing the latter
    // lose one of each other.
    await q("update users set session_epoch = session_epoch + 1, updated_at = now() where id = $1", [accountId]);
  },

  // ── Recovery ──────────────────────────────────────────────────────────────
  async setRecoveryCode(accountId, code) {
    const rows = await q(
      `update users set recovery_salt = $2, recovery_hash = $3, updated_at = now() where id = $1 returning id`,
      [accountId, code?.salt ?? null, code?.hash ?? null],
    );
    return rows.length ? accountById(accountId) : null;
  },

  async setResetGrant(accountId, grant) {
    const rows = await q(
      `update users set reset_salt = $2, reset_hash = $3, reset_expires_at = $4, updated_at = now()
       where id = $1 returning id`,
      [accountId, grant?.salt ?? null, grant?.hash ?? null, grant?.expiresAt ?? null],
    );
    return rows.length ? accountById(accountId) : null;
  },

  async findAccountByResetKey(key) {
    const wanted = key.trim().toUpperCase();
    if (wanted.length !== 8) return null;
    // The SAME derivation as `resetKeyFor` (lib/recovery-code.ts) and as the
    // expression index 0007 creates, so the lookup uses that index instead of
    // scanning the roll.
    const rows = await q(
      `${USER_SELECT} where reset_hash is not null
         and upper(substr(regexp_replace(id, '^acc_', ''), 1, 8)) = $1 limit 1`,
      [wanted],
    );
    return rows.length ? accountFromRow(rows[0]) : null;
  },

  async setEmailVerification(accountId, token) {
    const rows = await q(
      `update users set verify_salt = $2, verify_hash = $3, verify_expires_at = $4, updated_at = now()
       where id = $1 returning id`,
      [accountId, token?.salt ?? null, token?.hash ?? null, token?.expiresAt ?? null],
    );
    return rows.length ? accountById(accountId) : null;
  },

  async markEmailVerified(accountId) {
    // ONE write: a crash between "verified" and "drop the token" would leave a
    // link that still works on an address already proved.
    const rows = await q(
      `update users set verified = true, verify_salt = null, verify_hash = null,
         verify_expires_at = null, last_seen_at = coalesce(last_seen_at, now()), updated_at = now()
       where id = $1 returning id`,
      [accountId],
    );
    return rows.length ? accountById(accountId) : null;
  },

  // ── The ledger ────────────────────────────────────────────────────────────
  readEvents: readEventsAll,

  async appendEvents(learnerId, events) {
    return withLockedTransaction(`learner:${learnerId}`, (client) => appendIn(client, learnerId, events));
  },

  async learnersWithEvents() {
    const rows = await q<{ learner_id: string }>(
      "select distinct learner_id from evidence_events order by learner_id",
    );
    return rows.map((row) => String(row.learner_id));
  },

  async hasEvent(learnerId, eventId) {
    const rows = await q("select 1 from evidence_events where learner_id = $1 and id = $2", [learnerId, eventId]);
    return rows.length > 0;
  },

  async deleteEvents(learnerId) {
    const rows = await q("delete from evidence_events where learner_id = $1 returning id", [learnerId]);
    return rows.length > 0;
  },

  // ── Classes and membership ────────────────────────────────────────────────
  async listClasses() {
    // A READ: no lock, nothing repaired. The legacy-roster repair is an explicit
    // operation (`reconcileClassIdentities`), never a side effect of reading
    // (F-3 of docs/STORAGE_SPEC.md §13).
    return classesIn({ query: (text: string, params?: unknown[]) => getPool().query(text, params as unknown[]) } as Client);
  },

  async getClass(id) {
    const rows = await q("select payload from classes where id = $1 and archived_at is null", [id]);
    return rows.length ? classFromRow(rows[0]) : null;
  },

  async saveClass(cls) {
    assertWritable("learner-record", "a class");
    await withLockedTransaction(CLASS_LOCK, (client) => writeClassIn(client, cls));
  },

  async updateClassByCode(code, fn) {
    assertWritable("learner-record", "a class");
    return withLockedTransaction(CLASS_LOCK, async (client) => {
      const rows = (await client.query(
        "select payload from classes where upper(join_code) = $1 and archived_at is null for update",
        [code.toUpperCase()],
      )).rows as Row[];
      if (!rows.length) return null;
      const cls = (rows[0].payload as ClassRoster) ?? null;
      if (!cls) return null;
      const result = await fn(cls);
      await writeClassIn(client, cls);
      return { cls, result };
    });
  },

  async updateClassById(id, fn) {
    assertWritable("learner-record", "a class");
    return withLockedTransaction(CLASS_LOCK, async (client) => {
      const rows = (await client.query(
        "select payload from classes where id = $1 and archived_at is null for update",
        [id],
      )).rows as Row[];
      if (!rows.length) return null;
      const cls = (rows[0].payload as ClassRoster) ?? null;
      if (!cls) return null;
      const result = await fn(cls);
      await writeClassIn(client, cls);
      return { cls, result };
    });
  },

  async createClass(build) {
    assertWritable("learner-record", "a class");
    // A collision is retried INSIDE the lock, and a unique violation from the
    // index is honoured as the same answer: what must never happen is a SECOND
    // live class holding a code a learner already has on a whiteboard.
    for (let attempt = 0; attempt < 32; attempt++) {
      try {
        return await withLockedTransaction(CLASS_LOCK, async (client) => {
          const code = randomJoinCode();
          if (await codeInUseIn(client, code)) {
            throw new Error("join_code_collision");
          }
          const cls = build(code);
          await writeClassIn(client, cls);
          return cls;
        });
      } catch (e) {
        const code = (e as { code?: string }).code;
        const message = (e as Error).message;
        if (message === "join_code_collision" || code === "23505") continue;
        throw e;
      }
    }
    throw new Error("no free join code after 32 attempts — the code space is exhausted, not unlucky");
  },

  async rotateJoinCode(id, ttlMs) {
    assertWritable("learner-record", "a class");
    for (let attempt = 0; attempt < 32; attempt++) {
      try {
        return await withLockedTransaction(CLASS_LOCK, async (client) => {
          const rows = (await client.query(
            "select payload from classes where id = $1 and archived_at is null for update",
            [id],
          )).rows as Row[];
          if (!rows.length) return null;
          const cls = (rows[0].payload as ClassRoster) ?? null;
          if (!cls) return null;
          const code = randomJoinCode();
          if (await codeInUseIn(client, code, id)) throw new Error("join_code_collision");
          const now = Date.now();
          cls.joinCode = code;
          cls.joinCodeCreatedAt = now;
          cls.joinCodeExpiresAt = now + ttlMs;
          delete cls.joinCodeRevokedAt;
          await writeClassIn(client, cls);
          return cls;
        });
      } catch (e) {
        const pgCode = (e as { code?: string }).code;
        if ((e as Error).message === "join_code_collision" || pgCode === "23505") continue;
        throw e;
      }
    }
    throw new Error("no free join code after 32 attempts — the code space is exhausted, not unlucky");
  },

  async reconcileClassIdentities() {
    return withLockedTransaction(CLASS_LOCK, async (client) => {
      const rosters = await classesIn(client);
      const needsRepair = rosters.some((cls) =>
        Object.keys(cls.students ?? {}).some((handle) => !cls.membersById?.[handle])
        || (cls.members ?? []).some((id) => !Object.values(cls.membersById ?? {}).includes(id)),
      );
      if (!needsRepair) return { classes: rosters.length, repaired: 0 };
      // The states are read INSIDE the same transaction: matching a handle to a
      // learner must not be decided against a store that changed underneath it.
      const rows = (await client.query("select payload, null as model from profiles")).rows as Row[];
      const states: ProfileState[] = [];
      for (const row of rows) {
        const state = stateFromRows(row.payload, null);
        if (state) states.push(state);
      }
      let repaired = 0;
      for (const cls of rosters) {
        if (bindLegacyHandles(cls, states)) {
          await writeClassIn(client, cls);
          repaired++;
        }
      }
      return { classes: rosters.length, repaired };
    });
  },

  // ── Rooms ─────────────────────────────────────────────────────────────────
  async listRooms() {
    const rows = await q("select payload from rooms where closed_at is null order by created_at desc limit 100");
    return rows.map((row) => row.payload as StudyRoom).filter(Boolean);
  },

  async getRoom(id) {
    const rows = await q("select payload from rooms where id = $1 and closed_at is null", [id]);
    return rows.length ? ((rows[0].payload as StudyRoom) ?? null) : null;
  },

  async saveRoom(room) {
    assertWritable("learner-record", "a room");
    await q(
      `insert into rooms (id, owner_id, created_at, payload)
       values ($1,$2, to_timestamp($3 / 1000.0), $4)
       on conflict (id) do update set payload = excluded.payload`,
      [room.id, room.createdBy || "anonymous", room.createdAt ?? Date.now(), JSON.stringify(room)],
    );
  },

  async updateRoomById(id, fn) {
    assertWritable("learner-record", "a room");
    return withLockedTransaction(`room:${id}`, async (client) => {
      const rows = (await client.query(
        "select payload from rooms where id = $1 and closed_at is null for update",
        [id],
      )).rows as Row[];
      if (!rows.length) return null;
      const room = rows[0].payload as StudyRoom;
      const result = await fn(room);
      await client.query("update rooms set payload = $2 where id = $1", [id, JSON.stringify(room)]);
      return { room, result };
    });
  },

  // ── Community packs ───────────────────────────────────────────────────────
  async listPacks(conceptId) {
    const rows = await q(
      `select payload from packs where payload->>'conceptId' = $1
        order by (payload->>'helpful')::int desc nulls last, created_at desc`,
      [conceptId],
    );
    return rows.map((row) => row.payload as StudyPack).filter(Boolean);
  },

  async savePack(pack) {
    assertWritable("learner-record", "a study pack");
    // THE AUTHOR IS A HANDLE, AND THE COLUMN DEMANDS AN ID. `packs.learner_id`
    // carries a CHECK (`^[A-Za-z0-9_-]{3,64}$`) because it names a row, but a
    // `StudyPack`'s only author field is the display handle a learner typed —
    // "Smoke Learner" is a legal handle and an illegal id, so writing it raw made
    // every pack created from a real profile fail with a check violation that the
    // route then reported as `bad request`. Measured through the route, not the
    // backend (the conformance fixture's author happened to be id-shaped).
    // The author is recorded verbatim in the payload; this column only needs a
    // stable, legal key, so it is the same handle with every other character
    // replaced — deterministic, and readable beside the row it labels.
    const authorKey = (pack.author ?? "")
      .replace(/[^A-Za-z0-9_-]/g, "_")
      .slice(0, 64);
    await q(
      `insert into packs (id, learner_id, created_at, payload)
       values ($1,$2, to_timestamp($3 / 1000.0), $4)
       on conflict (id) do update set payload = excluded.payload`,
      [pack.id, authorKey.length >= 3 ? authorKey : "anonymous", pack.createdAt ?? Date.now(), JSON.stringify(pack)],
    );
  },

  async readAllPacks() {
    const rows = await q("select payload from packs");
    return rows.map((row) => row.payload as StudyPack).filter(Boolean);
  },

  // ── Content reviews (append-only) ─────────────────────────────────────────
  async listContentReviews() {
    const rows = await q("select payload from content_reviews order by created_at_ms asc");
    return rows.map((row) => row.payload as ContentReviewRecord).filter(Boolean);
  },

  async appendContentReview(record) {
    assertWritable("learner-record", "a content review");
    await q(
      `insert into content_reviews (id, fingerprint, account_id, reviewer_name, reviewer_role, created_at_ms, payload)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (id) do nothing`,
      [
        record.id,
        record.fingerprint ?? "",
        record.reviewer?.accountId ?? "",
        record.reviewer?.name ?? "",
        record.reviewer?.role ?? "",
        record.createdAt ?? Date.now(),
        JSON.stringify(record),
      ],
    );
  },

  // ── Authored-lesson reviews and their improvement queue ───────────────────
  async listLessonReviews() {
    const rows = await q("select payload from lesson_reviews order by created_at_ms asc, id asc");
    return rows.map((row) => row.payload as EducatorReviewRecord).filter(Boolean);
  },

  async appendLessonReview(record, tasks) {
    assertWritable("learner-record", "a lesson review");
    await withLockedTransaction(`lesson-review:${record.id}`, async (client) => {
      const existing = (await client.query("select 1 from lesson_reviews where id = $1", [record.id])).rows as Row[];
      if (existing.length) throw new Error(`lesson review ${record.id} already exists`);
      await client.query(
        `insert into lesson_reviews (id, subject, curriculum_ref, level, account_id, reviewed_at, created_at_ms, payload)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          record.id,
          record.subject ?? "",
          record.curriculum?.reference ?? "",
          record.curriculum?.level ?? "",
          record.reviewer?.accountId ?? "",
          record.reviewedAt ?? "",
          record.createdAt ?? Date.now(),
          JSON.stringify(record),
        ],
      );
      // The review and the tasks it produced are ONE unit: a review whose
      // findings never became tasks is a record a school cannot act on.
      for (const task of tasks) {
        await client.query(
          `insert into lesson_improvement_tasks (
             id, review_id, lesson_id, content_hash, finding_id, severity, blocking,
             status, created_at_ms, updated_at_ms, payload
           ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           on conflict (id) do nothing`,
          [
            task.id,
            task.reviewId ?? record.id,
            task.lessonId ?? "",
            task.contentHash ?? "",
            task.findingId ?? "",
            task.severity ?? "medium",
            Boolean(task.blocking),
            task.status ?? "open",
            task.createdAt ?? Date.now(),
            task.updatedAt ?? Date.now(),
            JSON.stringify(task),
          ],
        );
      }
    });
  },

  async listLessonImprovementTasks() {
    const rows = await q("select payload from lesson_improvement_tasks order by created_at_ms asc, id asc");
    return rows.map((row) => row.payload as ImprovementTask).filter(Boolean);
  },

  async updateLessonImprovementTask(id, patch) {
    assertWritable("learner-record", "an improvement task");
    return withLockedTransaction(`lesson-task:${id}`, async (client) => {
      const rows = (await client.query("select payload from lesson_improvement_tasks where id = $1 for update", [id])).rows as Row[];
      if (!rows.length) return null;
      const current = rows[0].payload as ImprovementTask;
      const next: ImprovementTask = {
        ...current,
        status: patch.status,
        resolution: patch.resolution ?? current.resolution,
        updatedAt: Date.now(),
      };
      await client.query(
        `update lesson_improvement_tasks set status = $2, updated_at_ms = $3, payload = $4 where id = $1`,
        [id, next.status, next.updatedAt, JSON.stringify(next)],
      );
      return next;
    });
  },

  // ── Papers: the answer key stays server-side ──────────────────────────────
  async saveStoredPaper(key) {
    assertWritable("learner-record", "an answer key");
    await q(
      `insert into papers (id, owner_id, created_at, payload)
       values ($1,$2, to_timestamp($3 / 1000.0), $4)
       on conflict (id) do update set payload = excluded.payload`,
      [key.id, null, key.createdAt ?? Date.now(), JSON.stringify(key)],
    );
  },

  async getStoredPaper(id) {
    const rows = await q("select payload from papers where id = $1", [id]);
    return rows.length ? ((rows[0].payload as BuiltPaperAnswerKey) ?? null) : null;
  },

  // ── Personal papers: owner-scoped on READ, not just on write ──────────────
  async savePersonalPaper(paper) {
    assertWritable("learner-record", "a personal paper");
    await q(
      `insert into personal_papers (id, owner_id, created_at, payload)
       values ($1,$2, to_timestamp($3 / 1000.0), $4)
       on conflict (id) do update set payload = excluded.payload`,
      [paper.id, paper.owner, paper.createdAt ?? Date.now(), JSON.stringify(paper)],
    );
  },

  async getPersonalPaper(id, owner) {
    const rows = await q("select payload from personal_papers where id = $1 and owner_id = $2", [id, owner]);
    return rows.length ? ((rows[0].payload as PersonalPaper) ?? null) : null;
  },

  async listPersonalPapers(owner) {
    const rows = await q(
      "select payload from personal_papers where owner_id = $1 order by created_at desc",
      [owner],
    );
    return rows.map((row) => row.payload as PersonalPaper).filter(Boolean);
  },

  // ── The AI result cache: disposable by design ─────────────────────────────
  async cacheGet(key) {
    const rows = await q("select value from ai_cache where key = $1", [key]);
    if (!rows.length) return null;
    // Touched so a sweep can drop the coldest entries; a failure here must not
    // fail the read, because the cache is never the answer that matters.
    void q("update ai_cache set accessed_at = now() where key = $1", [key]).catch(() => {});
    return rows[0].value ?? null;
  },

  async cacheSet(key, value) {
    // A refusal must never fail the request that produced the value: a lost
    // entry costs one model call, and nothing a learner was promised rests on it.
    try {
      assertWritable("learner-record", "the AI cache");
      await q(
        `insert into ai_cache (key, value, created_at, accessed_at) values ($1,$2, now(), now())
         on conflict (key) do update set value = excluded.value, accessed_at = now()`,
        [key, JSON.stringify(value ?? null)],
      );
    } catch (e) {
      if ((e as { name?: string }).name === "StoreWriteBlockedError") return;
      throw e;
    }
  },
};
