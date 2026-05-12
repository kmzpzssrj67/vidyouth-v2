-- 006_otp_challenges.sql
-- Long-term OTP record (not the live code; that lives in Redis with a TTL).
-- Stored here so we can audit OTP issuance velocity and detect abuse.

CREATE TABLE IF NOT EXISTS otp_challenges (
  id           BIGSERIAL PRIMARY KEY,
  channel      TEXT NOT NULL CHECK (channel IN ('sms','email')),
  identifier   TEXT NOT NULL,                  -- email or mobile, lower-cased
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'issued'
                CHECK (status IN ('issued','verified','expired','consumed','rate_limited')),
  ip           INET,
  user_agent   TEXT,
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS otp_challenges_identifier_time_idx
  ON otp_challenges(identifier, issued_at DESC);
CREATE INDEX IF NOT EXISTS otp_challenges_user_time_idx
  ON otp_challenges(user_id, issued_at DESC);
