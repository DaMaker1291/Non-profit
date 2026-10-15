-- ─────────────────────────────────────────────────────────────────────────────
-- 0006_learner_identity — reversal.
--
-- The precondition is real and is stated rather than hidden: re-establishing
-- `user_id` as the profile's primary key requires every profile to name a live
-- account row, so this refuses on any store holding an anonymous learner (the
-- `/solve` and `/try` wedge creates exactly that shape). That is the correct
-- behaviour of a reversal, not a limitation of it: reverting a migration that
-- made anonymous learners possible cannot keep the rows it made possible, and a
-- down file that silently deleted them would be the data loss the migration
-- exists to prevent. `npm run db:rehearse` runs it on an empty scratch database,
-- which is the one place the precondition is guaranteed.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS store_boots;

DROP INDEX IF EXISTS users_email_live_key;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_known;

ALTER TABLE users
  DROP COLUMN email,
  DROP COLUMN name,
  DROP COLUMN pass_hash,
  DROP COLUMN salt,
  DROP COLUMN role,
  DROP COLUMN session_epoch,
  DROP COLUMN profile_id,
  DROP COLUMN verified,
  DROP COLUMN last_seen_at,
  DROP COLUMN updated_at;

-- Only rows that carry a handle can satisfy the original NOT NULL. A row without
-- one is row this migration made storable, and the reversal cannot hide it.
UPDATE users SET handle = '' WHERE handle IS NULL;
ALTER TABLE users ALTER COLUMN handle SET NOT NULL;

-- The link goes back to being a required, cascading identity…
ALTER TABLE profiles DROP CONSTRAINT profiles_user_id_fkey;
ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- …and the profile loses the identity of its own.
ALTER TABLE profiles DROP CONSTRAINT profiles_pkey;
ALTER TABLE profiles DROP CONSTRAINT profiles_id_safe;
ALTER TABLE profiles ADD PRIMARY KEY (user_id);
ALTER TABLE profiles DROP COLUMN id;
