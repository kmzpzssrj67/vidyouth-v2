-- 005_audit_events.sql
-- General-purpose audit log. The app writes here synchronously; a downstream
-- exporter ships rows to S3 + Object Lock for tamper-evident long-term
-- retention (see infra/observability module).

CREATE TABLE IF NOT EXISTS audit_events (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  ip              INET,
  user_agent      TEXT,
  meta            JSONB,                        -- free-form context, indexed below
  succeeded       BOOLEAN NOT NULL,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_events_user_time_idx
  ON audit_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_action_time_idx
  ON audit_events(action, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_meta_gin_idx
  ON audit_events USING GIN (meta);
