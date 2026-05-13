-- 009_phone_auth_columns.sql
-- Phone auth uses normalized E.164 numbers. Existing users may already have
-- mobile populated, so this adds phone_* columns without forcing backfill.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

UPDATE users
SET phone_number = mobile,
    phone_verified_at = mobile_verified_at
WHERE phone_number IS NULL
  AND mobile IS NOT NULL;

ALTER TABLE users
  ADD CONSTRAINT users_phone_number_e164_chk
  CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9][0-9]{7,14}$')
  NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_number_unique_idx
  ON users(phone_number)
  WHERE phone_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_phone_number_active_idx
  ON users(phone_number)
  WHERE deleted_at IS NULL;
