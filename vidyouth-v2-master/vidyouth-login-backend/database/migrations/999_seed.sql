-- 999_seed.sql — runs only in dev (mounted into postgres at startup).
-- Production runs migrations 001-006 only. Seed data is gated by an env-aware
-- comment marker in the docker-compose definition; the file itself is harmless
-- to omit.

-- Sample organisation
INSERT INTO organisations (slug, name, kind)
VALUES ('vidyouth-default', 'Vidyouth Default Org', 'corporate')
ON CONFLICT (slug) DO NOTHING;

-- Sample student user. Password is "demo1234" + the dev pepper, bcrypt'd.
-- Re-generate with:
--   node -e "require('bcrypt').hash('demo1234:dev-pepper-replace-in-prod-32chars', 12).then(console.log)"
INSERT INTO users (email, role, password_hash, display_name, email_verified_at)
VALUES (
  'demo@vidyouth.local',
  'student',
  '$2b$12$replaceWithRealHashAfterFirstBoot.dev.dev.dev.dev.dev.dev.dev',
  'Demo Student',
  NOW()
)
ON CONFLICT (email) DO NOTHING;
