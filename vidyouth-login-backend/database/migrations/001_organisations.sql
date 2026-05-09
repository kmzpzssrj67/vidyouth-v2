-- 001_organisations.sql
-- Organisations are the multi-tenant boundary: vendors, schools, corporate
-- partners. A user belongs to at most one (student users belong to none).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS organisations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            CITEXT NOT NULL UNIQUE,
  name            TEXT   NOT NULL,
  kind            TEXT   NOT NULL CHECK (kind IN ('vendor','school','corporate','partner')),
  status          TEXT   NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS organisations_status_idx ON organisations(status) WHERE deleted_at IS NULL;
