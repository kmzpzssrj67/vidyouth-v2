-- 003_sessions.sql
-- One row per logical session. Refresh tokens carry sid; revoking the row
-- here (revoked_at IS NOT NULL) takes the access token out of circulation
-- on its next refresh, and the in-memory `sess:{userId}` Redis set is the
-- short-circuit for the live access path.

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY,                       -- supplied by app (matches JWT sid claim)
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip              INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ,
  revoked_reason  TEXT
);

CREATE INDEX IF NOT EXISTS sessions_user_active_idx
  ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS sessions_created_idx
  ON sessions(created_at DESC);
