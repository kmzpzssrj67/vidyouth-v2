-- 007_user_identities.sql
-- External OAuth / OIDC identities linked to Vidyouth users.
-- Keep these separate from users so one account can later connect multiple
-- providers, for example Google and Microsoft.

CREATE TABLE IF NOT EXISTS user_identities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  provider          TEXT NOT NULL
                    CHECK (provider IN ('google','microsoft')),
  provider_subject  TEXT NOT NULL,

  email             CITEXT,
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  display_name      TEXT,
  avatar_url        TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at     TIMESTAMPTZ,

  UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS user_identities_user_idx
  ON user_identities(user_id);

CREATE INDEX IF NOT EXISTS user_identities_email_idx
  ON user_identities(email);
