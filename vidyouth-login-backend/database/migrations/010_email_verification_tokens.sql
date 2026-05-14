-- 007_email_verification_tokens.sql
-- Email verification tokens are stored hashed, single-use, and short-lived.
-- The raw token is only ever sent to the user through the email provider.

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_ip  INET,
  user_agent    TEXT
);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_active_idx
  ON email_verification_tokens(user_id, created_at DESC)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS email_verification_tokens_expires_idx
  ON email_verification_tokens(expires_at)
  WHERE consumed_at IS NULL;