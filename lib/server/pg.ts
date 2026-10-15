// ─────────────────────────────────────────────────────────────────────────────
// THE DATABASE CONNECTION — one owner, one pool, and one honest answer to "is it
// actually there?".
//
// WHY THIS MODULE EXISTS RATHER THAN A POOL PER CALLER. Two callers creating
// their own pool against a Neon endpoint means twice the connections and two
// different ideas of "up" — and on a host like Render's free tier, where an idle
// instance is stopped and must come back, "up" is a question asked constantly.
// So the pool, its timeouts, the advisory-lock helper and the health probe are
// all here, and `lib/server/storage-postgres.ts` is the only thing that speaks
// SQL through them.
//
// THREE RULES THIS FILE ENFORCES, each of which is a way a database deployment
// goes wrong quietly:
//
//   1. NO DATABASE_URL IS NOT "THE FILE STORE". A deployment configured for
//      Postgres without a connection string must not fall back to a directory on
//      a filesystem the host replaces — that is the silent loss this whole
//      storage line exists to prevent (docs/STORAGE_SPEC.md slice 3+4). It is
//      reported as `database_not_configured` and refused.
//   2. UNREACHABLE IS NOT EMPTY. Every failure to *reach* the database is raised
//      as `DatabaseUnavailableError`, so a route can answer 503 "not right now"
//      instead of that being indistinguishable from "no such learner" — the
//      difference between a learner retrying in ten seconds and one being told
//      their record does not exist.
//   3. TLS FOLLOWS THE URL. Neon (and every managed host) carries `sslmode=` in
//      the connection string, and node-postgres honours it. Nothing is forced
//      here, because forcing `ssl: true` on a laptop's local Postgres is how a
//      development setup stops working for no reason. One measured caveat is
//      documented in docs/DEPLOYMENT.md §5: node-postgres treats
//      `sslmode=require` as `verify-full` today, so the string Neon hands you is
//      *safer* than libpq would make it, and `channel_binding=require` (which
//      libpq understands and node-postgres ignores) is harmless.
// ─────────────────────────────────────────────────────────────────────────────
import { Pool, type PoolClient, type PoolConfig } from "pg";

/** The ONE variable that configures a database. */
export const PG_ENV = "DATABASE_URL";

/** The code every "I cannot reach the database" refusal carries. */
export const DATABASE_UNAVAILABLE = "database_unavailable";
export const DATABASE_NOT_CONFIGURED = "database_not_configured";

/**
 * The database could not be reached (as opposed to a query being wrong).
 *
 * Kept separate from a query error ON PURPOSE: a caller must be able to tell
 * "this learner's record is not there" from "I could not look", because
 * answering 404 to the second one tells a learner their history is gone when it
 * is not. Every route turns this into 503 with the code above.
 */
export class DatabaseUnavailableError extends Error {
  constructor(
    readonly code: typeof DATABASE_UNAVAILABLE | typeof DATABASE_NOT_CONFIGURED,
    readonly detail: string,
    readonly cause?: unknown,
  ) {
    super(detail);
    this.name = "DatabaseUnavailableError";
  }
}

/** The PostgreSQL error codes that mean the CONNECTION failed rather than the
 *  statement: the server is gone, shutting down, or refused us. */
const CONNECTION_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "EPIPE",
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08004", // sqlserver_rejected_establishment_of_sqlconnection
  "08P01", // protocol_violation
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
  "53300", // too_many_connections
  "XX000", // internal_error — Neon's pooler reports a lost backend here
]);

/** Is this error "the database is not there right now"? */
export function isConnectionError(e: unknown): boolean {
  const code = (e as { code?: unknown } | null)?.code;
  return typeof code === "string" && CONNECTION_CODES.has(code);
}

export function databaseUrl(env: Record<string, string | undefined> = process.env): string {
  return (env[PG_ENV] ?? "").trim().replace(/^"|"$/g, "");
}

export function databaseConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return databaseUrl(env).length > 0;
}

/**
 * The pool, created ONCE per process and on first use.
 *
 * Injectable so a test can drive a scratch database without touching
 * `process.env`, and resettable so a test that changes the connection string
 * does not inherit the previous pool.
 */
let pool: Pool | null = null;
let poolFor = "";

export function getPool(env: Record<string, string | undefined> = process.env): Pool {
  const url = databaseUrl(env);
  if (!url) {
    throw new DatabaseUnavailableError(
      DATABASE_NOT_CONFIGURED,
      `${PG_ENV} is not set, so no database connection can be made. A deployment that asks for the Postgres backend must be given one: without it there is nothing to store a learner's record in, and this build will not quietly write to the filesystem instead`,
    );
  }
  if (pool && poolFor === url) return pool;
  if (pool) {
    // A different connection string in the same process (a test, a re-probe
    // after an operator rotates the URL): the old pool is drained rather than
    // leaked, and its failure is not the caller's problem.
    void pool.end().catch(() => {});
    pool = null;
  }
  const config: PoolConfig = {
    connectionString: url,
    // A small pool: this deployment is a single web instance serving a
    // classroom, and the database's own limit is the scarce resource. Ten is
    // enough for a class answering at once and leaves room for the ops tools.
    max: Number(process.env.OPENMIND_PG_POOL_MAX ?? 10),
    // A request must never hang on a dead host: the learner sees a 503 in
    // seconds rather than a spinner that never resolves.
    connectionTimeoutMillis: Number(process.env.OPENMIND_PG_CONNECT_TIMEOUT_MS ?? 8000),
    idleTimeoutMillis: 30_000,
    // Named in `pg_stat_activity`, because the first question during an incident
    // is "which deployment opened this connection?".
    application_name: "openmind",
  };
  pool = new Pool(config);
  poolFor = url;
  // A pool-level error (a backend killed under an idle client) has no request to
  // be raised into. Swallowing it here is deliberate: the NEXT query reconnects,
  // and an unhandled 'error' event would take the whole process down — which is
  // how a database hiccup becomes a dead web service.
  pool.on("error", (e: Error) => {
    console.error(`[pg] idle client error: ${String(e.message).slice(0, 200)}`);
  });
  return pool;
}

/** Drop the pool (tests, and a clean shutdown). */
export async function endPool(): Promise<void> {
  const open = pool;
  pool = null;
  poolFor = "";
  if (open) await open.end().catch(() => {});
}

export interface DatabaseHealth {
  configured: boolean;
  reachable: boolean;
  /** The reason, when it is not reachable — a code and a short sentence. */
  error: string | null;
  latencyMs: number | null;
  serverVersion: string | null;
  /** How far the SCHEMA has got: the highest applied migration version, or null
   *  when the migrations table is absent. A reachable database with an empty
   *  schema is not a prepared deployment, and the difference matters before a
   *  learner's first answer. */
  schemaVersion: string | null;
}

let healthCache: { at: number; value: DatabaseHealth } | null = null;
const HEALTH_TTL_MS = 5_000;

/**
 * Is the database there, and how long did it take to ask?
 *
 * Memoised for a few seconds because `/api/ready` is polled by monitors and by
 * the deploy drill, and a health probe that costs a round trip per poll is a
 * self-inflicted load test on a free-tier database. Never throws: an
 * unreachable database is the ANSWER here, not an error.
 */
export async function databaseHealth(
  env: Record<string, string | undefined> = process.env,
  { fresh = false } = {},
): Promise<DatabaseHealth> {
  const now = Date.now();
  if (!fresh && healthCache && now - healthCache.at < HEALTH_TTL_MS) return healthCache.value;
  const configured = databaseConfigured(env);
  const value: DatabaseHealth = {
    configured,
    reachable: false,
    error: configured ? null : DATABASE_NOT_CONFIGURED,
    latencyMs: null,
    serverVersion: null,
    schemaVersion: null,
  };
  if (!configured) {
    healthCache = { at: now, value };
    return value;
  }
  const started = Date.now();
  let client: PoolClient | null = null;
  try {
    client = await getPool(env).connect();
    // REACHABILITY AND PREPARATION ARE ASKED SEPARATELY, and the order matters: a
    // reachable database whose migrations have not run is a REACHABLE database, and
    // a query that named `schema_migrations` directly would throw "relation does not
    // exist" and report it as unreachable — an operator sent to debug DNS, a
    // firewall and TLS while the real answer is "run the migrations".
    const r = await client.query<{ v: string; ledger: string | null }>(
      `select current_setting('server_version') as v,
              to_regclass('public.schema_migrations')::text as ledger`,
    );
    value.reachable = true;
    value.latencyMs = Date.now() - started;
    value.serverVersion = String(r.rows[0]?.v ?? "");
    if (r.rows[0]?.ledger) {
      const s = await client.query<{ version: string | null }>(
        `select max(version) as version from schema_migrations`,
      );
      value.schemaVersion = s.rows[0]?.version ?? null;
    }
  } catch (e) {
    value.error = `${(e as { code?: string }).code ?? "error"}: ${String((e as Error).message).slice(0, 140)}`;
  } finally {
    client?.release();
  }
  healthCache = { at: now, value };
  return value;
}

/** Forget the cached health answer (a test, or a drill that must re-measure). */
export function resetDatabaseHealth(): void {
  healthCache = null;
}

/**
 * Run `fn` inside one transaction, with an ADVISORY LOCK on a key.
 *
 * The lock is the cross-process half of what `withLock` does in memory for the
 * file backend, and it is what makes two instances over one database safe: a
 * learner's read-modify-write is serialised against another process doing the
 * same, not merely against another request in the same process. It is a
 * TRANSACTION lock, so a crashed process cannot leave it held — the property an
 * in-memory lock cannot have and a lock row with a timeout would have to
 * simulate.
 */
export async function withLockedTransaction<T>(
  lockKey: string,
  fn: (client: PoolClient) => Promise<T>,
  env: Record<string, string | undefined> = process.env,
): Promise<T> {
  // `connect()` is INSIDE the try, and that is not tidiness: acquiring the
  // connection is where an unreachable host fails, and a rejection raised from
  // out here would reach the route as a raw driver error — a 500 for "the
  // database is down", which tells a learner their answer was wrong instead of
  // telling them to come back in a minute. The engines suite found this by
  // pointing the pool at a closed port.
  let client: PoolClient | null = null;
  try {
    client = await getPool(env).connect();
    await client.query("begin");
    // hashtext() is the server's own string hash: stable within a PostgreSQL
    // major version, and the value only ever has to be stable for the processes
    // running at the same time (which share a server).
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [lockKey]);
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) {
    await client?.query("rollback").catch(() => {});
    // A refusal that already carries the right code (no connection string at all)
    // is passed through untouched: rewrapping it would report a CONFIGURATION
    // problem as an outage, and send an operator to look at the network while the
    // missing variable is the whole answer.
    if (e instanceof DatabaseUnavailableError) throw e;
    if (isConnectionError(e)) {
      throw new DatabaseUnavailableError(
        DATABASE_UNAVAILABLE,
        `the database could not be reached while working on ${lockKey}: ${String((e as Error).message).slice(0, 160)}`,
        e,
      );
    }
    throw e;
  } finally {
    client?.release();
  }
}

/** Run one statement outside an explicit transaction (single-statement writes
 *  and reads). Connection failures arrive as `DatabaseUnavailableError`. */
export async function pgQuery<R extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
  env: Record<string, string | undefined> = process.env,
): Promise<R[]> {
  // Same rule as `withLockedTransaction`: acquiring the connection is inside the
  // try, so an unreachable database is the refusal a route can explain rather
  // than a raw rejection it can only crash on.
  let client: PoolClient | null = null;
  try {
    client = await getPool(env).connect();
    const r = await client.query<R>(text, params as unknown[]);
    return r.rows;
  } catch (e) {
    if (e instanceof DatabaseUnavailableError) throw e;
    if (isConnectionError(e)) {
      throw new DatabaseUnavailableError(
        DATABASE_UNAVAILABLE,
        `the database could not be reached: ${String((e as Error).message).slice(0, 160)}`,
        e,
      );
    }
    throw e;
  } finally {
    client?.release();
  }
}
