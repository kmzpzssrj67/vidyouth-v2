-- 004_login_attempts.sql
-- Long-term log of every login attempt (success or failure). Used for
-- forensic / fraud queries. The hot-path failed-counter and lockout flags
-- live in Redis (see services/lockout.ts) — this table is the cold trail.

CREATE TABLE IF NOT EXISTS login_attempts (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  identifier    TEXT NOT NULL,                -- raw email or mobile submitted
  channel       TEXT NOT NULL CHECK (channel IN ('password','otp_sms','otp_email','refresh','sso')),
  succeeded     BOOLEAN NOT NULL,
  reason        TEXT,                         -- nullable: 'invalid_password', 'account_locked', etc.
  ip            INET,
  user_agent    TEXT,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_attempts_user_time_idx
  ON login_attempts(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_failed_idx
  ON login_attempts(identifier, attempted_at DESC) WHERE succeeded = FALSE;
