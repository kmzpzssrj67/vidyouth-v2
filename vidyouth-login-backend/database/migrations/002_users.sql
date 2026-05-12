-- 002_users.sql
-- Users are addressable by EITHER email OR mobile (an Indian-market reality).
-- Both unique. Soft-delete via deleted_at; never hard-delete for audit.

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   UUID REFERENCES organisations(id) ON DELETE RESTRICT,
  role              TEXT NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student','admin','vendor','organisation','superadmin')),

  email             CITEXT UNIQUE,
  mobile            TEXT   UNIQUE,
  email_verified_at TIMESTAMPTZ,
  mobile_verified_at TIMESTAMPTZ,

  -- bcrypt(password + server-side pepper). NULL allowed for OTP-only accounts.
  password_hash     TEXT,
  password_changed_at TIMESTAMPTZ,

  display_name      TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  CHECK (email IS NOT NULL OR mobile IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS users_email_active_idx
  ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS users_mobile_active_idx
  ON users(mobile) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS users_org_role_idx
  ON users(organisation_id, role) WHERE deleted_at IS NULL;
