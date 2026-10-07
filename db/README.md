# `db/` — the schema and its migrations

The application's store is a directory of JSON/JSONL files
(`lib/server/store.ts`), and these migrations are the shape it moves **to**. See
`docs/DEPLOYMENT.md` §5 for exactly what exists and what does not: the schema and
the migration machinery are real and exercised, and the routes do not read these
tables yet.

## Adding a migration

```
db/migrations/0004_what_it_does.up.sql
db/migrations/0004_what_it_does.down.sql
```

```bash
npm run db:status     # what is applied, what is pending, and whether history DRIFTED
npm run db:migrate    # up, in order
npm run db:verify     # the ledger's invariants, executed, inside a rolled-back transaction
npm run db:rehearse   # up → verify → all the way down → up  (a scratch database only)
npm run db:down       # revert the last migration (refused in production without --force)
```

## Rehearsing it on a scratch database (what CI does, done locally)

`npm run db:rehearse` needs a database it may destroy, so it must never be
pointed at one holding a learner's record. A throwaway cluster is four commands
and touches nothing on the machine that already runs PostgreSQL:

```bash
export PATH="$(brew --prefix postgresql@15)/bin:$PATH"
export LC_ALL=C                      # see the note below — this is not optional on macOS
initdb -D /tmp/om-pg/data -U openmind --auth=trust
pg_ctl -D /tmp/om-pg/data -o "-p 55432 -k /tmp/om-pg -c listen_addresses=127.0.0.1" -l /tmp/om-pg/server.log start
createdb -h 127.0.0.1 -p 55432 -U openmind openmind_rehearse

export DATABASE_URL="postgres://openmind@127.0.0.1:55432/openmind_rehearse"
npm run db:status && npm run db:rehearse && npm run db:verify
pg_ctl -D /tmp/om-pg/data stop      # when you are done
```

**`LC_ALL` IS LOAD-BEARING, and the failure it prevents is unhelpful.** Without a
valid locale the postmaster aborts during startup with
`FATAL: postmaster became multithreaded during startup` — a message that names
nothing about the environment and reads like a corrupted data directory. It is a
macOS/locale interaction, and `LC_ALL=C` is the whole fix.

`production-check` also has a database branch, and it is worth running once
against this cluster: with `DATABASE_URL` set it reads the schema's status (and
FAILS on pending or drifted migrations rather than passing quietly) and then
executes `db:verify`'s invariants — append-only, idempotent re-send, erasure —
against the real database. Without `DATABASE_URL` the same step is reported as a
skip with its reason, never as a pass.

## The rules, and why the runner enforces each one

1. **Every migration is PAIRED.** A `.up.sql` with no `.down.sql` is not a
   migration, it is a one-way door, and the runner refuses the whole set — before
   applying anything — if one is missing.

2. **A migration runs inside ONE transaction.** A migration that fails halfway
   rolls back completely, so you are never reasoning about a half-applied schema.
   **This is why no migration may use a statement PostgreSQL cannot run in a
   transaction** — no `CREATE INDEX CONCURRENTLY`, no `VACUUM`, no
   `ALTER TYPE … ADD VALUE` on an older server. The atomicity is worth more than
   the lock. If a genuinely concurrent operation is ever required, it goes in its
   own documented, one-way step with a recovery note, not in this directory.

3. **An APPLIED migration is never edited.** The runner checksums both directions
   of every applied migration against the files and refuses to apply anything on
   top of a mismatch, naming the file. Editing an applied migration is how
   staging and production silently stop being the same database. Change the
   schema with a **new** migration.

4. **`down` reverses what `up` did, completely.** `db:rehearse` runs every
   migration down and asserts the tables are gone and the ledger is empty, so
   "reversible" is a demonstrated fact. A down that leaves an object behind fails
   the rehearsal rather than being discovered during an incident.

5. **Reversal is not a rollback strategy on its own.** `down` refuses to run in
   production without `--force`, because the recovery path for production is the
   backup taken before the release (`docs/OPERATIONS.md` §4), not a schema
   reversal performed under pressure.

## The one rule the SCHEMA enforces, not the runner

`evidence_events` is **append-only**: PostgreSQL triggers refuse `UPDATE` and
`TRUNCATE` (see `0002_evidence_indexes.up.sql`, and `npm run db:verify`, which
executes those refusals). `DELETE` is deliberately allowed, because a learner's
right to erasure is implemented by removing their record and a guard that also
blocked erasure would turn a legal obligation into a database error.

The learner model is projected *from* this log, not stored as the truth beside it
(`learner_projections` is rebuildable by replaying the ledger), which is why an
in-place edit is a change to the past that produced the present. Correcting an
event means **appending a correcting event**.
